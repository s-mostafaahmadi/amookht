"""Study tutor: a German teacher that answers the learner's questions while studying (context-aware, Groq-backed)."""
from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import asyncio
from app.api import ai_guard, ai_nvidia  # aifallback-v1
from app.api import ai_registry  # AI-ADMIN
from app.api.access import require_premium
from app.api.middleware.auth import get_current_user
from app.api.routes.owner_ai_chat import _providers
from app.domain.models.models import AIChatConversation, AIChatMessage, User
from app.infrastructure.database.connection import get_db

router = APIRouter()
log = logging.getLogger(__name__)
KIND = "study_tutor"
HISTORY_MESSAGES = 12
HISTORY_CHARS = 14_000
MAX_CONVERSATIONS = 30
# (model, extra request fields); the first model that answers wins.
MODELS = (("openai/gpt-oss-120b", {"reasoning_effort": "high"}), ("qwen/qwen3.8-27b", {"reasoning_format": "hidden"}), ("openai/gpt-oss-20b", {"reasoning_effort": "medium"}))
LANG_NAMES = {"fa": "Persisch (Farsi, persische Schrift)", "de": "Deutsch", "en": "Englisch"}
_cursor = 0
_calls: dict[str, list[float]] = defaultdict(list)

SYSTEM_PROMPT = """Du bist „Amookht Tutor“, ein erfahrener Deutschlehrer und TestDaF-Trainer. Dein Gegenüber spricht Persisch als Muttersprache, steht zwischen B2 und C1 und will im Digitalen TestDaF in allen vier Teilen mindestens TDN 4 erreichen. Er/sie lernt gerade mit der Amookht-App und stellt dir Fragen mitten im Lernen.

Antwortsprache: {lang}. Deutsche Wörter, Beispielsätze und Zitate bleiben auf Deutsch; bei Persisch gib zu deutschen Beispielen eine kurze persische Übersetzung.
Stil: freundlich, präzise, ohne Floskeln. Beginne mit der direkten Antwort (1–2 Sätze). Danach nur wenn nötig: Regel oder Erklärung, 2–3 Beispiele, ein typischer Fehler persischsprachiger Lernender. Normalerweise höchstens 180 Wörter, außer es wird mehr verlangt.
Format: Markdown mit **fett**, Listen mit "- " oder "1. ", höchstens Überschriften "###". Keine Tabellen, kein HTML.
Wörter: Artikel, Plural, Bedeutung, 2–3 typische Kollokationen, Beispielsatz; bei Verben Perfekt und Rektion (z. B. „sich beschäftigen mit + Dat.“).
Grammatik: Regel, kurze Formel, Beispiele, häufiger Fehler.
Textkorrektur: zuerst die korrigierte Fassung, dann die wichtigsten Fehler mit kurzer Begründung.
Prüfungsstrategie: konkrete Tipps zum Format des Digitalen TestDaF.
Lernkontext: Systemnachrichten mit „LERNKONTEXT“ beschreiben, was gerade auf dem Bildschirm ist (Modul, Schritt, Text, markierte Stelle). Beziehe dich konkret darauf, wenn die Frage dazu passt, und erfinde nichts, was dort nicht steht.
Prüfungsmodus: Wenn der Lernkontext „PRÜFUNGSMODUS: ja“ enthält, verrate keine Lösung der laufenden Aufgabe: keine richtige Option, kein richtig/falsch, kein Mustertext und auch keine Hinweise, die auf eine bestimmte Option oder Antwort zeigen (z. B. nicht „achte auf das Wort X im Text“, wenn X die Lösung verrät). Erlaubt sind nur allgemeine Lösungsstrategien für diesen Aufgabentyp sowie die Bedeutung einzelner Wörter oder eine Grammatikerklärung, nach der ausdrücklich gefragt wird. Schließe mit: Die Lösung besprechen wir nach dem Abgeben.
Übung vor der Auswertung: Wenn der Schritt „Aufgaben noch nicht ausgewertet“ enthält und nach der Lösung gefragt wird, gib zuerst nur einen Denkanstoß und biete die Lösung erst an, wenn der Lernende ausdrücklich darauf besteht.
Fachliche Genauigkeit geht vor: Prüfe jede Regel, bevor du sie nennst. Häufige Fallen: Nebensatz mit weil/dass/obwohl → konjugiertes Verb am Ende; denn/aber/und/oder → Verb an Position 2; deshalb/trotzdem/außerdem am Satzanfang → Verb direkt danach; Passiv = werden + Partizip II; wegen/trotz/während → Genitiv (persisch: حالت اضافی/ملکی, nicht مفعولی). Wenn du etwas nicht sicher weißt, sag es offen.

Strukturen (AMK-STRUCT): Schreibe jede grammatische Struktur als kurze Formel mit „+“ (z. B. werden + Partizip II, sich lassen + Infinitiv, sein + zu + Infinitiv, wegen + Genitiv) – jede Struktur in einer eigenen Zeile bzw. einem eigenen Stichpunkt, nie mehrere Strukturen in einem Fließtext-Satz. Die App hebt solche Formeln automatisch rot hervor."""


