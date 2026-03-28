import httpx
import re
import time
from fastapi import APIRouter, Request, Response, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from dependencies import get_proxy_user, get_db
from models import User, ApiLog

router = APIRouter()

# ─── IN-MEMORY STORES ────────────────────────────────────────────────────────
# NOTE: These reset on server restart. Phase 2 will use Redis for persistence.
# This is acceptable for current scale (single-instance on Render).
_lru_cache: dict = {}         # { "user_id:url": (timestamp, status, content, headers) }
_rate_limits: dict = {}       # { user_id: [timestamps] }
_idempotency_keys: dict = {}  # { "user_id:idemp_key": (status, content, headers) }

MAX_CACHE_ENTRIES = 1000      # Prevent unbounded memory growth
MAX_IDEMPOTENCY_ENTRIES = 5000

# ─── WAF PATTERNS (Regex-based) ──────────────────────────────────────────────
# These patterns detect common attack vectors. Compiled once for performance.
WAF_PATTERNS = [
    # SQL Injection
    re.compile(r"(\b(union\s+(all\s+)?select|insert\s+into|update\s+.*\bset\b|delete\s+from|drop\s+(table|database|column)|alter\s+table|create\s+table|truncate\s+table)\b)", re.IGNORECASE),
    re.compile(r"(\b(select\s+.*\bfrom\b|exec\s*\(|execute\s*\(|xp_cmdshell|sp_executesql)\b)", re.IGNORECASE),
    re.compile(r"(--|#|/\*.*\*/|;\s*(drop|alter|create|truncate|delete|update|insert))", re.IGNORECASE),
    re.compile(r"('\s*(or|and)\s+[\d'\"=]+)", re.IGNORECASE),
    re.compile(r"(\b(1\s*=\s*1|1\s*=\s*'1'|'1'\s*=\s*'1')\b)", re.IGNORECASE),

    # XSS (Cross-Site Scripting)
    re.compile(r"(<\s*script[^>]*>|<\s*/\s*script\s*>)", re.IGNORECASE),
    re.compile(r"(on(error|load|click|mouseover|focus|blur|submit|change|input|keyup|keydown)\s*=)", re.IGNORECASE),
    re.compile(r"(javascript\s*:|vbscript\s*:|data\s*:text/html)", re.IGNORECASE),
    re.compile(r"(<\s*(iframe|object|embed|form|img\s+[^>]*onerror)[^>]*>)", re.IGNORECASE),

    # Path Traversal
    re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.%2e/|%2e\./)", re.IGNORECASE),
    re.compile(r"(/etc/(passwd|shadow|hosts)|/proc/self/|/dev/null)", re.IGNORECASE),

    # Command Injection
    re.compile(r"(;\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|ruby|nc|netcat)\b)", re.IGNORECASE),
    re.compile(r"(\|\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|ruby|nc)\b)", re.IGNORECASE),
    re.compile(r"(`[^`]*`|\$\([^)]*\))", re.IGNORECASE),

    # LDAP Injection
    re.compile(r"([)(|*\\].*=.*[)(|*\\])", re.IGNORECASE),

    # XML/XXE Injection
    re.compile(r"(<!DOCTYPE[^>]*\bSYSTEM\b|<!ENTITY)", re.IGNORECASE),
]

# ─── Plan-based rate limits ──────────────────────────────────────────────────
PLAN_RATE_LIMITS = {
    "free": 60,     # 60 req/min
    "plus": 300,    # 300 req/min
    "pro": 1000,    # 1000 req/min
}


def check_waf(body_str: str, path_lower: str, query_str: str) -> bool:
    """Check all WAF patterns against request data. Returns True if malicious."""
    combined = f"{body_str} {path_lower} {query_str}"
    for pattern in WAF_PATTERNS:
        if pattern.search(combined):
            return True
    return False


