"""Verifikasi ID token Google Cloud Identity Platform.

Memakai google-auth, bukan firebase-admin, untuk verifikasi tanda tangan token.
Firebase Admin SDK mensyaratkan Application Default Credentials bahkan hanya
untuk memverifikasi tanda tangan, padahal verifikasi tanda tangan adalah operasi
kunci publik yang semestinya tidak memerlukan kredensial lokal apa pun.
google.oauth2.id_token.verify_firebase_token mengambil JWKS publik Google
langsung tanpa kredensial, sesuai hemavision/docs/adr/004-identity-platform.md.

Hasil verifikasi hanya dipakai untuk mengambil identity_provider_uid. Peran dan
keanggotaan organisasi TIDAK diambil dari klaim token, melainkan dari Postgres
pada setiap permintaan, karena claims hanya ikut terbarui saat token disegarkan
dan tidak boleh dipercaya untuk keputusan otorisasi.
"""

from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class InvalidTokenError(Exception):
    """Menandakan ID token tidak valid: tanda tangan salah, kedaluwarsa, atau
    audiens tidak cocok."""


@dataclass(frozen=True)
class VerifiedIdentity:
    """Identitas yang sudah terverifikasi tanda tangannya oleh Identity Platform."""

    identity_provider_uid: str
    email: str | None


def verify_id_token(token: str, *, project_id: str) -> VerifiedIdentity:
    """Memverifikasi ID token dan mengembalikan identitas yang terkandung di dalamnya.

    Melempar InvalidTokenError untuk seluruh kegagalan verifikasi, menyatukan
    berbagai jenis galat dari google-auth (tanda tangan salah, kedaluwarsa,
    audiens tidak cocok, format tidak valid) menjadi satu tipe galat yang harus
    ditangani pemanggil, karena pemanggil tidak perlu tahu detail jenis
    kegagalannya, hanya bahwa token itu tidak dapat dipercaya.
    """
    try:
        claims: dict[str, object] = id_token.verify_firebase_token(  # type: ignore[no-untyped-call]
            token, google_requests.Request(), audience=project_id
        )
    except Exception as error:
        raise InvalidTokenError("ID token tidak valid") from error

    if claims is None:
        raise InvalidTokenError("ID token tidak valid")

    uid = claims.get("uid") or claims.get("sub")
    if not isinstance(uid, str) or not uid:
        raise InvalidTokenError("ID token tidak memuat identitas pengguna")

    email = claims.get("email")
    return VerifiedIdentity(
        identity_provider_uid=uid, email=email if isinstance(email, str) else None
    )
