<div align="center">

# ⚡ Backport

### Open-Source API Gateway — WAF, Rate Limiting, Caching & Analytics

**Shield your API in 30 seconds. Zero code changes. MIT Licensed.**

[Website](https://backport.in) · [Documentation](https://backport.in/docs) · [Compare](https://backport.in/compare) · [Community](https://github.com/Qureshi-1/Backport-io/discussions) · [Live Demo](https://backport.in)

<img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python">
<img src="https://img.shields.io/badge/FastAPI-Latest-009688.svg" alt="FastAPI">
<img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js">
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript">
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4.svg" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" alt="Docker">
<img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
<img src="https://img.shields.io/badge/CI-All_Passed-success.svg" alt="CI">
<img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">

</div>

---

## What is Backport?

Backport is an **open-source API gateway** that protects your backend with a powerful WAF, rate limiting, caching, response transformation, and API mocking. No SDK required. No code changes needed. MIT Licensed. Self-host or use the cloud.

**Point your clients to Backport. That's it.**

**Live Demo:** [backport.in](https://backport.in) - Try the interactive WAF demo on the homepage.

---

## Quick Start (5 Minutes)

### Option 1: Docker (Recommended - 2 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# 2. Copy environment file
cp .env.example .env

# 3. Start everything
docker-compose up -d

# 4. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

### Option 2: Manual Setup (5 minutes)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Edit DATABASE_URL and other vars
python main.py
# Backend runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local  # Edit NEXT_PUBLIC_BACKEND_URL
npm run dev
# Frontend runs on http://localhost:3000
```

### Option 3: Cloud (Vercel + Render)

1. Fork this repo
2. Deploy frontend to [Vercel](https://vercel.com) — auto-detected
3. Deploy backend to [Render](https://render.com) — select "Web Service"
4. Set environment variables in both platforms
5. Done!

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

---

## Architecture

```
┌──────────┐     ┌─────────────────────────────────────────────┐     ┌──────────────┐
│  Client   │────>│              Backport Gateway               │────>│   Backend    │
│  (Any)    │     │                                             │     │  (Your API)  │
└──────────┘     │  ┌─────────┐ ┌─────┐ ┌──────┐ ┌─────┐ ┌───┐│     └──────────────┘
                 │  │API Key  │→│ WAF │→│ Rate │→│Cache│→│API││
                 │  │  Auth   │ │Scan │ │Limit │ │Check│ │Mock││
                 │  └─────────┘ └─────┘ └──────┘ └─────┘ └───┘│
                 │                                             │
                 │  ┌──────────────┐ ┌────────────────────┐    │
                 │  │  Transform   │ │  Webhooks & Alerts │    │
                 │  │  Responses   │ │  (Slack/Discord)   │    │
                 │  └──────────────┘ └────────────────────┘    │
                 └─────────────────────────────────────────────┘

                 Deploy: Docker (2 min) | Vercel + Render | Any VPS
                 License: MIT | Self-host free forever | No vendor lock-in
```

## Video Tutorial

🎥 **Video coming soon!** In the meantime, follow the Quick Start above or check the [interactive docs](https://backport.in/docs) — setup takes under 2 minutes with Docker.

---

## Screenshots

### Landing Page
Backport's website features a live WAF demo, pricing table, and Cloudflare comparison — all open-source.

### Dashboard
Full management dashboard with real-time analytics, API key management, and security monitoring.

### WAF Protection
17+ built-in patterns detect and block SQL Injection, XSS, Path Traversal, Command Injection, and more.

### Analytics
Real-time traffic charts, latency heatmaps, slow endpoint detection, and threat alert summaries.

---

## Features

| Feature | Description |
|---------|-------------|
| **WAF (Web Application Firewall)** | 17+ regex patterns covering SQLi, XSS, Path Traversal, Command Injection, LDAPi, XXE |
| **Rate Limiting** | Sliding-window limits from 100 to 5,000+ requests per minute by plan |
| **Response Transformation** | Modify API responses on the fly — add/remove fields, rename keys |
| **API Mocking** | Define mock endpoints for development and testing |
| **Custom WAF Rules** | User-defined regex patterns with severity levels |
| **Webhook Notifications** | Real-time alerts for security events on Slack, Discord, or custom URLs |
| **Analytics Dashboard** | Real-time traffic, latency, threat monitoring |
| **API Key Management** | Generate, monitor, and revoke API keys |
| **LRU Caching** | In-memory cache for GET requests with configurable TTL |
| **Idempotency Keys** | Prevent duplicate POST/PUT/PATCH requests (perfect for payments) |
| **Team Management** | Invite team members, manage roles and permissions |
| **Health Monitoring** | Automated backend health checks with alerting |
| **Audit Logging** | Track all changes and actions across your account |

---

## Tech Stack

### Backend
- **Language:** Python 3.10+
- **Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **Database:** PostgreSQL (production) / SQLite (development)
- **ORM:** SQLAlchemy
- **HTTP Client:** httpx (async, connection pooling)

### Frontend
- **Framework:** Next.js 16
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render
- **Domains:** backport.in, backport.io

---

## How It Works

```
Client Request
    |
    v
[Backport Gateway]
    |
    +-- API Key Authentication
    |
    +-- WAF Scan (17+ patterns)
    |
    +-- Rate Limit Check (sliding window)
    |
    +-- Idempotency Check
    |
    +-- Cache Check (LRU, optional)
    |
    +-- Forward to Your Backend
    |
    +-- Response Transformation (optional)
    |
    v
Client Response
```

**3 steps to get started:**
1. Sign up (or self-host)
2. Generate an API key
3. Point your traffic to Backport proxy URL

---

## Example Usage

### cURL
```bash
curl https://backport.in/proxy/users \
  -H "X-API-Key: bk_your_key_here"
```

### Python
```python
import requests

resp = requests.get(
    "https://backport.in/proxy/users",
    headers={"X-API-Key": "bk_your_key"}
)
print(resp.json())
```

### JavaScript
```javascript
const res = await fetch(
  "https://backport.in/proxy/users",
  { headers: { "X-API-Key": "bk_your_key" } }
);
const data = await res.json();
```

---

## Self-Hosting

Backport is designed to be easy to self-host. You get full control over your data, no vendor lock-in, and unlimited requests.

| Method | Time | Difficulty |
|--------|------|-----------|
| Docker Compose | 2 min | Easy |
| Manual (Python + Node) | 5 min | Easy |
| Vercel + Render | 10 min | Easy |
| VPS with Docker | 15 min | Medium |

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for step-by-step guides for each method.

---

## Pricing (Cloud)

| Plan | Price | Rate Limit | Features |
|------|-------|-----------|----------|
| Free | $0/mo | 100 req/min | Basic WAF, API key management, 3-month trial |
| Plus | $5.99/mo | 500 req/min | + Response transformation, API mocking |
| Pro | $11.99/mo | 5,000 req/min | + Custom WAF rules, webhooks |
| Enterprise | Custom | Unlimited | + SLA, team features, dedicated support |

**Self-hosted?** Unlimited everything. Free forever. MIT License.

---

## Documentation

- [Installation Guide](./docs/INSTALLATION.md) — Docker + manual setup
- [Features Documentation](./docs/FEATURES.md) — All features explained
- [API Reference](./docs/API_DOCS.md) — Full endpoint documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) — 4 deployment options
- [FAQ](./docs/FAQ.md) — Frequently asked questions
- [Troubleshooting](./docs/TROUBLESHOOTING.md) — Common issues and fixes
- [Changelog](./docs/CHANGELOG.md) — Release notes
- [Compare](https://backport.in/compare) — Backport vs Kong vs Tyk vs Cloudflare

---

## Project Stats

| Metric | Value |
|--------|-------|
| Total Files | 118 |
| Lines of Code | 9,500+ |
| Built-in WAF Patterns | 17+ |
| Proxy Overhead | <5ms |
| Setup Time | 30 seconds |
| License | MIT |

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Bug Reports** — [Open an issue](https://github.com/Qureshi-1/Backport-io/issues)
2. **Feature Requests** — Start a [discussion](https://github.com/Qureshi-1/Backport-io/discussions)
3. **Pull Requests** — Fork, branch, commit, PR. Keep it small and focused.
4. **Security** — Report vulnerabilities privately via email

---

## License

MIT License — free for personal and commercial use.

See [LICENSE](./LICENSE) for details.

---

## Contact

- Website: [backport.in](https://backport.in)
- GitHub: [Qureshi-1/Backport-io](https://github.com/Qureshi-1/Backport-io)
- Email: support@backportio.com
- Twitter: [@backportio](https://x.com/backportio)
