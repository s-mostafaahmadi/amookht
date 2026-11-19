"""Central AI provider registry (AI-ADMIN, 2026-11-14).

One owner-managed list of AI providers (Groq, NVIDIA, DeepSeek, any OpenAI-compatible endpoint, local servers such as
Ollama / LM Studio / llama.cpp) stored in backend/data/ai_providers.json (written by the service user, 0640).

* Keys are Fernet-encrypted with a key derived from SECRET_KEY and are never returned raw by the API.
* Built-in providers start in "legacy" key mode: their keys keep coming from the old sources
  (API.txt / AI_KEYS_FILE / .env / backend/.nvidia_keys). Adding or removing a key copies them into the registry
  ("managed" mode); the old files are never modified.
* While the effective route of a feature equals the historic one (Groq → NVIDIA for tutor/method/grammar), the
  original, battle-tested code path of that consumer runs unchanged (`custom_plan()` returns None). Any other route
  (reordered fail-over, custom provider, per-feature routing, local-only mode) goes through `complete()`.
* URLs are validated against SSRF: cloud metadata / link-local / multicast / reserved addresses are always refused,
  private and loopback hosts only for providers explicitly flagged `allow_local`.
"""
from __future__ import annotations

import asyncio
import base64
import copy
import hashlib
import ipaddress
import json
import logging
import os
import pathlib
import re
import socket
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException

from app.api import ai_guard

log = logging.getLogger(__name__)
DATA_FILE = pathlib.Path(__file__).resolve().parents[2] / "data" / "ai_providers.json"
VERSION = 1

FEATURES: dict[str, str] = {
    "tutor": "مربی آلمانی (Study Tutor)",
    "method": "بازخورد برنامه یادگیری",
    "grammar": "ربات تمرین گرامر",
    "owner_agent": "دستیار مالک",
    "translate": "ترجمه (Deutsch Coach و مترجم سایت)",
}
# Historic chains: while a feature's chain is an in-order subset of this, the consumer's own code runs.
LEGACY_CHAIN: dict[str, tuple[str, ...]] = {
    "tutor": ("groq", "nvidia"), "method": ("groq", "nvidia"), "grammar": ("groq", "nvidia"),
    "owner_agent": ("groq", "deepseek"), "translate": ("groq",),
}
# Upper bound for a whole request per feature (the browser gives up a little later: method 70 s, tutor 95 s).
FEATURE_CAP = {"tutor": 88.0, "method": 66.0, "grammar": 60.0, "owner_agent": 170.0, "translate": 55.0}

TYPES: dict[str, dict] = {
    "groq": {"label": "Groq", "base_url": "https://api.groq.com/openai/v1", "local": False},
    "nvidia": {"label": "NVIDIA NIM", "base_url": "https://integrate.api.nvidia.com/v1", "local": False},
    "deepseek": {"label": "DeepSeek", "base_url": "https://api.deepseek.com", "local": False},
    "openai": {"label": "OpenAI", "base_url": "https://api.openai.com/v1", "local": False},
    "openrouter": {"label": "OpenRouter", "base_url": "https://openrouter.ai/api/v1", "local": False},
    "gemini": {"label": "Google Gemini (OpenAI-compatible)", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai", "local": False},
    "openai_compat": {"label": "OpenAI-compatible (دلخواه)", "base_url": "", "local": False},
    "ollama": {"label": "Ollama (محلی)", "base_url": "http://127.0.0.1:11434/v1", "local": True},
    "lmstudio": {"label": "LM Studio (محلی)", "base_url": "http://127.0.0.1:1234/v1", "local": True},
    "llamacpp": {"label": "llama.cpp server (محلی)", "base_url": "http://127.0.0.1:8080/v1", "local": True},
}
BUILTIN = ("groq", "nvidia", "deepseek")
GROQ_DEFAULT_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]
NVIDIA_DEFAULT_MODELS = ["nvidia/nemotron-3-ultra-550b-a55b", "mistralai/mistral-large-4-1t-a52b"]
ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{1,39}$")

