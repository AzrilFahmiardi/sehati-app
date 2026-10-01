"""Endpoint explanation hasil skrining untuk nakes dan pasien."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from hemavision_api.core.config import get_settings
from hemavision_api.core.db import rls_scope
from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.explanation.models import ScreeningExplanation
from hemavision_api.modules.explanation.provider import GeminiExplanationProvider
from hemavision_api.modules.explanation.service import generate_explanation, get_cached
from hemavision_api.modules.fusion.models import FusedResult
from hemavision_api.modules.identity.dependencies import CurrentUser
from hemavision_api.modules.identity.service import AuthenticatedUser
from hemavision_api.modules.patients.service import get_patient_for_owner
from hemavision_api.modules.screening.models import Screening, SiteResult

router = APIRouter(prefix="/v1/screenings", tags=["explanation"])


class ExplanationResponse(BaseModel):
    screening_id: UUID
    audience: str
    locale: str
    status: str
    model: str | None
    prompt_version: str
    content: dict[str, object]
    generated_at: str


class GenerateExplanationRequest(BaseModel):
    organization_id: UUID
    audience: str = Field(pattern="^(nakes|pasien)$")
    locale: str = Field(default="id-ID", min_length=2, max_length=16)


def _membership_or_403(current_user: AuthenticatedUser, organization_id: UUID) -> Any:
    membership = current_user.membership_for(organization_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Akses organisasi ditolak"
        )
    return membership


def _screening_or_404(session: DbSession, screening_id: UUID, organization_path: str) -> Screening:
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        screening = session.get(Screening, screening_id)
    if screening is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skrining tidak ditemukan"
        )
    return screening


def _authorize_audience(
    session: DbSession,
    current_user: AuthenticatedUser,
    membership: Any,
    screening: Screening,
    audience: str,
) -> None:
    if audience == "nakes" and membership.role == "pasien":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Audience nakes tidak tersedia"
        )
    if membership.role == "pasien":
        owned = get_patient_for_owner(session, owner_user_id=current_user.id)
        if owned is None or owned.patient_id != screening.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Skrining pasien lain tidak dapat diakses",
            )


def _response(item: ScreeningExplanation) -> ExplanationResponse:
    return ExplanationResponse(
        screening_id=item.screening_id,
        audience=item.audience,
        locale=item.locale,
        status=item.status,
        model=item.model,
        prompt_version=item.prompt_version,
        content=item.content,
        generated_at=item.generated_at.isoformat(),
    )


@router.get("/{screening_id}/explanation", response_model=ExplanationResponse)
def get_explanation(
    screening_id: UUID,
    organization_id: UUID,
    audience: str,
    session: DbSession,
    current_user: CurrentUser,
    locale: str = "id-ID",
) -> ExplanationResponse:
    if audience not in {"nakes", "pasien"}:
        raise HTTPException(status_code=400, detail="Audience tidak dikenal")
    membership = _membership_or_403(current_user, organization_id)
    screening = _screening_or_404(session, screening_id, membership.organization_path)
    _authorize_audience(session, current_user, membership, screening, audience)
    explanation = get_cached(session, screening_id=screening_id, audience=audience, locale=locale)
    if explanation is None or explanation.status != "generated":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Explanation AI belum tersedia"
        )
    return _response(explanation)


@router.post("/{screening_id}/explanation", response_model=ExplanationResponse)
def create_explanation(
    screening_id: UUID,
    request: GenerateExplanationRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> ExplanationResponse:
    membership = _membership_or_403(current_user, request.organization_id)
    screening = _screening_or_404(session, screening_id, membership.organization_path)
    _authorize_audience(session, current_user, membership, screening, request.audience)
    cached = get_cached(
        session,
        screening_id=screening_id,
        audience=request.audience,
        locale=request.locale,
    )
    if cached is not None and cached.status == "generated":
        return _response(cached)
    if cached is not None:
        session.delete(cached)
        session.flush()
    with rls_scope(
        session, organization_path=membership.organization_path, user_id=None, role=None
    ):
        fused = session.execute(
            select(FusedResult).where(FusedResult.screening_id == screening_id)
        ).scalar_one_or_none()
        site_results = list(
            session.execute(
                select(SiteResult).where(SiteResult.screening_id == screening_id)
            ).scalars()
        )
        if fused is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Hasil fusi belum tersedia"
            )
        provider = GeminiExplanationProvider(get_settings().explanation)
        explanation = generate_explanation(
            session,
            screening=screening,
            fused=fused,
            site_results=site_results,
            audience=request.audience,
            locale=request.locale,
            provider=provider,
        )
    session.commit()
    return _response(explanation)
