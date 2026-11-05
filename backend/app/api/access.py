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


def require_premium(user: User) -> None:
    if user_access_role(user) not in {"premium", "admin", "owner"}:
        raise HTTPException(status_code=403, detail="This feature requires a Premium account")


def require_admin(user: User) -> None:
    if user_access_role(user) not in {"admin", "owner"}:
        raise HTTPException(status_code=403, detail="Administrator access is required")


def require_owner(user: User) -> None:
    if not is_owner(user):
        raise HTTPException(status_code=403, detail="Only the account owner can modify or delete users")