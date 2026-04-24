"""
Circuit Breaker tests — state transitions, threshold tracking, recovery timeout, cleanup.
"""
import sys
import os
import time
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from circuit_breaker import (
    CircuitState,
    _Circuit,
    _circuits,
    _lock,
    _get_circuit,
    check_circuit,
    record_success,
    record_failure,
    get_all_circuit_states,
    cleanup_stale_circuits,
    FAILURE_THRESHOLD,
    FAILURE_WINDOW_SEC,
    RECOVERY_TIMEOUT_SEC,
    STALE_ENTRY_SEC,
)


@pytest.fixture(autouse=True)
def reset_circuits():
    """Clear all circuit state before each test."""
    with _lock:
        _circuits.clear()
    yield
    with _lock:
        _circuits.clear()


# ═══════════════════════════════════════════════════════════════════════════════
# Initial State
# ═══════════════════════════════════════════════════════════════════════════════

class TestInitialState:
    def test_new_circuit_is_closed(self):
        """A new circuit should start in CLOSED state."""
        state = check_circuit(1, "https://example.com")
        assert state == "CLOSED"

    def test_new_circuit_has_no_failures(self):
        """A new circuit should have zero failure timestamps."""
        circuit = _get_circuit(1, "https://example.com")
        assert len(circuit.failure_times) == 0

    def test_multiple_users_have_separate_circuits(self):
        """Different user+backend combos should have independent circuits."""
        s1 = check_circuit(1, "https://a.com")
        s2 = check_circuit(2, "https://a.com")
        s3 = check_circuit(1, "https://b.com")
        assert s1 == "CLOSED"
        assert s2 == "CLOSED"
        assert s3 == "CLOSED"


# ═══════════════════════════════════════════════════════════════════════════════
# State Transitions: CLOSED → OPEN
# ═══════════════════════════════════════════════════════════════════════════════

class TestClosedToOpen:
    def test_opens_after_threshold_failures(self):
        """Circuit should open after FAILURE_THRESHOLD failures."""
        for i in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")
            state = check_circuit(1, "https://example.com")
            if i < FAILURE_THRESHOLD - 1:
                assert state == "CLOSED", f"Should stay CLOSED at failure {i+1}"
            else:
                assert state == "OPEN", "Should open at threshold"

    def test_does_not_open_below_threshold(self):
        """Circuit should stay CLOSED with fewer failures than threshold."""
        for _ in range(FAILURE_THRESHOLD - 1):
            record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "CLOSED"

    def test_success_resets_failure_count(self):
        """A successful request should clear failure tracking."""
        for _ in range(FAILURE_THRESHOLD - 1):
            record_failure(1, "https://example.com")
        record_success(1, "https://example.com")
        circuit = _get_circuit(1, "https://example.com")
        assert len(circuit.failure_times) == 0
        assert check_circuit(1, "https://example.com") == "CLOSED"

    def test_success_prevents_opening(self):
        """Success between failures should prevent circuit from opening."""
        for i in range(FAILURE_THRESHOLD - 1):
            record_failure(1, "https://example.com")
        record_success(1, "https://example.com")  # Reset
        for _ in range(FAILURE_THRESHOLD - 1):
            record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "CLOSED"


# ═══════════════════════════════════════════════════════════════════════════════
# State Transitions: OPEN → HALF_OPEN → CLOSED
# ═══════════════════════════════════════════════════════════════════════════════

class TestOpenToHalfOpenToClosed:
    def test_stays_open_before_recovery_timeout(self):
        """Circuit should stay OPEN until recovery timeout elapses."""
        for _ in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "OPEN"

    def test_transitions_to_half_open_after_timeout(self):
        """Circuit should transition to HALF_OPEN after recovery timeout."""
        for _ in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "OPEN"

        # Manually set opened_at to the past to simulate timeout
        circuit = _get_circuit(1, "https://example.com")
        circuit.opened_at = time.time() - RECOVERY_TIMEOUT_SEC - 1

        state = check_circuit(1, "https://example.com")
        assert state == "HALF_OPEN"

    def test_success_in_half_open_closes_circuit(self):
        """A success in HALF_OPEN should close the circuit."""
        for _ in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")

        circuit = _get_circuit(1, "https://example.com")
        circuit.opened_at = time.time() - RECOVERY_TIMEOUT_SEC - 1
        check_circuit(1, "https://example.com")  # Trigger transition to HALF_OPEN

        record_success(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "CLOSED"

    def test_failure_in_half_open_reopens_circuit(self):
        """A failure in HALF_OPEN should re-open the circuit."""
        for _ in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")

        circuit = _get_circuit(1, "https://example.com")
        circuit.opened_at = time.time() - RECOVERY_TIMEOUT_SEC - 1
        check_circuit(1, "https://example.com")  # HALF_OPEN

        record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "OPEN"

    def test_success_in_open_state_closes_circuit(self):
        """A success in OPEN state should also close the circuit (direct reset)."""
        for _ in range(FAILURE_THRESHOLD):
            record_failure(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "OPEN"

        record_success(1, "https://example.com")
        assert check_circuit(1, "https://example.com") == "CLOSED"


# ═══════════════════════════════════════════════════════════════════════════════
# Threshold & Window Tracking
# ═══════════════════════════════════════════════════════════════════════════════

class TestThresholdTracking:
    def test_old_failures_are_pruned(self):
        """Failures outside the window should be pruned during check."""
        circuit = _get_circuit(1, "https://example.com")
        # Insert old failures
        old_time = time.time() - FAILURE_WINDOW_SEC - 10
        circuit.failure_times = [old_time] * (FAILURE_THRESHOLD - 1)

        # Add one recent failure
        record_failure(1, "https://example.com")

        # Only the recent failure should count (total < threshold)
        state = check_circuit(1, "https://example.com")
        assert state == "CLOSED"

    def test_get_all_circuit_states(self):
        """get_all_circuit_states should return info for all circuits."""
        record_failure(1, "https://a.com")
        record_failure(2, "https://b.com")
        record_failure(2, "https://b.com")

        states = get_all_circuit_states()
        assert "1:https://a.com" in states
        assert "2:https://b.com" in states
        assert states["1:https://a.com"]["failure_count"] == 1
        assert states["2:https://b.com"]["failure_count"] == 2

    def test_circuit_key_format(self):
        """Circuit keys should be formatted as user_id:backend_url."""
        _get_circuit(42, "https://api.example.com")
        assert "42:https://api.example.com" in _circuits


# ═══════════════════════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════════════════════

class TestCleanup:
    def test_cleanup_removes_stale_entries(self):
        """cleanup_stale_circuits should remove inactive circuits."""
        _get_circuit(1, "https://old.com")
        _get_circuit(2, "https://new.com")

        # Simulate stale entry
        circuit_old = _get_circuit(1, "https://old.com")
        circuit_old.last_activity = time.time() - STALE_ENTRY_SEC - 10

        # Simulate fresh entry
        circuit_new = _get_circuit(2, "https://new.com")
        circuit_new.last_activity = time.time()

        cleanup_stale_circuits()

        assert "1:https://old.com" not in _circuits
        assert "2:https://new.com" in _circuits

    def test_cleanup_empty(self):
        """Cleanup on empty circuits should not raise."""
        cleanup_stale_circuits()
        assert len(_circuits) == 0

    def test_cleanup_keeps_active_entries(self):
        """Active circuits should not be removed."""
        _get_circuit(1, "https://active.com")
        cleanup_stale_circuits()
        assert "1:https://active.com" in _circuits