def cleanup_stores():
    """Evict expired entries to prevent memory leaks."""
    global _lru_cache, _idempotency_keys
    now = time.time()

    # Evict expired cache entries (>5 min)
    if len(_lru_cache) > MAX_CACHE_ENTRIES:
        expired = [k for k, v in _lru_cache.items() if now - v[0] > 300]
        for k in expired:
            del _lru_cache[k]
        # If still too big, remove oldest
        if len(_lru_cache) > MAX_CACHE_ENTRIES:
            sorted_keys = sorted(_lru_cache, key=lambda k: _lru_cache[k][0])
            for k in sorted_keys[:len(sorted_keys) // 2]:
                del _lru_cache[k]

    # Cap idempotency store
    if len(_idempotency_keys) > MAX_IDEMPOTENCY_ENTRIES:
        # Remove oldest half
        keys_list = list(_idempotency_keys.keys())
        for k in keys_list[:len(keys_list) // 2]:
            del _idempotency_keys[k]


# ─── PROXY ROUTE ─────────────────────────────────────────────────────────────
@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_route(request: Request, path: str, background_tasks: BackgroundTasks, data: tuple = Depends(get_proxy_user), db: Session = Depends(get_db)):
    user, api_key_obj = data
    start_time = time.time()

    # 1. WAF Check
    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8', errors='ignore').lower()
    path_lower = path.lower()
    query_str = (request.url.query or "").lower()

    if getattr(user, "waf_enabled", False):
        if check_waf(body_str, path_lower, query_str):
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 403, latency, False)
            raise HTTPException(status_code=403, detail="WAF Blocked: Malicious payload detected")

    # 2. Rate Limiting (plan-based)
    if getattr(user, "rate_limit_enabled", True):
        now = time.time()
        user_reqs = _rate_limits.get(user.id, [])
        user_reqs = [t for t in user_reqs if now - t < 60]
        max_rpm = PLAN_RATE_LIMITS.get(user.plan, 60)
        if len(user_reqs) >= max_rpm:
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 429, latency, False)
            raise HTTPException(status_code=429, detail=f"Rate Limit Exceeded: Max {max_rpm} requests/minute on {user.plan.title()} plan")
        user_reqs.append(now)
        _rate_limits[user.id] = user_reqs

    target_url = user.target_backend_url
    if not target_url:
        raise HTTPException(status_code=400, detail="Target backend URL not configured. Set it in your dashboard settings.")

    target_url = target_url.rstrip("/")
    path = path.lstrip("/")
    query = request.url.query
    full_target_url = f"{target_url}/{path}{'?' + query if query else ''}"

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("x-api-key", None)

    # Idempotency Header
    idempotency_key = headers.pop("idempotency-key", None)
    idempotency_store_key = f"{user.id}:{idempotency_key}" if idempotency_key else None

    # 3. Cache Check (GET only)
    cache_key = f"{user.id}:{full_target_url}"
    if request.method == "GET" and getattr(user, "caching_enabled", False):
        if cache_key in _lru_cache:
            cache_ts, c_status, c_content, c_headers = _lru_cache[cache_key]
            if time.time() - cache_ts < 300:  # 5 minute TTL
                latency = int((time.time() - start_time) * 1000)
                background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", c_status, latency, True)
                safe_headers = {k: v for k, v in c_headers.items() if k.lower() not in ("transfer-encoding", "content-encoding", "content-length")}
                safe_headers["X-Backport-Cache"] = "HIT"
                return Response(content=c_content, status_code=c_status, headers=safe_headers)

    # 4. Idempotency Check (POST/PUT/PATCH only)
    if idempotency_store_key and getattr(user, "idempotency_enabled", True) and request.method in ["POST", "PUT", "PATCH"]:
        if idempotency_store_key in _idempotency_keys:
            c_status, c_content, c_headers = _idempotency_keys[idempotency_store_key]
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", c_status, latency, True)
            safe_headers = {k: v for k, v in c_headers.items() if k.lower() not in ("transfer-encoding", "content-encoding", "content-length")}
            safe_headers["X-Backport-Idempotent"] = "REPLAY"
            return Response(content=c_content, status_code=c_status, headers=safe_headers)

    # 5. Forward Request
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method=request.method,
                url=full_target_url,
                headers=headers,
                content=body_bytes,
            )

            resp_headers = dict(resp.headers)
            # Remove hop-by-hop headers that break HTTP responses
            for h in ("transfer-encoding", "content-encoding", "content-length"):
                resp_headers.pop(h, None)

            # Add security headers
            resp_headers["X-Content-Type-Options"] = "nosniff"
            resp_headers["X-Frame-Options"] = "DENY"
            resp_headers["X-Backport-Latency"] = f"{int((time.time() - start_time) * 1000)}ms"

            # Save to Cache
            if request.method == "GET" and getattr(user, "caching_enabled", False) and resp.status_code == 200:
                _lru_cache[cache_key] = (time.time(), resp.status_code, resp.content, resp_headers)
                resp_headers["X-Backport-Cache"] = "MISS"

            # Save to Idempotency Store
            if idempotency_store_key and getattr(user, "idempotency_enabled", True):
                _idempotency_keys[idempotency_store_key] = (resp.status_code, resp.content, resp_headers)

            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", resp.status_code, latency, False)

            # Periodic cleanup
            if len(_lru_cache) > MAX_CACHE_ENTRIES or len(_idempotency_keys) > MAX_IDEMPOTENCY_ENTRIES:
                background_tasks.add_task(cleanup_stores)

            return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
    except httpx.TimeoutException:
        latency = int((time.time() - start_time) * 1000)
        background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 504, latency, False)
        raise HTTPException(status_code=504, detail="Gateway Timeout: Backend did not respond within 30 seconds")
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 502, latency, False)
        raise HTTPException(status_code=502, detail="Bad Gateway: Error communicating with target backend")


def save_log(user_id: int, api_key_id: int, method: str, path: str, status_code: int, latency_ms: int, was_cached: bool):
    from database import SessionLocal
    db = SessionLocal()
    try:
        log = ApiLog(user_id=user_id, api_key_id=api_key_id, method=method, path=path, status_code=status_code, latency_ms=latency_ms, was_cached=was_cached)
        db.add(log)
        db.commit()
    except Exception:
        pass  # Log failures should never crash the gateway
    finally:
        db.close()
