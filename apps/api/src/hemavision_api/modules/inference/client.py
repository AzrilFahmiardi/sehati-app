"""Klien pemanggil ketiga endpoint inference tier yang sudah live di Cloud Run.

Ini adalah satu satunya kode di seluruh produk yang mengetahui alamat Cloud Run
tersebut, sesuai hemavision/docs/adr/002-repository-boundary.md. Bentuk request dan
response ditranskripsi dari hemavision/docs/API_CONTRACT.md, dan kesesuaiannya
terhadap layanan sungguhan diperiksa lewat pengujian kontrak pada
tests/modules/inference/test_contract_live.py.
"""

from typing import Any

import httpx
from pydantic import HttpUrl

from hemavision_api.core.config import InferenceSettings
from hemavision_api.modules.inference.auth import IdentityTokenProvider
from hemavision_api.modules.inference.schemas import (
    ConjunctivaResponse,
    NailResponse,
    PalmResponse,
    QualityCheckResponse,
)


def _bool_form(value: bool) -> str:
    """Mengonversi boolean Python menjadi string boolean yang dipahami form field.

    Kontrak API menerima include_stages sebagai string "true" atau "false", bukan
    sebagai boolean JSON, karena seluruh request berbentuk multipart/form-data.
    """
    return "true" if value else "false"


class InferenceClient:
    """Pemanggil endpoint prediksi conjunctiva, palm, dan nail."""

    def __init__(
        self,
        settings: InferenceSettings,
        http_client: httpx.AsyncClient | None = None,
        token_provider: IdentityTokenProvider | None = None,
    ) -> None:
        self._settings = settings
        self._http = http_client if http_client is not None else httpx.AsyncClient()
        self._tokens = token_provider if token_provider is not None else IdentityTokenProvider()

    async def aclose(self) -> None:
        """Menutup koneksi HTTP yang dipegang klien ini."""
        await self._http.aclose()

    async def _post(
        self,
        base_url: HttpUrl,
        path: str,
        *,
        data: dict[str, str],
        file_field: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
        timeout: float,
    ) -> dict[str, Any]:
        base = str(base_url).rstrip("/")
        token = await self._tokens.get_token(base)
        response = await self._http.post(
            f"{base}/{path}",
            data=data,
            files={file_field: (filename, file_bytes, content_type)},
            headers={"Authorization": f"Bearer {token}"},
            timeout=timeout,
        )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
        return payload

    async def predict_conjunctiva(
        self,
        image_bytes: bytes,
        *,
        filename: str,
        content_type: str,
        age_years: float,
        gender: str,
        site: str = "ghana",
        include_stages: bool = False,
    ) -> ConjunctivaResponse:
        """Memanggil POST /predict/conjunctiva."""
        payload = await self._post(
            self._settings.conjunctiva_url,
            "predict/conjunctiva",
            data={
                "age_years": str(age_years),
                "gender": gender,
                "site": site,
                "include_stages": _bool_form(include_stages),
            },
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return ConjunctivaResponse.model_validate(payload)

    async def predict_palm(
        self,
        image_bytes: bytes,
        *,
        filename: str,
        content_type: str,
        age_years: float,
        gender: str,
        include_stages: bool = False,
    ) -> PalmResponse:
        """Memanggil POST /predict/palm dengan satu foto telapak tangan mentah."""
        payload = await self._post(
            self._settings.palm_url,
            "predict/palm",
            data={
                "age_years": str(age_years),
                "gender": gender,
                "include_stages": _bool_form(include_stages),
            },
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return PalmResponse.model_validate(payload)

    async def predict_nail(
        self,
        image_bytes: bytes,
        *,
        filename: str,
        content_type: str,
        age_years: float,
        gender: str,
        include_stages: bool = False,
    ) -> NailResponse:
        """Memanggil POST /predict/nail."""
        payload = await self._post(
            self._settings.nail_url,
            "predict/nail",
            data={
                "age_years": str(age_years),
                "gender": gender,
                "include_stages": _bool_form(include_stages),
            },
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return NailResponse.model_validate(payload)

    async def check_quality_conjunctiva(
        self, image_bytes: bytes, *, filename: str, content_type: str
    ) -> QualityCheckResponse:
        """Memanggil POST /check-quality/conjunctiva, tanpa menjalankan prediksi hemoglobin."""
        payload = await self._post(
            self._settings.conjunctiva_url,
            "check-quality/conjunctiva",
            data={},
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return QualityCheckResponse.model_validate(payload)

    async def check_quality_palm(
        self, image_bytes: bytes, *, filename: str, content_type: str
    ) -> QualityCheckResponse:
        """Memanggil POST /check-quality/palm, tanpa menjalankan prediksi hemoglobin."""
        payload = await self._post(
            self._settings.palm_url,
            "check-quality/palm",
            data={},
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return QualityCheckResponse.model_validate(payload)

    async def check_quality_nail(
        self, image_bytes: bytes, *, filename: str, content_type: str
    ) -> QualityCheckResponse:
        """Memanggil POST /check-quality/nail, tanpa menjalankan prediksi hemoglobin."""
        payload = await self._post(
            self._settings.nail_url,
            "check-quality/nail",
            data={},
            file_field="image",
            file_bytes=image_bytes,
            filename=filename,
            content_type=content_type,
            timeout=self._settings.image_timeout_seconds,
        )
        return QualityCheckResponse.model_validate(payload)
