"""Content-production and insight helpers for the owner agent.

Generators run on the server (chunked, validated, de-duplicated) so the chat model only chooses parameters; the owner
sees a preview and confirms before anything is saved.
"""
from __future__ import annotations

import asyncio
import json
import re
import uuid
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.owner_agent_llm import generate_json
from app.domain.models.models import User, UserAppState

STATE_DIR = Path("/var/lib/amookht-method")
STATUS_FILE = STATE_DIR / "status.json"
REQUESTS_DIR = Path("/opt/amookht/app/backend/data/method-requests")  # the backend sandbox may only write below backend/data
CONTENT_JS = Path("/opt/amookht/app/testdaf-method-content.js")
METHOD_KINDS = ("hoeren", "lesen", "argumentation", "grafik", "sprechen")
BASE_TARGETS = {"hoeren": 56, "lesen": 56, "argumentation": 44, "grafik": 12, "sprechen": 84}
# Weekly consumption of the 7-day TestDaF method plan (Sat..Fri; Thursday alternates Grafik/Argumentation).
PER_WEEK = {"hoeren": 7.0, "lesen": 7.0, "argumentation": 5.5, "grafik": 1.5, "sprechen": 14.0}
SPRECHEN_TYPES = ("rat_geben", "optionen_abwaegen", "text_zusammenfassen", "informationen_abgleichen", "thema_praesentieren", "argumente_wiedergeben", "massnahmen_kritisieren")
SPRECHEN_PER_WEEK = {t: 12 / 7 + (1.0 if t in ("text_zusammenfassen", "thema_praesentieren") else 0.0) for t in SPRECHEN_TYPES}
KIND_FA = {"hoeren": "شنیداری (Hören، با فایل صوتی)", "lesen": "خواندن (Lesen)", "argumentation": "نوشتن – استدلال (Argumentation)", "grafik": "نوشتن – توصیف نمودار (Grafik)", "sprechen": "صحبت‌کردن (Sprechen)"}
ITEMS_PER_RUN = {"hoeren": 2, "lesen": 2, "argumentation": 2, "grafik": 2, "sprechen": 4}  # observed pipeline throughput per 20-minute run
_bundle_cache: dict[str, Any] = {"mtime": None, "data": {}}


# ───────────── TestDaF method content (pipeline) ─────────────
def load_bundle() -> dict[str, Any]:
    try:
        mtime = CONTENT_JS.stat().st_mtime
    except OSError:
        return {}
    if _bundle_cache["mtime"] != mtime:
        try:
            text = CONTENT_JS.read_text(encoding="utf-8")
            _bundle_cache["data"] = json.loads(text[text.index("{"):text.rindex("}") + 1])
            _bundle_cache["mtime"] = mtime
        except (OSError, ValueError):
            return _bundle_cache["data"] or {}
    return _bundle_cache["data"]


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def pending_requests() -> list[dict[str, Any]]:
    out = []
    try:
        files = sorted(REQUESTS_DIR.glob("*.json"))
    except OSError:
        return out
    for path in files:
        data = _read_json(path)
        if isinstance(data, dict):
            out.append({"kind": data.get("kind"), "count": data.get("count"), "created_at": data.get("created_at")})
    return out


def _parse_day(value: Any) -> date | None:
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _first_saturday(start: date) -> date:
    sat = start - timedelta(days=(start.weekday() - 5) % 7)
    return sat + timedelta(days=7) if start.weekday() == 4 else sat  # a Friday start begins with week 1 on the next day


def plan_week(start: date | None, day: date | None = None) -> int:
    if start is None:
        return 0
    diff = ((day or date.today()) - _first_saturday(start)).days
    return 0 if diff < 0 else diff // 7 + 1


async def owner_state(owner: User, db: AsyncSession) -> dict[str, Any]:
    row = (await db.execute(select(UserAppState.state_data).where(UserAppState.user_id == owner.id))).scalar_one_or_none()
    return row if isinstance(row, dict) else {}


