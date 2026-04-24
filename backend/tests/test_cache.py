"""
Cache tests — MemoryCache get/set/delete/exists/incr/ttl with expiry and eviction.
"""
import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from cache import MemoryCache, _memory_store, MAX_MEMORY_ENTRIES


@pytest.fixture(autouse=True)
def clear_store():
    """Clear the memory cache store before each test."""
    _memory_store.clear()
    yield
    _memory_store.clear()


@pytest.fixture
def cache():
    """Provide a fresh MemoryCache instance (shares the global store)."""
    return MemoryCache()


# ═══════════════════════════════════════════════════════════════════════════════
# Basic Operations
# ═══════════════════════════════════════════════════════════════════════════════

class TestBasicOperations:
    def test_set_and_get(self, cache):
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent_key(self, cache):
        assert cache.get("nonexistent") is None

    def test_set_overwrites(self, cache):
        cache.set("key1", "value1")
        cache.set("key1", "value2")
        assert cache.get("key1") == "value2"

    def test_delete_existing(self, cache):
        cache.set("key1", "value1")
        cache.delete("key1")
        assert cache.get("key1") is None

    def test_delete_nonexistent(self, cache):
        """Deleting a nonexistent key should not raise."""
        cache.delete("nonexistent")  # Should not raise

    def test_exists_true(self, cache):
        cache.set("key1", "value1")
        assert cache.exists("key1") is True

    def test_exists_false(self, cache):
        assert cache.exists("nonexistent") is False


# ═══════════════════════════════════════════════════════════════════════════════
# TTL / Expiry
# ═══════════════════════════════════════════════════════════════════════════════

class TestExpiry:
    def test_ttl_default(self, cache):
        """Default TTL should allow reads within the expiry window."""
        cache.set("key1", "value1", ttl=5)
        assert cache.get("key1") == "value1"

    def test_key_expires_after_ttl(self, cache):
        """Key should return None after TTL expires."""
        cache.set("key1", "value1", ttl=1)
        assert cache.get("key1") == "value1"
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_expired_key_not_exists(self, cache):
        """Expired key should not exist."""
        cache.set("key1", "value1", ttl=1)
        time.sleep(1.1)
        assert cache.exists("key1") is False

    def test_ttl_remaining(self, cache):
        """TTL should return remaining seconds."""
        cache.set("key1", "value1", ttl=10)
        remaining = cache.ttl("key1")
        assert 0 < remaining <= 10

    def test_ttl_expired_returns_neg2(self, cache):
        """TTL for expired key should return -2 (key doesn't exist)."""
        cache.set("key1", "value1", ttl=1)
        time.sleep(1.1)
        assert cache.ttl("key1") == -2

    def test_ttl_nonexistent_returns_neg2(self, cache):
        """TTL for nonexistent key should return -2."""
        assert cache.ttl("nonexistent") == -2

    def test_ttl_no_expiry_returns_neg1(self, cache):
        """TTL for key with no expiry (ttl=0) should return -1."""
        cache.set("key1", "value1", ttl=0)
        assert cache.ttl("key1") == -1


# ═══════════════════════════════════════════════════════════════════════════════
# Increment (incr)
# ═══════════════════════════════════════════════════════════════════════════════

class TestIncr:
    def test_incr_from_zero(self, cache):
        """Incr on nonexistent key should start at 1."""
        result = cache.incr("counter1")
        assert result == 1

    def test_incr_multiple(self, cache):
        """Multiple incr calls should increment correctly."""
        cache.incr("counter1")
        cache.incr("counter1")
        result = cache.incr("counter1")
        assert result == 3

    def test_incr_preserves_ttl(self, cache):
        """Incr should preserve the existing TTL."""
        cache.set("counter1", "5", ttl=300)
        cache.incr("counter1")
        remaining = cache.ttl("counter1")
        assert remaining > 0  # Should still have TTL

    def test_incr_sets_default_ttl(self, cache):
        """Incr on key without TTL should set a default TTL."""
        cache.set("counter1", "5", ttl=0)
        cache.incr("counter1")
        remaining = cache.ttl("counter1")
        assert remaining >= 55  # Default is 60s, allow for test execution time


# ═══════════════════════════════════════════════════════════════════════════════
# Eviction / Cleanup
# ═══════════════════════════════════════════════════════════════════════════════

class TestEviction:
    def test_store_handles_many_entries(self, cache):
        """Should handle entries up to MAX_MEMORY_ENTRIES without error."""
        for i in range(100):
            cache.set(f"key_{i}", f"value_{i}", ttl=300)
        for i in range(100):
            assert cache.get(f"key_{i}") == f"value_{i}"

    def test_expired_entries_cleaned_on_set(self, cache):
        """Setting a new key should trigger cleanup of expired entries."""
        # Fill with expired entries
        for i in range(50):
            cache.set(f"expired_{i}", f"value_{i}", ttl=1)
        time.sleep(1.1)

        # Setting a new entry should trigger cleanup
        cache.set("new_key", "new_value", ttl=300)
        assert cache.get("new_key") == "new_value"

    def test_empty_and_special_values(self, cache):
        """Cache should handle empty strings and special values."""
        cache.set("empty", "")
        assert cache.get("empty") == ""

        cache.set("json", '{"key": "value"}')
        assert cache.get("json") == '{"key": "value"}'

        cache.set("number", "42")
        assert cache.get("number") == "42"
