import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# 경로 계산:
#   __file__ = /app/backend/alembic/env.py  (Docker)
#            = c:\kkh\cake_saas\backend\alembic\env.py  (로컬)
# '../..' → /app  (Docker) 또는 c:\kkh\cake_saas (로컬)
# 'backend' 패키지가 올바른 패키지로 인식되어 상대 임포트 작동
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.config import settings    # noqa: E402
from backend.database import Base      # noqa: E402
import backend.models                  # noqa: E402, F401  — metadata 등록용

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
