"""Endpoint HTTP sesi skrining: pembuatan, submit unggahan, dan status.

Setiap endpoint menerima organization_id secara eksplisit dari client, dipakai
mencari organization_path lewat current_user.membership_for tanpa pernah
membaca tabel organizations yang dilindungi Row Level Security, dan
organization_path itulah yang membuka rls_scope sebelum membaca baris
screenings, sesuai pola yang sama seperti
hemavision_api.modules.identity.models.Membership.

Pemanggilan Cloud Tasks dilakukan di sini, bukan di service.py, karena
enqueue_inference_job sengaja dijalankan setelah transaksi submit_screening
commit, supaya job tidak pernah diantre untuk transaksi yang ternyata gagal.
"""

from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.core import storage, tasks
from hemavision_api.core.config import get_settings
from hemavision_api.core.db import rls_scope
from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.fusion.models import FusedResult
from hemavision_api.modules.identity.dependencies import CurrentUser
from hemavision_api.modules.identity.service import AuthenticatedUser
from hemavision_api.modules.inference.client import InferenceClient
from hemavision_api.modules.patients.service import get_patient_for_owner, get_patient_names
from hemavision_api.modules.screening.models import SCREENING_SITES, Screening, SiteResult
from hemavision_api.modules.screening.service import (
    CaptureUpload,
    ObjectNotUploadedError,
    create_screening,
    list_screenings,
    submit_screening,
)

router = APIRouter(prefix="/v1/screenings", tags=["screening"])


class CreateScreeningRequest(BaseModel):
    patient_id: UUID
    organization_id: UUID
    sites: list[str] = Field(default_factory=lambda: list(SCREENING_SITES))
    idempotency_key: str = Field(min_length=1, max_length=128)


class UploadTarget(BaseModel):
    site: str
    object_key: str
    upload_url: str


class CreateScreeningResponse(BaseModel):
    screening_id: UUID
    status: str
    uploads: list[UploadTarget]


class SubmitUpload(BaseModel):
    site: str
    bytes: int
    sha256: str


class SubmitScreeningRequest(BaseModel):
    organization_id: UUID
    uploads: list[SubmitUpload]


class SubmitScreeningResponse(BaseModel):
    status: str


class SiteResultResponse(BaseModel):
    site: str
    inference_status: str
    passed_qc: bool | None
    hb_gdl: float | None
    anemic_probability: float | None
    model_severity: str | None
    reasons: list[str]
    stage_images: dict[str, str] | None


class FusedResultResponse(BaseModel):
    hb_gdl: float
    decision: str
    who_category: str
    contributing_sites: dict[str, object]
    caveats: dict[str, object]


class ClinicalValidationRequest(BaseModel):
    organization_id: UUID
    status: str
    reviewer_name: str
    reviewer_role: str
    reviewer_id: str | None = None
    reason: str | None = None
    notes: str | None = None
    validated_at: str
    formatted_timestamp: str
    original_ai_result: dict[str, object]


class ScreeningStatusResponse(BaseModel):
    screening_id: UUID
    status: str
    site_results: list[SiteResultResponse]
    fused_result: FusedResultResponse | None


class SiteSummary(BaseModel):
    site: str
    hb_gdl: float | None
    inference_status: str


class QualityCheckResponseBody(BaseModel):
    passed_qc: bool | None
    reasons: list[str]


class ScreeningSummaryResponse(BaseModel):
    screening_id: UUID
    patient_id: UUID
    patient_display_name: str
    status: str
    created_at: str
    site_summaries: list[SiteSummary]
    decision: str | None
    who_category: str | None


def _membership_or_403(current_user: AuthenticatedUser, organization_id: UUID) -> tuple[str, str]:
    """Mengembalikan (role, organization_path) atau melempar 403 bila
    pengguna bukan anggota organisasi yang diklaim."""
    membership = current_user.membership_for(organization_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda bukan anggota organisasi ini",
        )
    return membership.role, membership.organization_path


def _get_screening_in_scope(
    session: Session, *, screening_id: UUID, organization_path: str
) -> Screening:
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        screening = session.get(Screening, screening_id)
    if screening is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skrining tidak ditemukan"
        )
    return screening


