// Amookht for Windows v4 — native app entry (milestone 1: foundation).
//
// Same frame as v3 (title bar, NavigationView sidebar, Ctrl+K palette, status
// bar), but the pages are native and read/write the account state directly
// through the site's own sync protocol (core/store.js).

import { $, $$, esc, svg, ICONS, toast } from './core/ui.js';
import { t, setLang, lang, fillStatic, LANG_NAMES, pick } from './core/i18n.js';
import { createStore } from './core/store.js';
import { readLook, applyLook, APP_ACCENTS, ACCENT_NAMES } from './core/theme.js';
import { loadPack, PACK_NAMES } from './core/content.js';
import { PAGES, ACCOUNT_PAGE, findPage, renderPage } from './pages/registry.js';
import { createEngine } from './core/engine.js';
import { createSiteShim } from './core/site-shim.js';
import { createOwnerFiles } from './core/owner-files.js';
import { createOwnerPacks } from './core/owner-packs.js';
import * as toolTutor from './tools/tutor.js';
import * as toolTranslate from './tools/translate.js';
import * as toolStruct from './tools/struct.js';
import * as toolSentparts from './tools/sentparts.js';
import * as toolMediakeys from './tools/mediakeys.js';
import * as toolTabnext from './tools/tabnext.js';
import * as toolCoachBridge from './tools/coach-bridge.js';
import * as toolLastseen from './tools/lastseen.js';
import * as toolAiAdmin from './tools/ai-admin.js';
import * as toolOwnerChat from './tools/owner-chat.js';

const bridge = window.amookht;
const ZOOMS = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75];

const app = {
  version: '',
  siteUrl: '',
  settings: null,
  account: { role: 'normal', premium: false, admin: false, owner: false, name: '', email: '', avatar: '' },
  page: null,
  pageEl: null,
  backStack: [],
  forwardStack: [],
  zoom: 1,
  compactLocal: false,
  widgetOn: false,
  online: navigator.onLine,
  sync: { status: 'idle', ws: false },
  lastLook: '',
};

// One plan engine per signed-in session (created on first use, dropped on sign-out).
let engine = null;
const getEngine = () => {
  if (!engine) engine = createEngine({ store, account: () => app.account, loadPack: (name) => loadPack(bridge, name), bridge });   // NO-DAYFILE / NO-OWNERPACKS (site 2026-11-19): no day file and no pack archive any more
  return engine;
};

const store = createStore(bridge, {
  onStatus: (status) => {
    app.sync = status;
    renderStatus();
  },
});
// owner day files (owner account only; a no-op for everyone else)
const ownerFiles = createOwnerFiles({ store, engine: () => getEngine(), account: () => app.account });
// stored content packs («افزودن دستی محتوا», owner account only): list/load/delete via /v1/owner-packs
const ownerPacks = createOwnerPacks({
  store,
  engine: () => getEngine(),
  account: () => app.account,
  api: (path, opts) => bridge.api(path, opts),
  files: { open: () => bridge.packOpenFile(), save: (payload) => bridge.packSaveFile(payload) },
});


// For tests and debugging: window.__amk.store / .loadPack
window.__amk = { app, store, loadPack: (name) => loadPack(bridge, name), packs: PACK_NAMES, get engine() { return getEngine(); } };

/* ─────────────────────────────── panes ─────────────────────────────── */

function showPane(name) {
  $('#app').dataset.view = name;
  $$('[data-pane]').forEach((node) => {
    node.hidden = node.dataset.pane !== name;
  });
}

/* ─────────────────────────────── look ─────────────────────────────── */

function applyStateLook() {
  const look = readLook(store.data);
  const key = JSON.stringify(look);
  if (key === app.lastLook) return look;
  const previous = app.lastLook ? JSON.parse(app.lastLook) : null;
  app.lastLook = key;
  applyLook(look);
  if (!previous || previous.lang !== look.lang) {
    setLang(look.lang);
    applyLanguage();
  }
  if (!previous || previous.sidebarCompact !== look.sidebarCompact) applyCompact();
  // Keep the native windows (widget, settings, title bar) in step.
  const accentToSite = look.accent;
  bridge.sitePrefs({ dark: look.dark, accent: accentToSite, lang: look.lang }).catch(() => {});
  return look;
}

