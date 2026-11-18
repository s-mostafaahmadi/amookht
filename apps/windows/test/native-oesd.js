'use strict';

/* Live test of the ÖSD program (milestone 3e) on the TEST account only:
     npx electron test/native-oesd.js --user-data-dir=<test profile>   (SHOTS=<dir>)
   Switches the test account to ÖSD, checks plan, wording, level card, a Lesen and a Schreiben lesson,
   a level change, then switches the account back to TestDaF. */

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
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const text = () => js(`document.querySelector('#page, main, .page')?.innerText || document.body.innerText`);
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 30000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(900); s = await state(); } return s; };
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code)) return true; await wait(600); } return false; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const confirm = async () => { await untilDom(`!!document.querySelector('.dialog-actions .btn-primary, .dialog-actions .btn-danger')`, 5000); return click('.dialog-actions .btn-primary, .dialog-actions .btn-danger'); };
  const switchTo = async (id) => {
    await click('[data-nav="dashboard"]'); await wait(1500);
    await click('[data-act="to-plan"]'); await wait(600);
    await click('[data-hub="woche"]'); await wait(1200);
    if (await click('[data-act="change-program"]')) { await confirm(); await wait(1200); } else report(false, 'change-program button not found');
    await untilDom(`!!document.querySelector('[data-program="${id}"]')`, 8000);
    await click(`[data-program="${id}"]`);
    return until((s) => s.user?.examPlan === id && s.plan && (s.plan.examType === id), 60000);
  };

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  win.focus(); win.webContents.focus();
  const k = todayKey();

  /* ── switch to ÖSD ── */
  let st = await switchTo('oesd');
  report(st.user?.examPlan === 'oesd' && st.plan?.examType === 'oesd', 'program switched to ÖSD and a plan was built', st.plan && { examType: st.plan.examType, acts: st.plan.activities.map((a) => a.id) });
  st = await until((s) => s.oesdMethod?.days?.[k]?.picks);
  const picks = st.oesdMethod?.days?.[k]?.picks;
  report(!!picks && /^O|^[A-Z]/.test(String(picks.lesen || '')), 'ÖSD lessons picked into oesdMethod', picks);
  await untilDom(`!!document.querySelector('.osd-settings')`, 20000);
  report(await js(`!!document.querySelector('.osd-settings [data-oesd-level="B2"]') && !!document.querySelector('.osd-settings [data-oesd-level="C1"]')`), 'ÖSD level card on the dashboard');
  const t = await text();
  report(!/TestDaF|TDN 4/.test(t) && /ÖSD/.test(t), 'ÖSD wording on the dashboard (no TestDaF / TDN)', (t.match(/.{0,30}(TestDaF|TDN 4).{0,30}/) || [])[0]);
  await shot('m3e-dashboard');

  /* ── a level change before practice applies at once ── */
  const lv = st.oesdMethod?.level || (/C1|C2/.test(st.user?.level || '') ? 'C1' : 'B2');
  const other = lv === 'B2' ? 'C1' : 'B2';
  await click(`[data-oesd-level="${other}"]`);
  st = await until((s) => s.oesdMethod?.level === other || s.oesdMethod?.levelNext === other);
  report(st.oesdMethod?.level === other || st.oesdMethod?.levelNext === other, `level change to ${other} saved (${st.oesdMethod?.levelNext ? 'from tomorrow' : 'now'})`, { level: st.oesdMethod?.level, next: st.oesdMethod?.levelNext });

  /* ── Lesen lesson with ÖSD content ── */
  await click('[data-act="to-plan"]'); await wait(1200);
  if (await click('[data-start="lesen"]')) {
    await wait(1500);
    report(await js(`document.querySelectorAll('.steps .step').length >= 3`), 'ÖSD Lesen opens with its steps');
    await click('.steps .step:nth-child(3)'); await wait(900);
    const qn = await js(`document.querySelectorAll('[data-q]').length`);
    report(qn > 0, 'ÖSD Lesen questions render', qn);
    await shot('m3e-lesen');
    await click('[data-act="pause"]'); await wait(900);
  } else report(false, 'Lesen card not found');

  /* ── Schreiben: the e-mail task gets e-mail fields ── */
  if (await click('[data-start="schreiben"]')) {
    await wait(1500);
    const mail = await js(`/E-Mail|Mail/i.test(document.querySelector('.tdm-item-head')?.innerText || '')`);
    const label = await js(`document.querySelector('.tdm-field span')?.innerText || ''`);
    report(mail ? /Anlass/.test(label) : /Problem/.test(label), `Schreiben analysis fields fit the task (${mail ? 'e-mail' : 'opinion text'})`, label);
    await shot('m3e-schreiben');
    await click('[data-act="pause"]'); await wait(900);
  } else report(false, 'Schreiben card not found');

  /* ── back to TestDaF ── */
  st = await switchTo('testdaf');
  report(st.user?.examPlan === 'testdaf' && st.plan?.examType === 'testdaf', 'test account switched back to TestDaF', st.plan && st.plan.activities.map((a) => a.id));
  report(!!st.oesdMethod?.days?.[k], 'ÖSD progress kept in oesdMethod after switching back');

  app.exit(failed ? 1 : 0);
});
