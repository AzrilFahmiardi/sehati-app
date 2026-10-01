"""add lab confirmation data to clinical validations

Revision ID: 3de200dbc413
Revises: a6f4c1d2e8b0
Create Date: 2026-10-01 18:41:17.550646
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '3de200dbc413'
down_revision: str | None = 'a6f4c1d2e8b0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'clinical_validations',
        sa.Column('lab_confirmation', postgresql.JSONB, nullable=True)
    )


def downgrade() -> None:
    op.drop_column('clinical_validations', 'lab_confirmation')
