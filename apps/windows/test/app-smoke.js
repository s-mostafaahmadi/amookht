'use strict';

/* Shell smoke test: `npx electron test/app-smoke.js`
   Loads the real src/app.html with a stub bridge (test/fake-app.js) and checks
   the sign-in screen, the Windows frame (sidebar in the site's order, palette,
   site snapshot handling) and that no [hidden] element is drawn. No network. */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');

let exitCode = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) exitCode = 1;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const errors = [];
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    show: false,
    webPreferences: { preload: path.join(__dirname, 'fake-app.js'), contextIsolation: true, sandbox: true, webviewTag: true },
  });
  win.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2 && !/Electron Security Warning/.test(message)) errors.push(message);
  });
  const started = Date.now();
  await win.loadFile(path.join(__dirname, '..', 'src', 'app.html'));
  await wait(300);
  const js = (code) => win.webContents.executeJavaScript(code);

  const auth = await js(`(() => ({
    view: document.querySelector('#app').dataset.view,
    hiddenDrawn: [...document.querySelectorAll('[hidden]')].filter((n) => getComputedStyle(n).display !== 'none').map((n) => n.id || n.className),
    brand: document.querySelector('.brand-word').textContent,
    dir: document.documentElement.dir,
  }))()`);
  report(auth.view === 'auth', 'signed-out app opens on sign-in', auth.view);
  report(auth.hiddenDrawn.length === 0, 'no [hidden] element is drawn', auth.hiddenDrawn);
  report(auth.brand === 'Amookht', 'brand wordmark is Amookht');
  report(auth.dir === 'rtl', 'persian layout is RTL');
  report(Date.now() - started < 3000, 'local shell paints fast', Date.now() - started + 'ms');

  // Sign in → frame (the stub never attaches a site, so it falls back to sign-in;
  // drive the frame directly instead).
  await js(`showPane('main'); renderNav(); renderAccount(); renderStatus(); true`);
  const frame = await js(`(() => ({
    nav: [...document.querySelectorAll('.nav-item')].map((n) => n.dataset.nav),
    pro: document.querySelectorAll('.nav-pro').length,
    status: document.querySelector('#status-text').textContent,
  }))()`);
  report(JSON.stringify(frame.nav) === JSON.stringify(['dashboard', 'errorbook', 'favorites', 'library', 'deutschCoach', 'testdafSim', 'history', 'appSettings']),
    'sidebar follows the site order (no admin item for normal users)', frame.nav);
  report(frame.pro === 3, 'premium pages carry a PRO badge before the site reports access', frame.pro);

  // A site snapshot: admin + premium, English, accent and counts flow into the frame.
  await js(`onSiteState({ screen: 'favorites', signedIn: true, dark: false, lang: 'en', accent: 'emerald', a1: '#059669', a2: '#34d399',
    compact: false, name: 'Mostafa', email: 'smoke@test.local', role: 'owner', premium: true, admin: true, fav: 8, hist: 4, plan: 'Learning plan',
    labels: { dashboard: 'Run program', favorites: 'Favourites', history: 'History' } }); true`);
  const synced = await js(`(() => ({
    nav: document.querySelectorAll('.nav-item').length,
    active: document.querySelector('.nav-item.is-active') && document.querySelector('.nav-item.is-active').dataset.nav,
    fav: document.querySelector('[data-nav="favorites"] .nav-badge') && document.querySelector('[data-nav="favorites"] .nav-badge').textContent,
    pro: document.querySelectorAll('.nav-pro').length,
    theme: document.documentElement.dataset.theme,
    dir: document.documentElement.dir,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    title: document.querySelector('#tb-title').textContent,
    role: document.querySelector('#account-role').textContent,
  }))()`);
  report(synced.nav === 9, 'admin item appears for admins', synced.nav);
  report(synced.active === 'favorites', 'active page follows the site', synced.active);
  report(synced.fav === '8', 'favourite count badge', synced.fav);
  report(synced.pro === 0, 'no PRO badges with premium access', synced.pro);
  report(synced.theme === 'light' && synced.dir === 'ltr', 'theme and language follow the site', [synced.theme, synced.dir]);
  report(synced.accent === '#059669', 'accent follows the site', synced.accent);
  report(synced.title === 'Favourites', 'title bar shows the page', synced.title);
  report(synced.role === 'Owner', 'account role chip', synced.role);

  await js(`openPalette(); document.querySelector('#palette-input').value = 'Emerald'; document.querySelector('#palette-input').dispatchEvent(new Event('input')); true`);
  const pal = await js(`(() => ({ open: !document.querySelector('#palette').hidden, items: [...document.querySelectorAll('.palette-item')].map((n) => n.textContent.trim()) }))()`);
  report(pal.open && pal.items.some((text) => text.includes('Emerald')), 'command palette finds accent colours', pal.items);
  await js(`closePalette(); document.querySelector('#palette-input').value = ''; openPalette(); true`);
  const all = await js(`document.querySelectorAll('.palette-item').length`);
  report(all >= 30, 'palette lists pages, appearance and app commands', all);
  await js(`closePalette(); true`);

  await js(`runCommand({ action: 'toggle-sidebar' }); true`);
  report(await js(`document.querySelector('#shell').classList.contains('is-compact')`), 'Ctrl+B folds the sidebar');

  await js(`window.resizeTo && true; document.querySelector('#shell').style.width='1000px'; runCommand({ action: 'toggle-sidebar' }); applyCompact(); true`);
  report(await js(`document.querySelector('#shell').classList.contains('is-auto-compact')`), 'narrow window folds the sidebar so the site keeps its desktop layout');

  const hiddenAfter = await js(`[...document.querySelectorAll('[hidden]')].filter((n) => getComputedStyle(n).display !== 'none').length`);
  report(hiddenAfter === 0, 'still no [hidden] element drawn in the frame', hiddenAfter);
  report(errors.length === 0, 'no renderer console errors', errors);
  app.exit(exitCode);
});
