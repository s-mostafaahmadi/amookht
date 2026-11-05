from __future__ import annotations

import asyncio
import hashlib
import hmac
import html
import json
import logging
import re
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr

import jwt
from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException, Request, status
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.domain.models.models import User, UserProfile
from app.infrastructure.cache.redis import get_redis
from app.infrastructure.database.connection import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)


class RegistrationStartRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)
    display_name: str | None = Field(default=None, max_length=100)


class RegistrationVerifyRequest(BaseModel):
    verification_id: str = Field(min_length=20, max_length=200)
    code: str = Field(max_length=20)


class RegistrationResendRequest(BaseModel):
    verification_id: str = Field(min_length=20, max_length=200)


class RegistrationStartedResponse(BaseModel):
    verification_id: str
    email: str
    expires_in: int
    message: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    user_id: str
    email: str
    display_name: str | None


def auth_error(status_code: int, code: str, message: str, **details) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"code": code, "message": message, **details},
    )


def normalize_and_validate_email(raw_email: str, *, check_deliverability: bool) -> str:
    try:
        result = validate_email(
            raw_email.strip(),
            check_deliverability=check_deliverability,
            allow_smtputf8=False,
        )
    except EmailNotValidError as exc:
        message = str(exc)
        code = "email_not_deliverable" if check_deliverability else "invalid_email"
        raise auth_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            code,
            "Enter a valid, deliverable email address.",
            reason=message,
        ) from exc
    return result.normalized.lower()


def validate_password_strength(password: str) -> None:
    missing: list[str] = []
    if len(password) < 8:
        missing.append("at least 8 characters")
    if not re.search(r"[a-z]", password):
        missing.append("a lowercase letter")
    if not re.search(r"[A-Z]", password):
        missing.append("an uppercase letter")
    if not re.search(r"\d", password):
        missing.append("a number")
    if missing:
        raise auth_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "weak_password",
            "Password must contain at least 8 characters, one lowercase letter, one uppercase letter and one number.",
            missing=missing,
        )


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def token_response(user_id: str) -> TokenResponse:
    settings = get_settings()
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def verification_code_hash(verification_id: str, code: str) -> str:
    secret = get_settings().SECRET_KEY.encode("utf-8")
    value = f"{verification_id}:{code}".encode("utf-8")
    return hmac.new(secret, value, hashlib.sha256).hexdigest()


LOGIN_MAX_ATTEMPTS = 4
LOGIN_FAILURE_WINDOW_SECONDS = 15 * 60
LOGIN_LOCK_STAGE_TTL_SECONDS = 30 * 24 * 60 * 60
LOGIN_LOCK_DURATIONS_SECONDS = (5 * 60, 15 * 60, 60 * 60, 6 * 60 * 60, 24 * 60 * 60)


def login_identity(email: str) -> str:
    # Do not expose email addresses in Redis keys or operational tooling.
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()


def login_lock_duration(lock_level: int) -> int:
    index = min(max(1, lock_level), len(LOGIN_LOCK_DURATIONS_SECONDS)) - 1
    return LOGIN_LOCK_DURATIONS_SECONDS[index]


async def record_login_failure(redis, identity: str) -> dict:
    failures_key = f"login-failures:{identity}"
    attempts = await redis.incr(failures_key)
    if attempts == 1:
        await redis.expire(failures_key, LOGIN_FAILURE_WINDOW_SECONDS)
    if attempts < LOGIN_MAX_ATTEMPTS:
        return {
            "locked": False,
            "attempts_remaining": LOGIN_MAX_ATTEMPTS - attempts,
        }

    stage_key = f"login-lock-stage:{identity}"
    lock_level = await redis.incr(stage_key)
    await redis.expire(stage_key, LOGIN_LOCK_STAGE_TTL_SECONDS)
    duration = login_lock_duration(lock_level)
    await redis.set(f"login-lock:{identity}", "1", ex=duration)
    await redis.delete(failures_key)
    return {
        "locked": True,
        "retry_after": duration,
        "lock_level": lock_level,
    }


def email_service_ready() -> bool:
    settings = get_settings()
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


