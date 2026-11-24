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
# Inhaltliches Thema der Sätze (the learner picks one in the bot; key = id sent by the frontend).
THEMES: dict[str, str] = {
    "alltag": "Alltag und Tagesablauf",
    "studium": "Studium und Universität",
    "beruf": "Beruf und Arbeitsleben",
    "familie": "Familie und Zusammenleben",
    "wohnen": "Wohnen und Miete",
    "reisen": "Reisen und Urlaub",
    "verkehr": "Verkehr und Mobilität",
    "gesundheit": "Gesundheit und Arztbesuche",
    "ernaehrung": "Ernährung und Essgewohnheiten",
    "umwelt": "Umwelt und Klimaschutz",
    "digital": "Digitalisierung und Internet",
    "ki": "Künstliche Intelligenz",
    "medien": "Medien und Nachrichten",
    "wirtschaft": "Wirtschaft und Geld",
    "bildung": "Bildung und Schule",
    "kultur": "Kultur, Musik und Kino",
    "sport": "Sport und Freizeit",
    "behoerde": "Ämter und Bürokratie",
    "einkaufen": "Einkaufen und Konsum",
}

GEN_SYSTEM = """Du erstellst Übersetzungsübungen Persisch→Deutsch für persischsprachige Deutschlernende (B1–C1, Ziel TestDaF).
Wichtig: "de" und "fa" müssen DENSELBEN Satz ausdrücken. Arbeite jede Übung in dieser Reihenfolge ab:
1) Baue zuerst einen natürlichen, fehlerfreien deutschen Satz mit 7–15 Wörtern und HÖCHSTENS einem Nebensatz (keine verschachtelten "dass … oder ob"-Konstruktionen) mit der Zielgrammatik. Prüfe Kongruenz (Subjekt↔Verb, Artikel, Adjektivendungen, Kasus), Verbstellung und Zeitform.
   Der Satz muss heutiges ALLTAGSDEUTSCH sein: genau so, wie eine normale Person in Deutschland ihn heute sagen oder schreiben würde — aus typischen Situationen wie Wohnen, Arbeit, Ausbildung/Studium, Arzt, Termin und Amt, Einkaufen, Verkehr, Familie, Kurs und Freizeit.
   - Nimm die gebräuchlichsten Wörter und festen Wendungen (z. B. „einen Termin vereinbaren", „Bescheid geben", „sich um etwas kümmern", „es lohnt sich", „auf dem Weg zur Arbeit").
   - KEINE seltenen, literarischen, gestelzten oder behördlich-formelhaften Wörter, die im Alltag niemand benutzt; kein Nominalstil, wo ein normales Verb üblich ist; keine unnötig komplizierte Wortstellung.
   - KEINE künstlichen Lehrbuchsätze, keine erfundenen Statistiken oder Zahlen, keine ungewöhnlichen Namen oder Orte, keine Sätze, die nur konstruiert wirken, um eine Grammatik unterzubringen.
   - Frage dich bei jedem Satz: Würde ein normaler Mensch diesen Satz diese Woche wirklich brauchen? Wenn nicht, formuliere alltäglicher.
   - Ein Satz = ein Gedanke: verbinde nicht zwei verschiedene Aussagen mit „und"/„aber" (nicht „Ich bewerbe mich um die Wohnung und stelle mir vor, dass …"), keine künstlich gegenübergestellten Halbsätze („Heute …, gestern …") — außer die Wendung ist im Alltag genau so üblich (z. B. „Ich stehe auf und frühstücke.").
   - Ziehe das alltägliche Verb der förmlichen Alternative vor: bekommen statt erhalten, sagen statt äußern, helfen statt unterstützen, machen statt durchführen, zeigen statt darlegen, brauchen statt benötigen.
2) Übersetze GENAU DIESEN Satz ins Persische: gleiche Person, gleiche Zahl, gleiche Zeit, gleiche Negation, dieselben Objekte/Orte/Mengen, kein Zusatz, keine Auslassung. Natürliches, heute gebräuchliches Persisch (nicht literarisch), keine deutsche Wortstellung, keine deutschen Wörter.
3) Schreibe "back": eine wörtliche Wort-für-Wort-Rückübersetzung des persischen Satzes ins Deutsche, in der Reihenfolge des persischen Satzes (darf ungrammatisch klingen; ist nur die Prüfung, nicht die Lösung).
4) Prüfe still: Ergeben "de" und "back" denselben Inhalt? Weicht Person, Zeit, Negation, Zahl oder ein Objekt ab, korrigiere zuerst "fa", dann "de" und wiederhole 2–4. Erst danach ausgeben.
Lässt sich ein Inhalt nicht deckungsgleich in beiden Sprachen formulieren, nimm einen einfacheren – aber weiterhin alltäglichen – Satz.
Antworte NUR mit JSON: {"items":[{"topic":"<id>","de":"…","fa":"…","back":"…","alt":["…"],"hint":"…"}]}
- "alt": 0–2 weitere korrekte DEUTSCHE Übersetzungen genau desselben Inhalts mit derselben Zielgrammatik (nur Wortstellung oder Synonym; keine Umschreibung, kein Zusatz) — ebenfalls in Alltagssprache.
- "hint": sehr kurzer Hinweis AUF PERSISCH in persischer Schrift (max. 8 Wörter), deutsche Signalwörter erlaubt, fachlich korrekt.
- Alle Sätze verschieden in Wortschatz, Person und Variante der Grammatik — aber alle im heutigen, gebräuchlichen Alltagsdeutsch."""

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
    theme: str = Field(default="", max_length=60)

    @field_validator("theme")
    @classmethod
    def clean_theme(cls, value: str) -> str:
        # known id (THEMES) or a free-text theme the learner typed in the bot
        text = re.sub(r'[<>«»"„“”`]', " ", str(value or ""))
        return re.sub(r"\s+", " ", text).strip()[:60]

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


