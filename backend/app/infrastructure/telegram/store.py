"""Telegram link storage, announcements and per-user progress computation (raw SQL, no ORM models needed)."""
from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from sqlalchemy import text

from app.infrastructure.database.connection import get_session_factory
from app.infrastructure.telegram.fmt import now_in

DEFAULT_PREFS = {"reminders": True, "summary": True, "announcements": True, "reminder_hour": 19, "summary_hour": 22}
REMINDER_HOURS = (17, 18, 19, 20, 21)
SUMMARY_HOURS = (20, 21, 22, 23)

DDL = [
    """
    CREATE TABLE IF NOT EXISTS telegram_links (
        user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        chat_id BIGINT NOT NULL UNIQUE,
        tg_username VARCHAR(64),
        tg_name VARCHAR(128),
        prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS telegram_announcements (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        show_on_site BOOLEAN NOT NULL DEFAULT TRUE,
        sent INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ
    )
    """,
    "ALTER TABLE telegram_announcements ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ",
]


async def ensure_tables() -> None:
    async with get_session_factory()() as session:
        for stmt in DDL:
            await session.execute(text(stmt))
        await session.commit()


def prefs_of(raw: Any) -> dict:
    prefs = dict(DEFAULT_PREFS)
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            raw = {}
    if isinstance(raw, dict):
        prefs.update({k: v for k, v in raw.items() if k in DEFAULT_PREFS})
    return prefs


async def _rows(sql: str, **params) -> list[dict]:
    async with get_session_factory()() as session:
        result = await session.execute(text(sql), params)
        return [dict(r._mapping) for r in result]


async def _exec(sql: str, **params) -> int:
    async with get_session_factory()() as session:
        result = await session.execute(text(sql), params)
        await session.commit()
        return result.rowcount or 0


# ---- links ------------------------------------------------------------------------------------------------------

async def link_by_chat(chat_id: int) -> dict | None:
    rows = await _rows(
        """SELECT l.*, u.display_name, u.email FROM telegram_links l JOIN users u ON u.id = l.user_id
           WHERE l.chat_id = :c AND u.deleted_at IS NULL""", c=int(chat_id))
    return rows[0] if rows else None


async def link_by_user(user_id: str) -> dict | None:
    rows = await _rows("SELECT * FROM telegram_links WHERE user_id = :u", u=user_id)
    return rows[0] if rows else None


async def upsert_link(user_id: str, chat_id: int, username: str | None, name: str | None) -> None:
    async with get_session_factory()() as session:
        # One Telegram chat ↔ one site account: drop any older pairing on either side first.
        await session.execute(text("DELETE FROM telegram_links WHERE chat_id = :c AND user_id <> :u"), {"c": int(chat_id), "u": user_id})
        await session.execute(text(
            """INSERT INTO telegram_links (user_id, chat_id, tg_username, tg_name, prefs, active)
               VALUES (:u, :c, :un, :n, '{}'::jsonb, TRUE)
               ON CONFLICT (user_id) DO UPDATE SET chat_id = EXCLUDED.chat_id, tg_username = EXCLUDED.tg_username,
                 tg_name = EXCLUDED.tg_name, active = TRUE, linked_at = now(), updated_at = now()"""),
            {"u": user_id, "c": int(chat_id), "un": (username or "")[:64] or None, "n": (name or "")[:128] or None})
        await session.commit()


async def unlink_user(user_id: str) -> int:
    return await _exec("DELETE FROM telegram_links WHERE user_id = :u", u=user_id)


async def unlink_chat(chat_id: int) -> int:
    return await _exec("DELETE FROM telegram_links WHERE chat_id = :c", c=int(chat_id))


async def set_inactive(chat_id: int) -> None:
    await _exec("UPDATE telegram_links SET active = FALSE, updated_at = now() WHERE chat_id = :c", c=int(chat_id))


async def set_pref(user_id: str, key: str, value: Any) -> dict:
    if key not in DEFAULT_PREFS:
        raise ValueError(key)
    await _exec(
        """UPDATE telegram_links SET prefs = COALESCE(prefs, '{}'::jsonb) || jsonb_build_object(CAST(:k AS text), CAST(:v AS jsonb)),
           updated_at = now() WHERE user_id = :u""", u=user_id, k=key, v=json.dumps(value))
    link = await link_by_user(user_id)
    return prefs_of(link["prefs"] if link else {})


async def active_links() -> list[dict]:
    return await _rows(
        """SELECT l.user_id, l.chat_id, l.prefs, u.display_name, u.email, s.state_data
           FROM telegram_links l JOIN users u ON u.id = l.user_id
           LEFT JOIN user_app_states s ON s.user_id = l.user_id
           WHERE l.active AND u.deleted_at IS NULL AND u.is_active""")


async def load_state(user_id: str) -> dict:
    rows = await _rows("SELECT state_data FROM user_app_states WHERE user_id = :u", u=user_id)
    data = rows[0]["state_data"] if rows else {}
    if isinstance(data, str):
        data = json.loads(data)
    return data if isinstance(data, dict) else {}