# ───────────────────────── encryption ─────────────────────────


def _fernet() -> Fernet:
    from app.config import get_settings
    material = get_settings().SECRET_KEY.encode("utf-8") + b":ai-registry-keys:v1"
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(material).digest()))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode("ascii")


def decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode("ascii")).decode()
    except (InvalidToken, ValueError):
        return ""


def fingerprint(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()[:10]


def mask(key: str) -> str:
    key = key or ""
    if len(key) <= 10:
        return "•" * len(key)
    return key[:4] + "…" + key[-4:]

# ───────────────────────── URL safety (SSRF) ─────────────────────────


_ALWAYS_BLOCKED = [ipaddress.ip_network(n) for n in (
    "169.254.0.0/16", "100.100.100.200/32", "0.0.0.0/8", "224.0.0.0/4", "240.0.0.0/4",
    "fe80::/10", "ff00::/8", "fd00:ec2::254/128", "::/128",
)]
_METADATA_NAMES = {"metadata.google.internal", "metadata", "instance-data", "metadata.azure.internal"}


def _ip_problem(ip: ipaddress._BaseAddress, allow_local: bool) -> str:
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    if any(ip in net for net in _ALWAYS_BLOCKED) or ip.is_multicast or ip.is_unspecified or ip.is_link_local:
        return "آدرس‌های metadata/link-local/multicast مجاز نیستند"
    if ip.is_reserved and not ip.is_private:
        return "آدرس رزرو‌شده مجاز نیست"
    if (ip.is_private or ip.is_loopback or ip in ipaddress.ip_network("100.64.0.0/10")) and not allow_local:
        return "آدرس شبکه داخلی/localhost فقط با تیک «اجازه شبکه محلی» مجاز است"
    return ""


def validate_url(value: str, allow_local: bool) -> str:
    """Static check (scheme, credentials, literal IPs, metadata hosts). Raises ValueError with a Persian message."""
    value = (value or "").strip().rstrip("/")
    if value.endswith("/chat/completions"):
        value = value[: -len("/chat/completions")]
    p = urlparse(value)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise ValueError("آدرس باید با http:// یا https:// شروع شود")
    if p.username or p.password or p.query or p.fragment:
        raise ValueError("آدرس نباید نام کاربری، رمز، ? یا # داشته باشد")
    if p.scheme == "http" and not allow_local:
        raise ValueError("آدرس http فقط برای سرور محلی/تونل (با تیک «اجازه شبکه محلی») مجاز است؛ در غیر این صورت https بزنید")
    host = p.hostname.lower().rstrip(".")
    if host in _METADATA_NAMES or host.endswith(".internal"):
        raise ValueError("این میزبان مجاز نیست")
    if (host == "localhost" or host.endswith(".localhost")) and not allow_local:
        raise ValueError("localhost فقط با تیک «اجازه شبکه محلی» مجاز است")
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    if ip is not None:
        problem = _ip_problem(ip, allow_local)
        if problem:
            raise ValueError(problem)
    if len(value) > 400:
        raise ValueError("آدرس خیلی طولانی است")
    return value


_resolved: dict[tuple[str, bool], tuple[float, str]] = {}


async def check_resolved(url: str, allow_local: bool) -> None:
    """Resolve the host right before a call (cached 5 min) and refuse forbidden targets (DNS rebinding)."""
    p = urlparse(url)
    host = (p.hostname or "").lower()
    key = (host, allow_local)
    hit = _resolved.get(key)
    if hit and time.time() - hit[0] < 300:
        if hit[1]:
            raise ValueError(hit[1])
        return
    problem = ""
    try:
        infos = await asyncio.get_running_loop().getaddrinfo(host, p.port or (443 if p.scheme == "https" else 80), type=socket.SOCK_STREAM)
        for info in infos:
            problem = _ip_problem(ipaddress.ip_address(info[4][0].split("%")[0]), allow_local)
            if problem:
                break
    except (OSError, ValueError):
        problem = ""  # unresolvable: the request itself will fail with a connect error
    _resolved[key] = (time.time(), problem)
    if problem:
        raise ValueError(problem)

# ───────────────────────── storage ─────────────────────────


_cache: dict = {"mtime": None, "data": None, "checked": 0.0}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def default_config() -> dict:
    from app.config import get_settings
    s = get_settings()
    return {
        "version": VERSION, "local_only": False, "updated_at": None,
        "providers": [
            {"id": "groq", "name": "Groq", "type": "groq", "base_url": TYPES["groq"]["base_url"], "models": list(GROQ_DEFAULT_MODELS),
             "enabled": True, "priority": 10, "timeout": 30, "allow_local": False, "key_mode": "legacy", "keys": [],
             "features": ["tutor", "method", "grammar", "owner_agent", "translate"], "json_mode": True, "notes": "", "builtin": True},
            {"id": "nvidia", "name": "NVIDIA", "type": "nvidia", "base_url": TYPES["nvidia"]["base_url"], "models": list(NVIDIA_DEFAULT_MODELS),
             "enabled": True, "priority": 20, "timeout": 30, "allow_local": False, "key_mode": "legacy", "keys": [],
             "features": ["tutor", "method", "grammar"], "json_mode": True, "notes": "", "builtin": True},
            {"id": "deepseek", "name": "DeepSeek", "type": "deepseek", "base_url": TYPES["deepseek"]["base_url"], "models": [s.DEEPSEEK_MODEL or "deepseek-chat"],
             "enabled": True, "priority": 30, "timeout": 60, "allow_local": False, "key_mode": "legacy", "keys": [],
             "features": ["owner_agent"], "json_mode": True, "notes": "", "builtin": True},
        ],
        "routing": {f: {"mode": "auto", "chain": []} for f in FEATURES},
    }


def _normalize(data: dict) -> dict:
    base = default_config()
    if not isinstance(data, dict):
        return base
    out = {"version": VERSION, "local_only": bool(data.get("local_only")), "updated_at": data.get("updated_at"), "providers": [], "routing": {}}
    seen = set()
    for p in data.get("providers") or []:
        if not isinstance(p, dict) or not ID_RE.match(str(p.get("id") or "")) or p["id"] in seen:
            continue
        seen.add(p["id"])
        out["providers"].append(p)
    for b in base["providers"]:  # built-ins always exist
        if b["id"] not in seen:
            out["providers"].append(b)
    routing = data.get("routing") if isinstance(data.get("routing"), dict) else {}
    for f in FEATURES:
        r = routing.get(f) if isinstance(routing.get(f), dict) else {}
        chain = [c for c in (r.get("chain") or []) if isinstance(c, dict) and c.get("id")]
        out["routing"][f] = {"mode": "custom" if r.get("mode") == "custom" and chain else "auto", "chain": chain}
    return out


def load() -> dict:
    """Current config (cached; re-read when the file changes, so both uvicorn workers stay in sync)."""
    now = time.monotonic()
    if _cache["data"] is not None and now - _cache["checked"] < 2:
        return _cache["data"]
    _cache["checked"] = now
    try:
        mtime = DATA_FILE.stat().st_mtime
    except OSError:
        mtime = None
    if mtime != _cache["mtime"] or _cache["data"] is None:
        data = None
        if mtime is not None:
            try:
                data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                log.exception("AI registry: %s unreadable, using defaults", DATA_FILE)
        _cache["data"], _cache["mtime"] = _normalize(data or {}), mtime
    return _cache["data"]


def save(data: dict) -> dict:
    data = _normalize(data)
    data["updated_at"] = _now()
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = DATA_FILE.with_name(DATA_FILE.name + f".tmp{os.getpid()}")
    old_umask = os.umask(0o027)
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        os.chmod(tmp, 0o640)
        if DATA_FILE.exists():  # keep one previous version for manual rollback
            try:
                DATA_FILE.with_name(DATA_FILE.name + ".prev").write_bytes(DATA_FILE.read_bytes())
                os.chmod(DATA_FILE.with_name(DATA_FILE.name + ".prev"), 0o640)
            except OSError:
                pass
        os.replace(tmp, DATA_FILE)
    finally:
        os.umask(old_umask)
    _cache.update(data=None, mtime=None, checked=0.0)
    return load()


def editable() -> dict:
    return copy.deepcopy(load())


def provider(pid: str, data: dict | None = None) -> dict | None:
    return next((p for p in (data or load())["providers"] if p["id"] == pid), None)

# ───────────────────────── keys ─────────────────────────


def legacy_keys(pid: str) -> list[str]:
    """Keys from the historic sources (never raises)."""
    try:
        from app.api.routes import owner_agent_llm as llm
        from app.config import get_settings
        s, file_keys = get_settings(), llm.read_legacy_keys()
        if pid == "groq":
            out: list[str] = []
            for k in (s.GROQ_API_KEY, *file_keys.get("groq", [])):
                if k and k not in out:
                    out.append(k)
            return out
        if pid == "deepseek":
            return [k for k in [s.DEEPSEEK_API_KEY or next(iter(file_keys.get("deepseek", [])), "")] if k]
        if pid == "nvidia":
            from app.api import ai_nvidia
            try:
                found = [line.split()[0] for line in ai_nvidia.KEY_FILE.read_text(encoding="utf-8").splitlines() if line.strip().startswith("nvapi-")]
            except OSError:
                found = []
            for k in (s.NVIDIA_API_KEY, *file_keys.get("nvidia", [])):
                if k and k not in found:
                    found.append(k)
            return found
    except Exception:  # noqa: BLE001
        log.exception("AI registry: legacy keys for %s unreadable", pid)
    return []


def provider_keys(p: dict | str | None, include_disabled: bool = False) -> list[str]:
    """Plain keys of a provider in configured order (legacy sources for built-ins in legacy mode)."""
    if isinstance(p, str):
        p = provider(p)
    if not p:
        return []
    if p.get("key_mode", "managed") == "legacy" and p["id"] in BUILTIN:
        return legacy_keys(p["id"])
    out = []
    for k in p.get("keys") or []:
        if not include_disabled and k.get("enabled") is False:
            continue
        plain = decrypt(k.get("enc") or "")
        if plain and plain not in out:
            out.append(plain)
    return out


def managed_keys(pid: str) -> list[str] | None:
    """Registry keys of a built-in in managed mode; None while it still reads the old key files."""
    p = provider(pid)
    if not p or p.get("key_mode", "legacy") == "legacy":
        return None
    return provider_keys(p)


def materialize_keys(p: dict) -> None:
    """Switch a built-in from legacy to managed keys by copying the legacy keys (files stay untouched)."""
    if p.get("key_mode") == "legacy":
        p["keys"] = [{"id": uuid.uuid4().hex[:10], "enc": encrypt(k), "fp": fingerprint(k), "mask": mask(k), "label": "از فایل قبلی", "enabled": True, "added": _now()} for k in legacy_keys(p["id"])]
        p["key_mode"] = "managed"


def builtin_enabled(pid: str) -> bool:
    p = provider(pid)
    return bool(p and p.get("enabled", True))


def builtin_models(pid: str, default: list[str] | tuple[str, ...]) -> list[str]:
    p = provider(pid)
    models = [m for m in (p or {}).get("models") or [] if m]
    return models or list(default)

# ───────────────────────── routing ─────────────────────────


def is_local(p: dict) -> bool:
    return bool(p.get("allow_local")) or bool(TYPES.get(p.get("type"), {}).get("local"))


def chain(feature: str, data: dict | None = None) -> list[dict]:
    """Effective ordered route list [{provider, model|None}] for a feature."""
    data = data or load()
    by_id = {p["id"]: p for p in data["providers"]}
    r = data["routing"].get(feature) or {"mode": "auto", "chain": []}
    if r["mode"] == "custom":
        items = [{"provider": by_id[c["id"]], "model": c.get("model") or None} for c in r["chain"] if c["id"] in by_id and by_id[c["id"]].get("enabled", True)]
    else:
        ps = sorted((p for p in data["providers"] if p.get("enabled", True) and feature in (p.get("features") or [])), key=lambda p: (p.get("priority", 100), p["id"]))
        items = [{"provider": p, "model": None} for p in ps]
    if data.get("local_only"):
        items = [i for i in items if is_local(i["provider"])]
        if not items:  # local-only mode: any enabled local provider serves every feature
            ps = sorted((p for p in data["providers"] if p.get("enabled", True) and is_local(p)), key=lambda p: (p.get("priority", 100), p["id"]))
            items = [{"provider": p, "model": None} for p in ps]
    return items


def _default_models(pid: str) -> list[str]:
    return {"groq": GROQ_DEFAULT_MODELS, "nvidia": NVIDIA_DEFAULT_MODELS}.get(pid, [])


def is_legacy(feature: str, data: dict | None = None) -> bool:
    data = data or load()
    if data.get("local_only"):
        return False
    items = chain(feature, data)
    ids = [i["provider"]["id"] for i in items]
    if ids != list(LEGACY_CHAIN.get(feature, ())) or any(i["model"] for i in items):
        return False
    groq = provider("groq", data)
    if groq and list(groq.get("models") or []) != GROQ_DEFAULT_MODELS:
        return False  # the consumers hard-code the historic Groq model list
    return True


def custom_plan(feature: str) -> list[dict] | None:
    """None → the consumer's own (historic) code runs. Otherwise the route list for `complete()`."""
    try:
        if is_legacy(feature):
            return None
        return chain(feature)
    except Exception:  # noqa: BLE001 - the registry must never break the site
        log.exception("AI registry: routing for %s failed, using the historic path", feature)
        return None

# ───────────────────────── usage counters ─────────────────────────


async def count(pid: str, field: str, n: int = 1) -> None:
    try:
        r = ai_guard._client()
        key = ai_guard.PREFIX + "usage:" + datetime.now(timezone.utc).strftime("%Y%m%d")
        await r.hincrby(key, f"{pid}|{field}", int(n))
        await r.expire(key, 40 * 86400)
    except Exception:  # noqa: BLE001
        pass


async def usage(days: int = 7) -> dict:
    out: dict[str, dict] = {}
    try:
        r = ai_guard._client()
        today = datetime.now(timezone.utc)
        for d in range(days):
            day = (today - timedelta(days=d)).strftime("%Y%m%d")
            raw = await r.hgetall(ai_guard.PREFIX + "usage:" + day)
            for k, v in (raw or {}).items():
                pid, _, field = k.partition("|")
                slot = out.setdefault(pid, {"today": {}, "week": {}})
                slot["week"][field] = slot["week"].get(field, 0) + int(v)
                if d == 0:
                    slot["today"][field] = slot["today"].get(field, 0) + int(v)
    except Exception:  # noqa: BLE001
        pass
    return out


def breaker_provider(name: str) -> str:
    """Map a circuit-breaker name to a provider id (groq-tutor → groq, reg-ollama-tutor → ollama)."""
    if name.startswith("reg-"):
        return name[4:].rsplit("-", 1)[0]
    return name.split("-", 1)[0]

# ───────────────────────── generic OpenAI-compatible engine ─────────────────────────


_bad_keys: dict[str, float] = {}
_cursor = 0


def chat_url(p: dict) -> str:
    return (p.get("base_url") or "").rstrip("/") + "/chat/completions"


def _extra_for(p: dict, model: str, effort: str) -> dict:
    if p.get("type") == "groq":
        if model.startswith("openai/gpt-oss"):
            return {"reasoning_effort": effort}
        if model.startswith("qwen/"):
            return {"reasoning_format": "hidden"}
    return {}


def _status(exc: Exception):
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code
    if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout)):
        return "connect"
    if isinstance(exc, (httpx.TimeoutException, asyncio.TimeoutError)):
        return "timeout"
    return type(exc).__name__


