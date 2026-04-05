# GhostAPI

**Reverse proxy with real-time analytics and security detection.**

GhostAPI sits between your clients and any backend API, capturing every request and response in real time — without modifying a single line of your backend code.

---

## Features

- **Transparent Reverse Proxy** — Forwards requests to any target API and returns responses unchanged
- **Real-Time Dashboard** — Live analytics with charts, tables, and security alerts
- **Security Detection** — Automatic detection of rate limit abuse, 429 threshold breaches, 500 error spikes, and slow endpoints
- **Async Architecture** — Non-blocking request logging using background threads and streaming responses
- **Zero Backend Changes** — Works as a standalone proxy layer; no code changes to your API required
- **SQLite Storage** — Lightweight, file-based database for request logs and alerts

---

## Quick Start

### Install

```bash
cd ghostapi
pip install -r requirements.txt
```

### Run

```bash
python -m ghostapi.cli watch https://api.example.com
```

GhostAPI will start the proxy server on `http://localhost:8080`.

### Dashboard

Open your browser and navigate to:

```
http://localhost:8080/dashboard
```

The dashboard auto-refreshes every 3 seconds and shows:

- Total requests and requests per minute
- Average latency and error rate
- Request timeline chart (last 30 minutes)
- Status code distribution (doughnut chart)
- Top endpoints ranked by hit count
- Security alerts panel
- Recent requests table with method, path, status, latency, IP, and time
- Slow endpoints table (requests exceeding 500ms)

---

## CLI Usage

```bash
# Basic usage
python -m ghostapi.cli watch https://api.example.com

# Custom host and port
python -m ghostapi.cli watch https://api.example.com --host 127.0.0.1 --port 9090

# Debug logging
python -m ghostapi.cli watch https://api.example.com --log-level debug
```

### Options

| Option       | Default     | Description                          |
|--------------|-------------|--------------------------------------|
| `--host`     | `0.0.0.0`   | Host to bind the server to           |
| `--port`     | `8080`      | Port to bind the server to           |
| `--log-level`| `info`      | Logging level: debug, info, warning, error |

---

## API Endpoints

| Endpoint          | Description                        |
|-------------------|------------------------------------|
| `GET /dashboard`  | Analytics dashboard (HTML)         |
| `GET /api/stats`  | Statistics and analytics JSON      |
| `GET /api/logs`   | Last 50 request logs (JSON)        |
| `GET /api/alerts` | Recent security alerts (JSON)      |
| `GET /api/timeline`| Request timeline data (JSON)      |
| `GET /api/health` | Health check endpoint              |
| `* /{path}`       | All other requests proxied to target |

---

## How It Works

1. **Start** — Run the CLI command with a target API URL
2. **Proxy** — All incoming HTTP requests are forwarded to the target API
3. **Capture** — Request metadata (method, path, status, latency, IP, size) is recorded asynchronously to SQLite
4. **Analyze** — A background analytics engine periodically checks for security issues (rate abuse, error spikes, slow endpoints)
5. **Visualize** — The dashboard polls the API every 3 seconds and displays live charts and tables

---

## Environment Variables

| Variable                        | Default              | Description                    |
|----------------------------------|----------------------|--------------------------------|
| `GHOSTAPI_TARGET`               | —                    | Target API URL                 |
| `GHOSTAPI_HOST`                 | `0.0.0.0`            | Server host                    |
| `GHOSTAPI_PORT`                 | `8080`               | Server port                    |
| `GHOSTAPI_DB_PATH`              | `ghostapi_data.db`   | SQLite database file path      |
| `GHOSTAPI_LOG_LEVEL`            | `info`               | Logging level                  |
| `GHOSTAPI_SLOW_THRESHOLD`       | `500`                | Slow request threshold (ms)    |
| `GHOSTAPI_RATE_WINDOW`          | `60`                 | Rate limit window (seconds)    |
| `GHOSTAPI_RATE_THRESHOLD`       | `30`                 | Rate limit threshold           |
| `GHOSTAPI_ERROR_WINDOW`         | `60`                 | Error spike window (seconds)   |
| `GHOSTAPI_ERROR_THRESHOLD`      | `5`                  | Error spike threshold          |

---

## Tech Stack

- **Backend:** FastAPI, Uvicorn, httpx, SQLite
- **Frontend:** HTML, TailwindCSS, Chart.js
- **CLI:** Click

---

## Project Structure

```
ghostapi/
├── main.py           # FastAPI app with routes and lifespan
├── proxy.py          # Reverse proxy engine with async forwarding
├── database.py       # SQLite database layer with async logging
├── analytics.py      # Security detection and analytics engine
├── cli.py            # CLI entry point with Click
├── models.py         # Data models for requests and alerts
├── config.py         # Configuration management
├── templates/
│   └── dashboard.html # Dashboard UI with dark theme
├── static/            # Static assets directory
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

---

## License

MIT
