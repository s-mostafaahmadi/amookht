"""WebSocket fan-out of account state changes: GET /v1/sync/ws.

Protocol (JSON text frames):
  client -> {"type":"auth","token":<access token>,"client_id":..}   (first frame, within 10 s)
  server -> {"type":"hello","version":N,"server_time":ms}
  server -> {"type":"patch","version":N,"set":{path:value},"unset":[path],"client_id":..,"server_time":ms}
  server -> {"type":"resync","version":N} | {"type":"resync_required"}
  client -> {"type":"ping","t":ms}  server -> {"type":"pong","t":ms,"server_time":ms}
Writes go through PATCH/PUT /v1/account/state; this socket only carries notifications.
"""
from __future__ import annotations

import asyncio
import contextlib

import orjson
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select

from app.api import sync_core
from app.api.routes.account import current_user
from app.domain.models.models import UserAppState
from app.infrastructure.database.connection import get_session_factory

router = APIRouter()
MAX_SOCKETS_PER_USER_PER_WORKER = 24


async def _authenticate(token: str):
    async with get_session_factory()() as db:
        user = await current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials=token), db)
        version = (await db.execute(select(UserAppState.version).where(UserAppState.user_id == user.id))).scalar_one_or_none()
        return user, int(version or 0)


@router.websocket("/ws")
async def sync_socket(ws: WebSocket):
    await ws.accept()
    try:
        first = await asyncio.wait_for(ws.receive_text(), timeout=10)
        message = orjson.loads(first)
        token = message.get("token") if isinstance(message, dict) else None
        if not isinstance(token, str) or not token:
            raise HTTPException(status_code=401)
        user, version = await _authenticate(token)
    except HTTPException:
        await ws.close(code=4401)
        return
    except (asyncio.TimeoutError, WebSocketDisconnect, ValueError, orjson.JSONDecodeError):
        with contextlib.suppress(Exception):
            await ws.close(code=4400)
        return

    user_id = str(user.id)
    if len(sync_core.hub.local.get(user_id, ())) >= MAX_SOCKETS_PER_USER_PER_WORKER:
        await ws.close(code=4429)
        return
    queue = sync_core.hub.register(user_id)
    await ws.send_text(orjson.dumps({"type": "hello", "version": version, "server_time": sync_core.server_ms()}).decode())

    async def pump() -> None:
        while True:
            data = await queue.get()
            await ws.send_text(data if isinstance(data, str) else orjson.dumps(data).decode())

    async def receive() -> None:
        while True:
            raw = await ws.receive_text()
            if len(raw) > 4096:
                continue
            try:
                msg = orjson.loads(raw)
            except orjson.JSONDecodeError:
                continue
            if isinstance(msg, dict) and msg.get("type") == "ping":
                await ws.send_text(orjson.dumps({"type": "pong", "t": msg.get("t"), "server_time": sync_core.server_ms()}).decode())

    tasks = [asyncio.create_task(pump()), asyncio.create_task(receive())]
    try:
        await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    finally:
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(BaseException):
                await task
        sync_core.hub.unregister(user_id, queue)
        with contextlib.suppress(Exception):
            await ws.close()
