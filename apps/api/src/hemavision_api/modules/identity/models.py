"""Model pengguna, keanggotaan organisasi, dan akses darurat.

Kolom password sengaja tidak ada. Identity Platform yang mengurus penyimpanan dan
verifikasi kredensial, sesuai hemavision/docs/adr/004-identity-platform.md. Tabel
users hanya menyimpan identity_provider_uid sebagai kunci penghubung.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, Ltree, TimestampMixin, UUIDPrimaryKeyMixin

MEMBERSHIP_ROLES = (
    "pasien",
    "kader",
    "bidan",
    "dokter",
    "admin_faskes",
    "admin_dinkes",
    "platform_admin",
)

USER_STATUSES = ("active", "suspended")


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Satu identitas pengguna, ditautkan ke Identity Platform lewat UID-nya."""

    __tablename__ = "users"
    __table_args__ = (CheckConstraint(f"status IN {USER_STATUSES!r}", name="status"),)

    identity_provider_uid: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="active")


class Membership(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Peran seorang pengguna pada satu organisasi tertentu.

    Satu pengguna dapat memiliki keanggotaan pada lebih dari satu organisasi dan
    lebih dari satu peran, misalnya seorang dokter yang juga admin_faskes di
    Puskesmas yang sama.

    organization_path adalah salinan Organization.path pada saat keanggotaan
    dibuat. Salinan ini sengaja didenormalisasi, bukan diambil lewat join saat
    login, karena tabel organizations dilindungi Row Level Security dan belum
    ada konteks organisasi yang dapat ditetapkan sebelum keanggotaan ini
    sendiri berhasil ditemukan, membentuk lingkaran ayam dan telur. Salinan
    ini memutus lingkaran itu, karena tabel memberships tidak dilindungi Row
    Level Security dan dapat dibaca sebelum konteks organisasi ditetapkan.
    Bila path organisasi berubah, seluruh baris keanggotaan pada subtree itu
    harus diperbarui sepadan.
    """

    __tablename__ = "memberships"
    __table_args__ = (
        CheckConstraint(f"role IN {MEMBERSHIP_ROLES!r}", name="role"),
        UniqueConstraint("user_id", "organization_id", "role", name="uq_memberships_user_org_role"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    organization_path: Mapped[str] = mapped_column(Ltree(), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)


class EmergencyAccessGrant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Akses darurat lintas organisasi, berbatas waktu dan wajib beralasan.

    Setiap penerbitan grant memicu notifikasi ke admin organisasi terkait. Akses
    darurat tersedia, tetapi tidak pernah sunyi, sesuai
    hemavision/docs/adr/004-identity-platform.md bagian break-glass.
    """

    __tablename__ = "emergency_access_grants"

    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    approved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
