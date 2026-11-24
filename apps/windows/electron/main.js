'use strict';

/**
 * Amookht — Windows desktop application (main process).
 *
 * The main window is a native, local UI (src/app.html): it opens straight into the
 * sign-in screen, then loads plans, vocabulary, grammar drills, the study tutor,
 * the library and progress reports from the real Amookht API. Nothing from the
 * marketing site is rendered at startup, which keeps launch time and memory low.
 * The desktop widget, the native settings window, tray/menu integration and the
 * encrypted session stay part of the same application.
 */

const {
  app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, safeStorage, shell, screen,
  session, dialog, Notification, globalShortcut, nativeTheme, protocol, net,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

// v4 native UI (src/native, ES modules) and cached lesson content are served from
// a private scheme: amookht://app/… and amookht://content/…
protocol.registerSchemesAsPrivileged([
  { scheme: 'amookht', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// Which UI the main window runs: 'site' (v3, the real site in a frame — default)
// or 'native' (v4, being rebuilt milestone by milestone). `--native` forces v4.
// v4 (2026-11-18): the native app is the default; the site view (v3) only when chosen in the account menu or with --site
const useNativeEngine = () => process.argv.includes('--native') || (!process.argv.includes('--site') && state.settings.engine !== 'site');

const CONTENT_FILES = [
  'testdaf-method-content.js', 'oesd-method-content.js', 'grammar-drill-bank.js',
  'free-games-bank.js', 'testdaf-simulation-data.js',
];
const contentDir = () => path.join(app.getPath('userData'), 'content');

// Laptops with two GPUs (e.g. Intel HD + NVIDIA) otherwise render on the weak
// integrated chip: measured 6–13 fps scrolling vs 40–46 fps on the NVIDIA GPU.
app.commandLine.appendSwitch('force_high_performance_gpu');

const DEFAULT_BASE_URL = 'https://learn.tah3in.com';
const REQUEST_TIMEOUT_MS = 15000;

const DEFAULT_SETTINGS = {
  baseUrl: DEFAULT_BASE_URL,
  lang: 'fa',
  theme: 'system',
  accent: 'indigo',
  reduceMotion: false,
  uiScale: 1,
  widgetEnabled: false,
  widgetAlwaysOnTop: false, // the widget is a normal window until the user pins it
  widgetCompact: false,
  startWithWindows: false,
  closeToTray: true,
  autoRefreshSeconds: 60,
};

const DEFAULT_APP_BOUNDS = { width: 1360, height: 880, x: null, y: null, maximized: false };
const DEFAULT_WIDGET_BOUNDS = { width: 360, height: 400, x: null, y: null };

let appWindow = null;
let widgetWindow = null;
let settingsWindow = null;
let tray = null;
let isQuitting = false;
let tickTimer = null;

/* ------------------------------------------------------------------ storage */

const stateFilePath = () => path.join(app.getPath('userData'), 'state.json');

const state = {
  settings: { ...DEFAULT_SETTINGS },
  appBounds: { ...DEFAULT_APP_BOUNDS },
  widgetBounds: { ...DEFAULT_WIDGET_BOUNDS },
  lastSection: 'dashboard',
  session: null, // { access, refresh, email, expiresAt } — tokens encrypted
  cache: null, // { payload, savedAt } — last good widget payload
  sidebarCompact: false,
  siteZoom: 1,
};

const UI_SCALES = [0.8, 0.9, 1, 1.1, 1.25, 1.5];
const ACCENTS = ['indigo', 'violet', 'teal', 'amber', 'rose'];
// Screens of the real Amookht web app, in the site's own sidebar order.
const SECTIONS = [
  'dashboard', 'errorbook', 'favorites', 'library', 'deutschCoach', 'testdafSim', 'history',
  'appSettings', 'settings', 'adminUsers', 'freeStudy',
];
const SECTION_LABELS = {
  dashboard: 'اجرای برنامه', errorbook: 'دفتر عبارات', favorites: 'علاقه‌مندی‌ها', library: 'کتابخانه',
  deutschCoach: 'مربی گفتگو', testdafSim: 'شبیه‌سازی آزمون', history: 'تاریخچه', appSettings: 'تنظیمات برنامه',
  settings: 'تنظیمات حساب', adminUsers: 'مدیریت', freeStudy: 'مطالعه آزاد',
};
// The site has its own accent names; the native windows (widget, settings) keep theirs.
const ACCENT_TO_SITE = { indigo: 'blue', violet: 'violet', teal: 'emerald', amber: 'amber', rose: 'rose' };
const ACCENT_FROM_SITE = { blue: 'indigo', violet: 'violet', emerald: 'teal', amber: 'amber', rose: 'rose' };
const TOKEN_KEY_HEADER = 'X-Amookht-App-Token';

function migrateSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  // v2.0 stored the widget toggles under generic names.
  if (raw && typeof raw.alwaysOnTop === 'boolean') settings.widgetAlwaysOnTop = raw.alwaysOnTop;
  if (raw && typeof raw.compact === 'boolean') settings.widgetCompact = raw.compact;
  if (raw && raw.siteZoom !== undefined && raw.uiScale === undefined) settings.uiScale = Number(raw.siteZoom);
  if (!UI_SCALES.includes(Number(settings.uiScale))) settings.uiScale = 1;
  if (!['fa', 'en', 'de'].includes(settings.lang)) settings.lang = 'fa';
  if (!['system', 'light', 'dark'].includes(settings.theme)) settings.theme = 'system';
  if (!ACCENTS.includes(settings.accent)) settings.accent = 'indigo';
  // 4.0: everyone moves to the native app once (in 3.x «site» was the default); a later choice of v3 sticks
  if (!settings.engineV4) { settings.engine = 'native'; settings.engineV4 = true; }
  return settings;
}

function readState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(stateFilePath(), 'utf8'));
    if (parsed && typeof parsed === 'object') {
      state.settings = migrateSettings(parsed.settings);
      state.appBounds = { ...DEFAULT_APP_BOUNDS, ...(parsed.appBounds || parsed.siteBounds || parsed.bounds || {}) };
      state.widgetBounds = { ...DEFAULT_WIDGET_BOUNDS, ...(parsed.widgetBounds || {}) };
      // v2's tall fixed widget → the new compact default once (position is kept).
      if ((Number(parsed.layoutVersion) || 0) < 3) {
        state.widgetBounds = { ...state.widgetBounds, width: DEFAULT_WIDGET_BOUNDS.width, height: DEFAULT_WIDGET_BOUNDS.height };
      }
      state.lastSection = SECTIONS.includes(parsed.lastSection) ? parsed.lastSection : 'dashboard';
      state.session = parsed.session || null;
      state.cache = parsed.cache || null;
      state.sidebarCompact = !!parsed.sidebarCompact;
      // v3 is a full desktop app around the whole site: open it maximized once.
      state.layoutVersion = Number(parsed.layoutVersion) || 0;
      if (state.layoutVersion < 3) {
        state.appBounds = { ...state.appBounds, maximized: true };
        state.layoutVersion = 3;
      }
      state.siteZoom = Number(parsed.siteZoom) > 0 ? Number(parsed.siteZoom) : 1;
    }
  } catch (error) {
    if (error && error.code !== 'ENOENT') console.warn('Could not read state file:', error.message);
  }
}

let saveTimer = null;
function saveState(immediate = false) {
  const write = () => {
    try {
      fs.mkdirSync(path.dirname(stateFilePath()), { recursive: true });
      fs.writeFileSync(stateFilePath(), JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.warn('Could not write state file:', error.message);
    }
  };
  if (immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    write();
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    write();
  }, 400);
}

/* ------------------------------------------------------------- secret store */

function encrypt(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return 'enc:' + safeStorage.encryptString(value).toString('base64');
    }
  } catch (error) {
    console.warn('safeStorage unavailable:', error.message);
  }
  return 'raw:' + Buffer.from(value, 'utf8').toString('base64');
}

function decrypt(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    if (value.startsWith('enc:')) return safeStorage.decryptString(Buffer.from(value.slice(4), 'base64'));
    if (value.startsWith('raw:')) return Buffer.from(value.slice(4), 'base64').toString('utf8');
  } catch (error) {
    console.warn('Could not decrypt stored token:', error.message);
  }
  return '';
}

function currentSession() {
  const stored = state.session;
  if (!stored || !stored.access) return null;
  const access = decrypt(stored.access);
  const refresh = decrypt(stored.refresh);
  if (!access && !refresh) return null;
  return { access, refresh, email: stored.email || '', expiresAt: Number(stored.expiresAt) || 0 };
}

function storeSession({ access, refresh, email, expiresIn }) {
  state.session = {
    access: encrypt(access || ''),
    refresh: encrypt(refresh || ''),
    email: email || '',
    expiresAt: Date.now() + Math.max(0, Number(expiresIn) || 0) * 1000,
  };
  saveState(true);
  broadcast('session:changed', accountInfo());
}

function clearSession() {
  state.session = null;
  state.cache = null;
  saveState(true);
  broadcast('session:changed', accountInfo());
}

/* The embedded site needs a live access token twice: in its own localStorage
   (seeded by preload-site.js) and on every request while the /_gate lock is on
   (X-Amookht-App-Token, accepted by the gate only for learn.tah3in.com). Access
   tokens live 15 minutes, so keep one fresh in the background. */
let refreshTimer = null;
let refreshing = null;

async function ensureFreshSession(minValidMs = 4 * 60 * 1000) {
  const current = currentSession();
  if (!current) return null;
  if (current.access && current.expiresAt - Date.now() > minValidMs) return current;
  if (!refreshing) refreshing = refreshSession().finally(() => { refreshing = null; });
  await refreshing;
  return currentSession();
}

function startTokenKeeper() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (currentSession()) ensureFreshSession().catch(() => {});
  }, 60 * 1000);
}

function siteTokens() {
  const current = currentSession();
  if (!current || !current.access) return null;
  return {
    access_token: current.access,
    refresh_token: current.refresh,
    token_type: 'bearer',
    expires_in: Math.max(0, Math.round((current.expiresAt - Date.now()) / 1000)),
  };
}

