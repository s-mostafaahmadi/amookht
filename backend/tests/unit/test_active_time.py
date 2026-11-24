import unittest

from app.api.active_time import BANK_MS, clamp_activity_timers

NOW = 10_000_000_000


def st(pid, timers, stash=None):
    s = {"plan": {"id": pid}, "activityTimers": timers}
    if stash is not None:
        s["planStash"] = stash
    return s


class ActiveTimeClampTest(unittest.TestCase):
    def test_normal_increase_passes(self):
        out, cu, rm = clamp_activity_timers(st("p", {"a": 100}), st("p", {"a": 110}), NOW - 10_000, NOW)
        self.assertEqual(out["activityTimers"]["a"], 110)
        self.assertEqual(rm, {})
        self.assertEqual(cu, NOW)

    def test_jump_is_clamped_to_bank(self):
        out, cu, rm = clamp_activity_timers(st("p", {"a": 0}), st("p", {"a": 5 * 3600}), None, NOW)
        self.assertLessEqual(out["activityTimers"]["a"], BANK_MS / 1000 + 15)
        self.assertIn("a", rm)

    def test_two_devices_cannot_double(self):
        prev, cu, total = st("p", {"a": 0}), NOW - 1000, 0
        t = NOW
        for i in range(360):  # one hour, two devices each adding 10 s every 10 s
            t += 5000
            inc = st("p", {"a": prev["activityTimers"]["a"] + 10})
            prev, new_cu, _ = clamp_activity_timers(prev, inc, cu, t)
            cu = new_cu if new_cu is not None else cu
        self.assertLessEqual(prev["activityTimers"]["a"], 3600 + 15 + 5)

    def test_decrease_and_other_workspace_untouched(self):
        out, cu, rm = clamp_activity_timers(st("p", {"a": 500}), st("p", {"a": 0}), NOW, NOW)
        self.assertEqual(out["activityTimers"]["a"], 0)
        self.assertIsNone(cu)
        # switching to the free workspace (parked in planStash) restores its own timers unchanged
        prev = st("p", {"a": 5}, {"free": {"plan": {"id": "f"}, "activityTimers": {"g": 900}}})
        out, cu, rm = clamp_activity_timers(prev, st("f", {"g": 900}), NOW, NOW)
        self.assertEqual(out["activityTimers"]["g"], 900)
        # brand-new plan id: no reference, never clamped
        out, cu, rm = clamp_activity_timers(prev, st("new", {"x": 4000}), NOW, NOW)
        self.assertEqual(out["activityTimers"]["x"], 4000)

    def test_does_not_mutate_input(self):
        inc = st("p", {"a": 99999})
        clamp_activity_timers(st("p", {"a": 0}), inc, NOW, NOW)
        self.assertEqual(inc["activityTimers"]["a"], 99999)

    def test_garbage_values(self):
        out, cu, rm = clamp_activity_timers(st("p", {"a": "x"}), st("p", {"a": None, "b": float("nan")}), "bad", NOW)
        self.assertEqual(rm, {})


if __name__ == "__main__":
    unittest.main()
