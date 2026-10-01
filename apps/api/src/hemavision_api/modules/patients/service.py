"""Penulisan baris patients untuk registrasi mandiri.

Satu satunya tempat yang boleh membuat baris patients untuk pasien yang
mendaftar sendiri lewat web, sesuai
hemavision/docs/adr/004-identity-platform.md bagian Per Persona yang direvisi.
Modul ini tidak mengetahui apa pun tentang users atau memberships, itu urusan
modul identity, sesuai hemavision/docs/adr/001-modular-monolith.md.
"""

import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, date, datetime

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from hemavision_api.core.db import rls_scope
from hemavision_api.modules.patients import crypto
from hemavision_api.modules.patients.models import Patient, PatientClaimRequest

MANDIRI_ORGANIZATION_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
MANDIRI_ORGANIZATION_PATH = "id.mandiri"

_PLATFORM_ROOT_PATH = "id"
"""Prefix ltree yang menaungi seluruh organisasi (id.mandiri, id.jatim..., dst).

Tidak ada baris organizations dengan path persis "id" ini, tapi predikat RLS
memakai perbandingan ltree "path <@ current_org_path" (turunan-dari-atau-sama-
dengan), jadi menyetel konteks ke "id" tetap mencocokkan semua organisasi
tanpa perlu baris akar itu ada. Dipakai hanya oleh helper internal modul ini
yang memang perlu mencari lintas organisasi (nik_hmac dan owner_user_id
bersifat unik secara global), tidak pernah diekspos ke router.
"""


@contextmanager
def _root_scope(session: Session) -> Iterator[Session]:
    with rls_scope(
        session, organization_path=_PLATFORM_ROOT_PATH, user_id=None, role="platform_admin"
    ):
        yield session


class NikAlreadyRegisteredError(Exception):
    """NIK sudah tercatat pada baris patients lain."""


@dataclass(frozen=True)
class RegisteredPatient:
    """Baris patients yang baru dibuat lewat registrasi mandiri."""

    patient_id: uuid.UUID


@dataclass(frozen=True)
class PatientDemographics:
    """Data non-PII yang dibutuhkan pemanggilan inference tier dan fusi hasil
    (usia, jenis kelamin, status kehamilan), tanpa pernah membuka
    name_encrypted atau nik_encrypted."""

    dob: date
    sex: str
    pregnancy_status: str


def get_patient_demographics(
    session: Session,
    *,
    patient_id: uuid.UUID,
    organization_path: str,
) -> PatientDemographics:
    """Membaca dob, sex, dan pregnancy_status satu pasien di bawah konteks
    organisasi tertentu.

    Dipanggil worker skrining untuk menghitung age_years dan gender yang
    dikirim ke inference tier, sesuai
    hemavision_api.modules.inference.client.InferenceClient, dan dipanggil
    modul fusion untuk menentukan cutoff WHO yang dipakai.
    """
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        patient = session.get(Patient, patient_id)
    assert patient is not None
    return PatientDemographics(
        dob=patient.dob, sex=patient.sex, pregnancy_status=patient.pregnancy_status
    )


@dataclass(frozen=True)
class PatientRecord:
    """Baris patients dengan PII sudah didekripsi, dipakai daftar dan detail
    pasien di dashboard nakes."""

    id: uuid.UUID
    display_name: str
    dob: date
    sex: str
    owner_user_id: uuid.UUID | None


def create_patient_for_organization(
    session: Session,
    *,
    organization_id: uuid.UUID,
    organization_path: str,
    created_by_user_id: uuid.UUID,
    role: str,
    display_name: str,
    nik: str,
    dob: date,
    sex: str,
) -> RegisteredPatient:
    """Membuat baris patients di bawah organisasi nakes yang membuatnya.

    Mengikuti pola persis create_self_registered_patient, hanya organisasinya
    diambil dari membership pemanggil alih-alih MANDIRI_ORGANIZATION_ID.
    Melempar NikAlreadyRegisteredError lewat IntegrityError constraint basis
    data. Pemanggil wajib session.rollback() saat menangkap error ini sebelum
    memakai session lebih lanjut, karena flush yang gagal meninggalkan
    transaksi dalam keadaan tidak dapat dipakai.
    """
    nik_hmac = crypto.compute_nik_hmac(nik)

    patient_id = uuid.uuid4()
    pregnancy_status = "unknown" if sex == "F" else "none"

    try:
        with rls_scope(
            session,
            organization_path=organization_path,
            user_id=str(created_by_user_id),
            role=role,
        ):
            patient = Patient(
                id=patient_id,
                organization_id=organization_id,
                name_encrypted=crypto.encrypt_field(
                    display_name, table="patients", column="name_encrypted", row_id=patient_id
                ),
                nik_encrypted=crypto.encrypt_field(
                    nik, table="patients", column="nik_encrypted", row_id=patient_id
                ),
                nik_hmac=nik_hmac,
                dob=dob,
                sex=sex,
                pregnancy_status=pregnancy_status,
            )
            session.add(patient)
            session.flush()
    except IntegrityError as error:
        raise NikAlreadyRegisteredError(nik) from error

    return RegisteredPatient(patient_id=patient_id)


