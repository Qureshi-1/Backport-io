# Backport - API Documentation

## Base URL

```
Production: https://api.backport.in
Development: http://localhost:8000
```

## Authentication

All API requests require an `X-API-Key` header:

```
X-API-Key: bk_live_xxxxxxxxxxxx
```

---

## Authentication Endpoints

### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": "usr_xxxxxxxxxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "free",
  "created_at": "2026-05-01T10:00:00Z"
}
```

### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "usr_xxxxxxxxxxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "free"
  }
}
```

---

## API Key Management

### POST /api/keys
Generate a new API key.

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "name": "Production API Key",
  "plan": "pro"
}
```

**Response (201):**
```json
{
  "id": "key_xxxxxxxxxxxx",
  "name": "Production API Key",
  "key": "bk_live_xxxxxxxxxxxx",
  "plan": "pro",
  "rate_limit": 5000,
  "created_at": "2026-05-01T10:00:00Z",
  "status": "active"
}
```

> **Important:** The full API key is only shown once at creation time.

### GET /api/keys
List all API keys for the authenticated user.

**Response (200):**
```json
{
  "keys": [
    {
      "id": "key_xxxxxxxxxxxx",
      "name": "Production API Key",
      "key_preview": "bk_live_****xxxx",
      "plan": "pro",
      "rate_limit": 5000,
      "requests_today": 1247,
      "status": "active",
      "created_at": "2026-05-01T10:00:00Z"
    }
  ]
}
```

### DELETE /api/keys/:id
Revoke an API key.

**Response (200):**
```json
{
  "message": "API key revoked successfully"
}
```

---

## Proxy Endpoint (Main Gateway)

### ANY /proxy/:path
The main proxy endpoint that forwards requests to your backend after applying WAF, rate limiting, and transformations.

**Headers Required:**
```
X-API-Key: bk_live_xxxxxxxxxxxx
X-Backend-URL: https://your-backend.com (or configured in dashboard)
```

**How it works:**
1. Request arrives at Backport
2. WAF scans request body, headers, and query parameters
3. Rate limit is checked for the API key
4. Request is forwarded to the configured backend
5. Response transformation is applied (if rules exist)
6. Response is returned to the client

**Rate Limit Headers (included in every response):**
```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4753
X-RateLimit-Reset: 1714521600
```

**WAF Block Response (403):**
```json
{
  "error": "Request blocked by WAF",
  "rule_id": "waf_sql_001",
  "attack_type": "sql_injection",
  "details": "SQL injection pattern detected in query parameter 'id'",
  "timestamp": "2026-05-01T10:00:00Z"
}
```

**Rate Limit Exceeded Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "limit": 5000,
  "remaining": 0,
  "reset_at": "2026-05-01T11:00:00Z"
}
```

---

## WAF Rules Management

### GET /api/waf/rules
List all WAF rules.

### POST /api/waf/rules
Create a custom WAF rule.

**Request Body:**
```json
{
  "name": "Block Admin Access",
  "pattern": "/admin",
  "field": "path",
  "severity": "critical",
  "action": "block",
  "enabled": true
}
```

### PUT /api/waf/rules/:id
Update an existing WAF rule.

### DELETE /api/waf/rules/:id
Delete a custom WAF rule.

---

## Response Transformation Rules

### GET /api/transformations
List all transformation rules.

### POST /api/transformations
Create a transformation rule.

**Request Body:**
```json
{
  "name": "Remove Internal Fields",
  "path_pattern": "/api/users/*",
  "operations": [
    {
      "type": "remove",
      "field": "internal_id"
    },
    {
      "type": "remove",
      "field": "password_hash"
    },
    {
      "type": "rename",
      "from": "usr_name",
      "to": "username"
    }
  ],
  "enabled": true
}
```

---

## Mock Endpoints

### GET /api/mocks
List all mock endpoints.

### POST /api/mocks
Create a mock endpoint.

**Request Body:**
```json
{
  "path": "/api/products",
  "method": "GET",
  "status_code": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "products": [
      {"id": 1, "name": "Sample Product", "price": 29.99}
    ]
  },
  "enabled": true
}
```

---

## Analytics

### GET /api/analytics/overview
Get analytics overview for the authenticated user.

**Query Parameters:**
- `period`: `24h`, `7d`, `30d` (default: `7d`)

**Response (200):**
```json
{
  "total_requests": 45230,
  "blocked_requests": 187,
  "avg_latency_ms": 23,
  "p95_latency_ms": 45,
  "unique_keys": 12,
  "top_endpoints": [
    {"path": "/api/users", "requests": 12340, "avg_latency": 18},
    {"path": "/api/orders", "requests": 8920, "avg_latency": 32},
    {"path": "/api/products", "requests": 6540, "avg_latency": 15}
  ],
  "threat_summary": {
    "sql_injection": 89,
    "xss": 45,
    "path_traversal": 32,
    "command_injection": 21
  }
}
```

### GET /api/analytics/threats
Get detailed threat log.

### GET /api/analytics/latency
Get latency analytics and heatmap data.

---

## Webhooks

### GET /api/webhooks
List all webhook configurations.

### POST /api/webhooks
Create a webhook.

**Request Body:**
```json
{
  "url": "https://hooks.slack.com/services/xxx",
  "events": ["waf_block", "rate_limit_hit", "backend_error"],
  "enabled": true
}
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (WAF blocked) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway (backend unreachable) |
| 503 | Service Unavailable |