async def call_once(client: httpx.AsyncClient, p: dict, key: str, model: str, messages: list[dict], *, max_tokens: int,
                    timeout: float, json_mode: bool = False, temperature: float = 0.2, effort: str = "low") -> tuple[str, dict]:
    """One chat completion. Returns (content, usage). Raises httpx errors / asyncio.TimeoutError / ValueError."""
    url = chat_url(p)
    await check_resolved(url, bool(p.get("allow_local")))
    body = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": int(max_tokens), **_extra_for(p, model, effort)}
    use_json = json_mode and p.get("json_mode", True)
    if use_json:
        body["response_format"] = {"type": "json_object"}
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    to = httpx.Timeout(timeout, connect=min(8.0, timeout))
    r = await asyncio.wait_for(client.post(url, headers=headers, json=body, timeout=to), timeout + 2)
    if r.status_code in (400, 422) and use_json and ("response_format" in r.text or "json" in r.text.lower()):
        body.pop("response_format", None)  # e.g. LM Studio only knows json_schema
        r = await asyncio.wait_for(client.post(url, headers=headers, json=body, timeout=to), timeout + 2)
    r.raise_for_status()
    data = r.json()
    msg = data["choices"][0]["message"]
    content = str(msg.get("content") or "").strip()
    content = re.sub(r"^<think>.*?</think>\s*", "", content, flags=re.S)  # local reasoning models
    return content, data.get("usage") or {}


