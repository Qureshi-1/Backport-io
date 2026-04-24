# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Status |
|---|---|
| 1.x.x (latest) | Active support |
| < 1.0 | End of life |

## Reporting a Vulnerability

If you discover a security vulnerability in Backport, please report it responsibly.

### What to Report

- Authentication bypasses or authorization flaws
- SQL injection, XSS, SSRF, or other injection vulnerabilities
- Information disclosure or data leakage
- Denial of service vectors
- Misconfigurations that expose sensitive data

### How to Report

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Send a detailed report to the repository owner through [GitHub Security Advisories](https://github.com/Qureshi-1/Backport-io/security/advisories/new).
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)
   - Your name/handle for credit (optional)

### What to Expect

1. We will acknowledge your report within 48 hours.
2. We will investigate and validate the vulnerability.
3. We will provide an estimated timeline for the fix.
4. Once patched, we will credit you in the release notes (unless you prefer to remain anonymous).
5. We may request your assistance in verifying the fix.

### Coordinated Disclosure

We follow a coordinated disclosure process:

- Vulnerabilities are fixed before public disclosure.
- A security advisory is published on GitHub.
- The fix is included in the next release.
- Credit is given to the reporter (unless anonymized).

## Security Best Practices for Users

- Rotate your API keys regularly and restrict their scope.
- Keep your Backport instance updated to the latest version.
- Do not expose the backend API directly to the public internet without authentication.
- Review WAF rules and rate limiting configurations periodically.
- Use HTTPS in all environments.

Thank you for helping keep Backport secure.
