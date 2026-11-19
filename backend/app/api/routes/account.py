from datetime import date, datetime
from typing import Any

import jwt
import orjson
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.api.passwords import pwd_context  # NO-PASSLIB
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.api.access import has_premium_access, trial_until, user_access_role
from app.domain.models.models import User, UserAppState, UserProfile
from app.infrastructure.database.connection import get_db
from app.api import sync_core
from app.infrastructure.telegram.bot import telegram_bot as _tg_bot, schedule as _tg_schedule  # TGBOT2

router = APIRouter()
security = HTTPBearer(auto_error=False)


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
    revoked_ns = int((user.preferences or {}).get("auth_revoked_ns") or 0)
    if revoked_ns and int(payload.get("issued_ns") or 0) <= revoked_ns:
        raise HTTPException(status_code=401, detail="Session revoked after password reset")
    from app.api import last_seen  # LAST-SEEN
    last_seen.touch(user)
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
        "premium_access": has_premium_access(user),  # AMK-TRIAL
        "trial_until": (lambda t: t.isoformat() if t else None)(trial_until(user)),
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
    return {"schema_version": state.schema_version if state else 1, "state_data": state.state_data if state else {}, "updated_at": state.updated_at.isoformat() if state else None, "version": int(getattr(state, "version", 0) or 0) if state else 0, "server_time": sync_core.server_ms()}


def validate_state_write(user: User, previous: Any, incoming_state: Any) -> dict:
    """Size, normalisation and Premium rules shared by full PUT and per-path PATCH."""
    incoming_state = incoming_state if isinstance(incoming_state, dict) else {}
    state_size = len(orjson.dumps(incoming_state))
    if state_size > get_settings().MAX_USER_STATE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "state_too_large", "max_bytes": get_settings().MAX_USER_STATE_BYTES},
        )
    if incoming_state.get("dailyStudyMinutes") is not None:
        try:
            daily_minutes = round(float(incoming_state["dailyStudyMinutes"]) / 60) * 60
        except (TypeError, ValueError, OverflowError) as exc:
            raise HTTPException(status_code=422, detail="Daily study time must be between 1 and 12 hours") from exc
        incoming_state = dict(incoming_state)
        incoming_state["dailyStudyMinutes"] = max(60, min(720, int(daily_minutes)))
    if not has_premium_access(user):  # AMK-TRIAL
        previous = previous if isinstance(previous, dict) else {}
        incoming = incoming_state
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
    return incoming_state


# ACTIME: server-side guard for study time (see app/api/active_time.py)
def _actime_guard(state, previous, data):
    from app.api import active_time
    if not state or not isinstance(data, dict) or not isinstance(previous, dict):
        return data, None
    if data.get("activityTimers") == previous.get("activityTimers"):
        return data, None
    pv = getattr(state, "path_versions", None) or {}
    out, cu, removed = active_time.clamp_activity_timers(previous, data, pv.get(active_time.PV_KEY), sync_core.server_ms())
    if removed:
        import logging
        logging.getLogger("amookht.actime").warning("clamped activityTimers user=%s removed=%s", getattr(state, "user_id", "?"), removed)
    return out, cu


def _actime_store(state, cu):
    if state is not None and cu is not None:
        from app.api import active_time
        state.path_versions = {**(getattr(state, "path_versions", None) or {}), active_time.PV_KEY: cu}


async def _locked_state(db: AsyncSession, user: User):
    return (await db.execute(select(UserAppState).where(UserAppState.user_id == user.id).with_for_update())).scalar_one_or_none()


def _store_state(db: AsyncSession, user: User, state, schema_version: int, new_data: dict, changed_paths: list[str]):
    version = int(getattr(state, "version", 0) or 0) if state else 0
    if changed_paths:
        version += 1
    if state:
        state.schema_version = schema_version
        state.state_data = new_data
        state.updated_at = datetime.utcnow()
        if changed_paths:
            state.version = version
            state.path_versions = sync_core.bump_path_versions(getattr(state, "path_versions", None), changed_paths, version)
    else:
        state = UserAppState(user_id=user.id, schema_version=schema_version, state_data=new_data, version=version,
                             path_versions=sync_core.bump_path_versions({}, changed_paths, version))
        db.add(state)
    return state, version


