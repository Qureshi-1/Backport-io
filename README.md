<<<<<<< HEAD
# Backport API Gateway

<div align="center">
  <img src="https://backport-io.vercel.app/logo.png" alt="Backport Logo" width="120" />
  <h1>Backport Gateway</h1>
  <p><b>Shield your API in 30 seconds. No code changes required.</b></p>

  <p>
    <a href="https://github.com/Qureshi-1/Backport-io/stargazers"><img src="https://img.shields.io/github/stars/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="Stars" /></a>
    <a href="https://github.com/Qureshi-1/Backport-io/forks"><img src="https://img.shields.io/github/forks/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="Forks" /></a>
    <a href="https://github.com/Qureshi-1/Backport-io/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="License" /></a>
    <a href="https://backport-io.vercel.app"><img src="https://img.shields.io/badge/Website-Live-10b981?style=flat-square" alt="Website" /></a>
    <a href="https://github.com/Qureshi-1/Backport-io/actions"><img src="https://img.shields.io/github/actions/workflow/status/Qureshi-1/Backport-io/main?style=flat-square" alt="Build" /></a>
  </p>

  <!-- Demo video demonstrating the Backport dashboard and features -->
  <img src="demo.webp" alt="Backport Demo" width="800" />
=======
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
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

</div>

---

<<<<<<< HEAD
## 🎯 What is Backport?

**Backport** is an open-source, lightweight API Gateway built with Python (FastAPI) that sits in front of your existing backend and adds enterprise-grade security and performance features — without requiring a single line of code change.

### Built for Every Stage

| Tier | Who It's For | Key Features |
|------|-------------|--------------|
| **Video** | Content creators, streaming APIs | Rate limiting, basic WAF, caching |
| **Indie** | Solo developers, side projects | Full WAF, caching, idempotency, free tier |
| **Startup** | Growing teams, MVPs | Multi-gateway, advanced analytics, priority support |
| **Enterprise** | Large scale, mission-critical | Dedicated VPC, custom limits, SLA, 24/7 support |

---

## ✨ Features

### 🛡️ Intelligent WAF (Web Application Firewall)
Block SQL Injection, XSS, Path Traversal, and Command Injection attacks at the gateway level — before they reach your database.

```python
# Backport automatically blocks malicious requests
# SQL Injection: "' OR 1=1--" → HTTP 403 Blocked
# XSS: "<script>alert(1)</script>" → HTTP 403 Blocked
# Path Traversal: "../../../etc/passwd" → HTTP 403 Blocked
```

### 🚦 Sliding Window Rate Limiting
Protect against DDoS and bot abuse with intelligent rate limiting per IP and per API key.

```
Plan        | Rate Limit
------------|------------
Free        | 60 req/min
Plus        | 300 req/min
Pro         | 1000 req/min
Enterprise  | Custom
```

### ⚡ LRU Caching
Sub-millisecond response times for repeated requests. Cache responses in memory and reduce database load by 90%.

```
First request:  200ms → Backend
Second request:   2ms → Cache HIT ⚡
Third request:    2ms → Cache HIT ⚡
```

### 🔁 Idempotency Keys
Safely retry POST requests without duplicate processing. Perfect for payments and critical operations.

```bash
curl -X POST https://api.example.com/checkout \
  -H "X-API-Key: bk_live_xxx" \
  -H "Idempotency-Key: txn_12345" \
  -d '{"amount": 500}'
```

### 📊 Real-time Dashboard
Monitor traffic, cache hits, blocked threats, and latency in real-time.

---

## 🚀 Quick Start

### Option 1: Managed Cloud (Recommended for Beginners)

```bash
# 1. Sign up at https://backport-io.vercel.app/auth/signup
# 2. Get your API key from dashboard
# 3. Route your traffic through Backport
```

### Option 2: Self-Hosted (Docker)

```bash
# Start Backport Gateway
docker run -p 8080:8080 \
  -e BACKEND_URL=http://your-api:3000 \
  -e API_KEY=your_api_key \
  qureshi/backport

# Your API is now protected!
curl -H "X-API-Key: your_api_key" \
  http://localhost:8080/proxy/users
```

### Option 3: CLI Tool

```bash
# Install CLI
npm install -g backport-io

# Initialize your project
npx backport-io init

# Deploy gateway
npx backport-io deploy
```

---

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────────────────────────┐      ┌─────────────────┐
│   Client    │ ───► │      Backport Gateway            │ ───► │   Your Backend  │
│  (Mobile/   │      │  ┌─────────────────────────────┐│      │   (Express/     │
│   Web/CLI)  │      │  │  Rate Limiter    [60-1000]  ││      │    FastAPI/     │
└─────────────┘      │  ├─────────────────────────────┤│      │    Django/etc)  │
                     │  │  WAF Engine    [SQLi/XSS]   ││      └─────────────────┘
                     │  ├─────────────────────────────┤│
                     │  │  LRU Cache    [< 1ms]       ││
                     │  ├─────────────────────────────┤│
                     │  │  Idempotency [Replay Guard]  ││
                     │  └─────────────────────────────┘│
                     └─────────────────────────────────┘
```

---

## 💻 SDK Examples

### Node.js / TypeScript

```typescript
import { Backport } from 'backport-sdk';

const client = new Backport({
  apiKey: process.env.BACKPORT_API_KEY,
  gateway: 'https://backport-io.vercel.app'
});

// Make requests through Backport
const users = await client.get('/api/users');

// With idempotency (for payments)
const payment = await client.post('/api/checkout', {
  body: { amount: 500 },
  idempotencyKey: 'txn_12345'
});
```

### Python

```python
import backport