async def complete(feature: str, routes: list[dict], messages: list[dict], *, max_tokens: int, budget: float,
                   json_mode: bool = False, accept=None, temperature: float = 0.2, effort: str = "low",
                   busy_message: str = "AI is temporarily unavailable") -> tuple[str, str]:
    """Walk the route list (provider × model × key) inside one deadline. Returns (content, "provider:model").
    `accept(content)` may reject an answer (wrong language / invalid JSON); the first rejected answer is kept as a
    last resort only when accept returns the string "soft"."""
    global _cursor
    if not routes:
        raise ai_guard.unavailable(60, "No AI provider is enabled for this feature" + (" (local-only mode)" if load().get("local_only") else ""))
    slow = max(float(i["provider"].get("timeout") or 30) for i in routes[:1])
    deadline = ai_guard.Deadline(min(max(budget, slow + 5), FEATURE_CAP.get(feature, budget)))
    failures: list[str] = []
    soft: tuple[str, str] | None = None
    waits: list[int] = []
    async with httpx.AsyncClient(follow_redirects=False) as client:
        for idx, item in enumerate(routes):
            p = item["provider"]
            breaker = f"reg-{p['id']}-{feature}"
            wait = await ai_guard.retry_after(breaker)
            if wait:
                waits.append(wait)
                failures.append(f"{p['id']}:down")
                continue
            keys = provider_keys(p) or ([""] if is_local(p) or p.get("type") in ("ollama", "lmstudio", "llamacpp") else [])
            keys = [k for k in keys if _bad_keys.get(fingerprint(k) if k else "", 0) < time.time()] or keys[:1]
            if not keys:
                failures.append(f"{p['id']}:nokey")
                continue
            _cursor += 1
            shift = _cursor % len(keys)
            keys = keys[shift:] + keys[:shift]
            models = [item["model"]] if item.get("model") else [m for m in (p.get("models") or []) if m]
            if not models:
                failures.append(f"{p['id']}:nomodel")
                continue
            # share the budget: later routes keep at least a third of what is left
            route_deadline = ai_guard.Deadline(deadline.left() * (0.67 if idx < len(routes) - 1 else 1.0))
            statuses: list = []
            mt = min(max_tokens, int(p.get("max_tokens") or 2048)) if is_local(p) else max_tokens  # small local context windows
            for model in models:
                for key in keys[:6]:
                    limit = route_deadline.attempt(float(p.get("timeout") or 30))
                    if limit is None:
                        break
                    started = time.monotonic()
                    try:
                        content, use = await call_once(client, p, key, model, messages, max_tokens=mt, timeout=limit,
                                                       json_mode=json_mode, temperature=temperature, effort=effort)
                    except ValueError as exc:  # SSRF guard / bad JSON body
                        statuses.append("blocked" if "مجاز" in str(exc) else "ValueError")
                        failures.append(f"{p['id']}:{statuses[-1]}")
                        break
                    except (httpx.HTTPError, asyncio.TimeoutError, KeyError, IndexError) as exc:
                        st = _status(exc)
                        statuses.append(st)
                        failures.append(f"{p['id']}/{model.split('/')[-1]}:{st}")
                        if st in (401, 403) and key:
                            _bad_keys[fingerprint(key)] = time.time() + 3600
                        if st in (400, 404, 422):
                            break  # model not served here → next model
                        continue
                    await count(p["id"], "calls")
                    if use:
                        await count(p["id"], "tokens", int(use.get("total_tokens") or 0))
                    verdict = True if accept is None else accept(content)
                    if content and verdict and verdict != "soft":
                        await ai_guard.record_success(breaker)
                        await count(p["id"], "ok")
                        log.info("AI %s via %s/%s %.1fs", feature, p["id"], model, time.monotonic() - started)
                        return content, f"{p['id']}:{model}"
                    if content and verdict == "soft" and soft is None:
                        soft = (content, f"{p['id']}:{model}")
                    statuses.append("rejected" if content else "empty")
                    failures.append(f"{p['id']}:{statuses[-1]}")
                    break
                if route_deadline.attempt(5) is None:
                    break
            if statuses:
                await count(p["id"], "fail")
                await ai_guard.record_failure(breaker, statuses)
            if deadline.attempt(5) is None:
                break
    if soft:
        return soft
    log.warning("AI %s failed on every route: %s", feature, ", ".join(failures[-8:]))
    raise ai_guard.unavailable(min(waits) if waits else 45, busy_message + " (" + ", ".join(failures[-4:]) + ")")

# ───────────────────────── owner-agent adapter ─────────────────────────


def agent_providers() -> list[dict]:
    """Providers in the shape owner_ai_chat expects (id, name, key, keys, model, models, url, builtin, enabled, auto)."""
    data = load()
    auto_ids = [i["provider"]["id"] for i in chain("owner_agent", data)]
    order = {pid: n for n, pid in enumerate(auto_ids)}
    out = []
    for p in sorted(data["providers"], key=lambda p: (order.get(p["id"], 999), p.get("priority", 100))):
        keys = provider_keys(p) or ([""] if is_local(p) else [])
        if not keys:
            continue
        models = [m for m in p.get("models") or [] if m]
        if not models:
            continue
        pid = "builtin:" + p["id"] if p["id"] in BUILTIN else "reg:" + p["id"]
        out.append({"id": pid, "name": p.get("name") or p["id"], "keys": keys, "key": keys[0], "model": models[0], "models": models,
                    "url": chat_url(p), "builtin": p["id"] in BUILTIN, "enabled": bool(p.get("enabled", True)), "auto": p["id"] in order,
                    "registry": True, "allow_local": bool(p.get("allow_local"))})
    return out
