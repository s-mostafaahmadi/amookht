/* Deutsch Coach v3 — runs at learn.tah3in.com/coach/ for Amookht premium accounts. */
const $ = (selector) => document.querySelector(selector);
const conversation = $('#conversation');
const input = $('#messageInput');
const send = $('#sendBtn');
const TOKEN_KEY = 'amookht_tokens';
const IMPORT_KEY = 'dc_pending_import';
const MISTAKE_TYPES = new Set(['grammar', 'vocabulary', 'sentence_structure', 'naturalness']);

const state = { me: null, coachId: 'current', coaches: [], voices: {}, scenario: null, planStep: 0, busy: false, spokenInput: false };

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// ───────────────────────── legacy import (from ai.tah3in.com) ─────────────────────────
(function captureImport() {
  if (!location.hash.startsWith('#import=')) return;
  try {
    const b64 = location.hash.slice(8).replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    JSON.parse(json);
    localStorage.setItem(IMPORT_KEY, json);
  } catch (error) { console.warn('Import payload ignored', error); }
  history.replaceState(null, '', location.pathname + location.search);
})();

/*EMBED*/ // The coach lives inside Amookht's layout (iframe); opened directly it hands over to Amookht.
const EMBEDDED = (() => { try { return window.top !== window.self && window.parent.location.origin === location.origin; } catch (_) { return false; } })();
if (EMBEDDED) document.documentElement.classList.add('embedded');
function syncAmookhtAccent() { try { const cs = window.parent.getComputedStyle(window.parent.document.documentElement); ['--aca-200', '--aca-500', '--acb-500'].forEach((name) => { const v = cs.getPropertyValue(name).trim(); if (v) document.documentElement.style.setProperty(name, v); }); } catch (_) { /* ignore */ } }
if (EMBEDDED) { syncAmookhtAccent(); window.addEventListener('focus', syncAmookhtAccent); }
const HANDOFF = !EMBEDDED && !/[?&](standalone|embed)=/.test(location.search);
if (HANDOFF) location.replace('/#dcoach');

// ───────────────────────── auth & API ─────────────────────────
function tokens() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); } catch (_) { return null; }
}
let refreshing = null;
function refreshTokens() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const current = tokens();
    if (!current?.refresh_token) return false;
    try {
      const response = await fetch(`/v1/auth/refresh?refresh_token=${encodeURIComponent(current.refresh_token)}`, { method: 'POST' });
      if (!response.ok) return false;
      localStorage.setItem(TOKEN_KEY, JSON.stringify(await response.json()));
      return true;
    } catch (_) { return false; }
  })().finally(() => setTimeout(() => { refreshing = null; }, 0));
  return refreshing;
}

function errorText(detail, status) {
  if (!detail) return `HTTP ${status}`;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || 'Invalid input').join(' · ');
  return detail.message || detail.code || `HTTP ${status}`;
}

async function request(path, options = {}, retry = true) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (options.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(options.json); }
  const access = tokens()?.access_token;
  if (access) headers.Authorization = `Bearer ${access}`;
  const response = await fetch(`api/${path}`, { method: options.method || (body ? 'POST' : 'GET'), headers, body });
  if (response.status === 401 && retry && await refreshTokens()) return request(path, options, false);
  if (!response.ok) {
    let detail;
    try { detail = (await response.json()).detail; } catch (_) {}
    const error = new Error(errorText(detail, response.status));
    error.status = response.status;
    error.code = detail?.code || '';
    error.detail = detail;
    if (response.status === 401) showGate('login');
    if (response.status === 403 && error.code === 'premium_required') showGate('premium');
    throw error;
  }
  return response;
}
const getJson = async (path, options) => (await request(path, options)).json();

function showGate(kind) {
  const copy = kind === 'premium'
    ? { tag: '♛ PREMIUM', title: 'Deutsch Coach مخصوص کاربران پرمیوم است', body: 'با حساب پرمیوم آموخت به مربی‌های هوشمند، گفتگوی صوتی، تمرین شنیداری روزانه و دفتر خطاهای شخصی دسترسی دارید.', action: 'بازگشت به آموخت' }
    : { tag: 'AMOOKHT', title: 'ابتدا وارد حساب آموخت شوید', body: 'Deutsch Coach با حساب آموخت شما کار می‌کند و پیشرفتتان در همهٔ دستگاه‌ها ذخیره می‌شود.', action: 'ورود به آموخت' };
  $('#gateTag').textContent = copy.tag;
  $('#gateTitle').textContent = copy.title;
  $('#gateBody').textContent = copy.body;
  $('#gateAction').textContent = copy.action;
  $('#gateOverlay').classList.remove('hidden');
  document.body.classList.add('gated');
}

// ───────────────────────── per-account storage ─────────────────────────
const store = { data: null, version: 0, timer: null, saving: null, dirty: false, retry: null };
const cacheKey = () => `dc_cache_v3_${state.me?.id || 'anon'}`;

function normalizeData(raw) {
  const data = raw && typeof raw === 'object' ? { ...raw } : {};
  data.mistakes = Array.isArray(data.mistakes) ? data.mistakes.filter((item) => item?.id && MISTAKE_TYPES.has(item.type)) : [];
  data.favorites = Array.isArray(data.favorites) ? data.favorites.filter((item) => item?.id && item?.text).map((item) => ({ ...item, stars: Math.max(1, Math.min(3, Number(item.stars) || 3)) })) : [];
  data.customCoaches = Array.isArray(data.customCoaches) ? data.customCoaches.filter((coach) => /^custom-[a-z0-9-]{6,50}$/.test(coach?.id || '')) : [];
  data.hiddenCoaches = Array.isArray(data.hiddenCoaches) ? [...new Set(data.hiddenCoaches.filter((id) => /^(current|speaking|listening|writing|language|custom-[a-z0-9-]{6,50})$/.test(id)))].slice(-100) : [];
  data.profiles = data.profiles && typeof data.profiles === 'object' ? data.profiles : {};
  data.prefs = { autoSpeak: true, speed: 1, voiceAutoSend: true, coachId: 'current', view: 'learning', ...(data.prefs || {}) };
  data.deleted = data.deleted && typeof data.deleted === 'object' ? data.deleted : {};
  return data;
}

function mergeData(local, remote) {
  const deleted = { ...remote.deleted, ...local.deleted };
  const keys = Object.keys(deleted).sort((a, b) => deleted[b] - deleted[a]).slice(0, 400);
  const tomb = Object.fromEntries(keys.map((key) => [key, deleted[key]]));
  const union = (a, b) => {
    const map = new Map();
    [...b, ...a].forEach((item) => { if (item?.id && !tomb[item.id]) map.set(item.id, { ...(map.get(item.id) || {}), ...item }); });
    return [...map.values()];
  };
  const profiles = { ...remote.profiles };
  Object.entries(local.profiles).forEach(([id, profile]) => {
    const other = profiles[id];
    if (!other || String(profile?.updatedAt || '') >= String(other?.updatedAt || '')) profiles[id] = profile;
  });
  return normalizeData({
    ...remote, ...local,
    mistakes: union(local.mistakes, remote.mistakes).slice(-150),
    favorites: union(local.favorites, remote.favorites).slice(-250),
    customCoaches: union(local.customCoaches, remote.customCoaches).slice(-20),
    hiddenCoaches: [...new Set([...(remote.hiddenCoaches || []), ...(local.hiddenCoaches || [])])].slice(-100),
    profiles, deleted: tomb, prefs: local.prefs,
  });
}

function writeCache() {
  try { localStorage.setItem(cacheKey(), JSON.stringify({ data: store.data, version: store.version, dirty: store.dirty })); } catch (_) {}
}

async function loadState() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(cacheKey()) || 'null'); } catch (_) {}
  try {
    const server = await getJson('state');
    store.version = server.version || 0;
    const remote = normalizeData(server.data);
    if (cached?.dirty && cached.data) {
      store.data = mergeData(normalizeData(cached.data), remote);
      scheduleSave(50);
    } else {
      store.data = remote;
    }
  } catch (error) {
    if (error.status === 401 || error.status === 403) throw error;
    store.data = normalizeData(cached?.data);
    store.version = cached?.version || 0;
    store.dirty = !!cached?.dirty;
    toast('اتصال ضعیف است؛ داده‌ها بعداً همگام می‌شوند');
  }
  writeCache();
}

function scheduleSave(delay = 1200) {
  store.dirty = true;
  writeCache();
  clearTimeout(store.timer);
  store.timer = setTimeout(flushState, delay);
}

