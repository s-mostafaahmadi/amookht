/* Amookht weekly settings for plans outside the TestDaF / ÖSD method. */
(() => {
  'use strict';
  const copy = {
    fa: {
      eyebrow: 'برنامه هفته', title: 'تنظیمات برنامه یادگیری',
      intro: 'زمان، موضوع، هدف و ترتیب فعالیت‌ها را اینجا تغییر دهید. تغییرها ذخیره می‌شوند و صفحه اجرا برای شروع سریع تمرین خلوت می‌ماند.',
      back: 'بازگشت به اجرای برنامه', program: 'برنامه انتخابی', change: 'تغییر برنامه',
      time: 'زمان مطالعه روزانه', timeHint: 'این زمان برای امروز و روزهای آینده ذخیره می‌شود.',
      topic: 'موضوع تمرین', topicHint: 'تغییر موضوع فعالیت‌های انجام‌شده را پاک نمی‌کند.', chooseTopic: 'انتخاب موضوع',
      custom: 'موضوع دلخواه', apply: 'ثبت موضوع', weak: 'مهارت‌های نیازمند تمرین بیشتر',
      weakHint: 'انتخاب‌ها در ساخت برنامه‌های بعدی اثر می‌گذارند.', exam: 'تاریخ آزمون', goal: 'هدف یادگیری',
      activities: 'ترتیب و زمان فعالیت‌های امروز', activitiesHint: 'با فلش‌ها ترتیب را تغییر دهید؛ زمان هر فعالیت را هم می‌توانید ویرایش کنید.',
      empty: 'ابتدا یک برنامه بسازید تا فعالیت‌ها نمایش داده شوند.', minutes: 'دقیقه', done: 'انجام‌شده', up: 'انتقال به بالا', down: 'انتقال به پایین'
    },
    en: {
      eyebrow: 'Weekly program', title: 'Learning program settings',
      intro: 'Adjust time, topic, goal and activity order here. Changes are saved, and the practice page stays clear for a quick start.',
      back: 'Back to practice', program: 'Selected program', change: 'Change program',
      time: 'Daily study time', timeHint: 'This time is saved for today and future days.',
      topic: 'Practice topic', topicHint: 'Changing the topic keeps completed activities.', chooseTopic: 'Choose a topic',
      custom: 'Custom topic', apply: 'Apply topic', weak: 'Skills to practise more',
      weakHint: 'Your choices shape future daily programs.', exam: 'Exam date', goal: 'Learning goal',
      activities: 'Today’s activity order and time', activitiesHint: 'Use the arrows to reorder activities. You can also edit each duration.',
      empty: 'Create a program first to see activities.', minutes: 'minutes', done: 'Completed', up: 'Move up', down: 'Move down'
    },
    de: {
      eyebrow: 'Wochenplan', title: 'Einstellungen des Lernprogramms',
      intro: 'Passe Zeit, Thema, Ziel und Reihenfolge hier an. Änderungen werden gespeichert und die Übungsseite bleibt übersichtlich.',
      back: 'Zurück zu den Übungen', program: 'Gewähltes Programm', change: 'Programm wechseln',
      time: 'Tägliche Lernzeit', timeHint: 'Diese Zeit gilt für heute und kommende Tage.',
      topic: 'Übungsthema', topicHint: 'Beim Themenwechsel bleiben erledigte Aktivitäten erhalten.', chooseTopic: 'Thema wählen',
      custom: 'Eigenes Thema', apply: 'Thema übernehmen', weak: 'Fertigkeiten mit mehr Übungsbedarf',
      weakHint: 'Deine Auswahl beeinflusst künftige Tagesprogramme.', exam: 'Prüfungsdatum', goal: 'Lernziel',
      activities: 'Reihenfolge und Zeit der heutigen Aktivitäten', activitiesHint: 'Ändere die Reihenfolge mit den Pfeilen und passe die Dauer an.',
      empty: 'Erstelle zuerst ein Programm, um Aktivitäten zu sehen.', minutes: 'Minuten', done: 'Erledigt', up: 'Nach oben', down: 'Nach unten'
    }
  };
  const names = {
    lesen: {fa:'خواندن',en:'Reading',de:'Lesen'}, hoeren: {fa:'شنیدن',en:'Listening',de:'Hören'},
    schreiben: {fa:'نوشتن',en:'Writing',de:'Schreiben'}, sprechen: {fa:'صحبت‌کردن',en:'Speaking',de:'Sprechen'},
    grammatik: {fa:'گرامر',en:'Grammar',de:'Grammatik'}, vocab: {fa:'واژگان',en:'Vocabulary',de:'Wortschatz'}
  };

  window.openWeeklyPlan = function () {
    S.showPlanEditor = false;
    if (window.TDM?.active?.()) { TDM.hub('woche'); return; }
    S.screen = 'weeklyPlan'; render();
  };
  window.setWeeklyDefaultMinutes = function (value) {
    const minutes = normalizeDailyMinutes(value, S.user.dailyMinutes);
    S.user.dailyMinutes = minutes;
    applyTodayStudyMinutes(minutes);
  };
  window.setWeeklyActivityMinutes = function (id, value) {
    const item = S.plan?.activities?.find(a => a.id === id);
    const numeric = Number(value);
    if (!item || item.type === 'method' || !Number.isFinite(numeric)) return;
    item.dur = Math.max(5, Math.min(240, Math.round(numeric / 5) * 5));
    S.plan.totalMinutes = S.plan.activities.reduce((sum, a) => sum + (Number(a.dur) || 0), 0);
    S.plan.availableMinutes = Math.max(Number(S.plan.availableMinutes) || 0, S.plan.totalMinutes);
    upsertDailyHistorySegment(currentPlanHistorySnapshot()); saveData(); render();
  };
  window.toggleWeeklyWeakSkill = function (id) {
    if (!SKILLS.some(skill => skill.id === id)) return;
    const current = S.user.weakSkills || [];
    S.user.weakSkills = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    saveData(); render();
  };
  window.setWeeklyExamDate = function (value) {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    S.user.examDate = value || ''; saveData(); render();
  };
  window.weeklyChooseTopic = function (value) {
    const [topic, subtopic] = String(value || '').split('|');
    if (topic && subtopic) requestTopicChange(topic, subtopic, '');
  };
  window.renderWeeklyPlanSettings = function () {
    const lang = ['fa','en','de'].includes(S.uiLanguage) ? S.uiLanguage : 'fa';
    const c = copy[lang], minutes = normalizeDailyMinutes(S.user.dailyMinutes, 60);
    const topic = S.user.customTopic || getSubtopicLabel(S.user.subtopic) || getTopicLabel(S.user.topic) || '';
    const activities = S.plan?.activities || [];
    const topics = contentTopicOptions();
    return `<div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-28"><div class="weekly-settings-container max-w-5xl mx-auto px-4 pt-6">
      <header class="flex flex-wrap items-start justify-between gap-4 mb-6"><div><p class="text-xs font-black tracking-widest text-indigo-500">${c.eyebrow}</p><h1 class="mt-1 text-2xl md:text-3xl font-black">${c.title}</h1><p class="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">${c.intro}</p></div><button type="button" onclick="navigateApp('dashboard')" class="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">${c.back} ←</button></header>
      <div class="grid md:grid-cols-2 gap-4">
      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"><h2 class="font-black">${c.program}</h2><div class="mt-3 flex items-center justify-between gap-3"><b>${safeText(examPlanLabel())}</b><button type="button" onclick="requestLearningPlanChange()" class="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-bold">${c.change}</button></div><label class="block mt-5 text-sm font-bold">${c.exam}<input type="date" value="${safeText(S.user.examDate || '')}" onchange="setWeeklyExamDate(this.value)" class="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-base"></label><label class="block mt-4 text-sm font-bold">${c.goal}<input type="text" value="${safeText(S.user.learningGoal || '')}" onchange="S.user.learningGoal=this.value;saveData()" class="mt-2 block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-base"></label></section>
      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"><h2 class="font-black">${c.time}</h2><p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${c.timeHint}</p><strong id="weeklyTimeLabel" class="block mt-4 text-2xl text-indigo-600">${studyMinutesLabel(minutes)}</strong><input type="range" min="60" max="720" step="60" value="${minutes}" oninput="document.getElementById('weeklyTimeLabel').textContent=studyMinutesLabel(this.value)" onchange="setWeeklyDefaultMinutes(this.value)" aria-label="${c.time}" class="mt-5 w-full accent-indigo-600"><div class="flex justify-between text-xs text-slate-500"><span>1 h</span><span>12 h</span></div><h3 class="mt-5 text-sm font-bold">${c.weak}</h3><p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${c.weakHint}</p><div class="mt-3 flex flex-wrap gap-2">${SKILLS.map(skill => `<button type="button" aria-pressed="${(S.user.weakSkills || []).includes(skill.id)}" onclick="toggleWeeklyWeakSkill('${skill.id}')" class="px-3 py-2 rounded-full border text-xs font-bold ${(S.user.weakSkills || []).includes(skill.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}">${skill.icon} ${names[skill.id]?.[lang] || skill.l}</button>`).join('')}</div></section>
      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"><h2 class="font-black">${c.topic}</h2><p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${c.topicHint}</p><b class="block mt-3 text-indigo-600">${safeText(topic || c.chooseTopic)}</b><select onchange="weeklyChooseTopic(this.value)" class="mt-3 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-base"><option value="">${c.chooseTopic}</option>${topics.map(opt => `<option value="${opt.parent}|${opt.id}" ${S.user.subtopic === opt.id ? 'selected' : ''}>${safeText(opt.label)}</option>`).join('')}</select>${hasPremiumAccess() ? `<div class="mt-4 flex gap-2"><input type="text" value="${safeText(S.topicDraft || '')}" oninput="S.topicDraft=this.value" placeholder="${c.custom}" class="min-w-0 flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-base"><button type="button" onclick="requestTopicChange('custom','custom',S.topicDraft)" class="px-3 py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-bold">${c.apply}</button></div>` : ''}</section>
      <section class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"><h2 class="font-black">${c.activities}</h2><p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${c.activitiesHint}</p>${activities.length ? `<ol class="mt-4 space-y-2">${activities.map((a, i) => `<li class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><span class="w-6 text-center text-indigo-500 font-black">${i + 1}</span><span class="min-w-0 flex-1 text-sm font-bold">${safeText(a.title)}${S.completedActivities.includes(a.id) ? ` <small class="text-emerald-500">✓ ${c.done}</small>` : ''}</span><input type="number" min="5" max="240" step="5" value="${Number(a.dur) || 0}" onchange="setWeeklyActivityMinutes('${a.id}',this.value)" aria-label="${c.minutes}: ${safeText(a.title)}" class="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"><span class="text-xs text-slate-500">${c.minutes}</span><div class="flex flex-col"><button type="button" ${i === 0 ? 'disabled' : ''} onclick="moveActivityInPlan(${i},-1)" aria-label="${c.up}" class="disabled:opacity-30">▲</button><button type="button" ${i === activities.length - 1 ? 'disabled' : ''} onclick="moveActivityInPlan(${i},1)" aria-label="${c.down}" class="disabled:opacity-30">▼</button></div></li>`).join('')}</ol>` : `<p class="mt-4 text-sm text-slate-500">${c.empty}</p>`}</section>
      </div></div></div>`;
  };
})();
