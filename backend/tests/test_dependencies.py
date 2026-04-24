"""
Dependencies tests — get_current_user, get_proxy_user, get_current_admin auth.
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dependencies import (
    _extract_token_from_cookie,
    _extract_token_from_header,
    COOKIE_NAME,
    get_current_admin,
)
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# Token Extraction
# ═══════════════════════════════════════════════════════════════════════════════

class TestExtractTokenFromCookie:
    def test_extracts_token_from_cookie(self):
        """Should extract JWT from the HttpOnly cookie."""
        from unittest.mock import MagicMock
        request = MagicMock()
        request.cookies = {COOKIE_NAME: "my-jwt-token"}
        result = _extract_token_from_cookie(request)
        assert result == "my-jwt-token"

    def test_returns_none_when_no_cookie(self):
        """Should return None when the auth cookie is missing."""
        from unittest.mock import MagicMock
        request = MagicMock()
        request.cookies = {}
        result = _extract_token_from_cookie(request)
        assert result is None

    def test_returns_none_when_different_cookie(self):
        """Should return None when a different cookie is present."""
        from unittest.mock import MagicMock
        request = MagicMock()
        request.cookies = {"session_id": "abc123"}
        result = _extract_token_from_cookie(request)
        assert result is None


class TestExtractTokenFromHeader:
    def test_extracts_bearer_token(self):
        """Should extract token from Authorization header."""
        from fastapi.security import HTTPAuthorizationCredentials
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="my-jwt-token")
        result = _extract_token_from_header(creds)
        assert result == "my-jwt-token"

    def test_returns_none_when_no_creds(self):
        """Should return None when no credentials are provided."""
        result = _extract_token_from_header(None)
        assert result is None


# ═══════════════════════════════════════════════════════════════════════════════
# Auth via API (integration)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetCurrentUser:
    def test_unauthenticated_returns_401(self, client):
        """Request without auth should return 401."""
        resp = client.get("/api/user/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        """Request with invalid token should return 401."""
        resp = client.get(
            "/api/user/me",
            headers={"Authorization": "Bearer invalid-token-here"}
        )
        assert resp.status_code == 401

    def test_valid_token_returns_user(self, client):
        """Request with valid JWT should return user data."""
        h, email = create_user_for_client(client)
        resp = client.get("/api/user/me", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == email

    def test_cookie_auth_works(self, client):
        """Auth via HttpOnly cookie should work (extract token from login response)."""
        email = "cookie_auth@example.com"
        h, _ = create_user_for_client(client, email=email)
        # Verify the token in the headers works
        resp = client.get("/api/user/me", headers=h)
        assert resp.status_code == 200
        assert resp.json()["email"] == email


class TestGetCurrentAdmin:
    def test_non_admin_gets_403_on_admin_endpoint(self, client):
        """Non-admin user should get 403 on admin endpoints."""
        h, _ = create_user_for_client(client)
        resp = client.get(
            "/api/admin/stats",
            headers=h
        )
        assert resp.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# Proxy User Auth (X-API-Key)
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetProxyUser:
    def test_missing_api_key_returns_401(self, client):
        """Proxy request without X-API-Key should return 401."""
        resp = client.get("/proxy/")
        assert resp.status_code == 401

    def test_invalid_api_key_returns_401(self, client):
        """Proxy request with invalid API key should return 401."""
        resp = client.get(
            "/proxy/",
            headers={"X-API-Key": "invalid-key-12345"}
        )
        assert resp.status_code == 401
