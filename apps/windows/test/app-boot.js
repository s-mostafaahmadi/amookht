'use strict';

/* Boot test against the real main process: `npx electron test/app-boot.js`
   Starts the app hidden, opens the native settings window through the app menu,
   then toggles the desktop widget from the settings UI and inspects the windows.

   Use an isolated profile so a developer's running Amookht is never disturbed:
   npx electron test/app-boot.js --user-data-dir="<temp>/amk-boot-test"
*/

const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');

process.argv.push('--hidden');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const consoleErrors = [];
let exitCode = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) exitCode = 1;
};

const liveWindows = () => BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed());
const findWindow = (predicate) => liveWindows().find(predicate);

function appMenuItem(label) {
  const menu = Menu.getApplicationMenu();
  if (!menu) return null;
  for (const top of menu.items) {
    if (!top.submenu) continue;
    const match = top.submenu.items.find((item) => item.label === label);
    if (match) return match;
  }
  return null;
}

app.whenReady().then(async () => {
  await wait(4000);

  const appWin = findWindow((win) => win.webContents.getURL().endsWith('app.html'));
  report(!!appWin, 'app window loads the native UI', appWin ? appWin.webContents.getURL().split('/').pop() : null);
  report(!!appWin && appWin.isVisible() === false, 'app starts hidden with --hidden');
  report(!!appMenuItem('ویجت رومیزی'), 'app menu exposes the widget toggle');
  report(!!appMenuItem('تنظیمات…'), 'app menu exposes settings');

  if (!appWin) {
    app.exit(1);
    return;
  }

  const startView = await appWin.webContents.executeJavaScript(`(() => ({
    view: document.querySelector('#app').dataset.view,
    authVisible: !document.querySelector('[data-pane="auth"]').hidden,
    brand: document.querySelector('.brand-word')?.textContent,
  }))()`);
  console.log('APP ' + JSON.stringify(startView));
  report(startView.view === 'auth' && startView.authVisible, 'signed-out app opens on sign-in', startView.view);
  report(startView.brand === 'Amookht', 'title bar wordmark is Amookht', startView.brand);

  const settingsItem = appMenuItem('تنظیمات…');
  settingsItem.click();
  await wait(3500);

  const settingsWin = findWindow((win) => win.webContents.getURL().endsWith('settings.html'));
  report(!!settingsWin, 'settings window created from the menu');
  report(!!settingsWin && settingsWin.isVisible(), 'settings window is visible');

  if (!settingsWin) {
    app.exit(1);
    return;
  }

  settingsWin.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) consoleErrors.push(message);
  });

  await wait(900);
  const view = await settingsWin.webContents.executeJavaScript(`(() => ({
    title: document.title,
    tabs: [...document.querySelectorAll('.nav-item')].length,
    activeTab: document.querySelector('.nav-item.is-active')?.dataset.tab,
    widgetOn: document.querySelector('#set-widget-enabled')?.checked,
    dir: document.documentElement.dir,
  }))()`);
  console.log('SETTINGS ' + JSON.stringify(view));
  report(view.tabs === 5, 'settings renders five sections', view.tabs);
  report(view.activeTab === 'general', 'settings opens on the general section', view.activeTab);
  report(view.dir === 'rtl', 'settings uses RTL layout', view.dir);
  report(view.widgetOn === false, 'widget starts switched off', view.widgetOn);

  // Turn the widget on through the real settings UI.
  settingsWin.webContents.executeJavaScript("document.querySelector('[data-tab=\"widget\"]').click()");
  await wait(600);
  await settingsWin.webContents.executeJavaScript("document.querySelector('#set-widget-enabled').click()");
  await wait(3000);

  const widgetWin = findWindow((win) => win.webContents.getURL().endsWith('widget.html'));
  report(!!widgetWin, 'enabling the widget created its desktop window', widgetWin ? widgetWin.getBounds() : null);
  report(!!widgetWin && widgetWin.isVisible(), 'widget is visible on the desktop');
  report(!!widgetWin && widgetWin.isAlwaysOnTop(), 'widget stays on top by default');

  if (widgetWin) {
    widgetWin.webContents.on('console-message', (_event, level, message) => {
      if (level >= 2) consoleErrors.push(message);
    });
    await wait(900);
    const widgetView = await widgetWin.webContents.executeJavaScript(`(() => ({
      title: document.querySelector('#w-title')?.textContent,
      signInHint: document.querySelector('#w-empty [data-act="open-app"]') !== null,
      dir: document.documentElement.dir,
    }))()`);
    console.log('WIDGET ' + JSON.stringify(widgetView));
    report(widgetView.title === 'کارها', 'widget renderer booted', widgetView.title);
    report(widgetView.signInHint === true, 'widget asks for the account when no session exists');
    report(widgetWin.isResizable(), 'widget can be resized from its edges');
  }

  // The app settings change must reach the running app window too.
  await wait(600);
  const appAfter = await appWin.webContents.executeJavaScript(`(() => ({
    accent: document.documentElement.dataset.accent,
    theme: document.documentElement.dataset.theme,
  }))()`);
  report(!!appAfter.accent, 'settings broadcast reaches the app window', appAfter);

  await settingsWin.webContents.executeJavaScript("document.querySelector('[data-tab=\"widget\"]').click()");
  await wait(400);
  await settingsWin.webContents.executeJavaScript("document.querySelector('#set-widget-enabled').click()");
  await wait(1400);
  const widgetAfter = findWindow((win) => win.webContents.getURL().endsWith('widget.html'));
  report(!widgetAfter || !widgetAfter.isVisible(), 'disabling the widget hides its window');

  report(consoleErrors.length === 0, 'no renderer errors in the app windows', consoleErrors);

  app.exit(exitCode);
});

app.on('window-all-closed', () => {});
