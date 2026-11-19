// Learning data rules shared by the personal pages — ported 1:1 from learn.tah3in.com
// (testdaf-daily-plan.html + testdaf-method.js) so the app and the site agree on every
// card, date and interval. Pure functions take the account state (store.data);
// the `*Store` helpers change it through the store (per-path PATCH like the site).

import { lang } from './i18n.js';
import { st } from './site-text.js';

/* ─────────────── dates (local calendar, like the site) ─────────────── */

const pad = (n) => String(n).padStart(2, '0');
export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = String(k).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
/** Site today(): the local calendar day. */
export const today = () => keyOf(new Date());
export const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
/** Site addReviewDays(days). */
export const addReviewDays = (days) => addDays(today(), Math.max(0, Math.round(days || 0)));

export const L = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de || en);
/** Persian digits in Persian, like the site's faNum. */
export const num = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
export const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Change one top-level key through the store with a function of a copy. */
export function mutate(store, key, fallback, fn) {
  const current = store.get(key);
  const copy = current === undefined || current === null ? clone(fallback) : clone(current);
  const next = fn(copy);
  store.set(key, next === undefined ? copy : next);
}

/* ─────────────── mistakes («اشتباهات») ─────────────── */

export const ERROR_KIND_META = {
  vocabulary: { labelKey: 'skill.vocabulary', short: 'W', color: '#7c3aed', bg: '#ede9fe' },
  grammar: { labelKey: 'skill.grammar', short: 'G', color: '#e11d48', bg: '#ffe4e6' },
  reading: { labelKey: 'skill.reading', short: 'L', color: '#2563eb', bg: '#dbeafe' },
  listening: { labelKey: 'skill.listening', short: 'H', color: '#0891b2', bg: '#cffafe' },
  writing: { labelKey: 'skill.writing', short: 'S', color: '#d97706', bg: '#fef3c7' },
  speaking: { labelKey: 'skill.speaking', short: 'SP', color: '#059669', bg: '#d1fae5' },
  other: { labelKey: 'skill.other', short: 'A', color: '#64748b', bg: '#e2e8f0' },
};

export function normalizeLearningError(error = {}) {
  const history = Array.isArray(error.history) ? error.history : [];
  const successful = history.filter((item) => Number(item.rating ?? item.quality) >= 2).length;
  return {
    ...error,
    id: error.id || 'err_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    type: error.type || 'practice',
    category: error.category || error.type || 'practice',
    question: String(error.question || ''),
    userAnswer: String(error.userAnswer || ''),
    correctAnswer: String(error.correctAnswer || ''),
    explanation: String(error.explanation || ''),
    context: String(error.context || ''),
    source: error.source || 'auto',
    createdAt: error.createdAt || new Date().toISOString(),
    mistakeCount: Math.max(1, Number(error.mistakeCount) || 1),
    reviewCount: Math.max(history.length, Number(error.reviewCount) || 0),
    successCount: Number.isFinite(Number(error.successCount)) ? Number(error.successCount) : successful,
    lapses: Math.max(0, Number(error.lapses) || 0),
    easeFactor: Math.min(3, Math.max(1.3, Number(error.easeFactor) || 2.5)),
    intervalDays: Math.max(0, Number(error.intervalDays) || 0),
    nextReview: error.nextReview === null ? null : error.nextReview || today(),
    nextReviewAt: error.nextReviewAt || null,
    isMastered: !!error.isMastered,
    history,
  };
}

export function errorKind(error) {
  const value = String(error?.type || error?.category || 'other').toLowerCase();
  if (/wort|vocab|word|nicht gewusst/.test(value)) return 'vocabulary';
  if (/gramm/.test(value)) return 'grammar';
  if (/lesen|read/.test(value)) return 'reading';
  if (/h[o?]ren|hoeren|listen/.test(value)) return 'listening';
  if (/schreib|writ/.test(value)) return 'writing';
  if (/sprech|speak/.test(value)) return 'speaking';
  return 'other';
}

