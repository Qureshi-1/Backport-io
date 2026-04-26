# Backport Enterprise Features

Enterprise-only modules for the Backport API Gateway. These features require an Enterprise license.

## Features

| Module | Description |
|--------|-------------|
| **DDoS Protection** (`ddos_protection.py`) | Advanced DDoS mitigation with adaptive rate limiting, traffic pattern analysis, and automatic throttling |
| **Advanced Analytics** (`advanced_analytics.py`) | Custom dashboards, report exports (CSV/JSON/PDF), anomaly detection, cost optimization insights |
| **SSO Authentication** (`sso.py`) | SAML 2.0, OIDC/OpenID Connect, LDAP/AD sync, and MFA support |
| **Custom Domains** (`custom_domains.py`) | Custom domain mapping, automatic SSL provisioning, domain verification, wildcard support |

## Getting Started

These modules are stubs by default. To activate Enterprise features:

1. Contact sales@backportio.com for an Enterprise license
2. Set the `BACKPORT_ENTERPRISE_KEY` environment variable
3. Configure each module via the admin dashboard or API

## License

Enterprise features are subject to the Backport Enterprise License Agreement.
