// Review-module logic — hand port of the site engine's SRS cards, Grammatik & Wortschatz, Wiederholung
// (quiz, mistake review), Fehleranalyse / Wochenbericht (weekly metrics, AI weekly analysis, report,
// phase advice) and Extra-Lernzeit (EXTRA-SATZ). Works on the engine's draft state like work.js.

import { today, addDays, normalizeLearningError, ankiSchedule, errorKind, lexemeKey } from './learning.js';
import { MODS, ML, faNum, arr, SRS_STEPS } from './engine.js';
import { catLabel } from './work.js';

export const SX_STRUCT = [
  { id: 'weil', t: 'weil / da + Nebensatz', fa: 'دلیل آوردن؛ فعل صرف‌شده آخر جمله', p: 'Hauptsatz, weil + Subjekt … + Verb', ex: 'Viele Studierende arbeiten neben dem Studium, weil die Mieten stark gestiegen sind.' },
  { id: 'obwohl', t: 'obwohl + Nebensatz', fa: 'تضاد / با وجود اینکه؛ فعل آخر جمله', p: 'Obwohl + Subjekt … + Verb, Verb + Subjekt …', ex: 'Obwohl das Angebot groß ist, nutzen es nur wenige Menschen.' },
  { id: 'dass', t: 'Meinung + dass-Satz', fa: 'بیان نظر با dass؛ فعل آخر جمله', p: 'Ich bin der Meinung, dass + Subjekt … + Verb', ex: 'Ich bin der Meinung, dass digitale Medien den Unterricht verbessern können.' },
  { id: 'relativ', t: 'Relativsatz', fa: 'جمله موصولی (der/die/das …)؛ فعل آخر', p: 'Nomen, der/die/das + … + Verb', ex: 'Das ist ein Problem, das viele junge Menschen betrifft.' },
  { id: 'umzu', t: 'um … zu / damit', fa: 'هدف: um…zu (فاعل یکسان)، damit (فاعل متفاوت)', p: '…, um + … + zu + Infinitiv', ex: 'Man sollte früh mit der Vorbereitung beginnen, um genug Zeit für Wiederholungen zu haben.' },
  { id: 'passiv', t: 'Passiv: werden + Partizip II', fa: 'مجهول؛ تمرکز روی عمل نه انجام‌دهنده', p: 'Subjekt + wird/werden + … + Partizip II', ex: 'In vielen Städten wird der Radverkehr stärker gefördert.' },
  { id: 'konj2', t: 'Konjunktiv II: sollte / könnte / würde', fa: 'پیشنهاد و فرض مؤدبانه', p: 'Subjekt + sollte/könnte/würde + … + Infinitiv', ex: 'Die Universitäten sollten mehr günstige Wohnheimplätze anbieten.' },
  { id: 'jedesto', t: 'je … desto', fa: 'هرچه … بیشتر، … بیشتر', p: 'Je + Komparativ … Verb, desto + Komparativ + Verb …', ex: 'Je früher man mit dem Lernen beginnt, desto besser sind die Ergebnisse.' },
  { id: 'nichtnur', t: 'nicht nur … sondern auch', fa: 'نه‌تنها … بلکه …', p: '… nicht nur + A, sondern auch + B', ex: 'Das Problem betrifft nicht nur Studierende, sondern auch viele Familien.' },
  { id: 'einerseits', t: 'einerseits … andererseits', fa: 'از یک طرف … از طرف دیگر (مقایسه دو جنبه)', p: 'Einerseits + Verb …, andererseits + Verb …', ex: 'Einerseits spart Homeoffice Zeit, andererseits fehlt oft der persönliche Kontakt.' },
  { id: 'zuinf', t: 'Es ist … , … zu + Infinitiv', fa: 'ساختار مصدری با zu', p: 'Es ist wichtig/sinnvoll, … zu + Infinitiv', ex: 'Es ist sinnvoll, sich rechtzeitig über die Prüfung zu informieren.' },
  { id: 'wenn', t: 'wenn + Nebensatz (Bedingung)', fa: 'شرط؛ فعل آخر جمله، بعد فعل جمله اصلی', p: 'Wenn + Subjekt … + Verb, Verb + Subjekt …', ex: 'Wenn mehr Menschen mit dem Fahrrad fahren, sinkt die Belastung der Luft.' },
];
export const sxSt = (id) => SX_STRUCT.find((x) => x.id === id) || SX_STRUCT[0];
const sxNorm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
export function uniqSrs(list) { const seen = new Set(); return list.filter((x) => { if (!x) return false; const d = x.data || {}; const k = x.type + '|' + sxNorm(x.type === 'wort' ? d.wort : d.de); if (seen.has(k)) return false; seen.add(k); return true; }); }
export function uniqErr(list) { const seen = new Set(); return list.filter((e) => { if (!e) return false; const k = sxNorm(e.userAnswer || e.question) + '|' + sxNorm(e.correctAnswer); if (seen.has(k)) return false; seen.add(k); return true; }); }
export const wordData = (v) => ({ wort: v.wort, artikel: v.artikel || '', plural: v.plural || '', wortart: v.wortart || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '', koll: arr(v.kollokationen).slice(0, 5), perfekt: v.perfekt || '' });
export function siteVocabItem(c) {
  const x = c?.data || {};
  return c?.type === 'wort'
    ? { id: 'tdm-' + c.key, word: `${x.artikel ? x.artikel + ' ' : ''}${x.wort}`, meaning_native: x.bedeutung_fa || '', example_sentence: x.beispiel || '', collocations: x.koll || [] }
    : { id: 'tdm-' + (c?.key || ''), word: x.de || '', meaning_native: x.fa || '', example_sentence: x.beispiel || '', collocations: [] };
}
export const errorIsDue = (e) => !e.isMastered && e.nextReview && e.nextReview <= today() && (!e.nextReviewAt || new Date(e.nextReviewAt).getTime() <= Date.now());
const uid = () => Math.random().toString(36).slice(2, 9);

