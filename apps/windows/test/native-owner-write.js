'use strict';

/* Milestone 7: first live writes on the owner account (after the state backup).
     npx electron test/native-owner-write.js --user-data-dir=<copy of the owner profile> <backup.json>
   Turns «رنگ‌بندی ساختار جمله‌ها» off and back on through the app, then checks the server state: the setting is
   back to its value and every other key is exactly as in the backup. */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 400))); if (!ok) failed += 1; };
const backupFile = process.argv.find((a) => /account-state-before-v4-.*\.json$/.test(a));

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const untilDom = async (code, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code).catch(() => false)) return true; await wait(500); } return false; };
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data;
  if (!backupFile || !fs.existsSync(backupFile)) { console.log('FAIL backup file missing'); app.exit(1); return; }
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8')).state;
  let acc = null;
  for (let i = 0; i < 30 && !(acc && acc.email); i += 1) { acc = await js('__amk.app.account').catch(() => null); if (!(acc && acc.email)) await wait(1000); }
  if (!(acc && acc.owner)) { console.log('FAIL not the owner profile'); app.exit(1); return; }

  const before = await state();
  const was = (before.state_data.appSettings || {}).sentColors !== false;
  await click('[data-nav="appSettings"]');
  report(await untilDom(`!!document.querySelector('#amk-sp-set input')`), 'sentence-colour switch shown');
  await click('#amk-sp-set input'); await wait(2500);
  let s1 = await state();
  report(((s1.state_data.appSettings || {}).sentColors !== false) === !was, 'switch saved to the account', { was, now: s1.state_data.appSettings?.sentColors, version: s1.version });
  await untilDom(`!!document.querySelector('#amk-sp-set input')`);
  await click('#amk-sp-set input'); await wait(2500);
  const after = await state();
  report(((after.state_data.appSettings || {}).sentColors !== false) === was, 'switched back to the original value', { now: after.state_data.appSettings?.sentColors, version: after.version });

  // every key except appSettings (and the server's own bookkeeping) must equal the backup, unless the site
  // changed it meanwhile (then the version moved by more than our two writes)
  const changed = Object.keys({ ...backup.state_data, ...after.state_data }).filter((k) => k !== 'appSettings' && JSON.stringify(backup.state_data[k] ?? null) !== JSON.stringify(after.state_data[k] ?? null));
  report(changed.length === 0, 'all other account data identical to the backup', { changed, backupVersion: backup.version, nowVersion: after.version });
  const as = (o) => { const x = { ...(o || {}) }; delete x.sentColors; return JSON.stringify(x); };
  report(as(backup.state_data.appSettings) === as(after.state_data.appSettings), 'the other app settings untouched');
  app.exit(failed ? 1 : 0);
});
