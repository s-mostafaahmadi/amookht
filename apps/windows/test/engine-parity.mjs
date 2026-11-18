// Parity test: the site's real engine (testdaf-method.js) and the native port (src/native/core/engine.js)
// get the same state and lesson pack; their plans must be identical.
//   node test/engine-parity.mjs <site testdaf-method.js> <testdaf-method-content.js> [<site oesd-method.js> <oesd-method-content.js>]
import fs from 'node:fs';
import vm from 'node:vm';

const [sitePath, packPath, osdPath, osdPackPath] = process.argv.slice(2);
let failed = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra).slice(0, 400)));
  if (!ok) failed += 1;
};
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => keyOf(new Date());
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); const x = new Date(y, m - 1, d, 12); x.setDate(x.getDate() + n); return keyOf(x); };

/* ---- browser stubs shared by both engines ---- */
const noop = () => {};
const docStub = { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, appendChild: noop, setAttribute: noop }), head: { appendChild: noop }, documentElement: {}, visibilityState: 'visible', hasFocus: () => true };
globalThis.document = docStub;
globalThis.window = globalThis;
globalThis.addEventListener = noop;
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };

/* ---- the site engine in a sandbox ---- */
const pack = fs.readFileSync(packPath, 'utf8');
function siteEngine(state, osd) {
  const sb = {
    console, Math, Date, JSON, Object, Array, String, Number, Set, Map, Promise, RegExp, Proxy, Reflect, Intl, Error, setTimeout, clearTimeout, setInterval, clearInterval,
    document: docStub, localStorage: globalThis.localStorage, navigator: {}, location: { href: '' }, HTMLMediaElement: undefined,
    S: state, render: noop, saveData: noop, safeText: (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    today: todayKey, timeStr: (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`, examPlanLabel: () => 'Lernplan',
  };
  sb.window = sb; sb.addEventListener = noop; sb.removeEventListener = noop;
  vm.createContext(sb);
  vm.runInContext(pack, sb);
  if (osd) { vm.runInContext(fs.readFileSync(osdPackPath, 'utf8'), sb); vm.runInContext(fs.readFileSync(osdPath, 'utf8'), sb); }
  vm.runInContext(fs.readFileSync(sitePath, 'utf8'), sb);
  return sb;
}

/* ---- the native engine ---- */
const content = (() => { const sb = { window: {} }; sb.window = sb; vm.createContext(sb); vm.runInContext(pack, sb); return sb.TDM_CONTENT; })();
const { createEngine } = await import('../src/native/core/engine.js');
let osdCache = null;
const osdContent = () => { if (!osdCache) { const sb = { window: {} }; sb.window = sb; vm.createContext(sb); vm.runInContext(fs.readFileSync(osdPackPath, 'utf8'), sb); osdCache = sb.OSD_CONTENT; } return osdCache; };
function nativeEngine(state) {
  const data = JSON.parse(JSON.stringify(state));
  const store = {
    get: (k) => data[k], set: (k, v) => { data[k] = v; }, data,
  };
  const eng = createEngine({ store, account: () => ({ role: 'premium' }), loadPack: async (n) => (n === 'oesd' ? osdContent() : content), bridge: { api: async () => ({ ok: true }) } });
  return { eng, data };
}

const LEVELS = ['B1', 'B2', 'C1'];
const DAILY = [60, 120, 240, 300];
const start = todayKey();
const days = Array.from({ length: 9 }, (_, i) => addDays(start, i));

for (const level of LEVELS) {
  for (const daily of DAILY) {
    const base = { user: { examPlan: 'testdaf', level, weakSkills: [] }, testdafMethod: { dailyMin: daily, startDate: start }, errors: [], completedActivities: [], activityTimers: {} };
    const site = siteEngine(JSON.parse(JSON.stringify(base)));
    const { eng } = nativeEngine({ ...JSON.parse(JSON.stringify(base)), completed: [] });
    await eng.ensureContent();
    let same = true;
    const diffs = [];
    for (const k of days) {
      const sd = site.TDM.ensureDay(k);
      const nd = eng.ensureDay(k);
      if (JSON.stringify(sd.picks) !== JSON.stringify(nd.picks)) { same = false; diffs.push({ k, what: 'picks', site: sd.picks, app: nd.picks }); }
      if (JSON.stringify(sd.redemittel) !== JSON.stringify(nd.redemittel)) { same = false; diffs.push({ k, what: 'redemittel' }); }
      const sm = site.TDM.minutesFor(k); const nm = eng.minutesFor(k);
      if (JSON.stringify(sm) !== JSON.stringify(nm)) { same = false; diffs.push({ k, what: 'minutes', site: sm, app: nm }); }
      const sa = site.TDM.buildActivities(null, k).activities; const na = eng.buildActivities(k).activities;
      const strip = (list) => list.map((a) => [a.id, a.title, a.dur, a.desc, a.priority].join('|'));
      if (JSON.stringify(strip(sa)) !== JSON.stringify(strip(na))) { same = false; diffs.push({ k, what: 'activities', site: strip(sa), app: strip(na) }); }
    }
    report(same, `level ${level}, ${daily} min/day: picks, minutes and activities identical over ${days.length} days`, diffs[0]);
  }
}

/* step timing (VOL-TIME): volume estimates and module weights */
{
  const base = { user: { examPlan: 'testdaf', level: 'B2', weakSkills: [] }, testdafMethod: { dailyMin: 240, startDate: start }, errors: [] };
  const site = siteEngine(JSON.parse(JSON.stringify(base)));
  const { eng } = nativeEngine({ ...base, completed: [] });
  await eng.ensureContent();
  const RAW = { hoeren: ['global', 'selektiv', 'analyse', 'erneut', 'zusammenfassung'], lesen: ['ueberblick', 'intensiv', 'aufgaben', 'fehler'], schreiben: ['analyse', 'gliederung', 'schreiben', 'korrektur'], sprechen: ['prep:0', 'speak:0', 'analyse:0', 'repeat:0'], wortschatz: ['alt', 'neu', 'redemittel', 'saetze'], wiederholung: ['woerter', 'grammatik', 'wiedergeben', 'redemittel', 'test'] };
  let same = true; let firstDiff;
  for (const k of days) {
    site.TDM.ensureDay(k); eng.ensureDay(k);
    for (const [id, keys] of Object.entries(RAW)) {
      const sv = JSON.stringify(site.TDM.volNeed(id, 'normal', site.TDM.state().days[k], keys));
      const nv = JSON.stringify(eng.volNeed(id, 'normal', eng.M().days[k], keys));
      const sr = site.TDM.loadRatio(k, id); const nr = eng.loadRatio(k, id);
      if (sv !== nv || sr !== nr) { same = false; firstDiff = firstDiff || { k, id, sv, nv, sr, nr }; }
    }
  }
  report(same, 'step volume estimates and module weights identical', firstDiff);
}

/* history segment shape */
{
  const base = { user: { examPlan: 'testdaf', level: 'B2', weakSkills: [] }, testdafMethod: {}, errors: [], history: [] };
  const { eng, data } = nativeEngine({ ...base, completed: [] });
  await eng.generatePlan();
  const ok = data.plan && data.plan.activities.length >= 4 && Array.isArray(data.history) && data.history[0]?.segments?.[data.plan.id];
  report(!!ok, 'generatePlan writes the plan and today\'s history segment', { acts: data.plan?.activities?.map((a) => a.id), seg: !!ok });
  const sum = data.plan.activities.filter((a) => a.id !== 'extra').reduce((s, a) => s + a.dur, 0);
  report(sum === 240, 'plan minutes add up to the daily time (240)', sum);
  eng.setDaily(120);
  const sum2 = data.plan.activities.filter((a) => a.id !== 'extra').reduce((s, a) => s + a.dur, 0);
  report(sum2 === 120, 'changing the daily time to 120 rescales today\'s plan', { sum2, acts: data.plan.activities.map((a) => a.id + ':' + a.dur) });
  eng.setExtra(30);
  report(data.plan.activities.some((a) => a.id === 'extra' && a.dur === 30) && data.plan.availableMinutes === 150, 'extra time 30 adds the Extra-Lernzeit activity', data.plan.availableMinutes);
}

/* ── ÖSD profile (3e): the site engine with the site's oesd-method.js next to the native port ── */
if (osdPath && osdPackPath) {
  for (const level of ['B2', 'C1']) {
    for (const daily of [120, 180, 240]) {
      const base = { user: { examPlan: 'oesd', level: level === 'C1' ? 'C1' : 'B2', weakSkills: [] }, oesdMethod: { level, dailyMin: daily, startDate: start }, errors: [], completedActivities: [], activityTimers: {} };
      const site = siteEngine(JSON.parse(JSON.stringify(base)), true);
      const { eng } = nativeEngine({ ...JSON.parse(JSON.stringify(base)), completed: [] });
      await eng.ensureContent();
      let same = true; const diffs = [];
      for (const k of days) {
        const sd = site.TDM.ensureDay(k); const nd = eng.ensureDay(k);
        if (JSON.stringify(sd.picks) !== JSON.stringify(nd.picks)) { same = false; diffs.push({ k, what: 'picks', site: sd.picks, app: nd.picks }); }
        if (JSON.stringify(sd.redemittel) !== JSON.stringify(nd.redemittel)) { same = false; diffs.push({ k, what: 'redemittel' }); }
        const sm = site.TDM.minutesFor(k); const nm = eng.minutesFor(k);
        if (JSON.stringify(sm) !== JSON.stringify(nm)) { same = false; diffs.push({ k, what: 'minutes', site: sm, app: nm }); }
        const sa = site.TDM.buildActivities(null, k).activities; const na = eng.buildActivities(k).activities;
        const strip = (list) => list.map((a) => [a.id, a.title, a.dur, a.desc, a.priority].join('|'));
        if (JSON.stringify(strip(sa)) !== JSON.stringify(strip(na))) { same = false; diffs.push({ k, what: 'activities', site: strip(sa), app: strip(na) }); }
        const sv = (x) => JSON.stringify(x.dayDef(k));
        if (sv(site.TDM) !== sv(eng)) { same = false; diffs.push({ k, what: 'dayDef', site: site.TDM.dayDef(k), app: eng.dayDef(k) }); }
      }
      report(same, `ÖSD ${level}, ${daily} min/day: picks (task formats), minutes, activities and weekly rhythm identical over ${days.length} days`, diffs[0]);
      if (level === 'B2' && daily === 240) {
        const picked = days.map((k) => eng.M().days[k].picks.lesen).map((id) => eng.item('lesen', id)?.level);
        report(picked.every((x) => x === 'B2'), 'ÖSD content is filtered to the exam level', picked);
        report(!!eng.S.oesdMethod?.days && !eng.S.testdafMethod?.days, 'ÖSD state lives in oesdMethod, TestDaF state untouched');
      }
    }
  }
  // static method knowledge and wording, in all three languages
  const { createOesd } = await import('../src/native/core/oesd.js');
  const i18n = await import('../src/native/core/i18n.js');
  for (const lg of ['fa', 'de', 'en']) {
    for (const level of ['B2', 'C1']) {
      const st = { user: { examPlan: 'oesd', level }, uiLanguage: lg, oesdMethod: { level } };
      const site = siteEngine(st, true);
      try { i18n.setLang ? i18n.setLang(lg) : null; } catch { /* ignore */ }
      if (typeof i18n.lang === 'function' && i18n.lang() !== lg) { report(true, `language ${lg}: native i18n cannot be switched in Node, skipped`); continue; }
      const P = createOesd(() => st);
      report(JSON.stringify(site.OSD_PROFILE.st()) === JSON.stringify(P.st()), `ÖSD ${level} static method text identical (${lg})`);
      const sample = '<h1>TestDaF Training System</h1><p>Ziel: TDN 4 in allen Teilen</p><p>هدف: حداقل TDN 4 در هر چهار مهارت</p>';
      report(site.OSD_PROFILE.rewrite(sample, 'renderHub') === P.rewrite(sample, 'renderHub'), `ÖSD ${level} wording rewrite identical (${lg})`, P.rewrite(sample, 'renderHub'));
    }
  }
}

process.exit(failed ? 1 : 0);
