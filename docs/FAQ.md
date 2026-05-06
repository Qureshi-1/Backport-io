# Frequently Asked Questions

Everything you need to know about Backport — the open-source API gateway with WAF, rate limiting, caching, and more.

---

## General

### What is Backport?

Backport is an open-source API gateway and reverse proxy designed to sit in front of your backend services. It provides a unified layer for security (WAF), traffic management (rate limiting, circuit breaking), performance (LRU caching), and developer experience (response transformation, API mocking, webhooks). Think of it as a smart middleware that protects, optimizes, and extends your existing APIs without requiring any changes to your backend code.

### Is Backport really free?

Yes. The core open-source project is released under the **MIT License**, which means you can self-host it forever — for personal projects, in production, or within your organization — at no cost. There is also a managed cloud offering at `backport.in` that includes a free 3-month trial period, after which paid plans are available for users who prefer a fully managed experience without the overhead of self-hosting.

### Do I need to change my backend code?

No. Backport operates as a transparent reverse proxy, meaning your backend application remains completely untouched. The only change you make is on the client side: instead of sending requests directly to your backend URL (e.g., `https://api.yoursite.com`), you point them at the Backport proxy URL (e.g., `https://backport.in/proxy/your-path`). All headers, request bodies, and response payloads are forwarded as-is — unless you configure transformations.

### How is this different from Cloudflare?

Cloudflare is primarily a CDN and DNS provider that sits at the edge of your network, offering broad DDoS protection and static asset caching. Backport, on the other hand, is purpose-built for **API traffic**. It provides features that Cloudflare does not natively support — such as per-API-key rate limiting, live response transformation (modify JSON payloads on the fly), API mocking for frontend development, webhook delivery with retry logic, and granular analytics per endpoint. Backport can be used alongside Cloudflare if you need both CDN capabilities and API-specific controls.

### How is this different from Kong?

Kong is a powerful enterprise API gateway built on top of NGINX/OpenResty, typically deployed within Kubernetes clusters and managed by dedicated DevOps teams. It has a steep learning curve and requires infrastructure investment. Backport is built on **Python (FastAPI)** and is designed to be lightweight — you can go from zero to running in under 30 seconds with a single `docker-compose up` command. Backport prioritizes developer experience with a web-based dashboard, one-click configuration for WAF and rate limiting, and no Kubernetes requirement. For teams that need enterprise-grade complexity, Kong is a solid choice; for everyone else, Backport gets the job done with far less friction.

### Can I self-host Backport?

Absolutely. Backport is designed for easy self-hosting with three deployment options:

- **Docker Compose (2 minutes):** Clone the repo and run `docker-compose up`. Everything — backend, frontend, and database — starts together.
- **Manual setup (5 minutes):** Install Python 3.10+, set your environment variables, install dependencies with `pip install -r requirements.txt`, and run the FastAPI server.
- **Vercel + Render (10 minutes):** Deploy the Next.js frontend to Vercel and the FastAPI backend to Render for a fully serverless, zero-maintenance setup.

All configuration is done through environment variables and the web dashboard — no config files to edit manually.

---

## Security

### What attacks does the WAF block?

Backport's built-in Web Application Firewall detects and blocks **17 attack patterns** across six major categories:

| Category | Patterns Detected |
|----------|-------------------|
| **SQL Injection (SQLi)** | `UNION SELECT`, `OR 1=1`, `DROP TABLE`, tautology-based injections |
| **Cross-Site Scripting (XSS)** | `<script>`, `javascript:`, `onerror=`, `onload=` event handlers |
| **Path Traversal** | `../`, `%2e%2e%2f`, absolute path escapes |
| **Command Injection** | `; rm -rf`, `` `cmd` ``, `$(cmd)`, pipe-based execution |
| **LDAP Injection** | `)(\|`, wildcard-based LDAP queries |
| **XML External Entity (XXE)** | `<!ENTITY`, `DOCTYPE` declarations with external references |

The WAF inspects request bodies, query parameters, and URL paths. Blocked requests receive a `403 Forbidden` response with a JSON body explaining which rule was triggered.

### Can I add my own WAF rules?

Yes. Backport supports custom regex-based WAF rules that you can create from the dashboard. Each rule lets you define a pattern (using standard regular expression syntax), a severity level (`low`, `medium`, `high`, or `critical`), and the action to take (`block` or `log`). This is useful when your application has specific attack vectors — for example, blocking requests that contain a competitor's domain name, or detecting unusual user-agent strings associated with known botnets.

### Is my data secure?

Security is a core priority. All traffic routed through Backport uses **HTTPS/TLS encryption** by default. The proxy automatically appends security headers to every response, including `Strict-Transport-Security (HSTS)`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Content-Security-Policy`. Backport does not log or store request/response bodies — only metadata such as timestamps, status codes, response times, and source IP addresses for analytics. API keys are hashed before storage and are never returned in plain text after initial creation.

### What happens if my API key is leaked?

If you suspect your API key has been compromised, take immediate action:

1. **Delete the key** from the Backport dashboard (Settings → API Keys → Delete). This instantly revokes access for any client using that key.
2. **Generate a new key** from the same page. The new key will begin working immediately.
3. **Rotate any copies** — check your application code, environment variables, CI/CD pipelines, and documentation for references to the old key.
4. **Review your analytics** — check the dashboard for unusual traffic spikes or requests from unrecognized IP addresses around the time of the suspected leak.

Because Backport validates keys on every request, deleting a leaked key stops abuse immediately with zero propagation delay.

---

## Setup & Usage

### How do I get started?

Getting started with Backport takes three simple steps:

1. **Sign up** at [backport.in](https://backport.in) with your email address and verify your account.
2. **Generate an API key** from the dashboard (Settings → API Keys → Create New Key). You'll receive a key in the format `bk_live_xxxxxxxxxxxxx`.
3. **Update your client** to send requests through the Backport proxy URL instead of your backend directly:

```bash
# Before
curl https://api.yoursite.com/users

