'use strict';

/* Live test of «مربی گفتگو» (milestone 5b) on the TEST account only:
     npx electron test/native-coach.js --user-data-dir=<test profile>   (SHOTS=<dir>) */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 300))); if (!ok) failed += 1; };

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning|Autofill|fonts.g/.test(message)) console.log('console:', message.slice(0, 300)); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const fr = (code) => js(`(() => { const d = document.querySelector('#dcoachFrame')?.contentDocument; const w = document.querySelector('#dcoachFrame')?.contentWindow; if (!d) return null; return (${code})(d, w); })()`);
  const untilFr = async (code, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await fr(code).catch(() => null)) return true; await wait(600); } return false; };
  const state = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  const shot = async (name) => { if (!process.env.SHOTS) return; const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG()); };

  let email = '';
  for (let i = 0; i < 30 && !email; i += 1) { email = await js('__amk.app.account && __amk.app.account.email').catch(() => ''); if (!email) await wait(1000); }
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  win.focus(); win.webContents.focus();

  await js(`document.querySelector('[data-nav="deutschCoach"]').click()`);
  report(await untilFr(`(d) => d.querySelectorAll('[data-coach]').length > 0`, 40000), 'coach frontend loads with its coaches (files cached, API proxied)', await fr(`(d) => d.querySelectorAll('[data-coach]').length`));
  report(await fr(`(d) => d.documentElement.classList.contains('embedded')`), 'coach runs in embedded mode (same origin as the app)');
  report(await untilFr(`(d) => d.querySelectorAll('#conversation .message.assistant').length > 0 && !/wird geladen/.test(d.querySelector('#conversation').textContent)`, 40000), 'the coach greets', await fr(`(d) => [...d.querySelectorAll('#conversation .message.assistant .bubble')].pop()?.textContent.slice(0, 120)`));
  await shot('m5-coach');
  const before = await fr(`(d) => d.querySelectorAll('#conversation .message.assistant').length`);
  await fr(`(d, w) => { const t = d.querySelector('#messageInput'); t.value = 'Hallo! Ich habe gestern in der Bibliothek gelernt.'; t.dispatchEvent(new w.Event('input', { bubbles: true })); d.querySelector('#sendBtn').click(); return true; }`);
  report(await untilFr(`(d) => d.querySelectorAll('#conversation .message.assistant').length > ${before} && !d.querySelector('#conversation .typing, #conversation .is-pending')`, 90000), 'the coach answers a message (real AI)', await fr(`(d) => [...d.querySelectorAll('#conversation .message.assistant .bubble')].pop()?.textContent.slice(0, 160)`));
  await shot('m5-coach-answer');
  // a voice from the coach (tts through the proxy, binary)
  const tts = await fr(`(d, w) => w.fetch('api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Guten Tag', speed: 1 }) }).then((r) => r.status + ' ' + r.headers.get('content-type'))`);
  report(/^200 audio\//.test(String(tts)), 'coach voice through the proxy', tts);
  // the coach → app bridge: the coach writes amookht_inbox_v1, the app moves it into «علاقه‌مندی‌ها»
  // (coach mistakes are dropped on purpose by the site's review filter, so the app drops them too)
  const id = 'test-' + Date.now();
  const userId = await js(`__amk.app.account.id`);
  await fr(`(d, w) => { const k = 'amookht_inbox_v1'; const list = JSON.parse(w.localStorage.getItem(k) || '[]'); list.push({ u: ${JSON.stringify(String(userId))}, kind: 'favorite', id: '${id}', ts: Date.now(), data: { id: '${id}', text: 'Das klingt produktiv (' + '${id}' + ').', meta: 'به نظر پربار است.', coach: 'Mila', stars: 2 } }); w.localStorage.setItem(k, JSON.stringify(list)); return true; }`);
  await js(`window.AmkCoachBridge && window.AmkCoachBridge.drain()`);
  let found = null;
  for (let i = 0; i < 20 && !found; i += 1) { found = ((await state()).favorites || []).find((f) => f.sourceId === 'coach:' + id); if (!found) await wait(900); }
  report(!!found && found.rating === 2, 'a phrase starred in the coach lands in «علاقه‌مندی‌ها»', found && { title: found.title, rating: found.rating, topic: found.topic });
  app.exit(failed ? 1 : 0);
});
