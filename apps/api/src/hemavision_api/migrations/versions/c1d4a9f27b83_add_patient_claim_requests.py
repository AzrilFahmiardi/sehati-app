"""add patient_claim_requests

Revision ID: c1d4a9f27b83
Revises: 8a3f5e1d9c72
Create Date: 2026-08-28 00:00:00.000000

Menyimpan permintaan menautkan akun pasien yang registrasi mandiri ke baris
patients lama yang dibuat nakes untuk NIK yang sama, sesuai docstring
hemavision_api.modules.patients.models.PatientClaimRequest. Tidak dilindungi
Row Level Security, mengikuti pola dsar_requests dan emergency_access_grants,
karena permintaan ini secara desain melintasi dua organisasi.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c1d4a9f27b83"
down_revision: str | None = "8a3f5e1d9c72"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CLAIM_STATUSES = ("offered", "pending", "approved", "rejected")


def upgrade() -> None:
    op.create_table(
        "patient_claim_requests",
        sa.Column("patient_id", sa.UUID(), nullable=False),
        sa.Column("requester_user_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="offered", nullable=False),
        sa.Column("decided_by_user_id", sa.UUID(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.CheckConstraint(
            f"status IN {CLAIM_STATUSES!r}", name=op.f("ck_patient_claim_requests_status")
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name=op.f("fk_patient_claim_requests_patient_id_patients"),
        ),
        sa.ForeignKeyConstraint(
            ["requester_user_id"],
            ["users.id"],
            name=op.f("fk_patient_claim_requests_requester_user_id_users"),
        ),
        sa.ForeignKeyConstraint(
            ["decided_by_user_id"],
            ["users.id"],
            name=op.f("fk_patient_claim_requests_decided_by_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_patient_claim_requests")),
    )


def downgrade() -> None:
    op.drop_table("patient_claim_requests")
