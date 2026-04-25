import httpx
import re
import time
import json
import ipaddress
import logging
from urllib.parse import urlparse
from fastapi import APIRouter, Request, Response, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from dependencies import get_proxy_user, get_db, get_effective_plan
from models import User, ApiLog

logger = logging.getLogger(__name__)

# These will be imported at function level to avoid circular imports

router = APIRouter()

# ─── SHARED HTTP CLIENT (Connection Pooling) ─────────────────────────────────
_shared_client: httpx.AsyncClient | None = None


def get_shared_client() -> httpx.AsyncClient:
    """Return a lazily-initialized shared httpx.AsyncClient with connection pooling."""
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=30,
            limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
        )
    return _shared_client


async def close_shared_client():
    """Close the shared httpx client (call on app shutdown)."""
    global _shared_client
    if _shared_client is not None and not _shared_client.is_closed:
        await _shared_client.aclose()
        _shared_client = None

# ─── UNIFIED CACHE (Redis/Upstash + in-memory fallback) ───────────────────────
from cache import cache as _cache
import json as _json

# Keep minimal in-memory stores for non-serializable data (response headers)
_lru_headers: dict = {}       # { cache_key: (timestamp, headers) }
_idempotency_store: dict = {} # { store_key: (status, content, headers) }
MAX_IDEMPOTENCY_ENTRIES = 5000
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024  # 10MB max request body

# ─── SSRF Protection: Blocked IP ranges ───────────────────────────────────────
BLOCKED_IP_RANGES = [
    ipaddress.ip_network("127.0.0.0/8"),       # Loopback
    ipaddress.ip_network("10.0.0.0/8"),        # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),     # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),    # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),    # Link-local (AWS metadata)
    ipaddress.ip_network("0.0.0.0/8"),          # "This" network (RFC 1122)
    ipaddress.ip_network("100.64.0.0/10"),     # Carrier-grade NAT
    ipaddress.ip_network("198.18.0.0/15"),     # Benchmark testing
    ipaddress.ip_network("::1/128"),            # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),          # IPv6 private
    ipaddress.ip_network("fe80::/10"),         # IPv6 link-local
    ipaddress.ip_network("::ffff:0:0/96"),     # IPv4-mapped IPv6
]

BLOCKED_HOSTNAMES = [
    "localhost", "metadata.google.internal", "metadata.google.com",
    "169.254.169.254", "instance-data", "metadata",
]

ALLOWED_SCHEMES = {"http", "https"}

# ─── WAF PATTERNS (Regex-based) ──────────────────────────────────────────────
# NOTE: SQLi patterns use regex-based detection.
# TODO: Replace with libinjection-based detection in a future release for better accuracy.
#
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
    re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/|\.%2e/|%2e\./|..%2f)", re.IGNORECASE),
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
    "free": 100,       # 100 req/min (increased from 60)
    "plus": 500,       # 500 req/min
    "pro": 5000,       # 5000 req/min (massive upgrade)
    "enterprise": 10000,  # 10000 req/min
}


def _is_url_safe(url: str) -> tuple[bool, str]:
    """Validate that a target backend URL is not pointing to internal/private resources."""
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Invalid URL format"

    if parsed.scheme not in ALLOWED_SCHEMES:
        return False, f"URL scheme '{parsed.scheme}' is not allowed. Use http:// or https://"

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must have a valid hostname"

    # Check blocked hostnames
    hostname_lower = hostname.lower()
    for blocked in BLOCKED_HOSTNAMES:
        if blocked in hostname_lower:
            return False, f"Access to '{hostname}' is not allowed"

    # Resolve and check IP
    try:
        import socket
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), socket.AF_UNSPEC)
        for family, socktype, proto, canonname, sockaddr in addr_info:
            ip = ipaddress.ip_address(sockaddr[0])
            for network in BLOCKED_IP_RANGES:
                if ip in network:
                    return False, f"Access to internal/private IP addresses is not allowed"
    except socket.gaierror:
        return False, f"Could not resolve hostname '{hostname}'"
    except Exception:
        return False, "Failed to validate target URL"

    return True, ""


