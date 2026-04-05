"""
ghostapi_wrapper.exceptions

Custom exception hierarchy for the Ghost API client.

All exceptions inherit from GhostError so callers can catch
everything with a single ``except GhostError`` or narrow down
to specific failure modes.
"""


class GhostError(Exception):
    """Base exception for all Ghost API errors.

    Attributes:
        message: Human-readable description of the error.
        status_code: Optional HTTP status code from the API response.
        response_body: Optional raw response body for debugging.
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_body: str | None = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.response_body = response_body
        super().__init__(self.message)

    def __repr__(self) -> str:
        parts = [f"{self.__class__.__name__}({self.message!r}"]
        if self.status_code is not None:
            parts.append(f", status_code={self.status_code}")
        return ", ".join(parts) + ")"


# ---------------------------------------------------------------------------
# Authentication errors
# ---------------------------------------------------------------------------

class GhostAuthError(GhostError):
    """Raised when authentication fails (bad credentials, expired token, etc.)."""
    pass


class GhostTokenExpiredError(GhostAuthError):
    """Raised when the stored access token has expired and refresh also failed."""

    def __init__(self, message: str = "Session token expired and refresh failed.") -> None:
        super().__init__(message, status_code=401)


class GhostInvalidCredentialsError(GhostAuthError):
    """Raised when the provided email or password is incorrect."""

    def __init__(self, message: str = "Invalid email or password.") -> None:
        super().__init__(message, status_code=401)


# ---------------------------------------------------------------------------
# Network / transport errors
# ---------------------------------------------------------------------------

class GhostNetworkError(GhostError):
    """Raised for connectivity issues — DNS failure, timeout, connection refused."""
    pass


class GhostTimeoutError(GhostNetworkError):
    """Raised when a request exceeds the configured timeout."""

    def __init__(
        self,
        message: str = "Request timed out.",
        timeout_seconds: float | None = None,
    ) -> None:
        self.timeout_seconds = timeout_seconds
        super().__init__(message)


class GhostConnectionError(GhostNetworkError):
    """Raised when the client cannot reach the Ghost API server."""

    def __init__(self, message: str = "Could not connect to Ghost API.") -> None:
        super().__init__(message)


# ---------------------------------------------------------------------------
# Rate-limiting errors
# ---------------------------------------------------------------------------

class GhostRateLimitError(GhostError):
    """Raised when the client exceeds the allowed request rate.

    Attributes:
        retry_after: Seconds the caller should wait before retrying.
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded.",
        retry_after: float | None = None,
        status_code: int = 429,
    ) -> None:
        self.retry_after = retry_after
        super().__init__(message, status_code=status_code)


# ---------------------------------------------------------------------------
# API response errors
# ---------------------------------------------------------------------------

class GhostAPIError(GhostError):
    """Raised when the API returns a non-success HTTP status code."""

    def __init__(
        self,
        message: str = "Ghost API returned an error.",
        status_code: int = 500,
        response_body: str | None = None,
    ) -> None:
        super().__init__(message, status_code=status_code, response_body=response_body)


class GhostNotFoundError(GhostAPIError):
    """Raised when a requested resource (chat, message, user) does not exist."""

    def __init__(
        self,
        message: str = "Resource not found.",
        response_body: str | None = None,
    ) -> None:
        super().__init__(message, status_code=404, response_body=response_body)


class GhostValidationError(GhostError):
    """Raised when user-supplied input fails Pydantic validation or the API
    rejects it with a 422-class status code."""

    def __init__(
        self,
        message: str = "Validation error.",
        details: dict | list | None = None,
    ) -> None:
        self.details = details
        super().__init__(message, status_code=422)


# ---------------------------------------------------------------------------
# Refresh-loop protection
# ---------------------------------------------------------------------------

class GhostMaxRetriesError(GhostError):
    """Raised when the retry limit is exhausted without a successful response."""

    def __init__(
        self,
        message: str = "Maximum retry attempts exhausted.",
        attempts: int = 0,
    ) -> None:
        self.attempts = attempts
        super().__init__(message)
