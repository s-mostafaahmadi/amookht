"""/v1/widget — compact read/write API for the Amookht widgets (desktop + Android).

Two tabs, two sources:
  * to-do list  -> the widget_todos table (done / not done), available to every account
  * notes       -> library_notes, the same rows the library screen shows (Premium)

The legacy plan-based endpoints (/today, /tasks) stay for already-installed clients.

Added 2026-11-17.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import has_premium_access
from app.api.middleware.auth import get_current_user
from app.api.routes.account import _locked_state, _store_state
from app.domain.models.models import LibraryNote, User, UserAppState
from app.infrastructure.database.connection import get_db

router = APIRouter()
log = logging.getLogger(__name__)

NOTE_COLOR = "#fef3c7"
MAX_TASKS = 40
MAX_NOTES = 30
MAX_TODOS = 200
TASK_ICON = "pencil-square"


def _utc_today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _state_data(state: UserAppState | None) -> dict[str, Any]:
    data = getattr(state, "state_data", None)
    return data if isinstance(data, dict) else {}


# --------------------------------------------------------------------------- to-dos

def _todo_out(row: Any) -> dict[str, Any]:
    return {
        "id": row.id,
        "title": row.title,
        "done": bool(row.done),
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "done_at": row.done_at.isoformat() if row.done_at else None,
    }


async def _todos_rows(db: AsyncSession, user: User, limit: int = MAX_TODOS) -> list[Any]:
    rows = await db.execute(
        text("""
            SELECT id, title, done, created_at, done_at
            FROM widget_todos
            WHERE user_id = :uid
            ORDER BY done ASC, created_at DESC
            LIMIT :lim
        """),
        {"uid": user.id, "lim": limit},
    )
    return rows.all()


async def _todos_payload(db: AsyncSession, user: User) -> dict[str, Any]:
    todos = [_todo_out(row) for row in await _todos_rows(db, user)]
    return {
        "todos": todos,
        "total": len(todos),
        "done": sum(1 for t in todos if t["done"]),
    }


# --------------------------------------------------------------------------- notes

async def _notes_block(db: AsyncSession, user: User) -> list[dict[str, Any]]:
    """Newest library notes; Premium-only, same rule as /v1/library."""
    if not has_premium_access(user):
        return []
    rows = (await db.execute(
        select(LibraryNote)
        .where(LibraryNote.user_id == user.id)
        .order_by(LibraryNote.updated_at.desc())
        .limit(MAX_NOTES)
    )).scalars().all()
    out: list[dict[str, Any]] = []
    for note in rows:
        preview = " ".join((note.content or "").split())[:200]
        out.append({
            "id": note.id,
            "title": note.title or "",
            "preview": preview,
            "color": note.color,
            "folder_id": note.folder_id,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        })
    return out


# --------------------------------------------------------------------------- schemas

class ToggleIn(BaseModel):
    done: bool | None = None


class TodoIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    minutes: int = Field(default=15, ge=1, le=240)


class NoteIn(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    content: str = Field(default="", max_length=20_000)


# --------------------------------------------------------------------------- widget endpoints

@router.get("/data")
async def widget_data(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Both tabs in one round trip."""
    todos = await _todos_payload(db, user)
    return {
        "date": _utc_today(),
        "todos": todos["todos"],
        "todos_total": todos["total"],
        "todos_done": todos["done"],
        "notes": await _notes_block(db, user),
        "premium": has_premium_access(user),
    }


