from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session
from models import User, Feedback
from dependencies import get_current_user, get_current_admin, get_db
from email_service import send_feedback_notification
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

class FeedbackCreate(BaseModel):
    type: str = Field(..., max_length=50)  # "bug", "feature", "improvement", "general"
    message: str = Field(..., max_length=10000)
    rating: Optional[int] = None

class FeedbackUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|reviewed|resolved|dismissed)$")
    admin_comment: Optional[str] = None

@router.post("")
def submit_feedback(req: FeedbackCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    feedback = Feedback(
        user_id=user.id,
        user_email=user.email,
        type=req.type,
        message=req.message,
        rating=req.rating
    )
    db.add(feedback)
    db.commit()

    # Send email notification to admin (non-blocking)
    try:
        user_name = getattr(user, 'name', None) or user.email.split("@")[0]
        send_feedback_notification(
            feedback_type=req.type,
            message=req.message,
            user_email=user.email,
            user_name=user_name,
        )
    except Exception as e:
        logger.error(f"Failed to send feedback notification email: {e}")

    return {"status": "success"}

@router.get("")
def get_all_feedback(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    return feedbacks

@router.put("/{id}/status")
def update_feedback_status(id: int, req: FeedbackUpdateStatus, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    f = db.query(Feedback).filter(Feedback.id == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Feedback not found")
    f.status = req.status
    if req.admin_comment is not None:
        f.admin_comment = req.admin_comment
    db.commit()
    return {"status": "success"}
