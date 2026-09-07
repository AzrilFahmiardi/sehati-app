"""Siklus hidup sesi skrining: pembuatan, submit unggahan, dan pencatatan hasil.

screening_captures dan site_results tidak dilindungi Row Level Security (tidak
memiliki kolom organization_id sendiri, hanya screening_id), sesuai
hemavision_api.migrations.versions.5c5cda9239b6. Hanya baris screenings yang
memerlukan hemavision_api.core.db.rls_scope, karena tabel itu satu satunya di
modul ini yang membawa organization_id langsung.
"""

import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from hemavision_api.modules.screening.router import ClinicalValidationRequest

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.core import storage
from hemavision_api.core.db import rls_scope
from hemavision_api.modules.screening.models import (
    SCREENING_SITES,
    ClinicalValidation,
    Screening,
    ScreeningCapture,
    SiteResult,
)

UPLOAD_CONTENT_TYPE = "image/jpeg"


class ObjectNotUploadedError(Exception):
    """Client mengklaim sudah mengunggah, tetapi objeknya tidak ditemukan di GCS
    atau ukurannya tidak cocok."""


def object_key_for(screening_id: uuid.UUID, site: str) -> str:
    """Kunci objek GCS yang diprediksi untuk satu situs pada satu sesi.

    Dipakai baik saat menerbitkan signed URL maupun saat memverifikasi
    unggahan, sehingga keduanya selalu merujuk lokasi yang sama tanpa perlu
    disimpan terpisah sebelum unggahan selesai.
    """
    return f"screenings/{screening_id}/{site}.jpg"


def stage_image_object_key(screening_id: uuid.UUID, site: str, stage_key: str) -> str:
    """Kunci objek GCS untuk satu gambar tahapan pipeline (stage_images)."""
    return f"screenings/{screening_id}/{site}/stage_{stage_key}.png"


@dataclass(frozen=True)
class CaptureUpload:
    """Metadata satu berkas yang diklaim client sudah diunggah."""

    site: str
    bytes: int
    sha256: str


def create_screening(
    session: Session,
    *,
    patient_id: uuid.UUID,
    organization_id: uuid.UUID,
    organization_path: str,
    performed_by_user_id: uuid.UUID,
    role: str,
    sites: list[str],
    idempotency_key: str,
) -> tuple[Screening, dict[str, str]]:
    """Membuat sesi skrining baru, atau mengembalikan yang sudah ada bila
    idempotency_key sama pernah dipakai organisasi ini.

    Mengembalikan screening beserta peta situs ke kunci objek GCS yang harus
    dituju client saat mengunggah, dihasilkan dari object_key_for tanpa
    menyentuh GCS sama sekali pada tahap ini.
    """
    with rls_scope(
        session, organization_path=organization_path, user_id=str(performed_by_user_id), role=role
    ):
        existing = session.execute(
            select(Screening).where(
                Screening.organization_id == organization_id,
                Screening.idempotency_key == idempotency_key,
            )
        ).scalar_one_or_none()
        if existing is not None:
            return existing, {site: object_key_for(existing.id, site) for site in sites}

        screening = Screening(
            patient_id=patient_id,
            organization_id=organization_id,
            performed_by_user_id=performed_by_user_id,
            idempotency_key=idempotency_key,
        )
        session.add(screening)
        session.flush()

    return screening, {site: object_key_for(screening.id, site) for site in sites}


def submit_screening(
    session: Session,
    *,
    screening: Screening,
    organization_path: str,
    performed_by_user_id: uuid.UUID,
    role: str,
    uploads: list[CaptureUpload],
) -> None:
    """Memverifikasi setiap unggahan benar benar ada di GCS lalu menandai
    skrining sebagai processing.

    Melempar ObjectNotUploadedError bila ada situs yang objeknya belum ada
    atau ukurannya tidak cocok, mencegah antrean job inferensi dibuka untuk
    berkas yang sebenarnya tidak pernah sampai.
    """
    for upload in uploads:
        object_key = object_key_for(screening.id, upload.site)
        actual_size = storage.get_object_size(object_key)
        if actual_size is None or actual_size != upload.bytes:
            raise ObjectNotUploadedError(upload.site)

    for upload in uploads:
        session.add(
            ScreeningCapture(
                screening_id=screening.id,
                site=upload.site,
                object_key=object_key_for(screening.id, upload.site),
                sha256=upload.sha256,
                bytes=upload.bytes,
                content_type=UPLOAD_CONTENT_TYPE,
            )
        )

    with rls_scope(
        session, organization_path=organization_path, user_id=str(performed_by_user_id), role=role
    ):
        screening.status = "processing"
        screening.updated_at = datetime.now(UTC)
        session.flush()