function applyLanguage() {
  fillStatic();
  $('#search-label').textContent = t('search');
  $('#palette-input').placeholder = t('searchPlaceholder');
  $('#btn-lang').textContent = { fa: 'فا', en: 'EN', de: 'DE' }[lang()];
  $('#btn-lang').title = t('langMenu');
  $('#btn-back').title = t('back');
  $('#btn-forward').title = t('forward');
  $('#btn-reload').title = t('reload') + ' (F5)';
  $('#btn-sidebar').title = t('sidebar') + ' (Ctrl+B)';
  $('#btn-theme').title = t('themeToggle');
  renderNav();
  renderAccount();
  renderStatus();
  if (app.page) openPage(app.page.id, { replace: true, keepScroll: true });
}

const SITE_DESKTOP_MIN = 760;
function applyCompact() {
  const shell = $('#shell');
  const look = readLook(store.data);
  const compact = look.sidebarCompact;
  const auto = !compact && (shell.clientWidth || window.innerWidth) - 236 < SITE_DESKTOP_MIN;
  shell.classList.toggle('is-compact', compact || auto);
}
window.addEventListener('resize', () => applyCompact());

/* ─────────────────────────────── navigation ─────────────────────────────── */

function visiblePages() {
  return PAGES.filter((page) => !page.admin || app.account.admin);
}

// Sidebar (v4 design): the site's order, grouped under small headings, a coloured icon tile per section,
// and a compact «today» card on top (plan progress, opens the plan).
const NAV_GROUPS = [
  { id: 'learn', label: ['یادگیری', 'Learning', 'Lernen'], pages: ['dashboard', 'errorbook', 'favorites', 'library'] },
  { id: 'practice', label: ['تمرین و آزمون', 'Practice & exam', 'Üben & Prüfung'], pages: ['deutschCoach', 'testdafSim'] },
  { id: 'more', label: ['پیشرفت و تنظیمات', 'Progress & settings', 'Fortschritt & Einstellungen'], pages: ['history', 'appSettings', 'adminUsers'] },
];
const NAV_HUE = { dashboard: '#6366f1', errorbook: '#10b981', favorites: '#f43f5e', library: '#f59e0b', deutschCoach: '#0ea5e9', testdafSim: '#8b5cf6', history: '#14b8a6', appSettings: '#64748b', adminUsers: '#ef4444' };
const navL = (arr) => (lang() === 'fa' ? arr[0] : lang() === 'en' ? arr[1] : arr[2]);
function todayCard(data) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const d = new Date(); const k = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const plan = data.plan && data.plan.date === k ? data.plan : null;
  if (!plan || !Array.isArray(plan.activities) || !plan.activities.length) return '';
  const total = plan.activities.length; const done = plan.activities.filter((a) => (data.completed || []).includes(a.id)).length;
  const pct = Math.round((done / total) * 100);
  const num = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]) : String(n));
  const free = data.studyMode === 'free';
  const title = free ? navL(['مطالعه آزاد', 'Free study', 'Freies Lernen']) : navL(['برنامه امروز', "Today's plan", 'Heutiger Plan']);
  const sub = free ? navL(['تمرین‌های سبک، بدون زمان‌بندی', 'Light exercises, no timing', 'Leichte Übungen']) : done >= total ? navL(['همه انجام شد 🎉', 'All done 🎉', 'Alles erledigt 🎉']) : `${num(done)} / ${num(total)} ${navL(['تمرین', 'exercises', 'Übungen'])}`;
  return `<button type="button" class="nav-today" data-nav="dashboard" style="--p:${free ? 100 : pct}"><span class="nav-today-ring"><b>${free ? '🌿' : num(pct) + '%'}</b></span><span class="nav-today-txt"><b>${esc(title)}</b><small>${esc(sub)}</small></span></button>`;
}
function renderNav() {
  const data = store.data || {};
  const active = app.page ? app.page.id : '';
  const pages = visiblePages();
  const index = new Map(pages.map((p, i) => [p.id, i]));
  const item = (page) => {
    const i = index.get(page.id);
    const count = page.count ? page.count(data) : 0;
    const tail = page.premium && !app.account.premium
      ? '<span class="nav-pro">PRO</span>'
      : count ? `<span class="nav-badge">${esc(count)}</span>` : '';
    return `<button class="nav-item${active === page.id ? ' is-active' : ''}" type="button" data-nav="${page.id}" style="--hue:${NAV_HUE[page.id] || 'var(--accent)'}" title="${esc(t(page.label))}${i < 9 ? ' (Ctrl+' + (i + 1) + ')' : ''}"><span class="nav-ico">${svg(page.icon)}</span><span class="nav-label">${esc(t(page.label))}</span>${tail}</button>`;
  };
  const grouped = new Set(NAV_GROUPS.flatMap((g) => g.pages));
  const groups = NAV_GROUPS.map((g) => { const list = pages.filter((p) => g.pages.includes(p.id)); return list.length ? `<div class="nav-group"><p class="nav-head">${esc(navL(g.label))}</p>${list.map(item).join('')}</div>` : ''; }).join('');
  const rest = pages.filter((p) => !grouped.has(p.id)).map(item).join('');
  $('#nav').innerHTML = todayCard(data) + groups + rest;
}