/* --------------------------------------------------------- content cache */

const CONTENT_MAX_AGE = 6 * 60 * 60 * 1000;
const contentJobs = new Map();

function readContentIndex() {
  try {
    return JSON.parse(fs.readFileSync(path.join(contentDir(), 'index.json'), 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeContentIndex(index) {
  fs.mkdirSync(contentDir(), { recursive: true });
  fs.writeFileSync(path.join(contentDir(), 'index.json'), JSON.stringify(index, null, 2), 'utf8');
}

async function downloadContent(name) {
  const index = readContentIndex();
  const entry = index[name] || {};
  const file = path.join(contentDir(), name);
  const haveFile = fs.existsSync(file);
  if (haveFile && entry.checkedAt && Date.now() - entry.checkedAt < CONTENT_MAX_AGE) {
    return { ok: true, url: 'amookht://content/' + name + '?v=' + encodeURIComponent(entry.etag || entry.checkedAt), cached: true };
  }
  const current = await ensureFreshSession().catch(() => null);
  const headers = { Accept: '*/*' };
  if (current && current.access) headers[TOKEN_KEY_HEADER] = current.access;
  if (haveFile && entry.etag) headers['If-None-Match'] = entry.etag;
  try {
    const response = await fetch(siteHome() + name, { headers, signal: AbortSignal.timeout(120000) });
    if (response.status === 304 && haveFile) {
      index[name] = { ...entry, checkedAt: Date.now() };
    } else if (response.ok) {
      const body = Buffer.from(await response.arrayBuffer());
      // A gate page or error HTML must never replace a good pack.
      if (/^\s*</.test(body.subarray(0, 64).toString('utf8'))) throw new Error('not a content script');
      fs.mkdirSync(contentDir(), { recursive: true });
      fs.writeFileSync(file + '.part', body);
      fs.renameSync(file + '.part', file);
      index[name] = { etag: response.headers.get('etag') || '', size: body.length, checkedAt: Date.now() };
    } else if (!haveFile) {
      return { ok: false, error: 'http_' + response.status };
    }
    writeContentIndex(index);
    const saved = index[name] || entry;
    return { ok: true, url: 'amookht://content/' + name + '?v=' + encodeURIComponent(saved.etag || saved.checkedAt || 0), cached: false };
  } catch (error) {
    // Offline: an older copy is better than nothing.
    if (haveFile) return { ok: true, url: 'amookht://content/' + name + '?v=' + encodeURIComponent(entry.etag || 0), cached: true, stale: true };
    return { ok: false, error: (error && error.message) || 'download_failed' };
  }
}

function ensureContent(name) {
  if (!contentJobs.has(name)) {
    contentJobs.set(name, downloadContent(name).finally(() => contentJobs.delete(name)));
  }
  return contentJobs.get(name);
}

function registerAppProtocol() {
  const srcRoot = path.join(__dirname, '..', 'src');
  protocol.handle('amookht', (request) => {
    let url;
    try {
      url = new URL(request.url);
    } catch {
      return new Response('bad request', { status: 400 });
    }
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    // «مربی گفتگو»: the coach's own frontend, same origin as the app (like the site's same-origin frame)
    if (url.host === 'app' && (relative === 'coach' || relative.startsWith('coach/'))) return serveCoach(relative.replace(/^coach\/?/, ''), url, request);
    let root;
    if (url.host === 'app') root = srcRoot;
    else if (url.host === 'content') root = contentDir();
    else if (url.host === 'media') return serveMedia(relative, request);
    else return new Response('not found', { status: 404 });
    const target = path.resolve(root, relative);
    if (!target.startsWith(path.resolve(root) + path.sep)) return new Response('forbidden', { status: 403 });
    if (url.host === 'content' && !CONTENT_FILES.includes(relative)) return new Response('not found', { status: 404 });
    return net.fetch(pathToFileURL(target).toString());
  });
}

/* Lesson audio (and its word timings) lives behind the site gate under /assets/. The native app plays it as
   amookht://media/assets/…: the first request downloads it with the app token, later ones come from the
   disk cache (%APPDATA%\Amookht\media), so lessons also play offline once heard. */
const MEDIA_PREFIXES = ['assets/method-audio/', 'assets/free-audio/'];
/* ───────── conversation coach (/coach/ on the site) ─────────
   Static files are cached in userData/coach (revalidated every 6 h, offline copy kept); api/… is proxied to the
   coach service with the signed-in token and the gate header, so the coach UI never handles tokens itself. */
const coachDir = () => path.join(app.getPath('userData'), 'coach');
const COACH_TTL = 6 * 3600 * 1000;
const coachInflight = new Map();
async function serveCoach(relative, url, request) {
  const session = currentSession();
  const auth = session && session.access ? { Authorization: 'Bearer ' + session.access, [TOKEN_KEY_HEADER]: session.access } : {};
  if (relative.startsWith('api/')) {
    if (process.env.AMOOKHT_READONLY === '1' && !['GET', 'HEAD'].includes(request.method)) { console.log('READONLY-BLOCKED', request.method, 'coach/' + relative); return new Response('{}', { status: 423 }); }
    const send = async (headersAuth) => {
      const headers = { ...headersAuth };
      const type = request.headers.get('content-type'); if (type) headers['Content-Type'] = type;
      const accept = request.headers.get('accept'); if (accept) headers.Accept = accept;
      const body = ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.from(await request.clone().arrayBuffer());
      return fetch(baseUrl() + '/coach/' + relative + url.search, { method: request.method, headers, body });
    };
    let response = await send(auth).catch(() => null);
    if (response && response.status === 401 && session && session.refresh && (await refreshSession())) {
      const fresh = currentSession();
      response = await send({ Authorization: 'Bearer ' + fresh.access, [TOKEN_KEY_HEADER]: fresh.access }).catch(() => null);
    }
    if (!response) return new Response(JSON.stringify({ detail: 'network' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    const out = new Headers();
    ['content-type', 'content-disposition', 'cache-control'].forEach((h) => { const v = response.headers.get(h); if (v) out.set(h, v); });
    return new Response(response.body, { status: response.status, headers: out });
  }
  const file = relative || 'index.html';
  if (file.includes('..') || !/^[\w./-]+$/.test(file)) return new Response('not found', { status: 404 });
  const target = path.resolve(coachDir(), file);
  if (!target.startsWith(path.resolve(coachDir()) + path.sep)) return new Response('forbidden', { status: 403 });
  let fresh = false;
  try { fresh = Date.now() - fs.statSync(target).mtimeMs < COACH_TTL; } catch { /* not cached yet */ }
  if (!fresh) {
    if (!coachInflight.has(target)) {
      coachInflight.set(target, (async () => {
        const response = await fetch(baseUrl() + '/coach/' + file, { headers: auth });
        const type = String(response.headers.get('content-type') || '');
        if (!response.ok || (type.includes('text/html') && file !== 'index.html')) return response.status || 404;
        const bytes = Buffer.from(await response.arrayBuffer());
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target + '.part', bytes);
        fs.renameSync(target + '.part', target);
        return 200;
      })().catch(() => 502).finally(() => setTimeout(() => coachInflight.delete(target), 0)));
    }
    await coachInflight.get(target);
  }
  if (!fs.existsSync(target)) return new Response('not found', { status: 404 });
  return net.fetch(pathToFileURL(target).toString(), { headers: request.headers });
}

const mediaDir = () => path.join(app.getPath('userData'), 'media');
const mediaInflight = new Map();
async function serveMedia(relative, request) {
  if (!MEDIA_PREFIXES.some((p) => relative.startsWith(p)) || relative.includes('..') || !/^[\w./-]+$/.test(relative)) return new Response('not found', { status: 404 });
  const target = path.resolve(mediaDir(), relative);
  if (!target.startsWith(path.resolve(mediaDir()) + path.sep)) return new Response('forbidden', { status: 403 });
  if (!fs.existsSync(target)) {
    if (!mediaInflight.has(target)) {
      mediaInflight.set(target, (async () => {
        const session = currentSession();
        const headers = session && session.access ? { Authorization: 'Bearer ' + session.access, [TOKEN_KEY_HEADER]: session.access } : {};
        const response = await fetch(baseUrl() + '/' + relative, { headers });
        const type = String(response.headers.get('content-type') || '');
        if (!response.ok || type.includes('text/html')) return response.status || 404;
        const bytes = Buffer.from(await response.arrayBuffer());
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const tmp = target + '.part';
        fs.writeFileSync(tmp, bytes);
        fs.renameSync(tmp, target);
        return 200;
      })().catch(() => 502).finally(() => setTimeout(() => mediaInflight.delete(target), 0)));
    }
    const status = await mediaInflight.get(target);
    if (status !== 200 || !fs.existsSync(target)) return new Response('not found', { status: status === 200 ? 404 : status });
  }
  // net.fetch on the file supports Range requests, so audio seeking works
  return net.fetch(pathToFileURL(target).toString(), { headers: request.headers });
}

/* ───────── automatic updates (4.1) ─────────
   The installed app checks https://learn.tah3in.com/downloads/latest.yml (published with each release), downloads a
   newer version in the background and installs it when the app quits, or at once from the «update ready» button. */
const updateState = { status: 'idle', version: '', progress: 0, error: '' };
function sendUpdate() {
  [appWindow].forEach((w) => { if (w && !w.isDestroyed()) w.webContents.send('update:state', { ...updateState }); });
}
function setupUpdates() {
  if (!app.isPackaged || process.env.AMOOKHT_NO_UPDATE === '1' || process.env.AMOOKHT_READONLY === '1') return;
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch (error) { console.warn('updater unavailable', error); return; }
  // test feed (an update run against a local folder); the real feed comes from package.json → app-update.yml
  if (process.env.AMOOKHT_UPDATE_URL) autoUpdater.setFeedURL({ provider: 'generic', url: process.env.AMOOKHT_UPDATE_URL });
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  autoUpdater.on('checking-for-update', () => { updateState.status = 'checking'; sendUpdate(); });
  autoUpdater.on('update-available', (info) => { updateState.status = 'downloading'; updateState.version = info && info.version || ''; sendUpdate(); });
  autoUpdater.on('update-not-available', () => { updateState.status = 'latest'; sendUpdate(); });
  autoUpdater.on('download-progress', (p) => { updateState.progress = Math.round((p && p.percent) || 0); sendUpdate(); });
  autoUpdater.on('update-downloaded', (info) => {
    updateState.status = 'ready'; updateState.version = info && info.version || updateState.version; sendUpdate();
    offerUpdate();
  });
  /* AUTO-INSTALL (4.4.1): a ready update no longer waits for a full quit, which almost never happens (closing the
     window only hides the app in the tray, it starts with Windows, and a Windows shutdown kills it without installing).
     While the app is hidden in the tray the update installs silently and the app starts again; while it is open the
     learner is asked once, and «بعداً» installs it the next time the window is closed to the tray. */
  let asked = false; let installT = 0;
  const appVisible = () => !!(appWindow && !appWindow.isDestroyed() && appWindow.isVisible() && !appWindow.isMinimized());
  const installNow = () => {
    if (updateState.status !== 'ready') return;
    isQuitting = true; app.isQuitting = true;
    setImmediate(() => { try { autoUpdater.quitAndInstall(true, true); } catch (error) { console.warn('install failed', error); } });
  };
  const installWhenHidden = (delay) => { clearTimeout(installT); installT = setTimeout(() => { if (updateState.status === 'ready' && !appVisible()) installNow(); }, delay); };
  async function offerUpdate() {
    if (!appVisible()) { installWhenHidden(20000); return; }
    if (asked) return; asked = true;
    try { if (tray && !tray.isDestroyed?.()) tray.displayBalloon?.({ title: 'Amookht', content: `نسخهٔ ${updateState.version} آماده نصب است.` }); } catch { /* ignore */ }
    const r = await dialog.showMessageBox(appWindow, {
      type: 'info', buttons: ['نصب و راه‌اندازی دوباره', 'بعداً'], defaultId: 0, cancelId: 1, noLink: true,
      title: 'به‌روزرسانی آموخت', message: `نسخهٔ جدید آموخت (${updateState.version}) آماده است.`,
      detail: 'نصب کمتر از یک دقیقه طول می‌کشد و برنامه دوباره باز می‌شود. اگر «بعداً» را بزنید، دفعهٔ بعد که پنجره را ببندید خودکار نصب می‌شود.',
    }).catch(() => ({ response: 1 }));
    if (r.response === 0) installNow();
  }
  app.on('browser-window-created', (_e, win) => { win.on('hide', () => { if (win === appWindow && updateState.status === 'ready') installWhenHidden(15000); }); });
  if (appWindow && !appWindow.isDestroyed()) appWindow.on('hide', () => { if (updateState.status === 'ready') installWhenHidden(15000); });
  try { const { powerMonitor } = require('electron'); ['resume', 'unlock-screen'].forEach((ev) => powerMonitor.on(ev, () => setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 20000))); } catch { /* ignore */ }
  autoUpdater.on('error', (error) => { updateState.status = 'error'; updateState.error = String((error && error.message) || error).slice(0, 200); sendUpdate(); });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 15000);
  setInterval(check, 30 * 60 * 1000);   // every 30 minutes (was 4 hours)
  ipcMain.handle('update:state', () => ({ ...updateState }));
  ipcMain.handle('update:check', () => { check(); return { ...updateState }; });
  ipcMain.handle('update:install', () => {
    if (updateState.status !== 'ready') return { ok: false };
    isQuitting = true; app.isQuitting = true;
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
    return { ok: true };
  });
}

function siteOrigin() {
  try {
    return new URL(siteHome()).origin;
  } catch {
    return '';
  }
}

function isSiteUrl(url) {
  try {
    return new URL(url).origin === siteOrigin();
  } catch {
    return false;
  }
}

function accountInfo() {
  const session = currentSession();
  return { hasSession: !!session, email: session ? session.email : '' };
}

/* --------------------------------------------------------------- http layer */

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'request_failed';
    this.status = status || 0;
  }
}

function baseUrl() {
  const configured = String(state.settings.baseUrl || '').trim() || DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, '');
}

function siteHome() {
  return baseUrl() + '/';
}

async function fetchJson(pathname, { method = 'GET', body, headers = {}, timeout = REQUEST_TIMEOUT_MS, raw = false, binary = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(baseUrl() + pathname, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined || raw ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
      signal: controller.signal,
    });
    // binary answers (coach speech audio) travel to the renderer as base64
    if (binary && response.ok) {
      const buf = Buffer.from(await response.arrayBuffer());
      return { response, data: { base64: buf.toString('base64'), type: response.headers.get('content-type') || 'application/octet-stream' } };
    }
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text.slice(0, 300) };
      }
    }
    return { response, data };
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new ApiError('پاسخی از سرور دریافت نشد (زمان تمام شد). اتصال اینترنت را بررسی کنید.', 'timeout', 0);
    }
    throw new ApiError('اتصال به سرور آموخت برقرار نشد. اینترنت یا آدرس سرور را بررسی کنید.', 'network_error', 0);
  } finally {
    clearTimeout(timer);
  }
}

