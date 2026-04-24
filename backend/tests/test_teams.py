"""
Teams tests — slugify, role hierarchy, CRUD, invite, remove member.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from teams import (
    _slugify,
    _require_role_at_least,
    VALID_ROLES,
)
from tests.test_helpers import create_user_for_client
from config import ADMIN_SECRET


# ═══════════════════════════════════════════════════════════════════════════════
# Slugify (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestSlugify:
    def test_basic_slug(self):
        assert _slugify("My Team") == "my-team"

    def test_special_chars(self):
        assert _slugify("Hello! World@#$") == "hello-world"

    def test_multiple_spaces(self):
        assert _slugify("Hello   World") == "hello-world"

    def test_leading_trailing_spaces(self):
        assert _slugify("  Hello World  ") == "hello-world"

    def test_already_lowercase(self):
        assert _slugify("hello-world") == "hello-world"

    def test_numbers_in_name(self):
        assert _slugify("Team 42") == "team-42"

    def test_short_name_padded(self):
        """Names shorter than 3 chars should be padded with 'team-'."""
        slug = _slugify("AB")
        assert slug.startswith("team-")

    def test_max_length(self):
        """Slug should be truncated to 50 characters."""
        long_name = "A" * 100
        assert len(_slugify(long_name)) <= 50

    def test_empty_result_handled(self):
        slug = _slugify("   ")
        assert len(slug) >= 3


# ═══════════════════════════════════════════════════════════════════════════════
# Role Hierarchy (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestRoleHierarchy:
    def test_viewer_can_view(self):
        assert _require_role_at_least("viewer", "viewer") is True

    def test_viewer_cannot_admin(self):
        assert _require_role_at_least("viewer", "admin") is False

    def test_member_can_member(self):
        assert _require_role_at_least("member", "member") is True

    def test_member_cannot_admin(self):
        assert _require_role_at_least("member", "admin") is False

    def test_admin_can_admin(self):
        assert _require_role_at_least("admin", "admin") is True

    def test_admin_cannot_owner(self):
        assert _require_role_at_least("admin", "owner") is False

    def test_owner_can_do_anything(self):
        assert _require_role_at_least("owner", "viewer") is True
        assert _require_role_at_least("owner", "member") is True
        assert _require_role_at_least("owner", "admin") is True
        assert _require_role_at_least("owner", "owner") is True

    def test_unknown_role_defaults_low(self):
        """Unknown roles default to level 0 which equals viewer."""
        assert _require_role_at_least("unknown", "viewer") is True  # both default to 0
        assert _require_role_at_least("unknown", "admin") is False

    def test_valid_roles_set(self):
        assert VALID_ROLES == {"owner", "admin", "member", "viewer"}


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestTeamsAPI:
    def test_create_team(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/teams", json={"name": "Test Team"}, headers=h)
        assert resp.status_code == 200
        data = resp.json()["team"]
        assert data["name"] == "Test Team"
        assert data["slug"] == "test-team"
        assert data["member_count"] >= 1

    def test_create_team_empty_name_rejected(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/teams", json={"name": "   "}, headers=h)
        assert resp.status_code == 400

    def test_list_teams(self, client):
        h, _ = create_user_for_client(client)
        client.post("/api/teams", json={"name": "List Team"}, headers=h)
        resp = client.get("/api/teams", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()["teams"]) >= 1

    def test_update_team_name(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/teams", json={"name": "Old Name"}, headers=h)
        team_id = create_resp.json()["team"]["id"]

        resp = client.put(f"/api/teams/{team_id}", json={"name": "New Name"}, headers=h)
        assert resp.status_code == 200
        assert resp.json()["team"]["name"] == "New Name"

    def test_delete_team(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/teams", json={"name": "Delete Me"}, headers=h)
        team_id = create_resp.json()["team"]["id"]

        resp = client.delete(f"/api/teams/{team_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["deleted_id"] == team_id

    def test_get_team_details(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/teams", json={"name": "Detail Team"}, headers=h)
        team_id = create_resp.json()["team"]["id"]

        resp = client.get(f"/api/teams/{team_id}", headers=h)
        assert resp.status_code == 200
        assert "members" in resp.json()["team"]

    def test_invite_member(self, client):
        h_owner, _ = create_user_for_client(client)
        _, invitee_email = create_user_for_client(client)

        create_resp = client.post("/api/teams", json={"name": "Invite Team"}, headers=h_owner)
        team_id = create_resp.json()["team"]["id"]

        resp = client.post(f"/api/teams/{team_id}/invite",
                          json={"email": invitee_email}, headers=h_owner)
        assert resp.status_code == 200
        assert resp.json()["member"]["role"] == "member"

    def test_invite_duplicate_rejected(self, client):
        h_owner, _ = create_user_for_client(client)
        _, invitee_email = create_user_for_client(client)

        create_resp = client.post("/api/teams", json={"name": "Dup Team"}, headers=h_owner)
        team_id = create_resp.json()["team"]["id"]

        client.post(f"/api/teams/{team_id}/invite",
                    json={"email": invitee_email}, headers=h_owner)
        resp = client.post(f"/api/teams/{team_id}/invite",
                          json={"email": invitee_email}, headers=h_owner)
        assert resp.status_code == 400

    def test_remove_member(self, client):
        h_owner, _ = create_user_for_client(client)
        h_member, member_email = create_user_for_client(client)

        create_resp = client.post("/api/teams", json={"name": "RM Team"}, headers=h_owner)
        team_id = create_resp.json()["team"]["id"]

        invite_resp = client.post(f"/api/teams/{team_id}/invite",
                                  json={"email": member_email}, headers=h_owner)

        # Get the user_id from the team members
        team_detail = client.get(f"/api/teams/{team_id}", headers=h_owner).json()
        member_user_id = None
        for m in team_detail["team"]["members"]:
            if m["email"] == member_email:
                member_user_id = m["user_id"]
                break
        assert member_user_id is not None

        resp = client.delete(f"/api/teams/{team_id}/members/{member_user_id}", headers=h_owner)
        assert resp.status_code == 200

    def test_cannot_remove_owner(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/teams", json={"name": "Owner Team"}, headers=h)
        team_id = create_resp.json()["team"]["id"]
        owner_id = create_resp.json()["team"]["owner_id"]

        resp = client.delete(f"/api/teams/{team_id}/members/{owner_id}", headers=h)
        assert resp.status_code == 400

    def test_unauthorized(self, client):
        resp = client.get("/api/teams")
        assert resp.status_code == 401
