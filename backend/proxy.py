import httpx
from fastapi import APIRouter, Request, Response, Depends, HTTPException
import time
from dependencies import get_proxy_user, get_db
from sqlalchemy.orm import Session
from models import User, ApiLog
from fastapi import BackgroundTasks

router = APIRouter()

# --- IN-MEMORY CACHE & RATE LIMIT STORE ---
_lru_cache = {}  # format: { "user_id:url": (timestamp, status, content, headers) }
_rate_limits = {} # format: { user_id: [timestamps] }
_idempotency_keys = {} # format: { "user_id:idemp_key": (status, content, headers) }

@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_route(request: Request, path: str, background_tasks: BackgroundTasks, user: User = Depends(get_proxy_user), db: Session = Depends(get_db)):
    start_time = time.time()
    
    # 1. Check WAF (Web Application Firewall)
    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8', errors='ignore').lower()
    path_lower = path.lower()
    query_str = request.url.query.lower()
    
    if getattr(user, "waf_enabled", False):
        malicious_patterns = ["drop table", "select *", "<script>", "union select", "1=1", "exec("]
        if any(p in body_str or p in path_lower or p in query_str for p in malicious_patterns):
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", 403, latency, False)
            raise HTTPException(status_code=403, detail="WAF Blocked: Malicious payload detected")
            
    # 2. Check Rate Limiting (60 requests per minute)
    if getattr(user, "rate_limit_enabled", True):
        now = time.time()
        user_reqs = _rate_limits.get(user.id, [])
        user_reqs = [t for t in user_reqs if now - t < 60] # Keep last 60 seconds of history
        if len(user_reqs) >= 60:
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", 429, latency, False)
            raise HTTPException(status_code=429, detail="Rate Limit Exceeded: Max 60 requests/minute on Free tier")
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
    
    # Check Idempotency Header
    idempotency_key = headers.pop("idempotency-key", None)
    idempotency_store_key = f"{user.id}:{idempotency_key}" if idempotency_key else None
    
    # 3. Check Caching (GET only)
    cache_key = f"{user.id}:{full_target_url}"
    if request.method == "GET" and getattr(user, "caching_enabled", False):
        if cache_key in _lru_cache:
            cache_ts, c_status, c_content, c_headers = _lru_cache[cache_key]
            if time.time() - cache_ts < 300: # 5 minute cache expiration
                latency = int((time.time() - start_time) * 1000)
                background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", c_status, latency, True)
                return Response(content=c_content, status_code=c_status, headers=c_headers)
                
    # 4. Check Idempotency (POST/PUT/PATCH only)
    if idempotency_store_key and getattr(user, "idempotency_enabled", True) and request.method in ["POST", "PUT", "PATCH"]:
        if idempotency_store_key in _idempotency_keys:
            c_status, c_content, c_headers = _idempotency_keys[idempotency_store_key]
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", c_status, latency, True)
            return Response(content=c_content, status_code=c_status, headers=c_headers)
    body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method=request.method,
                url=full_target_url,
                headers=headers,
                content=body_bytes,
            )
            
            resp_headers = dict(resp.headers)
            
            # Save to Cache
            if request.method == "GET" and getattr(user, "caching_enabled", False) and resp.status_code == 200:
                _lru_cache[cache_key] = (time.time(), resp.status_code, resp.content, resp_headers)
                
            # Save to Idempotency Store
            if idempotency_store_key and getattr(user, "idempotency_enabled", True):
                _idempotency_keys[idempotency_store_key] = (resp.status_code, resp.content, resp_headers)
            
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", resp.status_code, latency, False)
            
            return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", 502, latency, False)
        raise HTTPException(status_code=502, detail=f"Bad Gateway: Error communicating with target backend - {str(e)}")

def save_log(db: Session, user_id: int, method: str, path: str, status_code: int, latency_ms: int, was_cached: bool):
    log = ApiLog(user_id=user_id, method=method, path=path, status_code=status_code, latency_ms=latency_ms, was_cached=was_cached)
    db.add(log)
    db.commit()
