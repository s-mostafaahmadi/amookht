// «مطالعه آزاد» — the site's free-study desk (appSettings.freeStudy, _stateVersion 7):
// tasks (daily / one-time, priority), the focus timer (Pomodoro, short break, time-debt
// payback, free timer) with per-activity time, the daily goal, a quick note and the last
// seven days. Same state document as the website, so the desk, the timer and today's
// minutes stay in step between the app, the site and every other device.
//
// The site mounts it on the library screen (renderLibraryBaseWithFreeStudy) and keeps it
// ticking in the background; this module does the same and only repaints numbers while
// the timer runs, so typing in the task or note field is never interrupted.

import { esc } from '../core/ui.js';
import { L } from '../core/learning.js';
import { lang } from '../core/i18n.js';
import { promptDialog } from './widgets.js';
import { T } from '../core/tr.js';

const MODES = ['focus', 'short', 'long', 'free'];
const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#84cc16'];
const VERSION = 7;

const pad2 = (n) => String(n).padStart(2, '0');
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/* ─────────────── state (site normalizeFreeStudy) ─────────────── */
function normalize(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const mode = MODES.includes(value.mode) ? value.mode : 'focus';
  const defaultMinutes = mode === 'focus' ? 25 : mode === 'short' ? 5 : mode === 'long' ? 0 : 25;
  const pauseSeconds = Math.max(0, Number(value.pauseSeconds) || 0);
  const categories = Array.isArray(value.pomodoroCategories) ? value.pomodoroCategories.filter((x) => x && x.id && x.label).slice(0, 12) : [];
  if (!categories.length) categories.push({ id: 'study', label: L('مطالعه', 'Study', 'Lernen'), color: '#8b5cf6' });
  const activePomodoroCategoryId = categories.some((x) => x.id === value.activePomodoroCategoryId) ? value.activePomodoroCategoryId : categories[0].id;
  const remaining = mode === 'long' ? pauseSeconds : Number.isFinite(Number(value.remaining)) ? Math.max(0, Number(value.remaining)) : defaultMinutes * 60;
  return {
    _stateVersion: VERSION,
    tasks: Array.isArray(value.tasks) ? value.tasks.slice(0, 250) : [],
    sessions: value.sessions && typeof value.sessions === 'object' ? value.sessions : {},
    pomodoroCompletions: value.pomodoroCompletions && typeof value.pomodoroCompletions === 'object' ? value.pomodoroCompletions : {},
    pomodoroCategories: categories,
    pomodoroCategorySeconds: value.pomodoroCategorySeconds && typeof value.pomodoroCategorySeconds === 'object' ? value.pomodoroCategorySeconds : {},
    activePomodoroCategoryId,
    goal: Math.max(10, Math.min(480, Number(value.goal) || 60)),
    mode,
    duration: mode === 'long' ? Math.max(0, Math.ceil(pauseSeconds / 60)) : Math.max(1, Math.min(180, Number(value.duration) || defaultMinutes)),
    remaining,
    freeElapsed: Math.max(0, Number(value.freeElapsed) || 0),
    focusCommitted: Math.max(0, Number(value.focusCommitted) || 0),
    // The site only applies this guard once, on a legacy document (normalizeFreeStudy).
    // Here normalize runs on every read, so forcing it would stop «جبران بدهی» dead.
    running: !!value.running,
    endAt: Number(value.endAt) || 0,
    startedAt: Number(value.startedAt) || 0,
    startedDate: value.startedDate || '',
    pauseSeconds,
    pauseStartedAt: Math.max(0, Number(value.pauseStartedAt) || 0),
    debtBaseline: Math.max(pauseSeconds, Number(value.debtBaseline) || 0),
    cycleStarted: !!value.cycleStarted,
    note: String(value.note || '').slice(0, 5000),
    tab: value.tab === 'tasks' ? 'tasks' : 'daily',
  };
}
const readState = (ctx) => normalize(ctx.store.get('appSettings.freeStudy'));
const writeState = (ctx, state) => ctx.store.set('appSettings.freeStudy', state);

