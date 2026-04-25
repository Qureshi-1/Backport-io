import sys
import os
import logging
import time as _time
import uvicorn
from sqlalchemy import text
import threading
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from database import engine, Base, SessionLocal
import models
import auth, user, payment, feedback, proxy, admin
import transform, mock, custom_waf, webhooks
import health_monitor, circuit_breaker
import teams, endpoint_config, ws, integrations
import api_docs
from config import CORS_ORIGINS, ADMIN_EMAIL, SECRET_KEY

logger = logging.getLogger(__name__)

# ─── Global Security Constants ──────────────────────────────────────────────────
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024  # 10MB max request body (global)

print(f"✅ Starting Backport Gateway | Python {sys.version}")

# Validate secret key on startup
if SECRET_KEY and not SECRET_KEY.startswith("backport-dev-only"):
    if len(SECRET_KEY) < 32:
        print("⚠️  WARNING: SECRET_KEY is shorter than 32 characters. Consider using a stronger key.")

_docs_url = "/docs" if os.getenv("ENVIRONMENT") != "production" else None
_redoc_url = "/redoc" if os.getenv("ENVIRONMENT") != "production" else None

_APP_START = _time.time()

app = FastAPI(
    title="Backport API Gateway",
    description="Open-source API Gateway providing enterprise-grade security — WAF, Rate Limiting, LRU Caching & Idempotency — with zero code changes to your backend.",
    version="2.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    contact={"name": "Backport", "url": "https://backport.in", "email": "support@backportio.com"},
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
)

