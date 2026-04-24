"""
Circuit Breaker for Backport API Gateway.

States:
    CLOSED  — Normal operation. Requests pass through. Failures are tracked.
    OPEN    — Backend is failing. Requests are rejected (with mock fallback).
    HALF_OPEN — Recovery probe. One test request allowed to check backend health.

Thresholds:
    - 5 failures within a 30-second window opens the circuit.
    - After 60 seconds in OPEN state, transition to HALF_OPEN.
    - A single success in HALF_OPEN closes the circuit.
    - A single failure in HALF_OPEN re-opens the circuit.
"""

import time
import threading
import logging
from enum import Enum
from typing import Optional

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


# ─── Configuration ────────────────────────────────────────────────────────────

FAILURE_THRESHOLD = 5        # Failures to open circuit
FAILURE_WINDOW_SEC = 30      # Time window for counting failures
RECOVERY_TIMEOUT_SEC = 60    # Seconds before transitioning OPEN -> HALF_OPEN
STALE_ENTRY_SEC = 300        # Clean up entries inactive for 5 minutes


# ─── Per-circuit state ─────────────────────────────────────────────────────────

class _Circuit:
    """Tracks circuit state for a single user+backend_url pair."""

    __slots__ = ("state", "failure_times", "last_failure_time", "opened_at", "last_activity")

    def __init__(self):
        self.state: CircuitState = CircuitState.CLOSED
        self.failure_times: list[float] = []  # Timestamps of recent failures
        self.last_failure_time: Optional[float] = None
        self.opened_at: Optional[float] = None
        self.last_activity: float = time.time()


# ─── Global store ──────────────────────────────────────────────────────────────

_circuits: dict[str, _Circuit] = {}  # key = "user_id:backend_url"
_lock = threading.Lock()


def _get_key(user_id: int, backend_url: str) -> str:
    return f"{user_id}:{backend_url}"


def _get_circuit(user_id: int, backend_url: str) -> _Circuit:
    """Get or create a circuit for the given user+backend pair."""
    key = _get_key(user_id, backend_url)
    with _lock:
        if key not in _circuits:
            _circuits[key] = _Circuit()
        circuit = _circuits[key]
        circuit.last_activity = time.time()
        return circuit


def check_circuit(user_id: int, backend_url: str) -> str:
    """
    Check the circuit state for a user's backend.

    Returns one of "CLOSED", "OPEN", or "HALF_OPEN".

    This should be called before forwarding a request. If the result is "OPEN",
    the caller should reject the request (or fall back to mocks).
    """
    circuit = _get_circuit(user_id, backend_url)

    with _lock:
        if circuit.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            if circuit.opened_at and (time.time() - circuit.opened_at) >= RECOVERY_TIMEOUT_SEC:
                circuit.state = CircuitState.HALF_OPEN
                return CircuitState.HALF_OPEN.value
            return CircuitState.OPEN.value

        elif circuit.state == CircuitState.HALF_OPEN:
            return CircuitState.HALF_OPEN.value

        # CLOSED — prune old failure timestamps
        now = time.time()
        circuit.failure_times = [t for t in circuit.failure_times if now - t < FAILURE_WINDOW_SEC]
        return CircuitState.CLOSED.value


def record_success(user_id: int, backend_url: str) -> None:
    """Record a successful request — reset failure tracking and close circuit if HALF_OPEN."""
    circuit = _get_circuit(user_id, backend_url)

    with _lock:
        circuit.failure_times.clear()
        circuit.last_failure_time = None

        if circuit.state in (CircuitState.OPEN, CircuitState.HALF_OPEN):
            circuit.state = CircuitState.CLOSED
            circuit.opened_at = None

    # Send Slack/Discord integration alert for circuit close (no backend URL in external messages)
    try:
        from integrations import send_integration_alert
        send_integration_alert(user_id, "circuit_breaker_closed", {
            "State": "CLOSED",
        })
    except Exception as e:
        logger.debug(f"Failed to send circuit close integration alert: {e}")


def record_failure(user_id: int, backend_url: str) -> None:
    """Record a failed request — may open the circuit if threshold is reached."""
    circuit = _get_circuit(user_id, backend_url)
    now = time.time()
    newly_opened = False

    with _lock:
        circuit.failure_times.append(now)
        circuit.last_failure_time = now

        # Prune old failures outside the window
        circuit.failure_times = [t for t in circuit.failure_times if now - t < FAILURE_WINDOW_SEC]

        if circuit.state == CircuitState.HALF_OPEN:
            # Single failure in HALF_OPEN re-opens the circuit
            circuit.state = CircuitState.OPEN
            circuit.opened_at = now
            newly_opened = True
            return

        if circuit.state == CircuitState.CLOSED:
            if len(circuit.failure_times) >= FAILURE_THRESHOLD:
                circuit.state = CircuitState.OPEN
                circuit.opened_at = now
                newly_opened = True

    # Send Slack/Discord integration alert for circuit open (no backend URL in external messages)
    if newly_opened:
        try:
            from integrations import send_integration_alert
            send_integration_alert(user_id, "circuit_breaker_open", {
                "State": "OPEN",
                "Failure Count": str(len(circuit.failure_times)),
            })
        except Exception as e:
            logger.debug(f"Failed to send circuit open integration alert: {e}")


def get_all_circuit_states() -> dict:
    """Return a summary of all circuit breaker states (for monitoring)."""
    with _lock:
        result = {}
        for key, circuit in _circuits.items():
            result[key] = {
                "state": circuit.state.value,
                "failure_count": len(circuit.failure_times),
                "last_failure": circuit.last_failure_time,
                "opened_at": circuit.opened_at,
            }
        return result


def cleanup_stale_circuits() -> None:
    """Remove circuits that have been inactive for STALE_ENTRY_SEC seconds."""
    now = time.time()
    with _lock:
        stale_keys = [
            key for key, circuit in _circuits.items()
            if now - circuit.last_activity > STALE_ENTRY_SEC
        ]
        for key in stale_keys:
            del _circuits[key]
