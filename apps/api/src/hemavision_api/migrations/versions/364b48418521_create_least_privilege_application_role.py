"""create least privilege application role

Revision ID: 364b48418521
Revises: 5c5cda9239b6
Create Date: 2026-07-29 01:44:09.650629

Temuan penting yang mengoreksi asumsi sebelumnya: role pemilik skema pada Neon
(dan pada penyedia Postgres terkelola lain pada umumnya) memiliki atribut
BYPASSRLS aktif secara bawaan. Atribut ini SELALU melewati row level security
terlepas dari FORCE ROW LEVEL SECURITY, karena keduanya adalah mekanisme yang
berbeda. FORCE hanya menghapus pengecualian bagi pemilik tabel, sedangkan
BYPASSRLS adalah atribut role yang berdiri sendiri.

Karena itu aplikasi tidak boleh terhubung memakai role pemilik skema untuk lalu
lintas normal. Migrasi ini membuat role terpisah tanpa BYPASSRLS, yang menjadi
role satu satunya yang dipakai proses aplikasi saat runtime. Role pemilik skema
tetap dipakai khusus untuk menjalankan migrasi.

Password role diambil dari environment variable HEMAVISION_APP_ROLE_PASSWORD saat
migrasi dijalankan, tidak pernah ditulis di berkas ini, sehingga tidak ada rahasia
yang tersimpan di git.
"""

import os
from collections.abc import Sequence

from alembic import op

revision: str = "364b48418521"
down_revision: str | None = "5c5cda9239b6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

APP_ROLE = "hemavision_app"


def upgrade() -> None:
    password = os.environ["HEMAVISION_APP_ROLE_PASSWORD"]

    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{APP_ROLE}') THEN
                CREATE ROLE {APP_ROLE} LOGIN NOBYPASSRLS PASSWORD '{password}';
            ELSE
                ALTER ROLE {APP_ROLE} PASSWORD '{password}';
            END IF;
        END
        $$;
        """
    )
    op.execute(f"GRANT USAGE ON SCHEMA public TO {APP_ROLE}")
    op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {APP_ROLE}")
    op.execute(f"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO {APP_ROLE}")
    op.execute(
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public "
        f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {APP_ROLE}"
    )
    op.execute(
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO {APP_ROLE}"
    )
    op.execute(f"REVOKE UPDATE, DELETE ON audit_events FROM {APP_ROLE}")


def downgrade() -> None:
    op.execute(f"REVOKE ALL ON ALL TABLES IN SCHEMA public FROM {APP_ROLE}")
    op.execute(f"REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM {APP_ROLE}")
    op.execute(f"REVOKE USAGE ON SCHEMA public FROM {APP_ROLE}")
    op.execute(f"DROP ROLE IF EXISTS {APP_ROLE}")
