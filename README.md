<div align="center">
  <h1>🎒 Backpack</h1>
  <p><b>The modern, lightweight API Gateway to secure and cache your backend seamlessly.</b></p>
  <br/>
</div>

![Dashboard Overview](https://raw.githubusercontent.com/placeholder/image/main/dashboard.png)

Backpack is a developer-friendly API Gateway designed with aesthetics and performance in mind. Built with **FastAPI** on the backend and an ultra-fast **Next.js** dashboard, Backpack proxies your traffic while providing enterprise-grade features out of the box.

## ✨ Features

- **⚡ Zero-Knowledge Proxying:** Routes traffic reliably without modifying your payloads.
- **🛡 WAF (Web Application Firewall):** Intercepts and blocks malicious payloads like SQLi and XSS before they touch your backend.
- **🚦 Sliding Window Rate Limiting:** Prevent API abuse effectively using distributed memory counters.
- **💾 LRU Caching:** Sub-millisecond in-memory caching for GET requests to drastically reduce backend load.
- **🔄 POST Idempotency:** Safely handles duplicate mutations, guaranteeing endpoints execute only once per unique request.
- **📊 Real-time Dashboard:** A gorgeous, dark-mode real-time UI to monitor traffic, cache hits, and thwarted threats.

---

## 🚀 Quick Start

### 1. Backend (FastAPI Gateway)

Make sure you have Python 3.9+ installed.

```bash
# Clone the repository
git clone https://github.com/yourusername/backpack.git
cd backpack/backend

# Create a virtual environment & install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install fastapi uvicorn httpx

# Start the gateway
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### 2. Frontend (Next.js Dashboard)

Make sure you have Node.js 18+ installed.

```bash
cd backpack/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Dashboard will be available at **`http://localhost:3000`**.

---

## 🐳 Self-Hosting (Docker)

To deploy Backpack on your own infrastructure (VPS or Cloud), deploying via Docker Compose is highly recommended. Backpack stores data securely in a local `backpack.db` SQLite file via Docker Volumes, so all configurations and generated API keys remain persistent across container restarts.

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/backpack.git
cd backpack

# Build and start all services in the background
docker-compose up --build -d
```

### Services Included

- **Backend Gateway (Port `8080`)**: The core FastAPI reverse proxy caching, enforcing WAF, idempotency, and routing traffic.
- **Frontend Dashboard (Port `3000`)**: The beautifully designed multi-tenant React (Next.js) Admin Panel where users can sign up, create API keys, view their analytics, and upgrade billing limits.
- **Dummy Target API (Port `3001`)**: An internal dummy backend provided for testing your gateway out-of-the-box before pointing it to your actual production backend.

### 💳 Built-In SaaS Features

Backpack comes with a built-in MVP Billing and Authentication system out of the box:

- **Auth**: Secure JWT-based Authentication.
- **Multi-tenant Keys**: Each user can generate and track their own API gate-keys.
- **Subscription Logic**: Dashboard users start on a Free plan (10k requests limit/month) and can upgrade to Pro directly through the dashboard.

---

## 📸 Screenshots

|                                       Overview                                       |                                Settings & Features                                 |
| :----------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: |
| ![Dashboard](https://raw.githubusercontent.com/placeholder/image/main/dashboard.png) | ![Settings](https://raw.githubusercontent.com/placeholder/image/main/settings.png) |

_(Note: Replace placeholder image URLs with actual raw image links after uploading screenshots to GitHub)._

---

## 🤝 Contributing

We love our contributors! Here's how you can help:

1. Fork the repo.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<br/>
<div align="center">
  <b>Built with ❤️ for developers.</b>
</div>
