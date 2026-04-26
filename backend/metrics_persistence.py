"""
Metrics persistence with pluggable backends.

Supports three storage backends:
    - InMemory: Default. Stores metrics in a thread-safe list with automatic pruning.
    - Redis: Stores recent metrics in a Redis list with TTL.
    - LogFile: Writes JSON lines to ``logs/metrics.jsonl`` with rotation at 10MB.

Usage:
    from metrics_persistence import metrics_store
    metrics_store.persist_request({"method": "GET", "path": "/api", "status": 200, "latency_ms": 42})
    recent = metrics_store.get_metrics(minutes=5)
    summary = metrics_store.get_hourly_summary()
"""

import json
import os
import time
import threading
import logging
from abc import ABC, abstractmethod
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Configuration ──────────────────────────────────────────────────────────

LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
METRICS_LOG_FILE = os.path.join(LOG_DIR, "metrics.jsonl")
MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024  # 10MB rotation threshold
MAX_IN_MEMORY_ENTRIES = 100_000
PRUNE_INTERVAL_SECONDS = 300  # 5 minutes


# ─── Abstract Backend ───────────────────────────────────────────────────────

class MetricsBackend(ABC):
    """Abstract base class for metrics storage backends."""

    @abstractmethod
    def persist(self, metric: dict) -> None:
        """Store a single metric entry."""
        ...

    @abstractmethod
    def get_recent(self, minutes: int) -> list[dict]:
        """Return metrics from the last *minutes* minutes."""
        ...


# ─── In-Memory Backend ──────────────────────────────────────────────────────

