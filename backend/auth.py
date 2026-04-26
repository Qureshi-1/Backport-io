import bcrypt
import secrets
import string
import time
import hashlib
import httpx
import logging
import threading
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, field_validator, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from models import User, ApiKey
from dependencies import get_db, set_auth_cookie, clear_auth_cookie, get_current_user, get_current_admin
from config import (
    SECRET_KEY, ALGORITHM, TOKEN_EXPIRE_MINUTES, ADMIN_EMAIL,
    EMAIL_VERIFY_EXPIRE_HOURS, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MINUTES, MAX_OTP_ATTEMPTS,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
    OAUTH_STATE_SECRET, FRONTEND_URL,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ─── In-memory rate limit store for login attempts ──────────────────────────
_login_attempts: dict = {}   # { "email": [timestamps] }
_signup_attempts: dict = {}  # { "ip": [timestamps] }
_rate_limit_lock = threading.Lock()  # Thread-safe access

# ─── In-memory OTP attempt tracker ─────────────────────────────────────────
_otp_attempts: dict = {}     # { "token": attempts_count }

MAX_SIGNUP_ATTEMPTS_PER_IP = 5  # Max signups per IP per 15 minutes

# ─── Periodic cleanup of stale rate-limit entries (every 10 min) ─────────────
def _cleanup_stale_rate_limits():
    """Remove stale entries from rate-limit dicts to prevent memory leaks."""
    now = time.time()
    cutoff = now - LOGIN_WINDOW_MINUTES * 60
    with _rate_limit_lock:
        # Clean login attempts
        stale_logins = [k for k, v in _login_attempts.items()
                        if not v or v[-1] < cutoff]
        for k in stale_logins:
            del _login_attempts[k]
        # Clean signup attempts
        stale_signups = [k for k, v in _signup_attempts.items()
                         if not v or v[-1] < cutoff]
        for k in stale_signups:
            del _signup_attempts[k]
        # Clean old OTP attempts (reset all since they are short-lived tokens)
        if _otp_attempts:
            _otp_attempts.clear()
        # Clean expired OAuth states
        if _oauth_states:
            expired = [s for s, t in _oauth_states.items() if time.time() - t > _OAUTH_STATE_TTL]
            for s in expired:
                del _oauth_states[s]
    logger.debug(f"Rate limit cleanup: removed {len(stale_logins)} logins, {len(stale_signups)} signups")

    # Reschedule cleanup timer (self-repeating, every 10 min)
    global _rate_limit_timer
    _rate_limit_timer = threading.Timer(600, _cleanup_stale_rate_limits)
    _rate_limit_timer.daemon = True
    _rate_limit_timer.start()

# Start periodic cleanup of stale rate-limit entries (every 10 min)
_rate_limit_timer = threading.Timer(600, _cleanup_stale_rate_limits)
_rate_limit_timer.daemon = True
_rate_limit_timer.start()


def _utcnow():
    """Timezone-aware UTC now (replaces deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc)


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = _utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _validate_password_strength(password: str) -> str | None:
    """Return error message if password is weak, None if OK."""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return "Password must contain at least one digit"
    return None


def _check_signup_rate_limit(ip: str) -> bool:
    """Returns True if signup is allowed, False if rate limited."""
    now = time.time()
    with _rate_limit_lock:
        attempts = _signup_attempts.get(ip, [])
        attempts = [t for t in attempts if now - t < LOGIN_WINDOW_MINUTES * 60]
        _signup_attempts[ip] = attempts
        if len(attempts) >= MAX_SIGNUP_ATTEMPTS_PER_IP:
            return False
        return True


def _record_signup_attempt(ip: str):
    """Record a signup attempt."""
    now = time.time()
    with _rate_limit_lock:
        if ip not in _signup_attempts:
            _signup_attempts[ip] = []
        _signup_attempts[ip].append(now)


def _check_login_rate_limit(email: str) -> bool:
    """Returns True if login is allowed, False if rate limited."""
    now = time.time()
    with _rate_limit_lock:
        attempts = _login_attempts.get(email, [])
        # Keep only attempts within the window
        attempts = [t for t in attempts if now - t < LOGIN_WINDOW_MINUTES * 60]
        _login_attempts[email] = attempts

        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            return False  # Rate limited
        return True


def _record_login_failure(email: str):
    """Record a failed login attempt."""
    now = time.time()
    with _rate_limit_lock:
        if email not in _login_attempts:
            _login_attempts[email] = []
        _login_attempts[email].append(now)


def _record_login_success(email: str):
    """Clear login failures on success."""
    with _rate_limit_lock:
        _login_attempts.pop(email, None)


def _check_otp_attempts(token: str) -> bool:
    """Returns True if OTP verification is allowed, False if max attempts exceeded."""
    with _rate_limit_lock:
        return _otp_attempts.get(token, 0) < MAX_OTP_ATTEMPTS


def _record_otp_attempt(token: str):
    """Record an OTP verification attempt."""
    with _rate_limit_lock:
        _otp_attempts[token] = _otp_attempts.get(token, 0) + 1


class LoginReq(BaseModel):
    """Request model for login — no password strength validation.
    Users may have old passwords that don't meet current signup rules."""
    email: str
    password: str


class SignupReq(BaseModel):
    """Request model for signup — includes password strength validation."""
    email: str
    password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ─── Signup ───────────────────────────────────────────────────────────────────
@router.post("/signup")
def signup(req: SignupReq, response: Response, request: Request, db: Session = Depends(get_db)):
    # Rate limit by IP address
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    if not _check_signup_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Too many signup attempts. Please try again after {LOGIN_WINDOW_MINUTES} minutes."
        )

    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered. Please log in or reset your password.")

    # Password strength validation
    pwd_error = _validate_password_strength(req.password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)

    # Generate 6-digit OTP verification token
    verification_token = "".join(secrets.choice(string.digits) for _ in range(6))

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        is_admin=(req.email.lower() == ADMIN_EMAIL),
        is_verified=False,
        email_verification_token=verification_token,
        email_verification_sent_at=_utcnow(),
        api_key=secrets.token_urlsafe(16),  # legacy NOT NULL column — real keys in ApiKey model
    )
    # Admin account is auto-verified
    if user.is_admin:
        user.is_verified = True
        user.email_verification_token = None

    db.add(user)
    db.commit()
    db.refresh(user)

    # Record signup attempt for rate limiting
    _record_signup_attempt(client_ip)

    # Create default API key
    new_key = ApiKey(user_id=user.id, name="Default Gateway")
    db.add(new_key)
    db.commit()

    # Track signup in audit logs
    try:
        from models import create_audit_log
        create_audit_log(db, user_id=user.id, email=user.email, event_type="signup", ip_address=client_ip)
    except Exception as e:
        print(f"⚠️ Audit log error on signup: {e}")

    # Send verification email if RESEND_API_KEY is configured (best-effort).
    # SECURITY: OTP is NEVER returned in the response body to prevent leakage.
    from config import RESEND_API_KEY
    if RESEND_API_KEY and not user.is_admin:
        try:
            from email_service import send_verification_email
            if send_verification_email(user.email, verification_token):
                print(f"📧 Verification email sent successfully to {user.email}")
            else:
                print(f"⚠️ Email send failed for {user.email}")
        except Exception as e:
            print(f"⚠️ Email error ({e})")

    result = {
        "message": "Account created! Please check your email to verify your account.",
        "email": user.email,
        "email_verification_required": not user.is_verified,
    }
    return result