/* ─────────────── strings (site freeStudyCopy) ─────────────── */
function copy() {
  return {
    tag: L('میز مطالعه شخصی', 'PERSONAL STUDY DESK', 'PERSÖNLICHER LERNTISCH'),
    title: L('مطالعه آزاد', 'Free study', 'Freies Lernen'),
    desc: L('کارها، تمرکز و زمان مطالعه خارج از برنامه را در یک فضای آرام مدیریت کنید.', 'Manage independent tasks, focus and study time in one calm workspace.', 'Aufgaben, Fokus und freie Lernzeit in einem ruhigen Bereich verwalten.'),
    today: L('مطالعه امروز', 'Today', 'Heute gelernt'),
    tasks: L('کارها', 'Tasks', 'Aufgaben'),
    daily: L('روزانه', 'Daily', 'Täglich'),
    add: L('افزودن', 'Add', 'Hinzufügen'),
    placeholder: L('یک کار جدید بنویسید…', 'Write a new task…', 'Neue Aufgabe…'),
    all: L('همه کارها', 'All tasks', 'Alle Aufgaben'),
    empty: L('هنوز کاری در این فهرست نیست.', 'Nothing in this list yet.', 'Diese Liste ist noch leer.'),
    timer: L('فضای تمرکز', 'Focus space', 'Fokusraum'),
    timerHint: L('تایمر در پس‌زمینه و هنگام قفل صفحه هم دقیق می‌ماند.', 'The timer stays accurate in the background and while the screen is locked.', 'Der Timer bleibt im Hintergrund und bei gesperrtem Bildschirm genau.'),
    focus: L('پومودورو', 'Pomodoro', 'Pomodoro'),
    short: L('استراحت کوتاه', 'Short break', 'Kurze Pause'),
    long: L('جبران بدهی', 'Repay debt', 'Zeit nachholen'),
    free: L('تایمر آزاد', 'Free timer', 'Freier Timer'),
    start: L('شروع', 'Start', 'Start'),
    pause: L('توقف', 'Pause', 'Pause'),
    finish: L('ثبت و پایان', 'Save & finish', 'Speichern & beenden'),
    reset: L('بازنشانی', 'Reset', 'Zurücksetzen'),
    goal: L('هدف روزانه', 'Daily goal', 'Tagesziel'),
    note: L('یادداشت سریع', 'Quick note', 'Schnelle Notiz'),
    noteHint: L('ایده، منبع یا نکته‌ای که نباید فراموش شود…', 'An idea, resource or note to remember…', 'Idee, Quelle oder Notiz…'),
    week: L('ریتم هفت روز اخیر', 'Last 7 days', 'Letzte 7 Tage'),
    normal: L('عادی', 'Normal', 'Normal'),
    important: L('مهم', 'Important', 'Wichtig'),
    urgent: L('فوری', 'Urgent', 'Dringend'),
    once: L('کار عادی', 'One-time', 'Einmalig'),
    repeat: L('هر روز', 'Every day', 'Jeden Tag'),
    debt: L('بدهی زمان', 'Time debt', 'Zeitschuld'),
    outside: L('خارج از برنامه', 'Outside plan', 'Außerhalb des Plans'),
    full: L('تمام‌صفحه', 'Fullscreen', 'Vollbild'),
    exit: L('بازگشت', 'Back', 'Zurück'),
    addCat: L('افزودن فعالیت', 'Add activity', 'Aktivität hinzufügen'),
    catPlaceholder: L('مثلاً زبان یا پروژه', 'For example: language or project', 'Zum Beispiel: Sprache oder Projekt'),
    history: L('زمان مطالعه آزاد امروز', 'Today’s free-study time', 'Freie Lernzeit heute'),
  };
}