function openPage(id, { replace = false, keepScroll = false, fromHistory = false } = {}) {
  const page = findPage(id);
  const view = $('#view');
  const scroll = view.scrollTop;
  if (!replace && !fromHistory && app.page && app.page.id !== page.id) {
    app.backStack.push(app.page.id);
    app.forwardStack = [];
  }
  // Let the page we leave save what is still open (e.g. a note or PDF marks).
  if (app.pageEl && typeof app.pageEl.onLeave === 'function') {
    try { app.pageEl.onLeave(); } catch (error) { console.warn(error); }
  }
  app.page = page;
  const ctx = {
    store,
    bridge,
    account: app.account,
    navigate: (target) => openPage(target),
    signOut: () => signOut(),
    get engine() { return getEngine(); },
    siteOrigin: () => { try { return new URL(app.siteUrl || 'https://learn.tah3in.com').origin; } catch { return 'https://learn.tah3in.com'; } },
    switchToSite: (target) => switchToSite(target),
    loadPack: (name) => loadPack(bridge, name),
    toast,
    setLesson: (api) => { app.lesson = api; },
    ownerFiles: null, // day files removed (site NO-DAYFILE)
    ownerPacks: null, // «افزودن دستی محتوا» removed (site LEAN4 / NO-OWNERPACKS)
    afterDraw: () => afterDraw(),
  };
  const el = renderPage(page, ctx);
  view.replaceChildren(el);
  app.pageEl = el;
  view.scrollTop = keepScroll ? scroll : 0;
  if (!keepScroll) view.focus({ preventScroll: true });
  bridge.setLastSection(page.id).catch(() => {});
  renderNav();
  renderStatus();
  updateHistoryButtons();
  afterDraw();
}

/* ─────────────────────────────── floating tools (milestone 4) ───────────────────────────────
   Study tutor + selection toolbar, translator, structure chips, sentence-part colours, media keys, Tab jump:
   the site's scripts, ported 1:1 (tools/*.js), fed by core/site-shim.js. Installed once after sign-in. */
let toolsInstalled = false;
function installTools() {
  if (toolsInstalled) return;
  toolsInstalled = true;
  const shim = createSiteShim({
    store, bridge,
    account: () => app.account,
    engine: () => getEngine(),
    page: () => (app.page ? app.page.id : ''),
    lesson: () => app.lesson || null,
    navigate: (id) => openPage(id),
    refreshChrome: () => { renderNav(); renderStatus(); },
    applyLook: () => applyStateLook(),
  });
  // the site's word-highlight rail (vendor/amk-word-hl.js) reads the site globals it used to get from #app
  window.S = shim.S;
  window.saveData = shim.saveData;
  window.normalizeFavorite = shim.normalizeFavorite;
  window.hasPremiumAccess = shim.hasPremiumAccess;
  window.authTokens = shim.authTokens;
  [toolTutor, toolTranslate, toolStruct, toolSentparts, toolMediakeys, toolTabnext, toolCoachBridge, toolLastseen, toolAiAdmin, toolOwnerChat].forEach((m) => {
    try { m.install(shim); } catch (error) { console.warn('tool failed to start', error); }
  });
  // the site runs these hooks after every render; pages here also redraw on their own (store changes, clicks),
  // so any change inside the page area triggers them too (debounced; the tools' own edits settle immediately)
  let hookT = null;
  new MutationObserver(() => { clearTimeout(hookT); hookT = setTimeout(afterDraw, 120); }).observe($('#view'), { childList: true, subtree: true });
}
/** The site's render() hook: the tools re-check their state after every page draw. */
function afterDraw() {
  if (!toolsInstalled) return;
  try { window.render(); } catch (error) { console.warn(error); }
}

