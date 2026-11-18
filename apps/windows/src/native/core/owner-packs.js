// Owner content packs («افزودن دستی محتوا») — the Windows side of the site's /v1/owner-packs feature.
// Every saved pack is one complete snapshot of a day's six exercise categories with audio and answers
// (the site's ownerPackSnapshot), stored server-side so the owner can load an old pack back into the run.
// Owner account only; the server enforces the same rule with require_owner.

import { dayFileSnapshot } from './owner-files.js';
import { today } from './learning.js';
import { lang } from './i18n.js';
import { esc as safeText } from './ui.js';

export const OWNER_PACK_SCHEMA = 1;
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const fa = () => lang() === 'fa';
const en = () => lang() === 'en';
const L = (a, b, c) => (fa() ? a : en() ? b : c);

const REASONS = {
  renew: { fa: 'تمرین تازه', en: 'Renewed', de: 'Erneuert' },
  'manual-renew': { fa: 'تمرین تازه', en: 'Renewed', de: 'Erneuert' },
  'fresh-start': { fa: 'شروع تازه', en: 'Fresh start', de: 'Neustart' },
  'day-end': { fa: 'پایان روز', en: 'Day end', de: 'Tagesende' },
  'manual-day-end': { fa: 'پایان روز', en: 'Day end', de: 'Tagesende' },
  'new-day': { fa: 'شروع روز جدید', en: 'New day', de: 'Neuer Tag' },
};

export function ownerPackReasonLabel(reason) {
  const row = REASONS[reason] || { fa: 'ثبت خودکار', en: 'Automatic', de: 'Automatisch' };
  return fa() ? row.fa : en() ? row.en : row.de;
}

export function createOwnerPacks({ store, engine, account, api }) {
  const state = { list: null, loading: false, error: '' };
  const isOwner = () => !!(account() || {}).owner;

  /** The site's ownerPackSnapshot(reason), against the live engine state. */
  function snapshot(reason) {
    const eng = engine(); if (!eng) return null;
    const S = eng.S; if (!S) return null;
    const date = S.plan?.date || today();
    let dayFile = null;
    try { dayFile = dayFileSnapshot(eng, date); } catch (error) { console.warn(error); }
    let tdm = null;
    try {
      const day = eng.ensureDay ? eng.ensureDay(date) : null;
      if (day) {
        tdm = { date, wd: day.wd ?? null, week: day.week ?? null, mode: day.mode || 'normal', level: day.level || null, picks: clone(day.picks || null), redemittel: Array.isArray(day.redemittel) ? clone(day.redemittel) : [] };
      }
    } catch (error) { console.warn(error); }
    const audio = [];
    (dayFile?.modules || []).forEach((mod) => { if (mod && mod.audio) audio.push({ module: mod.id, title: mod.title || '', src: mod.audio }); });
    return {
      schema: OWNER_PACK_SCHEMA,
      kind: tdm ? 'method' : 'plan',
      reason: reason || 'manual',
      source_date: date,
      created_at: new Date().toISOString(),
      user: { level: S.user?.level || '', topic: S.user?.customTopic || '', exam_plan: S.user?.examPlan || '', ui_language: lang() },
      plan: S.plan ? { activities: (S.plan.activities || []).map((item) => ({ ...item })), totalMinutes: S.plan.totalMinutes || 0, availableMinutes: S.plan.availableMinutes || 0, examType: S.plan.examType || '', examName: S.plan.examName || '' } : null,
      tdm,
      day_file: dayFile,
      resources: S.learningResources?.package ? { package: S.learningResources.package } : null,
      audio,
    };
  }

  function label(snap) {
    const date = snap?.source_date || today();
    const cats = ((snap?.day_file?.modules) || []).map((mod) => mod.de || mod.id).filter(Boolean);
    const tail = cats.length ? (cats.slice(0, 3).join(' · ') + (cats.length > 3 ? ' +' + (cats.length - 3) : '')) : (snap?.kind === 'plan' ? 'Plan' : 'Method');
    return `${date} · ${ownerPackReasonLabel(snap?.reason)} · ${tail}`;
  }

  async function save(reason) {
    if (!isOwner()) return null;
    let snap = null;
    try { snap = snapshot(reason); } catch (error) { console.warn('owner pack snapshot failed', error); return null; }
    if (!snap || !snap.plan || !(snap.plan.activities || []).length) return null;
    try {
      const saved = await api('/v1/owner-packs', { method: 'POST', body: { label: label(snap), reason: snap.reason, source_date: snap.source_date, payload: snap } });
      state.list = null;
      return saved;
    } catch (error) { console.warn('owner pack save failed', error); return null; }
  }

  async function list(force = false) {
    if (!isOwner()) return [];
    if (state.list && !force) return state.list;
    state.loading = true; state.error = '';
    try {
      const data = await api('/v1/owner-packs', { method: 'GET' });
      state.list = Array.isArray(data?.packs) ? data.packs : [];
    } catch (error) {
      state.error = String(error?.message || error);
      state.list = state.list || [];
    }
    state.loading = false;
    return state.list;
  }

  async function remove(packId) {
    if (!isOwner() || !packId) return false;
    await api('/v1/owner-packs/' + encodeURIComponent(packId), { method: 'DELETE' });
    state.list = (state.list || []).filter((pack) => pack.id !== packId);
    return true;
  }

  /** Load one pack into today's run (the site's applyOwnerPack, against the live engine). */
  function applyPayload(pack, packId) {
    if (!isOwner() || !pack) return false;
    const eng = engine(); if (!eng) return false;
    const plan = pack.plan || {};
    const activities = Array.isArray(plan.activities) ? plan.activities.map((item) => ({ ...item })) : [];
    if (!activities.length) throw new Error(L('این پک هیچ تمرینی ندارد.', 'The pack has no exercises.', 'Der Pack enthält keine Übungen.'));
    const key = today();
    if (pack.kind === 'method' && pack.tdm) {
      try {
        const day = eng.ensureDay(key);
        if (day) {
          if (pack.tdm.mode) day.mode = pack.tdm.mode;
          if (pack.tdm.picks) day.picks = clone(pack.tdm.picks);
          if (Array.isArray(pack.tdm.redemittel)) day.redemittel = clone(pack.tdm.redemittel);
          if (pack.tdm.level) day.level = pack.tdm.level;
          day.work = {}; day.results = {}; day.loadedPack = packId || ''; day.createdAt = new Date().toISOString();
        }
      } catch (error) { console.warn('owner pack method restore failed', error); }
    }
    const S = eng.S;
    S.plan = {
      id: 'plan-' + Date.now(), date: key, createdAt: new Date().toISOString(),
      examType: plan.examType || S.user?.examPlan || '', examName: plan.examName || '',
      activities, totalMinutes: Number(plan.totalMinutes) || 0, availableMinutes: Number(plan.availableMinutes) || 0,
      dataSource: 'owner-pack', schemaVersion: '1.0.0',
      ownerPack: { id: packId || '', label: label(pack), loadedAt: new Date().toISOString() },
    };
    if (pack.kind !== 'method' && pack.resources?.package) {
      const pkg = pack.resources.package; const content = pkg?.content || {};
      S.learningResources = { vocab: content.wortschatz?.items || [], grammar: content.grammatik?.questions || [], writingTopic: content.schreiben?.writing_task || '', hoeren: content.hoeren || null, package: pkg };
      S.dataSource = { type: 'owner-pack', label: 'Owner pack loaded', receivedAt: new Date().toISOString() };
    }
    S.completed = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {};
    eng.V.activeId = null; eng.V.screen = 'dashboard';
    eng.save();
    return true;
  }

  async function load(packId) {
    if (!isOwner() || !packId) return false;
    const data = await api('/v1/owner-packs/' + encodeURIComponent(packId), { method: 'GET' });
    return applyPayload(data?.payload || {}, packId);
  }

  return { isOwner, state, snapshot, label, save, list, remove, load, applyPayload };
}

/* ───────────── the page: «افزودن دستی محتوا» ───────────── */

const CHIP_COLORS = { hoeren: '#a855f7', lesen: '#0ea5e9', schreiben: '#f59e0b', sprechen: '#f43f5e', wortschatz: '#10b981', wiederholung: '#6366f1', fehleranalyse: '#ef4444', wochenbericht: '#14b8a6', extra: '#0d9488' };
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString(fa() ? 'fa-IR-u-ca-persian' : lang() === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }); } catch { return ''; } };

/** HTML for the pack list (rendered inside the dashboard while ui.view === 'packs'). */
export function renderOwnerPacks(packs, { loading, error } = {}) {
  const rows = (packs || []).map((pack) => {
    const cats = (pack.categories || []).map((id) => `<span style="display:inline-block;margin:0 4px 4px 0;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:800;color:#fff;background:${CHIP_COLORS[id] || '#64748b'}">${safeText(id)}</span>`).join('');
    const audio = (pack.audio || []).length;
    return `<article class="card" style="margin-bottom:12px"><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between">
      <div style="min-width:200px;flex:1">
        <b style="font-size:13px">${safeText(pack.label || pack.source_date || pack.id)}</b>
        <p class="muted small" style="margin-top:4px">${safeText(pack.source_date || '')} · ${safeText(ownerPackReasonLabel(pack.reason))} · ${safeText(String(Number(pack.question_count || 0)))} ${safeText(L('سؤال', 'questions', 'Fragen'))} · ${safeText(String(audio))} ${safeText(L('صوت', 'audio', 'Audio'))} · ${safeText(String(Math.round(Number(pack.size_bytes || 0) / 1024)))} KB · ${safeText(fmtTime(pack.created_at))}</p>
        <div style="margin-top:8px">${cats}</div>
      </div>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-pack-load="${safeText(pack.id)}">${safeText(L('بارگذاری در اجرای برنامه', 'Load into the run', 'In den Durchlauf laden'))}</button>
        <button type="button" class="btn btn-danger" data-pack-del="${safeText(pack.id)}">🗑</button>
      </div></div></article>`;
  }).join('');
  return `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">🗂</span><div><p class="kicker">${safeText(L('فقط مالک', 'OWNER ONLY', 'NUR INHABER'))}</p><h1>${safeText(L('افزودن دستی محتوا', 'Add content manually', 'Inhalte manuell hinzufügen'))}</h1><small>${safeText(L('پک‌های کامل ثبت‌شده از شش دسته تمرین (همراه صوت و پاسخ‌ها). یکی را انتخاب کنید تا اجرای برنامه با همان محتوا بارگذاری شود.', 'Stored complete packs of the six exercise categories, with audio and answers. Pick one to load it into the run.', 'Gespeicherte komplette Packs der sechs Übungsbereiche inklusive Audio und Antworten. Auswählen, um sie in den Durchlauf zu laden.'))}</small></div></div></header>
    <div class="row-actions" style="margin:0 0 14px"><button type="button" class="btn" data-act="packs-refresh">↻ ${safeText(L('به‌روزرسانی', 'Refresh', 'Aktualisieren'))}</button><button type="button" class="btn btn-ghost" data-act="packs-back">${safeText(L('بازگشت به برنامه', 'Back to the plan', 'Zurück zum Plan'))}</button></div>
    ${error ? `<p class="error-line">${safeText(error)}</p>` : ''}
    ${loading ? `<section class="card"><p class="muted">${safeText(L('در حال خواندن پک‌ها…', 'Loading packs…', 'Packs werden geladen…'))}</p></section>`
      : (rows || `<section class="card"><p class="muted">${safeText(L('هنوز پکی ثبت نشده است. با «ثبت نتیجه و تمرین تازه» یا پایان روز، پک بعدی خودکار ثبت می‌شود.', 'No pack stored yet. The next pack is stored automatically on “save & renew” or at the day end.', 'Noch kein Pack gespeichert. Der nächste Pack wird bei „Speichern & erneuern“ oder am Tagesende automatisch abgelegt.'))}</p></section>`)}`;
}
