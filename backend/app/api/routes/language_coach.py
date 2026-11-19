from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_premium, user_access_role
from app.api.middleware.auth import get_current_user
from app.api.routes.owner_ai_chat import _all_providers, _generate, _provider_public
from app.domain.models.models import AIChatConversation, AIChatMessage, User
from app.infrastructure.database.connection import get_db

router = APIRouter()
COACH_KIND = "language_coach"
COACH_CONTEXT_MESSAGES = 10
COACH_CONTEXT_CHARS = 12_000

COACH_PROMPT = """You are a native German conversation teacher. Be warm, natural, professional, and very brief.
For EVERY user message perform TWO independent checks: (1) grammatical correctness and (2) whether a native speaker
would commonly and naturally phrase it that way. A sentence may be grammatical but unnatural. Give a separate compact
correction for each failed check, then continue with one short natural German reply or question. Never lecture. Ignore
harmless punctuation unless it changes meaning. If the user writes no German, provide the natural German equivalent.
Return JSON only, no markdown:
{{"grammar_ok":false,"grammar_correction":"...","grammar_explanation":"...","natural_ok":false,"natural_version":"...","natural_explanation":"...","reply":"..."}}
For a passed check, use true, an empty correction/version, and a very short positive explanation. Never mark natural_ok
true merely because grammar is correct. Prefer the most common everyday native phrasing, unless the context is formal.
Explanations must match UI_LANGUAGE. Keep each explanation under 18 words and reply under 35 words.
UI_LANGUAGE={ui_language}"""


class ConversationCreate(BaseModel):
    title: str = Field(default="Deutsch sprechen", max_length=160)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return value.strip() or "Deutsch sprechen"


class ProviderPreference(BaseModel):
    provider_id: str | None = Field(default=None, max_length=80)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    client_message_id: str | None = Field(default=None, pattern=r"^[0-9a-fA-F-]{36}$")
    ui_language: str = Field(default="fa", pattern=r"^(fa|de|en)$")

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


def _conversation_dict(item: AIChatConversation, count: int = 0) -> dict:
    return {"id": item.id, "title": item.title, "provider": item.provider, "model": item.model, "provider_preference": item.provider_preference, "message_count": count, "created_at": item.created_at.isoformat() if item.created_at else None, "updated_at": item.updated_at.isoformat() if item.updated_at else None}