async function flushState() {
  if (!store.dirty || !store.data) return;
  if (store.saving) { scheduleSave(800); return; }
  const snapshot = JSON.stringify(store.data);
  store.saving = (async () => {
    try {
      const result = await getJson('state', { method: 'PUT', json: { data: JSON.parse(snapshot), base_version: store.version } });
      store.version = result.version;
      if (JSON.stringify(store.data) === snapshot) store.dirty = false;
      writeCache();
    } catch (error) {
      if (error.status === 409 && error.detail?.data) {
        store.data = mergeData(store.data, normalizeData(error.detail.data));
        store.version = error.detail.version;
        scheduleSave(50);
        return;
      }
      if (error.status === 413) toast(error.message);
      clearTimeout(store.retry);
      store.retry = setTimeout(flushState, 20000);
    }
  })().finally(() => { store.saving = null; });
  await store.saving;
}

async function pullRemote() {
  if (!store.data || store.dirty || store.saving || state.busy) return;
  try {
    const server = await getJson('state');
    if ((server.version || 0) > store.version && !store.dirty) {
      store.version = server.version;
      store.data = normalizeData(server.data);
      writeCache();
      state.coaches = [...state.coaches.filter((coach) => !coach.custom && !store.data.hiddenCoaches.includes(coach.id)), ...store.data.customCoaches.filter((coach) => !store.data.hiddenCoaches.includes(coach.id)).map((coach) => ({ ...coach, custom: true }))];
      if (!state.coaches.some((coach) => coach.id === state.coachId)) { state.coachId = state.coaches[0]?.id || ''; prefs().coachId = state.coachId; }
      renderCoachSwitcher();
      renderCoach({ silent: true });
      renderMistakes();
      renderFavorites();
    }
  } catch (_) {}
}

function mutate(fn) {
  fn(store.data);
  scheduleSave();
}
const prefs = () => store.data.prefs;

function applyPendingImport() {
  const raw = localStorage.getItem(IMPORT_KEY);
  if (!raw) return;
  try {
    const legacy = JSON.parse(raw);
    const imported = normalizeData({ mistakes: legacy.mistakes, favorites: legacy.favorites, customCoaches: legacy.customCoaches });
    const count = () => store.data.mistakes.length + store.data.favorites.length + store.data.customCoaches.length;
    const before = count();
    store.data = mergeData({
      ...store.data,
      mistakes: [...store.data.mistakes, ...imported.mistakes],
      favorites: [...store.data.favorites, ...imported.favorites],
      customCoaches: [...store.data.customCoaches, ...imported.customCoaches],
    }, store.data);
    Object.entries(legacy.levels || {}).forEach(([coachId, level]) => {
      if (['A2', 'B1', 'B2', 'C1'].includes(level) && !store.data.profiles[coachId]) store.data.profiles[coachId] = { ...freshProfile(level) };
    });
    const added = count() - before;
    scheduleSave(100);
    toast(added > 0 ? `${added} مورد از نسخهٔ قبلی به حساب شما منتقل شد` : 'داده‌های نسخهٔ قبلی قبلاً منتقل شده بود');
  } catch (error) { console.warn(error); }
  localStorage.removeItem(IMPORT_KEY);
}

// ───────────────────────── profiles (per coach, per day) ─────────────────────────
function defaultLevel() {
  const level = String(state.me?.level || '').toUpperCase();
  return ['A2', 'B1', 'B2', 'C1'].includes(level) ? level : 'B1';
}
function freshProfile(level) {
  return { session: uid(), level: level || defaultLevel(), date: today(), done: [], messages: 0, conversation: [], listening: null, updatedAt: new Date().toISOString() };
}
function getProfile(coachId = state.coachId) {
  const current = store.data.profiles[coachId];
  if (!current || current.date !== today() || !Array.isArray(current.conversation)) {
    store.data.profiles[coachId] = freshProfile(current?.level);
    scheduleSave();
  }
  return store.data.profiles[coachId];
}
function saveProfile(patch = {}, coachId = state.coachId) {
  const value = { ...getProfile(coachId), ...patch, date: today(), updatedAt: new Date().toISOString() };
  store.data.profiles[coachId] = value;
  scheduleSave();
  return value;
}
function getScenarioVariant() {
  const value = store.data?.scenarioVariant;
  return value?.date === today() ? Number(value.variant) || 0 : 0;
}

