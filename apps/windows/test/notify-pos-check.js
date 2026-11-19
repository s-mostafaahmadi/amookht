'use strict';

/* Where do in-app dialogs appear? (owner profile COPY, read-only)
     AMOOKHT_READONLY=1 npx electron test/notify-pos-check.js --user-data-dir=<copy>   (SHOTS=<dir>)
   Opens pages, scrolls the view down, opens a confirm dialog / admin modal and reports its box against the window. */

if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL refusing to run without AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  const js = (code) => win.webContents.executeJavaScript(code);
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1100 }).toPNG()); };
  const until = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code).catch(() => false)) return true; await wait(500); } return false; };
  const box = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: innerHeight, zoom: getComputedStyle(document.querySelector('#view')).zoom, viewScroll: document.querySelector('#view').scrollTop }; })()`);
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  // 1) admin page modal after scrolling
  await js(`document.querySelector('[data-nav="adminUsers"]')?.click()`);
  await until(`document.querySelectorAll('.adm-user [data-del]').length > 0`, 30000);
  await js(`document.querySelector('#view').scrollTop = 99999`); await wait(400);
  await js(`[...document.querySelectorAll('.adm-user [data-del]')].pop().click()`); await wait(500);
  console.log('ancestors:', JSON.stringify(await js(`(() => { const out = []; let el = document.querySelector('.adm-modal'); while (el && el !== document.documentElement) { const cs = getComputedStyle(el); const bad = ['transform','filter','backdropFilter','perspective','contain','willChange','containerType'].map((k) => [k, cs[k]]).filter(([k, v]) => v && v !== 'none' && v !== 'auto' && v !== 'normal'); out.push((el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ').join('.') : el.tagName) + (bad.length ? ' ' + JSON.stringify(bad) : '')); el = el.parentElement; } return out; })()`)));
  console.log('admin delete modal .dialog:', JSON.stringify(await box('.adm-modal .dialog')), 'shade:', JSON.stringify(await box('.adm-modal')));
  await shot('notify-admin');
  await js(`document.querySelector('[data-adm="cancel"]')?.click()`); await wait(300);
  // 2) confirmDialog (dashboard renew) after scrolling
  await js(`document.querySelector('[data-nav="dashboard"]')?.click()`);
  await until(`!!document.querySelector('[data-act="renew"]')`, 30000);
  await js(`document.querySelector('#view').scrollTop = 99999`); await wait(400);
  await js(`document.querySelector('[data-act="renew"]').click()`); await wait(500);
  console.log('confirmDialog .dialog:', JSON.stringify(await box('.dialog-shade .dialog')));
  await shot('notify-confirm');
  await js(`document.querySelector('.dialog-shade [data-v="0"]')?.click()`);
  await wait(500);
  app.exit(0);
});
