// Plan engine core — hand port of the site's TDM engine (testdaf-method.js) and the plan lifecycle
// of the site page (generatePlan, startActivity, completeActivity, history segments, renew, study-mode
// tabs). It works on a long-lived draft of the account state (the site's `S`) and saves changed
// top-level keys through the store, exactly like the site's saveData + sync layer.
// Milestone 3a: calendar, daily time, levels, picks, activities, steps, lifecycle, timers.
// Module bodies (Hören, Lesen, …) arrive in 3b–3d; ÖSD (the site's PROG profile) in 3e.

import { lang } from './i18n.js';
import { createOesd } from './oesd.js';
import { today as todayKey, keyOf, parseKey, addDays, clone } from './learning.js';
import { upsertSegment, historyNumber, historyOptionalNumber } from './history-data.js';
import { credit } from './active-time.js';
import { TDM_STATIC, STATIC_COPY } from '../data/method-static.js';
import { TOPIC_TREE, EXAM_PLANS } from '../data/topics.js';

/* ───────────── constants (identical to the site) ───────────── */
export const BASE = 240;
export const DEFAULT_DAILY = 120; // DAILY-120 (site 2026-11-20): default daily plan time; BASE stays the content scale
export const SRS_STEPS = [1, 3, 7, 14, 30];
export const DAILY_CHOICES = [60, 90, 120, 150, 180, 240, 300];
export const EXTRA_CHOICES = [0, 15, 30, 45, 60];
export const DAILY_RENEW_LIMIT = 3;
export const MODS = {
  hoeren: { icon: 'headphones', de: 'Hören', fa: 'شنیدن', color: '#a855f7' },
  lesen: { icon: 'document-text', de: 'Lesen', fa: 'خواندن', color: '#0ea5e9' },
  schreiben: { icon: 'pencil-square', de: 'Schreiben', fa: 'نوشتن', color: '#f59e0b' },
  sprechen: { icon: 'microphone', de: 'Sprechen', fa: 'صحبت‌کردن', color: '#f43f5e' },
  wortschatz: { icon: 'language', de: 'Grammatik & Wortschatz', fa: 'گرامر و واژگان', color: '#10b981' },
  wiederholung: { icon: 'brain', de: 'Wiederholung', fa: 'مرور فعال', color: '#6366f1' },
  fehleranalyse: { icon: 'clipboard-check', de: 'Fehleranalyse', fa: 'تحلیل اشتباهات', color: '#ef4444' },
  wochenbericht: { icon: 'clipboard-check', de: 'Wochenbericht', fa: 'گزارش هفتگی', color: '#14b8a6' },
  extra: { icon: 'brain', de: 'Extra-Lernzeit', fa: 'زمان اضافه یادگیری', color: '#0d9488' },
};
const SPRECHEN_ORDER = ['rat_geben', 'optionen_abwaegen', 'text_zusammenfassen', 'informationen_abgleichen', 'thema_praesentieren', 'argumente_wiedergeben', 'massnahmen_kritisieren'];
export const DAY_DEF = {
  6: { key: 'sa', fa: 'شنبه', de: 'Samstag', focus: ['hoeren', 'lesen'], sfa: 'تحلیل فایل صوتی و متن', sde: 'Audio- und Textanalyse', schreiben: 'argumentation', sprechen: 1 },
  0: { key: 'so', fa: 'یکشنبه', de: 'Sonntag', focus: ['hoeren', 'schreiben'], sfa: 'Argumentation', sde: 'Argumentation', schreiben: 'argumentation', sprechen: 1 },
  1: { key: 'mo', fa: 'دوشنبه', de: 'Montag', focus: ['hoeren', 'sprechen'], sfa: 'بازگویی و ارائه', sde: 'Wiedergeben und Präsentieren', schreiben: 'argumentation', sprechen: ['text_zusammenfassen', 'thema_praesentieren'] },
  2: { key: 'di', fa: 'سه‌شنبه', de: 'Dienstag', focus: ['lesen', 'schreiben'], sfa: 'Grafikbeschreibung', sde: 'Grafikbeschreibung', schreiben: 'grafik', sprechen: 1 },
  3: { key: 'mi', fa: 'چهارشنبه', de: 'Mittwoch', focus: ['hoeren', 'sprechen'], sfa: 'انواع سؤالات شفاهی', sde: 'Sprechaufgaben-Typen', schreiben: 'argumentation', sprechen: 3 },
  4: { key: 'do', fa: 'پنجشنبه', de: 'Donnerstag', focus: ['hoeren', 'lesen', 'schreiben', 'sprechen'], sfa: 'تمرین زمان‌دار آزمون', sde: 'Prüfungstraining mit Zeit', schreiben: 'auto', sprechen: 3, exam: true },
  5: { key: 'fr', fa: 'جمعه', de: 'Freitag', focus: [], sfa: 'ارزیابی، تحلیل اشتباهات و مرور', sde: 'Bewertung, Fehleranalyse, Wiederholung', schreiben: 'argumentation', sprechen: 3, evaluation: true },
};
const BASE_MIN = { normal: { hoeren: 60, lesen: 45, schreiben: 50, sprechen: 35, wortschatz: 25, wiederholung: 25 }, exam: { hoeren: 60, lesen: 45, schreiben: 50, sprechen: 35, wortschatz: 25, wiederholung: 25 }, eval: { hoeren: 40, lesen: 45, schreiben: 50, sprechen: 35, fehleranalyse: 40, wochenbericht: 30 } };
const FOCUS_MIN = {
  6: { hoeren: 70, lesen: 60, schreiben: 40, sprechen: 30, wortschatz: 20, wiederholung: 20 },
  0: { hoeren: 70, lesen: 35, schreiben: 65, sprechen: 30, wortschatz: 20, wiederholung: 20 },
  1: { hoeren: 70, lesen: 35, schreiben: 40, sprechen: 55, wortschatz: 20, wiederholung: 20 },
  2: { hoeren: 50, lesen: 60, schreiben: 65, sprechen: 25, wortschatz: 20, wiederholung: 20 },
  3: { hoeren: 70, lesen: 35, schreiben: 40, sprechen: 55, wortschatz: 20, wiederholung: 20 },
};
export const STEP_TABLES = {
  hoeren: { normal: [['global', 'Globales Hören', 'شنیدن کلی', 5], ['selektiv', 'Selektives Hören', 'شنیدن انتخابی + سؤالات', 10], ['analyse', 'Transkription und Analyse', 'متن و تحلیل اشتباهات', 15], ['erneut', 'Erneutes Hören', 'شنیدن دوباره بدون متن', 10], ['zusammenfassung', 'Zusammenfassung', 'بازگویی شفاهی و ضبط', 20]], exam: [['pruefung', 'Prüfung', 'آزمون زمان‌دار (حداکثر ۲ بار پخش)', 25], ['analyse', 'Auswertung und Transkript', 'تحلیل با متن', 20], ['zusammenfassung', 'Zusammenfassung', 'بازگویی شفاهی', 15]], eval: [['pruefung', 'Hören-Test', 'آزمون هفتگی (حداکثر ۲ بار پخش)', 25], ['analyse', 'Auswertung', 'تحلیل اشتباهات', 15]] },
  lesen: { normal: [['ueberblick', 'Überblick', 'نگاه کلی و پیش‌بینی', 5], ['intensiv', 'Intensives Lesen', 'خواندن دقیق و ایده هر پاراگراف', 15], ['aufgaben', 'Aufgaben lösen', 'حل سؤالات با شواهد متن', 15], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات و خلاصه', 10]], exam: [['pruefung', 'Prüfung', 'آزمون زمان‌دار', 30], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات و خلاصه', 15]], eval: [['pruefung', 'Lesen-Test', 'آزمون هفتگی', 30], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات', 15]] },
  arg: { normal: [['analyse', 'Analyse', 'تحلیل موضوع', 5], ['gliederung', 'Gliederung', 'طرح متن', 5], ['schreiben', 'Schreiben', 'نوشتن متن', 25], ['korrektur', 'Korrektur & Fehlerprotokoll', 'تصحیح هوشمند، مقایسه با متن نمونه', 15]], exam: [['schreiben', 'Schreiben (Prüfung)', 'نوشتن زمان‌دار', 40], ['korrektur', 'Korrektur & Fehlerprotokoll', 'تصحیح هوشمند و ثبت اشتباه', 10]] },
  grafik: { normal: [['analyse', 'Grafik analysieren', 'تحلیل نمودار و متن', 10], ['schreiben', 'Zusammenfassung schreiben', 'نوشتن خلاصه ۱۰۰ تا ۱۵۰ کلمه', 25], ['korrektur', 'Korrektur & Fehlerprotokoll', 'تصحیح هوشمند، مقایسه با متن نمونه', 15]], exam: [['schreiben', 'Grafik (Prüfung)', 'نوشتن زمان‌دار', 40], ['korrektur', 'Korrektur & Fehlerprotokoll', 'تصحیح هوشمند و ثبت اشتباه', 10]] },
  wortschatz: [['alt', 'Wörter wiederholen', 'مرور لغات قبلی', 5], ['neu', '5 neue Wörter', 'پنج لغت جدید', 10], ['redemittel', '5 Redemittel', 'پنج عبارت کاربردی', 5], ['saetze', 'Satzbildung', 'جمله‌سازی + گرامر هفته', 5]],
  wiederholung: [['woerter', 'Wörter von gestern', 'لغات روز قبل', 5], ['grammatik', 'Fehler wiederholen', 'مرور اشتباهات گرامری', 5], ['wiedergeben', 'Inhalte wiedergeben', 'بازگویی محتوای روز قبل', 5], ['redemittel', 'Redemittel', 'مرور Redemittel', 5], ['test', 'Selbsttest', 'آزمون از خود بدون جزوه', 5]],
  fehleranalyse: [['woche', 'Fehler der Woche', 'اشتباهات این هفته', 15], ['wiederholung', 'Wiederholung', 'مرور موارد سررسید', 15], ['vergleich', 'Vergleich', 'مقایسه با هفته قبل و سه ضعف', 10]],
  wochenbericht: [['bericht', 'Wochenbericht', 'گزارش هفتگی و هدف', 30]],
  extra: [['woerter', 'Sätze mit Wörtern', 'جمله‌سازی با لغات مرور امروز و ساختارهای پرکاربرد', 12], ['redemittel', 'Sätze mit Redemitteln', 'جمله‌سازی با Redemittel مرور امروز', 9], ['fehler', 'Fehler richtig anwenden', 'شکل درست اشتباهات در جمله تازه', 9]],
};
// Account state keys the engine reads and writes (subset of the site's persistedData()).
const KEYS = ['user', 'plan', 'completed', 'points', 'history', 'renewCount', 'renewCountDate', 'streak', 'activityTimers', 'activityProgress', 'activityPoints',
  'answerPerformance', 'errors', 'wordProgress', 'dailyStudyDate', 'dailyStudyMinutes', 'testdafMethod', 'oesdMethod', 'studyMode', 'studyModeDate', 'planStash', 'learningResources', 'dataSource', 'appSettings'];
export const ENGINE_KEYS = KEYS;
const LV_ALL = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LV_P = { A1: 0, A2: 0, B1: 0.1, B2: 0.3, C1: 0.8, C2: 1 };

/* ───────────── small helpers ───────────── */
export const isFa = () => lang() === 'fa';
/** The engine's L(fa, de, en): en falls back to de like the site. */
export const ML = (fa, de, en) => (isFa() ? fa : lang() === 'en' ? (en || de) : de);
export const faNum = (n) => (isFa() ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const wdOf = (k) => parseKey(k).getDay();
export const satOf = (k) => addDays(k, -((wdOf(k) + 1) % 7));
export const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
export const timeStr = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; };
export const mmss = (s) => timeStr(Math.max(0, Math.round(s)));
export const arr = (x) => (Array.isArray(x) ? x : x == null || x === '' ? [] : typeof x === 'string' ? x.split(/\s*(?:\n|;|•|\|)\s*/).filter(Boolean) : typeof x === 'object' ? Object.values(x) : [x]);
const vWc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const uid = () => Math.random().toString(36).slice(2, 9);
/** Static method knowledge in the UI language (site staticView over TDM_STATIC). */
export function staticText(value) {
  if (typeof value === 'string') return (STATIC_COPY[value] && STATIC_COPY[value][lang()]) || value;
  if (Array.isArray(value)) return value.map(staticText);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, staticText(v)]));
  return value;
}
export const ST = () => staticText(TDM_STATIC);
export function topicLabel(user) {
  if (user.customTopic) return user.customTopic;
  for (const t of TOPIC_TREE) for (const c of t.children || []) if (c.id === user.subtopic) return c.label;
  for (const t of TOPIC_TREE) if (t.id === user.topic) return t.label;
  return '';
}
export function planName(n) {
  const s = String(n || '');
  if (['TestDaF', 'برنامه یادگیری', 'Learning program', 'Lernprogramm'].includes(s)) return lang() === 'en' ? 'Learning program' : lang() === 'de' ? 'Lernprogramm' : 'برنامه یادگیری';
  return s.replace(/^TestDaF-Training/, 'Lernplan');
}

