'use strict';

/* Live test of the floating tools (milestone 4b) on the TEST account only:
     npx electron test/native-tools.js --user-data-dir=<test profile>   (SHOTS=<dir>)
   Study tutor (real AI answer), selection toolbar (translate, speech, favourite, notebook), translator,
   structure chips, sentence-part colours, Tab jump. */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
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
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };
  // select a German text inside an element and release the pointer there (what a user does with the mouse)
  const select = (sel, text) => js(`(() => {
    const root = document.querySelector(${JSON.stringify(sel)}); if (!root) return 'no root';
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) { const i = n.data.indexOf(${JSON.stringify(text)}); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${JSON.stringify(text)}.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const b = r.getBoundingClientRect(); document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: b.left + 2, clientY: b.top + 2 })); return 'ok'; } }
    return 'no text'; })()`);

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  win.focus(); win.webContents.focus();
  await click('[data-nav="dashboard"]');
  await untilDom(`!!document.querySelector('[data-mode]')`, 30000);
  await click('[data-mode="plan"]'); await wait(800);

  /* buttons */
  report(await untilDom(`!!document.querySelector('.tutor-launcher') && !document.querySelector('#amookhtTutor').hidden`, 10000), 'tutor button shown (premium account)');
  report(await untilDom(`!!document.querySelector('.amk-tr-fab') && !document.querySelector('.amk-tr-fab').hidden`, 5000), 'translator button shown above it');

  /* lesson text: structure chips + selection toolbar */
  await click('[data-start="lesen"]') || await click('[data-review="lesen"]');
  await untilDom(`!!document.querySelector('.step-content')`, 10000);
  await click('.steps .step:nth-child(2)'); await wait(900);
  const word = await js(`(() => { const w = document.createTreeWalker(document.querySelector('.step-content'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.parentElement.closest('button,textarea,input,h1,h2,h3')) continue; const m = n.data.match(/[A-ZÄÖÜ][a-zäöüß]{6,}/); if (m) return m[0]; } return ''; })()`);
  report(!!word, 'a German word on the Lesen step', word);
  report(await select('.step-content', word) === 'ok' && await untilDom(`!!document.querySelector('.tutor-selbar:not([hidden]) [data-act="tr"]')`, 4000), 'selecting text shows the toolbar', await js(`[...document.querySelectorAll('.tutor-selbar button')].map((b) => b.dataset.act).join(',')`));
  await shot('m4b-selbar');
  await click('.tutor-selbar [data-act="tr"]');
  report(await untilDom(`!!document.querySelector('.tutor-trcard:not([hidden]) .tutor-trmain')`, 45000), 'translate: the card shows the coach translation', await js(`document.querySelector('.tutor-trcard .tutor-trmain, .tutor-trcard .tutor-trerr')?.textContent`));
  await shot('m4b-translate');
  // speech: the coach voice comes back as audio through the main process
  const tts = await js(`window.amookht.api('/coach/api/tts', { method: 'POST', body: { text: 'Guten Morgen', speed: 0.95 }, binary: true }).then((r) => r.ok ? (r.data.type + ' ' + r.data.base64.length) : 'ERR ' + JSON.stringify(r.error))`);
  report(/^audio\//.test(tts), 'coach voice audio arrives through the main process', tts);
  // favourite via the add box
  const favBefore = ((await state()).favorites || []).length;
  await select('.step-content', word); await untilDom(`!!document.querySelector('.tutor-selbar:not([hidden]) [data-act="fav"]')`, 4000);
  await click('.tutor-selbar [data-act="fav"]');
  await untilDom(`!!document.querySelector('.tutor-addcard:not([hidden]) [data-k="ok"]')`, 3000);
  await click('.tutor-addcard [data-k="ok"]');
  let st = state; let favs = [];
  for (let i = 0; i < 20; i += 1) { favs = (await state()).favorites || []; if (favs.length > favBefore || favs.some((f) => f.title === word)) break; await wait(800); }
  report(favs.some((f) => f.title === word && f.source === 'selection'), 'selection ⭐ saved as a favourite', { before: favBefore, after: favs.length });
  void st;
  // notebook via the add box
  await select('.step-content', word); await untilDom(`!!document.querySelector('.tutor-selbar:not([hidden]) [data-act="nb"]')`, 4000);
  await click('.tutor-selbar [data-act="nb"]');
  await untilDom(`!!document.querySelector('.tutor-addcard:not([hidden]) [data-k="ok"]')`, 3000);
  await click('.tutor-addcard [data-k="ok"]');
  let deck = {};
  for (let i = 0; i < 40; i += 1) { deck = (await state()).testdafMethod?.srs || {}; if (Object.values(deck).some((x) => x.ref && x.ref.startsWith('my-') && (x.data.wort === word || x.data.de === word))) break; await wait(1000); }
  console.log('toast:', await js(`document.querySelector('#tutorToast')?.textContent || ''`));
  report(Object.values(deck).some((x) => x.data.wort === word || x.data.de === word), 'selection 📒 added to the plan notebook (with the coach meaning)', Object.values(deck).filter((x) => x.data.wort === word).map((x) => x.data.bedeutung_fa));

  /* tutor: ask with the lesson context */
  await click('.tutor-launcher');
  report(await untilDom(`!!document.querySelector('.tutor-panel')`, 5000), 'tutor panel opens');
  report(await untilDom(`/Lesen/.test(document.querySelector('#tutorCtx')?.textContent || '')`, 15000), 'tutor shows the lesson as context', await js(`document.querySelector('#tutorCtx')?.textContent.trim().slice(0, 120)`));
  await click('.tutor-panel [data-on-click="Tutor.newChat"]'); await untilDom(`!!document.querySelector('#tutorInput') && !document.querySelector('.tutor-msg')`, 15000);
  await js(`(() => { const t = document.querySelector('#tutorInput'); t.value = 'Was bedeutet ${word}? Bitte ganz kurz.'; t.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await click('.tutor-send');
  report(await untilDom(`!!document.querySelector('.tutor-msg.bot .tutor-md') && !document.querySelector('.tutor-typing')`, 100000), 'the tutor answers (real AI)', await js(`[...document.querySelectorAll('.tutor-msg.bot .tutor-md')].pop()?.textContent.slice(0, 120) || document.querySelector('.tutor-error, .tutor-fail')?.textContent`));
  console.log('asked:', await js(`[...document.querySelectorAll('.tutor-msg.user p')].pop()?.textContent || ''`));
  await shot('m4b-tutor');
  await click('.tutor-panel [data-on-click="Tutor.close"]');
  report(await untilDom(`!document.querySelector('.tutor-panel')`, 3000), 'tutor closes');
  await click('[data-act="pause"]'); await wait(800);

  /* translator */
  await click('.amk-tr-fab');
  report(await untilDom(`!!document.querySelector('.amk-tr-panel:not([hidden])')`, 3000), 'translator opens');
  await js(`(() => { const t = document.querySelector('.amk-tr-in'); t.value = 'Entscheidung'; })()`);
  await click('.amk-tr-go');
  report(await untilDom(`!!document.querySelector('.amk-tr-main')`, 45000), 'translator: translation and collocations', await js(`(document.querySelector('.amk-tr-main')?.textContent || document.querySelector('.amk-tr-err')?.textContent || '').trim() + ' · ' + document.querySelectorAll('.amk-tr-cols li').length`));
  await shot('m4b-translator');
  await click('.amk-tr-x');

  /* sentence-part colours + structure chips */
  await click('[data-nav="favorites"]');
  report(await untilDom(`document.querySelectorAll('#view .amk-sp').length > 0`, 15000), 'sentence-part colours on favourites', await js(`document.querySelectorAll('#view .amk-sp').length + ' coloured, legend ' + !!document.querySelector('#view .sp-legend')`));
  const structOk = await js(`(() => { const p = document.createElement('p'); p.textContent = 'Passiv: werden + Partizip II'; document.querySelector('#view').appendChild(p); return new Promise((r) => setTimeout(() => r(!!p.querySelector('.amk-struct')), 600)); })()`);
  report(structOk, 'structure formulas become red boxes');
  await shot('m4b-favorites');

  /* settings: selection-toolbar options + sentence colours card */
  await click('[data-nav="appSettings"]');
  report(await untilDom(`!!document.querySelector('#amk-sp-set')`, 8000), 'sentence-colour switch in app settings');

  app.exit(failed ? 1 : 0);
});
