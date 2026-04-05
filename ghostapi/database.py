import sqlite3
import json
import threading
import time
import csv
import io
from typing import Optional
from contextlib import contextmanager

from .models import RequestLog, Alert, request_log_from_row, alert_from_row
from .config import config


class Database:
    _instance: Optional["Database"] = None
    _lock = threading.Lock()

    def __new__(cls, db_path: Optional[str] = None) -> "Database":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, db_path: Optional[str] = None) -> None:
        if self._initialized:
            return
        self._db_path = db_path or config.db_path
        self._write_lock = threading.Lock()
        self._init_db()
        self._migrate_db()
        self._initialized = True

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path, timeout=5.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    @contextmanager
    def _transaction(self):
        conn = self._get_conn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._transaction() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method TEXT NOT NULL,
                    path TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    latency REAL NOT NULL,
                    ip TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    response_size INTEGER NOT NULL DEFAULT 0
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_requests_timestamp
                ON requests(timestamp)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_requests_path
                ON requests(path)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_requests_status_code
                ON requests(status_code)
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    details TEXT NOT NULL DEFAULT '{}'
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_timestamp
                ON alerts(timestamp)
            """)

    def _migrate_db(self) -> None:
        with self._transaction() as conn:
            cols = [
                r["name"] for r in conn.execute("PRAGMA table_info(requests)").fetchall()
            ]
            if "headers" not in cols:
                conn.execute("ALTER TABLE requests ADD COLUMN headers TEXT NOT NULL DEFAULT ''")
            if "query_params" not in cols:
                conn.execute("ALTER TABLE requests ADD COLUMN query_params TEXT NOT NULL DEFAULT ''")
            if "request_body" not in cols:
                conn.execute("ALTER TABLE requests ADD COLUMN request_body TEXT NOT NULL DEFAULT ''")

    def insert_request_log(self, log: RequestLog) -> int:
        with self._write_lock:
            with self._transaction() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO requests (method, path, status_code, latency, ip, timestamp, response_size, headers, query_params, request_body)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        log.method,
                        log.path,
                        log.status_code,
                        log.latency,
                        log.ip,
                        log.timestamp,
                        log.response_size,
                        log.headers,
                        log.query_params,
                        log.request_body,
                    ),
                )
                return cursor.lastrowid

    def insert_alert(self, alert: Alert) -> int:
        with self._write_lock:
            with self._transaction() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO alerts (alert_type, message, severity, timestamp, details)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        alert.alert_type,
                        alert.message,
                        alert.severity,
                        alert.timestamp,
                        json.dumps(alert.details),
                    ),
                )
                return cursor.lastrowid

    def get_request_by_id(self, request_id: int) -> Optional[RequestLog]:
        with self._transaction() as conn:
            row = conn.execute(
                """
                SELECT id, method, path, status_code, latency, ip, timestamp, response_size, headers, query_params, request_body
                FROM requests
                WHERE id = ?
                """,
                (request_id,),
            ).fetchone()
            if row:
                return request_log_from_row(tuple(row))
            return None

    def get_recent_requests(self, limit: int = 50) -> list[RequestLog]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT id, method, path, status_code, latency, ip, timestamp, response_size, headers, query_params, request_body
                FROM requests
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [request_log_from_row(tuple(row)) for row in rows]

    def get_export_requests(self, limit: int = 1000) -> list[RequestLog]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT id, method, path, status_code, latency, ip, timestamp, response_size, headers, query_params, request_body
                FROM requests
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [request_log_from_row(tuple(row)) for row in rows]

    def get_total_count(self) -> int:
        with self._transaction() as conn:
            row = conn.execute("SELECT COUNT(*) FROM requests").fetchone()
            return row[0] if row else 0

    def get_requests_per_minute(self, last_n_minutes: int = 5) -> float:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - last_n_minutes * 60),
        )
        with self._transaction() as conn:
            row = conn.execute(
                """
                SELECT COUNT(*) FROM requests
                WHERE timestamp >= ?
                """,
                (cutoff,),
            ).fetchone()
            count = row[0] if row else 0
            return round(count / last_n_minutes, 2)

    def get_top_endpoints(self, limit: int = 10) -> list[dict]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT path, method, COUNT(*) as count, AVG(latency) as avg_latency
                FROM requests
                GROUP BY path, method
                ORDER BY count DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [
                {
                    "path": row["path"],
                    "method": row["method"],
                    "count": row["count"],
                    "avg_latency": round(row["avg_latency"], 2),
                }
                for row in rows
            ]

    def get_slowest_endpoints(self, limit: int = 10) -> list[dict]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT path, method, AVG(latency) as avg_latency, COUNT(*) as count
                FROM requests
                GROUP BY path, method
                HAVING count >= 1
                ORDER BY avg_latency DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [
                {
                    "path": row["path"],
                    "method": row["method"],
                    "avg_latency": round(row["avg_latency"], 2),
                    "count": row["count"],
                }
                for row in rows
            ]

    def get_latency_distribution(self, limit: int = 20) -> list[dict]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT
                    path || ' (' || method || ')' as endpoint,
                    SUM(CASE WHEN latency <= 100 THEN 1 ELSE 0 END) as bucket_0_100,
                    SUM(CASE WHEN latency > 100 AND latency <= 300 THEN 1 ELSE 0 END) as bucket_100_300,
                    SUM(CASE WHEN latency > 300 AND latency <= 500 THEN 1 ELSE 0 END) as bucket_300_500,
                    SUM(CASE WHEN latency > 500 THEN 1 ELSE 0 END) as bucket_500_plus,
                    COUNT(*) as total
                FROM requests
                GROUP BY path, method
                HAVING total >= 1
                ORDER BY total DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            return [
                {
                    "endpoint": row["endpoint"],
                    "0-100ms": row["bucket_0_100"],
                    "100-300ms": row["bucket_100_300"],
                    "300-500ms": row["bucket_300_500"],
                    "500ms+": row["bucket_500_plus"],
                    "total": row["total"],
                }
                for row in rows
            ]

    def get_error_rate(self, last_n_minutes: int = 5) -> float:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - last_n_minutes * 60),
        )
        with self._transaction() as conn:
            total_row = conn.execute(
                "SELECT COUNT(*) FROM requests WHERE timestamp >= ?",
                (cutoff,),
            ).fetchone()
            error_row = conn.execute(
                "SELECT COUNT(*) FROM requests WHERE timestamp >= ? AND status_code >= 400",
                (cutoff,),
            ).fetchone()
            total = total_row[0] if total_row else 0
            errors = error_row[0] if error_row else 0
            if total == 0:
                return 0.0
            return round((errors / total) * 100, 2)

    def get_slow_requests(self, threshold_ms: float = 500.0, limit: int = 10) -> list[dict]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT path, method, latency, timestamp, ip
                FROM requests
                WHERE latency > ?
                ORDER BY latency DESC
                LIMIT ?
                """,
                (threshold_ms, limit),
            ).fetchall()
            return [
                {
                    "path": row["path"],
                    "method": row["method"],
                    "latency": round(row["latency"], 2),
                    "timestamp": row["timestamp"],
                    "ip": row["ip"],
                }
                for row in rows
            ]

    def get_status_distribution(self) -> dict:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT
                    CASE
                        WHEN status_code >= 200 AND status_code < 300 THEN '2xx'
                        WHEN status_code >= 300 AND status_code < 400 THEN '3xx'
                        WHEN status_code >= 400 AND status_code < 500 THEN '4xx'
                        WHEN status_code >= 500 THEN '5xx'
                        ELSE 'other'
                    END as category,
                    COUNT(*) as count
                FROM requests
                GROUP BY category
                """
            ).fetchall()
            return {row["category"]: row["count"] for row in rows}

    def get_avg_latency(self, last_n_minutes: int = 5) -> float:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - last_n_minutes * 60),
        )
        with self._transaction() as conn:
            row = conn.execute(
                """
                SELECT AVG(latency) FROM requests
                WHERE timestamp >= ?
                """,
                (cutoff,),
            ).fetchone()
            return round(row[0], 2) if row and row[0] else 0.0

    def get_requests_by_ip(self, window_seconds: int = 60) -> list[dict]:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - window_seconds),
        )
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT ip, COUNT(*) as count
                FROM requests
                WHERE timestamp >= ?
                GROUP BY ip
                HAVING count > 1
                ORDER BY count DESC
                """,
                (cutoff,),
            ).fetchall()
            return [{"ip": row["ip"], "count": row["count"]} for row in rows]

    def get_error_count_in_window(self, window_seconds: int = 60) -> int:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - window_seconds),
        )
        with self._transaction() as conn:
            row = conn.execute(
                """
                SELECT COUNT(*) FROM requests
                WHERE timestamp >= ? AND status_code >= 500
                """,
                (cutoff,),
            ).fetchone()
            return row[0] if row else 0

    def get_recent_alerts(self, limit: int = 20) -> list[Alert]:
        with self._transaction() as conn:
            rows = conn.execute(
                """
                SELECT id, alert_type, message, severity, timestamp, details
                FROM alerts
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
            results = []
            for row in rows:
                data = {
                    "id": row["id"],
                    "alert_type": row["alert_type"],
                    "message": row["message"],
                    "severity": row["severity"],
                    "timestamp": row["timestamp"],
                    "details": json.loads(row["details"]),
                }
                results.append(Alert(**data))
            return results

    def get_requests_timeline(self, last_n_minutes: int = 30, bucket_minutes: int = 1) -> list[dict]:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - last_n_minutes * 60),
        )
        with self._transaction() as conn:
            rows = conn.execute(
                f"""
                SELECT
                    strftime('%Y-%m-%dT%H:%M', timestamp) || ':' ||
                    printf('%02d', (CAST(strftime('%M', timestamp) AS INTEGER) / {bucket_minutes}) * {bucket_minutes})
                    as bucket,
                    COUNT(*) as count
                FROM requests
                WHERE timestamp >= ?
                GROUP BY bucket
                ORDER BY bucket ASC
                """,
                (cutoff,),
            ).fetchall()
            return [{"time": row["bucket"], "count": row["count"]} for row in rows]

    def cleanup_old_records(self, max_age_hours: int = 24) -> int:
        cutoff = time.strftime(
            "%Y-%m-%dT%H:%M:%S",
            time.gmtime(time.time() - max_age_hours * 3600),
        )
        with self._write_lock:
            with self._transaction() as conn:
                cursor = conn.execute(
                    "DELETE FROM requests WHERE timestamp < ?",
                    (cutoff,),
                )
                cursor2 = conn.execute(
                    "DELETE FROM alerts WHERE timestamp < ?",
                    (cutoff,),
                )
                return cursor.rowcount + cursor2.rowcount


def get_db() -> Database:
    return Database()
