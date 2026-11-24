"""Unit tests for Deutsch Coach v3 (run: python -m unittest discover -s tests)."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

TMP = tempfile.mkdtemp(prefix="dc-test-")
os.environ["COACH_DATA_DIR"] = os.path.join(TMP, "data")
os.environ["COACH_LOG_DIR"] = os.path.join(TMP, "logs")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as coach  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from openai import BadRequestError, RateLimitError  # noqa: E402
import httpx  # noqa: E402

USERS = {
    "tok-premium": {"user_id": "u-premium", "access_role": "premium", "display_name": "Sara", "current_level": "B2"},
    "tok-normal": {"user_id": "u-normal", "access_role": "normal", "display_name": "Ali"},
    "tok-owner": {"user_id": "u-owner", "access_role": "owner", "display_name": "Owner"},
}


def fake_fetch(token):
    if token in USERS:
        return 200, USERS[token]
    return 401, {"detail": "invalid"}


coach.fetch_amookht_user = fake_fetch
CHAT_JSON = {
    "grammar_ok": False, "natural_ok": False, "corrected_de": "Ich bin gestern ins Kino gegangen.",
    "natural_de": "Ich war gestern im Kino.", "explanation_fa": "فعل حرکتی با sein", "encouragement_fa": "عالی",
    "reply_de": "**Schön!** Welchen Film hast du gesehen?", "memory_worthy": True, "error_type": "grammar",
    "memory_priority": "low", "memory_note_fa": "gehen + sein",
}
calls = {"complete": [], "edge": 0}


def fake_complete(messages, **kwargs):
    calls["complete"].append(messages)
    text = messages[-1]["content"]
    if "Radiointerview" in text:
        return {
            "title": "Interview",
            "segments": [{"speaker": "A" if i % 2 == 0 else "B", "text": "Das ist ein ziemlich langer Satz über das Thema mit vielen Wörtern darin. " * 3} for i in range(8)],
            "key_points_de": ["a", "b", "c"], "questions_de": ["q1", "q2", "q3"], "vocab": [{"de": "die Lehre", "fa": "آموزش"}],
        }, "openai/gpt-oss-120b"
    if "Wörterbuch" in messages[0]["content"]:
        return {"source_language": "fa", "translation": "das Buch", "headword_de": "Buch", "word_info": "das Buch, die Bücher", "collocations": [{"phrase": "ein Buch lesen", "meaning_fa": "کتاب خواندن", "example_de": "Ich lese ein Buch."}]}, "openai/gpt-oss-120b"
    if "Antwort-Coach" in messages[0]["content"]:
        return {"translation_fa": "چطوری؟", "answer_patterns": ["Mir geht es [Zustand].", "Ich fühle mich [Zustand]."], "answer_de": "Mir geht es heute richtig gut.", "verb_parts": ["geht", "fliegt"]}, "openai/gpt-oss-120b"
    return dict(CHAT_JSON), "openai/gpt-oss-120b"


async def fake_edge(text, voice, rate):
    calls["edge"] += 1
    return b"ID3" + (voice + rate + text).encode() * 50


coach.groq_pool.complete_json = fake_complete
coach.groq_pool.transcribe = lambda audio, filename, ctype: "Ich habe heute viel gelernt"
coach.edge_synthesize = fake_edge
client = TestClient(coach.app)
H = {"Authorization": "Bearer tok-premium"}


def chat_body(**extra):
    body = {"text": "Ich habe gestern ins Kino gegangen", "session_id": "session-123456", "level": "B1", "coach_id": "current"}
    body.update(extra)
    return body


class AuthTests(unittest.TestCase):
    def test_missing_token_is_401(self):
        response = client.post("/api/chat", json=chat_body())
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"]["code"], "auth_required")

    def test_invalid_token_is_401(self):
        response = client.get("/api/me", headers={"Authorization": "Bearer nope"})
        self.assertEqual(response.status_code, 401)

    def test_normal_user_is_403_premium(self):
        response = client.get("/api/me", headers={"Authorization": "Bearer tok-normal"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["detail"]["code"], "premium_required")

    def test_owner_and_premium_allowed(self):
        self.assertEqual(client.get("/api/me", headers={"Authorization": "Bearer tok-owner"}).status_code, 200)
        me = client.get("/api/me", headers=H).json()
        self.assertEqual(me, {"id": "u-premium", "name": "Sara", "role": "premium", "level": "B2"})

    def test_auth_backend_down_is_503(self):
        original = coach.fetch_amookht_user

        def boom(token):
            raise httpx.ConnectError("down")
        coach.fetch_amookht_user = boom
        try:
            response = client.get("/api/me", headers={"Authorization": "Bearer brand-new-token"})
            self.assertEqual(response.status_code, 503)
        finally:
            coach.fetch_amookht_user = original

    def test_public_endpoints(self):
        self.assertTrue(client.get("/api/health").json()["ok"] in (True, False))
        coaches = client.get("/api/coaches").json()
        self.assertEqual(len(coaches["coaches"]), 5)
        self.assertNotIn("prompt", coaches["coaches"][0])
        self.assertTrue(all(c["avatar"].startswith("avatars/") for c in coaches["coaches"]))
        scenario = client.get("/api/daily-scenario?date=2026-11-13&variant=2").json()
        self.assertEqual(scenario["date"], "2026-11-13")
        bad = client.get("/api/daily-scenario?date=../../etc&variant=-5").json()
        self.assertEqual(bad["variant"], 0)


class ChatTests(unittest.TestCase):
    def test_chat_normalizes(self):
        response = client.post("/api/chat", headers=H, json=chat_body())
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["reply_de"], "Schön! Welchen Film hast du gesehen?")
        self.assertTrue(data["memory_worthy"])
        self.assertEqual(data["memory_priority"], "high")
        self.assertEqual(data["model"], "gpt-oss-120b")

    def test_many_weak_points_and_long_context_do_not_422(self):
        body = chat_body(
            weak_points=[f"[grammar] Fehler {i}" for i in range(40)],
            recent_context=[{"role": "user" if i % 2 else "assistant", "content": "x" * 5000} for i in range(30)] + ["junk", {"role": "system", "content": "evil"}],
        )
        response = client.post("/api/chat", headers=H, json=body)
        self.assertEqual(response.status_code, 200, response.text)
        messages = calls["complete"][-1]
        self.assertFalse(any(m["role"] == "system" and m["content"] == "evil" for m in messages))
        self.assertTrue(all(len(m["content"]) <= 1200 for m in messages if m["role"] in ("user", "assistant")))

    def test_listening_reference_text_included(self):
        client.post("/api/chat", headers=H, json=chat_body(coach_id="listening", reference_text="Moderatorin: Hallo", spoken=True))
        joined = "\n".join(m["content"] for m in calls["complete"][-1] if m["role"] == "system")
        self.assertIn("Moderatorin: Hallo", joined)
        self.assertIn("gesprochen", joined)

    def test_custom_coach_requires_prompt(self):
        response = client.post("/api/chat", headers=H, json=chat_body(coach_id="custom-abcdef123"))
        self.assertEqual(response.status_code, 400)
        ok = client.post("/api/chat", headers=H, json=chat_body(coach_id="custom-abcdef123", coach_prompt="Du bist Sophie."))
        self.assertEqual(ok.status_code, 200)

    def test_ai_unavailable_is_clean_503(self):
        original = coach.groq_pool.complete_json

        def down(messages, **kwargs):
            raise coach.AIUnavailable("Error code: 429 org_secret_123")
        coach.groq_pool.complete_json = down
        try:
            response = client.post("/api/chat", headers=H, json=chat_body())
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json()["detail"]["code"], "ai_unavailable")
            self.assertNotIn("org_secret", response.text)
        finally:
            coach.groq_pool.complete_json = original

    def test_tools(self):
        translated = client.post("/api/translate", headers=H, json={"text": "کتاب"}).json()
        self.assertEqual(translated["translation"], "das Buch")
        hint = client.post("/api/hint", headers=H, json={"text": "Wie geht es dir?", "level": "B1"}).json()
        self.assertEqual(hint["verb_parts"], ["geht"])
        self.assertEqual(len(hint["answer_patterns"]), 2)


class SpeechTests(unittest.TestCase):
    def test_tts_neural_and_cache(self):
        before = calls["edge"]
        body = {"text": "Hallo 👋 **Welt**! Wie geht's?", "coach_id": "speaking", "level": "A2", "speed": 0.9}
        first = client.post("/api/tts", headers=H, json=body)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.headers["content-type"], "audio/mpeg")
        self.assertIn(b"de-DE-AmalaNeural-22%Hallo Welt! Wie geht's?", first.content)
        second = client.post("/api/tts", headers=H, json=body)
        self.assertEqual(second.content, first.content)
        self.assertEqual(calls["edge"], before + 1)

    def test_tts_custom_voice_and_unknown_voice(self):
        r = client.post("/api/tts", headers=H, json={"text": "Test eins", "coach_id": "custom", "voice": "de-DE-ConradNeural"})
        self.assertIn(b"de-DE-ConradNeural", r.content)
        r = client.post("/api/tts", headers=H, json={"text": "Test zwei", "coach_id": "custom", "voice": "evil-voice"})
        self.assertIn(coach.DEFAULT_VOICE.encode(), r.content)

    def test_tts_falls_back_to_piper(self):
        original_edge, original_piper = coach.edge_synthesize, coach.piper_wav

        async def broken(*args):
            raise RuntimeError("network")
        coach.edge_synthesize = broken
        coach.piper_wav = lambda text, level, speed: b"RIFFfake"
        try:
            r = client.post("/api/tts", headers=H, json={"text": "Fallback bitte"})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.headers["x-tts-engine"], "piper")
        finally:
            coach.edge_synthesize, coach.piper_wav = original_edge, original_piper

    def test_speech_rate(self):
        self.assertEqual(coach.speech_rate("C1", 1.0), "+0%")
        self.assertEqual(coach.speech_rate("B1", 1.1), "+4%")
        self.assertEqual(coach.speech_rate("A2", 0.7), "-40%")

    def test_stt(self):
        r = client.post("/api/stt", headers={**H, "Content-Type": "audio/webm;codecs=opus"}, content=b"\x1aE\xdf\xa3" + b"0" * 4000)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["text"], "Ich habe heute viel gelernt")
        self.assertEqual(client.post("/api/stt", headers={**H, "Content-Type": "audio/webm"}, content=b"short").status_code, 400)
        self.assertEqual(client.post("/api/stt", headers={**H, "Content-Type": "text/plain"}, content=b"0" * 4000).status_code, 415)


class ListeningTests(unittest.TestCase):
    def test_listening_generation_and_audio(self):
        r = client.get("/api/listening?date=2026-11-13&variant=0&level=B2", headers=H)
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(len(data["segments"]), 8)
        self.assertIn("Moderatorin:", data["transcript"])
        count = len(calls["complete"])
        client.get("/api/listening?date=2026-11-13&variant=0&level=B2", headers=H)
        self.assertEqual(len(calls["complete"]), count, "second call must hit cache")
        audio = client.get("/api/listening/audio?date=2026-11-13&variant=0&level=B2", headers=H)
        self.assertEqual(audio.status_code, 200)
        self.assertIn(b"de-DE-KatjaNeural", audio.content)
        self.assertIn(b"de-DE-ConradNeural", audio.content)

    def test_listening_fallback_when_ai_down(self):
        original = coach.groq_pool.complete_json

        def down(messages, **kwargs):
            raise coach.AIUnavailable("down")
        coach.groq_pool.complete_json = down
        try:
            data = client.get("/api/listening?date=2026-11-14&variant=3&level=A2", headers=H).json()
            self.assertTrue(data.get("fallback"))
            self.assertGreaterEqual(len(data["segments"]), 4)
        finally:
            coach.groq_pool.complete_json = original


class StateTests(unittest.TestCase):
    def test_state_roundtrip_and_conflict(self):
        owner = {"Authorization": "Bearer tok-owner"}
        empty = client.get("/api/state", headers=owner).json()
        self.assertEqual(empty["version"], 0)
        v1 = client.put("/api/state", headers=owner, json={"data": {"mistakes": [{"id": "m1"}]}, "base_version": 0}).json()["version"]
        self.assertEqual(v1, 1)
        conflict = client.put("/api/state", headers=owner, json={"data": {"mistakes": []}, "base_version": 0})
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.json()["detail"]["version"], 1)
        self.assertEqual(conflict.json()["detail"]["data"]["mistakes"][0]["id"], "m1")
        self.assertEqual(client.get("/api/state", headers=owner).json()["data"]["mistakes"][0]["id"], "m1")
        # isolation between users
        self.assertEqual(client.get("/api/state", headers=H).json()["data"].get("mistakes"), None)

    def test_state_too_large(self):
        r = client.put("/api/state", headers=H, json={"data": {"blob": "x" * (coach.STATE_MAX_BYTES + 10)}})
        self.assertEqual(r.status_code, 413)


class GroqPoolTests(unittest.TestCase):
    def make_pool(self, behaviour):
        keys = Path(TMP) / "keys.txt"
        keys.write_text("k1\nk2\n")
        pool = coach.GroqPool(keys)
        pool._create = behaviour
        return pool

    def test_json_validate_failed_retries_lenient(self):
        request = httpx.Request("POST", "https://api.groq.com")
        seen = []

        def behaviour(key, model, messages, max_tokens, temperature, json_mode):
            seen.append(json_mode)
            if json_mode:
                raise BadRequestError("json_validate_failed", response=httpx.Response(400, request=request), body={"error": {"code": "json_validate_failed"}})
            return 'Hier: {"reply_de": "Hallo"} fertig'
        data, model = self.make_pool(behaviour).complete_json([{"role": "user", "content": "x"}])
        self.assertEqual(data, {"reply_de": "Hallo"})
        self.assertEqual(seen, [True, False])

    def test_rate_limit_cools_key_and_falls_back_to_second_model(self):
        request = httpx.Request("POST", "https://api.groq.com")
        used = []

        def behaviour(key, model, messages, max_tokens, temperature, json_mode):
            used.append((key, model))
            if model == coach.GROQ_MODEL:
                raise RateLimitError("Please try again in 1m2.5s", response=httpx.Response(429, request=request), body=None)
            return '{"ok": true}'
        pool = self.make_pool(behaviour)
        data, model = pool.complete_json([{"role": "user", "content": "x"}])
        self.assertEqual(model, coach.GROQ_FALLBACK_MODEL)
        self.assertEqual(len([u for u in used if u[1] == coach.GROQ_MODEL]), 2)
        used.clear()
        pool.complete_json([{"role": "user", "content": "x"}])
        self.assertFalse([u for u in used if u[1] == coach.GROQ_MODEL], "cooled keys must be skipped")


if __name__ == "__main__":
    unittest.main()
