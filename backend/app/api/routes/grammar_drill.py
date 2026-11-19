"""Grammar drill bot (free study): AI writes Persian sentences that need the chosen German grammar and checks the
learner's German translation briefly. Premium only; the frontend falls back to its offline bank (grammar-drill-bank.js)
when this route is unavailable (503 ai_unavailable, 403, network). Added 2026-11-13."""
from __future__ import annotations

import asyncio
import json
import logging
import random
import re
import time
from collections import defaultdict

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api import ai_guard, ai_nvidia, ai_registry  # AI-ADMIN
from app.api.access import require_premium
from app.api.middleware.auth import get_current_user
from app.api.routes.owner_ai_chat import _providers
from app.domain.models.models import User

router = APIRouter()
log = logging.getLogger(__name__)
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
BREAKER = "groq-grammar"
RESERVED_KEYS = 2   # same reserved keys as the study tutor (the content pipelines use the others)
_cursor = 0
_calls: dict[str, list[float]] = defaultdict(list)

TOPICS: dict[str, str] = {
    "perfekt": "Perfekt mit haben oder sein, auch mit trennbaren und unregelmäßigen Verben",
    "praeteritum": "Präteritum regelmäßiger und unregelmäßiger Verben sowie von sein, haben und Modalverben",
    "plusquam": "Plusquamperfekt (hatte/war + Partizip II), oft mit nachdem",
    "futur": "Futur I (Pläne, Prognosen, Vermutungen) und Futur II (Vermutung über Vergangenes)",
    "modal": "Modalverben im Präsens und Präteritum, nicht brauchen zu, nicht dürfen vs. nicht müssen",
    "trennbar": "trennbare Verben im Haupt- und Nebensatz und Perfekt, Kontrast zu untrennbaren Verben",
    "reflexiv": "reflexive Verben mit Akkusativ- und Dativpronomen (sich bewerben, sich etwas vorstellen)",
    "verb_praep": "Verben/Adjektive mit festen Präpositionen und da(r)-/wo(r)-Wörter (darauf, dass …; Worüber …?)",
    "akk_dat": "Akkusativ- und Dativobjekte, Verben mit Dativ, Pronomen im Dativ/Akkusativ",
    "wechselpraep": "Wechselpräpositionen mit Dativ (Wo?) oder Akkusativ (Wohin?), legen/liegen, stellen/stehen",
    "genitiv": "Genitivattribute und Präpositionen wegen, trotz, während, aufgrund, innerhalb, statt, infolge",
    "adjektiv": "Adjektivendungen nach bestimmtem, unbestimmtem, Possessiv- und ohne Artikel",
    "komparativ": "Komparativ mit als, so … wie, immer + Komparativ, Superlativ",
    "n_dekl": "schwache Maskulina (der Student, Kollege, Mensch, Kunde, Experte) in Akkusativ, Dativ, Genitiv",
    "kausal": "weil, da (Verb am Ende), denn (Position 2), deshalb/deswegen/daher (Inversion)",
    "dass_ob": "dass-Sätze, ob-Sätze und indirekte Fragen mit W-Wort",
    "konzessiv": "obwohl (Nebensatz), trotzdem/dennoch (Inversion), trotz + Genitiv",
    "temporal": "als, wenn, nachdem, bevor, während, seitdem, bis, sobald mit korrekter Zeitenfolge",
    "final": "um … zu (gleiches Subjekt) und damit (verschiedene Subjekte)",
    "konsekutiv": "sodass, so … dass, solch- … dass, folglich",
    "konditional": "wenn, falls, sofern und Konditionalsatz mit Verb an Position 1",
    "relativ": "Relativsätze in allen Kasus inkl. dessen/deren, mit Präposition, wo, was, wer",
    "infinitiv": "Infinitiv mit zu, ohne … zu, (an)statt … zu",
    "zweiteilig": "entweder … oder, sowohl … als auch, nicht nur … sondern auch, weder … noch, je … desto, zwar … aber",
    "adverb_pos2": "Konnektoradverbien am Satzanfang (außerdem, dennoch, folglich, stattdessen, allerdings) mit Verb an Position 2",
    "passiv": "Vorgangspassiv Präsens/Präteritum/Perfekt mit von/durch, Zustandspassiv",
    "passiv_modal": "Passiv mit Modalverben im Haupt- und Nebensatz",
    "passiv_ersatz": "sich lassen + Infinitiv, -bar/-lich, sein + zu + Infinitiv, man",
    "konj2": "Konjunktiv II Gegenwart: irreale Wünsche/Bedingungen, als ob, Ratschläge, Höflichkeit",
    "konj2_verg": "Konjunktiv II Vergangenheit (hätte/wäre + Partizip II), auch mit Modalverb",
    "konj1": "indirekte Rede mit Konjunktiv I (sei, habe, werde, könne), Ersatzform Konjunktiv II",
    "partizip": "erweiterte Partizipialattribute (die stark gestiegenen Mieten, das zu lösende Problem)",
    "nominal": "Nominalstil statt Nebensatz (bei steigender Nachfrage, nach Abschluss des Studiums)",
    "nomen_verb": "Nomen-Verb-Verbindungen (eine Entscheidung treffen, zur Verfügung stehen, in Kauf nehmen)",
    "grafik": "Redemittel zur Grafikbeschreibung (ist um … Prozent gestiegen, sank auf, der Anteil beträgt)",
}
THEMES = ["Studium", "Beruf", "Umwelt", "Digitalisierung", "Gesundheit", "Wohnen", "Verkehr", "Medien", "Bildung", "Forschung",
          "Kultur", "Reisen", "Familie", "Ernährung", "Wirtschaft", "Migration", "Alltag", "Energie", "Künstliche Intelligenz", "Politik"]

