import pytest
from fastapi import HTTPException

from app.api.routes.auth import (
    login_lock_duration,
    normalize_and_validate_email,
    validate_password_strength,
    verification_code_hash,
)


def test_strong_password_is_accepted():
    validate_password_strength("Amookht2026")


@pytest.mark.parametrize("password", ["short1A", "NOLOWERCASE1", "nouppercase1", "NoNumberHere"])
def test_weak_password_has_precise_error(password):
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength(password)
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail["code"] == "weak_password"
    assert exc_info.value.detail["missing"]


def test_email_is_normalized_without_deliverability_lookup():
    assert normalize_and_validate_email(" User@Example.COM ", check_deliverability=False) == "user@example.com"


def test_invalid_email_has_machine_readable_error():
    with pytest.raises(HTTPException) as exc_info:
        normalize_and_validate_email("not-an-email", check_deliverability=False)
    assert exc_info.value.detail["code"] == "invalid_email"


def test_verification_hash_is_code_and_request_specific():
    first = verification_code_hash("request-one", "12345")
    assert first == verification_code_hash("request-one", "12345")
    assert first != verification_code_hash("request-one", "54321")
    assert first != verification_code_hash("request-two", "12345")

def test_login_lock_duration_increases_and_is_capped():
    assert [login_lock_duration(level) for level in range(1, 7)] == [300, 900, 3600, 21600, 86400, 86400]
