'use strict';

/* Amookht for Windows — shell (v3).

   The app is a Windows frame (title bar, NavigationView sidebar, command
   palette, status bar, tray/widget) around the real Amookht web app, which runs
   in a <webview>. Every page, option and colour of learn.tah3in.com is therefore
   available as-is; the frame only replaces the site's own sidebar/dock and keeps
   theme, accent, language and account in step with it. */

const bridge = window.amookht;
const $ = (selector, root = document) => root.querySelector(selector);

/* ─────────────────────────────── texts ─────────────────────────────── */

const TEXTS = {
  fa: {
    dir: 'rtl',
    desktopApp: 'نسخهٔ ویندوز',
    authTitle1: 'آلمانی را',
    authTitle2: 'جدی یاد بگیر',
    authSub: 'همهٔ بخش‌های آموخت — اجرای برنامه، دفتر عبارات، علاقه‌مندی‌ها، کتابخانه، مربی گفتگو، شبیه‌سازی آزمون و تاریخچه — در یک برنامهٔ ویندوزی.',
    point1Title: 'برنامهٔ یادگیری کامل',
    point1Text: 'همان برنامهٔ روزانه و تمرین‌های سایت، بی‌کم‌وکاست',
    point2Title: 'تمرین واقعی، نه تئوری',
    point2Text: 'گرامر، واژگان، شنیدن و گفتن با بازخورد فوری',
    point3Title: 'همیشه همراه دسکتاپ',
    point3Text: 'ویجت رومیزی کارها و یادداشت‌ها، با یک کلید',
    authFoot: 'همان حساب سایت آموخت — بدون نیاز به مرورگر',
    signInTitle: 'ورود به حساب',
    signInSub: 'ایمیل و رمز عبور حساب آموخت خود را وارد کنید.',
    email: 'ایمیل',
    password: 'رمز عبور',
    signIn: 'ورود',
    signingIn: 'در حال ورود…',
    rememberNote: 'نشست با کلید رمزنگاری ویندوز محفوظ می‌ماند.',
    openSite: 'باز کردن سایت',
    authLegal: 'با ورود، تمام امکانات حساب و برنامهٔ مطالعاتی شما در همین برنامه در دسترس است.',
    widget: 'ویجت',
    desktopWidget: 'ویجت رومیزی',
    windowsSettings: 'تنظیمات ویندوز',
    loadingSite: 'در حال آماده‌سازی…',
    offlineTitle: 'اتصال برقرار نشد',
    offlineText: 'به سرور آموخت دسترسی نداریم. اینترنت را بررسی کنید؛ برنامه خودش دوباره تلاش می‌کند.',
    retry: 'تلاش دوباره',
    search: 'جستجوی بخش‌ها و فرمان‌ها',
    searchPlaceholder: 'نام بخش یا فرمان را بنویسید…',
    noResults: 'چیزی پیدا نشد.',
    groupPages: 'بخش‌ها',
    groupLook: 'ظاهر',
    groupApp: 'برنامه',
    statusOnline: 'متصل',
    statusLoading: 'در حال بارگذاری',
    statusOffline: 'بدون اتصال',
    darkMode: 'حالت تاریک',
    lightMode: 'حالت روشن',
    accentColor: 'رنگ اصلی',
    language: 'زبان',
    density: 'تراکم صفحه',
    densityCompact: 'فشرده',
    densityComfortable: 'استاندارد',
    densitySpacious: 'باز',
    glass: 'افکت شیشه‌ای',
    contrast: 'کنتراست بیشتر',
    resetLook: 'بازنشانی تنظیمات ظاهر',
    sidebar: 'جمع/باز کردن نوار کناری',
    reload: 'بازخوانی',
    reloadHard: 'بازخوانی کامل (بدون حافظهٔ موقت)',
    zoomIn: 'بزرگ‌نمایی',
    zoomOut: 'کوچک‌نمایی',
    zoomReset: 'اندازهٔ اصلی',
    openBrowser: 'باز کردن در مرورگر',
    signOut: 'خروج از حساب',
    accountSettings: 'تنظیمات حساب',
    back: 'بازگشت (Alt+←)',
    forward: 'جلو (Alt+→)',
    themeToggle: 'تیره/روشن',
    langMenu: 'زبان برنامه',
    widgetOn: 'ویجت رومیزی روشن شد',
    widgetOff: 'ویجت رومیزی خاموش شد',
    signedOut: 'از حساب خارج شدید.',
    sessionExpired: 'نشست شما منقضی شد؛ دوباره وارد شوید.',
    gateStuck: 'قفل سایت هنوز فعال است؛ رمز ورود پروژه را وارد کنید.',
    networkError: 'اتصال به سرور برقرار نشد.',
    invalidCredentials: 'ایمیل یا رمز عبور درست نیست.',
    loadFailed: 'بارگذاری انجام نشد.',
    free: 'رایگان',
    premium: 'Premium',
    admin: 'مدیر',
    owner: 'مالک',
  },
  en: {
    dir: 'ltr',
    desktopApp: 'Windows app',
    authTitle1: 'Learn German',
    authTitle2: 'seriously',
    authSub: 'All of Amookht — run your plan, vocabulary notebook, favourites, library, Deutsch Coach, exam simulator and history — in one Windows app.',
    point1Title: 'Your complete learning plan',
    point1Text: 'The same daily plan and exercises as the website',
    point2Title: 'Real practice, not theory',
    point2Text: 'Grammar, vocabulary, listening and speaking with instant feedback',
    point3Title: 'Always on your desktop',
    point3Text: 'Desktop widget with tasks and notes, one shortcut away',
    authFoot: 'Your Amookht account — no browser needed',
    signInTitle: 'Sign in',
    signInSub: 'Use the email and password of your Amookht account.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    rememberNote: 'Your session is protected by Windows encryption.',
    openSite: 'Open website',
    authLegal: 'After signing in, every part of your account and study plan is available here.',
    widget: 'Widget',
    desktopWidget: 'Desktop widget',
    windowsSettings: 'Windows settings',
    loadingSite: 'Getting ready…',
    offlineTitle: 'No connection',
    offlineText: 'The Amookht server cannot be reached. Check the internet; the app retries by itself.',
    retry: 'Try again',
    search: 'Search pages and commands',
    searchPlaceholder: 'Type a page or command…',
    noResults: 'Nothing found.',
    groupPages: 'Pages',
    groupLook: 'Appearance',
    groupApp: 'App',
    statusOnline: 'Connected',
    statusLoading: 'Loading',
    statusOffline: 'Offline',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    accentColor: 'Accent',
    language: 'Language',
    density: 'Density',
    densityCompact: 'Compact',
    densityComfortable: 'Standard',
    densitySpacious: 'Spacious',
    glass: 'Glass effect',
    contrast: 'Higher contrast',
    resetLook: 'Reset appearance settings',
    sidebar: 'Collapse/expand sidebar',
    reload: 'Reload',
    reloadHard: 'Hard reload (skip cache)',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomReset: 'Actual size',
    openBrowser: 'Open in browser',
    signOut: 'Sign out',
    accountSettings: 'Account settings',
    back: 'Back (Alt+←)',
    forward: 'Forward (Alt+→)',
    themeToggle: 'Dark/light',
    langMenu: 'App language',
    widgetOn: 'Desktop widget on',
    widgetOff: 'Desktop widget off',
    signedOut: 'You are signed out.',
    sessionExpired: 'Your session expired; please sign in again.',
    gateStuck: 'The site lock is still active; enter the project password.',
    networkError: 'Could not reach the server.',
    invalidCredentials: 'Email or password is incorrect.',
    loadFailed: 'Loading failed.',
    free: 'Free',
    premium: 'Premium',
    admin: 'Admin',
    owner: 'Owner',
  },
};
TEXTS.de = {
  ...TEXTS.en,
  desktopApp: 'Windows-App',
  authTitle1: 'Deutsch lernen,',
  authTitle2: 'aber richtig',
  signInTitle: 'Anmelden',
  signInSub: 'E-Mail und Passwort deines Amookht-Kontos.',
  email: 'E-Mail',
  password: 'Passwort',
  signIn: 'Anmelden',
  signingIn: 'Anmeldung…',
  openSite: 'Website öffnen',
  widget: 'Widget',
  desktopWidget: 'Desktop-Widget',
  windowsSettings: 'Windows-Einstellungen',
  loadingSite: 'Wird vorbereitet…',
  offlineTitle: 'Keine Verbindung',
  offlineText: 'Der Amookht-Server ist nicht erreichbar. Prüfe das Internet; die App versucht es selbst erneut.',
  retry: 'Erneut versuchen',
  search: 'Seiten und Befehle suchen',
  searchPlaceholder: 'Seite oder Befehl eingeben…',
  noResults: 'Nichts gefunden.',
  groupPages: 'Seiten',
  groupLook: 'Darstellung',
  groupApp: 'App',
  statusOnline: 'Verbunden',
  statusLoading: 'Lädt',
  statusOffline: 'Offline',
  darkMode: 'Dunkelmodus',
  lightMode: 'Hellmodus',
  accentColor: 'Akzentfarbe',
  language: 'Sprache',
  density: 'Dichte',
  densityCompact: 'Kompakt',
  densityComfortable: 'Standard',
  densitySpacious: 'Großzügig',
  glass: 'Glaseffekt',
  contrast: 'Mehr Kontrast',
  resetLook: 'Darstellung zurücksetzen',
  sidebar: 'Seitenleiste ein-/ausklappen',
  reload: 'Neu laden',
  reloadHard: 'Komplett neu laden',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  zoomReset: 'Originalgröße',
  openBrowser: 'Im Browser öffnen',
  signOut: 'Abmelden',
  accountSettings: 'Kontoeinstellungen',
  back: 'Zurück (Alt+←)',
  forward: 'Vor (Alt+→)',
  themeToggle: 'Dunkel/hell',
  langMenu: 'App-Sprache',
  widgetOn: 'Desktop-Widget an',
  widgetOff: 'Desktop-Widget aus',
  signedOut: 'Du bist abgemeldet.',
  sessionExpired: 'Sitzung abgelaufen; bitte erneut anmelden.',
  free: 'Kostenlos',
  admin: 'Admin',
  owner: 'Inhaber',
};