def list_patients(
    session: Session,
    *,
    organization_path: str,
) -> list[PatientRecord]:
    """Daftar pasien pada organisasi tertentu, PII sudah didekripsi."""
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        patients = session.execute(select(Patient)).scalars().all()

    return [
        PatientRecord(
            id=patient.id,
            display_name=crypto.decrypt_field(
                patient.name_encrypted, table="patients", column="name_encrypted", row_id=patient.id
            ),
            dob=patient.dob,
            sex=patient.sex,
            owner_user_id=patient.owner_user_id,
        )
        for patient in patients
    ]


def get_patient_names(
    session: Session,
    *,
    organization_path: str,
    patient_ids: list[uuid.UUID],
) -> dict[uuid.UUID, str]:
    """Memetakan patient_id ke display_name yang sudah didekripsi, dalam satu
    query, dipakai daftar screening lintas pasien agar tidak query per baris."""
    if not patient_ids:
        return {}

    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        patients = (
            session.execute(select(Patient).where(Patient.id.in_(patient_ids))).scalars().all()
        )

    return {
        patient.id: crypto.decrypt_field(
            patient.name_encrypted, table="patients", column="name_encrypted", row_id=patient.id
        )
        for patient in patients
    }


def get_patient(
    session: Session,
    *,
    patient_id: uuid.UUID,
    organization_path: str,
) -> PatientRecord | None:
    """Satu pasien pada organisasi tertentu, PII sudah didekripsi, atau None."""
    with rls_scope(session, organization_path=organization_path, user_id=None, role=None):
        patient = session.get(Patient, patient_id)

    if patient is None:
        return None
    return PatientRecord(
        id=patient.id,
        display_name=crypto.decrypt_field(
            patient.name_encrypted, table="patients", column="name_encrypted", row_id=patient.id
        ),
        dob=patient.dob,
        sex=patient.sex,
        owner_user_id=patient.owner_user_id,
    )


@dataclass(frozen=True)
class OwnedPatient:
    """Identitas pasien pemilik akun login, dipakai GET /v1/patients/me."""

    patient_id: uuid.UUID
    organization_id: uuid.UUID
    organization_path: str


def get_patient_for_owner(
    session: Session,
    *,
    owner_user_id: uuid.UUID,
) -> OwnedPatient | None:
    """Mencari baris patients milik pengguna yang login sebagai pasien.

    Mencari lintas seluruh organisasi lewat _root_scope, karena baris
    patients yang dimiliki pengguna bisa berada di organisasi pseudo
    HemaVision Mandiri (registrasi mandiri tanpa klaim) maupun di organisasi
    fasilitas nakes (setelah klaim riwayat disetujui, lihat approve_claim).
    Mengembalikan None bila pengguna belum pernah mendaftar sebagai pasien.
    """
    with _root_scope(session):
        patient = session.execute(
            select(Patient).where(Patient.owner_user_id == owner_user_id)
        ).scalar_one_or_none()

    if patient is None:
        return None
    return OwnedPatient(
        patient_id=patient.id,
        organization_id=patient.organization_id,
        organization_path=(
            MANDIRI_ORGANIZATION_PATH
            if patient.organization_id == MANDIRI_ORGANIZATION_ID
            else _resolve_organization_path(session, organization_id=patient.organization_id)
        ),
    )


def _resolve_organization_path(session: Session, *, organization_id: uuid.UUID) -> str:
    """Membaca path ltree suatu organisasi lewat konteks lintas organisasi.

    Dipakai get_patient_for_owner untuk mengembalikan organization_path yang
    benar ketika baris patients yang diklaim berada di organisasi fasilitas,
    bukan di Mandiri, karena OwnedPatient perlu path itu untuk rls_scope
    pemanggilan API selanjutnya (get_patient_demographics, list_screenings).

    Memakai SQL mentah alih alih model ORM Organization, karena modul
    patients dilarang mengimpor kode Python modul tenancy secara langsung
    lewat kontrak import-linter pada pyproject.toml, sesuai
    hemavision/docs/adr/001-modular-monolith.md.
    """
    with _root_scope(session):
        row = session.execute(
            text("SELECT path FROM organizations WHERE id = :organization_id"),
            {"organization_id": organization_id},
        ).one()
    return row[0]


