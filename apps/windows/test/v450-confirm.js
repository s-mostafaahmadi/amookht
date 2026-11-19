'use strict';
/* the block confirmation must show above the user window (read-only owner profile copy) */
if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL needs AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron'); const path = require('node:path');
process.argv.push('--native'); require(path.join(__dirname, '..', 'electron', 'main.js'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  const js = (c) => win.webContents.executeJavaScript(c);
  const until = async (c, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await js(c).catch(() => false)) return true; await wait(500); } return false; };
  await until(`!!(window.__amk && __amk.app && __amk.app.account && __amk.app.account.email)`);
  await js(`document.querySelector('[data-nav="adminUsers"]')?.click()`); await until(`document.querySelectorAll('.adm-ucard').length > 1`);
  await js(`[...document.querySelectorAll('.adm-ucard')].find(c=>!/mostafa/i.test(c.textContent))?.click()`); await wait(600);
  await js(`document.querySelector('.adm-ud-foot [data-block]')?.click()`); await wait(600);
  console.log('confirm on top:', await js(`(() => { const m=[...document.querySelectorAll('.adm-modal')].find(x=>!x.classList.contains('adm-ud-shade')); if(!m) return 'no confirm'; const b=m.querySelector('.dialog').getBoundingClientRect(); const el=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2); return m.contains(el); })()`));
  await js(`document.querySelector('[data-adm="cancel"]')?.click()`); await wait(300);
  console.log('back to window after cancel:', await js(`!!document.querySelector('.adm-ud-card') && !document.querySelector('.adm-modal:not(.adm-ud-shade)')`));
  app.exit(0);
});