function errorFromResponse(status, data) {
  const detail = data && typeof data === 'object' ? data.detail : null;
  const code =
    (detail && typeof detail === 'object' && detail.code) ||
    (data && typeof data === 'object' && data.code) ||
    (typeof detail === 'string' ? detail : '') ||
    'request_failed';
  const serverMessage =
    (detail && typeof detail === 'object' && (detail.message || detail.error)) ||
    (data && typeof data === 'object' && (data.message || data.error)) ||
    (typeof detail === 'string' ? detail : '');
  const fallback =
    {
      401: 'ایمیل یا رمز عبور درست نیست.',
      403: 'این بخش برای حساب شما باز نیست (بخشی از قابلیت‌ها ویژهٔ پرمیوم است).',
      404: 'موردی پیدا نشد.',
      409: 'برنامهٔ امروز هنوز ساخته نشده است؛ یک بار سایت را باز کنید.',
      422: 'اطلاعات ارسالی کامل یا درست نیست.',
      429: 'تلاش بیش از حد؛ کمی بعد دوباره امتحان کنید.',
      502: 'سرور پاسخ درستی نداد؛ دوباره تلاش کنید.',
      503: 'این بخش الان در دسترس نیست؛ کمی بعد امتحان کنید.',
    }[status] || 'خطای سرور (' + status + ')';
  const message = typeof serverMessage === 'string' && serverMessage.trim() ? serverMessage.trim() : fallback;
  return new ApiError(message, String(code), status);
}

async function apiRequest(pathname, options = {}) {
  const { auth = true, retry = true } = options;
  const current = currentSession();
  if (auth && !current) throw new ApiError('ابتدا وارد حساب خود شوید.', 'no_session', 401);

  const headers = { ...(options.headers || {}) };
  if (auth && current.access) headers.Authorization = 'Bearer ' + current.access;
  // Paths outside /v1 sit behind the site gate; the signed-in app passes it with its token.
  if (auth && current.access && !String(pathname).startsWith('/v1/')) headers[TOKEN_KEY_HEADER] = current.access;

  const { response, data } = await fetchJson(pathname, { ...options, headers });
  if (response.ok) return data;

  if (response.status === 401 && auth && retry && current.refresh) {
    if (await refreshSession()) return apiRequest(pathname, { ...options, retry: false });
    clearSession();
    throw new ApiError('نشست شما منقضی شد؛ دوباره وارد شوید.', 'session_expired', 401);
  }

  throw errorFromResponse(response.status, data);
}

async function refreshSession() {
  const current = currentSession();
  if (!current || !current.refresh) return false;
  try {
    const { response, data } = await fetchJson(
      '/v1/auth/refresh?refresh_token=' + encodeURIComponent(current.refresh),
      { method: 'POST' },
    );
    if (!response.ok || !data || !data.access_token) return false;
    storeSession({
      access: data.access_token,
      refresh: data.refresh_token || current.refresh,
      email: current.email,
      expiresIn: data.expires_in,
    });
    return true;
  } catch (error) {
    console.warn('Token refresh failed:', error.message);
    return false;
  }
}

/* ------------------------------------------------------------ window helpers */

const windowIcon = () => path.join(__dirname, '..', 'build', 'icon.ico');

function broadcast(channel, payload) {
  [...BrowserWindow.getAllWindows()].forEach((win) => {
    if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  });
}

function darkNow() {
  if (state.settings.theme === 'dark') return true;
  if (state.settings.theme === 'light') return false;
  return nativeTheme.shouldUseDarkColors;
}

function applyWindowChrome() {
  if (!appWindow || appWindow.isDestroyed()) return;
  try {
    appWindow.setTitleBarOverlay({
      color: darkNow() ? '#080b14' : '#eef1fa',
      symbolColor: darkNow() ? '#dfe6ff' : '#1c2233',
      height: 44,
    });
  } catch (error) {
    // titleBarOverlay is Windows-only; ignore elsewhere.
  }
  appWindow.setBackgroundColor(darkNow() ? '#080b14' : '#eef1fa');
}

function applyAutostart() {
  if (process.platform !== 'win32') return;
  // Only the installed build may own the Windows «run at login» entry; a `npm start` dev run used to
  // overwrite it with electron.exe from node_modules.
  if (!app.isPackaged) return;
  try {
    app.setLoginItemSettings({
      openAtLogin: !!state.settings.startWithWindows,
      path: process.execPath,
      args: ['--hidden'],
    });
  } catch (error) {
    console.warn('Could not set login item:', error.message);
  }
}

function applyUiScale() {
  if (!appWindow || appWindow.isDestroyed()) return;
  appWindow.webContents.setZoomFactor(Number(state.settings.uiScale) || 1);
}