def find_patient_by_nik(session: Session, *, nik: str) -> PatientRecord | None:
    """Mencari baris patients mana pun (lintas organisasi) dengan NIK tertentu.

    Dipakai registration.py untuk mendeteksi tabrakan NIK sebelum mencoba
    insert, supaya alur registrasi bisa membedakan "NIK benar-benar baru" dari
    "NIK sudah punya baris patients nakes yang belum diklaim" tanpa bergantung
    pada IntegrityError yang meracuni transaksi gabungan users+memberships.
    """
    nik_hmac = crypto.compute_nik_hmac(nik)
    with _root_scope(session):
        patient = session.execute(
            select(Patient).where(Patient.nik_hmac == nik_hmac)
        ).scalar_one_or_none()

    if patient is None:
        return None
    return PatientRecord(
        id=patient.id,
        display_name=crypto.decrypt_field(
            patient.name_encrypted, table="patients", column="name_encrypted", row_id=patient.id
        ),
        dob=patient.dob,
        sex=patient.sex,
        owner_user_id=patient.owner_user_id,
    )


class ClaimNotFoundError(Exception):
    """Tidak ada PatientClaimRequest dengan id tersebut."""


class ClaimStateError(Exception):
    """Transisi status klaim yang diminta tidak valid dari status saat ini."""


class ClaimForbiddenError(Exception):
    """Pemanggil bukan pemilik permintaan klaim ini."""


@dataclass(frozen=True)
class ClaimRecord:
    """Satu permintaan klaim riwayat, dipakai beranda pasien dan dashboard
    nakes."""

    id: uuid.UUID
    patient_id: uuid.UUID
    requester_user_id: uuid.UUID
    status: str
    created_at: datetime
    decided_at: datetime | None


@dataclass(frozen=True)
class ClaimApproval:
    """Detail organisasi tempat baris patients yang diklaim berada, dipakai
    pemanggil approve_claim untuk memberi Membership baru ke requester lewat
    modul identity, sesuai batas modular monolith (patients tidak membuat
    Membership sendiri)."""

    claim: ClaimRecord
    requester_user_id: uuid.UUID
    organization_id: uuid.UUID
    organization_path: str


def _to_claim_record(claim: PatientClaimRequest) -> ClaimRecord:
    return ClaimRecord(
        id=claim.id,
        patient_id=claim.patient_id,
        requester_user_id=claim.requester_user_id,
        status=claim.status,
        created_at=claim.created_at,
        decided_at=claim.decided_at,
    )


def create_claim_offer(
    session: Session, *, patient_id: uuid.UUID, requester_user_id: uuid.UUID
) -> ClaimRecord:
    """Membuat PatientClaimRequest berstatus offered saat registrasi mendeteksi
    NIK cocok dengan baris nakes yang belum diklaim.

    Tidak melakukan commit, dipanggil registration.py dalam transaksi yang
    sama dengan provision_pasien_user.
    """
    claim = PatientClaimRequest(
        patient_id=patient_id, requester_user_id=requester_user_id, status="offered"
    )
    session.add(claim)
    session.flush()
    return _to_claim_record(claim)


def get_claim_for_requester(
    session: Session, *, requester_user_id: uuid.UUID
) -> ClaimRecord | None:
    """Klaim milik pengguna yang login, dipakai GET /v1/patients/claims/me."""
    claim = session.execute(
        select(PatientClaimRequest).where(
            PatientClaimRequest.requester_user_id == requester_user_id
        )
    ).scalar_one_or_none()
    if claim is None:
        return None
    return _to_claim_record(claim)


def promote_claim_to_pending(
    session: Session, *, claim_id: uuid.UUID, requester_user_id: uuid.UUID
) -> ClaimRecord:
    """Transisi offered menjadi pending saat pasien menekan tombol minta tarik
    data, sehingga klaim menjadi terlihat nakes."""
    claim = session.get(PatientClaimRequest, claim_id)
    if claim is None:
        raise ClaimNotFoundError(claim_id)
    if claim.requester_user_id != requester_user_id:
        raise ClaimForbiddenError(claim_id)
    if claim.status != "offered":
        raise ClaimStateError(claim.status)

    claim.status = "pending"
    session.flush()
    return _to_claim_record(claim)


def list_pending_claims_for_organization(
    session: Session, *, organization_path: str
) -> list[ClaimRecord]:
    """Daftar klaim berstatus pending untuk pasien yang barisnya berada di
    bawah organisasi tertentu, dipakai dashboard nakes.

    patient_claim_requests tidak dilindungi RLS, jadi join eksplisit ke
    patients lewat _root_scope lalu filter organization_id manual, mengikuti
    pola isolasi lapisan aplikasi yang sama seperti dsar_requests.
    """
    with _root_scope(session):
        rows = session.execute(
            select(PatientClaimRequest, Patient.organization_id)
            .join(Patient, Patient.id == PatientClaimRequest.patient_id)
            .where(PatientClaimRequest.status == "pending")
        ).all()

    return [
        _to_claim_record(claim)
        for claim, organization_id in rows
        if _organization_id_under_path(session, organization_id, organization_path)
    ]


