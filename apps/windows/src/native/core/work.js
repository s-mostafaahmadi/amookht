// Module work tools — hand port of the site engine's shared lesson logic (testdaf-method.js):
// answers and checking, question scores, error categories and the error log, results, model-answer
// gates and hints, self-checks and ratings, unclear sentences, and the AI analysis layer with its
// retry queue (AIFB). Everything works on the engine's draft state and its work(id) records.

import { today } from './learning.js';
import { normalizeLearningError } from './learning.js';
import { ML, MODS, arr, faNum } from './engine.js';

export const JNT = [['ja', 'Ja'], ['nein', 'Nein'], ['nicht im text', 'Text sagt dazu nichts']];
export const CATS = {
  hoeren: [['wortschatz', 'Wortschatz', 'واژگان: کلمه را تشخیص ندادم'], ['verstaendnis', 'Verständnis', 'درک مفهوم: کلمات را شناختم اما معنی جمله را نفهمیدم'], ['grammatik', 'Grammatik', 'گرامر: ساختار یا ارتباط اجزا را اشتباه فهمیدم']],
  lesen: [['wortschatz', 'Wortschatz', 'واژگان'], ['argumentation', 'Argumentation', 'درک استدلال'], ['details', 'Details', 'جزئیات'], ['eile', 'Unachtsamkeit', 'بی‌دقتی و عجله'], ['grammatik', 'Grammatik/Satzbau', 'گرامر و ساختار جمله']],
  schreiben: [['grammatik', 'Grammatik', 'گرامر'], ['wortschatz', 'Wortschatz', 'واژگان'], ['konnektoren', 'Konnektoren', 'حروف ربط'], ['struktur', 'Struktur', 'ساختار'], ['aufgabe', 'Aufgabenbezug', 'ارتباط با موضوع']],
  sprechen: [['pausen', 'Lange Pausen', 'مکث‌های طولانی'], ['wiederholung', 'Wortwiederholungen', 'تکرار کلمات'], ['verbposition', 'Verbposition', 'اشتباه در جایگاه فعل'], ['unvollstaendig', 'Unvollständige Sätze', 'جملات ناقص'], ['fortsetzung', 'Diskussion nicht fortgesetzt', 'ناتوانی در ادامه بحث']],
};
export const catLabel = (skill, id) => (CATS[skill]?.find((c) => c[0] === id) || [null, 'Unkategorisiert'])[1];
export const wordsIn = (t) => (String(t || '').match(/[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß'-]*/g) || []).length;

export function isCorrect(q, a) {
  if (a === undefined || a === null || a === '') return false;
  if (q.type === 'mc' || q.type === 'match') return Number(a) === Number(q.answer);
  if (q.type === 'rf') return String(a) === String(q.answer);
  if (q.type === 'jnt') return String(a) === String(q.answer);
  if (q.type === 'gap') { const n = (x) => String(x || '').trim().toLowerCase().replace(/ß/g, 'ss').replace(/[^a-zäöü]/g, ''); return n(a) !== '' && arr(q.answer).some((x) => n(x) === n(a)); }
  return false;
}
export function correctLabel(q) {
  if (q.type === 'mc' || q.type === 'match') return q.options[q.answer];
  if (q.type === 'rf') return q.answer ? 'Richtig' : 'Falsch';
  if (q.type === 'jnt') return (JNT.find((x) => x[0] === q.answer) || [])[1] || q.answer;
  if (q.type === 'gap') return arr(q.answer).join(' / ');
  return q.answer;
}
export function answerLabel(q, a) {
  if (a === undefined || a === null || a === '') return '—';
  if (q.type === 'mc' || q.type === 'match') return q.options[Number(a)] ?? '—';
  if (q.type === 'rf') return String(a) === 'true' ? 'Richtig' : 'Falsch';
  if (q.type === 'jnt') return (JNT.find((x) => x[0] === a) || [])[1] || a;
  return a;
}

const AI_TIMEOUT = { text: 70000, speaking: 140000 };
const RETRY_STEPS = [60, 180, 600];
const RETRY_MAX = 4;

export function createWork(eng, { bridge, account, onChange }) {
  const S = () => eng.S;
  const work = (id) => eng.work(id);
  const act = () => eng.act();
  const changed = () => onChange && onChange();
  let saveT = null;
  const scheduleSave = () => { clearTimeout(saveT); saveT = setTimeout(() => eng.save(), 700); };

  /* ── current items ── */
  function currentHoerenItem() {
    if (act()?.id === 'extra') { const id = work('extra').replay; return id ? eng.item('hoeren', id) : null; }
    const d = eng.curDay();
    return d.picks ? eng.item('hoeren', d.picks.hoeren) : null;
  }
  function questionsFor(set) {
    const d = eng.curDay();
    if (set === 'h') return eng.trimQs(currentHoerenItem()?.questions) || null;
    if (set === 'l') return eng.trimQs(eng.item('lesen', d.picks?.lesen)?.questions) || null;
    return null;
  }

  /* ── site recordAnswerPerformance / rememberLearningError on the draft ── */
  function recordAnswerPerformance({ skill, questionId, accuracy, expectedSeconds, actualSeconds }) {
    const st = S();
    if (!st.plan) return null;
    st.answerPerformance = Array.isArray(st.answerPerformance) ? st.answerPerformance : [];
    const planId = st.plan.id || `plan-${st.plan.date || today()}`;
    const id = String(questionId || `question-${Date.now()}`);
    const key = `${planId}:${skill}:${id}`;
    const topicKey = st.user?.subtopic || st.user?.topic || st.contentBankTopic || 'default';
    const rec = { key, planId, date: st.plan.date || today(), topicKey, skill: String(skill || 'other'), questionId: id, accuracy: Math.max(0, Math.min(100, Number(accuracy) || 0)), expectedSeconds: Math.max(1, Math.round(Number(expectedSeconds) || 60)), actualSeconds: Math.max(1, Math.round(Number(actualSeconds) || 1)), answeredAt: new Date().toISOString() };
    const ratio = Math.min(1, rec.expectedSeconds / rec.actualSeconds);
    rec.score = Math.round(rec.accuracy * (0.8 + 0.2 * ratio));
    const i = st.answerPerformance.findIndex((x) => x.key === key);
    if (i >= 0) st.answerPerformance[i] = rec; else st.answerPerformance.push(rec);
    return rec;
  }
  function worthReview(err) {
    const src = String(err.source || ''); const qt = String(err.qtype || '').toLowerCase();
    if (['coach', 'mini_test', 'grammar', 'hoeren'].includes(src)) return false;
    if (['mc', 'rf', 'jnt', 'match', 'tf', 'multiple_choice', 'true_false', 'richtig_falsch', 'selfcheck'].includes(qt)) return false;
    if (!String(err.correctAnswer || '').trim() && !String(err.explanation || '').trim()) return false;
    return true;
  }
  function rememberLearningError(err) {
    const st = S();
    if (!err || !worthReview(err)) return false;
    try { if (eng.lean && eng.lean()) eng.leanErrToDeck(err); } catch (e) { console.warn(e); } // LEAN4: owner/admin → phrase notebook
    st.errors = Array.isArray(st.errors) ? st.errors : [];
    const sourceKey = err.sourceKey || [err.type, err.category, err.userAnswer, err.correctAnswer, err.question].join('|');
    const existing = st.errors.find((x) => (x.sourceKey || '') === sourceKey);
    if (existing) {
      const n = normalizeLearningError(existing);
      Object.assign(existing, n, { mistakeCount: n.mistakeCount + 1, lastMistakeAt: new Date().toISOString(), nextReview: today(), nextReviewAt: null, isMastered: false, severity: Math.max(Number(existing.severity) || 1, Number(err.severity) || 1) });
      return true;
    }
    st.errors.push(normalizeLearningError({
      type: err.type || 'practice', category: err.category || err.type || 'practice', question: err.question || '', userAnswer: String(err.userAnswer || '').slice(0, 800), correctAnswer: String(err.correctAnswer || '').slice(0, 800),
      explanation: err.explanation || '', context: err.context || '', source: err.source || 'auto', severity: err.severity || 1, sourceKey, createdAt: new Date().toISOString(), planId: st.plan?.id || null, mistakeCount: 1,
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), nextReview: today(), nextReviewAt: null, isMastered: false, history: [],
    }));
    return true;
  }

  /* ── answers ── */
  function qScore(set, qs) {
    const w = work(); let correct = 0; let total = 0;
    qs.forEach((q) => { total += 1; const a = w.ans[set + ':' + q.id]; if (q.type === 'short' ? w.self['short:' + set + ':' + q.id] === true : isCorrect(q, a)) correct += 1; });
    return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
  }
  function setAnswer(set, qid, val) { const w = work(); if (w.checked[set]) return; w.ans[set + ':' + qid] = val; scheduleSave(); }
  const unansweredCount = (set) => { const w = work(); return (questionsFor(set) || []).filter((q) => q.type !== 'short' && w.ans[set + ':' + q.id] === undefined).length; };
  function check(set) {
    const w = work();
    if (w.checked[set]) return;
    const qs = questionsFor(set);
    if (!qs) return;
    w.checked[set] = true; w.checkedAt = w.checkedAt || {}; w.checkedAt[set] = Date.now();
    const secsPer = Math.max(20, Math.round((w.secs[w.step || 0] || 60) / Math.max(1, qs.length)));
    const skill = act().id;
    qs.forEach((q) => { if (q.type === 'short') return; recordAnswerPerformance({ skill, questionId: `tdm-${eng.dayKey()}-${set}-${q.id}`, accuracy: isCorrect(q, w.ans[set + ':' + q.id]) ? 100 : 0, expectedSeconds: 60, actualSeconds: secsPer }); });
    eng.save();
  }
  const wrongQuestions = (set, qs) => { const w = work(); return qs.filter((q) => (q.type === 'short' ? w.self['short:' + set + ':' + q.id] === false : !isCorrect(q, w.ans[set + ':' + q.id]))); };

  /* ── small inputs ── */
  const setField = (key, value) => { work().f[key] = value; scheduleSave(); };
  const setSelf = (key, val) => { work().self[key] = val; scheduleSave(); };
  const setRate = (key, n) => { work().rate[key] = n; scheduleSave(); };
  const setCat = (key, id) => { const w = work(); w.cat[key] = w.cat[key] === id ? null : id; scheduleSave(); return w.cat[key]; };
  function unlock(target) {
    const w = work(); w.help = w.help || {};
    const t = String(target || ''); const i = t.indexOf(':'); const kind = t.slice(0, i); const id = t.slice(i + 1);
    if (kind === 'rv') { w.checked['r_' + id] = true; if (!w.help[id]) w.help[id] = 'peek'; } else if (kind === 'qh') w.help['q:' + id] = 'hint';
    eng.save();
  }
  const toggleReveal = (id) => { const w = work(); w.checked['r_' + id] = !w.checked['r_' + id]; eng.save(); };

  /* ── model-answer gates (GATES) ── */
  const GATES = {
    hglobal: () => ({ keys: ['g_thema', 'g_problem', 'g_ziel'], min: 4 }),
    hsel: () => ({ keys: ['s_zahlen', 's_gruende', 's_vorteile', 's_nachteile', 's_beispiele', 's_schlussfolgerungen'], need: 3, min: 2 }),
    hsum: () => ({ rec: ['zusammenfassung'], keys: ['summary_notes'], min: 25 }),
    lsum: () => ({ keys: ['summary'], min: 15 }),
    xsum: () => ({ keys: ['x_summary'], min: 15 }),
    smodel: () => { const d = eng.curDay(); return { words: Math.round((d.picks?.schreiben?.kind === 'grafik' ? 100 : eng.mwOf(d)) * 0.6) }; },
    sana: () => ({ keys: ['a_problem', 'a_vorteile', 'a_nachteile', 'a_betroffene', 'a_meinung'], need: 3, min: 3 }),
    gana: () => ({ keys: ['g_titel', 'g_maxmin', 'g_trend', 'g_text', 'g_vergleich'], need: 3, min: 3 }),
    sout: () => ({ keys: ['o_einleitung', 'o_hauptteil', 'o_gegen', 'o_meinung', 'o_schluss'], need: 3, min: 3 }),
    sphelp: (t) => ({ keys: ['kw_' + t], min: 8 }),
    spmodel: (t) => ({ rec: ['try1_' + t] }),
    exmodel: (t) => ({ rec: ['exam_' + t, 'eval_' + t] }),
    wmodel: () => ({ rec: ['wiedergabe'], keys: ['wiedergabe'], min: 25 }),
  };
  function gateFor(id) { const m = String(id).match(/^([a-z]+?)(\d*)$/); const g = m && GATES[m[1]]; return g ? g(Number(m[2]) || 0) : null; }
  function gateOk(g) {
    if (!g) return true;
    const w = work(); const f = w.f || {}; const len = (k) => String(f[k] || '').trim().length;
    if (g.rec && g.rec.some((k) => w.rec?.[k])) return true;
    if (g.words && wordsIn(f.text) >= g.words) return true;
    if (g.keys && g.keys.filter((k) => len(k) >= (g.min || 3)).length >= (g.need || (g.rec ? 1 : g.keys.length))) return true;
    return false;
  }

  /* ── unclear sentences ── */
  function addExtraError(n) {
    const w = work(); const it = currentHoerenItem();
    w.extraErrors = w.extraErrors || [];
    const text = act().id === 'hoeren' && n >= 0 ? it?.segments?.[n]?.text : '';
    w.extraErrors.push({ id: 'x' + Math.random().toString(36).slice(2, 9), text: text || '', cat: null, note: '' });
    eng.save();
    if (text && aiOn()) explainExtra(w.extraErrors.length - 1);
  }
  const extraErr = (i, field, value) => { const w = work(); if (!w.extraErrors?.[i]) return; w.extraErrors[i][field] = value; scheduleSave(); };
  const extraErrCat = (i, cat) => { const x = work().extraErrors?.[i]; if (!x) return null; x.cat = x.cat === cat ? null : cat; scheduleSave(); return x.cat; };
  const removeExtraErr = (i) => { work().extraErrors?.splice(i, 1); eng.save(); };

  /* ── error log + results ── */
  function logErrors(id, d, w) {
    const m = eng.M();
    const add = (skill, cat, entry) => {
      const type = cat === 'grammatik' ? 'grammatik' : cat === 'wortschatz' ? 'wortschatz' : skill;
      rememberLearningError({ type, category: `${MODS[skill]?.de || skill} · ${catLabel(skill, cat)}`, question: entry.question || '', userAnswer: entry.userAnswer || '', correctAnswer: entry.correctAnswer || '', explanation: entry.explanation || '', context: entry.context || '', qtype: entry.qtype || '', source: 'tdm', sourceKey: `tdm:${d.date}:${id}:${entry.key}` });
      m.log.push({ date: d.date, week: d.week, skill, cat: cat || 'none' });
    };
    if (id === 'hoeren' || id === 'lesen') {
      const set = id === 'hoeren' ? 'h' : 'l'; const qs = questionsFor(set) || []; const qa = w.ai?.[set === 'h' ? 'hq' : 'lq']; const why = new Map((qa?.items || []).map((x) => [x.id, x]));
      if (w.checked[set]) qs.forEach((q) => { const a = w.ans[set + ':' + q.id]; const wrong = q.type === 'short' ? w.self['short:' + set + ':' + q.id] === false : !isCorrect(q, a); if (wrong) { const x = why.get(q.id); add(id, w.cat['q:' + q.id] || x?.category || null, { key: q.id, qtype: q.type, question: q.q, userAnswer: answerLabel(q, a), correctAnswer: correctLabel(q), explanation: [x?.why_fa || q.explain_fa || '', x?.tip_fa ? '💡 ' + x.tip_fa : ''].filter(Boolean).join(' '), context: q.evidence || '' }); } });
      (qa?.extra || []).forEach((e, n) => add(id, e.category || null, { key: 'extra' + n, question: ML('جمله دشوار متن', 'Schwieriger Satz'), userAnswer: '', correctAnswer: e.sentence, explanation: e.explanation_fa || '', context: '' }));
      (w.extraErrors || []).forEach((x) => { if (!x.text) return; const r = w.ai?.['sx_' + x.id]; add(id, x.cat || r?.category || null, { key: x.id, question: x.text, correctAnswer: r?.meaning_fa || x.note || '', explanation: r ? [r.grammar_fa, r.tip_fa].filter(Boolean).join(' · ') : x.note || '', context: ML('جمله نامفهوم', 'Unverständlicher Satz') }); });
    }
    if (id === 'schreiben') for (let r = 0; r < 3; r += 1) { const wrong = w.f['fp_wrong_' + r]; const right = w.f['fp_right_' + r]; if (wrong || right) add('schreiben', w.cat['fp_' + r] || 'grammatik', { key: 'fp' + r, question: ML('اشتباه نوشتاری', 'Schreibfehler'), userAnswer: wrong || '', correctAnswer: right || '', explanation: w.f['fp_why_' + r] || '' }); }
    if (id === 'sprechen') {
      Object.entries(w.self).forEach(([k, v]) => { if (k.startsWith('sp:') && v === true) { const [, t, cat] = k.split(':'); add('sprechen', cat, { key: `${t}-${cat}`, qtype: w.f['an_note_' + t] ? '' : 'selfcheck', question: ML('مشکل در صحبت', 'Sprechproblem') + ': ' + catLabel('sprechen', cat), correctAnswer: w.f['an_note_' + t] || '', explanation: CATS.sprechen.find((c) => c[0] === cat)?.[2] || '' }); } });
      Object.entries(w.ai || {}).forEach(([slot, r]) => { if (!slot.startsWith('sp_') || slot === 'sp_zusammenfassung' || !Array.isArray(r?.errors)) return; r.errors.slice(0, 3).forEach((e, n) => add('sprechen', 'verbposition', { key: `${slot}-${n}`, question: ML('اشتباه گفتاری', 'Sprechfehler'), userAnswer: e.wrong, correctAnswer: e.right, explanation: e.reason_fa || '' })); });
    }
  }
  function avgRate(w, prefix, keys) { const v = keys.map((k) => Number(w.rate[prefix + k]) || 0).filter(Boolean); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 20) : null; }
  function analysedCount(w) {
    const qa = w.ai?.lq || w.ai?.hq;
    return Object.keys(w.cat).filter((k) => k.startsWith('q:') && w.cat[k]).length + (qa?.extra || []).length + (w.extraErrors || []).filter((x) => x.text && (x.cat || w.ai?.['sx_' + x.id]?.meaning_fa)).length;
  }
  function computeResults(id, d, w) {
    if (id === 'hoeren') { const qs = currentHoerenItem()?.questions || []; const sc = w.checked.h ? qScore('h', qs) : null; return { pct: sc?.pct ?? null, correct: sc?.correct, total: sc?.total, understanding: Number(w.f.understanding) || null, plays: w.plays || 0, summary: !!w.rec?.zusammenfassung }; }
    if (id === 'lesen') { const qs = eng.item('lesen', d.picks?.lesen)?.questions || []; const sc = w.checked.l ? qScore('l', qs) : null; return { pct: sc?.pct ?? null, correct: sc?.correct, total: sc?.total, analysed: analysedCount(w), summary: w.f.summary || '' }; }
    if (id === 'schreiben') { const text = w.f.text || ''; const score = avgRate(w, 'k_', ['grammatik', 'wortschatz', 'konnektoren', 'struktur', 'aufgabe']); if (score != null) recordAnswerPerformance({ skill: 'schreiben', questionId: `tdm-${d.date}-schreiben`, accuracy: score, expectedSeconds: 1500, actualSeconds: Math.max(60, w.secs.reduce((s, x) => s + (x || 0), 0)) }); return { score, words: wordsIn(text), kind: d.picks?.schreiben?.kind, itemId: d.picks?.schreiben?.id, text: text.slice(0, 6000) }; }
    if (id === 'sprechen') { const n = eng.spList(d).length || 1; const scores = []; for (let t = 0; t < n; t += 1) { const s = avgRate(w, `s${t}_`, ['fluss', 'genau', 'struktur', 'aufgabe']); if (s != null) scores.push(s); } const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null; if (score != null) recordAnswerPerformance({ skill: 'sprechen', questionId: `tdm-${d.date}-sprechen`, accuracy: score, expectedSeconds: 900, actualSeconds: Math.max(60, w.secs.reduce((s, x) => s + (x || 0), 0)) }); return { score, recordings: Object.keys(w.rec).length, issues: Object.entries(w.self).filter(([k, v]) => k.startsWith('sp:') && v === true).length }; }
    if (id === 'wortschatz') { const it = eng.item('lesen', d.picks?.lesen); return { words: (it?.vocab || []).length, sentences: [0, 1, 2, 3, 4].filter((i) => (w.f['satz_' + i] || '').trim()).length }; }
    if (id === 'wiederholung') { const t = w.quiz; return { reviewed: Object.keys(w.ans).length, quiz: t?.done ? t.pct : null }; }
    if (id === 'fehleranalyse') return { top: w.f.top || [], weak: w.f.weak || '' };
    if (id === 'wochenbericht') return { saved: !!eng.M().weekly['W' + d.week] };
    if (id === 'extra') return { sentences: Object.keys(w.f).filter((k) => /^sx_/.test(k) && String(w.f[k] || '').trim()).length, cards: 0, minutes: Number(act()?.dur) || 0 };
    return {};
  }
  /** Site TDM.finish: results + error log, then the activity counts as done. */
  function finish(recorder) {
    const a = act();
    if (!a) return;
    const d = eng.curDay(); const w = work();
    const res = computeResults(a.id, d, w);
    d.results[a.id] = { ...res, help: Object.keys(w.help || {}).length, seconds: Number(S().activityTimers?.[a.id]) || 0, mode: d.mode, at: new Date().toISOString() };
    if (!w.done) logErrors(a.id, d, w);
    w.done = true;
    if (recorder) { try { recorder.flushTrash(w); recorder.dropAnalysed(w); } catch (e) { console.warn(e); } }
    eng.completeActivity(a.id);
  }

  /* ── AI layer (AIFB) ── */
  const BUSY = new Set(); let downUntil = 0; let statusChecked = false; const retryT = {};
  const busyKey = (slot) => `${eng.dayKey()}:${act()?.id}:${slot}`;
  const aiBusy = (slot) => BUSY.has(busyKey(slot));
  const aiOn = () => !!account().premium;
  const aiDown = () => Date.now() < downUntil;
  function aiCause(e) {
    if (e?.status === 403) return 'premium';
    if (e?.status === 429) return 'quota';
    if (e?.timeout || e?.code === 'timeout') return 'timeout';
    if (navigator.onLine === false) return 'offline';
    if (e?.code === 'ai_unavailable' || [502, 503, 504].includes(e?.status)) return 'down';
    if (!e?.status) return 'offline';
    return 'down';
  }
  function aiErrorText(c) {
    if (c === 'premium') return ML('تحلیل هوشمند فقط برای حساب‌های Premium فعال است.', 'Nur für Premium-Konten verfügbar.', 'Only available for Premium accounts.');
    if (c === 'quota') return ML('سقف روزانه تحلیل هوشمند پر شده است؛ فردا دوباره فعال می‌شود.', 'Tageslimit erreicht – morgen wieder verfügbar.', 'Daily limit reached – available again tomorrow.');
    if (c === 'offline') return ML('اتصال اینترنت برقرار نیست؛ کارت ذخیره شده و بعد از وصل شدن، تحلیل خودکار انجام می‌شود.', 'Keine Internetverbindung – deine Arbeit ist gespeichert, die Analyse folgt automatisch.', 'No internet connection – your work is saved; the analysis will run automatically later.');
    if (c === 'timeout') return ML('پاسخ هوش مصنوعی خیلی دیر رسید.', 'Die KI hat zu lange gebraucht.', 'The AI took too long to answer.');
    return ML('تحلیل هوشمند موقتاً در دسترس نیست (سرویس هوش مصنوعی شلوغ یا قطع است).', 'Die KI-Analyse ist vorübergehend nicht verfügbar.', 'AI analysis is temporarily unavailable.');
  }
  const aiQueue = (w) => { w.aiq = w.aiq || {}; return w.aiq; };
  function noteFailure(w, slot, e) {
    const cause = aiCause(e); const q = aiQueue(w); const prev = q[slot] || { tries: 0 };
    const tries = prev.tries + 1; const auto = !['premium', 'quota'].includes(cause) && tries < RETRY_MAX;
    let wait = RETRY_STEPS[Math.min(tries - 1, RETRY_STEPS.length - 1)];
    const ra = Number(e?.details?.retry_after) || 0;
    if (cause === 'down' && ra) { downUntil = Math.max(downUntil, Date.now() + ra * 1000); wait = Math.max(wait, ra + 3); }
    q[slot] = { tries, cause, retryAt: auto ? Date.now() + wait * 1000 : 0 };
    return { error: aiErrorText(cause), cause, at: new Date().toISOString() };
  }
  const retryDue = (w, slot) => { const q = (w.aiq || {})[slot]; return !!(q && q.retryAt && Date.now() >= q.retryAt && !aiDown()); };
  function armRetry(w, slot) {
    const q = (w.aiq || {})[slot];
    if (!q?.retryAt) return;
    const k = busyKey(slot);
    if (retryT[k]) return;
    const ms = Math.max(1000, Math.max(q.retryAt, downUntil) - Date.now() + 800);
    retryT[k] = setTimeout(() => { delete retryT[k]; changed(); }, Math.min(ms, 2147483000));
  }
  function retryNote(slot) {
    const q = (work().aiq || {})[slot];
    if (!q) return '';
    if (!q.retryAt) return q.tries >= RETRY_MAX ? ML('تلاش خودکار متوقف شد؛ هر وقت خواستی «تلاش دوباره» را بزن.', 'Automatische Versuche beendet – du kannst es jederzeit erneut versuchen.', 'Automatic retries stopped – you can retry any time.') : '';
    const min = Math.max(1, Math.round((Math.max(q.retryAt, downUntil) - Date.now()) / 60000));
    return ML(`حدود ${faNum(min)} دقیقه دیگر خودکار دوباره امتحان می‌شود.`, `Neuer automatischer Versuch in etwa ${min} Min.`, `Automatic retry in about ${min} min.`);
  }
  function checkAiStatus() {
    if (statusChecked) return;
    statusChecked = true;
    bridge.api('/v1/method/ai-status', { timeout: 6000 }).then((r) => { if (r.ok && r.data?.state === 'down' && r.data.retry_after) { downUntil = Date.now() + r.data.retry_after * 1000; changed(); } }).catch(() => {});
  }
  window.addEventListener('online', () => {
    downUntil = 0;
    try { const q = work()?.aiq || {}; Object.values(q).forEach((x) => { if (x.retryAt && ['offline', 'timeout'].includes(x.cause)) x.retryAt = Date.now(); }); } catch { /* no activity open */ }
    changed();
  });
  async function aiCall(slot, path, body, onDone) {
    if (eng.OSD()) body = { ...body, exam: eng.OSD().examName() };
    body = { ...body, level: eng.userLevel() };
    const a = act(); const w = work(); const key = busyKey(slot);
    if (BUSY.has(key)) return;
    w.ai = w.ai || {};
    if (aiDown()) { w.ai[slot] = noteFailure(w, slot, { status: 503, code: 'ai_unavailable' }); armRetry(w, slot); eng.save(); changed(); return; }
    BUSY.add(key); changed();
    const limit = path.includes('speaking') ? AI_TIMEOUT.speaking : AI_TIMEOUT.text;
    const r = await bridge.api(path, { method: 'POST', body, timeout: limit });
    const wNow = eng.M().days[eng.dayKey()]?.work?.[a.id] || w;
    if (r.ok) { const res = r.data || {}; res.at = new Date().toISOString(); wNow.ai = wNow.ai || {}; wNow.ai[slot] = res; if (wNow.aiq) delete wNow.aiq[slot]; if (onDone) onDone(res, wNow); }
    else { console.warn('AI analysis failed', slot, r.error); wNow.ai = wNow.ai || {}; wNow.ai[slot] = noteFailure(wNow, slot, r.error); armRetry(wNow, slot); }
    BUSY.delete(key);
    eng.save();
    changed();
  }
  function autoAI(slot, run) {
    if (eng.V.review) return;
    const w = work(); w.ai = w.ai || {};
    if (!aiOn() || aiBusy(slot)) return;
    checkAiStatus();
    const r = w.ai[slot];
    if (r && !(r.error && retryDue(w, slot))) { if (r.error) armRetry(w, slot); return; }
    setTimeout(() => { const wk = work(); const cur = (wk.ai || {})[slot]; if (aiBusy(slot) || (cur && !(cur.error && retryDue(wk, slot)))) return; if (cur) delete wk.ai[slot]; run(); }, 0);
  }
  const aiRetry = (slot) => { const w = work(); if (w.ai) delete w.ai[slot]; eng.save(); };
  function aiState(slot) { const r = (work().ai || {})[slot]; return aiBusy(slot) ? 'busy' : !r ? 'none' : r.error ? 'error' : 'done'; }

  function sourceText(set, it) { return set === 'h' ? it.segments.map((s) => `${it.speakers[s.s]?.name || ''}: ${s.text}`).join('\n') : it.paragraphs.map((p, n) => `[${n + 1}] ${p.heading ? p.heading + ': ' : ''}${p.text}`).join('\n'); }
  function runQA(set) {
    const d = eng.curDay(); const skill = set === 'h' ? 'hoeren' : 'lesen'; const it = set === 'h' ? currentHoerenItem() : eng.item('lesen', d.picks?.lesen);
    if (!it) return;
    const w = work(); const wrong = wrongQuestions(set, it.questions || []);
    const items = wrong.map((q) => ({ id: q.id, question: q.q, options: Array.isArray(q.options) ? q.options.map(String) : q.type === 'rf' ? ['Richtig', 'Falsch'] : q.type === 'jnt' ? ['Ja', 'Nein', 'Text sagt dazu nichts'] : [], user_answer: String(answerLabel(q, w.ans[set + ':' + q.id]) || ''), correct_answer: String(correctLabel(q) || ''), evidence: q.evidence || '' }));
    const extra = set === 'l' ? Math.max(0, 3 - wrong.length) : 0;
    if (!items.length && !extra) { w.ai = w.ai || {}; w.ai[set === 'h' ? 'hq' : 'lq'] = { items: [], extra: [], overview_fa: '' }; eng.save(); return; }
    aiCall(set === 'h' ? 'hq' : 'lq', '/v1/method/questions-analysis', { skill, title: it.title, text: sourceText(set, it).slice(0, 8900), items, extra_needed: extra }, (r, wk) => {
      (r.items || []).forEach((x) => { if (!wk.cat['q:' + x.id]) wk.cat['q:' + x.id] = x.category; });
    });
  }
  function explainExtra(i) {
    const w = work(); const x = w.extraErrors?.[i];
    if (!x || !x.text || x.text.trim().length < 3) return;
    const skill = act().id === 'lesen' ? 'lesen' : 'hoeren'; const it = skill === 'hoeren' ? currentHoerenItem() : eng.item('lesen', eng.curDay().picks?.lesen);
    if (w.ai?.['sx_' + x.id]) delete w.ai['sx_' + x.id];
    aiCall('sx_' + x.id, '/v1/method/sentence-explain', { sentence: x.text.slice(0, 690), context: it?.title || '', skill }, (r, wk) => {
      const y = (wk.extraErrors || []).find((e) => e.id === x.id);
      if (!y) return;
      if (!y.cat) y.cat = r.category;
      if (!y.note) y.note = r.meaning_fa;
    });
  }
  /** key = recording slot; t = Sprechen task index or -1 for the Hören summary. */
  function aiSpeaking(key, t, taskItem) {
    const w = work(); const rec = w.rec[key];
    if (!rec || rec.local || !rec.id || rec.gone) return false;
    const it = t >= 0 ? taskItem || speakTask(eng.curDay(), t) : currentHoerenItem();
    const body = t >= 0 ? { recording_id: rec.id, task: [it?.situation, it?.task].filter(Boolean).join(' ').slice(0, 2900), task_type: it?.typeLabel || '' }
      : { recording_id: rec.id, task: 'Mündliche Zusammenfassung des Hörtextes: ' + (it?.title || ''), task_type: 'Zusammenfassung', reference: [it?.summary_model, it?.global?.thema, it?.global?.problem, it?.global?.ziel].filter(Boolean).join('\n').slice(0, 3900) };
    if (w.ai?.['sp_' + key]) delete w.ai['sp_' + key];
    aiCall('sp_' + key, '/v1/method/speaking-feedback', body, (r, wk) => {
      r.recId = rec.id;
      if (t < 0) return;
      if (!key.startsWith('try2')) Object.entries(r.issues || {}).forEach(([cat, v]) => { wk.self[`sp:${t}:${cat}`] = !!v; });
      if (key.startsWith('try2') || key.startsWith('exam')) Object.entries(r.scores || {}).forEach(([k, v]) => { wk.rate[`s${t}_${k}`] = v; });
    });
    return true;
  }
  function speakAuto(key, t, taskItem) {
    const w = work(); const rec = w.rec[key]; const r = w.ai?.['sp_' + key];
    if (!rec || rec.local || !rec.id || rec.gone) return;
    if (r && !r.error && r.recId && r.recId !== rec.id) delete w.ai['sp_' + key];
    autoAI('sp_' + key, () => aiSpeaking(key, t, taskItem));
  }

  /* ── Schreiben: AI correction fills scores and the Fehlerprotokoll (site applyWriting / aiWriting) ── */
  function applyWriting(r, w) {
    Object.entries(r.scores || {}).forEach(([k, v]) => { if (!w.rate['k_' + k]) w.rate['k_' + k] = v; });
    (r.errors || []).slice(0, 3).forEach((e) => {
      const n = [0, 1, 2].find((x) => !w.f['fp_wrong_' + x] && !w.f['fp_right_' + x]);
      if (n === undefined) return;
      w.f['fp_wrong_' + n] = e.wrong; w.f['fp_right_' + n] = e.right; w.f['fp_why_' + n] = e.reason_fa; w.cat['fp_' + n] = e.category;
    });
    r.words = wordsIn(w.f.text);
  }
  /** Returns false when there is not enough text yet (site: «at least 20 words»). */
  function aiWriting() {
    const d = eng.curDay(); const pk = d.picks?.schreiben; const it = pk && eng.item(pk.kind, pk.id); const w = work();
    if (!it || wordsIn(w.f.text) < 20) return false;
    if (w.ai?.writing) delete w.ai.writing;
    aiCall('writing', '/v1/method/writing-feedback', { task: [it.situation, it.task].filter(Boolean).join(' ').slice(0, 3900), text: String(w.f.text).slice(0, 8900), kind: it.format || pk.kind, min_words: pk.kind === 'grafik' ? 100 : eng.mwOf(d) }, applyWriting);
    return true;
  }
  /** Copies AI error i into the first free Fehlerprotokoll row; false when all three are full. */
  function aiToProtocol(i) {
    const w = work(); const e = w.ai?.writing?.errors?.[i];
    if (!e) return true;
    const r = [0, 1, 2].find((n) => !w.f['fp_wrong_' + n] && !w.f['fp_right_' + n]);
    if (r === undefined) return false;
    w.f['fp_wrong_' + r] = e.wrong; w.f['fp_right_' + r] = e.right; w.f['fp_why_' + r] = e.reason_fa; w.cat['fp_' + r] = e.category;
    eng.save();
    return true;
  }
  const speakTask = (d, t) => eng.item('sprechen', (d.picks?.sprechen || [])[t]);

  return {
    applyWriting, aiWriting, aiToProtocol, speakTask, retryDue, armRetry, aiCallPublic: aiCall,
    currentHoerenItem, questionsFor, qScore, setAnswer, unansweredCount, check, wrongQuestions, setField, setSelf, setRate, setCat, unlock, toggleReveal,
    gateFor, gateOk, addExtraError, extraErr, extraErrCat, removeExtraErr, logErrors, computeResults, analysedCount, finish, recordAnswerPerformance,
    rememberLearningError, aiOn, aiDown, aiBusy, aiState, aiRetry, retryNote, autoAI, runQA, explainExtra, aiSpeaking, speakAuto, checkAiStatus, scheduleSave,
  };
}
