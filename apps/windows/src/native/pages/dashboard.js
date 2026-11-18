// «اجرای برنامه» — the site's dashboard for the learning plan: program choice, onboarding, today's
// plan (mode tabs, day card, daily progress, next activity, activity list, renew), the weekly
// program (time & path, weekly focus, today's order, tables, writing samples, grammar, method) and
// the activity frame (steps, step clock, active-time timer). Module contents come in rounds 3b–3d.

import { esc, toast } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import { today, addDays } from '../core/learning.js';
import { MODS, ML, faNum, mmss, timeStr, wdOf, satOf, DAY_DEF, DAILY_CHOICES, EXTRA_CHOICES, BASE, planName, topicLabel } from '../core/engine.js';
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
    if (!eng.program()) { if (ui.view !== 'onboarding') ui.view = 'programs'; }
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
    const k = S.plan?.date || today(); const m = eng.M(); const def = eng.dayDef(k); const wk = eng.weekOf(k); const ph = eng.ST().phases[m.phase] || eng.ST().phases[1];
    const due = eng.srsDueCount();
    const sub = ML(def.sfa, def.sde) + (!def.evaluation && def.focus.length && def.focus.length < 4 && eng.dailyMin() >= 120 ? ' · ' + ML('همه مهارت‌ها امروز تمرین می‌شوند و زمان بیشتری به مهارت‌های تمرکز داده شده است.', 'Alle Fertigkeiten werden geübt; die Schwerpunkte bekommen mehr Zeit.', 'All skills are practised; the focus skills get more time.') : '') + (wk === 0 ? ' — ' + ML('امروز با یک ارزیابی اولیه وضعیت فعلی هر چهار مهارت ثبت می‌شود.', 'Heute wird der Ausgangsstand in allen vier Fertigkeiten erfasst.', "Today records your starting level in all four skills.") : '');
    return `<article class="card day-card"><div class="chips"><span class="chip is-on">${E(wk === 0 ? ML('روز تشخیص سطح', 'Diagnosetag', 'Diagnosis day') : `${ML('هفته', 'Woche', 'Week')} ${faNum(wk)}`)}</span><span class="chip">${E(String(ph.name).split('·')[0].trim())}</span><span class="chip">${E(ML(def.fa, def.de))}</span></div>
      <h3>${E(eng.focusLabel(def))}</h3><p class="muted">${E(sub)}</p>
      <div class="row-actions"><button type="button" class="btn" data-hub="woche">🗓 ${E(ML('برنامه هفته', 'Wochenplan', 'Weekly plan'))}</button><button type="button" class="btn" data-act="progress">📈 ${E(ML('پیشرفت', 'Fortschritt', 'Progress'))}</button><button type="button" class="btn" data-act="deck">🗂 ${E(ML('دفتر عبارات', 'Wortschatz', 'Vocabulary'))}${due ? ` <b class="nb-due">${faNum(due)}</b>` : ''}</button><button type="button" class="btn" data-hub="methode">📘 ${E(ML('روش و قوانین', 'Methode', 'Method'))}</button></div></article>`;
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
    const list = S.plan.activities.map((a, idx) => {
      const done = info.completed.has(a.id); const isNext = next && next.id === a.id; const trk = Number(info.timers[a.id]) || 0;
      const pct = done ? 100 : Math.min(95, Math.round((trk / Math.max(1, a.dur * 60)) * 100));
      return `<article class="act-card ${done ? 'is-done' : ''} ${isNext ? 'is-next' : ''}" style="--c:${MODS[a.id]?.color || 'var(--accent)'}" data-${done ? 'review' : 'start'}="${E(a.id)}" role="button" tabindex="0">
        <span class="act-icon">${done ? '✓' : ICON[a.icon] || '•'}</span><div class="act-main"><div class="act-title"><span class="act-step">${faNum(idx + 1)}</span><h3>${E(a.title)}</h3>${a.priority === 'high' ? '<span class="act-high">!</span>' : ''}${done ? `<span class="chip small">👁 ${E(ML('مشاهده پاسخ‌ها', 'Antworten ansehen', 'View answers'))}</span>` : ''}</div><p class="muted small">${E(a.desc)}</p><div class="act-bar"><i style="width:${pct}%"></i></div></div>
        <div class="act-side"><b>${faNum(a.dur)}m</b>${trk ? `<small dir="ltr">${timeStr(trk)}</small>` : ''}</div></article>`;
    }).join('');
    return hero + modeTabs(info) + oesdSettings() + dayCard() + progressCard(info) + nextCard
      + `<section class="act-section"><div class="act-head"><h2>📋 ${E(ML('برنامه یادگیری', 'Lernplan', 'Learning plan'))} · ${E(ML(`برنامه روزانه ${faNum(info.dailyMin)} دقیقه`, `Tagesplan ${info.dailyMin} Min.`, `Daily plan ${info.dailyMin} min`))}</h2><div class="row-actions"><button type="button" class="btn btn-ghost" data-hub="woche">${E(ML('برنامه هفته', 'Wochenplan', 'Weekly program'))} ↗</button>${next ? `<button type="button" class="btn btn-primary" data-act="start-next">${E(ML('شروع تمرین', 'Übung starten', 'Start practice'))} ▶</button>` : ''}</div></div><div class="act-grid">${list}</div></section>`
      + `<section class="card day-end"><div><h3>${E(ML('اتمام تمرین و ثبت نتیجه', 'Übung abschließen & speichern', 'Finish & save the day'))}</h3><p class="muted small">${E(ML('تمرین‌ها و پاسخ‌های امروز از نو شروع می‌شوند. زمان مطالعه امروز حفظ می‌شود و ثبت روز خودکار در پایان روز انجام می‌شود.', 'Die heutigen Übungen und Antworten beginnen von vorn. Die Lernzeit bleibt erhalten; der Tag wird am Tagesende automatisch gespeichert.', "Today's exercises and answers start over. Study time is kept; the day is recorded automatically at the end of the day."))}</p></div>${ctx.ownerPacks && ctx.ownerPacks.isOwner() ? `<button type="button" class="btn" data-act="owner-packs">🗂 ${E(ML('افزودن دستی محتوا', 'Add content manually', 'Inhalte manuell hinzufügen'))}</button>` : ''}<button type="button" class="btn btn-primary" data-act="renew">↻ ${E(ML('ثبت نتیجه و تمرین تازه', 'Speichern & erneuern', 'Save & renew'))}</button></section>`;
  }

  /** «مطالعه آزاد» tab: mode tabs, grammar-bot entry card, games space (site free-space.js replaces the old free plan). */
  function freeView() {
    if (!eng.S.plan && !eng.V.preparing) setTimeout(() => { if (!eng.S.plan && !eng.V.preparing) generate(); }, 0);
    const info = eng.dashboard();
    return `<div class="fs-dashboard">${modeTabs(info)}${gd.entryCard()}${fs.content()}</div>`;
  }

  /* ───────────── weekly program (hub) ───────────── */
  function weekSettings() {
    const S = eng.S; const m = eng.M(); const tab = eng.V.weekTab; const k = S.plan?.date || today();
    const extra = Number(S.plan?.activities?.find((a) => a.id === 'extra')?.dur) || 0; const extraDone = (S.completed || []).includes('extra'); const extraStarted = (Number(S.activityTimers?.extra) || 0) > 0;
    const items = (eng.active() && S.plan?.activities?.every((a) => a.type === 'method') ? S.plan.activities.filter((a) => a.id !== 'extra') : eng.moduleOrder(k).map((id) => ({ id, title: MODS[id]?.de || id, dur: eng.minutesFor(k)[id] || 0 }))).filter((a) => a.id !== 'extra');
    const t = eng.dailyMin();
    const time = `<div class="daily-picker"><b>🕒 ${E(ML('زمان روزانه برنامه', 'Tägliche Planzeit', 'Daily plan time'))}</b><small class="muted">${E(ML('۲۴۰ دقیقه پیشنهاد برنامه است؛ اگر وقت کمتر یا بیشتری داری تغییرش بده.', '240 Minuten werden empfohlen; bei weniger oder mehr Zeit hier ändern.', '240 minutes is recommended; change it if you have less or more time.'))}</small>
        <div class="daily-btns" role="radiogroup">${DAILY_CHOICES.map((n) => `<button type="button" role="radio" aria-checked="${n === t}" class="${n === t ? 'is-on' : ''} ${n === BASE ? 'is-rec' : ''}" data-daily="${n}"><b>${E(lang() === 'fa' ? `${faNum(String(n / 60).replace('.', '٫'))} ساعت` : `${n / 60} h`)}</b><small>${faNum(n)}′${n === BASE ? ' · ' + E(ML('پیشنهادی', 'empfohlen', 'recommended')) : ''}</small></button>`).join('')}</div><p class="muted small">${E(eng.dailyHint())}</p></div>
      <div class="form-grid"><label class="fld"><span>${E(ML('تاریخ آزمون', 'Prüfungsdatum', 'Exam date'))}</span><input type="date" data-exam value="${E(S.user.examDate || '')}" /></label><div class="fld"><span>&nbsp;</span><button type="button" class="btn" data-act="change-program">${E(ML('تغییر نوع برنامه', 'Programm wechseln', 'Change program'))}</button></div></div>
      <div class="extra-row"><b>${E(ML('زمان اضافه امروز', 'Extrazeit heute', 'Extra time today'))}</b><p class="muted small">${E(ML('برای مرور لغت، اشتباهات و شنیدن دوباره؛ جدا از زمان اصلی برنامه است.', 'Für Wortschatz, Fehler und erneutes Hören; zusätzlich zur regulären Planzeit.', 'For words, errors and listening again; separate from the regular program time.'))}</p><div class="chips" dir="ltr">${EXTRA_CHOICES.map((n) => `<button type="button" class="chip ${n === extra ? 'is-on' : ''}" data-extra="${n}" ${!eng.active() || extraDone || (n === 0 && extraStarted) ? 'disabled' : ''}>${n ? '+' + faNum(n) : E(ML('بدون', 'Keine', 'None'))}</button>`).join('')}</div></div>
      <div class="extra-row"><b>${E(ML('مرحله یادگیری', 'Lernphase', 'Learning phase'))}</b><div class="chips">${[1, 2, 3].map((n) => `<button type="button" class="chip ${m.phase === n ? 'is-on' : ''}" data-phase="${n}">Phase ${faNum(n)}</button>`).join('')}</div></div>`;
    const focus = `<p class="muted small">${E(ML('برای هر روز یک یا دو مهارت را انتخاب کنید. زمان تمرین آن مهارت‌ها بیشتر می‌شود؛ پنجشنبه آزمون و جمعه ارزیابی هفتگی باقی می‌ماند.', 'Wähle pro Tag ein oder zwei Schwerpunkte. Diese Fertigkeiten erhalten mehr Übungszeit; Donnerstag und Freitag bleiben Prüfungs- und Auswertungstage.', 'Choose one or two focus skills per day. They receive more practice time; Thursday and Friday remain exam and review days.'))}</p>
      <div class="focus-grid">${[6, 0, 1, 2, 3].map((wd) => { const dk = Object.keys(m.days || {}).find((x) => wdOf(x) === wd) || addDays(satOf(today()), (wd + 1) % 7); const def = eng.dayDef(dk); const custom = !!m.weekFocus?.[wd]; return `<div class="focus-day"><div class="focus-head"><b>${E(ML(def.fa, def.de))}</b>${custom ? `<button type="button" class="btn btn-ghost small" data-focus-reset="${wd}">${E(ML('بازنشانی', 'Zurücksetzen', 'Reset'))}</button>` : ''}</div><div class="chips">${['hoeren', 'lesen', 'schreiben', 'sprechen'].map((id) => `<button type="button" class="chip ${def.focus.includes(id) ? 'is-on' : ''}" aria-pressed="${def.focus.includes(id)}" data-focus="${wd}:${id}">${E(ML(MODS[id].fa, MODS[id].de))}</button>`).join('')}</div></div>`; }).join('')}</div>`;
    const order = `<p class="muted small">${E(ML('ترتیب تمرین‌های امروز را تغییر دهید. زمان و پیشرفت ذخیره‌شده هر فعالیت حفظ می‌شود.', 'Ändere die Reihenfolge der heutigen Übungen. Zeit und Fortschritt bleiben erhalten.', "Reorder today's activities. Each activity keeps its saved time and progress."))}</p>
      <ol class="order-list">${items.map((a, i) => `<li><span class="act-step">${faNum(i + 1)}</span><span class="order-name">${E(ML(MODS[a.id]?.fa || a.title, MODS[a.id]?.de || a.title))}</span><small>${faNum(a.dur)}′</small><span class="row-actions"><button type="button" class="icon-btn" ${i === 0 ? 'disabled' : ''} data-move="${a.id}:-1" aria-label="${E(ML('بالا', 'Nach oben', 'Move up'))}">▲</button><button type="button" class="icon-btn" ${i === items.length - 1 ? 'disabled' : ''} data-move="${a.id}:1" aria-label="${E(ML('پایین', 'Nach unten', 'Move down'))}">▼</button></span></li>`).join('')}</ol><button type="button" class="btn btn-ghost" data-act="order-reset">${E(ML('بازگشت به ترتیب پیشنهادی', 'Empfohlene Reihenfolge wiederherstellen', 'Restore suggested order'))}</button>`;
    const tabs = [['time', ML('زمان و مسیر', 'Zeit & Weg', 'Time & path')], ['focus', ML('تمرکز هفته', 'Wochenfokus', 'Weekly focus')], ['order', ML('ترتیب امروز', 'Reihenfolge heute', "Today's order")]];
    return `<section class="card week-config"><div class="panel-head"><div><p>${E(ML('کنترل برنامه', 'PROGRAMM EINSTELLEN', 'PROGRAM SETTINGS'))}</p><h2>${E(ML('برنامه هفته را به روش خودتان بچینید', 'Gestalte deinen Wochenplan', 'Make the weekly program your own'))}</h2></div><button type="button" class="btn btn-primary" data-act="to-plan">${E(ML('اجرای برنامه ←', 'Zum Programm →', 'Run program →'))}</button></div>
      <div class="segmented">${tabs.map(([id, l]) => `<button type="button" data-wtab="${id}" class="${tab === id ? 'is-on' : ''}">${E(l)}</button>`).join('')}</div><div class="week-body">${tab === 'time' ? time : tab === 'focus' ? focus : order}</div></section>`;
  }

  function hubWeek() {
    const k = today(); const m = eng.M(); const wk = eng.weekOf(k); const [from] = eng.weekRange(Math.max(1, wk));
    const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(wk === 0 ? satOf(k) : from, n));
    const fmt = (n) => `${faNum(n)}′`;
    const rows = days.map((dk) => { const def = eng.dayDef(dk); const d = m.days[dk]; const done = d ? Object.keys(d.results || {}).filter((x) => x !== 'extra').length : 0; const foc = def.evaluation || def.focus.length === 4 ? E(eng.focusLabel(def)) : `<span class="chip small">${E(ML('تمرکز بیشتر', 'Schwerpunkt', 'More focus'))}</span> ${def.focus.map((f) => `<b dir="ltr">${E(ML(MODS[f].fa, MODS[f].de))} ${fmt(eng.minutesFor(dk)[f] || 0)}</b>`).join(' + ')}`; return `<tr class="${dk === k ? 'is-today' : ''}"><td><b>${E(ML(def.fa, def.de))}</b><small>${E(dk)}</small></td><td>${foc}</td><td>${E(ML(def.sfa, def.sde))}</td><td>${d ? `${faNum(done)}/${faNum(6)}` : dk < k ? '—' : ''}</td></tr>`; }).join('');
    const cols = [['hoeren', 'Hören'], ['lesen', 'Lesen'], ['schreiben', 'Schreiben'], ['sprechen', 'Sprechen'], ['wortschatz', 'G & W'], ['wiederholung', 'Wdh.']];
    const matrix = days.map((dk) => { const def = eng.dayDef(dk); const ev = !!def.evaluation; return `<tr class="${dk === k ? 'is-today' : ''}"><td><b>${E(ML(def.fa, def.de))}</b>${def.exam ? `<small>${E(ML('آزمون زمان‌دار', 'Prüfungsmodus', 'Exam mode'))}</small>` : ev ? `<small>${E(ML('آزمون هفتگی', 'Wochentest', 'Weekly test'))}</small>` : ''}</td>${cols.map(([id]) => { const real = ev && id === 'wortschatz' ? 'fehleranalyse' : ev && id === 'wiederholung' ? 'wochenbericht' : id; const v = eng.minutesFor(dk)[real]; const hi = !ev && !def.exam && def.focus.includes(id); return `<td class="${hi ? 'is-focus' : ''}">${v ? fmt(v) : '—'}${real !== id ? `<small dir="ltr">${E(MODS[real].de)}</small>` : ''}</td>`; }).join('')}</tr>`; }).join('');
    const st = eng.ST();
    return oesdSettings() + weekSettings()
      + `<section class="card"><h3>${E(ML('برنامه هفتگی', 'Wochenplan', 'Weekly plan'))} · ${E(wk === 0 ? ML('روز تشخیص', 'Diagnose', 'Diagnosis') : ML('هفته', 'Woche', 'Week') + ' ' + faNum(wk))}</h3><p class="muted small">${E(eng.dailyMin() >= 120 ? ML(`هر روز هر چهار مهارت تمرین می‌شوند؛ مهارت‌های «تمرکز بیشتر» آن روز زمان بیشتری از ${faNum(eng.dailyMin())} دقیقه را می‌گیرند.`, `Jeden Tag werden alle vier Fertigkeiten geübt; die Schwerpunkte bekommen mehr von den ${eng.dailyMin()} Minuten.`, `All four skills are practised every day; the focus skills get more of the ${eng.dailyMin()} minutes.`) : eng.dailyHint())}</p><div class="table-wrap"><table class="tbl"><thead><tr><th>${E(ML('روز', 'Tag', 'Day'))}</th><th>${E(ML('تمرکز بیشتر', 'Schwerpunkt', 'More focus'))}</th><th>${E(ML('تمرین ویژه', 'Spezial', 'Special'))}</th><th>✓</th></tr></thead><tbody>${rows}</tbody></table></div></section>`
      + `<section class="card"><h3>${E(ML(`تقسیم زمان هر روز · ${faNum(eng.dailyMin())} دقیقه مفید`, `Zeitverteilung pro Tag · ${eng.dailyMin()} Minuten`, `Time per day · ${eng.dailyMin()} minutes`))}</h3><div class="table-wrap"><table class="tbl tbl-min"><thead><tr><th>${E(ML('روز', 'Tag', 'Day'))}</th>${cols.map(([, l]) => `<th dir="ltr">${E(l)}</th>`).join('')}</tr></thead><tbody>${matrix}</tbody></table></div></section>`
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
  const hubGrammar = () => (eng.ST().grammar || []).map((g) => `<section class="card gram-card"><p class="kicker">${E(ML('گرامر هفته', 'Grammatik der Woche', 'Grammar of the week'))} ${faNum(g.week)}</p><h3 dir="ltr">${E(g.title)}</h3><p dir="rtl"><b>${E(g.fa)}</b></p>${ruleLines(g.rule)}<ul dir="ltr">${(g.forms || []).map((f) => `<li>${E(f)}</li>`).join('')}</ul><p class="muted small" dir="rtl">⚠️ ${E(g.mistakes)}</p></section>`).join('');

  function hubMethod() {
    const st = eng.ST();
    return `<section class="card"><h3>${E(ML('هدف و چارچوب کلی', 'Ziel und Rahmen', 'Goal and frame'))}</h3><ul dir="rtl"><li>هدف اصلی: کسب حداقل TDN 4 در هر چهار مهارت</li><li>مدت مطالعه روزانه: ۴ ساعت مفید · ۶ روز تمرین در هفته</li><li>روز هفتم (جمعه): ارزیابی و تحلیل عملکرد</li></ul></section>`
      + Object.values(st.methods || {}).map((x) => `<section class="card"><h3 dir="ltr">${E(String(x.title).split('·')[0])}</h3><div dir="${dir()}"><p><b>${E(x.title)}</b></p><p>${E(x.goal)}</p><ol>${(x.steps || []).map((s) => `<li>${E(s)}</li>`).join('')}</ol>${x.rule ? `<p class="muted">💡 ${E(x.rule)}</p>` : ''}</div></section>`).join('')
      + `<section class="card"><h3>${E(ML('انواع تمرین Sprechen در آزمون', 'Sprechaufgaben', 'Speaking task types'))}</h3><div class="types">${Object.values(st.speakingTypes || {}).map((t) => `<article><b dir="ltr">${E(t.label)}</b><p dir="${dir()}"><b>${E(t.fa)}:</b> ${E(t.how)}</p><p dir="ltr" class="muted small">${E((t.phrases || []).join(' · '))}</p></article>`).join('')}</div></section>`
      + `<section class="card"><h3>${E(ML('قوانین اصلی سیستم مطالعاتی', 'Grundregeln', 'Ground rules'))}</h3><ol dir="${dir()}">${(st.rules || []).map((r) => `<li>${E(r)}</li>`).join('')}</ol><p><b>${E(st.success)}</b></p></section>`
      + `<section class="card"><h3>${E(ML('منابع مطالعاتی', 'Quellen', 'Resources'))}</h3><table class="tbl"><tbody>${(st.resources || []).map(([a, b]) => `<tr><td>${E(a)}</td><td dir="rtl">${E(b)}</td></tr>`).join('')}</tbody></table><p><button type="button" class="btn btn-ghost" data-ext="${E(st.officialUrl)}">${E(ML('منبع رسمی: آمادگی آزمون', 'Offizielle Prüfungsvorbereitung', 'Official exam preparation'))} ↗</button></p></section>`;
  }

  function hubView() {
    const tab = ['woche', 'proben', 'grammatik', 'methode'].includes(eng.V.hubTab) ? eng.V.hubTab : 'woche';
    const m = eng.M(); const ph = eng.ST().phases[m.phase] || eng.ST().phases[1];
    const tabs = [['woche', ML('برنامه هفته', 'Wochenplan', 'Weekly plan')], ['proben', ML('نمونه نوشته‌ها', 'Schreibproben', 'Writing samples')], ['grammatik', ML('گرامر هفته‌ها', 'Grammatik', 'Grammar')], ['methode', ML('روش و قوانین', 'Methode', 'Method')]];
    const body = tab === 'woche' ? hubWeek() : tab === 'proben' ? hubProben() : tab === 'grammatik' ? hubGrammar() : hubMethod();
    return `<header class="page-hero"><div class="page-hero-main"><button type="button" class="btn" data-act="to-plan">← ${E(planName(EXAM_PLANS[eng.S.user.examPlan]?.name || 'Lernplan'))}</button><div><h1>${E(ML('سیستم تمرین روزانه', 'Trainingssystem', 'Training system'))}</h1><small>${E(ph.name)} · ${E(ML('هدف: حداقل TDN 4 در هر چهار مهارت', 'Ziel: TDN 4 in allen Teilen', 'Goal: TDN 4 in all four parts'))}</small></div></div></header>
      <nav class="segmented hub-tabs">${tabs.map(([id, l]) => `<button type="button" data-hub="${id}" class="${tab === id ? 'is-on' : ''}">${E(l)}</button>`).join('')}</nav>${body}`;
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
        case 'packs-back': ui.view = 'plan'; draw(); break;
        case 'deck': ctx.navigate('errorbook'); break;
        case 'account': ctx.navigate('settings'); break;
        case 'order-reset': eng.resetDayOrder(); draw(); break;
        case 'change-program':
          if (await confirmDialog(ML('برنامه فعلی بسته می‌شود و برنامه جدید را انتخاب می‌کنید. ادامه می‌دهید؟', 'Der aktuelle Plan wird geschlossen und du wählst ein neues Programm. Fortfahren?', 'The current plan is closed and you choose a new program. Continue?'), { ok: ML('ادامه', 'Weiter', 'Continue'), danger: false })) { eng.requestPlanChange(); ui.view = 'programs'; draw(); }
          break;
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
