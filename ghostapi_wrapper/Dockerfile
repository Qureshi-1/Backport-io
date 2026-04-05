# ── Build stage ──────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM python:3.12-slim

LABEL maintainer="Ghost API Wrapper <admin@example.com>"
LABEL description="Production-ready REST wrapper for the Ghost anonymous chat API"
LABEL version="1.0.0"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r ghostapi && useradd -r -g ghostapi -d /app -s /sbin/nologin ghostapi
RUN chown -R ghostapi:ghostapi /app
USER ghostapi

# Environment defaults
ENV GHOST_LOG_LEVEL=INFO
ENV GHOST_VERIFY_SSL=true

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/health', timeout=3)" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
