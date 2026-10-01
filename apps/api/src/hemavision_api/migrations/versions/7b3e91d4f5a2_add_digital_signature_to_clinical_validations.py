"""add digital signature to clinical validations

Revision ID: 7b3e91d4f5a2
Revises: 3de200dbc413
Create Date: 2026-10-01 20:15:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '7b3e91d4f5a2'
down_revision: str | None = '3de200dbc413'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        'clinical_validations',
        sa.Column('digital_signature', postgresql.JSONB, nullable=True)
    )


def downgrade() -> None:
    op.drop_column('clinical_validations', 'digital_signature')
