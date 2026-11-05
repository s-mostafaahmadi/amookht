from pathlib import Path
from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # Application
    APP_NAME: str = Field(default="Amookht", validation_alias=AliasChoices("APP_NAME", "AMOOKHT_APP_NAME"))
    APP_ENV: str = Field(default="development", validation_alias=AliasChoices("APP_ENV", "AMOOKHT_APP_ENV"))
    DEBUG: bool = Field(default=True, validation_alias=AliasChoices("DEBUG", "AMOOKHT_DEBUG"))
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production", validation_alias=AliasChoices("SECRET_KEY", "AMOOKHT_SECRET_KEY"))

    @field_validator("APP_NAME", mode="before")
    @classmethod
    def normalize_app_name(cls, value):
        if isinstance(value, str) and value.strip() in {"Amokht", ""}:
            return "Amookht"
        return value
    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "prod", "production"}:
            return False
        return value

    # Database
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/amookht", validation_alias=AliasChoices("DATABASE_URL", "AMOOKHT_DATABASE_URL"))
    DATABASE_ECHO: bool = Field(default=False, validation_alias=AliasChoices("DATABASE_ECHO"))
    DATABASE_POOL_SIZE: int = Field(default=10, ge=1, le=100, validation_alias=AliasChoices("DATABASE_POOL_SIZE"))
    DATABASE_MAX_OVERFLOW: int = Field(default=10, ge=0, le=100, validation_alias=AliasChoices("DATABASE_MAX_OVERFLOW"))
    DATABASE_POOL_TIMEOUT_SECONDS: int = Field(default=10, ge=1, le=120, validation_alias=AliasChoices("DATABASE_POOL_TIMEOUT_SECONDS"))
    DATABASE_POOL_RECYCLE_SECONDS: int = Field(default=1800, ge=60, le=86400, validation_alias=AliasChoices("DATABASE_POOL_RECYCLE_SECONDS"))
    MAX_USER_STATE_BYTES: int = Field(default=2_000_000, ge=100_000, le=20_000_000, validation_alias=AliasChoices("MAX_USER_STATE_BYTES"))
    ADMIN_USERS_PAGE_SIZE_MAX: int = Field(default=100, ge=10, le=500, validation_alias=AliasChoices("ADMIN_USERS_PAGE_SIZE_MAX"))

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", validation_alias=AliasChoices("REDIS_URL", "AMOOKHT_REDIS_URL"))

    # Authentication
    JWT_ALGORITHM: str = Field(default="HS256", validation_alias=AliasChoices("JWT_ALGORITHM"))
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, validation_alias=AliasChoices("JWT_ACCESS_TOKEN_EXPIRE_MINUTES"))
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30, validation_alias=AliasChoices("JWT_REFRESH_TOKEN_EXPIRE_DAYS"))

    # Transactional email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Amookht"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    EMAIL_VERIFICATION_TTL_SECONDS: int = 600

    # Optional evaluation providers
    OPENAI_API_KEY: str = Field(default="", validation_alias=AliasChoices("OPENAI_API_KEY", "AMOOKHT_OPENAI_API_KEY"))
    OPENAI_MODEL: str = Field(default="gpt-4o", validation_alias=AliasChoices("OPENAI_MODEL"))
    ANTHROPIC_API_KEY: str = Field(default="", validation_alias=AliasChoices("ANTHROPIC_API_KEY", "AMOOKHT_ANTHROPIC_API_KEY"))
    ANTHROPIC_MODEL: str = Field(default="claude-sonnet-4-20250514", validation_alias=AliasChoices("ANTHROPIC_MODEL"))
    DEEPSEEK_API_KEY: str = Field(default="", validation_alias=AliasChoices("DEEPSEEK_API_KEY", "AMOOKHT_DEEPSEEK_API_KEY"))
    DEEPSEEK_MODEL: str = Field(default="deepseek-chat", validation_alias=AliasChoices("DEEPSEEK_MODEL"))
    # Local LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:7b"

    # Whisper (STT)
    WHISPER_MODEL: str = "large-v3"
    WHISPER_DEVICE: str = "cpu"

    # Storage
    FILE_STORAGE_PATH: str = Field(default="./data/files", validation_alias=AliasChoices("FILE_STORAGE_PATH"))
    MAX_UPLOAD_SIZE_MB: int = Field(default=50, validation_alias=AliasChoices("MAX_UPLOAD_SIZE_MB"))

    # Logging
    LOG_LEVEL: str = Field(default="INFO", validation_alias=AliasChoices("LOG_LEVEL"))

    model_config = SettingsConfigDict(
        env_file=(".env", _BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
