from __future__ import annotations

import asyncio
import json
import uuid
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_admin, require_premium, user_access_role
from app.api.routes.account import current_user
from app.config import get_settings
from app.domain.models.models import User
from app.infrastructure.database.connection import get_db

router = APIRouter()


class ContentBankPayload(BaseModel):
    topics: dict[str, Any] = Field(default_factory=dict)


ALLOWED_CONTENT_SKILLS = {"wortschatz", "grammatik", "lesen", "hoeren", "schreiben", "sprechen"}


class CreatedContentPayload(BaseModel):
    topic_key: str = Field(min_length=1, max_length=160)
    skill_key: str = Field(min_length=1, max_length=40)
    item: dict[str, Any]
    visibility: Literal["private", "global"] | None = None


def validate_created_content(payload: CreatedContentPayload) -> None:
    skill = payload.skill_key.strip().lower()
    if skill not in ALLOWED_CONTENT_SKILLS:
        raise HTTPException(status_code=422, detail="Unsupported TestDaF skill")
    try:
        encoded = json.dumps(payload.item, ensure_ascii=False).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Content must be valid JSON") from exc
    if len(encoded) > 250_000:
        raise HTTPException(status_code=413, detail="Content item is too large")

    item = payload.item
    questions = item.get("questions")
    if not isinstance(questions, list):
        questions = item.get("exercises") if isinstance(item.get("exercises"), list) else []
    if len(questions) > 100:
        raise HTTPException(status_code=422, detail="A content item can contain at most 100 questions")
    if skill == "wortschatz":
        required = ("word", "meaning_native")
        if any(not str(item.get(field, "")).strip() for field in required):
            raise HTTPException(status_code=422, detail="Word and native meaning are required")
    elif skill in {"lesen", "hoeren"}:
        if not str(item.get("title", "")).strip() or not str(item.get("text", "")).strip():
            raise HTTPException(status_code=422, detail="Title and text are required")
        if not questions:
            raise HTTPException(status_code=422, detail="Add at least one related question")
    elif skill == "grammatik":
        if not str(item.get("title", "")).strip() or not questions:
            raise HTTPException(status_code=422, detail="Grammar title and at least one exercise are required")
    elif skill == "schreiben" and not str(item.get("writing_task", "")).strip():
        raise HTTPException(status_code=422, detail="Writing task is required")
    elif skill == "sprechen" and not str(item.get("question", "")).strip():
        raise HTTPException(status_code=422, detail="Speaking question is required")


def bank_path() -> Path:
    settings = get_settings()
    base = Path(settings.FILE_STORAGE_PATH)
    if not base.is_absolute():
        base = Path(__file__).resolve().parents[3] / base
    return base / "global_content_bank.json"


def read_legacy_bank() -> dict[str, Any]:
    path = bank_path()
    if not path.exists():
        return {"topics": {}}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"topics": {}}
    topics = data.get("topics") if isinstance(data, dict) else None
    return {"topics": topics if isinstance(topics, dict) else {}}


def content_counts(skill: str, content: Any) -> tuple[int, int]:
    items = content.get("items", []) if isinstance(content, dict) else []
    if not isinstance(items, list):
        items = []
    questions = 0
    if skill != "wortschatz":
        for item in items:
            if not isinstance(item, dict):
                if skill in {"grammatik", "schreiben", "sprechen"}:
                    questions += 1
                continue
            nested = item.get("questions")
            if not isinstance(nested, list):
                nested = item.get("exercises")
            if isinstance(nested, list):
                questions += len(nested)
            elif skill in {"grammatik", "schreiben", "sprechen"}:
                questions += 1
    return len(items), questions


