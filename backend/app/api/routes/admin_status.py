"""ADMIN-STATUS (2026-11-19): data for the four windows on the admin page header —
system (live CPU / RAM / disk), content (what the pipeline added, what comes next) and APIs (live test of every provider key).
User counts are computed in the page from /v1/admin/users."""
from __future__ import annotations

import asyncio
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, Depends

from app.api import ai_registry as reg
from app.api.access import require_admin
from app.api.routes.account import current_user
from app.domain.models.models import User

router = APIRouter()
STATE_DIR = Path("/var/lib/amookht-method")


def _cpu_times() -> tuple[int, int]:
    with open("/proc/stat", encoding="ascii") as fh:
        parts = [int(x) for x in fh.readline().split()[1:]]
    idle = parts[3] + (parts[4] if len(parts) > 4 else 0)
    return sum(parts), idle


def _meminfo() -> dict[str, int]:
    out = {}
    with open("/proc/meminfo", encoding="ascii") as fh:
        for line in fh:
            k, v = line.split(":", 1)
            out[k] = int(v.split()[0]) * 1024
    return out


@router.get("/status/system")
async def system_status(user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    t1, i1 = _cpu_times()
    await asyncio.sleep(0.4)
    t2, i2 = _cpu_times()
    cpu = 0.0 if t2 == t1 else round(100 * (1 - (i2 - i1) / (t2 - t1)), 1)
    mem = _meminfo()
    st = os.statvfs("/")
    disk_total = st.f_blocks * st.f_frsize; disk_free = st.f_bavail * st.f_frsize
    with open("/proc/uptime", encoding="ascii") as fh:
        uptime = float(fh.read().split()[0])
    load1, load5, load15 = os.getloadavg()
    return {
        "time": datetime.now(timezone.utc).isoformat(), "cpu_percent": cpu, "cpu_count": os.cpu_count() or 1,
        "load": [round(load1, 2), round(load5, 2), round(load15, 2)],
        "ram": {"total": mem.get("MemTotal", 0), "available": mem.get("MemAvailable", 0), "used": mem.get("MemTotal", 0) - mem.get("MemAvailable", 0)},
        "swap": {"total": mem.get("SwapTotal", 0), "used": mem.get("SwapTotal", 0) - mem.get("SwapFree", 0)},
        "disk": {"total": disk_total, "free": disk_free, "used": disk_total - disk_free},
        "uptime_s": int(uptime),
    }


def _read(name: str) -> dict:
    try:
        return json.loads((STATE_DIR / name).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


@router.get("/status/content")
async def content_status(user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    status = _read("status.json"); plan = _read("plan_days.json")
    now = datetime.now(timezone.utc); since = now - timedelta(hours=24)
    added_24h: list[dict] = []; per_kind: dict[str, dict[str, int]] = {}; next_day = None
    for d in plan.get("days", []):
        for it in d.get("items", []):
            pk = per_kind.setdefault(it["kind"], {"total": 0, "published": 0, "generated": 0, "queued": 0})
            pk["total"] += 1; pk[it.get("status", "queued")] = pk.get(it.get("status", "queued"), 0) + 1
            if it.get("added"):
                try:
                    at = datetime.strptime(it["added"], "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
                if at >= since:
                    added_24h.append({"id": it["id"], "kind": it["kind"], "title": it.get("title") or it.get("topic", ""), "added": it["added"], "day": d["day"], "status": it.get("status")})
        if next_day is None and d.get("status") != "published":
            next_day = {"day": d["day"], "theme": d.get("theme", ""), "status": d.get("status"), "ready": sum(1 for i in d.get("items", []) if i.get("status") == "published"), "items": len(d.get("items", []))}
    added_24h.sort(key=lambda x: x["added"], reverse=True)
    updated = status.get("updated_at")
    next_run = None
    if updated and not status.get("done"):
        try:
            next_run = (datetime.fromisoformat(updated.replace("Z", "+00:00")) + timedelta(minutes=20)).isoformat()
        except ValueError:
            next_run = None
    days = plan.get("days", [])
    return {
        "time": now.isoformat(), "pipeline": {"active": not status.get("done", False), "updated_at": updated, "next_run": next_run, "last_runs": (status.get("last_runs") or [])[-4:],
                                              "targets": status.get("targets"), "generated": status.get("generated"), "published": status.get("published")},
        "days": {"total": len(days), "published": sum(1 for d in days if d.get("status") == "published")},
        "per_kind": per_kind, "added_24h": added_24h[:60], "added_24h_count": len(added_24h), "next_day": next_day, "content_version": plan.get("content_version"),
    }


async def _test_key(client: httpx.AsyncClient, p: dict, key: str, model: str) -> dict:
    started = time.monotonic()
    try:
        content, _use = await reg.call_once(client, p, key, model, [{"role": "user", "content": "Reply with: ok"}], max_tokens=8, timeout=20.0, effort="low")
        return {"ok": True, "latency_ms": round((time.monotonic() - started) * 1000)}
    except httpx.HTTPStatusError as exc:
        hint = {401: "کلید نامعتبر", 403: "دسترسی ندارد", 404: "مدل یا آدرس پیدا نشد", 429: "سهمیه پر است (rate limit)"}.get(exc.response.status_code, f"HTTP {exc.response.status_code}")
        return {"ok": False, "latency_ms": round((time.monotonic() - started) * 1000), "error": hint, "status": exc.response.status_code}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "latency_ms": round((time.monotonic() - started) * 1000), "error": {"ReadTimeout": "پاسخ نیامد (timeout)", "ConnectTimeout": "اتصال برقرار نشد", "ConnectError": "اتصال برقرار نشد", "TimeoutError": "پاسخ نیامد (timeout)"}.get(type(exc).__name__, type(exc).__name__)}


@router.post("/status/apis")
async def api_status(user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    data = reg.load()
    sem = asyncio.Semaphore(6)
    out: list[dict] = []
    async with httpx.AsyncClient(follow_redirects=False) as client:
        async def one(p: dict, idx: int, key: str, model: str) -> dict:
            async with sem:
                r = await _test_key(client, p, key, model)
            r.update({"key": f"#{idx + 1} " + (reg.mask(key) if key else "بدون کلید")})
            return r
        jobs = []
        for p in data.get("providers", []):
            model = (p.get("models") or [""])[0]
            keys = reg.provider_keys(p) or ([""] if reg.is_local(p) else [])
            row = {"id": p.get("id"), "name": p.get("name") or p.get("id"), "enabled": bool(p.get("enabled", True)), "model": model, "keys": len(keys), "results": []}
            out.append(row)
            if not row["enabled"] or not model or not keys:
                row["note"] = "غیرفعال" if not row["enabled"] else "کلید یا مدل ندارد"
                continue
            for i, k in enumerate(keys[:12]):
                jobs.append((row, one(p, i, k, model)))
        results = await asyncio.gather(*(j for _, j in jobs))
        for (row, _), res in zip(jobs, results):
            row["results"].append(res)
    for row in out:
        row["ok"] = any(r["ok"] for r in row["results"])
        row["working"] = sum(1 for r in row["results"] if r["ok"])
    return {"time": datetime.now(timezone.utc).isoformat(), "providers": out}
