import logging
import json
import csv
import io
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .proxy import ProxyEngine
from .analytics import AnalyticsEngine
from .config import config

logger = logging.getLogger("ghostapi")

_proxy_engine: ProxyEngine | None = None
_analytics_engine: AnalyticsEngine | None = None

API_SAFE_PREFIXES = {"/api/health", "/api/stats", "/api/logs", "/api/alerts", "/api/timeline",
                      "/api/slow-endpoints", "/api/latency-distribution", "/api/export",
                      "/dashboard", "/api/replay", "/api/health"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _proxy_engine, _analytics_engine

    if not config.target_url:
        logger.error("No target URL configured. Use: ghostapi watch <URL>")
        raise SystemExit(1)

    _proxy_engine = ProxyEngine(config.target_url)
    _analytics_engine = AnalyticsEngine()
    _analytics_engine.start()

    logger.info("Proxy engine initialized for target: %s", config.target_url)
    logger.info("Analytics engine started")

    yield

    _analytics_engine.stop()
    if _proxy_engine:
        await _proxy_engine.close()
    logger.info("GhostAPI shutdown complete")


def _is_api_route(request: Request) -> bool:
    path = request.url.path
    for prefix in API_SAFE_PREFIXES:
        if path == prefix or path.startswith(prefix + "/"):
            return True
    if path == "/dashboard":
        return True
    return False


async def api_key_middleware(request: Request, call_next):
    if not config.api_key:
        return await call_next(request)

    path = request.url.path
    if path.startswith("/static/") or path == "/favicon.ico":
        return await call_next(request)

    if _is_api_route(request):
        return await call_next(request)

    provided_key = request.headers.get("x-ghostapi-key", "")
    if provided_key != config.api_key:
        return JSONResponse(
            content={"error": "Unauthorized: missing or invalid x-ghostapi-key header"},
            status_code=401,
        )

    return await call_next(request)


def create_app() -> FastAPI:
    app = FastAPI(
        title="GhostAPI",
        description="Reverse proxy with real-time analytics and security detection",
        version="1.1.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )

    app.middleware("http")(api_key_middleware)

    _templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

    @app.get("/dashboard", response_class=HTMLResponse)
    async def dashboard():
        return _templates.TemplateResponse("dashboard.html", {"request": {}})

    @app.get("/api/stats")
    async def stats():
        if not _analytics_engine:
            return JSONResponse({"error": "Analytics engine not initialized"}, status_code=503)
        return JSONResponse(_analytics_engine.get_stats())

    @app.get("/api/logs")
    async def logs(limit: int = 50):
        from .database import get_db

        db = get_db()
        recent = db.get_recent_requests(limit=min(limit, 200))
        return JSONResponse([r.to_dict() for r in recent])

    @app.get("/api/alerts")
    async def alerts(limit: int = 20):
        from .database import get_db

        db = get_db()
        recent_alerts = db.get_recent_alerts(limit=min(limit, 50))
        return JSONResponse([a.to_dict() for a in recent_alerts])

    @app.get("/api/timeline")
    async def timeline():
        from .database import get_db

        db = get_db()
        data = db.get_requests_timeline(last_n_minutes=30, bucket_minutes=1)
        return JSONResponse(data)

    @app.get("/api/health")
    async def health():
        return JSONResponse({
            "status": "ok",
            "target": config.target_url,
            "api_key_enabled": bool(config.api_key),
            "version": "1.1.0",
        })

    @app.post("/api/replay/{request_id}")
    async def replay(request_id: int):
        from .database import get_db

        if not _proxy_engine:
            return JSONResponse({"error": "Proxy engine not initialized"}, status_code=503)

        db = get_db()
        log = db.get_request_by_id(request_id)
        if not log:
            return JSONResponse({"error": f"Request #{request_id} not found"}, status_code=404)

        result = await _proxy_engine.replay_request(log)
        return JSONResponse(result)

    @app.get("/api/export/json")
    async def export_json(limit: int = 1000):
        from .database import get_db

        db = get_db()
        requests = db.get_export_requests(limit=min(limit, 5000))
        data = [r.to_dict() for r in requests]
        return JSONResponse(data)

    @app.get("/api/export/csv")
    async def export_csv(limit: int = 1000):
        from .database import get_db

        db = get_db()
        requests = db.get_export_requests(limit=min(limit, 5000))

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "method", "path", "status_code", "latency", "ip", "timestamp", "response_size"])
        for r in requests:
            writer.writerow([r.id, r.method, r.path, r.status_code, r.latency, r.ip, r.timestamp, r.response_size])
        csv_content = output.getvalue()

        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ghostapi_export.csv"},
        )

    @app.get("/api/slow-endpoints")
    async def slow_endpoints():
        if not _analytics_engine:
            return JSONResponse({"error": "Analytics engine not initialized"}, status_code=503)
        return JSONResponse(_analytics_engine.get_slowest_endpoints())

    @app.get("/api/latency-distribution")
    async def latency_distribution():
        if not _analytics_engine:
            return JSONResponse({"error": "Analytics engine not initialized"}, status_code=503)
        return JSONResponse(_analytics_engine.get_latency_distribution())

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    async def proxy(request: Request, path: str):
        if not _proxy_engine:
            return JSONResponse({"error": "Proxy engine not initialized"}, status_code=503)
        return await _proxy_engine.forward(request)

    static_dir = (Path(__file__).parent / "static").resolve()
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    return app
