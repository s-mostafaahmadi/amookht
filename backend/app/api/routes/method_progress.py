"""METHOD-PROGRESS (2026-11-19): admin list of the TestDaF exercise set - every plan day (pack), its topic,
its exercises with build status, and where the viewing account currently is (used / done / today)."""
from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_admin
from app.api.routes.account import current_user
from app.domain.models.models import User, UserAppState
from app.infrastructure.database.connection import get_db

router = APIRouter()
PLAN_DAYS = Path("/var/lib/amookht-method/plan_days.json")
WD_ORDER = [6, 0, 1, 2, 3, 4, 5]


def _js_wd(d: date) -> int:  # JS getDay(): Sunday = 0
    return (d.weekday() + 1) % 7


def _first_saturday(start: date) -> date:  # same rule as the engine's firstSaturday()
    sat = start - timedelta(days=(_js_wd(start) - 6) % 7)
    return sat + timedelta(days=7) if _js_wd(start) == 5 else sat


def _parse(v: Any) -> date | None:
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


@router.get("/method-progress")
async def method_progress(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    require_admin(user)
    try:
        data = json.loads(PLAN_DAYS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise HTTPException(status_code=503, detail="plan_days.json is not available yet")
    row = (await db.execute(select(UserAppState.state_data).where(UserAppState.user_id == user.id))).scalar_one_or_none()
    state = row if isinstance(row, dict) else {}
    m = state.get("testdafMethod") if isinstance(state.get("testdafMethod"), dict) else {}
    used = {k: set(v) for k, v in (m.get("used") or {}).items() if isinstance(v, list)}
    done_ids: set[str] = set()
    for d in (m.get("days") or {}).values():
        if isinstance(d, dict) and isinstance(d.get("picks"), dict) and d.get("results"):
            p = d["picks"]
            res = d.get("results") or {}
            for mod, ids in (("hoeren", [p.get("hoeren")]), ("lesen", [p.get("lesen")]),
                             ("schreiben", [(p.get("schreiben") or {}).get("id")]), ("sprechen", p.get("sprechen") or [])):
                if mod in res:
                    done_ids.update(i for i in ids if i)
    start = _parse(m.get("startDate"))
    today = date.today()
    cur_day = None
    if start:
        diff = (today - _first_saturday(start)).days
        cur_day = diff + 1 if diff >= 0 else 0
    totals = {"days": len(data["days"]), "published_days": 0, "items": 0, "published": 0, "generated": 0, "queued": 0, "used": 0, "done": 0}
    per_kind: dict[str, dict[str, int]] = {}
    for d in data["days"]:
        if d["status"] == "published":
            totals["published_days"] += 1
        u = 0
        for it in d["items"]:
            it["used"] = it["id"] in used.get(it["kind"], set())
            it["done"] = it["id"] in done_ids
            u += it["used"]
            totals["items"] += 1
            totals[it["status"]] += 1
            totals["used"] += it["used"]
            totals["done"] += it["done"]
            pk = per_kind.setdefault(it["kind"], {"total": 0, "published": 0, "used": 0})
            pk["total"] += 1
            pk["published"] += it["status"] == "published"
            pk["used"] += it["used"]
        d["used_count"] = u
        d["is_today"] = cur_day == d["day"]
        d["is_past"] = cur_day is not None and d["day"] < cur_day
    # the exercises the engine actually picked for today (level ranking can differ from the pack order)
    titles = {it["id"]: it for d in data["days"] for it in d["items"]}
    tp = ((m.get("days") or {}).get(today.isoformat()) or {}).get("picks") or {}
    today_ids = [tp.get("hoeren"), tp.get("lesen"), (tp.get("schreiben") or {}).get("id"), *(tp.get("sprechen") or [])]
    today_picks = [{"id": i, "kind": (titles.get(i) or {}).get("kind", ""), "title": (titles.get(i) or {}).get("title") or (titles.get(i) or {}).get("topic", "")}
                   for i in today_ids if i]
    return {"updated_at": data.get("updated_at"), "today_picks": today_picks, "content_version": data.get("content_version"), "pipeline": data.get("pipeline") or {},
            "learner": {"start_date": m.get("startDate"), "current_day": cur_day, "current_week": ((cur_day - 1) // 7 + 1) if cur_day else 0,
                        "level": (state.get("user") or {}).get("level") if isinstance(state.get("user"), dict) else None},
            "totals": totals, "per_kind": per_kind, "days": data["days"]}
