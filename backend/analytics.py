import time
import threading
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, text

logger = logging.getLogger("backport")

class AnalyticsEngine:
    def __init__(self):
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._check_interval = 10  # seconds
        self._docs_counter = 0  # Track iterations for 5-minute docs generation
        
    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._check_loop, daemon=True)
        self._thread.start()
        logger.info("Analytics engine started")
        
    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5.0)
            
    def _check_loop(self):
        while self._running:
            try:
                self._detect_rate_limit_abuse()
                self._detect_waf_spike()
                self._detect_error_spike()
                self._detect_slow_endpoints()
                self._docs_counter += 1
                # Generate API docs every 30 iterations (~5 minutes at 10s interval)
                if self._docs_counter >= 30:
                    self._docs_counter = 0
                    self._generate_api_docs()
            except Exception as e:
                logger.error(f"Analytics check error: {e}")
            time.sleep(self._check_interval)
    
    def _create_alert(self, db: Session, user_id: int, alert_type: str, message: str, severity: str, details: dict):
        try:
            from models import Alert
            alert = Alert(
                user_id=user_id,
                alert_type=alert_type,
                message=message,
                severity=severity,
                timestamp=datetime.now(timezone.utc),
                details=json.dumps(details) if details else "{}"
            )
            db.add(alert)
            db.commit()

            # Broadcast alert via WebSocket
            try:
                from ws import manager
                manager.broadcast_from_thread(user_id, {
                    "type": "alert",
                    "alert_type": alert_type,
                    "message": message,
                    "severity": severity,
                    "details": details or {},
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            except Exception as e:
                logger.debug(f"WebSocket broadcast from alert failed: {e}")

            # Send Slack/Discord integration alert
            try:
                from integrations import send_integration_alert
                # Map alert_type to integration event_type
                event_map = {
                    "error_spike": "error_spike",
                    "slow_endpoint": "slow_endpoint",
                    "rate_limit_abuse": "rate_limit_exceeded",
                    "waf_spike": "waf_block",
                }
                integration_event = event_map.get(alert_type)
                if integration_event and details:
                    send_integration_alert(user_id, integration_event, {
                        k.replace("_", " ").title(): str(v) for k, v in details.items()
                    })
            except Exception as e:
                logger.debug(f"Failed to send integration alert for alert type {alert_type}: {e}")
        except Exception as e:
            logger.error(f"Failed to save alert: {e}")
    
    def _detect_rate_limit_abuse(self):
        from database import SessionLocal
        from models import ApiLog
        db = SessionLocal()
        try:
            fifteen_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
            # Group by user_id and count 429s
            results = db.query(
                ApiLog.user_id,
                func.count(ApiLog.id).label('count')
            ).filter(
                ApiLog.status_code == 429,
                ApiLog.created_at >= fifteen_mins_ago
            ).group_by(ApiLog.user_id).all()
            
            for user_id, count in results:
                if count >= 10:
                    self._create_alert(
                        db, user_id,
                        alert_type="rate_limit_abuse",
                        message=f"High rate limit hits: {count} in 15 minutes",
                        severity="high",
                        details={"count": count, "window": "15min"}
                    )
        except Exception as e:
            logger.error(f"Rate limit detection error: {e}")
        finally:
            db.close()
    
    def _detect_waf_spike(self):
        from database import SessionLocal
        from models import ApiLog
        db = SessionLocal()
        try:
            five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
            results = db.query(
                ApiLog.user_id,
                func.count(ApiLog.id).label('count')
            ).filter(
                ApiLog.status_code == 403,
                ApiLog.created_at >= five_mins_ago
            ).group_by(ApiLog.user_id).all()
            
            for user_id, count in results:
                if count >= 5:
                    self._create_alert(
                        db, user_id,
                        alert_type="waf_spike",
                        message=f"WAF blocking spike: {count} blocked in 5 minutes",
                        severity="critical",
                        details={"count": count, "window": "5min"}
                    )
        except Exception as e:
            logger.error(f"WAF spike detection error: {e}")
        finally:
            db.close()
    
    def _detect_error_spike(self):
        from database import SessionLocal
        from models import ApiLog
        db = SessionLocal()
        try:
            five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
            results = db.query(
                ApiLog.user_id,
                func.count(ApiLog.id).label('count')
            ).filter(
                ApiLog.status_code >= 500,
                ApiLog.created_at >= five_mins_ago
            ).group_by(ApiLog.user_id).all()
            
            for user_id, count in results:
                if count >= 5:
                    self._create_alert(
                        db, user_id,
                        alert_type="error_spike",
                        message=f"Backend error spike: {count} 5xx errors in 5 minutes",
                        severity="critical",
                        details={"count": count, "window": "5min"}
                    )
        except Exception as e:
            logger.error(f"Error spike detection error: {e}")
        finally:
            db.close()
    
    def _detect_slow_endpoints(self):
        from database import SessionLocal
        from models import ApiLog
        db = SessionLocal()
        try:
            five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
            slow_logs = db.query(ApiLog).filter(
                ApiLog.latency_ms > 2000,
                ApiLog.created_at >= five_mins_ago
            ).all()
            
            for log in slow_logs[:3]:  # Limit alerts
                self._create_alert(
                    db, log.user_id,
                    alert_type="slow_endpoint",
                    message=f"Slow endpoint: {log.method} {log.path} took {log.latency_ms}ms",
                    severity="warning",
                    details={"method": log.method, "path": log.path, "latency_ms": log.latency_ms}
                )
        except Exception as e:
            logger.error(f"Slow endpoint detection error: {e}")
        finally:
            db.close()
    
    def _generate_api_docs(self):
        """Scan recent api_logs and update/create ApiEndpoint records."""
        from database import SessionLocal
        from models import ApiLog, ApiEndpoint
        db = SessionLocal()
        try:
            # Look at logs from the last hour
            one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
            logs = db.query(ApiLog).filter(ApiLog.created_at >= one_hour_ago).all()

            # Group by (user_id, method, path)
            groups: Dict[tuple, list] = {}
            for log in logs:
                key = (log.user_id, log.method, log.path)
                if key not in groups:
                    groups[key] = []
                groups[key].append(log)

            for (user_id, method, path), log_entries in groups.items():
                total = len(log_entries)
                success = sum(1 for l in log_entries if l.status_code < 400)
                avg_lat = int(sum(l.latency_ms for l in log_entries) / max(total, 1))
                success_rate = int((success / max(total, 1)) * 100)

                # Collect unique request headers
                all_headers = set()
                latest_req_body = None
                latest_resp_body = None
                latest_time = None

                for log in log_entries:
                    try:
                        if log.request_headers:
                            hdrs = json.loads(log.request_headers)
                            if isinstance(hdrs, dict):
                                all_headers.update(hdrs.keys())
                    except (ValueError, TypeError):
                        pass

                    if log.request_body and method in ["POST", "PUT", "PATCH"]:
                        latest_req_body = log.request_body[:5000]

                    if hasattr(log, 'response_body') and log.response_body:
                        latest_resp_body = log.response_body[:5000]

                    if log.created_at and (latest_time is None or log.created_at > latest_time):
                        latest_time = log.created_at

                # Find or create endpoint record
                existing = db.query(ApiEndpoint).filter(
                    ApiEndpoint.user_id == user_id,
                    ApiEndpoint.method == method,
                    ApiEndpoint.path == path
                ).first()

                if existing:
                    existing.total_requests = total
                    existing.avg_latency_ms = avg_lat
                    existing.success_rate = success_rate
                    existing.last_seen = datetime.now(timezone.utc)
                    if latest_req_body:
                        existing.request_body_example = latest_req_body
                    if latest_resp_body:
                        existing.response_body_example = latest_resp_body
                    existing.request_headers = json.dumps(sorted(list(all_headers)))
                else:
                    ep = ApiEndpoint(
                        user_id=user_id,
                        method=method,
                        path=path,
                        request_headers=json.dumps(sorted(list(all_headers))),
                        request_body_example=latest_req_body,
                        response_body_example=latest_resp_body,
                        avg_latency_ms=avg_lat,
                        total_requests=total,
                        success_rate=success_rate,
                        last_seen=datetime.now(timezone.utc),
                    )
                    db.add(ep)

            db.commit()
            logger.info(f"API docs generation complete: {len(groups)} endpoints updated")
        except Exception as e:
            logger.error(f"API docs generation error: {e}")
            db.rollback()
        finally:
            db.close()

    def get_user_stats(self, db: Session, user_id: int) -> dict:
        from models import ApiLog, Alert
        from sqlalchemy import case
        
        total = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user_id).scalar() or 0
        cached = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user_id, ApiLog.was_cached == True).scalar() or 0
        avg_latency = db.query(func.avg(ApiLog.latency_ms)).filter(ApiLog.user_id == user_id).scalar() or 0
        threats = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user_id, ApiLog.status_code == 403).scalar() or 0
        rate_limited = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user_id, ApiLog.status_code == 429).scalar() or 0
        errors = db.query(func.count(ApiLog.id)).filter(ApiLog.user_id == user_id, ApiLog.status_code >= 500).scalar() or 0
        
        # Status distribution
        status_dist = db.query(
            case(
                (ApiLog.status_code < 300, '2xx'),
                (ApiLog.status_code < 400, '3xx'),
                (ApiLog.status_code < 500, '4xx'),
                else_='5xx'
            ).label('bucket'),
            func.count(ApiLog.id).label('count')
        ).filter(
            ApiLog.user_id == user_id
        ).group_by('bucket').all()
        
        # Slowest endpoints
        slowest = db.query(
            ApiLog.method,
            ApiLog.path,
            func.avg(ApiLog.latency_ms).label('avg_latency'),
            func.count(ApiLog.id).label('count')
        ).filter(
            ApiLog.user_id == user_id,
            ApiLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
        ).group_by(
            ApiLog.method, ApiLog.path
        ).order_by(
            func.avg(ApiLog.latency_ms).desc()
        ).limit(10).all()
        
        # Latency distribution
        latency_buckets = {
            '0-50ms': 0, '50-100ms': 0, '100-250ms': 0,
            '250-500ms': 0, '500ms-1s': 0, '1s+': 0
        }
        recent_logs = db.query(ApiLog.latency_ms).filter(
            ApiLog.user_id == user_id,
            ApiLog.created_at >= datetime.now(timezone.utc) - timedelta(hours=1)
        ).all()
        
        for (lat,) in recent_logs:
            if lat < 50: latency_buckets['0-50ms'] += 1
            elif lat < 100: latency_buckets['50-100ms'] += 1
            elif lat < 250: latency_buckets['100-250ms'] += 1
            elif lat < 500: latency_buckets['250-500ms'] += 1
            elif lat < 1000: latency_buckets['500ms-1s'] += 1
            else: latency_buckets['1s+'] += 1
        
        # Recent alerts
        recent_alerts = db.query(Alert).filter(
            Alert.user_id == user_id
        ).order_by(Alert.created_at.desc()).limit(10).all()
        
        # Traffic timeline (last 15 minutes, per minute)
        now = datetime.now(timezone.utc)
        timeline = []
        for i in range(15):
            bucket_start = now - timedelta(minutes=(14 - i))
            bucket_end = bucket_start + timedelta(minutes=1)
            count = db.query(func.count(ApiLog.id)).filter(
                ApiLog.user_id == user_id,
                ApiLog.created_at >= bucket_start,
                ApiLog.created_at < bucket_end
            ).scalar() or 0
            
            # Also get error count per bucket
            err_count = db.query(func.count(ApiLog.id)).filter(
                ApiLog.user_id == user_id,
                ApiLog.status_code >= 400,
                ApiLog.created_at >= bucket_start,
                ApiLog.created_at < bucket_end
            ).scalar() or 0
            
            timeline.append({
                "time": bucket_start.strftime("%I:%M %p"),
                "requests": count,
                "errors": err_count
            })
        
        return {
            "total_requests": total,
            "cache_hits": cached,
            "avg_latency": round(float(avg_latency), 1) if avg_latency else 0,
            "threats_blocked": threats,
            "rate_limited": rate_limited,
            "backend_errors": errors,
            "status_distribution": {bucket: count for bucket, count in status_dist},
            "slowest_endpoints": [
                {"method": s.method, "path": s.path, "avg_latency": round(float(s.avg_latency), 1), "count": s.count}
                for s in slowest
            ],
            "latency_distribution": latency_buckets,
            "alerts": [
                {
                    "id": a.id, "type": a.alert_type, "message": a.message,
                    "severity": a.severity, "timestamp": a.created_at.isoformat() if a.created_at else "",
                    "details": json.loads(a.details) if a.details else {}
                }
                for a in recent_alerts
            ],
            "timeline": timeline,
            "cache_hit_rate": round((cached / total * 100), 1) if total > 0 else 0
        }


# Global singleton
_analytics_engine: Optional[AnalyticsEngine] = None

def get_analytics_engine() -> AnalyticsEngine:
    global _analytics_engine
    if _analytics_engine is None:
        _analytics_engine = AnalyticsEngine()
    return _analytics_engine

def start_analytics():
    engine = get_analytics_engine()
    engine.start()
    return engine
