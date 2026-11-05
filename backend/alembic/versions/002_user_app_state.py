"""add versioned user app state

Revision ID: 002_user_app_state
Revises: 001_initial_schema
"""
from typing import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_user_app_state"
down_revision: str | None = "001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_app_states",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("state_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_app_states_user_id", "user_app_states", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_app_states_user_id", table_name="user_app_states")
    op.drop_table("user_app_states")