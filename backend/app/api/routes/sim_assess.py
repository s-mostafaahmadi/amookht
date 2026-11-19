"""SIM-ASSESS (2026-11-19, owner): AI estimate for the productive parts of the exam simulations.

One call = one writing text or one speaking recording, so every request stays short.
- TestDaF: TDN estimate (unter TDN 3 / TDN 3 / TDN 4 / TDN 5) with the three official rating areas
  (Gesamteindruck, Behandlung der Aufgabe, sprachliche Realisierung) for Schreiben, per task for Sprechen.
- ÖSD Zertifikat B2: the official Auswertungsbogen criteria. Schreiben: K 0–2, T 0–5, L 0–3, F 0–5 and the task
  deduction A (0, −1, −2, −3, "nb"); a 0 in any criterion or "nb" = 0 points (max 15 per text).
  Sprechen: 0–10 per task (max 30), with the criteria as notes.
Speaking is rated from a Whisper transcript (Groq); pronunciation can only be inferred, the answer says so.
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.access import require_premium
from app.api.middleware.auth import get_current_user
from app.api.routes.method_feedback import _groq_keys, _json, _llm, _quota, _transcribe
from app.api.routes.speaking import _safe_segment, _user_directory
from app.domain.models.models import User

router = APIRouter()
TDN = ("unter TDN 3", "TDN 3", "TDN 4", "TDN 5")


def _tdn(v) -> str:
    s = str(v or "").upper().replace(" ", "")
    for t in ("TDN5", "TDN4", "TDN3"):
        if t in s and "UNTER" not in s:
            return "TDN " + t[-1]
    return "unter TDN 3"


def _int(v, lo: int, hi: int, default: int = 0) -> int:
    try:
        return max(lo, min(hi, int(round(float(v)))))
    except (TypeError, ValueError):
        return default


class SimAssess(BaseModel):
    exam: str = Field(pattern=r"^(testdaf|oesd)$")
    part: str = Field(pattern=r"^(writing|speaking)$")
    task: str = Field(default="", max_length=6000)
    kind: str = Field(default="", max_length=120)
    text: str = Field(default="", max_length=12000)
    recording_id: str = Field(default="", max_length=80)
    target: str = Field(default="", max_length=40)   # TestDaF speaking: the task's target level, e.g. "TDN 4"


def _common(data: dict) -> dict:
    return {
        "summary_fa": str(data.get("summary_fa", ""))[:700],
        "strengths_fa": [str(x)[:250] for x in (data.get("strengths_fa") or [])[:3]],
        "improve_fa": [str(x)[:250] for x in (data.get("improve_fa") or [])[:3]],
    }


async def _writing(p: SimAssess) -> dict:
    words = len(re.findall(r"\w+", p.text))
    if words < 20:
        raise HTTPException(status_code=422, detail="text_too_short")
    if p.exam == "testdaf":
        prompt = f"""Du bist erfahrene TestDaF-Bewerterin für den Prüfungsteil Schreiben. Bewerte den Text nach den offiziellen TestDaF-Kriterien
in drei Bereichen und vergib jeweils eine TDN (Gesamteindruck: Textaufbau, Kohärenz, Lesbarkeit; Behandlung der Aufgabe: alle Leitpunkte,
Grafikbeschreibung korrekt, eigene Position begründet; Sprachliche Realisierung: Wortschatz, Strukturen, Korrektheit, Register).
Sei realistisch und streng wie in der echten Prüfung; eine Bewertung über TDN 4 nur bei wirklich sicherem C1-Niveau.
Aufgabe ({p.kind or 'Argumentation mit Grafik'}):
<<<
{p.task}
>>>
Text der Lernenden ({words} Wörter):
<<<
{p.text}
>>>
Antworte NUR mit JSON:
{{"gesamteindruck": "unter TDN 3" | "TDN 3" | "TDN 4" | "TDN 5", "aufgabe": "…", "sprache": "…", "tdn": "Gesamt-TDN für Schreiben",
"summary_fa": "Begründung auf Persisch, 2–3 Sätze", "strengths_fa": ["bis zu 2 Stärken auf Persisch"], "improve_fa": ["die 3 wichtigsten Verbesserungen auf Persisch, konkret"]}}"""
        raw, model = await _llm(prompt, 2500)
        d = _json(raw)
        crit = {"gesamteindruck": _tdn(d.get("gesamteindruck")), "aufgabe": _tdn(d.get("aufgabe")), "sprache": _tdn(d.get("sprache"))}
        return {"exam": "testdaf", "part": "writing", "words": words, "criteria": crit, "tdn": _tdn(d.get("tdn")), **_common(d), "model": model}
    prompt = f"""Du bist erfahrene Bewerterin für das ÖSD Zertifikat B2, Subtest Schreiben. Bewerte den Text streng nach dem offiziellen
