from __future__ import annotations

import hashlib
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.infrastructure.telegram.bot import telegram_bot


class OperationalAlertMiddleware(BaseHTTPMiddleware):
    """Detect operational failures and abnormal request bursts without logging secrets."""

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        started = time.monotonic()
        client_ip = request.client.host if request.client else "unknown"
        client_key = hashlib.sha256(client_ip.encode("utf-8")).hexdigest()[:12]
        request_count = await telegram_bot.observe_request(client_key)

        if request_count == settings.TELEGRAM_REQUEST_ALERT_THRESHOLD:
            await telegram_bot.notify_once(
                f"burst:{client_key}",
                "درخواست‌های غیرعادی",
                (
                    "یک IP در "  # TGBOT2
                    f"{settings.TELEGRAM_REQUEST_WINDOW_SECONDS} ثانیه "
                    f"{request_count} درخواست فرستاد."
                ),
                "warning",
                cooldown_seconds=settings.TELEGRAM_ALERT_COOLDOWN_SECONDS,
            )

        try:
            response = await call_next(request)
        except Exception as exc:
            await telegram_bot.notify_once(
                f"exception:{request.url.path}:{type(exc).__name__}",
                "خطای داخلی سرویس",
                f"مسیر: {request.method} {request.url.path}\nنوع خطا: {type(exc).__name__}",
                "critical",
                cooldown_seconds=60,
            )
            raise

        elapsed_ms = int((time.monotonic() - started) * 1000)
        if response.status_code >= 500:
            await telegram_bot.notify_once(
                f"http5xx:{request.url.path}:{response.status_code}",
                "پاسخ ناموفق سرور",
                f"{request.method} {request.url.path}\nHTTP {response.status_code}\nزمان: {elapsed_ms}ms",
                "critical",
                cooldown_seconds=60,
            )
        elif response.status_code == 429:
            await telegram_bot.notify_once(
                f"http429:{client_key}:{request.url.path}",
                "محدودسازی درخواست",
                f"مسیر: {request.method} {request.url.path}",
                "warning",
                cooldown_seconds=settings.TELEGRAM_ALERT_COOLDOWN_SECONDS,
            )
        elif elapsed_ms >= settings.TELEGRAM_SLOW_REQUEST_MS:
            await telegram_bot.notify_once(
                f"slow:{request.url.path}",
                "درخواست کند",
                f"{request.method} {request.url.path}\nزمان پاسخ: {elapsed_ms}ms",
                "warning",
                cooldown_seconds=settings.TELEGRAM_ALERT_COOLDOWN_SECONDS,
            )
        return response