function applyWidgetOptions() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return;
  widgetWindow.setAlwaysOnTop(!!state.settings.widgetAlwaysOnTop, 'floating');
}

function clampBounds(bounds, minimum) {
  const display = screen.getPrimaryDisplay().workArea;
  const width = Math.max(minimum.width, Math.min(Number(bounds.width) || display.width, display.width));
  const height = Math.max(minimum.height, Math.min(Number(bounds.height) || display.height, display.height));
  let x = typeof bounds.x === 'number' && Number.isFinite(bounds.x) ? bounds.x : NaN;
  let y = typeof bounds.y === 'number' && Number.isFinite(bounds.y) ? bounds.y : NaN;
  if (!Number.isFinite(x)) x = display.x + Math.round((display.width - width) / 2);
  if (!Number.isFinite(y)) y = display.y + Math.round((display.height - height) / 2);
  const area = screen.getDisplayNearestPoint({ x, y }).workArea;
  x = Math.max(area.x, Math.min(x, area.x + area.width - 120));
  y = Math.max(area.y, Math.min(y, area.y + area.height - 120));
  return { width, height, x, y };
}

/* ---------------------------------------------------------------- app window */

function persistAppBounds() {
  if (!appWindow || appWindow.isDestroyed() || appWindow.isMinimized()) return;
  state.appBounds = { ...appWindow.getBounds(), maximized: appWindow.isMaximized() };
  saveState();
}

function createAppWindow({ show = true } = {}) {
  if (appWindow && !appWindow.isDestroyed()) {
    if (show) showApp();
    return appWindow;
  }

  const bounds = clampBounds(state.appBounds, { width: 1040, height: 680 });
  appWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1040,
    minHeight: 680,
    show: false,
    title: 'Amookht',
    icon: windowIcon(),
    backgroundColor: darkNow() ? '#080b14' : '#eef1fa',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: darkNow() ? '#080b14' : '#eef1fa', symbolColor: darkNow() ? '#dfe6ff' : '#1c2233', height: 44 },
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-app.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      backgroundThrottling: false,
      webviewTag: true,
    },
  });

  if (state.appBounds.maximized) appWindow.maximize();
  if (useNativeEngine()) appWindow.loadURL('amookht://app/native/index.html');
  else appWindow.loadFile(path.join(__dirname, '..', 'src', 'app.html'));

  // Warm the TCP/TLS connection and the access token while the window paints.
  fetchJson('/v1/auth/google/config', { timeout: 6000 }).catch(() => {});
  ensureFreshSession().catch(() => {});

  // The only guest the shell may embed is the Amookht site, always with our
  // hardened preferences and preload — whatever the page asked for.
  appWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preloadURL;
    webPreferences.preload = path.join(__dirname, 'preload-site.js');
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.spellcheck = true;
    if (!isSiteUrl(params.src)) event.preventDefault();
  });

  appWindow.webContents.on('did-attach-webview', (_event, guest) => wireSiteGuest(guest));
  appWindow.webContents.on('before-input-event', (event, input) => {
    if (handleShortcut(input)) event.preventDefault();
  });

  appWindow.once('ready-to-show', () => {
    applyWindowChrome();
    applyUiScale();
    const startHidden = process.argv.includes('--hidden');
    if (show && !startHidden) appWindow.show();
    if (state.settings.widgetEnabled) showWidget(false);
  });

  appWindow.on('resize', persistAppBounds);
  appWindow.on('move', persistAppBounds);
  appWindow.on('maximize', persistAppBounds);
  appWindow.on('unmaximize', persistAppBounds);

  appWindow.on('close', (event) => {
    if (!isQuitting && state.settings.closeToTray) {
      event.preventDefault();
      appWindow.hide();
      if (state.settings.widgetEnabled) showWidget(false);
    } else {
      saveState(true);
    }
  });

  appWindow.on('closed', () => {
    appWindow = null;
  });

  appWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  appWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://') || url.startsWith('amookht://app/')) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  return appWindow;
}

function showApp() {
  if (!appWindow || appWindow.isDestroyed()) {
    createAppWindow({ show: true });
    return;
  }
  if (!appWindow.isVisible()) appWindow.show();
  if (appWindow.isMinimized()) appWindow.restore();
  appWindow.focus();
}

function hideApp() {
  if (appWindow && !appWindow.isDestroyed()) appWindow.hide();
}

function toggleApp() {
  if (appWindow && !appWindow.isDestroyed() && appWindow.isVisible() && !appWindow.isMinimized()) hideApp();
  else showApp();
}

function navigateApp(section) {
  const win = appWindow && !appWindow.isDestroyed() ? appWindow : createAppWindow({ show: true });
  if (!SECTIONS.includes(section)) section = 'dashboard';
  const send = () => win.webContents.send('app:navigate', section);
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send);
  else send();
  showApp();
}

function sendToShell(channel, payload) {
  if (appWindow && !appWindow.isDestroyed()) appWindow.webContents.send(channel, payload);
}

/* ------------------------------------------------------------ site guest */

let siteGuest = null;
let lastGateRecovery = 0;

function wireSiteGuest(guest) {
  siteGuest = guest;
  guest.setZoomFactor(Number(state.siteZoom) || 1);

  guest.setWindowOpenHandler(({ url }) => {
    if (isSiteUrl(url)) {
      const { pathname, search, hash } = new URL(url);
      openToolWindow(pathname + search + hash, '');
    } else if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  guest.on('will-navigate', (event, url) => {
    if (isSiteUrl(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) shell.openExternal(url);
  });

  // While the /_gate lock is on, a stale token sends us to the gate page.
  // Refresh once and go back; if it still fails, the gate page stays usable.
  guest.on('did-navigate', async (_event, url) => {
    let parsed;
    try { parsed = new URL(url); } catch { return; }
    if (parsed.origin !== siteOrigin() || !parsed.pathname.startsWith('/_gate')) return;
    if (Date.now() - lastGateRecovery < 60 * 1000) {
      sendToShell('site:gate', { stuck: true });
      return;
    }
    lastGateRecovery = Date.now();
    await refreshSession();
    const next = parsed.searchParams.get('next');
    guest.loadURL(siteHome().replace(/\/$/, '') + (next && next.startsWith('/') && !next.startsWith('//') ? next : '/'));
  });

  guest.on('before-input-event', (event, input) => {
    if (handleShortcut(input)) event.preventDefault();
  });

  // Ctrl+wheel goes through the app's own zoom (status bar, saved per app).
  guest.on('zoom-changed', (_event, direction) => {
    sendToShell('shell:command', { action: 'zoom', step: direction === 'in' ? 1 : -1 });
  });

  // Native right-click menu, like any Windows app: edit actions and spelling.
  guest.on('context-menu', (_event, params) => {
    const template = [];
    if (params.misspelledWord && params.dictionarySuggestions.length) {
      params.dictionarySuggestions.slice(0, 5).forEach((word) => {
        template.push({ label: word, click: () => guest.replaceMisspelling(word) });
      });
      template.push({ type: 'separator' });
    }
    if (params.isEditable) {
      template.push(
        { role: 'undo', label: 'واگرد', enabled: params.editFlags.canUndo },
        { role: 'redo', label: 'ازنو', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { role: 'cut', label: 'برش', enabled: params.editFlags.canCut },
        { role: 'copy', label: 'کپی', enabled: params.editFlags.canCopy },
        { role: 'paste', label: 'چسباندن', enabled: params.editFlags.canPaste },
        { type: 'separator' },
        { role: 'selectAll', label: 'انتخاب همه' },
      );
    } else if (params.selectionText && params.selectionText.trim()) {
      template.push({ role: 'copy', label: 'کپی' });
    }
    if (params.linkURL && /^https?:/i.test(params.linkURL)) {
      if (template.length) template.push({ type: 'separator' });
      template.push({ label: 'کپی پیوند', click: () => require('electron').clipboard.writeText(params.linkURL) });
    }
    if (params.mediaType === 'image' && params.srcURL && !params.srcURL.startsWith('data:')) {
      if (template.length) template.push({ type: 'separator' });
      template.push({ label: 'کپی تصویر', click: () => guest.copyImageAt(params.x, params.y) });
    }
    if (!template.length) return;
    Menu.buildFromTemplate(template).popup({ window: appWindow || undefined });
  });

  guest.on('destroyed', () => {
    if (siteGuest === guest) siteGuest = null;
  });
}

/* Window-level shortcuts work the same whether the shell or the site has focus. */
function handleShortcut(input) {
  if (input.type !== 'keyDown') return false;
  const ctrl = input.control || input.meta;
  const key = String(input.key || '');
  const code = String(input.code || '');
  const send = (action, extra) => {
    sendToShell('shell:command', { action, ...(extra || {}) });
    return true;
  };
  if (ctrl && !input.alt && !input.shift && key.toLowerCase() === 'k') return send('palette');
  if (ctrl && !input.alt && !input.shift && key.toLowerCase() === 'b') return send('toggle-sidebar');
  if (ctrl && !input.alt && !input.shift && /^Digit[1-9]$/.test(code)) return send('nav-index', { index: Number(code.slice(5)) - 1 });
  if (input.alt && !ctrl && key === 'ArrowLeft') return send('back');
  if (input.alt && !ctrl && key === 'ArrowRight') return send('forward');
  if (key === 'F5' || (ctrl && !input.shift && key.toLowerCase() === 'r')) return send('reload', { hard: !!input.shift });
  if (ctrl && input.shift && key.toLowerCase() === 'r') return send('reload', { hard: true });
  if (ctrl && !input.alt && (key === '=' || key === '+')) return send('zoom', { step: 1 });
  if (ctrl && !input.alt && key === '-') return send('zoom', { step: -1 });
  if (ctrl && !input.alt && key === '0') return send('zoom', { step: 0 });
  if (ctrl && !input.alt && key === ',') {
    createSettingsWindow();
    return true;
  }
  if (key === 'F11') {
    if (appWindow && !appWindow.isDestroyed()) appWindow.setFullScreen(!appWindow.isFullScreen());
    return true;
  }
  if (ctrl && input.shift && key.toLowerCase() === 'i' && siteGuest && !siteGuest.isDestroyed()) {
    siteGuest.toggleDevTools();
    return true;
  }
  return false;
}

/* --------------------------------------------------------------- web tools */
/* The deep course material (TestDaF method, simulations, writing/speaking labs)
   lives on learn.tah3in.com. It opens inside the app in its own window instead of
   being rebuilt, so the desktop app really does hold every part of the platform. */

const toolWindows = new Set();

function openToolWindow(pathname, title) {
  const safePath = typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/';
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    show: false,
    title: title ? 'Amookht — ' + title : 'Amookht',
    icon: windowIcon(),
    backgroundColor: darkNow() ? '#0b1020' : '#f4f6fb',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  toolWindows.add(win);
  win.on('closed', () => toolWindows.delete(win));
  win.loadURL(baseUrl() + safePath);
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  return win;
}

/* ------------------------------------------------------------ widget window */

const WIDGET_MIN = { width: 260, height: 220 };

function widgetBounds() {
  const stored = state.widgetBounds;
  const { width, height } = stored;
  const display = screen.getPrimaryDisplay().workArea;
  const w = Math.max(WIDGET_MIN.width, Math.min(Number(width) || DEFAULT_WIDGET_BOUNDS.width, display.width));
  const h = Math.max(WIDGET_MIN.height, Math.min(Number(height) || DEFAULT_WIDGET_BOUNDS.height, display.height));
  let x = typeof stored.x === 'number' && Number.isFinite(stored.x) ? stored.x : NaN;
  let y = typeof stored.y === 'number' && Number.isFinite(stored.y) ? stored.y : NaN;
  if (!Number.isFinite(x)) x = display.x + display.width - w - 28;
  if (!Number.isFinite(y)) y = display.y + display.height - h - 28;
  const area = screen.getDisplayNearestPoint({ x, y }).workArea;
  x = Math.max(area.x, Math.min(x, area.x + area.width - 100));
  y = Math.max(area.y, Math.min(y, area.y + area.height - 100));
  return { width: w, height: h, x, y };
}

function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) return widgetWindow;
  const bounds = widgetBounds();
  // A solid (non-transparent) frameless window: Windows then gives it real
  // resize borders on every edge and corner.
  widgetWindow = new BrowserWindow({
    ...bounds,
    minWidth: WIDGET_MIN.width,
    minHeight: WIDGET_MIN.height,
    frame: false,
    transparent: false,
    thickFrame: true,
    backgroundColor: darkNow() ? '#1d2942' : '#f3f5fb',
    hasShadow: true,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    title: 'Amookht — Widget',
    icon: windowIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload-widget.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, '..', 'src', 'widget.html'));

  widgetWindow.once('ready-to-show', () => {
    applyWidgetOptions(); // pin state first, so the first appearance never floats above other windows
    if (state.settings.widgetEnabled) widgetWindow.showInactive();
  });

  const persistWidgetBounds = () => {
    if (!widgetWindow || widgetWindow.isDestroyed()) return;
    const { width, height, x, y } = widgetWindow.getBounds();
    state.widgetBounds = { width, height, x, y };
    saveState();
  };
  widgetWindow.on('move', persistWidgetBounds);
  widgetWindow.on('resize', persistWidgetBounds);

  widgetWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      widgetWindow.hide();
    }
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });

  widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  return widgetWindow;
}

