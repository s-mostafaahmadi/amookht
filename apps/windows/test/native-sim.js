'use strict';

/* Live test of the TestDaF simulator (milestone 5a) on the TEST account only:
     npx electron test/native-sim.js --user-data-dir=<test profile>   (SHOTS=<dir>) */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 300))); if (!ok) failed += 1; };

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code)) return true; await wait(500); } return false; };
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 20000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(900); s = await state(); } return s; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const confirm = async () => { await untilDom(`!!document.querySelector('.dialog-actions .btn-primary, .dialog-actions .btn-danger')`, 5000); return click('.dialog-actions .btn-primary, .dialog-actions .btn-danger'); };

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  win.focus(); win.webContents.focus();

  await click('[data-nav="testdafSim"]');
  report(await untilDom(`!!document.querySelector('.sim-exam [data-open]')`, 30000), 'exam library with the built-in exam', await js(`document.querySelectorAll('.sim-exam').length`));
  await shot('m5-library');
  await click('[data-open="builtin-testdaf-1"]'); await wait(800);
  if (await click('[data-sim="start"]')) await wait(800);
  if (await js(`!!document.querySelector('[data-sim="reset"]')`)) { await click('[data-sim="reset"]'); await confirm(); await wait(800); await click('[data-sim="start"]'); await wait(600); }
  report(await untilDom(`document.querySelectorAll('[data-section]').length === 4`, 5000), 'overview with four sections');

  /* Lesen */
  await click('[data-section="lesen"]');
  report(await untilDom(`document.querySelectorAll('.sim-q').length === 40`, 5000), 'Lesen: 4 texts, 40 questions', await js(`document.querySelectorAll('.sim-q').length`));
  report(/^\d\d:\d\d$/.test(await js(`document.querySelector('#simTimer').textContent`)), 'section countdown runs');
  await js(`(() => { const qs = document.querySelectorAll('.sim-q'); qs[0].querySelectorAll('input')[0].click(); qs[1].querySelectorAll('input')[1].click(); })()`);
  let st = await until((s) => Object.keys(s.testdafSim?.answers?.lesen || {}).length >= 2);
  report(Object.keys(st.testdafSim.answers.lesen).length >= 2 && st.testdafExamStates?.['builtin-testdaf-1']?.answers?.lesen, 'answers saved like the site (testdafSim + testdafExamStates)', st.testdafSim.answers.lesen);
  await shot('m5-lesen');
  await click('[data-finish="lesen"]'); await confirm();
  st = await until((s) => s.testdafSim?.done?.lesen);
  report(st.testdafSim.done.lesen === true, 'Lesen handed in');

  /* Hören */
  await click('[data-section="hoeren"]');
  report(await untilDom(`document.querySelectorAll('.sim-q').length === 35`, 5000), 'Hören: 35 questions', await js(`document.querySelectorAll('.sim-q').length`));
  await js(`(() => { const i = document.querySelector('.sim-q input[data-text]'); if (i) { i.value = 'Bibliothek'; i.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
  await click('[data-play="0"]'); await wait(6000);
  report(await js(`!!document.querySelector('[data-play="0"]')`), 'audio plays the transcript (coach voice)');
  await click('[data-sim="stop"]');
  await click('[data-sim="pause"]'); await wait(600);

  /* Schreiben */
  await click('[data-section="schreiben"]');
  const essay = Array.from({ length: 360 }, (_, i) => ['Die', 'Grafik', 'zeigt', 'deutlich', 'dass', 'immer', 'mehr', 'Studierende', 'online', 'lernen.'][i % 10]).join(' ');
  await js(`(() => { const t = document.querySelector('[data-essay]'); t.value = ${JSON.stringify(essay)}; t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  report(/360/.test(await js(`document.querySelector('#simWords').textContent`)), 'live word count');
  await click('[data-finish="schreiben"]'); await wait(300);
  st = await until((s) => s.testdafSim?.done?.schreiben);
  report(st.testdafSim.done.schreiben && /Grafik/.test(st.testdafSim.answers.schreiben), 'Schreiben handed in with 350–400 words');

  /* Sprechen: one real recording */
  await click('[data-section="sprechen"]');
  report(await untilDom(`document.querySelectorAll('[data-rec]').length === 7`, 5000), 'Sprechen: 7 tasks');
  await click('[data-rec="0"]'); await wait(3500);
  report(await js(`!!document.querySelector('.sim-rec.is-rec')`), 'recording runs');
  await click('[data-sim="recstop"]');
  st = await until((s) => s.testdafSim?.recordings?.[0], 30000);
  report(!!st.testdafSim.recordings?.[0]?.id, 'recording uploaded to the server', st.testdafSim.recordings?.[0] && Object.keys(st.testdafSim.recordings[0]));
  await untilDom(`!!document.querySelector('.sim-rec audio')`, 5000);
  await shot('m5-sprechen');
  await click('[data-finish="sprechen"]'); await confirm(); await wait(400);
  await click('[data-finish="hoeren"]');
  await click('[data-section="hoeren"]'); await wait(500); await click('[data-finish="hoeren"]'); await confirm();
  st = await until((s) => s.testdafSim?.finished);
  report(st.testdafSim.finished && st.testdafExamVisits?.['builtin-testdaf-1']?.completedAt, 'all four done: simulation finished and marked in the library');
  report(await untilDom(`!!document.querySelector('.sim-done')`, 5000), 'result card shown', await js(`document.querySelector('.sim-done')?.innerText.replace(/\\s+/g, ' ').slice(0, 160)`));
  await shot('m5-result');
  app.exit(failed ? 1 : 0);
});
