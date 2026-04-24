import time
import json as _json
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import User, Feedback, ApiKey
from dependencies import get_current_user, get_db, get_effective_plan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user"])

class SettingsUpdate(BaseModel):
    target_backend_url: str | None = None
    rate_limit_enabled: bool = True
    caching_enabled: bool = False
    idempotency_enabled: bool = True
    waf_enabled: bool = False

class ApiKeyCreate(BaseModel):
    name: str

@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    from sqlalchemy import func

    total_reqs = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id).scalar() or 0
    cached_reqs = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id, ApiLog.was_cached == True).scalar() or 0
    avg_latency = db.query(func.avg(ApiLog.latency_ms)).filter(ApiLog.user_id == user.id).scalar() or 0
    threats = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id, ApiLog.status_code >= 400).scalar() or 0

    # Security: explicitly list safe fields — never expose hashed_password, tokens, or legacy api_key
    return {
        "id": user.id,
        "email": user.email,
        "name": getattr(user, 'name', None),
        "avatar_url": getattr(user, 'avatar_url', None),
        "oauth_provider": getattr(user, 'oauth_provider', None),
        "api_keys": [{"id": k.id, "name": k.name, "key": k.key, "created_at": k.created_at} for k in user.api_keys],
        "api_key": user.api_keys[0].key if user.api_keys else None,
        "plan": user.plan,
        "target_backend_url": user.target_backend_url,
        "created_at": user.created_at,
        "is_admin": user.is_admin,
        "is_verified": getattr(user, 'is_verified', False),
        "analytics": {
            "total_requests": total_reqs,
            "cache_hits": cached_reqs,
            "avg_latency": round(avg_latency, 1),
            "threats_blocked": threats
        }
    }

@router.get("/settings")
def get_settings(user: User = Depends(get_current_user)):
    return {
        "target_backend_url": user.target_backend_url,
        "rate_limit_enabled": getattr(user, 'rate_limit_enabled', True),
        "caching_enabled": getattr(user, 'caching_enabled', False),
        "idempotency_enabled": getattr(user, 'idempotency_enabled', True),
        "waf_enabled": getattr(user, 'waf_enabled', False),
    }

