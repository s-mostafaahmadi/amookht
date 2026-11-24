"""Daily Amookht health check (amookht-healthcheck.timer). Messages the owner on Telegram ONLY when something is broken.

Usage: python scripts/tg_healthcheck.py [--always] [--dry-run]
  --always   send the full report even when everything is fine
  --dry-run  print the report, send nothing
"""
from __future__ import annotations

import asyncio
import sys

from app.config import get_settings
from app.infrastructure.cache.redis import close_redis, init_redis
from app.infrastructure.database.connection import close_db, init_db
from app.infrastructure.telegram import health
from app.infrastructure.telegram.tgapi import TgApi


async def main(argv: list[str]) -> int:
    s = get_settings()
    db_ok = redis_ok = True
    try:
        await init_db(s.DATABASE_URL)
    except Exception:
        db_ok = False
    try:
        await init_redis(s.REDIS_URL)
    except Exception:
        redis_ok = False
    checks = await health.run_all(s.TELEGRAM_BOT_TOKEN.strip())
    if not db_ok:
        checks.append(health.Check("پایگاه داده (Postgres)", False, "اتصال برقرار نشد"))
    if not redis_ok:
        checks.append(health.Check("Redis", False, "اتصال برقرار نشد"))
    broken = [c for c in checks if not c.ok]
    full = health.report(checks)
    print(full.replace("<b>", "").replace("</b>", ""))
    if "--dry-run" not in argv and (broken or "--always" in argv):
        api = TgApi(s.TELEGRAM_BOT_TOKEN)
        try:
            body = full if "--always" in argv else health.report(checks, only_failures=True)
            await api.send(s.TELEGRAM_ADMIN_CHAT_ID.strip(), body)
        finally:
            await api.close()
    for closer in (close_redis, close_db):
        try:
            await closer()
        except Exception:
            pass
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main(sys.argv[1:])))
