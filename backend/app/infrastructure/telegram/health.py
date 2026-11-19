"""Health check of every part of Amookht. Used by the daily timer (scripts/tg_healthcheck.py) and the owner's
«🩺 سلامت» button. Needs init_db()/init_redis() to have run in the calling process."""
from __future__ import annotations

import asyncio
import json
import os
import shutil
import socket
import ssl
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from sqlalchemy import text

BACKEND = "http://127.0.0.1:8200"
SITE_HOST = "learn.tah3in.com"
APP_DIR = "/opt/amookht/app"
SERVICES = ["amookht-backend", "amookht-telegram", "deutsch-coach", "nginx", "postgresql", "redis-server"]
FAILED_GLOB = "amookht-*"


@dataclass
class Check:
    name: str
    ok: bool
    detail: str = ""


async def _timed(name: str, coro, timeout: float = 45.0) -> Check:
    try:
        return await asyncio.wait_for(coro, timeout)
    except asyncio.TimeoutError:
        return Check(name, False, f"بیش از {int(timeout)} ثانیه پاسخ نداد")
    except Exception as exc:  # pragma: no cover - defensive
        return Check(name, False, f"{type(exc).__name__}: {str(exc)[:120]}")


async def check_backend(client: httpx.AsyncClient) -> Check:
    t = time.monotonic()
    r = await client.get(f"{BACKEND}/health")
    ms = int((time.monotonic() - t) * 1000)
    ok = r.status_code == 200 and r.json().get("status") == "ok"
    return Check("بک‌اند (API)", ok, f"HTTP {r.status_code} · {ms}ms")


async def check_site(client: httpx.AsyncClient) -> Check:
    r = await client.get(f"https://{SITE_HOST}/", follow_redirects=False)
    # Behind the password gate a 200/30x/401 all mean nginx + TLS are serving.
    return Check("سایت (nginx)", r.status_code < 500, f"HTTP {r.status_code}")


async def check_db() -> Check:
    from app.infrastructure.database.connection import get_session_factory
    t = time.monotonic()
    async with get_session_factory()() as session:
        users = (await session.execute(text("SELECT count(*) FROM users WHERE deleted_at IS NULL"))).scalar_one()
        await session.execute(text("SELECT 1 FROM user_app_states LIMIT 1"))
    return Check("پایگاه داده (Postgres)", True, f"{users} کاربر · {int((time.monotonic() - t) * 1000)}ms")


async def check_redis() -> Check:
    from app.infrastructure.cache.redis import get_redis
    redis = get_redis()
    pong = await redis.ping()
    return Check("Redis", bool(pong), "")


async def check_sync(client: httpx.AsyncClient) -> Check:
    """Realtime sync: Redis pub/sub round trip + the WebSocket endpoint answers (rejects a bogus token cleanly)."""
    from app.infrastructure.cache.redis import get_redis
    redis = get_redis()
    channel = "amookht:sync:healthcheck"
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        await redis.publish(channel, "ping")
        got = False
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if msg and msg.get("type") == "message":
                got = True
                break
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose() if hasattr(pubsub, "aclose") else await pubsub.close()
    if not got:
        return Check("همگام‌سازی (Sync)", False, "پیام Redis pub/sub برنگشت")
    try:
        import websockets
        async with websockets.connect("ws://127.0.0.1:8200/v1/sync/ws", open_timeout=8, close_timeout=3) as ws:
            await ws.send(json.dumps({"type": "auth", "token": "healthcheck-invalid"}))
            try:
                await asyncio.wait_for(ws.recv(), 8)
            except websockets.ConnectionClosed:
                pass
    except Exception as exc:
        name = type(exc).__name__
        if "InvalidStatus" in name or "ConnectionRefused" in name or "OSError" in name:
            return Check("همگام‌سازی (Sync)", False, f"WebSocket وصل نشد ({name})")
    return Check("همگام‌سازی (Sync)", True, "pub/sub و WebSocket سالم")


async def check_groq(client: httpx.AsyncClient) -> Check:
    from app.api.routes.owner_ai_chat import _providers
    groq = next((p for p in _providers() if p["id"] == "builtin:groq"), None)
    keys = list((groq or {}).get("keys") or [])
    if not keys:
        return Check("هوش مصنوعی Groq", False, "هیچ کلیدی پیدا نشد")
    working = 0
    errors: list[str] = []
    for key in keys[:12]:
        try:
            r = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=15)
            if r.status_code == 200:
                working += 1
            else:
                errors.append(str(r.status_code))
        except httpx.HTTPError as exc:
            errors.append(type(exc).__name__)
    from app.api import ai_guard
    breakers = []
    for name in ("groq-method", "groq-grammar", "groq-tutor", "nvidia-method"):
        try:
            if await ai_guard.retry_after(name):
                breakers.append(name)
        except Exception:
            pass
    ok = working > 0
    detail = f"{working}/{len(keys)} کلید فعال"
    if errors:
        detail += f" · خطاها: {', '.join(sorted(set(errors)))}"
    if breakers:
        detail += f" · مدار قطع: {', '.join(breakers)}"
    return Check("هوش مصنوعی Groq", ok, detail)