class ConversationCreate(BaseModel):
    title: str = Field(default="Lernfragen", max_length=160)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return value.strip()[:160] or "Lernfragen"


class StudyContext(BaseModel):
    screen: str = Field(default="", max_length=60)
    module: str = Field(default="", max_length=80)
    step: str = Field(default="", max_length=120)
    title: str = Field(default="", max_length=300)
    material: str = Field(default="", max_length=4000)
    user_text: str = Field(default="", max_length=3000)
    selection: str = Field(default="", max_length=1500)
    exam: bool = False


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    client_message_id: str | None = Field(default=None, pattern=r"^[0-9a-fA-F-]{36}$")
    ui_language: str = Field(default="fa", pattern=r"^(fa|de|en)$")
    context: StudyContext | None = None

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _conversation_dict(item: AIChatConversation, count: int = 0) -> dict:
    return {"id": item.id, "title": item.title, "message_count": count, "created_at": _iso(item.created_at), "updated_at": _iso(item.updated_at)}


def _message_dict(item: AIChatMessage) -> dict:
    return {"id": item.id, "role": item.role, "content": item.content, "model": item.model, "created_at": _iso(item.created_at)}


def _rate_limit(user: User) -> None:
    now = time.time()
    calls = [t for t in _calls[user.id] if now - t < 86400]
    if sum(1 for t in calls if now - t < 60) >= 12:
        raise HTTPException(status_code=429, detail="Too many questions in a minute. Please wait a moment.")
    if len(calls) >= 400:
        raise HTTPException(status_code=429, detail="Daily tutor limit reached")
    calls.append(now)
    _calls[user.id] = calls


def _context_message(ctx: StudyContext | None) -> str | None:
    if ctx is None:
        return None
    lines = []
    for label, value in (("Bildschirm", ctx.screen), ("Modul", ctx.module), ("Schritt", ctx.step), ("Aufgabe/Thema", ctx.title)):
        if value.strip():
            lines.append(f"{label}: {value.strip()}")
    # During an exam step the model never sees the task material, so it cannot steer the learner to a solution.
    if ctx.material.strip() and not ctx.exam:
        lines.append("Material auf dem Bildschirm:\n<<<\n" + ctx.material.strip() + "\n>>>")
    if ctx.user_text.strip() and not ctx.exam:
        lines.append("Eigener Text des Lernenden:\n<<<\n" + ctx.user_text.strip() + "\n>>>")
    if ctx.selection.strip():
        lines.append("Markierte Stelle: „" + ctx.selection.strip()[: 300 if ctx.exam else 1500] + "“")
    lines.append("PRÜFUNGSMODUS: " + ("ja" if ctx.exam else "nein"))
    return "LERNKONTEXT (automatisch von der App, nicht vom Nutzer geschrieben):\n" + "\n".join(lines)


def _history(rows: list[AIChatMessage]) -> list[dict[str, str]]:
    picked, used = [], 0
    for item in reversed(rows):
        content = str(item.content or "").strip()
        if not content or len(picked) >= HISTORY_MESSAGES or used >= HISTORY_CHARS:
            continue
        content = content[-(HISTORY_CHARS - used):]
        picked.append({"role": item.role, "content": content})
        used += len(content)
    return list(reversed(picked))


RESERVED_KEYS = 2  # the last Groq keys are kept free of the content pipeline so the tutor stays responsive


def _language_ok(text: str, ui_language: str) -> bool:
    if ui_language != "fa":
        return True
    return sum(1 for ch in text if "؀" <= ch <= "ۿ") >= 25


