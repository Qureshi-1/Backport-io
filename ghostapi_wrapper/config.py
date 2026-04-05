"""
ghostapi_wrapper.config

Configuration management backed by environment variables with
sensible defaults.  Uses Pydantic Settings so values can come from
``.env`` files, environment variables, or explicit constructor
arguments — in that order of priority.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class GhostConfig(BaseSettings):
    """Central configuration for the Ghost API client.

    Values are resolved in the following priority order:

    1. Explicit keyword arguments passed to the constructor.
    2. Environment variables (e.g. ``GHOST_API_BASE_URL``).
    3. ``.env`` file in the working directory (if present).
    4. Built-in defaults defined below.

    Example::

        cfg = GhostConfig(
            ghost_email="user@example.com",
            ghost_password="s3cret",
        )

    Attributes:
        ghost_api_base_url: Root URL of the Ghost API (no trailing slash).
        ghost_email: Account email for authentication.
        ghost_password: Account password for authentication.
        request_timeout: Default HTTP timeout in seconds.
        max_retries: Maximum number of automatic retries on transient errors.
        retry_base_delay: Base delay in seconds for exponential backoff.
        rate_limit_rps: Target requests-per-second for the rate limiter.
        verify_ssl: Whether to verify SSL certificates (``False`` for testing).
        log_level: Minimum severity for the application logger.
        log_file: Optional path to a log file.  ``None`` disables file logging.
        token_refresh_buffer: Refresh the token this many seconds before expiry.
    """

    model_config = SettingsConfigDict(
        env_prefix="GHOST_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- API connection -------------------------------------------------------

    ghost_api_base_url: str = "https://api.ghostapp.io/v1"
    ghost_email: str = ""
    ghost_password: str = ""
    verify_ssl: bool = True

    # --- Timeouts & retries ---------------------------------------------------

    request_timeout: float = 30.0
    max_retries: int = 3
    retry_base_delay: float = 1.0

    # --- Rate limiting --------------------------------------------------------

    rate_limit_rps: float = 10.0

    # --- Logging --------------------------------------------------------------

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_file: str | None = None

    # --- Token management ----------------------------------------------------

    token_refresh_buffer: int = 300  # seconds before actual expiry

    # --- Validators ----------------------------------------------------------

    @field_validator("ghost_api_base_url")
    @classmethod
    def _strip_trailing_slash(cls, v: str) -> str:
        """Ensure the base URL never ends with a slash."""
        return v.rstrip("/")

    @field_validator("request_timeout", "rate_limit_rps")
    @classmethod
    def _positive_float(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Value must be positive.")
        return v

    @field_validator("max_retries", "token_refresh_buffer")
    @classmethod
    def _non_negative_int(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value must be non-negative.")
        return v

    @model_validator(mode="after")
    def _warn_missing_credentials(self) -> "GhostConfig":
        """Log a warning when credentials are missing (client may still be
        instantiated for public-only endpoints or token-based auth)."""
        if not self.ghost_email or not self.ghost_password:
            import logging
            logger = logging.getLogger("ghostapi")
            logger.warning(
                "GHOST_EMAIL and/or GHOST_PASSWORD not set. "
                "Call client.login() explicitly if using token-based auth."
            )
        return self
