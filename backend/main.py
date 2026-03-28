import sys
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import models
import auth, user, payment, feedback, proxy, admin
from config import CORS_ORIGINS, ADMIN_EMAIL

print(f"✅ Starting Backport Gateway | Python {sys.version}")

app = FastAPI(
    title="Backport API Gateway",
    description="Open-source API Gateway providing enterprise-grade security — WAF, Rate Limiting, LRU Caching & Idempotency — with zero code changes to your backend.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={"name": "Backport", "url": "https://backport-io.vercel.app", "email": "support@backportio.com"},
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
            ("referral_code", "VARCHAR"),
            ("referred_by_id", "INTEGER"),
            ("referrals_count", "INTEGER DEFAULT 0"),
            ("total_paid_referrals", "INTEGER DEFAULT 0"),
            ("pending_referrals_count", "INTEGER DEFAULT 0"),
            ("has_received_first_reward", "BOOLEAN DEFAULT false"),
            # Email verification (new)
            ("is_verified", "BOOLEAN DEFAULT false"),
            ("email_verification_token", "VARCHAR"),
            ("email_verification_sent_at", "TIMESTAMP"),
            ("password_reset_token", "VARCHAR"),
            ("password_reset_sent_at", "TIMESTAMP"),
        ]
        
        from sqlalchemy import text
        for col, col_type in migration_all:
            try:
                # Use a fresh transaction for each column
                with engine.begin() as conn:
                    # PostgreSQL IF NOT EXISTS
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                print(f"✅ Migration: Column {col} ensures exists.")
            except Exception:
                # Fallback for SQLite (no IF NOT EXISTS)
                try:
                    with engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass

        # Make legacy api_key column nullable (was NOT NULL in old schema)
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ALTER COLUMN api_key DROP NOT NULL"))
            print("✅ Migration: api_key column made nullable")
        except Exception:
            pass  # Already nullable or SQLite

        # DISABLED: Legacy verified migration removed.
        # Previously caused new signups to be auto-verified on next restart.
        # All old users (pre-March-19) are already verified from previous runs.
        # New users go through the email verification flow properly.
        pass



        # Auto-set Admin — always run on startup
        with SessionLocal() as db:
            from models import User
            admin_user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
            if admin_user:
                admin_user.is_admin = True
                admin_user.is_verified = True  # Always keep admin verified
                db.commit()
                print(f"👑 Admin privileges + verified for {ADMIN_EMAIL}")

    except Exception as e:
        print(f"⚠️  DB init warning: {e}")

    # Log Env Check (Debug)
    from config import RESEND_API_KEY, FROM_EMAIL
    if RESEND_API_KEY:
        print(f"✅ RESEND_API_KEY found: {RESEND_API_KEY[:6]}... (length: {len(RESEND_API_KEY)})")
    else:
        print("❌ CRITICAL: RESEND_API_KEY is EMPTY in environment!")
    
    print(f"📧 FROM_EMAIL is set to: {FROM_EMAIL}")

# Standard FastAPI CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # We use Bearer tokens, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"error": "Internal server error"})

# 3. Health Endpoint (Public)
@app.get("/health")
def health():
    from proxy import _lru_cache, _rate_limits, WAF_PATTERNS
    return {
        "status": "ok",
        "version": "1.2.0",
        "gateway": "Backport",
        "docs": "/docs",
        "waf_patterns": len(WAF_PATTERNS),
        "cache_entries": len(_lru_cache),
        "active_rate_limits": len(_rate_limits),
    }

@app.get("/")
def root():
    return {
        "name": "Backport API Gateway",
        "version": "1.2.0",
        "docs": "/docs",
        "health": "/health",
        "website": "https://backport-io.vercel.app",
    }

# 4. Include Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(payment.router)
app.include_router(feedback.router)
app.include_router(admin.router)

# Proxy route MUST be included so it operates at /proxy/
app.include_router(proxy.router)

from starlette.middleware.base import BaseHTTPMiddleware

class PureCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "OPTIONS":
            response = JSONResponse(content="OK")
        else:
            try:
                response = await call_next(request)
            except Exception as e:
                import traceback
                traceback.print_exc()
                response = JSONResponse(
                    status_code=500, 
                    content={"error": "Internal server error"}
                )
        
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "false"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,X-API-Key"
        return response

app.add_middleware(PureCORSMiddleware)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)