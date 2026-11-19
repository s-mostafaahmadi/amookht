'use strict';
/* «شبیه‌سازی آزمون» (TestDaF / ÖSD) in the app (owner profile COPY, read-only):
     AMOOKHT_READONLY=1 npx electron test/exam-sim-check.js --user-data-dir=<copy>   (SHOTS=<dir>) */
if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL needs AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron');
const path = require('node:path'); const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no window'); app.exit(1); return; }
  win.setSize(1500, 950);
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|read-only|READONLY/.test(message)) console.log('console:', message.slice(0, 220)); });
  const js = (c) => win.webContents.executeJavaScript(c);
  const until = async (c, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(c).catch(() => false)) return true; await wait(500); } return false; };
  const shot = async (n) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, n + '.png'), img.resize({ width: 1200 }).toPNG()); };
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  console.log('nav label:', await js(`document.querySelector('[data-nav="testdafSim"]')?.textContent.trim()`));
  console.log('engine program:', await js(`__amk.engine ? __amk.engine.program() : 'n/a'`));
  await js(`document.querySelector('[data-nav="testdafSim"]')?.click()`);
  console.log('chooser:', await until(`!!document.querySelector('.osd-chooser')`, 15000), 'tdf lib:', await js(`!!document.querySelector('.page.sim')`));
  await wait(1500); await shot('es-1');
  await js(`document.querySelector('[data-osd="pick"][data-v="oesd"]').click()`); await wait(600);
  console.log('osd home:', await js(`!!document.querySelector('.osd-exams')`), 'examPlan:', await js(`__amk.app.store ? (__amk.app.store.get('user')||{}).examPlan : 'n/a'`), 'program still:', await js(`__amk.engine ? __amk.engine.program() : 'n/a'`));
  await js(`document.querySelector('[data-osd="open"][data-v="osd-b2-2"]').click()`); await wait(300);
  await js(`document.querySelector('[data-osd="mod"][data-v="hoeren"]').click()`); await wait(500);
  await js(`document.querySelector('[data-osd="play"][data-v="a1"]').click()`); await wait(2500);
  console.log('audio playing:', await js(`document.querySelector('.osd-play.is-on') ? 'yes' : 'no'`), 'prog:', await js(`document.querySelector('[data-osd-prog="a1"]')?.style.width`));
  await js(`document.querySelector('[data-osd="play"][data-v="a1"]').click()`); await wait(300);
  await js(`document.querySelector('[data-osd="back"]').click()`); await wait(200);
  await js(`document.querySelector('[data-osd="mod"][data-v="sprechen"]').click()`); await wait(200);
  await js(`document.querySelector('[data-osd="tab"][data-v="1"]').click()`); await wait(1500);
  console.log('pictures:', await js(`JSON.stringify([...document.querySelectorAll('.osd-pic img')].map(i=>i.naturalWidth))`));
  await shot('es-2');
  await js(`document.querySelector('[data-osd="pick"][data-v="testdaf"]').click()`); await wait(800);
  console.log('back to TestDaF:', await js(`!!document.querySelector('.page.sim') && !document.querySelector('.osd-exams')`));
  app.exit(0);
});
