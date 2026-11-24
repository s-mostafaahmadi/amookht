/* Amookht · Premium (2026-11-15): price 3,000,000 Toman / month, full premium feature list with drawn
   illustrations (used by the premium page and the landing), 3-day premium trial for new accounts
   (everything except uploading files to the library), trial banner on the dashboard.
   Loaded in <head>; overrides hasPremiumAccess / renderPremiumPlans / premiumCommerceCopy once the inline app script ran.
   Trial data comes from /v1/account/me (trial_until) → S.trialUntil. */
(function () {
  'use strict';
  const app = () => { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } };
  const lang = () => { const l = app()?.uiLanguage; return l === 'en' || l === 'de' ? l : 'fa'; };
  const T = (fa, en, de) => ({ fa, en, de }[lang()] ?? fa);
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const faNum = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

  const PRICE = { fa: '۳٬۰۰۰٬۰۰۰', en: '3,000,000', de: '3.000.000' };
  const CUR = { fa: 'تومان', en: 'Toman', de: 'Toman' };
  const PER = { fa: 'ماهانه', en: 'per month', de: 'pro Monat' };

  /* ---------- drawn illustrations (320×190, theme-aware through CSS vars) ---------- */
  const sv = (body) => `<svg class="amp-art" viewBox="0 0 320 190" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect class="amp-bg" x="0" y="0" width="320" height="190" rx="18"/>${body}</svg>`;
  const txt = (x, y, s, cls = 'amp-t', size = 11, anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" text-anchor="${anchor}">${E(s)}</text>`;
  const ART = {
    tutor: () => sv(`<rect class="amp-card" x="22" y="18" width="276" height="154" rx="14"/><rect class="amp-a" x="22" y="18" width="276" height="30" rx="14"/><rect class="amp-a" x="22" y="34" width="276" height="14"/>
      <circle class="amp-w" cx="42" cy="33" r="8"/>${txt(58, 37, 'Deutsch-Tutor', 'amp-tw', 11)}
      <rect class="amp-soft" x="120" y="60" width="164" height="30" rx="12"/>${txt(276, 79, 'Warum steht „kommt“ am Ende?', 'amp-t', 10, 'end')}
      <rect class="amp-soft2" x="36" y="100" width="190" height="58" rx="12"/>${txt(48, 118, 'Im Nebensatz steht das Verb', 'amp-t', 10)}${txt(48, 132, 'am Ende:', 'amp-t', 10)}
      <rect class="amp-red" x="48" y="139" width="150" height="14" rx="5"/>${txt(123, 150, 'weil + … + Verb', 'amp-tw', 9.5, 'middle')}`),
    coach: () => sv(`<circle class="amp-a" cx="58" cy="62" r="24"/>${txt(58, 67, 'DC', 'amp-tw', 13, 'middle')}<circle class="amp-b" cx="262" cy="128" r="22"/>${txt(262, 133, 'Du', 'amp-tw', 12, 'middle')}
      <rect class="amp-card" x="92" y="40" width="180" height="44" rx="14"/>${txt(104, 58, 'Was hast du am Wochenende', 'amp-t', 10)}${txt(104, 72, 'gemacht?', 'amp-t', 10)}
      <rect class="amp-soft" x="48" y="108" width="190" height="42" rx="14"/>${txt(60, 125, 'Ich bin ins Kino gegangen.', 'amp-t', 10)}<path class="amp-okl" d="M60 136h120"/>${txt(60, 146, '✓ Perfekt mit „sein“', 'amp-tok', 9)}
      <g class="amp-wave">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${120 + i * 9}" y="${168 - [6, 12, 18, 10, 16, 8, 5][i] / 2}" width="5" height="${[6, 12, 18, 10, 16, 8, 5][i]}" rx="2.5"/>`).join('')}</g>`),
    translate: () => sv(`<rect class="amp-card" x="20" y="30" width="125" height="120" rx="14"/><rect class="amp-card" x="175" y="30" width="125" height="120" rx="14"/>
      <rect class="amp-a" x="32" y="42" width="60" height="18" rx="9"/>${txt(62, 55, 'Deutsch', 'amp-tw', 9.5, 'middle')}<rect class="amp-b" x="228" y="42" width="60" height="18" rx="9"/>${txt(258, 55, 'فارسی', 'amp-tw', 10, 'middle')}
      ${txt(32, 92, 'die Nachhaltigkeit', 'amp-t', 11.5)}${txt(288, 92, 'پایداری', 'amp-t', 14, 'end')}${txt(32, 114, 'nachhaltig handeln', 'amp-tm', 9.5)}${txt(288, 114, 'رفتار پایدار', 'amp-tm', 10, 'end')}
      <circle class="amp-a" cx="160" cy="90" r="15"/><path class="amp-wl" d="M152 86h14l-4-4M168 94h-14l4 4"/>
      <circle class="amp-soft" cx="44" cy="134" r="9"/><path class="amp-al" d="M40 131v6h3l4 3v-12l-4 3z"/>${txt(58, 138, 'Aussprache', 'amp-tm', 9)}`),
    write: () => sv(`<rect class="amp-card" x="26" y="16" width="208" height="158" rx="12"/>${[40, 58, 112, 130, 148].map((y) => `<rect class="amp-line" x="40" y="${y}" width="${y === 148 ? 120 : 178}" height="6" rx="3"/>`).join('')}
      ${txt(40, 84, 'Ich habe', 'amp-t', 10.5)}<g>${txt(88, 84, 'gegeht', 'amp-tbad', 10.5)}<path class="amp-badl" d="M88 81h36"/></g>${txt(128, 84, 'gegangen', 'amp-tok', 10.5)}
      ${txt(40, 101, 'weil es', 'amp-t', 10.5)}${txt(80, 101, 'regnete', 'amp-tok', 10.5)}<path class="amp-okl" d="M80 104h40"/>
      <circle class="amp-a" cx="268" cy="62" r="34"/>${txt(268, 60, '4/5', 'amp-tw', 17, 'middle')}${txt(268, 77, 'Note', 'amp-tw', 9, 'middle')}
      <rect class="amp-soft" x="244" y="112" width="58" height="16" rx="8"/>${txt(273, 124, 'Grammatik', 'amp-t', 8.5, 'middle')}<rect class="amp-soft2" x="244" y="134" width="58" height="16" rx="8"/>${txt(273, 146, 'Struktur', 'amp-t', 8.5, 'middle')}`),
    speak: () => sv(`<rect class="amp-card" x="20" y="20" width="280" height="150" rx="14"/><circle class="amp-red" cx="50" cy="56" r="14"/><rect class="amp-w" x="46" y="48" width="8" height="12" rx="4"/>
      <g class="amp-wave">${Array.from({ length: 26 }, (_, i) => { const h = 6 + Math.round(Math.abs(Math.sin(i * 1.7)) * 26); return `<rect x="${76 + i * 8}" y="${56 - h / 2}" width="5" height="${h}" rx="2.5"/>`; }).join('')}</g>
      ${[['Flüssigkeit', 0.82], ['Aussprache', 0.7], ['Grammatik', 0.6]].map((r, i) => `${txt(38, 104 + i * 24, r[0], 'amp-tm', 9.5)}<rect class="amp-line" x="118" y="${96 + i * 24}" width="160" height="9" rx="4.5"/><rect class="amp-a" x="118" y="${96 + i * 24}" width="${Math.round(160 * r[1])}" height="9" rx="4.5"/>`).join('')}`),
    voice: () => sv(`<circle class="amp-a" cx="92" cy="95" r="44"/><path class="amp-wl" d="M74 84v22h12l16 13V71L86 84z"/><path class="amp-al2" d="M150 74a30 30 0 0 1 0 42M168 60a52 52 0 0 1 0 70"/>
      <rect class="amp-card" x="196" y="62" width="104" height="66" rx="14"/>${txt(248, 90, 'Guten Morgen!', 'amp-t', 11, 'middle')}${txt(248, 110, 'ˈɡuːtn̩ ˈmɔʁɡn̩', 'amp-tm', 9, 'middle')}`),
    grammar: () => sv(`<rect class="amp-a" x="30" y="44" width="70" height="62" rx="16"/><circle class="amp-w" cx="52" cy="72" r="7"/><circle class="amp-w" cx="78" cy="72" r="7"/><rect class="amp-w" x="52" y="88" width="26" height="5" rx="2.5"/><path class="amp-al" d="M65 44V30"/><circle class="amp-b" cx="65" cy="28" r="5"/>
      <rect class="amp-card" x="116" y="34" width="184" height="40" rx="12"/>${txt(128, 59, 'Ich ___ morgen nach Berlin.', 'amp-t', 10.5)}
      <rect class="amp-soft" x="116" y="86" width="56" height="24" rx="12"/>${txt(144, 102, 'fahre', 'amp-tok', 10.5, 'middle')}<rect class="amp-soft2" x="180" y="86" width="56" height="24" rx="12"/>${txt(208, 102, 'fährt', 'amp-tm', 10.5, 'middle')}<rect class="amp-soft2" x="244" y="86" width="56" height="24" rx="12"/>${txt(272, 102, 'fahren', 'amp-tm', 10.5, 'middle')}
      <rect class="amp-okbg" x="116" y="126" width="184" height="30" rx="10"/>${txt(208, 145, '✓ Richtig! 1. Person Singular', 'amp-tok', 10, 'middle')}`),
    weekly: () => sv(`<rect class="amp-card" x="20" y="18" width="280" height="154" rx="14"/>${[52, 70, 46, 88, 76, 104, 118].map((h, i) => `<rect class="${i === 6 ? 'amp-a' : 'amp-soft'}" x="${44 + i * 34}" y="${150 - h}" width="20" height="${h}" rx="6"/>`).join('')}
      <path class="amp-al2" d="M54 104 L88 86 L122 110 L156 66 L190 78 L224 52 L258 36"/>${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => txt(54 + i * 34, 164, d, 'amp-tm', 8.5, 'middle')).join('')}
      <rect class="amp-red" x="214" y="26" width="76" height="16" rx="8"/>${txt(252, 38, 'Dativ ×5', 'amp-tw', 9, 'middle')}`),
    sim: () => sv(`<circle class="amp-soft" cx="80" cy="95" r="52"/><circle class="amp-ring" cx="80" cy="95" r="44"/><circle class="amp-ringa" cx="80" cy="95" r="44" stroke-dasharray="190 400" transform="rotate(-90 80 95)"/>${txt(80, 100, '55:00', 'amp-t', 16, 'middle')}
      ${['Lesen', 'Hören', 'Schreiben', 'Sprechen'].map((s, i) => `<rect class="${i === 0 ? 'amp-a' : 'amp-card'}" x="160" y="${30 + i * 34}" width="136" height="26" rx="10"/>${txt(174, 47 + i * 34, s, i === 0 ? 'amp-tw' : 'amp-t', 10.5)}${txt(286, 47 + i * 34, ['40', '35', '1', '7'][i], i === 0 ? 'amp-tw' : 'amp-tm', 10, 'end')}`).join('')}`),
    library: () => sv(`<rect class="amp-card" x="40" y="14" width="140" height="162" rx="10"/><rect class="amp-red" x="40" y="14" width="34" height="18" rx="6"/>${txt(57, 27, 'PDF', 'amp-tw', 9, 'middle')}
      ${[48, 64, 80, 96, 112, 128, 144].map((y) => `<rect class="amp-line" x="54" y="${y}" width="${y === 144 ? 70 : 112}" height="6" rx="3"/>`).join('')}<rect class="amp-hl" x="52" y="78" width="100" height="10" rx="3"/><rect class="amp-hl" x="52" y="110" width="80" height="10" rx="3"/>
      <path class="amp-al2" d="M70 160c14-8 26 6 40-2s22-4 30 0"/><rect class="amp-note" x="196" y="40" width="100" height="78" rx="8" transform="rotate(4 246 79)"/>${txt(208, 66, 'Notiz:', 'amp-t', 10)}${txt(208, 84, 'Konjunktiv II', 'amp-t', 10)}${txt(208, 100, 'wiederholen!', 'amp-t', 10)}`),
    custom: () => sv(`${[['Reisen', 30, 40], ['Medizin', 128, 40], ['IT & Technik', 30, 84], ['Familie', 160, 84], ['Behörde', 30, 128], ['+', 132, 128]].map((c, i) => `<rect class="${i === 5 ? 'amp-a' : i % 2 ? 'amp-soft' : 'amp-card'}" x="${c[1]}" y="${c[2]}" width="${i === 5 ? 44 : c[0].length * 8 + 34}" height="32" rx="16"/>${txt(c[1] + (i === 5 ? 22 : 17), c[2] + 21, c[0], i === 5 ? 'amp-tw' : 'amp-t', i === 5 ? 16 : 11, i === 5 ? 'middle' : 'start')}`).join('')}
      <rect class="amp-card" x="214" y="120" width="86" height="44" rx="12"/>${txt(257, 140, '12 Übungen', 'amp-t', 10, 'middle')}${txt(257, 155, 'neu erstellt', 'amp-tm', 9, 'middle')}`),
    level: () => sv(`${['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l, i) => `<rect class="${i === 4 ? 'amp-a' : i < 4 ? 'amp-soft' : 'amp-card'}" x="${26 + i * 46}" y="${150 - (i + 1) * 20}" width="38" height="${(i + 1) * 20}" rx="9"/>${txt(45 + i * 46, 166, l, 'amp-t', 11, 'middle')}`).join('')}
      <path class="amp-al2" d="M184 70c20-22 40-24 60-16"/><path class="amp-al2" d="M238 46l8 8-10 4"/><rect class="amp-okbg" x="200" y="16" width="100" height="24" rx="12"/>${txt(250, 32, 'sofort aktiv', 'amp-tok', 10, 'middle')}`)
  };

  /* ---------- features ---------- */
  const FEATURES = [
    ['tutor', ['مربی آلمانی هوشمند', 'AI German tutor', 'KI-Deutsch-Tutor'], ['هر سؤالی درباره متن، گرامر یا لغت را همان‌جا که تمرین می‌کنید بپرسید و جواب کوتاه و قدم‌به‌قدم بگیرید.', 'Ask about any text, grammar point or word right where you practise and get short, step-by-step answers.', 'Frag zu jedem Text, jeder Grammatik und jedem Wort direkt beim Üben – mit kurzen, schrittweisen Antworten.']],
    ['coach', ['مربی گفتگو', 'Conversation coach', 'Gesprächs-Coach'], ['با مربی‌های هوشمند به آلمانی حرف بزنید یا بنویسید؛ اشتباه‌ها مهربان و دقیق اصلاح می‌شوند.', 'Talk or write in German with smart coaches; your mistakes are corrected kindly and precisely.', 'Sprich oder schreib mit smarten Coaches auf Deutsch; Fehler werden freundlich und genau korrigiert.']],
    ['translate', ['مترجم فارسی ↔ آلمانی', 'Persian ↔ German translator', 'Übersetzer Persisch ↔ Deutsch'], ['هر کلمه یا جمله را با یک انتخاب ترجمه کنید؛ همراه تلفظ، همایندها و افزودن به دفتر عبارات.', 'Translate any word or sentence with one selection – with pronunciation, collocations and add-to-notebook.', 'Jedes Wort und jeden Satz per Markierung übersetzen – mit Aussprache, Kollokationen und Merkheft.']],
    ['write', ['بازخورد هوشمند نوشتن', 'Smart writing feedback', 'Intelligentes Schreib-Feedback'], ['نمره، خطاهای علامت‌خورده، توضیح هر اصلاح و نسخه بهتر متن خودتان.', 'A score, marked mistakes, an explanation for each fix and a better version of your own text.', 'Bewertung, markierte Fehler, Erklärung jeder Korrektur und eine bessere Fassung deines Textes.']],
    ['speak', ['بازخورد هوشمند صحبت', 'Smart speaking feedback', 'Intelligentes Sprech-Feedback'], ['صدای ضبط‌شده شما از نظر روانی، تلفظ و گرامر بررسی می‌شود و نکته‌های بهتر شدن را می‌گیرید.', 'Your recording is checked for fluency, pronunciation and grammar, with tips to improve.', 'Deine Aufnahme wird auf Flüssigkeit, Aussprache und Grammatik geprüft – mit Tipps zur Verbesserung.']],
    ['voice', ['تلفظ با صدای طبیعی', 'Natural pronunciation', 'Natürliche Aussprache'], ['هر متن آلمانی را با صدای طبیعی و واضح بشنوید و تکرار کنید.', 'Hear any German text in a natural, clear voice and repeat it.', 'Jeden deutschen Text mit natürlicher, klarer Stimme hören und nachsprechen.']],
    ['grammar', ['ربات تمرین گرامر', 'Grammar practice bot', 'Grammatik-Trainingsbot'], ['هر بار جمله‌های تازه متناسب با سطح شما و تصحیح فوری با توضیح.', 'Fresh sentences at your level every time, with instant correction and explanation.', 'Jedes Mal neue Sätze auf deinem Niveau, mit sofortiger Korrektur und Erklärung.']],
    ['weekly', ['تحلیل هفتگی', 'Weekly analysis', 'Wochenanalyse'], ['خطاهای پرتکرار، نقاط ضعف و پیشنهاد دقیق برای هفته بعد.', 'Frequent mistakes, weak points and a concrete plan for next week.', 'Häufige Fehler, Schwächen und ein konkreter Plan für nächste Woche.']],
    ['sim', ['شبیه‌ساز کامل آزمون', 'Full exam simulator', 'Vollständiger Prüfungssimulator'], ['آزمون کامل TestDaF با ساختار، تعداد سؤال و زمان‌بندی واقعی هر بخش.', 'A full TestDaF exam with the real structure, question count and timing of every part.', 'Komplette TestDaF-Prüfung mit echter Struktur, Aufgabenzahl und Zeit für jeden Teil.']],
    ['library', ['کتابخانه و ابزار PDF', 'Library & PDF tools', 'Bibliothek & PDF-Werkzeuge'], ['کتاب و جزوه PDF خودتان را آپلود کنید؛ هایلایت، یادداشت و قلم روی صفحه‌ها.', 'Upload your own PDF books and notes; highlight, annotate and draw on the pages.', 'Eigene PDF-Bücher und Skripte hochladen; markieren, notieren und auf den Seiten zeichnen.']],
    ['custom', ['موضوع دلخواه و تمرین اختصاصی', 'Your own topics & exercises', 'Eigene Themen & Übungen'], ['با موضوعی که برایتان مهم است تمرین کنید و مجموعه تمرین اختصاصی بسازید.', 'Practise with the topics that matter to you and build your own exercise sets.', 'Mit Themen üben, die dir wichtig sind, und eigene Übungssets erstellen.']],
    ['level', ['تغییر سطح فوری', 'Instant level change', 'Sofortiger Niveauwechsel'], ['با تغییر سطح، برنامه و سؤال‌های همان روز فوراً از نو ساخته می‌شوند.', 'When you change your level, today’s plan and questions are rebuilt right away.', 'Beim Niveauwechsel werden Tagesplan und Aufgaben sofort neu erstellt.']]
  ];
  const li = (a) => a[{ fa: 0, en: 1, de: 2 }[lang()]];
  function featureList() { return FEATURES.map((f) => ({ key: f[0], title: li(f[1]), text: li(f[2]) })); }
  function showcase(prefix = 'amp') {
    return `<div class="amp-show">${FEATURES.map((f) => `<article class="amp-show-card ${prefix === 'lx' ? 'lx-rv' : ''}"><div class="amp-show-art">${ART[f[0]]()}</div><div class="amp-show-body"><b>${E(li(f[1]))}</b><p>${E(li(f[2]))}</p></div></article>`).join('')}</div>`;
  }

  /* ---------- trial / access ---------- */
  const PAID = ['premium', 'admin', 'owner'];
  function role() { try { return typeof normalizedAccessRole === 'function' ? normalizedAccessRole() : String(app()?.accessRole || 'normal'); } catch (e) { return 'normal'; } }
  function hasPaidPremium() { return PAID.includes(role()); }
  function trialEnd() { const s = app(); const t = Date.parse(s?.trialUntil || ''); return Number.isFinite(t) ? t : 0; }
  function trialActive() { const s = app(); return !!(s?.currentUser && !hasPaidPremium() && trialEnd() > Date.now()); }
  function trialLeft() {
    const ms = Math.max(0, trialEnd() - Date.now()), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
    const n = (x) => (lang() === 'fa' ? faNum(x) : String(x));
    return d > 0 ? T(`${n(d)} روز و ${n(h)} ساعت`, `${n(d)} d ${n(h)} h`, `${n(d)} T. ${n(h)} Std.`) : T(`${n(h)} ساعت`, `${n(h)} h`, `${n(h)} Std.`);
  }

  /* ---------- premium page ---------- */
  function copy() {
    return {
      back: T('← بازگشت', '← Back', '← Zurück'),
      tag: 'AMOOKHT PREMIUM',
      headline: T('آلمانی را سریع‌تر و مطمئن‌تر یاد بگیرید', 'Learn German faster and with confidence', 'Deutsch schneller und sicherer lernen'),
      intro: T('همه ابزارهای هوشمند Amookht در یک اشتراک: مربی آلمانی، مربی گفتگو، مترجم، بازخورد نوشتن و صحبت، ربات گرامر، تحلیل هفتگی، شبیه‌ساز آزمون و کتابخانه.', 'All smart Amookht tools in one subscription: German tutor, conversation coach, translator, writing and speaking feedback, grammar bot, weekly analysis, exam simulator and library.', 'Alle smarten Amookht-Werkzeuge in einem Abo: Deutsch-Tutor, Gesprächs-Coach, Übersetzer, Schreib- und Sprech-Feedback, Grammatik-Bot, Wochenanalyse, Prüfungssimulator und Bibliothek.'),
      recommended: T('اشتراک ماهانه', 'Monthly plan', 'Monatsabo'),
      plan: T('اشتراک Premium', 'Premium subscription', 'Premium-Abo'),
      priceLabel: T('قیمت اشتراک', 'Subscription price', 'Preis des Abos'),
      price: PRICE[lang()], currency: CUR[lang()], per: PER[lang()],
      buy: T('تهیه اشتراک از طریق تلگرام', 'Get Premium via Telegram', 'Premium über Telegram holen'),
      cta: T('تهیه اشتراک', 'Get Premium', 'Premium abonnieren'),
      checkoutTitle: T('تهیه اشتراک Premium', 'Get Premium', 'Premium holen'),
      checkoutBody: T('گفتگو با پشتیبانی Amookht در تلگرام باز شد. پیام آماده را بفرستید تا اشتراک شما فعال شود. اگر تلگرام باز نشد، به @Amookht_support پیام دهید.', 'A chat with Amookht support has opened in Telegram. Send the prepared message and your subscription will be activated. If Telegram did not open, message @Amookht_support.', 'Ein Chat mit dem Amookht-Support wurde in Telegram geöffnet. Sende die vorbereitete Nachricht, dann wird dein Abo freigeschaltet. Falls Telegram nicht geöffnet wurde, schreibe an @Amookht_support.'),
      alt: T('فضای مطالعه Premium', 'Premium workspace', 'Premium-Arbeitsbereich'),
      features: featureList().map((f) => [f.title, f.text]),
      showH: T('هر امکان، از نزدیک', 'Every feature up close', 'Jede Funktion im Detail'),
      trialNew: T('حساب‌های تازه: ۳ روز اول همه امکانات Premium رایگان است (به‌جز آپلود فایل در کتابخانه).', 'New accounts: the first 3 days include every Premium feature for free (except uploading files to the library).', 'Neue Konten: In den ersten 3 Tagen sind alle Premium-Funktionen kostenlos (außer dem Hochladen in die Bibliothek).'),
      trialOn: T('دوره رایگان Premium شما فعال است', 'Your free Premium trial is active', 'Deine kostenlose Premium-Testphase läuft'),
      trialLeftL: T('زمان باقی‌مانده', 'Time left', 'Verbleibend'),
      paidOn: T('اشتراک Premium شما فعال است', 'Your Premium subscription is active', 'Dein Premium-Abo ist aktiv')
    };
  }
  function renderPremiumPlansV2() {
    const c = copy(), dir = lang() === 'fa' ? 'rtl' : 'ltr';
    const status = hasPaidPremium() ? `<div class="amp-status is-paid">⭐ ${E(c.paidOn)}</div>`
      : trialActive() ? `<div class="amp-status is-trial">⏳ ${E(c.trialOn)} · ${E(c.trialLeftL)}: <b>${E(trialLeft())}</b></div>`
        : `<div class="amp-status">🎁 ${E(c.trialNew)}</div>`;
    return `<div class="premium-plans-page amp-page"><main class="premium-plans-shell" data-learning-content dir="${dir}"><button type="button" class="premium-plans-back" onclick="closePremiumPlans()">${c.back}</button>
      <header class="premium-plans-heading"><span>${c.tag}</span><h1>${E(c.headline)}</h1><p>${E(c.intro)}</p></header>${status}
      <article class="amp-price"><div class="amp-price-main"><span class="amp-price-tag">${E(c.recommended)}</span><h2>${E(c.plan)}</h2><div class="amp-price-num"><strong>${E(c.price)}</strong> <span>${E(c.currency)}</span><small>/ ${E(c.per)}</small></div>
        ${hasPaidPremium() ? '' : `<button type="button" class="premium-plan-buy amp-buy" onclick="startPremiumCheckout()">${E(c.buy)}</button>`}</div>
        <ul class="amp-checks">${c.features.map((x) => `<li><i>✓</i><span>${E(x[0])}</span></li>`).join('')}</ul></article>
      <h2 class="amp-show-h">${E(c.showH)}</h2>${showcase('amp')}
      ${hasPaidPremium() ? '' : `<div class="amp-bottom"><div><b>${E(c.plan)}</b><span>${E(c.price)} ${E(c.currency)} / ${E(c.per)}</span></div><button type="button" class="premium-plan-buy amp-buy" onclick="startPremiumCheckout()">${E(c.buy)}</button></div>`}
    </main></div>`;
  }

  /* ---------- trial banner on the dashboard ---------- */
  function syncBanner() { /*AMK-TRIALCHIP*/
    const s = app(); if (!s) return;
    const chips = document.querySelectorAll('.amp-trialchip');
    const show = trialActive() && s.screen === 'dashboard';
    // the chip belongs in the same row as the activity streak, not above the mode bar
    const streak = document.querySelector('#app .execution-hero span[class*="bg-orange-400/20"]');
    const row = streak ? streak.parentElement : null;
    if (!show || !row) { chips.forEach((el) => el.remove()); return; }
    const tip = T('۳ روز Premium رایگان برای حساب‌های تازه', '3 days of free Premium for new accounts', '3 Tage Premium gratis für neue Konten');
    const html = `<button type="button" class="amp-trialchip" dir="${lang() === 'fa' ? 'rtl' : 'ltr'}" title="${E(tip)}" onclick="openPremiumPlans('trial')">`
      + `<span aria-hidden="true">🎁</span><span>${E(T('Premium رایگان', 'Free Premium', 'Gratis Premium'))}</span>`
      + `<span class="amp-trialchip-left">${E(T('باقی‌مانده', 'left', 'übrig'))}: ${E(trialLeft())}</span>`
      + `<span class="amp-trialchip-see">${E(T('مشاهده', 'See', 'Ansehen'))}</span></button>`;
    if (chips.length === 1 && chips[0].outerHTML === html) return;
    chips.forEach((el) => el.remove());
    row.insertAdjacentHTML('beforeend', html);
  }

  /* ---------- library upload: paid accounts only ---------- */
  function blockTrialUpload(ev) {
    const el = ev.target;
    if (!(el instanceof HTMLInputElement) || el.type !== 'file' || !/libraryUpload/.test(el.getAttribute('onchange') || '')) return;
    if (hasPaidPremium()) return;
    ev.preventDefault(); ev.stopPropagation();
    if (typeof showGlassAlarm === 'function') showGlassAlarm(T('آپلود فایل در کتابخانه مخصوص مشترکان Premium است. در دوره رایگان می‌توانید از بقیه امکانات کتابخانه استفاده کنید.', 'Uploading files to the library is for Premium subscribers. During the trial you can use the rest of the library.', 'Das Hochladen in die Bibliothek ist Premium-Abonnenten vorbehalten. In der Testphase kannst du die übrige Bibliothek nutzen.'), { type: 'premium', title: T('آپلود فایل', 'File upload', 'Datei hochladen'), source: 'library-upload' });
    else if (typeof openPremiumPlans === 'function') openPremiumPlans('library-upload');
  }

  function install() {
    if (install.done) return; install.done = true;
    window.hasPaidPremium = hasPaidPremium;
    window.hasPremiumAccess = function () { return hasPaidPremium() || trialActive(); };
    window.premiumCommerceCopy = copy;
    window.renderPremiumPlans = renderPremiumPlansV2;
    if (typeof window.libraryUploadPdf === 'function') {
      const orig = window.libraryUploadPdf;
      window.libraryUploadPdf = function (input) { if (!hasPaidPremium()) { try { input.value = ''; } catch (e) { /* ignore */ } blockTrialUpload({ target: input, preventDefault() {}, stopPropagation() {} }); return; } return orig.apply(this, arguments); };
    }
    document.addEventListener('click', blockTrialUpload, true);
    if (typeof window.render === 'function' && !window.render.__amp) {
      const r0 = window.render;
      window.render = function () { const out = r0.apply(this, arguments); try { syncBanner(); } catch (e) { /* ignore */ } return out; };
      window.render.__amp = true;
    }
    setInterval(() => { try { syncBanner(); } catch (e) { /* ignore */ } }, 60000);
    try { syncBanner(); if (app()?.screen === 'premiumPlans' && typeof render === 'function') render(); } catch (e) { /* ignore */ }
  }

  window.AmkPremium = { ART, FEATURES, featureList, showcase, price: () => PRICE[lang()], currency: () => CUR[lang()], per: () => PER[lang()], trialActive, trialLeft, hasPaidPremium };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
