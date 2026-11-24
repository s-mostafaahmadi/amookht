/* SIM-SCORE (2026-11-19, owner)
   1) AI estimate for Schreiben and Sprechen in both exam simulations (backend POST /v1/method/sim-assess):
      - TestDaF: TDN per part (Lesen/Hören from the answers, Schreiben/Sprechen from the AI) and the verdict "TDN 4 in all four parts?"
      - ÖSD Zertifikat B2: the AI fills the official self-assessment fields (Schreiben K/T/L/F/A, Sprechen 0–10),
        so the existing ÖSD point tables and verdicts work; plus an overall forecast out of 100.
   2) TestDaF Hören plays natural-voice mp3 files (/sim-audio/<sha1(text)[:20]>.mp3, made by sim_audio.py),
      falling back to the browser voice when a file is missing.
   Loaded (defer) after amk-osd-sim.js; wraps window.renderTestDaFSimulation once more. */
(function () {
  'use strict';
  if (window.AmkSimScore) return;
  const T = (fa, en, de) => { const l = (typeof S !== 'undefined' && S.uiLanguage) || 'fa'; return l === 'fa' ? fa : l === 'en' ? en : de; };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const faN = (n) => (((typeof S !== 'undefined' && S.uiLanguage) || 'fa') === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
  const words = (t) => (String(t || '').trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) || []).length;
  const hashOf = (t) => { let h = 0; const s = String(t || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h) + ':' + s.length; };
  const OSD = () => window.AmkOsdSim || null;
  const isOsd = () => { try { return OSD() && OSD().currentExam() === 'oesd'; } catch (e) { return false; } };
  const run = { busy: false, done: 0, total: 0, err: '' };
  const rerender = () => { if (typeof render === 'function') render(); };

  /* ---------- 2) natural voices for TestDaF Hören ---------- */
  let simAudio = null;
  const origPlay = window.playSimHoeren, origStop = window.stopSimHoeren;
  async function sha1(t) { const b = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  function stopAll() { if (simAudio) { try { simAudio.pause(); } catch (e) { /* ignore */ } simAudio = null; } try { if (origStop) origStop(); } catch (e) { /* ignore */ } }
  window.playSimHoeren = async function (text) {
    stopAll();
    let fellBack = false; const back = () => { if (fellBack) return; fellBack = true; simAudio = null; if (origPlay) origPlay(text); };
    try {
      const a = new Audio('/sim-audio/' + (await sha1(String(text))).slice(0, 20) + '.mp3');
      simAudio = a; a.onerror = () => { if (simAudio === a) back(); };
      await a.play();
    } catch (e) { back(); }
  };
  window.stopSimHoeren = stopAll;
  window.playSimHoerenAt = function (i) { try { const t = testdafSimData().hoeren.texts[i]; if (t) window.playSimHoeren(t.text); } catch (e) { /* ignore */ } };

  /* ---------- backend ---------- */
  async function assess(payload) { return apiRequest('/method/sim-assess', { method: 'POST', body: JSON.stringify(payload) }); }
  function errText(e) { const d = e && (e.detail || (e.data && e.data.detail)); const m = (d && (d.message || d)) || (e && e.message) || ''; return /premium/i.test(m) ? T('این امکان مخصوص Premium است.', 'Premium only.', 'Nur für Premium.') : /limit/i.test(m) ? T('سقف ارزیابی امروز پر شده است.', 'Daily limit reached.', 'Tageslimit erreicht.') : /unavailable|503|ai_/i.test(m) ? T('سرویس هوش مصنوعی فعلاً در دسترس نیست؛ چند دقیقه دیگر دوباره امتحان کنید.', 'The AI service is busy; try again in a few minutes.', 'Der KI-Dienst ist ausgelastet; bitte später erneut versuchen.') : String(m || T('خطا در ارزیابی', 'Assessment failed', 'Bewertung fehlgeschlagen')); }
  async function pool(jobs, n) { let i = 0; const next = async () => { while (i < jobs.length) { const j = jobs[i++]; await j(); run.done++; rerender(); } }; await Promise.all(Array.from({ length: Math.min(n, jobs.length) }, next)); }

  /* ---------- TDN helpers ---------- */
  const TV = { 'unter TDN 3': 2, 'TDN 3': 3, 'TDN 4': 4, 'TDN 5': 5 };
  const TN = (v) => (v >= 5 ? 'TDN 5' : v >= 4 ? 'TDN 4' : v >= 3 ? 'TDN 3' : 'unter TDN 3');
  const ratioTdn = (c, t) => { if (!t) return null; const r = c / t; return r >= 0.8 ? 5 : r >= 0.6 ? 4 : r >= 0.4 ? 3 : 2; };
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
  const tdnPill = (v, est) => v == null ? '<span class="ss-pill">—</span>' : `<span class="ss-pill t${v}">${TN(v)}${est ? ' <small>~</small>' : ''}</span>`;

  /* ---------- TestDaF ---------- */
  function tdState() { const sim = ensureTestdafSimState(); sim.ai = sim.ai || { w: null, s: {} }; sim.ai.s = sim.ai.s || {}; return sim; }
  function tdWritingTask(d) { const w = d.schreiben || {}; const chart = Array.isArray(w.chart) && w.chart.length ? '\nGrafik «' + (w.chartTitle || '') + '»: ' + w.chart.map(([y, v]) => y + ': ' + v + ' %').join(', ') : ''; return (w.title || 'Schreiben') + '\n' + (w.task || '') + chart; }
  function tdTarget(task) { const m = String(task.level || task.type || '').match(/TDN\s*\d/i); return m ? m[0].toUpperCase().replace(/\s*/, ' ') : ''; }
  function tdJobs(sim, d) {
    const jobs = [];
    const text = String(sim.answers.schreiben || '');
    if (sim.done.schreiben && words(text) >= 20 && (!sim.ai.w || sim.ai.w.h !== hashOf(text))) {
      jobs.push(async () => { try { const r = await assess({ exam: 'testdaf', part: 'writing', task: tdWritingTask(d), kind: 'TestDaF Schreiben', text }); sim.ai.w = { h: hashOf(text), r }; } catch (e) { run.err = errText(e); } });
    }
    if (sim.done.sprechen) (d.sprechen.tasks || []).forEach((task, i) => {
      const rec = sim.recordings && sim.recordings[i], rid = rec && !rec.local && rec.id;
      if (!rid || (sim.ai.s[i] && sim.ai.s[i].rid === rid)) return;
      jobs.push(async () => { try { const r = await assess({ exam: 'testdaf', part: 'speaking', task: task.q, kind: task.type || '', recording_id: rid, target: tdTarget(task) }); sim.ai.s[i] = { rid, r }; } catch (e) { run.err = errText(e); } });
    });
    return jobs;
  }
  window.amkSimAssessTd = async function () {
    if (run.busy) return; const sim = tdState(), d = testdafSimData(), jobs = tdJobs(sim, d);
    if (!jobs.length) return;
    Object.assign(run, { busy: true, done: 0, total: jobs.length, err: '' }); rerender();
    await pool(jobs, 2);
    run.busy = false; if (typeof saveData === 'function') saveData(); rerender();
  };
  function tdPanel() {
    const sim = tdState(), d = testdafSimData(), done = sim.done || {};
    if (!['lesen', 'hoeren', 'schreiben', 'sprechen'].some((k) => done[k])) return '';
    const le = done.lesen ? simAutoStats('lesen', d) : null, ho = done.hoeren ? simAutoStats('hoeren', d) : null;
    const lv = le ? ratioTdn(le.correct, le.total) : null, hv = ho ? ratioTdn(ho.correct, ho.total) : null;
    const w = sim.ai.w && sim.ai.w.r, wv = w ? TV[w.tdn] || 2 : null;
    const sp = Object.keys(sim.ai.s).map((i) => sim.ai.s[i] && sim.ai.s[i].r).filter(Boolean), sv = sp.length ? median(sp.map((r) => TV[r.tdn] || 2)) : null;
    const nTasks = (d.sprechen.tasks || []).length, nRec = Object.values(sim.recordings || {}).filter((r) => r && !r.local && r.id).length;
    const pending = tdJobs(sim, d).length;
    const all = [lv, hv, wv, sv];
    let verdict = '';
    if (all.every((v) => v != null)) {
      const min = Math.min(...all), sum = all.reduce((a, b) => a + b, 0), ok = min >= 4;
      verdict = `<div class="ss-verdict ${ok ? 'ok' : 'bad'}"><b>${ok ? T('اگر فردا آزمون بدهید: به احتمال زیاد TDN 4 در هر چهار بخش (پذیرش در بیشتر دانشگاه‌ها)', 'If you took the exam tomorrow: likely TDN 4 in all four parts', 'Prognose: wahrscheinlich TDN 4 in allen vier Teilen') : T('اگر فردا آزمون بدهید: هنوز در همه بخش‌ها به TDN 4 نمی‌رسید', 'If you took the exam tomorrow: not yet TDN 4 in every part', 'Prognose: noch nicht TDN 4 in allen Teilen')}</b><span>${T('مجموع تخمینی', 'Estimated total', 'Geschätzte Summe')}: TDN ${faN(sum)} ${T('از', 'of', 'von')} ${faN(20)} · ${T('ضعیف‌ترین بخش', 'weakest part', 'schwächster Teil')}: ${TN(min)}</span></div>`;
    }
    const rows = [['Lesen', lv, le ? `${faN(le.correct)}/${faN(le.total)} ${T('درست', 'correct', 'richtig')}` : T('هنوز انجام نشده', 'not done yet', 'noch offen'), true], ['Hören', hv, ho ? `${faN(ho.correct)}/${faN(ho.total)} ${T('درست', 'correct', 'richtig')}` : T('هنوز انجام نشده', 'not done yet', 'noch offen'), true], ['Schreiben', wv, w ? `${faN(w.words)} ${T('واژه', 'words', 'Wörter')}` : done.schreiben ? T('در انتظار ارزیابی هوشمند', 'waiting for AI rating', 'KI-Bewertung offen') : T('هنوز انجام نشده', 'not done yet', 'noch offen'), false], ['Sprechen', sv, sp.length ? `${faN(sp.length)}/${faN(nTasks)} ${T('بخش ارزیابی شد', 'tasks rated', 'Aufgaben bewertet')}` : done.sprechen ? (nRec ? T('در انتظار ارزیابی هوشمند', 'waiting for AI rating', 'KI-Bewertung offen') : T('ضبطی روی سرور نیست', 'no saved recordings', 'keine gespeicherten Aufnahmen')) : T('هنوز انجام نشده', 'not done yet', 'noch offen'), false]];
    const detail = (w ? `<details class="ss-det"><summary>Schreiben · ${esc(w.tdn)}</summary><p>${esc(w.summary_fa)}</p><ul class="ss-crit"><li>${T('برداشت کلی', 'Overall impression', 'Gesamteindruck')}: <b>${esc(w.criteria.gesamteindruck)}</b></li><li>${T('انجام تکلیف', 'Task', 'Aufgabe')}: <b>${esc(w.criteria.aufgabe)}</b></li><li>${T('زبان', 'Language', 'Sprache')}: <b>${esc(w.criteria.sprache)}</b></li></ul>${(w.improve_fa || []).length ? `<b>${T('برای بهتر شدن', 'To improve', 'Verbessern')}:</b><ul>${w.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : '') +
      (sp.length ? `<details class="ss-det"><summary>Sprechen · ${T('هر بخش', 'per task', 'je Aufgabe')}</summary><ol class="ss-tasks">${(d.sprechen.tasks || []).map((t, i) => { const r = sim.ai.s[i] && sim.ai.s[i].r; return `<li><b>${esc(t.type || 'Aufgabe ' + (i + 1))}</b> ${r ? tdnPill(TV[r.tdn] || 2) : '<span class="ss-pill">—</span>'}${r ? `<p>${esc(r.summary_fa)}</p>${(r.improve_fa || []).length ? `<ul>${r.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}` : ''}</li>`; }).join('')}</ol></details>` : '');
    return `<section class="ss-panel"><header><div><span class="ss-kicker">${T('ارزیابی هوشمند', 'AI estimate', 'KI-Einschätzung')}</span><h2>${T('اگر فردا آزمون بدهم، چه نتیجه‌ای می‌گیرم؟', 'What would I get if I took the exam tomorrow?', 'Was würde ich morgen erreichen?')}</h2></div>${pending ? `<button type="button" class="ss-btn" onclick="amkSimAssessTd()" ${run.busy ? 'disabled' : ''}>${run.busy ? `${T('در حال ارزیابی', 'Rating', 'Bewertung läuft')} ${faN(run.done)}/${faN(run.total)}…` : '✨ ' + T('ارزیابی نوشتن و صحبت', 'Rate writing & speaking', 'Schreiben & Sprechen bewerten')}</button>` : ''}</header>
      ${run.err ? `<p class="ss-err">${esc(run.err)}</p>` : ''}${verdict}<div class="ss-grid">${rows.map(([n, v, sub, est]) => `<div class="ss-cell"><b>${n}</b>${tdnPill(v, est && v != null)}<small>${sub}</small></div>`).join('')}</div>
      <p class="ss-note">${T('Lesen و Hören از روی پاسخ‌ها و Schreiben و Sprechen با هوش مصنوعی و معیارهای رسمی TestDaF تخمین زده می‌شوند. صحبت از روی متن پیاده‌شده‌ی صدا ارزیابی می‌شود و تلفظ فقط تقریبی است. نتیجه یک پیش‌بینی است، نه نمره رسمی.', 'Reading/listening come from your answers; writing/speaking are rated by AI with the official TestDaF criteria (speaking from a transcript; pronunciation only roughly). This is a forecast, not an official score.', 'Lesen/Hören aus den Antworten, Schreiben/Sprechen per KI nach den offiziellen TestDaF-Kriterien (Sprechen über ein Transkript). Eine Prognose, kein offizielles Ergebnis.')}</p>${detail}</section>`;
  }

  /* ---------- ÖSD ---------- */
  function osdWritingTask(d, e, n) {
    const W = d.schreiben;
    if (n === 1) { const t = W.a1; return `Situation: ${t.situation}\n${t.task}\nInserat: ${t.ad.title}; ${t.ad.lines.join('; ')}\nNotizen: ${t.notes.join('; ')}\nAn: ${t.to} · Betreff: ${t.subject}`; }
    const t = W.a2, v = e.ans.schreiben.v === 'B' ? 'B' : 'A', V = t.variants[v];
    return `${t.intro}\nVariante ${v}: ${V.lead}\n${V.quotes.map((q) => '„' + q + '“').join('\n')}\nLeitpunkte: ${V.points.join('; ')}`;
  }
  function osdSpeakTask(d, e, i) {
    const P = d.sprechen, a = e.ans.sprechen;
    if (i === 0) { const t = P.a1; return `Aufgabe 1 · ${t.title}\nSituation: ${t.situation}\n${t.points.join('\n')}\nFragen der Gesprächspartnerin: ${(t.partner || []).join(' / ')}`; }
    if (i === 1) { const t = P.a2, pic = a.pic != null ? t.images[a.pic] : null; return `Aufgabe 2 · ${t.title}\n${t.situation}\n${pic ? 'Gewähltes Bild: ' + pic.alt : 'Bilder: ' + t.images.map((x) => x.alt).join(' | ')}`; }
    const t = P.a3, r = a.role === 1 ? 1 : 0; return `Aufgabe 3 · ${t.title}: ${t.topic}\n${t.situation}\nRolle der Lernenden: ${t.roles[r].name}: ${t.roles[r].text}\nGegenposition: ${t.roles[1 - r].name}: ${t.roles[1 - r].text}`;
  }
  function osdJobs(d, e) {
    const jobs = [], o = OSD(); e.ai = e.ai || { sp: {} }; e.ai.sp = e.ai.sp || {};
    if (e.done.schreiben) [1, 2].forEach((n) => {
      const text = e.ans.schreiben['a' + n] || '', k = 's' + n;
      if (words(text) < 20 || (e.ai[k] && e.ai[k].h === hashOf(text + e.ans.schreiben.v))) return;
      jobs.push(async () => { try { const r = await assess({ exam: 'oesd', part: 'writing', task: osdWritingTask(d, e, n), kind: n === 1 ? 'Formelles E-Mail (ca. 120 Wörter)' : 'Meinungsäußerung (ca. 120 Wörter)', text }); e.ai[k] = { h: hashOf(text + e.ans.schreiben.v), r }; e.self[k] = { ...r.criteria }; o.save(true); } catch (x) { run.err = errText(x); } });
    });
    const rid = e.ans.sprechen.rid || {};
    if (e.done.sprechen) [0, 1, 2].forEach((i) => {
      if (!rid[i] || (e.ai.sp[i] && e.ai.sp[i].rid === rid[i])) return;
      jobs.push(async () => { try { const r = await assess({ exam: 'oesd', part: 'speaking', task: osdSpeakTask(d, e, i), kind: ['Kennenlernen und beraten', 'Bild beschreiben und interpretieren', 'Meinungsaustausch'][i], recording_id: rid[i] }); e.ai.sp[i] = { rid: rid[i], r }; e.self.sp[i] = r.points; o.save(true); } catch (x) { run.err = errText(x); } });
    });
    return jobs;
  }
  window.amkSimAssessOsd = async function () {
    const o = OSD(); if (run.busy || !o) return; const d = o.data(), e = o.ex(); if (!d || !e) return;
    const jobs = osdJobs(d, e); if (!jobs.length) return;
    Object.assign(run, { busy: true, done: 0, total: jobs.length, err: '' }); rerender();
    await pool(jobs, 2);
    run.busy = false; o.save(true); rerender();
  };
  function osdPanel() {
    const o = OSD(), d = o.data(), e = o.ex(); if (!d || !e) return '';
    if (!['lesen', 'hoeren', 'schreiben', 'sprechen'].some((k) => e.done[k])) return '';
    e.ai = e.ai || { sp: {} }; e.ai.sp = e.ai.sp || {};
    const r = o.results(d, e), pending = osdJobs(d, e).length, rid = e.ans.sprechen.rid || {};
    const missingRec = e.done.sprechen ? [0, 1, 2].filter((i) => !rid[i]).length : 0;
    let verdict = '';
    if (['lesen', 'hoeren', 'schreiben', 'sprechen'].every((k) => r[k] != null)) {
      const tot = r.lesen + r.hoeren + r.schreiben + r.sprechen, mins = r.lesen >= 10 && r.hoeren >= 10 && r.schreiben >= 15 && r.sprechen >= 18, ok = mins && tot >= 60;
      const pr = !ok ? T('قبول نمی‌شوید', 'not passed', 'nicht bestanden') : tot >= 88 ? T('عالی (sehr gut)', 'very good', 'sehr gut') : tot >= 75 ? T('خوب (gut)', 'good', 'gut') : T('قبول (bestanden)', 'passed', 'bestanden');
      verdict = `<div class="ss-verdict ${ok ? 'ok' : 'bad'}"><b>${T('اگر فردا آزمون بدهید', 'If you took the exam tomorrow', 'Prognose für morgen')}: ${faN(tot)}/${faN(100)} · ${pr}</b><span>${mins ? T('حد نصاب همه بخش‌ها رعایت شده است.', 'Every part reaches its minimum.', 'Alle Mindestpunkte erreicht.') : T('حد نصاب: خواندن ۱۰، شنیدن ۱۰، نوشتن ۱۵، صحبت ۱۸ — دست‌کم یک بخش زیر حد است.', 'Minimums: reading 10, listening 10, writing 15, speaking 18 — at least one part is below.', 'Mindestpunkte: Lesen 10, Hören 10, Schreiben 15, Sprechen 18 – mindestens ein Teil liegt darunter.')}</span></div>`;
    }
    const cell = (n, v, max, pass, sub) => `<div class="ss-cell"><b>${n}</b><span class="ss-pill ${v == null ? '' : pass && v < pass ? 'bad' : 'good'}">${v == null ? '—' : faN(v) + '/' + faN(max)}</span><small>${sub}</small></div>`;
    const wDet = [1, 2].map((n) => { const a = e.ai['s' + n] && e.ai['s' + n].r; return a ? `<details class="ss-det"><summary>Schreiben · Aufgabe ${n} · ${faN(a.points)}/${faN(15)}</summary><p>${esc(a.summary_fa)}</p><ul class="ss-crit"><li>K ${faN(a.criteria.K)}/۲</li><li>T ${faN(a.criteria.T)}/۵</li><li>L ${faN(a.criteria.L)}/۳</li><li>F ${faN(a.criteria.F)}/۵</li><li>A ${a.criteria.A === 'nb' ? 'n. b.' : faN(a.criteria.A)}</li></ul>${(a.improve_fa || []).length ? `<ul>${a.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : ''; }).join('');
    const sDet = [0, 1, 2].map((i) => { const a = e.ai.sp[i] && e.ai.sp[i].r; return a ? `<details class="ss-det"><summary>Sprechen · Aufgabe ${i + 1} · ${faN(a.points)}/${faN(10)}</summary><p>${esc(a.summary_fa)}</p>${(a.improve_fa || []).length ? `<ul>${a.improve_fa.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</details>` : ''; }).join('');
    return `<section class="ss-panel"><header><div><span class="ss-kicker">${T('ارزیابی هوشمند', 'AI estimate', 'KI-Einschätzung')}</span><h2>${T('اگر فردا آزمون بدهم، قبول می‌شوم؟', 'Would I pass if I took the exam tomorrow?', 'Würde ich morgen bestehen?')}</h2></div>${pending ? `<button type="button" class="ss-btn" onclick="amkSimAssessOsd()" ${run.busy ? 'disabled' : ''}>${run.busy ? `${T('در حال ارزیابی', 'Rating', 'Bewertung läuft')} ${faN(run.done)}/${faN(run.total)}…` : '✨ ' + T('ارزیابی نوشتن و صحبت', 'Rate writing & speaking', 'Schreiben & Sprechen bewerten')}</button>` : ''}</header>
      ${run.err ? `<p class="ss-err">${esc(run.err)}</p>` : ''}${verdict}<div class="ss-grid">${cell('Lesen', r.lesen, 20, 10, e.done.lesen ? T('جدول رسمی', 'official table', 'offizielle Tabelle') : T('هنوز انجام نشده', 'not done yet', 'noch offen'))}${cell('Hören', r.hoeren, 20, 10, e.done.hoeren ? T('جدول رسمی', 'official table', 'offizielle Tabelle') : T('هنوز انجام نشده', 'not done yet', 'noch offen'))}${cell('Schreiben', r.schreiben, 30, 15, e.ai.s1 || e.ai.s2 ? T('ارزیابی هوشمند', 'AI rating', 'KI-Bewertung') : e.done.schreiben ? T('در انتظار ارزیابی', 'waiting for rating', 'Bewertung offen') : T('هنوز انجام نشده', 'not done yet', 'noch offen'))}${cell('Sprechen', r.sprechen, 30, 18, Object.keys(e.ai.sp).length ? T('ارزیابی هوشمند', 'AI rating', 'KI-Bewertung') : missingRec ? T('ضبط جدید لازم است', 'record again', 'neu aufnehmen') : e.done.sprechen ? T('در انتظار ارزیابی', 'waiting for rating', 'Bewertung offen') : T('هنوز انجام نشده', 'not done yet', 'noch offen'))}</div>
      ${missingRec && e.done.sprechen ? `<p class="ss-err">${T(`${faN(missingRec)} ضبط روی سرور ذخیره نشده است (ضبط‌های قبل از این نسخه فقط روی دستگاه بودند). برای ارزیابی، در بخش Sprechen دوباره ضبط کنید.`, `${missingRec} recording(s) are not saved on the server. Record them again in Sprechen to have them rated.`, `${missingRec} Aufnahme(n) sind nicht auf dem Server. Bitte im Teil Sprechen neu aufnehmen.`)}</p>` : ''}
      <p class="ss-note">${T('هوش مصنوعی همان فرم ارزیابی رسمی ÖSD را پر می‌کند (نوشتن: K/T/L/F و کسر تکلیف؛ صحبت: ۰ تا ۱۰ برای هر بخش). نتیجه را در صفحه هر بخش می‌بینید و می‌توانید تغییرش دهید. این یک پیش‌بینی است، نه نمره رسمی.', 'The AI fills the official ÖSD rating form (writing K/T/L/F and task deduction; speaking 0–10 per task). You can see and change it in each part. A forecast, not an official score.', 'Die KI füllt den offiziellen ÖSD-Bewertungsbogen aus; Sie können die Werte im jeweiligen Teil ändern. Eine Prognose, kein offizielles Ergebnis.')}</p>${wDet}${sDet}</section>`;
  }

  /* ---------- ÖSD recordings → server (so they can be rated) ---------- */
  async function upload(blob, examId, i) {
    const o = OSD(); if (!o || !blob || !blob.size) return;
    try {
      const mime = (blob.type || 'audio/webm').split(';')[0], form = new FormData();
      form.append('plan_id', 'osd-simulation-' + examId); form.append('task_id', 'osd-' + (i + 1));
      form.append('audio', blob, 'osd-' + (i + 1) + '.' + (mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'));
      const saved = await apiRequest('/speaking/recordings', { method: 'POST', body: form });
      const e = o.ex(examId); e.ans.sprechen.rid = e.ans.sprechen.rid || {}; e.ans.sprechen.rid[i] = saved.id; o.save(true); rerender();
    } catch (err) { console.warn('ÖSD recording upload failed', err); }
  }

  /* ---------- hook into the simulation page ---------- */
  function wrap(orig) {
    const w = function () {
      const html = orig.apply(this, arguments);
      try {
        if (typeof hasPremiumAccess === 'function' && !hasPremiumAccess()) return html;
        if (isOsd()) {
          const st = OSD().state(); if (st.view !== 'overview') return html;
          const p = osdPanel(); return p ? html.replace('<section class="osd-mods">', p + '<section class="osd-mods">') : html;
        }
        const sim = ensureTestdafSimState(); if (S.testdafExamLibraryView !== false || !sim.started || (sim.active && sim.active !== 'overview')) return html;
        const p = tdPanel(); if (!p) return html;
        const k = html.indexOf('<section class="grid md:grid-cols-2 gap-4">'); return k >= 0 ? html.slice(0, k) + p + html.slice(k) : html;
      } catch (e) { console.warn('sim score panel', e); return html; }
    };
    w.__ss = true; return w;
  }
  if (typeof window.renderTestDaFSimulation === 'function' && !window.renderTestDaFSimulation.__ss) window.renderTestDaFSimulation = wrap(window.renderTestDaFSimulation);
  window.AmkSimScore = { upload, tdPanel, osdPanel };
  try { if (typeof S !== 'undefined' && S.screen === 'testdafSim') rerender(); } catch (e) { /* ignore */ }
})();
