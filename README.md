<div align="center">

# Backport

### Enterprise-Grade API Gateway with Built-in WAF

[Website](https://backport.in) &middot; [Live Demo](https://backport.in) &middot; [Documentation](./docs)

<img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python">
<img src="https://img.shields.io/badge/FastAPI-Latest-009688.svg" alt="FastAPI">
<img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js">
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript">
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4.svg" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" alt="Docker">
<img src="https://img.shields.io/badge/License-Proprietary-red.svg" alt="License">

</div>

---

## What is Backport?

Backport is an API gateway that protects your backend with a powerful WAF, rate limiting, caching, response transformation, and API mocking. No SDK required. No code changes needed.

Point your clients to Backport. That's it.

**Live Demo:** [backport.in](https://backport.in) - Try the interactive WAF demo on the homepage.

---

## Screenshots

### Landing Page
Backport's marketing website features a modern design with live WAF demo, pricing table, and Cloudflare comparison.

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
| **Rate Limiting** | Plan-based limits from 100 to 5,000 requests per minute |
| **Response Transformation** | Modify API responses on the fly - add/remove fields, rename keys |
| **API Mocking** | Define mock endpoints for development and testing |
| **Custom WAF Rules** | User-defined regex patterns with severity levels |
| **Webhook Notifications** | Real-time alerts for security events on Slack, Discord, or custom URLs |
| **Analytics Dashboard** | Real-time traffic, latency, threat monitoring |
| **API Key Management** | Generate, monitor, and revoke API keys |

---

## Tech Stack

### Backend
- **Language:** Python 3.10+
- **Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **Database:** SQLite (migrate to PostgreSQL for production)
- **ORM:** Prisma

### Frontend
- **Framework:** Next.js 16
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Domains:** backport.in, backport.io

---

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

cp .env.example .env
# Edit .env with your configuration

docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Manual Setup

See [INSTALLATION.md](./docs/INSTALLATION.md) for detailed setup instructions.

---

## How It Works

```
Client Request
    |
    v
[Backport Gateway]
    |
    +-- WAF Scan (17+ patterns)
    |
    +-- Rate Limit Check
    |
    +-- Forward to Your Backend
    |
    +-- Response Transformation
    |
    v
Client Response
```

**3 steps to get started:**
1. Create an account
2. Generate an API key
3. Point your traffic to Backport proxy URL

---

## Pricing

| Plan | Price | Rate Limit | Features |
|------|-------|-----------|----------|
| Free | $0/mo | 100 req/min | Basic WAF, API key management |
| Plus | $5.99/mo | 500 req/min | + Response transformation, API mocking |
| Pro | $11.99/mo | 5,000 req/min | + Custom WAF rules, webhooks |

---

## Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [Features Documentation](./docs/FEATURES.md)
- [API Reference](./docs/API_DOCS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Changelog](./docs/CHANGELOG.md)

---

## Project Stats

| Metric | Value |
|--------|-------|
| Total Files | 118 |
| Lines of Code | 9,500+ |
| Built-in WAF Patterns | 17+ |
| Proxy Overhead | <5ms |
| Setup Time | 30 seconds |

---

## License

Proprietary Software. All Rights Reserved.

See [LICENSE](./LICENSE) for details.

---

## Contact

- Website: [backport.in](https://backport.in)
- Email: sales@backport.in
