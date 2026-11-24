"""Deutsch Coach v3 — premium conversation coach inside Amookht (learn.tah3in.com/coach/).

Auth: every learner endpoint needs the learner's Amookht access token; the token is
checked against the Amookht backend (/v1/account/me) and only premium/admin/owner
accounts are allowed. Learner data (mistakes, favourites, custom coaches, daily
progress) is stored per Amookht user in a local SQLite file.
"""
import asyncio
import hashlib
import io
import json
import logging
import os
import re
import sqlite3
import threading
import time
import wave
from collections import OrderedDict, deque
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from openai import APIConnectionError, APIStatusError, APITimeoutError, BadRequestError, OpenAI, RateLimitError
from pydantic import BaseModel, Field, field_validator

try:  # neural voices (primary)
    import edge_tts
except Exception:  # pragma: no cover
    edge_tts = None

try:  # local fallback voice
    from piper import PiperVoice, SynthesisConfig
except Exception:  # pragma: no cover
    PiperVoice = SynthesisConfig = None


VERSION = "3.0.0"
ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
LOGS = Path(os.getenv("COACH_LOG_DIR", str(ROOT / "logs")))
DATA = Path(os.getenv("COACH_DATA_DIR", str(ROOT / "data")))
TTS_CACHE = DATA / "tts-cache"
LISTEN_CACHE = DATA / "listening"
for folder in (LOGS, DATA, TTS_CACHE, LISTEN_CACHE):
    folder.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.FileHandler(LOGS / "deutsch-coach.log", encoding="utf-8"), logging.StreamHandler()],
)
log = logging.getLogger("deutsch-coach")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("piper").setLevel(logging.ERROR)

AMOOKHT_API = os.getenv("AMOOKHT_API", "http://127.0.0.1:8200/v1").rstrip("/")
GROQ_BASE = "https://api.groq.com/openai/v1"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_FALLBACK_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
GROQ_STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
GROQ_KEYS_FILE = Path(os.getenv("GROQ_KEYS_FILE", str(ROOT / "groq_keys.txt")))
PIPER_MODEL = Path(os.getenv("PIPER_MODEL", str(ROOT / "models" / "de_DE-ramona-low.onnx")))
DB_PATH = DATA / "coach.db"
PREMIUM_ROLES = {"premium", "admin", "owner"}
TTS_CACHE_MAX_BYTES = int(os.getenv("TTS_CACHE_MAX_MB", "150")) * 1024 * 1024
STATE_MAX_BYTES = 900 * 1024
MAX_SESSIONS = 400
MAX_HISTORY = 14

app = FastAPI(title="Deutsch Coach", version=VERSION, docs_url=None, redoc_url=None, openapi_url=None)


class AIUnavailable(RuntimeError):
    pass


def api_error(status: int, code: str, message: str, **extra) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message, **extra})


AI_DOWN_MESSAGE = "هوش مصنوعی الان شلوغ است؛ چند ثانیه دیگر دوباره امتحان کن."


# ───────────────────────── content ─────────────────────────
TESTDAF_SCENARIOS = [
    {"title": "Digitale Lehre an Hochschulen", "context": "Eine Universität möchte mehr Lehrveranstaltungen dauerhaft online anbieten.", "question": "Sollten Hochschulen Präsenzveranstaltungen teilweise durch digitale Lehre ersetzen?"},
    {"title": "Nebenjob während des Studiums", "context": "Viele Studierende arbeiten neben dem Studium, um ihren Lebensunterhalt zu finanzieren.", "question": "Welche Vor- und Nachteile hat ein Nebenjob für Studierende?"},
    {"title": "Künstliche Intelligenz im Studium", "context": "KI-Werkzeuge werden zunehmend für Recherche, Schreiben und Lernen eingesetzt.", "question": "Wie sollte der Einsatz von KI an Hochschulen geregelt werden?"},
    {"title": "Öffentlicher Verkehr für Studierende", "context": "In vielen Städten steigen die Kosten für Bus und Bahn.", "question": "Sollte der öffentliche Nahverkehr für Studierende kostenlos sein?"},
    {"title": "Auslandssemester", "context": "Immer mehr Hochschulen empfehlen ihren Studierenden einen Aufenthalt im Ausland.", "question": "Sollte ein Auslandssemester fester Bestandteil jedes Studiums sein?"},
    {"title": "Wohnraum in Universitätsstädten", "context": "Bezahlbare Wohnungen für Studierende werden in großen Städten immer knapper.", "question": "Welche Maßnahmen können den studentischen Wohnungsmangel lösen?"},
    {"title": "Anwesenheitspflicht", "context": "Einige Hochschulen diskutieren erneut eine verpflichtende Teilnahme an Seminaren.", "question": "Verbessert eine Anwesenheitspflicht den Studienerfolg?"},
    {"title": "Nachhaltiger Campus", "context": "Eine Universität will Energie sparen und ihren Campus klimafreundlicher gestalten.", "question": "Welche Umweltmaßnahmen sollte eine Hochschule zuerst umsetzen?"},
    {"title": "Prüfungen oder Projekte", "context": "Klassische Abschlussprüfungen werden zunehmend durch Gruppenprojekte ergänzt.", "question": "Sind Projekte eine bessere Leistungsbewertung als schriftliche Prüfungen?"},
    {"title": "Soziale Medien und Information", "context": "Junge Erwachsene informieren sich immer häufiger über soziale Netzwerke.", "question": "Welche Chancen und Risiken entstehen, wenn soziale Medien klassische Nachrichten ersetzen?"},
    {"title": "Vier-Tage-Woche", "context": "Unternehmen testen kürzere Arbeitswochen bei gleichem Gehalt.", "question": "Kann eine Vier-Tage-Woche Produktivität und Lebensqualität gleichzeitig verbessern?"},
    {"title": "Gesundheit im Studienalltag", "context": "Stress und psychische Belastung nehmen unter Studierenden zu.", "question": "Was sollten Hochschulen für die mentale Gesundheit ihrer Studierenden tun?"},
    {"title": "Studiengebühren", "context": "In einigen Bundesländern wird über die Wiedereinführung von Studiengebühren diskutiert.", "question": "Sollte ein Studium für alle gebührenfrei bleiben?"},
    {"title": "Englisch als Unterrichtssprache", "context": "Immer mehr Masterstudiengänge in Deutschland werden ausschließlich auf Englisch angeboten.", "question": "Sollten deutsche Hochschulen mehr Studiengänge auf Englisch anbieten?"},
    {"title": "Homeoffice nach dem Studium", "context": "Viele Berufseinsteiger wünschen sich, überwiegend von zu Hause aus zu arbeiten.", "question": "Ist dauerhaftes Homeoffice für junge Berufstätige eher Chance oder Risiko?"},
    {"title": "Fleischkonsum in Mensen", "context": "Mehrere Studierendenwerke reduzieren das Fleischangebot in ihren Mensen deutlich.", "question": "Sollten Mensen vor allem vegetarische Gerichte anbieten?"},
    {"title": "Smartphones im Seminar", "context": "Dozierende beklagen, dass Studierende im Seminar ständig auf ihr Handy schauen.", "question": "Sollten Smartphones in Lehrveranstaltungen verboten werden?"},
    {"title": "Ehrenamt und Studium", "context": "Ehrenamtliches Engagement wird bei Bewerbungen immer häufiger positiv bewertet.", "question": "Sollte soziales Engagement im Studium mit Credits belohnt werden?"},
    {"title": "Fachkräftemangel", "context": "Deutschland sucht in vielen Branchen dringend qualifizierte Fachkräfte aus dem Ausland.", "question": "Wie kann Deutschland internationale Fachkräfte langfristig gewinnen und halten?"},
    {"title": "Lebenslanges Lernen", "context": "Berufliche Anforderungen verändern sich durch die Digitalisierung immer schneller.", "question": "Wer sollte die Verantwortung für Weiterbildung tragen: Arbeitnehmer oder Arbeitgeber?"},
    {"title": "Fahrrad statt Auto", "context": "Städte bauen Radwege aus und reduzieren Parkplätze in der Innenstadt.", "question": "Sollten Innenstädte für private Autos weitgehend gesperrt werden?"},
    {"title": "Open Access in der Wissenschaft", "context": "Viele Forschungsergebnisse sind nur gegen Bezahlung in Fachzeitschriften zugänglich.", "question": "Sollten öffentlich finanzierte Forschungsergebnisse kostenlos verfügbar sein?"},
    {"title": "Gruppenarbeit im Studium", "context": "In vielen Studiengängen werden Noten zunehmend für Gruppenleistungen vergeben.", "question": "Ist Gruppenarbeit eine faire Form der Leistungsbewertung?"},
    {"title": "Bibliothek oder Zuhause lernen", "context": "Universitätsbibliotheken verlängern ihre Öffnungszeiten, obwohl viele Studierende digital lernen.", "question": "Brauchen Hochschulen in Zukunft noch große Bibliotheken?"},
    {"title": "Tempolimit auf Autobahnen", "context": "Deutschland ist eines der wenigen Länder ohne generelles Tempolimit auf Autobahnen.", "question": "Sollte in Deutschland ein allgemeines Tempolimit eingeführt werden?"},
    {"title": "Praktika im Studium", "context": "Pflichtpraktika verlängern oft die Studienzeit, bieten aber wichtige Berufserfahrung.", "question": "Sollten Praktika in allen Studiengängen verpflichtend sein?"},
    {"title": "Online-Shopping und Innenstädte", "context": "Immer mehr Geschäfte in Innenstädten schließen, weil Kunden online einkaufen.", "question": "Wie können Innenstädte trotz Online-Handel lebendig bleiben?"},
    {"title": "Schlaf und Leistung", "context": "Studien zeigen, dass viele Studierende in Prüfungsphasen deutlich zu wenig schlafen.", "question": "Wie können Studierende Lernen und Erholung besser in Einklang bringen?"},
    {"title": "Plagiate und Ghostwriting", "context": "Durch KI und kommerzielle Anbieter wird es leichter, fremde Texte als eigene auszugeben.", "question": "Wie sollten Hochschulen auf neue Formen des Betrugs reagieren?"},
    {"title": "Mehrsprachigkeit", "context": "Viele Unternehmen erwarten heute Kenntnisse in mindestens zwei Fremdsprachen.", "question": "Sollte jeder Studiengang verpflichtend eine Fremdsprache enthalten?"},
]

