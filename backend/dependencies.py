from fastapi import Depends, HTTPException, status, Request, Response, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import SessionLocal
from config import SECRET_KEY, ALGORITHM, FRONTEND_URL, TOKEN_EXPIRE_MINUTES
from models import User, ApiKey

security = HTTPBearer(auto_error=False)


def get_effective_plan(user: User) -> str:
    """Return the user's effective plan, accounting for expiry.

    If the user has an active paid plan that has expired, return 'free'.
    This must be used everywhere plan-based access control is needed,
    not just in the proxy rate limiter.
    """
    if user.plan == "free":
        return "free"
    plan_expires_at = getattr(user, "plan_expires_at", None)
    if plan_expires_at:
        from datetime import datetime, timezone as _tz
        expires_at = plan_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=_tz.utc)
        if datetime.now(_tz.utc) > expires_at:
            return "free"
    return user.plan

# ─── Cookie Configuration ────────────────────────────────────────────────────────
COOKIE_NAME = "backport_access_token"
COOKIE_MAX_AGE = TOKEN_EXPIRE_MINUTES * 60  # 24 hours in seconds (matches JWT expiry)
# Cross-origin cookie: SameSite=None (required for Vercel ↔ Render) + Secure + HttpOnly
COOKIE_SETTINGS = {
    "key": COOKIE_NAME,
    "httponly": True,
    "secure": True,
    "samesite": "None",
    "path": "/",
    "max_age": COOKIE_MAX_AGE,
}

# Determine cookie domain (None = auto-set to request domain)
# For production cross-origin, we don't set domain explicitly
COOKIE_DOMAIN = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _extract_token_from_cookie(request: Request) -> str | None:
    """Try to extract JWT from HttpOnly cookie."""
    token = request.cookies.get(COOKIE_NAME)
    return token if token else None


def _extract_token_from_header(creds: HTTPAuthorizationCredentials) -> str | None:
    """Try to extract JWT from Authorization header (backward compat)."""
    return creds.credentials if creds else None


def set_auth_cookie(response: Response, token: str) -> None:
    """Set the HttpOnly auth cookie on a response object."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=COOKIE_MAX_AGE,
        domain=COOKIE_DOMAIN,
    )


def clear_auth_cookie(response: Response) -> None:
    """Clear the HttpOnly auth cookie (for logout)."""
    response.set_cookie(
        key=COOKIE_NAME,
        value="",
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=0,  # Delete immediately
        domain=COOKIE_DOMAIN,
    )


# ─── Refresh Token Cookie ────────────────────────────────────────────────────
REFRESH_COOKIE_NAME = "backport_refresh_token"
REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds

def set_refresh_cookie(response: Response, token: str) -> None:
    """Set the refresh token HttpOnly cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=REFRESH_COOKIE_MAX_AGE,
        domain=COOKIE_DOMAIN,
    )

def clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value="",
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        max_age=0,
        domain=COOKIE_DOMAIN,
    )


def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate user by checking:
    1. HttpOnly cookie (preferred, most secure)
    2. Authorization: Bearer header (backward compatible for API/docs)
    """
    # Priority 1: HttpOnly cookie
    token = _extract_token_from_cookie(request)

    # Priority 2: Authorization header (fallback for API consumers, Swagger, etc.)
    if not token:
        token = _extract_token_from_header(creds)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        user_id: str = payload.get("sub")
        if email is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def get_proxy_user(
    x_api_key: str = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> tuple[User, ApiKey]:
    """
    Auth for proxy endpoints using X-API-Key header.
    This is separate from cookie-based user auth — API keys are
    meant for programmatic access, not browser sessions.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header required",
        )
    api_key_obj = db.query(ApiKey).filter(ApiKey.key == x_api_key).first()
    if not api_key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return api_key_obj.user, api_key_obj
