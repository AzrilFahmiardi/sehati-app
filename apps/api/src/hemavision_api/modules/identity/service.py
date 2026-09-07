"""Resolusi identitas terverifikasi menjadi pengguna dan keanggotaan lokal.

Ini adalah satu satunya tempat yang boleh menerjemahkan identity_provider_uid
menjadi baris pada tabel users dan memberships. Router modul lain memanggil fungsi
di sini, tidak boleh melakukan query users/memberships sendiri, sesuai
hemavision/docs/adr/001-modular-monolith.md.
"""

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.modules.identity.models import Membership, User


class UserNotProvisionedError(Exception):
    """Identitas terverifikasi tanda tangannya, tetapi belum memiliki akun.

    Ini berbeda dari token tidak valid. Token yang sah menandakan Identity
    Platform mempercayai identitasnya, tetapi provisioning akun lewat Admin SDK
    adalah langkah terpisah yang mungkin belum dilakukan admin faskes.
    """


class UserSuspendedError(Exception):
    """Akun ditemukan tetapi berstatus suspended, akses harus ditolak."""


class EmailAlreadyRegisteredError(Exception):
    """Email sudah dipakai baris users lain, baik pasien maupun tenaga kesehatan."""


@dataclass(frozen=True)
class AuthenticatedUser:
    """Pengguna yang identitasnya sudah diverifikasi dan akunnya aktif."""

    id: UUID
    email: str
    display_name: str
    memberships: tuple[Membership, ...]

    def membership_for(self, organization_id: UUID) -> Membership | None:
        """Mengembalikan baris keanggotaan pengguna pada organisasi tertentu, atau
        None bila bukan anggota organisasi itu.

        Dipakai pemanggil untuk sekaligus membaca role dan organization_path yang
        diperlukan menetapkan konteks Row Level Security lewat
        hemavision_api.core.db.rls_scope, tanpa perlu query tambahan ke tabel
        organizations yang dilindungi Row Level Security.
        """
        for membership in self.memberships:
            if membership.organization_id == organization_id:
                return membership
        return None


def resolve_authenticated_user(
    session: Session, *, identity_provider_uid: str
) -> AuthenticatedUser:
    """Menerjemahkan identity_provider_uid menjadi pengguna beserta keanggotaannya.

    Melempar UserNotProvisionedError bila belum ada baris users yang cocok, dan
    UserSuspendedError bila akun ditemukan tetapi statusnya suspended. Keduanya
    sengaja dibedakan dari InvalidTokenError pada modul security, karena berbeda
    lapisan: token valid adalah soal kriptografi, sedangkan status akun adalah
    soal otorisasi yang bersumber dari Postgres sesuai
    hemavision/docs/adr/004-identity-platform.md.
    """
    user = session.execute(
        select(User).where(User.identity_provider_uid == identity_provider_uid)
    ).scalar_one_or_none()

    if user is None:
        raise UserNotProvisionedError(identity_provider_uid)
    if user.status != "active":
        raise UserSuspendedError(identity_provider_uid)

    memberships = (
        session.execute(select(Membership).where(Membership.user_id == user.id)).scalars().all()
    )

    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        memberships=tuple(memberships),
    )


def provision_pasien_user(
    session: Session,
    *,
    identity_provider_uid: str,
    email: str,
    display_name: str,
    organization_id: UUID,
    organization_path: str,
) -> User:
    """Membuat baris users dan memberships peran pasien untuk registrasi mandiri.

    Tidak melakukan commit, membiarkan pemanggil menyatukan transaksi ini
    dengan penulisan baris patients yang menyertainya, karena keduanya harus
    berhasil atau gagal bersamaan. Melempar EmailAlreadyRegisteredError bila
    email sudah dipakai, diperiksa lebih dulu agar pesannya jelas, bukan
    menunggu IntegrityError dari constraint basis data.
    """
    existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing is not None:
        raise EmailAlreadyRegisteredError(email)

    user = User(
        identity_provider_uid=identity_provider_uid,
        email=email,
        display_name=display_name,
        status="active",
    )
    session.add(user)
    session.flush()

    session.add(
        Membership(
            user_id=user.id,
            organization_id=organization_id,
            organization_path=organization_path,
            role="pasien",
        )
    )
    session.flush()

    return user


def grant_membership(
    session: Session,
    *,
    user_id: UUID,
    organization_id: UUID,
    organization_path: str,
    role: str,
) -> Membership:
    """Menambah satu baris memberships untuk pengguna yang sudah ada.

    Dipakai persetujuan klaim riwayat skrining (lihat
    hemavision_api.modules.patients.service.approve_claim) untuk memberi
    pengguna yang tadinya hanya anggota organisasi Mandiri akses ke organisasi
    fasilitas tempat baris patients lama berada, tanpa membuat baris users
    baru. Tidak melakukan commit, membiarkan pemanggil menyatukan transaksi
    ini dengan penulisan patients.owner_user_id.
    """
    membership = Membership(
        user_id=user_id,
        organization_id=organization_id,
        organization_path=organization_path,
        role=role,
    )
    session.add(membership)
    session.flush()
    return membership
