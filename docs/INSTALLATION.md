# Backport - Installation Guide

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- Docker & Docker Compose (optional, for containerized deployment)
- Git

## Quick Start (Docker)

The fastest way to run Backport is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/Qureshi-1/Backport-io.git
cd Backport-io

# 2. Copy environment template
cp .env.example .env

# 3. Edit environment variables
# Open .env and configure:
# - DATABASE_URL=sqlite:///./backport.db
# - JWT_SECRET=your-secret-key
# - API_KEY_PREFIX=bk_live_
# - PORT=8000

# 4. Start with Docker Compose
docker-compose up -d

# 5. Access the application
# Backend API: http://localhost:8000
# Frontend: http://localhost:3000
```

## Manual Setup

### Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if using Prisma or Alembic)
# alembic upgrade head

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local:
# - NEXT_PUBLIC_API_URL=http://localhost:8000
# - NEXT_PUBLIC_APP_URL=http://localhost:3000

# Start the development server
npm run dev
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./backport.db` |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `API_KEY_PREFIX` | Prefix for generated API keys | `bk_live_` |
| `PORT` | Backend server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_DEFAULT` | Default rate limit (req/min) | `100` |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) | `http://localhost:8000` |

## Troubleshooting

### Backend won't start
- Ensure Python 3.10+ is installed
- Check all environment variables are set in `.env`
- Verify virtual environment is activated
- Check port 8000 is not in use

### Frontend won't start
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check `.env.local` has correct API URL
- Ensure backend is running on port 8000

### Database errors
- For SQLite: ensure the `data/` directory exists
- Check `DATABASE_URL` format is correct
- For fresh installs, run migration commands

## Verification

After successful installation, verify everything is working:

1. Open `http://localhost:3000` in your browser
2. Sign up for a new account
3. Generate an API key from the dashboard
4. Test a sample API request through the gateway

The application should be fully functional after these steps.
