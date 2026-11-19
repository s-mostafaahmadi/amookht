from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.api.routes.account import current_user
from app.api.access import require_admin as require_admin_access, require_premium
from app.config import get_settings
from app.domain.models.models import User

router = APIRouter()
EXAM_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,79}$")


class TestdafExamPayload(BaseModel):
    id: str | None = Field(default=None, max_length=80)
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(default="", max_length=600)
    source_filename: str = Field(default="", max_length=180)
    data: dict[str, Any]

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip().lower()
        if not EXAM_ID_RE.fullmatch(normalized):
            raise ValueError("Exam id must contain only lowercase letters, numbers, and hyphens")
        return normalized


def library_path() -> Path:
    settings = get_settings()
    base = Path(settings.FILE_STORAGE_PATH)
    if not base.is_absolute():
        base = Path(__file__).resolve().parents[3] / base
    base.mkdir(parents=True, exist_ok=True)
    return base / "global_testdaf_exams.json"


def read_library() -> dict[str, Any]:
    path = library_path()
    if not path.exists():
        return {"version": 1, "exams": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"version": 1, "exams": []}
    exams = data.get("exams") if isinstance(data, dict) else None
    return {"version": 1, "exams": exams if isinstance(exams, list) else []}


def write_library(data: dict[str, Any]) -> None:
    path = library_path()
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def require_admin(user: User) -> None:
    require_admin_access(user)