function updateHistoryButtons() {
  $('#btn-back').disabled = !app.backStack.length;
  $('#btn-forward').disabled = !app.forwardStack.length;
}

function goBack() {
  const target = app.backStack.pop();
  if (!target) return;
  if (app.page) app.forwardStack.push(app.page.id);
  openPage(target, { fromHistory: true });
}

function goForward() {
  const target = app.forwardStack.pop();
  if (!target) return;
  if (app.page) app.backStack.push(app.page.id);
  openPage(target, { fromHistory: true });
}

async function switchToSite(pageId) {
  if (pageId) await bridge.setLastSection(pageId).catch(() => {});
  await store.flush().catch(() => {});
  bridge.setEngine('site');
}

/* ─────────────────────────────── account / status ─────────────────────────────── */

function renderAccount() {
  const a = app.account;
  const name = a.name || (a.email ? a.email.split('@')[0] : '—');
  $('#account-name').textContent = name;
  $('#account-email').textContent = a.email || '';
  const chip = $('#account-role');
  chip.textContent = a.role === 'normal' ? (a.premium ? 'Premium' : t('free')) : t(a.role);
  chip.classList.toggle('is-premium', a.premium);
  const avatar = $('#avatar');
  if (a.avatar && /^data:image\//.test(a.avatar)) {
    if (avatar.dataset.src !== a.avatar) {
      avatar.dataset.src = a.avatar;
      avatar.innerHTML = '';
      const img = document.createElement('img');
      img.alt = '';
      img.src = a.avatar;
      avatar.appendChild(img);
    }
  } else {
    avatar.dataset.src = '';
    avatar.innerHTML = `<span>${esc((name || 'A').trim().charAt(0).toUpperCase() || 'A')}</span>`;
  }
  $('#btn-account').title = t('navAccount');
}

function renderStatus() {
  const dot = $('#status-dot');
  dot.className = 'status-dot';
  const sync = app.sync || {};
  if (!app.online || sync.status === 'offline') {
    dot.classList.add('is-bad');
    $('#status-text').textContent = t('statusOffline');
  } else {
    dot.classList.add(sync.ws ? 'is-ok' : 'is-busy');
    $('#status-text').textContent = t('statusOnline') + (sync.ws ? ' · ' + t('live') : '');
  }
  const syncText = { synced: t('synced'), saving: t('syncing'), local: t('syncLocal'), rejected: t('syncLocal') }[sync.status] || '';
  $('#status-sync').textContent = syncText;
  $('#status-plan').textContent = app.account.premium ? 'Premium' : app.account.email ? t('free') : '';
  $('#status-zoom').textContent = Math.round(app.zoom * 100) + '%';
  $('#status-version').textContent = 'Amookht ' + app.version;
  $('#status-version').dir = 'ltr';
  const title = app.page ? t(app.page.label) : '';
  $('#tb-title').textContent = title;
  document.title = title ? 'Amookht — ' + title : 'Amookht';
  $('#btn-widget').classList.toggle('is-on', app.widgetOn);
  $('#side-widget-toggle').checked = app.widgetOn;
}

async function loadAccount() {
  const result = await bridge.api('/v1/account/me', { method: 'GET' }).catch(() => null);
  const me = result && result.ok ? result.data : null;
  const user = store.get('user') || {};
  const role = me && ['normal', 'premium', 'admin', 'owner'].includes(String(me.access_role).toLowerCase())
    ? String(me.access_role).toLowerCase() : 'normal';
  const email = (me && me.email) || (app.settings && app.settings.email) || '';
  app.account = {
    role,
    premium: me ? !!me.premium_access || ['premium', 'admin', 'owner'].includes(role) : false,
    admin: ['admin', 'owner'].includes(role),
    owner: role === 'owner' && email.trim().toLowerCase() === 'tah3in@gmail.com',
    name: user.name || (me && me.display_name) || '',
    email,
    avatar: user.avatarDataUrl || (me && me.avatar_data_url) || '',
    trialUntil: me && me.trial_until,
    id: (me && (me.user_id || me.id)) || '',
  };
}

/* ─────────────────────────────── palette ─────────────────────────────── */

const palette = { items: [], index: 0 };

