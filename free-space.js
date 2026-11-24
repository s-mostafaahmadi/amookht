/* Amookht — «مطالعه آزاد» tab of «اجرای برنامه» (2026-11-13, owner request)
   A relaxed, playful space: no timing, no exam focus, no heavy texts. The learner picks a topic and plays short, light games
   (pairs, der/die/das, meaning quiz, letter scramble, sentence builder, phrases) + the grammar bot (grammar-drill.js).
   Only active while TDM.studyMode() === 'free'; the TestDaF tab is untouched.
   Data: /free-games-bank.js (window.FG_BANK, lazy) + /grammar-drill-bank.js is NOT needed.
   Uses main-app globals: S, render, renderDashboard, navigateApp, TDM, TOPIC_TREE. */
(function () {
  'use strict';
  var VER = '20261113f5';
  var BANK_URL = '/free-games-bank.js?v=20261121c1';
  var LS_TOPIC = 'amookht_fs_topic', LS_BEST = 'amookht_fs_best', LS_LEVEL = 'amookht_fs_level';

  /* ---------- copy ---------- */
  var COPY = {
    fa: {
      eyebrow: 'فضای آزاد', title: 'امروز چی تمرین کنیم؟',
      sub: 'تمرین‌های کوتاه و سبک، بدون زمان‌بندی و بدون فکر آزمون. هر وقت خواستی ول کن و برگرد.',
      level: 'سطح', levels: ['آسان', 'متوسط', 'سخت'], levelHint: ['A1–A2', 'B1–B2', 'C1–C2'],
      topic: 'موضوع', allTopics: 'همه موضوع‌ها', change: 'تغییر', pickTopic: 'موضوع دلخواهت رو انتخاب کن',
      surprise: '🎲 یه تمرین تصادفی', games: 'تمرین‌ها', tools: 'ابزارهای کمکی', play: 'شروع',
      loading: 'دارم تمرین رو آماده می‌کنم…', loadFail: 'بانک تمرین‌ها بارگذاری نشد. اینترنت را بررسی کن و دوباره امتحان کن.', retry: 'دوباره',
      close: 'بستن', next: 'بعدی', check: 'بررسی', skip: 'رد کن', hint: 'راهنما', undo: 'پاک کن',
      great: ['آفرین! 👏', 'عالی! 🌟', 'دمت گرم! 🔥', 'درسته! ✨'], wrongIs: 'جواب درست:',
      endTitle: function (s) { return s >= 3 ? 'فوق‌العاده بود! 🎉' : s === 2 ? 'خیلی خوب بود! 👏' : 'خوب بود، یه دور دیگه؟ 🙂'; },
      endSub: function (ok, n) { return fa(ok) + ' از ' + fa(n) + ' درست'; }, again: 'یه دور دیگه', other: 'تمرین دیگه',
      streak: function (n) { return fa(n) + ' تا پشت سر هم 🔥'; }, tapPairs: 'هر کلمه رو به معنیش وصل کن',
      whichArt: 'آرتیکل درست کدومه؟', whichMean: 'معنی این کدومه؟', whichDe: 'آلمانیش کدومه؟', buildWord: 'حروف رو به ترتیب بزن',
      buildSent: 'کلمه‌ها رو به ترتیب درست بچین', phraseQ: 'کدوم عبارت آلمانی این معنی رو داره؟', noData: 'برای این موضوع هنوز محتوای کافی نیست؛ «همه موضوع‌ها» رو امتحان کن.'
    },
    en: {
      eyebrow: 'FREE SPACE', title: 'What shall we practise today?',
      sub: 'Short, light exercises — no timing, no exam pressure. Stop whenever you like.',
      level: 'Level', levels: ['Easy', 'Medium', 'Hard'], levelHint: ['A1–A2', 'B1–B2', 'C1–C2'],
      topic: 'Topic', allTopics: 'All topics', change: 'Change', pickTopic: 'Pick a topic you like',
      surprise: '🎲 Random exercise', games: 'Exercises', tools: 'Helpful tools', play: 'Start',
      loading: 'Getting the exercise ready…', loadFail: 'Could not load the exercises. Check your connection and try again.', retry: 'Retry',
      close: 'Close', next: 'Next', check: 'Check', skip: 'Skip', hint: 'Hint', undo: 'Undo',
      great: ['Nice! 👏', 'Great! 🌟', 'You got it! 🔥', 'Correct! ✨'], wrongIs: 'Correct answer:',
      endTitle: function (s) { return s >= 3 ? 'Amazing! 🎉' : s === 2 ? 'Well done! 👏' : 'Good — one more round? 🙂'; },
      endSub: function (ok, n) { return ok + ' of ' + n + ' correct'; }, again: 'Play again', other: 'Other exercise',
      streak: function (n) { return n + ' in a row 🔥'; }, tapPairs: 'Match each word with its meaning',
      whichArt: 'Which article?', whichMean: 'What does it mean?', whichDe: 'Which is the German word?', buildWord: 'Tap the letters in order',
      buildSent: 'Put the words in the right order', phraseQ: 'Which German phrase means this?', noData: 'Not enough content for this topic yet — try “All topics”.'
    },
    de: {
      eyebrow: 'FREIRAUM', title: 'Was üben wir heute?',
      sub: 'Kurze, leichte Übungen – ohne Zeitvorgabe und ohne Prüfungsdruck. Hör auf, wann du willst.',
      level: 'Niveau', levels: ['Leicht', 'Mittel', 'Schwer'], levelHint: ['A1–A2', 'B1–B2', 'C1–C2'],
      topic: 'Thema', allTopics: 'Alle Themen', change: 'Ändern', pickTopic: 'Wähle ein Thema, das dich interessiert',
      surprise: '🎲 Zufallsübung', games: 'Übungen', tools: 'Hilfreiche Werkzeuge', play: 'Starten',
      loading: 'Übung wird vorbereitet …', loadFail: 'Die Übungen konnten nicht geladen werden. Bitte Verbindung prüfen.', retry: 'Nochmal',
      close: 'Schließen', next: 'Weiter', check: 'Prüfen', skip: 'Überspringen', hint: 'Tipp', undo: 'Zurück',
      great: ['Super! 👏', 'Klasse! 🌟', 'Richtig! 🔥', 'Genau! ✨'], wrongIs: 'Richtig wäre:',
      endTitle: function (s) { return s >= 3 ? 'Fantastisch! 🎉' : s === 2 ? 'Gut gemacht! 👏' : 'Gut – noch eine Runde? 🙂'; },
      endSub: function (ok, n) { return ok + ' von ' + n + ' richtig'; }, again: 'Noch eine Runde', other: 'Andere Übung',
      streak: function (n) { return n + ' in Folge 🔥'; }, tapPairs: 'Verbinde jedes Wort mit seiner Bedeutung',
      whichArt: 'Welcher Artikel?', whichMean: 'Was bedeutet das?', whichDe: 'Wie heißt das auf Deutsch?', buildWord: 'Tippe die Buchstaben der Reihe nach',
      buildSent: 'Bring die Wörter in die richtige Reihenfolge', phraseQ: 'Welche deutsche Wendung passt?', noData: 'Für dieses Thema gibt es noch zu wenig Inhalt – probier „Alle Themen“.'
    }
  };
  var GAMES = [
    { id: 'pairs', ico: '🃏', c: '#8b5cf6', fa: ['جفت‌یابی', 'کلمه‌ها رو به معنیشون وصل کن'], en: ['Pairs', 'Match words and meanings'], de: ['Paare', 'Wörter und Bedeutungen verbinden'] },
    { id: 'artikel', ico: '🎨', c: '#f43f5e', fa: ['der · die · das', 'آرتیکل درست رو حدس بزن'], en: ['der · die · das', 'Guess the right article'], de: ['der · die · das', 'Den richtigen Artikel raten'] },
    { id: 'quiz', ico: '⚡', c: '#f59e0b', fa: ['معنی‌یاب', 'معنی درست رو سریع پیدا کن'], en: ['Meaning hunt', 'Find the right meaning'], de: ['Bedeutungsjagd', 'Die richtige Bedeutung finden'] },
    { id: 'scramble', ico: '🔤', c: '#0ea5e9', fa: ['حروف درهم', 'کلمه رو از حروف بساز'], en: ['Letter mix', 'Build the word from letters'], de: ['Buchstabensalat', 'Das Wort zusammensetzen'] },
    { id: 'builder', ico: '🧱', c: '#22c55e', fa: ['جمله‌ساز', 'کلمه‌ها رو بچین، جمله بساز'], en: ['Sentence builder', 'Order the words'], de: ['Satzbau', 'Wörter ordnen'] },
    { id: 'phrases', ico: '💬', c: '#14b8a6', fa: ['عبارت‌ها', 'عبارت‌های پرکاربرد روزمره'], en: ['Phrases', 'Handy everyday phrases'], de: ['Wendungen', 'Nützliche Alltagswendungen'] }
  ];
  var TOOLS = [
    { go: 'errorbook', ico: '📝', fa: ['دفتر عبارات', 'اشتباه‌ها و عبارت‌هات رو مرور کن'], en: ['Notebook', 'Your mistakes and phrases'], de: ['Fehlerbuch', 'Fehler und Ausdrücke'] },
    { go: 'favorites', ico: '⭐', fa: ['علاقه‌مندی‌ها', 'چیزهایی که نشون کردی'], en: ['Favourites', 'Things you saved'], de: ['Favoriten', 'Was du gespeichert hast'] },
    { go: 'library', ico: '🗂️', fa: ['کتابخانه و یادداشت', 'یادداشت‌ها و فایل‌های خودت'], en: ['Library & notes', 'Your notes and files'], de: ['Bibliothek & Notizen', 'Deine Notizen und Dateien'] }
  ];
  var TOPIC_FA = {
    umwelt: 'محیط زیست و اقلیم', bildung: 'آموزش و دانشگاه', technik: 'فناوری و دیجیتال', gesellschaft: 'جامعه و فرهنگ', gesundheit: 'سلامت و ورزش',
    arbeit: 'کار و اقتصاد', energie: 'انرژی و حمل‌ونقل', medien: 'رسانه و ارتباطات', einkaufen: 'خرید', freizeit: 'اوقات فراغت و سرگرمی', reisen: 'سفر و تعطیلات',
    treffen: 'دیدار و دوستان', wohnen: 'خانه و زندگی', essen: 'خوردن و نوشیدن', verkehr: 'رفت‌وآمد و حمل‌ونقل عمومی', 'behörden': 'اداره و پست',
    informatik: 'کامپیوتر و IT', medizin: 'پزشکی و پرستاری', ingenieur: 'مهندسی و فنی', 'pädagogik': 'آموزش و تدریس', bewerbung: 'درخواست کار و مصاحبه',
    kaufmann: 'اداری و بازرگانی', handwerk: 'کار فنی و عملی', 'präsentation': 'ارائه و جلسه'
  };
  var GROUP_FA = { testdaf: 'دانشگاهی', alltag: 'روزمره', beruf: 'شغلی' };

  /* ---------- helpers ---------- */
  function lang() { try { var l = (typeof S !== 'undefined' && S && S.uiLanguage) || 'fa'; return COPY[l] ? l : 'fa'; } catch (e) { return 'fa'; } }
  function c() { return COPY[lang()]; }
  function fa(n) { return lang() === 'fa' ? String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }) : String(n); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a, n) { return shuffle(a).slice(0, n); }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function isFree() {
    try { return typeof S !== 'undefined' && !!S.user && window.TDM && typeof TDM.studyMode === 'function' && TDM.enrolled() && TDM.studyMode() === 'free'; } catch (e) { return false; }
  }
  function topicList() {
    var out = [];
    try { (window.TOPIC_TREE || (typeof TOPIC_TREE !== 'undefined' ? TOPIC_TREE : [])).forEach(function (g) { (g.children || []).forEach(function (ch) { out.push({ id: ch.id, de: ch.label, group: g.id }); }); }); } catch (e) { /* ignore */ }
    if (!out.length) Object.keys(TOPIC_FA).forEach(function (id) { out.push({ id: id, de: id, group: '' }); });
    return out;
  }
  function topicId() {
    var t = lsGet(LS_TOPIC, '');
    if (t === 'all') return 'all';
    if (t && TOPIC_FA[t]) return t;
    try { if (S.user && TOPIC_FA[S.user.subtopic]) return S.user.subtopic; } catch (e) { /* ignore */ }
    return 'all';
  }
  function topicName(id) {
    if (id === 'all') return c().allTopics;
    if (lang() === 'fa') return TOPIC_FA[id] || id;
    var t = topicList().find(function (x) { return x.id === id; });
    return t ? t.de : id;
  }
  function level() { var raw = lsGet(LS_LEVEL, ''); if (!raw) { try { var u = String((S.user && S.user.level) || 'B2'); raw = /A1|A2/.test(u) ? '1' : /C1|C2/.test(u) ? '3' : '2'; } catch (e) { raw = '2'; } } var v = +raw; /*LEVEL-PREF*/ return v === 1 || v === 3 ? v : 2; }
  function setLevel(v) { lsSet(LS_LEVEL, String(v === 1 || v === 3 ? v : 2)); try { if (isFree() && S.screen === 'dashboard') render(); } catch (e) { /* ignore */ } }
  function levelBar() {
    var L = level();
    return '<div class="fs-levels" role="radiogroup" aria-label="' + esc(c().level) + '"><span>' + esc(c().level) + ':</span>' + [1, 2, 3].map(function (v) {
      return '<button type="button" role="radio" aria-checked="' + (v === L) + '" class="fs-lv lv' + v + (v === L ? ' is-on' : '') + '" onclick="FreeSpace.setLevel(' + v + ')"><b>' + esc(c().levels[v - 1]) + '</b><small dir="ltr">' + esc(c().levelHint[v - 1]) + '</small></button>';
    }).join('') + '</div>';
  }
  function best() { try { return JSON.parse(lsGet(LS_BEST, '{}')) || {}; } catch (e) { return {}; } }
  function stars(n) { return '<span class="fs-stars" aria-label="' + n + '/3">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '">★</i>'; }).join('') + '</span>'; }
  function say(text) {
    try { if (!window.speechSynthesis) return; var u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.92; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* ignore */ }
  }

  /* ---------- free-space dashboard content ---------- */
  function gameTile(g) {
    var names = g[lang()], b = best()[g.id + ':' + level()] || 0;
    return '<button type="button" class="fs-tile" style="--fs-c:' + g.c + '" onclick="FreeSpace.play(\'' + g.id + '\')">'
      + '<span class="fs-tile-ico" aria-hidden="true">' + g.ico + '</span>'
      + '<span class="fs-tile-txt"><b dir="auto">' + esc(names[0]) + '</b><small>' + esc(names[1]) + '</small></span>'
      + '<span class="fs-tile-foot"><em class="fs-tile-badge">' + esc(c().play) + ' ▸</em>' + (b ? stars(b) : '') + '</span></button>';
  }
  function toolCard(x) {
    var names = x[lang()];
    return '<button type="button" class="fs-tool" onclick="navigateApp(\'' + x.go + '\')"><span aria-hidden="true">' + x.ico + '</span><span><b>' + esc(names[0]) + '</b><small>' + esc(names[1]) + '</small></span></button>';
  }
  function content() {
    var dir = lang() === 'fa' ? 'rtl' : 'ltr', tid = topicId();
    return '<section class="slide-up fs-space" data-learning-content dir="' + dir + '">'
      + '<header class="fs-hero"><div><span class="fs-eyebrow">🌿 ' + esc(c().eyebrow) + '</span><h2>' + esc(c().title) + '</h2><p>' + esc(c().sub) + '</p>'
      + '<button type="button" class="fs-topic-chip" onclick="FreeSpace.topics()"><span>' + esc(c().topic) + ':</span> <b dir="auto">' + esc(topicName(tid)) + '</b> <i>' + esc(c().change) + ' ▾</i></button>' + levelBar() + '</div>'
      + '<button type="button" class="fs-surprise" onclick="FreeSpace.surprise()">' + esc(c().surprise) + '</button></header>'
      + '<h3 class="fs-h">' + esc(c().games) + '</h3><div class="fs-grid">' + GAMES.map(gameTile).join('') + '</div>'
      + '<h3 class="fs-h">' + esc(c().tools) + '</h3><div class="fs-tools">' + TOOLS.map(toolCard).join('') + '</div>'
      + '</section>';
  }

  /* ---------- overlay ---------- */
  var root = null, G = null;
  function overlay(inner, cls) {
    if (!root) {
      root = document.createElement('div');
      root.className = 'fg-root';
      root.addEventListener('click', function (e) { if (e.target === root) close(); });
      document.body.appendChild(root);
      document.addEventListener('keydown', onKey);
    }
    root.setAttribute('dir', lang() === 'fa' ? 'rtl' : 'ltr');
    root.innerHTML = '<div class="fg-card ' + (cls || '') + '" role="dialog" aria-modal="true">' + inner + '</div>';
    document.documentElement.classList.add('fg-lock');
  }
  function close() {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    G = null;
    if (root) { root.remove(); root = null; document.removeEventListener('keydown', onKey); }
    document.documentElement.classList.remove('fg-lock');
    try { if (isFree() && S.screen === 'dashboard') render(); } catch (e) { /* ignore */ }
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  /* topic picker */
  function topics() {
    var tid = topicId(), groups = {}, order = [];
    topicList().forEach(function (t) { if (!groups[t.group]) { groups[t.group] = []; order.push(t.group); } groups[t.group].push(t); });
    var chip = function (id, label) { return '<button type="button" class="fg-topic ' + (id === tid ? 'is-on' : '') + '" onclick="FreeSpace.setTopic(\'' + id + '\')" dir="auto">' + esc(label) + '</button>'; };
    var html = '<header class="fg-head"><b>' + esc(c().pickTopic) + '</b><button type="button" class="fg-x" onclick="FreeSpace.close()" aria-label="' + esc(c().close) + '">✕</button></header>'
      + '<div class="fg-body fg-topics"><div class="fg-topic-row">' + chip('all', '🎲 ' + c().allTopics) + '</div>'
      + order.map(function (g) {
        return '<h4>' + esc(lang() === 'fa' ? (GROUP_FA[g] || g) : (g.charAt(0).toUpperCase() + g.slice(1))) + '</h4><div class="fg-topic-row">' + groups[g].map(function (t) { return chip(t.id, topicName(t.id)); }).join('') + '</div>';
      }).join('') + '</div>';
    overlay(html, 'fg-topic-card');
  }
  function setTopic(id) { lsSet(LS_TOPIC, id === 'all' || TOPIC_FA[id] ? id : 'all'); close(); }

  /* data */
  var bankPromise = null;
  function loadBank() {
    if (window.FG_BANK) return Promise.resolve(window.FG_BANK);
    if (bankPromise) return bankPromise;
    bankPromise = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = BANK_URL; s.async = true;
      s.onload = function () { window.FG_BANK ? res(window.FG_BANK) : rej(new Error('empty')); };
      s.onerror = function () { bankPromise = null; s.remove(); rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return bankPromise;
  }
  // items carry lv: 1 = A1–A2, 2 = B1–B2, 3 = C1–C2. Topic first, then the same level from other topics; a neighbouring
  // level only if a level is still too thin (never easier items in «سخت»).
  function pool(kind, lv) {
    var B = window.FG_BANK && window.FG_BANK.topics || {}, tid = topicId(), L = lv || level();
    var of = function (k, want) { return ((B[k] || {})[kind] || []).filter(function (x) { return (x.lv || 2) === want; }); };
    var list = tid !== 'all' && B[tid] ? of(tid, L) : [];
    if (list.length < 12) Object.keys(B).forEach(function (k) { if (k !== tid) list = list.concat(of(k, L)); });
    if (list.length < 12 && L !== 3) Object.keys(B).forEach(function (k) { list = list.concat(of(k, 2)); });
    return list;
  }

  /* ---------- games ---------- */
  var ROUNDS = { pairs: 3, artikel: 10, quiz: 10, scramble: 6, builder: 6, phrases: 8 };
  function play(id) {
    if (!GAMES.some(function (g) { return g.id === id; })) return;
    overlay('<div class="fg-loading"><i></i><i></i><i></i><p>' + esc(c().loading) + '</p></div>', 'fg-game');
    loadBank().then(function () { start(id); }).catch(function () {
      overlay('<header class="fg-head"><b>🙈</b><button type="button" class="fg-x" onclick="FreeSpace.close()">✕</button></header><div class="fg-body"><p class="fg-msg">' + esc(c().loadFail) + '</p><button type="button" class="fg-btn" onclick="FreeSpace.play(\'' + id + '\')">' + esc(c().retry) + '</button></div>', 'fg-game');
    });
  }
  function start(id) {
    var lv = level(), words = pool('words', lv), rounds = [], n = ROUNDS[id], maxLen = lv === 3 ? 16 : 11, maxWords = lv === 3 ? 12 : 9;
    if (id === 'pairs') { for (var r = 0; r < n; r++) rounds.push(pick(words, 5)); }
    else if (id === 'artikel') rounds = pick(words.filter(function (w) { return /^(der|die|das)$/.test(w.art); }), n);
    else if (id === 'quiz') rounds = pick(words, n).map(function (w, i) { return { w: w, rev: i % 2 === 1 }; });
    else if (id === 'scramble') rounds = pick(words.filter(function (w) { return w.de.length <= maxLen && /^[A-Za-zÄÖÜäöüß]{3,}$/.test(w.de); }), n);
    else if (id === 'builder') rounds = pick(pool('sentences', lv).filter(function (s) { var k = s.de.split(/\s+/).length; return k >= 3 && k <= maxWords; }), n);
    else if (id === 'phrases') rounds = pick(pool('phrases', lv), n);
    if (rounds.length < Math.min(3, n)) {
      overlay('<header class="fg-head"><b>🙈</b><button type="button" class="fg-x" onclick="FreeSpace.close()">✕</button></header><div class="fg-body"><p class="fg-msg">' + esc(c().noData) + '</p><button type="button" class="fg-btn" onclick="FreeSpace.topics()">' + esc(c().change) + '</button></div>', 'fg-game');
      return;
    }
    G = { id: id, lv: lv, rounds: rounds, i: 0, ok: 0, total: 0, streak: 0, words: words, state: null };
    round();
  }
  function head() {
    var g = GAMES.find(function (x) { return x.id === G.id; }), names = g[lang()];
    var dots = G.rounds.map(function (_, i) { return '<i class="' + (i < G.i ? 'done' : i === G.i ? 'cur' : '') + '"></i>'; }).join('');
    return '<header class="fg-head"><span class="fg-gico" style="--fs-c:' + g.c + '">' + g.ico + '</span><b dir="auto">' + esc(names[0]) + '</b><em class="fg-lv lv' + G.lv + '">' + esc(c().levels[G.lv - 1]) + '</em><span class="fg-dots">' + dots + '</span>'
      + '<button type="button" class="fg-x" onclick="FreeSpace.close()" aria-label="' + esc(c().close) + '">✕</button></header>';
  }
  function streakHtml() { return G.streak >= 3 ? '<p class="fg-streak">' + esc(c().streak(G.streak)) + '</p>' : ''; }
  function praise() { var a = c().great; return a[Math.floor(Math.random() * a.length)]; }
  function speakBtn(text) { return '<button type="button" class="fg-say" onclick="FreeSpace._say(this)" data-t="' + esc(text) + '" aria-label="🔊">🔊</button>'; }
  function deLabel(w) { return (w.art ? w.art + ' ' : '') + w.de; }
  function options(correct, list, key, n) {
    var seen = {}, out = [correct];
    seen[String(correct[key]).toLowerCase()] = 1;
    shuffle(list).some(function (x) { var k = String(x[key]).toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(x); } return out.length >= n; });
    return shuffle(out);
  }

  function round() {
    if (!G) return;
    if (G.i >= G.rounds.length) return end();
    var R = G.rounds[G.i], body = '';
    G.state = { answered: false };
    if (G.id === 'pairs') {
      G.state = { left: shuffle(R), right: shuffle(R), sel: null, matched: {}, miss: 0 };
      body = '<p class="fg-q">' + esc(c().tapPairs) + '</p><div class="fg-pairs"><div>' + G.state.left.map(function (w, i) { return '<button type="button" class="fg-pair" data-side="l" data-k="' + i + '" dir="ltr" onclick="FreeSpace._pair(this)">' + esc(deLabel(w)) + '</button>'; }).join('')
        + '</div><div>' + G.state.right.map(function (w, i) { return '<button type="button" class="fg-pair" data-side="r" data-k="' + i + '" dir="rtl" onclick="FreeSpace._pair(this)">' + esc(w.fa) + '</button>'; }).join('') + '</div></div>';
    } else if (G.id === 'artikel') {
      body = '<p class="fg-q">' + esc(c().whichArt) + '</p><div class="fg-word" dir="ltr">' + esc(R.de) + speakBtn(R.de) + '</div><p class="fg-sub" dir="rtl">' + esc(R.fa) + '</p>'
        + '<div class="fg-opts fg-art">' + ['der', 'die', 'das'].map(function (a) { return '<button type="button" class="fg-opt a-' + a + '" onclick="FreeSpace._choose(this,\'' + a + '\')">' + a + '</button>'; }).join('') + '</div>';
    } else if (G.id === 'quiz') {
      var opts = options(R.w, G.words, R.rev ? 'de' : 'fa', 4);
      G.state.correct = R.rev ? R.w.de : R.w.fa;
      body = R.rev
        ? '<p class="fg-q">' + esc(c().whichDe) + '</p><div class="fg-word fg-word-fa" dir="rtl">' + esc(R.w.fa) + '</div><div class="fg-opts">' + opts.map(function (o) { return '<button type="button" class="fg-opt" dir="ltr" onclick="FreeSpace._choose(this)" data-v="' + esc(o.de) + '">' + esc(deLabel(o)) + '</button>'; }).join('') + '</div>'
        : '<p class="fg-q">' + esc(c().whichMean) + '</p><div class="fg-word" dir="ltr">' + esc(deLabel(R.w)) + speakBtn(deLabel(R.w)) + '</div><div class="fg-opts">' + opts.map(function (o) { return '<button type="button" class="fg-opt" dir="rtl" onclick="FreeSpace._choose(this)" data-v="' + esc(o.fa) + '">' + esc(o.fa) + '</button>'; }).join('') + '</div>';
    } else if (G.id === 'scramble') {
      var letters = R.de.split('').map(function (ch, i) { return { ch: ch, i: i }; }), mixed = shuffle(letters);
      if (mixed.map(function (x) { return x.ch; }).join('') === R.de && R.de.length > 2) mixed = mixed.slice(1).concat(mixed[0]);
      G.state = { target: R.de, typed: [], mixed: mixed, hinted: false };
      body = '<p class="fg-q">' + esc(c().buildWord) + '</p><div class="fg-word fg-word-fa" dir="rtl">' + esc(R.fa) + (R.art ? ' <small dir="ltr">(' + esc(R.art) + ')</small>' : '') + '</div>'
        + '<div class="fg-slots" dir="ltr" id="fgSlots">' + R.de.split('').map(function () { return '<i></i>'; }).join('') + '</div>'
        + '<div class="fg-tiles" dir="ltr">' + mixed.map(function (x, k) { return '<button type="button" class="fg-letter" data-k="' + k + '" onclick="FreeSpace._letter(this)">' + esc(x.ch.toLowerCase()) + '</button>'; }).join('') + '</div>'
        + '<div class="fg-row"><button type="button" class="fg-ghost" onclick="FreeSpace._undo()">↶ ' + esc(c().undo) + '</button><button type="button" class="fg-ghost" onclick="FreeSpace._hint()">💡 ' + esc(c().hint) + '</button><button type="button" class="fg-ghost" onclick="FreeSpace._skip()">' + esc(c().skip) + ' ⏭</button></div>';
    } else if (G.id === 'builder') {
      var toks = R.de.replace(/\s+/g, ' ').trim().split(' '), mixedT = shuffle(toks.map(function (t, i) { return { t: t, i: i }; }));
      if (mixedT.every(function (x, k) { return x.i === k; }) && toks.length > 2) mixedT = mixedT.slice(1).concat(mixedT[0]);
      G.state = { toks: toks, mixed: mixedT, placed: [] };
      body = '<p class="fg-q">' + esc(c().buildSent) + '</p><div class="fg-word fg-word-fa fg-sent" dir="rtl">' + esc(R.fa) + '</div>'
        + '<div class="fg-line" dir="ltr" id="fgLine"></div><div class="fg-tiles" dir="ltr">' + mixedT.map(function (x, k) { return '<button type="button" class="fg-chip" data-k="' + k + '" onclick="FreeSpace._chip(this)">' + esc(x.t) + '</button>'; }).join('') + '</div>'
        + '<div class="fg-row"><button type="button" class="fg-ghost" onclick="FreeSpace._undo()">↶ ' + esc(c().undo) + '</button><button type="button" class="fg-ghost" onclick="FreeSpace._skip()">' + esc(c().skip) + ' ⏭</button></div>';
    } else if (G.id === 'phrases') {
      var po = options(R, pool('phrases', G.lv), 'de', 4);
      G.state.correct = R.de;
      body = '<p class="fg-q">' + esc(c().phraseQ) + '</p><div class="fg-word fg-word-fa" dir="rtl">' + esc(R.fa) + '</div><div class="fg-opts">' + po.map(function (o) { return '<button type="button" class="fg-opt" dir="ltr" onclick="FreeSpace._choose(this)" data-v="' + esc(o.de) + '">' + esc(o.de) + '</button>'; }).join('') + '</div>';
    }
    overlay(head() + '<div class="fg-body">' + body + '<div class="fg-feedback" id="fgFb" aria-live="polite"></div>' + streakHtml() + '</div>', 'fg-game');
  }

  function score(ok) {
    G.total++;
    if (ok) { G.ok++; G.streak++; } else G.streak = 0;
  }
  function feedback(ok, correctText, speakText) {
    var fb = document.getElementById('fgFb'); if (!fb) return;
    fb.className = 'fg-feedback ' + (ok ? 'is-ok' : 'is-bad');
    fb.innerHTML = (ok ? '<b>' + esc(praise()) + '</b>' : '<span>' + esc(c().wrongIs) + '</span> <b dir="auto">' + esc(correctText) + '</b>')
      + (speakText ? speakBtn(speakText) : '') + '<button type="button" class="fg-btn" onclick="FreeSpace._next()">' + esc(c().next) + ' ▸</button>';
    var nb = fb.querySelector('.fg-btn'); if (nb) setTimeout(function () { try { nb.focus(); } catch (e) { /* ignore */ } }, 30);
    if (ok && speakText) say(speakText);
  }
  function choose(btn, art) {
    if (!G || G.state.answered) return;
    G.state.answered = true;
    var R = G.rounds[G.i], ok, correctText, speakText;
    if (G.id === 'artikel') { ok = art === R.art; correctText = R.art + ' ' + R.de; speakText = correctText; }
    else { ok = btn.getAttribute('data-v') === G.state.correct; correctText = G.id === 'quiz' && !R.rev ? R.w.fa : G.id === 'quiz' ? deLabel(R.w) : R.de; speakText = G.id === 'quiz' ? deLabel(R.w) : R.de; }
    root.querySelectorAll('.fg-opt').forEach(function (b) {
      b.disabled = true;
      var v = b.getAttribute('data-v') || b.textContent;
      if ((G.id === 'artikel' && v === R.art) || (G.id !== 'artikel' && v === G.state.correct)) b.classList.add('is-ok');
    });
    if (!ok) btn.classList.add('is-bad');
    score(ok); feedback(ok, correctText, speakText);
  }
  function pair(btn) {
    if (!G || G.id !== 'pairs') return;
    var st = G.state, side = btn.getAttribute('data-side'), k = +btn.getAttribute('data-k');
    if (btn.classList.contains('is-ok')) return;
    if (!st.sel || st.sel.side === side) {
      root.querySelectorAll('.fg-pair.is-sel').forEach(function (b) { b.classList.remove('is-sel'); });
      st.sel = { side: side, k: k, el: btn }; btn.classList.add('is-sel'); return;
    }
    var l = side === 'l' ? st.left[k] : st.left[st.sel.k], r = side === 'r' ? st.right[k] : st.right[st.sel.k];
    var other = st.sel.el; st.sel = null; other.classList.remove('is-sel');
    if (l === r) {
      btn.classList.add('is-ok'); other.classList.add('is-ok'); btn.disabled = other.disabled = true; say(deLabel(l));
      st.matched[l.de] = 1;
      if (Object.keys(st.matched).length === st.left.length) { var ok = st.miss <= 1; score(ok); feedback(true, '', ''); }
    } else {
      st.miss++; [btn, other].forEach(function (b) { b.classList.add('is-bad'); setTimeout(function () { b.classList.remove('is-bad'); }, 450); });
    }
  }
  function letter(btn) {
    if (!G || G.id !== 'scramble' || G.state.answered) return;
    var st = G.state, k = +btn.getAttribute('data-k');
    st.typed.push(k); btn.disabled = true; btn.classList.add('is-used'); paintSlots();
    if (st.typed.length === st.target.length) {
      var word = st.typed.map(function (j) { return st.mixed[j].ch; }).join('');
      var ok = word.toLowerCase() === st.target.toLowerCase();
      if (ok) { st.answered = true; score(!st.hinted); feedback(true, '', deLabel(G.rounds[G.i])); }
      else { var sl = document.getElementById('fgSlots'); if (sl) { sl.classList.add('is-bad'); setTimeout(function () { sl.classList.remove('is-bad'); }, 450); } }
    }
  }
  function paintSlots() {
    var st = G.state, sl = document.getElementById('fgSlots'); if (!sl) return;
    var cap = st.target[0] !== st.target[0].toLowerCase();
    sl.innerHTML = st.target.split('').map(function (_, i) {
      var j = st.typed[i]; if (j == null) return '<i></i>';
      var ch = st.mixed[j].ch.toLowerCase(); if (i === 0 && cap) ch = ch.toUpperCase();
      return '<i class="on">' + esc(ch) + '</i>';
    }).join('');
  }
  function chip(btn) {
    if (!G || G.id !== 'builder' || G.state.answered) return;
    var st = G.state, k = +btn.getAttribute('data-k');
    st.placed.push(k); btn.disabled = true; btn.classList.add('is-used'); paintLine();
    if (st.placed.length === st.toks.length) {
      var sent = st.placed.map(function (j) { return st.mixed[j].t; }).join(' ');
      var ok = sent === st.toks.join(' ');
      st.answered = true; score(ok); feedback(ok, st.toks.join(' '), st.toks.join(' '));
      var ln = document.getElementById('fgLine'); if (ln) ln.classList.add(ok ? 'is-ok' : 'is-bad');
    }
  }
  function paintLine() {
    var st = G.state, ln = document.getElementById('fgLine'); if (!ln) return;
    ln.innerHTML = st.placed.map(function (j) { return '<span>' + esc(st.mixed[j].t) + '</span>'; }).join('');
  }
  function undo() {
    if (!G || G.state.answered) return;
    var st = G.state, arr = G.id === 'scramble' ? st.typed : G.id === 'builder' ? st.placed : null;
    if (!arr || !arr.length) return;
    var k = arr.pop(), b = root.querySelector((G.id === 'scramble' ? '.fg-letter' : '.fg-chip') + '[data-k="' + k + '"]');
    if (b) { b.disabled = false; b.classList.remove('is-used'); }
    if (G.id === 'scramble') paintSlots(); else paintLine();
  }
  function hint() {
    if (!G || G.id !== 'scramble' || G.state.answered) return;
    var st = G.state; st.hinted = true;
    // undo wrong tail, then place the next correct letter
    var good = 0; while (good < st.typed.length && st.mixed[st.typed[good]].ch.toLowerCase() === st.target[good].toLowerCase()) good++;
    while (st.typed.length > good) undo();
    var need = st.target[st.typed.length].toLowerCase();
    var k = st.mixed.findIndex(function (x, j) { return x.ch.toLowerCase() === need && st.typed.indexOf(j) < 0; });
    var b = root.querySelector('.fg-letter[data-k="' + k + '"]'); if (b) letter(b);
  }
  function skip() {
    if (!G || G.state.answered) return;
    G.state.answered = true; score(false);
    var R = G.rounds[G.i];
    feedback(false, G.id === 'builder' ? G.state.toks.join(' ') : deLabel(R), G.id === 'builder' ? G.state.toks.join(' ') : deLabel(R));
  }
  function next() { if (!G) return; G.i++; round(); }
  function end() {
    var n = Math.max(1, G.total), ratio = G.ok / n, s = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1, b = best();
    var bk = G.id + ':' + G.lv; if (!b[bk] || s > b[bk]) { b[bk] = s; lsSet(LS_BEST, JSON.stringify(b)); }
    var id = G.id;
    overlay(head() + '<div class="fg-body fg-end"><div class="fg-burst">' + (s >= 3 ? '🏆' : s === 2 ? '🌟' : '🌱') + '</div><h3>' + esc(c().endTitle(s)) + '</h3>' + stars(s)
      + '<p>' + esc(c().endSub(G.ok, G.total)) + '</p><div class="fg-row"><button type="button" class="fg-btn" onclick="FreeSpace.play(\'' + id + '\')">↻ ' + esc(c().again) + '</button><button type="button" class="fg-ghost" onclick="FreeSpace.close()">' + esc(c().other) + '</button></div></div>', 'fg-game');
  }
  function surprise() { play(GAMES[Math.floor(Math.random() * GAMES.length)].id); }

  /* ---------- hooks ---------- */
  var GRID = '<div class="execution-dashboard-grid';
  function hookDashboard() {
    if (typeof window.renderDashboard !== 'function' || window.renderDashboard.__fs) return false;
    var base = window.renderDashboard;
    var wrapped = function () {
      var out = base.apply(this, arguments);
      if (!isFree() || typeof out !== 'string') return out;
      var i = out.indexOf(GRID);
      if (i < 0) return out;
      var tabs = '';
      try { tabs = TDM.renderModeTabs(); } catch (e) { /* ignore */ }
      return out.slice(0, i) + '<div class="execution-dashboard-grid fs-dashboard max-w-6xl mx-auto px-4 pt-5">' + tabs + content() + '</div></div>';
    };
    wrapped.__fs = true;
    window.renderDashboard = wrapped;
    return true;
  }
  function hookTabs() {
    var T = window.TDM;
    if (!T || typeof T.renderModeTabs !== 'function' || T.renderModeTabs.__fsTab) return false;
    var base = T.renderModeTabs, L = { fa: 'ساعت مطالعه را خودت تعیین می‌کنی', de: 'Lernzeit selbst festlegen' };
    var wrapped = function () {
      var out = base.apply(this, arguments);
      if (typeof out !== 'string') return out;
      out = out.replace('<span class="tdm-mode-ico" aria-hidden="true">🕘</span>', '<span class="tdm-mode-ico" aria-hidden="true">🌿</span>');
      out = out.replace(/(TDM\.setStudyMode\('free'\)"[\s\S]*?)<em>[^<]*<\/em>/, '$1');
      out = out.replace(L.fa, 'تمرین‌های سبک، بدون زمان‌بندی').replace(L.de, lang() === 'en' ? 'Light exercises, no timing' : 'Leichte Übungen, ohne Zeitvorgabe');
      return out;
    };
    if (base.__gd) wrapped.__gd = true;
    wrapped.__fsTab = true;
    T.renderModeTabs = wrapped;
    return true;
  }
  function hookRender() {
    if (typeof window.render !== 'function' || window.render.__fs) return false;
    var base = window.render;
    var wrapped = function () {
      var r = base.apply(this, arguments);
      try { document.documentElement.classList.toggle('amk-free-space', isFree()); } catch (e) { /* ignore */ }
      return r;
    };
    wrapped.__fs = true;
    window.render = wrapped;
    return true;
  }
  function hookAll() {
    var a = hookDashboard(), b = hookTabs(), d = hookRender();
    try { if (isFree() && S.screen === 'dashboard' && !document.querySelector('.fs-space')) render(); else document.documentElement.classList.toggle('amk-free-space', isFree()); } catch (e) { /* ignore */ }
    return a && b && d;
  }

  window.FreeSpace = {
    play: play, surprise: surprise, topics: topics, setTopic: setTopic, setLevel: setLevel, _level: level, close: close, version: VER, _isFree: isFree,
    _choose: choose, _pair: pair, _letter: letter, _chip: chip, _undo: undo, _hint: hint, _skip: skip, _next: next,
    _say: function (b) { say(b.getAttribute('data-t') || ''); }, _state: function () { return G; }
  };
  if (!hookAll()) { document.addEventListener('DOMContentLoaded', hookAll); window.addEventListener('load', hookAll); }
})();
