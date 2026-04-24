"""
Proxy engine tests — SSRF protection, rate limiting, caching.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from proxy import _is_url_safe, PLAN_RATE_LIMITS, BLOCKED_IP_RANGES


# ═══════════════════════════════════════════════════════════════════════════════
# SSRF Protection Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestSSRFProtection:
    """Verify the proxy blocks internal/private IP addresses and dangerous URLs."""

    # ─── Must BLOCK these ─────────────────────────────────────────────────────

    @pytest.mark.parametrize("url,desc", [
        ("http://localhost:8080/api", "localhost"),
        ("http://127.0.0.1:8080/api", "127.0.0.1"),
        ("http://127.0.0.1/api", "127.0.0.1 no port"),
        ("http://10.0.0.1/api", "Private Class A"),
        ("http://10.255.255.255/api", "Private Class A edge"),
        ("http://172.16.0.1/api", "Private Class B"),
        ("http://172.31.255.255/api", "Private Class B edge"),
        ("http://192.168.0.1/api", "Private Class C"),
        ("http://192.168.1.1/api", "Private Class C"),
        ("http://169.254.169.254/latest/meta-data/", "AWS metadata"),
        ("http://metadata.google.internal/computeMetadata/", "GCP metadata"),
        ("http://metadata.google.com/", "GCP metadata alt"),
        ("http://0.0.0.0:8080/api", "This network"),
        ("http://100.64.0.1/api", "Carrier-grade NAT"),
        ("http://198.18.0.1/api", "Benchmark testing"),
    ])
    def test_blocks_internal_urls(self, url, desc):
        """All internal/private URLs must be blocked."""
        is_safe, error = _is_url_safe(url)
        assert is_safe is False, f"SSRF: {desc} ({url}) should be blocked"

    def test_blocks_blocked_hostnames(self):
        """Known dangerous hostnames must be blocked."""
        assert _is_url_safe("http://instance-data/latest/")[0] is False
        assert _is_url_safe("http://metadata/latest/")[0] is False

    def test_blocks_non_http_schemes(self):
        """Only http/https schemes are allowed."""
        assert _is_url_safe("ftp://evil.com/file")[0] is False
        assert _is_url_safe("file:///etc/passwd")[0] is False
        assert _is_url_safe("gopher://evil.com")[0] is False
        assert _is_url_safe("dict://evil.com")[0] is False

    def test_blocks_internal_urls_with_mock_dns(self):
        """Internal URLs must be blocked even with DNS resolution."""
        import socket
        original_getaddrinfo = socket.getaddrinfo
        
        def mock_getaddrinfo_internal(host, port, *args, **kwargs):
            # Return a private IP to simulate internal resolution
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('10.0.0.1', port))]
        
        try:
            socket.getaddrinfo = mock_getaddrinfo_internal
            is_safe, _ = _is_url_safe("http://internal-service/api")
            assert is_safe is False, "URL resolving to private IP should be blocked"
        finally:
            socket.getaddrinfo = original_getaddrinfo

    # ─── Must ALLOW these ────────────────────────────────────────────────────

    @pytest.mark.parametrize("url,desc", [
        ("https://httpbin.org/v1/users", "Public HTTPS API (httpbin)"),
        ("http://httpbin.org/get", "Public HTTP endpoint"),
        ("https://jsonplaceholder.typicode.com/posts", "JSON placeholder"),
        ("https://api.github.com/repos/backport", "GitHub API"),
        ("https://my-backend.onrender.com/api", "Render backend"),
        ("http://1.1.1.1/dns-query", "Public DNS (Cloudflare)"),
    ])
    def test_allows_public_urls(self, url, desc):
        """Public URLs should be allowed through."""
        # Mock DNS resolution for CI environments where DNS may fail
        import socket
        original_getaddrinfo = socket.getaddrinfo
        
        def mock_getaddrinfo(host, port, *args, **kwargs):
            # Return a fake public IP for any hostname
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('93.184.216.34', port))]
        
        try:
            socket.getaddrinfo = mock_getaddrinfo
            is_safe, _ = _is_url_safe(url)
            assert is_safe is True, f"SSRF false positive: {desc} ({url}) should be allowed"
        finally:
            socket.getaddrinfo = original_getaddrinfo

    # ─── Edge cases ──────────────────────────────────────────────────────────

    def test_invalid_url_format(self):
        """Invalid URLs should be rejected."""
        assert _is_url_safe("not-a-url")[0] is False
        assert _is_url_safe("")[0] is False
        assert _is_url_safe("://no-scheme")[0] is False

    def test_url_without_hostname(self):
        """URLs without hostname should be rejected."""
        assert _is_url_safe("http:///path-only")[0] is False


# ═══════════════════════════════════════════════════════════════════════════════
# Rate Limit Configuration Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestRateLimitConfig:
    """Verify plan-based rate limits are correctly configured."""

    def test_free_plan_limit(self):
        assert PLAN_RATE_LIMITS["free"] == 100

    def test_plus_plan_limit(self):
        assert PLAN_RATE_LIMITS["plus"] == 500

    def test_pro_plan_limit(self):
        assert PLAN_RATE_LIMITS["pro"] == 5000

    def test_enterprise_default(self):
        """Enterprise should get highest limit (defaults to pro's if not explicitly set)."""
        assert PLAN_RATE_LIMITS.get("enterprise", PLAN_RATE_LIMITS["pro"]) >= 5000

    def test_plans_scale_up(self):
        """Higher plans should have higher limits."""
        assert PLAN_RATE_LIMITS["free"] < PLAN_RATE_LIMITS["plus"]
        assert PLAN_RATE_LIMITS["plus"] < PLAN_RATE_LIMITS["pro"]


# ═══════════════════════════════════════════════════════════════════════════════
# Blocked IP Ranges Coverage
# ═══════════════════════════════════════════════════════════════════════════════

class TestBlockedIPRanges:
    """Verify all major private/internal IP ranges are covered."""

    def test_localhost(self):
        import ipaddress
        assert any(ipaddress.ip_address("127.0.0.1") in net for net in BLOCKED_IP_RANGES)

    def test_ipv6_loopback(self):
        import ipaddress
        assert any(ipaddress.ip_address("::1") in net for net in BLOCKED_IP_RANGES)

    def test_private_class_a(self):
        import ipaddress
        assert any(ipaddress.ip_address("10.0.0.1") in net for net in BLOCKED_IP_RANGES)

    def test_private_class_b(self):
        import ipaddress
        assert any(ipaddress.ip_address("172.16.0.1") in net for net in BLOCKED_IP_RANGES)

    def test_private_class_c(self):
        import ipaddress
        assert any(ipaddress.ip_address("192.168.1.1") in net for net in BLOCKED_IP_RANGES)

    def test_link_local(self):
        import ipaddress
        assert any(ipaddress.ip_address("169.254.169.254") in net for net in BLOCKED_IP_RANGES)