async def method_content_status(owner: User, db: AsyncSession) -> dict[str, Any]:
    bundle, status = load_bundle(), _read_json(STATUS_FILE) or {}
    targets = status.get("targets") or BASE_TARGETS
    state = await owner_state(owner, db)
    method = state.get("testdafMethod") if isinstance(state.get("testdafMethod"), dict) else {}
    start = _parse_day(method.get("startDate"))
    week_now = plan_week(start)
    kinds: dict[str, Any] = {}
    for kind in METHOD_KINDS:
        items = bundle.get(kind) or []
        published = len(items)
        weeks = published / PER_WEEK[kind]
        row = {"label_fa": KIND_FA[kind], "published": published, "target": int(targets.get(kind, BASE_TARGETS[kind])),
               "generated_not_yet_published": max(0, int((status.get("generated") or {}).get(kind, published)) - published),
               "used_per_week": PER_WEEK[kind], "weeks_covered": round(weeks, 1)}
        if kind == "hoeren":
            row["with_audio"] = sum(1 for item in items if isinstance(item, dict) and item.get("audio"))
        if kind == "sprechen":
            counts = Counter(str(item.get("type")) for item in items if isinstance(item, dict))
            row["by_type"] = {t: {"count": counts.get(t, 0), "used_per_week": round(SPRECHEN_PER_WEEK[t], 2), "weeks_covered": round(counts.get(t, 0) / SPRECHEN_PER_WEEK[t], 1)} for t in SPRECHEN_TYPES}
            row["weeks_covered"] = round(min(v["weeks_covered"] for v in row["by_type"].values()), 1)
        row["missing_to_target"] = max(0, row["target"] - published)
        row["needed_for_12_weeks"] = max(0, round(PER_WEEK[kind] * 12) - published) if kind != "sprechen" else sum(max(0, round(SPRECHEN_PER_WEEK[t] * 12) - row["by_type"][t]["count"]) for t in SPRECHEN_TYPES)
        kinds[kind] = row
    bottleneck = min(kinds, key=lambda k: kinds[k]["weeks_covered"])
    return {
        "content_version": bundle.get("version"),
        "kinds": kinds,
        "plan": {"start_date": method.get("startDate"), "current_week": week_now, "phase": method.get("phase"),
                 "fresh_content_until_week": round(min(v["weeks_covered"] for v in kinds.values()), 1), "bottleneck": bottleneck,
                 "note": "The base set was designed for 8 weeks (Phase 1: weeks 1-2, Phase 2: weeks 3-6, Phase 3: week 7+). When a pool runs out, the plan reuses the least recently used items instead of breaking."},
        "pipeline": {"active": not status.get("done", False) if status else None, "updated_at": status.get("updated_at"),
                     "last_runs": (status.get("last_runs") or [])[-3:], "pending_requests": pending_requests(),
                     "queued_extra_items": status.get("extra_specs", 0), "items_per_20min_run": ITEMS_PER_RUN},
    }


def _existing_method_titles(kind: str) -> list[str]:
    bundle = load_bundle()
    titles = []
    for item in bundle.get(kind) or []:
        if isinstance(item, dict):
            titles.append(str(item.get("title") or item.get("theme") or item.get("topic") or "")[:120])
    return [t for t in titles if t]


async def propose_method_topics(kind: str, count: int, sprechen_type: str | None, hint: str | None) -> list[str]:
    avoid = _existing_method_titles(kind)[:120]
    describe = {
        "hoeren": "Themen für TestDaF-Hörtexte (Gespräch, Interview, Vortrag, Diskussion) aus Hochschule, Wissenschaft und Gesellschaft",
        "lesen": "Themen für TestDaF-Lesetexte (populärwissenschaftliche Artikel) aus Wissenschaft, Hochschule, Umwelt, Technik, Gesellschaft",
        "argumentation": "kontroverse Entscheidungsfragen für TestDaF-Argumentationsaufgaben, formuliert als Ja/Nein-Frage („Sollte …?“)",
        "grafik": "Titel von Statistik-Grafiken für die TestDaF-Grafikbeschreibung (Hochschule, Arbeit, Umwelt, Medien), mit Zeitraum oder Vergleich",
        "sprechen": f"kurze Themenfelder für TestDaF-Sprechaufgaben vom Typ {sprechen_type or 'gemischt'} (z. B. „Wohnen im Studium“)",
    }[kind]
    prompt = (f"Erstelle genau {count} neue, abwechslungsreiche {describe}. Niveau B2–C1, aktuelle und prüfungsnahe Themen."
              + (f" Schwerpunkt des Auftraggebers: {hint}." if hint else "")
              + "\nVermeide diese bereits vorhandenen Themen und sehr ähnliche Varianten:\n- " + "\n- ".join(avoid or ["(keine)"])
              + '\nAntworte NUR mit JSON: {"topics": ["...", "..."]}')

    def check(data: dict) -> None:
        topics = [str(t).strip() for t in data.get("topics") or [] if str(t).strip()]
        if len(topics) < count:
            raise ValueError("too few topics")

    data = await generate_json(prompt, max_tokens=2500, temperature=0.8, validate=check)
    seen, topics = {t.casefold() for t in avoid}, []
    for topic in data["topics"]:
        text = re.sub(r"\s+", " ", str(topic)).strip()[:160]
        if text and text.casefold() not in seen:
            seen.add(text.casefold())
            topics.append(text)
    return topics[:count]


