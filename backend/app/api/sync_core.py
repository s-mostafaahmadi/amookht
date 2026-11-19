"""Real-time account state sync: path model, per-path versions and the fan-out hub.

The client state is one JSON document. For syncing it is split into "paths":
top-level keys, the children of ``appSettings`` and the children of
``appSettings.freeStudy`` (the focus timer). Each path carries the account
version at which it last changed, so a write that was based on an older
version is rejected for exactly the paths another device changed meanwhile.
"""
from __future__ import annotations

import asyncio
import copy
import logging
import time
from typing import Any

import orjson

log = logging.getLogger("amookht.sync")

DEEP_PATHS = {"appSettings", "appSettings.freeStudy"}
MAX_PATH_DEPTH = 3
MAX_BROADCAST_BYTES = 200_000
CHANNEL_PREFIX = "amookht:sync:"
_MISSING = object()


def server_ms() -> int:
    return int(time.time() * 1000)


def flatten_state(state: Any, prefix: str = "") -> dict[str, Any]:
    out: dict[str, Any] = {}
    if not isinstance(state, dict):
        return out
    for key, value in state.items():
        path = f"{prefix}{key}"
        if path in DEEP_PATHS and isinstance(value, dict):
            out.update(flatten_state(value, path + "."))
        else:
            out[path] = value
    return out


def valid_path(path: Any) -> bool:
    if not isinstance(path, str) or not path or len(path) > 200:
        return False
    parts = path.split(".")
    if len(parts) > MAX_PATH_DEPTH or any(not p for p in parts):
        return False
    # Only the configured containers may be descended into.
    return all(".".join(parts[:i]) in DEEP_PATHS for i in range(1, len(parts)))


def _related(a: str, b: str) -> bool:
    return a == b or a.startswith(b + ".") or b.startswith(a + ".")


def path_version(path_versions: dict, path: str) -> int:
    best = 0
    for other, version in (path_versions or {}).items():
        if _related(path, other):
            try:
                best = max(best, int(version))
            except (TypeError, ValueError):
                continue
    return best


def get_path(state: dict, path: str) -> Any:
    node: Any = state
    for part in path.split("."):
        if not isinstance(node, dict) or part not in node:
            return _MISSING
        node = node[part]
    return node


def _set_path(state: dict, path: str, value: Any) -> None:
    parts = path.split(".")
    node = state
    for part in parts[:-1]:
        child = node.get(part)
        if not isinstance(child, dict):
            child = {}
            node[part] = child
        node = child
    node[parts[-1]] = value


def _unset_path(state: dict, path: str) -> None:
    parts = path.split(".")
    node: Any = state
    for part in parts[:-1]:
        node = node.get(part) if isinstance(node, dict) else None
        if not isinstance(node, dict):
            return
    if isinstance(node, dict):
        node.pop(parts[-1], None)


def apply_patch(
    state: dict | None,
    path_versions: dict | None,
    current_version: int,
    base_version: int,
    sets: dict[str, Any] | None,
    unsets: list[str] | None,
) -> tuple[dict, list[str], list[str], list[str]]:
    """Merge a client patch. Returns (new_state, applied_paths, rejected_paths, invalid_paths).

    A path is rejected when the client's base is older than the account version
    and that path (or an ancestor/descendant) changed after the client's base.
    """
    new_state = copy.deepcopy(state) if isinstance(state, dict) else {}
    pv = path_versions or {}
    applied: list[str] = []
    rejected: list[str] = []
    invalid: list[str] = []
    stale = base_version < current_version
    ops: list[tuple[str, Any]] = [(p, v) for p, v in (sets or {}).items()]
    ops += [(p, _MISSING) for p in (unsets or [])]
    for path, value in ops:
        if not valid_path(path):
            invalid.append(path)
            continue
        if stale and path_version(pv, path) > base_version:
            rejected.append(path)
            continue
        if value is _MISSING:
            _unset_path(new_state, path)
        else:
            _set_path(new_state, path, value)
        applied.append(path)
    return new_state, applied, rejected, invalid


