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
    # Limit check
    max_keys = 3 if user.plan == "pro" else 1
    if len(user.api_keys) >= max_keys:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Plan limit reached: Max {max_keys} keys for {user.plan} plan")
    
    try:
        new_key = ApiKey(user_id=user.id, name=data.name)
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        return {"status": "success", "key": new_key.key}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/keys/{key_id}/")
@router.delete("/keys/{key_id}")
def delete_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    key_obj = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key_obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Key not found")
    
    # Don't allow deleting the last key
    if len(user.api_keys) <= 1:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot delete your only API key")
        
    db.delete(key_obj)
    db.commit()
    return {"status": "success"}
