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


@router.get("")
async def get_testdaf_exams(user: User = Depends(current_user)) -> dict[str, Any]:
    require_premium(user)
    return read_library()


@router.post("")
async def put_testdaf_exam(payload: TestdafExamPayload, user: User = Depends(current_user)) -> dict[str, Any]:
    require_admin(user)
    stats = validate_exam_data(payload.data)
    library = read_library()
    now = datetime.now(timezone.utc).isoformat()
    exam_id = payload.id or f"testdaf-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid4().hex[:8]}"
    existing = next((item for item in library["exams"] if item.get("id") == exam_id), None)
    exam = {
        "id": exam_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "source_filename": payload.source_filename.strip(),
        "created_at": existing.get("created_at") if existing else now,
        "updated_at": now,
        "stats": stats,
        "data": payload.data,
    }
    library["exams"] = [item for item in library["exams"] if item.get("id") != exam_id]
    library["exams"].append(exam)
    write_library(library)
    return {"saved": True, "exam": exam}


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