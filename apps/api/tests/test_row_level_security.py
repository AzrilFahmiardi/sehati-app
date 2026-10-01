"""Pengujian isolasi Row Level Security antar organisasi.

Ini adalah pengujian paling penting di seluruh repo, sesuai
hemavision/docs/DECISION_LOG.md bagian multi-tenancy: bug pada satu query aplikasi
tidak boleh dapat membocorkan pasien organisasi lain, karena isolasi ditegakkan
basis data, bukan kedisiplinan kode.

Pengujian dijalankan terhadap Postgres sungguhan lewat testcontainers, menjalankan
migrasi Alembic yang sama persis dengan yang dipakai produksi, sehingga
membuktikan perilaku migrasi itu sendiri, bukan asumsi tentangnya.

Temuan penting yang dibuktikan pengujian ini secara eksplisit: role pemilik skema
pada Postgres terkelola (dibuktikan pada Neon selama pengembangan) memiliki
atribut BYPASSRLS bawaan yang selalu melewati row level security terlepas dari
FORCE ROW LEVEL SECURITY. Karena itu pengujian ini terhubung sebagai
hemavision_app, role least privilege yang dibuat migrasi
364b48418521_create_least_privilege_application_role.py, bukan sebagai role
pemilik yang menjalankan migrasi.
"""

import os
import re
from collections.abc import Iterator
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from testcontainers.postgres import PostgresContainer

from hemavision_api.core.config import get_settings

APP_ROLE_PASSWORD = "test-only-password-not-a-secret"
_ENV_KEYS = (
    "HEMAVISION_DATABASE_URL",
    "HEMAVISION_MIGRATIONS_DATABASE_URL",
    "HEMAVISION_APP_ROLE_PASSWORD",
)


def _alembic_config() -> Config:
    api_root = Path(__file__).resolve().parents[1]
    config = Config(str(api_root / "alembic.ini"))
    config.set_main_option("script_location", str(api_root / "src/hemavision_api/migrations"))
    return config


@pytest.fixture(scope="module")
def app_role_engine() -> Iterator[sa.Engine]:
    """Menjalankan migrasi pada Postgres sekali pakai dan mengembalikan engine
    yang terhubung sebagai role aplikasi least privilege, bukan role pemilik.

    get_settings di-cache lewat lru_cache untuk seluruh proses pytest, sehingga
    environment variable disetel dan cache dipaksa dibersihkan secara eksplisit
    sebelum maupun sesudah pengujian, agar modul uji lain yang memanggil
    get_settings tidak terpengaruh oleh koneksi kontainer sekali pakai ini, dan
    sebaliknya pengujian ini tidak diam diam bermigrasi ke Neon sungguhan karena
    memakai instance Settings yang sudah tercache dari pengujian lain.
    """
    original_env = {key: os.environ.get(key) for key in _ENV_KEYS}

    with PostgresContainer("postgres:17-alpine") as postgres:
        owner_url = postgres.get_connection_url().replace("psycopg2", "psycopg")

        os.environ["HEMAVISION_DATABASE_URL"] = owner_url
        os.environ["HEMAVISION_MIGRATIONS_DATABASE_URL"] = owner_url
        os.environ["HEMAVISION_APP_ROLE_PASSWORD"] = APP_ROLE_PASSWORD
        get_settings.cache_clear()

        command.upgrade(_alembic_config(), "head")

        app_url = re.sub(
            r"postgresql\+psycopg://[^@]+@",
            f"postgresql+psycopg://hemavision_app:{APP_ROLE_PASSWORD}@",
            owner_url,
        )
        engine = sa.create_engine(app_url)
        try:
            yield engine
        finally:
            engine.dispose()

    for key, value in original_env.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    get_settings.cache_clear()


