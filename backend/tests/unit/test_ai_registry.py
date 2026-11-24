"""AI-ADMIN (2026-11-14): provider registry, SSRF guard, routing decisions and the generic engine."""
import json
import pathlib
import tempfile
import time
import unittest
from unittest.mock import patch

import httpx

from app.api import ai_guard, ai_registry as reg
from app.api.routes import ai_admin, study_tutor as tutor

REAL_CLIENT = httpx.AsyncClient


def no_redis():
    raise ConnectionError("redis disabled in tests")


def client_with(handler, calls):
    async def wrapped(request):
        calls.append(request)
        return await handler(request)

    def factory(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(wrapped)
        return REAL_CLIENT(*args, **kwargs)
    return factory


def ok(content):
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}], "usage": {"total_tokens": 12}})


class Base(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.file = pathlib.Path(self.tmp.name) / "ai_providers.json"
        ai_guard._local.clear()
        ai_guard._local_fails.clear()
        reg._bad_keys.clear()
        reg._resolved.clear()
        for host in ("api.groq.com", "integrate.api.nvidia.com", "127.0.0.1"):
            for flag in (False, True):
                reg._resolved[(host, flag)] = (time.time(), "")
        self.patches = [patch.object(reg, "DATA_FILE", self.file), patch.object(ai_guard, "_client", no_redis),
                        patch.object(reg, "legacy_keys", lambda pid: {"groq": ["gsk_legacy_one_123456", "gsk_legacy_two_654321"]}.get(pid, []))]
        for p in self.patches:
            p.start()
        reg._cache.update(data=None, mtime=None, checked=0.0)

    def tearDown(self):
        for p in self.patches:
            p.stop()
        reg._cache.update(data=None, mtime=None, checked=0.0)
        self.tmp.cleanup()

    def add_local(self, features=("tutor", "method", "grammar"), priority=5, enabled=True):
        data = reg.editable()
        data["providers"].append({"id": "lmstudio-pc", "name": "LM Studio", "type": "lmstudio", "base_url": "http://127.0.0.1:1234/v1",
                                  "models": ["gemma-3-4b-it"], "enabled": enabled, "priority": priority, "timeout": 20, "allow_local": True,
                                  "key_mode": "managed", "keys": [], "features": list(features), "json_mode": True})
        reg.save(data)


class UrlGuard(unittest.TestCase):
    def test_blocks_metadata_and_internal(self):
        for url, local in [("http://169.254.169.254/latest", True), ("https://169.254.169.254/v1", False), ("http://metadata.google.internal/v1", True),
                           ("http://127.0.0.1:1234/v1", False), ("https://localhost/v1", False), ("https://10.0.0.5/v1", False),
                           ("http://api.example.com/v1", False), ("ftp://x.example.com", True), ("https://user:pw@api.example.com/v1", False),
                           ("http://[::ffff:169.254.169.254]/v1", True), ("http://0.0.0.0:1234/v1", True)]:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    reg.validate_url(url, local)

    def test_allows_public_and_flagged_local(self):
        self.assertEqual(reg.validate_url("https://api.groq.com/openai/v1/", False), "https://api.groq.com/openai/v1")
        self.assertEqual(reg.validate_url("http://127.0.0.1:1234/v1/chat/completions", True), "http://127.0.0.1:1234/v1")
        self.assertEqual(reg.validate_url("http://192.168.1.20:11434/v1", True), "http://192.168.1.20:11434/v1")


class KeysAndViews(Base):
    def test_encrypt_mask_and_public_view_never_leaks(self):
        enc = reg.encrypt("gsk_secret_value_ABCDEFGH")
        self.assertEqual(reg.decrypt(enc), "gsk_secret_value_ABCDEFGH")
        self.assertEqual(reg.mask("gsk_secret_value_ABCDEFGH"), "gsk_…EFGH")
        data = reg.editable()
        groq = reg.provider("groq", data)
        reg.materialize_keys(groq)
        groq["keys"].append({"id": "k3", "enc": enc, "fp": reg.fingerprint("gsk_secret_value_ABCDEFGH"), "mask": "gsk_…EFGH", "enabled": True})
        reg.save(data)
        self.assertEqual(reg.managed_keys("groq"), ["gsk_legacy_one_123456", "gsk_legacy_two_654321", "gsk_secret_value_ABCDEFGH"])
        dumped = json.dumps(ai_admin._public(reg.provider("groq")))
        self.assertNotIn("gsk_secret_value", dumped)
        self.assertNotIn("legacy_one", dumped)
        raw = self.file.read_text(encoding="utf-8")
        self.assertNotIn("gsk_secret_value", raw)  # stored encrypted

    def test_legacy_mode_reads_old_sources(self):
        self.assertIsNone(reg.managed_keys("groq"))
        self.assertEqual(reg.provider_keys("groq"), ["gsk_legacy_one_123456", "gsk_legacy_two_654321"])

    def test_disabled_key_is_skipped(self):
        data = reg.editable()
        groq = reg.provider("groq", data)
        reg.materialize_keys(groq)
        groq["keys"][0]["enabled"] = False
        reg.save(data)
        self.assertEqual(reg.managed_keys("groq"), ["gsk_legacy_two_654321"])


class Routing(Base):
    def test_default_is_historic_path(self):
        for f in ("tutor", "method", "grammar", "translate"):
            self.assertIsNone(reg.custom_plan(f), f)
        self.assertEqual([i["provider"]["id"] for i in reg.chain("owner_agent")], ["groq", "deepseek"])

    def test_local_provider_first_switches_to_registry(self):
        self.add_local()
        plan = reg.custom_plan("tutor")
        self.assertEqual([i["provider"]["id"] for i in plan], ["lmstudio-pc", "groq", "nvidia"])
        self.assertIsNone(reg.custom_plan("translate"))  # not assigned to translate

    def test_disabled_groq_or_reorder_uses_registry(self):
        data = reg.editable()
        reg.provider("groq", data)["enabled"] = False
        reg.save(data)
        self.assertEqual([i["provider"]["id"] for i in reg.custom_plan("method")], ["nvidia"])

    def test_custom_route_and_local_only(self):
        self.add_local(features=())
        data = reg.editable()
        data["routing"]["grammar"] = {"mode": "custom", "chain": [{"id": "nvidia", "model": "x/y"}, {"id": "groq"}]}
        reg.save(data)
        self.assertEqual([(i["provider"]["id"], i["model"]) for i in reg.custom_plan("grammar")], [("nvidia", "x/y"), ("groq", None)])
        data = reg.editable()
        data["local_only"] = True
        reg.save(data)
        for f in reg.FEATURES:
            self.assertEqual([i["provider"]["id"] for i in reg.chain(f)], ["lmstudio-pc"], f)
        self.assertEqual([p["id"] for p in reg.agent_providers() if p["auto"]], ["reg:lmstudio-pc"])

    def test_agent_providers_shape(self):
        items = {p["id"]: p for p in reg.agent_providers()}
        self.assertTrue(items["builtin:groq"]["auto"])
        self.assertTrue(items["builtin:groq"]["url"].endswith("/chat/completions"))
        self.assertNotIn("builtin:nvidia", items)  # no keys in this test


class Engine(Base):
    async def test_falls_over_and_drops_response_format_for_local(self):
        self.add_local(priority=5)
        calls = []

        async def handler(request):
            body = json.loads(request.content)
            if request.url.host == "127.0.0.1":
                if "response_format" in body:
                    return httpx.Response(400, json={"error": "'response_format.type' must be 'json_schema'"})
                self.assertLessEqual(body["max_tokens"], 2048)
                self.assertNotIn("authorization", request.headers)
                return ok('{"ok": true}')
            return httpx.Response(429)
        with patch.object(reg.httpx, "AsyncClient", client_with(handler, calls)):
            content, model = await reg.complete("method", reg.custom_plan("method"), [{"role": "user", "content": "hi"}], max_tokens=3000, budget=30, json_mode=True)
        self.assertEqual(content, '{"ok": true}')
        self.assertEqual(model, "lmstudio-pc:gemma-3-4b-it")
        self.assertEqual(len(calls), 2)

    async def test_local_down_then_groq(self):
        self.add_local(priority=5)
        calls = []

        async def handler(request):
            if request.url.host == "127.0.0.1":
                raise httpx.ConnectError("refused", request=request)
            self.assertEqual(request.headers["authorization"][:11], "Bearer gsk_")
            return ok("Antwort")
        with patch.object(reg.httpx, "AsyncClient", client_with(handler, calls)):
            content, model = await reg.complete("tutor", reg.custom_plan("tutor"), [{"role": "user", "content": "hi"}], max_tokens=100, budget=30)
        self.assertEqual((content, model), ("Antwort", "groq:openai/gpt-oss-120b"))
        self.assertTrue(await ai_guard.retry_after("reg-lmstudio-pc-tutor"))  # connect error trips the breaker
        await ai_guard.reset("reg-lmstudio-pc-tutor")
        self.assertFalse(await ai_guard.retry_after("reg-lmstudio-pc-tutor"))

    async def test_everything_down_raises_503(self):
        data = reg.editable()
        data["routing"]["method"] = {"mode": "custom", "chain": [{"id": "groq"}]}
        reg.save(data)

        async def handler(request):
            return httpx.Response(429)
        with patch.object(reg.httpx, "AsyncClient", client_with(handler, [])):
            with self.assertRaises(Exception) as ctx:
                await reg.complete("method", reg.custom_plan("method"), [{"role": "user", "content": "x"}], max_tokens=50, budget=20)
        self.assertEqual(ctx.exception.status_code, 503)

    async def test_blocked_target_is_never_called(self):
        data = reg.editable()
        data["providers"].append({"id": "evil", "name": "x", "type": "openai_compat", "base_url": "https://evil.example/v1", "models": ["m"],
                                  "enabled": True, "priority": 1, "timeout": 10, "allow_local": False, "key_mode": "managed",
                                  "keys": [{"id": "a", "enc": reg.encrypt("sk-abcdefgh"), "enabled": True}], "features": ["method"]})
        reg.save(data)
        calls = []
        reg._resolved[("evil.example", False)] = (time.time(), "آدرس‌های metadata/link-local/multicast مجاز نیستند")

        async def handler(request):
            return ok("{}") if request.url.host != "evil.example" else httpx.Response(200, json={"leak": True})
        with patch.object(reg.httpx, "AsyncClient", client_with(handler, calls)):
            content, model = await reg.complete("method", reg.custom_plan("method"), [{"role": "user", "content": "x"}], max_tokens=50, budget=20)
        self.assertTrue(model.startswith("groq:"))
        self.assertFalse(any(c.url.host == "evil.example" for c in calls))

    async def test_tutor_uses_registry_route(self):
        self.add_local(priority=5)

        async def handler(request):
            return ok("پاسخ " * 30)
        with patch.object(reg.httpx, "AsyncClient", client_with(handler, [])):
            content, model = await tutor._complete([{"role": "user", "content": "Frage"}], "fa")
        self.assertEqual(model, "lmstudio-pc:gemma-3-4b-it")


class Relay(unittest.TestCase):
    def test_internal_only(self):
        class R:
            def __init__(self, host, headers):
                self.client = type("C", (), {"host": host})()
                self.headers = headers
        ai_admin._internal(R("127.0.0.1", {}))
        for host, headers in (("127.0.0.1", {"x-real-ip": "1.2.3.4"}), ("8.8.8.8", {}), ("127.0.0.1", {"x-forwarded-for": "1.2.3.4"})):
            with self.assertRaises(Exception):
                ai_admin._internal(R(host, headers))


if __name__ == "__main__":
    unittest.main()