export function createEngine({ store, account, loadPack, bridge, onDayFile }) {
  /* ───────────── the draft state (site `S`) ───────────── */
  let S = null;
  const lastSaved = {};
  const V = { screen: 'dashboard', activeId: null, review: false, hubTab: 'woche', weekTab: 'time', preparing: false, notice: '' };
  let content = null;
  const listeners = new Set();
  const emit = (what) => listeners.forEach((fn) => { try { fn(what); } catch (e) { console.warn(e); } });

  function defaults() {
    S.user = S.user && typeof S.user === 'object' ? S.user : {};
    if (!Array.isArray(S.user.weakSkills)) S.user.weakSkills = [];
    if (!Array.isArray(S.completed)) S.completed = [];
    for (const k of ['activityTimers', 'activityProgress', 'activityPoints', 'wordProgress', 'testdafMethod', 'planStash', 'appSettings']) if (!S[k] || typeof S[k] !== 'object') S[k] = {};
    for (const k of ['history', 'errors', 'answerPerformance']) if (!Array.isArray(S[k])) S[k] = [];
    if (S.plan === undefined) S.plan = null;
  }
  function loadKey(k) {
    const v = store.get(k);
    S[k] = v === undefined ? undefined : clone(v);
    lastSaved[k] = JSON.stringify(v ?? null);
  }
  function load() {
    S = {};
    KEYS.forEach(loadKey);
    // in-memory names used by the site code
    Object.defineProperty(S, 'completedActivities', { get: () => S.completed, set: (v) => { S.completed = v; }, enumerable: false });
    Object.defineProperty(S, 'totalPoints', { get: () => S.points || 0, set: (v) => { S.points = v; }, enumerable: false });
    defaults();
  }
  /** saveData(): every changed top-level key goes out as a PATCH path. */
  function save() {
    if (!S) return;
    KEYS.forEach((k) => {
      const json = JSON.stringify(S[k] ?? null);
      if (json === lastSaved[k]) return;
      lastSaved[k] = json;
      store.set(k, S[k] === undefined ? undefined : clone(S[k]));
    });
  }
  /** Remote changes replace keys that have no unsaved local change. */
  function onRemote(paths) {
    if (!S) return;
    const keys = paths.includes('*') ? KEYS : KEYS.filter((k) => paths.some((p) => p === k || p.startsWith(k + '.')));
    let changed = false;
    keys.forEach((k) => {
      if (JSON.stringify(S[k] ?? null) !== lastSaved[k]) return; // local edit pending
      const json = JSON.stringify(store.get(k) ?? null);
      if (json === lastSaved[k]) return;
      loadKey(k);
      changed = true;
    });
    if (changed) { defaults(); emit('remote'); }
  }

  /* ───────────── content and program ───────────── */
  // UNIFIED-PLAN: one learning plan for everyone; examPlan ('testdaf' | 'oesd') only picks the simulated exam
  const program = () => ((S.user?.examPlan || '') === 'oesd' || (S.user?.examPlan || '') === 'testdaf' ? 'testdaf' : '');
  // site PROG(): the ÖSD profile answers while the program is ÖSD
  const OSD = createOesd(() => S);
  const PROG = () => (program() === 'oesd' ? OSD : null);
  OSD.hooks.actId = () => V.activeId || null;
  OSD.hooks.curSchreiben = () => { const pk = M().days[S.plan?.date || todayKey()]?.picks?.schreiben; return pk ? item(pk.kind, pk.id) : null; };
  let oesdPack = null;
  const CT = () => (PROG() ? OSD.content(oesdPack) : content);
  const STX = () => (PROG() ? OSD.st() : ST());
  const SPO = () => (PROG() ? OSD.sprechenOrder() : SPRECHEN_ORDER);
  const DDEF = () => (PROG() ? OSD.dayDef : DAY_DEF);
  async function ensureContent() {
    if (PROG()) {
      if (!oesdPack) { oesdPack = await loadPack('oesd'); index = null; refreshPlanDescriptions(); }
      return CT();
    }
    if (content) return content;
    content = await loadPack('testdaf');
    index = null;
    return content;
  }
  let index = null;
  function item(kind, id) {
    const c = CT();
    if (!c) return null;
    if (!index || index.c !== c) {
      index = { c };
      for (const k of ['hoeren', 'lesen', 'argumentation', 'grafik', 'sprechen']) index[k] = new Map((c[k] || []).map((x) => [x.id, x]));
    }
    return index[kind]?.get(id) || null;
  }
  const enrolled = () => program() === 'testdaf' || program() === 'oesd';
  const curMode = () => (S.studyMode === 'free' ? 'free' : 'plan');
  const active = () => enrolled() && curMode() !== 'free';
  // LEAN4 (site 2026-11-19): owner/admin accounts only — days have Hören/Lesen/Schreiben/Sprechen only, mistakes go to the
  // phrase notebook, day packs run in sequence (content control). Normal users keep the old behaviour.
  const lean = () => { try { return ['admin', 'owner'].includes(account()?.role); } catch { return false; } };
  const LEAN_DROP = ['wortschatz', 'wiederholung', 'fehleranalyse', 'wochenbericht', 'extra'];

  /* ───────────── state M() ───────────── */
  function M() {
    const MK = program() === 'oesd' ? 'oesdMethod' : 'testdafMethod';
    if (!S[MK] || typeof S[MK] !== 'object') S[MK] = {};
    const m = S[MK];
    m.v = 1; m.phase = m.phase || 1;
    m.used = m.used || {}; for (const k of ['hoeren', 'lesen', 'argumentation', 'grafik', 'sprechen']) m.used[k] = m.used[k] || [];
    m.days = m.days || {}; m.srs = m.srs || {}; m.weekly = m.weekly || {}; m.log = m.log || [];
    m.cursor = m.cursor || { sprechen: 0 }; m.redemittelSeen = m.redemittelSeen || [];
    return m;
  }

  /* ───────────── calendar ───────────── */
  const dayDef = (k) => {
    const base = DDEF()[wdOf(k)];
    const chosen = M().weekFocus?.[wdOf(k)];
    return Array.isArray(chosen) && chosen.length && !base.evaluation /* FOCUS-MERGE: Friday stays the evaluation day */ ? { ...base, focus: chosen.filter((id) => ['hoeren', 'lesen', 'schreiben', 'sprechen'].includes(id)).slice(0, 2) } : base;
  };
  function firstSaturday() { const m = M(); const start = m.startDate || todayKey(); let first = satOf(start); if (wdOf(start) === 5) first = addDays(first, 7); return first; }
  function weekOf(k) { const d = diffDays(firstSaturday(), k); return d < 0 ? 0 : Math.floor(d / 7) + 1; }
  function weekRange(week) { const first = firstSaturday(); if (week <= 0) { const s = satOf(M().startDate || todayKey()); return [s, addDays(s, 6)]; } const s = addDays(first, (week - 1) * 7); return [s, addDays(s, 6)]; }
  const dayMode = (k) => { const def = dayDef(k); return def.evaluation ? 'eval' : def.exam ? 'exam' : 'normal'; };
  function moduleOrder(k) {
    const def = dayDef(k); const mode = dayMode(k);
    const base = lean() ? ['hoeren', 'lesen', 'schreiben', 'sprechen'] : mode === 'eval' ? ['hoeren', 'lesen', 'schreiben', 'sprechen', 'fehleranalyse', 'wochenbericht'] : ['hoeren', 'lesen', 'schreiben', 'sprechen', 'wortschatz', 'wiederholung'];
    const suggested = mode === 'eval' ? base : [...def.focus.filter((x) => base.includes(x)), ...base.filter((x) => !def.focus.includes(x))];
    const saved = M().dayOrder?.[k] || M().weekOrder?.[wdOf(k)]; // WEEK-DESIGN
    return Array.isArray(saved) ? [...saved.filter((x) => suggested.includes(x)), ...suggested.filter((x) => !saved.includes(x))] : suggested;
  }
  const focusLabel = (def) => (def.evaluation ? ML('ارزیابی', 'Bewertung', 'Evaluation') : def.focus.length === 4 ? ML('چهار مهارت', 'Alle vier Fertigkeiten', 'All four skills') : ML('تمرکز بیشتر: ', 'Schwerpunkt: ', 'More focus: ') + def.focus.map((f) => ML(MODS[f].fa, MODS[f].de)).join(' + '));

  /* ───────────── daily time ───────────── */
  function minFor(k, id) {
    const mode = dayMode(k); const chosen = M().weekFocus?.[wdOf(k)];
    if (mode === 'normal' && Array.isArray(chosen) && chosen.length) return (BASE_MIN.normal[id] || 20) + (chosen.includes(id) ? 25 : 0);
    const f = mode === 'normal' ? FOCUS_MIN[wdOf(k)] : null;
    return f && f[id] != null ? f[id] : BASE_MIN[mode]?.[id];
  }
  const dailyMin = () => { const v = Number(M().dailyMin); return DAILY_CHOICES.includes(v) ? v : DEFAULT_DAILY; };
  const scaleOf = () => dailyMin() / BASE;
  function dayModules(k) {
    const mode = dayMode(k); const def = dayDef(k); const order = moduleOrder(k);
    if (dailyMin() >= 120) return order;
    if (lean()) { const f = mode === 'eval' ? ['hoeren', 'lesen'] : mode === 'exam' ? (weekOf(k) % 2 ? ['hoeren', 'lesen'] : ['schreiben', 'sprechen']) : def.focus.filter((x) => order.includes(x)); return f.length ? f : order; }
    if (mode === 'eval') return ['hoeren', 'lesen', 'fehleranalyse', 'wochenbericht'];
    if (mode === 'exam') return weekOf(k) % 2 ? ['hoeren', 'lesen', 'wortschatz'] : ['schreiben', 'sprechen', 'wortschatz'];
    return [...def.focus, 'wortschatz'];
  }
  function minutesFor(k) {
    const ids = dayModules(k); const t = dailyMin();
    const base = ids.map((id) => (minFor(k, id) || 20) * loadRatio(k, id));
    const sum = base.reduce((a, b) => a + b, 0) || 1;
    const out = {}; const err = {};
    let acc = 0;
    ids.forEach((id, n) => { const exact = (base[n] * t) / sum; const v = Math.max(5, Math.round(exact / 5) * 5); out[id] = v; err[id] = exact - v; acc += v; });
    for (let guard = 0; acc !== t && guard < 40; guard += 1) {
      const up = acc < t;
      const id = ids.slice().sort((a, b) => (up ? err[b] - err[a] : err[a] - err[b])).find((x) => up || out[x] > 5);
      if (!id) break;
      const step = up ? 5 : -5;
      out[id] += step; err[id] -= step; acc += step;
    }
    const cm = M().weekMin?.[wdOf(k)]; // WEEK-DESIGN: own minutes for this weekday
    if (cm) ids.forEach((id) => { const v = Number(cm[id]); if (v >= 5) out[id] = Math.round(v / 5) * 5; });
    return out;
  }
  function spList(d) {
    const p = d?.picks;
    if (!p) return [];
    const all = p.sprechen || []; const f = scaleOf();
    if (!p.spBase) p.spBase = all.length || 1;
    if (f >= 1.25 && all.length <= p.spBase && CT()) {
      const used = new Set(all.map((id) => item('sprechen', id)?.type));
      const t = SPO().find((x) => !used.has(x)) || SPO()[0];
      const id = nextFrom('sprechen', (x) => x.type === t && !all.includes(x.id));
      if (id) { p.sprechen = [...all, id]; save(); return p.sprechen; }
    }
    const n = f >= 1.25 ? all.length : Math.min(p.spBase, f < 0.6 ? 1 : f < 0.85 ? 2 : p.spBase);
    return all.slice(0, Math.max(1, n));
  }
  const trimQs = (qs) => { const f = scaleOf() * (lowLevel() ? 0.7 : 1); if (!Array.isArray(qs) || f >= 0.75) return qs; return qs.slice(0, Math.max(3, Math.ceil(qs.length * Math.max(0.5, f)))); };
  const minWords = () => { const b = Math.round(((M().phase >= 2 ? 200 : 150) * (lowLevel() ? 0.75 : 1)) / 10) * 10; const f = scaleOf(); return f < 0.6 ? Math.round((b * 0.6) / 10) * 10 : f < 0.85 ? Math.round((b * 0.8) / 10) * 10 : b; };
  const mwOf = (d) => { const it = d?.picks?.schreiben ? item(d.picks.schreiben.kind, d.picks.schreiben.id) : null; return it && it.minWords ? Math.max(60, Math.round((it.minWords * minWords(d)) / (M().phase >= 2 ? 200 : 150) / 10) * 10) : minWords(d); };
  function dailyHint() {
    const t = dailyMin();
    if (t < 120) return ML('در این زمان هر روز فقط مهارت‌های «تمرکز بیشتر» آن روز و Wortschatz تمرین می‌شوند؛ بقیه مهارت‌ها در روزهای دیگر هفته می‌آیند. تعداد سؤال‌ها، تکالیف Sprechen و حداقل کلمات Schreiben کمتر است.', 'Mit dieser Zeit werden täglich nur die Schwerpunkte und Wortschatz geübt; die anderen Fertigkeiten kommen an anderen Wochentagen. Weniger Fragen, Sprechaufgaben und Wörter beim Schreiben.', 'With this time each day trains only its focus skills plus vocabulary; the other skills come on other days. Fewer questions, speaking tasks and words in writing.');
    if (t < BASE) return ML('همه مهارت‌ها هر روز تمرین می‌شوند، با زمان کوتاه‌تر؛ تعداد سؤال‌ها، تکالیف Sprechen و حداقل کلمات Schreiben متناسب با زمان کمتر می‌شود.', 'Alle Fertigkeiten täglich, aber kürzer; Fragen, Sprechaufgaben und Mindestwörter passen sich der Zeit an.', 'All skills every day, but shorter; questions, speaking tasks and word targets scale with the time.');
    if (t > BASE) return ML('زمان هر مرحله بیشتر می‌شود و هر روز یک تکلیف Sprechen اضافه داری.', 'Jeder Schritt bekommt mehr Zeit, dazu täglich eine zusätzliche Sprechaufgabe.', 'Every step gets more time, plus one extra speaking task each day.');
    return ML('برنامه پیشنهادی: مثل روز آزمون، با تقسیم کامل زمان بین همه مهارت‌ها.', 'Empfohlener Plan: wie ein Prüfungstag, mit voller Zeitverteilung.', 'Recommended plan: like an exam day, with the full time split.');
  }

  /* ───────────── levels (LEVEL-ADAPT) ───────────── */
  function userLevel() {
    applyPendingLevel();
    const v = String(S.user?.level || 'B2').toUpperCase();
    return LV_ALL.includes(v) ? v : 'B2';
  }
  /** Site amkApplyPendingLevel: a level chosen "from tomorrow" becomes active on that day. */
  function applyPendingLevel() {
    const a = S.appSettings || {};
    if (a.levelNext && a.levelFrom && todayKey() >= a.levelFrom) {
      S.user.level = a.levelNext;
      delete a.levelNext; delete a.levelFrom;
    }
  }
  const lowLevel = () => ['A1', 'A2', 'B1'].includes(userLevel());
  const lvBand = () => { const v = userLevel(); return ['A1', 'A2', 'B1'].includes(v) ? [0, 0.4] : v === 'B2' ? [0, 0.6] : [0.4, 1]; };
  const lvText = (kind, it) => (kind === 'hoeren' ? (it.segments || []).map((x) => x.text).join(' ') : kind === 'lesen' ? (it.paragraphs || []).map((x) => (x && x.text) || x).join(' ') : kind === 'sprechen' ? [it.situation, it.task, it.material].join(' ') : kind === 'grafik' ? [it.task, it.text].join(' ') : [it.situation, it.task, ...(it.positions || []).map((x) => x && x.text)].join(' '));
  function lvRaw(kind, it) {
    const t = String(lvText(kind, it) || ''); const words = t.split(/\s+/).filter(Boolean); const n = words.length || 1; const clean = (w) => w.replace(/[^A-Za-zÄÖÜäöüß]/g, '');
    const sents = Math.max(1, (t.match(/[.!?…](\s|$)/g) || []).length); const longW = words.filter((w) => clean(w).length >= 13).length / n;
    const avgW = words.reduce((a, w) => a + clean(w).length, 0) / n;
    let sc = (n / sents) * 0.6 + longW * 120 + avgW * 2;
    if (kind === 'hoeren' && Number(it.duration) > 0) sc += n / (Number(it.duration) / 60) / 20;
    if (kind === 'lesen' || kind === 'hoeren') sc += Math.min(n, 1200) / 200;
    return sc;
  }
  const lvCache = {};
  function lvPct(kind) {
    const c = CT(); const list = (c && c[kind]) || []; const key = list.length + '|' + ((c && c.version) || '');
    if (lvCache[kind] && lvCache[kind].key === key) return lvCache[kind].map;
    const sc = list.map((it) => [it.id, lvRaw(kind, it)]).sort((a, b) => a[1] - b[1]); const map = {};
    sc.forEach(([id], i) => { map[id] = sc.length > 1 ? i / (sc.length - 1) : 0.5; });
    lvCache[kind] = { key, map };
    return map;
  }
  function lvRank(kind, list) {
    if (!list.length || program() === 'oesd') return list;
    const pm = lvPct(kind); const [lo, hi] = lvBand(); const low = lowLevel();
    const pOf = (x) => { const t = x.level && String(x.level).toUpperCase(); return t && LV_P[t] != null ? LV_P[t] : pm[x.id] != null ? pm[x.id] : 0.5; };
    const dist = (p) => (p < lo ? lo - p : p > hi ? p - hi : 0);
    return list.map((x, i) => { const p = pOf(x); return [x, dist(p), low ? p : i]; }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((z) => z[0]);
  }

  /* ───────────── picks ───────────── */
  function nextFrom(kind, filter) {
    const c = CT(); const m = M();
    if (!c) return null;
    const list = (c[kind] || []).filter((x) => !filter || filter(x));
    if (!list.length) return null;
    const used = m.used[kind];
    let it = lvRank(kind, list.filter((x) => !used.includes(x.id) && !x.tw))[0]; // THEMED-DAYS: themed items only via their own day
    if (!it) it = list.slice().sort((a, b) => used.lastIndexOf(a.id) - used.lastIndexOf(b.id))[0];
    used.push(it.id);
    return it.id;
  }
  function pruneOldDays(m, k) {
    const limit = addDays(k, -21);
    Object.values(m.days).forEach((d) => { if (d.date < limit && d.work && Object.keys(d.work).length) { d.work = {}; d.pruned = true; } });
    if (m.log.length > 4000) m.log = m.log.slice(-4000);
  }
  const normPhrase = (s) => String(s || '').toLowerCase().replace(/[^a-zäöüß ]/g, '').replace(/\s+/g, ' ').trim();
  function pickRedemittel(d) {
    const m = M(); const seen = new Set(m.redemittelSeen); const out = [];
    const sw = d.picks.schreiben ? item(d.picks.schreiben.kind, d.picks.schreiben.id) : null;
    const sp = (d.picks.sprechen || []).map((id) => item('sprechen', id)).filter(Boolean);
    const sprechFirst = [1, 3].includes(d.wd);
    const pools = sprechFirst ? [...sp.map((x) => arr(x.redemittel)), arr(sw?.redemittel)] : [arr(sw?.redemittel), ...sp.map((x) => arr(x.redemittel))];
    for (const pool of pools) for (const r of pool) { const n = normPhrase(r.de); if (out.length < 5 && n && !seen.has(n)) { out.push(r); seen.add(n); } }
    for (const pool of pools) for (const r of pool) { if (out.length < 5 && !out.includes(r)) out.push(r); }
    m.redemittelSeen = [...seen];
    return out;
  }
  /* LEAN4-PACKS: ordered day packs (content bundle c.packs); this account's own order lives in M().packOrder */
  function packSeq() {
    const c = CT(); const all = c && Array.isArray(c.packs) ? c.packs.map((x) => x.day) : [];
    const own = Array.isArray(M().packOrder) ? M().packOrder.map(Number).filter((x) => x > 0) : [];
    const seen = new Set(own);
    const base = [...own, ...all.filter((x) => !seen.has(x)).sort((a, b) => a - b)];
    return M().packOrderFri ? base : friFill(base);   // FRI-FILL (site 2026-11-19)
  }
  /* FRI-FILL: ids 7, 14, 21 … (the old Fridays) fill the first packs that are not ready yet; unready ones go last */
  function friFill(list) {
    const c = CT(); const by = new Map((c?.packs || []).map((p) => [p.day, p])); const fri = (d) => ((Number(d) - 1) % 7) === 6;
    const ready = (d) => { const pk = by.get(d); if (!pk) return false; const ids = packIds(pk); return ids.length > 0 && ids.every(([kd, id]) => item(kd, id)); };
    const fr = list.filter(fri); const fReady = fr.filter(ready); const fLater = fr.filter((d) => !ready(d));
    let out = []; let wait = [];
    list.filter((d) => !fri(d)).forEach((d) => {
      if (!ready(d) && fReady.length) { out.push(fReady.shift()); wait.push(d); return; }
      if (wait.length && !fReady.length) { out = out.concat(wait); wait = []; }
      out.push(d);
    });
    return out.concat(fReady, wait, fLater);
  }
  const packIds = (pk) => [['hoeren', pk.hoeren], ['lesen', pk.lesen], [pk.schreiben?.kind, pk.schreiben?.id], ...(pk.sprechen || []).map((x) => ['sprechen', x])].filter((x) => x[0] && x[1]);
  /** A new day (or «renew») takes the pack after the current one; null = pack not published yet (normal picks). */
  function leanNextPack(k) {
    const c = CT();
    if (!lean() || PROG() || !c || !Array.isArray(c.packs) || !c.packs.length) return null;
    if (k !== todayKey() && k !== S.plan?.date) return null;
    const m = M(); const cur = Number(m.packCur) || 0; const seq = packSeq();
    const pos = [6, 0, 1, 2, 3, 4, 5].indexOf(wdOf(k)); const at = cur ? seq.indexOf(cur) : -1;
    const want = cur && at >= 0 ? seq[at + 1] : seq[Math.max(0, (Math.max(1, weekOf(k)) - 1) * 6 + Math.min(pos, 5))];
    const pk = c.packs.find((x) => x.day === want);
    if (!pk) return null;
    const ids = packIds(pk);
    if (!ids.length || ids.some(([kd, id]) => !item(kd, id))) return null;
    return { pk, ids };
  }
  /* THEMED-DAYS: from plan week 9 on, a TestDaF day takes the items tagged with its week + weekday */
  function themedDay(week, wd) {
    const c = CT();
    if (!c || PROG() || !(week >= 9)) return null;
    const pick = (kd) => (c[kd] || []).filter((x) => x.tw === week && x.twd === wd);
    const r = { hoeren: pick('hoeren'), lesen: pick('lesen'), argumentation: pick('argumentation'), grafik: pick('grafik'), sprechen: pick('sprechen') };
    const any = Object.values(r).find((a) => a.length);
    if (!any) return null;
    r.theme = any[0].dayTheme || '';
    return r;
  }
  function thTake(kind, it) { if (!it) return null; const u = M().used[kind]; if (u.includes(it.id)) return null; u.push(it.id); return it.id; }
  function ensureDay(k) {
    const m = M();
    if (!m.startDate) m.startDate = k;
    let d = m.days[k];
    if (!d) pruneOldDays(m, k);
    if (!d) d = m.days[k] = { date: k, wd: wdOf(k), week: weekOf(k), mode: dayMode(k), phase: m.phase, work: {}, results: {}, createdAt: new Date().toISOString() };
    if (!d.picks && CT()) {
      d.level = userLevel();
      const def = dayDef(k); const p = {};
      const LP = leanNextPack(k);
      if (LP) {
        const pk = LP.pk;
        d.picks = { hoeren: pk.hoeren, lesen: pk.lesen, schreiben: { kind: pk.schreiben.kind, id: pk.schreiben.id }, sprechen: (pk.sprechen || []).slice(), spBase: (pk.sprechen || []).length || 1 };
        LP.ids.forEach(([kd, id]) => { const u = m.used[kd] || (m.used[kd] = []); if (!u.includes(id)) u.push(id); });
        d.packDay = pk.day; d.theme = pk.theme || ''; m.packCur = pk.day;
        d.redemittel = pickRedemittel(d);
        save();
        return d;
      }
      delete d.packDay; delete d.theme;
      const TH = themedDay(d.week, d.wd);
      if (TH) d.theme = TH.theme;
      p.hoeren = thTake('hoeren', TH && TH.hoeren[0]) || nextFrom('hoeren');
      p.lesen = thTake('lesen', TH && TH.lesen[0]) || (PROG() && OSD.lesenFilter(def) && nextFrom('lesen', OSD.lesenFilter(def))) || nextFrom('lesen');
      let sk = def.schreiben;
      if (sk === 'auto') sk = d.week % 2 === 1 ? 'grafik' : 'argumentation';
      p.schreiben = { kind: sk, id: thTake(sk, TH && TH[sk][0]) || (PROG() && OSD.schreibenFilter(def) && nextFrom(sk, OSD.schreibenFilter(def))) || nextFrom(sk) };
      let types = def.sprechen; const spTh = [];
      if (TH && TH.sprechen.length) {
        const pool = TH.sprechen.filter((x) => !m.used.sprechen.includes(x.id)); const want = Array.isArray(types) ? types.length : types;
        if (Array.isArray(types)) types.forEach((t) => { const i = pool.findIndex((x) => x.type === t); if (i >= 0) spTh.push(thTake('sprechen', pool.splice(i, 1)[0])); });
        else pool.slice(0, want).forEach((x) => spTh.push(thTake('sprechen', x)));
        if (Array.isArray(types)) types = types.filter((t) => !spTh.some((id) => item('sprechen', id)?.type === t)); else types = Math.max(0, types - spTh.length);
      }
      if (typeof types === 'number') { const cnt = types; types = []; for (let i = 0; i < cnt; i += 1) { types.push(SPO()[m.cursor.sprechen % SPO().length]); m.cursor.sprechen += 1; } }
      p.sprechen = [...spTh.filter(Boolean), ...types.map((t) => nextFrom('sprechen', (x) => x.type === t)).filter(Boolean)];
      d.picks = p;
      d.redemittel = pickRedemittel(d);
      save();
    }
    return d;
  }
  const dayKey = () => S.plan?.date || todayKey();
  const curDay = () => ensureDay(dayKey());

  /* ───────────── activities ───────────── */
  function activityDesc(id, k) {
    const d = M().days[k]; const mode = dayMode(k); const def = dayDef(k);
    const modeLabel = mode === 'eval' ? 'Wochentest' : mode === 'exam' ? 'Prüfungsmodus' : '';
    let detail = '';
    if (d?.picks && CT()) {
      if (id === 'hoeren') { const it = item('hoeren', d.picks.hoeren); detail = it ? `${it.formatLabel}: ${it.title}` : ''; }
      if (id === 'lesen') { const it = item('lesen', d.picks.lesen); detail = it ? it.title : ''; }
      if (id === 'schreiben') { const it = item(d.picks.schreiben.kind, d.picks.schreiben.id); detail = it ? `${d.picks.schreiben.kind === 'grafik' ? 'Grafik' : (it.formatLabel ? it.formatLabel.split('·').pop().trim() : 'Argumentation')}: ${it.title}` : ''; }
      if (id === 'sprechen') detail = spList(d).map((x) => item('sprechen', x)?.typeLabel).filter(Boolean).join(' · ');
    }
    const method = { hoeren: '5-Schritte-Methode', lesen: '4-Schritte-Methode', schreiben: def.schreiben === 'grafik' ? 'Grafik und Zusammenfassung' : 'Argumentation', sprechen: 'Prepare → Speak → Record → Analyze → Repeat', wortschatz: '5 neue Wörter · 5 Redemittel · Satzbildung', wiederholung: 'Active Recall · 1-3-7-14', fehleranalyse: 'Fehler der Woche · Wiederholung · Vergleich', wochenbericht: 'Vergleich mit der Vorwoche · Ziel', extra: 'Zusatzzeit · Satzbildung mit Wiederholung & Strukturen' }[id];
    return [modeLabel, detail || method].filter(Boolean).join(' · ');
  }
  const extraActivity = (k, mins) => ({ id: 'extra', icon: MODS.extra.icon, title: MODS.extra.de, desc: activityDesc('extra', k), dur: mins, questionTarget: 0, type: 'method', content_ref: 'extra', priority: 'medium', optional: true, method: { module: 'extra', mode: dayMode(k) } });
  function buildActivities(k0) {
    const k = k0 || todayKey(); const m = M();
    if (!m.startDate) m.startDate = k;
    const d = ensureDay(k); const mode = dayMode(k); const def = dayDef(k); const mins = minutesFor(k);
    const activities = dayModules(k).map((id) => ({
      id, icon: MODS[id].icon, title: mode === 'eval' && ['hoeren', 'lesen', 'schreiben', 'sprechen'].includes(id) ? `${MODS[id].de}-Test` : MODS[id].de,
      desc: activityDesc(id, k), dur: mins[id], questionTarget: 0, type: 'method', content_ref: id, priority: def.focus.includes(id) ? 'high' : 'medium', method: { module: id, mode },
    }));
    const extra = lean() ? 0 : Number(d.extraMin) || 0;
    if (extra > 0) activities.push(extraActivity(k, extra));
    return { activities, totalMinutes: activities.reduce((s, a) => s + a.dur, 0), availableMinutes: dailyMin() + extra };
  }
  function refreshPlanDescriptions() {
    if (!S.plan || !active() || !Array.isArray(S.plan.activities)) return;
    const k = S.plan.date || todayKey();
    ensureDay(k);
    let changed = false;
    S.plan.activities.forEach((a) => { if (a.type === 'method') { const d = activityDesc(a.id, k); if (d !== a.desc) { a.desc = d; changed = true; } } });
    if (changed) save();
  }
  /* ÖSD level (site oesd-method.js started / refreshPlan / OSD.setLevel) */
  function oesdStarted() {
    if (!S.plan) return false;
    const d = S.oesdMethod?.days?.[S.plan.date];
    return !!(d && d.work && Object.values(d.work).some((w) => w && (w.step > 0 || (w.secs || []).some(Boolean))));
  }
  async function oesdRefreshPlan(repick) {
    if (!active()) return;
    try { await ensureContent(); } catch { /* offline: keep the plan */ }
    if (repick && S.plan) { const d = S.oesdMethod?.days?.[S.plan.date]; if (d && !oesdStarted()) { delete d.picks; delete d.redemittel; } }
    if (S.plan && Array.isArray(S.plan.activities)) {
      const b = buildActivities(); const byId = Object.fromEntries(b.activities.map((a) => [a.id, a]));
      S.plan.activities = S.plan.activities.map((a) => (byId[a.id] ? { ...a, dur: byId[a.id].dur, desc: byId[a.id].desc, title: byId[a.id].title } : a));
      S.plan.totalMinutes = S.plan.activities.reduce((x, a) => x + (Number(a.dur) || 0), 0);
      S.plan.availableMinutes = b.availableMinutes;
    }
    save();
  }
  /** Returns 'next' when the change waits until tomorrow, true when applied now. */
  async function setOesdLevel(lv) {
    const m = S.oesdMethod = S.oesdMethod && typeof S.oesdMethod === 'object' ? S.oesdMethod : {};
    if (!OSD.LEVELS.includes(lv)) return false;
    if (lv === OSD.level()) { delete m.levelNext; delete m.levelFrom; save(); return true; }
    if (oesdStarted()) { m.levelNext = lv; m.levelFrom = addDays(todayKey(), 1); save(); return 'next'; }
    m.level = lv; delete m.levelNext; delete m.levelFrom;
    await oesdRefreshPlan(true);
    return true;
  }
  /** Premium level change: today's unfinished modules get new content (site TDM.applyLevelChange). */
  function applyLevelChange() {
    if (!CT()) return [];
    const m = M(); const k = (active() && S.plan?.date) || todayKey(); const d = m.days[k]; const fresh = [];
    if (d && d.picks) {
      const done = new Set([...(active() ? S.completedActivities || [] : []), ...Object.keys(d.results || {})]);
      const def = dayDef(k); const p = d.picks;
      const swap = (kind, old, extra) => {
        const u = m.used[kind] || []; const at = u.lastIndexOf(old);
        if (at >= 0) u.splice(at, 1);
        const id = nextFrom(kind, (x) => x.id !== old && (!extra || extra(x))) || (extra ? nextFrom(kind, (x) => x.id !== old) : null);
        if (id) return id;
        u.push(old);
        return old;
      };
      if (!done.has('hoeren') && p.hoeren) { p.hoeren = swap('hoeren', p.hoeren); fresh.push('hoeren'); }
      if (!done.has('lesen') && p.lesen) { p.lesen = swap('lesen', p.lesen, (PROG() && OSD.lesenFilter(def)) || null); fresh.push('lesen'); }
      if (!done.has('schreiben') && p.schreiben?.id) { p.schreiben = { kind: p.schreiben.kind, id: swap(p.schreiben.kind, p.schreiben.id, (PROG() && OSD.schreibenFilter(def)) || null) }; fresh.push('schreiben'); }
      if (!done.has('sprechen') && Array.isArray(p.sprechen)) { p.sprechen = p.sprechen.map((id) => { const t = item('sprechen', id)?.type; return swap('sprechen', id, t ? (x) => x.type === t : null); }); fresh.push('sprechen'); }
      if (!done.has('wortschatz')) { d.redemittel = pickRedemittel(d); fresh.push('wortschatz'); }
      fresh.forEach((id) => { if (d.work) delete d.work[id]; if (active() && S.activityProgress) delete S.activityProgress[id]; });
      d.level = userLevel(); d.levelAt = new Date().toISOString();
    }
    if (active() && S.plan) { syncPlan(true); refreshPlanDescriptions(); }
    save();
    return fresh;
  }

  /* ───────────── work state & steps ───────────── */
  const act = () => (V.activeId ? S.plan?.activities?.find((a) => a.id === V.activeId) || null : null);
  function work(id = act()?.id) {
    const d = curDay();
    d.work = d.work || {};
    const w = d.work[id] || (d.work[id] = { step: 0, secs: [], f: {}, ans: {}, cat: {}, rec: {}, rate: {}, self: {}, checked: {} });
    w.secs = w.secs || [];
    for (const k of ['f', 'ans', 'cat', 'rec', 'rate', 'self', 'checked']) w[k] = w[k] || {};
    return w;
  }
  const prevPracticeDay = (k) => { const m = M(); return Object.keys(m.days).filter((x) => x < k && m.days[x].picks && m.days[x].mode !== 'eval').sort().pop() || null; };
  const errorDue = (e) => !e.isMastered && e.nextReview && e.nextReview <= todayKey() && (!e.nextReviewAt || new Date(e.nextReviewAt).getTime() <= Date.now());
  const weekErrors = (week) => { const [from, to] = weekRange(week); return (S.errors || []).filter((e) => e.source === 'tdm' && String(e.createdAt || '').slice(0, 10) >= from && String(e.createdAt || '').slice(0, 10) <= to); };
  function volNeed(id, mode, d, keys) {
    if (!CT() || !d) return null;
    const p = d.picks || {}; const k = d.date || todayKey(); const f = {};
    const dueErr = () => (S.errors || []).filter(errorDue).length;
    const srsN = (type, due) => Object.values(M().srs || {}).filter((x) => x.type === type && (!due || x.due <= k)).length;
    if (id === 'hoeren') {
      const it = item('hoeren', p.hoeren); if (!it) return null;
      const A = (Number(it.duration) || 240) / 60; const q = (trimQs(it.questions) || []).length; const tw = vWc((it.segments || []).map((s) => s.text).join(' '));
      Object.assign(f, { global: A + 1, selektiv: A + q, analyse: tw / 90 + q * 0.8, erneut: A + 1, zusammenfassung: 8, pruefung: 2 * A + q + 1 });
    } else if (id === 'lesen') {
      const it = item('lesen', p.lesen); if (!it) return null;
      const W = vWc((it.paragraphs || []).map((x) => x.text || x).join(' ')); const q = (trimQs(it.questions) || []).length; const P = (it.paragraphs || []).length;
      Object.assign(f, { ueberblick: 1 + P * 0.4, intensiv: W / 70, aufgaben: q * 1.5, fehler: q * 0.8 + 2, pruefung: W / 120 + q * 1.5 });
    } else if (id === 'schreiben') {
      const pk = p.schreiben; const it = pk ? item(pk.kind, pk.id) : null; if (!it) return null;
      const T = mwOf(d) || 200; const src = vWc([it.situation, ...(it.positions || []).map((x) => x.text), it.task, it.text].join(' ')); const mw = vWc(it.model_text);
      Object.assign(f, { analyse: src / 100 + (pk.kind === 'grafik' ? 5 : 2), gliederung: 5, schreiben: T / 8 + (mode === 'normal' ? 0 : 5), korrektur: 4 + mw / 100 + T / 40 });
    } else if (id === 'sprechen') {
      const L_ = spList(d).map((x) => item('sprechen', x)).filter(Boolean); if (!L_.length) return null;
      const pr = (it) => (Number(it.prep) || 60) / 60; const sp = (it) => (Number(it.speak) || 90) / 60;
      L_.forEach((it, t) => Object.assign(f, { ['prep:' + t]: pr(it) + 1.5, ['speak:' + t]: sp(it) * 2 + 1, ['analyse:' + t]: sp(it) * 2 + 3, ['repeat:' + t]: sp(it) * 2 + 2 }));
      Object.assign(f, { exam: L_.reduce((s, it) => s + pr(it) + sp(it) + 1, 0), analyse: L_.reduce((s, it) => s + sp(it) * 2 + 3, 0) });
    } else if (id === 'wortschatz') {
      Object.assign(f, { alt: Math.min(8, srsN('wort')) * 0.6 + 1, neu: 10, redemittel: (d.redemittel || []).length || 5, saetze: 7 });
    } else if (id === 'wiederholung') {
      Object.assign(f, { woerter: Math.min(15, srsN('wort', true)) * 0.6 + 1, grammatik: Math.min(8, dueErr()) * 1.5 + 1, wiedergeben: prevPracticeDay(k) ? 6 : 1, redemittel: Math.min(12, srsN('redemittel', true)) * 0.5 + 1, test: 6 });
    } else if (id === 'fehleranalyse') {
      Object.assign(f, { woche: 4 + Math.min(20, weekErrors(d.week).length) * 0.6, wiederholung: Math.min(15, dueErr()) * 1.5 + 1, vergleich: 8 });
    } else if (id === 'extra') {
      const sx = d.work?.extra?.sx;
      Object.assign(f, { woerter: (sx ? sx.woerter.length : 5) * 2 + 1, redemittel: (sx ? sx.redemittel.length : 4) * 2 + 1, fehler: (sx ? Math.max(1, sx.fehler.length) : 3) * 2.5 + 1 });
    } else return null;
    const out = keys.map((key) => f[key]);
    return out.every((x) => Number.isFinite(x)) ? out.map((x) => Math.max(1, x)) : null;
  }
  function loadRatio(k, id) {
    try {
      const d = M().days?.[k];
      if (!d || !d.picks || !CT()) return 1;
      const mode = dayMode(k); const raw = stepsFor(id, mode, d, true); const nominal = raw.reduce((s, x) => s + x[3], 0);
      const need = volNeed(id, mode, d, raw.map((x) => x[0]));
      if (!need || !nominal) return 1;
      return clamp(need.reduce((s, x) => s + x, 0) / nominal, 0.6, 1.6);
    } catch { return 1; }
  }
  function stepsFor(id, mode, d, rawOnly, durOverride) {
    let raw;
    if (id === 'hoeren') raw = STEP_TABLES.hoeren[mode] || STEP_TABLES.hoeren.normal;
    else if (id === 'lesen') raw = STEP_TABLES.lesen[mode] || STEP_TABLES.lesen.normal;
    else if (id === 'schreiben') { const g = d.picks?.schreiben?.kind === 'grafik'; raw = (g ? STEP_TABLES.grafik : STEP_TABLES.arg)[mode === 'normal' ? 'normal' : 'exam']; }
    else if (id === 'sprechen') {
      const n = Math.max(1, spList(d).length);
      if (mode === 'normal') { raw = []; for (let t = 0; t < n; t += 1) { const tag = n > 1 ? ` (${t + 1}/${n})` : ''; raw.push(['prep:' + t, 'Vorbereitung' + tag, 'آماده‌سازی: فقط کلیدواژه', 5 / n], ['speak:' + t, 'Sprechen' + tag, 'صحبت و ضبط', 10 / n], ['analyse:' + t, 'Analyse' + tag, 'گوش‌دادن و بررسی', 5 / n], ['repeat:' + t, 'Wiederholung' + tag, 'اجرای مجدد بدون یادداشت', 15 / n]); } }
      else raw = [['exam', mode === 'eval' ? 'Sprechen-Test' : 'Prüfung', 'اجرای زمان‌دار تمام وظایف', 25], ['analyse', 'Analyse', 'بررسی ضبط‌ها و ارزیابی', 10]];
    } else raw = STEP_TABLES[id] || STEP_TABLES.wochenbericht;
    if (rawOnly) return raw;
    {
      const keys = raw.map((x) => x[0]).join('|'); const wk = d?.work?.[id];
      let need = wk?.volEst && wk.volEst.mode === mode && wk.volEst.keys === keys ? wk.volEst.v : null;
      if (!need) { need = volNeed(id, mode, d, raw.map((x) => x[0])); if (need && wk?.startedAt) wk.volEst = { mode, keys, v: need.map((x) => Math.round(x * 10) / 10) }; }
      if (need) raw = raw.map((x, n) => [x[0], x[1], x[2], need[n]]);
    }
    const total = raw.reduce((s, x) => s + x[3], 0);
    const activity = S.plan?.activities?.find((a) => a.id === id);
    const dur = Number(durOverride) || Number(activity?.dur) || total;
    return raw.map(([key, de, fa, min]) => ({ key, de, fa, min: Math.max(1, Math.round((min / total) * dur)) }));
  }

  /* ───────────── plan sync (fixed daily time) ───────────── */
  function syncPlan(force) {
    if (!active() || !S.plan || !Array.isArray(S.plan.activities) || !S.plan.activities.length || !S.plan.activities.every((a) => a.type === 'method')) return false;
    if (V.activeId && !force) return false;
    const k = S.plan.date || todayKey(); const want = minutesFor(k); const ids = Object.keys(want); const done = new Set(S.completedActivities || []); const timers = S.activityTimers || {};
    const built = buildActivities(k).activities; const order = built.map((a) => a.id);
    let changed = false;
    const keep = S.plan.activities.filter((a) => !(lean() && LEAN_DROP.includes(a.id)) && (a.id === 'extra' || ids.includes(a.id) || done.has(a.id) || (Number(timers[a.id]) || 0) > 0 || V.activeId === a.id));
    if (keep.length !== S.plan.activities.length) changed = true;
    for (const id of ids) if (!keep.some((a) => a.id === id)) { const b = built.find((x) => x.id === id); if (b) { keep.push(b); changed = true; } }
    keep.forEach((a) => { const v = want[a.id]; if (v && Number(a.dur) !== v) { a.dur = v; changed = true; } });
    const pos = (id) => (id === 'extra' ? 999 : order.includes(id) ? order.indexOf(id) : 500);
    const sorted = keep.slice().sort((a, b) => pos(a.id) - pos(b.id));
    if (sorted.some((a, n) => a !== S.plan.activities[n])) changed = true;
    if (!changed) return false;
    const extra = Number(sorted.find((a) => a.id === 'extra')?.dur) || 0;
    S.plan.activities = sorted;
    S.plan.totalMinutes = sorted.reduce((s, a) => s + (Number(a.dur) || 0), 0);
    S.plan.availableMinutes = dailyMin() + extra;
    save();
    return true;
  }

  /* ───────────── history snapshot ───────────── */
  const trackedKeys = () => new Set(['wortschatz', 'lesen', 'hoeren', 'sprechen', 'schreiben', 'grammatik', 'active_recall', 'mini_test', 'vocab', 'vocab_review', 'grammar', 'writing', 'listening', 'gesamttest', ...(S.plan?.activities || []).map((x) => String(x.id || ''))]);
  function trackedTimes() {
    const allowed = trackedKeys(); const result = {};
    for (const [id, value] of Object.entries(S.activityTimers || {})) if (allowed.has(id) && Number(value) > 0) result[id] = Math.max(0, Math.round(Number(value) || 0));
    return result;
  }
  function performanceSummary(records) {
    const valid = (Array.isArray(records) ? records : []).filter((x) => Number.isFinite(Number(x.score)));
    const bySkill = {}; const counts = {}; let total = 0;
    for (const x of valid) { const skill = x.skill || 'other'; total += Number(x.score); bySkill[skill] = (bySkill[skill] || 0) + Number(x.score); counts[skill] = (counts[skill] || 0) + 1; }
    for (const skill of Object.keys(bySkill)) bySkill[skill] = Math.round(bySkill[skill] / counts[skill]);
    return { score: valid.length ? Math.round(total / valid.length) : null, count: valid.length, bySkill, skillQuestionCounts: counts };
  }
  function snapshot(overrides = {}) {
    const stored = S.learningResources?.package?.content?.daily_dashboard?.scores || {};
    const perf = performanceSummary((S.answerPerformance || []).filter((x) => x.planId === S.plan?.id));
    const acts = S.plan?.activities?.length || 0; const comp = S.completedActivities.length; const finished = acts > 0 && comp >= acts;
    const legacy = historyOptionalNumber(stored.gesamt);
    const times = trackedTimes();
    return {
      planId: S.plan?.id || overrides.planId, date: S.plan?.date || todayKey(), createdAt: S.plan?.createdAt || new Date().toISOString(),
      examType: S.plan?.examType || S.user.examPlan || 'testdaf', examName: S.plan?.examName || planName(EXAM_PLANS[S.user.examPlan]?.name || 'Lernplan'),
      topic: topicLabel(S.user), score: perf.count ? perf.score : finished ? legacy : null, questionCount: perf.count, skillQuestionCounts: { ...perf.skillQuestionCounts },
      time: Object.values(times).reduce((a, b) => a + b, 0), acts, comp, activityTimes: times, skillScores: perf.count ? { ...perf.bySkill, gesamt: perf.score } : { ...stored }, ...overrides,
    };
  }
  const upsertHistory = (overrides) => upsertSegment(S, snapshot(overrides));

  /* ───────────── study-mode tabs (plan | free) ───────────── */
  const stash = () => { if (!S.planStash || typeof S.planStash !== 'object') S.planStash = {}; return S.planStash; };
  const captureCtx = () => ({ plan: S.plan, completedActivities: S.completedActivities || [], activityProgress: S.activityProgress || {}, activityTimers: S.activityTimers || {}, activityPoints: S.activityPoints || {}, totalPoints: S.totalPoints || 0, totalMinutes: 0 });
  const applyCtx = (c) => { S.plan = c?.plan || null; S.completedActivities = c?.completedActivities || []; S.activityProgress = c?.activityProgress || {}; S.activityTimers = c?.activityTimers || {}; S.activityPoints = c?.activityPoints || {}; S.totalPoints = c?.totalPoints || 0; };
  function rollover() {
    const k = todayKey(); const st = stash();
    ['plan', 'free'].forEach((x) => { if (st[x] && st[x].plan?.date !== k) st[x] = null; });
    if (S.studyMode !== 'free') return;
    const stale = S.plan ? S.plan.date !== k : S.studyModeDate !== k;
    if (stale) { S.studyMode = 'plan'; S.studyModeDate = k; return; }
    if (!S.plan && st.plan) { S.studyMode = 'plan'; applyCtx(st.plan); st.plan = null; }
  }
  function ctxInfo(mode) {
    const k = todayKey(); const c = mode === curMode() ? { plan: S.plan, completedActivities: S.completedActivities } : stash()[mode];
    if (!c?.plan || c.plan.date !== k) return '';
    return `${faNum((c.completedActivities || []).length)}/${faNum(c.plan.activities?.length || 0)}`;
  }

  /* ───────────── timers (site startTimer + TDM tick) ───────────── */
  let tick = null;
  function stopTimers() { if (tick) { clearInterval(tick); tick = null; } }
  function startTimer(id) {
    stopTimers();
    if (!S.activityTimers[id]) S.activityTimers[id] = 0;
    credit('act:' + id); // prime the wall-clock reference
    tick = setInterval(() => {
      if (V.screen !== 'activity' || V.activeId !== id || document.visibilityState === 'hidden') return;
      // activity time: active study only (ACTIME)
      const add = credit('act:' + id); const old = Number(S.activityTimers[id]) || 0;
      if (add > 0) { S.activityTimers[id] = old + add; if (Math.floor(old / 10) !== Math.floor(S.activityTimers[id] / 10)) save(); }
      // step clock: every visible second, like the site's TDM tick
      if (!V.review && act()) {
        const w = work(); const steps = stepsFor(id, curDay().mode, curDay()); const i = w.step || 0;
        w.secs[i] = (w.secs[i] || 0) + 1;
        emit({ tick: true, step: i, used: w.secs[i], limit: (steps[i]?.min || 1) * 60, total: S.activityTimers[id] || 0 });
      }
    }, 1000);
  }

  /* ───────────── lifecycle ───────────── */
  // site: TDM.rollover runs from ensureTodayPlan() at load only — once per day here, never on every redraw
  // (otherwise the free tab would flip back to the plan before its own plan exists)
  let rolledFor = null;
  function ensureToday() {
    if (rolledFor !== todayKey()) { rollover(); rolledFor = todayKey(); }
    if (S.plan && S.plan.date && S.plan.date !== todayKey()) {
      upsertHistory({ closedAt: new Date().toISOString(), closeReason: 'new-day', partial: S.completedActivities.length < (S.plan.activities?.length || 0) });
      S.plan = null; S.learningResources = null; S.dataSource = null; S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {};
      V.activeId = null;
      save();
    }
  }
  function ensureDailyStudyPreference(force = false) {
    const date = todayKey(); const norm = (v, f = 60) => { const parsed = Number(v) || Number(f) || 60; return Math.max(60, Math.min(720, Math.round(parsed / 60) * 60)); };
    const baseline = norm(S.user.dailyMinutes, 60);
    if (force || S.dailyStudyDate !== date || !Number.isFinite(Number(S.dailyStudyMinutes))) { S.dailyStudyDate = date; S.dailyStudyMinutes = baseline; }
    return norm(S.dailyStudyMinutes, baseline);
  }
  async function syncProfile() {
    const u = S.user || {};
    try {
      await bridge.api('/v1/account/profile', { method: 'PATCH', body: {
        display_name: u.name || null, current_level: u.level || null, target_exam: planName(EXAM_PLANS[u.examPlan]?.name || 'Lernplan'), target_level: u.level || null, exam_date: u.examDate || null,
        native_language: u.nativeLanguage || 'fa', profile_completed: !!u.profileCompleted, daily_minutes: Math.max(60, Math.min(720, Number(u.dailyMinutes) || 60)),
        timezone: u.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, learning_goals: u.learningGoal ? [u.learningGoal] : [],
        accessibility: { reduced_motion: !!u.reducedMotion }, avatar_data_url: u.avatarDataUrl || null,
      } });
    } catch { /* offline: the state itself is saved */ }
  }
  /** Site generatePlan (method path): today's plan from the engine. */
  /* «مطالعه آزاد» plan (site buildPersonalizedActivities): the free tab keeps its own plan in S.plan; its screen is
     the games space, the plan only carries the day's free-study record for History. */
  const PLAN_ACTIVITY_DEFS = [['wortschatz', 'book-open', 'Wortschatz', 12], ['lesen', 'document-text', 'Lesen', 14], ['hoeren', 'headphones', 'Hören', 14], ['sprechen', 'microphone', 'Sprechen', 13], ['schreiben', 'pencil-square', 'Schreiben', 14], ['grammatik', 'language', 'Grammatik', 12], ['active_recall', 'brain', 'Aktives Abrufen', 10], ['mini_test', 'clipboard-check', 'Mini-Test', 11]];
  const normalizeDailyMinutes = (value, fallback = 60) => { const parsed = Number(value) || Number(fallback) || 60; const hours = Math.round(parsed / 60); return Math.max(60, Math.min(720, hours * 60)); };
  function activityIsWeak(id) { const weak = S.user.weakSkills || []; const aliases = { wortschatz: 'vocab', hoeren: 'listening', lesen: 'reading', sprechen: 'speaking', schreiben: 'writing', grammatik: 'grammar' }; return weak.includes(id) || weak.includes(aliases[id]); }
  function questionTargetFor(id, duration) { const rules = { wortschatz: [2, 30, 2], lesen: [1, 8, 0.5], hoeren: [1, 8, 0.5], sprechen: [1, 6, 0.34], schreiben: [1, 1, 0.1], grammatik: [1, 18, 0.8], active_recall: [1, 20, 0.7], mini_test: [1, 24, 0.8] }; const rule = rules[id] || [1, 20, 0.6]; return Math.max(rule[0], Math.min(rule[1], Math.round(duration * rule[2]))); }
  function buildPersonalizedActivities(availableMinutes, examName) {
    const available = normalizeDailyMinutes(availableMinutes, S.user.dailyMinutes); const budget = Math.max(PLAN_ACTIVITY_DEFS.length, Math.min(available - 1, Math.floor(available * 0.9)));
    const weights = PLAN_ACTIVITY_DEFS.map((d) => d[3] * (activityIsWeak(d[0]) ? 1.55 : 1)); const weightSum = weights.reduce((sum, value) => sum + value, 0); const remaining = budget - PLAN_ACTIVITY_DEFS.length;
    const raw = weights.map((value) => (remaining * value) / weightSum); const extra = raw.map(Math.floor); const left = remaining - extra.reduce((sum, value) => sum + value, 0);
    raw.map((value, index) => ({ index, fraction: value - extra[index] })).sort((a, b) => b.fraction - a.fraction).slice(0, left).forEach((item) => { extra[item.index] += 1; });
    const activities = PLAN_ACTIVITY_DEFS.map((definition, index) => { const [id, icon, title] = definition; const duration = 1 + extra[index]; const questionTarget = questionTargetFor(id, duration); const weak = activityIsWeak(id); return { id, icon, title, desc: `${planName(examName)} · ${duration} Minuten · ${questionTarget} Aufgaben`, dur: duration, questionTarget, type: 'contract', content_ref: id, priority: weak ? 'high' : 'medium' }; });
    return { activities, totalMinutes: activities.reduce((sum, item) => sum + item.dur, 0), availableMinutes: available };
  }
  async function generatePlan() {
    if (V.preparing) return false;
    V.preparing = true;
    emit('preparing');
    try {
      const availableMinutes = ensureDailyStudyPreference();
      const examName = planName(EXAM_PLANS[S.user.examPlan]?.name || 'Lernplan');
      let built;
      if (active()) { await ensureContent(); built = buildActivities(todayKey()); } else built = buildPersonalizedActivities(availableMinutes, examName);
      S.plan = { id: 'plan-' + Date.now(), date: todayKey(), createdAt: new Date().toISOString(), examType: S.user.examPlan || 'testdaf', examName: planName(EXAM_PLANS[S.user.examPlan]?.name || 'Lernplan'), activities: built.activities, totalMinutes: built.totalMinutes, availableMinutes: built.availableMinutes, dataSource: 'database', schemaVersion: '1.0.0' };
      S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {}; S.totalPoints = 0; S.totalMinutes = 0;
      S.user.profileCompleted = true;
      upsertHistory();
      save();
      syncProfile();
      return true;
    } finally {
      V.preparing = false;
      emit('prepared');
    }
  }
  function startActivity(id) {
    const a = S.plan?.activities?.find((x) => x.id === id);
    if (!a) return false;
    if (a.type !== 'method') return false; // free-study activities run in milestone 4
    V.activeId = id; V.review = false; V.screen = 'activity';
    const w = work(id);
    if (!w.startedAt) w.startedAt = new Date().toISOString();
    save();
    startTimer(id);
    return true;
  }
  function review(id) {
    const a = S.plan?.activities?.find((x) => x.id === id);
    if (!a) return false;
    stopTimers();
    V.activeId = id; V.review = true; V.screen = 'activity';
    work(id).step = 0;
    return true;
  }
  /** Site pauseActivity: back to the plan, progress kept. */
  function pauseActivity() {
    stopTimers();
    if (V.activeId) upsertHistory();
    V.activeId = null; V.review = false; V.screen = 'dashboard';
    save();
  }
  function go(i) {
    const a = act();
    if (!a) return;
    const w = work(); const steps = stepsFor(a.id, curDay().mode, curDay());
    w.step = clamp(i, 0, steps.length - 1);
    save();
  }
  function completeActivity(id) {
    if (!S.completedActivities.includes(id)) S.completedActivities.push(id);
    upsertHistory();
    stopTimers();
    V.activeId = null; V.review = false; V.screen = 'dashboard';
    save();
    // site: the owner's day file is captured when the day's plan is finished
    const acts = S.plan?.activities?.length || 0;
    if (onDayFile && acts && S.completedActivities.length >= acts) { try { onDayFile(S.plan.date); } catch (error) { console.warn(error); } }
  }
  function startNext() { const next = S.plan?.activities?.find((a) => !S.completedActivities.includes(a.id)); return next ? startActivity(next.id) : false; }

  /* plan controls (week settings) */
  function setDaily(min) {
    min = Number(min);
    if (!DAILY_CHOICES.includes(min) || dailyMin() === min) return;
    M().dailyMin = min;
    if (active() && S.plan) { syncPlan(true); upsertHistory(); }
    save();
  }
  function setWeekFocus(wd, skill) {
    wd = Number(wd);
    if (![6, 0, 1, 2, 3, 4].includes(wd) || !['hoeren', 'lesen', 'schreiben', 'sprechen'].includes(skill)) return;
    const m = M(); const base = DDEF()[wd].focus; const current = Array.isArray(m.weekFocus?.[wd]) ? [...m.weekFocus[wd]] : base.length <= 2 ? [...base] : [];
    const next = current.includes(skill) ? current.filter((x) => x !== skill) : current.length >= 2 ? [current[1], skill] : [...current, skill];
    if (!next.length) return;
    m.weekFocus = m.weekFocus || {}; m.weekFocus[wd] = next;
    if (active() && S.plan && wdOf(S.plan.date || todayKey()) === wd) syncPlan(true);
    save();
  }
  function resetWeekFocus(wd) { const m = M(); if (m.weekFocus) delete m.weekFocus[Number(wd)]; if (active() && S.plan && wdOf(S.plan.date || todayKey()) === Number(wd)) syncPlan(true); save(); }
  function moveDayActivity(id, dir) {
    const k = S.plan?.date || todayKey(); const ids = moduleOrder(k); const at = ids.indexOf(id); const to = at + Number(dir);
    if (at < 0 || to < 0 || to >= ids.length) return;
    [ids[at], ids[to]] = [ids[to], ids[at]];
    const m = M(); m.dayOrder = m.dayOrder || {}; m.dayOrder[k] = ids;
    if (active() && S.plan) syncPlan(true);
    save();
  }
  /* WEEK-DESIGN (site 2026-11-19): each weekday has its own order, focus and minutes */
  function wdKey(wd) { const m = M(); const tk = S.plan?.date || todayKey(); if (wdOf(tk) === wd) return tk; return Object.keys(m.days || {}).filter((k) => wdOf(k) === wd).sort().pop() || addDays(satOf(todayKey()), (wd + 1) % 7); }
  function moveWeekdaySkill(wd, src, target) {
    wd = Number(wd); const tk = S.plan?.date || todayKey(); const ids = moduleOrder(wdKey(wd)).filter((x) => x !== 'extra'); const a = ids.indexOf(src); const b = ids.indexOf(target);
    if (a < 0 || b < 0 || a === b) return;
    ids.splice(a, 1); ids.splice(b, 0, src);
    const m = M(); m.weekOrder = m.weekOrder || {}; m.weekOrder[wd] = ids;
    if (wdOf(tk) === wd) { if (m.dayOrder) delete m.dayOrder[tk]; if (active() && S.plan) syncPlan(true); }
    save();
  }
  /* DRAG-SWAP (site 2026-11-20): a weekday's whole order (swap / nearest slot are computed by the page) */
  function setWeekOrder(wd, ids) {
    wd = Number(wd); if (![6, 0, 1, 2, 3, 4].includes(wd) || !Array.isArray(ids) || !ids.length) return;
    const m = M(); const tk = S.plan?.date || todayKey(); m.weekOrder = m.weekOrder || {}; m.weekOrder[wd] = ids.slice();
    if (wdOf(tk) === wd) { if (m.dayOrder) delete m.dayOrder[tk]; if (active() && S.plan) syncPlan(true); }
    save();
  }
  function resetWeekOrder(wd) {
    wd = Number(wd); const m = M(); const tk = S.plan?.date || todayKey();
    if (m.weekOrder) delete m.weekOrder[wd]; if (wdOf(tk) === wd && m.dayOrder) delete m.dayOrder[tk];
    if (wdOf(tk) === wd && active() && S.plan) syncPlan(true); save();
  }
  function resetWeekMin(wd) { wd = Number(wd); const m = M(); if (m.weekMin) delete m.weekMin[wd]; if (wdOf(S.plan?.date || todayKey()) === wd && active() && S.plan) syncPlan(true); save(); }
  function setWeekMin(wd, id, v) {
    wd = Number(wd); v = Math.round(Number(v) / 5) * 5; if (![6, 0, 1, 2, 3, 4].includes(wd) || !Number.isFinite(v)) return;
    v = Math.max(5, Math.min(240, v)); const m = M(); const cur = { ...minutesFor(wdKey(wd)) }; cur[id] = v;
    m.weekMin = m.weekMin || {}; m.weekMin[wd] = cur;
    if (active() && S.plan && wdOf(S.plan.date || todayKey()) === wd) syncPlan(true);
    save();
  }
  function resetWeekDay(wd) {
    wd = Number(wd); const m = M(); const tk = S.plan?.date || todayKey();
    ['weekFocus', 'weekOrder', 'weekMin'].forEach((f) => { if (m[f]) delete m[f][wd]; });
    if (wdOf(tk) === wd && m.dayOrder) delete m.dayOrder[tk];
    if (active() && S.plan && wdOf(tk) === wd) syncPlan(true);
    save();
  }
  const focusToday = () => { try { const f = dayDef(S.plan?.date || todayKey()).focus || []; return f.length <= 2 ? f : []; } catch (e) { return []; } };
  const weekdayInfo = (wd) => { const k = wdKey(wd); return { key: k, def: dayDef(k), order: moduleOrder(k).filter((x) => x !== 'extra'), minutes: minutesFor(k), custom: !!(M().weekFocus?.[wd] || M().weekOrder?.[wd] || M().weekMin?.[wd]) }; };
  function resetDayOrder() { const m = M(); const k = S.plan?.date || todayKey(); if (m.dayOrder) delete m.dayOrder[k]; if (active() && S.plan) syncPlan(true); save(); }
  function setExamDate(value) { if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return; S.user.examDate = value || ''; save(); }
  function setPhase(p) { const m = M(); m.phase = p; (m.phaseHistory = m.phaseHistory || []).push({ phase: p, date: todayKey() }); save(); }
  function setExtra(min) {
    if (!active() || !S.plan || lean()) return;
    min = EXTRA_CHOICES.includes(Number(min)) ? Number(min) : 0;
    if ((S.completedActivities || []).includes('extra')) return;
    if (!min && (Number(S.activityTimers?.extra) || 0) > 0) return;
    const k = S.plan.date || todayKey(); const d = ensureDay(k); const cur = S.plan.activities.find((a) => a.id === 'extra');
    d.extraMin = min;
    const list = S.plan.activities.filter((a) => a.id !== 'extra');
    if (min > 0) list.push(cur ? { ...cur, dur: min } : extraActivity(k, min));
    S.plan.activities = list;
    S.plan.totalMinutes = list.reduce((s, a) => s + (Number(a.dur) || 0), 0);
    S.plan.availableMinutes = dailyMin() + min;
    upsertHistory();
    save();
  }
  /** Site selectExamPlan (without the onboarding redirect, which the page handles). */
  function selectExamPlan(type) {
    if (!EXAM_PLANS[type]) return 'invalid';
    const same = S.plan && (S.plan.examType || 'testdaf') === type;
    S.user.examPlan = type;
    if (same) { save(); return 'dashboard'; }
    if (S.plan) {
      upsertHistory({ closedAt: new Date().toISOString(), closeReason: 'exam-plan-change', partial: S.completedActivities.length < (S.plan.activities?.length || 0) });
      S.plan = null; S.learningResources = null; S.dataSource = null; S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {};
    }
    save();
    return S.user.profileCompleted ? 'generate' : 'onboarding';
  }
  function requestPlanChange() { /* UNIFIED-PLAN: the exam is chosen in the simulation now */ }
  function setStudyMode(mode) {
    mode = mode === 'free' ? 'free' : 'plan';
    if (!enrolled() || V.preparing) return 'noop';
    const cur = curMode();
    if (mode === cur) return 'noop';
    stopTimers();
    const k = todayKey(); const st = stash();
    if (S.plan) upsertHistory();
    st[cur] = S.plan && S.plan.date === k ? captureCtx() : null;
    const next = st[mode]; st[mode] = null;
    S.studyMode = mode; S.studyModeDate = k;
    applyCtx(next && next.plan && next.plan.date === k ? next : null);
    V.activeId = null; V.screen = 'dashboard';
    save();
    return S.plan ? 'ready' : 'generate';
  }
  /* renew: «ثبت نتیجه و تمرین تازه» (3 a day, admins/owner unlimited) */
  const renewExempt = () => ['admin', 'owner'].includes(account().role);
  function renewUsedToday() { if (S.renewCountDate !== todayKey()) { S.renewCountDate = todayKey(); S.renewCount = 0; } return Number(S.renewCount) || 0; }
  const renewRemaining = () => (renewExempt() ? DAILY_RENEW_LIMIT : Math.max(0, DAILY_RENEW_LIMIT - renewUsedToday()));
  const pickIds = (picks) => {
    const out = [];
    Object.entries(picks || {}).forEach(([key, value]) => { if (key === 'spBase') return; (Array.isArray(value) ? value : [value]).forEach((entry) => { const id = typeof entry === 'string' ? entry : entry && entry.id; if (id) out.push(key + ':' + id); }); });
    return out;
  };
  async function renewDay(reason = 'manual-renew') {
    if (!S.plan || V.preparing) return 'noop';
    if (!renewExempt() && renewRemaining() <= 0) return 'limit';
    const date = S.plan.date || todayKey();
    stopTimers();
    if (onDayFile) { try { save(); onDayFile(date); } catch (error) { console.warn(error); } }
    upsertHistory({ closedAt: new Date().toISOString(), closeReason: reason });
    await ensureContent();
    const day = ensureDay(date);
    if (day && active()) {
      const used = new Set(pickIds(day.picks));
      for (let attempt = 0; attempt < 12; attempt += 1) {
        delete day.picks; delete day.redemittel;
        buildActivities(date);
        if (!pickIds(day.picks).some((id) => used.has(id))) break;
      }
      day.work = {}; day.results = {};
    }
    S.plan = null; S.learningResources = null; S.dataSource = null; S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {};
    V.activeId = null; V.screen = 'dashboard';
    save();
    if (active()) await generatePlan();
    if (!renewExempt()) { renewUsedToday(); S.renewCount = (Number(S.renewCount) || 0) + 1; save(); }
    return 'ok';
  }

  /* ───────────── LEAN4: packs, notebook merge (owner/admin only) ───────────── */
  const deckNormE = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
  const wordDataE = (v) => ({ wort: v.wort, artikel: v.artikel || '', plural: v.plural || '', wortart: v.wortart || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '', koll: arr(v.kollokationen).slice(0, 5), perfekt: v.perfekt || '' });
  function srsAddE(type, ref, data, k, dueToday) {
    const m = M(); const key = type + ':' + ref;
    if (m.srs[key]) return false;
    m.srs[key] = { key, type, ref, data, added: k, stage: 0, due: dueToday ? k : addDays(k, 1), reps: 0, lapses: 0 };
    return true;
  }
  /** site TDM.deckAddEntry on the draft (own entry, due today, no duplicates) */
  function deckAddE(type, data) {
    type = type === 'redemittel' ? 'redemittel' : 'wort';
    const n = deckNormE(type === 'wort' ? data.wort : data.de);
    if (!n) return false;
    if (Object.values(M().srs).some((x) => x.type === type && deckNormE(x.type === 'wort' ? x.data?.wort : x.data?.de) === n)) return false;
    const ref = 'my-' + (n.replace(/[^a-zäöüß0-9]+/g, '-').replace(/^-|-$/g, '') || uid()) + '-' + uid().slice(0, 4);
    const clean = type === 'wort' ? { wort: String(data.wort).trim(), artikel: '', plural: '', wortart: '', bedeutung_fa: data.bedeutung_fa || '', beispiel: data.beispiel || '', koll: [], perfekt: '', custom: true } : { de: String(data.de).trim(), fa: data.fa || '', beispiel: data.beispiel || '', custom: true };
    return srsAddE(type, ref, clean, todayKey(), true);
  }
  /** a review-worthy mistake becomes a notebook entry (correct form, Persian note, the wrong form as example) */
  function leanErrToDeck(e) {
    if (!e || !lean()) return false;
    const de = String(e.correctAnswer || '').trim();
    if (!de || de.length > 220) return false;
    const fa = String(e.explanation || '').trim(); const wrong = String(e.userAnswer || '').trim();
    const ex = wrong ? '✗ ' + wrong : String(e.context || e.question || '').trim().slice(0, 200);
    const ok = /\s/.test(de) ? deckAddE('redemittel', { de, fa, beispiel: ex }) : deckAddE('wort', { wort: de, bedeutung_fa: fa, beispiel: ex });
    if (ok) save();
    return ok;
  }
  /** once per account: the old «اشتباهات» move into the notebook */
  function leanMergeErrors() {
    if (!lean()) return 0;
    const m = M();
    if (m.errorsMerged || !Array.isArray(S.errors)) return 0;
    let n = 0;
    S.errors.forEach((e) => { if (leanErrToDeck(e)) n += 1; });
    m.errorsMerged = new Date().toISOString(); m.errorsMergedCount = n;
    save();
    return n;
  }
  /** the day's words and Redemittel go to the notebook (the removed Wortschatz module used to add them) */
  function leanSeedDay() {
    if (!lean() || !active() || !CT()) return;
    const d = M().days[dayKey()];
    if (!d || !d.picks || d.deckSeeded) return;
    const words = item('lesen', d.picks.lesen)?.vocab || []; const k = d.date;
    words.forEach((v) => srsAddE('wort', (v.artikel ? v.artikel + ' ' : '') + v.wort, wordDataE(v), k));
    if (!d.redemittel) d.redemittel = pickRedemittel(d);
    (d.redemittel || []).forEach((r) => srsAddE('redemittel', r.de, { de: r.de, fa: r.fa, beispiel: r.beispiel || '' }, k));
    d.deckSeeded = true;
    save();
  }
  /** «نوشته‌های من»: the AI writing feedback (or the own Fehlerprotokoll) is kept with the text (day work is pruned after 21 days) */
  function wrSync(d) {
    const r = d?.results?.schreiben;
    if (!r || !r.text) return false;
    const w = d.work?.schreiben; const a = w?.ai?.writing;
    let fb = null;
    if (a && !a.error && Array.isArray(a.errors)) fb = { src: 'ai', errors: a.errors.map((e) => ({ wrong: e.wrong || '', right: e.right || '', why: e.reason_fa || '' })), improved: (a.improved || []).map((x) => ({ original: x.original || '', better: x.better || '' })), summary: a.summary_fa || '', tdn: a.tdn || '', tip: a.tip_fa || '' };
    else if (w?.f) { const errs = [0, 1, 2].map((n) => ({ wrong: w.f['fp_wrong_' + n] || '', right: w.f['fp_right_' + n] || '', why: w.f['fp_why_' + n] || '' })).filter((e) => e.wrong || e.right); if (errs.length) fb = { src: 'self', errors: errs, improved: [], summary: '', tdn: '', tip: '' }; }
    if (!fb || JSON.stringify(r.fb || null) === JSON.stringify(fb)) return false;
    r.fb = fb;
    return true;
  }
  function writings() {
    const days = Object.values(M().days || {}).filter((d) => d.results?.schreiben?.text).sort((a, b) => b.date.localeCompare(a.date));
    let changed = false; days.forEach((d) => { if (wrSync(d)) changed = true; }); if (changed) save();
    return days;
  }
  /** ▶ in content control: today's exercises become that pack; today's progress starts over */
  async function playPack(pk) {
    if (!lean() || !pk) return 'noop';
    if (!active()) return 'inactive';
    await ensureContent();
    const ids = packIds(pk);
    if (!ids.length || ids.some(([kd, id]) => !item(kd, id))) return 'missing';
    const m = M(); const k = S.plan?.date || todayKey(); const d = ensureDay(k); const old = d.picks || {};
    d.picks = { hoeren: pk.hoeren || old.hoeren, lesen: pk.lesen || old.lesen, schreiben: pk.schreiben?.id ? { kind: pk.schreiben.kind, id: pk.schreiben.id } : old.schreiben, sprechen: (pk.sprechen || []).length ? pk.sprechen.slice() : (old.sprechen || []) };
    d.picks.spBase = d.picks.sprechen.length || 1;
    ids.forEach(([kd, id]) => { const u = m.used[kd] || (m.used[kd] = []); if (!u.includes(id)) u.push(id); });
    d.work = {}; d.results = {}; d.redemittel = pickRedemittel(d); d.theme = pk.theme || ''; d.packDay = pk.day; d.deckSeeded = false; d.packAt = new Date().toISOString();
    m.packCur = pk.day;
    if (m.packIgnore && m.packIgnore[pk.day]) m.packIgnore[pk.day] = m.packIgnore[pk.day].filter((x) => x !== k);
    stopTimers();
    S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; V.activeId = null; V.screen = 'dashboard';
    syncPlan(true); refreshPlanDescriptions();
    save();
    return 'ok';
  }
  function setPackOrder(list, fri) { if (!lean() || !Array.isArray(list)) return false; M().packOrder = list.map(Number).filter((x) => x > 0); if (fri) M().packOrderFri = 1; save(); return true; }
  const packOrderFri = () => !!M().packOrderFri;
  const packOrder = () => (Array.isArray(M().packOrder) ? M().packOrder.slice() : null);
  const packIgnore = () => M().packIgnore || {};
  const SK4 = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
  /** true when ↺ on this pack would also reset started work of today's plan (the page asks first) */
  function resetPackTouchesToday(dates) {
    const k = S.plan?.date || todayKey();
    if (!(dates || []).includes(k) || !active()) return false;
    const d = M().days[k];
    return SK4.some((x) => (S.completedActivities || []).includes(x) || (d && d.results && d.results[x]) || (Number(S.activityTimers?.[x]) || 0) > 0);
  }
  /** PACK-RESET: marks of past days are hidden; today's pack also resets today's 4 skills, so finishing again strikes again */
  function resetPackDay(pk, dates) {
    if (!lean()) return false;
    const m = M(); const k = S.plan?.date || todayKey(); const list = (dates || []).filter(Boolean);
    if (list.includes(k) && active()) {
      const d = m.days[k];
      if (d) SK4.forEach((x) => { if (d.results) delete d.results[x]; if (d.work) delete d.work[x]; });
      S.completedActivities = (S.completedActivities || []).filter((x) => !SK4.includes(x));
      SK4.forEach((x) => { if (S.activityProgress) delete S.activityProgress[x]; if (S.activityTimers) delete S.activityTimers[x]; });
      if (V.activeId && SK4.includes(V.activeId)) { stopTimers(); V.activeId = null; V.screen = 'dashboard'; }
      if (m.packIgnore && m.packIgnore[pk]) m.packIgnore[pk] = m.packIgnore[pk].filter((x) => x !== k);
    }
    const others = list.filter((x) => x !== k || !active());
    if (others.length) { m.packIgnore = m.packIgnore || {}; m.packIgnore[pk] = Array.from(new Set([...(m.packIgnore[pk] || []), ...others])); }
    save();
    return true;
  }

  /* ───────────── read models for the pages ───────────── */
  function srsDueCount() { return Object.values(M().srs).filter((x) => x.due <= todayKey()).length; }
  function streak() {
    const dates = new Set((S.history || []).filter((d) => d?.date && (historyNumber(d.time) > 0 || historyNumber(d.comp) > 0)).map((d) => d.date));
    let cursor = todayKey();
    if (!dates.has(cursor)) { cursor = addDays(cursor, -1); if (!dates.has(cursor)) return 0; }
    let n = 0;
    while (dates.has(cursor)) { n += 1; cursor = addDays(cursor, -1); }
    return n;
  }
  function dashboard() {
    const comp = S.completedActivities.length; const tot = S.plan ? S.plan.activities.length : 0;
    const record = S.plan ? upsertHistory() : null;
    save(); // the site writes today's history segment on every dashboard render
    const n = streak();
    if (S.streak !== n) { S.streak = n; save(); }
    return {
      plan: S.plan, completed: new Set(S.completedActivities), timers: S.activityTimers || {}, comp, tot, pct: tot ? Math.round((comp / tot) * 100) : 0,
      next: S.plan ? S.plan.activities.find((a) => !S.completedActivities.includes(a.id)) : null,
      time: record ? record.time : 0, score: record ? historyOptionalNumber(record.score) : null, answered: record ? Math.max(0, historyNumber(record.questionCount)) : 0,
      streak: n, examDate: S.user.examDate || '', user: S.user, mode: curMode(), enrolled: enrolled(), active: active(), program: program(),
      info: { plan: ctxInfo('plan'), free: ctxInfo('free') }, dailyMin: dailyMin(), renewRemaining: renewRemaining(), renewExempt: renewExempt(),
    };
  }

  load();
  return {
    get S() { return S; }, V, MODS, ST: STX, CT, OSD: () => PROG(), setOesdLevel, oesdStarted, item, M, onRemote, save, reload: load, subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    program, enrolled, active, curMode, ensureContent, dayDef, dayMode, weekOf, weekRange, moduleOrder, focusLabel, minFor, minutesFor, dailyMin, dailyHint,
    dayModules, ensureDay, curDay, work, act, stepsFor, volNeed, loadRatio, spList, trimQs, mwOf, userLevel, lowLevel, srsDueCount, buildActivities, applyLevelChange, syncPlan,
    ensureToday, generatePlan, startActivity, review, pauseActivity, go, completeActivity, startNext, stopTimers, setDaily, setWeekFocus, resetWeekFocus,
    moveDayActivity, resetDayOrder, moveWeekdaySkill, setWeekOrder, resetWeekOrder, resetWeekMin, setWeekMin, resetWeekDay, focusToday, weekdayInfo, wdKey, setExamDate, setPhase, setExtra, selectExamPlan, requestPlanChange, setStudyMode, renewDay, dashboard, upsertHistory,
    ensureDailyStudyPreference, syncProfile, refreshPlanDescriptions, dayKey, weekErrors, prevPracticeDay,
    lean, packSeq, playPack, setPackOrder, packOrder, packOrderFri, packIgnore, resetPackDay, resetPackTouchesToday, leanSeedDay, leanMergeErrors, leanErrToDeck, writings,
    get packCur() { return Number(M().packCur) || 0; },
  };
}
