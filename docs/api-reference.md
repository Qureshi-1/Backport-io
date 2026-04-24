# API Reference

Complete reference for all Backport API Gateway endpoints.

**Base URL**: `https://backport.in` (or `http://localhost:8080` locally)

**Authentication**: Most endpoints require an `auth_token` HttpOnly cookie set by the login flow. Alternatively, you can use the `X-API-Key` header with your API key for proxy requests.

---

## Table of Contents

- [Public Endpoints](#public-endpoints)
- [Authentication](#authentication)
- [User & Account](#user--account)
- [Analytics & Monitoring](#analytics--monitoring)
- [API Keys](#api-keys)
- [Request Logs](#request-logs)
- [Proxy (Gateway)](#proxy-gateway)
- [Settings](#settings)
- [Transformations](#transformations)
- [Mock Endpoints](#mock-endpoints)
- [Custom WAF Rules](#custom-waf-rules)
- [Webhooks](#webhooks)
- [Endpoint Configuration](#endpoint-configuration)
- [Health Monitor](#health-monitor)
- [Teams](#teams)
- [Integrations (Slack/Discord)](#integrations-slackdiscord)
- [Auto API Docs](#auto-api-docs)
- [Billing](#billing)
- [Feedback](#feedback)
- [Admin](#admin)
- [WebSocket](#websocket)
- [WAF Built-in Rules](#waf-built-in-rules)
- [Response Transform Actions](#response-transform-actions)
- [SSRF Protection](#ssrf-protection)

---

## Public Endpoints

### GET `/`
Returns gateway info.

- **Auth**: None
- **Response**: `{ "name": "Backport API Gateway", "version": "2.0.0", "docs": "/docs", "health": "/health", "website": "..." }`

### GET `/health`
Health check endpoint.

- **Auth**: None
- **Response**: `{ "status": "ok", "version": "2.0.0", "gateway": "Backport" }`

### POST `/api/contact-sales`
Submit an Enterprise sales inquiry.

- **Auth**: None
- **Body**: `{ "name": string, "email": string, "company": string, "message": string }`
- **Response**: `{ "status": "success", "message": "..." }`

---

## Authentication

### POST `/api/auth/signup`
Register a new account.

- **Auth**: None
- **Body**: `{ "email": string, "password": string }`
- **Response**: `{ "message": "Account created!", "email": "...", "email_verification_required": true }`

### POST `/api/auth/login`
Login and receive auth cookie.

- **Auth**: None
- **Body**: `{ "email": string, "password": string }`
- **Response**: `{ "api_key": string, "email": string }`
- **Cookie Set**: `auth_token` (HttpOnly, Secure)

### POST `/api/auth/logout`
Clear auth cookie.

- **Auth**: Cookie
- **Response**: `{ "message": "Logged out successfully" }`

### GET `/api/auth/me`
Check current session status.

- **Auth**: Cookie
- **Response**: `{ "authenticated": true, "email": "...", "plan": "...", "is_admin": false }`

### GET `/api/auth/verify-email`
Verify email with OTP code.

- **Auth**: None (query parameter)
- **Query**: `?token=<6-digit-code>`
- **Response**: `{ "message": "Email verified successfully!", "api_key": "...", "email": "..." }`

### POST `/api/auth/resend-verification`
Request a new verification email.

- **Auth**: None
- **Body**: `{ "email": string }`
- **Response**: `{ "message": "If that email exists, a verification code has been sent." }`

### POST `/api/auth/forgot-password`
Request a password reset code.

- **Auth**: None
- **Body**: `{ "email": string }`
- **Response**: `{ "message": "If that email exists, a password reset code has been sent." }`

### POST `/api/auth/reset-password`
Reset password with code.

- **Auth**: None
- **Body**: `{ "token": string, "new_password": string }`
- **Response**: `{ "message": "Password has been successfully reset!" }`

### GET `/api/auth/ws-token`
Get a short-lived WebSocket auth token.

- **Auth**: Cookie
- **Response**: `{ "ws_token": string }`

### GET `/api/auth/google/login`
Redirect to Google OAuth consent screen.

- **Auth**: None
- **Response**: Redirect (302)

### GET `/api/auth/google/callback`
Handle Google OAuth callback.

- **Auth**: None
- **Response**: Redirect (302) to frontend dashboard

### GET `/api/auth/github/login`
Redirect to GitHub OAuth consent screen.

- **Auth**: None
- **Response**: Redirect (302)

### GET `/api/auth/github/callback`
Handle GitHub OAuth callback.

- **Auth**: None
- **Response**: Redirect (302) to frontend dashboard

---

## User & Account

### GET `/api/user/me`
Get current user profile and basic analytics.

- **Auth**: Cookie
- **Response**: `{ "id", "email", "name", "avatar_url", "oauth_provider", "api_keys", "api_key", "plan", "target_backend_url", "created_at", "is_admin", "is_verified", "analytics": { "total_requests", "cache_hits", "avg_latency", "threats_blocked" } }`

### GET `/api/user/settings`
Get user gateway settings.

- **Auth**: Cookie
- **Response**: `{ "target_backend_url", "rate_limit_enabled", "caching_enabled", "idempotency_enabled", "waf_enabled" }`

### PUT `/api/user/settings`
Update gateway settings.

- **Auth**: Cookie
- **Body**: `{ "target_backend_url"?: string, "rate_limit_enabled"?: bool, "caching_enabled"?: bool, "idempotency_enabled"?: bool, "waf_enabled"?: bool }`
- **Response**: `{ "status": "success" }`

### GET `/api/user/test-connection`
Test connectivity to configured target backend.

- **Auth**: Cookie
- **Response**: `{ "success": bool, "status_code"?: int, "error"?: string }`

### POST `/api/user/replay/{log_id}`
Replay a previously logged request.

- **Auth**: Cookie
- **Response**: `{ "status_code", "latency_ms", "response", "original_latency_ms", "headers" }`

### GET `/api/user/feedback`
Get current user's submitted feedback.

- **Auth**: Cookie
- **Response**: Array of feedback objects

---

## Analytics & Monitoring

### GET `/api/user/analytics/stats`
Get comprehensive analytics dashboard data.

- **Auth**: Cookie
- **Response**: `{ "total_requests", "cache_hits", "avg_latency", "threats_blocked", "rate_limited", "backend_errors", "status_distribution", "slowest_endpoints", "latency_distribution", "alerts", "timeline", "cache_hit_rate" }`

### GET `/api/user/analytics/slow-endpoints`
Get slowest endpoints in the last hour.

- **Auth**: Cookie
- **Response**: Array of `{ "method", "path", "avg_latency", "max_latency", "count", "severity" }`

### GET `/api/user/analytics/latency-distribution`
Get latency distribution histogram for the last hour.

- **Auth**: Cookie
- **Response**: `{ "0-50ms": n, "50-100ms": n, "100-250ms": n, "250-500ms": n, "500ms-1s": n, "1s-3s": n, "3s+": n }`

### GET `/api/user/analytics/alerts`
Get recent alerts for the user.

- **Auth**: Cookie
- **Response**: Array of `{ "id", "type", "message", "severity", "timestamp", "details", "is_read" }`

### PUT `/api/user/analytics/alerts/{alert_id}/read`
Mark an alert as read.

- **Auth**: Cookie
- **Response**: `{ "status": "success" }`

### GET `/api/user/traffic`
Get traffic chart data (15-minute window).

- **Auth**: Cookie
- **Response**: `{ "traffic_data": [{ "time", "requests" }] }`

---

## API Keys

### GET `/api/user/keys`
List all API keys.

- **Auth**: Cookie
- **Response**: Array of `{ "id", "name", "key", "created_at" }`

### POST `/api/user/keys`
Create a new API key.

- **Auth**: Cookie
- **Body**: `{ "name": string }`
- **Response**: `{ "status": "success", "key": "bk_..." }`

### DELETE `/api/user/keys/{key_id}`
Delete an API key. Cannot delete the last remaining key.

- **Auth**: Cookie
- **Response**: `{ "status": "success" }`

---

## Request Logs

### GET `/api/user/logs`
Get recent request logs (last 20).

- **Auth**: Cookie
- **Response**: Array of log entries with method, path, status, action, time, date

### GET `/api/user/logs/{log_id}/inspect`
Get full request/response details for a single log entry.

- **Auth**: Cookie
- **Response**: Full details including request_headers, request_body, response_body, ip_address, query_params

### GET `/api/user/export/json`
Export logs as JSON (last 1000).

- **Auth**: Cookie
- **Response**: Array of log objects

### GET `/api/user/export/csv`
Export logs as CSV (last 5000).

- **Auth**: Cookie
- **Response**: CSV file download (`text/csv`)

---

## Proxy (Gateway)

### `ANY /proxy/{path:path}`
The main proxy endpoint. Forwards requests to the user's configured target backend.

- **Auth**: `X-API-Key` header
- **Methods**: GET, POST, PUT, DELETE, PATCH
- **Headers**:
  - `X-API-Key` (required): Your API key
  - `X-Target-Url` (optional): Override target URL (for playground/SDK use)
  - `Idempotency-Key` (optional): For idempotent POST/PUT/PATCH requests
- **Response**: Proxied response from target backend
- **Response Headers**:
  - `X-Backport-Latency`: Proxy processing time in ms
  - `X-Backport-Cache`: `HIT` or `MISS`
  - `X-Backport-Idempotent`: `REPLAY` for idempotent replays
  - `X-Backport-Circuit`: `open-mock` when circuit breaker uses mock fallback
  - `X-Backport-Mock`: `true` when mock fallback is used
- **Error Responses**:
  - `403` — WAF blocked malicious payload
  - `413` — Request body too large (max 10MB)
  - `429` — Rate limit exceeded
  - `502` — Bad Gateway (backend communication error)
  - `503` — Circuit breaker open
  - `504` — Gateway Timeout (backend did not respond within 30s)

---

## Transformations

### POST `/api/transforms`
Create a transformation rule.

- **Auth**: Cookie
- **Body**: `{ "name": string, "path_pattern": string, "action": "add_field"|"remove_field"|"rename_field"|"filter_keys", "config": object }`
- **Response**: `{ "status": "success", "rule": { ... } }`

### GET `/api/transforms`
List all transformation rules.

- **Auth**: Cookie
- **Response**: `{ "rules": [...] }`

### PUT `/api/transforms/{rule_id}`
Update a transformation rule.

- **Auth**: Cookie
- **Body**: Partial `{ "name", "path_pattern", "action", "config" }`
- **Response**: `{ "status": "success", "rule": { ... } }`

### DELETE `/api/transforms/{rule_id}`
Delete a transformation rule.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "deleted_id": int }`

### PATCH `/api/transforms/{rule_id}/toggle`
Enable or disable a transformation rule.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "rule": { ... } }`

---

## Mock Endpoints

### POST `/api/mocks`
Create a mock endpoint.

- **Auth**: Cookie
- **Body**: `{ "method": "GET"|"POST"|..., "path_pattern": string, "status_code": int, "response_body": object, "headers": object }`
- **Response**: `{ "status": "success", "mock": { ... } }`

### GET `/api/mocks`
List all mock endpoints.

- **Auth**: Cookie
- **Response**: `{ "mocks": [...] }`

### PUT `/api/mocks/{mock_id}`
Update a mock endpoint.

- **Auth**: Cookie
- **Body**: Partial `{ "method", "path_pattern", "status_code", "response_body", "headers" }`
- **Response**: `{ "status": "success", "mock": { ... } }`

### DELETE `/api/mocks/{mock_id}`
Delete a mock endpoint.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "deleted_id": int }`

### PATCH `/api/mocks/{mock_id}/toggle`
Enable or disable a mock endpoint.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "mock": { ... } }`

---

## Custom WAF Rules

### POST `/api/custom-waf`
Create a custom WAF rule.

- **Auth**: Cookie
- **Body**: `{ "name": string, "pattern": string (regex), "action": "block"|"log", "severity": "low"|"medium"|"high"|"critical" }`
- **Response**: `{ "status": "success", "rule": { ... } }`

### GET `/api/custom-waf`
List all custom WAF rules.

- **Auth**: Cookie
- **Response**: `{ "rules": [...] }`

### GET `/api/custom-waf/stats`
Get WAF rule statistics (hit counts).

- **Auth**: Cookie
- **Response**: `{ "stats": [{ "id", "name", "hit_count", "is_enabled" }] }`

### PUT `/api/custom-waf/{rule_id}`
Update a custom WAF rule.

- **Auth**: Cookie
- **Body**: Partial `{ "name", "pattern", "action", "severity" }`
- **Response**: `{ "status": "success", "rule": { ... } }`

### DELETE `/api/custom-waf/{rule_id}`
Delete a custom WAF rule.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "deleted_id": int }`

### PATCH `/api/custom-waf/{rule_id}/toggle`
Enable or disable a custom WAF rule.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "rule": { ... } }`

---

## Webhooks

### POST `/api/webhooks`
Create a webhook.

- **Auth**: Cookie
- **Body**: `{ "url": string, "events": ["waf_block", "rate_limit", "error_5xx", "slow_endpoint", "webhook_test"] }`
- **Response**: `{ "status": "success", "webhook": { ..., "secret": string } }` (secret only returned on creation)

### GET `/api/webhooks`
List all webhooks.

- **Auth**: Cookie
- **Response**: `{ "webhooks": [...] }`

### GET `/api/webhooks/logs`
Get webhook delivery logs.

- **Auth**: Cookie
- **Response**: `{ "logs": [...] }`

### DELETE `/api/webhooks/{webhook_id}`
Delete a webhook.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "deleted_id": int }`

### PATCH `/api/webhooks/{webhook_id}/toggle`
Enable or disable a webhook.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "webhook": { ... } }`

---

## Endpoint Configuration

### POST `/api/endpoint-config`
Create per-endpoint rate limit config.

- **Auth**: Cookie
- **Body**: `{ "path_pattern": string, "max_rpm": int (1-100000), "burst_size": int (1-1000), "is_enabled": bool }`
- **Response**: `{ "status": "success", "config": { ... } }`

### GET `/api/endpoint-config`
List all endpoint configurations.

- **Auth**: Cookie
- **Response**: `{ "configs": [...] }`

### GET `/api/endpoint-config/{config_id}`
Get a specific endpoint configuration.

- **Auth**: Cookie
- **Response**: `{ "config": { ... } }`

### PUT `/api/endpoint-config/{config_id}`
Update an endpoint configuration.

- **Auth**: Cookie
- **Body**: Partial `{ "path_pattern", "max_rpm", "burst_size", "is_enabled" }`
- **Response**: `{ "status": "success", "config": { ... } }`

### DELETE `/api/endpoint-config/{config_id}`
Delete an endpoint configuration.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "deleted_id": int }`

### POST `/api/endpoint-config/{config_id}/toggle`
Toggle an endpoint configuration on/off.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "config": { ... } }`

---

## Health Monitor

### GET `/api/user/health`
Get current backend health status with 24h uptime.

- **Auth**: Cookie
- **Response**: `{ "status", "backend_url", "last_check": { "status", "response_time_ms", "status_code", "error", "checked_at" }, "uptime_24h_pct", "avg_response_time_ms_24h", "total_checks_24h", "circuit_breaker_state" }`

### GET `/api/user/health/history`
Get health check history (last 24 hours, max 500 checks).

- **Auth**: Cookie
- **Response**: `{ "backend_url", "period": "last_24h", "total_checks", "checks": [...] }`

---

## Teams

### POST `/api/teams`
Create a new team (creator becomes owner).

- **Auth**: Cookie
- **Body**: `{ "name": string }`
- **Response**: `{ "status": "success", "team": { ... } }`

### GET `/api/teams`
List teams the user is a member of.

- **Auth**: Cookie
- **Response**: `{ "teams": [...], "current_team_id": int }`

### GET `/api/teams/{team_id}`
Get team details with members.

- **Auth**: Cookie (team member)
- **Response**: `{ "team": { ..., "members": [...] } }`

### PUT `/api/teams/{team_id}`
Update team name (admin+ only).

- **Auth**: Cookie (team admin/owner)
- **Body**: `{ "name": string }`
- **Response**: `{ "status": "success", "team": { ... } }`

### DELETE `/api/teams/{team_id}`
Delete a team (owner only).

- **Auth**: Cookie (team owner)
- **Response**: `{ "status": "success", "deleted_id": int }`

### POST `/api/teams/{team_id}/invite`
Invite a member by email (admin+ only).

- **Auth**: Cookie (team admin/owner)
- **Body**: `{ "email": string }`
- **Response**: `{ "status": "success", "member": { "user_id", "email", "role" } }`

### DELETE `/api/teams/{team_id}/members/{target_user_id}`
Remove a member (admin+ only, cannot remove owner).

- **Auth**: Cookie (team admin/owner)
- **Response**: `{ "status": "success", "removed_user_id": int }`

### PATCH `/api/teams/{team_id}/members/{target_user_id}/role`
Change a member's role (owner only).

- **Auth**: Cookie (team owner)
- **Body**: `{ "role": "owner"|"admin"|"member"|"viewer" }`
- **Response**: `{ "status": "success", "member": { "user_id", "role" } }`

### PUT `/api/teams/{team_id}/switch`
Switch active team context.

- **Auth**: Cookie (team member)
- **Response**: `{ "status": "success", "current_team_id": int }`

---

## Integrations (Slack/Discord)

### POST `/api/integrations`
Create a new integration. The webhook URL is validated and tested before creation.

- **Auth**: Cookie
- **Body**: `{ "type": "slack"|"discord", "name": string, "webhook_url": string, "events": string[] }`
- **Supported Events**: `waf_block`, `rate_limit_exceeded`, `error_spike`, `backend_down`, `backend_recovered`, `slow_endpoint`, `circuit_breaker_open`, `circuit_breaker_closed`
- **Response**: Integration object (webhook_url masked)

### GET `/api/integrations`
List all integrations.

- **Auth**: Cookie
- **Response**: Array of integration objects (webhook URLs hidden)

### GET `/api/integrations/{integration_id}`
Get a single integration (webhook URL masked).

- **Auth**: Cookie
- **Response**: Integration object

### PUT `/api/integrations/{integration_id}`
Update an integration.

- **Auth**: Cookie
- **Body**: Partial `{ "name", "webhook_url", "events", "is_enabled" }`
- **Response**: Integration object

### DELETE `/api/integrations/{integration_id}`
Delete an integration.

- **Auth**: Cookie
- **Response**: `{ "message": "Integration deleted successfully" }`

### PATCH `/api/integrations/{integration_id}/toggle`
Enable or disable an integration.

- **Auth**: Cookie
- **Response**: `{ "id", "is_enabled", "message" }`

### POST `/api/integrations/{integration_id}/test`
Send a test alert to an integration.

- **Auth**: Cookie
- **Response**: `{ "message": "Test alert sent successfully", "type": "slack"|"discord" }`

---

## Auto API Docs

### GET `/api/docs/auto`
List all auto-discovered API endpoints with stats.

- **Auth**: Cookie
- **Response**: Array of `{ "id", "method", "path", "description", "avg_latency_ms", "total_requests", "success_rate", "last_seen", "is_starred" }`

### GET `/api/docs/auto/{endpoint_id}`
Get full details for a single discovered endpoint.

- **Auth**: Cookie
- **Response**: Endpoint with request headers, request/response body examples

### POST `/api/docs/auto/generate`
Force re-generation of API docs from recent logs.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "message": "..." }`

### PUT `/api/docs/auto/{endpoint_id}`
Update endpoint description and examples.

- **Auth**: Cookie
- **Body**: `{ "description"?: string, "request_body_example"?: string, "response_body_example"?: string }`
- **Response**: `{ "status": "success", "id": int }`

### PATCH `/api/docs/auto/{endpoint_id}/star`
Toggle starred status for an endpoint.

- **Auth**: Cookie
- **Response**: `{ "status": "success", "is_starred": bool }`

### GET `/api/docs/auto/export/openapi`
Export discovered endpoints as OpenAPI 3.0 JSON.

- **Auth**: Cookie
- **Response**: OpenAPI 3.0 specification JSON

---

## Billing

### GET `/api/billing/plan`
Get current plan info.

- **Auth**: Cookie
- **Response**: `{ "plan": string, "email": string, "requests_used": int }`

### POST `/api/billing/create-order`
Create a Razorpay payment order.

- **Auth**: Cookie
- **Body**: `{ "plan_id": "plus"|"pro"|"enterprise" }`
- **Response**: `{ "order_id", "amount", "currency", "key_id", "plan_id" }`

### POST `/api/billing/verify`
Verify Razorpay payment and activate plan.

- **Auth**: Cookie
- **Body**: `{ "razorpay_order_id": string, "razorpay_payment_id": string, "razorpay_signature": string, "plan_id": string }`
- **Response**: `{ "status": "success", "plan": string }`

---

## Feedback

### POST `/api/feedback`
Submit feedback.

- **Auth**: Cookie
- **Body**: `{ "type": "bug"|"feature"|"improvement"|"general", "message": string, "rating"?: int }`
- **Response**: `{ "status": "success" }`

### GET `/api/feedback`
List all feedback (admin only).

- **Auth**: Cookie (admin)
- **Response**: Array of feedback objects

### PUT `/api/feedback/{id}/status`
Update feedback status (admin only).

- **Auth**: Cookie (admin)
- **Body**: `{ "status": string, "admin_comment"?: string }`
- **Response**: `{ "status": "success" }`

---

## Admin

### GET `/api/admin/stats`
Get platform-wide statistics.

- **Auth**: Cookie (admin)
- **Response**: `{ "total_users", "total_requests", "pending_feedbacks", "plan_distribution" }`

### GET `/api/admin/users`
List users (last 100).

- **Auth**: Cookie (admin)
- **Response**: Array of `{ "id", "email", "plan", "is_admin", "created_at" }`

### POST `/api/admin/update-plan`
Update a user's plan.

- **Auth**: Cookie (admin)
- **Body**: `{ "email": string, "plan": string }`
- **Response**: `{ "status": "success", "message": "..." }`

### GET `/api/admin/feedbacks`
List all feedbacks.

- **Auth**: Cookie (admin)
- **Response**: Array of feedback objects

### POST `/api/admin/bootstrap`
Grant admin privileges to a user (requires admin secret).

- **Auth**: None
- **Body**: `{ "email": string, "secret": string }`
- **Response**: `{ "status": "success", "message": "..." }`

### POST `/api/admin/delete-user`
Delete a user and all related data (requires admin secret).

- **Auth**: Cookie (admin)
- **Body**: `{ "email": string, "secret": string }`
- **Response**: `{ "status": "deleted", "message": "..." }`

### POST `/api/admin/resend-verify`
Force-resend verification email (requires admin secret).

- **Auth**: Cookie (admin)
- **Body**: `{ "email": string, "secret": string }`
- **Response**: `{ "status": "sent"|"failed", "message": "..." }`

---

## WebSocket

### WS `/ws/{token}`
Real-time event stream. Connect with a JWT token obtained from `/api/auth/ws-token`.

- **Auth**: JWT token in URL path
- **Message Types** (server → client):
  - `connected` — Connection established
  - `log_entry` — New request log entry
  - `alert` — New alert triggered
  - `health_check` — Health check result
  - `rate_limit_warning` — Approaching rate limit (80%)
  - `cache_stats` — Cache hit/miss event
  - `team_invite` — Team invitation received
- **Message Types** (client → server):
  - `ping` — Keep-alive ping, server responds with `pong`

---

## Rate Limits

| Plan | Requests/Minute |
|------|----------------|
| Free | 100 |
| Plus | 500 |
| Pro | 5,000 |
| Enterprise | Custom |

Rate limits can be overridden per-endpoint using Endpoint Configuration.

## WAF Built-in Rules

The gateway includes 16 built-in regex patterns that are checked against the combined request body, path, and query string. When WAF is enabled for a user, any matching pattern results in an immediate `403` response.

| Category | Patterns | Description | Example Payload |
|----------|----------|-------------|-----------------|
| SQL Injection | 5 | Detects `UNION SELECT`, `DROP TABLE`, `INSERT INTO`, `UPDATE SET`, `DELETE FROM`, `ALTER`, `CREATE`, `TRUNCATE`, `EXEC`, `xp_cmdshell`, tautology attacks (`1=1`), and comment-based injection (`--`, `/* */`) | `1' OR '1'='1' --` |
| XSS (Cross-Site Scripting) | 4 | Detects `<script>` tags, event handlers (`onerror`, `onload`, `onclick`, `onmouseover`, etc.), `javascript:`/`vbscript:`/`data:text/html` URIs, and dangerous HTML elements (`iframe`, `object`, `embed`, `img` with event handlers) | `<script>alert('xss')</script>` |
| Path Traversal | 2 | Detects directory traversal sequences (`../`, `..\\`), URL-encoded variants (`%2e%2e%2f`, `%2e%2e/`), and access to sensitive system paths (`/etc/passwd`, `/etc/shadow`, `/proc/self/`, `/dev/null`) | `../../../../etc/passwd` |
| Command Injection | 3 | Detects semicolon-prefixed commands (`; ls`, `; rm`), pipe-prefixed commands (`| cat`, `| bash`), backtick execution (`` `whoami` ``), and subshell execution (`$(whoami)`) | `; ls -la` |
| LDAP Injection | 1 | Detects LDAP metacharacter abuse including unbalanced parentheses `)(`, wildcards `*`, backslashes `\\`, and logical operators `|` in LDAP query payloads | `admin)(&(password=*))` |
| XXE (XML External Entity) | 1 | Detects `<!DOCTYPE ... SYSTEM>` declarations and `<!ENTITY>` definitions used to perform XML External Entity attacks | `<!DOCTYPE foo SYSTEM "file:///etc/passwd">` |

> **Note**: These patterns operate on the lowercase concatenation of `{body} {path} {query}`. They are case-insensitive. In addition to these built-in rules, users can create [Custom WAF Rules](#custom-waf-rules) with their own regex patterns.

---

## Response Transform Actions

Transformation rules modify JSON response bodies before they are returned to the client. Rules are matched by `path_pattern` (supports glob/wildcard syntax via `fnmatch`) and applied only to `200` responses with `Content-Type: application/json`.

All transformations support both `dict` (single JSON object) and `list` (array of objects) response bodies.

| Action Type | Description | Config Schema | Example |
|-------------|-------------|---------------|---------|
| `add_field` | Adds a new field with a static value to each object in the response body | `{ "key": string, "value": any }` | `{ "key": "gateway_version", "value": "2.0.0" }` |
| `remove_field` | Removes one or more fields from each object in the response body | `{ "keys": string[] }` | `{ "keys": ["internal_id", "debug_info"] }` |
| `rename_field` | Renames a single field in each object in the response body. If the source field does not exist, no change is made | `{ "from": string, "to": string }` | `{ "from": "old_name", "to": "new_name" }` |
| `filter_keys` | Keeps only the specified keys in each object, removing all others (whitelist filter) | `{ "keys": string[] }` | `{ "keys": ["id", "name", "email"] }` |

---

## SSRF Protection

The proxy enforces Server-Side Request Forgery (SSRF) protection by validating all target backend URLs before forwarding requests. Blocked requests receive a `400` response.

**Blocked Hostnames:**

- `localhost`
- `metadata.google.internal`
- `metadata.google.com`
- `169.254.169.254` (AWS/GCP/Azure metadata endpoint)
- `instance-data`
- `metadata`

**Blocked IP Ranges:**

| Range | Purpose |
|-------|---------|
| `127.0.0.0/8` | Loopback |
| `10.0.0.0/8` | Private Class A |
| `172.16.0.0/12` | Private Class B |
| `192.168.0.0/16` | Private Class C |
| `169.254.0.0/16` | Link-local (cloud metadata) |
| `0.0.0.0/8` | "This" network (RFC 1122) |
| `100.64.0.0/10` | Carrier-grade NAT |
| `198.18.0.0/15` | Benchmark testing |
| `::1/128` | IPv6 loopback |
| `fc00::/7` | IPv6 private |
| `fe80::/10` | IPv6 link-local |
| `::ffff:0:0/96` | IPv4-mapped IPv6 |

Only `http://` and `https://` schemes are allowed. Hostname DNS resolution is performed at request time to prevent DNS rebinding attacks.

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "detail": "Error description here"
}
```

HTTP status codes: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 429 (Rate Limited), 500 (Internal Server Error), 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout).
