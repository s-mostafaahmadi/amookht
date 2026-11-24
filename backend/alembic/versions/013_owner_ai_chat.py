"""owner-only AI chat conversations and message history

Revision ID: 013_owner_ai_chat
Revises: 012_user_created_content
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "013_owner_ai_chat"
down_revision: str | None = "012_user_created_content"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_chat_conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(160), nullable=False, server_default="گفتگوی جدید"),
        sa.Column("provider", sa.String(30)),
        sa.Column("model", sa.String(120)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ai_chat_conversations_user_updated", "ai_chat_conversations", ["user_id", sa.text("updated_at DESC")])
    op.create_table(
        "ai_chat_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("ai_chat_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(30)),
        sa.Column("model", sa.String(120)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('user', 'assistant')", name="ck_ai_chat_messages_ai_chat_message_role"),
    )
    op.create_index("ix_ai_chat_messages_conversation_created", "ai_chat_messages", ["conversation_id", "created_at"])


def downgrade() -> None:
    op.drop_table("ai_chat_messages")
    op.drop_table("ai_chat_conversations")
