from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import razorpay
from models import User
from dependencies import get_current_user, get_db
from config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import secrets

router = APIRouter(prefix="/api/billing", tags=["billing"])

rzp_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class VerifyReq(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    mock: bool = False
    plan_id: str = "pro"

class CreateOrderReq(BaseModel):
    plan_id: str

@router.get("/plan")
def get_plan(user: User = Depends(get_current_user)):
    return {
        "plan": user.plan,
        "email": user.email,
        "requests_used": getattr(user, 'requests_used', 0),
    }

@router.post("/create-order")
def create_order(req: CreateOrderReq, user: User = Depends(get_current_user)):
    if user.plan == req.plan_id:
        raise HTTPException(status_code=400, detail=f"Already on {req.plan_id.title()} plan")

    if req.plan_id not in ["plus", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid plan selected")

    base_amount = 1673 if req.plan_id == "plus" else 3625 # INR 1673 ($18) or 3625 ($39)
    
    # If user was referred, give 60% discount (Pay only 40%)
    final_amount = base_amount
    is_discounted = False
    if getattr(user, 'referred_by_id', None):
        final_amount = int(base_amount * 0.4) # 60% OFF
        is_discounted = True

    amount_paise = final_amount * 100 

    if rzp_client:
        try:
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"rcpt_{user.id}",
                "notes": {
                    "user_id": str(user.id),
                    "discounted": str(is_discounted),
                    "plan": req.plan_id
                }
            }
            order = rzp_client.order.create(data=order_data)
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": RAZORPAY_KEY_ID,
                "discount_applied": is_discounted,
                "plan_id": req.plan_id
            }
        except Exception:
            pass  # Fallback to mock

    return {
        "order_id": f"mock_{secrets.token_hex(6)}",
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID or "mock_key",
        "mock": True,
        "discount_applied": is_discounted,
        "plan_id": req.plan_id
    }

@router.post("/verify")
def verify_payment(req: VerifyReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    success = False
    if req.mock:
        success = True
    elif rzp_client:
        try:
            rzp_client.utility.verify_payment_signature({
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature
            })
            success = True
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
    else:
        raise HTTPException(status_code=500, detail="Razorpay not configured")

    if success:
        user.plan = req.plan_id
        
        # Handle Referrer Reward
        if getattr(user, 'referred_by_id', None):
            referrer = db.query(User).filter(User.id == user.referred_by_id).first()
            if referrer:
                referrer.total_paid_referrals += 1
                
                award_pro = False
                # Rule: 1st referral = 1 month free. Then every 5 referrals = 1 month free.
                if not referrer.has_received_first_reward:
                    award_pro = True
                    referrer.has_received_first_reward = True
                else:
                    referrer.pending_referrals_count += 1
                    if referrer.pending_referrals_count >= 5:
                        award_pro = True
                        referrer.pending_referrals_count = 0
                
                if award_pro:
                    # Upgrade referrer to Pro (or extend if already pro)
                    referrer.plan = "pro"
                    # In a real app, we'd add 30 days to an expiry date column
        
        db.commit()
        return {"status": "success", "plan": req.plan_id}
    
    return {"status": "error", "message": "Verification failed"}
