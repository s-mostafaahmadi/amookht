"""AI fallback (2026-11-12): user-facing AI calls fail fast and the circuit breaker short-circuits a dead provider."""
import asyncio
import time
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException

from app.api import ai_guard, ai_nvidia
from app.api.routes import method_feedback as mf
from app.api.routes import study_tutor as tutor

REAL_CLIENT = httpx.AsyncClient


def client_with(handler, calls):
    async def wrapped(request):
        calls.append(request)
        return await handler(request)

    def factory(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(wrapped)
        return REAL_CLIENT(*args, **kwargs)
    return factory


def no_redis():
    raise ConnectionError("redis disabled in tests")


def ok_json(content):
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


class Base(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        ai_guard._local.clear()
        ai_guard._local_fails.clear()
        self.patches = [patch.object(ai_guard, "_client", no_redis), patch.object(mf, "_groq_keys", lambda: ["k1", "k2", "k3"]), patch.object(ai_nvidia, "keys", lambda: [])]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        ai_guard._local.clear()
        ai_guard._local_fails.clear()


class MethodLLM(Base):
    async def test_all_rate_limited_trips_breaker_and_next_call_is_instant(self):
        calls = []

        async def h(req):
            return httpx.Response(429, json={"error": "rate"})
        with patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            with self.assertRaises(HTTPException) as ctx:
                await mf._llm("x")
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertEqual(ctx.exception.detail["code"], "ai_unavailable")
            self.assertGreater(ctx.exception.detail["retry_after"], 0)
            first = len(calls)
            t0 = time.monotonic()
            with self.assertRaises(HTTPException) as ctx2:
                await mf._llm("x")
            self.assertEqual(len(calls), first, "breaker open: no provider call")
            self.assertLess(time.monotonic() - t0, 0.5)
            self.assertEqual(ctx2.exception.detail["code"], "ai_unavailable")
        status = await mf.ai_status(user=None)
        self.assertEqual(status["state"], "down")

    async def test_invalid_keys_fail_fast(self):
        calls = []

        async def h(req):
            return httpx.Response(401, json={"error": "invalid key"})
        t0 = time.monotonic()
        with patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            with self.assertRaises(HTTPException) as ctx:
                await mf._llm("x")
        self.assertLess(time.monotonic() - t0, 2)
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertGreater(await ai_guard.retry_after(mf.BREAKER), 0)

    async def test_hanging_provider_is_bounded_by_budget(self):
        calls = []

        async def h(req):
            await asyncio.sleep(30)
            return ok_json("{}")
        with patch.object(mf, "TEXT_BUDGET", 5.0), patch.object(mf, "TEXT_ATTEMPT", 1.0), patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            t0 = time.monotonic()
            with self.assertRaises(HTTPException) as ctx:
                await mf._llm("x")
            elapsed = time.monotonic() - t0
        self.assertLess(elapsed, 8, "request must end near the budget, not after minutes")
        self.assertEqual(ctx.exception.status_code, 503)
        # one hung request alone does not open the breaker; a second one does
        self.assertEqual(await ai_guard.retry_after(mf.BREAKER), 0)
        await ai_guard.record_failure(mf.BREAKER, ["timeout"])
        self.assertGreater(await ai_guard.retry_after(mf.BREAKER), 0)

    async def test_recovers_after_one_rate_limited_key(self):
        calls = []

        async def h(req):
            return httpx.Response(429) if len(calls) == 1 else ok_json('{"fa": "سلام"}')
        with patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            raw, model = await mf._llm("x")
        self.assertIn("سلام", raw)
        self.assertEqual(len(calls), 2)
        self.assertEqual(await ai_guard.retry_after(mf.BREAKER), 0)

    async def test_success_resets_failure_count(self):
        await ai_guard.record_failure(mf.BREAKER, ["timeout"])
        calls = []

        async def h(req):
            return ok_json("{}")
        with patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            await mf._llm("x")
        await ai_guard.record_failure(mf.BREAKER, ["timeout"])
        self.assertEqual(await ai_guard.retry_after(mf.BREAKER), 0)


class Transcribe(Base):
    async def test_transcription_down_gives_ai_unavailable(self):
        import pathlib
        import tempfile
        calls = []

        async def h(req):
            raise httpx.ConnectError("blocked")
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "a.webm"
            f.write_bytes(b"0" * 100)
            with patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
                with self.assertRaises(HTTPException) as ctx:
                    await mf._transcribe(f, ["k1", "k2"])
        self.assertEqual(ctx.exception.detail["code"], "asr_unavailable")
        self.assertGreater(await ai_guard.retry_after(mf.BREAKER), 0)


class Tutor(Base):
    async def test_tutor_down_then_short_circuit(self):
        calls = []

        async def h(req):
            return httpx.Response(429)
        providers = lambda: [{"id": "builtin:groq", "keys": ["a", "b", "c"]}]
        with patch.object(tutor, "_providers", providers), patch.object(tutor.httpx, "AsyncClient", client_with(h, calls)):
            with self.assertRaises(HTTPException) as ctx:
                await tutor._complete([{"role": "user", "content": "hi"}], "fa")
            self.assertEqual(ctx.exception.detail["code"], "ai_unavailable")
            n = len(calls)
            with self.assertRaises(HTTPException):
                await tutor._complete([{"role": "user", "content": "hi"}], "fa")
            self.assertEqual(len(calls), n)
        # the tutor breaker is separate from the method breaker
        self.assertEqual(await ai_guard.retry_after(mf.BREAKER), 0)


class NvidiaFallback(Base):
    def nv(self, keys=("nv1", "nv2")):
        return patch.object(ai_nvidia, "keys", lambda: [k for k in keys if ai_nvidia._bad.get(k, 0) < time.time()])

    def tearDown(self):
        super().tearDown()
        ai_nvidia._bad.clear()

    async def test_groq_rate_limited_switches_to_nvidia(self):
        calls = []

        async def h(req):
            if "groq" in req.url.host:
                return httpx.Response(429)
            return ok_json('{"fa": "مزیت"}')
        with self.nv(), patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            raw, model = await mf._llm("x")
            self.assertTrue(model.startswith("nvidia:"))
            self.assertIn("مزیت", raw)
            self.assertEqual((await mf.ai_status(user=None))["state"], "degraded")
            # Groq breaker is open now: the next request goes straight to NVIDIA
            n_groq = sum(1 for c in calls if "groq" in c.url.host)
            raw2, model2 = await mf._llm("y")
            self.assertTrue(model2.startswith("nvidia:"))
            self.assertEqual(sum(1 for c in calls if "groq" in c.url.host), n_groq)

    async def test_rejected_nvidia_key_is_skipped(self):
        calls = []

        async def h(req):
            if "groq" in req.url.host:
                return httpx.Response(503)
            return httpx.Response(403) if req.headers["authorization"].endswith("nv1") else ok_json("{}")
        with self.nv(), patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            raw, model = await mf._llm("x")
        self.assertTrue(model.startswith("nvidia:"))
        self.assertGreater(ai_nvidia._bad.get("nv1", 0), time.time())

    async def test_both_providers_down_gives_ai_unavailable(self):
        calls = []

        async def h(req):
            return httpx.Response(429)
        with self.nv(), patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            with self.assertRaises(HTTPException) as ctx:
                await mf._llm("x")
            self.assertEqual(ctx.exception.detail["code"], "ai_unavailable")
            self.assertEqual((await mf.ai_status(user=None))["state"], "down")
            n = len(calls)
            with self.assertRaises(HTTPException):
                await mf._llm("x")
            self.assertEqual(len(calls), n, "both breakers open: no provider call at all")

    async def test_groq_hang_leaves_time_for_nvidia(self):
        calls = []

        async def h(req):
            if "groq" in req.url.host:
                await asyncio.sleep(30)
            return ok_json("{}")
        with self.nv(), patch.object(mf, "TEXT_BUDGET", 12.0), patch.object(mf, "GROQ_SHARE", 4.0), patch.object(mf, "TEXT_ATTEMPT", 1.0), patch.object(mf.httpx, "AsyncClient", client_with(h, calls)):
            t0 = time.monotonic()
            raw, model = await mf._llm("x")
        self.assertTrue(model.startswith("nvidia:"))
        self.assertLess(time.monotonic() - t0, 10)

    async def test_tutor_switches_to_nvidia(self):
        calls = []

        async def h(req):
            if "groq" in req.url.host:
                return httpx.Response(429)
            return ok_json("سلام! " + "این یک پاسخ فارسی آزمایشی برای مربی است و به اندازه کافی طولانی است.")
        providers = lambda: [{"id": "builtin:groq", "keys": ["a", "b", "c"]}]
        with self.nv(), patch.object(tutor, "_providers", providers), patch.object(tutor.httpx, "AsyncClient", client_with(h, calls)):
            answer, model = await tutor._complete([{"role": "user", "content": "hi"}], "fa")
        self.assertTrue(model.startswith("nvidia:"))

    async def test_transcription_error_code_is_separate(self):
        import pathlib
        import tempfile

        async def h(req):
            return httpx.Response(500)
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "a.webm"
            f.write_bytes(b"0" * 100)
            with patch.object(mf.httpx, "AsyncClient", client_with(h, [])):
                with self.assertRaises(HTTPException) as ctx:
                    await mf._transcribe(f, ["k1"])
        self.assertEqual(ctx.exception.detail["code"], "asr_unavailable")


if __name__ == "__main__":
    unittest.main()
