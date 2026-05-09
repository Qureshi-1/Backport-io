import re
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import User, Team, TeamMember
from dependencies import get_current_user, get_db

router = APIRouter(prefix="/api/teams", tags=["teams"])

VALID_ROLES = {"owner", "admin", "member", "viewer"}


# ─── Pydantic Schemas ──────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    name: str

class TeamUpdate(BaseModel):
    name: str

class InviteMemberReq(BaseModel):
    email: str

class UpdateRoleReq(BaseModel):
    role: str


# ─── Helpers ───────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    """Generate a URL-safe slug from a team name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    # Ensure uniqueness by appending a short hash if needed
    if len(slug) < 3:
        slug = f"team-{slug}"
    return slug[:50]


def _serialize_team(team: Team, include_members: bool = False) -> dict:
    """Serialize a Team model to a dictionary."""
    result = {
        "id": team.id,
        "name": team.name,
        "slug": team.slug,
        "owner_id": team.owner_id,
        "created_at": team.created_at.isoformat() if team.created_at else None,
        "member_count": len(team.members) if team.members else 0,
    }
    if include_members and team.members:
        result["members"] = [
            {
                "user_id": m.user_id,
                "email": m.user.email if m.user else None,
                "role": m.role,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            }
            for m in team.members
        ]
    return result


def _get_team_membership(db: Session, team_id: int, user_id: int) -> Optional[TeamMember]:
    """Get the membership record for a user in a team, or None."""
    return db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
    ).first()


def _require_role_at_least(current_role: str, required_role: str) -> bool:
    """Check if current_role has at least the permission level of required_role."""
    role_hierarchy = {"viewer": 0, "member": 1, "admin": 2, "owner": 3}
    return role_hierarchy.get(current_role, 0) >= role_hierarchy.get(required_role, 0)


