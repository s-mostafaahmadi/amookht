'use strict';

/* Amookht desktop widget v3: the account's to-do list and quick notes.
   Same account as the Windows app (all calls go through the main process). */

const bridge = window.amookht;
const $ = (selector) => document.querySelector(selector);

const TEXTS = {
  fa: {
    dir: 'rtl', todos: 'کارها', notes: 'یادداشت‌ها', open: (n) => `${n.toLocaleString('fa-IR')} باز`,
    notesCount: (n) => `${n.toLocaleString('fa-IR')} یادداشت`, add: 'افزودن', cancel: 'انصراف',
    todoPlaceholder: 'کار تازه…', notePlaceholder: 'عنوان یادداشت', noteBody: 'متن (اختیاری)',
    emptyTodos: 'کاری ثبت نشده. با + یک کار اضافه کنید.', emptyNotes: 'یادداشتی نیست.',
    premiumNotes: 'یادداشت‌ها ویژهٔ حساب Premium است.', signedOut: 'برای دیدن کارها، در برنامهٔ آموخت وارد شوید.',
    openApp: 'باز کردن آموخت', logout: 'خروج از حساب', logoutConfirm: 'از حساب آموخت خارج می‌شوید (برنامه و ویجت). مطمئنید؟',
    pin: 'همیشه رو', unpin: 'برداشتن از رو', addTip: 'افزودن', refresh: 'بازخوانی', close: 'بستن ویجت',
    offline: 'بدون اتصال — آخرین نسخهٔ ذخیره‌شده', failed: 'انجام نشد', del: 'حذف',
  },
  en: {
    dir: 'ltr', todos: 'Tasks', notes: 'Notes', open: (n) => `${n} open`, notesCount: (n) => `${n} notes`,
    add: 'Add', cancel: 'Cancel', todoPlaceholder: 'New task…', notePlaceholder: 'Note title', noteBody: 'Text (optional)',
    emptyTodos: 'No tasks yet. Add one with +.', emptyNotes: 'No notes.', premiumNotes: 'Notes need a Premium account.',
    signedOut: 'Sign in to the Amookht app to see your tasks.', openApp: 'Open Amookht', logout: 'Sign out',
    logoutConfirm: 'This signs you out of Amookht (app and widget). Continue?', pin: 'Always on top', unpin: 'Not on top',
    addTip: 'Add', refresh: 'Refresh', close: 'Close widget', offline: 'Offline — last saved copy', failed: 'Failed', del: 'Delete',
  },
};
TEXTS.de = {
  ...TEXTS.en, todos: 'Aufgaben', notes: 'Notizen', open: (n) => `${n} offen`, notesCount: (n) => `${n} Notizen`,
  add: 'Hinzufügen', cancel: 'Abbrechen', todoPlaceholder: 'Neue Aufgabe…', notePlaceholder: 'Titel der Notiz',
  noteBody: 'Text (optional)', emptyTodos: 'Keine Aufgaben. Mit + hinzufügen.', emptyNotes: 'Keine Notizen.',
  premiumNotes: 'Notizen gibt es mit Premium.', signedOut: 'Melde dich in der Amookht-App an.', openApp: 'Amookht öffnen',
  logout: 'Abmelden', logoutConfirm: 'Von Amookht abmelden (App und Widget)?', pin: 'Immer im Vordergrund',
  unpin: 'Nicht im Vordergrund', addTip: 'Hinzufügen', refresh: 'Aktualisieren', close: 'Widget schließen',
  offline: 'Offline — letzte Kopie', failed: 'Fehlgeschlagen', del: 'Löschen',
};

const state = {
  lang: 'fa',
  tab: 'todos',
  data: null,
  signedIn: false,
  loading: false,
  settings: null,
  timer: null,
  busy: new Set(),
};

const t = (key, ...args) => {
  const value = (TEXTS[state.lang] || TEXTS.fa)[key];
  return typeof value === 'function' ? value(...args) : value;
};
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CHECK = '<svg viewBox="0 0 24 24"><path d="m9 16.2-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>';

/* ─────────────────────────── look ─────────────────────────── */