def write_method_request(arguments: dict[str, Any], owner: User) -> dict[str, Any]:
    kind = str(arguments.get("kind"))
    if kind not in METHOD_KINDS:
        raise HTTPException(status_code=422, detail="Unknown method content kind")
    topics = [str(t).strip()[:160] for t in arguments.get("topics") or [] if str(t).strip()]
    count = len(topics)
    if not 1 <= count <= 30:
        raise HTTPException(status_code=422, detail="Between 1 and 30 topics are required")
    request = {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat(), "by": owner.email, "kind": kind, "count": count,
               "topics": topics, "sprechen_type": arguments.get("sprechen_type") if arguments.get("sprechen_type") in SPRECHEN_TYPES else None,
               "chart": arguments.get("chart") if arguments.get("chart") in ("line", "bar", "grouped_bar") else None}
    try:
        REQUESTS_DIR.mkdir(parents=True, exist_ok=True)
        tmp = REQUESTS_DIR / f".{request['id']}.tmp"
        tmp.write_text(json.dumps(request, ensure_ascii=False, indent=1), encoding="utf-8")
        tmp.rename(REQUESTS_DIR / f"{request['id']}.json")
    except OSError as exc:
        raise HTTPException(status_code=503, detail="The content pipeline queue is not writable") from exc
    runs = -(-count // ITEMS_PER_RUN[kind])
    return {"queued": True, "request_id": request["id"], "kind": kind, "count": count, "topics": topics,
            "eta_minutes": 20 + runs * 20, "note": "The pipeline timer picks the request up within 20 minutes, generates, voices (Hören), quality-checks and publishes automatically."}


# ───────────── owner learning progress ─────────────
def _avg(values: list[float]) -> int | None:
    vals = [float(v) for v in values if isinstance(v, (int, float))]
    return round(sum(vals) / len(vals)) if vals else None


async def owner_method_progress(owner: User, db: AsyncSession) -> dict[str, Any]:
    state = await owner_state(owner, db)
    method = state.get("testdafMethod") if isinstance(state.get("testdafMethod"), dict) else {}
    days = method.get("days") if isinstance(method.get("days"), dict) else {}
    start = _parse_day(method.get("startDate"))
    today = date.today()
    skill_scores: dict[str, list[float]] = {"hoeren": [], "lesen": [], "schreiben": [], "sprechen": []}
    day_rows = []
    for key in sorted(days)[-21:]:
        d = days[key] if isinstance(days[key], dict) else {}
        results = d.get("results") if isinstance(d.get("results"), dict) else {}
        for mod, field in (("hoeren", "pct"), ("lesen", "pct"), ("schreiben", "score"), ("sprechen", "score")):
            value = (results.get(mod) or {}).get(field) if isinstance(results.get(mod), dict) else None
            if isinstance(value, (int, float)):
                skill_scores[mod].append(value)
        minutes = round(sum(float((r or {}).get("seconds") or 0) for r in results.values() if isinstance(r, dict)) / 60)
        day_rows.append({"date": key, "week": d.get("week"), "mode": d.get("mode"), "modules_done": sorted(results), "minutes": minutes})
    log = method.get("log") if isinstance(method.get("log"), list) else []
    categories = Counter(f"{x.get('skill')}:{x.get('cat')}" for x in log[-600:] if isinstance(x, dict))
    srs = method.get("srs") if isinstance(method.get("srs"), dict) else {}
    srs_due = sum(1 for x in srs.values() if isinstance(x, dict) and str(x.get("due") or "") <= today.isoformat())
    weekly = method.get("weekly") if isinstance(method.get("weekly"), dict) else {}
    reports = []
    for key in sorted(weekly)[-4:]:
        rep = weekly[key] if isinstance(weekly[key], dict) else {}
        metrics = rep.get("metrics") if isinstance(rep.get("metrics"), dict) else {}
        reports.append({"week": rep.get("week"), "metrics": {k: metrics.get(k) for k in ("hoeren", "lesen", "schreiben", "sprechen", "minutes", "completion", "errors") if k in metrics},
                        "frequent_errors": rep.get("frequent", [])[:3], "weaknesses": rep.get("weak", [])[:3], "goal": str(rep.get("goal") or "")[:300]})
    history = state.get("history") if isinstance(state.get("history"), list) else []
    recent = [{"date": h.get("date"), "minutes": round(float(h.get("time") or 0) / 60), "completed": h.get("comp"), "activities": h.get("acts"), "score": h.get("score")}
              for h in history[:14] if isinstance(h, dict)]
    errors = state.get("errors") if isinstance(state.get("errors"), list) else []
    return {
        "plan_active": (state.get("user") or {}).get("examPlan") == "testdaf" if isinstance(state.get("user"), dict) else None,
        "start_date": method.get("startDate"), "current_week": plan_week(start), "phase": method.get("phase"),
        "days_with_work": len(day_rows), "recent_days": day_rows[-10:],
        "average_scores": {k: _avg(v) for k, v in skill_scores.items()}, "score_samples": {k: len(v) for k, v in skill_scores.items()},
        "top_error_categories": categories.most_common(8), "srs": {"cards": len(srs), "due_today": srs_due},
        "weekly_reports": reports, "site_history_last_14_days": recent,
        "site_mistakes": {"total": len(errors)}, "word_progress_entries": len(state.get("wordProgress") or {}),
        "streak": state.get("streak"), "points": state.get("points"),
    }


# ───────────── site analytics ─────────────
async def site_activity(arguments: dict[str, Any], db: AsyncSession) -> dict[str, Any]:
    try:
        days = max(1, min(90, int(arguments.get("days") or 7)))
    except (TypeError, ValueError):
        days = 7
    since = datetime.now(timezone.utc) - timedelta(days=days)
    total = (await db.execute(select(func.count(User.id)).where(User.deleted_at.is_(None)))).scalar_one()
    new_users = (await db.execute(select(func.count(User.id)).where(User.deleted_at.is_(None), User.created_at >= since))).scalar_one()
    active = (await db.execute(select(func.count(UserAppState.id)).where(UserAppState.updated_at >= since))).scalar_one()
    active_1d = (await db.execute(select(func.count(UserAppState.id)).where(UserAppState.updated_at >= datetime.now(timezone.utc) - timedelta(days=1)))).scalar_one()
    roles = dict((str(r or "normal"), int(c)) for r, c in (await db.execute(select(User.access_role, func.count(User.id)).where(User.deleted_at.is_(None)).group_by(User.access_role))).all())
    signups = (await db.execute(select(func.date(User.created_at), func.count(User.id)).where(User.created_at >= since).group_by(func.date(User.created_at)).order_by(func.date(User.created_at)))).all()
    return {"period_days": days, "registered_users": int(total), "new_users": int(new_users), "active_users_in_period": int(active),
            "active_users_last_24h": int(active_1d), "users_by_role": roles, "signups_per_day": [{"date": str(d), "count": int(c)} for d, c in signups]}


# ───────────── content bank: search and audit ─────────────
def _item_text(skill: str, item: dict) -> str:
    keys = ("word", "w", "meaning_native", "nat", "title", "q", "question", "writing_task", "text")
    return " · ".join(str(item.get(k)) for k in keys if item.get(k))


async def _bank_rows(db: AsyncSession, owner: User) -> list[tuple[str, str, str, Any, list]]:
    from app.api.routes.content_bank import GlobalContentEntry, UserCreatedContentEntry, ensure_legacy_import

    await ensure_legacy_import(db)
    rows: list[tuple[str, str, str, Any, list]] = []
    for entry in (await db.execute(select(GlobalContentEntry))).scalars():
        items = entry.content.get("items", []) if isinstance(entry.content, dict) else []
        rows.append(("global", entry.topic_key, entry.skill_key, None, items))
    created = (await db.execute(select(UserCreatedContentEntry).where((UserCreatedContentEntry.user_id == owner.id) | UserCreatedContentEntry.is_global.is_(True)))).scalars()
    for entry in created:
        rows.append(("created-global" if entry.is_global else "private", entry.topic_key, entry.skill_key, entry.id, [entry.content]))
    return rows


async def content_search(arguments: dict[str, Any], db: AsyncSession, owner: User) -> dict[str, Any]:
    query = str(arguments.get("query") or "").strip().casefold()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="query must have at least 2 characters")
    skill = str(arguments.get("skill") or "").strip().lower() or None
    topic = str(arguments.get("topic_key") or "").strip() or None
    try:
        limit = max(1, min(40, int(arguments.get("limit") or 15)))
    except (TypeError, ValueError):
        limit = 15
    matches, total = [], 0
    for source, topic_key, skill_key, entry_id, items in await _bank_rows(db, owner):
        if (skill and skill_key != skill) or (topic and topic_key != topic):
            continue
        for index, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            text = _item_text(skill_key, item)
            pos = text.casefold().find(query)
            if pos < 0:
                continue
            total += 1
            if len(matches) < limit:
                matches.append({"source": source, "topic_key": topic_key, "skill": skill_key, "index": index, "entry_id": entry_id,
                                "snippet": text[max(0, pos - 80): pos + 160]})
    return {"query": query, "total_matches": total, "matches": matches}