def check_waf(body_str: str, path_lower: str, query_str: str) -> bool:
    """Check all WAF patterns against request data. Returns True if malicious."""
    combined = f"{body_str} {path_lower} {query_str}"
    for pattern in WAF_PATTERNS:
        if pattern.search(combined):
            return True
    return False


def cleanup_stores():
    """Evict expired entries to prevent memory leaks."""
    now = time.time()

    # Evict expired cache headers (>5 min)
    expired = [k for k, v in _lru_headers.items() if now - v[0] > 300]
    for k in expired:
        del _lru_headers[k]

    # Cap idempotency store — remove oldest half
    if len(_idempotency_store) > MAX_IDEMPOTENCY_ENTRIES:
        keys_list = list(_idempotency_store.keys())
        for k in keys_list[: len(keys_list) // 2]:
            del _idempotency_store[k]


def _trigger_event_webhook(user_id: int, event_type: str, details: dict):
    """Fire-and-forget webhook trigger for events."""
    try:
        from webhooks import trigger_webhooks
        from database import SessionLocal
        db = SessionLocal()
        try:
            trigger_webhooks(db, user_id, event_type, details)
        finally:
            db.close()
    except ImportError:
        logger.debug("Webhooks module not available for event trigger")
    except Exception as e:
        logger.warning(f"Failed to trigger event webhook: {e}")


# ─── PROXY ROUTE ─────────────────────────────────────────────────────────────
@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_route(request: Request, path: str, background_tasks: BackgroundTasks, data: tuple = Depends(get_proxy_user), db: Session = Depends(get_db)):
    user, api_key_obj = data
    start_time = time.time()

    # Check request body size
    body_bytes = await request.body()
    if len(body_bytes) > MAX_REQUEST_BODY_SIZE:
        raise HTTPException(status_code=413, detail=f"Request body too large. Maximum size is {MAX_REQUEST_BODY_SIZE // (1024*1024)}MB")

    # Extract enhanced logging data
    ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else "")
    filtered_headers = {k: v for k, v in request.headers.items() if k.lower() not in ("authorization", "cookie", "host")}
    request_headers_str = json.dumps(filtered_headers) if filtered_headers else "{}"
    body_str = body_bytes.decode('utf-8', errors='ignore').lower()
    query_params_str = request.url.query or ""

    # 1. WAF Check
    path_lower = path.lower()
    query_str = (request.url.query or "").lower()

    if getattr(user, "waf_enabled", False):
        if check_waf(body_str, path_lower, query_str):
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 403, latency, False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
            _trigger_event_webhook(user.id, "waf_block", {"path": f"/{path}", "ip": ip_address})
            # Send Slack/Discord integration alert
            try:
                from integrations import send_integration_alert
                send_integration_alert(user.id, "waf_block", {"Path": f"/{path}", "IP": ip_address})
            except Exception as e:
                logger.warning(f"Failed to send WAF block integration alert: {e}")
            raise HTTPException(status_code=403, detail="WAF Blocked: Malicious payload detected")

    # 3.5. Custom WAF Check (user-defined rules)
    try:
        from custom_waf import check_custom_waf
        custom_blocked, matched_rules = check_custom_waf(user.id, body_str, path_lower, query_str, db)
        if custom_blocked:
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user_id=user.id, api_key_id=api_key_obj.id, method=request.method, path=f"/{path}", status_code=403, latency_ms=latency, was_cached=False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
            raise HTTPException(status_code=403, detail="Custom WAF rule triggered: " + ", ".join(matched_rules))
    except ImportError:
        logger.debug("Custom WAF module not yet available")

    # 2. Rate Limiting (plan-based, with per-endpoint override)
    if getattr(user, "rate_limit_enabled", True):
        now = time.time()

        # Determine effective plan (check expiry before applying plan-based limits)
        effective_plan = get_effective_plan(user)

        rate_key = f"rl:{user.id}:{now // 60}"  # 1-min bucket per user
        current_count = _cache.incr(rate_key)
        if current_count == 1:
            _cache.set(rate_key, "1", ttl=60)  # Auto-expire after 1 min
        max_rpm = PLAN_RATE_LIMITS.get(effective_plan, 60)
        endpoint_matched = False

        # Per-endpoint rate limiting check
        try:
            from endpoint_config import EndpointConfig, match_endpoint_config
            from database import SessionLocal as _SessionLocal
            _db = _SessionLocal()
            try:
                endpoint_configs = _db.query(EndpointConfig).filter(
                    EndpointConfig.user_id == user.id,
                    EndpointConfig.is_enabled == True
                ).all()
                matched_config = match_endpoint_config(f"/{path}", endpoint_configs)
                if matched_config:
                    max_rpm = matched_config.max_rpm
                    endpoint_matched = True
            finally:
                _db.close()
        except ImportError:
            logger.debug("Endpoint config module not yet available")

        if current_count >= max_rpm:
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 429, latency, False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
            _trigger_event_webhook(user.id, "rate_limit", {"path": f"/{path}", "plan": effective_plan})
            # Send Slack/Discord integration alert
            try:
                from integrations import send_integration_alert
                send_integration_alert(user.id, "rate_limit_exceeded", {"Path": f"/{path}", "Plan": effective_plan.title(), "Max RPM": str(max_rpm)})
            except Exception as e:
                logger.warning(f"Failed to send rate limit integration alert: {e}")
            raise HTTPException(status_code=429, detail=f"Rate Limit Exceeded: Max {max_rpm} requests/minute on {effective_plan.title()} plan" + (" (endpoint override)" if endpoint_matched else ""))

        # WebSocket: Rate limit approaching warning (80% of limit)
        if current_count >= int(max_rpm * 0.8):
            try:
                from ws import manager
                manager.broadcast_from_thread(user.id, {
                    "type": "rate_limit_warning",
                    "current_rpm": current_count,
                    "max_rpm": max_rpm,
                    "percentage": round(current_count / max_rpm * 100, 1),
                    "endpoint_override": endpoint_matched,
                    "path": f"/{path}",
                })
            except Exception as e:
                logger.debug(f"Failed to broadcast rate limit warning via WebSocket: {e}")

    # Allow playground / SDK to override target URL via header
    override_target = request.headers.get("x-target-url")
    target_url = override_target or user.target_backend_url

    # If no target URL configured, try mock response first
    if not target_url:
        try:
            from mock import get_mock_response
            mock_data = get_mock_response(user.id, request.method, f"/{path}", db)
            if mock_data:
                mock_status, mock_body, mock_headers = mock_data
                if isinstance(mock_body, str):
                    try:
                        import json as _json
                        mock_body = _json.loads(mock_body)
                    except Exception:
                        pass
                latency = int((time.time() - start_time) * 1000)
                background_tasks.add_task(save_log, user_id=user.id, api_key_id=api_key_obj.id, method=request.method, path=f"/{path}", status_code=mock_status, latency_ms=latency, was_cached=False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
                safe_headers = {k: v for k, v in (mock_headers or {}).items() if k.lower() not in ("transfer-encoding", "content-length")}
                safe_headers["X-Backport-Mock"] = "true"
                if isinstance(mock_body, (dict, list)):
                    import json as _json
                    content = _json.dumps(mock_body).encode('utf-8')
                else:
                    content = str(mock_body).encode('utf-8')
                return Response(content=content, status_code=mock_status, headers=safe_headers)
        except Exception as e:
            logger.debug(f"Mock fallback check failed: {e}")
        raise HTTPException(status_code=400, detail="Target backend URL not configured. Set it in dashboard settings, or pass X-Target-Url header. You can also set up mock endpoints to respond without a backend.")

    # SSRF Protection — validate target URL
    is_safe, ssrf_error = _is_url_safe(target_url)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Invalid target URL: {ssrf_error}")

    target_url = target_url.rstrip("/")
    path = path.lstrip("/")
    query = request.url.query
    full_target_url = f"{target_url}/{path}{'?' + query if query else ''}"

    headers = dict(request.headers)
    # Security: strip ALL sensitive/identifying headers before forwarding
    headers.pop("host", None)
    headers.pop("x-api-key", None)
    headers.pop("authorization", None)
    headers.pop("cookie", None)
    headers.pop("x-forwarded-for", None)
    headers.pop("x-forwarded-host", None)
    headers.pop("x-forwarded-proto", None)
    headers.pop("x-real-ip", None)
    headers.pop("connection", None)
    headers.pop("keep-alive", None)

    # Idempotency Header
    idempotency_key = headers.pop("idempotency-key", None)
    idempotency_store_key = f"{user.id}:{idempotency_key}" if idempotency_key else None

    # 3. Cache Check (GET only)
    cache_key = f"cache:{user.id}:{full_target_url}"
    if request.method == "GET" and getattr(user, "caching_enabled", False):
        cached = _cache.get(cache_key)
        if cached:
            try:
                cached_data = _json.loads(cached)
                c_status = cached_data["s"]
                c_content = cached_data["c"]
                c_ts = cached_data["t"]
                if time.time() - c_ts < 300:  # 5 min TTL
                    c_headers = _lru_headers.get(cache_key, (0, {}))[1]
                    latency = int((time.time() - start_time) * 1000)
                    background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", c_status, latency, True, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], response_size=len(c_content), query_params=query_params_str)
                    safe_headers = {k: v for k, v in c_headers.items() if k.lower() not in ("transfer-encoding", "content-encoding", "content-length")}
                    safe_headers["X-Backport-Cache"] = "HIT"
                    return Response(content=c_content.encode('utf-8') if isinstance(c_content, str) else c_content, status_code=c_status, headers=safe_headers)
            except Exception as e:
                logger.warning(f"Failed to read from cache: {e}")

    # 4. Idempotency Check (POST/PUT/PATCH only)
    if idempotency_store_key and getattr(user, "idempotency_enabled", True) and request.method in ["POST", "PUT", "PATCH"]:
        if idempotency_store_key in _idempotency_store:
            c_status, c_content, c_headers = _idempotency_store[idempotency_store_key]
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", c_status, latency, True, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], response_size=len(c_content), query_params=query_params_str)
            safe_headers = {k: v for k, v in c_headers.items() if k.lower() not in ("transfer-encoding", "content-encoding", "content-length")}
            safe_headers["X-Backport-Idempotent"] = "REPLAY"
            return Response(content=c_content, status_code=c_status, headers=safe_headers)

    # 5. Circuit Breaker Check
    try:
        from circuit_breaker import check_circuit
        circuit_state = check_circuit(user.id, target_url)
        if circuit_state == "OPEN":
            # Circuit is open — try mock fallback
            try:
                from mock import get_mock_response
                mock_data = get_mock_response(user.id, request.method, f"/{path}", db)
                if mock_data:
                    mock_status, mock_body, mock_headers = mock_data
                    if isinstance(mock_body, str):
                        try:
                            import json as _json
                            mock_body = _json.loads(mock_body)
                        except Exception:
                            pass
                    latency = int((time.time() - start_time) * 1000)
                    background_tasks.add_task(save_log, user_id=user.id, api_key_id=api_key_obj.id, method=request.method, path=f"/{path}", status_code=mock_status, latency_ms=latency, was_cached=True, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
                    safe_headers = {k: v for k, v in (mock_headers or {}).items() if k.lower() not in ("transfer-encoding", "content-length")}
                    safe_headers["X-Backport-Circuit"] = "open-mock"
                    if isinstance(mock_body, (dict, list)):
                        import json as _json
                        content = _json.dumps(mock_body).encode('utf-8')
                    else:
                        content = str(mock_body).encode('utf-8')
                    return Response(content=content, status_code=mock_status, headers=safe_headers)
            except Exception as e:
                logger.warning(f"Failed to load mock response for open circuit: {e}")
            raise HTTPException(status_code=503, detail="Service Unavailable: Circuit breaker is open. Backend is experiencing failures.")
    except ImportError:
        logger.debug("Circuit breaker module not yet available")

    # 6. Forward Request (using shared connection pool)
    try:
        client = get_shared_client()
        resp = await client.request(
            method=request.method,
            url=full_target_url,
            headers=headers,
            content=body_bytes,
        )

        # 11. Apply Response Transformations
        try:
            import json as _json
            from transform import apply_transformations, TransformationRule
            content_type = resp.headers.get("content-type", "")
            if "application/json" in content_type and resp.status_code == 200:
                try:
                    resp_body = resp.json()
                    rules = db.query(TransformationRule).filter(
                        TransformationRule.user_id == user.id,
                        TransformationRule.is_enabled == True,
                    ).all()
                    transformed = apply_transformations(resp_body, rules, f"/{path}")
                    if transformed is not None:
                        resp_bytes = _json.dumps(transformed).encode('utf-8')
                        resp = httpx.Response(
                            status_code=resp.status_code,
                            headers=resp.headers,
                            content=resp_bytes,
                            request=resp.request,
                        )
                except Exception as e:
                    logger.warning(f"Response transformation failed, returning original: {e}")
        except ImportError:
            logger.debug("Transform module not yet available")

        resp_headers = dict(resp.headers)
        # Remove hop-by-hop headers that break HTTP responses
        for h in ("transfer-encoding", "content-encoding", "content-length"):
            resp_headers.pop(h, None)

        # Add security headers
        resp_headers["X-Content-Type-Options"] = "nosniff"
        resp_headers["X-Frame-Options"] = "DENY"
        resp_headers["X-Backport-Latency"] = f"{int((time.time() - start_time) * 1000)}ms"

        # Save to Cache (Redis)
        if request.method == "GET" and getattr(user, "caching_enabled", False) and resp.status_code == 200:
            try:
                cache_data = _json.dumps({"t": time.time(), "s": resp.status_code, "c": resp.content.decode('utf-8', errors='replace')})
                _cache.set(cache_key, cache_data, ttl=300)
                _lru_headers[cache_key] = (time.time(), dict(resp.headers))
            except Exception as e:
                logger.warning(f"Failed to cache response: {e}")
            resp_headers["X-Backport-Cache"] = "MISS"

        # Save to Idempotency Store
        if idempotency_store_key and getattr(user, "idempotency_enabled", True):
            _idempotency_store[idempotency_store_key] = (resp.status_code, resp.content, resp_headers)

        latency = int((time.time() - start_time) * 1000)
        background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", resp.status_code, latency, False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], response_size=len(resp.content), query_params=query_params_str)

        # Record success in circuit breaker
        try:
            from circuit_breaker import record_success
            record_success(user.id, target_url)
        except Exception as e:
            logger.debug(f"Failed to record circuit breaker success: {e}")

        # Periodic cleanup
        if len(_lru_headers) > 1000 or len(_idempotency_store) > MAX_IDEMPOTENCY_ENTRIES:
            background_tasks.add_task(cleanup_stores)

        return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
    except httpx.TimeoutException:
        # Record failure in circuit breaker
        try:
            from circuit_breaker import record_failure
            record_failure(user.id, target_url)
        except Exception as e:
            logger.debug(f"Failed to record circuit breaker failure: {e}")
        latency = int((time.time() - start_time) * 1000)

        # Try Mock Response Fallback
        try:
            from mock import get_mock_response
            mock_data = get_mock_response(user.id, request.method, f"/{path}", db)
            if mock_data:
                mock_status, mock_body, mock_headers = mock_data
                # parse mock_body if it's a string
                if isinstance(mock_body, str):
                    try:
                        import json as _json
                        mock_body = _json.loads(mock_body)
                    except Exception:
                        pass
                background_tasks.add_task(save_log, user_id=user.id, api_key_id=api_key_obj.id, method=request.method, path=f"/{path}", status_code=mock_status, latency_ms=latency, was_cached=True, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
                safe_headers = {k: v for k, v in (mock_headers or {}).items() if k.lower() not in ("transfer-encoding", "content-length")}
                safe_headers["X-Backport-Mock"] = "true"
                if isinstance(mock_body, (dict, list)):
                    import json as _json
                    content = _json.dumps(mock_body).encode('utf-8')
                else:
                    content = str(mock_body).encode('utf-8')
                return Response(content=content, status_code=mock_status, headers=safe_headers)
        except ImportError:
            logger.debug("Mock module not yet available")
        except Exception as e:
            logger.warning(f"Mock response lookup failed for timeout fallback: {e}")

        background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 504, latency, False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
        raise HTTPException(status_code=504, detail="Gateway Timeout: Backend did not respond within 30 seconds")
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)

        # Record failure in circuit breaker
        try:
            from circuit_breaker import record_failure
            record_failure(user.id, target_url)
        except Exception as ex:
            logger.debug(f"Failed to record circuit breaker failure: {ex}")

        # Try Mock Response Fallback
        try:
            from mock import get_mock_response
            mock_data = get_mock_response(user.id, request.method, f"/{path}", db)
            if mock_data:
                mock_status, mock_body, mock_headers = mock_data
                # parse mock_body if it's a string
                if isinstance(mock_body, str):
                    try:
                        import json as _json
                        mock_body = _json.loads(mock_body)
                    except Exception:
                        pass
                background_tasks.add_task(save_log, user_id=user.id, api_key_id=api_key_obj.id, method=request.method, path=f"/{path}", status_code=mock_status, latency_ms=latency, was_cached=True, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
                safe_headers = {k: v for k, v in (mock_headers or {}).items() if k.lower() not in ("transfer-encoding", "content-length")}
                safe_headers["X-Backport-Mock"] = "true"
                if isinstance(mock_body, (dict, list)):
                    import json as _json
                    content = _json.dumps(mock_body).encode('utf-8')
                else:
                    content = str(mock_body).encode('utf-8')
                return Response(content=content, status_code=mock_status, headers=safe_headers)
        except ImportError:
            logger.debug("Mock module not yet available")
        except Exception as ex:
            logger.warning(f"Mock response lookup failed for error fallback: {ex}")

        background_tasks.add_task(save_log, user.id, api_key_obj.id, request.method, f"/{path}", 502, latency, False, ip_address=ip_address, request_headers=request_headers_str, request_body=body_bytes.decode('utf-8', errors='replace')[:65536], query_params=query_params_str)
        raise HTTPException(status_code=502, detail="Bad Gateway: Error communicating with target backend")


def save_log(user_id: int, api_key_id: int, method: str, path: str, status_code: int, latency_ms: int, was_cached: bool, ip_address: str = "", request_headers: str = "{}", request_body: str = "", response_size: int = 0, query_params: str = ""):
    from database import SessionLocal
    db = SessionLocal()
    try:
        log = ApiLog(
            user_id=user_id, api_key_id=api_key_id, method=method, path=path,
            status_code=status_code, latency_ms=latency_ms, was_cached=was_cached,
        )
        # Set enhanced fields individually — if column doesn't exist, skip it
        try:
            log.ip_address = ip_address
        except Exception as e:
            logger.debug(f"Could not set ip_address on log: {e}")
        try:
            log.request_headers = request_headers
        except Exception as e:
            logger.debug(f"Could not set request_headers on log: {e}")
        try:
            log.request_body = request_body[:65536] if request_body else ""
        except Exception as e:
            logger.debug(f"Could not set request_body on log: {e}")
        try:
            log.response_size = response_size
        except Exception as e:
            logger.debug(f"Could not set response_size on log: {e}")
        try:
            log.query_params = query_params
        except Exception as e:
            logger.debug(f"Could not set query_params on log: {e}")
        db.add(log)
        db.commit()

        # Broadcast log entry via WebSocket for real-time dashboard
        try:
            from ws import manager
            manager.broadcast_from_thread(user_id, {
                "type": "log_entry",
                "id": log.id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "was_cached": was_cached,
            })

            # Broadcast cache stats on cache hit/miss
            if was_cached:
                manager.broadcast_from_thread(user_id, {
                    "type": "cache_stats",
                    "event": "hit",
                    "path": path,
                    "method": method,
                })
        except Exception as e:
            logger.debug(f"WebSocket broadcast from save_log failed: {e}")
    except Exception as e:
        # Log failures should never crash the gateway
        print(f"⚠️ save_log error (user_id={user_id}): {e}")
    finally:
        db.close()
