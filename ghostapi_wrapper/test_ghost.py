"""
ghostapi_wrapper.test_ghost

Unit tests for the Ghost API wrapper.  All HTTP calls are mocked
via ``unittest.mock`` so the tests run offline with zero external
dependencies.

Run with::

    python -m pytest test_ghost.py -v

Or with unittest::

    python -m unittest test_ghost -v
"""

from __future__ import annotations

import json
import time
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch, PropertyMock

import requests

from ghostapi_wrapper.ghost_client import GhostClient, _RateLimiter
from ghostapi_wrapper.config import GhostConfig
from ghostapi_wrapper.exceptions import (
    GhostAPIError,
    GhostAuthError,
    GhostConnectionError,
    GhostError,
    GhostInvalidCredentialsError,
    GhostMaxRetriesError,
    GhostNetworkError,
    GhostNotFoundError,
    GhostRateLimitError,
    GhostTimeoutError,
    GhostTokenExpiredError,
    GhostValidationError,
)
from ghostapi_wrapper.models import (
    Contact,
    LoginResponse,
    Message,
    MessageListResponse,
    MessageSendRequest,
    UserProfile,
)


def _mock_response(
    status_code: int = 200,
    json_data: dict | None = None,
    text: str = "",
    headers: dict | None = None,
    raise_exc: Exception | None = None,
) -> MagicMock:
    """Build a mock ``requests.Response`` object."""
    mock = MagicMock(spec=requests.Response)
    mock.status_code = status_code
    mock.text = text or json.dumps(json_data or {})
    mock.headers = headers or {}
    mock.json.return_value = json_data or {}
    if raise_exc:
        mock.raise_for_status.side_effect = raise_exc
    return mock


class _TestConfig:
    """Create a lightweight config for testing (no env vars needed)."""

    def __init__(self, **overrides):
        defaults = {
            "ghost_api_base_url": "https://test.ghostapi.local/v1",
            "ghost_email": "test@example.com",
            "ghost_password": "testpass",
            "request_timeout": 5.0,
            "max_retries": 2,
            "retry_base_delay": 0.05,
            "rate_limit_rps": 100.0,
            "verify_ssl": False,
            "log_level": "WARNING",
            "log_file": None,
            "token_refresh_buffer": 60,
        }
        defaults.update(overrides)
        for k, v in defaults.items():
            setattr(self, k, v)


# ===========================================================================
# Tests — Rate Limiter
# ===========================================================================


class TestRateLimiter(unittest.TestCase):
    """Verify the token-bucket rate limiter behaves correctly."""

    def test_allows_immediate_request_within_burst(self):
        """Should not block when tokens are available."""
        limiter = _RateLimiter(rps=100, burst=10)
        start = time.monotonic()
        for _ in range(5):
            limiter.acquire(timeout=1.0)
        elapsed = time.monotonic() - start
        self.assertLess(elapsed, 0.5, "Burst requests should complete quickly.")

    def test_raises_on_timeout(self):
        """Should raise GhostRateLimitError when timeout is exceeded."""
        limiter = _RateLimiter(rps=0.1, burst=1)
        limiter.acquire(timeout=1.0)  # Drain the bucket.
        with self.assertRaises(GhostRateLimitError):
            limiter.acquire(timeout=0.1)

    def test_refills_over_time(self):
        """Tokens should replenish at the configured rate."""
        rps = 1000.0
        limiter = _RateLimiter(rps=rps, burst=1)
        limiter.acquire(timeout=1.0)
        # Wait long enough for at least 1 token refill.
        time.sleep(2.0 / rps + 0.01)
        limiter.acquire(timeout=1.0)  # Should succeed without blocking.


# ===========================================================================
# Tests — Config
# ===========================================================================


class TestGhostConfig(unittest.TestCase):
    """Verify configuration validation and defaults."""

    def test_strips_trailing_slash(self):
        cfg = GhostConfig(_env_file=None)
        self.assertEqual(
            GhostConfig(ghost_api_base_url="https://api.example.com/v1/", _env_file=None).ghost_api_base_url,
            "https://api.example.com/v1",
        )

    def test_rejects_zero_timeout(self):
        with self.assertRaises(ValueError):
            GhostConfig(request_timeout=0, _env_file=None)

    def test_rejects_negative_retries(self):
        with self.assertRaises(ValueError):
            GhostConfig(max_retries=-1, _env_file=None)

    def test_rejects_zero_rate(self):
        with self.assertRaises(ValueError):
            GhostConfig(rate_limit_rps=0, _env_file=None)


# ===========================================================================
# Tests — Models
# ===========================================================================