TEMPLATE_PATTERNS = {
    "wortschatz": [("placeholder antonym", lambda i: str(i.get("ant") or i.get("antonym") or "").strip() in {"das Gegenkonzept", "der Gegenbegriff"}),
                   ("placeholder synonym", lambda i: str(i.get("syn") or i.get("synonym") or "").startswith("der Fachbegriff")),
                   ("template example", lambda i: "spielt in der aktuellen Debatte" in str(i.get("ex") or i.get("example_sentence") or "")),
                   ("template note", lambda i: bool(re.search(r"Eintrag \d+", str(i.get("note") or i.get("usage_note") or "")))),
                   ("missing translation", lambda i: not str(i.get("nat") or i.get("meaning_native") or "").strip())],
    "lesen": [("template text", lambda i: "Im Mittelpunkt steht die These, dass Fortschritte bei" in str(i.get("text") or ""))],
    "hoeren": [("template transcript", lambda i: "Unsere Ausgangsfrage lautet" in str(i.get("text") or "") and "dauerhaft gute Ergebnisse" in str(i.get("text") or ""))],
    "grammatik": [("template example", lambda i: "gezielte Verbesserungen einführen" in str(i.get("ex") or ""))],
}


async def content_quality_audit(arguments: dict[str, Any], db: AsyncSession, owner: User) -> dict[str, Any]:
    skill_filter = str(arguments.get("skill") or "").strip().lower() or None
    topic_filter = str(arguments.get("topic_key") or "").strip() or None
    report: dict[str, Any] = {}
    for source, topic_key, skill_key, _entry_id, items in await _bank_rows(db, owner):
        if (skill_filter and skill_key != skill_filter) or (topic_filter and topic_key != topic_filter):
            continue
        checks = TEMPLATE_PATTERNS.get(skill_key, [])
        row = report.setdefault(skill_key, {}).setdefault(topic_key, {"items": 0, "flagged": 0, "issues": Counter(), "duplicates": 0, "examples": []})
        seen = set()
        for item in items:
            if not isinstance(item, dict):
                continue
            row["items"] += 1
            key = str(item.get("word") or item.get("w") or item.get("title") or item.get("q") or "").strip().casefold()
            if key and key in seen:
                row["duplicates"] += 1
            seen.add(key)
            hits = [name for name, test in checks if test(item)]
            if hits:
                row["flagged"] += 1
                row["issues"].update(hits)
                if len(row["examples"]) < 2:
                    row["examples"].append(_item_text(skill_key, item)[:140])
    summary = {}
    for skill_key, topics in report.items():
        items = sum(t["items"] for t in topics.values())
        flagged = sum(t["flagged"] for t in topics.values())
        summary[skill_key] = {"items": items, "flagged_template_or_incomplete": flagged, "share_flagged_pct": round(100 * flagged / items) if items else 0,
                              "topics": {k: {"items": v["items"], "flagged": v["flagged"], "issues": dict(v["issues"]), "duplicates": v["duplicates"], "examples": v["examples"]} for k, v in sorted(topics.items(), key=lambda kv: -kv[1]["flagged"])[:10]}}
    return {"audit": summary, "note": "Heuristic check for generated filler (placeholder synonyms/antonyms, template sentences, repeated texts). Flagged items can be replaced with generate_vocabulary / generate_learning_content."}


