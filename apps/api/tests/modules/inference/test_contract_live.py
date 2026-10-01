"""Pengujian kontrak terhadap inference tier yang sudah live di Cloud Run.

Ini adalah job contract yang dijelaskan pada
hemavision/docs/adr/002-repository-boundary.md: karena tidak ada kode yang dibagi
antara repo produk dan repo riset, kesesuaian kontrak dijaga dengan memanggil
endpoint sungguhan dan memastikan response-nya masih tervalidasi oleh model
Pydantic pada modules/inference/schemas.py. Bila inference tier berubah bentuk,
pengujian ini gagal lebih dulu, bukan produksi yang rusak diam diam.

Pengujian ini dilewati otomatis bila Application Default Credentials tidak
tersedia, karena lingkungan pengembangan lokal biasanya tidak memilikinya. Untuk
menjalankan secara nyata:

    gcloud auth application-default login

atau sediakan service account dengan role roles/run.invoker pada ketiga service
lewat GOOGLE_APPLICATION_CREDENTIALS.
"""

import io
from pathlib import Path

import httpx
import pytest
from PIL import Image

from hemavision_api.core.config import get_settings
from hemavision_api.modules.inference.client import InferenceClient

FIXTURES_DIR = Path(__file__).parent / "fixtures"
FIXTURE_PALM_IMAGE = FIXTURES_DIR / "palm_sample.jpg"


def _has_google_credentials() -> bool:
    try:
        import google.auth

        google.auth.default()
    except Exception:
        return False
    return True


requires_google_credentials = pytest.mark.skipif(
    not _has_google_credentials(),
    reason=(
        "Application Default Credentials tidak tersedia. Jalankan "
        "'gcloud auth application-default login', atau berikan service account "
        "dengan role roles/run.invoker pada ketiga service inference tier."
    ),
)


def _fixture_image_bytes() -> bytes:
    """Menghasilkan citra JPEG kecil untuk memicu response dari server.

    Citra ini sengaja tidak dirancang lolos quality control. Tujuan pengujian ini
    adalah memverifikasi bentuk response sesuai kontrak, bukan memverifikasi
    akurasi prediksi, sehingga kegagalan quality control sama sahihnya sebagai
    hasil pengujian selama bentuknya masih sesuai model Pydantic.
    """
    buffer = io.BytesIO()
    Image.new("RGB", (256, 256), color=(120, 80, 70)).save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
async def inference_client():
    settings = get_settings().inference
    client = InferenceClient(settings)
    try:
        yield client
    finally:
        await client.aclose()


@requires_google_credentials
class TestConjunctivaContract:
    async def test_response_matches_schema(self, inference_client: InferenceClient) -> None:
        try:
            response = await inference_client.predict_conjunctiva(
                _fixture_image_bytes(),
                filename="fixture.jpg",
                content_type="image/jpeg",
                age_years=30,
                gender="F",
            )
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 403:
                pytest.fail(
                    "Ditolak IAM (403). Periksa apakah service account yang dipakai "
                    "memiliki role roles/run.invoker pada hemavision-conjunctiva."
                )
            raise

        assert isinstance(response.passed_qc, bool)
        if response.is_conclusive:
            assert response.hb_gdl is not None
            assert response.severity_caveat is not None


@requires_google_credentials
class TestNailContract:
    async def test_response_matches_schema(self, inference_client: InferenceClient) -> None:
        try:
            response = await inference_client.predict_nail(
                _fixture_image_bytes(),
                filename="fixture.jpg",
                content_type="image/jpeg",
                age_years=30,
                gender="F",
            )
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 403:
                pytest.fail(
                    "Ditolak IAM (403). Periksa apakah service account yang dipakai "
                    "memiliki role roles/run.invoker pada hemavision-nail."
                )
            raise

        assert isinstance(response.passed_qc, bool)


@requires_google_credentials
class TestPalmContract:
    async def test_response_matches_schema(self, inference_client: InferenceClient) -> None:
        if not FIXTURE_PALM_IMAGE.exists():
            pytest.skip(
                "Belum ada berkas foto contoh di "
                f"{FIXTURE_PALM_IMAGE.relative_to(Path.cwd())}. Tempatkan satu foto "
                "telapak tangan di sana untuk menjalankan pengujian kontrak palm "
                "secara nyata."
            )

        try:
            response = await inference_client.predict_palm(
                FIXTURE_PALM_IMAGE.read_bytes(),
                filename="palm_sample.jpg",
                content_type="image/jpeg",
                age_years=30,
                gender="F",
            )
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 403:
                pytest.fail(
                    "Ditolak IAM (403). Periksa apakah service account yang dipakai "
                    "memiliki role roles/run.invoker pada hemavision-palm."
                )
            raise

        assert isinstance(response.frame_detected, bool)
