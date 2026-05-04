# Backport - Features Documentation

## Overview

Backport is an enterprise-grade API Gateway that protects your backend APIs with a powerful Web Application Firewall (WAF), rate limiting, response transformation, and API mocking capabilities. It requires zero SDK integration and no backend code changes.

---

## Core Features

### 1. Web Application Firewall (WAF)

Backport includes a built-in WAF with 17+ regex-based detection patterns that protect your APIs from common attacks:

| Attack Type | Pattern Count | Severity |
|-------------|--------------|----------|
| SQL Injection | 4 patterns | Critical |
| Cross-Site Scripting (XSS) | 3 patterns | High |
| Path Traversal | 3 patterns | Critical |
| Command Injection | 3 patterns | Critical |
| LDAP Injection | 2 patterns | High |
| XXE (XML External Entity) | 2 patterns | High |

**How it works:**
- Every incoming request passes through the WAF engine
- Request body, headers, and query parameters are scanned
- Matching patterns trigger an immediate block response
- Blocked requests are logged with full details for review
- Custom rules can be added via the dashboard

### 2. Rate Limiting

Plan-based rate limiting controls the number of requests each API key can make per minute:

| Plan | Rate Limit | Price |
|------|-----------|-------|
| Free | 100 req/min | $0/month |
| Plus | 500 req/min | $5.99/month |
| Pro | 5,000 req/min | $11.99/month |

Rate limit headers are included in every response:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limits reset

### 3. API Response Transformation

Modify API responses on the fly without touching your backend code. This feature allows you to:

- **Add fields** to responses dynamically
- **Remove sensitive data** (e.g., strip internal IDs, passwords)
- **Rename keys** in response payloads
- **Filter response bodies** by path patterns
- **Transform data types** (string to number, etc.)

Use cases:
- Removing internal metadata before sending to clients
- Adding computed fields without backend changes
- Data sanitization for third-party integrations
- API versioning without maintaining multiple backends

### 4. API Mocking

Define mock endpoints in the dashboard for development and testing:

- Create mock responses for any endpoint path
- Set custom status codes and headers
- Return JSON, XML, or plain text responses
- Automatic fallback when backend is unavailable

Use cases:
- Frontend development without backend dependency
- Testing edge cases with predefined responses
- Demo environments with sample data
- Graceful degradation during backend outages

### 5. Custom WAF Rules

Beyond the built-in 17 patterns, users can define their own firewall rules:

- Regex-based pattern matching
- Per-endpoint rule assignment
- Severity levels (Low, Medium, High, Critical)
- Enable/disable individual rules without deletion
- Rule testing interface in the dashboard

### 6. Webhook Notifications

Receive real-time alerts on security events:

- **WAF Blocks**: Get notified when an attack is detected and blocked
- **Rate Limit Hits**: Alert when a client exceeds their rate limit
- **Backend Errors**: Notification when the upstream backend returns 5xx errors
- **Custom Triggers**: Define your own webhook trigger conditions

Supported integrations:
- Slack
- Discord
- Any custom URL endpoint

### 7. Analytics Dashboard

A comprehensive real-time analytics dashboard provides visibility into:

- **Traffic Charts**: Request volume over time (hourly, daily, weekly)
- **Latency Heatmaps**: Visualize response times across endpoints
- **Slow Endpoint Detection**: Automatically flag endpoints with high latency
- **Threat Alerts**: Summary of blocked attacks and their types
- **Geographic Distribution**: Request origin tracking
- **API Key Usage**: Per-key request counts and patterns

### 8. API Key Management

Full lifecycle management for API keys:

- Generate unique API keys with configurable prefixes
- Assign keys to specific plans (Free, Plus, Pro)
- Revoke or regenerate keys instantly
- View per-key usage statistics
- Set custom metadata on keys for organization

---

## Architecture Highlights

- **No SDK Required**: Clients simply point their traffic to Backport proxy URL
- **No Backend Changes**: Add an `X-API-Key` header, that's it
- **No DNS Changes**: Unlike Cloudflare, no domain DNS reconfiguration needed
- **<5ms Overhead**: Minimal latency added to proxied requests
- **Self-Hostable**: Full source code, deploy anywhere

---

## Comparison vs Alternatives

| Feature | Backport | Cloudflare | Kong | AWS API Gateway |
|---------|----------|-----------|------|-----------------|
| Response Transformation | Yes | No | Plugin | Yes |
| API Mocking | Yes | No | Plugin | No |
| Custom WAF Rules | Yes | Pro plan | Plugin | Yes |
| Per-Key Rate Limiting | Yes | No | Yes | Yes |
| Webhook Alerts | Yes | Enterprise | Plugin | CloudWatch |
| Auto API Docs | Yes | No | Plugin | Yes |
| No DNS Changes | Yes | No | N/A | N/A |
| Starting Price | Free | Free | $0 (OSS) | $3.50/mo |
| Self-Hostable | Yes | No | Yes | No |
