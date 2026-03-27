# backport-io

**Shield your API in 30 seconds.** Add Rate Limiting, WAF, Caching & Idempotency to any backend — zero code changes.

[![npm version](https://img.shields.io/npm/v/backport-io?style=flat-square&color=10b981)](https://www.npmjs.com/package/backport-io)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](https://opensource.org/licenses/MIT)

## Quick Start

```bash
npx backport-io init
```

This interactive wizard will:
1. Ask for your API key (get one at [backport-io.vercel.app](https://backport-io.vercel.app))
2. Configure your backend URL
3. Create a `backport.config.json` in your project
4. Verify the gateway connection

## Commands

| Command | Description |
|---------|-------------|
| `npx backport-io init` | Initialize Backport in your project |
| `npx backport-io test` | Test gateway connection & validate API key |
| `npx backport-io status` | Check gateway health & show stats |
| `npx backport-io proxy GET /api/users` | Send a proxied request through the gateway |
| `npx backport-io whoami` | Show current configuration |

## Usage Examples

### Send a GET request through the gateway
```bash
npx backport-io proxy GET /api/users
```

### Send a POST request with JSON body
```bash
npx backport-io proxy POST /api/checkout -d '{"amount": 5000}'
```

### Send a request with custom headers
```bash
npx backport-io proxy POST /api/pay -d '{"amount": 100}' -H "Idempotency-Key:txn_123"
```

## What Backport Does

Backport is a reverse-proxy gateway that sits in front of your backend:

```
Client → Backport Gateway → Your Backend
              ↓
    ✅ Rate Limiting (60 req/min)
    🛡️ WAF (SQLi, XSS, Path Traversal)
    ⚡ LRU Caching (sub-ms responses)
    🔁 Idempotency (prevent duplicate POSTs)
```

**Zero code changes to your backend.** Just point your traffic through Backport.

## Links

- **Website:** [backport-io.vercel.app](https://backport-io.vercel.app)
- **Documentation:** [backport-io.vercel.app/docs](https://backport-io.vercel.app/docs)
- **GitHub:** [github.com/Qureshi-1/Backport-io](https://github.com/Qureshi-1/Backport-io)
- **Dashboard:** [backport-io.vercel.app/dashboard](https://backport-io.vercel.app/dashboard)

## License

MIT © [Sohail Qureshi](https://github.com/Qureshi-1)