function applySettings(settings) {
  if (!settings) return;
  state.settings = settings;
  state.lang = TEXTS[settings.lang] ? settings.lang : 'fa';
  const theme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = state.lang;
  document.documentElement.dir = t('dir');
  $('#tab-todos').textContent = t('todos');
  $('#tab-notes').textContent = t('notes');
  $('#btn-logout').textContent = t('logout');
  $('#add-submit').textContent = t('add');
  $('#add-cancel').textContent = t('cancel');
  $('#add-content').placeholder = t('noteBody');
  $('#btn-add').title = t('addTip');
  $('#btn-refresh').title = t('refresh');
  $('#btn-close').title = t('close');
  const pinned = !!settings.widgetAlwaysOnTop;
  $('#btn-pin').setAttribute('aria-pressed', String(pinned));
  $('#btn-pin').title = pinned ? t('unpin') : t('pin');
  scheduleRefresh();
  render();
}

/* ─────────────────────────── data ─────────────────────────── */

function setStatus(text, error = false) {
  const node = $('#w-status');
  node.textContent = text || '';
  node.classList.toggle('is-error', !!error);
}

function take(result) {
  state.signedIn = !!(result && result.hasSession);
  if (result && result.data) state.data = result.data;
  if (result && !result.ok) {
    const code = result.error && result.error.code;
    if (code === 'network_error' || code === 'timeout') setStatus(t('offline'), true);
    else if (code !== 'no_session' && code !== 'session_expired') setStatus((result.error && result.error.message) || t('failed'), true);
    else setStatus('');
  } else {
    setStatus('');
  }
  render();
  return !!(result && result.ok);
}

async function load() {
  if (state.loading) return;
  state.loading = true;
  $('#btn-refresh').classList.add('is-spinning');
  try {
    take(await bridge.load());
  } finally {
    state.loading = false;
    $('#btn-refresh').classList.remove('is-spinning');
  }
}

function scheduleRefresh() {
  if (state.timer) clearInterval(state.timer);
  const seconds = Math.max(15, Number(state.settings && state.settings.autoRefreshSeconds) || 60);
  state.timer = setInterval(() => {
    if (!document.hidden) load();
  }, seconds * 1000);
}

/* ─────────────────────────── render ─────────────────────────── */