def _organization_id_under_path(
    session: Session, organization_id: uuid.UUID, organization_path: str
) -> bool:
    path = _resolve_organization_path(session, organization_id=organization_id)
    return path == organization_path or path.startswith(f"{organization_path}.")


def get_claim_organization(session: Session, *, claim_id: uuid.UUID) -> uuid.UUID:
    """Organisasi tempat baris patients yang ditunjuk klaim berada, dipakai
    router untuk memeriksa wewenang pemanggil SEBELUM memanggil approve_claim
    atau reject_claim, supaya percobaan tanpa wewenang tidak sempat memutasi
    apa pun."""
    claim = session.get(PatientClaimRequest, claim_id)
    if claim is None:
        raise ClaimNotFoundError(claim_id)

    with _root_scope(session):
        patient = session.get(Patient, claim.patient_id)
        assert patient is not None
        return patient.organization_id


def approve_claim(
    session: Session, *, claim_id: uuid.UUID, decided_by_user_id: uuid.UUID
) -> ClaimApproval:
    """Menyetujui klaim: menautkan baris patients lama ke requester lewat
    owner_user_id, dan mengembalikan organisasi tempat baris itu berada
    supaya pemanggil bisa memberi Membership baru lewat modul identity.

    Tidak melakukan commit, membiarkan pemanggil menyatukan transaksi ini
    dengan pembuatan Membership.
    """
    claim = session.get(PatientClaimRequest, claim_id)
    if claim is None:
        raise ClaimNotFoundError(claim_id)
    if claim.status != "pending":
        raise ClaimStateError(claim.status)

    with _root_scope(session):
        patient = session.get(Patient, claim.patient_id)
        assert patient is not None
        patient.owner_user_id = claim.requester_user_id
        organization_path = _resolve_organization_path(
            session, organization_id=patient.organization_id
        )
        organization_id = patient.organization_id

    claim.status = "approved"
    claim.decided_by_user_id = decided_by_user_id
    claim.decided_at = datetime.now(tz=UTC)
    session.flush()

    return ClaimApproval(
        claim=_to_claim_record(claim),
        requester_user_id=claim.requester_user_id,
        organization_id=organization_id,
        organization_path=organization_path,
    )


def reject_claim(
    session: Session, *, claim_id: uuid.UUID, decided_by_user_id: uuid.UUID
) -> ClaimRecord:
    """Menolak klaim, mencatat siapa dan kapan."""
    claim = session.get(PatientClaimRequest, claim_id)
    if claim is None:
        raise ClaimNotFoundError(claim_id)
    if claim.status != "pending":
        raise ClaimStateError(claim.status)

    claim.status = "rejected"
    claim.decided_by_user_id = decided_by_user_id
    claim.decided_at = datetime.now(tz=UTC)
    session.flush()
    return _to_claim_record(claim)


def create_self_registered_patient(
    session: Session,
    *,
    owner_user_id: uuid.UUID,
    display_name: str,
    nik: str,
    dob: date,
    sex: str,
) -> RegisteredPatient:
    """Membuat baris patients di bawah organisasi pseudo HemaVision Mandiri.

    Tidak melakukan commit, membiarkan pemanggil menyatukan transaksi ini
    dengan penulisan baris users dan memberships yang menyertainya. Melempar
    NikAlreadyRegisteredError bila NIK sudah tercatat pada baris lain, lewat
    IntegrityError constraint basis data, bukan select pra-cek yang tidak
    dapat melihat baris organisasi lain di bawah Row Level Security.
    """
    nik_hmac = crypto.compute_nik_hmac(nik)

    patient_id = uuid.uuid4()
    pregnancy_status = "unknown" if sex == "F" else "none"

    try:
        with rls_scope(
            session,
            organization_path=MANDIRI_ORGANIZATION_PATH,
            user_id=str(owner_user_id),
            role="pasien",
        ):
            patient = Patient(
                id=patient_id,
                organization_id=MANDIRI_ORGANIZATION_ID,
                owner_user_id=owner_user_id,
                name_encrypted=crypto.encrypt_field(
                    display_name, table="patients", column="name_encrypted", row_id=patient_id
                ),
                nik_encrypted=crypto.encrypt_field(
                    nik, table="patients", column="nik_encrypted", row_id=patient_id
                ),
                nik_hmac=nik_hmac,
                dob=dob,
                sex=sex,
                pregnancy_status=pregnancy_status,
            )
            session.add(patient)
            session.flush()
    except IntegrityError as error:
        raise NikAlreadyRegisteredError(nik) from error

    return RegisteredPatient(patient_id=patient_id)
