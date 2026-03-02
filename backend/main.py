from fastapi import FastAPI, Request, Response, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import time
import asyncio
from collections import defaultdict, OrderedDict
from typing import Dict, Any
from dataclasses import dataclass
import re
import hashlib
from datetime import datetime, timedelta

app = FastAPI(title="Backpack API Gateway")

# CORS for Dashboard (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurable Settings (in-memory, prod me Redis/DB)
@dataclass
class Settings:
    target_backend_url: str = "http://localhost:3001"
    rate_limit_enabled: bool = True
    cache_enabled: bool = True
    idempotency_enabled: bool = True
    waf_enabled: bool = True
    rate_limit_per_minute: int = 100

settings = Settings()

# Metrics for Dashboard
metrics = {
    "total_requests": 0,
    "cache_hits": 0,
    "threats_blocked": 0
}

# In-Memory Stores (Prod: Redis)
rate_limits: Dict[str, list[float]] = defaultdict(list)
cache: OrderedDict[str, tuple[bytes, float, dict]] = OrderedDict()  # LRU + TTL
idempotency: Dict[str, tuple[bytes, float]] = {}  # key: (response, timestamp)
traffic_log = defaultdict(int)

# Seed mock traffic data so chart isn't empty initially
for i in range(30):
    t = (datetime.now() - timedelta(minutes=30-i)).strftime("%H:%M")
    traffic_log[t] = 0

# WAF Patterns (Basic SQLi/XSS)
WAF_PATTERNS = [
    re.compile(r"union\s+select", re.I),
    re.compile(r"<script", re.I),
    re.compile(r"javascript:", re.I),
    re.compile(r"eval\(", re.I),
]

async def forward_to_backend(request: Request, backend_url: str) -> Response:
    """Zero-Knowledge Forward: Body untouched"""
    async with httpx.AsyncClient() as client:
        headers = dict(request.headers)
        headers.pop("host", None)
        
        resp = await client.request(
            method=request.method,
            url=f"{backend_url.rstrip('/')}{request.url.path}{request.url.query}",
            headers=headers,
            content=await request.body(),
        )
        return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))

def check_rate_limit(ip: str) -> bool:
    now = time.time()
    rate_limits[ip] = [t for t in rate_limits[ip] if now - t < 60]
    if len(rate_limits[ip]) >= settings.rate_limit_per_minute:
        return False
    rate_limits[ip].append(now)
    return True

def check_waf(body: bytes) -> bool:
    text = body.decode(errors="ignore").lower()
    return any(pattern.search(text) for pattern in WAF_PATTERNS)

def get_cache_key(request: Request) -> str:
    return hashlib.md5(f"{request.method}{request.url.path}{request.url.query}".encode()).hexdigest()

@app.get("/api/metrics")
async def get_metrics():
    return metrics

@app.post("/api/settings")
async def save_settings(new_settings: Dict[str, Any]):
    global settings
    settings.target_backend_url = new_settings.get("target_backend_url", settings.target_backend_url)
    settings.rate_limit_enabled = new_settings.get("rate_limit_enabled", settings.rate_limit_enabled)
    settings.cache_enabled = new_settings.get("cache_enabled", settings.cache_enabled)
    settings.idempotency_enabled = new_settings.get("idempotency_enabled", settings.idempotency_enabled)
    settings.waf_enabled = new_settings.get("waf_enabled", settings.waf_enabled)
    settings.rate_limit_per_minute = new_settings.get("rate_limit_per_minute", 100)
    return {"status": "saved"}

@app.get("/api/settings")
async def get_settings():
    return {
        "target_backend_url": settings.target_backend_url,
        "rate_limit_enabled": settings.rate_limit_enabled,
        "cache_enabled": settings.cache_enabled,
        "idempotency_enabled": settings.idempotency_enabled,
        "waf_enabled": settings.waf_enabled,
        "rate_limit_per_minute": settings.rate_limit_per_minute
    }

@app.get("/api/traffic")
async def get_traffic():
    data = [{"time": k, "requests": v} for k, v in list(traffic_log.items())[-30:]]
    return {"traffic_data": data}

# PROXY ENDPOINT (Public API Traffic)
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(request: Request, path: str, x_idempotency_key: str = Header(None)):
    global metrics, traffic_log
    metrics["total_requests"] += 1
    current_time = datetime.now().strftime("%H:%M")
    traffic_log[current_time] += 1
    
    client_ip = request.client.host

    # Rate Limit
    if settings.rate_limit_enabled and not check_rate_limit(client_ip):
        metrics["threats_blocked"] += 1
        raise HTTPException(429, "Too Many Requests")

    # WAF
    if settings.waf_enabled:
        body = await request.body()
        if check_waf(body):
            metrics["threats_blocked"] += 1
            raise HTTPException(403, "Security Block")

    # Idempotency (POST only)
    if settings.idempotency_enabled and request.method == "POST" and x_idempotency_key:
        key_hash = hashlib.md5(x_idempotency_key.encode()).hexdigest()
        if key_hash in idempotency:
            resp_data, ts = idempotency[key_hash]
            if time.time() - ts < 86400:  # 24h TTL
                return Response(content=resp_data)

    # Cache (GET only)
    if settings.cache_enabled and request.method == "GET":
        cache_key = get_cache_key(request)
        if cache_key in cache:
            data, ts, headers = cache[cache_key]
            if time.time() - ts < 300:  # 5min TTL
                metrics["cache_hits"] += 1
                return Response(content=data, headers=headers)

    # Forward to Backend
    backend_resp = await forward_to_backend(request, settings.target_backend_url)

    # Cache Response (GET)
    if settings.cache_enabled and request.method == "GET":
        cache_key = get_cache_key(request)
        cache[cache_key] = (backend_resp.body, time.time(), dict(backend_resp.headers))

    # Store Idempotency
    if settings.idempotency_enabled and request.method == "POST" and x_idempotency_key:
        key_hash = hashlib.md5(x_idempotency_key.encode()).hexdigest()
        idempotency[key_hash] = (backend_resp.body, time.time())

    return backend_resp

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)  # Change port as needed