from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.access import require_admin, require_owner, user_access_role
from app.config import get_settings
from app.api.routes.account import current_user
from app.api.routes.auth import normalize_and_validate_email, pwd_context, validate_password_strength
from app.domain.models.models import User, UserProfile
from app.infrastructure.database.connection import get_db

router = APIRouter()


class RoleUpdate(BaseModel):
    access_role: Literal["normal", "premium", "admin"]


class ManagedUserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


def user_row(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "access_role": user_access_role(user),
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.get("/users")
async def list_users(
    limit: int = Query(default=50, ge=1),
    offset: int = Query(default=0, ge=0),
    query: str | None = Query(default=None, max_length=255),
    role: Literal["normal", "premium", "admin", "owner"] | None = Query(default=None),
    admin: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(admin)
    limit = min(limit, get_settings().ADMIN_USERS_PAGE_SIZE_MAX)
    filters = [User.deleted_at.is_(None)]
    if query:
        pattern = f"%{query.strip().lower()}%"
        filters.append(or_(func.lower(User.email).like(pattern), func.lower(User.display_name).like(pattern)))
    if role:
        filters.append(User.access_role == role)
    total = (await db.execute(select(func.count()).select_from(User).where(*filters))).scalar_one()
    users = (await db.execute(
        select(User).where(*filters).order_by(User.created_at.desc(), User.id).offset(offset).limit(limit)
    )).scalars().all()
    return {"users": [user_row(user) for user in users], "total": total, "limit": limit, "offset": offset}


@router.post("/users", status_code=201)
async def create_verified_user(payload: ManagedUserCreate, admin: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_admin(admin)
    email = normalize_and_validate_email(payload.email, check_deliverability=False)
    validate_password_strength(payload.password)
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="This email is already registered")
    user = User(
        email=email,
        password_hash=pwd_context.hash(payload.password),
        display_name=email.split("@", 1)[0],
        access_role="normal",
        is_active=True,
        is_verified=True,
    )
    try:
        db.add(user)
        await db.flush()
        db.add(UserProfile(user_id=user.id))
        await db.commit()
        await db.refresh(user)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="This email is already registered") from exc
    return user_row(user)

@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, payload: RoleUpdate, owner: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_owner(owner)
    target = (await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if user_access_role(target) == "owner":
        raise HTTPException(status_code=403, detail="The owner account cannot be changed")
    target.access_role = payload.access_role
    await db.commit()
    return user_row(target)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, owner: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    require_owner(owner)
    target = (await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if user_access_role(target) == "owner":
        raise HTTPException(status_code=403, detail="The owner account cannot be deleted")
    target.is_active = False
    target.deleted_at = datetime.utcnow()
    await db.commit()
    return {"deleted": True, "user_id": target.id}