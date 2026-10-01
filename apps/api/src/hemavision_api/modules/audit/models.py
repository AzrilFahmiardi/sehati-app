"""Model audit event berantai hash.

Perhitungan hash dilakukan di lapisan service saat menulis baris, bukan di model
ini, karena memerlukan pembacaan hash baris sebelumnya dalam transaksi yang sama.
"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base


class AuditEvent(Base):
    """Satu baris jejak audit, append only.

    prev_hash menunjuk hash pada baris dengan id satu lebih kecil, dan hash pada
    baris ini dihitung dari prev_hash digabung representasi kanonik seluruh
    kolom lain. Baris pertama memakai prev_hash berupa string kosong.
    """

    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_events_resource", "resource_type", "resource_id", "occurred_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    actor_organization_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(128), nullable=False)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload_digest: Mapped[str] = mapped_column(String(64), nullable=False)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
