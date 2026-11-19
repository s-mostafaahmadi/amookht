"""Server-side guard for study time (ACTIME, 2026-11-13).

The browser credits ``activityTimers`` (seconds per activity) only while the learner is
really active. As defence in depth, the server limits how fast the *sum* of those timers
may grow for one account: a token bucket that refills at wall-clock speed (one person can
study at most one second per second, whatever the number of devices) and can bank at most
BANK_MS of unsynced time (offline / delayed saves). Decreases, removed keys and a different
workspace (other plan id after a tab switch or a new day) are never clamped.

The bucket position is kept in ``user_app_states.path_versions['~actime']`` (server-only).
"""
from __future__ import annotations

import copy
from typing import Any

BANK_MS = 20 * 60 * 1000
SLACK_MS = 15 * 1000
PV_KEY = "~actime"


def _num(v: Any) -> float:
    try:
        x = float(v)
    except (TypeError, ValueError, OverflowError):
        return 0.0
    return x if x == x and x not in (float("inf"), float("-inf")) and x > 0 else 0.0


def _plan_id(ctx: Any) -> Any:
    plan = ctx.get("plan") if isinstance(ctx, dict) else None
    return plan.get("id") if isinstance(plan, dict) else None


def _reference_timers(previous: dict, plan_id: Any) -> dict | None:
    """Timers of the same workspace in the previous state, or None when there is none."""
    if plan_id is None:
        return None
    if _plan_id(previous) == plan_id and isinstance(previous.get("activityTimers"), dict):
        return previous["activityTimers"]
    stash = previous.get("planStash")
    if isinstance(stash, dict):
        for ctx in stash.values():
            if isinstance(ctx, dict) and _plan_id(ctx) == plan_id and isinstance(ctx.get("activityTimers"), dict):
                return ctx["activityTimers"]
    return None


def clamp_activity_timers(previous: Any, incoming: Any, credit_until: Any, now_ms: int) -> tuple[Any, int | None, dict]:
    """Return (state, new_credit_until or None if unchanged, {key: seconds_removed})."""
    if not isinstance(incoming, dict) or not isinstance(previous, dict):
        return incoming, None, {}
    timers = incoming.get("activityTimers")
    if not isinstance(timers, dict):
        return incoming, None, {}
    ref = _reference_timers(previous, _plan_id(incoming))
    if ref is None:
        return incoming, None, {}
    increases = []
    for key in sorted(timers):
        delta = _num(timers[key]) - _num(ref.get(key))
        if delta > 0:
            increases.append((key, delta))
    if not increases:
        return incoming, None, {}
    try:
        cu = int(credit_until)
    except (TypeError, ValueError):
        cu = 0
    cu = max(cu, now_ms - BANK_MS)
    budget = max(0.0, (now_ms + SLACK_MS - cu) / 1000.0)
    removed: dict[str, float] = {}
    out = incoming
    used = 0.0
    for key, delta in increases:
        allow = min(delta, budget - used)
        if allow < delta:
            if out is incoming:
                out = dict(incoming)
                out["activityTimers"] = copy.copy(timers)
            new_val = int(_num(ref.get(key)) + max(0.0, allow))
            removed[key] = round(_num(timers[key]) - new_val, 3)
            out["activityTimers"][key] = new_val
            allow = max(0.0, new_val - _num(ref.get(key)))
        used += max(0.0, allow)
    return out, int(cu + used * 1000), removed
