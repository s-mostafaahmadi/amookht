import unittest
from datetime import datetime, timedelta, timezone
import jwt
from fastapi.security import HTTPAuthorizationCredentials
from app.api.middleware import auth as auth_middleware
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.api.routes import auth

class Result:
    def __init__(self, value): self.value = value
    def scalar_one_or_none(self): return self.value

class FakeRedis:
    def __init__(self): self.data = {}
    async def set(self, key, value, ex=None, nx=False):
        if nx and key in self.data: return False
        self.data[key] = value
        return True
    async def get(self, key): return self.data.get(key)
    async def ttl(self, key): return 600
    async def delete(self, *keys):
        for key in keys: self.data.pop(key, None)

class AuthRecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def test_duplicate_email_is_rejected_before_password_check(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(SimpleNamespace(id='existing',is_active=True,deleted_at=None))))
        payload = auth.RegistrationStartRequest(email=' User@Example.com ', password='weak')
        with self.assertRaises(HTTPException) as caught:
            await auth.request_registration(payload, SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')), db)
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(caught.exception.detail['code'], 'email_exists')

    async def test_reset_code_changes_password_once(self):
        user = SimpleNamespace(id='12345678-1234-1234-1234-123456789012', email='user@example.com', display_name='User', is_active=True, is_verified=True, password_hash='old', preferences={}, deleted_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(user)), commit=AsyncMock())
        redis = FakeRedis()
        settings = SimpleNamespace(SECRET_KEY='unit-secret', EMAIL_VERIFICATION_TTL_SECONDS=600)
        with patch.object(auth, 'get_redis', return_value=redis), patch.object(auth, 'get_settings', return_value=settings), patch.object(auth, 'email_service_ready', return_value=True), patch.object(auth, 'enforce_rate_limit', new_callable=AsyncMock), patch.object(auth, 'send_verification_email', new_callable=AsyncMock) as send, patch.object(auth.secrets, 'randbelow', return_value=0), patch.object(auth.pwd_context, 'hash', return_value='new-hash'):
            result = await auth.request_password_reset(auth.PasswordResetRequest(email=' USER@example.com '), SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')), db)
            self.assertEqual(result.email, 'user@example.com')
            self.assertEqual(send.await_args.kwargs['purpose'], 'reset')
            with self.assertRaises(HTTPException) as wrong:
                await auth.confirm_password_reset(auth.PasswordResetConfirmRequest(verification_id=result.verification_id, code='99999', new_password='NewPassword123'), db)
            self.assertEqual(wrong.exception.detail['code'], 'invalid_verification_code')
            self.assertEqual(user.password_hash, 'old')
            await auth.confirm_password_reset(auth.PasswordResetConfirmRequest(verification_id=result.verification_id, code='10000', new_password='NewPassword123'), db)
            self.assertEqual(user.password_hash, 'new-hash')
            self.assertGreater(user.preferences['auth_revoked_ns'], 0)
            db.commit.assert_awaited_once()
            with self.assertRaises(HTTPException) as reused:
                await auth.confirm_password_reset(auth.PasswordResetConfirmRequest(verification_id=result.verification_id, code='10000', new_password='NewPassword123'), db)
            self.assertEqual(reused.exception.detail['code'], 'verification_expired')

    async def test_existing_session_is_revoked_after_password_reset(self):
        changed = 1_000_000_000_000
        user = SimpleNamespace(id='user-id', is_active=True, deleted_at=None, preferences={'auth_revoked_ns': changed})
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(user)))
        settings = SimpleNamespace(SECRET_KEY='unit-secret', JWT_ALGORITHM='HS256')
        for issued, allowed in ((changed-1, False), (changed+1, True)):
            token = jwt.encode({'sub':'user-id','type':'access','issued_ns':issued,'exp':datetime.now(timezone.utc)+timedelta(hours=1)},settings.SECRET_KEY,algorithm='HS256')
            credentials = HTTPAuthorizationCredentials(scheme='Bearer', credentials=token)
            with patch.object(auth_middleware, 'get_settings', return_value=settings):
                if allowed:
                    self.assertIs(await auth_middleware.get_current_user(credentials, db), user)
                else:
                    with self.assertRaises(HTTPException) as caught:
                        await auth_middleware.get_current_user(credentials, db)
                    self.assertEqual(caught.exception.status_code, 401)

    async def test_unknown_email_is_rejected_without_sending_code(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(None)))
        redis = FakeRedis()
        with patch.object(auth, 'get_redis', return_value=redis), patch.object(auth, 'enforce_rate_limit', new_callable=AsyncMock), patch.object(auth, 'send_verification_email', new_callable=AsyncMock) as send:
            with self.assertRaises(HTTPException) as caught:
                await auth.request_password_reset(auth.PasswordResetRequest(email='missing@example.com'), SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')), db)
            self.assertEqual(caught.exception.status_code, 404)
            self.assertEqual(caught.exception.detail['code'], 'email_not_registered')
            send.assert_not_awaited()
            self.assertFalse(any(key.startswith('password-reset:') for key in redis.data))

    async def test_disabled_email_gets_no_reset_code(self):
        user = SimpleNamespace(id='blocked-id', email='blocked@example.com', is_active=False, is_verified=True, deleted_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(user)))
        with patch.object(auth, 'get_redis', return_value=FakeRedis()), patch.object(auth, 'enforce_rate_limit', new_callable=AsyncMock), patch.object(auth, 'send_verification_email', new_callable=AsyncMock) as send:
            with self.assertRaises(HTTPException) as caught:
                await auth.request_password_reset(auth.PasswordResetRequest(email=user.email), SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')), db)
            self.assertEqual(caught.exception.detail['code'], 'account_disabled')
            send.assert_not_awaited()

if __name__ == '__main__': unittest.main()