// ───────────────────────── mistakes & favourites ─────────────────────────
const getMistakes = () => store.data.mistakes;
function saveMistake(item) {
  const entry = { id: uid(), createdAt: new Date().toISOString(), ...item };
  mutate((data) => { data.mistakes = [...data.mistakes, entry].slice(-150); });
  amkPushMistake(entry);
  renderMistakes();
}
// ── Amookht bridge (2026-11-13): one notebook for everything. Saved mistakes/favourites also go to the site's
//    «دفتر عبارات» / «علاقه‌مندی‌ها» via a same-origin localStorage inbox the site drains (coach-bridge.js).
//    The coach keeps its own copy only as hidden memory for personalised prompts (weakPoints).
const AMK_INBOX = 'amookht_inbox_v1';
function amkPush(kind, data) {
  try {
    if (!state.me?.id) return;
    const list = JSON.parse(localStorage.getItem(AMK_INBOX) || '[]');
    list.push({ u: String(state.me.id), kind, id: String(data?.id || uid()), data, ts: Date.now() });
    localStorage.setItem(AMK_INBOX, JSON.stringify(list.slice(-500)));
  } catch (_) { /* storage full or blocked */ }
}
// Only very important mistakes reach the site's notebook (owner request 2026-11-13): high priority, shortened to the
// part that was wrong (not the whole sentence), and a mistake that was already sent is never sent again.
function amkShort(a, b) {
  const A = String(a || '').trim().split(/\s+/), B = String(b || '').trim().split(/\s+/), norm = (w) => w.toLowerCase().replace(/[.,!?;:„“"()]/g, '');
  let i = 0; while (i < A.length && i < B.length && norm(A[i]) === norm(B[i])) i += 1;
  let j = 0; while (j < A.length - i && j < B.length - i && norm(A[A.length - 1 - j]) === norm(B[B.length - 1 - j])) j += 1;
  let wrong = A.slice(i, A.length - j), right = B.slice(i, B.length - j);
  if (!wrong.length || !right.length) { const k = Math.max(0, i - 1); wrong = A.slice(k, A.length - j); right = B.slice(k, B.length - j); }
  if (wrong.length === 1 && right.length === 1) { const k = Math.max(0, i - 1), e = Math.min(j, 1); wrong = A.slice(k, A.length - j + e); right = B.slice(k, B.length - j + e); }
  const cut = (ws) => (ws.length > 6 ? [...ws.slice(0, 3), '…', ...ws.slice(-2)] : ws).join(' ').replace(/[.!?]+$/, '');
  return { wrong: cut(wrong), right: cut(right) };
}
function amkPushMistake(item) {
  try {
    if (!item || item.priority !== 'high') return;
    const better = item.natural || item.corrected;
    if (!item.original || !better || item.original.trim() === better.trim()) return;
    const short = amkShort(item.original, better);
    if (!short.wrong || !short.right || short.wrong.toLowerCase() === short.right.toLowerCase()) return;
    const key = `${item.type}|${short.wrong.toLowerCase()}|${short.right.toLowerCase()}`;
    const sentKey = `amookht_coach_sent_${state.me?.id || ''}`;
    const sent = JSON.parse(localStorage.getItem(sentKey) || '[]');
    if (sent.includes(key)) return;
    localStorage.setItem(sentKey, JSON.stringify([...sent, key].slice(-600)));
    amkPush('mistake', { id: item.id, type: item.type, priority: 'high', original: short.wrong, natural: short.right, note: String(item.note || '').slice(0, 160), key });
  } catch (_) { /* ignore */ }
}
function amkMigrate() {
  try {
    const flag = `amookht_coach_migrated2_${state.me?.id || ''}`;
    if (!state.me?.id || !store.data || localStorage.getItem(flag)) return;
    getMistakes().forEach((item) => amkPushMistake(item));
    getFavorites().forEach((item) => amkPush('favorite', item));
    localStorage.setItem(flag, String(Date.now()));
  } catch (_) { /* ignore */ }
}
function amkOpenSite(screen) {
  if (EMBEDDED) { flushState(); try { window.parent.postMessage({ type: 'dcoach:open', screen }, location.origin); } catch (_) { /* ignore */ } return; }
  try { localStorage.setItem('amookht_open_screen', screen); } catch (_) { /* ignore */ }
  flushState();
  location.href = '/';
}
function deleteItems(kind, ids) {
  mutate((data) => {
    const now = Date.now();
    ids.forEach((id) => { data.deleted[id] = now; });
    data[kind] = data[kind].filter((item) => !ids.includes(item.id));
  });
}

const favoriteLabels = { ai_reply: 'AI-Antwort', hint: 'Hinweis', translate: 'Übersetzung', feedback: 'Sprach-Check', scenario: 'Szenario', listening: 'Hörtext' };
function favoriteKey(item) {
  const raw = `${item.kind || ''}|${item.title || ''}|${item.text || ''}`;
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  return `fav-${Math.abs(hash)}`;
}
const getFavorites = () => store.data.favorites;
function favoritePayload(item) {
  const value = {
    kind: item.kind || 'ai_reply',
    title: item.title || favoriteLabels[item.kind] || 'Favorit',
    text: String(item.text || '').trim(),
    meta: item.meta || '',
    coach: item.coach || currentCoach()?.name || '',
    date: item.date || today(),
  };
  value.id = item.id || favoriteKey(value);
  return value;
}
function favoriteButton(item, extraClass = '') {
  const value = favoritePayload(item);
  const payload = encodeURIComponent(JSON.stringify(value));
  const stars = store.data ? (getFavorites().find((entry) => entry.id === value.id)?.stars || 0) : 0;
  return `<span class="favorite-rating ${extraClass} ${stars ? 'is-rated' : ''}" data-favorite-rating="${payload}" title="Favorit bewerten">${[1, 2, 3].map((n) => `<button type="button" class="${stars >= n ? 'is-on' : ''}" data-favorite="${payload}" data-stars="${n}" aria-label="${n} Sterne">${stars >= n ? '★' : '☆'}</button>`).join('')}</span>`;
}
function setFavoriteRating(payload, stars) {
  const item = JSON.parse(decodeURIComponent(payload));
  const value = Math.max(1, Math.min(3, Number(stars) || 1));
  const existing = getFavorites().find((entry) => entry.id === item.id);
  if (existing?.stars === value) {
    deleteItems('favorites', [item.id]);
    toast('Aus Favoriten entfernt');
  } else {
    mutate((data) => {
      delete data.deleted[item.id];
      data.favorites = existing
        ? data.favorites.map((entry) => (entry.id === item.id ? { ...entry, ...item, stars: value, updatedAt: new Date().toISOString() } : entry))
        : [...data.favorites, { ...item, stars: value, createdAt: new Date().toISOString() }].slice(-250);
    });
    amkPush('favorite', { ...item, stars: value });
    toast(`${value} Sterne gespeichert · auch in «علاقه‌مندی‌ها»`);
  }
  renderFavorites();
}
function refreshFavoriteButtons() {
  const ratings = new Map(getFavorites().map((item) => [item.id, item.stars]));
  document.querySelectorAll('[data-favorite-rating]').forEach((rating) => {
    try {
      const { id } = JSON.parse(decodeURIComponent(rating.dataset.favoriteRating));
      const stars = ratings.get(id) || 0;
      rating.classList.toggle('is-rated', stars > 0);
      rating.querySelectorAll('[data-stars]').forEach((button) => {
        const on = stars >= Number(button.dataset.stars);
        button.classList.toggle('is-on', on);
        button.textContent = on ? '★' : '☆';
      });
    } catch (_) {}
  });
  $('#favoriteTabCount').textContent = ratings.size;
  $('#favoriteCount').textContent = ratings.size;
}
function renderFavorites() {
  if (!store.data) return;
  const filter = $('#favoriteFilter').value || 'all';
  const all = [...getFavorites()].sort((a, b) => (b.stars - a.stars) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const visible = all.filter((item) => filter === 'all' || item.kind === filter || filter === `stars-${item.stars}`);
  refreshFavoriteButtons();
  $('#favoriteList').innerHTML = visible.length ? visible.map((item) => `
    <article class="favorite-item">
      <header><b>${escapeHtml(favoriteLabels[item.kind] || item.title || 'Favorit')}</b><span class="favorite-stars">${'★'.repeat(item.stars)}${'☆'.repeat(3 - item.stars)}</span><small>${escapeHtml(item.coach || '')} · ${escapeHtml(item.date || '')}</small></header>
      <p dir="auto">${escapeHtml(item.text)}</p>
      ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ''}
      <footer>${/[a-zäöüß]/i.test(item.text) ? `<button type="button" class="speak-inline" data-speak="${escapeHtml(item.text)}">▶ Anhören</button>` : ''}<button type="button" data-delete-favorite="${escapeHtml(item.id)}">Löschen</button></footer>
    </article>`).join('') : '<p class="favorite-empty">Noch keine Favoriten. Wähle 1 bis 3 Sterne neben Antworten, Hinweisen oder Übersetzungen.</p>';
}
function weakPoints() {
  const rank = { high: 0, medium: 1, low: 2 };
  return [...getMistakes()].sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 12)
    .map((item) => `[${item.type}] ${item.original} → ${item.natural || item.corrected}${item.note ? ` (${item.note})` : ''}`.slice(0, 280));
}

const mistakeLabels = { grammar: 'Grammatik', vocabulary: 'Wortschatz', sentence_structure: 'Satzbau', naturalness: 'Natürlichkeit' };
function renderMistakes() {
  if (!store.data) return;
  const filter = $('#mistakeFilter').value;
  const rank = { high: 0, medium: 1, low: 2 };
  const all = getMistakes();
  const visible = all.filter((item) => filter === 'all' || item.type === filter)
    .sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) || String(b.createdAt).localeCompare(String(a.createdAt)));
  $('#mistakeCount').textContent = all.length;
  $('#mistakeTabCount').textContent = all.length;
  $('#mistakeList').innerHTML = visible.length ? visible.map((item) => `
    <article class="mistake-item priority-${escapeHtml(item.priority || 'medium')}">
      <header><span class="mistake-type">${escapeHtml(mistakeLabels[item.type] || item.type)}</span><small>${escapeHtml(item.level || '')} · ${escapeHtml(item.date || '')}</small><button data-delete-mistake="${escapeHtml(item.id)}" title="Löschen">×</button></header>
      <p class="mistake-original">${escapeHtml(item.original)}</p>
      <p class="mistake-better">→ ${escapeHtml(item.natural || item.corrected)} <button type="button" class="speak-inline" data-speak="${escapeHtml(item.natural || item.corrected)}">▶</button></p>
      ${item.note ? `<p class="mistake-note" dir="rtl">${escapeHtml(item.note)}</p>` : ''}
    </article>`).join('') : '<p class="mistake-empty">Keine gespeicherten Fehler in dieser Kategorie.</p>';
}

// ───────────────────────── helpers ─────────────────────────
let toastTimer = null;
function toast(text) {
  const element = $('#toast');
  element.textContent = text;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 3200);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
function avatarHtml(coach, className = 'avatar-img') {
  if (coach?.avatar) return `<img class="${className}" src="${escapeHtml(coach.avatar)}" alt="${escapeHtml(coach.name || 'Coach')}">`;
  return `<span class="${className} avatar-fallback">${escapeHtml(coach?.initials || 'DC')}</span>`;
}
function scrollDown() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
}
function currentCoach() {
  return state.coaches.find((coach) => coach.id === state.coachId) || state.coaches[0];
}
function scenarioTask(coach = currentCoach()) {
  return state.scenario?.tasks?.[coach?.id] || `Bearbeite das Tagesszenario passend zum Lernziel: ${coach?.focus || 'Deutsch verbessern'}.`;
}

// ───────────────────────── speech output ─────────────────────────
const speech = { run: 0, audio: new Audio(), urls: new Map(), playingId: null, blockedNotice: false };
speech.audio.preload = 'auto';

