import sys
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import CORS_ORIGINS
from database import engine, Base
import models
import auth, user, payment, feedback, proxy

print(f"✅ Starting Backport Gateway | Python {sys.version}")

app = FastAPI(title="Backport API Gateway")

@app.on_event("startup")
async def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️  DB init warning: {e}")

# ── Custom CORS — works with any origin, no credentials conflict ──────────────
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "*")
        if request.method == "OPTIONS":
            from starlette.responses import Response as SR
            r = SR(status_code=200)
            r.headers["Access-Control-Allow-Origin"] = origin
            r.headers["Access-Control-Allow-Credentials"] = "true"
            r.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
            r.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,X-API-Key"
            return r
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,X-API-Key"
        return response

app.add_middleware(CORSMiddleware)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})

# 3. Health Endpoint (Public)
@app.get("/health")
def health():
    return {"status": "ok"}

# 4. Include Routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(payment.router)
app.include_router(feedback.router)

# Proxy route MUST be included so it operates at /proxy/
app.include_router(proxy.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)