export function errorMeta(errorOrKind) {
  const kind = typeof errorOrKind === 'string' ? errorOrKind : errorKind(errorOrKind);
  const meta = ERROR_KIND_META[kind] || ERROR_KIND_META.other;
  return { kind, ...meta, label: st(meta.labelKey) };
}

export function errorIsDue(error) {
  if (error.isMastered || !error.nextReview) return false;
  return error.nextReview <= today() && (!error.nextReviewAt || new Date(error.nextReviewAt).getTime() <= Date.now());
}

export const errorsOf = (data) => (Array.isArray(data.errors) ? data.errors : []);

export function dueErrors(data) {
  return errorsOf(data).map(normalizeLearningError).filter(errorIsDue)
    .sort((a, b) => (Number(b.mistakeCount) - Number(a.mistakeCount)) || String(a.nextReview).localeCompare(String(b.nextReview)));
}

export function errorMatchesFilter(error, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'due') return errorIsDue(error);
  if (filter === 'mastered') return !!error.isMastered || error.intervalDays >= 60;
  return errorKind(error) === filter;
}

export function errorRetention(data) {
  const history = errorsOf(data).flatMap((e) => (Array.isArray(e.history) ? e.history : []));
  if (!history.length) return 0;
  return Math.round((history.filter((item) => Number(item.rating ?? item.quality) >= 2).length / history.length) * 100);
}

export function errorStreak(data) {
  const reviews = errorsOf(data).flatMap((e) => (e.history || []).map((item) => ({ ...item })))
    .sort((a, b) => String(b.at || b.date).localeCompare(String(a.at || a.date)));
  let streak = 0;
  for (const item of reviews) {
    if (Number(item.rating ?? item.quality) >= 2) streak += 1;
    else break;
  }
  return streak;
}