def entry_rows(topics: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for topic_key, topic in topics.items():
        if not isinstance(topic_key, str) or not isinstance(topic, dict):
            continue
        for skill_key, content in topic.items():
            if not isinstance(skill_key, str) or not isinstance(content, dict):
                continue
            item_count, question_count = content_counts(skill_key, content)
            rows.append({
                "topic_key": topic_key[:160],
                "skill_key": skill_key[:40],
                "content": content,
                "item_count": item_count,
                "question_count": question_count,
            })
    return rows


async def ensure_legacy_import(db: AsyncSession) -> None:
    count = (await db.execute(select(func.count()).select_from(GlobalContentEntry))).scalar_one()
    if count:
        return
    legacy = await asyncio.to_thread(read_legacy_bank)
    rows = entry_rows(legacy["topics"])
    if not rows:
        return
    statement = insert(GlobalContentEntry).values(rows).on_conflict_do_nothing(
        index_elements=["topic_key", "skill_key"]
    )
    await db.execute(statement)
    await db.commit()


@router.get("/stats")
async def get_global_content_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    await ensure_legacy_import(db)
    rows = (await db.execute(
        select(
            GlobalContentEntry.topic_key,
            GlobalContentEntry.skill_key,
            GlobalContentEntry.item_count,
            GlobalContentEntry.question_count,
            GlobalContentEntry.updated_at,
        )
    )).all()
    topics: dict[str, Any] = {}
    total_words = total_texts = total_questions = 0
    updated_at = None
    for topic_key, skill_key, item_count, question_count, row_updated_at in rows:
        words = item_count if skill_key == "wortschatz" else 0
        texts = 0 if skill_key == "wortschatz" else item_count
        topics.setdefault(topic_key, {"skills": {}})["skills"][skill_key] = {
            "words": words,
            "texts": texts,
            "questions": question_count,
        }
        total_words += words
        total_texts += texts
        total_questions += question_count
        if updated_at is None or row_updated_at > updated_at:
            updated_at = row_updated_at
    created_rows = (await db.execute(
        select(
            UserCreatedContentEntry.topic_key,
            UserCreatedContentEntry.skill_key,
            UserCreatedContentEntry.content,
            UserCreatedContentEntry.updated_at,
        ).where(UserCreatedContentEntry.is_global.is_(True))
    )).all()
    for topic_key, skill_key, item, row_updated_at in created_rows:
        item_count, question_count = content_counts(skill_key, {"items": [item]})
        words = item_count if skill_key == "wortschatz" else 0
        texts = 0 if skill_key == "wortschatz" else item_count
        metrics = topics.setdefault(topic_key, {"skills": {}})["skills"].setdefault(
            skill_key, {"words": 0, "texts": 0, "questions": 0}
        )
        metrics["words"] += words
        metrics["texts"] += texts
        metrics["questions"] += question_count
        total_words += words
        total_texts += texts
        total_questions += question_count
        if updated_at is None or row_updated_at > updated_at:
            updated_at = row_updated_at
    return {
        "topics": topics,
        "totals": {"words": total_words, "texts": total_texts, "questions": total_questions},
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


@router.get("")
async def get_global_content_bank(
    topic: str | None = Query(default=None, max_length=160),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_legacy_import(db)
    query = select(GlobalContentEntry)
    if topic:
        query = query.where(GlobalContentEntry.topic_key == topic)
    entries = (await db.execute(query.order_by(GlobalContentEntry.topic_key, GlobalContentEntry.skill_key))).scalars().all()
    topics: dict[str, Any] = {}
    for entry in entries:
        content = json.loads(json.dumps(entry.content))
        items = content.get("items") if isinstance(content, dict) else None
        if isinstance(items, list):
            for item_index, item in enumerate(items):
                if not isinstance(item, dict):
                    continue
                item.update({"_global_topic": entry.topic_key, "_global_skill": entry.skill_key, "_global_item_index": item_index})
                for collection_name in ("questions", "exercises"):
                    questions = item.get(collection_name)
                    if isinstance(questions, list):
                        for question_index, question in enumerate(questions):
                            if isinstance(question, dict):
                                question.update({"_global_topic": entry.topic_key, "_global_skill": entry.skill_key, "_global_item_index": item_index, "_global_question_index": question_index})
        topics.setdefault(entry.topic_key, {})[entry.skill_key] = content
    public_entries = (await db.execute(
        select(UserCreatedContentEntry)
        .where(UserCreatedContentEntry.is_global.is_(True))
        .order_by(UserCreatedContentEntry.created_at)
    )).scalars().all()
    for entry in public_entries:
        skill_content = topics.setdefault(entry.topic_key, {}).setdefault(entry.skill_key, {"items": []})
        items = skill_content.setdefault("items", [])
        if isinstance(items, list):
            items.append(entry.content)
    return {"topics": topics}


@router.put("")
async def put_global_content_bank(
    payload: ContentBankPayload,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_admin(user)
    rows = entry_rows(payload.topics)
    await db.execute(delete(GlobalContentEntry))
    if rows:
        await db.execute(insert(GlobalContentEntry).values(rows))
    await db.commit()
    return {"saved": True, "topics": len(payload.topics), "entries": len(rows)}


@router.delete("/global/{topic_key}/{skill_key}/items/{item_index}")
async def delete_global_content_item(
    topic_key: str,
    skill_key: str,
    item_index: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_admin(user)
    entry = await db.get(GlobalContentEntry, (topic_key, skill_key))
    if entry is None:
        raise HTTPException(status_code=404, detail="Global content section not found")
    content = dict(entry.content or {})
    items = list(content.get("items") or [])
    if item_index < 0 or item_index >= len(items):
        raise HTTPException(status_code=404, detail="Global content item not found")
    items.pop(item_index)
    content["items"] = items
    entry.content = content
    entry.item_count, entry.question_count = content_counts(skill_key, content)
    await db.commit()
    return {"deleted": True, "remaining_items": len(items)}


@router.delete("/global/{topic_key}/{skill_key}/items/{item_index}/questions/{question_index}")
async def delete_global_content_question(
    topic_key: str,
    skill_key: str,
    item_index: int,
    question_index: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_admin(user)
    entry = await db.get(GlobalContentEntry, (topic_key, skill_key))
    if entry is None:
        raise HTTPException(status_code=404, detail="Global content section not found")
    content = dict(entry.content or {})
    items = list(content.get("items") or [])
    if item_index < 0 or item_index >= len(items) or not isinstance(items[item_index], dict):
        raise HTTPException(status_code=404, detail="Global content item not found")
    item = dict(items[item_index])
    collection_name = "questions" if isinstance(item.get("questions"), list) else "exercises" if isinstance(item.get("exercises"), list) else None
    if collection_name is None:
        raise HTTPException(status_code=404, detail="Question collection not found")
    questions = list(item[collection_name])
    if question_index < 0 or question_index >= len(questions):
        raise HTTPException(status_code=404, detail="Global question not found")
    questions.pop(question_index)
    item[collection_name] = questions
    items[item_index] = item
    content["items"] = items
    entry.content = content
    entry.item_count, entry.question_count = content_counts(skill_key, content)
    await db.commit()
    return {"deleted": True, "remaining_questions": len(questions)}


# Lightweight table mapping kept here so the content service can evolve independently
# from the large legacy domain model module.
from sqlalchemy import DateTime, Integer, JSON, String, text
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.connection import Base


class GlobalContentEntry(Base):
    __tablename__ = "global_content_entries"

    topic_key: Mapped[str] = mapped_column(String(160), primary_key=True)
    skill_key: Mapped[str] = mapped_column(String(40), primary_key=True)
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    item_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


from sqlalchemy import Boolean, ForeignKey


class UserCreatedContentEntry(Base):
    __tablename__ = "user_created_content_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_key: Mapped[str] = mapped_column(String(160), nullable=False)
    skill_key: Mapped[str] = mapped_column(String(40), nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_global: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


def created_entry_response(entry: UserCreatedContentEntry) -> dict[str, Any]:
    return {
        "id": entry.id,
        "topic_key": entry.topic_key,
        "skill_key": entry.skill_key,
        "item": entry.content,
        "visibility": "global" if entry.is_global else "private",
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }


@router.get("/mine")
async def get_my_created_content(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_premium(user)
    entries = (await db.execute(
        select(UserCreatedContentEntry)
        .where(
            UserCreatedContentEntry.user_id == user.id,
            UserCreatedContentEntry.is_global.is_(False),
        )
        .order_by(UserCreatedContentEntry.created_at)
    )).scalars().all()
    topics: dict[str, Any] = {}
    for entry in entries:
        topics.setdefault(entry.topic_key, {}).setdefault(entry.skill_key, {"items": []})["items"].append(entry.content)
    return {"topics": topics, "entries": len(entries)}


@router.post("/items", status_code=201)
async def create_content_item(
    payload: CreatedContentPayload,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_premium(user)
    validate_created_content(payload)
    entry_id = str(uuid.uuid4())
    skill = payload.skill_key.strip().lower()
    topic = payload.topic_key.strip()
    item = dict(payload.item)
    item["id"] = item.get("id") or f"created-{entry_id}"
    item["created_by_user"] = True
    item["created_entry_id"] = entry_id
    for collection_name in ("questions", "exercises"):
        collection = item.get(collection_name)
        if isinstance(collection, list):
            item[collection_name] = [
                {**question, "id": question.get("id") or f"created-q-{uuid.uuid4()}"}
                if isinstance(question, dict) else question
                for question in collection
            ]
    role = user_access_role(user)
    is_global = role in {"admin", "owner"}
    if role == "owner" and payload.visibility is not None:
        is_global = payload.visibility == "global"
    entry = UserCreatedContentEntry(
        id=entry_id,
        user_id=user.id,
        topic_key=topic,
        skill_key=skill,
        content=item,
        is_global=is_global,
    )
    db.add(entry)
    await db.commit()
    return created_entry_response(entry)


@router.delete("/items/{entry_id}")
async def delete_created_content_item(
    entry_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if user_access_role(user) not in {"admin", "owner"}:
        raise HTTPException(status_code=403, detail="Only administrators can delete learning content")
    normalized = entry_id.removeprefix("created-")
    entry = await db.get(UserCreatedContentEntry, normalized)
    if entry is None:
        return {"deleted": False, "id": normalized, "already_absent": True}
    await db.delete(entry)
    await db.commit()
    return {"deleted": True, "id": normalized}


@router.post("/items/{entry_id}/publish")
async def publish_private_content_item(
    entry_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if user_access_role(user) != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can publish private content")
    normalized = entry_id.removeprefix("created-")
    entry = await db.get(UserCreatedContentEntry, normalized)
    if entry is None or entry.user_id != user.id:
        raise HTTPException(status_code=404, detail="Private content item not found")
    entry.is_global = True
    await db.commit()
    return created_entry_response(entry)


@router.delete("/items/{entry_id}/questions/{question_id}")
async def delete_created_content_question(
    entry_id: str,
    question_id: str,
    question_index: int | None = Query(default=None, ge=0),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    if user_access_role(user) not in {"admin", "owner"}:
        raise HTTPException(status_code=403, detail="Only administrators can delete learning questions")
    normalized = entry_id.removeprefix("created-")
    entry = await db.get(UserCreatedContentEntry, normalized)
    if entry is None:
        raise HTTPException(status_code=404, detail="Content item not found")
    content = dict(entry.content or {})
    collection_name = "questions" if isinstance(content.get("questions"), list) else "exercises" if isinstance(content.get("exercises"), list) else None
    if collection_name is None:
        raise HTTPException(status_code=404, detail="Question collection not found")
    questions = list(content[collection_name])
    target_index = next((index for index, question in enumerate(questions) if isinstance(question, dict) and str(question.get("id", "")) == question_id), None)
    if target_index is None and question_index is not None and question_index < len(questions):
        target_index = question_index
    if target_index is None:
        raise HTTPException(status_code=404, detail="Question not found")
    questions.pop(target_index)
    content[collection_name] = questions
    entry.content = content
    await db.commit()
    return {"deleted": True, "entry": created_entry_response(entry), "remaining_questions": len(questions)}
