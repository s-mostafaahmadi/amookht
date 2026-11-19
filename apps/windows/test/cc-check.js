'use strict';
/* «کنترل محتوا» in the app admin page (owner profile COPY, read-only):
     AMOOKHT_READONLY=1 npx electron test/cc-check.js --user-data-dir=<copy>   (SHOTS=<dir>) */
if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL needs AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron');
const path = require('node:path'); const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no window'); app.exit(1); return; }
  win.setSize(1500, 950);
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|read-only|READONLY/.test(message)) console.log('console:', message.slice(0, 220)); });
  const js = (c) => win.webContents.executeJavaScript(c);
  const until = async (c, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(c).catch(() => false)) return true; await wait(500); } return false; };
  const shot = async (n) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, n + '.png'), img.resize({ width: 1200 }).toPNG()); };
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  await js(`document.querySelector('[data-nav="adminUsers"]')?.click()`);
  console.log('panel+tiles:', await until(`document.querySelectorAll('.amp4-wk').length > 10`, 30000), await js(`document.querySelectorAll('.amp4-wk').length`));
  console.log('split sizes:', await js(`JSON.stringify([...document.querySelectorAll('.amp-split-a,.amp-split-b')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.width),Math.round(r.height)]}))`));
  console.log('ai box below split:', await js(`(() => { const a = document.querySelector('#amkAiBox'), s = document.querySelector('.amp-split'); return a ? Math.round(a.getBoundingClientRect().top - s.getBoundingClientRect().bottom) : 'no ai box'; })()`));
  await shot('cc-1');
  await js(`document.querySelector('[data-amp-week="1"]').click()`); await wait(700);
  await js(`document.querySelector('[data-amp-week="9"]').click()`); await wait(700);
  console.log('windows:', await js(`JSON.stringify([...document.querySelectorAll('.amp4-win')].map(w=>[w.dataset.w, w.querySelectorAll('.amp4-day').length, Math.round(w.getBoundingClientRect().top)]))`));
  await js(`document.querySelector('.amp4-win [data-amp-dt]').click()`); await wait(400);
  console.log('details rows:', await js(`document.querySelectorAll('.amp4-win .amp4-det-row').length`), 'done strikes:', await js(`document.querySelectorAll('.amp4-chip.is-done').length`));
  await shot('cc-2');
  console.log('lean:', await js(`__amk.engine ? __amk.engine.lean() : 'n/a'`));
  app.exit(0);
});
