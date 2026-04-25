<div align="center">

# Backport.io

**Open-Source API Gateway — Enterprise Security with Zero Code Changes**

[🌐 Live Demo](https://backport.in) &middot;
[📖 Docs](https://backport.in/docs) &middot;
[🐛 Report Bug](https://github.com/Qureshi-1/Backport-io/issues/new?template=bug_report.yml)

<p>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="MIT License" />
  &nbsp;
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12" />
  &nbsp;
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  &nbsp;
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Ready" />
  &nbsp;
  <img src="https://img.shields.io/github/actions/workflow/status/Qureshi-1/Backport-io/ci.yml?style=for-the-badge&logo=github&logoColor=white&label=CI" alt="CI Passing" />
</p>

<p>
  <img src="https://img.shields.io/github/stars/Qureshi-1/Backport-io?style=social&logo=github" alt="Stars" />
  &nbsp;
  <img src="https://img.shields.io/github/forks/Qureshi-1/Backport-io?style=social&logo=github" alt="Forks" />
</p>

</div>

---

## What is Backport?

Backport is a **production-grade API Gateway** that sits in front of any backend service. It provides enterprise-level security, performance optimization, and full observability — without requiring any SDK, code changes, or complex configuration. Simply point your API traffic through Backport and instantly gain **WAF protection, rate limiting, intelligent caching, request analytics, circuit breakers, and more**.

> Think of it as a Cloudflare for APIs — but self-hosted, fully open-source (MIT), and deployable in under 30 seconds.

---

## Architecture

```mermaid
graph LR
    Client[Client App] -->|API Key| Backport[Backport Gateway]
    Backport --> WAF[WAF Engine]
    Backport --> RL[Rate Limiter]
    Backport --> Cache[LRU Cache]
    Backport -->|Proxy| Backend[Your Backend]
    Backport --> DB[(PostgreSQL)]
    Backport --> Redis[(Redis/Upstash)]
    Backport --> Analytics[Analytics Engine]
```

Every request flows through Backport's middleware pipeline: **authentication**, **WAF scanning**, **rate limiting**, **caching**, and **transformation** — before reaching your backend. Your backend code stays untouched. Your clients only need to add a single `X-API-Key` header.

---

## Features

### Security & Protection

| Feature | Description |
|---|---|
| **WAF Engine** | Built-in detection for SQL Injection, XSS, Path Traversal, Command Injection, XXE, and LDAP Injection |
| **Custom WAF Rules** | User-defined regex-based firewall rules with per-endpoint control, severity levels, and block/log modes |
| **API Key Management** | Multiple keys per user with scoped permissions and automatic rotation |
| **Circuit Breaker** | Automatic failover and recovery to protect downstream services from cascading failures |
| **IP Blocking** | Block malicious IPs and suspicious request patterns |

### Performance & Optimization

| Feature | Description |
|---|---|
| **Rate Limiting** | Token-bucket algorithm with per-plan limits — throttle by endpoint, user, or IP |
| **LRU Caching** | In-memory LRU cache with configurable TTL; Redis/Upstash support for distributed deployments |
| **Request Transformation** | Modify request headers and response bodies on the fly — add, remove, or rename fields |
| **GZip Compression** | Automatic response compression to reduce bandwidth |

### Developer Experience

| Feature | Description |
|---|---|
| **Mock Endpoints** | Create mock endpoints with pattern matching for frontend development and testing |
| **Webhooks** | Event-driven notifications with HMAC-signed delivery to Slack, Discord, or custom endpoints |
| **Team Management** | Multi-user access with role-based control (Owner, Admin, Member, Viewer) |
| **CLI Tool** | Manage your gateway from the terminal with the `backport` CLI |

### Observability

| Feature | Description |
|---|---|
| **Analytics Dashboard** | Real-time metrics — request counts, latency tracking, error rates, throughput via WebSocket |
| **Health Monitoring** | Automated health checks with 24-hour status history and uptime tracking |
| **Audit Trail** | Full request log with JSON/CSV export and one-click replay |
| **Live Logs** | Real-time streaming log viewer in the admin dashboard |

---

## Quick Start (Self-Hosted)

### Prerequisites

- Python 3.12+
- PostgreSQL (or SQLite for development)

### Clone & Install

```bash
# Prerequisites: Python 3.12+, PostgreSQL
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io/backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, etc.

# Run migrations
python -c "from main import app; from database import engine, Base; Base.metadata.create_all(bind=engine)"

# Start server
uvicorn main:app --host 0.0.0.0 --port 8080
```

Your gateway is now live at `http://localhost:8080`. Full interactive API documentation is available at `http://localhost:8080/docs` (Swagger UI).

---

## Configuration

All configuration is done through environment variables. Copy `.env.example` to `.env` and set the required values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/backport`) |
| `SECRET_KEY` | **Yes** | — | Secret key for JWT signing (minimum 32 characters) |
| `REDIS_URL` | No | — | Redis or Upstash connection URL for distributed caching |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend origin for CORS configuration |
| `ADMIN_EMAIL` | No | — | Default admin user email for initial setup |
| `ADMIN_SECRET` | No | — | Admin secret for protected admin operations |
| `RAZORPAY_KEY_ID` | No | — | Razorpay API key for payment processing |
| `RAZORPAY_KEY_SECRET` | No | — | Razorpay API secret for payment processing |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth client secret |
| `RESEND_API_KEY` | No | — | Resend API key for transactional email |
| `FROM_EMAIL` | No | — | Sender email address for notifications |
| `ENVIRONMENT` | No | `production` | Environment mode: `production` or `staging` |

> **Note:** Without `REDIS_URL`, Backport defaults to in-memory caching (single-worker mode). For production with multiple workers, Redis is recommended.

---

## Admin API Documentation

Backport exposes a comprehensive admin API for system monitoring and management. All admin endpoints require authentication.

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | System statistics — total users, active users, API keys, MRR, growth metrics |
| `GET` | `/api/admin/users` | User management — list, search, filter, paginate all users |
| `PATCH` | `/api/admin/users/{id}/action` | User actions — suspend, ban, unban, activate, promote to admin |
| `DELETE` | `/api/admin/users/{id}` | Soft-delete a user account |
| `GET` | `/api/admin/audit-logs` | Audit trail — full event log with type filtering and date ranges |
| `GET` | `/api/admin/logs/live` | Live log stream — real-time WebSocket-based log viewer |
| `GET` | `/api/admin/monitoring/summary` | Circuit breaker states and service health overview |
| `GET` | `/api/admin/security/waf-stats` | WAF statistics — blocked requests by attack type and rule |
| `GET` | `/api/admin/revenue` | Revenue metrics — MRR, plan distribution, daily breakdown |

### Interactive Documentation

Full interactive API documentation is available via Swagger UI:

| URL | Description |
|---|---|
| `/docs` | Swagger UI — interactive API explorer with try-it-out support |
| `/redoc` | ReDoc — alternative documentation viewer |

---

## Deployment

### Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
# Build and run
docker build -t backport-backend ./backend
docker run -p 8080:8080 --env-file .env backport-backend
```

### Render (Free Tier)

Render supports one-click deployment directly from your GitHub repository.

1. **Connect** your GitHub repo at [render.com](https://render.com)
2. **Set** environment variables (DATABASE_URL, SECRET_KEY, etc.)
3. **Deploy** — auto-deploys on every push to `main`

```bash
# Or deploy via render.yaml blueprint
render deploy
```

### Vercel (Frontend)

1. **Connect** your GitHub repo at [vercel.com](https://vercel.com)
2. **Set** root directory to `frontend`
3. **Configure** the `NEXT_PUBLIC_API_URL` environment variable to point to your backend
4. **Deploy** — auto-deploys on every push to `main`

### Docker Compose (Full Stack)

```bash
# Start both backend and PostgreSQL together
docker compose up -d
```

---

## Comparison with Kong / Tyk / AWS API Gateway

| Feature | Backport | Kong | Tyk | AWS API Gateway |
|---|---|---|---|---|
| **Open Source** | Full (MIT) | Partial (Enterprise upsell) | Partial (Enterprise upsell) | No |
| **Self-Hosted** | Easy — single binary | Complex — Lua plugins, DB required | Complex — MongoDB, Redis required | No |
| **WAF Built-in** | Regex + Custom rules | Plugin only | Plugin only | Separate WAF service |
| **Caching** | Redis / In-memory | Plugin | Plugin | Built-in |
| **Analytics** | Real-time dashboard | Plugin (limited) | Built-in | CloudWatch only |
| **Rate Limiting** | Per-plan, per-endpoint | Plugin | Plugin | Built-in |
| **Mock Endpoints** | Built-in | No | No | No |
| **Custom WAF Rules** | User-defined regex | No | Limited | No |
| **Circuit Breaker** | Built-in | Plugin | Plugin | No |
| **Setup Time** | 30 seconds | ~30 minutes | ~30 minutes | ~1 hour |
| **Pricing** | Free forever | Free (limited) + Enterprise | Free (limited) + Enterprise | Pay per request |

---

## Managed Cloud vs Self-Hosted

| | Managed Cloud ([backport.in](https://backport.in)) | Self-Hosted |
|---|---|---|
| **Setup** | Sign up and done — API key in 30 seconds | Clone repo, configure `.env`, run |
| **Infrastructure** | Backport handles servers, scaling, and uptime | Your servers, your responsibility |
| **Database** | Managed PostgreSQL (Supabase) | SQLite (dev) or PostgreSQL (prod) |
| **Cache** | Redis / Upstash (distributed) | In-memory LRU or Redis |
| **Updates** | Automatic — new features ship instantly | Manual — pull and redeploy |
| **Scaling** | Auto-scales with your traffic | Scale your own infrastructure |
| **Rate Limits** | Persistent across restarts | In-memory (resets on restart) |
| **Analytics** | Persistent history, real-time WebSocket | In-memory (resets on restart) |
| **Cost** | Free tier + paid plans ($5.99–$11.99/mo) | Free forever — your infra costs only |
| **Enterprise** | Contact sales for SLA, SSO, dedicated support | Free forever, community support |

> **Recommendation:** Use **Managed Cloud** for production — persistent data, Redis caching, and zero ops. Use **Self-Hosted** for development, testing, or air-gapped environments.

---

## Project Structure

```
Backport-io/
├── backend/
│   ├── main.py               # FastAPI app entry point & middleware pipeline
│   ├── proxy.py              # Core reverse proxy & request routing
│   ├── admin.py              # Admin API endpoints (stats, users, audit logs)
│   ├── auth.py               # OAuth (Google + GitHub) & JWT authentication
│   ├── cache.py              # Redis / in-memory LRU caching layer
│   ├── rate_limiter.py       # Token bucket rate limiter with per-plan limits
│   ├── waf_engine.py         # Modular WAF engine (SQLi, XSS, traversal, etc.)
│   ├── custom_waf.py         # User-defined custom WAF rule processor
│   ├── circuit_breaker.py    # Circuit breaker for automatic failover
│   ├── transform.py          # Request/response transformation
│   ├── mock.py               # API mocking engine for development
│   ├── analytics.py          # Analytics engine with real-time metrics
│   ├── health_monitor.py     # Automated health check system
│   ├── webhooks.py           # Webhook delivery (Slack, Discord, custom)
│   ├── teams.py              # Team management & RBAC
│   ├── payment.py            # Subscription & billing (Razorpay)
│   ├── models.py             # SQLAlchemy database models
│   ├── database.py           # Database connection configuration
│   ├── config.py             # Application configuration
│   ├── tests/                # pytest test suite
│   └── admin/                # Admin panel (HTML / CSS / JS)
├── frontend/
│   └── src/                  # Next.js 16 dashboard application
│       ├── app/              # App Router pages & layouts
│       │   ├── dashboard/    # 17 dashboard pages
│       │   ├── docs/         # Documentation portal
│       │   ├── blog/         # Blog & announcements
│       │   └── auth/         # Login, signup, verification
│       ├── components/       # React UI components
│       └── lib/              # Utilities & helpers
├── enterprise/               # Enterprise-only features
├── .github/
│   └── workflows/            # CI/CD pipelines (tests, linting, deploy)
├── docker-compose.yml        # Full-stack Docker Compose config
├── .env.example              # Environment variable template
├── render.yaml               # Render deployment blueprint
└── vercel.json               # Vercel deployment configuration
```

---

## API Proxy Usage

Once deployed, route your API calls through Backport with a single header:

```bash
# Before (direct to your backend)
curl https://your-backend.com/api/users

# After (through Backport — add one header)
curl -H "X-API-Key: bk_your_api_key" \
     https://your-gateway.com/proxy/your-backend.com/api/users
```

### Request Headers

| Header | Required | Description |
|---|---|---|
| `X-API-Key` | **Yes** | Your API key. Stripped before forwarding — your backend never sees it |
| `X-Target-Url` | No | Override target backend URL (useful for testing) |
| `X-Idempotency-Key` | No | Prevent duplicate request processing |

### Response Codes

| Code | Meaning |
|---|---|
| `200` | Success — proxied response from your backend |
| `401` | Invalid or missing API key |
| `403` | WAF blocked the request (malicious payload detected) |
| `429` | Rate limit exceeded — retry after cooldown |
| `413` | Request payload too large |
| `502` | Backend unavailable — circuit breaker may be open |
| `503` | Service temporarily unavailable |
| `504` | Backend timeout |

---

## Roadmap

### Completed

- [x] Core API Proxy with WAF
- [x] Rate Limiting (token bucket, per-plan)
- [x] LRU Caching (Redis / in-memory)
- [x] OAuth Authentication (Google + GitHub)
- [x] Admin Dashboard (5-tab interface)
- [x] Circuit Breaker (automatic failover)
- [x] Custom WAF Rules (user-defined regex)
- [x] Analytics Engine (real-time WebSocket)
- [x] Team Management (multi-user RBAC)
- [x] API Mocking (pattern-based mock endpoints)
- [x] Webhooks (Slack, Discord, custom)
- [x] Health Monitoring (24h status history)
- [x] Audit Logging (full event trail)

### In Progress & Upcoming

- [ ] **libinjection-based SQLi detection** — token-level analysis for advanced injection attacks
- [ ] **GraphQL proxy support** — introspection, query depth limiting, field-level authorization
- [ ] **gRPC proxy** — transparent HTTP/2 to gRPC translation
- [ ] **Kubernetes operator** — native K8s deployment and auto-scaling
- [ ] **Multi-region deployment** — global edge routing with geo-aware failover
- [ ] **AI-powered anomaly detection** — ML-based traffic analysis and auto-blocking
- [ ] **Plugin system** — custom middleware via a Python plugin SDK

---

## Contributing

We welcome contributions from the community. Whether it's a bug fix, a new feature, documentation improvements, or a new integration — every contribution matters.

### Getting Started

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Add tests for any new functionality
- Ensure all existing tests pass: `pytest backend/tests/`
- Keep PRs focused — one feature or fix per pull request

Please read our [Contributing Guide](CONTRIBUTING.md) for detailed instructions.

---

## Security

If you discover a security vulnerability, please report it responsibly. See our [Security Policy](SECURITY.md) for details.

> Do not open a public issue for security vulnerabilities. Email security@backport.in or use GitHub's private vulnerability reporting.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Backport.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

See the [LICENSE](LICENSE) file for the full text.

---

<div align="center">

**Built with care by the Backport team**

[Star us on GitHub](https://github.com/Qureshi-1/Backport-io) — it helps the project grow!

<a href="https://github.com/Qureshi-1/Backport-io">
  <img src="https://img.shields.io/github/stars/Qureshi-1/Backport-io?style=social" alt="Stars" />
</a>

</div>
