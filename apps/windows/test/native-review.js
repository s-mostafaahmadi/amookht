'use strict';

/* Live test of the native review modules (milestone 3d) on the TEST account only:
     npx electron test/native-review.js --user-data-dir=<test profile>   (SHOTS=<dir>)
   Grammatik & Wortschatz, Wiederholung and Extra-Lernzeit run end to end; Fehleranalyse and
   Wochenbericht only exist on Fridays (their drawing is covered by test/work-parity.mjs). */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 260))); if (!ok) failed += 1; };
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
  const count = (sel) => js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 20000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(900); s = await state(); } return s; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const step = (n) => click(`.steps .step:nth-child(${n})`);

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const k = todayKey();
  win.focus(); win.webContents.focus();
  await click('[data-nav="dashboard"]');
  await wait(2500);
  let st = await state();
  const W = (s, id) => s.testdafMethod?.days?.[k]?.work?.[id];
  const srsN = (s) => Object.keys(s.testdafMethod?.srs || {}).length;
  const inPlan = (id) => (st.plan?.activities || []).some((a) => a.id === id);

  /* ════════ Grammatik & Wortschatz ════════ */
  if (!inPlan('wortschatz')) report(true, 'Wortschatz not in today\'s plan, skipped');
  else if ((st.completed || []).includes('wortschatz')) report(true, 'Wortschatz already done today, skipped');
  else {
    const before = srsN(st);
    await click('[data-start="wortschatz"]');
    await wait(1200);
    report(await count('.steps .step') === 4, 'Wortschatz opens with four steps');
    await step(2);
    await wait(800);
    report(await count('.tdm-word') >= 3, 'new words shown as word cards', await count('.tdm-word'));
    report(await count('.tdm-word [data-fav-rate]') >= 3, 'each word can be starred (favourites)');
    await step(3);
    await wait(800);
    report(await count('.tdm-redemittel article') >= 3, 'Redemittel shown');
    st = await until((s) => srsN(s) >= before + 6);
    report(srsN(st) > before, 'new words and Redemittel enter the review deck', { before, after: srsN(st) });
    report(Object.keys(st.wordProgress || {}).length > 0, 'words registered in the site word list');
    await step(4);
    await wait(800);
    report(await js(`!!document.querySelector('.tdm-grammar .rule')`), 'grammar of the week card with the rule');
    await type('[data-f="satz_0"]', 'Wenn ich mehr Zeit hätte, würde ich eine Entscheidung treffen.');
    await type('[data-f="satz_1"]', 'Die Unterlagen stehen allen Studierenden zur Verfügung.');
    await click('[data-fchk="satzg_0"]');
    await wait(900);
    await shot('m3d-wortschatz');
    await click('[data-ai-sentences]');
    st = await until((s) => W(s, 'wortschatz')?.ai?.saetze, 120000);
    const ai = W(st, 'wortschatz')?.ai?.saetze;
    report(!!ai && (Array.isArray(ai.results) || ai.error), 'AI sentence check answers', ai && (ai.error || (ai.results || []).map((x) => x.ok)));
    report(W(st, 'wortschatz')?.f?.satzg_0 === true, 'grammar checkbox saved');
    await wait(1200);
    await shot('m3d-saetze');
    await click('[data-act="finish"]');
    st = await until((s) => (s.completed || []).includes('wortschatz'));
    const r = st.testdafMethod.days[k].results?.wortschatz;
    report(r && r.sentences === 2, 'Wortschatz finished: sentences stored', r);
  }

  /* ════════ Wiederholung ════════ */
  if (!inPlan('wiederholung')) report(true, 'Wiederholung not in today\'s plan, skipped');
  else if ((st.completed || []).includes('wiederholung')) report(true, 'Wiederholung already done today, skipped');
  else {
    await click('[data-start="wiederholung"]');
    await wait(1500);
    report(await count('.steps .step') === 5, 'Wiederholung opens with five steps');
    const cards = await count('.tdm-flash');
    if (cards) {
      const key = await js(`document.querySelector('[data-flip]')?.dataset.flip`);
      await click('[data-flip]');
      await wait(700);
      report(await count('[data-srs]') >= 2, 'card turns over and offers known / not known');
      await click('[data-srs$="|1"]');
      st = await until((s) => W(s, 'wiederholung')?.ans?.['srs:' + key] === 'ok');
      report(st.testdafMethod.srs[key]?.reps >= 1, 'rating moves the card to its next interval', st.testdafMethod.srs[key]);
    } else report(true, 'no words due yet on this account (first day), card step empty', cards);
    await step(2);
    await wait(700);
    report(await js(`/اشتباه|Fehler|mistake/i.test(document.querySelector('.step-content').textContent)`), 'mistake review step draws');
    await step(5);
    await wait(900);
    const qs = await count('.tdm-q');
    if (qs) {
      for (let n = 0; n < qs; n += 1) await click(`.tdm-q:nth-child(${n + 1}) [data-quiz]`);
      await click('[data-quiz-done]');
      st = await until((s) => W(s, 'wiederholung')?.quiz?.done);
      report(Number.isFinite(W(st, 'wiederholung').quiz.pct), 'self-test scored', W(st, 'wiederholung').quiz.pct);
    } else report(true, 'not enough cards for a self-test yet (fallback shown)');
    await shot('m3d-wiederholung');
    await click('[data-act="finish"]');
    st = await until((s) => (s.completed || []).includes('wiederholung'));
    report((st.completed || []).includes('wiederholung'), 'Wiederholung finished', st.testdafMethod.days[k].results?.wiederholung);
  }

  /* ════════ Extra-Lernzeit ════════ */
  if ((st.completed || []).includes('extra')) report(true, 'Extra already done today, skipped');
  else {
    if (!inPlan('extra')) {
      await click('[data-hub="woche"]'); await wait(1200);
      report(await click('[data-extra="30"]'), 'extra time chips in the weekly program');
      st = await until((s) => (s.plan?.activities || []).some((a) => a.id === 'extra'));
      await click('[data-act="to-plan"]');
    }
    await wait(1500);
    if (!await click('[data-start="extra"]')) report(false, 'extra time could not be started', { plan: (st.plan?.activities || []).map((a) => a.id), chip: await js(`[...document.querySelectorAll('[data-extra]')].map((b) => b.dataset.extra + (b.disabled ? 'x' : '')).join()`), view: await js(`document.querySelector('.page, main')?.className + ' ' + document.querySelectorAll('.act-card').length`) });
    else {
      await wait(1200);
      report(await count('.steps .step') === 3, 'Extra opens with three steps');
      st = await until((s) => W(s, 'extra')?.sx);
      report(!!W(st, 'extra')?.sx, 'sentence tasks picked from today\'s review', W(st, 'extra')?.sx && Object.fromEntries(Object.entries(W(st, 'extra').sx).map(([a, b]) => [a, b.length])));
      if (await count('.tdm-sx')) {
        await type('.tdm-sx textarea', 'Obwohl es schwierig ist, lerne ich jeden Tag neue Wörter.');
        await click('.tdm-sx [data-fchk]');
        await wait(1000);
        st = await until((s) => Object.keys(W(s, 'extra')?.f || {}).some((x) => x.startsWith('sx_')));
        report(Object.keys(W(st, 'extra').f).some((x) => x.startsWith('sx_')), 'own sentence saved');
      }
      await shot('m3d-extra');
      await click('.steps .step:last-child');
      await wait(500);
      await click('[data-act="finish"]');
      st = await until((s) => (s.completed || []).includes('extra'));
      report((st.completed || []).includes('extra'), 'Extra finished', st.testdafMethod.days[k].results?.extra);
    }
  }

  app.exit(failed ? 1 : 0);
});