class TestModels(unittest.TestCase):
    """Verify Pydantic model validation."""

    def test_login_request_valid(self):
        from ghostapi_wrapper.models import LoginRequest
        req = LoginRequest(email="a@b.com", password="x")
        self.assertEqual(req.email, "a@b.com")

    def test_login_request_blank_email_rejected(self):
        from ghostapi_wrapper.models import LoginRequest
        with self.assertRaises(Exception):
            LoginRequest(email="", password="x")

    def test_message_send_request_strips_text(self):
        req = MessageSendRequest(chat_id="c1", text="  hello  ")
        self.assertEqual(req.text, "hello")

    def test_message_send_request_too_long(self):
        with self.assertRaises(Exception):
            MessageSendRequest(chat_id="c1", text="x" * 5001)

    def test_fetch_messages_request_limit_bounds(self):
        from ghostapi_wrapper.models import FetchMessagesRequest
        FetchMessagesRequest(chat_id="c1", limit=1)
        FetchMessagesRequest(chat_id="c1", limit=200)
        with self.assertRaises(Exception):
            FetchMessagesRequest(chat_id="c1", limit=0)
        with self.assertRaises(Exception):
            FetchMessagesRequest(chat_id="c1", limit=201)

    def test_contact_model_defaults(self):
        c = Contact(chat_id="abc")
        self.assertEqual(c.chat_id, "abc")
        self.assertEqual(c.display_name, "")
        self.assertFalse(c.is_group)
        self.assertEqual(c.unread_count, 0)

    def test_message_model_defaults(self):
        m = Message(message_id="m1")
        self.assertEqual(m.message_type, "text")
        self.assertFalse(m.is_read)
        self.assertFalse(m.is_mine)


# ===========================================================================
# Tests — GhostClient
# ===========================================================================


class TestGhostClientAuth(unittest.TestCase):
    """Test authentication lifecycle: login, token refresh, logout."""

    def _make_client(self) -> GhostClient:
        cfg = _TestConfig()
        with patch("ghostapi_wrapper.ghost_client.GhostConfig", return_value=cfg):
            client = GhostClient.__new__(GhostClient)
            client._config = cfg
            client._setup_logging()
            client._access_token = ""
            client._refresh_token = ""
            client._token_expires_at = None
            client._user = None
            client._authenticated = False
            client._rate_limiter = _RateLimiter(rps=100)
            client._session = MagicMock()
            client._refresh_lock = MagicMock()
            return client

    def test_login_success(self):
        """login() stores tokens and user profile on success."""
        client = self._make_client()
        expiry = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        response_json = {
            "access_token": "at_abc",
            "refresh_token": "rt_xyz",
            "expires_at": expiry,
            "user": {
                "user_id": "u1",
                "display_name": "Ghost",
                "is_verified": True,
            },
        }
        client._session.request.return_value = _mock_response(200, response_json)

        result = client.login("test@example.com", "pass")

        self.assertEqual(result.access_token, "at_abc")
        self.assertEqual(result.refresh_token, "rt_xyz")
        self.assertTrue(client.is_authenticated)
        self.assertIsNotNone(client.user)
        self.assertEqual(client.user.user_id, "u1")

    def test_login_invalid_credentials(self):
        """login() raises GhostInvalidCredentialsError on 401."""
        client = self._make_client()
        client._session.request.return_value = _mock_response(401, {"error": "unauthorized"})

        with self.assertRaises(GhostAuthError):
            client.login("bad@example.com", "wrong")

    def test_logout_clears_state(self):
        """logout() clears tokens even if the server request fails."""
        client = self._make_client()
        client._access_token = "at_123"
        client._refresh_token = "rt_456"
        client._authenticated = True

        client._session.request.return_value = _mock_response(200, {"ok": True})
        result = client.logout()

        self.assertTrue(result)
        self.assertFalse(client.is_authenticated)
        self.assertEqual(client._access_token, "")

    def test_logout_clears_state_on_failure(self):
        """logout() clears tokens even on network error."""
        client = self._make_client()
        client._access_token = "at_123"
        client._authenticated = True
        client._session.request.side_effect = requests.ConnectionError("down")

        result = client.logout()
        self.assertFalse(result)
        self.assertFalse(client.is_authenticated)

    def test_is_authenticated_false_before_login(self):
        client = self._make_client()
        self.assertFalse(client.is_authenticated)

    def test_login_without_credentials_raises(self):
        """login() raises GhostValidationError when no credentials are set."""
        client = self._make_client()
        client._config.ghost_email = ""
        client._config.ghost_password = ""

        with self.assertRaises(GhostValidationError):
            client.login()