SCENARIO_TASKS = {
    "current": "Führe ein natürliches Gespräch über das Thema und hilf, eine persönliche Position klar auszudrücken.",
    "speaking": "Simuliere eine TestDaF-Sprechaufgabe: Position nennen, zwei Gründe geben und ein Gegenargument beantworten.",
    "listening": "Höre den Hörtext zum Thema, fasse ihn zusammen, beantworte Verständnisfragen und lerne danach die wichtigsten Wendungen.",
    "writing": "Trainiere eine TestDaF-Schreibaufgabe mit Einleitung, Argumentation, Vergleich und begründetem Schluss.",
    "kumpel": "Quatsch einfach locker über den Alltag: was heute los ist, deine Meinung, Pläne, Wochenende.",
}

SYSTEM_PROMPT = """Du bist ein muttersprachlicher Deutschcoach für persischsprachige Lernende (Ziel: TestDaF / flüssiges Deutsch).
Deine Antwort wird laut vorgelesen: schreibe gesprochenes, natürliches Deutsch, ohne Listen, ohne Emojis, ohne Markdown, ohne Klammern.

Prüfe jede Nachricht des Lernenden in drei Schritten:
1. Grammatik und sachliche Korrektheit.
2. Natürlichkeit: Ist die Formulierung im heutigen Deutsch üblich?
3. Setze das Gespräch fort: reagiere zuerst inhaltlich auf das Gesagte, dann genau eine passende Frage oder Aufgabe.

Felder des JSON-Objekts:
- grammar_ok, natural_ok: boolean.
- corrected_de: grammatisch korrigierte Fassung, sonst unveränderter Originalsatz.
- natural_de: die gebräuchlichste natürliche Formulierung mit derselben Bedeutung.
- explanation_fa: eine sehr kurze, verständliche Erklärung vollständig auf Persisch; deutsche Wörter nur als zitierte Beispiele in «» (bei korrekten Sätzen ein kurzes Lob).
- encouragement_fa: ein kurzer motivierender Satz auf Persisch.
- reply_de: deine gesprochene Antwort auf Deutsch (Länge siehe Modus), der letzte Satz ist genau eine Frage oder Aufgabe.
- memory_worthy: true nur bei echten Grammatikfehlern oder wichtigen Wortschatz-, Satzbau- oder deutlich unnatürlichen Ausdrucksproblemen. Tippfehler, harmlose Rechtschreibung, Zeichensetzung oder Leerzeichen nie.
- error_type: genau grammar, vocabulary, sentence_structure, naturalness oder none.
- memory_priority: high, medium, low oder none.
- memory_note_fa: die lernrelevante Regel sehr kurz auf Persisch.
Gib ausschließlich ein gültiges JSON-Objekt zurück."""

COACHES = {
    "current": {
        "name": "Deutsch Coach", "role": "Conversation Partner", "initials": "DC", "accent": "#8b6cff",
        "voice": "de-DE-SeraphinaMultilingualNeural",
        "intro": "Ein persönlicher Gesprächspartner für natürliches Deutsch und sanfte Korrekturen.",
        "greeting": "Schön, dass du da bist! Worüber möchtest du heute sprechen?",
        "focus": "Freies Gespräch, natürliche Formulierungen und sanfte Korrektur",
        "prompt": "Du bist ein freundlicher, muttersprachlicher Deutschcoach und Gesprächspartner. Antworte kurz, warm, menschlich und gesprächsorientiert. Zeige echtes Interesse an der Person. Korrigiere knapp und setze das Gespräch mit genau einer passenden Frage fort. Verwandle die Unterhaltung nicht ungefragt in eine Lektion.",
    },
    "speaking": {
        "name": "Lena", "role": "Speaking Tutor", "initials": "LE", "accent": "#ff7a8a", "avatar": "avatars/lena.png",
        "voice": "de-DE-AmalaNeural",
        "intro": "Wir sprechen aktiv, kurz und natürlich. Du formulierst immer zuerst, gern per Mikrofon.",
        "greeting": "Hallo! Sprich heute 30 Sekunden über deinen Morgen. Was hast du gemacht?",
        "focus": "Sprechen, Aussprache, Satzbau und spontane Reaktion",
        "prompt": "Du bist Lena, eine energische Sprechtrainerin. Führe Übungen statt Vorlesungen durch. Stelle genau eine Frage und warte. Korrigiere nur die wichtigsten Fehler und fordere regelmäßig Antworten von 1 bis 3 Minuten. Bewerte Satzbau, Natürlichkeit und Zusammenhang. Gib zuerst Gelegenheit zur Selbstkorrektur.",
    },
    "listening": {
        "name": "Jonas", "role": "Listening Tutor", "initials": "JO", "accent": "#36d6c4", "avatar": "avatars/jonas.png",
        "voice": "de-DE-FlorianMultilingualNeural",
        "intro": "Du hörst zuerst ohne Text. Das Transkript kommt erst nach deinem Versuch.",
        "greeting": "Ich habe einen Hörtext für dich vorbereitet. Hör zuerst nur zu und fasse danach die Hauptpunkte zusammen.",
        "focus": "Hören, Kernaussagen, natürliche Dialoge und Zusammenfassung",
        "prompt": "Du bist Jonas, ein ruhiger Hörverstehenstrainer. Der Hörtext des Tages steht im Kontext. Bitte zuerst um eine Zusammenfassung in drei bis fünf Sätzen, prüfe sie inhaltlich gegen den Hörtext (fehlende oder falsche Punkte benennen) und stelle danach genau eine gezielte Verständnisfrage pro Antwort. Verrate Lösungen erst nach einem Antwortversuch. Zum Abschluss erkläre zwei bis drei nützliche Wendungen aus dem Text.",
    },
    "writing": {
        "name": "Clara", "role": "Writing & TestDaF Tutor", "initials": "CL", "accent": "#f2b84b", "avatar": "avatars/clara.png",
        "voice": "de-DE-KatjaNeural",
        "intro": "Wir trainieren klare Texte, Argumentation und Schritt für Schritt TestDaF.",
        "greeting": "Heute schreiben wir präzise. Formuliere bitte eine kurze Meinung zu deinem aktuellen Thema.",
        "focus": "Schreiben, Argumentation, Grafiken und TestDaF",
        "prompt": "Du bist Clara, eine präzise Schreib- und TestDaF-Trainerin. Lass den Lernenden zuerst selbst schreiben. Achte auf Aufbau, Kohärenz, Konnektoren, Begründung, Vergleich und Schlussfolgerung. Nenne in reply_de die wichtigste Verbesserung und einen nützlichen Konnektor, dann die nächste Teilaufgabe. Gib nie sofort einen vollständigen Mustertext.",
    },
    "kumpel": {
        "name": "Emre", "role": "Kumpel · Alltagsdeutsch", "initials": "EM", "accent": "#ff9f45", "avatar": "avatars/emre.jpg",
        "voice": "de-DE-KillianNeural",
        "intro": "Einfach quatschen wie mit einem Kumpel: kurz, locker, mitten aus dem Alltag.",
        "greeting": "Na, alles klar bei dir? Was geht heute so?",
        "focus": "Alltagssprache, Slang, kurze Sätze und echtes Geplauder",
        "prompt": "Du bist Emre, ein lockerer Typ aus dem Kiez, Mitte zwanzig, und du redest mit dem Lernenden wie mit einem guten Kumpel. Sprich echte Umgangssprache: kurze Sätze, Alltagswörter und etwas Slang wie krass, Alter, Bock, chillen oder läuft bei dir, aber bleib verständlich. Rede über ganz normale Alltagssachen: Arbeit, Uni, Fußball, Essen, Wetter, Freunde, Wochenende, Geld, Stress, Musik. Reagiere zuerst menschlich auf das Gesagte, mit Meinung und Gefühl, und stelle dann genau eine lockere Frage zurück. Keine Lehrerrolle, keine Lektion, kein Szenario, keine Vorträge, keine Aufzählungen. reply_de: höchstens zwei kurze Sätze, wie eine Sprachnachricht an einen Freund. Korrigiere nur, wenn ein echter Fehler das Verstehen stört, und dann nur in den Korrekturfeldern, nie im Gesprächston. explanation_fa und encouragement_fa bleiben kurz, freundschaftlich und auf Persisch.",
    },
}