async def _complete(messages: list[dict[str, str]], ui_language: str = "fa") -> tuple[str, str]:
    """Answer with Groq: reserved keys first, rotate on rate limits, fall back to the next model, reject wrong-language replies."""
    global _cursor
    _plan = ai_registry.custom_plan("tutor")  # AI-ADMIN: owner-defined route (custom order / local LLM)
    if _plan is not None:
        return await ai_registry.complete("tutor", _plan, messages, max_tokens=5500, budget=75.0, effort="high",
                                          accept=lambda c: True if _language_ok(c, ui_language) else "soft",
                                          busy_message="The tutor is busy right now. Please try again in a minute.")
    groq_down = await ai_guard.retry_after("groq-tutor")
    nv_ok = ai_nvidia.available() and not await ai_guard.retry_after("nvidia-tutor")
    if groq_down and not nv_ok:
        raise ai_guard.unavailable(groq_down, "The tutor is busy right now. Please try again in a minute.")
    try:
        groq = next((p for p in _providers() if p["id"] == "builtin:groq"), None)
    except Exception:  # e.g. the key file is not readable by the service user
        log.exception("Study tutor: AI provider keys could not be loaded")
        raise HTTPException(status_code=503, detail="AI provider keys are not readable")
    keys = [] if groq_down else list((groq or {}).get("keys") or [])
    if not keys and not nv_ok:
        raise HTTPException(status_code=503, detail="No AI provider is configured")
    reserved, shared = keys[-RESERVED_KEYS:], keys[:-RESERVED_KEYS]
    failures: list[str] = []
    statuses: list = []
    fallback_answer: tuple[str, str] | None = None
    deadline = ai_guard.Deadline(75.0)
    groq_deadline = ai_guard.Deadline(40.0) if nv_ok else deadline   # leave time for the NVIDIA fallback
    async with httpx.AsyncClient(timeout=httpx.Timeout(40.0, connect=5.0)) as client:
        for model, extra in (MODELS if keys else ()):
            _cursor += 1
            rotated = shared[_cursor % len(shared):] + shared[:_cursor % len(shared)] if shared else []
            for key in (reserved + rotated)[:6]:
                limit = groq_deadline.attempt(40.0)
                if limit is None:
                    break
                body = {"model": model, "messages": messages, "temperature": 0.2, "max_completion_tokens": 5500, **extra}
                try:
                    response = await asyncio.wait_for(client.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {key}"}, json=body, timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                    if response.status_code in (429, 413, 500, 502, 503):
                        failures.append(f"{model}:{response.status_code}")
                        statuses.append(response.status_code)
                        continue
                    response.raise_for_status()
                    choice = response.json()["choices"][0]
                    content = str(choice["message"].get("content") or "").strip()
                    if content and _language_ok(content, ui_language):
                        await ai_guard.record_success("groq-tutor")
                        return content, model
                    if content:
                        fallback_answer = fallback_answer or (content, model)
                        failures.append(f"{model}:language")
                        break  # same model, same habit: try the next model
                    failures.append(f"{model}:empty")
                except (httpx.HTTPError, asyncio.TimeoutError, KeyError, IndexError, ValueError) as exc:
                    failures.append(f"{model}:{type(exc).__name__}")
                    statuses.append(exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else "connect" if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout)) else type(exc).__name__)
    if fallback_answer:
        return fallback_answer  # correct content in another language beats no answer
    if keys:
        await ai_guard.record_failure("groq-tutor", statuses)
    if nv_ok:  # second provider: NVIDIA
        got = await ai_nvidia.chat(messages, max_tokens=5500, deadline=deadline, scope="tutor", accept=lambda c: _language_ok(c, ui_language))
        if got:
            return got
        failures.append("nvidia")
    waits = [w for w in (await ai_guard.retry_after("groq-tutor"), await ai_guard.retry_after("nvidia-tutor") if ai_nvidia.available() else 0) if w]
    raise ai_guard.unavailable(min(waits) if waits else 60, "The tutor is busy right now. Please try again in a minute. (" + ", ".join(failures[-3:]) + ")")


async def _owned(conversation_id: str, user: User, db: AsyncSession) -> AIChatConversation:
    item = (await db.execute(select(AIChatConversation).where(AIChatConversation.id == conversation_id, AIChatConversation.user_id == user.id, AIChatConversation.kind == KIND))).scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return item


@router.get("/conversations")
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    rows = list((await db.execute(select(AIChatConversation).where(AIChatConversation.user_id == user.id, AIChatConversation.kind == KIND).order_by(AIChatConversation.updated_at.desc()).limit(20))).scalars())
    ids = [row.id for row in rows]
    counts = {}
    if ids:
        counts = {key: int(value) for key, value in (await db.execute(select(AIChatMessage.conversation_id, func.count(AIChatMessage.id)).where(AIChatMessage.conversation_id.in_(ids)).group_by(AIChatMessage.conversation_id))).all()}
    return {"conversations": [_conversation_dict(row, counts.get(row.id, 0)) for row in rows]}


