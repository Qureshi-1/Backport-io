import hmac
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from models import User, Feedback, ApiLog, ApiKey
from dependencies import get_current_admin, get_db
from pydantic import BaseModel
from config import ADMIN_SECRET
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _verify_admin_secret(input_secret: str) -> bool:
    """Timing-safe comparison for ADMIN_SECRET to prevent timing attacks."""
    if not ADMIN_SECRET:
        return False
    return hmac.compare_digest(input_secret, ADMIN_SECRET)


# ─── Pydantic Models ────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    email: str
    plan: str
    duration_days: int = 30  # How many days the plan lasts

class BootstrapReq(BaseModel):
    email: str
    secret: str

class DeleteUserReq(BaseModel):
    email: str
    secret: str

class ResendVerifyReq(BaseModel):
    email: str
    secret: str


# ─── Plan Duration Defaults ─────────────────────────────────────────────────────

PLAN_DURATION_DAYS = {
    "free": 90,        # 3 months free trial
    "plus": 30,        # 1 month
    "pro": 30,         # 1 month
    "enterprise": 365,  # 1 year
}


def _get_plan_expiry(plan: str, duration_days: int) -> datetime:
    """Calculate plan expiry date based on plan and duration."""
    now = datetime.now(timezone.utc)
    return now + timedelta(days=duration_days)


# ═══════════════════════════════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats")
def get_admin_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar()
    total_requests = db.query(func.count(ApiLog.id)).scalar()
    recent_feedbacks = db.query(func.count(Feedback.id)).filter(Feedback.status == "pending").scalar()

    # Plan distribution
    plans = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    plan_stats = {plan: count for plan, count in plans}

    # Expiring soon (within 7 days)
    now = datetime.now(timezone.utc)
    seven_days = now + timedelta(days=7)
    expiring_soon = db.query(func.count(User.id)).filter(
        User.plan_expires_at.isnot(None),
        User.plan_expires_at > now,
        User.plan_expires_at <= seven_days,
        User.plan != "free",
    ).scalar()

    # Expired plans (not free)
    expired = db.query(func.count(User.id)).filter(
        User.plan_expires_at.isnot(None),
        User.plan_expires_at < now,
        User.plan != "free",
    ).scalar()

    # Paid users
    paid_users = db.query(func.count(User.id)).filter(User.plan.in_(["plus", "pro", "enterprise"])).scalar()

    return {
        "total_users": total_users,
        "total_requests": total_requests,
        "pending_feedbacks": recent_feedbacks,
        "plan_distribution": plan_stats,
        "expiring_soon": expiring_soon or 0,
        "expired_plans": expired or 0,
        "paid_users": paid_users or 0,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# USERS — Full detail with plan tracking
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
def list_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    plan_filter: Optional[str] = Query(None, description="Filter by plan: free, plus, pro, enterprise"),
    status_filter: Optional[str] = Query(None, description="Filter by status: active, expiring, expired"),
    search: Optional[str] = Query(None, description="Search by email"),
):
    query = db.query(User).order_by(User.created_at.desc())

    if plan_filter and plan_filter in ["free", "plus", "pro", "enterprise"]:
        query = query.filter(User.plan == plan_filter)

    if search:
        # Escape SQL LIKE wildcards to prevent injection
        escaped = search.replace("%", r"\%").replace("_", r"\_")
        query = query.filter(User.email.ilike(f"%{escaped}%", escape="\\"))

    users = query.limit(200).all()
    now = datetime.now(timezone.utc)

    result = []
    for u in users:
        # Determine plan status
        plan_status = "active"
        if u.plan_expires_at:
            if u.plan_expires_at < now:
                plan_status = "expired"
            elif u.plan_expires_at <= now + timedelta(days=7):
                plan_status = "expiring_soon"

        # If status_filter is applied, skip non-matching users
        if status_filter:
            if status_filter == "active" and plan_status != "active":
                continue
            if status_filter == "expiring" and plan_status != "expiring_soon":
                continue
            if status_filter == "expired" and plan_status != "expired":
                continue

        # Count API keys for this user
        api_key_count = db.query(func.count(ApiKey.id)).filter(ApiKey.user_id == u.id).scalar() or 0

        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "plan": u.plan,
            "plan_started_at": u.plan_started_at.isoformat() if u.plan_started_at else None,
            "plan_expires_at": u.plan_expires_at.isoformat() if u.plan_expires_at else None,
            "plan_payment_id": u.plan_payment_id,
            "plan_source": u.plan_source or "none",
            "plan_status": plan_status,
            "is_admin": u.is_admin,
            "is_verified": u.is_verified,
            "api_key_count": api_key_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return result


