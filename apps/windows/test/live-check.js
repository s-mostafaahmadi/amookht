'use strict';

/* Live check against the real learn.tah3in.com with a SIGNED-IN profile copy:
   npx electron test/live-check.js --user-data-dir="<copy of %APPDATA%Amookht>"
   SCREENS=dashboard,errorbook SHOTS=1 OUT_DIR=<dir> saves screenshots. Prints each page's width/height. */

const { app, BrowserWindow, webContents } = require('electron');
const path = require('node:path'); const fs = require('node:fs');
require(path.join(__dirname, '..', 'electron', 'main.js'));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(11000);
  const win = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().endsWith('app.html'));
  const guest = webContents.getAllWebContents().find(w => w.getType() === 'webview');
  const out = {};
  for (const screen of (process.env.SCREENS || 'dashboard').split(',')) {
    await win.webContents.executeJavaScript(`siteNav(${JSON.stringify(screen)})`);
    await wait(2500);
    out[screen] = await guest.executeJavaScript(`(() => {
      const root = document.querySelector('#app'); const first = root.firstElementChild;
      const kids = [...(first ? first.children : [])].filter(n => n.offsetHeight > 0).map(n => (n.tagName + '.' + String(n.className).split(' ').slice(0,4).join('.')).slice(0,90) + ' h=' + n.offsetHeight + ' w=' + n.offsetWidth);
      return { screen: S.screen, vw: innerWidth, vh: innerHeight, docH: document.documentElement.scrollHeight, firstCls: first && String(first.className).slice(0,160), kids };
    })()`);
    if (process.env.SHOTS) { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join((process.env.OUT_DIR || require('node:os').tmpdir()), 'p-' + screen + '.png'), img.resize({ width: 1000 }).toPNG()); }
  }
  console.log(JSON.stringify(out, null, 1));
  app.exit(0);
});
