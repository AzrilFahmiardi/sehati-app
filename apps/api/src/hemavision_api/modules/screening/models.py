"""Model sesi skrining, capture per situs, hasil per situs, dan penunjang antrean.

Nilai konstanta situs (SCREENING_SITES) dan status sengaja diduplikasi sebagai
string biasa dengan CheckConstraint alih alih Postgres ENUM native, supaya
menambah nilai baru kelak hanya soal mengubah constraint lewat migrasi, tanpa
friksi ALTER TYPE yang dimiliki native enum.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin

SCREENING_SITES = ("conjunctiva", "palm", "nail")
SCREENING_STATUSES = ("draft", "processing", "completed", "failed", "inconclusive")
INFERENCE_STATUSES = ("pending", "completed", "failed")
VALIDATION_STATUSES = ("confirmed", "needs_review")


class Screening(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Satu sesi skrining terhadap satu pasien, mencakup sampai tiga situs."""

    __tablename__ = "screenings"
    __table_args__ = (
        CheckConstraint(f"status IN {SCREENING_STATUSES!r}", name="status"),
        UniqueConstraint(
            "organization_id", "idempotency_key", name="uq_screenings_org_idempotency_key"
        ),
        Index("ix_screenings_org_created_at", "organization_id", "created_at"),
        Index("ix_screenings_patient_created_at", "patient_id", "created_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    performed_by_user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="draft")
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )


class ScreeningCapture(Base, UUIDPrimaryKeyMixin):
    """Berkas mentah yang diunggah untuk satu situs pada satu sesi skrining.

    raw_deleted_at diisi otomatis oleh job retensi tujuh hari setelah hasil final,
    sesuai hemavision/docs/DECISION_LOG.md bagian minimisasi data.
    """

    __tablename__ = "screening_captures"
    __table_args__ = (
        CheckConstraint(f"site IN {SCREENING_SITES!r}", name="site"),
        UniqueConstraint("screening_id", "site", name="uq_screening_captures_screening_site"),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    site: Mapped[str] = mapped_column(String(16), nullable=False)
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    roi_object_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SiteResult(Base, UUIDPrimaryKeyMixin):
    """Hasil inferensi satu situs pada satu sesi skrining.

    Field disimpan seluas mungkin dari response inference tier sesuai
    hemavision_api.modules.inference.schemas, termasuk metrics dan
    handcrafted_features mentah sebagai jsonb, untuk keperluan audit dan
    continuous learning kelak.
    """

    __tablename__ = "site_results"
    __table_args__ = (
        CheckConstraint(f"site IN {SCREENING_SITES!r}", name="site"),
        CheckConstraint(f"inference_status IN {INFERENCE_STATUSES!r}", name="inference_status"),
        UniqueConstraint("screening_id", "site", name="uq_site_results_screening_site"),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    site: Mapped[str] = mapped_column(String(16), nullable=False)
    passed_qc: Mapped[bool | None] = mapped_column(nullable=True)
    reasons: Mapped[list[str]] = mapped_column(
        ARRAY(String(32)), nullable=False, server_default="{}"
    )
    metrics: Mapped[dict[str, object] | None] = mapped_column(postgresql.JSONB, nullable=True)
    hb_gdl: Mapped[float | None] = mapped_column(Numeric(4, 2), nullable=True)
    anemic_probability: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)
    model_severity: Mapped[str | None] = mapped_column(String(16), nullable=True)
    handcrafted_features: Mapped[dict[str, object] | None] = mapped_column(
        postgresql.JSONB, nullable=True
    )
    model_version: Mapped[str | None] = mapped_column(String(128), nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inference_status: Mapped[str] = mapped_column(
        String(16), nullable=False, server_default="pending"
    )
    stage_images: Mapped[dict[str, object] | None] = mapped_column(
        postgresql.JSONB, nullable=True
    )


class IdempotencyKey(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Kunci idempotency per organisasi untuk mencegah skrining ganda.

    Kader pada sinyal buruk akan menekan tombol kirim dua kali, dan itu harus
    menghasilkan satu skrining, sesuai hemavision/docs/adr/005-async-polling.md.
    """

    __tablename__ = "idempotency_keys"
    __table_args__ = (
        UniqueConstraint("key", "organization_id", name="uq_idempotency_keys_key_org"),
    )

    key: Mapped[str] = mapped_column(String(128), nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_body: Mapped[dict[str, object] | None] = mapped_column(postgresql.JSONB, nullable=True)


class JobFailure(Base, UUIDPrimaryKeyMixin):
    """Catatan kegagalan pekerjaan setelah seluruh percobaan ulang habis.

    Tidak ada kegagalan yang senyap. Skrining yang gagal harus terlihat gagal,
    sesuai hemavision/docs/adr/005-async-polling.md.
    """

    __tablename__ = "job_failures"

    screening_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=True
    )
    job_type: Mapped[str] = mapped_column(String(32), nullable=False)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False)
    error: Mapped[str] = mapped_column(Text, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )


class ClinicalValidation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Validasi klinis dari hasil skrining AI oleh Tenaga Kesehatan."""

    __tablename__ = "clinical_validations"
    __table_args__ = (
        CheckConstraint(f"status IN {VALIDATION_STATUSES!r}", name="status"),
        UniqueConstraint("screening_id", name="uq_clinical_validations_screening"),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    reviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reviewer_role: Mapped[str] = mapped_column(String(255), nullable=False)
    reviewer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    validated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    formatted_timestamp: Mapped[str] = mapped_column(String(128), nullable=False)
    original_ai_result: Mapped[dict[str, object]] = mapped_column(
        postgresql.JSONB, nullable=False
    )
