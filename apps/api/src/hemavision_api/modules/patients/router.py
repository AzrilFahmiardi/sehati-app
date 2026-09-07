"""Endpoint HTTP pasien untuk dashboard nakes: buat, daftar, dan detail.

Mengikuti pola persis hemavision_api.modules.screening.router: organization_id
diterima eksplisit dari client, dicocokkan lewat current_user.membership_for
untuk mendapat organization_path tanpa membaca tabel organizations yang
dilindungi Row Level Security.
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.identity.dependencies import CurrentUser
from hemavision_api.modules.identity.service import AuthenticatedUser, grant_membership
from hemavision_api.modules.patients.service import (
    ClaimForbiddenError,
    ClaimNotFoundError,
    ClaimStateError,
    NikAlreadyRegisteredError,
    approve_claim,
    create_patient_for_organization,
    get_claim_for_requester,
    get_claim_organization,
    get_patient,
    get_patient_for_owner,
    list_patients,
    list_pending_claims_for_organization,
    promote_claim_to_pending,
    reject_claim,
)

router = APIRouter(prefix="/v1/patients", tags=["patients"])


def _require_own_patient_if_pasien(
    session: DbSession, current_user: AuthenticatedUser, *, role: str, patient_id: UUID
) -> None:
    """Menolak akses bila pemanggil ber-role pasien mencoba melihat baris
    patients yang bukan miliknya.

    Nakes (role selain pasien) tidak dibatasi fungsi ini, karena akses mereka
    sudah dibatasi organisasi lewat _membership_or_403.
    """
    if role != "pasien":
        return
    owned = get_patient_for_owner(session, owner_user_id=current_user.id)
    if owned is None or owned.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda hanya dapat mengakses data pasien milik sendiri",
        )


class CreatePatientRequest(BaseModel):
    organization_id: UUID
    display_name: str = Field(min_length=1, max_length=255)
    nik: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")
    dob: date
    sex: str = Field(pattern=r"^[MF]$")


class CreatePatientResponse(BaseModel):
    patient_id: UUID


class PatientResponse(BaseModel):
    id: UUID
    display_name: str
    dob: str
    sex: str


class OwnedPatientResponse(BaseModel):
    patient_id: UUID
    organization_id: UUID
    organization_path: str


def _membership_or_403(current_user: AuthenticatedUser, organization_id: UUID) -> tuple[str, str]:
    membership = current_user.membership_for(organization_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda bukan anggota organisasi ini",
        )
    return membership.role, membership.organization_path


@router.post("", response_model=CreatePatientResponse)
def create_patient(
    body: CreatePatientRequest,
    session: DbSession,
    current_user: CurrentUser,
) -> CreatePatientResponse:
    """Membuat baris pasien baru di bawah organisasi nakes yang sedang login."""
    role, organization_path = _membership_or_403(current_user, body.organization_id)

    try:
        registered = create_patient_for_organization(
            session,
            organization_id=body.organization_id,
            organization_path=organization_path,
            created_by_user_id=current_user.id,
            role=role,
            display_name=body.display_name,
            nik=body.nik,
            dob=body.dob,
            sex=body.sex,
        )
    except NikAlreadyRegisteredError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="NIK sudah terdaftar pada pasien lain",
        ) from error

    session.commit()
    return CreatePatientResponse(patient_id=registered.patient_id)


@router.get("", response_model=list[PatientResponse])
def list_patients_endpoint(
    organization_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> list[PatientResponse]:
    """Daftar pasien pada organisasi tertentu.

    Pemanggil ber-role pasien hanya melihat baris miliknya sendiri (bila ada),
    supaya berbagi organisasi dengan pasien lain di fasilitas yang sama tidak
    membocorkan data mereka.
    """
    role, organization_path = _membership_or_403(current_user, organization_id)
    patients = list_patients(session, organization_path=organization_path)
    if role == "pasien":
        owned = get_patient_for_owner(session, owner_user_id=current_user.id)
        owned_id = owned.patient_id if owned is not None else None
        patients = [patient for patient in patients if patient.id == owned_id]
    return [
        PatientResponse(
            id=patient.id,
            display_name=patient.display_name,
            dob=patient.dob.isoformat(),
            sex=patient.sex,
        )
        for patient in patients
    ]


@router.get("/me", response_model=OwnedPatientResponse)
def get_own_patient_endpoint(
    session: DbSession,
    current_user: CurrentUser,
) -> OwnedPatientResponse:
    """Identitas pasien milik pengguna yang sedang login, dipakai frontend
    untuk menemukan patient_id/organization_id tanpa mengandalkan
    sessionStorage yang diisi saat registrasi."""
    owned = get_patient_for_owner(session, owner_user_id=current_user.id)
    if owned is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anda belum terdaftar sebagai pasien",
        )
    return OwnedPatientResponse(
        patient_id=owned.patient_id,
        organization_id=owned.organization_id,
        organization_path=owned.organization_path,
    )


class ClaimResponse(BaseModel):
    id: UUID
    patient_id: UUID
    status: str


@router.get("/claims/me", response_model=ClaimResponse)
def get_my_claim_endpoint(session: DbSession, current_user: CurrentUser) -> ClaimResponse:
    """Klaim riwayat skrining milik pengguna yang sedang login, dipakai
    beranda pasien untuk menampilkan banner status."""
    claim = get_claim_for_requester(session, requester_user_id=current_user.id)
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tidak ada permintaan klaim"
        )
    return ClaimResponse(id=claim.id, patient_id=claim.patient_id, status=claim.status)


@router.post("/claims/{claim_id}/request", response_model=ClaimResponse)
def request_claim_endpoint(
    claim_id: UUID, session: DbSession, current_user: CurrentUser
) -> ClaimResponse:
    """Menekan tombol minta tarik data: klaim offered menjadi pending sehingga
    terlihat di dashboard nakes."""
    try:
        claim = promote_claim_to_pending(
            session, claim_id=claim_id, requester_user_id=current_user.id
        )
    except ClaimNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permintaan klaim tidak ditemukan"
        ) from error
    except ClaimForbiddenError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bukan permintaan klaim Anda"
        ) from error
    except ClaimStateError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permintaan klaim sudah diproses",
        ) from error

    session.commit()
    return ClaimResponse(id=claim.id, patient_id=claim.patient_id, status=claim.status)


@router.get("/claims", response_model=list[ClaimResponse])
def list_claims_endpoint(
    organization_id: UUID, session: DbSession, current_user: CurrentUser
) -> list[ClaimResponse]:
    """Daftar klaim menunggu persetujuan pada organisasi tertentu, dipakai
    dashboard nakes."""
    role, organization_path = _membership_or_403(current_user, organization_id)
    if role == "pasien":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya tenaga kesehatan yang dapat melihat daftar klaim",
        )
    claims = list_pending_claims_for_organization(session, organization_path=organization_path)
    return [
        ClaimResponse(id=claim.id, patient_id=claim.patient_id, status=claim.status)
        for claim in claims
    ]


@router.post("/claims/{claim_id}/approve", response_model=ClaimResponse)
def approve_claim_endpoint(
    claim_id: UUID, session: DbSession, current_user: CurrentUser
) -> ClaimResponse:
    """Menyetujui klaim: menautkan owner_user_id pada baris patients lama dan
    memberi pemohon Membership pasien di organisasi fasilitas itu."""
    try:
        organization_id = get_claim_organization(session, claim_id=claim_id)
    except ClaimNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permintaan klaim tidak ditemukan"
        ) from error
    _membership_or_403(current_user, organization_id)

    try:
        approval = approve_claim(session, claim_id=claim_id, decided_by_user_id=current_user.id)
    except ClaimNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permintaan klaim tidak ditemukan"
        ) from error
    except ClaimStateError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permintaan klaim sudah diproses atau belum diajukan",
        ) from error

    grant_membership(
        session,
        user_id=approval.requester_user_id,
        organization_id=approval.organization_id,
        organization_path=approval.organization_path,
        role="pasien",
    )
    session.commit()
    return ClaimResponse(
        id=approval.claim.id, patient_id=approval.claim.patient_id, status=approval.claim.status
    )


@router.post("/claims/{claim_id}/reject", response_model=ClaimResponse)
def reject_claim_endpoint(
    claim_id: UUID, session: DbSession, current_user: CurrentUser
) -> ClaimResponse:
    """Menolak klaim."""
    try:
        organization_id = get_claim_organization(session, claim_id=claim_id)
    except ClaimNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permintaan klaim tidak ditemukan"
        ) from error
    _membership_or_403(current_user, organization_id)

    try:
        claim = reject_claim(session, claim_id=claim_id, decided_by_user_id=current_user.id)
    except ClaimNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permintaan klaim tidak ditemukan"
        ) from error
    except ClaimStateError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permintaan klaim sudah diproses atau belum diajukan",
        ) from error

    session.commit()
    return ClaimResponse(id=claim.id, patient_id=claim.patient_id, status=claim.status)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_endpoint(
    patient_id: UUID,
    organization_id: UUID,
    session: DbSession,
    current_user: CurrentUser,
) -> PatientResponse:
    """Detail satu pasien pada organisasi tertentu."""
    role, organization_path = _membership_or_403(current_user, organization_id)
    _require_own_patient_if_pasien(session, current_user, role=role, patient_id=patient_id)
    patient = get_patient(session, patient_id=patient_id, organization_path=organization_path)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pasien tidak ditemukan"
        )
    return PatientResponse(
        id=patient.id,
        display_name=patient.display_name,
        dob=patient.dob.isoformat(),
        sex=patient.sex,
    )
