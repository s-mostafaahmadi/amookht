'use strict';

/* Widget smoke test: `npx electron test/smoke.js`
   Loads the real src/widget.html with a stub bridge (test/fake-preload.js):
   header + tabs + list + footer, add / toggle / delete, notes tab. No network. */

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
    width: 360,
    height: 400,
    show: false,
    frame: false,
    resizable: true,
    webPreferences: { preload: path.join(__dirname, 'fake-preload.js'), contextIsolation: true, sandbox: true },
  });
  win.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) errors.push(message);
  });
  await win.loadFile(path.join(__dirname, '..', 'src', 'widget.html'));
  await wait(400);
  const js = (code) => win.webContents.executeJavaScript(code);
  const snap = () => js(`({
    title: document.querySelector('#w-title').textContent,
    tabs: [...document.querySelectorAll('.w-tab')].map((n) => n.textContent + (n.classList.contains('is-active') ? '*' : '')),
    rows: [...document.querySelectorAll('.w-row')].map((n) => n.querySelector('.w-text').textContent + (n.classList.contains('is-done') ? ' ✓' : '')),
    count: document.querySelector('#w-count').textContent,
    logout: document.querySelector('#btn-logout').textContent,
    tools: document.querySelectorAll('.w-tools .w-icon').length,
  })`);

  const first = await snap();
  report(first.title === 'کارها', 'title shows the tab name', first.title);
  report(JSON.stringify(first.tabs) === JSON.stringify(['کارها*', 'یادداشت‌ها']), 'two tabs, tasks active', first.tabs);
  report(first.rows.length === 3, 'three tasks listed', first.rows);
  report(first.count === '۳ باز', 'footer counts open tasks', first.count);
  report(first.logout === 'خروج از حساب', 'footer has sign-out', first.logout);
  report(first.tools === 4, 'header has pin, add, refresh, close', first.tools);

  await js(`document.querySelector('[data-act="add"]').click(); document.querySelector('#add-title').value = 'Wortliste 3'; document.querySelector('#add-form').requestSubmit(); true`);
  await wait(200);
  const added = await snap();
  report(added.rows.includes('Wortliste 3') && added.count === '۴ باز', 'adding a task', added.rows);

  await js(`document.querySelector('.w-row[data-id="td1"] .w-check').click(); true`);
  await wait(200);
  const toggled = await snap();
  report(toggled.rows[0] === 'تماس با استاد ✓' && toggled.count === '۳ باز', 'checking a task off', toggled.rows[0]);

  await js(`document.querySelector('.w-row[data-id="td2"] .w-del').click(); true`);
  await wait(200);
  const deleted = await snap();
  report(!deleted.rows.some((text) => text.startsWith('تمرین گرامر')), 'deleting a task', deleted.rows);

  await js(`document.querySelector('#tab-notes').click(); true`);
  await wait(100);
  const notes = await js(`({ title: document.querySelector('#w-title').textContent, notes: document.querySelectorAll('.w-note').length })`);
  report(notes.title === 'یادداشت‌ها' && notes.notes === 1, 'notes tab', notes);

  report(win.isResizable(), 'window is resizable');
  win.setSize(270, 230);
  await wait(200);
  const fits = await js(`document.querySelector('.w-foot').getBoundingClientRect().bottom <= innerHeight + 1`);
  report(fits, 'footer stays visible when shrunk');
  report(errors.length === 0, 'no renderer console errors', errors);
  app.exit(exitCode);
});