@router.get("/todos")
async def widget_todos(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _todos_payload(db, user)


@router.post("/todos", status_code=201)
async def widget_add_todo(
    payload: TodoIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a to-do item; works for every account, no Premium needed."""
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")
    count = (await db.execute(
        text("SELECT count(*) FROM widget_todos WHERE user_id = :uid"), {"uid": user.id}
    )).scalar() or 0
    if int(count) >= MAX_TODOS:
        raise HTTPException(status_code=409, detail="Too many items; clear some first")
    todo_id = "todo-" + uuid.uuid4().hex[:10]
    row = (await db.execute(
        text("""
            INSERT INTO widget_todos (id, user_id, title, done)
            VALUES (:id, :uid, :title, FALSE)
            RETURNING id, title, done, created_at, done_at
        """),
        {"id": todo_id, "uid": user.id, "title": title[:200]},
    )).one()
    await db.commit()
    return {"todo": _todo_out(row)}


@router.post("/todos/{todo_id}/toggle")
async def widget_toggle_todo(
    todo_id: str,
    payload: ToggleIn | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = (await db.execute(
        text("SELECT done FROM widget_todos WHERE id = :id AND user_id = :uid"),
        {"id": todo_id, "uid": user.id},
    )).first()
    if existing is None:
        raise HTTPException(status_code=404, detail="To-do not found")
    want = payload.done if payload is not None and payload.done is not None else (not existing.done)
    await db.execute(
        text("""
            UPDATE widget_todos
               SET done = :done,
                   done_at = CASE WHEN :done THEN NOW() ELSE NULL END
             WHERE id = :id AND user_id = :uid
        """),
        {"done": bool(want), "id": todo_id, "uid": user.id},
    )
    await db.commit()
    return {"done": bool(want), **await _todos_payload(db, user)}


@router.delete("/todos/{todo_id}", status_code=204)
async def widget_delete_todo(
    todo_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("DELETE FROM widget_todos WHERE id = :id AND user_id = :uid"),
        {"id": todo_id, "uid": user.id},
    )
    await db.commit()
    if not result.rowcount:
        raise HTTPException(status_code=404, detail="To-do not found")


@router.get("/notes")
async def widget_notes(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {"notes": await _notes_block(db, user), "premium": has_premium_access(user)}


@router.post("/notes", status_code=201)
async def widget_add_note(
    payload: NoteIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a quick library note (Premium, same storage as the library screen)."""
    if not has_premium_access(user):
        raise HTTPException(status_code=403, detail="Notes require a Premium account")
    item = LibraryNote(
        user_id=user.id,
        folder_id=None,
        title=payload.title.strip(),
        content=payload.content,
        drawing=[],
        color=NOTE_COLOR,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    try:  # keep open web tabs in sync with notes created from a widget
        from app.api.routes.library import publish_library_event
        await publish_library_event(user.id, "created", "note", item.id, None)
    except Exception:
        log.warning("widget note created without realtime publish", exc_info=True)
    return {
        "id": item.id,
        "title": item.title,
        "color": item.color,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


# --------------------------------------------------------------------------- legacy plan API
# Kept so widgets installed before the to-do list existed keep working.

def _plan_block(data: dict[str, Any]) -> dict[str, Any]:
    plan = data.get("plan")
    plan = plan if isinstance(plan, dict) else {}
    raw = plan.get("activities")
    raw = raw if isinstance(raw, list) else []
    completed = data.get("completedActivities")
    done_ids = {x for x in completed if isinstance(x, str)} if isinstance(completed, list) else set()
    tasks: list[dict[str, Any]] = []
    for position, item in enumerate(raw[:MAX_TASKS], start=1):
        if not isinstance(item, dict):
            continue
        task_id = item.get("id")
        if not isinstance(task_id, str) or not task_id:
            continue
        tasks.append({
            "id": task_id,
            "title": str(item.get("title") or "")[:200],
            "desc": str(item.get("desc") or "")[:300],
            "minutes": int(item.get("dur") or 0),
            "done": task_id in done_ids,
            "position": position,
        })
    return {
        "plan_id": plan.get("id") if isinstance(plan.get("id"), str) else None,
        "plan_date": plan.get("date") if isinstance(plan.get("date"), str) else None,
        "plan_name": plan.get("examName") if isinstance(plan.get("examName"), str) else None,
        "is_today": plan.get("date") == _utc_today(),
        "tasks": tasks,
        "done": sum(1 for t in tasks if t["done"]),
        "total": len(tasks),
    }


async def _legacy_payload(db: AsyncSession, user: User, state: UserAppState | None = None) -> dict[str, Any]:
    if state is None:
        state = (await db.execute(select(UserAppState).where(UserAppState.user_id == user.id))).scalar_one_or_none()
    return {
        "date": _utc_today(),
        "plan": _plan_block(_state_data(state)),
        "notes": await _notes_block(db, user),
        "premium": has_premium_access(user),
    }


@router.get("/today")
async def widget_today(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _legacy_payload(db, user)


@router.post("/tasks/{task_id}/toggle")
async def widget_toggle_task(
    task_id: str,
    payload: ToggleIn | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    state = await _locked_state(db, user)
    if state is None:
        raise HTTPException(status_code=404, detail="No plan yet")
    data = dict(_state_data(state))
    plan = data.get("plan") if isinstance(data.get("plan"), dict) else {}
    raw = plan.get("activities") if isinstance(plan.get("activities"), list) else []
    known = {a.get("id") for a in raw if isinstance(a, dict)}
    if task_id not in known:
        raise HTTPException(status_code=404, detail="Task not found")
    completed = [x for x in (data.get("completedActivities") or []) if isinstance(x, str)]
    want = payload.done if payload is not None and payload.done is not None else (task_id not in completed)
    if want and task_id not in completed:
        completed.append(task_id)
    elif not want and task_id in completed:
        completed.remove(task_id)
    data["completedActivities"] = completed
    _store_state(db, user, state, int(getattr(state, "schema_version", 1) or 1), data, ["completedActivities"])
    await db.commit()
    await db.refresh(state)
    return await _legacy_payload(db, user, state)


@router.post("/tasks", status_code=201)
async def widget_add_task(
    payload: TaskIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    state = await _locked_state(db, user)
    data = dict(_state_data(state)) if state is not None else {}
    plan = data.get("plan") if isinstance(data.get("plan"), dict) else None
    if state is None or not plan:
        raise HTTPException(status_code=409, detail="Open the app once to create today's plan")
    raw = plan.get("activities") if isinstance(plan.get("activities"), list) else []
    new_task = {
        "id": "widget-" + uuid.uuid4().hex[:10],
        "title": payload.title.strip(),
        "desc": "",
        "icon": TASK_ICON,
        "dur": payload.minutes,
        "type": "custom",
    }
    plan = dict(plan)
    plan["activities"] = raw + [new_task]
    data["plan"] = plan
    _store_state(db, user, state, int(getattr(state, "schema_version", 1) or 1), data, ["plan.activities"])
    await db.commit()
    await db.refresh(state)
    return {"task": {**new_task, "done": False, "position": len(plan["activities"]), "minutes": payload.minutes}}
