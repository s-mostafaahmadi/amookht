"""Owner-only storage for complete session packs (six exercise categories).

Every time the daily exercises are generated (manual "save & renew" or the
automatic day end) the owner client posts the whole pack here: the plan, the
TestDaF-method day selection (picks / Redemittel / mode), the resolved content
per category and the audio references. The owner can then load such a pack
back into the running program from the day-end card.

The table is created by ensure_runtime_tables() at startup and, as a fallback,
lazily on the first request.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.api.access import require_owner
from app.api.routes.account import current_user
from app.domain.models.models import User
from app.infrastructure.database.connection import Base, get_db

router = APIRouter()

SCHEMA_VERSION = 1
MAX_PAYLOAD_BYTES = 4_000_000
MAX_PACKS = 300

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS owner_session_packs (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL DEFAULT '',
    reason VARCHAR(40) NOT NULL DEFAULT '',
    source_date VARCHAR(20) NOT NULL DEFAULT '',
    schema_version INTEGER NOT NULL DEFAULT 1,
    payload_bytes INTEGER NOT NULL DEFAULT 0,
    payload JSON NOT NULL DEFAULT '{}'::json,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
"""
CREATE_INDEX_SQL = "CREATE INDEX IF NOT EXISTS ix_owner_session_packs_owner ON owner_session_packs (owner_id, created_at DESC)"


class OwnerSessionPack(Base):
    __tablename__ = "owner_session_packs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    reason: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    source_date: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False, default=SCHEMA_VERSION)
    payload_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))


_table_ready = False


async def ensure_table(db: AsyncSession) -> None:
    global _table_ready
    if _table_ready:
        return
    await db.execute(text(CREATE_TABLE_SQL))
    await db.execute(text(CREATE_INDEX_SQL))
    await db.commit()
    _table_ready = True


class SavePackPayload(BaseModel):
    label: str = Field(default="", max_length=200)
    reason: str = Field(default="", max_length=40)
    source_date: str = Field(default="", max_length=20)
    payload: dict[str, Any]


def pack_categories(payload: dict[str, Any]) -> list[str]:
    """The six exercise categories contained in a pack, for the owner list."""
    out: list[str] = []
    day_file = payload.get("day_file") or {}
    for module in day_file.get("modules") or []:
        if isinstance(module, dict) and module.get("id"):
            out.append(str(module["id"]))
    if not out:
        plan = payload.get("plan") or {}
        for activity in plan.get("activities") or []:
            if isinstance(activity, dict) and activity.get("id"):
                out.append(str(activity["id"]))
    if not out:
        package = ((payload.get("resources") or {}).get("package") or {}).get("content") or {}
        out = [str(key) for key in package.keys()]
    return out


def pack_audio(payload: dict[str, Any]) -> list[dict[str, Any]]:
    audio: list[dict[str, Any]] = []
    day_file = payload.get("day_file") or {}
    for module in day_file.get("modules") or []:
        if isinstance(module, dict) and module.get("audio"):
            audio.append({"module": module.get("id"), "title": module.get("title") or "", "src": module.get("audio")})
    for extra in payload.get("audio") or []:
        if isinstance(extra, dict) and extra.get("src") and all(extra.get("src") != item["src"] for item in audio):
            audio.append(extra)
    return audio


def summary(entry: OwnerSessionPack) -> dict[str, Any]:
    payload = entry.payload or {}
    day_file = payload.get("day_file") or {}
    question_count = 0
    for module in day_file.get("modules") or []:
        if isinstance(module, dict):
            question_count += len(module.get("questions") or [])
            question_count += len(module.get("tasks") or [])
    return {
        "id": entry.id,
        "label": entry.label,
        "reason": entry.reason,
        "source_date": entry.source_date,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "kind": payload.get("kind") or "method",
        "categories": pack_categories(payload),
        "question_count": question_count,
        "audio": pack_audio(payload),
        "size_bytes": entry.payload_bytes,
    }


@router.post("", status_code=201)
async def save_pack(
    body: SavePackPayload,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_owner(user)
    await ensure_table(db)
    try:
        encoded = json.dumps(body.payload, ensure_ascii=False).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Pack payload must be valid JSON") from exc
    if len(encoded) > MAX_PAYLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Pack payload is too large")
    if not pack_categories(body.payload):
        raise HTTPException(status_code=422, detail="Pack does not contain exercise categories")

    entry = OwnerSessionPack(
        id=str(uuid.uuid4()),
        owner_id=user.id,
        label=(body.label or "").strip()[:200],
        reason=(body.reason or "")[:40],
        source_date=(body.source_date or "")[:20],
        schema_version=SCHEMA_VERSION,
        payload_bytes=len(encoded),
        payload=body.payload,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    # keep the newest MAX_PACKS entries only
    rows = (await db.execute(
        select(OwnerSessionPack)
        .where(OwnerSessionPack.owner_id == user.id)
        .order_by(OwnerSessionPack.created_at.desc())
    )).scalars().all()
    for stale in rows[MAX_PACKS:]:
        await db.delete(stale)
    if len(rows) > MAX_PACKS:
        await db.commit()

    return summary(entry)


@router.get("")
async def list_packs(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_owner(user)
    await ensure_table(db)
    rows = (await db.execute(
        select(OwnerSessionPack)
        .where(OwnerSessionPack.owner_id == user.id)
        .order_by(OwnerSessionPack.created_at.desc())
        .limit(MAX_PACKS)
    )).scalars().all()
    return {"packs": [summary(row) for row in rows], "total": len(rows)}


@router.get("/{pack_id}")
async def get_pack(
    pack_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_owner(user)
    await ensure_table(db)
    entry = await db.get(OwnerSessionPack, pack_id)
    if entry is None or entry.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Session pack not found")
    data = summary(entry)
    data["payload"] = entry.payload or {}
    return data


@router.delete("/{pack_id}")
async def delete_pack(
    pack_id: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    require_owner(user)
    await ensure_table(db)
    entry = await db.get(OwnerSessionPack, pack_id)
    if entry is None or entry.owner_id != user.id:
        return {"deleted": False, "id": pack_id, "already_absent": True}
    await db.delete(entry)
    await db.commit()
    return {"deleted": True, "id": pack_id}
