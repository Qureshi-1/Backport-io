from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import User, Feedback, ApiKey
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/user", tags=["user"])

class SettingsUpdate(BaseModel):
    target_backend_url: str
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
    
    # Calculate stats
    total_reqs = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id).scalar() or 0
    cached_reqs = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id, ApiLog.was_cached == True).scalar() or 0
    avg_latency = db.query(func.avg(ApiLog.latency_ms)).filter(ApiLog.user_id == user.id).scalar() or 0
    threats = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user.id, ApiLog.status_code >= 400).scalar() or 0

    return {
        "id": user.id,
        "email": user.email,
        "api_keys": [{"id": k.id, "name": k.name, "key": k.key, "created_at": k.created_at} for k in user.api_keys],
        "api_key": user.api_keys[0].key if user.api_keys else None,
        "plan": user.plan,
        "target_backend_url": user.target_backend_url,
        "created_at": user.created_at,
        "is_admin": user.is_admin,
        "referral_code": getattr(user, 'referral_code', ''),
        "referrals_count": getattr(user, 'referrals_count', 0),
        "analytics": {
            "total_requests": total_reqs,
            "cache_hits": cached_reqs,
            "avg_latency": round(avg_latency, 1),
            "threats_blocked": threats
        }
    }

@router.get("/referrals")
def get_referrals(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "referral_code": user.referral_code,
        "referrals_count": user.referrals_count,
        "total_paid_referrals": getattr(user, 'total_paid_referrals', 0),
        "pending_referrals_count": getattr(user, 'pending_referrals_count', 0),
        "has_received_first_reward": getattr(user, 'has_received_first_reward', False),
        "is_referred": user.referred_by_id is not None,
        "referral_link": f"https://backport-io.vercel.app/auth/signup?ref={user.referral_code}"
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
    user.target_backend_url = data.target_backend_url
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
    # Limit check — Free: 1, Plus: 3, Pro: 10
    plan_limits = {"free": 1, "plus": 3, "pro": 10}
    max_keys = plan_limits.get(user.plan, 1)
    if len(user.api_keys) >= max_keys:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Plan limit reached. Your {user.plan.title()} plan allows up to {max_keys} API key{'s' if max_keys > 1 else ''}. Upgrade your plan for more.")
    
    try:
        new_key = ApiKey(user_id=user.id, name=data.name)
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        return {"status": "success", "key": new_key.key}
    except Exception as e:
        from fastapi import HTTPException
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create API key. Please try again.")

@router.delete("/keys/{key_id}/")
@router.delete("/keys/{key_id}")
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key_obj = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key_obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="API Key not found")
    
    if len(user.api_keys) <= 1:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot delete your only API key. Create a new one first.")
        
    db.delete(key_obj)
    db.commit()
    return {"status": "success"}

@router.get("/logs")
def get_user_logs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    logs = db.query(ApiLog).filter(ApiLog.user_id == user.id).order_by(ApiLog.created_at.desc()).limit(20).all()
    
    result = []
    for log in logs:
        if log.status_code == 403:
            action = "WAF Block"
            badge = "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        elif log.status_code == 429:
            action = "Rate Limited"
            badge = "bg-orange-500/10 text-orange-500 border border-orange-500/20"
        elif log.was_cached:
            action = "Cached"
            badge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        elif log.status_code >= 500:
            action = "Target Error"
            badge = "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        else:
            action = "Passed"
            badge = "bg-zinc-800 text-zinc-300"
            
        result.append({
            "id": log.id,
            "method": log.method,
            "path": log.path,
            "status": log.status_code,
            "time": f"{log.latency_ms}ms",
            "action": action,
            "badge": badge,
            "date": log.created_at.isoformat()
        })
    return result

@router.get("/traffic")
def get_traffic_chart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from models import ApiLog
    import datetime
    
    # We will fetch logs from the last 15 minutes and group them by minute in Python 
    # (to be compatible with both sqlite and postgres without complex sql)
    fifteen_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    logs = db.query(ApiLog).filter(
        ApiLog.user_id == user.id, 
        ApiLog.created_at >= fifteen_mins_ago
    ).all()
    
    # Initialize 15 empty buckets for the last 15 minutes
    buckets = {}
    now = datetime.datetime.utcnow().replace(second=0, microsecond=0)
    for i in range(15):
        t = now - datetime.timedelta(minutes=(14 - i))
        key = t.strftime("%I:%M %p")
        buckets[key] = 0
        
    for log in logs:
        key = log.created_at.replace(second=0, microsecond=0).strftime("%I:%M %p")
        if key in buckets:
            buckets[key] += 1
            
    # Format for Recharts
    traffic_data = [{"time": k, "requests": v} for k, v in buckets.items()]
    return {"traffic_data": traffic_data}
