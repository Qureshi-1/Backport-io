"""
Webhook tests — sign_payload, validate_webhook_url, CRUD, HMAC.
"""
import sys
import os
import hashlib
import hmac
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from webhooks import (
    _sign_payload,
    _serialize_webhook,
    VALID_EVENT_TYPES,
    Webhook,
)
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# HMAC Signing (pure logic)
# ═════════════════════════════════════════════════════════════════════════════

class TestSignPayload:
    def test_signature_format(self):
        """Signature should be prefixed with 'sha256='."""
        sig = _sign_payload('{"test": true}', "my-secret")
        assert sig.startswith("sha256=")

    def test_signature_is_hex(self):
        """The hash part should be a valid hex string."""
        sig = _sign_payload('{"test": true}', "my-secret")
        hex_part = sig.replace("sha256=", "")
        int(hex_part, 16)

    def test_deterministic(self):
        """Same input should produce the same signature."""
        sig1 = _sign_payload('{"test": true}', "my-secret")
        sig2 = _sign_payload('{"test": true}', "my-secret")
        assert sig1 == sig2

    def test_different_secrets_differ(self):
        """Different secrets should produce different signatures."""
        sig1 = _sign_payload('{"test": true}', "secret-a")
        sig2 = _sign_payload('{"test": true}', "secret-b")
        assert sig1 != sig2

    def test_different_payloads_differ(self):
        """Different payloads should produce different signatures."""
        sig1 = _sign_payload('{"a": 1}', "secret")
        sig2 = _sign_payload('{"a": 2}', "secret")
        assert sig1 != sig2

    def test_signature_matches_manual_hmac(self):
        """Signature should match a manually computed HMAC."""
        payload = '{"event": "test"}'
        secret = "test-secret-key"
        sig = _sign_payload(payload, secret)

        expected = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        assert sig == f"sha256={expected}"


# ═══════════════════════════════════════════════════════════════════════════════
# Valid Event Types
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidEventTypes:
    def test_expected_events(self):
        expected = {"waf_block", "rate_limit", "error_5xx", "slow_endpoint", "webhook_test"}
        assert VALID_EVENT_TYPES == expected

    def test_all_events_are_strings(self):
        for event in VALID_EVENT_TYPES:
            assert isinstance(event, str)


# ═══════════════════════════════════════════════════════════════════════════════
# Serialize Webhook
# ═══════════════════════════════════════════════════════════════════════════════

class TestSerializeWebhook:
    def test_serialize_basic(self):
        wh = Webhook(
            id=1, user_id=1, url="https://example.com/hook",
            events='["waf_block"]', secret="my-secret",
            is_enabled=True,
        )
        data = _serialize_webhook(wh)
        assert data["id"] == 1
        assert data["events"] == ["waf_block"]
        assert data["is_enabled"] is True
        assert "secret" not in data  # Secret should never be in serialized output

    def test_secret_not_exposed(self):
        """The signing secret must never appear in serialized webhook data."""
        wh = Webhook(
            id=1, user_id=1, url="https://example.com/hook",
            events='[]', secret="super-secret-value-12345",
            is_enabled=True,
        )
        data = _serialize_webhook(wh)
        serialized_str = json.dumps(data)
        assert "super-secret-value-12345" not in serialized_str


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestWebhookAPI:
    def test_create_webhook_invalid_event(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/webhooks", json={
            "url": "https://httpbin.org/post",
            "events": ["invalid_event_type"],
        }, headers=h)
        assert resp.status_code == 400

    def test_create_webhook_unsafe_url(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/webhooks", json={
            "url": "http://localhost:8080/hook",
            "events": ["waf_block"],
        }, headers=h)
        assert resp.status_code == 400

    def test_create_webhook_valid(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/webhooks", json={
            "url": "https://httpbin.org/post",
            "events": ["waf_block", "rate_limit"],
        }, headers=h)
        assert resp.status_code == 200
        data = resp.json()["webhook"]
        assert "secret" in data  # Secret only returned on creation
        assert len(data["secret"]) > 20
        assert data["events"] == ["waf_block", "rate_limit"]

    def test_list_webhooks(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/webhooks", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert "webhooks" in data

    def test_list_webhook_logs(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/webhooks/logs", headers=h)
        assert resp.status_code == 200
        assert "logs" in resp.json()

    def test_toggle_webhook(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/webhooks", json={
            "url": "https://httpbin.org/post",
            "events": ["waf_block"],
        }, headers=h)
        webhook_id = create_resp.json()["webhook"]["id"]

        resp = client.patch(f"/api/webhooks/{webhook_id}/toggle", headers=h)
        assert resp.status_code == 200
        assert resp.json()["webhook"]["is_enabled"] is False

    def test_delete_webhook(self, client):
        h, _ = create_user_for_client(client)
        create_resp = client.post("/api/webhooks", json={
            "url": "https://httpbin.org/post",
            "events": ["rate_limit"],
        }, headers=h)
        webhook_id = create_resp.json()["webhook"]["id"]

        resp = client.delete(f"/api/webhooks/{webhook_id}", headers=h)
        assert resp.status_code == 200
        assert resp.json()["deleted_id"] == webhook_id

    def test_list_no_secret_exposed(self, client):
        """Secret should NOT be in list endpoint response."""
        h, _ = create_user_for_client(client)
        client.post("/api/webhooks", json={
            "url": "https://httpbin.org/post",
            "events": ["waf_block"],
        }, headers=h)

        resp = client.get("/api/webhooks", headers=h)
        webhooks = resp.json()["webhooks"]
        for wh in webhooks:
            assert "secret" not in wh

    def test_unauthorized(self, client):
        resp = client.get("/api/webhooks")
        assert resp.status_code == 401
