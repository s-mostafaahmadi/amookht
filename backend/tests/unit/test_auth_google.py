import time
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException

from app.api.routes import auth
from app.domain.models.models import User, UserProfile

CLIENT_ID = "1234567890-unit.apps.googleusercontent.com"
SETTINGS = SimpleNamespace(
    SECRET_KEY="unit-secret",
    JWT_ALGORITHM="HS256",
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15,
    JWT_REFRESH_TOKEN_EXPIRE_DAYS=30,
    GOOGLE_CLIENT_ID=CLIENT_ID,
)
GOOGLE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def google_token(key=GOOGLE_KEY, **overrides):
    now = int(time.time())
    claims = {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "azp": CLIENT_ID,
        "sub": "109876543210987654321",
        "email": "Learner.Test@Gmail.com",
        "email_verified": True,
        "name": "Learner Test",
        "iat": now,
        "exp": now + 3600,
    }
    claims.update(overrides)
    for name, value in list(claims.items()):
        if value is None:
            del claims[name]
    return jwt.encode(claims, key, algorithm="RS256", headers={"kid": "unit-key"})


class Result:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeDB:
    """Just enough of AsyncSession for the Google routes: lookup by email, add, flush, commit."""

    def __init__(self, *users):
        self.users = {user.email: user for user in users}
        self.added = []
        self.commits = 0

    async def execute(self, statement):
        email = next(iter(statement.compile().params.values()))
        return Result(self.users.get(email))

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = str(uuid4())

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        pass


def existing_user(**overrides):
    values = dict(
        id="existing-user-id",
        email="learner.test@gmail.com",
        display_name="Old Name",
        password_hash="old-password-hash",
        is_active=True,
        is_verified=True,
        deleted_at=None,
        preferences={"theme": "dark"},
        last_login_at=None,
    )
    values.update(overrides)
    return SimpleNamespace(**values)


REQUEST = SimpleNamespace(client=SimpleNamespace(host="203.0.113.7"))


class GoogleTokenVerificationTests(unittest.TestCase):
    def setUp(self):
        self.key_patch = patch.object(auth, "_google_signing_key", return_value=GOOGLE_KEY.public_key())
        self.key_patch.start()

    def tearDown(self):
        self.key_patch.stop()

    def assert_rejected(self, token, status_code, code):
        with self.assertRaises(HTTPException) as caught:
            auth.verify_google_id_token(token, CLIENT_ID)
        self.assertEqual(caught.exception.status_code, status_code)
        self.assertEqual(caught.exception.detail["code"], code)

    def test_valid_token_returns_normalized_email(self):
        claims = auth.verify_google_id_token(google_token(), CLIENT_ID)
        self.assertEqual(claims["email"], "learner.test@gmail.com")
        self.assertEqual(claims["sub"], "109876543210987654321")

    def test_both_google_issuer_spellings_are_accepted(self):
        for issuer in ("accounts.google.com", "https://accounts.google.com"):
            self.assertEqual(auth.verify_google_id_token(google_token(iss=issuer), CLIENT_ID)["iss"], issuer)

    def test_wrong_audience_is_rejected(self):
        self.assert_rejected(google_token(aud="other-app.apps.googleusercontent.com"), 401, "google_token_invalid")

    def test_wrong_issuer_is_rejected(self):
        self.assert_rejected(google_token(iss="https://evil.example.com"), 401, "google_token_invalid")

    def test_expired_token_is_rejected(self):
        past = int(time.time()) - 7200
        self.assert_rejected(google_token(iat=past - 3600, exp=past), 401, "google_token_invalid")

    def test_token_signed_by_another_key_is_rejected(self):
        self.assert_rejected(google_token(key=OTHER_KEY), 401, "google_token_invalid")

    def test_hs256_token_is_rejected(self):
        forged = jwt.encode({"iss": "accounts.google.com", "aud": CLIENT_ID, "sub": "1", "email": "a@gmail.com", "email_verified": True, "iat": int(time.time()), "exp": int(time.time()) + 60}, "secret", algorithm="HS256")
        self.assert_rejected(forged, 401, "google_token_invalid")

    def test_missing_subject_is_rejected(self):
        self.assert_rejected(google_token(sub=None), 401, "google_token_invalid")

    def test_unverified_email_is_rejected(self):
        self.assert_rejected(google_token(email_verified=False), 403, "google_email_unverified")
        self.assert_rejected(google_token(email_verified=None), 403, "google_email_unverified")

    def test_missing_client_id_means_not_configured(self):
        with self.assertRaises(HTTPException) as caught:
            auth.verify_google_id_token(google_token(), "")
        self.assertEqual(caught.exception.detail["code"], "google_not_configured")

    def test_unknown_key_id_is_rejected_not_crashing(self):
        with patch.object(auth, "_google_signing_key", side_effect=jwt.PyJWKClientError("Unable to find a signing key")):
            self.assert_rejected(google_token(), 401, "google_token_invalid")

    def test_google_outage_is_reported_as_unavailable(self):
        with patch.object(auth, "_google_signing_key", side_effect=jwt.PyJWKClientConnectionError("timeout")):
            self.assert_rejected(google_token(), 503, "google_unavailable")

    def test_authoritative_domains(self):
        self.assertTrue(auth.google_is_authoritative({"email": "a@gmail.com"}))
        self.assertTrue(auth.google_is_authoritative({"email": "a@uni.example", "hd": "uni.example"}))
        self.assertFalse(auth.google_is_authoritative({"email": "a@yahoo.com"}))
        self.assertFalse(auth.google_is_authoritative({"email": "a@yahoo.com", "hd": "other.example"}))


class GoogleLoginRouteTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.patches = [
            patch.object(auth, "get_settings", return_value=SETTINGS),
            patch.object(auth, "_google_signing_key", return_value=GOOGLE_KEY.public_key()),
            patch.object(auth, "enforce_rate_limit", new_callable=AsyncMock),
            patch.object(auth, "tg_schedule", side_effect=lambda coro: coro.close()),
            patch.object(auth.pwd_context, "hash", side_effect=lambda value: "random-hash-" + value[:6]),
        ]
        mocks = [p.start() for p in self.patches]
        self.rate_limit, self.notify = mocks[2], mocks[3]

    async def asyncTearDown(self):
        for p in reversed(self.patches):
            p.stop()

    async def login(self, db, token=None):
        payload = auth.GoogleLoginRequest(credential=token or google_token())
        return await auth.google_login(payload, REQUEST, db)

    def session_user(self, response):
        claims = jwt.decode(response.access_token, SETTINGS.SECRET_KEY, algorithms=["HS256"])
        self.assertEqual(claims["type"], "access")
        refresh = jwt.decode(response.refresh_token, SETTINGS.SECRET_KEY, algorithms=["HS256"])
        self.assertEqual(refresh["type"], "refresh")
        return claims["sub"]

    async def test_config_reports_client_id(self):
        config = await auth.google_config()
        self.assertTrue(config.enabled)
        self.assertEqual(config.client_id, CLIENT_ID)
        with patch.object(auth, "get_settings", return_value=SimpleNamespace(GOOGLE_CLIENT_ID="  ")):
            config = await auth.google_config()
        self.assertFalse(config.enabled)
        self.assertEqual(config.client_id, "")

    async def test_not_configured_returns_503(self):
        with patch.object(auth, "get_settings", return_value=SimpleNamespace(GOOGLE_CLIENT_ID="")):
            with self.assertRaises(HTTPException) as caught:
                await self.login(FakeDB())
        self.assertEqual(caught.exception.status_code, 503)
        self.assertEqual(caught.exception.detail["code"], "google_not_configured")

    async def test_new_user_is_created_like_registration(self):
        db = FakeDB()
        response = await self.login(db)
        users = [obj for obj in db.added if isinstance(obj, User)]
        profiles = [obj for obj in db.added if isinstance(obj, UserProfile)]
        self.assertEqual(len(users), 1)
        self.assertEqual(len(profiles), 1)
        user = users[0]
        self.assertEqual(user.email, "learner.test@gmail.com")
        self.assertEqual(user.display_name, "Learner Test")
        self.assertTrue(user.is_verified)
        self.assertEqual(user.preferences["google_sub"], "109876543210987654321")
        self.assertEqual(user.preferences["signup_method"], "google")
        self.assertTrue(user.password_hash.startswith("random-hash-"))
        self.assertEqual(profiles[0].user_id, user.id)
        self.assertEqual(db.commits, 1)
        self.assertTrue(response.created)
        self.assertEqual(response.email, "learner.test@gmail.com")
        self.assertEqual(self.session_user(response), user.id)
        # TGBOT2: the clean sign-up card (no e-mail/ids) is scheduled once from google_login
        self.notify.assert_called_once()
        self.assertEqual(self.notify.call_args.args[0].cr_code.co_name, "signup_notify")
        self.rate_limit.assert_awaited_once()

    async def test_existing_gmail_account_is_linked_not_duplicated(self):
        user = existing_user()
        db = FakeDB(user)
        response = await self.login(db)
        self.assertEqual(db.added, [])
        self.assertFalse(response.created)
        self.assertTrue(response.linked)
        self.assertEqual(self.session_user(response), "existing-user-id")
        self.assertEqual(user.password_hash, "old-password-hash")
        self.assertEqual(user.preferences["google_sub"], "109876543210987654321")
        self.assertEqual(user.preferences["theme"], "dark")
        self.assertNotIn("auth_revoked_ns", user.preferences)
        self.assertIsNotNone(user.last_login_at)
        self.notify.assert_not_called()

    async def test_already_linked_account_signs_in(self):
        user = existing_user(preferences={"google_sub": "109876543210987654321"})
        response = await self.login(FakeDB(user))
        self.assertFalse(response.linked)
        self.assertFalse(response.created)
        self.assertEqual(self.session_user(response), "existing-user-id")

    async def test_account_linked_to_other_google_identity_is_refused(self):
        user = existing_user(preferences={"google_sub": "another-google-subject"})
        with self.assertRaises(HTTPException) as caught:
            await self.login(FakeDB(user))
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(caught.exception.detail["code"], "google_account_mismatch")

    async def test_non_google_mailbox_is_not_linked_automatically(self):
        user = existing_user(email="learner@yahoo.com")
        token = google_token(email="learner@yahoo.com")
        with self.assertRaises(HTTPException) as caught:
            await self.login(FakeDB(user), token)
        self.assertEqual(caught.exception.detail["code"], "google_link_requires_password")
        self.assertNotIn("google_sub", user.preferences)

    async def test_non_google_mailbox_can_still_sign_up(self):
        db = FakeDB()
        response = await self.login(db, google_token(email="learner@yahoo.com"))
        self.assertTrue(response.created)
        self.assertEqual(response.email, "learner@yahoo.com")

    async def test_workspace_account_with_hosted_domain_is_linked(self):
        user = existing_user(email="student@uni.example")
        response = await self.login(FakeDB(user), google_token(email="student@uni.example", hd="uni.example"))
        self.assertTrue(response.linked)

    async def test_unverified_existing_account_drops_unproven_password(self):
        user = existing_user(is_verified=False)
        before = time.time_ns()
        response = await self.login(FakeDB(user))
        self.assertTrue(user.is_verified)
        self.assertNotEqual(user.password_hash, "old-password-hash")
        self.assertGreaterEqual(user.preferences["auth_revoked_ns"], before)
        issued = jwt.decode(response.access_token, SETTINGS.SECRET_KEY, algorithms=["HS256"])["issued_ns"]
        self.assertGreater(issued, user.preferences["auth_revoked_ns"])

    async def test_blocked_account_is_refused(self):
        user = existing_user(is_active=False)
        with self.assertRaises(HTTPException) as caught:
            await self.login(FakeDB(user))
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.detail["code"], "account_disabled")

    async def test_unverified_google_email_creates_nothing(self):
        db = FakeDB()
        with self.assertRaises(HTTPException) as caught:
            await self.login(db, google_token(email_verified=False))
        self.assertEqual(caught.exception.detail["code"], "google_email_unverified")
        self.assertEqual(db.added, [])

    async def test_wrong_audience_creates_nothing(self):
        db = FakeDB()
        with self.assertRaises(HTTPException) as caught:
            await self.login(db, google_token(aud="someone-else.apps.googleusercontent.com"))
        self.assertEqual(caught.exception.detail["code"], "google_token_invalid")
        self.assertEqual(db.added, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
