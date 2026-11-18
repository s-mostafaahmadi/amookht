'use strict';

/* Live test of «تنظیمات حساب» and the Telegram card on the TEST account only:
     npx electron test/native-account.js --user-data-dir=<test profile>   (SHOTS=<dir>) */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) failed += 1;
};

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const set = (sel, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG());
  };

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const stamp = Date.now().toString(36);
  const exam = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);

  /* Telegram card in app settings */
  await click('[data-nav="appSettings"]');
  await wait(2500);
  report(await js(`/تلگرام|Telegram/.test(document.querySelector('#tgCard')?.textContent || '') && !!document.querySelector('[data-tg="link"]')`), 'Telegram card shows "connect" for an unlinked account');

  /* account settings */
  await js(`document.querySelector('[data-act="account"]').click(); true`);
  await wait(800);
  report(await js(`!!document.querySelector('#aName')`), 'account page opens from app settings');
  await set('#aName', 'Windows App Test ' + stamp);
  const before = ((await state()).user || {}).level;
  const target = before === 'C1' ? 'B2' : 'C1';
  await js(`document.querySelector('#aLevel').value = '${target}'; true`);
  await set('#aMinutes', '150');
  await set('#aGoal', 'TestDaF TDN 4');
  await set('#aExamDate', exam);
  await click('[data-act="save"]');
  await wait(3000);
  let st = await state();
  const u = st.user || {};
  report(u.name === 'Windows App Test ' + stamp && u.dailyMinutes === 150 && u.learningGoal === 'TestDaF TDN 4' && u.examDate === exam && u.profileCompleted === true, 'profile and learning fields saved to the account', { name: u.name, minutes: u.dailyMinutes, exam: u.examDate });
  report(u.level === target && !(st.appSettings || {}).levelNext, 'Premium: level changes at once', { level: u.level, next: (st.appSettings || {}).levelNext });
  const me = (await js(`window.amookht.api('/v1/account/me')`)).data || {};
  report(me.display_name === 'Windows App Test ' + stamp, 'profile mirrored to the account record', me.display_name);
  report(await js(`(document.querySelector('.ok-line')?.textContent || '').includes('${target}')`), 'save message names the new level');

  /* avatar: a generated image through the file input */
  await js(`(async () => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#7c3aed'; g.fillRect(0, 0, 400, 300); g.fillStyle = '#fff'; g.font = '120px sans-serif'; g.fillText('W', 140, 200);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'avatar.png', { type: 'image/png' }));
    const input = document.querySelector('[data-avatar]'); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await wait(3500);
  st = await state();
  report(/^data:image\/jpeg;base64,/.test((st.user || {}).avatarDataUrl || ''), 'avatar saved as a 256 px JPEG data URL', ((st.user || {}).avatarDataUrl || '').length);
  await shot('account');
  await click('[data-act="avatar-remove"]');
  await wait(2500);
  st = await state();
  report(!(st.user || {}).avatarDataUrl, 'avatar removed');

  /* password: local rule check only (nothing is sent for a weak password) */
  await set('#aCurrent', 'x');
  await set('#aNew', 'short');
  await click('[data-act="password"]');
  await wait(400);
  report(await js(`/۸|8/.test(document.querySelector('.ok-line')?.textContent || '')`), 'weak new password is refused before sending');

  /* danger zone arms but is not used */
  await click('[data-act="delete-arm"]');
  await wait(200);
  report(await js(`!!document.querySelector('[data-act="delete-confirm"]')`), 'delete account needs a second confirmation');
  await click('[data-act="delete-cancel"]');

  app.exit(failed ? 1 : 0);
});
