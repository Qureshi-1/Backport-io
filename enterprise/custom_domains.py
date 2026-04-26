"""
Custom Domains — Enterprise-only feature.

Provides custom domain support including:
- Custom domain mapping (api.yourdomain.com)
- Automatic SSL/TLS certificate provisioning
- Domain verification and DNS management
- Wildcard domain support

Enterprise-only feature: Contact sales@backportio.com for access.
"""


class CustomDomainManager:
    """Enterprise custom domain management.

    NOTE: This is a stub module. Full functionality requires
    an Enterprise license. Contact sales@backportio.com for access.
    """

    def __init__(self, config: dict = None):
        self._config = config or {}

    def add_domain(self, user_id: int, domain: str, target_path: str = "/proxy") -> dict:
        """Add a custom domain for a user."""
        return {"status": "unavailable", "message": "Enterprise feature not activated"}

    def remove_domain(self, user_id: int, domain: str) -> dict:
        """Remove a custom domain."""
        return {"status": "unavailable", "message": "Enterprise feature not activated"}

    def verify_domain(self, domain: str) -> dict:
        """Verify domain ownership via DNS TXT record."""
        return {"verified": False, "status": "unavailable"}

    def provision_ssl(self, domain: str) -> dict:
        """Provision SSL/TLS certificate for a domain."""
        return {"status": "unavailable", "message": "Enterprise feature not activated"}

    def list_domains(self, user_id: int) -> list:
        """List all custom domains for a user."""
        return []

    def get_dns_records(self, domain: str) -> dict:
        """Get DNS records needed to configure a custom domain."""
        return {
            "domain": domain,
            "records": [
                {"type": "CNAME", "name": domain, "value": "gateway.backport.in"},
                {"type": "TXT", "name": f"_backport.{domain}", "value": "verify=YOUR_VERIFICATION_TOKEN"},
            ],
            "status": "unavailable",
        }
