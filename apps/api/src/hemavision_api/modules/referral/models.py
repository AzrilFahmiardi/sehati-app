"""Model rujukan, tindak lanjut, dan pengukuran referensi ground truth."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin

REFERENCE_METHODS = ("hemocue", "cbc")
REFERRAL_URGENCIES = ("routine", "urgent")
REFERRAL_STATUSES = ("open", "closed")


class ReferenceMeasurement(Base, UUIDPrimaryKeyMixin):
    """Pengukuran hemoglobin sungguhan sebagai ground truth atas satu skrining.

    Hanya pengukuran dalam rentang waktu wajar dari waktu skrining yang layak
    dipakai sebagai label untuk continuous learning, karena nilai hemoglobin
    berubah seiring waktu.
    """

    __tablename__ = "reference_measurements"
    __table_args__ = (CheckConstraint(f"method IN {REFERENCE_METHODS!r}", name="method"),)

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    method: Mapped[str] = mapped_column(String(16), nullable=False)
    hb_gdl: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    measured_by_user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )


class Referral(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Rujukan tindak lanjut atas satu hasil skrining berisiko."""

    __tablename__ = "referrals"
    __table_args__ = (
        CheckConstraint(f"urgency IN {REFERRAL_URGENCIES!r}", name="urgency"),
        CheckConstraint(f"status IN {REFERRAL_STATUSES!r}", name="status"),
    )

    screening_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("screenings.id"), nullable=False
    )
    urgency: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="open")
    referred_to_org_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )


class FollowUp(Base, UUIDPrimaryKeyMixin):
    """Satu catatan tindak lanjut atas sebuah rujukan."""

    __tablename__ = "follow_ups"

    referral_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("referrals.id"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