client = backport.Client(
    api_key="bk_live_xxx",
    gateway="https://backport-io.vercel.app"
)

# Get request (cached)
users = client.get("/api/users")

# Post with idempotency
payment = client.post("/api/checkout", 
    json={"amount": 500},
    idempotency_key="txn_12345"
)
```

### Go

```go
package main

import (
    "github.com/backport-io/backport-go"
)

func main() {
    client := backport.NewClient("bk_live_xxx")
    
    // Get request
    users, _ := client.Get("/api/users")
    
    // Post with idempotency
    payment, _ := client.Post("/api/checkout", map[string]interface{}{
        "amount": 500,
    }, backport.WithIdempotencyKey("txn_12345"))
}
=======
## What is Backport?

Backport is an **open-source API gateway** that protects your backend with a powerful WAF, rate limiting, caching, response transformation, and API mocking. No SDK required. No code changes needed. MIT Licensed.

**Point your clients to Backport. That's it.**

**Live Demo:** [backport.in](https://backport.in) - Try the interactive WAF demo on the homepage.

---

## Quick Start (30 Seconds)

### Sign up and start using Backport

1. **Create your account** at [backport.in](https://backport.in)
2. **Generate an API key** from the dashboard
3. **Point your traffic** to Backport:

```bash
# That's it!
curl https://backport.in/proxy/users \
  -H "X-API-Key: bk_your_key_here"
```

For Python, JavaScript, and other language examples, see the [API Reference](./docs/API_DOCS.md).

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
                 License: MIT | No vendor lock-in | Open Source
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
1. Sign up at [backport.in](https://backport.in)
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
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
```

---

<<<<<<< HEAD
## 📊 Comparison with Alternatives

| Feature | Backport | Kong | Cloudflare | AWS API Gateway |
|---------|----------|------|------------|-----------------|
| Setup Time | **30 seconds** | Hours | Minutes | Minutes |
| Zero Code Changes | **YES** | NO | NO | Partial |
| Built-in WAF | **YES** | Plugin needed | YES | YES |
| Built-in Idempotency | **YES** | Plugin needed | NO | NO |
| Open Source | **MIT** | Enterprise $ | NO | NO |
| Free Tier | **50,000 req/mo** | NO | Limited | Limited |
| Starting Price | **FREE** | $250/mo | $200/mo | $3.50/mi calls |
| Self-Hosted Option | **YES** | YES | NO | NO |

---

## 🎯 Use Cases

### For Video/Streaming APIs
- Rate limiting to prevent API abuse
- Caching for popular content
- DDoS protection

### For Indie Developers
- Free tier for side projects
- Zero infrastructure management
- Built-in security

### For Startups
- Scale from 0 to millions
- Advanced analytics
- Referral program rewards

### For Enterprise
- Dedicated VPC deployment
- Custom rate limits
- 24/7 phone support
- SLA guarantee

---

## 📈 Performance

```
Benchmark: API Gateway Overhead Comparison
─────────────────────────────────────────
Backport (no features):     0.2ms
Backport (with WAF):        0.5ms
Backport (with Cache):      0.1ms (cache hit)
Backport (full):            1.2ms

 competitors avg:            5-15ms
─────────────────────────────────────────
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

```bash
# Fork and clone the repo
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# Setup backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Setup frontend
cd ../frontend
npm install
npm run dev

# Setup CLI
cd ../cli
npm install
npm run build
```

---

## 📚 Documentation

Full documentation is available at [docs.backport-io.vercel.app](https://backport-io.vercel.app/docs)

- [Getting Started](https://backport-io.vercel.app/docs#quickstart)
- [Installation Guide](https://backport-io.vercel.app/docs#installation)
- [API Reference](https://backport-io.vercel.app/docs#authentication)
- [Rate Limiting](https://backport-io.vercel.app/docs#rate-limiting)
- [WAF Security](https://backport-io.vercel.app/docs#waf)
- [Caching](https://backport-io.vercel.app/docs#caching)
- [Idempotency](https://backport-io.vercel.app/docs#idempotency)

---

## 🗺️ Roadmap

- [x] Basic rate limiting
- [x] WAF engine
- [x] LRU caching
- [x] Idempotency keys
- [x] Dashboard
- [ ] Redis distributed cache
- [ ] GraphQL support
- [ ] WebSocket support
- [ ] AI-powered anomaly detection
- [ ] Multi-region deployment

---

## 📞 Support

- 📧 Email: support@backportio.com
- 💬 Discord: [Join our community](https://discord.gg/backport)
- 🐛 Issues: [GitHub Issues](https://github.com/Qureshi-1/Backport-io/issues)
- 📖 Docs: [docs.backport-io.vercel.app](https://backport-io.vercel.app/docs)

---

## ⚖️ License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Qureshi-1">Sohail Qureshi</a>
</p>
=======
## Deployment

Backport is a managed cloud service — sign up and start using it immediately. No infrastructure to set up or maintain.

| Platform | Purpose |
|----------|--------|
| Vercel | Frontend hosting |
| Render | Backend API |

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

---

## Pricing

| Plan | Price | Rate Limit | Features |
|------|-------|-----------|----------|
| Free | $0/mo | 100 req/min | Basic WAF, API key management, 3-month trial |
| Plus | $5.99/mo | 500 req/min | + Response transformation, API mocking |
| Pro | $11.99/mo | 5,000 req/min | + Custom WAF rules, webhooks |
| Enterprise | Custom | Unlimited | + SLA, team features, dedicated support |

**Open Source:** MIT Licensed. Contribute on [GitHub](https://github.com/Qureshi-1/Backport-io).

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
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc
