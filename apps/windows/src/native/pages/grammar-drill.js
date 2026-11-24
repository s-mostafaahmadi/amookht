// Grammar drill bot («ربات تمرین گرامر») — port of the site's grammar-drill.js (2026-11-21).
// Persian sentence → German translation with a short correction: AI first (/v1/grammar-drill, premium), the offline
// sentence bank (the «grammar» content pack) otherwise. Sentence topics (themes), the selected grammars and the chat
// session are kept in local storage under the site's keys, so the bot reopens on the last conversation.

import { lang as uiLang } from '../core/i18n.js';
import { confirmDialog } from './widgets.js';

export function createGrammarDrill(env) {
  /** The site's apiRequest(path, {method, body: JSON}) on top of the app bridge: resolves data, rejects {status, details}. */
  function apiRequest(path, opts) {
    return env.api('/v1' + path, { method: opts.method || 'GET', body: opts.body ? JSON.parse(opts.body) : undefined, timeout: 30000 }).then(function (r) {
      if (r && r.ok) return r.data;
      var e = new Error((r && r.error && r.error.message) || 'request failed');
      e.status = r && r.error && r.error.status; e.details = r && r.error && r.error.details;
      throw e;
    });
  }
  var VER = '20261121theme6';
  var LS_KEY = 'amookht_gd_topics';
  var THEME_KEY = 'amookht_gd_theme';
  var AI_TIMEOUT = 28000;

  var GROUPS = [
    { id: 'verb', fa: 'زمان‌ها و افعال', en: 'Tenses & verbs', de: 'Zeiten & Verben' },
    { id: 'case', fa: 'حالت‌ها، حروف اضافه و صفت', en: 'Cases, prepositions & adjectives', de: 'Kasus, Präpositionen & Adjektive' },
    { id: 'satz', fa: 'جمله‌های مرکب و ربط‌دهنده‌ها', en: 'Clauses & connectors', de: 'Satzbau & Konnektoren' },
    { id: 'modus', fa: 'مجهول و وجه فعل', en: 'Passive & mood', de: 'Passiv & Modus' },
    { id: 'c1', fa: 'سبک نوشتاری دانشگاهی (C1)', en: 'Academic style (C1)', de: 'Wissenschaftsstil (C1)' }
  ];
  var TOPICS = [
    ['perfekt', 'verb', 'گذشته نقلی', 'Perfekt'], ['praeteritum', 'verb', 'گذشته ساده', 'Präteritum'],
    ['plusquam', 'verb', 'ماضی بعید', 'Plusquamperfekt'], ['futur', 'verb', 'آینده', 'Futur I & II'],
    ['modal', 'verb', 'افعال وجهی', 'Modalverben'], ['trennbar', 'verb', 'افعال جداشدنی', 'Trennbare Verben'],
    ['reflexiv', 'verb', 'افعال انعکاسی', 'Reflexive Verben'], ['verb_praep', 'verb', 'فعل + حرف اضافه، da-/wo-', 'Verben mit Präpositionen'],
    ['akk_dat', 'case', 'مفعول مستقیم و غیرمستقیم', 'Akkusativ & Dativ'], ['wechselpraep', 'case', 'حروف اضافه دوحالته', 'Wechselpräpositionen'],
    ['genitiv', 'case', 'حالت اضافی', 'Genitiv'], ['adjektiv', 'case', 'صرف صفت', 'Adjektivdeklination'],
    ['komparativ', 'case', 'تفضیلی و عالی', 'Komparativ & Superlativ'], ['n_dekl', 'case', 'اسامی n-Deklination', 'n-Deklination'],
    ['kausal', 'satz', 'علت', 'weil / da / denn / deshalb'], ['dass_ob', 'satz', 'سؤال غیرمستقیم', 'dass / ob / W-Fragen'],
    ['konzessiv', 'satz', 'تضاد', 'obwohl / trotzdem'], ['temporal', 'satz', 'جمله زمانی', 'als / wenn / nachdem …'],
    ['final', 'satz', 'هدف', 'um … zu / damit'], ['konsekutiv', 'satz', 'نتیجه', 'sodass / so … dass'],
    ['konditional', 'satz', 'شرطی واقعی', 'wenn / falls / sofern'], ['relativ', 'satz', 'جمله موصولی', 'Relativsätze'],
    ['infinitiv', 'satz', 'مصدر با zu', 'Infinitiv mit zu'], ['zweiteilig', 'satz', 'ربط‌دهنده دوبخشی', 'je … desto, weder … noch …'],
    ['adverb_pos2', 'satz', 'قید ربطی و جای فعل', 'außerdem / dennoch …'], ['passiv', 'modus', 'مجهول', 'Passiv'],
    ['passiv_modal', 'modus', 'مجهول با فعل وجهی', 'Passiv + Modalverb'], ['passiv_ersatz', 'modus', 'جایگزین مجهول', 'Passiversatz'],
    ['konj2', 'modus', 'وجه شرطی حال', 'Konjunktiv II'], ['konj2_verg', 'modus', 'وجه شرطی گذشته', 'Konjunktiv II Vergangenheit'],
    ['konj1', 'modus', 'نقل قول غیرمستقیم', 'Konjunktiv I'], ['partizip', 'c1', 'صفت فاعلی/مفعولی', 'Partizipialattribute'],
    ['nominal', 'c1', 'سبک اسمی', 'Nominalstil'], ['nomen_verb', 'c1', 'ترکیب اسم-فعل', 'Nomen-Verb-Verbindungen'],
    ['grafik', 'c1', 'توصیف نمودار', 'Grafikbeschreibung']
  ].map(function (t) { return { id: t[0], group: t[1], fa: t[2], de: t[3] }; });
  var TOPIC = {};
  TOPICS.forEach(function (t) { TOPIC[t.id] = t; });

  /* Inhaltliches Thema der Sätze (ids must match THEMES in backend/app/api/routes/grammar_drill.py). */
  var THEMES = [
    ['', 'خودکار (تصادفی)', 'Auto (random)', 'Automatisch'],
    ['alltag', 'زندگی روزمره', 'Everyday life', 'Alltag'],
    ['studium', 'دانشگاه و تحصیل', 'Studies & university', 'Studium'],
    ['beruf', 'کار و حرفه', 'Work & career', 'Beruf'],
    ['familie', 'خانواده', 'Family', 'Familie'],
    ['wohnen', 'خانه و اجاره', 'Housing & rent', 'Wohnen'],
    ['reisen', 'سفر', 'Travel', 'Reisen'],
    ['verkehr', 'حمل‌ونقل', 'Transport', 'Verkehr'],
    ['gesundheit', 'سلامت و پزشک', 'Health & doctor', 'Gesundheit'],
    ['ernaehrung', 'تغذیه و غذا', 'Food & nutrition', 'Ernährung'],
    ['umwelt', 'محیط زیست', 'Environment', 'Umwelt'],
    ['digital', 'دیجیتال و اینترنت', 'Digital & internet', 'Digitalisierung'],
    ['ki', 'هوش مصنوعی', 'Artificial intelligence', 'Künstliche Intelligenz'],
    ['medien', 'رسانه و اخبار', 'Media & news', 'Medien'],
    ['wirtschaft', 'اقتصاد و پول', 'Economy & money', 'Wirtschaft'],
    ['bildung', 'آموزش و مدرسه', 'Education & school', 'Bildung'],
    ['kultur', 'فرهنگ، موسیقی و سینما', 'Culture & arts', 'Kultur'],
    ['sport', 'ورزش و اوقات فراغت', 'Sport & leisure', 'Sport'],
    ['behoerde', 'اداره و کارهای اداری', 'Authorities & paperwork', 'Ämter'],
    ['einkaufen', 'خرید و مصرف', 'Shopping & consumption', 'Einkaufen']
  ].map(function (t) { return { id: t[0], fa: t[1], en: t[2], de: t[3] }; });
  var THEME = {};
  THEMES.forEach(function (t) { THEME[t.id] = t; });

  var COPY = {
    fa: {
      title: 'ربات تمرین گرامر', sub: 'جمله فارسی → ترجمه آلمانی', open: 'شروع تمرین',
      entry: 'گرامرهای دلخواهت را انتخاب کن؛ ربات جمله فارسی می‌دهد، تو به آلمانی ترجمه می‌کنی و فوری اصلاح کوتاه می‌گیری.',
      hello: 'سلام! 👋 کدوم گرامرها رو می‌خوای تمرین کنی؟ روی هر کدوم بزن تا انتخاب بشه، بعد «تأیید» رو بزن.',
      all: 'همه', none: 'هیچ', confirm: 'تأیید و شروع', pickFirst: 'حداقل یک گرامر انتخاب کن',
      themeTitle: 'موضوع جمله‌ها', themeHint: 'موضوع را انتخاب کن یا خودت بنویس تا جمله‌ها دربارهٔ همین موضوع ساخته شوند.',
      themeBank: 'در حالت آفلاین بانک جمله‌ها موضوعی نیست و موضوع انتخابی اعمال نمی‌شود.',
      themeBtn: 'موضوع', themeCustom: 'یا موضوع دلخواهت را بنویس…', themeApply: 'اعمال موضوع', themeAuto: 'خودکار (تصادفی)',
      themeSet: function (t) { return 'موضوع جمله‌ها: ' + t + '؛ جملهٔ بعدی دربارهٔ همین موضوع ساخته می‌شود.'; },
      allTopics: 'همهٔ گرامرها', allHint: 'تصادفی از هر گرامری سؤال می‌پرسد؛ برای خاموش‌کردن دوباره بزن.',
      translating: 'در حال ترجمه به آلمانی…', translated: 'ترجمهٔ آلمانی:',
      translateNeedsAI: 'ترجمهٔ متن فارسی به هوش مصنوعی نیاز دارد (حساب پرمیوم و اتصال اینترنت).',
      translateFailed: 'ترجمه ممکن نشد؛ کمی بعد دوباره امتحان کن.',
      clearChat: 'تاریخچه', clearAsk: 'تاریخچهٔ پیام‌ها و امتیازها پاک شود؟',
      start: function (n) { return 'عالی! ' + n + ' گرامر انتخاب شد. هر جمله فارسی را به آلمانی بنویس و Enter بزن. هر وقت خواستی، پنجره را ببند.'; },
      translate: 'به آلمانی ترجمه کن:', hint: 'راهنما', placeholder: 'ترجمه آلمانی را بنویس…', check: 'بررسی', skip: 'نمی‌دونم',
      correct: 'درسته! ✅', almost: 'تقریباً درسته 🟡', wrong: 'نه کاملاً ❌', solution: 'جواب درست:', shown: 'جواب این جمله:',
      thinking: 'در حال آماده‌سازی…', checking: 'در حال بررسی…', change: 'تغییر گرامرها', close: 'بستن',
      offline: 'هوش مصنوعی الان در دسترس نیست؛ از بانک جمله‌های داخلی ادامه می‌دهم. در این حالت جوابت با جمله‌های نمونه مقایسه می‌شود.',
      offlineFree: 'تمرین با بانک جمله‌های داخلی؛ جوابت با جمله‌های نمونه مقایسه می‌شود (بررسی هوشمند برای حساب پرمیوم).',
      back: 'هوش مصنوعی دوباره در دسترس است ✨', mine: 'جواب من هم درسته', mineOk: 'باشه، درست حساب شد 👍',
      typo: 'فقط یک اشتباه کوچک (املایی یا پایانه) داری.', compare: 'با جمله درست مقایسه کن؛ بخش‌های رنگی را ببین.',
      tip: 'نکته: ', noBank: 'بانک جمله‌ها بارگذاری نشد. اتصال اینترنت را بررسی کن.', retry: 'دوباره', score: 'امتیاز',
      ai: 'AI', bank: 'آفلاین'
    },
    en: {
      title: 'Grammar drill bot', sub: 'Persian sentence → German translation', open: 'Start practice',
      entry: 'Pick grammar topics; the bot gives you Persian sentences, you translate them into German and get a short correction.',
      hello: 'Hi! 👋 Which grammar topics do you want to practise? Tap to select, then press “Confirm”.',
      all: 'All', none: 'None', confirm: 'Confirm & start', pickFirst: 'Select at least one topic',
      themeTitle: 'Sentence topic', themeHint: 'Pick a topic or type your own; the sentences will be about it.',
      themeBank: 'Offline the built-in sentence bank is not topic-based, so the chosen topic is not applied.',
      themeBtn: 'Topic', themeCustom: 'Or type your own topic…', themeApply: 'Apply topic', themeAuto: 'Auto (random)',
      themeSet: function (t) { return 'Sentence topic: ' + t + '. The next sentence will be about it.'; },
      allTopics: 'All grammar topics', allHint: 'Asks a random question from every grammar topic; tap again to switch it off.',
      translating: 'Translating into German…', translated: 'German translation:',
      translateNeedsAI: 'Translating Persian needs the AI (Premium and an internet connection).',
      translateFailed: 'Translation failed; try again in a moment.',
      clearChat: 'History', clearAsk: 'Clear the message history and the score?',
      start: function (n) { return 'Great! ' + n + ' topics selected. Write each Persian sentence in German and press Enter. Close the window whenever you like.'; },
      translate: 'Translate into German:', hint: 'Hint', placeholder: 'Write the German translation…', check: 'Check', skip: "I don't know",
      correct: 'Correct! ✅', almost: 'Almost 🟡', wrong: 'Not quite ❌', solution: 'Correct answer:', shown: 'Answer:',
      thinking: 'Preparing…', checking: 'Checking…', change: 'Change topics', close: 'Close',
      offline: 'AI is not available right now; continuing with the built-in sentence bank. Answers are compared with model sentences.',
      offlineFree: 'Practising with the built-in sentence bank; answers are compared with model sentences (smart checking needs Premium).',
      back: 'AI is available again ✨', mine: 'My answer is correct too', mineOk: 'OK, counted as correct 👍',
      typo: 'Just one small mistake (spelling or ending).', compare: 'Compare with the correct sentence; see the highlighted parts.',
      tip: 'Tip: ', noBank: 'Could not load the sentence bank. Check your connection.', retry: 'Retry', score: 'Score',
      ai: 'AI', bank: 'offline'
    },
    de: {
      title: 'Grammatik-Trainer', sub: 'Persischer Satz → deutsche Übersetzung', open: 'Training starten',
      entry: 'Wähle Grammatikthemen; der Bot gibt persische Sätze, du übersetzt sie ins Deutsche und bekommst eine kurze Korrektur.',
      hello: 'Hallo! 👋 Welche Grammatik möchtest du üben? Tippe zum Auswählen und dann auf „Bestätigen“.',
      all: 'Alle', none: 'Keine', confirm: 'Bestätigen & starten', pickFirst: 'Wähle mindestens ein Thema',
      themeTitle: 'Thema der Sätze', themeHint: 'Wähle ein Thema oder tippe dein eigenes; die Sätze handeln dann davon.',
      themeBank: 'Offline ist die eingebaute Satzbank nicht thematisch, das gewählte Thema gilt dort nicht.',
      themeBtn: 'Thema', themeCustom: 'Oder eigenes Thema eintippen…', themeApply: 'Thema übernehmen', themeAuto: 'Automatisch',
      themeSet: function (t) { return 'Thema der Sätze: ' + t + '. Der nächste Satz handelt davon.'; },
      allTopics: 'Alle Grammatikthemen', allHint: 'Stellt zufällig Aufgaben aus allen Grammatikthemen; erneut tippen zum Ausschalten.',
      translating: 'Wird ins Deutsche übersetzt…', translated: 'Deutsche Übersetzung:',
      translateNeedsAI: 'Für die Übersetzung persischer Sätze wird die KI gebraucht (Premium und Internet).',
      translateFailed: 'Übersetzung fehlgeschlagen; bitte gleich erneut versuchen.',
      clearChat: 'Verlauf', clearAsk: 'Nachrichtenverlauf und Punkte löschen?',
      start: function (n) { return 'Super! ' + n + ' Themen gewählt. Übersetze jeden persischen Satz ins Deutsche und drücke Enter. Schließe das Fenster, wann du willst.'; },
      translate: 'Übersetze ins Deutsche:', hint: 'Tipp', placeholder: 'Deutsche Übersetzung schreiben…', check: 'Prüfen', skip: 'Weiß nicht',
      correct: 'Richtig! ✅', almost: 'Fast richtig 🟡', wrong: 'Nicht ganz ❌', solution: 'Richtige Lösung:', shown: 'Lösung:',
      thinking: 'Wird vorbereitet…', checking: 'Wird geprüft…', change: 'Themen ändern', close: 'Schließen',
      offline: 'Die KI ist gerade nicht erreichbar; weiter mit der eingebauten Satzbank. Antworten werden mit Mustersätzen verglichen.',
      offlineFree: 'Training mit der eingebauten Satzbank; Antworten werden mit Mustersätzen verglichen (KI-Prüfung mit Premium).',
      back: 'Die KI ist wieder verfügbar ✨', mine: 'Meine Antwort ist auch richtig', mineOk: 'OK, als richtig gezählt 👍',
      typo: 'Nur ein kleiner Fehler (Schreibung oder Endung).', compare: 'Vergleiche mit der richtigen Lösung; achte auf die markierten Stellen.',
      tip: 'Tipp: ', noBank: 'Satzbank konnte nicht geladen werden. Prüfe die Verbindung.', retry: 'Erneut', score: 'Punkte',
      ai: 'KI', bank: 'offline'
    }
  };
  function lang() { var l = uiLang(); return COPY[l] ? l : 'fa'; }
  function c() { return COPY[lang()]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function topicLabel(t) { return lang() === 'fa' ? t.fa + ' · ' + t.de : t.de; }
  function themeLabel(id) {
    var t = THEME[id];
    if (!t) return '';
    return lang() === 'fa' ? t.fa + ' · ' + t.de : (lang() === 'en' ? t.en : t.de);
  }
  function themeShort(t) { return t[lang()] || t.fa; }
  function themeName() { return st.themeText || themeLabel(st.theme); }
  function themeValue() { return st.themeText || st.theme; }
  function premium() { return !!env.premium(); }
  function accountEmail() { try { return String((env.data() || {}).user && (env.data().user.email || env.data().user.id) || ''); } catch (e) { return ''; } }

  /* ---------- state ---------- */
  var st = { open: false, phase: 'pick', selected: [], theme: '', themeText: '', queue: [], fetching: null, current: null, busy: false,
             stats: { ok: 0, total: 0 }, recent: [], recentIds: {}, aiPauseUntil: 0, aiMode: null, decks: {}, log: [], replay: false };
  function loadSelection() { try { var v = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); return Array.isArray(v) ? v.filter(function (x) { return TOPIC[x]; }) : []; } catch (e) { return []; } }
  /* ---------- session (2026-11-21): the chat survives closing the window ---------- */
  var SESSION_KEY = 'amookht_gd_session_v1';
  function sessionUser() { try { return accountEmail(); } catch (e) { return ''; } }
  function saveSession() {
    if (st.phase !== 'drill' || !st.log.length) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, u: sessionUser(), t: Date.now(), selected: st.selected, theme: st.theme, themeText: st.themeText, stats: st.stats,
        recent: st.recent.slice(-30), current: st.current, log: st.log.slice(-160) }));
    } catch (e) { /* storage unavailable */ }
  }
  function loadSession() {
    try {
      var d = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!d || d.v !== 1 || d.u !== sessionUser()) return null;
      if (!Array.isArray(d.log) || !d.log.length || !Array.isArray(d.selected) || !d.selected.length) return null;
      return d;
    } catch (e) { return null; }
  }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } }
  function saveSelection() { try { localStorage.setItem(LS_KEY, JSON.stringify(st.selected)); } catch (e) { /* private mode */ } }
  function loadTheme() {
    try {
      var raw = localStorage.getItem(THEME_KEY) || '';
      if (!raw) return { id: '', text: '' };
      if (raw.charAt(0) === '{') {
        var o = JSON.parse(raw) || {};
        return { id: THEME[o.id] ? o.id : '', text: typeof o.text === 'string' ? o.text.replace(/\s+/g, ' ').trim().slice(0, 60) : '' };
      }
      return { id: THEME[raw] ? raw : '', text: '' };
    } catch (e) { return { id: '', text: '' }; }
  }
  function saveTheme() { try { localStorage.setItem(THEME_KEY, JSON.stringify({ id: st.theme, text: st.themeText })); } catch (e) { /* private mode */ } }

  /* ---------- offline bank ---------- */
  function loadBank() { return env.loadPack('grammar'); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function bankItem(bank) {
    var topics = st.selected.filter(function (id) { return (bank.items[id] || []).length; });
    if (!topics.length) return null;
    var id = topics[Math.floor(Math.random() * topics.length)];
    var deck = st.decks[id];
    if (!deck || !deck.length) deck = st.decks[id] = shuffle(bank.items[id].map(function (_, i) { return i; }));
    var raw = bank.items[id][deck.pop()];
    return { topic: id, fa: raw.fa, de: raw.de, alt: raw.alt || [], hint: raw.hint || '', source: 'bank' };
  }

  /* ---------- AI ---------- */
  function aiAllowed() { return premium() && navigator.onLine !== false && Date.now() >= st.aiPauseUntil; }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(Object.assign(new Error('timeout'), { timeout: true })); }, ms); })]); }
  function aiFailed(err) {
    var status = err && err.status, retry = 60;
    try { retry = Number(err.details && err.details.retry_after) || 60; } catch (e) { /* ignore */ }
    st.aiPauseUntil = Date.now() + (status === 403 ? 3600e3 : Math.min(300, Math.max(30, retry)) * 1000);
  }
  function fetchAI() {
    if (st.fetching) return st.fetching;
    var topics = st.selected.slice(), theme = themeValue();
    st.fetching = withTimeout(apiRequest('/grammar-drill/sentences', { method: 'POST', body: JSON.stringify({ topics: topics, theme: theme, count: 4, avoid: st.recent.slice(-12) }) }), AI_TIMEOUT)
      .then(function (data) {
        var items = (data && data.items || []).filter(function (x) { return x && x.fa && x.de && topics.indexOf(x.topic) >= 0; });
        if (!items.length) throw new Error('no items');
        items.forEach(function (x) { x.source = 'ai'; x.alt = (x.alt || []).filter(function (a) { return !/[؀-ۿ]/.test(a); }); });
        if (sameSelection(topics, theme)) st.queue = st.queue.concat(items);
        return items;
      })
      .catch(function (err) { aiFailed(err); throw err; })
      .finally(function () { st.fetching = null; });
    return st.fetching;
  }
  function sameSelection(t, theme) { return t.join(',') === st.selected.join(',') && theme === themeValue(); }
  function prefetch() { if (aiAllowed() && st.queue.length < 2 && !st.fetching) fetchAI().catch(function () { /* fallback happens on demand */ }); }

  function nextItem() {
    if (st.queue.length) return Promise.resolve(st.queue.shift());
    var viaBank = function () { return loadBank().then(function (bank) { var it = bankItem(bank); if (!it) throw new Error('empty'); return it; }); };
    if (!aiAllowed()) return viaBank();
    return fetchAI().then(function () { return st.queue.shift() || viaBank(); }, viaBank);
  }

  /* ---------- local checking ---------- */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[„“”"'«»‚‘’`´.,!?;:()\[\]\-–—…\/]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function words(s) { var n = norm(s); return n ? n.split(' ') : []; }
  function lev(a, b, eq) {
    var m = a.length, n = b.length, prev = [], cur, i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function same(a, b) { return a === b; }
  function charLev(a, b) { return lev(a.split(''), b.split(''), same); }
  function localCheck(item, answer) {
    var cands = [item.de].concat(item.alt || []), aw = words(answer), best = null;
    cands.forEach(function (cand) {
      var cw = words(cand), d = lev(aw, cw, same);
      var typo = lev(aw, cw, function (x, y) { return x === y || (Math.min(x.length, y.length) >= 4 && charLev(x, y) <= 1); });
      if (!best || d < best.d || (d === best.d && typo < best.typo)) best = { cand: cand, d: d, typo: typo, len: cw.length };
    });
    if (best.d === 0) return { verdict: 'correct', correct: answer.trim(), note: '' };
    if (best.typo === 0) return { verdict: 'almost', correct: best.cand, note: c().typo };
    if (best.d === 1 && best.len >= 6) return { verdict: 'almost', correct: best.cand, note: c().compare };
    return { verdict: 'wrong', correct: best.cand, note: item.hint ? c().tip + item.hint : c().compare };
  }
  function diffHtml(correct, answer) {
    var have = {};
    words(answer).forEach(function (w) { have[w] = (have[w] || 0) + 1; });
    return String(correct).split(/(\s+)/).map(function (tok) {
      if (/^\s+$/.test(tok) || !tok) return tok;
      var w = norm(tok);
      if (!w || have[w]) { if (w) have[w]--; return esc(tok); }
      return '<mark>' + esc(tok) + '</mark>';
    }).join('');
  }
  function checkAnswer(item, answer) {
    var local = localCheck(item, answer);
    if (local.verdict === 'correct' || !aiAllowed()) return Promise.resolve(Object.assign(local, { offline: true }));
    return withTimeout(apiRequest('/grammar-drill/check', { method: 'POST', body: JSON.stringify({ topic: item.topic, fa: item.fa, de: item.de, answer: answer }) }), AI_TIMEOUT)
      .then(function (r) {
        if (!r || ['correct', 'almost', 'wrong'].indexOf(r.verdict) < 0) throw new Error('bad check');
        return { verdict: r.verdict, correct: r.correct || item.de, note: r.note || '', offline: false };
      })
      .catch(function (err) { aiFailed(err); noteMode(); return Object.assign(local, { offline: true }); });
  }

  /* ---------- UI ---------- */
  var root, logEl, footEl;
  function mount() {
    if (root && document.body.contains(root)) return;
    root = document.createElement('div');
    root.className = 'gd-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = '<div class="gd-panel" dir="' + (lang() === 'fa' ? 'rtl' : 'ltr') + '"><header class="gd-head"><div class="gd-avatar">🤖</div><div class="gd-titles"><b>' + esc(c().title) + '</b><small>' + esc(c().sub) + '</small></div><div class="gd-score" title="' + esc(c().score) + '"></div><button type="button" class="gd-hbtn gd-theme-btn">' + esc(c().themeBtn) + '</button><button type="button" class="gd-hbtn gd-change">' + esc(c().change) + '</button><button type="button" class="gd-hbtn gd-clear" title="' + esc(c().clearAsk) + '" aria-label="' + esc(c().clearChat) + '">🗑</button><button type="button" class="gd-x" aria-label="' + esc(c().close) + '">✕</button></header><div class="gd-log" aria-live="polite"></div><footer class="gd-foot"></footer></div>';
    document.body.appendChild(root);
    logEl = root.querySelector('.gd-log');
    footEl = root.querySelector('.gd-foot');
    root.querySelector('.gd-x').onclick = close;
    root.querySelector('.gd-change').onclick = function () { if (!st.busy) startPick(); };
    root.querySelector('.gd-theme-btn').onclick = startTheme;
    // GD-CLEAR-DIALOG: the same in-app glass dialog as every other confirmation (no native window.confirm)
    root.querySelector('.gd-clear').onclick = function () {
      if (st.busy) return;
      confirmDialog(c().clearAsk, { ok: c().clearChat }).then(function (yes) { if (yes) clearHistory(); });
    };
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } });
  }
  function scrollEnd() {
    if (!logEl) return;
    var toBottom = function () { if (logEl) logEl.scrollTop = logEl.scrollHeight; };
    toBottom();
    requestAnimationFrame(toBottom);
    setTimeout(toBottom, 90);
  }
  function bubble(html, who, cls) {
    var el = document.createElement('div');
    el.className = 'gd-msg gd-' + (who || 'bot') + (cls ? ' ' + cls : '');
    el.innerHTML = html;
    logEl.appendChild(el);
    if (!st.replay && st.phase === 'drill' && cls !== 'gd-typing' && !/\bgd-typing\b/.test(cls || '')) {
      st.log.push({ who: who || 'bot', cls: cls || '', html: html });
      if (st.log.length > 200) st.log.shift();
      saveSession();
    }
    scrollEnd();
    return el;
  }
  function typing(text) { return bubble('<span class="gd-dots"><i></i><i></i><i></i></span> ' + esc(text), 'bot', 'gd-typing'); }
  function updateScore() {
    var el = root && root.querySelector('.gd-score');
    if (el) el.textContent = st.stats.total ? st.stats.ok + ' / ' + st.stats.total : '';
    var ch = root && root.querySelector('.gd-change');
    if (ch) ch.hidden = st.phase !== 'drill';
    var th = root && root.querySelector('.gd-theme-btn');
    if (th) th.hidden = st.phase !== 'drill';
    var cl = root && root.querySelector('.gd-clear');
    if (cl) cl.hidden = st.phase !== 'drill';
  }
  function noteMode() {
    var mode = aiAllowed() ? 'ai' : 'bank';
    if (mode === st.aiMode) return;
    var first = st.aiMode === null;
    st.aiMode = mode;
    if (mode === 'bank') bubble(esc((premium() ? c().offline : c().offlineFree) + (themeValue() ? ' ' + c().themeBank : '')), 'bot', 'gd-info');
    else if (!first) bubble(esc(c().back), 'bot', 'gd-info');
  }

  function themeBoxHtml() {
    return '<section class="gd-group gd-theme"><div class="gd-group-head"><b>' + esc(c().themeTitle) + '</b></div><div class="gd-chips gd-theme-chips">' +
      THEMES.map(function (t) { return '<button type="button" class="gd-chip gd-tchip' + (!st.themeText && st.theme === t.id ? ' is-on' : '') + '" data-theme="' + t.id + '" aria-pressed="' + (!st.themeText && st.theme === t.id) + '">' + esc(themeShort(t)) + '</button>'; }).join('') +
      '</div><div class="gd-theme-custom"><input type="text" class="gd-theme-input" maxlength="60" autocomplete="off" value="' + esc(st.themeText) + '" placeholder="' + esc(c().themeCustom) + '"></div>' +
      '<p class="gd-theme-note">' + esc(c().themeHint) + '</p></section>';
  }
  function setTheme(id, text) {
    st.theme = id;
    st.themeText = text;
    st.queue = [];
    saveTheme();
  }
  function bindTheme(card) {
    var inp = card.querySelector('.gd-theme-input');
    if (!inp) return;
    inp.addEventListener('input', function () {
      var text = inp.value.replace(/\s+/g, ' ').trim().slice(0, 60);
      setTheme(text ? '' : st.theme, text);
      paintChips(card);
    });
  }
  /* change of topic/theme must drop the sentence still awaiting an answer,
     otherwise the learner types into the old question and only the second one is visible. */
  function dropPending() {
    if (!st.current) return;
    st.current = null;
    if (logEl) {
      var qs = logEl.querySelectorAll('.gd-q');
      if (qs.length) qs[qs.length - 1].remove();
    }
    for (var i = st.log.length - 1; i >= 0; i--) {
      if (String(st.log[i].cls || '').indexOf('gd-q') === 0) { st.log.splice(i, 1); break; }
    }
    saveSession();
  }
  function startTheme() {
    if (st.phase !== 'drill' || st.busy) return;
    var card = bubble(themeBoxHtml(), 'bot', 'gd-picker gd-picker-inline');
    st.log.pop();      /* picker UI, not chat history */
    saveSession();
    card.classList.add('is-live');
    bindTheme(card);
    card.addEventListener('click', function (e) {
      var tchip = e.target.closest('.gd-tchip');
      if (!tchip || st.busy) return;
      var inp = card.querySelector('.gd-theme-input');
      if (inp) inp.value = '';
      setTheme(tchip.dataset.theme, '');
      paintChips(card);
      var cnt = footEl.querySelector('.gd-count');
      if (cnt) cnt.textContent = themeName() || c().themeAuto;
    });
    footEl.innerHTML = '<div class="gd-pickbar"><span class="gd-count">' + esc(themeName() || c().themeAuto) + '</span><button type="button" class="gd-primary gd-theme-ok">' + esc(c().themeApply) + '</button></div>';
    footEl.querySelector('.gd-theme-ok').onclick = function () {
      card.classList.remove('is-live');
      card.remove();
      saveTheme();
      st.queue = [];
      dropPending();
      drillFooter();
      bubble(esc(c().themeSet(themeName() || c().themeAuto)), 'bot', 'gd-info');
      ask();
      setTimeout(function () { var ta = footEl.querySelector('textarea'); if (ta) ta.focus({ preventScroll: true }); }, 0);
    };
  }
  function clearHistory() {
    clearSession();
    st.log = [];
    st.stats = { ok: 0, total: 0 };
    st.recent = [];
    st.recentIds = {};
    st.current = null;
    st.queue = [];
    st.decks = {};
    st.aiMode = null;
    if (logEl) logEl.innerHTML = '';
    updateScore();
    if (!st.open) return;
    if (st.selected.length) {
      st.phase = 'drill';
      bubble(esc(c().start(st.selected.length)), 'bot');
      drillFooter();
      noteMode();
      ask();
    } else {
      startPick();
    }
  }
  function startPick() {
    st.phase = 'pick';
    st.current = null;
    updateScore();
    bubble(esc(c().hello), 'bot');
    var allBox = '<section class="gd-group gd-allbox"><button type="button" class="gd-chip gd-chip-all">' + esc(c().allTopics) + '</button><p class="gd-theme-note gd-all-note">' + esc(c().allHint) + '</p></section>';
    var card = bubble(themeBoxHtml() + allBox + GROUPS.map(function (g) {
      var list = TOPICS.filter(function (t) { return t.group === g.id; });
      return '<section class="gd-group"><div class="gd-group-head"><b>' + esc(g[lang()] || g.fa) + '</b><button type="button" class="gd-all" data-group="' + g.id + '">' + esc(c().all) + '</button></div><div class="gd-chips">' +
        list.map(function (t) { return '<button type="button" class="gd-chip' + (st.selected.indexOf(t.id) >= 0 ? ' is-on' : '') + '" data-topic="' + t.id + '" aria-pressed="' + (st.selected.indexOf(t.id) >= 0) + '">' + esc(topicLabel(t)) + '</button>'; }).join('') + '</div></section>';
    }).join(''), 'bot', 'gd-picker');
    card.addEventListener('click', function (e) {
      if (st.phase !== 'pick' || !card.classList.contains('is-live')) return;
      var tchip = e.target.closest('.gd-tchip');
      if (tchip) {
        var ti = card.querySelector('.gd-theme-input');
        if (ti) ti.value = '';
        setTheme(tchip.dataset.theme, '');
        paintChips(card);
        return;
      }
      if (e.target.closest('.gd-chip-all')) { toggleAll(); paintChips(card); return; }
      var chip = e.target.closest('.gd-chip'), all = e.target.closest('.gd-all');
      if (chip) toggle(chip.dataset.topic);
      if (all) {
        var ids = TOPICS.filter(function (t) { return t.group === all.dataset.group; }).map(function (t) { return t.id; });
        var on = ids.every(function (id) { return st.selected.indexOf(id) >= 0; });
        ids.forEach(function (id) { var i = st.selected.indexOf(id); if (on && i >= 0) st.selected.splice(i, 1); if (!on && i < 0) st.selected.push(id); });
      }
      if (chip || all) paintChips(card);
    });
    logEl.querySelectorAll('.gd-picker.is-live').forEach(function (old) { old.classList.remove('is-live'); });
    card.classList.add('is-live');
    bindTheme(card);
    paintChips(card);
    footEl.innerHTML = '<div class="gd-pickbar"><span class="gd-count"></span><button type="button" class="gd-primary gd-confirm">' + esc(c().confirm) + '</button></div>';
    footEl.querySelector('.gd-confirm').onclick = confirmPick;
    paintChips(card);
  }
  function toggle(id) { var i = st.selected.indexOf(id); if (i >= 0) st.selected.splice(i, 1); else st.selected.push(id); }
  function allSelected() { return TOPICS.every(function (t) { return st.selected.indexOf(t.id) >= 0; }); }
  function toggleAll() { st.selected = allSelected() ? [] : TOPICS.map(function (t) { return t.id; }); }
  function paintChips(card) {
    card.querySelectorAll('.gd-chip').forEach(function (b) {
      if (b.classList.contains('gd-tchip') || b.classList.contains('gd-chip-all')) return;
      var on = st.selected.indexOf(b.dataset.topic) >= 0; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
    });
    card.querySelectorAll('.gd-tchip').forEach(function (b) { var on = !st.themeText && st.theme === b.dataset.theme; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    card.querySelectorAll('.gd-chip-all').forEach(function (b) { var on = allSelected(); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    card.querySelectorAll('.gd-all').forEach(function (b) {
      var ids = TOPICS.filter(function (t) { return t.group === b.dataset.group; }).map(function (t) { return t.id; });
      b.textContent = ids.every(function (id) { return st.selected.indexOf(id) >= 0; }) ? c().none : c().all;
    });
    var btn = footEl && footEl.querySelector('.gd-confirm'), cnt = footEl && footEl.querySelector('.gd-count');
    if (btn) btn.disabled = !st.selected.length;
    if (cnt) cnt.textContent = st.selected.length ? st.selected.length + ' ✓' : c().pickFirst;
  }
  function confirmPick() {
    if (!st.selected.length) return;
    st.selected.sort(function (a, b) { return TOPICS.indexOf(TOPIC[a]) - TOPICS.indexOf(TOPIC[b]); });
    saveSelection();
    var live = logEl.querySelector('.gd-picker.is-live');
    if (live) live.classList.remove('is-live');
    logEl.querySelectorAll('.gd-picker').forEach(function (el) { el.remove(); });
    bubble(st.selected.map(function (id) { return '<span class="gd-tag">' + esc(topicLabel(TOPIC[id])) + '</span>'; }).join(' '), 'me', 'gd-tags');
    st.phase = 'drill';
    st.queue = [];
    st.decks = {};
    st.log = [];
    clearSession();
    updateScore();
    bubble(esc(c().start(st.selected.length)), 'bot');
    st.aiMode = null;
    noteMode();
    drillFooter();
    ask();
  }
  function drillFooter() {
    footEl.innerHTML = '<form class="gd-input"><textarea rows="2" dir="ltr" lang="de" spellcheck="false" autocapitalize="sentences" autocomplete="off" placeholder="' + esc(c().placeholder) + '"></textarea><div class="gd-actions"><button type="submit" class="gd-primary">' + esc(c().check) + '</button><button type="button" class="gd-ghost gd-skip">' + esc(c().skip) + '</button></div></form>';
    var form = footEl.querySelector('form'), ta = form.querySelector('textarea');
    form.onsubmit = function (e) { e.preventDefault(); submit(); };
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    form.querySelector('.gd-skip').onclick = skip;
  }
  function setBusy(on) {
    st.busy = on;
    if (!footEl) return;
    footEl.querySelectorAll('button').forEach(function (b) { b.disabled = on; });
  }
  function ask() {
    if (!st.open || st.phase !== 'drill') return;
    setBusy(true);
    var wait = typing(c().thinking), sel = st.selected.join(','), theme = themeValue();
    nextItem().then(function (item) {
      wait.remove();
      if (!st.open || st.phase !== 'drill' || sel !== st.selected.join(',') || theme !== themeValue()) return;
      noteMode();
      st.current = item;
      st.recent.push(item.de);
      if (st.recent.length > 30) st.recent.shift();
      var t = TOPIC[item.topic] || { fa: item.topic, de: item.topic };
      var el = bubble('<div class="gd-qhead"><span class="gd-tag">' + esc(topicLabel(t)) + '</span>' + (item.source === 'ai' && themeValue() ? '<span class="gd-tag gd-tag-theme">' + esc(themeName()) + '</span>' : '') + '<span class="gd-src gd-src-' + item.source + '">' + esc(item.source === 'ai' ? c().ai : c().bank) + '</span></div><small>' + esc(c().translate) + '</small><p class="gd-fa" dir="rtl" lang="fa">' + esc(item.fa) + '</p>' +
        (item.hint ? '<button type="button" class="gd-hint-btn">💡 ' + esc(c().hint) + '</button><span class="gd-hint" dir="auto" hidden>' + esc(item.hint) + '</span>' : ''), 'bot', 'gd-q');
      var hb = el.querySelector('.gd-hint-btn');
      if (hb) hb.onclick = function () { hb.hidden = true; el.querySelector('.gd-hint').hidden = false; scrollEnd(); };
      setBusy(false);
      var ta = footEl.querySelector('textarea');
      if (ta) { ta.value = ''; ta.focus({ preventScroll: true }); }
      scrollEnd();
      setTimeout(scrollEnd, 220);
      prefetch();
    }, function () {
      wait.remove();
      setBusy(false);
      var el = bubble(esc(c().noBank) + ' <button type="button" class="gd-ghost">' + esc(c().retry) + '</button>', 'bot', 'gd-info');
      el.querySelector('button').onclick = function () { el.remove(); ask(); };
    });
  }
  /* Persian text in the answer box = “translate this for me”, not a German answer. */
  function isPersian(text) {
    var fa = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
    if (fa < 3) return false;
    var latin = (String(text).match(/[A-Za-zÄÖÜäöüß]/g) || []).length;
    return fa >= latin;
  }
  function translateFa(text) {
    if (!st.open || st.busy) return;
    var ta = footEl.querySelector('textarea');
    var mine = bubble(esc(text), 'me', 'gd-answer');
    mine.dir = 'rtl';
    mine.lang = 'fa';
    if (ta) { ta.value = ''; ta.focus({ preventScroll: true }); }
    if (!aiAllowed()) { bubble(esc(c().translateNeedsAI), 'bot', 'gd-info'); return; }
    setBusy(true);
    var wait = typing(c().translating);
    withTimeout(apiRequest('/grammar-drill/translate', { method: 'POST', body: JSON.stringify({ fa: text }) }), AI_TIMEOUT)
      .then(function (r) {
        wait.remove();
        if (!r || !r.de) throw new Error('bad translate');
        bubble('<small>' + esc(c().translated) + '</small><p dir="ltr" lang="de" class="gd-solo">' + esc(r.de) + '</p>', 'bot', 'gd-res');
        setBusy(false);
        var t = footEl.querySelector('textarea');
        if (t) t.focus({ preventScroll: true });
      })
      .catch(function (err) {
        wait.remove();
        aiFailed(err);
        bubble(esc(c().translateFailed), 'bot', 'gd-info');
        setBusy(false);
      });
  }
  function submit() {
    var ta = footEl.querySelector('textarea'), answer = ta ? ta.value.trim() : '', item = st.current;
    if (!answer || !item || st.busy) return;
    if (isPersian(answer)) { translateFa(answer); return; }
    st.current = null;
    var mineEl = bubble(esc(answer), 'me', 'gd-answer');
    mineEl.dir = 'ltr';
    mineEl.lang = 'de';
    ta.value = '';
    setBusy(true);
    var wait = typing(c().checking);
    checkAnswer(item, answer).then(function (r) {
      wait.remove();
      st.stats.total++;
      if (r.verdict === 'correct') st.stats.ok++;
      updateScore();
      var label = r.verdict === 'correct' ? c().correct : r.verdict === 'almost' ? c().almost : c().wrong;
      var html = '<b class="gd-verdict">' + esc(label) + '</b>';
      if (r.verdict !== 'correct') html += '<div class="gd-sol"><small>' + esc(c().solution) + '</small><p dir="ltr" lang="de">' + diffHtml(r.correct, answer) + '</p></div>';
      if (r.note) html += '<p class="gd-note" dir="auto">' + esc(r.note) + '</p>';
      if (r.offline && r.verdict !== 'correct') html += '<button type="button" class="gd-ghost gd-mine">' + esc(c().mine) + '</button>';
      var el = bubble(html, 'bot', 'gd-res gd-' + r.verdict);
      var mine = el.querySelector('.gd-mine');
      if (mine) mine.onclick = function () { st.stats.ok++; updateScore(); mine.outerHTML = '<small class="gd-note">' + esc(c().mineOk) + '</small>'; };
      setBusy(false);
      ask();
    });
  }
  function skip() {
    var item = st.current;
    if (!item || st.busy) return;
    st.current = null;
    st.stats.total++;
    updateScore();
    bubble('<small>' + esc(c().shown) + '</small><p dir="ltr" lang="de" class="gd-solo">' + esc(item.de) + '</p>' + (item.hint ? '<p class="gd-note" dir="auto">' + esc(c().tip + item.hint) + '</p>' : ''), 'bot', 'gd-res gd-wrong');
    ask();
  }

  function open() {
    if (st.open) return;
    st.open = true;
    st.selected = st.selected.length ? st.selected : loadSelection();
    if (!st.theme && !st.themeText) {
      var thm = loadTheme();
      st.theme = thm.id;
      st.themeText = thm.text;
    }
    st.stats = { ok: 0, total: 0 };
    mount();
    logEl.innerHTML = '';
    document.documentElement.classList.add('gd-lock');
    var saved = loadSession();
    if (saved) {
      st.selected = saved.selected.filter(function (x) { return TOPIC[x]; });
      st.theme = THEME[saved.theme] ? saved.theme : st.theme;
      if (typeof saved.themeText === 'string') st.themeText = saved.themeText.slice(0, 60);
      if (!st.selected.length) saved = null;
    }
    if (!saved && st.log.length && st.selected.length) {
      saved = { log: st.log, selected: st.selected, theme: st.theme, stats: st.stats, recent: st.recent, current: st.current };
    }
    if (saved) {
      st.stats = saved.stats && typeof saved.stats.ok === 'number' ? { ok: saved.stats.ok, total: saved.stats.total } : { ok: 0, total: 0 };
      st.recent = Array.isArray(saved.recent) ? saved.recent.slice(-30) : [];
      st.current = saved.current || null;
      st.recentIds = {};
      st.phase = 'drill';
      st.replay = true;
      saved.log.forEach(function (m) { bubble(m.html, m.who, m.cls); });
      st.replay = false;
      st.log = saved.log.slice(-160);
      updateScore();
      drillFooter();
      if (!st.current) ask();
      else { var ta = footEl.querySelector('textarea'); if (ta) ta.focus({ preventScroll: true }); }
    } else {
      st.log = [];
      startPick();
    }
    loadBank().catch(function () { /* retried on demand */ });
    setTimeout(function () { var b = root.querySelector('.gd-confirm'); if (b) b.focus({ preventScroll: true }); }, 50);
  }
  function close() {
    saveSession();
    st.open = false;
    st.phase = 'pick';
    st.current = null;
    st.queue = [];
    document.documentElement.classList.remove('gd-lock');
    if (root) { root.remove(); root = null; }
  }

  /* ---------- entry card: «اجرای برنامه» → tab «مطالعه آزاد» (right under the plan/free tab bar) ---------- */
  function entryCard() {
    return '<section class="slide-up gd-entry gd-entry-exec" data-learning-content dir="' + (lang() === 'fa' ? 'rtl' : 'ltr') + '"><div class="gd-entry-icon">🤖</div><div class="gd-entry-text"><b>' + esc(c().title) + '</b><p>' + esc(c().entry) + '</p></div><button type="button" class="gd-entry-btn" data-gd-open="1">' + esc(c().open) + ' ←</button></section>';
  }

  window.addEventListener('online', function () { if (st.open && st.phase === 'drill' && premium()) { st.aiPauseUntil = 0; } });
  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') saveSession(); });
  return { open: open, close: close, entryCard: entryCard, clearHistory: clearHistory, localCheck: localCheck, state: st, version: VER };
}
