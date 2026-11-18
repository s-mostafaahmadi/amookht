'use strict';

/* Live test of «مطالعه آزاد» (milestone 4a) on the TEST account only:
     npx electron test/native-free.js --user-data-dir=<test profile>   (SHOTS=<dir>)
   Free tab with the games space and the grammar bot; plays two games and one grammar-bot round with the real AI. */

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
  const count = (sel) => js(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
  const untilDom = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(code)) return true; await wait(500); } return false; };
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  win.focus(); win.webContents.focus();

  await click('[data-nav="dashboard"]');
  await untilDom(`!!document.querySelector('[data-mode="free"], [data-act="to-plan"]')`, 30000);
  await click('[data-act="to-plan"]');
  await untilDom(`!!document.querySelector('[data-mode="free"]')`, 30000);
  await click('[data-mode="free"]');
  report(await untilDom(`!!document.querySelector('.fs-space')`, 15000), 'free tab shows the games space');
  report(await count('.fs-tile') === 6, 'six game tiles', await count('.fs-tile'));
  report(await count('.fs-tool') === 3, 'three tool cards (notebook, favourites, library)');
  report(await js(`!!document.querySelector('[data-gd-open]')`), 'grammar bot entry card');
  report(await js(`/🌿/.test(document.querySelector('[data-mode="free"]').textContent)`), 'free tab uses the site\'s free-space label');
  await shot('m4-free');

  /* level and topic */
  await click('[data-fs="setLevel"][data-a="3"]'); await wait(400);
  report(await js(`document.querySelector('.fs-lv.lv3')?.classList.contains('is-on')`), 'level «hard» selected and remembered');
  await click('[data-fs="topics"]');
  report(await untilDom(`document.querySelectorAll('.fg-topic').length > 5`, 5000), 'topic picker opens');
  await click('.fg-topic:nth-child(1)'); await wait(600);
  await click('[data-fs="setLevel"][data-a="2"]'); await wait(400);

  /* der/die/das: answer every round */
  await click('[data-fs="play"][data-a="artikel"]');
  report(await untilDom(`!!document.querySelector('.fg-art .fg-opt')`, 20000), 'der/die/das game starts (bank loaded from the content cache)');
  for (let r = 0; r < 12; r += 1) {
    if (await js(`!!document.querySelector('.fg-end')`)) break;
    await click('.fg-art .fg-opt'); await wait(250);
    await click('#fgFb .fg-btn'); await wait(250);
  }
  report(await untilDom(`!!document.querySelector('.fg-end')`, 5000), 'game ends with a score card');
  await shot('m4-game-end');
  await click('.fg-end .fg-ghost'); await wait(600);
  report(await js(`!!document.querySelector('[data-a="artikel"] .fs-stars')`), 'best result shown on the tile');

  /* sentence builder: place every chip */
  await click('[data-fs="play"][data-a="builder"]');
  if (await untilDom(`!!document.querySelector('.fg-chip')`, 10000)) {
    const n = await count('.fg-chip');
    for (let i = 0; i < n; i += 1) await click('.fg-chip:not(.is-used)');
    report(await untilDom(`!!document.querySelector('#fgFb.is-ok, #fgFb.is-bad')`, 3000), 'sentence builder checks the order');
  } else report(false, 'sentence builder did not start');
  await click('.fg-x'); await wait(500);

  /* grammar bot: pick one topic, translate one sentence */
  await click('[data-gd-open]');
  report(await untilDom(`document.querySelectorAll('.gd-chip').length > 20`, 5000), 'grammar bot opens with the topic picker');
  const sel = await count('.gd-chip.is-on');
  if (!sel) await click('.gd-chip[data-topic="perfekt"]');
  await click('.gd-confirm');
  report(await untilDom(`!!document.querySelector('.gd-q .gd-fa')`, 40000), 'a Persian sentence arrives', await js(`document.querySelector('.gd-q .gd-src')?.textContent`));
  await js(`(() => { const t = document.querySelector('.gd-input textarea'); t.value = 'Ich habe gestern einen Brief geschrieben.'; })()`);
  await click('.gd-input .gd-primary');
  report(await untilDom(`!!document.querySelector('.gd-res .gd-verdict')`, 40000), 'the answer gets a verdict', await js(`document.querySelector('.gd-res .gd-verdict')?.textContent`));
  await shot('m4-grammar-bot');
  await click('.gd-x'); await wait(400);
  report(!(await js(`!!document.querySelector('.gd-overlay')`)), 'grammar bot closes');

  await click('[data-mode="plan"]'); await wait(800);
  app.exit(failed ? 1 : 0);
});
