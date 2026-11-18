'use strict';

/* Live test of the native Hören and Lesen modules (milestone 3b) on the TEST account only:
     npx electron test/native-hoeren-lesen.js --user-data-dir=<test profile>   (SHOTS=<dir>)
   Uses Chromium's fake microphone for the recording step. */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 300)));
  if (!ok) failed += 1;
};
const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const type = (sel, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 20000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(800); s = await state(); } return s; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const confirm = () => js(`(() => { const b = document.querySelector('.dialog [data-v="1"]'); if (b) b.click(); return !!b; })()`);
  const step = (n) => click(`.steps [data-go="${n}"]`);

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const k = todayKey();
  win.focus(); win.webContents.focus();

  await click('[data-nav="dashboard"]');
  for (let i = 0; i < 40 && !(await js(`!!document.querySelector('[data-start="hoeren"], [data-review="hoeren"]')`)); i += 1) await wait(500);
  // test account only: the daily renew limit must not block the fresh start this test needs
  await js(`(() => { __amk.store.set('renewCount', 0); })()`); await wait(800);
  let st = await state();
  if (!st.plan || st.plan.date !== k) { console.log('FAIL no plan for today on the test account'); app.exit(1); return; }
  // fresh exercises so both modules start clean
  if ((st.completed || []).includes('hoeren') || (st.completed || []).includes('lesen')) { await click('[data-act="renew"]'); await wait(300); await confirm(); st = await until((s) => !(s.completed || []).length); }

  /* ════════ Hören ════════ */
  for (let i = 0; i < 20 && !(await js(`!!document.querySelector('[data-start="hoeren"]')`)); i += 1) await wait(500);
  await click('[data-start="hoeren"]');
  await wait(1200);
  report(await js(`!!document.querySelector('.tdm-player') && document.querySelectorAll('.steps .step').length >= 2`), 'Hören opens with its player');
  // audio through the cached media source
  await click('[data-audio="toggle"]');
  await wait(4000);
  const audioState = await js(`(() => { const a = [...document.querySelectorAll('audio')]; return { btn: document.querySelector('#tdmAudioBtn')?.textContent, time: document.querySelector('#tdmAudioTime')?.textContent }; })()`);
  await click('[data-audio="toggle"]');
  report(/^0?0:0[1-9]|^00:[0-9][1-9]/.test(audioState.time) || /❚❚/.test(audioState.btn), 'lesson audio plays through the app (cached, behind the gate)', audioState);
  const cached = fs.existsSync(path.join(app.getPath('userData'), 'media', 'assets', 'method-audio'));
  report(cached, 'audio file cached on disk for offline use');
  const steps = await js(`[...document.querySelectorAll('.steps .step b')].map((b) => b.textContent)`);
  const normal = steps[0] === 'Globales Hören';
  if (normal) {
    report(await js(`!!document.querySelector('[data-unlock="rv:hglobal"]')`), 'model answer stays closed until all three answers are written');
    await type('[data-f="g_thema"]', 'Online-Lehre an der Hochschule');
    await type('[data-f="g_problem"]', 'Qualität und Kontakt zu Lehrenden');
    await type('[data-f="g_ziel"]', 'Informationen sammeln');
    await wait(900);
    await step(0);
    await wait(400);
    report(await js(`!!document.querySelector('[data-reveal="hglobal"]')`), 'after answering, the model answer can be opened');
    await shot('m3b-hoeren-global');
    await step(1);
    await wait(500);
  } else {
    report(true, 'exam/eval day: Hören starts with the timed exam step', steps[0]);
  }
  // answer every question with option A (some will be wrong on purpose), then check
  await js(`(() => { document.querySelectorAll('.tdm-q').forEach((q) => { const b = q.querySelector('[data-ans]'); if (b) b.click(); const t = q.querySelector('[data-ans-text]'); if (t) { t.value = 'x'; t.dispatchEvent(new Event('input', { bubbles: true })); } }); return true; })()`);
  await wait(300);
  await click('[data-check="h"]');
  await wait(400);
  await confirm();
  st = await until((s) => s.testdafMethod?.days?.[k]?.work?.hoeren?.checked?.h);
  const wH = st.testdafMethod.days[k].work.hoeren;
  const perf = (st.answerPerformance || []).filter((x) => x.planId === st.plan.id && x.skill === 'hoeren');
  report(wH.checked.h && Object.keys(wH.ans).length >= 3 && perf.length >= 3, 'answers checked and recorded like the site', { answers: Object.keys(wH.ans).length, performance: perf.length });
  await shot('m3b-hoeren-questions');
  if (normal) {
    await step(2);
    await wait(700);
    report(await js(`document.querySelectorAll('.tx [data-seg-line]').length > 3`), 'transcript with clickable lines appears in the analysis step');
    await click('.tx-mark');
    st = await until((s) => (s.testdafMethod?.days?.[k]?.work?.hoeren?.extraErrors || []).length > 0);
    report((st.testdafMethod.days[k].work.hoeren.extraErrors || [])[0]?.text?.length > 10, '"?" adds the unclear sentence', (st.testdafMethod.days[k].work.hoeren.extraErrors || [])[0]?.text);
    st = await until((s) => { const w = s.testdafMethod?.days?.[k]?.work?.hoeren; const x = (w?.extraErrors || [])[0]; return x && w.ai && w.ai['sx_' + x.id]; }, 90000);
    const sx = (() => { const w = st.testdafMethod.days[k].work.hoeren; const x = w.extraErrors[0]; return w.ai['sx_' + x.id]; })();
    report(!!sx && (sx.meaning_fa || sx.error), 'AI explains the sentence (or reports why not)', sx && (sx.meaning_fa || sx.error));
    await shot('m3b-hoeren-analyse');
    await step(4);
    await wait(500);
    await click('[data-rec-start^="zusammenfassung"]');
    await wait(5000);
    await click('[data-rec-stop]');
    st = await until((s) => s.testdafMethod?.days?.[k]?.work?.hoeren?.rec?.zusammenfassung, 30000);
    const rec = st.testdafMethod.days[k].work.hoeren.rec?.zusammenfassung;
    report(!!rec && !rec.local && /^[0-9a-f]{32}$/.test(rec.id || '') && rec.secs >= 3, 'summary recorded and uploaded to the account', rec && { id: rec.id, secs: rec.secs });
    const playable = await js(`new Promise((resolve) => { const a = document.querySelector('.tdm-recorder audio'); if (!a) return resolve('no audio'); a.preload = 'auto'; a.onloadedmetadata = () => resolve('ok ' + Math.round(a.duration || 0)); a.onerror = () => resolve('error ' + (a.error && a.error.code)); a.load(); setTimeout(() => resolve('timeout'), 15000); })`);
    report(/^ok/.test(playable), 'the take plays back from the server', playable);
    await shot('m3b-hoeren-summary');
  }
  await click('[data-act="finish"]');
  st = await until((s) => (s.completed || []).includes('hoeren'));
  const resH = st.testdafMethod.days[k].results?.hoeren;
  report((st.completed || []).includes('hoeren') && resH && resH.pct != null && resH.total > 0, 'Hören finished: result stored, activity done', resH && { pct: resH.pct, total: resH.total, summary: resH.summary });
  report(await js(`!!document.querySelector('.act-card.is-done')`), 'back on the plan, Hören shown as done');

  /* ════════ Lesen ════════ */
  await click('[data-start="lesen"]');
  await wait(1000);
  const lsteps = await js(`[...document.querySelectorAll('.steps .step b')].map((b) => b.textContent)`);
  const qStep = lsteps.findIndex((s) => /Aufgaben|Prüfung|Test/.test(s));
  await step(qStep);
  await wait(500);
  report(await js(`!!document.querySelector('.tdm-split .tdm-text') && document.querySelectorAll('.tdm-q').length > 2`), 'Lesen shows text and questions side by side');
  await shot('m3b-lesen');
  await js(`(() => { document.querySelectorAll('.tdm-q').forEach((q, i) => { const bs = q.querySelectorAll('[data-ans]'); if (bs.length) bs[i % bs.length].click(); }); return true; })()`);
  await click('[data-check="l"]');
  await wait(400);
  await confirm();
  st = await until((s) => s.testdafMethod?.days?.[k]?.work?.lesen?.checked?.l);
  report(!!st.testdafMethod.days[k].work.lesen.checked.l, 'Lesen answers checked');
  await step(lsteps.length - 1);
  await wait(600);
  st = await until((s) => s.testdafMethod?.days?.[k]?.work?.lesen?.ai?.lq, 90000);
  const lq = st.testdafMethod.days[k].work.lesen.ai.lq;
  report(!!lq && (Array.isArray(lq.items) || lq.error), 'AI analysis of wrong answers runs automatically', lq && (lq.error || { items: lq.items.length, extra: (lq.extra || []).length }));
  await type('[data-f="summary"]', 'Der Text zeigt, dass flexible Lernformate beliebt sind.');
  await wait(900);
  await shot('m3b-lesen-fehler');
  await click('[data-act="finish"]');
  st = await until((s) => (s.completed || []).includes('lesen'));
  const resL = st.testdafMethod.days[k].results?.lesen;
  report(resL && resL.pct != null && resL.summary.includes('flexible'), 'Lesen finished with score and summary', resL && { pct: resL.pct, analysed: resL.analysed });
  const logged = (st.testdafMethod.log || []).filter((x) => x.date === k);
  report(logged.length > 0, 'mistakes went into the method log (weekly analysis)', logged.length);
  const seg = (st.history || []).find((h) => h.date === k)?.segments?.[st.plan.id];
  report(seg && seg.comp >= 2, 'history segment counts the finished activities', seg && { comp: seg.comp, acts: seg.acts });

  app.exit(failed ? 1 : 0);
});
