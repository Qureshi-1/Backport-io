import bcrypt
import secrets
import random
import string
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from models import User, ApiKey
from dependencies import get_db
from config import SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_MINUTES, ADMIN_EMAIL, EMAIL_VERIFY_EXPIRE_HOURS

router = APIRouter(prefix="/api/auth", tags=["auth"])

class AuthReq(BaseModel):
    email: str
    password: str
    referral_code: str = ""

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─── Signup ───────────────────────────────────────────────────────────────────
@router.post("/signup")
def signup(req: AuthReq, db: Session = Depends(get_db)):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered. Please log in or reset your password.")

    referred_by = None
    if req.referral_code:
        referrer = db.query(User).filter(User.referral_code == req.referral_code).first()
        if referrer:
            referred_by = referrer.id
            referrer.referrals_count += 1

    # Generate 6-digit OTP verification token
    verification_token = "".join(random.choices(string.digits, k=6))

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        is_admin=(req.email.lower() == ADMIN_EMAIL),
        referred_by_id=referred_by,
        is_verified=False,
        email_verification_token=verification_token,
        email_verification_sent_at=datetime.utcnow(),
        api_key=secrets.token_urlsafe(16),  # legacy NOT NULL column — real keys in ApiKey model
    )
    # Admin account is auto-verified
    if user.is_admin:
        user.is_verified = True
        user.email_verification_token = None

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default API key
    new_key = ApiKey(user_id=user.id, name="Default Gateway")
    db.add(new_key)
    db.commit()

    # Send verification email (non-blocking — don't fail signup if email fails)
    if not user.is_admin:
        try:
            from email_service import send_verification_email
            if send_verification_email(user.email, verification_token):
                print(f"📧 Verification email sent successfully to {user.email}")
            else:
                print(f"❌ Failed to send verification email to {user.email}")
        except Exception as e:
            print(f"⚠️  Email import/send error (non-fatal): {e}")

    return {
        "message": "Account created. Please check your email to verify your account.",
        "email": user.email,
        "email_verification_required": not user.is_admin,
    }


# ─── Verify Email ─────────────────────────────────────────────────────────────
@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    # Check token age
    if user.email_verification_sent_at:
        age = datetime.utcnow() - user.email_verification_sent_at
        if age > timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS):
            raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    # Mark verified
    user.is_verified = True
    user.email_verification_token = None
    db.commit()
    db.refresh(user)

    # Send welcome email
    try:
        from email_service import send_welcome_email
        if send_welcome_email(user.email):
            print(f"📧 Welcome email sent to {user.email}")
        else:
            print(f"❌ Failed to send welcome email to {user.email}")
    except Exception as e:
        print(f"⚠️ Welcome email error: {e}")

    # Return JWT so frontend can auto-login
    api_key = user.api_keys[0].key if user.api_keys else None
    token_jwt = create_access_token(data={"sub": str(user.id), "email": user.email})
    return {
        "message": "Email verified successfully! Welcome to Backport.",
        "token": token_jwt,
        "api_key": api_key,
        "email": user.email,
    }


# ─── Resend Verification Email ─────────────────────────────────────────────────
class ResendReq(BaseModel):
    email: str

@router.post("/resend-verification")
def resend_verification(req: ResendReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If that email exists, a verification link has been sent."}
    if user.is_verified:
        return {"message": "Email is already verified."}

    # Rate limit: 1 resend per 60 seconds
    if user.email_verification_sent_at:
        seconds_since = (datetime.utcnow() - user.email_verification_sent_at).total_seconds()
        if seconds_since < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {int(60 - seconds_since)} seconds before requesting another email."
            )

    new_token = "".join(random.choices(string.digits, k=6))
    user.email_verification_sent_at = datetime.utcnow()
    # Regenerate 6-digit OTP code on resend
    user.email_verification_token = new_token
    db.commit()

    try:
        from email_service import send_verification_email
        if send_verification_email(user.email, new_token):
            print(f"📧 Verification email (resend) sent to {user.email}")
        else:
            print(f"❌ Failed to send verification email (resend) to {user.email}")
    except Exception as e:
        print(f"⚠️ Resend link exception: {e}")

    return {"message": "If that email exists, a verification link has been sent."}


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login")
def login(req: AuthReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Block unverified users (except admin)
    if not user.is_verified and not user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="EMAIL_NOT_VERIFIED"
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    api_key = user.api_keys[0].key if user.api_keys else None
    return {"token": token, "api_key": api_key, "email": user.email}

# ─── Password Reset ───────────────────────────────────────────────────────────
class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If that email exists, a password reset link has been sent."}

    # Rate limiting: 1 reset link per 15 minutes
    if user.password_reset_sent_at:
        seconds_since = (datetime.utcnow() - user.password_reset_sent_at).total_seconds()
        if seconds_since < 60:
            return {"message": "If that email exists, an OTP has been sent. Please check your inbox or wait a minute before requesting again."}

    # Generate 6-digit OTP reset token
    reset_token = "".join(random.choices(string.digits, k=6))
    user.password_reset_token = reset_token
    user.password_reset_sent_at = datetime.utcnow()
    db.commit()

    try:
        from email_service import send_password_reset_email
        if send_password_reset_email(user.email, reset_token):
            print(f"📧 Password reset email sent to {user.email}")
        else:
            print(f"❌ Failed to send password reset email to {user.email}")
    except Exception as e:
        print(f"⚠️ Password reset email exception: {e}")

    return {"message": "If that email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")

    # Check expiration (1 hour)
    if not user.password_reset_sent_at or (datetime.utcnow() - user.password_reset_sent_at) > timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Password reset link has expired.")

    # Update password and clear token
    user.hashed_password = get_password_hash(req.new_password)
    user.password_reset_token = None
    db.commit()

    return {"message": "Password has been successfully reset! You can now log in."}