GEN_SYSTEM = """Du erstellst Übersetzungsübungen Persisch→Deutsch für persischsprachige Deutschlernende (B1–C1, Ziel TestDaF).
Antworte NUR mit JSON: {"items":[{"topic":"<id>","fa":"…","de":"…","alt":["…"],"hint":"…"}]}
- "de": natürlicher, fehlerfreier deutscher Satz (8–20 Wörter), der die Zielgrammatik des Themas eindeutig verwendet. Prüfe jede Endung und die Verbstellung.
- "fa": idiomatische persische Übersetzung in persischer Schrift, eindeutig genug, um den deutschen Satz zu rekonstruieren; keine deutschen Wörter.
- "alt": 0–2 weitere korrekte DEUTSCHE Übersetzungen genau desselben persischen Satzes mit derselben Zielgrammatik (nur andere Wortstellung oder ein Synonym, gleicher Inhalt; keine freie Umschreibung).
- "hint": sehr kurzer Hinweis AUF PERSISCH in persischer Schrift (max. 8 Wörter), deutsche Signalwörter erlaubt, z. B. «از obwohl استفاده کن» oder «مجهول گذشته: wurde + Partizip II». Der Hinweis muss fachlich stimmen.
- Alle Sätze verschieden in Wortschatz, Person und Variante der Grammatik."""

CHECK_SYSTEM = """Du bist ein knapper, genauer Deutschlehrer. Ein persischsprachiger Lernender hat einen persischen Satz ins Deutsche übersetzt, um eine bestimmte Grammatik zu üben.
Bewerte NUR, ob seine Übersetzung korrektes Deutsch ist und die Bedeutung trifft. Andere korrekte Formulierungen als die Musterlösung sind richtig. Die Zielgrammatik soll verwendet sein, wenn der Satz sie natürlicherweise braucht.
Antworte NUR mit JSON: {"verdict":"correct|almost|wrong","correct":"…","note":"…"}
- verdict: "correct" = fehlerfrei (Groß-/Kleinschreibung und Satzzeichen nicht streng); "almost" = Bedeutung stimmt, nur 1–2 kleine Fehler (Endung, Tippfehler, Artikel); "wrong" = Grammatik/Bedeutung deutlich falsch oder Zielgrammatik fehlt.
- correct: bei "correct" die Antwort des Lernenden (ggf. mit korrigierten Satzzeichen); sonst die Antwort des Lernenden mit minimalen Korrekturen, oder die Musterlösung, wenn die Antwort unbrauchbar ist.
- note: sehr kurz AUF PERSISCH in persischer Schrift (höchstens 18 Wörter), nennt nur den wichtigsten Fehler und die richtige Regel (prüfe Kasus und Endungen genau); deutsche Wörter dürfen vorkommen. Bei "correct" ein kurzes persisches Lob (z. B. «عالی!») oder leer."""