def list_screenings(
    session: Session,
    *,
    organization_path: str,
    patient_id: uuid.UUID | None = None,
) -> list[Screening]:
    """Daftar screening pada organisasi tertentu, terbaru dahulu.

    Bila patient_id diberikan, dibatasi ke screening satu pasien itu saja,
    dipakai tab Riwayat pada detail pasien. Tanpa patient_id, mengembalikan
    seluruh screening organisasi, dipakai nakes/monitoring.
    """
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        query = select(Screening).order_by(Screening.created_at.desc())
        if patient_id is not None:
            query = query.where(Screening.patient_id == patient_id)
        return list(session.execute(query).scalars().all())


def record_site_result(
    session: Session,
    *,
    screening_id: uuid.UUID,
    organization_path: str,
    site: str,
    passed_qc: bool | None,
    reasons: list[str],
    metrics: dict[str, object] | None,
    hb_gdl: float | None,
    anemic_probability: float | None,
    model_severity: str | None,
    handcrafted_features: dict[str, object] | None,
    model_version: str | None,
    latency_ms: int | None,
    inference_status: str,
    stage_images: dict[str, object] | None = None,
) -> bool:
    """Menyimpan hasil satu situs, menimpa baris lama bila Cloud Tasks
    mengulang job yang sama (retry aman, bukan menumpuk baris duplikat).

    Setelah menyimpan, memeriksa apakah seluruh situs sesi ini sudah
    terminal (bukan pending), dan bila iya menandai screening selesai.
    Mengembalikan True bila panggilan ini yang membuat screening jadi
    terminal, supaya pemanggil (di luar modul ini, workers.py) tahu kapan
    harus memicu perhitungan fusi lintas situs, karena modul screening dan
    fusion dilarang saling mengimpor langsung oleh kontrak import-linter,
    sesuai hemavision_api.workers yang menjadi lapisan koordinasinya.
    """
    existing = session.execute(
        select(SiteResult).where(SiteResult.screening_id == screening_id, SiteResult.site == site)
    ).scalar_one_or_none()

    if existing is None:
        existing = SiteResult(screening_id=screening_id, site=site)
        session.add(existing)

    existing.passed_qc = passed_qc
    existing.reasons = reasons
    existing.metrics = metrics
    existing.hb_gdl = hb_gdl
    existing.anemic_probability = anemic_probability
    existing.model_severity = model_severity
    existing.handcrafted_features = handcrafted_features
    existing.model_version = model_version
    existing.latency_ms = latency_ms
    existing.inference_status = inference_status
    existing.stage_images = stage_images
    session.flush()

    all_results = (
        session.execute(select(SiteResult).where(SiteResult.screening_id == screening_id))
        .scalars()
        .all()
    )
    sites_done = {result.site for result in all_results if result.inference_status != "pending"}
    if sites_done != set(SCREENING_SITES):
        session.commit()
        return False

    screening = session.get(Screening, screening_id)
    assert screening is not None
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        any_failed = any(result.inference_status == "failed" for result in all_results)
        screening.status = "failed" if any_failed else "completed"
        screening.updated_at = datetime.now(UTC)
        session.flush()
    session.commit()
    return True

def submit_validation(
    session: Session,
    *,
    screening_id: uuid.UUID,
    request: "ClinicalValidationRequest",
) -> ClinicalValidation:
    """Merekam atau memperbarui validasi klinis untuk satu sesi skrining."""
    
    # Check if screening exists
    screening = session.scalar(select(Screening).where(Screening.id == screening_id))
    if not screening:
        raise ValueError(f"Screening {screening_id} tidak ditemukan")

    # Upsert pattern
    validation = session.scalar(
        select(ClinicalValidation).where(ClinicalValidation.screening_id == screening_id)
    )

    if not validation:
        validation = ClinicalValidation(
            screening_id=screening_id,
            status=request.status,
            reviewer_name=request.reviewer_name,
            reviewer_role=request.reviewer_role,
            reviewer_id=request.reviewer_id,
            reason=request.reason,
            notes=request.notes,
            validated_at=datetime.fromisoformat(request.validated_at.replace("Z", "+00:00")),
            formatted_timestamp=request.formatted_timestamp,
            original_ai_result=request.original_ai_result,
        )
        session.add(validation)
    else:
        validation.status = request.status
        validation.reviewer_name = request.reviewer_name
        validation.reviewer_role = request.reviewer_role
        validation.reviewer_id = request.reviewer_id
        validation.reason = request.reason
        validation.notes = request.notes
        validation.validated_at = datetime.fromisoformat(request.validated_at.replace("Z", "+00:00"))  # noqa: E501
        validation.formatted_timestamp = request.formatted_timestamp
        validation.original_ai_result = request.original_ai_result

    session.commit()
    return validation
