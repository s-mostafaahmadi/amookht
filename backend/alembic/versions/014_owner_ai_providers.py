"""owner-managed encrypted AI providers and per-chat provider selection

Revision ID: 014_owner_ai_providers
Revises: 013_owner_ai_chat
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "014_owner_ai_providers"
down_revision: str | None = "013_owner_ai_chat"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("ai_chat_conversations", sa.Column("provider_preference", sa.String(80), nullable=True))
    op.create_table(
        "ai_provider_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("base_url", sa.String(500), nullable=False),
        sa.Column("model", sa.String(160), nullable=False),
        sa.Column("api_key_encrypted", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "name", name="uq_ai_provider_configs_user_name"),
    )
    op.create_index("ix_ai_provider_configs_user_enabled", "ai_provider_configs", ["user_id", "enabled"])


def downgrade() -> None:
    op.drop_table("ai_provider_configs")
    op.drop_column("ai_chat_conversations", "provider_preference")