Auswertungsbogen ZB2:
- K Kommunikative Angemessenheit / Textsorte: 0–2
- T Textaufbau / Kohärenz: 0–5
- L Lexik / Ausdruck: 0–3
- F Formale Richtigkeit: 0–5
- A Aufgabenerfüllung (Abzug): 0 (alle Punkte behandelt), -1, -2, -3 (je fehlender/unzureichender Punkt) oder "nb" (nicht bewertbar: Thema verfehlt, viel zu kurz, auswendig gelernt)
Richtwert: circa 120 Wörter.
Aufgabe ({p.kind or 'ÖSD B2 Schreiben'}):
<<<
{p.task}
>>>
Text ({words} Wörter):
<<<
{p.text}
>>>
Antworte NUR mit JSON:
{{"K": 0-2, "T": 0-5, "L": 0-3, "F": 0-5, "A": 0 | -1 | -2 | -3 | "nb", "summary_fa": "Begründung auf Persisch, 2–3 Sätze",
"strengths_fa": ["bis zu 2 Stärken auf Persisch"], "improve_fa": ["die 3 wichtigsten Verbesserungen auf Persisch, konkret"]}}"""
    raw, model = await _llm(prompt, 2200)
    d = _json(raw)
    a = d.get("A")
    a = "nb" if str(a).strip().lower() in ("nb", "n.b.", "n. b.") else _int(a, -3, 0, 0)
    crit = {"K": _int(d.get("K"), 0, 2), "T": _int(d.get("T"), 0, 5), "L": _int(d.get("L"), 0, 3), "F": _int(d.get("F"), 0, 5), "A": a}
    pts = 0 if a == "nb" or 0 in (crit["K"], crit["T"], crit["L"], crit["F"]) else max(0, crit["K"] + crit["T"] + crit["L"] + crit["F"] + a)
    return {"exam": "oesd", "part": "writing", "words": words, "criteria": crit, "points": pts, "max": 15, **_common(d), "model": model}


async def _speaking(p: SimAssess, user: User) -> dict:
    safe_id = _safe_segment(p.recording_id, "invalid")
    if not safe_id or safe_id == "invalid":
        raise HTTPException(status_code=422, detail="recording_missing")
    user_dir = _user_directory(user.id)
    matches = list(user_dir.rglob(f"*-{safe_id}.*")) if user_dir.exists() else []
    if not matches or user_dir not in matches[0].resolve().parents:
        raise HTTPException(status_code=404, detail="Recording not found")
    keys = _groq_keys()
    if not keys:
        raise HTTPException(status_code=503, detail="No transcription provider configured")
    tr = await _transcribe(matches[0], keys[:5])
    transcript = str(tr.get("text", "")).strip()
    segs = tr.get("segments") or []
    duration = float(tr.get("duration") or (segs[-1]["end"] if segs else 0) or 0)
    pauses = sum(1 for a, b in zip(segs, segs[1:]) if float(b.get("start", 0)) - float(a.get("end", 0)) >= 1.5)
    words = len(re.findall(r"\w+", transcript))
    wpm = round(words / duration * 60) if duration > 5 else None
    meta = {"transcript": transcript[:4000], "duration": round(duration, 1), "words": words, "wpm": wpm, "long_pauses": pauses}
    if words < 8:
        empty = {"summary_fa": "صدای کافی برای ارزیابی پیدا نشد؛ دوباره و بلندتر ضبط کنید.", "strengths_fa": [], "improve_fa": []}
        if p.exam == "testdaf":
            return {"exam": "testdaf", "part": "speaking", **meta, "criteria": {}, "tdn": "unter TDN 3", **empty, "model": ""}
        return {"exam": "oesd", "part": "speaking", **meta, "criteria": {}, "points": 0, "max": 10, **empty, "model": ""}
    facts = f"({round(duration)} Sekunden, {words} Wörter, ca. {wpm or '?'} Wörter/Minute, {pauses} Pausen ≥ 1,5 s)"
    if p.exam == "testdaf":
        prompt = f"""Du bist erfahrene TestDaF-Bewerterin für den Prüfungsteil Sprechen. Bewerte EINE Aufgabe anhand der automatischen
