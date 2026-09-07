"""Pengujian siklus hidup sesi skrining.

storage.get_object_size dipalsukan lewat monkeypatch, karena pengujian ini
tidak seharusnya bergantung pada bucket GCS sungguhan. Dijalankan terhadap
Postgres sungguhan lewat testcontainers dengan migrasi sungguhan, sehingga
Row Level Security pada tabel screenings teruji apa adanya.
"""

import os
import uuid
from collections.abc import Iterator

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config

from hemavision_api.core import storage
from hemavision_api.core.config import get_settings
from hemavision_api.modules.screening.models import SCREENING_SITES
from hemavision_api.modules.screening.service import (
    CaptureUpload,
    ObjectNotUploadedError,
    create_screening,
    list_screenings,
    object_key_for,
    record_site_result,
    submit_screening,
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


@pytest.fixture
def organization_and_patient(
    session: sa.orm.Session,
) -> tuple[uuid.UUID, uuid.UUID, uuid.UUID, str]:
    suffix = uuid.uuid4().hex[:12]
    org_path = f"id.jatim.uji{suffix}"
    org_id = session.execute(
        sa.text(
            "INSERT INTO organizations (kind, name, path) "
            "VALUES ('puskesmas', 'Puskesmas Uji', :path) RETURNING id"
        ),
        {"path": org_path},
    ).scalar_one()
    user_id = session.execute(
        sa.text(
            "INSERT INTO users (identity_provider_uid, email, display_name, status) "
            "VALUES (:uid, :email, 'Bidan Uji', 'active') RETURNING id"
        ),
        {"uid": f"uid-worker-{suffix}", "email": f"worker-{suffix}@example.test"},
    ).scalar_one()
    patient_id = session.execute(
        sa.text(
            "INSERT INTO patients "
            "(organization_id, name_encrypted, nik_encrypted, nik_hmac, dob, sex) "
            "VALUES (:org_id, '\\x00', '\\x00', :nik_hmac, '1990-01-01', 'F') RETURNING id"
        ),
        {"org_id": org_id, "nik_hmac": os.urandom(32)},
    ).scalar_one()
    session.commit()
    return org_id, user_id, patient_id, org_path


class TestCreateScreening:
    def test_creates_draft_with_predicted_object_keys(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient

        screening, object_keys = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=list(SCREENING_SITES),
            idempotency_key="key-1",
        )
        session.commit()

        assert screening.status == "draft"
        assert set(object_keys.keys()) == set(SCREENING_SITES)
        assert object_keys["conjunctiva"] == object_key_for(screening.id, "conjunctiva")

    def test_same_idempotency_key_returns_existing_screening(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient

        first, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=list(SCREENING_SITES),
            idempotency_key="key-dup",
        )
        session.commit()

        second, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=list(SCREENING_SITES),
            idempotency_key="key-dup",
        )

        assert second.id == first.id


class TestSubmitScreening:
    def test_rejects_when_object_missing_from_storage(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        screening, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-missing",
        )
        session.commit()

        monkeypatch.setattr(storage, "get_object_size", lambda object_key: None)

        with pytest.raises(ObjectNotUploadedError):
            submit_screening(
                session,
                screening=screening,
                organization_path=org_path,
                performed_by_user_id=user_id,
                role="bidan",
                uploads=[CaptureUpload(site="conjunctiva", bytes=1234, sha256="a" * 64)],
            )

    def test_marks_processing_when_object_size_matches(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        screening, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-ok",
        )
        session.commit()

        monkeypatch.setattr(storage, "get_object_size", lambda object_key: 1234)

        submit_screening(
            session,
            screening=screening,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            uploads=[CaptureUpload(site="conjunctiva", bytes=1234, sha256="a" * 64)],
        )
        session.commit()

        assert screening.status == "processing"


