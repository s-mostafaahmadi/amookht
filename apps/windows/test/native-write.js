'use strict';

/* Live WRITE check of the native app on the TEST account only:
     node test/make-test-profile.js <dir>
     npx electron test/native-write.js --user-data-dir=<dir>
   Clicks an accent swatch and a toggle in «تنظیمات برنامه», then reads the account state
   straight from the server and checks the change landed (and that the app refused to run
   if the profile is not the test account). */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) failed += 1;
};

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  const js = (code) => win.webContents.executeJavaScript(code);

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: profile is not the test account', email); app.exit(1); return; }
  report(true, 'signed in as the test account');
  for (let i = 0; i < 20 && !(await js('__amk.store.ready && __amk.store.status.ws === true')); i += 1) await wait(500);
  report(await js('__amk.store.ready && __amk.store.status.ws === true'), 'state loaded and live socket up', await js('__amk.store.status'));

  const server = () => js(`(async () => { const r = await window.amookht.api('/v1/account/state'); return r.ok ? r.data : r; })()`);

  await js(`document.querySelector('[data-nav="appSettings"]').click(); true`);
  await wait(700);
  const before = await js(`__amk.store.get('appSettings.accent') || 'violet'`);
  const target = before === 'emerald' ? 'rose' : 'emerald';
  await js(`document.querySelector('.swatch[data-accent="${target}"]').click(); true`);
  await wait(300); // the page re-renders after the accent change
  const darkBefore = await js(`document.querySelector('[data-toggle="darkMode"]').checked`); // as shown (defaults apply on an empty account)
  await js(`document.querySelector('[data-toggle="darkMode"]').click(); true`);
  await wait(2500);

  const remote = await server();
  const st = (remote && remote.state_data) || {};
  report((st.appSettings || {}).accent === target, 'accent saved to the account', { sent: target, server: (st.appSettings || {}).accent, version: remote && remote.version });
  report(!!st.darkMode === !darkBefore, 'dark-mode switch saved', { server: st.darkMode });
  report(await js(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().length > 0`), 'new accent applied on screen');
  report(await js(`__amk.store.status.status === 'synced'`), 'status bar says synced', await js('__amk.store.status.status'));
  app.exit(failed ? 1 : 0);
});