async def check_nvidia(client: httpx.AsyncClient) -> Check:
    from app.api import ai_nvidia
    keys = ai_nvidia.keys()
    if not keys:
        return Check("هوش مصنوعی NVIDIA", False, "هیچ کلید فعالی نیست")
    last = ""
    for model in ai_nvidia.MODELS:
        for key in keys:
            try:
                t = time.monotonic()
                r = await client.post(ai_nvidia.URL, headers={"Authorization": f"Bearer {key}"}, timeout=45, json={
                    "model": model, "max_tokens": 5, "messages": [{"role": "user", "content": "Antworte nur: ok"}]})
                if r.status_code == 200 and r.json().get("choices"):
                    return Check("هوش مصنوعی NVIDIA", True, f"{model.split('/')[-1]} · {time.monotonic() - t:.1f}s")
                last = f"HTTP {r.status_code}"
            except httpx.HTTPError as exc:
                last = type(exc).__name__
    return Check("هوش مصنوعی NVIDIA", False, f"هیچ مدل/کلیدی پاسخ نداد ({last})")


async def check_grammar(client: httpx.AsyncClient) -> Check:
    problems = []
    for path in ("/v1/grammar-drill/sentences", "/v1/grammar-drill/check"):
        r = await client.post(f"{BACKEND}{path}", json={})
        if r.status_code not in (401, 403, 422):
            problems.append(f"{path.rsplit('/', 1)[-1]}: HTTP {r.status_code}")
    for name in ("grammar-drill.js", "grammar-drill-bank.js", "grammar-drill.css"):
        p = os.path.join(APP_DIR, name)
        if not os.path.exists(p) or os.path.getsize(p) < 200:
            problems.append(f"فایل {name} نیست")
    return Check("ربات گرامر (endpoints)", not problems, "؛ ".join(problems) or "مسیرها و فایل‌ها سالم")


async def check_disk() -> Check:
    usage = shutil.disk_usage("/")
    pct = usage.used * 100 / usage.total
    free_gb = usage.free / 1024 ** 3
    return Check("فضای دیسک", pct < 90 and free_gb > 1.0, f"{pct:.0f}% پر · {free_gb:.1f} GB آزاد")


async def check_memory() -> Check:
    info = {}
    with open("/proc/meminfo") as fh:
        for line in fh:
            k, v = line.split(":", 1)
            info[k] = int(v.split()[0])
    avail_mb = info.get("MemAvailable", 0) / 1024
    swap_used = (info.get("SwapTotal", 0) - info.get("SwapFree", 0)) / 1024
    return Check("حافظه (RAM)", avail_mb > 120, f"{avail_mb:.0f} MB آزاد · swap {swap_used:.0f} MB")


def _cert_days(host: str) -> float:
    ctx = ssl.create_default_context()
    with socket.create_connection((host, 443), timeout=10) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as tls:
            cert = tls.getpeercert()
    expires = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
    return (expires - datetime.now(timezone.utc)).total_seconds() / 86400


async def check_cert() -> Check:
    days = await asyncio.to_thread(_cert_days, SITE_HOST)
    return Check("گواهی SSL", days >= 14, f"{int(days)} روز تا انقضا")


def _systemctl(*args: str) -> str:
    try:
        return subprocess.run(["systemctl", *args], capture_output=True, text=True, timeout=10).stdout
    except Exception:
        return ""


async def check_services() -> Check:
    bad = []
    for svc in SERVICES:
        state = (await asyncio.to_thread(_systemctl, "is-active", svc)).strip()
        if state != "active":
            bad.append(f"{svc}: {state or '?'}")
    failed = await asyncio.to_thread(_systemctl, "list-units", "--failed", "--plain", "--no-legend", FAILED_GLOB)
    for line in failed.splitlines():
        unit = line.split()[0] if line.split() else ""
        if unit:
            bad.append(f"{unit}: failed")
    return Check("سرویس‌ها", not bad, "؛ ".join(bad) or f"{len(SERVICES)} سرویس فعال")


async def check_telegram(token: str, client: httpx.AsyncClient) -> Check:
    r = await client.get(f"https://api.telegram.org/bot{token}/getMe", timeout=15)
    return Check("اتصال تلگرام", r.status_code == 200, f"HTTP {r.status_code}")


async def run_all(token: str = "") -> list[Check]:
    async with httpx.AsyncClient(timeout=httpx.Timeout(20, connect=8)) as client:
        jobs = [
            _timed("بک‌اند (API)", check_backend(client)),
            _timed("سایت (nginx)", check_site(client)),
            _timed("پایگاه داده (Postgres)", check_db()),
            _timed("Redis", check_redis()),
            _timed("همگام‌سازی (Sync)", check_sync(client)),
            _timed("هوش مصنوعی Groq", check_groq(client), 90),
            _timed("هوش مصنوعی NVIDIA", check_nvidia(client), 120),
            _timed("ربات گرامر (endpoints)", check_grammar(client)),
            _timed("فضای دیسک", check_disk()),
            _timed("حافظه (RAM)", check_memory()),
            _timed("گواهی SSL", check_cert()),
            _timed("سرویس‌ها", check_services()),
        ]
        if token:
            jobs.append(_timed("اتصال تلگرام", check_telegram(token, client)))
        return list(await asyncio.gather(*jobs))


def report(checks: list[Check], only_failures: bool = False) -> str:
    from app.infrastructure.telegram.fmt import esc, local_stamp
    bad = [c for c in checks if not c.ok]
    if only_failures:
        head = f"🚨 <b>بررسی سلامت آموخت: {len(bad)} مورد خراب</b>"
        rows = bad
    else:
        head = "🩺 <b>بررسی سلامت آموخت</b>\n" + ("✅ همه بخش‌ها سالم‌اند" if not bad else f"⚠️ {len(bad)} مورد مشکل دارد")
        rows = sorted(checks, key=lambda c: c.ok)
    lines = [head, ""]
    for c in rows:
        lines.append(f"{'✅' if c.ok else '❌'} <b>{esc(c.name)}</b>" + (f" — {esc(c.detail)}" if c.detail else ""))
    lines += ["", f"🕒 {local_stamp()}"]
    return "\n".join(lines)
