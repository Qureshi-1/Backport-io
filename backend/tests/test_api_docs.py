"""
API Docs tests — auto docs listing, starring, OpenAPI export.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# List Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

class TestListEndpoints:
    def test_list_empty(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/docs/auto", headers=h)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_unauthenticated(self, client):
        resp = client.get("/api/docs/auto")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Get Single Endpoint
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetEndpoint:
    def test_get_nonexistent_endpoint(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/docs/auto/99999", headers=h)
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# Force Regenerate
# ═════════════════════════════════════════════════════════════════════════════

class TestRegenerate:
    def test_regenerate_docs(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/docs/auto/generate", headers=h)
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"


# ═══════════════════════════════════════════════════════════════════════════════
# Update Endpoint
# ═══════════════════════════════════════════════════════════════════════════════

class TestUpdateEndpoint:
    def test_update_nonexistent(self, client):
        h, _ = create_user_for_client(client)
        resp = client.put("/api/docs/auto/99999", json={
            "description": "Test description"
        }, headers=h)
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# Toggle Star
# ═════════════════════════════════════════════════════════════════════════════

class TestToggleStar:
    def test_star_nonexistent(self, client):
        h, _ = create_user_for_client(client)
        resp = client.patch("/api/docs/auto/99999/star", headers=h)
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# OpenAPI Export
# ═══════════════════════════════════════════════════════════════════════════════

class TestOpenAPIExport:
    def test_export_openapi(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/docs/auto/export/openapi", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["openapi"] == "3.0.3"
        assert "info" in data
        assert "paths" in data
        assert data["info"]["title"] == "Auto-Generated API Documentation"
        assert data["info"]["version"] == "1.0.0"

    def test_export_has_generated_timestamp(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/docs/auto/export/openapi", headers=h)
        data = resp.json()
        assert "x-generated-at" in data["info"]
        assert data["info"]["x-generated-at"] is not None

    def test_export_unauthenticated(self, client):
        resp = client.get("/api/docs/auto/export/openapi")
        assert resp.status_code == 401

    def test_export_empty_paths(self, client):
        """With no endpoints discovered, paths should be empty."""
        h, _ = create_user_for_client(client)
        resp = client.get("/api/docs/auto/export/openapi", headers=h)
        data = resp.json()
        assert isinstance(data["paths"], dict)
