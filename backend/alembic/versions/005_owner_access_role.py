"""promote bootstrap account to owner

Revision ID: 005_owner_access_role
Revises: 004_user_access_roles
"""
from typing import Sequence

from alembic import op

revision: str = "005_owner_access_role"
down_revision: str | None = "004_user_access_roles"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.execute("UPDATE users SET access_role = 'owner' WHERE LOWER(email) = 'tah3in@gmail.com'")


def downgrade() -> None:
    op.execute("UPDATE users SET access_role = 'admin' WHERE LOWER(email) = 'tah3in@gmail.com'")