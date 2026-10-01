"""Model penyimpanan narasi explanation per hasil skrining dan audience."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin

EXPLANATION_STATUSES = ("generated", "fallback", "unavailable")
EXPLANATION_AUDIENCES = ("nakes", "pasien")


class ScreeningExplanation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Explanation tervalidasi untuk satu hasil skrining dan satu audience."""

    __tablename__ = "screening_explanations"
    __table_args__ = (
        UniqueConstraint(
            "screening_id",
            "audience",
            "locale",
            "prompt_version",
            name="uq_screening_explanations_cache_key",
        ),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    audience: Mapped[str] = mapped_column(String(16), nullable=False)
    locale: Mapped[str] = mapped_column(String(16), nullable=False, server_default="id-ID")
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    model: Mapped[str | None] = mapped_column(String(128), nullable=True)
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
