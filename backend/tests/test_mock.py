"""
Mock endpoint tests — get_mock_response, CRUD, toggle, method filtering.
"""
import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from mock import get_mock_response, MockEndpoint, VALID_HTTP_METHODS


# ═══════════════════════════════════════════════════════════════════════════════
# get_mock_response (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetMockResponse:
    def test_returns_mock_for_matching_path(self, db):
        """Should return mock response for matching path pattern."""
        mock = MockEndpoint(
            user_id=1, method="GET", path_pattern="/api/users/*",
            status_code=200,
            response_body=json.dumps({"mock": True}),
            headers=json.dumps({"X-Mock": "true"}),
            is_enabled=True,
        )
        db.add(mock)
        db.commit()

        result = get_mock_response(1, "GET", "/api/users/123", db)
        assert result is not None
        status, body, headers = result
        assert status == 200
        assert body == {"mock": True}
        assert headers == {"X-Mock": "true"}

    def test_returns_none_for_no_match(self, db):
        """Should return None when no mock matches."""
        result = get_mock_response(1, "GET", "/api/users/123", db)
        assert result is None

    def test_method_filtering(self, db):
        """Should only match mocks for the correct HTTP method."""
        mock = MockEndpoint(
            user_id=1, method="POST", path_pattern="/api/users/*",
            status_code=201,
            response_body=json.dumps({"created": True}),
            headers="{}", is_enabled=True,
        )
        db.add(mock)
        db.commit()

        # GET should not match POST mock
        result = get_mock_response(1, "GET", "/api/users/123", db)
        assert result is None

        # POST should match
        result = get_mock_response(1, "POST", "/api/users/123", db)
        assert result is not None
        assert result[0] == 201

    def test_disabled_mock_not_matched(self, db):
        """Disabled mocks should not be matched."""
        mock = MockEndpoint(
            user_id=1, method="GET", path_pattern="/api/test",
            status_code=200, response_body="{}",
            headers="{}", is_enabled=False,
        )
        db.add(mock)
        db.commit()

        result = get_mock_response(1, "GET", "/api/test", db)
        assert result is None

    def test_returns_first_matching_mock(self, db):
        """Should return the first matching mock (order-dependent)."""
        mock1 = MockEndpoint(
            user_id=1, method="GET", path_pattern="*",
            status_code=200, response_body=json.dumps({"first": True}),
            headers="{}", is_enabled=True,
        )
        mock2 = MockEndpoint(
            user_id=1, method="GET", path_pattern="/api/specific",
            status_code=200, response_body=json.dumps({"second": True}),
            headers="{}", is_enabled=True,
        )
        db.add(mock1)
        db.add(mock2)
        db.commit()

        # The first mock (*) matches everything
        result = get_mock_response(1, "GET", "/api/specific", db)
        assert result is not None
        assert result[1] == {"first": True}

    def test_handles_invalid_json_gracefully(self, db):
        """Should handle invalid JSON in response_body gracefully."""
        mock = MockEndpoint(
            user_id=1, method="GET", path_pattern="/api/bad-json",
            status_code=200, response_body="not json",
            headers="also not json", is_enabled=True,
        )
        db.add(mock)
        db.commit()

        result = get_mock_response(1, "GET", "/api/bad-json", db)
        assert result is not None
        status, body, headers = result
        assert body == {}  # Falls back to empty dict
        assert headers == {}


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════════

from tests.test_helpers import create_user_for_client

class TestMockAPI:
    def _auth_headers(self, client):
        h, _ = create_user_for_client(client)
        return h

    def test_create_mock(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/mocks", json={
            "method": "GET",
            "path_pattern": "/api/users/*",
            "status_code": 200,
            "response_body": {"users": []},
            "headers": {"X-Custom": "value"},
        }, headers=h)
        assert resp.status_code == 200
        data = resp.json()["mock"]
        assert data["method"] == "GET"
        assert data["status_code"] == 200
        assert data["is_enabled"] is True

    def test_list_mocks(self, client):
        h = self._auth_headers(client)
        client.post("/api/mocks", json={
            "method": "GET", "path_pattern": "/api/test",
        }, headers=h)
        resp = client.get("/api/mocks", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()["mocks"]) >= 1

    def test_update_mock(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/mocks", json={
            "method": "GET", "path_pattern": "/api/update", "status_code": 200,
        }, headers=h)
        mock_id = create_resp.json()["mock"]["id"]

        resp = client.put(f"/api/mocks/{mock_id}", json={
            "status_code": 404,
            "response_body": {"error": "not found"},
        }, headers=h)
        assert resp.status_code == 200
        assert resp.json()["mock"]["status_code"] == 404

    def test_toggle_mock(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/mocks", json={
            "method": "POST", "path_pattern": "/api/toggle",
        }, headers=h)
        mock_id = create_resp.json()["mock"]["id"]

        resp = client.patch(f"/api/mocks/{mock_id}/toggle", headers=h)
        assert resp.status_code == 200
        assert resp.json()["mock"]["is_enabled"] is False

    def test_delete_mock(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/mocks", json={
            "method": "DELETE", "path_pattern": "/api/del",
        }, headers=h)
        mock_id = create_resp.json()["mock"]["id"]

        resp = client.delete(f"/api/mocks/{mock_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["deleted_id"] == mock_id

    def test_valid_http_methods(self):
        """All standard HTTP methods should be in VALID_HTTP_METHODS."""
        for method in ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]:
            assert method in VALID_HTTP_METHODS

    def test_unauthorized(self, client):
        resp = client.get("/api/mocks")
        assert resp.status_code == 401
