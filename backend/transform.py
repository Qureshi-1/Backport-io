import json
from fnmatch import fnmatch
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Union

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text

from database import Base
from models import User
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/transforms", tags=["transforms"])


# ─── SQLAlchemy Model ──────────────────────────────────────────────────────────

class TransformationRule(Base):
    __tablename__ = "transformation_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    path_pattern = Column(String, nullable=False)
    action = Column(String, nullable=False)  # add_field / remove_field / rename_field / filter_keys
    config = Column(Text, default="{}")       # JSON string
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class TransformCreate(BaseModel):
    name: str
    path_pattern: str
    action: str = Field(..., pattern="^(add_field|remove_field|rename_field|filter_keys)$")
    config: Dict[str, Any] = {}

class TransformUpdate(BaseModel):
    name: Optional[str] = None
    path_pattern: Optional[str] = None
    action: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_rule(rule: TransformationRule) -> dict:
    return {
        "id": rule.id,
        "user_id": rule.user_id,
        "name": rule.name,
        "path_pattern": rule.path_pattern,
        "action": rule.action,
        "config": json.loads(rule.config) if rule.config else {},
        "is_enabled": rule.is_enabled,
        "created_at": rule.created_at.isoformat() if rule.created_at else None,
    }


# ─── Transformation Logic (exported) ──────────────────────────────────────────

def apply_transformations(
    body: Union[dict, list, None],
    rules: List[TransformationRule],
    request_path: str,
) -> Union[dict, list, None]:
    """
    Apply active transformation rules to a response body.

    - body:       The JSON response body (dict, list, or None).
    - rules:      List of TransformationRule ORM objects.
    - request_path: The actual request path to match against path_pattern.

    Returns the transformed body.
    """
    if body is None:
        return body

    for rule in rules:
        if not rule.is_enabled:
            continue
        if not fnmatch(request_path, rule.path_pattern):
            continue

        try:
            config = json.loads(rule.config) if rule.config else {}
        except (json.JSONDecodeError, TypeError):
            continue

        if rule.action == "add_field":
            body = _apply_add_field(body, config)
        elif rule.action == "remove_field":
            body = _apply_remove_field(body, config)
        elif rule.action == "rename_field":
            body = _apply_rename_field(body, config)
        elif rule.action == "filter_keys":
            body = _apply_filter_keys(body, config)

    return body


def _apply_add_field(body, config: dict) -> Union[dict, list]:
    key = config.get("key")
    value = config.get("value")
    if key is None:
        return body

    if isinstance(body, dict):
        body[key] = value
    elif isinstance(body, list):
        for item in body:
            if isinstance(item, dict):
                item[key] = value
    return body


def _apply_remove_field(body, config: dict) -> Union[dict, list]:
    keys = config.get("keys", [])
    if not keys:
        return body

    if isinstance(body, dict):
        for k in keys:
            body.pop(k, None)
    elif isinstance(body, list):
        for item in body:
            if isinstance(item, dict):
                for k in keys:
                    item.pop(k, None)
    return body


def _apply_rename_field(body, config: dict) -> Union[dict, list]:
    from_key = config.get("from")
    to_key = config.get("to")
    if not from_key or not to_key:
        return body

    if isinstance(body, dict):
        if from_key in body:
            body[to_key] = body.pop(from_key)
    elif isinstance(body, list):
        for item in body:
            if isinstance(item, dict) and from_key in item:
                item[to_key] = item.pop(from_key)
    return body


def _apply_filter_keys(body, config: dict) -> Union[dict, list]:
    keep_keys = set(config.get("keys", []))
    if not keep_keys:
        return body

    if isinstance(body, dict):
        body = {k: v for k, v in body.items() if k in keep_keys}
    elif isinstance(body, list):
        body = [
            {k: v for k, v in item.items() if k in keep_keys}
            if isinstance(item, dict) else item
            for item in body
        ]
    return body


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("")
def create_transform(req: TransformCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = TransformationRule(
        user_id=user.id,
        name=req.name,
        path_pattern=req.path_pattern,
        action=req.action,
        config=json.dumps(req.config),
        is_enabled=True,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}


@router.get("")
def list_transforms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rules = db.query(TransformationRule).filter(
        TransformationRule.user_id == user.id
    ).order_by(TransformationRule.created_at.desc()).all()
    return {"rules": [_serialize_rule(r) for r in rules]}


@router.put("/{rule_id}")
def update_transform(rule_id: int, req: TransformUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(TransformationRule).filter(
        TransformationRule.id == rule_id,
        TransformationRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Transformation rule not found")

    if req.name is not None:
        rule.name = req.name
    if req.path_pattern is not None:
        rule.path_pattern = req.path_pattern
    if req.action is not None:
        if req.action not in ("add_field", "remove_field", "rename_field", "filter_keys"):
            raise HTTPException(status_code=400, detail="Invalid action. Must be one of: add_field, remove_field, rename_field, filter_keys")
        rule.action = req.action
    if req.config is not None:
        rule.config = json.dumps(req.config)

    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}


@router.delete("/{rule_id}")
def delete_transform(rule_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(TransformationRule).filter(
        TransformationRule.id == rule_id,
        TransformationRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Transformation rule not found")

    db.delete(rule)
    db.commit()
    return {"status": "success", "deleted_id": rule_id}


@router.patch("/{rule_id}/toggle")
def toggle_transform(rule_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(TransformationRule).filter(
        TransformationRule.id == rule_id,
        TransformationRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Transformation rule not found")

    rule.is_enabled = not rule.is_enabled
    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}
