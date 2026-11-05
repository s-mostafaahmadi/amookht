"""store global learning content in PostgreSQL

Revision ID: 009_global_content_entries
Revises: 008
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "009_global_content_entries"
down_revision: str | None = "008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "global_content_entries",
        sa.Column("topic_key", sa.String(length=160), nullable=False),
        sa.Column("skill_key", sa.String(length=40), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("item_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("question_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.PrimaryKeyConstraint("topic_key", "skill_key", name="pk_global_content_entries"),
    )
    op.create_index("ix_global_content_entries_skill", "global_content_entries", ["skill_key"])


def downgrade() -> None:
    op.drop_index("ix_global_content_entries_skill", table_name="global_content_entries")
    op.drop_table("global_content_entries")