async def send_verification_email(email: str, display_name: str, code: str) -> None:
    settings = get_settings()
    if not email_service_ready():
        raise auth_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "email_service_unavailable",
            "Email verification is temporarily unavailable. The mail service is not configured.",
        )

    message = EmailMessage()
    message["Subject"] = f"{code} - Amookht email verification"
    message["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
    message["To"] = email
    safe_name = display_name.strip() or "Learner"
    safe_html_name = html.escape(safe_name)
    message.set_content(
        f"Hello {safe_name},\n\n"
        f"Your Amookht verification code is: {code}\n\n"
        f"The code expires in {settings.EMAIL_VERIFICATION_TTL_SECONDS // 60} minutes. "
        "If you did not request this account, you can ignore this email.\n"
    )
    message.add_alternative(
        f"""<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f5fb;padding:28px">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:20px;padding:30px;color:#202235">
        <h1 style="margin:0 0 12px;color:#6657dc">Amookht</h1>
        <p>Hello {safe_html_name},</p><p>Use this five-digit code to finish creating your account:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:12px;padding:20px;text-align:center;background:#f1efff;border-radius:14px">{code}</div>
        <p style="color:#6b7280">This code expires in {settings.EMAIL_VERIFICATION_TTL_SECONDS // 60} minutes.</p>
        </div></body></html>""",
        subtype="html",
    )

    def _send() -> None:
        smtp_class = smtplib.SMTP_SSL if settings.SMTP_USE_SSL else smtplib.SMTP
        kwargs = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT, "timeout": 20}
        if settings.SMTP_USE_SSL:
            kwargs["context"] = ssl.create_default_context()
        with smtp_class(**kwargs) as client:
            if not settings.SMTP_USE_SSL:
                client.ehlo()
                if settings.SMTP_USE_TLS:
                    client.starttls(context=ssl.create_default_context())
                    client.ehlo()
            if settings.SMTP_USERNAME:
                client.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            client.send_message(message)

    try:
        await asyncio.to_thread(_send)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not send signup verification email to %s", email)
        raise auth_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "email_delivery_failed",
            "The verification email could not be sent. Check the address and try again.",
        ) from exc


async def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    redis = get_redis()
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, window_seconds)
    if count > limit:
        ttl = max(1, await redis.ttl(key))
        raise auth_error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "too_many_requests",
            "Too many verification requests. Please wait before trying again.",
            retry_after=ttl,
        )