DAILY_PLANS = {
    "current": ["Ankommen", "Freies Gespräch", "Natürlich ausdrücken", "Kurze Korrektur", "Abschlussfrage"],
    "speaking": ["Warm-up", "Spontane Antwort", "Meinung & Begründung", "Rollenspiel", "Fehler-Recall"],
    "listening": ["Hörtext hören", "Zusammenfassung", "Verständnisfragen", "Transkript & Wendungen", "Nacherzählen"],
    "writing": ["Satz-Warm-up", "Struktur planen", "Text schreiben", "Gezielte Korrektur", "TestDaF-Challenge"],
    "kumpel": ["Ankommen", "Smalltalk", "Alltag", "Meinung", "Verabschieden"],
}

VOICES = {
    "de-DE-SeraphinaMultilingualNeural": "Seraphina · weiblich",
    "de-DE-AmalaNeural": "Amala · weiblich",
    "de-DE-KatjaNeural": "Katja · weiblich",
    "de-AT-IngridNeural": "Ingrid · weiblich (AT)",
    "de-DE-FlorianMultilingualNeural": "Florian · männlich",
    "de-DE-ConradNeural": "Conrad · männlich",
    "de-DE-KillianNeural": "Killian · männlich",
    "de-AT-JonasNeural": "Jonas · männlich (AT)",
}
DEFAULT_VOICE = "de-DE-SeraphinaMultilingualNeural"
LEVEL_RATE = {"A2": -12, "B1": -6, "B2": -2, "C1": 0}
LISTENING_VOICES = {"A": "de-DE-KatjaNeural", "B": "de-DE-ConradNeural"}
LISTENING_WORDS = {"A2": 240, "B1": 330, "B2": 450, "C1": 540}


# ───────────────────────── models ─────────────────────────
LEVEL_PATTERN = "^(A2|B1|B2|C1)$"
COACH_PATTERN = "^(current|speaking|listening|writing|kumpel|custom-[a-z0-9-]{6,50})$"


class ChatRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2400)
    session_id: str = Field(min_length=8, max_length=100)
    level: str = Field(default="B1", pattern=LEVEL_PATTERN)
    topic: str = Field(default="Freies Gespräch", max_length=160)
    coach_id: str = Field(default="current", pattern=COACH_PATTERN)
    coach_prompt: str = Field(default="", max_length=2400)
    plan_step: str = Field(default="", max_length=120)
    recent_context: list[dict] = Field(default_factory=list)
    weak_points: list[str] = Field(default_factory=list)
    scenario_context: str = Field(default="", max_length=900)
    scenario_task: str = Field(default="", max_length=600)
    reference_text: str = Field(default="", max_length=6000)
    spoken: bool = False

    @field_validator("recent_context", mode="before")
    @classmethod
    def _clip_context(cls, value):
        items = value if isinstance(value, list) else []
        clean = []
        for item in items[-MAX_HISTORY:]:
            if not isinstance(item, dict):
                continue
            role = str(item.get("role") or "")
            content = str(item.get("content") or "").strip()
            if role in {"user", "assistant"} and content:
                clean.append({"role": role, "content": content[:4000]})
        return clean

    @field_validator("weak_points", mode="before")
    @classmethod
    def _clip_weak(cls, value):
        items = value if isinstance(value, list) else []
        return [str(item)[:300] for item in items if str(item or "").strip()][:20]

    @field_validator("coach_prompt", "scenario_context", "scenario_task", "topic", "plan_step", "reference_text", mode="before")
    @classmethod
    def _str(cls, value):
        return "" if value is None else str(value)


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=6000)
    coach_id: str = Field(default="current", max_length=60)
    voice: str = Field(default="", max_length=60)
    level: str = Field(default="B1", pattern=LEVEL_PATTERN)
    speed: float = Field(default=1.0, ge=0.7, le=1.3)


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class HintRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    level: str = Field(default="B1", pattern=LEVEL_PATTERN)


class StatePut(BaseModel):
    data: dict
    base_version: int | None = None


# ───────────────────────── Groq pool ─────────────────────────
RETRY_IN = re.compile(r"try again in (?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?", re.I)