# ───────────── generators for the site content bank ─────────────
async def existing_words(db: AsyncSession, owner: User, topic_key: str) -> set[str]:
    from app.api.routes.content_bank import GlobalContentEntry, UserCreatedContentEntry

    words: set[str] = set()
    entry = await db.get(GlobalContentEntry, (topic_key, "wortschatz"))
    if entry and isinstance(entry.content, dict):
        words.update(str(i.get("word") or i.get("w") or "").strip().casefold() for i in entry.content.get("items", []) if isinstance(i, dict))
    rows = (await db.execute(select(UserCreatedContentEntry.content).where(UserCreatedContentEntry.topic_key == topic_key, UserCreatedContentEntry.skill_key == "wortschatz",
                                                                          (UserCreatedContentEntry.user_id == owner.id) | UserCreatedContentEntry.is_global.is_(True)))).scalars()
    words.update(str(i.get("word") or "").strip().casefold() for i in rows if isinstance(i, dict))
    words.discard("")
    return words


def _strip_article(word: str) -> str:
    return re.sub(r"^(der|die|das)\s+", "", word.strip(), flags=re.I).casefold()


VOCAB_PROMPT = """Du bist erfahrene DaF-Lexikografin und TestDaF-Trainerin. Erstelle genau {n} neue deutsche Wortschatzeinträge.
Thema: {topic}{focus}
Niveau: {level} (für TestDaF, akademischer Kontext; keine Anfängerwörter, keine Eigennamen)
Lernende: persischsprachig. Vermeide diese vorhandenen Wörter: {avoid}
Mische Wortarten sinnvoll (ca. 60 % Nomen, 25 % Verben, 15 % Adjektive/Ausdrücke). Jedes Wort nur einmal.
Antworte NUR mit JSON: {{"items": [{{
"word": "Grundform ohne Artikel (Verben im Infinitiv)",
"article": "der|die|das (nur bei Nomen, sonst weglassen)",
"plural": "Pluralform oder '-' wenn ungebräuchlich (nur bei Nomen)",
"part_of_speech": "Nomen|Verb|Adjektiv|Adverb|Ausdruck",
"level": "{level}",
"meaning_native": "persische Bedeutung, präzise",
"meaning_english": "englische Bedeutung",
"definition_de": "kurze deutsche Definition (ein Satz)",
"example": "natürlicher, themenbezogener Beispielsatz auf Deutsch (10–18 Wörter)",
"example_translation": "persische Übersetzung des Beispielsatzes",
"usage_note": "kurzer Gebrauchshinweis auf Deutsch (Rektion, Register oder typischer Fehler)",
"collocations": ["2–3 echte, häufige Kollokationen"],
"synonyms": ["nur echte Synonyme, sonst leere Liste"],
"antonyms": ["nur echte Antonyme, sonst leere Liste"]
}}]}}"""


