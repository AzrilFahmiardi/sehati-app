"""Signed URL dan pemeriksaan objek pada bucket upload skrining.

Berjalan di Cloud Run tanpa kunci privat berkas JSON, sehingga signed URL
ditandatangani lewat IAM SignBlob (access_token plus service_account_email),
bukan lewat kunci privat lokal. Service account runtime memerlukan peran
roles/iam.serviceAccountTokenCreator pada dirinya sendiri, sesuai
infra/terraform/screening.tf.
"""

from datetime import timedelta
from functools import lru_cache

import google.auth
from google.auth.transport import requests as google_requests
from google.cloud import storage  # type: ignore[attr-defined,import-untyped,unused-ignore]

from hemavision_api.core.config import get_settings

_SIGNED_URL_TTL = timedelta(minutes=15)


@lru_cache(maxsize=1)
def _client() -> storage.Client:
    return storage.Client()


def generate_signed_upload_url(object_key: str, *, content_type: str) -> str:
    """Membuat signed URL untuk PUT langsung ke GCS, berlaku 15 menit."""
    settings = get_settings()
    bucket = _client().bucket(settings.gcs_bucket_name)
    blob = bucket.blob(object_key)

    credentials, _ = google.auth.default()
    credentials.refresh(google_requests.Request())  # type: ignore[no-untyped-call]

    url: str = blob.generate_signed_url(
        version="v4",
        expiration=_SIGNED_URL_TTL,
        method="PUT",
        content_type=content_type,
        service_account_email=settings.worker_service_account_email,
        access_token=credentials.token,
    )
    return url


def get_object_size(object_key: str) -> int | None:
    """Mengembalikan ukuran objek dalam bytes, atau None bila belum ada.

    Dipakai submit_screening untuk membuktikan unggahan client benar benar
    sampai di GCS sebelum antrean job inferensi dibuka, bukan sekadar percaya
    klaim client.
    """
    settings = get_settings()
    bucket = _client().bucket(settings.gcs_bucket_name)
    blob = bucket.get_blob(object_key)
    return blob.size if blob is not None else None


def download_object(object_key: str) -> bytes:
    """Mengunduh isi objek, dipakai worker sebelum memanggil inference tier."""
    settings = get_settings()
    bucket = _client().bucket(settings.gcs_bucket_name)
    blob = bucket.blob(object_key)
    content: bytes = blob.download_as_bytes()
    return content


def upload_object_bytes(object_key: str, data: bytes, *, content_type: str) -> None:
    """Mengunggah bytes langsung dari server ke GCS.

    Dipakai worker untuk menyimpan stage_images hasil inference, bukan lewat
    signed URL karena pemanggilnya sendiri server, bukan browser.
    """
    settings = get_settings()
    bucket = _client().bucket(settings.gcs_bucket_name)
    blob = bucket.blob(object_key)
    blob.upload_from_string(data, content_type=content_type)


def generate_signed_read_url(object_key: str) -> str:
    """Membuat signed URL GET untuk membaca objek, berlaku 15 menit."""
    settings = get_settings()
    bucket = _client().bucket(settings.gcs_bucket_name)
    blob = bucket.blob(object_key)

    credentials, _ = google.auth.default()
    credentials.refresh(google_requests.Request())  # type: ignore[no-untyped-call]

    url: str = blob.generate_signed_url(
        version="v4",
        expiration=_SIGNED_URL_TTL,
        method="GET",
        service_account_email=settings.worker_service_account_email,
        access_token=credentials.token,
    )
    return url
