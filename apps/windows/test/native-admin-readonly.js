'use strict';

/* Read-only check of the admin / owner features (milestone 6) on a COPY of the owner's signed-in profile.
     AMOOKHT_READONLY=1 npx electron test/native-admin-readonly.js --user-data-dir=<copy>   (SHOTS=<dir>)
   With AMOOKHT_READONLY=1 the main process refuses every write (logged as READONLY-BLOCKED), so nothing on the
   owner account can change. The test only opens pages and lists. */

if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL refusing to run without AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 300))); if (!ok) failed += 1; };

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|read-only/.test(message)) console.log('console:', message.slice(0, 200)); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code)) return true; await wait(600); } return false; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };

  let acc = null;
  for (let i = 0; i < 30 && !(acc && acc.email); i += 1) { acc = await js('__amk.app.account').catch(() => null); if (!(acc && acc.email)) await wait(1000); }
  report(!!(acc && acc.owner), 'signed in as the owner (read-only run)', acc && { owner: acc.owner, admin: acc.admin });
  if (!(acc && acc.owner)) { app.exit(1); return; }

  report(await js(`!!document.querySelector('[data-nav="adminUsers"]')`), 'the admin page is in the sidebar for the owner');
  await click('[data-nav="adminUsers"]');
  report(await untilDom(`document.querySelectorAll('.adm-user').length > 0`, 30000), 'user list loads', await js(`document.querySelectorAll('.adm-user').length`));
  report(await js(`[...document.querySelectorAll('.adm-filters b')].map((b) => b.textContent).join('/')`).then((t) => /^\d+\//.test(t)), 'role filters with counts', await js(`[...document.querySelectorAll('.adm-filters button')].map((b) => b.textContent.trim()).join(' · ')`));
  report(await js(`!!document.querySelector('.adm-user select:not([disabled])') && !!document.querySelector('[data-del]')`), 'owner controls (role select, block, delete) are offered');
  report(await js(`document.querySelectorAll('.adm-date').length > 0 && /\\S/.test(document.querySelector('.adm-users').textContent)`), 'dates and last-seen shown', await js(`document.querySelector('.adm-date')?.textContent`));
  report(await untilDom(`!!document.querySelector('#amkAiBox')`, 15000), 'owner AI-admin box on the page');
  await wait(3000);
  report(await js(`!/خطا|error/i.test(document.querySelector('#amkAiBox')?.textContent || '') && (document.querySelector('#amkAiBox')?.textContent || '').length > 50`), 'AI-admin box loads providers', await js(`(document.querySelector('#amkAiBox')?.textContent || '').replace(/\\s+/g, ' ').slice(0, 160)`));
  await click('[data-filter="premium"]'); await wait(400);
  report(await js(`[...document.querySelectorAll('.adm-user')].every((u) => u.classList.contains('role-premium'))`), 'premium filter works');
  await click('[data-filter="all"]');
  await shot('m6-admin');

  /* owner assistant: open and list conversations (GET only) */
  report(await untilDom(`!!document.querySelector('.owner-ai-launcher')`, 8000), 'owner assistant button shown');
  await click('.owner-ai-launcher');
  report(await untilDom(`!!document.querySelector('#ownerAiRoot .owner-ai-panel, #ownerAiRoot [class*="owner-ai"] textarea')`, 15000), 'owner assistant panel opens', await js(`(document.querySelector('#ownerAiRoot')?.textContent || '').replace(/\\s+/g, ' ').slice(0, 160)`));
  await wait(3000);
  await shot('m6-owner-chat');
  await click('#ownerAiRoot [data-on-click="window.closeOwnerAIChat"]');

  /* simulator admin tools */
  await click('[data-nav="testdafSim"]');
  report(await untilDom(`!!document.querySelector('.sim-admin') && document.querySelectorAll('[data-dl]').length > 0`, 30000), 'simulator: admin import, builder and exam tree shown', await js(`document.querySelectorAll('.sim-tree').length`));
  await shot('m6-sim-admin');

  /* owner day files in History (only looked at: creating one would write) */
  await click('[data-nav="history"]'); await wait(1500);
  await js(`(() => { const t = [...document.querySelectorAll('[data-tab]')].find((b) => /plan|برنامه|Lernplan/i.test(b.dataset.tab + b.textContent)); if (t) t.click(); })()`); await wait(800);
  report(await untilDom(`document.querySelectorAll('.hx-file-btn').length > 0`, 10000), 'History: owner day-file buttons on plan days', await js(`document.querySelectorAll('.hx-file-btn').length + ' · ' + (document.querySelector('.hx-file-btn')?.textContent || '')`));
  await shot('m6-history');
  await wait(2000);
  app.exit(failed ? 1 : 0);
});
