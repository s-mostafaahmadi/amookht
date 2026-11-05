from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.infrastructure.database.connection import init_db, close_db, ensure_runtime_tables
from app.infrastructure.cache.redis import init_redis, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    await init_db(settings.DATABASE_URL)
    await ensure_runtime_tables()
    await init_redis(settings.REDIS_URL)
    yield
    # Shutdown
    await close_db()
    await close_redis()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        description="Adaptive Learning Platform",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5500", "http://127.0.0.1:5500", "null", "http://learn.tah3in.com", "https://learn.tah3in.com"] if settings.DEBUG else ["https://amookht.dev", "http://learn.tah3in.com", "https://learn.tah3in.com"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    from app.api.routes import auth, learning, writing, speaking, vocabulary, errors, analytics, health, account, content_bank, testdaf_exams, admin
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
    app.include_router(learning.router, prefix="/v1/learning", tags=["Learning"])
    app.include_router(writing.router, prefix="/v1/writing", tags=["Writing"])
    app.include_router(speaking.router, prefix="/v1/speaking", tags=["Speaking"])
    app.include_router(vocabulary.router, prefix="/v1/vocabulary", tags=["Vocabulary"])
    app.include_router(errors.router, prefix="/v1/errors", tags=["Errors"])
    app.include_router(analytics.router, prefix="/v1/analytics", tags=["Analytics"])
    app.include_router(account.router, prefix="/v1/account", tags=["Account & State"])
    app.include_router(content_bank.router, prefix="/v1/content-bank", tags=["Content Bank"])
    app.include_router(testdaf_exams.router, prefix="/v1/testdaf-exams", tags=["TestDaF Exams"])
    app.include_router(admin.router, prefix="/v1/admin", tags=["Administration"])

    return app


app = create_app()