function voiceSettings(coach = currentCoach()) {
  return { coach_id: coach?.custom ? 'custom' : (coach?.id || 'current'), voice: coach?.custom ? (coach.voice || '') : '', level: $('#level').value || 'B1', speed: Number(prefs().speed) || 1 };
}
function speechChunks(text) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  if (flat.length <= 480) return [flat]; // one request = one natural intonation arc
  const sentences = flat.match(/[^.!?…]+[.!?…]+["“”»]?|\S[^.!?…]*$/g) || [];
  const chunks = [];
  let current = '';
  sentences.forEach((sentence) => {
    const limit = chunks.length === 0 ? 240 : 900;
    const next = `${current} ${sentence}`.trim();
    if (current && next.length > limit) { chunks.push(current); current = sentence.trim(); } else current = next;
  });
  if (current) chunks.push(current);
  return chunks.flatMap((chunk) => (chunk.length <= 1800 ? [chunk] : chunk.match(/[\s\S]{1,1800}(?=\s|$)/g) || [chunk]));
}
async function ttsUrl(text, settings) {
  const key = `${settings.voice || settings.coach_id}|${settings.level}|${settings.speed}|${text}`;
  if (speech.urls.has(key)) {
    const url = speech.urls.get(key);
    speech.urls.delete(key);
    speech.urls.set(key, url);
    return url;
  }
  const response = await request('tts', { json: { text, ...settings } });
  const url = URL.createObjectURL(await response.blob());
  speech.urls.set(key, url);
  while (speech.urls.size > 60) {
    const [oldKey, oldUrl] = speech.urls.entries().next().value;
    speech.urls.delete(oldKey);
    URL.revokeObjectURL(oldUrl);
  }
  return url;
}
function playUrl(url, run) {
  return new Promise((resolve, reject) => {
    if (run !== speech.run) { resolve(); return; }
    const audio = speech.audio;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.src = url;
    audio.play().catch(reject);
  });
}
function setSpeaking(id) {
  speech.playingId = id;
  document.querySelectorAll('.message.is-speaking').forEach((element) => element.classList.remove('is-speaking'));
  if (id) document.querySelector(`[data-msg-id="${id}"]`)?.classList.add('is-speaking');
}
function stopSpeech() {
  speech.run += 1;
  speech.audio.pause();
  setSpeaking(null);
}
async function speakText(text, { id = null, coach = currentCoach() } = {}) {
  const clean = String(text || '').trim();
  if (!clean) return;
  stopSpeech();
  const run = speech.run;
  const settings = voiceSettings(coach);
  const chunks = speechChunks(clean);
  setSpeaking(id);
  try {
    let next = ttsUrl(chunks[0], settings);
    for (let index = 0; index < chunks.length; index += 1) {
      const url = await next;
      if (run !== speech.run) return;
      if (index + 1 < chunks.length) { next = ttsUrl(chunks[index + 1], settings); next.catch(() => {}); }
      await playUrl(url, run);
    }
  } catch (error) {
    if (run !== speech.run) return;
    if (error?.name === 'NotAllowedError') {
      if (!speech.blockedNotice) toast('برای شنیدن صدا روی ▶ کنار پیام بزنید');
      speech.blockedNotice = true;
    } else if (error?.status !== 401 && error?.status !== 403) toast(`پخش صدا ممکن نشد: ${error.message}`);
  } finally {
    if (run === speech.run) setSpeaking(null);
  }
}

// ───────────────────────── speech input ─────────────────────────
const rec = { recorder: null, stream: null, chunks: [], started: 0, timer: null };
function pickMime() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
}
async function toggleMic() {
  if (rec.recorder?.state === 'recording') { rec.recorder.stop(); return; }
  if (state.busy) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast('این مرورگر ضبط صدا را پشتیبانی نمی‌کند'); return; }
  stopSpeech();
  try {
    rec.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (_) {
    toast('دسترسی به میکروفون داده نشد'); return;
  }
  const mime = pickMime();
  rec.chunks = [];
  rec.recorder = new MediaRecorder(rec.stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
  rec.recorder.ondataavailable = (event) => { if (event.data?.size) rec.chunks.push(event.data); };
  rec.recorder.onstop = finishRecording;
  rec.recorder.start(250);
  rec.started = Date.now();
  $('#micBtn').classList.add('recording');
  $('#micBtn').setAttribute('aria-label', 'Aufnahme beenden');
  const tick = () => {
    const seconds = Math.floor((Date.now() - rec.started) / 1000);
    $('#recTimer').textContent = `● ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · در حال ضبط؛ برای پایان دوباره روی میکروفون بزنید`;
    if (seconds >= 120) rec.recorder?.stop();
  };
  tick();
  rec.timer = setInterval(tick, 250);
  $('#recTimer').classList.remove('hidden');
}
async function finishRecording() {
  clearInterval(rec.timer);
  rec.stream?.getTracks().forEach((track) => track.stop());
  $('#micBtn').classList.remove('recording');
  $('#micBtn').setAttribute('aria-label', 'Sprechen');
  const duration = Date.now() - rec.started;
  const type = (rec.recorder?.mimeType || 'audio/webm').split(';')[0];
  const blob = new Blob(rec.chunks, { type });
  rec.recorder = null;
  if (duration < 700 || blob.size < 1500) { $('#recTimer').classList.add('hidden'); toast('خیلی کوتاه بود؛ بزنید، صحبت کنید و دوباره بزنید'); return; }
  $('#recTimer').textContent = 'در حال تبدیل گفتار به متن…';
  setBusy(true);
  let autoSend = false;
  try {
    const data = await getJson('stt', { method: 'POST', body: blob, headers: { 'Content-Type': type } });
    const text = String(data.text || '').trim();
    if (!text) { toast('صدایی تشخیص داده نشد؛ دوباره امتحان کنید'); return; }
    input.value = `${input.value.trim() ? `${input.value.trim()} ` : ''}${text}`;
    state.spokenInput = true;
    resizeInput();
    autoSend = !!prefs().voiceAutoSend;
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(false);
    $('#recTimer').classList.add('hidden');
  }
  if (autoSend) sendText(); else input.focus();
}

// ───────────────────────── listening (Jonas) ─────────────────────────
const listeningAudio = { url: null, key: null };
function listeningCardHtml(profile) {
  const data = profile.listening;
  if (!data) return '<div class="listen-card is-loading"><b>🎧 Hörtext wird vorbereitet…</b><p dir="rtl">متن شنیداری امروز در حال ساخت است (بار اول تا ۲۰ ثانیه).</p></div>';
  const revealed = !!data.revealed;
  return `<div class="listen-card">
    <header><span>🎧 HÖRTEXT · ${escapeHtml(data.level || '')}</span><b>${escapeHtml(data.title)}</b></header>
    <div class="listen-player">
      <button type="button" class="listen-play" data-listen-play>▶ Abspielen</button>
      <audio data-listen-audio preload="none"></audio>
      <label>Tempo <select data-listen-rate><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option></select></label>
    </div>
    <p class="listen-note" dir="rtl">اول فقط گوش کن، بعد خلاصه‌ات را به آلمانی بنویس یا بگو. متن بعد از اولین تلاش باز می‌شود.</p>
    <button type="button" class="listen-reveal" data-listen-reveal>${revealed ? 'Transkript ausblenden' : '📄 Transkript & Wendungen zeigen'}</button>
    <div class="listen-transcript ${revealed ? '' : 'hidden'}">
      ${data.segments.map((item) => `<p><b>${item.speaker === 'A' ? 'Moderatorin' : 'Experte'}:</b> ${escapeHtml(item.text)}</p>`).join('')}
      ${data.key_points_de?.length ? `<h4>Hauptaussagen</h4><ul>${data.key_points_de.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
      ${data.vocab?.length ? `<h4>Wendungen</h4><ul class="listen-vocab">${data.vocab.map((item) => `<li><b>${escapeHtml(item.de)}</b><span dir="rtl">${escapeHtml(item.fa)}</span></li>`).join('')}</ul>` : ''}
      <div class="inline-favorite-row">${favoriteButton({ kind: 'listening', title: data.title, text: data.transcript })}</div>
    </div>
  </div>`;
}
function renderListeningCard() {
  const holder = document.querySelector('[data-listening-holder]');
  if (holder) holder.innerHTML = listeningCardHtml(getProfile('listening'));
}
async function ensureListening() {
  const profile = getProfile('listening');
  const level = profile.level || $('#level').value;
  const variant = getScenarioVariant();
  if (profile.listening && profile.listening.variant === variant && profile.listening.level === level) return;
  const data = await getJson(`listening?date=${encodeURIComponent(today())}&variant=${variant}&level=${encodeURIComponent(level)}`);
  saveProfile({ listening: { ...data, variant, level, revealed: false } }, 'listening');
  if (state.coachId === 'listening') renderListeningCard();
}
async function playListening(button) {
  const data = getProfile('listening').listening;
  if (!data) return;
  stopSpeech();
  const card = button.closest('.listen-card');
  const audio = card.querySelector('[data-listen-audio]');
  const key = `${data.audio_key}|${data.variant}|${data.level}`;
  if (listeningAudio.key !== key) {
    button.disabled = true;
    button.textContent = '⏳ Audio wird erzeugt…';
    try {
      const response = await request(`listening/audio?date=${encodeURIComponent(today())}&variant=${data.variant}&level=${encodeURIComponent(data.level)}`);
      if (listeningAudio.url) URL.revokeObjectURL(listeningAudio.url);
      listeningAudio.url = URL.createObjectURL(await response.blob());
      listeningAudio.key = key;
    } catch (error) {
      toast(error.message);
      button.disabled = false;
      button.textContent = '▶ Abspielen';
      return;
    }
    button.disabled = false;
  }
  audio.src = listeningAudio.url;
  audio.controls = true;
  audio.playbackRate = Number(card.querySelector('[data-listen-rate]').value) || 1;
  button.classList.add('hidden');
  audio.play().catch((error) => { if (error?.name !== 'NotAllowedError') toast(error.message); });
}

// ───────────────────────── conversation UI ─────────────────────────
function initialCoachMessage(coach) {
  if (coach.custom) return state.scenario ? `${coach.greeting} Heute arbeiten wir mit dem Tagesszenario „${state.scenario.title}“. Erste Aufgabe: ${state.scenario.question}` : coach.greeting;
  if (coach.id === 'current' || coach.id === 'kumpel' || !state.scenario) return coach.greeting;
  const { title, question } = state.scenario;
  if (coach.id === 'speaking') return `Heute trainieren wir zum Thema „${title}“. Deine Aufgabe: Nenne zuerst klar deine Position und begründe sie. ${question}`;
  if (coach.id === 'listening') return `Heute hörst du ein kurzes Radiointerview zum Thema „${title}“. Hör zuerst nur zu, ohne mitzulesen. Danach fasst du die Hauptpunkte in drei bis fünf Sätzen zusammen.`;
  if (coach.id === 'writing') return `Heute bearbeiten wir eine TestDaF-Schreibaufgabe zum Thema „${title}“. Formuliere zuerst eine präzise Einleitung zur Leitfrage: ${question}`;
  if (coach.id === 'language') return `Heute arbeiten wir systematisch am Thema „${title}“. Formuliere zunächst einen Satz mit deiner Position zu dieser Leitfrage: ${question}`;
  return coach.greeting;
}

function addMessage(role, text, meta = '', options = {}) {
  const article = document.createElement('article');
  const id = options.id || uid();
  article.className = `message ${role}${options.kind === 'listening' ? ' listening' : ''}`;
  article.dataset.msgId = id;
  if (options.kind === 'listening') {
    article.innerHTML = `<div class="chat-avatar">${avatarHtml(currentCoach())}</div><div class="bubble listen-bubble" data-listening-holder>${listeningCardHtml(getProfile('listening'))}</div>`;
    conversation.append(article);
    if (options.scroll !== false) scrollDown();
    return id;
  }
  const tools = role === 'assistant'
    ? `<span class="message-tools"><button class="speak-mini" data-speak-msg="${id}" title="Vorlesen">▶</button><button class="hint-mini" data-hint="${escapeHtml(text)}">Hinweis</button></span>`
    : '';
  const avatar = role === 'assistant' ? `<div class="chat-avatar">${avatarHtml(currentCoach())}</div>` : '';
  const favorite = role === 'assistant' ? `<div class="inline-favorite-row">${favoriteButton({ kind: 'ai_reply', title: 'AI-Antwort', text, meta, coach: currentCoach()?.name }, 'compact')}</div>` : '';
  const spoken = options.spoken ? '<span class="spoken-badge" title="gesprochen">🎙</span>' : '';
  article.innerHTML = `${avatar}<div class="bubble"><p>${spoken}${escapeHtml(text)}</p>${meta ? `<small>${escapeHtml(meta)}</small>` : ''}${tools}${favorite}</div>`;
  article.dataset.text = text;
  conversation.append(article);
  /*NOSCROLL*/ if (options.scroll !== false) scrollDown();
  if (role === 'assistant' && options.autoSpeak !== false && prefs().autoSpeak) speakText(text, { id });
  return id;
}

function typing(show) {
  $('#typing')?.remove();
  if (!show) return;
  const article = document.createElement('article');
  article.id = 'typing';
  article.className = 'message assistant typing';
  article.innerHTML = `<div class="chat-avatar">${avatarHtml(currentCoach())}</div><div class="bubble"><i></i><i></i><i></i></div>`;
  conversation.append(article);
  scrollDown();
}

function renderPlan() {
  const coach = currentCoach();
  if (!coach) return;
  const profile = getProfile();
  state.planStep = Math.min(state.planStep, coach.plan.length - 1);
  $('#planSteps').innerHTML = coach.plan.map((step, index) => `
    <button class="plan-step ${profile.done.includes(index) ? 'done' : ''} ${state.planStep === index ? 'active' : ''}" data-plan-step="${index}">
      <span>${profile.done.includes(index) ? '✓' : String(index + 1).padStart(2, '0')}</span>${escapeHtml(step)}
    </button>`).join('');
  $('#planScore').textContent = `${profile.done.length}/${coach.plan.length}`;
  $('#streakText').textContent = profile.done.length === coach.plan.length
    ? 'Tagesziel erreicht — stark gemacht!'
    : `${profile.messages} Übungen heute · Niveau ${profile.level}`;
}

function startConversation(coach) {
  const greeting = initialCoachMessage(coach);
  const opening = [{ role: 'assistant', text: greeting, id: addMessage('assistant', greeting, '', { scroll: false }) }];
  if (coach.id === 'listening') {
    opening.push({ role: 'assistant', kind: 'listening', text: '', id: addMessage('assistant', '', '', { kind: 'listening', scroll: false }) });
    ensureListening().catch((error) => {
      if (error.status === 401 || error.status === 403) return;
      toast(error.message);
      const holder = document.querySelector('[data-listening-holder]');
      if (holder) holder.innerHTML = '<div class="listen-card"><b>Hörtext konnte nicht geladen werden.</b><button type="button" class="listen-reveal" data-listen-retry>Erneut versuchen</button></div>';
    });
  }
  saveProfile({ conversation: opening });
}

function renderCoach({ silent = false } = {}) {
  const coach = currentCoach();
  if (!coach) return;
  const profile = getProfile();
  document.documentElement.style.setProperty('--coach-accent', coach.accent);
  $('#coachInitials').innerHTML = avatarHtml(coach, 'coach-avatar-img');
  $('#coachRole').textContent = coach.role.toUpperCase();
  $('#coachName').textContent = `Hallo, ich bin ${coach.name}.`;
  $('#coachIntro').textContent = coach.intro;
  $('#level').value = profile.level;
  document.querySelectorAll('.coach-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.coach === coach.id));
  conversation.innerHTML = '';
  if (profile.conversation.length) {
    profile.conversation.forEach((message) => addMessage(message.role, message.text, message.meta || '', { autoSpeak: false, kind: message.kind, id: message.id, spoken: message.spoken, scroll: false }));
    if (coach.id === 'listening' && !profile.listening) ensureListening().catch(() => {});
  } else if (!silent) {
    startConversation(coach);
  }
  $('#feedback').classList.add('hidden');
  input.placeholder = coach.id === 'listening' ? 'Fasse den Hörtext zusammen…' : 'Schreib oder sprich auf Deutsch…';
  resizeInput();
  renderPlan();
  renderMistakes();
  renderScenario();
}

function renderScenario() {
  const scenario = state.scenario;
  const coach = currentCoach();
  if (!scenario || !coach) return;
  $('#scenarioDate').textContent = scenario.date;
  $('#scenarioTitle').textContent = scenario.title;
  $('#scenarioContext').textContent = scenario.context;
  $('#scenarioQuestion').textContent = scenario.question;
  $('#scenarioCoachName').textContent = coach.name;
  $('#scenarioTask').textContent = scenarioTask(coach);
  const card = document.querySelector('.scenario-card');
  card?.querySelector('.scenario-favorite')?.remove();
  card?.insertAdjacentHTML('beforeend', `<div class="inline-favorite-row scenario-favorite">${favoriteButton({ kind: 'scenario', title: scenario.title, text: `${scenario.context}\n${scenario.question}\n${scenarioTask(coach)}`, coach: coach.name })}</div>`);
}

function renderCoachSwitcher() {
  $('#coachSwitcher').innerHTML = state.coaches.map((coach) => `
    <button class="coach-tab" style="--coach-accent:${escapeHtml(coach.accent)}" data-coach="${escapeHtml(coach.id)}">
      <span class="mini-avatar">${avatarHtml(coach, 'mini-avatar-img')}</span><span><b>${escapeHtml(coach.name)}</b><small>${escapeHtml(coach.role)}</small></span>
      <i class="coach-delete" data-delete-coach="${escapeHtml(coach.id)}" title="Coach für mein Konto löschen" aria-label="Coach für mein Konto löschen">×</i>
    </button>`).join('') + '<button class="coach-tab add-coach-tab" id="addCoachBtn" type="button"><span class="mini-avatar">+</span><span><b>Neu</b><small>Coach erstellen</small></span></button>';
  $('#addCoachBtn').onclick = () => { $('#coachBuilderOverlay').classList.remove('hidden'); $('#builderName').focus(); };
}

async function loadCoaches() {
  const [data, scenario] = await Promise.all([
    getJson('coaches'),
    getJson(`daily-scenario?date=${encodeURIComponent(today())}&variant=${getScenarioVariant()}`),
  ]);
  state.voices = data.voices || {};
  state.coaches = [...data.coaches.filter((coach) => !store.data.hiddenCoaches.includes(coach.id)), ...store.data.customCoaches.filter((coach) => !store.data.hiddenCoaches.includes(coach.id)).map((coach) => ({ ...coach, custom: true }))];
  state.scenario = scenario;
  state.coachId = prefs().coachId;
  if (!state.coaches.some((coach) => coach.id === state.coachId)) state.coachId = state.coaches[0]?.id || '';
  $('#builderVoice').innerHTML = Object.entries(state.voices).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join('');
  renderCoachSwitcher();
  renderCoach();
}

function askDeleteCoach(coach) {
  const overlay = $('#deleteCoachOverlay');
  $('#deleteCoachMessage').textContent = `مربی «${coach.name}» فقط از فهرست و حساب شما حذف می‌شود.`;
  overlay.classList.remove('hidden');
  return new Promise((resolve) => {
    const finish = (answer) => { overlay.classList.add('hidden'); resolve(answer); };
    $('#confirmDeleteCoachBtn').onclick = () => finish(true);
    $('#cancelDeleteCoachBtn').onclick = () => finish(false);
    $('#closeDeleteCoachBtn').onclick = () => finish(false);
    overlay.onclick = (event) => { if (event.target === overlay) finish(false); };
  });
}

function setBusy(value) {
  state.busy = value;
  send.disabled = value;
  input.disabled = value;
  $('#micBtn').disabled = value;
}
function resizeInput() {
  input.style.height = 'auto';
  if (input.value) input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

function showFeedback(data) {
  $('#feedback').classList.remove('hidden');
  $('#grammarCard').classList.toggle('bad', !data.grammar_ok);
  $('#naturalCard').classList.toggle('bad', !data.natural_ok);
  $('#grammarCard i').textContent = data.grammar_ok ? '✓' : '!';
  $('#naturalCard i').textContent = data.natural_ok ? '✓' : '!';
  $('#correctedText').textContent = data.corrected_de;
  $('#naturalText').textContent = data.natural_de;
  $('#naturalText').dataset.speak = data.natural_de;
  $('#explanation').textContent = `${data.explanation_fa}${data.encouragement_fa ? ` · ${data.encouragement_fa}` : ''}`;
  ['#grammarCard', '#naturalCard'].forEach((selector) => $(selector).querySelector('.favorite-rating')?.remove());
  $('#grammarCard').insertAdjacentHTML('beforeend', favoriteButton({ kind: 'feedback', title: 'Grammatik', text: data.corrected_de, meta: data.explanation_fa, coach: currentCoach()?.name }));
  $('#naturalCard').insertAdjacentHTML('beforeend', favoriteButton({ kind: 'feedback', title: 'Natürlichkeit', text: data.natural_de, meta: data.explanation_fa, coach: currentCoach()?.name }));
}

async function translateText() {
  const text = $('#translatorInput').value.trim();
  if (!text) return;
  const result = $('#translatorResult');
  result.innerHTML = '<div class="tool-loading">در حال ترجمه…</div>';
  $('#translateBtn').disabled = true;
  try {
    const data = await getJson('translate', { json: { text } });
    const german = /^de/i.test(data.source_language) ? text : data.translation;
    result.innerHTML = `
      <div class="translation-main" dir="auto">${escapeHtml(data.translation)} <button type="button" class="speak-inline" data-speak="${escapeHtml(german)}">▶</button><div class="inline-favorite-row">${favoriteButton({ kind: 'translate', title: data.headword_de || text, text: `${text}\n${data.translation}`, meta: data.word_info })}</div></div>
      <p class="word-info" dir="auto"><b>${escapeHtml(data.headword_de)}</b>${data.word_info ? ` · ${escapeHtml(data.word_info)}` : ''}</p>
      ${data.related_de ? `<p class="word-info word-related" dir="rtl" title="${data.related_kind === 'verb' ? 'فعل' : 'اسم'}">↔ <b dir="ltr">${escapeHtml(data.related_de)}</b> <button type="button" class="speak-inline" data-speak="${escapeHtml(data.related_de)}">▶</button>${data.related_fa ? ` — ${escapeHtml(data.related_fa)}` : ''}</p>` : ''}<!--TR-REL--><!--TR-REL2-->
      ${data.collocations.length ? `<h3>Häufige Kollokationen</h3>
      <ol class="collocation-list">${data.collocations.map((item) => `<li><b>${escapeHtml(item.phrase)} <button type="button" class="speak-inline" data-speak="${escapeHtml(item.example_de || item.phrase)}">▶</button></b><span dir="rtl">${escapeHtml(item.meaning_fa)}</span><small>${escapeHtml(item.example_de)}</small><div class="inline-favorite-row">${favoriteButton({ kind: 'translate', title: item.phrase, text: `${item.phrase}\n${item.meaning_fa}\n${item.example_de}`, meta: data.headword_de })}</div></li>`).join('')}</ol>` : ''}`;
  } catch (error) {
    result.innerHTML = `<p class="hint-translation">${escapeHtml(error.message)}</p>`;
  } finally { $('#translateBtn').disabled = false; }
}

async function showHint(text) {
  const result = $('#hintResult');
  $('#hintOverlay').classList.remove('hidden');
  result.innerHTML = '<div class="tool-loading">Hinweis wird vorbereitet…</div>';
  try {
    const data = await getJson('hint', { json: { text, level: $('#level').value } });
    result.innerHTML = `
      <h3>Original</h3><div class="hint-original">${escapeHtml(text)}</div>
      <div class="hint-translation">${escapeHtml(data.translation_fa)}<div class="inline-favorite-row">${favoriteButton({ kind: 'hint', title: 'Übersetzung', text: data.translation_fa, meta: text })}</div></div>
      <h3>So kannst du antworten</h3><ol class="answer-patterns">${data.answer_patterns.map((pattern) => `<li>${escapeHtml(pattern)}<div class="inline-favorite-row"><button type="button" class="use-pattern" data-use-text="${escapeHtml(pattern.replace(/\[[^\]]*\]/g, '…'))}">Übernehmen</button>${favoriteButton({ kind: 'hint', title: 'Antwortmuster', text: pattern, meta: text })}</div></li>`).join('')}</ol>
      <h3>Natürlich & professionell</h3><div class="hint-answer">${highlightVerbParts(data.answer_de, data.verb_parts || [])} <button type="button" class="speak-inline" data-speak="${escapeHtml(data.answer_de)}">▶</button><div class="inline-favorite-row">${favoriteButton({ kind: 'hint', title: 'Antwortvorschlag', text: data.answer_de, meta: text })}</div></div>
      <p class="verb-legend" dir="rtl"><i></i> فقط فعل و اجزای وابسته به آن مشخص شده‌اند.</p>`;
  } catch (error) {
    result.innerHTML = `<p class="hint-translation">${escapeHtml(error.message)}</p>`;
  }
}
function highlightVerbParts(sentence, verbParts) {
  const parts = [...new Set(verbParts.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!parts.length) return escapeHtml(sentence);
  const expression = new RegExp(`(${parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return String(sentence).split(expression).map((part, index) => (index % 2 ? `<mark class="verb-highlight">${escapeHtml(part)}</mark>` : escapeHtml(part))).join('');
}

async function sendText(text = input.value.trim()) {
  if (!text || state.busy) return;
  const spoken = state.spokenInput;
  state.spokenInput = false;
  stopSpeech();
  input.value = '';
  resizeInput();
  const coach = currentCoach();
  const coachId = state.coachId;
  const userMessage = { role: 'user', text, id: uid(), spoken };
  addMessage('user', text, '', { id: userMessage.id, spoken });
  const before = getProfile();
  const history = before.conversation.filter((message) => !message.kind && message.text);
  const userConversation = [...before.conversation, userMessage].slice(-40);
  saveProfile({ conversation: userConversation });
  setBusy(true);
  typing(true);
  try {
    const lesson = coachId !== 'current' && coachId !== 'kumpel';
    const data = await getJson('chat', {
      json: {
        text,
        session_id: before.session,
        level: $('#level').value,
        topic: lesson ? (state.scenario?.title || 'Freies Gespräch') : 'Freies Gespräch',
        coach_id: coachId,
        coach_prompt: coach.custom ? coach.prompt : '',
        plan_step: coach.plan[state.planStep] || '',
        recent_context: history.slice(-12).map((message) => ({ role: message.role, content: message.text })),
        weak_points: weakPoints(),
        scenario_context: lesson && state.scenario ? `${state.scenario.context} Leitfrage: ${state.scenario.question}` : '',
        scenario_task: lesson ? scenarioTask(coach) : '',
        reference_text: coachId === 'listening' ? (getProfile('listening').listening?.transcript || '') : '',
        spoken,
      },
    });
    const profile = getProfile(coachId);
    const done = [...new Set([...profile.done, state.planStep])];
    const assistantMessage = { role: 'assistant', text: data.reply_de, meta: `${data.model} · ${(data.latency_ms / 1000).toFixed(1)}s`, id: uid() };
    saveProfile({ done, messages: profile.messages + 1, level: $('#level').value, conversation: [...userConversation, assistantMessage].slice(-40) }, coachId);
    if (data.memory_worthy) {
      saveMistake({ date: today(), coach: coachId, level: $('#level').value, type: data.error_type, priority: data.memory_priority, original: text, corrected: data.corrected_de, natural: data.natural_de, note: data.memory_note_fa });
    }
    if (state.coachId !== coachId) return;
    const nextStep = coach.plan.findIndex((_, index) => !done.includes(index));
    if (nextStep >= 0) state.planStep = nextStep;
    typing(false);
    showFeedback(data);
    addMessage('assistant', assistantMessage.text, assistantMessage.meta, { id: assistantMessage.id });
    renderPlan();
  } catch (error) {
    typing(false);
    if (error.status !== 401 && error.status !== 403 && state.coachId === coachId) {
      addMessage('assistant', 'Entschuldigung, gerade ist etwas schiefgelaufen. Versuchen wir es gleich noch einmal?', '', { autoSpeak: false });
      input.value = text;
      resizeInput();
      toast(error.message);
    }
  } finally {
    setBusy(false);
    resizeInput();
    input.focus({ preventScroll: true });
  }
}
window.addEventListener('resize', () => resizeInput());

// ───────────────────────── events ─────────────────────────
send.onclick = () => sendText();
input.oninput = () => { resizeInput(); if (!input.value.trim()) state.spokenInput = false; };
input.onkeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendText(); }
};
$('#micBtn').onclick = toggleMic;

document.addEventListener('click', async (event) => {
  const target = event.target;
  const favorite = target.closest('[data-favorite]');
  if (favorite) { event.preventDefault(); setFavoriteRating(favorite.dataset.favorite, favorite.dataset.stars); return; }
  const speakMsg = target.closest('[data-speak-msg]');
  if (speakMsg) {
    const id = speakMsg.dataset.speakMsg;
    if (speech.playingId === id) stopSpeech();
    else speakText(target.closest('.message')?.dataset.text || '', { id });
    return;
  }
  const speakButton = target.closest('[data-speak]');
  if (speakButton) { speakText(speakButton.dataset.speak); return; }
  const hintButton = target.closest('[data-hint]');
  if (hintButton) { showHint(hintButton.dataset.hint); return; }
  const usePattern = target.closest('[data-use-text]');
  if (usePattern) {
    input.value = usePattern.dataset.useText;
    $('#hintOverlay').classList.add('hidden');
    resizeInput();
    input.focus();
    return;
  }
  const closeTool = target.closest('[data-close-tool]');
  if (closeTool) { $(`#${closeTool.dataset.closeTool}`).classList.add('hidden'); return; }
  const deleteCoach = target.closest('[data-delete-coach]');
  if (deleteCoach) {
    event.stopPropagation();
    const coach = state.coaches.find((item) => item.id === deleteCoach.dataset.deleteCoach);
    if (!coach) return;
    if (state.coaches.length <= 1) { toast('برای ادامهٔ گفتگو باید دست‌کم یک مربی در فهرست بماند'); return; }
    if (await askDeleteCoach(coach)) {
      if (coach.custom) deleteItems('customCoaches', [coach.id]);
      else mutate((data) => { data.hiddenCoaches = [...new Set([...data.hiddenCoaches, coach.id])]; });
      delete store.data.profiles[coach.id];
      state.coaches = state.coaches.filter((item) => item.id !== coach.id);
      if (state.coachId === coach.id) { state.coachId = state.coaches[0]?.id || ''; prefs().coachId = state.coachId; }
      renderCoachSwitcher();
      renderCoach();
    }
    return;
  }
  const coachButton = target.closest('[data-coach]');
  if (coachButton) {
    if (state.busy) { toast('یک لحظه صبر کنید تا پاسخ برسد'); return; }
    stopSpeech();
    state.coachId = coachButton.dataset.coach;
    prefs().coachId = state.coachId;
    scheduleSave();
    state.planStep = 0;
    renderCoach();
    return;
  }
  const planButton = target.closest('[data-plan-step]');
  if (planButton) {
    state.planStep = Number(planButton.dataset.planStep);
    renderPlan();
    input.placeholder = `${currentCoach().plan[state.planStep]} — antworte auf Deutsch…`;
    input.focus();
    return;
  }
  const deleteMistake = target.closest('[data-delete-mistake]');
  if (deleteMistake) { deleteItems('mistakes', [deleteMistake.dataset.deleteMistake]); renderMistakes(); return; }
  const deleteFavorite = target.closest('[data-delete-favorite]');
  if (deleteFavorite) { deleteItems('favorites', [deleteFavorite.dataset.deleteFavorite]); renderFavorites(); return; }
  const listenPlay = target.closest('[data-listen-play]');
  if (listenPlay) { playListening(listenPlay); return; }
  const listenRetry = target.closest('[data-listen-retry]');
  if (listenRetry) { renderListeningCard(); ensureListening().catch((error) => toast(error.message)); return; }
  const listenReveal = target.closest('[data-listen-reveal]');
  if (listenReveal) {
    const profile = getProfile('listening');
    if (!profile.listening) return;
    const tried = profile.conversation.some((message) => message.role === 'user');
    if (!profile.listening.revealed && !tried && !confirm('Erst zusammenfassen bringt mehr. Transkript trotzdem zeigen?')) return;
    saveProfile({ listening: { ...profile.listening, revealed: !profile.listening.revealed } }, 'listening');
    renderListeningCard();
  }
});
document.addEventListener('change', (event) => {
  const rate = event.target.closest?.('[data-listen-rate]');
  if (rate) {
    const audio = rate.closest('.listen-card').querySelector('[data-listen-audio]');
    if (audio) audio.playbackRate = Number(rate.value) || 1;
  }
});

$('#translatorFab').onclick = () => { $('#translatorOverlay').classList.remove('hidden'); $('#translatorInput').focus(); };
$('#translateBtn').onclick = translateText;
$('#translatorInput').onkeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); translateText(); }
};
document.querySelectorAll('.tool-overlay:not(.gate)').forEach((overlay) => {
  overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.classList.add('hidden'); });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.tool-overlay:not(.hidden):not(.gate)').forEach((overlay) => overlay.classList.add('hidden'));
});
$('#level').onchange = () => {
  saveProfile({ level: $('#level').value });
  renderPlan();
  if (state.coachId === 'listening') { renderListeningCard(); ensureListening().catch((error) => toast(error.message)); }
};
$('#resetPlanBtn').onclick = () => { saveProfile({ done: [], messages: 0 }); state.planStep = 0; renderPlan(); toast('Tagesplan wurde zurückgesetzt'); };