function paletteEntries() {
  const look = readLook(store.data);
  const entries = [];
  visiblePages().concat(ACCOUNT_PAGE).forEach((page, index) => {
    entries.push({ group: t('groupPages'), label: t(page.label), icon: page.icon, hint: page.id !== 'settings' && index < 9 ? 'Ctrl+' + (index + 1) : '', run: () => openPage(page.id) });
  });
  entries.push({ group: t('groupLook'), label: look.dark ? t('lightMode') : t('darkMode'), icon: ICONS.moon, run: () => store.set('darkMode', !look.dark) });
  Object.entries(APP_ACCENTS).forEach(([id, [color]]) => {
    entries.push({ group: t('groupLook'), label: t('accentColor') + ': ' + pick(ACCENT_NAMES[id]), swatch: color, on: look.accent === id, run: () => store.set('appSettings.accent', id) });
  });
  Object.entries(LANG_NAMES).forEach(([id, name]) => {
    entries.push({ group: t('groupLook'), label: t('language') + ': ' + name, icon: ICONS.globe, on: look.lang === id, run: () => store.set('uiLanguage', id) });
  });
  entries.push({ group: t('groupApp'), label: t('sidebar'), hint: 'Ctrl+B', icon: ICONS.lines, run: () => runCommand({ action: 'toggle-sidebar' }) });
  entries.push({ group: t('groupApp'), label: t('desktopWidget'), on: app.widgetOn, icon: ICONS.widget, run: () => runCommand({ action: 'toggle-widget' }) });
  entries.push({ group: t('groupApp'), label: t('windowsSettings'), hint: 'Ctrl+,', icon: ICONS.monitor, run: () => bridge.openSettings() });
  entries.push({ group: t('groupApp'), label: t('reload'), hint: 'F5', icon: ICONS.reload, run: () => runCommand({ action: 'reload' }) });
  entries.push({ group: t('groupApp'), label: t('zoomIn'), hint: 'Ctrl +', icon: ICONS.zoomIn, run: () => setZoom(1) });
  entries.push({ group: t('groupApp'), label: t('zoomOut'), hint: 'Ctrl −', icon: ICONS.zoomOut, run: () => setZoom(-1) });
  entries.push({ group: t('groupApp'), label: t('zoomReset'), hint: 'Ctrl 0', icon: ICONS.search, run: () => setZoom(0) });
  entries.push({ group: t('groupApp'), label: t('switchToV3'), icon: ICONS.external, run: () => switchToSite(app.page && app.page.id) });
  entries.push({ group: t('groupApp'), label: t('openBrowser'), icon: ICONS.external, run: () => bridge.openExternal(app.siteUrl) });
  entries.push({ group: t('groupApp'), label: t('signOut'), icon: ICONS.logout, run: () => signOut() });
  return entries;
}

const normalize = (text) => String(text || '').toLowerCase().replace(/[‌\s]+/g, ' ').trim();

function openPalette() {
  closePopover();
  $('#palette').hidden = false;
  $('#palette-input').value = '';
  palette.index = 0;
  renderPalette();
  setTimeout(() => $('#palette-input').focus(), 0);
}

function closePalette() {
  $('#palette').hidden = true;
}