# ═══════════════════════════════════════════════════════════════════════════════
# UPDATE USER PLAN — with dates and source tracking
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/update-plan")
def update_user_plan(data: UserUpdate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if data.plan not in ["free", "plus", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan. Must be: free, plus, pro, enterprise")

    if data.duration_days < 1 or data.duration_days > 3650:
        raise HTTPException(status_code=400, detail="Duration must be between 1 and 3650 days")

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_plan = target_user.plan
    now = datetime.now(timezone.utc)

    target_user.plan = data.plan
    target_user.plan_started_at = now
    target_user.plan_expires_at = _get_plan_expiry(data.plan, data.duration_days)
    target_user.plan_source = "admin"
    target_user.plan_payment_id = None  # Admin-assigned, no payment

    db.commit()

    return {
        "status": "success",
        "message": f"User {data.email} plan updated from {old_plan} to {data.plan}",
        "plan": data.plan,
        "plan_started_at": target_user.plan_started_at.isoformat(),
        "plan_expires_at": target_user.plan_expires_at.isoformat(),
        "duration_days": data.duration_days,
        "source": "admin",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# EXTEND PLAN — Add more days to existing plan
# ═══════════════════════════════════════════════════════════════════════════════

class ExtendPlanReq(BaseModel):
    email: str
    extra_days: int = 30

@router.post("/extend-plan")
def extend_user_plan(data: ExtendPlanReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if data.extra_days < 1 or data.extra_days > 3650:
        raise HTTPException(status_code=400, detail="Extra days must be between 1 and 3650")

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.plan == "free":
        raise HTTPException(status_code=400, detail="Cannot extend free plan. Assign a paid plan first.")

    # Extend from current expiry (or now if expired/missing)
    now = datetime.now(timezone.utc)
    base_date = target_user.plan_expires_at if target_user.plan_expires_at and target_user.plan_expires_at > now else now
    target_user.plan_expires_at = base_date + timedelta(days=data.extra_days)

    db.commit()

    return {
        "status": "success",
        "message": f"Extended {data.email}'s {target_user.plan} plan by {data.extra_days} days",
        "plan": target_user.plan,
        "new_expires_at": target_user.plan_expires_at.isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# REVOKE PLAN — Reset user to free
# ═══════════════════════════════════════════════════════════════════════════════

class RevokePlanReq(BaseModel):
    email: str

@router.post("/revoke-plan")
def revoke_user_plan(data: RevokePlanReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    old_plan = target_user.plan
    target_user.plan = "free"
    target_user.plan_started_at = None
    target_user.plan_expires_at = None
    target_user.plan_payment_id = None
    target_user.plan_source = "none"

    db.commit()

    return {
        "status": "success",
        "message": f"Revoked {old_plan} plan from {data.email}. User is now on Free plan.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# FEEDBACKS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/feedbacks")
def list_all_feedbacks(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(100).all()
    return feedbacks


# ═══════════════════════════════════════════════════════════════════════════════
# BOOTSTRAP ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/bootstrap")
def bootstrap_admin(data: BootstrapReq, db: Session = Depends(get_db)):
    if not _verify_admin_secret(data.secret):
        raise HTTPException(status_code=403, detail="Invalid secret")

    target_user = db.query(User).filter(User.email == data.email.lower()).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="No user found with that email")

    target_user.is_admin = True
    target_user.is_verified = True
    db.commit()
    return {
        "status": "success",
        "message": "User has been granted admin privileges. Please refresh your dashboard."
    }


# ═══════════════════════════════════════════════════════════════════════════════
# DELETE USER
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/delete-user")
def delete_user(data: DeleteUserReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not _verify_admin_secret(data.secret):
        raise HTTPException(status_code=403, detail="Invalid secret")

    target = db.query(User).filter(User.email == data.email.lower()).first()
    if not target:
        return {"status": "not_found", "message": "No user found with that email."}

    # Delete dependencies (ordered to respect foreign keys)
    from models import ApiKey, ApiLog, Feedback, TeamMember
    try:
        from webhooks import Webhook, WebhookLog
        db.query(WebhookLog).filter(WebhookLog.webhook_id.in_(
            db.query(Webhook.id).filter(Webhook.user_id == target.id)
        )).delete(synchronize_session=False)
        db.query(Webhook).filter(Webhook.user_id == target.id).delete()
    except ImportError:
        logger.debug("Webhooks module not available for user deletion")
    try:
        from custom_waf import CustomWafRule
        db.query(CustomWafRule).filter(CustomWafRule.user_id == target.id).delete()
    except ImportError:
        logger.debug("Custom WAF module not available for user deletion")
    try:
        from transform import TransformationRule
        db.query(TransformationRule).filter(TransformationRule.user_id == target.id).delete()
    except ImportError:
        logger.debug("Transform module not available for user deletion")
    try:
        from mock import MockEndpoint
        db.query(MockEndpoint).filter(MockEndpoint.user_id == target.id).delete()
    except ImportError:
        logger.debug("Mock module not available for user deletion")
    try:
        from endpoint_config import EndpointConfig
        db.query(EndpointConfig).filter(EndpointConfig.user_id == target.id).delete()
    except ImportError:
        logger.debug("Endpoint config module not available for user deletion")
    try:
        from models import Integration, HealthCheck, Alert
        db.query(Alert).filter(Alert.user_id == target.id).delete()
        db.query(HealthCheck).filter(HealthCheck.user_id == target.id).delete()
        db.query(Integration).filter(Integration.user_id == target.id).delete()
    except Exception as e:
        logger.warning(f"Failed to delete user-related data (integrations/health/alerts): {e}")
    db.query(ApiLog).filter(ApiLog.user_id == target.id).delete()
    db.query(ApiKey).filter(ApiKey.user_id == target.id).delete()
    db.query(Feedback).filter(Feedback.user_id == target.id).delete()
    db.query(TeamMember).filter(TeamMember.user_id == target.id).delete()
    target.current_team_id = None
    db.delete(target)
    db.commit()
    return {"status": "deleted", "message": "User and all related data deleted."}


# ═══════════════════════════════════════════════════════════════════════════════
# RESEND VERIFICATION EMAIL
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/resend-verify")
def admin_resend_verify(data: ResendVerifyReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    import secrets as _secrets

    if not _verify_admin_secret(data.secret):
        raise HTTPException(status_code=403, detail="Invalid secret")

    target = db.query(User).filter(User.email == data.email.lower()).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.is_verified:
        return {"status": "already_verified", "message": "User is already verified."}

    token = "".join(str(_secrets.randbelow(10)) for _ in range(6))
    target.email_verification_token = token
    target.email_verification_sent_at = datetime.now(timezone.utc)
    db.commit()

    from email_service import send_verification_email
    result = send_verification_email(target.email, token)
    status = "sent" if result else "failed"
    return {
        "status": status,
        "message": f"Verification email {status} to user."
    }
