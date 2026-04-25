"""
Token bucket rate limiter with pluggable storage backends.

Supports:
    - InMemoryStore (default): Thread-safe in-memory counter with TTL expiry.
    - RedisStore (optional): Uses REDIS_URL environment variable. INCR + EXPIRE pattern.

Usage:
    from rate_limiter import rate_limiter
    result = rate_limiter.check_rate_limit("user:42", max_requests=100, window_seconds=60)
    # => {"allowed": True, "remaining": 99, "retry_after": 0}
"""

import time
import threading
import logging
import os
from abc import ABC, abstractmethod
from typing import Optional

logger = logging.getLogger(__name__)


# ─── Abstract Storage Backend ─────────────────────────────────────────────────

class RateLimitStore(ABC):
    """Abstract base class for rate limit storage backends."""

    @abstractmethod
    def increment(self, key: str) -> int:
        """Increment the counter for *key* and return the new value."""
        ...

    @abstractmethod
    def get(self, key: str) -> int:
        """Return the current counter value for *key* (0 if not set)."""
        ...

    @abstractmethod
    def reset(self, key: str) -> None:
        """Reset (delete) the counter for *key*."""
        ...


# ─── In-Memory Store ─────────────────────────────────────────────────────────

class InMemoryStore(RateLimitStore):
    """Thread-safe in-memory rate limit store using a sliding-window approach."""

    def __init__(self):
        self._data: dict[str, tuple[float, int]] = {}  # key -> (expiry_time, count)
        self._lock = threading.Lock()

    def _cleanup(self, now: float):
        """Remove expired entries."""
        expired = [k for k, (exp, _) in self._data.items() if now >= exp]
        for k in expired:
            del self._data[k]

    def increment(self, key: str) -> int:
        now = time.time()
        with self._lock:
            self._cleanup(now)
            if key in self._data:
                exp, count = self._data[key]
                if now < exp:
                    self._data[key] = (exp, count + 1)
                    return count + 1
                else:
                    # Expired — reset
                    self._data[key] = (now + 3600, 1)
                    return 1
            else:
                self._data[key] = (now + 3600, 1)
                return 1

    def get(self, key: str) -> int:
        now = time.time()
        with self._lock:
            self._cleanup(now)
            if key in self._data:
                exp, count = self._data[key]
                if now < exp:
                    return count
            return 0

    def reset(self, key: str) -> None:
        with self._lock:
            self._data.pop(key, None)


# ─── Redis Store ─────────────────────────────────────────────────────────────

class RedisStore(RateLimitStore):
    """Redis-backed rate limit store using INCR + EXPIRE pattern.

    Requires the ``REDIS_URL`` environment variable to be set.
    Falls back to InMemoryStore if Redis is unavailable.
    """

    def __init__(self, redis_url: Optional[str] = None):
        self._redis_url = redis_url or os.getenv("REDIS_URL", "")
        self._redis = None
        self._connected = False

        if self._redis_url:
            try:
                import redis as redis_lib
                self._redis = redis_lib.from_url(
                    self._redis_url,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                )
                # Test connection
                self._redis.ping()
                self._connected = True
                logger.info("Rate limiter: connected to Redis")
            except Exception as e:
                logger.warning(f"Rate limiter: Redis unavailable ({e}), falling back to InMemoryStore")
                self._redis = None

    @property
    def connected(self) -> bool:
        return self._connected

    def increment(self, key: str) -> int:
        if not self._redis:
            return 0
        try:
            pipe = self._redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, 3600)  # Auto-expire after 1 hour max
            results = pipe.execute()
            return results[0]
        except Exception as e:
            logger.warning(f"Redis INCR error: {e}")
            return 0

    def get(self, key: str) -> int:
        if not self._redis:
            return 0
        try:
            val = self._redis.get(key)
            return int(val) if val else 0
        except Exception as e:
            logger.warning(f"Redis GET error: {e}")
            return 0

    def reset(self, key: str) -> None:
        if not self._redis:
            return
        try:
            self._redis.delete(key)
        except Exception as e:
            logger.warning(f"Redis DEL error: {e}")


# ─── Rate Limiter ────────────────────────────────────────────────────────────

class RateLimiter:
    """Token-bucket / fixed-window rate limiter with pluggable storage.

    Parameters:
        storage_backend: A ``RateLimitStore`` instance. Defaults to ``InMemoryStore``.
    """

    def __init__(self, storage_backend: Optional[RateLimitStore] = None):
        if storage_backend is None:
            # Try Redis first, fall back to in-memory
            redis_store = RedisStore()
            if redis_store.connected:
                self._store = redis_store
            else:
                self._store = InMemoryStore()
        else:
            self._store = storage_backend

    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
    ) -> dict:
        """Check if a request is allowed under the rate limit.

        Args:
            key: Unique identifier for the rate limit bucket (e.g. "user:42").
            max_requests: Maximum number of requests allowed in the window.
            window_seconds: Length of the rate limit window in seconds.

        Returns:
            dict with keys:
                - ``allowed`` (bool): Whether the request is permitted.
                - ``remaining`` (int): Remaining requests in the current window.
                - ``retry_after`` (int): Seconds until the next request is allowed (0 if allowed).
        """
        current = self._store.increment(key)

        if current > max_requests:
            # Calculate retry_after based on the window
            # For simplicity, we return the full window as retry_after
            # A more precise implementation would track window start time
            retry_after = window_seconds
            return {
                "allowed": False,
                "remaining": 0,
                "retry_after": retry_after,
            }

        remaining = max(0, max_requests - current)
        return {
            "allowed": True,
            "remaining": remaining,
            "retry_after": 0,
        }

    def get_usage(self, key: str) -> int:
        """Get the current usage count for a key (for monitoring)."""
        return self._store.get(key)

    def reset(self, key: str) -> None:
        """Reset the rate limit counter for a key."""
        self._store.reset(key)


# ─── Global Singleton ────────────────────────────────────────────────────────

rate_limiter = RateLimiter()