Transkription {facts}. Kriterien: Behandlung der Aufgabe (Inhalt, Vollständigkeit), Flüssigkeit/Kohärenz, sprachliche Realisierung
(Wortschatz, Strukturen, Korrektheit). Aussprache kannst du nur indirekt einschätzen. Transkriptionsfehler (Zeichensetzung, Groß-/Kleinschreibung) ignorieren.
Zielniveau dieser Aufgabe: {p.target or 'TDN 4'}. Sei realistisch und streng wie in der echten Prüfung.
Aufgabe ({p.kind}):
<<<
{p.task}
>>>
Transkript:
<<<
{transcript}
>>>
Antworte NUR mit JSON:
{{"aufgabe": "unter TDN 3" | "TDN 3" | "TDN 4" | "TDN 5", "fluss": "…", "sprache": "…", "tdn": "Gesamt-TDN dieser Aufgabe",
"summary_fa": "Begründung auf Persisch, 2 Sätze", "strengths_fa": ["bis zu 2 Stärken auf Persisch"], "improve_fa": ["die 2–3 wichtigsten Verbesserungen auf Persisch"]}}"""
        raw, model = await _llm(prompt, 2200)
        d = _json(raw)
        crit = {"aufgabe": _tdn(d.get("aufgabe")), "fluss": _tdn(d.get("fluss")), "sprache": _tdn(d.get("sprache"))}
        return {"exam": "testdaf", "part": "speaking", **meta, "criteria": crit, "tdn": _tdn(d.get("tdn")), **_common(d), "model": model}
    prompt = f"""Du bist erfahrene ÖSD-Prüferin für das Zertifikat B2 (mündliche Prüfung). Bewerte EINE Aufgabe anhand der automatischen
Transkription {facts} mit 0–10 Punkten. Kriterien: Aufgabenerfüllung, Flüssigkeit/Kohärenz, Wortschatz, grammatische Richtigkeit,
Aussprache (nur indirekt einschätzbar), Interaktion (im Simulator spricht die Person allein – bewerte, ob sie auf die Gesprächssituation eingeht).
Bestehensgrenze gesamt: 18 von 30 (also ca. 6 pro Aufgabe). Transkriptionsfehler ignorieren. Sei realistisch.
Aufgabe ({p.kind}):
<<<
{p.task}
>>>
Transkript:
<<<
{transcript}
>>>
Antworte NUR mit JSON:
{{"points": 0-10, "aufgabe": 0-10, "fluss": 0-10, "wortschatz": 0-10, "grammatik": 0-10,
"summary_fa": "Begründung auf Persisch, 2 Sätze", "strengths_fa": ["bis zu 2 Stärken auf Persisch"], "improve_fa": ["die 2–3 wichtigsten Verbesserungen auf Persisch"]}}"""
    raw, model = await _llm(prompt, 2000)
    d = _json(raw)
    crit = {k: _int(d.get(k), 0, 10, 5) for k in ("aufgabe", "fluss", "wortschatz", "grammatik")}
    return {"exam": "oesd", "part": "speaking", **meta, "criteria": crit, "points": _int(d.get("points"), 0, 10, 5), "max": 10, **_common(d), "model": model}


@router.post("/sim-assess")
async def sim_assess(payload: SimAssess, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    _quota(user)
    if payload.part == "writing":
        return await _writing(payload)
    return await _speaking(payload, user)