def bump_path_versions(path_versions: dict | None, paths: list[str], version: int) -> dict:
    pv = {k: v for k, v in (path_versions or {}).items()
          if not any(k != p and k.startswith(p + ".") for p in paths)}
    for p in paths:
        pv[p] = version
    return pv


def diff_states(old: dict | None, new: dict | None) -> tuple[dict[str, Any], list[str]]:
    a, b = flatten_state(old or {}), flatten_state(new or {})
    changed = {p: v for p, v in b.items() if p not in a or a[p] != v}
    removed = [p for p in a if p not in b]
    return changed, removed


def patch_message(version: int, state: dict, paths: list[str], client_id: str = "") -> dict:
    sets: dict[str, Any] = {}
    unsets: list[str] = []
    for p in paths:
        value = get_path(state, p)
        if value is _MISSING:
            unsets.append(p)
        else:
            sets[p] = value
    msg = {"type": "patch", "version": version, "set": sets, "unset": unsets,
           "client_id": client_id, "server_time": server_ms()}
    if len(orjson.dumps(msg)) > MAX_BROADCAST_BYTES:
        msg = {"type": "resync", "version": version, "client_id": client_id, "server_time": server_ms()}
    return msg


class SyncHub:
    """Per-process registry of open sockets, fed by one Redis pattern subscription."""

    def __init__(self) -> None:
        self.local: dict[str, set[asyncio.Queue]] = {}
        self._task: asyncio.Task | None = None
        self._redis = None
        self.redis_ok = False

    def _client(self):
        if self._redis is None:
            import redis.asyncio as aioredis
            from app.config import get_settings
            self._redis = aioredis.from_url(get_settings().REDIS_URL, decode_responses=True,
                                            socket_connect_timeout=2, health_check_interval=30)
        return self._redis

    def ensure_listener(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._listen())

    async def _listen(self) -> None:
        delay = 1.0
        while True:
            pubsub = None
            try:
                pubsub = self._client().pubsub()
                await pubsub.psubscribe(CHANNEL_PREFIX + "*")
                self.redis_ok = True
                delay = 1.0
                async for message in pubsub.listen():
                    if message.get("type") != "pmessage":
                        continue
                    user_id = str(message.get("channel", ""))[len(CHANNEL_PREFIX):]
                    self._deliver(user_id, message.get("data"))
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # Redis down: keep local delivery, retry.
                self.redis_ok = False
                log.warning("sync redis listener error: %s", exc)
            finally:
                if pubsub is not None:
                    try:
                        await pubsub.aclose()
                    except Exception:
                        pass
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30.0)

    def _deliver(self, user_id: str, data: Any) -> None:
        for queue in list(self.local.get(user_id, ())):
            try:
                queue.put_nowait(data)
            except asyncio.QueueFull:
                try:
                    queue.put_nowait('{"type":"resync_required"}')
                except asyncio.QueueFull:
                    pass

    def register(self, user_id: str) -> asyncio.Queue:
        self.ensure_listener()
        queue: asyncio.Queue = asyncio.Queue(maxsize=200)
        self.local.setdefault(user_id, set()).add(queue)
        return queue

    def unregister(self, user_id: str, queue: asyncio.Queue) -> None:
        bucket = self.local.get(user_id)
        if bucket:
            bucket.discard(queue)
            if not bucket:
                self.local.pop(user_id, None)

    async def publish(self, user_id: str, message: dict) -> None:
        data = orjson.dumps(message).decode()
        try:
            await self._client().publish(CHANNEL_PREFIX + str(user_id), data)
            if self.redis_ok:
                return
        except Exception as exc:
            log.warning("sync publish via redis failed: %s", exc)
        # Fallback: at least reach sockets on this worker.
        self._deliver(str(user_id), data)


hub = SyncHub()


async def publish_change(user_id: str, version: int, state: dict, paths: list[str], client_id: str = "") -> None:
    if not paths:
        return
    try:
        await hub.publish(str(user_id), patch_message(version, state, paths, client_id))
    except Exception as exc:  # Never fail a save because the broadcast failed.
        log.warning("sync broadcast failed: %s", exc)
