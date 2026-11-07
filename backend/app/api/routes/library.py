from __future__ import annotations

import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_premium, user_access_role
from app.api.middleware.auth import get_current_user
from app.config import get_settings
from app.domain.models.models import LibraryDocument, LibraryFolder, LibraryNote, PdfAnnotation, User
from app.infrastructure.database.connection import get_db

router = APIRouter()
current_user = get_current_user
COLORS = re.compile(r"^#[0-9a-fA-F]{6}$")
ANNOTATION_TYPES = {"pen", "highlight", "underline", "strikeout", "text"}


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    parent_id: str | None = None
    color: str = "#7c3aed"

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Folder name is required")
        return value

    @field_validator("color")
    @classmethod
    def valid_color(cls, value: str) -> str:
        if not COLORS.fullmatch(value):
            raise ValueError("Color must be a six-digit hex value")
        return value.lower()


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    parent_id: str | None = None
    color: str | None = None


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    content: str = Field(default="", max_length=1_000_000)
    drawing: list[dict] = Field(default_factory=list, max_length=5000)
    folder_id: str | None = None
    color: str = "#fef3c7"


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    content: str | None = Field(default=None, max_length=1_000_000)
    drawing: list[dict] | None = Field(default=None, max_length=5000)
    folder_id: str | None = None
    color: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=240)
    folder_id: str | None = None


class AnnotationIn(BaseModel):
    annotation_type: Literal["pen", "highlight", "underline", "strikeout", "text"]
    payload: dict


class AnnotationPage(BaseModel):
    annotations: list[AnnotationIn] = Field(max_length=2000)


def folder_out(item: LibraryFolder) -> dict:
    return {"id": item.id, "parent_id": item.parent_id, "name": item.name, "color": item.color, "position": item.position, "created_at": item.created_at, "updated_at": item.updated_at}


def document_out(item: LibraryDocument) -> dict:
    return {"id": item.id, "folder_id": item.folder_id, "title": item.title, "original_filename": item.original_filename, "mime_type": item.mime_type, "size_bytes": item.size_bytes, "page_count": item.page_count, "created_at": item.created_at, "updated_at": item.updated_at}


def note_out(item: LibraryNote) -> dict:
    return {"id": item.id, "folder_id": item.folder_id, "title": item.title, "content": item.content, "drawing": item.drawing or [], "color": item.color, "created_at": item.created_at, "updated_at": item.updated_at}


def storage_root() -> Path:
    root = Path(get_settings().FILE_STORAGE_PATH).resolve() / "premium-library"
    root.mkdir(parents=True, exist_ok=True)
    return root


async def owned_folder(folder_id: str | None, user: User, db: AsyncSession) -> LibraryFolder | None:
    if folder_id is None:
        return None
    item = (await db.execute(select(LibraryFolder).where(LibraryFolder.id == folder_id, LibraryFolder.user_id == user.id))).scalar_one_or_none()
    if item is None:
        raise HTTPException(404, "Folder not found")
    return item


async def owned_document(document_id: str, user: User, db: AsyncSession) -> LibraryDocument:
    item = (await db.execute(select(LibraryDocument).where(LibraryDocument.id == document_id, LibraryDocument.user_id == user.id))).scalar_one_or_none()
    if item is None:
        raise HTTPException(404, "Document not found")
    return item


