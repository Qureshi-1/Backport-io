import time
import threading
from datetime import datetime, timezone
from typing import Optional

from .config import config
from .database import get_db
from .models import Alert


class AnalyticsEngine:
    def __init__(self):
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._check_interval = 10

    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._check_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5.0)

    def _check_loop(self):
        while self._running:
            try:
                self._detect_rate_limit_abuse()
                self._detect_429_threshold()
                self._detect_500_spikes()
                self._detect_slow_endpoints()
            except Exception:
                pass
            time.sleep(self._check_interval)

    def _create_alert(self, alert_type: str, message: str, severity: str, details: dict) -> None:
        db = get_db()
        alert = Alert(
            alert_type=alert_type,
            message=message,
            severity=severity,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
            details=details,
        )
        try:
            db.insert_alert(alert)
        except Exception:
            pass

    def _detect_rate_limit_abuse(self):
        db = get_db()
        ip_requests = db.get_requests_by_ip(window_seconds=config.rate_limit_window)
        for item in ip_requests:
            if item["count"] >= config.rate_limit_threshold:
                self._create_alert(
                    alert_type="rate_limit_abuse",
                    message=f"IP {item['ip']} made {item['count']} requests in {config.rate_limit_window}s window",
                    severity="high",
                    details={"ip": item["ip"], "count": item["count"], "window": config.rate_limit_window},
                )

    def _detect_429_threshold(self):
        db = get_db()
        recent = db.get_recent_requests(limit=20)
        count_429 = sum(1 for r in recent if r.status_code == 429)
        if count_429 >= 3:
            self._create_alert(
                alert_type="429_threshold",
                message=f"Detected {count_429} 429 responses in recent requests - upstream rate limiting active",
                severity="medium",
                details={"count_429": count_429, "window": "recent 20 requests"},
            )

    def _detect_500_spikes(self):
        db = get_db()
        error_count = db.get_error_count_in_window(window_seconds=config.error_spike_window)
        if error_count >= config.error_spike_threshold:
            self._create_alert(
                alert_type="500_spike",
                message=f"Detected {error_count} server errors in {config.error_spike_window}s - possible upstream degradation",
                severity="critical",
                details={"error_count": error_count, "window": config.error_spike_window},
            )

    def _detect_slow_endpoints(self):
        db = get_db()
        slow = db.get_slow_requests(threshold_ms=config.slow_threshold_ms, limit=5)
        if slow:
            for s in slow:
                self._create_alert(
                    alert_type="slow_endpoint",
                    message=f"Slow endpoint detected: {s['method']} {s['path']} took {s['latency']}ms",
                    severity="warning",
                    details={
                        "method": s["method"],
                        "path": s["path"],
                        "latency": s["latency"],
                        "ip": s["ip"],
                    },
                )

    def get_stats(self):
        db = get_db()
        alerts = db.get_recent_alerts(limit=10)
        return {
            "total_requests": db.get_total_count(),
            "requests_per_minute": db.get_requests_per_minute(last_n_minutes=5),
            "top_endpoints": db.get_top_endpoints(limit=10),
            "error_rate": db.get_error_rate(last_n_minutes=5),
            "slow_requests": db.get_slow_requests(threshold_ms=config.slow_threshold_ms, limit=10),
            "status_distribution": db.get_status_distribution(),
            "avg_latency": db.get_avg_latency(last_n_minutes=5),
            "alerts": [a.to_dict() for a in alerts],
            "timeline": db.get_requests_timeline(last_n_minutes=30, bucket_minutes=1),
        }

    def get_slowest_endpoints(self):
        db = get_db()
        return db.get_slowest_endpoints(limit=10)

    def get_latency_distribution(self):
        db = get_db()
        return db.get_latency_distribution(limit=20)
