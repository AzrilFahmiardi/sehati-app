"""Pengujian penulisan baris patients untuk registrasi mandiri.

Kunci enkripsi dipalsukan lewat monkeypatch terhadap crypto._read_secret,
karena pengujian ini tidak seharusnya bergantung pada akses Secret Manager
sungguhan. Dijalankan terhadap Postgres sungguhan lewat testcontainers dengan
migrasi sungguhan, sehingga organisasi pseudo id.mandiri yang diseed migrasi
dan Row Level Security-nya teruji apa adanya, bukan dipalsukan.
"""

import os
import uuid
from collections.abc import Iterator
from datetime import date

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config

from hemavision_api.core.config import get_settings
from hemavision_api.modules.identity.models import User
from hemavision_api.modules.patients import crypto
from hemavision_api.modules.patients.service import (
    MANDIRI_ORGANIZATION_ID,
    MANDIRI_ORGANIZATION_PATH,
    NikAlreadyRegisteredError,
    create_patient_for_organization,
    create_self_registered_patient,
    get_patient,
    get_patient_for_owner,
    list_patients,
)

_ENV_KEYS = ("HEMAVISION_DATABASE_URL", "HEMAVISION_MIGRATIONS_DATABASE_URL")


def _alembic_config() -> Config:
    from pathlib import Path

    api_root = Path(__file__).resolve().parents[3]
    config = Config(str(api_root / "alembic.ini"))
    config.set_main_option("script_location", str(api_root / "src/hemavision_api/migrations"))
    return config


@pytest.fixture(scope="module")
def owner_engine() -> Iterator[sa.Engine]:
    from testcontainers.postgres import PostgresContainer

    original_env = {key: os.environ.get(key) for key in _ENV_KEYS}

    with PostgresContainer("postgres:17-alpine") as postgres:
        owner_url = postgres.get_connection_url().replace("psycopg2", "psycopg")
        os.environ["HEMAVISION_DATABASE_URL"] = owner_url
        os.environ["HEMAVISION_MIGRATIONS_DATABASE_URL"] = owner_url
        os.environ["HEMAVISION_APP_ROLE_PASSWORD"] = "test-only-password"
        get_settings.cache_clear()

        command.upgrade(_alembic_config(), "head")

        engine = sa.create_engine(owner_url)
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


@pytest.fixture
def session(owner_engine: sa.Engine) -> Iterator[sa.orm.Session]:
    with sa.orm.Session(owner_engine) as db_session:
        yield db_session
        db_session.rollback()


@pytest.fixture(autouse=True)
def fake_secrets(monkeypatch: pytest.MonkeyPatch) -> None:
    keys = {
        "hemavision-patient-pii-key": os.urandom(32),
        "hemavision-nik-hmac-pepper": os.urandom(32),
    }
    crypto._read_secret.cache_clear()
    monkeypatch.setattr(crypto, "_read_secret", lambda secret_id: keys[secret_id])
    yield


def _create_user(session: sa.orm.Session) -> uuid.UUID:
    unique = uuid.uuid4()
    user = User(
        identity_provider_uid=f"uid-{unique}",
        email=f"{unique}@example.test",
        display_name="Pengguna Uji",
        status="active",
    )
    session.add(user)
    session.flush()
    return user.id