class TestGhostClientMessages(unittest.TestCase):
    """Test message-related API methods."""

    def _make_authenticated_client(self) -> GhostClient:
        client = TestGhostClientAuth()._make_client()
        client._access_token = "at_test"
        client._authenticated = True
        client._token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        return client

    def test_send_message_success(self):
        client = self._make_authenticated_client()
        response_json = {
            "message_id": "msg1",
            "chat_id": "c1",
            "sender_id": "u1",
            "text": "hello",
            "is_mine": True,
        }
        client._session.request.return_value = _mock_response(200, response_json)

        msg = client.send_message(chat_id="c1", text="hello")

        self.assertEqual(msg.message_id, "msg1")
        self.assertEqual(msg.text, "hello")
        self.assertTrue(msg.is_mine)

    def test_send_message_chat_not_found(self):
        client = self._make_authenticated_client()
        client._session.request.return_value = _mock_response(404, {"error": "not found"})

        with self.assertRaises(GhostNotFoundError):
            client.send_message(chat_id="nonexistent", text="hi")

    def test_fetch_messages_success(self):
        client = self._make_authenticated_client()
        response_json = {
            "messages": [
                {"message_id": "m1", "text": "hey", "is_mine": False},
                {"message_id": "m2", "text": "yo", "is_mine": True},
            ],
            "has_more": False,
            "next_cursor": "",
        }
        client._session.request.return_value = _mock_response(200, response_json)

        result = client.fetch_messages(chat_id="c1", limit=10)

        self.assertEqual(len(result.messages), 2)
        self.assertFalse(result.has_more)
        self.assertEqual(result.messages[0].message_id, "m1")

    def test_fetch_messages_validates_limit(self):
        client = self._make_authenticated_client()
        with self.assertRaises(Exception):
            client.fetch_messages(chat_id="c1", limit=999)


class TestGhostClientContacts(unittest.TestCase):
    """Test contact/chat listing."""

    def _make_authenticated_client(self) -> GhostClient:
        return TestGhostClientMessages()._make_authenticated_client()

    def test_get_contacts_success(self):
        client = self._make_authenticated_client()
        response_json = {
            "contacts": [
                {"chat_id": "c1", "display_name": "Alice", "online": True},
                {"chat_id": "c2", "display_name": "Bob", "online": False},
            ],
        }
        client._session.request.return_value = _mock_response(200, response_json)

        contacts = client.get_contacts()

        self.assertEqual(len(contacts), 2)
        self.assertEqual(contacts[0].display_name, "Alice")
        self.assertTrue(contacts[0].online)

    def test_get_contacts_alternate_key(self):
        """Handle API returning 'chats' instead of 'contacts'."""
        client = self._make_authenticated_client()
        response_json = {
            "chats": [{"chat_id": "c1", "display_name": "Group"}],
        }
        client._session.request.return_value = _mock_response(200, response_json)

        contacts = client.get_contacts()
        self.assertEqual(len(contacts), 1)


class TestGhostClientRetry(unittest.TestCase):
    """Test retry and back-off behaviour."""

    def _make_authenticated_client(self) -> GhostClient:
        return TestGhostClientMessages()._make_authenticated_client()

    def test_retries_on_500_and_succeeds(self):
        """Should retry on 500 and succeed on the second attempt."""
        client = self._make_authenticated_client()
        client._config.max_retries = 3
        response_json = {"message_id": "m1", "text": "ok", "is_mine": True}

        client._session.request.side_effect = [
            _mock_response(500, {"error": "boom"}),
            _mock_response(200, response_json),
        ]

        msg = client.send_message(chat_id="c1", text="ok")
        self.assertEqual(msg.message_id, "m1")
        self.assertEqual(client._session.request.call_count, 2)

    def test_raises_max_retries(self):
        """Should raise GhostMaxRetriesError after exhausting retries."""
        client = self._make_authenticated_client()
        client._config.max_retries = 2

        # max_retries=2 means 2 attempts, so we need 2 500 responses
        # then the loop exits and raises GhostMaxRetriesError
        client._session.request.side_effect = [
            _mock_response(500, {"error": "boom"}),
            _mock_response(500, {"error": "boom"}),
            _mock_response(500, {"error": "boom"}),
        ]

        with self.assertRaises(GhostAPIError):
            client.send_message(chat_id="c1", text="fail")

    def test_retries_on_timeout(self):
        """Should retry on requests.Timeout and succeed eventually."""
        client = self._make_authenticated_client()
        client._config.max_retries = 3
        response_json = {"message_id": "m1", "text": "ok", "is_mine": True}

        client._session.request.side_effect = [
            requests.Timeout("timed out"),
            _mock_response(200, response_json),
        ]

        msg = client.send_message(chat_id="c1", text="ok")
        self.assertEqual(msg.message_id, "m1")

    def test_raises_timeout_after_retries(self):
        """Should raise GhostTimeoutError if all attempts time out."""
        client = self._make_authenticated_client()
        client._config.max_retries = 2

        client._session.request.side_effect = requests.Timeout("timed out")
        with self.assertRaises(GhostTimeoutError):
            client.send_message(chat_id="c1", text="fail")


