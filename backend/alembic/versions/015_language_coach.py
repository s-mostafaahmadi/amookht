"""separate premium language-coach conversations

Revision ID: 015_language_coach
Revises: 014_owner_ai_providers
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "015_language_coach"
down_revision: str | None = "014_owner_ai_providers"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("ai_chat_conversations", sa.Column("kind", sa.String(24), nullable=False, server_default="owner"))
    op.create_index("ix_ai_chat_conversations_user_kind_updated", "ai_chat_conversations", ["user_id", "kind", "updated_at"])


def downgrade() -> None:
    op.drop_index("ix_ai_chat_conversations_user_kind_updated", table_name="ai_chat_conversations")
    op.drop_column("ai_chat_conversations", "kind")