class GroqPool:
    def __init__(self, keys_file: Path):
        self.keys_file = keys_file
        self.lock = threading.Lock()
        self.cursor = 0
        self.cooldown: dict[tuple[int, str], float] = {}
        self._keys: list[str] = []
        self._mtime = None
        self._clients: dict[str, OpenAI] = {}

    def keys(self) -> list[str]:
        try:
            mtime = self.keys_file.stat().st_mtime
        except FileNotFoundError:
            return []
        if mtime != self._mtime:
            raw = self.keys_file.read_text(encoding="utf-8").splitlines()
            self._keys = list(dict.fromkeys(line.strip() for line in raw if line.strip() and not line.startswith("#")))
            self._mtime = mtime
        return self._keys

    def client(self, key: str, timeout: float) -> OpenAI:
        cache_key = f"{key}|{timeout}"
        if cache_key not in self._clients:
            self._clients[cache_key] = OpenAI(base_url=GROQ_BASE, api_key=key, timeout=timeout, max_retries=0)
        return self._clients[cache_key]

    def _order(self, count: int) -> list[int]:
        with self.lock:
            start = self.cursor % count
            self.cursor += 1
        return [(start + offset) % count for offset in range(count)]

    def _cool(self, index: int, model: str, error: Exception) -> None:
        seconds = 60.0
        match = RETRY_IN.search(str(error))
        if match and any(match.groups()):
            hours, minutes, secs = match.groups()
            seconds = int(hours or 0) * 3600 + int(minutes or 0) * 60 + float(secs or 0) + 1
        self.cooldown[(index, model)] = time.monotonic() + min(max(seconds, 5), 1800)

    @staticmethod
    def parse_json(content: str | None) -> dict:
        text = (content or "").strip()
        if not text:
            raise ValueError("empty completion")
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            start, end = text.find("{"), text.rfind("}")
            if start < 0 or end <= start:
                raise ValueError("no JSON object in completion")
            data = json.loads(text[start:end + 1])
        if not isinstance(data, dict):
            raise ValueError("completion is not an object")
        return data

    def _create(self, key: str, model: str, messages: list[dict], max_tokens: int, temperature: float, json_mode: bool):
        kwargs = dict(model=model, messages=messages, temperature=temperature, max_tokens=max_tokens)
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if "gpt-oss" in model:
            kwargs["extra_body"] = {"reasoning_effort": "low"}
        result = self.client(key, 30).chat.completions.create(**kwargs)
        return result.choices[0].message.content

    def complete_json(self, messages: list[dict], *, max_tokens: int = 1400, temperature: float = 0.5, deadline: float = 50) -> tuple[dict, str]:
        keys = self.keys()
        if not keys:
            raise AIUnavailable("no Groq keys configured")
        started = time.monotonic()
        last: Exception | None = None
        for model in dict.fromkeys([GROQ_MODEL, GROQ_FALLBACK_MODEL]):
            for index in self._order(len(keys)):
                if time.monotonic() - started > deadline:
                    raise AIUnavailable(f"deadline exceeded: {last}")
                if self.cooldown.get((index, model), 0) > time.monotonic():
                    continue
                try:
                    content = self._create(keys[index], model, messages, max_tokens, temperature, True)
                    data = self.parse_json(content)
                    log.info("AI ok model=%s slot=%s/%s %.1fs", model, index + 1, len(keys), time.monotonic() - started)
                    return data, model
                except RateLimitError as error:
                    last = error
                    self._cool(index, model, error)
                    log.warning("Groq slot %s rate-limited on %s", index + 1, model)
                except BadRequestError as error:
                    last = error
                    if "json_validate_failed" in str(error) or "max completion tokens" in str(error):
                        try:  # free-form retry with a bigger budget, then extract the object
                            content = self._create(keys[index], model, messages, max_tokens + 800, temperature, False)
                            data = self.parse_json(content)
                            log.info("AI ok (lenient) model=%s slot=%s", model, index + 1)
                            return data, model
                        except Exception as retry_error:  # noqa: BLE001
                            last = retry_error
                    log.warning("Groq slot %s bad request on %s: %s", index + 1, model, str(last)[:180])
                except (APITimeoutError, APIConnectionError) as error:
                    last = error
                    log.warning("Groq slot %s network error: %s", index + 1, error)
                except APIStatusError as error:
                    last = error
                    if error.status_code in (401, 403):
                        self.cooldown[(index, model)] = time.monotonic() + 3600
                    log.warning("Groq slot %s status %s", index + 1, error.status_code)
                except ValueError as error:
                    last = error
                    log.warning("Groq slot %s invalid JSON: %s", index + 1, error)
        raise AIUnavailable(str(last))

    def transcribe(self, audio: bytes, filename: str, content_type: str) -> str:
        keys = self.keys()
        if not keys:
            raise AIUnavailable("no Groq keys configured")
        last: Exception | None = None
        for index in self._order(len(keys)):
            if self.cooldown.get((index, GROQ_STT_MODEL), 0) > time.monotonic():
                continue
            try:
                result = self.client(keys[index], 45).audio.transcriptions.create(
                    model=GROQ_STT_MODEL,
                    file=(filename, audio, content_type),
                    language="de",
                    temperature=0,
                    response_format="json",
                    prompt="Ein Deutschlernender spricht über Studium, Alltag und TestDaF-Themen.",
                )
                return str(getattr(result, "text", "") or "").strip()
            except RateLimitError as error:
                last = error
                self._cool(index, GROQ_STT_MODEL, error)
            except Exception as error:  # noqa: BLE001
                last = error
                log.warning("STT slot %s failed: %s", index + 1, str(error)[:180])
        raise AIUnavailable(str(last))


groq_pool = GroqPool(GROQ_KEYS_FILE)


# ───────────────────────── auth ─────────────────────────
_auth_cache: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()
_auth_lock = threading.Lock()


_STAGING_USERS = json.loads(os.getenv("COACH_STAGING_USERS", "") or "{}")  # staging/UI tests only; never set in production


def fetch_amookht_user(token: str) -> tuple[int, dict]:
    if _STAGING_USERS:
        return (200, _STAGING_USERS[token]) if token in _STAGING_USERS else (401, {})
    response = httpx.get(f"{AMOOKHT_API}/account/me", headers={"Authorization": f"Bearer {token}"}, timeout=8)
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    return response.status_code, payload if isinstance(payload, dict) else {}


def resolve_user(authorization: str) -> dict:
    token = authorization[7:].strip() if authorization.lower().startswith("bearer ") else ""
    if not token or len(token) > 4096:
        raise api_error(401, "auth_required", "ابتدا وارد حساب آموخت شوید.")
    digest = hashlib.sha256(token.encode()).hexdigest()
    now = time.monotonic()
    with _auth_lock:
        cached = _auth_cache.get(digest)
    if cached and cached[0] > now:
        return cached[1]
    try:
        status, data = fetch_amookht_user(token)
    except httpx.HTTPError as error:
        log.warning("Amookht auth unreachable: %s", error)
        raise api_error(503, "auth_unavailable", "اتصال به حساب آموخت برقرار نشد؛ کمی بعد دوباره امتحان کنید.")
    if status in (401, 403):
        raise api_error(401, "auth_required", "نشست شما منقضی شده است؛ دوباره وارد شوید.")
    if status != 200 or not data.get("user_id"):
        raise api_error(503, "auth_unavailable", "اتصال به حساب آموخت برقرار نشد.")
    user = {
        "id": str(data["user_id"]),
        "role": ("premium" if data.get("premium_access") and str(data.get("access_role") or "normal").lower() == "normal" else str(data.get("access_role") or "normal").lower()),  # AMK-TRIAL
        "name": str(data.get("display_name") or ""),
        "level": str(data.get("current_level") or ""),
    }
    with _auth_lock:
        _auth_cache[digest] = (now + 90, user)
        _auth_cache.move_to_end(digest)
        while len(_auth_cache) > 500:
            _auth_cache.popitem(last=False)
    return user


def current_user(authorization: str = Header(default="")) -> dict:
    user = resolve_user(authorization)
    if user["role"] not in PREMIUM_ROLES:
        raise api_error(403, "premium_required", "Deutsch Coach مخصوص کاربران پرمیوم آموخت است.")
    return user


_rate: dict[tuple[str, str], deque] = {}
_rate_lock = threading.Lock()
RATE_LIMITS = {"chat": (40, 300), "tools": (40, 300), "tts": (150, 300), "stt": (30, 300), "listening": (12, 300), "state": (240, 300)}


def rate_check(user: dict, bucket: str) -> None:
    limit, window = RATE_LIMITS[bucket]
    now = time.monotonic()
    with _rate_lock:
        hits = _rate.setdefault((user["id"], bucket), deque())
        while hits and hits[0] < now - window:
            hits.popleft()
        if len(hits) >= limit:
            raise api_error(429, "rate_limited", "کمی آهسته‌تر؛ چند لحظه بعد دوباره امتحان کن.", retry_after=int(window - (now - hits[0])) + 1)
        hits.append(now)


# ───────────────────────── storage ─────────────────────────
_db_lock = threading.Lock()


def db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute(
        "CREATE TABLE IF NOT EXISTS user_state (user_id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL, updated_at REAL NOT NULL)"
    )
    return connection


def load_state(user_id: str) -> tuple[dict, int, float | None]:
    with _db_lock:
        connection = db()
        try:
            row = connection.execute("SELECT data, version, updated_at FROM user_state WHERE user_id=?", (user_id,)).fetchone()
        finally:
            connection.close()
    if not row:
        return {}, 0, None
    try:
        data = json.loads(row[0])
    except ValueError:
        data = {}
    return data if isinstance(data, dict) else {}, int(row[1]), float(row[2])


def save_state(user_id: str, data: dict, base_version: int | None) -> int:
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if len(payload.encode()) > STATE_MAX_BYTES:
        raise api_error(413, "state_too_large", "حجم داده‌های مربی بیش از حد مجاز است؛ چند مورد قدیمی را حذف کنید.")
    with _db_lock:
        connection = db()
        try:
            row = connection.execute("SELECT version, data FROM user_state WHERE user_id=?", (user_id,)).fetchone()
            version = int(row[0]) if row else 0
            if base_version is not None and base_version != version:
                current = json.loads(row[1]) if row else {}
                raise HTTPException(409, detail={"code": "conflict", "message": "state changed", "version": version, "data": current})
            connection.execute(
                "INSERT INTO user_state(user_id, data, version, updated_at) VALUES(?,?,?,?) "
                "ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, version=excluded.version, updated_at=excluded.updated_at",
                (user_id, payload, version + 1, time.time()),
            )
            connection.commit()
        finally:
            connection.close()
    return version + 1


