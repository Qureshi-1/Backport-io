import json as _json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from models import User, ApiLog, ApiEndpoint
from dependencies import get_current_user, get_db

logger = logging.getLogger("backport")

router = APIRouter(prefix="/api/docs", tags=["api-docs"])


class EndpointUpdate(BaseModel):
    description: Optional[str] = None
    request_body_example: Optional[str] = None
    response_body_example: Optional[str] = None


# ─── List all discovered endpoints ─────────────────────────────────────────

@router.get("/auto")
def list_endpoints(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all discovered API endpoints with stats."""
    endpoints = db.query(ApiEndpoint).filter(
        ApiEndpoint.user_id == user.id
    ).order_by(ApiEndpoint.is_starred.desc(), ApiEndpoint.total_requests.desc()).all()

    result = []
    for ep in endpoints:
        result.append({
            "id": ep.id,
            "method": ep.method,
            "path": ep.path,
            "description": ep.description,
            "avg_latency_ms": ep.avg_latency_ms,
            "total_requests": ep.total_requests,
            "success_rate": ep.success_rate,
            "last_seen": ep.last_seen.isoformat() if ep.last_seen else None,
            "is_starred": ep.is_starred,
        })

    return result


# ─── Get full details for a single endpoint ────────────────────────────────

@router.get("/auto/{endpoint_id}")
def get_endpoint(endpoint_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get full details for a single discovered endpoint."""
    ep = db.query(ApiEndpoint).filter(
        ApiEndpoint.id == endpoint_id,
        ApiEndpoint.user_id == user.id
    ).first()

    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    request_headers = []
    try:
        request_headers = _json.loads(ep.request_headers) if ep.request_headers else []
    except (ValueError, TypeError) as e:
        logger.debug(f"Failed to parse request headers for endpoint {ep.id}: {e}")

    request_example = None
    try:
        if ep.request_body_example:
            request_example = _json.loads(ep.request_body_example)
    except (ValueError, TypeError) as e:
        logger.debug(f"Failed to parse request body example for endpoint {ep.id}: {e}")
        request_example = ep.request_body_example

    response_example = None
    try:
        if ep.response_body_example:
            response_example = _json.loads(ep.response_body_example)
    except (ValueError, TypeError) as e:
        logger.debug(f"Failed to parse response body example for endpoint {ep.id}: {e}")
        response_example = ep.response_body_example

    return {
        "id": ep.id,
        "method": ep.method,
        "path": ep.path,
        "description": ep.description,
        "request_headers": request_headers,
        "request_body_example": request_example,
        "response_body_example": response_example,
        "avg_latency_ms": ep.avg_latency_ms,
        "total_requests": ep.total_requests,
        "success_rate": ep.success_rate,
        "last_seen": ep.last_seen.isoformat() if ep.last_seen else None,
        "is_starred": ep.is_starred,
    }


# ─── Force re-generation from recent logs ──────────────────────────────────

@router.post("/auto/generate")
def generate_docs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Force re-generation of API docs from recent logs."""
    from analytics import get_analytics_engine
    engine = get_analytics_engine()
    engine._generate_api_docs()

    return {"status": "success", "message": "API documentation regenerated from recent logs"}


# ─── Update endpoint description/examples ──────────────────────────────────

@router.put("/auto/{endpoint_id}")
def update_endpoint(
    endpoint_id: int,
    data: EndpointUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update description, examples for a discovered endpoint."""
    ep = db.query(ApiEndpoint).filter(
        ApiEndpoint.id == endpoint_id,
        ApiEndpoint.user_id == user.id
    ).first()

    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if data.description is not None:
        ep.description = data.description
    if data.request_body_example is not None:
        ep.request_body_example = data.request_body_example
    if data.response_body_example is not None:
        ep.response_body_example = data.response_body_example

    db.commit()
    db.refresh(ep)

    return {"status": "success", "id": ep.id}


# ─── Toggle starred status ─────────────────────────────────────────────────

@router.patch("/auto/{endpoint_id}/star")
def toggle_star(endpoint_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Toggle starred status for an endpoint."""
    ep = db.query(ApiEndpoint).filter(
        ApiEndpoint.id == endpoint_id,
        ApiEndpoint.user_id == user.id
    ).first()

    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    ep.is_starred = not ep.is_starred
    db.commit()
    db.refresh(ep)

    return {"status": "success", "is_starred": ep.is_starred}


# ─── Export as OpenAPI/Swagger JSON ────────────────────────────────────────

@router.get("/auto/export/openapi")
def export_openapi(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export discovered endpoints as OpenAPI 3.0 JSON."""
    endpoints = db.query(ApiEndpoint).filter(
        ApiEndpoint.user_id == user.id
    ).order_by(ApiEndpoint.path).all()

    paths = {}
    for ep in endpoints:
        method_lower = ep.method.lower()

        request_example = None
        try:
            if ep.request_body_example:
                request_example = _json.loads(ep.request_body_example)
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to parse request body example for OpenAPI export (endpoint {ep.id}): {e}")

        response_example = None
        try:
            if ep.response_body_example:
                response_example = _json.loads(ep.response_body_example)
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to parse response body example for OpenAPI export (endpoint {ep.id}): {e}")

        request_headers = []
        try:
            request_headers = _json.loads(ep.request_headers) if ep.request_headers else []
        except (ValueError, TypeError) as e:
            logger.debug(f"Failed to parse request headers for OpenAPI export (endpoint {ep.id}): {e}")

        header_params = []
        for h in request_headers:
            header_params.append({
                "name": h,
                "in": "header",
                "required": False,
                "schema": {"type": "string"},
            })

        operation = {
            "summary": ep.description or f"{ep.method} {ep.path}",
            "responses": {
                "200": {
                    "description": "Successful response",
                }
            },
            "parameters": header_params,
        }

        if request_example and ep.method in ["POST", "PUT", "PATCH"]:
            operation["requestBody"] = {
                "content": {
                    "application/json": {
                        "schema": {"type": "object"},
                        "example": request_example,
                    }
                }
            }

        if response_example:
            operation["responses"]["200"]["content"] = {
                "application/json": {
                    "schema": {"type": "object"},
                    "example": response_example,
                }
            }

        if ep.path not in paths:
            paths[ep.path] = {}
        paths[ep.path][method_lower] = operation

    spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "Auto-Generated API Documentation",
            "description": "Generated by Backport API Gateway from observed traffic",
            "version": "1.0.0",
            "x-generated-at": datetime.now(timezone.utc).isoformat(),
        },
        "paths": paths,
    }

    return spec
