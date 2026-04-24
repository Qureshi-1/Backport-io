"""
Alembic Environment Configuration for Backport-io
─────────────────────────────────────────────────────────────────────────────────
This module is executed by Alembic on every `upgrade`, `downgrade`,
`revision --autogenerate`, and `stamp` command.

It:
  1. Adds the project root (parent of alembic/) to sys.path so that
     `models`, `database`, etc. are importable.
  2. Imports ALL model modules so that Base.metadata contains every table.
  3. Reads DATABASE_URL from the environment (falls back to SQLite dev URL).
  4. Provides both offline (SQL-script) and online (real DB) migration paths.
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Path setup ────────────────────────────────────────────────────────────────
# The alembic.ini lives one level above the alembic/ package directory.
# We need the *backend* package directory on sys.path so that top-level
# modules like `models`, `database`, `transform`, etc. are importable.
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# ── Alembic Config object ─────────────────────────────────────────────────────
# Provides access to the values within alembic.ini.
config = context.config

# Interpret the config file for Python logging (if configured).
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Import Base and ALL model modules ─────────────────────────────────────────
# Every model that registers with Base.metadata MUST be imported here,
# otherwise Alembic autogenerate will not detect those tables.
from database import Base           # noqa: E402

# Core models (models.py — already includes User, ApiKey, Feedback, ApiLog,
# Team, TeamMember, EndpointConfig, Alert, HealthCheck, ApiEndpoint, Integration)
import models                       # noqa: E402

# Feature-module models (each file defines additional Base-derived tables)
import transform                    # noqa: F401,E402  — TransformationRule
import mock                         # noqa: F401,E402  — MockEndpoint
import custom_waf                   # noqa: F401,E402  — CustomWafRule
import webhooks                     # noqa: F401,E402  — Webhook, WebhookLog
import teams                        # noqa: F401,E402  — Team, TeamMember (already in models but safe to re-import)
import endpoint_config              # noqa: F401,E402  — EndpointConfig (already in models but safe)

# The target metadata for autogenerate support.
target_metadata = Base.metadata

# ── Database URL from environment ─────────────────────────────────────────────
def get_url() -> str:
    """
    Resolve the database URL from environment variables, with the same
    priority order used by database.py:
      1. DATABASE_URL  (PostgreSQL or SQLite)
      2. DB_PATH       (SQLite file path for Render persistent disk)
      3. Default:      sqlite:///./backport.db
    """
    url = os.getenv("DATABASE_URL", "")

    if not url:
        db_path = os.getenv("DB_PATH", "")
        if db_path:
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            url = f"sqlite:///{db_path}"
        else:
            url = "sqlite:///./backport.db"

    # Render / legacy PostgreSQL URL fix (postgres:// -> postgresql://)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url


# ── Helpers ───────────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just a URL and not an Engine.  Calls to
    context.execute() emit the given string to the script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the context.  The
    connect_args are tuned to match the engine configuration in database.py.
    """
    url = get_url()

    # Connection arguments mirror database.py for both SQLite and PostgreSQL.
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = url

    engine = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


# ── Entry point ───────────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
