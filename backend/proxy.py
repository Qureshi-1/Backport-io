import httpx
from fastapi import APIRouter, Request, Response, Depends, HTTPException
import time
from dependencies import get_proxy_user, get_db
from sqlalchemy.orm import Session
from models import User, ApiLog
from fastapi import BackgroundTasks

router = APIRouter()

@router.api_route("/proxy/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_route(request: Request, path: str, background_tasks: BackgroundTasks, user: User = Depends(get_proxy_user), db: Session = Depends(get_db)):
    start_time = time.time()
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
    
    body = await request.body()
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.request(
                method=request.method,
                url=full_target_url,
                headers=headers,
                content=body,
            )
            
            latency = int((time.time() - start_time) * 1000)
            background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", resp.status_code, latency, False)
            
            return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        background_tasks.add_task(save_log, db, user.id, request.method, f"/{path}", 502, latency, False)
        raise HTTPException(status_code=502, detail=f"Bad Gateway: Error communicating with target backend - {str(e)}")

def save_log(db: Session, user_id: int, method: str, path: str, status_code: int, latency_ms: int, was_cached: bool):
    log = ApiLog(user_id=user_id, method=method, path=path, status_code=status_code, latency_ms=latency_ms, was_cached=was_cached)
    db.add(log)
    db.commit()
