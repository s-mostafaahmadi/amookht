"""SENT-PARTS (2026-11-15): AI segment validation for the sentence-structure colouring."""
import asyncio
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.routes import sentence_parts as sp


class AlignTests(unittest.TestCase):
    S = "Ich stelle dir das Buch heute zur Verfügung."

    def test_valid_segments_keep_order_and_roles(self):
        seg = [["Ich", "S"], ["stelle", "V"], ["dir", "O"], ["das Buch", "O"], ["heute", "P"], ["zur Verfügung", "P"], [".", "X"]]
        self.assertEqual(sp.align(self.S, seg), seg)

    def test_missing_words_are_rejected(self):
        self.assertIsNone(sp.align(self.S, [["Ich", "S"], ["stelle", "V"], [".", "X"]]))

    def test_small_spelling_slip_is_repaired_to_original(self):
        s = "Das ist ein Problem, das viele junge Menschen betrifft."
        seg = [["Das", "S"], ["ist", "V"], ["ein Problem", "O"], [",", "X"], ["das", "K"], ["viele junge Menschen", "O"], ["betreft", "V"], [".", "X"]]
        out = sp.align(s, seg)
        self.assertEqual(out[6], ["betrifft", "V"])

    def test_different_word_is_rejected(self):
        self.assertIsNone(sp.align(self.S, [["Ich", "S"], ["gebe", "V"], ["dir das Buch heute zur Verfügung", "O"], [".", "X"]]))

    def test_segment_with_several_words_keeps_original_spacing(self):
        out = sp.align("Er  kommt   heute.", [["Er kommt", "S"], ["heute", "P"], [".", "X"]])
        self.assertEqual(out[0], ["Er  kommt", "S"])

    def test_wrong_order_is_rejected(self):
        self.assertIsNone(sp.align("Er kommt heute.", [["kommt", "V"], ["Er", "S"], ["heute", "P"], [".", "X"]]))

    def test_unknown_role_becomes_x_and_role_is_upper(self):
        out = sp.align("Er kommt.", [["Er", "s"], ["kommt", "verb"], [".", "?"]])
        self.assertEqual(out, [["Er", "S"], ["kommt", "V"], [".", "X"]])

    def test_garbage_is_rejected(self):
        for bad in (None, [], "Er kommt", [["Er"]], [[None, "S"]]):
            self.assertIsNone(sp.align("Er kommt", bad))

    def test_request_cleans_and_dedupes(self):
        r = sp.PartsRequest(sentences=["  Er   kommt ", "Er kommt", "x", "Das ist gut."])
        self.assertEqual(r.sentences, ["Er kommt", "Das ist gut."])


class EndpointTests(unittest.TestCase):
    def test_ai_result_is_validated_and_cached(self):
        class U:
            id = "u1"
        stored = {}

        async def fake_get(sentences):
            return {}

        async def fake_put(found):
            stored.update(found)

        async def fake_complete(messages, **kw):
            return {"items": [{"i": 0, "seg": [["Er", "S"], ["kommt", "V"], ["heute", "P"], [".", "X"]]},
                              {"i": 1, "seg": [["kaputt", "X"]]}]}, "test"

        with patch.object(sp, "require_premium", lambda u: None), patch.object(sp, "_cache_get", fake_get), \
                patch.object(sp, "_cache_put", fake_put), \
                patch("app.api.routes.grammar_drill._json_complete", fake_complete):
            out = asyncio.run(sp.sentence_parts(sp.PartsRequest(sentences=["Er kommt heute.", "Das ist gut."]), U()))
        self.assertEqual(out["results"]["Er kommt heute."][1], ["kommt", "V"])
        self.assertIsNone(out["results"]["Das ist gut."])
        self.assertIn("Er kommt heute.", stored)
        self.assertNotIn("Das ist gut.", stored)

    def test_non_premium_is_refused(self):
        class U:
            id = "u2"

        def deny(u):
            raise HTTPException(status_code=403, detail="premium")
        with patch.object(sp, "require_premium", deny):
            with self.assertRaises(HTTPException):
                asyncio.run(sp.sentence_parts(sp.PartsRequest(sentences=["Er kommt."]), U()))


if __name__ == "__main__":
    unittest.main()
