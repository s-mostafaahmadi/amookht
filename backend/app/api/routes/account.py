from datetime import date, datetime
from typing import Any

import jwt
import orjson
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.api.access import user_access_role
from app.domain.models.models import User, UserAppState, UserProfile
from app.infrastructure.database.connection import get_db

router = APIRouter()
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, get_settings().SECRET_KEY, algorithms=[get_settings().JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise ValueError("wrong token type")
        user_id = payload["sub"]
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = (await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account unavailable")
    return user


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    current_level: str | None = Field(default=None, max_length=10)
    target_exam: str | None = Field(default=None, max_length=50)
    target_level: str | None = Field(default=None, max_length=20)
    exam_date: date | None = None
    native_language: str | None = Field(default=None, max_length=20)
    profile_completed: bool | None = None
    daily_minutes: int | None = Field(default=None, ge=60, le=720)
    timezone: str | None = Field(default=None, max_length=60)
    learning_goals: list[str] | None = None
    accessibility: dict[str, Any] | None = None
    avatar_data_url: str | None = Field(default=None, max_length=400000)

    @field_validator("exam_date")
    @classmethod
    def exam_date_must_be_future(cls, value: date | None) -> date | None:
        if value is not None and value <= date.today():
            raise ValueError("Exam date must be in the future")
        return value


class StatePayload(BaseModel):
    schema_version: int = Field(default=1, ge=1)
    state_data: dict[str, Any]


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


def profile_response(user: User, profile: UserProfile) -> dict[str, Any]:
    meta = profile.metadata_ or {}
    return {
        "user_id": user.id, "email": user.email, "display_name": user.display_name,
        "access_role": user_access_role(user),
        "current_level": profile.current_level, "target_exam": profile.target_exam,
        "target_level": profile.target_level,
        "exam_date": profile.exam_date.isoformat() if profile.exam_date else None,
        "native_language": profile.native_language,
        "profile_completed": bool(meta.get("profile_completed")),
        "daily_minutes": meta.get("daily_minutes", 60), "timezone": meta.get("timezone"),
        "learning_goals": meta.get("learning_goals", []),
        "accessibility": meta.get("accessibility", {}),
        "avatar_data_url": meta.get("avatar_data_url"),
        "created_at": user.created_at.isoformat(), "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }


@router.get("/me")
async def me(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))).scalar_one()
    return profile_response(user, profile)


@router.patch("/profile")
async def update_profile(payload: ProfileUpdate, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == user.id))).scalar_one()
    values = payload.model_dump(exclude_unset=True)
    if "display_name" in values:
        user.display_name = values.pop("display_name")
    for field in ("current_level", "target_exam", "target_level", "exam_date", "native_language"):
        if field in values:
            setattr(profile, field, values.pop(field))
    meta = dict(profile.metadata_ or {})
    meta.update(values)
    profile.metadata_ = meta
    await db.commit()
    return profile_response(user, profile)


@router.get("/state")
async def get_state(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    state = (await db.execute(select(UserAppState).where(UserAppState.user_id == user.id))).scalar_one_or_none()
    return {"schema_version": state.schema_version if state else 1, "state_data": state.state_data if state else {}, "updated_at": state.updated_at.isoformat() if state else None}


@router.put("/state")
async def put_state(payload: StatePayload, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    state_size = len(orjson.dumps(payload.state_data))
    if state_size > get_settings().MAX_USER_STATE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "state_too_large", "max_bytes": get_settings().MAX_USER_STATE_BYTES},
        )
    state = (await db.execute(select(UserAppState).where(UserAppState.user_id == user.id))).scalar_one_or_none()
    incoming_state = payload.state_data if isinstance(payload.state_data, dict) else {}
    if incoming_state.get("dailyStudyMinutes") is not None:
        try:
            daily_minutes = round(float(incoming_state["dailyStudyMinutes"]) / 60) * 60
        except (TypeError, ValueError, OverflowError) as exc:
            raise HTTPException(status_code=422, detail="Daily study time must be between 1 and 12 hours") from exc
        incoming_state = dict(incoming_state)
        incoming_state["dailyStudyMinutes"] = max(60, min(720, int(daily_minutes)))
        payload.state_data = incoming_state
    if user_access_role(user) == "normal":
        previous = state.state_data if state and isinstance(state.state_data, dict) else {}
        incoming = payload.state_data if isinstance(payload.state_data, dict) else {}
        if incoming.get("contentBankPersonal", {"topics": {}}) != previous.get("contentBankPersonal", {"topics": {}}):
            raise HTTPException(status_code=403, detail="Adding learning data requires a Premium account")
        previous_user = previous.get("user") if isinstance(previous.get("user"), dict) else {}
        incoming_user = incoming.get("user") if isinstance(incoming.get("user"), dict) else {}
        if incoming_user.get("customTopic", "") != previous_user.get("customTopic", ""):
            raise HTTPException(status_code=403, detail="Adding a custom topic requires a Premium account")
        previous_plans = previous_user.get("customPlans") if isinstance(previous_user.get("customPlans"), list) else []
        incoming_plans = incoming_user.get("customPlans") if isinstance(incoming_user.get("customPlans"), list) else []
        previous_by_id = {
            str(plan.get("id")): plan for plan in previous_plans
            if isinstance(plan, dict) and plan.get("id")
        }
        for plan in incoming_plans:
            if not isinstance(plan, dict) or not plan.get("id") or previous_by_id.get(str(plan.get("id"))) != plan:
                raise HTTPException(status_code=403, detail="Creating or modifying a personal learning program requires a Premium account")
    if state:
        state.schema_version = payload.schema_version
        state.state_data = payload.state_data
        state.updated_at = datetime.utcnow()
    else:
        state = UserAppState(user_id=user.id, schema_version=payload.schema_version, state_data=payload.state_data)
        db.add(state)
    await db.commit()
    return {"saved": True, "updated_at": state.updated_at.isoformat()}


@router.post("/password")
async def change_password(payload: PasswordChange, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if not pwd_context.verify(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = pwd_context.hash(payload.new_password)
    await db.commit()
    return {"changed": True}


@router.delete("")
async def delete_account(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    await db.commit()
    return {"deleted": True}