function render() {
  const data = state.data || {};
  const todos = Array.isArray(data.todos) ? data.todos : [];
  const notes = Array.isArray(data.notes) ? data.notes : [];
  document.querySelectorAll('.w-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === state.tab));
  $('#w-title').textContent = state.tab === 'todos' ? t('todos') : t('notes');
  $('#btn-add').hidden = !state.signedIn;
  $('#btn-logout').hidden = !state.signedIn;

  const list = $('#w-list');
  const empty = $('#w-empty');

  if (!state.signedIn) {
    list.innerHTML = '';
    empty.hidden = false;
    empty.innerHTML = `${esc(t('signedOut'))}<br><button class="w-btn w-btn-primary" type="button" data-act="open-app">${esc(t('openApp'))}</button>`;
    $('#w-count').textContent = '';
    return;
  }

  if (state.tab === 'todos') {
    const open = todos.filter((item) => !item.done).length;
    $('#w-count').textContent = t('open', open);
    list.innerHTML = todos
      .map((item) => `<li class="w-row${item.done ? ' is-done' : ''}${state.busy.has(item.id) ? ' is-busy' : ''}" data-id="${esc(item.id)}">
          <button class="w-check" type="button" data-act="toggle" aria-pressed="${item.done ? 'true' : 'false'}">${CHECK}</button>
          <span class="w-text">${esc(item.title)}</span>
          <button class="w-del" type="button" data-act="delete" title="${esc(t('del'))}">${CROSS}</button>
        </li>`)
      .join('');
    empty.hidden = todos.length > 0;
    empty.textContent = t('emptyTodos');
  } else {
    $('#w-count').textContent = t('notesCount', notes.length);
    list.innerHTML = notes
      .map((note) => `<li class="w-note" data-act="open-library" title="${esc(note.title)}"><b>${esc(note.title || '—')}</b>${note.preview ? `<small>${esc(note.preview)}</small>` : ''}</li>`)
      .join('');
    empty.hidden = notes.length > 0;
    empty.textContent = data.premium === false ? t('premiumNotes') : t('emptyNotes');
  }
}

/* ─────────────────────────── actions ─────────────────────────── */

function openAdd() {
  if (!state.signedIn) return;
  const form = $('#add-form');
  const isNote = state.tab === 'notes';
  if (isNote && state.data && state.data.premium === false) {
    setStatus(t('premiumNotes'), true);
    return;
  }
  form.hidden = false;
  $('#add-title').placeholder = isNote ? t('notePlaceholder') : t('todoPlaceholder');
  $('#add-content').hidden = !isNote;
  $('#add-title').value = '';
  $('#add-content').value = '';
  $('#w-body').scrollTop = 0;
  $('#add-title').focus();
}

function closeAdd() {
  $('#add-form').hidden = true;
}

async function withBusy(id, job) {
  state.busy.add(id);
  render();
  try {
    take(await job());
  } finally {
    state.busy.delete(id);
    render();
  }
}

async function toggleTodo(id) {
  const item = (state.data && state.data.todos || []).find((todo) => todo.id === id);
  if (!item) return;
  // Optimistic: flip now, the server answer replaces it.
  item.done = !item.done;
  await withBusy(id, () => bridge.toggleTodo(id, item.done));
}

async function deleteTodo(id) {
  const data = state.data || {};
  const before = data.todos || [];
  data.todos = before.filter((todo) => todo.id !== id);
  render();
  const result = await bridge.deleteTodo(id);
  if (!take(result) && !(result && result.data)) {
    data.todos = before;
    render();
  }
}

document.addEventListener('click', async (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    closeAdd();
    render();
    return;
  }
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const row = event.target.closest('[data-id]');
  switch (el.dataset.act) {
    case 'close':
      bridge.hide();
      break;
    case 'refresh':
      load();
      break;
    case 'add':
      if ($('#add-form').hidden) openAdd();
      else closeAdd();
      break;
    case 'add-cancel':
      closeAdd();
      break;
    case 'pin': {
      const next = !(state.settings && state.settings.widgetAlwaysOnTop);
      applySettings(await bridge.setPinned(next));
      break;
    }
    case 'toggle':
      if (row) toggleTodo(row.dataset.id);
      break;
    case 'delete':
      if (row) deleteTodo(row.dataset.id);
      break;
    case 'open-library':
      bridge.openSection('library');
      break;
    case 'open-app':
      bridge.showApp();
      break;
    case 'logout':
      if (window.confirm(t('logoutConfirm'))) {
        await bridge.logout();
        state.data = null;
        state.signedIn = false;
        render();
      }
      break;
    default:
      break;
  }
});

// Double-click a task to toggle it, like a desktop to-do list.
document.addEventListener('dblclick', (event) => {
  const row = event.target.closest('.w-row[data-id]');
  if (row && !event.target.closest('button')) toggleTodo(row.dataset.id);
});

$('#add-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = $('#add-title').value.trim();
  if (!title) return;
  const submit = $('#add-submit');
  submit.disabled = true;
  try {
    const result = state.tab === 'notes'
      ? await bridge.addNote(title, $('#add-content').value)
      : await bridge.addTodo(title);
    if (take(result)) closeAdd();
  } finally {
    submit.disabled = false;
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#add-form').hidden) closeAdd();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    openAdd();
  }
  if (event.key === 'F5') {
    event.preventDefault();
    load();
  }
});

/* ─────────────────────────── boot ─────────────────────────── */

async function boot() {
  const info = await bridge.getSettings();
  state.signedIn = !!info.hasSession;
  applySettings({ ...info.settings });
  bridge.onSettingsChanged((settings) => applySettings(settings));
  bridge.onSessionChanged((next) => {
    const was = state.signedIn;
    state.signedIn = !!(next && next.hasSession);
    if (!state.signedIn) state.data = null;
    render();
    if (state.signedIn && !was) load();
  });
  bridge.onRefresh(() => load());
  bridge.onTick(() => {});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applySettings(state.settings));
  render();
  if (state.signedIn) load();
}

boot();
