"""Pengujian titik masuk aplikasi: liveness, readiness, dan siklus hidup engine.

Readiness sengaja diuji terhadap Postgres sungguhan lewat testcontainers, bukan
basis data tiruan, karena tujuan endpoint ini adalah membuktikan konektivitas
jaringan dan kredensial yang benar, sesuatu yang tidak dapat dibuktikan mock.
"""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer

from hemavision_api.core.config import get_settings
from hemavision_api.main import create_app


@pytest.fixture
def postgres_url() -> Iterator[str]:
    with PostgresContainer("postgres:17-alpine") as postgres:
        yield postgres.get_connection_url().replace("psycopg2", "psycopg")


@pytest.fixture
def client(postgres_url: str, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("HEMAVISION_DATABASE_URL", postgres_url)
    get_settings.cache_clear()
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()


def test_health_reports_ok_without_touching_database(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["environment"] == "local"


def test_ready_proves_database_is_reachable(client: TestClient) -> None:
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "reachable"}


def test_ready_reports_service_unavailable_when_database_is_unreachable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "HEMAVISION_DATABASE_URL",
        "postgresql+psycopg://user:pass@localhost:1/does-not-exist",
    )
    get_settings.cache_clear()
    app = create_app()

    with TestClient(app) as client:
        response = client.get("/ready")

    assert response.status_code == 503
    get_settings.cache_clear()
