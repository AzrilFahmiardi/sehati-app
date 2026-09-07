"""Penyedia ID token untuk memanggil Cloud Run privat.

Ketiga service inference bersifat privat (--no-allow-unauthenticated), sehingga
setiap panggilan wajib menyertakan ID token Google yang diperoleh lewat service
account dengan role run.invoker, sesuai hemavision/docs/API_CONTRACT.md bagian
Autentikasi.
"""

import asyncio
import base64
import json
import time

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.id_token import fetch_id_token

_REFRESH_MARGIN_SECONDS = 60.0


def _decode_expiry(token: str) -> float:
    """Mengambil klaim exp dari ID token tanpa memverifikasi tanda tangan.

    Verifikasi tanda tangan tidak diperlukan di sini karena token baru saja
    diterbitkan oleh google.oauth2.id_token pada proses yang sama, sehingga
    dipercaya secara inheren. Fungsi ini semata dipakai untuk menentukan kapan
    token perlu disegarkan.
    """
    payload_segment = token.split(".")[1]
    padding = "=" * (-len(payload_segment) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_segment + padding))
    return float(payload["exp"])


class IdentityTokenProvider:
    """Menyediakan ID token per audience dengan cache dan penguncian per audience.

    Cache mencegah pengambilan token baru pada setiap request, karena token
    berlaku sekitar satu jam. Kunci per audience mencegah beberapa request
    konkuren memicu banyak permintaan penyegaran token secara bersamaan untuk
    audience yang sama.
    """

    def __init__(self) -> None:
        self._cache: dict[str, tuple[str, float]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def get_token(self, audience: str) -> str:
        """Mengembalikan ID token yang valid untuk audience yang diberikan."""
        cached = self._cache.get(audience)
        if cached is not None and time.time() < cached[1] - _REFRESH_MARGIN_SECONDS:
            return cached[0]

        lock = self._locks.setdefault(audience, asyncio.Lock())
        async with lock:
            cached = self._cache.get(audience)
            if cached is not None and time.time() < cached[1] - _REFRESH_MARGIN_SECONDS:
                return cached[0]

            token: str = await asyncio.to_thread(fetch_id_token, GoogleAuthRequest(), audience)
            self._cache[audience] = (token, _decode_expiry(token))
            return token
