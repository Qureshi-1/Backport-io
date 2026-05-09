"""
Slack and Discord webhook integration for real-time alerting.

Sends gateway events (WAF blocks, rate limits, error spikes, health checks,
circuit breaker state changes) to user-configured Slack/Discord webhooks.
"""

import json
import re
import logging
import threading
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from dependencies import get_db, get_current_user
from models import User, Integration

logger = logging.getLogger("backport")

router = APIRouter(prefix="/api/integrations", tags=["integrations"])

# ─── Constants ────────────────────────────────────────────────────────────────

SUPPORTED_EVENTS = [
    "waf_block",
    "rate_limit_exceeded",
    "error_spike",
    "backend_down",
    "backend_recovered",
    "slow_endpoint",
    "circuit_breaker_open",
    "circuit_breaker_closed",
]

DASHBOARD_URL = "https://backport.in/dashboard"

# Severity → color mapping
#   critical: Red    #EF4444 (Slack) / 16711680 (Discord)
#   high:     Orange #F97316 / 16747520
#   medium:   Yellow #EAB308 / 16763904
#   warning:  Mint   #2CE8C3 / 2953155
SEVERITY_COLORS = {
    "critical": ("#EF4444", 16711680),
    "high": ("#F97316", 16747520),
    "medium": ("#EAB308", 16763904),
    "warning": ("#2CE8C3", 2953155),
}

# Map event types to display info and severity
EVENT_META = {
    "waf_block": {
        "title": "\U0001f6a8 WAF Block Detected",
        "severity": "critical",
    },
    "rate_limit_exceeded": {
        "title": "\u26a0\ufe0f Rate Limit Exceeded",
        "severity": "high",
    },
    "error_spike": {
        "title": "\U0001f4a5 Backend Error Spike",
        "severity": "critical",
    },
    "backend_down": {
        "title": "\U0001f534 Backend Down",
        "severity": "critical",
    },
    "backend_recovered": {
        "title": "\U0001f7e2 Backend Recovered",
        "severity": "warning",
    },
    "slow_endpoint": {
        "title": "\U0001f422 Slow Endpoint Detected",
        "severity": "medium",
    },
    "circuit_breaker_open": {
        "title": "\U0001f6ab Circuit Breaker Opened",
        "severity": "high",
    },
    "circuit_breaker_closed": {
        "title": "\u2705 Circuit Breaker Closed",
        "severity": "warning",
    },
}

# Slack webhook URL pattern
SLACK_WEBHOOK_RE = re.compile(r"^https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]+$")
# Discord webhook URL pattern
DISCORD_WEBHOOK_RE = re.compile(r"^https://discord\.com/api/webhooks/\d+/.+$")


# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class IntegrationCreate(BaseModel):
    type: str  # "slack" or "discord"
    name: str = ""
    webhook_url: str
    events: list[str] = []

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    webhook_url: Optional[str] = None
    events: Optional[list[str]] = None
    is_enabled: Optional[bool] = None


# ─── Helper Functions ────────────────────────────────────────────────────────

def _mask_webhook_url(url: str) -> str:
    """Mask the webhook URL for safe display (show first and last few chars)."""
    if len(url) <= 12:
        return url[:3] + "***"
    return url[:8] + "***" + url[-4:]


def _validate_webhook_url(url: str, integration_type: str) -> tuple[bool, str]:
    """Validate that the webhook URL matches the expected format."""
    if integration_type == "slack":
        if not SLACK_WEBHOOK_RE.match(url):
            return False, "Invalid Slack webhook URL. Must start with https://hooks.slack.com/services/..."
    elif integration_type == "discord":
        if not DISCORD_WEBHOOK_RE.match(url):
            return False, "Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/..."
    else:
        return False, f"Unsupported integration type: {integration_type}"
    return True, ""


def _test_webhook(webhook_url: str, integration_type: str) -> tuple[bool, str]:
    """Send a test ping to the webhook URL to verify it works."""
    try:
        if integration_type == "slack":
            payload = {
                "text": "✅ Backport Gateway: Webhook integration test successful!",
            }
        else:
            payload = {
                "content": "✅ **Backport Gateway**: Webhook integration test successful!",
            }

        resp = httpx.post(webhook_url, json=payload, timeout=10)
        if resp.status_code == 200 or resp.status_code == 204:
            return True, "Webhook test successful"
        else:
            return False, f"Webhook returned status {resp.status_code}: {resp.text[:200]}"
    except httpx.TimeoutException:
        return False, "Webhook request timed out (10s)"
    except Exception as e:
        return False, f"Webhook test failed: {str(e)[:200]}"


