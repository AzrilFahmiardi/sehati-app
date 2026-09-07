"""add owner_user_id to patients

Revision ID: 8a3f5e1d9c72
Revises: 2f8a6d1c4e90
Create Date: 2026-08-27 00:00:00.000000

Menautkan baris patients ke baris users lewat owner_user_id, supaya pasien
yang login kapan saja (bukan hanya langsung setelah registrasi) dapat
menemukan patient_id miliknya sendiri lewat GET /v1/patients/me. Nullable
karena pasien yang dibuat nakes lewat create_patient_for_organization tidak
punya akun login sendiri, sesuai docstring
hemavision_api.modules.patients.models.Patient.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "8a3f5e1d9c72"
down_revision: str | None = "2f8a6d1c4e90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "patients",
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_patients_owner_user_id_users",
        "patients",
        "users",
        ["owner_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_patients_owner_user_id_users", "patients", type_="foreignkey")
    op.drop_column("patients", "owner_user_id")