# Server-side fallback history (the client normally sends recent_context).
sessions: "OrderedDict[str, deque]" = OrderedDict()
session_lock = threading.Lock()


def session_history(key: str) -> list[dict]:
    with session_lock:
        return list(sessions.get(key, []))


def remember(key: str, user_text: str, reply: str) -> None:
    with session_lock:
        history = sessions.setdefault(key, deque(maxlen=MAX_HISTORY))
        sessions.move_to_end(key)
        history.append({"role": "user", "content": user_text})
        history.append({"role": "assistant", "content": reply})
        while len(sessions) > MAX_SESSIONS:
            sessions.popitem(last=False)


# ───────────────────────── chat ─────────────────────────
def build_chat_messages(request: ChatRequest, history: list[dict]) -> list[dict]:
    coach = COACHES.get(request.coach_id)
    coach_prompt = coach["prompt"] if coach else request.coach_prompt.strip()
    if not coach_prompt:
        raise api_error(400, "coach_prompt_required", "Custom coach prompt is required")
    if request.coach_id == "kumpel":
        mode = "Modus: freies Geplauder unter Freunden. Der Lernende wählt das Thema; kein Szenario, keine Aufgabe, keine Lektion. reply_de: höchstens zwei kurze, lockere Sätze."
        context = f"Niveau: {request.level}. Sprich umgangssprachlich, aber passe die Schwierigkeit an das Niveau an."
    elif request.coach_id != "current":
        mode = (
            "Modus: geführte Unterrichtseinheit. Frage niemals, welches Thema der Lernende wählen möchte. Das Tagesszenario, deine Aufgabe und der heutige Schritt sind festgelegt. "
            "Reagiere wie eine Lehrkraft, prüfe die Antwort und führe danach zum nächsten sinnvollen Teilschritt. reply_de: zwei bis fünf Sätze."
        )
        context = (
            f"Niveau: {request.level}. Tagesszenario: {request.topic}. Kontext: {request.scenario_context}. "
            f"Deine Aufgabe: {request.scenario_task}. Aktueller Schritt im Tagesplan: {request.plan_step}. Passe Wortschatz und Satzlänge an das Niveau an."
        )
    else:
        mode = "Modus: freies Gespräch. Der Lernende wählt das Thema; zwinge ihn nicht in ein Szenario. reply_de: höchstens drei kurze Sätze."
        context = f"Niveau: {request.level}. Passe Wortschatz und Satzlänge an das Niveau an."
    if request.spoken:
        context += " Die Nachricht wurde gesprochen und automatisch transkribiert: ignoriere fehlende Satzzeichen und Großschreibung, bewerte Wortwahl, Grammatik und Satzbau."
    weak = " | ".join(request.weak_points[:12]) if request.weak_points else "noch keine gespeichert"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + coach_prompt},
        {"role": "system", "content": mode + "\n" + context},
        {"role": "system", "content": "Langfristige Schwächen aus früheren Tagen: " + weak + ". Nutze sie unaufdringlich für Wiederholung; liste sie nicht auf."},
    ]
    if request.reference_text.strip():
        messages.append({"role": "system", "content": "Hörtext des Tages (Transkript; der Lernende sieht es erst, wenn er es aufdeckt):\n" + request.reference_text.strip()})
    trimmed = [{"role": item["role"], "content": item["content"][:1200]} for item in history[-MAX_HISTORY:]]
    return [*messages, *trimmed, {"role": "user", "content": request.text.strip()}]


def normalize_chat(data: dict, original: str) -> dict:
    out = {}
    out["corrected_de"] = str(data.get("corrected_de") or original).strip()
    out["natural_de"] = str(data.get("natural_de") or out["corrected_de"]).strip()
    out["grammar_ok"] = bool(data.get("grammar_ok", out["corrected_de"] == original))
    out["natural_ok"] = bool(data.get("natural_ok", out["natural_de"] == out["corrected_de"]))
    out["explanation_fa"] = str(data.get("explanation_fa") or "جمله بررسی شد.").strip()
    out["encouragement_fa"] = str(data.get("encouragement_fa") or "").strip()
    reply = str(data.get("reply_de") or "Erzähl mir bitte noch etwas mehr darüber. Was meinst du genau?")
    out["reply_de"] = re.sub(r"[*_#`>]+", "", reply).strip()
    error_type = str(data.get("error_type") or "none")
    if error_type not in {"grammar", "vocabulary", "sentence_structure", "naturalness", "none"}:
        error_type = "none"
    priority = str(data.get("memory_priority") or "none")
    if priority not in {"high", "medium", "low", "none"}:
        priority = "none"
    worthy = bool(data.get("memory_worthy")) and error_type != "none"
    if worthy and priority == "none":
        priority = "medium"
    if worthy and error_type == "grammar":
        priority = "high"
    out.update(error_type=error_type, memory_priority=priority if worthy else "none", memory_worthy=worthy)
    out["memory_note_fa"] = str(data.get("memory_note_fa") or (out["explanation_fa"] if worthy else "")).strip()
    return out


@app.post("/api/chat")
def chat(request: ChatRequest, user: dict = Depends(current_user)):
    rate_check(user, "chat")
    session_key = f"{user['id']}:{request.session_id}"
    history = request.recent_context or session_history(session_key)
    messages = build_chat_messages(request, history)
    started = time.perf_counter()
    try:
        data, model = groq_pool.complete_json(messages, max_tokens=1500, temperature=0.55)
    except AIUnavailable as error:
        log.error("Chat failed for %s: %s", user["id"][:8], str(error)[:300])
        raise api_error(503, "ai_unavailable", AI_DOWN_MESSAGE)
    result = normalize_chat(data, request.text.strip())
    remember(session_key, request.text.strip(), result["reply_de"])
    result.update(model=model.split("/")[-1], coach_id=request.coach_id, latency_ms=round((time.perf_counter() - started) * 1000))
    return result


@app.delete("/api/session/{session_id}")
def reset_session(session_id: str, user: dict = Depends(current_user)):
    with session_lock:
        sessions.pop(f"{user['id']}:{session_id}", None)
    return {"ok": True}


# ───────────────────────── tools ─────────────────────────
TRANSLATE_PROMPT = """Du bist ein präzises persisch-deutsches Wörterbuch. Erkenne automatisch die Sprache.
Wenn der Text Persisch ist, übersetze natürlich ins Deutsche; wenn er Deutsch ist, übersetze ins Persische.
WICHTIG (TR-FULL): "translation" ist immer die vollständige Übersetzung des GESAMTEN Eingabetextes – jedes Wort, jede Präposition und jede Ergänzung (z. B. "Personalmangel in der Praxis" → "کمبود نیروی انسانی در عمل"), nie nur das Hauptwort. Nur headword_de, word_info und collocations beziehen sich auf das zentrale Wort.
Gib genau drei der gebräuchlichsten deutschen Kollokationen zum zentralen Wort oder Ausdruck an, jede mit kurzer persischer Bedeutung und einem natürlichen deutschen Beispielsatz.
Wähle nur lexikalisch etablierte, im heutigen Standarddeutsch sehr häufige Kollokationen; erfinde keine Kombinationen.
Alle persischen Felder vollständig in natürlichem Persisch, ohne englische Wörter.
Bei Substantiven nenne Artikel und Plural, bei Verben die wichtigsten Formen (z. B. sprechen – sprach – hat gesprochen).
TR-REL2: word_info ist ein schlichter Text NUR mit den Formen, ohne Beschriftungen wie Verb, Substantiv, Grundform, Präsens, Präteritum, Perfekt, Partizip, Genus: Substantiv z. B. "die Erfahrung, Pl. die Erfahrungen", Verb z. B. "sprechen – sprach – hat gesprochen".
TR-REL: Ist das zentrale Wort ein Verb, nenne in related_de seine Nominalisierung: das davon abgeleitete gebräuchliche Substantiv mit Artikel (reflektieren → die Reflexion, entscheiden → die Entscheidung, bewerben → die Bewerbung); nur wenn es keins gibt, den substantivierten Infinitiv (schwimmen → das Schwimmen). Ist es ein Substantiv, nenne das zugehörige gebräuchliche Verb im Infinitiv (die Reflexion → reflektieren, die Erfahrung → erfahren). related_kind = "nomen" bzw. "verb" (die Art des genannten Wortes), related_fa = kurze persische Bedeutung dieses Wortes. Gibt es kein echtes, gebräuchliches Gegenstück oder ist das Wort weder Nomen noch Verb, lass alle drei Felder leer. Erfinde keine Wörter; korrekte Rechtschreibung (die Reflexion, nicht Reflektion).
Antworte ausschließlich als JSON mit: source_language (de oder fa), translation, headword_de, word_info (ein kurzer Text, z. B. "die Erfahrung, Pl. die Erfahrungen"), related_de, related_kind, related_fa, collocations (Array aus phrase, meaning_fa, example_de)."""


