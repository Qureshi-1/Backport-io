<div align="center">

# 🛡️ Backport

### API Gateway SaaS — Shield your backend in 30 seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-backpack--io.vercel.app-emerald?style=for-the-badge&logo=vercel)](https://backpack-io.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-purple?style=for-the-badge&logo=render)](https://backpack-backend-wldo.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)

**Backport** sits between your users and your backend — protecting, caching, and rate limiting every request automatically. No SDK. No code changes. Just point your traffic through Backport.

</div>

---

## 🚀 Live URLs

| Service                 | URL                                             |
| ----------------------- | ----------------------------------------------- |
| 🌐 Frontend (Vercel)    | https://backpack-io.vercel.app                  |
| ⚙️ Backend API (Render) | https://backpack-backend-wldo.onrender.com      |
| 📖 API Docs (Swagger)   | https://backpack-backend-wldo.onrender.com/docs |

> **Note:** The free tier Render backend may take 30–60 seconds to wake up on first request.

---

## ✨ Features

| Feature                    | Description                                        |
| -------------------------- | -------------------------------------------------- |
| 🛡️ **WAF**                 | Blocks SQLi, XSS, and malicious bots automatically |
| 🚦 **Rate Limiting**       | Sliding window rate limiting per IP per minute     |
| ⚡ **Caching**             | LRU cache for GET requests (5 min TTL)             |
| 🔑 **API Key Management**  | Generate, name, and manage multiple gateways       |
| 📊 **Real-time Dashboard** | Live traffic charts, metrics, and threat counters  |
| 💳 **Billing (Razorpay)**  | Upgrade to Pro with INR payments                   |
| 🔒 **JWT Auth**            | Secure signup/login with 7-day tokens              |
| 🎁 **Refer & Earn**        | Earn one-time discount keys for referrals          |
| 🐋 **Docker Support**      | Self-host with Docker Compose in one command       |

---

## 🏗️ Architecture

```
Browser / Client
      │
      ▼
┌─────────────────────┐
│  Vercel (Next.js)   │  ← Dashboard UI + Next.js API Proxy
│  /api/proxy/*       │  ← Proxies browser requests (no CORS)
└─────────┬───────────┘
          │  Server-to-server (no CORS)
          ▼
┌─────────────────────┐
│  Render (FastAPI)   │  ← Auth, Gateway Logic, Billing
│  SQLite Persistent  │  ← User data, API keys, settings
└─────────┬───────────┘
          │  Forwarded requests
          ▼
┌─────────────────────┐
│  Your Backend API   │  ← Express / Django / FastAPI / anything
└─────────────────────┘
```

---

## ⚡ Quick Start (Local Dev)

### Prerequisites

- Node.js 18+
- Python 3.11+
- Git

### 1. Clone the repo

```bash
git clone https://github.com/Qureshi-1/Backpack-io.git
cd Backpack-io
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env with your keys

uvicorn main:app --reload --port 8080
```

Backend will be live at: `http://localhost:8080`
Swagger docs at: `http://localhost:8080/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

npm run dev
```

Frontend will be live at: `http://localhost:3000`

### 4. Or use Docker Compose (easiest)

```bash
# Run everything with one command
docker compose up -d --build
```

---

## 🚀 Deployment

### Frontend → Vercel

1. Import `Qureshi-1/Backpack-io` repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add Environment Variable:

| Key                   | Value                               |
| --------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |

4. Deploy!

### Backend → Render (Python, No Docker)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect `Qureshi-1/Backpack-io` repository
3. Configure settings:

| Setting            | Value                                          |
| ------------------ | ---------------------------------------------- |
| **Language**       | `Python 3`                                     |
| **Root Directory** | `backend`                                      |
| **Build Command**  | `pip install -r requirements.txt`              |
| **Start Command**  | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. Add a **Persistent Disk** (Disks tab):

| Setting        | Value         |
| -------------- | ------------- |
| **Name**       | `backport-db` |
| **Mount Path** | `/app/data`   |
| **Size**       | 1 GB          |

5. Add Environment Variables:

| Key                   | Value                     |
| --------------------- | ------------------------- |
| `SECRET_KEY`          | Random string (32+ chars) |
| `DB_PATH`             | `/app/data/backport.db`   |
| `RAZORPAY_KEY_ID`     | Your Razorpay key         |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret      |

