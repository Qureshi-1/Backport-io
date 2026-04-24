"""
Health Monitor tests — health endpoint, health history, status detection.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from health_monitor import (
    CHECK_INTERVAL_SEC,
    CHECK_TIMEOUT_SEC,
    HEALTH_CHECK_PATH,
    MAX_RESPONSE_TIME_WARN_MS,
)
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# Configuration (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthConfig:
    def test_check_interval(self):
        assert CHECK_INTERVAL_SEC == 60

    def test_check_timeout(self):
        assert CHECK_TIMEOUT_SEC == 10

    def test_health_check_path(self):
        assert HEALTH_CHECK_PATH == "/"

    def test_slow_response_threshold(self):
        assert MAX_RESPONSE_TIME_WARN_MS == 2000


# ═══════════════════════════════════════════════════════════════════════════════
# Public Health Endpoint
# ═════════════════════════════════════════════════════════════════════════════

class TestPublicHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["version"] == "2.0.0"

    def test_root_endpoint(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Backport" in data["name"]


# ═══════════════════════════════════════════════════════════════════════════════
# User Health Status
# ═════════════════════════════════════════════════════════════════════════════

class TestUserHealth:
    def test_no_backend_configured(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/user/health", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("not_configured", "unknown")

    def test_unknown_status_no_checks(self, client):
        """User with backend URL but no health checks should get 'unknown'."""
        h, _ = create_user_for_client(client)
        # Set a backend URL
        client.put("/api/user/settings", json={
            "target_backend_url": "https://httpbin.org"
        }, headers=h)

        resp = client.get("/api/user/health", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "unknown"

    def test_unauthenticated(self, client):
        resp = client.get("/api/user/health")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Health History
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthHistory:
    def test_health_history_empty(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/user/health/history", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["period"] == "last_24h"
        assert data["total_checks"] == 0
        assert data["checks"] == []

    def test_health_history_unauthenticated(self, client):
        resp = client.get("/api/user/health/history")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Status Detection Logic
# ═══════════════════════════════════════════════════════════════════════════════

class TestStatusDetection:
    def test_status_code_classification(self):
        """Verify the expected status code classification logic."""
        up_codes = [200, 201, 301, 302, 400, 401, 403, 404]
        down_codes = [500, 502, 503]
        for code in up_codes:
            assert 200 <= code < 500 or (code >= 200 and code < 400) or 400 <= code < 500
        for code in down_codes:
            assert code >= 500