@router.post("/conversations", status_code=201)
async def create_conversation(payload: ConversationCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    existing = list((await db.execute(select(AIChatConversation).where(AIChatConversation.user_id == user.id, AIChatConversation.kind == KIND).order_by(AIChatConversation.updated_at.desc()))).scalars())
    for old in existing[MAX_CONVERSATIONS - 1:]:
        await db.delete(old)
    item = AIChatConversation(id=str(uuid.uuid4()), user_id=user.id, title=payload.title, kind=KIND)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return _conversation_dict(item)


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, limit: int = Query(default=40, ge=10, le=80), user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    item = await _owned(conversation_id, user, db)
    total = int((await db.execute(select(func.count(AIChatMessage.id)).where(AIChatMessage.conversation_id == item.id))).scalar_one())
    rows = list(reversed(list((await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == item.id).order_by(AIChatMessage.created_at.desc(), AIChatMessage.id.desc()).limit(limit))).scalars())))
    return {**_conversation_dict(item, total), "messages": [_message_dict(row) for row in rows], "messages_truncated": total > len(rows)}


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    require_premium(user)
    item = await _owned(conversation_id, user, db)
    await db.delete(item)
    await db.commit()


@router.post("/conversations/{conversation_id}/messages", status_code=201)
async def send_message(conversation_id: str, payload: MessageCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    conversation = await _owned(conversation_id, user, db)
    if payload.client_message_id:
        duplicate = (await db.execute(select(AIChatMessage).where(AIChatMessage.id == payload.client_message_id, AIChatMessage.conversation_id == conversation.id, AIChatMessage.role == "user"))).scalar_one_or_none()
        if duplicate:
            answer = (await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == conversation.id, AIChatMessage.role == "assistant", AIChatMessage.created_at >= duplicate.created_at).order_by(AIChatMessage.created_at, AIChatMessage.id).limit(1))).scalar_one_or_none()
            if answer:
                return {"user_message": _message_dict(duplicate), "assistant_message": _message_dict(answer), "deduplicated": True}
    _rate_limit(user)
    rows = list((await db.execute(select(AIChatMessage).where(AIChatMessage.conversation_id == conversation.id).order_by(AIChatMessage.created_at.desc(), AIChatMessage.id.desc()).limit(HISTORY_MESSAGES * 2))).scalars())
    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(lang=LANG_NAMES.get(payload.ui_language, LANG_NAMES["fa"]))}, *_history(list(reversed(rows)))]
    context = _context_message(payload.context)
    if context:
        messages.append({"role": "system", "content": context})
    lang = LANG_NAMES.get(payload.ui_language, LANG_NAMES["fa"])
    # The reminder rides on the question itself (only for the model call, not stored): fallback models follow it more reliably.
    question = payload.content
    marked = (payload.context.selection.strip() if payload.context else "")  # TUTOR-SEL-FOCUS
    if marked:
        marked = marked[: 300 if payload.context.exam else 1500]
        question = (f"Markierte Stelle: „{marked}“\n"
                    "(Meine Frage bezieht sich genau auf diese markierte Stelle. Wörter wie „این“, „اینو“, „das“, „dies“ oder „hier“ meinen sie – "
                    "nicht frühere Nachrichten und nicht das übrige Material.)\n\n"
                    f"Frage: {payload.content}")
    messages.append({"role": "user", "content": f"{question}\n\n[Antworte auf {lang}; deutsche Beispiele bleiben Deutsch.]"})
    answer, model = await _complete(messages, payload.ui_language)
    now = datetime.now(timezone.utc)
    user_message = AIChatMessage(id=payload.client_message_id or str(uuid.uuid4()), conversation_id=conversation.id, role="user", content=payload.content, created_at=now)
    assistant_message = AIChatMessage(id=str(uuid.uuid4()), conversation_id=conversation.id, role="assistant", content=answer[:12000], provider="Groq", model=model, created_at=datetime.now(timezone.utc))
    db.add_all((user_message, assistant_message))
    if not rows:
        conversation.title = payload.content[:70]
    conversation.provider, conversation.model, conversation.updated_at = "Groq", model, datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return {"user_message": _message_dict(user_message), "assistant_message": _message_dict(assistant_message)}
