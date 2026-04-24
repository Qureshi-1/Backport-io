"""Add plan tracking columns to users table

Adds plan_started_at, plan_expires_at, plan_payment_id, and plan_source
columns to the users table for proper subscription management.

Revision ID: 002_add_plan_tracking
Revises: 001_initial_schema
Create Date: 2026-04-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_add_plan_tracking"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("plan_started_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("plan_expires_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("plan_payment_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("plan_source", sa.String(), server_default="none"))


def downgrade() -> None:
    op.drop_column("users", "plan_source")
    op.drop_column("users", "plan_payment_id")
    op.drop_column("users", "plan_expires_at")
    op.drop_column("users", "plan_started_at")
