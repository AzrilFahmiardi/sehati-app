"""Enkripsi dan hashing field PII pasien.

Kunci AES-256-GCM dan pepper HMAC diambil dari Secret Manager, bukan dari kode
atau environment variable polos. Setiap ciphertext memakai nonce acak per baris
dan additional authenticated data berisi nama tabel, nama kolom, dan id baris,
sehingga ciphertext tidak dapat dipindah antar baris atau antar kolom, sesuai
docstring hemavision_api.modules.patients.models.Patient.

Ini kunci simetris tunggal, bukan Cloud KMS-wrapped data encryption key seperti
rencana akhir pada hemavision/docs/adr, tetapi memakai algoritma dan pola AAD
yang sama, sehingga migrasi ke KMS nanti hanya mengganti sumber kunci, bukan
skema atau format ciphertext.
"""

import hashlib
import hmac
import os
from functools import cache
from uuid import UUID

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from google.cloud import secretmanager

from hemavision_api.core.config import get_settings

_PII_KEY_SECRET_ID = "hemavision-patient-pii-key"
_NIK_PEPPER_SECRET_ID = "hemavision-nik-hmac-pepper"
_NONCE_BYTES = 12


@cache
def _read_secret(secret_id: str) -> bytes:
    """Membaca versi terbaru sebuah secret, di-cache karena kuncinya tidak berubah
    selama proses berjalan."""
    settings = get_settings()
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{settings.identity_platform_project_id}/secrets/{secret_id}/versions/latest"
    response = client.access_secret_version(name=name)
    return bytes.fromhex(response.payload.data.decode("utf-8"))


def _aad(*, table: str, column: str, row_id: UUID) -> bytes:
    return f"{table}|{column}|{row_id}".encode()


def encrypt_field(plaintext: str, *, table: str, column: str, row_id: UUID) -> bytes:
    """Mengenkripsi satu nilai field menjadi nonce diikuti ciphertext AES-256-GCM."""
    key = _read_secret(_PII_KEY_SECRET_ID)
    aesgcm = AESGCM(key)
    nonce = os.urandom(_NONCE_BYTES)
    ciphertext = aesgcm.encrypt(
        nonce, plaintext.encode("utf-8"), _aad(table=table, column=column, row_id=row_id)
    )
    return nonce + ciphertext


def decrypt_field(stored: bytes, *, table: str, column: str, row_id: UUID) -> str:
    """Membalikkan encrypt_field, melempar InvalidTag bila AAD atau kunci tidak cocok."""
    key = _read_secret(_PII_KEY_SECRET_ID)
    aesgcm = AESGCM(key)
    nonce, ciphertext = stored[:_NONCE_BYTES], stored[_NONCE_BYTES:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, _aad(table=table, column=column, row_id=row_id))
    return plaintext.decode("utf-8")


def compute_nik_hmac(nik: str) -> bytes:
    """Menghasilkan HMAC-SHA256 dari NIK dengan pepper terpisah dari kunci
    enkripsi, dipakai unique constraint tanpa pernah membuka NIK."""
    pepper = _read_secret(_NIK_PEPPER_SECRET_ID)
    return hmac.new(pepper, nik.encode("utf-8"), hashlib.sha256).digest()
