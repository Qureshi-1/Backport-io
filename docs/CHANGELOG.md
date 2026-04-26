# Changelog

All notable changes to the Backport API Gateway will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] — Current

### Added
- **OAuth Social Login** — Google and GitHub authentication with automatic account linking and CSRF-protected state parameters.
- **Teams** — Create teams, invite members by email, assign roles (owner/admin/member/viewer), switch active team context.
- **Slack & Discord Integrations** — Configure webhook-based integrations to receive real-time alerts for WAF blocks, rate limits, error spikes, backend health changes, and circuit breaker state transitions.
- **Health Monitoring** — Background thread that periodically checks each user's target backend, records uptime %, average response times, and generates alerts on state transitions (up → down, down → recovered, slow responses).
- **Auto API Documentation** — Analytics engine scans recent traffic logs every ~5 minutes to auto-discover endpoints, request/response examples, success rates, and latency stats. Export as OpenAPI 3.0 JSON.
- **Contact Sales** — Public `/api/contact-sales` endpoint for Enterprise tier inquiries.
- **Per-endpoint Rate Limiting** — Override global plan rate limits on a per-path-pattern basis.

### Changed
- WebSocket connection manager now supports multiple concurrent connections per user (multiple browser tabs).
- Circuit breaker integration alerts now include Slack/Discord notifications.
- Alert deduplication for slow-response warnings (5-minute cooldown).

---

## [2.0.0]

### Breaking Changes
- Complete architecture rewrite. All proxy logic moved to a unified `proxy.py` module with connection pooling, SSRF protection, and multi-layer request processing.
- API key system replaced. Legacy `user.api_key` column is now nullable; all new keys use the `ApiKey` model with named keys.
- WAF is now opt-in per-user (`waf_enabled` setting). Previously it was always on.
- Authentication now uses HttpOnly secure cookies instead of returning tokens in response bodies.

### Added
- **Custom WAF** — User-defined regex rules with block/log actions and severity levels.
- **Mock Responses** — Define mock endpoints with custom status codes, bodies, and headers. Used as circuit breaker fallback.
- **Response Transformations** — Add, remove, rename, or filter fields from JSON responses using glob path patterns.
- **Endpoint Configuration** — Per-endpoint rate limiting with wildcard path patterns and burst sizes.
- **Global Rate Limiting** — Plan-based (free: 100/min, plus: 500/min, pro: 5000/min).
- **Circuit Breaker** — Automatic OPEN/HALF_OPEN/CLOSED state machine with configurable failure thresholds (5 failures in 30s → open, 60s recovery timeout).
- **LRU Caching** — Redis-backed (with in-memory fallback) response caching for GET requests (5-min TTL).
- **Idempotency** — Replay protection for POST/PUT/PATCH requests via `Idempotency-Key` header.
- **Enhanced Request Logging** — Full request/response bodies, IP address, query params, and response sizes stored for each proxied request.
- **Webhooks** — User-configurable outbound webhooks with HMAC-SHA256 signatures for event notifications.
- **Security Headers** — X-Content-Type-Options, X-Frame-Options, HSTS, X-Request-ID on every response.
- **SSRF Protection** — URL validation blocks private IP ranges, link-local addresses, and cloud metadata endpoints.
- **GZip Compression** — Automatic response compression for responses > 1KB.

---

## [1.1.0]

### Added
- **Analytics Dashboard** — Full analytics with traffic timeline, status distribution, latency distribution, slowest endpoints, cache hit rates, and alert history.
- **WebSocket Real-Time Updates** — Live log entries, cache stats, rate limit warnings, and alerts pushed via WebSocket connection.
- **API Key Management** — Create multiple named API keys with plan-based limits (free: 1, plus: 3, pro: 10).
- **Alert System** — Automatic alerts for rate limit abuse, WAF spikes, error spikes, and slow endpoints.
- **Request Replay** — Replay any logged request from the dashboard for debugging.
- **Log Export** — Export request logs as JSON or CSV.

---

## [1.0.0]

### Added
- **API Proxy** — Forward requests to user-configured backend URLs with automatic header stripping.
- **Email Verification** — 6-digit OTP-based email verification via Resend.
- **Basic Authentication** — Signup, login, logout with bcrypt password hashing and JWT tokens.
- **Password Reset** — OTP-based password reset flow.
- **Dashboard UI** — Basic frontend dashboard for managing settings and viewing logs.
- **Plan System** — Free, Plus, and Pro tiers with Razorpay payment integration.
- **Feedback System** — Submit and manage user feedback with email notifications.
- **Admin Panel** — User management, plan updates, feedback review, and bootstrap admin setup.
