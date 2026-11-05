"""add user access roles

Revision ID: 004_user_access_roles
Revises: 003_testdaf_offline_schema
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "004_user_access_roles"
down_revision: str | None = "003_testdaf_offline_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("access_role", sa.String(length=20), nullable=False, server_default="normal"))
    op.execute("UPDATE users SET access_role = 'admin' WHERE LOWER(email) = 'tah3in@gmail.com'")


def downgrade() -> None:
    op.drop_column("users", "access_role")