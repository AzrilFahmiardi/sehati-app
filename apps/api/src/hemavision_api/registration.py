"""Registrasi mandiri pasien.

Endpoint ini sengaja ditaruh di luar hemavision_api.modules, karena satu satunya
tempat yang mengoordinasikan penulisan users, memberships (modul identity) dan
patients (modul patients) dalam satu transaksi. Kedua modul dilarang saling
mengimpor kode Python langsung oleh kontrak import-linter pada pyproject.toml,
sesuai hemavision/docs/adr/001-modular-monolith.md, sehingga penyatuannya harus
berada di lapisan yang tidak tunduk pada kontrak itu.
"""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from hemavision_api.core.config import get_settings
from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.identity.security import InvalidTokenError, verify_id_token
from hemavision_api.modules.identity.service import (
    EmailAlreadyRegisteredError,
    provision_pasien_user,
)
from hemavision_api.modules.patients.service import (
    MANDIRI_ORGANIZATION_ID,
    MANDIRI_ORGANIZATION_PATH,
    NikAlreadyRegisteredError,
    create_claim_offer,
    create_self_registered_patient,
    find_patient_by_nik,
)

router = APIRouter(prefix="/v1/patients", tags=["patients"])

_bearer_scheme = HTTPBearer(auto_error=False)


class PatientRegistrationRequest(BaseModel):
    """Data profil yang dikirim setelah akun Identity Platform berhasil dibuat
    di sisi client."""

    display_name: str = Field(min_length=1, max_length=255)
    nik: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")
    dob: date
    sex: str = Field(pattern=r"^[MF]$")


class PatientRegistrationResponse(BaseModel):
    """Konfirmasi akun yang berhasil dibuat.

    patient_id dan organization_id kosong ketika has_pending_claim_offer
    bernilai True, karena NIK yang didaftarkan cocok dengan baris patients
    nakes yang sudah ada dan belum diklaim, hanya baris users dan memberships
    yang dibuat. Pasien perlu meminta tarik data lewat
    POST /v1/patients/claims/{claim_id}/request sebelum baris patients itu
    resmi tertaut ke akunnya.
    """

    user_id: UUID
    patient_id: UUID | None = None
    organization_id: UUID | None = None
    organization_path: str | None = None
    has_pending_claim_offer: bool = False


@router.post("/register", response_model=PatientRegistrationResponse)
def register_patient(
    body: PatientRegistrationRequest,
    session: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> PatientRegistrationResponse:
    """Menyelesaikan registrasi mandiri: memverifikasi ID token yang baru
    diterbitkan Identity Platform, lalu membuat baris users, memberships peran
    pasien, dan patients dalam satu transaksi.

    Sengaja tidak memakai dependency get_current_user, karena identitas ini
    belum diprovisioning sama sekali di Postgres, itulah yang sedang dikerjakan
    endpoint ini.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header Authorization Bearer wajib disertakan",
        )

    settings = get_settings()
    try:
        identity = verify_id_token(
            credentials.credentials, project_id=settings.identity_platform_project_id
        )
    except InvalidTokenError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error

    if identity.email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID token tidak memuat email",
        )

    existing_patient = find_patient_by_nik(session, nik=body.nik)
    if existing_patient is not None and existing_patient.owner_user_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NIK sudah terdaftar")

    try:
        user = provision_pasien_user(
            session,
            identity_provider_uid=identity.identity_provider_uid,
            email=identity.email,
            display_name=body.display_name,
            organization_id=MANDIRI_ORGANIZATION_ID,
            organization_path=MANDIRI_ORGANIZATION_PATH,
        )

        if existing_patient is not None:
            create_claim_offer(
                session, patient_id=existing_patient.id, requester_user_id=user.id
            )
            session.commit()
            return PatientRegistrationResponse(user_id=user.id, has_pending_claim_offer=True)

        registered_patient = create_self_registered_patient(
            session,
            owner_user_id=user.id,
            display_name=body.display_name,
            nik=body.nik,
            dob=body.dob,
            sex=body.sex,
        )
    except EmailAlreadyRegisteredError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email sudah terdaftar"
        ) from error
    except NikAlreadyRegisteredError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="NIK sudah terdaftar"
        ) from error

    session.commit()

    return PatientRegistrationResponse(
        user_id=user.id,
        patient_id=registered_patient.patient_id,
        organization_id=MANDIRI_ORGANIZATION_ID,
        organization_path=MANDIRI_ORGANIZATION_PATH,
    )
