import hmac
import json
import logging
import time as _time
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from models import User, Feedback, ApiLog, ApiKey, AuditLog, ApiEndpoint, create_audit_log
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
    duration_days: int = 30

class BootstrapReq(BaseModel):
    email: str
    secret: str

class DeleteUserReq(BaseModel):
    email: str
    secret: str

class ResendVerifyReq(BaseModel):
    email: str
    secret: str

class UserActionReq(BaseModel):
    action: str  # suspend, ban, unban, activate, make_admin, remove_admin


PLAN_DURATION_DAYS = {
    "free": 90,
    "plus": 30,
    "pro": 30,
    "enterprise": 365,
}

PLAN_PRICES_INR = {
    "free": 0,
    "plus": 499,
    "pro": 999,
    "enterprise": 4999,
}

def _get_plan_expiry(plan: str, duration_days: int) -> datetime:
    now = datetime.now(timezone.utc)
    return now + timedelta(days=duration_days)


# ═══════════════════════════════════════════════════════════════════════════════
# STATS — Enhanced
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats")
def get_admin_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(func.count(User.id)).scalar() or 0

    # Active users today (logged in today)
    active_users_today = db.query(func.count(User.id)).filter(
        User.last_login_at >= today_start
    ).scalar() or 0

    total_api_keys = db.query(func.count(ApiKey.id)).scalar() or 0

    # Total requests today (from ApiLog)
    total_requests_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start
    ).scalar() or 0

    # MRR — sum of plan prices for active paid users
    active_paid = db.query(User.plan, func.count(User.id)).filter(
        User.plan.in_(["plus", "pro", "enterprise"]),
        User.plan_expires_at > now
    ).group_by(User.plan).all()
    mrr = sum(PLAN_PRICES_INR.get(plan, 0) * count for plan, count in active_paid)

    # Plan distribution
    plans = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    plan_distribution = {plan: count for plan, count in plans}

    # WAF blocks today — try Redis first, fallback to DB
    waf_blocks_today = 0
    try:
        from cache import cache
        today_key = f"waf_blocks:{now.strftime('%Y-%m-%d')}"
        cached = cache.get(today_key)
        if cached:
            waf_blocks_today = int(cached)
        else:
            waf_blocks_today = db.query(func.count(ApiLog.id)).filter(
                ApiLog.created_at >= today_start,
                ApiLog.status_code == 403
            ).scalar() or 0
    except Exception:
        waf_blocks_today = 0

    # Error rate 24h
    requests_24h = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= now - timedelta(hours=24)
    ).scalar() or 0
    errors_24h = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code >= 400
    ).scalar() or 0
    error_rate_24h = round((errors_24h / requests_24h * 100), 2) if requests_24h > 0 else 0

    # Avg latency 24h
    avg_latency = db.query(func.avg(ApiLog.latency_ms)).filter(
        ApiLog.created_at >= now - timedelta(hours=24)
    ).scalar()
    avg_latency_ms = round(avg_latency) if avg_latency else 0

    # Users by day last 7 days
    users_by_day = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = db.query(func.count(User.id)).filter(
            User.created_at >= day,
            User.created_at < next_day
        ).scalar() or 0
        users_by_day.append({"date": day.strftime("%Y-%m-%d"), "count": count})

    # Users last month for % change
    last_month_start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0, microsecond=0)
    users_last_month = db.query(func.count(User.id)).filter(
        User.created_at >= last_month_start,
        User.created_at < now
    ).scalar() or 0
    prev_month_start = (now - timedelta(days=60)).replace(hour=0, minute=0, second=0, microsecond=0)
    users_prev_month = db.query(func.count(User.id)).filter(
        User.created_at >= prev_month_start,
        User.created_at < last_month_start
    ).scalar() or 0
    user_growth_pct = round(((users_last_month - users_prev_month) / users_prev_month * 100), 1) if users_prev_month > 0 else 0

    return {
        "total_users": total_users,
        "active_users_today": active_users_today,
        "total_api_keys": total_api_keys,
        "total_requests_today": total_requests_today,
        "mrr": mrr,
        "plan_distribution": plan_distribution,
        "waf_blocks_today": waf_blocks_today,
        "error_rate_24h": error_rate_24h,
        "avg_latency_ms": avg_latency_ms,
        "users_by_day_last_7_days": users_by_day,
        "user_growth_pct": user_growth_pct,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# USERS — Enhanced with pagination, sorting, avatar, status
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
def list_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    sort: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(User)

    if search:
        escaped = search.replace("%", r"\%").replace("_", r"\_")
        query = query.filter(
            (User.email.ilike(f"%{escaped}%", escape="\\")) |
            (User.name.ilike(f"%{escaped}%", escape="\\"))
        )

    if plan and plan in ["free", "plus", "pro", "enterprise"]:
        query = query.filter(User.plan == plan)

    # Sorting
    sort_col = getattr(User, sort, User.created_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for u in users:
        api_key_count = db.query(func.count(ApiKey.id)).filter(ApiKey.user_id == u.id).scalar() or 0

        # Determine status
        status = "active"
        if u.is_banned:
            status = "banned"
        elif not u.is_active:
            status = "suspended"

        result.append({
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "plan": u.plan,
            "plan_expiry_date": u.plan_expires_at.isoformat() if u.plan_expires_at else None,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "is_banned": u.is_banned,
            "status": status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "login_count": u.login_count or 0,
            "api_key_count": api_key_count,
        })

    return {"users": result, "total": total, "page": page, "limit": limit}


# ═══════════════════════════════════════════════════════════════════════════════
# USER ACTIONS — suspend, ban, unban, activate, make_admin, remove_admin
# ═══════════════════════════════════════════════════════════════════════════════

@router.patch("/users/{user_id}/action")
def user_action(
    user_id: int,
    req: UserActionReq,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot perform action on yourself")

    action = req.action
    if action not in ["suspend", "ban", "unban", "activate", "make_admin", "remove_admin"]:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")

    old_values = {"is_active": target.is_active, "is_banned": target.is_banned, "is_admin": target.is_admin}

    if action == "suspend":
        target.is_active = False
        target.is_banned = False
    elif action == "ban":
        target.is_active = False
        target.is_banned = True
    elif action == "unban":
        target.is_active = True
        target.is_banned = False
    elif action == "activate":
        target.is_active = True
        target.is_banned = False
    elif action == "make_admin":
        target.is_admin = True
    elif action == "remove_admin":
        target.is_admin = False

    db.commit()

    # Audit log
    try:
        admin_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        create_audit_log(
            db, user_id=admin.id, email=admin.email,
            event_type="admin_action",
            details={"action": action, "target_user_id": target.id, "target_email": target.email, "old_values": str(old_values)},
            ip_address=admin_ip,
        )
    except Exception as e:
        logger.warning(f"Audit log error: {e}")

    return {"status": "success", "message": f"Action '{action}' applied to {target.email}", "user": {
        "id": target.id,
        "email": target.email,
        "is_active": target.is_active,
        "is_banned": target.is_banned,
        "is_admin": target.is_admin,
    }}


# ═══════════════════════════════════════════════════════════════════════════════
# DELETE USER — Soft delete preferred
# ═══════════════════════════════════════════════════════════════════════════════

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Soft delete: mark as deleted/inactive
    target.is_active = False
    target.is_banned = True
    target.email = f"deleted_{target.id}_{target.email}"
    target.hashed_password = ""
    db.commit()

    # Audit log
    try:
        admin_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        create_audit_log(
            db, user_id=admin.id, email=admin.email,
            event_type="admin_action",
            details={"action": "delete_user", "target_user_id": target.id, "target_email": target.email},
            ip_address=admin_ip,
        )
    except Exception as e:
        logger.warning(f"Audit log error: {e}")

    return {"status": "success", "message": f"User {target.email} soft-deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit-logs")
def list_audit_logs(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    event_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    query = db.query(AuditLog).order_by(desc(AuditLog.created_at))

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if from_date:
        try:
            fd = datetime.fromisoformat(from_date)
            query = query.filter(AuditLog.created_at >= fd)
        except ValueError:
            pass
    if to_date:
        try:
            td = datetime.fromisoformat(to_date)
            query = query.filter(AuditLog.created_at <= td)
        except ValueError:
            pass

    total = query.count()
    logs = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for log in logs:
        entry = {
            "id": log.id,
            "user_id": log.user_id,
            "email": log.email,
            "event_type": log.event_type,
            "details": None,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        if log.details:
            try:
                entry["details"] = json.loads(log.details)
            except Exception:
                entry["details"] = log.details
        result.append(entry)

    return {"logs": result, "total": total, "page": page, "limit": limit}


# ═══════════════════════════════════════════════════════════════════════════════
# REVENUE
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/revenue")
def get_revenue(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # MRR
    active_paid = db.query(User.plan, func.count(User.id)).filter(
        User.plan.in_(["plus", "pro", "enterprise"]),
        User.plan_expires_at > now
    ).group_by(User.plan).all()
    mrr = sum(PLAN_PRICES_INR.get(plan, 0) * count for plan, count in active_paid)

    # Current month revenue (from audit_logs plan_purchase events this month)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    current_month_purchases = db.query(AuditLog).filter(
        AuditLog.event_type.in_(["plan_purchase", "plan_upgrade"]),
        AuditLog.created_at >= month_start,
    ).all()

    current_month_revenue = 0
    for log in current_month_purchases:
        try:
            details = json.loads(log.details) if log.details else {}
            current_month_revenue += details.get("amount", 0) / 100  # paise to INR
        except Exception:
            pass

    # Last month revenue
    if now.month == 1:
        last_month_start = now.replace(year=now.year - 1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        last_month_start = now.replace(month=now.month - 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_purchases = db.query(AuditLog).filter(
        AuditLog.event_type.in_(["plan_purchase", "plan_upgrade"]),
        AuditLog.created_at >= last_month_start,
        AuditLog.created_at < month_start,
    ).all()

    last_month_revenue = 0
    for log in last_month_purchases:
        try:
            details = json.loads(log.details) if log.details else {}
            last_month_revenue += details.get("amount", 0) / 100
        except Exception:
            pass

    # Revenue by plan
    revenue_by_plan = []
    for plan_name in ["plus", "pro", "enterprise"]:
        plan_users = db.query(func.count(User.id)).filter(
            User.plan == plan_name,
            User.plan_expires_at > now
        ).scalar() or 0
        amount = PLAN_PRICES_INR.get(plan_name, 0) * plan_users
        revenue_by_plan.append({"plan": plan_name, "users": plan_users, "amount": amount})

    # Daily revenue last 30 days
    daily_revenue = []
    for i in range(29, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        day_purchases = db.query(AuditLog).filter(
            AuditLog.event_type.in_(["plan_purchase", "plan_upgrade"]),
            AuditLog.created_at >= day,
            AuditLog.created_at < next_day,
        ).all()
        day_revenue = 0
        for log in day_purchases:
            try:
                details = json.loads(log.details) if log.details else {}
                day_revenue += details.get("amount", 0) / 100
            except Exception:
                pass
        daily_revenue.append({"date": day.strftime("%Y-%m-%d"), "revenue": round(day_revenue, 2)})

    return {
        "mrr": mrr,
        "current_month_revenue": round(current_month_revenue, 2),
        "last_month_revenue": round(last_month_revenue, 2),
        "revenue_by_plan": revenue_by_plan,
        "daily_revenue_last_30_days": daily_revenue,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY ENDPOINTS — Keep backward compatible
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/feedbacks")
def list_all_feedbacks(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    feedbacks = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(100).all()
    return feedbacks


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
    target_user.plan_payment_id = None

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


class ExtendPlanReq(BaseModel):
    email: str
    extra_days: int = 30

@router.post("/extend-plan")
def extend_user_plan(data: ExtendPlanReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if data.extra_days < 1 or data.extra_days > 3650:
        raise HTTPException(status_code=400, detail="Extra days must be between 1 and 3650 days")

    target_user = db.query(User).filter(User.email == data.email).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.plan == "free":
        raise HTTPException(status_code=400, detail="Cannot extend free plan. Assign a paid plan first.")

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


@router.post("/delete-user")
def delete_user_legacy(data: DeleteUserReq, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not _verify_admin_secret(data.secret):
        raise HTTPException(status_code=403, detail="Invalid secret")

    target = db.query(User).filter(User.email == data.email.lower()).first()
    if not target:
        return {"status": "not_found", "message": "No user found with that email."}

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
        logger.warning(f"Failed to delete user-related data: {e}")
    db.query(ApiLog).filter(ApiLog.user_id == target.id).delete()
    db.query(ApiKey).filter(ApiKey.user_id == target.id).delete()
    db.query(Feedback).filter(Feedback.user_id == target.id).delete()
    db.query(TeamMember).filter(TeamMember.user_id == target.id).delete()
    target.current_team_id = None
    db.delete(target)
    db.commit()
    return {"status": "deleted", "message": "User and all related data deleted."}


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
    status_val = "sent" if result else "failed"
    return {
        "status": status_val,
        "message": f"Verification email {status_val} to user."
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MONITORING — System monitoring endpoints (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/monitoring/summary")
def get_monitoring_summary(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get system monitoring summary — request counts, latency, circuit breakers."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Circuit breaker states
    try:
        import circuit_breaker as _cb
        circuit_states = _cb.get_all_circuit_states()
    except Exception:
        circuit_states = {}

    active_circuits = len(circuit_states)
    open_circuits = sum(1 for s in circuit_states.values() if s.get("state") == "OPEN")
    half_open_circuits = sum(1 for s in circuit_states.values() if s.get("state") == "HALF_OPEN")

    # Request counts today
    total_requests_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start
    ).scalar() or 0

    success_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start,
        ApiLog.status_code < 400
    ).scalar() or 0

    errors_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start,
        ApiLog.status_code >= 400
    ).scalar() or 0

    # Avg latency today
    avg_latency = db.query(func.avg(ApiLog.latency_ms)).filter(
        ApiLog.created_at >= today_start
    ).scalar()
    avg_latency_today = round(avg_latency) if avg_latency else 0

    # P95 latency (approximate: sort ascending, take 95th percentile)
    all_latencies = db.query(ApiLog.latency_ms).filter(
        ApiLog.created_at >= today_start
    ).order_by(ApiLog.latency_ms.asc()).limit(100).all()
    p95_latency = all_latencies[int(len(all_latencies) * 0.95)][0] if all_latencies and len(all_latencies) > 1 else 0

    return {
        "circuits": {
            "active": active_circuits,
            "open": open_circuits,
            "half_open": half_open_circuits,
            "closed": active_circuits - open_circuits - half_open_circuits,
            "total": active_circuits,
        },
        "requests_today": {
            "total": total_requests_today,
            "success": success_today,
            "errors": errors_today,
            "error_rate_pct": round((errors_today / total_requests_today * 100), 2) if total_requests_today > 0 else 0,
        },
        "latency_today": {
            "avg_ms": avg_latency_today,
            "p95_ms": p95_latency,
        },
        "circuit_details": circuit_states,
    }


@router.get("/monitoring/metrics")
def get_system_metrics(admin: User = Depends(get_current_admin)):
    """Get system metrics — CPU-like stats, memory usage, uptime."""
    now = _time.time()

    # Try to get process-level metrics
    import os as _os
    import sys as _sys

    try:
        import resource
        max_rss_mb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024  # macOS: bytes, Linux: KB
    except Exception:
        max_rss_mb = 0

    # Get uptime from main module
    try:
        import main as _main
        uptime_seconds = int(now - _main._START_TIME)
    except Exception:
        uptime_seconds = 0

    # Get thread count
    import threading
    active_threads = threading.active_count()

    # Get circuit breaker stats
    try:
        import circuit_breaker as _cb
        cb_states = _cb.get_all_circuit_states()
    except Exception:
        cb_states = {}

    total_cb_requests = sum(s.get("total_requests", 0) for s in cb_states.values())
    total_cb_successes = sum(s.get("success_count", 0) for s in cb_states.values())
    total_cb_failures = sum(s.get("failure_total", 0) for s in cb_states.values())

    return {
        "uptime_seconds": uptime_seconds,
        "uptime_str": f"{uptime_seconds // 3600}h {(uptime_seconds % 3600) // 60}m",
        "memory": {
            "max_rss_mb": round(max_rss_mb, 2),
        },
        "process": {
            "thread_count": active_threads,
            "python_version": _sys.version.split()[0],
        },
        "circuit_breaker": {
            "total_circuits": len(cb_states),
            "total_requests_tracked": total_cb_requests,
            "total_successes": total_cb_successes,
            "total_failures": total_cb_failures,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SECURITY — WAF & rate limiting endpoints (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/security/waf-stats")
def get_waf_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get WAF statistics — blocks by category, top blocked IPs."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total WAF blocks today (403 status)
    blocks_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start,
        ApiLog.status_code == 403
    ).scalar() or 0

    # Blocks in last 24h
    blocks_24h = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code == 403
    ).scalar() or 0

    # Top blocked IPs (last 24h)
    _bc = func.count(ApiLog.id).label("block_count")
    blocked_ips = db.query(
        ApiLog.ip_address, _bc
    ).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code == 403,
        ApiLog.ip_address.isnot(None),
    ).group_by(ApiLog.ip_address).order_by(_bc.desc()).limit(10).all()

    # Top blocked paths (last 24h)
    _bc2 = func.count(ApiLog.id).label("block_count")
    blocked_paths = db.query(
        ApiLog.path, _bc2
    ).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code == 403,
    ).group_by(ApiLog.path).order_by(_bc2.desc()).limit(10).all()

    # Blocks by hour today
    blocks_by_hour = []
    for hour in range(24):
        hour_start = today_start + timedelta(hours=hour)
        hour_end = hour_start + timedelta(hours=1)
        count = db.query(func.count(ApiLog.id)).filter(
            ApiLog.created_at >= hour_start,
            ApiLog.created_at < hour_end,
            ApiLog.status_code == 403
        ).scalar() or 0
        blocks_by_hour.append({"hour": hour, "count": count})

    return {
        "blocks_today": blocks_today,
        "blocks_24h": blocks_24h,
        "top_blocked_ips": [{"ip": ip, "count": count} for ip, count in blocked_ips],
        "top_blocked_paths": [{"path": path, "count": count} for path, count in blocked_paths],
        "blocks_by_hour_today": blocks_by_hour,
    }


@router.get("/security/rate-limits")
def get_rate_limit_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get rate limiting statistics."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total rate-limited requests (429) today
    rate_limited_today = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= today_start,
        ApiLog.status_code == 429
    ).scalar() or 0

    # Rate-limited in last 24h
    rate_limited_24h = db.query(func.count(ApiLog.id)).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code == 429
    ).scalar() or 0

    # Top rate-limited IPs
    _cnt = func.count(ApiLog.id).label("count")
    rate_limited_ips = db.query(
        ApiLog.ip_address, _cnt
    ).filter(
        ApiLog.created_at >= now - timedelta(hours=24),
        ApiLog.status_code == 429,
        ApiLog.ip_address.isnot(None),
    ).group_by(ApiLog.ip_address).order_by(_cnt.desc()).limit(10).all()

    # Get rate limiter usage info if available
    rate_limiter_info = {}
    try:
        from rate_limiter import rate_limiter
        rate_limiter_info = {"backend": type(rate_limiter._store).__name__}
    except Exception:
        pass

    return {
        "rate_limited_today": rate_limited_today,
        "rate_limited_24h": rate_limited_24h,
        "top_rate_limited_ips": [{"ip": ip, "count": count} for ip, count in rate_limited_ips],
        "rate_limiter": rate_limiter_info,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# LOGS — Live log tail endpoint (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/logs/live")
def get_live_logs(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    seconds: int = Query(60, ge=10, le=300),
):
    """Get recent API logs for live tail — last N seconds."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=seconds)

    logs = db.query(ApiLog).filter(
        ApiLog.created_at >= cutoff
    ).order_by(desc(ApiLog.created_at)).limit(200).all()

    result = []
    for log in logs:
        entry = {
            "id": log.id,
            "method": log.method,
            "path": log.path,
            "status": log.status_code,
            "latency_ms": log.latency_ms,
            "ip": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
            "was_cached": log.was_cached,
        }
        result.append(entry)

    return {"logs": result, "count": len(result), "window_seconds": seconds}


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — All registered proxy endpoints (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/endpoints")
def get_all_endpoints(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all registered proxy endpoints across all users."""
    endpoints = db.query(ApiEndpoint).order_by(desc(ApiEndpoint.total_requests)).limit(500).all()

    result = []
    for ep in endpoints:
        # Get user email
        user = db.query(User).filter(User.id == ep.user_id).first()
        result.append({
            "id": ep.id,
            "user_id": ep.user_id,
            "user_email": user.email if user else "unknown",
            "method": ep.method,
            "path": ep.path,
            "description": ep.description,
            "avg_latency_ms": ep.avg_latency_ms,
            "total_requests": ep.total_requests,
            "success_rate": ep.success_rate,
            "last_seen": ep.last_seen.isoformat() if ep.last_seen else None,
            "is_starred": ep.is_starred,
        })

    return {"endpoints": result, "total": len(result)}


# ═══════════════════════════════════════════════════════════════════════════════
# WAF RULES — Admin view of all WAF rules (Phase 3)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/waf/rules")
def get_waf_rules(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Get all WAF rules (built-in + custom) for admin view."""
    # Get built-in rules from waf_engine
    builtin_rules = []
    try:
        from waf_engine import waf_engine
        builtin_rules = waf_engine.get_builtin_rules()
    except Exception:
        pass

    # Get custom rules from waf_engine
    custom_rules = []
    try:
        from waf_engine import waf_engine
        custom_rules = waf_engine.get_custom_rules()
    except Exception:
        pass

    # Also get custom WAF rules from DB
    db_custom_rules = []
    try:
        from custom_waf import CustomWafRule
        rules = db.query(CustomWafRule).order_by(desc(CustomWafRule.hit_count)).limit(200).all()
        for rule in rules:
            user = db.query(User).filter(User.id == rule.user_id).first()
            db_custom_rules.append({
                "id": rule.id,
                "user_id": rule.user_id,
                "user_email": user.email if user else "unknown",
                "name": rule.name,
                "pattern": rule.pattern,
                "action": rule.action,
                "severity": rule.severity,
                "is_enabled": rule.is_enabled,
                "hit_count": rule.hit_count or 0,
                "created_at": rule.created_at.isoformat() if rule.created_at else None,
            })
    except Exception:
        pass

    return {
        "builtin_rules": builtin_rules,
        "engine_custom_rules": custom_rules,
        "db_custom_rules": db_custom_rules,
        "builtin_count": len(builtin_rules),
        "custom_count": len(db_custom_rules),
    }


@router.post("/waf/rules/{rule_id}/toggle")
def toggle_waf_rule_admin(rule_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Admin toggle any user's WAF rule."""
    try:
        from custom_waf import CustomWafRule
        rule = db.query(CustomWafRule).filter(CustomWafRule.id == rule_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail="WAF rule not found")

        rule.is_enabled = not rule.is_enabled
        db.commit()
        db.refresh(rule)

        # Audit log
        try:
            create_audit_log(
                db, user_id=admin.id, email=admin.email,
                event_type="admin_action",
                details={"action": "toggle_waf_rule", "rule_id": rule_id, "new_state": "enabled" if rule.is_enabled else "disabled"},
            )
        except Exception:
            pass

        return {
            "status": "success",
            "rule_id": rule_id,
            "is_enabled": rule.is_enabled,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle WAF rule: {e}")