export function errorRanking(data, kind) {
  const grouped = new Map();
  errorsOf(data).map(normalizeLearningError).filter((e) => errorKind(e) === kind).forEach((e) => {
    const raw = kind === 'vocabulary' ? e.userAnswer || e.question : e.question || e.userAnswer || e.category;
    const label = String(raw || 'Unbekannt').trim();
    const key = label.toLocaleLowerCase();
    const current = grouped.get(key) || { label, count: 0 };
    current.count += Math.max(1, e.mistakeCount || 1);
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

export function errorTitle(error) {
  if (errorMeta(error).kind === 'vocabulary') return error.userAnswer || error.question || 'Wort';
  return error.question || error.userAnswer || error.category || 'Lernfehler';
}
export const errorSubline = (error) => error.correctAnswer || error.explanation || error.context || 'Noch keine Musterantwort gespeichert.';

export function errorDueLabel(error) {
  if (error.isMastered) return st('mistakes.mastered');
  if (errorIsDue(error)) return st('mistakes.dueNow');
  if (error.nextReviewAt) {
    const minutes = Math.max(1, Math.ceil((new Date(error.nextReviewAt).getTime() - Date.now()) / 60000));
    if (minutes < 60) return st('mistakes.inMinutes', { count: minutes });
    if (minutes < 1440) {
      const hours = Math.max(1, Math.ceil(minutes / 60));
      return L(hours + ' ساعت دیگر', 'in ' + hours + ' h', 'in ' + hours + ' Std.');
    }
  }
  if (error.nextReview) {
    const locale = lang() === 'fa' ? 'fa-IR' : lang() === 'en' ? 'en-GB' : 'de-DE';
    return new Date(error.nextReview + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  }
  return st('common.new');
}

export function vocabularyReviewParts(error) {
  const source = String(error.source || '').toLowerCase();
  const flashcard = /vocab|wort/.test(source) || error.question === 'Flashcard vocabulary' || String(error.category || '').toLowerCase().includes('nicht gewusst');
  if (flashcard) return { word: error.userAnswer || error.question, meaning: error.correctAnswer || '', example: error.explanation || '', context: error.context || '' };
  return { word: error.correctAnswer || error.userAnswer || '', meaning: error.question || error.explanation || '', example: error.explanation || '', context: error.context || '' };
}

export function mistakeVocabSides(error, direction) {
  const vocab = vocabularyReviewParts(error);
  const meaningFirst = direction !== 'word-to-meaning';
  return {
    ...vocab,
    meaningFirst,
    front: meaningFirst ? vocab.meaning || st('vocab.noMeaning') : vocab.word || st('review.noModel'),
    back: meaningFirst ? vocab.word || st('review.noModel') : vocab.meaning || st('vocab.noMeaning'),
    frontLabel: st(meaningFirst ? 'mistakes.frontMeaning' : 'mistakes.frontWord'),
    backLabel: st(meaningFirst ? 'mistakes.backWord' : 'mistakes.backMeaning'),
  };
}

/** Site ankiSchedule(error, rating 0..3). */
export function ankiSchedule(error, rating) {
  const card = normalizeLearningError(error);
  const old = Math.max(0, card.intervalDays || 0);
  const ease = card.easeFactor || 2.5;
  if (rating === 0) return { intervalDays: 0, nextReview: today(), nextReviewAt: new Date(Date.now() + 10 * 60000).toISOString(), easeFactor: Math.max(1.3, ease - 0.2), lapses: card.lapses + 1, isMastered: false, label: '10 min' };
  if (rating === 1) {
    if (old < 1) return { intervalDays: 0.5, nextReview: today(), nextReviewAt: new Date(Date.now() + 12 * 60 * 60000).toISOString(), easeFactor: Math.max(1.3, ease - 0.15), lapses: card.lapses, isMastered: false, label: '12 h' };
    const interval = Math.max(1, Math.round(old * 1.2));
    return { intervalDays: interval, nextReview: addReviewDays(interval), nextReviewAt: null, easeFactor: Math.max(1.3, ease - 0.15), lapses: card.lapses, isMastered: false, label: interval + ' d' };
  }
  if (rating === 2) {
    const interval = old < 1 ? 1 : old === 1 ? 3 : Math.max(old + 1, Math.round(old * ease));
    return { intervalDays: interval, nextReview: addReviewDays(interval), nextReviewAt: null, easeFactor: ease, lapses: card.lapses, isMastered: interval >= 90, label: interval + ' d' };
  }
  const interval = old < 1 ? 4 : Math.max(old + 2, Math.round(old * ease * 1.3));
  return { intervalDays: interval, nextReview: addReviewDays(interval), nextReviewAt: null, easeFactor: Math.min(3, ease + 0.15), lapses: card.lapses, isMastered: interval >= 60, label: interval + ' d' };
}

/** Site reviewError(id, rating, timeSpent). */
export function reviewErrorStore(store, id, rating, timeSpent) {
  mutate(store, 'errors', [], (errors) => {
    const error = errors.find((item) => item.id === id);
    if (!error) return errors;
    const card = normalizeLearningError(error);
    const result = ankiSchedule(card, Number(rating));
    delete result.label;
    Object.assign(error, card, result, {
      reviewCount: card.reviewCount + 1,
      successCount: card.successCount + (Number(rating) >= 2 ? 1 : 0),
      lastReview: new Date().toISOString(),
    });
    error.history.push({ rating: Number(rating), quality: Number(rating), date: today(), at: new Date().toISOString(), timeSpent: Number(timeSpent) || 0, intervalDays: result.intervalDays });
    return errors;
  });
}

export function deleteErrorStore(store, id) {
  mutate(store, 'errors', [], (errors) => errors.filter((item) => item.id !== id));
}

/** Site addError(err). */
export function addErrorStore(store, err) {
  const item = normalizeLearningError({ ...err, id: 'err_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), nextReview: today(), nextReviewAt: null, isMastered: false, history: [] });
  mutate(store, 'errors', [], (errors) => {
    errors.push(item);
    return errors;
  });
  return item;
}

function learningErrorWorthReview(err) {
  const src = String(err.source || '');
  const qt = String(err.qtype || '').toLowerCase();
  if (['coach', 'mini_test', 'grammar', 'hoeren'].includes(src)) return false;
  if (['mc', 'rf', 'jnt', 'match', 'tf', 'multiple_choice', 'true_false', 'richtig_falsch', 'selfcheck'].includes(qt)) return false;
  if (!String(err.correctAnswer || '').trim() && !String(err.explanation || '').trim()) return false;
  return true;
}

/** Site rememberLearningError(err): bumps an existing card with the same sourceKey. */
export function rememberErrorStore(store, err, planId = null) {
  if (!err || !learningErrorWorthReview(err)) return false;
  const sourceKey = err.sourceKey || [err.type, err.category, err.userAnswer, err.correctAnswer, err.question].join('|');
  const existing = errorsOf(store.data).find((item) => (item.sourceKey || '') === sourceKey);
  if (existing) {
    mutate(store, 'errors', [], (errors) => {
      const target = errors.find((item) => (item.sourceKey || '') === sourceKey);
      const normalized = normalizeLearningError(target);
      Object.assign(target, normalized, { mistakeCount: normalized.mistakeCount + 1, lastMistakeAt: new Date().toISOString(), nextReview: today(), nextReviewAt: null, isMastered: false, severity: Math.max(Number(target.severity) || 1, Number(err.severity) || 1) });
      return errors;
    });
    return true;
  }
  addErrorStore(store, {
    type: err.type || 'practice', category: err.category || err.type || 'practice', question: err.question || '',
    userAnswer: String(err.userAnswer || '').slice(0, 800), correctAnswer: String(err.correctAnswer || '').slice(0, 800),
    explanation: err.explanation || '', context: err.context || '', source: err.source || 'auto', severity: err.severity || 1,
    sourceKey, createdAt: new Date().toISOString(), planId, mistakeCount: 1,
  });
  return true;
}

/* ─────────────── word progress (site wordProgress / answerPerformance) ─────────────── */

export function lexemeKey(item) {
  return String(item?.word || item?.w || '').toLocaleLowerCase('de-DE').normalize('NFKC').trim()
    .replace(/^(der|die|das)\s+/u, '').replace(/[‐‑‒–—-]/g, ' ').replace(/[^a-z0-9äöüß\s]/giu, ' ').replace(/\s+/g, ' ').trim();
}
const topicKeyOf = (data) => (data.user && (data.user.subtopic || data.user.topic)) || data.contentBankTopic || 'default';
function stableWordId(item, topicKey) {
  const lexeme = lexemeKey(item);
  if (lexeme) return `word-${lexeme.replace(/\s+/g, '-')}`;
  const explicit = String(item?.id || item?.word_id || '').trim();
  return explicit || `word-${String(topicKey || 'general').replace(/[^a-z0-9_-]/gi, '-')}-unknown`;
}

/** Site registerSiteWords(list) (new plan/notebook words are "seen", no score). */
export function registerWordsStore(store, list) {
  const progress = store.get('wordProgress') || {};
  const now = new Date().toISOString();
  const add = {};
  list.forEach((it) => {
    const lexeme = lexemeKey(it);
    if (!lexeme) return;
    const key = `lexeme|${lexeme}`;
    if (progress[key] || add[key]) return;
    add[key] = { key, wordId: stableWordId(it, 'testdaf-method'), lexeme, topicKey: 'testdaf-method', word: it.word, source: 'tdm', firstSeenAt: now, lastSeenAt: now, reviewCount: 0, lastRating: null, knownCount: 0 };
  });
  if (Object.keys(add).length) mutate(store, 'wordProgress', {}, (wp) => Object.assign(wp, add));
}

/** Site recordVocabularyProgress(item, rating 0..2, source, timing) + recordAnswerPerformance. */
export function recordWordStore(store, item, rating, source, timing = {}) {
  const data = store.data;
  const topicKey = topicKeyOf(data);
  const wordId = stableWordId(item, topicKey);
  const lexeme = lexemeKey(item);
  const key = `lexeme|${lexeme || wordId}`;
  const progress = data.wordProgress || {};
  const previous = progress[key] || Object.values(progress).find((e) => lexemeKey({ word: e?.word }) === lexeme) || {};
  const now = new Date().toISOString();
  mutate(store, 'wordProgress', {}, (wp) => {
    wp[key] = { key, wordId, lexeme, topicKey, word: String(item.word || item.w || ''), source, firstSeenAt: previous.firstSeenAt || now, lastSeenAt: now, reviewCount: (Number(previous.reviewCount) || 0) + 1, lastRating: Number(rating), knownCount: (Number(previous.knownCount) || 0) + (Number(rating) === 2 ? 1 : 0) };
    return wp;
  });
  const plan = data.plan;
  if (!plan) return;
  const accuracy = [0, 60, 100][Number(rating)] ?? 0;
  const expected = Math.max(1, Math.round(Number(timing.expectedSeconds) || 30));
  const actual = Math.max(1, Math.round(Number(timing.actualSeconds) || 1));
  const planId = plan.id || `plan-${plan.date || today()}`;
  const record = {
    key: `${planId}:wortschatz:${wordId}`, planId, date: plan.date || today(), topicKey, skill: 'wortschatz', questionId: wordId,
    accuracy, expectedSeconds: expected, actualSeconds: actual, answeredAt: now,
  };
  record.score = Math.round(accuracy * (0.8 + 0.2 * Math.min(1, expected / actual)));
  mutate(store, 'answerPerformance', [], (list) => {
    const index = list.findIndex((x) => x.key === record.key);
    if (index >= 0) list[index] = record;
    else list.push(record);
    return list;
  });
}

/* ─────────────── plan notebook (SRS deck in testdafMethod / oesdMethod) ─────────────── */

export const SRS_STEPS = [1, 3, 7, 14, 30];
/** Site PROG(): ÖSD learners keep their method state in oesdMethod. */
export const methodKey = () => 'testdafMethod'; // UNIFIED-PLAN
export const deckOf = (data) => {
  const m = data[methodKey(data)];
  return m && m.srs && typeof m.srs === 'object' ? m.srs : {};
};
export const deckFront = (x) => (x.type === 'wort' ? `${x.data.artikel ? x.data.artikel + ' ' : ''}${x.data.wort}` : x.data.de);
export const deckNorm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();

function mutateDeck(store, fn) {
  const key = methodKey(store.data);
  mutate(store, key, {}, (m) => {
    m.srs = m.srs && typeof m.srs === 'object' ? m.srs : {};
    fn(m.srs);
    return m;
  });
}

/** Site siteVocabItem(card). */
export function deckVocabItem(c) {
  const x = c?.data || {};
  return c?.type === 'wort'
    ? { id: 'tdm-' + c.key, word: `${x.artikel ? x.artikel + ' ' : ''}${x.wort}`, meaning_native: x.bedeutung_fa || '', example_sentence: x.beispiel || '', collocations: x.koll || [] }
    : { id: 'tdm-' + (c?.key || ''), word: x.de || '', meaning_native: x.fa || '', example_sentence: x.beispiel || '', collocations: [] };
}

/** Site deckCommit / TDM.deckAddEntry: own entries are due today. */
export function deckAddStore(store, type, data) {
  type = type === 'redemittel' ? 'redemittel' : 'wort';
  const front = type === 'wort' ? data.wort : data.de;
  const n = deckNorm(front);
  if (!n) return { ok: false };
  if (Object.values(deckOf(store.data)).some((x) => x.type === type && deckNorm(x.type === 'wort' ? x.data.wort : x.data.de) === n)) return { ok: false, dup: true };
  const ref = 'my-' + (n.replace(/[^a-zäöüß0-9]+/g, '-').replace(/^-|-$/g, '') || uid()) + '-' + uid().slice(0, 4);
  const k = today();
  const key = type + ':' + ref;
  const card = { key, type, ref, data, added: k, stage: 0, due: k, reps: 0, lapses: 0 };
  mutateDeck(store, (srs) => {
    if (!srs[key]) srs[key] = card;
  });
  registerWordsStore(store, [deckVocabItem(card)]);
  return { ok: true, card };
}

export function deckDeleteStore(store, key) {
  mutateDeck(store, (srs) => {
    delete srs[key];
  });
}

/** Site TDM.deckRate → srsRate + syncSiteWord. */
export function deckRateStore(store, key, ok) {
  const card = deckOf(store.data)[key];
  if (!card) return;
  const t = today();
  mutateDeck(store, (srs) => {
    const it = srs[key];
    if (!it) return;
    if (ok) {
      it.stage = Math.min((Number(it.stage) || 0) + 1, SRS_STEPS.length - 1);
      it.due = addDays(t, SRS_STEPS[it.stage]);
    } else {
      it.stage = 0;
      it.lapses = (Number(it.lapses) || 0) + 1;
      it.due = addDays(t, 1);
    }
    it.reps = (Number(it.reps) || 0) + 1;
    it.last = t;
  });
  const item = deckVocabItem(card);
  recordWordStore(store, item, ok ? 2 : 0, 'tdm', { expectedSeconds: 30, actualSeconds: 20 });
  if (!ok) {
    const word = item.word || '';
    rememberErrorStore(store, {
      type: 'wortschatz', category: 'Nicht gewusst', question: 'Flashcard vocabulary', userAnswer: word,
      correctAnswer: item.meaning_native || '', explanation: item.example_sentence || '', context: (item.collocations || []).join(' - '),
      source: 'tdm', sourceKey: 'tdm:vocab:' + word,
    }, store.data.plan && store.data.plan.id);
  }
}

/** Site TDM.exportAnki: semicolon CSV with a BOM. */
export function deckAnkiCsv(data) {
  const rows = Object.values(deckOf(data)).map((x) => (x.type === 'wort'
    ? [`${x.data.artikel ? x.data.artikel + ' ' : ''}${x.data.wort}`, `${x.data.bedeutung_fa}<br>${x.data.plural && x.data.plural !== '—' ? 'Pl. ' + x.data.plural + '<br>' : ''}${x.data.perfekt ? 'Perfekt: ' + x.data.perfekt + '<br>' : ''}${(x.data.koll || []).join(' · ')}<br><i>${x.data.beispiel}</i>`, 'amookht::wort']
    : [x.data.de, `${x.data.fa}<br><i>${x.data.beispiel || ''}</i>`, 'amookht::redemittel']));
  return '﻿' + rows.map((r) => r.map((c) => '"' + String(c || '').replace(/"/g, '""') + '"').join(';')).join('\n');
}

/* ─────────────── favourites («علاقه‌مندی‌ها») ─────────────── */

export function favoriteHash(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export const favoriteTopic = (data) => (data.user && (data.user.customTopic || data.user.subtopic || data.user.topic)) || 'Allgemein';

export function normalizeFavorite(item = {}, data = {}) {
  const rawKind = String(item.kind || item.skill || 'other').toLowerCase();
  const aliases = { wortschatz: 'vocabulary', grammatik: 'grammar', lesen: 'reading', hoeren: 'listening', schreiben: 'writing', sprechen: 'speaking' };
  const kind = aliases[rawKind] || rawKind;
  const title = String(item.title || item.question || item.word || 'Favorit').slice(0, 900);
  const answer = String(item.answer || item.meaning || item.correctAnswer || '').slice(0, 1800);
  const topic = String(item.topic || favoriteTopic(data) || 'Allgemein').slice(0, 240);
  const sourceId = String(item.sourceId || item.id || '').slice(0, 300);
  // A stored favourite keeps its id (personal cards use fav_manual_…); new items get the site's hash id.
  const storedId = typeof item.id === 'string' && item.id.startsWith('fav_') ? item.id : '';
  const id = String(item.favoriteId || storedId || 'fav_' + favoriteHash([kind, topic, title.toLocaleLowerCase(), answer.toLocaleLowerCase()].join('|')));
  const rating = Math.max(1, Math.min(3, Number(item.rating || item.stars) || 1));
  return {
    id, kind, skill: String(item.skill || kind), title, subtitle: String(item.subtitle || '').slice(0, 500), answer,
    explanation: String(item.explanation || '').slice(0, 1800), context: String(item.context || '').slice(0, 3200),
    topic, source: String(item.source || 'learning'), sourceId, rating, savedAt: item.savedAt || new Date().toISOString(), manual: !!item.manual,
  };
}

export const favoritesOf = (data) => (Array.isArray(data.favorites) ? data.favorites : []);

export function favoriteRating(data, id) {
  const list = favoritesOf(data);
  return Math.max(0, Math.min(3, Number(list.find((item) => item.id === id)?.rating) || (list.some((item) => item.id === id) ? 1 : 0)));
}

/** Site setFavoriteRating: same star again removes it, a new item is put first. */
export function setFavoriteRatingStore(store, item, rating) {
  rating = Math.max(1, Math.min(3, Number(rating) || 1));
  const id = item.id;
  const current = favoriteRating(store.data, id);
  mutate(store, 'favorites', [], (list) => {
    const index = list.findIndex((x) => x.id === id);
    if (index >= 0 && current === rating) list.splice(index, 1);
    else if (index >= 0) list[index] = { ...normalizeFavorite(list[index], store.data), rating };
    else list.unshift({ ...item, rating, savedAt: new Date().toISOString() });
    return list;
  });
}

export function deleteFavoriteStore(store, id) {
  mutate(store, 'favorites', [], (list) => list.filter((x) => x.id !== id && normalizeFavorite(x, store.data).id !== id));
}

export function favoriteKindMeta(kind) {
  const map = {
    vocabulary: ['skill.vocabulary', 'W', '#8b5cf6'], grammar: ['skill.grammar', 'G', '#ec4899'], reading: ['skill.reading', 'L', '#3b82f6'],
    listening: ['skill.listening', 'H', '#06b6d4'], writing: ['skill.writing', 'S', '#f59e0b'], speaking: ['skill.speaking', 'SP', '#10b981'],
    structure: ['favorite.structure', '§', '#0d9488'],
  };
  const value = map[kind] || ['skill.other', 'A', '#64748b'];
  return { label: st(value[0]), short: value[1], color: value[2] };
}

/** Site amkPlanName: never shows "TestDaF" as a plan name (NOTDF rule). */
export function planName(n) {
  const s = String(n || '');
  if (['TestDaF', 'برنامه یادگیری', 'Learning program', 'Lernprogramm'].includes(s)) return L('برنامه یادگیری', 'Learning program', 'Lernprogramm');
  return s.replace(/^TestDaF-Training/, 'Lernplan');
}

/** Plan-deck card as a favourite (site favWordItem / favRedItem). */
export function deckFavoriteItem(c) {
  const x = c.data || {};
  if (c.type === 'wort') {
    return { kind: 'vocabulary', title: `${x.artikel ? x.artikel + ' ' : ''}${x.wort}`, subtitle: [x.wortart, x.plural && x.plural !== '—' ? 'Pl. ' + x.plural : '', x.perfekt ? 'Perfekt: ' + x.perfekt : ''].filter(Boolean).join(' · '), answer: x.bedeutung_fa || '', explanation: x.beispiel || '', context: (x.koll || []).join(' · '), topic: 'Lernplan', source: 'tdm', sourceId: 'tdm-wort:' + x.wort };
  }
  return { kind: 'structure', title: x.de, answer: x.fa || '', explanation: x.beispiel || '', topic: 'Lernplan', source: 'tdm', sourceId: 'tdm-redemittel:' + x.de };
}
