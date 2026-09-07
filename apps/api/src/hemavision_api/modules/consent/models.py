"""Model dokumen consent dan persetujuan pasien."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ConsentDocument(Base, UUIDPrimaryKeyMixin):
    """Satu versi teks consent dalam satu bahasa.

    Versi baru dibuat sebagai baris baru, tidak pernah menimpa baris lama, agar
    consent yang sudah diberikan pasien tetap menunjuk teks persis yang mereka
    setujui saat itu.
    """

    __tablename__ = "consent_documents"
    __table_args__ = (UniqueConstraint("version", "locale", name="uq_consent_documents_version"),)

    version: Mapped[str] = mapped_column(String(32), nullable=False)
    locale: Mapped[str] = mapped_column(String(8), nullable=False)
    body_md: Mapped[str] = mapped_column(Text, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Consent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Persetujuan seorang pasien terhadap satu versi dokumen consent.

    scope menyimpan cakupan persetujuan sebagai jsonb, misalnya termasuk
    penyimpanan foto sementara, penyetoran ke SatuSehat, dan keikutsertaan
    continuous learning, sehingga penarikan dapat bersifat sebagian.
    """

    __tablename__ = "consents"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("consent_documents.id"), nullable=False
    )
    scope: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    signature_method: Mapped[str] = mapped_column(String(32), nullable=False)
