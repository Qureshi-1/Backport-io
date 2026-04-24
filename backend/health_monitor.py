"""
Health Monitor for Backport API Gateway.

Periodically checks each user's target backend URL and records the results.
Provides API endpoints for current status and historical data.
"""

import time
import threading
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal, Base, engine
from models import User, HealthCheck, Alert
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/user/health", tags=["health-monitor"])

# ─── Configuration ────────────────────────────────────────────────────────────

CHECK_INTERVAL_SEC = 60       # Check each backend every 60 seconds
CHECK_TIMEOUT_SEC = 10        # Timeout per health check request
HEALTH_CHECK_PATH = "/"       # Path to probe on the backend
MAX_RESPONSE_TIME_WARN_MS = 2000  # Threshold for "slow" response warning


# ─── Background checker thread ────────────────────────────────────────────────

_health_thread: Optional[threading.Thread] = None
_health_thread_stop = threading.Event()


def _perform_health_check(user_id: int, backend_url: str) -> None:
    """Execute a single health check for one user's backend and record the result."""
    if not backend_url:
        return

    # SSRF Protection — validate target URL before making requests
    from proxy import _is_url_safe
    is_safe, safety_error = _is_url_safe(backend_url)
    if not is_safe:
        logger.warning(f"Skipping health check for user {user_id}: unsafe URL ({safety_error})")
        return

    # Build the check URL
    url = backend_url.rstrip("/") + HEALTH_CHECK_PATH

    db = SessionLocal()
    try:
        start = time.time()
        status = "down"
        response_time_ms = None
        status_code = None
        error = None

        try:
            resp = httpx.get(url, timeout=CHECK_TIMEOUT_SEC, follow_redirects=True)
            response_time_ms = int((time.time() - start) * 1000)
            status_code = resp.status_code

            if 200 <= resp.status_code < 400:
                status = "up"
            elif resp.status_code >= 500:
                status = "down"
                error = f"Backend returned HTTP {resp.status_code}"
            else:
                # 4xx responses still mean the backend is reachable
                status = "up"
        except httpx.TimeoutException:
            response_time_ms = int((time.time() - start) * 1000)
            status = "timeout"
            error = f"Health check timed out after {CHECK_TIMEOUT_SEC}s"
        except Exception as e:
            response_time_ms = int((time.time() - start) * 1000)
            status = "down"
            error = str(e)[:500]

        # Record the check
        check = HealthCheck(
            user_id=user_id,
            status=status,
            response_time_ms=response_time_ms,
            status_code=status_code,
            error=error,
            checked_at=datetime.now(timezone.utc),
        )
        db.add(check)
        db.commit()

        # Trigger circuit breaker on failure
        if status in ("down", "timeout"):
            try:
                from circuit_breaker import record_failure
                record_failure(user_id, backend_url)
            except ImportError:
                logger.debug("Circuit breaker module not available for failure recording")
        else:
            try:
                from circuit_breaker import record_success
                record_success(user_id, backend_url)
            except ImportError:
                logger.debug("Circuit breaker module not available for success recording")

        # Generate alerts on state transitions
        _check_alerts(db, user_id, status, backend_url, error, response_time_ms)

        # Broadcast health check status via WebSocket
        try:
            from ws import manager
            manager.broadcast_from_thread(user_id, {
                "type": "health_check",
                "status": status,
                "response_time_ms": response_time_ms,
                "status_code": status_code,
                "error": error,
                "backend_url": "***",
                "checked_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            logger.debug(f"WebSocket broadcast from health check failed: {e}")

    except Exception as e:
        print(f"⚠️ Health check error for user {user_id}: {e}")
    finally:
        db.close()


def _check_alerts(db: Session, user_id: int, current_status: str, backend_url: str, error: str | None = None, response_time_ms: int | None = None) -> None:
    """Create an alert if the backend has transitioned to an unhealthy state."""
    try:
        # Get the most recent check before this one
        last_check = db.query(HealthCheck).filter(
            HealthCheck.user_id == user_id,
        ).order_by(HealthCheck.checked_at.desc()).offset(1).first()

        if last_check and last_check.status == "up" and current_status in ("down", "timeout"):
            alert = Alert(
                user_id=user_id,
                alert_type="backend_down",
                message=f"Backend health check failed: {current_status.upper()}",
                severity="high",
                timestamp=datetime.now(timezone.utc),
                details='{"status": "' + current_status + '", "error": "See health check history"}',
            )
            db.add(alert)
            db.commit()

            # Send Slack/Discord integration alert (no backend URL in external messages)
            try:
                from integrations import send_integration_alert
                send_integration_alert(user_id, "backend_down", {
                    "Status": current_status.upper(),
                    "Error": error or "Unknown",
                })
            except Exception:
                pass

        # Check if backend recovered (was down, now up)
        elif last_check and last_check.status in ("down", "timeout") and current_status == "up":
            alert = Alert(
                user_id=user_id,
                alert_type="backend_recovered",
                message=f"Backend recovered: health check now passing",
                severity="warning",
                timestamp=datetime.now(timezone.utc),
                details='{"status": "recovered", "response_time_ms": ' + str(response_time_ms or 0) + '}',
            )
            db.add(alert)
            db.commit()

            # Send Slack/Discord integration alert (no backend URL in external messages)
            try:
                from integrations import send_integration_alert
                send_integration_alert(user_id, "backend_recovered", {
                    "Response Time": f"{response_time_ms}ms" if response_time_ms else "N/A",
                })
            except Exception:
                pass

        # Warn about slow responses
        elif current_status == "up":
            recent = db.query(HealthCheck).filter(
                HealthCheck.user_id == user_id,
                HealthCheck.status == "up",
                HealthCheck.response_time_ms.isnot(None),
            ).order_by(HealthCheck.checked_at.desc()).first()

            if recent and recent.response_time_ms and recent.response_time_ms > MAX_RESPONSE_TIME_WARN_MS:
                # Only alert every ~5 minutes to avoid spam
                recent_alert = db.query(Alert).filter(
                    Alert.user_id == user_id,
                    Alert.alert_type == "backend_slow",
                    Alert.timestamp > datetime.now(timezone.utc) - timedelta(minutes=5),
                ).first()
                if not recent_alert:
                    alert = Alert(
                        user_id=user_id,
                        alert_type="backend_slow",
                        message=f"Backend response time is slow: {recent.response_time_ms}ms",
                        severity="warning",
                        timestamp=datetime.now(timezone.utc),
                        details='{"response_time_ms": ' + str(recent.response_time_ms) + '}',
                    )
                    db.add(alert)
                    db.commit()
    except Exception as e:
        logger.warning(f"Alerting check failed, skipping: {e}")


def _health_check_loop() -> None:
    """Background loop that periodically checks all configured backends."""
    print("🔄 Health monitor started")
    while not _health_thread_stop.is_set():
        db = SessionLocal()
        try:
            # Get all users with a configured backend URL
            users = db.query(User).filter(
                User.target_backend_url.isnot(None),
                User.target_backend_url != "",
            ).all()

            for user in users:
                if _health_thread_stop.is_set():
                    break
                _perform_health_check(user.id, user.target_backend_url)

        except Exception as e:
            print(f"⚠️ Health monitor loop error: {e}")
        finally:
            db.close()

        # Clean up stale circuit breakers
        try:
            from circuit_breaker import cleanup_stale_circuits
            cleanup_stale_circuits()
        except ImportError:
            logger.debug("Circuit breaker cleanup module not available")

        # Wait for next interval (or stop signal)
        _health_thread_stop.wait(timeout=CHECK_INTERVAL_SEC)

    print("🔄 Health monitor stopped")


def start_health_monitor() -> None:
    """Start the health monitoring background thread (call once at startup)."""
    global _health_thread
    if _health_thread is not None and _health_thread.is_alive():
        return  # Already running

    _health_thread_stop.clear()
    _health_thread = threading.Thread(target=_health_check_loop, daemon=True, name="health-monitor")
    _health_thread.start()


def stop_health_monitor() -> None:
    """Signal the health monitoring thread to stop (call on shutdown)."""
    _health_thread_stop.set()


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.get("")
def get_current_health(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current health status of the authenticated user's backend."""
    if not user.target_backend_url:
        return {
            "status": "not_configured",
            "message": "Target backend URL is not configured.",
            "backend_url": None,
        }

    # Get the most recent health check
    latest = db.query(HealthCheck).filter(
        HealthCheck.user_id == user.id,
    ).order_by(HealthCheck.checked_at.desc()).first()

    if not latest:
        return {
            "status": "unknown",
            "message": "No health checks have been performed yet.",
            "backend_url": user.target_backend_url,
            "last_check": None,
        }

    # Calculate uptime % over the last 24 hours
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    checks_24h = db.query(HealthCheck).filter(
        HealthCheck.user_id == user.id,
        HealthCheck.checked_at >= since,
    ).all()

    total = len(checks_24h)
    up_count = sum(1 for c in checks_24h if c.status == "up")
    uptime_pct = round((up_count / total * 100), 2) if total > 0 else None

    # Calculate average response time (for successful checks)
    successful_times = [c.response_time_ms for c in checks_24h if c.status == "up" and c.response_time_ms is not None]
    avg_response_ms = round(sum(successful_times) / len(successful_times)) if successful_times else None

    # Circuit breaker state
    circuit_state = None
    try:
        from circuit_breaker import check_circuit
        circuit_state = check_circuit(user.id, user.target_backend_url)
    except ImportError:
        pass

    return {
        "status": latest.status,
        "backend_url": user.target_backend_url,
        "last_check": {
            "status": latest.status,
            "response_time_ms": latest.response_time_ms,
            "status_code": latest.status_code,
            "error": latest.error,
            "checked_at": latest.checked_at.isoformat() if latest.checked_at else None,
        },
        "uptime_24h_pct": uptime_pct,
        "avg_response_time_ms_24h": avg_response_ms,
        "total_checks_24h": total,
        "circuit_breaker_state": circuit_state,
    }


@router.get("/history")
def get_health_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get health check history for the last 24 hours."""
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    checks = db.query(HealthCheck).filter(
        HealthCheck.user_id == user.id,
        HealthCheck.checked_at >= since,
    ).order_by(HealthCheck.checked_at.desc()).limit(500).all()

    return {
        "backend_url": user.target_backend_url,
        "period": "last_24h",
        "total_checks": len(checks),
        "checks": [
            {
                "status": c.status,
                "response_time_ms": c.response_time_ms,
                "status_code": c.status_code,
                "error": c.error,
                "checked_at": c.checked_at.isoformat() if c.checked_at else None,
            }
            for c in checks
        ],
    }
