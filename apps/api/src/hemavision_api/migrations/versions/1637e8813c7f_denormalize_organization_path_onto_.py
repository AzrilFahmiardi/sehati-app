"""denormalize organization path onto membership

Revision ID: 1637e8813c7f
Revises: 364b48418521
Create Date: 2026-07-29 06:29:17.404631

Memutus lingkaran ayam dan telur pada resolusi identitas: menetapkan konteks Row
Level Security memerlukan path organisasi, tetapi organizations sendiri
dilindungi Row Level Security sehingga tidak dapat dibaca sebelum konteks itu
ada. Salinan path pada memberships, yang tidak dilindungi Row Level Security,
memutus lingkaran itu. Dijelaskan lebih rinci pada docstring
hemavision_api.modules.identity.models.Membership.

Tiga penghapusan index yang sempat terdeteksi autogenerate (ix_audit_events_resource,
ix_screenings_org_created_at, ix_screenings_patient_created_at) sengaja dibuang
dari migrasi ini, itu positif palsu akibat SQLAlchemy tidak mengenali tipe ltree
saat membandingkan skema, bukan perubahan yang dimaksud.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

import hemavision_api.core.db

revision: str = "1637e8813c7f"
down_revision: str | None = "364b48418521"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "memberships",
        sa.Column("organization_path", hemavision_api.core.db.Ltree(), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("memberships", "organization_path")
