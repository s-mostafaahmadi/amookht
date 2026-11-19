"""NVIDIA (integrate.api.nvidia.com, OpenAI-compatible) as the second provider behind Groq (added 2026-11-12, "aifallback").

Keys: one per line in backend/.nvidia_keys (root:amookht 0640; lines may carry a trailing comment). A key that answers
401/403 is skipped for an hour. The provider has its own circuit breaker ("nvidia-<scope>").
"""
from __future__ import annotations

import asyncio
import logging
import pathlib
import time

import httpx

from app.api import ai_guard

log = logging.getLogger(__name__)
URL = "https://integrate.api.nvidia.com/v1/chat/completions"
KEY_FILE = pathlib.Path(__file__).resolve().parents[2] / ".nvidia_keys"
# first model that answers wins; ordered by tested quality/latency for Persian JSON feedback
MODELS = ["nvidia/nemotron-3-ultra-550b-a55b", "mistralai/mistral-large-4-1t-a52b"]  # tested 2026-11-12: 2–5 s; glm-5.3-flash timed out, kimi/nemotron-super not enabled
ATTEMPT = 30.0
_bad: dict[str, float] = {}     # key → skip until
_cache: tuple[float, list[str]] | None = None


def keys() -> list[str]:
    global _cache
    now = time.time()
    try:  # AI-ADMIN: registry decides (disabled → none; managed keys → registry copy)
        from app.api import ai_registry
        if not ai_registry.builtin_enabled("nvidia"):
            return []
        managed = ai_registry.managed_keys("nvidia")
        if managed is not None:
            return [k for k in managed if _bad.get(k, 0) < now]
    except Exception:  # noqa: BLE001
        log.exception("AI registry unavailable for NVIDIA keys")
    if _cache and now - _cache[0] < 60:
        found = _cache[1]
    else:
        try:
            found = [line.split()[0] for line in KEY_FILE.read_text(encoding="utf-8").splitlines() if line.strip().startswith("nvapi-")]
        except OSError:
            found = []
        _cache = (now, found)
    return [k for k in found if _bad.get(k, 0) < now]


def available() -> bool:
    return bool(keys())


async def chat(messages: list[dict], *, max_tokens: int, deadline: ai_guard.Deadline, scope: str, json_mode: bool = False,
               accept=None) -> tuple[str, str] | None:
    """Try NVIDIA models/keys within the deadline. Returns (content, model) or None. `accept(content)` may reject an answer."""
    breaker = "nvidia-" + scope
    if await ai_guard.retry_after(breaker):
        return None
    pool = keys()
    if not pool:
        return None
    statuses: list = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(ATTEMPT, connect=5.0)) as client:
        try:  # AI-ADMIN: model list editable in the owner AI box
            from app.api import ai_registry
            models = ai_registry.builtin_models("nvidia", MODELS)
        except Exception:  # noqa: BLE001
            models = MODELS
        for model in models:
            for key in pool:
                limit = deadline.attempt(ATTEMPT)
                if limit is None:
                    break
                body = {"model": model, "messages": messages, "temperature": 0.2, "max_tokens": max_tokens}
                if json_mode:
                    body["response_format"] = {"type": "json_object"}
                try:
                    r = await asyncio.wait_for(client.post(URL, headers={"Authorization": f"Bearer {key}"}, json=body, timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                    if r.status_code in (401, 403):
                        _bad[key] = time.time() + 3600
                        statuses.append(r.status_code)
                        continue
                    if r.status_code == 400 and json_mode and "response_format" in r.text:
                        body.pop("response_format", None)
                        r = await asyncio.wait_for(client.post(URL, headers={"Authorization": f"Bearer {key}"}, json=body, timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                    r.raise_for_status()
                    content = str(r.json()["choices"][0]["message"].get("content") or "").strip()
                    if content and (accept is None or accept(content)):
                        await ai_guard.record_success(breaker)
                        return content, "nvidia:" + model
                    statuses.append("empty")
                except httpx.HTTPStatusError as exc:
                    statuses.append(exc.response.status_code)
                except (httpx.ConnectError, httpx.ConnectTimeout):
                    statuses.append("connect")
                except (httpx.HTTPError, asyncio.TimeoutError, KeyError, IndexError, ValueError) as exc:
                    statuses.append(type(exc).__name__)
    log.warning("NVIDIA fallback (%s) failed: %s", scope, statuses[-6:])
    if statuses:
        await ai_guard.record_failure(breaker, statuses)
    return None
