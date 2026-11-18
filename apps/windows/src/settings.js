'use strict';

/* Amookht settings window — renderer logic. */

const api = window.amookht;

const TEXTS = {
  fa: {
    appTagline: 'تنظیمات ویندوز',
    tabGeneral: 'عمومی',
    tabWidget: 'ویجت رومیزی',
    tabAccount: 'حساب',
    tabAdvanced: 'پیشرفته',
    tabAbout: 'درباره',
    generalTitle: 'عمومی',
    generalSubtitle: 'نحوهٔ اجرا، زبان و ظاهر برنامهٔ ویندوزی آموخت.',
    startupGroup: 'شروع و پنجره',
    startWithWindows: 'اجرا با روشن شدن ویندوز',
    startWithWindowsHint: 'برنامه در سینی سیستم بالا می‌آید و ویجت (اگر روشن باشد) نمایش داده می‌شود.',
    closeToTray: 'بستن پنجره = ماندن در سینی سیستم',
    closeToTrayHint: 'خروج کامل از منوی سینی انجام می‌شود.',
    appearanceGroup: 'زبان و ظاهر',
    language: 'زبان برنامه',
    languageHint: 'برنامه، ویجت و همین پنجره را تغییر می‌دهد.',
    theme: 'پوسته',
    themeHint: 'مطابق ویندوز، تیره یا روشن.',
    themeSystem: 'مطابق ویندوز',
    themeDark: 'تیره',
    themeLight: 'روشن',
    accent: 'رنگ تأکید',
    accentHint: 'رنگ دکمه‌ها، نمودارها و نور پس‌زمینه.',
    uiScale: 'بزرگ‌نمایی محیط برنامه',
    uiScaleHint: 'برای نمایش راحت‌تر روی صفحه‌های بزرگ.',
    reduceMotion: 'کاهش انیمیشن',
    reduceMotionHint: 'برای سیستم‌های کم‌توان یا تمرکز بیشتر.',
    serverGroup: 'سرور',
    server: 'آدرس سرور آموخت',
    serverHint: 'به‌طور پیش‌فرض learn.tah3in.com است.',
    save: 'ذخیره',
    widgetTitle: 'ویجت رومیزی',
    widgetSubtitle: 'کارهای امروز و یادداشت‌های کتابخانه روی دسکتاپ ویندوز.',
    widgetEnabled: 'ویجت روی دسکتاپ فعال باشد',
    widgetEnabledHint: 'با Ctrl+Alt+W هم می‌توانید پنهان/نمایش کنید.',
    widgetOff: 'خاموش',
    widgetOn: 'روشن',
    showWidget: 'نمایش ویجت',
    hideWidget: 'پنهان کردن ویجت',
    widgetOptions: 'تنظیمات ویجت',
    widgetOnTop: 'همیشه روی بقیهٔ پنجره‌ها',
    widgetOnTopHint: 'ویجت روی همهٔ برنامه‌ها دیده می‌شود.',
    widgetCompact: 'نمایش فشرده',
    widgetCompactHint: 'اندازهٔ کوچک‌تر برای صفحه‌های کم‌ارتفاع.',
    autoRefresh: 'بازخوانی خودکار ویجت',
    autoRefreshHint: 'کارهای امروز از سرور هم‌گام می‌شوند.',
    seconds30: 'هر ۳۰ ثانیه',
    seconds60: 'هر ۱ دقیقه',
    seconds120: 'هر ۲ دقیقه',
    seconds300: 'هر ۵ دقیقه',
    accountTitle: 'حساب',
    accountSubtitle: 'همان حساب آموخت؛ ورود یک‌بار در پنجرهٔ اصلی برنامه.',
    signedIn: 'وارد شده‌اید',
    signedOut: 'وارد نشده‌اید',
    openApp: 'باز کردن برنامه',
    signOut: 'خروج از حساب',
    accountNote: 'رمز عبور شما روی دیسک ذخیره نمی‌شود؛ فقط توکن‌های نشست با کلید رمزنگاری ویندوز محافظت می‌شوند.',
    advancedTitle: 'پیشرفته',
    advancedSubtitle: 'داده‌های برنامه، پنجره‌ها و میان‌برهای صفحه‌کلید.',
    dataGroup: 'داده‌ها',
    dataFolder: 'پوشهٔ داده‌های برنامه',
    open: 'باز کردن',
    resetLayout: 'بازگردانی چیدمان پنجره‌ها',
    resetLayoutHint: 'اندازه و جای پنجرهٔ اصلی و ویجت به حالت اولیه برمی‌گردد.',
    reset: 'بازنشانی',
    openWeb: 'باز کردن نسخهٔ وب',
    openWebHint: 'برای درس‌نامه‌ها و آزمون‌های آزمایشی.',
    shortcutsGroup: 'میان‌برهای صفحه‌کلید',
    scWidget: 'نمایش یا پنهان کردن ویجت',
    scApp: 'نمایش پنجرهٔ اصلی',
    scSections: 'جابه‌جایی بین بخش‌ها',
    scReload: 'بازخوانی داده‌ها',
    scSettings: 'باز کردن تنظیمات',
    aboutTitle: 'دربارهٔ Amookht',
    aboutSubtitle: 'برنامهٔ ویندوزی آموخت — برنامهٔ درسی، واژگان، گرامر، مدرس هوشمند و کتابخانه.',
    linksGroup: 'دسترسی سریع',
    openSite: 'وب‌سایت آموخت',
    openGuide: 'راهنمای ویجت',
    downloads: 'دانلودها',
    aboutNote: 'ویجت: Ctrl+Alt+W — نمایش برنامه: Ctrl+Alt+A — بازخوانی: F5 — تنظیمات: Ctrl+,',
    saved: 'ذخیره شد',
    saveFailed: 'ذخیره نشد.',
    logoutDone: 'از حساب خارج شدید.',
    widgetShown: 'ویجت نمایش داده شد.',
    widgetHidden: 'ویجت پنهان شد.',
    layoutReset: 'چیدمان پنجره‌ها بازنشانی شد.',
    version: 'نسخه',
  },
  en: {
    appTagline: 'Windows settings',
    tabGeneral: 'General',
    tabWidget: 'Desktop widget',
    tabAccount: 'Account',
    tabAdvanced: 'Advanced',
    tabAbout: 'About',
    generalTitle: 'General',
    generalSubtitle: 'How Amookht starts on Windows, its language and its look.',
    startupGroup: 'Startup and window',
    startWithWindows: 'Start with Windows',
    startWithWindowsHint: 'Amookht starts in the system tray and shows the widget if it is enabled.',
    closeToTray: 'Closing the window keeps it in the tray',
    closeToTrayHint: 'Quit completely from the tray menu.',
    appearanceGroup: 'Language and appearance',
    language: 'App language',
    languageHint: 'Applies to the app, the widget and this window.',
    theme: 'Theme',
    themeHint: 'Follow Windows, dark or light.',
    themeSystem: 'Follow Windows',
    themeDark: 'Dark',
    themeLight: 'Light',
    accent: 'Accent colour',
    accentHint: 'Used by buttons, charts and the background glow.',
    uiScale: 'App zoom',
    uiScaleHint: 'For a more comfortable view on large screens.',
    reduceMotion: 'Reduce motion',
    reduceMotionHint: 'For slower machines or calmer focus.',
    serverGroup: 'Server',
    server: 'Amookht server address',
    serverHint: 'Defaults to learn.tah3in.com.',
    save: 'Save',
    widgetTitle: 'Desktop widget',
    widgetSubtitle: "Today's tasks and library notes on the Windows desktop.",
    widgetEnabled: 'Enable the desktop widget',
    widgetEnabledHint: 'Ctrl+Alt+W hides or shows it at any time.',
    widgetOff: 'Off',
    widgetOn: 'On',
    showWidget: 'Show widget',
    hideWidget: 'Hide widget',
    widgetOptions: 'Widget options',
    widgetOnTop: 'Always on top',
    widgetOnTopHint: 'Keeps the widget above all apps.',
    widgetCompact: 'Compact layout',
    widgetCompactHint: 'A smaller size for short screens.',
    autoRefresh: 'Widget auto refresh',
    autoRefreshHint: "Today's tasks stay in sync with the server.",
    seconds30: 'Every 30 seconds',
    seconds60: 'Every minute',
    seconds120: 'Every 2 minutes',
    seconds300: 'Every 5 minutes',
    accountTitle: 'Account',
    accountSubtitle: 'Your Amookht account; sign in once in the main window.',
    signedIn: 'Signed in',
    signedOut: 'Not signed in',
    openApp: 'Open the app',
    signOut: 'Sign out',
    accountNote: 'Your password is never stored on disk; only session tokens, protected by the Windows encryption key.',
    advancedTitle: 'Advanced',
    advancedSubtitle: 'App data, window layout and keyboard shortcuts.',
    dataGroup: 'Data',
    dataFolder: 'App data folder',
    open: 'Open',
    resetLayout: 'Reset window layout',
    resetLayoutHint: 'Puts the main window and widget back to their default size and place.',
    reset: 'Reset',
    openWeb: 'Open the web edition',
    openWebHint: 'For course books and mock exams.',
    shortcutsGroup: 'Keyboard shortcuts',
    scWidget: 'Show or hide the widget',
    scApp: 'Show the main window',
    scSections: 'Move between sections',
    scReload: 'Reload data',
    scSettings: 'Open settings',
    aboutTitle: 'About Amookht',
    aboutSubtitle: 'Amookht for Windows — plans, vocabulary, grammar, AI tutor and library.',
    linksGroup: 'Quick links',
    openSite: 'The Amookht website',
    openGuide: 'Widget guide',
    downloads: 'Downloads',
    aboutNote: 'Widget: Ctrl+Alt+W — Show app: Ctrl+Alt+A — Reload: F5 — Settings: Ctrl+,',
    saved: 'Saved',
    saveFailed: 'Could not save.',
    logoutDone: 'Signed out.',
    widgetShown: 'Widget shown.',
    widgetHidden: 'Widget hidden.',
    layoutReset: 'Window layout reset.',
    version: 'Version',
  },
};

