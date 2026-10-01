"""Dependency FastAPI untuk autentikasi dan otorisasi.

Setiap permintaan diverifikasi dua tahap sesuai
hemavision/docs/adr/004-identity-platform.md: tanda tangan ID token diperiksa
terhadap Identity Platform, lalu otorisasi diambil dari Postgres pada setiap
permintaan, bukan dari klaim token.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from hemavision_api.core.config import get_settings
from hemavision_api.core.dependencies import DbSession
from hemavision_api.modules.identity.security import InvalidTokenError, verify_id_token
from hemavision_api.modules.identity.service import (
    AuthenticatedUser,
    UserNotProvisionedError,
    UserSuspendedError,
    resolve_authenticated_user,
)

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    session: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> AuthenticatedUser:
    """Memverifikasi ID token pada header Authorization dan mengembalikan
    pengguna beserta seluruh keanggotaannya.

    Melempar 401 untuk token yang hilang, tidak valid, atau akun yang belum
    diprovisioning, dan 403 untuk akun yang berstatus suspended. 401 dan 403
    dibedakan karena maknanya berbeda bagi klien: 401 berarti coba masuk
    ulang, 403 berarti masuk sudah benar tetapi akses ditolak.
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

    try:
        return resolve_authenticated_user(
            session, identity_provider_uid=identity.identity_provider_uid
        )
    except UserNotProvisionedError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun belum diprovisioning untuk identitas ini",
        ) from error
    except UserSuspendedError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Akun ditangguhkan"
        ) from error


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]

# Pengecekan keanggotaan per organisasi sengaja tidak diekspos sebagai dependency
# generik. Setiap router membaca resource_organization_id dari sumber yang
# berbeda (path parameter, body, atau hasil query lain), sehingga pengecekannya
# dilakukan langsung di dalam handler lewat current_user.membership_for(
# organization_id), lalu hasilnya dipakai membuka hemavision_api.core.db.rls_scope
# sebelum query lain pada permintaan yang sama dijalankan.
