"""Model data pasien dan baseline hemoglobin longitudinal.

Enkripsi dan hashing dilakukan di lapisan service, bukan di model ini. Model ini
hanya mendeklarasikan tipe kolom bytea untuk ciphertext, sesuai
hemavision/docs/adr/003-database-provider.md soal skema yang vendor agnostik.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    LargeBinary,
    Numeric,
    SmallInteger,
    String,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from hemavision_api.core.db import Base, TimestampMixin, UUIDPrimaryKeyMixin

PATIENT_SEXES = ("M", "F")
PREGNANCY_STATUSES = ("none", "pregnant", "unknown")
CLAIM_STATUSES = ("offered", "pending", "approved", "rejected")


class Patient(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Satu catatan pasien.

    name_encrypted dan nik_encrypted adalah ciphertext AES-256-GCM yang dibungkus
    Cloud KMS, dengan additional authenticated data berisi nama tabel, nama kolom,
    dan id baris, sehingga ciphertext tidak dapat dipindah antar baris atau antar
    kolom. nik_hmac memungkinkan pencarian berdasarkan NIK tanpa pernah menyimpan
    NIK terbuka.

    owner_user_id menautkan baris ini ke pengguna yang login memakai peran pasien,
    hanya terisi untuk pasien yang mendaftar mandiri lewat
    hemavision_api.modules.patients.service.create_self_registered_patient.
    Bernilai None untuk pasien yang dibuat nakes lewat
    create_patient_for_organization, karena pasien tipe itu tidak punya akun
    login sendiri.
    """

    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint(f"sex IN {PATIENT_SEXES!r}", name="sex"),
        CheckConstraint(f"pregnancy_status IN {PREGNANCY_STATUSES!r}", name="pregnancy_status"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    name_encrypted: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nik_encrypted: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nik_hmac: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    dob: Mapped[date] = mapped_column(nullable=False)
    sex: Mapped[str] = mapped_column(nullable=False)
    pregnancy_status: Mapped[str] = mapped_column(nullable=False, server_default="unknown")
    key_version: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="1")


class PatientBaseline(Base):
    """Baseline hemoglobin longitudinal seorang pasien.

    Diperbarui setiap hasil skrining baru masuk, dipakai untuk menandai deviasi
    melewati 2 SD dari riwayat pasien sendiri.
    """

    __tablename__ = "patient_baselines"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), primary_key=True
    )
    mean_hb: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    sd_hb: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    n_obs: Mapped[int] = mapped_column(nullable=False, server_default="0")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )


class PatientClaimRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Permintaan menautkan akun pasien yang registrasi mandiri ke baris patients
    lama yang dibuat nakes untuk NIK yang sama.

    Tidak dilindungi Row Level Security (mengikuti pola dsar_requests dan
    emergency_access_grants), karena permintaan ini secara desain melintasi dua
    organisasi (organisasi mandiri milik pemohon dan organisasi fasilitas
    tempat baris patients lama berada). Isolasi ditegakkan di lapisan service.

    Siklus status: offered (dibuat otomatis saat registrasi mendeteksi NIK
    cocok dengan baris nakes yang belum diklaim, hanya terlihat pemohon)
    menjadi pending (pemohon menekan tombol minta tarik data, jadi terlihat
    nakes) menjadi approved atau rejected (keputusan nakes).
    """

    __tablename__ = "patient_claim_requests"
    __table_args__ = (CheckConstraint(f"status IN {CLAIM_STATUSES!r}", name="status"),)

    patient_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    requester_user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default="offered")
    decided_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