TEXTS.de = TEXTS.en; // German UI of the settings window falls back to English.

const state = { lang: 'fa', settings: null, hasSession: false, email: '', version: '', dataFolder: '', tab: 'general' };

const el = (id) => document.getElementById(id);

const dom = {
  panels: document.querySelectorAll('[data-panel]'),
  navItems: document.querySelectorAll('.nav-item'),
  autostart: el('set-autostart'),
  tray: el('set-tray'),
  lang: el('set-lang'),
  theme: el('set-theme'),
  accent: el('set-accent'),
  scale: el('set-scale'),
  reduceMotion: el('set-reduce-motion'),
  server: el('set-server'),
  saveServer: el('btn-save-server'),
  widgetEnabled: el('set-widget-enabled'),
  widgetTop: el('set-widget-top'),
  widgetCompact: el('set-widget-compact'),
  refresh: el('set-refresh'),
  widgetState: el('widget-state'),
  showWidget: el('btn-show-widget'),
  hideWidget: el('btn-hide-widget'),
  showApp: el('btn-show-app'),
  accountStatus: el('account-status'),
  accountEmail: el('account-email'),
  accountBadge: el('account-badge'),
  accountAvatar: el('account-avatar'),
  logout: el('btn-logout'),
  versionText: el('version-text'),
  aboutVersion: el('about-version'),
  dataFolderPath: el('data-folder-path'),
  openData: el('btn-open-data'),
  resetLayout: el('btn-reset-layout'),
  openWeb: el('btn-open-web'),
  linkSite: el('link-site'),
  linkGuide: el('link-guide'),
  linkDownloads: el('link-downloads'),
  toast: el('toast'),
};

