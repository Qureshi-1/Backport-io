import click
import uvicorn
import sys
import logging

from .config import config


@click.group()
@click.version_option(package_name="ghostapi")
def cli():
    """GhostAPI - Reverse proxy with real-time analytics and security detection."""
    pass


@cli.command()
@click.argument("target_url", required=True)
@click.option("--host", default="0.0.0.0", help="Host to bind the proxy server to.")
@click.option("--port", default=8080, type=int, help="Port to bind the proxy server to.")
@click.option("--log-level", default="info", help="Logging level (debug, info, warning, error).")
@click.option("--apikey", default="", help="Require x-ghostapi-key header for proxy access.")
def watch(target_url: str, host: str, port: int, log_level: str, apikey: str):
    """Start the GhostAPI proxy server watching a target URL."""
    config.target_url = target_url
    config.host = host
    config.port = port
    config.log_level = log_level
    config.api_key = apikey

    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    logger = logging.getLogger("ghostapi")
    logger.info("=" * 60)
    logger.info("  GhostAPI v1.0.0")
    logger.info("=" * 60)
    logger.info("")
    logger.info("  Target:     %s", target_url)
    logger.info("  Proxy:      http://%s:%d", host, port)
    logger.info("  Dashboard:  http://%s:%d/dashboard", host, port)
    if apikey:
        logger.info("  Auth:       API key protection ENABLED")
    else:
        logger.info("  Auth:       API key protection DISABLED")
    logger.info("")
    logger.info("  Proxying all requests from :%d -> %s", port, target_url)
    logger.info("=" * 60)
    logger.info("")

    uvicorn.run(
        "ghostapi.main:create_app",
        factory=True,
        host=host,
        port=port,
        log_level=log_level.lower(),
        access_log=False,
        reload=False,
    )


if __name__ == "__main__":
    cli()