class TestGhostClientHealth(unittest.TestCase):
    """Test the unauthenticated health check."""

    def _make_client(self) -> GhostClient:
        return TestGhostClientAuth()._make_client()

    def test_health_ok(self):
        client = self._make_client()
        client._session.request.return_value = _mock_response(
            200, {"status": "ok", "version": "1.0.0"},
        )
        result = client.health()
        self.assertEqual(result.status, "ok")

    def test_health_unreachable(self):
        client = self._make_client()
        client._config.max_retries = 1  # Only one attempt so it fails fast.
        client._session.request.side_effect = requests.ConnectionError("refused")
        result = client.health()
        self.assertEqual(result.status, "error")


class TestGhostClientTokenRefresh(unittest.TestCase):
    """Test automatic token refresh behaviour."""

    def _make_client_with_expiring_token(self) -> GhostClient:
        client = TestGhostClientAuth()._make_client()
        client._access_token = "old_token"
        client._refresh_token = "refresh_tok"
        client._authenticated = True
        # Token expired 10 minutes ago.
        client._token_expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        return client

    def test_refreshes_before_request(self):
        """Should refresh the token automatically when it's expired."""
        client = self._make_client_with_expiring_token()
        refresh_response = {
            "access_token": "new_token",
            "refresh_token": "new_refresh",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        }
        message_response = {"message_id": "m1", "text": "hi", "is_mine": True}

        client._session.request.side_effect = [
            _mock_response(200, refresh_response),  # refresh call
            _mock_response(200, message_response),  # actual call
        ]

        msg = client.send_message(chat_id="c1", text="hi")
        self.assertEqual(client._access_token, "new_token")
        self.assertEqual(msg.message_id, "m1")

    def test_raises_when_refresh_fails(self):
        """Should raise GhostTokenExpiredError when refresh fails."""
        client = self._make_client_with_expiring_token()
        client._session.request.return_value = _mock_response(
            401, {"error": "invalid refresh token"},
        )

        with self.assertRaises(GhostTokenExpiredError):
            client.send_message(chat_id="c1", text="hi")

        self.assertFalse(client.is_authenticated)


class TestGhostClientContextManager(unittest.TestCase):
    """Test that GhostClient works as a context manager."""

    def test_enter_exit(self):
        client = TestGhostClientAuth()._make_client()
        with client:
            self.assertIsNotNone(client._session)
        # session.close() should have been called.
        client._session.close.assert_called_once()


class TestGhostClientRepr(unittest.TestCase):
    """Test the __repr__ output."""

    def test_repr_authenticated(self):
        client = TestGhostClientAuth()._make_client()
        client._authenticated = True
        self.assertIn("authenticated", repr(client))

    def test_repr_not_authenticated(self):
        client = TestGhostClientAuth()._make_client()
        client._authenticated = False
        self.assertIn("not authenticated", repr(client))


class TestExceptions(unittest.TestCase):
    """Verify exception hierarchy and attributes."""

    def test_ghost_error_base(self):
        exc = GhostError("test", status_code=400)
        self.assertEqual(exc.message, "test")
        self.assertEqual(exc.status_code, 400)

    def test_inheritance(self):
        self.assertTrue(issubclass(GhostAuthError, GhostError))
        self.assertTrue(issubclass(GhostTokenExpiredError, GhostAuthError))
        self.assertTrue(issubclass(GhostNetworkError, GhostError))
        self.assertTrue(issubclass(GhostTimeoutError, GhostNetworkError))
        self.assertTrue(issubclass(GhostRateLimitError, GhostError))
        self.assertTrue(issubclass(GhostAPIError, GhostError))
        self.assertTrue(issubclass(GhostNotFoundError, GhostAPIError))
        self.assertTrue(issubclass(GhostValidationError, GhostError))

    def test_rate_limit_retry_after(self):
        exc = GhostRateLimitError(retry_after=5.0)
        self.assertEqual(exc.retry_after, 5.0)
        self.assertEqual(exc.status_code, 429)

    def test_max_retries_attempts(self):
        exc = GhostMaxRetriesError(attempts=3)
        self.assertEqual(exc.attempts, 3)


if __name__ == "__main__":
    unittest.main()