# ─── Verify Email ─────────────────────────────────────────────────────────────
@router.get("/verify-email")
def verify_email(token: str, response: Response, db: Session = Depends(get_db)):
    # Check OTP attempt limit
    if not _check_otp_attempts(token):
        raise HTTPException(
            status_code=429,
            detail=f"Too many verification attempts. Maximum {MAX_OTP_ATTEMPTS} attempts allowed. Please request a new code."
        )

    _record_otp_attempt(token)

    user = db.query(User).filter(User.email_verification_token == token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    # Check token age
    if user.email_verification_sent_at:
        sent_at = user.email_verification_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        age = _utcnow() - sent_at
        if age > timedelta(hours=EMAIL_VERIFY_EXPIRE_HOURS):
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # Mark verified
    user.is_verified = True
    user.email_verification_token = None
    db.commit()
    db.refresh(user)

    # Clear OTP attempts for this token
    _otp_attempts.pop(token, None)

    # Send welcome email
    try:
        from email_service import send_welcome_email
        if send_welcome_email(user.email):
            print(f"📧 Welcome email sent to {user.email}")
        else:
            print(f"❌ Failed to send welcome email to {user.email}")
    except Exception as e:
        print(f"⚠️ Welcome email error: {e}")

    # Set HttpOnly cookie and return (frontend auto-redirects to dashboard)
    api_key = user.api_keys[0].key if user.api_keys else None
    token_jwt = create_access_token(data={"sub": str(user.id), "email": user.email})
    set_auth_cookie(response, token_jwt)
    return {
        "message": "Email verified successfully! Welcome to Backport.",
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
        # Don't reveal if email exists — no OTP token in response (SECURITY)
        return {"message": "If that email exists, a verification code has been sent."}
    if user.is_verified:
        return {"message": "Email is already verified."}

    # Rate limit: 1 resend per 60 seconds
    if user.email_verification_sent_at:
        sent_at = user.email_verification_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        seconds_since = (_utcnow() - sent_at).total_seconds()
        if seconds_since < 60:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {int(60 - seconds_since)} seconds before requesting another email."
            )

    new_token = "".join(secrets.choice(string.digits) for _ in range(6))
    user.email_verification_sent_at = _utcnow()
    user.email_verification_token = new_token
    db.commit()

    # Clear old OTP attempts since new token was generated
    _otp_attempts.pop(new_token, None)

    # Try to send email (best-effort).
    # SECURITY: OTP is NEVER returned in the response body.
    try:
        from email_service import send_verification_email
        if send_verification_email(user.email, new_token):
            print(f"📧 Verification email (resend) sent to {user.email}")
        else:
            print(f"❌ Failed to send verification email (resend) to {user.email}")
    except Exception as e:
        print(f"⚠️ Resend link exception: {e}")

    return {
        "message": "If that email exists, a verification code has been sent.",
    }


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login")
def login(req: LoginReq, request: Request, response: Response, db: Session = Depends(get_db)):
    # Rate limit check
    if not _check_login_rate_limit(req.email.lower()):
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Please try again after {LOGIN_WINDOW_MINUTES} minutes."
        )

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        _record_login_failure(req.email.lower())
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Block unverified users — but auto-verify if email service is not configured
    if not user.is_verified and not user.is_admin:
        from config import RESEND_API_KEY
        if not RESEND_API_KEY:
            # No email service configured — auto-verify on login
            user.is_verified = True
            user.email_verification_token = None
            db.commit()
            print(f"✅ Auto-verified {user.email} on login (email service not configured)")
        else:
            _record_login_failure(req.email.lower())
            raise HTTPException(
                status_code=403,
                detail="EMAIL_NOT_VERIFIED"
            )

    # Clear rate limit on success
    _record_login_success(req.email.lower())

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    api_key = user.api_keys[0].key if user.api_keys else None

    # Track login in audit logs
    try:
        from models import create_audit_log
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        user.login_count = (user.login_count or 0) + 1
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        create_audit_log(db, user_id=user.id, email=user.email, event_type="login", ip_address=client_ip)
    except Exception as e:
        print(f"⚠️ Audit log error on login: {e}")

    # Set HttpOnly Secure cookie (JS cannot read this!)
    set_auth_cookie(response, token)

    return {"api_key": api_key, "email": user.email}

