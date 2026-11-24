import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from app.api.routes import admin, account, auth
from tests.unit.test_auth_recovery import FakeRedis, Result


def make_user(email='person@example.com'):
    return SimpleNamespace(id='12345678-1234-1234-1234-123456789012', email=email, display_name='Person', access_role='normal', is_active=True, is_verified=True, deleted_at=None, created_at=None, last_login_at=None)

class AdminBlockTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.owner = SimpleNamespace(email='tah3in@gmail.com', access_role='owner')

    async def test_block_and_unblock_keep_email(self):
        target = make_user()
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(target)), commit=AsyncMock())
        blocked = await admin.block_user(target.id, self.owner, db)
        self.assertEqual(target.email, 'person@example.com')
        self.assertFalse(target.is_active)
        self.assertTrue(blocked['is_blocked'])
        restored = await admin.unblock_user(target.id, self.owner, db)
        self.assertTrue(target.is_active)
        self.assertFalse(restored['is_blocked'])

    async def test_blocked_email_cannot_register(self):
        target = make_user();target.is_active=False
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(target)))
        with self.assertRaises(HTTPException) as caught:
            await auth.request_registration(auth.RegistrationStartRequest(email='PERSON@example.com',password='ValidPass123'),SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')),db)
        self.assertEqual(caught.exception.status_code,403)
        self.assertEqual(caught.exception.detail['code'],'email_blocked')

    async def test_admin_delete_frees_email(self):
        target = make_user()
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(target)), commit=AsyncMock())
        await admin.delete_user(target.id, self.owner, db)
        self.assertFalse(target.is_active)
        self.assertIsNotNone(target.deleted_at)
        self.assertEqual(target.email,f'deleted-{target.id}@amookht.invalid')

    async def test_self_delete_frees_email(self):
        target = make_user()
        db = SimpleNamespace(commit=AsyncMock())
        await account.delete_account(target,db)
        self.assertEqual(target.email,f'deleted-{target.id}@amookht.invalid')

    async def test_original_email_can_start_registration_after_delete(self):
        db=SimpleNamespace(execute=AsyncMock(return_value=Result(None)))
        redis=FakeRedis();settings=SimpleNamespace(EMAIL_VERIFICATION_TTL_SECONDS=600,SECRET_KEY='test-secret')
        with patch.object(auth,'get_redis',return_value=redis),patch.object(auth,'get_settings',return_value=settings),patch.object(auth,'email_service_ready',return_value=True),patch.object(auth,'enforce_rate_limit',new_callable=AsyncMock),patch.object(auth,'send_verification_email',new_callable=AsyncMock),patch.object(auth,'normalize_and_validate_email',side_effect=lambda raw, **kwargs: raw.strip().lower()),patch.object(auth.pwd_context,'hash',return_value='hash'):
            result=await auth.request_registration(auth.RegistrationStartRequest(email='person@example.com',password='ValidPass123'),SimpleNamespace(client=SimpleNamespace(host='127.0.0.1')),db)
        self.assertEqual(result.email,'person@example.com')
        self.assertIn('signup:'+result.verification_id,redis.data)

if __name__=='__main__':unittest.main()
