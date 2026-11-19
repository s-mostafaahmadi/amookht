"""Owner AI control box (AI-ADMIN, 2026-11-14): manage providers, keys, models, fail-over order, per-feature routing,
local-only mode, circuit breakers, usage counters, import of legacy keys and config export/import.

Every endpoint is owner-only and never returns a raw key. `relay_router` serves the Deutsch Coach (localhost only)."""
from __future__ import annotations

import time
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.api import ai_guard, ai_registry as reg
from app.api.access import require_owner, require_premium
from app.api.middleware.auth import get_current_user
from app.domain.models.models import User

router = APIRouter()
relay_router = APIRouter()


def _owner(user: User = Depends(get_current_user)) -> User:
    require_owner(user)
    return user


def _bad(msg: str, code: int = 400) -> HTTPException:
    return HTTPException(status_code=code, detail=msg)

# ───────────────────────── views ─────────────────────────


def _public(p: dict) -> dict:
    legacy = p.get("key_mode") == "legacy" and p["id"] in reg.BUILTIN
    if legacy:
        keys = [{"id": "legacy-%d" % n, "mask": reg.mask(k), "label": "فایل قدیمی (API.txt / .env / .nvidia_keys)", "enabled": True, "legacy": True}
                for n, k in enumerate(reg.legacy_keys(p["id"]))]
    else:
        keys = [{"id": k.get("id"), "mask": k.get("mask") or "•••", "label": k.get("label") or "", "enabled": k.get("enabled", True) is not False,
                 "added": k.get("added")} for k in p.get("keys") or []]
    t = reg.TYPES.get(p.get("type"), {})
    return {"id": p["id"], "name": p.get("name") or p["id"], "type": p.get("type"), "type_label": t.get("label", p.get("type")),
            "base_url": p.get("base_url") or "", "models": list(p.get("models") or []), "enabled": bool(p.get("enabled", True)),
            "priority": int(p.get("priority", 100)), "timeout": int(p.get("timeout") or 30), "max_tokens": int(p.get("max_tokens") or 2048), "allow_local": bool(p.get("allow_local")),
            "local": reg.is_local(p), "json_mode": bool(p.get("json_mode", True)), "features": list(p.get("features") or []),
            "builtin": p["id"] in reg.BUILTIN, "key_mode": "legacy" if legacy else "managed", "keys": keys, "notes": p.get("notes") or ""}


async def _breakers() -> list[dict]:
    out = []
    names: set[str] = set()
    try:
        async for key in ai_guard._client().scan_iter(match=ai_guard.PREFIX + "down:*", count=200):
            names.add(key[len(ai_guard.PREFIX + "down:"):])
        for name in sorted(names):
            ttl = await ai_guard._client().ttl(ai_guard.PREFIX + "down:" + name)
            reason = await ai_guard._client().get(ai_guard.PREFIX + "down:" + name)
            if ttl and ttl > 0:
                out.append({"name": name, "provider": reg.breaker_provider(name), "retry_after": int(ttl), "reason": reason or ""})
    except Exception:  # noqa: BLE001 - Redis down: show the in-process view
        now = time.time()
        out = [{"name": n, "provider": reg.breaker_provider(n), "retry_after": int(t - now) + 1, "reason": "local"} for n, t in ai_guard._local.items() if t > now]
    return out


@router.get("/state")
async def state(user: User = Depends(_owner)) -> dict:
    data = reg.load()
    features = {}
    for f, label in reg.FEATURES.items():
        items = reg.chain(f, data)
        features[f] = {"label": label, "mode": data["routing"][f]["mode"], "custom": data["routing"][f]["chain"],
                       "effective": [{"id": i["provider"]["id"], "name": i["provider"].get("name"), "model": i["model"] or (i["provider"].get("models") or [""])[0]} for i in items],
                       "path": "legacy" if (f != "owner_agent" and reg.is_legacy(f, data)) else "registry"}
    return {"local_only": bool(data.get("local_only")), "updated_at": data.get("updated_at"),
            "providers": [_public(p) for p in sorted(data["providers"], key=lambda p: (p.get("priority", 100), p["id"]))],
            "features": features, "types": {k: {"label": v["label"], "base_url": v["base_url"], "local": v["local"]} for k, v in reg.TYPES.items()},
            "breakers": await _breakers(), "usage": await reg.usage(7)}

# ───────────────────────── providers ─────────────────────────