function renderPalette() {
  const query = normalize($('#palette-input').value);
  palette.items = paletteEntries().filter((entry) => !query || normalize(entry.label + ' ' + entry.group).includes(query));
  palette.index = Math.min(palette.index, Math.max(0, palette.items.length - 1));
  if (!palette.items.length) {
    $('#palette-list').innerHTML = `<div class="palette-empty">${esc(t('noResults'))}</div>`;
    return;
  }
  let group = '';
  $('#palette-list').innerHTML = palette.items.map((entry, index) => {
    const head = entry.group !== group ? `<div class="palette-group">${esc((group = entry.group))}</div>` : '';
    const icon = entry.swatch ? `<span class="pi-swatch" style="background:${entry.swatch}"></span>` : svg(entry.icon || '');
    return `${head}<button class="palette-item${index === palette.index ? ' is-sel' : ''}" type="button" data-pal="${index}">${icon}<span>${esc(entry.label)}</span><span class="pi-hint">${esc(entry.on ? '✓' : entry.hint || '')}</span></button>`;
  }).join('');
  const selected = $('.palette-item.is-sel');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function runPalette(index) {
  const entry = palette.items[index];
  closePalette();
  if (entry) entry.run();
}

/* ─────────────────────────────── popovers ─────────────────────────────── */

function openPopover(anchor, html) {
  const pop = $('#popover');
  pop.innerHTML = html;
  pop.hidden = false;
  const rect = anchor.getBoundingClientRect();
  const width = pop.offsetWidth;
  const height = pop.offsetHeight;
  let left = lang() === 'fa' ? rect.right - width : rect.left;
  let top = rect.bottom + 6;
  if (top + height > window.innerHeight - 8) top = rect.top - height - 6;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  pop.style.left = left + 'px';
  pop.style.top = Math.max(8, top) + 'px';
}

function closePopover() {
  $('#popover').hidden = true;
}

/* ─────────────────────────────── commands ─────────────────────────────── */

function setZoom(step) {
  let next;
  if (step === 0) next = 1;
  else {
    const index = ZOOMS.findIndex((value) => value >= app.zoom - 0.001);
    const at = index === -1 ? ZOOMS.length - 1 : index;
    next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, at + step))];
  }
  app.zoom = next;
  $('#view').style.zoom = String(next);
  bridge.layout({ siteZoom: next }).catch(() => {});
  renderStatus();
}

async function toggleWidget() {
  const result = await bridge.setWidgetEnabled(!app.widgetOn).catch(() => null);
  if (!result) return;
  app.widgetOn = !!result.widgetEnabled;
  renderStatus();
  toast(app.widgetOn ? t('widgetOn') : t('widgetOff'));
}

function runCommand(command) {
  if (!command) return;
  const inApp = $('#app').dataset.view === 'main';
  switch (command.action) {
    case 'palette':
      if (!inApp) return;
      if ($('#palette').hidden) openPalette();
      else closePalette();
      break;
    case 'palette-close':
      closePalette();
      break;
    case 'toggle-sidebar':
      store.set('appSettings.sidebarCompact', !readLook(store.data).sidebarCompact);
      break;
    case 'nav-index': {
      const page = visiblePages()[command.index];
      if (page && inApp) openPage(page.id);
      break;
    }
    case 'back':
      goBack();
      break;
    case 'forward':
      goForward();
      break;
    case 'reload':
      if (inApp) {
        store.resync().catch(() => {});
        loadAccount().then(() => {
          renderAccount();
          renderNav();
        });
        if (app.page) openPage(app.page.id, { replace: true, keepScroll: true });
      }
      break;
    case 'zoom':
      setZoom(command.step);
      break;
    case 'zoom-reset':
      setZoom(0);
      break;
    case 'toggle-dark':
      store.set('darkMode', !readLook(store.data).dark);
      break;
    case 'toggle-widget':
      toggleWidget();
      break;
    case 'windows-settings':
      bridge.openSettings();
      break;
    default:
      break;
  }
}

/* ─────────────────────────────── session ─────────────────────────────── */

function resetToAuth(message) {
  if (engine) { engine.stopTimers(); engine = null; }
  closePalette();
  closePopover();
  store.stop();
  app.page = null;
  app.backStack = [];
  app.forwardStack = [];
  $('#view').replaceChildren();
  $('#stage-cover').hidden = false;
  showPane('auth');
  const error = $('#login-error');
  if (message) {
    error.textContent = message;
    error.hidden = false;
  }
  setTimeout(() => $('#login-email').focus(), 60);
}

async function enterApp(target) {
  showPane('main');
  $('#stage-cover').hidden = false;
  $('#stage-error').hidden = true;
  applyCompact();
  try {
    await store.start();
  } catch (error) {
    $('#stage-cover').hidden = true;
    $('#stage-error').hidden = false;
    renderStatus();
    return;
  }
  await loadAccount();
  applyStateLook();
  renderAccount();
  renderNav();
  installTools();
  openPage(target || 'dashboard', { replace: true });
  $('#stage-cover').hidden = true;
  // Warm the lesson packs in the background (cached on disk after the first time).
  setTimeout(() => {
    ['testdaf', 'grammar', 'games'].forEach((name) => loadPack(bridge, name).catch(() => {}));
  }, 1500);
}

async function signOut() {
  await store.flush().catch(() => {});
  await bridge.logout().catch(() => {});
  resetToAuth(t('signedOut'));
}