@router.post("", response_model=CreateScreeningResponse)
def start_screening(
    body: CreateScreeningRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> CreateScreeningResponse:
    """Membuat sesi skrining draft dan menerbitkan signed URL unggah per situs."""
    role, organization_path = _membership_or_403(current_user, body.organization_id)

    screening, object_keys = create_screening(
        session,
        patient_id=body.patient_id,
        organization_id=body.organization_id,
        organization_path=organization_path,
        performed_by_user_id=current_user.id,
        role=role,
        sites=body.sites,
        idempotency_key=body.idempotency_key,
    )
    session.commit()

    uploads = [
        UploadTarget(
            site=site,
            object_key=object_key,
            upload_url=storage.generate_signed_upload_url(object_key, content_type="image/jpeg"),
        )
        for site, object_key in object_keys.items()
    ]

    return CreateScreeningResponse(
        screening_id=screening.id, status=screening.status, uploads=uploads
    )


@router.post("/{screening_id}/submit", response_model=SubmitScreeningResponse)
def submit(
    screening_id: UUID,
    body: SubmitScreeningRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> SubmitScreeningResponse:
    """Memverifikasi unggahan ada di GCS, menandai processing, lalu
    mengantre satu job inferensi per situs."""
    role, organization_path = _membership_or_403(current_user, body.organization_id)
    screening = _get_screening_in_scope(
        session, screening_id=screening_id, organization_path=organization_path
    )

    try:
        submit_screening(
            session,
            screening=screening,
            organization_path=organization_path,
            performed_by_user_id=current_user.id,
            role=role,
            uploads=[
                CaptureUpload(site=upload.site, bytes=upload.bytes, sha256=upload.sha256)
                for upload in body.uploads
            ],
        )
    except ObjectNotUploadedError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Berkas untuk situs {error} belum ditemukan di penyimpanan",
        ) from error

    session.commit()

    for upload in body.uploads:
        tasks.enqueue_inference_job(
            screening_id=screening.id, site=upload.site, organization_path=organization_path
        )

    return SubmitScreeningResponse(status="processing")


@router.post("/{screening_id}/sites/{site}/check-quality", response_model=QualityCheckResponseBody)
async def check_capture_quality(
    screening_id: UUID,
    site: str,
    organization_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
    image: UploadFile = File(...),
) -> QualityCheckResponseBody:
    """Cek kualitas satu foto capture terhadap layanan inference, sebelum situs disubmit final.

    Tidak menulis apa pun ke tabel site_results, karena ini cek sementara yang
    boleh dipanggil berkali kali saat pasien mengulang pengambilan foto, bukan
    hasil skrining final.
    """
    _, organization_path = _membership_or_403(current_user, organization_id)
    _get_screening_in_scope(
        session, screening_id=screening_id, organization_path=organization_path
    )
    if site not in SCREENING_SITES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Situs tidak dikenal"
        )

    image_bytes = await image.read()
    client = InferenceClient(get_settings().inference)
    try:
        if site == "conjunctiva":
            response = await client.check_quality_conjunctiva(
                image_bytes, filename="conjunctiva.jpg", content_type=image.content_type or "image/jpeg"
            )
        elif site == "palm":
            response = await client.check_quality_palm(
                image_bytes, filename="palm.jpg", content_type=image.content_type or "image/jpeg"
            )
        else:
            response = await client.check_quality_nail(
                image_bytes, filename="nail.jpg", content_type=image.content_type or "image/jpeg"
            )
    finally:
        await client.aclose()

    return QualityCheckResponseBody(passed_qc=response.passed_qc, reasons=list(response.reasons))


@router.get("", response_model=list[ScreeningSummaryResponse])
def list_screenings_endpoint(
    organization_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
    patient_id: UUID | None = None,
) -> list[ScreeningSummaryResponse]:
    """Daftar screening organisasi, atau satu pasien bila patient_id diberikan.

    Dipakai tab Riwayat pada detail pasien (dengan patient_id) dan
    nakes/monitoring sebagai riwayat lintas pasien (tanpa patient_id).

    Pemanggil ber-role pasien selalu dipaksa melihat hanya riwayat miliknya
    sendiri, mengabaikan patient_id apa pun yang dikirim client, supaya
    berbagi organisasi dengan pasien lain di fasilitas yang sama tidak
    membocorkan riwayat mereka.
    """
    role, organization_path = _membership_or_403(current_user, organization_id)
    if role == "pasien":
        owned = get_patient_for_owner(session, owner_user_id=current_user.id)
        if owned is None:
            return []
        patient_id = owned.patient_id
    screenings = list_screenings(
        session, organization_path=organization_path, patient_id=patient_id
    )

    screening_ids = [screening.id for screening in screenings]
    results_by_screening: dict[UUID, list[SiteResult]] = {
        screening_id: [] for screening_id in screening_ids
    }
    fused_by_screening: dict[UUID, FusedResult] = {}
    if screening_ids:
        site_results = (
            session.execute(select(SiteResult).where(SiteResult.screening_id.in_(screening_ids)))
            .scalars()
            .all()
        )
        for site_result in site_results:
            results_by_screening[site_result.screening_id].append(site_result)

        fused_results = (
            session.execute(select(FusedResult).where(FusedResult.screening_id.in_(screening_ids)))
            .scalars()
            .all()
        )
        fused_by_screening = {fused.screening_id: fused for fused in fused_results}

    patient_names = get_patient_names(
        session,
        organization_path=organization_path,
        patient_ids=[screening.patient_id for screening in screenings],
    )

    return [
        ScreeningSummaryResponse(
            screening_id=screening.id,
            patient_id=screening.patient_id,
            patient_display_name=patient_names.get(screening.patient_id, "Tidak diketahui"),
            status=screening.status,
            created_at=screening.created_at.isoformat(),
            site_summaries=[
                SiteSummary(
                    site=result.site,
                    hb_gdl=float(result.hb_gdl) if result.hb_gdl is not None else None,
                    inference_status=result.inference_status,
                )
                for result in results_by_screening[screening.id]
            ],
            decision=(
                fused_by_screening[screening.id].decision
                if screening.id in fused_by_screening
                else None
            ),
            who_category=(
                fused_by_screening[screening.id].who_category
                if screening.id in fused_by_screening
                else None
            ),
        )
        for screening in screenings
    ]


