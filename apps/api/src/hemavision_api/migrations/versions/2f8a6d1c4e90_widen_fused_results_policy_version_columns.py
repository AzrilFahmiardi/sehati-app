"""widen fused_results policy version columns

Revision ID: 2f8a6d1c4e90
Revises: 9b1c5f7a2e4d
Create Date: 2026-07-31 12:00:00.000000

fusion_policy_version dan threshold_policy_version pada
hemavision_api.modules.fusion.models.FusedResult disimpan sebagai String(32),
tetapi konstanta FUSION_POLICY_VERSION ("fusion-v1-prior-reliability-weighted",
36 karakter) dan THRESHOLD_POLICY_VERSION ("threshold-v1-youden-0.491-all-sites",
35 karakter) pada hemavision_api.modules.fusion.service melebihi batas itu,
membuat setiap penyimpanan FusedResult gagal dengan StringDataRightTruncation.
who_cutoff_version tidak diubah karena nilainya ("who-2024-v1") masih di
bawah 32 karakter.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "2f8a6d1c4e90"
down_revision: str | None = "9b1c5f7a2e4d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "fused_results",
        "fusion_policy_version",
        type_=sa.String(64),
        existing_type=sa.String(32),
        existing_nullable=False,
    )
    op.alter_column(
        "fused_results",
        "threshold_policy_version",
        type_=sa.String(64),
        existing_type=sa.String(32),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "fused_results",
        "threshold_policy_version",
        type_=sa.String(32),
        existing_type=sa.String(64),
        existing_nullable=False,
    )
    op.alter_column(
        "fused_results",
        "fusion_policy_version",
        type_=sa.String(32),
        existing_type=sa.String(64),
        existing_nullable=False,
    )
