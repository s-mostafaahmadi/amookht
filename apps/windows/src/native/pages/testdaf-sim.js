// «شبیه‌سازی TestDaF» — port of the site's exam simulator (renderTestDaFSimulation and friends): exam library,
// overview, the four timed sections (Lesen 40, Hören 35, Schreiben 350–400 words, Sprechen 7 recordings),
// per-exam progress. Same stored keys as the site: testdafSim, testdafExamStates, testdafExamVisits,
// selectedTestdafExamId. Hören reads the transcript aloud (coach voice for premium, system voice otherwise).
// Admins (milestone 6): import an exam file, download, delete, the manual builder and per-section/question delete.

import { esc as E, toast } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import * as ss from './sim-score.js'; // SIM-SCORE
import { today } from '../core/learning.js';
import { confirmDialog, saveTextFile } from './widgets.js';

export const BUILTIN_ID = 'builtin-testdaf-1';
const SECTIONS = {
  lesen: { label: 'Lesen', minutes: 60, parts: 4, items: 40, desc: '4 akademische Lesetexte mit insgesamt 40 Aufgaben.' },
  hoeren: { label: 'Hören', minutes: 40, parts: 4, items: 35, desc: '4 Hörtexte mit Auswahl-, Lücken- und Zusammenfassungsaufgaben.' },
  schreiben: { label: 'Schreiben', minutes: 60, parts: 1, items: 1, desc: '1 Grafikaufgabe und ein strukturierter Text mit 350–400 Wörtern.' },
  sprechen: { label: 'Sprechen', minutes: 35, parts: 7, items: 7, desc: '7 hochschultypische Aufgaben mit Vorbereitung und Audioaufnahme.' },
};
const KEYS = ['lesen', 'hoeren', 'schreiben', 'sprechen'];
const L = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);
const pad = (n) => String(n).padStart(2, '0');
const timeStr = (s) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/* ───────── site data rules (1:1) ───────── */
function normalizeQuestion(question, section, index) {
  if (!question || typeof question !== 'object') return null;
  const options = Array.isArray(question.options) ? question.options.map((v) => String(v ?? '')).filter(Boolean) : [];
  const text = String(question.q || question.question || question.prompt || '').trim() || `${section === 'lesen' ? 'Lesen' : 'Hören'} Frage ${index + 1}`;
  let answer = question.answer ?? question.c ?? question.a ?? '';
  if (options.length) { const oi = options.findIndex((v) => String(v).trim() === String(answer).trim()); answer = oi >= 0 ? oi : Number.isInteger(Number(answer)) ? Math.max(0, Math.min(options.length - 1, Number(answer))) : 0; }
  const type = section === 'hoeren' ? (options.length >= 2 ? 'mc' : ['gap', 'summary'].includes(question.type) ? question.type : 'gap') : 'mc';
  return { ...question, q: text, type, options: section === 'lesen' && options.length < 2 ? [options[0] || 'Richtig', 'Falsch'] : options, answer };
}
export function normalizeExamData(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const parts = (section) => (Array.isArray(source[section]?.texts) ? source[section].texts : []).filter((x) => x && typeof x === 'object').map((item, index) => {
    const rawQ = Array.isArray(item.questions) ? item.questions : (item.question || item.q ? [item] : []);
    const questions = rawQ.map((q, qi) => normalizeQuestion(q, section, qi)).filter(Boolean);
    return { ...item, title: String(item.title || `${section === 'lesen' ? 'Lesetext' : 'Hörtext'} ${index + 1}`), text: String(item.text || item.transcript || item.content || ''), kind: String(item.kind || 'Aufgabe'), time: Math.max(1, Number(item.time) || 10), questions };
  }).filter((x) => x.questions.length > 0);
  const writing = source.schreiben && typeof source.schreiben === 'object' ? { ...source.schreiben } : {};
  const chart = (Array.isArray(writing.chart) ? writing.chart : []).map((p, i) => (Array.isArray(p) ? [String(p[0] ?? i + 1), Math.max(0, Math.min(100, Number(p[1]) || 0))] : [String(i + 1), Math.max(0, Math.min(100, Number(p) || 0))]));
  const tasks = (Array.isArray(source.sprechen?.tasks) ? source.sprechen.tasks : []).filter((t) => t && typeof t === 'object').map((t, i) => ({ ...t, type: String(t.type || t.level || `Aufgabe ${i + 1}`), q: String(t.q || t.question || t.instructions || `Sprechaufgabe ${i + 1}`), prep: Math.max(1, Number(t.prep) || 30), time: Math.max(1, Number(t.time) || 90) }));
  return { lesen: { texts: parts('lesen') }, hoeren: { texts: parts('hoeren') }, schreiben: { ...writing, title: String(writing.title || 'Schreiben'), task: String(writing.task || writing.question || ''), chartTitle: String(writing.chartTitle || 'Grafik'), chart: chart.length ? chart : [['1', 0], ['2', 0], ['3', 0]], min: Number(writing.min) || 350, max: Number(writing.max) || 400, time: Math.max(1, Number(writing.time) || 60) }, sprechen: { tasks } };
}
export function validateExamData(data) {
  if (!data || typeof data !== 'object') throw new Error('Die Prüfungsdaten fehlen.');
  for (const section of KEYS) if (!data[section] || typeof data[section] !== 'object') throw new Error(`Bereich ${section} fehlt.`);
  const lt = data.lesen.texts; const ht = data.hoeren.texts; const sp = data.sprechen.tasks;
  if (!Array.isArray(lt) || lt.length !== 4) throw new Error('Lesen benötigt genau 4 Texte.');
  const lq = lt.reduce((s, x) => s + (Array.isArray(x?.questions) ? x.questions.length : 0), 0); if (lq !== 40) throw new Error(`Lesen benötigt genau 40 Fragen; gefunden: ${lq}.`);
  if (!Array.isArray(ht) || ht.length !== 4) throw new Error('Hören benötigt genau 4 Texte.');
  const hq = ht.reduce((s, x) => s + (Array.isArray(x?.questions) ? x.questions.length : 0), 0); if (hq !== 35) throw new Error(`Hören benötigt genau 35 Fragen; gefunden: ${hq}.`);
  if (!Array.isArray(data.schreiben.chart) || data.schreiben.chart.length < 3 || Number(data.schreiben.min) !== 350 || Number(data.schreiben.max) !== 400) throw new Error('Schreiben benötigt eine Grafik und den Wortbereich 350–400.');
  if (!Array.isArray(sp) || sp.length !== 7) throw new Error('Sprechen benötigt genau 7 Aufgaben.');
  return { lesenQuestions: lq, hoerenQuestions: hq, sprechenTasks: sp.length };
}
export function parseExamFile(raw) {
  const source = String(raw || '').replace(/^﻿/, '').trim(); let payload = null;
  try { payload = JSON.parse(source); } catch {
    const m = source.match(/^(?:const|let|var)\s+(?:AMOOKHT_TESTDAF_EXAM|AMOOKHT_TESTDAF_SIM_DATA)\s*=\s*([\s\S]*?);?\s*$/);
    if (!m) throw new Error('Nur JSON oder eine von Amookht exportierte testdaf-simulation-data.js ist erlaubt.');
    try { payload = JSON.parse(m[1].trim()); } catch { throw new Error('Die JS-Datei enthält kein gültiges exportiertes JSON. Bitte zuerst die Amookht-Vorlage herunterladen.'); }
  }
  const meta = payload?.meta || {}; const data = payload?.data || payload?.exam?.data || payload;
  return { meta, data, stats: validateExamData(data) };
}
const SCHEMAS = { lesen: '{"title":"Text 1","text":"...","time":10,"questions":[{"q":"...","options":["A","B"],"answer":0}]}', hoeren: '{"title":"Audio 1","text":"...","questions":[{"q":"...","type":"mc","options":["A","B"],"answer":0}]}', schreiben: '{"title":"...","task":"...","chartTitle":"...","chart":[1,2,3],"min":350,"max":400}', sprechen: '{"type":"Aufgabe 1","q":"...","prep":30,"time":60}' };
const SEC_LABEL = { lesen: 'Lesen', hoeren: 'Hören', schreiben: 'Schreiben', sprechen: 'Sprechen' };
export const newSimState = (examId) => ({ version: 3, examId, started: false, finished: false, active: 'overview', sectionStarts: {}, answers: { lesen: {}, hoeren: {}, schreiben: '', sprechen: {} }, recordings: {}, done: {} });
const normalizeAnswer = (v) => String(v ?? '').toLocaleLowerCase('de-DE').normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
export function questionCorrect(q, value) { if (q.type === 'mc') return Number(value) === Number(q.answer); const a = normalizeAnswer(value); return String(q.answer || '').split('|').some((x) => normalizeAnswer(x) === a); }
export const wordCount = (v) => (String(v || '').trim() ? String(v).trim().split(/\s+/).length : 0);
const hasAnswer = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const examReady = (exam) => { const d = exam?.data || {}; return Array.isArray(d.lesen?.texts) && d.lesen.texts.length > 0 && Array.isArray(d.hoeren?.texts) && d.hoeren.texts.length > 0 && d.schreiben?.task && Array.isArray(d.sprechen?.tasks) && d.sprechen.tasks.length > 0; };

