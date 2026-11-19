// «اجرای برنامه» — the site's dashboard for the learning plan: program choice, onboarding, today's
// plan (mode tabs, day card, daily progress, next activity, activity list, renew), the weekly
// program (time & path, weekly focus, today's order, tables, writing samples, grammar, method) and
// the activity frame (steps, step clock, active-time timer). Module contents come in rounds 3b–3d.

import { esc, toast } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import { today, addDays } from '../core/learning.js';
import { MODS, ML, faNum, mmss, timeStr, wdOf, satOf, DAY_DEF, DAILY_CHOICES, EXTRA_CHOICES, BASE, DEFAULT_DAILY, planName, topicLabel } from '../core/engine.js';
import { EXAM_PLANS } from '../data/topics.js';
import { confirmDialog } from './widgets.js';
import { createModules } from './modules/index.js';
import { createFreeSpace } from './free-space.js';
import { createGrammarDrill } from './grammar-drill.js';
import { loadPack } from '../core/content.js';
import { renderOwnerPacks } from '../core/owner-packs.js';

const ICON = {
  headphones: '🎧', 'document-text': '📖', 'pencil-square': '✍️', microphone: '🎙️', language: '🔤', brain: '🧠', 'clipboard-check': '📋',
};
const ROUND = { hoeren: '3b', lesen: '3b', schreiben: '3c', sprechen: '3c', wortschatz: '3d', wiederholung: '3d', fehleranalyse: '3d', wochenbericht: '3d', extra: '3d' };
const LEVELS = [['A1', 'Anfänger'], ['A2', 'Elementar'], ['B1', 'Mittelstufe'], ['B2', 'Obere Mittelstufe'], ['C1', 'Fortgeschritten']];
const SKILLS = [['lesen', '📖', 'Lesen'], ['hoeren', '🎧', 'Hören'], ['schreiben', '✍️', 'Schreiben'], ['sprechen', '🗣️', 'Sprechen'], ['grammatik', '📝', 'Grammatik'], ['vocab', '📚', 'Vokabeln']];
const ui = { view: 'plan', onboardStep: 0, error: '' }; // view: plan | hub | activity | onboarding | programs

const dateLocale = () => (lang() === 'fa' ? 'fa-IR-u-ca-persian' : lang() === 'en' ? 'en-GB' : 'de-DE');
const fmtLong = (d) => { try { return new Intl.DateTimeFormat(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d); } catch { return ''; } };
const dir = () => (lang() === 'fa' ? 'rtl' : 'ltr');