def _require_text(value: Any, label: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(status_code=422, detail=f"{label} must be a non-empty string")


def validate_exam_data(data: dict[str, Any]) -> dict[str, int]:
    for section in ("lesen", "hoeren", "schreiben", "sprechen"):
        if not isinstance(data.get(section), dict):
            raise HTTPException(status_code=422, detail=f"Missing or invalid section: {section}")

    reading_texts = data["lesen"].get("texts")
    if not isinstance(reading_texts, list) or len(reading_texts) != 4:
        raise HTTPException(status_code=422, detail="Lesen must contain exactly 4 texts")
    reading_questions = 0
    for text_index, part in enumerate(reading_texts, start=1):
        if not isinstance(part, dict):
            raise HTTPException(status_code=422, detail=f"Lesen text {text_index} is invalid")
        _require_text(part.get("title"), f"Lesen text {text_index} title")
        _require_text(part.get("text"), f"Lesen text {text_index} content")
        questions = part.get("questions")
        if not isinstance(questions, list) or not questions:
            raise HTTPException(status_code=422, detail=f"Lesen text {text_index} has no questions")
        reading_questions += len(questions)
        for question_index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                raise HTTPException(status_code=422, detail=f"Lesen question {text_index}.{question_index} is invalid")
            _require_text(question.get("q"), f"Lesen question {text_index}.{question_index}")
            options = question.get("options")
            answer = question.get("answer")
            if not isinstance(options, list) or len(options) < 2 or not isinstance(answer, int) or answer < 0 or answer >= len(options):
                raise HTTPException(status_code=422, detail=f"Lesen question {text_index}.{question_index} needs options and a valid answer index")
    if reading_questions != 40:
        raise HTTPException(status_code=422, detail=f"Lesen must contain exactly 40 questions; received {reading_questions}")

    listening_texts = data["hoeren"].get("texts")
    if not isinstance(listening_texts, list) or len(listening_texts) != 4:
        raise HTTPException(status_code=422, detail="Hören must contain exactly 4 texts")
    listening_questions = 0
    for text_index, part in enumerate(listening_texts, start=1):
        if not isinstance(part, dict):
            raise HTTPException(status_code=422, detail=f"Hören text {text_index} is invalid")
        _require_text(part.get("title"), f"Hören text {text_index} title")
        _require_text(part.get("text"), f"Hören text {text_index} content")
        questions = part.get("questions")
        if not isinstance(questions, list) or not questions:
            raise HTTPException(status_code=422, detail=f"Hören text {text_index} has no questions")
        listening_questions += len(questions)
        for question_index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                raise HTTPException(status_code=422, detail=f"Hören question {text_index}.{question_index} is invalid")
            _require_text(question.get("q"), f"Hören question {text_index}.{question_index}")
            question_type = question.get("type")
            if question_type not in {"mc", "gap", "summary"}:
                raise HTTPException(status_code=422, detail=f"Hören question {text_index}.{question_index} has an invalid type")
            if question_type == "mc":
                options = question.get("options")
                answer = question.get("answer")
                if not isinstance(options, list) or len(options) < 2 or not isinstance(answer, int) or answer < 0 or answer >= len(options):
                    raise HTTPException(status_code=422, detail=f"Hören question {text_index}.{question_index} needs options and a valid answer index")
            else:
                _require_text(question.get("answer"), f"Hören answer {text_index}.{question_index}")
    if listening_questions != 35:
        raise HTTPException(status_code=422, detail=f"Hören must contain exactly 35 questions; received {listening_questions}")

    writing = data["schreiben"]
    for key in ("title", "task", "chartTitle"):
        _require_text(writing.get(key), f"Schreiben {key}")
    chart = writing.get("chart")
    if not isinstance(chart, list) or len(chart) < 3:
        raise HTTPException(status_code=422, detail="Schreiben chart must contain at least 3 data points")
    if int(writing.get("min", 0) or 0) != 350 or int(writing.get("max", 0) or 0) != 400:
        raise HTTPException(status_code=422, detail="Schreiben word range must be 350–400")

    speaking_tasks = data["sprechen"].get("tasks")
    if not isinstance(speaking_tasks, list) or len(speaking_tasks) != 7:
        raise HTTPException(status_code=422, detail="Sprechen must contain exactly 7 tasks")
    for task_index, task in enumerate(speaking_tasks, start=1):
        if not isinstance(task, dict):
            raise HTTPException(status_code=422, detail=f"Sprechen task {task_index} is invalid")
        _require_text(task.get("type"), f"Sprechen task {task_index} type")
        _require_text(task.get("q"), f"Sprechen task {task_index}")
        if int(task.get("prep", 0) or 0) <= 0 or int(task.get("time", 0) or 0) <= 0:
            raise HTTPException(status_code=422, detail=f"Sprechen task {task_index} needs positive prep and speaking times")

    return {"lesen_questions": reading_questions, "hoeren_questions": listening_questions, "sprechen_tasks": len(speaking_tasks)}


def empty_exam_data() -> dict[str, Any]:
    return {
        "lesen": {"texts": []},
        "hoeren": {"texts": []},
        "schreiben": {},
        "sprechen": {"tasks": []},
    }


def _runtime_question(value: Any, section: str, index: int) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    question = dict(value)
    question["q"] = str(value.get("q") or value.get("question") or value.get("prompt") or f"Question {index + 1}").strip()
    options = [str(item) for item in value.get("options", []) if str(item).strip()] if isinstance(value.get("options"), list) else []
    answer = value.get("answer", value.get("c", value.get("a", "")))
    if options:
        try:
            answer_index = options.index(str(answer))
        except ValueError:
            try:
                answer_index = max(0, min(len(options) - 1, int(answer)))
            except (TypeError, ValueError):
                answer_index = 0
        answer = answer_index
    if section == "lesen" and len(options) < 2:
        options = [options[0] if options else "Richtig", "Falsch"]
        answer = 0
    question["options"] = options
    question["answer"] = answer
    question["type"] = "mc" if section == "lesen" or len(options) >= 2 else (value.get("type") if value.get("type") in {"gap", "summary"} else "gap")
    return question


def _safe_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return default


def normalize_flexible_exam_data(value: Any) -> dict[str, Any]:
    source = value if isinstance(value, dict) else {}
    normalized = empty_exam_data()
    for section in ("lesen", "hoeren"):
        section_data = source.get(section) if isinstance(source.get(section), dict) else {}
        rows = section_data.get("texts", []) if isinstance(section_data.get("texts"), list) else []
        parts: list[dict[str, Any]] = []
        for item_index, item in enumerate(rows):
            if not isinstance(item, dict):
                continue
            raw_questions = item.get("questions") if isinstance(item.get("questions"), list) else ([item] if item.get("q") or item.get("question") else [])
            questions = [question for question_index, raw in enumerate(raw_questions) if (question := _runtime_question(raw, section, question_index))]
            if not questions:
                continue
            part = dict(item)
            part.update({
                "title": str(item.get("title") or ("Lesetext" if section == "lesen" else "Hörtext") + f" {item_index + 1}"),
                "text": str(item.get("text") or item.get("transcript") or item.get("content") or ""),
                "kind": str(item.get("kind") or "Aufgabe"),
                "time": max(1, _safe_int(item.get("time"), 10)),
                "questions": questions,
            })
            parts.append(part)
        normalized[section] = {"texts": parts}

    writing = dict(source.get("schreiben")) if isinstance(source.get("schreiben"), dict) else {}
    chart: list[list[Any]] = []
    for index, point in enumerate(writing.get("chart", []) if isinstance(writing.get("chart"), list) else []):
        if isinstance(point, (list, tuple)) and len(point) >= 2:
            chart.append([str(point[0]), max(0, min(100, _safe_int(point[1], 0)))])
        else:
            chart.append([str(index + 1), max(0, min(100, _safe_int(point, 0)))])
    writing.update({
        "title": str(writing.get("title") or "Schreiben"),
        "task": str(writing.get("task") or writing.get("question") or ""),
        "chartTitle": str(writing.get("chartTitle") or "Grafik"),
        "chart": chart or [["1", 0], ["2", 0], ["3", 0]],
        "min": _safe_int(writing.get("min"), 350),
        "max": _safe_int(writing.get("max"), 400),
        "time": max(1, _safe_int(writing.get("time"), 60)),
    })
    normalized["schreiben"] = writing

    speaking = source.get("sprechen") if isinstance(source.get("sprechen"), dict) else {}
    tasks = speaking.get("tasks", []) if isinstance(speaking.get("tasks"), list) else []
    normalized["sprechen"] = {"tasks": [
        {
            **task,
            "type": str(task.get("type") or task.get("level") or f"Aufgabe {index + 1}"),
            "q": str(task.get("q") or task.get("question") or task.get("instructions") or f"Sprechaufgabe {index + 1}"),
            "prep": max(1, _safe_int(task.get("prep"), 30)),
            "time": max(1, _safe_int(task.get("time"), 90)),
        }
        for index, task in enumerate(tasks) if isinstance(task, dict)
    ]}
    return normalized


def merge_exam_data(existing: dict[str, Any] | None, incoming: dict[str, Any]) -> dict[str, Any]:
    merged = empty_exam_data()
    incoming_source = incoming if isinstance(incoming, dict) else {}
    current = normalize_flexible_exam_data(existing)
    incoming = normalize_flexible_exam_data(incoming)
    for section in ("lesen", "hoeren"):
        old_items = current.get(section, {}).get("texts", []) if isinstance(current.get(section), dict) else []
        new_items = incoming.get(section, {}).get("texts", []) if isinstance(incoming.get(section), dict) else []
        merged[section] = {"texts": [*old_items, *new_items]}
    old_tasks = current.get("sprechen", {}).get("tasks", []) if isinstance(current.get("sprechen"), dict) else []
    new_tasks = incoming.get("sprechen", {}).get("tasks", []) if isinstance(incoming.get("sprechen"), dict) else []
    merged["sprechen"] = {"tasks": [*old_tasks, *new_tasks]}
    incoming_writing = incoming.get("schreiben") if isinstance(incoming_source.get("schreiben"), dict) and incoming_source.get("schreiben") else None
    merged["schreiben"] = incoming_writing if isinstance(incoming_writing, dict) and incoming_writing else current.get("schreiben", {})
    return merged


def flexible_exam_stats(data: dict[str, Any]) -> dict[str, int]:
    reading = data.get("lesen", {}).get("texts", []) if isinstance(data.get("lesen"), dict) else []
    listening = data.get("hoeren", {}).get("texts", []) if isinstance(data.get("hoeren"), dict) else []
    speaking = data.get("sprechen", {}).get("tasks", []) if isinstance(data.get("sprechen"), dict) else []
    return {
        "lesen_questions": sum(len(item.get("questions", [])) for item in reading if isinstance(item, dict)),
        "hoeren_questions": sum(len(item.get("questions", [])) for item in listening if isinstance(item, dict)),
        "schreiben_tasks": 1 if isinstance(data.get("schreiben"), dict) and data["schreiben"].get("task") else 0,
        "sprechen_tasks": len(speaking),
    }


@router.get("")
async def get_testdaf_exams(user: User = Depends(current_user)) -> dict[str, Any]:
    require_premium(user)
    library = read_library()
    for exam in library["exams"]:
        exam["data"] = normalize_flexible_exam_data(exam.get("data"))
        exam["stats"] = flexible_exam_stats(exam["data"])
    return library


@router.post("")
async def put_testdaf_exam(payload: TestdafExamPayload, user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    library = read_library()
    now = datetime.now(timezone.utc).isoformat()
    existing = next((item for item in library["exams"] if item.get("id") == payload.id), None) if payload.id else None
    if existing is None:
        normalized_title = payload.title.strip().casefold()
        existing = next((item for item in library["exams"] if str(item.get("title", "")).strip().casefold() == normalized_title), None)
    exam_id = existing.get("id") if existing else (payload.id or f"testdaf-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid4().hex[:8]}")
    merged_data = merge_exam_data(existing.get("data") if existing else None, payload.data)
    stats = flexible_exam_stats(merged_data)
    exam = {
        "id": exam_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "source_filename": payload.source_filename.strip(),
        "created_at": existing.get("created_at") if existing else now,
        "updated_at": now,
        "stats": stats,
        "data": merged_data,
    }
    library["exams"] = [item for item in library["exams"] if item.get("id") != exam_id]
    library["exams"].append(exam)
    write_library(library)
    return {"saved": True, "exam": exam}


@router.delete("/{exam_id}/sections/{section}/items/{item_index}/questions/{question_index}")
async def delete_testdaf_question(exam_id: str, section: str, item_index: int, question_index: int, user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    if section not in {"lesen", "hoeren"}:
        raise HTTPException(status_code=422, detail="Questions can only be deleted from Lesen or Hören")
    library = read_library()
    exam = next((item for item in library["exams"] if item.get("id") == exam_id), None)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    try:
        questions = exam["data"][section]["texts"][item_index]["questions"]
        questions.pop(question_index)
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=404, detail="Question not found")
    exam["stats"] = flexible_exam_stats(exam["data"])
    exam["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_library(library)
    return {"deleted": True, "stats": exam["stats"]}


@router.delete("/{exam_id}/sections/{section}/items/{item_index}")
async def delete_testdaf_section_item(exam_id: str, section: str, item_index: int, user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    library = read_library()
    exam = next((item for item in library["exams"] if item.get("id") == exam_id), None)
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    try:
        if section in {"lesen", "hoeren"}:
            exam["data"][section]["texts"].pop(item_index)
        elif section == "sprechen":
            exam["data"][section]["tasks"].pop(item_index)
        elif section == "schreiben" and item_index == 0:
            exam["data"][section] = {}
        else:
            raise IndexError
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=404, detail="Section item not found")
    exam["stats"] = flexible_exam_stats(exam["data"])
    exam["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_library(library)
    return {"deleted": True, "stats": exam["stats"]}


@router.delete("/{exam_id}")
async def delete_testdaf_exam(exam_id: str, user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    library = read_library()
    previous_count = len(library["exams"])
    library["exams"] = [item for item in library["exams"] if item.get("id") != exam_id]
    if len(library["exams"]) == previous_count:
        raise HTTPException(status_code=404, detail="Exam not found")
    write_library(library)
    return {"deleted": True, "id": exam_id}
