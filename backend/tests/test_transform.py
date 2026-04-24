"""
Transform tests — apply_transformations and all action functions.
"""
import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from transform import (
    apply_transformations,
    _apply_add_field,
    _apply_remove_field,
    _apply_rename_field,
    _apply_filter_keys,
    TransformationRule,
)
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# Action Functions (pure logic tests)
# ═══════════════════════════════════════════════════════════════════════════════

class TestApplyAddField:
    def test_add_field_to_dict(self):
        body = {"name": "Alice"}
        result = _apply_add_field(body, {"key": "age", "value": 30})
        assert result == {"name": "Alice", "age": 30}

    def test_add_field_overwrites_existing(self):
        body = {"name": "Alice", "age": 25}
        result = _apply_add_field(body, {"key": "age", "value": 30})
        assert result["age"] == 30

    def test_add_field_to_list_of_dicts(self):
        body = [{"name": "Alice"}, {"name": "Bob"}]
        result = _apply_add_field(body, {"key": "status", "value": "active"})
        assert result[0]["status"] == "active"
        assert result[1]["status"] == "active"

    def test_add_field_missing_key(self):
        """Should not modify body if 'key' is missing from config."""
        body = {"name": "Alice"}
        result = _apply_add_field(body, {"value": 30})
        assert result == {"name": "Alice"}

    def test_add_field_no_change_non_dict_list(self):
        body = [{"name": "Alice"}, "string_value", 42]
        result = _apply_add_field(body, {"key": "extra", "value": "x"})
        assert result[0]["extra"] == "x"
        assert result[1] == "string_value"
        assert result[2] == 42


class TestApplyRemoveField:
    def test_remove_field_from_dict(self):
        body = {"name": "Alice", "password": "secret", "age": 30}
        result = _apply_remove_field(body, {"keys": ["password"]})
        assert result == {"name": "Alice", "age": 30}

    def test_remove_multiple_fields(self):
        body = {"a": 1, "b": 2, "c": 3, "d": 4}
        result = _apply_remove_field(body, {"keys": ["a", "c"]})
        assert result == {"b": 2, "d": 4}

    def test_remove_nonexistent_field(self):
        """Should not error when removing a field that doesn't exist."""
        body = {"name": "Alice"}
        result = _apply_remove_field(body, {"keys": ["nonexistent"]})
        assert result == {"name": "Alice"}

    def test_remove_field_from_list(self):
        body = [{"name": "Alice", "password": "s1"}, {"name": "Bob", "password": "s2"}]
        result = _apply_remove_field(body, {"keys": ["password"]})
        assert "password" not in result[0]
        assert "password" not in result[1]

    def test_remove_empty_keys(self):
        """Should not modify body if 'keys' is empty."""
        body = {"name": "Alice"}
        result = _apply_remove_field(body, {"keys": []})
        assert result == {"name": "Alice"}


class TestApplyRenameField:
    def test_rename_field_in_dict(self):
        body = {"old_name": "Alice"}
        result = _apply_rename_field(body, {"from": "old_name", "to": "new_name"})
        assert result == {"new_name": "Alice"}

    def test_rename_nonexistent_field(self):
        """Should not add the new field if old field doesn't exist."""
        body = {"name": "Alice"}
        result = _apply_rename_field(body, {"from": "missing", "to": "new"})
        assert result == {"name": "Alice"}

    def test_rename_in_list(self):
        body = [{"old_name": "Alice"}, {"old_name": "Bob"}]
        result = _apply_rename_field(body, {"from": "old_name", "to": "new_name"})
        assert result[0] == {"new_name": "Alice"}
        assert result[1] == {"new_name": "Bob"}

    def test_rename_missing_from_or_to(self):
        """Should not modify body if 'from' or 'to' is missing."""
        body = {"name": "Alice"}
        result = _apply_rename_field(body, {"from": "name"})
        assert result == {"name": "Alice"}
        result = _apply_rename_field(body, {"to": "new_name"})
        assert result == {"name": "Alice"}


class TestApplyFilterKeys:
    def test_filter_keys_keeps_only_specified(self):
        body = {"a": 1, "b": 2, "c": 3, "d": 4}
        result = _apply_filter_keys(body, {"keys": ["a", "c"]})
        assert result == {"a": 1, "c": 3}

    def test_filter_keys_empty_config(self):
        """Should not modify body if no keys specified."""
        body = {"a": 1, "b": 2}
        result = _apply_filter_keys(body, {"keys": []})
        assert result == {"a": 1, "b": 2}

    def test_filter_keys_in_list(self):
        body = [{"a": 1, "b": 2, "c": 3}, {"a": 4, "b": 5, "c": 6}]
        result = _apply_filter_keys(body, {"keys": ["a", "c"]})
        assert result[0] == {"a": 1, "c": 3}
        assert result[1] == {"a": 4, "c": 6}