function switchView(view) {
  const showMistakes = view === 'mistakes';
  const showFavorites = view === 'favorites';
  document.querySelectorAll('.learning-view').forEach((element) => element.classList.toggle('view-hidden', showMistakes || showFavorites));
  $('#mistakesView').classList.toggle('view-hidden', !showMistakes);
  $('#favoritesView').classList.toggle('view-hidden', !showFavorites);
  $('#translatorFab').classList.toggle('view-hidden', showMistakes || showFavorites);
  document.querySelectorAll('.view-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  if (store.data && prefs().view !== view) { prefs().view = view; scheduleSave(3000); }
  if (showMistakes) renderMistakes();
  if (showFavorites) renderFavorites();
}
document.querySelectorAll('.view-tab').forEach((tab) => { tab.onclick = () => switchView(tab.dataset.view); });
document.querySelectorAll('[data-amk-open]').forEach((link) => { link.onclick = (event) => { event.preventDefault(); amkOpenSite(link.dataset.amkOpen); }; });
window.addEventListener('storage', (event) => {
  if (event.key === 'amookht_theme') document.documentElement.classList.toggle('amk-light', event.newValue !== 'dark');
  if (event.key === 'amookht_accent') { try { const c = JSON.parse(event.newValue || 'null'); if (c?.[0]) { document.documentElement.style.setProperty('--amk-a', c[0]); document.documentElement.style.setProperty('--amk-b', c[1] || c[0]); } } catch (_) { /* ignore */ } }
});
$('#mistakeFilter').onchange = renderMistakes;
$('#favoriteFilter').onchange = renderFavorites;
$('#clearMistakesBtn').onclick = () => {
  if (!confirm('Gesamten Fehlerspeicher löschen?')) return;
  deleteItems('mistakes', getMistakes().map((item) => item.id));
  renderMistakes();
};
$('#clearFavoritesBtn').onclick = () => {
  if (!confirm('Alle Favoriten löschen?')) return;
  deleteItems('favorites', getFavorites().map((item) => item.id));
  renderFavorites();
};

$('#coachBuilderForm').onsubmit = (event) => {
  event.preventDefault();
  const plan = $('#builderPlan').value.split(/[,،]/).map((step) => step.trim()).filter(Boolean);
  if (plan.length !== 5) { toast('Bitte genau fünf Schritte für den Tagesplan eingeben'); return; }
  const name = $('#builderName').value.trim();
  const role = $('#builderRole').value.trim();
  const focus = $('#builderFocus').value.trim();
  const instructions = $('#builderInstructions').value.trim();
  const coach = {
    id: `custom-${uid().replaceAll('-', '').slice(0, 12)}`,
    custom: true,
    name, role, focus, plan,
    initials: $('#builderInitials').value.trim().toUpperCase().slice(0, 3),
    accent: $('#builderColor').value,
    voice: $('#builderVoice').value,
    intro: `Dein persönlicher Coach für ${focus}.`,
    greeting: $('#builderGreeting').value.trim(),
    prompt: `Du bist ${name}, ${role}. Deine Persönlichkeit ist ${$('#builderPersonality').value}. Dein Hauptlernziel mit dem Lernenden ist: ${focus}. Korrekturstil: ${$('#builderCorrection').value}. Führe aktive Übungen durch, passe Sprache und Aufgaben an das Niveau an und stelle pro Antwort höchstens eine klare Frage.${instructions ? ` Zusätzliche Wünsche: ${instructions}` : ''}`.slice(0, 2400),
  };
  const level = $('#builderLevel').value;
  mutate((data) => { data.customCoaches = [...data.customCoaches, coach].slice(-20); data.profiles[coach.id] = freshProfile(level); data.prefs.coachId = coach.id; });
  state.coaches.push(coach);
  state.coachId = coach.id;
  $('#coachBuilderOverlay').classList.add('hidden');
  $('#coachBuilderForm').reset();
  renderCoachSwitcher();
  renderCoach();
  toast(`${name} wurde erstellt`);
};

$('#newLearningDayBtn').onclick = async () => {
  if (!confirm('Neues Szenario starten? Die heutigen Gespräche und Fortschritte aller Coaches werden zurückgesetzt.')) return;
  stopSpeech();
  const variant = getScenarioVariant() + 1;
  mutate((data) => {
    data.scenarioVariant = { date: today(), variant };
    state.coaches.forEach((coach) => { data.profiles[coach.id] = freshProfile(data.profiles[coach.id]?.level); });
  });
  state.planStep = 0;
  $('#feedback').classList.add('hidden');
  try {
    state.scenario = await getJson(`daily-scenario?date=${encodeURIComponent(today())}&variant=${variant}`);
  } catch (error) { toast(error.message); }
  renderCoach();
  toast('Neues Szenario gestartet');
};
$('#closeFeedback').onclick = () => $('#feedback').classList.add('hidden');
$('#naturalText').onclick = (event) => { const text = event.currentTarget.dataset.speak; if (text) speakText(text); };
$('#resetBtn').onclick = () => {
  if (state.busy) return;
  stopSpeech();
  const listening = state.coachId === 'listening' ? getProfile().listening : null;
  saveProfile({ session: uid(), conversation: [], listening });
  conversation.innerHTML = '';
  $('#feedback').classList.add('hidden');
  startConversation(currentCoach());
  toast('گفتگوی جدید شروع شد');
};

// voice settings
function renderVoicePrefs() {
  $('#prefAutoSpeak').checked = !!prefs().autoSpeak;
  $('#prefAutoSend').checked = !!prefs().voiceAutoSend;
  $('#prefSpeed').value = String(prefs().speed || 1);
  $('#voiceNote').textContent = prefs().autoSpeak ? '🔊 Antworten werden automatisch vorgelesen' : '🔇 Automatisches Vorlesen aus';
}
$('#voiceSettingsBtn').onclick = () => $('#voicePanel').classList.toggle('hidden');
$('#prefAutoSpeak').onchange = (event) => { prefs().autoSpeak = event.target.checked; if (!event.target.checked) stopSpeech(); scheduleSave(); renderVoicePrefs(); };
$('#prefAutoSend').onchange = (event) => { prefs().voiceAutoSend = event.target.checked; scheduleSave(); };
$('#prefSpeed').onchange = (event) => { prefs().speed = Number(event.target.value) || 1; scheduleSave(); speakText('So klingt das neue Sprechtempo.'); };

// ───────────────────────── boot ─────────────────────────
async function health() {
  try {
    const data = await (await fetch('api/health')).json();
    $('#statusBadge').classList.toggle('online', data.ok);
    $('#statusBadge').lastChild.textContent = data.ok ? ' Bereit' : ' AI nicht bereit';
  } catch (_) {
    $('#statusBadge').classList.remove('online');
    $('#statusBadge').lastChild.textContent = ' Offline';
  }
}

async function boot() {
  if (!tokens()?.access_token && !tokens()?.refresh_token) { showGate('login'); return; }
  try {
    state.me = await getJson('me');
    await loadState();
  } catch (error) {
    if (error.status !== 401 && error.status !== 403) {
      toast(error.message);
      conversation.innerHTML = `<article class="message assistant"><div class="bubble"><p dir="rtl">اتصال برقرار نشد: ${escapeHtml(error.message)}</p><button type="button" class="listen-reveal" onclick="location.reload()">دوباره</button></div></article>`;
    }
    return;
  }
  document.body.classList.remove('booting');
  $('#userName').textContent = state.me.name || '';
  applyPendingImport();
  renderVoicePrefs();
  await loadCoaches();
  amkMigrate();
  switchView('learning');
  refreshFavoriteButtons();
  let activeDate = today();
  setInterval(() => {
    if (today() === activeDate) return;
    activeDate = today();
    state.planStep = 0;
    getJson(`daily-scenario?date=${encodeURIComponent(activeDate)}&variant=0`).then((scenario) => {
      state.scenario = scenario;
      renderCoach();
      toast('Ein neues TestDaF-Szenario ist bereit');
    }).catch(() => {});
  }, 60000);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushState();
  else pullRemote();
});
window.addEventListener('pagehide', () => { flushState(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
health();
setInterval(health, 60000);
if (!HANDOFF) boot().catch((error) => toast(error.message));
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin || event.data?.type !== 'dcoach:hidden') return;
  stopSpeech();
  if (rec.recorder?.state === 'recording') rec.recorder.stop();
  if (store.data) flushState();
});
