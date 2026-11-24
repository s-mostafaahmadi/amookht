/* Amookht · ÖSD Training System (Zertifikat B2 / C1) – program profile for the method engine (testdaf-method.js).
   The engine asks window.OSD_PROFILE for static method knowledge, the weekly rhythm, daily minutes and content while the
   account's learning program is ÖSD (S.user.examPlan === 'oesd'). Level (B2/C1) and daily time (120/180/240) live in S.oesdMethod. */
(function () {
  'use strict';
  const P = (window.OSD_PROFILE = window.OSD_PROFILE || {});
  P.version = '1.0.0';
  const LEVELS = ['B2', 'C1'];
  const st = () => (typeof S !== 'undefined' ? S : null);
  const lang = () => { const s = st(); const l = s && s.uiLanguage; return l === 'en' || l === 'de' ? l : 'fa'; };
  const T = (fa, de, en) => ({ __t: 1, fa, de, en: en || de });
  const isT = (v) => v && typeof v === 'object' && v.__t === 1;
  const res = (v) => { if (isT(v)) return v[lang()] ?? v.de; if (Array.isArray(v)) return v.map(res); if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = res(v[k]); return o; } return v; };
  const faNum = (n) => (lang() === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = (fa, de, en) => (lang() === 'fa' ? fa : lang() === 'en' ? (en || de) : de);

  // ───────────── settings (level, minutes) ─────────────
  function mstate() { const s = st(); if (!s) return {}; if (!s.oesdMethod || typeof s.oesdMethod !== 'object') s.oesdMethod = {}; return s.oesdMethod; }
  const todayKey = () => (typeof today === 'function' ? today() : new Date().toISOString().slice(0, 10));
  P.level = function () {
    const m = mstate();
    // a level change made after today's practice started applies from the next day
    if (LEVELS.includes(m.levelNext) && m.levelFrom && todayKey() >= m.levelFrom) { m.level = m.levelNext; delete m.levelNext; delete m.levelFrom; }
    if (LEVELS.includes(m.level)) return m.level;
    const ul = String(st()?.user?.level || '').toUpperCase();
    return /C1|C2/.test(ul) ? 'C1' : 'B2';
  };
  P.examName = () => `ÖSD Zertifikat ${P.level()}`;

  // ───────────── content ─────────────
  let loading = null; const viewCache = new Map();
  P.content = function () {
    const c = window.OSD_CONTENT; if (!c) return null;
    const lv = P.level(), key = lv;
    const hit = viewCache.get(key); if (hit && hit.src === c) return hit.view;
    const f = (list) => (list || []).filter((x) => x.level === lv);
    const view = { version: c.version, level: lv, hoeren: f(c.hoeren), lesen: f(c.lesen), argumentation: f(c.argumentation), grafik: [], sprechen: f(c.sprechen) };
    viewCache.set(key, { src: c, view }); return view;
  };
  P.ensureContent = function () {
    if (window.OSD_CONTENT) return Promise.resolve(P.content());
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/oesd-method-content.js?v=' + (window.OSD_CONTENT_VERSION || '1') + '-' + new Date().toISOString().slice(0, 13);
      s.async = true;
      s.onload = () => (window.OSD_CONTENT ? resolve(P.content()) : reject(new Error('ÖSD content missing')));
      s.onerror = () => { loading = null; reject(new Error('ÖSD content failed to load')); };
      document.head.appendChild(s);
    });
    return loading;
  };

  // ───────────── weekly rhythm ─────────────
  // lformat/sformat steer which Lesen/Schreiben task type a day practises (engine falls back to any item if none is left)
  const DAYS = {
    6: { key: 'sa', fa: 'شنبه', de: 'Samstag', focus: ['hoeren', 'lesen'], sfa: 'Hören و Lesen Aufgabe 1 (چندگزینه‌ای)', sde: 'Hören + Lesen Aufgabe 1 (Mehrfachauswahl)', schreiben: 'argumentation', sformat: 'email', lformat: 'mc', sprechen: 1 },
    0: { key: 'so', fa: 'یکشنبه', de: 'Sonntag', focus: ['hoeren', 'schreiben'], sfa: 'E-Mail رسمی (Schreiben Aufgabe 1)', sde: 'Formelles E-Mail (Schreiben Aufgabe 1)', schreiben: 'argumentation', sformat: 'email', lformat: 'match', sprechen: 1 },
    1: { key: 'mo', fa: 'دوشنبه', de: 'Montag', focus: ['hoeren', 'sprechen'], sfa: 'Sprechen: دو بخش آزمون شفاهی', sde: 'Sprechen: zwei Prüfungsaufgaben', schreiben: 'argumentation', sformat: 'meinung', lformat: 'gap', sprechen: 2 },
    2: { key: 'di', fa: 'سه‌شنبه', de: 'Dienstag', focus: ['lesen', 'schreiben'], sfa: 'نوشتن نظر / Stellungnahme (Schreiben Aufgabe 2)', sde: 'Meinung / Stellungnahme (Schreiben Aufgabe 2)', schreiben: 'argumentation', sformat: 'meinung', lformat: { B2: 'mc', C1: 'abschnitte' }, sprechen: 1 },
    3: { key: 'mi', fa: 'چهارشنبه', de: 'Mittwoch', focus: ['hoeren', 'sprechen'], sfa: 'کل آزمون شفاهی (سه بخش)', sde: 'Ganze mündliche Prüfung (3 Aufgaben)', schreiben: 'argumentation', sformat: 'email', lformat: 'match', sprechen: 3 },
    4: { key: 'do', fa: 'پنجشنبه', de: 'Donnerstag', focus: ['hoeren', 'lesen', 'schreiben', 'sprechen'], sfa: 'تمرین زمان‌دار مثل روز آزمون', sde: 'Prüfungstraining mit Zeit', schreiben: 'argumentation', sformat: 'meinung', lformat: 'gap', sprechen: 3, exam: true },
    5: { key: 'fr', fa: 'جمعه', de: 'Freitag', focus: [], sfa: 'ارزیابی، تحلیل اشتباهات و مرور', sde: 'Bewertung, Fehleranalyse, Wiederholung', schreiben: 'argumentation', sformat: 'email', lformat: 'mc', sprechen: 3, evaluation: true }
  };
  const dayCache = {};
  Object.defineProperty(P, 'dayDef', { get() { const lv = P.level(); if (dayCache[lv]) return dayCache[lv]; const o = {}; for (const [k, v] of Object.entries(DAYS)) o[k] = { ...v, lformat: typeof v.lformat === 'object' ? v.lformat[lv] : v.lformat }; return (dayCache[lv] = o); } });
  // which Schreiben items fit a day's sformat: "meinung" = every Aufgabe-2 text (B2 Meinungsäußerung, C1 Referat/Stellungnahme/Kommentar)
  P.schreibenFilter = (def) => (def && def.sformat ? (x) => (def.sformat === 'email' ? x.format === 'email' : x.format !== 'email') : null);
  P.lesenFilter = (def) => (def && def.lformat ? (x) => x.format === def.lformat : null);

  const SPEAK = {
    B2: {
      informationsgespraech: { label: 'Informationsgespräch', fa: 'آشنایی و مشاوره (Aufgabe 1)', how: T('خودت را معرفی کن، هدف سفر یا حضورت را بگو، درباره موضوع تجربه‌ات را تعریف کن، سؤال بپرس و دست‌کم دو توصیه مشخص بده. به سؤال‌های طرف مقابل کامل جواب بده.', 'Stell dich vor, nenne Zweck und Ziel, erzähle von eigenen Erfahrungen, stelle Gegenfragen und gib mindestens zwei konkrete Tipps.', 'Introduce yourself, state your purpose, share experiences, ask questions back and give at least two concrete tips.'), phrases: ['Darf ich fragen, wohin Sie fahren?', 'Ich habe die Erfahrung gemacht, dass …', 'Haben Sie schon einmal … ausprobiert?', 'Ich würde Ihnen empfehlen, …'] },
      bildbeschreibung: { label: 'Bildbeschreibung', fa: 'توصیف و تفسیر تصویر (Aufgabe 2)', how: T('یک تصویر را انتخاب کن و دلیلش را بگو؛ اول کلی (چه کسی، کجا، چه می‌کند)، بعد جزئیات (جلو، پشت، چپ، راست)، بعد پیام تصویر، حدس‌ها و نظر شخصی و ارتباط با کشور خودت.', 'Wähle ein Bild und begründe die Wahl; erst Überblick, dann Details (vorne, hinten, links, rechts), dann Thema, Vermutungen und eigene Meinung.', 'Pick a picture and say why; overview first, then details (front, back, left, right), then the message, guesses and your opinion.'), phrases: ['Ich habe mich für Bild … entschieden, weil …', 'Im Vordergrund sieht man …', 'Das Bild soll vermutlich zeigen, dass …', 'In meinem Heimatland ist das eher …'] },
      meinungsaustausch: { label: 'Meinungsaustausch', fa: 'بحث و تبادل نظر (Aufgabe 3)', how: T('دیدگاه شخص مشخص‌شده را با دلیل و مثال دفاع کن، به استدلال طرف مقابل واکنش نشان بده، استدلال تازه بیاور و در پایان مصالحه یا جمع‌بندی کن.', 'Vertritt den Standpunkt deiner Person mit Gründen und Beispielen, reagiere auf Gegenargumente, bring neue Aspekte ein und finde einen Abschluss.', 'Defend your assigned position with reasons and examples, react to counter-arguments, add new aspects and close with a conclusion.'), phrases: ['Da bin ich anderer Meinung, denn …', 'Das mag sein, aber …', 'Ein weiterer Aspekt ist …', 'Wir könnten uns darauf einigen, dass …'] }
    },
    C1: {
      telefongespraech: { label: 'Telefongespräch', fa: 'تماس تلفنی: عذرخواهی و توافق (Aufgabe 1)', how: T('خودت را معرفی کن، مؤدبانه عذرخواهی کن، موقعیت را روشن توضیح بده و با پیشنهادهای مشخص برای راه‌حل مذاکره کن؛ به اعتراض‌ها با آرامش و استدلال پاسخ بده.', 'Stell dich vor, entschuldige dich höflich, erkläre die Situation und verhandle mit konkreten Vorschlägen; reagiere sachlich auf Einwände.', 'Introduce yourself, apologise politely, explain the situation and negotiate with concrete proposals; answer objections calmly.'), phrases: ['Hier spricht …, ich rufe an wegen …', 'Es tut mir außerordentlich leid, dass …', 'Wäre es eventuell möglich, …?', 'Ich verstehe Ihren Standpunkt, dennoch …'] },
      diskussion: { label: 'Diskussion', fa: 'بحث، استدلال و متقاعدکردن (Aufgabe 2)', how: T('تصمیم بگیر کدام عکس مناسب‌تر است، با معیارهای روشن (پیام، مخاطب، احساس) استدلال کن، نظر طرف مقابل را بسنج و او را متقاعد کن یا به توافق برس.', 'Entscheide dich für ein Foto, argumentiere mit klaren Kriterien (Botschaft, Zielgruppe, Wirkung), wäge die Gegenposition ab und überzeuge.', 'Choose a photo, argue with clear criteria (message, audience, effect), weigh the other view and persuade.'), phrases: ['Meines Erachtens spricht vor allem … für Foto 1.', 'Ich gebe zu bedenken, dass …', 'Wenn wir die Zielgruppe betrachten, …', 'Lassen Sie uns einen Kompromiss finden: …'] },
      kurzreferat: { label: 'Kurzreferat', fa: 'ارائه کوتاه (Aufgabe 3)', how: T('سلام و معرفی موضوع، ساختار ارائه، خلاصه منابع (نظرسنجی، مطالعه، نقل‌قول)، مقایسه با کشور خودت، تجربه و نظر شخصی، جمع‌بندی و دعوت به پرسش.', 'Begrüßung und Thema, Gliederung, Quellen zusammenfassen, Vergleich mit dem eigenen Land, eigene Erfahrung und Meinung, Fazit und Fragen.', 'Greeting and topic, outline, summarise sources, compare with your country, own experience and view, conclusion and questions.'), phrases: ['In meinem Kurzreferat geht es um …', 'Laut der vorliegenden Umfrage …', 'Im Vergleich dazu ist die Lage im Iran …', 'Zusammenfassend lässt sich sagen, …'] }
    }
  };
  P.sprechenOrder = () => Object.keys(SPEAK[P.level()]);

  const GRAMMAR = {
    B2: [
      { week: 1, title: 'Kausale und konzessive Nebensätze', fa: T('جمله‌های علّی و ضدّیتی (weil, da, obwohl)', 'weil, da, obwohl und Verbstellung', 'weil, da, obwohl and word order'), rule: 'Im Nebensatz steht das konjugierte Verb am Ende. „weil/da“ nennen einen Grund, „obwohl“ einen Gegengrund; nach „deshalb/trotzdem“ steht das Verb auf Position 2.', forms: ['…, weil die Mieten in Wien stark gestiegen sind.', 'Obwohl das Angebot gratis ist, nutzen es nur wenige.', 'Das Praktikum war schlecht bezahlt. Trotzdem habe ich viel gelernt.'], mistakes: T('اشتباه رایج: فعل بعد از weil در جایگاه دوم (weil die Mieten sind gestiegen ✗).', 'Typischer Fehler: Verb nach „weil“ auf Position 2.', 'Typical mistake: verb in second position after “weil”.') },
      { week: 2, title: 'Formelle E-Mails: höfliche Bitten und Forderungen', fa: T('زبان رسمی ایمیل: درخواست و مطالبه مؤدبانه', 'Höflichkeit im formellen E-Mail', 'Politeness in formal e-mails'), rule: 'Konjunktiv II und Modalverben machen Bitten höflich: „Könnten Sie …?“, „Ich wäre Ihnen dankbar, wenn …“. Forderungen sachlich: „Ich erwarte, dass …“, „Ich bitte Sie daher, …“.', forms: ['Ich wäre Ihnen sehr dankbar, wenn Sie mir den Betrag erstatten könnten.', 'Könnten Sie mir bitte bis Freitag Bescheid geben?', 'Ich erwarte eine Lösung innerhalb von zwei Wochen.'], mistakes: T('اشتباه رایج: شروع با «Hallo» یا پایان بدون «Mit freundlichen Grüßen»؛ استفاده از du در ایمیل رسمی.', 'Typischer Fehler: „Hallo“ statt „Sehr geehrte …“, duzen.', 'Typical mistake: “Hallo” instead of “Sehr geehrte …”, using du.') },
      { week: 3, title: 'Passiv und Passiversatz', fa: T('مجهول و جایگزین‌های آن', 'Passiv und Ersatzformen', 'Passive and alternatives'), rule: 'Vorgangspassiv: werden + Partizip II („Die Wohnung wird renoviert.“). Mit Modalverb: „muss renoviert werden“. Ersatz: man, sich lassen, sein + zu.', forms: ['Die Anmeldung muss bis Montag abgeschickt werden.', 'Das lässt sich leicht ändern.', 'Die Formulare sind bis 15. Jänner abzugeben.'], mistakes: T('اشتباه رایج: wurde/war را قاطی کردن؛ فراموش کردن werden در جمله با فعل وجهی.', 'Typischer Fehler: „wurde“/„war“ verwechseln.', 'Typical mistake: mixing up “wurde” and “war”.') },
      { week: 4, title: 'Konjunktiv II: Ratschläge, Wünsche, irreale Bedingungen', fa: T('وجه التزامی دوم برای توصیه و شرط غیرواقعی', 'Konjunktiv II für Tipps und Bedingungen', 'Subjunctive II for advice and conditions'), rule: 'würde + Infinitiv bzw. hätte/wäre/könnte/sollte. Ratschlag: „An deiner Stelle würde ich …“, irreal: „Wenn ich mehr Zeit hätte, würde ich …“.', forms: ['An Ihrer Stelle würde ich zuerst einen Probetag machen.', 'Wenn die Züge pünktlicher wären, würden mehr Leute pendeln.', 'Sie sollten unbedingt rechtzeitig buchen.'], mistakes: T('اشتباه رایج: würde + hätte با هم (würde hätte ✗).', 'Typischer Fehler: „würde … hätte“ doppelt.', 'Typical mistake: “würde … hätte” together.') },
      { week: 5, title: 'Relativsätze', fa: T('جمله‌های موصولی', 'Relativsätze', 'Relative clauses'), rule: 'Relativpronomen richtet sich in Genus/Numerus nach dem Bezugswort, im Kasus nach der Funktion im Relativsatz; mit Präposition: „das Thema, über das …“.', forms: ['Das ist die Firma, bei der ich mein Praktikum gemacht habe.', 'Die Kolleginnen, denen ich geholfen habe, …', 'Wien ist eine Stadt, in der man gut leben kann.'], mistakes: T('اشتباه رایج: حالت ضمیر را از جمله اصلی گرفتن (der Mann, den ich geholfen habe ✗ → dem).', 'Typischer Fehler: falscher Kasus des Relativpronomens.', 'Typical mistake: wrong case of the relative pronoun.') },
      { week: 6, title: 'Zweiteilige Konnektoren', fa: T('حروف ربط دوبخشی', 'Zweiteilige Konnektoren', 'Two-part connectors'), rule: 'sowohl … als auch, weder … noch, entweder … oder, nicht nur … sondern auch, je … desto, zwar … aber – sie strukturieren Argumente in Schreiben Aufgabe 2.', forms: ['Das Angebot ist nicht nur billig, sondern auch praktisch.', 'Je früher man bucht, desto günstiger ist es.', 'Zwar ist das Land ruhiger, aber die Wege sind weiter.'], mistakes: T('اشتباه رایج: جایگاه فعل بعد از desto (desto es ist günstiger ✗).', 'Typischer Fehler: Verbstellung nach „desto“.', 'Typical mistake: word order after “desto”.') },
      { week: 7, title: 'Verben und Adjektive mit Präpositionen', fa: T('فعل‌ها و صفت‌های حرف‌اضافه‌دار', 'Verben mit festen Präpositionen', 'Verbs with fixed prepositions'), rule: 'Feste Präposition + Kasus lernen: sich beschweren über (Akk.), sich bewerben um, teilnehmen an (Dat.), zufrieden mit; Fragewort/Pronomen: worüber/darüber.', forms: ['Ich möchte mich über die Unterkunft beschweren.', 'Ich interessiere mich sehr für diesen Kurs.', 'Darauf freue ich mich schon.'], mistakes: T('اشتباه رایج: sich beschweren für ✗ → über؛ Lücke در Lesen Aufgabe 4 اغلب همین حروف اضافه است.', 'Typischer Fehler: falsche Präposition – oft Lücken in Lesen Aufgabe 4.', 'Typical mistake: wrong preposition – frequent in Lesen task 4 gaps.') },
      { week: 8, title: 'Infinitivsätze und Finalsätze', fa: T('جمله‌های مصدری و هدف', 'um … zu, damit, ohne … zu, statt … zu', 'um … zu, damit, ohne … zu, statt … zu'), rule: '„um … zu“ bei gleichem Subjekt, „damit“ bei verschiedenem Subjekt; „ohne … zu“, „(an)statt … zu“ für Gegensatz/Alternative.', forms: ['Ich lerne Deutsch, um in Österreich zu studieren.', 'Ich schreibe Ihnen, damit Sie den Fehler korrigieren.', 'Er kündigte, ohne lange zu überlegen.'], mistakes: T('اشتباه رایج: damit با فاعل یکسان یا um … zu با فاعل متفاوت.', 'Typischer Fehler: „um … zu“ mit anderem Subjekt.', 'Typical mistake: “um … zu” with a different subject.') }
    ],
    C1: [
      { week: 1, title: 'Nominalstil und Nominalisierung', fa: T('سبک اسمی برای متن‌های علمی و رسمی', 'Nominalstil in Referat und Stellungnahme', 'Nominal style for formal texts'), rule: 'Verbale Sätze werden zu Nominalgruppen: „weil die Kosten steigen“ → „aufgrund steigender Kosten“; „wenn man …“ → „bei …“. Gut für Referat und Kommentar, aber dosiert einsetzen.', forms: ['Aufgrund der steigenden Mieten ziehen viele aufs Land.', 'Nach Abschluss der Untersuchung …', 'Zur Verbesserung der Situation …'], mistakes: T('اشتباه رایج: زنجیره طولانی اسم‌ها که متن را نامفهوم می‌کند.', 'Typischer Fehler: zu lange Nominalketten.', 'Typical mistake: overlong noun chains.') },
      { week: 2, title: 'Partizipialattribute', fa: T('صفت‌های فاعلی/مفعولی پیش از اسم', 'Erweiterte Partizipialattribute', 'Extended participle attributes'), rule: 'Partizip I (aktiv, gleichzeitig): „die steigende Zahl“; Partizip II (passiv/abgeschlossen): „die durchgeführte Studie“; erweitert: „die im Jahr 2024 veröffentlichte Studie“.', forms: ['die von der Regierung geplante Reform', 'die ständig wachsende Nachfrage', 'die zu erwartenden Kosten'], mistakes: T('اشتباه رایج: پایانه صفت در Partizip را فراموش کردن.', 'Typischer Fehler: fehlende Adjektivendung.', 'Typical mistake: missing adjective ending.') },
      { week: 3, title: 'Indirekte Rede (Konjunktiv I)', fa: T('نقل قول غیرمستقیم برای ارائه منابع', 'Konjunktiv I für Quellen', 'Reported speech for sources'), rule: 'In Referat und Stellungnahme Quellen neutral wiedergeben: „Die Autorin betont, die Zahl sei gestiegen.“ Wenn Konj. I = Indikativ, Konj. II verwenden.', forms: ['Laut Studie habe sich die Lage verbessert.', 'Der Experte meint, man müsse früher handeln.', 'Viele gaben an, sie hätten keine Zeit.'], mistakes: T('اشتباه رایج: استفاده از Indikativ و درنتیجه ادعا را به‌عنوان نظر خود نشان دادن.', 'Typischer Fehler: Indikativ statt Konjunktiv I.', 'Typical mistake: indicative instead of subjunctive I.') },
      { week: 4, title: 'Konnektoren der Textkohärenz', fa: T('حروف ربط برای انسجام متن', 'Kohärenz durch Konnektoren', 'Cohesion through connectors'), rule: 'folglich, demzufolge, indessen, hingegen, wohingegen, insofern, zumal, sofern – sie verbinden Abschnitte und sind der Schlüssel für Lesen Aufgabe 3 (Abschnitte einfügen).', forms: ['Die Kosten sind gestiegen; folglich wurde das Angebot reduziert.', 'Städter fahren selten Auto, wohingegen Landbewohner darauf angewiesen sind.', 'Das ist sinnvoll, zumal es kaum Nachteile gibt.'], mistakes: T('اشتباه رایج: hingegen را مثل aber در جایگاه صفر به کار بردن.', 'Typischer Fehler: Stellung von „hingegen“.', 'Typical mistake: position of “hingegen”.') },
      { week: 5, title: 'Funktionsverbgefüge', fa: T('ترکیب‌های فعل + اسم', 'Funktionsverbgefüge', 'Noun-verb collocations'), rule: 'in Betracht ziehen, zur Verfügung stellen, Kritik üben an, eine Entscheidung treffen, in Kraft treten, zum Ausdruck bringen – typisch für formelle E-Mails und Referate.', forms: ['Wir müssen alle Optionen in Betracht ziehen.', 'Die Universität stellt Räume zur Verfügung.', 'Das Gesetz tritt im Jänner in Kraft.'], mistakes: T('اشتباه رایج: فعل اشتباه در ترکیب (eine Entscheidung machen ✗).', 'Typischer Fehler: falsches Funktionsverb.', 'Typical mistake: wrong support verb.') },
      { week: 6, title: 'Subjektive Modalverben', fa: T('افعال وجهی برای حدس و ادعا', 'Vermutung und Behauptung mit Modalverben', 'Modal verbs for assumption and claims'), rule: 'muss/dürfte/könnte (Vermutung, abgestuft), soll (Behauptung anderer), will (eigene Behauptung): „Er soll gekündigt haben.“ – nützlich für Bild-/Fotodiskussion.', forms: ['Das Foto dürfte in einer Großstadt aufgenommen worden sein.', 'Die Firma soll Millionen investiert haben.', 'Sie muss sehr müde gewesen sein.'], mistakes: T('اشتباه رایج: مصدر گذشته را درست نساختن (haben/sein + Partizip II).', 'Typischer Fehler: falscher Infinitiv Perfekt.', 'Typical mistake: wrong perfect infinitive.') },
      { week: 7, title: 'Passivvarianten', fa: T('گونه‌های مجهول', 'sein + zu, sich lassen, -bar, Zustandspassiv', 'Passive variants'), rule: '„Die Frist ist einzuhalten.“ (muss), „Das lässt sich lösen.“ (kann), „lösbar“, Zustandspassiv „ist geschlossen“ – sorgt für sachlichen Stil.', forms: ['Die Unterlagen sind bis Ende Mai einzureichen.', 'Das Problem lässt sich kaum vermeiden.', 'Diese Folgen sind nicht absehbar.'], mistakes: T('اشتباه رایج: معنی sein + zu را «باید/می‌توان» تشخیص ندادن.', 'Typischer Fehler: Bedeutung von „sein + zu“ verkennen.', 'Typical mistake: misreading “sein + zu”.') },
      { week: 8, title: 'Konzessive und irreale Vergleichssätze', fa: T('جمله‌های ضدّیتی و مقایسه غیرواقعی', 'wenn auch, so … auch, als ob', 'wenn auch, so … auch, als ob'), rule: 'Konzessiv: „Wie teuer es auch sein mag, …“, „wenn auch nur kurz“; irrealer Vergleich: „als ob/als wäre“ + Konjunktiv II.', forms: ['So sinnvoll die Idee auch ist, sie bleibt teuer.', 'Er tut so, als ob er nichts wüsste.', 'Es klingt, als wäre alles geklärt.'], mistakes: T('اشتباه رایج: ترتیب فعل بعد از als (als ob … + فعل در آخر، als + فعل بلافاصله).', 'Typischer Fehler: Verbstellung nach „als“ vs. „als ob“.', 'Typical mistake: word order after “als” vs “als ob”.') }
    ]
  };

  const EXAM = {
    B2: [
      { skill: 'Lesen', tasks: T('۴ بخش: چندگزینه‌ای، تیترها، بازسازی متن، Lückentext', '4 Aufgaben: Mehrfachauswahl, Überschriften, Textrekonstruktion, Lückentext'), minutes: T('۹۰ دقیقه', '90 Minuten') },
      { skill: 'Hören', tasks: T('۲ بخش با فایل‌های صوتی از اتریش، آلمان و سوئیس', '2 Aufgaben, Hörtexte aus AT/DE/CH'), minutes: T('حدود ۳۰ دقیقه', 'ca. 30 Minuten') },
      { skill: 'Schreiben', tasks: T('۲ متن: E-Mail رسمی و نظر/استدلال (حدود ۱۲۰ کلمه)', '2 Texte: formelles E-Mail, Meinungsäußerung (je ca. 120 Wörter)'), minutes: T('۹۰ دقیقه', '90 Minuten') },
      { skill: 'Sprechen', tasks: T('۳ بخش: گفت‌وگوی اطلاعاتی، توصیف تصویر، بحث', '3 Aufgaben: Informationsgespräch, Bildbeschreibung, Diskussion'), minutes: T('۱۵ تا ۲۰ دقیقه (+۱۵ آماده‌سازی)', '15–20 Minuten (+15 Vorbereitung)') }
    ],
    C1: [
      { skill: 'Lesen', tasks: T('۴ بخش: چندگزینه‌ای، تیترها، جای‌گذاری بخش‌ها، Lückentext', '4 Aufgaben: Mehrfachauswahl, Überschriften, Abschnitte einfügen, Lückentext'), minutes: T('۹۰ دقیقه', '90 Minuten') },
      { skill: 'Hören', tasks: T('۲ بخش: یادداشت‌برداری و چندگزینه‌ای', '2 Aufgaben: Notizen und Mehrfachauswahl'), minutes: T('حدود ۴۰ دقیقه', 'ca. 40 Minuten') },
      { skill: 'Schreiben', tasks: T('۲ متن: E-Mail رسمی و Referat/Stellungnahme/Kommentar (حداقل ۲۵۰ کلمه)', '2 Texte: formelles E-Mail; Referat, Stellungnahme oder Kommentar (mind. 250 Wörter)'), minutes: T('۹۰ دقیقه', '90 Minuten') },
      { skill: 'Sprechen', tasks: T('۳ بخش: تماس تلفنی، بحث، ارائه کوتاه', '3 Aufgaben: Telefongespräch, Diskussion, Kurzreferat'), minutes: T('۱۵ تا ۲۰ دقیقه (+۲۰ آماده‌سازی)', '15–20 Minuten (+20 Vorbereitung)') }
    ]
  };

  function methods(lv) {
    const b2 = lv === 'B2';
    return {
      hoeren: { title: T('Hören · اولویت اصلی', 'Hören · Priorität', 'Listening · priority'), goal: T('فهم پیام اصلی و جزئیات در متن‌های رادیویی و گفت‌وگوها با لهجه استاندارد اتریشی، آلمانی و سوئیسی.', 'Global- und Detailverstehen bei Radiotexten und Gesprächen aus Österreich, Deutschland und der Schweiz.', 'Global and detailed understanding of radio texts and conversations from Austria, Germany and Switzerland.'),
        steps: [T('Globales Hören: بدون متن گوش بده؛ موضوع، مسئله و هدف گوینده.', 'Globales Hören: Thema, Problem, Ziel – ohne Text.', 'Global listening: topic, problem, aim – no text.'), T(b2 ? 'Selektives Hören: درست/نادرست و یادداشت‌های ناقص را مثل Aufgabe 1 و 2 کامل کن.' : 'Selektives Hören: یادداشت‌ها را کامل کن و سؤال‌های چندگزینه‌ای نظر و هدف گوینده را حل کن.', b2 ? 'Selektives Hören: richtig/falsch und Notizen ergänzen wie in Aufgabe 1 und 2.' : 'Selektives Hören: Notizen ergänzen und Mehrfachauswahl zu Meinung und Absicht.', b2 ? 'Selective listening: true/false and completing notes as in tasks 1 and 2.' : 'Selective listening: complete notes and multiple choice on opinions and aims.'), T('Transkription und Analyse: بخش‌های نامفهوم را با متن بررسی کن (واژگان، درک، گرامر).', 'Transkript und Analyse: Unverstandenes mit Text prüfen.', 'Transcript and analysis: check what you missed.'), T('Erneutes Hören: دوباره بدون متن گوش بده.', 'Erneutes Hören ohne Text.', 'Listen again without text.'), T('Zusammenfassung: محتوا را به آلمانی بازگو و ضبط کن.', 'Mündliche Zusammenfassung aufnehmen.', 'Record an oral summary.')],
        rule: T('در آزمون ÖSD هر فایل یک یا دو بار پخش می‌شود؛ قبل از پخش، سؤال‌ها و یادداشت‌ها را بخوان تا بدانی دنبال چه هستی.', 'Lies vor dem Hören die Aufgaben – du weißt dann, worauf du achten musst.', 'Read the tasks before listening so you know what to listen for.') },
      lesen: { title: T('Lesen · چهار نوع تکلیف آزمون', 'Lesen · vier Aufgabentypen', 'Reading · four task types'), goal: T('حل چهار نوع تکلیف Lesen در ÖSD با شواهد متن و مدیریت زمان (۹۰ دقیقه برای چهار بخش).', 'Die vier Lesen-Aufgaben des ÖSD mit Textbelegen und Zeitmanagement lösen.', 'Solve the four ÖSD reading tasks with evidence and time management.'),
        steps: [T('Überblick: عنوان، منبع و ساختار متن؛ پیش‌بینی محتوا.', 'Überblick: Titel, Quelle, Aufbau – Inhalt vorhersagen.', 'Overview: title, source, structure – predict content.'), T('Intensives Lesen: برای هر بخش یک جمله ایده اصلی.', 'Intensives Lesen: Kernaussage je Abschnitt.', 'Intensive reading: one main idea per section.'), T(b2 ? 'Aufgaben lösen: چندگزینه‌ای، تیتر مناسب یا کلمه گمشده (Lückentext) با تکیه بر گرامر و بافت.' : 'Aufgaben lösen: چندگزینه‌ای، تیترها، جای‌گذاری بخش‌ها با ارجاع‌ها و حروف ربط، یا Lückentext.', 'Aufgaben lösen: Belegstelle suchen, Optionen vergleichen, bei Lücken Grammatik prüfen.', 'Solve tasks: find the evidence, compare options, check grammar for gaps.'), T('Fehleranalyse: دسته‌بندی اشتباهات و خلاصه یک‌خطی.', 'Fehleranalyse und Ein-Satz-Zusammenfassung.', 'Error analysis and one-line summary.')] },
      schreiben: { title: T('Schreiben · E-Mail و Aufgabe 2', 'Schreiben · E-Mail und Aufgabe 2', 'Writing · e-mail and task 2'), goal: T(b2 ? 'دو نوع متن آزمون: E-Mail رسمی با پوشش همه یادداشت‌ها و متن نظر با چهار نکته راهنما (هر کدام حدود ۱۲۰ کلمه).' : 'E-Mail رسمی با لحن مناسب و متن Aufgabe 2 (Referat، Stellungnahme یا Kommentar) با حداقل ۲۵۰ کلمه و ساختار علمی.', b2 ? 'Formelles E-Mail (alle Notizen) und Meinungsäußerung (4 Leitpunkte), je ca. 120 Wörter.' : 'Formelles E-Mail und Referat/Stellungnahme/Kommentar (mind. 250 Wörter).', b2 ? 'Formal e-mail (all notes) and opinion text (4 points), about 120 words each.' : 'Formal e-mail and report/statement/commentary (min. 250 words).'),
        steps: [T('Analyse: موقعیت، مخاطب و همه نکته‌های لازم.', 'Analyse: Situation, Empfänger, alle Punkte.', 'Analysis: situation, recipient, all points.'), T('Gliederung: طرح متن با کلیدواژه.', 'Gliederung in Stichwörtern.', 'Outline in keywords.'), T('Schreiben: Anrede، بدنه با پاراگراف، Grußformel؛ عبارت‌ها را از متن آزمون کپی نکن.', 'Schreiben: Anrede, Absätze, Grußformel – eigene Formulierungen.', 'Writing: greeting, paragraphs, closing – own wording.'), T('Korrektur: گرامر، واژگان، انسجام، لحن و پوشش همه نکات.', 'Korrektur: Grammatik, Wortschatz, Kohärenz, Register, Aufgabenerfüllung.', 'Correction: grammar, vocabulary, cohesion, register, task coverage.')] },
      sprechen: { title: T('Sprechen · سه بخش آزمون شفاهی', 'Sprechen · drei Prüfungsaufgaben', 'Speaking · three exam tasks'), goal: 'Prepare → Speak → Record → Analyze → Repeat',
        steps: [T('آماده‌سازی: فقط کلیدواژه، جمله کامل ننویس.', 'Vorbereitung: nur Stichwörter.', 'Preparation: keywords only.'), T(b2 ? 'صحبت: به سؤال‌های «Partner» در متن تکلیف هم جواب بده؛ آزمون ÖSD B2 معمولاً دونفره است.' : 'صحبت: به اعتراض‌های «Partner» واکنش نشان بده؛ ارائه را با سلام، ساختار و جمع‌بندی بگو.', 'Sprechen: auf die Partnerfragen im Material reagieren.', 'Speak: respond to the partner lines in the material.'), T('ضبط و بررسی: مکث، تکرار، جایگاه فعل، جمله ناقص.', 'Aufnahme prüfen: Pausen, Wiederholungen, Verbstellung.', 'Check the recording: pauses, repetitions, word order.'), T('اجرای مجدد بدون یادداشت.', 'Wiederholen ohne Notizen.', 'Repeat without notes.')] },
      wortschatz: { title: T('Grammatik & Wortschatz · گرامر هفته', 'Grammatik & Wortschatz · Wochengrammatik', 'Grammar & vocabulary · grammar of the week'), goal: T('لغت در قالب جمله و ترکیب، همراه با گرامر هفته.', 'Wörter in Kollokationen und Sätzen, mit Wochengrammatik.', 'Words in collocations and sentences, with the grammar of the week.'), steps: [T('مرور لغات قبلی', 'Wörter wiederholen', 'Review words'), T('پنج لغت جدید از متن‌های امروز', '5 neue Wörter', '5 new words'), T('پنج Redemittel', '5 Redemittel', '5 phrases'), T('جمله‌سازی با گرامر هفته', 'Satzbildung mit der Wochengrammatik', 'Sentences with the grammar of the week')] },
      wiederholung: { title: T('Wiederholung · Active Recall', 'Wiederholung · Active Recall', 'Review · Active Recall'), goal: T('تثبیت مطالب با بازیابی فعال و مرور فاصله‌دار.', 'Festigen durch aktives Abrufen.', 'Consolidate through active recall.'), steps: [T('لغات روز قبل', 'Wörter von gestern', 'Yesterday’s words'), T('مرور اشتباهات', 'Fehler wiederholen', 'Review mistakes'), T('بازگویی محتوای روز قبل', 'Inhalte wiedergeben', 'Retell yesterday’s content'), T('مرور Redemittel', 'Redemittel', 'Phrases'), T('آزمون از خود', 'Selbsttest', 'Self-test')], rule: T('فاصله‌های مرور: ۱، ۳، ۷، ۱۴ و ۳۰ روز.', 'Abstände: 1, 3, 7, 14, 30 Tage.', 'Intervals: 1, 3, 7, 14, 30 days.') }
    };
  }

  const staticCache = new Map();
  P.st = function () {
    const lv = P.level(), key = lv + '|' + lang();
    if (staticCache.has(key)) return staticCache.get(key);
    const b2 = lv === 'B2';
    const raw = {
      officialUrl: b2 ? 'https://osd.at/portfolio-item/osd-zertifikat-b2-zb2/' : 'https://osd.at/portfolio-item/osd-zertifikat-c1-zc1/',
      examStructure: EXAM[lv],
      rules: [T('هر تمرین باید خروجی قابل‌اندازه‌گیری داشته باشد.', 'Jede Übung hat ein messbares Ergebnis.', 'Every exercise has a measurable result.'), T('در Lesen و Hören، پاسخ باید با شواهد متن ثابت شود.', 'Antworten in Lesen und Hören immer mit Textbeleg.', 'Back up Reading and Listening answers with evidence.'), T('در Schreiben همه نکته‌های تکلیف (یادداشت‌ها یا Leitpunkte) باید پوشش داده شوند؛ نمره Aufgabenerfüllung از همین می‌آید.', 'Im Schreiben alle Notizen bzw. Leitpunkte behandeln.', 'In Writing cover every note or guiding point.'), T('لحن رسمی (Sie، Anrede، Grußformel) در E-Mail رعایت شود.', 'Register im E-Mail: Sie, Anrede, Grußformel.', 'Formal register in e-mails.'), T('در Sprechen ضبط و اجرای مجدد الزامی است.', 'Sprechen immer aufnehmen und wiederholen.', 'Always record and repeat in Speaking.'), T('لغات در قالب جمله و ترکیب یاد گرفته شوند.', 'Wörter in Kollokationen lernen.', 'Learn words in collocations.'), T('اشتباهات پرتکرار در Fehlerprotokoll ثبت شوند.', 'Häufige Fehler ins Fehlerprotokoll.', 'Log frequent mistakes.'), T('هر هفته عملکرد با هفته قبل مقایسه شود.', 'Jede Woche mit der Vorwoche vergleichen.', 'Compare each week with the previous one.')],
      success: T(`معیار موفقیت: در هر دو بخش آزمون (کتبی و شفاهی) حداقل ۶۰٪ امتیاز؛ هر هفته باید کاری را بهتر انجام دهم که هفته قبل برایم سخت بود.`, `Erfolgskriterium: in beiden Modulen mindestens 60 % – jede Woche etwas besser können als in der Vorwoche.`, `Success: at least 60% in both modules – improve something every week.`),
      phases: {
        1: { name: T('Phase 1 · آشنایی با قالب آزمون', 'Phase 1 · Prüfungsformat kennenlernen', 'Phase 1 · Get to know the format'), weeks: T('هفته ۱ و ۲', 'Woche 1–2', 'Weeks 1–2'), items: [T('همه انواع تکلیف ÖSD را یک بار انجام بده', 'Alle ÖSD-Aufgabentypen einmal üben', 'Try every ÖSD task type'), T('Hören همراه متن', 'Hören mit Transkript', 'Listening with transcript'), T('E-Mail رسمی: Anrede، ساختار، Grußformel', 'Formelles E-Mail: Aufbau und Register', 'Formal e-mail: structure and register'), T('ضبط روزانه Sprechen', 'Tägliche Sprechaufnahme', 'Daily speaking recording')] },
        2: { name: T('Phase 2 · تقویت مهارت آزمونی', 'Phase 2 · Prüfungsstrategien trainieren', 'Phase 2 · Train exam strategies'), weeks: T('هفته ۳ تا ۶', 'Woche 3–6', 'Weeks 3–6'), items: [T('تمرین زمان‌دار', 'Mit Zeitlimit üben', 'Timed practice'), T(b2 ? 'متن‌های ۱۲۰ کلمه‌ای کامل با همه نکات' : 'متن‌های ۲۵۰+ کلمه‌ای با ساختار علمی', b2 ? 'Texte mit ca. 120 Wörtern, alle Punkte' : 'Texte mit 250+ Wörtern, klarer Aufbau', b2 ? 'Texts of about 120 words covering all points' : 'Texts of 250+ words with clear structure'), T('تحلیل دقیق اشتباهات', 'Genaue Fehleranalyse', 'Detailed error analysis')] },
        3: { name: T('Phase 3 · شبیه‌سازی آزمون', 'Phase 3 · Prüfungssimulation', 'Phase 3 · Exam simulation'), weeks: T('از هفته ۷ به بعد', 'ab Woche 7', 'from week 7'), items: [T('روزهای پنجشنبه مثل روز آزمون', 'Donnerstage wie ein Prüfungstag', 'Thursdays like an exam day'), T('Modellsatz رسمی ÖSD (لینک پایین صفحه)', 'Offizieller ÖSD-Modellsatz (Link unten)', 'Official ÖSD model test (link below)'), T('تمرکز بر مهارت ضعیف‌تر', 'Fokus auf die schwächste Fertigkeit', 'Focus on the weakest skill')] }
      },
      resources: [[T(`Modellsatz رسمی ÖSD Zertifikat ${lv}`, `Offizieller Modellsatz ÖSD Zertifikat ${lv}`), T('تمرین با قالب واقعی (لینک پایین صفحه)', 'Training im Originalformat (Link unten)', 'Practice in the original format (link below)')], [T('ORF Ö1 / FM4 و پادکست‌های اتریشی', 'ORF Ö1 / FM4, österreichische Podcasts'), T('تقویت Hören با لهجه اتریشی', 'Hören mit österreichischer Standardsprache', 'Listening with Austrian standard German')], [T('روزنامه‌های Der Standard و Die Presse', 'Der Standard, Die Presse'), T('متن‌های Lesen معتبر', 'Authentische Lesetexte', 'Authentic reading texts')], ['Anki', T('مرور لغات (خروجی CSV از «دفتر عبارات»)', 'Wortschatz wiederholen (CSV-Export)', 'Vocabulary review (CSV export)')], [T('ضبط‌کننده صدا', 'Aufnahme'), T('ارزیابی Sprechen داخل همین برنامه', 'Sprechen bewerten in der App', 'Assess speaking in the app')]],
      methods: methods(lv),
      week: [],
      grafikPhrases: [],
      speakingTypes: SPEAK[lv],
      grammar: GRAMMAR[lv]
    };
    const out = res(raw); staticCache.set(key, out); return out;
  };

  // ───────────── Schreiben: formal e-mail gets its own analysis/outline fields ─────────────
  const isMail = (it) => it && it.format === 'email';
  P.anaFields = (it) => (isMail(it) ? [['a_problem', 'Anlass des E-Mails', 'دلیل نوشتن ایمیل'], ['a_vorteile', 'Alle Notizpunkte', 'همه نکته‌های یادداشت'], ['a_nachteile', 'Forderung / Bitte', 'درخواست یا مطالبه'], ['a_betroffene', 'Empfänger & Register', 'گیرنده و لحن (Sie)'], ['a_meinung', 'Ziel des E-Mails', 'هدف نهایی ایمیل']] : null);
  P.outFields = (it) => (isMail(it) ? [['o_einleitung', 'Betreff, Anrede, Bezug', 'موضوع، خطاب و اشاره به موضوع'], ['o_hauptteil', 'Notizpunkte', 'نکته‌های یادداشت به ترتیب'], ['o_gegen', 'Forderung / Lösungsvorschlag', 'درخواست یا راه‌حل'], ['o_meinung', 'Ton & Höflichkeit', 'لحن و ادب'], ['o_schluss', 'Schlusssatz & Grußformel', 'جمله پایانی و Grußformel']] : null);
  P.anaLabels = (it) => (isMail(it) ? ['Anlass', 'Inhaltspunkte', 'Forderungen', 'Empfänger & Register'] : null);
  function curSchreiben() {
    try { const s = st(), d = TDM.state().days[s.plan?.date || todayKey()], id = d?.picks?.schreiben?.id; return (P.content()?.argumentation || []).find((x) => x.id === id) || null; } catch (e) { return null; }
  }

  // ───────────── wording of the shared engine UI ─────────────
  P.rewrite = function (html, fn) {
    if (typeof html !== 'string' || !html) return html;
    const lv = P.level();
    const pairs = [
      ['TestDaF Training System', 'ÖSD Training System'],
      ['هدف: حداقل TDN 4 در هر چهار مهارت', `هدف: قبولی در ÖSD Zertifikat ${lv} (بخش کتبی و شفاهی)`],
      ['Ziel: TDN 4 in allen Teilen', `Ziel: ÖSD Zertifikat ${lv} bestehen`],
      ['Goal: TDN 4 in all parts', `Goal: pass ÖSD Zertifikat ${lv}`],
      ['ساختار آزمون', `ساختار آزمون ÖSD Zertifikat ${lv}`],
      ['Prüfungsaufbau', `ÖSD Zertifikat ${lv}`],
      ['Exam structure', `ÖSD Zertifikat ${lv}`],
      ['<li>هدف اصلی: کسب حداقل TDN 4 در هر چهار مهارت</li><li>مدت مطالعه روزانه: ۴ ساعت مفید · ۶ روز تمرین در هفته</li>', L(`<li>هدف اصلی: قبولی در ÖSD Zertifikat ${lv} – بخش کتبی (Lesen، Hören، Schreiben) و بخش شفاهی (Sprechen)</li><li>مدت مطالعه روزانه: ۴ ساعت مفید پیشنهاد می‌شود (قابل تغییر در کارت «زمان برنامه امروز») · ۶ روز تمرین در هفته</li>`,
        `<li>Hauptziel: ÖSD Zertifikat ${lv} bestehen – schriftliches Modul (Lesen, Hören, Schreiben) und mündliches Modul (Sprechen)</li><li>Tägliche Lernzeit: 4 Stunden empfohlen (im Feld „Planzeit heute“ änderbar) · 6 Trainingstage pro Woche</li>`,
        `<li>Main goal: pass ÖSD Zertifikat ${lv} – written module (reading, listening, writing) and oral module (speaking)</li><li>Daily study time: 4 hours recommended (change it under “Plan time today”) · 6 training days a week</li>`)],
      ['منبع رسمی: آمادگی آزمون', `منبع رسمی: Modellsatz و مواد آمادگی ÖSD Zertifikat ${lv}`],
      ['Offizielle Prüfungsvorbereitung', `Offizieller Modellsatz ÖSD Zertifikat ${lv}`],
      ['Official exam preparation', `Official ÖSD Zertifikat ${lv} model test`],
      ['LERNPLAN · REPORT', 'ÖSD-TRAINING · REPORT'],
      ['Aufgaben im Prüfungsformat', 'Aufgaben im ÖSD-Format'],
      ['TDN 4', `ÖSD ${lv}`], ['TDN 3', `ÖSD ${lv}`], ['TDN 5', `ÖSD ${lv}`]
    ];
    if (fn === 'renderActivity' && st()?.activeActivity?.id === 'schreiben' && isMail(curSchreiben())) {
      pairs.unshift(
        ['برای هر پاراگراف: Behauptung (ادعا) ← Begründung (دلیل) ← Beispiel (مثال) ← Konsequenz (نتیجه)', 'ساختار E-Mail: Betreff ← Anrede (Sehr geehrte …) ← دلیل نوشتن ← همه نکته‌های یادداشت (هر نکته یک یا دو جمله) ← درخواست روشن ← جمله پایانی ← Mit freundlichen Grüßen'],
        ['Einleitung، Hauptteil، Gegenargument، Meinung و Schluss وجود دارد؟', 'Betreff و Anrede، همه نکته‌های یادداشت، درخواست روشن، جمله پایانی و Grußformel وجود دارد؟'],
        ['Einleitung, Hauptteil, Gegenargument, Meinung', 'Betreff, Anrede, alle Notizpunkte, Bitte, Grußformel']
      );
    }
    let out = html;
    for (const [a, b] of pairs) if (out.includes(a)) out = out.split(a).join(b);
    out = out.replace(/TestDaF/g, 'ÖSD').replace(/TESTDAF/g, 'ÖSD');
    if (fn === 'renderPlanTimeCard') out = settingsHtml(fn) + out;
    if (fn === 'renderHub' && (st()?.tdmHubTab || 'woche') === 'woche' && out.includes('</nav>')) out = out.replace('</nav>', '</nav>' + settingsHtml(fn));
    return out;
  };

  // ───────────── settings card (level + daily time) ─────────────
  function started() {
    const s = st(); if (!s?.plan) return false;
    const k = s.plan.date, d = s.oesdMethod?.days?.[k];
    return !!(d && d.work && Object.values(d.work).some((w) => w && (w.step > 0 || (w.secs || []).some(Boolean))));
  }
  function settingsHtml(fn) {
    const lv = P.level(), busy = started(), next = mstate().levelNext;
    const lvBtn = (x) => `<button type="button" class="${x === lv ? 'is-cur' : ''} ${x === next ? 'is-next' : ''}" onclick="OSD.setLevel('${x}')"><b>${x}${x === next ? ` <i>${L('از فردا', 'ab morgen', 'from tomorrow')}</i>` : ''}</b><small>${x === 'B2' ? L('اقامت، کار، تابعیت', 'Alltag, Beruf, Staatsbürgerschaft', 'Everyday life, work, citizenship') : L('دانشگاه و کار تخصصی', 'Studium und Beruf', 'University and professional work')}</small></button>`;
    return `<section class="osd-settings ${fn === 'renderPlanTimeCard' ? 'execution-card' : ''} slide-up" data-learning-content dir="${lang() === 'fa' ? 'rtl' : 'ltr'}">
      <div class="osd-settings-head"><span class="osd-flag" aria-hidden="true">🇦🇹</span><div><p class="tdm-kicker">ÖSD · ${L('تنظیمات برنامه', 'Planeinstellungen', 'Plan settings')}</p><h3>${L('سطح آزمون ÖSD', 'ÖSD-Prüfungsniveau', 'ÖSD exam level')}</h3></div></div>
      <div class="osd-settings-row"><span class="osd-label">${L('سطح آزمون', 'Niveau', 'Level')}</span><div class="osd-seg">${LEVELS.map(lvBtn).join('')}</div></div>
      <p class="tdm-muted osd-note">${busy ? L('امروز تمرین را شروع کرده‌ای؛ سطح جدید از فردا اعمال می‌شود.', 'Du hast heute schon angefangen: das neue Niveau gilt ab morgen.', 'You already started today: the new level applies from tomorrow.') : L('همه تمرین‌ها با قالب و سطح آزمون واقعی ÖSD ساخته شده‌اند. زمان روزانه را پایین‌تر در «زمان روزانه برنامه» انتخاب کن.', 'Alle Übungen folgen Format und Niveau der echten ÖSD-Prüfung. Die tägliche Zeit wählst du unten unter „Tägliche Planzeit“.', 'All exercises follow the real ÖSD format and level. Choose your daily time below under “Daily plan time”.')}</p>
    </section>`;
  }

  function refreshPlan(repick) {
    const s = st(); if (!s || !window.TDM || !TDM.active()) return;
    const go = () => {
      if (repick && s.plan) { const d = s.oesdMethod?.days?.[s.plan.date]; if (d && !started()) { delete d.picks; delete d.redemittel; } }
      if (s.plan && Array.isArray(s.plan.activities)) {
        const b = TDM.buildActivities(), byId = Object.fromEntries(b.activities.map((a) => [a.id, a]));
        s.plan.activities = s.plan.activities.map((a) => (byId[a.id] ? { ...a, dur: byId[a.id].dur, desc: byId[a.id].desc, title: byId[a.id].title } : a));
        s.plan.totalMinutes = s.plan.activities.reduce((x, a) => x + (Number(a.dur) || 0), 0);
        s.plan.availableMinutes = b.availableMinutes;
      }
      if (typeof saveData === 'function') saveData();
      if (typeof render === 'function') render();
    };
    TDM.ensureContent().then(go, go);
  }
  window.OSD = {
    setLevel(lv) {
      const m = mstate(); if (!LEVELS.includes(lv)) return;
      if (lv === P.level()) { delete m.levelNext; delete m.levelFrom; if (typeof saveData === 'function') saveData(); if (typeof render === 'function') render(); return; }
      if (started()) {
        const d = new Date(todayKey() + 'T12:00:00'); d.setDate(d.getDate() + 1);
        m.levelNext = lv; m.levelFrom = d.toISOString().slice(0, 10);
        if (typeof saveData === 'function') saveData(); if (typeof render === 'function') render(); return;
      }
      m.level = lv; delete m.levelNext; delete m.levelFrom; refreshPlan(true);
    }
  };
})();
