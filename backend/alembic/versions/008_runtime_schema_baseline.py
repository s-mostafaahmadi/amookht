"""baseline for the production runtime schema already recorded as revision 008

Revision ID: 008
Revises: 005_owner_access_role

The historical 006-008 files were not retained on the server. Production is
already stamped at 008 and contains those tables, so this revision intentionally
does not replay DDL. It restores a valid Alembic chain for future migrations.
"""
from typing import Sequence

revision: str = "008"
down_revision: str | None = "005_owner_access_role"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    raise RuntimeError("Revision 008 is a production baseline and cannot be downgraded safely")