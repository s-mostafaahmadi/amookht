import hashlib
import re
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

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


class SpeakingSubmitRequest(BaseModel):
    module: str = "testdaf"
    topic_id: str | None = None
    prompt: str
    response_text: str
    time_spent_seconds: int | None = None


@router.post("/recordings", status_code=201)
async def save_recording(user_id: str = Form(...), plan_id: str = Form(...), task_id: str = Form(...), audio: UploadFile = File(...)):
    content_type = (audio.content_type or "").split(";", 1)[0].lower()
    extension = ALLOWED_AUDIO_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=415, detail="Unsupported audio format")
    payload = await audio.read(MAX_AUDIO_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="Empty audio recording")
    if len(payload) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio recording is too large")
    user_dir = _user_directory(user_id)
    plan_dir = (user_dir / _safe_segment(plan_id, "plan")).resolve()
    if user_dir not in plan_dir.parents:
        raise HTTPException(status_code=400, detail="Invalid recording path")
    plan_dir.mkdir(parents=True, exist_ok=True)
    recording_id = uuid4().hex
    filename = f"{_safe_segment(task_id, 'task')}-{recording_id}{extension}"
    destination = (plan_dir / filename).resolve()
    destination.write_bytes(payload)
    return {"id": recording_id, "filename": filename, "content_type": content_type, "size_bytes": len(payload), "playback_url": f"/v1/speaking/recordings/{recording_id}"}


@router.get("/recordings/{recording_id}")
async def play_recording(recording_id: str):
    safe_id = _safe_segment(recording_id, "invalid")
    if safe_id != recording_id:
        raise HTTPException(status_code=400, detail="Invalid recording id")
    if RECORDINGS_ROOT.exists():
        matches = list(RECORDINGS_ROOT.rglob(f"*-{safe_id}.*"))
        if matches:
            path = matches[0].resolve()
            if RECORDINGS_ROOT in path.parents:
                return FileResponse(path)
    raise HTTPException(status_code=404, detail="Recording not found")


@router.delete("/recordings")
async def clear_recordings(user_id: str):
    user_dir = _user_directory(user_id)
    removed = 0
    if user_dir.exists() and RECORDINGS_ROOT in user_dir.parents:
        removed = sum(1 for path in user_dir.rglob("*") if path.is_file())
        shutil.rmtree(user_dir)
    return {"removed_files": removed}


@router.post("/submissions", status_code=201)
async def submit_speaking(request: SpeakingSubmitRequest):
    return {"id": "mock-id", "prompt": request.prompt, "status": "submitted"}


@router.get("/submissions")
async def list_speaking_submissions():
    return []