class SentenceRequest(BaseModel):
    topics: list[str] = Field(min_length=1, max_length=40)
    count: int = Field(default=4, ge=1, le=6)
    avoid: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("topics")
    @classmethod
    def known(cls, value: list[str]) -> list[str]:
        out = [t for t in dict.fromkeys(value) if t in TOPICS]
        if not out:
            raise ValueError("No known grammar topic")
        return out

    @field_validator("avoid")
    @classmethod
    def trim(cls, value: list[str]) -> list[str]:
        return [str(v)[:200] for v in value][:20]


class CheckRequest(BaseModel):
    topic: str = Field(max_length=40)
    fa: str = Field(min_length=1, max_length=600)
    de: str = Field(default="", max_length=600)
    answer: str = Field(min_length=1, max_length=600)


def _rate_limit(user: User) -> None:
    now = time.time()
    calls = [t for t in _calls[user.id] if now - t < 86400]
    if sum(1 for t in calls if now - t < 60) >= 30:
        raise HTTPException(status_code=429, detail="Too many requests in a minute")
    if len(calls) >= 1500:
        raise HTTPException(status_code=429, detail="Daily grammar drill limit reached")
    calls.append(now)
    _calls[user.id] = calls


def _parse_json(text: str) -> dict:
    text = text.strip()
    m = re.search(r"\{.*\}", text, re.S)
    data = json.loads(m.group(0) if m else text)
    if not isinstance(data, dict):
        raise ValueError("not an object")
    return data


