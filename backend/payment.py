from fastapi import APIRouter, Depends, HTTPException, Request
import json
import hmac
import hashlib
from pydantic import BaseModel
from sqlalchemy.orm import Session
import time
import threading
from datetime import datetime, timedelta, timezone
import razorpay
from models import User
from dependencies import get_current_user, get_db, get_effective_plan
from config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import secrets

router = APIRouter(prefix="/api/billing", tags=["billing"])

rzp_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# ─── In-memory store for pending orders (order_id → plan details) ─────────────
PLAN_PRICES = {
    "plus": 49900,   # INR 499 in paise
    "pro": 99900,    # INR 999 in paise
    "enterprise": 499900,  # INR 4999 in paise
}

_pending_orders: dict = {}  # { order_id: {"plan_id": str, "user_id": int, "amount": int, "created_at": float} }
_pending_orders_lock = threading.Lock()

# Cleanup stale orders periodically (older than 30 minutes)
_MAX_ORDER_AGE = 1800  # 30 minutes
_cleanup_timer: threading.Timer | None = None

# ─── Promo Code System ────────────────────────────────────────────────────────
# Format: { "CODE": { "discount_percent": int, "max_uses": int, "used": int, "active": bool, "description": str } }
PROMO_CODES: dict[str, dict] = {
    "BACKPORT20": {
        "discount_percent": 20,
        "max_uses": 1000,
        "used": 0,
        "active": True,
        "description": "20% off — Welcome to Backport",
        "expires_at": "2026-07-31T23:59:59Z",
    },
}
_promo_lock = threading.Lock()


