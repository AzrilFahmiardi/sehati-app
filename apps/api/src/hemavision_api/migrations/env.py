"""Lingkungan Alembic.

URL basis data diambil dari konfigurasi aplikasi (hemavision_api.core.config),
bukan ditulis ulang di alembic.ini, sehingga hanya ada satu sumber kebenaran untuk
connection string baik saat aplikasi berjalan maupun saat migrasi dijalankan.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from hemavision_api.core.config import get_settings
from hemavision_api.models_registry import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _database_url() -> str:
    return get_settings().effective_migrations_url


def run_migrations_offline() -> None:
    """Menjalankan migrasi dalam mode offline, menghasilkan SQL tanpa koneksi."""
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Menjalankan migrasi dengan koneksi sungguhan ke basis data."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = _database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
