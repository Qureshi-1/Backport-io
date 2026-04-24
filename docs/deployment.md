# Deployment Guide

This guide covers deploying the Backport API Gateway to production.

---

## Prerequisites

- **Backend**: Python 3.10+ with dependencies from `requirements.txt`
- **Frontend**: Node.js 18+ (Next.js)
- **Database**: PostgreSQL (recommended) or SQLite (development only)
- **Email**: Resend account for email verification
- **Payments**: Razorpay account (for billing)
- **OAuth**: Google Cloud Console + GitHub Developer settings (for social login)
- **Monitoring**: Optional Redis/Upstash for caching and rate limiting

---

## Environment Variables Setup

### Backend (Render)

| Variable | Required | Description | Example |
|---|---|---|---|
| `ENVIRONMENT` | Yes | Set to `production` | `production` |
| `SECRET_KEY` | Yes | JWT signing secret (min 32 chars) | `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | No | JWT algorithm (default: HS256) | `HS256` |
| `ADMIN_EMAIL` | Yes | Auto-promoted admin email | `admin@yourcompany.com` |
| `ADMIN_SECRET` | Yes | Admin panel secret key | Generate a strong random string |
| `DATABASE_URL` | Yes | PostgreSQL connection URL | `postgresql://user:pass@host:5432/dbname` |
| `PORT` | No | Server port (Render sets automatically) | `8080` |
| `FRONTEND_URL` | Yes | Your deployed frontend URL | `https://backport.in` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins | `https://backport.in` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth client ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth client secret | From GitHub Developer Settings |
| `OAUTH_STATE_SECRET` | No | OAuth state signing secret | Auto-generated if not set |
| `RESEND_API_KEY` | Yes | Resend API key for emails | `re_...` |
| `FROM_EMAIL` | Yes | Sender email (must be verified in Resend) | `onboarding@yourdomain.com` |
| `RAZORPAY_KEY_ID` | No | Razorpay key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | No | Razorpay key secret | Your secret key |
| `REDIS_URL` | No | Redis URL for caching/rate limiting | `redis://default:pass@endpoint:port` |

### Frontend (Vercel)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g., `https://backport-api.onrender.com`) |

---

## Render Deployment (Backend)

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: `Python 3`

### Step 2: Add a PostgreSQL Database

1. In your Render service, click **Add-ons** → **PostgreSQL**
2. Note the internal database URL
3. Set `DATABASE_URL` in environment variables to the internal connection string

### Step 3: Configure Environment Variables

Add all the environment variables from the table above in the Render **Environment** tab.

### Step 4: Add Persistent Disk (if using SQLite)

If you're not using PostgreSQL, add a persistent disk:

1. Click **Add-ons** → **Persistent Disk**
2. Set mount path to `/app/data`
3. Set `DB_PATH=/app/data/backport.db`

### Step 5: Deploy

Push to `main` branch. Render will auto-deploy.

---

## Vercel Deployment (Frontend)

### Step 1: Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project** → Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (or the directory containing your Next.js app)

### Step 2: Set Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`

### Step 3: Deploy

Vercel will auto-deploy on every push to `main`.

---

## Docker Deployment

### Dockerfile (Backend)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### docker-compose.yml

```yaml
services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_SECRET=${ADMIN_SECRET}
      - DATABASE_URL=postgresql://backport:backport@db:5432/backport
      - FRONTEND_URL=${FRONTEND_URL}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - FROM_EMAIL=${FROM_EMAIL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: backport
      POSTGRES_PASSWORD: backport
      POSTGRES_DB: backport
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### Running

```bash
# Create .env file with all required variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
```

---

## Production Checklist

- [ ] **SECRET_KEY**: Set a strong random key (min 32 characters)
- [ ] **ADMIN_SECRET**: Set a different strong random key
- [ ] **ENVIRONMENT**: Set to `production`
- [ ] **ADMIN_EMAIL**: Set to your actual email address
- [ ] **DATABASE_URL**: Using PostgreSQL (not SQLite)
- [ ] **FRONTEND_URL**: Matches your deployed frontend URL
- [ ] **CORS_ORIGINS**: Only includes your actual frontend domains
- [ ] **RESEND_API_KEY**: Valid Resend API key configured
- [ ] **FROM_EMAIL**: Verified sender domain in Resend
- [ ] **HTTPS**: SSL/TLS enabled (Render and Vercel provide this by default)
- [ ] **RAZORPAY**: Switch from test keys (`rzp_test_`) to live keys (`rzp_live_`)
- [ ] **OAuth**: Google/GitHub OAuth redirect URIs updated to production backend URL
- [ ] **Redis**: Configured for multi-instance caching (or documented as single-instance)
- [ ] **SMTP**: Email verification flow tested end-to-end
- [ ] **Health Check**: `/health` endpoint responding correctly
- [ ] **Error Monitoring**: Logs are accessible (Render logs or external service)
- [ ] **Auto-restart**: Application auto-restarts on crash (Render does this by default)

---

## SSL / HTTPS

Both **Render** and **Vercel** provide automatic SSL/TLS certificates via Let's Encrypt. No manual SSL configuration is needed.

The backend automatically sets the `Strict-Transport-Security` header when `ENVIRONMENT=production`.

---

## Monitoring

### Application Health

- **Health Endpoint**: `GET /health` — Returns `{ "status": "ok" }`
- **Backend Health Monitoring**: Built-in health checks run every 60 seconds per user
- **Circuit Breaker**: Automatically opens after 5 failures in 30 seconds

### Alerts & Notifications

- **Slack/Discord Integrations**: Configure via `/api/integrations` for real-time alerts
- **Alerts Dashboard**: Available in the user dashboard under Analytics

### Log Access

- **Render**: View logs in Render Dashboard → Logs tab, or use `render logs --tail`
- **Docker**: Use `docker compose logs -f backend`

### Key Metrics to Monitor

- Request latency (P50, P95, P99)
- Error rate (5xx responses)
- Cache hit rate
- WAF block rate
- Circuit breaker state transitions
- Backend health check uptime %
- WebSocket connection count

### External Monitoring (Optional)

Consider integrating with:
- **UptimeRobot** — Monitor `/health` endpoint availability
- **Sentry** — For error tracking and crash reports
- **Datadog** or **Prometheus + Grafana** — For metrics dashboards
