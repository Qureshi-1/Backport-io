from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Optional


@dataclass
class RequestLog:
    method: str
    path: str
    status_code: int
    latency: float
    ip: str
    timestamp: str
    response_size: int
    id: Optional[int] = None
    headers: str = ""
    query_params: str = ""
    request_body: str = ""

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.id is None:
            d.pop("id")
        if not self.headers:
            d.pop("headers")
        if not self.query_params:
            d.pop("query_params")
        if not self.request_body:
            d.pop("request_body")
        return d


@dataclass
class Alert:
    alert_type: str
    message: str
    severity: str
    timestamp: str
    details: dict
    id: Optional[int] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.id is None:
            d.pop("id")
        return d


@dataclass
class StatsResponse:
    total_requests: int
    requests_per_minute: float
    top_endpoints: list
    error_rate: float
    slow_requests: list
    status_distribution: dict
    avg_latency: float
    alerts: list


def request_log_from_row(row: tuple) -> RequestLog:
    headers = row[8] if len(row) > 8 else ""
    query_params = row[9] if len(row) > 9 else ""
    request_body = row[10] if len(row) > 10 else ""
    return RequestLog(
        id=row[0],
        method=row[1],
        path=row[2],
        status_code=row[3],
        latency=row[4],
        ip=row[5],
        timestamp=row[6],
        response_size=row[7],
        headers=headers,
        query_params=query_params,
        request_body=request_body,
    )


def request_log_from_dict(data: dict) -> RequestLog:
    return RequestLog(
        id=data.get("id"),
        method=data.get("method", ""),
        path=data.get("path", ""),
        status_code=data.get("status_code", 0),
        latency=data.get("latency", 0),
        ip=data.get("ip", ""),
        timestamp=data.get("timestamp", ""),
        response_size=data.get("response_size", 0),
        headers=data.get("headers", ""),
        query_params=data.get("query_params", ""),
        request_body=data.get("request_body", ""),
    )


def alert_from_row(row: tuple) -> Alert:
    return Alert(
        id=row[0],
        alert_type=row[1],
        message=row[2],
        severity=row[3],
        timestamp=row[4],
        details=row[5],
    )