---

## 🔑 Environment Variables

### Backend (Render Dashboard)

| Variable              | Required | Description                                         |
| --------------------- | -------- | --------------------------------------------------- |
| `SECRET_KEY`          | ✅       | JWT signing secret (use a long random string)       |
| `DB_PATH`             | ✅       | SQLite path — use `/app/data/backport.db` on Render |
| `RAZORPAY_KEY_ID`     | ⚠️       | Razorpay API Key ID (test or live)                  |
| `RAZORPAY_KEY_SECRET` | ⚠️       | Razorpay API Secret Key                             |

Generate a secure `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend (Vercel Dashboard)

| Variable              | Required | Description             |
| --------------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | ✅       | Your Render backend URL |

---

## 📡 API Reference

### Auth

| Method | Endpoint       | Body                | Description                              |
| ------ | -------------- | ------------------- | ---------------------------------------- |
| `POST` | `/auth/signup` | `{email, password}` | Create account, returns JWT + API key    |
| `POST` | `/auth/login`  | `{email, password}` | Login, returns JWT + API key             |
| `GET`  | `/auth/me`     | —                   | Get current user (requires Bearer token) |

### Gateway Management

| Method   | Endpoint          | Auth            | Description                  |
| -------- | ----------------- | --------------- | ---------------------------- |
| `GET`    | `/api/keys`       | JWT             | List all your API keys       |
| `POST`   | `/api/keys`       | JWT             | Create new API key/gateway   |
| `DELETE` | `/api/keys/{key}` | JWT             | Delete/deactivate a key      |
| `GET`    | `/api/settings`   | JWT + X-API-Key | Get gateway settings         |
| `POST`   | `/api/settings`   | JWT + X-API-Key | Update target URL & settings |

### Metrics

| Method | Endpoint       | Auth | Description                         |
| ------ | -------------- | ---- | ----------------------------------- |
| `GET`  | `/api/metrics` | JWT  | Total requests, cache hits, threats |
| `GET`  | `/api/traffic` | JWT  | Hourly traffic data (last 24h)      |

### Billing

| Method | Endpoint                    | Auth | Description                   |
| ------ | --------------------------- | ---- | ----------------------------- |
| `POST` | `/api/billing/create-order` | JWT  | Create Razorpay order         |
| `POST` | `/api/billing/verify`       | JWT  | Verify payment & upgrade plan |

### Proxy (Public Gateway)

```http
GET /{any-path}
X-API-Key: bk_your_api_key_here

→ Forwards to your configured target backend URL
```

---

## 💰 Pricing

| Plan            | Price   | Requests/mo | Gateways  |
| --------------- | ------- | ----------- | --------- |
| **Hobby**       | Free    | 10,000      | 1         |
| **Plus**        | ₹499/mo | 100,000     | 3         |
| **Cloud Pro**   | ₹999/mo | 1,000,000   | 10        |
| **Enterprise**  | Custom  | Unlimited   | Unlimited |
| **Self-Hosted** | Free    | Unlimited   | Unlimited |

---

## 🛠️ Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Frontend         | Next.js 14, Tailwind CSS, Framer Motion |
| Backend          | FastAPI (Python 3.11), SQLite           |
| Auth             | JWT (python-jose), bcrypt (passlib)     |
| Payments         | Razorpay                                |
| Deployment       | Vercel (frontend), Render (backend)     |
| Containerization | Docker + Docker Compose                 |

---

## 📂 Project Structure

```
Backpack-io/
├── backend/
│   ├── main.py           # FastAPI app (auth, proxy, billing)
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # For self-hosting
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── login/                # Auth pages
│   │   │   ├── signup/
│   │   │   └── api/proxy/[...path]/  # Next.js API proxy (CORS bypass)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TrafficChart.tsx
│   │   └── lib/
│   │       └── auth.ts               # Auth utilities
│   └── Dockerfile
├── render.yaml           # Render deployment config
├── docker-compose.yml    # Local dev with Docker
├── .env.example          # Environment variables template
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using FastAPI + Next.js + Docker**

[Live Demo](https://backpack-io.vercel.app) · [Report Bug](https://github.com/Qureshi-1/Backpack-io/issues) · [Request Feature](https://github.com/Qureshi-1/Backpack-io/issues)

</div>
