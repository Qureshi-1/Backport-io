"""
Keepalive pinger tests — ping() success/failure, main() logging, missing env var.
"""
import sys
import os
import pytest
import logging
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════════════════════════════════════════
# BACKEND_URL environment variable requirement
# ═══════════════════════════════════════════════════════════════════════════════

class TestMissingBackendUrl:
    """RuntimeError must be raised when BACKEND_URL is not set."""

    def test_raises_runtime_error_without_backend_url(self):
        """Importing keepalive without BACKEND_URL should raise RuntimeError."""
        # Remove BACKEND_URL from env if present
        env_backup = os.environ.pop("BACKEND_URL", None)

        # Remove the module from sys.modules so it re-imports
        if "keepalive" in sys.modules:
            del sys.modules["keepalive"]

        with pytest.raises(RuntimeError, match="BACKEND_URL env var is required"):
            import keepalive  # noqa: F401

        # Restore env and module
        if env_backup is not None:
            os.environ["BACKEND_URL"] = env_backup
        if "keepalive" in sys.modules:
            del sys.modules["keepalive"]


# ═══════════════════════════════════════════════════════════════════════════════
# ping() tests — mocked requests.get
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def keepalive_module():
    """Import keepalive with BACKEND_URL set, yield the module, then clean up."""
    os.environ["BACKEND_URL"] = "https://test-backend.example.com"
    if "keepalive" in sys.modules:
        del sys.modules["keepalive"]
    import keepalive
    yield keepalive
    if "keepalive" in sys.modules:
        del sys.modules["keepalive"]


class TestPingSuccess:
    """ping() returns True when the backend responds with 200."""

    def test_ping_returns_true_on_200(self, keepalive_module):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.elapsed.total_seconds.return_value = 0.123

        with patch("keepalive.requests.get", return_value=mock_resp):
            result = keepalive_module.ping("/health")
        assert result is True


class TestPingNon200:
    """ping() returns False when the backend responds with non-200 status."""

    def test_ping_returns_false_on_503(self, keepalive_module):
        mock_resp = MagicMock()
        mock_resp.status_code = 503

        with patch("keepalive.requests.get", return_value=mock_resp):
            result = keepalive_module.ping("/health")
        assert result is False

    def test_ping_returns_false_on_500(self, keepalive_module):
        mock_resp = MagicMock()
        mock_resp.status_code = 500

        with patch("keepalive.requests.get", return_value=mock_resp):
            result = keepalive_module.ping("/")
        assert result is False


class TestPingConnectionError:
    """ping() returns False on connection errors and timeouts."""

    def test_ping_returns_false_on_connection_error(self, keepalive_module):
        with patch("keepalive.requests.get", side_effect=ConnectionError("refused")):
            result = keepalive_module.ping("/health")
        assert result is False

    def test_ping_returns_false_on_timeout(self, keepalive_module):
        with patch("keepalive.requests.get", side_effect=TimeoutError("timed out")):
            result = keepalive_module.ping("/health")
        assert result is False


# ═══════════════════════════════════════════════════════════════════════════════
# main() tests — verify logging behaviour
# ═══════════════════════════════════════════════════════════════════════════════

class TestMain:
    """Verify main() logs correct messages based on ping outcomes."""

    def test_main_logs_success_when_both_pings_succeed(self, keepalive_module, caplog):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.elapsed.total_seconds.return_value = 0.05

        with patch("keepalive.requests.get", return_value=mock_resp):
            with caplog.at_level(logging.INFO, logger="keepalive"):
                keepalive_module.main()

        # Should log the "Backend is warm" success message
        assert any("Backend is warm" in rec.message for rec in caplog.records), \
            f"Expected 'Backend is warm' in logs. Got: {[r.message for r in caplog.records]}"

    def test_main_logs_warning_when_one_ping_fails(self, keepalive_module, caplog):
        call_count = 0

        def alternating_response(url, timeout=15):
            nonlocal call_count
            call_count += 1
            resp = MagicMock()
            # First call succeeds, second call fails
            if call_count == 1:
                resp.status_code = 200
                resp.elapsed.total_seconds.return_value = 0.05
            else:
                resp.status_code = 503
            return resp

        with patch("keepalive.requests.get", side_effect=alternating_response):
            with caplog.at_level(logging.WARNING, logger="keepalive"):
                keepalive_module.main()

        # Should log warning about one or more pings failing
        assert any("might be starting up" in rec.message for rec in caplog.records), \
            f"Expected warning about pings failing. Got: {[r.message for r in caplog.records]}"