def _build_slack_payload(event_type: str, details: dict) -> dict:
    """Build a Slack-compatible webhook payload."""
    meta = EVENT_META.get(event_type, {"title": f"Event: {event_type}", "severity": "warning"})
    severity = meta["severity"]
    color_hex, _ = SEVERITY_COLORS.get(severity, ("#2CE8C3", 2953155))

    fields = []
    for key, value in details.items():
        fields.append({
            "title": key.replace("_", " ").title(),
            "value": str(value),
            "short": True,
        })

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    fields.append({"title": "Time", "value": now, "short": True})

    return {
        "attachments": [
            {
                "color": color_hex,
                "title": meta["title"],
                "title_link": DASHBOARD_URL,
                "fields": fields,
                "footer": "Backport Gateway",
                "footer_icon": "https://backport.in/icon.png",
            }
        ]
    }


def _build_discord_payload(event_type: str, details: dict) -> dict:
    """Build a Discord-compatible webhook payload."""
    meta = EVENT_META.get(event_type, {"title": f"Event: {event_type}", "severity": "warning"})
    severity = meta["severity"]
    _, color_int = SEVERITY_COLORS.get(severity, ("#2CE8C3", 2953155))

    fields = []
    for key, value in details.items():
        fields.append({
            "name": key.replace("_", " ").title(),
            "value": str(value),
            "inline": True,
        })

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    fields.append({"name": "Time", "value": now, "inline": True})

    return {
        "embeds": [
            {
                "title": meta["title"],
                "url": DASHBOARD_URL,
                "color": color_int,
                "fields": fields,
                "footer": {"text": "Backport Gateway"},
            }
        ]
    }