def _fused_result_response(fused: FusedResult | None) -> FusedResultResponse | None:
    if fused is None:
        return None
    return FusedResultResponse(
        hb_gdl=float(fused.hb_gdl),
        decision=fused.decision,
        who_category=fused.who_category,
        contributing_sites=fused.contributing_sites,
        caveats=fused.caveats,
    )


def _resolve_stage_images(stage_images: dict[str, object] | None) -> dict[str, str] | None:
    """Mengubah object key GCS jadi signed URL sementara.

    Screening lama (sebelum stage_images dipindah ke GCS) masih menyimpan
    base64 mentah langsung di kolom ini. Object key selalu pendek (path file),
    sedangkan base64 PNG minimal ribuan karakter, jadi panjang string dipakai
    membedakan keduanya tanpa perlu migrasi data.
    """
    if stage_images is None:
        return None
    resolved: dict[str, str] = {}
    for stage_key, value in stage_images.items():
        value_str = str(value)
        if len(value_str) > 500:
            resolved[stage_key] = f"data:image/png;base64,{value_str}"
        else:
            resolved[stage_key] = storage.generate_signed_read_url(value_str)
    return resolved


@router.get("/{screening_id}", response_model=ScreeningStatusResponse)
def get_status(
    screening_id: UUID,
    organization_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> ScreeningStatusResponse:
    """Status sesi skrining beserta seluruh hasil situs yang sudah masuk,
    dipoll frontend dengan backoff sampai status terminal."""
    role, organization_path = _membership_or_403(current_user, organization_id)
    screening = _get_screening_in_scope(
        session, screening_id=screening_id, organization_path=organization_path
    )
    if role == "pasien":
        owned = get_patient_for_owner(session, owner_user_id=current_user.id)
        if owned is None or owned.patient_id != screening.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda hanya dapat mengakses skrining milik sendiri",
            )

    results = (
        session.execute(select(SiteResult).where(SiteResult.screening_id == screening_id))
        .scalars()
        .all()
    )
    fused = session.execute(
        select(FusedResult).where(FusedResult.screening_id == screening_id)
    ).scalar_one_or_none()

    return ScreeningStatusResponse(
        screening_id=screening.id,
        status=screening.status,
        fused_result=_fused_result_response(fused),
        site_results=[
            SiteResultResponse(
                site=result.site,
                inference_status=result.inference_status,
                passed_qc=result.passed_qc,
                hb_gdl=float(result.hb_gdl) if result.hb_gdl is not None else None,
                anemic_probability=(
                    float(result.anemic_probability)
                    if result.anemic_probability is not None
                    else None
                ),
                model_severity=result.model_severity,
                reasons=result.reasons,
                stage_images=_resolve_stage_images(result.stage_images),
            )
            for result in results
        ],
    )


@router.post("/{screening_id}/validate")
def validate_screening(
    screening_id: UUID,
    request: ClinicalValidationRequest,
    session: DbSession,
    user: CurrentUser,
) -> dict[str, str]:
    """Merekam validasi klinis dari Tenaga Kesehatan terhadap hasil AI."""
    membership = user.membership_for(request.organization_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Tidak memiliki akses ke organisasi ini")

    from hemavision_api.modules.screening.service import submit_validation

    with rls_scope(session, organization_path=membership.organization_path, user_id=None, role=None):
        submit_validation(
            session=session,
            screening_id=screening_id,
            request=request,
        )

    return {"status": "ok"}