async def generate_vocabulary(db: AsyncSession, owner: User, topic_key: str, topic_label: str, count: int, level: str, focus: str | None) -> list[dict[str, Any]]:
    from app.api.routes.owner_agent_tools import VocabularyItem  # local import avoids a cycle

    known = await existing_words(db, owner, topic_key)
    known_bare = {_strip_article(w) for w in known}
    accepted: list[dict[str, Any]] = []
    sem = asyncio.Semaphore(4)

    def has_items(data: dict) -> None:
        if not isinstance(data.get("items"), list) or not data["items"]:
            raise ValueError("no items")

    async def chunk(n: int, avoid: list[str]) -> list[dict]:
        async with sem:
            prompt = VOCAB_PROMPT.format(n=n, topic=topic_label, focus=f"\nSchwerpunkt: {focus}" if focus else "", level=level, avoid=", ".join(avoid[:160]) or "(keine)")
            try:
                data = await generate_json(prompt, max_tokens=5200, temperature=0.6, validate=has_items)
            except HTTPException:
                return []
            return [x for x in data.get("items", []) if isinstance(x, dict)]

    for _round in range(4):
        missing = count - len(accepted)
        if missing <= 0:
            break
        sizes = [min(8, missing - i) for i in range(0, missing + 1, 8) if missing - i > 0]
        # ask for a little more than needed: some entries fail validation or are duplicates
        sizes = [s + (1 if s >= 4 else 0) for s in sizes]
        avoid = sorted(known_bare | {_strip_article(i["word"]) for i in accepted})
        batches = await asyncio.gather(*(chunk(s, avoid) for s in sizes))
        for raw in (x for batch in batches for x in batch):
            if len(accepted) >= count:
                break
            raw = {k: v for k, v in raw.items() if v not in (None, "")}
            raw["level"] = level
            pos = str(raw.get("part_of_speech") or "").casefold()
            if not any(t in pos for t in ("nomen", "noun", "substantiv")):
                raw.pop("article", None)
                raw.pop("plural", None)
            try:
                item = VocabularyItem.model_validate(raw).model_dump(exclude_none=True)
            except ValueError:
                continue
            bare = _strip_article(item["word"])
            if not bare or bare in known_bare or any(_strip_article(a["word"]) == bare for a in accepted):
                continue
            accepted.append(item)
    if not accepted:
        raise HTTPException(status_code=502, detail="Vocabulary generation failed; please try again")
    return accepted[:count]


