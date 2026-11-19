"""SENT-PARTS (2026-11-15, owner): colour the structure of German sentences in favourites, the phrase notebook
and the mistakes list. The AI splits each sentence into Satzglieder; results are validated against the original
text and cached in Redis (shared, 180 days). Premium only; the frontend colours offline with rules otherwise."""
from __future__ import annotations

import difflib
import hashlib
import json
import logging
import re
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api import ai_guard
from app.api.access import require_premium
from app.api.middleware.auth import get_current_user
from app.domain.models.models import User

router = APIRouter()
log = logging.getLogger(__name__)

ROLES = {"S", "V", "O", "P", "K", "X"}
CACHE_PREFIX = "amookht:sp:v1:"
CACHE_TTL = 180 * 86400
MAX_BATCH = 12
_calls: dict[str, list[float]] = defaultdict(list)

SYSTEM = """Du zerlegst deutsche Sätze und Wortgruppen für persischsprachige Deutschlernende in Satzglieder.
Für jeden Eintrag gib die Segmente in exakt der Originalreihenfolge und exakt der Originalschreibweise zurück; aneinandergereiht ergeben sie den ganzen Text (Leerzeichen zwischen Segmenten werden ignoriert). Nichts weglassen, nichts ändern, nichts hinzufügen.
Rollen:
S = Subjekt (die ganze Nominalgruppe bzw. das Pronomen im Nominativ)
V = jeder Verbteil als eigenes Segment: finites Verb, Hilfs- und Modalverb, Partizip, Infinitiv, abgetrenntes Verbpräfix, "zu" beim zu-Infinitiv, Reflexivpronomen "sich" gehört zu V
O = Objekte und Prädikative (Akkusativ-, Dativ-, Genitivobjekt, Prädikativ nach sein/werden/bleiben; die ganze Nominalgruppe mit Artikel und Adjektiv)
P = Präpositionalgruppen und adverbiale Angaben (Zeit, Ort, Art, Grund), z. B. "in der Praxis", "seit drei Jahren", "heute"
K = Konnektoren, Subjunktionen, Relativ- und Fragewörter am Satz- oder Nebensatzanfang (und, aber, denn, weil, dass, obwohl, wenn, um, der/die/das als Relativpronomen, deshalb)
X = alles andere (nicht, Partikeln, Satzzeichen – jedes Satzzeichen als eigenes X-Segment)
Wortgruppe ohne Verb (z. B. "Personalmangel in der Praxis"): Nominalgruppe = O, Präpositionalgruppe = P.
Antworte NUR mit JSON: {"items":[{"i":0,"seg":[["Text","R"],...]}]} – ein Item pro Eintrag, i = Index des Eintrags."""


class PartsRequest(BaseModel):
    sentences: list[str] = Field(min_length=1, max_length=MAX_BATCH)

    @field_validator("sentences")
    @classmethod
    def clean(cls, value: list[str]) -> list[str]:
        out = []
        for s in value:
            s = re.sub(r"\s+", " ", str(s or "")).strip()
            if 2 <= len(s) <= 300 and s not in out:
                out.append(s)
        if not out:
            raise ValueError("No usable sentence")
        return out


def _key(sentence: str) -> str:
    return CACHE_PREFIX + hashlib.sha1(sentence.encode("utf-8")).hexdigest()


_TOK = re.compile(r"[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*|\d+(?:[.,]\d+)*%?|[^\sA-Za-zÄÖÜäöüß\d]")


def _same(a: str, b: str) -> bool:
    a, b = a.lower(), b.lower()
    if a == b:
        return True
    if not a[:1].isalpha() or a[:1] != b[:1]:
        return False
    return difflib.SequenceMatcher(None, a, b).ratio() >= 0.6


def align(sentence: str, seg) -> list[list[str]] | None:
    """Validate AI segments word by word against the sentence (in order, covering every word; small spelling slips
    of the model are tolerated) and return [[original text, role], ...] — always the ORIGINAL spelling — or None."""
    if not isinstance(seg, list) or not seg:
        return None
    toks = [(m.group(0), m.start(), m.end()) for m in _TOK.finditer(sentence)]
    pos, out = 0, []
    for item in seg:
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            return None
        text, role = str(item[0] or "").strip(), str(item[1] or "").strip().upper()[:1]
        words = _TOK.findall(text)
        if not words:
            continue
        if role not in ROLES:
            role = "X"
        if pos + len(words) > len(toks) or not all(_same(w, toks[pos + i][0]) for i, w in enumerate(words)):
            return None
        out.append([sentence[toks[pos][1]:toks[pos + len(words) - 1][2]], role])
        pos += len(words)
    if pos != len(toks) or not out:
        return None
    return out


def _rate_limit(user: User, n: int) -> None:
    now = time.time()
    calls = [t for t in _calls[user.id] if now - t < 86400]
    if sum(1 for t in calls if now - t < 60) >= 120:
        raise HTTPException(status_code=429, detail="Too many requests in a minute")
    if len(calls) >= 4000:
        raise HTTPException(status_code=429, detail="Daily limit reached")
    calls.extend([now] * n)
    _calls[user.id] = calls


async def _cache_get(sentences: list[str]) -> dict[str, list]:
    try:
        r = ai_guard._client()
        vals = await r.mget([_key(s) for s in sentences])
        return {s: json.loads(v) for s, v in zip(sentences, vals) if v}
    except Exception:  # noqa: BLE001 - cache is optional
        return {}


async def _cache_put(found: dict[str, list]) -> None:
    try:
        r = ai_guard._client()
        for s, seg in found.items():
            await r.set(_key(s), json.dumps(seg, ensure_ascii=False), ex=CACHE_TTL)
    except Exception:  # noqa: BLE001
        pass


@router.post("")
async def sentence_parts(payload: PartsRequest, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    sentences = payload.sentences
    results: dict[str, list | None] = await _cache_get(sentences)
    missing = [s for s in sentences if s not in results]
    if missing:
        _rate_limit(user, len(missing))
        from app.api.routes.grammar_drill import _json_complete  # shares the grammar AI route (Groq → NVIDIA, owner routing)
        listing = "\n".join(f"{i}: {s}" for i, s in enumerate(missing))

        def accept(data: dict) -> bool:
            return isinstance(data.get("items"), list) and len(data["items"]) > 0

        try:
            data, _model = await _json_complete(
                [{"role": "system", "content": SYSTEM}, {"role": "user", "content": listing}],
                max_tokens=500 + 260 * len(missing), effort="low", budget=40.0, accept=accept)
        except HTTPException:
            raise
        except Exception:  # noqa: BLE001
            log.exception("sentence parts: AI call failed")
            raise ai_guard.unavailable(60, "AI is busy right now")
        found: dict[str, list] = {}
        for item in data.get("items") or []:
            if not isinstance(item, dict):
                continue
            try:
                i = int(item.get("i"))
            except (TypeError, ValueError):
                continue
            if 0 <= i < len(missing):
                seg = align(missing[i], item.get("seg"))
                if seg:
                    found[missing[i]] = seg
        await _cache_put(found)
        for s in missing:
            results[s] = found.get(s)
    return {"results": {s: results.get(s) for s in sentences}}