class InMemoryMetricsBackend(MetricsBackend):
    """Thread-safe in-memory metrics store with automatic pruning."""

    def __init__(self, max_entries: int = MAX_IN_MEMORY_ENTRIES):
        self._metrics: list[dict] = []
        self._lock = threading.Lock()
        self._max_entries = max_entries
        self._last_prune = time.time()

    def persist(self, metric: dict) -> None:
        entry = {
            **metric,
            "_timestamp": time.time(),
            "_datetime": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            self._metrics.append(entry)
            # Auto-prune if too large
            if len(self._metrics) > self._max_entries:
                self._metrics = self._metrics[-(self._max_entries // 2):]
            # Periodic time-based prune
            now = time.time()
            if now - self._last_prune > PRUNE_INTERVAL_SECONDS:
                cutoff = now - 3600  # Keep last 1 hour
                self._metrics = [m for m in self._metrics if m.get("_timestamp", 0) > cutoff]
                self._last_prune = now

    def get_recent(self, minutes: int) -> list[dict]:
        cutoff = time.time() - (minutes * 60)
        with self._lock:
            return [m for m in self._metrics if m.get("_timestamp", 0) > cutoff]


# ─── Redis Backend ──────────────────────────────────────────────────────────

class RedisMetricsBackend(MetricsBackend):
    """Redis-backed metrics store using a list with automatic trimming."""

    def __init__(self, redis_url: Optional[str] = None):
        self._redis = None
        self._connected = False
        self._key_prefix = "backport:metrics:"

        try:
            import redis as redis_lib
            url = redis_url or os.getenv("REDIS_URL", "")
            if url:
                self._redis = redis_lib.from_url(
                    url,
                    decode_responses=True,
                    socket_timeout=5,
                )
                self._redis.ping()
                self._connected = True
                logger.info("MetricsStore: connected to Redis")
        except Exception as e:
            logger.warning(f"MetricsStore: Redis unavailable ({e}), falling back to in-memory")

    @property
    def connected(self) -> bool:
        return self._connected

    def persist(self, metric: dict) -> None:
        if not self._redis:
            return
        try:
            entry = {
                **metric,
                "_timestamp": time.time(),
                "_datetime": datetime.now(timezone.utc).isoformat(),
            }
            self._redis.lpush(self._key_prefix + "recent", json.dumps(entry))
            # Keep only last 10000 entries
            self._redis.ltrim(self._key_prefix + "recent", 0, 9999)
            # Set expiry on the key (1 hour)
            self._redis.expire(self._key_prefix + "recent", 3600)
        except Exception as e:
            logger.warning(f"MetricsStore: Redis persist error: {e}")

    def get_recent(self, minutes: int) -> list[dict]:
        if not self._redis:
            return []
        try:
            cutoff = time.time() - (minutes * 60)
            raw_entries = self._redis.lrange(self._key_prefix + "recent", 0, -1)
            results = []
            for raw in raw_entries:
                try:
                    entry = json.loads(raw)
                    if entry.get("_timestamp", 0) > cutoff:
                        results.append(entry)
                except (json.JSONDecodeError, TypeError):
                    continue
            return results
        except Exception as e:
            logger.warning(f"MetricsStore: Redis get_recent error: {e}")
            return []


# ─── Log File Backend ───────────────────────────────────────────────────────

class LogFileMetricsBackend(MetricsBackend):
    """File-based metrics backend that writes JSON lines with rotation."""

    def __init__(self, log_file: Optional[str] = None, max_size: int = MAX_LOG_SIZE_BYTES):
        self._log_file = log_file or METRICS_LOG_FILE
        self._max_size = max_size
        self._lock = threading.Lock()
        self._in_memory_cache: list[dict] = []  # Cache for get_recent queries

        # Ensure log directory exists
        os.makedirs(os.path.dirname(self._log_file), exist_ok=True)

    def _rotate_if_needed(self) -> None:
        """Rotate log file if it exceeds the max size."""
        if not os.path.exists(self._log_file):
            return
        try:
            size = os.path.getsize(self._log_file)
            if size >= self._max_size:
                # Rotate: rename current file, create new one
                rotated = self._log_file + f".{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
                os.rename(self._log_file, rotated)
                logger.info(f"Metrics log rotated: {rotated}")
        except Exception as e:
            logger.warning(f"Metrics log rotation error: {e}")

    def persist(self, metric: dict) -> None:
        entry = {
            **metric,
            "_timestamp": time.time(),
            "_datetime": datetime.now(timezone.utc).isoformat(),
        }
        line = json.dumps(entry, ensure_ascii=False)

        with self._lock:
            self._in_memory_cache.append(entry)
            # Prune cache to last 1 hour
            cutoff = time.time() - 3600
            self._in_memory_cache = [m for m in self._in_memory_cache if m.get("_timestamp", 0) > cutoff]

        try:
            self._rotate_if_needed()
            with open(self._log_file, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        except Exception as e:
            logger.warning(f"Metrics log write error: {e}")

    def get_recent(self, minutes: int) -> list[dict]:
        cutoff = time.time() - (minutes * 60)
        with self._lock:
            return [m for m in self._in_memory_cache if m.get("_timestamp", 0) > cutoff]


# ─── Composite Backend ──────────────────────────────────────────────────────

class CompositeMetricsBackend(MetricsBackend):
    """Writes to multiple backends simultaneously. Reads from the primary."""

    def __init__(self, primary: MetricsBackend, secondaries: Optional[list[MetricsBackend]] = None):
        self._primary = primary
        self._secondaries = secondaries or []

    def persist(self, metric: dict) -> None:
        self._primary.persist(metric)
        for backend in self._secondaries:
            try:
                backend.persist(metric)
            except Exception as e:
                logger.warning(f"Composite backend persist error: {e}")

    def get_recent(self, minutes: int) -> list[dict]:
        return self._primary.get_recent(minutes)


# ─── Metrics Store ──────────────────────────────────────────────────────────

class MetricsStore:
    """
    High-level metrics store with pluggable backends.

    Backends:
        - ``in_memory``: Fast, thread-safe in-memory storage (default).
        - ``redis``: Persistent Redis storage.
        - ``log_file``: Append-only JSON lines file with rotation.
        - ``composite``: Writes to multiple backends.

    The store is configured via the ``METRICS_BACKEND`` environment variable
    (defaults to ``in_memory``).
    """

    def __init__(self, backend: Optional[MetricsBackend] = None):
        if backend is not None:
            self._backend = backend
        else:
            self._backend = self._create_default_backend()

    @staticmethod
    def _create_default_backend() -> MetricsBackend:
        """Create the default backend based on environment configuration."""
        backend_type = os.getenv("METRICS_BACKEND", "in_memory").lower()

        if backend_type == "redis":
            redis_backend = RedisMetricsBackend()
            if redis_backend.connected:
                return redis_backend
            logger.warning("MetricsStore: Redis requested but unavailable, falling back to in-memory")
            return InMemoryMetricsBackend()

        elif backend_type == "log_file":
            log_backend = LogFileMetricsBackend()
            return log_backend

        elif backend_type == "composite":
            # Write to memory (for fast reads) and log file (for persistence)
            memory = InMemoryMetricsBackend()
            log_file = LogFileMetricsBackend()
            secondaries = [log_file]
            # Try adding Redis too
            try:
                redis_backend = RedisMetricsBackend()
                if redis_backend.connected:
                    secondaries.append(redis_backend)
            except Exception:
                pass
            return CompositeMetricsBackend(primary=memory, secondaries=secondaries)

        else:
            return InMemoryMetricsBackend()

    def persist_request(self, metric: dict) -> None:
        """Persist a single request metric.

        Expected metric keys (at minimum):
            - ``method`` (str): HTTP method.
            - ``path`` (str): Request path.
            - ``status_code`` (int): HTTP status code.
            - ``latency_ms`` (int): Response latency in milliseconds.
        """
        try:
            self._backend.persist(metric)
        except Exception as e:
            logger.warning(f"MetricsStore: persist error: {e}")

    def get_metrics(self, minutes: int = 5) -> list[dict]:
        """Get metrics from the last *minutes* minutes."""
        try:
            return self._backend.get_recent(minutes)
        except Exception as e:
            logger.warning(f"MetricsStore: get_metrics error: {e}")
            return []

    def get_hourly_summary(self) -> dict:
        """Return aggregated statistics for the last hour.

        Returns a dict with:
            - ``total_requests`` (int)
            - ``success_count`` (int): Status < 400
            - ``error_count`` (int): Status >= 400
            - ``avg_latency_ms`` (float)
            - ``requests_by_method`` (dict): {GET: n, POST: n, ...}
            - ``requests_by_status_code`` (dict): {200: n, 404: n, ...}
            - ``top_paths`` (list): Top 10 most-hit paths with counts.
            - ``error_rate_pct`` (float): Error percentage.
            - ``p50_latency_ms`` (int)
            - ``p95_latency_ms`` (int)
            - ``p99_latency_ms`` (int)
        """
        metrics = self.get_metrics(minutes=60)
        if not metrics:
            return {
                "total_requests": 0,
                "success_count": 0,
                "error_count": 0,
                "avg_latency_ms": 0,
                "requests_by_method": {},
                "requests_by_status_code": {},
                "top_paths": [],
                "error_rate_pct": 0,
                "p50_latency_ms": 0,
                "p95_latency_ms": 0,
                "p99_latency_ms": 0,
            }

        total = len(metrics)
        success_count = 0
        error_count = 0
        latencies: list[int] = []
        method_counts: dict[str, int] = defaultdict(int)
        status_counts: dict[int, int] = defaultdict(int)
        path_counts: dict[str, int] = defaultdict(int)

        for m in metrics:
            status = m.get("status_code", 0)
            if status < 400:
                success_count += 1
            else:
                error_count += 1

            latency = m.get("latency_ms", 0)
            if isinstance(latency, (int, float)):
                latencies.append(int(latency))

            method = m.get("method", "UNKNOWN")
            method_counts[method] += 1

            status_counts[status] += 1

            path = m.get("path", "/")
            path_counts[path] += 1

        # Calculate percentiles
        latencies.sort()
        p50 = latencies[len(latencies) // 2] if latencies else 0
        p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
        p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        # Top paths
        top_paths = sorted(path_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_requests": total,
            "success_count": success_count,
            "error_count": error_count,
            "avg_latency_ms": round(avg_latency, 2),
            "requests_by_method": dict(method_counts),
            "requests_by_status_code": {str(k): v for k, v in status_counts.items()},
            "top_paths": [{"path": p, "count": c} for p, c in top_paths],
            "error_rate_pct": round((error_count / total * 100), 2) if total > 0 else 0,
            "p50_latency_ms": p50,
            "p95_latency_ms": p95,
            "p99_latency_ms": p99,
        }


# ─── Global Singleton ───────────────────────────────────────────────────────

metrics_store = MetricsStore()
