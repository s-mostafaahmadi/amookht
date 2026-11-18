'use strict';

/* Live test of the native personal pages on the TEST account only:
     node test/make-test-profile.js <dir>
     npx electron test/native-pages.js --user-data-dir=<dir>      (SHOTS=<dir> saves screenshots)
   Drives the real UI (clicks and typing), then reads the account state back from the server. */

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
  const type = (sel, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  const server = async () => (await js(`window.amookht.api('/v1/account/state')`)).data.state_data;
  // poll the server until a condition holds (max 10 s), then return the state
  const until = async (ok, ms = 10000) => {
    const end = Date.now() + ms;
    let s = await server();
    while (!ok(s) && Date.now() < end) { await wait(500); s = await server(); }
    return s;
  };
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG());
  };

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const stamp = Date.now().toString(36);
  const word = 'Prüfwort' + stamp;

  /* ── notebook: plan deck ── */
  await click('[data-nav="errorbook"]');
  await wait(500);
  report(await js(`document.querySelector('[data-tab="deck"]').classList.contains('is-on')`), 'notebook opens on the plan deck tab');
  await click('[data-act="deck-add"]');
  await wait(200);
  await js(`document.querySelector('#nArt').value = 'das'`);
  await type('#nWord', word);
  await type('#nMean', 'واژه آزمایشی');
  await type('#nEx', 'Das ' + word + ' ist nur ein Test.');
  await click('[data-act="deck-save"]');
  await wait(2200);
  let st = await server();
  const srs = Object.values((st.testdafMethod || {}).srs || {});
  const card = srs.find((x) => x.data && x.data.wort === word);
  report(!!card && card.data.artikel === 'das' && card.data.custom === true, 'own word saved into the plan deck', card && card.data);
  report(!!card && card.due === card.added, 'own word is due today', card && { added: card.added, due: card.due });
  report(Object.keys(st.wordProgress || {}).some((k) => k.endsWith(word.toLowerCase())), 'word registered in word progress');
  report(await js(`document.querySelector('#deckMsg').textContent.includes(${JSON.stringify(word)})`), 'confirmation message shown');
  await shot('deck');

  // star it → favourites
  await js(`document.querySelector('.vc[data-q*="${word.toLowerCase()}"] [data-fav-rate="2"]').click()`);
  st = await until((s) => (s.favorites || []).some((f) => f.title === 'das ' + word));
  const fav =(st.favorites || []).find((f) => f.title === 'das ' + word);
  report(!!fav && fav.rating === 2 && fav.kind === 'vocabulary', 'two stars save the card to favourites', fav && { rating: fav.rating, kind: fav.kind });

  // review: didn't know
  await click('[data-act="deck-review"]');
  await wait(300);
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))`);
  await wait(200);
  report(await js(`!!document.querySelector('[data-deck-rate="0"]')`), 'Space reveals the card');
  await shot('deck-review');
  // rate whichever card is shown (older test words may be due too)
  const shownKey = await js(`document.querySelector('[data-deck-rate="0"]').dataset.key`);
  const shownBefore = st.testdafMethod.srs[shownKey] || {};
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))`);
  st = await until((s) => (s.testdafMethod.srs[shownKey] || {}).lapses === (Number(shownBefore.lapses) || 0) + 1);
  const rated = st.testdafMethod.srs[shownKey];
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tk = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  report(rated.stage === 0 && rated.due === tk, '"didn’t know" → stage 0, due tomorrow', { stage: rated.stage, lapses: rated.lapses, due: rated.due });
  const shownWord = `${rated.data.artikel ? rated.data.artikel + ' ' : ''}${rated.data.wort}`;
  st = await until((s) => (s.errors || []).some((e) => e.userAnswer === shownWord));
  const nicht = (st.errors || []).find((e) => e.userAnswer === shownWord);
  report(!!nicht && nicht.category === 'Nicht gewusst', '"didn’t know" adds the word to the mistakes', nicht && nicht.category);
  await click('[data-act="deck-review-off"]');

  /* ── notebook: mistakes ── */
  await click('[data-tab="mistakes"]');
  await wait(300);
  await click('[data-act="manual-open"]');
  await wait(200);
  await js(`document.querySelector('#mKind').value = 'grammar'`);
  await type('#mQuestion', 'Test ' + stamp + ': wegen + ?');
  await type('#mCorrect', 'wegen + Genitiv');
  await type('#mNote', 'Präposition mit Genitiv');
  await click('[data-act="manual-save"]');
  st = await until((s) => (s.errors || []).some((e) => e.question === 'Test ' + stamp + ': wegen + ?'));
  const manual = (st.errors || []).find((e) => e.question === 'Test ' + stamp + ': wegen + ?');
  report(!!manual && manual.source === 'manual' && manual.nextReview, 'own mistake card saved', manual && { type: manual.type, next: manual.nextReview });
  await click('[data-err-filter="grammar"]');
  await wait(200);
  await shot('mistakes');
  await click(`[data-review="${manual.id}"]`);
  await wait(200);
  await type('#reviewAttempt', 'wegen + Dativ');
  await click('[data-act="reveal"]');
  await wait(200);
  report(await js(`document.querySelectorAll('.ratings button').length === 4`), 'review shows Again/Hard/Good/Easy');
  await shot('mistake-review');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }))`);
  st = await until((s) => ((s.errors || []).find((e) => e.id === manual.id)?.history || []).length === 1);
  const reviewed = st.errors.find((e) => e.id === manual.id);
  report(reviewed.intervalDays === 1 && reviewed.history.length === 1 && reviewed.history[0].rating === 2, '"Good" on a new card → 1 day, history saved', { interval: reviewed.intervalDays, history: reviewed.history.length });

  /* ── favourites ── */
  await click('[data-nav="favorites"]');
  await wait(400);
  await click('[data-act="new"]');
  await wait(200);
  await js(`document.querySelector('#fKind').value = 'structure'`);
  await type('#fTitle', 'in Betracht ziehen ' + stamp);
  await type('#fAnswer', 'در نظر گرفتن');
  await js(`document.querySelector('#fRating').value = '3'`);
  await js(`document.querySelector('#favForm').requestSubmit()`);
  await wait(2000);
  st = await server();
  const own = (st.favorites || []).find((f) => f.title === 'in Betracht ziehen ' + stamp);
  report(!!own && own.manual && own.rating === 3 && own.kind === 'structure', 'personal favourite card saved', own && { rating: own.rating, kind: own.kind });
  await click('[data-filter="star-3"]');
  await wait(200);
  report(await js(`[...document.querySelectorAll('.fav-card')].every((c) => c.querySelectorAll('.star.is-on').length === 3)`), '3-star filter shows only 3-star cards');
  await click('[data-filter="all"]');
  await wait(200);
  await type('[data-search]', stamp);
  await wait(100);
  report(await js(`[...document.querySelectorAll('.fav-card')].filter((c) => !c.hidden).length >= 1`), 'search finds the card');
  await shot('favorites');
  await click(`.fav-card:not([hidden]) [data-del="${own.id}"]`);
  await wait(2000);
  st = await server();
  report(!(st.favorites || []).some((f) => f.id === own.id), '× deletes the favourite');

  /* ── history ── */
  await click('[data-nav="history"]');
  await wait(600);
  report(await js(`!!document.querySelector('.hx-kpis') && !!document.querySelector('[data-period]')`), 'history page renders KPIs and the period picker');
  const period = await js(`document.querySelector('[data-period]').value`) === 'month' ? 'week' : 'month';
  await js(`(() => { const s = document.querySelector('[data-period]'); s.value = '${period}'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await wait(300);
  await click('[data-tab="free"]'); // weekly goals live on the free-study tab (absent when there is no plan)
  await wait(300);
  const goal = await js(`document.querySelector('[data-target="lesen"]').value`) === '30' ? '45' : '30';
  await js(`(() => { const s = document.querySelector('[data-target="lesen"]'); s.value = '${goal}'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await wait(2000);
  st = await server();
  report(st.historyFilter === period && String((st.skillTargets || {}).lesen) === goal, 'period and weekly goal saved', { period: st.historyFilter, lesen: (st.skillTargets || {}).lesen });
  await shot('history');

  report(await js(`__amk.store.status.status === 'synced'`), 'everything synced', await js('__amk.store.status'));
  app.exit(failed ? 1 : 0);
});
