"""Model hasil fusi multi situs dan registry kebijakan berversi."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin

FUSION_DECISIONS = ("anemic", "non_anemic", "inconclusive")
POLICY_KINDS = ("fusion", "threshold", "who_cutoff")


class FusedResult(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Keputusan klinis gabungan dari seluruh situs yang lolos quality control.

    Menyimpan versi kebijakan fusi, ambang, dan cutoff WHO yang dipakai, sehingga
    bila salah satu policy diperbarui, hasil lama tidak berubah makna secara
    retroaktif, sesuai hemavision/docs/adr/006-severity-from-who.md.
    """

    __tablename__ = "fused_results"
    __table_args__ = (
        CheckConstraint(f"decision IN {FUSION_DECISIONS!r}", name="decision"),
        UniqueConstraint("screening_id", name="uq_fused_results_screening"),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    hb_gdl: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    probability: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    decision: Mapped[str] = mapped_column(String(16), nullable=False)
    who_category: Mapped[str] = mapped_column(String(16), nullable=False)
    contributing_sites: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    weights: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    caveats: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    fusion_policy_version: Mapped[str] = mapped_column(String(64), nullable=False)
    threshold_policy_version: Mapped[str] = mapped_column(String(64), nullable=False)
    who_cutoff_version: Mapped[str] = mapped_column(String(32), nullable=False)


class PolicyVersion(Base, UUIDPrimaryKeyMixin):
    """Satu versi kebijakan yang dipakai perhitungan fusi.

    body menyimpan parameter kebijakan sebagai jsonb, misalnya bobot prior
    keandalan per situs untuk kind fusion, atau ambang sensitivitas per situs
    untuk kind threshold.
    """

    __tablename__ = "policy_versions"
    __table_args__ = (
        CheckConstraint(f"kind IN {POLICY_KINDS!r}", name="kind"),
        UniqueConstraint("kind", "version", name="uq_policy_versions_kind_version"),
    )

    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    body: Mapped[dict[str, object]] = mapped_column(postgresql.JSONB, nullable=False)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