def _seed_two_organizations(engine: sa.Engine) -> None:
    """Menyisipkan dua organisasi dan satu pasien pada masing masing.

    Disisipkan dengan konteks akar hierarki asli "id", yang menurut semantik
    operator <@ adalah leluhur setiap path di bawahnya, sehingga lolos WITH CHECK
    untuk baris mana pun. Ini merepresentasikan platform_admin yang melakukan
    provisioning awal. Sengaja tidak memakai string kosong sebagai penanda akar,
    karena string kosong tidak dapat dibedakan dari konteks yang lupa
    ditetapkan setelah RESET pada koneksi yang dipakai ulang, sesuai
    hemavision_api.migrations.versions.5c5cda9239b6.
    """
    with engine.begin() as conn:
        conn.execute(sa.text("SET LOCAL app.current_org_path = 'id'"))
        conn.execute(
            sa.text(
                "INSERT INTO organizations (kind, name, path) "
                "VALUES ('puskesmas', 'Puskesmas A', 'id.jatim.a')"
            )
        )
        conn.execute(
            sa.text(
                "INSERT INTO organizations (kind, name, path) "
                "VALUES ('puskesmas', 'Puskesmas B', 'id.jatim.b')"
            )
        )
        org_a = conn.execute(
            sa.text("SELECT id FROM organizations WHERE path = 'id.jatim.a'")
        ).scalar_one()
        org_b = conn.execute(
            sa.text("SELECT id FROM organizations WHERE path = 'id.jatim.b'")
        ).scalar_one()

        for org_id, hmac_marker in ((org_a, b"hmac-a"), (org_b, b"hmac-b")):
            conn.execute(
                sa.text(
                    "INSERT INTO patients "
                    "(organization_id, name_encrypted, nik_encrypted, nik_hmac, dob, sex) "
                    "VALUES (:org, :blob, :blob, :hmac, :dob, :sex)"
                ),
                {
                    "org": org_id,
                    "blob": b"ciphertext-placeholder",
                    "hmac": hmac_marker,
                    "dob": "2000-01-01",
                    "sex": "F",
                },
            )


class TestPatientsTenantIsolation:
    def test_organization_a_cannot_see_organization_b_patients(
        self, app_role_engine: sa.Engine
    ) -> None:
        _seed_two_organizations(app_role_engine)

        with app_role_engine.begin() as conn:
            conn.execute(sa.text("SET LOCAL app.current_org_path = 'id.jatim.a'"))
            rows = conn.execute(sa.text("SELECT nik_hmac FROM patients")).fetchall()

        assert len(rows) == 1
        assert rows[0].nik_hmac == b"hmac-a"

    def test_organization_b_cannot_see_organization_a_patients(
        self, app_role_engine: sa.Engine
    ) -> None:
        with app_role_engine.begin() as conn:
            conn.execute(sa.text("SET LOCAL app.current_org_path = 'id.jatim.b'"))
            rows = conn.execute(sa.text("SELECT nik_hmac FROM patients")).fetchall()

        assert len(rows) == 1
        assert rows[0].nik_hmac == b"hmac-b"

    def test_raw_query_without_any_context_sees_nothing(self, app_role_engine: sa.Engine) -> None:
        """Query mentah tanpa organisasi ditetapkan sama sekali harus melihat nol
        baris, bukan seluruh baris, karena kegagalan mengatur konteks harus gagal
        tertutup bukan gagal terbuka."""
        with app_role_engine.begin() as conn:
            conn.execute(sa.text("RESET app.current_org_path"))
            rows = conn.execute(sa.text("SELECT nik_hmac FROM patients")).fetchall()

        assert rows == []


class TestAuditEventsImmutability:
    def test_application_role_cannot_update_or_delete_audit_events(
        self, app_role_engine: sa.Engine
    ) -> None:
        """Hak UPDATE dan DELETE dicabut dari role aplikasi, sesuai
        hemavision/docs/DECISION_LOG.md bagian audit tamper evident. Baris yang
        sudah tertulis tidak boleh dapat diubah bahkan oleh proses aplikasi
        sendiri."""
        with app_role_engine.begin() as conn:
            conn.execute(
                sa.text(
                    "INSERT INTO audit_events "
                    "(action, resource_type, resource_id, payload_digest, prev_hash, hash) "
                    "VALUES ('create', 'patient', 'p-1', 'digest', '', 'hash-1')"
                )
            )

        with (
            app_role_engine.begin() as conn,
            pytest.raises(sa.exc.DBAPIError, match="permission denied"),
        ):
            conn.execute(sa.text("UPDATE audit_events SET action = 'tampered'"))

        with (
            app_role_engine.begin() as conn,
            pytest.raises(sa.exc.DBAPIError, match="permission denied"),
        ):
            conn.execute(sa.text("DELETE FROM audit_events"))
