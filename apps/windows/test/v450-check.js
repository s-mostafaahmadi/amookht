'use strict';
/* 4.5.0 port check on the owner profile COPY (read-only: every server write is refused):
     AMOOKHT_READONLY=1 npx electron test/v450-check.js --user-data-dir=<copy>   (SHOTS=<dir>)
   plan setup (stacked sections, 6 day cards in 3 columns, tap = focus, drag = swap / nearest, minutes edit),
   program page halos, exam simulation (ÖSD panel hook, TestDaF), multi-voice audio through the bridge, admin cards. */
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
  const errs = [];
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|read-only|READONLY|423/.test(message)) { errs.push(message.slice(0, 220)); console.log('console:', message.slice(0, 220)); } });
  const js = (c) => win.webContents.executeJavaScript(c);
  const until = async (c, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(c).catch(() => false)) return true; await wait(500); } return false; };
  const shot = async (n) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, n + '.png'), img.resize({ width: 1200 }).toPNG()); };
  const out = (k, v) => console.log(k + ':', typeof v === 'string' ? v : JSON.stringify(v));
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  out('account', await js(`({owner: !!__amk.app.account.owner, admin: !!__amk.app.account.admin})`));

  /* plan setup */
  await js(`document.querySelector('[data-nav="dashboard"]')?.click()`); await wait(1500);
  await until(`!!document.querySelector('[data-hub="woche"]')`, 20000);
  await js(`document.querySelector('[data-hub="woche"]').click()`); await wait(1200);
  out('plan setup', await js(`({ tabs: !!document.querySelector('.week-config .segmented'), sections: [...document.querySelectorAll('.wc-title')].map(x=>x.textContent), days: document.querySelectorAll('.wd-grid.wd-3 .wd-day').length, cols: getComputedStyle(document.querySelector('.wd-grid.wd-3')).gridTemplateColumns.split(' ').length, minBtns: document.querySelectorAll('.wd-minbtn').length, runBtn: !!document.querySelector('.week-config [data-act="to-plan"]'), weekTable: [...document.querySelectorAll('h3')].some(h=>/برنامه هفتگی|Wochenplan|Weekly plan/.test(h.textContent)), examStructure: [...document.querySelectorAll('h3')].some(h=>/ساختار آزمون|Prüfungsaufbau|Exam structure/.test(h.textContent)), recommended: document.querySelector('.daily-btns .is-rec')?.textContent.trim() })`));
  await shot('v450-plan');
  const ids = (wd) => `[...document.querySelectorAll('.wd-list[data-wd-list="${wd}"] li')].map(l=>l.dataset.wdSkill.split(':')[1])`;
  const before = await js(ids(6));
  await js(`(() => { const l=document.querySelector('.wd-list[data-wd-list="6"]'); const a=l.querySelectorAll('li')[0], b=l.querySelectorAll('li')[2]; const dt=new DataTransfer(); a.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt})); const r=b.getBoundingClientRect(); b.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:r.left+5,clientY:r.top+r.height/2})); b.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:r.left+5,clientY:r.top+r.height/2})); })()`); await wait(500);
  const swapped = await js(ids(6));
  await js(`(() => { const l=document.querySelector('.wd-list[data-wd-list="6"]'); const a=l.querySelectorAll('li')[0]; const dt=new DataTransfer(); a.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt})); const r=l.getBoundingClientRect(); const day=l.closest('.wd-day'); day.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:r.left+5,clientY:r.bottom+30})); day.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt,clientX:r.left+5,clientY:r.bottom+30})); })()`); await wait(500);
  const nearest = await js(ids(6));
  out('drag Saturday', { before, swap1and3: swapped, firstToBottom: nearest });
  await js(`document.querySelector('.wd-list[data-wd-list="6"] [data-wd-minedit]').click()`); await wait(200);
  const opened = await js(`!!document.querySelector('.wd-mininp') && document.activeElement === document.querySelector('.wd-mininp')`);
  await js(`(() => { const i=document.querySelector('.wd-mininp'); i.value='95'; i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); })()`); await wait(500);
  out('minutes edit', { opened, after: await js(`[...document.querySelectorAll('.wd-list[data-wd-list="6"] [data-wd-minedit]')].map(b=>b.dataset.wdMinedit.split(':')[1]+'='+b.dataset.v)`), total: await js(`document.querySelector('.wd-list[data-wd-list="6"]').closest('.wd-day').querySelector('.wd-total').textContent`), resetBtns: await js(`[...document.querySelector('.wd-list[data-wd-list="6"]').closest('.wd-day').querySelectorAll('.wd-acts button')].map(b=>b.textContent)`) });
  const twd = await js(`new Date().getDay()`);
  if ([6, 0, 1, 2, 3, 4].includes(twd)) {
    const sk = await js(`document.querySelector('.wd-list[data-wd-list="${twd}"] [data-focus]')?.dataset.focus`);
    await js(`document.querySelector('.wd-list[data-wd-list="${twd}"] [data-focus]')?.click()`); await wait(400);
    out('focus tap today', { tapped: sk, focusToday: await js(`__amk.engine.focusToday()`) });
  } else out('focus tap today', 'today is Friday (no focus card)');
  await shot('v450-plan-after');

  /* program page halos */
  await js(`document.querySelector('[data-act="to-plan"]')?.click()`); await wait(1500);
  out('program halos', await js(`[...document.querySelectorAll('.act-card')].map(c=>(c.querySelector('h3')?.textContent||'').trim()+':'+(c.classList.contains('is-focus')?'red':c.classList.contains('is-soft')?'blue':'-')+':'+getComputedStyle(c).boxShadow.slice(0,12))`));
  await shot('v450-program');

  /* multi-voice audio through the bridge */
  out('sim-audio via bridge', await js(`window.amookht && amookht.api ? amookht.api('/sim-audio/91358c395decce12aed7.mp3',{binary:true}).then(r=>({ok:r.ok, bytes: r.ok ? Math.round(r.data.base64.length*0.75) : 0, type: r.ok ? r.data.type : (r.error && r.error.code)})) : 'no bridge name'`));
  out('bad path refused', await js(`window.amookht && amookht.api ? amookht.api('/sim-audio/../x.mp3',{binary:true}).then(r=>r.ok ? 'ALLOWED?!' : r.error.code) : 'n/a'`));

  /* exam simulation */
  await js(`document.querySelector('[data-nav="testdafSim"]')?.click()`); await wait(2000);
  out('exam sim', await js(`({ chooser: !!document.querySelector('.osd-pick'), exam: (__amk.store.get('user')||{}).examPlan || 'testdaf', hook: !!(window.AmkSimScore && AmkSimScore.upload), osdExports: !!(window.AmkOsdSim && AmkOsdSim.results && AmkOsdSim.ex), panel: !!document.querySelector('.ss-panel') })`));
  await shot('v450-sim');

  /* admin cards */
  await js(`document.querySelector('[data-nav="adminUsers"]')?.click()`);
  const cards = await until(`document.querySelectorAll('.adm-ucard').length > 0`, 30000);
  out('admin cards', { shown: cards, n: await js(`document.querySelectorAll('.adm-ucard').length`) });
  await js(`document.querySelector('.adm-ucard')?.click()`); await wait(1200);
  out('admin detail', await js(`({ open: !!document.querySelector('.adm-ud-card'), rows: [...document.querySelectorAll('.adm-ud-row dt')].map(x=>x.textContent), seg: [...document.querySelectorAll('.adm-ud-seg button')].map(b=>b.textContent+(b.classList.contains('is-on')?'*':'')) })`));
  await shot('v450-admin');
  await js(`document.querySelector('[data-adm="udclose"]')?.click()`); await wait(200);
  out('detail closed', await js(`!document.querySelector('.adm-ud-card')`));
  out('vendor scripts', await js(`({ boxScroll: !!window.AmkBoxScroll, wordHl: !!document.querySelector('script[src*="amk-word-hl"]') })`));
  out('console errors', errs.length);
  app.exit(0);
});
