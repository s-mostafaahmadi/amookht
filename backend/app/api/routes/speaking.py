import hashlib
import hmac
import re
import shutil
from datetime import date, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.api.middleware.auth import get_current_user
from app.config import get_settings
from app.domain.models.models import User

router = APIRouter()
RECORDINGS_ROOT = (Path(__file__).resolve().parents[3] / "data" / "speaking_recordings").resolve()
MAX_AUDIO_BYTES = 25 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {"audio/webm": ".webm", "audio/ogg": ".ogg", "audio/mp4": ".m4a", "audio/mpeg": ".mp3", "audio/wav": ".wav"}


def _safe_segment(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "-", value).strip("-")[:80]
    return cleaned or fallback


def _user_directory(user_id: str) -> Path:
    digest = hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:24]
    return (RECORDINGS_ROOT / digest).resolve()


def _playback_token(recording_id: str, user_id: str) -> str:
    message = f"{recording_id}:{user_id}".encode("utf-8")
    return hmac.new(get_settings().SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()


class SpeakingSubmitRequest(BaseModel):
    module: str = "testdaf"
    topic_id: str | None = None
    prompt: str
    response_text: str
    time_spent_seconds: int | None = None


KEEP_PREFIX = "keep-tdm-"


def _prune_old_days(user_dir: Path) -> int:
    """Delete TestDaF-method recordings older than yesterday: only their analysis is kept (owner decision 2026-11-12)."""
    cutoff = (date.today() - timedelta(days=1)).isoformat()
    removed = 0
    if not user_dir.exists() or RECORDINGS_ROOT not in user_dir.parents:
        return 0
    for path in list(user_dir.iterdir()):
        day = path.name[len(KEEP_PREFIX):]
        if path.is_dir() and path.name.startswith(KEEP_PREFIX) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", day) and day < cutoff:
            removed += sum(1 for item in path.rglob("*") if item.is_file())
            shutil.rmtree(path, ignore_errors=True)
    return removed


@router.post("/recordings", status_code=201)
async def save_recording(plan_id: str = Form(...), task_id: str = Form(...), audio: UploadFile = File(...), user: User = Depends(get_current_user)):
    content_type = (audio.content_type or "").split(";", 1)[0].lower()
    extension = ALLOWED_AUDIO_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=415, detail="Unsupported audio format")
    payload = await audio.read(MAX_AUDIO_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="Empty audio recording")
    if len(payload) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio recording is too large")
    user_dir = _user_directory(user.id)
    try:
        _prune_old_days(user_dir)
    except OSError:
        pass
    plan_dir = (user_dir / _safe_segment(plan_id, "plan")).resolve()
    if user_dir not in plan_dir.parents:
        raise HTTPException(status_code=400, detail="Invalid recording path")
    plan_dir.mkdir(parents=True, exist_ok=True)
    recording_id = uuid4().hex
    filename = f"{_safe_segment(task_id, 'task')}-{recording_id}{extension}"
    destination = (plan_dir / filename).resolve()
    destination.write_bytes(payload)
    return {"id": recording_id, "filename": filename, "content_type": content_type, "size_bytes": len(payload), "playback_url": f"/v1/speaking/recordings/{recording_id}", "playback_token": _playback_token(recording_id, user.id)}


@router.get("/recordings/{recording_id}")
async def play_recording(recording_id: str, user_id: str = Query(...), token: str = Query(...)):
    safe_id = _safe_segment(recording_id, "invalid")
    if safe_id != recording_id:
        raise HTTPException(status_code=400, detail="Invalid recording id")
    if not hmac.compare_digest(token, _playback_token(recording_id, user_id)):
        raise HTTPException(status_code=403, detail="Invalid playback token")
    user_dir = _user_directory(user_id)
    if user_dir.exists():
        matches = list(user_dir.rglob(f"*-{safe_id}.*"))
        if matches:
            path = matches[0].resolve()
            if user_dir in path.parents:
                return FileResponse(path)
    raise HTTPException(status_code=404, detail="Recording not found")


@router.delete("/recordings/{recording_id}")
async def delete_recording(recording_id: str, user: User = Depends(get_current_user)):
    """Delete one of the user's own recordings (a take replaced by a new recording)."""
    if not re.fullmatch(r"[0-9a-f]{32}", recording_id or ""):
        raise HTTPException(status_code=400, detail="Invalid recording id")
    user_dir = _user_directory(user.id)
    removed = 0
    if user_dir.exists() and RECORDINGS_ROOT in user_dir.parents:
        for path in user_dir.rglob(f"*-{recording_id}.*"):
            target = path.resolve()
            if user_dir in target.parents and target.is_file():
                target.unlink()
                removed += 1
    return {"removed": removed}


@router.delete("/recordings")
async def clear_recordings(user: User = Depends(get_current_user)):
    user_dir = _user_directory(user.id)
    removed = 0
    if user_dir.exists() and RECORDINGS_ROOT in user_dir.parents:
        # Folders named keep-* hold the current TestDaF-method takes; earlier days are pruned (only the analysis is kept).
        removed += _prune_old_days(user_dir)
        for path in list(user_dir.iterdir()):
            if path.is_dir() and path.name.startswith("keep-"):
                continue
            if path.is_dir():
                removed += sum(1 for item in path.rglob("*") if item.is_file())
                shutil.rmtree(path)
            elif path.is_file():
                path.unlink()
                removed += 1
    return {"removed_files": removed}


@router.post("/submissions", status_code=201)
async def submit_speaking(request: SpeakingSubmitRequest, user: User = Depends(get_current_user)):
    return {"id": "mock-id", "prompt": request.prompt, "status": "submitted"}


@router.get("/submissions")
async def list_speaking_submissions(user: User = Depends(get_current_user)):
    return []
