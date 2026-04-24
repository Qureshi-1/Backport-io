import re
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Tuple

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text

from database import Base
from models import User
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/custom-waf", tags=["custom-waf"])

VALID_ACTIONS = {"block", "log"}
VALID_SEVERITIES = {"low", "medium", "high", "critical"}


# ─── SQLAlchemy Model ──────────────────────────────────────────────────────────

class CustomWafRule(Base):
    __tablename__ = "custom_waf_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    pattern = Column(Text, nullable=False)       # Regex string
    action = Column(String, nullable=False)       # block / log
    severity = Column(String, default="medium")   # low / medium / high / critical
    is_enabled = Column(Boolean, default=True)
    hit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class WafRuleCreate(BaseModel):
    name: str
    pattern: str
    action: str = Field(..., pattern="^(block|log)$")
    severity: str = Field("medium", pattern="^(low|medium|high|critical)$")

class WafRuleUpdate(BaseModel):
    name: Optional[str] = None
    pattern: Optional[str] = None
    action: Optional[str] = None
    severity: Optional[str] = None


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_rule(rule: CustomWafRule) -> dict:
    return {
        "id": rule.id,
        "user_id": rule.user_id,
        "name": rule.name,
        "pattern": rule.pattern,
        "action": rule.action,
        "severity": rule.severity,
        "is_enabled": rule.is_enabled,
        "hit_count": rule.hit_count,
        "created_at": rule.created_at.isoformat() if rule.created_at else None,
    }


# Known dangerous regex constructs that can cause ReDoS
_REDOS_NESTED_QUANTIFIERS = re.compile(r"\([^)]*[+*][^)]*\)[+*{]")
_REDOS_OVERLAPPING_ALTERNATIONS = re.compile(r"\([^)]*\|[^)]*\)[+*]{]")
_REDOS_COMPLEX_CHAR_CLASSES = re.compile(r"([+*{])[^+*{]*\1[^+*{]*\1")


def _validate_regex(pattern: str) -> bool:
    """Return True if the pattern compiles as a valid regex and is not a known ReDoS risk."""
    # Check for dangerous nested quantifiers like (a+)+, (a*)*, (a+)*, (a+){n}
    if _REDOS_NESTED_QUANTIFIERS.search(pattern):
        return False
    # Check for overlapping alternations with quantifiers like (a|b)+
    if _REDOS_OVERLAPPING_ALTERNATIONS.search(pattern):
        return False
    # Check for repeated quantifiers on complex char classes
    if _REDOS_COMPLEX_CHAR_CLASSES.search(pattern):
        return False
    # Try to compile with a timeout-like safety check (limit pattern complexity)
    try:
        compiled = re.compile(pattern)
        # Test against a pathological string to detect catastrophic backtracking
        test_string = "a" * 25 + "b"
        try:
            compiled.search(test_string)  # This should not hang for safe patterns
        except Exception:
            return False
        return True
    except re.error:
        return False


# ─── WAF Check (exported) ─────────────────────────────────────────────────────

def check_custom_waf(
    user_id: int,
    body_str: str,
    path: str,
    query: str,
    db: Session,
) -> Tuple[bool, List[Dict]]:
    """
    Check the user's custom WAF rules against the request.

    Returns:
        (blocked: bool, matched_rules: list of matched rule dicts)
    """
    rules = db.query(CustomWafRule).filter(
        CustomWafRule.user_id == user_id,
        CustomWafRule.is_enabled == True,
    ).all()

    combined = f"{body_str} {path} {query}"
    matched: List[Dict] = []
    blocked = False

    for rule in rules:
        try:
            compiled = re.compile(rule.pattern)
            if compiled.search(combined):
                matched.append({
                    "id": rule.id,
                    "name": rule.name,
                    "pattern": rule.pattern,
                    "action": rule.action,
                    "severity": rule.severity,
                })
                if rule.action == "block":
                    blocked = True
                # Increment hit count
                rule.hit_count = (rule.hit_count or 0) + 1
                db.add(rule)
        except re.error:
            continue

    if matched:
        try:
            db.commit()
        except Exception:
            db.rollback()

    return (blocked, matched)


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("")
def create_waf_rule(req: WafRuleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _validate_regex(req.pattern):
        raise HTTPException(status_code=400, detail="Invalid regular expression pattern")

    rule = CustomWafRule(
        user_id=user.id,
        name=req.name,
        pattern=req.pattern,
        action=req.action,
        severity=req.severity,
        is_enabled=True,
        hit_count=0,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}


@router.get("")
def list_waf_rules(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rules = db.query(CustomWafRule).filter(
        CustomWafRule.user_id == user.id
    ).order_by(CustomWafRule.created_at.desc()).all()
    return {"rules": [_serialize_rule(r) for r in rules]}


@router.get("/stats")
def waf_rule_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rules = db.query(CustomWafRule).filter(
        CustomWafRule.user_id == user.id
    ).order_by(CustomWafRule.hit_count.desc()).all()
    return {
        "stats": [
            {
                "id": r.id,
                "name": r.name,
                "hit_count": r.hit_count or 0,
                "is_enabled": r.is_enabled,
            }
            for r in rules
        ]
    }


@router.put("/{rule_id}")
def update_waf_rule(rule_id: int, req: WafRuleUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(CustomWafRule).filter(
        CustomWafRule.id == rule_id,
        CustomWafRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Custom WAF rule not found")

    if req.name is not None:
        rule.name = req.name
    if req.pattern is not None:
        if not _validate_regex(req.pattern):
            raise HTTPException(status_code=400, detail="Invalid regular expression pattern")
        rule.pattern = req.pattern
    if req.action is not None:
        if req.action not in VALID_ACTIONS:
            raise HTTPException(status_code=400, detail="Invalid action. Must be one of: block, log")
        rule.action = req.action
    if req.severity is not None:
        if req.severity not in VALID_SEVERITIES:
            raise HTTPException(status_code=400, detail="Invalid severity. Must be one of: low, medium, high, critical")
        rule.severity = req.severity

    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}


@router.delete("/{rule_id}")
def delete_waf_rule(rule_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(CustomWafRule).filter(
        CustomWafRule.id == rule_id,
        CustomWafRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Custom WAF rule not found")

    db.delete(rule)
    db.commit()
    return {"status": "success", "deleted_id": rule_id}


@router.patch("/{rule_id}/toggle")
def toggle_waf_rule(rule_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rule = db.query(CustomWafRule).filter(
        CustomWafRule.id == rule_id,
        CustomWafRule.user_id == user.id,
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Custom WAF rule not found")

    rule.is_enabled = not rule.is_enabled
    db.commit()
    db.refresh(rule)
    return {"status": "success", "rule": _serialize_rule(rule)}