@router.post(
    "/register/request",
    response_model=RegistrationStartedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_registration(
    payload: RegistrationStartRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    validate_password_strength(payload.password)
    email = await asyncio.to_thread(
        normalize_and_validate_email,
        payload.email,
        check_deliverability=True,
    )
    display_name = (payload.display_name or "").strip()

    if not email_service_ready():
        raise auth_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "email_service_unavailable",
            "Email verification is temporarily unavailable. The mail service is not configured.",
        )

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise auth_error(status.HTTP_409_CONFLICT, "email_exists", "This email is already registered.")

    redis = get_redis()
    client_ip = request.client.host if request.client else "unknown"
    await enforce_rate_limit(f"signup-rate:email:{email}", 3, 900)
    await enforce_rate_limit(f"signup-rate:ip:{client_ip}", 10, 3600)

    settings = get_settings()
    verification_id = secrets.token_urlsafe(32)
    code = f"{secrets.randbelow(90000) + 10000:05d}"
    pending = {
        "email": email,
        "display_name": display_name,
        "password_hash": pwd_context.hash(payload.password),
        "code_hash": verification_code_hash(verification_id, code),
        "attempts": 0,
    }
    key = f"signup:{verification_id}"
    await redis.set(key, json.dumps(pending), ex=settings.EMAIL_VERIFICATION_TTL_SECONDS)
    try:
        await send_verification_email(email, display_name, code)
    except Exception:
        await redis.delete(key)
        raise

    return RegistrationStartedResponse(
        verification_id=verification_id,
        email=email,
        expires_in=settings.EMAIL_VERIFICATION_TTL_SECONDS,
        message="Verification code sent.",
    )


@router.post("/register/resend", response_model=RegistrationStartedResponse)
async def resend_registration_code(payload: RegistrationResendRequest):
    if not email_service_ready():
        raise auth_error(status.HTTP_503_SERVICE_UNAVAILABLE, "email_service_unavailable", "Email verification is temporarily unavailable.")
    redis = get_redis()
    key = f"signup:{payload.verification_id}"
    raw = await redis.get(key)
    if not raw:
        raise auth_error(status.HTTP_410_GONE, "verification_expired", "The verification request has expired. Start registration again.")
    pending = json.loads(raw)
    await enforce_rate_limit(f"signup-resend:{payload.verification_id}", 3, 900)
    settings = get_settings()
    code = f"{secrets.randbelow(90000) + 10000:05d}"
    pending["code_hash"] = verification_code_hash(payload.verification_id, code)
    pending["attempts"] = 0
    await redis.set(key, json.dumps(pending), ex=settings.EMAIL_VERIFICATION_TTL_SECONDS)
    await send_verification_email(pending["email"], pending["display_name"], code)
    return RegistrationStartedResponse(
        verification_id=payload.verification_id,
        email=pending["email"],
        expires_in=settings.EMAIL_VERIFICATION_TTL_SECONDS,
        message="A new verification code was sent.",
    )


@router.post("/register/verify", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def verify_registration(payload: RegistrationVerifyRequest, db: AsyncSession = Depends(get_db)):
    if not re.fullmatch(r"\d{5}", payload.code):
        raise auth_error(status.HTTP_422_UNPROCESSABLE_ENTITY, "invalid_verification_code", "Enter the five-digit verification code.")
    redis = get_redis()
    key = f"signup:{payload.verification_id}"
    raw = await redis.get(key)
    if not raw:
        raise auth_error(status.HTTP_410_GONE, "verification_expired", "The verification code has expired. Start registration again.")
    pending = json.loads(raw)
    expected = pending.get("code_hash", "")
    supplied = verification_code_hash(payload.verification_id, payload.code)
    if not hmac.compare_digest(expected, supplied):
        pending["attempts"] = int(pending.get("attempts", 0)) + 1
        ttl = max(1, await redis.ttl(key))
        if pending["attempts"] >= 5:
            await redis.delete(key)
            raise auth_error(status.HTTP_429_TOO_MANY_REQUESTS, "verification_locked", "Too many incorrect codes. Start registration again.")
        await redis.set(key, json.dumps(pending), ex=ttl)
        raise auth_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "invalid_verification_code",
            "The five-digit verification code is incorrect.",
            attempts_remaining=5 - pending["attempts"],
        )

    lock_key = f"signup-lock:{payload.verification_id}"
    if not await redis.set(lock_key, "1", ex=30, nx=True):
        raise auth_error(status.HTTP_409_CONFLICT, "verification_in_progress", "This verification is already being processed.")
    try:
        existing = await db.execute(select(User).where(User.email == pending["email"]))
        if existing.scalar_one_or_none():
            await redis.delete(key)
            raise auth_error(status.HTTP_409_CONFLICT, "email_exists", "This email is already registered.")
        user = User(
            email=pending["email"],
            password_hash=pending["password_hash"],
            display_name=pending.get("display_name") or None,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        db.add(UserProfile(user_id=user.id))
        await db.commit()
        await redis.delete(key)
        return token_response(user.id)
    except IntegrityError as exc:
        await db.rollback()
        raise auth_error(status.HTTP_409_CONFLICT, "email_exists", "This email is already registered.") from exc
    finally:
        await redis.delete(lock_key)


@router.post("/register", status_code=status.HTTP_410_GONE)
async def legacy_register():
    raise auth_error(
        status.HTTP_410_GONE,
        "verification_required",
        "Email verification is required. Use the registration verification flow.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        email = normalize_and_validate_email(payload.email, check_deliverability=False)
    except HTTPException:
        # Use the same public error as a wrong password to avoid account discovery.
        raise auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_credentials",
            "Invalid email or password.",
            attempts_remaining=3,
        )

    redis = get_redis()
    identity = login_identity(email)
    lock_ttl = await redis.ttl(f"login-lock:{identity}")
    if lock_ttl > 0:
        stage_raw = await redis.get(f"login-lock-stage:{identity}")
        raise auth_error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "login_locked",
            "Too many incorrect passwords. Login is temporarily locked.",
            retry_after=lock_ttl,
            lock_level=max(1, int(stage_raw or 1)),
        )

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    password_matches = bool(user and pwd_context.verify(payload.password, user.password_hash))
    if not password_matches:
        outcome = await record_login_failure(redis, identity)
        if outcome["locked"]:
            raise auth_error(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "login_locked",
                "Four incorrect passwords triggered a temporary login lock.",
                retry_after=outcome["retry_after"],
                lock_level=outcome["lock_level"],
            )
        raise auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_credentials",
            "Invalid email or password.",
            attempts_remaining=outcome["attempts_remaining"],
        )
    if not user.is_verified:
        raise auth_error(status.HTTP_403_FORBIDDEN, "email_not_verified", "Verify your email before logging in.")
    if not user.is_active:
        raise auth_error(status.HTTP_403_FORBIDDEN, "account_disabled", "This account is disabled.")

    await redis.delete(f"login-failures:{identity}")
    user.last_login_at = datetime.utcnow()
    await db.commit()
    return token_response(user.id)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    settings = get_settings()
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise auth_error(status.HTTP_401_UNAUTHORIZED, "invalid_token", "Invalid token type.")
        user_id = payload["sub"]
    except jwt.ExpiredSignatureError as exc:
        raise auth_error(status.HTTP_401_UNAUTHORIZED, "token_expired", "Refresh token expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise auth_error(status.HTTP_401_UNAUTHORIZED, "invalid_token", "Invalid refresh token.") from exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active or not user.is_verified:
        raise auth_error(status.HTTP_401_UNAUTHORIZED, "user_unavailable", "User not found or not verified.")
    return token_response(user.id)