# ---- announcements ----------------------------------------------------------------------------------------------

async def create_announcement(body: str, show_on_site: bool) -> int:
    async with get_session_factory()() as session:
        result = await session.execute(text(
            "INSERT INTO telegram_announcements (text, show_on_site, expires_at) VALUES (:t, :s, now() + interval '14 days') RETURNING id"),
            {"t": body, "s": show_on_site})
        new_id = int(result.scalar_one())
        await session.commit()
        return new_id


async def finish_announcement(ann_id: int, sent: int, failed: int) -> None:
    await _exec("UPDATE telegram_announcements SET sent = :s, failed = :f WHERE id = :i", s=sent, f=failed, i=ann_id)


async def latest_site_announcement() -> dict | None:
    rows = await _rows(
        """SELECT id, text, created_at FROM telegram_announcements
           WHERE show_on_site AND (expires_at IS NULL OR expires_at > now()) ORDER BY id DESC LIMIT 1""")
    return rows[0] if rows else None


_ACTIVE = "show_on_site AND (expires_at IS NULL OR expires_at > now())"


async def active_announcements() -> list[dict]:
    """Banners currently shown on the site, newest first."""
    return await _rows(f"SELECT id, text, created_at, sent, failed, expires_at FROM telegram_announcements WHERE {_ACTIVE} ORDER BY id DESC")


async def past_announcements(limit: int = 8) -> list[dict]:
    """History: Telegram-only, removed or expired announcements, newest first."""
    return await _rows(
        f"""SELECT id, text, created_at, sent, failed, show_on_site, hidden_at, expires_at FROM telegram_announcements
            WHERE NOT ({_ACTIVE}) ORDER BY id DESC LIMIT :n""", n=limit)


async def hide_announcement(ann_id: int) -> None:
    await _exec("UPDATE telegram_announcements SET show_on_site = FALSE, hidden_at = now() WHERE id = :i AND show_on_site", i=ann_id)


# ---- progress ---------------------------------------------------------------------------------------------------

def _num(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def today_progress(state: dict, tz_name: str | None = None) -> dict:
    """What the learner did today (in their own time zone), from the synced app state."""
    state = state if isinstance(state, dict) else {}
    user = state.get("user") if isinstance(state.get("user"), dict) else {}
    tz_name = tz_name or user.get("timezone") or "Asia/Tehran"
    now = now_in(tz_name)
    today = now.date().isoformat()
    exam_plan = str(user.get("examPlan") or "")

    method_secs = 0.0
    method_done = 0
    method_started = 0
    for key in ("testdafMethod", "oesdMethod"):
        prog = state.get(key) if isinstance(state.get(key), dict) else {}
        day = ((prog.get("days") or {}) if isinstance(prog.get("days"), dict) else {}).get(today) or {}
        work = day.get("work") if isinstance(day, dict) and isinstance(day.get("work"), dict) else {}
        for item in work.values():
            if not isinstance(item, dict):
                continue
            secs = item.get("secs")
            item_secs = sum(_num(s) for s in secs) if isinstance(secs, list) else _num(secs)
            method_secs += item_secs
            if item_secs > 0 or item.get("done"):
                method_started += 1
            if item.get("done"):
                method_done += 1

    free = ((state.get("appSettings") or {}).get("freeStudy") or {}) if isinstance(state.get("appSettings"), dict) else {}
    sessions = free.get("sessions") if isinstance(free, dict) and isinstance(free.get("sessions"), dict) else {}
    free_secs = _num(sessions.get(today))

    plan = state.get("plan") if isinstance(state.get("plan"), dict) else {}
    plan_total = plan_done = 0
    if plan.get("date") == today:
        ids = [str(a.get("id")) for a in plan.get("activities") or [] if isinstance(a, dict)]
        plan_total = len(ids)
        done_ids = {str(x) for x in (state.get("completed") or [])}
        plan_done = len([i for i in ids if i in done_ids])

    tdm = state.get("oesdMethod") if exam_plan == "oesd" else state.get("testdafMethod")
    target_min = int(_num((tdm or {}).get("dailyMin") if isinstance(tdm, dict) else 0) or _num(user.get("dailyMinutes"), 60) or 60)

    exam_days = None
    try:
        exam_date = date.fromisoformat(str(user.get("examDate") or "")[:10])
        exam_days = (exam_date - now.date()).days
    except ValueError:
        pass

    studied_secs = method_secs + free_secs
    done = max(method_done, plan_done)
    return {
        "today": today,
        "local_now": now,
        "studied_secs": studied_secs,
        "studied": studied_secs >= 60 or done > 0,
        "modules_done": done,
        "modules_started": max(method_started, plan_done),
        "plan_total": plan_total,
        "target_min": target_min,
        "streak": int(_num(state.get("streak"))),
        "points": int(_num(state.get("points"))),
        "exam_days": exam_days,
        "exam_plan": exam_plan,
        "name": str(user.get("name") or "").strip(),
        "notifications": user.get("notifications") is not False,
    }
