"""ACCOUNT-DELETE (2026-11-19, owner): deleting an account needs the email/username typed, the phrase
"delete my account" and a 5-digit code sent to the account email (like Telegram)."""
from __future__ import annotations

import hmac
import json
import re
import secrets
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.account import current_user
from app.api.routes.auth import email_service_ready, send_verification_email, verification_code_hash
from app.config import get_settings
from app.domain.models.models import User
from app.infrastructure.cache.redis import get_redis
from app.infrastructure.database.connection import get_db

router = APIRouter()
PHRASE = "delete my account"


def _mask(email: str) -> str:
    name, _, dom = email.partition("@")
    return (name[:2] + "•••" + name[-1:] if len(name) > 3 else name[:1] + "•••") + "@" + dom


def _err(code: str, msg: str, status: int = 422) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": msg})


class DeleteRequest(BaseModel):
    username: str = Field(min_length=1, max_length=320)
    phrase: str = Field(min_length=1, max_length=64)


class DeleteConfirm(BaseModel):
    verification_id: str = Field(min_length=10, max_length=100)
    code: str = Field(min_length=5, max_length=5)


def _check_identity(user: User, username: str, phrase: str) -> None:
    u = username.strip().lower()
    if u not in {str(user.email or "").lower(), str(user.display_name or "").strip().lower()} or not u:
        raise _err("username_mismatch", "نام کاربری یا ایمیل با حساب شما یکی نیست.")
    if re.sub(r"\s+", " ", phrase.strip().lower()) != PHRASE:
        raise _err("phrase_mismatch", "عبارت را دقیقاً بنویسید: delete my account")


@router.post("/delete/request")
async def request_delete(payload: DeleteRequest, user: User = Depends(current_user)):
    _check_identity(user, payload.username, payload.phrase)
    if not email_service_ready():
        raise _err("email_service_unavailable", "ارسال ایمیل فعلاً ممکن نیست.", 503)
    redis = get_redis()
    rate = f"account-delete-rate:{user.id}"
    if await redis.get(rate):
        raise _err("too_soon", "یک دقیقه صبر کنید و دوباره درخواست کد بدهید.", 429)
    vid = secrets.token_urlsafe(32)
    ttl = get_settings().EMAIL_VERIFICATION_TTL_SECONDS
    code = f"{secrets.randbelow(90000) + 10000:05d}"
    key = f"account-delete:{vid}"
    await redis.set(key, json.dumps({"user_id": str(user.id), "code_hash": verification_code_hash(vid, code), "attempts": 0}), ex=ttl)
    try:
        await send_verification_email(user.email, user.display_name or "", code, purpose="delete")
    except Exception:
        await redis.delete(key)
        raise
    await redis.set(rate, "1", ex=60)
    return {"verification_id": vid, "email": _mask(user.email), "expires_in": ttl}


@router.post("/delete/confirm")
async def confirm_delete(payload: DeleteConfirm, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if not re.fullmatch(r"\d{5}", payload.code):
        raise _err("invalid_code", "کد پنج‌رقمی را وارد کنید.")
    redis = get_redis()
    key = f"account-delete:{payload.verification_id}"
    raw = await redis.get(key)
    if not raw:
        raise _err("expired", "کد منقضی شده است؛ دوباره درخواست بدهید.", 410)
    pending = json.loads(raw)
    if pending.get("user_id") != str(user.id):
        raise _err("expired", "این درخواست برای حساب شما نیست.", 410)
    if not hmac.compare_digest(pending.get("code_hash", ""), verification_code_hash(payload.verification_id, payload.code)):
        pending["attempts"] = int(pending.get("attempts", 0)) + 1
        if pending["attempts"] >= 5:
            await redis.delete(key)
            raise _err("locked", "کد بارها اشتباه وارد شد؛ دوباره درخواست کد بدهید.", 429)
        await redis.set(key, json.dumps(pending), ex=max(1, await redis.ttl(key)))
        raise _err("invalid_code", f"کد اشتباه است ({5 - pending['attempts']} تلاش باقی است).")
    await redis.delete(key)
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    user.email = f"deleted-{user.id}@amookht.invalid"
    user.preferences = {**(user.preferences or {}), "auth_revoked_ns": time.time_ns()}
    await db.commit()
    return {"deleted": True}