CONTENT_SCHEMAS = {
    "lesen": """{"title": "Überschrift", "text": "populärwissenschaftlicher Artikel, 480–620 Wörter, 5–6 Absätze getrennt durch Leerzeilen", "time": 20,
"questions": [7 Fragen: 4 × {"type": "mc", "q": "Frage", "options": ["A","B","C","D"], "a": "exakt eine der Optionen", "explanation_fa": "kurze persische Begründung mit Textbezug"},
 3 × {"type": "jnt", "q": "Aussage über den Text", "options": ["Ja", "Nein", "Text sagt dazu nichts"], "a": "eine der drei Optionen", "explanation_fa": "..."}]}""",
    "hoeren": """{"title": "Titel", "text": "Transkript eines Hochschul-Gesprächs/Interviews, 450–600 Wörter, jede Äußerung als eigene Zeile im Format 'Name: Text' (2–3 Personen)", "speed": "normal", "duration": 4,
"pre_vocab": ["6 Schlüsselwörter im Format 'das Wort – persische Bedeutung'"],
"questions": [6 Fragen: 4 × {"type": "mc", "q": "...", "options": ["A","B","C"], "a": "exakt eine Option", "explanation_fa": "..."}, 2 × {"type": "rf", "q": "Aussage", "options": ["Richtig", "Falsch"], "a": "Richtig|Falsch", "explanation_fa": "..."}]}""",
    "grammatik": """{"title": "Grammatikthema", "expl": "klare deutsche Erklärung (3–5 Sätze)", "expl_fa": "persische Erklärung", "formula": "Struktur/Formel", "ex": "Beispielsatz zum Thema", "ex_t": "persische Übersetzung",
"mistakes": ["3 typische Fehler persischsprachiger Lernender"], "exercises": [6 × {"q": "Übungsaufgabe (Satz umformen/ergänzen)", "a": "Musterlösung", "explanation_fa": "kurz"}]}""",
    "schreiben": """{"writing_task": "TestDaF-Argumentationsaufgabe mit Situation, Frage und Aufträgen (Position, Argumente, Beispiel, Fazit)", "min_w": 250, "max_w": 350, "time": 60,
"help": {"outline": ["Gliederung in 5–6 Schritten"], "connectors": ["8 Konnektoren"], "redemittel": ["6 Redemittel"], "vocab": ["10 Themenwörter"], "grammar": ["3 sinnvolle Strukturen"], "col": ["4 Kollokationen"]},
"sample_answer": "Mustertext 260–320 Wörter"}""",
    "sprechen": """{"q": "TestDaF-Sprechaufgabe mit Situation und klarer Aufforderung", "prep": 60, "time": 90, "aspect": "zu behandelnder Aspekt", "structure": ["4 Schritte der Antwort"],
"help": {"col": ["3 Kollokationen"], "vocab": ["8 Themenwörter"], "grammar": ["2 Strukturen"], "redemittel": ["4 Redemittel"], "argumentation": ["3 Argumentationsbausteine"]},
"sample_answer": "Musterantwort zum Sprechen (130–180 Wörter)"}""",
}