class TestCreateSelfRegisteredPatient:
    def test_patient_row_is_created_under_mandiri_organization(
        self, session: sa.orm.Session
    ) -> None:
        owner_user_id = _create_user(session)
        result = create_self_registered_patient(
            session,
            owner_user_id=owner_user_id,
            display_name="Pasien Uji",
            nik="1234567890123456",
            dob=date(1990, 1, 1),
            sex="F",
        )
        session.flush()

        row = session.execute(
            sa.text(
                "SELECT organization_id, sex, pregnancy_status, owner_user_id "
                "FROM patients WHERE id = :id"
            ),
            {"id": result.patient_id},
        ).one()
        assert row.organization_id == MANDIRI_ORGANIZATION_ID
        assert row.sex == "F"
        assert row.pregnancy_status == "unknown"
        assert row.owner_user_id == owner_user_id

    def test_ciphertext_is_not_plaintext(self, session: sa.orm.Session) -> None:
        owner_user_id = _create_user(session)
        result = create_self_registered_patient(
            session,
            owner_user_id=owner_user_id,
            display_name="Pasien Uji",
            nik="1234567890123456",
            dob=date(1990, 1, 1),
            sex="M",
        )
        session.flush()

        row = session.execute(
            sa.text("SELECT nik_encrypted, pregnancy_status FROM patients WHERE id = :id"),
            {"id": result.patient_id},
        ).one()
        assert b"1234567890123456" not in row.nik_encrypted
        assert row.pregnancy_status == "none"

    def test_duplicate_nik_is_rejected(self, session: sa.orm.Session) -> None:
        create_self_registered_patient(
            session,
            owner_user_id=_create_user(session),
            display_name="Pasien Satu",
            nik="9876543210123456",
            dob=date(1990, 1, 1),
            sex="M",
        )
        session.flush()

        with pytest.raises(NikAlreadyRegisteredError):
            create_self_registered_patient(
                session,
                owner_user_id=_create_user(session),
                display_name="Pasien Dua",
                nik="9876543210123456",
                dob=date(1991, 1, 1),
                sex="F",
            )

    def test_get_patient_for_owner_returns_own_patient(self, session: sa.orm.Session) -> None:
        owner_user_id = _create_user(session)
        result = create_self_registered_patient(
            session,
            owner_user_id=owner_user_id,
            display_name="Pasien Pemilik",
            nik="1112223334445556",
            dob=date(1990, 1, 1),
            sex="F",
        )
        session.flush()

        owned = get_patient_for_owner(session, owner_user_id=owner_user_id)
        assert owned is not None
        assert owned.patient_id == result.patient_id
        assert owned.organization_id == MANDIRI_ORGANIZATION_ID
        assert owned.organization_path == MANDIRI_ORGANIZATION_PATH

    def test_get_patient_for_owner_returns_none_when_not_registered(
        self, session: sa.orm.Session
    ) -> None:
        owned = get_patient_for_owner(session, owner_user_id=_create_user(session))
        assert owned is None


class TestCreatePatientForOrganization:
    def test_creates_patient_under_given_organization(self, session: sa.orm.Session) -> None:
        result = create_patient_for_organization(
            session,
            organization_id=MANDIRI_ORGANIZATION_ID,
            organization_path=MANDIRI_ORGANIZATION_PATH,
            created_by_user_id=uuid.uuid4(),
            role="admin_faskes",
            display_name="Pasien Nakes",
            nik="1111222233334444",
            dob=date(1985, 3, 2),
            sex="M",
        )
        session.flush()

        found = get_patient(
            session, patient_id=result.patient_id, organization_path=MANDIRI_ORGANIZATION_PATH
        )
        assert found is not None
        assert found.display_name == "Pasien Nakes"
        assert found.sex == "M"

    def test_list_patients_includes_created_patient(self, session: sa.orm.Session) -> None:
        result = create_patient_for_organization(
            session,
            organization_id=MANDIRI_ORGANIZATION_ID,
            organization_path=MANDIRI_ORGANIZATION_PATH,
            created_by_user_id=uuid.uuid4(),
            role="admin_faskes",
            display_name="Pasien Daftar",
            nik="5555666677778888",
            dob=date(1992, 7, 15),
            sex="F",
        )
        session.flush()

        rows = list_patients(session, organization_path=MANDIRI_ORGANIZATION_PATH)
        assert any(row.id == result.patient_id for row in rows)

    def test_duplicate_nik_raises_instead_of_crashing(self, session: sa.orm.Session) -> None:
        create_patient_for_organization(
            session,
            organization_id=MANDIRI_ORGANIZATION_ID,
            organization_path=MANDIRI_ORGANIZATION_PATH,
            created_by_user_id=uuid.uuid4(),
            role="admin_faskes",
            display_name="Pasien Pertama",
            nik="4444333322221111",
            dob=date(1990, 1, 1),
            sex="M",
        )
        session.flush()

        with pytest.raises(NikAlreadyRegisteredError):
            create_patient_for_organization(
                session,
                organization_id=MANDIRI_ORGANIZATION_ID,
                organization_path=MANDIRI_ORGANIZATION_PATH,
                created_by_user_id=uuid.uuid4(),
                role="admin_faskes",
                display_name="Pasien Kedua",
                nik="4444333322221111",
                dob=date(1991, 1, 1),
                sex="F",
            )
        session.rollback()
