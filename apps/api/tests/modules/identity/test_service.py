"""Pengujian resolusi identitas menjadi pengguna dan keanggotaan lokal.

Dijalankan terhadap Postgres sungguhan lewat testcontainers dengan migrasi
sungguhan, karena resolve_authenticated_user membaca dua tabel yang tidak
dilindungi Row Level Security (users, memberships) sesuai desain yang
dijelaskan pada docstring Membership.
"""

import os
import uuid
from collections.abc import Iterator

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config

from hemavision_api.core.config import get_settings
from hemavision_api.modules.identity.service import (
    UserNotProvisionedError,
    UserSuspendedError,
    resolve_authenticated_user,
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


def _create_org(session: sa.orm.Session, path: str) -> uuid.UUID:
    return session.execute(
        sa.text(
            "INSERT INTO organizations (kind, name, path) "
            "VALUES ('puskesmas', 'Puskesmas Uji', :path) RETURNING id"
        ),
        {"path": path},
    ).scalar_one()


def _create_user(session: sa.orm.Session, *, uid: str, status: str = "active") -> uuid.UUID:
    return session.execute(
        sa.text(
            "INSERT INTO users (identity_provider_uid, email, display_name, status) "
            "VALUES (:uid, :email, 'Dokter Uji', :status) RETURNING id"
        ),
        {"uid": uid, "email": f"{uid}@example.test", "status": status},
    ).scalar_one()


class TestResolveAuthenticatedUser:
    def test_unknown_identity_raises_not_provisioned(self, session: sa.orm.Session) -> None:
        with pytest.raises(UserNotProvisionedError):
            resolve_authenticated_user(session, identity_provider_uid="tidak-pernah-ada")

    def test_suspended_account_is_rejected(self, session: sa.orm.Session) -> None:
        _create_user(session, uid="uid-suspended", status="suspended")

        with pytest.raises(UserSuspendedError):
            resolve_authenticated_user(session, identity_provider_uid="uid-suspended")

    def test_active_account_resolves_with_its_memberships(self, session: sa.orm.Session) -> None:
        org_id = _create_org(session, "id.jatim.uji")
        user_id = _create_user(session, uid="uid-active")
        session.execute(
            sa.text(
                "INSERT INTO memberships (user_id, organization_id, organization_path, role) "
                "VALUES (:user_id, :org_id, 'id.jatim.uji', 'dokter')"
            ),
            {"user_id": user_id, "org_id": org_id},
        )

        authenticated = resolve_authenticated_user(session, identity_provider_uid="uid-active")

        assert authenticated.id == user_id
        membership = authenticated.membership_for(org_id)
        assert membership is not None
        assert membership.role == "dokter"
        assert membership.organization_path == "id.jatim.uji"

    def test_user_without_membership_in_requested_org_resolves_but_has_no_access(
        self, session: sa.orm.Session
    ) -> None:
        other_org_id = _create_org(session, "id.jatim.lain")
        _create_user(session, uid="uid-no-membership")

        authenticated = resolve_authenticated_user(
            session, identity_provider_uid="uid-no-membership"
        )

        assert authenticated.membership_for(other_org_id) is None
