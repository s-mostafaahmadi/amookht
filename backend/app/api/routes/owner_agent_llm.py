"""Shared model access for the owner agent: key loading, Groq/DeepSeek chat calls (native tools or JSON mode)."""
from __future__ import annotations

import asyncio
import hashlib
import itertools
import json
import logging
import re
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import get_settings

log = logging.getLogger("amookht.owner_agent")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
# Current Groq models (the old llama-3.3 default produced truncated or mixed JSON for large tool calls).
AGENT_MODELS = ("openai/gpt-oss-120b", "qwen/qwen3.8-27b")
GEN_MODELS = ("openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b")
RESERVED_KEYS = 2  # the last Groq keys are not used by the content pipeline; user-facing calls try them first
REQUEST_TOKEN_LIMIT = 7600  # every Groq key of this account allows 8000 tokens per request and per minute (prompt + completion)


def estimate_tokens(text: str) -> int:
    """Conservative token estimate for mixed German/Persian/JSON text."""
    return int(len(text) / 2.5) + 40
SMALL_KEYS: set[str] = set()  # fingerprints of keys whose per-request ceiling is 8k tokens (HTTP 413 seen)
_cursor = itertools.count()


class ProviderError(Exception):
    def __init__(self, status: int, detail: str = ""):
        super().__init__(f"{status}: {detail[:200]}")
        self.status = status
        self.detail = detail