@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized")

        # Auto-migrate new columns - Individually to avoid mass rollbacks
        migration_all = [
            ("rate_limit_enabled", "BOOLEAN DEFAULT true"),
            ("caching_enabled", "BOOLEAN DEFAULT false"),
            ("idempotency_enabled", "BOOLEAN DEFAULT true"),
            ("waf_enabled", "BOOLEAN DEFAULT false"),
            ("api_key", "VARCHAR"),
            # Email verification (new)
            ("is_verified", "BOOLEAN DEFAULT false"),
            ("email_verification_token", "VARCHAR"),
            ("email_verification_sent_at", "TIMESTAMP"),
            ("password_reset_token", "VARCHAR"),
            ("password_reset_sent_at", "TIMESTAMP"),
            ("current_team_id", "INTEGER"),
            # OAuth social login (new)
            ("oauth_provider", "VARCHAR"),
            ("oauth_id", "VARCHAR"),
            ("name", "VARCHAR"),
            ("avatar_url", "VARCHAR"),
            # Plan tracking (from 002_add_plan_tracking migration)
            ("plan_started_at", "TIMESTAMP"),
            ("plan_expires_at", "TIMESTAMP"),
            ("plan_payment_id", "VARCHAR"),
            ("plan_source", "VARCHAR DEFAULT 'none'"),
        ]

        from sqlalchemy import text
        for col, col_type in migration_all:
            try:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                print(f"✅ Migration: Column {col} ensures exists.")
            except Exception:
                try:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                except Exception as e:
                    logger.debug(f"Users migration skip (fallback) for column {col}: {e}")

        # Make legacy api_key column nullable (was NOT NULL in old schema)
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ALTER COLUMN api_key DROP NOT NULL"))
            print("✅ Migration: api_key column made nullable")
        except Exception as e:
            logger.debug(f"Migration: api_key nullable skip: {e}")  # Already nullable or SQLite

        # Auto-set Admin — always run on startup
        with SessionLocal() as db:
            from models import User
            admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
            if admin_user:
                admin_user.is_admin = True
                admin_user.is_verified = True
                db.commit()
                print(f"👑 Admin privileges + verified for {ADMIN_EMAIL}")

        # Enhanced logging migration
        log_migrations = [
            ("api_key_id", "INTEGER"),
            ("ip_address", "VARCHAR"),
            ("request_headers", "TEXT"),
            ("request_body", "TEXT"),
            ("response_size", "INTEGER DEFAULT 0"),
            ("query_params", "VARCHAR"),
            ("response_body", "TEXT"),
        ]
        for col, col_type in log_migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS {col} {col_type}"))
            except Exception:
                try:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE api_logs ADD COLUMN {col} {col_type}"))
                except Exception as e:
                    print(f"⚠️ api_logs migration skip ({col}): {e}")

        # Create alerts table
        try:
            from models import Alert
            Alert.__table__.create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug(f"Alerts table creation skip: {e}")

        # Create new feature tables (v2.0)
        for module_name, model_classes in [
            ("transform", ["TransformationRule"]),
            ("mock", ["MockEndpoint"]),
            ("custom_waf", ["CustomWafRule"]),
            ("webhooks", ["Webhook", "WebhookLog"]),
            ("teams", ["Team", "TeamMember"]),
            ("endpoint_config", ["EndpointConfig"]),
        ]:
            for cls_name in model_classes:
                try:
                    mod = __import__(module_name, fromlist=[cls_name])
                    cls = getattr(mod, cls_name)
                    cls.__table__.create(bind=engine, checkfirst=True)
                    print(f"✅ Table '{cls.__tablename__}' ensured")
                except Exception as e:
                    print(f"⚠️ Table creation skip ({cls_name}): {e}")

        # Create health_checks table
        try:
            from models import HealthCheck
            HealthCheck.__table__.create(bind=engine, checkfirst=True)
            print("✅ Table 'health_checks' ensured")
        except Exception as e:
            print(f"⚠️ Table creation skip (HealthCheck): {e}")

        # Create integrations table
        try:
            from models import Integration
            Integration.__table__.create(bind=engine, checkfirst=True)
            print("✅ Table 'integrations' ensured")
        except Exception as e:
            print(f"⚠️ Table creation skip (Integration): {e}")

        # Create api_endpoints table
        try:
            from models import ApiEndpoint
            ApiEndpoint.__table__.create(bind=engine, checkfirst=True)
            print("✅ Table 'api_endpoints' ensured")
        except Exception as e:
            print(f"⚠️ Table creation skip (ApiEndpoint): {e}")

        # ─── Create missing indexes on existing tables ────────────────────────
        index_migrations = [
            ("api_logs", "api_key_id", "ix_api_logs_api_key_id"),
            ("api_logs", "created_at", "ix_api_logs_created_at"),
            ("alerts", "user_id", "ix_alerts_user_id"),
            ("health_checks", "checked_at", "ix_health_checks_checked_at"),
        ]
        for table, col, idx_name in index_migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table} ({col})"))
                print(f"✅ Index {idx_name} ensured on {table}({col})")
            except Exception as e:
                logger.debug(f"Index migration skip ({idx_name}): {e}")

    except Exception as e:
        print(f"⚠️  DB init warning: {e}")

    # Start analytics engine
    try:
        from analytics import start_analytics
        start_analytics()
        print("✅ Analytics engine started")
    except Exception as e:
        print(f"⚠️  Analytics engine warning: {e}")

    # Log Env Check (Debug)
    from config import RESEND_API_KEY, FROM_EMAIL
    if RESEND_API_KEY:
        print(f"✅ RESEND_API_KEY found: {RESEND_API_KEY[:6]}... (length: {len(RESEND_API_KEY)})")
    else:
        print("❌ CRITICAL: RESEND_API_KEY is EMPTY in environment!")

    print(f"📧 FROM_EMAIL is set to: {FROM_EMAIL}")

    # Start health monitoring background thread
    try:
        health_monitor.start_health_monitor()
        print("✅ Health monitor started")
    except Exception as e:
        print(f"⚠️  Health monitor warning: {e}")

# ─── Security Headers Middleware ──────────────────────────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to every response."""
    # Check request body size (except for proxy route which has its own limit)
    if not request.url.path.startswith("/proxy/"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"error": f"Request body too large. Maximum size is {MAX_REQUEST_BODY_SIZE // (1024*1024)}MB"},
            )

    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # HSTS — only set in production (localhost would break without HTTPS)
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["X-Request-ID"] = os.urandom(16).hex()  # Request tracing

    # Remove server identity
    if "server" in response.headers:
        del response.headers["server"]
    if "x-powered-by" in response.headers:
        del response.headers["x-powered-by"]

    return response


# GZip Compression — reduce bandwidth by 70% (FREE optimization)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS — allow_credentials=True for HttpOnly cookies to work cross-origin
# IMPORTANT: Cannot use wildcard "*" origins with credentials — must use specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    from fastapi import HTTPException as _HTTPException
    if isinstance(exc, _HTTPException):
        raise exc
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"error": "Internal server error"})

