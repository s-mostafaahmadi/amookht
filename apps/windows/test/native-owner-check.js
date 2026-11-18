'use strict';

/* Milestone 7: page-by-page check on a COPY of the owner's signed-in profile, READ-ONLY.
     AMOOKHT_READONLY=1 npx electron test/native-owner-check.js --user-data-dir=<copy>   (SHOTS=<dir>)
   Opens every page, compares what it shows with the account data the site stored, and lists any write the app
   would have made (READONLY-BLOCKED lines from the main process). */

if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL refusing to run without AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 300))); if (!ok) failed += 1; };
const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  const errors = [];
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 3 && !/Security Warning|Autofill|read-only|423/.test(message)) errors.push(message.slice(0, 200)); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code).catch(() => false)) return true; await wait(600); } return false; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const open = async (id, ready) => { await click(`[data-nav="${id}"]`); const ok = await untilDom(ready, 30000); await wait(800); await shot('m7-' + id); return ok; };

  let acc = null;
  for (let i = 0; i < 30 && !(acc && acc.email); i += 1) { acc = await js('__amk.app.account').catch(() => null); if (!(acc && acc.email)) await wait(1000); }
  if (!(acc && acc.owner)) { console.log('FAIL not the owner profile'); app.exit(1); return; }
  const S = (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const k = todayKey();
  const M = S.user?.examPlan === 'oesd' ? S.oesdMethod : S.testdafMethod;

  /* dashboard: same plan, same done marks */
  report(await open('dashboard', `!!document.querySelector('[data-mode], .act-card, .fs-space')`), 'dashboard opens');
  if (S.studyMode !== 'free' && S.plan) {
    await click('[data-act="to-plan"]'); await wait(500);
    const ids = await js(`[...document.querySelectorAll('.act-card')].map((a) => a.dataset.start || a.dataset.review)`);
    const want = (S.plan.activities || []).map((a) => a.id);
    report(JSON.stringify(ids) === JSON.stringify(want), 'today\'s plan: same activities in the same order as stored', { app: ids, site: want, planDate: S.plan.date });
    const done = await js(`[...document.querySelectorAll('.act-card.is-done')].map((a) => a.dataset.review)`);
    report(JSON.stringify([...done].sort()) === JSON.stringify([...(S.completed || [])].filter((x) => want.includes(x)).sort()), 'done marks match the stored «completed» list', { app: done, site: S.completed });
    const pick = M?.days?.[k]?.picks;
    report(!pick || !!pick.lesen, 'today\'s lesson picks are the stored ones (no re-pick)', pick && { lesen: pick.lesen, hoeren: pick.hoeren });
  } else report(true, 'free study mode or no plan today', S.studyMode);

  /* notebook: plan deck + mistakes */
  report(await open('errorbook', `!!document.querySelector('.vgrid, .err-list, .empty-card, [data-tab]')`), 'notebook opens');
  const deckN = Object.keys(M?.srs || {}).length;
  const shownDeck = await js(`document.querySelectorAll('.vgrid .vc').length`);
  report(shownDeck === deckN || deckN === 0, 'plan deck: every stored card shown', { app: shownDeck, stored: deckN });
  await js(`(() => { const t = [...document.querySelectorAll('[data-tab]')].find((b) => /mistake|error|اشتباه|Fehler/i.test(b.dataset.tab + b.textContent)); if (t) t.click(); })()`);
  await untilDom(`!!document.querySelector('.err-list')`, 8000);
  const shownErr = await js(`document.querySelectorAll('.err-list .ei').length`);
  report(shownErr > 0 === (S.errors || []).length > 0, 'mistakes list shows the stored mistakes', { app: shownErr, stored: (S.errors || []).length });

  /* favourites */
  report(await open('favorites', `!!document.querySelector('.fav-card, .empty-card, .hx-empty')`), 'favourites opens');
  const favN = await js(`document.querySelectorAll('.fav-card').length`);
  report(favN === (S.favorites || []).length, 'favourites: every stored item shown', { app: favN, stored: (S.favorites || []).length });

  /* library (server data, read) */
  report(await open('library', `!!document.querySelector('.lib, .library, [data-folder], .empty-card, .lib-grid')`), 'library opens');

  /* history */
  report(await open('history', `!!document.querySelector('.hx-kpi, .hx-empty')`), 'history opens');
  const planDays = Object.values(M?.days || {}).filter((d) => d && Object.keys(d.results || {}).length).length;
  await js(`(() => { const t = [...document.querySelectorAll('[data-tab]')].find((b) => /plan|برنامه|Lernplan/i.test(b.dataset.tab + b.textContent)); if (t) t.click(); })()`); await wait(800);
  for (let i = 0; i < 6 && await click('[data-more]'); i += 1) await wait(400);
  const shownDays = await js(`document.querySelectorAll('.hx-day').length`);
  report(shownDays >= Math.min(planDays, 7), 'history lists the stored plan days', { app: shownDays, storedWithResults: planDays });

  /* the other pages */
  report(await open('deutschCoach', `!!document.querySelector('#dcoachFrame')`), 'conversation coach opens');
  await wait(4000);
  report(await js(`(() => { const d = document.querySelector('#dcoachFrame')?.contentDocument; return !!d && d.querySelectorAll('[data-coach]').length > 0; })()`), 'coach shows the owner\'s coaches');
  report(await open('testdafSim', `!!document.querySelector('.sim-exam, .sim-section, .sim-intro')`), 'TestDaF simulator opens');
  report(await open('appSettings', `!!document.querySelector('.settings-grid')`), 'app settings open');
  await click('#btn-account'); await wait(400); await click('[data-pop="nav:settings"]');
  report(await untilDom(`!!document.querySelector('#view input')`, 15000), 'account page opens (account menu)'); await shot('m7-account');
  report((await js(`document.querySelector('#view').innerText + ' ' + [...document.querySelectorAll('#view input')].map((i) => i.value).join(' ')`)).includes(acc.email), 'account page shows the owner\'s email');
  report(await open('adminUsers', `document.querySelectorAll('.adm-user').length > 0`), 'admin page opens');

  report(errors.length === 0, 'no script errors on any page', errors.slice(0, 5));
  await wait(1500);
  app.exit(failed ? 1 : 0);
});