_REG_ROUTE = {"t": -1e9, "on": False}  # AI-ADMIN


def _registry_translate(messages: list[dict], authorization: str):
    """AI-ADMIN (2026-11-14): when the owner routed «translate» in the Amookht AI box (custom order, local LLM,
    local-only mode), ask the Amookht backend relay (localhost only); otherwise None → this service's own Groq pool."""
    now = time.monotonic()
    if now - _REG_ROUTE["t"] > 30:
        try:
            r = httpx.get(f"{AMOOKHT_API}/ai/route/translate", timeout=3)
            _REG_ROUTE["on"] = r.status_code == 200 and bool(r.json().get("registry"))
        except (httpx.HTTPError, ValueError):
            _REG_ROUTE["on"] = False
        _REG_ROUTE["t"] = now
    if not _REG_ROUTE["on"]:
        return None
    try:
        r = httpx.post(f"{AMOOKHT_API}/ai/relay", headers={"Authorization": authorization},
                       json={"feature": "translate", "messages": messages, "max_tokens": 1100, "json_mode": True, "temperature": 0.3}, timeout=62)
    except httpx.HTTPError as error:
        raise AIUnavailable(f"relay unreachable: {error}")
    if r.status_code != 200:
        raise AIUnavailable(f"relay {r.status_code}: {r.text[:160]}")
    return groq_pool.parse_json(str(r.json().get("content") or ""))


@app.post("/api/translate")
def translate(request: TranslateRequest, user: dict = Depends(current_user), authorization: str = Header(default="")):
    rate_check(user, "tools")
    messages = [{"role": "system", "content": TRANSLATE_PROMPT}, {"role": "user", "content": request.text.strip()}]
    try:
        data = _registry_translate(messages, authorization)
        if data is None:
            data, _ = groq_pool.complete_json(messages, max_tokens=1100, temperature=0.3)
    except AIUnavailable as error:
        log.error("Translate failed: %s", str(error)[:300])
        raise api_error(503, "ai_unavailable", AI_DOWN_MESSAGE)
    collocations = [
        {"phrase": str(item.get("phrase") or "—"), "meaning_fa": str(item.get("meaning_fa") or ""), "example_de": str(item.get("example_de") or "")}
        for item in list(data.get("collocations") or []) if isinstance(item, dict)
    ][:3]
    return {
        "source_language": str(data.get("source_language") or "auto"),
        "translation": str(data.get("translation") or ""),
        "headword_de": str(data.get("headword_de") or ""),
        "word_info": format_word_info(data.get("word_info")),
        **_related(data),  # TR-REL
        "collocations": collocations,
    }


def _related(data: dict) -> dict:
    """TR-REL: noun → verb / verb → noun; dropped unless it looks like a real German word."""
    de = str(data.get("related_de") or "").strip()[:60]
    kind = str(data.get("related_kind") or "").strip().lower()
    fa = str(data.get("related_fa") or "").strip()[:80]
    kind = "verb" if kind.startswith("verb") else "nomen" if kind.startswith(("nomen", "noun", "subst")) else ""
    if not de or not kind or any("\u0600" <= ch <= "\u06ff" for ch in de) or len(de.split()) > 3:
        return {"related_de": "", "related_kind": "", "related_fa": ""}
    return {"related_de": de, "related_kind": kind, "related_fa": fa}


_INFO_LABELS = re.compile(r"\b(?:Grundform|Infinitiv|Präsens|Praesens|Präteritum|Praeteritum|Perfekt|Partizip(?:\s*II)?|Formen|Genus|Wortart|Artikel|Typ)\s*:\s*", re.I)
_INFO_KIND = re.compile(r"^(?:(?:das\s+)?(?:Verb|Substantiv|Nomen|Adjektiv|Adverb|Präposition)|maskulin|feminin|neutrum|regelmäßig|unregelmäßig|stark|schwach)\b\s*[,;:·]?\s*", re.I)


def format_word_info(value) -> str:
    """TR-REL2: only the forms, no labels (owner): "sprechen – sprach – hat gesprochen", "die Erfahrung, Pl. die Erfahrungen"."""
    if isinstance(value, dict):
        parts = []
        for key, item in value.items():
            if item in (None, "", [], {}) or str(key).lower() in ("type", "wortart", "typ", "genus"):
                continue
            parts.append(", ".join(map(str, item)) if isinstance(item, list) else str(item))
        text = " – ".join(parts)
    elif isinstance(value, list):
        text = " – ".join(map(str, value))
    else:
        text = str(value or "")
    text = _INFO_LABELS.sub("", text)
    for _ in range(4):
        new = _INFO_KIND.sub("", text.strip())
        if new == text.strip():
            break
        text = new
    text = re.sub(r"\s*,\s*–\s*|\s*–\s*,\s*", " – ", text)
    return re.sub(r"\s{2,}", " ", text).strip(" ,;·–")


def hint_prompt(level: str) -> str:
    return f"""Du bist ein Antwort-Coach für einen persischsprachigen Deutschlernenden auf Niveau {level}.
Der Eingabetext ist die letzte Frage oder Aufforderung eines Tutors. Übersetze sie präzise ins Persische (translation_fa).
Gib genau drei direkt nutzbare deutsche Satzrahmen (answer_patterns), mit denen man genau diese Frage beantworten kann. Verwende eckige Klammern nur für freie Inhalte wie [Aktivität], [Grund] oder [Ort]; keine Schrägstrich-Alternativen, keine konjugierten Verben in Klammern. Die drei Muster sollen unterschiedlich, sehr gebräuchlich und niveaugerecht sein.
Gib dann genau einen natürlichen, professionell klingenden Antwortvorschlag auf Niveau {level} (answer_de).
Extrahiere ausschließlich alle exakten Verbteile aus answer_de (Vollverb, Hilfsverb, Modalverb, trennbares Präfix, Partizip/Infinitiv am Satzende) als getrennte Einträge in verb_parts, Schreibweise exakt wie in answer_de.
Antworte ausschließlich als JSON mit: translation_fa, answer_patterns, answer_de, verb_parts."""


@app.post("/api/hint")
def hint(request: HintRequest, user: dict = Depends(current_user)):
    rate_check(user, "tools")
    try:
        data, _ = groq_pool.complete_json(
            [{"role": "system", "content": hint_prompt(request.level)}, {"role": "user", "content": request.text.strip()[:2500]}],
            max_tokens=1200, temperature=0.4,
        )
    except AIUnavailable as error:
        log.error("Hint failed: %s", str(error)[:300])
        raise api_error(503, "ai_unavailable", AI_DOWN_MESSAGE)
    answer_de = str(data.get("answer_de") or "")
    patterns = [str(item).strip() for item in list(data.get("answer_patterns") or []) if str(item).strip()][:3]
    verb_parts = []
    for item in list(data.get("verb_parts") or [])[:8]:
        part = str(item or "").strip()
        if part and part.casefold() in answer_de.casefold() and part not in verb_parts:
            verb_parts.append(part)
    return {"translation_fa": str(data.get("translation_fa") or ""), "answer_patterns": patterns, "answer_de": answer_de, "verb_parts": verb_parts}


# ───────────────────────── speech ─────────────────────────
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿️‍]")


def clean_for_speech(text: str) -> str:
    text = EMOJI.sub("", text)
    text = re.sub(r"[*_`~]+", "", text)
    text = re.sub(r"[#>|]+", " ", text)
    text = re.sub(r"\[(.*?)\]", r"\1", text)
    text = text.replace("→", ", ").replace("·", ", ").replace(" – ", ", ").replace(" — ", ", ")
    return re.sub(r"\s+", " ", text).strip()


def speech_rate(level: str, speed: float) -> str:
    value = LEVEL_RATE.get(level, -4) + round((speed - 1.0) * 100)
    value = max(-40, min(40, value))
    return f"{value:+d}%"


def voice_for(coach_id: str, voice: str) -> str:
    if voice in VOICES:
        return voice
    coach = COACHES.get(coach_id)
    return coach["voice"] if coach else DEFAULT_VOICE