export function renderDashboard(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page dash';
  const eng = ctx.engine;
  const E = esc;
  // Lesson modules (3b+). A background redraw (AI result, recorder) waits while a text box is focused.
  let pendingRedraw = false;
  const typing = () => { const a = document.activeElement; return !!(a && root.contains(a) && a.matches('textarea, input:not([type=range]), select')); };
  const mods = createModules({ eng, ctx, redraw: (why) => { if (ui.view !== 'activity' && why !== 'finish') return; if (['ai', 'media'].includes(why) && typing()) { pendingRedraw = true; return; } if (why === 'finish') ui.view = 'plan'; draw(); } });
  // «مطالعه آزاد»: the games space and the grammar bot (site free-space.js + grammar-drill.js)
  const toolEnv = { data: () => ctx.store.data, navigate: (p) => ctx.navigate(p), loadPack: (n) => loadPack(ctx.bridge, n), premium: () => !!ctx.account.premium, api: (p, o) => ctx.bridge.api(p, o), redraw: () => { if (root.isConnected && eng.curMode() === 'free' && ui.view === 'plan') draw(); } };
  // the floating tools (tutor context, notebook lookups, media keys) read the open lesson through this
  if (ctx.setLesson) ctx.setLesson({ ...mods.lessonApi, get open() { return root.isConnected && ui.view === 'activity' && !!eng.act(); } });
  const fs = createFreeSpace(toolEnv);
  const gd = createGrammarDrill(toolEnv);
  root.addEventListener('focusout', () => { if (pendingRedraw) setTimeout(() => { if (pendingRedraw && !typing()) { pendingRedraw = false; draw(); } }, 0); });

  /* ───────────── views ───────────── */
  function draw() {
    const S = eng.S;
    if (eng.V.screen === 'activity' && eng.act()) ui.view = 'activity';
    else if (ui.view === 'activity') ui.view = 'plan';
    if (!eng.program() && ui.view !== 'onboarding') { // UNIFIED-PLAN: no program choice any more
      const r = eng.selectExamPlan('testdaf');
      if (r === 'onboarding') { ui.view = 'onboarding'; ui.onboardStep = 0; } else { ui.view = 'plan'; if (r === 'generate') setTimeout(() => generate(), 0); }
    }
    else if (ui.view === 'programs') ui.view = 'plan';
    if (ui.view === 'programs') root.innerHTML = programsView();
    else if (ui.view === 'onboarding') root.innerHTML = onboardingView();
    else if (ui.view === 'packs') root.innerHTML = packsView();
    else if (ui.view === 'hub') root.innerHTML = osdRw(hubView(), 'renderHub');
    else if (ui.view === 'activity') { root.innerHTML = osdRw(mods.render(), 'renderActivity'); mods.after(root); }
    else root.innerHTML = osdRw(planView(), 'renderDashboardCard');
    void S;
    if (ctx.afterDraw) ctx.afterDraw();
  }

  const programsView = () => {
    const plans = Object.values(EXAM_PLANS);
    const S = eng.S;
    return `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">🎯</span><div><p class="kicker">${E(ML('برنامه یادگیری', 'LERNPROGRAMM', 'LEARNING PROGRAM'))}</p><h1>${E(ML('برنامه یادگیری خود را انتخاب کنید', 'Wähle dein Lernprogramm', 'Choose your learning program'))}</h1><small>${E(ML('یکی از مسیرهای آماده را متناسب با هدف آزمون خود انتخاب کنید.', 'Wähle einen vorbereiteten Lernweg passend zu deinem Prüfungsziel.', 'Select one of the ready-made paths for your exam goal.'))}</small></div></div></header>
      <section class="program-grid">${plans.map((p) => `<button type="button" class="card program-card ${S.user.examPlan === p.id ? 'is-on' : ''}" data-program="${p.id}"><span class="program-icon">${E(p.icon)}</span><h2>${E(planName(p.name))}</h2><p>${E(p.description)}</p><div class="chips">${(p.modules || []).map((m) => `<span class="chip">${E(m)}</span>`).join('')}</div><span class="btn btn-primary">${E(ML('انتخاب برنامه', 'Programm wählen', 'Choose program'))} →</span></button>`).join('')}</section>`;
  };

  function onboardingView() {
    const u = eng.S.user;
    const step = ui.onboardStep;
    const nav = (last) => `<div class="row-actions end">${step ? `<button type="button" class="btn" data-ob="back">← ${E(ML('بازگشت', 'Zurück', 'Back'))}</button>` : ''}<button type="button" class="btn btn-primary" data-ob="next">${E(last ? ML('شروع تمرین روزانه', 'Tagesplan starten', 'Start the daily plan') : ML('ادامه', 'Weiter', 'Next'))} →</button></div>`;
    let body = '';
    if (step === 0) body = `<h2>👋 ${E(ML('سلام', 'Hallo', 'Hello'))}${u.name ? '، ' + E(u.name) : ''}!</h2><label class="fld full"><span>${E(ML('اسم شما', 'Wie heißt du?', 'Your name'))}</span><input id="obName" dir="auto" value="${E(u.name || '')}" /></label>
      <label class="fld full"><span>${E(ML('زبان مادری', 'Muttersprache', 'Native language'))}</span><select id="obLang">${[['fa', 'فارسی'], ['de', 'Deutsch'], ['en', 'English'], ['other', ML('سایر', 'Andere', 'Other')]].map(([v, l]) => `<option value="${v}" ${(u.nativeLanguage || 'fa') === v ? 'selected' : ''}>${E(l)}</option>`).join('')}</select></label>`;
    if (step === 1) body = `<h2>${E(ML('سطح شما', 'Dein Niveau', 'Your level'))}</h2><div class="level-grid">${LEVELS.map(([id, d]) => `<button type="button" class="card level-card ${u.level === id ? 'is-on' : ''}" data-level="${id}"><b>${id}</b><small>${d}</small></button>`).join('')}</div>`;
    if (step === 2) body = `<h2>${E(ML('تاریخ آزمون', 'Prüfungsdatum', 'Exam date'))}</h2><label class="fld full"><input id="obExam" type="date" min="${addDays(today(), 1)}" value="${u.examDate && u.examDate > today() ? E(u.examDate) : ''}" /></label><button type="button" class="btn btn-ghost" data-ob="noexam">${E(ML('هنوز تاریخ آزمون را نمی‌دانم', 'Ich kenne den Termin noch nicht', "I don't know the date yet"))}</button>`;
    if (step === 3) { const m = Math.max(60, Math.min(720, Math.round((Number(u.dailyMinutes) || 60) / 60) * 60)); body = `<h2>${E(ML('زمان روزانه', 'Lernzeit', 'Study time'))}</h2><div class="range-row"><input id="obMin" type="range" min="60" max="720" step="60" value="${m}" /><b id="obMinV">${m / 60} h</b></div>`; }
    if (step === 4) body = `<h2>${E(ML('مهارت‌هایی که می‌خواهید تقویت کنید', 'Was möchtest du üben?', 'What do you want to practise?'))}</h2><div class="level-grid">${SKILLS.map(([id, ic, l]) => `<button type="button" class="card level-card ${(u.weakSkills || []).includes(id) ? 'is-on' : ''}" data-skill="${id}"><b>${ic}</b><small>${l}</small></button>`).join('')}</div>
      <label class="fld full"><span>${E(ML('هدف اصلی شما', 'Dein Hauptziel', 'Your main goal'))}</span><input id="obGoal" dir="auto" value="${E(u.learningGoal || '')}" /></label>`;
    return `<section class="card onboarding"><div class="ob-head"><span class="muted small">${E(ML(`مرحله ${faNum(step + 1)} از ${faNum(5)}`, `Schritt ${step + 1} von 5`, `Step ${step + 1} of 5`))}</span><div class="rv-bar"><i style="width:${((step + 1) / 5) * 100}%"></i></div></div>
      ${ui.error ? `<p class="error-line">${E(ui.error)}</p>` : ''}${body}${nav(step === 4)}</section>`;
  }

  /** Site PROG().rewrite: ÖSD wording of the shared screens. */
  const osdRw = (html, fn) => { const P = eng.OSD(); return P ? P.rewrite(html, fn) : html; };
  /** ÖSD level card (site oesd-method.js settingsHtml) — in today's plan time card and the weekly program. */
  function oesdSettings() {
    const P = eng.OSD(); if (!P) return '';
    const lv = P.level(); const busy = eng.oesdStarted(); const next = P.levelNext();
    const btn = (x) => `<button type="button" class="${x === lv ? 'is-cur' : ''} ${x === next ? 'is-next' : ''}" data-oesd-level="${x}"><b>${x}${x === next ? ` <i>${E(ML('از فردا', 'ab morgen', 'from tomorrow'))}</i>` : ''}</b><small>${E(x === 'B2' ? ML('اقامت، کار، تابعیت', 'Alltag, Beruf, Staatsbürgerschaft', 'Everyday life, work, citizenship') : ML('دانشگاه و کار تخصصی', 'Studium und Beruf', 'University and professional work'))}</small></button>`;
    return `<section class="card osd-settings"><div class="osd-settings-head"><span class="osd-flag" aria-hidden="true">🇦🇹</span><div><p class="kicker">ÖSD · ${E(ML('تنظیمات برنامه', 'Planeinstellungen', 'Plan settings'))}</p><h3>${E(ML('سطح آزمون ÖSD', 'ÖSD-Prüfungsniveau', 'ÖSD exam level'))}</h3></div></div>
      <div class="osd-settings-row"><span class="muted small">${E(ML('سطح آزمون', 'Niveau', 'Level'))}</span><div class="osd-seg">${P.LEVELS.map(btn).join('')}</div></div>
      <p class="muted small">${E(busy ? ML('امروز تمرین را شروع کرده‌ای؛ سطح جدید از فردا اعمال می‌شود.', 'Du hast heute schon angefangen: das neue Niveau gilt ab morgen.', 'You already started today: the new level applies from tomorrow.') : ML('همه تمرین‌ها با قالب و سطح آزمون واقعی ÖSD ساخته شده‌اند. زمان روزانه را پایین‌تر در «زمان روزانه برنامه» انتخاب کن.', 'Alle Übungen folgen Format und Niveau der echten ÖSD-Prüfung. Die tägliche Zeit wählst du unten unter „Tägliche Planzeit“.', 'All exercises follow the real ÖSD format and level. Choose your daily time below under “Daily plan time”.'))}</p></section>`;
  }

  const modeTabs = (info) => {
    const d = eng.dailyMin();
    const tab = (m, icon, title, sub) => `<button type="button" role="tab" data-mode="${m}" class="${info.mode === m ? 'is-on' : ''}"><span>${icon}</span><span class="mode-txt"><b>${E(title)}</b><small>${E(sub)}</small></span>${info.info[m] && m !== 'free' ? `<em>${info.info[m]}</em>` : ''}</button>`;
    return `<nav class="segmented mode-tabs" role="tablist">${tab('plan', '📋', ML('برنامه یادگیری', 'Lernplan', 'Learning plan'), d === BASE ? ML('۲۴۰ دقیقه پیشنهادی مثل آزمون + زمان اضافه', '240 Min. empfohlen wie in der Prüfung + Extrazeit', '240 min recommended, exam-like + extra time') : ML(`${faNum(d)} دقیقه در روز + زمان اضافه`, `${d} Min. pro Tag + Extrazeit`, `${d} min a day + extra time`))}${tab('free', '🌿', ML('مطالعه آزاد', 'Freies Lernen', 'Free study'), ML('تمرین‌های سبک، بدون زمان‌بندی', 'Leichte Übungen, ohne Zeitvorgabe', 'Light exercises, no timing'))}</nav>`;
  };

  function dayCard() {
    const S = eng.S;
    const k = S.plan?.date || today(); const def = eng.dayDef(k); const wk = eng.weekOf(k);
    const sub = ML(def.sfa, def.sde) + (!def.evaluation && def.focus.length && def.focus.length < 4 && eng.dailyMin() >= 120 ? ' · ' + ML('همه مهارت‌ها امروز تمرین می‌شوند و زمان بیشتری به مهارت‌های تمرکز داده شده است.', 'Alle Fertigkeiten werden geübt; die Schwerpunkte bekommen mehr Zeit.', 'All skills are practised; the focus skills get more time.') : '') + (wk === 0 ? ' — ' + ML('امروز با یک ارزیابی اولیه وضعیت فعلی هر چهار مهارت ثبت می‌شود.', 'Heute wird der Ausgangsstand in allen vier Fertigkeiten erfasst.', "Today records your starting level in all four skills.") : '');
    return `<article class="card day-card"><div class="chips"><span class="chip is-on">${E(wk === 0 ? ML('روز تشخیص سطح', 'Diagnosetag', 'Diagnosis day') : `${ML('هفته', 'Woche', 'Week')} ${faNum(wk)}`)}</span><span class="chip">${E(ML(def.fa, def.de))}</span></div>
      <h3>${E(ML('تنظیم برنامه', 'Planeinstellungen', 'Plan settings'))}</h3><p class="day-focus">${E(eng.focusLabel(def))}</p><p class="muted">${E(sub)}</p>
      <div class="row-actions"><button type="button" class="btn" data-hub="woche">🗓 ${E(ML('برنامه هفته', 'Wochenplan', 'Weekly plan'))}</button><button type="button" class="btn" data-act="progress">📈 ${E(ML('پیشرفت', 'Fortschritt', 'Progress'))}</button><button type="button" class="btn" data-hub="muster">🧩 ${E(ML('الگوهای معروف', 'Bekannte Muster', 'Famous patterns'))}</button><button type="button" class="btn" data-hub="methode">📘 ${E(ML('روش و قوانین', 'Methode', 'Method'))}</button></div></article>`;
  }

  /** «افزودن دستی محتوا» — the owner's stored content packs (server /v1/owner-packs). */
  function packsView() {
    const packs = ctx.ownerPacks; const st = packs ? packs.state : { list: null, loading: false, error: '' };
    if (packs && !st.loading && st.list === null) setTimeout(() => { packs.list().then(() => { if (ui.view === 'packs' && root.isConnected) draw(); }).catch((error) => toast(String(error?.message || error), 'warn')); }, 0);
    return renderOwnerPacks(st.list || [], { loading: !!st.loading || st.list === null, error: st.error || '' });
  }

  function progressCard(info) {
    const acts = (info.plan?.activities || []).filter((a) => Number(a.dur) > 0);
    const row = (a) => {
      const sec = Number(info.timers[a.id]) || 0; const ok = info.completed.has(a.id); const f = ok ? 100 : Math.min(100, Math.round((sec / ((Number(a.dur) || 1) * 60)) * 100));
      return `<li class="${ok ? 'is-done' : sec ? 'is-run' : ''}" style="--c:${MODS[a.id]?.color || '#64748b'}"><span><i></i>${E((lang() === 'fa' ? MODS[a.id]?.fa : MODS[a.id]?.de) || a.title)}</span><span class="dp-bar"><b style="width:${f}%"></b></span><small>${ok ? '✓' : `${faNum(Math.floor(sec / 60))}/${faNum(a.dur)}′`}</small></li>`;
    };
    const stat = (label, val, c) => `<div class="dp-stat"><span><i style="background:${c}"></i>${E(label)}</span><b dir="ltr">${E(val)}</b></div>`;
    return `<article class="card dp"><div class="dp-top"><div><p class="kicker">${E(ML('پیشرفت', 'FORTSCHRITT', 'PROGRESS'))}</p><h2>${E(ML('پیشرفت روزانه', 'Tagesfortschritt', 'Daily progress'))}</h2><p class="muted small">${faNum(info.comp)}/${faNum(info.tot)} ${E(ML('فعالیت تکمیل‌شده', 'Aktivitäten abgeschlossen', 'activities completed'))} · ${faNum(info.answered)} ${E(ML('پاسخ ارزیابی‌شده', 'Antworten bewertet', 'answers rated'))}</p></div>
      <div class="dp-ring" style="--p:${info.pct}"><div><b>${faNum(info.pct)}%</b><span>${E(ML('انجام‌شده', 'erledigt', 'done'))}</span></div></div></div>
      ${acts.length ? `<ul class="dp-list">${acts.map(row).join('')}</ul>` : ''}
      <div class="dp-stats">${stat(ML('زمان یادگیری', 'Lernzeit', 'Learning time'), timeStr(info.time), '#38bdf8')}${stat(ML('انجام شد', 'Erledigt', 'Done'), `${faNum(info.comp)}/${faNum(info.tot)}`, '#a855f7')}${stat(ML('امتیاز فعلی', 'Aktueller Score', 'Current score'), info.score == null ? '—' : `${faNum(info.score)}/${faNum(100)}`, '#fb7185')}</div></article>`;
  }

  function planView() {
    eng.ensureToday();
    const S = eng.S;
    if (eng.curMode() === 'free') return freeView();
    if (!S.plan && !eng.V.preparing) { setTimeout(() => eng.generatePlan().then(draw).catch((e) => toast(e.message, 'warn')), 0); }
    try { eng.leanSeedDay(); } catch (e) { console.warn(e); }
    const info = eng.dashboard();
    const examDays = info.examDate && info.examDate > today() ? Math.round((new Date(info.examDate + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 86400000) : null;
    const name = S.user.name || ctx.account.name || ML('زبان‌آموز', 'Lerner', 'Learner');
    const hero = `<header class="page-hero dash-hero"><div><p class="kicker">${E(fmtLong(new Date()))}</p><h1>${E(ML('سلام، ', 'Hallo, ', 'Hello, '))}${E(name)}! 👋</h1>
      <div class="chips"><button type="button" class="chip" data-act="account">📅 ${E(examDays === null ? ML('تاریخ آزمون را تعیین کنید', 'Prüfungstermin festlegen', 'Set exam date') : ML(`${faNum(examDays)} روز تا آزمون`, `Noch ${examDays} Tage bis zur Prüfung`, `${examDays} days until exam`))}</button><span class="chip">🔥 ${E(ML(`${faNum(info.streak)} روز زنجیره فعالیت`, `${info.streak} Tage Lernserie`, `${info.streak}-day activity streak`))}</span></div></div></header>`;
    if (!S.plan) return hero + modeTabs(info) + `<section class="card empty-card"><span class="spinner"></span><p>${E(ML('در حال آماده‌سازی تمرین‌های امروز…', 'Die heutigen Übungen werden vorbereitet …', "Preparing today's exercises…"))}</p></section>`;
    const next = info.next;
    const nextCard = next
      ? `<article class="card next-card"><div><span class="kicker">▶ ${E(ML('از اینجا شروع کنید', 'HIER STARTEN', 'START HERE'))}</span><h3>${ICON[next.icon] || '•'} ${E(next.title)}</h3><p class="muted">${E(next.desc)}</p><span class="chip">⏱ ${faNum(next.dur)} ${E(ML('دقیقه', 'Min.', 'min'))}</span></div><button type="button" class="btn btn-primary big" data-start="${E(next.id)}">▶ ${E(ML('شروع تمرین', 'Übung starten', 'Start practice'))}</button></article>`
      : `<article class="card next-card done"><div><h3>🎉 ${E(ML('همه تمرین‌های امروز انجام شد!', 'Alles erledigt!', 'All done!'))}</h3><p class="muted">${E(ML('ارزیابی روز در تاریخچه ثبت شد.', 'Die Tagesbewertung ist jetzt verfügbar.', "Today's evaluation is now available."))}</p></div><button type="button" class="btn" data-act="progress">${E(ML('دیدن تاریخچه', 'Verlauf ansehen', 'View history'))}</button></article>`;
    const fdef = eng.dayDef(S.plan.date || today()); const fFocus = Array.isArray(fdef.focus) && fdef.focus.length <= 2 ? fdef.focus : [];
    const list = S.plan.activities.map((a, idx) => {
      const done = info.completed.has(a.id); const isNext = next && next.id === a.id; const trk = Number(info.timers[a.id]) || 0;
      const pct = done ? 100 : Math.min(95, Math.round((trk / Math.max(1, a.dur * 60)) * 100));
      return `<article class="act-card ${done ? 'is-done' : ''} ${isNext ? 'is-next' : ''} ${fFocus.includes(a.id) ? 'is-focus' : 'is-soft'}" style="--c:${MODS[a.id]?.color || 'var(--accent)'}" data-${done ? 'review' : 'start'}="${E(a.id)}" role="button" tabindex="0">
        <span class="act-icon">${done ? '✓' : ICON[a.icon] || '•'}</span><div class="act-main"><div class="act-title"><span class="act-step">${faNum(idx + 1)}</span><h3>${E(a.title)}</h3>${fFocus.includes(a.id) ? `<span class="act-focus-pill">🎯 ${E(ML('تمرکز', 'Fokus', 'Focus'))}</span>` : ''}${a.priority === 'high' ? '<span class="act-high">!</span>' : ''}${done ? `<span class="chip small">👁 ${E(ML('مشاهده پاسخ‌ها', 'Antworten ansehen', 'View answers'))}</span>` : ''}</div><p class="muted small">${E(a.desc)}</p><div class="act-bar"><i style="width:${pct}%"></i></div></div>
        <div class="act-side"><b>${faNum(a.dur)}m</b>${trk ? `<small dir="ltr">${timeStr(trk)}</small>` : ''}</div></article>`;
    }).join('');
    return hero + modeTabs(info) + oesdSettings() + `<div class="dash-pair">${dayCard()}${progressCard(info)}</div>` + nextCard
      + `<section class="act-section"><div class="act-head"><h2>📋 ${E(ML('برنامه یادگیری', 'Lernplan', 'Learning plan'))} · ${E(ML(`برنامه روزانه ${faNum(info.dailyMin)} دقیقه`, `Tagesplan ${info.dailyMin} Min.`, `Daily plan ${info.dailyMin} min`))}</h2><div class="row-actions"><button type="button" class="btn btn-ghost" data-hub="woche">${E(ML('برنامه هفته', 'Wochenplan', 'Weekly program'))} ↗</button>${next ? `<button type="button" class="btn btn-primary" data-act="start-next">${E(ML('شروع تمرین', 'Übung starten', 'Start practice'))} ▶</button>` : ''}</div></div><div class="act-grid">${list}</div></section>`
      + `<section class="card day-end"><div><h3>${E(ML('اتمام تمرین و ثبت نتیجه', 'Übung abschließen & speichern', 'Finish & save the day'))}</h3><p class="muted small">${E(ML('تمرین‌ها و پاسخ‌های امروز از نو شروع می‌شوند. زمان مطالعه امروز حفظ می‌شود و ثبت روز خودکار در پایان روز انجام می‌شود.', 'Die heutigen Übungen und Antworten beginnen von vorn. Die Lernzeit bleibt erhalten; der Tag wird am Tagesende automatisch gespeichert.', "Today's exercises and answers start over. Study time is kept; the day is recorded automatically at the end of the day."))}</p></div><div class="row-actions">${ctx.ownerPacks && ctx.ownerPacks.isOwner() ? `<button type="button" class="btn" data-act="owner-packs">🗂 ${E(ML('افزودن دستی محتوا', 'Add content manually', 'Inhalte manuell hinzufügen'))}</button>` : ''}<button type="button" class="btn btn-primary" data-act="renew">↻ ${E(ML('ثبت نتیجه و تمرین تازه', 'Speichern & erneuern', 'Save & renew'))}</button></div></section>`;
  }

  /** «مطالعه آزاد» tab: mode tabs, grammar-bot entry card, games space (site free-space.js replaces the old free plan). */
  function freeView() {
    if (!eng.S.plan && !eng.V.preparing) setTimeout(() => { if (!eng.S.plan && !eng.V.preparing) generate(); }, 0);
    const info = eng.dashboard();
    return `<div class="fs-dashboard">${modeTabs(info)}${gd.entryCard()}${fs.content()}</div>`;
  }

  /* ───────────── weekly program (hub) ───────────── */
  function weekSettings() {
    const S = eng.S; const m = eng.M();
    const extra = Number(S.plan?.activities?.find((a) => a.id === 'extra')?.dur) || 0; const extraDone = (S.completed || []).includes('extra'); const extraStarted = (Number(S.activityTimers?.extra) || 0) > 0;
    const t = eng.dailyMin();
    const time = `<div class="daily-picker"><b>🕒 ${E(ML('زمان روزانه برنامه', 'Tägliche Planzeit', 'Daily plan time'))}</b><small class="muted">${E(ML('۱۲۰ دقیقه (۲ ساعت) پیشنهاد برنامه است؛ اگر وقت کمتر یا بیشتری داری تغییرش بده.', '120 Minuten werden empfohlen; bei weniger oder mehr Zeit hier ändern.', '120 minutes is recommended; change it if you have less or more time.'))}</small>
        <div class="daily-btns" role="radiogroup">${DAILY_CHOICES.map((n) => `<button type="button" role="radio" aria-checked="${n === t}" class="${n === t ? 'is-on' : ''} ${n === DEFAULT_DAILY ? 'is-rec' : ''}" data-daily="${n}"><b>${E(lang() === 'fa' ? `${faNum(String(n / 60).replace('.', '٫'))} ساعت` : `${n / 60} h`)}</b><small>${faNum(n)}′${n === DEFAULT_DAILY ? ' · ' + E(ML('پیشنهادی', 'empfohlen', 'recommended')) : ''}</small></button>`).join('')}</div><p class="muted small">${E(eng.dailyHint())}</p></div>
      ${eng.lean() ? '' : `<div class="extra-row"><b>${E(ML('زمان اضافه امروز', 'Extrazeit heute', 'Extra time today'))}</b><p class="muted small">${E(ML('برای مرور لغت، اشتباهات و شنیدن دوباره؛ جدا از زمان اصلی برنامه است.', 'Für Wortschatz, Fehler und erneutes Hören; zusätzlich zur regulären Planzeit.', 'For words, errors and listening again; separate from the regular program time.'))}</p><div class="chips" dir="ltr">${EXTRA_CHOICES.map((n) => `<button type="button" class="chip ${n === extra ? 'is-on' : ''}" data-extra="${n}" ${!eng.active() || extraDone || (n === 0 && extraStarted) ? 'disabled' : ''}>${n ? '+' + faNum(n) : E(ML('بدون', 'Keine', 'None'))}</button>`).join('')}</div></div>`}`;
    // FOCUS-MERGE / DRAG-SWAP / MIN-EDIT (site 2026-11-20): tap = focus, drag = order (swap / nearest slot), click the minutes = edit
    const tk = S.plan?.date || today(); const twd = wdOf(tk); const SKL = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
    const focus = `<p class="muted small">${E(ML('روی هر تمرین بزنید تا تمرکز آن روز شود (حداکثر دو تمرین؛ زمان تمرین‌های متمرکز بیشتر می‌شود). برای تغییر ترتیب، تمرین را بالا یا پایین بکشید: اگر روی تمرین دیگری از همان روز رها کنید جایشان عوض می‌شود، وگرنه به نزدیک‌ترین جای رها کردن می‌رود. با کلیک روی عدد دقیقه، زمان هر تمرین در آن روز قابل تغییر است. جمعه روز آزمون و ارزیابی است.', 'Tippe eine Übung an, um sie zum Tagesschwerpunkt zu machen (höchstens zwei). Zum Umordnen ziehst du eine Übung nach oben oder unten: auf einer anderen Übung desselben Tages losgelassen, tauschen beide die Plätze, sonst landet sie an der nächstgelegenen Stelle. Ein Klick auf die Minuten ändert die Zeit. Freitag ist Prüfungs- und Auswertungstag.', 'Tap an exercise to make it the day’s focus (two at most). To reorder, drag it up or down: dropped on another exercise of the same day the two swap places, otherwise it goes to the nearest spot. Click the minutes to change them. Friday is the exam and review day.'))}</p>
      <div class="wd-grid wd-3">${[6, 0, 1, 2, 3, 4].map((wd) => {
        const info = eng.weekdayInfo(wd); const def = info.def; const chosen = (def.focus || []).length <= 2 ? (def.focus || []) : []; const total = info.order.reduce((a, id) => a + (Number(info.minutes[id]) || 0), 0); const isToday = wd === twd;
        const customF = !!m.weekFocus?.[wd]; const customO = !!m.weekOrder?.[wd] || (isToday && !!m.dayOrder?.[tk]); const customM = !!m.weekMin?.[wd];
        return `<div class="wd-day ${isToday ? 'is-today' : ''}"><div class="wd-head"><b>${E(ML(def.fa, def.de))} <small class="wd-total">Σ ${faNum(total)}′</small>${isToday ? ` <em class="wd-badge">${E(ML('امروز', 'Heute', 'Today'))}</em>` : ''}</b><span class="wd-acts">${customF ? `<button type="button" class="btn btn-ghost small" data-focus-reset="${wd}">${E(ML('بازنشانی تمرکز', 'Fokus zurücksetzen', 'Reset focus'))}</button>` : ''}${customO ? `<button type="button" class="btn btn-ghost small" data-order-reset="${wd}">${E(ML('ترتیب پیشنهادی', 'Empfohlene Reihenfolge', 'Suggested order'))}</button>` : ''}${customM ? `<button type="button" class="btn btn-ghost small" data-min-reset="${wd}">${E(ML('زمان پیشنهادی', 'Empfohlene Zeiten', 'Suggested times'))}</button>` : ''}</span></div>
          <ol class="wd-list" data-wd-list="${wd}">${info.order.map((id, n) => { const sk = SKL.includes(id); const on = sk && chosen.includes(id); const v = Number(info.minutes[id]) || 0; return `<li draggable="true" data-wd-skill="${wd}:${id}" class="${on ? 'is-on' : ''}"><span class="wd-num">${faNum(n + 1)}</span><button type="button" class="wd-name" draggable="false" ${sk ? `data-focus="${wd}:${id}" aria-pressed="${on}" title="${E(ML('تمرکز این روز', 'Schwerpunkt dieses Tages', 'Focus of this day'))}"` : 'disabled'}>${E(ML(MODS[id]?.fa || id, MODS[id]?.de || id))}${on ? '<i class="wd-star">★</i>' : ''}</button><button type="button" class="wd-minbtn" draggable="false" data-wd-minedit="${wd}:${id}" data-v="${v}" title="${E(ML('برای تغییر زمان کلیک کنید', 'Zum Ändern klicken', 'Click to change'))}">${faNum(v)}′</button><span class="wd-grip" aria-hidden="true">⠿</span></li>`; }).join('')}</ol></div>`;
      }).join('')}</div>`;
    return `<section class="card week-config"><div class="panel-head"><div><p>${E(ML('کنترل برنامه', 'PROGRAMM EINSTELLEN', 'PROGRAM SETTINGS'))}</p><h2>${E(ML('برنامه هفته را به روش خودتان بچینید', 'Gestalte deinen Wochenplan', 'Make the weekly program your own'))}</h2></div></div>
      <div class="wc-stack"><section class="wc-sec"><h3 class="wc-title">${E(ML('زمان و مسیر', 'Zeit & Weg', 'Time & path'))}</h3>${time}</section><section class="wc-sec"><h3 class="wc-title">${E(ML('تمرکز و ترتیب', 'Fokus & Reihenfolge', 'Focus & order'))}</h3>${focus}</section></div></section>`;
  }

  function hubWeek() {
    const k = today(); const m = eng.M(); const wk = eng.weekOf(k); const [from] = eng.weekRange(Math.max(1, wk));
    const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(wk === 0 ? satOf(k) : from, n));
    const fmt = (n) => `${faNum(n)}′`;
    const rows = days.map((dk) => { const def = eng.dayDef(dk); const d = m.days[dk]; const done = d ? Object.keys(d.results || {}).filter((x) => x !== 'extra').length : 0; const foc = def.evaluation || def.focus.length === 4 ? E(eng.focusLabel(def)) : `<span class="chip small">${E(ML('تمرکز بیشتر', 'Schwerpunkt', 'More focus'))}</span> ${def.focus.map((f) => `<b dir="ltr">${E(ML(MODS[f].fa, MODS[f].de))} ${fmt(eng.minutesFor(dk)[f] || 0)}</b>`).join(' + ')}`; return `<tr class="${dk === k ? 'is-today' : ''}"><td><b>${E(ML(def.fa, def.de))}</b><small>${E(dk)}</small></td><td>${foc}</td><td>${E(ML(def.sfa, def.sde))}</td><td>${d ? `${faNum(done)}/${faNum(eng.lean() ? 4 : 6)}` : dk < k ? '—' : ''}</td></tr>`; }).join('');
    const st = eng.ST();
    return oesdSettings() + weekSettings() /* NO-WEEK-TABLE */
      + `<section class="card"><h3>${E(ML('ساختار آزمون', 'Prüfungsaufbau', 'Exam structure'))}</h3><table class="tbl"><tbody>${(st.examStructure || []).map((r) => `<tr><td dir="ltr"><b>${E(r.skill)}</b></td><td>${E(r.tasks)}</td><td>${E(r.minutes)}</td></tr>`).join('')}</tbody></table></section>`;
  }

  function hubProben() {
    const list = Object.values(eng.M().days).filter((d) => d.results?.schreiben?.text).sort((a, b) => b.date.localeCompare(a.date));
    return `<section class="card"><h3>${E(ML('نمونه نوشته‌ها برای مقایسه پیشرفت', 'Schreibproben zum Vergleich', 'Writing samples to compare progress'))}</h3><p class="muted small">${E(ML('نوشته‌های Schreiben هر روز اینجا نگه داشته می‌شوند.', 'Die Schreibtexte jedes Tages werden hier gesammelt.', "Each day's writing is kept here."))}</p>
      ${list.map((d) => { const r = d.results.schreiben; const it = eng.item(r.kind, r.itemId); return `<details class="hx-day"><summary class="hx-day-main"><span class="hx-day-date"><b>${E(d.date)}</b><small>${E(r.kind === 'grafik' ? 'Grafik' : 'Argumentation')} · ${faNum(r.words || 0)} ${E(ML('کلمه', 'Wörter', 'words'))} · ${r.score == null ? '—' : faNum(r.score) + '%'}</small></span></summary><div class="hx-day-detail" dir="ltr" lang="de"><p><b>${E(it?.title || '')}</b></p>${String(r.text).split(/\n+/).map((p) => `<p>${E(p)}</p>`).join('')}</div></details>`; }).join('') || `<p class="muted">${E(ML('هنوز نوشته‌ای ذخیره نشده است.', 'Noch keine Texte gespeichert.', 'No texts saved yet.'))}</p>`}</section>`;
  }

  function ruleLines(rule) {
    const parts = String(rule || '').split(/(?<=\.)\s+(?=[A-ZÄÖÜ„])/).filter(Boolean);
    return `<div class="rule" dir="ltr">${parts.map((p) => { const mm = p.match(/^([^:]{2,40}):\s*(.+)$/); return mm ? `<p><b>${E(mm[1])}:</b> <span class="struct">${E(mm[2])}</span></p>` : `<p>${E(p)}</p>`; }).join('')}</div>`;
  }
  function hubGrammar() {
    const gl = eng.ST().grammar || []; const gw = gl.length ? (gl[(Math.max(1, eng.weekOf(today())) - 1) % gl.length] || {}).week : null; // site grammarOfWeek
    if (ui.gramScroll !== today()) { ui.gramScroll = today(); setTimeout(() => { const el = root.querySelector('.gram-card.is-cur-week'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 150); }
    return (eng.ST().grammar || []).map((g) => `<section class="card gram-card ${g.week === gw ? 'is-cur-week' : ''}"><p class="kicker">${E(ML('گرامر هفته', 'Grammatik der Woche', 'Grammar of the week'))} ${faNum(g.week)}${g.week === gw ? ` · ${E(ML('این هفته', 'diese Woche', 'this week'))}` : ''}</p><h3 dir="ltr">${E(g.title)}</h3><p dir="rtl"><b>${E(g.fa)}</b></p>${ruleLines(g.rule)}<ul dir="ltr">${(g.forms || []).map((f) => `<li>${E(f)}</li>`).join('')}</ul><p class="muted small" dir="rtl">⚠️ ${E(g.mistakes)}</p></section>`).join('');
  }

  /* BATCH2 «الگوهای معروف»: ready answer patterns per skill + the Sprechen task types */
  function hubMuster() {
    const blk = (title, fa, lines) => `<section class="card"><h3 dir="auto">${E(title)}</h3><p class="muted small" dir="rtl">${E(fa)}</p><div class="muster" dir="ltr">${lines.map(([k, v]) => `<p><b>${E(k)}</b> ${E(v)}</p>`).join('')}</div></section>`;
    const st = eng.ST();
    return `<p class="muted small" dir="${dir()}">${E(ML('الگوهای آماده برای جواب دادن؛ جای خالی‌ها را با موضوع تمرین خودت پر کن.', 'Fertige Antwortmuster; fülle die Lücken mit deinem Thema.', 'Ready answer patterns; fill the gaps with your topic.'))}</p>`
      + blk('Hören · Thema, Problem, Ziel', 'برای «فهم کلی» یک گفت‌وگو یا پادکست: سه جمله کامل بنویس.', [
        ['Thema:', 'Mehrsprachigkeit im Kindesalter und ihre Auswirkungen auf kognitive Entwicklung und gesellschaftliche Integration.'],
        ['Problem:', 'Viele Eltern und Bildungseinrichtungen unterschätzen die Notwendigkeit gezielter Förderung, wodurch potenzielle Nachteile entstehen können.'],
        ['Ziel:', 'Die Sprecher wollen die Vorteile aufzeigen, kritische Aspekte beleuchten und Handlungsempfehlungen für Eltern und Politik geben.'],
        ['Muster:', 'In dem Beitrag geht es um … · Das zentrale Problem besteht darin, dass … · Ziel der Sprecher ist es, … aufzuzeigen / zu erklären / zu kritisieren.']])
      + blk('Hören · Sprecher und Meinungen', 'وقتی چند نفر صحبت می‌کنند: موضع هر نفر را با دلیلش جدا کن.', [
        ['Sprecher A:', 'Frau Weber vertritt die Ansicht, dass …, weil …'],
        ['Sprecher B:', 'Herr Kraus hält dagegen, dass …, und begründet das mit …'],
        ['Fazit:', 'Beide sind sich einig, dass …, unterscheiden sich aber darin, ob …']])
      + blk('Lesen · Hauptaussage je Absatz', 'برای هر پاراگراف یک جمله با فعل اصلی متن بساز.', [
        ['Absatz 1:', 'Der Autor führt in das Thema … ein und zeigt, dass …'],
        ['Absatz 2:', 'Anschließend werden Gründe für … genannt, vor allem …'],
        ['Absatz 3:', 'Danach stellt der Text Gegenargumente vor: …'],
        ['Absicht:', 'Der Autor möchte die Leser davon überzeugen, dass … / warnt davor, dass …']])
      + blk('Schreiben · Argumentation', 'اسکلت چهار بخشی متن استدلالی (۲۳۰ تا ۲۸۰ کلمه).', [
        ['Einleitung:', 'In letzter Zeit wird immer häufiger darüber diskutiert, ob … Diese Frage betrifft vor allem …'],
        ['These:', 'Befürworter argumentieren, dass … Dafür spricht vor allem, dass … Ein gutes Beispiel dafür ist …'],
        ['Gegenargument:', 'Kritiker wenden jedoch ein, dass … Dieser Einwand ist insofern berechtigt, als …'],
        ['Meinung:', 'Meiner Ansicht nach überwiegen die Vorteile, denn … In meinem Heimatland beobachte ich, dass …'],
        ['Schluss:', 'Zusammenfassend lässt sich sagen, dass … Es wäre daher sinnvoll, …']])
      + blk('Schreiben · Grafik beschreiben', 'توصیف نمودار: منبع، بالاترین/پایین‌ترین، روند، مقایسه، نتیجه.', [
        ['Einleitung:', 'Die Grafik zeigt …, und zwar im Zeitraum von … bis … Die Angaben stammen von …'],
        ['Höchstwert:', 'Den höchsten Anteil hat … mit … Prozent, gefolgt von …'],
        ['Entwicklung:', 'Zwischen … und … ist der Wert deutlich gestiegen / leicht gesunken / nahezu gleich geblieben.'],
        ['Vergleich:', 'Im Vergleich zu … ist der Anteil fast doppelt so hoch.'],
        ['Text + Grafik:', 'Der Text ergänzt, dass … Das erklärt, warum …']])
      + blk('Sprechen · Rat geben', 'نمونه شروع و جمع‌بندی برای توصیه دادن.', [
        ['Einstieg:', 'Ich verstehe gut, dass dich … beschäftigt.'],
        ['Rat:', 'An deiner Stelle würde ich … Außerdem könntest du …, denn …'],
        ['Abschluss:', 'Am wichtigsten finde ich aber, dass du … Ich drücke dir die Daumen!']])
      + blk('Sprechen · Thema präsentieren', 'ساختار ارائه: مقدمه، سه نکته، جمع‌بندی.', [
        ['Einleitung:', 'In meinem Kurzvortrag möchte ich über … sprechen. Zuerst …, dann …, zum Schluss …'],
        ['Hauptteil:', 'Der erste Aspekt ist … Ein zweiter wichtiger Punkt ist … Schließlich sollte man bedenken, dass …'],
        ['Schluss:', 'Zusammenfassend lässt sich festhalten, dass … Vielen Dank für Ihre Aufmerksamkeit.']])
      + `<section class="card"><h3>${E(ML('انواع تمرین Sprechen در آزمون', 'Sprechaufgaben', 'Speaking task types'))}</h3><div class="types">${Object.values(st.speakingTypes || {}).map((t) => `<article><b dir="ltr">${E(t.label)}</b><p dir="${dir()}"><b>${E(t.fa)}:</b> ${E(t.how)}</p><p dir="ltr" class="muted small">${E((t.phrases || []).join(' · '))}</p></article>`).join('')}</div></section>`;
  }

  function hubMethod() {
    const st = eng.ST();
    return `<section class="card"><h3>${E(ML('هدف و چارچوب کلی', 'Ziel und Rahmen', 'Goal and frame'))}</h3><ul dir="rtl"><li>هدف اصلی: کسب حداقل TDN 4 در هر چهار مهارت</li><li>مدت مطالعه روزانه: ۴ ساعت مفید · ۶ روز تمرین در هفته</li><li>روز هفتم (جمعه): ارزیابی و تحلیل عملکرد</li></ul></section>`
      + Object.entries(st.methods || {}).filter(([key]) => !['wortschatz', 'wiederholung'].includes(key)).map(([, x]) => `<section class="card"><h3 dir="ltr">${E(String(x.title).split('·')[0])}</h3><div dir="${dir()}"><p><b>${E(x.title)}</b></p><p>${E(x.goal)}</p><ol>${(x.steps || []).map((s) => `<li>${E(s)}</li>`).join('')}</ol>${x.rule ? `<p class="muted">💡 ${E(x.rule)}</p>` : ''}</div></section>`).join('')
      + `<section class="card"><h3>${E(ML('قوانین اصلی سیستم مطالعاتی', 'Grundregeln', 'Ground rules'))}</h3><ol dir="${dir()}">${(st.rules || []).map((r) => `<li>${E(r)}</li>`).join('')}</ol><p><b>${E(st.success)}</b></p></section>`
      + `<section class="card"><h3>${E(ML('منابع مطالعاتی', 'Quellen', 'Resources'))}</h3><table class="tbl"><tbody>${(st.resources || []).map(([a, b]) => `<tr><td>${E(a)}</td><td dir="rtl">${E(b)}</td></tr>`).join('')}</tbody></table><p><button type="button" class="btn btn-ghost" data-ext="${E(st.officialUrl)}">${E(ML('منبع رسمی: آمادگی آزمون', 'Offizielle Prüfungsvorbereitung', 'Official exam preparation'))} ↗</button></p></section>`;
  }

  function hubView() {
    const lean = eng.lean();
    const ids = ['woche', 'proben', 'muster', 'grammatik', 'methode'].filter((x) => !(lean && x === 'proben'));
    const tab = ids.includes(eng.V.hubTab) ? eng.V.hubTab : 'woche';
    const names = { woche: ML('برنامه هفته', 'Wochenplan', 'Weekly plan'), proben: ML('نمونه نوشته‌ها', 'Schreibproben', 'Writing samples'), muster: ML('الگوهای معروف', 'Bekannte Muster', 'Famous patterns'), grammatik: ML('گرامر هفته‌ها', 'Grammatik', 'Grammar'), methode: ML('روش و قوانین', 'Methode', 'Method') };
    const body = tab === 'woche' ? hubWeek() : tab === 'proben' ? hubProben() : tab === 'muster' ? hubMuster() : tab === 'grammatik' ? hubGrammar() : hubMethod();
    return `<header class="page-hero"><div class="page-hero-main"><button type="button" class="btn" data-act="to-plan">← ${E(ML('برنامه یادگیری', 'Lernplan', 'Learning plan'))}</button><div><h1>${E(ML('تنظیم برنامه', 'Planeinstellungen', 'Plan settings'))}</h1><small>${E(ML('یک برنامه برای همه؛ آزمون TestDaF یا ÖSD را در «شبیه‌سازی آزمون» تمرین کنید', 'Ein Plan für alle – TestDaF und ÖSD üben Sie in der Prüfungssimulation', 'One plan for everyone – practise TestDaF or ÖSD in the exam simulation'))}</small></div></div></header>
      <nav class="nb-tabs hub-tabs" role="tablist">${ids.map((id) => `<button type="button" role="tab" aria-selected="${tab === id}" data-hub="${id}" class="${tab === id ? 'is-on' : ''}">${E(names[id])}</button>`).join('')}</nav>${body}`;
  }

  /* ───────────── actions ───────────── */
  async function generate() {
    draw();
    try { await eng.generatePlan(); } catch (error) { toast(ML('ساخت تمرین‌های برنامه انجام نشد؛ دوباره تلاش کنید.', 'Die Übungen konnten nicht vorbereitet werden. Bitte versuche es erneut.', 'The plan exercises could not be prepared. Please try again.'), 'warn'); console.warn(error); }
    draw();
  }

  function onboardNext() {
    const u = eng.S.user; ui.error = '';
    const val = (id) => root.querySelector('#' + id)?.value;
    if (ui.onboardStep === 0) { u.name = (val('obName') || '').trim(); u.nativeLanguage = val('obLang') || 'fa'; if (!u.name) { ui.error = ML('لطفاً نام خود را بنویسید.', 'Bitte gib deinen Namen ein.', 'Please enter your name.'); draw(); return; } }
    if (ui.onboardStep === 1 && !u.level) { ui.error = ML('لطفاً سطح خود را انتخاب کنید.', 'Bitte wähle dein Niveau.', 'Please choose your level.'); draw(); return; }
    if (ui.onboardStep === 2) {
      const v = val('obExam') || u.examDate || '';
      if (!v && !ui.noExam) { ui.error = ML('تاریخ آزمون را انتخاب کنید یا «نمی‌دانم» را بزنید.', 'Wähle ein Datum oder „Ich kenne den Termin noch nicht“.', 'Pick a date or choose “I don’t know yet”.'); draw(); return; }
      if (v && !(v > today())) { ui.error = ML('تاریخ آزمون باید در آینده باشد.', 'Das Prüfungsdatum muss in der Zukunft liegen.', 'The exam date must be in the future.'); draw(); return; }
      u.examDate = v;
    }
    if (ui.onboardStep === 3) u.dailyMinutes = Number(val('obMin')) || 60;
    if (ui.onboardStep === 4) {
      u.learningGoal = (val('obGoal') || '').trim();
      u.profileCompleted = true;
      eng.ensureDailyStudyPreference(true);
      eng.save();
      eng.syncProfile();
      ui.view = 'plan'; ui.onboardStep = 0;
      generate();
      return;
    }
    ui.onboardStep += 1;
    eng.save();
    draw();
  }

  root.addEventListener('click', async (event) => {
    if (ui.view === 'activity' && (await mods.click(event))) return;
    if (fs.dispatch(event)) return;
    if (event.target.closest('[data-gd-open]')) { gd.open(); return; }
    const el = event.target.closest('button, [data-start], [data-review]');
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.program) {
      const r = eng.selectExamPlan(d.program);
      if (r === 'onboarding') { ui.view = 'onboarding'; ui.onboardStep = 0; draw(); }
      else { ui.view = 'plan'; if (r === 'generate') generate(); else draw(); }
    } else if (d.ob === 'next') onboardNext();
    else if (d.ob === 'back') { ui.error = ''; if (ui.onboardStep) ui.onboardStep -= 1; draw(); }
    else if (d.ob === 'noexam') { eng.S.user.examDate = ''; ui.noExam = true; ui.onboardStep = 3; ui.error = ''; draw(); }
    else if (d.level) { eng.S.user.level = d.level; draw(); }
    else if (d.skill) { const list = eng.S.user.weakSkills; const at = list.indexOf(d.skill); if (at >= 0) list.splice(at, 1); else list.push(d.skill); draw(); }
    else if (d.mode) { const r = eng.setStudyMode(d.mode); if (r === 'generate') generate(); else draw(); }
    else if (d.start) { if (eng.startActivity(d.start)) { ui.view = 'activity'; draw(); ctx.scrollTop?.(); } }
    else if (d.review) { if (eng.review(d.review)) { ui.view = 'activity'; draw(); } }
    else if (d.hub) { eng.V.hubTab = d.hub; ui.view = 'hub'; draw(); }
    else if (d.wtab) { eng.V.weekTab = d.wtab; draw(); }
    else if (d.daily) { eng.setDaily(Number(d.daily)); draw(); }
    else if (d.extra) { eng.setExtra(Number(d.extra)); draw(); }
    else if (d.oesdLevel) { eng.setOesdLevel(d.oesdLevel).then((r) => { if (r === 'next') toast(ML('سطح جدید از فردا اعمال می‌شود.', 'Das neue Niveau gilt ab morgen.', 'The new level applies from tomorrow.'), 'ok'); draw(); }); }
    else if (d.phase) { const p = Number(d.phase); if (p !== eng.M().phase && await confirmDialog(ML(`فاز برنامه به ${faNum(p)} تغییر کند؟`, `Zu Phase ${p} wechseln?`, `Switch to phase ${p}?`), { ok: ML('تغییر', 'Wechseln', 'Switch'), danger: false })) { eng.setPhase(p); draw(); } }
    else if (d.focus) { const [wd, skill] = d.focus.split(':'); eng.setWeekFocus(Number(wd), skill); draw(); }
    else if (d.focusReset) { eng.resetWeekFocus(Number(d.focusReset)); draw(); }
    else if (d.wdReset) { eng.resetWeekDay(Number(d.wdReset)); draw(); }
    else if (d.orderReset) { eng.resetWeekOrder(Number(d.orderReset)); draw(); }
    else if (d.minReset) { eng.resetWeekMin(Number(d.minReset)); draw(); }
    else if (d.wdMinedit) { editMinutes(event.target.closest('[data-wd-minedit]')); }
    else if (d.move) { const [id, dirn] = d.move.split(':'); eng.moveDayActivity(id, Number(dirn)); draw(); }
    else if (d.go !== undefined) { eng.go(Number(d.go)); draw(); }
    else if (d.ext) ctx.bridge.openExternal(d.ext);
    else if (d.packLoad) {
      const packs = ctx.ownerPacks; if (!packs) return;
      const ok = await confirmDialog(ML('اجرای فعلی با این پک بارگذاری شود؟ تمرین‌ها و پاسخ‌های امروز جایگزین می‌شوند.', 'Diesen Pack in den aktuellen Durchlauf laden? Die heutigen Übungen und Antworten werden ersetzt.', 'Load this pack into the current run? Today’s exercises and answers are replaced.'), { ok: ML('بارگذاری', 'Laden', 'Load'), danger: false });
      if (!ok) return;
      try {
        await packs.load(d.packLoad);
        ui.view = 'plan';
        draw();
        toast(ML('پک در اجرای برنامه بارگذاری شد.', 'Der Pack wurde in den Durchlauf geladen.', 'The pack was loaded into the run.'), 'ok');
      } catch (error) { toast(String(error?.message || error), 'warn'); }
    }
    else if (d.packDownload) {
      const packs = ctx.ownerPacks; if (!packs) return;
      try {
        const file = await packs.download(d.packDownload);
        if (file) toast(ML('پک روی کامپیوتر ذخیره شد.', 'The pack was saved to this computer.', 'Der Pack wurde auf diesem Computer gespeichert.') + ' ' + file, 'ok');
      } catch (error) { toast(String(error?.message || error), 'warn'); }
    }
    else if (d.packDel) {
      const packs = ctx.ownerPacks; if (!packs) return;
      if (!(await confirmDialog(ML('این پک ثبت‌شده حذف شود؟', 'Delete this stored pack?', 'Diesen gespeicherten Pack löschen?')))) return;
      try { await packs.remove(d.packDel); draw(); } catch (error) { toast(String(error?.message || error), 'warn'); }
    }
    else {
      switch (d.act) {
        case 'pause': mods.leave(); eng.pauseActivity(); ui.view = 'plan'; draw(); break;
        case 'to-plan': ui.view = 'plan'; draw(); break;
        case 'start-next': if (eng.startNext()) { ui.view = 'activity'; draw(); } break;
        case 'progress': ctx.navigate('history'); break;
        case 'owner-packs': ui.view = 'packs'; draw(); break;
        case 'packs-refresh': if (ctx.ownerPacks) { ctx.ownerPacks.state.list = null; draw(); } break;
        case 'pack-import': {
          const packs = ctx.ownerPacks; if (!packs) break;
          try {
            const saved = await packs.importFromFile();
            if (saved) { ctx.ownerPacks.state.list = null; toast(ML('پک از فایل اضافه شد.', 'The pack was added from the file.', 'Der Pack wurde aus der Datei hinzugefügt.'), 'ok'); }
            draw();
          } catch (error) { toast(String(error?.message || error), 'warn'); }
          break;
        }
        case 'packs-back': ui.view = 'plan'; draw(); break;
        case 'deck': ctx.navigate('errorbook'); break;
        case 'account': ctx.navigate('settings'); break;
        case 'order-reset': eng.resetDayOrder(); draw(); break;
        case 'change-program': ctx.navigate('testdafSim'); break; // UNIFIED-PLAN
        case 'renew': {
          let q = ML('روز جاری با همهٔ پاسخ‌ها ثبت می‌شود و شش تمرین با مطالب تازه جایگزین می‌شوند. ادامه می‌دهید؟', 'Der heutige Tag wird mit allen Antworten gespeichert und die sechs Übungen werden durch neues Material ersetzt. Fortfahren?', 'The current day is saved with all answers and the six exercises are replaced with fresh material. Continue?');
          const info = eng.dashboard();
          if (!info.renewExempt) q += ML(` (امروز ${faNum(info.renewRemaining)} از ۳ بار باقی مانده)`, ` (heute noch ${info.renewRemaining} von 3 Erneuerungen)`, ` (${info.renewRemaining} of 3 renewals left today)`);
          if (!(await confirmDialog(q, { ok: ML('ثبت و تمرین تازه', 'Speichern & erneuern', 'Save & renew'), danger: false }))) return;
          const r = await eng.renewDay('manual-renew');
          if (r === 'limit') toast(ML('سقف ۳ بار «ثبت نتیجه و تمرین تازه» در روز برای این حساب پر شده است؛ فردا دوباره فعال می‌شود.', 'Das Tageslimit von 3 Erneuerungen ist erreicht; morgen wieder verfügbar.', 'The daily limit of 3 renewals is used up; it resets tomorrow.'), 'warn');
          draw();
          break;
        }
        case 'site': eng.stopTimers(); ctx.switchToSite('dashboard'); break;
        default:
      }
    }
  });
  /* DRAG-SWAP drag (site 2026-11-20): dropped on another exercise of the same day = swap; anywhere else = nearest slot */
  let wdDrag = null;
  const wdClear = () => root.querySelectorAll('.wd-list li.is-over,.wd-list.is-gap').forEach((x) => x.classList.remove('is-over', 'is-gap'));
  const wdList = (wd) => root.querySelector(`.wd-list[data-wd-list="${wd}"]`);
  root.addEventListener('dragstart', (event) => { const li = event.target.closest && event.target.closest('[data-wd-skill]'); if (!li) return; const [wd, id] = li.dataset.wdSkill.split(':'); wdDrag = { wd, id }; try { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); } catch (e) { /* ignore */ } });
  root.addEventListener('dragover', (event) => {
    if (!wdDrag) return; event.preventDefault(); try { event.dataTransfer.dropEffect = 'move'; } catch (e) { /* ignore */ }
    const list = wdList(wdDrag.wd); const li = event.target.closest && event.target.closest('[data-wd-skill]'); wdClear(); if (!list) return;
    if (li && list.contains(li) && li.dataset.wdSkill.split(':')[1] !== wdDrag.id) li.classList.add('is-over'); else list.classList.add('is-gap');
  });
  root.addEventListener('drop', (event) => {
    const d = wdDrag; if (!d) return; event.preventDefault(); wdDrag = null; wdClear();
    const list = wdList(d.wd); if (!list) return;
    const els = [...list.querySelectorAll('li[data-wd-skill]')]; const ids = els.map((x) => x.dataset.wdSkill.split(':')[1]); const from = ids.indexOf(d.id); if (from < 0) return;
    const li = event.target.closest && event.target.closest('[data-wd-skill]'); let next = ids.slice();
    if (li && list.contains(li) && li.dataset.wdSkill.split(':')[1] !== d.id) { const to = ids.indexOf(li.dataset.wdSkill.split(':')[1]); next[from] = ids[to]; next[to] = d.id; }
    else { const rest = els.filter((x) => x.dataset.wdSkill.split(':')[1] !== d.id); const at = rest.filter((x) => { const r = x.getBoundingClientRect(); return r.top + r.height / 2 < event.clientY; }).length; next = rest.map((x) => x.dataset.wdSkill.split(':')[1]); next.splice(at, 0, d.id); }
    if (next.join() !== ids.join()) { eng.setWeekOrder(Number(d.wd), next); draw(); }
  });
  root.addEventListener('dragend', () => { wdDrag = null; wdClear(); });
  /* MIN-EDIT: a click on the minutes opens a small field (Enter / click away = save, Esc = cancel) */
  function editMinutes(btn) {
    if (!btn) return; const [wd, id] = btn.dataset.wdMinedit.split(':'); const v = Number(btn.dataset.v) || 0; const li = btn.closest('li');
    const inp = document.createElement('input'); inp.type = 'number'; inp.min = '5'; inp.max = '240'; inp.step = '5'; inp.value = String(v); inp.className = 'wd-mininp'; inp.setAttribute('dir', 'ltr');
    if (li) li.draggable = false; btn.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const commit = (ok) => { if (done) return; done = true; const n = Number(inp.value); if (ok && Number.isFinite(n) && n > 0 && n !== v) eng.setWeekMin(Number(wd), id, n); draw(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); commit(false); } });
    inp.addEventListener('blur', () => commit(true));
  }
  root.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-start], [data-review]');
    if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); card.click(); }
  });
  root.addEventListener('input', (event) => {
    if (ui.view === 'activity' && mods.input(event)) return;
    if (event.target.id === 'obMin') root.querySelector('#obMinV').textContent = `${Number(event.target.value) / 60} h`;
  });
  root.addEventListener('change', (event) => {
    if (ui.view === 'activity' && mods.change(event)) return;
    if (event.target.matches('[data-exam]')) { eng.setExamDate(event.target.value); draw(); }
  });

  // live clocks while an activity is open
  const offTick = eng.subscribe((what) => {
    if (!root.isConnected) return;
    if (what && what.tick && ui.view === 'activity') {
      const clock = root.querySelector('#stepClock'); const bar = root.querySelector('#stepBar'); const total = root.querySelector('#actTotal');
      if (clock) clock.textContent = `${mmss(what.used)} / ${mmss(what.limit)}`;
      if (bar) { bar.style.width = Math.min(100, (what.used / what.limit) * 100) + '%'; bar.classList.toggle('is-over', what.used > what.limit); }
      if (total) total.textContent = timeStr(what.total);
      mods.tick(what);
    } else if (what === 'remote' && ui.view !== 'activity') draw();
  });
  root.onLeave = () => { fs.close(); gd.close(); offTick(); mods.leave(); if (eng.V.screen === 'activity') eng.pauseActivity(); };
  root.onStoreChange = (paths) => {
    if (ui.view === 'activity') return;
    if (paths.some((p) => p === '*' || p === 'uiLanguage')) draw();
  };
  root.onKey = (event) => {
    if (ui.view !== 'activity' || event.ctrlKey || event.altKey || (event.target.matches && event.target.matches('input, textarea, select'))) return false;
    const w = eng.work(); const steps = eng.stepsFor(eng.act().id, eng.curDay().mode, eng.curDay());
    if (event.key === 'PageDown') { eng.go(Math.min(steps.length - 1, (w.step || 0) + 1)); draw(); return true; }
    if (event.key === 'PageUp') { eng.go(Math.max(0, (w.step || 0) - 1)); draw(); return true; }
    return false;
  };

  // Content is needed for descriptions and step timing.
  eng.ensureContent().then(() => { eng.refreshPlanDescriptions(); if (root.isConnected && ui.view !== 'activity') draw(); }).catch(() => {});
  draw();
  return root;
}