# After
curl https://backport.in/proxy/your-path/users \
  -H "X-API-Key: bk_live_xxxxxxxxxxxxx"
```

Your backend URL is configured in the dashboard under Settings → Backend Configuration. No code changes are needed on your server.

### What programming languages are supported?

Backport is language-agnostic — it works with **any programming language or tool that can make HTTP requests**. Since it operates as a transparent reverse proxy, your backend and clients can be written in completely different languages. Here are examples of sending requests through Backport from various languages:

```bash
# cURL
curl -H "X-API-Key: bk_live_xxxx" https://backport.in/proxy/your-path/data
```

```python
# Python (requests)
import requests
resp = requests.get(
    "https://backport.in/proxy/your-path/data",
    headers={"X-API-Key": "bk_live_xxxx"}
)
```

```javascript
// JavaScript (fetch)
const resp = await fetch("https://backport.in/proxy/your-path/data", {
  headers: { "X-API-Key": "bk_live_xxxx" }
});
```

```go
// Go (net/http)
req, _ := http.NewRequest("GET", "https://backport.in/proxy/your-path/data", nil)
req.Header.Set("X-API-Key", "bk_live_xxxx")
client.Do(req)
```

### Can I use Backport with my existing domain?

Yes, there are two approaches:

- **Direct proxy URL:** Use the Backport proxy URL as-is (e.g., `https://backport.in/proxy/your-path`). This is the fastest option and requires no DNS changes.
- **Custom domain (CNAME):** Point a subdomain (e.g., `api.yoursite.com`) to Backport using a CNAME record. On the managed cloud, custom domains are configured from the dashboard under Settings → Domains. For self-hosted setups, you can place Backport behind your own reverse proxy (NGINX, Caddy) and map it to any domain you control.

### How do I enable the WAF?

Enabling the WAF is a one-click operation from the dashboard:

1. Navigate to **Settings** in the sidebar.
2. Scroll to the **Security** section.
3. Toggle **WAF** to **ON**.

Once enabled, the WAF begins inspecting all incoming requests immediately. You can also configure whether blocked requests are logged, whether you want to receive webhook notifications for blocked requests, and whether to enable specific detection categories (e.g., disable XXE detection if your API never processes XML). The WAF can be enabled globally or on a per-endpoint basis.

### What is response transformation?

Response transformation lets you modify API responses **on the fly** as they pass through the Backport proxy, without changing any code on your backend. This is useful in many real-world scenarios:

- **Field filtering:** Strip sensitive fields (e.g., remove `password_hash` or `internal_id`) before returning responses to external clients.
- **Data enrichment:** Add computed fields (e.g., append a `cdn_url` to image records) without modifying your database queries.
- **Format conversion:** Transform backend responses into a different structure expected by a specific client (e.g., convert `snake_case` to `camelCase` for a JavaScript frontend).
- **Mocking:** Return canned responses for specific endpoints during frontend development, allowing your team to work in parallel without a running backend.

Transformations are configured in the dashboard under Endpoints → Transformations and are applied using a JSONPath-based rule system.

---

## Billing

### What are the plan limits?

Backport's managed cloud offers four tiers designed to scale with your usage:

| Plan | Requests/Minute | Price | Best For |
|------|-----------------|-------|----------|
| **Free** | 100 req/min | $0/mo | Personal projects, prototyping, learning |
| **Plus** | 500 req/min | $19/mo | Small teams, production APIs, side projects |
| **Pro** | 5,000 req/min | $79/mo | Growing startups, high-traffic applications |
| **Enterprise** | Unlimited | Custom | Large organizations, compliance requirements |

All plans include full access to WAF, rate limiting, caching, response transformation, API mocking, webhooks, and analytics. The primary differentiator is the request throughput limit. Self-hosted users have no artificial rate limits — your throughput is bounded only by your own infrastructure.

### Can I cancel anytime?

Yes. There are no long-term contracts or lock-in periods. You can cancel your subscription at any time from the dashboard (Settings → Billing → Cancel Plan). When you cancel, your plan remains active until the end of the current billing period, after which your account reverts to the Free tier. Your data, API keys, and configuration are preserved — you can upgrade again at any time without losing anything. If you're self-hosting, there is nothing to cancel — you own the software outright under the MIT license.

### Do you have overage charges?

No. Backport does **not** auto-charge for exceeding your plan's request limit. Instead, requests that exceed your allocated rate receive a `429 Too Many Requests` response with a `Retry-After` header indicating when the client should retry. This design ensures there are never any surprise charges on your bill. If you find yourself consistently hitting the limit, you can upgrade your plan from the dashboard — the change takes effect immediately and you'll be prorated for the remainder of your billing cycle.