# ═══════════════════════════════════════════════════════════════════════════════
# apply_transformations (orchestrator)
# ═══════════════════════════════════════════════════════════════════════════════

class TestApplyTransformations:
    def _make_rule(self, action, path_pattern="*", config=None, enabled=True):
        """Helper to create a mock TransformationRule."""
        rule = TransformationRule(
            id=1,
            user_id=1,
            name=f"test_{action}",
            path_pattern=path_pattern,
            action=action,
            config=json.dumps(config or {}),
            is_enabled=enabled,
        )
        return rule

    def test_none_body_returns_none(self):
        result = apply_transformations(None, [], "/api/test")
        assert result is None

    def test_no_rules_returns_body_unchanged(self):
        body = {"name": "Alice"}
        result = apply_transformations(body, [], "/api/test")
        assert result == {"name": "Alice"}

    def test_disabled_rule_is_skipped(self):
        body = {"name": "Alice"}
        rules = [self._make_rule("add_field", "*", {"key": "x", "value": 1}, enabled=False)]
        result = apply_transformations(body, rules, "/api/test")
        assert result == {"name": "Alice"}

    def test_path_mismatch_skips_rule(self):
        body = {"name": "Alice"}
        rules = [self._make_rule("add_field", "/api/other/*", {"key": "x", "value": 1})]
        result = apply_transformations(body, rules, "/api/test")
        assert result == {"name": "Alice"}

    def test_path_match_applies_rule(self):
        body = {"name": "Alice"}
        rules = [self._make_rule("add_field", "/api/*", {"key": "x", "value": 1})]
        result = apply_transformations(body, rules, "/api/test")
        assert result["x"] == 1

    def test_multiple_rules_applied_in_order(self):
        body = {"name": "Alice", "password": "secret", "age": 30}
        rules = [
            self._make_rule("remove_field", "*", {"keys": ["password"]}),
            self._make_rule("add_field", "*", {"key": "status", "value": "active"}),
        ]
        result = apply_transformations(body, rules, "/api/test")
        assert "password" not in result
        assert result["status"] == "active"
        assert result["name"] == "Alice"

    def test_invalid_config_json_skipped(self):
        """Rule with invalid JSON config should be skipped."""
        body = {"name": "Alice"}
        rule = TransformationRule(
            id=1, user_id=1, name="bad", path_pattern="*",
            action="add_field", config="{invalid json", is_enabled=True,
        )
        result = apply_transformations(body, [rule], "/api/test")
        assert result == {"name": "Alice"}


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestTransformAPI:
    def _auth_headers(self, client):
        h, _ = create_user_for_client(client)
        return h

    def test_create_and_list_transform(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/transforms", json={
            "name": "Add Timestamp",
            "path_pattern": "/api/users/*",
            "action": "add_field",
            "config": {"key": "processed_at", "value": "2025-01-01"},
        }, headers=h)
        assert resp.status_code == 200
        rule_id = resp.json()["rule"]["id"]

        resp = client.get("/api/transforms", headers=h)
        assert resp.status_code == 200
        rules = resp.json()["rules"]
        assert len(rules) >= 1

    def test_toggle_transform(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/transforms", json={
            "name": "Test Rule",
            "path_pattern": "*",
            "action": "add_field",
            "config": {"key": "x", "value": 1},
        }, headers=h)
        rule_id = resp.json()["rule"]["id"]
        is_enabled = resp.json()["rule"]["is_enabled"]
        assert is_enabled is True

        resp = client.patch(f"/api/transforms/{rule_id}/toggle", headers=h)
        assert resp.status_code == 200
        assert resp.json()["rule"]["is_enabled"] is False

    def test_delete_transform(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/transforms", json={
            "name": "Delete Me",
            "path_pattern": "*",
            "action": "filter_keys",
            "config": {"keys": ["id"]},
        }, headers=h)
        rule_id = resp.json()["rule"]["id"]

        resp = client.delete(f"/api/transforms/{rule_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["deleted_id"] == rule_id

    def test_invalid_action_rejected(self, client):
        h = self._auth_headers(client)
        resp = client.post("/api/transforms", json={
            "name": "Bad Action",
            "path_pattern": "*",
            "action": "invalid_action",
            "config": {},
        }, headers=h)
        assert resp.status_code == 422

    def test_unauthorized_access(self, client):
        resp = client.get("/api/transforms")
        assert resp.status_code == 401
