"""
Custom WAF rule engine tests.
Tests user-defined WAF rules (CRUD, validation, pattern matching).
"""
import sys
import os
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from custom_waf import (
    _validate_regex,
    _serialize_rule,
    check_custom_waf,
    CustomWafRule,
    WafRuleCreate,
    WafRuleUpdate,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Regex Validation
# ═══════════════════════════════════════════════════════════════════════════════

class TestRegexValidation:
    """Test the regex pattern validator."""

    def test_valid_regex(self):
        # Import inside test to avoid any circular import issues in CI
        from custom_waf import _validate_regex
        assert _validate_regex(r"\d{4}") is True
        assert _validate_regex(r"(?i)admin") is True
        assert _validate_regex(r"[a-zA-Z0-9]+") is True
        assert _validate_regex(r".*") is True

    def test_invalid_regex(self):
        from custom_waf import _validate_regex
        assert _validate_regex(r"[invalid") is False
        assert _validate_regex(r"(?P<name)") is False
        assert _validate_regex(r"*star") is False
        assert _validate_regex(r"+plus") is False

    def test_empty_regex(self):
        from custom_waf import _validate_regex
        assert _validate_regex("") is True  # empty string is valid regex

    def test_complex_regex(self):
        from custom_waf import _validate_regex
        assert _validate_regex(r"(?:^|\s)admin(?:\s|$)") is True
        assert _validate_regex(r"https?://[^\s]+") is True


# ═══════════════════════════════════════════════════════════════════════════════
# Serialization
# ═══════════════════════════════════════════════════════════════════════════════

class TestSerialization:
    """Test rule serialization to dict."""

    def test_serialize_rule(self):
        rule = MagicMock()
        rule.id = 1
        rule.user_id = 42
        rule.name = "Block Admin"
        rule.pattern = r"(?i)admin"
        rule.action = "block"
        rule.severity = "high"
        rule.is_enabled = True
        rule.hit_count = 5
        rule.created_at = MagicMock()
        rule.created_at.isoformat.return_value = "2026-01-01T00:00:00"

        result = _serialize_rule(rule)
        assert result["id"] == 1
        assert result["name"] == "Block Admin"
        assert result["pattern"] == r"(?i)admin"
        assert result["action"] == "block"
        assert result["severity"] == "high"
        assert result["is_enabled"] is True
        assert result["hit_count"] == 5
        assert result["created_at"] == "2026-01-01T00:00:00"


# ═══════════════════════════════════════════════════════════════════════════════
# Custom WAF Check Engine
# ═══════════════════════════════════════════════════════════════════════════════

class TestCustomWAFCheck:
    """Test the custom WAF check function."""

    def _make_rule(self, name, pattern, action="block", severity="medium"):
        """Helper to create a mock rule object."""
        rule = MagicMock()
        rule.id = 1
        rule.user_id = 42
        rule.name = name
        rule.pattern = pattern
        rule.action = action
        rule.severity = severity
        rule.is_enabled = True
        rule.hit_count = 0
        return rule

    def test_block_matching_pattern(self):
        """Rule with 'block' action should block matching requests."""
        rule = self._make_rule("Block Admin", r"(?i)\badmin\b")
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule]

        blocked, matched = check_custom_waf(42, '{"user": "admin"}', "/api/test", "", db)
        assert blocked is True
        assert len(matched) == 1
        assert matched[0]["name"] == "Block Admin"
        assert matched[0]["action"] == "block"

    def test_log_only_action(self):
        """Rule with 'log' action should log but NOT block."""
        rule = self._make_rule("Log Suspicious", r"suspicious", action="log")
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule]

        blocked, matched = check_custom_waf(42, "suspicious content", "/api/test", "", db)
        assert blocked is False  # Not blocked, just logged
        assert len(matched) == 1
        assert matched[0]["action"] == "log"

    def test_no_match(self):
        """Non-matching request should pass through."""
        rule = self._make_rule("Block SQL", r"(?i)\bselect\b.*\bfrom\b")
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule]

        blocked, matched = check_custom_waf(42, '{"name": "hello"}', "/api/test", "", db)
        assert blocked is False
        assert len(matched) == 0

    def test_empty_rules_list(self):
        """No rules configured should allow all requests."""
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = []

        blocked, matched = check_custom_waf(42, "anything", "/api/test", "", db)
        assert blocked is False
        assert len(matched) == 0

    def test_multiple_rules(self):
        """Multiple rules should be checked in order."""
        rule1 = self._make_rule("Block SQL", r"(?i)\bselect\b.*\bfrom\b")
        rule1.id = 1
        rule2 = self._make_rule("Block Admin", r"(?i)\badmin\b")
        rule2.id = 2

        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule1, rule2]

        # Matches rule1 (SQL) but not rule2 (admin)
        blocked, matched = check_custom_waf(42, "select * from users", "/api/test", "", db)
        assert blocked is True
        assert len(matched) == 1
        assert matched[0]["name"] == "Block SQL"

    def test_invalid_regex_skipped(self):
        """Invalid regex rule should be silently skipped."""
        rule = self._make_rule("Bad Regex", r"[invalid")
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule]

        # Should not raise exception
        blocked, matched = check_custom_waf(42, "anything [invalid", "/api/test", "", db)
        assert blocked is False

    def test_query_param_checked(self):
        """Custom WAF should check query parameters too."""
        rule = self._make_rule("Block Debug", r"(?i)\bdebug\b")
        db = MagicMock()
        db.query.return_value.filter.return_value.all.return_value = [rule]

        blocked, matched = check_custom_waf(42, "", "/api/test", "debug=true", db)
        assert blocked is True


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic Model Validation
# ═══════════════════════════════════════════════════════════════════════════════

class TestPydanticModels:
    """Test Pydantic model validation for WAF rules."""

    def test_valid_create(self):
        req = WafRuleCreate(name="Test Rule", pattern=r"\d{4}", action="block", severity="high")
        assert req.name == "Test Rule"
        assert req.pattern == r"\d{4}"
        assert req.action == "block"
        assert req.severity == "high"

    def test_default_severity(self):
        req = WafRuleCreate(name="Test", pattern=".*", action="log")
        assert req.severity == "medium"  # default

    def test_invalid_action(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            WafRuleCreate(name="Test", pattern=".*", action="delete")

    def test_invalid_severity(self):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            WafRuleCreate(name="Test", pattern=".*", action="block", severity="urgent")

    def test_update_partial(self):
        req = WafRuleUpdate(name="New Name")
        assert req.name == "New Name"
        assert req.pattern is None
        assert req.action is None
