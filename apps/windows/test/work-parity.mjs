// Parity test for the lesson logic (3b): the site's engine and the native port answer the same Hören
// and Lesen questions, check and finish; results, logged mistakes, method log and performance records
// must be identical.
//   node test/work-parity.mjs <site testdaf-method.js> <testdaf-method-content.js> <testdaf-daily-plan.html>
import fs from 'node:fs';
import vm from 'node:vm';

const [sitePath, packPath, htmlPath] = process.argv.slice(2);
let failed = 0;
const report = (ok, label, extra) => { console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 500))); if (!ok) failed += 1; };
const pad = (n) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

const noop = () => {};
const docStub = { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, appendChild: noop, setAttribute: noop }), head: { appendChild: noop }, documentElement: {}, visibilityState: 'visible', hasFocus: () => true };
globalThis.document = docStub; globalThis.window = globalThis; globalThis.addEventListener = noop;
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };

const pack = fs.readFileSync(packPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');
// the page's own helpers the engine calls
const grab = (name) => { let i = html.indexOf('function ' + name + '('); if (html.slice(i - 6, i) === 'async ') i -= 6; let d = 0; let k = html.indexOf('{', html.indexOf(')', i)); const s = i; for (; k < html.length; k += 1) { if (html[k] === '{') d += 1; else if (html[k] === '}') { d -= 1; if (!d) break; } } return html.slice(s, k + 1); };
const PAGE_FNS = ['normalizeLearningError', 'learningErrorWorthReview', 'addError', 'rememberLearningError', 'recordAnswerPerformance', 'answerQuestionScore', 'activeLearningTopicKey', 'currentContentTopic', 'vocabularyLexemeKey', 'vocabularyStableId', 'recordVocabularyProgress', 'rememberVocabUnknown'].map(grab).join('\n');

function siteEngine(state) {
  const sb = {
    console, Math, Date, JSON, Object, Array, String, Number, Set, Map, Promise, RegExp, Proxy, Reflect, Intl, Error, setTimeout, clearTimeout, setInterval, clearInterval,
    document: docStub, localStorage: globalThis.localStorage, navigator: { onLine: true }, location: { href: '' }, HTMLMediaElement: undefined,
    S: state, render: noop, saveData: noop, appConfirm: async () => true, completeActivity: (id) => { if (!state.completedActivities.includes(id)) state.completedActivities.push(id); },
    safeText: (v) => String(v ?? ''), today: todayKey, timeStr: (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`, examPlanLabel: () => 'Lernplan', hasPremiumAccess: () => false,
  };
  sb.window = sb; sb.addEventListener = noop; sb.removeEventListener = noop; sb.scrollTo = noop; sb.iconSvg = () => ''; sb.window.innerWidth = 1400;
  vm.createContext(sb);
  vm.runInContext(pack, sb);
  vm.runInContext(PAGE_FNS, sb);
  vm.runInContext(fs.readFileSync(sitePath, 'utf8'), sb);
  return sb;
}
const content = (() => { const sb = { window: {} }; sb.window = sb; vm.createContext(sb); vm.runInContext(pack, sb); return sb.TDM_CONTENT; })();
const { createEngine } = await import('../src/native/core/engine.js');
const { createWork } = await import('../src/native/core/work.js');

const k = todayKey();
const base = () => ({ user: { examPlan: 'testdaf', level: 'B2', weakSkills: [], topic: 'bildung' }, testdafMethod: { dailyMin: 240, startDate: k }, errors: [], answerPerformance: [], history: [], completedActivities: [], activityTimers: {}, activityProgress: {} });

// one shared plan for both
const site = siteEngine(base());
site.TDM.ensureDay(k);
const built = site.TDM.buildActivities(null, k);
site.S.plan = { id: 'plan-parity', date: k, activities: built.activities };
const data = { ...base(), completed: [], plan: JSON.parse(JSON.stringify(site.S.plan)) };
delete data.completedActivities;
const store = { get: (key) => data[key], set: (key, v) => { data[key] = v; }, data };
const eng = createEngine({ store, account: () => ({ role: 'normal', premium: false }), loadPack: async () => content, bridge: { api: async () => ({ ok: false, error: { status: 403 } }) } });
await eng.ensureContent();
eng.ensureDay(k);
const wk = createWork(eng, { bridge: { api: async () => ({ ok: false }) }, account: () => ({ premium: false }) });
const noBase = (p) => { const x = { ...p }; delete x.spBase; return JSON.stringify(x); };
report(noBase(site.TDM.state().days[k].picks) === noBase(eng.M().days[k].picks), 'same day picks on both sides', { site: site.TDM.state().days[k].picks, app: eng.M().days[k].picks });

for (const [id, set] of [['hoeren', 'h'], ['lesen', 'l']]) {
  const a = site.S.plan.activities.find((x) => x.id === id);
  site.S.activeActivity = a;
  site.S.screen = 'methodActivity';
  eng.startActivity(id);
  eng.stopTimers();
  const it = id === 'hoeren' ? content.hoeren.find((x) => x.id === site.TDM.state().days[k].picks.hoeren) : content.lesen.find((x) => x.id === site.TDM.state().days[k].picks.lesen);
  // deterministic answers: right, wrong, right, wrong …, and one left empty
  (it.questions || []).forEach((q, n) => {
    if (n === 2) return;
    let v;
    if (q.type === 'mc' || q.type === 'match') v = n % 2 ? (Number(q.answer) + 1) % q.options.length : Number(q.answer);
    else if (q.type === 'rf') v = n % 2 ? String(!q.answer) : String(q.answer);
    else if (q.type === 'jnt') v = n % 2 ? (q.answer === 'ja' ? 'nein' : 'ja') : q.answer;
    else v = n % 2 ? 'falsch' : String(Array.isArray(q.answer) ? q.answer[0] : q.answer);
    site.TDM.ans(set, q.id, v); wk.setAnswer(set, q.id, v);
  });
  site.TDM.f('summary', 'Der Text zeigt etwas.'); wk.setField('summary', 'Der Text zeigt etwas.');
  site.TDM.f('understanding', '70'); wk.setField('understanding', '70');
  site.TDM.self('g_ok', true); wk.setSelf('g_ok', true);
  await site.TDM.check(set, true); wk.check(set);
  // categorise the first wrong answer, add an unclear sentence with a note
  const wrong = (it.questions || []).find((q, n) => n % 2 === 1);
  if (wrong) { site.TDM.setCat('q:' + wrong.id, 'grammatik'); wk.setCat('q:' + wrong.id, 'grammatik'); }
  site.TDM.addExtraError(-1); wk.addExtraError(-1);
  site.TDM.extraErr(0, 'text', 'Ein schwieriger Satz.'); wk.extraErr(0, 'text', 'Ein schwieriger Satz.');
  site.TDM.extraErr(0, 'note', 'Bedeutung'); wk.extraErr(0, 'note', 'Bedeutung');
  site.TDM.extraErrCat(0, 'wortschatz'); wk.extraErrCat(0, 'wortschatz');
  // same extra-error id on both sides (ids are random)
  const sx = site.TDM.state().days[k].work[id].extraErrors[0]; const nx = eng.M().days[k].work[id].extraErrors[0]; nx.id = sx.id;
  site.TDM.finish(); wk.finish(null);

  const sd = site.TDM.state().days[k]; const nd = eng.M().days[k];
  const strip = (r) => { const x = { ...r }; delete x.at; delete x.seconds; return x; };
  report(JSON.stringify(strip(sd.results[id])) === JSON.stringify(strip(nd.results[id])), `${id}: results identical`, { site: strip(sd.results[id]), app: strip(nd.results[id]) });
  const errs = (list) => list.filter((e) => String(e.sourceKey || '').includes(`:${id}:`)).map((e) => [e.type, e.category, e.question, e.userAnswer, e.correctAnswer, e.explanation, e.context, e.sourceKey].join('|')).sort();
  report(JSON.stringify(errs(site.S.errors)) === JSON.stringify(errs(data.errors || eng.S.errors)), `${id}: logged mistakes identical`, { site: errs(site.S.errors).length, app: errs(eng.S.errors).length });
  const logs = (m) => (m.log || []).map((x) => [x.date, x.skill, x.cat].join('|')).sort();
  report(JSON.stringify(logs(site.TDM.state())) === JSON.stringify(logs(eng.M())), `${id}: method log identical`, { site: logs(site.TDM.state()).length, app: logs(eng.M()).length });
  const perf = (list) => list.filter((x) => x.skill === id).map((x) => [x.key, x.accuracy, x.expectedSeconds].join('|')).sort();
  report(JSON.stringify(perf(site.S.answerPerformance)) === JSON.stringify(perf(eng.S.answerPerformance)), `${id}: performance records identical`, { site: perf(site.S.answerPerformance), app: perf(eng.S.answerPerformance) });
}
/* ── Schreiben and Sprechen (3c) ── */
for (const id of ['schreiben', 'sprechen']) {
  const a = site.S.plan.activities.find((x) => x.id === id);
  if (!a) { report(true, `${id}: not in today's plan, skipped`); continue; }
  site.S.activeActivity = a; site.S.screen = 'methodActivity';
  eng.startActivity(id); eng.stopTimers();
  const both = (fn) => { fn(site.TDM, 'site'); fn(null, 'app'); };
  if (id === 'schreiben') {
    const text = 'Heute wird viel über das Thema diskutiert. Einerseits gibt es viele Vorteile, andererseits auch Nachteile. Meiner Meinung nach ist es wichtig, beide Seiten zu sehen. Deshalb sollte man vorsichtig entscheiden.';
    site.TDM.f('text', text); wk.setField('text', text);
    [['grammatik', 3], ['wortschatz', 4], ['konnektoren', 2], ['struktur', 5], ['aufgabe', 4]].forEach(([k, n]) => { site.TDM.rate('k_' + k, n); wk.setRate('k_' + k, n); });
    [['fp_wrong_0', 'wegen dem Regen'], ['fp_right_0', 'wegen des Regens'], ['fp_why_0', 'wegen + Genitiv'], ['fp_wrong_1', 'ich habe gegeht'], ['fp_right_1', 'ich bin gegangen']].forEach(([k, v]) => { site.TDM.f(k, v); wk.setField(k, v); });
    site.TDM.setCat('fp_1', 'grammatik'); wk.setCat('fp_1', 'grammatik');
  } else {
    const n = Math.max(1, (site.TDM.state().days[k].picks.sprechen || []).length);
    for (let t = 0; t < n; t += 1) {
      site.TDM.self(`sp:${t}:pausen`, true); wk.setSelf(`sp:${t}:pausen`, true);
      site.TDM.self(`sp:${t}:verbposition`, true); wk.setSelf(`sp:${t}:verbposition`, true);
      site.TDM.self(`sp:${t}:fortsetzung`, false); wk.setSelf(`sp:${t}:fortsetzung`, false);
      site.TDM.f('an_note_' + t, 'Statt „weil ich habe“ besser: „weil ich … habe“'); wk.setField('an_note_' + t, 'Statt „weil ich habe“ besser: „weil ich … habe“');
      [['fluss', 3], ['genau', 2], ['struktur', 4], ['aufgabe', 3]].forEach(([kk, v]) => { site.TDM.rate(`s${t}_${kk}`, v); wk.setRate(`s${t}_${kk}`, v); });
    }
    // one (local) recording on both sides, same shape
    site.TDM.state().days[k].work.sprechen.rec.try1_0 = { local: true, secs: 30, at: 'x' }; eng.M().days[k].work.sprechen.rec.try1_0 = { local: true, secs: 30, at: 'x' };
  }
  void both;
  site.TDM.finish(); wk.finish(null);
  const sd = site.TDM.state().days[k]; const nd = eng.M().days[k];
  const strip = (r) => { const x = { ...r }; delete x.at; delete x.seconds; return x; };
  report(JSON.stringify(strip(sd.results[id])) === JSON.stringify(strip(nd.results[id])), `${id}: results identical`, { site: strip(sd.results[id]), app: strip(nd.results[id]) });
  const errs = (list) => list.filter((e) => String(e.sourceKey || '').includes(`:${id}:`)).map((e) => [e.type, e.category, e.question, e.userAnswer, e.correctAnswer, e.explanation, e.sourceKey].join('|')).sort();
  report(JSON.stringify(errs(site.S.errors)) === JSON.stringify(errs(eng.S.errors)), `${id}: logged mistakes identical`, { site: errs(site.S.errors), app: errs(eng.S.errors) });
  const logs = (m) => (m.log || []).map((x) => [x.date, x.skill, x.cat].join('|')).sort();
  report(JSON.stringify(logs(site.TDM.state())) === JSON.stringify(logs(eng.M())), `${id}: method log identical`, { site: logs(site.TDM.state()).length, app: logs(eng.M()).length });
  const perf = (list) => list.filter((x) => x.skill === id).map((x) => [x.key, x.accuracy, x.expectedSeconds, x.actualSeconds].join('|')).sort();
  report(JSON.stringify(perf(site.S.answerPerformance)) === JSON.stringify(perf(eng.S.answerPerformance)), `${id}: performance record identical`, { site: perf(site.S.answerPerformance), app: perf(eng.S.answerPerformance) });
}

/* ── Wortschatz, Wiederholung, weekly metrics (3d) ── */
{
  const { createReview } = await import('../src/native/core/review.js');
  const rv = createReview(eng, wk);
  const open = (id, step) => { const a = site.S.plan.activities.find((x) => x.id === id); if (!a) return false; site.S.activeActivity = a; site.S.screen = 'methodActivity'; eng.startActivity(id); eng.stopTimers(); site.TDM.go(step); eng.go(step); try { site.TDM.renderActivity(); } catch (e) { report(false, `${id}: site render step ${step}`, String(e)); } return true; };
  const srsView = (m) => JSON.stringify(Object.values(m.srs).map((x) => [x.key, x.type, x.stage, x.due, x.reps, x.lapses, JSON.stringify(x.data)]).sort());
  const wp = (st) => JSON.stringify(Object.values(st.wordProgress || {}).map((x) => [x.key, x.wordId, x.lexeme, x.topicKey, x.word, x.source, x.reviewCount, x.lastRating, x.knownCount]).sort());
  if (open('wortschatz', 1)) {
    rv.wortschatzEnter('neu', eng.curDay());
    site.TDM.go(2); eng.go(2); site.TDM.renderActivity(); rv.wortschatzEnter('redemittel', eng.curDay());
    report(srsView(site.TDM.state()) === srsView(eng.M()), 'wortschatz: new words + Redemittel enter the deck identically', { site: Object.keys(site.TDM.state().srs).length, app: Object.keys(eng.M().srs).length });
    report(wp(site.S) === wp(eng.S), 'wortschatz: site word progress registered identically', { site: Object.keys(site.S.wordProgress || {}).length, app: Object.keys(eng.S.wordProgress || {}).length });
    ['Ich treffe eine Entscheidung.', 'Das steht zur Verfügung.'].forEach((v, n) => { site.TDM.f('satz_' + n, v); wk.setField('satz_' + n, v); });
    site.TDM.finish(); wk.finish(null);
    const strip = (r) => { const x = { ...r }; delete x.at; delete x.seconds; return x; };
    report(JSON.stringify(strip(site.TDM.state().days[k].results.wortschatz)) === JSON.stringify(strip(eng.M().days[k].results.wortschatz)), 'wortschatz: results identical', { site: site.TDM.state().days[k].results.wortschatz, app: eng.M().days[k].results.wortschatz });
  } else report(true, 'wortschatz: not in today\'s plan, skipped');
  if (open('wiederholung', 0)) {
    // make every card due today on both sides, then enter the step again
    Object.values(site.TDM.state().srs).forEach((x) => { x.due = k; }); Object.values(eng.M().srs).forEach((x) => { x.due = k; });
    delete site.TDM.state().days[k].work.wiederholung.dueW; delete eng.M().days[k].work.wiederholung.dueW;
    site.TDM.renderActivity(); rv.wiederholungEnter('woerter', eng.curDay());
    const sw = site.TDM.state().days[k].work.wiederholung.dueW || []; const nw = eng.M().days[k].work.wiederholung.dueW || [];
    report(JSON.stringify(sw) === JSON.stringify(nw) && sw.length > 0, 'wiederholung: same due word list', { site: sw.length, app: nw.length });
    sw.slice(0, 3).forEach((key, n) => { site.TDM.srsCard(key, n !== 1); rv.srsCard(key, n !== 1); });
    report(srsView(site.TDM.state()) === srsView(eng.M()), 'wiederholung: SRS ratings identical');
    report(wp(site.S) === wp(eng.S), 'wiederholung: word progress identical');
    const vErr = (list) => list.filter((e) => String(e.sourceKey || '').startsWith('tdm:vocab:')).map((e) => [e.category, e.userAnswer, e.correctAnswer, e.explanation, e.context].join('|')).sort();
    report(JSON.stringify(vErr(site.S.errors)) === JSON.stringify(vErr(eng.S.errors)) && vErr(eng.S.errors).length === 1, '"Nicht gewusst" mistake logged identically', { site: vErr(site.S.errors), app: vErr(eng.S.errors) });
    // same quiz on both sides (questions are random)
    eng.go(4); site.TDM.go(4); site.TDM.renderActivity(); rv.wiederholungEnter('test', eng.curDay());
    const q = JSON.parse(JSON.stringify(site.TDM.state().days[k].work.wiederholung.quiz)); eng.M().days[k].work.wiederholung.quiz = q;
    q.qs.forEach((x, n) => { const v = n % 2 ? (x.answer + 1) % x.options.length : x.answer; site.TDM.quizAns(n, v); rv.quizAns(n, v); });
    site.TDM.quizDone(); rv.quizDone();
    report(site.TDM.state().days[k].work.wiederholung.quiz.pct === eng.M().days[k].work.wiederholung.quiz.pct, 'wiederholung: quiz score identical', { site: site.TDM.state().days[k].work.wiederholung.quiz.pct, app: eng.M().days[k].work.wiederholung.quiz.pct });
    const perf = (list) => list.filter((x) => x.skill === 'wiederholung' || x.skill === 'wortschatz').map((x) => [x.skill, x.accuracy, x.expectedSeconds].join('|')).sort();
    report(JSON.stringify(perf(site.S.answerPerformance)) === JSON.stringify(perf(eng.S.answerPerformance)), 'review performance records identical', { site: perf(site.S.answerPerformance).length, app: perf(eng.S.answerPerformance).length });
  } else report(true, 'wiederholung: not in today\'s plan, skipped');
  const wkNo = eng.curDay().week;
  const mt = (x) => { const y = { ...x }; delete y.cats; return JSON.stringify(y) + JSON.stringify(x.cats); };
  report(mt(site.TDM.weekMetrics(wkNo)) === mt(rv.weekMetrics(wkNo)), 'weekly metrics identical', { site: site.TDM.weekMetrics(wkNo), app: rv.weekMetrics(wkNo) });
}

/* ── render smoke: every step of the five review screens draws without errors (3d) ── */
{
  const { makeReviewModules } = await import('../src/native/pages/modules/review-modules.js');
  const { makeKit } = await import('../src/native/pages/modules/kit.js');
  const { createReview } = await import('../src/native/core/review.js');
  const stub = new Proxy({}, { get: () => new Proxy(() => '', { get: () => () => false, apply: () => '' }) });
  const env = { eng, wk, media: stub, ctx: { store: { data } }, favCache: new Map() };
  env.kit = makeKit(env); env.rv = createReview(eng, wk);
  const R = makeReviewModules(env);
  for (const id of ['wortschatz', 'wiederholung', 'fehleranalyse', 'wochenbericht', 'extra']) {
    if (!eng.S.plan.activities.find((x) => x.id === id)) eng.S.plan.activities.push({ id, type: 'method', title: id, dur: 30, icon: 'brain' });
    eng.startActivity(id); eng.stopTimers();
    const d = eng.curDay(); const mode = ['fehleranalyse', 'wochenbericht'].includes(id) ? 'eval' : d.mode;
    const steps = eng.stepsFor(id, mode, d); const bad = [];
    for (let i = 0; i < steps.length; i += 1) {
      eng.go(i);
      try { const out = R[id](eng.act(), d, eng.work(id), steps, i); if (!out || typeof out.body !== 'string' || out.body.length < 80 || /undefined|\[object Object\]|NaN/.test(out.body.replace(/data-[a-z-]+="[^"]*"/g, ''))) bad.push([steps[i].key, (out?.body || '').slice(0, 160)]); } catch (e) { bad.push([steps[i].key, String(e && e.stack || e).slice(0, 300)]); }
    }
    report(!bad.length, `${id}: all ${steps.length} steps render`, bad.length ? bad : undefined);
  }
}

eng.stopTimers();
/* ── free-study plan (milestone 4): site buildPersonalizedActivities vs the native free-tab plan ── */
{
  const defs = html.slice(html.indexOf('const PLAN_ACTIVITY_DEFS='), html.indexOf('];', html.indexOf('const PLAN_ACTIVITY_DEFS=')) + 2);
  const fns = ['normalizeDailyMinutes', 'activityIsWeak', 'questionTargetFor', 'buildPersonalizedActivities', 'amkPlanName'].map(grab).join('\n');
  let same = true; let first;
  for (const weak of [[], ['lesen'], ['speaking', 'grammatik']]) {
    for (const minutes of [60, 120, 180, 240, 300, 480]) {
      const st = { user: { examPlan: 'testdaf', weakSkills: weak, dailyMinutes: minutes, profileCompleted: true }, uiLanguage: 'fa' };
      const sb = { S: st, Math, Number, String, Object, Array, JSON }; vm.createContext(sb);
      vm.runInContext(defs.replace('const PLAN_ACTIVITY_DEFS', 'var PLAN_ACTIVITY_DEFS') + '\n' + fns, sb);
      const siteOut = sb.buildPersonalizedActivities(minutes, 'TestDaF');
      const d2 = { user: JSON.parse(JSON.stringify(st.user)), studyMode: 'free', studyModeDate: k, dailyStudyDate: k, dailyStudyMinutes: minutes, completed: [], testdafMethod: {} };
      const st2 = { get: (key) => d2[key], set: (key, v) => { d2[key] = v; }, data: d2 };
      const e2 = createEngine({ store: st2, account: () => ({ role: 'normal', premium: false }), loadPack: async () => content, bridge: { api: async () => ({ ok: false }) } });
      await e2.generatePlan(); e2.stopTimers();
      const strip = (list) => list.map((a) => [a.id, a.dur, a.questionTarget, a.type, a.priority, a.desc.replace(/^[^·]*·/, '')].join('|'));
      if (JSON.stringify(strip(siteOut.activities)) !== JSON.stringify(strip(d2.plan.activities)) || siteOut.availableMinutes !== d2.plan.availableMinutes) { same = false; first = first || { weak, minutes, site: strip(siteOut.activities), app: strip(d2.plan.activities) }; }
    }
  }
  report(same, 'free-study plan: same activities, minutes, task counts and priorities as the site (18 cases)', first);
}

/* ── owner day file (milestone 6): the site's TDM.dayFileSnapshot vs the native port ── */
{
  const { dayFileSnapshot } = await import('../src/native/core/owner-files.js');
  const norm = (x) => JSON.stringify(x, (key, v) => (['createdAt', 'at', 'seconds'].includes(key) ? undefined : v));
  const a = norm(site.TDM.dayFileSnapshot(k)); const b = norm(dayFileSnapshot(eng, k));
  const at = [...a].findIndex((c, i) => c !== b[i]); report(a === b && a.length > 1000, 'owner day file snapshot identical to the site', { site: a.length, app: b.length, s: a.slice(Math.max(0, at - 60), at + 120), n: b.slice(Math.max(0, at - 60), at + 120) });
}

process.exit(failed ? 1 : 0);
