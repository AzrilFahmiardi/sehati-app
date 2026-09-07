"""add mandiri organization kind and seed pseudo org

Revision ID: 37276931ec84
Revises: 1637e8813c7f
Create Date: 2026-07-30 19:53:26.496306

Pasien yang mendaftar sendiri lewat web tidak berasal dari fasilitas kesehatan
manapun, tetapi Organization.organization_id pada Membership dan Patient tetap
NOT NULL. Migrasi ini menambah kind mandiri dan menyediakan satu organisasi
pseudo bernama HemaVision Mandiri untuk menampung keanggotaan dan baris
patients milik pasien self-service, sesuai
hemavision/docs/adr/004-identity-platform.md bagian Per Persona yang direvisi.

Id organisasi ini ditetapkan tetap (bukan gen_random_uuid bawaan), karena
organizations dilindungi Row Level Security dan permintaan registrasi pasien
belum memiliki konteks RLS apa pun untuk membacanya kembali. Nilai tetap ini
dirujuk langsung sebagai konstanta di
hemavision_api.modules.patients.service.MANDIRI_ORGANIZATION_ID, memutus
lingkaran ayam dan telur yang sama seperti didokumentasikan pada docstring
hemavision_api.modules.identity.models.Membership.
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "37276931ec84"
down_revision: str | None = "1637e8813c7f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_OLD_KINDS = ("dinkes_prov", "dinkes_kab", "puskesmas", "posyandu", "sekolah", "rs")
_NEW_KINDS = (*_OLD_KINDS, "mandiri")
_MANDIRI_ORGANIZATION_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def upgrade() -> None:
    op.drop_constraint("kind", "organizations", type_="check")
    op.create_check_constraint("kind", "organizations", f"kind IN {_NEW_KINDS!r}")

    op.execute(
        sa.text(
            "INSERT INTO organizations (id, kind, name, path) "
            "VALUES (:id, 'mandiri', 'HemaVision Mandiri', 'id.mandiri') "
            "ON CONFLICT (path) DO NOTHING"
        ).bindparams(sa.bindparam("id", value=_MANDIRI_ORGANIZATION_ID, type_=postgresql.UUID))
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM organizations WHERE path = 'id.mandiri'"))
    op.drop_constraint("kind", "organizations", type_="check")
    op.create_check_constraint("kind", "organizations", f"kind IN {_OLD_KINDS!r}")