/* Site screens in the site's own sidebar order (renderGlobalNav). Labels come
   from the site itself once it is loaded; these are the first-paint fallbacks. */
const NAV = [
  { id: 'dashboard', icon: 'M3 11 12 3l9 8v10h-6v-6H9v6H3z', fa: 'اجرای برنامه', en: 'Run program', de: 'Plan starten' },
  { id: 'errorbook', icon: 'M5 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 5v2h8V8zm0 4v2h6v-2z', fa: 'دفتر عبارات', en: 'Vocabulary notebook', de: 'Vokabelheft' },
  { id: 'favorites', icon: 'M12 21 3.5 12.6A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.6z', fa: 'علاقه‌مندی‌ها', en: 'Favourites', de: 'Favoriten', count: 'fav' },
  { id: 'library', icon: 'M4 4h4v16H4zm6 0h4v16h-4zm5.5 1.2 3.9-1 4 15.5-3.9 1z', fa: 'کتابخانه', en: 'Library', de: 'Bibliothek', premium: true },
  { id: 'deutschCoach', icon: 'M4 4h16v11H8l-4 4zm4 4v2h8V8zm0 3v1h5v-1z', fa: 'مربی گفتگو', en: 'Deutsch Coach', de: 'Deutsch Coach', premium: true },
  { id: 'testdafSim', icon: 'M6 2h9l5 5v15H6zm8 1v5h5M9 12h8v2H9zm0 4h8v2H9z', fa: 'شبیه‌سازی آزمون', en: 'Exam simulator', de: 'Prüfungssimulation', premium: true },
  { id: 'history', icon: 'M13 3a9 9 0 1 1-8.5 6H7a7 7 0 1 0 6-4V8L9 4l4-4zm-1 5h2v5l4 2-1 1.7-5-2.7z', fa: 'تاریخچه', en: 'History', de: 'Verlauf', count: 'hist' },
  { id: 'appSettings', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4c0-.4 0-.9-.1-1.3l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.3-1.3L15.8 2h-4l-.4 2.4a8 8 0 0 0-2.3 1.3l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.3 1.3l.4 2.4h4l.4-2.4a8 8 0 0 0 2.3-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z', fa: 'تنظیمات برنامه', en: 'App settings', de: 'App-Einstellungen' },
  { id: 'adminUsers', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 20c0-3.3 3.6-6 8-6s8 2.7 8 6zm16.5-5.8c2.9.5 5.5 2.5 5.5 5.8h-4.5c0-2.3-.4-4.2-1-5.8z', fa: 'مدیریت', en: 'Management', de: 'Verwaltung', admin: true },
];
const ACCOUNT_SCREEN = { id: 'settings', icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z', fa: 'تنظیمات حساب', en: 'Account settings', de: 'Kontoeinstellungen' };

const SITE_ACCENTS = {
  violet: ['#7c5cff', '#a855f7', { fa: 'بنفش', en: 'Violet', de: 'Violett' }],
  blue: ['#2563eb', '#38bdf8', { fa: 'آبی', en: 'Blue', de: 'Blau' }],
  emerald: ['#059669', '#34d399', { fa: 'سبز', en: 'Emerald', de: 'Smaragd' }],
  rose: ['#e11d48', '#fb7185', { fa: 'رز', en: 'Rose', de: 'Rose' }],
  amber: ['#d97706', '#fbbf24', { fa: 'کهربایی', en: 'Amber', de: 'Bernstein' }],
};
const LANGS = { fa: 'فارسی', en: 'English', de: 'Deutsch' };
const ZOOMS = [0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75];

const state = {
  lang: 'fa',
  settings: null,
  siteUrl: '',
  version: '',
  lastSection: 'dashboard',
  site: null, // latest snapshot from the site helper
  view: null, // <webview>
  loading: false,
  failed: false,
  firstReady: false,
  resumed: false,
  signInRetry: 0,
  zoom: 1,
  compact: false,
  online: navigator.onLine,
  widgetOn: false,
};

const t = (key) => {
  const dict = TEXTS[state.lang] || TEXTS.fa;
  return dict[key] !== undefined ? dict[key] : TEXTS.fa[key] !== undefined ? TEXTS.fa[key] : key;
};
const pick = (item) => item[state.lang] || item.fa;
const svg = (d, cls = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}><path d="${d}"/></svg>`;
const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ─────────────────────────────── chrome helpers ─────────────────────────────── */

function showPane(name) {
  $('#app').dataset.view = name;
  document.querySelectorAll('[data-pane]').forEach((node) => {
    node.hidden = node.dataset.pane !== name;
  });
}

let toastTimer = null;
function toast(message, kind = '') {
  const stack = $('#toasts');
  const node = document.createElement('div');
  node.className = 'toast' + (kind ? ' is-' + kind : '');
  node.textContent = message;
  stack.appendChild(node);
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity .2s ease';
    setTimeout(() => node.remove(), 220);
  }, 2400);
}

function applyLanguage(lang) {
  state.lang = TEXTS[lang] ? lang : 'fa';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = TEXTS[state.lang].dir;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const text = t(node.dataset.i18n);
    if (typeof text === 'string') node.textContent = text;
  });
  $('#search-label').textContent = t('search');
  $('#palette-input').placeholder = t('searchPlaceholder');
  $('#btn-lang').textContent = { fa: 'فا', en: 'EN', de: 'DE' }[state.lang];
  $('#btn-lang').title = t('langMenu');
  $('#btn-back').title = t('back');
  $('#btn-forward').title = t('forward');
  $('#btn-reload').title = t('reload') + ' (F5)';
  $('#btn-sidebar').title = t('sidebar') + ' (Ctrl+B)';
  $('#btn-theme').title = t('themeToggle');
  $('#side-winsettings').title = t('windowsSettings') + ' (Ctrl+,)';
  renderNav();
  renderStatus();
}

function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

function applyAccent(a1, a2) {
  const root = document.documentElement.style;
  if (a1) root.setProperty('--accent', a1);
  if (a2) root.setProperty('--accent-2', a2);
}

function nativeDark(settings) {
  const theme = settings && settings.theme;
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyNativeSettings(settings) {
  if (!settings) return;
  state.settings = settings;
  state.widgetOn = !!settings.widgetEnabled;
  document.documentElement.dataset.reduceMotion = settings.reduceMotion ? '1' : '0';
  // Until the site reports its own look, paint with the stored one.
  if (!state.site) {
    applyTheme(nativeDark(settings));
    const siteAccent = { indigo: 'blue', violet: 'violet', teal: 'emerald', amber: 'amber', rose: 'rose' }[settings.accent] || 'violet';
    applyAccent(SITE_ACCENTS[siteAccent][0], SITE_ACCENTS[siteAccent][1]);
    applyLanguage(settings.lang || 'fa');
  }
  renderWidgetState();
}

function renderWidgetState() {
  $('#btn-widget').classList.toggle('is-on', state.widgetOn);
  $('#side-widget-toggle').checked = state.widgetOn;
}

/* ─────────────────────────────── navigation UI ─────────────────────────────── */

function navLabel(item) {
  const labels = state.site && state.site.labels;
  return (labels && labels[item.id]) || pick(item);
}

function visibleNav() {
  const site = state.site;
  return NAV.filter((item) => !item.admin || (site && site.admin));
}

function renderNav() {
  const site = state.site || {};
  const active = activeNavId();
  $('#nav').innerHTML = visibleNav()
    .map((item, index) => {
      const count = item.count === 'fav' ? site.fav : item.count === 'hist' ? site.hist : 0;
      const tail = item.premium && !site.premium
        ? '<span class="nav-pro">PRO</span>'
        : count ? `<span class="nav-badge">${esc(count)}</span>` : '';
      const label = navLabel(item);
      return `<button class="nav-item${active === item.id ? ' is-active' : ''}" type="button" data-nav="${item.id}" title="${esc(label)}${index < 9 ? ' (Ctrl+' + (index + 1) + ')' : ''}">${svg(item.icon)}<span class="nav-label">${esc(label)}</span>${tail}</button>`;
    })
    .join('');
}

function activeNavId() {
  const screen = state.site && state.site.screen;
  if (!screen) return state.lastSection || 'dashboard';
  if (screen === 'settings') return 'settings';
  return NAV.some((item) => item.id === screen) ? screen : 'dashboard';
}

function screenTitle() {
  const screen = state.site && state.site.screen;
  if (!screen) return '';
  if (screen === 'settings') return navLabel(ACCOUNT_SCREEN);
  const item = NAV.find((entry) => entry.id === screen);
  if (item) return navLabel(item);
  if (screen === 'freeStudy') return { fa: 'مطالعه آزاد', en: 'Free study', de: 'Freies Lernen' }[state.lang];
  if (screen === 'premiumPlans') return 'Premium';
  return navLabel(NAV[0]);
}

function renderAccount() {
  const site = state.site || {};
  const email = site.email || (state.settings && state.settings.email) || '';
  const name = site.name || (email ? email.split('@')[0] : '—');
  $('#account-name').textContent = name;
  $('#account-email').textContent = email;
  const role = site.role || 'normal';
  const chip = $('#account-role');
  chip.textContent = role === 'normal' ? t('free') : t(role) || role;
  chip.classList.toggle('is-premium', !!site.premium);
  chip.hidden = !state.site;
  const avatar = $('#avatar');
  if (site.avatar && /^data:image\/|^https:\/\//.test(site.avatar)) {
    if (avatar.dataset.src !== site.avatar) {
      avatar.dataset.src = site.avatar;
      avatar.innerHTML = '';
      const img = document.createElement('img');
      img.alt = '';
      img.src = site.avatar;
      avatar.appendChild(img);
    }
  } else {
    avatar.dataset.src = '';
    avatar.innerHTML = `<span id="avatar-letter">${esc((name || 'A').trim().charAt(0).toUpperCase() || 'A')}</span>`;
  }
  $('#btn-account').title = navLabel(ACCOUNT_SCREEN);
}

function renderStatus() {
  const dot = $('#status-dot');
  let text;
  dot.className = 'status-dot';
  if (!state.online || state.failed) {
    dot.classList.add('is-bad');
    text = t('statusOffline');
  } else if (state.loading) {
    dot.classList.add('is-busy');
    text = t('statusLoading');
  } else {
    dot.classList.add('is-ok');
    text = t('statusOnline');
  }
  $('#status-text').textContent = text;
  const site = state.site;
  $('#status-plan').textContent = site ? [site.plan, site.premium ? 'Premium' : t('free')].filter(Boolean).join(' · ') : '';
  $('#status-zoom').textContent = Math.round(state.zoom * 100) + '%';
  $('#status-version').textContent = 'Amookht ' + (state.version || '');
  $('#tb-title').textContent = screenTitle();
  document.title = screenTitle() ? 'Amookht — ' + screenTitle() : 'Amookht';
}

function setCompact(compact, persist = true) {
  state.compact = !!compact;
  applyCompact();
  if (persist) bridge.layout({ sidebarCompact: state.compact }).catch(() => {});
}

// The site switches to its stacked phone layout below 901 CSS px. Give it the
// room for its desktop layout by folding the sidebar to icons when needed.
const SITE_DESKTOP_MIN = 905;
function applyCompact() {
  const shell = $('#shell');
  const full = shell.clientWidth || window.innerWidth;
  const sideFull = 236;
  // The site's CSS width is the stage width divided by its zoom factor.
  const auto = !state.compact && full - sideFull < SITE_DESKTOP_MIN * state.zoom;
  shell.classList.toggle('is-compact', state.compact || auto);
  shell.classList.toggle('is-auto-compact', auto);
}
window.addEventListener('resize', () => applyCompact());

/* ─────────────────────────────── the site ─────────────────────────────── */

// Hide the site's own navigation (the shell replaces it) and let pages use the
// full width that the site normally reserves for its floating sidebar.
// Desktop-app feel inside the site: no elastic overscroll, no dragging links or
// pictures, arrow cursor on UI, thin Windows 11 scrollbars that show on hover,
// and normal bottom spacing instead of the mobile dock's padding.
const SITE_CSS = `
.mac-sidebar, .mobile-dock, .mobile-nav-sheet, .mobile-nav-backdrop { display: none !important; }
/* The site reserves 262px (92px compact) on the right for its floating sidebar,
   via "#app:has(.mac-sidebar.is-compact) .app-with-sidebar" (specificity 1,3,0).
   These selectors are stronger, so pages use the full width next to our sidebar. */
html body #app .app-with-sidebar.app-with-sidebar.app-with-sidebar,
html body #app:has(.mac-sidebar) .app-with-sidebar.app-with-sidebar.app-with-sidebar {
  padding-right: 0 !important; padding-left: 0 !important; margin-right: 0 !important;
}
html body #app .app-with-sidebar.app-with-sidebar.pb-24, html body #app .app-with-sidebar.app-with-sidebar.pb-28 { padding-bottom: 28px !important; }
body > .lo-language-switcher, #app > .lo-language-switcher { display: none !important; }
html, body { overscroll-behavior: none; }
body { cursor: default; }
input, textarea, select, [contenteditable="true"], [contenteditable=""] { cursor: auto; }
a, button, [onclick], [role="button"], label, summary, select { cursor: pointer; }
img, a, svg, video { -webkit-user-drag: none; }
::-webkit-scrollbar { width: 10px; height: 10px; background: transparent; }
::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 10px; border: 3px solid transparent; background-clip: padding-box; min-height: 40px; }
:hover::-webkit-scrollbar-thumb, html:hover::-webkit-scrollbar-thumb { background-color: rgba(140, 150, 180, 0.42); }
::-webkit-scrollbar-thumb:hover { background-color: rgba(160, 170, 200, 0.7) !important; border-width: 2px; }
::-webkit-scrollbar-button { display: none; height: 0; width: 0; }
`;

/* Runs inside the site page (main world). Reports a snapshot of the parts of
   the site's state the shell mirrors, and exposes nav/apply for the shell.
   Injected with webview.executeJavaScript, so it is serialised from here. */
function siteHelper() {
  if (window.__amkShell) {
    window.__amkShell.push(true);
    return;
  }
  const post = (kind, payload) => window.postMessage({ __amkShell: 1, kind, payload }, '*');
  let last = '';
  let timer = null;
  const lang = () => (typeof S !== 'undefined' && S.uiLanguage) || 'fa';
  const label = (fa, en, de) => (lang() === 'en' ? en : lang() === 'de' ? de : fa);
  const tr = (key, fallback) => {
    try {
      const value = typeof t === 'function' ? t(key) : '';
      return value && value !== key ? value : fallback;
    } catch (error) {
      return fallback;
    }
  };
  const call = (name) => {
    try {
      return typeof window[name] === 'function' ? window[name]() : undefined;
    } catch (error) {
      return undefined;
    }
  };
  const snap = () => {
    if (typeof S === 'undefined') return null;
    const css = getComputedStyle(document.documentElement);
    const prefs = S.appSettings || {};
    let plan = '';
    try {
      plan = typeof examPlanLabel === 'function' && S.user && S.user.examPlan ? String(examPlanLabel() || '') : '';
    } catch (error) {
      plan = '';
    }
    return {
      screen: S.screen || '',
      signedIn: !!S.currentUser,
      dark: !!S.dark,
      lang: lang(),
      accent: prefs.accent || 'violet',
      a1: css.getPropertyValue('--app-accent').trim(),
      a2: css.getPropertyValue('--app-accent-2').trim(),
      compact: !!prefs.sidebarCompact,
      density: prefs.density || 'comfortable',
      glass: prefs.glass !== false,
      contrast: !!prefs.highContrast,
      name: (S.user && S.user.name) || '',
      email: S.currentUser || '',
      avatar: (S.user && S.user.avatarDataUrl) || '',
      role: call('normalizedAccessRole') || 'normal',
      premium: !!call('hasPremiumAccess'),
      admin: !!call('isGlobalContentAdmin'),
      fav: Array.isArray(S.favorites) ? S.favorites.length : 0,
      hist: Array.isArray(S.history) ? S.history.length : 0,
      plan: plan.slice(0, 60),
      labels: {
        dashboard: tr('nav.execute', label('اجرای برنامه', 'Run program', 'Plan starten')),
        errorbook: label('دفتر عبارات', 'Vocabulary notebook', 'Vokabelheft'),
        favorites: tr('nav.favorites', label('علاقه‌مندی‌ها', 'Favourites', 'Favoriten')),
        library: label('کتابخانه', 'Library', 'Bibliothek'),
        deutschCoach: label('مربی گفتگو', 'Deutsch Coach', 'Deutsch Coach'),
        testdafSim: tr('nav.exam', label('شبیه‌سازی آزمون', 'Exam simulator', 'Prüfungssimulation')),
        history: tr('nav.history', label('تاریخچه', 'History', 'Verlauf')),
        appSettings: tr('nav.appSettings', label('تنظیمات برنامه', 'App settings', 'App-Einstellungen')),
        adminUsers: label('مدیریت', 'Management', 'Verwaltung'),
        settings: label('تنظیمات حساب', 'Account settings', 'Kontoeinstellungen'),
      },
    };
  };
  const push = (force) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const snapshot = snap();
      if (!snapshot) return;
      const json = JSON.stringify(snapshot);
      if (!force && json === last) return;
      last = json;
      post('state', snapshot);
    }, force ? 0 : 60);
  };
  const wrap = (name, before, after) => {
    const original = window[name];
    if (typeof original !== 'function' || original.__amkShell) return;
    const wrapped = function () {
      if (before) before();
      const result = original.apply(this, arguments);
      if (after) after();
      return result;
    };
    wrapped.__amkShell = true;
    window[name] = wrapped;
  };
  wrap('render', null, () => push(false));
  wrap('logout', () => post('logout', null), null);
  const nav = (screen) => {
    if (typeof navigateApp !== 'function') return false;
    if (screen === 'errorbook') S.notebookTab = 'deck';
    window.__amkMenuNav = 1;
    navigateApp(screen);
    push(false);
    return true;
  };
  const apply = (prefs) => {
    if (!prefs || typeof S === 'undefined') return;
    if (typeof prefs.dark === 'boolean' && prefs.dark !== !!S.dark && typeof toggleDark === 'function') toggleDark(prefs.dark);
    if (prefs.accent && typeof setAppSetting === 'function') setAppSetting('accent', prefs.accent);
    if (prefs.lang && prefs.lang !== S.uiLanguage && typeof setUILanguage === 'function') setUILanguage(prefs.lang);
    if (prefs.setting && typeof setAppSetting === 'function') setAppSetting(prefs.setting[0], prefs.setting[1]);
    if (prefs.reset && typeof resetAppSettings === 'function') resetAppSettings();
    push(false);
  };
  window.__amkShell = { nav, apply, push, snap };
  window.addEventListener('popstate', () => push(false));
  setInterval(() => push(false), 2000);
  push(true);
}

function siteCall(code) {
  const view = state.view;
  if (!view || !state.firstReady) return Promise.resolve(null);
  return view.executeJavaScript(code, false).catch(() => null);
}

function siteNav(screen) {
  bridge.setLastSection(screen).catch(() => {});
  state.lastSection = screen;
  if (!state.view || !state.firstReady) return;
  siteCall(`window.__amkShell && window.__amkShell.nav(${JSON.stringify(screen)})`);
}

function siteApply(prefs) {
  return siteCall(`window.__amkShell && window.__amkShell.apply(${JSON.stringify(prefs)})`);
}

async function loadSite({ hard = false } = {}) {
  hideError();
  const prepared = await bridge.prepareSite().catch(() => null);
  if (!prepared || !prepared.hasSession) {
    resetToAuth(t('sessionExpired'));
    return;
  }
  state.siteUrl = prepared.siteUrl || state.siteUrl;
  if (!state.view) {
    createView();
    return;
  }
  if (hard) state.view.reloadIgnoringCache();
  else state.view.reload();
}

function createView() {
  const view = document.createElement('webview');
  view.setAttribute('allowpopups', '');
  view.setAttribute('webpreferences', 'contextIsolation=yes, sandbox=yes, spellcheck=yes');
  view.src = state.siteUrl;
  state.view = view;
  state.firstReady = false;
  $('#stage').appendChild(view);

  view.addEventListener('did-start-loading', () => {
    state.loading = true;
    $('#stage-progress').hidden = false;
    renderStatus();
  });
  view.addEventListener('did-stop-loading', () => {
    state.loading = false;
    $('#stage-progress').hidden = true;
    renderStatus();
    updateHistoryButtons();
  });
  view.addEventListener('did-fail-load', (event) => {
    // -3 = aborted (a newer navigation replaced this one); not an error.
    if (!event.isMainFrame || event.errorCode === -3) return;
    showError();
  });
  view.addEventListener('dom-ready', () => {
    state.failed = false;
    view.insertCSS(SITE_CSS).catch(() => {});
    view.setZoomFactor(state.zoom);
    view.executeJavaScript(`(${siteHelper.toString()})()`, false).catch(() => {});
    state.firstReady = true;
    updateHistoryButtons();
    renderStatus();
  });
  view.addEventListener('did-navigate', updateHistoryButtons);
  view.addEventListener('did-navigate-in-page', updateHistoryButtons);
  view.addEventListener('ipc-message', (event) => {
    if (event.channel === 'site:state') onSiteState(event.args[0]);
    else if (event.channel === 'site:logout') onSiteLogout();
  });
  view.addEventListener('render-process-gone', () => showError());
}

function updateHistoryButtons() {
  const view = state.view;
  if (!view || !state.firstReady) return;
  try {
    $('#btn-back').disabled = !view.canGoBack();
    $('#btn-forward').disabled = !view.canGoForward();
  } catch {
    /* webview not attached yet */
  }
}

function showError() {
  state.failed = true;
  $('#stage-error').hidden = false;
  $('#stage-cover').hidden = true;
  renderStatus();
}

function hideError() {
  state.failed = false;
  $('#stage-error').hidden = true;
  renderStatus();
}

function onSiteState(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  const previous = state.site;
  state.site = snapshot;

  // Signed out on the site side (expired token): try a fresh token once,
  // otherwise come back to the native sign-in screen.
  if (!snapshot.signedIn && ['landing', 'auth'].includes(snapshot.screen)) {
    if (state.signInRetry < 1) {
      state.signInRetry += 1;
      loadSite();
    } else {
      resetToAuth(t('sessionExpired'));
    }
    return;
  }
  if (snapshot.signedIn) state.signInRetry = 0;

  $('#stage-cover').hidden = true;
  applyTheme(snapshot.dark);
  applyAccent(snapshot.a1 || (SITE_ACCENTS[snapshot.accent] || SITE_ACCENTS.violet)[0], snapshot.a2 || (SITE_ACCENTS[snapshot.accent] || SITE_ACCENTS.violet)[1]);
  if (!previous || previous.lang !== snapshot.lang) applyLanguage(snapshot.lang);
  if (!previous || previous.compact !== snapshot.compact) setCompact(snapshot.compact);
  if (!previous || previous.dark !== snapshot.dark || previous.accent !== snapshot.accent || previous.lang !== snapshot.lang) {
    bridge.sitePrefs({ dark: snapshot.dark, accent: snapshot.accent, lang: snapshot.lang }).catch(() => {});
  }
  // Resume the page the learner had open last time, once the site has settled
  // (its own sign-in finishes a moment after the first snapshot).
  if (!state.resumed && snapshot.signedIn) {
    state.resumed = true;
    const target = state.resumeTarget;
    if (target && target !== 'dashboard') {
      state.resuming = true;
      setTimeout(() => {
        state.resuming = false;
        if (state.site && state.site.signedIn && state.site.screen === 'dashboard') siteNav(target);
      }, 1500);
    }
  }

  if (!state.resuming && snapshot.screen && NAV.concat(ACCOUNT_SCREEN).some((item) => item.id === snapshot.screen) && snapshot.screen !== state.lastSection) {
    state.lastSection = snapshot.screen;
    bridge.setLastSection(snapshot.screen).catch(() => {});
  }

  renderNav();
  renderAccount();
  renderStatus();
  updateHistoryButtons();
}

async function onSiteLogout() {
  await bridge.logout().catch(() => {});
  resetToAuth(t('signedOut'));
}

/* ─────────────────────────────── command palette ─────────────────────────────── */

const palette = { items: [], index: 0 };

function paletteEntries() {
  const site = state.site || {};
  const entries = [];
  visibleNav().concat(ACCOUNT_SCREEN).forEach((item, index) => {
    entries.push({
      group: t('groupPages'),
      label: navLabel(item),
      icon: item.icon,
      hint: item.id !== 'settings' && index < 9 ? 'Ctrl+' + (index + 1) : '',
      run: () => siteNav(item.id),
    });
  });
  entries.push({ group: t('groupLook'), label: site.dark ? t('lightMode') : t('darkMode'), icon: 'M12 3a9 9 0 1 0 9 9c0-.5 0-.9-.1-1.4A5.5 5.5 0 0 1 13.4 3.1 9 9 0 0 0 12 3z', run: () => siteApply({ dark: !site.dark }) });
  Object.entries(SITE_ACCENTS).forEach(([id, [color, , names]]) => {
    entries.push({ group: t('groupLook'), label: t('accentColor') + ': ' + pick(names), swatch: color, on: site.accent === id, run: () => siteApply({ accent: id }) });
  });
  Object.entries(LANGS).forEach(([id, name]) => {
    entries.push({ group: t('groupLook'), label: t('language') + ': ' + name, icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15 15 0 0 0-1.4-3.9A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15 15 0 0 0 1.4 3.9A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.9C8.9 5.3 8.4 6.6 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4zm.2 5.9c.6-1.2 1.1-2.5 1.4-3.9h3a8 8 0 0 1-4.4 3.9zm1.8-5.9a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4z', on: site.lang === id, run: () => siteApply({ lang: id }) });
  });
  [['compact', 'densityCompact'], ['comfortable', 'densityComfortable'], ['spacious', 'densitySpacious']].forEach(([id, key]) => {
    entries.push({ group: t('groupLook'), label: t('density') + ': ' + t(key), icon: 'M4 5h16v2H4zm0 6h16v2H4zm0 6h16v2H4z', on: site.density === id, run: () => siteApply({ setting: ['density', id] }) });
  });
  entries.push({ group: t('groupLook'), label: t('glass'), icon: 'M4 4h16v16H4z', on: site.glass, run: () => siteApply({ setting: ['glass', !site.glass] }) });
  entries.push({ group: t('groupLook'), label: t('contrast'), icon: 'M12 2a10 10 0 1 0 0 20zm0 2v16a8 8 0 0 0 0-16z', on: site.contrast, run: () => siteApply({ setting: ['highContrast', !site.contrast] }) });
  entries.push({ group: t('groupLook'), label: t('resetLook'), icon: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z', run: () => siteApply({ reset: true }) });
  entries.push({ group: t('groupApp'), label: t('sidebar'), hint: 'Ctrl+B', icon: 'M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z', run: () => runCommand({ action: 'toggle-sidebar' }) });
  entries.push({ group: t('groupApp'), label: t('desktopWidget'), on: state.widgetOn, icon: 'M3 3h8v8H3zm10 0h8v5h-8zM3 13h8v8H3zm10-3h8v11h-8z', run: () => runCommand({ action: 'toggle-widget' }) });
  entries.push({ group: t('groupApp'), label: t('windowsSettings'), hint: 'Ctrl+,', icon: 'M3 4h18v12H3zm2 2v8h14V6zM8 18h8v2H8z', run: () => bridge.openSettings() });
  entries.push({ group: t('groupApp'), label: t('reload'), hint: 'F5', icon: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z', run: () => runCommand({ action: 'reload' }) });
  entries.push({ group: t('groupApp'), label: t('reloadHard'), hint: 'Ctrl+Shift+R', icon: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z', run: () => runCommand({ action: 'reload', hard: true }) });
  entries.push({ group: t('groupApp'), label: t('zoomIn'), hint: 'Ctrl +', icon: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm-1 3v3H6v2h3v3h2v-3h3V9h-3V6z', run: () => runCommand({ action: 'zoom', step: 1 }) });
  entries.push({ group: t('groupApp'), label: t('zoomOut'), hint: 'Ctrl −', icon: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zM6 9v2h8V9z', run: () => runCommand({ action: 'zoom', step: -1 }) });
  entries.push({ group: t('groupApp'), label: t('zoomReset'), hint: 'Ctrl 0', icon: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3z', run: () => runCommand({ action: 'zoom', step: 0 }) });
  entries.push({ group: t('groupApp'), label: t('openBrowser'), icon: 'M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z', run: () => bridge.openExternal(state.siteUrl) });
  // v4 native rewrite, opt-in while it is being built (switch back from its own menu).
  entries.push({ group: t('groupApp'), label: { fa: 'پیش‌نمایش نسخهٔ بومی (۴)', en: 'Native preview (4)', de: 'Native Vorschau (4)' }[state.lang], icon: 'M12 2l2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7z', run: () => bridge.setEngine('native') });
  entries.push({ group: t('groupApp'), label: t('signOut'), icon: 'M10 3h10v18H10v-2h8V5h-8zm-.6 5.4L11 10H3v4h8l-1.6 1.6L10.8 17 16 12l-5.2-5z', run: () => signOut() });
  return entries;
}

const normalize = (text) => String(text || '').toLowerCase().replace(/[‌\s]+/g, ' ').trim();

function openPalette() {
  closePopover();
  $('#palette').hidden = false;
  const input = $('#palette-input');
  input.value = '';
  renderPalette();
  setTimeout(() => input.focus(), 0);
}

function closePalette() {
  $('#palette').hidden = true;
}

function renderPalette() {
  const query = normalize($('#palette-input').value);
  palette.items = paletteEntries().filter((entry) => !query || normalize(entry.label + ' ' + entry.group).includes(query));
  palette.index = Math.min(palette.index, Math.max(0, palette.items.length - 1));
  if (!query) palette.index = 0;
  if (!palette.items.length) {
    $('#palette-list').innerHTML = `<div class="palette-empty">${esc(t('noResults'))}</div>`;
    return;
  }
  let group = '';
  $('#palette-list').innerHTML = palette.items
    .map((entry, index) => {
      const head = entry.group !== group ? `<div class="palette-group">${esc((group = entry.group))}</div>` : '';
      const icon = entry.swatch ? `<span class="pi-swatch" style="background:${entry.swatch}"></span>` : svg(entry.icon || '');
      const hint = entry.on ? '✓' : entry.hint || '';
      return `${head}<button class="palette-item${index === palette.index ? ' is-sel' : ''}" type="button" role="option" data-pal="${index}">${icon}<span>${esc(entry.label)}</span><span class="pi-hint">${esc(hint)}</span></button>`;
    })
    .join('');
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
  let left = state.lang === 'fa' ? rect.right - width : rect.left;
  let top = rect.bottom + 6;
  if (top + height > window.innerHeight - 8) top = rect.top - height - 6;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  pop.style.left = left + 'px';
  pop.style.top = Math.max(8, top) + 'px';
}

function closePopover() {
  $('#popover').hidden = true;
}

function openLangMenu(anchor) {
  const current = (state.site && state.site.lang) || state.lang;
  openPopover(anchor, Object.entries(LANGS)
    .map(([id, name]) => `<button type="button" data-pop="lang:${id}" class="${current === id ? 'is-on' : ''}">${esc(name)}</button>`)
    .join(''));
}

function openAccountMenu(anchor) {
  const site = state.site || {};
  openPopover(anchor, `
    <div class="popover-head"><b>${esc(site.name || '—')}</b><small dir="ltr">${esc(site.email || '')}</small></div>
    <button type="button" data-pop="nav:settings">${svg(ACCOUNT_SCREEN.icon)}${esc(navLabel(ACCOUNT_SCREEN))}</button>
    <button type="button" data-pop="nav:appSettings">${svg(NAV[7].icon)}${esc(navLabel(NAV[7]))}</button>
    <button type="button" data-pop="winsettings">${svg('M3 4h18v12H3zm2 2v8h14V6zM8 18h8v2H8z')}${esc(t('windowsSettings'))}</button>
    <button type="button" data-pop="browser">${svg('M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z')}${esc(t('openBrowser'))}</button>
    <hr />
    <button type="button" data-pop="signout" class="is-danger">${svg('M10 3h10v18H10v-2h8V5h-8zm-.6 5.4L11 10H3v4h8l-1.6 1.6L10.8 17 16 12l-5.2-5z')}${esc(t('signOut'))}</button>`);
}

/* ─────────────────────────────── commands ─────────────────────────────── */

function setZoom(step) {
  let next;
  if (step === 0) next = 1;
  else {
    const index = ZOOMS.findIndex((value) => value >= state.zoom - 0.001);
    const at = index === -1 ? ZOOMS.length - 1 : index;
    next = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, at + step))];
  }
  state.zoom = next;
  applyCompact();
  if (state.view && state.firstReady) state.view.setZoomFactor(next);
  bridge.layout({ siteZoom: next }).catch(() => {});
  renderStatus();
}

async function toggleWidget() {
  const result = await bridge.setWidgetEnabled(!state.widgetOn).catch(() => null);
  if (result) {
    state.widgetOn = !!result.widgetEnabled;
    renderWidgetState();
    toast(state.widgetOn ? t('widgetOn') : t('widgetOff'));
  }
}

function runCommand(command) {
  if (!command) return;
  const inShell = $('#app').dataset.view === 'main';
  switch (command.action) {
    case 'palette':
      if (!inShell) return;
      if ($('#palette').hidden) openPalette();
      else closePalette();
      break;
    case 'palette-close':
      closePalette();
      break;
    case 'toggle-sidebar': {
      const next = !state.compact;
      setCompact(next);
      // The site's «سایدبار فشرده» setting is the same switch.
      siteApply({ setting: ['sidebarCompact', next] });
      break;
    }
    case 'nav-index': {
      const item = visibleNav()[command.index];
      if (item && inShell) siteNav(item.id);
      break;
    }
    case 'back':
      if (state.view && state.firstReady && state.view.canGoBack()) state.view.goBack();
      break;
    case 'forward':
      if (state.view && state.firstReady && state.view.canGoForward()) state.view.goForward();
      break;
    case 'reload':
      if (inShell) loadSite({ hard: !!command.hard });
      break;
    case 'zoom':
      setZoom(command.step);
      break;
    case 'zoom-reset':
      setZoom(0);
      break;
    case 'toggle-dark':
      siteApply({ dark: !(state.site && state.site.dark) });
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
  closePalette();
  closePopover();
  if (state.view) {
    state.view.remove();
    state.view = null;
  }
  state.site = null;
  state.firstReady = false;
  state.resumed = false;
  state.signInRetry = 0;
  $('#stage-cover').hidden = false;
  showPane('auth');
  if (state.settings) applyNativeSettings(state.settings);
  const error = $('#login-error');
  if (message) {
    error.textContent = message;
    error.hidden = false;
  }
  setTimeout(() => $('#login-email').focus(), 60);
}

async function enterShell() {
  showPane('main');
  applyCompact();
  $('#stage-cover').hidden = false;
  renderNav();
  renderAccount();
  renderStatus();
  await loadSite();
}

async function signOut() {
  // Sign out of the site too (clears its local copy), then of the app.
  await siteCall('typeof logout === "function" && logout()');
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
    await enterShell();
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = t('signIn');
  }
}

/* ─────────────────────────────── events ─────────────────────────────── */

document.addEventListener('click', (event) => {
  const pop = event.target.closest('[data-pop]');
  if (pop) {
    const [kind, value] = pop.dataset.pop.split(':');
    closePopover();
    if (kind === 'lang') siteApply({ lang: value });
    else if (kind === 'nav') siteNav(value);
    else if (kind === 'winsettings') bridge.openSettings();
    else if (kind === 'browser') bridge.openExternal(state.siteUrl);
    else if (kind === 'signout') signOut();
    return;
  }
  if (!event.target.closest('#popover')) closePopover();

  const nav = event.target.closest('[data-nav]');
  if (nav) {
    siteNav(nav.dataset.nav);
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
  if (action === 'lang-menu') openLangMenu(cmd);
  else if (action === 'account-menu') openAccountMenu(cmd);
  else runCommand({ action });
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
  } else if (event.key === 'Escape') {
    closePalette();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePopover();
    if (!$('#palette').hidden) closePalette();
  }
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

$('#open-site-login').addEventListener('click', () => bridge.openExternal(state.siteUrl || 'https://learn.tah3in.com/'));
$('#toggle-password').addEventListener('click', () => {
  const input = $('#login-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

window.addEventListener('online', () => {
  state.online = true;
  renderStatus();
  if (state.failed && $('#app').dataset.view === 'main') loadSite();
});
window.addEventListener('offline', () => {
  state.online = false;
  renderStatus();
});

// While offline, retry the site every 20 s so it comes back by itself.
setInterval(() => {
  if (state.failed && navigator.onLine && $('#app').dataset.view === 'main') loadSite();
}, 20000);

/* ─────────────────────────────── boot ─────────────────────────────── */

async function boot() {
  const info = await bridge.session();
  state.version = info.version || '';
  state.siteUrl = info.siteUrl || '';
  state.lastSection = info.lastSection || 'dashboard';
  state.resumeTarget = state.lastSection;
  state.zoom = Number(info.siteZoom) || 1;
  applyNativeSettings({ ...(info.settings || {}), email: info.email });
  setCompact(!!info.sidebarCompact, false);

  bridge.onSettingsChanged((settings) => {
    const keepEmail = state.settings && state.settings.email;
    applyNativeSettings({ ...settings, email: settings.email || keepEmail });
  });
  bridge.onSessionChanged((next) => {
    if (!next.hasSession && $('#app').dataset.view === 'main') resetToAuth(t('sessionExpired'));
  });
  bridge.onNavigate((section) => {
    if ($('#app').dataset.view === 'main') siteNav(section);
  });
  bridge.onCommand((command) => runCommand(command));
  bridge.onSiteApply((prefs) => siteApply(prefs));
  bridge.onGate(() => toast(t('gateStuck'), 'error'));
  bridge.onSystemTheme(() => {
    if (state.settings && state.settings.theme === 'system' && state.site) {
      siteApply({ dark: window.matchMedia('(prefers-color-scheme: dark)').matches });
    }
  });

  if (info.hasSession) {
    await enterShell();
  } else {
    showPane('auth');
    setTimeout(() => $('#login-email').focus(), 60);
  }
}

boot().catch((error) => {
  showPane('auth');
  const node = $('#login-error');
  node.textContent = (error && error.message) || t('loadFailed');
  node.hidden = false;
});