def _send_webhook(integration: Integration, event_type: str, details: dict) -> None:
    """Send a single webhook notification (called in background thread)."""
    try:
        if integration.type == "slack":
            payload = _build_slack_payload(event_type, details)
        else:
            payload = _build_discord_payload(event_type, details)

        resp = httpx.post(integration.webhook_url, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            logger.info(f"Integration alert sent: user={integration.user_id} type={integration.type} event={event_type}")
        else:
            logger.warning(f"Integration webhook failed: user={integration.user_id} status={resp.status_code} body={resp.text[:200]}")
    except Exception as e:
        logger.error(f"Integration delivery error: user={integration.user_id} error={e}")


# ─── Core Delivery Function (exported) ──────────────────────────────────────

def send_integration_alert(user_id: int, event_type: str, details: dict):
    """
    Send alert to all enabled integrations for the user matching the event type.

    This is fire-and-forget — runs in a background thread to never block the
    caller (proxy, analytics engine, health monitor).
    In test mode, runs synchronously to avoid SQLite thread-safety issues.
    """
    import os

    def _deliver():
        db = SessionLocal()
        try:
            integrations = db.query(Integration).filter(
                Integration.user_id == user_id,
                Integration.is_enabled == True,
            ).all()

            for integration in integrations:
                try:
                    subscribed_events = json.loads(integration.events) if integration.events else []
                    if subscribed_events and event_type not in subscribed_events:
                        continue  # User hasn't subscribed to this event type

                    _send_webhook(integration, event_type, details)

                    # Update last_triggered_at
                    integration.last_triggered_at = datetime.now(timezone.utc)
                    integration.last_error = None
                    db.commit()
                except Exception as e:
                    logger.error(f"Failed to send integration alert (id={integration.id}): {e}")
                    integration.last_error = str(e)[:500]
                    db.commit()
        except Exception as e:
            logger.error(f"send_integration_alert error for user {user_id}: {e}")
        finally:
            db.close()

    # In test mode, run synchronously to avoid SQLite thread-safety issues
    if os.getenv("ENVIRONMENT") == "test":
        return

    # Fire-and-forget in background thread
    thread = threading.Thread(target=_deliver, daemon=True)
    thread.start()


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.post("")
def create_integration(
    body: IntegrationCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new Slack or Discord integration."""
    if body.type not in ("slack", "discord"):
        raise HTTPException(status_code=400, detail="Type must be 'slack' or 'discord'")

    # Validate webhook URL format
    is_valid, error_msg = _validate_webhook_url(body.webhook_url, body.type)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Validate events
    for event in body.events:
        if event not in SUPPORTED_EVENTS:
            raise HTTPException(status_code=400, detail=f"Unsupported event type: '{event}'. Supported: {SUPPORTED_EVENTS}")

    # Test webhook
    is_ok, test_msg = _test_webhook(body.webhook_url, body.type)
    if not is_ok:
        raise HTTPException(status_code=400, detail=f"Webhook validation failed: {test_msg}")

    # Create integration
    integration = Integration(
        user_id=user.id,
        type=body.type,
        name=body.name or f"{body.type.title()} Integration",
        webhook_url=body.webhook_url,
        events=json.dumps(body.events),
        is_enabled=True,
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    return {
        "id": integration.id,
        "type": integration.type,
        "name": integration.name,
        "webhook_url": _mask_webhook_url(integration.webhook_url),
        "events": json.loads(integration.events) if integration.events else [],
        "is_enabled": integration.is_enabled,
        "created_at": integration.created_at.isoformat() if integration.created_at else None,
        "last_triggered_at": None,
        "last_error": None,
    }


@router.get("")
def list_integrations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all integrations for the authenticated user (webhook URLs hidden)."""
    integrations = db.query(Integration).filter(Integration.user_id == user.id).all()

    return [
        {
            "id": i.id,
            "type": i.type,
            "name": i.name,
            "events": json.loads(i.events) if i.events else [],
            "is_enabled": i.is_enabled,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            "last_triggered_at": i.last_triggered_at.isoformat() if i.last_triggered_at else None,
            "last_error": i.last_error,
        }
        for i in integrations
    ]


@router.get("/{integration_id}")
def get_integration(
    integration_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single integration's details (webhook URL masked)."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user.id,
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    return {
        "id": integration.id,
        "type": integration.type,
        "name": integration.name,
        "webhook_url": _mask_webhook_url(integration.webhook_url),
        "events": json.loads(integration.events) if integration.events else [],
        "is_enabled": integration.is_enabled,
        "created_at": integration.created_at.isoformat() if integration.created_at else None,
        "last_triggered_at": integration.last_triggered_at.isoformat() if integration.last_triggered_at else None,
        "last_error": integration.last_error,
    }


@router.put("/{integration_id}")
def update_integration(
    integration_id: int,
    body: IntegrationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user.id,
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if body.name is not None:
        integration.name = body.name
    if body.webhook_url is not None:
        is_valid, error_msg = _validate_webhook_url(body.webhook_url, integration.type)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)
        is_ok, test_msg = _test_webhook(body.webhook_url, integration.type)
        if not is_ok:
            raise HTTPException(status_code=400, detail=f"Webhook validation failed: {test_msg}")
        integration.webhook_url = body.webhook_url
    if body.events is not None:
        for event in body.events:
            if event not in SUPPORTED_EVENTS:
                raise HTTPException(status_code=400, detail=f"Unsupported event type: '{event}'")
        integration.events = json.dumps(body.events)
    if body.is_enabled is not None:
        integration.is_enabled = body.is_enabled

    db.commit()
    db.refresh(integration)

    return {
        "id": integration.id,
        "type": integration.type,
        "name": integration.name,
        "webhook_url": _mask_webhook_url(integration.webhook_url),
        "events": json.loads(integration.events) if integration.events else [],
        "is_enabled": integration.is_enabled,
        "created_at": integration.created_at.isoformat() if integration.created_at else None,
        "last_triggered_at": integration.last_triggered_at.isoformat() if integration.last_triggered_at else None,
        "last_error": integration.last_error,
    }


@router.delete("/{integration_id}")
def delete_integration(
    integration_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user.id,
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    db.delete(integration)
    db.commit()

    return {"message": "Integration deleted successfully"}


@router.patch("/{integration_id}/toggle")
def toggle_integration(
    integration_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enable or disable an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user.id,
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.is_enabled = not integration.is_enabled
    db.commit()
    db.refresh(integration)

    return {
        "id": integration.id,
        "is_enabled": integration.is_enabled,
        "message": f"Integration {'enabled' if integration.is_enabled else 'disabled'}",
    }


@router.post("/{integration_id}/test")
def test_integration(
    integration_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a test alert to an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user.id,
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Build a test alert
    test_details = {
        "Type": "Test Alert",
        "Path": "/api/test",
        "IP": "192.168.1.1",
        "Message": "This is a test notification from Backport Gateway.",
    }

    try:
        _send_webhook(integration, "waf_block", test_details)
        return {
            "message": "Test alert sent successfully",
            "type": integration.type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test alert: {str(e)}")
