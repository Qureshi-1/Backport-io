import json
import secrets
import hashlib
import hmac
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text

from database import Base, SessionLocal
from models import User
from dependencies import get_current_user, get_db
from proxy import _is_url_safe

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

logger = logging.getLogger("backport")

VALID_EVENT_TYPES = {"waf_block", "rate_limit", "error_5xx", "slow_endpoint", "webhook_test"}


# ─── SQLAlchemy Models ─────────────────────────────────────────────────────────

class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    events = Column(Text, default="[]")             # JSON array of event types
    secret = Column(String, nullable=False)          # HMAC signing secret
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_triggered_at = Column(DateTime, nullable=True)


class WebhookLog(Base):
    __tablename__ = "webhook_logs"

    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, ForeignKey("webhooks.id"), nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(Text, default="{}")             # JSON string
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    url: str
    events: List[str] = Field(..., min_length=1)


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_webhook(wh: Webhook) -> dict:
    return {
        "id": wh.id,
        "user_id": wh.user_id,
        "url": wh.url,
        "events": json.loads(wh.events) if wh.events else [],
        "is_enabled": wh.is_enabled,
        "created_at": wh.created_at.isoformat() if wh.created_at else None,
        "last_triggered_at": wh.last_triggered_at.isoformat() if wh.last_triggered_at else None,
    }


def _serialize_log(log: WebhookLog) -> dict:
    return {
        "id": log.id,
        "webhook_id": log.webhook_id,
        "event_type": log.event_type,
        "payload": json.loads(log.payload) if log.payload else {},
        "status_code": log.status_code,
        "response_body": log.response_body,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


def _sign_payload(payload_str: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for the payload."""
    signature = hmac.new(
        secret.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"sha256={signature}"


# ─── Webhook Delivery (internal) ──────────────────────────────────────────────

def _deliver_webhook(webhook_id: int, url: str, secret: str, event_type: str, payload_dict: dict):
    """
    Fire-and-forget delivery of a webhook event.
    Opens its own DB session to log the result.
    Includes retry logic with exponential backoff (up to 3 retries).
    """
    db = SessionLocal()
    try:
        payload_str = json.dumps(payload_dict, default=str)
        signature = _sign_payload(payload_str, secret)

        status_code = None
        response_body = None
        success = False

        # Retry with exponential backoff: 1s, 5s, 15s
        retry_delays = [1, 5, 15]
        for attempt in range(4):  # 1 initial + 3 retries
            try:
                with httpx.Client(timeout=10) as client:
                    resp = client.post(
                        url,
                        content=payload_str,
                        headers={
                            "Content-Type": "application/json",
                            "X-Backport-Event": event_type,
                            "X-Backport-Signature": signature,
                        },
                    )
                    status_code = resp.status_code
                    response_body = resp.text[:4096] if resp.text else None
                    if status_code < 500:
                        success = True
                        break
                    # 5xx errors are retryable
                    if attempt < len(retry_delays):
                        logger.warning(f"Webhook {webhook_id} got {status_code}, retrying in {retry_delays[attempt]}s (attempt {attempt + 1})")
                        import time as _time
                        _time.sleep(retry_delays[attempt])
                        continue
            except httpx.TimeoutException:
                status_code = 504
                response_body = "Webhook delivery timed out"
                if attempt < len(retry_delays):
                    logger.warning(f"Webhook {webhook_id} timed out, retrying in {retry_delays[attempt]}s (attempt {attempt + 1})")
                    import time as _time
                    _time.sleep(retry_delays[attempt])
                    continue
            except Exception as e:
                status_code = 502
                response_body = str(e)[:4096]
                if attempt < len(retry_delays):
                    logger.warning(f"Webhook {webhook_id} error, retrying in {retry_delays[attempt]}s (attempt {attempt + 1}): {e}")
                    import time as _time
                    _time.sleep(retry_delays[attempt])
                    continue

        # Log delivery
        log_entry = WebhookLog(
            webhook_id=webhook_id,
            event_type=event_type,
            payload=payload_str,
            status_code=status_code,
            response_body=response_body,
        )
        db.add(log_entry)

        # Update last_triggered_at on the webhook
        webhook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
        if webhook:
            webhook.last_triggered_at = datetime.now(timezone.utc)
            db.add(webhook)

        db.commit()
    except Exception as e:
        logger.error(f"Webhook delivery error (webhook_id={webhook_id}): {e}")
        try:
            db.rollback()
        except Exception as e:
            logger.warning(f"Failed to rollback webhook delivery DB transaction: {e}")
    finally:
        db.close()


# ─── Trigger Webhooks (exported) ──────────────────────────────────────────────

def trigger_webhooks(db: Session, user_id: int, event_type: str, payload_dict: dict):
    """
    Find all active webhooks for the user that match the event_type
    and dispatch deliveries asynchronously.

    Designed to be called from a background task or thread.
    """
    webhooks = db.query(Webhook).filter(
        Webhook.user_id == user_id,
        Webhook.is_enabled == True,
    ).all()

    for wh in webhooks:
        try:
            events = json.loads(wh.events) if wh.events else []
        except (json.JSONDecodeError, TypeError):
            events = []

        if event_type in events:
            _deliver_webhook(wh.id, wh.url, wh.secret, event_type, payload_dict)


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("")
def create_webhook(req: WebhookCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate event types
    invalid_events = [e for e in req.events if e not in VALID_EVENT_TYPES]
    if invalid_events:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid event types: {', '.join(invalid_events)}. "
                   f"Valid types: {', '.join(sorted(VALID_EVENT_TYPES))}"
        )

    # Validate webhook URL for SSRF
    is_safe, ssrf_error = _is_url_safe(req.url)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Invalid webhook URL: {ssrf_error}")

    # Deduplicate events
    unique_events = list(dict.fromkeys(req.events))

    secret = secrets.token_urlsafe(32)

    webhook = Webhook(
        user_id=user.id,
        url=req.url,
        events=json.dumps(unique_events),
        secret=secret,
        is_enabled=True,
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)

    result = _serialize_webhook(webhook)
    result["secret"] = secret  # Only returned on creation
    return {"status": "success", "webhook": result}


@router.get("")
def list_webhooks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    webhooks = db.query(Webhook).filter(
        Webhook.user_id == user.id
    ).order_by(Webhook.created_at.desc()).all()
    return {"webhooks": [_serialize_webhook(wh) for wh in webhooks]}


@router.get("/logs")
def list_webhook_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return recent delivery logs for the current user's webhooks."""
    webhook_ids = db.query(Webhook.id).filter(Webhook.user_id == user.id).all()
    ids = [wid[0] for wid in webhook_ids]

    if not ids:
        return {"logs": []}

    logs = db.query(WebhookLog).filter(
        WebhookLog.webhook_id.in_(ids)
    ).order_by(WebhookLog.created_at.desc()).limit(100).all()

    return {"logs": [_serialize_log(log) for log in logs]}


@router.delete("/{webhook_id}")
def delete_webhook(webhook_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    webhook = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.user_id == user.id,
    ).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    db.delete(webhook)
    db.commit()
    return {"status": "success", "deleted_id": webhook_id}


@router.patch("/{webhook_id}/toggle")
def toggle_webhook(webhook_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    webhook = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.user_id == user.id,
    ).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    webhook.is_enabled = not webhook.is_enabled
    db.commit()
    db.refresh(webhook)
    return {"status": "success", "webhook": _serialize_webhook(webhook)}
