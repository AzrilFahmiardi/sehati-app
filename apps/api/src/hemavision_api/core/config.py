"""Konfigurasi aplikasi yang dibaca dari environment variable.

Seluruh nilai rahasia diambil dari environment, bukan dari berkas di dalam repo.
Pada produksi environment tersebut diisi Secret Manager lewat konfigurasi Cloud Run.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class InferenceSettings(BaseSettings):
    """Alamat ketiga endpoint inference tier yang sudah live di Cloud Run.

    Ketiga service bersifat privat, sehingga pemanggilnya wajib menyertakan ID token
    yang diperoleh lewat service account dengan role run.invoker. Nilai default di sini
    adalah alamat produksi yang tercatat pada hemavision/docs/API_CONTRACT.md.
    """

    model_config = SettingsConfigDict(
        env_prefix="HEMAVISION_INFERENCE_", env_file=".env", extra="ignore"
    )

    conjunctiva_url: HttpUrl = Field(
        default=HttpUrl("https://hemavision-conjunctiva-137444417734.asia-southeast2.run.app")
    )
    palm_url: HttpUrl = Field(
        default=HttpUrl("https://hemavision-palm-137444417734.asia-southeast2.run.app")
    )
    nail_url: HttpUrl = Field(
        default=HttpUrl("https://hemavision-nail-137444417734.asia-southeast2.run.app")
    )
    image_timeout_seconds: float = Field(default=45.0)
    video_timeout_seconds: float = Field(default=110.0)


class Settings(BaseSettings):
    """Konfigurasi utama aplikasi."""

    model_config = SettingsConfigDict(
        env_prefix="HEMAVISION_",
        env_nested_delimiter="__",
        env_file=".env",
        extra="ignore",
    )

    environment: Literal["local", "staging", "production"] = Field(default="local")
    database_url: str = Field(default="postgresql+psycopg://localhost:5432/hemavision")
    migrations_database_url: str | None = Field(default=None)
    identity_platform_project_id: str = Field(default="hemavision-503304")
    allowed_origins: list[str] = Field(default_factory=list)
    inference: InferenceSettings = Field(default_factory=InferenceSettings)

    gcs_bucket_name: str = Field(default="hemavision-503304-screening-uploads")
    tasks_queue_location: str = Field(default="asia-southeast2")
    tasks_queue_name: str = Field(default="hemavision-inference-jobs")
    worker_service_account_email: str = Field(
        default="hemavision-api@hemavision-503304.iam.gserviceaccount.com"
    )
    public_base_url: str = Field(default="http://localhost:8000")

    @property
    def effective_migrations_url(self) -> str:
        """URL basis data untuk menjalankan migrasi Alembic.

        Migrasi memerlukan hak pemilik skema untuk membuat tabel, index, dan role,
        sehingga dijalankan sebagai role yang berbeda dari role aplikasi saat
        runtime. Role aplikasi sengaja tidak memiliki BYPASSRLS, dan role pemilik
        skema pada penyedia Postgres terkelola (termasuk Neon) memilikinya secara
        bawaan, sehingga keduanya tidak boleh sama. Lihat migrasi
        364b48418521_create_least_privilege_application_role.py.
        """
        return self.migrations_database_url or self.database_url

    @property
    def is_production(self) -> bool:
        """Menyatakan apakah aplikasi berjalan pada environment produksi."""
        return self.environment == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Mengembalikan konfigurasi tunggal yang dipakai seluruh aplikasi."""
    return Settings()