# ─── Password Reset ───────────────────────────────────────────────────────────
class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "If that email exists, a password reset code has been sent."}

    # Rate limiting: 1 reset link per 60 seconds
    if user.password_reset_sent_at:
        sent_at = user.password_reset_sent_at
        if sent_at.tzinfo is None:
            sent_at = sent_at.replace(tzinfo=timezone.utc)
        seconds_since = (_utcnow() - sent_at).total_seconds()
        if seconds_since < 60:
            return {"message": "If that email exists, a code has been sent. Please check your inbox or wait a minute before requesting again."}

    # Generate 6-digit OTP reset token
    reset_token = "".join(secrets.choice(string.digits) for _ in range(6))
    user.password_reset_token = reset_token
    user.password_reset_sent_at = _utcnow()
    db.commit()

    # Clear any previous OTP attempts for this token
    _otp_attempts.pop(reset_token, None)

    try:
        from email_service import send_password_reset_email
        if send_password_reset_email(user.email, reset_token):
            print(f"📧 Password reset email sent to {user.email}")
        else:
            print(f"❌ Failed to send password reset email to {user.email}")
    except Exception as e:
        print(f"⚠️ Password reset email exception: {e}")

    return {"message": "If that email exists, a password reset code has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    # Check OTP attempt limit
    if not _check_otp_attempts(req.token):
        raise HTTPException(
            status_code=429,
            detail=f"Too many reset attempts. Maximum {MAX_OTP_ATTEMPTS} attempts allowed. Please request a new code."
        )

    _record_otp_attempt(req.token)

    user = db.query(User).filter(User.password_reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset code.")

    # Check expiration (1 hour)
    if not user.password_reset_sent_at or (_utcnow() - (user.password_reset_sent_at.replace(tzinfo=timezone.utc) if user.password_reset_sent_at.tzinfo is None else user.password_reset_sent_at)) > timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Password reset code has expired.")

    # Validate new password strength
    pwd_error = _validate_password_strength(req.new_password)
    if pwd_error:
        raise HTTPException(status_code=400, detail=pwd_error)

    # Update password and clear token + reset timestamp
    user.hashed_password = get_password_hash(req.new_password)
    user.password_reset_token = None
    user.password_reset_sent_at = None
    db.commit()

    # Clear OTP attempts for this token
    _otp_attempts.pop(req.token, None)

    return {"message": "Password has been successfully reset! You can now log in."}


# ─── Logout (clear HttpOnly cookie) ──────────────────────────────────────────────
@router.post("/logout")
def logout(response: Response):
    """Clear the HttpOnly auth cookie. Client cannot clear it themselves since HttpOnly."""
    clear_auth_cookie(response)
    return {"message": "Logged out successfully"}


# ─── WebSocket Token (issue short-lived token for WS auth) ──────────────────────
@router.get("/ws-token")
def get_ws_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Return a short-lived JWT for WebSocket authentication.
    The main HttpOnly cookie JWT is not readable by JavaScript,
    so the frontend needs this endpoint to get a token for WebSocket URLs.
    The token is short-lived (5 minutes) and only valid for WS connections."""
    from dependencies import get_current_user, _extract_token_from_cookie
    token = _extract_token_from_cookie(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        from jose import jwt
        from config import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        user_id = payload.get("sub")
        if not email or not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        # Issue a new short-lived token (5 minutes) for WebSocket
        from datetime import timedelta
        ws_token = create_access_token(data={"sub": user_id, "email": email, "ws": True})
        # Override expiry to 5 minutes
        from jose import jwt as jose_jwt
        ws_payload = jose_jwt.decode(ws_token, SECRET_KEY, algorithms=[ALGORITHM])
        ws_payload["exp"] = _utcnow() + timedelta(minutes=5)
        ws_token = jose_jwt.encode(ws_payload, SECRET_KEY, algorithm=ALGORITHM)
        return {"ws_token": ws_token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ─── Check Auth (verify cookie / session) ───────────────────────────────────────
@router.get("/me")
def check_auth(request: Request, db: Session = Depends(get_db)):
    """Verify the current session/cookie. Returns user info if authenticated, 401 if not.
    Frontend uses this to check login status on page load."""
    from dependencies import get_current_user, _extract_token_from_cookie
    token = _extract_token_from_cookie(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        from jose import jwt
        from config import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {
            "authenticated": True,
            "email": user.email,
            "plan": user.plan,
            "is_admin": user.is_admin,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ═══════════════════════════════════════════════════════════════════════════════
# OAuth Social Login — Google + GitHub
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/oauth-debug")
def oauth_debug(db: Session = Depends(get_db), _user: User = Depends(get_current_admin)):
    """Admin-only diagnostic endpoint — verify OAuth + DB configuration."""
    # Test database connectivity
    db_ok = False
    db_error = ""
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_error = str(e)[:100]

    return {
        "google_configured": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
        "google_client_id_prefix": GOOGLE_CLIENT_ID[:10] + "..." if GOOGLE_CLIENT_ID else "NOT SET",
        "github_configured": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET),
        "github_client_id_prefix": GITHUB_CLIENT_ID[:10] + "..." if GITHUB_CLIENT_ID else "NOT SET",
        "oauth_state_secret_set": bool(OAUTH_STATE_SECRET),
        "frontend_url": FRONTEND_URL,
        "secret_key_set": bool(SECRET_KEY and not SECRET_KEY.startswith("backport-dev-only")),
        "database_ok": db_ok,
        "database_error": db_error if not db_ok else None,
    }


# ─── OAuth state nonce tracking (single-use, 10-min expiry) ─────────────────
_oauth_states: dict = {}  # { state: timestamp }
_OAUTH_STATE_TTL = 600  # 10 minutes


def _generate_oauth_state() -> str:
    """Generate a cryptographically signed state for anti-CSRF.

    Two-layer verification to survive server restarts:
      Layer 1 — In-memory nonce: fast single-use check, prevents replay.
      Layer 2 — HMAC signature + embedded timestamp: survives restarts as
        long as OAUTH_STATE_SECRET is stable (set via env var on Render).

    Format: "{raw}.{unix_ts}.{hmac_sha256}"
    """
    raw = secrets.token_urlsafe(32)
    ts = str(int(time.time()))
    sig = hashlib.sha256(f"{raw}:{ts}:{OAUTH_STATE_SECRET}".encode()).hexdigest()
    state = f"{raw}.{ts}.{sig}"
    _oauth_states[state] = time.time()
    return state


def _verify_oauth_state(state: str) -> bool:
    """Verify OAuth state parameter.

    Two-layer verification:
      Layer 1 — HMAC signature + embedded timestamp (survives server restarts).
      Layer 2 — In-memory nonce for single-use enforcement within same instance.

    This means: if the server restarts between /login and /callback, the OAuth
    flow STILL works as long as OAUTH_STATE_SECRET hasn't changed. The in-memory
    dict adds an extra replay-protection layer when the same instance handles
    both requests.
    """
    try:
        parts = state.rsplit(".", 2)

        # ── Backward compat: old format "{raw}.{sig}" (2 parts) ───────────
        if len(parts) == 2:
            raw, sig = parts
            ts = None
            expected = hashlib.sha256(f"{raw}:{OAUTH_STATE_SECRET}".encode()).hexdigest()
            if not secrets.compare_digest(sig, expected):
                return False
            # Old format has no embedded timestamp — accept if in in-memory dict
            if state in _oauth_states:
                if time.time() - _oauth_states[state] > _OAUTH_STATE_TTL:
                    del _oauth_states[state]
                    return False
                del _oauth_states[state]
                return True
            return False  # Old format without in-memory = uncheckable expiry

        # ── New format: "{raw}.{ts}.{sig}" (3 parts) ─────────────────────
        if len(parts) != 3:
            return False
        raw, ts_str, sig = parts

        # Layer 1: Verify HMAC signature (primary — survives restarts)
        expected = hashlib.sha256(f"{raw}:{ts_str}:{OAUTH_STATE_SECRET}".encode()).hexdigest()
        if not secrets.compare_digest(sig, expected):
            return False

        # Check expiry using embedded timestamp
        try:
            ts = int(ts_str)
        except ValueError:
            return False
        if time.time() - ts > _OAUTH_STATE_TTL:
            return False

        # Layer 2: In-memory single-use enforcement (supplementary)
        if state in _oauth_states:
            # Same instance generated this state — enforce single-use
            del _oauth_states[state]
            return True
        else:
            # Server restarted or different worker — state is valid by HMAC +
            # timestamp. Register it in memory to prevent replay within this
            # instance's lifetime.
            _oauth_states[state] = ts
            return True
    except Exception:
        return False


def _get_backend_url(request: Request) -> str:
    """Get the backend's base URL from the incoming request.

    CRITICAL: The redirect_uri in the /login request MUST match the one in
    the /callback request. We extract the base URL from the request itself
    (scheme + host), falling back to x-forwarded-* headers that Render/
    Cloudflare set. This guarantees both /login and /callback resolve to
    the same backend URL even if the server restarts between the two.
    """
    # Prefer x-forwarded-proto (set by Render/Cloudflare) else use request scheme
    scheme = request.headers.get("x-forwarded-proto") or str(request.url.scheme)
    # Prefer x-forwarded-host > host header > URL netloc
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or str(request.url.netloc)
    )
    return f"{scheme}://{host}"


def _oauth_redirect_to_frontend(response: Response, success: bool = True, error: str = "", detail: str = ""):
    """Redirect back to frontend after OAuth flow."""
    import base64 as _b64
    base = FRONTEND_URL.rstrip("/")
    if success:
        return RedirectResponse(url=f"{base}/dashboard?oauth=success", status_code=302)
    else:
        url = f"{base}/auth/login?oauth_error={error}"
        # Append safe error detail for debugging (base64 encoded)
        if detail:
            safe = _b64.urlsafe_b64encode(detail.encode()[:200]).decode()
            url += f"&err_detail={safe}"
        return RedirectResponse(url=url, status_code=302)


def _create_or_link_oauth_user(db: Session, provider: str, oauth_id: str, email: str,
                                 name: str = None, avatar_url: str = None) -> tuple[User, bool]:
    """Create a new OAuth user or link OAuth to existing email/password user.
    Returns (user, is_new_user).
    SECURITY: Only auto-links if the existing user has NO password set (pure OAuth user)
    or if the OAuth provider matches the stored one. Prevents account hijacking via email collision."""
    # Check if OAuth user already exists (by provider + oauth_id)
    existing = db.query(User).filter(
        User.oauth_provider == provider,
        User.oauth_id == oauth_id
    ).first()
    if existing:
        # Update name/avatar if changed
        if name and name != existing.name:
            existing.name = name
        if avatar_url and avatar_url != existing.avatar_url:
            existing.avatar_url = avatar_url
        db.commit()
        db.refresh(existing)
        return existing, False

    # Check if email/password user exists with same email
    email_user = db.query(User).filter(User.email == email.lower()).first()
    if email_user:
        # SECURITY: Only auto-link if the user was created via OAuth before
        # (has oauth_provider set) or has no real password (random hash).
        # This prevents a random person from hijacking an email/password account
        # by creating a Google/GitHub account with the same email.
        if email_user.oauth_provider and email_user.oauth_id:
            # SECURITY: Only update if SAME provider (re-authorization).
            # Reject cross-provider linking to prevent account hijacking.
            if email_user.oauth_provider != provider:
                logger.warning(
                    f"OAuth provider conflict for {email}: "
                    f"existing={email_user.oauth_provider}, new={provider}. "
                    f"Creating separate account instead."
                )
                # Fall through to create a new user for this provider
            else:
                # Same provider — safe to update OAuth ID (re-authorization)
                email_user.oauth_id = oauth_id
                if name and not email_user.name:
                    email_user.name = name
                if avatar_url and not email_user.avatar_url:
                    email_user.avatar_url = avatar_url
                if not email_user.is_verified:
                    email_user.is_verified = True
                db.commit()
                db.refresh(email_user)
                logger.info(f"OAuth re-linked: {provider} account ({email}) updated")
                return email_user, False
        else:
            # Email/password user exists with no OAuth — DON'T auto-link.
            # Create a NEW OAuth user instead (separate account).
            # The user can link manually later from settings.
            logger.warning(f"OAuth email collision: {email} already has email/password account. Creating separate OAuth account.")

    # Create brand new user via OAuth
    random_password = secrets.token_urlsafe(32)
    user = User(
        email=email.lower(),
        hashed_password=get_password_hash(random_password),  # Random hash (user won't need it)
        oauth_provider=provider,
        oauth_id=oauth_id,
        name=name,
        avatar_url=avatar_url,
        is_verified=True,  # OAuth emails are pre-verified by the provider
        is_admin=(email.lower() == ADMIN_EMAIL),
        api_key=secrets.token_urlsafe(16),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default API key
    new_key = ApiKey(user_id=user.id, name="Default Gateway")
    db.add(new_key)
    db.commit()

    print(f"✅ New OAuth user created: {email} via {provider}")
    return user, True


# ─── Google OAuth ──────────────────────────────────────────────────────────────
@router.get("/google/login")
async def google_login(request: Request):
    """Redirect user to Google's OAuth consent screen."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.")

    backend_url = _get_backend_url(request)
    redirect_uri = f"{backend_url}/api/auth/google/callback"

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": _generate_oauth_state(),
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/google/callback")
async def google_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback — exchange code, get user info, create/login user."""
    # Verify state (anti-CSRF)
    if not _verify_oauth_state(state):
        return _oauth_redirect_to_frontend(request, success=False, error="invalid_state")

    backend_url = _get_backend_url(request)
    redirect_uri = f"{backend_url}/api/auth/google/callback"

    try:
        # Step 1: Exchange authorization code for access token
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
                headers={"Accept": "application/json"},
            )
            token_data = token_resp.json()

        if "error" in token_data:
            print(f"❌ Google OAuth token error: {token_data}")
            return _oauth_redirect_to_frontend(request, success=False, error="token_exchange_failed")

        access_token = token_data.get("access_token")

        # Step 2: Get user info from Google
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_info = user_resp.json()

        google_id = str(user_info.get("id", ""))
        email = user_info.get("email", "")
        name = user_info.get("name", "")
        avatar = user_info.get("picture", "")

        if not email:
            return _oauth_redirect_to_frontend(request, success=False, error="no_email")

        # Step 3: Create or find user
        user, is_new = _create_or_link_oauth_user(
            db, provider="google", oauth_id=google_id,
            email=email, name=name, avatar_url=avatar
        )

        # Track OAuth login in audit logs
        try:
            from models import create_audit_log
            client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
            if is_new:
                create_audit_log(db, user_id=user.id, email=user.email, event_type="signup", details={"provider": "google", "name": name}, ip_address=client_ip)
            create_audit_log(db, user_id=user.id, email=user.email, event_type="login", details={"provider": "google"}, ip_address=client_ip)
            user.login_count = (user.login_count or 0) + 1
            user.last_login_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as e:
            print(f"⚠️ Audit log error on Google OAuth: {e}")

        # Step 4: Set HttpOnly cookie and redirect to frontend
        token_jwt = create_access_token(data={"sub": str(user.id), "email": user.email})
        response = RedirectResponse(url=f"{FRONTEND_URL.rstrip('/')}/dashboard?oauth=success", status_code=302)
        set_auth_cookie(response, token_jwt)
        return response

    except Exception as e:
        import traceback
        print(f"❌ Google OAuth error: {e}")
        print(f"❌ Google OAuth traceback: {traceback.format_exc()}")
        # Return specific error based on exception type
        error_msg = "server_error"
        err_detail = f"{type(e).__name__}: {str(e)[:150]}"
        if "timeout" in str(e).lower():
            error_msg = "token_exchange_failed"
        elif "connection" in str(e).lower():
            error_msg = "token_exchange_failed"
        elif "redirect_uri_mismatch" in str(e).lower():
            error_msg = "token_exchange_failed"
            err_detail = "Redirect URI mismatch — check Google Cloud Console authorized redirect URIs"
        elif "invalid_grant" in str(e).lower():
            error_msg = "invalid_state"
            err_detail = "Authorization code already used or expired. Please try again."
        elif "IntegrityError" in str(e) or "UniqueConstraint" in str(e):
            error_msg = "server_error"
            err_detail = "Database constraint error — account may already exist"
        return _oauth_redirect_to_frontend(request, success=False, error=error_msg, detail=err_detail)


# ─── GitHub OAuth ──────────────────────────────────────────────────────────────
@router.get("/github/login")
async def github_login(request: Request):
    """Redirect user to GitHub's OAuth consent screen."""
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.")

    backend_url = _get_backend_url(request)
    redirect_uri = f"{backend_url}/api/auth/github/callback"

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "user:email read:user",
        "state": _generate_oauth_state(),
    }
    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/github/callback")
async def github_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback — exchange code, get user info, create/login user."""
    # Verify state (anti-CSRF)
    if not _verify_oauth_state(state):
        return _oauth_redirect_to_frontend(request, success=False, error="invalid_state")

    backend_url = _get_backend_url(request)
    redirect_uri = f"{backend_url}/api/auth/github/callback"

    try:
        # Step 1: Exchange authorization code for access token
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            token_data = token_resp.json()

        if "error" in token_data:
            print(f"❌ GitHub OAuth token error: {token_data}")
            return _oauth_redirect_to_frontend(request, success=False, error="token_exchange_failed")

        access_token = token_data.get("access_token")

        # Step 2: Get user info from GitHub
        async with httpx.AsyncClient() as client:
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            user_info = user_resp.json()

        github_id = str(user_info.get("id", ""))
        name = user_info.get("name") or user_info.get("login", "")
        avatar = user_info.get("avatar_url", "")

        # GitHub may not return email in /user — check /user/emails
        email = user_info.get("email")
        if not email:
            async with httpx.AsyncClient() as client:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
                )
                emails = emails_resp.json()
                # Pick the primary verified email
                for e in emails:
                    if e.get("primary") and e.get("verified"):
                        email = e.get("email")
                        break
                # Fallback to first verified email
                if not email:
                    for e in emails:
                        if e.get("verified"):
                            email = e.get("email")
                            break

        if not email:
            return _oauth_redirect_to_frontend(request, success=False, error="no_email")

        # Step 3: Create or find user
        user, is_new = _create_or_link_oauth_user(
            db, provider="github", oauth_id=github_id,
            email=email, name=name, avatar_url=avatar
        )

        # Track OAuth login in audit logs
        try:
            from models import create_audit_log
            client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
            if is_new:
                create_audit_log(db, user_id=user.id, email=user.email, event_type="signup", details={"provider": "github", "name": name}, ip_address=client_ip)
            create_audit_log(db, user_id=user.id, email=user.email, event_type="login", details={"provider": "github"}, ip_address=client_ip)
            user.login_count = (user.login_count or 0) + 1
            user.last_login_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as e:
            print(f"⚠️ Audit log error on GitHub OAuth: {e}")

        # Step 4: Set HttpOnly cookie and redirect to frontend
        token_jwt = create_access_token(data={"sub": str(user.id), "email": user.email})
        response = RedirectResponse(url=f"{FRONTEND_URL.rstrip('/')}/dashboard?oauth=success", status_code=302)
        set_auth_cookie(response, token_jwt)
        return response

    except Exception as e:
        import traceback
        print(f"❌ GitHub OAuth error: {e}")
        print(f"❌ GitHub OAuth traceback: {traceback.format_exc()}")
        error_msg = "server_error"
        err_detail = f"{type(e).__name__}: {str(e)[:150]}"
        if "timeout" in str(e).lower():
            error_msg = "token_exchange_failed"
        elif "connection" in str(e).lower():
            error_msg = "token_exchange_failed"
        elif "redirect_uri_mismatch" in str(e).lower():
            error_msg = "token_exchange_failed"
            err_detail = "Redirect URI mismatch — check GitHub OAuth App callback URL"
        elif "bad_verification_code" in str(e).lower():
            error_msg = "invalid_state"
            err_detail = "Authorization code already used or expired. Please try again."
        elif "IntegrityError" in str(e) or "UniqueConstraint" in str(e):
            error_msg = "server_error"
            err_detail = "Database constraint error — account may already exist"
        return _oauth_redirect_to_frontend(request, success=False, error=error_msg, detail=err_detail)
