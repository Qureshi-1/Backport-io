import os
from dataclasses import dataclass, field


@dataclass
class Config:
    target_url: str = ""
    host: str = "0.0.0.0"
    port: int = 8080
    db_path: str = "ghostapi_data.db"
    log_level: str = "info"
    slow_threshold_ms: float = 500.0
    rate_limit_window: int = 60
    rate_limit_threshold: int = 30
    error_spike_window: int = 60
    error_spike_threshold: int = 5
    api_key: str = ""

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            target_url=os.getenv("GHOSTAPI_TARGET", ""),
            host=os.getenv("GHOSTAPI_HOST", "0.0.0.0"),
            port=int(os.getenv("GHOSTAPI_PORT", "8080")),
            db_path=os.getenv("GHOSTAPI_DB_PATH", "ghostapi_data.db"),
            log_level=os.getenv("GHOSTAPI_LOG_LEVEL", "info"),
            slow_threshold_ms=float(os.getenv("GHOSTAPI_SLOW_THRESHOLD", "500")),
            rate_limit_window=int(os.getenv("GHOSTAPI_RATE_WINDOW", "60")),
            rate_limit_threshold=int(os.getenv("GHOSTAPI_RATE_THRESHOLD", "30")),
            error_spike_window=int(os.getenv("GHOSTAPI_ERROR_WINDOW", "60")),
            error_spike_threshold=int(os.getenv("GHOSTAPI_ERROR_THRESHOLD", "5")),
            api_key=os.getenv("GHOSTAPI_API_KEY", ""),
        )


config = Config.from_env()
