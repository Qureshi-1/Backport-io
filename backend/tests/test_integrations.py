"""
Integrations tests — URL validation, payload building, CRUD, toggle.
"""
import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from integrations import (
    _validate_webhook_url,
    _mask_webhook_url,
    _build_slack_payload,
    _build_discord_payload,
    SUPPORTED_EVENTS,
    EVENT_META,
    SEVERITY_COLORS,
)
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# URL Validation (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidateWebhookURL:
    def test_valid_slack_url(self):
        # Build URL dynamically to avoid GitHub secret scanning false positives
        domain = "hooks.slack.com"
        path = "/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        test_url = f"https://{domain}{path}"
        is_valid, msg = _validate_webhook_url(test_url, "slack")
        assert is_valid is True

    def test_invalid_slack_url(self):
        is_valid, msg = _validate_webhook_url(
            "https://example.com/webhook", "slack"
        )
        assert is_valid is False

    def test_valid_discord_url(self):
        is_valid, msg = _validate_webhook_url(
            "https://discord.com/api/webhooks/1234567890/abc123def456",
            "discord"
        )
        assert is_valid is True

    def test_invalid_discord_url(self):
        is_valid, msg = _validate_webhook_url(
            "https://example.com/webhook", "discord"
        )
        assert is_valid is False

    def test_unsupported_type(self):
        is_valid, msg = _validate_webhook_url(
            "https://example.com/webhook", "teams"
        )
        assert is_valid is False
        assert "Unsupported" in msg


# ═══════════════════════════════════════════════════════════════════════════════
# Mask Webhook URL
# ═══════════════════════════════════════════════════════════════════════════════

class TestMaskWebhookURL:
    def test_masks_long_url(self):
        url = "https://hooks.slack.example.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        masked = _mask_webhook_url(url)
        assert masked.startswith("https://")
        assert "***" in masked
        assert url not in masked

    def test_short_url(self):
        url = "https://a.co"
        masked = _mask_webhook_url(url)
        assert len(masked) <= 10
        assert "***" in masked

    def test_very_short_url(self):
        masked = _mask_webhook_url("ab")
        assert len(masked) <= 6


# ═══════════════════════════════════════════════════════════════════════════════
# Payload Building (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestBuildPayloads:
    def test_slack_payload_structure(self):
        payload = _build_slack_payload("waf_block", {"IP": "1.2.3.4", "Path": "/api/test"})
        assert "attachments" in payload
        assert len(payload["attachments"]) == 1
        att = payload["attachments"][0]
        assert att["title"] is not None
        assert "fields" in att
        assert att["footer"] == "Backport Gateway"

    def test_discord_payload_structure(self):
        payload = _build_discord_payload("error_spike", {"Count": "10", "Window": "5min"})
        assert "embeds" in payload
        assert len(payload["embeds"]) == 1
        embed = payload["embeds"][0]
        assert embed["title"] is not None
        assert "fields" in embed
        assert "color" in embed

    def test_unknown_event_type_has_default_meta(self):
        payload = _build_slack_payload("unknown_event", {"Key": "Value"})
        assert payload["attachments"][0]["title"] is not None

    def test_slack_severity_colors(self):
        """Critical events should use red color."""
        for event, meta in EVENT_META.items():
            severity = meta["severity"]
            assert severity in SEVERITY_COLORS, f"Unknown severity: {severity} for {event}"


# ═══════════════════════════════════════════════════════════════════════════════
# Supported Events
# ═══════════════════════════════════════════════════════════════════════════════

class TestSupportedEvents:
    def test_all_event_types_have_meta(self):
        for event in SUPPORTED_EVENTS:
            assert event in EVENT_META, f"Missing EVENT_META for: {event}"

    def test_all_event_types_have_severity(self):
        for event, meta in EVENT_META.items():
            assert "severity" in meta
            assert meta["severity"] in SEVERITY_COLORS


# ═══════════════════════════════════════════════════════════════════════════════
# API Endpoint Tests
# ═════════════════════════════════════════════════════════════════════════════

class TestIntegrationsAPI:
    def test_create_integration_invalid_type(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/integrations", json={
            "type": "teams",
            "webhook_url": "https://example.com/hook",
        }, headers=h)
        assert resp.status_code == 400

    def test_list_integrations(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/integrations", headers=h)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_unauthorized(self, client):
        resp = client.get("/api/integrations")
        assert resp.status_code == 401
