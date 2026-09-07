"""Endpoint HTTP modul identity.

Satu satunya router yang mengekspos resolusi identitas terautentikasi ke luar,
sesuai hemavision/docs/adr/001-modular-monolith.md.
"""

from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel

from hemavision_api.modules.identity.dependencies import CurrentUser

router = APIRouter(prefix="/v1", tags=["identity"])


class MembershipResponse(BaseModel):
    """Satu keanggotaan organisasi milik pengguna."""

    organization_id: UUID
    organization_path: str
    role: str


class MeResponse(BaseModel):
    """Identitas pengguna yang sedang masuk beserta seluruh keanggotaannya."""

    id: UUID
    email: str
    display_name: str
    memberships: list[MembershipResponse]


@router.get("/me", response_model=MeResponse)
def get_me(current_user: CurrentUser) -> MeResponse:
    """Mengembalikan identitas pengguna yang sedang masuk.

    Dipanggil frontend segera setelah login berhasil untuk menentukan tujuan
    redirect berdasarkan role, tanpa pernah mempercayai klaim token untuk
    keputusan itu, sesuai hemavision/docs/adr/004-identity-platform.md.
    """
    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        memberships=[
            MembershipResponse(
                organization_id=membership.organization_id,
                organization_path=membership.organization_path,
                role=membership.role,
            )
            for membership in current_user.memberships
        ],
    )
