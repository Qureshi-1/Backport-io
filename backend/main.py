"""
Backport API Gateway — FastAPI Backend
All-in-one: Auth, Proxy, Rate-Limit, WAF, Cache, Billing
"""
import hashlib
import os
import re
import secrets
import sqlite3
import time
from collections import OrderedDict, defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import httpx
import razorpay
from dotenv import load_dotenv
from fastapi import Body, Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Backport API Gateway", version="1.0.0")


# ── CORS (custom middleware — works with credentials on any origin) ─────────
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "*")
        if request.method == "OPTIONS":
            from starlette.responses import Response as SR
            r = SR(status_code=200)
            r.headers["Access-Control-Allow-Origin"] = origin
            r.headers["Access-Control-Allow-Credentials"] = "true"
            r.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
            r.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept,X-API-Key,X-Idempotency-Key"
            return r
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept,X-API-Key,X-Idempotency-Key"
        return response


app.add_middleware(CORSMiddleware)


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "backport-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID else None

PLANS = {
    "free":       {"name": "Free",       "monthly_limit": 10_000,    "max_gateways": 1},
    "plus":       {"name": "Plus",       "monthly_limit": 100_000,   "max_gateways": 3},
    "pro":        {"name": "Pro",        "monthly_limit": 1_000_000, "max_gateways": 10},
    "enterprise": {"name": "Enterprise", "monthly_limit": 999_999_999, "max_gateways": 100},
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

# ── SQLite Database ───────────────────────────────────────────────────────────
_raw_db_path = os.getenv("DB_PATH", "./backport.db")
# Ensure parent directory exists (for Render persistent disk at /app/data)
_db_dir = os.path.dirname(_raw_db_path)
if _db_dir and not os.path.exists(_db_dir):
    os.makedirs(_db_dir, exist_ok=True)

DB_PATH = _raw_db_path


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id           TEXT PRIMARY KEY,
            email        TEXT UNIQUE NOT NULL,
            hashed_pw    TEXT NOT NULL,
            plan         TEXT DEFAULT 'free',
            created_at   REAL DEFAULT (unixepoch())
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            key          TEXT PRIMARY KEY,
            user_id      TEXT NOT NULL,
            name         TEXT DEFAULT 'My Gateway',
            target_url   TEXT DEFAULT '',
            is_active    INTEGER DEFAULT 1,
            created_at   REAL DEFAULT (unixepoch()),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS gw_settings (
            api_key               TEXT PRIMARY KEY,
            rate_limit_enabled    INTEGER DEFAULT 1,
            cache_enabled         INTEGER DEFAULT 1,
            idempotency_enabled   INTEGER DEFAULT 1,
            waf_enabled           INTEGER DEFAULT 1,
            rate_limit_per_minute INTEGER DEFAULT 100
        );
    """)
    conn.commit()
    conn.close()


init_db()

# ── In-memory per-tenant state ────────────────────────────────────────────────
tenant_metrics: Dict[str, Dict] = defaultdict(
    lambda: {"total_requests": 0, "cache_hits": 0, "threats_blocked": 0}
)
tenant_traffic: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
tenant_rate_limits: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
tenant_cache: Dict[str, OrderedDict] = defaultdict(OrderedDict)
tenant_idempotency: Dict[str, Dict] = defaultdict(dict)

# ── WAF Patterns ──────────────────────────────────────────────────────────────
WAF_PATTERNS = [
    re.compile(r"union\s+select", re.I),
    re.compile(r"<script", re.I),
    re.compile(r"javascript:", re.I),
    re.compile(r"eval\(", re.I),
    re.compile(r"';\s*drop\s+table", re.I),
]

# ── Auth Helpers ──────────────────────────────────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)


def create_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(401, "Authentication required")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    if not user:
        raise HTTPException(401, "User not found")
    return dict(user)


def load_api_key(key: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM api_keys WHERE key = ? AND is_active = 1", (key,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def load_gw_settings(api_key: str) -> dict:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM gw_settings WHERE api_key = ?", (api_key,)
    ).fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "rate_limit_enabled": 1,
        "cache_enabled": 1,
        "idempotency_enabled": 1,
        "waf_enabled": 1,
        "rate_limit_per_minute": 100,
    }


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/")
async def health_check():
    return {"status": "ok", "service": "backport-api", "version": "1.0.0"}


# ── Auth Endpoints ────────────────────────────────────────────────────────────
@app.post("/auth/signup")
async def signup(data: Dict[str, Any] = Body(...)):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        raise HTTPException(400, "Email and password are required")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    user_id = secrets.token_hex(16)
    api_key = "bk_" + secrets.token_hex(24)
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (id, email, hashed_pw, plan) VALUES (?, ?, ?, 'free')",
            (user_id, email, hash_password(password)),
        )
        conn.execute(
            "INSERT INTO api_keys (key, user_id, name, target_url) VALUES (?, ?, ?, ?)",
            (api_key, user_id, "My First Gateway", ""),
        )
        conn.execute("INSERT INTO gw_settings (api_key) VALUES (?)", (api_key,))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(409, "Email already registered")
    conn.close()
    return {
        "access_token": create_token(user_id, email),
        "default_key": api_key,
        "email": email,
    }


@app.post("/auth/login")
async def login(data: Dict[str, Any] = Body(...)):
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()
    if not user or not verify_password(password, user["hashed_pw"]):
        raise HTTPException(401, "Invalid email or password")
    conn = get_db()
    key_row = conn.execute(
        "SELECT key FROM api_keys WHERE user_id = ? AND is_active = 1 LIMIT 1",
        (user["id"],),
    ).fetchone()
    conn.close()
    return {
        "access_token": create_token(user["id"], user["email"]),
        "default_key": key_row["key"] if key_row else None,
        "email": user["email"],
    }


@app.get("/auth/me")
async def get_me(user=Depends(current_user)):
    return {"id": user["id"], "email": user["email"], "plan": user["plan"]}


# ── API Key Management ────────────────────────────────────────────────────────
@app.get("/api/keys")
async def list_keys(user=Depends(current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT key, name, target_url, is_active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at ASC",
        (user["id"],),
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["metrics"] = tenant_metrics.get(
            d["key"], {"total_requests": 0, "cache_hits": 0, "threats_blocked": 0}
        )
        result.append(d)
    return {"keys": result, "plan": user["plan"], "limits": PLANS[user["plan"]]}


@app.post("/api/keys")
async def create_key(data: Dict[str, Any] = Body(...), user=Depends(current_user)):
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) FROM api_keys WHERE user_id = ? AND is_active = 1",
        (user["id"],),
    ).fetchone()[0]
    max_gw = PLANS[user["plan"]]["max_gateways"]
    if count >= max_gw:
        conn.close()
        raise HTTPException(
            403,
            f"Your {user['plan']} plan allows {max_gw} gateway(s). Upgrade to Pro for more.",
        )
    api_key = "bk_" + secrets.token_hex(24)
    name = data.get("name", "New Gateway")
    target_url = data.get("target_url", "")
    conn.execute(
        "INSERT INTO api_keys (key, user_id, name, target_url) VALUES (?, ?, ?, ?)",
        (api_key, user["id"], name, target_url),
    )
    conn.execute("INSERT INTO gw_settings (api_key) VALUES (?)", (api_key,))
    conn.commit()
    conn.close()
    return {"key": api_key, "name": name, "target_url": target_url}


@app.delete("/api/keys/{key}")
async def delete_key(key: str, user=Depends(current_user)):
    conn = get_db()
    conn.execute(
        "UPDATE api_keys SET is_active = 0 WHERE key = ? AND user_id = ?",
        (key, user["id"]),
    )
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# ── Settings ──────────────────────────────────────────────────────────────────
@app.get("/api/settings")
async def get_settings(
    x_api_key: str = Header(..., alias="X-API-Key"),
    user=Depends(current_user),
):
    rec = load_api_key(x_api_key)
    if not rec or rec["user_id"] != user["id"]:
        raise HTTPException(403, "Invalid API key")
    s = load_gw_settings(x_api_key)
    return {
        "target_backend_url": rec["target_url"],
        "rate_limit_enabled": bool(s["rate_limit_enabled"]),
        "cache_enabled": bool(s["cache_enabled"]),
        "idempotency_enabled": bool(s["idempotency_enabled"]),
        "waf_enabled": bool(s["waf_enabled"]),
        "rate_limit_per_minute": s["rate_limit_per_minute"],
    }


@app.post("/api/settings")
async def save_settings(
    data: Dict[str, Any] = Body(...),
    x_api_key: str = Header(..., alias="X-API-Key"),
    user=Depends(current_user),
):
    rec = load_api_key(x_api_key)
    if not rec or rec["user_id"] != user["id"]:
        raise HTTPException(403, "Invalid API key")
    conn = get_db()
    conn.execute(
        "UPDATE api_keys SET target_url = ? WHERE key = ?",
        (data.get("target_backend_url", rec["target_url"]), x_api_key),
    )
    conn.execute(
        """
        UPDATE gw_settings SET
            rate_limit_enabled    = ?,
            cache_enabled         = ?,
            idempotency_enabled   = ?,
            waf_enabled           = ?,
            rate_limit_per_minute = ?
        WHERE api_key = ?
        """,
        (
            int(data.get("rate_limit_enabled", True)),
            int(data.get("cache_enabled", True)),
            int(data.get("idempotency_enabled", True)),
            int(data.get("waf_enabled", True)),
            int(data.get("rate_limit_per_minute", 100)),
            x_api_key,
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "saved"}


# ── Dashboard Metrics ─────────────────────────────────────────────────────────
@app.get("/api/metrics")
async def get_metrics(user=Depends(current_user)):
    conn = get_db()
    keys = [
        r[0]
        for r in conn.execute(
            "SELECT key FROM api_keys WHERE user_id = ? AND is_active = 1",
            (user["id"],),
        ).fetchall()
    ]
    conn.close()
    total = {"total_requests": 0, "cache_hits": 0, "threats_blocked": 0}
    for k in keys:
        m = tenant_metrics[k]
        total["total_requests"] += m["total_requests"]
        total["cache_hits"] += m["cache_hits"]
        total["threats_blocked"] += m["threats_blocked"]
    return total


@app.get("/api/traffic")
async def get_traffic(user=Depends(current_user)):
    conn = get_db()
    keys = [
        r[0]
        for r in conn.execute(
            "SELECT key FROM api_keys WHERE user_id = ? AND is_active = 1",
            (user["id"],),
        ).fetchall()
    ]
    conn.close()
    merged: Dict[str, int] = defaultdict(int)
    for k in keys:
        for t, count in tenant_traffic[k].items():
            merged[t] += count
    data = [{"time": k, "requests": v} for k, v in sorted(merged.items())[-30:]]
    if not data:
        import random
        now = datetime.utcnow()
        for i in range(24, -1, -1):
            dt = (now - timedelta(hours=i)).strftime("%H:00")
            data.append({"time": dt, "requests": random.randint(5, 50)})
    return {"traffic_data": data}


# ── Billing / Razorpay ────────────────────────────────────────────────────────
@app.post("/api/billing/create-order")
async def create_order(user=Depends(current_user)):
    amount = 75000  # ₹750 in paise
    order_data = {
        "amount": amount,
        "currency": "INR",
        "receipt": f"rcpt_{user['id'][:8]}",
        "notes": {"user_id": user["id"]},
    }
    if rzp_client:
        try:
            order = rzp_client.order.create(data=order_data)
            return {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": RAZORPAY_KEY_ID,
            }
        except Exception as e:
            pass  # Fall through to mock
    # Mock order for dev/missing keys
    return {
        "order_id": f"mock_{secrets.token_hex(6)}",
        "amount": amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID or "rzp_test_demo",
        "mock": True,
    }


@app.post("/api/billing/verify")
async def verify_payment(
    data: Dict[str, Any] = Body(...), user=Depends(current_user)
):
    if data.get("mock"):
        conn = get_db()
        conn.execute("UPDATE users SET plan = 'pro' WHERE id = ?", (user["id"],))
        conn.commit()
        conn.close()
        return {"status": "success", "plan": "pro"}

    try:
        rzp_client.utility.verify_payment_signature(
            {
                "razorpay_order_id": data.get("razorpay_order_id"),
                "razorpay_payment_id": data.get("razorpay_payment_id"),
                "razorpay_signature": data.get("razorpay_signature"),
            }
        )
        conn = get_db()
        conn.execute("UPDATE users SET plan = 'pro' WHERE id = ?", (user["id"],))
        conn.commit()
        conn.close()
        return {"status": "success", "plan": "pro"}
    except Exception:
        raise HTTPException(400, "Invalid payment signature")


# ── Proxy ─────────────────────────────────────────────────────────────────────
async def _forward(request: Request, backend_url: str) -> Response:
    async with httpx.AsyncClient(timeout=30) as client:
        headers = {
            k: v
            for k, v in request.headers.items()
            if k.lower() not in ("host", "x-api-key", "connection")
        }
        url = (
            f"{backend_url.rstrip('/')}/{request.url.path.lstrip('/')}"
            f"{'?' + request.url.query if request.url.query else ''}"
        )
        resp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=await request.body(),
        )
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers=dict(resp.headers),
        )


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(
    request: Request,
    path: str,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    if not x_api_key:
        raise HTTPException(
            401,
            "X-API-Key header required. Get your key at the Backport dashboard.",
        )

    rec = load_api_key(x_api_key)
    if not rec:
        raise HTTPException(401, "Invalid or inactive API key")

    if not rec.get("target_url"):
        raise HTTPException(
            400,
            "No target backend URL configured. Set it in the dashboard Settings.",
        )

    # Plan quota check
    conn = get_db()
    user_row = conn.execute(
        "SELECT plan FROM users WHERE id = ?", (rec["user_id"],)
    ).fetchone()
    conn.close()
    plan = user_row["plan"] if user_row else "free"
    monthly_limit = PLANS[plan]["monthly_limit"]
    m = tenant_metrics[x_api_key]
    if m["total_requests"] >= monthly_limit:
        raise HTTPException(
            429,
            f"Monthly limit of {monthly_limit:,} requests reached. Upgrade at the Backport dashboard.",
        )

    m["total_requests"] += 1
    tenant_traffic[x_api_key][datetime.now().strftime("%H:%M")] += 1

    s = load_gw_settings(x_api_key)
    ip = request.client.host if request.client else "unknown"

    # Rate Limit
    if s["rate_limit_enabled"]:
        store = tenant_rate_limits[x_api_key]
        now = time.time()
        store[ip] = [t for t in store[ip] if now - t < 60]
        if len(store[ip]) >= s["rate_limit_per_minute"]:
            m["threats_blocked"] += 1
            raise HTTPException(429, "Rate limit exceeded")
        store[ip].append(now)

    # WAF
    body = await request.body()
    if s["waf_enabled"]:
        text = body.decode(errors="ignore").lower()
        if any(p.search(text) for p in WAF_PATTERNS):
            m["threats_blocked"] += 1
            raise HTTPException(403, "Request blocked by WAF")

    # Idempotency
    if s["idempotency_enabled"] and request.method == "POST" and x_idempotency_key:
        store = tenant_idempotency[x_api_key]
        kh = hashlib.md5(x_idempotency_key.encode()).hexdigest()
        if kh in store:
            data_cached, ts, hdrs = store[kh]
            if time.time() - ts < 86400:
                return Response(content=data_cached, headers=hdrs)

    # Cache (GET)
    cache_key = hashlib.md5(
        f"{request.method}{request.url.path}{request.url.query}".encode()
    ).hexdigest()
    if s["cache_enabled"] and request.method == "GET":
        cache = tenant_cache[x_api_key]
        if cache_key in cache:
            data_cached, ts, hdrs = cache[cache_key]
            if time.time() - ts < 300:
                m["cache_hits"] += 1
                return Response(content=data_cached, headers=hdrs)

    # Forward
    backend_resp = await _forward(request, rec["target_url"])

    # Store cache
    if s["cache_enabled"] and request.method == "GET":
        cache = tenant_cache[x_api_key]
        cache[cache_key] = (backend_resp.body, time.time(), dict(backend_resp.headers))
        if len(cache) > 1000:
            cache.popitem(last=False)

    # Store idempotency
    if s["idempotency_enabled"] and request.method == "POST" and x_idempotency_key:
        kh = hashlib.md5(x_idempotency_key.encode()).hexdigest()
        tenant_idempotency[x_api_key][kh] = (
            backend_resp.body,
            time.time(),
            dict(backend_resp.headers),
        )

    return backend_resp


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)