export function renderTestdafSim(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page sim';
  root.dir = 'ltr'; // a German exam screen, like the site's (Persian notes keep dir="auto")
  const ui = { library: true, remote: [], loaded: false, message: '', builtin: null, recIndex: null, recStatus: 'idle', rec: null, timer: null, saveT: null };
  const premium = () => { const a = ctx.account || {}; return !!(a.premium || a.admin || a.owner); };
  const isAdmin = () => { const a = ctx.account || {}; return !!(a.admin || a.owner); };
  ui.imp = null; ui.manual = { title: '', description: '', lesen: '', hoeren: '', schreiben: '', sprechen: '' };

  /* ── state (draft of the four stored keys) ── */
  const S = { selected: ctx.store.get('selectedTestdafExamId') || BUILTIN_ID, states: clone(ctx.store.get('testdafExamStates')) || {}, visits: clone(ctx.store.get('testdafExamVisits')) || {}, legacy: clone(ctx.store.get('testdafSim')) };
  function ensureState() {
    const id = S.selected || BUILTIN_ID;
    let st = S.states[id];
    if (!st && S.legacy?.examId === id) st = S.legacy;
    if (!st && id === BUILTIN_ID && S.legacy && !S.legacy.examId) st = S.legacy;
    if (!st) st = newSimState(id);
    if (st.version !== 3 || st.examId !== id) st = { ...newSimState(id), ...st, version: 3, examId: id };
    st.answers = st.answers || { lesen: {}, hoeren: {}, schreiben: '', sprechen: {} };
    ['lesen', 'hoeren', 'sprechen'].forEach((k) => { st.answers[k] = st.answers[k] || {}; });
    st.recordings = st.recordings || {}; st.sectionStarts = st.sectionStarts || {}; st.done = st.done || {};
    S.states[id] = st; S.legacy = st;
    return st;
  }
  function save() {
    clearTimeout(ui.saveT); ui.saveT = null;
    const st = ensureState();
    const put = (k, v) => { if (JSON.stringify(v ?? null) !== JSON.stringify(ctx.store.get(k) ?? null)) ctx.store.set(k, clone(v)); };
    put('testdafSim', st);
    put('testdafExamStates', { ...S.states, [S.selected || BUILTIN_ID]: st });
    put('testdafExamVisits', S.visits);
    put('selectedTestdafExamId', S.selected || BUILTIN_ID);
  }
  const saveSoon = () => { clearTimeout(ui.saveT); ui.saveT = setTimeout(save, 700); };
  function visit(examId, completed) { const now = new Date().toISOString(); const old = S.visits[examId] || {}; S.visits[examId] = { ...old, firstVisitedAt: old.firstVisitedAt || now, lastVisitedAt: now, lastVisitedDate: today(), completedAt: completed ? (old.completedAt || now) : old.completedAt || null }; }
  function status(examId) {
    const v = S.visits[examId]; const st = S.states[examId];
    if (v?.completedAt || st?.finished) return { kind: 'done', label: L('✓ انجام‌شده', '✓ Completed', '✓ Abgeschlossen') };
    if (v || st?.started) return { kind: st?.started ? 'progress' : 'visited', label: L('✓ بازدید شده', '✓ Visited', '✓ Besucht') };
    return { kind: 'new', label: L('جدید', 'New', 'Neu') };
  }

  /* ── exams ── */
  const entries = () => [{ id: BUILTIN_ID, title: 'TestDaF Modellprüfung 1', description: 'Vollständige TestDaF-Simulation mit 40 Leseaufgaben, 35 Höraufgaben, Schreiben und 7 Sprechaufgaben.', builtin: true, data: ui.builtin }, ...ui.remote.filter((x) => x?.id && x.id !== BUILTIN_ID && x.data)];
  const selectedExam = () => { const list = entries(); return list.find((x) => x.id === S.selected) || list[0]; };
  const data = () => normalizeExamData(selectedExam()?.data || ui.builtin);
  async function loadRemote() {
    if (!premium()) { ui.remote = []; ui.loaded = true; return; }
    const r = await ctx.bridge.api('/v1/testdaf-exams');
    if (r.ok) { ui.remote = Array.isArray(r.data?.exams) ? r.data.exams : []; ui.message = ''; } else ui.message = 'Die öffentliche Prüfungsliste konnte nicht aktualisiert werden.';
    ui.loaded = true;
  }
  const totalItems = (id, d = data()) => (id === 'lesen' || id === 'hoeren' ? d[id].texts.reduce((s, p) => s + p.questions.length, 0) : id === 'schreiben' ? 1 : d.sprechen.tasks.length);
  function answeredCount(id) { const st = ensureState(); if (id === 'lesen' || id === 'hoeren') return Object.values(st.answers[id] || {}).filter(hasAnswer).length; if (id === 'schreiben') return wordCount(st.answers.schreiben) > 0 ? 1 : 0; return Object.keys(st.recordings || {}).length; }
  function autoStats(id, d = data()) { let correct = 0; let total = 0; const st = ensureState(); d[id].texts.forEach((p, pi) => p.questions.forEach((q, qi) => { if (q.type === 'summary') return; total += 1; if (questionCorrect(q, st.answers[id]?.[`${pi}-${qi}`])) correct += 1; })); return { correct, total }; }
  const remaining = (id) => { const st = ensureState(); const started = st.sectionStarts[id] || Date.now(); return Math.max(0, SECTIONS[id].minutes * 60 - Math.floor((Date.now() - started) / 1000)); };

  /* ── Hören: read the transcript aloud ── */
  let audio = null; let speaking = 0;
  function stopAudio() { speaking += 1; try { audio?.pause(); } catch { /* ignore */ } try { speechSynthesis.cancel(); } catch { /* ignore */ } }
  async function playText(text) {
    stopAudio(); const run = speaking;
    const chunks = String(text).match(/[^.!?…]+[.!?…]*\s*/g) || [String(text)];
    const parts = []; let cur = '';
    chunks.forEach((c) => { if ((cur + c).length > 480 && cur) { parts.push(cur); cur = ''; } cur += c; });
    if (cur.trim()) parts.push(cur);
    if (await ss.playSimAudio(ctx, text, (a) => { audio = a; })) return; // SIM-AUDIO: multi-voice file when available
    if (run !== speaking) return;
    for (const part of parts) {
      if (run !== speaking) return;
      const r = premium() ? await ctx.bridge.api('/coach/api/tts', { method: 'POST', body: { text: part.trim(), speed: 0.95 }, binary: true }) : null;
      if (run !== speaking) return;
      if (r && r.ok) {
        const bin = atob(r.data.base64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: r.data.type || 'audio/mpeg' }));
        audio = new Audio(url);
        await new Promise((res) => { audio.onended = res; audio.onerror = res; audio.play().catch(res); });
        URL.revokeObjectURL(url);
      } else {
        await new Promise((res) => { try { const u = new SpeechSynthesisUtterance(part); u.lang = 'de-DE'; u.rate = 0.92; u.onend = res; u.onerror = res; speechSynthesis.speak(u); } catch { res(); } });
      }
    }
  }

  /* ── Sprechen recorder ── */
  async function startRec(index) {
    const task = data().sprechen.tasks[index];
    if (!task || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { ui.recIndex = index; ui.recStatus = 'unsupported'; draw(); return; }
    if (ui.rec && ui.rec.state === 'recording') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const chunks = [];
      const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
      const rec = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream);
      ui.rec = rec; ui.recIndex = index; ui.recStatus = 'recording'; ui.recStart = Date.now();
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      rec.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); const mime = (rec.mimeType || 'audio/webm').split(';')[0]; await upload(new Blob(chunks, { type: mime }), mime, index); };
      rec.start(250);
      draw();
    } catch (error) { console.warn(error); ui.recIndex = index; ui.recStatus = 'denied'; draw(); }
  }
  function stopRec() { if (ui.rec && ui.rec.state === 'recording') { ui.recStatus = 'uploading'; ui.rec.stop(); draw(); } }
  async function upload(blob, mime, index) {
    const st = ensureState();
    const r = await ctx.bridge.speakingUpload({ bytes: new Uint8Array(await blob.arrayBuffer()), mime, filename: `testdaf-sim-${index + 1}.${mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'}`, planId: `testdaf-simulation-${S.selected || BUILTIN_ID}`, taskId: `testdaf-sim-${index + 1}` });
    if (r.ok) { st.recordings[index] = { ...r.data, savedAt: new Date().toISOString() }; st.answers.sprechen[index] = `Audioaufnahme gespeichert: ${r.data.id}`; ui.recStatus = 'saved'; }
    else { st.recordings[index] = { playback_url: URL.createObjectURL(blob), local: true, savedAt: new Date().toISOString() }; st.answers.sprechen[index] = 'Audioaufnahme lokal verfügbar'; ui.recStatus = 'local-saved'; }
    ctx.store.set('recordingDate', today());
    save(); draw();
  }
  const playback = (rec) => { if (!rec?.playback_url) return ''; if (rec.local) return rec.playback_url; const q = rec.playback_token ? `?user_id=${encodeURIComponent(ctx.account.id || '')}&token=${encodeURIComponent(rec.playback_token)}` : ''; return ctx.siteOrigin() + rec.playback_url + q; };

  /* ── views ── */
  function gateView() {
    return `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">🎓</span><div><h1>${E(L('شبیه‌سازی TestDaF', 'TestDaF simulation', 'TestDaF-Simulation'))}</h1><small>${E(L('این بخش برای حساب‌های ویژه فعال است.', 'This area is for premium accounts.', 'Dieser Bereich ist für Premium-Konten.'))}</small></div></div></header>
      <section class="sim-grid sim-locked">${[['Lesen', '40'], ['Hören', '35'], ['Schreiben', '1'], ['Sprechen', '7']].map(([l, n]) => `<div class="card"><span class="kicker">PREMIUM</span><b>${l}</b><small class="muted">${n} Aufgaben</small></div>`).join('')}</section>`;
  }
  function libraryView() {
    const msg = ui.message;
    return `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">🎓</span><div><p class="kicker">TestDaF Exam</p><h1>Prüfungsbibliothek</h1><small>Wähle eine öffentliche Modellprüfung. Dein Fortschritt wird pro Prüfung und Konto gespeichert.</small></div></div><button type="button" class="btn" data-sim="reload">Liste aktualisieren</button></header>
      ${msg ? `<div class="card ${/fehler|fehlgeschlagen|nicht/.test(msg) ? 'warn-card' : ''}" dir="auto">${E(msg)}</div>` : ''}
      <section class="sim-library">${entries().map((exam, i) => { const s = status(exam.id); const v = S.visits[exam.id]; const st = S.states[exam.id]; const date = v?.lastVisitedAt ? new Date(v.lastVisitedAt).toLocaleDateString(lang() === 'fa' ? 'fa-IR' : lang() === 'en' ? 'en-GB' : 'de-DE') : '';
        return `<article class="card sim-exam is-${s.kind}" style="--n:${i % 3}"><div class="sim-exam-top"><div><span class="sim-badge is-${s.kind}">${E(s.label)}</span><h2 dir="ltr">${E(exam.title)}</h2></div><span class="sim-ico">${exam.builtin ? '🎓' : '📝'}</span></div>
          <p class="muted" dir="ltr">${E(exam.description || 'Öffentliche TestDaF-Modellprüfung')}</p>
          <div class="sim-tags"><span>40 Lesen</span><span>35 Hören</span><span>1 Schreiben</span><span>7 Sprechen</span></div>
          ${date ? `<p class="muted small">Zuletzt besucht: ${E(date)}${st?.finished ? ' · abgeschlossen' : ''}</p>` : ''}
          <button type="button" class="btn btn-primary wide" data-open="${E(exam.id)}">${st?.started ? (st.finished ? 'Ergebnis öffnen' : 'Fortsetzen') : 'Prüfung auswählen'}</button>
          ${isAdmin() ? `<div class="row-actions"><button type="button" class="btn" data-dl="${E(exam.id)}">JS herunterladen</button>${exam.builtin ? '' : `<button type="button" class="btn btn-danger" data-rm="${E(exam.id)}">Entfernen</button>`}</div>` : ''}</article>`; }).join('')}</section>${isAdmin() ? adminPanel() : ''}`;
  }
  function adminPanel() {
    const c = { title: L('افزودن آزمون عمومی', 'Add public exam', 'Öffentliche Prüfung hinzufügen'), hint: L('نام هم‌سان، داده را به آزمون موجود اضافه می‌کند؛ نام جدید یک آزمون تازه می‌سازد.', 'A matching name appends to the existing exam; a new name creates a new exam.', 'Ein gleicher Name ergänzt die vorhandene Prüfung; ein neuer Name erstellt eine neue Prüfung.'), name: L('نام آزمون', 'Exam name', 'Prüfungsname'), desc: L('توضیحات', 'Description', 'Beschreibung'), add: L('افزودن', 'Add', 'Hinzufügen'), manage: L('مدیریت سؤال‌ها و بخش‌ها', 'Manage questions and sections', 'Fragen und Bereiche verwalten'), empty: L('در این بخش محتوایی وجود ندارد.', 'No content in this section.', 'Noch keine Inhalte in diesem Bereich.'), remove: L('حذف', 'Delete', 'Löschen'), copyJson: L('کپی نمونه JSON', 'Copy JSON example', 'JSON-Beispiel kopieren') };
    const m = ui.manual; const imp = ui.imp;
    const tree = (exam) => { const d = exam.data || {}; const groups = [['lesen', d.lesen?.texts || []], ['hoeren', d.hoeren?.texts || []], ['schreiben', d.schreiben?.task ? [d.schreiben] : []], ['sprechen', d.sprechen?.tasks || []]];
      return `<details class="sim-tree"><summary><b dir="ltr">${E(exam.title)}</b> · ${exam.stats?.lesen_questions || 0}/${exam.stats?.hoeren_questions || 0}/${exam.stats?.schreiben_tasks || 0}/${exam.stats?.sprechen_tasks || 0}</summary>${groups.map(([sec, items]) => `<details><summary>${SEC_LABEL[sec]} (${items.length})</summary>${items.length ? items.map((it, ii) => `<div class="sim-tree-item"><div class="sim-exam-top"><b dir="ltr">${E(it.title || it.type || it.task || it.q || `${sec} ${ii + 1}`)}</b><button type="button" class="btn btn-danger small" data-part="${E(exam.id)}|${sec}|${ii}|">${E(c.remove)}</button></div>${Array.isArray(it.questions) ? it.questions.map((q, qi) => `<div class="sim-tree-q"><span dir="ltr">${qi + 1}. ${E(q.q || q.question || '')}</span><button type="button" class="link-danger" data-part="${E(exam.id)}|${sec}|${ii}|${qi}">× ${E(c.remove)}</button></div>`).join('') : ''}</div>`).join('') : `<p class="muted small">${E(c.empty)}</p>`}</details>`).join('')}</details>`; };
    return `<section class="card sim-admin"><p class="kicker">Administrator</p>
      <h2>${E(L('ورود فایل آزمون', 'Import exam file', 'Prüfungsdatei importieren'))}</h2>
      <label class="btn sim-file"><input type="file" accept=".json,.js" data-import="1" hidden />📄 ${E(L('انتخاب فایل JSON یا JS', 'Choose a JSON or JS file', 'JSON- oder JS-Datei wählen'))}</label>
      ${imp ? `<div class="sim-import"><p>Datei geprüft: 40 Lesen · 35 Hören · 1 Schreiben · 7 Sprechen.</p><label class="fld"><span>${E(c.name)}</span><input data-imp="title" value="${E(imp.title)}" /></label><label class="fld"><span>${E(c.desc)}</span><input data-imp="description" value="${E(imp.description)}" /></label><div class="row-actions"><button type="button" class="btn btn-primary" data-sim="imp-save">${E(L('انتشار برای همه', 'Publish for everyone', 'Für alle veröffentlichen'))}</button><button type="button" class="btn" data-sim="imp-cancel">${E(L('انصراف', 'Cancel', 'Abbrechen'))}</button></div></div>` : ''}
      <h2>${E(c.title)}</h2><p class="muted">${E(c.hint)}</p>
      <div class="sim-builder"><label class="fld"><span>${E(c.name)}</span><input data-man="title" value="${E(m.title)}" /></label><label class="fld"><span>${E(c.desc)}</span><input data-man="description" value="${E(m.description)}" /></label>
        ${KEYS.map((sec) => `<label class="fld"><span>${SEC_LABEL[sec]}</span><textarea dir="ltr" class="mono" rows="6" data-man="${sec}" placeholder='${E(SCHEMAS[sec])}'>${E(m[sec])}</textarea><button type="button" class="btn small" data-copy-schema="${sec}">${E(c.copyJson)}</button></label>`).join('')}</div>
      <button type="button" class="btn btn-primary wide" data-sim="man-save">${E(c.add)}</button>
      <h2>${E(c.manage)}</h2>${ui.remote.map(tree).join('')}</section>`;
  }
  function introView(exam) {
    const s = status(exam.id);
    return `<button type="button" class="btn" data-sim="library">← Prüfungsbibliothek</button>
      <section class="card sim-intro"><div class="sim-exam-top"><div><p class="kicker">TestDaF Prüfungssimulation</p><h1 dir="ltr">${E(exam.title)}</h1></div>${s.kind !== 'new' ? `<span class="sim-badge is-${s.kind}">${E(s.label)}</span>` : ''}</div>
        <p dir="ltr">${E(exam.description || 'Eine vollständige TestDaF-Modellprüfung.')}</p>
        <div class="sim-grid">${KEYS.map((id) => `<div class="sim-mini"><b>${SECTIONS[id].label}</b><small>${SECTIONS[id].minutes} min · ${SECTIONS[id].parts} Teile · ${SECTIONS[id].items} Aufgaben</small></div>`).join('')}</div>
        <button type="button" class="btn btn-primary big" data-sim="start">Simulation starten</button></section>`;
  }
  function overviewView(exam) {
    const st = ensureState(); const d = data(); const done = st.done || {}; const completed = KEYS.filter((k) => done[k]).length;
    const ls = autoStats('lesen', d); const hs = autoStats('hoeren', d);
    return `<header class="sim-head"><div class="sim-head-main"><button type="button" class="btn" data-sim="library">← Liste</button><div><p class="kicker">TestDaF Simulation</p><h1 dir="ltr">${E(exam.title)}</h1><small class="muted">${completed}/4 Bereiche abgeschlossen</small></div></div><button type="button" class="btn btn-danger" data-sim="reset">Neu starten</button></header>
      ${st.finished ? `<section class="card sim-done"><div class="sim-exam-top"><div><h2>✓ Simulation abgeschlossen</h2><p class="muted">Diese Prüfung bleibt in deiner Liste als abgeschlossen markiert.</p></div><button type="button" class="btn btn-primary" data-sim="library">Weitere Prüfung</button></div>
        <div class="sim-grid"><div><b>Lesen</b><p>${ls.correct}/${ls.total} ${E(L('به‌صورت خودکار درست', 'automatically correct', 'automatisch richtig'))}</p></div><div><b>Hören</b><p>${hs.correct}/${hs.total} ${E(L('به‌صورت عینی درست', 'objectively correct', 'objektiv richtig'))}</p></div><div><b>Schreiben</b><p>${wordCount(st.answers.schreiben)} ${E(L('واژه', 'words', 'Wörter'))}</p></div><div><b>Sprechen</b><p>${Object.keys(st.recordings || {}).length}/7 Aufnahmen</p></div></div></section>` : ''}
      ${premium() ? ss.tdPanel(ctx, st, d, (id) => autoStats(id, d)) : ''}<section class="sim-sections">${KEYS.map((id) => `<button type="button" class="card sim-section ${done[id] ? 'is-done' : ''}" data-section="${id}"><div class="sim-exam-top"><div><h2>${SECTIONS[id].label}</h2><p class="muted" dir="ltr">${SECTIONS[id].desc}</p></div><b class="sim-go">${done[id] ? 'Done' : answeredCount(id) ? 'Weiter' : 'Start'}</b></div>
        <div class="sim-tags"><span>${SECTIONS[id].minutes} min</span><span>${SECTIONS[id].parts} Teile</span><span>${answeredCount(id)}/${totalItems(id, d)} beantwortet</span></div></button>`).join('')}</section>`;
  }
  const radio = (section, key, oi, val) => `<label class="sim-opt"><input type="radio" name="sim-${section}-${key}" ${String(val) === String(oi) ? 'checked' : ''} data-ans="${section}|${key}|${oi}" /><span dir="ltr"></span></label>`;
  function lesenView(c) {
    let n = 0; const st = ensureState();
    return c.texts.map((part, pi) => `<section class="card sim-part"><div class="sim-exam-top"><div><p class="kicker">Text ${pi + 1} · ${part.questions.length} Aufgaben</p><h2 dir="ltr">${E(part.title)}</h2></div><small class="muted">${part.time} min</small></div>
      <article class="sim-text" dir="ltr" lang="de">${E(part.text)}</article>
      ${part.questions.map((q, qi) => { const key = `${pi}-${qi}`; const val = st.answers.lesen[key]; n += 1; return `<div class="sim-q"><b dir="ltr">${n}. ${E(q.q)}</b><div class="sim-opts">${q.options.map((o, oi) => radio('lesen', key, oi, val).replace('<span dir="ltr"></span>', `<span dir="ltr">${E(o)}</span>`)).join('')}</div></div>`; }).join('')}</section>`).join('');
  }
  function hoerenView(c) {
    let n = 0; const st = ensureState();
    return c.texts.map((part, pi) => `<section class="card sim-part"><div class="sim-exam-top"><div><p class="kicker">Audio ${pi + 1} · ${E(part.kind)} · ${part.questions.length} Aufgaben</p><h2 dir="ltr">${E(part.title)}</h2></div><small class="muted">${part.time} min</small></div>
      <div class="row-actions"><button type="button" class="btn btn-primary" data-play="${pi}">▶ Audio abspielen</button><button type="button" class="btn" data-sim="stop">■ Stoppen</button></div>
      <details class="sim-tr"><summary>Transkript erst nach dem Hören kontrollieren</summary><p class="sim-text" dir="ltr" lang="de">${E(part.text)}</p></details>
      ${part.questions.map((q, qi) => { const key = `${pi}-${qi}`; const val = st.answers.hoeren[key]; n += 1; const tl = q.type === 'mc' ? 'Mehrfachauswahl' : q.type === 'gap' ? 'Lücke' : 'Zusammenfassung';
        return `<div class="sim-q"><div class="sim-qh"><span class="chip small">${tl}</span><b dir="ltr">${n}. ${E(q.q)}</b></div>${q.type === 'mc' ? `<div class="sim-opts">${q.options.map((o, oi) => radio('hoeren', key, oi, val).replace('<span dir="ltr"></span>', `<span dir="ltr">${E(o)}</span>`)).join('')}</div>` : q.type === 'gap' ? `<input class="tdm-input" dir="ltr" data-text="hoeren|${key}" value="${E(val || '')}" placeholder="Kurze Antwort …" />` : `<textarea class="tdm-input" dir="ltr" rows="3" data-text="hoeren|${key}" placeholder="1–2 Sätze …">${E(val || '')}</textarea>`}</div>`; }).join('')}</section>`).join('');
  }
  function schreibenView(c) {
    const val = ensureState().answers.schreiben || ''; const count = wordCount(val);
    return `<section class="card sim-part"><div class="sim-exam-top"><div><p class="kicker">Grafikbeschreibung · Argumentation</p><h2 dir="ltr">${E(c.title)}</h2></div><small class="muted">${c.time} min</small></div>
      <p dir="ltr">${E(c.task)}</p>
      <div class="sim-chart"><b dir="ltr">${E(c.chartTitle)}</b><div class="sim-bars">${c.chart.map(([y, v]) => `<div><div class="sim-bar-box"><span style="height:${v}%"></span></div><small>${E(y)}</small><b>${v}%</b></div>`).join('')}</div></div>
      <textarea class="tdm-input sim-essay" dir="ltr" lang="de" data-essay="1" placeholder="Schreiben Sie hier 350–400 Wörter …">${E(val)}</textarea>
      <div class="sim-foot"><span class="muted small">Grafik beschreiben · Ursachen erklären · Position begründen</span><b id="simWords" class="${count >= 350 && count <= 400 ? 'ok' : 'warn'}">${count} Wörter</b></div></section>`;
  }
  function sprechenView(c) {
    const st = ensureState();
    return `<section class="card sim-note" dir="ltr"><b>Prüfungsmodus:</b> Lesen Sie die Aufgabe, nutzen Sie die Vorbereitungszeit und nehmen Sie anschließend Ihre Antwort auf. Es gibt kein Textfeld.</section>
      ${c.tasks.map((task, i) => { const rec = st.recordings[i]; const s = ui.recIndex === i ? ui.recStatus : 'idle';
        return `<section class="card sim-part"><div class="sim-exam-top"><div><p class="kicker">Aufgabe ${i + 1} · ${E(task.type)}</p><h2 dir="ltr">${E(task.q)}</h2></div><div class="muted small" dir="ltr">Vorbereitung ${task.prep}s<br>Sprechen ${task.time}s</div></div>
        <div class="sim-rec ${s === 'recording' ? 'is-rec' : ''}"><div class="sim-mic">🎙️</div><p id="simRec-${i}" class="sim-clock">${s === 'recording' ? '00:00' : rec ? 'Gespeichert' : 'Bereit'}</p>
          <p class="muted small" dir="ltr">${s === 'recording' ? 'Aufnahme läuft …' : s === 'uploading' ? 'Aufnahme wird gespeichert …' : s === 'denied' ? 'Mikrofonzugriff wurde abgelehnt.' : s === 'unsupported' ? 'Audioaufnahme wird nicht unterstützt.' : s === 'local-saved' ? 'Lokal gespeichert; Server war nicht erreichbar.' : 'Maximal 10 Minuten; für diese Aufgabe gilt die angegebene Sprechzeit.'}</p>
          <div class="row-actions">${s === 'recording' ? '<button type="button" class="btn btn-danger" data-sim="recstop">■ Aufnahme stoppen</button>' : s === 'uploading' ? '<button type="button" class="btn" disabled>Speichern …</button>' : `<button type="button" class="btn btn-primary" data-rec="${i}">${rec ? 'Neu aufnehmen' : '● Aufnahme starten'}</button>`}</div>
          ${rec ? `<audio controls src="${E(playback(rec))}"></audio>` : ''}</div></section>`; }).join('')}`;
  }
  function sectionView(id) {
    const d = data();
    return `<header class="sim-bar"><button type="button" class="btn" data-sim="pause">Übersicht</button><div class="sim-bar-mid"><h1>${SECTIONS[id].label}</h1><small><b id="simTimer" dir="ltr">${timeStr(remaining(id))}</b> · <b id="simAnswered">${answeredCount(id)}/${totalItems(id, d)}</b></small></div><button type="button" class="btn btn-primary" data-finish="${id}">Abgeben</button></header>
      <div class="sim-body">${id === 'lesen' ? lesenView(d.lesen) : id === 'hoeren' ? hoerenView(d.hoeren) : id === 'schreiben' ? schreibenView(d.schreiben) : sprechenView(d.sprechen)}</div>`;
  }
  function draw() {
    if (!premium()) { root.innerHTML = gateView(); return; }
    if (!ui.builtin) { root.innerHTML = `<section class="card empty-card"><span class="spinner"></span><p>${E(L('در حال بارگذاری آزمون…', 'Loading the exam…', 'Prüfung wird geladen …'))}</p></section>`; return; }
    if (ui.library) { root.innerHTML = libraryView(); return; }
    const exam = selectedExam(); const st = ensureState();
    root.innerHTML = !st.started ? introView(exam) : st.active && st.active !== 'overview' ? sectionView(st.active) : overviewView(exam);
    if (ctx.afterDraw) ctx.afterDraw();
  }
  function tick() {
    const st = ensureState();
    if (!ui.library && st.active && st.active !== 'overview') { const el = root.querySelector('#simTimer'); if (el) el.textContent = timeStr(remaining(st.active)); }
    if (ui.rec && ui.rec.state === 'recording') {
      const s = Math.floor((Date.now() - ui.recStart) / 1000); const el = root.querySelector(`#simRec-${ui.recIndex}`); if (el) el.textContent = timeStr(s);
      const task = data().sprechen.tasks[ui.recIndex]; if (task && s >= Math.min(600, task.time)) stopRec();
    }
  }
  ui.timer = setInterval(() => { if (!root.isConnected) { clearInterval(ui.timer); return; } tick(); }, 500);
  const counter = (id) => { const el = root.querySelector('#simAnswered'); if (el) el.textContent = `${answeredCount(id)}/${totalItems(id)}`; };

  /* ── actions ── */
  function openExam(id) {
    const exam = entries().find((x) => x.id === id); if (!exam) return;
    if (!exam.builtin && !examReady(exam)) { ui.message = L('این آزمون هنوز کامل نشده است. مدیر باید هر چهار بخش را اضافه کند.', 'This exam is still incomplete. An administrator must add all four sections.', 'Diese Prüfung ist noch unvollständig. Alle vier Bereiche müssen ergänzt werden.'); draw(); return; }
    S.selected = id; ensureState(); visit(id, false); ui.library = false; save(); draw();
  }
  async function finishSection(id) {
    const st = ensureState(); const answered = answeredCount(id); const total = totalItems(id);
    if (id === 'sprechen' && ui.rec && ui.rec.state === 'recording') { toast('Bitte stoppen Sie zuerst die laufende Aufnahme.', 'warn'); return; }
    if (id === 'schreiben') { const w = wordCount(st.answers.schreiben); if (w < 350 || w > 400) { toast(`Der Text muss 350–400 Wörter enthalten. Aktuell: ${w}.`, 'warn'); return; } }
    if (answered < total && !(await confirmDialog(`${total - answered} Aufgabe(n) sind noch unbeantwortet. Abschnitt trotzdem abgeben?`, { ok: 'Abgeben', danger: false }))) return;
    st.done[id] = true; st.active = 'overview'; delete st.sectionStarts[id];
    if (KEYS.every((k) => st.done[k])) { st.finished = true; st.finishedAt = st.finishedAt || new Date().toISOString(); visit(st.examId, true); } else visit(st.examId, false);
    stopAudio(); save(); draw();
  }
  root.addEventListener('click', async (event) => {
    const el = event.target.closest('button, input[type=radio]'); if (!el || el.disabled) return;
    const d = el.dataset; const st = ensureState();
    if (d.ss === 'td') { ss.runTd(ctx, st, data(), save, () => { if (root.isConnected) draw(); }); return; }
    if (d.ans) { const [section, key, oi] = d.ans.split('|'); st.answers[section][key] = Number(oi); save(); counter(section); return; }
    if (d.open) openExam(d.open);
    else if (d.section) { st.started = true; st.active = d.section; if (!st.sectionStarts[d.section]) st.sectionStarts[d.section] = Date.now(); visit(st.examId, false); save(); draw(); ctx.scrollTop?.(); }
    else if (d.finish) finishSection(d.finish);
    else if (d.play !== undefined) playText(data().hoeren.texts[Number(d.play)]?.text || '');
    else if (d.rec !== undefined) startRec(Number(d.rec));
    else if (d.sim === 'recstop') stopRec();
    else if (d.sim === 'stop') stopAudio();
    else if (d.sim === 'pause') { st.active = 'overview'; stopAudio(); save(); draw(); }
    else if (d.sim === 'start') { st.started = true; st.active = 'overview'; st.finished = false; visit(st.examId, false); save(); draw(); }
    else if (d.sim === 'library') { stopAudio(); ui.library = true; save(); draw(); }
    else if (d.sim === 'reload') { await loadRemote(); draw(); }
    else if (d.dl && isAdmin()) {
      const exam = entries().find((x) => x.id === d.dl); if (!exam) return;
      const payload = { meta: { id: exam.builtin ? '' : exam.id, title: exam.title, description: exam.description, format_version: 1 }, data: exam.data };
      const slug = String(exam.title || 'testdaf-exam').toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '');
      saveTextFile(`${slug || 'testdaf'}-simulation-data.js`, `const AMOOKHT_TESTDAF_EXAM=${JSON.stringify(payload, null, 2)};\n`, 'text/javascript;charset=utf-8');
    } else if (d.rm && isAdmin() && d.rm !== BUILTIN_ID) {
      if (!(await confirmDialog('Diese öffentliche Prüfung für alle Benutzer löschen?'))) return;
      const r = await ctx.bridge.api(`/v1/testdaf-exams/${encodeURIComponent(d.rm)}`, { method: 'DELETE' });
      if (r.ok) { if (S.selected === d.rm) { S.selected = BUILTIN_ID; ensureState(); } await loadRemote(); ui.message = 'Prüfung gelöscht.'; save(); } else ui.message = 'Löschen fehlgeschlagen: ' + (r.error?.message || '');
      draw();
    } else if (d.part && isAdmin()) {
      const [examId, sec, ii, qi] = d.part.split('|');
      if (!(await confirmDialog(`${qi === '' ? 'این بخش' : 'این سؤال'} برای همه کاربران حذف شود؟`))) return;
      const r = await ctx.bridge.api(`/v1/testdaf-exams/${encodeURIComponent(examId)}/sections/${sec}/items/${ii}${qi === '' ? '' : `/questions/${qi}`}`, { method: 'DELETE' });
      if (r.ok) { await loadRemote(); ui.message = 'حذف انجام شد.'; } else ui.message = 'حذف انجام نشد: ' + (r.error?.message || '');
      draw();
    } else if (d.sim === 'imp-cancel') { ui.imp = null; ui.message = ''; draw(); }
    else if (d.sim === 'imp-save' && ui.imp) {
      const imp = ui.imp; imp.title = String(imp.title || '').trim();
      if (imp.title.length < 3) { ui.message = 'Bitte einen Namen mit mindestens 3 Zeichen eingeben.'; draw(); return; }
      try { validateExamData(imp.data); } catch (e) { ui.message = 'Speichern fehlgeschlagen: ' + e.message; draw(); return; }
      const r = await ctx.bridge.api('/v1/testdaf-exams', { method: 'POST', body: { id: imp.id || null, title: imp.title, description: imp.description || '', source_filename: imp.source_filename || '', data: imp.data } });
      if (r.ok) { ui.imp = null; await loadRemote(); ui.message = `„${r.data.exam.title}“ wurde für alle Benutzer veröffentlicht.`; } else ui.message = 'Speichern fehlgeschlagen: ' + (r.error?.message || '');
      draw();
    } else if (d.sim === 'man-save') {
      const m = ui.manual; const title = m.title.trim();
      if (title.length < 3) { ui.message = 'نام آزمون باید حداقل سه حرف داشته باشد.'; draw(); return; }
      const data = {};
      try {
        for (const sec of KEYS) if (m[sec].trim()) { const v = JSON.parse(m[sec].trim()); const items = Array.isArray(v) ? v : [v]; data[sec] = sec === 'lesen' || sec === 'hoeren' ? { texts: items } : sec === 'sprechen' ? { tasks: items } : v; }
        if (!Object.keys(data).length) throw new Error('حداقل یک بخش را تکمیل کنید.');
      } catch (e) { ui.message = 'خطا در ذخیره: ' + e.message; draw(); return; }
      const r = await ctx.bridge.api('/v1/testdaf-exams', { method: 'POST', body: { title, description: m.description, source_filename: 'manual-builder', data } });
      if (r.ok) { ui.manual = { title: '', description: '', lesen: '', hoeren: '', schreiben: '', sprechen: '' }; await loadRemote(); ui.message = `${r.data.exam.title} ذخیره شد.`; } else ui.message = 'خطا در ذخیره: ' + (r.error?.message || '');
      draw();
    } else if (d.copySchema) { try { await navigator.clipboard.writeText(SCHEMAS[d.copySchema]); el.textContent = L('✓ کپی شد', '✓ Copied', '✓ Kopiert'); } catch { /* ignore */ } }
    else if (d.sim === 'reset') { if (ui.rec && ui.rec.state === 'recording') ui.rec.stop(); if (!(await confirmDialog(L('همه پاسخ‌های این آزمون پاک شود و از نو شروع کنید؟', 'Clear all answers of this exam and start again?', 'Alle Antworten dieser Prüfung löschen und neu starten?')))) return; const id = S.selected || BUILTIN_ID; S.states[id] = newSimState(id); S.legacy = S.states[id]; ui.recStatus = 'idle'; save(); draw(); }
  });
  root.addEventListener('change', async (event) => {
    const t = event.target; if (!t.dataset.import || !isAdmin()) return;
    const file = t.files && t.files[0]; t.value = ''; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Die Datei darf höchstens 5 MB groß sein.');
      const parsed = parseExamFile(await file.text()); const fallback = file.name.replace(/\.(?:json|js)$/i, '').replace(/[-_]+/g, ' ');
      ui.imp = { id: parsed.meta.id || '', title: parsed.meta.title || fallback || 'Neue TestDaF-Prüfung', description: parsed.meta.description || '', source_filename: file.name, data: parsed.data, stats: parsed.stats };
      ui.message = 'Datei geprüft: 40 Lesen · 35 Hören · 1 Schreiben · 7 Sprechen.';
    } catch (e) { ui.imp = null; ui.message = 'Importfehler: ' + e.message; }
    draw();
  });
  root.addEventListener('input', (event) => {
    const t = event.target; const st = ensureState();
    if (t.dataset.imp && ui.imp) { ui.imp[t.dataset.imp] = t.value; return; }
    if (t.dataset.man) { ui.manual[t.dataset.man] = t.value; return; }
    if (t.dataset.text) { const [section, key] = t.dataset.text.split('|'); st.answers[section][key] = t.value; saveSoon(); counter(section); }
    else if (t.dataset.essay) { st.answers.schreiben = t.value; const n = wordCount(t.value); const el = root.querySelector('#simWords'); if (el) { el.textContent = `${n} Wörter`; el.className = n >= 350 && n <= 400 ? 'ok' : 'warn'; } saveSoon(); }
  });
  root.onLeave = () => { stopAudio(); if (ui.rec && ui.rec.state === 'recording') ui.rec.stop(); if (ui.saveT) save(); clearInterval(ui.timer); };

  draw();
  (async () => {
    try { ui.builtin = await ctx.loadPack('simulation'); } catch (error) { ui.message = String(error.message || error); }
    await loadRemote();
    draw();
  })();
  return root;
}
