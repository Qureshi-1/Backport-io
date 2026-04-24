"""
Unified caching layer — Redis (Upstash) + in-memory LRU fallback.

If REDIS_URL is set → uses Redis (persists across restarts, shared across instances)
If REDIS_URL is NOT set → uses in-memory dict (resets on restart, single instance only)

Usage:
    from cache import cache

    await cache.set("key", "value", ttl=300)
    val = await cache.get("key")
    await cache.delete("key")
"""

import os
import time
import json
import asyncio
import threading

# ─── In-Memory LRU Store (fallback when no Redis) ──────────────────────────────
_memory_store: dict = {}  # { key: (expiry_timestamp, value) }
_store_lock = threading.RLock()
MAX_MEMORY_ENTRIES = 2000  # Prevent unbounded growth on 512MB Render free tier


def _memory_cleanup():
    """Remove expired + oldest entries to prevent memory leaks."""
    now = time.time()
    expired = [k for k, v in _memory_store.items() if v[0] > 0 and now > v[0]]
    for k in expired:
        del _memory_store[k]

    # If still over limit, remove oldest 25%
    if len(_memory_store) > MAX_MEMORY_ENTRIES:
        sorted_keys = sorted(_memory_store, key=lambda k: _memory_store[k][0])
        for k in sorted_keys[: len(sorted_keys) // 4]:
            del _memory_store[k]


class MemoryCache:
    """Simple in-memory cache with TTL support (thread-safe)."""

    def __init__(self):
        self._store = _memory_store
        self._lock = _store_lock

    def get(self, key: str) -> str | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expiry, value = entry
            if expiry > 0 and time.time() > expiry:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: str, ttl: int = 300):
        with self._lock:
            if len(self._store) >= MAX_MEMORY_ENTRIES:
                _memory_cleanup()
            expiry = time.time() + ttl if ttl > 0 else 0
            self._store[key] = (expiry, value)

    def delete(self, key: str):
        with self._lock:
            self._store.pop(key, None)

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

    def incr(self, key: str) -> int:
        """Increment a counter. Returns new value."""
        with self._lock:
            val = self.get(key)
            new_val = int(val or 0) + 1
            # Keep existing TTL or default to 60s
            entry = self._store.get(key)
            ttl_remaining = 0
            if entry and entry[0] > 0:
                ttl_remaining = int(entry[0] - time.time())
            self.set(key, str(new_val), ttl=max(ttl_remaining, 60))
            return new_val

    def ttl(self, key: str) -> int:
        """Get remaining TTL in seconds. Returns -1 if no TTL, -2 if key doesn't exist."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return -2
            expiry, _ = entry
            if expiry == 0:
                return -1
            remaining = int(expiry - time.time())
            return remaining if remaining > 0 else -2


class RedisCache:
    """Redis cache using redis-py (for Upstash or any Redis)."""

    def __init__(self, redis_url: str):
        self._url = redis_url
        self._client = None
        self._connected = False

    def _ensure_connected(self):
        """Lazy connect — only connects on first use."""
        if self._connected and self._client:
            return True
        try:
            import redis
            self._client = redis.from_url(
                self._url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
                ssl_cert_reqs=None,  # Required for Upstash (self-signed certs)
            )
            # Test connection
            self._client.ping()
            self._connected = True
            return True
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e} — falling back to memory cache")
            self._connected = False
            self._client = None
            return False

    def get(self, key: str) -> str | None:
        if not self._ensure_connected():
            return _memory_cache.get(key)
        try:
            return self._client.get(key)
        except Exception:
            self._connected = False
            return _memory_cache.get(key)

    def set(self, key: str, value: str, ttl: int = 300):
        if not self._ensure_connected():
            _memory_cache.set(key, value, ttl)
            return
        try:
            self._client.setex(key, ttl, value)
        except Exception:
            self._connected = False
            _memory_cache.set(key, value, ttl)

    def delete(self, key: str):
        if not self._ensure_connected():
            _memory_cache.delete(key)
            return
        try:
            self._client.delete(key)
        except Exception:
            self._connected = False
            _memory_cache.delete(key)

    def exists(self, key: str) -> bool:
        if not self._ensure_connected():
            return _memory_cache.exists(key)
        try:
            return bool(self._client.exists(key))
        except Exception:
            self._connected = False
            return _memory_cache.exists(key)

    def incr(self, key: str) -> int:
        if not self._ensure_connected():
            return _memory_cache.incr(key)
        try:
            return self._client.incr(key)
        except Exception:
            self._connected = False
            return _memory_cache.incr(key)

    def ttl(self, key: str) -> int:
        if not self._ensure_connected():
            return _memory_cache.ttl(key)
        try:
            return self._client.ttl(key)
        except Exception:
            self._connected = False
            return _memory_cache.ttl(key)


# ─── Initialize Cache ─────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "")
_memory_cache = MemoryCache()

if REDIS_URL:
    cache: MemoryCache | RedisCache = RedisCache(REDIS_URL)
    print("✅ Cache: Redis mode (Upstash)")
else:
    cache = _memory_cache
    print("✅ Cache: In-memory LRU mode (set REDIS_URL for Redis/Upstash)")
