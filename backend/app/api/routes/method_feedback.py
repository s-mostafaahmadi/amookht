"""AI feedback for the TestDaF training method: essay correction, speaking analysis (Whisper), sentence check,
listening/reading error analysis, sentence explanations and the weekly error analysis."""
from __future__ import annotations

import json
import logging
import re
import time
from collections import defaultdict

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

import asyncio
from app.api import ai_guard, ai_nvidia  # aifallback-v1
from app.api import ai_registry  # AI-ADMIN
from app.api.access import require_premium
from app.api.middleware.auth import get_current_user
from app.api.routes.owner_ai_chat import _providers
from app.api.routes.speaking import _safe_segment, _user_directory
from app.domain.models.models import User
from app.infrastructure.database.connection import get_db

router = APIRouter()
log = logging.getLogger(__name__)

# LEVEL-ADAPT (2026-11-14): learner level (from the account settings) calibrates every feedback prompt
import contextvars as _cv
from fastapi import Request as _Request
_LEVEL = _cv.ContextVar("method_level", default="")
_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}


async def _capture_level(request: _Request) -> None:
    lv = ""
    try:
        if "json" in (request.headers.get("content-type") or ""):
            body = await request.json()
            if isinstance(body, dict):
                lv = str(body.get("level") or "")
        else:
            lv = request.query_params.get("level", "")
    except Exception:  # noqa: BLE001 - level is optional
        lv = ""
    lv = lv.strip().upper()[:2]
    _LEVEL.set(lv if lv in _LEVELS else "")


router.dependencies.append(Depends(_capture_level))


def _level_frame(prompt: str) -> str:
    lv = _LEVEL.get()
    if not lv:
        return prompt
    if lv in ("A1", "A2", "B1"):
        note = (f"Sprachniveau der Lernenden (GER): {lv}. Passe Rückmeldung und Korrekturen an dieses Niveau an: "
                "nur die wichtigsten Fehler, einfache und klare Verbesserungen ohne C1-Formulierungen, "
                "Erklärungen auf Persisch ausführlich und leicht verständlich; motivierend.")
    elif lv == "B2":
        note = ("Sprachniveau der Lernenden (GER): B2. Korrigiere genau; Verbesserungen auf B2+-Niveau, "
                "die schrittweise zu C1 führen.")
    else:
        note = (f"Sprachniveau der Lernenden (GER): {lv}. Bewerte anspruchsvoll; Verbesserungen auf C1-Niveau "
                "(präziser Wortschatz, Nominalstil, akademische Konnektoren).")
    return note + "\n" + prompt
DAILY_LIMIT = 250
_usage: dict[str, list[float]] = defaultdict(list)
CATEGORIES = {"grammatik", "wortschatz", "konnektoren", "struktur", "aufgabe"}


def _quota(user: User) -> None:
    now = time.time()
    calls = [t for t in _usage[user.id] if now - t < 86400]
    if len(calls) >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail="Daily AI feedback limit reached")
    calls.append(now)
    _usage[user.id] = calls


def _json(raw: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", raw.strip()).strip()
    try:
        return json.loads(text)
    except ValueError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
    raise HTTPException(status_code=502, detail="AI feedback could not be parsed")


def _score(value) -> int:
    try:
        return max(1, min(5, int(round(float(value)))))
    except (TypeError, ValueError):
        return 3


MODELS = ("openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b")
RESERVED_KEYS = 2  # the last Groq keys are not used by the content pipeline; user-facing calls try them first
_cursor = 0


def _groq_keys() -> list[str]:
    try:
        groq = next((p for p in _providers() if p["id"] == "builtin:groq"), None)
    except Exception:  # e.g. the key file is not readable by the service user
        log.exception("Method feedback: AI provider keys could not be loaded")
        raise HTTPException(status_code=503, detail="AI provider keys are not readable")
    keys = list((groq or {}).get("keys") or [])
    if len(keys) <= RESERVED_KEYS:
        return keys
    shared = keys[:-RESERVED_KEYS]
    shift = _cursor % len(shared)
    return keys[-RESERVED_KEYS:] + shared[shift:] + shared[:shift]


BREAKER = "groq-method"
TEXT_BUDGET, TEXT_ATTEMPT = 55.0, 25.0     # whole request / one provider attempt (seconds)
GROQ_SHARE = 28.0                          # Groq's part of the budget when the NVIDIA fallback is available
AUDIO_BUDGET, AUDIO_ATTEMPT = 70.0, 45.0


def _status_of(exc: Exception):
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code
    if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout)):
        return "connect"
    if isinstance(exc, (httpx.TimeoutException, asyncio.TimeoutError)):
        return "timeout"
    return type(exc).__name__