async function login(email, password) {
  const button = $('#login-submit');
  const error = $('#login-error');
  error.hidden = true;
  button.disabled = true;
  button.querySelector('span').textContent = t('signingIn');
  try {
    const result = await bridge.login({ email, password });
    if (!result || !result.ok) {
      const info = (result && result.error) || {};
      error.textContent = info.code === 'network_error' || info.code === 'timeout' ? t('networkError') : info.message || t('invalidCredentials');
      error.hidden = false;
      return;
    }
    $('#login-password').value = '';
    await enterApp('dashboard');
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = t('signIn');
  }
}

/* ─────────────────────────────── updates (4.1) ─────────────────────────────── */
// The main process checks the site for a newer version, downloads it in the background and installs it on quit;
// this chip shows the progress and lets the user restart at once.
function renderUpdate(u) {
  const el = $('#status-update'); if (!el || !u) return;
  const num = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]) : String(n));
  const L3 = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);
  el.hidden = !['downloading', 'ready'].includes(u.status);
  el.classList.toggle('is-ready', u.status === 'ready');
  el.textContent = u.status === 'ready' ? `⟳ ${L3(`نسخهٔ ${num(u.version)} آماده است · راه‌اندازی دوباره`, `Version ${u.version} ready · restart`, `Version ${u.version} bereit · neu starten`)}` : `⬇ ${L3('دریافت نسخهٔ جدید', 'Downloading update', 'Update wird geladen')} ${num(u.progress || 0)}%`;
  if (u.status === 'ready' && !renderUpdate.told) { renderUpdate.told = true; toast(L3(`نسخهٔ ${num(u.version)} آموخت دریافت شد؛ با بستن برنامه یا دکمهٔ پایین صفحه نصب می‌شود.`, `Amookht ${u.version} is ready; it installs when you quit or from the button in the status bar.`, `Amookht ${u.version} ist bereit; die Installation erfolgt beim Beenden oder über die Statusleiste.`), 'ok'); }
}
if (bridge.onUpdate) {
  bridge.onUpdate(renderUpdate);
  bridge.updateState().then(renderUpdate).catch(() => {});
  document.addEventListener('click', (event) => { if (event.target.closest('#status-update.is-ready')) bridge.updateInstall(); });
}

/* ─────────────────────────────── events ─────────────────────────────── */

store.subscribe((paths, source) => {
  // every change, also local ones from other pages (notebook, favourites …): keys the engine has not edited are
  // refreshed from the store, so a later engine save never writes back a stale copy (its own saves are no-ops here)
  if (engine) engine.onRemote(paths);
  void source;
  applyStateLook();
  if (paths.includes('*') || paths.includes('user')) {
    const user = store.get('user') || {};
    if (user.name) app.account.name = user.name;
    if (user.avatarDataUrl) app.account.avatar = user.avatarDataUrl;
    renderAccount();
  }
  if (paths.some((p) => p === '*' || ['favorites', 'history', 'plan', 'completed', 'studyMode', 'uiLanguage'].includes(p))) renderNav();
  if (app.pageEl && typeof app.pageEl.onStoreChange === 'function') app.pageEl.onStoreChange(paths);
});

document.addEventListener('click', (event) => {
  const pop = event.target.closest('[data-pop]');
  if (pop) {
    const [kind, value] = pop.dataset.pop.split(':');
    closePopover();
    if (kind === 'lang') store.set('uiLanguage', value);
    else if (kind === 'nav') openPage(value);
    else if (kind === 'winsettings') bridge.openSettings();
    else if (kind === 'v3') switchToSite(app.page && app.page.id);
    else if (kind === 'signout') signOut();
    return;
  }
  if (!event.target.closest('#popover')) closePopover();
  const nav = event.target.closest('[data-nav]');
  if (nav) {
    openPage(nav.dataset.nav);
    return;
  }
  const pal = event.target.closest('[data-pal]');
  if (pal) {
    runPalette(Number(pal.dataset.pal));
    return;
  }
  const cmd = event.target.closest('[data-cmd]');
  if (!cmd) return;
  const action = cmd.dataset.cmd;
  if (action === 'lang-menu') {
    openPopover(cmd, Object.entries(LANG_NAMES).map(([id, name]) => `<button type="button" data-pop="lang:${id}" class="${lang() === id ? 'is-on' : ''}">${esc(name)}</button>`).join(''));
  } else if (action === 'account-menu') {
    const a = app.account;
    openPopover(cmd, `
      <div class="popover-head"><b>${esc(a.name || '—')}</b><small dir="ltr">${esc(a.email || '')}</small></div>
      <button type="button" data-pop="nav:settings">${svg(ICONS.account)}${esc(t('navAccount'))}</button>
      <button type="button" data-pop="nav:appSettings">${svg(ICONS.settings)}${esc(t('navAppSettings'))}</button>
      <button type="button" data-pop="winsettings">${svg(ICONS.monitor)}${esc(t('windowsSettings'))}</button>
      <button type="button" data-pop="v3">${svg(ICONS.external)}${esc(t('switchToV3'))}</button>
      <hr />
      <button type="button" data-pop="signout" class="is-danger">${svg(ICONS.logout)}${esc(t('signOut'))}</button>`);
  } else runCommand({ action });
});

