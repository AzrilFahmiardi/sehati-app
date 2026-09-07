"""add stage_images to site_results

Revision ID: 9b1c5f7a2e4d
Revises: 37276931ec84
Create Date: 2026-07-31 09:00:00.000000

Menyimpan citra base64 tiap tahap pipeline inference (raw_frame, landmarks,
roi_segmented, illumination_normalized, biomarker_heatmap) per situs, sesuai
hemavision_api.modules.inference.schemas.StageImages, sejajar dengan kolom
metrics dan handcrafted_features yang sudah ada pada site_results.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "9b1c5f7a2e4d"
down_revision: str | None = "37276931ec84"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "site_results",
        sa.Column("stage_images", postgresql.JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("site_results", "stage_images")
