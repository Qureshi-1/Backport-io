# Backport - Changelog

All notable changes to Backport will be documented in this file.

## [1.0.0] - 2026-05-01

### Added
- **Core API Gateway Engine**: Full proxy engine with request forwarding and response handling
- **WAF (Web Application Firewall)**: 17+ regex-based detection patterns covering SQL Injection, XSS, Path Traversal, Command Injection, LDAP Injection, and XXE
- **Rate Limiting**: Plan-based rate limiting (Free: 100/min, Plus: 500/min, Pro: 5000/min)
- **API Response Transformation**: Modify API responses on the fly - add/remove fields, rename keys, filter bodies
- **API Mocking**: Define mock endpoints with custom responses, status codes, and headers
- **Custom WAF Rules**: User-defined regex rules with per-endpoint control and severity levels
- **API Key Management**: Full lifecycle management - generate, list, revoke, regenerate
- **Webhook Notifications**: Real-time alerts for WAF blocks, rate limit hits, backend errors
- **Analytics Dashboard**: Real-time traffic charts, latency heatmaps, threat alerts, endpoint stats
- **User Authentication**: JWT-based auth with signup, login, and session management
- **Landing Page**: Professional marketing website with features, pricing, comparison, and live WAF demo
- **Dashboard**: Full management dashboard for API keys, WAF rules, transformation rules, mocks, analytics, and settings
- **CI/CD Pipeline**: GitHub Actions configured for automated testing and deployment
- **Docker Support**: Full Docker and Docker Compose configuration for easy deployment
- **Responsive Design**: Mobile-first UI built with Tailwind CSS and modern components

### Tech Stack
- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Database**: SQLite with Prisma ORM
- **Infrastructure**: Docker, GitHub Actions CI/CD
- **Domains**: backport.in, backport.io