def _require_team_admin(db: Session, team_id: int, user_id: int) -> TeamMember:
    """Get membership and verify the user is admin or owner. Raises 403 otherwise."""
    membership = _get_team_membership(db, team_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    if not _require_role_at_least(membership.role, "admin"):
        raise HTTPException(status_code=403, detail="Admin or owner access required")
    return membership


def _require_team_owner(db: Session, team_id: int, user_id: int) -> Team:
    """Verify the user is the team owner. Raises 403 otherwise."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the team owner can perform this action")
    return team


# ─── API Endpoints ─────────────────────────────────────────────────────────

@router.post("")
def create_team(req: TeamCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new team. The creator becomes the owner."""
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Team name is required")

    name = req.name.strip()
    slug = _slugify(name)

    # Ensure slug uniqueness
    existing = db.query(Team).filter(Team.slug == slug).first()
    if existing:
        # Append a counter suffix
        counter = 1
        while db.query(Team).filter(Team.slug == f"{slug}-{counter}").first():
            counter += 1
        slug = f"{slug}-{counter}"

    team = Team(name=name, slug=slug, owner_id=user.id)
    db.add(team)
    db.commit()
    db.refresh(team)

    # Add creator as owner member
    member = TeamMember(team_id=team.id, user_id=user.id, role="owner")
    db.add(member)
    db.commit()
    db.refresh(team)

    # Set as current team context
    user.current_team_id = team.id
    db.commit()

    return {"status": "success", "team": _serialize_team(team, include_members=True)}


@router.get("")
def list_teams(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all teams the current user is a member of."""
    memberships = db.query(TeamMember).filter(TeamMember.user_id == user.id).all()
    team_ids = [m.team_id for m in memberships]
    teams = db.query(Team).filter(Team.id.in_(team_ids)).all() if team_ids else []

    return {
        "teams": [_serialize_team(t) for t in teams],
        "current_team_id": user.current_team_id,
    }


@router.get("/{team_id}")
def get_team(team_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get team details with members."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    membership = _get_team_membership(db, team_id, user.id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    return {"team": _serialize_team(team, include_members=True)}


@router.put("/{team_id}")
def update_team(team_id: int, req: TeamUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update team name (admin+ only)."""
    if not req.name or not req.name.strip():
        raise HTTPException(status_code=400, detail="Team name is required")

    _require_team_admin(db, team_id, user.id)

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    team.name = req.name.strip()
    db.commit()
    db.refresh(team)

    return {"status": "success", "team": _serialize_team(team)}


@router.delete("/{team_id}")
def delete_team(team_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a team (owner only)."""
    team = _require_team_owner(db, team_id, user.id)

    # Clear current_team_id for all members who had this team as context
    memberships = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    for m in memberships:
        member_user = db.query(User).filter(User.id == m.user_id).first()
        if member_user and member_user.current_team_id == team_id:
            member_user.current_team_id = None

    db.delete(team)
    db.commit()

    return {"status": "success", "deleted_id": team_id}


@router.post("/{team_id}/invite")
def invite_member(team_id: int, req: InviteMemberReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Invite a member to the team by email (admin+ only)."""
    _require_team_admin(db, team_id, user.id)

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Find user by email
    invitee = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not invitee:
        raise HTTPException(status_code=404, detail="No account found with that email address")

    # Check if already a member
    existing = _get_team_membership(db, team_id, invitee.id)
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")

    # Add as member
    member = TeamMember(team_id=team_id, user_id=invitee.id, role="member")
    db.add(member)
    db.commit()
    db.refresh(team)

    # Broadcast via WebSocket
    try:
        from ws import manager
        import asyncio
        asyncio.get_event_loop().create_task(
            manager.broadcast_to_user(invitee.id, {
                "type": "team_invite",
                "team_id": team_id,
                "team_name": team.name,
                "invited_by": user.email,
            })
        )
    except Exception as e:
        logger.warning(f"Failed to broadcast team invite via WebSocket: {e}")

    return {
        "status": "success",
        "member": {
            "user_id": invitee.id,
            "email": invitee.email,
            "role": "member",
        }
    }


@router.delete("/{team_id}/members/{target_user_id}")
def remove_member(team_id: int, target_user_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove a member from the team (admin+ only, cannot remove owner)."""
    membership = _require_team_admin(db, team_id, user.id)

    target = _get_team_membership(db, team_id, target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User is not a member of this team")

    # Cannot remove the owner
    if target.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot remove the team owner. Transfer ownership first.")

    # Admins cannot remove other admins (only owner can)
    if target.role == "admin" and membership.role != "owner":
        raise HTTPException(status_code=403, detail="Only the team owner can remove admin members")

    # Clear current_team_id if the removed user had this team as context
    removed_user = db.query(User).filter(User.id == target_user_id).first()
    if removed_user and removed_user.current_team_id == team_id:
        removed_user.current_team_id = None

    db.delete(target)
    db.commit()

    return {"status": "success", "removed_user_id": target_user_id}


@router.patch("/{team_id}/members/{target_user_id}/role")
def update_member_role(team_id: int, target_user_id: int, req: UpdateRoleReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Change a member's role (owner only)."""
    _require_team_owner(db, team_id, user.id)

    if req.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(VALID_ROLES))}"
        )

    target = _get_team_membership(db, team_id, target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User is not a member of this team")

    # Cannot change the owner's role
    if target.role == "owner":
        raise HTTPException(status_code=400, detail="Cannot change the owner's role")

    # Cannot demote self (if current user is the owner and target is self... edge case)
    if target_user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role. Use team transfer instead.")

    target.role = req.role
    db.commit()
    db.refresh(target)

    return {
        "status": "success",
        "member": {
            "user_id": target.user_id,
            "role": target.role,
        }
    }


@router.put("/{team_id}/switch")
def switch_current_team(team_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Switch the user's active team context."""
    membership = _get_team_membership(db, team_id, user.id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    user.current_team_id = team_id
    db.commit()

    return {"status": "success", "current_team_id": team_id}
