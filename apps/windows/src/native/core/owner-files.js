// Owner day files («فایل روز», owner account only): a snapshot of a plan day's content and the owner's answers,
// kept in the account's `ownerDayFiles` (30 newest) — port of the site's TDM.dayFileSnapshot and the
// ownerDayFile* helpers. Captured when the day's plan is finished, before «تمرین تازه», and from History.

import { MODS } from './engine.js';
import { answerLabel, correctLabel, isCorrect } from './work.js';
import { today } from './learning.js';
import { lang } from './i18n.js';
import { esc as safeText } from './ui.js';

export const OWNER_DAY_FILE_LIMIT = 30;
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const pad = (n) => String(n).padStart(2, '0');
const timeStr = (s) => { s = Math.max(0, Math.round(Number(s) || 0)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`; };

/** Site TDM.dayFileSnapshot(date), 1:1. */
export function dayFileSnapshot(eng, date) {
  let d = null;
  try { d = eng.M().days?.[date] || null; } catch { d = null; }
  if (!d) return null;
  const idOf = (v) => (typeof v === 'string' ? v : v && v.id) || null;
  const qRows = (it, set, w) => (it?.questions || []).map((q) => {
    const a = w.ans?.[set + ':' + q.id];
    return {
      q: q.q || q.question || '', type: q.type || 'mc', options: Array.isArray(q.options) ? q.options.map(String) : [],
      user: (() => { try { return answerLabel(q, a) || ''; } catch { return a == null ? '' : String(a); } })(),
      correct: (() => { try { return correctLabel(q) || ''; } catch { return ''; } })(),
      ok: q.type === 'short' ? null : (() => { try { return !!isCorrect(q, a); } catch { return null; } })(),
      evidence: q.evidence || '', explain: q.explain_fa || '',
    };
  });
  const words = (it) => (it?.vocab || []).map((v) => ({ wort: v.wort || '', artikel: v.artikel || '', plural: v.plural || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '' }));
  const mods = [];
  eng.dayModules(date).forEach((id) => {
    const w = (d.work || {})[id] || {}; const res = (d.results || {})[id] || null; const meta = MODS[id] || {};
    const row = { id, de: meta.de || id, fa: meta.fa || id, result: res, title: '', questions: [], text: '', ratings: {}, words: [], sentences: [], tasks: [], notes: [], paragraphs: [], transcript: '', audio: '' };
    try {
      if (id === 'hoeren' || id === 'lesen') {
        const it = eng.item(id, idOf(d.picks?.[id])); const set = id === 'hoeren' ? 'h' : 'l';
        row.title = it?.title || it?.titel || it?.thema || '';
        row.audio = it?.audio || '';
        if (id === 'hoeren') { const names = it?.speakers || []; row.transcript = (it?.segments || []).map((seg) => `${names[seg.s]?.name ? names[seg.s].name + ': ' : ''}${seg.text || ''}`).join('\n'); row.formatLabel = it?.formatLabel || ''; }
        else row.paragraphs = (it?.paragraphs || []).map((p, n) => ({ heading: (p && p.heading) || '', text: (p && (p.text || p)) || '', n: n + 1 }));
        row.words = words(it);
        row.questions = qRows(it, set, w);
      } else if (id === 'schreiben') {
        const pick = d.picks?.schreiben; const kind = pick?.kind === 'grafik' ? 'grafik' : 'argumentation';
        const it = eng.item(kind, idOf(pick)) || {};
        row.kind = kind; row.title = it.title || it.thema || (kind === 'grafik' ? 'Grafik' : 'Argumentation');
        row.situation = it.situation || ''; row.task = it.task || ''; row.sourceText = it.text || '';
        row.material = Array.isArray(it.positions) ? it.positions.map((p) => `${p.person ? p.person + ': ' : ''}${p.text || ''}`).join('\n') : (it.material || '');
        row.modelText = it.model_text || ''; row.text = w.f?.text || '';
        ['grammatik', 'wortschatz', 'konnektoren', 'struktur', 'aufgabe'].forEach((k) => { const v = Number(w.rate?.['k_' + k]); if (v) row.ratings[k] = v; });
      } else if (id === 'sprechen') {
        // as on the site: spList() gives task ids, so the site's file shows «Aufgabe n» with the ratings and notes only
        // (kept identical because site and app write the same ownerDayFiles)
        const list = eng.spList(d) || [];
        const recs = w.rec && typeof w.rec === 'object' ? Object.values(w.rec).filter((v) => typeof v === 'string' && /\.(webm|mp3|m4a|ogg)/i.test(v)) : [];
        list.forEach((it, i) => {
          const r = {}; ['fluss', 'genau', 'struktur', 'aufgabe'].forEach((k) => { const v = Number(w.rate?.['s' + i + '_' + k]); if (v) r[k] = v; });
          row.tasks.push({ title: it?.title || it?.titel || it?.thema || ('Aufgabe ' + (i + 1)), situation: it?.situation || '', task: it?.task || '', material: it?.material || '', ratings: r, note: w.f?.['an_note_' + i] || '', audio: recs[i] || '' });
        });
      } else if (id === 'wortschatz') {
        (eng.item('lesen', d.picks?.lesen)?.vocab || []).forEach((v) => row.words.push({ wort: v.wort || '', artikel: v.artikel || '', plural: v.plural || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '' }));
        [0, 1, 2, 3, 4].forEach((i) => { const s = String(w.f?.['satz_' + i] || '').trim(); if (s) row.sentences.push(s); });
        row.notes = (w.f?.mat || []).filter(Boolean).map(String);
      } else if (id === 'fehleranalyse') { row.notes = Array.isArray(w.f?.top) ? w.f.top.map(String) : []; row.text = w.f?.weak || ''; }
      else if (id === 'wiederholung') { row.reviewed = Object.keys(w.ans || {}).length; row.quiz = w.quiz?.done ? w.quiz.pct : null; }
      else if (id === 'wochenbericht') row.saved = !!eng.M().weekly?.['W' + d.week];
    } catch { /* keep the row even if a branch fails */ }
    mods.push(row);
  });
  return { date, mode: d.mode || 'normal', week: d.week || null, level: d.level || null, createdAt: d.createdAt || null, modules: mods };
}

/** Site captureOwnerDayFile / ownerPruneDayFiles / deleteOwnerDayFile on the store (owner only). */
export function createOwnerFiles({ store, engine, account }) {
  const isOwner = () => !!(account() || {}).owner;
  const all = () => (store.get('ownerDayFiles') && typeof store.get('ownerDayFiles') === 'object' ? store.get('ownerDayFiles') : {});
  const fileFor = (date) => all()[date] || null;
  function capture(date) {
    if (!isOwner()) return null;
    const eng = engine(); if (!eng) return null;
    const S = eng.S; const key = date || S.plan?.date || today();
    try {
      const snap = dayFileSnapshot(eng, key); if (!snap) return null;
      const day = (S.history || []).find((x) => x.date === key) || {};
      snap.planId = S.plan?.id || day.planId || '';
      snap.examName = S.plan?.examName || day.examName || '';
      snap.topic = S.user?.customTopic || day.topic || '';
      snap.time = key === today() ? Object.values(S.activityTimers || {}).reduce((s, v) => s + (Number(v) || 0), 0) : Number(day.time) || 0;
      snap.score = Number.isFinite(day.score) ? day.score : null;
      snap.comp = Number(day.comp) || (S.completedActivities || []).length || 0;
      snap.acts = Number(day.acts) || S.plan?.activities?.length || 0;
      snap.updatedAt = new Date().toISOString();
      const next = clone(all()); next[key] = snap;
      Object.keys(next).sort((a, b) => b.localeCompare(a)).slice(OWNER_DAY_FILE_LIMIT).forEach((k) => { delete next[k]; });
      store.set('ownerDayFiles', next);
      return snap;
    } catch (error) { console.warn('owner day file capture failed:', error); return null; }
  }
  function remove(date) { const next = clone(all()); if (!(date in next)) return false; delete next[date]; store.set('ownerDayFiles', next); return true; }
  return { isOwner, fileFor, capture, remove };
}

/* ── the site's day-file view (ownerDayFileButton / ownerDayFileInlineBlock / renderOwnerDayModule) ── */
const fa = () => lang() === 'fa'; const en = () => lang() === 'en';
export function ownerDayFileButton(files, date, openDate) {
  if (!files.isOwner()) return '';
  const has = !!files.fileFor(date); const open = openDate === date;
  const label = has ? (open ? (fa() ? 'بستن فایل روز' : en() ? 'Close day file' : 'Tagesdatei schließen') : (fa() ? 'فایل روز' : en() ? 'Day file' : 'Tagesdatei')) : (fa() ? 'ساخت فایل روز' : en() ? 'Create day file' : 'Tagesdatei erstellen');
  const hint = fa() ? 'مطالب و پاسخ‌های این روز به شکل فایل' : en() ? 'This day’s content and answers as a file' : 'Inhalte und Antworten dieses Tages als Datei';
  return `<button type="button" class="hx-file-btn ${has ? 'has' : ''}" data-dayfile="${safeText(date)}" title="${safeText(hint)}">📄 ${safeText(label)}</button>`;
}
function answerRow(q, index) {
  const mark = q.ok === true ? '✓' : q.ok === false ? '✗' : '•'; const color = q.ok === true ? '#34d399' : q.ok === false ? '#fb7185' : '#94a3b8';
  return `<div style="display:flex;gap:8px;padding:7px 0;border-top:1px solid rgba(148,163,184,.18)"><b style="color:${color};min-width:14px">${mark}</b><div style="min-width:0;flex:1"><p dir="ltr" style="margin:0;font-size:12px">${index + 1}. ${safeText(q.q)}</p><p style="margin:4px 0 0;font-size:11px;opacity:.75">${fa() ? 'پاسخ شما' : 'Your answer'}: <b dir="ltr" style="color:${color}">${safeText(q.user || '—')}</b>${q.correct ? ` · ${fa() ? 'درست' : 'Correct'}: <b dir="ltr" style="color:#0ea5e9">${safeText(q.correct)}</b>` : ''}</p></div></div>`;
}
const audio = (url, label) => (url ? `<div style="margin:6px 0"><b style="display:block;font-size:10px;opacity:.7;margin-bottom:3px">${safeText(label || 'Audio')}</b><audio controls preload="none" src="${safeText(url)}" style="width:100%;max-width:420px"></audio></div>` : '');
const pre = (t) => `<pre dir="ltr" class="hx-file-pre">${safeText(t)}</pre>`;
export function renderOwnerDayModule(mod) {
  const title = fa() ? mod.fa : mod.de;
  const resTxt = mod.result ? Object.entries(mod.result).filter(([, v]) => v != null && v !== false && v !== '').map(([k, v]) => `${k}: ${typeof v === 'number' ? v : Array.isArray(v) ? v.join(', ') : String(v).slice(0, 40)}`).join(' · ') : '';
  let body = '';
  if (mod.title) body += `<p class="hx-file-title" dir="ltr">${safeText(mod.title)}${mod.formatLabel ? ` · ${safeText(mod.formatLabel)}` : ''}</p>`;
  body += audio(mod.audio, fa() ? 'فایل صوتی تمرین' : en() ? 'Listening audio' : 'Hördatei');
  if (mod.paragraphs?.length) body += `<div class="hx-file-text" dir="ltr">${mod.paragraphs.map((p) => `<p>${p.heading ? `<b>${safeText(p.heading)}: </b>` : ''}${safeText(p.text)}</p>`).join('')}</div>`;
  if (mod.situation) body += `<p dir="ltr"><b>Situation:</b> ${safeText(mod.situation)}</p>`;
  if (mod.task) body += `<p dir="ltr"><b>Aufgabe:</b> ${safeText(mod.task)}</p>`;
  if (mod.sourceText) body += `<p dir="ltr"><b>Text:</b> ${safeText(mod.sourceText)}</p>`;
  if (mod.material) body += pre(mod.material);
  if (mod.questions?.length) body += mod.questions.map((q, i) => answerRow(q, i)).join('');
  if (mod.transcript) body += `<details><summary>${fa() ? 'نمایش ترنسکریپت صوتی' : en() ? 'Show transcript' : 'Transkript anzeigen'}</summary>${pre(mod.transcript)}</details>`;
  if (mod.text) body += `<div><b class="hx-file-label">${fa() ? 'متن شما' : en() ? 'Your text' : 'Dein Text'}</b>${pre(mod.text)}</div>`;
  if (mod.modelText) body += `<details><summary>${fa() ? 'نمونهٔ پاسخ' : en() ? 'Model answer' : 'Musterlösung'}</summary>${pre(mod.modelText)}</details>`;
  if (Object.keys(mod.ratings || {}).length) body += `<p class="muted small">${Object.entries(mod.ratings).map(([k, v]) => `${safeText(k)}: ${v}/5`).join(' · ')}</p>`;
  if (mod.tasks?.length) body += mod.tasks.map((t, i) => `<div class="hx-file-task"><b>${i + 1}. ${safeText(t.title)}</b>${t.situation ? `<p dir="ltr" class="muted">${safeText(t.situation)}</p>` : ''}${t.task ? `<p dir="ltr">${safeText(t.task)}</p>` : ''}${Object.keys(t.ratings || {}).length ? `<p class="muted small">${Object.entries(t.ratings).map(([k, v]) => `${safeText(k)}: ${v}/5`).join(' · ')}</p>` : ''}${t.note ? `<p dir="rtl">${safeText(t.note)}</p>` : ''}${audio(t.audio, fa() ? 'ضبط صدا' : 'Recording')}</div>`).join('');
  if (mod.words?.length) body += `<div class="hx-file-words">${mod.words.map((v) => `<span dir="ltr" title="${safeText(v.bedeutung_fa || '')}">${safeText((v.artikel ? v.artikel + ' ' : '') + (v.wort || ''))}${v.bedeutung_fa ? ` <small>· ${safeText(v.bedeutung_fa)}</small>` : ''}</span>`).join('')}</div>`;
  if (mod.sentences?.length) body += `<ul>${mod.sentences.map((s) => `<li dir="ltr">${safeText(s)}</li>`).join('')}</ul>`;
  if (mod.notes?.length) body += `<ul>${mod.notes.map((s) => `<li>${safeText(s)}</li>`).join('')}</ul>`;
  if (mod.quiz != null) body += `<p>Quiz: <b>${mod.quiz}%</b> · ${mod.reviewed || 0} ${fa() ? 'پاسخ' : 'answers'}</p>`;
  if (!body) body = `<p class="muted">${fa() ? 'برای این تمرین داده‌ای ثبت نشده است.' : en() ? 'No data was recorded for this exercise.' : 'Für diese Übung wurden keine Daten gespeichert.'}</p>`;
  return `<article class="hx-file-mod"><header><h3>${safeText(title)}</h3>${resTxt ? `<span dir="ltr">${safeText(resTxt)}</span>` : ''}</header>${body}</article>`;
}
export function ownerDayFileInlineBlock(files, date, openDate, history) {
  if (!files.isOwner()) return '';
  const snap = files.fileFor(date); const open = openDate === date; const day = (history || []).find((x) => x.date === date) || {};
  const mods = snap?.modules || []; const answers = mods.reduce((n, m) => n + (m.questions || []).length, 0);
  const info = snap ? `${mods.length} ${fa() ? 'تمرین' : en() ? 'exercises' : 'Übungen'} · ${answers} ${fa() ? 'پاسخ' : en() ? 'answers' : 'Antworten'}` : (fa() ? 'هنوز فایلی ساخته نشده است.' : en() ? 'No file yet.' : 'Noch keine Datei.');
  return `<div class="hx-file" dir="${fa() ? 'rtl' : 'ltr'}"><div class="hx-file-head"><span>📄</span><b>${fa() ? 'فایل روز' : en() ? 'Day file' : 'Tagesdatei'}</b><small>${safeText(info)} · ${timeStr(Number(day.time) || snap?.time || 0)}</small><button type="button" class="btn small" data-dayfile="${safeText(date)}">${open ? (fa() ? 'بستن' : en() ? 'Close' : 'Schließen') : (fa() ? 'نمایش محتوا' : en() ? 'Show content' : 'Inhalt zeigen')}</button>${snap ? `<button type="button" class="btn btn-danger small" data-dayfile-del="${safeText(date)}">🗑</button>` : ''}</div>${open ? (snap ? `<div>${mods.map(renderOwnerDayModule).join('')}</div>` : `<p class="warn-text small">${fa() ? 'برای این روز داده‌ای برای ساخت فایل موجود نیست.' : en() ? 'No stored data for this day.' : 'Keine gespeicherten Daten für diesen Tag.'}</p>`) : ''}</div>`;
}