@router.get("/status")
async def status(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    premium = user_access_role(user) in {"premium", "admin", "owner"}
    used = (await db.execute(select(func.coalesce(func.sum(LibraryDocument.size_bytes), 0)).where(LibraryDocument.user_id == user.id))).scalar_one() if premium else 0
    settings = get_settings()
    return {"premium": premium, "role": user_access_role(user), "used_bytes": int(used), "quota_bytes": settings.LIBRARY_USER_QUOTA_MB * 1024 * 1024, "max_pdf_bytes": settings.LIBRARY_MAX_PDF_MB * 1024 * 1024}


@router.get("")
async def list_library(folder_id: str | None = None, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    if folder_id:
        await owned_folder(folder_id, user, db)
    folder_filter = LibraryFolder.parent_id.is_(None) if folder_id is None else LibraryFolder.parent_id == folder_id
    item_filter_doc = LibraryDocument.folder_id.is_(None) if folder_id is None else LibraryDocument.folder_id == folder_id
    item_filter_note = LibraryNote.folder_id.is_(None) if folder_id is None else LibraryNote.folder_id == folder_id
    folders = (await db.execute(select(LibraryFolder).where(LibraryFolder.user_id == user.id, folder_filter).order_by(LibraryFolder.position, LibraryFolder.name))).scalars().all()
    documents = (await db.execute(select(LibraryDocument).where(LibraryDocument.user_id == user.id, item_filter_doc).order_by(LibraryDocument.updated_at.desc()))).scalars().all()
    notes = (await db.execute(select(LibraryNote).where(LibraryNote.user_id == user.id, item_filter_note).order_by(LibraryNote.updated_at.desc()))).scalars().all()
    return {"folder_id": folder_id, "folders": [folder_out(x) for x in folders], "documents": [document_out(x) for x in documents], "notes": [note_out(x) for x in notes]}


@router.post("/folders", status_code=201)
async def create_folder(payload: FolderCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    await owned_folder(payload.parent_id, user, db)
    item = LibraryFolder(user_id=user.id, parent_id=payload.parent_id, name=payload.name, color=payload.color)
    db.add(item)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(409, "A folder with this name already exists here")
    await db.refresh(item)
    return folder_out(item)


@router.patch("/folders/{folder_id}")
async def update_folder(folder_id: str, payload: FolderUpdate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    item = await owned_folder(folder_id, user, db)
    values = payload.model_dump(exclude_unset=True)
    if "parent_id" in values:
        if values["parent_id"] == folder_id:
            raise HTTPException(400, "A folder cannot contain itself")
        await owned_folder(values["parent_id"], user, db)
    if "color" in values and values["color"] and not COLORS.fullmatch(values["color"]):
        raise HTTPException(422, "Invalid color")
    for key, value in values.items():
        setattr(item, key, value.strip() if key == "name" else value)
    await db.commit(); await db.refresh(item)
    return folder_out(item)


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder(folder_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    item = await owned_folder(folder_id, user, db)
    await db.delete(item); await db.commit()


@router.post("/documents", status_code=201)
async def upload_document(file: UploadFile = File(...), title: str | None = Form(default=None), folder_id: str | None = Form(default=None), user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    await owned_folder(folder_id, user, db)
    settings = get_settings()
    max_bytes = settings.LIBRARY_MAX_PDF_MB * 1024 * 1024
    document_id = str(uuid.uuid4()); relative = f"{user.id}/{document_id}.pdf"; path = storage_root() / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(".upload")
    size = 0
    try:
        with temp.open("xb") as output:
            first = await file.read(8192)
            if not first.startswith(b"%PDF-"):
                raise HTTPException(415, "Only valid PDF files are accepted")
            output.write(first); size = len(first)
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(413, f"PDF exceeds the {settings.LIBRARY_MAX_PDF_MB} MB limit")
                output.write(chunk)
        used = int((await db.execute(select(func.coalesce(func.sum(LibraryDocument.size_bytes), 0)).where(LibraryDocument.user_id == user.id))).scalar_one())
        if used + size > settings.LIBRARY_USER_QUOTA_MB * 1024 * 1024:
            raise HTTPException(413, "Library storage quota exceeded")
        os.replace(temp, path)
        original = Path(file.filename or "document.pdf").name[:255]
        item = LibraryDocument(id=document_id, user_id=user.id, folder_id=folder_id, title=(title or Path(original).stem or "PDF")[:240], original_filename=original, storage_key=relative, size_bytes=size)
        db.add(item); await db.commit(); await db.refresh(item)
        return document_out(item)
    except Exception:
        temp.unlink(missing_ok=True); path.unlink(missing_ok=True); await db.rollback(); raise


@router.get("/documents/{document_id}/file")
async def download_document(document_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    item = await owned_document(document_id, user, db)
    path = storage_root() / item.storage_key
    if not path.is_file():
        raise HTTPException(404, "PDF file is missing")
    return FileResponse(path, media_type="application/pdf", filename=item.original_filename, content_disposition_type="inline")


@router.patch("/documents/{document_id}")
async def update_document(document_id: str, payload: DocumentUpdate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user); item = await owned_document(document_id, user, db)
    values = payload.model_dump(exclude_unset=True)
    if "folder_id" in values: await owned_folder(values["folder_id"], user, db)
    for key, value in values.items(): setattr(item, key, value.strip() if key == "title" else value)
    await db.commit(); await db.refresh(item); return document_out(item)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(document_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user); item = await owned_document(document_id, user, db); path = storage_root() / item.storage_key
    await db.delete(item); await db.commit(); path.unlink(missing_ok=True)


@router.post("/notes", status_code=201)
async def create_note(payload: NoteCreate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user); await owned_folder(payload.folder_id, user, db)
    if not COLORS.fullmatch(payload.color): raise HTTPException(422, "Invalid color")
    item = LibraryNote(user_id=user.id, **payload.model_dump()); db.add(item); await db.commit(); await db.refresh(item); return note_out(item)


@router.patch("/notes/{note_id}")
async def update_note(note_id: str, payload: NoteUpdate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    item = (await db.execute(select(LibraryNote).where(LibraryNote.id == note_id, LibraryNote.user_id == user.id))).scalar_one_or_none()
    if item is None: raise HTTPException(404, "Note not found")
    values = payload.model_dump(exclude_unset=True)
    if "folder_id" in values: await owned_folder(values["folder_id"], user, db)
    if values.get("color") and not COLORS.fullmatch(values["color"]): raise HTTPException(422, "Invalid color")
    for key, value in values.items(): setattr(item, key, value.strip() if key == "title" else value)
    await db.commit(); await db.refresh(item); return note_out(item)


@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user)
    item = (await db.execute(select(LibraryNote).where(LibraryNote.id == note_id, LibraryNote.user_id == user.id))).scalar_one_or_none()
    if item is None: raise HTTPException(404, "Note not found")
    await db.delete(item); await db.commit()


@router.get("/documents/{document_id}/annotations")
async def get_annotations(document_id: str, page: int | None = None, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user); await owned_document(document_id, user, db)
    query = select(PdfAnnotation).where(PdfAnnotation.document_id == document_id, PdfAnnotation.user_id == user.id)
    if page is not None: query = query.where(PdfAnnotation.page_number == page)
    rows = (await db.execute(query.order_by(PdfAnnotation.page_number, PdfAnnotation.created_at))).scalars().all()
    return [{"id": x.id, "page_number": x.page_number, "annotation_type": x.annotation_type, "payload": x.payload} for x in rows]


@router.put("/documents/{document_id}/annotations/{page_number}")
async def replace_annotations(document_id: str, page_number: int, payload: AnnotationPage, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_premium(user); await owned_document(document_id, user, db)
    if page_number < 1: raise HTTPException(422, "Page number must be positive")
    await db.execute(delete(PdfAnnotation).where(PdfAnnotation.document_id == document_id, PdfAnnotation.user_id == user.id, PdfAnnotation.page_number == page_number))
    for annotation in payload.annotations:
        db.add(PdfAnnotation(user_id=user.id, document_id=document_id, page_number=page_number, annotation_type=annotation.annotation_type, payload=annotation.payload))
    await db.commit()
    return {"saved": len(payload.annotations), "page_number": page_number}

