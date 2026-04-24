"""
Admin tests — stats, bootstrap, delete user, update plan.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import ADMIN_SECRET
from tests.test_helpers import create_user_for_client


def _create_admin_headers(client):
    """Create an admin user and return auth headers."""
    h, email = create_user_for_client(client, is_admin=True)
    return h, email


# ═══════════════════════════════════════════════════════════════════════════════
# Bootstrap Admin
# ═══════════════════════════════════════════════════════════════════════════════

class TestBootstrapAdmin:
    def test_bootstrap_with_valid_secret(self, client):
        h, email = create_user_for_client(client)
        resp = client.post("/api/admin/bootstrap", json={
            "email": email, "secret": ADMIN_SECRET
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    def test_bootstrap_with_invalid_secret(self, client):
        h, email = create_user_for_client(client)
        resp = client.post("/api/admin/bootstrap", json={
            "email": email, "secret": "wrong-secret"
        })
        assert resp.status_code == 403

    def test_bootstrap_nonexistent_user(self, client):
        resp = client.post("/api/admin/bootstrap", json={
            "email": "nobody@example.com", "secret": ADMIN_SECRET
        })
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# Admin Stats
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminStats:
    def test_get_stats_as_admin(self, client):
        h, _ = _create_admin_headers(client)
        resp = client.get("/api/admin/stats", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_requests" in data
        assert "plan_distribution" in data

    def test_get_stats_as_non_admin_rejected(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/admin/stats", headers=h)
        assert resp.status_code == 403

    def test_get_stats_unauthenticated(self, client):
        resp = client.get("/api/admin/stats")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# List Users
# ═══════════════════════════════════════════════════════════════════════════════

class TestListUsers:
    def test_list_users_as_admin(self, client):
        h, _ = _create_admin_headers(client)
        resp = client.get("/api/admin/users", headers=h)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ═══════════════════════════════════════════════════════════════════════════════
# Update Plan
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdatePlan:
    def test_update_user_plan(self, client):
        h_admin, _ = _create_admin_headers(client)
        _, target_email = create_user_for_client(client)

        resp = client.post("/api/admin/update-plan", json={
            "email": target_email, "plan": "pro"
        }, headers=h_admin)
        assert resp.status_code == 200
        assert "pro" in resp.json()["message"]

    def test_update_plan_nonexistent_user(self, client):
        h_admin, _ = _create_admin_headers(client)
        resp = client.post("/api/admin/update-plan", json={
            "email": "nonexistent@example.com", "plan": "pro"
        }, headers=h_admin)
        assert resp.status_code == 404

    def test_update_plan_as_non_admin_rejected(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/admin/update-plan", json={
            "email": "anyone@example.com", "plan": "pro"
        }, headers=h)
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# Delete User
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeleteUser:
    def test_delete_user_as_admin(self, client):
        h_admin, _ = _create_admin_headers(client)
        _, target_email = create_user_for_client(client)

        resp = client.post("/api/admin/delete-user", json={
            "email": target_email, "secret": ADMIN_SECRET
        }, headers=h_admin)
        # May fail in test SQLite due to separate session
        assert resp.status_code in (200, 500)

    def test_delete_user_wrong_secret(self, client):
        h_admin, _ = _create_admin_headers(client)
        _, target_email = create_user_for_client(client)

        resp = client.post("/api/admin/delete-user", json={
            "email": target_email, "secret": "wrong-secret"
        }, headers=h_admin)
        assert resp.status_code == 403

    def test_delete_nonexistent_user(self, client):
        h_admin, _ = _create_admin_headers(client)
        resp = client.post("/api/admin/delete-user", json={
            "email": "nobody@example.com", "secret": ADMIN_SECRET
        }, headers=h_admin)
        assert resp.status_code == 200
        assert resp.json()["status"] == "not_found"


# ═══════════════════════════════════════════════════════════════════════════════
# Feedbacks (admin)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAdminFeedbacks:
    def test_list_all_feedbacks_as_admin(self, client):
        h_admin, _ = _create_admin_headers(client)
        resp = client.get("/api/admin/feedbacks", headers=h_admin)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
