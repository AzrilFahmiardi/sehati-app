"""Pengujian verifikasi ID token.

Tidak memerlukan kredensial Google apa pun, karena verifikasi tanda tangan adalah
operasi kunci publik, cukup jaringan untuk mengambil JWKS Google. Pengujian ini
membuktikan bahwa token sampah dan token dengan bentuk salah ditolak sebelum
sempat menyentuh logika otorisasi apa pun.
"""

import pytest

from hemavision_api.modules.identity.security import InvalidTokenError, verify_id_token


def test_garbage_token_is_rejected() -> None:
    with pytest.raises(InvalidTokenError):
        verify_id_token("bukan-token-jwt-sama-sekali", project_id="hemavision-test")


def test_malformed_jwt_structure_is_rejected() -> None:
    with pytest.raises(InvalidTokenError):
        verify_id_token("header.payload", project_id="hemavision-test")


def test_token_signed_by_unknown_key_is_rejected() -> None:
    """Token dengan struktur JWT valid tetapi tanda tangan palsu.

    Header dan payload berbentuk base64url yang sah, tetapi ditandatangani
    dengan kunci yang tidak dikenal Google, sehingga verifikasi tanda tangan
    harus gagal, bukan lolos begitu saja karena strukturnya terlihat benar.
    """
    fake_jwt = (
        "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZha2UifQ."
        "eyJzdWIiOiJmYWtlLXVpZCIsImF1ZCI6ImhlbWF2aXNpb24tdGVzdCJ9."
        "dGFuZGFfdGFuZ2FuX3BhbHN1"
    )
    with pytest.raises(InvalidTokenError):
        verify_id_token(fake_jwt, project_id="hemavision-test")
