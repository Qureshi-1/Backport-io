# backport-io

**Shield your API in 30 seconds.** Add Rate Limiting, WAF, Caching & Idempotency to any backend — zero code changes.

[![npm version](https://img.shields.io/npm/v/backport-io?style=flat-square&color=10b981)](https://www.npmjs.com/package/backport-io)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](https://opensource.org/licenses/MIT)

## Quick Start

1. **Install the CLI globally:**
```bash
curl -sSL https://backport.in/install.sh | bash
```
Windows users (PowerShell):
```powershell
iwr -useb https://backport.in/install.ps1 | iex
```

2. **Initialize in your project:**
```bash
backport init
```

This interactive wizard will:
1. Ask for your API key (get one at [backport.in](https://backport.in))
2. Configure your backend URL
3. Create a `backport.config.json` in your project
4. Verify the gateway connection

## Commands

| Command | Description |
|---------|-------------|
| `backport init` | Initialize Backport in your project |
| `backport test` | Test gateway connection & validate API key |
| `backport status` | Check gateway health & show stats |
| `backport proxy GET /api/users` | Send a proxied request through the gateway |
| `backport whoami` | Show current configuration |

## Usage Examples

### Send a GET request through the gateway
```bash
backport proxy GET /api/users
```

### Send a POST request with JSON body
```bash
backport proxy POST /api/checkout -d '{"amount": 5000}'
```

### Send a request with custom headers
```bash
backport proxy POST /api/pay -d '{"amount": 100}' -H "Idempotency-Key:txn_123"
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

- **Website:** [backport.in](https://backport.in)
- **Documentation:** [backport.in/docs](https://backport.in/docs)
- **GitHub:** [github.com/Qureshi-1/Backport-io](https://github.com/Qureshi-1/Backport-io)
- **Dashboard:** [backport.in/dashboard](https://backport.in/dashboard)

## License

MIT © [Sohail Qureshi](https://github.com/Qureshi-1)
