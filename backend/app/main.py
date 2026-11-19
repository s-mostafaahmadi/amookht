from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.infrastructure.database.connection import init_db, close_db, ensure_runtime_tables
from app.infrastructure.cache.redis import init_redis, close_redis
from app.infrastructure.telegram.bot import telegram_bot


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    await init_db(settings.DATABASE_URL)
    try:  # DDL-LOCK: schema already exists; a busy lock (e.g. standby during restart) must not block startup
        await ensure_runtime_tables()
    except Exception as exc:
        import logging; logging.getLogger(__name__).warning('runtime schema check skipped: %s', type(exc).__name__)
    await init_redis(settings.REDIS_URL)
    await telegram_bot.start()
    try:  # TGBOT2: telegram link/announcement tables
        from app.infrastructure.telegram.store import ensure_tables as _tg_tables
        await _tg_tables()
    except Exception:
        import logging; logging.getLogger(__name__).exception('telegram tables')
    yield
    # Shutdown
    await telegram_bot.stop()
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
    from app.api.middleware.operations import OperationalAlertMiddleware
    app.add_middleware(OperationalAlertMiddleware)

    # Routes
    from app.api.routes import widget, auth, learning, writing, speaking, vocabulary, errors, analytics, health, account, content_bank, testdaf_exams, admin, library, owner_ai_chat
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
    app.include_router(library.router, prefix="/v1/library", tags=["Premium Library"])
    app.include_router(owner_ai_chat.router, prefix="/v1/owner-ai", tags=["Owner AI Chat"])
    from app.api.routes import owner_packs  # OWNER-PACKS: stored complete session packs (six exercise categories)
    app.include_router(owner_packs.router, prefix="/v1/owner-packs", tags=["Owner Session Packs"])
    from app.api.routes import method_progress  # METHOD-PROGRESS: admin list of the exercise set (plan days, topics, status)
    app.include_router(method_progress.router, prefix="/v1/admin", tags=["Method progress"])
    from app.api.routes import account_delete  # ACCOUNT-DELETE: typed confirmation + email code
    app.include_router(account_delete.router, prefix="/v1/account", tags=["Account deletion"])
    from app.api.routes import admin_status  # ADMIN-STATUS: system / content / API windows on the admin page
    app.include_router(admin_status.router, prefix="/v1/admin", tags=["Admin status"])
    # old in-site language coach removed 2026-11-13 (replaced by study tutor + /coach/)
    from app.api.routes import method_feedback
    app.include_router(method_feedback.router, prefix="/v1/method", tags=["TestDaF Method"])
    from app.api.routes import sim_assess  # SIM-ASSESS: AI estimate for simulation writing/speaking
    app.include_router(sim_assess.router, prefix="/v1/method", tags=["Exam simulation"])
    from app.api.routes import study_tutor
    app.include_router(study_tutor.router, prefix="/v1/tutor", tags=["Study Tutor"])
    from app.api.routes import sync as state_sync
    app.include_router(state_sync.router, prefix="/v1/sync", tags=["Realtime Sync"])
    app.include_router(widget.router, prefix="/v1/widget", tags=["Widget"])
    from app.api.routes import grammar_drill
    app.include_router(grammar_drill.router, prefix="/v1/grammar-drill", tags=["Grammar Drill"])
    from app.api.routes import telegram_link  # TGBOT2
    app.include_router(telegram_link.router, prefix="/v1/telegram", tags=["Telegram"])
    from app.api.routes import ai_admin  # AI-ADMIN: owner AI control box + localhost relay for the Deutsch Coach
    app.include_router(ai_admin.router, prefix="/v1/ai-admin", tags=["AI Admin"])
    app.include_router(ai_admin.relay_router, prefix="/v1/ai", tags=["AI Relay"])
    from app.api.routes import sentence_parts  # SENT-PARTS: sentence-structure colouring
    app.include_router(sentence_parts.router, prefix="/v1/sentence-parts", tags=["Sentence Parts"])

    return app


app = create_app()

