"""
Endpoint Config tests — match_endpoint_config helper and CRUD endpoints.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from endpoint_config import match_endpoint_config


# ═══════════════════════════════════════════════════════════════════════════════
# match_endpoint_config (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestMatchEndpointConfig:
    def _make_config(self, pattern, enabled=True, max_rpm=100, burst_size=10):
        """Helper to create a mock EndpointConfig."""
        from unittest.mock import MagicMock
        cfg = MagicMock()
        cfg.path_pattern = pattern
        cfg.is_enabled = enabled
        cfg.max_rpm = max_rpm
        cfg.burst_size = burst_size
        return cfg

    def test_exact_match(self):
        cfg = self._make_config("/api/users")
        result = match_endpoint_config("/api/users", [cfg])
        assert result is not None

    def test_wildcard_match(self):
        cfg = self._make_config("/api/users/*")
        result = match_endpoint_config("/api/users/123", [cfg])
        assert result is not None

    def test_wildcard_no_match(self):
        cfg = self._make_config("/api/users/*")
        result = match_endpoint_config("/api/posts/123", [cfg])
        assert result is None

    def test_disabled_config_skipped(self):
        cfg = self._make_config("/api/users/*", enabled=False)
        result = match_endpoint_config("/api/users/123", [cfg])
        assert result is None

    def test_returns_first_match(self):
        """Should return the first matching config."""
        cfg1 = self._make_config("/api/*")
        cfg2 = self._make_config("/api/users/*")
        result = match_endpoint_config("/api/users/123", [cfg1, cfg2])
        assert result is cfg1

    def test_empty_configs(self):
        result = match_endpoint_config("/api/test", [])
        assert result is None

    def test_double_star_wildcard(self):
        cfg = self._make_config("/api/**/detail")
        result = match_endpoint_config("/api/v1/users/detail", [cfg])
        assert result is not None


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════════

from tests.test_helpers import create_user_for_client

class TestEndpointConfigAPI:
    def _auth_headers(self, client):
        h, _ = create_user_for_client(client)
        return h

    def test_create_endpoint_config(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/endpoint-config", json={
            "path_pattern": "/api/users/*",
            "max_rpm": 200,
            "burst_size": 20,
        }, headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["config"]["path_pattern"] == "/api/users/*"
        assert data["config"]["max_rpm"] == 200

    def test_create_without_leading_slash_rejected(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/endpoint-config", json={
            "path_pattern": "api/users/*",
        }, headers=h)
        assert resp.status_code == 400

    def test_list_configs(self, client):
        h = self._auth_headers(client)
        client.post("/api/endpoint-config", json={
            "path_pattern": "/api/test/*",
        }, headers=h)
        resp = client.get("/api/endpoint-config", headers=h)
        assert resp.status_code == 200
        assert len(resp.json()["configs"]) >= 1

    def test_get_specific_config(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/endpoint-config", json={
            "path_pattern": "/api/specific/*",
        }, headers=h)
        config_id = create_resp.json()["config"]["id"]

        resp = client.get(f"/api/endpoint-config/{config_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["config"]["id"] == config_id

    def test_update_config(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/endpoint-config", json={
            "path_pattern": "/api/update/*",
            "max_rpm": 100,
        }, headers=h)
        config_id = create_resp.json()["config"]["id"]

        resp = client.put(f"/api/endpoint-config/{config_id}", json={
            "max_rpm": 500,
        }, headers=h)
        assert resp.status_code == 200
        assert resp.json()["config"]["max_rpm"] == 500

    def test_toggle_config(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/endpoint-config", json={
            "path_pattern": "/api/toggle/*",
        }, headers=h)
        config_id = create_resp.json()["config"]["id"]

        resp = client.post(f"/api/endpoint-config/{config_id}/toggle", headers=h)
        assert resp.status_code == 200
        assert resp.json()["config"]["is_enabled"] is False

    def test_delete_config(self, client):
        h = self._auth_headers(client)
        create_resp = client.post("/api/endpoint-config", json={
            "path_pattern": "/api/delete/*",
        }, headers=h)
        config_id = create_resp.json()["config"]["id"]

        resp = client.delete(f"/api/endpoint-config/{config_id}", headers=h)
        assert resp.status_code == 200

    def test_unauthorized(self, client):
        resp = client.get("/api/endpoint-config")
        assert resp.status_code == 401