def _validate_content(skill: str, item: dict) -> None:
    from app.api.routes.content_bank import CreatedContentPayload, validate_created_content

    if skill in ("lesen", "hoeren"):
        words = len(str(item.get("text") or "").split())
        if words < (400 if skill == "lesen" else 340):
            raise ValueError(f"text too short ({words} words)")
        qs = item.get("questions") or []
        if len(qs) < 4:
            raise ValueError("too few questions")
        for q in qs:
            if not isinstance(q, dict) or not str(q.get("q") or "").strip() or not str(q.get("a") or "").strip():
                raise ValueError("incomplete question")
            options = [str(o).strip() for o in q.get("options") or []]
            if options and str(q["a"]).strip() not in options:
                raise ValueError("answer is not one of the options")
    if skill == "grammatik" and len(item.get("exercises") or []) < 4:
        raise ValueError("too few exercises")
    try:
        validate_created_content(CreatedContentPayload(topic_key="x", skill_key=skill, item=item))
    except HTTPException as exc:
        raise ValueError(str(exc.detail)) from exc


async def generate_learning_items(skill: str, topic_label: str, count: int, level: str, focus: str | None) -> list[dict[str, Any]]:
    schema = CONTENT_SCHEMAS[skill]

    async def one(index: int) -> dict | None:
        prompt = (f"Du bist erfahrene TestDaF-Autorin. Erstelle EIN neues, authentisches Übungselement für den Prüfungsteil {skill}.\n"
                  f"Thema: {topic_label}" + (f"; Schwerpunkt: {focus}" if focus else "") + f"\nNiveau: {level} (TestDaF TDN 4)\n"
                  + (f"Variante {index + 1} von {count}: wähle einen anderen Unteraspekt als die anderen Varianten.\n" if count > 1 else "")
                  + "Keine Platzhalter, keine Floskeln, natürliche Sprache, fachlich korrekt. Antworte NUR mit JSON in genau dieser Struktur:\n" + schema)
        try:
            data = await generate_json(prompt, max_tokens=7000, temperature=0.6, reasoning="medium", timeout=120, validate=lambda d: _validate_content(skill, d))
        except HTTPException:
            return None
        if skill in ("lesen", "hoeren"):
            data["words"] = len(str(data.get("text") or "").split())
            for q in data.get("questions") or []:
                q.setdefault("diff", level)
                q.setdefault("time", 75)
        data["level"] = level
        data["generated_by"] = "owner-agent"
        return data

    items = [x for x in await asyncio.gather(*(one(i) for i in range(count))) if x]
    if not items:
        raise HTTPException(status_code=502, detail="Content generation failed; please try again")
    return items


def preview_learning_item(skill: str, item: dict) -> str:
    if skill in ("lesen", "hoeren"):
        return f"«{item.get('title', '')}» – {item.get('words', '?')} Wörter, {len(item.get('questions') or [])} Fragen"
    if skill == "grammatik":
        return f"«{item.get('title', '')}» – {len(item.get('exercises') or [])} Übungen"
    if skill == "schreiben":
        return str(item.get("writing_task", ""))[:180]
    return str(item.get("q", ""))[:180]
