"""persist stylus handwriting in personal notes

Revision ID: 011_note_handwriting
Revises: 010_premium_library
"""
from typing import Sequence
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "011_note_handwriting"
down_revision: str | None = "010_premium_library"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "library_notes",
        sa.Column(
            "drawing",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("library_notes", "drawing")