$('#palette-input').addEventListener('input', () => {
  palette.index = 0;
  renderPalette();
});
$('#palette-input').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    palette.index = (palette.index + delta + palette.items.length) % Math.max(1, palette.items.length);
    renderPalette();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    runPalette(palette.index);
  } else if (event.key === 'Escape') closePalette();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePopover();
    if (!$('#palette').hidden) closePalette();
  }
  // Page shortcuts (e.g. Space / 1–4 in a review) when no dialog or palette is open.
  if (event.defaultPrevented || !$('#palette').hidden || document.querySelector('.dialog-shade')) return;
  if (app.pageEl && typeof app.pageEl.onKey === 'function' && app.pageEl.onKey(event)) event.preventDefault();
});

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  if (!email || !password) {
    $('#login-error').textContent = t('invalidCredentials');
    $('#login-error').hidden = false;
    return;
  }
  await login(email, password);
});
$('#open-site-login').addEventListener('click', () => bridge.openExternal(app.siteUrl || 'https://learn.tah3in.com/'));
$('#toggle-password').addEventListener('click', () => {
  const input = $('#login-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

window.addEventListener('online', () => {
  app.online = true;
  renderStatus();
  if (!$('#stage-error').hidden) enterApp(app.page ? app.page.id : 'dashboard');
});
window.addEventListener('offline', () => {
  app.online = false;
  renderStatus();
});

/* ─────────────────────────────── boot ─────────────────────────────── */

async function boot() {
  const info = await bridge.session();
  app.version = info.version || '';
  app.siteUrl = info.siteUrl || '';
  app.settings = { ...(info.settings || {}), email: info.email };
  app.widgetOn = !!(info.settings && info.settings.widgetEnabled);
  app.zoom = Number(info.siteZoom) || 1;
  $('#view').style.zoom = String(app.zoom);

  // First paint with the stored look, until the account state arrives.
  const accent = { indigo: 'blue', violet: 'violet', teal: 'emerald', amber: 'amber', rose: 'rose' }[app.settings.accent] || 'violet';
  const dark = app.settings.theme === 'light' ? false : app.settings.theme === 'dark' ? true : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyLook({ ...readLook({}), accent, dark });
  setLang(app.settings.lang || 'fa');
  applyLanguage();

  bridge.onSettingsChanged((settings) => {
    app.widgetOn = !!settings.widgetEnabled;
    renderStatus();
  });
  bridge.onSessionChanged((next) => {
    if (!next.hasSession && $('#app').dataset.view === 'main') resetToAuth(t('sessionExpired'));
  });
  bridge.onNavigate((section) => {
    if ($('#app').dataset.view === 'main') openPage(section);
  });
  bridge.onCommand((command) => runCommand(command));
  // Theme/accent/language changed in the native settings window → save to the account.
  bridge.onSiteApply((prefs) => {
    if (!store.ready || !prefs) return;
    if (typeof prefs.dark === 'boolean') store.set('darkMode', prefs.dark);
    if (prefs.accent && APP_ACCENTS[prefs.accent]) store.set('appSettings.accent', prefs.accent);
    if (prefs.lang) store.set('uiLanguage', prefs.lang);
  });

  if (info.hasSession) await enterApp(info.lastSection || 'dashboard');
  else {
    showPane('auth');
    setTimeout(() => $('#login-email').focus(), 60);
  }
}

boot().catch((error) => {
  console.error(error);
  showPane('auth');
  const node = $('#login-error');
  node.textContent = (error && error.message) || t('loadFailed');
  node.hidden = false;
});
