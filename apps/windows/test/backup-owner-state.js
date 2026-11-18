'use strict';
/* Read-only: saves the signed-in account's state (as the server has it) to %APPDATA%\Amookht\backups.
     AMOOKHT_READONLY=1 npx electron test/backup-owner-state.js --user-data-dir=<profile copy> */
if (process.env.AMOOKHT_READONLY !== '1') { console.log('FAIL needs AMOOKHT_READONLY=1'); process.exit(1); }
const { app, BrowserWindow } = require('electron'); const path = require('node:path'); const fs = require('node:fs');
process.argv.push('--native'); require(path.join(__dirname, '..', 'electron', 'main.js'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
app.whenReady().then(async () => {
  await wait(8000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  const js = (c) => win.webContents.executeJavaScript(c);
  const r = await js(`Promise.all([window.amookht.api('/v1/account/state'), window.amookht.api('/v1/account/me')])`);
  if (!r[0].ok) { console.log('FAIL state', JSON.stringify(r[0].error)); app.exit(1); return; }
  const dir = path.join(process.env.APPDATA, 'Amookht', 'backups'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `account-state-before-v4-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify({ savedAt: new Date().toISOString(), me: r[1].data, state: r[0].data }, null, 1));
  console.log('SAVED', file, 'version', r[0].data.version, 'keys', Object.keys(r[0].data.state_data || {}).length, 'role', r[1].data && r[1].data.access_role);
  app.exit(0);
});
