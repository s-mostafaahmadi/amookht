from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData, text

# Naming convention for constraints (important for Alembic)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


# Global engine and session factory
_engine = None
_session_factory = None


async def init_db(database_url: str) -> None:
    from app.config import get_settings

    global _engine, _session_factory
    settings = get_settings()
    _engine = create_async_engine(
        database_url,
        echo=settings.DATABASE_ECHO,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_timeout=settings.DATABASE_POOL_TIMEOUT_SECONDS,
        pool_recycle=settings.DATABASE_POOL_RECYCLE_SECONDS,
        pool_pre_ping=True,
    )
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def ensure_runtime_tables() -> None:
    if _engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    async with _engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS access_role VARCHAR(20) NOT NULL DEFAULT 'normal'
        """))
        await conn.execute(text("""
            UPDATE users SET access_role = 'owner'
            WHERE LOWER(email) = 'tah3in@gmail.com'
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_app_states (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                schema_version INTEGER NOT NULL DEFAULT 1,
                state_data JSON NOT NULL DEFAULT '{}'::json,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """))
        await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_app_states_user_id ON user_app_states (user_id)"))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS global_content_entries (
                topic_key VARCHAR(160) NOT NULL,
                skill_key VARCHAR(40) NOT NULL,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                item_count INTEGER NOT NULL DEFAULT 0,
                question_count INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (topic_key, skill_key)
            )
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_global_content_entries_skill ON global_content_entries (skill_key)"))

async def close_db() -> None:
    global _engine
    if _engine:
        await _engine.dispose()


def get_session_factory():
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _session_factory


async def get_db() -> AsyncSession:
    factory = get_session_factory()
    async with factory() as session:
        yield session
