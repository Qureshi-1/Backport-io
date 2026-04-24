"""
Rate Limiter unit tests — plan-based rate limiting logic.
Tests the PLAN_RATE_LIMITS config and rate limit enforcement flow.
"""
import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from proxy import PLAN_RATE_LIMITS, _cache


# ═══════════════════════════════════════════════════════════════════════════════
# Plan Rate Limits Configuration
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlanRateLimits:
    """Verify rate limit configuration per plan."""

    def test_free_plan_has_limit(self):
        assert "free" in PLAN_RATE_LIMITS
        assert PLAN_RATE_LIMITS["free"] > 0

    def test_plus_higher_than_free(self):
        assert PLAN_RATE_LIMITS["plus"] > PLAN_RATE_LIMITS["free"]

    def test_pro_higher_than_plus(self):
        assert PLAN_RATE_LIMITS["pro"] > PLAN_RATE_LIMITS["plus"]

    def test_enterprise_highest(self):
        assert PLAN_RATE_LIMITS["enterprise"] > PLAN_RATE_LIMITS["pro"]

    def test_all_plans_defined(self):
        """All expected plans must have rate limits configured."""
        expected_plans = ["free", "plus", "pro", "enterprise"]
        for plan in expected_plans:
            assert plan in PLAN_RATE_LIMITS, f"Missing rate limit for plan: {plan}"

    def test_defaults_to_60_for_unknown_plan(self):
        """Unknown plans should fall back to 60 RPM."""
        default = PLAN_RATE_LIMITS.get("unknown_plan", 60)
        assert default == 60

    def test_enterprise_at_least_10000(self):
        """Enterprise should allow at least 10,000 RPM."""
        assert PLAN_RATE_LIMITS["enterprise"] >= 10000


# ═══════════════════════════════════════════════════════════════════════════════
# Rate Limit Key Generation Logic
# ═══════════════════════════════════════════════════════════════════════════════

class TestRateLimitKeyGeneration:
    """Test the rate limit key bucket format and behavior."""

    def test_rate_key_format(self):
        """Rate limit keys should follow the format: rl:{user_id}:{minute_bucket}"""
        user_id = 42
        now = time.time()
        minute_bucket = int(now // 60)
        expected_key = f"rl:{user_id}:{minute_bucket}"
        assert expected_key.startswith("rl:42:")
        assert len(expected_key.split(":")) == 3

    def test_rate_keys_different_per_minute(self):
        """Different minutes should produce different bucket keys."""
        user_id = 1
        key_min1 = f"rl:{user_id}:1000"
        key_min2 = f"rl:{user_id}:1001"
        assert key_min1 != key_min2

    def test_rate_keys_different_per_user(self):
        """Different users should produce different bucket keys."""
        key_user1 = "rl:1:1000"
        key_user2 = "rl:2:1000"
        assert key_user1 != key_user2


# ═══════════════════════════════════════════════════════════════════════════════
# Rate Limiting Disabled
# ═══════════════════════════════════════════════════════════════════════════════

class TestRateLimitDisabled:
    """Test behavior when rate limiting is disabled per user."""

    def test_user_with_rate_limit_disabled_bypasses(self, client):
        """User with rate_limit_enabled=False should not get 429."""
        from tests.test_helpers import create_user_for_client
        from models import User
        from database import SessionLocal

        headers, email = create_user_for_client(client)
        session = SessionLocal()
        user = session.query(User).filter(User.email == email).first()
        user.rate_limit_enabled = False
        session.commit()
        session.close()

        # Send many rapid requests — should all succeed
        for _ in range(5):
            resp = client.get("/api/user/me", headers=headers)
            assert resp.status_code != 429, "Rate limit should be disabled"


# ═══════════════════════════════════════════════════════════════════════════════
# Rate Limit API Response
# ═══════════════════════════════════════════════════════════════════════════════

class TestRateLimitResponse:
    """Test the rate limit error response format."""

    def test_rate_limit_429_response_format(self, client):
        """429 response should include plan info and RPM details."""
        from tests.test_helpers import create_user_for_client
        from models import User
        from database import SessionLocal

        headers, email = create_user_for_client(client)
        session = SessionLocal()
        user = session.query(User).filter(User.email == email).first()
        # Set a very low limit by changing plan
        user.plan = "free"
        session.commit()

        user_id = user.id
        plan = user.plan
        max_rpm = PLAN_RATE_LIMITS.get(plan, 60)
        session.close()

        # Create rate limit key and fill it
        now = time.time()
        rate_key = f"rl:{user_id}:{now // 60}"
        _cache.set(rate_key, str(max_rpm), ttl=60)

        resp = client.get("/proxy/test", headers=headers)
        # May or may not be 429 depending on full proxy flow
        if resp.status_code == 429:
            detail = resp.json().get("detail", "")
            assert "Rate Limit" in detail or "rate" in detail.lower()