export function createReview(eng, wk) {
  const S = () => eng.S;
  const M = () => eng.M();
  const work = (id) => eng.work(id);

  /* ── SRS ── */
  function srsAdd(type, ref, data, k) { const m = M(); const key = type + ':' + ref; if (m.srs[key]) return; m.srs[key] = { key, type, ref, data, added: k, stage: 0, due: addDays(k, 1), reps: 0, lapses: 0 }; }
  function srsRate(key, ok) { const it = M().srs[key]; if (!it) return; const t = today(); if (ok) { it.stage = Math.min(it.stage + 1, SRS_STEPS.length - 1); it.due = addDays(t, SRS_STEPS[it.stage]); } else { it.stage = 0; it.lapses += 1; it.due = addDays(t, 1); } it.reps += 1; it.last = t; }
  const srsDue = (type, k = today()) => Object.values(M().srs).filter((x) => x.type === type && x.due <= k).sort((a, b) => a.due.localeCompare(b.due));
  const dayWords = (d) => eng.item('lesen', d.picks?.lesen)?.vocab || [];

  /* site word progress: recordVocabularyProgress / rememberVocabUnknown / registerSiteWords */
  const topicKey = () => { const st = S(); return st.user?.subtopic || st.user?.topic || st.contentBankTopic || st.user?.subtopic || st.user?.topic || 'default'; };
  function stableId(item, tk) { const lexeme = lexemeKey(item); if (lexeme) return `word-${lexeme.replace(/\s+/g, '-')}`; const explicit = String(item?.id || item?.word_id || '').trim(); return explicit || `word-${String(tk || 'general').replace(/[^a-z0-9_-]/gi, '-')}-unknown`; }
  function recordVocabularyProgress(item, rating, source, timing = {}) {
    const st = S();
    st.wordProgress = st.wordProgress && typeof st.wordProgress === 'object' ? st.wordProgress : {};
    const tk = topicKey(); const wordId = stableId(item, tk); const lexeme = lexemeKey(item); const key = `lexeme|${lexeme || wordId}`;
    const previous = st.wordProgress[key] || Object.values(st.wordProgress).find((e) => lexemeKey({ word: e?.word }) === lexeme) || {};
    const now = new Date().toISOString();
    st.wordProgress[key] = { key, wordId, lexeme, topicKey: tk, word: String(item.word || item.w || ''), source, firstSeenAt: previous.firstSeenAt || now, lastSeenAt: now, reviewCount: (Number(previous.reviewCount) || 0) + 1, lastRating: Number(rating), knownCount: (Number(previous.knownCount) || 0) + (Number(rating) === 2 ? 1 : 0) };
    wk.recordAnswerPerformance({ skill: 'wortschatz', questionId: wordId, accuracy: [0, 60, 100][Number(rating)] ?? 0, expectedSeconds: Number(timing.expectedSeconds) || 30, actualSeconds: Number(timing.actualSeconds) || 1 });
  }
  function syncSiteWord(c, ok) {
    if (!c) return;
    const it = siteVocabItem(c);
    recordVocabularyProgress(it, ok ? 2 : 0, 'tdm', { expectedSeconds: 30, actualSeconds: 20 });
    if (!ok) { const word = it.word || ''; wk.rememberLearningError({ type: 'wortschatz', category: 'Nicht gewusst', question: 'Flashcard vocabulary', userAnswer: word, correctAnswer: it.meaning_native || '', explanation: it.example_sentence || '', context: (it.collocations || []).join(' - '), source: 'tdm', sourceKey: 'tdm:vocab:' + word }); }
  }
  function registerSiteWords(list) {
    const st = S();
    st.wordProgress = st.wordProgress && typeof st.wordProgress === 'object' ? st.wordProgress : {};
    const now = new Date().toISOString();
    list.forEach((it) => { const lexeme = lexemeKey(it); if (!lexeme) return; const key = `lexeme|${lexeme}`; if (st.wordProgress[key]) return; st.wordProgress[key] = { key, wordId: stableId(it, 'testdaf-method'), lexeme, topicKey: 'testdaf-method', word: it.word, source: 'tdm', firstSeenAt: now, lastSeenAt: now, reviewCount: 0, lastRating: null, knownCount: 0 }; });
  }
  function srsCard(key, ok) { const w = work(); srsRate(key, ok); w.ans['srs:' + key] = ok ? 'ok' : 'no'; syncSiteWord(M().srs[key], ok); eng.save(); }
  function flip(key) { work().checked['flip:' + key] = true; eng.save(); }
  function srsDel(key) { const m = M(); if (!m.srs[key]) return; delete m.srs[key]; eng.save(); }
  function errDel(id) { const st = S(); st.errors = (st.errors || []).filter((e) => e.id !== id); eng.save(); }
  /** Site reviewError(id, rating, timeSpent) on the draft. */
  function reviewError(id, rating, timeSpent) {
    const error = (S().errors || []).find((x) => x.id === id);
    if (!error) return;
    const card = normalizeLearningError(error); const result = ankiSchedule(card, Number(rating)); delete result.label;
    Object.assign(error, card, result, { reviewCount: card.reviewCount + 1, successCount: card.successCount + (Number(rating) >= 2 ? 1 : 0), lastReview: new Date().toISOString() });
    error.history.push({ rating: Number(rating), quality: Number(rating), date: today(), at: new Date().toISOString(), timeSpent: Number(timeSpent) || 0, intervalDays: result.intervalDays });
  }
  function errReview(id, ok) { const w = work(); reviewError(id, ok ? 2 : 0, 30); w.ans['err:' + id] = ok ? 'ok' : 'no'; eng.save(); }

  /* ── Grammatik & Wortschatz ── */
  function grammarOfWeek(week) { const g = eng.ST().grammar; return g[(Math.max(1, week) - 1) % g.length]; }
  function wortschatzEnter(key, d) {
    const k = d.date;
    if (key === 'alt') {
      const w = work();
      if (!w.altKeys) { w.altKeys = Object.values(M().srs).filter((x) => x.type === 'wort' && x.added < k).sort(() => 0.5 - Math.random()).slice(0, 8).map((x) => x.key); eng.save(); }
    } else if (key === 'neu') {
      const words = dayWords(d);
      words.forEach((v) => srsAdd('wort', (v.artikel ? v.artikel + ' ' : '') + v.wort, wordData(v), k));
      registerSiteWords(words.map((v) => siteVocabItem({ type: 'wort', key: 'wort:' + v.wort, data: wordData(v) })));
      eng.save();
    } else if (key === 'redemittel') {
      (d.redemittel || []).forEach((r) => srsAdd('redemittel', r.de, { de: r.de, fa: r.fa, beispiel: r.beispiel || '' }, k));
      eng.save();
    }
  }
  function aiSentences() {
    const w = work(); const d = eng.curDay(); const s = [0, 1, 2, 3, 4].map((n) => String(w.f['satz_' + n] || '').trim()).filter(Boolean);
    if (!s.length) return false;
    wk.aiCallPublic('saetze', '/v1/method/sentences-feedback', { sentences: s, grammar: grammarOfWeek(d.week).title });
    return true;
  }

  /* ── Wiederholung ── */
  function wiederholungEnter(key, d) {
    const w = work(); const k = d.date;
    if (key === 'woerter' && !w.dueW) { w.dueW = uniqSrs(srsDue('wort', k)).slice(0, 15).map((x) => x.key); eng.save(); }
    if (key === 'redemittel' && !w.dueR) { w.dueR = uniqSrs(srsDue('redemittel', k)).slice(0, 12).map((x) => x.key); eng.save(); }
    if (key === 'test' && !w.quiz) { w.quiz = { qs: quizBuild(), ans: {}, done: false }; eng.save(); }
  }
  const dueErrorsForReview = () => { const errs = (S().errors || []).filter(errorIsDue); return uniqErr([...errs.filter((e) => errorKind(e) === 'grammar'), ...errs.filter((e) => errorKind(e) !== 'grammar')]).slice(0, 8); };
  function quizBuild() {
    const m = M(); const words = Object.values(m.srs).filter((x) => x.type === 'wort'); const red = Object.values(m.srs).filter((x) => x.type === 'redemittel'); const qs = [];
    const pick = (list, n) => list.slice().sort(() => 0.5 - Math.random()).slice(0, n);
    pick(words.filter((x) => x.data.artikel), 2).forEach((x) => qs.push({ id: 'a' + uid(), type: 'mc', q: `Welcher Artikel? ___ ${x.data.wort}`, options: ['der', 'die', 'das'], answer: ['der', 'die', 'das'].indexOf(x.data.artikel) }));
    pick(words, 2).forEach((x) => { const others = pick(words.filter((y) => y.key !== x.key), 2).map((y) => y.data.wort); if (others.length < 2) return; const opts = pick([x.data.wort, ...others], 3); qs.push({ id: 'm' + uid(), type: 'mc', q: `„${x.data.bedeutung_fa}“ = ?`, options: opts, answer: opts.indexOf(x.data.wort) }); });
    pick(red, 2).forEach((x) => { const others = pick(red.filter((y) => y.key !== x.key), 2).map((y) => y.data.de); if (others.length < 2) return; const opts = pick([x.data.de, ...others], 3); qs.push({ id: 'r' + uid(), type: 'mc', q: `„${x.data.fa}“ = ?`, options: opts, answer: opts.indexOf(x.data.de) }); });
    return qs.filter((q) => q.answer >= 0);
  }
  function quizAns(qi, oi) { const t = work().quiz; if (!t || t.done) return; t.ans[qi] = oi; eng.save(); }
  function quizDone() {
    const t = work().quiz; if (!t) return;
    t.done = true;
    const c = t.qs.filter((q, n) => t.ans[n] === q.answer).length;
    t.pct = t.qs.length ? Math.round((c / t.qs.length) * 100) : 0;
    t.qs.forEach((q, n) => wk.recordAnswerPerformance({ skill: 'wiederholung', questionId: `tdm-${eng.dayKey()}-quiz-${q.id}`, accuracy: t.ans[n] === q.answer ? 100 : 0, expectedSeconds: 20, actualSeconds: 20 }));
    eng.save();
  }

  /* ── Fehleranalyse & Wochenbericht ── */
  function weekMetrics(week) {
    const m = M(); const [from, to] = eng.weekRange(week); const days = Object.values(m.days).filter((d) => d.date >= from && d.date <= to);
    const avg = (list) => { const v = list.filter((x) => Number.isFinite(x)); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; };
    const pick = (mod, field) => days.map((d) => d.results?.[mod]?.[field]).filter((x) => x != null).map(Number);
    const evalDay = days.find((d) => d.mode === 'eval');
    const ev = (mod, f) => { const v = evalDay?.results?.[mod]?.[f]; return v == null ? null : Number(v); };
    const errs = m.log.filter((x) => x.date >= from && x.date <= to); const cat = {};
    errs.forEach((x) => { const k = `${MODS[x.skill]?.de || x.skill} · ${catLabel(x.skill, x.cat)}`; cat[k] = (cat[k] || 0) + 1; });
    const seconds = days.reduce((s, d) => s + Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0), 0);
    const doneMods = days.reduce((s, d) => s + Object.keys(d.results || {}).filter((x) => x !== 'extra').length, 0); const plannedMods = days.length * 6;
    return { week, from, to, days: days.length, hoeren: ev('hoeren', 'pct') ?? avg(pick('hoeren', 'pct')), lesen: ev('lesen', 'pct') ?? avg(pick('lesen', 'pct')), schreiben: ev('schreiben', 'score') ?? avg(pick('schreiben', 'score')), sprechen: ev('sprechen', 'score') ?? avg(pick('sprechen', 'score')), hoerenAvg: avg(pick('hoeren', 'pct')), lesenAvg: avg(pick('lesen', 'pct')), minutes: Math.round(seconds / 60), completion: plannedMods ? Math.round((doneMods / plannedMods) * 100) : 0, errors: errs.length, cats: Object.entries(cat).sort((a, b) => b[1] - a[1]) };
  }
  function prevWeek(week) { if (week < 1) return null; const p = weekMetrics(week - 1); return p.days ? p : null; }
  function toggleTop(label) { const w = work(); w.f.top = w.f.top || []; const i = w.f.top.indexOf(label); if (i >= 0) w.f.top.splice(i, 1); else if (w.f.top.length < 3) w.f.top.push(label); else return null; wk.scheduleSave(); return w.f.top.includes(label); }
  const weeklyAI = (d) => (d.work.fehleranalyse?.ai?.week?.top_errors ? d.work.fehleranalyse.ai.week : d.work.wochenbericht?.ai?.week?.top_errors ? d.work.wochenbericht.ai.week : null);
  function runWeekly() {
    const d = eng.curDay(); const cur = weekMetrics(d.week); const prev = prevWeek(d.week);
    const errors = eng.weekErrors(d.week).slice(-60).map((e) => ({ category: String(e.category || '').slice(0, 110), question: String(e.question || '').slice(0, 280), wrong: String(e.userAnswer || '').slice(0, 280), right: String(e.correctAnswer || '').slice(0, 280) }));
    wk.aiCallPublic('week', '/v1/method/weekly-analysis', { week: d.week, metrics: cur, previous: prev, category_counts: Object.fromEntries(cur.cats), errors }, (r, w) => {
      if (!(w.f.top || []).length) w.f.top = (r.top_errors || []).map((t) => t.label);
      (r.weaknesses || []).forEach((x, n) => { if (!w.f['weak_' + n]) w.f['weak_' + n] = x.label_fa; });
    });
  }
  function fehleranalyseEnter(key) { const w = work(); if (key === 'wiederholung' && !w.dueAll) { w.dueAll = [...srsDue('wort'), ...srsDue('redemittel')].slice(0, 20).map((x) => x.key); eng.save(); } }
  /** Wochenbericht: fields prefilled from the Fehleranalyse choices, else from the AI analysis. */
  function prefillReport(d) {
    const w = work(); const fw = d.work.fehleranalyse || { f: {} }; const ai = weeklyAI(d);
    if (w.f.freq_0 === undefined) { const top = (fw.f.top || []).length ? fw.f.top : (ai?.top_errors || []).map((t) => t.label); if (top.length) top.forEach((t, n) => { w.f['freq_' + n] = t; }); }
    if (w.f.weak_0 === undefined) [0, 1, 2].forEach((n) => { const v = fw.f['weak_' + n] || ai?.weaknesses?.[n]?.label_fa; if (v) w.f['weak_' + n] = v; });
    if (w.f.goal === undefined && ai?.goal_fa) w.f.goal = ai.goal_fa;
  }
  function saveReport() {
    const d = eng.curDay(); const w = work(); const m = M(); const fw = d.work.fehleranalyse || { f: {} }; const cur = weekMetrics(d.week); const r = weeklyAI(d);
    m.weekly['W' + d.week] = { week: d.week, from: cur.from, to: cur.to, metrics: cur, frequent: [0, 1, 2].map((n) => w.f['freq_' + n] || (fw.f.top || [])[n] || '').filter(Boolean), weak: [0, 1, 2].map((n) => w.f['weak_' + n] || fw.f['weak_' + n] || '').filter(Boolean), goal: w.f.goal || '', success: w.f.success || '', schreibenNote: w.f.schreiben || '', sprechenNote: w.f.sprechen || '', plan: r?.plan_fa || [], progress: r?.progress_fa || '', savedAt: new Date().toISOString(), phase: m.phase, diag: d.week === 0 };
    eng.save();
  }
  function phaseAdvice(cur) {
    const m = M(); const vals = [cur.hoeren, cur.lesen, cur.schreiben, cur.sprechen];
    if (vals.some((v) => v == null)) return null;
    const min = Math.min(...vals);
    if (m.phase === 1 && min >= 55 && cur.completion >= 70) return { to: 2, text: 'نتایج این هفته برای ورود به Phase 2 (تقویت مهارت آزمونی) کافی است.' };
    if (m.phase === 2 && min >= 65 && cur.completion >= 70 && cur.week >= 5) return { to: 3, text: 'نتایج نشان می‌دهد آماده شبیه‌سازی کامل آزمون (Phase 3) هستی.' };
    return { to: null, text: `هنوز در Phase ${m.phase} بمان؛ ورود به مرحله بعد باید بر اساس عملکرد واقعی باشد (حداقل ${m.phase === 1 ? '۵۵' : '۶۵'}٪ در هر مهارت و انجام حداقل ۷۰٪ فعالیت‌ها).` };
  }

  /* ── Extra-Lernzeit (EXTRA-SATZ) ── */
  function sxBuild(d) {
    const k = d.date; const m = M(); const wd = (d.work || {}).wiederholung || {};
    const recent = (type) => Object.values(m.srs).filter((x) => x.type === type).sort((a, b) => String(b.added).localeCompare(String(a.added)));
    const pickSrs = (keys, type, n) => { let l = uniqSrs((keys || []).map((x) => m.srs[x])); if (!l.length) l = uniqSrs(srsDue(type, k)); if (l.length < n) l = uniqSrs([...l, ...recent(type)]); return l.slice(0, n).map((x) => x.key); };
    const due = (S().errors || []).filter((e) => errorIsDue(e) && e.correctAnswer);
    let errs = uniqErr([...due.filter((e) => errorKind(e) === 'grammar'), ...due.filter((e) => errorKind(e) !== 'grammar')]);
    if (errs.length < 3) errs = uniqErr([...errs, ...(S().errors || []).filter((e) => e.correctAnswer).slice().reverse()]);
    const off = Math.abs([...String(k)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7)) % SX_STRUCT.length;
    let n = 0; const st = () => { const id = SX_STRUCT[(off + n) % SX_STRUCT.length].id; n += 1; return id; };
    return { woerter: pickSrs(wd.dueW, 'wort', 5).map((key) => ({ key, st: st() })), redemittel: pickSrs(wd.dueR, 'redemittel', 4).map((key) => ({ key, st: st() })), fehler: errs.slice(0, 3).map((e) => ({ id: e.id, st: st() })) };
  }
  function extraEnter(d) { const w = work(); if (!w.sx) { w.sx = sxBuild(d); eng.save(); } }

  return {
    srsAdd, srsRate, srsDue, dayWords, srsCard, flip, srsDel, errDel, errReview, reviewError, grammarOfWeek, wortschatzEnter, aiSentences, registerSiteWords, syncSiteWord,
    wiederholungEnter, dueErrorsForReview, quizBuild, quizAns, quizDone, weekMetrics, prevWeek, toggleTop, weeklyAI, runWeekly, fehleranalyseEnter, prefillReport, saveReport, phaseAdvice,
    sxBuild, extraEnter, prevPracticeDay: eng.prevPracticeDay, ML, faNum,
  };
}
