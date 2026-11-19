"""Keeps user-facing AI calls short and fail-fast (added 2026-11-12, "aifallback").

* Deadline: every request gets a total time budget; each provider attempt gets at most the remaining budget.
* Circuit breaker: after a provider clearly failed (every key rate-limited / rejected, or two requests in a row
  exhausted their budget) it is marked "down" for a short time. While it is down, requests are answered at once
  with 503 {"code": "ai_unavailable", "retry_after": N} instead of trying every key again.
State lives in Redis (shared by both uvicorn workers) with an in-process fallback when Redis is unreachable.
"""
from __future__ import annotations

import logging
import time

from fastapi import HTTPException

log = logging.getLogger(__name__)
PREFIX = "amookht:ai:"
DOWN_SECONDS = 90          # after repeated failures
RATE_LIMIT_SECONDS = 60    # every key answered 429 → the per-minute window must pass
FAIL_WINDOW = 300          # consecutive failures counted within 5 minutes
FAILS_TO_TRIP = 2

_local: dict[str, float] = {}       # name → down until (monotonic-free wall clock)
_local_fails: dict[str, list[float]] = {}
_redis = None


def _client():
    global _redis
    if _redis is None:
        import redis.asyncio as aioredis
        from app.config import get_settings
        _redis = aioredis.from_url(get_settings().REDIS_URL, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
    return _redis


async def retry_after(name: str) -> int:
    """Seconds until the provider may be tried again (0 = available)."""
    try:
        ttl = await _client().ttl(PREFIX + "down:" + name)
        if ttl and ttl > 0:
            return int(ttl)
        _local.pop(name, None)  # AI-ADMIN: Redis answered → it is authoritative (a reset in one worker reaches the other)
        return 0
    except Exception:  # Redis down: use the local view
        pass
    left = _local.get(name, 0) - time.time()
    return int(left) + 1 if left > 0 else 0


async def trip(name: str, seconds: int, reason: str = "") -> None:
    log.warning("AI breaker %s open for %ss (%s)", name, seconds, reason)
    _local[name] = time.time() + seconds
    try:
        await _client().set(PREFIX + "down:" + name, reason or "1", ex=seconds)
    except Exception:
        pass


async def _usage(name: str, field: str) -> None:  # AI-ADMIN usage counters for the historic code paths
    if name.startswith("reg-"):
        return
    try:
        from app.api import ai_registry
        await ai_registry.count(ai_registry.breaker_provider(name), field)
    except Exception:  # noqa: BLE001
        pass


async def reset(name: str) -> None:  # AI-ADMIN: owner pressed "reset" in the AI box
    _local_fails.pop(name, None)
    _local.pop(name, None)
    try:
        await _client().delete(PREFIX + "fails:" + name, PREFIX + "down:" + name)
    except Exception:
        pass


async def record_success(name: str) -> None:
    await _usage(name, "ok")
    _local_fails.pop(name, None)
    _local.pop(name, None)
    try:
        await _client().delete(PREFIX + "fails:" + name, PREFIX + "down:" + name)
    except Exception:
        pass


async def record_failure(name: str, statuses: list[int | str]) -> None:
    """Called when one request exhausted every attempt. Trips at once when every attempt was a 429/401/403/connect
    error (a clear outage), otherwise after FAILS_TO_TRIP failed requests within FAIL_WINDOW."""
    await _usage(name, "fail")
    if statuses and all(s in (429, 401, 403, "connect") for s in statuses):
        await trip(name, RATE_LIMIT_SECONDS if all(s == 429 for s in statuses) else DOWN_SECONDS, "all attempts " + ",".join(map(str, sorted(set(map(str, statuses))))))
        return
    now = time.time()
    fails = [t for t in _local_fails.get(name, []) if now - t < FAIL_WINDOW] + [now]
    _local_fails[name] = fails
    count = len(fails)
    try:
        key = PREFIX + "fails:" + name
        count = int(await _client().incr(key))
        await _client().expire(key, FAIL_WINDOW)
    except Exception:
        pass
    if count >= FAILS_TO_TRIP:
        await trip(name, DOWN_SECONDS, f"{count} failed requests")


def unavailable(seconds: int, message: str = "AI is temporarily unavailable", code: str = "ai_unavailable") -> HTTPException:
    seconds = max(5, int(seconds or 0))
    return HTTPException(status_code=503, detail={"message": message, "code": code, "retry_after": seconds}, headers={"Retry-After": str(seconds)})


async def guard(name: str) -> None:
    """Raise 503 ai_unavailable immediately while the breaker is open."""
    left = await retry_after(name)
    if left:
        raise unavailable(left)


class Deadline:
    def __init__(self, total: float):
        self.end = time.monotonic() + total

    def left(self) -> float:
        return self.end - time.monotonic()

    def attempt(self, cap: float) -> float | None:
        """Timeout for the next attempt, or None when the budget is (almost) used up."""
        left = self.left()
        return None if left < 3 else min(cap, left)