/* ─────────────── time helpers ─────────────── */
const studySeconds = (f, key = todayKey()) => Math.max(0, Number(f.sessions[key]) || 0);
function studyTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${pad2(m)}m` : `${m}m`;
}
function goalLabel(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return hours ? `${hours}h ${pad2(rest)}m` : `${rest}m`;
}
const clock = (seconds) => `${pad2(Math.floor(Math.max(0, seconds) / 60))}:${pad2(Math.max(0, seconds) % 60)}`;
// site freeStudyCurrentTime: wall clock in the timer head, latin digits
const currentTime = () => new Date().toLocaleTimeString('en-GB-u-nu-latn', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const pauseClock = (seconds) => (seconds >= 3600 ? `${pad2(Math.floor(seconds / 3600))}:${pad2(Math.floor((seconds % 3600) / 60))}:${pad2(seconds % 60)}` : clock(seconds));

const pauseSeconds = (f) => Math.max(0, Number(f.pauseSeconds) || 0) + (f.pauseStartedAt ? Math.max(0, Math.floor((Date.now() - f.pauseStartedAt) / 1000)) : 0);
const debtRemaining = (f) => (f.mode === 'long' && f.running && f.endAt ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000)) : pauseSeconds(f));
const debtPercent = (f) => {
  const remaining = debtRemaining(f);
  const baseline = Math.max(remaining, Number(f.debtBaseline) || 0, 1);
  return Math.max(0, Math.min(100, (remaining / baseline) * 100));
};
function timerClock(f) {
  const seconds = f.mode === 'free'
    ? Math.max(0, (Number(f.freeElapsed) || 0) + (f.running ? Math.floor((Date.now() - f.startedAt) / 1000) : 0))
    : f.running ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000)) : f.remaining;
  return clock(seconds);
}
function statusText(f, c) {
  if (f.mode === 'long') return `${c.long} · ${pauseClock(debtRemaining(f))}`;
  if (f.pauseStartedAt) return `${c.outside} · ${pauseClock(pauseSeconds(f))}`;
  if (f.pauseSeconds > 0) return `${c.debt} · ${pauseClock(pauseSeconds(f))}`;
  return f.mode === 'short' ? c.short : c.focus;
}
const activeCategory = (f) => f.pomodoroCategories.find((x) => x.id === f.activePomodoroCategoryId) || f.pomodoroCategories[0];
function commitCategory(f, seconds, key = todayKey()) {
  const amount = Math.max(0, Math.floor(Number(seconds) || 0));
  if (!amount) return;
  const id = activeCategory(f).id;
  const day = f.pomodoroCategorySeconds[key] && typeof f.pomodoroCategorySeconds[key] === 'object' ? f.pomodoroCategorySeconds[key] : (f.pomodoroCategorySeconds[key] = {});
  day[id] = Math.max(0, Number(day[id]) || 0) + amount;
}

/* ─────────────── timer transitions (site freeStudy*) ─────────────── */
function checkpoint(f) {
  if (!f.running) return 0;
  if (f.mode === 'free' && f.startedAt) {
    const elapsed = Math.max(0, Math.floor((Date.now() - f.startedAt) / 1000));
    f.freeElapsed = (Number(f.freeElapsed) || 0) + elapsed;
    f.startedAt = Date.now();
    f.startedDate = todayKey();
    return elapsed;
  }
  if (f.endAt) {
    const before = f.remaining;
    f.remaining = Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000));
    if (f.mode === 'long') f.pauseSeconds = f.remaining;
    return Math.max(0, before - f.remaining);
  }
  return 0;
}
function persistCheckpoint(f) {
  const key = f.startedDate || todayKey();
  if (f.mode === 'free' || f.mode === 'long') { checkpoint(f); return; }
  if (f.mode === 'focus') {
    if (f.running) checkpoint(f);
    const elapsed = Math.max(0, f.duration * 60 - f.remaining);
    const uncommitted = Math.max(0, elapsed - (Number(f.focusCommitted) || 0));
    if (uncommitted) {
      f.sessions[key] = (Number(f.sessions[key]) || 0) + uncommitted;
      commitCategory(f, uncommitted, key);
    }
    f.focusCommitted = elapsed;
    f.startedDate = todayKey();
  }
}

/* ─────────────── markup ─────────────── */
function tasksHtml(f, c) {
  const daily = f.tab === 'daily';
  const done = (task) => (task.daily ? (task.completedDates || []).includes(todayKey()) : !!task.completed);
  const list = f.tasks.filter((x) => !!x.daily === daily);
  return `<section class="free-study-card">
    <div class="free-study-card-head"><div><h2>✓ ${esc(c.tasks)}</h2><p>${esc(c.all)}</p></div>
      <div class="free-study-tabs"><button type="button" class="${daily ? 'is-active' : ''}" data-fs="tab:daily">↻ ${esc(c.daily)}</button><button type="button" class="${daily ? '' : 'is-active'}" data-fs="tab:tasks">${esc(c.once)}</button></div></div>
    <div class="free-task-entry"><input data-fs="task-input" maxlength="240" placeholder="${esc(c.placeholder)}" /><select data-fs="task-priority"><option value="normal">${esc(c.normal)}</option><option value="important">${esc(c.important)}</option><option value="urgent">${esc(c.urgent)}</option></select><button type="button" data-fs="task-add" title="${esc(c.add)}">＋</button></div>
    <div class="free-task-list">${list.length ? list.map((task) => `<article class="free-task ${done(task) ? 'is-done' : ''}"><button type="button" class="free-task-check" data-fs="task-toggle:${esc(task.id)}" aria-pressed="${done(task)}">✓</button><div><b>${esc(task.text)}</b><small>${task.daily ? '↻ ' + esc(c.repeat) : esc(c.once)} · ${task.priority === 'urgent' ? '● ' + esc(c.urgent) : task.priority === 'important' ? '● ' + esc(c.important) : esc(c.normal)}</small></div><button type="button" class="free-task-delete" data-fs="task-del:${esc(task.id)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button></article>`).join('') : `<div class="free-empty">${esc(c.empty)}</div>`}</div>
  </section>`;
}

function timerHtml(f, c) {
  const todaySeconds = studySeconds(f);
  const goalPct = Math.min(100, Math.round((todaySeconds / Math.max(1, f.goal * 60)) * 100));
  const total = Math.max(1, f.duration * 60);
  const remaining = f.mode === 'free' ? 0 : f.running ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000)) : f.remaining;
  const pct = f.mode === 'free' ? (f.running ? Math.min(100, (Date.now() - f.startedAt) / 36000) : 0) : Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  const cat = activeCategory(f);
  const options = f.pomodoroCategories.map((x) => `<option value="${esc(x.id)}" ${x.id === cat.id ? 'selected' : ''}>${esc(T(x.label))}</option>`).join('');
  const day = f.pomodoroCategorySeconds[todayKey()] || {};
  const ringAction = f.running ? L('توقف تایمر', 'Pause timer', 'Timer anhalten') : L('شروع تایمر', 'Start timer', 'Timer starten');
  return `<aside class="free-study-card free-timer" data-fs="timer">
    <div class="free-study-card-head"><div><h2>◉ ${esc(c.timer)}</h2><p>${esc(c.timerHint)}</p><time class="free-current-time" data-fs="now">${currentTime()}</time></div><button type="button" class="free-focus-btn" data-fs="full" title="${esc(c.full)}" aria-label="${esc(c.full)}">⛶</button></div>
    <div class="free-timer-modes">${[['focus', c.focus], ['short', c.short], ['long', c.long], ['free', c.free]].map(([id, label]) => `<button type="button" class="${f.mode === id ? 'is-active' : ''}" data-fs="mode:${id}">${esc(label)}</button>`).join('')}</div>
    <div class="free-timer-ring${f.running ? ' is-running' : ''}" style="--progress:${(f.mode === 'long' ? debtPercent(f) : pct) * 3.6}deg" data-fs="ring" role="button" tabindex="0" aria-label="${esc(ringAction)}" title="${esc(ringAction)}"><div><strong data-fs="clock">${timerClock(f)}</strong><span data-fs="status" class="${f.pauseStartedAt || f.pauseSeconds > 0 ? 'is-outside-plan' : ''}">${esc(statusText(f, c))}</span></div></div>
    <div class="free-timer-actions"><button type="button" class="primary" data-fs="toggle">${f.running ? 'Ⅱ ' + esc(c.pause) : '▶ ' + esc(c.start)}</button><button type="button" data-fs="finish">✓ ${esc(c.finish)}</button><button type="button" class="free-kiosk-exit" data-fs="full">← ${esc(c.exit)}</button><button type="button" data-fs="reset">↺ ${esc(c.reset)}</button></div>
    <div class="free-focus-category" style="--category-color:${esc(cat.color || '#8b5cf6')}"><button type="button" data-fs="cat-remove" title="−" aria-label="${esc(L('حذف فعالیت', 'Remove activity', 'Aktivität entfernen'))}">−</button><select data-fs="cat-select" aria-label="${esc(L('فعالیت تمرکز', 'Focus activity', 'Fokusaktivität'))}">${options}</select><button type="button" data-fs="cat-add" title="+">+</button></div>
    <div class="free-goal"><div><span>${esc(c.goal)}</span><b data-fs="goal-label">${esc(goalLabel(Math.round(todaySeconds / 60)))} / ${esc(goalLabel(f.goal))}</b></div><div class="free-goal-track"><i data-fs="goal-bar" style="width:${goalPct}%"></i></div><input data-fs="goal" aria-label="${esc(c.goal)}" type="range" min="10" max="480" step="10" value="${f.goal}" /></div>
    <div class="free-debt-panel ${debtRemaining(f) ? '' : 'is-clear'}"><div class="free-debt-head"><span>${esc(c.debt)}</span><b data-fs="debt-clock">${pauseClock(debtRemaining(f))}</b></div><div class="free-debt-track"><i data-fs="debt-bar" style="width:${debtPercent(f)}%"></i></div></div>
    <div class="free-category-summary">${f.pomodoroCategories.map((x) => `<span class="free-category-stat" style="--category-color:${esc(x.color || '#8b5cf6')}"><i></i><span>${esc(T(x.label))}</span><b>${studyTime(Number(day[x.id]) || 0)}</b></span>`).join('')}</div>
  </aside>`;
}

function weekHtml(f, c) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dateKey(d);
    let label = '';
    const uiLang = lang() === 'fa' ? 'fa' : lang() === 'de' ? 'de' : 'en';
    try { label = d.toLocaleDateString(uiLang, { weekday: 'short' }); } catch { label = key.slice(5); }
    return { key, label, value: Number(f.sessions[key]) || 0 };
  });
  const max = Math.max(1800, ...days.map((x) => x.value));
  return `<section class="free-study-card"><div class="free-study-card-head"><div><h2>▥ ${esc(c.week)}</h2></div></div>
    <div class="free-week">${days.map((x) => `<label><b>${Math.round(x.value / 60)}m</b><i style="height:${Math.max(4, (x.value / max) * 72)}px"></i><span>${esc(x.label)}</span></label>`).join('')}</div></section>`;
}

export function freeStudyHtml(ctx) {
  const f = readState(ctx);
  const c = copy();
  return `<section class="free-study-page free-study-embedded" data-fs-host>
    <div class="free-study-shell">
      <header class="free-study-hero"><div><small>✦ ${esc(c.tag)}</small><h1>${esc(c.title)}</h1><p>${esc(c.desc)}</p></div><div class="free-study-today"><b data-fs="today-time">${studyTime(studySeconds(f))}</b><span>${esc(c.today)}</span></div></header>
      <div class="free-study-grid">
        ${tasksHtml(f, c)}
        ${timerHtml(f, c)}
        <section class="free-study-card"><div class="free-study-card-head"><div><h2>✎ ${esc(c.note)}</h2></div></div><textarea class="free-note-area" data-fs="note" placeholder="${esc(c.noteHint)}">${esc(f.note)}</textarea></section>
        ${weekHtml(f, c)}
      </div>
    </div>
  </section>`;
}

/* ─────────────── live numbers (no re-render while the timer runs) ─────────────── */
function refreshNumbers(host, ctx) {
  if (!host || !host.isConnected) return;
  const f = readState(ctx);
  const c = copy();
  const todaySeconds = studySeconds(f);
  const total = Math.max(1, f.duration * 60);
  const remaining = f.mode === 'free' ? 0 : f.running ? Math.max(0, Math.ceil((f.endAt - Date.now()) / 1000)) : f.remaining;
  const pct = f.mode === 'free' ? (f.running ? Math.min(100, (Date.now() - f.startedAt) / 36000) : 0) : Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
  const set = (name, value) => { const el = host.querySelector(`[data-fs="${name}"]`); if (el) el.textContent = value; };
  set('clock', timerClock(f));
  set('now', currentTime());
  set('today-time', studyTime(todaySeconds));
  set('status', statusText(f, c));
  set('debt-clock', pauseClock(debtRemaining(f)));
  set('goal-label', `${goalLabel(Math.round(todaySeconds / 60))} / ${goalLabel(f.goal)}`);
  const status = host.querySelector('[data-fs="status"]');
  if (status) status.classList.toggle('is-outside-plan', !!(f.pauseStartedAt || f.pauseSeconds > 0));
  const ring = host.querySelector('[data-fs="ring"]');
  if (ring) ring.style.setProperty('--progress', `${(f.mode === 'long' ? debtPercent(f) : pct) * 3.6}deg`);
  const bar = host.querySelector('[data-fs="goal-bar"]');
  if (bar) bar.style.width = `${Math.min(100, Math.round((todaySeconds / Math.max(1, f.goal * 60)) * 100))}%`;
  const debtBar = host.querySelector('[data-fs="debt-bar"]');
  if (debtBar) debtBar.style.width = `${debtPercent(f)}%`;
  const debtPanel = host.querySelector('.free-debt-panel');
  if (debtPanel) debtPanel.classList.toggle('is-clear', !debtRemaining(f));
}

/* ─────────────── the one app-level ticker ─────────────── */
const live = { ctx: null, host: null, paint: null, timer: null };

function tick() {
  const { ctx, host } = live;
  const paint = live.host && live.host.isConnected ? live.paint : null;
  if (!ctx || !ctx.store.ready) return;
  const f = readState(ctx);
  if (!f.running) {
    refreshNumbers(host, ctx);
    return;
  }
  // a session that began yesterday is banked before it rolls on
  if (f.startedDate && f.startedDate !== todayKey()) {
    persistCheckpoint(f);
    writeState(ctx, f);
  }
  if (f.mode !== 'free' && f.endAt && Date.now() >= f.endAt) {
    if (f.mode === 'focus') {
      const uncommitted = Math.max(0, f.duration * 60 - (Number(f.focusCommitted) || 0));
      const key = f.startedDate || todayKey();
      if (uncommitted) {
        f.sessions[key] = (Number(f.sessions[key]) || 0) + uncommitted;
        commitCategory(f, uncommitted, key);
      }
      if (Number(f.duration) === 25) f.pomodoroCompletions[key] = Math.max(0, Number(f.pomodoroCompletions[key]) || 0) + 1;
      f.focusCommitted = 0;
      f.mode = 'short';
      f.duration = 5;
      f.remaining = 300;
    } else if (f.mode === 'short') {
      f.mode = 'focus';
      f.duration = 25;
      f.remaining = 1500;
    } else if (f.mode === 'long') {
      f.pauseSeconds = 0;
      f.remaining = 0;
      f.debtBaseline = 0;
      f.running = false;
      f.endAt = 0;
      writeState(ctx, f);
      if (paint) paint();
      return;
    } else {
      f.remaining = 0;
      f.running = false;
      f.endAt = 0;
      writeState(ctx, f);
      if (paint) paint();
      return;
    }
    f.startedAt = Date.now();
    f.startedDate = todayKey();
    f.endAt = Date.now() + f.remaining * 1000;
    writeState(ctx, f);
    if (paint) paint();
    return;
  }
  refreshNumbers(host, ctx);
}

function ensureTicker() {
  if (live.timer) return;
  live.timer = setInterval(tick, 1000);
}

/* ─────────────── behaviour ─────────────── */
function addTask(ctx, paint) {
  const host = live.host;
  const field = host && host.querySelector('[data-fs="task-input"]');
  const priority = host && host.querySelector('[data-fs="task-priority"]');
  const text = field && field.value.trim();
  if (!text) { if (field) field.focus(); return; }
  const f = readState(ctx);
  f.tasks.unshift({
    id: 'fst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    text: text.slice(0, 240),
    priority: (priority && priority.value) || 'normal',
    daily: f.tab === 'daily',
    createdAt: new Date().toISOString(),
    completed: false,
    completedDates: [],
  });
  writeState(ctx, f);
  paint();
}

function setMode(ctx, mode, paint) {
  const f = readState(ctx);
  persistCheckpoint(f);
  if (f.pauseStartedAt) {
    f.pauseSeconds = pauseSeconds(f);
    f.pauseStartedAt = 0;
  }
  f.mode = mode;
  f.running = false;
  f.endAt = 0;
  f.startedAt = 0;
  f.freeElapsed = 0;
  f.focusCommitted = 0;
  const minutes = mode === 'focus' ? 25 : mode === 'short' ? 5 : mode === 'long' ? Math.ceil(f.pauseSeconds / 60) : 25;
  f.duration = minutes;
  f.remaining = mode === 'long' ? Math.max(0, f.pauseSeconds) : minutes * 60;
  if (mode === 'long') f.debtBaseline = Math.max(Number(f.debtBaseline) || 0, f.pauseSeconds);
  writeState(ctx, f);
  paint();
}

function toggleTimer(ctx, paint) {
  const f = readState(ctx);
  const now = Date.now();
  if (f.running) {
    checkpoint(f);
    f.running = false;
    f.endAt = 0;
    if ((f.mode === 'focus' || f.mode === 'short') && f.cycleStarted && !f.pauseStartedAt) f.pauseStartedAt = now;
  } else {
    if (f.pauseStartedAt) {
      f.pauseSeconds = pauseSeconds(f);
      f.pauseStartedAt = 0;
    }
    if (f.mode === 'long') {
      f.remaining = Math.max(0, f.pauseSeconds);
      f.duration = Math.ceil(f.remaining / 60);
      f.debtBaseline = Math.max(Number(f.debtBaseline) || 0, f.remaining);
      if (!f.remaining) { writeState(ctx, f); paint(); return; }
    }
    f.running = true;
    f.cycleStarted = f.cycleStarted || f.mode === 'focus' || f.mode === 'short';
    f.startedAt = now;
    f.startedDate = f.startedDate || todayKey();
    if (f.mode !== 'free') f.endAt = now + Math.max(1, f.remaining) * 1000;
  }
  writeState(ctx, f);
  paint();
}

function finishTimer(ctx, paint) {
  const f = readState(ctx);
  checkpoint(f);
  if (f.mode === 'focus') {
    const elapsed = Math.max(0, f.duration * 60 - f.remaining);
    const uncommitted = Math.max(0, elapsed - (Number(f.focusCommitted) || 0));
    if (uncommitted >= 1) {
      f.sessions[todayKey()] = (Number(f.sessions[todayKey()]) || 0) + uncommitted;
      commitCategory(f, uncommitted, todayKey());
    }
  }
  if (f.pauseStartedAt) {
    f.pauseSeconds = pauseSeconds(f);
    f.pauseStartedAt = 0;
  }
  f.running = false;
  f.cycleStarted = false;
  f.endAt = 0;
  f.startedAt = 0;
  f.remaining = f.mode === 'long' ? Math.max(0, f.pauseSeconds) : f.duration * 60;
  f.freeElapsed = 0;
  f.focusCommitted = 0;
  writeState(ctx, f);
  ctx.store.flush().catch(() => {});
  paint();
}

// The site resets at once (freeStudyReset) — no confirmation, otherwise the two differ.
function resetTimer(ctx, paint) {
  const f = readState(ctx);
  const key = todayKey();
  f.running = false;
  f.cycleStarted = false;
  f.endAt = 0;
  f.startedAt = 0;
  f.startedDate = '';
  f.mode = 'focus';
  f.duration = 25;
  f.remaining = 25 * 60;
  f.freeElapsed = 0;
  f.focusCommitted = 0;
  f.pauseSeconds = 0;
  f.pauseStartedAt = 0;
  f.debtBaseline = 0;
  delete f.sessions[key];
  delete f.pomodoroCompletions[key];
  delete f.pomodoroCategorySeconds[key];
  writeState(ctx, f);
  ctx.store.flush().catch(() => {});
  paint();
}

/* ─────────────── focus mode (site freeStudyToggleFullscreen / freeStudyIsFullscreen) ─────────────── */
function timerCard() { return document.querySelector('.free-timer'); }
function isFocusMode() {
  const card = timerCard();
  return !!card && (document.fullscreenElement === card || card.classList.contains('free-focus-fallback'));
}
function setFocusClasses(card, on) {
  if (!card) return;
  card.classList.toggle('is-focus', on);
  document.documentElement.toggleAttribute('data-fs-focus', on);
  document.body.style.overflow = on ? 'hidden' : '';
}
async function exitFocus() {
  const card = timerCard();
  try {
    if ((document.fullscreenElement) && document.exitFullscreen) await document.exitFullscreen();
  } catch { /* ignore */ }
  if (card) card.classList.remove('free-focus-fallback');
  setFocusClasses(card, false);
  if (card) card.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
async function toggleFullscreen(section) {
  const card = (section && section.querySelector('[data-fs="timer"]')) || timerCard();
  if (!card) return;
  if (isFocusMode()) { await exitFocus(); return; }
  let native = false;
  try {
    const request = card.requestFullscreen || card.webkitRequestFullscreen;
    if (request) { await request.call(card); native = document.fullscreenElement === card; }
  } catch { native = false; }
  if (!native) card.classList.add('free-focus-fallback');
  setFocusClasses(card, true);
  card.scrollIntoView({ block: 'center' });
}

/* ─────────────── mount ─────────────── */
let fsListenerBound = false;

/** Replaces the desk in place (keeps the library page and its scroll untouched). */
function renderSection(host, ctx, repaint) {
  if (!host.isConnected) { if (repaint) repaint(); return; }
  // In focus mode (native fullscreen or the kiosk fallback) only the timer card is rebuilt,
  // exactly like the site's freeStudyRefreshFocus — the library page stays untouched.
  const focused = host.querySelector('[data-fs="timer"]');
  if (focused && (document.fullscreenElement === focused || focused.classList.contains('free-focus-fallback'))) {
    const box = document.createElement('div');
    box.innerHTML = freeStudyHtml(ctx);
    const next = box.querySelector('[data-fs="timer"]');
    if (next) {
      focused.innerHTML = next.innerHTML;
      focused.className = next.className;
      setFocusClasses(focused, true);
    }
    refreshNumbers(host, ctx);
    return;
  }
  const box = document.createElement('div');
  box.innerHTML = freeStudyHtml(ctx);
  const next = box.firstElementChild;
  const parent = host.parentNode;
  host.replaceWith(next);
  if (next) mountFreeStudy(next, ctx, repaint);
  else if (parent && repaint) repaint();
}

/**
 * Wires the desk inside `host` (the `.free-study-page` section).
 * `repaint` rebuilds the library page; the desk repaints only itself after a change.
 */
export function mountFreeStudy(host, ctx, repaint) {
  if (!host) return;
  live.ctx = ctx;
  live.host = host;
  const paint = () => renderSection(host, ctx, repaint);
  live.paint = paint;
  live.repaint = repaint;
  ensureTicker();
  refreshNumbers(host, ctx);

  const section = host;
  let noteTimer = null;
  const onClick = async (event) => {
    // site: the whole ring starts/stops the timer in focus mode — its clock/status
    // children carry their own data-fs, so resolve the ring before anything else.
    const ringHit = event.target.closest && event.target.closest('[data-fs="ring"]');
    if (ringHit && isFocusMode()) { toggleTimer(ctx, paint); return; }
    const el = event.target.closest('[data-fs]');
    if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
    const action = el.dataset.fs;
    if (action.startsWith('tab:')) {
      const f = readState(ctx); f.tab = action.slice(4); writeState(ctx, f); paint(); return;
    }
    if (action === 'task-add') { addTask(ctx, paint); return; }
    if (action.startsWith('task-toggle:')) {
      const f = readState(ctx);
      const task = f.tasks.find((x) => x.id === action.slice(12));
      if (!task) return;
      if (task.daily) {
        const list = Array.isArray(task.completedDates) ? task.completedDates : [];
        task.completedDates = list.includes(todayKey()) ? list.filter((x) => x !== todayKey()) : [...list, todayKey()].slice(-120);
      } else task.completed = !task.completed;
      writeState(ctx, f); paint(); return;
    }
    if (action.startsWith('task-del:')) {
      const f = readState(ctx);
      f.tasks = f.tasks.filter((x) => x.id !== action.slice(9));
      writeState(ctx, f); paint(); return;
    }
    if (action.startsWith('mode:')) { setMode(ctx, action.slice(5), paint); return; }
    if (action === 'toggle') { toggleTimer(ctx, paint); return; }
    if (action === 'ring') return; // handled above (focus mode only)
    if (action === 'finish') { finishTimer(ctx, paint); return; }
    if (action === 'reset') { resetTimer(ctx, paint); return; }
    if (action === 'full') { toggleFullscreen(section); return; }
    if (action === 'cat-add') {
      const label = await promptDialog({ title: copy().addCat, placeholder: copy().catPlaceholder, icon: '＋', maxLength: 32 });
      if (!label) return;
      const f = readState(ctx);
      if (f.pomodoroCategories.length >= 12) return;
      const id = 'focus_' + Date.now().toString(36);
      f.pomodoroCategories.push({ id, label: label.slice(0, 32), color: COLORS[f.pomodoroCategories.length % COLORS.length] });
      f.activePomodoroCategoryId = id;
      writeState(ctx, f); paint(); return;
    }
    if (action === 'cat-remove') {
      const f = readState(ctx);
      if (f.pomodoroCategories.length <= 1) return;
      if (f.mode === 'focus') persistCheckpoint(f);
      const active = activeCategory(f);
      f.pomodoroCategories = f.pomodoroCategories.filter((x) => x.id !== active.id);
      f.activePomodoroCategoryId = f.pomodoroCategories[0].id;
      writeState(ctx, f); paint();
    }
  };
  const onChange = (event) => {
    const el = event.target.closest('[data-fs]');
    if (!el) return;
    const action = el.dataset.fs;
    if (action === 'goal') {
      const f = readState(ctx);
      f.goal = Math.max(10, Math.min(480, Number(el.value) || 60));
      writeState(ctx, f); refreshNumbers(host, ctx); return;
    }
    if (action === 'cat-select') {
      const f = readState(ctx);
      if (!f.pomodoroCategories.some((x) => x.id === el.value)) return;
      if (f.mode === 'focus' && f.activePomodoroCategoryId !== el.value) persistCheckpoint(f);
      f.activePomodoroCategoryId = el.value;
      writeState(ctx, f); paint();
    }
  };
  const onInput = (event) => {
    const el = event.target.closest('[data-fs]');
    if (!el) return;
    if (el.dataset.fs === 'note') {
      const value = String(el.value || '').slice(0, 5000);
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        const f = readState(ctx);
        f.note = value;
        writeState(ctx, f);
      }, 400);
    }
  };
  const onKey = (event) => {
    const el = event.target.closest('[data-fs="task-input"]');
    if (el && event.key === 'Enter') { event.preventDefault(); addTask(ctx, paint); }
    if (event.key === 'Escape' && isFocusMode()) { event.preventDefault(); exitFocus(); return; }
    const ring = event.target.closest('[data-fs="ring"]');
    if (ring && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); if (isFocusMode()) toggleTimer(ctx, paint); }
  };
  section.addEventListener('click', onClick);
  section.addEventListener('change', onChange);
  section.addEventListener('input', onInput);
  section.addEventListener('keydown', onKey);
  if (!fsListenerBound) {
    fsListenerBound = true;
    document.addEventListener('fullscreenchange', () => {
      const card = timerCard();
      if (!card) return;
      if (document.fullscreenElement === card) { setFocusClasses(card, true); return; }
      card.classList.remove('free-focus-fallback');
      setFocusClasses(card, false);
    });
  }
}

/** Site freeStudyPersistCheckpoint: bank what the running timer has earned (before refresh/exit). */
export function persistFreeStudy(ctx) {
  if (!ctx || !ctx.store || !ctx.store.ready) return;
  const f = readState(ctx);
  if (!f.running && !f.pauseStartedAt) return;
  persistCheckpoint(f);
  writeState(ctx, f);
}
