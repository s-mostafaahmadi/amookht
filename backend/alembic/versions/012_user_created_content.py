"""store premium and globally published user-created learning content

Revision ID: 012_user_created_content
Revises: 011_note_handwriting
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "012_user_created_content"
down_revision: str | None = "011_note_handwriting"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "user_created_content_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("topic_key", sa.String(length=160), nullable=False),
        sa.Column("skill_key", sa.String(length=40), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_global", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_created_content_owner",
        "user_created_content_entries",
        ["user_id", sa.text("updated_at DESC")],
    )
    op.create_index(
        "ix_user_created_content_global",
        "user_created_content_entries",
        ["topic_key", "skill_key", sa.text("updated_at DESC")],
        postgresql_where=sa.text("is_global = true"),
    )


def downgrade() -> None:
    op.drop_index("ix_user_created_content_global", table_name="user_created_content_entries")
    op.drop_index("ix_user_created_content_owner", table_name="user_created_content_entries")
    op.drop_table("user_created_content_entries")
