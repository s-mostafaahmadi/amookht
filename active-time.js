/* Amookht active study time (ACTIME, 2026-11-13).
   Study time is credited only while the learner is really working:
   - the page is visible AND the window has focus,
   - and there was real input in the last IDLE_MS, or audio/video is playing, or the mic is recording,
   - and this tab owns the cross-tab lock (no double counting between tabs).
   Credit is measured from the wall clock between ticks, capped per tick (sleep, suspend or clock
   jumps can never add more than TICK_CAP_MS), and reset whenever the page is hidden or blurred.
   The main app's activity timer calls AmkActive.credit('act:'+id) once per second. */
(function () {
  'use strict';
  if (window.AmkActive) return;
  var IDLE_MS = 75000, TICK_CAP_MS = 10000, LOCK_KEY = 'amk_at_owner', LOCK_TTL_MS = 4000;
  var tabId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var now = function () { return Date.now(); };
  var lastInput = now(), last = {}, frac = {}, media = new Set(), recorders = new Set(), totals = {};

  function touch() { lastInput = now(); }
  ['pointerdown', 'pointermove', 'keydown', 'input', 'wheel', 'touchstart', 'touchmove', 'compositionupdate', 'selectionchange']
    .forEach(function (ev) { document.addEventListener(ev, touch, { capture: true, passive: true }); });
  document.addEventListener('scroll', touch, { capture: true, passive: true });
  function reset() { last = {}; }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState !== 'visible') reset(); else touch(); });
  window.addEventListener('blur', reset);
  window.addEventListener('focus', touch);
  window.addEventListener('pagehide', reset);

  // Media and microphone: detached Audio objects never bubble events to document, so wrap the prototypes.
  try {
    var MP = window.HTMLMediaElement && HTMLMediaElement.prototype, origPlay = MP && MP.play;
    if (origPlay) MP.play = function () { media.add(this); touch(); return origPlay.apply(this, arguments); };
    document.addEventListener('play', function (e) { if (e.target && e.target.tagName) media.add(e.target); }, true);
  } catch (e) { /* ignore */ }
  try {
    var MR = window.MediaRecorder && MediaRecorder.prototype, origStart = MR && MR.start;
    if (origStart) MR.start = function () { recorders.add(this); touch(); return origStart.apply(this, arguments); };
  } catch (e) { /* ignore */ }
  function mediaPlaying() {
    var on = false;
    // A paused or finished element is dropped; play() / the 'play' event adds it again.
    media.forEach(function (m) { if (m && !m.paused && !m.ended) on = true; else media.delete(m); });
    try { if (window.speechSynthesis && speechSynthesis.speaking) on = true; } catch (e) { /* ignore */ }
    return on;
  }
  function recording() {
    var on = false;
    recorders.forEach(function (r) { if (r && r.state === 'recording') on = true; else if (r && r.state === 'inactive') recorders.delete(r); });
    return on;
  }
  function visible() { return document.visibilityState === 'visible'; }
  function focused() { try { return document.hasFocus(); } catch (e) { return true; } }

  // Cross-tab lock: the tab that credited last owns it for LOCK_TTL_MS. A focused, active tab only
  // waits while another tab holds a fresh lock; window focus is exclusive, so this rarely blocks.
  var bc = null; try { bc = new BroadcastChannel('amk-active-time'); } catch (e) { /* ignore */ }
  var peer = { id: '', t: 0 };
  if (bc) bc.onmessage = function (e) { var d = e && e.data; if (d && d.id && d.id !== tabId) peer = { id: d.id, t: now() }; };
  function lockFree() {
    var t = now();
    if (peer.id && t - peer.t < LOCK_TTL_MS) return false;
    try { var o = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); if (o && o.id !== tabId && t - o.t < LOCK_TTL_MS && t >= o.t) return false; } catch (e) { /* ignore */ }
    return true;
  }
  function holdLock() {
    var t = now();
    try { localStorage.setItem(LOCK_KEY, JSON.stringify({ id: tabId, t: t })); } catch (e) { /* ignore */ }
    try { if (bc) bc.postMessage({ id: tabId, t: t }); } catch (e) { /* ignore */ }
  }
  window.addEventListener('pagehide', function () { try { var o = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); if (o && o.id === tabId) localStorage.removeItem(LOCK_KEY); } catch (e) { /* ignore */ } });

  function reason() {
    if (!visible()) return 'hidden';
    if (!focused()) return 'blurred';
    if (now() - lastInput >= IDLE_MS && !mediaPlaying() && !recording()) return 'idle';
    if (!lockFree()) return 'other-tab';
    return '';
  }
  function active() { return !reason(); }

  // Returns whole seconds to add for `key` since its previous call (0 when not active).
  function credit(key) {
    key = String(key || 'default');
    var t = now(), prev = last[key];
    last[key] = t;
    if (!prev || t <= prev) return 0;
    var gap = Math.min(t - prev, TICK_CAP_MS);
    if (!active()) return 0;
    holdLock();
    frac[key] = (frac[key] || 0) + gap / 1000;
    var n = Math.floor(frac[key]);
    frac[key] -= n;
    if (n > 0) totals[key] = (totals[key] || 0) + n;
    return n;
  }

  var css = document.createElement('style');
  css.id = 'amk-active-time-css';
  css.textContent = '.amk-at-idle{opacity:.45;transition:opacity .3s}.amk-at-idle::after{content:" \\23F8";font-size:.85em}';
  (document.head || document.documentElement).appendChild(css);

  window.AmkActive = {
    credit: credit, active: active, reason: reason, touch: touch,
    status: function () { return { reason: reason(), idleFor: now() - lastInput, media: mediaPlaying(), recording: recording(), tab: tabId, totals: Object.assign({}, totals) }; },
    _cfg: { IDLE_MS: IDLE_MS, TICK_CAP_MS: TICK_CAP_MS, LOCK_TTL_MS: LOCK_TTL_MS }
  };
})();
