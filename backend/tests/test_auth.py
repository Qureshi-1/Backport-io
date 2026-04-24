"""
Auth security tests — OTP not in response body, rate limiting, password validation.
"""
import sys
import os
import pytest
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from auth import (
    _validate_password_strength,
    _check_login_rate_limit,
    _check_signup_rate_limit,
    _record_login_failure,
    _record_login_success,
    _record_signup_attempt,
    _check_otp_attempts,
    _record_otp_attempt,
    _login_attempts,
    _signup_attempts,
    _otp_attempts,
    create_access_token,
    get_password_hash,
    verify_password,
)


# ═══════════════════════════════════════════════════════════════════════════════
# CRITICAL: OTP NOT in Response Body
# ═══════════════════════════════════════════════════════════════════════════════

class TestOTPNotInResponse:
    """CRITICAL SECURITY TEST: Verify OTP tokens are NEVER exposed in API responses."""

    def test_signup_response_no_verification_token(self, client):
        """Signup response must NOT contain verification_token field."""
        response = client.post("/api/auth/signup", json={
            "email": "otptest@example.com",
            "password": "StrongPass123!"
        })
        data = response.json()
        
        # SECURITY: verification_token must NEVER be in response
        assert "verification_token" not in data, \
            "CRITICAL SECURITY: verification_token leaked in signup response!"
        assert data.get("email") == "otptest@example.com"
        assert data.get("email_verification_required") is True

    def test_resend_verification_no_token(self, client):
        """Resend verification response must NOT contain verification_token."""
        # First create a user
        client.post("/api/auth/signup", json={
            "email": "resend_test@example.com",
            "password": "StrongPass123!"
        })
        
        response = client.post("/api/auth/resend-verification", json={
            "email": "resend_test@example.com"
        })
        data = response.json()
        
        # SECURITY: verification_token must NEVER be in response
        assert "verification_token" not in data, \
            "CRITICAL SECURITY: verification_token leaked in resend response!"

    def test_verify_email_no_token_in_response(self, client):
        """Verify email endpoint should not leak token info."""
        response = client.get("/api/auth/verify-email", params={"token": "000000"})
        data = response.json()
        
        # On invalid token, should return error without revealing the token
        assert "verification_token" not in data

    def test_forgot_password_no_token_in_response(self, client):
        """Forgot password response must not leak reset token."""
        response = client.post("/api/auth/forgot-password", json={
            "email": "anyone@example.com"
        })
        data = response.json()
        
        # SECURITY: password_reset_token must NEVER be in response
        assert "password_reset_token" not in data
        assert "reset_token" not in data
        assert "token" not in data


# ═══════════════════════════════════════════════════════════════════════════════
# Password Strength Validation
# ═══════════════════════════════════════════════════════════════════════════════

class TestPasswordStrength:
    """Test password strength validation rules."""

    def test_strong_password(self):
        assert _validate_password_strength("StrongPass123!") is None

    def test_short_password(self):
        assert _validate_password_strength("Short1") == "Password must be at least 8 characters long"

    def test_no_uppercase(self):
        assert _validate_password_strength("lowercase123") == "Password must contain at least one uppercase letter"

    def test_no_lowercase(self):
        assert _validate_password_strength("UPPERCASE123") == "Password must contain at least one lowercase letter"

    def test_no_digit(self):
        assert _validate_password_strength("NoDigits!!") == "Password must contain at least one digit"

    def test_minimum_valid(self):
        assert _validate_password_strength("Aa1aaaaa") is None  # Exactly 8 chars with all requirements

    def test_whitespace_password(self):
        """Password with trailing spaces but valid characters passes (all type requirements met)."""
        # "Aa1     " has uppercase, lowercase, digit, and length >= 8 — it passes
        assert _validate_password_strength("Aa1     ") is None


# ═══════════════════════════════════════════════════════════════════════════════
# Rate Limiting
# ═══════════════════════════════════════════════════════════════════════════════

class TestRateLimiting:
    """Test rate limiting for login and signup."""

    def setup_method(self):
        """Clear rate limit stores before each test."""
        _login_attempts.clear()
        _signup_attempts.clear()
        _otp_attempts.clear()

    def test_login_rate_limit_allows_initial(self):
        """First login attempts should be allowed."""
        assert _check_login_rate_limit("test@example.com") is True

    def test_login_rate_limit_blocks_after_max(self):
        """Should block after MAX_LOGIN_ATTEMPTS failures."""
        from config import MAX_LOGIN_ATTEMPTS
        email = "ratelimit@example.com"
        for _ in range(MAX_LOGIN_ATTEMPTS):
            _record_login_failure(email)
        assert _check_login_rate_limit(email) is False

    def test_login_rate_limit_resets_on_success(self):
        """Successful login should reset the failure counter."""
        email = "resetsuccess@example.com"
        _record_login_failure(email)
        _record_login_failure(email)
        _record_login_success(email)
        assert _check_login_rate_limit(email) is True

    def test_signup_rate_limit_allows_initial(self):
        """First signup from an IP should be allowed."""
        assert _check_signup_rate_limit("192.168.1.1") is True

    def test_signup_rate_limit_blocks_after_max(self):
        """Should block after MAX_SIGNUP_ATTEMPTS_PER_IP from same IP."""
        ip = "10.0.0.1"
        for _ in range(5):  # MAX_SIGNUP_ATTEMPTS_PER_IP = 5
            _record_signup_attempt(ip)
        assert _check_signup_rate_limit(ip) is False

    def test_otp_rate_limit_blocks_after_max(self):
        """Should block OTP verification after MAX_OTP_ATTEMPTS."""
        from config import MAX_OTP_ATTEMPTS
        token = "123456"
        for _ in range(MAX_OTP_ATTEMPTS):
            _record_otp_attempt(token)
        assert _check_otp_attempts(token) is False


# ═══════════════════════════════════════════════════════════════════════════════
# JWT Token
# ═══════════════════════════════════════════════════════════════════════════════

class TestJWTToken:
    """Test JWT token creation and password hashing."""

    def test_create_access_token(self):
        token = create_access_token(data={"sub": "123", "email": "test@example.com"})
        assert isinstance(token, str)
        assert len(token) > 0

    def test_password_hash_and_verify(self):
        """Password hashing and verification should work correctly."""
        hashed = get_password_hash("my_secure_password")
        assert hashed != "my_secure_password"
        assert verify_password("my_secure_password", hashed) is True
        assert verify_password("wrong_password", hashed) is False

    def test_password_hash_is_deterministic_verification(self):
        """Same password should always verify against its hash."""
        password = "TestPass123!"
        hashed = get_password_hash(password)
        # Verify multiple times
        for _ in range(10):
            assert verify_password(password, hashed) is True
