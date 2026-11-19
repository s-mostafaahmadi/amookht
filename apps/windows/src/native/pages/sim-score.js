// SIM-SCORE (port of the site's amk-sim-score.js, 2026-11-20): AI estimate for Schreiben and Sprechen in both
// exam simulations (backend POST /v1/method/sim-assess, one text or one recording per call), plus the
// multi-voice audio files for the TestDaF Hören texts (/sim-audio/<sha1(text)[:20]>.mp3, falls back to the coach voice).
// No inline handlers (app CSP): buttons carry data-ss="td" / data-ss="osd"; the pages call run…() from their delegation.
import { lang } from '../core/i18n.js';

const T = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const faN = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
const words = (t) => (String(t || '').trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
const hashOf = (t) => { let h = 0; const s = String(t || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h) + ':' + s.length; };
const run = { busy: false, done: 0, total: 0, err: '' };

async function sha1(t) { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }

/** Plays the pre-made multi-voice file of a Hören text; resolves false when there is none (caller falls back). */
export async function playSimAudio(ctx, text, setAudio) {
  try {
    const r = await ctx.bridge.api('/sim-audio/' + (await sha1(String(text))).slice(0, 20) + '.mp3', { binary: true });
    if (!r || !r.ok || !r.data || !r.data.base64) return false;
    const bin = atob(r.data.base64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    const a = new Audio(url); if (setAudio) setAudio(a);
    await new Promise((res) => { a.onended = res; a.onerror = res; a.play().catch(res); });
    URL.revokeObjectURL(url);
    return true;
  } catch (e) { return false; }
}

async function assess(ctx, body) {
  const r = await ctx.bridge.api('/v1/method/sim-assess', { method: 'POST', body, timeout: 150000 });
  if (!r || !r.ok) { const e = new Error((r && r.error && (r.error.message || r.error.code)) || 'failed'); e.status = r && r.error && r.error.status; throw e; }
  return r.data;
}
function errText(e) {
  const m = String((e && e.message) || ''); const st = e && e.status;
  if (st === 403 || /premium/i.test(m)) return T('این امکان مخصوص Premium است.', 'Premium only.', 'Nur für Premium.');
  if (st === 429 || /limit/i.test(m)) return T('سقف ارزیابی امروز پر شده است.', 'Daily limit reached.', 'Tageslimit erreicht.');
  if (st === 503 || /unavailable|ai_/i.test(m)) return T('سرویس هوش مصنوعی فعلاً در دسترس نیست؛ چند دقیقه دیگر دوباره امتحان کنید.', 'The AI service is busy; try again in a few minutes.', 'Der KI-Dienst ist ausgelastet; bitte später erneut versuchen.');
  return m || T('خطا در ارزیابی', 'Assessment failed', 'Bewertung fehlgeschlagen');
}
async function pool(jobs, n, redraw) { let i = 0; const next = async () => { while (i < jobs.length) { const j = jobs[i++]; await j(); run.done++; redraw(); } }; await Promise.all(Array.from({ length: Math.min(n, jobs.length) }, next)); }

/* ───────── TestDaF ───────── */
const TV = { 'unter TDN 3': 2, 'TDN 3': 3, 'TDN 4': 4, 'TDN 5': 5 };
const TN = (v) => (v >= 5 ? 'TDN 5' : v >= 4 ? 'TDN 4' : v >= 3 ? 'TDN 3' : 'unter TDN 3');
const ratioTdn = (c, t) => { if (!t) return null; const r = c / t; return r >= 0.8 ? 5 : r >= 0.6 ? 4 : r >= 0.4 ? 3 : 2; };
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const pill = (v, est) => (v == null ? '<span class="ss-pill">—</span>' : `<span class="ss-pill t${v}">${TN(v)}${est ? ' <small>~</small>' : ''}</span>`);
const tdTask = (d) => { const w = d.schreiben || {}; const chart = Array.isArray(w.chart) && w.chart.length ? '\nGrafik «' + (w.chartTitle || '') + '»: ' + w.chart.map(([y, v]) => y + ': ' + v + ' %').join(', ') : ''; return (w.title || 'Schreiben') + '\n' + (w.task || '') + chart; };
const tdTarget = (task) => { const m = String(task.level || task.type || '').match(/TDN\s*\d/i); return m ? m[0].toUpperCase().replace(/\s*/, ' ') : ''; };

function tdJobs(ctx, st, d) {
  st.ai = st.ai || { w: null, s: {} }; st.ai.s = st.ai.s || {};
  const jobs = []; const text = String(st.answers.schreiben || '');
  if (st.done.schreiben && words(text) >= 20 && (!st.ai.w || st.ai.w.h !== hashOf(text))) {
    jobs.push(async () => { try { const r = await assess(ctx, { exam: 'testdaf', part: 'writing', task: tdTask(d), kind: 'TestDaF Schreiben', text }); st.ai.w = { h: hashOf(text), r }; } catch (e) { run.err = errText(e); } });
  }
  if (st.done.sprechen) (d.sprechen.tasks || []).forEach((task, i) => {
    const rec = st.recordings && st.recordings[i]; const rid = rec && !rec.local && rec.id;
    if (!rid || (st.ai.s[i] && st.ai.s[i].rid === rid)) return;
    jobs.push(async () => { try { const r = await assess(ctx, { exam: 'testdaf', part: 'speaking', task: task.q, kind: task.type || '', recording_id: rid, target: tdTarget(task) }); st.ai.s[i] = { rid, r }; } catch (e) { run.err = errText(e); } });
  });
  return jobs;
}
export async function runTd(ctx, st, d, save, redraw) {
  if (run.busy) return; const jobs = tdJobs(ctx, st, d); if (!jobs.length) return;
  Object.assign(run, { busy: true, done: 0, total: jobs.length, err: '' }); redraw();
  await pool(jobs, 2, redraw); run.busy = false; save(); redraw();
}
/** Panel for the TestDaF overview. autoStats(id) → {correct,total}. */
export function tdPanel(ctx, st, d, autoStats) {
  const done = st.done || {};
  if (!['lesen', 'hoeren', 'schreiben', 'sprechen'].some((k) => done[k])) return '';
  st.ai = st.ai || { w: null, s: {} }; st.ai.s = st.ai.s || {};
  const le = done.lesen ? autoStats('lesen') : null; const ho = done.hoeren ? autoStats('hoeren') : null;
  const lv = le ? ratioTdn(le.correct, le.total) : null; const hv = ho ? ratioTdn(ho.correct, ho.total) : null;
  const w = st.ai.w && st.ai.w.r; const wv = w ? TV[w.tdn] || 2 : null;
  const sp = Object.keys(st.ai.s).map((i) => st.ai.s[i] && st.ai.s[i].r).filter(Boolean); const sv = sp.length ? median(sp.map((r) => TV[r.tdn] || 2)) : null;
  const nTasks = (d.sprechen.tasks || []).length; const nRec = Object.values(st.recordings || {}).filter((r) => r && !r.local && r.id).length;
  const pending = tdJobs(ctx, st, d).length; const all = [lv, hv, wv, sv];
  let verdict = '';
  if (all.every((v) => v != null)) {
    const min = Math.min(...all); const sum = all.reduce((a, b) => a + b, 0); const ok = min >= 4;
    verdict = `<div class="ss-verdict ${ok ? 'ok' : 'bad'}"><b>${esc(ok ? T('اگر فردا آزمون بدهید: به احتمال زیاد TDN 4 در هر چهار بخش (پذیرش در بیشتر دانشگاه‌ها)', 'If you took the exam tomorrow: likely TDN 4 in all four parts', 'Prognose: wahrscheinlich TDN 4 in allen vier Teilen') : T('اگر فردا آزمون بدهید: هنوز در همه بخش‌ها به TDN 4 نمی‌رسید', 'If you took the exam tomorrow: not yet TDN 4 in every part', 'Prognose: noch nicht TDN 4 in allen Teilen'))}</b><span>${esc(T('مجموع تخمینی', 'Estimated total', 'Geschätzte Summe'))}: TDN ${faN(sum)} ${esc(T('از', 'of', 'von'))} ${faN(20)} · ${esc(T('ضعیف‌ترین بخش', 'weakest part', 'schwächster Teil'))}: ${TN(min)}</span></div>`;
  }
  const open = T('هنوز انجام نشده', 'not done yet', 'noch offen'); const wait = T('در انتظار ارزیابی هوشمند', 'waiting for AI rating', 'KI-Bewertung offen');
  const rows = [['Lesen', lv, le ? `${faN(le.correct)}/${faN(le.total)} ${T('درست', 'correct', 'richtig')}` : open, true], ['Hören', hv, ho ? `${faN(ho.correct)}/${faN(ho.total)} ${T('درست', 'correct', 'richtig')}` : open, true], ['Schreiben', wv, w ? `${faN(w.words)} ${T('واژه', 'words', 'Wörter')}` : done.schreiben ? wait : open, false], ['Sprechen', sv, sp.length ? `${faN(sp.length)}/${faN(nTasks)} ${T('بخش ارزیابی شد', 'tasks rated', 'Aufgaben bewertet')}` : done.sprechen ? (nRec ? wait : T('ضبطی روی سرور نیست', 'no saved recordings', 'keine gespeicherten Aufnahmen')) : open, false]];
  const detail = (w ? `<details class="ss-det"><summary>Schreiben · ${esc(w.tdn)}</summary><p>${esc(w.summary_fa)}</p><ul class="ss-crit"><li>${esc(T('برداشت کلی', 'Overall impression', 'Gesamteindruck'))}: <b>${esc(w.criteria.gesamteindruck)}</b></li><li>${esc(T('انجام تکلیف', 'Task', 'Aufgabe'))}: <b>${esc(w.criteria.aufgabe)}</b></li><li>${esc(T('زبان', 'Language', 'Sprache'))}: <b>${esc(w.criteria.sprache)}</b></li></ul>${(w.improve_fa || []).length ? `<ul>${w.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : '')
    + (sp.length ? `<details class="ss-det"><summary>Sprechen · ${esc(T('هر بخش', 'per task', 'je Aufgabe'))}</summary><ol class="ss-tasks">${(d.sprechen.tasks || []).map((t, i) => { const r = st.ai.s[i] && st.ai.s[i].r; return `<li><b>${esc(t.type || 'Aufgabe ' + (i + 1))}</b> ${r ? pill(TV[r.tdn] || 2) : '<span class="ss-pill">—</span>'}${r ? `<p>${esc(r.summary_fa)}</p>${(r.improve_fa || []).length ? `<ul>${r.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}` : ''}</li>`; }).join('')}</ol></details>` : '');
  return `<section class="ss-panel"><header><div><span class="ss-kicker">${esc(T('ارزیابی هوشمند', 'AI estimate', 'KI-Einschätzung'))}</span><h2>${esc(T('اگر فردا آزمون بدهم، چه نتیجه‌ای می‌گیرم؟', 'What would I get if I took the exam tomorrow?', 'Was würde ich morgen erreichen?'))}</h2></div>${pending ? `<button type="button" class="ss-btn" data-ss="td" ${run.busy ? 'disabled' : ''}>${run.busy ? `${esc(T('در حال ارزیابی', 'Rating', 'Bewertung läuft'))} ${faN(run.done)}/${faN(run.total)}…` : '✨ ' + esc(T('ارزیابی نوشتن و صحبت', 'Rate writing & speaking', 'Schreiben & Sprechen bewerten'))}</button>` : ''}</header>
    ${run.err ? `<p class="ss-err">${esc(run.err)}</p>` : ''}${verdict}<div class="ss-grid">${rows.map(([n, v, sub, est]) => `<div class="ss-cell"><b>${n}</b>${pill(v, est && v != null)}<small>${esc(sub)}</small></div>`).join('')}</div>
    <p class="ss-note">${esc(T('Lesen و Hören از روی پاسخ‌ها و Schreiben و Sprechen با هوش مصنوعی و معیارهای رسمی TestDaF تخمین زده می‌شوند. صحبت از روی متن پیاده‌شده‌ی صدا ارزیابی می‌شود و تلفظ فقط تقریبی است. نتیجه یک پیش‌بینی است، نه نمره رسمی.', 'Reading/listening come from your answers; writing/speaking are rated by AI with the official TestDaF criteria (speaking from a transcript; pronunciation only roughly). This is a forecast, not an official score.', 'Lesen/Hören aus den Antworten, Schreiben/Sprechen per KI nach den offiziellen TestDaF-Kriterien (Sprechen über ein Transkript). Eine Prognose, kein offizielles Ergebnis.'))}</p>${detail}</section>`;
}

/* ───────── ÖSD (vendor amk-osd-sim.js; the AI fills its official self-assessment fields) ───────── */
function osdWritingTask(d, e, n) {
  const W = d.schreiben;
  if (n === 1) { const t = W.a1; return `Situation: ${t.situation}\n${t.task}\nInserat: ${t.ad.title}; ${t.ad.lines.join('; ')}\nNotizen: ${t.notes.join('; ')}\nAn: ${t.to} · Betreff: ${t.subject}`; }
  const t = W.a2; const v = e.ans.schreiben.v === 'B' ? 'B' : 'A'; const V = t.variants[v];
  return `${t.intro}\nVariante ${v}: ${V.lead}\n${V.quotes.map((q) => '„' + q + '“').join('\n')}\nLeitpunkte: ${V.points.join('; ')}`;
}
function osdSpeakTask(d, e, i) {
  const P = d.sprechen; const a = e.ans.sprechen;
  if (i === 0) { const t = P.a1; return `Aufgabe 1 · ${t.title}\nSituation: ${t.situation}\n${t.points.join('\n')}\nFragen der Gesprächspartnerin: ${(t.partner || []).join(' / ')}`; }
  if (i === 1) { const t = P.a2; const pic = a.pic != null ? t.images[a.pic] : null; return `Aufgabe 2 · ${t.title}\n${t.situation}\n${pic ? 'Gewähltes Bild: ' + pic.alt : 'Bilder: ' + t.images.map((x) => x.alt).join(' | ')}`; }
  const t = P.a3; const r = a.role === 1 ? 1 : 0; return `Aufgabe 3 · ${t.title}: ${t.topic}\n${t.situation}\nRolle der Lernenden: ${t.roles[r].name}: ${t.roles[r].text}\nGegenposition: ${t.roles[1 - r].name}: ${t.roles[1 - r].text}`;
}
function osdJobs(ctx, Sim, d, e) {
  const jobs = []; e.ai = e.ai || { sp: {} }; e.ai.sp = e.ai.sp || {};
  if (e.done.schreiben) [1, 2].forEach((n) => {
    const text = e.ans.schreiben['a' + n] || ''; const k = 's' + n;
    if (words(text) < 20 || (e.ai[k] && e.ai[k].h === hashOf(text + e.ans.schreiben.v))) return;
    jobs.push(async () => { try { const r = await assess(ctx, { exam: 'oesd', part: 'writing', task: osdWritingTask(d, e, n), kind: n === 1 ? 'Formelles E-Mail (ca. 120 Wörter)' : 'Meinungsäußerung (ca. 120 Wörter)', text }); e.ai[k] = { h: hashOf(text + e.ans.schreiben.v), r }; e.self[k] = { ...r.criteria }; Sim.save(true); } catch (x) { run.err = errText(x); } });
  });
  const rid = e.ans.sprechen.rid || {};
  if (e.done.sprechen) [0, 1, 2].forEach((i) => {
    if (!rid[i] || (e.ai.sp[i] && e.ai.sp[i].rid === rid[i])) return;
    jobs.push(async () => { try { const r = await assess(ctx, { exam: 'oesd', part: 'speaking', task: osdSpeakTask(d, e, i), kind: ['Kennenlernen und beraten', 'Bild beschreiben und interpretieren', 'Meinungsaustausch'][i], recording_id: rid[i] }); e.ai.sp[i] = { rid: rid[i], r }; e.self.sp[i] = r.points; Sim.save(true); } catch (x) { run.err = errText(x); } });
  });
  return jobs;
}
export async function runOsd(ctx, Sim, redraw) {
  if (run.busy || !Sim) return; const d = Sim.data(); const e = Sim.ex(); if (!d || !e) return;
  const jobs = osdJobs(ctx, Sim, d, e); if (!jobs.length) return;
  Object.assign(run, { busy: true, done: 0, total: jobs.length, err: '' }); redraw();
  await pool(jobs, 2, redraw); run.busy = false; Sim.save(true); redraw();
}
export function osdPanel(ctx, Sim) {
  const d = Sim.data(); const e = Sim.ex(); if (!d || !e) return '';
  if (!['lesen', 'hoeren', 'schreiben', 'sprechen'].some((k) => e.done[k])) return '';
  e.ai = e.ai || { sp: {} }; e.ai.sp = e.ai.sp || {};
  const r = Sim.results(d, e); const pending = osdJobs(ctx, Sim, d, e).length; const rid = e.ans.sprechen.rid || {};
  const missingRec = e.done.sprechen ? [0, 1, 2].filter((i) => !rid[i]).length : 0;
  let verdict = '';
  if (['lesen', 'hoeren', 'schreiben', 'sprechen'].every((k) => r[k] != null)) {
    const tot = r.lesen + r.hoeren + r.schreiben + r.sprechen; const mins = r.lesen >= 10 && r.hoeren >= 10 && r.schreiben >= 15 && r.sprechen >= 18; const ok = mins && tot >= 60;
    const pr = !ok ? T('قبول نمی‌شوید', 'not passed', 'nicht bestanden') : tot >= 88 ? T('عالی (sehr gut)', 'very good', 'sehr gut') : tot >= 75 ? T('خوب (gut)', 'good', 'gut') : T('قبول (bestanden)', 'passed', 'bestanden');
    verdict = `<div class="ss-verdict ${ok ? 'ok' : 'bad'}"><b>${esc(T('اگر فردا آزمون بدهید', 'If you took the exam tomorrow', 'Prognose für morgen'))}: ${faN(tot)}/${faN(100)} · ${esc(pr)}</b><span>${esc(mins ? T('حد نصاب همه بخش‌ها رعایت شده است.', 'Every part reaches its minimum.', 'Alle Mindestpunkte erreicht.') : T('حد نصاب: خواندن ۱۰، شنیدن ۱۰، نوشتن ۱۵، صحبت ۱۸ — دست‌کم یک بخش زیر حد است.', 'Minimums: reading 10, listening 10, writing 15, speaking 18 — at least one part is below.', 'Mindestpunkte: Lesen 10, Hören 10, Schreiben 15, Sprechen 18 – mindestens ein Teil liegt darunter.'))}</span></div>`;
  }
  const open = T('هنوز انجام نشده', 'not done yet', 'noch offen');
  const cell = (n, v, max, pass, sub) => `<div class="ss-cell"><b>${n}</b><span class="ss-pill ${v == null ? '' : pass && v < pass ? 'bad' : 'good'}">${v == null ? '—' : faN(v) + '/' + faN(max)}</span><small>${esc(sub)}</small></div>`;
  const wDet = [1, 2].map((n) => { const a = e.ai['s' + n] && e.ai['s' + n].r; return a ? `<details class="ss-det"><summary>Schreiben · Aufgabe ${n} · ${faN(a.points)}/${faN(15)}</summary><p>${esc(a.summary_fa)}</p><ul class="ss-crit"><li>K ${faN(a.criteria.K)}/${faN(2)}</li><li>T ${faN(a.criteria.T)}/${faN(5)}</li><li>L ${faN(a.criteria.L)}/${faN(3)}</li><li>F ${faN(a.criteria.F)}/${faN(5)}</li><li>A ${a.criteria.A === 'nb' ? 'n. b.' : faN(a.criteria.A)}</li></ul>${(a.improve_fa || []).length ? `<ul>${a.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : ''; }).join('');
  const sDet = [0, 1, 2].map((i) => { const a = e.ai.sp[i] && e.ai.sp[i].r; return a ? `<details class="ss-det"><summary>Sprechen · Aufgabe ${i + 1} · ${faN(a.points)}/${faN(10)}</summary><p>${esc(a.summary_fa)}</p>${(a.improve_fa || []).length ? `<ul>${a.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : ''; }).join('');
  return `<section class="ss-panel"><header><div><span class="ss-kicker">${esc(T('ارزیابی هوشمند', 'AI estimate', 'KI-Einschätzung'))}</span><h2>${esc(T('اگر فردا آزمون بدهم، قبول می‌شوم؟', 'Would I pass if I took the exam tomorrow?', 'Würde ich morgen bestehen?'))}</h2></div>${pending ? `<button type="button" class="ss-btn" data-ss="osd" ${run.busy ? 'disabled' : ''}>${run.busy ? `${esc(T('در حال ارزیابی', 'Rating', 'Bewertung läuft'))} ${faN(run.done)}/${faN(run.total)}…` : '✨ ' + esc(T('ارزیابی نوشتن و صحبت', 'Rate writing & speaking', 'Schreiben & Sprechen bewerten'))}</button>` : ''}</header>
    ${run.err ? `<p class="ss-err">${esc(run.err)}</p>` : ''}${verdict}<div class="ss-grid">${cell('Lesen', r.lesen, 20, 10, e.done.lesen ? T('جدول رسمی', 'official table', 'offizielle Tabelle') : open)}${cell('Hören', r.hoeren, 20, 10, e.done.hoeren ? T('جدول رسمی', 'official table', 'offizielle Tabelle') : open)}${cell('Schreiben', r.schreiben, 30, 15, e.ai.s1 || e.ai.s2 ? T('ارزیابی هوشمند', 'AI rating', 'KI-Bewertung') : e.done.schreiben ? T('در انتظار ارزیابی', 'waiting for rating', 'Bewertung offen') : open)}${cell('Sprechen', r.sprechen, 30, 18, Object.keys(e.ai.sp).length ? T('ارزیابی هوشمند', 'AI rating', 'KI-Bewertung') : missingRec ? T('ضبط جدید لازم است', 'record again', 'neu aufnehmen') : e.done.sprechen ? T('در انتظار ارزیابی', 'waiting for rating', 'Bewertung offen') : open)}</div>
    ${missingRec && e.done.sprechen ? `<p class="ss-err">${esc(T(`${faN(missingRec)} ضبط روی سرور ذخیره نشده است (ضبط‌های قبل از این نسخه فقط روی دستگاه بودند). برای ارزیابی، در بخش Sprechen دوباره ضبط کنید.`, `${missingRec} recording(s) are not saved on the server. Record them again in Sprechen to have them rated.`, `${missingRec} Aufnahme(n) sind nicht auf dem Server. Bitte im Teil Sprechen neu aufnehmen.`))}</p>` : ''}
    <p class="ss-note">${esc(T('هوش مصنوعی همان فرم ارزیابی رسمی ÖSD را پر می‌کند (نوشتن: K/T/L/F و کسر تکلیف؛ صحبت: ۰ تا ۱۰ برای هر بخش). نتیجه را در صفحه هر بخش می‌بینید و می‌توانید تغییرش دهید. این یک پیش‌بینی است، نه نمره رسمی.', 'The AI fills the official ÖSD rating form (writing K/T/L/F and task deduction; speaking 0–10 per task). You can see and change it in each part. A forecast, not an official score.', 'Die KI füllt den offiziellen ÖSD-Bewertungsbogen aus; Sie können die Werte im jeweiligen Teil ändern. Eine Prognose, kein offizielles Ergebnis.'))}</p>${wDet}${sDet}</section>`;
}
/** ÖSD recordings go to the server too, so they can be rated (called by amk-osd-sim.js via window.AmkSimScore.upload). */
export function osdUploader(ctx, Sim, redraw) {
  return async function upload(blob, examId, i) {
    if (!blob || !blob.size || !Sim) return;
    try {
      const mime = (blob.type || 'audio/webm').split(';')[0];
      const r = await ctx.bridge.speakingUpload({ bytes: new Uint8Array(await blob.arrayBuffer()), mime, filename: 'osd-' + (i + 1) + '.' + (mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'), planId: 'osd-simulation-' + examId, taskId: 'osd-' + (i + 1) });
      if (!r || !r.ok || !r.data || !r.data.id) return;
      const e = Sim.ex(examId); e.ans.sprechen.rid = e.ans.sprechen.rid || {}; e.ans.sprechen.rid[i] = r.data.id; Sim.save(true); redraw();
    } catch (err) { console.warn('ÖSD recording upload failed', err); }
  };
}