function showWidget(focus = true) {
  const win = createWidgetWindow();
  if (win.isVisible()) {
    if (focus) {
      win.show();
      win.focus();
    }
    return;
  }
  win.setBounds(widgetBounds());
  applyWidgetOptions();
  if (focus) win.show();
  else win.showInactive();
}

function hideWidget() {
  if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.hide();
}

function setWidgetEnabled(enabled) {
  state.settings.widgetEnabled = !!enabled;
  saveState(true);
  if (enabled) showWidget(false);
  else hideWidget();
  broadcast('settings:changed', publicSettings());
  updateTrayMenu();
  return publicSettings();
}

/* ---------------------------------------------------------- settings window */

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 980,
    height: 730,
    minWidth: 840,
    minHeight: 580,
    show: false,
    title: 'Amookht Settings',
    icon: windowIcon(),
    backgroundColor: '#080b14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'src', 'settings.html'));

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.focus();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  return settingsWindow;
}

/* ------------------------------------------------------------------- tray UI */

function trayImage() {
  const image = nativeImage.createFromPath(windowIcon());
  return image.isEmpty() ? nativeImage.createEmpty() : image;
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'نمایش Amookht', click: () => showApp() },
    {
      label: 'ویجت رومیزی',
      type: 'checkbox',
      checked: !!state.settings.widgetEnabled,
      click: (item) => setWidgetEnabled(item.checked),
    },
    { label: 'تنظیمات', click: () => createSettingsWindow() },
    {
      label: 'بازخوانی ویجت',
      click: () => {
        if (state.settings.widgetEnabled) showWidget(false);
        if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.webContents.send('amookht:refresh');
      },
    },
    { type: 'separator' },
    ...['dashboard', 'errorbook', 'favorites', 'library', 'deutschCoach', 'testdafSim', 'history', 'appSettings'].map((id) => ({
      label: SECTION_LABELS[id],
      click: () => navigateApp(id),
    })),
    { type: 'separator' },
    {
      label: 'خروج',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function updateTrayMenu() {
  if (tray && !tray.isDestroyed()) tray.setContextMenu(buildTrayMenu());
}

function createTray() {
  try {
    tray = new Tray(trayImage());
  } catch (error) {
    console.warn('Tray unavailable:', error.message);
    return;
  }
  tray.setToolTip('Amookht');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', () => toggleApp());
  tray.on('double-click', () => showApp());
}

function buildAppMenu() {
  const widgetItem = {
    label: 'ویجت رومیزی',
    type: 'checkbox',
    checked: !!state.settings.widgetEnabled,
    accelerator: 'CommandOrControl+Alt+W',
    click: (item) => setWidgetEnabled(item.checked),
  };
  const goTo = (section, label, accelerator) => ({ label, accelerator, click: () => navigateApp(section) });
  return Menu.buildFromTemplate([
    {
      label: 'Amookht',
      submenu: [
        { label: 'نمایش پنجرهٔ اصلی', accelerator: 'CommandOrControl+Alt+A', click: () => showApp() },
        widgetItem,
        { label: 'تنظیمات…', accelerator: 'CommandOrControl+,', click: () => createSettingsWindow() },
        { type: 'separator' },
        { label: 'خروج', accelerator: 'Alt+F4', click: () => { isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: 'رفتن به',
      // Shortcuts are handled in handleShortcut() so they also work inside the site.
      submenu: [
        'dashboard', 'errorbook', 'favorites', 'library', 'deutschCoach', 'testdafSim', 'history', 'appSettings', 'settings',
      ].map((id) => goTo(id, SECTION_LABELS[id])),
    },
    {
      label: 'نمایش',
      submenu: [
        { label: 'جستجو و فرمان‌ها…', click: () => sendToShell('shell:command', { action: 'palette' }) },
        { label: 'جمع/باز کردن نوار کناری', click: () => sendToShell('shell:command', { action: 'toggle-sidebar' }) },
        { type: 'separator' },
        { label: 'بازخوانی', click: () => sendToShell('shell:command', { action: 'reload' }) },
        { label: 'بازخوانی کامل', click: () => sendToShell('shell:command', { action: 'reload', hard: true }) },
        { type: 'separator' },
        { label: 'اندازهٔ اصلی', click: () => sendToShell('shell:command', { action: 'zoom', step: 0 }) },
        { label: 'بزرگ‌تر', click: () => sendToShell('shell:command', { action: 'zoom', step: 1 }) },
        { label: 'کوچک‌تر', click: () => sendToShell('shell:command', { action: 'zoom', step: -1 }) },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'تمام‌صفحه' },
        { role: 'toggleDevTools', label: 'ابزار توسعه' },
      ],
    },
    {
      label: 'راهنما',
      submenu: [
        { label: 'راهنمای ویجت', click: () => openToolWindow('/widgets/guide.html', 'راهنمای ویجت') },
        { label: 'وب‌سایت آموخت', click: () => shell.openExternal(siteHome()) },
        { label: 'دانلودها', click: () => openToolWindow('/downloads/', 'دانلودها') },
        { type: 'separator' },
        {
          label: 'دربارهٔ Amookht',
          click: () =>
            dialog.showMessageBox({
              type: 'info',
              title: 'About Amookht',
              message: 'Amookht ' + app.getVersion(),
              detail:
                'نسخهٔ ویندوز آموخت — همهٔ بخش‌های سایت (اجرای برنامه، دفتر عبارات، علاقه‌مندی‌ها، کتابخانه، مربی گفتگو، شبیه‌سازی، تاریخچه و تنظیمات) در یک پنجرهٔ ویندوزی، به‌همراه ویجت رومیزی.\n' +
                'وب‌سایت: ' + siteHome() +
                '\nداده‌های برنامه: ' + app.getPath('userData'),
              buttons: ['باشه'],
              noLink: true,
            }),
        },
      ],
    },
  ]);
}

/* ------------------------------------------------------------ permissions */

function configureSession() {
  const ses = session.defaultSession;

  // Present as plain Chrome instead of Electron so OAuth providers keep working.
  try {
    const ua = ses.getUserAgent()
      .replace(/\sElectron\/[\d.]+/i, '')
      .replace(/\sAmookht\/[\d.]+/i, '');
    ses.setUserAgent(ua);
  } catch (error) {
    console.warn('Could not set user agent:', error.message);
  }

  // Every request to the Amookht site carries the signed-in app token, so the
  // shared /_gate lock lets the app through (learn.tah3in.com only). Once the
  // gate is switched off or removed, the server simply ignores this header.
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = details.requestHeaders;
    if (isSiteUrl(details.url)) {
      const current = currentSession();
      if (current && current.access) headers[TOKEN_KEY_HEADER] = current.access;
    }
    callback({ requestHeaders: headers });
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    let origin = '';
    try {
      origin = new URL(details && details.requestingUrl ? details.requestingUrl : '').origin;
    } catch {
      origin = '';
    }
    const requesting = String((details && details.requestingUrl) || '');
    // the site in the v3 frame, or the native app (its own scheme)
    const trusted = (origin && origin === new URL(siteHome()).origin) || requesting.startsWith('amookht://app/');
    const allowed = ['media', 'audioCapture', 'videoCapture', 'notifications', 'clipboard-sanitized-write', 'fullscreen'];
    callback(!!trusted && allowed.includes(permission));
  });

  ses.on('will-download', (_event, item) => {
    const filename = item.getFilename();
    item.once('done', (_e, status) => {
      if (status !== 'completed' || !Notification.isSupported()) return;
      const notification = new Notification({
        title: 'دانلود کامل شد',
        body: filename,
        icon: windowIcon(),
      });
      notification.on('click', () => {
        const savePath = item.getSavePath();
        if (savePath) shell.showItemInFolder(savePath);
      });
      notification.show();
    });
  });
}

/* ---------------------------------------------------------------------- ipc */

function publicSettings() {
  return {
    ...state.settings,
    ...accountInfo(),
    widgetVisible: !!(widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()),
  };
}

function sanitizePatch(patch) {
  const next = { ...state.settings };
  if (!patch || typeof patch !== 'object') return next;

  if (typeof patch.baseUrl === 'string' && patch.baseUrl.trim()) {
    next.baseUrl = patch.baseUrl.trim().replace(/\/+$/, '');
  }
  if (['fa', 'en', 'de'].includes(patch.lang)) next.lang = patch.lang;
  if (['system', 'light', 'dark'].includes(patch.theme)) next.theme = patch.theme;
  if (ACCENTS.includes(patch.accent)) next.accent = patch.accent;
  if (typeof patch.reduceMotion === 'boolean') next.reduceMotion = patch.reduceMotion;
  if (typeof patch.widgetEnabled === 'boolean') next.widgetEnabled = patch.widgetEnabled;
  if (typeof patch.widgetAlwaysOnTop === 'boolean') next.widgetAlwaysOnTop = patch.widgetAlwaysOnTop;
  if (typeof patch.widgetCompact === 'boolean') next.widgetCompact = patch.widgetCompact;
  if (typeof patch.startWithWindows === 'boolean') next.startWithWindows = patch.startWithWindows;
  if (typeof patch.closeToTray === 'boolean') next.closeToTray = patch.closeToTray;
  if (Number.isFinite(Number(patch.autoRefreshSeconds))) {
    next.autoRefreshSeconds = Math.max(15, Math.min(900, Math.round(Number(patch.autoRefreshSeconds))));
  }
  if (UI_SCALES.includes(Number(patch.uiScale))) next.uiScale = Number(patch.uiScale);
  return next;
}

function registerIpc() {
  ipcMain.handle('settings:get', () => ({
    settings: { ...state.settings },
    ...accountInfo(),
    widgetVisible: !!(widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()),
    version: app.getVersion(),
    siteUrl: siteHome(),
    dataFolder: app.getPath('userData'),
  }));

  ipcMain.handle('settings:save', (_event, patch) => {
    const previous = state.settings;
    const next = sanitizePatch(patch);
    state.settings = next;
    saveState(true);

    if (previous.startWithWindows !== next.startWithWindows) applyAutostart();
    if (previous.widgetEnabled !== next.widgetEnabled) {
      if (next.widgetEnabled) showWidget(false);
      else hideWidget();
    }
    if (previous.widgetAlwaysOnTop !== next.widgetAlwaysOnTop) applyWidgetOptions();
    if (previous.widgetCompact !== next.widgetCompact && next.widgetEnabled) showWidget(false);
    if (previous.uiScale !== next.uiScale) applyUiScale();
    if (previous.theme !== next.theme) applyWindowChrome();
    if (previous.baseUrl !== next.baseUrl) broadcast('settings:changed', publicSettings());
    // Theme, accent and language belong to the site; pass changes made in the
    // native settings window on to it so both stay the same.
    const apply = {};
    if (previous.theme !== next.theme) apply.dark = darkNow();
    if (previous.accent !== next.accent) apply.accent = ACCENT_TO_SITE[next.accent] || 'violet';
    if (previous.lang !== next.lang) apply.lang = next.lang;
    if (Object.keys(apply).length) sendToShell('site:apply', apply);

    broadcast('settings:changed', publicSettings());
    updateTrayMenu();
    Menu.setApplicationMenu(buildAppMenu());
    return { settings: { ...state.settings }, ...accountInfo(), version: app.getVersion(), dataFolder: app.getPath('userData') };
  });

  ipcMain.handle('widget:set-enabled', (_event, enabled) => setWidgetEnabled(enabled));
  ipcMain.handle('widget:toggle', () => setWidgetEnabled(!state.settings.widgetEnabled));
  ipcMain.handle('widget:show', () => {
    if (!state.settings.widgetEnabled) setWidgetEnabled(true);
    else showWidget(false);
    return publicSettings();
  });
  ipcMain.handle('widget:hide', () => {
    hideWidget();
    return { ok: true };
  });

  ipcMain.handle('settings:open', () => {
    createSettingsWindow();
    return { ok: true };
  });

  ipcMain.handle('app:show', () => {
    showApp();
    return { ok: true };
  });

  ipcMain.handle('app:session', () => ({
    ...accountInfo(),
    version: app.getVersion(),
    lastSection: state.lastSection,
    settings: { ...state.settings },
    siteUrl: siteHome(),
    sidebarCompact: !!state.sidebarCompact,
    siteZoom: Number(state.siteZoom) || 1,
    widgetVisible: !!(widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()),
  }));

  // Called by the shell right before it (re)loads the site: make sure the token
  // the site and the gate will see is valid for a while.
  ipcMain.handle('shell:prepare', async () => {
    const current = await ensureFreshSession();
    return { ok: !!current, siteUrl: siteHome(), ...accountInfo() };
  });

  // preload-site.js asks for the tokens synchronously, before any site script runs.
  ipcMain.on('site:boot', (event) => {
    const origin = event.senderFrame ? event.senderFrame.origin : '';
    const current = currentSession();
    event.returnValue = origin && origin === siteOrigin()
      ? { origin, tokens: siteTokens(), email: current ? current.email : '' }
      : null;
  });

  // The site rotated or removed its tokens (its own refresh or «خروج از حساب»).
  ipcMain.on('site:tokens', (event, raw) => {
    const origin = event.senderFrame ? event.senderFrame.origin : '';
    if (!origin || origin !== siteOrigin()) return;
    // A missing token is not a sign-out: the site also drops it when a page
    // load races a backend restart. Real sign-outs arrive from the shell (the
    // site's logout() is wrapped there); the next site load re-seeds the token.
    if (raw === null || raw === '') return;
    try {
      const tokens = JSON.parse(String(raw));
      const current = currentSession();
      if (!tokens || !tokens.access_token || !current) return;
      if (tokens.access_token === current.access) return;
      storeSession({
        access: tokens.access_token,
        refresh: tokens.refresh_token || current.refresh,
        email: current.email,
        expiresIn: Number(tokens.expires_in) || 900,
      });
    } catch {
      /* not JSON — ignore */
    }
  });

  // The site's own theme/accent/language win: mirror them into the native
  // windows (widget, settings, title bar) whenever the learner changes them.
  ipcMain.handle('shell:site-prefs', (_event, prefs) => {
    if (!prefs || typeof prefs !== 'object') return { ok: false };
    const next = { ...state.settings };
    if (typeof prefs.dark === 'boolean' && prefs.dark !== darkNow()) next.theme = prefs.dark ? 'dark' : 'light';
    if (ACCENT_FROM_SITE[prefs.accent]) next.accent = ACCENT_FROM_SITE[prefs.accent];
    if (['fa', 'en', 'de'].includes(prefs.lang)) next.lang = prefs.lang;
    const changed = ['theme', 'accent', 'lang'].some((key) => next[key] !== state.settings[key]);
    if (changed) {
      state.settings = next;
      saveState();
      applyWindowChrome();
      broadcast('settings:changed', publicSettings());
    }
    return { ok: true, changed };
  });

  /* ---- v4 native engine ---- */

  const fromAppWindow = (event) => appWindow && !appWindow.isDestroyed() && event.sender === appWindow.webContents;

  // The live-sync WebSocket runs in the native renderer; it needs a fresh
  // access token for its first frame. Only the main app window may ask.
  ipcMain.handle('sync:token', async (event) => {
    if (!fromAppWindow(event)) return null;
    const current = await ensureFreshSession();
    if (!current) return null;
    const origin = siteOrigin();
    return {
      token: current.access,
      wsUrl: origin.replace(/^http/, 'ws') + '/v1/sync/ws',
      email: current.email,
    };
  });

  // Lesson packs are plain scripts on the site (window.X = …). Keep a local copy
  // (revalidated with ETag at most every 6 h) and serve it as amookht://content/<name>.
  ipcMain.handle('content:ensure', async (event, name) => {
    if (!fromAppWindow(event) || !CONTENT_FILES.includes(name)) return { ok: false, error: 'unknown_content' };
    return ensureContent(name);
  });

  /* ---- library (premium): PDF bytes, PDF upload, live change events ---- */
  const libraryId = (value) => /^[A-Za-z0-9_-]{1,80}$/.test(String(value || ''));
  const authorized = async (run) => {
    let current = currentSession();
    if (!current) return { ok: false, error: { code: 'no_session', status: 401 } };
    let response = await run(current.access);
    if (response.status === 401 && (await refreshSession())) {
      current = currentSession();
      response = await run(current.access);
    }
    return { ok: response.ok, response };
  };

  ipcMain.handle('library:file', async (event, id) => {
    if (!fromAppWindow(event) || !libraryId(id)) return { ok: false, error: { code: 'bad_request' } };
    try {
      const { ok, response } = await authorized((token) => fetch(baseUrl() + '/v1/library/documents/' + id + '/file', { headers: { Authorization: 'Bearer ' + token } }));
      if (!ok) return { ok: false, error: { code: 'http_' + (response ? response.status : 0), status: response ? response.status : 0 } };
      return { ok: true, bytes: new Uint8Array(await response.arrayBuffer()) };
    } catch (error) {
      return { ok: false, error: { code: 'network_error', message: error.message } };
    }
  });

  ipcMain.handle('library:upload', async (event, payload) => {
    if (process.env.AMOOKHT_READONLY === '1') { console.log('READONLY-BLOCKED', 'library:upload'); return { ok: false, error: { code: 'read_only', status: 423 } }; }
    if (!fromAppWindow(event) || !payload || !(payload.bytes instanceof Uint8Array)) return { ok: false, error: { code: 'bad_request' } };
    const name = String(payload.name || 'document.pdf').slice(0, 240);
    if (payload.folderId && !libraryId(payload.folderId)) return { ok: false, error: { code: 'bad_request' } };
    try {
      const { ok, response } = await authorized((token) => {
        const form = new FormData();
        form.append('file', new Blob([payload.bytes], { type: 'application/pdf' }), name);
        form.append('title', name.replace(/\.pdf$/i, ''));
        if (payload.folderId) form.append('folder_id', payload.folderId);
        return fetch(baseUrl() + '/v1/library/documents', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
      });
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { detail: text.slice(0, 300) }; }
      if (!ok) {
        const failure = errorFromResponse(response.status, data);
        return { ok: false, error: { code: failure.code, status: failure.status, message: failure.message } };
      }
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: { code: 'network_error', message: error.message } };
    }
  });

  // Speaking recordings (Hören summary, Sprechen): multipart upload like the site's /speaking/recordings.
  ipcMain.handle('speaking:upload', async (event, payload) => {
    if (process.env.AMOOKHT_READONLY === '1') { console.log('READONLY-BLOCKED', 'speaking:upload'); return { ok: false, error: { code: 'read_only', status: 423 } }; }
    if (!fromAppWindow(event) || !payload || !(payload.bytes instanceof Uint8Array)) return { ok: false, error: { code: 'bad_request' } };
    const clean = (v, n) => String(v || '').replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, n);
    try {
      const { ok, response } = await authorized((token) => {
        const form = new FormData();
        form.append('plan_id', clean(payload.planId, 80));
        form.append('task_id', clean(payload.taskId, 80));
        form.append('audio', new Blob([payload.bytes], { type: String(payload.mime || 'audio/webm') }), clean(payload.filename, 80) || 'take.webm');
        return fetch(baseUrl() + '/v1/speaking/recordings', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
      });
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { detail: text.slice(0, 300) }; }
      if (!ok) { const f = errorFromResponse(response.status, data); return { ok: false, error: { code: f.code, status: f.status, message: f.message } }; }
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: { code: 'network_error', message: error.message } };
    }
  });

  // Server-sent library events (another device changed a file/note) → 'library:event' to the app window.
  const libraryEvents = { controller: null, generation: 0, retry: 1000, timer: null, target: null };
  const stopLibraryEvents = () => {
    libraryEvents.generation += 1;
    if (libraryEvents.controller) libraryEvents.controller.abort();
    libraryEvents.controller = null;
    clearTimeout(libraryEvents.timer);
  };
  const runLibraryEvents = async (generation) => {
    const controller = new AbortController();
    libraryEvents.controller = controller;
    try {
      const { ok, response } = await authorized((token) => fetch(baseUrl() + '/v1/library/events', { headers: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' }, signal: controller.signal, cache: 'no-store' }));
      if (!ok) throw new Error('library events HTTP ' + (response ? response.status : 0));
      libraryEvents.retry = 1000;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (generation === libraryEvents.generation) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true }).replace(/\r/g, '');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const line = block.split('\n').find((value) => value.startsWith('data:'));
          if (!line) continue;
          try {
            const message = JSON.parse(line.slice(5).trim());
            if (message.item_kind && libraryEvents.target && !libraryEvents.target.isDestroyed()) libraryEvents.target.send('library:event', message);
          } catch { /* ignore bad frames */ }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.warn('Library events:', error.message);
    } finally {
      if (generation === libraryEvents.generation) {
        const delay = libraryEvents.retry;
        libraryEvents.retry = Math.min(10000, Math.round(delay * 1.7));
        libraryEvents.timer = setTimeout(() => {
          if (generation === libraryEvents.generation) runLibraryEvents(generation);
        }, delay);
      }
    }
  };
  ipcMain.handle('library:events', async (event, on) => {
    if (!fromAppWindow(event)) return { ok: false };
    stopLibraryEvents();
    if (on) {
      libraryEvents.target = event.sender;
      runLibraryEvents(libraryEvents.generation);
    }
    return { ok: true };
  });

  ipcMain.handle('app:engine', async (event, engine) => {
    if (!['site', 'native'].includes(engine)) return { ok: false };
    state.settings.engine = engine;
    saveState(true);
    if (appWindow && !appWindow.isDestroyed()) {
      if (engine === 'native') appWindow.loadURL('amookht://app/native/index.html');
      else appWindow.loadFile(path.join(__dirname, '..', 'src', 'app.html'));
    }
    return { ok: true, engine };
  });

  ipcMain.handle('shell:layout', (_event, patch) => {
    if (patch && typeof patch.sidebarCompact === 'boolean') state.sidebarCompact = patch.sidebarCompact;
    if (patch && Number(patch.siteZoom) >= 0.5 && Number(patch.siteZoom) <= 2) {
      state.siteZoom = Math.round(Number(patch.siteZoom) * 100) / 100;
      if (siteGuest && !siteGuest.isDestroyed()) siteGuest.setZoomFactor(state.siteZoom);
    }
    saveState();
    return { sidebarCompact: state.sidebarCompact, siteZoom: state.siteZoom };
  });

  ipcMain.handle('app:set-last-section', (_event, section) => {
    if (SECTIONS.includes(section)) {
      state.lastSection = section;
      saveState();
    }
    return { ok: true };
  });

  // Single, guarded API bridge for the native UI. The access token never leaves
  // the main process: the renderer can only ask for /v1/… paths on the server.
  ipcMain.handle('api:request', async (_event, payload) => {
    try {
      const pathname = String((payload && payload.path) || '');
      // /v1/… = backend API; /coach/api/… = the coach service (translate, voices), behind the gate.
      // SIM-AUDIO: the pre-made Hören files of the TestDaF simulation (GET only, exact file pattern)
      const simAudio = /^\/sim-audio\/[0-9a-f]{20}\.mp3$/.test(pathname) && String((payload && payload.method) || 'GET').toUpperCase() === 'GET';
      if (!pathname.startsWith('/v1/') && !pathname.startsWith('/coach/api/') && !simAudio) {
        return { ok: false, error: { code: 'bad_path', status: 400, message: 'مسیر درخواست نامعتبر است.' } };
      }
      const method = String((payload && payload.method) || 'GET').toUpperCase();
      // test switch for read-only runs on a real account: every write is refused and logged
      if (process.env.AMOOKHT_READONLY === '1' && method !== 'GET') {
        console.log('READONLY-BLOCKED', method, pathname);
        return { ok: false, error: { code: 'read_only', status: 423, message: 'read-only test run' } };
      }
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return { ok: false, error: { code: 'bad_method', status: 400, message: 'روش درخواست نامعتبر است.' } };
      }
      const data = await apiRequest(pathname, {
        method,
        body: payload && payload.body !== undefined ? payload.body : undefined,
        auth: !(payload && payload.auth === false),
        binary: !!(payload && payload.binary),
        retry: true,
        // AI analysis may take up to ~2 min on the server (text 55 s, speech 70 s + transcription)
        timeout: Math.max(5000, Math.min(150000, Number(payload && payload.timeout) || REQUEST_TIMEOUT_MS)),
      });
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: (error && error.code) || 'request_failed',
          status: (error && error.status) || 0,
          message: (error && error.message) || 'درخواست انجام نشد.',
        },
      };
    }
  });

  // owner content packs: read a pack file from disk / write one back to disk
  ipcMain.handle('pack:open-file', async () => {
    const result = await dialog.showOpenDialog(appWindow, {
      title: 'انتخاب فایل پک آموخت',
      filters: [{ name: 'Amookht pack', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (!result || result.canceled || !result.filePaths || !result.filePaths.length) return { ok: false, canceled: true };
    const file = result.filePaths[0];
    try {
      const stat = fs.statSync(file);
      if (stat.size > 8 * 1024 * 1024) return { ok: false, error: { message: 'حجم فایل پک بیش از ۸ مگابایت است.' } };
      return { ok: true, name: path.basename(file), text: fs.readFileSync(file, 'utf8') };
    } catch (error) {
      return { ok: false, error: { message: (error && error.message) || 'خواندن فایل انجام نشد.' } };
    }
  });

  ipcMain.handle('pack:save-file', async (_event, payload) => {
    const suggested = String((payload && payload.name) || 'amookht-pack.json').replace(/[^\w.\-]+/g, '-');
    const result = await dialog.showSaveDialog(appWindow, {
      title: 'ذخیرهٔ پک آموخت',
      defaultPath: path.join(app.getPath('downloads'), suggested),
      filters: [{ name: 'Amookht pack', extensions: ['json'] }],
    });
    if (!result || result.canceled || !result.filePath) return { ok: false, canceled: true };
    try {
      fs.writeFileSync(result.filePath, String((payload && payload.text) || ''), 'utf8');
      return { ok: true, path: result.filePath };
    } catch (error) {
      return { ok: false, error: { message: (error && error.message) || 'ذخیرهٔ فایل انجام نشد.' } };
    }
  });

  ipcMain.handle('auth:signin', async (_event, payload) => {
    try {
      const email = String((payload && payload.email) || '').trim();
      const password = String((payload && payload.password) || '');
      if (!email || !password) throw new ApiError('ایمیل و رمز عبور را کامل وارد کنید.', 'missing_credentials', 400);
      const { response, data } = await fetchJson('/v1/auth/login', { method: 'POST', body: { email, password } });
      if (!response.ok) throw errorFromResponse(response.status, data);
      if (!data || !data.access_token) throw new ApiError('پاسخ ورود نامعتبر بود.', 'bad_login_response', 502);
      storeSession({ access: data.access_token, refresh: data.refresh_token, email, expiresIn: data.expires_in });
      return { ok: true, email };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: (error && error.code) || 'request_failed',
          status: (error && error.status) || 0,
          message: (error && error.message) || 'ورود انجام نشد.',
        },
      };
    }
  });

  ipcMain.handle('auth:login', async (_event, payload) => {
    const email = String((payload && payload.email) || '').trim();
    const password = String((payload && payload.password) || '');
    if (!email || !password) throw new ApiError('ایمیل و رمز عبور را کامل وارد کنید.', 'missing_credentials', 400);
    const { response, data } = await fetchJson('/v1/auth/login', { method: 'POST', body: { email, password } });
    if (!response.ok) throw errorFromResponse(response.status, data);
    if (!data || !data.access_token) throw new ApiError('پاسخ ورود نامعتبر بود.', 'bad_login_response', 502);
    storeSession({ access: data.access_token, refresh: data.refresh_token, email, expiresIn: data.expires_in });
    return { email };
  });

  ipcMain.handle('auth:logout', () => {
    clearSession();
    return { ok: true };
  });

  ipcMain.handle('data:load', async () => {
    try {
      const payload = await apiRequest('/v1/widget/today');
      state.cache = { payload, savedAt: Date.now() };
      saveState();
      return { payload, cached: false, savedAt: state.cache.savedAt, ...accountInfo() };
    } catch (error) {
      const canUseCache =
        state.cache && state.cache.payload && ['network_error', 'timeout', 'request_failed'].includes(error.code);
      if (canUseCache) {
        return { payload: state.cache.payload, cached: true, savedAt: state.cache.savedAt, ...accountInfo(), warning: error.message };
      }
      throw error;
    }
  });

  ipcMain.handle('task:toggle', async (_event, payload) => {
    const id = String((payload && payload.id) || '');
    if (!id) throw new ApiError('شناسهٔ کار نامعتبر است.', 'bad_task', 400);
    const body = typeof payload.done === 'boolean' ? { done: payload.done } : undefined;
    const data = await apiRequest('/v1/widget/tasks/' + encodeURIComponent(id) + '/toggle', { method: 'POST', body });
    state.cache = { payload: data, savedAt: Date.now() };
    saveState();
    return data;
  });

  ipcMain.handle('task:add', async (_event, payload) => {
    const title = String((payload && payload.title) || '').trim();
    const minutes = Math.max(1, Math.min(240, Math.round(Number(payload && payload.minutes) || 15)));
    if (!title) throw new ApiError('عنوان کار را بنویسید.', 'missing_title', 400);
    await apiRequest('/v1/widget/tasks', { method: 'POST', body: { title, minutes } });
    const data = await apiRequest('/v1/widget/today');
    state.cache = { payload: data, savedAt: Date.now() };
    saveState();
    return data;
  });

  ipcMain.handle('note:add', async (_event, payload) => {
    const title = String((payload && payload.title) || '').trim();
    const content = String((payload && payload.content) || '');
    if (!title) throw new ApiError('عنوان یادداشت را بنویسید.', 'missing_title', 400);
    await apiRequest('/v1/widget/notes', { method: 'POST', body: { title, content } });
    const data = await apiRequest('/v1/widget/today');
    state.cache = { payload: data, savedAt: Date.now() };
    saveState();
    return data;
  });

  /* Widget v3: the account's to-do list and quick notes (/v1/widget/data),
     the same lists the website's widget API serves. */
  const widgetData = async () => {
    const payload = await apiRequest('/v1/widget/data');
    state.cache = { payload, savedAt: Date.now() };
    saveState();
    return payload;
  };
  const widgetResult = async (job) => {
    try {
      const data = await job();
      return { ok: true, data, ...accountInfo() };
    } catch (error) {
      const cached = state.cache && state.cache.payload && state.cache.payload.todos ? state.cache.payload : null;
      return {
        ok: false,
        data: ['network_error', 'timeout'].includes(error && error.code) ? cached : null,
        cachedAt: cached ? state.cache.savedAt : 0,
        error: { code: (error && error.code) || 'request_failed', status: (error && error.status) || 0, message: (error && error.message) || '' },
        ...accountInfo(),
      };
    }
  };

  ipcMain.handle('widget:data', () => widgetResult(widgetData));

  ipcMain.handle('todo:add', (_event, title) => widgetResult(async () => {
    const text = String(title || '').trim().slice(0, 200);
    if (!text) throw new ApiError('عنوان کار را بنویسید.', 'missing_title', 400);
    await apiRequest('/v1/widget/todos', { method: 'POST', body: { title: text } });
    return widgetData();
  }));

  ipcMain.handle('todo:toggle', (_event, payload) => widgetResult(async () => {
    const id = String((payload && payload.id) || '');
    if (!/^[\w-]{1,64}$/.test(id)) throw new ApiError('شناسهٔ کار نامعتبر است.', 'bad_id', 400);
    const body = typeof (payload && payload.done) === 'boolean' ? { done: payload.done } : {};
    await apiRequest('/v1/widget/todos/' + encodeURIComponent(id) + '/toggle', { method: 'POST', body });
    return widgetData();
  }));

  ipcMain.handle('todo:delete', (_event, id) => widgetResult(async () => {
    const value = String(id || '');
    if (!/^[\w-]{1,64}$/.test(value)) throw new ApiError('شناسهٔ کار نامعتبر است.', 'bad_id', 400);
    await apiRequest('/v1/widget/todos/' + encodeURIComponent(value), { method: 'DELETE' });
    return widgetData();
  }));

  ipcMain.handle('widget-note:add', (_event, payload) => widgetResult(async () => {
    const title = String((payload && payload.title) || '').trim().slice(0, 240);
    const content = String((payload && payload.content) || '').slice(0, 20000);
    if (!title) throw new ApiError('عنوان یادداشت را بنویسید.', 'missing_title', 400);
    await apiRequest('/v1/widget/notes', { method: 'POST', body: { title, content } });
    return widgetData();
  }));

  ipcMain.handle('widget:pin', (_event, pinned) => {
    state.settings.widgetAlwaysOnTop = !!pinned;
    saveState();
    applyWidgetOptions();
    broadcast('settings:changed', publicSettings());
    return publicSettings();
  });

  ipcMain.handle('app:open-section', (_event, section) => {
    navigateApp(SECTIONS.includes(section) ? section : 'dashboard');
    return { ok: true };
  });

  ipcMain.handle('app:open-path', (_event, pathname) => {
    if (typeof pathname !== 'string' || !pathname.startsWith('/')) return { ok: false };
    openToolWindow(pathname, '');
    return { ok: true };
  });

  ipcMain.handle('app:open-tool', (_event, payload) => {
    const pathname = String((payload && payload.path) || '/');
    const title = String((payload && payload.title) || '');
    openToolWindow(pathname, title);
    return { ok: true };
  });

  ipcMain.handle('app:open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle('app:data-folder', async () => {
    await shell.openPath(app.getPath('userData'));
    return { ok: true };
  });

  ipcMain.handle('app:reset-layout', () => {
    state.appBounds = { ...DEFAULT_APP_BOUNDS };
    state.widgetBounds = { ...DEFAULT_WIDGET_BOUNDS };
    saveState(true);
    if (appWindow && !appWindow.isDestroyed()) {
      appWindow.unmaximize();
      appWindow.setBounds(clampBounds(state.appBounds, { width: 1040, height: 680 }));
    }
    if (widgetWindow && !widgetWindow.isDestroyed()) widgetWindow.setBounds(widgetBounds());
    return { ok: true };
  });

  ipcMain.handle('window:action', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return { ok: false };
    switch (action) {
      case 'minimize':
        win.minimize();
        break;
      case 'hide':
        win.hide();
        break;
      case 'close':
        win.close();
        break;
      case 'focus':
        win.focus();
        break;
      default:
        break;
    }
    return { ok: true };
  });
}

