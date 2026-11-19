"""Backend side of the Amookht Telegram bot: owner notifications only.

Since 2026-11-13 the interactive bot (polling, menus, reminders, summaries, broadcasts) runs as its own service,
`amookht-telegram.service` (app/telegram_service.py). The backend workers never poll; they only push owner
notifications (sign-ups, operational alerts) through a small queue so requests never wait on Telegram.
"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from collections import defaultdict, deque
from contextlib import suppress
from dataclasses import dataclass
from typing import Any

from app.config import get_settings
from app.infrastructure.cache.redis import get_redis
from app.infrastructure.telegram import fmt
from app.infrastructure.telegram.tgapi import TgApi, TelegramError

logger = logging.getLogger(__name__)

ALERTS_OFF_KEY = "tg:alerts_off"
SIGNUP_MSG_KEY = "tg:signupmsg:{}"
BOT_USERNAME_KEY = "tg:bot_username"
PLAN_PENDING = "⏳ هنوز انتخاب نکرده"


@dataclass(slots=True)
class TelegramEvent:
    title: str
    body: str
    severity: str = "info"


class TelegramBot:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.token = self.settings.TELEGRAM_BOT_TOKEN.strip()
        self.admin_chat_id = self.settings.TELEGRAM_ADMIN_CHAT_ID.strip()
        self.api: TgApi | None = None
        self.queue_task: asyncio.Task | None = None
        self.queue: asyncio.Queue[TelegramEvent] = asyncio.Queue(maxsize=500)
        self.request_windows: dict[str, deque[float]] = defaultdict(deque)
        self.alert_cooldowns: dict[str, float] = {}
        self._alerts_cache: tuple[float, bool] = (0.0, True)

    @property
    def enabled(self) -> bool:
        return bool(self.token and self.admin_chat_id)

    async def start(self) -> None:
        if not self.enabled:
            logger.warning("Telegram notifications disabled: token or admin chat id is missing")
            return
        self.api = TgApi(self.token, timeout=20)
        self.queue_task = asyncio.create_task(self._event_worker(), name="telegram-events")

    async def stop(self) -> None:
        if self.queue_task:
            self.queue_task.cancel()
            with suppress(asyncio.CancelledError):
                await self.queue_task
        if self.api:
            await self.api.close()

    async def alerts_enabled(self) -> bool:
        now = time.monotonic()
        if now - self._alerts_cache[0] < 30:
            return self._alerts_cache[1]
        try:
            enabled = not await get_redis().exists(ALERTS_OFF_KEY)
        except Exception:
            enabled = True
        self._alerts_cache = (now, enabled)
        return enabled

    async def notify(self, title: str, body: str, severity: str = "info") -> None:
        if not self.enabled:
            return
        if severity != "critical" and not await self.alerts_enabled():
            return
        try:
            self.queue.put_nowait(TelegramEvent(title=title, body=body, severity=severity))
        except asyncio.QueueFull:
            logger.error("Telegram event queue is full; dropping %s", title)

    async def notify_once(self, key: str, title: str, body: str, severity: str = "warning", cooldown_seconds: int = 300) -> None:
        now = time.monotonic()
        if now < self.alert_cooldowns.get(key, 0):
            return
        # Share the cooldown across both uvicorn workers so an alert is not sent twice.
        try:
            if not await get_redis().set(f"tg:cooldown:{key}"[:200], "1", ex=max(30, cooldown_seconds), nx=True):
                self.alert_cooldowns[key] = now + cooldown_seconds
                return
        except Exception:
            pass
        self.alert_cooldowns[key] = now + cooldown_seconds
        await self.notify(title, body, severity)

    async def observe_request(self, client_key: str) -> int:
        now = time.monotonic()
        window = self.request_windows[client_key]
        window.append(now)
        cutoff = now - self.settings.TELEGRAM_REQUEST_WINDOW_SECONDS
        while window and window[0] < cutoff:
            window.popleft()
        if len(self.request_windows) > 5000:
            for key in [k for k, w in self.request_windows.items() if not w or w[-1] < cutoff]:
                self.request_windows.pop(key, None)
        return len(window)

    async def _event_worker(self) -> None:
        while True:
            event = await self.queue.get()
            try:
                icon = {"success": "✅", "warning": "⚠️", "critical": "🚨"}.get(event.severity, "ℹ️")
                text = (f"{icon} <b>{fmt.esc(event.title)}</b>\n{fmt.esc(event.body)}\n\n"
                        f"🕒 {fmt.local_stamp()}")
                await self.send_message(self.admin_chat_id, text)
            except Exception:
                logger.exception("Could not deliver Telegram event")
            finally:
                self.queue.task_done()

    async def send_message(self, chat_id: str | int, text: str, *, reply_to_message_id: int | None = None,
                           markup: dict | None = None) -> dict[str, Any] | None:
        if not self.api:
            return None
        extra = {"reply_parameters": {"message_id": reply_to_message_id}} if reply_to_message_id else {}
        return await self.api.send(chat_id, text, markup, **extra)

    async def bot_username(self) -> str:
        redis = get_redis()
        cached = await redis.get(BOT_USERNAME_KEY)
        if cached:
            return cached.decode() if isinstance(cached, bytes) else str(cached)
        api = self.api or TgApi(self.token, timeout=15)
        me = await api.call("getMe", retries=1)
        username = str(me.get("username") or "")
        if username:
            await redis.set(BOT_USERNAME_KEY, username, ex=86400)
        return username

    # ---- sign-ups ---------------------------------------------------------------------------------------------

    @staticmethod
    def _signup_text(lines: list[str], plan: str) -> str:
        return "\n".join(lines + [f"🎯 برنامه آزمون: {plan}"])

    async def signup_notify(self, user, method: str, user_agent: str | None, accept_language: str | None) -> None:
        """Clean owner notification for a new account (no ids, hashes or e-mail). The exam plan is filled in later."""
        if not self.enabled or not self.api:
            return
        name = (getattr(user, "display_name", None) or "").strip() or "بدون نام"
        lines = [
            "🎉 <b>کاربر جدید در آموخت</b>",
            "",
            f"👤 نام: <b>{fmt.esc(name)}</b>",
            f"🕒 زمان: {fmt.local_stamp()}",
            f"📱 دستگاه: {fmt.esc(fmt.device_label(user_agent))}",
            f"🔑 روش ثبت‌نام: {'گوگل' if method == 'google' else 'ایمیل و رمز'}",
            f"🌐 زبان مرورگر: {fmt.esc(fmt.language_label(accept_language))}",
        ]
        try:
            result = await self.api.send(self.admin_chat_id, self._signup_text(lines, PLAN_PENDING))
            await get_redis().set(SIGNUP_MSG_KEY.format(user.id), json.dumps({"mid": result["message_id"], "lines": lines}),
                                  ex=14 * 86400)
        except Exception:
            logger.warning("Sign-up Telegram notification failed", exc_info=True)

    async def plan_chosen(self, user_id: str, previous: dict | None, new_state: dict | None) -> None:
        """Called after every state write: when the exam plan appears for the first time, complete the sign-up card."""
        if not self.enabled or not self.api:
            return
        try:
            old_plan = fmt.plan_label(previous)
            new_plan = fmt.plan_label(new_state)
            if not new_plan or new_plan == old_plan:
                return
            redis = get_redis()
            raw = await redis.get(SIGNUP_MSG_KEY.format(user_id))
            if not raw:
                return
            info = json.loads(raw)
            if info.get("plan") == new_plan:
                return
            await self.api.edit(self.admin_chat_id, int(info["mid"]), self._signup_text(info["lines"], f"<b>{fmt.esc(new_plan)}</b>"))
            info["plan"] = new_plan
            await redis.set(SIGNUP_MSG_KEY.format(user_id), json.dumps(info), keepttl=True)
        except (TelegramError, Exception):
            logger.warning("Could not update the sign-up card with the exam plan", exc_info=True)


telegram_bot = TelegramBot()


async def telegram_notify(title: str, body: str, severity: str = "info") -> None:
    await telegram_bot.notify(title, body, severity)


def schedule(coro) -> None:
    """Fire-and-forget helper so request handlers never wait on Telegram."""
    task = asyncio.create_task(coro)
    _BACKGROUND.add(task)
    task.add_done_callback(_BACKGROUND.discard)


_BACKGROUND: set[asyncio.Task] = set()
