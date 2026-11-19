"""LAST-SEEN (2026-11-14): when a signed-in user last used the site (any authenticated API call).
Stored in its own table user_last_seen (no FK / no lock on users), written at most every 5 minutes per user and
worker, in its own short DB session so the request's session is untouched."""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone

from sqlalchemy import text

log = logging.getLogger(__name__)
INTERVAL = 300
_written: dict[str, float] = {}
_tasks: set = set()


async def _write(user_id: str, when: datetime) -> None:
    try:
        from app.infrastructure.database.connection import get_session_factory
        async with get_session_factory()() as session:
            await session.execute(text("INSERT INTO user_last_seen (user_id, seen_at) VALUES (:id, :t) "
                                       "ON CONFLICT (user_id) DO UPDATE SET seen_at = GREATEST(user_last_seen.seen_at, EXCLUDED.seen_at)"), {"t": when, "id": user_id})
            await session.commit()
    except Exception:  # noqa: BLE001 - never break a request for this
        log.debug("last_seen update failed", exc_info=True)


def touch(user) -> None:
    try:
        uid = str(user.id)
        now = time.time()
        if now - _written.get(uid, 0) < INTERVAL:
            return
        when = datetime.now(timezone.utc)
        _written[uid] = now
        if len(_written) > 20000:
            _written.clear()
        task = asyncio.get_running_loop().create_task(_write(uid, when))
        _tasks.add(task)
        task.add_done_callback(_tasks.discard)
    except Exception:  # noqa: BLE001
        pass


async def map_for(db, ids: list[str]) -> dict:
    if not ids:
        return {}
    return dict((await db.execute(text("SELECT user_id, seen_at FROM user_last_seen WHERE user_id = ANY(:ids)"), {"ids": ids})).all())