class ProviderIn(BaseModel):
    id: str | None = Field(default=None, max_length=40)
    name: str = Field(min_length=1, max_length=60)
    type: str = Field(max_length=30)
    base_url: str = Field(default="", max_length=400)
    models: list[str] = Field(default_factory=list, max_length=20)
    enabled: bool = True
    timeout: int = Field(default=30, ge=5, le=300)
    max_tokens: int = Field(default=2048, ge=256, le=32000)
    allow_local: bool = False
    json_mode: bool = True
    features: list[str] = Field(default_factory=list, max_length=10)
    notes: str = Field(default="", max_length=300)
    api_key: str | None = Field(default=None, max_length=1000)

    @field_validator("models")
    @classmethod
    def clean_models(cls, v: list[str]) -> list[str]:
        out = []
        for m in v:
            m = str(m).strip()[:160]
            if m and m not in out:
                out.append(m)
        return out

    @field_validator("features")
    @classmethod
    def clean_features(cls, v: list[str]) -> list[str]:
        return [f for f in dict.fromkeys(v) if f in reg.FEATURES]


class ProviderPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    base_url: str | None = Field(default=None, max_length=400)
    models: list[str] | None = Field(default=None, max_length=20)
    enabled: bool | None = None
    timeout: int | None = Field(default=None, ge=5, le=300)
    max_tokens: int | None = Field(default=None, ge=256, le=32000)
    allow_local: bool | None = None
    json_mode: bool | None = None
    features: list[str] | None = Field(default=None, max_length=10)
    notes: str | None = Field(default=None, max_length=300)

    @field_validator("models")
    @classmethod
    def clean_models(cls, v: list[str] | None) -> list[str] | None:
        return None if v is None else list(dict.fromkeys(m for m in (str(x).strip()[:160] for x in v) if m))

    @field_validator("features")
    @classmethod
    def clean_features(cls, v: list[str] | None) -> list[str] | None:
        return None if v is None else [f for f in dict.fromkeys(v) if f in reg.FEATURES]


def _check_url(url: str, allow_local: bool) -> str:
    try:
        return reg.validate_url(url, allow_local)
    except ValueError as exc:
        raise _bad(str(exc)) from exc


def _new_key(plain: str, label: str = "") -> dict:
    plain = plain.strip()
    if len(plain) < 6 or any(ch.isspace() for ch in plain):
        raise _bad("کلید نامعتبر است")
    return {"id": uuid.uuid4().hex[:10], "enc": reg.encrypt(plain), "fp": reg.fingerprint(plain), "mask": reg.mask(plain),
            "label": label[:60], "enabled": True, "added": reg._now()}


@router.post("/providers", status_code=201)
async def create_provider(payload: ProviderIn, user: User = Depends(_owner)) -> dict:
    if payload.type not in reg.TYPES:
        raise _bad("نوع ارائه‌دهنده ناشناخته است")
    data = reg.editable()
    pid = (payload.id or "").strip().lower() or (payload.type + "-" + uuid.uuid4().hex[:5])
    if not reg.ID_RE.match(pid) or reg.provider(pid, data):
        raise _bad("شناسه تکراری یا نامعتبر است")
    allow_local = payload.allow_local or reg.TYPES[payload.type]["local"]
    url = _check_url(payload.base_url or reg.TYPES[payload.type]["base_url"], allow_local)
    if not payload.models:
        raise _bad("حداقل یک مدل وارد کنید")
    item = {"id": pid, "name": payload.name.strip(), "type": payload.type, "base_url": url, "models": payload.models, "enabled": payload.enabled,
            "priority": max([p.get("priority", 100) for p in data["providers"]] + [0]) + 10, "timeout": payload.timeout, "max_tokens": payload.max_tokens, "allow_local": allow_local,
            "key_mode": "managed", "keys": [_new_key(payload.api_key)] if payload.api_key else [], "features": payload.features,
            "json_mode": payload.json_mode, "notes": payload.notes, "builtin": False}
    data["providers"].append(item)
    reg.save(data)
    return _public(reg.provider(pid))


