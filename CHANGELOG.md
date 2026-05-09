# Changelog

All notable changes to the Backport project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Docker Compose configuration for full-stack deployment (PostgreSQL + Redis)
- Docker Compose dev configuration for local development
- CHANGELOG.md for version tracking
- GitHub issue templates (bug report, feature request, good first issue)
- GitHub pull request template
- CI pipeline with backend tests, frontend lint/build, and CLI build

### Changed
- Honest project positioning — removed exaggerated claims from README and landing page
- Replaced biased competitor comparison with balanced "When to Choose Backport" section
- Added Project Status section to README

## [0.1.0] - 2025-04-26

### Added
- Core API proxy with reverse proxy support
- WAF engine with 17+ security patterns (SQLi, XSS, path traversal, command injection, LDAP injection, XXE)
- Custom WAF rules (user-defined regex with per-endpoint control)
- Rate limiting (token bucket, per-plan, per-endpoint)
- LRU caching with Redis/Upstash support
- Response transformation (add, remove, rename fields)
- API mocking (pattern-based mock endpoints)
- OAuth authentication (Google + GitHub)
- JWT-based API key management
- Admin dashboard (5-tab interface)
- Real-time analytics with WebSocket streaming
- Health monitoring with 24-hour status history
- Circuit breaker (automatic failover)
- Team management with RBAC (Owner, Admin, Member, Viewer)
- Webhook notifications (Slack, Discord, custom URLs)
- Audit logging with JSON/CSV export
- CLI tool for terminal management
- Next.js 16 frontend dashboard
- Blog system with Markdown support
- Changelog page
- Documentation portal
- Pricing page with multi-currency support
- Managed cloud deployment (backport.in)

[Unreleased]: https://github.com/Qureshi-1/Backport-io/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Qureshi-1/Backport-io/releases/tag/v0.1.0
