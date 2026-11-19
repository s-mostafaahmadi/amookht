from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.domain.models.models import User

ACCESS_ROLES = {"normal", "premium", "admin", "owner"}
OWNER_EMAIL = "tah3in@gmail.com"


def is_owner(user: User) -> bool:
    return (user.email or "").strip().lower() == OWNER_EMAIL


def user_access_role(user: User) -> str:
    if is_owner(user):
        return "owner"
    role = (getattr(user, "access_role", None) or "").strip().lower()
    return role if role in ACCESS_ROLES - {"owner"} else "normal"


PAID_ROLES = {"premium", "admin", "owner"}
# AMK-TRIAL: accounts created on/after TRIAL_START get every premium feature for TRIAL_DAYS days,
# except routes that call require_premium(user, allow_trial=False) (library upload).
TRIAL_DAYS = 3
TRIAL_START = datetime.fromisoformat("2026-11-14T21:00:00").replace(tzinfo=timezone.utc)


def trial_until(user: User) -> datetime | None:
    if user_access_role(user) != "normal":
        return None
    created = getattr(user, "created_at", None)
    if not isinstance(created, datetime):
        return None
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if created < TRIAL_START:
        return None
    return created + timedelta(days=TRIAL_DAYS)


def trial_active(user: User) -> bool:
    end = trial_until(user)
    return bool(end and end > datetime.now(timezone.utc))


def has_premium_access(user: User, allow_trial: bool = True) -> bool:
    return user_access_role(user) in PAID_ROLES or (allow_trial and trial_active(user))


def require_premium(user: User, allow_trial: bool = True) -> None:
    if not has_premium_access(user, allow_trial):
        raise HTTPException(status_code=403, detail="This feature requires a Premium account")


def require_admin(user: User) -> None:
    if user_access_role(user) not in {"admin", "owner"}:
        raise HTTPException(status_code=403, detail="Administrator access is required")


def require_owner(user: User) -> None:
    if not is_owner(user):
        raise HTTPException(status_code=403, detail="Only the account owner can modify or delete users")