async def _llm(prompt: str, max_tokens: int = 3000) -> tuple[str, str]:
    prompt = _level_frame(prompt)  # LEVEL-ADAPT
    _plan = ai_registry.custom_plan("method")  # AI-ADMIN: owner-defined route (custom order / local LLM)
    if _plan is not None:
        return await ai_registry.complete("method", _plan, [{"role": "user", "content": prompt}], max_tokens=max_tokens, budget=TEXT_BUDGET,
                                          json_mode=True, busy_message="AI feedback unavailable")
    """JSON completion via Groq with current models; reserved keys first, then rotation, then smaller models.
    Bounded by TEXT_BUDGET and guarded by the circuit breaker (fails fast with 503 ai_unavailable)."""
    global _cursor
    groq_wait = await ai_guard.retry_after(BREAKER)
    nv_ok = ai_nvidia.available() and not await ai_guard.retry_after("nvidia-method")
    if groq_wait and not nv_ok:
        raise ai_guard.unavailable(groq_wait)
    keys = []
    if not groq_wait:
        try:
            keys = _groq_keys()
        except HTTPException:
            if not nv_ok:
                raise
    if not keys and not nv_ok:
        raise HTTPException(status_code=503, detail="No AI provider configured")
    failures, statuses = [], []
    deadline = ai_guard.Deadline(TEXT_BUDGET)
    groq_deadline = ai_guard.Deadline(GROQ_SHARE) if nv_ok else deadline   # leave time for the NVIDIA fallback
    async with httpx.AsyncClient(timeout=httpx.Timeout(TEXT_ATTEMPT, connect=5.0)) as client:
        for model in (MODELS if keys else ()):
            _cursor += 1
            for key in keys[:5]:
                limit = groq_deadline.attempt(TEXT_ATTEMPT)
                if limit is None:
                    break
                body = {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.2, "max_completion_tokens": max_tokens, "response_format": {"type": "json_object"}}
                if model.startswith("openai/gpt-oss"):
                    body["reasoning_effort"] = "low"
                elif model.startswith("qwen/"):
                    body["reasoning_format"] = "hidden"
                try:
                    r = await asyncio.wait_for(client.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {key}"}, json=body, timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                    r.raise_for_status()
                    content = str(r.json()["choices"][0]["message"].get("content") or "").strip()
                    if content:
                        await ai_guard.record_success(BREAKER)
                        return content, model
                    statuses.append("empty")
                except (httpx.HTTPError, asyncio.TimeoutError, KeyError, IndexError, ValueError) as exc:
                    status = _status_of(exc)
                    statuses.append(status)
                    failures.append(f"{model}:{status}")
            if groq_deadline.attempt(TEXT_ATTEMPT) is None:
                failures.append("deadline")
                break
    if keys:
        await ai_guard.record_failure(BREAKER, statuses)
    if nv_ok:  # second provider: NVIDIA
        got = await ai_nvidia.chat([{"role": "user", "content": prompt}], max_tokens=max_tokens + 1500, deadline=deadline, scope="method", json_mode=True)
        if got:
            return got
        failures.append("nvidia")
    log.warning("Method AI failed: %s", ", ".join(failures[-6:]))
    waits = [w for w in (await ai_guard.retry_after(BREAKER), await ai_guard.retry_after("nvidia-method") if ai_nvidia.available() else 0) if w]
    raise ai_guard.unavailable(min(waits) if waits else 60, "AI feedback unavailable (" + ", ".join(failures[-4:]) + ")")


@router.get("/ai-status")
async def ai_status(user: User = Depends(get_current_user)) -> dict:
    """Cheap health view for the frontend: no provider call, only the breaker states.
    ok = Groq up; degraded = Groq down but NVIDIA fallback available; down = no provider usable right now."""
    _plan = ai_registry.custom_plan("method")  # AI-ADMIN
    if _plan is not None:
        if not _plan:
            return {"state": "down", "retry_after": 60}
        waits = [await ai_guard.retry_after(f"reg-{i['provider']['id']}-method") for i in _plan]
        if not waits[0]:
            return {"state": "ok", "retry_after": 0}
        return {"state": "degraded", "retry_after": 0} if 0 in waits else {"state": "down", "retry_after": min(waits)}
    groq = await ai_guard.retry_after(BREAKER)
    nv = await ai_guard.retry_after("nvidia-method") if ai_nvidia.available() else -1
    if not groq:
        return {"state": "ok", "retry_after": 0}
    if nv == 0:
        return {"state": "degraded", "retry_after": 0}
    return {"state": "down", "retry_after": min(groq, nv) if nv > 0 else groq}


EXAM_FIELD = Field(default="", max_length=60)


def _is_oesd(exam: str) -> bool:
    return str(exam or "").strip().upper().startswith(("ÖSD", "OESD", "OSD"))


def _oesd_frame(prompt: str, exam: str) -> str:
    """Re-frame a TestDaF prompt for the ÖSD exam (B2/C1); unchanged for TestDaF."""
    if not _is_oesd(exam):
        return prompt
    level = "C1" if "C1" in exam.upper() else "B2"
    name = f"ÖSD Zertifikat {level}"
    for a, b in (
        ("Du bist erfahrener TestDaF-Prüfer für den Bereich Schreiben.", f"Du bist erfahrene Bewerterin/erfahrener Bewerter für das {name} (Subtest Schreiben, Kriterien: Aufgabenerfüllung, Kohärenz, Wortschatz, Strukturen)."),
        ("Du bist TestDaF-Prüfer für Sprechen.", f"Du bist ÖSD-Prüferin/ÖSD-Prüfer für das {name} (mündliche Prüfung)."),
        ("Du bist TestDaF-Trainer.", f"Du bist Trainerin/Trainer für das {name}."),
        ("Du bist TestDaF-Coach.", f"Du bist Coach für das {name}."),
        ("(Ziel: TDN 4 in allen vier Teilen)", f"(Ziel: {name} in beiden Modulen bestehen, mindestens 60 %)"),
        ("(Ziel: TDN 4)", f"(Ziel: {name} bestehen)"),
        ('"tdn": "unter TDN 3" | "TDN 3" | "TDN 4" | "TDN 5",', '"tdn": "nicht bestanden" | "bestanden" | "befriedigend" | "gut" | "sehr gut" (voraussichtliches ÖSD-Prädikat für diese Aufgabe),'),
        ("(B2→C1)", f"(Ziel {level})"),
    ):
        prompt = prompt.replace(a, b)
    return prompt


def _oesd_kind(kind: str, min_words: int) -> str:
    return {
        "email": f"Formelles E-Mail (ca. {min_words} Wörter; Anrede, Grußformel, auf ALLE Notizen bzw. Punkte des Auftrags eingehen, angemessenes Register)",
        "meinung": f"Meinungsäußerung zu Äußerungen/Schlagzeilen (ca. {min_words} Wörter; alle vier Leitpunkte behandeln)",
        "referat": f"Schriftliches Referat zu einer Statistik (mindestens {min_words} Wörter; Zusammenfassung, Interpretation, Vergleich mit dem Heimatland, eigene Meinung; keine Publikumsanrede)",
        "stellungnahme": f"Stellungnahme zu einem Zeitungsartikel (mindestens {min_words} Wörter; Zusammenfassung, Vor- und Nachteile, Situation im Heimatland)",
        "kommentar": f"Kommentar zu einem Sachtext (mindestens {min_words} Wörter; eigene Meinung mit Argumentation, Situation im Heimatland)",
    }.get(kind, f"Schreibaufgabe (mindestens {min_words} Wörter)")


class WritingFeedback(BaseModel):
    task: str = Field(default="", max_length=4000)
    text: str = Field(min_length=20, max_length=9000)
    kind: str = Field(default="argumentation", max_length=40)
    min_words: int = Field(default=200, ge=50, le=500)
    exam: str = EXAM_FIELD


@router.post("/writing-feedback")
async def writing_feedback(payload: WritingFeedback, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    kind = "Grafikbeschreibung (Grafik und Text zusammenfassen, 100–150 Wörter)" if payload.kind == "grafik" else f"Argumentation (mindestens {payload.min_words} Wörter)"
    if _is_oesd(payload.exam):
        kind = _oesd_kind(payload.kind, payload.min_words)
    prompt = f"""Du bist erfahrener TestDaF-Prüfer für den Bereich Schreiben. Bewerte den Text einer persischsprachigen Lernenden (Ziel: TDN 4).
Aufgabentyp: {kind}
Aufgabe: {payload.task}
Text:
<<<
{payload.text}
>>>
Antworte NUR mit JSON:
{{"scores": {{"grammatik": 1-5, "wortschatz": 1-5, "konnektoren": 1-5, "struktur": 1-5, "aufgabe": 1-5}},
"tdn": "unter TDN 3" | "TDN 3" | "TDN 4" | "TDN 5",
"summary_fa": "Gesamteinschätzung auf Persisch, 2-3 Sätze",
"errors": [{{"wrong": "fehlerhafte Stelle wörtlich", "right": "Korrektur", "reason_fa": "Regel/Grund auf Persisch, kurz", "category": "grammatik|wortschatz|konnektoren|struktur|aufgabe"}}],
"improved": [{{"original": "ein schwacher Satz", "better": "verbesserte, natürliche Version"}}],
"tip_fa": "der wichtigste Tipp für den nächsten Text auf Persisch"}}
Regeln: höchstens 6 errors, die wichtigsten zuerst; genau 2 improved; nichts erfinden, was nicht im Text steht."""
    prompt = _oesd_frame(prompt, payload.exam)
    raw, model = await _llm(prompt, 3500)
    data = _json(raw)
    scores = {k: _score((data.get("scores") or {}).get(k)) for k in CATEGORIES}
    errors = [{"wrong": str(e.get("wrong", ""))[:300], "right": str(e.get("right", ""))[:300], "reason_fa": str(e.get("reason_fa", ""))[:400], "category": e.get("category") if e.get("category") in CATEGORIES else "grammatik"} for e in (data.get("errors") or [])[:6] if isinstance(e, dict)]
    improved = [{"original": str(e.get("original", ""))[:400], "better": str(e.get("better", ""))[:400]} for e in (data.get("improved") or [])[:2] if isinstance(e, dict)]
    return {"scores": scores, "tdn": str(data.get("tdn", ""))[:40], "summary_fa": str(data.get("summary_fa", ""))[:800], "errors": errors, "improved": improved, "tip_fa": str(data.get("tip_fa", ""))[:400], "model": model}


class SentenceFeedback(BaseModel):
    sentences: list[str] = Field(min_length=1, max_length=8)
    grammar: str = Field(default="", max_length=200)


@router.post("/sentences-feedback")
async def sentences_feedback(payload: SentenceFeedback, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    items = [s.strip()[:400] for s in payload.sentences if s.strip()]
    if not items:
        raise HTTPException(status_code=400, detail="No sentences")
    prompt = f"""Prüfe diese deutschen Sätze einer Lernenden (B2). Grammatikthema der Woche: {payload.grammar}.
{json.dumps(items, ensure_ascii=False)}
Antworte NUR mit JSON: {{"results": [{{"ok": true|false, "corrected": "korrigierter, natürlicher Satz", "reason_fa": "kurze persische Erklärung (leer wenn ok)", "uses_grammar": true|false}}]}} – gleiche Reihenfolge und Anzahl."""
    raw, model = await _llm(prompt, 2500)
    data = _json(raw)
    results = [{"ok": bool(r.get("ok")), "corrected": str(r.get("corrected", ""))[:400], "reason_fa": str(r.get("reason_fa", ""))[:300], "uses_grammar": bool(r.get("uses_grammar"))} for r in (data.get("results") or [])[:len(items)] if isinstance(r, dict)]
    return {"results": results, "model": model}


class SpeakingFeedback(BaseModel):
    recording_id: str = Field(min_length=6, max_length=80)
    task: str = Field(default="", max_length=3000)
    task_type: str = Field(default="", max_length=80)
    reference: str = Field(default="", max_length=4000)  # for oral summaries: what the source said
    exam: str = EXAM_FIELD


def _snap(sentence: str, text: str) -> str:
    """Replace a quoted sentence with the closest sentence that really occurs in the source text."""
    import difflib
    candidates = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", re.sub(r"^\[\d+\][^:]*:\s*", "", text, flags=re.M)) if len(s.strip()) > 15]
    if not sentence or not candidates:
        return sentence
    best = max(candidates, key=lambda s: difflib.SequenceMatcher(None, s.lower(), sentence.lower()).ratio())
    return best if difflib.SequenceMatcher(None, best.lower(), sentence.lower()).ratio() >= 0.6 else sentence


QA_CATEGORIES = {"hoeren": ("wortschatz", "verstaendnis", "grammatik"), "lesen": ("wortschatz", "argumentation", "details", "eile", "grammatik")}


class AnalysisItem(BaseModel):
    id: str = Field(max_length=20)
    question: str = Field(max_length=600)
    options: list[str] = Field(default_factory=list, max_length=12)
    user_answer: str = Field(default="", max_length=400)
    correct_answer: str = Field(max_length=400)
    evidence: str = Field(default="", max_length=800)


class QuestionsAnalysis(BaseModel):
    skill: str = Field(pattern=r"^(hoeren|lesen)$")
    title: str = Field(default="", max_length=300)
    text: str = Field(min_length=50, max_length=9000)
    items: list[AnalysisItem] = Field(default_factory=list, max_length=12)
    extra_needed: int = Field(default=0, ge=0, le=3)
    exam: str = EXAM_FIELD


@router.post("/questions-analysis")
async def questions_analysis(payload: QuestionsAnalysis, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    cats = QA_CATEGORIES[payload.skill]
    kind = "Hörverstehen (Transkript des Hörtextes)" if payload.skill == "hoeren" else "Leseverstehen"
    wrong = [{"id": i.id, "frage": i.question, "optionen": i.options, "antwort_lernende": i.user_answer or "(keine Antwort)", "richtig": i.correct_answer, "beleg": i.evidence} for i in payload.items]
    prompt = f"""Du bist TestDaF-Trainer. Analysiere die Fehler einer persischsprachigen Lernenden (B2→C1) in einer Aufgabe zum {kind}.
Titel: {payload.title}
Text:
<<<
{payload.text}
>>>
Falsch beantwortete Aufgaben: {json.dumps(wrong, ensure_ascii=False)}
Kategorien (genau eine wählen): {", ".join(cats)}{" (wortschatz = Wort nicht erkannt/verstanden; verstaendnis = Wörter erkannt, Sinn des Satzes nicht verstanden; grammatik = Satzstruktur/Bezüge falsch verstanden)" if payload.skill == "hoeren" else " (argumentation = Haltung/Argument der Autorin verkannt; details = Detail übersehen/verwechselt; eile = Unachtsamkeit, z. B. Verneinung überlesen)"}
Antworte NUR mit JSON:
{{"items": [{{"id": "...", "category": "...", "why_fa": "2 Sätze auf Persisch: warum die richtige Antwort stimmt (mit Bezug auf den Beleg) und was die Lernende vermutlich missverstanden hat", "tip_fa": "1 konkreter Tipp auf Persisch", "keywords": [{{"de": "Schlüsselwort oder Struktur aus dem Beleg", "fa": "Bedeutung"}}]}}],
"extra": [{{"sentence": "wörtlich aus dem Text", "explanation_fa": "Bedeutung und Satzbau auf Persisch, 2 Sätze", "category": "..."}}],
"overview_fa": "1-2 Sätze Gesamteindruck auf Persisch"}}
Regeln: für jede falsche Aufgabe genau ein Eintrag in items (höchstens 3 keywords); "extra" enthält genau {payload.extra_needed} besonders schwierige Sätze aus dem Text (0 = leere Liste); erfinde nichts, was nicht im Text steht."""
    prompt = _oesd_frame(prompt, payload.exam)
    raw, model = await _llm(prompt, 4000)
    data = _json(raw)
    ids = {i.id for i in payload.items}
    items = []
    for e in data.get("items") or []:
        if not isinstance(e, dict) or str(e.get("id")) not in ids:
            continue
        kws = [{"de": str(k.get("de", ""))[:120], "fa": str(k.get("fa", ""))[:160]} for k in (e.get("keywords") or [])[:3] if isinstance(k, dict) and k.get("de")]
        items.append({"id": str(e["id"]), "category": e.get("category") if e.get("category") in cats else cats[0], "why_fa": str(e.get("why_fa", ""))[:700], "tip_fa": str(e.get("tip_fa", ""))[:300], "keywords": kws})
    extra = [{"sentence": _snap(str(e.get("sentence", "")), payload.text)[:600], "explanation_fa": str(e.get("explanation_fa", ""))[:700], "category": e.get("category") if e.get("category") in cats else cats[0]} for e in (data.get("extra") or [])[:payload.extra_needed] if isinstance(e, dict) and e.get("sentence")]
    return {"items": items, "extra": extra, "overview_fa": str(data.get("overview_fa", ""))[:500], "model": model}


class SentenceExplain(BaseModel):
    sentence: str = Field(min_length=3, max_length=700)
    context: str = Field(default="", max_length=1500)
    skill: str = Field(default="hoeren", pattern=r"^(hoeren|lesen)$")


@router.post("/sentence-explain")
async def sentence_explain(payload: SentenceExplain, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    cats = QA_CATEGORIES[payload.skill]
    prompt = f"""Eine persischsprachige Lernende (B2) hat diesen Satz aus einem {"Hörtext" if payload.skill == "hoeren" else "Lesetext"} nicht verstanden:
„{payload.sentence}“
Kontext: {payload.context}
Antworte NUR mit JSON: {{"meaning_fa": "natürliche persische Übersetzung/Bedeutung", "grammar_fa": "Satzbau kurz erklärt auf Persisch (Verbstellung, Nebensatz, Bezüge)", "vocab": [{{"de": "schwieriges Wort/Ausdruck", "fa": "Bedeutung"}}], "category": "{"|".join(cats)}", "tip_fa": "1 Tipp auf Persisch"}}
Höchstens 4 vocab."""
    raw, model = await _llm(prompt, 2500)
    data = _json(raw)
    vocab = [{"de": str(v.get("de", ""))[:120], "fa": str(v.get("fa", ""))[:160]} for v in (data.get("vocab") or [])[:4] if isinstance(v, dict) and v.get("de")]
    return {"meaning_fa": str(data.get("meaning_fa", ""))[:600], "grammar_fa": str(data.get("grammar_fa", ""))[:600], "vocab": vocab, "category": data.get("category") if data.get("category") in cats else cats[0], "tip_fa": str(data.get("tip_fa", ""))[:300], "model": model}


class WeeklyError(BaseModel):
    category: str = Field(default="", max_length=120)
    question: str = Field(default="", max_length=300)
    wrong: str = Field(default="", max_length=300)
    right: str = Field(default="", max_length=300)


class WeeklyAnalysis(BaseModel):
    week: int = Field(ge=0, le=60)
    metrics: dict = Field(default_factory=dict)
    previous: dict | None = None
    category_counts: dict[str, int] = Field(default_factory=dict)
    errors: list[WeeklyError] = Field(default_factory=list, max_length=80)
    exam: str = EXAM_FIELD


@router.post("/weekly-analysis")
async def weekly_analysis(payload: WeeklyAnalysis, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    keep = ("hoeren", "lesen", "schreiben", "sprechen", "minutes", "completion", "errors")
    metrics = {k: payload.metrics.get(k) for k in keep}
    previous = {k: (payload.previous or {}).get(k) for k in keep} if payload.previous else None
    prompt = f"""Du bist TestDaF-Coach. Erstelle die Wochenanalyse für eine persischsprachige Lernende (Ziel: TDN 4 in allen vier Teilen).
Woche {payload.week} (Werte in Prozent; Schreiben/Sprechen = Bewertung): {json.dumps(metrics, ensure_ascii=False)}
Vorwoche: {json.dumps(previous, ensure_ascii=False) if previous else "keine"}
Fehler nach Kategorie: {json.dumps(payload.category_counts, ensure_ascii=False)}
Beispiele der Fehler: {json.dumps([e.model_dump() for e in payload.errors], ensure_ascii=False)}
Antworte NUR mit JSON:
{{"top_errors": [{{"label": "kurze Bezeichnung auf Persisch", "explanation_fa": "was genau schiefgeht, 1-2 Sätze", "example_de": "typisches Beispiel aus den Fehlern (falsch → richtig) oder leer", "fix_fa": "konkrete Übung dagegen"}}],
"weaknesses": [{{"label_fa": "Schwäche", "evidence_fa": "woran man es sieht (Zahl/Fehler)"}}],
"goal_fa": "ein messbares Ziel für die nächste Woche",
"plan_fa": ["3 konkrete Maßnahmen für die nächste Woche"],
"progress_fa": "1-2 Sätze Vergleich mit der Vorwoche (oder Ausgangslage)"}}
Genau 3 top_errors und 3 weaknesses, auf Basis der Daten; nichts erfinden."""
    prompt = _oesd_frame(prompt, payload.exam)
    raw, model = await _llm(prompt, 4000)
    data = _json(raw)
    tops = [{"label": str(e.get("label", ""))[:120], "explanation_fa": str(e.get("explanation_fa", ""))[:500], "example_de": str(e.get("example_de", ""))[:300], "fix_fa": str(e.get("fix_fa", ""))[:300]} for e in (data.get("top_errors") or [])[:3] if isinstance(e, dict) and e.get("label")]
    weak = [{"label_fa": str(e.get("label_fa", ""))[:150], "evidence_fa": str(e.get("evidence_fa", ""))[:300]} for e in (data.get("weaknesses") or [])[:3] if isinstance(e, dict) and e.get("label_fa")]
    plan = [str(p)[:300] for p in (data.get("plan_fa") or [])[:4]]
    return {"top_errors": tops, "weaknesses": weak, "goal_fa": str(data.get("goal_fa", ""))[:400], "plan_fa": plan, "progress_fa": str(data.get("progress_fa", ""))[:500], "model": model}


async def _transcribe(path, keys: list[str]) -> dict:
    data = path.read_bytes()
    mime = {".webm": "audio/webm", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav"}.get(path.suffix, "audio/webm")
    await ai_guard.guard(BREAKER)
    failures, statuses = [], []
    deadline = ai_guard.Deadline(AUDIO_BUDGET)
    async with httpx.AsyncClient(timeout=httpx.Timeout(AUDIO_ATTEMPT, connect=5.0)) as client:
        for key in keys:
            limit = deadline.attempt(AUDIO_ATTEMPT)
            if limit is None:
                failures.append("deadline")
                break
            try:
                response = await asyncio.wait_for(client.post("https://api.groq.com/openai/v1/audio/transcriptions", headers={"Authorization": f"Bearer {key}"},
                                             files={"file": (path.name, data, mime)}, data={"model": "whisper-large-v3-turbo", "language": "de", "response_format": "verbose_json", "temperature": "0"},
                                             timeout=httpx.Timeout(limit, connect=min(5.0, limit))), limit + 2)
                response.raise_for_status()
                return response.json()
            except (httpx.HTTPError, asyncio.TimeoutError, ValueError) as exc:
                status = _status_of(exc)
                statuses.append(status)
                failures.append(str(status))
    await ai_guard.record_failure(BREAKER, statuses)
    raise ai_guard.unavailable(await ai_guard.retry_after(BREAKER) or 60, "Transcription failed (" + ", ".join(failures) + ")", code="asr_unavailable")


@router.post("/speaking-feedback")
async def speaking_feedback(payload: SpeakingFeedback, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    require_premium(user)
    _quota(user)
    safe_id = _safe_segment(payload.recording_id, "invalid")
    user_dir = _user_directory(user.id)
    matches = list(user_dir.rglob(f"*-{safe_id}.*")) if user_dir.exists() else []
    if not matches or user_dir not in matches[0].resolve().parents:
        raise HTTPException(status_code=404, detail="Recording not found")
    keys = _groq_keys()
    if not keys:
        raise HTTPException(status_code=503, detail="No transcription provider configured")
    tr = await _transcribe(matches[0], keys[:5])
    transcript = str(tr.get("text", "")).strip()
    segments = tr.get("segments") or []
    duration = float(tr.get("duration") or (segments[-1]["end"] if segments else 0) or 0)
    pauses = sum(1 for a, b in zip(segments, segments[1:]) if float(b.get("start", 0)) - float(a.get("end", 0)) >= 1.5)
    words = len(re.findall(r"\w+", transcript))
    wpm = round(words / duration * 60) if duration > 5 else None
    if words < 5:
        return {"transcript": transcript, "duration": duration, "words": words, "wpm": wpm, "long_pauses": pauses, "errors": [], "issues": {}, "scores": {}, "summary_fa": "صدای کافی برای تحلیل پیدا نشد.", "better_version": ""}
    prompt = f"""Du bist TestDaF-Prüfer für Sprechen. Hier ist die automatische Transkription einer Antwort (Aufgabentyp: {payload.task_type}).
Aufgabe: {payload.task}
Transkript ({round(duration)} Sekunden, {words} Wörter, {pauses} lange Pausen):
<<<
{transcript}
>>>
Antworte NUR mit JSON:
{{"issues": {{"wiederholung": true|false, "verbposition": true|false, "unvollstaendig": true|false, "fortsetzung": true|false}},
"scores": {{"fluss": 1-5, "genau": 1-5, "struktur": 1-5, "aufgabe": 1-5}},
"errors": [{{"wrong": "Stelle aus dem Transkript", "right": "Korrektur", "reason_fa": "kurze persische Erklärung"}}],
"summary_fa": "Einschätzung auf Persisch, 2 Sätze",
"better_version": "eine verbesserte Musterformulierung der Kernaussagen (60–90 Wörter)"}}
Höchstens 5 errors. Transkriptionsfehler (Satzzeichen, Groß-/Kleinschreibung) ignorieren."""
    if payload.reference.strip():
        prompt = prompt.replace("Antworte NUR mit JSON:", f"""Es handelt sich um eine mündliche Zusammenfassung. Inhalt der Quelle:
<<<
{payload.reference.strip()}
>>>
Antworte NUR mit JSON:""", 1)
        prompt = prompt.rstrip("\n") + '\nZusätzlich im JSON: "summary_check": {"thema": true|false (Thema richtig erfasst), "reihenfolge": true|false (Reihenfolge der Informationen eingehalten), "eigene_worte": true|false (mit eigenen Worten statt auswendig), "missing": ["wichtige fehlende Punkte, kurz auf Deutsch"]}'
    prompt = _oesd_frame(prompt, payload.exam)
    raw, model = await _llm(prompt, 3500)
    data = _json(raw)
    check = data.get("summary_check") if payload.reference.strip() and isinstance(data.get("summary_check"), dict) else None
    summary_check = {"thema": bool(check.get("thema")), "reihenfolge": bool(check.get("reihenfolge")), "eigene_worte": bool(check.get("eigene_worte")), "missing": [str(m)[:200] for m in (check.get("missing") or [])[:5]]} if check else None
    issues = {k: bool((data.get("issues") or {}).get(k)) for k in ("wiederholung", "verbposition", "unvollstaendig", "fortsetzung")}
    issues["pausen"] = pauses >= 2
    scores = {k: _score((data.get("scores") or {}).get(k)) for k in ("fluss", "genau", "struktur", "aufgabe")}
    errors = [{"wrong": str(e.get("wrong", ""))[:300], "right": str(e.get("right", ""))[:300], "reason_fa": str(e.get("reason_fa", ""))[:300]} for e in (data.get("errors") or [])[:5] if isinstance(e, dict)]
    return {"transcript": transcript, "duration": round(duration, 1), "words": words, "wpm": wpm, "long_pauses": pauses, "issues": issues, "scores": scores, "errors": errors, "summary_fa": str(data.get("summary_fa", ""))[:600], "better_version": str(data.get("better_version", ""))[:900], "summary_check": summary_check, "model": model}



# ---- short Persian meaning for the selection toolbar's notebook entries (added 2026-11-12) ----
class Gloss(BaseModel):
    text: str = Field(min_length=1, max_length=200)
    kind: str = Field(default="wort", pattern=r"^(wort|redemittel)$")
    context: str = Field(default="", max_length=400)


@router.post("/gloss")
async def gloss(payload: Gloss, user: User = Depends(get_current_user)) -> dict:
    """Meaning for a word/Redemittel the learner saved without typing one. Any signed-in user; shares the daily AI quota."""
    _quota(user)
    what = "Wort" if payload.kind == "wort" else "Redemittel/Ausdruck"
    ctx = f"\nKontext: {payload.context}" if payload.context.strip() else ""
    prompt = f"""Gib die kurze, natürliche persische Bedeutung dieses deutschen {what} für eine B2-Lernende.
„{payload.text}“{ctx}
Antworte NUR mit JSON: {{"fa": "persische Bedeutung, höchstens 8 Wörter", "artikel": "der|die|das oder leer (nur bei Nomen)"}}"""
    raw, model = await _llm(prompt, 700)
    data = _json(raw)
    fa = re.sub(r"\s+", " ", str(data.get("fa", ""))).strip()[:120]
    if not fa:
        raise HTTPException(status_code=502, detail="AI gloss empty")
    art = str(data.get("artikel", "")).strip().lower()
    return {"fa": fa, "artikel": art if art in ("der", "die", "das") else "", "model": model}
