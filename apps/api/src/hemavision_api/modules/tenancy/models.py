"""Model hierarki organisasi.

Hierarki mengikuti kenyataan administratif Indonesia: Dinkes provinsi membawahi
Dinkes kabupaten, membawahi Puskesmas, membawahi Posyandu dan sekolah. Kolom path
bertipe ltree memungkinkan query subtree organisasi menjadi satu operator, dan
menjadi dasar isolasi Row Level Security antar instansi, sesuai
hemavision/docs/DECISION_LOG.md bagian multi-tenancy.
"""

import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, String
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, Ltree, TimestampMixin, UUIDPrimaryKeyMixin

ORGANIZATION_KINDS = (
    "dinkes_prov",
    "dinkes_kab",
    "puskesmas",
    "posyandu",
    "sekolah",
    "rs",
    "mandiri",
)


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Satu simpul pada hierarki organisasi."""

    __tablename__ = "organizations"
    __table_args__ = (
        CheckConstraint(f"kind IN {ORGANIZATION_KINDS!r}", name="kind"),
        Index("ix_organizations_path", "path", postgresql_using="gist"),
    )

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    region_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    path: Mapped[str] = mapped_column(Ltree(), nullable=False, unique=True)
