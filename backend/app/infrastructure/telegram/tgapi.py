"""Minimal async Telegram Bot API client shared by the backend (owner notifications) and the bot service."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class TelegramError(Exception):
    def __init__(self, code: int, description: str, retry_after: int | None = None):
        super().__init__(f"{code}: {description}")
        self.code = code
        self.description = description
        self.retry_after = retry_after

    @property
    def blocked(self) -> bool:
        """The chat can no longer receive messages (user blocked the bot, deleted account, …)."""
        d = self.description.lower()
        return self.code == 403 or "chat not found" in d or "user is deactivated" in d

    @property
    def not_modified(self) -> bool:
        return "message is not modified" in self.description.lower()


class TgApi:
    def __init__(self, token: str, timeout: float = 35.0):
        self.token = token.strip()
        self.base = f"https://api.telegram.org/bot{self.token}"
        self._client: httpx.AsyncClient | None = None
        self._timeout = timeout

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(self._timeout, connect=10))
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def call(self, method: str, payload: dict[str, Any] | None = None, *, retries: int = 2,
                   timeout: float | None = None) -> Any:
        for attempt in range(retries + 1):
            try:
                kw = {"timeout": timeout} if timeout else {}
                resp = await self.client.post(f"{self.base}/{method}", json=payload or {}, **kw)
                data = resp.json()
            except (httpx.HTTPError, ValueError) as exc:
                if attempt >= retries:
                    raise TelegramError(0, f"network: {type(exc).__name__}") from exc
                await asyncio.sleep(1.5 * (attempt + 1))
                continue
            if data.get("ok"):
                return data.get("result")
            code = int(data.get("error_code") or resp.status_code)
            retry_after = (data.get("parameters") or {}).get("retry_after")
            if code == 429 and retry_after and attempt < retries:
                await asyncio.sleep(min(int(retry_after), 30) + 0.5)
                continue
            raise TelegramError(code, str(data.get("description") or "error"), retry_after)
        raise TelegramError(0, "unreachable")

    async def send(self, chat_id: int | str, text: str, markup: dict | None = None, **extra) -> dict:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text[:4096],
            "parse_mode": "HTML",
            "link_preview_options": {"is_disabled": True},
        }
        if markup:
            payload["reply_markup"] = markup
        payload.update(extra)
        return await self.call("sendMessage", payload)

    async def edit(self, chat_id: int | str, message_id: int, text: str, markup: dict | None = None) -> Any:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text[:4096],
            "parse_mode": "HTML",
            "link_preview_options": {"is_disabled": True},
        }
        if markup:
            payload["reply_markup"] = markup
        try:
            return await self.call("editMessageText", payload)
        except TelegramError as exc:
            if exc.not_modified:
                return None
            raise

    async def answer_callback(self, callback_id: str, text: str = "", alert: bool = False) -> None:
        try:
            await self.call("answerCallbackQuery", {"callback_query_id": callback_id, "text": text[:200], "show_alert": alert}, retries=0)
        except TelegramError:
            pass


def kb(rows: list[list[tuple[str, str]]]) -> dict:
    """Inline keyboard. A button value starting with http(s):// becomes a URL button, otherwise callback data."""
    out = []
    for row in rows:
        r = []
        for label, value in row:
            if value.startswith(("http://", "https://")):
                r.append({"text": label, "url": value})
            else:
                r.append({"text": label, "callback_data": value[:64]})
        out.append(r)
    return {"inline_keyboard": out}
