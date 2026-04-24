"""Initial schema — all Backport-io tables

Creates every table required by the application, matching the exact column
definitions, types, defaults, nullability, indexes, unique constraints, and
foreign keys defined in the SQLAlchemy models spread across:

  - models.py          (User, ApiKey, Feedback, ApiLog, Team, TeamMember,
                        EndpointConfig, Alert, HealthCheck, ApiEndpoint, Integration)
  - transform.py       (TransformationRule)
  - mock.py            (MockEndpoint)
  - custom_waf.py      (CustomWafRule)
  - webhooks.py        (Webhook, WebhookLog)
  - teams.py           (Team, TeamMember — already in models.py)
  - endpoint_config.py (EndpointConfig — already in models.py)

Revision ID: 001_initial_schema
Revises: None
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ═══════════════════════════════════════════════════════════════════════════
    # 1. teams  (no FK dependency — referenced by users.current_team_id)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_teams_id", "teams", ["id"])
    op.create_index("ix_teams_slug", "teams", ["slug"], unique=True)

    # ═══════════════════════════════════════════════════════════════════════════
    # 2. users
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("api_key", sa.String(), nullable=True),
        sa.Column("plan", sa.String(), server_default="free"),
        sa.Column("target_backend_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("email_verification_token", sa.String(), nullable=True),
        sa.Column("email_verification_sent_at", sa.DateTime(), nullable=True),
        sa.Column("password_reset_token", sa.String(), nullable=True),
        sa.Column("password_reset_sent_at", sa.DateTime(), nullable=True),
        sa.Column("rate_limit_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("caching_enabled", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("idempotency_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("waf_enabled", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("oauth_provider", sa.String(), nullable=True),
        sa.Column("oauth_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("current_team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_api_key", "users", ["api_key"], unique=True)

    # ═══════════════════════════════════════════════════════════════════════════
    # 3. api_keys
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "api_keys",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("name", sa.String(), server_default="Default Gateway"),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_keys_id", "api_keys", ["id"])
    op.create_index("ix_api_keys_key", "api_keys", ["key"], unique=True)

    # ═══════════════════════════════════════════════════════════════════════════
    # 4. feedbacks
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "feedbacks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("type", sa.String(), server_default="general"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("admin_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feedbacks_id", "feedbacks", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 5. api_logs
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "api_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("api_key_id", sa.Integer(), sa.ForeignKey("api_keys.id"), nullable=True),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("was_cached", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("request_headers", sa.Text(), nullable=True),
        sa.Column("request_body", sa.Text(), nullable=True),
        sa.Column("response_size", sa.Integer(), server_default=sa.text("0")),
        sa.Column("query_params", sa.String(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_logs_id", "api_logs", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 6. team_members  (FK to teams + users)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "team_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(), server_default="member"),
        sa.Column("joined_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )
    op.create_index("ix_team_members_id", "team_members", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 7. endpoint_configs
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "endpoint_configs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("path_pattern", sa.String(), nullable=False),
        sa.Column("max_rpm", sa.Integer(), server_default=sa.text("100")),
        sa.Column("burst_size", sa.Integer(), server_default=sa.text("10")),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_endpoint_configs_id", "endpoint_configs", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 8. alerts
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("alert_type", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(), server_default="warning"),
        sa.Column("timestamp", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("details", sa.Text(), server_default="{}"),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_id", "alerts", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 9. health_checks
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "health_checks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("checked_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_health_checks_id", "health_checks", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 10. api_endpoints
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "api_endpoints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("request_headers", sa.Text(), server_default="[]"),
        sa.Column("request_body_example", sa.Text(), nullable=True),
        sa.Column("response_body_example", sa.Text(), nullable=True),
        sa.Column("avg_latency_ms", sa.Integer(), server_default=sa.text("0")),
        sa.Column("total_requests", sa.Integer(), server_default=sa.text("0")),
        sa.Column("success_rate", sa.Integer(), server_default=sa.text("100")),
        sa.Column("last_seen", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("is_starred", sa.Boolean(), server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_endpoints_id", "api_endpoints", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 11. integrations
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "integrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("name", sa.String(), server_default=""),
        sa.Column("webhook_url", sa.String(), nullable=False),
        sa.Column("events", sa.Text(), server_default="[]"),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("last_triggered_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_integrations_id", "integrations", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 12. transformation_rules  (from transform.py)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "transformation_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("path_pattern", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("config", sa.Text(), server_default="{}"),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transformation_rules_id", "transformation_rules", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 13. mock_endpoints  (from mock.py)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "mock_endpoints",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("method", sa.String(), nullable=False),
        sa.Column("path_pattern", sa.String(), nullable=False),
        sa.Column("status_code", sa.Integer(), server_default=sa.text("200")),
        sa.Column("response_body", sa.Text(), server_default="{}"),
        sa.Column("headers", sa.Text(), server_default="{}"),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mock_endpoints_id", "mock_endpoints", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 14. custom_waf_rules  (from custom_waf.py)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "custom_waf_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("pattern", sa.Text(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), server_default="medium"),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("hit_count", sa.Integer(), server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_custom_waf_rules_id", "custom_waf_rules", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 15. webhooks  (from webhooks.py)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "webhooks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("events", sa.Text(), server_default="[]"),
        sa.Column("secret", sa.String(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("last_triggered_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_webhooks_id", "webhooks", ["id"])

    # ═══════════════════════════════════════════════════════════════════════════
    # 16. webhook_logs  (from webhooks.py — FK to webhooks)
    # ═══════════════════════════════════════════════════════════════════════════
    op.create_table(
        "webhook_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("webhook_id", sa.Integer(), sa.ForeignKey("webhooks.id"), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("payload", sa.Text(), server_default="{}"),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_webhook_logs_id", "webhook_logs", ["id"])


def downgrade() -> None:
    # Drop tables in reverse dependency order.
    op.drop_table("webhook_logs")
    op.drop_table("webhooks")
    op.drop_table("custom_waf_rules")
    op.drop_table("mock_endpoints")
    op.drop_table("transformation_rules")
    op.drop_table("integrations")
    op.drop_table("api_endpoints")
    op.drop_table("health_checks")
    op.drop_table("alerts")
    op.drop_table("endpoint_configs")
    op.drop_table("team_members")
    op.drop_table("api_logs")
    op.drop_table("feedbacks")
    op.drop_table("api_keys")
    op.drop_table("users")
    op.drop_table("teams")
