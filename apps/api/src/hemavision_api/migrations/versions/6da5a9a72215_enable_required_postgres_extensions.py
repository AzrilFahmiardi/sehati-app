"""enable required postgres extensions

Revision ID: 6da5a9a72215
Revises:
Create Date: 2026-07-29 01:38:49.698527

pgcrypto menyediakan gen_random_uuid untuk primary key. ltree menyediakan tipe
kolom hierarki organisasi, sesuai hemavision/docs/DECISION_LOG.md bagian
multi-tenancy.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "6da5a9a72215"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE EXTENSION IF NOT EXISTS ltree")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS ltree")
    op.execute("DROP EXTENSION IF EXISTS pgcrypto")
