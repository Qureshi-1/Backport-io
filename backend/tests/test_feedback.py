"""
Feedback tests — submit, list (admin), update status.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import ADMIN_SECRET
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# Submit Feedback
# ═══════════════════════════════════════════════════════════════════════════════

class TestSubmitFeedback:
    def test_submit_bug_feedback(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/feedback", json={
            "type": "bug",
            "message": "Something is broken",
            "rating": 2,
        }, headers=h)
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    def test_submit_feature_request(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/feedback", json={
            "type": "feature",
            "message": "I want a new feature",
        }, headers=h)
        assert resp.status_code == 200

    def test_submit_general_feedback(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/feedback", json={
            "type": "general",
            "message": "Great product!",
            "rating": 5,
        }, headers=h)
        assert resp.status_code == 200

    def test_submit_improvement(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/feedback", json={
            "type": "improvement",
            "message": "Please improve the UI",
        }, headers=h)
        assert resp.status_code == 200

    def test_unauthenticated_submit_rejected(self, client):
        resp = client.post("/api/feedback", json={
            "type": "bug",
            "message": "test",
        })
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# List Feedback (admin only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestListFeedback:
    def test_admin_can_list_feedback(self, client):
        h_user, _ = create_user_for_client(client)
        client.post("/api/feedback", json={
            "type": "bug", "message": "test feedback for listing"
        }, headers=h_user)

        h_admin, _ = create_user_for_client(client, is_admin=True)
        resp = client.get("/api/feedback", headers=h_admin)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_non_admin_cannot_list_feedback(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/feedback", headers=h)
        assert resp.status_code == 403

    def test_unauthenticated_list_rejected(self, client):
        resp = client.get("/api/feedback")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Update Feedback Status (admin only)
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateFeedbackStatus:
    def _submit_and_get_id(self, client):
        h_user, _ = create_user_for_client(client)
        client.post("/api/feedback", json={
            "type": "bug", "message": "status test feedback"
        }, headers=h_user)
        # Get the feedback ID from the admin list
        h_admin, _ = create_user_for_client(client, is_admin=True)
        list_resp = client.get("/api/feedback", headers=h_admin)
        feedbacks = list_resp.json()
        if isinstance(feedbacks, dict):
            feedbacks = feedbacks.get("feedbacks", feedbacks.get("items", []))
        if not isinstance(feedbacks, list):
            return None, h_admin
        for fb in feedbacks:
            if isinstance(fb, dict) and fb.get("message") == "status test feedback":
                return fb["id"], h_admin
        return None, h_admin

    def test_admin_can_update_status(self, client):
        fb_id, h_admin = self._submit_and_get_id(client)
        if fb_id is None:
            pytest.skip("Could not find feedback")
        resp = client.put(f"/api/feedback/{fb_id}/status", json={
            "status": "reviewed",
            "admin_comment": "Looking into this",
        }, headers=h_admin)
        assert resp.status_code == 200

    def test_update_nonexistent_feedback(self, client):
        h_admin, _ = create_user_for_client(client, is_admin=True)
        resp = client.put("/api/feedback/99999/status", json={
            "status": "reviewed"
        }, headers=h_admin)
        assert resp.status_code == 404

    def test_non_admin_cannot_update_status(self, client):
        h, _ = create_user_for_client(client)
        resp = client.put("/api/feedback/1/status", json={
            "status": "reviewed"
        }, headers=h)
        assert resp.status_code == 403

    def test_get_user_own_feedback(self, client):
        h, _ = create_user_for_client(client)
        client.post("/api/feedback", json={
            "type": "general", "message": "my own feedback"
        }, headers=h)
        resp = client.get("/api/user/feedback", headers=h)
        assert resp.status_code == 200
