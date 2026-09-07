"""Titik masuk aplikasi FastAPI.

Router tiap modul didaftarkan di sini. Endpoint kesehatan dan kesiapan dipakai
Cloud Run untuk liveness dan readiness probe, dan dipakai untuk membangunkan
compute Neon sebelum sesi demonstrasi.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Literal

import sqlalchemy as sa
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from hemavision_api import __version__, models_registry
from hemavision_api.core.config import get_settings
from hemavision_api.core.db import create_db_engine, create_session_factory
from hemavision_api.modules.identity.router import router as identity_router
from hemavision_api.modules.patients.router import router as patients_router
from hemavision_api.modules.screening.router import router as screening_router
from hemavision_api.registration import router as registration_router
from hemavision_api.workers import router as workers_router

_REGISTERED_MODEL_TABLES = models_registry.Base.metadata.tables


class HealthResponse(BaseModel):
    """Bentuk response endpoint kesehatan."""

    status: Literal["ok"]
    version: str
    environment: str


class ReadyResponse(BaseModel):
    """Bentuk response endpoint kesiapan."""

    status: Literal["ok"]
    database: Literal["reachable"]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Membuka engine dan sessionmaker sekali saat startup, menutupnya saat shutdown.

    Engine dibuat sekali di sini, bukan per permintaan, karena membuka koneksi baru
    pada setiap permintaan adalah tepat bug performa yang ditemukan pada inference
    tier dan sengaja tidak kita ulangi di sini. Lihat
    hemavision/docs/DECISION_LOG.md bagian Known Limitations.
    """
    settings = get_settings()
    engine = create_db_engine(settings.database_url)
    app.state.engine = engine
    app.state.session_factory = create_session_factory(engine)
    yield
    engine.dispose()


def create_app() -> FastAPI:
    """Membangun instance FastAPI beserta middleware dan router.

    Dipakai sebagai factory agar pengujian dapat membuat aplikasi bersih tanpa
    bergantung pada state global.
    """
    settings = get_settings()

    app = FastAPI(
        title="Hemavision Core API",
        version=__version__,
        description=(
            "Backend produk skrining anemia non invasif. Memanggil inference tier "
            "sebagai layanan eksternal, menyimpan hasil, dan menegakkan otorisasi "
            "serta kepatuhan perlindungan data pribadi."
        ),
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
    )

    @app.get("/health", response_model=HealthResponse, tags=["system"])
    async def health() -> HealthResponse:
        """Melaporkan bahwa proses hidup dan konfigurasinya terbaca.

        Sengaja tidak memeriksa basis data, karena liveness probe yang bergantung
        pada basis data dapat membuat Cloud Run mematikan instance yang sehat
        hanya karena Neon sedang bangun dari keadaan tidur. Pemeriksaan basis data
        ada pada /ready.
        """
        return HealthResponse(
            status="ok",
            version=__version__,
            environment=settings.environment,
        )

    @app.get("/ready", response_model=ReadyResponse, tags=["system"])
    async def ready() -> ReadyResponse:
        """Membuktikan basis data benar benar dapat dijangkau, bukan sekadar
        proses hidup."""
        try:
            with app.state.engine.connect() as connection:
                connection.execute(sa.text("SELECT 1"))
        except sa.exc.SQLAlchemyError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Basis data tidak dapat dijangkau",
            ) from error
        return ReadyResponse(status="ok", database="reachable")

    app.include_router(identity_router)
    app.include_router(registration_router)
    app.include_router(patients_router)
    app.include_router(screening_router)
    app.include_router(workers_router)

    return app


app = create_app()