class TestRecordSiteResult:
    def test_screening_completes_only_after_all_sites_terminal(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        screening, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=list(SCREENING_SITES),
            idempotency_key="key-complete",
        )
        session.commit()

        for site in ["conjunctiva", "palm"]:
            record_site_result(
                session,
                screening_id=screening.id,
                organization_path=org_path,
                site=site,
                passed_qc=True,
                reasons=[],
                metrics=None,
                hb_gdl=12.5,
                anemic_probability=0.1,
                model_severity="Non-Anemic",
                handcrafted_features=None,
                model_version="v1",
                latency_ms=100,
                inference_status="completed",
            )

        refreshed = session.execute(
            sa.text("SELECT status FROM screenings WHERE id = :id"), {"id": screening.id}
        ).scalar_one()
        assert refreshed != "completed"

        record_site_result(
            session,
            screening_id=screening.id,
            organization_path=org_path,
            site="nail",
            passed_qc=True,
            reasons=[],
            metrics=None,
            hb_gdl=12.0,
            anemic_probability=0.2,
            model_severity="Non-Anemic",
            handcrafted_features=None,
            model_version="v1",
            latency_ms=100,
            inference_status="completed",
        )

        final_status = session.execute(
            sa.text("SELECT status FROM screenings WHERE id = :id"), {"id": screening.id}
        ).scalar_one()
        assert final_status == "completed"

    def test_any_failed_site_marks_screening_failed(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        screening, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva", "palm", "nail"],
            idempotency_key="key-failed",
        )
        session.commit()

        record_site_result(
            session,
            screening_id=screening.id,
            organization_path=org_path,
            site="conjunctiva",
            passed_qc=False,
            reasons=["blur"],
            metrics=None,
            hb_gdl=None,
            anemic_probability=None,
            model_severity=None,
            handcrafted_features=None,
            model_version=None,
            latency_ms=None,
            inference_status="failed",
        )
        record_site_result(
            session,
            screening_id=screening.id,
            organization_path=org_path,
            site="palm",
            passed_qc=True,
            reasons=[],
            metrics=None,
            hb_gdl=12.0,
            anemic_probability=0.2,
            model_severity="Non-Anemic",
            handcrafted_features=None,
            model_version="v1",
            latency_ms=100,
            inference_status="completed",
        )
        record_site_result(
            session,
            screening_id=screening.id,
            organization_path=org_path,
            site="nail",
            passed_qc=True,
            reasons=[],
            metrics=None,
            hb_gdl=12.0,
            anemic_probability=0.2,
            model_severity="Non-Anemic",
            handcrafted_features=None,
            model_version="v1",
            latency_ms=100,
            inference_status="completed",
        )

        final_status = session.execute(
            sa.text("SELECT status FROM screenings WHERE id = :id"), {"id": screening.id}
        ).scalar_one()
        assert final_status == "failed"


class TestListScreenings:
    def test_lists_all_screenings_in_organization_newest_first(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        other_patient_id = session.execute(
            sa.text(
                "INSERT INTO patients "
                "(organization_id, name_encrypted, nik_encrypted, nik_hmac, dob, sex) "
                "VALUES (:org_id, '\\x00', '\\x00', :nik_hmac, '1991-02-02', 'M') RETURNING id"
            ),
            {"org_id": org_id, "nik_hmac": os.urandom(32)},
        ).scalar_one()
        session.commit()

        first, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-list-1",
        )
        second, _ = create_screening(
            session,
            patient_id=other_patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-list-2",
        )
        session.commit()

        screenings = list_screenings(session, organization_path=org_path)

        ids = [screening.id for screening in screenings]
        assert first.id in ids
        assert second.id in ids

    def test_filters_by_patient_id(
        self,
        session: sa.orm.Session,
        organization_and_patient: tuple[uuid.UUID, uuid.UUID, uuid.UUID, str],
    ) -> None:
        org_id, user_id, patient_id, org_path = organization_and_patient
        other_patient_id = session.execute(
            sa.text(
                "INSERT INTO patients "
                "(organization_id, name_encrypted, nik_encrypted, nik_hmac, dob, sex) "
                "VALUES (:org_id, '\\x00', '\\x00', :nik_hmac, '1992-03-03', 'F') RETURNING id"
            ),
            {"org_id": org_id, "nik_hmac": os.urandom(32)},
        ).scalar_one()
        session.commit()

        mine, _ = create_screening(
            session,
            patient_id=patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-filter-mine",
        )
        create_screening(
            session,
            patient_id=other_patient_id,
            organization_id=org_id,
            organization_path=org_path,
            performed_by_user_id=user_id,
            role="bidan",
            sites=["conjunctiva"],
            idempotency_key="key-filter-other",
        )
        session.commit()

        screenings = list_screenings(session, organization_path=org_path, patient_id=patient_id)

        assert [screening.id for screening in screenings] == [mine.id]
