'use strict';
/* Pretend to be an installed older version and run electron-updater against the real feed, with logging.
     npx electron test/update-feed-check.js 4.1.1   (cache: %LOCALAPPDATA%\amk-updtest, the real cache is not touched) */
const { app } = require('electron');
const path = require('node:path'); const fs = require('node:fs'); const os = require('node:os');
const ver = process.argv.find((a) => /^\d+\.\d+\.\d+$/.test(a)) || '4.1.1';
app.whenReady().then(async () => {
  const { autoUpdater } = require('electron-updater');
  const { SemVer } = require('semver');
  const cfg = path.join(os.tmpdir(), 'amk-dev-app-update.yml');
  fs.writeFileSync(cfg, 'provider: generic\nurl: https://learn.tah3in.com/downloads/\nchannel: latest\nupdaterCacheDirName: amk-updtest\n');
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.updateConfigPath = cfg;
  autoUpdater.currentVersion = new SemVer(ver);
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = { info: (m) => console.log('INFO', String(m).slice(0, 300)), warn: (m) => console.log('WARN', String(m).slice(0, 300)), error: (m) => console.log('ERROR', String(m).slice(0, 400)), debug: () => {} };
  let last = -10;
  autoUpdater.on('update-available', (i) => console.log('EVENT update-available', i.version));
  autoUpdater.on('update-not-available', (i) => { console.log('EVENT update-not-available', i && i.version); app.exit(0); });
  autoUpdater.on('download-progress', (p) => { if (p.percent - last >= 10) { last = p.percent; console.log('progress', Math.round(p.percent) + '%', Math.round(p.bytesPerSecond / 1024) + ' KB/s'); } });
  autoUpdater.on('update-downloaded', (i) => { console.log('EVENT update-downloaded', i.version, i.downloadedFile); app.exit(0); });
  autoUpdater.on('error', (e) => { console.log('EVENT error', String(e && e.message || e).slice(0, 400)); app.exit(1); });
  console.log('as version', autoUpdater.currentVersion.version);
  autoUpdater.checkForUpdates().catch((e) => console.log('check failed', e.message));
});