/* --------------------------------------------------------------- lifecycle */

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => showApp());

  app.whenReady().then(() => {
    readState();
    registerAppProtocol();
    configureSession();
    registerIpc();
    Menu.setApplicationMenu(buildAppMenu());
    createTray();
    applyAutostart();
    startTokenKeeper();
    setupUpdates();

    const startHidden = process.argv.includes('--hidden');
    createAppWindow({ show: !startHidden });
    if (startHidden && state.settings.widgetEnabled) showWidget(false);

    globalShortcut.register('CommandOrControl+Alt+W', () => setWidgetEnabled(!state.settings.widgetEnabled));
    globalShortcut.register('CommandOrControl+Alt+A', () => showApp());

    tickTimer = setInterval(() => {
      if (widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()) {
        widgetWindow.webContents.send('amookht:tick');
      }
    }, 60000);

    nativeTheme.on('updated', () => {
      if (state.settings.theme === 'system') {
        applyWindowChrome();
        broadcast('theme:system', darkNow() ? 'dark' : 'light');
      }
    });

    app.on('activate', () => showApp());
  });

  app.on('before-quit', () => {
    isQuitting = true;
    if (tickTimer) clearInterval(tickTimer);
    globalShortcut.unregisterAll();
    saveState(true);
  });

  app.on('window-all-closed', () => {
    if (!state.settings.closeToTray) app.quit();
  });

  process.on('unhandledRejection', (reason) => console.warn('Unhandled rejection:', reason));
}
