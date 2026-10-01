"""Basis deklaratif SQLAlchemy, engine, dan konteks Row Level Security.

Skema ditulis vendor agnostik tanpa fitur khusus Neon, sesuai
hemavision/docs/adr/003-database-provider.md, sehingga migrasi ke Cloud SQL kelak
hanya soal mengganti connection string.
"""

import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime

from sqlalchemy import DateTime, Engine, MetaData, create_engine, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.types import UserDefinedType

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Basis deklaratif bersama seluruh model modul.

    Konvensi penamaan constraint didefinisikan eksplisit agar migrasi Alembic
    autogenerate menghasilkan nama yang stabil dan dapat diprediksi, bukan nama
    acak yang berbeda setiap kali skema diregenerasi.
    """

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Ltree(UserDefinedType[str]):
    """Tipe kolom Postgres ltree dari ekstensi ltree.

    Diletakkan di sini, bukan di modul tenancy, karena ini tipe infrastruktur
    generik yang dipakai lebih dari satu modul, misalnya organizations.path dan
    memberships.organization_path. Menaruhnya di satu modul spesifik akan
    memaksa modul lain mengimpornya secara lintas modul, melanggar batas modul
    yang ditegakkan import-linter sesuai
    hemavision/docs/adr/001-modular-monolith.md.

    SQLAlchemy tidak menyediakan tipe ini secara native, sehingga direpresentasikan
    sebagai UserDefinedType yang merender literal LTREE pada DDL. Nilai Python
    diperlakukan sebagai string berformat label dipisah titik, misalnya
    "id.jatim.surabaya.puskesmas_x".
    """

    cache_ok = True

    def get_col_spec(self, **kw: object) -> str:
        return "LTREE"


class UUIDPrimaryKeyMixin:
    """Kolom id seragam untuk tabel yang memakai UUID sebagai primary key.

    Nilai dibangkitkan server_default lewat gen_random_uuid dari ekstensi pgcrypto,
    bukan dibangkitkan di Python, sehingga tetap konsisten meski baris disisipkan
    lewat jalur selain aplikasi ini.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )


class TimestampMixin:
    """Kolom created_at seragam, diisi waktu server saat baris disisipkan."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), nullable=False
    )


def create_db_engine(database_url: str) -> Engine:
    """Membuat engine SQLAlchemy dengan pre ping agar koneksi mati terdeteksi.

    Pre ping penting khusus untuk Neon, karena compute-nya tidur saat idle dan
    koneksi lama dapat menjadi tidak valid setelah bangun kembali.
    """
    return create_engine(database_url, pool_pre_ping=True)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Membuat pabrik sesi yang dipakai seluruh modul."""
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@contextmanager
def rls_scope(
    session: Session,
    *,
    organization_path: str,
    user_id: str | None,
    role: str | None,
) -> Iterator[Session]:
    """Menetapkan konteks Row Level Security untuk durasi satu transaksi.

    Nilai ditetapkan lewat set_config dengan argumen is_local true, setara SET
    LOCAL, sehingga hanya berlaku pada transaksi berjalan dan otomatis hilang
    saat transaksi berakhir, tidak bocor ke koneksi lain yang dipakai ulang dari
    connection pool. Dipakai set_config, bukan SET LOCAL langsung, karena SET
    adalah utility statement yang tidak menerima bind parameter di Postgres,
    sehingga akan gagal begitu koneksi yang sama mengeksekusi teks kueri yang
    sama berulang kali dan driver mempersiapkannya di sisi server. Policy pada
    setiap tabel tenant membaca app.current_org_path lewat current_setting,
    sesuai hemavision/docs/DECISION_LOG.md bagian multi-tenancy.

    organization_path tidak boleh string kosong. Policy memperlakukan string
    kosong sama seperti konteks yang tidak pernah ditetapkan, sehingga akses
    tingkat akar bagi platform_admin harus memakai label akar hierarki yang
    sesungguhnya, bukan string kosong, sesuai
    hemavision_api.migrations.versions.5c5cda9239b6.
    """
    if organization_path == "":
        raise ValueError(
            "organization_path tidak boleh string kosong, policy memperlakukannya "
            "sama seperti konteks tidak ditetapkan; pakai label akar hierarki asli"
        )
    session.execute(
        text("SELECT set_config('app.current_org_path', :value, true)"),
        {"value": organization_path},
    )
    session.execute(
        text("SELECT set_config('app.current_user_id', :value, true)"),
        {"value": user_id or ""},
    )
    session.execute(
        text("SELECT set_config('app.current_role', :value, true)"),
        {"value": role or ""},
    )
    yield session