@router.put("/settings")
def update_settings(data: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # SSRF Protection — validate target URL before saving
    from proxy import _is_url_safe
    if data.target_backend_url:
        is_safe, ssrf_error = _is_url_safe(data.target_backend_url)
        if not is_safe:
            raise HTTPException(status_code=400, detail=f"Invalid target URL: {ssrf_error}")

    user.target_backend_url = data.target_backend_url if data.target_backend_url else user.target_backend_url
    user.rate_limit_enabled = data.rate_limit_enabled
    user.caching_enabled = data.caching_enabled
    user.idempotency_enabled = data.idempotency_enabled
    user.waf_enabled = data.waf_enabled
    db.commit()
    return {"status": "success"}

@router.get("/feedback/")
@router.get("/feedback")
def get_user_feedback(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user.id).order_by(Feedback.created_at.desc()).all()
    return feedbacks

@router.get("/keys/")
@router.get("/keys")
def get_api_keys(user: User = Depends(get_current_user)):
    return [{"id": k.id, "name": k.name, "key": k.key, "created_at": k.created_at} for k in user.api_keys]

@router.post("/keys/")
@router.post("/keys")
def create_api_key(data: ApiKeyCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan_limits = {"free": 1, "plus": 3, "pro": 10, "enterprise": 50}
    max_keys = plan_limits.get(get_effective_plan(user), 2)
    if max_keys is not None and len(user.api_keys) >= max_keys:
        raise HTTPException(status_code=400, detail=f"Plan limit reached. Your {user.plan.title()} plan allows up to {max_keys} API key{'s' if max_keys > 1 else ''}. Upgrade your plan for more.")

    try:
        new_key = ApiKey(user_id=user.id, name=data.name)
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        return {"status": "success", "key": new_key.key}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create API key. Please try again.")

@router.delete("/keys/{key_id}/")
@router.delete("/keys/{key_id}")
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key_obj = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key_obj:
        raise HTTPException(status_code=404, detail="API Key not found")

    if len(user.api_keys) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete your only API key. Create a new one first.")

    db.delete(key_obj)
    db.commit()
    return {"status": "success"}

@router.get("/logs")
def get_user_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    try:
        logs = db.query(ApiLog).filter(ApiLog.user_id == user.id).order_by(ApiLog.created_at.desc()).limit(20).all()
    except Exception as e:
        print(f"⚠️ Logs query error: {e}")
        db.rollback()
        try:
            from sqlalchemy import text
            rows = db.execute(text("SELECT id, method, path, status_code, latency_ms, was_cached, created_at FROM api_logs WHERE user_id = :uid ORDER BY created_at DESC LIMIT 20"), {"uid": user.id}).fetchall()
            logs = []
            for row in rows:
                logs.append(type('Log', (), {
                    'id': row[0], 'method': row[1], 'path': row[2],
                    'status_code': row[3], 'latency_ms': row[4],
                    'was_cached': row[5], 'created_at': row[6],
                }))
        except Exception as e2:
            raise HTTPException(status_code=500, detail="Could not fetch logs")

    result = []
    for log in logs:
        if log.status_code == 403:
            action = "WAF Block"
            badge = "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        elif log.status_code == 429:
            action = "Rate Limited"
            badge = "bg-orange-500/10 text-orange-500 border border-orange-500/20"
        elif getattr(log, 'was_cached', False):
            action = "Cached"
            badge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        elif log.status_code >= 500:
            action = "Target Error"
            badge = "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        else:
            action = "Passed"
            badge = "bg-zinc-800 text-zinc-300"

        created = log.created_at
        created_str = created.isoformat() if hasattr(created, 'isoformat') else str(created)

        result.append({
            "id": log.id,
            "method": log.method,
            "path": log.path,
            "status": log.status_code,
            "time": f"{log.latency_ms}ms",
            "action": action,
            "badge": badge,
            "date": created_str
        })
    return result

@router.get("/traffic")
def get_traffic_chart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    from datetime import datetime, timedelta, timezone

    fifteen_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
    try:
        logs = db.query(ApiLog).filter(
            ApiLog.user_id == user.id,
            ApiLog.created_at >= fifteen_mins_ago
        ).all()
    except Exception as e:
        print(f"⚠️ Traffic query error: {e}")
        db.rollback()
        from sqlalchemy import text
        rows = db.execute(text("SELECT created_at FROM api_logs WHERE user_id = :uid AND created_at >= :since"), {"uid": user.id, "since": fifteen_mins_ago}).fetchall()
        logs = []
        for row in rows:
            logs.append(type('Log', (), {'created_at': row[0]}))

    buckets = {}
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    for i in range(15):
        t = now - timedelta(minutes=(14 - i))
        key = t.strftime("%I:%M %p")
        buckets[key] = 0

    for log in logs:
        key = log.created_at.replace(second=0, microsecond=0).strftime("%I:%M %p")
        if key in buckets:
            buckets[key] += 1

    traffic_data = [{"time": k, "requests": v} for k, v in buckets.items()]
    return {"traffic_data": traffic_data}

# ─── Enhanced Analytics ─────────────────────────────────────────────────────

@router.get("/analytics/stats")
def get_analytics_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from analytics import get_analytics_engine
    engine = get_analytics_engine()
    return engine.get_user_stats(db, user.id)

@router.get("/analytics/slow-endpoints")
def get_slow_endpoints(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    from sqlalchemy import func
    from datetime import datetime, timedelta, timezone

    results = db.query(
        ApiLog.method,
        ApiLog.path,
        func.avg(ApiLog.latency_ms).label('avg_latency'),
        func.max(ApiLog.latency_ms).label('max_latency'),
        func.count(ApiLog.id).label('count')
    ).filter(
        ApiLog.user_id == user.id,
        ApiLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
    ).group_by(
        ApiLog.method, ApiLog.path
    ).order_by(func.avg(ApiLog.latency_ms).desc()).limit(10).all()

    return [
        {
            "method": r.method, "path": r.path,
            "avg_latency": round(float(r.avg_latency), 1),
            "max_latency": float(r.max_latency),
            "count": r.count,
            "severity": "critical" if float(r.avg_latency) > 2000 else "high" if float(r.avg_latency) > 1000 else "warning" if float(r.avg_latency) > 500 else "normal"
        }
        for r in results
    ]

@router.get("/analytics/latency-distribution")
def get_latency_distribution(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    from datetime import datetime, timedelta, timezone

    buckets = {
        '0-50ms': 0, '50-100ms': 0, '100-250ms': 0,
        '250-500ms': 0, '500ms-1s': 0, '1s-3s': 0, '3s+': 0
    }

    logs = db.query(ApiLog.latency_ms).filter(
        ApiLog.user_id == user.id,
        ApiLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
    ).all()

    for (lat,) in logs:
        if lat < 50: buckets['0-50ms'] += 1
        elif lat < 100: buckets['50-100ms'] += 1
        elif lat < 250: buckets['100-250ms'] += 1
        elif lat < 500: buckets['250-500ms'] += 1
        elif lat < 1000: buckets['500ms-1s'] += 1
        elif lat < 3000: buckets['1s-3s'] += 1
        else: buckets['3s+'] += 1

    return buckets

@router.get("/analytics/alerts")
def get_alerts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import json as _json
    from models import Alert

    alerts = db.query(Alert).filter(
        Alert.user_id == user.id
    ).order_by(Alert.created_at.desc()).limit(20).all()

    return [
        {
            "id": a.id, "type": a.alert_type, "message": a.message,
            "severity": a.severity, "timestamp": a.created_at.isoformat() if a.created_at else "",
            "details": _json.loads(a.details) if a.details else {},
            "is_read": a.is_read
        }
        for a in alerts
    ]

@router.put("/analytics/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import Alert
    alert = db.query(Alert).filter(Alert.id == alert_id, Alert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"status": "success"}

# ─── Request Replay ────────────────────────────────────────────────────────

@router.post("/replay/{log_id}")
def replay_request(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import httpx
    import json as _json
    from models import ApiLog

    log = db.query(ApiLog).filter(ApiLog.id == log_id, ApiLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    if not user.target_backend_url:
        raise HTTPException(status_code=400, detail="Target backend URL not configured")

    # SSRF Protection — validate before replaying
    from proxy import _is_url_safe
    is_safe, ssrf_error = _is_url_safe(user.target_backend_url)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Invalid target URL: {ssrf_error}")

    target_url = user.target_backend_url.rstrip("/") + log.path

    headers = {}
    if log.request_headers:
        try:
            headers = _json.loads(log.request_headers)
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to parse request headers for replay: {e}")

    body = None
    if log.request_body and log.method in ["POST", "PUT", "PATCH"]:
        body = log.request_body.encode("utf-8", errors="replace")

    start_time = time.time()
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.request(
                method=log.method,
                url=target_url,
                headers=headers,
                content=body
            )
        latency = int((time.time() - start_time) * 1000)

        try:
            resp_body = resp.json()
        except (ValueError, TypeError):
            resp_body = resp.text[:5000]

        return {
            "status_code": resp.status_code,
            "latency_ms": latency,
            "response": resp_body,
            "original_latency_ms": log.latency_ms,
            "headers": dict(resp.headers)
        }
    except httpx.TimeoutException:
        return {"status_code": 504, "latency_ms": 0, "response": {"error": "Gateway Timeout"}, "original_latency_ms": log.latency_ms}
    except Exception as e:
        return {"status_code": 502, "latency_ms": 0, "response": {"error": "Internal error"}, "original_latency_ms": log.latency_ms}

# ─── Test Connection ────────────────────────────────────────────────────

@router.get("/test-connection")
def test_connection(user: User = Depends(get_current_user)):
    import httpx
    if not user.target_backend_url:
        raise HTTPException(status_code=400, detail="No backend URL configured")

    # SSRF Protection — validate before testing
    from proxy import _is_url_safe
    is_safe, ssrf_error = _is_url_safe(user.target_backend_url)
    if not is_safe:
        return {"success": False, "error": f"Invalid target URL: {ssrf_error}"}

    try:
        url = user.target_backend_url.rstrip("/")
        with httpx.Client(timeout=10) as client:
            resp = client.get(url)
        return {"success": True, "status_code": resp.status_code}
    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timed out (10s)"}
    except Exception:
        return {"success": False, "error": "Could not connect to target backend"}

# ─── Export Logs ────────────────────────────────────────────────────────

@router.get("/export/json")
def export_logs_json(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog

    logs = db.query(ApiLog).filter(
        ApiLog.user_id == user.id
    ).order_by(ApiLog.created_at.desc()).limit(1000).all()

    return [
        {
            "id": l.id, "method": l.method, "path": l.path,
            "status_code": l.status_code, "latency_ms": l.latency_ms,
            "was_cached": l.was_cached, "ip_address": l.ip_address,
            "query_params": l.query_params,
            "created_at": l.created_at.isoformat() if l.created_at else ""
        }
        for l in logs
    ]

@router.get("/export/csv")
def export_logs_csv(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    from fastapi.responses import StreamingResponse
    import io
    import csv as _csv

    logs = db.query(ApiLog).filter(
        ApiLog.user_id == user.id
    ).order_by(ApiLog.created_at.desc()).limit(5000).all()

    output = io.StringIO()
    writer = _csv.writer(output)
    writer.writerow(["id", "method", "path", "status_code", "latency_ms", "was_cached", "ip_address", "created_at"])
    for l in logs:
        writer.writerow([l.id, l.method, l.path, l.status_code, l.latency_ms, l.was_cached, l.ip_address or "", l.created_at])

    csv_content = output.getvalue()
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=backport_export.csv"}
    )

# ─── Request Inspector ────────────────────────────────────────────────────

@router.get("/logs/{log_id}/inspect")
def inspect_log(log_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return full request/response details for a single log entry."""
    from models import ApiLog

    log = db.query(ApiLog).filter(ApiLog.id == log_id, ApiLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    # Parse stored data
    request_headers = {}
    try:
        request_headers = _json.loads(log.request_headers) if log.request_headers else {}
    except (ValueError, TypeError):
        pass

    request_body = None
    try:
        if log.request_body:
            request_body = _json.loads(log.request_body)
    except (ValueError, TypeError) as e:
        logger.debug(f"Failed to parse request body as JSON: {e}")
        request_body = log.request_body  # Return raw if not JSON

    response_body = None
    try:
        response_body_raw = getattr(log, 'response_body', None)
        if response_body_raw:
            response_body = _json.loads(response_body_raw)
    except (ValueError, TypeError):
        if hasattr(log, 'response_body') and log.response_body:
            response_body = log.response_body

    return {
        "id": log.id,
        "method": log.method,
        "path": log.path,
        "query_params": log.query_params,
        "status_code": log.status_code,
        "latency_ms": log.latency_ms,
        "was_cached": log.was_cached,
        "ip_address": log.ip_address,
        "request_headers": request_headers,
        "request_body": request_body,
        "response_body": response_body,
        "response_size": log.response_size,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }
