// Daily history records (state.history) — the site's normalizeHistorySegment, rebuildDailyHistory,
// mergeHistoryByDate and upsertDailyHistorySegment, unchanged, so app and site write the same shape.

import { today } from './learning.js';

export const historyNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
export const historyOptionalNumber = (value) => (value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null);

const PLAN_NAMES = { testdaf: 'برنامه یادگیری', oesd: 'ÖSD' };

export function normalizeSegment(item = {}, key = '') {
  return {
    planId: item.planId || key, createdAt: item.createdAt || new Date(`${item.date || today()}T00:00:00`).toISOString(),
    examType: item.examType || 'testdaf', examName: item.examName || PLAN_NAMES[item.examType] || 'TestDaF', topic: item.topic || '',
    score: historyOptionalNumber(item.score), questionCount: Math.max(0, historyNumber(item.questionCount)), skillQuestionCounts: { ...(item.skillQuestionCounts || {}) },
    time: Math.max(0, historyNumber(item.time)), acts: Math.max(0, historyNumber(item.acts)), comp: Math.max(0, historyNumber(item.comp)),
    activityTimes: { ...(item.activityTimes || {}) }, skillScores: { ...(item.skillScores || {}) },
    closedAt: item.closedAt || null, closeReason: item.closeReason || null, partial: !!item.partial,
  };
}

export function rebuildDay(day = {}) {
  const date = day.date || today();
  const ordered = Object.values(day.segments || {}).filter(Boolean).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const latest = ordered[ordered.length - 1] || {};
  const activityTimes = {}; const totals = {}; const weights = {}; const qCounts = {};
  let time = 0; let acts = 0; let comp = 0; let scoreTotal = 0; let scoreWeight = 0; let questionCount = 0;
  for (const seg of ordered) {
    time += Math.max(0, historyNumber(seg.time)); acts += Math.max(0, historyNumber(seg.acts)); comp += Math.max(0, historyNumber(seg.comp));
    questionCount += Math.max(0, historyNumber(seg.questionCount));
    for (const [id, value] of Object.entries(seg.activityTimes || {})) activityTimes[id] = (activityTimes[id] || 0) + Math.max(0, historyNumber(value));
    for (const [id, value] of Object.entries(seg.skillScores || {})) {
      const score = historyOptionalNumber(value);
      if (score === null) continue;
      const w = Math.max(1, historyNumber(seg.skillQuestionCounts?.[id], 1));
      totals[id] = (totals[id] || 0) + score * w; weights[id] = (weights[id] || 0) + w; qCounts[id] = (qCounts[id] || 0) + w;
    }
    const score = historyOptionalNumber(seg.score);
    if (score !== null) { const w = Math.max(1, historyNumber(seg.questionCount) || historyNumber(seg.comp) || 1); scoreTotal += score * w; scoreWeight += w; }
  }
  const skillScores = {};
  Object.keys(totals).forEach((id) => { skillScores[id] = Math.round(totals[id] / weights[id]); });
  if (scoreWeight) skillScores.gesamt = Math.round(scoreTotal / scoreWeight);
  const createdAt = ordered[0]?.createdAt || day.createdAt || new Date(`${date}T00:00:00`).toISOString();
  const closedAt = ordered.map((x) => x.closedAt).filter(Boolean).sort().at(-1) || null;
  return {
    date, planId: `day-${date}`, planIds: ordered.map((x) => x.planId).filter(Boolean), createdAt, closedAt,
    examType: latest.examType || day.examType || 'testdaf', examName: ordered.length > 1 ? 'Mehrere Tages-Themen' : latest.examName || day.examName || 'TestDaF',
    topic: ordered.map((x) => x.topic).filter(Boolean).join(' · '), score: scoreWeight ? Math.round(scoreTotal / scoreWeight) : null, questionCount,
    time, acts, comp, activityTimes, skillScores, skillQuestionCounts: qCounts, partial: comp < acts, segments: day.segments || {},
  };
}

export function mergeByDate(items) {
  const days = new Map();
  (Array.isArray(items) ? items : []).forEach((item, index) => {
    if (!item?.date) return;
    let day = days.get(item.date);
    if (!day) { day = { date: item.date, segments: {} }; days.set(item.date, day); }
    if (item.segments && typeof item.segments === 'object') {
      for (const [key, value] of Object.entries(item.segments)) { const sk = value?.planId || key; day.segments[sk] = normalizeSegment({ ...value, date: item.date }, sk); }
    } else {
      const key = item.planId || `legacy-${item.date}-${item.createdAt || index}`;
      day.segments[key] = normalizeSegment(item, key);
    }
  });
  return [...days.values()].map(rebuildDay).sort((a, b) => b.date.localeCompare(a.date));
}

/** Site upsertDailyHistorySegment: mutates and returns the day record inside `history`. */
export function upsertSegment(state, snapshot = {}) {
  const date = snapshot.date || state.plan?.date || today();
  const planId = snapshot.planId || state.plan?.id || `legacy-${date}`;
  state.history = mergeByDate(state.history);
  let day = state.history.find((x) => x.date === date);
  if (!day) { day = { date, segments: {} }; state.history.push(day); }
  day.segments = day.segments || {};
  const old = day.segments[planId] || {};
  day.segments[planId] = normalizeSegment({ ...old, ...snapshot, date, planId, activityTimes: { ...(snapshot.activityTimes || {}) }, skillScores: { ...(snapshot.skillScores || {}) } }, planId);
  const rebuilt = rebuildDay(day);
  Object.keys(day).forEach((k) => delete day[k]);
  Object.assign(day, rebuilt);
  state.history.sort((a, b) => b.date.localeCompare(a.date));
  return day;
}