class TranslateRequest(BaseModel):
    fa: str = Field(min_length=1, max_length=600)


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
                                                    accept=_ok, temperature=0.45, effort=effort, busy_message="AI is busy right now")
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
                body = {"model": model, "messages": messages, "temperature": 0.45, "max_completion_tokens": max_tokens,
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


_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
_DE_NEG = re.compile(r"\b(nicht|kein\w*|nichts|nie|niemals|ohne|weder)\b", re.I)
_FA_NEG = re.compile(r"نمی|نه\b|نیست|نیستم|نیستند|نیستیم|هیچ|بدون|هرگز|نخواه|نکرد|نرفت|ندارد|ندارند|نبود|نشد")
_DE_WORD = re.compile(r"[a-zäöüß]{3,}", re.I)
_DE_STOP = {
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
    "und", "oder", "aber", "sondern", "dass", "ob", "weil", "wenn", "als", "wie", "auch", "noch",
    "nicht", "kein", "keine", "keinen", "keinem", "keiner", "nur", "sehr", "schon", "sich", "ich",
    "du", "er", "sie", "es", "wir", "ihr", "man", "mir", "mich", "dir", "dich", "ihm", "ihn",
    "uns", "euch", "ihnen", "mein", "dein", "sein", "unser", "euer", "dieser", "diese", "dieses",
    "hat", "haben", "habe", "hatte", "hatten", "ist", "sind", "war", "waren", "bin", "bist", "seid",
    "wird", "werden", "wurde", "wurden", "worden", "kann", "können", "muss", "müssen", "soll",
    "sollen", "will", "wollen", "darf", "dürfen", "möchte", "möchten", "zu", "zum", "zur", "im",
    "in", "am", "an", "auf", "aus", "bei", "mit", "nach", "von", "vor", "für", "über", "unter",
    "durch", "gegen", "ohne", "um", "bis", "seit", "während", "wegen", "trotz", "dort", "hier",
}


def _numbers(text: str) -> list[str]:
    return sorted(re.findall(r"\d+", text.translate(_FA_DIGITS)))


def _negated(text: str, persian: bool) -> bool:
    if persian:
        return bool(_FA_NEG.search(text.replace("\u200c", "")))
    return bool(_DE_NEG.search(text))


def _stems(text: str) -> set[str]:
    return {w[:4] for w in _DE_WORD.findall(text.lower()) if w not in _DE_STOP}


def _pair_consistent(fa: str, de: str, back: str = "") -> bool:
    """Cheap semantic gate: no sentence may add/drop a negation or a number, and the literal
    back-translation of the Persian sentence must share the content words of the German one."""
    de_words, fa_words = len(_DE_WORD.findall(de)), len(re.findall(r"\S+", fa))
    if not 6 <= de_words <= 22 or fa_words < 4 or fa_words > 28:
        return False
    if _numbers(fa) != _numbers(de):
        return False
    if _negated(fa, True) != _negated(de, False):
        return False
    if back:
        de_stems, back_stems = _stems(de), _stems(back)
        if de_stems and back_stems and len(de_stems & back_stems) / len(de_stems) < 0.4:
            return False
    return True


def _clean_items(data: dict, topics: list[str]) -> list[dict]:
    good: list[dict] = []
    weak: list[dict] = []
    for raw in data.get("items") or []:
        if not isinstance(raw, dict):
            continue
        fa, de = str(raw.get("fa") or "").strip(), str(raw.get("de") or "").strip()
        topic = str(raw.get("topic") or "").strip()
        if topic not in topics:
            topic = topics[0] if len(topics) == 1 else ""
        if not topic or not _has_persian(fa) or not de or len(de) > 300 or len(fa) > 400 or _has_persian(de):
            continue
        if len(de.split()) > 20:
            continue  # too long to sound like everyday German
        back = str(raw.get("back") or "").strip()
        if _has_persian(back):
            back = ""
        alt = [str(a).strip()[:300] for a in (raw.get("alt") or [])
               if isinstance(a, str) and a.strip() and not _has_persian(a, 1)
               and _pair_consistent(fa, str(a).strip())][:2]
        hint = str(raw.get("hint") or "").strip()[:90]
        item = {"topic": topic, "fa": fa, "de": de, "alt": alt, "hint": hint if _has_persian(hint, 3) else ""}
        (good if _pair_consistent(fa, de, back) else weak).append(item)
    # never return an empty batch: if every pair failed the gate, keep the originals (frontend falls back otherwise)
    return good or weak


AUDIT_SYSTEM = """Du prüfst persisch-deutsche Übungspaare streng als Deutschlehrer. Für jedes Paar:
(a) Ist der deutsche Satz fehlerfrei? Prüfe Kasus (Verb-/Präpositionsrektion), Endungen, Kongruenz, Verbstellung, Zeitform, Trennbarkeit. Ein Satz mit Rektionsfehler (z. B. „dankte die Mitarbeiter" statt „dankte den Mitarbeitern") ist NICHT fehlerfrei.
(b) Drücken "de" und "fa" genau denselben Inhalt aus? Gleiche Person, Zahl, Zeit, Negation, dieselben Objekte, Orte und Mengen — kein Zusatz, keine Auslassung.
(c) Ist das Persische natürliches Persisch ohne deutsche Wörter, ohne Doppelbedeutung und ohne störende Wiederholungen — und ist jedes persische Wort die richtige Entsprechung (nicht «داده‌ها» für „Datenbanken", nicht «ارتقاء» für „Fortbildung"); ist der persische Satz grammatisch korrekt (richtige Präpositionen, korrekte Verwendung von را/به/در, keine fehlenden Satzteile)?
(d) Ist der deutsche Satz heutiges Alltagsdeutsch — ein Satz, den eine normale Person in Deutschland heute wirklich sagen oder schreiben würde? Ersetze seltene, literarische, gestelzte oder rein konstruierte Formulierungen (auch unnötigen Nominalstil, erfundene Zahlen und künstliche Lehrbuchsätze) durch die gebräuchliche Alltagsformulierung (auch förmliche Verben durch alltägliche ersetzen: erhalten→bekommen, äußern→sagen, benötigen→brauchen, durchführen→machen); Zielgrammatik, Person, Zeit und Inhalt bleiben erhalten.
Ist alles in Ordnung: Satz unverändert zurückgeben ("ok": true). Sonst korrigieren: erst den deutschen Satz (bei (d) ruhig ganz neu, aber alltäglich und mit derselben Zielgrammatik), dann die persische Übersetzung passend dazu; Zielgrammatik und Thema bleiben.
Antworte NUR mit JSON: {"items":[{"i":<Index aus der Eingabe>,"de":"…","fa":"…","ok":true|false}]}
- genau ein Eintrag pro Eingabesatz, keine Erklärungen, keine weiteren Felder."""


async def _audit_items(items: list[dict], topics: list[str]) -> list[dict]:
    """Second pass: a strict editor fixes case/agreement errors and Persian↔German meaning drift.
    Best effort — if the editor is unavailable the generated pairs are returned unchanged."""
    if not items:
        return items
    rows = [{"i": i, "topic": it["topic"], "de": it["de"], "fa": it["fa"]} for i, it in enumerate(items)]
    messages = [{"role": "system", "content": AUDIT_SYSTEM},
                {"role": "user", "content": json.dumps(rows, ensure_ascii=False)}]
    try:
        data, _model = await _json_complete(messages, max_tokens=1800, effort="medium", budget=10.0,
                                            accept=lambda d: bool(d.get("items")))
    except Exception:  # noqa: BLE001 - audit is optional, never break the exercise
        log.warning("grammar drill: audit pass skipped", exc_info=True)
        return items
    out = list(items)
    for row in data.get("items") or []:
        if not isinstance(row, dict):
            continue
        try:
            index = int(row.get("i"))
        except (TypeError, ValueError):
            continue
        if not 0 <= index < len(items):
            continue
        de = str(row.get("de") or "").strip() or items[index]["de"]
        fa = str(row.get("fa") or "").strip() or items[index]["fa"]
        if len(de) > 300 or len(fa) > 400 or _has_persian(de) or not _has_persian(fa) or not _pair_consistent(fa, de):
            continue
        out[index] = dict(items[index], de=de, fa=fa)
    return out


@router.post("/sentences")
async def sentences(payload: SentenceRequest, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    _rate_limit(user)
    theme = THEMES.get(payload.theme, payload.theme)
    # The meaning gate drops pairs that drift, so ask for a couple more and top up once:
    # the learner should always get the full batch of everyday sentences.
    items: list[dict] = []
    seen: set[str] = set()
    model = ""
    for round_index in range(2):
        need = payload.count - len(items)
        if need <= 0:
            break
        ask = min(6, need + 2)
        picks = [random.choice(payload.topics) for _ in range(ask)]
        plan = "\n".join(
            f"{i + 1}. topic \"{t}\": {TOPICS[t]} — Thema: {theme or random.choice(list(THEMES.values()))}"
            for i, t in enumerate(picks)
        )
        user_msg = f"Erstelle genau {ask} Übungen, in dieser Reihenfolge:\n{plan}"
        if theme:
            user_msg += (f"\nALLE Sätze sollen inhaltlich klar zum Thema „{theme}\" passen: typische Situationen, "
                         "Personen und Wortschatz genau dieses Themas, ohne den Satz künstlich zu wirken.")
        avoid = list(payload.avoid[-12:]) + [it["fa"] for it in items]
        if avoid:
            user_msg += "\nNicht wiederholen (schon geübt): " + " | ".join(avoid[-14:])
        messages = [{"role": "system", "content": GEN_SYSTEM}, {"role": "user", "content": user_msg}]
        try:
            data, model = await _json_complete(messages, max_tokens=4000, effort="medium",
                                               budget=22.0 if round_index == 0 else 8.0,
                                               accept=lambda d: bool(_clean_items(d, payload.topics)))
        except Exception:  # noqa: BLE001 - a failed top-up must not throw away the sentences we already have
            if not items:
                raise
            log.warning("grammar drill: top-up round skipped", exc_info=True)
            break
        for item in _clean_items(data, payload.topics):
            if item["fa"] in seen:
                continue
            seen.add(item["fa"])
            items.append(item)
            if len(items) >= payload.count:
                break
    items = await _audit_items(items[:payload.count], payload.topics)
    return {"items": items[:payload.count], "model": model, "theme": payload.theme}


TRANSLATE_SYSTEM = """Du übersetzt persische Sätze von Deutschlernenden natürlich und grammatisch korrekt ins Deutsche.
Bleibe nah am Inhalt, benutze Alltagsdeutsch auf dem Niveau B1–C1, keine Erklärungen, keine Transliteration.
Antworte NUR mit JSON: {"de":"…"}
"""


@router.post("/translate")
async def translate(payload: TranslateRequest, user: User = Depends(get_current_user)) -> dict:
    require_premium(user)
    _rate_limit(user)
    messages = [{"role": "system", "content": TRANSLATE_SYSTEM},
                {"role": "user", "content": f"Persischer Text: {payload.fa}"}]

    def accept(d: dict) -> bool:
        return bool(str(d.get("de") or "").strip())
    data, model = await _json_complete(messages, max_tokens=800, effort="low", budget=20.0, accept=accept)
    de = str(data.get("de") or "").strip()[:600]
    if not de:
        raise ai_guard.unavailable(60, "AI is busy right now")
    return {"de": de, "model": model}


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
