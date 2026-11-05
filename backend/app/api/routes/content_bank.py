from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_admin
from app.api.routes.account import current_user
from app.config import get_settings
from app.domain.models.models import User
from app.infrastructure.database.connection import get_db

router = APIRouter()


class ContentBankPayload(BaseModel):
    topics: dict[str, Any] = Field(default_factory=dict)


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
        topics.setdefault(entry.topic_key, {})[entry.skill_key] = entry.content
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