"""Worker job inferensi async, dipicu Cloud Tasks.

Ditaruh di luar hemavision_api.modules, karena satu satunya tempat yang
mengoordinasikan modul screening, patients, dan inference sekaligus, yang
dilarang saling mengimpor langsung oleh kontrak import-linter, sama seperti
hemavision_api.registration.
"""

import base64
from datetime import date
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from hemavision_api.core import storage
from hemavision_api.core.config import get_settings
from hemavision_api.core.db import rls_scope
from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.fusion.service import ExcludedSite, SiteContribution, compute_fusion
from hemavision_api.modules.inference.client import InferenceClient
from hemavision_api.modules.inference.schemas import ConjunctivaResponse, NailResponse, PalmResponse
from hemavision_api.modules.patients.service import PatientDemographics, get_patient_demographics
from hemavision_api.modules.screening.models import Screening, SiteResult
from hemavision_api.modules.screening.service import (
    object_key_for,
    record_site_result,
    stage_image_object_key,
)

router = APIRouter(prefix="/internal/jobs", tags=["worker"])

_bearer_scheme = HTTPBearer(auto_error=False)


class InferJobRequest(BaseModel):
    screening_id: UUID
    site: str
    organization_path: str


def _verify_cloud_tasks_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> None:
    """Memverifikasi token OIDC yang diterbitkan Cloud Tasks sendiri.

    Ditolak bila audiens tidak cocok URL layanan ini atau email penerbit
    bukan service account yang ditunjuk sebagai identitas worker, sehingga
    endpoint ini tidak dapat dipicu sembarang pihak meski Cloud Run publik.
    """
    settings = get_settings()
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token wajib disertakan"
        )
    try:
        claims = id_token.verify_oauth2_token(  # type: ignore[no-untyped-call]
            credentials.credentials, google_requests.Request(), audience=settings.public_base_url
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid"
        ) from error

    if claims.get("email") != settings.worker_service_account_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Identitas tidak dikenali"
        )


def _age_years(dob: date) -> float:
    today = date.today()
    return (today - dob).days / 365.25


def _trigger_fusion(
    session: Session,
    *,
    screening_id: UUID,
    organization_path: str,
    demographics: PatientDemographics,
) -> None:
    """Mengumpulkan site_results terbaru dan memicu perhitungan fusi.

    Dipanggil dari sini (bukan dari screening.service) karena modul screening
    dan fusion dilarang saling mengimpor langsung oleh kontrak import-linter;
    workers.py adalah lapisan koordinasi yang sama dipakai record_site_result.
    """
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        all_results = (
            session.execute(select(SiteResult).where(SiteResult.screening_id == screening_id))
            .scalars()
            .all()
        )

    contributions = [
        SiteContribution(
            site=r.site,
            hb_gdl=float(r.hb_gdl),
            anemic_probability=(
                float(r.anemic_probability) if r.anemic_probability is not None else None
            ),
        )
        for r in all_results
        if r.passed_qc and r.hb_gdl is not None
    ]
    excluded_sites = [
        ExcludedSite(
            site=r.site,
            reason="gagal_qc" if r.inference_status == "completed" else "gagal_inferensi",
        )
        for r in all_results
        if not (r.passed_qc and r.hb_gdl is not None)
    ]

    compute_fusion(
        session,
        screening_id=screening_id,
        contributions=contributions,
        excluded_sites=excluded_sites,
        age_years=_age_years(demographics.dob),
        sex=demographics.sex,
        is_pregnant=demographics.pregnancy_status == "pregnant",
    )


@router.post("/infer", dependencies=[Depends(_verify_cloud_tasks_token)])
async def run_inference_job(body: InferJobRequest, session: DbSession) -> dict[str, str]:
    """Mengunduh objek GCS, memanggil inference tier, menyimpan site_results.

    organization_path diambil dari payload job, bukan dibaca ulang dari
    tabel screenings, karena tabel itu dilindungi Row Level Security dan
    worker baru punya konteks organisasi setelah nilai ini tersedia, sesuai
    penjelasan pada hemavision_api.core.tasks.enqueue_inference_job.
    """
    with rls_scope(session, organization_path=body.organization_path, user_id=None, role=None):
        screening = session.get(Screening, body.screening_id)
    if screening is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skrining tidak ditemukan"
        )

    demographics = get_patient_demographics(
        session, patient_id=screening.patient_id, organization_path=body.organization_path
    )
    age_years = _age_years(demographics.dob)
    image_bytes = storage.download_object(object_key_for(screening.id, body.site))

    settings = get_settings()
    client = InferenceClient(settings.inference)
    is_terminal = False
    try:
        response: ConjunctivaResponse | PalmResponse | NailResponse
        if body.site == "conjunctiva":
            response = await client.predict_conjunctiva(
                image_bytes,
                filename=f"{body.site}.jpg",
                content_type="image/jpeg",
                age_years=age_years,
                gender=demographics.sex,
                include_stages=True,
            )
        elif body.site == "palm":
            response = await client.predict_palm(
                image_bytes,
                filename=f"{body.site}.jpg",
                content_type="image/jpeg",
                age_years=age_years,
                gender=demographics.sex,
                include_stages=True,
            )
        elif body.site == "nail":
            response = await client.predict_nail(
                image_bytes,
                filename=f"{body.site}.jpg",
                content_type="image/jpeg",
                age_years=age_years,
                gender=demographics.sex,
                include_stages=True,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Situs tidak dikenal"
            )

        metrics_obj = getattr(response, "metrics", None)
        handcrafted = getattr(response, "handcrafted_features", None)
        stage_images = getattr(response, "stage_images", None)

        stage_image_keys: dict[str, object] | None = None
        if stage_images is not None:
            stage_image_keys = {}
            for stage_key, base64_png in stage_images.model_dump(exclude_none=True).items():
                object_key = stage_image_object_key(screening.id, body.site, stage_key)
                storage.upload_object_bytes(
                    object_key, base64.b64decode(base64_png), content_type="image/png"
                )
                stage_image_keys[stage_key] = object_key

        is_terminal = record_site_result(
            session,
            screening_id=screening.id,
            organization_path=body.organization_path,
            site=body.site,
            passed_qc=getattr(response, "passed_qc", None),
            reasons=list(metrics_obj.reasons) if metrics_obj is not None else [],
            metrics=metrics_obj.model_dump() if metrics_obj is not None else None,
            hb_gdl=getattr(response, "hb_gdl", None),
            anemic_probability=getattr(response, "anemic_probability", None),
            model_severity=getattr(response, "severity", None),
            handcrafted_features=handcrafted.model_dump() if handcrafted is not None else None,
            model_version=None,
            latency_ms=None,
            stage_images=stage_image_keys,
            inference_status="completed",
        )
    except httpx.HTTPError:
        is_terminal = record_site_result(
            session,
            screening_id=screening.id,
            organization_path=body.organization_path,
            site=body.site,
            passed_qc=None,
            reasons=["inference_call_failed"],
            metrics=None,
            hb_gdl=None,
            anemic_probability=None,
            model_severity=None,
            handcrafted_features=None,
            model_version=None,
            latency_ms=None,
            inference_status="failed",
        )
    finally:
        await client.aclose()

    if is_terminal:
        _trigger_fusion(
            session,
            screening_id=screening.id,
            organization_path=body.organization_path,
            demographics=demographics,
        )

    return {"status": "processed"}