function t(key) {
  const dict = TEXTS[state.lang] || TEXTS.fa;
  return dict[key] || TEXTS.fa[key] || key;
}

let toastTimer = null;
function toast(message, isError = false) {
  dom.toast.textContent = message;
  dom.toast.classList.toggle('is-error', !!isError);
  dom.toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.hidden = true;
  }, isError ? 4200 : 2000);
}

function applyTheme(theme, accent) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.accent = accent || 'indigo';
}

function applyLanguage(lang) {
  state.lang = TEXTS[lang] ? lang : 'fa';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  renderAccount();
  renderWidgetState();
}

function renderWidgetState() {
  const on = !!(state.settings && state.settings.widgetEnabled);
  dom.widgetState.textContent = on ? t('widgetOn') : t('widgetOff');
  dom.widgetState.classList.toggle('is-on', on);
  dom.hideWidget.disabled = !on;
}

function renderAccount() {
  const signedIn = !!state.hasSession;
  dom.accountStatus.textContent = signedIn ? t('signedIn') : t('signedOut');
  dom.accountEmail.textContent = state.email || '';
  dom.accountBadge.textContent = signedIn ? t('signedIn') : t('signedOut');
  dom.accountBadge.classList.toggle('is-on', signedIn);
  dom.accountAvatar.textContent = (state.email || 'A').trim().charAt(0).toUpperCase() || 'A';
  dom.logout.disabled = !signedIn;
}

function renderForm() {
  const s = state.settings || {};
  dom.autostart.checked = !!s.startWithWindows;
  dom.tray.checked = !!s.closeToTray;
  dom.lang.value = s.lang || 'fa';
  dom.theme.value = s.theme || 'system';
  dom.scale.value = String(s.uiScale || 1);
  dom.reduceMotion.checked = !!s.reduceMotion;
  dom.server.value = s.baseUrl || '';
  dom.widgetEnabled.checked = !!s.widgetEnabled;
  dom.widgetTop.checked = !!s.widgetAlwaysOnTop;
  dom.widgetCompact.checked = !!s.widgetCompact;
  const seconds = String(s.autoRefreshSeconds || 60);
  dom.refresh.value = ['30', '60', '120', '300'].includes(seconds) ? seconds : '60';
  dom.accent.querySelectorAll('button').forEach((node) => {
    node.classList.toggle('is-on', (s.accent || 'indigo') === node.dataset.accent);
  });
  dom.versionText.textContent = 'Amookht ' + (state.version || '');
  dom.aboutVersion.textContent = t('version') + ' ' + (state.version || '');
  dom.dataFolderPath.textContent = state.dataFolder || '—';
  renderWidgetState();
}

