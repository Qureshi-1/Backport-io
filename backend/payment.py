from fastapi import APIRouter, Depends, HTTPException
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


def _is_promo_valid(code: str) -> tuple[bool, str]:
    """Check if promo code exists and is valid. Returns (is_valid, error_message)."""
    promo = PROMO_CODES.get(code.upper())
    if not promo:
        return False, "Invalid promo code"
    if not promo["active"]:
        return False, "This promo code is no longer active"
    if promo["used"] >= promo["max_uses"]:
        return False, "This promo code has reached its usage limit"
    if promo.get("expires_at"):
        try:
            expires = datetime.fromisoformat(promo["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires:
                return False, "This promo code has expired"
        except Exception:
            pass
    return True, ""


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

    is_valid, error_msg = _is_promo_valid(code)
    if not is_valid:
        raise HTTPException(status_code=404, detail=error_msg)

    promo = PROMO_CODES[code]
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

    # ─── Apply promo code discount ────────────────────────────────────────────
    discount_percent = 0
    promo_code_used = None
    if req.promo_code:
        code = req.promo_code.strip().upper()
        is_valid, error_msg = _is_promo_valid(code)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Promo code error: {error_msg}")

        promo = PROMO_CODES[code]
        discount_percent = promo["discount_percent"]

        # Increment usage count (thread-safe)
        with _promo_lock:
            # Double-check after acquiring lock
            if promo["used"] >= promo["max_uses"]:
                raise HTTPException(status_code=400, detail="Promo code just reached its limit. Try again.")
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

    user.plan = plan_id
    user.plan_started_at = datetime.now(timezone.utc)
    user.plan_payment_id = req.razorpay_payment_id
    user.plan_source = "payment"
    # Set expiry: monthly plans expire in 30 days
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.commit()

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