_edge_semaphores: dict[int, asyncio.Semaphore] = {}


def _edge_slot() -> asyncio.Semaphore:
    loop_id = id(asyncio.get_running_loop())
    if loop_id not in _edge_semaphores:
        _edge_semaphores[loop_id] = asyncio.Semaphore(int(os.getenv("EDGE_TTS_CONCURRENCY", "2")))
    return _edge_semaphores[loop_id]


EDGE_BACKOFF = (1.0, 1.8, 2.8, 4.0, 0)  # the shared endpoint throttles ~1 in 4 calls at random; a later retry succeeds


async def edge_synthesize(text: str, voice: str, rate: str) -> bytes:
    if edge_tts is None:
        raise RuntimeError("edge-tts not installed")
    last = None
    for delay in EDGE_BACKOFF:
        try:
            async with _edge_slot():
                buffer = bytearray()
                communicate = edge_tts.Communicate(text, voice, rate=rate, connect_timeout=8, receive_timeout=12)

                async def collect():
                    async for chunk in communicate.stream():
                        if chunk["type"] == "audio":
                            buffer.extend(chunk["data"])
                await asyncio.wait_for(collect(), timeout=12 + len(text) / 40)
            if len(buffer) < 800:
                raise RuntimeError("empty audio")
            return bytes(buffer)
        except Exception as error:  # noqa: BLE001
            last = error
            if delay:
                await asyncio.sleep(delay)
    raise RuntimeError(f"edge-tts failed: {str(last).split('?')[0]}")


piper_voice = None
piper_lock = threading.Lock()


def get_piper():
    global piper_voice
    if piper_voice is None:
        with piper_lock:
            if piper_voice is None:
                if PiperVoice is None or not PIPER_MODEL.exists():
                    raise FileNotFoundError("Piper voice not available")
                log.info("Loading Piper fallback voice: %s", PIPER_MODEL.name)
                piper_voice = PiperVoice.load(str(PIPER_MODEL))
    return piper_voice


def piper_wav(text: str, level: str, speed: float) -> bytes:
    buffer = io.BytesIO()
    length = {"A2": 1.12, "B1": 1.06, "B2": 1.02, "C1": 1.0}.get(level, 1.04) / max(speed, 0.7)
    with wave.open(buffer, "wb") as wav_file:
        get_piper().synthesize_wav(
            text, wav_file,
            syn_config=SynthesisConfig(volume=1.0, length_scale=length, noise_scale=0.667, noise_w_scale=0.8, normalize_audio=True),
        )
    return buffer.getvalue()


def prune_tts_cache() -> None:
    files = []
    for path in TTS_CACHE.glob("*.mp3"):
        try:
            stat = path.stat()
            files.append((stat.st_mtime, stat.st_size, path))
        except OSError:
            continue
    total = sum(size for _, size, _ in files)
    if total <= TTS_CACHE_MAX_BYTES:
        return
    for _, size, path in sorted(files):
        try:
            path.unlink()
        except OSError:
            continue
        total -= size
        if total <= TTS_CACHE_MAX_BYTES * 0.8:
            break


