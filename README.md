<div align="center">
  <img src="https://backportio.netlify.app/logo.png" alt="Backport Logo" width="120" />
  <h1>Backport Gateway</h1>
  <p><b>Shield your API in 30 seconds. No code changes required.</b></p>

  <p>
    <a href="https://github.com/Qureshi-1/Backport-io/stargazers"><img src="https://img.shields.io/github/stars/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="Stars" /></a>
    <a href="https://github.com/Qureshi-1/Backport-io/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="License" /></a>
    <a href="https://backportio.netlify.app"><img src="https://img.shields.io/badge/Website-Live-10b981?style=flat-square" alt="Website" /></a>
  </p>
</div>

---

Most developers spend weeks building API infrastructure—rate limiters to stop bots, LRU caches to save database costs, WAFs to block malicious payloads, and idempotency keys to prevent duplicate payments.

**Backport** is a lightweight Python-based API Gateway that sits in front of your Express.js, Django, FastAPI, or Go backend and handles all of this automatically.

## ✨ Features

- **🛡️ Intelligent WAF:** Block SQL Injection and XSS before it touches your database.
- **🚦 Rate Limiting:** Sliding-window per-IP rate limiters to prevent abuse.
- **⚡ LRU Caching:** Sub-millisecond response caching for identical GET requests.
- **🔁 Idempotency:** Safely retry POST requests (like payments) without duplicate processing.
- **📊 Real-time Dashboard:** Monitor traffic, blocks, and latency live.

## 🚀 Quick Start (Docker)

You don't need to change a single line of your backend code. Just launch Backport and point your traffic to it.

```bash
# 1. Start your existing backend (e.g., Express running on port 3000)
npm run start

# 2. Start Backport Gateway pointing to your backend
docker run -p 8080:8080 -e BACKEND_URL=http://host.docker.internal:3000 qureshi/backport
```

Now, instead of sending requests to your backend directly, send them to `https://backpack-backend-wldo.onrender.com`. Backport will filter, cache, and rate-limit the traffic before forwarding it!

## 💻 Developer Experience (Fluent API Usage)

If you prefer to integrate Backport programmatically, here is how you use our SDK concepts (Dashboard generation is automatic).

### 1. Activating Rate Limiting
No backend code needed. Just set your limits in the Backport UI or via headers:
```bash
curl -H "X-API-Key: your_key" https://backpack-backend-wldo.onrender.com/api/users
# If you exceed 100 req/min, Backport instantly returns:
# HTTP/1.1 429 Too Many Requests
```

### 2. Using Idempotency (For Payments)
Send an `Idempotency-Key` header with your POST request. If the UI glitches and sends the request twice, Backport intercepts the second one.
```bash
curl -X POST https://backpack-backend-wldo.onrender.com/api/checkout \
  -H "Idempotency-Key: transaction-12345" \
  -d '{"amount": 100}'
```

### 3. Transparent Caching
For heavy GET endpoints (like `/api/analytics`), Backport caches the response in memory (LRU cache). 
```bash
curl https://backpack-backend-wldo.onrender.com/api/analytics
# First hit: 200ms
# Second hit: 2ms (served from Backport's blazing fast LRU cache)
```

## 📖 Documentation Outline

Full documentation is available at [docs.backport.dev](https://backportio.netlify.app).
1. **Introduction:** Architecture and Philosophy
2. **Getting Started:** Docker, Railway, and Render deployments
3. **Core Features:** Rate Limiting, Caching, WAF, Idempotency configurations
4. **Dashboard:** Setting up your API Keys and Domains
5. **Self-Hosting:** Environment variables and SQLite/Redis setup
6. **Contributing:** How to build locally and submit PRs

## ⚖️ License
MIT License. See `LICENSE` for more information.
