"""
ghostapi_wrapper — Production-ready Python SDK for the Ghost anonymous chat API.

Public API re-exports for convenient top-level imports::

    from ghostapi_wrapper import GhostClient, GhostConfig
"""

from .ghost_client import GhostClient
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
    Contact,
    FetchMessagesRequest,
    HealthResponse,
    LoginRequest,
    LoginResponse,
    Message,
    MessageListResponse,
    MessageSendRequest,
    UserProfile,
)

__version__ = "1.0.0"
__all__ = [
    "GhostClient",
    "GhostConfig",
    "GhostError",
    "GhostAPIError",
    "GhostAuthError",
    "GhostConnectionError",
    "GhostNetworkError",
    "GhostTimeoutError",
    "GhostTokenExpiredError",
    "GhostInvalidCredentialsError",
    "GhostRateLimitError",
    "GhostValidationError",
    "GhostNotFoundError",
    "GhostMaxRetriesError",
    "HealthResponse",
    "LoginRequest",
    "LoginResponse",
    "Message",
    "MessageListResponse",
    "MessageSendRequest",
    "FetchMessagesRequest",
    "Contact",
    "UserProfile",
]
