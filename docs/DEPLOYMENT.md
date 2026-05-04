# Backport - Deployment Guide

## Deployment Options

Backport can be deployed in multiple ways depending on your needs:

1. **Docker Compose** (Recommended for self-hosting)
2. **Vercel + Railway** (Frontend on Vercel, Backend on Railway)
3. **Vercel + AWS EC2** (Frontend on Vercel, Backend on EC2)
4. **Full Docker on VPS** (Single server deployment)

---

## Option 1: Docker Compose (Recommended)

### Requirements
- Server with 2GB+ RAM
- Docker and Docker Compose installed
- Domain name with SSL (optional)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# 2. Configure environment
cp .env.example .env
# Edit .env with production values:
# - DATABASE_URL=postgresql://user:pass@db:5432/backport
# - JWT_SECRET=<strong-random-string>
# - CORS_ORIGINS=https://backport.in
# - NEXT_PUBLIC_API_URL=https://api.backport.in

# 3. Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Verify
curl http://localhost:8000/health
curl http://localhost:3000
```

### Docker Compose Production Config

The production docker-compose file includes:
- Nginx reverse proxy
- SSL termination (via Let's Encrypt / Certbot)
- Auto-restart policies
- Health checks
- Log rotation

### SSL Setup with Certbot

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d backport.in -d api.backport.in

# Auto-renewal (certbot handles this automatically)
certbot renew --dry-run
```

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Frontend (Vercel)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend (Railway)

```bash
# Option A: Deploy from GitHub
# 1. Go to railway.app
# 2. New Project > Deploy from GitHub repo
# 3. Select Backport-io repo
# 4. Set root directory to "backend"
# 5. Add environment variables
# 6. Deploy

# Option B: Deploy with CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

---

## Option 3: Vercel (Frontend) + AWS EC2 (Backend)

### Backend on EC2

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.small recommended)
# 2. SSH into the instance

# 3. Install dependencies
sudo apt update
sudo apt install -y python3-pip python3-venv nginx certbot

# 4. Clone and setup
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io/backend

# 5. Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Configure environment
cp .env.example .env
# Edit with production values

# 7. Setup systemd service
sudo cp backport.service /etc/systemd/system/
sudo systemctl enable backport
sudo systemctl start backport

# 8. Setup Nginx reverse proxy
sudo cp backport.nginx /etc/nginx/sites-available/backport
sudo ln -s /etc/nginx/sites-available/backport /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 9. Setup SSL
sudo certbot --nginx -d api.backport.in
```

### Systemd Service File (backport.service)
```
[Unit]
Description=Backport API Gateway
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/Backport-io/backend
ExecStart=/var/www/Backport-io/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## Option 4: Full Docker on VPS

For a single-server setup:

```bash
# 1. Server requirements
# - Ubuntu 22.04 LTS
# - 2 vCPU, 4GB RAM minimum
# - 50GB SSD

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo apt install docker-compose-plugin

# 4. Clone and deploy
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# 5. Configure
cp .env.example .env
# Edit .env

# 6. Start
docker compose up -d --build

# 7. Setup reverse proxy (Caddy - auto SSL)
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Caddyfile
# backport.in {
#     reverse_proxy localhost:3000
# }
# api.backport.in {
#     reverse_proxy localhost:8000
# }

sudo systemctl restart caddy
```

---

## Environment Variables Checklist

Before deploying to production, ensure these are set:

| Variable | Required | Production Value |
|----------|----------|-----------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | 32+ character random string |
| `CORS_ORIGINS` | Yes | `https://backport.in` |
| `API_KEY_PREFIX` | No | `bk_live_` |
| `RATE_LIMIT_DEFAULT` | No | `100` |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.backport.in` |

---

## Post-Deployment Checklist

- [ ] Health check endpoint returns 200: `GET /health`
- [ ] Frontend loads without errors
- [ ] User signup/login works
- [ ] API key generation works
- [ ] WAF blocks test SQL injection
- [ ] Rate limiting returns 429 when exceeded
- [ ] SSL certificate is valid
- [ ] CORS is properly configured
- [ ] Database backups are scheduled
- [ ] Monitoring/logging is enabled
- [ ] Webhook notifications are tested
