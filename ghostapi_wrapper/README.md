# Ghost API Wrapper

Production-ready Python SDK and REST micro-service for the Ghost anonymous chat API. Includes automatic token refresh, retry with exponential back-off, rate limiting, input validation, structured logging, and a deployable FastAPI layer.

---

## Features

| Feature | Description |
|---|---|
| **Automatic Token Refresh** | Proactively refreshes access tokens before expiry using a thread-safe lock. |
| **Retry with Back-off** | Retries transient failures (timeouts, 500 errors) up to N times with exponential back-off. |
| **Rate Limiting** | Client-side token-bucket rate limiter respects configurable requests-per-second. |
| **Input Validation** | All payloads validated through Pydantic v2 models before hitting the wire. |
| **Custom Exceptions** | Rich exception hierarchy (`GhostAuthError`, `GhostRateLimitError`, `GhostTimeoutError`, etc.). |
| **Structured Logging** | Console + optional file logging with configurable severity levels. |
| **Connection Pooling** | `requests.Session` with 10 connection pool and 20 max pool size. |
| **REST Service** | FastAPI wrapper exposes all methods as JSON endpoints with OpenAPI docs. |
| **Docker Ready** | Multi-stage Dockerfile and docker-compose.yml for one-command deployment. |
| **MIT License** | Commercial-friendly license. |

---

## Project Structure

```
ghostapi-wrapper/
├── ghost_client.py      # Core SDK — GhostClient class with all API methods
├── exceptions.py        # Custom exception hierarchy
├── models.py            # Pydantic v2 request/response models
├── config.py            # Environment-based configuration (Pydantic Settings)
├── main.py              # FastAPI REST wrapper application
├── test_ghost.py        # Unit tests with mocked HTTP (30+ test cases)
├── requirements.txt     # Pinned dependencies
├── Dockerfile           # Multi-stage production Docker image
├── docker-compose.yml   # Docker Compose orchestration
├── LICENSE              # MIT license
└── README.md            # This file
```

---

## Installation

### From source

```bash
git clone https://github.com/your-org/ghostapi-wrapper.git
cd ghostapi-wrapper
pip install -r requirements.txt
```

### With Docker

```bash
docker compose up --build -d
```

The service starts on `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

---

## Quick Start — Python SDK

### 1. Set environment variables

```bash
export GHOST_API_BASE_URL="https://api.ghostapp.io/v1"
export GHOST_EMAIL="your@email.com"
export GHOST_PASSWORD="your_password"
```

Or create a `.env` file in the project root:

```env
GHOST_API_BASE_URL=https://api.ghostapp.io/v1
GHOST_EMAIL=your@email.com
GHOST_PASSWORD=your_password
GHOST_LOG_LEVEL=INFO
GHOST_LOG_FILE=logs/ghostapi.log
```

### 2. Use the client

```python
from ghost_client import GhostClient

# Initialise (reads GHOST_* env vars automatically)
client = GhostClient()

# Check if the API is reachable
health = client.health()
print(f"API status: {health.status}")

# Login
result = client.login("your@email.com", "your_password")
print(f"Logged in as: {result.user.display_name}")
print(f"Token expires at: {result.expires_at}")

# List contacts
contacts = client.get_contacts()
for contact in contacts:
    print(f"  {contact.display_name} — {contact.last_message}")

# Send a message
message = client.send_message(
    chat_id="chat-uuid-here",
    text="Hello from the SDK!",
)
print(f"Sent message_id={message.message_id}")

# Fetch messages (with pagination)
response = client.fetch_messages(chat_id="chat-uuid-here", limit=20)
for msg in response.messages:
    sender = "You" if msg.is_mine else msg.sender_id
    print(f"  [{sender}] {msg.text}")

if response.has_more:
    more = client.fetch_messages(
        chat_id="chat-uuid-here",
        cursor=response.next_cursor,
    )

# Logout
client.logout()
```

### Context manager usage

```python
with GhostClient() as client:
    client.login()
    contacts = client.get_contacts()
# Session is automatically closed
```

### Custom configuration

```python
from ghost_client import GhostClient
from config import GhostConfig

config = GhostConfig(
    ghost_api_base_url="https://custom.ghost.server/v1",
    request_timeout=60.0,
    max_retries=5,
    rate_limit_rps=20.0,
    verify_ssl=True,
    log_level="DEBUG",
    log_file="debug.log",
)

client = GhostClient(config=config)
```

---

## Quick Start — REST API

Start the FastAPI service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check (service + upstream API) |
| `POST` | `/api/login` | No | Authenticate with email + password |
| `POST` | `/api/logout` | No | End the current session |
| `GET` | `/api/contacts` | Yes | List all chats / contacts |
| `GET` | `/api/messages/{chat_id}` | Yes | Fetch messages (supports `limit` and `cursor` query params) |
| `POST` | `/api/messages` | Yes | Send a text message |
| `GET` | `/docs` | No | Interactive OpenAPI / Swagger docs |
| `GET` | `/redoc` | No | ReDoc documentation |

### Example requests

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "s3cret"}'

# List contacts
curl http://localhost:8000/api/contacts \
  -H "Authorization: Bearer <token>"

# Send a message
curl -X POST http://localhost:8000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"chat_id": "abc", "text": "Hello!"}'

# Fetch messages
curl "http://localhost:8000/api/messages/abc?limit=20" \
  -H "Authorization: Bearer <token>"

# Health check
curl http://localhost:8000/api/health
```

