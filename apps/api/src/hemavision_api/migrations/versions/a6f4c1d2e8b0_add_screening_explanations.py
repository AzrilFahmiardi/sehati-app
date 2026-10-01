"""add_screening_explanations

Revision ID: a6f4c1d2e8b0
Revises: 9825270bad6e
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a6f4c1d2e8b0"
down_revision: str | None = "9825270bad6e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "screening_explanations",
        sa.Column("screening_id", sa.UUID(), nullable=False),
        sa.Column("audience", sa.String(length=16), nullable=False),
        sa.Column("locale", sa.String(length=16), server_default="id-ID", nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=True),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["screening_id"], ["screenings.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "screening_id",
            "audience",
            "locale",
            "prompt_version",
            name="uq_screening_explanations_cache_key",
        ),
        sa.CheckConstraint(
            "audience IN ('nakes', 'pasien')", name="ck_screening_explanations_audience"
        ),
        sa.CheckConstraint(
            "status IN ('generated', 'fallback', 'unavailable')",
            name="ck_screening_explanations_status",
        ),
    )


def downgrade() -> None:
    op.drop_table("screening_explanations")
