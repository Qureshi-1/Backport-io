import os
import warnings
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./backport.db")

# ─── Security: Force strong secrets in production ────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY or SECRET_KEY in ("backport-secret-key-change-this", "changeme", "secret", "your_secret_key_here"):
    warnings.warn(
        "⚠️  SECRET_KEY is not set or uses an insecure default. "
        "Set a strong SECRET_KEY environment variable (min 32 chars) before deploying to production!",
        RuntimeWarning, stacklevel=1
    )
    SECRET_KEY = "backport-dev-only-do-not-use-in-prod-a7f3e9b2c4d1"

if SECRET_KEY and SECRET_KEY.startswith("backport-dev-only") and os.environ.get("ENVIRONMENT") == "production":
    raise RuntimeError("CRITICAL: Default SECRET_KEY detected in production. Set a strong SECRET_KEY environment variable (min 32 chars).")

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://backport.in").strip().strip('"').strip("'").rstrip("/")
CORS_ORIGINS_STR = os.getenv("CORS_ORIGINS", FRONTEND_URL)
CORS_ORIGINS = [o.strip().strip('"').strip("'").rstrip("/") for o in CORS_ORIGINS_STR.split(",") if o.strip()]

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@backport.dev")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")

# ─── OAuth Social Login (Google + GitHub) ──────────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
_INSECURE_ADMIN_SECRETS = ("backport-admin-secret-2026", "changeme", "admin", "your_admin_secret_here", "backport-dev-only-admin-do-not-use-in-prod")
if not ADMIN_SECRET or ADMIN_SECRET in _INSECURE_ADMIN_SECRETS:
    if os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError("CRITICAL: Default or insecure ADMIN_SECRET detected in production. Set a strong ADMIN_SECRET environment variable.")
    warnings.warn(
        "⚠️  ADMIN_SECRET is not set or uses an insecure default. "
        "Set a strong ADMIN_SECRET environment variable before deploying to production!",
        RuntimeWarning, stacklevel=1
    )
    ADMIN_SECRET = "backport-dev-only-admin-do-not-use-in-prod"

PORT = int(os.getenv("PORT", 8080))

# ─── Email via Resend ──────────────────────────────────────────────────────────
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev").strip()
APP_NAME = "Backport"
EMAIL_VERIFY_EXPIRE_HOURS = 24  # Verification token expires after 24 hours

# ─── Rate Limiting Constants ───────────────────────────────────────────────────
MAX_LOGIN_ATTEMPTS = 10          # Max failed login attempts per 15 min window
LOGIN_WINDOW_MINUTES = 15
MAX_OTP_ATTEMPTS = 5             # Max OTP verification attempts before invalidation

# OAuth signing secret (for state parameter anti-CSRF) — auto-generated if not set
import secrets as _secrets
OAUTH_STATE_SECRET = os.getenv("OAUTH_STATE_SECRET", "").strip() or _secrets.token_urlsafe(32)
