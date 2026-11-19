/* EXAM-SIM (2026-11-19): «شبیه‌سازی آزمون» — the exam choice (TestDaF / ÖSD) on top of the simulation page and the
   ÖSD Zertifikat B2 simulator (two mock exams from osd-sim-data.js, scored with the official ÖSD tables).
   The learning plan is the same for everyone; S.user.examPlan only says which exam is simulated.
   No inline handlers: everything runs through data-osd attributes (the Windows app's CSP forbids inline code). */
(function () {
  'use strict';
  if (window.AmkOsdSim) return;
  /* host hooks: the site uses its globals; the Windows app sets window.AMK_OSD_HOST = { lang, userKey, getExam, setExam, rerender, confirm, alert, base } */
  const HOST = () => window.AMK_OSD_HOST || null;
  const BASE_ = () => (HOST() && HOST().base) || window.AMK_OSD_BASE || '/osd-sim/';
  const EX = () => window.AMK_OSD_EXAMS || [];
  const lang = () => { const l = HOST() ? HOST().lang() : typeof S !== 'undefined' && S.uiLanguage; return l === 'en' || l === 'de' ? l : 'fa'; };
  const L = (fa, de, en) => (lang() === 'fa' ? fa : lang() === 'en' ? (en || de) : de);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fa = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
  const MODS = { lesen: { min: 90, max: 20, pass: 10 }, hoeren: { min: 30, max: 20, pass: 10 }, schreiben: { min: 90, max: 30, pass: 0 }, sprechen: { min: 15, max: 30, pass: 0 } };
  const MOD_NAMES = { lesen: 'Lesen', hoeren: 'Hören', schreiben: 'Schreiben', sprechen: 'Sprechen' };
  const LETTERS = ['A', 'B', 'C'];

  /* ───────── state (per account, in this browser) ───────── */
  const key = () => 'amk_osd_sim:' + ((HOST() ? HOST().userKey() : typeof S !== 'undefined' && (S.currentUser || S.user?.email)) || 'guest');
  let st = null, stKey = '';
  function blankExam() { return { starts: {}, done: {}, ans: { lesen: { a1: {}, a2: {}, a3: {}, a4: {} }, hoeren: { a1: {}, a2: {} }, schreiben: { a1: '', a2: '', v: 'A' }, sprechen: { pic: null, role: 0 } }, plays: {}, self: { s1: {}, s2: {}, sp: {} } }; }
  function state() {
    if (st && stKey === key()) return st;
    stKey = key();
    try { st = JSON.parse(localStorage.getItem(stKey) || 'null'); } catch (e) { st = null; }
    if (!st || typeof st !== 'object') st = {};
    st.view = st.view || 'home'; st.exams = st.exams || {}; st.tab = st.tab || {};
    return st;
  }
  function ex(id) {
    const s = state(); id = id || s.exam;
    if (!s.exams[id]) s.exams[id] = blankExam();
    const e = s.exams[id], b = blankExam();
    for (const k of Object.keys(b)) if (!e[k]) e[k] = b[k];
    for (const m of Object.keys(b.ans)) e.ans[m] = Object.assign({}, b.ans[m], e.ans[m] || {});
    return e;
  }
  let saveT = 0;
  function save(now) { clearTimeout(saveT); const w = () => { try { localStorage.setItem(key(), JSON.stringify(state())); } catch (e) { /* storage full or blocked */ } }; if (now) w(); else saveT = setTimeout(w, 400); }
  const data = () => EX().find((x) => x.id === state().exam) || null;
  const rerender = () => { if (HOST()) HOST().rerender(); else if (typeof render === 'function') render(); };
  const askConfirm = (m) => (HOST() && HOST().confirm ? HOST().confirm(m) : typeof appConfirm === 'function' ? appConfirm(m) : Promise.resolve(confirm(m)));

  /* ───────── scoring (official ZB2 Modellsatz tables) ───────── */
  const norm = (v) => String(v == null ? '' : v).trim().toLowerCase().replace(/ß/g, 'ss').replace(/[.,;:!?„“"'»«\-–\s]+$/g, '').replace(/^[„“"'»«\s]+/, '').replace(/\s+/g, ' ');
  const okText = (val, list) => { const n = norm(val); return !!n && list.some((a) => norm(a) === n); };
  const band = (n, cuts) => { for (let i = 0; i < cuts.length; i++) if (n >= cuts[i]) return cuts.length - i; return 0; };
  function scoreLesen(d, a) {
    const r = {};
    r.a1 = d.lesen.a1.items.filter((it, i) => Number(a.a1[i]) === it.answer).length;
    r.a2 = d.lesen.a2.texts.filter((t, i) => a.a2[i] === t.answer).length;
    const c3 = d.lesen.a3.lines.filter((ln, i) => okText(a.a3[i], ln[1])).length;
    r.a3 = band(c3, [18, 15, 11, 7, 4]); r.a3raw = c3;
    const c4 = Object.keys(d.lesen.a4.answers).filter((n) => okText(a.a4[n], d.lesen.a4.answers[n])).length;
    r.a4 = band(c4, [9, 7, 5, 3, 1]); r.a4raw = c4;
    r.total = r.a1 + r.a2 + r.a3 + r.a4; return r;
  }
  function cellPoints(row, ci, a) {
    if (row.type === 'text') return okText(a[ci], row.answers[ci]) ? 1 : 0;
    const want = row.answers[ci], got = (a[ci] || []);
    const right = row.options.filter((o, oi) => want.includes(oi) === got.includes(oi)).length;
    return right === row.options.length ? 2 : right / row.options.length >= 0.5 ? 1 : 0;
  }
  function scoreHoeren(d, a) {
    const r = {}, it = d.hoeren.a1.items, ans = it.map((x, i) => a.a1[i]);
    const answered = ans.filter((v) => v === true || v === false);
    const allSame = answered.length === it.length && answered.every((v) => v === answered[0]);
    r.a1 = allSame ? 0 : it.filter((x, i) => ans[i] === x.a).length;
    let mp = 0;
    d.hoeren.a2.rows.forEach((row, ri) => {
      const ra = a.a2[ri] || {};
      if (row.type === 'check') {
        const ticks = d.hoeren.a2.columns.reduce((n, c, ci) => n + ((ra[ci] || []).length), 0), boxes = row.options.length * d.hoeren.a2.columns.length;
        if (ticks === 0 || ticks === boxes) return;
      }
      d.hoeren.a2.columns.forEach((c, ci) => { mp += cellPoints(row, ci, ra); });
    });
    r.a2raw = mp; r.a2 = band(mp, [43, 40, 37, 33, 29, 24, 19, 14, 9, 4]);
    r.total = r.a1 + r.a2; return r;
  }
  const crit = [['K', 2, L('تناسب ارتباطی و نوع متن', 'Kommunikative Angemessenheit / Textsorte', 'Appropriateness / text type')], ['T', 5, L('ساختار و انسجام متن', 'Textaufbau / Kohärenz', 'Structure / coherence')], ['L', 3, L('واژگان و بیان', 'Lexik / Ausdruck', 'Vocabulary / expression')], ['F', 5, L('درستی دستوری و املایی', 'Formale Richtigkeit', 'Formal accuracy')]];
  function writingPts(sv) { if (!sv || sv.A === 'nb') return sv && sv.A === 'nb' ? 0 : null; if (crit.some(([k]) => sv[k] == null)) return null; const sum = crit.reduce((n, [k]) => n + Number(sv[k] || 0), 0) + Number(sv.A || 0); return crit.some(([k]) => Number(sv[k]) === 0) ? 0 : Math.max(0, sum); }
  function scoreSchreiben(e) { const a = writingPts(e.self.s1), b = writingPts(e.self.s2); return { a1: a, a2: b, total: a == null || b == null ? null : a + b }; }
  function scoreSprechen(e) { const v = [0, 1, 2].map((i) => e.self.sp[i]); return { parts: v, total: v.some((x) => x == null) ? null : v.reduce((n, x) => n + Number(x), 0) }; }
  const words = (t) => (String(t || '').trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) || []).length;

  /* ───────── timers / audio / recording ───────── */
  let tick = 0, audio = null, audioKey = '', rec = null, recChunks = [], recTask = null, recStart = 0;
  const recordings = {};
  function remaining(e, mod) { const s = e.starts[mod]; if (!s) return MODS[mod].min * 60; return Math.round(MODS[mod].min * 60 - (Date.now() - s) / 1000); }
  const clock = (sec) => { const neg = sec < 0, s = Math.abs(sec); return (neg ? '−' : '') + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function startTick() {
    clearInterval(tick);
    tick = setInterval(() => {
      const el = document.getElementById('osdClock');
      if (!el || !document.body.contains(el)) { clearInterval(tick); return; }
      const s = state(), e = ex(), sec = remaining(e, s.view);
      el.textContent = clock(sec); el.classList.toggle('is-late', sec < 0); el.classList.toggle('is-low', sec >= 0 && sec < 300);
      const r = document.getElementById('osdRecClock'); if (r && rec) r.textContent = clock(Math.round((Date.now() - recStart) / 1000));
    }, 1000);
  }
  function stopAudio() { if (audio) { try { audio.pause(); } catch (e) { /* ignore */ } } audio = null; audioKey = ''; }
  function playAudio(task) {
    const s = state(), e = ex(), d = data(), h = d.hoeren[task], k = d.id + ':' + task;
    if (audio && audioKey === k) { stopAudio(); rerender(); return; }
    const used = e.plays[task] || 0;
    if (!e.done.hoeren && used >= h.plays) return;
    stopAudio();
    audio = new Audio(BASE_() + 'audio/' + h.audio); audioKey = k;
    if (!e.done.hoeren) e.plays[task] = used + 1;
    save(true);
    audio.addEventListener('timeupdate', () => { const b = document.querySelector('[data-osd-prog="' + task + '"]'); if (b && audio && audio.duration) b.style.width = (100 * audio.currentTime / audio.duration).toFixed(1) + '%'; });
    audio.addEventListener('ended', () => { stopAudio(); rerender(); });
    audio.play().catch(() => { stopAudio(); rerender(); });
    rerender();
  }
  async function toggleRec(i) {
    if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { alertMsg(L('این مرورگر ضبط صدا را پشتیبانی نمی‌کند.', 'Dieser Browser unterstützt keine Aufnahme.', 'This browser cannot record audio.')); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      recChunks = []; recTask = i; recStart = Date.now();
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) recChunks.push(ev.data); };
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); const blob = new Blob(recChunks, { type: rec.mimeType || 'audio/webm' }); const k = state().exam + ':' + i; if (recordings[k]) URL.revokeObjectURL(recordings[k]); recordings[k] = URL.createObjectURL(blob); try { if (window.AmkSimScore) window.AmkSimScore.upload(blob, state().exam, i); } catch (x) { /* SIM-SCORE */ } rec = null; recTask = null; rerender(); };
      rec.start(250); rerender();
    } catch (e) { rec = null; alertMsg(L('دسترسی به میکروفون داده نشد.', 'Kein Mikrofonzugriff.', 'Microphone access was denied.')); }
  }
  function speak(text) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'de-AT'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) { /* no speech synthesis */ } }
  function alertMsg(m) { if (HOST() && HOST().alert) return HOST().alert(m); if (typeof showGlassAlarm === 'function') showGlassAlarm(m, { type: 'warning', source: 'osd-sim' }); else alert(m); }

  /* ───────── exam choice (both exams) ───────── */
  function chooser(cur) {
    const card = (id, flag, name, sub) => `<button type="button" class="osd-pick ${cur === id ? 'is-on' : ''}" data-osd="pick" data-v="${id}" aria-pressed="${cur === id}"><span class="osd-flag ${flag}" aria-hidden="true"></span><span><b>${name}</b><small>${sub}</small></span>${cur === id ? '<i>✓</i>' : ''}</button>`;
    return `<section class="osd-chooser" aria-label="${esc(L('آزمون خود را انتخاب کنید', 'Wählen Sie Ihre Prüfung', 'Choose your exam'))}"><div class="osd-chooser-head"><h2>${L('آزمون خود را انتخاب کنید', 'Wählen Sie Ihre Prüfung', 'Choose your exam')}</h2><p>${L('برنامه یادگیری برای همه یکسان است؛ این انتخاب فقط آزمونِ شبیه‌سازی را تعیین می‌کند و هر وقت خواستید عوضش کنید.', 'Der Lernplan ist für alle gleich; hier wählen Sie nur, welche Prüfung simuliert wird – jederzeit änderbar.', 'The learning plan is the same for everyone; this only picks which exam is simulated – change it any time.')}</p></div><div class="osd-pick-row">${card('testdaf', 'de', 'TestDaF', L('پذیرش دانشگاه‌های آلمان · TDN 3–5', 'Hochschulzugang Deutschland · TDN 3–5', 'German university admission · TDN 3–5'))}${card('oesd', 'at', 'ÖSD Zertifikat B2', L('دو آزمون کامل در قالب رسمی', 'Zwei vollständige Modellprüfungen', 'Two complete mock exams'))}</div></section>`;
  }
  function currentExam() { const v = HOST() ? HOST().getExam() : typeof S !== 'undefined' && S.user && S.user.examPlan; return v === 'oesd' ? 'oesd' : 'testdaf'; }

  /* ───────── ÖSD pages ───────── */
  function shell(inner, cls) { return `<div class="osd-page ${cls || ''}"><main class="osd-main">${inner}</main></div>`; }
  function results(d, e) {
    const le = e.done.lesen ? scoreLesen(d, e.ans.lesen) : null, ho = e.done.hoeren ? scoreHoeren(d, e.ans.hoeren) : null, sc = e.done.schreiben ? scoreSchreiben(e) : null, sp = e.done.sprechen ? scoreSprechen(e) : null;
    return { lesen: le && le.total, hoeren: ho && ho.total, schreiben: sc && sc.total, sprechen: sp && sp.total };
  }
  function home() {
    const s = state();
    const cards = EX().map((d) => {
      const e = ex(d.id), r = results(d, e), done = Object.keys(MODS).filter((m) => e.done[m]).length, started = Object.keys(e.starts).length;
      const pill = done === 4 ? L('کامل شد', 'Abgeschlossen', 'Completed') : started ? L('در حال انجام', 'Begonnen', 'In progress') : L('جدید', 'Neu', 'New');
      return `<article class="osd-exam-card"><div class="osd-exam-top"><span class="osd-logo">ÖSD</span><span class="osd-pill ${done === 4 ? 'ok' : started ? 'now' : ''}">${pill}</span></div><h3 dir="ltr">${esc(d.title)}</h3><p>${esc(d.theme[lang()] || d.theme.de)}</p><ul class="osd-mini">${Object.keys(MODS).map((m) => `<li class="${e.done[m] ? 'is-done' : ''}"><b>${MOD_NAMES[m]}</b><span>${r[m] != null ? fa(r[m]) + '/' + fa(MODS[m].max) : e.done[m] ? '…' : fa(MODS[m].min) + ' ' + L('دقیقه', 'Min.', 'min')}</span></li>`).join('')}</ul><button type="button" class="osd-btn primary" data-osd="open" data-v="${d.id}">${started ? L('ادامه آزمون', 'Weiter', 'Continue') : L('شروع آزمون', 'Prüfung öffnen', 'Open exam')} <span>←</span></button></article>`;
    }).join('');
    return `<header class="osd-hero"><span class="osd-eyebrow"><i class="osd-flag at"></i> ${L('شبیه‌سازی آزمون', 'Prüfungssimulation', 'Exam simulation')}</span><h1>ÖSD Zertifikat B2</h1><p>${L('دو آزمون کامل مطابق Modellsatz رسمی ÖSD: Lesen ۹۰ دقیقه (۴ بخش)، Hören حدود ۳۰ دقیقه (۲ بخش)، Schreiben ۹۰ دقیقه (۲ متن) و Sprechen با ۱۵ دقیقه آماده‌سازی (۳ بخش). Lesen و Hören خودکار و با جدول امتیاز رسمی تصحیح می‌شوند.', 'Zwei vollständige Modellprüfungen nach dem offiziellen ÖSD-Modellsatz: Lesen 90 Min. (4 Aufgaben), Hören ca. 30 Min. (2 Aufgaben), Schreiben 90 Min. (2 Texte), Sprechen mit 15 Min. Vorbereitung (3 Aufgaben). Lesen und Hören werden automatisch nach den offiziellen Punktetabellen bewertet.', 'Two complete mock exams following the official ÖSD model set: Reading 90 min (4 tasks), Listening ~30 min (2 tasks), Writing 90 min (2 texts), Speaking with 15 min preparation (3 tasks). Reading and listening are scored automatically with the official tables.')}</p></header><section class="osd-exams">${cards}</section>`;
  }
  function overview(d, e) {
    const r = results(d, e);
    const desc = { lesen: L('۴ بخش · ۲۰ امتیاز · حدنصاب ۱۰', '4 Aufgaben · 20 P. · mind. 10', '4 tasks · 20 pts · pass 10'), hoeren: L('۲ بخش · ۲۰ امتیاز · حدنصاب ۱۰', '2 Aufgaben · 20 P. · mind. 10', '2 tasks · 20 pts · pass 10'), schreiben: L('۲ متن · ۳۰ امتیاز · خودارزیابی', '2 Texte · 30 P. · Selbstbewertung', '2 texts · 30 pts · self-assessed'), sprechen: L('۳ بخش · ضبط صدا · خودارزیابی', '3 Aufgaben · Aufnahme · Selbstbewertung', '3 tasks · recording · self-assessed') };
    const mods = Object.keys(MODS).map((m) => {
      const run = e.starts[m] && !e.done[m];
      return `<article class="osd-mod ${e.done[m] ? 'is-done' : run ? 'is-run' : ''}"><div><b>${MOD_NAMES[m]}</b><small>${m === 'sprechen' ? fa(15) + '+' + fa(15) : fa(MODS[m].min)} ${L('دقیقه', 'Min.', 'min')} · ${desc[m]}</small></div>${r[m] != null ? `<strong class="${MODS[m].pass && r[m] < MODS[m].pass ? 'bad' : 'good'}">${fa(r[m])}<small>/${fa(MODS[m].max)}</small></strong>` : ''}<button type="button" class="osd-btn ${e.done[m] ? '' : 'primary'}" data-osd="mod" data-v="${m}">${e.done[m] ? L('مرور و نتیجه', 'Auswertung', 'Review') : run ? L('ادامه', 'Fortsetzen', 'Continue') : L('شروع', 'Starten', 'Start')}</button></article>`;
    }).join('');
    const w = ['lesen', 'hoeren', 'schreiben'], wDone = w.every((m) => r[m] != null);
    let verdict = '';
    if (wDone) {
      const tot = r.lesen + r.hoeren + r.schreiben, ok = r.lesen >= 10 && r.hoeren >= 10 && r.schreiben > 0 && tot >= 42;
      verdict += `<div class="osd-verdict ${ok ? 'ok' : 'bad'}"><b>${L('آزمون کتبی', 'Schriftliche Prüfung', 'Written exam')}: ${fa(tot)}/${fa(70)}</b><span>${ok ? L('در محدوده قبولی', 'im Bestehensbereich', 'within the pass range') : L('هنوز زیر حدنصاب', 'noch unter der Grenze', 'still below the pass mark')}</span></div>`;
    }
    if (r.sprechen != null) verdict += `<div class="osd-verdict ${r.sprechen >= 18 ? 'ok' : 'bad'}"><b>${L('آزمون شفاهی', 'Mündliche Prüfung', 'Oral exam')}: ${fa(r.sprechen)}/${fa(30)}</b><span>${L('بر اساس خودارزیابی', 'laut Selbstbewertung', 'self-assessed')}</span></div>`;
    return `<div class="osd-bar"><button type="button" class="osd-btn ghost" data-osd="home">→ ${L('همه آزمون‌ها', 'Alle Prüfungen', 'All exams')}</button><button type="button" class="osd-btn ghost danger" data-osd="reset">↺ ${L('شروع دوباره', 'Neu beginnen', 'Start over')}</button></div><header class="osd-hero small"><span class="osd-eyebrow"><i class="osd-flag at"></i> ÖSD Zertifikat B2</span><h1 dir="ltr">${esc(d.title)}</h1><p>${L('هر بخش زمان جداگانه دارد و می‌توانید جدا جدا انجامشان دهید. حدنصاب: Lesen و Hören هر کدام ۱۰ از ۲۰؛ کل آزمون کتبی حدود ۶۰٪ (۴۲ از ۷۰) به‌عنوان راهنما.', 'Jeder Teil hat eine eigene Zeit und kann einzeln absolviert werden. Bestehensgrenzen: Lesen und Hören je 10 von 20; schriftliche Prüfung gesamt ca. 60 % (42 von 70) als Richtwert.', 'Each part is timed separately. Pass marks: reading and listening 10 of 20 each; written exam about 60 % (42 of 70) as a guide.')}</p></header>${verdict ? `<section class="osd-verdicts">${verdict}</section>` : ''}<section class="osd-mods">${mods}</section>`;
  }
  function moduleHead(m, e, tabs) {
    const s = state(), tab = s.tab[m] || 0, done = e.done[m];
    return `<div class="osd-bar sticky"><button type="button" class="osd-btn ghost" data-osd="back">→ ${L('نمای کلی', 'Übersicht', 'Overview')}</button><b class="osd-bar-title">${MOD_NAMES[m]}</b>${done ? `<span class="osd-pill ok">${L('تحویل شد', 'Abgegeben', 'Submitted')}</span>` : `<span id="osdClock" class="osd-clock">${clock(remaining(e, m))}</span><button type="button" class="osd-btn primary" data-osd="submit">${L('تحویل بخش', 'Abgeben', 'Submit')}</button>`}</div><nav class="osd-tabs">${tabs.map((t, i) => `<button type="button" class="${tab === i ? 'is-on' : ''}" data-osd="tab" data-v="${i}">${esc(t)}</button>`).join('')}</nav>`;
  }
  const mark = (ok, show) => (show ? `<i class="osd-mark ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'}</i>` : '');
  function lesen(d, e) {
    const s = state(), tab = s.tab.lesen || 0, a = e.ans.lesen, rv = !!e.done.lesen, L1 = d.lesen;
    let body = '';
    if (tab === 0) {
      const t = L1.a1;
      body = `<p class="osd-instr">${L('ابتدا متن را بخوانید و سپس برای هر سؤال (۱ تا ۵) پاسخ درست (A، B یا C) را انتخاب کنید. برای هر سؤال فقط یک پاسخ درست است.', 'Lesen Sie zuerst den Text und lösen Sie dann die 5 Aufgaben, indem Sie die richtige Antwort (A, B oder C) markieren. Für jede Aufgabe gibt es nur eine richtige Lösung.')}</p><div class="osd-split"><article class="osd-text" dir="ltr"><h3>${esc(t.title)}</h3><div>${esc(t.text).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>') + '</p>'}</div><small>${esc(t.source)}</small></article><div class="osd-qs" dir="ltr"><div class="osd-q example"><b>0 · ${esc(t.example.q)}</b>${t.example.options.map((o, oi) => `<label class="${oi === t.example.answer ? 'is-key' : ''}"><input type="radio" disabled ${oi === t.example.answer ? 'checked' : ''}><em>${LETTERS[oi]}</em>${esc(o)}</label>`).join('')}<small>Beispiel</small></div>${t.items.map((it, i) => `<div class="osd-q"><b>${i + 1} · ${esc(it.q)} ${mark(Number(a.a1[i]) === it.answer, rv)}</b>${it.options.map((o, oi) => `<label class="${rv && oi === it.answer ? 'is-key' : ''}"><input type="radio" name="osdl1-${i}" ${String(a.a1[i]) === String(oi) ? 'checked' : ''} ${rv ? 'disabled' : ''} data-osd-in="l1" data-i="${i}" value="${oi}"><em>${LETTERS[oi]}</em>${esc(o)}</label>`).join('')}</div>`).join('')}</div></div>`;
    } else if (tab === 1) {
      const t = L1.a2;
      body = `<p class="osd-instr">${L('۱۰ تیتر و ۵ متن را بخوانید و برای هر متن (۱ تا ۵) تیتر مناسب (A تا K) را انتخاب کنید. برای هر متن فقط یک پاسخ درست است.', 'Lesen Sie die 10 Überschriften und die 5 Texte. Suchen Sie dann zu jedem Text (1–5) die passende Überschrift (A–K). Pro Text gibt es nur eine richtige Lösung.')}</p><ol class="osd-heads" dir="ltr">${t.headings.map(([k, h]) => `<li><em>${k}</em>${esc(h)}</li>`).join('')}</ol><div class="osd-shorts" dir="ltr">${t.texts.map((x, i) => `<article class="osd-short"><header><b>${i + 1}</b><label>Überschrift: <select data-osd-in="l2" data-i="${i}" ${rv ? 'disabled' : ''}><option value="">–</option>${t.headings.map(([k]) => `<option ${a.a2[i] === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>${mark(a.a2[i] === x.answer, rv)}${rv && a.a2[i] !== x.answer ? `<span class="osd-key">${x.answer}</span>` : ''}</header><p>${esc(x.text)}</p><small>${esc(x.source)}</small></article>`).join('')}</div>`;
    } else if (tab === 2) {
      const t = L1.a3;
      body = `<p class="osd-instr">${L('موقعیت: یک کپی از این مقاله به دستتان رسیده اما لبه سمت راست آن بریده شده است. متن را بازسازی کنید و کلمه یا بخش جاافتاده را در انتهای هر خط بنویسید. هر جای خالی حداکثر ۳ حرف دارد.', 'Situation: Sie haben eine Kopie des folgenden Zeitungsartikels bekommen. Leider ist der rechte Rand abgeschnitten. Rekonstruieren Sie den Text, indem Sie die fehlenden Wörter bzw. Wortteile an den rechten Rand schreiben. Es gibt für jede Lücke eine Lösung mit maximal 3 Buchstaben.')}</p><article class="osd-recon" dir="ltr"><h3>${esc(t.title)}</h3>${t.examples.map(([txt, sol], i) => `<div class="osd-line ex"><span>${esc(txt)}</span><input value="${esc(sol)}" disabled><small>(${'abc'[i]})</small></div>`).join('')}${t.lines.map(([txt, sol], i) => `<div class="osd-line"><span>${esc(txt)}</span><input maxlength="5" value="${esc(a.a3[i] || '')}" ${rv ? 'disabled' : ''} data-osd-in="l3" data-i="${i}" autocomplete="off" spellcheck="false">${mark(okText(a.a3[i], sol), rv)}${rv && !okText(a.a3[i], sol) ? `<span class="osd-key">${esc(sol[0])}</span>` : ''}<small>${i + 1}</small></div>`).join('')}<div class="osd-line"><span>${esc(t.tail)}</span></div><small>${esc(t.source)}</small></article>`;
    } else {
      const t = L1.a4;
      let html = esc(t.text).replace(/\{(\d+)\}/g, (m0, n) => {
        if (n === '0') return `<span class="osd-gap ex">(0) ${esc(t.example)}</span>`;
        const v = a.a4[n] || '', ok = okText(v, t.answers[n]);
        return `<span class="osd-gap"><small>(${n})</small><input value="${esc(v)}" ${rv ? 'disabled' : ''} data-osd-in="l4" data-i="${n}" autocomplete="off" spellcheck="false">${mark(ok, rv)}${rv && !ok ? `<span class="osd-key">${esc(t.answers[n].join(' / '))}</span>` : ''}</span>`;
      });
      body = `<p class="osd-instr">${L('موقعیت: ', 'Situation: ')}<span dir="ltr">${esc(t.situation)}</span> ${L('متن را بخوانید و کلمه‌های جاافتاده (۱ تا ۱۰) را بنویسید. پاسخ باید از نظر معنا و دستور درست باشد؛ هر جای خالی یک کلمه است و هیچ جایی نباید خالی بماند.', 'Lesen Sie den Text und ergänzen Sie die fehlenden Wörter (1–10). Die Lösungen müssen sinngemäß passen und grammatikalisch korrekt sein. Es gibt für jede Lücke eine Lösung mit einem Wort. Keine Lücke darf leer bleiben.')}</p><article class="osd-letter" dir="ltr">${html.replace(/\n/g, '<br>')}</article>`;
    }
    const tabs = ['Aufgabe 1 · Mehrfachauswahl', 'Aufgabe 2 · Überschriften', 'Aufgabe 3 · Textrekonstruktion', 'Aufgabe 4 · Lückentext'];
    let res = '';
    if (rv) { const r = scoreLesen(d, a); res = `<div class="osd-score"><b>Lesen: ${fa(r.total)}/${fa(20)}</b><span>A1 ${fa(r.a1)}/${fa(5)} · A2 ${fa(r.a2)}/${fa(5)} · A3 ${fa(r.a3)}/${fa(5)} (${fa(r.a3raw)}/${fa(20)}) · A4 ${fa(r.a4)}/${fa(5)} (${fa(r.a4raw)}/${fa(10)})</span><em class="${r.total >= 10 ? 'ok' : 'bad'}">${r.total >= 10 ? L('قبول (حدنصاب ۱۰)', 'bestanden (mind. 10)', 'passed (min. 10)') : L('زیر حدنصاب ۱۰', 'unter 10 Punkten', 'below 10 points')}</em></div>`; }
    return moduleHead('lesen', e, tabs) + res + `<section class="osd-body">${body}</section>`;
  }
  function audioBox(d, e, task) {
    const h = d.hoeren[task], used = e.plays[task] || 0, rv = !!e.done.hoeren, playing = audio && audioKey === d.id + ':' + task, left = Math.max(0, h.plays - used);
    return `<div class="osd-audio"><button type="button" class="osd-play ${playing ? 'is-on' : ''}" data-osd="play" data-v="${task}" ${!playing && !rv && left === 0 ? 'disabled' : ''}>${playing ? '■' : '▶'}</button><div class="osd-audio-body"><b>${playing ? L('در حال پخش…', 'Wird abgespielt …', 'Playing …') : rv ? L('پخش دوباره (حالت مرور)', 'Erneut anhören (Auswertung)', 'Listen again (review)') : left ? L(`پخش · ${fa(left)} بار باقی مانده`, `Abspielen · noch ${left}×`, `Play · ${left} left`) : L('پخش‌ها تمام شد', 'Keine Wiedergabe mehr', 'No plays left')}</b><div class="osd-prog"><span data-osd-prog="${task}"></span></div><small>${h.plays === 2 ? L('متن را دو بار می‌شنوید.', 'Sie hören den Text zwei Mal.') : L('متن را فقط یک بار می‌شنوید.', 'Sie hören den Text ein Mal.')} ${L('قبل از پخش ۹۰ ثانیه برای خواندن سؤال‌ها وقت دارید.', 'Vorher haben Sie 90 Sekunden Zeit zum Lesen.')}</small></div></div>`;
  }
  function transcript(h) { return `<details class="osd-trans" dir="ltr"><summary>${L('متن شنیداری (Transkript)', 'Transkript', 'Transcript')}</summary>${h.script.map(([sp, t]) => `<p><b>${esc(h.speakers[sp] || sp)}:</b> ${esc(t)}</p>`).join('')}</details>`; }
  function hoeren(d, e) {
    const s = state(), tab = s.tab.hoeren || 0, a = e.ans.hoeren, rv = !!e.done.hoeren;
    let body = '';
    if (tab === 0) {
      const h = d.hoeren.a1;
      body = `<p class="osd-instr" dir="ltr"><b>${esc(h.title)}</b> · ${esc(h.situation)}</p>${audioBox(d, e, 'a1')}<p class="osd-lead" dir="ltr">${esc(h.intro)}</p><table class="osd-rf" dir="ltr"><thead><tr><th></th><th></th><th>R</th><th>F</th></tr></thead><tbody>${h.items.map((it, i) => `${i === 0 || h.items[i - 1].sec !== it.sec ? `<tr class="sec"><td colspan="4">Abschnitt ${it.sec}</td></tr>` : ''}<tr class="${rv ? (a.a1[i] === it.a ? 'ok' : 'bad') : ''}"><td>${i + 1}</td><td>${esc(it.s)}${rv ? ` <span class="osd-key">${it.a ? 'R' : 'F'}</span>` : ''}</td><td><input type="radio" name="osdh1-${i}" ${a.a1[i] === true ? 'checked' : ''} ${rv ? 'disabled' : ''} data-osd-in="h1" data-i="${i}" value="1"></td><td><input type="radio" name="osdh1-${i}" ${a.a1[i] === false ? 'checked' : ''} ${rv ? 'disabled' : ''} data-osd-in="h1" data-i="${i}" value="0"></td></tr>`).join('')}</tbody></table>${rv ? transcript(h) : ''}`;
    } else {
      const h = d.hoeren.a2;
      body = `<p class="osd-instr" dir="ltr"><b>${esc(h.title)}</b> · ${esc(h.situation)}</p>${audioBox(d, e, 'a2')}<div class="osd-grid-wrap" dir="ltr"><table class="osd-grid"><thead><tr><th></th>${h.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${h.rows.map((row, ri) => `<tr><th>${ri + 1}. ${esc(row.label)}</th>${h.columns.map((c, ci) => {
        const ra = a.a2[ri] || {};
        if (row.type === 'text') { const ok = okText(ra[ci], row.answers[ci]); return `<td><span class="osd-cell"><input value="${esc(ra[ci] || '')}" ${rv ? 'disabled' : ''} data-osd-in="h2t" data-r="${ri}" data-c="${ci}" autocomplete="off"><small>${esc(row.unit)}</small>${mark(ok, rv)}</span>${rv && !ok ? `<span class="osd-key">${esc(row.answers[ci][0])}</span>` : ''}</td>`; }
        const got = ra[ci] || [], pts = cellPoints(row, ci, ra);
        return `<td>${row.options.map((o, oi) => `<label class="osd-tick ${rv && row.answers[ci].includes(oi) ? 'is-key' : ''}"><input type="checkbox" ${got.includes(oi) ? 'checked' : ''} ${rv ? 'disabled' : ''} data-osd-in="h2c" data-r="${ri}" data-c="${ci}" data-o="${oi}">${esc(o)}</label>`).join('')}${rv ? `<small class="osd-pts ${pts === 2 ? 'ok' : pts ? 'mid' : 'bad'}">${pts}/2</small>` : ''}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>${rv ? transcript(h) : ''}`;
    }
    let res = '';
    if (rv) { const r = scoreHoeren(d, a); res = `<div class="osd-score"><b>Hören: ${fa(r.total)}/${fa(20)}</b><span>A1 ${fa(r.a1)}/${fa(10)} · A2 ${fa(r.a2)}/${fa(10)} (${fa(r.a2raw)}/${fa(45)} ${L('امتیاز خام', 'Messpunkte', 'raw')})</span><em class="${r.total >= 10 ? 'ok' : 'bad'}">${r.total >= 10 ? L('قبول (حدنصاب ۱۰)', 'bestanden (mind. 10)', 'passed (min. 10)') : L('زیر حدنصاب ۱۰', 'unter 10 Punkten', 'below 10 points')}</em></div>`; }
    return moduleHead('hoeren', e, ['Aufgabe 1 · Richtig/Falsch', 'Aufgabe 2 · Informationen ergänzen']) + res + `<section class="osd-body">${body}</section>`;
  }
  function selfForm(id, sv) {
    sv = sv || {};
    const row = ([k, max, label]) => `<div class="osd-crit"><span>${esc(label)}</span><div>${Array.from({ length: max + 1 }, (x, i) => `<button type="button" class="${String(sv[k]) === String(i) ? 'is-on' : ''}" data-osd="self" data-f="${id}" data-k="${k}" data-v="${i}">${fa(i)}</button>`).join('')}</div></div>`;
    const ded = [['0', '0'], ['-1', '−1'], ['-2', '−2'], ['-3', '−3'], ['nb', 'n. b.']];
    const pts = writingPts(sv);
    return `<div class="osd-self"><h4>${L('خودارزیابی با معیارهای رسمی (Auswertungsbogen)', 'Selbstbewertung nach dem Auswertungsbogen', 'Self-assessment (official criteria)')}</h4>${crit.map(row).join('')}<div class="osd-crit"><span>${L('تکلیف: همه نکته‌ها پوشش داده شد؟ (کسر امتیاز)', 'Aufgabe: alle Punkte bearbeitet? (Abzug)', 'Task: all points covered? (deduction)')}</span><div>${ded.map(([v, t]) => `<button type="button" class="${String(sv.A) === v ? 'is-on' : ''}" data-osd="self" data-f="${id}" data-k="A" data-v="${v}">${t}</button>`).join('')}</div></div><p class="osd-self-sum">${pts == null ? L('همه معیارها را انتخاب کنید.', 'Bitte alle Kriterien bewerten.', 'Rate every criterion.') : L(`امتیاز این متن: ${fa(pts)} از ۱۵`, `Punkte: ${pts}/15`, `Points: ${pts}/15`)}</p></div>`;
  }
  function schreiben(d, e) {
    const s = state(), tab = s.tab.schreiben || 0, a = e.ans.schreiben, rv = !!e.done.schreiben, W = d.schreiben;
    let body = '';
    if (tab === 0) {
      const t = W.a1, n = words(a.a1);
      body = `<p class="osd-instr" dir="ltr"><b>Situation:</b> ${esc(t.situation)}<br>${esc(t.task)}</p><div class="osd-ad-row" dir="ltr"><article class="osd-ad"><h4>${esc(t.ad.title)}</h4><ul>${t.ad.lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><small>${esc(t.ad.contact)}</small></article><ul class="osd-notes">${t.notes.map((x) => `<li>✎ ${esc(x)}</li>`).join('')}</ul></div><div class="osd-mail" dir="ltr"><div><small>An:</small> ${esc(t.to)}</div><div><small>Betreff:</small> ${esc(t.subject)}</div><textarea data-osd-in="w1" ${rv ? 'readonly' : ''} placeholder="Sehr geehrte …">${esc(a.a1)}</textarea><div class="osd-wc"><span id="osdWc1" class="${n >= 100 && n <= 160 ? 'ok' : ''}">${n} Wörter</span><span>${L('حدود ۱۲۰ کلمه', 'circa 120 Wörter')}</span></div></div>${rv ? `<details class="osd-model" dir="ltr" open><summary>${L('متن نمونه', 'Mustertext', 'Model text')}</summary><p>${esc(t.model).replace(/\n/g, '<br>')}</p></details>${selfForm('s1', e.self.s1)}` : ''}`;
    } else {
      const t = W.a2, v = a.v === 'B' ? 'B' : 'A', V = t.variants[v], n = words(a.a2);
      body = `<p class="osd-instr" dir="ltr">${esc(t.intro)}</p><div class="osd-var">${['A', 'B'].map((k) => `<button type="button" class="${v === k ? 'is-on' : ''}" data-osd="var" data-v="${k}" ${rv ? 'disabled' : ''}>Variante ${k}</button>`).join('')}</div><article class="osd-v" dir="ltr"><p>${esc(V.lead)}</p><div class="osd-quotes">${V.quotes.map((q) => `<blockquote>${esc(q)}</blockquote>`).join('')}</div><p>Schreiben Sie nun Ihre Meinung dazu und gehen Sie dabei auf die folgenden vier Punkte ein:</p><ul>${V.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></article><div class="osd-mail" dir="ltr"><textarea data-osd-in="w2" ${rv ? 'readonly' : ''}>${esc(a.a2)}</textarea><div class="osd-wc"><span id="osdWc2" class="${n >= 100 && n <= 160 ? 'ok' : ''}">${n} Wörter</span><span>${L('حدود ۱۲۰ کلمه', 'circa 120 Wörter')}</span></div></div>${rv ? `${t.variants.A.model ? `<details class="osd-model" dir="ltr"><summary>${L('متن نمونه (Variante A)', 'Mustertext (Variante A)', 'Model text (variant A)')}</summary><p>${esc(t.variants.A.model).replace(/\n/g, '<br>')}</p></details>` : ''}${selfForm('s2', e.self.s2)}` : ''}`;
    }
    let res = '';
    if (rv) { const r = scoreSchreiben(e); res = `<div class="osd-score"><b>Schreiben: ${r.total == null ? '…' : fa(r.total)}/${fa(30)}</b><span>${L('بعد از تحویل، متن نمونه را بخوانید و هر متن را با معیارهای رسمی امتیاز دهید. اگر یکی از معیارها صفر یا «n. b.» باشد، آن متن صفر می‌گیرد.', 'Vergleichen Sie Ihren Text mit dem Mustertext und bewerten Sie ihn nach den offiziellen Kriterien. 0 Punkte in einem Kriterium oder „n. b.“ = Aufgabe 0 Punkte.')}</span></div>`; }
    return moduleHead('schreiben', e, ['Aufgabe 1 · Formelles E-Mail', 'Aufgabe 2 · Meinungsäußerung']) + res + `<section class="osd-body">${body}</section>`;
  }
  function recBox(i, e) {
    const k = state().exam + ':' + i, url = recordings[k], on = rec && recTask === i;
    return `<div class="osd-rec ${on ? 'is-on' : ''}"><button type="button" class="osd-btn ${on ? 'danger' : 'primary'}" data-osd="rec" data-v="${i}" ${rec && !on ? 'disabled' : ''}>${on ? '■ ' + L('توقف ضبط', 'Aufnahme stoppen', 'Stop') : '● ' + (url ? L('ضبط دوباره', 'Neu aufnehmen', 'Record again') : L('شروع ضبط', 'Aufnahme starten', 'Record'))}</button>${on ? `<span id="osdRecClock" class="osd-clock">00:00</span>` : ''}${url ? `<audio controls src="${url}"></audio>` : `<small>${L('حدود ۵ دقیقه صحبت کنید. ضبط فقط روی همین دستگاه می‌ماند.', 'Sprechen Sie ca. 5 Minuten. Die Aufnahme bleibt nur auf diesem Gerät.', 'Speak about 5 minutes. The recording stays on this device.')}</small>`}</div>`;
  }
  function selfSp(i, e) {
    const v = e.self.sp[i];
    return `<div class="osd-self"><h4>${L('خودارزیابی این بخش (۰ تا ۱۰)', 'Selbstbewertung dieser Aufgabe (0–10)', 'Self-assessment (0–10)')}</h4><p class="osd-hint">${L('معیارها: انجام کامل تکلیف، روانی، دامنه واژگان، درستی دستوری، تلفظ و تعامل.', 'Kriterien: Aufgabenerfüllung, Flüssigkeit, Wortschatz, grammatische Richtigkeit, Aussprache, Interaktion.')}</p><div class="osd-crit"><span></span><div>${Array.from({ length: 11 }, (x, n) => `<button type="button" class="${String(v) === String(n) ? 'is-on' : ''}" data-osd="selfsp" data-i="${i}" data-v="${n}">${fa(n)}</button>`).join('')}</div></div></div>`;
  }
  function sprechen(d, e) {
    const s = state(), tab = s.tab.sprechen || 0, rv = !!e.done.sprechen, P = d.sprechen, a = e.ans.sprechen;
    let body = '';
    const tip = `<p class="osd-instr">${L('ابتدا ۱۵ دقیقه برای آماده‌شدن وقت دارید (ساعت بالا). سپس هر بخش حدود ۵ دقیقه است. در آزمون واقعی با یک ارزیاب یا هم‌گروه صحبت می‌کنید؛ اینجا پاسخ خود را ضبط کنید و بعد گوش دهید.', 'Zuerst haben Sie 15 Minuten Vorbereitungszeit (Uhr oben). Jede Aufgabe dauert dann ca. 5 Minuten. In der echten Prüfung sprechen Sie mit Prüfenden oder einer Partnerin/einem Partner; hier nehmen Sie Ihre Antwort auf.')}</p>`;
    if (tab === 0) {
      const t = P.a1;
      body = tip + `<article class="osd-v" dir="ltr"><h3>Aufgabe 1 · ${esc(t.title)} <small>ca. ${t.minutes} Min.</small></h3><p><b>Situation:</b> ${esc(t.situation)}</p><p>Bereiten Sie sich auf das Gespräch vor, indem Sie sich folgende Punkte überlegen:</p><ul>${t.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><div class="osd-partner"><b>${L('هم‌صحبت شما می‌پرسد:', 'Ihr Gesprächspartner fragt:', 'Your partner asks:')}</b>${t.partner.map((q, i) => `<button type="button" data-osd="say" data-i="${i}">🔊 ${esc(q)}</button>`).join('')}</div></article>${recBox(0, e)}${rv ? selfSp(0, e) : ''}`;
    } else if (tab === 1) {
      const t = P.a2;
      body = tip + `<article class="osd-v" dir="ltr"><h3>Aufgabe 2 · ${esc(t.title)} <small>ca. ${t.minutes} Min.</small></h3><p>${esc(t.situation).replace(/ • /g, '<br>• ')}</p></article><div class="osd-pics">${t.images.map((im, i) => `<button type="button" class="osd-pic ${a.pic === i ? 'is-on' : ''}" data-osd="pic" data-v="${i}"><img src="${BASE_() + esc(im.src)}" alt="${esc(im.alt)}" loading="lazy"><span>${L('تصویر', 'Bild', 'Picture')} ${i + 1}${a.pic === i ? ' ✓' : ''}</span></button>`).join('')}</div>${recBox(1, e)}${rv ? selfSp(1, e) : ''}`;
    } else {
      const t = P.a3, role = a.role === 1 ? 1 : 0;
      body = tip + `<article class="osd-v" dir="ltr"><h3>Aufgabe 3 · ${esc(t.title)}: ${esc(t.topic)} <small>ca. ${t.minutes} Min.</small></h3><p>${esc(t.situation)}</p></article><div class="osd-var">${t.roles.map((r, i) => `<button type="button" class="${role === i ? 'is-on' : ''}" data-osd="role" data-v="${i}">Person ${i + 1} · ${esc(r.name)}</button>`).join('')}</div><div class="osd-roles" dir="ltr">${t.roles.map((r, i) => `<blockquote class="${role === i ? 'is-me' : ''}"><b>${esc(r.name)}${role === i ? ' · ' + L('نقش شما', 'Ihre Rolle', 'your role') : ''}</b>${esc(r.text)}</blockquote>`).join('')}</div><div class="osd-partner"><button type="button" data-osd="sayrole">🔊 ${L('شنیدن نظر طرف مقابل', 'Position der anderen Person anhören', 'Hear the other position')}</button></div>${recBox(2, e)}${rv ? selfSp(2, e) : ''}`;
    }
    let res = '';
    if (rv) { const r = scoreSprechen(e); res = `<div class="osd-score"><b>Sprechen: ${r.total == null ? '…' : fa(r.total)}/${fa(30)}</b><span>${L('ضبط‌ها را گوش دهید و به هر بخش از ۰ تا ۱۰ امتیاز دهید.', 'Hören Sie Ihre Aufnahmen an und bewerten Sie jede Aufgabe mit 0–10 Punkten.')}</span></div>`; }
    return moduleHead('sprechen', e, ['Aufgabe 1 · Kennenlernen', 'Aufgabe 2 · Bild', 'Aufgabe 3 · Meinungsaustausch']) + res + `<section class="osd-body">${body}</section>`;
  }
  function renderOsd() {
    const s = state(), d = data();
    if (s.view === 'home' || !d) return home();
    const e = ex();
    if (s.view === 'overview') return overview(d, e);
    const fn = { lesen, hoeren, schreiben, sprechen }[s.view];
    if (!fn) { s.view = 'overview'; return overview(d, e); }
    if (!e.done[s.view]) setTimeout(startTick, 0);
    return fn(d, e);
  }

  /* ───────── events (delegated) ───────── */
  async function submit() {
    const s = state(), e = ex(), m = s.view, d = data();
    if (rec) { alertMsg(L('اول ضبط را متوقف کنید.', 'Bitte zuerst die Aufnahme stoppen.', 'Stop the recording first.')); return; }
    let open = 0;
    if (m === 'lesen') { const a = e.ans.lesen; open = (5 - Object.keys(a.a1).length) + (5 - Object.values(a.a2).filter(Boolean).length) + (20 - Object.values(a.a3).filter((v) => String(v).trim()).length) + (10 - Object.values(a.a4).filter((v) => String(v).trim()).length); }
    if (m === 'hoeren') { const a = e.ans.hoeren; open = 10 - Object.keys(a.a1).length; }
    if (m === 'schreiben') { const a = e.ans.schreiben; open = (words(a.a1) < 60 ? 1 : 0) + (words(a.a2) < 60 ? 1 : 0); }
    const msg = open > 0 ? L(`${fa(open)} مورد هنوز خالی یا ناقص است. بخش تحویل شود؟`, `${open} Aufgabe(n) sind noch offen. Trotzdem abgeben?`, `${open} item(s) are still open. Submit anyway?`) : L('بخش تحویل شود؟ بعد از تحویل پاسخ‌ها تغییر نمی‌کنند.', 'Abschnitt abgeben? Danach sind keine Änderungen mehr möglich.', 'Submit this part? Answers are locked afterwards.');
    const ok = await askConfirm(msg);
    if (!ok) return;
    stopAudio(); e.done[m] = new Date().toISOString(); clearInterval(tick); save(true); rerender();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (x) { /* ignore */ }
  }
  document.addEventListener('click', async (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-osd]');
    if (!b || b.disabled) return;
    const s = state(), act = b.dataset.osd, v = b.dataset.v;
    if (act === 'pick') {
      const nv = v === 'oesd' ? 'oesd' : 'testdaf';
      if (HOST()) HOST().setExam(nv);
      else { if (typeof S === 'undefined' || !S.user) return; S.user.examPlan = nv; if (typeof saveData === 'function') saveData(); }
      stopAudio(); rerender(); return;
    }
    if (act === 'home') { stopAudio(); s.view = 'home'; save(); rerender(); return; }
    if (act === 'open') { s.exam = v; s.view = 'overview'; save(); rerender(); window.scrollTo && window.scrollTo(0, 0); return; }
    if (act === 'back') { stopAudio(); s.view = 'overview'; save(); rerender(); return; }
    if (act === 'mod') { const e = ex(); if (!e.starts[v]) e.starts[v] = Date.now(); s.view = v; save(true); rerender(); window.scrollTo && window.scrollTo(0, 0); return; }
    if (act === 'tab') { s.tab[s.view] = Number(v); save(); stopAudio(); rerender(); return; }
    if (act === 'submit') { submit(); return; }
    if (act === 'reset') {
      const msg = L('همه پاسخ‌ها و نتیجه‌های این آزمون پاک شود؟', 'Alle Antworten und Ergebnisse dieser Prüfung löschen?', 'Delete all answers and results of this exam?');
      const ok = await askConfirm(msg);
      if (ok) { s.exams[s.exam] = blankExam(); save(true); rerender(); }
      return;
    }
    if (act === 'play') { playAudio(v); return; }
    if (act === 'var') { ex().ans.schreiben.v = v; save(); rerender(); return; }
    if (act === 'self') { const e = ex(), f = b.dataset.f; e.self[f] = e.self[f] || {}; e.self[f][b.dataset.k] = v === 'nb' ? 'nb' : Number(v); save(); rerender(); return; }
    if (act === 'selfsp') { ex().self.sp[b.dataset.i] = Number(v); save(); rerender(); return; }
    if (act === 'rec') { toggleRec(Number(v)); return; }
    if (act === 'pic') { ex().ans.sprechen.pic = Number(v); save(); rerender(); return; }
    if (act === 'role') { ex().ans.sprechen.role = Number(v); save(); rerender(); return; }
    if (act === 'say') { speak(data().sprechen.a1.partner[Number(b.dataset.i)]); return; }
    if (act === 'sayrole') { const t = data().sprechen.a3, r = ex().ans.sprechen.role === 1 ? 0 : 1; speak(t.roles[r].text.replace(/[„“]/g, '')); return; }
  });
  function onInput(ev) {
    const el = ev.target; if (!el || !el.dataset || !el.dataset.osdIn) return;
    const e = ex(), k = el.dataset.osdIn, i = el.dataset.i;
    if (k === 'l1') e.ans.lesen.a1[i] = Number(el.value);
    else if (k === 'l2') e.ans.lesen.a2[i] = el.value;
    else if (k === 'l3') e.ans.lesen.a3[i] = el.value;
    else if (k === 'l4') e.ans.lesen.a4[i] = el.value;
    else if (k === 'h1') e.ans.hoeren.a1[i] = el.value === '1';
    else if (k === 'h2t') { const r = (e.ans.hoeren.a2[el.dataset.r] = e.ans.hoeren.a2[el.dataset.r] || {}); r[el.dataset.c] = el.value; }
    else if (k === 'h2c') { const r = (e.ans.hoeren.a2[el.dataset.r] = e.ans.hoeren.a2[el.dataset.r] || {}), c = el.dataset.c, o = Number(el.dataset.o), set = new Set(r[c] || []); el.checked ? set.add(o) : set.delete(o); r[c] = [...set].sort(); }
    else if (k === 'w1' || k === 'w2') { e.ans.schreiben[k === 'w1' ? 'a1' : 'a2'] = el.value; const w = document.getElementById(k === 'w1' ? 'osdWc1' : 'osdWc2'); if (w) { const n = words(el.value); w.textContent = n + ' Wörter'; w.classList.toggle('ok', n >= 100 && n <= 160); } }
    save();
  }
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);

  /* ───────── hook into the simulation page ───────── */
  function wrapSim(orig) {
    return function () {
      const cur = currentExam(), bar = chooser(cur);
      if (cur === 'oesd') {
        if (typeof hasPremiumAccess === 'function' && !hasPremiumAccess()) return shell(bar + (typeof renderPremiumGate === 'function' ? renderPremiumGate('exam') : ''));
        return shell(bar + renderOsd());
      }
      stopAudio();
      const html = orig.apply(this, arguments);
      const m = /<main[^>]*>/.exec(html);
      return m ? html.slice(0, m.index + m[0].length) + bar + html.slice(m.index + m[0].length) : bar + html;
    };
  }
  window.AmkOsdSim = { render: renderOsd, chooser, wrapSim, state, scoreLesen, scoreHoeren, currentExam, stopAudio, shell, data, ex, save, results }; /*SIM-SCORE*/
  if (typeof window.renderTestDaFSimulation === 'function' && !window.renderTestDaFSimulation.__osd) {
    const w = wrapSim(window.renderTestDaFSimulation); w.__osd = true;
    try { window.renderTestDaFSimulation = w; } catch (e) { /* read-only binding */ }
    try { if (typeof S !== 'undefined' && S.screen === 'testdafSim') rerender(); } catch (e) { /* ignore */ }
  }
})();