### Error responses

All errors follow a consistent JSON envelope:

```json
{
  "error": "auth_error",
  "detail": "Authentication failed. Token may be invalid.",
  "status_code": 401
}
```

| Error Type | HTTP Status | When |
|---|---|---|
| `invalid_credentials` | 401 | Wrong email or password |
| `token_expired` | 401 | Session token expired and refresh failed |
| `auth_error` | 401 | Any authentication failure |
| `not_found` | 404 | Chat or message does not exist |
| `validation_error` | 422 | Invalid request payload |
| `rate_limited` | 429 | Too many requests |
| `timeout` | 504 | Upstream API did not respond in time |
| `connection_error` | 502 | Could not reach upstream API |
| `max_retries` | 502 | All retry attempts exhausted |

---

## Configuration Reference

All settings can be provided via environment variables (prefixed with `GHOST_`), a `.env` file, or constructor arguments.

| Variable | Default | Description |
|---|---|---|
| `GHOST_API_BASE_URL` | `https://api.ghostapp.io/v1` | Root URL of the Ghost API |
| `GHOST_EMAIL` | *(empty)* | Account email for login |
| `GHOST_PASSWORD` | *(empty)* | Account password for login |
| `GHOST_REQUEST_TIMEOUT` | `30.0` | HTTP request timeout in seconds |
| `GHOST_MAX_RETRIES` | `3` | Maximum retry attempts on transient errors |
| `GHOST_RETRY_BASE_DELAY` | `1.0` | Base delay (seconds) for exponential back-off |
| `GHOST_RATE_LIMIT_RPS` | `10.0` | Client-side rate limit (requests per second) |
| `GHOST_VERIFY_SSL` | `true` | Verify SSL certificates (`false` for testing) |
| `GHOST_LOG_LEVEL` | `INFO` | Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `GHOST_LOG_FILE` | *(none)* | Path to a log file. Omit to disable file logging. |
| `GHOST_TOKEN_REFRESH_BUFFER` | `300` | Refresh token N seconds before actual expiry |

---

## Testing

Run the full test suite:

```bash
# With pytest
python -m pytest test_ghost.py -v

# With unittest
python -m unittest test_ghost -v
```

All tests use mocked HTTP responses — no network access or real API credentials required.

### Test coverage

- **RateLimiter** — burst behaviour, timeout, refill
- **Config** — validation of timeouts, rates, negative values
- **Models** — Pydantic validation for all request/response objects
- **Auth** — login success/failure, logout, token clearing
- **Messages** — send, fetch, pagination, validation
- **Contacts** — list with alternate API response keys
- **Retry** — 500 retry + success, max retries exhaustion, timeout retry
- **Token Refresh** — proactive refresh before request, refresh failure handling
- **Context Manager** — enter/exit lifecycle
- **Exceptions** — hierarchy, attributes, defaults

---

## Docker Deployment

### Build and run

```bash
# Build the image
docker build -t ghostapi-wrapper .

# Run the container
docker run -d \
  --name ghostapi \
  -p 8000:8000 \
  -e GHOST_API_BASE_URL=https://api.ghostapp.io/v1 \
  -e GHOST_EMAIL=user@example.com \
  -e GHOST_PASSWORD=s3cret \
  -e GHOST_LOG_LEVEL=INFO \
  ghostapi-wrapper
```

### Docker Compose

```bash
# Start with compose (uses .env file or host environment)
docker compose up -d

# View logs
docker compose logs -f ghostapi

# Stop
docker compose down
```

The Docker image uses a multi-stage build, runs as a non-root user (`ghostapi`), includes a health check, and persists logs to a named Docker volume.

---

## SDK API Reference

### `GhostClient(config=None)`

Main client class. All methods are documented with docstrings and type hints.

#### Properties

| Property | Type | Description |
|---|---|---|
| `is_authenticated` | `bool` | Whether the client holds a valid session |
| `user` | `UserProfile \| None` | Authenticated user's profile |

#### Methods

| Method | Returns | Description |
|---|---|---|
| `health()` | `HealthResponse` | Unauthenticated health check |
| `login(email, password)` | `LoginResponse` | Authenticate and store tokens |
| `logout()` | `bool` | End session and clear credentials |
| `get_contacts()` | `list[Contact]` | List all chats and contacts |
| `fetch_messages(chat_id, limit, cursor)` | `MessageListResponse` | Get recent messages with pagination |
| `send_message(chat_id, text)` | `Message` | Send a text message |
| `close()` | `None` | Close the HTTP session |

---

## Security Notes

- **Never commit credentials.** Use environment variables or a secrets manager.
- **SSL verification** is enabled by default. Disable with `GHOST_VERIFY_SSL=false` for local testing only.
- **The FastAPI service** does not implement its own authentication layer — it delegates to the Ghost API's token-based auth. For production deployment, put the service behind a reverse proxy (nginx, Caddy) with TLS termination and add an API gateway or IP allow-list as needed.
- **The Docker image** runs as a non-root user with no shell access.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