async function patch(patchValue, successMessage) {
  try {
    const result = await api.saveSettings(patchValue);
    state.settings = result.settings;
    state.hasSession = !!result.hasSession;
    state.email = result.email || state.email;
    if (result.version) state.version = result.version;
    if (result.dataFolder) state.dataFolder = result.dataFolder;
    applyTheme(state.settings.theme, state.settings.accent);
    renderForm();
    renderAccount();
    if (successMessage) toast(successMessage);
  } catch (error) {
    toast((error && error.message) || t('saveFailed'), true);
  }
}

function selectTab(tab) {
  state.tab = tab;
  dom.navItems.forEach((node) => {
    const active = node.dataset.tab === tab;
    node.classList.toggle('is-active', active);
    node.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  dom.panels.forEach((node) => {
    const active = node.dataset.panel === tab;
    node.hidden = !active;
    node.classList.toggle('is-active', active);
  });
}

function wire() {
  dom.navItems.forEach((node) => node.addEventListener('click', () => selectTab(node.dataset.tab)));

  dom.autostart.addEventListener('change', () => patch({ startWithWindows: dom.autostart.checked }));
  dom.tray.addEventListener('change', () => patch({ closeToTray: dom.tray.checked }));
  dom.lang.addEventListener('change', async () => {
    await patch({ lang: dom.lang.value });
    applyLanguage(state.lang);
  });
  dom.theme.addEventListener('change', () => patch({ theme: dom.theme.value }));
  dom.scale.addEventListener('change', () => patch({ uiScale: Number(dom.scale.value) }));
  dom.reduceMotion.addEventListener('change', () => patch({ reduceMotion: dom.reduceMotion.checked }));
  dom.saveServer.addEventListener('click', () => patch({ baseUrl: dom.server.value }, t('saved')));

  dom.accent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-accent]');
    if (button) patch({ accent: button.dataset.accent });
  });

  dom.widgetEnabled.addEventListener('change', () => patch({ widgetEnabled: dom.widgetEnabled.checked }, t('saved')));
  dom.widgetTop.addEventListener('change', () => patch({ widgetAlwaysOnTop: dom.widgetTop.checked }));
  dom.widgetCompact.addEventListener('change', () => patch({ widgetCompact: dom.widgetCompact.checked }));
  dom.refresh.addEventListener('change', () => patch({ autoRefreshSeconds: Number(dom.refresh.value) }));

  dom.showWidget.addEventListener('click', async () => {
    await api.showWidget();
    toast(t('widgetShown'));
  });
  dom.hideWidget.addEventListener('click', async () => {
    await api.hideWidget();
    toast(t('widgetHidden'));
  });

  dom.showApp.addEventListener('click', () => api.showApp());
  dom.logout.addEventListener('click', async () => {
    await api.logout();
    state.hasSession = false;
    state.email = '';
    renderAccount();
    toast(t('logoutDone'));
  });

  dom.openData.addEventListener('click', () => api.openDataFolder());
  dom.resetLayout.addEventListener('click', async () => {
    await api.resetLayout();
    toast(t('layoutReset'));
  });
  dom.openWeb.addEventListener('click', () => api.openTool('/', 'Amookht'));
  dom.linkSite.addEventListener('click', () => api.openTool('/', 'Amookht'));
  dom.linkGuide.addEventListener('click', () => api.openTool('/widgets/guide.html', t('openGuide')));
  dom.linkDownloads.addEventListener('click', () => api.openTool('/downloads/', t('downloads')));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') api.windowAction('close');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.settings && state.settings.theme === 'system') applyTheme('system', state.settings.accent);
  });

  if (api.onSettingsChanged) {
    api.onSettingsChanged((settings) => {
      state.settings = settings;
      state.hasSession = !!settings.hasSession;
      state.email = settings.email || '';
      applyTheme(settings.theme, settings.accent);
      renderForm();
      renderAccount();
    });
  }
  if (api.onSessionChanged) {
    api.onSessionChanged((info) => {
      state.hasSession = !!info.hasSession;
      state.email = info.email || '';
      renderAccount();
    });
  }
}

async function boot() {
  wire();
  try {
    const info = await api.getSettings();
    state.settings = info.settings;
    state.hasSession = !!info.hasSession;
    state.email = info.email || '';
    state.version = info.version;
    state.dataFolder = info.dataFolder || '';
    applyLanguage(state.settings.lang);
    applyTheme(state.settings.theme, state.settings.accent);
    renderForm();
    renderAccount();
  } catch (error) {
    toast((error && error.message) || 'Startup failed', true);
  }
}

boot();
