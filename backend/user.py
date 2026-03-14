from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import User, Feedback
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/user", tags=["user"])

class SettingsUpdate(BaseModel):
    target_backend_url: str

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
        "api_key": user.api_key,
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
    return {"target_backend_url": user.target_backend_url}

@router.put("/settings")
def update_settings(data: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.target_backend_url = data.target_backend_url
    db.commit()
    return {"status": "success", "target_backend_url": user.target_backend_url}

@router.get("/feedback")
def get_user_feedback(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).filter(Feedback.user_id == user.id).order_by(Feedback.created_at.desc()).all()
    return feedbacks