def _parse_coach_response(raw: str) -> dict:
    candidate = raw.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*|\s*```$", "", candidate, flags=re.I | re.S).strip()
    try:
        data = json.loads(candidate)
    except (json.JSONDecodeError, TypeError):
        return {"grammar_ok": True, "grammar_correction": "", "grammar_explanation": "", "natural_ok": True, "natural_version": "", "natural_explanation": "", "reply": candidate[:500]}
    if not isinstance(data, dict):
        return {"grammar_ok": True, "grammar_correction": "", "grammar_explanation": "", "natural_ok": True, "natural_version": "", "natural_explanation": "", "reply": candidate[:500]}
    legacy_error = bool(data.get("has_error"))
    return {
        "grammar_ok": bool(data.get("grammar_ok", not legacy_error)),
        "grammar_correction": str(data.get("grammar_correction") or data.get("corrected") or "").strip()[:500],
        "grammar_explanation": str(data.get("grammar_explanation") or data.get("explanation") or "").strip()[:500],
        "natural_ok": bool(data.get("natural_ok", not legacy_error)),
        "natural_version": str(data.get("natural_version") or "").strip()[:500],
        "natural_explanation": str(data.get("natural_explanation") or "").strip()[:500],
        "reply": str(data.get("reply") or "").strip()[:1000],
    }


def _message_dict(item: AIChatMessage) -> dict:
    result = {"id": item.id, "role": item.role, "content": item.content, "provider": item.provider, "model": item.model, "created_at": item.created_at.isoformat() if item.created_at else None}
    if item.role == "assistant":
        result["coach"] = _parse_coach_response(item.content)
    return result


def _coach_context(history: list[AIChatMessage], ui_language: str) -> list[dict[str, str]]:
    selected: list[dict[str, str]] = []
    used = 0
    for item in reversed(history):
        content = str(item.content or "").strip()
        if not content or len(selected) >= COACH_CONTEXT_MESSAGES or used >= COACH_CONTEXT_CHARS:
            continue
        remaining = COACH_CONTEXT_CHARS - used
        selected.append({"role": item.role, "content": content[-remaining:]})
        used += min(len(content), remaining)
    selected.reverse()
    return [{"role": "system", "content": COACH_PROMPT.format(ui_language=ui_language)}, *selected]


async def _owned_conversation(conversation_id: str, user: User, db: AsyncSession) -> AIChatConversation:
    item = (await db.execute(select(AIChatConversation).where(AIChatConversation.id == conversation_id, AIChatConversation.user_id == user.id, AIChatConversation.kind == COACH_KIND))).scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return item


@router.get("/providers")
async def list_coach_providers(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    providers = await _all_providers(user, db)
    return {"providers": [_provider_public(item) for item in providers]}


@router.get("/conversations")
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    role = user_access_role(user)
    limit = 2 if role in {"admin", "owner"} else 1
    rows = list((await db.execute(select(AIChatConversation).where(AIChatConversation.user_id == user.id, AIChatConversation.kind == COACH_KIND).order_by(AIChatConversation.updated_at.desc()).limit(limit))).scalars())
    if not rows:
        return {"can_browse_history": role in {"admin", "owner"}, "conversations": []}
    ids = [row.id for row in rows]
    counts = {key: int(value) for key, value in (await db.execute(select(AIChatMessage.conversation_id, func.count(AIChatMessage.id)).where(AIChatMessage.conversation_id.in_(ids)).group_by(AIChatMessage.conversation_id))).all()}
    return {"can_browse_history": role in {"admin", "owner"}, "conversations": [_conversation_dict(row, counts.get(row.id, 0)) for row in rows]}


@router.post("/conversations", status_code=201)
async def create_conversation(payload: ConversationCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    if user_access_role(user) == "premium":
        previous = list((await db.execute(select(AIChatConversation).where(AIChatConversation.user_id == user.id, AIChatConversation.kind == COACH_KIND))).scalars())
        for item in previous:
            await db.delete(item)
    item = AIChatConversation(id=str(uuid.uuid4()), user_id=user.id, title=payload.title, kind=COACH_KIND)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _conversation_dict(item)


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, limit: int = Query(default=30, ge=10, le=60), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    item = await _owned_conversation(conversation_id, user, db)
    total = int((await db.execute(select(func.count(AIChatMessage.id)).where(AIChatMessage.conversation_id == item.id))).scalar_one())
    rows = list(reversed(list((await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == item.id).order_by(AIChatMessage.created_at.desc(), AIChatMessage.id.desc()).limit(limit))).scalars())))
    return {**_conversation_dict(item, total), "messages": [_message_dict(row) for row in rows], "messages_truncated": total > len(rows)}


@router.patch("/conversations/{conversation_id}/provider")
async def change_conversation_provider(conversation_id: str, payload: ProviderPreference, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    item = await _owned_conversation(conversation_id, user, db)
    providers = await _all_providers(user, db)
    if payload.provider_id and not any(provider["id"] == payload.provider_id for provider in providers):
        raise HTTPException(status_code=400, detail="Selected AI provider is unavailable")
    item.provider_preference = payload.provider_id
    item.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(item)
    return _conversation_dict(item)


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(conversation_id: str, payload: MessageCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    conversation = await _owned_conversation(conversation_id, user, db)
    if payload.client_message_id:
        duplicate = (await db.execute(select(AIChatMessage).where(AIChatMessage.id == payload.client_message_id, AIChatMessage.conversation_id == conversation.id, AIChatMessage.role == "user"))).scalar_one_or_none()
        if duplicate:
            answer = (await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == conversation.id, AIChatMessage.role == "assistant", AIChatMessage.created_at >= duplicate.created_at).order_by(AIChatMessage.created_at, AIChatMessage.id).limit(1))).scalar_one_or_none()
            if answer:
                return {"user_message": _message_dict(duplicate), "assistant_message": _message_dict(answer), "deduplicated": True}
    history = list(reversed(list((await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == conversation.id).order_by(AIChatMessage.created_at.desc(), AIChatMessage.id.desc()).limit(COACH_CONTEXT_MESSAGES * 2))).scalars())))
    messages = _coach_context(history, payload.ui_language)
    messages.append({"role": "user", "content": payload.content})
    providers = await _all_providers(user, db)
    raw, provider, model = await _generate(messages, providers, conversation.provider_preference, temperature=0.65, max_tokens=320)
    coach = _parse_coach_response(raw)
    if not coach["reply"]:
        raise HTTPException(status_code=502, detail="The language coach returned an empty reply")
    now = datetime.now(timezone.utc)
    user_message = AIChatMessage(id=payload.client_message_id or str(uuid.uuid4()), conversation_id=conversation.id, role="user", content=payload.content, created_at=now)
    assistant_message = AIChatMessage(id=str(uuid.uuid4()), conversation_id=conversation.id, role="assistant", content=json.dumps(coach, ensure_ascii=False, separators=(",", ":")), provider=provider, model=model)
    db.add_all((user_message, assistant_message))
    conversation.provider, conversation.model, conversation.updated_at = provider, model, now
    if not history:
        conversation.title = payload.content[:70]
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return {"user_message": _message_dict(user_message), "assistant_message": _message_dict(assistant_message)}


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    require_premium(user)
    await db.delete(await _owned_conversation(conversation_id, user, db))
    await db.commit()
