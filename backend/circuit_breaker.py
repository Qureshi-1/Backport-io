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

    __slots__ = ("state", "failure_times", "last_failure_time", "opened_at", "last_activity",
                 "config", "success_count", "failure_count", "total_count",
                 "sliding_window", "half_open_requests")

    def __init__(self):
        self.state: CircuitState = CircuitState.CLOSED
        self.failure_times: list[float] = []  # Timestamps of recent failures
        self.last_failure_time: Optional[float] = None
        self.opened_at: Optional[float] = None
        self.last_activity: float = time.time()
        # Configurable thresholds (can be overridden per-circuit)
        self.config: dict = {
            "failure_threshold": FAILURE_THRESHOLD,
            "recovery_timeout": RECOVERY_TIMEOUT_SEC,
            "half_open_max_requests": 1,
            "failure_window_sec": FAILURE_WINDOW_SEC,
            "sliding_window_size": 100,  # Last N requests for sliding window
        }
        # Metrics counters
        self.success_count: int = 0
        self.failure_count: int = 0
        self.total_count: int = 0
        # Sliding window: last N request outcomes (True=success, False=failure)
        self.sliding_window: list[bool] = []
        # Track half-open probe requests
        self.half_open_requests: int = 0


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
            recovery_timeout = circuit.config.get("recovery_timeout", RECOVERY_TIMEOUT_SEC)
            # Check if recovery timeout has elapsed
            if circuit.opened_at and (time.time() - circuit.opened_at) >= recovery_timeout:
                circuit.state = CircuitState.HALF_OPEN
                circuit.half_open_requests = 0
                return CircuitState.HALF_OPEN.value
            return CircuitState.OPEN.value

        elif circuit.state == CircuitState.HALF_OPEN:
            # Check if we've exceeded half-open max requests
            half_open_max = circuit.config.get("half_open_max_requests", 1)
            if circuit.half_open_requests >= half_open_max:
                return CircuitState.OPEN.value
            return CircuitState.HALF_OPEN.value

        # CLOSED — prune old failure timestamps
        now = time.time()
        window = circuit.config.get("failure_window_sec", FAILURE_WINDOW_SEC)
        circuit.failure_times = [t for t in circuit.failure_times if now - t < window]
        return CircuitState.CLOSED.value


def record_success(user_id: int, backend_url: str) -> None:
    """Record a successful request — reset failure tracking and close circuit if HALF_OPEN."""
    circuit = _get_circuit(user_id, backend_url)

    with _lock:
        circuit.failure_times.clear()
        circuit.last_failure_time = None
        circuit.success_count += 1
        circuit.total_count += 1

        # Update sliding window
        window_size = circuit.config.get("sliding_window_size", 100)
        circuit.sliding_window.append(True)
        if len(circuit.sliding_window) > window_size:
            circuit.sliding_window = circuit.sliding_window[-window_size:]

        if circuit.state in (CircuitState.OPEN, CircuitState.HALF_OPEN):
            circuit.state = CircuitState.CLOSED
            circuit.opened_at = None
            circuit.half_open_requests = 0

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
        circuit.failure_count += 1
        circuit.total_count += 1

        # Update sliding window
        window_size = circuit.config.get("sliding_window_size", 100)
        circuit.sliding_window.append(False)
        if len(circuit.sliding_window) > window_size:
            circuit.sliding_window = circuit.sliding_window[-window_size:]

        # Prune old failures outside the window
        window = circuit.config.get("failure_window_sec", FAILURE_WINDOW_SEC)
        circuit.failure_times = [t for t in circuit.failure_times if now - t < window]

        threshold = circuit.config.get("failure_threshold", FAILURE_THRESHOLD)

        if circuit.state == CircuitState.HALF_OPEN:
            circuit.half_open_requests += 1
            # Any failure in HALF_OPEN re-opens the circuit
            circuit.state = CircuitState.OPEN
            circuit.opened_at = now
            newly_opened = True
            return

        if circuit.state == CircuitState.CLOSED:
            if len(circuit.failure_times) >= threshold:
                circuit.state = CircuitState.OPEN
                circuit.opened_at = now
                newly_opened = True

        # Sliding window check: if failure rate in last N requests exceeds 50%, open circuit
        if circuit.state == CircuitState.CLOSED and len(circuit.sliding_window) >= 10:
            recent_failures = sum(1 for r in circuit.sliding_window if not r)
            recent_total = len(circuit.sliding_window)
            if recent_failures / recent_total >= 0.5 and recent_failures >= threshold:
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
                "success_count": circuit.success_count,
                "failure_total": circuit.failure_count,
                "total_requests": circuit.total_count,
                "sliding_window_size": len(circuit.sliding_window),
                "config": circuit.config,
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


# ─── Enhanced: Configure circuit per user+backend ──────────────────────────────

def configure_circuit(user_id: int, backend_url: str, **kwargs) -> dict:
    """
    Configure custom thresholds for a specific circuit.

    Accepted keyword arguments:
        - ``failure_threshold`` (int): Number of failures to open circuit. Default: 5
        - ``recovery_timeout`` (int): Seconds before OPEN → HALF_OPEN. Default: 60
        - ``half_open_max_requests`` (int): Max probe requests in HALF_OPEN. Default: 1
        - ``failure_window_sec`` (int): Time window for counting failures. Default: 30
        - ``sliding_window_size`` (int): Size of sliding window for failure rate. Default: 100

    Returns the updated circuit configuration.
    """
    circuit = _get_circuit(user_id, backend_url)

    valid_keys = {"failure_threshold", "recovery_timeout", "half_open_max_requests",
                  "failure_window_sec", "sliding_window_size"}

    with _lock:
        for key, value in kwargs.items():
            if key in valid_keys:
                circuit.config[key] = value

        return dict(circuit.config)


def get_circuit_metrics(user_id: int, backend_url: str) -> dict:
    """
    Get detailed metrics for a specific circuit.

    Returns:
        dict with circuit state, counters, sliding window stats, and config.
    """
    circuit = _get_circuit(user_id, backend_url)

    with _lock:
        sliding_failures = sum(1 for r in circuit.sliding_window if not r)
        sliding_total = len(circuit.sliding_window)
        sliding_successes = sliding_total - sliding_failures

        return {
            "state": circuit.state.value,
            "success_count": circuit.success_count,
            "failure_count": circuit.failure_count,
            "total_requests": circuit.total_count,
            "success_rate": round(sliding_successes / sliding_total * 100, 2) if sliding_total > 0 else 100.0,
            "sliding_window": {
                "size": sliding_total,
                "successes": sliding_successes,
                "failures": sliding_failures,
                "failure_rate_pct": round(sliding_failures / sliding_total * 100, 2) if sliding_total > 0 else 0.0,
            },
            "time_window": {
                "failure_count": len(circuit.failure_times),
                "last_failure": circuit.last_failure_time,
                "opened_at": circuit.opened_at,
            },
            "config": dict(circuit.config),
        }

