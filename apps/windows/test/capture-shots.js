'use strict';

/* Screenshots for the site's download guide, taken on the TEST account only (no real user data).
     npx electron test/capture-shots.js --user-data-dir=<test profile> <out dir> */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const OUT = process.argv.slice(2).find((a) => !a.startsWith('-') && !/.js$/i.test(a) && /shots/i.test(a)) || path.join(__dirname, 'shots');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code).catch(() => false)) return true; await wait(500); } return false; };
  const DARK = process.env.SHOT_DARK === '1';
  const shot = async (name, w = win, width = 1280) => { if (DARK) name += '-dark'; await wait(900); const img = await w.webContents.capturePage(); fs.writeFileSync(path.join(OUT, name + '.jpg'), img.resize({ width }).toJPEG(82)); console.log('SHOT', name); };

  const email = await js('__amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL not the test account'); app.exit(1); return; }
  win.setSize(1366, 820); win.center(); win.focus();
  // a neutral learner name and the light look for the pictures (test account only)
  await js(`(() => { const e = __amk.engine; e.S.user.name = 'Sara'; e.save(); const a = JSON.parse(JSON.stringify(__amk.store.get('appSettings') || {})); a.sentColors = true; __amk.store.set('appSettings', a); __amk.store.set('darkMode', ${DARK}); })()`);
  await wait(1500);
  const ver = require(path.join(__dirname, '..', 'package.json')).version;
  await js(`(() => { const set = () => { const v = document.querySelector('#status-version'); if (v) v.textContent = 'Amookht ${ver}'; }; set(); setInterval(set, 300); })()`);

  await click('[data-nav="dashboard"]');
  await untilDom(`!!document.querySelector('[data-mode]')`);
  await click('[data-mode="plan"]'); await wait(800);
  await click('[data-act="to-plan"]'); await wait(800);
  await js(`document.querySelector('#view').scrollTop = 0`);
  if (!(DARK && process.env.SHOT_FROM)) {
  await shot('01-dashboard');
  await js(`document.querySelector('.act-section')?.scrollIntoView({ block: 'start' })`);
  await shot('02-plan');

  await (await click('[data-start="hoeren"]') || click('[data-review="hoeren"]'));
  await untilDom(`!!document.querySelector('.tdm-player')`);
  await js(`document.querySelector('#view').scrollTop = 0`);
  await shot('03-hoeren');
  }

  if (!DARK) {
  await click('[data-act="pause"]'); await wait(800);
  await (await click('[data-start="lesen"]') || click('[data-review="lesen"]'));
  await untilDom(`!!document.querySelector('.step-content')`);
  await click('.steps .step:nth-child(2)'); await wait(1000);
  await js(`(() => { const root = document.querySelector('.step-content'); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.parentElement.closest('button,h1,h2,h3')) continue; const m = n.data.match(/[A-ZÄÖÜ][a-zäöüß]{7,}/); if (m) { const i = n.data.indexOf(m[0]); const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + m[0].length); getSelection().removeAllRanges(); getSelection().addRange(r); const b = r.getBoundingClientRect(); document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: b.left + 2, clientY: b.top + 2 })); return m[0]; } } })()`);
  await untilDom(`!!document.querySelector('.tutor-selbar:not([hidden])')`, 5000);
  await click('.tutor-selbar [data-act="tr"]');
  await untilDom(`!!document.querySelector('.tutor-trcard:not([hidden]) .tutor-trmain')`, 40000);
  await shot('04-selection-translate');
  await js(`getSelection().removeAllRanges(); document.querySelector('.tutor-trcard') && (document.querySelector('.tutor-trcard').hidden = true); document.querySelector('.tutor-selbar') && (document.querySelector('.tutor-selbar').hidden = true)`);

  await click('.tutor-launcher');
  await untilDom(`!!document.querySelector('.tutor-panel .tutor-msg.bot')`, 20000);
  await shot('05-tutor');
  await click('.tutor-panel [data-on-click="Tutor.close"]');
  }
  await click('[data-act="pause"]'); await wait(800);

  await click('[data-mode="free"]');
  await untilDom(`!!document.querySelector('.fs-space')`);
  await shot('06-free-study');
  await click('[data-fs="play"][data-a="artikel"]');
  await untilDom(`!!document.querySelector('.fg-art .fg-opt')`, 20000);
  await shot('07-game');
  await click('.fg-x'); await wait(500);
  await click('[data-mode="plan"]'); await wait(800);

  await click('[data-nav="errorbook"]'); await untilDom(`!!document.querySelector('.vgrid, .err-list')`); await shot('08-notebook');
  await click('[data-nav="testdafSim"]'); await untilDom(`!!document.querySelector('.sim-exam')`); await shot('09-simulator');
  await click('[data-nav="deutschCoach"]');
  await untilDom(`(() => { const d = document.querySelector('#dcoachFrame')?.contentDocument; return !!d && d.querySelectorAll('[data-coach]').length > 0; })()`, 40000);
  await wait(2500); await shot('10-coach');

  if (DARK) { await js(`__amk.store.set('darkMode', false)`); await wait(800); app.exit(0); return; }
  // dark look
  await js(`__amk.store.set('darkMode', true)`); await wait(1200);
  await click('[data-nav="dashboard"]'); await untilDom(`!!document.querySelector('[data-mode]')`); await js(`document.querySelector('#view').scrollTop = 0`);
  await shot('11-dark');
  await js(`__amk.store.set('darkMode', false)`); await wait(800);

  // the desktop widget
  await js(`window.amookht.showWidget()`); await wait(5000);
  const widget = BrowserWindow.getAllWindows().find((w) => /widget\.html/.test(w.webContents.getURL()));
  if (widget) { widget.focus(); await wait(1500); await shot('12-widget', widget, widget.getBounds().width); } else console.log('no widget window');

  app.exit(0);
});
