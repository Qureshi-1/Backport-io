<div align="center">

# ⚡ Backport

### Open-Source API Gateway — WAF, Rate Limiting, Caching & Analytics

**Shield your API in 30 seconds. Zero code changes. MIT Licensed.**

[Website](https://backport.in) · [Documentation](https://backport.in/docs) · [Compare](https://backport.in/compare) · [Community](https://github.com/Qureshi-1/Backport-io/discussions) · [Live Demo](https://backport.in)

<p>
  <a href="https://github.com/Qureshi-1/Backport-io/stargazers"><img src="https://img.shields.io/github/stars/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="Stars" /></a>
  <a href="https://github.com/Qureshi-1/Backport-io/forks"><img src="https://img.shields.io/github/forks/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="Forks" /></a>
  <a href="https://github.com/Qureshi-1/Backport-io/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Qureshi-1/Backport-io?style=flat-square&color=10b981" alt="License" /></a>
  <a href="https://backport.in"><img src="https://img.shields.io/badge/Website-Live-10b981?style=flat-square" alt="Website" /></a>
</p>

<!-- Demo video demonstrating the Backport dashboard and features -->
<img src="demo.webp" alt="Backport Demo" width="800" />

</div>

---

## 🎯 What is Backport?

**Backport** is an open-source, lightweight API Gateway built with Python (FastAPI) that sits in front of your existing backend and adds enterprise-grade security and performance features — without requiring a single line of code change.

**Point your clients to Backport. That's it.**

**Live Demo:** [backport.in](https://backport.in) - Try the interactive WAF demo on the homepage.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **🛡️ Intelligent WAF** | 17+ built-in patterns detect and block SQL Injection, XSS, Path Traversal, and more. |
| **🚦 Rate Limiting** | Protect against DDoS and bot abuse with sliding-window rate limiting. |
| **⚡ LRU Caching** | Sub-millisecond response times for repeated requests (Cache HIT ⚡). |
| **🔁 Idempotency Keys** | Safely retry POST requests without duplicate processing. Perfect for payments. |
| **📊 Real-time Dashboard** | Monitor traffic, latency, cache hits, and blocked threats in real-time. |
| **🔄 Response Transform** | Modify API responses on the fly — add/remove fields, rename keys. |
| **🧪 API Mocking** | Define mock endpoints for development and testing. |

---

## 🚀 Quick Start (30 Seconds)

### Option 1: Managed Cloud (Recommended)

1. **Create your account** at [backport.in](https://backport.in)
2. **Generate an API key** from the dashboard
3. **Point your traffic** to Backport:

```bash
# That's it!
curl https://backport.in/proxy/your-endpoint \
  -H "X-API-Key: bk_your_key_here"
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

---

## 🏗️ Architecture

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

---

## 💻 Integration Examples

### Python
```python
import requests

resp = requests.get(
    "https://backport.in/proxy/users",
    headers={"X-API-Key": "bk_your_key"}
)
print(resp.json())
```

### JavaScript / TypeScript
```javascript
const res = await fetch(
  "https://backport.in/proxy/users",
  { headers: { "X-API-Key": "bk_your_key" } }
);
const data = await res.json();
```

---

## 📚 Documentation & Resources

- [Installation Guide](./docs/INSTALLATION.md) — Docker + manual setup
- [Features Documentation](./docs/FEATURES.md) — All features explained
- [API Reference](./docs/API_DOCS.md) — Full endpoint documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) — Deployment options
- [FAQ](./docs/FAQ.md) — Frequently asked questions
- [Compare](https://backport.in/compare) — Backport vs Kong vs Cloudflare

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
```

---

## ⚖️ License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Qureshi-1">Sohail Qureshi</a>
</p>
