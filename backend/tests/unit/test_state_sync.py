import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException

from app.api import sync_core
from app.api.routes import account


class Result:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


def user(role='owner'):
    return SimpleNamespace(id='u1', access_role=role, email='x@example.com')


class PathModelTests(unittest.TestCase):
    def test_flatten_descends_into_timer(self):
        flat = sync_core.flatten_state({'plan': {'a': 1}, 'appSettings': {'x': 1, 'freeStudy': {'mode': 'focus', 'endAt': 5}}})
        self.assertEqual(flat, {'plan': {'a': 1}, 'appSettings.x': 1, 'appSettings.freeStudy.mode': 'focus', 'appSettings.freeStudy.endAt': 5})

    def test_valid_path(self):
        self.assertTrue(sync_core.valid_path('appSettings.freeStudy.endAt'))
        self.assertTrue(sync_core.valid_path('plan'))
        self.assertFalse(sync_core.valid_path('plan.days'))
        self.assertFalse(sync_core.valid_path('appSettings.freeStudy.a.b'))
        self.assertFalse(sync_core.valid_path(''))

    def test_fresh_write_applies(self):
        state = {'appSettings': {'freeStudy': {'running': False}}}
        new, applied, rejected, invalid = sync_core.apply_patch(state, {}, 3, 3, {'appSettings.freeStudy.running': True}, [])
        self.assertEqual(applied, ['appSettings.freeStudy.running'])
        self.assertTrue(new['appSettings']['freeStudy']['running'])
        self.assertFalse(state['appSettings']['freeStudy']['running'])  # input untouched

    def test_stale_write_rejected_only_for_changed_paths(self):
        pv = {'appSettings.freeStudy.mode': 5, 'appSettings.freeStudy.note': 2}
        new, applied, rejected, _ = sync_core.apply_patch(
            {}, pv, 5, 4, {'appSettings.freeStudy.mode': 'short', 'appSettings.freeStudy.note': 'hi'}, [])
        self.assertEqual(rejected, ['appSettings.freeStudy.mode'])
        self.assertEqual(applied, ['appSettings.freeStudy.note'])

    def test_parent_change_conflicts_with_child(self):
        pv = {'appSettings.freeStudy': 7}
        _, applied, rejected, _ = sync_core.apply_patch({}, pv, 7, 6, {'appSettings.freeStudy.endAt': 1}, [])
        self.assertEqual(rejected, ['appSettings.freeStudy.endAt'])

    def test_unset_and_bump(self):
        new, applied, _, _ = sync_core.apply_patch({'a': 1, 'b': 2}, {}, 0, 0, {}, ['a'])
        self.assertEqual(new, {'b': 2})
        pv = sync_core.bump_path_versions({'appSettings.freeStudy.mode': 1, 'plan': 1}, ['appSettings.freeStudy'], 2)
        self.assertEqual(pv, {'plan': 1, 'appSettings.freeStudy': 2})

    def test_diff_states(self):
        changed, removed = sync_core.diff_states({'a': 1, 'appSettings': {'freeStudy': {'m': 1, 'n': 2}}},
                                                 {'a': 1, 'appSettings': {'freeStudy': {'m': 3}}})
        self.assertEqual(changed, {'appSettings.freeStudy.m': 3})
        self.assertEqual(removed, ['appSettings.freeStudy.n'])

    def test_large_patch_becomes_resync(self):
        msg = sync_core.patch_message(4, {'plan': 'x' * 300000}, ['plan'])
        self.assertEqual(msg['type'], 'resync')


class RouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_patch_bumps_version_and_broadcasts(self):
        row = SimpleNamespace(state_data={'appSettings': {'freeStudy': {'running': False}}}, path_versions={}, version=2,
                              schema_version=1, updated_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(row)), commit=AsyncMock(), rollback=AsyncMock(), add=lambda x: None)
        payload = account.StatePatchPayload(base_version=2, set={'appSettings.freeStudy.running': True}, client_id='c1')
        with patch.object(sync_core, 'publish_change', AsyncMock()) as pub:
            out = await account.patch_state(payload, user(), db)
        self.assertEqual(out['version'], 3)
        self.assertEqual(row.version, 3)
        self.assertEqual(row.path_versions, {'appSettings.freeStudy.running': 3})
        self.assertTrue(row.state_data['appSettings']['freeStudy']['running'])
        pub.assert_awaited_once()
        self.assertEqual(pub.await_args.args[3], ['appSettings.freeStudy.running'])

    async def test_patch_conflict_returns_server_value(self):
        row = SimpleNamespace(state_data={'appSettings': {'freeStudy': {'mode': 'focus'}}},
                              path_versions={'appSettings.freeStudy.mode': 9}, version=9, schema_version=1, updated_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(row)), commit=AsyncMock(), rollback=AsyncMock(), add=lambda x: None)
        payload = account.StatePatchPayload(base_version=8, set={'appSettings.freeStudy.mode': 'short'})
        with patch.object(sync_core, 'publish_change', AsyncMock()) as pub:
            out = await account.patch_state(payload, user(), db)
        self.assertEqual(out['version'], 9)
        self.assertEqual(out['rejected'], [{'path': 'appSettings.freeStudy.mode', 'exists': True, 'value': 'focus'}])
        pub.assert_not_awaited()
        db.commit.assert_not_awaited()

    async def test_patch_keeps_premium_rules(self):
        row = SimpleNamespace(state_data={}, path_versions={}, version=0, schema_version=1, updated_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(row)), commit=AsyncMock(), rollback=AsyncMock(), add=lambda x: None)
        payload = account.StatePatchPayload(set={'contentBankPersonal': {'topics': {'x': 1}}})
        with self.assertRaises(HTTPException) as caught:
            await account.patch_state(payload, user('normal'), db)
        self.assertEqual(caught.exception.status_code, 403)

    async def test_put_broadcasts_changed_paths(self):
        row = SimpleNamespace(state_data={'a': 1, 'b': 1}, path_versions={}, version=1, schema_version=1, updated_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(row)), commit=AsyncMock(), add=lambda x: None)
        with patch.object(sync_core, 'publish_change', AsyncMock()) as pub:
            out = await account.put_state(account.StatePayload(state_data={'a': 1, 'b': 2}), user(), db)
        self.assertEqual(out['version'], 2)
        self.assertEqual(pub.await_args.args[3], ['b'])

    async def test_daily_minutes_normalized_on_patch(self):
        row = SimpleNamespace(state_data={}, path_versions={}, version=0, schema_version=1, updated_at=None)
        db = SimpleNamespace(execute=AsyncMock(return_value=Result(row)), commit=AsyncMock(), rollback=AsyncMock(), add=lambda x: None)
        with patch.object(sync_core, 'publish_change', AsyncMock()):
            out = await account.patch_state(account.StatePatchPayload(set={'dailyStudyMinutes': 100}), user(), db)
        self.assertEqual(out['normalized'], {'dailyStudyMinutes': 120})


class HubTests(unittest.IsolatedAsyncioTestCase):
    async def test_local_delivery(self):
        hub = sync_core.SyncHub()
        hub.ensure_listener = lambda: None
        q = hub.register('u1')
        hub._deliver('u1', '{"x":1}')
        self.assertEqual(q.get_nowait(), '{"x":1}')
        hub.unregister('u1', q)
        self.assertNotIn('u1', hub.local)


if __name__ == '__main__':
    unittest.main()
