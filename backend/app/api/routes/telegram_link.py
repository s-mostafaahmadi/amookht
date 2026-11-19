"""/v1/telegram — link a site account to the Amookht Telegram bot, and the latest site announcement."""
from __future__ import annotations

import secrets

from fastapi import APIRouter, Depends, HTTPException

from app.api.routes.account import current_user
from app.domain.models.models import User
from app.infrastructure.cache.redis import get_redis
from app.infrastructure.telegram import store
from app.infrastructure.telegram.bot import telegram_bot

router = APIRouter()
LINK_CODE_KEY = "tg:linkcode:{}"
LINK_TTL = 600


async def _bot() -> str:
    try:
        return await telegram_bot.bot_username()
    except Exception:
        return ""


@router.get("/status")
async def status(user: User = Depends(current_user)) -> dict:
    link = await store.link_by_user(user.id)
    bot = await _bot()
    if not link:
        return {"linked": False, "bot": bot}
    return {
        "linked": True,
        "active": bool(link["active"]),
        "bot": bot,
        "telegram_name": link.get("tg_name") or "",
        "telegram_username": link.get("tg_username") or "",
        "linked_at": link["linked_at"].isoformat() if link.get("linked_at") else None,
        "prefs": store.prefs_of(link.get("prefs")),
    }


@router.post("/link")
async def create_link(user: User = Depends(current_user)) -> dict:
    redis = get_redis()
    rate_key = f"tg:linkrate:{user.id}"
    count = await redis.incr(rate_key)
    if count == 1:
        await redis.expire(rate_key, 3600)
    if count > 15:
        raise HTTPException(status_code=429, detail="Too many link codes; try again later.")
    bot = await _bot()
    if not bot:
        raise HTTPException(status_code=503, detail="Telegram bot is not available right now.")
    code = "L" + secrets.token_urlsafe(12).replace("-", "x").replace("_", "y")
    await redis.set(LINK_CODE_KEY.format(code), user.id, ex=LINK_TTL)
    return {"code": code, "bot": bot, "url": f"https://t.me/{bot}?start={code}", "expires_in": LINK_TTL}


@router.delete("/link")
async def delete_link(user: User = Depends(current_user)) -> dict:
    link = await store.link_by_user(user.id)
    removed = await store.unlink_user(user.id)
    if link and removed:
        try:
            await telegram_bot.send_message(
                link["chat_id"], "🔓 اتصال این گفتگو به حساب آموخت از طرف سایت قطع شد.\nبرای اتصال دوباره از «تنظیمات حساب» در سایت اقدام کنید.")
        except Exception:
            pass
    return {"linked": False}


@router.get("/announcement")
async def announcement(user: User = Depends(current_user)) -> dict:
    item = await store.latest_site_announcement()
    if not item:
        return {"announcement": None}
    return {"announcement": {"id": item["id"], "text": item["text"], "created_at": item["created_at"].isoformat()}}