def write_atomic(path: Path, data: bytes) -> None:
    tmp = path.with_name(f".{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


_tts_writes = 0


async def synthesize_cached(text: str, voice: str, rate: str) -> bytes:
    global _tts_writes
    key = hashlib.sha256(f"{voice}|{rate}|{text}".encode()).hexdigest()[:40]
    path = TTS_CACHE / f"{key}.mp3"
    if path.exists():
        try:
            os.utime(path)
        except OSError:
            pass
        return path.read_bytes()
    audio = await asyncio.wait_for(edge_synthesize(text, voice, rate), timeout=40)
    write_atomic(path, audio)
    _tts_writes += 1
    if _tts_writes % 25 == 0:
        await run_in_threadpool(prune_tts_cache)
    return audio


@app.post("/api/tts")
async def tts(request: TtsRequest, user: dict = Depends(current_user)):
    rate_check(user, "tts")
    text = clean_for_speech(request.text)
    if not text:
        raise api_error(400, "empty_text", "Kein Text zum Vorlesen.")
    voice = voice_for(request.coach_id, request.voice)
    rate = speech_rate(request.level, request.speed)
    headers = {"Cache-Control": "private, max-age=86400"}
    try:
        audio = await synthesize_cached(text, voice, rate)
        return Response(audio, media_type="audio/mpeg", headers={**headers, "X-TTS-Engine": "neural"})
    except Exception as error:  # noqa: BLE001
        log.warning("Neural TTS failed (%s); using Piper fallback", str(error)[:200])
    try:
        wav = await run_in_threadpool(piper_wav, text[:1500], request.level, request.speed)
        return Response(wav, media_type="audio/wav", headers={**headers, "X-TTS-Engine": "piper"})
    except Exception as error:  # noqa: BLE001
        log.exception("TTS failed")
        raise api_error(503, "tts_unavailable", "تولید صدا الان ممکن نشد.") from error


AUDIO_TYPES = {"audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/aac": "m4a", "video/webm": "webm", "video/mp4": "m4a"}


@app.post("/api/stt")
async def stt(request: Request, user: dict = Depends(current_user)):
    rate_check(user, "stt")
    content_type = (request.headers.get("content-type") or "audio/webm").split(";")[0].strip().lower()
    extension = AUDIO_TYPES.get(content_type)
    if not extension:
        raise api_error(415, "unsupported_audio", "این قالب صوتی پشتیبانی نمی‌شود.")
    body = await request.body()
    if len(body) < 1200:
        raise api_error(400, "audio_too_short", "صدا خیلی کوتاه بود؛ دوباره صحبت کن.")
    if len(body) > 12 * 1024 * 1024:
        raise api_error(413, "audio_too_large", "ضبط خیلی طولانی است (حداکثر ۲ دقیقه).")
    try:
        text = await run_in_threadpool(groq_pool.transcribe, body, f"speech.{extension}", content_type)
    except AIUnavailable as error:
        log.error("STT failed: %s", str(error)[:300])
        raise api_error(503, "ai_unavailable", "تبدیل گفتار به متن الان ممکن نشد؛ دوباره امتحان کن.")
    return {"text": text}


# ───────────────────────── listening ─────────────────────────
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def scenario_for(date: str, variant: int) -> dict:
    safe_date = date[:10] if DATE_RE.match(date[:10] or "") else time.strftime("%Y-%m-%d")
    digest = hashlib.sha256(("deutsch-coach-testdaf-" + safe_date).encode()).digest()
    base_index = int.from_bytes(digest[:4], "big") % len(TESTDAF_SCENARIOS)
    safe_variant = max(0, min(int(variant), 10000))
    scenario = TESTDAF_SCENARIOS[(base_index + safe_variant) % len(TESTDAF_SCENARIOS)]
    return {"date": safe_date, "variant": safe_variant, **scenario}


def listening_prompt(scenario: dict, level: str) -> str:
    words = LISTENING_WORDS.get(level, 320)
    return f"""Schreibe einen authentischen deutschen Hörtext im Stil von TestDaF Hörverstehen als Radiointerview.
Thema: {scenario['title']}. Kontext: {scenario['context']}. Leitfrage: {scenario['question']}
Sprecher A ist die Moderatorin (Frau Berger), Sprecher B ist ein Experte (Herr Dr. Lehmann).
Niveau {level}; Gesamtlänge ungefähr {words} Wörter; 8 bis 12 Redebeiträge; natürlich gesprochene Sprache mit Füllwörtern wie also, na ja, genau; konkrete Zahlen, ein Beispiel und eine Gegenposition.
Keine Regieanweisungen, keine Namen vor den Beiträgen, keine Klammern.
Antworte ausschließlich als JSON mit:
title (kurzer Titel),
segments (Array aus Objekten mit speaker "A" oder "B" und text),
key_points_de (3 bis 5 Hauptaussagen als kurze Sätze),
questions_de (genau 3 Verständnisfragen),
vocab (genau 6 Objekte mit de und fa: wichtige Wendungen aus dem Text mit persischer Bedeutung)."""


def fallback_listening(scenario: dict) -> dict:
    return {
        "title": scenario["title"],
        "segments": [
            {"speaker": "A", "text": f"Herzlich willkommen zu unserer Sendung. Heute geht es um das Thema {scenario['title']}. {scenario['context']} Herr Dr. Lehmann, wie schätzen Sie die Lage ein?"},
            {"speaker": "B", "text": "Also, zunächst muss man sagen, dass die Entwicklung viele Vorteile hat. Informationen sind schneller zugänglich, und viele Menschen können flexibler lernen oder arbeiten. Gerade Studierende profitieren davon, weil sie oft mehrere Verpflichtungen gleichzeitig haben."},
            {"speaker": "A", "text": "Gibt es denn auch Nachteile?"},
            {"speaker": "B", "text": "Na ja, natürlich. Wer sich nur auf schnelle Lösungen verlässt, prüft Informationen weniger kritisch. Außerdem haben nicht alle dieselben Voraussetzungen, also dieselben Geräte oder eine ruhige Lernumgebung. Man muss deshalb fragen, wer profitiert und wer zurückbleibt."},
            {"speaker": "A", "text": f"Und was wäre Ihre Antwort auf die Frage: {scenario['question']}"},
            {"speaker": "B", "text": "Entscheidend ist nicht, ob man die Entwicklung stoppt, sondern wie man sie bewusst gestaltet. Wir brauchen klare Regeln, die Freiheit ermöglichen, aber auch Grenzen setzen."},
        ],
        "key_points_de": ["Die Entwicklung bringt Flexibilität und schnelleren Zugang zu Informationen.", "Es besteht die Gefahr, Informationen weniger kritisch zu prüfen.", "Nicht alle haben die gleichen Voraussetzungen.", "Der Experte fordert klare Regeln statt eines Verbots."],
        "questions_de": ["Welche Vorteile nennt der Experte?", "Welches Problem sieht er bei der Chancengleichheit?", "Welche Lösung schlägt er am Ende vor?"],
        "vocab": [],
        "fallback": True,
    }


_listen_locks: dict[str, threading.Lock] = {}
_listen_guard = threading.Lock()


def listening_key(scenario: dict, level: str) -> str:
    return hashlib.sha256(f"v2|{scenario['title']}|{level}".encode()).hexdigest()[:20]


def get_listening(scenario: dict, level: str) -> dict:
    key = listening_key(scenario, level)
    path = LISTEN_CACHE / f"{key}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    with _listen_guard:
        lock = _listen_locks.setdefault(key, threading.Lock())
    with lock:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        try:
            data, _ = groq_pool.complete_json(
                [{"role": "system", "content": "Du bist Autor für authentische deutsche Prüfungs-Hörtexte."}, {"role": "user", "content": listening_prompt(scenario, level)}],
                max_tokens=3200, temperature=0.75, deadline=70,
            )
            segments = [
                {"speaker": "B" if str(item.get("speaker")).upper().startswith("B") else "A", "text": clean_for_speech(str(item.get("text") or ""))}
                for item in list(data.get("segments") or []) if isinstance(item, dict) and str(item.get("text") or "").strip()
            ]
            words = sum(len(item["text"].split()) for item in segments)
            if len(segments) < 4 or words < 120:
                raise ValueError(f"listening text too short ({len(segments)} segments, {words} words)")
            result = {
                "title": str(data.get("title") or scenario["title"]),
                "segments": segments,
                "key_points_de": [str(x) for x in list(data.get("key_points_de") or [])][:5],
                "questions_de": [str(x) for x in list(data.get("questions_de") or [])][:3],
                "vocab": [{"de": str(x.get("de") or ""), "fa": str(x.get("fa") or "")} for x in list(data.get("vocab") or []) if isinstance(x, dict)][:6],
            }
            write_atomic(path, json.dumps(result, ensure_ascii=False).encode())
            return result
        except Exception as error:  # noqa: BLE001
            log.warning("Listening generation failed: %s", str(error)[:300])
            return fallback_listening(scenario)


def listening_transcript(data: dict) -> str:
    names = {"A": "Moderatorin", "B": "Experte"}
    return "\n".join(f"{names[item['speaker']]}: {item['text']}" for item in data["segments"])


_audio_jobs: dict[str, asyncio.Task] = {}


def listening_audio_path(scenario: dict, level: str, data: dict, rate: str) -> Path:
    return LISTEN_CACHE / f"{listening_key(scenario, level)}{'-fb' if data.get('fallback') else ''}{rate}.mp3"


async def build_listening_audio(path: Path, data: dict, rate: str) -> None:
    parts = []
    for item in data["segments"]:  # sequential: gentle on the shared TTS endpoint
        parts.append(await edge_synthesize(item["text"], LISTENING_VOICES[item["speaker"]], rate))
    write_atomic(path, b"".join(parts))


def listening_audio_job(path: Path, data: dict, rate: str) -> asyncio.Task:
    key = str(path)
    job = _audio_jobs.get(key)
    loop = asyncio.get_running_loop()
    if job is None or job.get_loop() is not loop or (job.done() and (job.cancelled() or job.exception() is not None)):
        job = asyncio.get_running_loop().create_task(build_listening_audio(path, data, rate))
        _audio_jobs[key] = job
        job.add_done_callback(lambda task: _audio_jobs.pop(key, None) if not task.cancelled() and task.exception() is None else None)
    return job


@app.get("/api/listening")
async def listening(date: str, variant: int = 0, level: str = "B1", user: dict = Depends(current_user)):
    rate_check(user, "listening")
    level = level if level in LEVEL_RATE else "B1"
    scenario = scenario_for(date, variant)
    data = await run_in_threadpool(get_listening, scenario, level)
    path = listening_audio_path(scenario, level, data, speech_rate(level, 1.0))
    if not path.exists():
        job = listening_audio_job(path, data, speech_rate(level, 1.0))  # warm the audio while the learner reads the task
        job.add_done_callback(lambda task: task.cancelled() or task.exception())
    return {**data, "level": level, "transcript": listening_transcript(data), "audio_key": listening_key(scenario, level)}


@app.get("/api/listening/audio")
async def listening_audio(date: str, variant: int = 0, level: str = "B1", speed: float = 1.0, user: dict = Depends(current_user)):
    rate_check(user, "tts")
    level = level if level in LEVEL_RATE else "B1"
    speed = max(0.7, min(1.3, speed))
    scenario = scenario_for(date, variant)
    data = await run_in_threadpool(get_listening, scenario, level)
    rate = speech_rate(level, speed)
    path = listening_audio_path(scenario, level, data, rate)
    if not path.exists():
        try:
            await asyncio.wait_for(asyncio.shield(listening_audio_job(path, data, rate)), timeout=100)
        except Exception as error:  # noqa: BLE001
            log.warning("Listening audio failed: %s", str(error)[:200])
            raise api_error(503, "tts_unavailable", "صدای متن شنیداری الان ساخته نشد؛ چند ثانیه بعد دوباره امتحان کن.")
    return Response(path.read_bytes(), media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})


# ───────────────────────── state & meta ─────────────────────────
@app.get("/api/me")
def me(user: dict = Depends(current_user)):
    return {"id": user["id"], "name": user["name"], "role": user["role"], "level": user["level"]}


@app.get("/api/state")
def get_state(user: dict = Depends(current_user)):
    rate_check(user, "state")
    data, version, updated = load_state(user["id"])
    return {"data": data, "version": version, "updated_at": updated}


@app.put("/api/state")
def put_state(payload: StatePut, user: dict = Depends(current_user)):
    rate_check(user, "state")
    version = save_state(user["id"], payload.data, payload.base_version)
    return {"version": version}


@app.get("/api/health")
def health():
    return {"ok": bool(groq_pool.keys()), "service": "Deutsch Coach", "version": VERSION, "tts": "neural" if edge_tts else "piper"}


@app.get("/api/coaches")
def coaches():
    return {
        "coaches": [
            {"id": coach_id, **{k: v for k, v in coach.items() if k != "prompt"}, "plan": DAILY_PLANS[coach_id]}
            for coach_id, coach in COACHES.items()
        ],
        "levels": ["A2", "B1", "B2", "C1"],
        "voices": VOICES,
    }


@app.get("/api/daily-scenario")
def daily_scenario(date: str, variant: int = 0):
    return {**scenario_for(date, variant), "tasks": SCENARIO_TASKS}


@app.middleware("http")
async def cache_headers(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if not path.startswith("/api/") and (path.endswith((".html", ".js", ".css", ".webmanifest")) or path == "/"):
        response.headers["Cache-Control"] = "no-cache"
    return response


app.mount("/", StaticFiles(directory=STATIC, html=True), name="static")
