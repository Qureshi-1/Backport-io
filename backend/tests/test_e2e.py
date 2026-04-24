"""
End-to-end integration tests — full request flow through the gateway.
Tests: health, public API validation, unauthenticated dashboard access, WAF, SSRF.
"""
import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════════════════════════════════════════
# Health Check
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthCheck:
    """Public health endpoint should always be available."""

    def test_health_returns_200(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert data["gateway"] == "Backport"

    def test_root_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "Backport" in data["name"]


# ═══════════════════════════════════════════════════════════════════════════════
# Public API — Validation & Error Handling
# ═══════════════════════════════════════════════════════════════════════════════

class TestPublicAPIValidation:
    """Public API endpoints should validate input properly."""

    def test_login_with_missing_fields_returns_422(self, client):
        """Login without required fields should return validation error."""
        resp = client.post("/api/auth/login", json={"email": "test@test.com"})
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════════════
# Dashboard API — Unauthenticated Access Returns 401
# ═══════════════════════════════════════════════════════════════════════════════

class TestDashboardUnauthenticated:
    """All dashboard endpoints must return 401 without authentication."""

    @pytest.mark.parametrize("endpoint", [
        "/api/user/me",
        "/api/user/settings",
        "/api/user/keys",
        "/api/user/logs",
        "/api/user/traffic",
        "/api/user/analytics/stats",
        "/api/billing/plan",
    ])
    def test_unauthenticated_returns_401(self, client, endpoint):
        resp = client.get(endpoint)
        assert resp.status_code == 401, f"Expected 401 for {endpoint}, got {resp.status_code}"


# ═══════════════════════════════════════════════════════════════════════════════
# WAF Direct Pattern Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestWAFPatternsDirect:
    """Verify WAF function catches common attack vectors."""

    def test_waf_catches_sql_injection(self):
        from proxy import check_waf
        assert check_waf("'; DROP TABLE users; --", "/proxy/users", "") is True

    def test_waf_catches_xss(self):
        from proxy import check_waf
        assert check_waf("<script>alert('xss')</script>", "/proxy/comment", "") is True

    def test_waf_catches_path_traversal(self):
        from proxy import check_waf
        assert check_waf("", "/proxy/../../../../etc/passwd", "") is True

    def test_waf_catches_command_injection(self):
        from proxy import check_waf
        assert check_waf("; cat /etc/passwd", "/proxy/exec", "") is True

    def test_waf_allows_normal_request(self):
        from proxy import check_waf
        assert check_waf('{"name": "John", "email": "john@example.com"}', "/proxy/users", "") is False


# ═══════════════════════════════════════════════════════════════════════════════
# SSRF Protection
# ═══════════════════════════════════════════════════════════════════════════════

class TestSSRFProtection:
    """Verify proxy blocks requests to private/internal IPs."""

    def test_blocked_hostnames_include_localhost(self):
        from proxy import BLOCKED_HOSTNAMES
        for host in ["localhost", "metadata.google.internal", "169.254.169.254"]:
            assert host in BLOCKED_HOSTNAMES, f"{host} should be in BLOCKED_HOSTNAMES"

    def test_blocked_ip_ranges_include_private(self):
        import ipaddress
        from proxy import BLOCKED_IP_RANGES
        private_networks = [
            ipaddress.ip_network("127.0.0.0/8"),
            ipaddress.ip_network("10.0.0.0/8"),
            ipaddress.ip_network("192.168.0.0/16"),
        ]
        for priv in private_networks:
            assert any(priv.overlaps(b) for b in BLOCKED_IP_RANGES), f"{priv} should be blocked"
