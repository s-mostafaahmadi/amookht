'use strict';

/* Live test of the native Schreiben and Sprechen modules (milestone 3c) on the TEST account only:
     npx electron test/native-schreiben-sprechen.js --user-data-dir=<test profile>   (SHOTS=<dir>) */

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
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const until = async (ok, ms = 20000) => { const end = Date.now() + ms; let s = await state(); while (!ok(s) && Date.now() < end) { await wait(900); s = await state(); } return s; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const stepByName = (re) => js(`(() => { const b = [...document.querySelectorAll('.steps .step')].find((x) => ${re}.test(x.querySelector('b').textContent)); if (!b) return false; b.click(); return true; })()`);

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const k = todayKey();
  win.focus(); win.webContents.focus();
  await click('[data-nav="dashboard"]');
  await wait(2500);
  let st = await state();
  const W = (s, id) => s.testdafMethod?.days?.[k]?.work?.[id];
  const mode = st.testdafMethod?.days?.[k]?.mode;

  /* ════════ Schreiben ════════ */
  if ((st.completed || []).includes('schreiben')) report(true, 'Schreiben already done today, skipped');
  else {
    await click('[data-start="schreiben"]');
    await wait(1200);
    report(await js(`!!document.querySelector('.tdm-task') && document.querySelectorAll('.steps .step').length >= 2`), 'Schreiben opens with the task', mode);
    if (mode === 'normal') {
      report(await js(`!!document.querySelector('[data-unlock^="rv:sana"], [data-unlock^="rv:gana"]')`), 'analysis help stays closed until three boxes are filled');
    }
    await stepByName(/^Schreiben|Zusammenfassung schreiben|Prüfung/);
    await wait(500);
    report(await js(`document.querySelectorAll('.tdm-phrases button').length > 3`), 'phrase chips are offered');
    const essay = 'In der heutigen Gesellschaft wird oft darüber diskutiert, ob digitale Medien das Lernen verbessern. Einerseits ermöglichen sie einen schnellen Zugang zu Informationen, andererseits lenken sie viele Studierende ab. Meiner Meinung nach überwiegen die Vorteile, wenn man sie bewusst nutzt. Deshalb sollten Hochschulen klare Regeln einführen.';
    await type('#tdmEssay', essay);
    await click('.tdm-phrases button');
    await wait(1200);
    const wc = await js(`document.querySelector('#tdmWc')?.textContent`);
    report(Number(String(wc).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) >= 45, 'live word count updates while writing', wc);
    st = await until((s) => (W(s, 'schreiben')?.f?.text || '').length > 300);
    report((W(st, 'schreiben')?.f?.text || '').includes('Hochschulen'), 'the text is saved as you type');
    await shot('m3c-schreiben');
    await stepByName(/Korrektur/);
    st = await until((s) => W(s, 'schreiben')?.ai?.writing, 120000);
    const ai = W(st, 'schreiben').ai.writing;
    report(!!ai && (ai.scores || ai.error), 'AI correction runs automatically on the Korrektur step', ai && (ai.error || { scores: ai.scores, tdn: ai.tdn, errors: (ai.errors || []).length }));
    if (ai && ai.scores) report(Object.keys(W(st, 'schreiben').rate).filter((x) => x.startsWith('k_')).length === 5, 'AI scores fill the five ratings');
    await wait(1500);
    await shot('m3c-korrektur');
    await click('[data-act="finish"]');
    st = await until((s) => (s.completed || []).includes('schreiben'));
    const r = st.testdafMethod.days[k].results?.schreiben;
    report(r && r.words >= 45 && r.text.includes('Hochschulen'), 'Schreiben finished: text, word count and score stored', r && { words: r.words, score: r.score, kind: r.kind });
  }

  /* ════════ Sprechen ════════ */
  if ((st.completed || []).includes('sprechen')) report(true, 'Sprechen already done today, skipped');
  else if (mode !== 'normal') report(true, 'exam/eval day: Sprechen exam flow not covered by this run', mode);
  else {
    await click('[data-start="sprechen"]');
    await wait(1200);
    report(await js(`/Vorbereitung/.test(document.querySelector('.steps .step b')?.textContent || '')`), 'Sprechen starts with preparation');
    await type('[data-f="kw_0"]', 'Erfahrung · Kosten · Zeit');
    await wait(900);
    await stepByName(/^Sprechen/);
    await wait(500);
    await click('[data-rec-start^="try1_0"]');
    await wait(6000);
    await click('[data-rec-stop]');
    st = await until((s) => W(s, 'sprechen')?.rec?.try1_0?.id, 30000);
    const rec = W(st, 'sprechen').rec.try1_0;
    report(!!rec && /^[0-9a-f]{32}$/.test(rec.id) && rec.secs >= 5, 'first attempt recorded and uploaded', rec && { secs: rec.secs });
    await stepByName(/^Analyse/);
    st = await until((s) => W(s, 'sprechen')?.ai?.sp_try1_0, 160000);
    const sa = W(st, 'sprechen').ai.sp_try1_0;
    report(!!sa && (sa.transcript !== undefined || sa.error), 'speech analysis runs automatically (transcript + issues, or a clear error)', sa && (sa.error || { wpm: sa.wpm, issues: sa.issues }));
    await wait(1500);
    await shot('m3c-sprechen-analyse');
    await click('[data-self="sp:0:pausen|true"]');
    await wait(900);
    st = await until((s) => W(s, 'sprechen')?.self?.['sp:0:pausen'] === true);
    report(W(st, 'sprechen').self['sp:0:pausen'] === true, 'checklist answer saved');
    await stepByName(/^Wiederholung/);
    await wait(400);
    await click('[data-rate="s0_fluss|4"]');
    await wait(900);
    await click('.steps .step:last-child');
    await wait(500);
    await click('[data-act="finish"]');
    st = await until((s) => (s.completed || []).includes('sprechen'));
    const r2 = st.testdafMethod.days[k].results?.sprechen;
    report(r2 && r2.recordings >= 1, 'Sprechen finished: recordings and issues stored', r2);
    const recAfter = st.testdafMethod.days[k].work.sprechen.rec.try1_0;
    report(!sa || sa.error || recAfter?.gone === true, 'analysed audio deleted after finishing (analysis kept)', recAfter);
  }

  app.exit(failed ? 1 : 0);
});
