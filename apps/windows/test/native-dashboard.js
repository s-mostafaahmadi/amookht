'use strict';

/* Live test of «اجرای برنامه» (milestone 3a) on the TEST account only:
     npx electron test/native-dashboard.js --user-data-dir=<test profile>   (SHOTS=<dir>) */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
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
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 15000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(600); s = await state(); } return s; };
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG());
  };
  const confirm = () => js(`(() => { const b = document.querySelector('.dialog [data-v="1"]'); if (b) b.click(); return !!b; })()`);

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const k = todayKey();

  await click('[data-nav="dashboard"]');
  await wait(1500);
  if (await js(`!!document.querySelector('[data-program]')`)) {
    report(true, 'no program yet → program choice is shown');
    await shot('m3-programs');
    await click('[data-program="testdaf"]');
  } else report(true, 'program already chosen');
  let st = await until((s) => s.plan && s.plan.date === k && Array.isArray(s.plan.activities) && s.plan.activities.length);
  const plan = st.plan;
  report(st.user.examPlan === 'testdaf' && plan && plan.activities.every((a) => a.type === 'method'), 'today\'s method plan saved to the account', plan && plan.activities.map((a) => `${a.id}:${a.dur}`));
  const daily = Number(st.testdafMethod?.dailyMin) || 240;
  const sum = plan.activities.filter((a) => a.id !== 'extra').reduce((s2, a) => s2 + a.dur, 0);
  report(sum === daily, 'module minutes add up to the daily time', { sum, daily });
  const day = st.testdafMethod?.days?.[k];
  report(!!day && day.picks && day.picks.hoeren && day.picks.lesen && day.picks.schreiben?.id && Array.isArray(day.picks.sprechen), 'today\'s content picks stored like the site', day && day.picks);
  const seg = (st.history || []).find((h) => h.date === k)?.segments?.[plan.id];
  report(!!seg && seg.acts === plan.activities.length, 'today\'s history segment written', seg && { acts: seg.acts, comp: seg.comp });
  await wait(800);
  await shot('m3-dashboard');
  report(await js(`document.querySelectorAll('.act-card').length`) === plan.activities.length, 'activity list shows every module');

  /* start the first activity, simulate real work, pause */
  win.focus();
  win.webContents.focus();
  const first = plan.activities.find((a) => !(st.completed || []).includes(a.id));
  const before = Number(st.activityTimers?.[first.id]) || 0;
  await click(`[data-start="${first.id}"]`);
  await wait(500);
  report(await js(`!!document.querySelector('.act-frame') && document.querySelectorAll('.step').length > 1`), 'activity frame with its steps opens', first.id);
  for (let i = 0; i < 12; i += 1) { await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true })); true`); await wait(1000); }
  const clock = await js(`document.querySelector('#actTotal')?.textContent`);
  await shot('m3-activity');
  await click('[data-go="1"]');
  await wait(300);
  report(await js(`document.querySelectorAll('.step')[1].classList.contains('is-on')`), 'step navigation works');
  await click('[data-act="pause"]');
  st = await until((s) => (Number(s.activityTimers?.[first.id]) || 0) > before && s.testdafMethod?.days?.[k]?.work?.[first.id]?.step === 1);
  const after = Number(st.activityTimers?.[first.id]) || 0;
  report(after - before >= 5 && after - before <= 14, 'active study time counted only while working (≈12 s)', { added: after - before, clock });
  const w = st.testdafMethod.days[k].work?.[first.id];
  report(!!w && w.startedAt && Array.isArray(w.secs) && w.secs[0] > 0 && w.step === 1, 'step time and position saved in the day\'s work', w && { secs: w.secs, step: w.step });

  /* weekly program: daily time, focus, extra */
  await click('[data-hub="woche"]');
  await wait(400);
  const target = daily === 120 ? 180 : 120;
  await click(`[data-daily="${target}"]`);
  st = await until((s) => Number(s.testdafMethod?.dailyMin) === target);
  const sum2 = st.plan.activities.filter((a) => a.id !== 'extra').reduce((s2, a) => s2 + a.dur, 0);
  report(sum2 === target, `daily time ${target} min rescales today's plan`, st.plan.activities.map((a) => `${a.id}:${a.dur}`));
  await shot('m3-week');
  await click('[data-wtab="focus"]');
  await wait(300);
  const sat = await js(`document.querySelector('[data-focus="6:schreiben"]')?.getAttribute('aria-pressed')`);
  await click('[data-focus="6:schreiben"]');
  st = await until((s) => !!s.testdafMethod?.weekFocus?.[6]);
  report(Array.isArray(st.testdafMethod.weekFocus[6]), 'weekly focus saved', { before: sat, after: st.testdafMethod.weekFocus[6] });
  await click('[data-focus-reset="6"]');
  await click('[data-wtab="time"]');
  await wait(300);
  if (st.testdafMethod?.days?.[st.plan.date]?.results?.extra) report(true, 'Extra-Lernzeit already finished today: extra-time chips are locked (site rule), skipped');
  else {
    await click('[data-extra="15"]');
    st = await until((s) => s.plan.activities.some((a) => a.id === 'extra' && a.dur === 15));
    report(st.plan.activities.some((a) => a.id === 'extra' && a.dur === 15), 'extra time adds Extra-Lernzeit (15 min)');
  }
  await click('[data-extra="0"]');
  await click('[data-act="to-plan"]');
  await wait(400);

  /* free-study tab */
  await click('[data-mode="free"]');
  await wait(600);
  for (let i = 0; i < 20 && !(await js(`!!document.querySelector('.fs-space')`)); i += 1) await wait(500);
  report(await js(`!!document.querySelector('.fs-space') && !!document.querySelector('[data-gd-open]')`), 'free-study tab shows the games space and the grammar bot (milestone 4)');
  await click('[data-mode="plan"]');
  await wait(800);
  st = await state();
  report(st.studyMode === 'plan' && st.plan && st.plan.id, 'back on the plan tab with the same plan', { mode: st.studyMode, plan: st.plan?.id === plan.id });

  /* renew */
  const renewBefore = st.renewCountDate === k ? Number(st.renewCount) || 0 : 0;
  const oldPicks = JSON.stringify(st.testdafMethod.days[k].picks);
  await click('[data-act="renew"]');
  await wait(300);
  await confirm();
  if (renewBefore >= 3) {
    // the test account already used today's 3 renewals: the app must refuse and keep the plan
    await wait(1500);
    const toastText = await js(`[...document.querySelectorAll('.toast')].map((t) => t.textContent).join(' ')`);
    st = await state();
    report(st.plan.id === plan.id && /۳|3/.test(toastText), 'renew limit (3 a day) reached: refused, plan kept', toastText);
  } else {
    st = await until((s) => s.plan && s.plan.id !== plan.id);
    report(st.plan.id !== plan.id && JSON.stringify(st.testdafMethod.days[k].picks) !== oldPicks, 'renew saves the day and builds fresh exercises', { picks: st.testdafMethod.days[k].picks });
    report(st.renewCount === renewBefore + 1, 'renew counts toward the daily limit of 3', { before: renewBefore, after: st.renewCount });
    const closed = (st.history || []).find((h) => h.date === k)?.segments?.[plan.id];
    report(!!closed && closed.closeReason === 'manual-renew', 'the old plan is closed in history', closed && closed.closeReason);
  }

  app.exit(failed ? 1 : 0);
});
