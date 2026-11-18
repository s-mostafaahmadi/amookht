// Active study time — the site's AmkActive (active-time.js, ACTIME): time is credited only while the
// window is visible and focused AND there was input in the last 75 s, or audio is playing, or the mic is
// recording. Credit comes from the wall clock between ticks, capped at 10 s per tick, so sleep or clock
// jumps never add time (the server also clamps increases to real time).

const IDLE_MS = 75000;
const TICK_CAP_MS = 10000;
let lastInput = Date.now();
let last = {};
const frac = {};
const media = new Set();
const recorders = new Set();

const touch = () => { lastInput = Date.now(); };
['pointerdown', 'pointermove', 'keydown', 'input', 'wheel', 'touchstart', 'touchmove', 'compositionupdate', 'selectionchange', 'scroll']
  .forEach((ev) => document.addEventListener(ev, touch, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') last = {}; else touch(); });
window.addEventListener('blur', () => { last = {}; });
window.addEventListener('focus', touch);

try {
  const MP = HTMLMediaElement.prototype;
  const origPlay = MP.play;
  MP.play = function play(...args) { media.add(this); touch(); return origPlay.apply(this, args); };
  document.addEventListener('play', (e) => { if (e.target && e.target.tagName) media.add(e.target); }, true);
} catch { /* ignore */ }
try {
  const MR = window.MediaRecorder && MediaRecorder.prototype;
  const origStart = MR && MR.start;
  if (origStart) MR.start = function start(...args) { recorders.add(this); touch(); return origStart.apply(this, args); };
} catch { /* ignore */ }

function mediaPlaying() {
  let on = false;
  media.forEach((m) => { if (m && !m.paused && !m.ended) on = true; else media.delete(m); });
  try { if (window.speechSynthesis && speechSynthesis.speaking) on = true; } catch { /* ignore */ }
  return on;
}
function recording() {
  let on = false;
  recorders.forEach((r) => { if (r && r.state === 'recording') on = true; else if (r && r.state === 'inactive') recorders.delete(r); });
  return on;
}
export function reason() {
  if (document.visibilityState !== 'visible') return 'hidden';
  let focused = true;
  try { focused = document.hasFocus(); } catch { /* ignore */ }
  if (!focused) return 'blurred';
  if (Date.now() - lastInput >= IDLE_MS && !mediaPlaying() && !recording()) return 'idle';
  return '';
}
export const active = () => !reason();

/** Whole seconds to add for `key` since its previous call (0 when not active). */
export function credit(key) {
  key = String(key || 'default');
  const t = Date.now();
  const prev = last[key];
  last[key] = t;
  if (!prev || t <= prev) return 0;
  const gap = Math.min(t - prev, TICK_CAP_MS);
  if (!active()) return 0;
  frac[key] = (frac[key] || 0) + gap / 1000;
  const n = Math.floor(frac[key]);
  frac[key] -= n;
  return n;
}

export { touch };