@router.patch("/providers/{pid}")
async def update_provider(pid: str, payload: ProviderPatch, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    p = reg.provider(pid, data)
    if not p:
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    changes = payload.model_dump(exclude_unset=True)
    allow_local = changes.get("allow_local", p.get("allow_local", False))
    if "base_url" in changes or "allow_local" in changes:
        p["base_url"] = _check_url(changes.get("base_url", p.get("base_url")), bool(allow_local))
        p["allow_local"] = bool(allow_local)
    for f in ("name", "enabled", "timeout", "max_tokens", "json_mode", "features", "notes"):
        if f in changes and changes[f] is not None:
            p[f] = changes[f]
    if changes.get("models") is not None:
        if not changes["models"]:
            raise _bad("حداقل یک مدل لازم است")
        p["models"] = changes["models"]
    reg.save(data)
    return _public(reg.provider(pid))


@router.delete("/providers/{pid}", status_code=204)
async def delete_provider(pid: str, user: User = Depends(_owner)) -> None:
    if pid in reg.BUILTIN:
        raise _bad("ارائه‌دهنده‌های داخلی حذف نمی‌شوند؛ غیرفعالش کنید یا «بازگشت به کلیدهای فایل» بزنید")
    data = reg.editable()
    if not reg.provider(pid, data):
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    data["providers"] = [p for p in data["providers"] if p["id"] != pid]
    for r in data["routing"].values():
        r["chain"] = [c for c in r.get("chain") or [] if c.get("id") != pid]
    reg.save(data)


class OrderIn(BaseModel):
    ids: list[str] = Field(min_length=1, max_length=50)


@router.post("/providers/order")
async def reorder(payload: OrderIn, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    rank = {pid: n for n, pid in enumerate(payload.ids)}
    for p in data["providers"]:
        p["priority"] = (rank.get(p["id"], len(rank) + 5) + 1) * 10
    reg.save(data)
    return await state(user)


class KeyIn(BaseModel):
    api_key: str = Field(min_length=6, max_length=1000)
    label: str = Field(default="", max_length=60)


@router.post("/providers/{pid}/keys", status_code=201)
async def add_key(pid: str, payload: KeyIn, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    p = reg.provider(pid, data)
    if not p:
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    reg.materialize_keys(p)
    key = _new_key(payload.api_key, payload.label)
    if any(k.get("fp") == key["fp"] for k in p.get("keys") or []):
        raise _bad("این کلید قبلاً ثبت شده است", 409)
    p.setdefault("keys", []).append(key)
    reg.save(data)
    return _public(reg.provider(pid))


class KeyPatch(BaseModel):
    enabled: bool | None = None
    label: str | None = Field(default=None, max_length=60)


def _managed_key(data: dict, pid: str, kid: str) -> tuple[dict, dict | None]:
    p = reg.provider(pid, data)
    if not p:
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    if p.get("key_mode") == "legacy" and kid.startswith("legacy-"):
        n = int(kid.split("-", 1)[1])
        legacy = reg.legacy_keys(pid)
        reg.materialize_keys(p)
        fp = reg.fingerprint(legacy[n]) if n < len(legacy) else ""
        return p, next((k for k in p["keys"] if k.get("fp") == fp), None)
    return p, next((k for k in p.get("keys") or [] if k.get("id") == kid), None)


@router.patch("/providers/{pid}/keys/{kid}")
async def update_key(pid: str, kid: str, payload: KeyPatch, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    p, k = _managed_key(data, pid, kid)
    if not k:
        raise _bad("کلید پیدا نشد", 404)
    if payload.enabled is not None:
        k["enabled"] = payload.enabled
    if payload.label is not None:
        k["label"] = payload.label
    reg.save(data)
    return _public(reg.provider(pid))


@router.delete("/providers/{pid}/keys/{kid}")
async def delete_key(pid: str, kid: str, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    p, k = _managed_key(data, pid, kid)
    if not k:
        raise _bad("کلید پیدا نشد", 404)
    p["keys"] = [x for x in p["keys"] if x is not k]
    reg.save(data)
    return _public(reg.provider(pid))


@router.post("/providers/{pid}/reset-keys")
async def reset_keys(pid: str, user: User = Depends(_owner)) -> dict:
    """Built-ins only: drop the registry copy and read the old key files again."""
    if pid not in reg.BUILTIN:
        raise _bad("فقط برای ارائه‌دهنده‌های داخلی")
    data = reg.editable()
    p = reg.provider(pid, data)
    p["keys"], p["key_mode"] = [], "legacy"
    reg.save(data)
    return _public(reg.provider(pid))

# ───────────────────────── test / discover ─────────────────────────


class TestIn(BaseModel):
    model: str | None = Field(default=None, max_length=160)
    all_keys: bool = False
    prompt: str = Field(default="Antworte nur mit einem kurzen deutschen Satz: Verbindung OK.", max_length=400)


@router.post("/providers/{pid}/test")
async def test_provider(pid: str, payload: TestIn, user: User = Depends(_owner)) -> dict:
    p = reg.provider(pid)
    if not p:
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    model = payload.model or (p.get("models") or [""])[0]
    if not model:
        raise _bad("مدلی تعریف نشده است")
    keys = reg.provider_keys(p) or ([""] if reg.is_local(p) else [])
    if not keys:
        return {"ok": False, "results": [{"key": "—", "ok": False, "error": "هیچ کلید فعالی ثبت نشده"}]}
    results = []
    async with httpx.AsyncClient(follow_redirects=False) as client:
        for key in keys[: (10 if payload.all_keys else 1)]:
            started = time.monotonic()
            try:
                content, use = await reg.call_once(client, p, key, model, [{"role": "user", "content": payload.prompt}], max_tokens=300,
                                                   timeout=float(min(int(p.get("timeout") or 30), 90)), effort="low")
                results.append({"key": reg.mask(key) if key else "بدون کلید", "ok": bool(content), "latency_ms": round((time.monotonic() - started) * 1000),
                                "reply": content[:300], "tokens": int(use.get("total_tokens") or 0)})
                await reg.count(pid, "tests")
            except ValueError as exc:
                results.append({"key": reg.mask(key) if key else "بدون کلید", "ok": False, "error": str(exc)[:200]})
                break
            except httpx.HTTPStatusError as exc:
                hint = {401: "کلید نامعتبر", 403: "دسترسی ندارد", 404: "مدل/آدرس پیدا نشد", 429: "محدودیت سهمیه (rate limit)", 413: "درخواست بزرگ"}.get(exc.response.status_code, "")
                results.append({"key": reg.mask(key) if key else "بدون کلید", "ok": False, "status": exc.response.status_code,
                                "latency_ms": round((time.monotonic() - started) * 1000), "error": (hint + " · " if hint else "") + exc.response.text[:160]})
            except Exception as exc:  # noqa: BLE001
                results.append({"key": reg.mask(key) if key else "بدون کلید", "ok": False, "latency_ms": round((time.monotonic() - started) * 1000),
                                "error": {"ConnectError": "اتصال برقرار نشد (آدرس/تونل را بررسی کنید)", "ConnectTimeout": "اتصال برقرار نشد (timeout)",
                                          "ReadTimeout": "پاسخ در زمان مقرر نیامد", "TimeoutError": "پاسخ در زمان مقرر نیامد"}.get(type(exc).__name__, type(exc).__name__)})
    return {"ok": any(r["ok"] for r in results), "model": model, "results": results}


@router.post("/providers/{pid}/models")
async def discover_models(pid: str, user: User = Depends(_owner)) -> dict:
    p = reg.provider(pid)
    if not p:
        raise _bad("ارائه‌دهنده پیدا نشد", 404)
    url = (p.get("base_url") or "").rstrip("/") + "/models"
    try:
        await reg.check_resolved(url, bool(p.get("allow_local")))
    except ValueError as exc:
        raise _bad(str(exc)) from exc
    key = (reg.provider_keys(p) or [""])[0]
    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=httpx.Timeout(15.0, connect=6.0)) as client:
            r = await client.get(url, headers={"Authorization": f"Bearer {key}"} if key else {})
            r.raise_for_status()
            items = r.json().get("data") or []
    except Exception as exc:  # noqa: BLE001
        raise _bad("فهرست مدل‌ها دریافت نشد: " + (str(getattr(getattr(exc, "response", None), "status_code", "")) or type(exc).__name__), 502) from exc
    ids = sorted({str(m.get("id")) for m in items if isinstance(m, dict) and m.get("id")})
    return {"models": ids[:300]}

# ───────────────────────── routing / settings ─────────────────────────


class RouteItem(BaseModel):
    id: str = Field(max_length=40)
    model: str | None = Field(default=None, max_length=160)


class RoutingIn(BaseModel):
    mode: str = Field(pattern="^(auto|custom)$")
    chain: list[RouteItem] = Field(default_factory=list, max_length=10)


@router.put("/routing/{feature}")
async def set_routing(feature: str, payload: RoutingIn, user: User = Depends(_owner)) -> dict:
    if feature not in reg.FEATURES:
        raise _bad("بخش ناشناخته", 404)
    data = reg.editable()
    ids = {p["id"] for p in data["providers"]}
    chain = [{"id": c.id, "model": (c.model or "").strip() or None} for c in payload.chain if c.id in ids]
    if payload.mode == "custom" and not chain:
        raise _bad("برای مسیر سفارشی حداقل یک ارائه‌دهنده انتخاب کنید")
    data["routing"][feature] = {"mode": payload.mode, "chain": chain if payload.mode == "custom" else []}
    reg.save(data)
    return await state(user)


class SettingsIn(BaseModel):
    local_only: bool


@router.put("/settings")
async def set_settings(payload: SettingsIn, user: User = Depends(_owner)) -> dict:
    data = reg.editable()
    if payload.local_only and not any(p.get("enabled", True) and reg.is_local(p) for p in data["providers"]):
        raise _bad("اول یک مدل محلی (Ollama / LM Studio / llama.cpp یا آدرس تونل با «اجازه شبکه محلی») اضافه و فعال کنید")
    data["local_only"] = payload.local_only
    reg.save(data)
    return await state(user)


class BreakerIn(BaseModel):
    name: str | None = Field(default=None, max_length=80)


@router.post("/breakers/reset")
async def reset_breakers(payload: BreakerIn, user: User = Depends(_owner)) -> dict:
    names = [payload.name] if payload.name else [b["name"] for b in await _breakers()]
    for name in names:
        await ai_guard.reset(name)
    return {"reset": names, "breakers": await _breakers()}


@router.post("/import-legacy")
async def import_legacy(user: User = Depends(_owner)) -> dict:
    """Copy keys from API.txt / .env / .nvidia_keys into the registry (the files are left as they are)."""
    data = reg.editable()
    counts = {}
    for pid in reg.BUILTIN:
        p = reg.provider(pid, data)
        before = {k.get("fp") for k in p.get("keys") or []}
        if p.get("key_mode") == "legacy":
            reg.materialize_keys(p)
        else:
            for plain in reg.legacy_keys(pid):
                if reg.fingerprint(plain) not in before:
                    p["keys"].append({**_new_key(plain, "از فایل قبلی")})
        counts[pid] = len([k for k in p["keys"] if k.get("fp") not in before])
    reg.save(data)
    return {"imported": counts, **(await state(user))}


@router.get("/export")
async def export_config(user: User = Depends(_owner)) -> dict:
    """Backup: keys stay encrypted (only this server's SECRET_KEY can read them)."""
    data = reg.editable()
    return {"kind": "amookht-ai-registry", "exported_at": reg._now(), "config": data}


class ImportIn(BaseModel):
    config: dict


@router.post("/import")
async def import_config(payload: ImportIn, user: User = Depends(_owner)) -> dict:
    cfg = payload.config.get("config") if isinstance(payload.config.get("config"), dict) else payload.config
    if not isinstance(cfg.get("providers"), list):
        raise _bad("فایل پشتیبان معتبر نیست")
    for p in cfg["providers"]:
        if not isinstance(p, dict) or p.get("type") not in reg.TYPES:
            raise _bad("نوع ارائه‌دهنده نامعتبر در فایل")
        p["base_url"] = _check_url(p.get("base_url") or reg.TYPES[p["type"]]["base_url"], bool(p.get("allow_local")) or reg.TYPES[p["type"]]["local"])
        p["keys"] = [k for k in p.get("keys") or [] if isinstance(k, dict) and reg.decrypt(k.get("enc") or "")]
    reg.save(cfg)
    return await state(user)

# ───────────────────────── relay for the Deutsch Coach (localhost only) ─────────────────────────


def _internal(request: Request) -> None:
    client = request.client.host if request.client else ""
    if client not in ("127.0.0.1", "::1") or request.headers.get("x-real-ip") or request.headers.get("x-forwarded-for"):
        raise HTTPException(status_code=404, detail="Not Found")


@relay_router.get("/route/{feature}")
async def route_info(feature: str, request: Request) -> dict:
    _internal(request)
    if feature not in reg.FEATURES:
        raise HTTPException(status_code=404, detail="Not Found")
    return {"feature": feature, "registry": not reg.is_legacy(feature)}


class RelayIn(BaseModel):
    feature: str = Field(pattern="^translate$")
    messages: list[dict] = Field(min_length=1, max_length=6)
    max_tokens: int = Field(default=1100, ge=50, le=3000)
    json_mode: bool = True
    temperature: float = Field(default=0.3, ge=0, le=1.5)


@relay_router.post("/relay")
async def relay(payload: RelayIn, request: Request, user: User = Depends(get_current_user)) -> dict:
    _internal(request)
    require_premium(user)
    if sum(len(str(m.get("content") or "")) for m in payload.messages) > 12000:
        raise HTTPException(status_code=413, detail="Too long")
    msgs = [{"role": str(m.get("role") or "user")[:10], "content": str(m.get("content") or "")} for m in payload.messages]
    content, model = await reg.complete(payload.feature, reg.chain(payload.feature), msgs, max_tokens=payload.max_tokens, budget=45.0,
                                        json_mode=payload.json_mode, temperature=payload.temperature)
    return {"content": content, "model": model}