def fingerprint(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()[:12]


def read_legacy_keys() -> dict[str, list[str]]:
    """Parse the plain-text key file. Never raises: an unreadable file means 'no keys from the file'."""
    settings = get_settings()
    candidates = [Path(settings.AI_KEYS_FILE).expanduser()] if settings.AI_KEYS_FILE else []
    here = Path(__file__).resolve()
    backend_dir = next((p for p in here.parents if p.name == "backend" and (p / "app").is_dir()), Path("/opt/amookht/app/backend"))
    candidates.extend((backend_dir.parent / "API.txt", backend_dir / "API.txt"))
    result: dict[str, list[str]] = {}

    def add(provider: str, key: str) -> None:
        values = result.setdefault(provider, [])
        if key and key not in values:
            values.append(key)

    for path in candidates:
        try:
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8-sig")
        except OSError:
            log.exception("Owner agent: key file %s is not readable", path)
            continue
        pending: str | None = None
        for raw in text.splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            direct = re.match(r"^(GROQ|NVIDIA|DEEPSEEK)(?:_API_KEY)?\s*=\s*(\S+)$", line, re.I)
            if direct:
                add(direct.group(1).lower(), direct.group(2).strip())
                pending = None
                continue
            heading = re.match(r"^(GROQ|NVIDIA|DEEPSEEK)\s+API(?:\s+(?:SERVER\s+)?\d+|\s*\([^)]{1,160}\))?\s*:?$", line, re.I)
            if heading:
                pending = heading.group(1).lower()
                continue
            if pending and len(line) >= 20 and not any(char.isspace() for char in line):
                add(pending, line)
                pending = None
        break
    return result


def groq_keys_in_file_order() -> list[str]:
    """Keys as configured (settings key first, then the key file). Other modules rely on this order (last 2 = reserved)."""
    try:  # AI-ADMIN: keys managed in the owner AI box win over the files
        from app.api import ai_registry
        managed = ai_registry.managed_keys("groq")
        if managed is not None:
            return managed
    except Exception:  # noqa: BLE001
        log.exception("AI registry unavailable for Groq keys")
    settings, legacy = get_settings(), read_legacy_keys()
    keys: list[str] = []
    for key in (settings.GROQ_API_KEY, *legacy.get("groq", [])):
        if key and key not in keys:
            keys.append(key)
    return keys


def groq_keys() -> list[str]:
    """Order for owner-agent calls: reserved keys first, shared keys rotated, known 8k-limited keys last."""
    keys = groq_keys_in_file_order()
    if len(keys) <= RESERVED_KEYS:
        return keys
    shared = keys[:-RESERVED_KEYS]
    shift = next(_cursor) % len(shared)
    ordered = keys[-RESERVED_KEYS:] + shared[shift:] + shared[:shift]
    # keys with an 8k per-request ceiling go last: agent prompts with tools rarely fit there
    return [k for k in ordered if fingerprint(k) not in SMALL_KEYS] + [k for k in ordered if fingerprint(k) in SMALL_KEYS]


def _managed_first(pid: str) -> str | None:  # AI-ADMIN
    try:
        from app.api import ai_registry
        managed = ai_registry.managed_keys(pid)
        return None if managed is None else next(iter(managed), "")
    except Exception:  # noqa: BLE001
        return None


def deepseek_key() -> str:
    if (k := _managed_first("deepseek")) is not None:
        return k
    settings = get_settings()
    return settings.DEEPSEEK_API_KEY or next(iter(read_legacy_keys().get("deepseek", [])), "")


def nvidia_key() -> str:
    if (k := _managed_first("nvidia")) is not None:
        return k
    settings = get_settings()
    return settings.NVIDIA_API_KEY or next(iter(read_legacy_keys().get("nvidia", [])), "")


def parse_json_object(content: str) -> dict | None:
    candidate = (content or "").strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*|\s*```$", "", candidate, flags=re.I | re.S).strip()
    try:
        data = json.loads(candidate)
    except (json.JSONDecodeError, TypeError):
        start = candidate.find("{")
        if start < 0:
            return None
        try:
            data, _ = json.JSONDecoder().raw_decode(candidate[start:])
        except (json.JSONDecodeError, TypeError):
            return None
    return data if isinstance(data, dict) else None


async def chat_once(client: httpx.AsyncClient, *, url: str, key: str, model: str, messages: list[dict], tools: list[dict] | None = None,
                    tool_choice: str = "auto", json_mode: bool = False, max_tokens: int = 4000, temperature: float = 0.3,
                    reasoning: str = "medium") -> dict:
    body: dict[str, Any] = {"model": model, "messages": messages, "temperature": temperature}
    if url == GROQ_URL:
        body["max_completion_tokens"] = max_tokens
        if model.startswith("openai/gpt-oss"):
            body["reasoning_effort"] = reasoning
        elif model.startswith("qwen/"):
            body["reasoning_format"] = "hidden"
    else:
        body["max_tokens"] = max_tokens
    if tools:
        body["tools"] = tools
        body["tool_choice"] = tool_choice
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    response = await client.post(url, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, json=body)
    if response.status_code >= 400:
        raise ProviderError(response.status_code, response.text[:600])
    try:
        message = response.json()["choices"][0]["message"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise ProviderError(502, "malformed provider response") from exc
    if not isinstance(message, dict):
        raise ProviderError(502, "malformed provider response")
    return message


async def generate_json(prompt: str, *, system: str | None = None, max_tokens: int = 6000, temperature: float = 0.5,
                        reasoning: str = "low", timeout: float = 100.0, validate=None) -> dict:
    """One JSON object from Groq (reserved keys first, then rotation, then smaller models). `validate(data)` may raise ValueError."""
    keys = groq_keys()
    if not keys:
        raise HTTPException(status_code=503, detail="No AI provider configured")
    messages = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
    max_tokens = max(800, min(max_tokens, REQUEST_TOKEN_LIMIT - estimate_tokens((system or "") + prompt)))
    failures: list[str] = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout, connect=8.0)) as client:
        for model in GEN_MODELS:
            for key in keys[:5]:
                small = fingerprint(key) in SMALL_KEYS
                try:
                    message = await chat_once(client, url=GROQ_URL, key=key, model=model, messages=messages, json_mode=True,
                                              max_tokens=max(800, max_tokens - 600) if small else max_tokens, temperature=temperature,
                                              reasoning="low" if small else reasoning)
                except ProviderError as exc:
                    if exc.status == 413:
                        SMALL_KEYS.add(fingerprint(key))
                    failures.append(f"{model}:{exc.status}")
                    if exc.status == 429:
                        await asyncio.sleep(0.4)
                    continue
                except httpx.HTTPError as exc:
                    failures.append(f"{model}:{type(exc).__name__}")
                    continue
                data = parse_json_object(str(message.get("content") or ""))
                if data is None:
                    failures.append(f"{model}:invalid-json")
                    continue
                if validate is not None:
                    try:
                        validate(data)
                    except ValueError as exc:
                        failures.append(f"{model}:invalid({str(exc)[:60]})")
                        continue
                return data
    raise HTTPException(status_code=502, detail="AI generation unavailable (" + ", ".join(failures[-5:]) + ")")
