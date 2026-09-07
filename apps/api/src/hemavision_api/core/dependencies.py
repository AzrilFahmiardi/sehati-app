"""Dependency FastAPI untuk mengakses sesi basis data.

Dependency ini sengaja hanya menyediakan sesi mentah, tanpa menetapkan konteks Row
Level Security. Penetapan konteks (organisasi, pengguna, peran) memerlukan identitas
terautentikasi yang belum ada sampai modul identity selesai dibangun. Setelah itu,
router memanggil hemavision_api.core.db.rls_scope dengan nilai yang diambil dari
token terverifikasi, bukan menuliskannya sendiri di sini.

Perilaku ini aman sebagai keadaan sementara. Karena seluruh tabel tenant memakai
FORCE ROW LEVEL SECURITY, sesi tanpa konteks yang ditetapkan tidak dapat membaca
maupun menulis baris tenant mana pun, gagal tertutup alih alih gagal terbuka.
"""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session


def get_db_session(request: Request) -> Generator[Session, None, None]:
    """Menghasilkan sesi basis data yang terikat ke sessionmaker aplikasi.

    Sessionmaker dibuat sekali saat startup dan disimpan di app.state, sesuai
    hemavision_api.main.lifespan, agar tidak membuka koneksi baru pada setiap
    permintaan.
    """
    session_factory = request.app.state.session_factory
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


DbSession = Annotated[Session, Depends(get_db_session)]