def _is_promo_valid(code: str) -> tuple[bool, str, dict | None]:
    """Check if promo code exists and is valid. Returns (is_valid, error_message, promo_dict_or_None).
    Thread-safe: must be called while holding _promo_lock."""
    promo = PROMO_CODES.get(code.upper())
    if not promo:
        return False, "Invalid promo code", None
    if not promo["active"]:
        return False, "This promo code is no longer active", None
    if promo["used"] >= promo["max_uses"]:
        return False, "This promo code has reached its usage limit", None
    if promo.get("expires_at"):
        try:
            expires = datetime.fromisoformat(promo["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires:
                return False, "This promo code has expired", None
        except Exception:
            pass
    return True, "", promo


def _cleanup_stale_orders():
    """Remove orders older than _MAX_ORDER_AGE from _pending_orders."""
    now = time.time()
    with _pending_orders_lock:
        stale = [oid for oid, info in _pending_orders.items()
                 if now - info.get("created_at", 0) > _MAX_ORDER_AGE]
        for oid in stale:
            del _pending_orders[oid]


def _schedule_order_cleanup():
    """Periodically clean up stale pending orders using a threading.Timer."""
    global _cleanup_timer
    _cleanup_stale_orders()
    _cleanup_timer = threading.Timer(_MAX_ORDER_AGE, _schedule_order_cleanup)
    _cleanup_timer.daemon = True
    _cleanup_timer.start()


# Start the periodic cleanup timer at module load
_schedule_order_cleanup()

class VerifyReq(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str = "pro"

class CreateOrderReq(BaseModel):
    plan_id: str
    promo_code: str | None = None

class ValidatePromoReq(BaseModel):
    promo_code: str


@router.get("/plan")
def get_plan(user: User = Depends(get_current_user)):
    return {
        "plan": get_effective_plan(user),
        "email": user.email,
        "requests_used": getattr(user, 'requests_used', 0),
    }


@router.post("/validate-promo")
def validate_promo(req: ValidatePromoReq, user: User = Depends(get_current_user)):
    """Validate a promo code and return discount details without applying it."""
    code = req.promo_code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Please enter a promo code")

    with _promo_lock:
        is_valid, error_msg, promo = _is_promo_valid(code)
        if not is_valid:
            raise HTTPException(status_code=404, detail=error_msg)
        remaining = promo["max_uses"] - promo["used"]

    return {
        "valid": True,
        "code": code,
        "discount_percent": promo["discount_percent"],
        "description": promo["description"],
        "remaining_uses": remaining,
    }


@router.post("/create-order")
def create_order(req: CreateOrderReq, user: User = Depends(get_current_user)):
    if user.plan == req.plan_id:
        raise HTTPException(status_code=400, detail=f"Already on {req.plan_id.title()} plan")

    if req.plan_id not in ["plus", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    if not rzp_client:
        raise HTTPException(status_code=503, detail="Payment system is not available. Please try again later.")

    # ─── Calculate base amount ────────────────────────────────────────────────
    if req.plan_id == "plus":
        base_amount = 499
    elif req.plan_id == "pro":
        base_amount = 999
    elif req.plan_id == "enterprise":
        base_amount = 4999
    else:
        base_amount = 499

    # ─── Apply promo code discount (atomic: validate + increment in single lock) ─
    discount_percent = 0
    promo_code_used = None
    if req.promo_code:
        code = req.promo_code.strip().upper()
        with _promo_lock:
            is_valid, error_msg, promo = _is_promo_valid(code)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Promo code error: {error_msg}")
            discount_percent = promo["discount_percent"]
            promo["used"] += 1

        promo_code_used = code

    # Calculate final amount after discount
    discount_amount = int(base_amount * discount_percent / 100)
    final_amount = base_amount - discount_amount

    # Minimum amount must be at least ₹1 (Razorpay requirement)
    if final_amount < 1:
        final_amount = 1

    amount_paise = final_amount * 100

    try:
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"rcpt_{user.id}_{int(time.time())}",
            "notes": {
                "user_id": str(user.id),
                "plan": req.plan_id,
                "promo_code": promo_code_used or "",
                "discount_percent": discount_percent,
            }
        }

        # Apply Razorpay-level discount if promo code is used
        if promo_code_used and rzp_client:
            order_data["notes"]["promo_applied"] = "true"

        order = rzp_client.order.create(data=order_data)

        # Store order details for verification (store ORIGINAL plan price for verification)
        _cleanup_stale_orders()
        with _pending_orders_lock:
            _pending_orders[order["id"]] = {
                "plan_id": req.plan_id,
                "user_id": user.id,
                "amount": amount_paise,  # discounted amount that was actually charged
                "created_at": time.time(),
                "promo_code": promo_code_used,
                "discount_percent": discount_percent,
            }

        response = {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "discount_applied": bool(promo_code_used),
            "plan_id": req.plan_id,
        }

        if promo_code_used:
            response["discount_percent"] = discount_percent
            response["original_amount"] = base_amount * 100
            response["discount_amount"] = discount_amount * 100

        return response
    except HTTPException:
        # Re-raise HTTP exceptions (e.g., promo code limit reached)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order. Please try again.")


@router.post("/verify")
def verify_payment(req: VerifyReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate plan_id first (cheap check) before hitting external services
    if req.plan_id not in ["plus", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if not rzp_client:
        raise HTTPException(status_code=503, detail="Payment system is not available.")

    # Verify order exists in our pending store
    with _pending_orders_lock:
        order_info = _pending_orders.pop(req.razorpay_order_id, None)
    if order_info is None:
        raise HTTPException(status_code=400, detail="Order expired or not found. Please create a new order.")

    # Reject orders older than _MAX_ORDER_AGE
    order_age = time.time() - order_info.get("created_at", 0)
    if order_age > _MAX_ORDER_AGE:
        raise HTTPException(status_code=400, detail="Order has expired. Please create a new order.")

    # Verify order belongs to the authenticated user
    if order_info["user_id"] != user.id:
        raise HTTPException(status_code=400, detail="Order does not belong to this user.")

    # Verify Razorpay payment signature
    try:
        rzp_client.utility.verify_payment_signature({
            "razorpay_order_id": req.razorpay_order_id,
            "razorpay_payment_id": req.razorpay_payment_id,
            "razorpay_signature": req.razorpay_signature
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment signature. Payment verification failed.")

    # Use plan_id and amount from server-side order record — never trust client input
    plan_id = order_info["plan_id"]
    expected_amount = order_info["amount"]

    # Fetch actual payment from Razorpay to verify amount
    try:
        payment = rzp_client.payment.fetch(req.razorpay_payment_id)
        if payment.get("amount") != expected_amount:
            raise HTTPException(status_code=400, detail="Payment amount does not match the plan price.")
        if payment.get("status") != "captured":
            # Attempt capture if authorized but not captured
            try:
                rzp_client.payment.capture(req.razorpay_payment_id, expected_amount)
            except Exception:
                raise HTTPException(status_code=400, detail="Payment capture failed. Please contact support.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Could not verify payment. Please contact support.")

    previous_plan = user.plan  # capture before update
    user.plan = plan_id
    user.plan_started_at = datetime.now(timezone.utc)
    user.plan_payment_id = req.razorpay_payment_id
    user.plan_source = "payment"
    # Set expiry: monthly plans expire in 30 days
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.commit()

    # Send payment receipt email
    try:
        from email_service import send_payment_receipt_email
        send_payment_receipt_email(
            to=user.email,
            name=user.name or "",
            plan=plan_id,
            amount_inr=expected_amount,
            payment_id=req.razorpay_payment_id,
        )
    except Exception as e:
        print(f"⚠️ Payment receipt email error: {e}")

    # Track plan purchase / plan upgrade in audit logs
    try:
        from models import create_audit_log
        _event_type = "plan_upgrade" if previous_plan != "free" else "plan_purchase"
        _log_details = {"plan": plan_id, "payment_id": req.razorpay_payment_id, "amount": expected_amount}
        if _event_type == "plan_upgrade":
            _log_details["previous_plan"] = previous_plan
        create_audit_log(
            db, user_id=user.id, email=user.email,
            event_type=_event_type,
            details=_log_details,
            ip_address="payment_webhook"
        )
    except Exception as e:
        print(f"⚠️ Audit log error on payment: {e}")

    response = {
        "status": "success",
        "plan": plan_id,
        "plan_started_at": user.plan_started_at.isoformat() if user.plan_started_at else None,
        "plan_expires_at": user.plan_expires_at.isoformat() if user.plan_expires_at else None,
    }

    if order_info.get("promo_code"):
        response["promo_applied"] = order_info["promo_code"]
        response["discount_percent"] = order_info.get("discount_percent", 0)

    return response


# ─── Payment History ─────────────────────────────────────────────────────────
@router.get("/history")
def get_payment_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's payment/plan history from audit logs."""
    from models import AuditLog
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == user.id,
        AuditLog.event_type.in_(["plan_purchase", "plan_upgrade", "plan_cancel", "plan_expire"]),
    ).order_by(AuditLog.created_at.desc()).limit(20).all()

    history = []
    for log in logs:
        details = {}
        try:
            details = json.loads(log.details) if log.details else {}
        except Exception:
            pass
        history.append({
            "event": log.event_type,
            "plan": details.get("plan", ""),
            "amount": details.get("amount", 0),
            "payment_id": details.get("payment_id", ""),
            "previous_plan": details.get("previous_plan"),
            "date": log.created_at.isoformat() if log.created_at else None,
        })

    return {"history": history}


# ─── Razorpay Webhook Handler ────────────────────────────────────────────────
@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhook events for server-side payment confirmation."""
    if not rzp_client:
        raise HTTPException(status_code=503, detail="Payment system not available")

    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    # Verify webhook signature
    expected_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("event", "")
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    payment_id = payment_entity.get("id", "")
    order_id = payment_entity.get("order_id", "")
    payment_status = payment_entity.get("status", "")
    amount = payment_entity.get("amount", 0)
    notes = payment_entity.get("notes", {})
    user_email = notes.get("email", "")

    print(f"📩 Razorpay webhook: {event_type} | payment={payment_id} | status={payment_status}")

    if event_type == "payment.captured" and payment_status == "captured":
        # Find user by order notes or payment_id
        user = None
        if notes.get("user_id"):
            user = db.query(User).filter(User.id == int(notes["user_id"])).first()
        if not user and user_email:
            user = db.query(User).filter(User.email == user_email).first()
        if not user:
            # Try finding by payment_id
            user = db.query(User).filter(User.plan_payment_id == payment_id).first()

        if user:
            plan_id = notes.get("plan", "pro")
            # Only upgrade if user is on free or lower plan
            if plan_id in ["plus", "pro", "enterprise"]:
                plan_hierarchy = {"free": 0, "plus": 1, "pro": 2, "enterprise": 3}
                current_rank = plan_hierarchy.get(user.plan, 0)
                new_rank = plan_hierarchy.get(plan_id, 0)
                if new_rank > current_rank:
                    previous_plan = user.plan
                    user.plan = plan_id
                    user.plan_started_at = datetime.now(timezone.utc)
                    user.plan_payment_id = payment_id
                    user.plan_source = "payment"
                    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
                    db.commit()

                    # Audit log
                    try:
                        from models import create_audit_log
                        _event_type = "plan_upgrade" if previous_plan != "free" else "plan_purchase"
                        create_audit_log(db, user_id=user.id, email=user.email,
                                        event_type=_event_type,
                                        details={"plan": plan_id, "payment_id": payment_id, "amount": amount, "source": "webhook"})
                    except Exception as e:
                        print(f"⚠️ Audit log error on webhook: {e}")

                    print(f"✅ Webhook: Upgraded {user.email} to {plan_id}")

    return {"status": "received"}