async def _json_complete(messages: list[dict], *, max_tokens: int, effort: str, budget: float, accept) -> tuple[dict, str]:
    """Groq gpt-oss (reserved keys first) → NVIDIA fallback. Returns (parsed JSON, model) or raises 503 ai_unavailable."""
    global _cursor
    _plan = ai_registry.custom_plan("grammar")  # AI-ADMIN: owner-defined route (custom order / local LLM)
    if _plan is not None:
        def _ok(content: str) -> bool:
            try:
                return bool(accept(_parse_json(content)))
            except Exception:  # noqa: BLE001
                return False
        content, model = await ai_registry.complete("grammar", _plan, messages, max_tokens=max_tokens, budget=budget, json_mode=True,
                                                    accept=_ok, temperature=0.6, effort=effort, busy_message="AI is busy right now")
        return _parse_json(content), model
    groq_down = await ai_guard.retry_after(BREAKER)
    nv_ok = ai_nvidia.available() and not await ai_guard.retry_after("nvidia-grammar")
    if groq_down and not nv_ok:
        raise ai_guard.unavailable(groq_down, "AI is busy right now")
    try:
        groq = next((p for p in _providers() if p["id"] == "builtin:groq"), None)
    except Exception:
        log.exception("Grammar drill: AI provider keys could not be loaded")
        groq = None
    keys = [] if groq_down else list((groq or {}).get("keys") or [])
    if not keys and not nv_ok:
        raise ai_guard.unavailable(60, "No AI provider is available")
    reserved, shared = keys[-RESERVED_KEYS:], keys[:-RESERVED_KEYS]
    _cursor += 1
    rotated = shared[_cursor % len(shared):] + shared[:_cursor % len(shared)] if shared else []
    deadline = ai_guard.Deadline(budget)
    groq_deadline = ai_guard.Deadline(budget * 0.6) if nv_ok else deadline
    statuses: list = []
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=5.0)) as client:
        for model in (("openai/gpt-oss-120b", "openai/gpt-oss-20b") if keys else ()):
            for key in (reserved + rotated)[:4]:
                limit = groq_deadline.attempt(25.0)
                if limit is None:
                    break
                body = {"model": model, "messages": messages, "temperature": 0.6, "max_completion_tokens": max_tokens,
                        "reasoning_effort": effort, "response_format": {"type": "json_object"}}
                try:
                    r = await asyncio.wait_for(client.post(GROQ_URL, headers={"Authorization": f"Bearer {key}"}, json=body,
                                                           timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                    if r.status_code in (429, 413, 500, 502, 503):
                        statuses.append(r.status_code)
                        continue
                    r.raise_for_status()
                    data = _parse_json(str(r.json()["choices"][0]["message"].get("content") or ""))
                    if accept(data):
                        await ai_guard.record_success(BREAKER)
                        return data, model
                    statuses.append("invalid")
                except httpx.HTTPStatusError as exc:
                    statuses.append(exc.response.status_code)
                except (httpx.ConnectError, httpx.ConnectTimeout):
                    statuses.append("connect")
                except (httpx.HTTPError, asyncio.TimeoutError, KeyError, IndexError, ValueError) as exc:
                    statuses.append(type(exc).__name__)
    if keys:
        await ai_guard.record_failure(BREAKER, statuses)

    def ok(content: str) -> bool:
        try:
            return bool(accept(_parse_json(content)))
        except ValueError:
            return False
    if nv_ok:
        got = await ai_nvidia.chat(messages, max_tokens=max_tokens, deadline=deadline, scope="grammar", json_mode=True, accept=ok)
        if got:
            return _parse_json(got[0]), got[1]
    raise ai_guard.unavailable(60, "AI is busy right now (" + ",".join(map(str, statuses[-3:])) + ")")


def _has_persian(text: str, minimum: int = 6) -> bool:
    return sum(1 for ch in text if "؀" <= ch <= "ۿ") >= minimum


def _clean_items(data: dict, topics: list[str]) -> list[dict]:
    out = []
    for raw in data.get("items") or []:
        if not isinstance(raw, dict):
            continue
        fa, de = str(raw.get("fa") or "").strip(), str(raw.get("de") or "").strip()
        topic = str(raw.get("topic") or "").strip()
        if topic not in topics:
            topic = topics[0] if len(topics) == 1 else ""
        if not topic or not _has_persian(fa) or not de or len(de) > 300 or len(fa) > 400 or _has_persian(de):
            continue
        alt = [str(a).strip()[:300] for a in (raw.get("alt") or []) if isinstance(a, str) and a.strip() and not _has_persian(a, 1)][:2]
        hint = str(raw.get("hint") or "").strip()[:90]
        out.append({"topic": topic, "fa": fa, "de": de, "alt": alt, "hint": hint if _has_persian(hint, 3) else ""})
    return out


@router.post("/sentences")
async def sentences(payload: SentenceRequest, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    _rate_limit(user)
    picks = [random.choice(payload.topics) for _ in range(payload.count)]
    plan = "\n".join(f"{i + 1}. topic \"{t}\": {TOPICS[t]} — Thema: {random.choice(THEMES)}" for i, t in enumerate(picks))
    user_msg = f"Erstelle genau {payload.count} Übungen, in dieser Reihenfolge:\n{plan}"
    if payload.avoid:
        user_msg += "\nNicht wiederholen (schon geübt): " + " | ".join(payload.avoid[-12:])
    messages = [{"role": "system", "content": GEN_SYSTEM}, {"role": "user", "content": user_msg}]
    data, model = await _json_complete(messages, max_tokens=4000, effort="medium", budget=40.0,
                                       accept=lambda d: bool(_clean_items(d, payload.topics)))
    items = _clean_items(data, payload.topics)
    return {"items": items[:payload.count], "model": model}


@router.post("/check")
async def check(payload: CheckRequest, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    _rate_limit(user)
    grammar = TOPICS.get(payload.topic, "")
    user_msg = (f"Zielgrammatik: {grammar or payload.topic}\nPersischer Satz: {payload.fa}\nMusterlösung: {payload.de or '—'}\n"
                f"Übersetzung des Lernenden: {payload.answer}")
    messages = [{"role": "system", "content": CHECK_SYSTEM}, {"role": "user", "content": user_msg}]

    def accept(d: dict) -> bool:
        return str(d.get("verdict")) in ("correct", "almost", "wrong") and bool(str(d.get("correct") or "").strip())
    data, model = await _json_complete(messages, max_tokens=2400, effort="medium", budget=30.0, accept=accept)
    note = str(data.get("note") or "").strip()[:300]
    return {"verdict": str(data["verdict"]), "correct": str(data.get("correct") or "").strip()[:400],
            "note": note if _has_persian(note, 3) else "", "model": model}
