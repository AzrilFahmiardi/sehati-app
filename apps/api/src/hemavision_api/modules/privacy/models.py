"""Model permintaan hak subjek data."""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, UUIDPrimaryKeyMixin

DSAR_KINDS = ("export", "erase")
DSAR_STATUSES = ("pending", "completed", "failed")


class DsarRequest(Base, UUIDPrimaryKeyMixin):
    """Satu permintaan ekspor atau penghapusan data pribadi seorang pasien."""

    __tablename__ = "dsar_requests"
    __table_args__ = (
        CheckConstraint(f"kind IN {DSAR_KINDS!r}", name="kind"),
        CheckConstraint(f"status IN {DSAR_STATUSES!r}", name="status"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="pending")
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    artifact_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
