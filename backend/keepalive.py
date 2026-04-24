"""
Keep-Alive Pinger for Backport Backend
──────────────────────────────────────
Render free tier spins down after ~15 min of inactivity.
This script is called by the backport-keepalive CRON job
every 10 minutes to keep the backend warm.

It pings /health and / on the main backend service.
"""

import os
import logging
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "")
if not BACKEND_URL:
    raise RuntimeError("BACKEND_URL env var is required")

# Strip trailing slash
BACKEND_URL = BACKEND_URL.rstrip("/")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [keepalive] %(message)s")
log = logging.getLogger(__name__)


def ping(endpoint: str, timeout: int = 15) -> bool:
    """Ping a backend endpoint and return True if successful."""
    url = f"{BACKEND_URL}{endpoint}"
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code == 200:
            log.info("✓ %s → %d (%.1fs)", endpoint, resp.status_code, resp.elapsed.total_seconds())
            return True
        else:
            log.warning("✗ %s → %d", endpoint, resp.status_code)
            return False
    except Exception as exc:
        log.error("✗ %s → FAILED: %s", endpoint, exc)
        return False


def main():
    log.info("Keep-alive ping started (target: %s)", BACKEND_URL)

    ok1 = ping("/health")
    ok2 = ping("/")

    if ok1 and ok2:
        log.info("Backend is warm ✓")
    else:
        log.warning("One or more pings failed — backend might be starting up")


if __name__ == "__main__":
    main()
