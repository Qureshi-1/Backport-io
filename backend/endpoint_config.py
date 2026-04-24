from datetime import timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import User, EndpointConfig
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/endpoint-config", tags=["endpoint-config"])


# ─── Pydantic Schemas ──────────────────────────────────────────────────────

class EndpointConfigCreate(BaseModel):
    path_pattern: str = Field(..., min_length=1, description="Path pattern with wildcard support, e.g. /api/users/*")
    max_rpm: int = Field(100, ge=1, le=100000, description="Maximum requests per minute")
    burst_size: int = Field(10, ge=1, le=1000, description="Burst size for rate limiting")
    is_enabled: bool = True


class EndpointConfigUpdate(BaseModel):
    path_pattern: Optional[str] = Field(None, min_length=1)
    max_rpm: Optional[int] = Field(None, ge=1, le=100000)
    burst_size: Optional[int] = Field(None, ge=1, le=1000)
    is_enabled: Optional[bool] = None


# ─── Helpers ───────────────────────────────────────────────────────────────

def _serialize_config(config: EndpointConfig) -> dict:
    """Serialize an EndpointConfig to a dictionary."""
    return {
        "id": config.id,
        "user_id": config.user_id,
        "path_pattern": config.path_pattern,
        "max_rpm": config.max_rpm,
        "burst_size": config.burst_size,
        "is_enabled": config.is_enabled,
        "created_at": config.created_at.isoformat() if config.created_at else None,
    }


def match_endpoint_config(path: str, configs: List[EndpointConfig]) -> Optional[EndpointConfig]:
    """
    Match a request path against endpoint configs using fnmatch wildcard patterns.

    Args:
        path: The request path (e.g. "/api/users/123")
        configs: List of EndpointConfig objects to match against

    Returns:
        First matching EndpointConfig, or None.
    """
    from fnmatch import fnmatch
    for config in configs:
        if config.is_enabled and fnmatch(path, config.path_pattern):
            return config
    return None


# ─── API Endpoints ─────────────────────────────────────────────────────────

@router.post("")
def create_endpoint_config(
    req: EndpointConfigCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new per-endpoint rate limit configuration."""
    # Validate the pattern looks reasonable
    if not req.path_pattern.startswith("/"):
        raise HTTPException(status_code=400, detail="Path pattern must start with /")

    config = EndpointConfig(
        user_id=user.id,
        path_pattern=req.path_pattern,
        max_rpm=req.max_rpm,
        burst_size=req.burst_size,
        is_enabled=req.is_enabled,
    )
    db.add(config)
    db.commit()
    db.refresh(config)

    return {"status": "success", "config": _serialize_config(config)}


@router.get("")
def list_endpoint_configs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all endpoint configurations for the current user."""
    configs = db.query(EndpointConfig).filter(
        EndpointConfig.user_id == user.id
    ).order_by(EndpointConfig.created_at.desc()).all()

    return {"configs": [_serialize_config(c) for c in configs]}


@router.get("/{config_id}")
def get_endpoint_config(
    config_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific endpoint configuration."""
    config = db.query(EndpointConfig).filter(
        EndpointConfig.id == config_id,
        EndpointConfig.user_id == user.id,
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Endpoint configuration not found")

    return {"config": _serialize_config(config)}


@router.put("/{config_id}")
def update_endpoint_config(
    config_id: int,
    req: EndpointConfigUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an endpoint configuration."""
    config = db.query(EndpointConfig).filter(
        EndpointConfig.id == config_id,
        EndpointConfig.user_id == user.id,
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Endpoint configuration not found")

    if req.path_pattern is not None:
        if not req.path_pattern.startswith("/"):
            raise HTTPException(status_code=400, detail="Path pattern must start with /")
        config.path_pattern = req.path_pattern
    if req.max_rpm is not None:
        config.max_rpm = req.max_rpm
    if req.burst_size is not None:
        config.burst_size = req.burst_size
    if req.is_enabled is not None:
        config.is_enabled = req.is_enabled

    db.commit()
    db.refresh(config)

    return {"status": "success", "config": _serialize_config(config)}


@router.delete("/{config_id}")
def delete_endpoint_config(
    config_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an endpoint configuration."""
    config = db.query(EndpointConfig).filter(
        EndpointConfig.id == config_id,
        EndpointConfig.user_id == user.id,
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Endpoint configuration not found")

    db.delete(config)
    db.commit()

    return {"status": "success", "deleted_id": config_id}


@router.post("/{config_id}/toggle")
def toggle_endpoint_config(
    config_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle an endpoint configuration on/off."""
    config = db.query(EndpointConfig).filter(
        EndpointConfig.id == config_id,
        EndpointConfig.user_id == user.id,
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Endpoint configuration not found")

    config.is_enabled = not config.is_enabled
    db.commit()
    db.refresh(config)

    return {"status": "success", "config": _serialize_config(config)}
