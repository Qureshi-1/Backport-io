"""
ghostapi_wrapper.main

FastAPI application that wraps :class:`GhostClient` as a set of
REST endpoints so the wrapper can be deployed as a micro-service.

Run directly::

    uvicorn main:app --host 0.0.0.0 --port 8000

Or via the Docker image (see ``Dockerfile``).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .config import GhostConfig
from .exceptions import (
    GhostAuthError,
    GhostConnectionError,
    GhostError,
    GhostMaxRetriesError,
    GhostNetworkError,
    GhostNotFoundError,
    GhostRateLimitError,
    GhostTimeoutError,
    GhostTokenExpiredError,
    GhostValidationError,
)
from .ghost_client import GhostClient

logger = logging.getLogger("ghostapi.server")

_client: Optional[GhostClient] = None


def get_client() -> GhostClient:
    """Return the singleton :class:`GhostClient` instance.

    Raises:
        RuntimeError: If the application has not been initialised.
    """
    if _client is None:
        raise RuntimeError("GhostClient not initialised.")
    return _client


# ---------------------------------------------------------------------------
# Request / response schemas for the REST layer
# ---------------------------------------------------------------------------

class LoginBody(BaseModel):
    """JSON body for ``POST /api/login``."""

    email: str = Field(..., example="user@example.com")
    password: str = Field(..., example="s3cret")


class SendMessageBody(BaseModel):
    """JSON body for ``POST /api/messages``."""

    chat_id: str = Field(..., example="chat-uuid-123")
    text: str = Field(..., example="Hello from the API!")


class ErrorResponse(BaseModel):
    """Standard error envelope returned on failures."""

    error: str
    detail: str = ""
    status_code: int = 500


# ---------------------------------------------------------------------------
# Exception-to-HTTP mapping
# ---------------------------------------------------------------------------

def _map_exception(exc: GhostError) -> tuple[int, str, str]:
    """Translate a domain exception into an HTTP status, type, and message."""
    mapping: dict[type, tuple[int, str]] = {
        GhostInvalidCredentialsError: (401, "invalid_credentials"),
        GhostTokenExpiredError:       (401, "token_expired"),
        GhostAuthError:              (401, "auth_error"),
        GhostValidationError:        (422, "validation_error"),
        GhostNotFoundError:          (404, "not_found"),
        GhostRateLimitError:         (429, "rate_limited"),
        GhostTimeoutError:           (504, "timeout"),
        GhostConnectionError:        (502, "connection_error"),
        GhostNetworkError:           (502, "network_error"),
        GhostMaxRetriesError:        (502, "max_retries"),
    }
    for cls, (status, err_type) in mapping.items():
        if isinstance(exc, cls):
            return status, err_type, exc.message
    return 500, "internal_error", str(exc)


def ghost_exception_handler(request, exc: Exception):
    """FastAPI exception handler for all :class:`GhostError` subtypes."""
    if isinstance(exc, GhostError):
        status, err_type, message = _map_exception(exc)
        return JSONResponse(
            status_code=status,
            content={"error": err_type, "detail": message, "status_code": status},
        )
    return JSONResponse(
        status_code=500,
        content={"error": "unhandled", "detail": str(exc), "status_code": 500},
    )


# ---------------------------------------------------------------------------
# Lifespan (start / stop)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create the :class:`GhostClient` on startup and close it on shutdown."""
    global _client
    config = GhostConfig()
    _client = GhostClient(config=config)
    logger.info("FastAPI service started — base_url=%s", config.ghost_api_base_url)
    yield
    _client.close()
    _client = None
    logger.info("FastAPI service stopped.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Build and return the FastAPI application instance."""
    app = FastAPI(
        title="Ghost API Wrapper",
        description=(
            "Production-ready REST wrapper around the Ghost anonymous "
            "chat API.  Provides authentication, messaging, contact "
            "management, and health-check endpoints."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Register the global exception handler
    app.add_exception_handler(GhostError, ghost_exception_handler)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------
    @app.get(
        "/api/health",
        tags=["system"],
        summary="Health check",
        response_model=dict,
    )
    async def health_check():
        """Unauthenticated endpoint to verify the service and upstream API."""
        client = get_client()
        try:
            result = client.health()
            return result.model_dump()
        except Exception as exc:
            return {"status": "error", "detail": str(exc)}

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------
    @app.post(
        "/api/login",
        tags=["auth"],
        summary="Log in",
        responses={401: {"model": ErrorResponse}},
    )
    async def login(body: LoginBody):
        """Authenticate with email and password.

        Returns access token, refresh token, and user profile.
        """
        client = get_client()
        result = client.login(email=body.email, password=body.password)
        return result.model_dump()

    @app.post(
        "/api/logout",
        tags=["auth"],
        summary="Log out",
    )
    async def logout():
        """End the current session and clear credentials."""
        client = get_client()
        client.logout()
        return {"status": "ok", "message": "Logged out."}

    # ------------------------------------------------------------------
    # Contacts
    # ------------------------------------------------------------------
    @app.get(
        "/api/contacts",
        tags=["contacts"],
        summary="List contacts / chats",
    )
    async def get_contacts():
        """Return the authenticated user's conversation list."""
        client = get_client()
        contacts = client.get_contacts()
        return {"contacts": [c.model_dump() for c in contacts]}

    # ------------------------------------------------------------------
    # Messages
    # ------------------------------------------------------------------
    @app.get(
        "/api/messages/{chat_id}",
        tags=["messages"],
        summary="Fetch messages",
    )
    async def fetch_messages(
        chat_id: str,
        limit: int = Query(default=50, ge=1, le=200),
        cursor: str = Query(default=""),
    ):
        """Get recent messages from a conversation."""
        client = get_client()
        result = client.fetch_messages(chat_id=chat_id, limit=limit, cursor=cursor)
        return result.model_dump()

    @app.post(
        "/api/messages",
        tags=["messages"],
        summary="Send a message",
        responses={404: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    )
    async def send_message(body: SendMessageBody):
        """Send a text message to a conversation."""
        client = get_client()
        msg = client.send_message(chat_id=body.chat_id, text=body.text)
        return msg.model_dump()

    return app


# Module-level app instance for ``uvicorn main:app``
app = create_app()