# Health Endpoint (Public — minimal info only)
@app.get("/health")
def health():
    start_time = _time.time()
    db_ok = False
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass
    db_time = round((_time.time() - start_time) * 1000)
    uptime_s = _time.time() - _APP_START
    days = int(uptime_s // 86400)
    hours = int((uptime_s % 86400) // 3600)
    return {
        "status": "ok",
        "version": "2.0.0",
        "gateway": "Backport",
        "docs": "/docs",
        "database": "connected" if db_ok else "disconnected",
        "db_latency_ms": db_time,
        "uptime": f"{days}d {hours}h" if days > 0 else f"{hours}h",
    }

@app.get("/")
def root():
    return {
        "name": "Backport API Gateway",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "website": "https://backport.in",
    }

# Include Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(payment.router)
app.include_router(feedback.router)
app.include_router(admin.router)
app.include_router(proxy.router)
app.include_router(transform.router)
app.include_router(mock.router)
app.include_router(custom_waf.router)
app.include_router(webhooks.router)
app.include_router(teams.router)
app.include_router(endpoint_config.router)
app.include_router(ws.router)
app.include_router(health_monitor.router)
app.include_router(integrations.router)
app.include_router(api_docs.router)


# ─── Public Contact Sales Endpoint ─────────────────────────────────────────────
from pydantic import BaseModel, Field
from email_service import send_contact_sales_email
import time

# Rate limiting store for contact-sales: { ip: (first_request_time, count) }
_contact_sales_rate_limit: dict = {}
_contact_sales_lock = threading.Lock()
_CONTACT_SALES_MAX = 3
_CONTACT_SALES_WINDOW = 900  # 15 minutes


def _cleanup_contact_sales_rate_limit():
    """Remove stale entries from contact-sales rate limit store."""
    now = time.time()
    with _contact_sales_lock:
        stale = [ip for ip, (first_req, _) in _contact_sales_rate_limit.items()
                 if now - first_req >= _CONTACT_SALES_WINDOW]
        for ip in stale:
            del _contact_sales_rate_limit[ip]
    _timer = threading.Timer(600, _cleanup_contact_sales_rate_limit)
    _timer.daemon = True
    _timer.start()


_cleanup_contact_sales_rate_limit()

class ContactSalesRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    company: str = Field("", max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)

@app.post("/api/contact-sales")
def contact_sales(req: ContactSalesRequest, request: Request):
    """Public endpoint — anyone can submit an Enterprise inquiry. Sends email to admin."""
    # Rate limiting: max 3 submissions per IP per 15 minutes
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
    now = time.time()
    with _contact_sales_lock:
        if client_ip in _contact_sales_rate_limit:
            first_req, count = _contact_sales_rate_limit[client_ip]
            if now - first_req < _CONTACT_SALES_WINDOW:
                if count >= _CONTACT_SALES_MAX:
                    raise HTTPException(status_code=429, detail="Too many contact sales requests. Please try again later.")
                _contact_sales_rate_limit[client_ip] = (first_req, count + 1)
            else:
                _contact_sales_rate_limit[client_ip] = (now, 1)
        else:
            _contact_sales_rate_limit[client_ip] = (now, 1)

    sent = send_contact_sales_email(
        name=req.name.strip(),
        email=req.email.strip(),
        company=req.company.strip(),
        message=req.message.strip(),
    )
    if sent:
        return {"status": "success", "message": "Your inquiry has been sent. We'll get back to you soon!"}
    else:
        return {"status": "error", "message": "Could not send your inquiry right now. Please email sales@backportio.com directly."}


@app.on_event("shutdown")
async def shutdown():
    # Stop health monitor background thread
    try:
        health_monitor.stop_health_monitor()
        print("✅ Health monitor stopped")
    except Exception as e:
        logger.warning(f"Error stopping health monitor: {e}")

    # Close shared httpx connection pool
    try:
        from proxy import close_shared_client
        await close_shared_client()
        print("✅ Shared HTTP client closed")
    except Exception as e:
        logger.warning(f"Error closing shared HTTP client: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
