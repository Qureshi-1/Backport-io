import json
from fnmatch import fnmatch
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text

from database import Base
from models import User
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/mocks", tags=["mocks"])

VALID_HTTP_METHODS = {"GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"}


# ─── SQLAlchemy Model ──────────────────────────────────────────────────────────

class MockEndpoint(Base):
    __tablename__ = "mock_endpoints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    method = Column(String, nullable=False)
    path_pattern = Column(String, nullable=False)
    status_code = Column(Integer, default=200)
    response_body = Column(Text, default="{}")   # JSON string
    headers = Column(Text, default="{}")         # JSON string
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class MockCreate(BaseModel):
    method: str = Field(..., pattern="^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$")
    path_pattern: str
    status_code: int = Field(200, ge=100, le=599)
    response_body: Dict[str, Any] = {}
    headers: Dict[str, str] = {}

class MockUpdate(BaseModel):
    method: Optional[str] = None
    path_pattern: Optional[str] = None
    status_code: Optional[int] = Field(None, ge=100, le=599)
    response_body: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_mock(mock: MockEndpoint) -> dict:
    return {
        "id": mock.id,
        "user_id": mock.user_id,
        "method": mock.method,
        "path_pattern": mock.path_pattern,
        "status_code": mock.status_code,
        "response_body": json.loads(mock.response_body) if mock.response_body else {},
        "headers": json.loads(mock.headers) if mock.headers else {},
        "is_enabled": mock.is_enabled,
        "created_at": mock.created_at.isoformat() if mock.created_at else None,
    }


# ─── Mock Lookup (exported) ───────────────────────────────────────────────────

def get_mock_response(
    user_id: int,
    method: str,
    path: str,
    db: Session,
) -> Optional[Tuple[int, dict, dict]]:
    """
    Look up a mock response for the given user, method and path.

    Returns (status_code, response_body_dict, headers_dict) or None if no mock matches.
    """
    method = method.upper()
    mocks = db.query(MockEndpoint).filter(
        MockEndpoint.user_id == user_id,
        MockEndpoint.method == method,
        MockEndpoint.is_enabled == True,
    ).all()

    for mock in mocks:
        if fnmatch(path, mock.path_pattern):
            try:
                body = json.loads(mock.response_body) if mock.response_body else {}
            except (json.JSONDecodeError, TypeError):
                body = {}
            try:
                headers = json.loads(mock.headers) if mock.headers else {}
            except (json.JSONDecodeError, TypeError):
                headers = {}
            return (mock.status_code, body, headers)

    return None


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("")
def create_mock(req: MockCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mock = MockEndpoint(
        user_id=user.id,
        method=req.method.upper(),
        path_pattern=req.path_pattern,
        status_code=req.status_code,
        response_body=json.dumps(req.response_body),
        headers=json.dumps(req.headers),
        is_enabled=True,
    )
    db.add(mock)
    db.commit()
    db.refresh(mock)
    return {"status": "success", "mock": _serialize_mock(mock)}


@router.get("")
def list_mocks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mocks = db.query(MockEndpoint).filter(
        MockEndpoint.user_id == user.id
    ).order_by(MockEndpoint.created_at.desc()).all()
    return {"mocks": [_serialize_mock(m) for m in mocks]}


@router.put("/{mock_id}")
def update_mock(mock_id: int, req: MockUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mock = db.query(MockEndpoint).filter(
        MockEndpoint.id == mock_id,
        MockEndpoint.user_id == user.id,
    ).first()
    if not mock:
        raise HTTPException(status_code=404, detail="Mock endpoint not found")

    if req.method is not None:
        if req.method.upper() not in VALID_HTTP_METHODS:
            raise HTTPException(status_code=400, detail=f"Invalid HTTP method. Must be one of: {', '.join(sorted(VALID_HTTP_METHODS))}")
        mock.method = req.method.upper()
    if req.path_pattern is not None:
        mock.path_pattern = req.path_pattern
    if req.status_code is not None:
        mock.status_code = req.status_code
    if req.response_body is not None:
        mock.response_body = json.dumps(req.response_body)
    if req.headers is not None:
        mock.headers = json.dumps(req.headers)

    db.commit()
    db.refresh(mock)
    return {"status": "success", "mock": _serialize_mock(mock)}


@router.delete("/{mock_id}")
def delete_mock(mock_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mock = db.query(MockEndpoint).filter(
        MockEndpoint.id == mock_id,
        MockEndpoint.user_id == user.id,
    ).first()
    if not mock:
        raise HTTPException(status_code=404, detail="Mock endpoint not found")

    db.delete(mock)
    db.commit()
    return {"status": "success", "deleted_id": mock_id}


@router.patch("/{mock_id}/toggle")
def toggle_mock(mock_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mock = db.query(MockEndpoint).filter(
        MockEndpoint.id == mock_id,
        MockEndpoint.user_id == user.id,
    ).first()
    if not mock:
        raise HTTPException(status_code=404, detail="Mock endpoint not found")

    mock.is_enabled = not mock.is_enabled
    db.commit()
    db.refresh(mock)
    return {"status": "success", "mock": _serialize_mock(mock)}