@router.put("/state")
async def put_state(payload: StatePayload, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    state = await _locked_state(db, user)
    previous = state.state_data if state and isinstance(state.state_data, dict) else {}
    new_data = validate_state_write(user, previous, payload.state_data)
    new_data, _actime_cu = _actime_guard(state, previous, new_data)  # ACTIME
    payload.state_data = new_data
    changed, removed = sync_core.diff_states(previous, new_data)
    paths = list(changed) + removed
    state, version = _store_state(db, user, state, payload.schema_version, new_data, paths)
    _actime_store(state, _actime_cu)  # ACTIME
    await db.commit()
    await sync_core.publish_change(user.id, version, new_data, paths)
    if "user" in paths:
        _tg_schedule(_tg_bot.plan_chosen(user.id, previous, new_data))
    return {"saved": True, "updated_at": state.updated_at.isoformat() if state.updated_at else None, "version": version}


class StatePatchPayload(BaseModel):
    schema_version: int = Field(default=1, ge=1)
    base_version: int = Field(default=0, ge=0)
    set: dict[str, Any] = Field(default_factory=dict)
    unset: list[str] = Field(default_factory=list, max_length=500)
    client_id: str = Field(default="", max_length=64)


@router.patch("/state")
async def patch_state(payload: StatePatchPayload, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if len(payload.set) > 500:
        raise HTTPException(status_code=422, detail="Too many paths")
    state = await _locked_state(db, user)
    previous = state.state_data if state and isinstance(state.state_data, dict) else {}
    current_version = int(getattr(state, "version", 0) or 0) if state else 0
    merged, applied, rejected, invalid = sync_core.apply_patch(
        previous, getattr(state, "path_versions", None) if state else {}, current_version,
        payload.base_version, payload.set, payload.unset)
    version = current_version
    if applied:
        merged = validate_state_write(user, previous, merged)
        merged, _actime_cu = _actime_guard(state, previous, merged) if "activityTimers" in applied else (merged, None)  # ACTIME
        state, version = _store_state(db, user, state, payload.schema_version, merged, applied)
        _actime_store(state, _actime_cu)  # ACTIME
        await db.commit()
        await sync_core.publish_change(user.id, version, merged, applied, payload.client_id)
        if "user" in applied:
            _tg_schedule(_tg_bot.plan_chosen(user.id, previous, merged))
    else:
        await db.rollback()
        merged = previous
    rejected_values = []
    for path in rejected:
        value = sync_core.get_path(merged, path)
        rejected_values.append({"path": path, "exists": value is not sync_core._MISSING, "value": None if value is sync_core._MISSING else value})
    # Echo normalised values (e.g. dailyStudyMinutes) so the writer stays in step.
    normalized = {p: sync_core.get_path(merged, p) for p in applied
                  if p in payload.set and sync_core.get_path(merged, p) != payload.set[p]}
    return {"saved": bool(applied), "version": version, "applied": applied, "rejected": rejected_values,
            "invalid": invalid, "normalized": normalized, "server_time": sync_core.server_ms()}


@router.post("/password")
async def change_password(payload: PasswordChange, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    if not pwd_context.verify(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = pwd_context.hash(payload.new_password)
    await db.commit()
    return {"changed": True}


@router.delete("")
async def delete_account(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    raise HTTPException(status_code=400, detail={"code": "confirmation_required", "message": "Use /v1/account/delete/request and /v1/account/delete/confirm."})  # ACCOUNT-DELETE
    user.is_active = False
    user.deleted_at = datetime.utcnow()
    user.email = f"deleted-{user.id}@amookht.invalid"
    await db.commit()
    return {"deleted": True}