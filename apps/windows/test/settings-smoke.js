'use strict';

/* Settings smoke test: `npx electron test/settings-smoke.js` */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const messages = [];
let exitCode = 1;

const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) exitCode = 1;
};

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 940,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'fake-settings.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) messages.push(message);
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.log('FAIL renderer crashed :: ' + JSON.stringify(details));
    app.exit(1);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'settings.html'));
  await new Promise((resolve) => setTimeout(resolve, 900));

  const initial = await win.webContents.executeJavaScript(`(() => {
    const q = (s) => document.querySelector(s);
    return {
      tabs: [...document.querySelectorAll('.nav-item')].map((n) => n.dataset.tab),
      activeTab: document.querySelector('.nav-item.is-active')?.dataset.tab,
      visiblePanels: [...document.querySelectorAll('[data-panel]')].filter((n) => !n.hidden).map((n) => n.dataset.panel),
      autostart: q('#set-autostart')?.checked,
      scale: q('#set-scale')?.value,
      accent: [...document.querySelectorAll('#set-accent button')].find((b) => b.classList.contains('is-on'))?.dataset.accent,
      refresh: q('#set-refresh')?.value,
      widgetEnabled: q('#set-widget-enabled')?.checked,
      widgetState: q('#widget-state')?.textContent,
      account: q('#account-status')?.textContent,
      email: q('#account-email')?.textContent,
      version: q('#about-version')?.textContent,
      dataFolder: q('#data-folder-path')?.textContent,
      dir: document.documentElement.dir,
      theme: document.documentElement.dataset.theme,
      accentTheme: document.documentElement.dataset.accent,
    };
  })()`);

  await win.webContents.executeJavaScript("document.querySelector('[data-tab=\"widget\"]').click()");
  const afterSwitch = await win.webContents.executeJavaScript(`(() => ({
    visiblePanels: [...document.querySelectorAll('[data-panel]')].filter((n) => !n.hidden).map((n) => n.dataset.panel),
  }))()`);

  console.log('DOM ' + JSON.stringify({ initial, afterSwitch }, null, 2));
  console.log('console errors: ' + JSON.stringify(messages));

  exitCode = 0;
  report(initial.tabs.join(',') === 'general,widget,account,advanced,about', 'five settings tabs exist', initial.tabs);
  report(initial.activeTab === 'general', 'general tab active on open');
  report(initial.visiblePanels.join(',') === 'general', 'only the general panel is visible', initial.visiblePanels);
  report(afterSwitch.visiblePanels.join(',') === 'widget', 'switching tabs swaps the panel', afterSwitch.visiblePanels);
  report(initial.autostart === true, 'autostart reflects saved settings');
  report(initial.scale === '1.1', 'ui scale reflects saved settings', initial.scale);
  report(initial.accent === 'violet' && initial.accentTheme === 'violet', 'accent colour reflects saved settings', [initial.accent, initial.accentTheme]);
  report(String(initial.dataFolder).includes('Amookht'), 'data folder path shown', initial.dataFolder);
  report(initial.refresh === '120', 'auto refresh reflects saved settings', initial.refresh);
  report(String(initial.version).includes('2.2.0-smoke'), 'about shows the app version', initial.version);
  report(initial.widgetEnabled === true && /روشن/.test(String(initial.widgetState)), 'widget state shown as on', initial.widgetState);
  report(/وارد/.test(String(initial.account)) && initial.email === 'smoke@test.local', 'account block shows the signed-in email');
  report(String(initial.version).includes('2.2.0-smoke'), 'version rendered', initial.version);
  report(initial.dir === 'rtl' && initial.theme === 'dark', 'persian RTL dark defaults', [initial.dir, initial.theme]);
  report(messages.length === 0, 'no renderer console errors', messages);

  app.exit(exitCode);
});
