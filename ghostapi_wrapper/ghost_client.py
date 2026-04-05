"""
ghostapi_wrapper.ghost_client

Production-ready Python client for the Ghost anonymous chat API.

Key capabilities:
- Automatic token refresh when the session nears expiry.
- Retry with exponential back-off on transient failures (max 3).
- Client-side rate limiting (token-bucket algorithm).
- Input validation via Pydantic models.
- Structured logging to console and optional file.
- ``requests.Session`` with HTTP connection pooling.

Quick start::

    from ghost_client import GhostClient

    client = GhostClient()                      # reads GHOST_* env vars
    client.login("user@example.com", "pass")
    contacts = client.get_contacts()
    client.send_message(chat_id="abc", text="Hello!")
    client.logout()
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry as UrllibRetry

from .config import GhostConfig
from .exceptions import (
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
from .models import (
    APIEnvelope,
    Contact,
    FetchMessagesRequest,
    HealthResponse,
    LoginRequest,
    LoginResponse,
    Message,
    MessageListResponse,
    MessageSendRequest,
    RefreshTokenResponse,
    UserProfile,
)

logger = logging.getLogger("ghostapi")


# ---------------------------------------------------------------------------
# Token-bucket rate limiter
# ---------------------------------------------------------------------------

class _RateLimiter:
    """Thread-safe token-bucket rate limiter.

    Args:
        rps: Maximum sustained requests per second.
        burst: Maximum burst size (defaults to ``rps * 2``).
    """

    def __init__(self, rps: float, burst: int | None = None) -> None:
        self._rate = rps
        self._burst = burst or max(int(rps * 2), 1)
        self._tokens: float = float(self._burst)
        self._last_refill: float = time.monotonic()
        self._lock = threading.Lock()

    def acquire(self, timeout: float = 10.0) -> None:
        """Block until a token is available or *timeout* is exceeded.

        Raises:
            GhostRateLimitError: If the timeout elapses before a token is available.
        """
        deadline = time.monotonic() + timeout
        while True:
            with self._lock:
                self._refill()
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                wait = (1.0 - self._tokens) / self._rate
            if time.monotonic() + wait > deadline:
                raise GhostRateLimitError(
                    message=f"Rate limiter timeout after {timeout:.1f}s "
                            f"(rate={self._rate} rps, burst={self._burst}).",
                )
            time.sleep(min(wait, 0.05))

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens = min(self._burst, self._tokens + elapsed * self._rate)
        self._last_refill = now


# ---------------------------------------------------------------------------
# Main client
# ---------------------------------------------------------------------------

class GhostClient:
    """High-level client for the Ghost anonymous chat API.

    Handles authentication with automatic token refresh, request retry
    with exponential back-off, client-side rate limiting, and structured
    logging.  All public methods validate their inputs through Pydantic
    models before sending anything over the network.

    Args:
        config: Optional :class:`GhostConfig` instance.  When ``None``,
                configuration is read from environment variables.

    Example::

        client = GhostClient()
        client.login("user@example.com", "s3cret")
        for contact in client.get_contacts():
            print(contact.display_name)
        client.logout()
    """

    # Well-known API paths (relative to ``config.ghost_api_base_url``)
    _PATH_LOGIN: str = "/auth/login"
    _PATH_REFRESH: str = "/auth/refresh"
    _PATH_LOGOUT: str = "/auth/logout"
    _PATH_MESSAGES: str = "/messages"
    _PATH_CONTACTS: str = "/chats"
    _PATH_HEALTH: str = "/health"

    def __init__(self, config: GhostConfig | None = None) -> None:
        self._config = config or GhostConfig()
        self._setup_logging()

        self._access_token: str = ""
        self._refresh_token: str = ""
        self._token_expires_at: datetime | None = None
        self._user: UserProfile | None = None
        self._authenticated: bool = False

        self._rate_limiter = _RateLimiter(rps=self._config.rate_limit_rps)
        self._session = self._build_session()
        self._refresh_lock = threading.Lock()

        logger.info(
            "GhostClient initialised — base_url=%s, timeout=%.1fs, "
            "retries=%d, rate_limit=%.1f rps",
            self._config.ghost_api_base_url,
            self._config.request_timeout,
            self._config.max_retries,
            self._config.rate_limit_rps,
        )

    # ------------------------------------------------------------------
    # Logging setup
    # ------------------------------------------------------------------

    def _setup_logging(self) -> None:
        """Configure the ``ghostapi`` logger based on config values.

        Outputs to *stderr* at all times.  If ``config.log_file`` is set,
        logs are also appended to that file.
        """
        log = logging.getLogger("ghostapi")
        if log.handlers:
            return  # Already configured — likely in a multi-client scenario.

        level = getattr(logging, self._config.log_level, logging.INFO)
        log.setLevel(level)

        fmt = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        console = logging.StreamHandler()
        console.setLevel(level)
        console.setFormatter(fmt)
        log.addHandler(console)

        if self._config.log_file:
            fh = logging.FileHandler(self._config.log_file, encoding="utf-8")
            fh.setLevel(level)
            fh.setFormatter(fmt)
            log.addHandler(fh)
            logger.info("File logging enabled: %s", self._config.log_file)

    # ------------------------------------------------------------------
    # Session / transport
    # ------------------------------------------------------------------

    def _build_session(self) -> requests.Session:
        """Create a ``requests.Session`` with connection pooling and
        transport-level retry configured."""
        session = requests.Session()

        transport_retry = UrllibRetry(
            total=0,  # We handle retries at the application level.
            backoff_factor=0,
        )
        adapter = HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=transport_retry,
        )
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "GhostAPI-Wrapper/1.0.0",
        })

        return session

    def _url(self, path: str) -> str:
        """Build a full URL from a relative API path."""
        return f"{self._config.ghost_api_base_url}{path}"

    def _auth_headers(self) -> dict[str, str]:
        """Return authorisation headers for authenticated requests.

        Raises:
            GhostAuthError: If the client is not logged in.
        """
        if not self._access_token:
            raise GhostAuthError("Not authenticated. Call login() first.")
        return {"Authorization": f"Bearer {self._access_token}"}

    # ------------------------------------------------------------------
    # Token lifecycle
    # ------------------------------------------------------------------

    def _parse_expiry(self, expires_at: str) -> datetime | None:
        """Parse an ISO-8601 expiry timestamp into a timezone-aware datetime."""
        if not expires_at:
            return None
        try:
            dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            logger.warning("Could not parse token expiry: %s", expires_at)
            return None

    def _is_token_expired(self) -> bool:
        """Check whether the access token is expired or about to expire
        (within the configured refresh buffer)."""
        if self._token_expires_at is None:
            return False
        buffer = self._config.token_refresh_buffer
        now = datetime.now(timezone.utc)
        return now >= (self._token_expires_at - timedelta(seconds=buffer))

    def _refresh_access_token(self) -> str:
        """Obtain a new access token using the stored refresh token.

        This method is **thread-safe** — concurrent calls will block so only
        one refresh request is in flight at any time.

        Returns:
            The new access token.

        Raises:
            GhostTokenExpiredError: If the refresh token is also invalid.
            GhostNetworkError: On connectivity problems.
        """
        with self._refresh_lock:
            # Double-check after acquiring the lock.
            if self._access_token and not self._is_token_expired():
                return self._access_token

            if not self._refresh_token:
                raise GhostTokenExpiredError()

            logger.info("Refreshing access token …")
            try:
                payload = RefreshTokenResponse.model_validate(
                    self._request(
                        method="POST",
                        path=self._PATH_REFRESH,
                        json={"refresh_token": self._refresh_token},
                        auth_required=False,
                    )
                )
                self._access_token = payload.access_token
                if payload.refresh_token:
                    self._refresh_token = payload.refresh_token
                self._token_expires_at = self._parse_expiry(payload.expires_at)
                logger.info("Token refreshed successfully. Expires at: %s", payload.expires_at)
                return self._access_token
            except GhostAuthError:
                self._authenticated = False
                self._access_token = ""
                self._refresh_token = ""
                self._token_expires_at = None
                raise GhostTokenExpiredError()

    # ------------------------------------------------------------------
    # Core request method (retry + rate-limit + refresh)
    # ------------------------------------------------------------------

    def _request(
        self,
        method: str,
        path: str,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        auth_required: bool = True,
    ) -> dict[str, Any]:
        """Send an HTTP request with retry, rate-limiting, and auth refresh.

        Args:
            method: HTTP verb (``GET``, ``POST``, etc.).
            path: Relative API path (e.g. ``/auth/login``).
            params: Query-string parameters.
            json: JSON request body.
            auth_required: Whether to attach the ``Authorization`` header.

        Returns:
            Parsed JSON response body as a dictionary.

        Raises:
            GhostValidationError: If the API rejects the payload (422).
            GhostNotFoundError: If the requested resource does not exist (404).
            GhostRateLimitError: If rate limit is hit (429).
            GhostAuthError: On 401/403 responses.
            GhostAPIError: On other non-2xx responses.
            GhostTimeoutError: If the request times out.
            GhostConnectionError: On connectivity failures.
            GhostMaxRetriesError: If all retries are exhausted.
        """
        headers: dict[str, str] = {}
        if auth_required:
            headers.update(self._auth_headers())

        last_exception: Exception | None = None
        base_delay = self._config.retry_base_delay

        for attempt in range(1, self._config.max_retries + 1):
            # Proactive token refresh if the token is nearing expiry.
            if auth_required and self._is_token_expired():
                self._refresh_access_token()
                headers.update(self._auth_headers())

            # Rate limiter — block if we're sending too fast.
            try:
                self._rate_limiter.acquire(timeout=15.0)
            except GhostRateLimitError:
                logger.warning("Client-side rate limit exceeded.")
                raise

            url = self._url(path)
            logger.debug(
                "[%d/%d] %s %s  params=%s",
                attempt,
                self._config.max_retries,
                method,
                url,
                params,
            )

            try:
                response = self._session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json,
                    timeout=self._config.request_timeout,
                    verify=self._config.verify_ssl,
                )
            except requests.Timeout as exc:
                last_exception = exc
                logger.warning(
                    "Timeout on %s %s (attempt %d/%d)",
                    method, url, attempt, self._config.max_retries,
                )
                if attempt < self._config.max_retries:
                    time.sleep(base_delay * (2 ** (attempt - 1)))
                    continue
                raise GhostTimeoutError(
                    message=f"Request to {url} timed out after "
                            f"{self._config.request_timeout}s.",
                    timeout_seconds=self._config.request_timeout,
                ) from exc

            except requests.ConnectionError as exc:
                last_exception = exc
                logger.warning(
                    "Connection error on %s %s (attempt %d/%d)",
                    method, url, attempt, self._config.max_retries,
                )
                if attempt < self._config.max_retries:
                    time.sleep(base_delay * (2 ** (attempt - 1)))
                    continue
                raise GhostConnectionError() from exc

            # --- Handle HTTP status codes ---
            status = response.status_code

            if 200 <= status < 300:
                try:
                    return response.json()
                except ValueError:
                    return {"raw": response.text}

            if status == 401:
                # Token might have expired mid-request — try refreshing once.
                if auth_required and attempt == 1 and self._refresh_token:
                    logger.info("Got 401 — attempting token refresh.")
                    try:
                        self._refresh_access_token()
                        headers.update(self._auth_headers())
                        time.sleep(base_delay)
                        continue
                    except GhostTokenExpiredError:
                        pass
                raise GhostAuthError(
                    message="Authentication failed. Token may be invalid.",
                    status_code=status,
                    response_body=response.text[:1000],
                )

            if status == 403:
                raise GhostAuthError(
                    message="Insufficient permissions for this resource.",
                    status_code=status,
                    response_body=response.text[:1000],
                )

            if status == 404:
                raise GhostNotFoundError(
                    message=f"Resource not found: {path}",
                    response_body=response.text[:1000],
                )

            if status == 422:
                raise GhostValidationError(
                    message="The API rejected the request payload.",
                    details=self._safe_json(response),
                )

            if status == 429:
                retry_after = response.headers.get("Retry-After")
                ra = float(retry_after) if retry_after else None
                raise GhostRateLimitError(
                    message="Server-side rate limit exceeded.",
                    retry_after=ra,
                    status_code=429,
                )

            if status >= 500:
                last_exception = GhostAPIError(
                    message=f"Server error: HTTP {status}",
                    status_code=status,
                    response_body=response.text[:1000],
                )
                logger.warning(
                    "Server error HTTP %d on %s %s (attempt %d/%d)",
                    status, method, url, attempt, self._config.max_retries,
                )
                if attempt < self._config.max_retries:
                    time.sleep(base_delay * (2 ** (attempt - 1)))
                    continue
                raise last_exception

            # Any other non-2xx status
            raise GhostAPIError(
                message=f"Unexpected HTTP {status}",
                status_code=status,
                response_body=response.text[:1000],
            )

        raise GhostMaxRetriesError(
            message=f"All {self._config.max_retries} retry attempts exhausted.",
            attempts=self._config.max_retries,
        )

    @staticmethod
    def _safe_json(response: requests.Response) -> Any:
        """Safely parse JSON from a response, returning the raw text on failure."""
        try:
            return response.json()
        except ValueError:
            return response.text[:1000]

    # ------------------------------------------------------------------
    # Public API methods
    # ------------------------------------------------------------------

    @property
    def is_authenticated(self) -> bool:
        """Whether the client currently holds a valid authentication state."""
        return self._authenticated and bool(self._access_token)

    @property
    def user(self) -> UserProfile | None:
        """The authenticated user's profile, or ``None`` if not logged in."""
        return self._user

    def health(self) -> HealthResponse:
        """Check whether the Ghost API is reachable.

        This is an unauthenticated endpoint — useful for monitoring
        and smoke tests.

        Returns:
            A :class:`HealthResponse` with service status information.

        Raises:
            GhostNetworkError: If the API is unreachable.

        Example::

            status = client.health()
            print(status.status)  # "ok"
        """
        try:
            data = self._request(
                method="GET",
                path=self._PATH_HEALTH,
                auth_required=False,
            )
            return HealthResponse.model_validate(data)
        except (GhostAPIError, GhostNetworkError):
            return HealthResponse(status="error")

    def login(self, email: str | None = None, password: str | None = None) -> LoginResponse:
        """Authenticate with email and password.

        If *email* or *password* is not provided, the values from
        :class:`GhostConfig` (environment variables) are used.

        Args:
            email: Account email address.
            password: Account password.

        Returns:
            A :class:`LoginResponse` containing the access token, refresh
            token, expiry, and user profile.

        Raises:
            GhostInvalidCredentialsError: If the credentials are wrong.
            GhostNetworkError: On connectivity problems.
            GhostAPIError: For other API-level errors.

        Example::

            result = client.login("user@example.com", "s3cret")
            print(result.access_token)
            print(result.user.display_name)
        """
        email = email or self._config.ghost_email
        password = password or self._config.ghost_password
        if not email or not password:
            raise GhostValidationError(
                message="Email and password are required for login. "
                        "Pass them explicitly or set GHOST_EMAIL / GHOST_PASSWORD.",
            )

        req = LoginRequest(email=email, password=password)
        logger.info("Logging in as %s …", email)

        raw = self._request(
            method="POST",
            path=self._PATH_LOGIN,
            json=req.model_dump(),
            auth_required=False,
        )

        try:
            envelope = APIEnvelope.model_validate(raw)
            payload = LoginResponse.model_validate(envelope.data)
        except Exception:
            payload = LoginResponse.model_validate(raw)

        self._access_token = payload.access_token
        self._refresh_token = payload.refresh_token
        self._token_expires_at = self._parse_expiry(payload.expires_at)
        self._user = payload.user
        self._authenticated = True

        logger.info(
            "Login successful — user_id=%s, expires_at=%s",
            self._user.user_id if self._user else "?",
            payload.expires_at,
        )
        return payload

    def logout(self) -> bool:
        """End the current session server-side and clear local state.

        Returns:
            ``True`` if the server confirmed the logout, ``False`` if the
            request failed (local state is still cleared).

        Raises:
            GhostNetworkError: On connectivity problems.

        Example::

            client.logout()
        """
        success = True
        try:
            self._request(method="POST", path=self._PATH_LOGOUT)
            logger.info("Logged out successfully.")
        except GhostError as exc:
            logger.warning("Logout request failed: %s", exc)
            success = False
        finally:
            self._access_token = ""
            self._refresh_token = ""
            self._token_expires_at = None
            self._user = None
            self._authenticated = False
        return success

    def get_contacts(self) -> list[Contact]:
        """Fetch the authenticated user's contact / chat list.

        Each contact represents a conversation (direct or group).

        Returns:
            A list of :class:`Contact` objects sorted by most recent activity.

        Raises:
            GhostAuthError: If not authenticated.
            GhostNetworkError: On connectivity problems.

        Example::

            contacts = client.get_contacts()
            for c in contacts:
                print(f"{c.display_name}: {c.last_message}")
        """
        raw = self._request(method="GET", path=self._PATH_CONTACTS)

        try:
            envelope = APIEnvelope.model_validate(raw)
            items = envelope.data if envelope.data else raw
        except Exception:
            items = raw

        if isinstance(items, dict) and "contacts" in items:
            contact_list = items["contacts"]
        elif isinstance(items, dict) and "chats" in items:
            contact_list = items["chats"]
        elif isinstance(items, list):
            contact_list = items
        else:
            contact_list = [items]

        return [Contact.model_validate(c) for c in contact_list]

    def fetch_messages(
        self,
        chat_id: str,
        limit: int = 50,
        cursor: str = "",
    ) -> MessageListResponse:
        """Fetch recent messages from a conversation.

        Args:
            chat_id: The conversation identifier.
            limit: Number of messages to return (1–200, default 50).
            cursor: Pagination cursor from a previous response's
                    ``next_cursor`` field.

        Returns:
            A :class:`MessageListResponse` containing messages and
            pagination metadata.

        Raises:
            GhostAuthError: If not authenticated.
            GhostNotFoundError: If the chat does not exist.
            GhostValidationError: If *limit* is out of range.

        Example::

            result = client.fetch_messages(chat_id="abc", limit=20)
            for msg in result.messages:
                sender = "You" if msg.is_mine else msg.sender_id
                print(f"[{sender}] {msg.text}")
            if result.has_more:
                more = client.fetch_messages(
                    chat_id="abc", cursor=result.next_cursor,
                )
        """
        req = FetchMessagesRequest(chat_id=chat_id, limit=limit, cursor=cursor)
        params: dict[str, Any] = {"limit": req.limit}
        if req.cursor:
            params["cursor"] = req.cursor

        raw = self._request(
            method="GET",
            path=f"{self._PATH_MESSAGES}/{req.chat_id}",
            params=params,
        )

        try:
            envelope = APIEnvelope.model_validate(raw)
            if envelope.data and "messages" in envelope.data:
                payload = MessageListResponse.model_validate(envelope.data)
            else:
                payload = MessageListResponse.model_validate(raw)
        except Exception:
            payload = MessageListResponse.model_validate(raw)

        return payload

    def send_message(self, chat_id: str, text: str) -> Message:
        """Send a text message to a conversation.

        Args:
            chat_id: Target conversation identifier.
            text: Message body (1–5000 characters).

        Returns:
            The :class:`Message` that was created by the server.

        Raises:
            GhostAuthError: If not authenticated.
            GhostNotFoundError: If the chat does not exist.
            GhostValidationError: If *text* is empty or too long.
            GhostNetworkError: On connectivity problems.

        Example::

            msg = client.send_message(chat_id="abc", text="Hello, world!")
            print(f"Sent message_id={msg.message_id}")
        """
        req = MessageSendRequest(chat_id=chat_id, text=text)
        logger.info("Sending message to chat %s (%d chars)", chat_id, len(req.text))

        raw = self._request(
            method="POST",
            path=self._PATH_MESSAGES,
            json=req.model_dump(),
        )

        try:
            envelope = APIEnvelope.model_validate(raw)
            return Message.model_validate(envelope.data)
        except Exception:
            return Message.model_validate(raw)

    def close(self) -> None:
        """Close the underlying HTTP session and release resources.

        It is safe to call this method multiple times.

        Example::

            client.close()
        """
        try:
            self._session.close()
        except Exception:
            pass
        logger.info("GhostClient session closed.")

    def __enter__(self) -> "GhostClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def __repr__(self) -> str:
        auth = "authenticated" if self._authenticated else "not authenticated"
        return f"GhostClient(base_url={self._config.ghost_api_base_url!r}, {auth})"
