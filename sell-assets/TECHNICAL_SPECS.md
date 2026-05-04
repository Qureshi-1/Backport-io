# Backport - Technical Specifications

## Architecture Overview

Backport follows a monorepo structure with separate backend and frontend directories:

```
Backport-io/
├── backend/          # FastAPI (Python)
│   ├── main.py       # Entry point
│   ├── routes/       # API route handlers
│   ├── models/       # Database models
│   ├── services/     # Business logic
│   ├── middleware/    # WAF, rate limiting, auth
│   ├── utils/        # Helper functions
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # Next.js (TypeScript)
│   ├── app/          # App router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and helpers
│   ├── styles/       # Global styles
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/  # CI/CD
└── docs/             # Documentation
```

## Backend Specifications

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.10+ |
| Framework | FastAPI | Latest |
| ASGI Server | Uvicorn | Latest |
| Database | SQLite | - |
| ORM | Prisma (Python) | Latest |
| Authentication | JWT (PyJWT) | Latest |
| HTTP Client | httpx | Latest |

### Backend Modules

- **Auth Module**: User registration, login, JWT token generation and validation
- **API Key Module**: Key generation, validation, rate limit enforcement, usage tracking
- **WAF Module**: Pattern matching engine, rule management, block logging
- **Proxy Module**: Request forwarding, response handling, header management
- **Transformation Module**: JSON path-based response modification
- **Mock Module**: Endpoint matching, mock response serving
- **Analytics Module**: Request logging, aggregation, metric computation
- **Webhook Module**: Event triggering, retry logic, delivery tracking

## Frontend Specifications

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4 |
| UI Components | shadcn/ui | Latest |
| State | React hooks | 18+ |
| HTTP Client | fetch / axios | Latest |

### Frontend Pages

- **Landing Page**: Hero, Features, Pricing, Comparison (vs Cloudflare), Live WAF Demo, Footer
- **Dashboard**: Overview cards, quick stats, recent activity
- **API Keys**: Create, list, revoke keys with usage stats
- **WAF Rules**: Built-in patterns + custom rule CRUD
- **Transformations**: Response transformation rule builder
- **Mock Endpoints**: Mock API configuration
- **Analytics**: Charts, threat logs, latency heatmaps
- **Settings**: Profile, webhooks, account management

## Infrastructure

| Component | Tool |
|-----------|------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting (Current) | Vercel (frontend) + Backend server |
| Domains | backport.in, backport.io |
| SSL | Let's Encrypt / Certbot |

## Performance

- Proxy overhead: <5ms per request
- WAF scanning: <2ms per request
- Cold start (Docker): ~3 seconds
- Frontend Lighthouse Score: 90+ (estimated)
- Database queries: <10ms average (SQLite)

## Security

- JWT-based authentication with configurable expiry
- API key authentication with per-key rate limits
- WAF with 17+ built-in attack patterns
- CORS configured for specific origins
- Environment-based configuration (no hardcoded secrets)
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries via ORM)

## Scalability Path

1. **Database**: Migrate from SQLite to PostgreSQL for concurrent access
2. **Caching**: Add Redis for rate limiting counters and cached responses
3. **Workers**: Add background workers for webhook delivery and analytics processing
4. **Load Balancing**: Deploy multiple backend instances behind Nginx/Caddy
5. **CDN**: Add CDN layer for static frontend assets
