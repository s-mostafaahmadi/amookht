'use strict';
/* 4.4 port check on the owner profile COPY, read-only:
     AMOOKHT_READONLY=1 npx electron test/batch-check.js --user-data-dir=<copy>   (SHOTS=<dir>) */
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
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|read-only|READONLY/.test(message)) console.log('console:', message.slice(0, 240)); });
  const js = (c) => win.webContents.executeJavaScript(c);
  const until = async (c, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(c).catch(() => false)) return true; await wait(400); } return false; };
  const shot = async (n) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, n + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const click = (sel) => js(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  console.log('theme mini:', await js(`!!document.querySelector('#btn-theme-mini')`));
  await click('[data-nav="dashboard"]'); await until(`!!document.querySelector('[data-mode]')`); await click('[data-mode="plan"]'); await wait(1200);
  console.log('dash pair:', await js(`(() => { const p = document.querySelector('.dash-pair'); if (!p) return 'none'; return [...p.children].map((c) => Math.round(c.getBoundingClientRect().width)).join(','); })()`), 'card title:', await js(`document.querySelector('.day-card h3')?.textContent`));
  console.log('halo:', await js(`JSON.stringify({focus: document.querySelectorAll('.act-card.is-focus').length, soft: document.querySelectorAll('.act-card.is-soft').length})`));
  await shot('b-1-dashboard');
  await click('[data-hub="woche"]'); await wait(800); await click('[data-wtab="focus"]'); await wait(800);
  console.log('weekday cards:', await js(`document.querySelectorAll('.wd-day').length`), 'rows:', await js(`document.querySelectorAll('.wd-list li').length`), 'tabs:', await js(`[...document.querySelectorAll('.hub-tabs button')].map(b=>b.textContent).join('|')`));
  console.log('time table gone:', await js(`!document.querySelector('.tbl-min')`), 'phase gone:', await js(`!/Phase/.test(document.querySelector('#view').innerText)`));
  await shot('b-2-week');
  await click('[data-hub="muster"]'); await wait(700); console.log('muster cards:', await js(`document.querySelectorAll('.muster').length`)); await shot('b-3-muster');
  await click('[data-hub="grammatik"]'); await wait(1500); console.log('grammar current:', await js(`(() => { const e = document.querySelector('.gram-card.is-cur-week'); if (!e) return 'none'; const r = e.getBoundingClientRect(); return e.querySelector('h3').textContent + ' @' + Math.round(r.top); })()`)); await shot('b-4-grammar');
  await click('[data-hub="methode"]'); await wait(600); console.log('method has Wortschatz card:', await js(`/Grammatik & Wortschatz/.test(document.querySelector('#view').innerText)`));
  await click('[data-nav="errorbook"]'); await wait(1200); await click('[data-act="deck-add"]'); await wait(600);
  console.log('deck modal:', await js(`(() => { const m = document.querySelector('[data-nmodal="deck"] .nmodal-card'); if (!m) return 'none'; const r = m.getBoundingClientRect(); return Math.round(r.top) + '..' + Math.round(r.bottom) + ' of ' + innerHeight + ' scroll:' + (m.scrollHeight > m.clientHeight); })()`));
  await shot('b-5-deckmodal');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`); await js(`document.querySelector('[data-nmodal="deck"]')?.click()`); await wait(400);
  console.log('deck modal closed:', await js(`!document.querySelector('[data-nmodal="deck"]')`));
  await click('[data-nav="favorites"]'); await wait(1000); await click('[data-act="new"]'); await wait(600);
  console.log('fav modal:', await js(`(() => { const m = document.querySelector('[data-nmodal="fav"] .nmodal-card'); if (!m) return 'none'; const r = m.getBoundingClientRect(); return Math.round(r.top) + '..' + Math.round(r.bottom) + ' of ' + innerHeight; })()`), 'library word:', await js(`/کتابخانه/.test(document.querySelector('#view').innerText)`));
  await shot('b-6-favmodal');
  await js(`document.querySelector('[data-nmodal="fav"]')?.click()`); await wait(300);
  await click('[data-nav="appSettings"]'); await wait(900); console.log('account card gone:', await js(`!document.querySelector('.link-card')`));
  await click('[data-nav="adminUsers"]'); await until(`document.querySelectorAll('.amp4-wk').length > 5`, 30000);
  console.log('sw buttons:', await js(`document.querySelectorAll('[data-amp-sw]').length`), 'filters under search:', await js(`!!document.querySelector('.adm-tools .adm-filters-list')`));
  await click('[data-amp-sw="usr"]'); await wait(400); await click('[data-amp-sw="sys"]'); await wait(3500); await click('[data-amp-sw="cnt"]'); await wait(3000);
  console.log('status windows:', await js(`JSON.stringify([...document.querySelectorAll('.amp-sw-win')].map((w) => [w.dataset.w, w.querySelector('.amp4-win-body').innerText.slice(0, 50).replace(/\\n/g, ' ')]))`));
  await shot('b-7-status');
  app.exit(0);
});
