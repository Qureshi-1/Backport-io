"""
ghostapi_wrapper.models

Pydantic v2 models for request / response validation throughout
the Ghost API wrapper.  Every outbound payload is validated before
hitting the wire, and every inbound response is parsed through
these models so that type hints are trustworthy.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Shared primitives
# ---------------------------------------------------------------------------

class GhostTimestamp(BaseModel):
    """Thin wrapper around ISO-8601 timestamps returned by the API.

    The API sends timestamps as strings like ``"2025-06-15T12:34:56Z"``.
    This model parses them into :class:`datetime` objects for convenience
    but keeps the original string for serialization.
    """

    raw: str
    utc: datetime | None = None

    @field_validator("raw", mode="before")
    @classmethod
    def _parse(cls, v: str | datetime) -> dict:
        if isinstance(v, datetime):
            return {"raw": v.isoformat(), "utc": v}
        try:
            dt = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return {"raw": v, "utc": dt}
        except (ValueError, AttributeError):
            return {"raw": str(v), "utc": None}


# ---------------------------------------------------------------------------
# Auth models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Payload for :meth:`GhostClient.login`.

    Attributes:
        email: Registered account email.
        password: Account password.
    """

    email: str = Field(..., min_length=1, description="Account email address")
    password: str = Field(..., min_length=1, description="Account password")


class LoginResponse(BaseModel):
    """Successful authentication response from the API.

    Attributes:
        access_token: JWT or opaque bearer token.
        refresh_token: Token used to obtain a new access token.
        expires_at: ISO-8601 timestamp when the access token expires.
        user: Minimal user profile returned on login.
    """

    access_token: str
    refresh_token: str = ""
    expires_at: str = ""
    user: "UserProfile | None" = None


class RefreshTokenRequest(BaseModel):
    """Payload for token refresh."""

    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Response after a successful token refresh."""

    access_token: str
    refresh_token: str = ""
    expires_at: str = ""


# ---------------------------------------------------------------------------
# User / profile models
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    """Public profile of a Ghost user.

    Attributes:
        user_id: Unique identifier (UUID or integer string).
        display_name: Name shown to other users (may be anonymous).
        avatar_url: URL of the user's avatar image, if any.
        is_verified: Whether the account has completed email verification.
        created_at: When the account was created.
    """

    user_id: str
    display_name: str = ""
    avatar_url: str = ""
    is_verified: bool = False
    created_at: str = ""


# ---------------------------------------------------------------------------
# Contact / chat models
# ---------------------------------------------------------------------------

class Contact(BaseModel):
    """A chat contact or conversation thread.

    Attributes:
        chat_id: Unique identifier for the conversation.
        display_name: Name of the contact or group.
        avatar_url: URL of the contact's avatar.
        last_message: Preview text of the most recent message.
        last_message_at: Timestamp of the last message.
        is_group: Whether this is a group chat.
        unread_count: Number of unread messages.
        online: Whether the contact is currently online.
    """

    chat_id: str
    display_name: str = ""
    avatar_url: str = ""
    last_message: str = ""
    last_message_at: str = ""
    is_group: bool = False
    unread_count: int = 0
    online: bool = False


# ---------------------------------------------------------------------------
# Message models
# ---------------------------------------------------------------------------

class MessageSendRequest(BaseModel):
    """Payload for :meth:`GhostClient.send_message`.

    Attributes:
        chat_id: Target conversation identifier.
        text: Message body.  Max length depends on Ghost's limits (typically 2000).
    """

    chat_id: str = Field(..., min_length=1, description="Target chat ID")
    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Message text (max 5000 characters)",
    )

    @field_validator("text")
    @classmethod
    def _strip_text(cls, v: str) -> str:
        return v.strip()


class Message(BaseModel):
    """A single message in a conversation.

    Attributes:
        message_id: Unique message identifier.
        chat_id: Conversation this message belongs to.
        sender_id: User who sent the message.
        text: Message body content.
        message_type: Kind of message (text, image, system, etc.).
        created_at: When the message was sent.
        is_read: Whether the current user has read this message.
        is_mine: Whether the current user authored this message.
    """

    message_id: str
    chat_id: str = ""
    sender_id: str = ""
    text: str = ""
    message_type: str = "text"
    created_at: str = ""
    is_read: bool = False
    is_mine: bool = False


class MessageListResponse(BaseModel):
    """Paginated list of messages returned by the API.

    Attributes:
        messages: Ordered list of messages (newest first unless specified).
        has_more: Whether additional pages exist.
        next_cursor: Opaque cursor for fetching the next page.
    """

    messages: list[Message] = Field(default_factory=list)
    has_more: bool = False
    next_cursor: str = ""


class FetchMessagesRequest(BaseModel):
    """Query parameters for :meth:`GhostClient.fetch_messages`.

    Attributes:
        chat_id: Conversation to fetch messages from.
        limit: Maximum number of messages to return (1-200).
        cursor: Pagination cursor from a previous response.
    """

    chat_id: str = Field(..., min_length=1)
    limit: int = Field(default=50, ge=1, le=200)
    cursor: str = ""


# ---------------------------------------------------------------------------
# Generic / envelope models
# ---------------------------------------------------------------------------

class APIEnvelope(BaseModel):
    """Standard API response envelope.

    Most Ghost API responses are wrapped in a JSON object with ``ok``,
    ``data``, and optionally ``error`` keys.

    Attributes:
        ok: Whether the request succeeded.
        data: Payload (parsed into a sub-model elsewhere).
        error: Error message when ``ok`` is ``False``.
    """

    ok: bool = True
    data: dict[str, Any] = Field(default_factory=dict)
    error: str = ""


class PaginatedEnvelope(APIEnvelope):
    """Envelope for paginated list responses."""

    has_more: bool = False
    next_cursor: str = ""


class HealthResponse(BaseModel):
    """Response from the health-check endpoint."""

    status: str = "ok"
    version: str = "1.0.0"
    authenticated: bool = False
