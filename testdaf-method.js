/* Amookht · TestDaF-Trainingssystem – static method knowledge (grammar cards, speaking types, rules). */
window.TDM_STATIC = {
  officialUrl: 'https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/vorbereitung-auf-den-digitalen-testdaf/',
  examStructure: [
    { skill: 'Lesen', tasks: '۳۴ سؤال', minutes: '۵۵ دقیقه' },
    { skill: 'Hören', tasks: '۳۰ سؤال', minutes: '۴۰ دقیقه' },
    { skill: 'Schreiben', tasks: '۲ فعالیت', minutes: '۶۰ دقیقه' },
    { skill: 'Sprechen', tasks: '۷ فعالیت', minutes: '۳۵ دقیقه' }
  ],
  rules: [
    'تمرین‌ها باید خروجی قابل‌اندازه‌گیری داشته باشند.',
    'در Hören، فهم مفهوم مهم‌تر از تعداد دفعات گوش‌دادن است.',
    'در Lesen، پاسخ باید بر اساس شواهد متن باشد.',
    'در Schreiben، ساختار و تحلیل اشتباهات الزامی است.',
    'در Sprechen، ضبط و اجرای مجدد باید انجام شود.',
    'لغات باید در قالب جمله و ترکیب کاربردی یاد گرفته شوند.',
    'اشتباهات پرتکرار باید در Fehlerprotokoll ثبت شوند.',
    'هر هفته عملکرد باید با هفته قبل مقایسه شود.'
  ],
  success: 'معیار موفقیت: هر هفته باید بتوانم کاری را انجام دهم که هفته قبل در انجام آن مشکل داشتم.',
  phases: {
    1: { name: 'Phase 1 · تثبیت پایه‌ها', weeks: 'هفته ۱ و ۲', items: ['تمرین Hören همراه Transkript', 'تقویت جمله‌سازی', 'مرور گرامر B2', 'نوشتن متن‌های کوتاه (حداقل ۱۵۰ کلمه)', 'ضبط روزانه مکالمه'] },
    2: { name: 'Phase 2 · تقویت مهارت آزمونی', weeks: 'هفته ۳ تا ۶', items: ['حل انواع سؤالات آزمونی', 'تمرین زمان‌دار', 'نوشتن متن‌های ۲۰۰ کلمه‌ای', 'Sprechen با زمان مشخص (توقف خودکار ضبط)', 'تحلیل دقیق اشتباهات'] },
    3: { name: 'Phase 3 · شبیه‌سازی آزمون', weeks: 'از هفته ۷ به بعد', items: ['آزمون‌های کامل (بخش «آزمون» در منوی کناری)', 'ارزیابی چهار مهارت', 'شناسایی ضعف‌های باقی‌مانده', 'تکرار آزمون‌های زمان‌دار', 'تمرکز بر مهارت‌های پایین‌تر از TDN 4'] }
  },
  resources: [
    ['Sicher B2.1', 'گرامر و واژگان'],
    ['نمونه آزمون رسمی', 'تمرین آزمونی (لینک رسمی پایین صفحه)'],
    ['پادکست آلمانی (مثلاً Deutschlandfunk, DW «Langsam gesprochene Nachrichten»)', 'تقویت Hören'],
    ['Anki', 'مرور لغات و ترکیبات (خروجی CSV از «دفتر عبارات»)'],
    ['ضبط‌کننده صدا', 'ارزیابی Sprechen (داخل همین برنامه)'],
    ['Fehlerprotokoll', 'تحلیل اشتباهات (بخش «اشتباهات» در منوی کناری)']
  ],
  methods: {
    hoeren: { title: 'Hören · ۶۰ دقیقه · اولویت اصلی', goal: 'درک مفهوم جملات، ارتباط بین اطلاعات و ساختار کلی صحبت، نه صرفاً تشخیص کلمات.', steps: ['Globales Hören (۵ دقیقه): بدون متن گوش بده؛ موضوع، مسئله و هدف گوینده.', 'Selektives Hören (۱۰ دقیقه): اعداد، دلایل، مزایا، معایب، مثال‌ها و نتیجه‌گیری‌ها را کلیدواژه‌ای یادداشت کن.', 'Transkription und Analyse (۱۵ دقیقه): بخش‌های نامفهوم را با متن بررسی کن و اشتباهات را در سه دسته ثبت کن.', 'Erneutes Hören (۱۰ دقیقه): بدون متن دوباره گوش بده.', 'Zusammenfassung (۲۰ دقیقه): بدون متن به آلمانی بازگو کن و صدایت را ضبط و بررسی کن.'], rule: 'اگر بعد از چند بار شنیدن جمله‌ای را متوجه نشدی، به‌جای تکرار بی‌هدف، متن و ساختار گرامری آن را تحلیل کن.' },
    lesen: { title: 'Lesen · ۴۵ دقیقه', goal: 'درک استدلال نویسنده، استخراج اطلاعات و پاسخ‌گویی دقیق به سؤالات.', steps: ['Überblick (۵ دقیقه): عنوان و تیترها، پیش‌بینی محتوا.', 'Intensives Lesen (۱۵ دقیقه): برای هر پاراگراف یک جمله مفهوم اصلی؛ بدون ترجمه کلمه‌به‌کلمه.', 'Aufgaben lösen (۱۵ دقیقه): کلمات کلیدی ← پاراگراف ← جمله پاسخ ← مقایسه گزینه‌ها ← انتخاب.', 'Fehleranalyse (۱۰ دقیقه): دسته‌بندی اشتباهات و خلاصه یک‌خطی.'] },
    schreiben: { title: 'Schreiben · ۵۰ دقیقه', goal: 'متن منسجم با ساختار روشن و تحلیل اشتباهات.', steps: ['Analyse (۵ دقیقه)', 'Gliederung (۵ دقیقه)', 'Schreiben (۲۵ دقیقه): هر پاراگراف = Behauptung + Begründung + Beispiel + Konsequenz', 'Korrektur (۱۰ دقیقه): Grammatik, Wortschatz, Konnektoren, Struktur, Aufgabenbezug', 'Fehlerprotokoll (۵ دقیقه): حداکثر سه اشتباه مهم با اصلاح و علت'] },
    sprechen: { title: 'Sprechen · ۳۵ دقیقه', goal: 'Prepare → Speak → Record → Analyze → Repeat', steps: ['آماده‌سازی (۵ دقیقه): فقط کلمات کلیدی، جمله کامل ننویس.', 'صحبت (۱۰ دقیقه): نظر شخصی، مزایا و معایب، نتیجه‌گیری.', 'ضبط و بررسی (۵ دقیقه): مکث، تکرار، جایگاه فعل، جملات ناقص، ادامه بحث.', 'اجرای مجدد (۱۵ دقیقه): بدون یادداشت؛ اگر جمله‌ای یادت رفت با ساختار دیگری منظور را برسان.'] },
    wortschatz: { title: 'Grammatik & Wortschatz · ۲۵ دقیقه', goal: 'یادگیری لغت در قالب ترکیب و جمله.', steps: ['۵ دقیقه: مرور لغات قبلی بدون نگاه به جزوه', '۱۰ دقیقه: پنج لغت جدید (Artikel, Plural, معنی, Wortart, ۵ ترکیب, جمله نمونه, Perfekt)', '۵ دقیقه: پنج Redemittel', '۵ دقیقه: پنج جمله (حداقل دو جمله با گرامر هفته)'] },
    wiederholung: { title: 'Wiederholung · ۲۵ دقیقه · Active Recall', goal: 'تثبیت مطالب از طریق بازیابی فعال.', steps: ['مرور لغات روز قبل (۵)', 'مرور اشتباهات گرامری (۵)', 'بازگویی محتوای روز قبل (۵)', 'مرور Redemittel (۵)', 'آزمون از خود بدون جزوه (۵)'], rule: 'فاصله‌های مرور: روز اول، روز بعد، سه روز بعد، هفت روز بعد، چهارده روز بعد. اگر مطلبی فراموش شد، زودتر مرور می‌شود.' }
  },
  week: [
    { wd: 6, day: 'شنبه', focus: 'Hören + Lesen', special: 'تحلیل فایل صوتی و متن' },
    { wd: 0, day: 'یکشنبه', focus: 'Hören + Schreiben', special: 'Argumentation' },
    { wd: 1, day: 'دوشنبه', focus: 'Hören + Sprechen', special: 'بازگویی و ارائه' },
    { wd: 2, day: 'سه‌شنبه', focus: 'Lesen + Schreiben', special: 'Grafikbeschreibung' },
    { wd: 3, day: 'چهارشنبه', focus: 'Hören + Sprechen', special: 'انواع سؤالات شفاهی' },
    { wd: 4, day: 'پنجشنبه', focus: 'چهار مهارت', special: 'تمرین زمان‌دار آزمون' },
    { wd: 5, day: 'جمعه', focus: 'ارزیابی', special: 'تحلیل اشتباهات و مرور' }
  ],
  grafikPhrases: [
    ['Die Grafik zeigt ...', 'نمودار نشان می‌دهد'],
    ['Im Vergleich zu ...', 'در مقایسه با'],
    ['Der Anteil steigt ...', 'سهم افزایش می‌یابد'],
    ['Im Gegensatz dazu ...', 'برخلاف آن'],
    ['Daraus lässt sich schließen, dass ...', 'از این می‌توان نتیجه گرفت که']
  ],
  speakingTypes: {
    rat_geben: { label: 'Rat geben', fa: 'توصیه دادن', how: 'مشکل را کوتاه خلاصه کن، دو یا سه توصیه مشخص بده و برای هر کدام دلیل بیاور؛ در پایان جمع‌بندی و آرزوی موفقیت.', phrases: ['An deiner Stelle würde ich ...', 'Ich würde dir raten, ...', 'Es wäre sinnvoll, wenn du ...', 'Auf keinen Fall solltest du ...'] },
    optionen_abwaegen: { label: 'Optionen abwägen', fa: 'سنجیدن گزینه‌ها', how: 'هر گزینه را با یک مزیت و یک عیب معرفی کن، معیار تصمیم را بگو و با دلیل یک گزینه را انتخاب کن.', phrases: ['Für Option A spricht, dass ...', 'Ein Nachteil von B ist allerdings ...', 'Wenn man beide Möglichkeiten vergleicht, ...', 'Alles in allem entscheide ich mich für ..., weil ...'] },
    text_zusammenfassen: { label: 'Text zusammenfassen', fa: 'خلاصه‌کردن متن', how: 'موضوع و منبع متن، دو یا سه اطلاعات اصلی و نتیجه متن را با جملات خودت بگو؛ جزئیات کم‌اهمیت را حذف کن.', phrases: ['In dem Text geht es um ...', 'Der Autor / Die Autorin stellt fest, dass ...', 'Außerdem wird erwähnt, dass ...', 'Zusammenfassend lässt sich sagen, dass ...'] },
    informationen_abgleichen: { label: 'Informationen abgleichen', fa: 'مقایسه اطلاعات', how: 'دو منبع را معرفی کن، نقاط هم‌سو و متناقض را مشخص کن و بگو کدام اطلاعات قابل اعتمادتر است یا چه چیزی کم است.', phrases: ['Beide Quellen stimmen darin überein, dass ...', 'Im Widerspruch dazu steht ...', 'Laut der Tabelle ...', 'Daraus ergibt sich, dass ...'] },
    thema_praesentieren: { label: 'Thema präsentieren', fa: 'ارائه موضوع', how: 'مقدمه و ساختار ارائه را بگو، نکات خواسته‌شده را به ترتیب توضیح بده، یک مثال بزن و با جمع‌بندی تمام کن.', phrases: ['In meiner Präsentation geht es um ...', 'Zunächst möchte ich ..., danach ...', 'Ein gutes Beispiel dafür ist ...', 'Abschließend möchte ich festhalten, dass ...'] },
    argumente_wiedergeben: { label: 'Argumente wiedergeben', fa: 'بازگویی استدلال‌ها', how: 'استدلال‌های شخص را بی‌طرف و با گفتار غیرمستقیم (Konjunktiv I) بازگو کن، سپس نظر کوتاه خودت را بگو.', phrases: ['Frau/Herr X ist der Meinung, dass ...', 'Als Argument führt sie/er an, dass ...', 'Ihrer/Seiner Ansicht nach sei ...', 'Ich persönlich sehe das etwas anders, weil ...'] },
    massnahmen_kritisieren: { label: 'Maßnahmen kritisieren', fa: 'نقد اقدامات', how: 'اقدام را خلاصه کن، دو مشکل مشخص را با دلیل نقد کن و یک پیشنهاد جایگزین واقع‌بینانه بده.', phrases: ['Die geplante Maßnahme sieht vor, dass ...', 'Ich halte das für problematisch, weil ...', 'Es ist zu befürchten, dass ...', 'Stattdessen wäre es besser, ...'] }
  },
  grammar: [
    { week: 1, title: 'Kausale und konzessive Nebensätze', fa: 'جمله‌های علّی و ضدّیتی (weil, da, obwohl) و جایگاه فعل', rule: 'Im Nebensatz steht das konjugierte Verb am Ende. „weil/da“ nennen einen Grund, „obwohl“ einen Gegengrund. Im Hauptsatz mit „deshalb/trotzdem“ steht das Verb auf Position 2.', forms: ['…, weil die Mieten stark gestiegen sind.', 'Da viele Studierende jobben, …', 'Obwohl das Angebot kostenlos ist, nutzen es nur wenige.', 'Das Angebot ist kostenlos. Trotzdem nutzen es nur wenige.'], mistakes: 'اشتباه رایج: فعل را بعد از weil در جایگاه دوم گذاشتن (weil die Mieten sind gestiegen ✗). بعد از trotzdem/deshalb فعل بلافاصله می‌آید.', task: 'دو جمله با weil/da و یک جمله با obwohl یا trotzdem درباره موضوع امروز بساز.' },
    { week: 2, title: 'Passiv und Passiversatz', fa: 'مجهول و جایگزین‌های مجهول', rule: 'Vorgangspassiv: werden + Partizip II. Mit Modalverb: muss/kann + Partizip II + werden. Ersatzformen: „sich lassen + Infinitiv“, „sein + zu + Infinitiv“, Adjektive auf „-bar“.', forms: ['Die Ergebnisse werden im Mai veröffentlicht.', 'Die Kosten müssen gesenkt werden.', 'Das Problem lässt sich leicht lösen.', 'Die Aufgabe ist bis Freitag zu erledigen.'], mistakes: 'اشتباه رایج: استفاده از sein به‌جای werden در مجهول فرایندی؛ فراموش‌کردن werden در انتهای جمله با فعل وجهی.', task: 'دو جمله مجهول و یک جمله با sich lassen یا sein + zu بساز.' },
    { week: 3, title: 'Nominalisierung und Nominalstil', fa: 'اسم‌سازی و سبک اسمی (مهم برای Lesen و Schreiben)', rule: 'Im akademischen Deutsch werden Verben oft zu Nomen: „Wenn man die Kosten senkt …“ → „Durch die Senkung der Kosten …“. Typische Präpositionen: durch, bei, nach, wegen, trotz, zur.', forms: ['Nachdem die Studie veröffentlicht wurde → Nach der Veröffentlichung der Studie', 'Weil die Preise steigen → Wegen des Anstiegs der Preise', 'um die Umwelt zu schützen → zum Schutz der Umwelt'], mistakes: 'اشتباه رایج: فراموش‌کردن حالت Genitiv بعد از اسم‌سازی (die Senkung die Kosten ✗ → der Kosten ✓).', task: 'سه جمله را از سبک فعلی به سبک اسمی تبدیل کن.' },
    { week: 4, title: 'Konjunktiv II und irreale Bedingungen', fa: 'وجه التزامی دوم: توصیه، فرض غیرواقعی، درخواست مؤدبانه', rule: 'würde + Infinitiv; bei häufigen Verben: wäre, hätte, könnte, müsste, sollte. Ratschläge: „An deiner Stelle würde ich …“, „Du solltest …“. Irreal: „Wenn …, würde …“.', forms: ['An deiner Stelle würde ich zur Studienberatung gehen.', 'Wenn die Mensa länger geöffnet hätte, könnten mehr Studierende dort essen.', 'Es wäre sinnvoll, die Frist zu verlängern.'], mistakes: 'اشتباه رایج: استفاده هم‌زمان از würde و hätte در یک بخش جمله؛ Konjunktiv II برای Rat geben در Sprechen بسیار پرکاربرد است.', task: 'سه توصیه و یک شرط غیرواقعی درباره موضوع امروز بنویس.' },
    { week: 5, title: 'Relativsätze und Partizipialattribute', fa: 'جمله‌های موصولی و صفت‌های فاعلی/مفعولی گسترده', rule: 'Relativpronomen richtet sich nach Genus/Numerus des Bezugsworts und nach dem Kasus im Relativsatz. Partizipialattribut: „die Studie, die im Mai veröffentlicht wurde“ → „die im Mai veröffentlichte Studie“.', forms: ['Die Studierenden, denen das Stipendium hilft, …', 'Die Stadt, in der ich studiere, …', 'die steigenden Mieten', 'die von der Regierung geplante Reform'], mistakes: 'اشتباه رایج: انتخاب حالت ضمیر موصولی بر اساس جمله اصلی؛ پایان صفت در Partizipialattribut.', task: 'دو جمله موصولی و یک Partizipialattribut بساز.' },
    { week: 6, title: 'Indirekte Rede (Konjunktiv I)', fa: 'نقل قول غیرمستقیم – برای «Argumente wiedergeben»', rule: 'Konjunktiv I: er/sie sei, habe, könne, müsse, werde. Wenn Konjunktiv I = Indikativ, nimmt man Konjunktiv II: „sie hätten“. Alternativ: „Laut …“, „… zufolge“, „Nach Ansicht von …“.', forms: ['Der Professor sagt, die Ergebnisse seien eindeutig.', 'Sie betont, man müsse mehr investieren.', 'Laut der Studie hätten viele Studierende Geldsorgen.'], mistakes: 'اشتباه رایج: تکرار مستقیم جمله‌ها بدون تغییر ضمیر و فعل؛ استفاده از ist به‌جای sei.', task: 'سه استدلال یک شخص را با گفتار غیرمستقیم بازگو کن.' },
    { week: 7, title: 'Zweiteilige Konnektoren und Textkohärenz', fa: 'حروف ربط دوبخشی و انسجام متن', rule: 'sowohl … als auch, nicht nur … sondern auch, weder … noch, entweder … oder, zwar … aber, einerseits … andererseits, je … desto. Sie strukturieren Argumente und Vergleiche.', forms: ['Online-Kurse sind zwar flexibel, aber sie erfordern viel Disziplin.', 'Je früher man beginnt, desto weniger Stress hat man.', 'Einerseits spart man Zeit, andererseits fehlt der Kontakt.'], mistakes: 'اشتباه رایج: ترتیب کلمات بعد از desto (desto man hat ✗ → desto weniger Stress hat man ✓).', task: 'سه جمله با سه حرف ربط دوبخشی متفاوت بنویس.' },
    { week: 8, title: 'Funktionsverbgefüge und Präpositionen mit Genitiv', fa: 'ترکیب‌های فعل-اسم و حروف اضافه با Genitiv', rule: 'Funktionsverbgefüge: eine Entscheidung treffen, zur Verfügung stehen, in Betracht ziehen, einen Beitrag leisten, Kritik üben. Genitiv-Präpositionen: aufgrund, trotz, während, hinsichtlich, angesichts, infolge.', forms: ['Die Hochschule stellt Räume zur Verfügung.', 'Angesichts der hohen Kosten …', 'Hinsichtlich der Finanzierung gibt es Fragen.'], mistakes: 'اشتباه رایج: فعل نامناسب برای اسم (eine Entscheidung machen ✗ → treffen ✓).', task: 'سه جمله با Funktionsverbgefüge و یک جمله با حرف اضافه Genitiv بنویس.' },
    /*GRAM-W22*/
    { week: 9, title: 'Infinitivkonstruktionen', fa: 'ساختارهای مصدری: zu، um … zu، ohne … zu، (an)statt … zu', rule: 'Nach vielen Verben und Ausdrücken folgt „zu + Infinitiv“ (Es ist wichtig, … zu …). Ziel: „um … zu“. Fehlende Handlung: „ohne … zu“. Alternative: „(an)statt … zu“. Nur möglich, wenn das Subjekt in beiden Teilen gleich ist.', forms: ['Es ist schwierig, in München eine Wohnung zu finden.', 'Viele jobben, um ihr Studium zu finanzieren.', 'Er gibt die Arbeit ab, ohne sie noch einmal zu lesen.', 'Statt Bus zu fahren, nehmen viele das Fahrrad.'], mistakes: 'اشتباه رایج: گذاشتن zu قبل از فعل وجهی (zu können ✓ ولی um zu studieren können ✗). در فعل‌های جداشدنی zu وسط می‌آید: anzufangen.', task: 'یک جمله با um … zu، یک جمله با ohne … zu و یک جمله با Es ist + صفت + zu بساز.' },
    { week: 10, title: 'Temporale Nebensätze und Zeitenfolge', fa: 'جمله‌های زمانی: als، wenn، nachdem، bevor، während، seitdem، bis', rule: '„als“ für ein einmaliges Ereignis in der Vergangenheit, „wenn“ für Wiederholung oder Zukunft. „nachdem“ verlangt Vorzeitigkeit: Nebensatz im Plusquamperfekt (Hauptsatz Präteritum) bzw. Perfekt (Hauptsatz Präsens). „während“ = gleichzeitig, „bevor“ = vorher, „seitdem“ = ab einem Zeitpunkt bis jetzt.', forms: ['Als ich nach Deutschland kam, sprach ich kaum Deutsch.', 'Nachdem die Studie veröffentlicht worden war, begann eine Debatte.', 'Bevor man sich einschreibt, muss man die Unterlagen einreichen.', 'Seitdem die Mieten steigen, ziehen viele ins Umland.'], mistakes: 'اشتباه رایج: wenn به‌جای als برای یک اتفاق یک‌باره در گذشته؛ استفاده از زمان یکسان بعد از nachdem.', task: 'دو جمله با nachdem (با زمان درست) و یک جمله با als یا seitdem درباره تجربه خودت بنویس.' },
    { week: 11, title: 'Modalverben zur Vermutung und Distanz', fa: 'فعل‌های وجهی در معنای حدس و نقل قول (muss، dürfte، könnte، soll، will)', rule: 'Modalverben können eine Einschätzung des Sprechers ausdrücken: „muss“ (fast sicher), „dürfte“ (wahrscheinlich), „kann/könnte“ (möglich). „soll“ = andere behaupten es, „will“ = die Person selbst behauptet es. Vergangenheit: Modalverb + Partizip II + haben/sein.', forms: ['Die Zahl dürfte weiter steigen.', 'Der Professor muss die Mail übersehen haben.', 'Die neue Regel soll ab Oktober gelten.', 'Er will die Arbeit allein geschrieben haben.'], mistakes: 'اشتباه رایج: قاطی کردن soll (به گفته دیگران) و will (ادعای خود شخص). در گذشته: muss … gemacht haben، نه musste machen.', task: 'برای یک نمودار یا خبر امروز دو حدس با dürfte/könnte و یک نقل قول با soll بنویس.' },
    { week: 12, title: 'Feste Präpositionen und Präpositionaladverbien', fa: 'فعل/اسم/صفت با حرف اضافه ثابت و da(r)- / wo(r)-', rule: 'Viele Verben, Nomen und Adjektive haben eine feste Präposition mit festem Kasus: sich interessieren für + Akk., abhängen von + Dat., teilnehmen an + Dat., die Kritik an + Dat., zufrieden mit + Dat. Bei Sachen ersetzt „da(r) + Präposition“ die Ergänzung, Fragen mit „wo(r) + Präposition“.', forms: ['Der Erfolg hängt stark von der Motivation ab.', 'Viele Studierende beschweren sich über die hohen Mieten.', 'Worüber diskutiert ihr? – Darüber, ob die Mensa länger öffnen soll.', 'Ich bin davon überzeugt, dass …'], mistakes: 'اشتباه رایج: حرف اضافه فارسی را ترجمه کردن (warten für ✗ → warten auf ✓). برای اشخاص da- استفاده نمی‌شود: an ihn، نه daran.', task: 'پنج فعل با حرف اضافه ثابت از متن امروز پیدا کن و با دو تا از آن‌ها جمله با da(r)-…, dass بساز.' },
    { week: 13, title: 'Finale und konsekutive Sätze', fa: 'جمله‌های هدف و نتیجه: damit، um … zu، sodass، so … dass، folglich', rule: 'Ziel: „damit“ (verschiedene Subjekte möglich) oder „um … zu“ (gleiches Subjekt). Folge: „sodass“, „so + Adjektiv + dass“, „solch- … dass“; im Hauptsatz „folglich, daher, infolgedessen“ (Verb auf Position 2).', forms: ['Die Uni bietet Kurse an, damit internationale Studierende sich schneller integrieren.', 'Die Mieten stiegen stark, sodass viele Studierende pendeln mussten.', 'Der Text war so komplex, dass kaum jemand ihn verstand.', 'Die Nachfrage sank. Folglich wurde das Angebot reduziert.'], mistakes: 'اشتباه رایج: um … zu وقتی فاعل دو جمله فرق دارد (باید damit باشد). بعد از folglich فعل بلافاصله می‌آید.', task: 'یک جمله با damit، یک جمله با sodass و یک جمله با folglich درباره موضوع امروز بنویس.' },
    { week: 14, title: 'Vergleiche und Grafikbeschreibung', fa: 'مقایسه: صفت تفضیلی و عالی، je … desto، im Vergleich zu', rule: 'Komparativ + „als“, Gleichheit mit „(genau)so … wie“. Proportional: „je + Komparativ …, desto/umso + Komparativ …“ (Verb im je-Teil am Ende). Grafik: „im Vergleich zu + Dat.“, „gegenüber + Dat.“, „doppelt so hoch wie“, „um 5 Prozent steigen“, „auf 20 Prozent sinken“.', forms: ['Je mehr Studierende jobben, desto weniger Zeit bleibt zum Lernen.', 'Im Vergleich zu 2015 ist der Anteil um 12 Prozentpunkte gestiegen.', 'Die Kosten sind fast doppelt so hoch wie in Leipzig.', 'Den höchsten Wert erreicht Berlin mit 38 Prozent.'], mistakes: 'اشتباه رایج: wie به‌جای als بعد از صفت تفضیلی؛ قاطی کردن um (مقدار تغییر) و auf (مقدار نهایی).', task: 'سه جمله برای توصیف یک نمودار بنویس: یکی با je … desto، یکی با um/auf و یکی با im Vergleich zu.' },
    { week: 15, title: 'Modale Nebensätze', fa: 'جمله‌های شیوه و روش: indem، dadurch dass، ohne dass، (an)statt dass', rule: '„indem“ und „dadurch, dass“ beschreiben das Mittel/den Weg (Frage: Wie?). „ohne dass“ nennt eine ausbleibende Folge, „(an)statt dass“ eine nicht gewählte Alternative. Verb am Ende des Nebensatzes. Nominal: „durch + Akk.“.', forms: ['Man kann Energie sparen, indem man die Heizung herunterdreht.', 'Die Stadt senkte die Emissionen dadurch, dass sie den Nahverkehr ausbaute.', 'Die Regel wurde geändert, ohne dass die Studierenden gefragt wurden.', 'Durch den Ausbau des Nahverkehrs sanken die Emissionen.'], mistakes: 'اشتباه رایج: استفاده از damit یا wenn به‌جای indem برای «با … کردن».', task: 'دو راه‌حل برای مسئله امروز با indem و یکی با dadurch, dass بنویس؛ یکی را به سبک اسمی با durch تبدیل کن.' },
    { week: 16, title: 'Bedingungen ohne „wenn“', fa: 'شرط بدون wenn: falls، sofern، فعل در ابتدای جمله، bei/im Falle', rule: 'Neben „wenn“: „falls“ (für den Fall), „sofern“ (unter der Bedingung). Gehoben: Verb an Position 1 („Steigen die Kosten, …“). Nominal: „bei + Dat.“, „im Falle + Gen.“, „ohne + Akk.“ (negative Bedingung), „unter der Bedingung, dass …“.', forms: ['Falls du Hilfe brauchst, melde dich.', 'Sofern die Finanzierung gesichert ist, beginnt das Projekt im März.', 'Steigen die Mieten weiter, ziehen noch mehr Menschen aufs Land.', 'Bei schlechtem Wetter findet die Exkursion nicht statt.'], mistakes: 'اشتباه رایج: در ساختار بدون wenn، فعل اول می‌آید و جمله اصلی با فعل شروع می‌شود (Steigen die Kosten, so/dann sinkt …).', task: 'یک جمله با falls، یک جمله با sofern و یک جمله شرطی که با فعل شروع می‌شود بنویس.' },
    { week: 17, title: 'Gegensätze ausdrücken', fa: 'تقابل و تضاد: während، wohingegen، jedoch، dagegen، hingegen، zwar … aber', rule: 'Nebensatz: „während“ und „wohingegen“ (Verb am Ende). Hauptsatz: „jedoch, dagegen, hingegen“ auf Position 1 oder im Mittelfeld. „zwar … aber“ räumt etwas ein und setzt einen Kontrast. Nominal: „im Gegensatz zu + Dat.“.', forms: ['Während in Städten die Mieten steigen, stehen auf dem Land Häuser leer.', 'Die Befürworter betonen die Kosten, die Gegner hingegen die Umwelt.', 'Das Angebot ist zwar teuer, aber es lohnt sich.', 'Im Gegensatz zu früher studieren heute viele in Teilzeit.'], mistakes: 'اشتباه رایج: پس از jedoch در جایگاه اول، فعل بلافاصله می‌آید (Jedoch ist …). während هم «در حالی که» است هم «در طول»؛ از ساختار جمله معلوم می‌شود.', task: 'دو دیدگاه متضاد از موضوع امروز را با während/wohingegen و hingegen در سه جمله مقایسه کن.' },
    { week: 18, title: 'Konjunktiv II der Vergangenheit', fa: 'وجه التزامی دوم گذشته: hätte/wäre + Partizip II، hätte … sollen', rule: 'Irreale Vergangenheit: „hätte/wäre + Partizip II“. Mit Modalverb: „hätte + Infinitiv + Modalverb im Infinitiv“ (hätte machen sollen). Typisch für Kritik und Bedauern: „Man hätte … sollen“, „Es wäre besser gewesen, …“.', forms: ['Wenn ich früher angefangen hätte, wäre ich fertig geworden.', 'Die Stadt hätte die Bürger früher informieren sollen.', 'Es wäre besser gewesen, die Maßnahme zu testen.', 'Ohne das Stipendium hätte sie nicht studieren können.'], mistakes: 'اشتباه رایج: استفاده از würde برای گذشته (würde gemacht haben ✗ → hätte gemacht ✓)؛ ترتیب فعل‌ها: hätte … machen sollen.', task: 'یک تصمیم یا اقدام از موضوع امروز را با دو جمله hätte … sollen و یک جمله Es wäre besser gewesen نقد کن.' },
    { week: 19, title: 'Futur I und II: Prognosen und Vermutungen', fa: 'آینده اول و دوم: پیش‌بینی، برنامه و حدس درباره گذشته', rule: 'Futur I (werden + Infinitiv): Prognose, Versprechen oder Vermutung über die Gegenwart. Futur II (werden + Partizip II + haben/sein): etwas wird zu einem Zeitpunkt abgeschlossen sein oder Vermutung über Vergangenes. In Grafik-Texten: „Es ist zu erwarten, dass …“, „voraussichtlich“.', forms: ['Bis 2030 wird der Anteil voraussichtlich auf 50 Prozent steigen.', 'Er wird jetzt in der Bibliothek sein.', 'Bis Ende Mai werde ich die Arbeit abgegeben haben.', 'Sie wird den Termin wohl vergessen haben.'], mistakes: 'اشتباه رایج: استفاده از werden + فعل صرف‌شده (wird steigt ✗)؛ فراموش کردن haben/sein در آینده دوم.', task: 'سه پیش‌بینی برای روند یک نمودار با Futur I و voraussichtlich بنویس و یک حدس با Futur II.' },
    { week: 20, title: 'Wortbildung in Fachtexten', fa: 'واژه‌سازی: پیشوندها و پسوندها (‑ung، ‑heit، ‑keit، ‑bar، ‑los، ver‑، ent‑، miss‑)', rule: 'Nomen aus Verben: -ung (die Entwicklung), aus Adjektiven: -heit/-keit (die Sicherheit, die Möglichkeit) – alle feminin. Adjektive: -bar (= kann man …), -los (= ohne), -reich, -arm. Präfixe ändern die Bedeutung: ver- (falsch/weg), ent- (weg/Gegenteil), miss- (schlecht/falsch).', forms: ['messen → die Messung → messbar', 'die Arbeit → arbeitslos; die Hilfe → hilfreich', 'trauen → misstrauen; laden → entladen', 'Die Umsetzbarkeit des Plans ist fraglich.'], mistakes: 'اشتباه رایج: آرتیکل اشتباه برای اسم‌های ‑ung/‑heit/‑keit (همه die هستند). ‑bar را با ‑lich قاطی نکن.', task: 'از متن Lesen امروز شش کلمه مشتق‌شده پیدا کن، ریشه هر کدام را بنویس و با دو تا جمله بساز.' },
    { week: 21, title: 'Textverweise und Kohärenz', fa: 'ارجاع در متن: dies، derjenige، ersterer/letzterer، solch-، ebenso', rule: 'Gute Texte verweisen klar zurück: „dies/das“ auf ganze Aussagen, „dieser/diese“ auf Nomen, „ersterer/letzterer“ bei zwei Elementen, „derjenige, der …“ für Hervorhebung, „Ein solcher Ansatz …“. Wiederholung vermeiden durch Synonyme und Oberbegriffe.', forms: ['Die Mieten steigen. Dies führt dazu, dass viele pendeln.', 'Es gibt Bus und Bahn; letztere ist schneller.', 'Diejenigen, die früh anfangen, haben weniger Stress.', 'Ein solches Modell wäre auch in Deutschland denkbar.'], mistakes: 'اشتباه رایج: ارجاع مبهم با es یا das وقتی معلوم نیست به کدام اسم برمی‌گردد؛ صرف نکردن ersterer/letzterer.', task: 'یک پاراگراف چهار جمله‌ای درباره موضوع امروز بنویس و در آن از dies، ein solch- و letzterer استفاده کن.' },
    { week: 22, title: 'Satzbau im Mittelfeld und Negation', fa: 'ترتیب اجزای جمله (TeKaMoLo) و جایگاه nicht', rule: 'Im Mittelfeld gilt meist: Pronomen vor Nomen, Dativ vor Akkusativ (bei Nomen), Angaben in der Reihenfolge temporal – kausal – modal – lokal (TeKaMoLo). „nicht“ steht vor dem Teil, der verneint wird; bei Satznegation möglichst weit hinten, aber vor Präpositionalergänzung, Adjektiv und zweitem Verbteil.', forms: ['Sie hat ihm das Buch gestern wegen der Prüfung schnell in der Bibliothek gegeben.', 'Ich habe es ihr nicht gesagt.', 'Er interessiert sich nicht für Politik.', 'Nicht die Kosten, sondern die Zeit ist das Problem.'], mistakes: 'اشتباه رایج: گذاشتن مکان قبل از زمان (in Berlin gestern ✗)؛ nicht در انتهای جمله بعد از حرف اضافه (für Politik nicht ✗).', task: 'سه جمله طولانی با دست‌کم سه قید (زمان، علت، مکان) بنویس و یکی از آن‌ها را منفی کن.' }
  ]
};
/* Amookht · TestDaF-Trainingssystem v1 – daily method engine.
   Hooks into the main app: S, render, saveData, startTimer, completeActivity, recordAnswerPerformance,
   rememberLearningError, reviewError, errorIsDue, apiRequest, safeText, today, timeStr, iconSvg. */
(function () {
  'use strict';
  const TDM = (window.TDM = window.TDM || {});
  /*OSD*/ const PROG = () => { const p = window.OSD_PROFILE; return p && typeof S !== 'undefined' && false && p ? p : null; }; /*UNIFIED-PLAN: one learning plan for everyone; ÖSD exists only as a simulation*/
  const CT = () => (PROG() ? PROG().content() : window.TDM_CONTENT);
  TDM.program = () => (PROG() ? 'oesd' : 'testdaf');
  const STATIC_METHOD_COPY={"Analyse (۵ دقیقه)":{"en":"Analysis (5 minutes)","de":"Analyse (5 Minuten)"},"Aufgaben lösen (۱۵ دقیقه): کلمات کلیدی ← پاراگراف ← جمله پاسخ ← مقایسه گزینه‌ها ← انتخاب.":{"en":"Aufgaben lösen (15 minutes): keywords → paragraph → answer sentence → compare options → choose.","de":"Aufgaben lösen (15 Minuten): Stichworte → Absatz → Antwortsatz → Optionen vergleichen → wählen."},"Erneutes Hören (۱۰ دقیقه): بدون متن دوباره گوش بده.":{"en":"Erneutes Hören (10 minutes): Listen again without text.","de":"Erneutes Hören (10 Minuten): Nochmals ohne Text anhören."},"Fehleranalyse (۱۰ دقیقه): دسته‌بندی اشتباهات و خلاصه یک‌خطی.":{"en":"Fehleranalyse (10 minutes): Error classification and one-line summary.","de":"Fehleranalyse (10 Minuten): Fehlerklassifizierung und einzeilige Zusammenfassung."},"Fehlerprotokoll (۵ دقیقه): حداکثر سه اشتباه مهم با اصلاح و علت":{"en":"Fehlerprotokoll (5 minutes): maximum three important errors with correction and cause","de":"Fehlerprotokoll (5 Minuten): maximal drei wichtige Fehler mit Korrektur und Ursache"},"Gliederung (۵ دقیقه)":{"en":"Gliederung (5 minutes)","de":"Gliederung (5 Minuten)"},"Globales Hören (۵ دقیقه): بدون متن گوش بده؛ موضوع، مسئله و هدف گوینده.":{"en":"Globales Hören (5 minutes): listen without text; The speaker's subject, problem and goal.","de":"Globales Hören (5 Minuten): Hören ohne Text; Thema, Problem und Ziel des Redners."},"Grammatik & Wortschatz · ۲۵ دقیقه":{"en":"Grammar & vocabulary · 25 minutes","de":"Grammatik & Wortschatz · 25 Minuten"},"Hören · ۶۰ دقیقه · اولویت اصلی":{"en":"Listening · 60 minutes · Main priority","de":"Hören · 60 Minuten · höchste Priorität"},"Intensives Lesen (۱۵ دقیقه): برای هر پاراگراف یک جمله مفهوم اصلی؛ بدون ترجمه کلمه‌به‌کلمه.":{"en":"Intensive Reading (15 minutes): for each paragraph, one main concept sentence; No word for word translation.","de":"Intensives Lesen (15 Minuten): für jeden Absatz ein Hauptkonzeptsatz; Keine Wort-für-Wort-Übersetzung."},"Korrektur (۱۰ دقیقه): Grammatik, Wortschatz, Konnektoren, Struktur, Aufgabenbezug":{"de":"Korrektur (10 Minuten): Grammatik, Wortschatz, Konnektoren, Struktur, Aufgabenbezug","en":"Korrektur (10 minutes): Grammatik, Wortschatz, Konnektoren, Struktur, Aufgabenbezug"},"Lesen · ۴۵ دقیقه":{"en":"Reading · 45 minutes","de":"Lesen · 45 Minuten"},"Phase 1 · تثبیت پایه‌ها":{"en":"Phase 1 · Building foundations","de":"Phase 1 · Grundlagen festigen"},"Phase 2 · تقویت مهارت آزمونی":{"en":"Phase 2 · Strengthening exam skills","de":"Phase 2 · Prüfungskompetenzen stärken"},"Phase 3 · شبیه‌سازی آزمون":{"en":"Phase 3 · Exam simulation","de":"Phase 3 · Prüfungssimulation"},"Schreiben (۲۵ دقیقه): هر پاراگراف = Behauptung + Begründung + Beispiel + Konsequenz":{"en":"Schreiben (25 minutes): each paragraph = Behauptung + Begründung + Beispiel + Konsequenz","de":"Schreiben (25 Minuten): jeder Absatz = Behauptung + Begründung + Beispiel + Konsequenz"},"Schreiben · ۵۰ دقیقه":{"en":"Writing · 50 minutes","de":"Schreiben · 50 Minuten"},"Selektives Hören (۱۰ دقیقه): اعداد، دلایل، مزایا، معایب، مثال‌ها و نتیجه‌گیری‌ها را کلیدواژه‌ای یادداشت کن.":{"en":"Selektives Hören (10 minutes): Keynote numbers, reasons, advantages, disadvantages, examples and conclusions.","de":"Selektives Hören (10 Minuten): Keynote-Nummern, Gründe, Vor- und Nachteile, Beispiele und Schlussfolgerungen."},"Sprechen · ۳۵ دقیقه":{"en":"Speaking · 35 minutes","de":"Sprechen · 35 Minuten"},"Sprechen با زمان مشخص (توقف خودکار ضبط)":{"en":"Sprechen with specified time (auto stop recording)","de":"Sprechen mit vorgegebener Zeit (Aufnahme automatisch stoppen)"},"Transkription und Analyse (۱۵ دقیقه): بخش‌های نامفهوم را با متن بررسی کن و اشتباهات را در سه دسته ثبت کن.":{"de":"Transkription und Analyse (15 Minuten): Überprüfen Sie die unklaren Teile mit dem Text und notieren Sie die Fehler in drei Kategorien.","en":"Transcription und Analyze (15 minutes): check the unclear parts with the text and record the mistakes in three categories."},"Wiederholung · ۲۵ دقیقه · Active Recall":{"en":"Review · 25 minutes · active recall","de":"Wiederholung · 25 Minuten · aktives Abrufen"},"Zusammenfassung (۲۰ دقیقه): بدون متن به آلمانی بازگو کن و صدایت را ضبط و بررسی کن.":{"en":"Zusammenfassung (20 minutes): Recite in German without text and record and check your voice.","de":"Zusammenfassung (20 Minuten): Rezitieren Sie auf Deutsch ohne Text und nehmen Sie Ihre Stimme auf und überprüfen Sie sie."},"Überblick (۵ دقیقه): عنوان و تیترها، پیش‌بینی محتوا.":{"en":"Overview (5 minutes): title and headings, content preview.","de":"Überblick (5 Minuten): Titel und Überschriften, Inhaltsvorschau."},"آزمون از خود بدون جزوه (۵)":{"en":"Self-test without booklet (5)","de":"Selbsttest ohne Heft (5)"},"آزمون‌های کامل (بخش «آزمون» در منوی کناری)":{"en":"Complete tests (\"Test\" section in the side menu)","de":"Komplette Tests (Abschnitt „Test“ im Seitenmenü)"},"آماده‌سازی (۵ دقیقه): فقط کلمات کلیدی، جمله کامل ننویس.":{"en":"Preparation (5 minutes): Only key words, don't write complete sentences.","de":"Vorbereitung (5 Minuten): Nur Schlüsselwörter, keine ganzen Sätze schreiben."},"اجرای مجدد (۱۵ دقیقه): بدون یادداشت؛ اگر جمله‌ای یادت رفت با ساختار دیگری منظور را برسان.":{"en":"Repeat performance (15 minutes): without notes; If you forget a sentence, use another structure to convey the meaning.","de":"Wiederholung (15 Minuten): ohne Noten; Wenn Sie einen Satz vergessen, verwenden Sie eine andere Struktur, um die Bedeutung zu vermitteln."},"ارائه موضوع":{"en":"Presentation of the subject","de":"Vorstellung des Themas"},"ارزیابی":{"en":"Evaluation","de":"Auswertung"},"ارزیابی Sprechen (داخل همین برنامه)":{"en":"Sprechen evaluation (within the same app)","de":"Sprechen-Auswertung (innerhalb der gleichen App)"},"ارزیابی چهار مهارت":{"en":"Assessment of four skills","de":"Bewertung von vier Fähigkeiten"},"از این می‌توان نتیجه گرفت که":{"en":"From this we can conclude that","de":"Daraus können wir schließen"},"از هفته ۷ به بعد":{"de":"Ab Woche 7","en":"From week 7 onwards"},"استدلال‌های شخص را بی‌طرف و با گفتار غیرمستقیم (Konjunktiv I) بازگو کن، سپس نظر کوتاه خودت را بگو.":{"en":"Restate the person's arguments neutrally and in indirect speech (Konjunktiv I), then give your own brief opinion.","de":"Wiederholen Sie die Argumente der Person neutral und in indirekter Rede (Konjunktiv I) und geben Sie dann Ihre eigene kurze Meinung ab."},"اسم‌سازی و سبک اسمی (مهم برای Lesen و Schreiben)":{"de":"Substantivbildung und Nominalstil (wichtig für Lesen und Schreiben)","en":"Noun formation and nominal style (important for Lesen and Schreiben)"},"اشتباه رایج: استفاده از sein به‌جای werden در مجهول فرایندی؛ فراموش‌کردن werden در انتهای جمله با فعل وجهی.":{"en":"Common mistake: using sein instead of werden in the processional indefinite; Forgetting werden at the end of a sentence with a modal verb.","de":"Häufiger Fehler: Verwendung von „sein“ anstelle von „werden“ im Prozessions-Indefinite; Vergessen werden am Ende eines Satzes mit einem Modalverb."},"اشتباه رایج: استفاده هم‌زمان از würde و hätte در یک بخش جمله؛ Konjunktiv II برای Rat geben در Sprechen بسیار پرکاربرد است.":{"en":"Common mistake: using würde and hätte at the same time in the same part of the sentence; Konjunktiv II for Rat geben is very common in Sprechen.","de":"Häufiger Fehler: würde und hätte gleichzeitig im selben Satzteil verwendet; Konjunktiv II für Rat geben ist im Sprechen sehr verbreitet."},"اشتباه رایج: انتخاب حالت ضمیر موصولی بر اساس جمله اصلی؛ پایان صفت در Partizipialattribut.":{"en":"Common mistake: choosing the mode of relative pronoun based on the main sentence; Adjective ending in Partizipialattribute.","de":"Häufiger Fehler: Wahl des Modus des Relativpronomens basierend auf dem Hauptsatz; Adjektiv mit der Endung Partizipialattribute."},"اشتباه رایج: ترتیب کلمات بعد از desto (desto man hat ✗ → desto weniger Stress hat man ✓).":{"en":"Common mistake: word order after desto (desto man hat ✗ → desto weniger Stress hat man ✓).","de":"Häufiger Fehler: Wortreihenfolge nach desto (desto man hat ✗ → desto weniger Stress hat man ✓)."},"اشتباه رایج: تکرار مستقیم جمله‌ها بدون تغییر ضمیر و فعل؛ استفاده از ist به‌جای sei.":{"en":"Common mistake: direct repetition of sentences without changing pronouns and verbs; Use ist instead of sei.","de":"Häufiger Fehler: direkte Wiederholung von Sätzen ohne Änderung von Pronomen und Verben; Verwenden Sie ist anstelle von sei."},"اشتباه رایج: فراموش‌کردن حالت Genitiv بعد از اسم‌سازی (die Senkung die Kosten ✗ → der Kosten ✓).":{"en":"Common mistake: Forgetting the genitive case after noun formation (die Senkung die Kosten ✗ → der Kosten ✓).","de":"Häufiger Fehler: Vergessen des Genitivs nach der Substantivbildung (die Senkung die Kosten ✗ → der Kosten ✓)."},"اشتباه رایج: فعل را بعد از weil در جایگاه دوم گذاشتن (weil die Mieten sind gestiegen ✗). بعد از trotzdem/deshalb فعل بلافاصله می‌آید.":{"en":"Common mistake: putting the verb in the second position after weil (weil die Mieten sind gestiegen ✗). After trotzdem/deshalb comes the verb immediately.","de":"Häufiger Fehler: Setzen Sie das Verb an die zweite Position nach weil (weil die Mieten sind gestiegen ✗). Nach trotzdem/deshalb kommt das Verb sofort."},"اشتباه رایج: فعل نامناسب برای اسم (eine Entscheidung machen ✗ → treffen ✓).":{"en":"Common mistake: inappropriate verb for noun (eine Entscheidung machen ✗ → treffen ✓).","de":"Häufiger Fehler: unangemessenes Verb für Substantiv (eine Entscheidung machen ✗ → treffen ✓)."},"اشتباهات پرتکرار باید در Fehlerprotokoll ثبت شوند.":{"de":"Häufige Fehler sollten im Fehlerprotokoll erfasst werden.","en":"Frequent errors should be recorded in the Fehlerprotokoll."},"اقدام را خلاصه کن، دو مشکل مشخص را با دلیل نقد کن و یک پیشنهاد جایگزین واقع‌بینانه بده.":{"en":"Summarize the action, criticize two specific problems with reason, and propose a realistic alternative.","de":"Fassen Sie die Aktion zusammen, kritisieren Sie zwei spezifische Probleme mit Vernunft und schlagen Sie eine realistische Alternative vor."},"انواع سؤالات شفاهی":{"en":"Types of oral questions","de":"Arten von mündlichen Fragen"},"اگر بعد از چند بار شنیدن جمله‌ای را متوجه نشدی، به‌جای تکرار بی‌هدف، متن و ساختار گرامری آن را تحلیل کن.":{"en":"If you don't understand a sentence after hearing it a few times, instead of repeating it aimlessly, analyze its text and grammatical structure.","de":"Wenn Sie einen Satz nach mehrmaligem Hören nicht verstehen, sollten Sie ihn nicht ziellos wiederholen, sondern seinen Text und seine grammatikalische Struktur analysieren."},"بازگویی استدلال‌ها":{"en":"Retelling the arguments","de":"Die Argumente noch einmal erzählen"},"بازگویی محتوای روز قبل (۵)":{"en":"Retelling the content of the previous day (5)","de":"Den Inhalt des Vortages noch einmal erzählen (5)"},"بازگویی و ارائه":{"de":"Nacherzählung und Präsentation","en":"Retelling and presentation"},"برخلاف آن":{"en":"Contrary to that","de":"Im Gegensatz dazu"},"تثبیت مطالب از طریق بازیابی فعال.":{"de":"Inhaltsstabilisierung durch aktive Wiederherstellung.","en":"Content stabilization through active recovery."},"تحلیل اشتباهات (بخش «اشتباهات» در منوی کناری)":{"en":"Error analysis (\"Errors\" section in the side menu)","de":"Fehleranalyse (Bereich „Fehler“ im Seitenmenü)"},"تحلیل اشتباهات و مرور":{"en":"Error analysis and review","de":"Fehleranalyse und -überprüfung"},"تحلیل دقیق اشتباهات":{"en":"Detailed analysis of errors","de":"Detaillierte Fehleranalyse"},"تحلیل فایل صوتی و متن":{"en":"Audio and text file analysis","de":"Analyse von Audio- und Textdateien"},"ترکیب‌های فعل-اسم و حروف اضافه با Genitiv":{"de":"Verb-Nomen-Kombinationen und Präpositionen mit Genitiv","en":"Verb-Noun Combinations and Prepositions with Genitive"},"تقویت Hören":{"de":"Hören stärken","en":"Strengthen Hören"},"تقویت جمله‌سازی":{"en":"Strengthening sentences","de":"Sätze stärken"},"تمرکز بر مهارت‌های پایین‌تر از TDN 4":{"de":"Konzentrieren Sie sich auf Fähigkeiten unter TDN 4","en":"Focus on skills below TDN 4"},"تمرین Hören همراه Transkript":{"en":"Hören practice with Transkript","de":"Hören üben mit Transkript"},"تمرین آزمونی (لینک رسمی پایین صفحه)":{"en":"Test practice (official link at the bottom of the page)","de":"Testpraxis (offizieller Link unten auf der Seite)"},"تمرین زمان‌دار":{"en":"Timed exercise","de":"Zeitgesteuerte Übung"},"تمرین زمان‌دار آزمون":{"en":"Timed practice test","de":"Zeitgesteuerter Übungstest"},"تمرین‌ها باید خروجی قابل‌اندازه‌گیری داشته باشند.":{"en":"Exercises should have a measurable output.","de":"Übungen sollten einen messbaren Output haben."},"توصیه دادن":{"en":"to advise","de":"zu beraten"},"تکرار آزمون‌های زمان‌دار":{"de":"Wiederholung zeitgesteuerter Tests","en":"Repetition of timed tests"},"جمعه":{"en":"Friday","de":"Freitag"},"جمله‌های علّی و ضدّیتی (weil, da, obwohl) و جایگاه فعل":{"en":"Causal and opposite sentences (weil, da, obwohl) and the position of the verb","de":"Kausal- und Gegensätze (weil, da, obwohl) und die Position des Verbs"},"جمله‌های موصولی و صفت‌های فاعلی/مفعولی گسترده":{"en":"Relative clauses and extended active/passive adjectives","de":"Relativsätze und erweiterte Aktiv/Passiv-Adjektive"},"حروف ربط دوبخشی و انسجام متن":{"en":"Bipartite conjunctions and text coherence","de":"Bipartite Konjunktionen und Textkohärenz"},"حل انواع سؤالات آزمونی":{"en":"Solve all kinds of test questions","de":"Lösen Sie alle Arten von Testfragen"},"خلاصه‌کردن متن":{"en":"Summarizing the text","de":"Den Text zusammenfassen"},"در Hören، فهم مفهوم مهم‌تر از تعداد دفعات گوش‌دادن است.":{"en":"In Hören, understanding the concept is more important than the number of times you listen.","de":"Beim Hören ist das Verständnis des Konzepts wichtiger als die Häufigkeit, mit der man zuhört."},"در Lesen، پاسخ باید بر اساس شواهد متن باشد.":{"en":"In Lesen, the answer must be based on evidence from the text.","de":"Beim Lesen muss die Antwort auf Beweisen aus dem Text basieren."},"در Schreiben، ساختار و تحلیل اشتباهات الزامی است.":{"en":"In Schreiben, structure and error analysis are required.","de":"Beim Schreiben sind Struktur- und Fehleranalyse gefragt."},"در Sprechen، ضبط و اجرای مجدد باید انجام شود.":{"en":"In Sprechen, recording and playback must be done.","de":"Beim Sprechen müssen Aufnahme und Wiedergabe erfolgen."},"در مقایسه با":{"en":"compared to","de":"im Vergleich zu"},"درک استدلال نویسنده، استخراج اطلاعات و پاسخ‌گویی دقیق به سؤالات.":{"en":"Understanding the author's reasoning, extracting information and answering questions accurately.","de":"Die Argumentation des Autors verstehen, Informationen extrahieren und Fragen genau beantworten."},"درک مفهوم جملات، ارتباط بین اطلاعات و ساختار کلی صحبت، نه صرفاً تشخیص کلمات.":{"en":"Understanding the meaning of sentences, the connection between information and the overall structure of speech, not just recognizing words.","de":"Verstehen der Bedeutung von Sätzen, des Zusammenhangs zwischen Informationen und der Gesamtstruktur der Sprache, nicht nur das Erkennen von Wörtern."},"دو جمله با weil/da و یک جمله با obwohl یا trotzdem درباره موضوع امروز بساز.":{"de":"Bilden Sie zwei Sätze mit weil/da und einen Satz mit obwohl oder trotzdem zum heutigen Thema.","en":"Make two sentences with weil/da and one sentence with obwohl or trotzdem about today's topic."},"دو جمله مجهول و یک جمله با sich lassen یا sein + zu بساز.":{"en":"Make two indefinite sentences and one sentence with sich lassen or sein + zu.","de":"Bilden Sie zwei unbestimmte Sätze und einen Satz mit sich lassen oder sein + zu."},"دو جمله موصولی و یک Partizipialattribut بساز.":{"en":"Make two relative clauses and a Partizipialattribute.","de":"Erstellen Sie zwei Relativsätze und ein Partizipialattribut."},"دو منبع را معرفی کن، نقاط هم‌سو و متناقض را مشخص کن و بگو کدام اطلاعات قابل اعتمادتر است یا چه چیزی کم است.":{"en":"Cite the two sources, identify points of agreement and conflict, and say which information is more reliable or what is lacking.","de":"Zitieren Sie die beiden Quellen, identifizieren Sie Übereinstimmungen und Konflikte und sagen Sie, welche Informationen zuverlässiger sind oder welche fehlen."},"دوشنبه":{"en":"Monday","de":"Montag"},"سنجیدن گزینه‌ها":{"en":"Weigh the options","de":"Wägen Sie die Optionen ab"},"سه استدلال یک شخص را با گفتار غیرمستقیم بازگو کن.":{"en":"Retell three arguments of a person using indirect speech.","de":"Erzählen Sie drei Argumente einer Person in indirekter Sprache noch einmal."},"سه توصیه و یک شرط غیرواقعی درباره موضوع امروز بنویس.":{"en":"Write three recommendations and one unrealistic condition about today's topic.","de":"Schreiben Sie drei Empfehlungen und eine unrealistische Bedingung zum heutigen Thema."},"سه جمله با Funktionsverbgefüge و یک جمله با حرف اضافه Genitiv بنویس.":{"en":"Write three sentences with Funktionsverbgefüge and one sentence with Genitive preposition.","de":"Schreiben Sie drei Sätze mit Funktionsverbgefüge und einen Satz mit Genitivpräposition."},"سه جمله با سه حرف ربط دوبخشی متفاوت بنویس.":{"en":"Write three sentences with three different two-part conjunctions.","de":"Schreiben Sie drei Sätze mit drei verschiedenen zweiteiligen Konjunktionen."},"سه جمله را از سبک فعلی به سبک اسمی تبدیل کن.":{"en":"Change the three sentences from the present tense to the nominative tense.","de":"Wandeln Sie die drei Sätze vom Präsens in den Nominativ um."},"سهم افزایش می‌یابد":{"de":"Der Anteil steigt","en":"The share increases"},"سه‌شنبه":{"de":"Dienstag","en":"Tuesday"},"شناسایی ضعف‌های باقی‌مانده":{"en":"Identify remaining weaknesses","de":"Identifizieren Sie verbleibende Schwachstellen"},"شنبه":{"en":"Saturday","de":"Samstag"},"صحبت (۱۰ دقیقه): نظر شخصی، مزایا و معایب، نتیجه‌گیری.":{"en":"Talk (10 minutes): personal opinion, advantages and disadvantages, conclusion.","de":"Vortrag (10 Minuten): Persönliche Meinung, Vor- und Nachteile, Fazit."},"ضبط روزانه مکالمه":{"en":"Daily recording of conversation","de":"Tägliche Gesprächsaufzeichnung"},"ضبط و بررسی (۵ دقیقه): مکث، تکرار، جایگاه فعل، جملات ناقص، ادامه بحث.":{"en":"Recording and review (5 minutes): pause, repetition, verb position, incomplete sentences, continuation of the discussion.","de":"Aufzeichnung und Wiederholung (5 Minuten): Pause, Wiederholung, Verbposition, unvollständige Sätze, Fortsetzung der Diskussion."},"ضبط‌کننده صدا":{"en":"Voice recorder","de":"Diktiergerät"},"فاصله‌های مرور: روز اول، روز بعد، سه روز بعد، هفت روز بعد، چهارده روز بعد. اگر مطلبی فراموش شد، زودتر مرور می‌شود.":{"de":"Überprüfungsintervalle: erster Tag, nächster Tag, drei Tage später, sieben Tage später, vierzehn Tage später. Wenn etwas vergessen wird, wird es früher überprüft.","en":"Review intervals: first day, next day, three days later, seven days later, fourteen days later. If something is forgotten, it will be reviewed sooner."},"لغات باید در قالب جمله و ترکیب کاربردی یاد گرفته شوند.":{"en":"Vocabulary should be learned in the form of sentences and practical combinations.","de":"Vokabeln sollten in Form von Sätzen und praktischen Kombinationen erlernt werden."},"متن منسجم با ساختار روشن و تحلیل اشتباهات.":{"en":"Coherent text with clear structure and error analysis.","de":"Kohärenter Text mit klarer Struktur und Fehleranalyse."},"مجهول و جایگزین‌های مجهول":{"de":"Unbekannte und unbekannte Alternativen","en":"Unknown and unknown alternatives"},"مرور Redemittel (۵)":{"de":"Rezension zu Redemittel (5)","en":"Review of Redemittel (5)"},"مرور اشتباهات گرامری (۵)":{"de":"Überprüfung von Grammatikfehlern (5)","en":"Review of grammar mistakes (5)"},"مرور لغات روز قبل (۵)":{"en":"review the words of the previous day (5)","de":"Wiederholen Sie die Worte des Vortages (5)"},"مرور لغات و ترکیبات (خروجی CSV از «دفتر عبارات»)":{"en":"Browsing words and combinations (CSV output from \"Dictionary\")","de":"Durchsuchen von Wörtern und Kombinationen (CSV-Ausgabe von „Dictionary“)"},"مرور گرامر B2":{"en":"B2 grammar review","de":"Überprüfung der B2-Grammatik"},"مشکل را کوتاه خلاصه کن، دو یا سه توصیه مشخص بده و برای هر کدام دلیل بیاور؛ در پایان جمع‌بندی و آرزوی موفقیت.":{"en":"Briefly summarize the problem, give two or three specific recommendations and give reasons for each; At the end of the summary and wish for success.","de":"Fassen Sie das Problem kurz zusammen, geben Sie zwei oder drei konkrete Empfehlungen und begründen Sie diese jeweils. Am Ende die Zusammenfassung und der Wunsch nach Erfolg."},"معیار موفقیت: هر هفته باید بتوانم کاری را انجام دهم که هفته قبل در انجام آن مشکل داشتم.":{"en":"Success criteria: Every week I should be able to do something that I had trouble doing the previous week.","de":"Erfolgskriterium: Jede Woche sollte ich in der Lage sein, etwas zu tun, womit ich in der Vorwoche Probleme hatte."},"مقایسه اطلاعات":{"en":"Compare information","de":"Informationen vergleichen"},"مقدمه و ساختار ارائه را بگو، نکات خواسته‌شده را به ترتیب توضیح بده، یک مثال بزن و با جمع‌بندی تمام کن.":{"en":"State the introduction and structure of the presentation, explain the desired points in order, give an example, and conclude with a summary.","de":"Geben Sie Einleitung und Aufbau der Präsentation an, erläutern Sie der Reihe nach die gewünschten Punkte, nennen Sie ein Beispiel und schließen Sie mit einer Zusammenfassung ab."},"موضوع و منبع متن، دو یا سه اطلاعات اصلی و نتیجه متن را با جملات خودت بگو؛ جزئیات کم‌اهمیت را حذف کن.":{"en":"Say the topic and source of the text, two or three main information and the result of the text in your own sentences; Remove unimportant details.","de":"Sagen Sie in Ihren eigenen Sätzen das Thema und die Quelle des Textes, zwei oder drei Hauptinformationen und das Ergebnis des Textes; Entfernen Sie unwichtige Details."},"نقد اقدامات":{"en":"Criticism of actions","de":"Kritik an Handlungen"},"نقل قول غیرمستقیم – برای «Argumente wiedergeben»":{"de":"Indirektes Zitat – für „Argumente wiedergeben“","en":"Indirect quote – for \"Argumente wiedergeben\""},"نمودار نشان می‌دهد":{"de":"Das Diagramm zeigt","en":"The diagram shows"},"نمونه آزمون رسمی":{"en":"Official exam sample","de":"Offizielle Prüfungsprobe"},"نوشتن متن‌های کوتاه (حداقل ۱۵۰ کلمه)":{"en":"Writing short texts (at least 150 words)","de":"Schreiben kurzer Texte (mindestens 150 Wörter)"},"نوشتن متن‌های ۲۰۰ کلمه‌ای":{"en":"Writing texts of 200 words","de":"Schreiben von Texten mit 200 Wörtern"},"هر هفته عملکرد باید با هفته قبل مقایسه شود.":{"en":"Each week performance should be compared with the previous week.","de":"Die Leistung jeder Woche sollte mit der Vorwoche verglichen werden."},"هر گزینه را با یک مزیت و یک عیب معرفی کن، معیار تصمیم را بگو و با دلیل یک گزینه را انتخاب کن.":{"en":"Introduce each option with an advantage and a disadvantage, tell the decision criteria and choose an option with a reason.","de":"Stellen Sie jede Option mit Vor- und Nachteilen vor, nennen Sie die Entscheidungskriterien und wählen Sie eine Option mit Begründung aus."},"هفته ۱ و ۲":{"en":"Week 1 and 2","de":"Woche 1 und 2"},"هفته ۳ تا ۶":{"en":"Week 3 to 6","de":"Woche 3 bis 6"},"وجه التزامی دوم: توصیه، فرض غیرواقعی، درخواست مؤدبانه":{"en":"Second imperative: recommendation, unrealistic assumption, polite request","de":"Zweiter Imperativ: Empfehlung, unrealistische Annahme, höfliche Bitte"},"پادکست آلمانی (مثلاً Deutschlandfunk, DW «Langsam gesprochene Nachrichten»)":{"en":"German podcast (e.g. Deutschlandfunk, DW \"Langsam gesprochene Nachrichten\")","de":"Deutscher Podcast (z.B. Deutschlandfunk, DW „Langsam gesprochene Nachrichten“)"},"پنجشنبه":{"en":"Thursday","de":"Donnerstag"},"چهار مهارت":{"en":"Four skills","de":"Vier Fähigkeiten"},"چهارشنبه":{"de":"Mittwoch","en":"Wednesday"},"گرامر و واژگان":{"en":"Grammar and vocabulary","de":"Grammatik und Wortschatz"},"یادگیری لغت در قالب ترکیب و جمله.":{"en":"Learning words in the form of combinations and sentences.","de":"Wörter in Form von Kombinationen und Sätzen lernen."},"یکشنبه":{"de":"Sonntag","en":"Sunday"},"۱۰ دقیقه: پنج لغت جدید (Artikel, Plural, معنی, Wortart, ۵ ترکیب, جمله نمونه, Perfekt)":{"en":"10 minutes: five new words (Artikel, Plural, meaning, Wortart, 5 combinations, sample sentence, Perfekt)","de":"10 Minuten: fünf neue Wörter (Artikel, Plural, Bedeutung, Wortart, 5 Kombinationen, Beispielsatz, Perfekt)"},"۲ فعالیت":{"en":"2 activities","de":"2 Aktivitäten"},"۳۰ سؤال":{"en":"30 questions","de":"30 Fragen"},"۳۴ سؤال":{"de":"34 Fragen","en":"34 questions"},"۳۵ دقیقه":{"de":"35 Minuten","en":"35 minutes"},"۴۰ دقیقه":{"de":"40 Minuten","en":"40 minutes"},"۵ دقیقه: مرور لغات قبلی بدون نگاه به جزوه":{"en":"5 minutes: reviewing the previous words without looking at the booklet","de":"5 Minuten: Wiederholen Sie die vorherigen Wörter, ohne das Heft anzusehen"},"۵ دقیقه: پنج Redemittel":{"en":"5 minutes: Five Redemittel","de":"5. Minute: Fünf Redemittel"},"۵ دقیقه: پنج جمله (حداقل دو جمله با گرامر هفته)":{"en":"5 minutes: five sentences (at least two sentences with the grammar of the week)","de":"5 Minuten: fünf Sätze (mindestens zwei Sätze mit der Grammatik der Woche)"},"۵۵ دقیقه":{"en":"55 minutes","de":"55 Minuten"},"۶۰ دقیقه":{"de":"60 Minuten","en":"60 minutes"},"۷ فعالیت":{"en":"7 activities","de":"7 Aktivitäten"}};
  Object.assign(STATIC_METHOD_COPY,{"تمرین Hören همراه Transkript":{"en":"Listening practice with transcript","de":"Hörübung mit Transkript"},"تقویت جمله‌سازی":{"en":"Improve sentence construction","de":"Satzbau verbessern"},"مرور گرامر B2":{"en":"Review B2 grammar","de":"B2-Grammatik wiederholen"},"ضبط روزانه مکالمه":{"en":"Record daily speaking practice","de":"Täglich Sprechübungen aufnehmen"}});
  const staticView=(value)=>typeof value==='string'?(STATIC_METHOD_COPY[value]?.[S.uiLanguage]||value):value&&typeof value==='object'?new Proxy(value,{get(target,key){return staticView(Reflect.get(target,key))}}):value;
  const ST_TDM=staticView(window.TDM_STATIC); const ST=new Proxy({},{get:(_,k)=>(PROG()?PROG().st():ST_TDM)[k]});
  TDM.version = '1.0.0';
  const CONTENT_SRC = () => '/testdaf-method-content.js?v=' + (window.TDM_CONTENT_VERSION || '1') + '-' + new Date().toISOString().slice(0, 10);
  const BASE = 240;
  const DEFAULT_DAILY = 120; /*DAILY-120: default daily plan time; BASE stays the content scale*/
  const SRS_STEPS = [1, 3, 7, 14, 30];

  // ───────────── basics ─────────────
  const E = (v) => safeText(v == null ? '' : v);
  const isFa = () => (S.uiLanguage || 'fa') === 'fa';
  const EN_METHOD_COPY={"1":"1","Absatz":"Paragraph","Abschließen & speichern":"Complete & save","2":"2","Analyse von Versuch 2":"Analysis of experiment 2","Analyse läuft …":"Analysis in progress...","(Das Transkript ist in diesem Schritt absichtlich verborgen.)":"(The transcript is intentionally hidden at this step.)","Analysehilfe":"Analysis help","Analyse von Versuch 1":"Analysis of experiment 1","240 Min. fest wie in der Prüfung + Extrazeit":"240 minutes fixed as in the exam + extra time","Aufdecken":"Discover","Analysierte Fehler":"Analyzed errors","Antworten auswerten":"Evaluate answers","Aufgabe starten":"Start task","Alle vier Fertigkeiten":"All four skills","Aufnahme starten":"Start recording","Aufnahme läuft":"Recording is in progress","Auswerten":"Evaluate","Aufgaben im Prüfungsformat":"Tasks in exam format","Aufnahme":"Recording","Ausgangslage":"Initial situation","Bedeutung":"Meaning","Automatische Analyse":"Automatic analysis","Automatische Prüfung deiner Zusammenfassung":"Automatic checking of your summary","Beispiele":"Examples","Bessere Formulierungen":"Better wording","Aufgenommen":"Recorded","Bewertung":"Evaluation","Anki-Export (CSV)":"Anki export (CSV)","Begonnen – noch kein Modul abgeschlossen.":"Started – no module completed yet.","Bessere Version":"Better version","Bitte zuerst Sätze schreiben.":"Please write sentences first.","Bewerte selbst.":"Evaluate yourself.","Dein Text wird korrigiert …":"Your text will be corrected...","Der erste Wochenbericht entsteht am Freitag.":"The first weekly report will be published on Friday.","Bitte zuerst mindestens 20 Wörter schreiben.":"Please write at least 20 words first.","Der Plan ist fest wie ein Prüfungstag: 240 Minuten. Eigene Lernzeit stellst du im Tab „Freies Lernen“ ein.":"The plan is as fixed as an exam day: 240 minutes. You set your own learning time in the “Free Learning” tab.","Bericht speichern":"Save report","Dauer":"Length of time","Die KI analysiert deine Fehler …":"The AI ​​analyzes your mistakes...","Die Aufnahme muss zuerst gespeichert sein.":"The recording must be saved first.","Diagnosetag":"Diagnosis day","Diagnose":"diagnosis","Die KI-Analyse ist gerade nicht verfügbar.":"AI analysis is currently unavailable.","Einmal ohne Text hören und drei Fragen beantworten:":"Listen once without text and answer three questions:","Die KI analysiert deine Woche …":"The AI ​​analyzes your week...","Diese Woche im Vergleich zur Vorwoche":"This week compared to last week","Das Fehlerprotokoll ist voll.":"The error log is full.","Prüfungsaufbau":"Exam structure","Diese Woche konnte ich …":"This week I was able to...","Ergebnisse der vier Fertigkeiten an den Plan-Tagen (gewählter Zeitraum)":"Results of the four skills on the plan days (selected period)","Erneut":"Anew","Fortschritt":"Progress","FEST":"FIRMLY","Fehler":"Mistake","Extra-Lernzeit (optional)":"Extra learning time (optional)","Fortschritt im Lernplan":"Learning plan progress","Fällig":"Due","Früher beenden":"Finish earlier","Fehlt":"Missing","Gelöste Aufgaben":"Solved tasks","Gewusst":"Known","Fülle bis dahin die Checkliste selbst aus.":"Until then, fill out the checklist yourself.","Freies Lernen":"Free learning","Grammatik der Woche":"Grammar of the week","Grammatik":"grammar","Grundregeln":"Basic rules","Grund / Regel":"Reason/rule","Heute fällig":"Due today","Im Prüfungsmodus dürfen Sie den Text nur zweimal hören.":"In exam mode you are only allowed to hear the text twice.","Hören":"Hear","In Arbeit":"In progress","Geübte Plan-Inhalte (gesamt)":"Practiced plan content (total)","Inhalte werden geladen …":"Loading content...","Gespeichert":"Saved","Keine Audiodatei – Browser-Sprachausgabe wird verwendet.":"No audio file - browser text-to-speech is used.","Keine Plan-Tage in diesem Zeitraum.":"No program days in this period.","Kein Inhalt gefunden.":"No content found.","Keine größeren Probleme":"No major problems","Keine":"No","Korrekturnotiz":"Correction note","Karteikarten, Fehler wiederholen und Nachhören – zusätzlich zu den 240 Minuten.":"Flashcards, repeating mistakes and listening - in addition to the 240 minutes.","Lesen":"To read","Lernminuten":"Learning minutes","Mikrofonzugriff wurde abgelehnt.":"Microphone access was denied.","Lösungsstrategie":"Solution strategy","Methode":"method","Lange Pausen":"Long pauses","Lernzeit selbst festlegen":"Set your own learning time","Min.":"Min.","Mit Muster vergleichen":"Compare with sample","Mein Text":"My text","Module erledigt":"Modules completed","Mit Musterlösung vergleichen":"Compare with sample solution","Mit Musterzusammenfassung vergleichen":"Compare with sample summary","Musteranalyse":"Pattern analysis","Musterantwort":"Sample answer","Mit Zusammenfassungen vergleichen":"Compare with summaries","Musterantwort & Redemittel":"Sample answer & means of speaking","Mustergliederung":"Sample outline","Muster ausblenden":"Hide pattern","Muster-Stichwörter":"Pattern keywords","Nicht gewusst":"Didn't know","Nicht verstanden":"Not understood","Neu aufnehmen":"Re-record","Mustertext zum Vergleich":"Sample text for comparison","Notizen (optional)":"Notes (optional)","Noch keine Plan-Ergebnisse in diesem Zeitraum.":"No planned results yet in this period.","Hilfe: Stichwörter, Aufbau, Redemittel":"Help: Keywords, structure, means of speech","Notiz: Bedeutung, Struktur, Korrektur":"Note: meaning, structure, correction","Plan-Tage und geübte Inhalte":"Program days and practiced content","Nur für Premium-Konten verfügbar.":"Only available for premium accounts.","Ordne die Fehler bis dahin selbst zu.":"Until then, assign the errors yourself.","Musterlösung":"Sample solution","Planzeit heute":"Program time today","Planzeit bisher":"Program time so far","Prüfung":"Test","Plan-Wortschatz":"Program vocabulary","Richtig":"Correct","Offizielle Prüfungsvorbereitung":"Official exam preparation","Redemittel":"means of speech","Richtig wäre":"That would be correct","Prüfungsmodus":"Exam mode","Restzeit":"remaining time","Schreiben":"Write","Schreibfehler":"Typo","Musterzusammenfassung":"Sample summary","Satz wird erklärt …":"Sentence is explained...","Schlüsselwörter":"Keywords","Quellen":"Sources","Schritt":"Step","Schwerpunkt":"Focus","Schwieriger Satz":"Difficult sentence","Schnitt aller Teile":"Cut all parts","Schreibproben":"Writing samples","Sprechaufgaben":"Speaking tasks","Sprechfehler":"Speech errors","Sprechproblem":"Speech problem","Spezial":"Special","Sprechzeit":"Talk time","Selbstkontrolle":"Self-control","Stufe":"Level","Tag":"day","Stopp":"stop","Tageslimit erreicht.":"Daily limit reached.","Sprechen":"Speak","Tagesplan 240 Min.":"Daily program · 240 min.","Tagesplan · 240 Minuten":"Daily schedule · 240 minutes","Tagesergebnis Lesen":"Read daily results","Sätze prüfen":"Check sentences","Transkription und Analyse …":"Transcription and analysis...","Tippen für Details":"Tap for details","Lernplan":"Learning plan","Unverständlicher Satz":"Incomprehensible sentence","Versuch 1":"Attempt 1","Versuch 1 und 2 im Vergleich":"Experiment 1 and 2 in comparison","Text":"text","Vokabelheft":"Vocabulary book","Was ist das Ziel der Sprecher?":"What is the goal of the speakers?","Versuch 2":"Attempt 2","Weiter":"Further","Was ist das Hauptthema?":"What is the main topic?","Vorbereitung":"Preparation","Wechsel zu":"Switch to","Welches Problem wird besprochen?":"What problem is being discussed?","Wiedergabe":"reproduction","Weiteren Satz hinzufügen":"Add another sentence","Wie viel verstehe ich jetzt ohne Text?":"How much do I understand now without text?","Wiederholen":"Repeat","Vollständig gehört":"Completely heard","Wichtige Fehler":"Important errors","Wird vorbereitet …":"Being prepared…","Woche":"Week","Satz erklären":"Explain sentence","Wochenplan":"Weekly plan","Wochentrend":"Weekly trend","Wortschatz":"Vocabulary","Wortschatz & Redemittel":"Vocabulary & useful phrases","Wortschatz aus dem Text":"Vocabulary from the text","Wochenbericht":"Weekly report","Wochenberichte":"Weekly reports","Wochentest":"Weekly test","Ziel":"Goal","Wähle die Punkte dann selbst aus.":"Then select the points yourself.","Ziel und Rahmen":"Goal and framework","Wörter":"Words","Ziel: TDN 4 in allen Teilen":"Goal: TDN 4 in all parts","Wörter/Min.":"words/min.","Zurück":"Back","Zeit abgeschlossener Module":"Time of modules completed","Zweites Hören: nur Stichwörter notieren.":"Second listening: just note down key words.","Zum Einfügen antippen:":"Tap to paste:","richtig":"correct","heute fällig":"due today","Zwischenüberschriften":"Subheadings","Bewerte dann selbst und fülle das Fehlerprotokoll aus.":"Rate your work and fill in the error log yourself.","Dieser Browser unterstützt keine Audioaufnahme.":"This browser does not support audio recording.","Einschätzung":"Assessment","Eintrag":"Entry","Empfehlung":"Recommendation","Erledigt":"Completed","Erneut analysieren":"Analyze again","Erneut versuchen":"Try again","Erst erinnern, dann aufdecken":"Recall first, then reveal","Extrazeit":"Extra time","Extrazeit heute erledigt.":"Extra time completed today."};
  Object.assign(EN_METHOD_COPY,{"Samstag":"Saturday","Sonntag":"Sunday","Montag":"Monday","Dienstag":"Tuesday","Mittwoch":"Wednesday","Donnerstag":"Thursday","Freitag":"Friday","Audio- und Textanalyse":"Audio and text analysis","Argumentation":"Argumentation","Wiedergeben und Präsentieren":"Retelling and presenting","Grafikbeschreibung":"Describing a chart","Sprechaufgaben-Typen":"Speaking task types","Prüfungstraining mit Zeit":"Timed exam practice","Bewertung, Fehleranalyse, Wiederholung":"Assessment, error analysis and review","Hören":"Listening","Lesen":"Reading","Schreiben":"Writing","Sprechen":"Speaking","Grammatik & Wortschatz":"Grammar & vocabulary","Wiederholung":"Review","Grammatik":"Grammar","Methode":"Method","FEST":"FIXED","Heute wird der Ausgangsstand in allen vier Fertigkeiten erfasst.":"An initial assessment records your current level in all four skills today.","Computer Science wird täglich 45 bis 60 Minuten getrennt von diesem Programm gelernt. Bei Bedarf kannst du die Übungen in zwei Einheiten aufteilen; der Fortschritt wird gespeichert.":"Study Computer Science for 45 to 60 minutes each day, separately from this program. If needed, split the work into two sessions; your progress is saved.","Die Übungen orientieren sich möglichst an Aufbau und Aufgabentypen der echten Prüfung.":"Exercises follow the structure and question types of the real exam as closely as possible."});
  Object.assign(EN_METHOD_COPY,{"Fortschritt im Lernplan":"Learning plan progress","Keine Plan-Tage in diesem Zeitraum.":"No planned days during this period.","Plan-Tage und geübte Inhalte":"Plan days and practiced content","Planzeit heute":"Schedule time today","Planzeit bisher":"Plan time so far","Plan-Wortschatz":"Plan vocabulary","Tagesplan 240 Min.":"Daily plan 240 min.","Lernplan":"Learning plan","Wortschatz & Redemittel":"Vocabulary & means of speech","Aktivitäten":"Activities","BERICHTE":"REPORTS"," W.":"W.","Anteil":"Share"," Min.":"Min.","Durchschnitt":"Average","ERGEBNISSE":"RESULTS","Einschätzung":"assessment","Eintrag":"entry","Bewerte dann selbst und fülle das Fehlerprotokoll aus.":"Then evaluate it yourself and fill out the error log.","Anteil an der Lernzeit, Durchschnitt und Wochenziel (letzte 7 Tage). Ziel mit dem Regler einstellen.":"Share of study time, average and weekly goal over the last seven days. Adjust the goal with the slider.","Ergebnis":"Result","Erledigte Aktivitäten":"Completed activities","Erledigte Module":"Completed modules","Erst erinnern, dann aufdecken":"First remember, then reveal","Fertigkeit":"Skill","Extrazeit heute erledigt.":"Extra time done today.","Hallo":"Hello","Geübte Inhalte":"Practiced content","Heute nichts fällig ✓":"Nothing due today ✓","Freies Lernprogramm":"Free learning program","FERTIGKEITEN":"SKILLS","INHALTE":"CONTENT","Gelesene oder wiederholte Wörter, Texte und Fragen":"Words, texts and questions read or repeated","Keine Lernzeit in diesem Zeitraum.":"No learning time during this period.","Kein freies Lernen in diesem Zeitraum.":"No free learning during this period.","Lerntage":"Learning days","Lernzeit":"Learning time","Lerntisch":"Study desk","LERNZEIT":"LEARNING TIME","Lerntisch (Timer)":"Study desk (timer)","Lernprogramm und Lerntisch zusammen":"Program and study desk combined","Letzte 3 Monate":"Last 3 months","Lernzeit im Plan":"Time in program","Lernzeit pro Tag":"Learning time per day","Lernzeit pro Woche":"Learning time per week","Letzter Monat":"Last month","Letzte 7 Tage":"Last 7 days","Plan":"Program","Module":"Modules","Schnitt der vier Teile":"Average across the four sections","PLAN-TAGE":"PROGRAM DAYS","Nach dem ersten Plan-Tag erscheint hier der Wochentrend.":"The weekly trend appears after your first program day.","Min./Woche":"min./week","Noch keine Ergebnisse in diesem Zeitraum.":"No results yet in this period.","Serie":"Streak","TAGE":"DAYS","Tage in Folge":"days in a row","Schnitt pro Fertigkeit und Woche; die aktuelle Woche ist markiert.":"Average by skill and week; the current week is highlighted.","Tage anzeigen":"Show days","Verlauf & Fortschritt":"History & Progress","Tagesübersicht":"Daily overview","Verlauf löschen":"Clear history","Verlauf der vier Fertigkeiten":"Progress across the four skills","W":"W","Weitere":"More","Woche ":"Week","Vorzeitraum":"Previous period","WOCHENTREND":"WEEKLY TREND","Vorwoche":"Previous week","Wochentrend der vier Fertigkeiten":"Weekly trend of the four skills","Woche ab ":"Week starting ","Woche für Woche":"Week after week","Zeitraum":"Period","Zeit, Ergebnis und Ziel je Fertigkeit":"Time, result and goal per skill","begonnen":"started","Wochenziel ":"Weekly goal","Wochenziel (7 Tage)":"Weekly goal (7 days)","keine Aktivität":"no activity","Zeit · Anteil":"Time · Share","ohne Wochenziel":"without a weekly goal","zur":"to","wie":"as","Ø pro Tag":"Ø per day","nur Lerntisch":"just study table"});
  Object.assign(EN_METHOD_COPY,{"Keine Plan-Tage in diesem Zeitraum.":"No program days in this period.","Fortschritt im Lernplan":"Learning plan progress","Plan-Tage und geübte Inhalte":"Program days and practiced content","Planzeit heute":"Program time today","Planzeit bisher":"Program time so far","Plan-Wortschatz":"Program vocabulary","Lernplan":"Learning plan","Tagesplan 240 Min.":"Daily program · 240 min.","Wortschatz & Redemittel":"Vocabulary & useful phrases"});
  const L = (fa, de, en) => isFa() ? fa : S.uiLanguage === 'en' ? (en || EN_METHOD_COPY[de] || de) : de;
  const rtl = (html, cls = '') => `<div dir="rtl" class="tdm-fa ${cls}">${html}</div>`;
  const ltr = (html, cls = '') => `<div dir="ltr" class="tdm-de ${cls}">${html}</div>`;
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const wdOf = (k) => parseKey(k).getDay();
  const satOf = (k) => addDays(k, -((wdOf(k) + 1) % 7));
  const wordsIn = (t) => (String(t || '').match(/[A-Za-zÄÖÜäöüß][\wÄÖÜäöüß'-]*/g) || []).length;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const faNum = (n) => (isFa() ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(n));
  const mmss = (s) => timeStr(Math.max(0, Math.round(s)));
  const DE = (s) => E(s) + '​';
  const arr = (x) => (Array.isArray(x) ? x : x == null || x === '' ? [] : typeof x === 'string' ? x.split(/\s*(?:\n|;|•|\|)\s*/).filter(Boolean) : typeof x === 'object' ? Object.values(x) : [x]);
  const uid = () => Math.random().toString(36).slice(2, 9);

  // enrolled: the account follows the TestDaF program. active: the method plan is the current dashboard context
  // (the «مطالعه آزاد» tab swaps in the site's own slider-based plan instead).
  TDM.enrolled = () => !!(typeof S !== 'undefined' && S.user); /*UNIFIED-ENROLL: one learning plan for everyone; examPlan only picks the simulated exam (TestDaF/ÖSD)*/
  TDM.active = () => TDM.enrolled() && S.studyMode !== 'free';

  // ───────────── content ─────────────
  let contentPromise = null, index = null;
  TDM.ensureContent = function () {
    if (CT()) return Promise.resolve(CT());
    if (PROG()) return PROG().ensureContent().then((c) => { refreshPlanDescriptions(); return c; });
    if (contentPromise) return contentPromise;
    contentPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CONTENT_SRC(); s.async = true;
      s.onload = () => (CT() ? resolve(CT()) : reject(new Error('TDM content missing')));
      s.onerror = () => { contentPromise = null; reject(new Error('TDM content failed to load')); };
      document.head.appendChild(s);
    }).then((c) => { refreshPlanDescriptions(); return c; });
    return contentPromise;
  };
  function idx() {
    const c = CT(); if (!c) return null;
    if (index && index.c === c) return index;
    index = { c };
    for (const kind of ['hoeren', 'lesen', 'argumentation', 'grafik', 'sprechen']) index[kind] = new Map((c[kind] || []).map((x) => [x.id, x]));
    return index;
  }
  const item = (kind, id) => idx()?.[kind]?.get(id) || null;

  // ───────────── state ─────────────
  function M() {
    const MK = PROG() ? 'oesdMethod' : 'testdafMethod';
    if (!S[MK] || typeof S[MK] !== 'object') S[MK] = {};
    const m = S[MK];
    m.v = 1; m.phase = m.phase || 1;
    m.used = m.used || {}; for (const k of ['hoeren', 'lesen', 'argumentation', 'grafik', 'sprechen']) m.used[k] = m.used[k] || [];
    m.days = m.days || {}; m.srs = m.srs || {}; m.weekly = m.weekly || {}; m.log = m.log || [];
    m.cursor = m.cursor || { sprechen: 0 }; m.redemittelSeen = m.redemittelSeen || [];
    return m;
  }
  TDM.state = M;

  // ───────────── calendar ─────────────
  const SPRECHEN_ORDER = ['rat_geben', 'optionen_abwaegen', 'text_zusammenfassen', 'informationen_abgleichen', 'thema_praesentieren', 'argumente_wiedergeben', 'massnahmen_kritisieren'];
  const SPO = () => (PROG() ? PROG().sprechenOrder() : SPRECHEN_ORDER);
  const DAY_DEF = {
    6: { key: 'sa', fa: 'شنبه', de: 'Samstag', focus: ['hoeren', 'lesen'], sfa: 'تحلیل فایل صوتی و متن', sde: 'Audio- und Textanalyse', schreiben: 'argumentation', sprechen: 1 },
    0: { key: 'so', fa: 'یکشنبه', de: 'Sonntag', focus: ['hoeren', 'schreiben'], sfa: 'Argumentation', sde: 'Argumentation', schreiben: 'argumentation', sprechen: 1 },
    1: { key: 'mo', fa: 'دوشنبه', de: 'Montag', focus: ['hoeren', 'sprechen'], sfa: 'بازگویی و ارائه', sde: 'Wiedergeben und Präsentieren', schreiben: 'argumentation', sprechen: ['text_zusammenfassen', 'thema_praesentieren'] },
    2: { key: 'di', fa: 'سه‌شنبه', de: 'Dienstag', focus: ['lesen', 'schreiben'], sfa: 'Grafikbeschreibung', sde: 'Grafikbeschreibung', schreiben: 'grafik', sprechen: 1 },
    3: { key: 'mi', fa: 'چهارشنبه', de: 'Mittwoch', focus: ['hoeren', 'sprechen'], sfa: 'انواع سؤالات شفاهی', sde: 'Sprechaufgaben-Typen', schreiben: 'argumentation', sprechen: 3 },
    4: { key: 'do', fa: 'پنجشنبه', de: 'Donnerstag', focus: ['hoeren', 'lesen', 'schreiben', 'sprechen'], sfa: 'تمرین زمان‌دار آزمون', sde: 'Prüfungstraining mit Zeit', schreiben: 'auto', sprechen: 3, exam: true },
    5: { key: 'fr', fa: 'جمعه', de: 'Freitag', focus: [], sfa: 'ارزیابی، تحلیل اشتباهات و مرور', sde: 'Bewertung, Fehleranalyse, Wiederholung', schreiben: 'argumentation', sprechen: 3, evaluation: true }
  };
  const DDEF = () => (PROG() ? PROG().dayDef : DAY_DEF);
  TDM.dayDef = (k) => { const base = DDEF()[wdOf(k)], chosen = M().weekFocus?.[wdOf(k)]; return Array.isArray(chosen) && chosen.length && !base.evaluation /*FOCUS-MERGE*/ ? { ...base, focus: chosen.filter(id => ['hoeren','lesen','schreiben','sprechen'].includes(id)).slice(0, 2) } : base; };
  function firstSaturday() { const m = M(), start = m.startDate || today(); let first = satOf(start); if (wdOf(start) === 5) first = addDays(first, 7); return first; }
  function weekOf(k) { const d = diffDays(firstSaturday(), k); return d < 0 ? 0 : Math.floor(d / 7) + 1; }
  function weekRange(week) { const first = firstSaturday(); if (week <= 0) { const s = satOf(M().startDate || today()); return [s, addDays(s, 6)]; } const s = addDays(first, (week - 1) * 7); return [s, addDays(s, 6)]; }
  TDM.weekOf = weekOf;

  const MODS = {
    hoeren: { icon: 'headphones', de: 'Hören', fa: 'شنیدن', color: '#a855f7' },
    lesen: { icon: 'document-text', de: 'Lesen', fa: 'خواندن', color: '#0ea5e9' },
    schreiben: { icon: 'pencil-square', de: 'Schreiben', fa: 'نوشتن', color: '#f59e0b' },
    sprechen: { icon: 'microphone', de: 'Sprechen', fa: 'صحبت‌کردن', color: '#f43f5e' },
    wortschatz: { icon: 'language', de: 'Grammatik & Wortschatz', fa: 'گرامر و واژگان', color: '#10b981' },
    wiederholung: { icon: 'brain', de: 'Wiederholung', fa: 'مرور فعال', color: '#6366f1' },
    fehleranalyse: { icon: 'clipboard-check', de: 'Fehleranalyse', fa: 'تحلیل اشتباهات', color: '#ef4444' },
    wochenbericht: { icon: 'clipboard-check', de: 'Wochenbericht', fa: 'گزارش هفتگی', color: '#14b8a6' },
    extra: { icon: 'brain', de: 'Extra-Lernzeit', fa: 'زمان اضافه یادگیری', color: '#0d9488' }
  };
  const CORE = ['hoeren', 'lesen', 'schreiben', 'sprechen', 'wortschatz', 'wiederholung', 'fehleranalyse', 'wochenbericht'];
  /*LEAN4*/ const LEAN = () => { try { return typeof isGlobalContentAdmin === 'function' && !!isGlobalContentAdmin(); } catch (e) { return false; } };
  const LEAN_DROP = ['wortschatz', 'wiederholung', 'fehleranalyse', 'wochenbericht', 'extra'];
  TDM.lean = LEAN;
  const EXTRA_CHOICES = [0, 15, 30, 45, 60];
  const BASE_MIN = { normal: { hoeren: 60, lesen: 45, schreiben: 50, sprechen: 35, wortschatz: 25, wiederholung: 25 }, exam: { hoeren: 60, lesen: 45, schreiben: 50, sprechen: 35, wortschatz: 25, wiederholung: 25 }, eval: { hoeren: 40, lesen: 45, schreiben: 50, sprechen: 35, fehleranalyse: 40, wochenbericht: 30 } };
  /* tdm-deck-v2 */
  // Every day trains all skills; the day's focus skills get more of the fixed 240 minutes.
  const FOCUS_MIN = {
    6: { hoeren: 70, lesen: 60, schreiben: 40, sprechen: 30, wortschatz: 20, wiederholung: 20 },
    0: { hoeren: 70, lesen: 35, schreiben: 65, sprechen: 30, wortschatz: 20, wiederholung: 20 },
    1: { hoeren: 70, lesen: 35, schreiben: 40, sprechen: 55, wortschatz: 20, wiederholung: 20 },
    2: { hoeren: 50, lesen: 60, schreiben: 65, sprechen: 25, wortschatz: 20, wiederholung: 20 },
    3: { hoeren: 70, lesen: 35, schreiben: 40, sprechen: 55, wortschatz: 20, wiederholung: 20 }
  };
  function minFor(k, id) { const mode = dayMode(k), chosen = M().weekFocus?.[wdOf(k)]; if (mode === 'normal' && Array.isArray(chosen) && chosen.length) return (BASE_MIN.normal[id] || 20) + (chosen.includes(id) ? 25 : 0); const f = mode === 'normal' ? FOCUS_MIN[wdOf(k)] : null; return f && f[id] != null ? f[id] : BASE_MIN[mode]?.[id]; }
  TDM.minFor = minFor;
  /* tdm-daily-time-v1 */
  // Daily plan time: 240 minutes is the recommended default (exam-like); the learner may choose less or more.
  // Below 120 minutes a day only trains the day's focus skills (+ Wortschatz); question sets, Sprechen tasks and
  // Schreiben word targets shrink with the time, and 300 minutes adds one Sprechen task.
  const DAILY_CHOICES = [60, 90, 120, 150, 180, 240, 300];
  function dailyMin() { const v = Number(M().dailyMin); return DAILY_CHOICES.includes(v) ? v : DEFAULT_DAILY; }
  const scaleOf = () => dailyMin() / BASE;
  TDM.dailyMin = dailyMin;
  function dayModules(k) {
    const mode = dayMode(k), def = TDM.dayDef(k), order = moduleOrder(k);
    if (dailyMin() >= 120) return order;
    if (LEAN()) { /*LEAN4*/ const f = mode === 'eval' ? ['hoeren', 'lesen'] : mode === 'exam' ? (weekOf(k) % 2 ? ['hoeren', 'lesen'] : ['schreiben', 'sprechen']) : def.focus.filter((x) => order.includes(x)); return f.length ? f : order; }
    if (mode === 'eval') return ['hoeren', 'lesen', 'fehleranalyse', 'wochenbericht'];
    if (mode === 'exam') return weekOf(k) % 2 ? ['hoeren', 'lesen', 'wortschatz'] : ['schreiben', 'sprechen', 'wortschatz'];
    return [...def.focus, 'wortschatz'];
  }
  function minutesFor(k) {
    const ids = dayModules(k), t = dailyMin(), base = ids.map((id) => (minFor(k, id) || 20) * loadRatio(k, id) /*VOL-TIME*/), sum = base.reduce((a, b) => a + b, 0) || 1, out = {};
    let acc = 0; const err = {};
    ids.forEach((id, n) => { const exact = base[n] * t / sum, v = Math.max(5, Math.round(exact / 5) * 5); out[id] = v; err[id] = exact - v; acc += v; });
    // largest-remainder correction in 5-minute steps, so the total is exactly the chosen time
    for (let guard = 0; acc !== t && guard < 40; guard++) {
      const up = acc < t, id = ids.slice().sort((a, b) => (up ? err[b] - err[a] : err[a] - err[b])).find((x) => up || out[x] > 5);
      if (!id) break; const step = up ? 5 : -5; out[id] += step; err[id] -= step; acc += step;
    }
    const cm = M().weekMin?.[wdOf(k)]; /*MIN-EDIT*/ if (cm) ids.forEach((id) => { const v = Number(cm[id]); if (v >= 5) out[id] = Math.round(v / 5) * 5; });
    return out;
  }
  TDM.minutesFor = minutesFor;
  function spList(d) {
    const p = d?.picks; if (!p) return [];
    const all = p.sprechen || [], f = scaleOf();
    if (!p.spBase) p.spBase = all.length || 1;
    if (f >= 1.25 && all.length <= p.spBase && CT()) {
      const used = new Set(all.map((id) => item('sprechen', id)?.type)), t = SPO().find((x) => !used.has(x)) || SPO()[0];
      const id = nextFrom('sprechen', (x) => x.type === t && !all.includes(x.id));
      if (id) { p.sprechen = [...all, id]; scheduleSave(); return p.sprechen; }
    }
    const n = f >= 1.25 ? all.length : Math.min(p.spBase, f < 0.6 ? 1 : f < 0.85 ? 2 : p.spBase);
    return all.slice(0, Math.max(1, n));
  }
  TDM.spList = spList;
  function trimQs(qs) { const f = scaleOf() * (lowLevel() ? 0.7 : 1); /*LEVEL-ADAPT*/ if (!Array.isArray(qs) || f >= 0.75) return qs; return qs.slice(0, Math.max(3, Math.ceil(qs.length * Math.max(0.5, f)))); }
  function dailyLabel(min) { const h = min / 60; return isFa() ? `${faNum(String(h).replace('.', '٫'))} ساعت` : `${h} h`; }
  function dailyHint() {
    const t = dailyMin();
    if (t < 120) return L('در این زمان هر روز فقط مهارت‌های «تمرکز بیشتر» آن روز و Wortschatz تمرین می‌شوند؛ بقیه مهارت‌ها در روزهای دیگر هفته می‌آیند. تعداد سؤال‌ها، تکالیف Sprechen و حداقل کلمات Schreiben کمتر است.', 'Mit dieser Zeit werden täglich nur die Schwerpunkte und Wortschatz geübt; die anderen Fertigkeiten kommen an anderen Wochentagen. Weniger Fragen, Sprechaufgaben und Wörter beim Schreiben.', 'With this time each day trains only its focus skills plus vocabulary; the other skills come on other days. Fewer questions, speaking tasks and words in writing.');
    if (t < BASE) return L('همه مهارت‌ها هر روز تمرین می‌شوند، با زمان کوتاه‌تر؛ تعداد سؤال‌ها، تکالیف Sprechen و حداقل کلمات Schreiben متناسب با زمان کمتر می‌شود.', 'Alle Fertigkeiten täglich, aber kürzer; Fragen, Sprechaufgaben und Mindestwörter passen sich der Zeit an.', 'All skills every day, but shorter; questions, speaking tasks and word targets scale with the time.');
    if (t > BASE) return L('زمان هر مرحله بیشتر می‌شود و هر روز یک تکلیف Sprechen اضافه داری.', 'Jeder Schritt bekommt mehr Zeit, dazu täglich eine zusätzliche Sprechaufgabe.', 'Every step gets more time, plus one extra speaking task each day.');
    return L('برنامه پیشنهادی: مثل روز آزمون، با تقسیم کامل زمان بین همه مهارت‌ها.', 'Empfohlener Plan: wie ein Prüfungstag, mit voller Zeitverteilung.', 'Recommended plan: like an exam day, with the full time split.');
  }
  function dailyPicker() {
    const t = dailyMin();
    return `<div class="tdm-daily"><div class="tdm-daily-head">${rtl(`<b>🕒 ${L('زمان روزانه برنامه', 'Tägliche Planzeit', 'Daily plan time')}</b><small class="tdm-muted">${L('۱۲۰ دقیقه (۲ ساعت) پیشنهاد برنامه است؛ اگر وقت کمتر یا بیشتری داری تغییرش بده.', '120 Minuten werden empfohlen; bei weniger oder mehr Zeit hier ändern.', '120 minutes is recommended; change it if you have less or more time.')}</small>`)}</div>
      <div class="tdm-daily-btns" role="radiogroup">${DAILY_CHOICES.map((n) => `<button type="button" role="radio" aria-checked="${n === t}" class="${n === t ? 'is-cur' : ''} ${n === DEFAULT_DAILY ? 'is-rec' : ''}" onclick="TDM.setDaily(${n})"><b>${dailyLabel(n)}</b><small>${faNum(n)}′${n === DEFAULT_DAILY ? ' · ' + L('پیشنهادی', 'empfohlen', 'recommended') : ''}</small></button>`).join('')}</div>
      ${rtl(`<p class="tdm-daily-hint">${E(dailyHint())}</p>`)}</div>`;
  }
  TDM.progressList = function () {
    const acts = (S.plan?.activities || []).filter((a) => Number(a.dur) > 0); if (!acts.length) return '';
    const done = new Set(S.completedActivities || []), tm = S.activityTimers || {};
    return `<ul class="dp-list" data-learning-content>${acts.map((a) => { const secs = Number(tm[a.id]) || 0, ok = done.has(a.id), pct = ok ? 100 : Math.min(100, Math.round(secs / ((Number(a.dur) || 1) * 60) * 100)); return `<li class="${ok ? 'is-done' : secs ? 'is-run' : ''}"><span dir="ltr">${E(MODS[a.id]?.de || a.title || a.id)}</span><i><b style="width:${pct}%"></b></i><small>${ok ? '✓' : `${faNum(Math.floor(secs / 60))}/${faNum(a.dur)}′`}</small></li>`; }).join('')}</ul>`;
  };
  TDM.setDaily = function (min) {
    min = Number(min); if (!DAILY_CHOICES.includes(min)) return;
    const m = M(); if (dailyMin() === min) return;
    m.dailyMin = min;
    if (TDM.active() && S.plan) { syncPlan(true); try { upsertDailyHistorySegment(currentPlanHistorySnapshot()); } catch (e) { console.warn(e); } }
    saveData(); render();
  };
  TDM.setWeekFocus = function (wd, skill) {
    wd=Number(wd); if (![6,0,1,2,3,4].includes(wd) || !['hoeren','lesen','schreiben','sprechen'].includes(skill)) return;
    const m=M(), base=DDEF()[wd].focus, current=Array.isArray(m.weekFocus?.[wd]) ? [...m.weekFocus[wd]] : base.length<=2 ? [...base] : [];
    const next=current.includes(skill) ? current.filter(x=>x!==skill) : current.length>=2 ? [current[1],skill] : [...current,skill];
    if (!next.length) return;
    m.weekFocus=m.weekFocus||{};m.weekFocus[wd]=next;
    if (TDM.active() && S.plan && wdOf(S.plan.date||today())===wd) syncPlan(true);
    saveData();render();
  };
  TDM.resetWeekFocus = function (wd) { const m=M();if(m.weekFocus)delete m.weekFocus[Number(wd)];if(TDM.active()&&S.plan&&wdOf(S.plan.date||today())===Number(wd))syncPlan(true);saveData();render(); };
  TDM.moveDayActivity = function (id,dir) {
    const k=S.plan?.date||today(),ids=moduleOrder(k),at=ids.indexOf(id),to=at+Number(dir);
    if(at<0||to<0||to>=ids.length)return;
    [ids[at],ids[to]]=[ids[to],ids[at]];
    const m=M();m.dayOrder=m.dayOrder||{};m.dayOrder[k]=ids;
    if(TDM.active()&&S.plan)syncPlan(true);
    saveData();render();
  };
  /*BATCH2*/ TDM.ordDrag = function (e, id) { TDM._ord = id; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch (x) { /* ignore */ } };
  TDM.ordOver = function (e) { if (!TDM._ord) return; e.preventDefault(); const li = e.currentTarget; document.querySelectorAll('.tdm-week-order li.is-over').forEach((x) => { if (x !== li) x.classList.remove('is-over'); }); li.classList.add('is-over'); };
  TDM.ordEnd = function () { TDM._ord = null; document.querySelectorAll('.tdm-week-order li.is-over').forEach((x) => x.classList.remove('is-over')); };
  TDM.ordDrop = function (e, target) {
    e.preventDefault(); const src = TDM._ord; TDM.ordEnd(); if (!src || src === target) return;
    const k = S.plan?.date || today(), ids = moduleOrder(k).filter((x) => x !== 'extra'), i = ids.indexOf(src), j = ids.indexOf(target);
    if (i < 0 || j < 0) return;
    ids.splice(i, 1); ids.splice(j, 0, src);
    const m = M(); m.dayOrder = m.dayOrder || {}; m.dayOrder[k] = ids;
    if (TDM.active() && S.plan) syncPlan(true);
    saveData(); render();
  };
  TDM.focusToday = function () { try { const f = TDM.dayDef(S.plan?.date || today()).focus || []; return f.length <= 2 ? f : []; } catch (e) { return []; } }; /*FOCUS-HALO*/
  /*MIN-EDIT*/ TDM.setWeekMin = function (wd, id, v) {
    wd = Number(wd); v = Math.round(Number(v) / 5) * 5; if (![6, 0, 1, 2, 3, 4].includes(wd) || !Number.isFinite(v)) return render();
    v = Math.max(5, Math.min(240, v));
    const m = M(), tk = S.plan?.date || today(), k = wdOf(tk) === wd ? tk : (Object.keys(m.days || {}).find((x) => wdOf(x) === wd) || addDays(satOf(today()), (wd + 1) % 7));
    const cur = { ...minutesFor(k) }; cur[id] = v; m.weekMin = m.weekMin || {}; m.weekMin[wd] = cur;
    if (wdOf(tk) === wd && TDM.active() && S.plan) syncPlan(true);
    saveData(); render();
  };
  TDM.resetWeekMin = function (wd) { wd = Number(wd); const m = M(), tk = S.plan?.date || today(); if (m.weekMin) delete m.weekMin[wd]; if (wdOf(tk) === wd && TDM.active() && S.plan) syncPlan(true); saveData(); render(); };
  TDM.editMin = function (btn, wd, id) {
    const v = Number(btn.dataset.v) || 0, inp = document.createElement('input'), li = btn.closest('li');
    inp.type = 'number'; inp.min = '5'; inp.max = '240'; inp.step = '5'; inp.value = String(v); inp.className = 'tdm-fm-mininp'; inp.setAttribute('dir', 'ltr');
    if (li) li.draggable = false; btn.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const commit = (ok) => { if (done) return; done = true; const n = Number(inp.value); inp.blur(); if (ok && Number.isFinite(n) && n > 0 && n !== v) TDM.setWeekMin(wd, id, n); else render(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(true); } else if (e.key === 'Escape') { e.preventDefault(); commit(false); } });
    inp.addEventListener('blur', () => commit(true));
  };
  /*DRAG-SWAP*/ TDM.setWeekOrder = function (wd, ids) {
    wd = Number(wd); if (![6, 0, 1, 2, 3, 4].includes(wd) || !Array.isArray(ids) || !ids.length) return;
    const m = M(), tk = S.plan?.date || today(); m.weekOrder = m.weekOrder || {}; m.weekOrder[wd] = ids.slice();
    if (wdOf(tk) === wd) { if (m.dayOrder) delete m.dayOrder[tk]; if (TDM.active() && S.plan) syncPlan(true); }
    saveData(); render();
  };
  TDM.resetWeekOrder = function (wd) {
    wd = Number(wd); const m = M(), tk = S.plan?.date || today();
    if (m.weekOrder) delete m.weekOrder[wd]; if (wdOf(tk) === wd && m.dayOrder) delete m.dayOrder[tk];
    if (wdOf(tk) === wd && TDM.active() && S.plan) syncPlan(true); saveData(); render();
  };
  TDM.fmStart = function (e, id, wd) { TDM._fm = { id, wd: Number(wd) }; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); } catch (x) { /* ignore */ } };
  (function () {
    const clear = () => document.querySelectorAll('.tdm-fm-list li.is-over,.tdm-fm-list.is-gap').forEach((x) => x.classList.remove('is-over', 'is-gap'));
    const listOf = (wd) => document.querySelector(`ol.tdm-fm-list[data-wd="${wd}"]`);
    document.addEventListener('dragover', (e) => {
      const d = TDM._fm; if (!d) return; e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (x) { /* ignore */ }
      const list = listOf(d.wd), li = e.target.closest && e.target.closest('li[data-ord]');
      clear(); if (!list) return;
      if (li && list.contains(li) && li.dataset.ord !== d.id) li.classList.add('is-over'); else list.classList.add('is-gap');
    });
    document.addEventListener('drop', (e) => {
      const d = TDM._fm; if (!d) return; e.preventDefault(); TDM._fm = null; clear();
      const list = listOf(d.wd); if (!list) return;
      const els = [...list.querySelectorAll('li[data-ord]')], ids = els.map((x) => x.dataset.ord), from = ids.indexOf(d.id); if (from < 0) return;
      const li = e.target.closest && e.target.closest('li[data-ord]'); let next = ids.slice();
      if (li && list.contains(li) && li.dataset.ord !== d.id) { const to = ids.indexOf(li.dataset.ord); next[from] = ids[to]; next[to] = d.id; }
      else {   // nearest slot to the release point (by height; other days' cards count by their height too)
        const rest = els.filter((x) => x.dataset.ord !== d.id), y = e.clientY;
        const at = rest.filter((x) => { const r = x.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length;
        next = rest.map((x) => x.dataset.ord); next.splice(at, 0, d.id);
      }
      if (next.join() !== ids.join()) TDM.setWeekOrder(d.wd, next);
    });
    document.addEventListener('dragend', () => { if (TDM._fm) { TDM._fm = null; clear(); } });
  })();
  TDM.resetDayOrder = function () {const m=M(),k=S.plan?.date||today();if(m.dayOrder)delete m.dayOrder[k];if(TDM.active()&&S.plan)syncPlan(true);saveData();render();};
  TDM.weekSettingsTab = function (tab) {if(['time','focus','order'].includes(tab)){S.tdmWeekSettingsTab=tab;render()}};
  TDM.setExamDate = function (value) {if(value && !/^\d{4}-\d{2}-\d{2}$/.test(value))return;S.user.examDate=value||'';saveData();render()};
  function focusLabel(def) { return def.evaluation ? L('ارزیابی', 'Bewertung', 'Evaluation') : def.focus.length === 4 ? L('چهار مهارت', 'Alle vier Fertigkeiten', 'All four skills') : L('تمرکز بیشتر: ', 'Schwerpunkt: ', 'More focus: ') + def.focus.map((f) => L(MODS[f].fa, MODS[f].de)).join(' + '); }
  function dayMode(k) { const def = TDM.dayDef(k); return def.evaluation ? 'eval' : def.exam ? 'exam' : 'normal'; }
  function moduleOrder(k) {
    const def = TDM.dayDef(k), mode = dayMode(k);
    const base = LEAN() ? ['hoeren', 'lesen', 'schreiben', 'sprechen'] /*LEAN4*/ : mode === 'eval' ? ['hoeren', 'lesen', 'schreiben', 'sprechen', 'fehleranalyse', 'wochenbericht'] : ['hoeren', 'lesen', 'schreiben', 'sprechen', 'wortschatz', 'wiederholung'];
    const suggested = mode === 'eval' ? base : [...def.focus.filter((x) => base.includes(x)), ...base.filter((x) => !def.focus.includes(x))];
    const saved = M().dayOrder?.[k] || M().weekOrder?.[wdOf(k)]; /*DRAG-SWAP*/
    return Array.isArray(saved) ? [...saved.filter((x) => suggested.includes(x)), ...suggested.filter((x) => !saved.includes(x))] : suggested;
  }

  /*LEVEL-ADAPT*/ // 2026-11-14: content choice and scaffolding follow the learner's level from the account settings (S.user.level)
  const LV_ALL = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  function userLevel() {
    try { if (typeof window.amkApplyPendingLevel === 'function') window.amkApplyPendingLevel(); } catch (e) { /* ignore */ }
    const v = String((typeof S !== 'undefined' && S.user && S.user.level) || 'B2').toUpperCase();
    return LV_ALL.includes(v) ? v : 'B2';
  }
  const lowLevel = () => ['A1', 'A2', 'B1'].includes(userLevel());
  const lvBand = () => { const v = userLevel(); return ['A1', 'A2', 'B1'].includes(v) ? [0, 0.4] : v === 'B2' ? [0, 0.6] : [0.4, 1]; };
  const lvText = (kind, it) => kind === 'hoeren' ? (it.segments || []).map((x) => x.text).join(' ') : kind === 'lesen' ? (it.paragraphs || []).map((x) => (x && x.text) || x).join(' ') : kind === 'sprechen' ? [it.situation, it.task, it.material].join(' ') : kind === 'grafik' ? [it.task, it.text].join(' ') : [it.situation, it.task, ...(it.positions || []).map((x) => x && x.text)].join(' ');
  function lvRaw(kind, it) {
    const t = String(lvText(kind, it) || ''), words = t.split(/\s+/).filter(Boolean), n = words.length || 1, clean = (w) => w.replace(/[^A-Za-zÄÖÜäöüß]/g, '');
    const sents = Math.max(1, (t.match(/[.!?…](\s|$)/g) || []).length), longW = words.filter((w) => clean(w).length >= 13).length / n;
    const avgW = words.reduce((a, w) => a + clean(w).length, 0) / n;
    let sc = (n / sents) * 0.6 + longW * 120 + avgW * 2;
    if (kind === 'hoeren' && Number(it.duration) > 0) sc += n / (Number(it.duration) / 60) / 20;
    if (kind === 'lesen' || kind === 'hoeren') sc += Math.min(n, 1200) / 200;
    return sc;
  }
  const lvCache = {};
  function lvPct(kind) {
    const c = CT(), list = (c && c[kind]) || [], key = list.length + '|' + ((c && c.version) || '');
    if (lvCache[kind] && lvCache[kind].key === key) return lvCache[kind].map;
    const sc = list.map((it) => [it.id, lvRaw(kind, it)]).sort((a, b) => a[1] - b[1]), map = {};
    sc.forEach(([id], i) => { map[id] = sc.length > 1 ? i / (sc.length - 1) : 0.5; });
    lvCache[kind] = { key, map }; return map;
  }
  const LV_P = { A1: 0, A2: 0, B1: 0.1, B2: 0.3, C1: 0.8, C2: 1 };
  function lvRank(kind, arr) {
    if (!arr.length || PROG()) return arr;   // ÖSD content is already filtered by its own exam level
    const pm = lvPct(kind), [lo, hi] = lvBand(), low = lowLevel();
    const pOf = (x) => { const t = x.level && String(x.level).toUpperCase(); return t && LV_P[t] != null ? LV_P[t] : pm[x.id] != null ? pm[x.id] : 0.5; };
    const dist = (p) => (p < lo ? lo - p : p > hi ? p - hi : 0);
    return arr.map((x, i) => { const p = pOf(x); return [x, dist(p), low ? p : i]; }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((z) => z[0]);
  }
  TDM.level = userLevel; TDM.lowLevel = lowLevel;
  TDM.itemLevel = function (kind, id) { const p = lvPct(kind)[id]; return p == null ? null : Math.round(p * 100) / 100; };
  // ───────────── picks ─────────────
  function nextFrom(kind, filter) {
    const c = CT(), m = M(); if (!c) return null;
    const list = (c[kind] || []).filter((x) => !filter || filter(x)); if (!list.length) return null;
    const used = m.used[kind];
    let it = lvRank(kind, list.filter((x) => !used.includes(x.id) && !x.tw))[0]; /*LEVEL-ADAPT*/ /*THEMED-DAYS: themed items only via their own day*/
    if (!it) it = list.slice().sort((a, b) => used.lastIndexOf(a.id) - used.lastIndexOf(b.id))[0];
    used.push(it.id); return it.id;
  }
  /*LEAN4-PACKS*/ function leanNextPack(k) {
    const c = CT(); if (!LEAN() || PROG() || !c || !Array.isArray(c.packs) || !c.packs.length) return null;
    if (k !== today() && k !== (S.plan && S.plan.date)) return null;
    const m = M(), cur = Number(m.packCur) || 0, seq = packSeq();
    const wk = weekOf(k), pos = [6, 0, 1, 2, 3, 4, 5].indexOf(wdOf(k));
    const at = cur ? seq.indexOf(cur) : -1;
    const want = cur && at >= 0 ? seq[at + 1] : seq[Math.max(0, (Math.max(1, wk) - 1) * 6 + Math.min(pos, 5))];
    const pk = c.packs.find((x) => x.day === want); if (!pk) return null;
    const ids = [['hoeren', pk.hoeren], ['lesen', pk.lesen], [pk.schreiben?.kind, pk.schreiben?.id], ...(pk.sprechen || []).map((x) => ['sprechen', x])].filter((x) => x[0] && x[1]);
    if (!ids.length || ids.some(([kd, id]) => !item(kd, id))) return null;   // pack not published yet: normal picking, pointer stays
    return { pk, ids };
  }
  // the pack sequence of THIS account (owner/admin may reorder it in the admin tree); default = pack number order
  /*FRI-FILL: ids 7, 14, 21 … (the old Fridays) fill the first packs that are not ready yet; unready ones go last*/
  function friFill(list) {
    const c = CT(), by = new Map((c && c.packs || []).map((p) => [p.day, p])), fri = (d) => ((Number(d) - 1) % 7) === 6;
    const ready = (d) => { const pk = by.get(d); if (!pk) return false; const ids = [['hoeren', pk.hoeren], ['lesen', pk.lesen], [pk.schreiben?.kind, pk.schreiben?.id], ...(pk.sprechen || []).map((x) => ['sprechen', x])].filter((x) => x[0] && x[1]); return ids.length > 0 && ids.every(([kd, id]) => item(kd, id)); };
    const fr = list.filter(fri), fReady = fr.filter(ready), fLater = fr.filter((d) => !ready(d));
    let out = [], wait = [];
    list.filter((d) => !fri(d)).forEach((d) => {
      if (!ready(d) && fReady.length) { out.push(fReady.shift()); wait.push(d); return; }
      if (wait.length && !fReady.length) { out = out.concat(wait); wait = []; }
      out.push(d);
    });
    return out.concat(fReady, wait, fLater);
  }
  function packSeq() {
    const c = CT(), all = c && Array.isArray(c.packs) ? c.packs.map((x) => x.day) : [];
    const own = Array.isArray(M().packOrder) ? M().packOrder.map(Number).filter((x) => x > 0) : [];
    const seen = new Set(own), base = [...own, ...all.filter((x) => !seen.has(x)).sort((a, b) => a - b)];
    return M().packOrderFri ? base : friFill(base);   /*FRI-FILL*/
  }
  TDM.packCur = () => Number(M().packCur) || 0;
  /*PACK-DONE*/ TDM.packIgnore = () => (M().packIgnore || {});
  /*PACK-RESET*/ TDM.resetPackDay = async function (pk, dates) {
    if (!LEAN()) return false;
    const m = M(), k = (S.plan && S.plan.date) || today(), list = (dates || []).filter(Boolean), SK = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
    if (list.includes(k) && TDM.active()) {
      const d = m.days[k];
      const started = SK.some((x) => (S.completedActivities || []).includes(x) || (d && d.results && d.results[x]) || (Number(S.activityTimers?.[x]) || 0) > 0);
      if (started) {
        const msg = 'این روز همان تمرین امروز در «اجرای برنامه» است. علامت‌ها پاک شوند و پیشرفت امروز Hören، Lesen، Schreiben و Sprechen هم از نو شروع شود؟';
        const ok = typeof appConfirm === 'function' ? await appConfirm(msg) : confirm(msg); if (!ok) return false;
      }
      if (d) SK.forEach((x) => { if (d.results) delete d.results[x]; if (d.work) delete d.work[x]; });
      S.completedActivities = (S.completedActivities || []).filter((x) => !SK.includes(x));
      SK.forEach((x) => { if (S.activityProgress) delete S.activityProgress[x]; if (S.activityTimers) delete S.activityTimers[x]; });
      if (S.activeActivity && SK.includes(S.activeActivity.id)) S.activeActivity = null;
      if (m.packIgnore && m.packIgnore[pk]) m.packIgnore[pk] = m.packIgnore[pk].filter((x) => x !== k);
    }
    const others = list.filter((x) => x !== k || !TDM.active());
    if (others.length) { m.packIgnore = m.packIgnore || {}; m.packIgnore[pk] = Array.from(new Set([...(m.packIgnore[pk] || []), ...others])); }
    saveData();
    return true;
  };
  TDM.setPackIgnore = function (pk, dates) { if (!LEAN()) return false; const m = M(); m.packIgnore = m.packIgnore || {}; m.packIgnore[pk] = Array.from(new Set([...(m.packIgnore[pk] || []), ...(dates || [])])); saveData(); return true; };
  TDM.packOrder = () => (Array.isArray(M().packOrder) ? M().packOrder.slice() : null);
  TDM.setPackOrder = function (list, fri) { if (!LEAN() || !Array.isArray(list)) return false; M().packOrder = list.map(Number).filter((x) => x > 0); if (fri) M().packOrderFri = 1; saveData(); return true; };
  TDM.packOrderFri = () => !!M().packOrderFri;
  function themedDay(week, wd) { /*THEMED-DAYS*/ // weeks 9+ : one topic per day across all skills
    const c = CT(); if (!c || PROG() || !(week >= 9)) return null;
    const pick = (k) => (c[k] || []).filter((x) => x.tw === week && x.twd === wd);
    const r = { hoeren: pick('hoeren'), lesen: pick('lesen'), argumentation: pick('argumentation'), grafik: pick('grafik'), sprechen: pick('sprechen') };
    const any = Object.values(r).find((a) => a.length); if (!any) return null;
    r.theme = any[0].dayTheme || ''; return r;
  }
  function thTake(kind, it) { if (!it) return null; const u = M().used[kind]; if (u.includes(it.id)) return null; u.push(it.id); return it.id; }
  TDM.dayTheme = (k) => M().days[k || dayKey()]?.theme || '';
  function ensureDay(k) {
    const m = M();
    if (!m.startDate) m.startDate = k;
    let d = m.days[k];
    if (!d) pruneOldDays(m, k);
    if (!d) d = m.days[k] = { date: k, wd: wdOf(k), week: weekOf(k), mode: dayMode(k), phase: m.phase, work: {}, results: {}, createdAt: new Date().toISOString() };
    if (!d.picks && CT()) {
      d.level = userLevel(); /*LEVEL-ADAPT*/
      const def = TDM.dayDef(k), p = {};
      const LP = leanNextPack(k); /*LEAN4-PACKS*/
      if (LP) {
        const pk = LP.pk; d.picks = { hoeren: pk.hoeren, lesen: pk.lesen, schreiben: { kind: pk.schreiben.kind, id: pk.schreiben.id }, sprechen: (pk.sprechen || []).slice(), spBase: (pk.sprechen || []).length || 1 };
        LP.ids.forEach(([kd, id]) => { const u = m.used[kd] || (m.used[kd] = []); if (!u.includes(id)) u.push(id); });
        d.packDay = pk.day; d.theme = pk.theme || ''; m.packCur = pk.day;
        d.redemittel = pickRedemittel(d); saveData(); return d;
      }
      delete d.packDay; delete d.theme;
      const TH = themedDay(d.week, d.wd); /*THEMED-DAYS*/
      if (TH) d.theme = TH.theme;
      p.hoeren = thTake('hoeren', TH && TH.hoeren[0]) || nextFrom('hoeren'); p.lesen = thTake('lesen', TH && TH.lesen[0]) || (PROG() && PROG().lesenFilter(def) && nextFrom('lesen', PROG().lesenFilter(def))) || nextFrom('lesen');
      let sk = def.schreiben; if (sk === 'auto') sk = d.week % 2 === 1 ? 'grafik' : 'argumentation';
      p.schreiben = { kind: sk, id: thTake(sk, TH && TH[sk][0]) || (PROG() && PROG().schreibenFilter(def) && nextFrom(sk, PROG().schreibenFilter(def))) || nextFrom(sk) };
      let types = def.sprechen; const spTh = [];
      if (TH && TH.sprechen.length) {
        const pool = TH.sprechen.filter((x) => !m.used.sprechen.includes(x.id)), want = Array.isArray(types) ? types.length : types;
        if (Array.isArray(types)) types.forEach((t) => { const i = pool.findIndex((x) => x.type === t); if (i >= 0) spTh.push(thTake('sprechen', pool.splice(i, 1)[0])); });
        else pool.slice(0, want).forEach((x) => spTh.push(thTake('sprechen', x)));
        if (Array.isArray(types)) types = types.filter((t) => !spTh.some((id) => item('sprechen', id)?.type === t)); else types = Math.max(0, types - spTh.length);
      }
      if (typeof types === 'number') { const cnt = types; types = []; for (let i = 0; i < cnt; i++) { types.push(SPO()[m.cursor.sprechen % SPO().length]); m.cursor.sprechen++; } }
      p.sprechen = [...spTh.filter(Boolean), ...types.map((t) => nextFrom('sprechen', (x) => x.type === t)).filter(Boolean)];
      d.picks = p;
      d.redemittel = pickRedemittel(d);
      saveData();
    }
    return d;
  }
  TDM.ensureDay = ensureDay;
  function pruneOldDays(m, k) {
    const limit = addDays(k, -21);
    Object.values(m.days).forEach((d) => { if (d.date < limit && d.work && Object.keys(d.work).length) { d.work = {}; d.pruned = true; } });
    if (m.log.length > 4000) m.log = m.log.slice(-4000);
  }
  const normPhrase = (s) => String(s || '').toLowerCase().replace(/[^a-zäöüß ]/g, '').replace(/\s+/g, ' ').trim();
  function pickRedemittel(d) {
    const m = M(), seen = new Set(m.redemittelSeen), out = [];
    const sw = d.picks.schreiben ? item(d.picks.schreiben.kind, d.picks.schreiben.id) : null;
    const sp = (d.picks.sprechen || []).map((id) => item('sprechen', id)).filter(Boolean);
    const sprechFirst = [1, 3].includes(d.wd);
    const pools = sprechFirst ? [...sp.map((x) => arr(x.redemittel)), arr(sw?.redemittel)] : [arr(sw?.redemittel), ...sp.map((x) => arr(x.redemittel))];
    for (const pool of pools) for (const r of pool) { const n = normPhrase(r.de); if (out.length < 5 && n && !seen.has(n)) { out.push(r); seen.add(n); } }
    for (const pool of pools) for (const r of pool) { if (out.length < 5 && !out.includes(r)) out.push(r); }
    m.redemittelSeen = [...seen];
    return out;
  }
  function dayKey() { return S.plan?.date || today(); }
  function curDay() { return ensureDay(dayKey()); }

  // ───────────── activities for the main plan ─────────────
  function activityDesc(id, k) {
    const d = M().days[k], mode = dayMode(k), def = TDM.dayDef(k);
    const modeLabel = mode === 'eval' ? 'Wochentest' : mode === 'exam' ? 'Prüfungsmodus' : '';
    let detail = '';
    if (d?.picks && CT()) {
      if (id === 'hoeren') { const it = item('hoeren', d.picks.hoeren); detail = it ? `${it.formatLabel}: ${it.title}` : ''; }
      if (id === 'lesen') { const it = item('lesen', d.picks.lesen); detail = it ? it.title : ''; }
      if (id === 'schreiben') { const it = item(d.picks.schreiben.kind, d.picks.schreiben.id); detail = it ? `${d.picks.schreiben.kind === 'grafik' ? 'Grafik' : (it.formatLabel ? it.formatLabel.split('·').pop().trim() : 'Argumentation')}: ${it.title}` : ''; }
      if (id === 'sprechen') detail = spList(d).map((x) => item('sprechen', x)?.typeLabel).filter(Boolean).join(' · ');
    }
    const method = { hoeren: '5-Schritte-Methode', lesen: '4-Schritte-Methode', schreiben: def.schreiben === 'grafik' ? 'Grafik und Zusammenfassung' : 'Argumentation', sprechen: 'Prepare → Speak → Record → Analyze → Repeat', wortschatz: '5 neue Wörter · 5 Redemittel · Satzbildung', wiederholung: 'Active Recall · 1-3-7-14', fehleranalyse: 'Fehler der Woche · Wiederholung · Vergleich', wochenbericht: 'Vergleich mit der Vorwoche · Ziel', extra: 'Zusatzzeit · Satzbildung mit Wiederholung & Strukturen' }[id];
    return [modeLabel, detail || method].filter(Boolean).join(' · ');
  }
  // The plan is exam-like and fixed: 240 minutes split exactly as in the study plan. The dashboard hour slider belongs to
  // the «مطالعه آزاد» tab and never scales it; the only addition is the optional extra learning time chosen on the plan tab.
  function extraActivity(k, mins) {
    return { id: 'extra', icon: MODS.extra.icon, title: MODS.extra.de, desc: activityDesc('extra', k), dur: mins, questionTarget: 0, type: 'method', content_ref: 'extra', priority: 'medium', optional: true, method: { module: 'extra', mode: dayMode(k) } };
  }
  TDM.buildActivities = function (_minutes, k0) {
    const k = k0 || today(), m = M();
    if (!m.startDate) m.startDate = k;
    const d = ensureDay(k);
    const mode = dayMode(k), def = TDM.dayDef(k);
    const mins = minutesFor(k);
    const activities = dayModules(k).map((id) => {
      const title = mode === 'eval' && ['hoeren', 'lesen', 'schreiben', 'sprechen'].includes(id) ? `${MODS[id].de}-Test` : MODS[id].de;
      return { id, icon: MODS[id].icon, title, desc: activityDesc(id, k), dur: mins[id], questionTarget: 0, type: 'method', content_ref: id, priority: def.focus.includes(id) ? 'high' : 'medium', method: { module: id, mode } };
    });
    const extra = Number(d.extraMin) || 0;
    if (extra > 0 && !LEAN()) activities.push(extraActivity(k, extra)); /*LEAN4*/
    return { activities, totalMinutes: activities.reduce((s, a) => s + a.dur, 0), availableMinutes: dailyMin() + extra };
  };
  function refreshPlanDescriptions() {
    if (!S.plan || !TDM.active() || !Array.isArray(S.plan.activities)) return;
    const k = S.plan.date || today(); ensureDay(k);
    let changed = false;
    S.plan.activities.forEach((a) => { if (a.type === 'method') { const d = activityDesc(a.id, k); if (d !== a.desc) { a.desc = d; changed = true; } } });
    if (changed) { saveData(); if (S.screen === 'dashboard') render(); }
  }
  TDM.refreshPlanDescriptions = refreshPlanDescriptions;
  /*LEVEL-ADAPT*/ // premium level change: today's unfinished modules get new content for the new level; finished ones stay
  TDM.applyLevelChange = function () {
    if (!CT()) return TDM.ensureContent().then(() => TDM.applyLevelChange()).catch((e) => console.warn(e));
    const m = M(), k = (TDM.active() && S.plan?.date) || today(), d = m.days[k], fresh = [];
    if (d && d.picks) {
      const done = new Set([...(TDM.active() ? S.completedActivities || [] : []), ...Object.keys(d.results || {})]);
      const def = TDM.dayDef(k), p = d.picks;
      const swap = (kind, old, extra) => {
        const u = m.used[kind] || [], at = u.lastIndexOf(old); if (at >= 0) u.splice(at, 1);
        const id = nextFrom(kind, (x) => x.id !== old && (!extra || extra(x))) || (extra ? nextFrom(kind, (x) => x.id !== old) : null);
        if (id) return id; u.push(old); return old;
      };
      if (!done.has('hoeren') && p.hoeren) { p.hoeren = swap('hoeren', p.hoeren); fresh.push('hoeren'); }
      if (!done.has('lesen') && p.lesen) { p.lesen = swap('lesen', p.lesen, (PROG() && PROG().lesenFilter(def)) || null); fresh.push('lesen'); }
      if (!done.has('schreiben') && p.schreiben?.id) { p.schreiben = { kind: p.schreiben.kind, id: swap(p.schreiben.kind, p.schreiben.id, (PROG() && PROG().schreibenFilter(def)) || null) }; fresh.push('schreiben'); }
      if (!done.has('sprechen') && Array.isArray(p.sprechen)) { p.sprechen = p.sprechen.map((id) => { const t = item('sprechen', id)?.type; return swap('sprechen', id, t ? (x) => x.type === t : null); }); fresh.push('sprechen'); }
      if (!done.has('wortschatz')) { d.redemittel = pickRedemittel(d); fresh.push('wortschatz'); }
      fresh.forEach((id) => { if (d.work) delete d.work[id]; if (TDM.active() && S.activityProgress) delete S.activityProgress[id]; });
      d.level = userLevel(); d.levelAt = new Date().toISOString();
    }
    if (TDM.active() && S.plan) { try { syncPlan(true); } catch (e) { console.warn(e); } refreshPlanDescriptions(); }
    saveData();
    return fresh;
  };

  // ───────────── work state & steps ─────────────
  function act() { return S.activeActivity; }
  function work(id = act()?.id) {
    const d = curDay(); d.work = d.work || {};
    const w = d.work[id] || (d.work[id] = { step: 0, secs: [], f: {}, ans: {}, cat: {}, rec: {}, rate: {}, self: {}, checked: {} });
    for (const k of ['secs']) w[k] = w[k] || []; for (const k of ['f', 'ans', 'cat', 'rec', 'rate', 'self', 'checked']) w[k] = w[k] || {};
    return w;
  }
  const S_HOEREN = { normal: [['global', 'Globales Hören', 'شنیدن کلی', 5], ['selektiv', 'Selektives Hören', 'شنیدن انتخابی + سؤالات', 10], ['analyse', 'Transkription und Analyse', 'متن و تحلیل اشتباهات', 15], ['erneut', 'Erneutes Hören', 'شنیدن دوباره بدون متن', 10], ['zusammenfassung', 'Zusammenfassung', 'بازگویی شفاهی و ضبط', 20]], exam: [['pruefung', 'Prüfung', 'آزمون زمان‌دار (حداکثر ۲ بار پخش)', 25], ['analyse', 'Auswertung und Transkript', 'تحلیل با متن', 20], ['zusammenfassung', 'Zusammenfassung', 'بازگویی شفاهی', 15]], eval: [['pruefung', 'Hören-Test', 'آزمون هفتگی (حداکثر ۲ بار پخش)', 25], ['analyse', 'Auswertung', 'تحلیل اشتباهات', 15]] };
  const S_LESEN = { normal: [['ueberblick', 'Überblick', 'نگاه کلی و پیش‌بینی', 5], ['intensiv', 'Intensives Lesen', 'خواندن دقیق و ایده هر پاراگراف', 15], ['aufgaben', 'Aufgaben lösen', 'حل سؤالات با شواهد متن', 15], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات و خلاصه', 10]], exam: [['pruefung', 'Prüfung', 'آزمون زمان‌دار', 30], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات و خلاصه', 15]], eval: [['pruefung', 'Lesen-Test', 'آزمون هفتگی', 30], ['fehler', 'Fehleranalyse', 'تحلیل اشتباهات', 15]] };
  const S_ARG = { normal: [['analyse', 'Analyse', 'تحلیل موضوع', 5], ['gliederung', 'Gliederung', 'طرح متن', 5], ['schreiben', 'Schreiben', 'نوشتن متن', 25], ['korrektur', 'Korrektur', 'تصحیح هوشمند، مقایسه با متن نمونه', 15]], exam: [['schreiben', 'Schreiben (Prüfung)', 'نوشتن زمان‌دار', 40], ['korrektur', 'Korrektur', 'تصحیح هوشمند', 10]] };
  const S_GRAFIK = { normal: [['analyse', 'Grafik analysieren', 'تحلیل نمودار و متن', 10], ['schreiben', 'Zusammenfassung schreiben', 'نوشتن خلاصه ۱۰۰ تا ۱۵۰ کلمه', 25], ['korrektur', 'Korrektur', 'تصحیح هوشمند، مقایسه با متن نمونه', 15]], exam: [['schreiben', 'Grafik (Prüfung)', 'نوشتن زمان‌دار', 40], ['korrektur', 'Korrektur', 'تصحیح هوشمند', 10]] };
  const S_WORT = [['alt', 'Wörter wiederholen', 'مرور لغات قبلی', 5], ['neu', '5 neue Wörter', 'پنج لغت جدید', 10], ['redemittel', '5 Redemittel', 'پنج عبارت کاربردی', 5], ['saetze', 'Satzbildung', 'جمله‌سازی + گرامر هفته', 5]];
  const S_WIED = [['woerter', 'Wörter von gestern', 'لغات روز قبل', 5], ['grammatik', 'Fehler wiederholen', 'مرور اشتباهات گرامری', 5], ['wiedergeben', 'Inhalte wiedergeben', 'بازگویی محتوای روز قبل', 5], ['redemittel', 'Redemittel', 'مرور Redemittel', 5], ['test', 'Selbsttest', 'آزمون از خود بدون جزوه', 5]];
  const S_FEHLER = [['woche', 'Fehler der Woche', 'اشتباهات این هفته', 15], ['wiederholung', 'Wiederholung', 'مرور موارد سررسید', 15], ['vergleich', 'Vergleich', 'مقایسه با هفته قبل و سه ضعف', 10]];
  const S_BERICHT = [['bericht', 'Wochenbericht', 'گزارش هفتگی و هدف', 30]];
  const S_EXTRA = [['woerter', 'Sätze mit Wörtern', 'جمله‌سازی با لغات مرور امروز و ساختارهای پرکاربرد', 12], ['redemittel', 'Sätze mit Redemitteln', 'جمله‌سازی با Redemittel مرور امروز', 9], ['fehler', 'Fehler richtig anwenden', 'شکل درست اشتباهات در جمله تازه', 9]]; /*EXTRA-SATZ*/
  /*VOL-TIME*/ // 2026-11-14: step times follow the real volume of the day's content; the module minutes (from the fixed daily time) are only redistributed
  const vWc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  function volNeed(id, mode, d, keys) {
    if (!CT() || !d) return null;
    const p = d.picks || {}, k = d.date || today(), f = {};
    const dueErr = () => (S.errors || []).filter((e) => (typeof errorIsDue === 'function' ? errorIsDue(e) : true)).length;
    const srsN = (type, due) => Object.values(M().srs || {}).filter((x) => x.type === type && (!due || x.due <= k)).length;
    if (id === 'hoeren') {
      const it = item('hoeren', p.hoeren); if (!it) return null;
      const A = (Number(it.duration) || 240) / 60, q = (trimQs(it.questions) || []).length, tw = vWc((it.segments || []).map((s) => s.text).join(' '));
      Object.assign(f, { global: A + 1, selektiv: A + q, analyse: tw / 90 + q * 0.8, erneut: A + 1, zusammenfassung: 8, pruefung: 2 * A + q + 1 });
    } else if (id === 'lesen') {
      const it = item('lesen', p.lesen); if (!it) return null;
      const W = vWc((it.paragraphs || []).map((x) => x.text || x).join(' ')), q = (trimQs(it.questions) || []).length, P = (it.paragraphs || []).length;
      Object.assign(f, { ueberblick: 1 + P * 0.4, intensiv: W / 70, aufgaben: q * 1.5, fehler: q * 0.8 + 2, pruefung: W / 120 + q * 1.5 });
    } else if (id === 'schreiben') {
      const pk = p.schreiben, it = pk ? item(pk.kind, pk.id) : null; if (!it) return null;
      const T = mwOf(d) || 200, src = vWc([it.situation, ...(it.positions || []).map((x) => x.text), it.task, it.text].join(' ')), mw = vWc(it.model_text);
      Object.assign(f, { analyse: src / 100 + (pk.kind === 'grafik' ? 5 : 2), gliederung: 5, schreiben: T / 8 + (mode === 'normal' ? 0 : 5), korrektur: 4 + mw / 100 + T / 40 });
    } else if (id === 'sprechen') {
      const L_ = spList(d).map((x) => item('sprechen', x)).filter(Boolean); if (!L_.length) return null;
      const pr = (it) => (Number(it.prep) || 60) / 60, sp = (it) => (Number(it.speak) || 90) / 60;
      L_.forEach((it, t) => Object.assign(f, { ['prep:' + t]: pr(it) + 1.5, ['speak:' + t]: sp(it) * 2 + 1, ['analyse:' + t]: sp(it) * 2 + 3, ['repeat:' + t]: sp(it) * 2 + 2 }));
      Object.assign(f, { exam: L_.reduce((s, it) => s + pr(it) + sp(it) + 1, 0), analyse: L_.reduce((s, it) => s + sp(it) * 2 + 3, 0) });
    } else if (id === 'wortschatz') {
      Object.assign(f, { alt: Math.min(8, srsN('wort')) * 0.6 + 1, neu: 10, redemittel: (d.redemittel || []).length || 5, saetze: 7 });
    } else if (id === 'wiederholung') {
      Object.assign(f, { woerter: Math.min(15, srsN('wort', true)) * 0.6 + 1, grammatik: Math.min(8, dueErr()) * 1.5 + 1, wiedergeben: prevPracticeDay(k) ? 6 : 1, redemittel: Math.min(12, srsN('redemittel', true)) * 0.5 + 1, test: 6 });
    } else if (id === 'fehleranalyse') {
      Object.assign(f, { woche: 4 + Math.min(20, weekErrors(d.week).length) * 0.6, wiederholung: Math.min(15, dueErr()) * 1.5 + 1, vergleich: 8 });
    } else if (id === 'extra') { /*EXTRA-SATZ*/
      const sx = d.work?.extra?.sx;
      Object.assign(f, { woerter: (sx ? sx.woerter.length : 5) * 2 + 1, redemittel: (sx ? sx.redemittel.length : 4) * 2 + 1, fehler: (sx ? Math.max(1, sx.fehler.length) : 3) * 2.5 + 1 });
    } else return null;
    const out = keys.map((key) => f[key]);
    return out.every((x) => Number.isFinite(x)) ? out.map((x) => Math.max(1, x)) : null;
  }
  // module weight factor: real workload of today's content ÷ nominal workload of the step table
  function loadRatio(k, id) {
    try {
      const d = M().days?.[k]; if (!d || !d.picks || !CT()) return 1;
      const mode = dayMode(k), raw = stepsFor(id, mode, d, true), nominal = raw.reduce((s, x) => s + x[3], 0);
      const need = volNeed(id, mode, d, raw.map((x) => x[0])); if (!need || !nominal) return 1;
      return clamp(need.reduce((s, x) => s + x, 0) / nominal, 0.6, 1.6);
    } catch (e) { return 1; }
  }
  TDM.volNeed = volNeed; TDM.loadRatio = loadRatio;
  function stepsFor(id, mode, d, rawOnly) {
    let raw;
    if (id === 'hoeren') raw = S_HOEREN[mode] || S_HOEREN.normal;
    else if (id === 'lesen') raw = S_LESEN[mode] || S_LESEN.normal;
    else if (id === 'schreiben') { const g = d.picks?.schreiben?.kind === 'grafik'; raw = (g ? S_GRAFIK : S_ARG)[mode === 'normal' ? 'normal' : 'exam']; }
    else if (id === 'sprechen') {
      const n = Math.max(1, spList(d).length);
      if (mode === 'normal') { raw = []; for (let t = 0; t < n; t++) { const tag = n > 1 ? ` (${t + 1}/${n})` : ''; raw.push(['prep:' + t, 'Vorbereitung' + tag, 'آماده‌سازی: فقط کلیدواژه', 5 / n * (n > 1 ? 1 : 1)], ['speak:' + t, 'Sprechen' + tag, 'صحبت و ضبط', 10 / n], ['analyse:' + t, 'Analyse' + tag, 'گوش‌دادن و بررسی', 5 / n], ['repeat:' + t, 'Wiederholung' + tag, 'اجرای مجدد بدون یادداشت', 15 / n]); } }
      else raw = [['exam', mode === 'eval' ? 'Sprechen-Test' : 'Prüfung', 'اجرای زمان‌دار تمام وظایف', 25], ['analyse', 'Analyse', 'بررسی ضبط‌ها و ارزیابی', 10]];
    } else if (id === 'wortschatz') raw = S_WORT;
    else if (id === 'wiederholung') raw = S_WIED;
    else if (id === 'fehleranalyse') raw = S_FEHLER;
    else if (id === 'extra') raw = S_EXTRA;
    else raw = S_BERICHT;
    if (rawOnly) return raw;
    { const keys = raw.map((x) => x[0]).join('|'), wk = d?.work?.[id];   // VOL-TIME: frozen once the activity has started
      let need = wk?.volEst && wk.volEst.mode === mode && wk.volEst.keys === keys ? wk.volEst.v : null;
      if (!need) { need = volNeed(id, mode, d, raw.map((x) => x[0])); if (need && wk?.startedAt) wk.volEst = { mode, keys, v: need.map((x) => Math.round(x * 10) / 10) }; }
      if (need) raw = raw.map((x, n) => [x[0], x[1], x[2], need[n]]); }
    const total = raw.reduce((s, x) => s + x[3], 0), dur = Number(act()?.dur) || total;
    return raw.map(([key, de, fa, min]) => ({ key, de, fa, min: Math.max(1, Math.round((min / total) * dur)) }));
  }

  // ───────────── activity lifecycle ─────────────
  /*REVIEW*/ // 2026-11-12: a finished exercise opens read-only — questions, own answers, texts and analyses; nothing can be changed
  TDM.review = function (id) {
    const a = S.plan?.activities?.find((x) => x.id === id); if (!a) return;
    stopAudio(); stopRecorder(true);
    S.activeActivity = a; S.tdmReview = true; S.screen = 'methodActivity';
    const w = work(a.id); w.step = 0;
    TDM.ensureContent().then(() => { if (S.screen === 'methodActivity') render(); }).catch((e) => console.warn(e));
    render(); window.scrollTo({ top: 0, behavior: 'auto' });
  };
  TDM.reviewClose = function () {
    stopAudio(); S.tdmReview = false; S.activeActivity = null;
    if (typeof navigateApp === 'function') navigateApp('dashboard'); else { S.screen = 'dashboard'; render(); }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  // review mode: only navigation, reveals and listening react to clicks
  const REVIEW_OK = /TDM\.(go|review|reviewClose|toggleReveal|holdStart|holdStop|unlock|audio\w*|playSeg|hub)\b|pauseActivity/;
  document.addEventListener('click', (e) => {
    if (!S.tdmReview || !e.target?.closest?.('.tdm-review')) return;
    const el = e.target.closest('[onclick]'); if (!el || REVIEW_OK.test(el.getAttribute('onclick') || '')) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  function lockReview() {
    document.querySelectorAll('.tdm-review textarea').forEach((el) => { el.readOnly = true; });
    document.querySelectorAll('.tdm-review input, .tdm-review select').forEach((el) => { el.disabled = true; });
  }
  TDM.start = function (activity) {
    S.tdmReview = false;
    S.screen = 'methodActivity';
    const w = work(activity.id); if (!w.startedAt) w.startedAt = new Date().toISOString();
    TDM.ensureContent().then(() => { ensureDay(dayKey()); if (S.screen === 'methodActivity') render(); }).catch((e) => console.warn(e));
  };
  TDM.go = function (i) {
    const a = act(); if (!a) return;
    const w = work(), steps = stepsFor(a.id, curDay().mode, curDay());
    w.step = clamp(i, 0, steps.length - 1);
    if (curDay().mode !== 'normal' && a.id === 'hoeren') stopAudio();
    saveData(); render(); window.scrollTo({ top: 0, behavior: 'auto' });
  };
  TDM.f = function (key, value) { const w = work(); w.f[key] = value; scheduleSave(); };
  let saveT = null;
  function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(() => saveData(), 700); }

  // ticking: step timers, exam countdowns, recorder clock
  let tick = null;
  function ensureTick() {
    if (tick) return;
    tick = setInterval(() => {
      if (S.screen !== 'methodActivity' || !act()) { clearInterval(tick); tick = null; return; }
      if (S.tdmReview) return;
      if (document.visibilityState === 'hidden') return;
      const w = work(), steps = stepsFor(act().id, curDay().mode, curDay()), i = w.step || 0;
      w.secs[i] = (w.secs[i] || 0) + 1;
      const lim = steps[i].min * 60, used = w.secs[i];
      const clock = document.getElementById('tdmStepClock'); if (clock) clock.textContent = `${mmss(used)} / ${mmss(lim)}`;
      const bar = document.getElementById('tdmStepBar'); if (bar) { bar.style.width = clamp(used / lim * 100, 0, 100) + '%'; bar.classList.toggle('is-over', used > lim); }
      const cd = document.getElementById('tdmCountdown');
      if (cd) { const left = lim - used; cd.textContent = mmss(left); cd.classList.toggle('is-low', left <= 60); if (left <= 0 && cd.dataset.auto && !w.checked[cd.dataset.auto]) { TDM.check(cd.dataset.auto, true); } }
      examSpeakingTick(w);
    }, 1000);
  }

  TDM.finish = function () {
    const a = act(); if (!a) return;
    const d = curDay(), w = work(), res = computeResults(a.id, d, w);
    d.results[a.id] = { ...res, help: Object.keys(w.help || {}).length, seconds: Number(S.activityTimers?.[a.id]) || 0, mode: d.mode, at: new Date().toISOString() };
    if (!w.done) logErrors(a.id, d, w);
    w.done = true;
    stopAudio(); stopRecorder(true);
    try { flushRecTrash(w); dropAnalysedAudio(w); } catch (e) { console.warn(e); }
    saveData();
    completeActivity(a.id);
  };

  // ───────────── audio player (persists across re-renders) ─────────────
  const P = { audio: null, src: '', endAt: null, item: null, playing: false };
  const RATES = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];
  function audioFor(it) {
    if (!it?.audio) return null;
    if (P.src !== it.audio) {
      stopAudio();
      P.audio = new Audio(it.audio); P.src = it.audio; P.item = it; P.audio.preload = 'auto';
      try { const ex = act()?.id === 'hoeren' && curDay().mode !== 'normal', w0 = act()?.id ? work() : null, r0 = ex ? 1 : (Number(w0?.rate_) || (lowLevel() ? 0.9 : 1)); P.audio.defaultPlaybackRate = r0; P.audio.playbackRate = r0; } catch (e) { /* ignore */ } /*LEVEL-ADAPT*/
      P.audio.addEventListener('timeupdate', onAudioTime);
      P.audio.addEventListener('ended', () => { P.playing = false; P.endAt = null; countPlay(true); updatePlayerUI(); });
      P.audio.addEventListener('play', () => { P.playing = true; updatePlayerUI(); });
      P.audio.addEventListener('pause', () => { P.playing = false; updatePlayerUI(); });
      P.audio.addEventListener('loadedmetadata', updatePlayerUI);
    }
    return P.audio;
  }
  function stopAudio() { try { P.audio?.pause(); } catch (e) { /* ignore */ } try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ } P.playing = false; P.endAt = null; }
  function countPlay(ended) { if (!act() || act().id !== 'hoeren') return; const w = work(); if (ended) { w.plays = (w.plays || 0) + 1; saveData(); const pc = document.getElementById('tdmPlays'); if (pc) pc.textContent = faNum(w.plays); } }
  function onAudioTime() {
    if (P.endAt != null && P.audio.currentTime >= P.endAt) { P.audio.pause(); P.endAt = null; }
    updatePlayerUI();
  }
  function updatePlayerUI() {
    const a = P.audio; if (!a) return;
    const bar = document.getElementById('tdmAudioBar'), t = document.getElementById('tdmAudioTime'), b = document.getElementById('tdmAudioBtn');
    const dur = a.duration || P.item?.duration || 0;
    if (bar && dur) bar.style.width = clamp(a.currentTime / dur * 100, 0, 100) + '%';
    const sk = document.getElementById('tdmSeek');
    if (sk) { sk.setAttribute('aria-valuemin', '0'); sk.setAttribute('aria-valuemax', String(Math.round(dur))); sk.setAttribute('aria-valuenow', String(Math.round(a.currentTime))); }
    if (t) t.textContent = `${mmss(a.currentTime)} / ${mmss(dur)}`;
    if (b) b.innerHTML = P.playing ? '❚❚' : '▶';
    hiliteWords();
    if (P.playing && !P.raf) { const loop = () => { P.raf = 0; if (!P.playing) { hiliteWords(); return; } hiliteWords(); P.raf = requestAnimationFrame(loop); }; P.raf = requestAnimationFrame(loop); }
  }
  /*WORDHL*/ // word-exact transcript highlight: timings from assets/method-audio/<ID>.words.json, else estimated by character position
  const WT = {};
  function wordTimes(it) {
    const url = it?.audio ? it.audio.replace(/\.mp3(\?.*)?$/, '.words.json') : ''; if (!url) return null;
    if (!(url in WT)) { WT[url] = null; fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => { WT[url] = j && Array.isArray(j.segs) ? j.segs : false; hiliteWords(); }).catch(() => { WT[url] = false; }); }
    return WT[url] || null;
  }
  /*TX-FOLLOW*/ // keep the spoken line visible; a manual scroll pauses following for a few seconds
  let txUserScroll = 0;
  ['wheel', 'touchmove'].forEach((ev) => addEventListener(ev, () => { txUserScroll = Date.now(); }, { passive: true, capture: true }));
  addEventListener('keydown', (e) => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) txUserScroll = Date.now(); }, true);
  function txFollow(el) {
    if (Date.now() - txUserScroll < 3000) return;
    const box = el.closest('.tdm-transcript'), r = el.getBoundingClientRect();
    if (box && box.scrollHeight > box.clientHeight + 2) {
      const b = box.getBoundingClientRect();
      let y = r.top;
      if (r.top < b.top + 8 || r.bottom > b.bottom - 8) { const want = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, box.scrollTop + (r.top - b.top) - box.clientHeight / 3)); y = r.top - (want - box.scrollTop); box.scrollTo({ top: want, behavior: 'smooth' }); }
      if (y < 70 || y + r.height > innerHeight - 100) window.scrollBy({ top: y - innerHeight / 3, behavior: 'smooth' });
    } else if (r.top < 70 || r.bottom > innerHeight - 100) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function hiliteWords() {
    const a = P.audio, box = document.querySelector('.tdm-transcript'); if (!a) return;
    // keep the mark while paused so the learner sees where they stopped
    const t = a.currentTime, on = t > 0 && !a.ended && (!box || box.dataset.item === String(P.item?.id || ''));
    const wt = wordTimes(P.item);
    document.querySelectorAll('[data-seg]').forEach((el) => {
      const s0 = Number(el.dataset.t0), s1 = Number(el.dataset.t1), cur = on && t >= s0 && t < s1;
      const was = el.classList.contains('is-playing'); el.classList.toggle('is-playing', cur); if (cur && !was && !a.paused) txFollow(el);
      const prev = el.querySelectorAll('.tdm-w.is-word');
      if (!cur) { prev.forEach((w) => w.classList.remove('is-word', 'is-said')); if (was) el.querySelectorAll('.tdm-w.is-said').forEach((w) => w.classList.remove('is-said')); return; }
      // character position currently spoken
      let c0 = -1, c1 = -1; const n = Number(el.dataset.seg), list = wt?.[n];
      if (list?.length) {
        for (const [a0, a1, w0, w1] of list) { if (t >= w0 - 0.02) { c0 = a0; c1 = a1; if (t < w1) break; } else break; }
      } else {
        const len = Number(el.dataset.len) || 1; c0 = c1 = Math.floor(clamp((t - s0) / Math.max(0.1, s1 - s0), 0, 0.999) * len);
      }
      el.querySelectorAll('.tdm-w').forEach((w) => {
        const w0 = Number(w.dataset.c0), w1 = Number(w.dataset.c1);
        const hit = c0 >= 0 && (c1 > c0 ? w0 < c1 && w1 > c0 : c0 >= w0 && c0 < w1);
        w.classList.toggle('is-word', hit); w.classList.toggle('is-said', c0 >= 0 && !hit && w1 <= c0);
      });
      /*TX-FOLLOW-OLD removed: wrong offset (box is the offsetParent) fought txFollow*/
    });
  }
  function playLimitReached() { const d = curDay(); if (d.mode === 'normal' || !act() || act().id !== 'hoeren') return false; const w = work(); return (w.step || 0) === 0 && (w.plays || 0) >= 2 && !P.playing; }
  TDM.audioToggle = function () {
    const it = currentHoerenItem(); if (!it) return;
    if (!it.audio) { speakFallback(it); return; }
    const a = audioFor(it);
    if (P.playing) { a.pause(); return; }
    if (playLimitReached()) { alertBox(L('در حالت آزمون فقط دو بار می‌توانید فایل را بشنوید.', 'Im Prüfungsmodus dürfen Sie den Text nur zweimal hören.')); return; }
    P.endAt = null; a.play().catch((e) => console.warn(e));
  };
  TDM.audioSeek = function (delta) { const a = P.audio; if (!a) return; P.endAt = null; a.currentTime = clamp(a.currentTime + delta, 0, a.duration || 0); updatePlayerUI(); };
  /*AUDIOCTL*/ // click / keyboard on the progress bar: seek to the exact point (owner request, 2026-11-20)
  function audioDur() { const a = P.audio; const d = a && isFinite(a.duration) ? a.duration : (P.item?.duration || 0); return d > 0 ? d : 0; }
  TDM.audioBarSeek = function (ev) {
    const it = currentHoerenItem(); if (!it?.audio) return;
    const box = ev.currentTarget, r = box.getBoundingClientRect(); if (!r.width) return;
    const rtl = getComputedStyle(box).direction === 'rtl';
    const frac = clamp(rtl ? (r.right - ev.clientX) / r.width : (ev.clientX - r.left) / r.width, 0, 1);
    const a = audioFor(it);
    const jump = () => { const d = audioDur(); if (!d) return; P.endAt = null; a.currentTime = clamp(frac * d, 0, Math.max(0, d - 0.05)); updatePlayerUI(); };
    if (audioDur()) jump(); else a.addEventListener('loadedmetadata', jump, { once: true });
  };
  TDM.audioBarKey = function (ev) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key)) return;
    const a = audioFor(currentHoerenItem()); if (!a) return;
    const d = audioDur(); if (!d) return;
    ev.preventDefault(); ev.stopPropagation();
    P.endAt = null;
    a.currentTime = ev.key === 'Home' ? 0 : ev.key === 'End' ? Math.max(0, d - 0.05)
      : clamp(a.currentTime + (ev.key === 'ArrowRight' ? 5 : -5), 0, Math.max(0, d - 0.05));
    updatePlayerUI();
  };
  TDM.audioRestart = function () { const it = currentHoerenItem(); const a = audioFor(it); if (!a) return; if (playLimitReached()) return; a.currentTime = 0; P.endAt = null; a.play().catch(() => {}); };
  TDM.audioRate = function (r) { const a = audioFor(currentHoerenItem()); const v = Number(r) || 1; if (a) { a.defaultPlaybackRate = v; a.playbackRate = v; } work().rate_ = v; saveData(); };
  TDM.playSeg = function (i) {
    const it = currentHoerenItem(); const seg = it?.segments?.[i]; if (!seg) return;
    if (!it.audio) { speakText(seg.text); return; }
    const a = audioFor(it); a.currentTime = seg.t0; P.endAt = seg.t1; a.play().catch(() => {});
  };
  function speakText(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) { console.warn(e); } }
  function speakFallback(it) { speakText(it.segments.map((s) => s.text).join(' ')); }
  function currentHoerenItem() { if (act()?.id === 'extra') { const id = work('extra').replay; return id ? item('hoeren', id) : null; } const d = curDay(); return d.picks ? item('hoeren', d.picks.hoeren) : null; }
  function playerHtml(it, opts = {}) {
    const w = work(), exam = opts.exam;
    const rate = Number(w.rate_) || (lowLevel() && !exam ? 0.9 : 1); /*LEVEL-ADAPT*/
    const rates = (RATES.includes(rate) ? RATES : RATES.concat([rate]).sort((a, b) => a - b));
    const tBack = L('۵ ثانیه عقب', '5 s zurück');
    const tFwd = L('۵ ثانیه جلو', '5 s vor');
    const dlName = 'amookht-' + String(it.id || 'hoeren') + '.mp3';
    return `<div class="tdm-player ${exam ? 'is-exam' : ''}">
      <button id="tdmAudioBtn" class="tdm-play" onclick="TDM.audioToggle()" aria-label="Play">${P.playing && P.src === it.audio ? '❚❚' : '▶'}</button>
      <div class="tdm-player-main">
        <div class="tdm-seek" id="tdmSeek" role="slider" tabindex="0" aria-label="${L('نوار پیشرفت صدا', 'Audio-Fortschritt')}" onclick="TDM.audioBarSeek(event)" onkeydown="TDM.audioBarKey(event)">
          <div class="tdm-player-track"><i id="tdmAudioBar"></i></div>
        </div>
        <div class="tdm-player-meta"><span id="tdmAudioTime">00:00 / ${mmss(it.duration || 0)}</span><span>${L('دفعات کامل شنیده‌شده', 'Vollständig gehört')}: <b id="tdmPlays">${faNum(w.plays || 0)}</b>${exam ? ' / ۲' : ''}</span></div>
      </div>
      <div class="tdm-player-tools">
        <button class="tdm-step" onclick="TDM.audioSeek(-5)" title="${tBack}" aria-label="${tBack}">⏪ ۵</button>
        <button class="tdm-restart" onclick="TDM.audioRestart()" title="${L('از ابتدا', 'Von vorn')}" aria-label="${L('از ابتدا', 'Von vorn')}">⟲</button>
        <button class="tdm-step" onclick="TDM.audioSeek(5)" title="${tFwd}" aria-label="${tFwd}">۵ ⏩</button>
        ${it.audio ? `<a class="tdm-dl" href="${E(it.audio)}" download="${E(dlName)}" title="${L('دانلود فایل صوتی', 'Audio herunterladen')}" aria-label="${L('دانلود فایل صوتی', 'Audio herunterladen')}">⬇ <span>${L('دانلود', 'Download')}</span></a>` : ''}
        <label class="tdm-rate"><span>${L('سرعت', 'Tempo')}</span><select onchange="TDM.audioRate(this.value)" aria-label="${L('سرعت پخش', 'Geschwindigkeit')}">${rates.map((r) => `<option value="${r}" ${r === rate ? 'selected' : ''}>${r}×</option>`).join('')}</select></label>
      </div>
      ${it.audio ? '' : `<small class="tdm-muted">${L('فایل صوتی موجود نیست؛ از صدای مرورگر استفاده می‌شود.', 'Keine Audiodatei – Browser-Sprachausgabe wird verwendet.')}</small>`}
    </div>`;
  }

  // ───────────── recorder ─────────────
  /*RECFIX2*/ // 2026-11-12 round 2: raw mic, no auto-stop in practice mode, newest take survives sync, old takes deleted when the exercise is finished
  /*VOICECLEAN*/ // 2026-11-12: the browser's noise suppression is back on (the cuts came from the mic warm-up, fixed by micReady),
  // plus a light speech chain: 90 Hz high-pass (hum/rumble), 9 kHz low-pass (hiss), gentle compressor (even volume); 64 kbit/s Opus.
  const MIC = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 } };
  let ACX = null;
  function audioCtx() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      if (!ACX || ACX.state === 'closed') ACX = new AC();
      if (ACX.state === 'suspended') ACX.resume().catch(() => {});
      return ACX;
    } catch (e) { return null; }
  }
  function voiceChain(stream) {
    const ac = audioCtx(); if (!ac || ac.state !== 'running' || !ac.createMediaStreamDestination) return null;
    try {
      const src = ac.createMediaStreamSource(stream);
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90; hp.Q.value = 0.7;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; lp.Q.value = 0.7;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -26; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
      const dest = ac.createMediaStreamDestination(); dest.channelCount = 1;
      src.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(dest);
      return { stream: dest.stream, stop() { try { src.disconnect(); comp.disconnect(); } catch (e) { /* ignore */ } } };
    } catch (e) { console.warn('voice chain unavailable', e); return null; }
  }
  /*RECFIX*/ // 2026-11-12: a second start while the mic permission was pending ran two recorders on one chunk list (broken ~2 s files,
  // mic left on); now one start at a time, chunks + start time belong to each recording, and memory/mic are released after saving.
  const R = { rec: null, stream: null, chunks: [], key: null, started: 0, limit: 0, timer: null, status: 'idle', starting: false, saved: {} };
  TDM.recStart = async function (key, limit = 0) {
    if (R.rec?.state === 'recording' || R.starting || R.status === 'saving') return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { alertBox(L('مرورگر از ضبط صدا پشتیبانی نمی‌کند.', 'Dieser Browser unterstützt keine Audioaufnahme.')); return; }
    R.starting = true; audioCtx();
    try {
      const fresh = !(R.stream && R.stream.active);
      const stream = fresh ? await navigator.mediaDevices.getUserMedia(MIC) : R.stream;
      /*MICWARM*/ // a fresh microphone delivers sound only after ~0.5–3 s; recording before that cut off the start of the answer
      if (fresh) { R.key = key; R.status = 'starting'; render(); await micReady(stream); }
      if (R.rec?.state === 'recording') return;
      const chunks = [], started = Date.now();
      R.stream = stream; R.chunks = chunks; R.key = key; R.limit = limit; R.started = started;
      const pref = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
      const chain = voiceChain(stream), recStream = chain ? chain.stream : stream;
      const opts = { audioBitsPerSecond: 64000 }; if (pref) opts.mimeType = pref;
      let rec; try { rec = new MediaRecorder(recStream, opts); } catch (e) { chain?.stop(); rec = pref ? new MediaRecorder(stream, { mimeType: pref }) : new MediaRecorder(stream); }
      R.rec = rec; R.status = 'recording';
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      rec.onstop = () => { chain?.stop(); const mime = (rec.mimeType || 'audio/webm').split(';')[0]; const blob = new Blob(chunks, { type: mime }); const secs = Math.round((Date.now() - started) / 1000); chunks.length = 0; if (R.chunks === chunks) R.chunks = []; releaseStream(); saveRecording(key, blob, mime, secs); };
      rec.start(1000);
      clearInterval(R.timer);
      R.timer = setInterval(() => { const el = document.getElementById('tdmRecClock'); const s = (Date.now() - R.started) / 1000; if (el) { el.textContent = mmss(s) + (R.limit ? ' / ' + mmss(R.limit) : ''); el.classList.toggle('is-over', !!R.limit && s > R.limit); } if (R.limit && s >= R.limit && R.autoStop) TDM.recStop(); }, 300);
      R.autoStop = !!limit && curDay().mode !== 'normal';
      render();
    } catch (e) { console.warn(e); R.status = 'denied'; alertBox(L('دسترسی به میکروفون داده نشد.', 'Mikrofonzugriff wurde abgelehnt.')); render(); }
    finally { R.starting = false; if (R.status === 'starting') { R.status = 'idle'; render(); } }
  };
  // wait until the microphone really delivers sound (max 2.5 s)
  async function micReady(stream) {
    let src = null;
    try {
      const ac = audioCtx(); if (!ac) { await new Promise((r) => setTimeout(r, 600)); return; }
      try { await ac.resume(); } catch (e) { /* ignore */ }
      if (ac.state !== 'running') { await new Promise((r) => setTimeout(r, 600)); return; }
      const an = ac.createAnalyser(); src = ac.createMediaStreamSource(stream); src.connect(an);
      const data = new Float32Array(an.fftSize), t0 = performance.now();
      while (performance.now() - t0 < 2500) { an.getFloatTimeDomainData(data); if (data.some((x) => Math.abs(x) > 1e-4)) break; await new Promise((r) => setTimeout(r, 40)); }
    } catch (e) { await new Promise((r) => setTimeout(r, 600)); }
    finally { try { src?.disconnect(); } catch (e) { /* ignore */ } }
  }
  TDM.recStop = function () {
    if (R.rec?.state !== 'recording') return;
    R.status = 'saving'; clearInterval(R.timer); R.rec.stop();
    // exam mode: «پایان زودتر» also ends the task's countdown (it used to keep showing «در حال ضبط» until the time ran out)
    try { const w = act()?.id === 'sprechen' ? work() : null; if (w?.ex && R.key === 'exam_' + w.ex.t) { w.ex = null; saveData(); } } catch (e) { /* ignore */ }
    render();
  };
  function releaseStream(keep) { if (!keep) { try { R.stream?.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ } R.stream = null; } }
  function stopRecorder(silent) { if (R.rec?.state === 'recording') { if (silent) { R.rec.onstop = null; try { R.rec.stop(); } catch (e) { /* ignore */ } R.status = 'idle'; clearInterval(R.timer); releaseStream(); } else TDM.recStop(); } }
  async function saveRecording(key, blob, mime, secs) {
    const a = act(); const w = a ? work(a.id) : null;
    let saved;
    try {
      const form = new FormData();
      form.append('plan_id', 'keep-tdm-' + dayKey());
      form.append('task_id', String(key).replace(/[^a-zA-Z0-9_-]/g, '-'));
      form.append('audio', blob, `tdm-${key}.${mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'}`);
      const r = await apiRequest('/speaking/recordings', { method: 'POST', body: form });
      saved = { ...r, secs, at: new Date().toISOString() };
    } catch (e) { console.warn('recording upload failed', e); saved = { playback_url: URL.createObjectURL(blob), local: true, secs, at: new Date().toISOString() }; }
    const prev = w ? w.rec[key] : null;
    if (w) {
      w.rec[key] = saved;
      if (prev && !prev.local && prev.id && prev.id !== saved.id) { w.recTrash = Array.isArray(w.recTrash) ? w.recTrash : []; if (!w.recTrash.includes(prev.id)) w.recTrash.push(prev.id); }
      R.saved[(a?.id || '') + '|' + dayKey() + '|' + key] = saved;
    }
    R.status = 'idle'; R.rec = null; saveData(); render();
    if (prev?.local) dropRecording(prev);
  }
  // the account sync lets the server win on conflicts; a just-saved take must not be replaced by an older state from another device
  function keepNewestTakes() {
    const a = act(); if (!a) return false;
    const w = work(a.id), pre = a.id + '|' + dayKey() + '|'; let changed = false;
    Object.entries(R.saved).forEach(([k, rec]) => {
      if (!k.startsWith(pre)) return;
      const key = k.slice(pre.length), cur = w.rec?.[key];
      if (cur && cur.id === rec.id) return;
      if (cur && cur.at && rec.at && cur.at > rec.at) { delete R.saved[k]; return; }
      w.rec = w.rec || {}; w.rec[key] = rec; changed = true;
    });
    if (changed) saveData();
    return changed;
  }
  /*AUDIOGONE*/ // 2026-11-12 (owner): past audio is not kept — only its analysis. Analysed takes are deleted when the exercise is finished.
  function recAudio(rec, attrs = '') {
    if (!rec) return '';
    if (rec.gone) return `<p class="tdm-muted tdm-rec-gone">🗑 ${L('فایل صوتی حذف شد؛ تحلیل آن ذخیره است.', 'Audio gelöscht – die Analyse bleibt gespeichert.', 'Audio deleted – its analysis is kept.')}</p>`;
    return `<audio controls ${attrs} src="${E(rec.local ? rec.playback_url : simRecordingPlayback(rec))}"></audio>`;
  }
  function analysed(w, key) { const r = w.ai?.['sp_' + key], rec = w.rec?.[key]; return !!(r && !r.error && rec?.id && (!r.recId || r.recId === rec.id)); }
  // finished exercise: delete every uploaded take whose analysis is stored (unanalysed ones are removed by the server after a day)
  function dropAnalysedAudio(w) {
    Object.entries(w?.rec || {}).forEach(([key, rec]) => {
      if (!rec || rec.gone || rec.local || !rec.id || !analysed(w, key)) return;
      dropRecording(rec); w.rec[key] = { id: rec.id, secs: rec.secs, at: rec.at, gone: true };
    });
  }
  // delete replaced takes once the exercise is finished (never one that is still referenced)
  function flushRecTrash(w) {
    const trash = Array.isArray(w?.recTrash) ? w.recTrash : []; if (!trash.length) return;
    const live = new Set(Object.values(w.rec || {}).map((r) => r?.id).filter(Boolean));
    trash.filter((id) => !live.has(id)).forEach((id) => dropRecording({ id }));
    w.recTrash = [];
  }
  // a replaced take is garbage: free a local blob URL, delete an uploaded file (only that exact recording)
  function dropRecording(rec) {
    if (!rec) return;
    if (rec.local) { try { URL.revokeObjectURL(rec.playback_url); } catch (e) { /* ignore */ } return; }
    if (rec.id && /^[0-9a-f]{32}$/.test(rec.id) && typeof apiRequest === 'function') apiRequest('/speaking/recordings/' + rec.id, { method: 'DELETE' }).catch((e) => console.warn('old recording not deleted', e));
  }
  function recorderHtml(key, opts = {}) {
    const w = work(), rec = w.rec[key], active = R.rec?.state === 'recording' && R.key === key;
    const limit = opts.limit || 0;
    return `<div class="tdm-recorder ${active ? 'is-rec' : ''}">
      <div class="tdm-rec-dot">${iconSvg('microphone')}</div>
      <div class="tdm-rec-main"><b>${E(opts.label || L('ضبط صدا', 'Aufnahme'))}</b>
        <span id="${active ? 'tdmRecClock' : ''}" class="tdm-mono">${active ? '00:00' : rec ? L('ذخیره شد', 'Gespeichert') + ` · ${mmss(rec.secs || 0)}` : limit ? L('زمان پیشنهادی', 'Sprechzeit') + ' ' + mmss(limit) : ''}</span></div>
      ${active ? `<button class="tdm-btn danger" onclick="TDM.recStop()">■ ${L('توقف', 'Stopp')}</button>` : (R.status === 'saving' || R.status === 'starting') && R.key === key ? `<button class="tdm-btn" disabled>${R.status === 'starting' ? L('آماده‌سازی میکروفون…', 'Mikrofon wird vorbereitet …', 'Preparing microphone …') : '…'}</button>` : `<button class="tdm-btn primary" onclick="TDM.recStart('${key}',${limit})">● ${rec ? L('ضبط دوباره', 'Neu aufnehmen') : L('شروع ضبط', 'Aufnahme starten')}</button>`}
      ${recAudio(rec, 'preload="none"')}
    </div>`;
  }

  // ───────────── shared UI pieces ─────────────
  function alertBox(msg) { if (typeof showGlassAlarm === 'function') showGlassAlarm(msg, { type: 'error', source: 'tdm' }); else window.alert(msg); }
  function frame(a, d, steps, i, body, opts = {}) {
    const mod = MODS[a.id], w = work(), last = i === steps.length - 1, st = steps[i];
    const rv = !!S.tdmReview;
    const modeTag = (rv ? `<span class="tdm-tag review">👁 ${L('مرور پاسخ‌ها · فقط مشاهده', 'Rückblick · nur ansehen', 'Review · read only')}</span>` : '') + (d.mode === 'eval' ? `<span class="tdm-tag eval">${L('ارزیابی جمعه', 'Wochentest')}</span>` : d.mode === 'exam' ? `<span class="tdm-tag exam">${L('حالت آزمون', 'Prüfungsmodus')}</span>` : '');
    return `<div class="tdm tdm-activity ${rv ? 'tdm-review' : ''}" data-learning-content style="--mod:var(--app-accent,${mod.color})">
      <header class="tdm-top">
        <button class="tdm-back" onclick="${rv ? 'TDM.reviewClose()' : 'pauseActivity()'}">← ${E(examPlanLabel())}</button>
        <div class="tdm-top-title"><span class="tdm-ico">${iconSvg(mod.icon)}</span><div><h1>${E(a.title)} ${modeTag}</h1><span id="actTimer" class="tdm-mono">${timeStr(S.activityTimers?.[a.id] || 0)}</span></div></div>
        <span class="tdm-top-count">${faNum(i + 1)}/${faNum(steps.length)}</span>
      </header>
      <nav class="tdm-steps" aria-label="Schritte">${steps.map((s, n) => `<button class="${n === i ? 'is-cur' : n < i ? 'is-done' : ''}" onclick="TDM.go(${n})"><b>${faNum(n + 1)}</b><span>${DE(s.de)}</span><small>${faNum(s.min)}′</small></button>`).join('')}</nav>
      <section class="tdm-card tdm-stephead">
        <div><p class="tdm-kicker">${L('مرحله', 'Schritt')} ${faNum(i + 1)} · ${faNum(st.min)} ${L('دقیقه', 'Min.')}</p><h2>${DE(st.de)}</h2>${rtl(E(st.fa), 'tdm-sub')}</div>
        ${opts.countdown && !rv ? `<div class="tdm-countdown"><small>${L('زمان باقی‌مانده', 'Restzeit')}</small><b id="tdmCountdown" ${opts.countdown.auto ? `data-auto="${opts.countdown.auto}"` : ''}>${mmss(st.min * 60 - (w.secs[i] || 0))}</b></div>` : `<div class="tdm-stepclock"><span id="tdmStepClock" class="tdm-mono">${mmss(w.secs[i] || 0)} / ${mmss(st.min * 60)}</span><div class="tdm-stepbar"><i id="tdmStepBar" style="width:${clamp((w.secs[i] || 0) / (st.min * 60) * 100, 0, 100)}%"></i></div></div>`}
      </section>
      ${aiOn() && aiDown() ? `<section class="tdm-card tdm-ai-down" role="status">${rtl(`<p>🛟 <b>${E(L('تحلیل هوشمند موقتاً در دسترس نیست.', 'Die KI-Analyse ist vorübergehend nicht verfügbar.', 'AI analysis is temporarily unavailable.'))}</b> ${E(L('خودارزیابی، پاسخ‌های نمونه و معیارهای نمره‌دهی فعال است و کارت ذخیره می‌شود؛ تحلیل بعداً خودکار انجام می‌شود.', 'Selbstkontrolle, Musterlösungen und Bewertungskriterien bleiben verfügbar; deine Arbeit wird gespeichert und die Analyse später automatisch nachgeholt.', 'Self-check, model answers and rubrics stay available; your work is saved and the analysis runs automatically later.'))}</p>`)}</section>` : ''}
      ${body}
      <footer class="tdm-nav">
        ${i > 0 ? `<button class="tdm-btn" onclick="TDM.go(${i - 1})">← ${L('مرحله قبل', 'Zurück')}</button>` : '<span></span>'}
        ${last ? (rv ? `<button class="tdm-btn primary big" onclick="TDM.reviewClose()">✓ ${L('بازگشت به داشبورد', 'Zurück zum Dashboard', 'Back to dashboard')}</button>` : `<button class="tdm-btn success big" onclick="TDM.finish()">✓ ${L('پایان و ثبت نتیجه', 'Abschließen & speichern')}</button>`) : `<button class="tdm-btn primary big" onclick="TDM.go(${i + 1})">${L('مرحله بعد', 'Weiter')} →</button>`}
      </footer>
    </div>`;
  }
  const card = (inner, cls = '') => `<section class="tdm-card ${cls}">${inner}</section>`;
  const ta = (key, ph, rows = 3, extra = '') => `<textarea dir="auto" rows="${rows}" class="tdm-input" placeholder="${E(ph)}" oninput="TDM.f('${key}',this.value)${extra}">${E(work().f[key] || '')}</textarea>`;
  const inp = (key, ph) => `<input dir="auto" class="tdm-input" placeholder="${E(ph)}" value="${E(work().f[key] || '')}" oninput="TDM.f('${key}',this.value)">`;
  /* tdm-tutor-help-v1 */
  // Tutor help: a sample answer opens once the learner has really tried; before that a press-and-hold bar opens it early.
  const GATES = {
    hglobal: () => ({ keys: ['g_thema', 'g_problem', 'g_ziel'], min: 4, why: L('اول به هر سه سؤال جواب بده، حتی کوتاه و ناقص.', 'Beantworte zuerst alle drei Fragen – auch kurz.', 'Answer all three questions first, even briefly.') }),
    hsel: () => ({ keys: ['s_zahlen', 's_gruende', 's_vorteile', 's_nachteile', 's_beispiele', 's_schlussfolgerungen'], need: 3, min: 2, why: L('اول دست‌کم سه بخش را با کلیدواژه پر کن.', 'Fülle zuerst mindestens drei Felder mit Stichwörtern.', 'Fill at least three boxes with keywords first.') }),
    hsum: () => ({ rec: ['zusammenfassung'], keys: ['summary_notes'], min: 25, why: L('اول بازگویی‌ات را ضبط کن یا چند جمله بنویس.', 'Nimm zuerst deine Zusammenfassung auf oder schreib ein paar Sätze.', 'Record your summary or write a few sentences first.') }),
    lsum: () => ({ keys: ['summary'], min: 15, why: L('اول خلاصه یک‌خطی خودت را بنویس.', 'Schreib zuerst deine eigene Zusammenfassung.', 'Write your own one-line summary first.') }),
    xsum: () => ({ keys: ['x_summary'], min: 15, why: L('اول خلاصه خودت را بنویس.', 'Schreib zuerst deine eigene Zusammenfassung.', 'Write your own summary first.') }),
    smodel: () => { const d = curDay(), n = Math.round((d.picks?.schreiben?.kind === 'grafik' ? 100 : mwOf(d)) * 0.6); return { words: n, why: L(`اول دست‌کم ${faNum(n)} کلمه از متن خودت را بنویس؛ بعد متن نمونه برای مقایسه باز می‌شود.`, `Schreib zuerst mindestens ${n} Wörter.`, `Write at least ${n} words of your own text first.`) }; },
    sana: () => ({ keys: ['a_problem', 'a_vorteile', 'a_nachteile', 'a_betroffene', 'a_meinung'], need: 3, min: 3, why: L('اول دست‌کم سه بخش تحلیل را خودت پر کن.', 'Fülle zuerst mindestens drei Felder selbst aus.', 'Fill at least three analysis boxes yourself first.') }),
    gana: () => ({ keys: ['g_titel', 'g_maxmin', 'g_trend', 'g_text', 'g_vergleich'], need: 3, min: 3, why: L('اول دست‌کم سه مرحله تحلیل نمودار را خودت بنویس.', 'Bearbeite zuerst mindestens drei Schritte selbst.', 'Do at least three steps yourself first.') }),
    sout: () => ({ keys: ['o_einleitung', 'o_hauptteil', 'o_gegen', 'o_meinung', 'o_schluss'], need: 3, min: 3, why: L('اول دست‌کم سه بخش طرح را با کلیدواژه پر کن.', 'Fülle zuerst mindestens drei Teile der Gliederung aus.', 'Fill at least three parts of the outline first.') }),
    sphelp: (t) => ({ keys: ['kw_' + t], min: 8, why: L('اول کلیدواژه‌های خودت را بنویس؛ اگر چیزی به ذهنت نرسید، کمک را باز کن.', 'Notiere zuerst eigene Stichwörter.', 'Note your own keywords first.') }),
    spmodel: (t) => ({ rec: ['try1_' + t], why: L('اول اجرای اولت را ضبط کن؛ بعد پاسخ نمونه برای مقایسه باز می‌شود.', 'Nimm zuerst deinen ersten Versuch auf.', 'Record your first attempt first.') }),
    exmodel: (t) => ({ rec: ['exam_' + t, 'eval_' + t], why: L('اول پاسخت را ضبط کن.', 'Nimm zuerst deine Antwort auf.', 'Record your answer first.') }),
    wmodel: () => ({ rec: ['wiedergabe'], keys: ['wiedergabe'], min: 25, why: L('اول بازگویی را ضبط کن یا بنویس.', 'Gib die Inhalte zuerst selbst wieder.', 'Retell the content yourself first.') })
  };
  function gateFor(id) { const m = String(id).match(/^([a-z]+?)(\d*)$/), g = m && GATES[m[1]]; return g ? g(Number(m[2]) || 0) : null; }
  function gateOk(g) {
    if (!g) return true;
    const w = work(), f = w.f || {}, len = (k) => String(f[k] || '').trim().length;
    if (g.rec && g.rec.some((k) => w.rec?.[k])) return true;
    if (g.words && wordsIn(f.text) >= g.words) return true;
    if (g.keys && g.keys.filter((k) => len(k) >= (g.min || 3)).length >= (g.need || (g.rec ? 1 : g.keys.length))) return true;
    return false;
  }
  const HOLD_MS = 1400;
  function holdBtn(target, label) { return `<button type="button" class="tdm-hold" data-hold="${E(target)}" onpointerdown="TDM.holdStart(this,event)" onpointerup="TDM.holdStop(this)" onpointerleave="TDM.holdStop(this)" onpointercancel="TDM.holdStop(this)" onkeydown="if((event.key==='Enter'||event.key===' ')&&!event.repeat){event.preventDefault();TDM.holdStart(this,event)}" onkeyup="TDM.holdStop(this)" oncontextmenu="return false"><i aria-hidden="true"></i><span>${E(label || L('گیر کردی؟ برای دیدن زودتر، این نوار را نگه دار', 'Festgefahren? Zum früheren Öffnen gedrückt halten', 'Stuck? Press and hold to open early'))}</span></button>`; }
  TDM.holdStart = function (el, ev) { if (!el || el._ht) return; el.classList.add('is-holding'); el._ht = setTimeout(() => { el._ht = null; el.classList.remove('is-holding'); TDM.unlock(el.dataset.hold); }, HOLD_MS); };
  TDM.holdStop = function (el) { if (!el) return; clearTimeout(el._ht); el._ht = null; el.classList.remove('is-holding'); };
  TDM.unlock = function (target) {
    const w = work(); w.help = w.help || {};
    const t = String(target || ''), i = t.indexOf(':'), kind = t.slice(0, i), id = t.slice(i + 1);
    if (kind === 'rv') { w.checked['r_' + id] = true; if (!w.help[id]) w.help[id] = 'peek'; }
    else if (kind === 'qh') { w.help['q:' + id] = 'hint'; }
    saveData(); render();
  };
  function reveal(id, label, inner) {
    const w = work(), open = !!w.checked['r_' + id], g = gateFor(id);
    /*HELP-CLICK*/ if (!open && g && !gateOk(g)) return `<div class="tdm-reveal"><button class="tdm-btn ghost" onclick="TDM.unlock('rv:${id}')">▼ ${E(label)}</button></div>`;
    return `<div class="tdm-reveal ${open ? 'is-open' : ''}"><button class="tdm-btn ghost" onclick="TDM.toggleReveal('${id}')">${open ? '▲' : '▼'} ${E(label)}</button>${open ? `<div class="tdm-reveal-body">${inner}</div>` : ''}</div>`;
  }
  // per-question hint: where to look (Lesen paragraph / Hören time) + a strategy tip; never the answer itself
  function hoerenSeg(it, ev) {
    if (!it?.segments?.length || !ev) return -1;
    const tok = (x) => new Set(String(x).toLowerCase().match(/[a-zäöüß0-9]{3,}/g) || []), e = tok(ev);
    let best = -1, bs = 0;
    it.segments.forEach((sg, n) => { const t = tok(sg.text); let c = 0; e.forEach((x) => { if (t.has(x)) c++; }); if (c > bs) { bs = c; best = n; } });
    return bs >= 2 ? best : -1;
  }
  function qHint(set, q) {
    const tips = {
      mc: L('گزینه‌هایی را که در متن نیامده یا با آن تناقض دارند اول حذف کن؛ عدد یا کلمه تکراری در گزینه اغلب دام است.', 'Streiche zuerst Optionen, die nicht im Text stehen; gleiche Wörter sind oft eine Falle.', 'Rule out options that are not in the text first; repeated words are often a trap.'),
      match: L('برای هر مورد دنبال هم‌معنی کلمات کلیدی بگرد، نه همان کلمه.', 'Suche Synonyme der Schlüsselwörter, nicht dasselbe Wort.', 'Look for synonyms of the key words, not the same word.'),
      rf: L('فقط چیزی درست است که متن دقیقاً همان را بگوید؛ «تقریباً» درست یعنی Falsch.', 'Richtig nur, wenn der Text genau das sagt.', 'Only “Richtig” if the text says exactly that.'),
      jnt: L('«Text sagt dazu nichts» یعنی متن درباره‌اش اصلاً چیزی نگفته؛ اگر خلافش را گفته، جواب Nein است.', '„Text sagt dazu nichts“ = keine Information; Gegenteil = Nein.', '“Not in the text” means no information at all; the opposite means “Nein”.'),
      short: L('فقط کلیدواژه بنویس (۱ تا ۴ کلمه)، نه جمله کامل.', 'Nur Stichwörter (1–4 Wörter).', 'Keywords only (1–4 words).')
    };
    let where = '';
    if (set === 'l' && q.paragraph) where = L(`جواب در پاراگراف ${faNum(q.paragraph)} است. همان پاراگراف را دوباره و دقیق بخوان.`, `Die Antwort steht in Absatz ${q.paragraph}.`, `The answer is in paragraph ${q.paragraph}.`);
    if (set === 'h') { const it = currentHoerenItem(), n = hoerenSeg(it, q.evidence), sg = n >= 0 ? it.segments[n] : null; if (sg) where = `${L(`جواب حدود دقیقه ${mmss(sg.t0)} است.`, `Die Antwort kommt bei etwa ${mmss(sg.t0)}.`, `The answer comes at about ${mmss(sg.t0)}.`)} <button type="button" class="tdm-chip-btn" onclick="TDM.playSeg(${n})">▶ ${L('همین بخش را دوباره بشنو', 'Diese Stelle anhören', 'Play this part')}</button>`; }
    return `${where ? `<p>${where}</p>` : ''}<p class="tdm-muted">${E(tips[q.type] || tips.mc)}</p>`;
  }

  TDM.toggleReveal = function (id) { const w = work(); w.checked['r_' + id] = !w.checked['r_' + id]; saveData(); render(); };
  function ruleBox(text) { return `<aside class="tdm-rule">${rtl('💡 ' + E(text))}</aside>`; }
  function selfCheck(key, labelFa, fault) { /*SELF-FAULT*/ const v = work().self[key]; return `<div class="tdm-self${fault ? ' is-fault' : ''}">${rtl(E(labelFa))}<div><button class="${v === true ? 'is-yes' : ''}" onclick="TDM.self('${key}',true,this)">✓</button><button class="${v === false ? 'is-no' : ''}" onclick="TDM.self('${key}',false,this)">✗</button></div></div>`; }
  TDM.self = function (key, val, el) { work().self[key] = val; scheduleSave(); const box = el?.parentElement; if (box) { box.children[0].className = val === true ? 'is-yes' : ''; box.children[1].className = val === false ? 'is-no' : ''; } };
  function rating(key, label, hint) { const v = Number(work().rate[key]) || 0; return `<div class="tdm-rating"><div><b>${E(label)}</b>${hint ? rtl(E(hint), 'tdm-muted') : ''}</div><div class="tdm-stars">${[1, 2, 3, 4, 5].map((n) => `<button class="${n <= v ? 'on' : ''}" onclick="TDM.rate('${key}',${n},this)">${n}</button>`).join('')}</div></div>`; }
  TDM.rate = function (key, n, el) { work().rate[key] = n; scheduleSave(); const box = el?.parentElement; if (box) [...box.children].forEach((b, i) => b.classList.toggle('on', i < n)); };

  // ───────────── questions ─────────────
  const JNT = [['ja', 'Ja'], ['nein', 'Nein'], ['nicht im text', 'Text sagt dazu nichts']];
  function isCorrect(q, a) {
    if (a === undefined || a === null || a === '') return false;
    if (q.type === 'mc' || q.type === 'match') return Number(a) === Number(q.answer);
    if (q.type === 'rf') return String(a) === String(q.answer);
    if (q.type === 'jnt') return String(a) === String(q.answer);
    if (q.type === 'gap') { const n = (x) => String(x || '').trim().toLowerCase().replace(/ß/g, 'ss').replace(/[^a-zäöü]/g, ''); return n(a) !== '' && arr(q.answer).some((x) => n(x) === n(a)); }
    return false;
  }
  function qScore(set, qs) {
    const w = work(); let correct = 0, total = 0;
    qs.forEach((q) => { total++; const a = w.ans[set + ':' + q.id]; if (q.type === 'short' ? w.self['short:' + set + ':' + q.id] === true : isCorrect(q, a)) correct++; });
    return { correct, total, pct: total ? Math.round(correct / total * 100) : 0 };
  }
  function correctLabel(q) {
    if (q.type === 'mc' || q.type === 'match') return q.options[q.answer];
    if (q.type === 'rf') return q.answer ? 'Richtig' : 'Falsch';
    if (q.type === 'jnt') return (JNT.find((x) => x[0] === q.answer) || [])[1] || q.answer;
    if (q.type === 'gap') return arr(q.answer).join(' / ');
    return q.answer;
  }
  function answerLabel(q, a) {
    if (a === undefined || a === null || a === '') return '—';
    if (q.type === 'mc' || q.type === 'match') return q.options[Number(a)] ?? '—';
    if (q.type === 'rf') return String(a) === 'true' ? 'Richtig' : 'Falsch';
    if (q.type === 'jnt') return (JNT.find((x) => x[0] === a) || [])[1] || a;
    return a;
  }
  TDM.ans = function (set, qid, val, el) {
    const w = work(); if (w.checked[set]) return; w.ans[set + ':' + qid] = val; scheduleSave();
    const box = el?.closest('[data-q]'); if (box) box.querySelectorAll('[data-opt]').forEach((b) => b.classList.toggle('is-sel', b.dataset.opt === String(val)));
  };
  TDM.ansText = function (set, qid, val) { const w = work(); if (w.checked[set]) return; w.ans[set + ':' + qid] = val; scheduleSave(); };
  TDM.check = async function (set, auto) {
    const w = work(); if (w.checked[set]) return;
    const qs = questionsFor(set); if (!qs) return;
    const unanswered = qs.filter((q) => q.type !== 'short' && (w.ans[set + ':' + q.id] === undefined)).length;
    if (unanswered && !auto && !await appConfirm(L(`${faNum(unanswered)} سؤال بی‌پاسخ است. ارزیابی شود؟`, `${unanswered} Fragen sind unbeantwortet. Trotzdem auswerten?`))) return;
    w.checked[set] = true; w.checkedAt = w.checkedAt || {}; w.checkedAt[set] = Date.now();
    const secsPer = Math.max(20, Math.round((w.secs[w.step || 0] || 60) / Math.max(1, qs.length)));
    const skill = act().id;
    qs.forEach((q) => { if (q.type === 'short') return; recordAnswerPerformance({ skill, questionId: `tdm-${dayKey()}-${set}-${q.id}`, accuracy: isCorrect(q, w.ans[set + ':' + q.id]) ? 100 : 0, expectedSeconds: 60, actualSeconds: secsPer }); });
    saveData(); render();
  };
  function questionsFor(set) {
    const d = curDay();
    if (set === 'h') return trimQs(currentHoerenItem()?.questions) || null;
    if (set === 'l') return trimQs(item('lesen', d.picks?.lesen)?.questions) || null;
    return null;
  }
  function renderQuestions(set, qs, opts = {}) {
    const w = work(), checked = !!w.checked[set];
    const list = qs.map((q, n) => {
      const key = set + ':' + q.id, a = w.ans[key], ok = checked && q.type !== 'short' && isCorrect(q, a);
      let control = '';
      if (q.type === 'mc' || q.type === 'match') control = `<div class="tdm-opts">${q.options.map((o, oi) => `<button data-opt="${oi}" class="${String(a) === String(oi) ? 'is-sel' : ''} ${checked && oi === q.answer ? 'is-right' : ''} ${checked && String(a) === String(oi) && oi !== q.answer ? 'is-wrong' : ''}" onclick="TDM.ans('${set}','${q.id}',${oi},this)"><b>${String.fromCharCode(65 + oi)}</b><span>${E(o)}</span></button>`).join('')}</div>`;
      else if (q.type === 'rf') control = `<div class="tdm-opts row">${[['true', 'Richtig'], ['false', 'Falsch']].map(([v, l]) => `<button data-opt="${v}" class="${String(a) === v ? 'is-sel' : ''} ${checked && String(q.answer) === v ? 'is-right' : ''} ${checked && String(a) === v && String(q.answer) !== v ? 'is-wrong' : ''}" onclick="TDM.ans('${set}','${q.id}','${v}',this)">${l}</button>`).join('')}</div>`;
      else if (q.type === 'jnt') control = `<div class="tdm-opts row">${JNT.map(([v, l]) => `<button data-opt="${v}" class="${a === v ? 'is-sel' : ''} ${checked && q.answer === v ? 'is-right' : ''} ${checked && a === v && q.answer !== v ? 'is-wrong' : ''}" onclick="TDM.ans('${set}','${q.id}','${v}',this)">${l}</button>`).join('')}</div>`;
      else if (q.type === 'gap') control = `<input dir="ltr" class="tdm-input tdm-gap" ${checked ? 'disabled' : ''} placeholder="ein Wort …" autocomplete="off" autocapitalize="off" spellcheck="false" value="${E(a || '')}" oninput="TDM.ansText('${set}','${q.id}',this.value)">`;
      else control = `<input dir="ltr" class="tdm-input" ${checked ? 'disabled' : ''} placeholder="Stichwörter …" value="${E(a || '')}" oninput="TDM.ansText('${set}','${q.id}',this.value)">${checked ? `<div class="tdm-model">✓ ${E(q.answer)}</div>${selfCheck('short:' + key, 'آیا پاسخ من از نظر مفهوم درست بود؟')}` : ''}`;
      const fb = checked && q.type !== 'short' ? `<div class="tdm-qfb ${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + L('درست', 'Richtig') : '✗ ' + L('پاسخ درست', 'Richtig wäre') + ': <b dir="ltr">' + E(correctLabel(q)) + '</b>'}</div>` : '';
      /*PQA-MODEL*/ const qaId = 'sa:' + set + ':' + q.id, qaOpen = !!w.checked['r_' + qaId];
      const model = !checked ? `<div class="tdm-reveal ${qaOpen ? 'is-open' : ''}"><button class="tdm-btn ghost" onclick="TDM.toggleReveal('${qaId}')">${qaOpen ? '▲' : '▼'} ${L('پاسخ نمونه', 'Musterlösung', 'Model answer')}</button>${qaOpen ? `<div class="tdm-reveal-body"><p dir="ltr"><b>${E(correctLabel(q))}</b></p>${q.evidence ? `<p dir="ltr" class="tdm-muted">„${E(q.evidence)}“</p>` : ''}${q.explain_fa ? rtl(E(q.explain_fa), 'tdm-muted') : ''}</div>` : ''}</div>` : '';
      const hk = 'q:' + set + ':' + q.id, hinted = w.help?.[hk] === 'hint', hintOn = !checked && opts.hints !== false && curDay().mode === 'normal';
      const hint = hintOn ? (hinted ? `<div class="tdm-qhint" dir="${isFa() ? 'rtl' : 'ltr'}">💡 ${qHint(set, q)}</div>` : `<button type="button" class="tdm-hold tdm-hintbtn" onclick="TDM.unlock('qh:${E(set + ':' + q.id)}')"><span>${L('💡 راهنمای کوچک', '💡 Tipp', '💡 Hint')}</span></button>` /*HELP-CLICK*/) : checked && hinted ? `<small class="tdm-peek">💡 ${L('با راهنما', 'mit Tipp', 'with hint')}</small>` : '';
      const ex = checked && opts.explain !== false ? `<div class="tdm-evidence">${q.evidence ? `<p dir="ltr">„${E(q.evidence)}“${q.paragraph ? ` <small>(${L('پاراگراف', 'Absatz')} ${q.paragraph})</small>` : ''}</p>` : ''}${q.explain_fa ? rtl(E(q.explain_fa), 'tdm-muted') : ''}</div>` : '';
      return `<article class="tdm-q ${checked ? (q.type === 'short' ? '' : ok ? 'ok' : 'bad') : ''}" data-q="${q.id}"><p class="tdm-qn">${faNum(n + 1)}</p><div class="tdm-qb"><h4 dir="ltr">${E(q.q)}</h4>${control}${model}${hint}${fb}${ex}</div></article>`;
    }).join('');
    const sc = checked ? qScore(set, qs) : null;
    return `<div class="tdm-questions">${list}</div>${checked ? `<div class="tdm-score"><b>${faNum(sc.pct)}%</b><span>${faNum(sc.correct)} / ${faNum(sc.total)} ${L('درست', 'richtig')}</span></div>` : `<button class="tdm-btn primary big wide" onclick="TDM.check('${set}')">${L('ارزیابی پاسخ‌ها', 'Antworten auswerten')}</button>`}`;
  }

  // ───────────── error categorisation ─────────────
  const CATS = {
    hoeren: [['wortschatz', 'Wortschatz', 'واژگان: کلمه را تشخیص ندادم'], ['verstaendnis', 'Verständnis', 'درک مفهوم: کلمات را شناختم اما معنی جمله را نفهمیدم'], ['grammatik', 'Grammatik', 'گرامر: ساختار یا ارتباط اجزا را اشتباه فهمیدم']],
    lesen: [['wortschatz', 'Wortschatz', 'واژگان'], ['argumentation', 'Argumentation', 'درک استدلال'], ['details', 'Details', 'جزئیات'], ['eile', 'Unachtsamkeit', 'بی‌دقتی و عجله'], ['grammatik', 'Grammatik/Satzbau', 'گرامر و ساختار جمله']],
    schreiben: [['grammatik', 'Grammatik', 'گرامر'], ['wortschatz', 'Wortschatz', 'واژگان'], ['konnektoren', 'Konnektoren', 'حروف ربط'], ['struktur', 'Struktur', 'ساختار'], ['aufgabe', 'Aufgabenbezug', 'ارتباط با موضوع']],
    sprechen: [['pausen', 'Lange Pausen', 'مکث‌های طولانی'], ['wiederholung', 'Wortwiederholungen', 'تکرار کلمات'], ['verbposition', 'Verbposition', 'اشتباه در جایگاه فعل'], ['unvollstaendig', 'Unvollständige Sätze', 'جملات ناقص'], ['fortsetzung', 'Diskussion nicht fortgesetzt', 'ناتوانی در ادامه بحث']]
  };
  TDM.CATS = CATS;
  function catChips(skill, key) { const cur = work().cat[key]; return `<div class="tdm-chips">${CATS[skill].map(([id, de, fa]) => `<button class="${cur === id ? 'is-sel' : ''}" title="${E(fa)}" onclick="TDM.setCat('${key}','${id}',this)">${DE(de)}<small dir="rtl">${E(fa.split(':')[0])}</small></button>`).join('')}</div>`; }
  TDM.setCat = function (key, id, el) { const w = work(); w.cat[key] = w.cat[key] === id ? null : id; scheduleSave(); el?.parentElement?.querySelectorAll('button').forEach((b) => b.classList.remove('is-sel')); if (w.cat[key]) el?.classList.add('is-sel'); };
  const catLabel = (skill, id) => (CATS[skill]?.find((c) => c[0] === id) || [null, 'Unkategorisiert'])[1];

  function logErrors(id, d, w) {
    const m = M(), add = (skill, cat, entry) => {
      const type = cat === 'grammatik' ? 'grammatik' : cat === 'wortschatz' ? 'wortschatz' : skill;
      rememberLearningError({ type, category: `${MODS[skill]?.de || skill} · ${catLabel(skill, cat)}`, question: entry.question || '', userAnswer: entry.userAnswer || '', correctAnswer: entry.correctAnswer || '', explanation: entry.explanation || '', context: entry.context || '', qtype: entry.qtype || '' /*REVIEW-FILTER*/, source: 'tdm', sourceKey: `tdm:${d.date}:${id}:${entry.key}` });
      m.log.push({ date: d.date, week: d.week, skill, cat: cat || 'none' });
    };
    if (id === 'hoeren' || id === 'lesen') {
      const set = id === 'hoeren' ? 'h' : 'l', qs = questionsFor(set) || [], qa = w.ai?.[set === 'h' ? 'hq' : 'lq'], why = new Map((qa?.items || []).map((x) => [x.id, x]));
      if (w.checked[set]) qs.forEach((q) => { const a = w.ans[set + ':' + q.id]; const wrong = q.type === 'short' ? w.self['short:' + set + ':' + q.id] === false : !isCorrect(q, a); if (wrong) { const x = why.get(q.id); add(id, w.cat['q:' + q.id] || x?.category || null, { key: q.id, qtype: q.type, question: q.q, userAnswer: answerLabel(q, a), correctAnswer: correctLabel(q), explanation: [x?.why_fa || q.explain_fa || '', x?.tip_fa ? '💡 ' + x.tip_fa : ''].filter(Boolean).join(' '), context: q.evidence || '' }); } });
      (qa?.extra || []).forEach((e, n) => add(id, e.category || null, { key: 'extra' + n, question: L('جمله دشوار متن', 'Schwieriger Satz'), userAnswer: '', correctAnswer: e.sentence, explanation: e.explanation_fa || '', context: '' }));
      (w.extraErrors || []).forEach((x) => { if (!x.text) return; const r = w.ai?.['sx_' + x.id]; add(id, x.cat || r?.category || null, { key: x.id, question: x.text, correctAnswer: r?.meaning_fa || x.note || '', explanation: r ? [r.grammar_fa, r.tip_fa].filter(Boolean).join(' · ') : x.note || '', context: L('جمله نامفهوم', 'Unverständlicher Satz') }); });
    }
    if (id === 'schreiben') for (let r = 0; r < 3; r++) { const wrong = w.f['fp_wrong_' + r], right = w.f['fp_right_' + r]; if (wrong || right) add('schreiben', w.cat['fp_' + r] || 'grammatik', { key: 'fp' + r, question: L('اشتباه نوشتاری', 'Schreibfehler'), userAnswer: wrong || '', correctAnswer: right || '', explanation: w.f['fp_why_' + r] || '' }); }
    if (id === 'sprechen') {
      Object.entries(w.self).forEach(([k, v]) => { if (k.startsWith('sp:') && v === true) { const [, t, cat] = k.split(':'); add('sprechen', cat, { key: `${t}-${cat}`, qtype: w.f['an_note_' + t] ? '' : 'selfcheck' /*REVIEW-FILTER2*/, question: L('مشکل در صحبت', 'Sprechproblem') + ': ' + catLabel('sprechen', cat), correctAnswer: w.f['an_note_' + t] || '', explanation: CATS.sprechen.find((c) => c[0] === cat)?.[2] || '' }); } });
      // concrete language errors the AI found in the recordings
      Object.entries(w.ai || {}).forEach(([slot, r]) => { if (!slot.startsWith('sp_') || slot === 'sp_zusammenfassung' || !Array.isArray(r?.errors)) return; r.errors.slice(0, 3).forEach((e, n) => add('sprechen', 'verbposition', { key: `${slot}-${n}`, question: L('اشتباه گفتاری', 'Sprechfehler'), userAnswer: e.wrong, correctAnswer: e.right, explanation: e.reason_fa || '' })); });
    }
  }

  // ───────────── results ─────────────
  function avgRate(w, prefix, keys) { const v = keys.map((k) => Number(w.rate[prefix + k]) || 0).filter(Boolean); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length * 20) : null; }
  // analysed mistakes: categorised wrong answers + AI-explained difficult sentences + own explained sentences
  function analysedCount(w) {
    const qa = w.ai?.lq || w.ai?.hq;
    return Object.keys(w.cat).filter((k) => k.startsWith('q:') && w.cat[k]).length + (qa?.extra || []).length + (w.extraErrors || []).filter((x) => x.text && (x.cat || w.ai?.['sx_' + x.id]?.meaning_fa)).length;
  }
  function computeResults(id, d, w) {
    if (id === 'hoeren') { const qs = currentHoerenItem()?.questions || []; const sc = w.checked.h ? qScore('h', qs) : null; return { pct: sc?.pct ?? null, correct: sc?.correct, total: sc?.total, understanding: Number(w.f.understanding) || null, plays: w.plays || 0, summary: !!w.rec?.zusammenfassung }; }
    if (id === 'lesen') { const qs = item('lesen', d.picks?.lesen)?.questions || []; const sc = w.checked.l ? qScore('l', qs) : null; const analysed = analysedCount(w); return { pct: sc?.pct ?? null, correct: sc?.correct, total: sc?.total, analysed, summary: w.f.summary || '' }; }
    if (id === 'schreiben') { const text = w.f.text || ''; const score = avgRate(w, 'k_', ['grammatik', 'wortschatz', 'konnektoren', 'struktur', 'aufgabe']); if (score != null) recordAnswerPerformance({ skill: 'schreiben', questionId: `tdm-${d.date}-schreiben`, accuracy: score, expectedSeconds: 1500, actualSeconds: Math.max(60, w.secs.reduce((s, x) => s + (x || 0), 0)) }); return { score, words: wordsIn(text), kind: d.picks?.schreiben?.kind, itemId: d.picks?.schreiben?.id, text: text.slice(0, 6000) }; }
    if (id === 'sprechen') { const n = spList(d).length || 1, scores = []; for (let t = 0; t < n; t++) { const s = avgRate(w, `s${t}_`, ['fluss', 'genau', 'struktur', 'aufgabe']); if (s != null) scores.push(s); } const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null; if (score != null) recordAnswerPerformance({ skill: 'sprechen', questionId: `tdm-${d.date}-sprechen`, accuracy: score, expectedSeconds: 900, actualSeconds: Math.max(60, w.secs.reduce((s, x) => s + (x || 0), 0)) }); return { score, recordings: Object.keys(w.rec).length, issues: Object.entries(w.self).filter(([k, v]) => k.startsWith('sp:') && v === true).length }; }
    if (id === 'wortschatz') return { words: (dayWords(d) || []).length, sentences: [0, 1, 2, 3, 4].filter((i) => (w.f['satz_' + i] || '').trim()).length };
    if (id === 'wiederholung') { const t = w.quiz; return { reviewed: Object.keys(w.ans).length, quiz: t?.done ? t.pct : null }; }
    if (id === 'fehleranalyse') return { top: w.f.top || [], weak: w.f.weak || '' };
    if (id === 'wochenbericht') return { saved: !!M().weekly['W' + d.week] };
    if (id === 'extra') return { sentences: Object.keys(w.f).filter((k) => /^sx_/.test(k) && String(w.f[k] || '').trim()).length, cards: 0, minutes: Number(act()?.dur) || 0 }; /*EXTRA-SATZ*/
    return {};
  }

  // ───────────── AI analysis (premium accounts; Groq via backend) ─────────────
  // Analysis steps run automatically once their input exists. Results live in work.ai[slot]; a failure stores
  // {error} so the step falls back to the manual tools and offers a retry instead of looping.
  const BUSY = new Set();
  const busyKey = (slot) => `${dayKey()}:${act()?.id}:${slot}`;
  const aiBusy = (slot) => BUSY.has(busyKey(slot));
  const aiOn = () => typeof hasPremiumAccess !== 'function' || hasPremiumAccess();
  /*AIFB*/ // AI fallback: client timeout, cause-specific messages, automatic retry queue, shared "AI down" window
  const AI_TIMEOUT = { text: 70000, speaking: 140000 };   // backend: 55 s text budget (Groq → NVIDIA), 70 s transcription
  const RETRY_STEPS = [60, 180, 600];   // seconds between automatic retries (then manual only)
  const RETRY_MAX = 4;
  let AI_DOWN_UNTIL = 0, aiStatusChecked = false;
  const RETRY_T = {};
  const aiDown = () => Date.now() < AI_DOWN_UNTIL;
  function aiCause(e) {
    if (e?.status === 403) return 'premium';
    if (e?.status === 429) return 'quota';
    if (e?.timeout || e?.name === 'AbortError') return 'timeout';
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
    if (e?.code === 'ai_unavailable' || e?.status === 503 || e?.status === 502 || e?.status === 504) return 'down';
    if (!e?.status) return 'offline';
    return 'down';
  }
  function aiErrorText(e) {
    const c = typeof e === 'string' ? e : aiCause(e);
    if (c === 'premium') return L('تحلیل هوشمند فقط برای حساب‌های Premium فعال است.', 'Nur für Premium-Konten verfügbar.', 'Only available for Premium accounts.');
    if (c === 'quota') return L('سقف روزانه تحلیل هوشمند پر شده است؛ فردا دوباره فعال می‌شود.', 'Tageslimit erreicht – morgen wieder verfügbar.', 'Daily limit reached – available again tomorrow.');
    if (c === 'offline') return L('اتصال اینترنت برقرار نیست؛ کارت ذخیره شده و بعد از وصل شدن، تحلیل خودکار انجام می‌شود.', 'Keine Internetverbindung – deine Arbeit ist gespeichert, die Analyse folgt automatisch.', 'No internet connection – your work is saved; the analysis will run automatically later.');
    if (c === 'timeout') return L('پاسخ هوش مصنوعی خیلی دیر رسید.', 'Die KI hat zu lange gebraucht.', 'The AI took too long to answer.');
    return L('تحلیل هوشمند موقتاً در دسترس نیست (سرویس هوش مصنوعی شلوغ یا قطع است).', 'Die KI-Analyse ist vorübergehend nicht verfügbar.', 'AI analysis is temporarily unavailable.');
  }
  function aiQueue(w) { w.aiq = w.aiq || {}; return w.aiq; }
  function noteFailure(w, slot, e) {
    const cause = aiCause(e), q = aiQueue(w), prev = q[slot] || { tries: 0 };
    const tries = prev.tries + 1, auto = !['premium', 'quota'].includes(cause) && tries < RETRY_MAX;
    let wait = RETRY_STEPS[Math.min(tries - 1, RETRY_STEPS.length - 1)];
    const ra = Number(e?.details?.retry_after) || 0;
    if (cause === 'down' && ra && e?.code !== 'asr_unavailable') { AI_DOWN_UNTIL = Math.max(AI_DOWN_UNTIL, Date.now() + ra * 1000); wait = Math.max(wait, ra + 3); }
    q[slot] = { tries, cause, retryAt: auto ? Date.now() + wait * 1000 : 0 };
    return { error: aiErrorText(cause), cause, at: new Date().toISOString() };
  }
  const retryDue = (w, slot) => { const q = (w.aiq || {})[slot]; return !!(q && q.retryAt && Date.now() >= q.retryAt && !aiDown()); };
  function armRetry(w, slot) {
    const q = (w.aiq || {})[slot]; if (!q?.retryAt) return;
    const k = busyKey(slot); if (RETRY_T[k]) return;
    const ms = Math.max(1000, Math.max(q.retryAt, AI_DOWN_UNTIL) - Date.now() + 800);
    RETRY_T[k] = setTimeout(() => { delete RETRY_T[k]; if (S.screen === 'methodActivity') render(); }, Math.min(ms, 2147483000));
  }
  function retryNote(slot) {
    const q = (work().aiq || {})[slot]; if (!q) return '';
    if (!q.retryAt) return q.tries >= RETRY_MAX ? L('تلاش خودکار متوقف شد؛ هر وقت خواستی «تلاش دوباره» را بزن.', 'Automatische Versuche beendet – du kannst es jederzeit erneut versuchen.', 'Automatic retries stopped – you can retry any time.') : '';
    const min = Math.max(1, Math.round((Math.max(q.retryAt, AI_DOWN_UNTIL) - Date.now()) / 60000));
    return L(`حدود ${faNum(min)} دقیقه دیگر خودکار دوباره امتحان می‌شود (اگر در همین صفحه باشی یا بعداً برگردی).`, `Neuer automatischer Versuch in etwa ${min} Min.`, `Automatic retry in about ${min} min.`);
  }
  function checkAiStatus() {
    if (aiStatusChecked || typeof apiRequest !== 'function') return; aiStatusChecked = true;
    const ctl = typeof AbortController === 'function' ? new AbortController() : null; const tm = setTimeout(() => ctl?.abort(), 6000);
    apiRequest('/method/ai-status', { signal: ctl?.signal }).then((s) => { if (s?.state === 'down' && s.retry_after) { AI_DOWN_UNTIL = Date.now() + s.retry_after * 1000; if (S.screen === 'methodActivity') render(); } }).catch(() => {}).finally(() => clearTimeout(tm));
  }
  if (typeof window !== 'undefined') window.addEventListener('online', () => {
    AI_DOWN_UNTIL = 0;
    try { const q = work()?.aiq || {}; Object.values(q).forEach((x) => { if (x.retryAt && ['offline', 'timeout'].includes(x.cause)) x.retryAt = Date.now(); }); } catch (e) { /* no activity open */ }
    if (S.screen === 'methodActivity') render();
  });
  TDM.aiHealth = () => ({ downFor: Math.max(0, Math.round((AI_DOWN_UNTIL - Date.now()) / 1000)) });
  async function aiCall(slot, path, body, onDone) {
    if (PROG()) body = { ...body, exam: PROG().examName() };
    body = { ...body, level: userLevel() }; /*LEVEL-ADAPT*/
    const a = act(), w = work(), key = busyKey(slot);
    if (BUSY.has(key)) return;
    w.ai = w.ai || {};
    if (aiDown()) { w.ai[slot] = noteFailure(w, slot, { status: 503, code: 'ai_unavailable' }); armRetry(w, slot); saveData(); if (S.screen === 'methodActivity' && act()?.id === a?.id) render(); return; }
    BUSY.add(key); render();
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const limit = path.includes('speaking') ? AI_TIMEOUT.speaking : AI_TIMEOUT.text;
    let timer = null;
    try {
      const r = await Promise.race([apiRequest(path, { method: 'POST', body: JSON.stringify(body), signal: ctl?.signal }),
        new Promise((_, rej) => { timer = setTimeout(() => { try { ctl?.abort(); } catch (x) { /* ignore */ } rej(Object.assign(new Error('timeout'), { timeout: true })); }, limit); })]);
      r.at = new Date().toISOString(); w.ai[slot] = r; if (w.aiq) delete w.aiq[slot];
      if (onDone) onDone(r, w);
    } catch (e) { console.warn('AI analysis failed', slot, e); w.ai[slot] = noteFailure(w, slot, e); armRetry(w, slot); }
    clearTimeout(timer);
    BUSY.delete(key); saveData();
    if (S.screen === 'methodActivity' && act()?.id === a?.id) render();
  }
  function autoAI(slot, run) {
    if (S.tdmReview) return;
    const w = work(); w.ai = w.ai || {};
    if (!aiOn() || aiBusy(slot)) return;
    checkAiStatus();
    const r = w.ai[slot];
    if (r && !(r.error && retryDue(w, slot))) { if (r.error) armRetry(w, slot); return; }
    setTimeout(() => { const wk = work(), cur = (wk.ai || {})[slot]; if (aiBusy(slot) || (cur && !(cur.error && retryDue(wk, slot)))) return; if (cur) delete wk.ai[slot]; run(); }, 0);
  }
  TDM.aiRetry = function (slot) { const w = work(); if (w.ai) delete w.ai[slot]; saveData(); render(); };
  const aiBtn = (slot, onclick, label) => aiBusy(slot) ? `<button class="tdm-btn ghost" disabled><span class="tdm-spin-sm"></span> ${L('در حال تحلیل…', 'Analyse läuft …')}</button>` : `<button class="tdm-btn ghost" onclick="${onclick}">🤖 ${E(label)}</button>`;
  const aiLoading = (text) => `<div class="tdm-ai-loading"><span class="tdm-spin-sm"></span><span dir="auto">${E(text)}</span></div>`;
  const aiFailed = (slot, r, manualHint) => `<div class="tdm-ai-fail">${rtl(`<p class="tdm-warn">${E(r.error)}</p>${manualHint ? `<p class="tdm-muted">${E(manualHint)}</p>` : ''}${retryNote(slot) ? `<p class="tdm-muted">⏳ ${E(retryNote(slot))}</p>` : ''}`)}<button class="tdm-btn ghost" onclick="TDM.aiRetry('${slot}')">↻ ${L('تلاش دوباره', 'Erneut versuchen')}</button></div>`;
  function aiState(slot) { const r = (work().ai || {})[slot]; return aiBusy(slot) ? 'busy' : !r ? 'none' : r.error ? 'error' : 'done'; }

  function applyWriting(r, w) {
    Object.entries(r.scores || {}).forEach(([k, v]) => { if (!w.rate['k_' + k]) w.rate['k_' + k] = v; });
    (r.errors || []).slice(0, 3).forEach((e) => {
      const n = [0, 1, 2].find((x) => !w.f['fp_wrong_' + x] && !w.f['fp_right_' + x]); if (n === undefined) return;
      w.f['fp_wrong_' + n] = e.wrong; w.f['fp_right_' + n] = e.right; w.f['fp_why_' + n] = e.reason_fa; w.cat['fp_' + n] = e.category;
    });
    r.words = wordsIn(w.f.text);
  }
  TDM.aiWriting = function () {
    const d = curDay(), pk = d.picks?.schreiben, it = pk && item(pk.kind, pk.id), w = work();
    if (!it || wordsIn(w.f.text) < 20) { alertBox(L('برای تحلیل، ابتدا متن (حداقل ۲۰ کلمه) را بنویس.', 'Bitte zuerst mindestens 20 Wörter schreiben.')); return; }
    if (w.ai?.writing) delete w.ai.writing;
    aiCall('writing', '/method/writing-feedback', { task: [it.situation, it.task].filter(Boolean).join(' ').slice(0, 3900), text: w.f.text.slice(0, 8900), kind: it.format || pk.kind, min_words: pk.kind === 'grafik' ? 100 : mwOf(d) }, applyWriting);
  };
  // key = recording slot (try1_0, try2_0, exam_1, zusammenfassung); t = speaking task index or -1 for the Hören summary
  TDM.aiSpeaking = function (key, t) {
    const w = work(), rec = w.rec[key], d = curDay(), it = t >= 0 ? (d.mode === 'normal' ? speakTask(d, t) : item('sprechen', (d.picks?.sprechen || [])[t])) : currentHoerenItem();
    if (!rec || rec.local || !rec.id || rec.gone) { alertBox(L('ابتدا باید ضبط روی سرور ذخیره شده باشد.', 'Die Aufnahme muss zuerst gespeichert sein.')); return; }
    const body = t >= 0 ? { recording_id: rec.id, task: [it?.situation, it?.task].filter(Boolean).join(' ').slice(0, 2900), task_type: it?.typeLabel || '' }
      : { recording_id: rec.id, task: 'Mündliche Zusammenfassung des Hörtextes: ' + (it?.title || ''), task_type: 'Zusammenfassung', reference: [it?.summary_model, it?.global?.thema, it?.global?.problem, it?.global?.ziel].filter(Boolean).join('\n').slice(0, 3900) };
    if (w.ai?.['sp_' + key]) delete w.ai['sp_' + key];
    aiCall('sp_' + key, '/method/speaking-feedback', body, (r, wk) => {
      r.recId = rec.id;
      if (t < 0) return;
      if (!key.startsWith('try2')) Object.entries(r.issues || {}).forEach(([cat, v]) => { wk.self[`sp:${t}:${cat}`] = !!v; });
      if (key.startsWith('try2') || key.startsWith('exam')) Object.entries(r.scores || {}).forEach(([k, v]) => { wk.rate[`s${t}_${k}`] = v; });
    });
  };
  // stale when the learner recorded again after the analysis
  function speakAuto(key, t) {
    const w = work(), rec = w.rec[key], r = w.ai?.['sp_' + key];
    if (!rec || rec.local || !rec.id || rec.gone) return;
    if (r && !r.error && r.recId && r.recId !== rec.id) delete w.ai['sp_' + key];
    autoAI('sp_' + key, () => TDM.aiSpeaking(key, t));
  }
  TDM.aiSentences = function () {
    const w = work(), d = curDay(), s = [0, 1, 2, 3, 4].map((n) => (w.f['satz_' + n] || '').trim()).filter(Boolean);
    if (!s.length) { alertBox(L('ابتدا جمله‌ها را بنویس.', 'Bitte zuerst Sätze schreiben.')); return; }
    aiCall('saetze', '/method/sentences-feedback', { sentences: s, grammar: grammarOfWeek(d.week).title });
  };
  TDM.aiToProtocol = function (i) {
    const w = work(), e = w.ai?.writing?.errors?.[i]; if (!e) return;
    const r = [0, 1, 2].find((n) => !w.f['fp_wrong_' + n] && !w.f['fp_right_' + n]);
    if (r === undefined) { alertBox(L('هر سه ردیف Fehlerprotokoll پر است.', 'Das Fehlerprotokoll ist voll.')); return; }
    w.f['fp_wrong_' + r] = e.wrong; w.f['fp_right_' + r] = e.right; w.f['fp_why_' + r] = e.reason_fa; w.cat['fp_' + r] = e.category; saveData(); render();
  };
  TDM.aiApplySpeaking = function (key, t) {
    const w = work(), r = w.ai?.['sp_' + key]; if (!r?.issues) return;
    Object.entries(r.issues).forEach(([cat, v]) => { w.self[`sp:${t}:${cat}`] = !!v; });
    if (r.scores) Object.entries(r.scores).forEach(([k, v]) => { if (!w.rate[`s${t}_${k}`]) w.rate[`s${t}_${k}`] = v; });
    saveData(); render();
  };
  function aiWritingHtml() {
    if (!aiOn()) return '';
    const w = work(), st = aiState('writing'), r = w.ai?.writing;
    const head = `<div class="tdm-ai-head">${rtl('<h4>🤖 تصحیح هوشمند متن تو</h4>')}${st === 'done' ? aiBtn('writing', 'TDM.aiWriting()', L('تحلیل دوباره', 'Erneut analysieren')) : ''}</div>`;
    if (st === 'busy') return card(head + aiLoading(L('متن در حال تصحیح است…', 'Dein Text wird korrigiert …')), 'tdm-ai');
    if (st === 'none') return card(head + (wordsIn(w.f.text) < 20 ? rtl('<p class="tdm-muted">برای تصحیح خودکار، اول در مرحله «Schreiben» متن را بنویس (حداقل ۲۰ کلمه).</p>') : aiLoading(L('در حال آماده‌سازی…', 'Wird vorbereitet …'))), 'tdm-ai');
    if (st === 'error') return card(head + aiFailed('writing', r, L('تا آن موقع نمره‌ها و Fehlerprotokoll را خودت پر کن.', 'Bewerte dann selbst und fülle das Fehlerprotokoll aus.')), 'tdm-ai');
    const labels = { grammatik: 'Grammatik', wortschatz: 'Wortschatz', konnektoren: 'Konnektoren', struktur: 'Struktur', aufgabe: 'Aufgabenbezug' };
    const changed = r.words && Math.abs(wordsIn(w.f.text) - r.words) > 5;
    return card(head + `${changed ? rtl(`<p class="tdm-warn">${L('متن بعد از تحلیل تغییر کرده است؛ برای نتیجه جدید «تحلیل دوباره» را بزن.', '')}</p>`) : ''}<div class="tdm-ai-scores">${Object.entries(r.scores || {}).map(([k, v]) => `<div><small>${labels[k] || k}</small><b>${faNum(v)}/۵</b></div>`).join('')}<div class="tdm-ai-tdn"><small>${L('تخمین سطح', 'Einschätzung')}</small><b dir="ltr">${E(r.tdn)}</b></div></div>
      ${rtl(`<p>${E(r.summary_fa)}</p>`)}
      ${(r.errors || []).length ? `<h4 dir="auto">${L('اشتباهات مهم (سه مورد اول خودکار در Fehlerprotokoll ثبت شد)', 'Wichtige Fehler')}</h4><div class="tdm-ai-errors">${r.errors.map((e, i) => `<div><p dir="ltr"><s>${E(e.wrong)}</s> → <b>${E(e.right)}</b> <small>${E(labels[e.category] || '')}</small></p>${rtl(`<p class="tdm-muted">${E(e.reason_fa)}</p>`)}${i >= 3 ? `<button class="tdm-btn ghost" onclick="TDM.aiToProtocol(${i})">＋ Fehlerprotokoll</button>` : ''}</div>`).join('')}</div>` : ''}
      ${(r.improved || []).length ? `<h4 dir="auto">${L('جمله‌های بهتر', 'Bessere Formulierungen')}</h4>${r.improved.map((x) => `<p dir="ltr"><span class="tdm-muted">${E(x.original)}</span><br>→ <b>${E(x.better)}</b></p>`).join('')}` : ''}
      ${r.tip_fa ? `<aside class="tdm-rule">${rtl('💡 ' + E(r.tip_fa))}</aside>` : ''}`, 'tdm-ai');
  }
  const SP_NAMES = { pausen: 'Lange Pausen', wiederholung: 'Wortwiederholungen', verbposition: 'Verbposition', unvollstaendig: 'Unvollständige Sätze', fortsetzung: 'Diskussion nicht fortgesetzt' };
  const SC_NAMES = { fluss: 'Flüssigkeit', genau: 'Genauigkeit', struktur: 'Struktur', aufgabe: 'Aufgabe' };
  // automatic transcription + analysis of one recording; t = task index (-1 = Hören summary)
  function aiSpeakingHtml(key, t, opts = {}) {
    const w = work(), rec = w.rec[key];
    if (!rec || !aiOn()) return '';
    if (rec.local || !rec.id) return rtl(`<p class="tdm-warn">${L('این ضبط فقط روی همین دستگاه ذخیره شد (اتصال به سرور برقرار نبود)؛ تحلیل خودکار ممکن نیست.', '')}</p>`);
    if (rec.gone && !w.ai?.['sp_' + key]) return '';
    if (!opts.noAuto && !rec.gone) speakAuto(key, t);
    const st = aiState('sp_' + key), r = w.ai?.['sp_' + key];
    const head = `<div class="tdm-ai-head">${rtl(`<h4>🤖 ${E(opts.title || L('تحلیل خودکار صدای تو', 'Automatische Analyse'))}</h4>`)}${st === 'done' && !rec.gone ? aiBtn('sp_' + key, `TDM.aiSpeaking('${key}',${t})`, L('تحلیل دوباره', 'Erneut')) : ''}</div>`;
    if (st === 'busy' || st === 'none') return head + aiLoading(L('در حال تبدیل صدا به متن و تحلیل…', 'Transkription und Analyse …'));
    if (st === 'error') return head + aiFailed('sp_' + key, r, opts.manualHint || '');
    const sc = r.summary_check;
    return head + `<div class="tdm-ai-scores"><div><small>${L('مدت', 'Dauer')}</small><b>${faNum(Math.round(r.duration || 0))}s</b></div><div><small>${L('کلمه در دقیقه', 'Wörter/Min.')}</small><b>${r.wpm == null ? '—' : faNum(r.wpm)}</b></div><div><small>${L('مکث طولانی', 'Lange Pausen')}</small><b>${faNum(r.long_pauses || 0)}</b></div>${Object.entries(r.scores || {}).map(([k, v]) => `<div><small>${SC_NAMES[k] || k}</small><b>${faNum(v)}/۵</b></div>`).join('')}</div>
      ${sc ? `<div class="tdm-sumcheck">${[['thema', 'موضوع را درست فهمیدم'], ['reihenfolge', 'ترتیب اطلاعات حفظ شد'], ['eigene_worte', 'با جملات خودم بیان کردم']].map(([k, fa]) => `<div class="${sc[k] ? 'ok' : 'bad'}">${sc[k] ? '✓' : '✗'} <span dir="rtl">${fa}</span></div>`).join('')}${(sc.missing || []).length ? `<p dir="ltr" class="tdm-muted"><b>${L('جاافتاده', 'Fehlt')}:</b> ${E(sc.missing.join(' · '))}</p>` : ''}</div>` : ''}
      <div class="tdm-ai-transcript" dir="ltr"><small>Transkript</small><p>${E(r.transcript)}</p></div>
      ${t >= 0 ? `<div class="tdm-chips">${Object.entries(r.issues || {}).filter(([, v]) => v).map(([k]) => `<span class="tdm-issue">${E(SP_NAMES[k] || k)}</span>`).join('') || `<span class="tdm-issue ok">✓ ${L('مشکل مهمی دیده نشد', 'Keine größeren Probleme')}</span>`}</div>` : ''}
      ${rtl(`<p>${E(r.summary_fa)}</p>`)}
      ${(r.errors || []).map((e) => `<p dir="ltr"><s>${E(e.wrong)}</s> → <b>${E(e.right)}</b></p>${rtl(`<p class="tdm-muted">${E(e.reason_fa)}</p>`)}`).join('')}
      ${r.better_version ? `<div class="tdm-reveal-body" dir="ltr"><small>${L('نسخه بهتر', 'Bessere Version')}</small><p>${E(r.better_version)}</p></div>` : ''}`;
  }

  // listening / reading: analysis of wrong answers (+ difficult sentences when there were few mistakes)
  function wrongQuestions(set, qs) { const w = work(); return qs.filter((q) => (q.type === 'short' ? w.self['short:' + set + ':' + q.id] === false : !isCorrect(q, w.ans[set + ':' + q.id]))); }
  function sourceText(set, it) {
    return set === 'h' ? it.segments.map((s) => `${it.speakers[s.s]?.name || ''}: ${s.text}`).join('\n') : it.paragraphs.map((p, n) => `[${n + 1}] ${p.heading ? p.heading + ': ' : ''}${p.text}`).join('\n');
  }
  function runQA(set) {
    const d = curDay(), skill = set === 'h' ? 'hoeren' : 'lesen', it = set === 'h' ? currentHoerenItem() : item('lesen', d.picks?.lesen); if (!it) return;
    const w = work(), wrong = wrongQuestions(set, it.questions || []);
    const items = wrong.map((q) => ({ id: q.id, question: q.q, options: Array.isArray(q.options) ? q.options.map(String) : q.type === 'rf' ? ['Richtig', 'Falsch'] : q.type === 'jnt' ? ['Ja', 'Nein', 'Text sagt dazu nichts'] : [], user_answer: String(answerLabel(q, w.ans[set + ':' + q.id]) || ''), correct_answer: String(correctLabel(q) || ''), evidence: q.evidence || '' }));
    const extra = set === 'l' ? Math.max(0, 3 - wrong.length) : 0;
    if (!items.length && !extra) { w.ai = w.ai || {}; w.ai[set === 'h' ? 'hq' : 'lq'] = { items: [], extra: [], overview_fa: '' }; return; }
    aiCall(set === 'h' ? 'hq' : 'lq', '/method/questions-analysis', { skill, title: it.title, text: sourceText(set, it).slice(0, 8900), items, extra_needed: extra }, (r, wk) => {
      (r.items || []).forEach((x) => { if (!wk.cat['q:' + x.id]) wk.cat['q:' + x.id] = x.category; });
    });
  }
  function qaHtml(set, skill, wrong) {
    const w = work(), slot = set === 'h' ? 'hq' : 'lq', st = aiState(slot), r = w.ai?.[slot];
    if (w.checked[set]) autoAI(slot, () => runQA(set));
    const byId = new Map((r?.items || []).map((x) => [x.id, x]));
    const manual = !aiOn() || st !== 'done';
    const cards = wrong.map((q) => {
      const x = byId.get(q.id);
      return `<div class="tdm-errrow"><p dir="ltr"><b>${E(q.q)}</b><br><span class="tdm-muted">✗ ${E(answerLabel(q, w.ans[set + ':' + q.id]))} · ✓ ${E(correctLabel(q))}</span></p>
        ${q.evidence ? `<p class="tdm-evq" dir="ltr">„${E(q.evidence)}“</p>` : ''}
        ${x ? `<div class="tdm-ai-why">${rtl(`<p>🤖 ${E(x.why_fa)}</p>${x.tip_fa ? `<p class="tdm-muted">💡 ${E(x.tip_fa)}</p>` : ''}`)}${(x.keywords || []).length ? `<div class="tdm-vmini" dir="ltr">${x.keywords.map((k) => `<span><b>${E(k.de)}</b><small dir="rtl">${E(k.fa)}</small></span>`).join('')}</div>` : ''}</div>` : (q.explain_fa ? rtl(E(q.explain_fa), 'tdm-muted') : '')}
        ${x || manual ? catChips(skill, 'q:' + q.id) : ''}</div>`;
    }).join('');
    const extras = (r?.extra || []).map((e) => `<div class="tdm-errrow"><p class="tdm-evq" dir="ltr">„${E(e.sentence)}“</p><div class="tdm-ai-why">${rtl(`<p>🤖 ${E(e.explanation_fa)}</p>`)}</div><span class="tdm-issue">${DE(catLabel(skill, e.category))}</span></div>`).join('');
    const status = st === 'busy' || (st === 'none' && aiOn() && w.checked[set]) ? aiLoading(L('هوش مصنوعی در حال تحلیل اشتباه‌هاست…', 'Die KI analysiert deine Fehler …')) : st === 'error' ? aiFailed(slot, r, L('تا آن موقع خودت برای هر اشتباه یک دسته انتخاب کن.', 'Ordne die Fehler bis dahin selbst zu.')) : '';
    const head = rtl(`<h4>${wrong.length ? `تحلیل اشتباهات (${faNum(wrong.length)})` : '🎉 همه پاسخ‌ها درست بود'}</h4>${r?.overview_fa ? `<p>${E(r.overview_fa)}</p>` : x0(wrong, st)}`);
    return card(head + status + cards + (extras ? rtl('<h4>جمله‌های دشوار متن (برای تکمیل سه مورد تحلیل)</h4>') + extras : ''));
  }
  const x0 = (wrong, st) => (wrong.length && st === 'done' ? '<p class="tdm-muted">دسته‌بندی‌ها خودکار انجام شد؛ اگر لازم بود عوضشان کن.</p>' : '');

  // unclear sentences (Hören "?" button / own entries): explained automatically
  TDM.explainExtra = function (i) {
    const w = work(), x = w.extraErrors?.[i]; if (!x || !x.text || x.text.trim().length < 3) return;
    const skill = act().id === 'lesen' ? 'lesen' : 'hoeren', it = skill === 'hoeren' ? currentHoerenItem() : item('lesen', curDay().picks?.lesen);
    if (w.ai?.['sx_' + x.id]) delete w.ai['sx_' + x.id];
    aiCall('sx_' + x.id, '/method/sentence-explain', { sentence: x.text.slice(0, 690), context: it?.title || '', skill }, (r, wk) => {
      const y = (wk.extraErrors || []).find((e) => e.id === x.id); if (!y) return;
      if (!y.cat) y.cat = r.category;
      if (!y.note) y.note = r.meaning_fa;
    });
  };
  function aiSentencesHtml() {
    const w = work(), r = w.ai?.saetze;
    const head = `<div class="tdm-ai-head">${rtl('<p class="tdm-muted">بعد از نوشتن جمله‌ها می‌توانی آن‌ها را به‌صورت خودکار بررسی کنی.</p>')}${aiBtn('saetze', 'TDM.aiSentences()', L('بررسی جمله‌ها', 'Sätze prüfen'))}</div>`;
    if (!r) return head;
    if (r.error) return head + rtl(`<p class="tdm-warn">${E(r.error)}</p><p class="tdm-muted">${E(L('تا آن موقع جمله‌ها را با قاعده و مثال گرامر هفته خودت مقایسه کن؛ بعداً دوباره دکمه «بررسی جمله‌ها» را بزن.', 'Vergleiche deine Sätze bis dahin selbst mit der Regel der Woche und versuche es später erneut.', 'Compare your sentences with this week’s grammar rule yourself and try again later.'))}</p>`);
    return head + `<div class="tdm-ai-errors">${(r.results || []).map((x, n) => `<div class="${x.ok ? 'ok' : 'bad'}"><p dir="ltr">${faNum(n + 1)}. ${x.ok ? '✓' : '✗'} <b>${E(x.corrected)}</b>${x.uses_grammar ? ' <small>· Grammatik der Woche ✓</small>' : ''}</p>${x.reason_fa ? rtl(`<p class="tdm-muted">${E(x.reason_fa)}</p>`) : ''}</div>`).join('')}</div>`;
  }

  // ═════════════ MODULE RENDERERS ═════════════
  TDM.renderActivity = function () {
    const a = act(); if (!a) return '';
    if (!CT()) { TDM.ensureContent().then(() => render()).catch(() => {}); return `<div class="tdm tdm-loading" data-learning-content><div class="tdm-spinner"></div><p>${L('در حال بارگذاری محتوای برنامه…', 'Inhalte werden geladen …')}</p><button class="tdm-btn" onclick="pauseActivity()">← ${L('بازگشت', 'Zurück')}</button></div>`; }
    const d = ensureDay(dayKey()), w = work(a.id), steps = stepsFor(a.id, d.mode, d), i = clamp(w.step || 0, 0, steps.length - 1);
    ensureTick();
    const r = { hoeren: renderHoeren, lesen: renderLesen, schreiben: renderSchreiben, sprechen: renderSprechen, wortschatz: renderWortschatz, wiederholung: renderWiederholung, fehleranalyse: renderFehleranalyse, wochenbericht: renderWochenbericht, extra: renderExtra }[a.id];
    return r ? r(a, d, w, steps, i) : '';
  };

  // ---------- Hören ----------
  function transcriptHtml(it, highlight = new Set(), opts = {}) {
    const names = it.speakers.map((s) => s.name);
    wordTimes(it);
    const words = (txt) => { let out = '', re = /\S+/g, m, last = 0; while ((m = re.exec(txt))) { out += E(txt.slice(last, m.index)) + `<span class="tdm-w" data-c0="${m.index}" data-c1="${m.index + m[0].length}">${E(m[0])}</span>`; last = m.index + m[0].length; } return out + E(txt.slice(last)); };
    return `<div class="tdm-transcript" data-item="${E(it.id || '')}">${it.segments.map((s, n) => `<p data-seg="${n}" data-t0="${s.t0 ?? 0}" data-t1="${s.t1 ?? 0}" data-len="${(s.text || '').length}" class="${highlight.has(n) ? 'is-evidence' : ''}"><button class="tdm-segplay" onclick="TDM.playSeg(${n})" title="Play">▶</button><b>${E(names[s.s] || s.speaker || '')}:</b> <span dir="ltr">${words(s.text || '')}</span>${opts.mark ? `<button class="tdm-segmark" onclick="TDM.addExtraError(${n})" title="${E(L('این جمله را نفهمیدم', 'Nicht verstanden'))}">?</button>` : ''}</p>`).join('')}</div>`;
  }
  function evidenceSegments(it, qs, onlyWrong) {
    const w = work(), set = new Set();
    qs.forEach((q) => { if (!q.evidence) return; if (onlyWrong && isCorrect(q, w.ans['h:' + q.id])) return; const ev = q.evidence.toLowerCase().slice(0, 60); it.segments.forEach((s, n) => { if (s.text.toLowerCase().includes(ev.slice(0, 40))) set.add(n); }); });
    return set;
  }
  TDM.addExtraError = function (n) {
    const it = currentHoerenItem() || null, w = work();
    w.extraErrors = w.extraErrors || [];
    const text = act().id === 'hoeren' ? it?.segments?.[n]?.text : '';
    w.extraErrors.push({ id: 'x' + uid(), text: text || '', cat: null, note: '' });
    saveData(); render();
    if (text && aiOn()) TDM.explainExtra(w.extraErrors.length - 1);
  };
  TDM.extraErr = function (i, field, value) { const w = work(); if (!w.extraErrors?.[i]) return; w.extraErrors[i][field] = value; scheduleSave(); };
  TDM.extraErrCat = function (i, cat, el) { const w = work(); const x = w.extraErrors?.[i]; if (!x) return; x.cat = x.cat === cat ? null : cat; scheduleSave(); el?.parentElement?.querySelectorAll('button').forEach((b) => b.classList.remove('is-sel')); if (x.cat) el?.classList.add('is-sel'); };
  TDM.removeExtraErr = function (i) { const w = work(); w.extraErrors?.splice(i, 1); saveData(); render(); };
  function extraErrorsHtml(skill, withText = true) {
    const w = work(), list = w.extraErrors || [];
    return `<div class="tdm-extra">${list.map((x, i) => {
      const slot = 'sx_' + x.id, st = aiState(slot), r = w.ai?.[slot];
      if (st === 'error' && x.text && aiOn()) autoAI(slot, () => TDM.explainExtra(i));
      const ai = st === 'busy' ? aiLoading(L('در حال توضیح جمله…', 'Satz wird erklärt …')) : st === 'error' ? aiFailed(slot, r, '') : st === 'done' ? `<div class="tdm-ai-why">${rtl(`<p>🤖 <b>${E(r.meaning_fa)}</b></p><p class="tdm-muted">${E(r.grammar_fa)}</p>${r.tip_fa ? `<p class="tdm-muted">💡 ${E(r.tip_fa)}</p>` : ''}`)}${(r.vocab || []).length ? `<div class="tdm-vmini" dir="ltr">${r.vocab.map((v) => `<span><b>${E(v.de)}</b><small dir="rtl">${E(v.fa)}</small></span>`).join('')}</div>` : ''}</div>` : aiOn() && x.text ? aiBtn(slot, `TDM.explainExtra(${i})`, L('توضیح این جمله', 'Satz erklären')) : '';
      return `<div class="tdm-extra-row">${withText ? `<textarea dir="ltr" rows="2" class="tdm-input" placeholder="${E(L('جمله یا عبارت مشکل‌دار', 'Schwieriger Satz'))}" oninput="TDM.extraErr(${i},'text',this.value)">${E(x.text)}</textarea>` : ''}
      ${ai}
      <div class="tdm-chips">${CATS[skill].map(([id, de, fa]) => `<button class="${x.cat === id ? 'is-sel' : ''}" title="${E(fa)}" onclick="TDM.extraErrCat(${i},'${id}',this)">${DE(de)}<small dir="rtl">${E(fa.split(':')[0])}</small></button>`).join('')}</div>
      ${st === 'done' ? '' : `<input dir="auto" class="tdm-input" placeholder="${E(L('توضیح / ساختار درست / معنی', 'Notiz: Bedeutung, Struktur, Korrektur'))}" value="${E(x.note)}" oninput="TDM.extraErr(${i},'note',this.value)">`}
      <button class="tdm-x" onclick="TDM.removeExtraErr(${i})">×</button></div>`;
    }).join('')}
      <button class="tdm-btn ghost" onclick="TDM.addExtraError(-1)">＋ ${L('افزودن جمله دیگر', 'Weiteren Satz hinzufügen')}</button></div>`;
  }
  function renderHoeren(a, d, w, steps, i) {
    const it = currentHoerenItem(); if (!it) return frame(a, d, steps, i, card(L('محتوا یافت نشد.', 'Kein Inhalt gefunden.')));
    const key = steps[i].key, qs = it.questions || [], M_ = ST.methods.hoeren;
    const head = card(`<div class="tdm-item-head"><span class="tdm-pill">${E(it.formatLabel)}</span><h3 dir="ltr">${E(it.title)}</h3><p class="tdm-muted" dir="ltr">${E(it.speakers.map((s) => s.name).join(' · '))}</p></div>`, 'tdm-compact');
    let body = '';
    if (key === 'global') body = head + card(playerHtml(it)) + card(`${rtl(`<h4 dir="auto">${L('بدون متن و زیرنویس یک بار گوش بده و به سه سؤال پاسخ بده:', 'Einmal ohne Text hören und drei Fragen beantworten:')}</h4>`)}
        <label class="tdm-label" dir="auto">${L('موضوع اصلی چیست؟', 'Was ist das Hauptthema?')}</label>${ta('g_thema', 'Das Hauptthema ist …', 2)}
        <label class="tdm-label" dir="auto">${L('مسئله مطرح‌شده چیست؟', 'Welches Problem wird besprochen?')}</label>${ta('g_problem', 'Das Problem besteht darin, dass …', 2)}
        <label class="tdm-label" dir="auto">${L('هدف گوینده چیست؟', 'Was ist das Ziel der Sprecher?')}</label>${ta('g_ziel', 'Die Sprecher wollen …', 2)}
        ${reveal('hglobal', L('مقایسه با پاسخ نمونه', 'Mit Musterlösung vergleichen'), `<ul class="tdm-list" dir="ltr"><li><b>Thema:</b> ${E(it.global.thema)}</li><li><b>Problem:</b> ${E(it.global.problem)}</li><li><b>Ziel:</b> ${E(it.global.ziel)}</li></ul>${selfCheck('g_ok', 'آیا موضوع، مسئله و هدف را درست فهمیدم؟')}`)}`);
    else if (key === 'selektiv') {
      const fields = [['zahlen', 'Zahlen', 'اعداد'], ['gruende', 'Gründe', 'دلایل'], ['vorteile', 'Vorteile', 'مزایا'], ['nachteile', 'Nachteile', 'معایب'], ['beispiele', 'Beispiele', 'مثال‌ها'], ['schlussfolgerungen', 'Schlussfolgerungen', 'نتیجه‌گیری‌ها']];
      body = head + card(playerHtml(it)) + card(`${rtl(`<h4 dir="auto">${L('بار دوم گوش بده و اطلاعات مهم را فقط به‌صورت کلیدواژه یادداشت کن (نه جمله کامل):', 'Zweites Hören: nur Stichwörter notieren.')}</h4>`)}
        <div class="tdm-grid2">${fields.map(([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${ta('s_' + k, '…', 2)}</label>`).join('')}</div>
        ${reveal('hsel', L('کلیدواژه‌های نمونه', 'Muster-Stichwörter'), `<div class="tdm-grid2" dir="ltr">${fields.map(([k, de]) => `<div class="tdm-mini"><b>${de}</b><p>${E(arr(it.selektiv?.[k]).join(' · ') || '—')}</p></div>`).join('')}</div>`)}`)
        + card(`<h4 dir="auto">${L('سؤالات (به سبک آزمون)', 'Aufgaben im Prüfungsformat', 'Tasks in exam format')}</h4>${renderQuestions('h', qs)}`);
    } else if (key === 'pruefung') {
      const checked = !!w.checked.h;
      body = head + card(rtl(`<p>${d.mode === 'eval' ? 'آزمون هفتگی: ' : ''}${L('مثل آزمون: فایل را حداکثر دو بار بشنو و در همان زمان به سؤال‌ها پاسخ بده. با پایان زمان، پاسخ‌ها خودکار ارزیابی می‌شوند.', '')}</p>`)) + card(playerHtml(it, { exam: !checked })) + card(renderQuestions('h', qs, { explain: true }));
      return frame(a, d, steps, i, body, { countdown: checked ? null : { auto: 'h' } });
    } else if (key === 'analyse') {
      const checked = !!w.checked.h, ev = evidenceSegments(it, qs, true);
      const wrong = checked ? wrongQuestions('h', qs) : [];
      body = card(playerHtml(it)) + card(`${rtl(`<h4>متن صوتی را باز کن و قسمت‌های نامفهوم را بررسی کن.</h4><p class="tdm-muted">جمله‌های زرد شواهد سؤال‌های اشتباه هستند. روی ▶ هر جمله بزن تا همان بخش پخش شود؛ روی «?» بزن تا آن جمله خودکار توضیح داده شود و در فهرست اشتباهات ثبت شود.</p>`)}${transcriptHtml(it, ev, { mark: true })}`)
        + (checked ? qaHtml('h', 'hoeren', wrong) : card(`${rtl('<h4>هنوز سؤال‌ها را ارزیابی نکرده‌ای.</h4>')}${renderQuestions('h', qs)}`))
        + card(`${rtl('<h4>جمله‌های نامفهوم</h4><p class="tdm-muted">با «?» کنار هر جمله اضافه کن؛ معنی، ساختار و دسته آن خودکار مشخص می‌شود.</p>')}${extraErrorsHtml('hoeren')}`)
        + card(`<h4 dir="auto">${L('کلمات کلیدی این فایل', 'Schlüsselwörter')}</h4>${vocabMini(it.vocab)}`)
        + ruleBox(M_.rule);
    } else if (key === 'erneut') body = card(playerHtml(it)) + card(`${rtl('<h4>متن را ببند و دوباره گوش بده. هدف: درک جمله‌ها و ارتباط منطقی آن‌ها بدون کمک متن.</h4>')}
        <label class="tdm-label" dir="auto">${L('چند درصد را اکنون بدون متن می‌فهمم؟', 'Wie viel verstehe ich jetzt ohne Text?')} <b id="tdmUnd">${faNum(w.f.understanding || 50)}%</b></label>
        <input type="range" min="0" max="100" step="5" value="${E(w.f.understanding || 50)}" class="tdm-range" oninput="TDM.f('understanding',this.value);document.getElementById('tdmUnd').textContent=this.value+'%'">
        ${selfCheck('e_logic', 'ارتباط منطقی بین جمله‌ها (دلیل، نتیجه، تضاد) را دنبال کردم.')}`);
    else if (key === 'zusammenfassung') body = card(`${rtl('<h4>بدون نگاه به متن، محتوای فایل را به آلمانی بازگو کن و صدایت را ضبط کن.</h4><p class="tdm-muted">ترتیب پیشنهادی: موضوع ← مسئله ← دلایل و مثال‌ها ← نتیجه.</p>')}
        ${recorderHtml('zusammenfassung', { label: 'Zusammenfassung', limit: 180 })}
        <label class="tdm-label" dir="auto">${L('نکات یا متن بازگویی (اختیاری)', 'Notizen (optional)')}</label>${ta('summary_notes', 'In dem Gespräch geht es um …', 3)}
        ${reveal('hsum', L('خلاصه نمونه برای مقایسه', 'Musterzusammenfassung'), `<p dir="ltr">${E(it.summary_model)}</p>`)}`)
        + (w.rec.zusammenfassung && aiOn() && !w.rec.zusammenfassung.local && aiState('sp_zusammenfassung') !== 'error'
          ? card(aiSpeakingHtml('zusammenfassung', -1, { title: L('بررسی خودکار بازگویی تو', 'Automatische Prüfung deiner Zusammenfassung') }), 'tdm-ai') : '')
        + (w.rec.zusammenfassung && aiOn() && !w.rec.zusammenfassung.local && aiState('sp_zusammenfassung') === 'done' ? ''
          : card(`${w.rec.zusammenfassung && aiState('sp_zusammenfassung') === 'error' ? (speakAuto('zusammenfassung', -1), aiFailed('sp_zusammenfassung', w.ai.sp_zusammenfassung, '')) : ''}<h4 dir="auto">${L('بررسی صدای خودم', 'Selbstkontrolle')}</h4>${selfCheck('z_thema', 'آیا موضوع را درست فهمیدم؟')}${selfCheck('z_reihenfolge', 'آیا ترتیب اطلاعات را حفظ کردم؟')}${selfCheck('z_eigen', 'آیا توانستم مفهوم را با جملات خودم بیان کنم؟')}`))
        + card(`${rtl(`<p>حداقل بخشی از تمرین روزانه باید از نمونه سؤالات رسمی Hören باشد: <a href="${ST.officialUrl}" target="_blank" rel="noopener">صفحه رسمی آمادگی آزمون</a></p>`)}`);
    return frame(a, d, steps, i, body);
  }
  function vocabMini(vocab) { return `<div class="tdm-vmini" dir="ltr">${(vocab || []).map((v) => `<span><b>${E((v.artikel ? v.artikel + ' ' : '') + v.wort)}</b><small dir="rtl">${E(v.bedeutung_fa)}</small></span>`).join('')}</div>`; }

  // ---------- Lesen ----------
  function lesenText(it, opts = {}) {
    return `<article class="tdm-text" dir="ltr"><h3>${E(it.title)}</h3>${it.teaser ? `<p class="tdm-teaser">${E(it.teaser)}</p>` : ''}${it.paragraphs.map((p, n) => `<section class="tdm-para"><span class="tdm-pnum">${n + 1}</span><div>${p.heading ? `<h5>${E(p.heading)}</h5>` : ''}<p>${E(p.text)}</p>${opts.ideas ? `<div class="tdm-idea">${ta('idea_' + n, 'Kernaussage in einem Satz …', 2)}${opts.showModel ? `<p class="tdm-model">✓ ${E(it.main_ideas?.[n] || '')}</p>` : ''}</div>` : ''}</div></section>`).join('')}</article>`;
  }
  function renderLesen(a, d, w, steps, i) {
    const it = item('lesen', d.picks?.lesen); if (!it) return frame(a, d, steps, i, card('—'));
    const key = steps[i].key, qs = it.questions || [];
    const strategy = rtl(`<ol class="tdm-ol"><li>کلمات کلیدی سؤال را مشخص کن.</li><li>پاراگراف مرتبط را پیدا کن.</li><li>جمله حاوی پاسخ را مشخص کن.</li><li>گزینه‌ها را با مفهوم متن مقایسه کن.</li><li>پاسخ را انتخاب کن.</li></ol>`);
    let body = '';
    if (key === 'ueberblick') body = card(`<div class="tdm-item-head"><span class="tdm-pill">${E(it.formatLabel)}</span><h3 dir="ltr">${E(it.title)}</h3>${it.teaser ? `<p dir="ltr" class="tdm-teaser">${E(it.teaser)}</p>` : ''}</div>
        <h4 dir="auto">${L('تیترهای فرعی', 'Zwischenüberschriften')}</h4><ol class="tdm-list" dir="ltr">${it.paragraphs.map((p) => `<li>${E(p.heading || '…')}</li>`).join('')}</ol>`)
        + card(`${rtl('<h4>موضوع و محتوای احتمالی متن را پیش‌بینی کن (بدون خواندن متن).</h4>')}${ta('prediction', 'Ich vermute, dass der Text …', 3)}`);
    else if (key === 'intensiv') body = card(rtl('<p>متن را با دقت بخوان و برای هر پاراگراف یک جمله درباره مفهوم اصلی بنویس. <b>از ترجمه تک‌تک کلمات خودداری کن.</b></p>')) + card(lesenText(it, { ideas: true, showModel: !!w.checked.r_lideas })) + `<div class="tdm-center"><button class="tdm-btn ghost" onclick="TDM.toggleReveal('lideas')">${w.checked.r_lideas ? L('پنهان‌کردن نمونه‌ها', 'Muster ausblenden') : L('مقایسه با ایده‌های نمونه', 'Mit Muster vergleichen')}</button></div>`;
    else if (key === 'aufgaben' || key === 'pruefung') {
      const exam = key === 'pruefung', checked = !!w.checked.l;
      body = (exam ? '' : card(`<h4 dir="auto">${L('روش پاسخ‌گویی به هر سؤال', 'Lösungsstrategie')}</h4>${strategy}`, 'tdm-compact')) + `<div class="tdm-readstack"><div class="tdm-split-text">${card(lesenText(it))}</div><div class="tdm-split-q">${card(`<h4>${E(it.formatLabel)}</h4>${it.format === 'jnt' ? rtl('<p class="tdm-muted">Ja = متن همین را می‌گوید · Nein = متن خلاف آن را می‌گوید · Text sagt dazu nichts = متن درباره‌اش چیزی نمی‌گوید.</p>') : ''}${renderQuestions('l', qs, { explain: true })}`)}</div></div>`;
      return frame(a, d, steps, i, body, exam && !checked ? { countdown: { auto: 'l' } } : {});
    } else if (key === 'fehler') {
      const checked = !!w.checked.l, wrong = checked ? wrongQuestions('l', qs) : [];
      const sc = checked ? qScore('l', qs) : null;
      const analysed = analysedCount(w);
      body = (checked ? qaHtml('l', 'lesen', wrong) : card(`${rtl('<h4>ابتدا سؤال‌ها را ارزیابی کن.</h4>')}${renderQuestions('l', qs, { explain: true })}`))
        + card(`${rtl('<h4>جمله دشوار دیگری هم بود؟</h4><p class="tdm-muted">اختیاری: جمله را اینجا بنویس تا معنی و ساختارش خودکار توضیح داده شود.</p>')}${extraErrorsHtml('lesen')}`)
        + card(`${rtl('<h4>خلاصه یک‌خطی متن (با جمله خودت)</h4>')}${ta('summary', 'Der Text zeigt, dass …', 2)}${reveal('lsum', L('مقایسه با خلاصه نمونه', 'Musterlösung'), `<p dir="ltr">${E(it.summary_line)}</p>`)}`)
        + card(`<h4 dir="auto">${L('خروجی روزانه Lesen', 'Tagesergebnis Lesen')}</h4><div class="tdm-out"><div><small>${L('متن', 'Text')}</small><b dir="ltr">${E(it.title)}</b></div><div><small>${L('سؤالات حل‌شده', 'Gelöste Aufgaben')}</small><b>${sc ? faNum(sc.total) : '—'}</b></div><div><small>${L('درصد پاسخ صحیح', 'Richtig')}</small><b>${sc ? faNum(sc.pct) + '%' : '—'}</b></div><div><small>${L('اشتباهات تحلیل‌شده', 'Analysierte Fehler')}</small><b>${faNum(analysed)}</b></div></div>`)
        + card(`<h4 dir="auto">${L('لغات کلیدی متن (در بخش واژگان امروز)', 'Wortschatz aus dem Text')}</h4>${vocabMini(it.vocab)}`);
    }
    return frame(a, d, steps, i, body);
  }

  // ---------- Schreiben ----------
  function chartSvg(c) {
    if (!c?.labels?.length) return '';
    const W = 640, H = 300, padL = 52, padB = 58, padT = 18, padR = 14, series = c.series || [], all = series.flatMap((s) => s.values), rawMax = Math.max(...all, 0) || 1, mag = Math.pow(10, Math.floor(Math.log10(rawMax / 4))), step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s * 4 >= rawMax * 1.08) || mag * 10, max = step * 4;
    const x0 = padL, y0 = H - padB, cw = W - padL - padR, ch = H - padB - padT, colors = ['#6366f1', '#f59e0b'];
    const yTicks = 4, fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('de-DE');
    let g = '';
    for (let t = 0; t <= yTicks; t++) { const v = max / yTicks * t, y = y0 - ch * t / yTicks; g += `<line x1="${x0}" x2="${W - padR}" y1="${y}" y2="${y}" class="grid"/><text x="${x0 - 6}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`; }
    const n = c.labels.length, slot = cw / n;
    if (c.type === 'line') {
      series.forEach((s, si) => { const pts = s.values.map((v, k) => [x0 + slot * (k + 0.5), y0 - ch * v / max]); g += `<polyline fill="none" stroke="${colors[si]}" stroke-width="3" points="${pts.map((p) => p.join(',')).join(' ')}"/>` + pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${colors[si]}"/><text x="${p[0]}" y="${p[1] - 9}" text-anchor="middle" class="val">${fmt(s.values[k])}</text>`).join(''); });
    } else {
      const bw = Math.min(46, slot * 0.7 / Math.max(1, series.length));
      series.forEach((s, si) => s.values.forEach((v, k) => { const x = x0 + slot * k + slot / 2 - (bw * series.length) / 2 + bw * si, h = ch * v / max; g += `<rect x="${x}" y="${y0 - h}" width="${bw - 3}" height="${h}" rx="4" fill="${colors[si]}"/><text x="${x + (bw - 3) / 2}" y="${y0 - h - 5}" text-anchor="middle" class="val">${fmt(v)}</text>`; }));
    }
    c.labels.forEach((l, k) => { g += `<text x="${x0 + slot * (k + 0.5)}" y="${y0 + 16}" text-anchor="middle" class="lab">${E(String(l).length > 16 ? String(l).slice(0, 15) + '…' : l)}</text>`; });
    const legend = series.length > 1 || series[0]?.name ? `<div class="tdm-legend">${series.map((s, si) => `<span><i style="background:${colors[si]}"></i>${E(s.name)}</span>`).join('')}</div>` : '';
    return `<figure class="tdm-chart" dir="ltr"><figcaption><b>${E(c.title)}</b><small>${E(c.unit)} · ${E(c.source || 'fiktive Daten')}</small></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(c.title)}"><line x1="${x0}" x2="${W - padR}" y1="${y0}" y2="${y0}" class="axis"/>${g}</svg>${legend}</figure>`;
  }
  TDM.insert = function (text) { const el = document.getElementById('tdmEssay'); if (!el) return; const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s; el.value = el.value.slice(0, s) + text + el.value.slice(e); el.focus(); el.selectionStart = el.selectionEnd = s + text.length; TDM.essay(el.value); };
  TDM.essay = function (v) { const w = work(); w.f.text = v; scheduleSave(); const c = document.getElementById('tdmWc'); if (c) { const n = wordsIn(v); c.textContent = faNum(n); c.parentElement.classList.toggle('is-ok', n >= Number(c.dataset.min || 0)); } };
  function essayBox(min, max, d) { const w = work(), n = wordsIn(w.f.text || ''); return `<div class="tdm-essay"><textarea id="tdmEssay" dir="ltr" rows="16" class="tdm-input" spellcheck="false" placeholder="Schreiben Sie hier …" oninput="TDM.essay(this.value)">${E(w.f.text || '')}</textarea><div dir="auto" class="tdm-wc ${n >= min ? 'is-ok' : ''}">${L('تعداد کلمات', 'Wörter')}: <b id="tdmWc" data-min="${min}">${faNum(n)}</b> · ${L('هدف', 'Ziel')}: ${faNum(min)}${max ? '–' + faNum(max) : '+'}</div></div>`; }
  function phraseChips(list) { return `<div class="tdm-phrases" dir="ltr">${list.map((p) => `<button onclick="TDM.insert(${E(JSON.stringify(' ' + String(p.de || p).replace(/\s*\.\.\.\s*$|\s*…\s*$/, ' ').trim() + ' '))})" title="${E(p.fa || '')}">${E(p.de || p)}</button>`).join('')}</div>`; }
  function korrekturHtml(it, d, isGrafik) {
    const w = work(), crit = [['grammatik', 'Grammatik', 'فعل در جای درست؟ صرف فعل، حالت‌ها و پایانه صفت‌ها درست است؟'], ['wortschatz', 'Wortschatz', 'واژگان دقیق و متنوع؟ تکرار کمتر؟ Redemittel امروز استفاده شد؟'], ['konnektoren', 'Konnektoren', 'از حروف ربط (deshalb, außerdem, allerdings, folglich…) برای اتصال جمله‌ها استفاده شد؟'], ['struktur', 'Struktur', isGrafik ? 'مقدمه (عنوان/واحد) ← روند و مقادیر ← اطلاعات متن ← نتیجه؟' : 'Einleitung، Hauptteil، Gegenargument، Meinung و Schluss وجود دارد؟'], ['aufgabe', 'Aufgabenbezug', 'همه بخش‌های خواسته‌شده در دستور کار پاسخ داده شد؟']];
    if (wordsIn(w.f.text) >= 20) autoAI('writing', TDM.aiWriting);
    const byAI = aiState('writing') === 'done';
    return aiWritingHtml()
      + card(`${rtl(byAI ? '<h4>نمره‌ها (پیشنهاد هوش مصنوعی؛ اگر لازم بود تغییر بده)</h4>' : '<h4>متن را از نظر این معیارها بررسی کن و به هر کدام از ۱ تا ۵ نمره بده:</h4>')}${crit.map(([k, de, fa]) => rating('k_' + k, de, fa)).join('')}`)
      + card(`<h4 dir="auto">${L('متن من', 'Mein Text')}</h4>${essayBox(isGrafik ? 100 : mwOf(d), isGrafik ? 150 : 0, d)}`)
      + card(reveal('smodel', L('متن نمونه برای مقایسه', 'Mustertext zum Vergleich'), `<div class="tdm-modeltext" dir="ltr">${E(it.model_text).replace(/\n\n/g, '</p><p>').replace(/^/, '<p>')}</p></div>`));
  }
  const minWords = (d) => { const b = Math.round((M().phase >= 2 ? 200 : 150) * (lowLevel() ? 0.75 : 1) / 10) * 10 /*LEVEL-ADAPT*/, f = scaleOf(); return f < 0.6 ? Math.round(b * 0.6 / 10) * 10 : f < 0.85 ? Math.round(b * 0.8 / 10) * 10 : b; };
  // ÖSD items carry the exam's own word target; it shrinks with a shorter daily time like the TestDaF target
  const mwOf = (d) => { const it = d?.picks?.schreiben ? item(d.picks.schreiben.kind, d.picks.schreiben.id) : null; return it && it.minWords ? Math.max(60, Math.round(it.minWords * minWords(d) / (M().phase >= 2 ? 200 : 150) / 10) * 10) : minWords(d); };
  function renderSchreiben(a, d, w, steps, i) {
    const pk = d.picks?.schreiben, it = pk ? item(pk.kind, pk.id) : null; if (!it) return frame(a, d, steps, i, card('—'));
    const key = steps[i].key, isG = pk.kind === 'grafik', exam = d.mode !== 'normal';
    const AL = PROG()?.anaLabels?.(it) || ['Problem', 'Vorteile', 'Nachteile', 'Betroffene'];
    const taskCard = isG ? card(`<div class="tdm-item-head"><span class="tdm-pill">Grafik und Zusammenfassung</span><h3 dir="ltr">${E(it.title)}</h3></div>${chartSvg(it.chart)}<div class="tdm-source" dir="ltr"><b>Text:</b> ${E(it.text)}</div><p class="tdm-task" dir="ltr">${E(it.task)}</p>`)
      : card(`<div class="tdm-item-head"><span class="tdm-pill">${E(it.formatLabel || 'Argumentation')}</span><h3 dir="ltr">${E(it.title)}</h3></div><p dir="ltr">${E(it.situation)}</p>${it.material ? `<pre class="tdm-material" dir="ltr">${E(it.material)}</pre>` : ''}<div class="tdm-positions" dir="ltr">${arr(it.positions).map((p) => `<blockquote><b>${E(p.person)}:</b> „${E(p.text)}“</blockquote>`).join('')}</div><p class="tdm-task" dir="ltr">${E(it.task)}</p>`);
    let body = '';
    if (key === 'analyse' && !isG) body = taskCard + card(`${rtl('<h4>تحلیل (۵ دقیقه)</h4>')}<div class="tdm-grid2">${(PROG()?.anaFields?.(it) || [['a_problem', 'Was ist das Problem?', 'مسئله چیست؟'], ['a_vorteile', 'Vorteile', 'مزایا'], ['a_nachteile', 'Nachteile', 'معایب'], ['a_betroffene', 'Wer ist betroffen?', 'چه کسانی تحت تأثیر قرار می‌گیرند؟'], ['a_meinung', 'Meine Meinung', 'نظر شخصی من']]).map(([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${ta(k, '…', 2)}</label>`).join('')}</div>
        ${reveal('sana', L('راهنمای تحلیل', 'Analysehilfe'), `<div dir="ltr" class="tdm-grid2"><div class="tdm-mini"><b>${E(AL[0])}</b><p>${E(it.analysis?.problem)}</p></div><div class="tdm-mini"><b>${E(AL[1])}</b><p>${E(arr(it.analysis?.vorteile).join(' · '))}</p></div><div class="tdm-mini"><b>${E(AL[2])}</b><p>${E(arr(it.analysis?.nachteile).join(' · '))}</p></div><div class="tdm-mini"><b>${E(AL[3])}</b><p>${E(arr(it.analysis?.betroffene).join(' · '))}</p></div></div>`)}`);
    else if (key === 'analyse' && isG) body = taskCard + card(`${rtl('<h4>مراحل تحلیل نمودار</h4>')}${[['g_titel', '1. Titel und Maßeinheit', 'عنوان نمودار و واحد اندازه‌گیری'], ['g_maxmin', '2. Höchster und niedrigster Wert', 'بیشترین و کمترین مقدار'], ['g_trend', '3. Allgemeiner Trend', 'روند کلی'], ['g_text', '4. Informationen aus dem Text', 'اطلاعات متن همراه نمودار'], ['g_vergleich', '5. Gemeinsamkeiten und Unterschiede', 'شباهت‌ها و تفاوت‌ها']].map(([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${ta(k, '…', 2)}</label>`).join('')}
        ${reveal('gana', L('تحلیل نمونه', 'Musteranalyse'), `<ul class="tdm-list" dir="ltr">${Object.entries(it.analysis || {}).map(([k, v]) => `<li><b>${E(k.replace('_', ' / '))}:</b> ${E(v)}</li>`).join('')}</ul>`)}
        ${ruleBox('نکته: اطلاعات متن و نمودار باید با یکدیگر ترکیب شوند.')}`);
    else if (key === 'gliederung') body = taskCard + card(`${rtl('<h4>ساختار متن (فقط کلیدواژه)</h4>')}${(PROG()?.outFields?.(it) || [['o_einleitung', 'Einleitung', 'مقدمه'], ['o_hauptteil', 'Hauptteil: Argumente', 'استدلال‌ها'], ['o_gegen', 'Gegenargument', 'دیدگاه مخالف'], ['o_meinung', 'Eigene Meinung', 'نظر شخصی'], ['o_schluss', 'Schluss', 'نتیجه‌گیری']]).map(([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${ta(k, '…', 2)}</label>`).join('')}
        ${reveal('sout', L('طرح نمونه', 'Mustergliederung'), `<ul class="tdm-list" dir="ltr">${Object.entries(it.outline || {}).map(([k, v]) => `<li><b>${E(k)}:</b> ${E(Array.isArray(v) ? v.join(' · ') : v)}</li>`).join('')}</ul>`)}`);
    else if (key === 'schreiben') {
      const min = isG ? 100 : mwOf(d), max = isG ? 150 : 0;
      const outline = !isG && !exam ? `<div class="tdm-outline-mini" dir="ltr">${['o_einleitung', 'o_hauptteil', 'o_gegen', 'o_meinung', 'o_schluss'].map((k) => w.f[k] ? `<span>${E(w.f[k])}</span>` : '').join('')}</div>` : '';
      const scaffold = isG ? card(`<h4 dir="auto">${L('عبارت‌های کاربردی', 'Redemittel')}</h4><table class="tdm-table" dir="ltr">${ST.grafikPhrases.map(([de, fa]) => `<tr><td>${E(de)}</td><td dir="rtl">${E(fa)}</td></tr>`).join('')}</table>${phraseChips(arr(it.redemittel))}`, 'tdm-compact')
        : card(`${rtl('<h4>برای هر پاراگراف: Behauptung (ادعا) ← Begründung (دلیل) ← Beispiel (مثال) ← Konsequenz (نتیجه)</h4>')}${outline}<p class="tdm-muted">${L('روی عبارت بزن تا در محل مکان‌نما درج شود:', 'Zum Einfügen antippen:')}</p>${phraseChips([...arr(it.connectors).map((c) => ({ de: c })), ...(d.redemittel || [])])}`, 'tdm-compact');
      body = taskCard + scaffold + card(essayBox(min, max, d));
      return frame(a, d, steps, i, body, exam ? { countdown: {} } : {});
    } else if (key === 'korrektur' || key === 'protokoll') body = korrekturHtml(it, d, isG);
    return frame(a, d, steps, i, body);
  }

  // ---------- Sprechen ----------
  function speakTask(d, t) { return item('sprechen', (d.picks?.sprechen || [])[t]); }
  function taskCardHtml(it, opts = {}) {
    const g = ST.speakingTypes[it.type] || {};
    return card(`<div class="tdm-item-head"><span class="tdm-pill">${E(it.typeLabel)}</span><h3 dir="ltr">${E(it.title)}</h3><p class="tdm-muted">${L('آماده‌سازی', 'Vorbereitung')} ${faNum(it.prep)}s · ${L('صحبت', 'Sprechzeit')} ${faNum(it.speak)}s</p></div>
      <p dir="ltr">${E(it.situation)}</p><p class="tdm-task" dir="ltr">${E(it.task)}</p>${it.material ? `<pre class="tdm-material" dir="ltr">${E(it.material)}</pre>` : ''}
      ${opts.guide !== false ? rtl(`<p class="tdm-muted"><b>${E(g.fa || '')}:</b> ${E(g.how || '')}</p>`) : ''}`);
  }
  function renderSprechen(a, d, w, steps, i) {
    const st = steps[i], [kind, tStr] = st.key.split(':'), t = Number(tStr) || 0;
    if (d.mode !== 'normal') return renderSprechenExam(a, d, w, steps, i);
    const it = speakTask(d, t); if (!it) return frame(a, d, steps, i, card('—'));
    const g = ST.speakingTypes[it.type] || {};
    let body = '';
    if (kind === 'prep') body = taskCardHtml(it) + card(`${rtl('<h4>فقط کلمات کلیدی را یادداشت کن — جمله کامل ننویس.</h4><p class="tdm-muted">مثلاً: Berufserfahrung · finanzielle Unabhängigkeit · Zeitmanagement · Stress</p>')}${ta('kw_' + t, 'Stichwort · Stichwort · …', 3)}
        ${reveal('sphelp' + t, L('کمک: کلیدواژه‌ها، ساختار و Redemittel', 'Hilfe: Stichwörter, Aufbau, Redemittel'), `<p dir="ltr"><b>Stichwörter:</b> ${E(arr(it.keywords).join(' · '))}</p><ol class="tdm-list" dir="ltr">${arr(it.structure).map((s) => `<li>${E(s)}</li>`).join('')}</ol><div class="tdm-vmini" dir="ltr">${[...(g.phrases || []).map((p) => ({ de: p })), ...arr(it.redemittel)].slice(0, 8).map((r) => `<span><b>${E(r.de)}</b>${r.fa ? `<small dir="rtl">${E(r.fa)}</small>` : ''}</span>`).join('')}</div>`)}`);
    else if (kind === 'speak') body = taskCardHtml(it, { guide: false }) + card(`${w.f['kw_' + t] ? `<p class="tdm-kwline" dir="ltr">🗝 ${E(w.f['kw_' + t])}</p>` : ''}${rtl('<h4>سه نوع تمرین را در صحبتت پوشش بده:</h4><ol class="tdm-ol"><li>بیان نظر شخصی</li><li>بیان مزایا و معایب</li><li>نتیجه‌گیری</li></ol>')}${recorderHtml('try1_' + t, { label: L('اجرای اول', 'Versuch 1'), limit: it.speak })}`);
    else if (kind === 'analyse') {
      const rec1 = w.rec['try1_' + t], byAI = aiState('sp_try1_' + t) === 'done';
      body = card(`${rtl('<h4>اجرای اول را گوش بده؛ تحلیل آن خودکار انجام می‌شود.</h4>')}${rec1 ? recAudio(rec1) : rtl('<p class="tdm-warn">هنوز ضبطی برای اجرای اول وجود ندارد؛ به مرحله قبل برگرد و صحبت کن.</p>')}`)
        + (rec1 && aiOn() ? card(aiSpeakingHtml('try1_' + t, t, { title: L('تحلیل خودکار اجرای اول', 'Analyse von Versuch 1'), manualHint: L('تا آن موقع چک‌لیست زیر را خودت پر کن.', 'Fülle bis dahin die Checkliste selbst aus.') }), 'tdm-ai') : '')
        + card(`${rtl(byAI ? '<h4>مشکلات شناسایی‌شده (خودکار؛ در صورت نیاز اصلاح کن)</h4>' : '<h4>صدای خودت را بررسی کن (اگر رخ داد ✓ بزن):</h4>')}${CATS.sprechen.map(([id, de, fa]) => selfCheck(`sp:${t}:${id}`, `${fa} (${de})`, true)).join('')}
          ${byAI ? '' : `<label class="tdm-label" dir="auto">${L('یادداشت اصلاحی (جمله درست، ساختار بهتر)', 'Korrekturnotiz')}</label>${ta('an_note_' + t, 'Statt „…“ besser: „…“', 2)}`}`)
        + card(reveal('spmodel' + t, L('پاسخ نمونه و Redemittel برای مقایسه', 'Musterantwort & Redemittel'), `<p dir="ltr">${E(it.model_answer)}</p><div class="tdm-vmini" dir="ltr">${arr(it.redemittel).map((r) => `<span><b>${E(r.de)}</b><small dir="rtl">${E(r.fa)}</small></span>`).join('')}</div>`));
    } else if (kind === 'repeat') {
      const rec2 = w.rec['try2_' + t], byAI = aiState('sp_try2_' + t) === 'done';
      body = card(`${rtl('<h4>همان موضوع را بدون نگاه به یادداشت‌ها دوباره توضیح بده.</h4><p class="tdm-muted">اگر جمله‌ای را فراموش کردی، از ساختار دیگری برای انتقال مفهوم استفاده کن.</p>')}<p class="tdm-task" dir="ltr">${E(it.task)}</p>${recorderHtml('try2_' + t, { label: L('اجرای دوم', 'Versuch 2'), limit: it.speak })}`)
        + (rec2 && aiOn() ? card(aiSpeakingHtml('try2_' + t, t, { title: L('تحلیل خودکار اجرای دوم', 'Analyse von Versuch 2') }) + speakCompare(t), 'tdm-ai') : '')
        + card(`${rtl(byAI ? '<h4>نمره اجرای دوم (از تحلیل خودکار؛ قابل تغییر)</h4>' : '<h4>ارزیابی اجرای دوم (۱ تا ۵)</h4>')}${rating(`s${t}_fluss`, 'Flüssigkeit', 'روانی')}${rating(`s${t}_genau`, 'Genauigkeit', 'دقت گرامری و واژگانی')}${rating(`s${t}_struktur`, 'Struktur', 'ساختار')}${rating(`s${t}_aufgabe`, 'Aufgabenerfüllung', 'انجام وظیفه')}`);
    }
    return frame(a, d, steps, i, body);
  }
  // attempt 1 vs attempt 2 of the same task
  function speakCompare(t) {
    const w = work(), a = w.ai?.['sp_try1_' + t], b = w.ai?.['sp_try2_' + t];
    if (!a?.scores || !b?.scores) return '';
    const row = (label, x, y, higherBetter = true) => { const d = (y ?? 0) - (x ?? 0), good = higherBetter ? d > 0 : d < 0; return `<tr><td>${label}</td><td>${x == null ? '—' : faNum(x)}</td><td><b>${y == null ? '—' : faNum(y)}</b> ${d ? `<em class="${good ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${faNum(Math.abs(d))}</em>` : ''}</td></tr>`; };
    return `<h4 dir="auto">${L('مقایسه اجرای اول و دوم', 'Versuch 1 und 2 im Vergleich')}</h4><table class="tdm-table tdm-compare"><thead><tr><th></th><th>${L('اول', '1')}</th><th>${L('دوم', '2')}</th></tr></thead><tbody>${Object.keys(SC_NAMES).map((k) => row(SC_NAMES[k], a.scores[k], b.scores[k])).join('')}${row(L('کلمه در دقیقه', 'Wörter/Min.'), a.wpm, b.wpm)}${row(L('مکث طولانی', 'Lange Pausen'), a.long_pauses, b.long_pauses, false)}</tbody></table>`;
  }
  // exam-mode speaking: prep countdown → automatic recording → next task
  TDM.examSpeakStart = async function (t) {
    audioCtx();
    const d = curDay(), it = speakTask(d, t); if (!it) return;
    try { if (!R.stream || !R.stream.active) { R.stream = await navigator.mediaDevices.getUserMedia(MIC); micReady(R.stream); } } catch (e) { alertBox(L('دسترسی به میکروفون داده نشد.', 'Mikrofonzugriff wurde abgelehnt.')); return; }
    const w = work(); w.ex = { t, phase: 'prep', until: Date.now() + it.prep * 1000 }; saveData(); render();
  };
  TDM.examSkipPrep = function () { const w = work(); if (w.ex?.phase !== 'prep') return; w.ex.until = Date.now(); examSpeakingTick(w); };
  function examSpeakingTick(w) {
    if (!w.ex || act()?.id !== 'sprechen') return;
    const d = curDay(), it = speakTask(d, w.ex.t), left = Math.ceil((w.ex.until - Date.now()) / 1000), el = document.getElementById('tdmExClock');
    if (el) el.textContent = mmss(Math.max(0, left));
    if (w.ex.phase === 'prep' && left <= 0) { w.ex = { t: w.ex.t, phase: 'speak', until: Date.now() + it.speak * 1000 }; saveData(); R.autoStop = true; TDM.recStart('exam_' + w.ex.t, it.speak).then(() => { R.autoStop = true; }); }
    else if (w.ex.phase === 'speak' && left <= -1) { if (R.rec?.state === 'recording') TDM.recStop(); w.ex = null; saveData(); setTimeout(render, 600); }
  }
  function renderSprechenExam(a, d, w, steps, i) {
    const tasks = spList(d).map((id) => item('sprechen', id)).filter(Boolean);
    if (steps[i].key === 'exam') {
      const body = card(rtl(`<p>${d.mode === 'eval' ? 'آزمون هفتگی Sprechen: ' : ''}هر وظیفه: زمان آماده‌سازی ← ضبط خودکار ← توقف خودکار در پایان زمان صحبت. مثل آزمون واقعی، بدون مکث بین وظایف.</p>`))
        + tasks.map((it, t) => { const ex = w.ex && w.ex.t === t, rec = w.rec['exam_' + t]; return taskCardHtml(it, { guide: false }) + card(ex ? `<div class="tdm-exstate ${w.ex.phase}"><b>${w.ex.phase === 'prep' ? L('آماده‌سازی', 'Vorbereitung') : '● ' + L('در حال ضبط', 'Aufnahme läuft')}</b><span id="tdmExClock" class="tdm-mono">${mmss(Math.max(0, (w.ex.until - Date.now()) / 1000))}</span>${w.ex.phase === 'speak' ? `<button class="tdm-btn danger" onclick="TDM.recStop()">■ ${L('پایان زودتر', 'Früher beenden')}</button>` : `<button class="tdm-btn primary" onclick="TDM.examSkipPrep()">${L('عبور از آماده‌سازی', 'Vorbereitung überspringen', 'Skip preparation')} ⏭</button>`}</div>` : rec ? `<div class="tdm-exdone">✓ ${L('ضبط شد', 'Aufgenommen')} · ${mmss(rec.secs || 0)}${recAudio(rec)}<button class="tdm-btn ghost" onclick="TDM.examSpeakStart(${t})">${L('دوباره', 'Wiederholen')}</button></div>` : `<button class="tdm-btn primary big wide" ${w.ex ? 'disabled' : ''} onclick="TDM.examSpeakStart(${t})">▶ ${L('شروع وظیفه', 'Aufgabe starten')} ${faNum(t + 1)}</button>`); }).join('');
      return frame(a, d, steps, i, body);
    }
    // recordings are analysed one after another (the next starts when the previous has finished)
    const pending = tasks.findIndex((_, t) => w.rec['exam_' + t] && !w.rec['exam_' + t].local && (['none', 'busy'].includes(aiState('sp_exam_' + t)) || (aiState('sp_exam_' + t) === 'error' && retryDue(w, 'sp_exam_' + t))));
    tasks.forEach((_, t) => { if (aiState('sp_exam_' + t) === 'error') armRetry(w, 'sp_exam_' + t); });
    const body = tasks.map((it, t) => { const rec = w.rec['exam_' + t], byAI = aiState('sp_exam_' + t) === 'done'; return card(`<div class="tdm-item-head"><span class="tdm-pill">${E(it.typeLabel)}</span><h3 dir="ltr">${E(it.title)}</h3></div>${rec ? `${recAudio(rec)}` : rtl('<p class="tdm-warn">ضبط نشده</p>')}
      ${rec && aiOn() ? `<div class="tdm-ai">${aiSpeakingHtml('exam_' + t, t, { noAuto: t !== pending, title: L('تحلیل خودکار', 'Automatische Analyse'), manualHint: L('چک‌لیست و نمره‌ها را خودت پر کن.', 'Bewerte selbst.') })}</div>` : ''}
      ${rtl(byAI ? '<h4>مشکلات و نمره‌ها (خودکار؛ قابل اصلاح)</h4>' : '<h4>بررسی و نمره</h4>')}
      ${CATS.sprechen.map(([id, de, fa]) => selfCheck(`sp:${t}:${id}`, `${fa} (${de})`, true)).join('')}
      ${rating(`s${t}_fluss`, 'Flüssigkeit', 'روانی')}${rating(`s${t}_genau`, 'Genauigkeit', 'دقت')}${rating(`s${t}_struktur`, 'Struktur', 'ساختار')}${rating(`s${t}_aufgabe`, 'Aufgabenerfüllung', 'انجام وظیفه')}
      ${reveal('exmodel' + t, L('پاسخ نمونه برای مقایسه', 'Musterantwort'), `<p dir="ltr">${E(it.model_answer)}</p>`)}`); }).join('');
    return frame(a, d, steps, i, body);
  }

  // ---------- SRS (words + Redemittel) ----------
  function srsAdd(type, ref, data, k) { const m = M(), key = type + ':' + ref; if (m.srs[key]) return; m.srs[key] = { key, type, ref, data, added: k, addedAt: new Date().toISOString(), stage: 0, due: addDays(k, 1), reps: 0, lapses: 0 }; }
  function srsRate(key, ok) { const it = M().srs[key]; if (!it) return; const t = today(); if (ok) { it.stage = Math.min(it.stage + 1, SRS_STEPS.length - 1); it.due = addDays(t, SRS_STEPS[it.stage]); } else { it.stage = 0; it.lapses++; it.due = addDays(t, 1); } it.reps++; it.last = t; }
  function srsDue(type, k = today()) { return Object.values(M().srs).filter((x) => x.type === type && x.due <= k).sort((a, b) => a.due.localeCompare(b.due)); }
  TDM.srsDueCount = () => Object.values(M().srs).filter((x) => x.due <= today()).length;
  function dayWords(d) { const it = item('lesen', d.picks?.lesen); return it?.vocab || []; }
  function wordData(v) { return { wort: v.wort, artikel: v.artikel || '', plural: v.plural || '', wortart: v.wortart || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '', koll: arr(v.kollokationen).slice(0, 5), perfekt: v.perfekt || '' }; }
  TDM.srsCard = function (key, ok) { const w = work(); srsRate(key, ok); w.ans['srs:' + key] = ok ? 'ok' : 'no'; syncSiteWord(M().srs[key], ok); saveData(); render(); };
  // ---------- site integration: word progress, mistake book, favourites ----------
  function siteVocabItem(c) {
    const x = c?.data || {};
    return c?.type === 'wort'
      ? { id: 'tdm-' + c.key, word: `${x.artikel ? x.artikel + ' ' : ''}${x.wort}`, meaning_native: x.bedeutung_fa || '', example_sentence: x.beispiel || '', collocations: x.koll || [] }
      : { id: 'tdm-' + (c?.key || ''), word: x.de || '', meaning_native: x.fa || '', example_sentence: x.beispiel || '', collocations: [] };
  }
  function syncSiteWord(c, ok) {
    if (!c) return;
    const it = siteVocabItem(c);
    try { if (typeof recordVocabularyProgress === 'function') recordVocabularyProgress(it, ok ? 2 : 0, 'tdm', { expectedSeconds: 30, actualSeconds: 20 }); } catch (e) { console.warn(e); }
    try { if (!ok && typeof rememberVocabUnknown === 'function') rememberVocabUnknown(it, 'tdm'); } catch (e) { console.warn(e); }
  }
  // new words are registered as "seen" in the site's word list (no score until they are reviewed)
  function registerSiteWords(list) {
    if (typeof vocabularyLexemeKey !== 'function') return;
    S.wordProgress = S.wordProgress && typeof S.wordProgress === 'object' ? S.wordProgress : {};
    const now = new Date().toISOString();
    list.forEach((it) => { const lexeme = vocabularyLexemeKey(it); if (!lexeme) return; const key = `lexeme|${lexeme}`; if (S.wordProgress[key]) return; S.wordProgress[key] = { key, wordId: typeof vocabularyStableId === 'function' ? vocabularyStableId(it, 'testdaf-method') : 'word-' + lexeme, lexeme, topicKey: 'testdaf-method', word: it.word, source: 'tdm', firstSeenAt: now, lastSeenAt: now, reviewCount: 0, lastRating: null, knownCount: 0 }; });
  }
  function favWordItem(x) { return { kind: 'vocabulary', title: `${x.artikel ? x.artikel + ' ' : ''}${x.wort}`, subtitle: [x.wortart, x.plural && x.plural !== '—' ? 'Pl. ' + x.plural : '', x.perfekt ? 'Perfekt: ' + x.perfekt : ''].filter(Boolean).join(' · '), answer: x.bedeutung_fa || '', explanation: x.beispiel || '', context: (x.koll || []).join(' · '), topic: 'Lernplan', source: 'tdm', sourceId: 'tdm-wort:' + x.wort }; }
  function favRedItem(x) { return { kind: 'structure', title: x.de, answer: x.fa || '', explanation: x.beispiel || '', topic: 'Lernplan', source: 'tdm', sourceId: 'tdm-redemittel:' + x.de }; }
  function favHtml(it) { return typeof favoriteButton === 'function' ? `<span class="tdm-fav" onclick="event.stopPropagation()">${favoriteButton(it)}</span>` : ''; }
  const favCard = (c) => favHtml(c.type === 'wort' ? favWordItem(c.data) : favRedItem(c.data));
  TDM.flip = function (key) { const w = work(); w.checked['flip:' + key] = true; saveData(); render(); };
  function srsCards(list, kind) {
    const w = work();
    if (!list.length) return rtl(`<p class="tdm-muted">${kind === 'wort' ? 'فعلاً لغتی برای مرور سررسید نشده است. لغات امروز از فردا وارد چرخه مرور (۱، ۳، ۷، ۱۴ روز) می‌شوند.' : 'فعلاً Redemittel سررسیدی وجود ندارد.'}</p>`);
    return `<div class="tdm-cards">${list.map((c) => { const done = w.ans['srs:' + c.key], open = w.checked['flip:' + c.key], x = c.data; const front = c.type === 'wort' ? `${x.artikel ? x.artikel + ' ' : ''}${x.wort}` : x.de; return `<div class="tdm-flash tdm-flash-${E(c.type)} ${done ? 'is-' + done : ''}" data-m="FLASH-STAR2">${qdel(`TDM.srsDel('${E(c.key)}')`, L('حذف', 'Löschen', 'Delete'))}<div class="tdm-flash-front" dir="ltr"><b>${E(front)}</b>${c.type === 'wort' ? `<small>${E(x.wortart)}</small>` : ''}${favCard(c)}</div>${open || done ? `<div class="tdm-flash-back">${c.type === 'wort' ? `<p dir="rtl"><b>${E(x.bedeutung_fa)}</b></p><p dir="ltr">${x.plural && x.plural !== '—' ? `Pl. ${E(x.plural)} · ` : ''}${x.perfekt ? `Perfekt: ${E(x.perfekt)} · ` : ''}${E((x.koll || []).slice(0, 3).join(' · '))}</p><p dir="ltr" class="tdm-muted">${E(x.beispiel)}</p>` : `<p dir="rtl"><b>${E(x.fa)}</b></p><p dir="ltr" class="tdm-muted">${E(x.beispiel || '')}</p>`}${done ? '' : `<div class="tdm-flash-act"><button class="no" onclick="TDM.srsCard('${E(c.key)}',false)">✗ ${L('یادم نبود', 'Nicht gewusst')}</button><button class="ok" onclick="TDM.srsCard('${E(c.key)}',true)">✓ ${L('بلد بودم', 'Gewusst')}</button></div>`}</div>` : `<button class="tdm-btn ghost" onclick="TDM.flip('${E(c.key)}')">${L('اول به خاطر بیاور، بعد نشان بده', 'Erst erinnern, dann aufdecken')}</button>`}</div>`; }).join('')}</div>`;
  }

  // ---------- Grammatik & Wortschatz ----------
  function grammarOfWeek(week) { const g = ST.grammar; return g[(Math.max(1, week) - 1) % g.length]; }
  function ruleLines(rule) { /*AMK-STRUCT*/ // one structure per line; «Label:» in bold, the formula becomes a red box (amk-struct.js)
    const parts = String(rule || '').split(/(?<=\.)\s+(?=[A-ZÄÖÜ„])/).filter(Boolean);
    return `<div class="amk-rule" dir="ltr">${parts.map((p) => { const m = p.match(/^([^:]{2,40}):\s*(.+)$/); return m ? `<p><b>${E(m[1])}:</b> ${E(m[2])}</p>` : `<p>${E(p)}</p>`; }).join('')}</div>`;
  }
  function grammarCard(gr) { return `<div class="tdm-grammar"><p class="tdm-kicker">${L('گرامر هفته', 'Grammatik der Woche')} ${faNum(gr.week)}</p><h3 dir="ltr">${E(gr.title)}</h3>${rtl(`<p><b>${E(gr.fa)}</b></p>`)}${ruleLines(gr.rule)}<ul class="tdm-list" dir="ltr">${gr.forms.map((f) => `<li>${E(f)}</li>`).join('')}</ul>${rtl(`<p class="tdm-muted">⚠️ ${E(gr.mistakes)}</p>`)}</div>`; }
  function renderWortschatz(a, d, w, steps, i) {
    const key = steps[i].key, words = dayWords(d), k = d.date;
    let body = '';
    if (key === 'alt') {
      const pool = Object.values(M().srs).filter((x) => x.type === 'wort' && x.added < k).sort(() => 0.5 - Math.random()).slice(0, 8);
      if (!w.altKeys) { w.altKeys = pool.map((x) => x.key); saveData(); }
      const list = (w.altKeys || []).map((key2) => M().srs[key2]).filter(Boolean);
      body = card(`${rtl('<h4>یادآوری معنی و کاربرد لغات قبلی بدون نگاه به جزوه</h4><p class="tdm-muted">برای هر لغت اول معنی و یک ترکیب کاربردی را در ذهن (یا روی کاغذ) بگو، بعد کارت را باز کن.</p>')}${list.length ? srsCards(list, 'wort') : rtl('<p class="tdm-muted">امروز اولین روز است؛ هنوز لغت قبلی وجود ندارد. مستقیم به مرحله بعد برو.</p>')}`);
    } else if (key === 'neu') {
      words.forEach((v) => srsAdd('wort', (v.artikel ? v.artikel + ' ' : '') + v.wort, wordData(v), k));
      registerSiteWords(words.map((v) => siteVocabItem({ type: 'wort', key: 'wort:' + v.wort, data: wordData(v) })));
      body = card(`${rtl('<h4>پنج لغت جدید امروز (از متن Lesen امروز)</h4><p class="tdm-muted">برای هر لغت: Artikel، Plural، معنی، Wortart، پنج ترکیب و یک جمله نمونه. برای افعال شکل Perfekt هم ثبت شده است. این لغات خودکار وارد دفتر مرور (و خروجی Anki) می‌شوند.</p>')}
        <div class="tdm-words">${words.map((v) => `<article class="tdm-word" dir="ltr"><header><b>${E((v.artikel ? v.artikel + ' ' : '') + v.wort)}</b><span>${E(v.wortart)}</span>${favHtml(favWordItem(wordData(v)))}</header>
          <dl><dt>Plural</dt><dd>${E(v.plural || '—')}</dd>${v.perfekt ? `<dt>Perfekt</dt><dd>${E(v.perfekt)}</dd>` : ''}<dt>معنی</dt><dd dir="rtl">${E(v.bedeutung_fa)}</dd></dl>
          <p class="tdm-koll">${arr(v.kollokationen).map((c) => `<span>${E(c)}</span>`).join('')}</p><p class="tdm-ex">„${E(v.beispiel)}“</p></article>`).join('')}</div>`);
      saveData();
    } else if (key === 'redemittel') {
      (d.redemittel || []).forEach((r) => srsAdd('redemittel', r.de, { de: r.de, fa: r.fa, beispiel: r.beispiel || '' }, k));
      body = card(`${rtl('<h4>پنج Redemittel امروز</h4><p class="tdm-muted">ترکیب‌های کاربردی مثل eine Entscheidung treffen · zur Verfügung stehen · in Betracht ziehen</p>')}<div class="tdm-redemittel">${(d.redemittel || []).map((r) => `<article>${favHtml(favRedItem(r))}<b dir="ltr">${E(r.de)}</b>${rtl(E(r.fa))}<p dir="ltr" class="tdm-muted">${E(r.beispiel || '')}</p></article>`).join('')}</div>`);
      saveData();
    } else if (key === 'saetze') {
      const gr = grammarOfWeek(d.week);
      body = card(grammarCard(gr)) + card(`${rtl(`<h4>با لغات جدید پنج جمله بساز؛ حداقل دو جمله با ساختار «${E(gr.fa.split('(')[0].trim())}».</h4><p class="tdm-muted">${E(gr.task)}</p>`)}<p class="tdm-vline" dir="ltr">${words.map((v) => `<span>${E(v.wort)}</span>`).join('')}${(d.redemittel || []).map((r) => `<span class="r">${E(r.de)}</span>`).join('')}</p>
        ${[0, 1, 2, 3, 4].map((n) => `<div class="tdm-satz"><b>${faNum(n + 1)}</b>${inp('satz_' + n, n < 2 ? `Satz mit „${gr.title}“ …` : 'Satz mit einem neuen Wort …')}<label class="tdm-chk"><input type="checkbox" ${w.f['satzg_' + n] ? 'checked' : ''} onchange="TDM.f('satzg_${n}',this.checked)"> ${L('گرامر هفته', 'Grammatik')}</label></div>`).join('')}${aiSentencesHtml()}`);
    }
    return frame(a, d, steps, i, body);
  }

  // ---------- Wiederholung ----------
  function errorCardsHtml(list) {
    const w = work();
    return `<div class="tdm-cards">${list.map((e) => { const done = w.ans['err:' + e.id], open = w.checked['flip:err' + e.id]; return `<div class="tdm-flash ${done ? 'is-' + done : ''}">${qdel(`TDM.errDel('${E(e.id)}')`, L('حذف', 'Löschen', 'Delete'))}<div class="tdm-flash-front"><small>${E(e.category || '')}</small><b dir="ltr">${E(e.userAnswer || e.question || '')}</b>${e.userAnswer && e.question ? `<small dir="auto">${E(e.question)}</small>` : ''}</div>${open || done ? `<div class="tdm-flash-back"><p dir="ltr"><b>✓ ${E(e.correctAnswer || '')}</b></p>${e.explanation ? `<p dir="auto" class="tdm-muted">${E(e.explanation)}</p>` : ''}${done ? '' : `<div class="tdm-flash-act"><button class="no" onclick="TDM.errReview('${E(e.id)}',false)">✗</button><button class="ok" onclick="TDM.errReview('${E(e.id)}',true)">✓</button></div>`}</div>` : `<button class="tdm-btn ghost" onclick="TDM.flip('err${E(e.id)}')">${L('نشان بده', 'Aufdecken')}</button>`}</div>`; }).join('')}</div>`;
  }
  function prevPracticeDay(k) { const m = M(); return Object.keys(m.days).filter((x) => x < k && m.days[x].picks && m.days[x].mode !== 'eval').sort().pop() || null; }
  TDM.errReview = function (id, ok) { const w = work(); if (typeof reviewError === 'function') reviewError(id, ok ? 2 : 0, 30); w.ans['err:' + id] = ok ? 'ok' : 'no'; saveData(); render(); };
  /*QUICKDEL*/ const qdel = (fn, label) => `<button type="button" class="amk-qdel" title="${label}" aria-label="${label}" onclick="event.stopPropagation();event.preventDefault();${fn}">×</button>`;
  TDM.srsDel = function (key) { const m = M(); if (!m.srs[key]) return; delete m.srs[key]; saveData(); render(); };
  TDM.errDel = function (id) { S.errors = (S.errors || []).filter((e) => e.id !== id); S.reviewQueue = (S.reviewQueue || []).filter((x) => x !== id); if (S.currentReview && S.currentReview.id === id) { S.currentReview = null; S.reviewMode = false; S.reviewReveal = false; } saveData(); render(); };
  function quizBuild(k) {
    const m = M(), words = Object.values(m.srs).filter((x) => x.type === 'wort'), red = Object.values(m.srs).filter((x) => x.type === 'redemittel'), qs = [];
    const pick = (arr, n) => arr.slice().sort(() => 0.5 - Math.random()).slice(0, n);
    pick(words.filter((x) => x.data.artikel), 2).forEach((x) => qs.push({ id: 'a' + uid(), type: 'mc', q: `Welcher Artikel? ___ ${x.data.wort}`, options: ['der', 'die', 'das'], answer: ['der', 'die', 'das'].indexOf(x.data.artikel) }));
    pick(words, 2).forEach((x) => { const others = pick(words.filter((y) => y.key !== x.key), 2).map((y) => y.data.wort); if (others.length < 2) return; const opts = pick([x.data.wort, ...others], 3); qs.push({ id: 'm' + uid(), type: 'mc', q: `„${x.data.bedeutung_fa}“ = ?`, options: opts, answer: opts.indexOf(x.data.wort) }); });
    pick(red, 2).forEach((x) => { const others = pick(red.filter((y) => y.key !== x.key), 2).map((y) => y.data.de); if (others.length < 2) return; const opts = pick([x.data.de, ...others], 3); qs.push({ id: 'r' + uid(), type: 'mc', q: `„${x.data.fa}“ = ?`, options: opts, answer: opts.indexOf(x.data.de) }); });
    return qs.filter((q) => q.answer >= 0);
  }
  /*QZ-MODEL*/ function quizModel(w, n, q, t) {
    const id = 'qz:' + n, open = !!w.checked['r_' + id], right = E(String(q.options[q.answer]));
    if (t.done) return `<div class="tdm-model">✓ ${right}</div>`;
    return `<div class="tdm-reveal ${open ? 'is-open' : ''}"><button class="tdm-btn ghost" onclick="TDM.toggleReveal('${id}')">${open ? '▲' : '▼'} ${L('پاسخ نمونه', 'Musterlösung', 'Model answer')}</button>${open ? `<div class="tdm-reveal-body"><p dir="ltr"><b>${right}</b></p></div>` : ''}</div>`;
  }
  TDM.quizAns = function (qi, oi) { const w = work(); const t = w.quiz; if (!t || t.done) return; t.ans[qi] = oi; saveData(); render(); };
  TDM.quizDone = function () { const w = work(), t = w.quiz; if (!t) return; t.done = true; const c = t.qs.filter((q, n) => t.ans[n] === q.answer).length; t.pct = t.qs.length ? Math.round(c / t.qs.length * 100) : 0; t.qs.forEach((q, n) => recordAnswerPerformance({ skill: 'wiederholung', questionId: `tdm-${dayKey()}-quiz-${q.id}`, accuracy: t.ans[n] === q.answer ? 100 : 0, expectedSeconds: 20, actualSeconds: 20 })); saveData(); render(); };
  function renderWiederholung(a, d, w, steps, i) {
    const key = steps[i].key, k = d.date;
    let body = '';
    if (key === 'woerter') { if (!w.dueW) { w.dueW = uniqSrs(srsDue('wort', k)).slice(0, 15).map((x) => x.key); saveData(); } body = card(`${rtl('<h4>مرور لغات (روز قبل و موارد سررسید ۱-۳-۷-۱۴)</h4>')}${srsCards(uniqSrs(w.dueW.map((x) => M().srs[x])), 'wort')}`); }
    else if (key === 'grammatik') {
      const errs = (S.errors || []).filter((e) => typeof errorIsDue === 'function' ? errorIsDue(e) : true);
      const list = uniqErr([...errs.filter((e) => errorKind(e) === 'grammar'), ...errs.filter((e) => errorKind(e) !== 'grammar')]).slice(0, 8); /*WIED-UNIQ*/
      body = card(`${rtl('<h4>مرور اشتباهات (اول گرامری)</h4><p class="tdm-muted">اشتباه را بخوان، شکل درست را به خاطر بیاور، سپس کارت را باز کن.</p>')}${list.length ? errorCardsHtml(list) : rtl('<p class="tdm-muted">اشتباه سررسیدی برای مرور وجود ندارد. 👍</p>')}`);
    } else if (key === 'wiedergeben') {
      const pk = prevPracticeDay(k), pd = pk ? M().days[pk] : null, h = pd ? item('hoeren', pd.picks.hoeren) : null, l = pd ? item('lesen', pd.picks.lesen) : null;
      body = pd ? card(`${rtl('<h4>محتوای روز قبل را بدون نگاه به متن بازگو کن (شفاهی یا کتبی).</h4>')}<div class="tdm-grid2"><div class="tdm-mini" dir="ltr"><b>Hören</b><p>${E(h?.title || '—')}</p></div><div class="tdm-mini" dir="ltr"><b>Lesen</b><p>${E(l?.title || '—')}</p></div></div>
          ${recorderHtml('wiedergabe', { label: L('بازگویی', 'Wiedergabe'), limit: 120 })}${ta('wiedergabe', 'Gestern habe ich gehört/gelesen, dass …', 3)}
          ${reveal('wmodel', L('مقایسه با خلاصه‌ها', 'Mit Zusammenfassungen vergleichen'), `<p dir="ltr"><b>Hören:</b> ${E(h?.summary_model || '')}</p><p dir="ltr"><b>Lesen:</b> ${E(l?.summary_line || '')}</p>`)}`)
        : card(rtl('<p class="tdm-muted">هنوز روز قبلی ثبت نشده است. به‌جای آن، محتوای امروز را تا اینجا در دو یا سه جمله بازگو کن.</p>') + ta('wiedergabe', 'Heute habe ich gelernt, dass …', 3));
    } else if (key === 'redemittel') { if (!w.dueR) { w.dueR = uniqSrs(srsDue('redemittel', k)).slice(0, 12).map((x) => x.key); saveData(); } body = card(`${rtl('<h4>مرور Redemittel</h4>')}${srsCards(uniqSrs(w.dueR.map((x) => M().srs[x])), 'redemittel')}`); }
    else if (key === 'test') {
      if (!w.quiz) { w.quiz = { qs: quizBuild(k), ans: {}, done: false }; saveData(); }
      const t = w.quiz;
      body = card(`${rtl('<h4>آزمون از خود بدون جزوه</h4>')}${t.qs.length ? `<div class="tdm-questions">${t.qs.map((q, n) => `<article class="tdm-q ${t.done ? (t.ans[n] === q.answer ? 'ok' : 'bad') : ''}"><p class="tdm-qn">${faNum(n + 1)}</p><div class="tdm-qb"><h4 dir="auto">${E(q.q)}</h4><div class="tdm-opts">${q.options.map((o, oi) => `<button class="${t.ans[n] === oi ? 'is-sel' : ''} ${t.done && oi === q.answer ? 'is-right' : ''} ${t.done && t.ans[n] === oi && oi !== q.answer ? 'is-wrong' : ''}" onclick="TDM.quizAns(${n},${oi})"><b>${String.fromCharCode(65 + oi)}</b><span dir="ltr">${E(o)}</span></button>`).join('')}</div>${quizModel(w, n, q, t)}</div></article>`).join('')}</div>${t.done ? `<div class="tdm-score"><b>${faNum(t.pct)}%</b></div>` : `<button class="tdm-btn primary big wide" onclick="TDM.quizDone()">${L('ارزیابی', 'Auswerten')}</button>`}` : rtl('<p class="tdm-muted">برای ساخت آزمون هنوز لغت و Redemittel کافی ذخیره نشده است (از روز دوم فعال می‌شود). به‌جای آن، پنج لغت امروز را بدون نگاه بنویس.</p>') + ta('selftest', '…', 3)}`);
    }
    return frame(a, d, steps, i, body);
  }

  // ---------- Friday: Fehleranalyse & Wochenbericht ----------
  function weekMetrics(week) {
    const m = M(), [from, to] = weekRange(week), days = Object.values(m.days).filter((d) => d.date >= from && d.date <= to);
    const avg = (arr) => { const v = arr.filter((x) => Number.isFinite(x)); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; };
    const pick = (mod, field, modeFilter) => days.filter((d) => !modeFilter || modeFilter(d.mode)).map((d) => d.results?.[mod]?.[field]).filter((x) => x != null).map(Number);
    const evalDay = days.find((d) => d.mode === 'eval');
    const ev = (mod, f) => { const v = evalDay?.results?.[mod]?.[f]; return v == null ? null : Number(v); };
    const errs = m.log.filter((x) => x.date >= from && x.date <= to), cat = {};
    errs.forEach((x) => { const k = `${MODS[x.skill]?.de || x.skill} · ${catLabel(x.skill, x.cat)}`; cat[k] = (cat[k] || 0) + 1; });
    const seconds = days.reduce((s, d) => s + Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0), 0);
    const doneMods = days.reduce((s, d) => s + Object.keys(d.results || {}).filter((x) => x !== 'extra').length, 0), plannedMods = days.length * (LEAN() ? 4 : 6);
    return { week, from, to, days: days.length, hoeren: ev('hoeren', 'pct') ?? avg(pick('hoeren', 'pct')), lesen: ev('lesen', 'pct') ?? avg(pick('lesen', 'pct')), schreiben: ev('schreiben', 'score') ?? avg(pick('schreiben', 'score')), sprechen: ev('sprechen', 'score') ?? avg(pick('sprechen', 'score')), hoerenAvg: avg(pick('hoeren', 'pct')), lesenAvg: avg(pick('lesen', 'pct')), minutes: Math.round(seconds / 60), completion: plannedMods ? Math.round(doneMods / plannedMods * 100) : 0, errors: errs.length, cats: Object.entries(cat).sort((a, b) => b[1] - a[1]) };
  }
  TDM.weekMetrics = weekMetrics;
  function prevWeek(week) { if (week < 1) return null; const p = weekMetrics(week - 1); return p.days ? p : null; }
  const fmtPct = (v) => (v == null ? '—' : faNum(v) + '%');
  const delta = (a, b) => (a == null || b == null ? '' : `<em class="${a - b >= 0 ? 'up' : 'down'}">${a - b >= 0 ? '▲' : '▼'}${faNum(Math.abs(a - b))}</em>`);
  function compareTable(cur, prev) {
    const rows = [['Hören', 'hoeren'], ['Lesen', 'lesen'], ['Schreiben', 'schreiben'], ['Sprechen', 'sprechen'], [L('دقیقه مطالعه', 'Lernminuten'), 'minutes'], [L('انجام فعالیت‌ها', 'Erledigt'), 'completion'], [L('اشتباهات ثبت‌شده', 'Fehler'), 'errors']];
    return `<table class="tdm-table tdm-compare"><thead><tr><th></th><th>${L('هفته', 'Woche')} ${faNum(cur.week)}</th><th>${prev ? L('هفته', 'Woche') + ' ' + faNum(prev.week) : '—'}</th></tr></thead><tbody>${rows.map(([l, k]) => `<tr><td>${E(l)}</td><td><b>${['minutes', 'errors'].includes(k) ? faNum(cur[k] ?? '—') : fmtPct(cur[k])}</b> ${prev && !['errors'].includes(k) ? delta(cur[k], prev[k]) : ''}</td><td>${prev ? (['minutes', 'errors'].includes(k) ? faNum(prev[k] ?? '—') : fmtPct(prev[k])) : '—'}</td></tr>`).join('')}</tbody></table>`;
  }
  TDM.toggleTop = function (label, el) { const w = work(); w.f.top = w.f.top || []; const i = w.f.top.indexOf(label); if (i >= 0) w.f.top.splice(i, 1); else if (w.f.top.length < 3) w.f.top.push(label); else return; scheduleSave(); el?.classList.toggle('is-sel', w.f.top.includes(label)); };
  // weekly AI analysis: shared by the Fehleranalyse and Wochenbericht modules (whichever runs first)
  function weekErrors(week) { const [from, to] = weekRange(week); return (S.errors || []).filter((e) => e.source === 'tdm' && String(e.createdAt || '').slice(0, 10) >= from && String(e.createdAt || '').slice(0, 10) <= to); }
  function weeklyAI(d) { return d.work.fehleranalyse?.ai?.week?.top_errors ? d.work.fehleranalyse.ai.week : d.work.wochenbericht?.ai?.week?.top_errors ? d.work.wochenbericht.ai.week : null; }
  function runWeekly() {
    const d = curDay(), cur = weekMetrics(d.week), prev = prevWeek(d.week);
    const errors = weekErrors(d.week).slice(-60).map((e) => ({ category: String(e.category || '').slice(0, 110), question: String(e.question || '').slice(0, 280), wrong: String(e.userAnswer || '').slice(0, 280), right: String(e.correctAnswer || '').slice(0, 280) }));
    aiCall('week', '/method/weekly-analysis', { week: d.week, metrics: cur, previous: prev, category_counts: Object.fromEntries(cur.cats), errors }, (r, wk) => {
      if (!(wk.f.top || []).length) wk.f.top = (r.top_errors || []).map((t) => t.label);
      (r.weaknesses || []).forEach((x, n) => { if (!wk.f['weak_' + n]) wk.f['weak_' + n] = x.label_fa; });
    });
  }
  function weeklyHtml(r, part) {
    if (part === 'errors') return `<div class="tdm-ai-errors">${(r.top_errors || []).map((t, n) => `<div><p dir="auto"><b>${faNum(n + 1)}. ${E(t.label)}</b></p>${rtl(`<p>${E(t.explanation_fa)}</p>`)}${t.example_de ? `<p dir="ltr" class="tdm-evq">${E(t.example_de)}</p>` : ''}${t.fix_fa ? rtl(`<p class="tdm-muted">🛠 ${E(t.fix_fa)}</p>`) : ''}</div>`).join('')}</div>`;
    return `${r.progress_fa ? rtl(`<p>${E(r.progress_fa)}</p>`) : ''}<div class="tdm-ai-errors">${(r.weaknesses || []).map((x) => `<div>${rtl(`<p><b>${E(x.label_fa)}</b></p><p class="tdm-muted">${E(x.evidence_fa)}</p>`)}</div>`).join('')}</div>${(r.plan_fa || []).length ? rtl(`<h4>برنامه پیشنهادی هفته بعد</h4><ol class="tdm-ol">${r.plan_fa.map((p) => `<li>${E(p)}</li>`).join('')}</ol>`) : ''}`;
  }
  function weeklyStatus(d) {
    const st = aiState('week'), r = work().ai?.week;
    if (weeklyAI(d)) return '';
    if (!aiOn()) return '';
    if (st === 'error') return aiFailed('week', r, L('در این حالت موارد را خودت انتخاب کن.', 'Wähle die Punkte dann selbst aus.'));
    return aiLoading(L('هوش مصنوعی در حال تحلیل اشتباه‌ها و نتایج این هفته است…', 'Die KI analysiert deine Woche …'));
  }
  function renderFehleranalyse(a, d, w, steps, i) {
    const key = steps[i].key, cur = weekMetrics(d.week), prev = prevWeek(d.week);
    if (!weeklyAI(d)) autoAI('week', runWeekly);
    const r = weeklyAI(d);
    let body = '';
    if (key === 'woche') {
      const errs = weekErrors(d.week);
      body = card(`${rtl(`<h4>🤖 سه اشتباه پرتکرار این هفته</h4>`)}${r ? weeklyHtml(r, 'errors') : weeklyStatus(d)}`, 'tdm-ai')
        + card(`${rtl(`<h4>اشتباهات این هفته (${faNum(errs.length)}) بر اساس دسته</h4><p class="tdm-muted">${r ? 'برای مرجع؛ انتخاب سه مورد پرتکرار خودکار انجام شد.' : 'سه مورد پرتکرار را انتخاب کن.'}</p>`)}<div class="tdm-chips big">${cur.cats.map(([l, n]) => `<button class="${(w.f.top || []).includes(l) ? 'is-sel' : ''}" onclick="TDM.toggleTop(${E(JSON.stringify(l))},this)">${E(l)} <b>${faNum(n)}</b></button>`).join('') || rtl('<p class="tdm-muted">هنوز اشتباهی ثبت نشده است.</p>')}</div>`)
        + card(`<h4 dir="auto">${L('نمونه‌ها', 'Beispiele')}</h4><div class="tdm-errlist">${errs.slice(-14).reverse().map((e) => `<div><small>${E(e.category)}</small><p dir="ltr">${E(e.userAnswer || e.question)} → <b>${E(e.correctAnswer)}</b></p></div>`).join('') || '—'}</div>`);
    } else if (key === 'wiederholung') {
      if (!w.dueAll) { w.dueAll = [...srsDue('wort'), ...srsDue('redemittel')].slice(0, 20).map((x) => x.key); saveData(); }
      body = card(`${rtl('<h4>مرور همه موارد سررسید (لغات و Redemittel)</h4><p class="tdm-muted">جمعه روز یادگیری مطالب جدید نیست؛ روز ارزیابی و تثبیت است.</p>')}${srsCards(w.dueAll.map((x) => M().srs[x]).filter(Boolean), 'wort')}`);
    } else body = card(`${rtl('<h4>مقایسه نتایج با هفته قبل</h4>')}${compareTable(cur, prev)}`)
      + card(`${rtl('<h4>🤖 سه ضعف اصلی و برنامه هفته بعد</h4>')}${r ? weeklyHtml(r, 'weak') : weeklyStatus(d)}`, 'tdm-ai')
      + card(`${rtl(r ? '<h4>سه ضعف اصلی (خودکار پر شد؛ قابل ویرایش)</h4>' : '<h4>سه ضعف اصلی برای هفته آینده</h4>')}${[0, 1, 2].map((n) => inp('weak_' + n, `${n + 1}. …`)).join('')}`);
    return frame(a, d, steps, i, body);
  }
  TDM.saveReport = function () {
    const d = curDay(), w = work(), m = M(), fw = d.work.fehleranalyse || { f: {} }, cur = weekMetrics(d.week), r = weeklyAI(d);
    const rep = { week: d.week, from: cur.from, to: cur.to, metrics: cur, frequent: [0, 1, 2].map((n) => w.f['freq_' + n] || (fw.f.top || [])[n] || '').filter(Boolean), weak: [0, 1, 2].map((n) => w.f['weak_' + n] || fw.f['weak_' + n] || '').filter(Boolean), goal: w.f.goal || '', success: w.f.success || '', schreibenNote: w.f.schreiben || '', sprechenNote: w.f.sprechen || '', plan: r?.plan_fa || [], progress: r?.progress_fa || '', savedAt: new Date().toISOString(), phase: m.phase, diag: d.week === 0 };
    m.weekly['W' + d.week] = rep; saveData(); render();
  };
  TDM.setPhase = async function (p) { const m = M(); if (!await appConfirm(L(`فاز برنامه به ${faNum(p)} تغییر کند؟`, `Zu Phase ${p} wechseln?`))) return; m.phase = p; (m.phaseHistory = m.phaseHistory || []).push({ phase: p, date: today() }); saveData(); render(); };
  function phaseAdvice(cur) {
    const m = M(), vals = [cur.hoeren, cur.lesen, cur.schreiben, cur.sprechen];
    if (vals.some((v) => v == null)) return null;
    const min = Math.min(...vals);
    if (m.phase === 1 && min >= 55 && cur.completion >= 70) return { to: 2, text: 'نتایج این هفته برای ورود به Phase 2 (تقویت مهارت آزمونی) کافی است.' };
    if (m.phase === 2 && min >= 65 && cur.completion >= 70 && cur.week >= 5) return { to: 3, text: 'نتایج نشان می‌دهد آماده شبیه‌سازی کامل آزمون (Phase 3) هستی.' };
    return { to: null, text: `هنوز در Phase ${m.phase} بمان؛ ورود به مرحله بعد باید بر اساس عملکرد واقعی باشد (حداقل ${m.phase === 1 ? '۵۵' : '۶۵'}٪ در هر مهارت و انجام حداقل ۷۰٪ فعالیت‌ها).` };
  }
  function renderWochenbericht(a, d, w, steps, i) {
    const cur = weekMetrics(d.week), prev = prevWeek(d.week), fw = d.work.fehleranalyse || { f: {} }, saved = M().weekly['W' + d.week], adv = phaseAdvice(cur);
    const pre = (k, fallback) => (w.f[k] !== undefined ? w.f[k] : fallback || '');
    if (!weeklyAI(d)) autoAI('week', runWeekly);
    const ai = weeklyAI(d);
    // prefill from the Fehleranalyse choices, else from the AI analysis; the learner can still edit every field
    if (w.f.freq_0 === undefined) { const top = (fw.f.top || []).length ? fw.f.top : (ai?.top_errors || []).map((t) => t.label); if (top.length) top.forEach((t, n) => { w.f['freq_' + n] = t; }); }
    if (w.f.weak_0 === undefined) [0, 1, 2].forEach((n) => { const v = fw.f['weak_' + n] || ai?.weaknesses?.[n]?.label_fa; if (v) w.f['weak_' + n] = v; });
    if (w.f.goal === undefined && ai?.goal_fa) w.f.goal = ai.goal_fa;
    const body = card(`<div class="tdm-report-head"><div><p class="tdm-kicker">${d.week === 0 ? L('گزارش وضعیت اولیه (Diagnose)', 'Ausgangslage') : L('گزارش هفتگی', 'Wochenbericht')}</p><h3 dir="auto">${L('هفته ارزیابی', 'Woche')}: ${faNum(d.week)} <small>${E(cur.from)} → ${E(cur.to)}</small></h3></div>${saved ? `<span class="tdm-tag ok">✓ ${L('ذخیره شد', 'Gespeichert')}</span>` : ''}</div>
        <div class="tdm-out four"><div><small>${L('درصد موفقیت Hören', 'Hören')}</small><b>${fmtPct(cur.hoeren)}</b>${delta(cur.hoeren, prev?.hoeren)}</div><div><small>${L('درصد موفقیت Lesen', 'Lesen')}</small><b>${fmtPct(cur.lesen)}</b>${delta(cur.lesen, prev?.lesen)}</div><div><small>${L('ارزیابی Schreiben', 'Schreiben')}</small><b>${fmtPct(cur.schreiben)}</b>${delta(cur.schreiben, prev?.schreiben)}</div><div><small>${L('ارزیابی Sprechen', 'Sprechen')}</small><b>${fmtPct(cur.sprechen)}</b>${delta(cur.sprechen, prev?.sprechen)}</div></div>
        ${rtl('<p class="tdm-muted">Schreiben: گرامر، واژگان، انسجام و انجام وظیفه · Sprechen: روانی، دقت، ساختار و انجام وظیفه (میانگین خودارزیابی ۱ تا ۵ × ۲۰)</p>')}`)
      + (ai ? card(`${rtl('<h4>🤖 خلاصه هوشمند هفته</h4>')}${weeklyHtml(ai, 'weak')}`, 'tdm-ai') : aiOn() ? card(weeklyStatus(d), 'tdm-ai') : '')
      + card(`${rtl(ai ? '<h4>سه اشتباه پرتکرار (خودکار پر شد؛ قابل ویرایش)</h4>' : '<h4>سه اشتباه پرتکرار</h4>')}${[0, 1, 2].map((n) => `<input dir="auto" class="tdm-input" value="${E(pre('freq_' + n))}" placeholder="${n + 1}." oninput="TDM.f('freq_${n}',this.value)">`).join('')}
        ${rtl('<h4>سه ضعف اصلی</h4>')}${[0, 1, 2].map((n) => `<input dir="auto" class="tdm-input" value="${E(pre('weak_' + n))}" placeholder="${n + 1}." oninput="TDM.f('weak_${n}',this.value)">`).join('')}
        ${rtl('<h4>هدف هفته آینده</h4>')}${ta('goal', 'Nächste Woche will ich …', 2)}
        ${rtl(`<h4>معیار موفقیت</h4><p class="tdm-muted">${E(ST.success)}</p>`)}${ta('success', L('این هفته توانستم … که هفته قبل برایم سخت بود.', 'Diese Woche konnte ich …'), 2)}
        <button class="tdm-btn success big wide" onclick="TDM.saveReport()">💾 ${L('ذخیره گزارش هفتگی', 'Bericht speichern')}</button>`)
      + card(`${rtl('<h4>مقایسه با هفته قبل</h4>')}${compareTable(cur, prev)}`)
      + '';
    return frame(a, d, steps, i, body);
  }

  // ═════════════ PLAN TAB vs FREE-STUDY TAB ═════════════
  // The dashboard holds two separate workspaces. «برنامه» is the fixed 240-minute method plan (+ optional extra time);
  // «مطالعه آزاد» is the site's own slider-based plan. Only one is loaded into S.plan at a time; the other waits in
  // S.planStash, so every original code path (timers, completion, history segments) keeps working on a single plan.
  function stash() { if (!S.planStash || typeof S.planStash !== 'object') S.planStash = {}; return S.planStash; }
  function captureCtx() { return { plan: S.plan, completedActivities: S.completedActivities || [], activityProgress: S.activityProgress || {}, activityTimers: S.activityTimers || {}, activityPoints: S.activityPoints || {}, totalPoints: S.totalPoints || 0, totalMinutes: S.totalMinutes || 0 }; }
  function applyCtx(c) { S.plan = c?.plan || null; S.completedActivities = c?.completedActivities || []; S.activityProgress = c?.activityProgress || {}; S.activityTimers = c?.activityTimers || {}; S.activityPoints = c?.activityPoints || {}; S.totalPoints = c?.totalPoints || 0; S.totalMinutes = c?.totalMinutes || 0; }
  const curMode = () => (S.studyMode === 'free' ? 'free' : 'plan');
  TDM.studyMode = curMode;
  TDM.setStudyMode = function (mode) {
    mode = mode === 'free' ? 'free' : 'plan';
    if (!TDM.enrolled() || S.planPreparing || S.resourceLoading) return;
    const cur = curMode();
    if (mode === cur) { if (S.screen !== 'dashboard') { S.screen = 'dashboard'; render(); } return; }
    try { stopTimers(); } catch (e) { /* ignore */ }
    stopAudio(); stopRecorder(true);
    const k = today(), st = stash();
    if (S.plan) { try { upsertDailyHistorySegment(currentPlanHistorySnapshot()); } catch (e) { console.warn(e); } }
    st[cur] = S.plan && S.plan.date === k ? captureCtx() : null;
    const next = st[mode]; st[mode] = null;
    S.studyMode = mode; S.studyModeDate = k;
    applyCtx(next && next.plan && next.plan.date === k ? next : null);
    S.activeActivity = null; S.showPlanEditor = false; S.screen = 'dashboard';
    saveData();
    if (!S.plan && typeof generatePlan === 'function') generatePlan(); else render();
    try { window.scrollTo({ top: 0 }); } catch (e) { /* ignore */ }
  };
  // Called at the start of ensureTodayPlan(): stale workspaces are dropped (their history segment was written when
  // the tab was left) and every new day starts on the plan tab.
  TDM.rollover = function () {
    const k = today(), st = stash();
    ['plan', 'free'].forEach((x) => { if (st[x] && st[x].plan?.date !== k) st[x] = null; });
    if (S.studyMode !== 'free') return;
    const stale = S.plan ? S.plan.date !== k : S.studyModeDate !== k;
    if (stale) { S.studyMode = 'plan'; S.studyModeDate = k; return; }
    if (!S.plan && st.plan) { S.studyMode = 'plan'; applyCtx(st.plan); st.plan = null; }
  };
  function ctxInfo(mode) {
    const k = today(), c = mode === curMode() ? { plan: S.plan, completedActivities: S.completedActivities } : stash()[mode];
    if (!c?.plan || c.plan.date !== k) return '';
    return `${faNum((c.completedActivities || []).length)}/${faNum(c.plan.activities?.length || 0)}`;
  }
  TDM.renderModeTabs = function () {
    const mode = curMode();
    const tab = (m, icon, title, sub) => { const info = ctxInfo(m); return `<button type="button" role="tab" aria-selected="${m === mode}" class="${m === mode ? 'is-cur' : ''}" onclick="TDM.setStudyMode('${m}')"><span class="tdm-mode-ico" aria-hidden="true">${icon}</span><span class="tdm-mode-txt"><b>${E(title)}</b><small>${E(sub)}</small></span>${info ? `<em>${info}</em>` : ''}</button>`; };
    return `<div class="slide-up tdm-modebar" role="tablist" data-learning-content dir="${isFa() ? 'rtl' : 'ltr'}">${tab('plan', '📋', L('برنامه یادگیری', 'Lernplan', 'Learning plan'), (dailyMin() === DEFAULT_DAILY ? L('۱۲۰ دقیقه (۲ ساعت) پیشنهادی + زمان اضافه', '120 Min. empfohlen + Extrazeit', '120 min recommended + extra time') : L(`${faNum(dailyMin())} دقیقه در روز + زمان اضافه`, `${dailyMin()} Min. pro Tag + Extrazeit`, `${dailyMin()} min a day + extra time`)))}${tab('free', '🕘', L('مطالعه آزاد', 'Freies Lernen'), L('ساعت مطالعه را خودت تعیین می‌کنی', 'Lernzeit selbst festlegen'))}</div>`;
  };
  TDM.listTitle = function () { return curMode() === 'free' ? `${L('مطالعه آزاد', 'Freies Lernen')} · ${examPlanLabel()}` : `${L('برنامه یادگیری', 'Lernplan', 'Learning plan')} · ${L(`برنامه روزانه ${faNum(dailyMin())} دقیقه`, `Tagesplan ${dailyMin()} Min.`, `Daily plan ${dailyMin()} min`)}`; };
  const hm = (min) => { const h = Math.floor(min / 60), mm = min % 60; return isFa() ? `${faNum(h)} ساعت${mm ? ' و ' + faNum(mm) + ' دقیقه' : ''}` : `${h} h${mm ? ' ' + mm + ' min' : ''}`; };
  // «برنامه امروز» card removed from the dashboard (2026-11-12, owner: its info repeated the other cards)
  TDM.renderPlanTimeCard = function () { return ''; };
  /*DPROG*/ // daily progress: the original content (ring, activity list, 3 stats) in a cleaner full-width layout (v2, 2026-11-12)
  TDM.renderDailyProgress = function (o) {
    try {
      o = o || {};
      const acts = (S.plan?.activities || []).filter((a) => Number(a.dur) > 0), done = new Set(S.completedActivities || []), tm = S.activityTimers || {};
      const pct = Math.max(0, Math.min(100, Math.round(Number(o.pct) || 0))), comp = Number(o.comp) || 0, tot = Number(o.tot) || acts.length;
      const fa = isFa();
      const row = (a) => {
        const sec = Number(tm[a.id]) || 0, ok = done.has(a.id), f = ok ? 100 : Math.min(100, Math.round(sec / ((Number(a.dur) || 1) * 60) * 100)), c = MODS[a.id]?.color || '#64748b';
        const nm = (fa ? MODS[a.id]?.fa : MODS[a.id]?.de) || a.title || a.id;
        return `<li class="${ok ? 'is-done' : sec ? 'is-run' : ''}" style="--c:${c}"><span class="tdm-dp-name"><i aria-hidden="true"></i>${E(nm)}</span><span class="tdm-dp-bar"><b style="width:${f}%"></b></span><small>${ok ? '✓' : `${faNum(Math.floor(sec / 60))}/${faNum(a.dur)}′`}</small></li>`;
      };
      const stat = (label, val, c) => `<div class="tdm-dp-stat"><span><i style="background:${c}"></i>${E(label)}</span><b dir="ltr">${E(val)}</b></div>`;
      return `<article class="execution-card execution-progress-card slide-up tdm-dp" data-learning-content aria-labelledby="dailyProgressTitle" dir="${fa ? 'rtl' : 'ltr'}">
        <div class="tdm-dp-top">
          <div class="tdm-dp-head"><span class="tdm-dp-eyebrow">${L('پیشرفت', 'FORTSCHRITT', 'PROGRESS')}</span><h2 id="dailyProgressTitle">${L('پیشرفت روزانه', 'Tagesfortschritt', 'Daily progress')}</h2><p>${faNum(comp)}/${faNum(tot)} ${L('فعالیت تکمیل‌شده', 'Aktivitäten abgeschlossen', 'activities completed')} · ${faNum(Number(o.answered) || 0)} ${L('پاسخ ارزیابی‌شده', 'Antworten bewertet', 'answers rated')}</p></div>
          <div class="tdm-dp-ring" role="progressbar" aria-label="${E(L('پیشرفت روزانه', 'Tagesfortschritt', 'Daily progress'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--p:${pct}"><div><b>${faNum(pct)}${fa ? '٪' : '%'}</b><span>${L('انجام‌شده', 'erledigt', 'done')}</span></div></div>
        </div>
        ${acts.length ? `<ul class="tdm-dp-list">${acts.map(row).join('')}</ul>` : ''}
        <div class="tdm-dp-stats">${stat(L('زمان یادگیری', 'Lernzeit', 'Learning time'), o.time || '00:00', '#38bdf8')}${stat(L('انجام شد', 'Erledigt', 'Done'), `${faNum(comp)}/${faNum(tot)}`, '#a855f7')}${stat(L('امتیاز فعلی', 'Aktueller Score', 'Current score'), o.score == null ? '—' : `${faNum(o.score)}/${faNum(100)}`, '#fb7185')}</div>
      </article>`;
    } catch (e) { console.warn(e); return ''; }
  };
  TDM.setExtra = function (min) {
    if (!TDM.active() || !S.plan || LEAN()) return; /*LEAN4*/
    min = EXTRA_CHOICES.includes(Number(min)) ? Number(min) : 0;
    if ((S.completedActivities || []).includes('extra')) return;
    if (!min && (Number(S.activityTimers?.extra) || 0) > 0) return;
    const k = S.plan.date || today(), d = ensureDay(k), cur = S.plan.activities.find((a) => a.id === 'extra');
    d.extraMin = min;
    const list = S.plan.activities.filter((a) => a.id !== 'extra');
    if (min > 0) list.push(cur ? { ...cur, dur: min } : extraActivity(k, min));
    S.plan.activities = list;
    S.plan.totalMinutes = list.reduce((s, a) => s + (Number(a.dur) || 0), 0);
    S.plan.availableMinutes = dailyMin() + min;
    try { upsertDailyHistorySegment(currentPlanHistorySnapshot()); } catch (e) { console.warn(e); }
    saveData(); render();
  };

  // ---------- extra learning time ----------
  /*EXTRA-SATZ*/ // 2026-11-14 (user): Extra-Lernzeit = sentence building with today's Wiederholung items + the most common structures; self-check with model sentences (no AI)
  const SX_STRUCT = [
    { id: 'weil', t: 'weil / da + Nebensatz', fa: 'دلیل آوردن؛ فعل صرف‌شده آخر جمله', p: 'Hauptsatz, weil + Subjekt … + Verb', ex: 'Viele Studierende arbeiten neben dem Studium, weil die Mieten stark gestiegen sind.' },
    { id: 'obwohl', t: 'obwohl + Nebensatz', fa: 'تضاد / با وجود اینکه؛ فعل آخر جمله', p: 'Obwohl + Subjekt … + Verb, Verb + Subjekt …', ex: 'Obwohl das Angebot groß ist, nutzen es nur wenige Menschen.' },
    { id: 'dass', t: 'Meinung + dass-Satz', fa: 'بیان نظر با dass؛ فعل آخر جمله', p: 'Ich bin der Meinung, dass + Subjekt … + Verb', ex: 'Ich bin der Meinung, dass digitale Medien den Unterricht verbessern können.' },
    { id: 'relativ', t: 'Relativsatz', fa: 'جمله موصولی (der/die/das …)؛ فعل آخر', p: 'Nomen, der/die/das + … + Verb', ex: 'Das ist ein Problem, das viele junge Menschen betrifft.' },
    { id: 'umzu', t: 'um … zu / damit', fa: 'هدف: um…zu (فاعل یکسان)، damit (فاعل متفاوت)', p: '…, um + … + zu + Infinitiv', ex: 'Man sollte früh mit der Vorbereitung beginnen, um genug Zeit für Wiederholungen zu haben.' },
    { id: 'passiv', t: 'Passiv: werden + Partizip II', fa: 'مجهول؛ تمرکز روی عمل نه انجام‌دهنده', p: 'Subjekt + wird/werden + … + Partizip II', ex: 'In vielen Städten wird der Radverkehr stärker gefördert.' },
    { id: 'konj2', t: 'Konjunktiv II: sollte / könnte / würde', fa: 'پیشنهاد و فرض مؤدبانه', p: 'Subjekt + sollte/könnte/würde + … + Infinitiv', ex: 'Die Universitäten sollten mehr günstige Wohnheimplätze anbieten.' },
    { id: 'jedesto', t: 'je … desto', fa: 'هرچه … بیشتر، … بیشتر', p: 'Je + Komparativ … Verb, desto + Komparativ + Verb …', ex: 'Je früher man mit dem Lernen beginnt, desto besser sind die Ergebnisse.' },
    { id: 'nichtnur', t: 'nicht nur … sondern auch', fa: 'نه‌تنها … بلکه …', p: '… nicht nur + A, sondern auch + B', ex: 'Das Problem betrifft nicht nur Studierende, sondern auch viele Familien.' },
    { id: 'einerseits', t: 'einerseits … andererseits', fa: 'از یک طرف … از طرف دیگر (مقایسه دو جنبه)', p: 'Einerseits + Verb …, andererseits + Verb …', ex: 'Einerseits spart Homeoffice Zeit, andererseits fehlt oft der persönliche Kontakt.' },
    { id: 'zuinf', t: 'Es ist … , … zu + Infinitiv', fa: 'ساختار مصدری با zu', p: 'Es ist wichtig/sinnvoll, … zu + Infinitiv', ex: 'Es ist sinnvoll, sich rechtzeitig über die Prüfung zu informieren.' },
    { id: 'wenn', t: 'wenn + Nebensatz (Bedingung)', fa: 'شرط؛ فعل آخر جمله، بعد فعل جمله اصلی', p: 'Wenn + Subjekt … + Verb, Verb + Subjekt …', ex: 'Wenn mehr Menschen mit dem Fahrrad fahren, sinkt die Belastung der Luft.' }
  ];
  const sxNorm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
  function uniqSrs(list) { const seen = new Set(); return list.filter((x) => { if (!x) return false; const d = x.data || {}, k = x.type + '|' + sxNorm(x.type === 'wort' ? d.wort : d.de); if (seen.has(k)) return false; seen.add(k); return true; }); }
  function uniqErr(list) { const seen = new Set(); return list.filter((e) => { if (!e) return false; const k = sxNorm(e.userAnswer || e.question) + '|' + sxNorm(e.correctAnswer); if (seen.has(k)) return false; seen.add(k); return true; }); }
  function sxBuild(d) {
    const k = d.date, m = M(), wd = (d.work || {}).wiederholung || {};
    const recent = (type) => Object.values(m.srs).filter((x) => x.type === type).sort((a, b) => String(b.added).localeCompare(String(a.added)));
    const pickSrs = (keys, type, n) => { let l = uniqSrs((keys || []).map((x) => m.srs[x])); if (!l.length) l = uniqSrs(srsDue(type, k)); if (l.length < n) l = uniqSrs([...l, ...recent(type)]); return l.slice(0, n).map((x) => x.key); };
    const due = (S.errors || []).filter((e) => (typeof errorIsDue === 'function' ? errorIsDue(e) : true) && e.correctAnswer);
    let errs = uniqErr([...due.filter((e) => errorKind(e) === 'grammar'), ...due.filter((e) => errorKind(e) !== 'grammar')]);
    if (errs.length < 3) errs = uniqErr([...errs, ...(S.errors || []).filter((e) => e.correctAnswer).slice().reverse()]);
    const off = Math.abs([...String(k)].reduce((s, c) => s * 31 + c.charCodeAt(0) | 0, 7)) % SX_STRUCT.length;
    let n = 0; const st = () => SX_STRUCT[(off + n++) % SX_STRUCT.length].id;
    return {
      woerter: pickSrs(wd.dueW, 'wort', 5).map((key) => ({ key, st: st() })),
      redemittel: pickSrs(wd.dueR, 'redemittel', 4).map((key) => ({ key, st: st() })),
      fehler: errs.slice(0, 3).map((e) => ({ id: e.id, st: st() }))
    };
  }
  const sxSt = (id) => SX_STRUCT.find((x) => x.id === id) || SX_STRUCT[0];
  function sxRow(key, n, head, st, model) {
    const w = work(), f = 'sx_' + key + '_' + n, ok = w.f['sxok_' + key + '_' + n];
    return `<article class="tdm-sx ${ok ? 'is-ok' : ''}">
      <header><b class="tdm-sx-n">${faNum(n + 1)}</b><div class="tdm-sx-item">${head}</div></header>
      <p class="tdm-sx-st"><span class="tdm-sx-chip" dir="ltr">${E(st.t)}</span> <small dir="rtl">${E(st.fa)}</small></p>
      <p class="tdm-sx-pat" dir="ltr">${E(st.p)}</p>
      ${ta(f, L('جمله خودت را بنویس…', 'Dein Satz …', 'Your sentence …'), 2)}
      ${reveal('sx' + key + n, L('جمله‌های نمونه', 'Mustersätze', 'Model sentences'), `<p dir="ltr"><b>${E(st.t)}:</b> ${E(st.ex)}</p>${model ? `<p dir="ltr" class="tdm-muted">${model}</p>` : ''}`)}
      <label class="tdm-chk"><input type="checkbox" ${ok ? 'checked' : ''} onchange="TDM.f('sxok_${key}_${n}',this.checked);this.closest('.tdm-sx').classList.toggle('is-ok',this.checked)"> ${L('جمله‌ام با ساختار درست بود', 'Mein Satz passt zur Struktur', 'My sentence fits the structure')}</label>
    </article>`;
  }
  function renderExtra(a, d, w, steps, i) {
    const key = steps[i].key, m = M();
    if (!w.sx) { w.sx = sxBuild(d); saveData(); }
    const intro = (fa) => rtl(`<h4>${fa}</h4><p class="tdm-muted">برای هر مورد یک جمله کامل با ساختار داده‌شده بنویس. بعد جمله‌های نمونه را باز کن و جمله خودت را با آن‌ها مقایسه کن.</p>`);
    let rows = '', title = '';
    if (key === 'woerter') {
      title = 'جمله‌سازی با لغات مرور امروز';
      rows = (w.sx.woerter || []).map((p) => ({ p, x: m.srs[p.key] })).filter((o) => o.x).map((o, n) => { const x = o.x.data || {}; return sxRow('w', n, `<b dir="ltr">${E((x.artikel ? x.artikel + ' ' : '') + (x.wort || ''))}</b> <small dir="rtl">${E(x.bedeutung_fa || '')}</small>`, sxSt(o.p.st), x.beispiel ? E(x.beispiel) : ''); }).join('');
    } else if (key === 'redemittel') {
      title = 'جمله‌سازی با Redemittel مرور امروز';
      rows = (w.sx.redemittel || []).map((p) => ({ p, x: m.srs[p.key] })).filter((o) => o.x).map((o, n) => { const x = o.x.data || {}; return sxRow('r', n, `<b dir="ltr">${E(x.de || '')}</b> <small dir="rtl">${E(x.fa || '')}</small>`, sxSt(o.p.st), x.beispiel ? E(x.beispiel) : ''); }).join('');
    } else {
      title = 'شکل درستِ اشتباهات را در جمله تازه به کار ببر';
      const list = (w.sx.fehler || []).map((p) => ({ p, e: (S.errors || []).find((e) => e.id === p.id) })).filter((o) => o.e);
      rows = list.length ? list.map((o, n) => sxRow('f', n, `<small dir="ltr" class="tdm-sx-wrong">✗ ${E(o.e.userAnswer || o.e.question || '')}</small> <b dir="ltr">✓ ${E(o.e.correctAnswer || '')}</b>${o.e.explanation ? `<small dir="auto" class="tdm-muted">${E(o.e.explanation)}</small>` : ''}`, sxSt(o.p.st), '')).join('')
        : [0, 1, 2].map((n) => sxRow('f', n, `<b>${L('ساختار آزاد', 'Freie Struktur', 'Free structure')}</b>`, SX_STRUCT[(n * 4 + 2) % SX_STRUCT.length], '')).join('');
    }
    const body = card(intro(title) + (rows || rtl('<p class="tdm-muted">هنوز موردی برای این مرحله نیست؛ لغات و Redemittel از فعالیت «Grammatik & Wortschatz» وارد دفتر می‌شوند. این مرحله را رد کن.</p>')));
    return frame(a, d, steps, i, body);
  }

  // ═════════════ HISTORY INTEGRATION ═════════════
  function resultChips(d) {
    const r = d.results || {}, out = [], pc = (v) => (v == null ? '✓' : faNum(v) + '%'), sc = (v) => (v == null ? '✓' : faNum(v));
    if (r.hoeren) out.push(['hoeren', `Hören ${pc(r.hoeren.pct)}`]);
    if (r.lesen) out.push(['lesen', `Lesen ${pc(r.lesen.pct)}`]);
    if (r.schreiben) out.push(['schreiben', `Schreiben ${sc(r.schreiben.score)}${r.schreiben.words ? ' · ' + faNum(r.schreiben.words) + ' W.' : ''}`]);
    if (r.sprechen) out.push(['sprechen', `Sprechen ${sc(r.sprechen.score)}${r.sprechen.recordings ? ' · ' + faNum(r.sprechen.recordings) + ' 🎙' : ''}`]);
    if (r.wortschatz) out.push(['wortschatz', `Wortschatz ${faNum(r.wortschatz.words || 0)} W.`]);
    if (r.wiederholung) out.push(['wiederholung', `Wiederholung ${r.wiederholung.quiz != null ? faNum(r.wiederholung.quiz) + '%' : '✓'}`]);
    if (r.fehleranalyse) out.push(['fehleranalyse', 'Fehleranalyse ✓']);
    if (r.wochenbericht) out.push(['wochenbericht', `Wochenbericht ${r.wochenbericht.saved ? '✓' : '—'}`]);
    if (r.extra) out.push(['extra', r.extra.sentences != null ? `Extra ${faNum(r.extra.minutes || 0)}′ · ${faNum(r.extra.sentences)} ✍` : `Extra ${faNum(r.extra.minutes || 0)}′ · ${faNum(r.extra.cards || 0)} 🗂`]);
    return out;
  }
  const chipHtml = (list) => list.map(([id, t]) => `<span class="tdm-hchip" style="--c:${MODS[id]?.color || '#64748b'}" dir="ltr">${E(t)}</span>`).join('');
    // ───────────── owner daily file snapshot (content + answers per module) ─────────────
TDM.dayFileSnapshot = function (date) {
    let d = null;
    try { d = M().days?.[date] || null; } catch (e) { d = null; }
    if (!d) return null;
    const idOf = (v) => (typeof v === 'string' ? v : v && v.id) || null;
    const qRows = (it, set, w) => (it?.questions || []).map((q) => {
      const a = w.ans?.[set + ':' + q.id];
      return {
        q: q.q || q.question || '',
        type: q.type || 'mc',
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        user: (() => { try { return answerLabel(q, a) || ''; } catch (e) { return a == null ? '' : String(a); } })(),
        correct: (() => { try { return correctLabel(q) || ''; } catch (e) { return ''; } })(),
        ok: q.type === 'short' ? null : (() => { try { return !!isCorrect(q, a); } catch (e) { return null; } })(),
        evidence: q.evidence || '',
        explain: q.explain_fa || ''
      };
    });
    const words = (it) => (it?.vocab || []).map((v) => ({ wort: v.wort || '', artikel: v.artikel || '', plural: v.plural || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '' }));
    const mods = [];
    (typeof dayModules === 'function' ? dayModules(date) : ['hoeren', 'lesen', 'schreiben', 'sprechen', 'fehleranalyse', 'wochenbericht']).forEach((id) => {
      const w = (d.work || {})[id] || {}, res = (d.results || {})[id] || null, meta = MODS[id] || {};
      const row = { id, de: meta.de || id, fa: meta.fa || id, result: res, title: '', questions: [], text: '', ratings: {}, words: [], sentences: [], tasks: [], notes: [], paragraphs: [], transcript: '', audio: '' };
      try {
        if (id === 'hoeren' || id === 'lesen') {
          const it = item(id, idOf(d.picks?.[id]));
          const set = id === 'hoeren' ? 'h' : 'l';
          row.title = it?.title || it?.titel || it?.thema || '';
          row.audio = it?.audio || '';
          if (id === 'hoeren') {
            const names = it?.speakers || [];
            row.transcript = (it?.segments || []).map((seg) => `${names[seg.s]?.name ? names[seg.s].name + ': ' : ''}${seg.text || ''}`).join('\n');
            row.formatLabel = it?.formatLabel || '';
          } else {
            row.paragraphs = (it?.paragraphs || []).map((p, n) => ({ heading: (p && p.heading) || '', text: (p && (p.text || p)) || '', n: n + 1 }));
          }
          row.words = words(it);
          row.questions = qRows(it, set, w);
        } else if (id === 'schreiben') {
          const pick = d.picks?.schreiben, kind = pick?.kind === 'grafik' ? 'grafik' : 'argumentation';
          const it = item(kind, idOf(pick)) || {};
          row.kind = kind;
          row.title = it.title || it.thema || (kind === 'grafik' ? 'Grafik' : 'Argumentation');
          row.situation = it.situation || '';
          row.task = it.task || '';
          row.sourceText = it.text || '';
          row.material = Array.isArray(it.positions) ? it.positions.map((p) => `${p.person ? p.person + ': ' : ''}${p.text || ''}`).join('\n') : (it.material || '');
          row.modelText = it.model_text || '';
          row.text = w.f?.text || '';
          ['grammatik', 'wortschatz', 'konnektoren', 'struktur', 'aufgabe'].forEach((k) => { const v = Number(w.rate?.['k_' + k]); if (v) row.ratings[k] = v; });
        } else if (id === 'sprechen') {
          const list = (typeof spList === 'function' ? spList(d) : []) || [];
          const recs = w.rec && typeof w.rec === 'object' ? Object.values(w.rec).filter((v) => typeof v === 'string' && /\.(webm|mp3|m4a|ogg)/i.test(v)) : [];
          list.forEach((it, i) => {
            const r = {};
            ['fluss', 'genau', 'struktur', 'aufgabe'].forEach((k) => { const v = Number(w.rate?.['s' + i + '_' + k]); if (v) r[k] = v; });
            row.tasks.push({ title: it?.title || it?.titel || it?.thema || ('Aufgabe ' + (i + 1)), situation: it?.situation || '', task: it?.task || '', material: it?.material || '', ratings: r, note: w.f?.['an_note_' + i] || '', audio: recs[i] || '' });
          });
        } else if (id === 'wortschatz') {
          (typeof dayWords === 'function' ? dayWords(d) : []).forEach((v) => row.words.push({ wort: v.wort || '', artikel: v.artikel || '', plural: v.plural || '', bedeutung_fa: v.bedeutung_fa || '', beispiel: v.beispiel || '' }));
          [0, 1, 2, 3, 4].forEach((i) => { const s = String(w.f?.['satz_' + i] || '').trim(); if (s) row.sentences.push(s); });
          row.notes = (w.f?.mat || []).filter(Boolean).map(String);
        } else if (id === 'fehleranalyse') {
          row.notes = Array.isArray(w.f?.top) ? w.f.top.map(String) : [];
          row.text = w.f?.weak || '';
        } else if (id === 'wiederholung') {
          row.reviewed = Object.keys(w.ans || {}).length;
          row.quiz = w.quiz?.done ? w.quiz.pct : null;
        } else if (id === 'wochenbericht') {
          row.saved = !!M().weekly?.['W' + d.week];
        }
      } catch (e) { /* keep the row even if a branch fails */ }
      mods.push(row);
    });
    return { date, mode: d.mode || 'normal', week: d.week || null, level: d.level || null, createdAt: d.createdAt || null, modules: mods };
  };;

  TDM.historyDayDetail = function (date) {
    const d = S.testdafMethod?.days?.[date]; if (!d) return '';
    const chips = resultChips(d);
    if (!chips.length && !Object.keys(d.work || {}).length) return '';
    const def = DDEF()[wdOf(date)] || {};
    return `<div class="tdm-hday" data-learning-content><p><b>📋 ${L('برنامه یادگیری', 'Lernplan', 'Learning plan')}</b> · ${E(L(def.fa || '', def.de || ''))}${d.week ? ` · ${L('هفته', 'Woche')} ${faNum(d.week)}` : ''}</p><div class="tdm-hchips">${chips.length ? chipHtml(chips) : `<span class="tdm-muted">${L('شروع شده؛ هنوز ماژولی تمام نشده است.', 'Begonnen – noch kein Modul abgeschlossen.')}</span>`}</div></div>`;
  };
  // ═════════════ HISTORY: plan progress & reports (moved here from the hub) ═════════════
  // Drawn with the History page's own components (history-panel, trend chart, legend, expandable rows).
  const S4 = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
  const skillField = (s) => (s === 'hoeren' || s === 'lesen' ? 'pct' : 'score');
  function skillVal(d, s) { const r = d.results?.[s]; if (!r || r[skillField(s)] == null) return null; const v = Number(r[skillField(s)]); return Number.isFinite(v) ? v : null; }
  function trendSvg(days) {
    const W = 640, H = 230, pl = 44, pr = 14, pt = 16, pb = 20, pw = W - pl - pr, ph = H - pt - pb;
    const xs = (i) => pl + (days.length < 2 ? pw / 2 : (i * pw) / (days.length - 1)), ys = (v) => pt + ph - (clamp(v, 0, 100) / 100) * ph;
    const grid = [0, 25, 50, 75, 100].map((v) => `<g><line x1="${pl}" y1="${ys(v)}" x2="${W - pr}" y2="${ys(v)}" class="history-gridline"/><text x="${pl - 8}" y="${ys(v) + 4}" text-anchor="end" class="history-axis-label">${v}%</text></g>`).join('');
    const lines = S4.map((sk) => {
      const pts = days.map((d, i) => { const v = skillVal(d, sk); return v == null ? null : [xs(i), ys(v), v, d.date]; }).filter(Boolean);
      if (!pts.length) return '';
      const c = MODS[sk].color;
      return `<g>${pts.length > 1 ? `<polyline points="${pts.map((q) => q[0] + ',' + q[1]).join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>` : ''}${pts.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.6"><title>${MODS[sk].de} · ${q[3]} · ${q[2]}%</title></circle>`).join('')}</g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hören, Lesen, Schreiben, Sprechen">${grid}<line x1="${pl}" y1="${pt}" x2="${pl}" y2="${pt + ph}" class="history-axis-line"/><line x1="${pl}" y1="${pt + ph}" x2="${W - pr}" y2="${pt + ph}" class="history-axis-line"/>${lines}</svg>`;
  }
  TDM.renderHistoryPanel = function () {
    const m = S.testdafMethod;
    if (!TDM.enrolled() && !(m?.days && Object.keys(m.days).length)) return '';
    const mm = M();
    if (!CT()) TDM.ensureContent().then(() => { if (S.screen === 'history') render(); }).catch(() => {});
    const f = ['week', 'month', 'quarter'].includes(S.historyFilter) ? S.historyFilter : 'week', cutD = new Date();
    cutD.setHours(12, 0, 0, 0); if (f === 'week') cutD.setDate(cutD.getDate() - 6); else cutD.setMonth(cutD.getMonth() - (f === 'month' ? 1 : 3));
    const from = keyOf(cutD), all = Object.values(mm.days), days = all.filter((d) => d.date >= from && (Object.keys(d.results || {}).length || Object.keys(d.work || {}).length)).sort((a, b) => b.date.localeCompare(a.date));
    const avg = (v) => { v = v.filter((x) => Number.isFinite(x)); return v.length ? Math.round(v.reduce((sum, x) => sum + x, 0) / v.length) : null; };
    const pick = (sk) => days.map((d) => skillVal(d, sk)).filter((x) => x != null);
    const done = days.reduce((sum, d) => sum + Object.keys(d.results || {}).filter((x) => x !== 'extra').length, 0), planned = days.length * (LEAN() ? 4 : 6);
    const secs = days.reduce((sum, d) => sum + Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0), 0);
    const srs = Object.values(mm.srs || {}), words = srs.filter((x) => x.type === 'wort').length, red = srs.length - words, due = srs.filter((x) => x.due <= today()).length;
    const c = CT(), practised = { hoeren: new Set(), lesen: new Set(), argumentation: new Set(), grafik: new Set(), sprechen: new Set() };
    all.forEach((d) => { const r = d.results || {}, p = d.picks || {}; if (r.hoeren && p.hoeren) practised.hoeren.add(p.hoeren); if (r.lesen && p.lesen) practised.lesen.add(p.lesen); if (r.schreiben && p.schreiben?.id) practised[p.schreiben.kind === 'grafik' ? 'grafik' : 'argumentation'].add(p.schreiben.id); if (r.sprechen) (p.sprechen || []).forEach((id) => practised.sprechen.add(id)); });
    const pct = (v) => (v == null ? '—' : faNum(v) + '%');
    const kpi = (label, val, color) => `<div class="tdm-hkpi" style="--c:${color}"><span>${E(label)}</span><b>${val}</b></div>`;
    const dir = isFa() ? 'rtl' : 'ltr';
    const skillAvg = S4.map((sk) => avg(pick(sk))), overall = avg(skillAvg.filter((x) => x != null));
    const chartDays = days.slice().reverse().filter((d) => S4.some((sk) => skillVal(d, sk) != null));
    const dLabel = (k) => { try { return new Date(k + 'T12:00:00').toLocaleDateString(isFa() ? 'fa-IR' : 'de-DE', { day: 'numeric', month: 'short' }); } catch (e) { return k; } };
    // A · skill scores over the selected period
    const panelA = `<article class="history-panel history-trend tdm-hist" id="tdm-progress" data-learning-content dir="${dir}">
      <div class="history-panel-head"><div><span class="history-eyebrow">LERNPLAN · REPORT</span><h2>${L('پیشرفت برنامه یادگیری', 'Fortschritt im Lernplan', 'Learning plan progress')}</h2><p class="mt-1 text-xs text-slate-400">${L('نمره چهار مهارت در روزهای برنامه (بازه انتخاب‌شده بالا)', 'Ergebnisse der vier Fertigkeiten an den Plan-Tagen (gewählter Zeitraum)')}</p></div><div class="history-score-pill"><small>${L('میانگین چهار مهارت', 'Schnitt aller Teile')}</small><b>${pct(overall)}</b></div></div>
      <div class="tdm-hkpis">${kpi(L('ماژول‌های انجام‌شده', 'Module erledigt'), `${faNum(done)}/${faNum(planned)}`, '#6366f1')}${kpi(L('زمان ماژول‌های تمام‌شده', 'Zeit abgeschlossener Module'), hm(Math.round(secs / 60)), '#38bdf8')}${kpi(L('دفتر عبارات برنامه', 'Plan-Wortschatz'), `${faNum(words)} + ${faNum(red)}`, MODS.wortschatz.color)}${kpi(L('مرور سررسید', 'Heute fällig'), faNum(due), '#f59e0b')}</div>
      <div class="history-chart-wrap tdm-hchart" dir="ltr">${chartDays.length ? trendSvg(chartDays) : `<div class="history-empty-chart"><span>--</span><p>${L('هنوز نتیجه‌ای از ماژول‌های برنامه در این بازه ثبت نشده است.', 'Noch keine Plan-Ergebnisse in diesem Zeitraum.')}</p></div>`}</div>
      ${chartDays.length ? `<div class="tdm-hchart-labels" dir="ltr">${chartDays.map((d) => `<span>${E(dLabel(d.date))}</span>`).join('')}</div>` : ''}
      <div class="history-legend tdm-hlegend">${S4.map((sk, n) => `<div><i style="background:${MODS[sk].color}"></i><span dir="ltr">${MODS[sk].de}</span><b>${pct(skillAvg[n])}</b></div>`).join('')}</div>
    </article>`;
    // B · phase, weekly trend and week-over-week comparison
    const k = today(), wk = weekOf(k), weeks = [];
    for (let n = Math.max(0, wk); n >= 0 && weeks.length < 12; n--) weeks.push(weekMetrics(n));
    const bars = (key) => weeks.slice().reverse().filter((x) => x.week > 0 || x.days).map((x) => `<div class="tdm-bar"><i style="height:${clamp(x[key] || 0, 0, 100)}%"></i><small>${x.week === 0 ? 'D' : 'W' + x.week}</small><b>${x[key] == null ? '' : faNum(x[key])}</b></div>`).join('');
    const ph = ST.phases[mm.phase] || ST.phases[1];
    const panelB = `<article class="history-panel tdm-hist" data-learning-content dir="${dir}">
      <div class="history-panel-head"><div><span class="history-eyebrow">WOCHENTREND</span><h2>${L('روند هفتگی', 'Wochentrend')}</h2></div></div>
      <h3 class="tdm-hsub">${L('روند هفتگی', 'Wochentrend')}</h3><div class="tdm-trends">${S4.map((sk) => `<div><h5 dir="ltr">${MODS[sk].de}</h5><div class="tdm-bars" style="--c:${MODS[sk].color}">${bars(sk) || '<span class="tdm-muted">—</span>'}</div></div>`).join('')}</div>
      ${wk >= 1 ? `<h3 class="tdm-hsub">${L('این هفته در مقایسه با هفته قبل', 'Diese Woche im Vergleich zur Vorwoche')}</h3>${compareTable(weekMetrics(wk), prevWeek(wk))}` : ''}
    </article>`;
    // C · saved weekly reports as expandable rows
    const reports = Object.values(mm.weekly || {}).sort((a, b) => b.week - a.week);
    const panelC = `<article class="history-panel tdm-hist" data-learning-content dir="${dir}">
      <div class="history-panel-head"><div><span class="history-eyebrow">WOCHENBERICHTE</span><h2>${L('گزارش‌های هفتگی', 'Wochenberichte')}</h2></div><span class="text-xs text-slate-400">${L('برای جزئیات بزنید', 'Tippen für Details')}</span></div>
      ${reports.length ? `<div class="history-days">${reports.map((r, n) => `<details class="history-day-row tdm-hrep"><summary class="history-day-main"><span class="history-day-index">${String(n + 1).padStart(2, '0')}</span><span class="min-w-0 flex-1"><b>${r.week === 0 ? 'Diagnose' : L('هفته', 'Woche') + ' ' + faNum(r.week)}</b><small dir="ltr">H ${fmtPct(r.metrics?.hoeren)} · L ${fmtPct(r.metrics?.lesen)} · S ${fmtPct(r.metrics?.schreiben)} · Sp ${fmtPct(r.metrics?.sprechen)}</small></span>${r.goal ? '<span class="history-day-time">🎯</span>' : ''}<span class="history-chevron">⌄</span></summary><div class="history-day-detail tdm-hrep-body">${rtl(`<p><b>سه اشتباه پرتکرار:</b> ${E((r.frequent || []).join(' · ') || '—')}</p><p><b>سه ضعف اصلی:</b> ${E((r.weak || []).join(' · ') || '—')}</p><p><b>هدف هفته آینده:</b> ${E(r.goal || '—')}</p><p><b>معیار موفقیت:</b> ${E(r.success || '—')}</p>${(r.plan || []).length ? `<p><b>برنامه پیشنهادی:</b></p><ol class="tdm-ol">${r.plan.map((q) => `<li>${E(q)}</li>`).join('')}</ol>` : ''}${r.progress ? `<p class="tdm-muted">${E(r.progress)}</p>` : ''}`)}</div></details>`).join('')}</div>` : `<div class="history-empty-chart py-8"><span>◇</span><p>${L('اولین گزارش هفتگی روز جمعه ثبت می‌شود.', 'Der erste Wochenbericht entsteht am Freitag.')}</p></div>`}
    </article>`;
    // D · plan days and practised content
    const content = [['hoeren', 'Hören'], ['lesen', 'Lesen'], ['argumentation', 'Argumentation'], ['grafik', 'Grafik'], ['sprechen', 'Sprechen']].map(([k2, l]) => { const n = practised[k2].size, t = (c?.[k2] || []).length; return `<div><span dir="ltr">${l}</span><b>${faNum(n)}${t ? ' / ' + faNum(t) : ''}</b><i><em style="width:${t ? clamp((n / t) * 100, 0, 100) : 0}%"></em></i></div>`; }).join('');
    const panelD = `<article class="history-panel tdm-hist" data-learning-content dir="${dir}">
      <div class="history-panel-head"><div><span class="history-eyebrow">PLAN-TAGE</span><h2>${L('روزهای برنامه و محتوای تمرین‌شده', 'Plan-Tage und geübte Inhalte')}</h2></div><div class="tdm-hist-actions"><button type="button" onclick="TDM.hub('woche')">🗓 ${L('برنامه هفته', 'Wochenplan')}</button><button type="button" onclick="TDM.hub('deck')">🗂 ${L('دفتر عبارات', 'Wortschatz')}</button></div></div>
      <div class="tdm-hist-grid"><div class="tdm-hist-days">${days.length ? days.map((d) => { const def = DDEF()[wdOf(d.date)] || {}; return `<div class="tdm-hist-day"><p><b>${E(d.date)}</b> · ${E(L(def.fa || '', def.de || ''))}${d.mode === 'exam' ? ' · ' + L('آزمون', 'Prüfung') : d.mode === 'eval' ? ' · ' + L('ارزیابی', 'Bewertung') : ''}</p><div class="tdm-hchips">${chipHtml(resultChips(d)) || `<span class="tdm-muted">${L('در حال انجام', 'In Arbeit')}</span>`}</div></div>`; }).join('') : `<p class="tdm-muted">${L('در این بازه روز برنامه‌ای ثبت نشده است.', 'Keine Plan-Tage in diesem Zeitraum.')}</p>`}</div>
        <div class="tdm-hist-content"><h3>${L('محتوای تمرین‌شده برنامه (کل دوره)', 'Geübte Plan-Inhalte (gesamt)')}</h3>${content}</div></div>
    </article>`;
    return panelA + panelB + panelC + panelD;
  };

  // ═════════════ HISTORY PAGE: two tabs (TestDaF plan | free study) ═════════════
  // Each workspace shows its own results. Long lists are paged, only the open tab is built, and the site's big
  // practised-content table is built only when opened. Uses the site's history helpers (mergeHistoryByDate, rebuildDailyHistory…).
  const PLAN_ONLY_IDS = ['wiederholung', 'extra', 'fehleranalyse', 'wochenbericht'];
  TDM.trackPlanId = function () {
    if (!TDM.enrolled() || !S.testdafMethod) return;
    const m = S.testdafMethod, plan = curMode() === 'free' ? S.planStash?.plan?.plan : S.plan;
    m.planIds = m.planIds || {};
    if (plan?.id && !m.planIds[plan.id]) m.planIds[plan.id] = plan.date || today();
  };
  const dtfCache = {};
  function fmtDay(k, kind) {
    const loc = typeof appDateLocale === 'function' ? appDateLocale() : isFa() ? 'fa-IR' : 'de-DE', key = loc + '|' + kind;
    if (!dtfCache[key]) dtfCache[key] = new Intl.DateTimeFormat(loc, kind === 'short' ? { day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' });
    try { return dtfCache[key].format(new Date(k + 'T12:00:00')); } catch (e) { return k; }
  }
  const fmtMin = (sec) => { const mm = Math.round((Number(sec) || 0) / 60), h = Math.floor(mm / 60), r = mm % 60; return isFa() ? (h ? `${faNum(h)} ساعت${r ? ' و ' + faNum(r) + ' دقیقه' : ''}` : `${faNum(r)} دقیقه`) : h ? `${h} h${r ? ' ' + r + ' min' : ''}` : `${r} min`; };
  const fmtShort = (min) => { min = Math.max(0, Math.round(min)); const h = Math.floor(min / 60), r = min % 60; return h ? `${faNum(h)}h${r ? ' ' + faNum(r) + 'm' : ''}` : `${faNum(r)}m`; };
  // owner daily files: wired into the history page (read-only helpers from the main app script)
  const ownerFileBtn = (date) => (typeof ownerDayFileButton === 'function' ? ownerDayFileButton(date) : '');
  // If the page HTML is older than this script, the inline block may be missing;
  // render a compact, data-driven file view from the stored snapshot instead.
  const ownerFileBlock = (date) => {
    if (typeof ownerDayFileInlineBlock === 'function') return ownerDayFileInlineBlock(date);
    const snap = (typeof ownerDayFileFor === 'function') ? ownerDayFileFor(date) : null;
    if (!snap || !Array.isArray(snap.modules)) return '';
    const rows = snap.modules.map((m) => {
      const qs = (m.questions || []).map((q, i) => `<div style="padding:5px 0;border-top:1px solid rgba(148,163,184,.18)"><p dir="ltr" style="margin:0;font-size:11px;color:#e2e8f0">${i + 1}. ${E(q.q || '')}</p><p style="margin:3px 0 0;font-size:10px;color:#94a3b8">${L('پاسخ شما', 'Deine Antwort')}: <b dir="ltr" style="color:${q.ok === false ? '#fb7185' : '#34d399'}">${E(q.user || '—')}</b>${q.correct ? ` · ${L('درست', 'Richtig')}: <b dir="ltr" style="color:#7dd3fc">${E(q.correct)}</b>` : ''}</p></div>`).join('');
      const extra = m.text ? `<pre dir="ltr" style="white-space:pre-wrap;margin:4px 0 0;padding:8px;border-radius:10px;background:rgba(2,6,23,.45);font-size:11px;color:#cbd5e1;font-family:inherit">${E(m.text)}</pre>` : '';
      const words = (m.words || []).length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px">${m.words.slice(0, 20).map((v) => `<span dir="ltr" style="padding:2px 7px;border-radius:7px;background:rgba(16,185,129,.14);color:#6ee7b7;font-size:10px">${E((v.artikel ? v.artikel + ' ' : '') + (v.wort || ''))}</span>`).join('')}</div>` : '';
      return `<article style="border-radius:14px;border:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.5);padding:10px;margin-top:8px"><b style="font-size:12px;color:#e2e8f0">${E(m.fa || m.de || m.id)}</b>${m.title ? `<p style="margin:3px 0 0;font-size:11px;color:#cbd5e1" dir="ltr">${E(m.title)}</p>` : ''}${qs}${extra}${words}</article>`;
    }).join('');
    return `<div style="margin-top:10px;border-radius:14px;border:1px solid rgba(56,189,248,.28);background:rgba(14,165,233,.08);padding:10px" dir="${isFa() ? 'rtl' : 'ltr'}"><b style="font-size:12px;color:#e0f2fe">📄 ${L('فایل روز', 'Tagesdatei')}</b><div>${rows}</div></div>`;
  };
  function histPeriod() {
    const f = ['week', 'month', 'quarter'].includes(S.historyFilter) ? S.historyFilter : 'week', to = today(), c = parseKey(to);
    if (f === 'week') c.setDate(c.getDate() - 6); else c.setMonth(c.getMonth() - (f === 'month' ? 1 : 3));
    const from = keyOf(c), len = diffDays(from, to) + 1, pf = addDays(from, -len), pt = addDays(from, -1);
    return { f, from, to, len, inP: (k) => k >= from && k <= to, inPrev: (k) => k >= pf && k <= pt };
  }
  function splitHistory() {
    const ids = new Set(Object.keys(S.testdafMethod?.planIds || {})), free = [], planTime = {};
    const merged = typeof mergeHistoryByDate === 'function' ? mergeHistoryByDate(S.history || []) : [];
    for (const day of merged) {
      const freeSegs = {};
      for (const seg of Object.values(day.segments || {})) {
        if (!seg) continue;
        const isPlan = ids.has(seg.planId) || Object.keys(seg.activityTimes || {}).some((id) => PLAN_ONLY_IDS.includes(id));
        if (isPlan) planTime[day.date] = (planTime[day.date] || 0) + (Number(seg.time) || 0); else freeSegs[seg.planId] = seg;
      }
      if (Object.keys(freeSegs).length) free.push(typeof rebuildDailyHistory === 'function' ? rebuildDailyHistory({ date: day.date, segments: freeSegs }) : day);
    }
    return { free, planTime };
  }
  function deskSessions() { try { return (typeof freeStudyState === 'function' ? freeStudyState().sessions : null) || {}; } catch (e) { return {}; } }
  const avgOf = (v) => { v = v.filter((x) => Number.isFinite(x)); return v.length ? Math.round(v.reduce((a, x) => a + x, 0) / v.length) : null; };
  const tile = (label, value, sub, color, ring) => `<div class="hx-kpi" style="--c:${color}${ring != null ? `;--v:${clamp(ring, 0, 100) * 3.6}deg` : ''}"><span>${E(label)}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}${ring != null ? `<i class="hx-ring"><b>${faNum(ring)}%</b></i>` : ''}</div>`;
  const dlt = (cur, prev, unit, ref) => { if (cur == null || prev == null) return ''; const d = Math.round(cur - prev), r = ref === 'week' ? L('هفته قبل', 'Vorwoche') : L('بازه قبل', 'Vorzeitraum'); if (!d) return `<em class="hx-d">= ${L('مثل', 'wie')} ${r}</em>`; return `<em class="hx-d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${faNum(Math.abs(d))}${unit || ''} ${L('نسبت به', 'zur')} ${r}</em>`; };
  const pill = (v) => `<span class="hx-pill ${v == null ? '' : v >= 70 ? 'good' : v >= 50 ? 'mid' : 'low'}">${v == null ? '—' : faNum(v)}</span>`;
  /*ACTIME*/ const perLbl = (P) => (P.f === 'week' ? L('۷ روز گذشته', 'letzte 7 Tage', 'last 7 days') : P.f === 'month' ? L('یک ماه گذشته', 'letzter Monat', 'last month') : L('سه ماه گذشته', 'letzte 3 Monate', 'last 3 months'));
  const todayLn = (sec) => `<em class="hx-d" style="display:block">${L('امروز', 'Heute', 'Today')}: ${fmtShort((Number(sec) || 0) / 60)}</em>`;
  const emptyBox = (icon, text) => `<div class="hx-empty"><b>${icon}</b><p>${text}</p></div>`;
  const moreBtn = (shown, total, key) => (total > shown ? `<button type="button" class="hx-more" onclick="S.${key}=${shown + 14};render()">${L('نمایش', 'Weitere')} ${faNum(Math.min(14, total - shown))} ${L('روز دیگر', 'Tage anzeigen')} ↓</button>` : '');

  function weekBarsSvg(weeks, curWeek) {
    const W = 500, H = 290, pl = 38, pr = 6, pt = 26, pb = 40, pw = W - pl - pr, ph = H - pt - pb, n = Math.max(1, weeks.length), gw = pw / n, gap = 4;
    const bw = Math.max(6, Math.min(24, (gw - 22 - gap * 3) / 4)), ys = (v) => pt + ph - (clamp(v, 0, 100) / 100) * ph;
    const defs = S4.map((sk) => `<linearGradient id="hxg-${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MODS[sk].color}"/><stop offset="1" stop-color="${MODS[sk].color}" stop-opacity=".35"/></linearGradient>`).join('');
    const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${pl}" y1="${ys(v)}" x2="${W - pr}" y2="${ys(v)}" class="hx-grid"/><text x="${pl - 8}" y="${ys(v) + 4}" text-anchor="end" class="hx-axis">${v}%</text>`).join('');
    const groups = weeks.map((wk, i) => {
      const gx = pl + i * gw, x0 = gx + (gw - (bw * 4 + gap * 3)) / 2;
      const bg = wk.week === curWeek ? `<rect x="${gx + 4}" y="${pt - 14}" width="${gw - 8}" height="${ph + 14}" rx="12" class="hx-cur"/>` : '';
      const bars = S4.map((sk, j) => {
        const v = wk[sk], x = x0 + j * (bw + gap);
        if (v == null) return `<rect x="${x}" y="${ys(0) - 3}" width="${bw}" height="3" rx="1.5" class="hx-nobar"><title>${MODS[sk].de}: —</title></rect>`;
        const y = ys(v), h = Math.max(3, pt + ph - y);
        return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="${Math.min(6, bw / 2)}" fill="url(#hxg-${sk})"><title>${MODS[sk].de} · ${wk.label}: ${v}%</title></rect>${n <= 6 ? `<text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" class="hx-val">${faNum(v)}</text>` : ''}`;
      }).join('');
      return `<g>${bg}${bars}<text x="${gx + gw / 2}" y="${H - 14}" text-anchor="middle" class="hx-wk">${E(wk.label)}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('روند هفتگی چهار مهارت', 'Wochentrend der vier Fertigkeiten')}"><defs>${defs}</defs>${grid}${groups}</svg>`;
  }
  function stackSvg(buckets, hasDesk) {
    const W = 680, H = 236, pl = 46, pr = 8, pt = 16, pb = 30, pw = W - pl - pr, ph = H - pt - pb, n = Math.max(1, buckets.length), gw = pw / n, bw = Math.max(4, Math.min(30, gw * 0.62));
    const top = Math.ceil(Math.max(30, ...buckets.map((b) => (b.a + b.b) / 60)) / 30) * 30, ys = (min) => pt + ph - (min / top) * ph, every = Math.ceil(n / 10);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((r) => `<line x1="${pl}" y1="${ys(top * r)}" x2="${W - pr}" y2="${ys(top * r)}" class="hx-grid"/><text x="${pl - 8}" y="${ys(top * r) + 4}" text-anchor="end" class="hx-axis">${fmtShort(top * r)}</text>`).join('');
    const bars = buckets.map((b, i) => {
      const x = pl + i * gw + (gw - bw) / 2, am = b.a / 60, bm = b.b / 60, ya = ys(am), yb = ys(am + bm);
      return `<g><title>${E(b.title)} · ${fmtShort(am + bm)}${hasDesk ? ` (${L('برنامه', 'Plan')} ${fmtShort(am)} · ${L('میز مطالعه', 'Lerntisch')} ${fmtShort(bm)})` : ''}</title>${am > 0 ? `<rect x="${x}" y="${ya}" width="${bw}" height="${Math.max(2, pt + ph - ya)}" rx="${Math.min(5, bw / 2)}" fill="url(#hxs-a)"/>` : ''}${bm > 0 ? `<rect x="${x}" y="${yb}" width="${bw}" height="${Math.max(2, ya - yb)}" rx="${Math.min(5, bw / 2)}" fill="url(#hxs-b)"/>` : ''}${i % every === 0 ? `<text x="${x + bw / 2}" y="${H - 9}" text-anchor="middle" class="hx-wk">${E(b.label)}</text>` : ''}</g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('زمان مطالعه روزانه', 'Lernzeit pro Tag')}"><defs><linearGradient id="hxs-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9" stop-opacity=".75"/></linearGradient><linearGradient id="hxs-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#0891b2" stop-opacity=".8"/></linearGradient></defs>${grid}${bars}</svg>`;
  }

  // ── tab «برنامه TestDaF»
  function histPlanTab(P, split) {
    const m = M(), all = Object.values(m.days || {}), has = (d) => Object.keys(d.results || {}).length || Object.keys(d.work || {}).length;
    const days = all.filter((d) => P.inP(d.date) && has(d)).sort((a, b) => b.date.localeCompare(a.date)), prev = all.filter((d) => P.inPrev(d.date) && has(d));
    const resSecs = (d) => Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0), dayTime = (d) => Math.max(split.planTime[d.date] || 0, resSecs(d));
    const modsDone = (d) => Object.keys(d.results || {}).filter((x) => x !== 'extra').length;
    const total = days.reduce((a, d) => a + dayTime(d), 0), prevTotal = prev.reduce((a, d) => a + dayTime(d), 0);
    const done = days.reduce((a, d) => a + modsDone(d), 0), planned = days.length * (LEAN() ? 4 : 6), rate = planned ? Math.round((done / planned) * 100) : 0;
    const skAvg = (list) => S4.map((sk) => avgOf(list.map((d) => skillVal(d, sk)).filter((x) => x != null)));
    const cur = skAvg(days), before = skAvg(prev), overall = avgOf(cur.filter((x) => x != null)), overallPrev = avgOf(before.filter((x) => x != null));
    const srs = Object.values(m.srs || {}), words = srs.filter((x) => x.type === 'wort').length, due = srs.filter((x) => x.due <= today()).length;
    let streak = 0, sk0 = today(); if (!(m.days[sk0] && modsDone(m.days[sk0]))) sk0 = addDays(sk0, -1);
    while (m.days[sk0] && modsDone(m.days[sk0]) && streak < 999) { streak++; sk0 = addDays(sk0, -1); }
    if (!CT()) TDM.ensureContent().then(() => { if (S.screen === 'history') render(); }).catch(() => {});
    const kpis = `<div class="hx-kpis">${tile(L('زمان مطالعه برنامه', 'Lernzeit im Plan') + ' · ' + perLbl(P), fmtMin(total), todayLn(m.days?.[today()] ? dayTime(m.days[today()]) : (split.planTime[today()] || 0)) + dlt(total / 60, prev.length ? prevTotal / 60 : null, L(' دقیقه', ' Min.')), '#38bdf8')}${tile(L('ماژول‌های انجام‌شده', 'Erledigte Module'), `${faNum(done)}<small> / ${faNum(planned)}</small>`, L(`${faNum(days.length)} روز برنامه`, `${days.length} Plan-Tage`, `${days.length} program days`), '#6366f1', rate)}${tile(L('میانگین چهار مهارت', 'Schnitt der vier Teile'), overall == null ? '—' : faNum(overall) + '%', dlt(overall, overallPrev, '٪'), '#22c55e')}${tile(L('روزهای پیاپی', 'Serie'), `${faNum(streak)} 🔥`, L('روز پشت‌سرهم با ماژول انجام‌شده', 'Tage in Folge'), '#f97316')}<button type="button" class="hx-kpi is-link" style="--c:${MODS.wortschatz.color}" onclick="TDM.hub('deck')"><span>${L('دفتر عبارات برنامه', 'Plan-Wortschatz')}</span><b>${faNum(words)} <small>+ ${faNum(srs.length - words)}</small></b><small>${due ? L(`${faNum(due)} مورد برای مرور امروز ←`, `${due} heute fällig →`) : L('مرور امروز انجام شده ✓', 'Heute nichts fällig ✓')}</small></button></div>`;
    // skill scores over the period
    const chartDays = days.slice().reverse().filter((d) => S4.some((sk) => skillVal(d, sk) != null));
    const panelScores = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('نمره مهارت‌ها', 'ERGEBNISSE')}</span><h2>${L('روند نمره چهار مهارت', 'Verlauf der vier Fertigkeiten')}</h2></div></div>
      <div class="hx-chart" dir="ltr">${chartDays.length ? trendSvg(chartDays) : emptyBox('📈', L('در این بازه هنوز نتیجه‌ای از ماژول‌های Hören، Lesen، Schreiben و Sprechen ثبت نشده است.', 'Noch keine Ergebnisse in diesem Zeitraum.'))}</div>
      ${chartDays.length ? `<div class="tdm-hchart-labels" dir="ltr">${chartDays.map((d) => `<span>${E(fmtDay(d.date, 'short'))}</span>`).join('')}</div>` : ''}
      <div class="hx-legend">${S4.map((sk, n) => `<div><i style="background:${MODS[sk].color}"></i><span dir="ltr">${MODS[sk].de}</span><b>${cur[n] == null ? '—' : faNum(cur[n]) + '%'}</b>${dlt(cur[n], before[n], '٪')}</div>`).join('')}</div></article>`;
    // weekly trend (grouped bars)
    const wkNow = weekOf(today()), weeks = [];
    for (let n = Math.max(0, wkNow); n >= 0 && weeks.length < 8; n--) { const x = weekMetrics(n); if (x.days) weeks.push(Object.assign(x, { label: n === 0 ? L('تشخیص', 'Diagnose') : L('هفته ', 'W') + faNum(n) })); }
    weeks.reverse();
    const thisW = weeks.find((x) => x.week === wkNow), lastW = weeks.find((x) => x.week === wkNow - 1);
    const panelWeeks = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('روند هفتگی', 'WOCHENTREND')}</span><h2>${L('پیشرفت هفته به هفته', 'Woche für Woche')}</h2><p class="mt-1 text-xs text-slate-400">${L('میانگین هر مهارت در هر هفته؛ هفته جاری با کادر مشخص شده است.', 'Schnitt pro Fertigkeit und Woche; die aktuelle Woche ist markiert.')}</p></div></div>
      <div class="hx-chart" dir="ltr">${weeks.length ? weekBarsSvg(weeks, wkNow) : emptyBox('🗓', L('بعد از اولین روز برنامه، روند هفتگی اینجا نمایش داده می‌شود.', 'Nach dem ersten Plan-Tag erscheint hier der Wochentrend.'))}</div>
      ${weeks.length ? `<div class="hx-legend">${S4.map((sk) => `<div><i style="background:${MODS[sk].color}"></i><span dir="ltr">${MODS[sk].de}</span><b>${thisW?.[sk] == null ? '—' : faNum(thisW[sk]) + '%'}</b>${lastW ? dlt(thisW?.[sk], lastW[sk], '٪', 'week') : ''}</div>`).join('')}</div>` : ''}</article>`;
    // plan days (paged, expandable)
    const shown = Math.max(7, Number(S.histPlanShow) || 7);
    const dayRows = days.slice(0, shown).map((d) => {
      const def = DDEF()[wdOf(d.date)] || {}, key = 'p:' + d.date, open = S.histOpenDay === key, r = d.results || {};
      const dayAvg = avgOf(S4.map((sk) => skillVal(d, sk)).filter((x) => x != null));
      const wip = Object.keys(d.work || {}).filter((id) => !r[id] && MODS[id]);
      const detail = open ? `<div class="hx-day-detail">${ownerFileBlock(d.date)}<div class="hx-det">${Object.entries(r).map(([id, x]) => `<div style="--c:${MODS[id]?.color || '#64748b'}"><b dir="ltr">${E(MODS[id]?.de || id)}</b><span>${x.pct != null ? faNum(x.pct) + '% · ' : x.score != null ? faNum(x.score) + '% · ' : ''}${fmtShort((Number(x.seconds) || 0) / 60)}${x.words ? ' · ' + faNum(x.words) + L(' کلمه', ' W.') : ''}${x.recordings ? ' · ' + faNum(x.recordings) + ' 🎙' : ''}</span></div>`).join('')}${wip.map((id) => `<div style="--c:${MODS[id].color}" class="is-wip"><b dir="ltr">${E(MODS[id].de)}</b><span>${L('شروع شده، تمام نشده', 'begonnen')}</span></div>`).join('')}</div>${resultChips(d).length ? `<div class="tdm-hchips">${chipHtml(resultChips(d))}</div>` : ''}</div>` : '';
      return `<div class="hx-day ${open ? 'is-open' : ''}"><button type="button" class="hx-day-main" onclick="TDM.histDay('${key}')" aria-expanded="${open}"><span class="hx-day-date"><b>${E(fmtDay(d.date, 'long'))}</b><small>${E(L(def.fa || '', def.de || ''))}${d.mode === 'exam' ? ' · ' + L('آزمون', 'Prüfung') : d.mode === 'eval' ? ' · ' + L('ارزیابی', 'Bewertung') : ''} · ${faNum(modsDone(d))}/۶ ${L('ماژول', 'Module')}</small></span><span class="hx-day-acts">${faNum(modsDone(d))}/۶</span><span class="hx-day-time">${fmtShort(dayTime(d) / 60)}</span>${pill(dayAvg)}<span class="hx-chev">⌄</span></button>${ownerFileBtn(d.date)}${detail}</div>`;
    }).join('');
    const panelDays = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('روزهای برنامه', 'PLAN-TAGE')}</span><h2>${L('کارنامه روزانه', 'Tagesübersicht')}</h2></div><span class="text-xs text-slate-400">${L('برای جزئیات روی هر روز بزنید', 'Tippen für Details')}</span></div>${days.length ? `<div class="hx-days">${dayRows}</div>${moreBtn(shown, days.length, 'histPlanShow')}` : emptyBox('📋', L('در این بازه روز برنامه‌ای ثبت نشده است.', 'Keine Plan-Tage in diesem Zeitraum.'))}</article>`;
    // phase + practised content | weekly reports
    const ph = ST.phases[m.phase] || ST.phases[1], c = CT(), practised = { hoeren: new Set(), lesen: new Set(), argumentation: new Set(), grafik: new Set(), sprechen: new Set() };
    all.forEach((d) => { const r = d.results || {}, pk = d.picks || {}; if (r.hoeren && pk.hoeren) practised.hoeren.add(pk.hoeren); if (r.lesen && pk.lesen) practised.lesen.add(pk.lesen); if (r.schreiben && pk.schreiben?.id) practised[pk.schreiben.kind === 'grafik' ? 'grafik' : 'argumentation'].add(pk.schreiben.id); if (r.sprechen) (pk.sprechen || []).forEach((id) => practised.sprechen.add(id)); });
    const content = [['hoeren', 'Hören'], ['lesen', 'Lesen'], ['argumentation', 'Argumentation'], ['grafik', 'Grafik'], ['sprechen', 'Sprechen']].map(([k2, l]) => { const n = practised[k2].size, t = (c?.[k2] || []).length; return `<div><span dir="ltr">${l}</span><b>${faNum(n)}${t ? ' / ' + faNum(t) : ''}</b><i><em style="width:${t ? clamp((n / t) * 100, 0, 100) : 0}%"></em></i></div>`; }).join('');
    const panelPhase = `<article class="history-panel hx-panel tdm-hist"><div class="history-panel-head"><div><span class="history-eyebrow">${L('محتوا', 'INHALT')}</span><h2>${L('محتوای تمرین‌شده', 'Geübte Inhalte')}</h2></div></div><h3 class="tdm-hsub">${L('محتوای تمرین‌شده برنامه (کل دوره)', 'Geübte Plan-Inhalte (gesamt)')}</h3><div class="tdm-hist-content">${content}</div></article>`;
    const reports = Object.values(m.weekly || {}).sort((a, b) => b.week - a.week);
    const panelReports = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('گزارش‌ها', 'BERICHTE')}</span><h2>${L('گزارش‌های هفتگی', 'Wochenberichte')}</h2></div></div>${reports.length ? `<div class="hx-days">${reports.map((r) => `<details class="hx-day hx-rep"><summary class="hx-day-main"><span class="hx-day-date"><b>${r.week === 0 ? L('روز تشخیص', 'Diagnose') : L('هفته ', 'Woche ') + faNum(r.week)}</b><small dir="ltr">H ${fmtPct(r.metrics?.hoeren)} · L ${fmtPct(r.metrics?.lesen)} · S ${fmtPct(r.metrics?.schreiben)} · Sp ${fmtPct(r.metrics?.sprechen)}</small></span><span class="hx-chev">⌄</span></summary><div class="hx-day-detail tdm-hrep-body">${rtl(`<p><b>سه اشتباه پرتکرار:</b> ${E((r.frequent || []).join(' · ') || '—')}</p><p><b>سه ضعف اصلی:</b> ${E((r.weak || []).join(' · ') || '—')}</p><p><b>هدف هفته آینده:</b> ${E(r.goal || '—')}</p><p><b>معیار موفقیت:</b> ${E(r.success || '—')}</p>${(r.plan || []).length ? `<p><b>برنامه پیشنهادی:</b></p><ol class="tdm-ol">${r.plan.map((q) => `<li>${E(q)}</li>`).join('')}</ol>` : ''}${r.progress ? `<p class="tdm-muted">${E(r.progress)}</p>` : ''}`)}</div></details>`).join('')}</div>` : emptyBox('🗒', L('اولین گزارش هفتگی روز جمعه ثبت می‌شود.', 'Der erste Wochenbericht entsteht am Freitag.'))}</article>`;
    return `${kpis}<div class="hx-grid2"><div class="hx-stack">${panelScores}${panelDays}</div><div class="hx-stack">${panelWeeks}${panelReports}</div></div>`; /*NOPHASE*/
  }

  // ── tab «مطالعه آزاد»: the free-study plan + the study desk timer, merged per day
  function histFreeTab(P, split) {
    const desk = deskSessions(), byDate = {};
    split.free.forEach((d) => { byDate[d.date] = d; });
    const dates = new Set(split.free.map((d) => d.date).filter(P.inP));
    Object.keys(desk).forEach((k) => { if (P.inP(k) && Number(desk[k]) >= 60) dates.add(k); });
    const rows = [...dates].sort().reverse().map((k) => { const d = byDate[k] || {}; return { date: k, plan: Number(d.time) || 0, desk: Number(desk[k]) || 0, acts: Number(d.acts) || 0, comp: Number(d.comp) || 0, score: d.score ?? null, topic: d.topic || '', times: d.activityTimes || {}, scores: d.skillScores || {} }; }).filter((r) => r.acts > 0 || r.plan >= 60 || r.desk >= 60);
    const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
    const total = sum(rows, (r) => r.plan + r.desk), deskTotal = sum(rows, (r) => r.desk), comp = sum(rows, (r) => r.comp), acts = sum(rows, (r) => r.acts);
    const avgScore = avgOf(rows.map((r) => r.score).filter((x) => x != null));
    const prevRows = split.free.filter((d) => P.inPrev(d.date)), prevAvg = avgOf(prevRows.map((d) => d.score).filter((x) => x != null));
    const prevTotal = sum(prevRows, (d) => Number(d.time) || 0) + Object.entries(desk).filter(([k]) => P.inPrev(k)).reduce((a, [, v]) => a + (Number(v) || 0), 0);
    const rate = acts ? Math.round((comp / acts) * 100) : null;
    const kpis = `<div class="hx-kpis k4">${tile(L('زمان مطالعه', 'Lernzeit') + ' · ' + perLbl(P), fmtMin(total), todayLn((Number(byDate[today()]?.time) || 0) + (Number(desk[today()]) || 0)) + dlt(total / 60, prevTotal ? prevTotal / 60 : null, L(' دقیقه', ' Min.')), '#a78bfa')}${tile(L('روزهای مطالعه', 'Lerntage'), `${faNum(rows.length)}<small> / ${faNum(P.len)}</small>`, deskTotal ? L(`میز مطالعه: ${fmtShort(deskTotal / 60)}`, `Lerntisch: ${fmtShort(deskTotal / 60)}`) : '', '#22d3ee')}${tile(L('فعالیت‌های انجام‌شده', 'Erledigte Aktivitäten'), `${faNum(comp)}<small> / ${faNum(acts)}</small>`, '', '#f472b6', rate)}${tile(L('میانگین نمره', 'Durchschnitt'), avgScore == null ? '—' : faNum(avgScore) + '%', dlt(avgScore, prevAvg, '٪'), '#34d399')}</div>`;
    // time chart: daily for ≤5 weeks, weekly buckets for 3 months
    const buckets = [], byDay = (k) => { const r = rows.find((x) => x.date === k); return r || { plan: 0, desk: 0 }; };
    if (P.len <= 35) { for (let k = P.from; k <= P.to; k = addDays(k, 1)) { const r = byDay(k); buckets.push({ label: fmtDay(k, 'short'), title: fmtDay(k, 'long'), a: r.plan, b: r.desk }); } }
    else { for (let k = P.from; k <= P.to; k = addDays(k, 7)) { let a = 0, b = 0; for (let i = 0; i < 7; i++) { const kk = addDays(k, i); if (kk > P.to) break; const r = byDay(kk); a += r.plan; b += r.desk; } buckets.push({ label: fmtDay(k, 'short'), title: L('هفته از ', 'Woche ab ') + fmtDay(k, 'long'), a, b }); } }
    const hasDesk = deskTotal > 0 || Object.keys(desk).length > 0;
    const panelTime = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('زمان مطالعه', 'LERNZEIT')}</span><h2>${P.len <= 35 ? L('زمان مطالعه روزانه', 'Lernzeit pro Tag') : L('زمان مطالعه هفتگی', 'Lernzeit pro Woche')}</h2></div><div class="history-score-pill"><small>${L('میانگین روزانه', 'Ø pro Tag')}</small><b>${fmtShort(total / 60 / P.len)}</b></div></div>
      <div class="hx-chart" dir="ltr">${total ? stackSvg(buckets, hasDesk) : emptyBox('⏱', L('در این بازه زمان مطالعه‌ای ثبت نشده است.', 'Keine Lernzeit in diesem Zeitraum.'))}</div>
      ${total ? `<div class="hx-legend"><div><i style="background:#8b5cf6"></i><span>${L('برنامه مطالعه آزاد', 'Freies Lernprogramm')}</span><b>${fmtShort((total - deskTotal) / 60)}</b></div>${hasDesk ? `<div><i style="background:#22d3ee"></i><span>${L('میز مطالعه (تایمر)', 'Lerntisch (Timer)')}</span><b>${fmtShort(deskTotal / 60)}</b></div>` : ''}</div>` : ''}</article>`;
    // skills: time share + score + weekly goal in one table (was: donut legend + separate goals panel)
    const palette = ['#38bdf8', '#a855f7', '#fb7185', '#f59e0b', '#34d399', '#6366f1', '#f472b6', '#22d3ee'];
    const sTime = {}, sScore = {}, sN = {}, w7 = {}, w7from = addDays(today(), -6);
    rows.forEach((r) => { Object.entries(r.times).forEach(([id, v]) => { const k = historySkillId(id); sTime[k] = (sTime[k] || 0) + (Number(v) || 0); }); Object.entries(r.scores).forEach(([id, v]) => { if (id === 'gesamt' || v == null || !Number.isFinite(Number(v))) return; const k = historySkillId(id); sScore[k] = (sScore[k] || 0) + Number(v); sN[k] = (sN[k] || 0) + 1; }); });
    split.free.filter((d) => d.date >= w7from).forEach((d) => Object.entries(d.activityTimes || {}).forEach(([id, v]) => { const k = historySkillId(id); w7[k] = (w7[k] || 0) + (Number(v) || 0); }));
    const goalKeys = (typeof SKILLS !== 'undefined' ? SKILLS : []).map((x) => (x.id === 'vocab' ? 'wortschatz' : x.id));
    const keys = [...new Set([...goalKeys, ...Object.keys(sTime).filter((k) => sTime[k] > 0)])].sort((a, b) => (sTime[b] || 0) - (sTime[a] || 0));
    const sTotal = Object.values(sTime).reduce((a, v) => a + v, 0) || 0, color = (i) => palette[i % palette.length];
    let ang = 0; const stops = keys.filter((k) => sTime[k] > 0).map((k) => { const i = keys.indexOf(k), st = ang; ang += (sTime[k] / sTotal) * 360; return `${color(i)} ${st}deg ${ang}deg`; }).join(',') || '#303349 0deg 360deg';
    const skillRows = keys.map((k, i) => {
      const t = sTime[k] || 0, share = sTotal ? Math.round((t / sTotal) * 100) : 0, sc = sN[k] ? Math.round(sScore[k] / sN[k]) : null, isGoal = goalKeys.includes(k);
      const target = Number(S.skillTargets?.[k] || 15), wk = Math.round((w7[k] || 0) / 60), gp = Math.min(100, Math.round((wk / target) * 100) || 0);
      const opts = [...new Set([5, 10, 15, 20, 30, 45, 60, 90, 120, target])].sort((a, b) => a - b).map((v) => `<option value="${v}" ${v === target ? 'selected' : ''}>${faNum(v)}</option>`).join('');
      return `<div class="hx-skill"><b><i style="background:${color(i)}"></i>${E(historyActivityLabel(k))}</b><span class="hx-st">${fmtShort(t / 60)}<small>${faNum(share)}% ${L('از کل', 'Anteil')}</small></span><span class="hx-ss">${sc == null ? '—' : faNum(sc) + '%'}</span>${isGoal ? `<div class="hx-goal"><span class="hx-bar"><em style="width:${gp}%;background:${gp >= 100 ? '#34d399' : color(i)}"></em></span><label>${faNum(wk)} / <select aria-label="${E(L('هدف هفتگی ', 'Wochenziel ') + historyActivityLabel(k))}" onchange="setSkillTarget('${k}',this.value)">${opts}</select> ${L('دقیقه در هفته', 'Min./Woche')}${gp >= 100 ? ' ✓' : ''}</label></div>` : `<span class="hx-nogoal">${L('بدون هدف هفتگی', 'ohne Wochenziel')}</span>`}</div>`;
    }).join('');
    const panelSkills = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('مهارت‌ها', 'FERTIGKEITEN')}</span><h2>${L('زمان، نمره و هدف هر مهارت', 'Zeit, Ergebnis und Ziel je Fertigkeit')}</h2></div></div>
      <div class="hx-donutwrap"><div class="hx-donut" style="background:conic-gradient(${stops})"><div><b>${faNum(Math.round(sTotal / 60))}</b><span>${L('دقیقه', 'Min.')}</span></div></div><p class="text-xs text-slate-400">${L('سهم هر مهارت از زمان مطالعه این بازه و میانگین نمره آن. هدف هفتگی هر مهارت را از فهرست کنار آن انتخاب کنید.', 'Anteil an der Lernzeit, Durchschnitt und Wochenziel (letzte 7 Tage). Ziel mit dem Regler einstellen.')}</p></div>
      <div class="hx-skillhead"><span>${L('مهارت', 'Fertigkeit')}</span><span>${L('زمان و سهم', 'Zeit · Anteil')}</span><span>${L('نمره', 'Ergebnis')}</span><span>${L('هدف هفتگی (۷ روز اخیر)', 'Wochenziel (7 Tage)')}</span></div><div class="hx-skills">${skillRows}</div></article>`;
    // combined day table (plan days + desk timer), paged
    const shown = Math.max(7, Number(S.histFreeShow) || 7);
    const dayRows = rows.slice(0, shown).map((r) => {
      const key = 'f:' + r.date, open = S.histOpenDay === key;
      const det = open ? `<div class="hx-day-detail"><div class="hx-det">${Object.entries(r.times).filter(([, v]) => Number(v) > 0).map(([id, v], i) => { const k = historySkillId(id), sc = r.scores[id] ?? r.scores[k]; return `<div style="--c:${color(keys.indexOf(k) >= 0 ? keys.indexOf(k) : i)}"><b>${E(historyActivityLabel(id))}</b><span>${fmtShort((Number(v) || 0) / 60)}${sc != null && Number.isFinite(Number(sc)) ? ' · ' + faNum(sc) + '%' : ''}</span></div>`; }).join('')}${r.desk ? `<div style="--c:#22d3ee"><b>${L('میز مطالعه (تایمر)', 'Lerntisch (Timer)')}</b><span>${fmtShort(r.desk / 60)}</span></div>` : ''}</div></div>` : '';
      return `<div class="hx-day ${open ? 'is-open' : ''}"><button type="button" class="hx-day-main" onclick="TDM.histDay('${key}')" aria-expanded="${open}"><span class="hx-day-date"><b>${E(fmtDay(r.date, 'long'))}</b><small>${r.acts ? `${faNum(r.comp)}/${faNum(r.acts)} ${L('فعالیت', 'Aktivitäten')}` : r.desk ? L('فقط میز مطالعه', 'nur Lerntisch') : L('بدون فعالیت ثبت‌شده', 'keine Aktivität')}${r.topic ? ' · ' + E(r.topic) : ''}</small></span><span class="hx-day-acts">${r.acts ? `${faNum(r.comp)}/${faNum(r.acts)}` : '—'}</span><span class="hx-day-time">${fmtShort((r.plan + r.desk) / 60)}${r.desk && r.plan ? `<small>⏱ ${fmtShort(r.desk / 60)}</small>` : ''}</span>${pill(r.score)}<span class="hx-chev">⌄</span></button>${det}</div>`;
    }).join('');
    const panelDays = `<article class="history-panel hx-panel"><div class="history-panel-head"><div><span class="history-eyebrow">${L('روزها', 'TAGE')}</span><h2>${L('کارنامه روزانه', 'Tagesübersicht')}</h2></div><span class="text-xs text-slate-400">${L('برنامه آزاد و میز مطالعه در یک جدول', 'Lernprogramm und Lerntisch zusammen')}</span></div>${rows.length ? `<div class="hx-days">${dayRows}</div>${moreBtn(shown, rows.length, 'histFreeShow')}` : emptyBox('📚', L('در این بازه مطالعه آزادی ثبت نشده است.', 'Kein freies Lernen in diesem Zeitraum.'))}</article>`;
    // site content progress: built only when opened (it is the heaviest part of the old page)
    const openC = !!S.histContentOpen, base = typeof renderHistoryPracticedContentBase === 'function' ? renderHistoryPracticedContentBase : null;
    const panelContent = base ? `<article class="history-panel hx-panel"><button type="button" class="hx-collapse-head" onclick="S.histContentOpen=!S.histContentOpen;render()" aria-expanded="${openC}"><span><span class="history-eyebrow">${L('محتوا', 'INHALTE')}</span><b>${L('محتوای تمرین‌شده سایت', 'Geübte Inhalte')}</b><small>${L('لغات، متن‌ها و سؤال‌هایی که خوانده یا مرور کرده‌اید', 'Gelesene oder wiederholte Wörter, Texte und Fragen')}</small></span><em>${openC ? '▲' : '▼'}</em></button></article>${openC ? base() : ''}` : '';
    return `${kpis}<div class="hx-grid2"><div class="hx-stack">${panelTime}${panelDays}</div><div class="hx-stack">${panelSkills}${panelContent}</div></div>`;
  }

  TDM.histTab = function (tab) { S.historyTab = tab === 'free' ? 'free' : 'plan'; S.histOpenDay = null; render(); window.scrollTo({ top: 0 }); };
  TDM.histDay = function (key) { S.histOpenDay = S.histOpenDay === key ? null : key; render(); };
  TDM.renderHistoryPage = function () {
    TDM.trackPlanId();
    const P = histPeriod(), split = splitHistory(), m = S.testdafMethod, hasPlan = TDM.enrolled() || !!(m?.days && Object.keys(m.days).length);
    const tab = !hasPlan ? 'free' : S.historyTab === 'free' || S.historyTab === 'plan' ? S.historyTab : 'plan';
    const name = S.user?.name || 'Learner', avatar = S.user?.avatarDataUrl ? `<img src="${E(S.user.avatarDataUrl)}" alt="">` : E(String(name).trim().charAt(0).toUpperCase() || 'L');
    let planSecs = 0, freeSecs = 0;
    if (hasPlan) {
      Object.values(m?.days || {}).forEach((d) => { if (P.inP(d.date)) planSecs += Math.max(split.planTime[d.date] || 0, Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0)); });
      split.free.forEach((d) => { if (P.inP(d.date)) freeSecs += Number(d.time) || 0; });
      Object.entries(deskSessions()).forEach(([k, v]) => { if (P.inP(k)) freeSecs += Number(v) || 0; });
    }
    const periods = [['week', L('۷ روز اخیر', 'Letzte 7 Tage')], ['month', L('یک ماه اخیر', 'Letzter Monat')], ['quarter', L('سه ماه اخیر', 'Letzte 3 Monate')]];
    return `<div class="history-shell hx min-h-screen pb-28 text-slate-100" dir="${isFa() ? 'rtl' : 'ltr'}" data-learning-content><main class="hx-board">
      <header class="hx-top"><div class="hx-id"><div class="hx-avatar">${avatar}</div><div><small>${L('تاریخچه و پیشرفت', 'Verlauf & Fortschritt')}</small><h1>${L('سلام', 'Hallo')}${isFa()?'، ':', '}${E(name)}</h1></div></div>
        <div class="hx-tools"><label class="hx-period"><span>${L('بازه', 'Zeitraum')}</span><select onchange="S.historyFilter=this.value;S.histPlanShow=7;S.histFreeShow=7;saveData();render()">${periods.map(([v, l]) => `<option value="${v}" ${P.f === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button type="button" class="hx-clear" onclick="clearCompleteLearningHistory()">${L('پاک‌کردن تاریخچه', 'Verlauf löschen')}</button></div></header>
      ${hasPlan ? `<nav class="hx-tabs" role="tablist"><button type="button" role="tab" aria-selected="${tab === 'plan'}" class="hx-tab ${tab === 'plan' ? 'is-cur' : ''}" onclick="TDM.histTab('plan')"><b>📋 ${L('برنامه یادگیری', 'Lernplan', 'Learning plan')}</b><small>${fmtMin(planSecs)}</small></button><button type="button" role="tab" aria-selected="${tab === 'free'}" class="hx-tab ${tab === 'free' ? 'is-cur' : ''}" onclick="TDM.histTab('free')"><b>📚 ${L('مطالعه آزاد', 'Freies Lernen')}</b><small>${fmtMin(freeSecs)}</small></button></nav>` : ''}
      ${tab === 'plan' ? histPlanTab(P, split) : histFreeTab(P, split)}
    </main></div>`;
  };

  // ═════════════ VOCABULARY NOTEBOOK (sidebar «دفتر عبارات»: mistakes + plan deck) ═════════════
  TDM.notebook = function (tab) { S.notebookTab = tab === 'deck' ? 'deck' : 'mistakes'; S.reviewMode = false; render(); window.scrollTo({ top: 0 }); };
  TDM.renderNotebook = function (renderErrors) {
    if (LEAN()) { /*LEAN4*/ S.notebookTab = 'deck'; S.reviewMode = false; try { leanMergeErrors(); } catch (e) { console.warn(e); } }
    const tab = S.notebookTab === 'deck' ? 'deck' : 'mistakes';
    if (tab === 'mistakes' && S.reviewMode && S.currentReview) return renderErrors();
    const srs = Object.values(S.testdafMethod?.srs || {}), due = srs.filter((x) => x.due <= today()).length, errCount = (S.errors || []).length;
    const bar = `<nav class="tdm-nb" dir="${isFa() ? 'rtl' : 'ltr'}" aria-label="${L('دفتر عبارات', 'Vokabelheft')}"><h1>📒 ${L('دفتر عبارات', 'Vokabelheft')}</h1><div class="tdm-nb-tabs" role="tablist"><button role="tab" aria-selected="${tab === 'mistakes'}" class="${tab === 'mistakes' ? 'is-cur' : ''}" onclick="TDM.notebook('mistakes')">${L('اشتباهات', 'Fehler')}<em>${faNum(errCount)}</em></button><button role="tab" aria-selected="${tab === 'deck'}" class="${tab === 'deck' ? 'is-cur' : ''}" onclick="TDM.notebook('deck')">${L('دفتر عبارات برنامه', 'Plan-Wortschatz')}<em>${faNum(srs.length)}</em>${due ? `<b title="${L('سررسید امروز', 'heute fällig')}">${faNum(due)}</b>` : ''}</button></div></nav>`;
    const barLean = `<nav class="tdm-nb" dir="${isFa() ? 'rtl' : 'ltr'}"><h1>📒 ${L('دفتر عبارات', 'Vokabelheft')}</h1></nav>`; /*LEAN4*/
    if (tab === 'deck' && LEAN()) { /*NB-WRITINGS*/
      const nt = S.nbLeanTab === 'texts' ? 'texts' : 'deck', nTexts = wrDays().length;
      const barT = `<nav class="tdm-nb" dir="${isFa() ? 'rtl' : 'ltr'}"><h1>📒 ${L('دفتر عبارات', 'Vokabelheft')}</h1><div class="tdm-nb-tabs" role="tablist"><button role="tab" aria-selected="${nt === 'deck'}" class="${nt === 'deck' ? 'is-cur' : ''}" onclick="TDM.nbTab('deck')">${L('لغات و عبارات', 'Wörter & Redemittel')}<em>${faNum(srs.length)}</em>${due ? `<b>${faNum(due)}</b>` : ''}</button><button role="tab" aria-selected="${nt === 'texts'}" class="${nt === 'texts' ? 'is-cur' : ''}" onclick="TDM.nbTab('texts')">${L('نوشته‌های من', 'Meine Texte')}<em>${faNum(nTexts)}</em></button></div></nav>`;
      if (nt === 'texts') return `<div class="error-v2"><main class="error-shell">${barT}<div class="tdm tdm-notebook" data-learning-content>${hubWritings()}</div></main></div>`;
      const body = hubDeck() || card(rtl(`<h3>دفتر عبارات هنوز خالی است</h3><p class="tdm-muted">لغات و Redemittel هر روز برنامه و اشتباهات مهم تمرین‌ها خودکار به این دفتر اضافه می‌شوند و با فاصله‌های ۱، ۳، ۷، ۱۴ و ۳۰ روز مرور می‌شوند.</p>`)); return `<div class="error-v2"><main class="error-shell">${barT}<div class="tdm tdm-notebook" data-learning-content>${body}</div></main></div>`; }
    if (tab === 'deck') {
      const body = hubDeck() || card(rtl(`<h3>دفتر عبارات برنامه هنوز خالی است</h3><p class="tdm-muted">لغات و Redemittel جدید هر روز در ماژول «Grammatik &amp; Wortschatz» برنامه یادگیری به این دفتر اضافه می‌شوند و با فاصله‌های ۱، ۳، ۷، ۱۴ و ۳۰ روز مرور می‌شوند.</p>${TDM.enrolled() ? '' : '<p class="tdm-muted">این دفتر مخصوص برنامه یادگیری است.</p>'}`));
      return `<div class="error-v2"><main class="error-shell">${bar}<div class="tdm tdm-notebook" data-learning-content>${body}</div></main></div>`;
    }
    return renderErrors().replace('<main class="error-shell">', '<main class="error-shell">' + bar);
  };

  // Look up a selected word/phrase in the plan's deck and content (used by "⭐ add selection to favourites").
  TDM.lookupWord = function (text) {
    const norm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
    const q = norm(text); if (!q) return null;
    const word = (v) => ({ kind: 'vocabulary', title: `${v.artikel ? v.artikel + ' ' : ''}${v.wort}`, answer: v.bedeutung_fa || '', explanation: v.beispiel || '' });
    const phrase = (v) => ({ kind: 'structure', title: v.de, answer: v.fa || '', explanation: v.beispiel || '' });
    for (const x of Object.values(S.testdafMethod?.srs || {})) { if (x.type === 'wort' ? norm(x.data.wort) === q : norm(x.data.de) === q) return x.type === 'wort' ? word(x.data) : phrase(x.data); }
    const c = CT(); if (!c) return null;
    for (const key of ['hoeren', 'lesen']) for (const it of c[key] || []) for (const v of it.vocab || []) if (norm(v.wort) === q) return word(v);
    for (const key of ['argumentation', 'grafik', 'sprechen']) for (const it of c[key] || []) for (const v of it.redemittel || []) if (v && typeof v === 'object' && norm(v.de) === q) return phrase(v);
    return null;
  };

  // ═════════════ DASHBOARD CARD & HUB ═════════════
  TDM.renderDashboardCard = function () {
    const k = S.plan?.date || today(), m = M(), def = TDM.dayDef(k), wk = m.startDate ? weekOf(k) : weekOf(k), phase = ST.phases[m.phase] || ST.phases[1];
    if (!CT()) TDM.ensureContent().then(() => { if (S.screen === 'dashboard') render(); }).catch(() => {});
    const due = TDM.srsDueCount(), focus = focusLabel(def);
    return `<div class="execution-card execution-topic-card has-topic slide-up tdm-dash" data-learning-content>
      <div class="tdm-dash-top"><span class="tdm-dash-badge">${wk === 0 ? L('روز تشخیص سطح', 'Diagnosetag') : `${L('هفته', 'Woche')} ${faNum(wk)}`}</span><span class="tdm-dash-day">${E(L(def.fa, def.de))}</span></div>
      <h3>${L('تنظیم برنامه', 'Planeinstellungen', 'Plan settings')}</h3><p class="tdm-dash-focus">${E(focus)}</p>${rtl(`<p>${E(L(def.sfa, def.sde))}${!def.evaluation && def.focus.length && def.focus.length < 4 && dailyMin() >= 120 ? ' · ' + L('همه مهارت‌ها امروز تمرین می‌شوند و زمان بیشتری به مهارت‌های تمرکز داده شده است.', 'Alle Fertigkeiten werden geübt; die Schwerpunkte bekommen mehr Zeit.', 'All skills are practised; the focus skills get more time.') : ''}${wk === 0 ? ' — ' + L('امروز با یک ارزیابی اولیه وضعیت فعلی هر چهار مهارت ثبت می‌شود.','Heute wird der Ausgangsstand in allen vier Fertigkeiten erfasst.') : ''}</p>`)}
      <div class="tdm-dash-actions"><button onclick="TDM.hub('woche')">🗓 ${L('برنامه هفته', 'Wochenplan')}</button><button onclick="TDM.hub('fortschritt')">📈 ${L('پیشرفت', 'Fortschritt')}</button><button onclick="TDM.hub('muster')">🧩 ${L('الگوهای معروف', 'Bekannte Muster', 'Famous patterns')}</button><button onclick="TDM.hub('methode')">📘 ${L('روش و قوانین', 'Methode')}</button></div>
    </div>`;
  };
  TDM.hub = function (tab) {
    tab = tab || 'woche'; if (tab !== 'grammatik') TDM._gramScroll = null;
    const go = (screen) => { if (typeof navigateApp === 'function') navigateApp(screen); else { S.screen = screen; render(); } };
    if (tab === 'fortschritt') { S.historyTab = 'plan'; S.histOpenDay = null; go('history'); window.scrollTo({ top: 0 }); return; }
    if (tab === 'deck') { S.notebookTab = 'deck'; S.reviewMode = false; go('errorbook'); window.scrollTo({ top: 0 }); return; }
    if (tab === 'texts') { if (LEAN()) { S.notebookTab = 'deck'; S.nbLeanTab = 'texts'; S.reviewMode = false; go('errorbook'); window.scrollTo({ top: 0 }); return; } tab = 'proben'; }
    // switching tabs inside the hub: the tab strip and the page keep their scroll position
    const strip = S.screen === 'methodHub' ? document.querySelector('.tdm-tabs') : null, keep = strip ? strip.scrollLeft : null;
    S.tdmHubTab = tab; S.screen = 'methodHub'; render();
    if (keep == null) { window.scrollTo({ top: 0 }); return; }
    const next = document.querySelector('.tdm-tabs'); if (next) next.scrollLeft = keep;
  };
  TDM.renderHub = function () {
    const tab = ['woche', 'proben', 'muster', 'grammatik', 'methode'].includes(S.tdmHubTab) ? S.tdmHubTab : 'woche', m = M();
    const tabs = [['woche', L('برنامه هفته', 'Wochenplan')], ['proben', L('نمونه نوشته‌ها', 'Schreibproben')], ['muster', L('الگوهای معروف', 'Bekannte Muster', 'Famous patterns')], ['grammatik', L('گرامر هفته‌ها', 'Grammatik')], ['methode', L('روش و قوانین', 'Methode')]].filter((t) => !(LEAN() && t[0] === 'proben')); /*NB-WRITINGS*/
    if (LEAN() && tab === 'proben') return (S.tdmHubTab = 'woche', TDM.renderHub());
    let body = '';
    if (tab === 'woche') body = hubWeek(); else if (tab === 'proben') body = hubProben(); else if (tab === 'muster') body = hubMuster(); else if (tab === 'grammatik') { const gw = grammarOfWeek(Math.max(1, weekOf(today()))).week; body = ST.grammar.map((g) => card(grammarCard(g)).replace('class="tdm-card', g.week === gw ? 'id="tdmGramCur" class="tdm-card is-cur-week' : 'class="tdm-card')).join(''); if (TDM._gramScroll !== S.tdmHubTab + today()) { TDM._gramScroll = S.tdmHubTab + today(); setTimeout(() => { const el = document.getElementById('tdmGramCur'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 120); } } else body = hubMethod();
    return `<div class="tdm tdm-hub" data-learning-content><header class="tdm-top"><button class="tdm-back" onclick="S.screen='dashboard';render()">← ${E(examPlanLabel())}</button><div class="tdm-top-title"><div><h1>${L('تنظیم برنامه', 'Lernplan')}</h1><span class="tdm-muted">${L('یک برنامه برای همه؛ آزمون TestDaF یا ÖSD را در «شبیه‌سازی آزمون» تمرین کنید', 'Ein Plan für alle – TestDaF und ÖSD üben Sie in der Prüfungssimulation')}</span></div></div></header>
      <nav class="tdm-nb tdm-hub-nb" dir="${isFa() ? 'rtl' : 'ltr'}"><div class="tdm-nb-tabs tdm-tabs" role="tablist">${tabs.map(([id, l]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'is-cur' : ''}" onclick="TDM.hub('${id}')">${E(l)}</button>`).join('')}</div></nav>${body}</div>`;
  };
  function renderWeekSettings() {
    const m=M(), tab=['focus','order'].includes(S.tdmWeekSettingsTab)?'focus':'time' /*BATCH2*/, k=S.plan?.date||today(), defs=DDEF(), choices=[6,0,1,2,3];
    const extra=Number(S.plan?.activities?.find(a=>a.id==='extra')?.dur)||0, extraDone=(S.completedActivities||[]).includes('extra'), extraStarted=(Number(S.activityTimers?.extra)||0)>0;
    const items=(TDM.active()&&S.plan?.activities?.every(a=>a.type==='method')?S.plan.activities.filter(a=>a.id!=='extra'):moduleOrder(k).map(id=>({id,title:MODS[id]?.de||id,dur:minutesFor(k)[id]||0}))).filter(a=>a.id!=='extra');
    const tabs=[['time',L('زمان و مسیر','Zeit & Weg','Time & path')],['focus',L('تمرکز و ترتیب','Fokus & Reihenfolge','Focus & order')]];
    const time=()=>`${dailyPicker()}<div class="tdm-week-extra"><b>${L('زمان اضافه امروز','Extrazeit heute','Extra time today')}</b><p class="tdm-muted">${L('برای مرور لغت، اشتباهات و شنیدن دوباره؛ جدا از زمان اصلی برنامه است.','Für Wortschatz, Fehler und erneutes Hören; zusätzlich zur regulären Planzeit.','For words, errors and listening again; separate from the regular program time.')}</p><div class="tdm-extra-btns" dir="ltr">${EXTRA_CHOICES.map(n=>`<button type="button" class="${n===extra?'is-cur':''}" ${!TDM.active()||extraDone||(n===0&&extraStarted)?'disabled':''} onclick="TDM.setExtra(${n})">${n?'+'+faNum(n):L('بدون','Keine','None')}</button>`).join('')}</div></div>`;
    /*FOCUS-MERGE*//*DRAG-SWAP*/const tk=S.plan?.date||today(), twd=wdOf(tk), SK=['hoeren','lesen','schreiben','sprechen'], FDAYS=[6,0,1,2,3,4];
    const dkey=(wd)=>wd===twd?tk:(Object.keys(m.days||{}).find(k=>wdOf(k)===wd)||addDays(satOf(today()),(wd+1)%7));
    const focus=()=>`<p class="tdm-muted">${L('روی هر تمرین بزنید تا تمرکز آن روز شود (حداکثر دو تمرین؛ زمان تمرین‌های متمرکز بیشتر می‌شود). برای تغییر ترتیب، تمرین را بالا یا پایین بکشید: اگر روی تمرین دیگری از همان روز رها کنید جایشان عوض می‌شود، وگرنه به نزدیک‌ترین جای رها کردن می‌رود. با کلیک روی عدد دقیقه، زمان هر تمرین در آن روز قابل تغییر است. جمعه روز آزمون و ارزیابی است.','Tippe eine Übung an, um sie zum Tagesschwerpunkt zu machen (höchstens zwei). Zum Umordnen ziehst du eine Übung nach oben oder unten: auf einer anderen Übung desselben Tages losgelassen, tauschen beide die Plätze, sonst landet sie an der nächstgelegenen Stelle. Freitag ist Prüfungs- und Auswertungstag.','Tap an exercise to make it the day’s focus (two at most). To reorder, drag it up or down: dropped on another exercise of the same day the two swap places, otherwise it goes to the nearest spot. Friday is the exam and review day.')}</p><div class="tdm-week-focus-grid tdm-fm-grid">${FDAYS.map(wd=>{const k=dkey(wd),isToday=wd===twd,def=TDM.dayDef(k),chosen=(def.focus||[]).length<=2?(def.focus||[]):[],ids=isToday?items.map(a=>a.id):moduleOrder(k).filter(x=>x!=='extra'),durs=isToday?Object.fromEntries(items.map(a=>[a.id,a.dur])):minutesFor(k),customF=!!m.weekFocus?.[wd],customO=!!m.weekOrder?.[wd]||(isToday&&!!m.dayOrder?.[tk]),customM=!!m.weekMin?.[wd];return`<div class="tdm-week-focus-day ${isToday?'is-today':''}"><div class="tdm-week-focus-heading"><b>${E(L(def.fa,def.de))} <small class="tdm-fo-total">Σ ${faNum(ids.reduce((a,id)=>a+(Number(durs[id])||0),0))}′</small>${isToday?` <em class="tdm-fo-badge">${L('امروز','Heute','Today')}</em>`:''}</b><span class="tdm-fo-acts">${customF?`<button type="button" onclick="TDM.resetWeekFocus(${wd})">${L('بازنشانی تمرکز','Fokus zurücksetzen','Reset focus')}</button>`:''}${customO?`<button type="button" onclick="TDM.resetWeekOrder(${wd})">${L('ترتیب پیشنهادی','Empfohlene Reihenfolge','Suggested order')}</button>`:''}${customM?`<button type="button" onclick="TDM.resetWeekMin(${wd})">${L('زمان پیشنهادی','Empfohlene Zeiten','Suggested times')}</button>`:''}</span></div><ol class="tdm-week-order tdm-fo-list tdm-fm-list" data-wd="${wd}">${ids.map((id,n)=>{const sk=SK.includes(id),on=sk&&chosen.includes(id);return`<li data-ord="${id}" class="${on?'is-cur':''}" draggable="true" ondragstart="TDM.fmStart(event,'${id}',${wd})"><span class="tdm-fo-num">${faNum(n+1)}</span><button type="button" class="tdm-fo-name" draggable="false" ${sk?`onclick="TDM.setWeekFocus(${wd},'${id}')" aria-pressed="${on}" title="${L('تمرکز این روز','Schwerpunkt dieses Tages','Focus of this day')}"`:'disabled'}>${E(L(MODS[id]?.fa||id,MODS[id]?.de||id))}${on?'<i class="tdm-fm-star">★</i>':''}</button><button type="button" class="tdm-fm-min" draggable="false" data-v="${Number(durs[id])||0}" title="${L('برای تغییر زمان کلیک کنید','Zum Ändern klicken','Click to change')}" onclick="TDM.editMin(this,${wd},'${id}')">${faNum(Number(durs[id])||0)}′</button><span class="tdm-week-order-grip" aria-hidden="true">⠿</span></li>`}).join('')}</ol></div>`}).join('')}</div>`;
    return `<section class="tdm-card tdm-week-config" data-learning-content><div class="tdm-week-config-head"><div><span class="tdm-kicker">${L('کنترل برنامه','PROGRAMM EINSTELLEN','PROGRAM SETTINGS')}</span><h2>${L('برنامه هفته را به روش خودتان بچینید','Gestalte deinen Wochenplan','Make the weekly program your own')}</h2><p class="tdm-muted">${L('همه تنظیمات برنامه در همین صفحه است. تغییرها ذخیره می‌شوند و داشبورد برای اجرای سریع خلوت می‌ماند.','Alle Programmeinstellungen sind hier. Änderungen werden gespeichert und das Dashboard bleibt fürs schnelle Lernen übersichtlich.','Keep program settings here. Changes are saved, and the dashboard stays clear for quick practice.')}</p></div></div><div class="tdm-week-config-body tdm-wc-stack" data-wc-stack><section class="tdm-wc-sec"><h3 class="tdm-wc-title">${tabs[0][1]}</h3>${time()}</section><section class="tdm-wc-sec"><h3 class="tdm-wc-title">${tabs[1][1]}</h3>${focus()}</section></div></section>`;
  }
  function hubWeek() {
    const k = today(), m = M(), wk = weekOf(k), [from] = weekRange(Math.max(1, wk));
    const days = [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(wk === 0 ? satOf(k) : from, n));
    const fmt = (n) => `${faNum(n)}′`;
    const rows = days.map((dk) => { const def = TDM.dayDef(dk), d = m.days[dk], done = d ? Object.keys(d.results || {}).filter((x) => x !== 'extra').length : 0; const foc = def.evaluation || def.focus.length === 4 ? E(focusLabel(def)) : `<span class="tdm-focus-tag">${L('تمرکز بیشتر', 'Schwerpunkt', 'More focus')}</span> ${def.focus.map((f) => `<b dir="ltr">${E(L(MODS[f].fa, MODS[f].de))} ${fmt(minutesFor(dk)[f] || 0)}</b>`).join(' + ')}`; return `<tr class="${dk === k ? 'is-today' : ''}"><td><b>${E(L(def.fa, def.de))}</b><small>${E(dk)}</small></td><td>${foc}</td><td>${E(L(def.sfa, def.sde))}</td><td>${d ? `${faNum(done)}/${faNum(6)}` : dk < k ? '—' : ''}</td></tr>`; }).join('');
    const cols = [['hoeren', 'Hören'], ['lesen', 'Lesen'], ['schreiben', 'Schreiben'], ['sprechen', 'Sprechen'], ['wortschatz', 'G & W'], ['wiederholung', 'Wdh.']].filter((c) => !(LEAN() && LEAN_DROP.includes(c[0]))); /*LEAN4*/
    const matrix = days.map((dk) => { const def = TDM.dayDef(dk), ev = !!def.evaluation; return `<tr class="${dk === k ? 'is-today' : ''}"><td><b>${E(L(def.fa, def.de))}</b>${def.exam ? `<small>${L('آزمون زمان‌دار', 'Prüfungsmodus', 'Exam mode')}</small>` : ev ? `<small>${L('آزمون هفتگی', 'Wochentest', 'Weekly test')}</small>` : ''}</td>${cols.map(([id]) => { const real = ev && id === 'wortschatz' ? 'fehleranalyse' : ev && id === 'wiederholung' ? 'wochenbericht' : id, v = minutesFor(dk)[real], hi = !ev && !def.exam && def.focus.includes(id); return `<td class="${hi ? 'is-focus' : ''}">${v ? fmt(v) : '—'}${real !== id ? `<small dir="ltr">${E(MODS[real].de)}</small>` : ''}</td>`; }).join('')}</tr>`; }).join('');
    return renderWeekSettings() /*NO-WEEK-TABLE: «برنامه هفتگی» table removed (owner request); WC-STACK: «ساختار آزمون» stays*/
      + card(`<h3 dir="auto">${L('ساختار آزمون', 'Prüfungsaufbau', 'Exam structure')}</h3><table class="tdm-table"><tbody>${ST.examStructure.map((r) => `<tr><td dir="ltr"><b>${L(r.skill, r.skill)}</b></td><td>${r.tasks}</td><td>${r.minutes}</td></tr>`).join('')}</tbody></table>${rtl(`<p class="tdm-muted">${L('تمرین‌ها تا حد امکان مطابق ساختار و نوع سؤالات آزمون واقعی طراحی شده‌اند.','Die Übungen orientieren sich möglichst an Aufbau und Aufgabentypen der echten Prüfung.')}</p>`)}`);
  }
  TDM.exportAnki = function () {
    const rows = Object.values(M().srs).map((x) => x.type === 'wort' ? [`${x.data.artikel ? x.data.artikel + ' ' : ''}${x.data.wort}`, `${x.data.bedeutung_fa}<br>${x.data.plural && x.data.plural !== '—' ? 'Pl. ' + x.data.plural + '<br>' : ''}${x.data.perfekt ? 'Perfekt: ' + x.data.perfekt + '<br>' : ''}${(x.data.koll || []).join(' · ')}<br><i>${x.data.beispiel}</i>`, 'amookht::wort'] : [x.data.de, `${x.data.fa}<br><i>${x.data.beispiel || ''}</i>`, 'amookht::redemittel']);
    const csv = rows.map((r) => r.map((c) => '"' + String(c || '').replace(/"/g, '""') + '"').join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), l = document.createElement('a');
    l.href = url; l.download = `amookht-anki-${today()}.csv`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const ART_CLS = { der: 'm', die: 'f', das: 'n' };
  const deckAll = () => Object.values(M().srs);
  const deckFront = (x) => (x.type === 'wort' ? `${x.data.artikel ? x.data.artikel + ' ' : ''}${x.data.wort}` : x.data.de);
  const deckNorm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
  function deckMatch(x, f) { return f === 'all' || (f === 'due' && x.due <= today()) || (f === 'mine' && !!x.data.custom) || x.type === f; }
  TDM.deckAddOpen = function (open) { S.deckAdd = open == null ? !S.deckAdd : !!open; S.deckMsg = null; render(); /*DECK-MODAL: shown as a window, Esc closes*/ if (!TDM._deckEsc) { TDM._deckEsc = true; document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.deckAdd && document.getElementById('tdmDeckForm')) { e.preventDefault(); TDM.deckAddOpen(false); } }, true); } };
  TDM.deckType = function (t) { const f = document.getElementById('tdmDeckForm'); if (!f) return; f.dataset.type = t; f.querySelectorAll('.tdm-seg button').forEach((b) => b.classList.toggle('is-cur', b.dataset.t === t)); const el = document.getElementById(t === 'wort' ? 'tdmNewWord' : 'tdmNewDe'); if (el) el.focus(); };
  /*DECK-AIMEAN*/ // 2026-11-15 (owner): meaning optional — premium: AI fills it; otherwise saved without meaning
  async function deckAiMeaning(text) {
    /*AI-GATE*/ try { if (typeof hasPremiumAccess !== 'function' || !hasPremiumAccess()) return null; } catch (e) { return null; }
    try {
      const tok = (typeof authTokens === 'function' ? authTokens() : null)?.access_token; if (!tok) return null;
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch('/coach/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ text }), signal: ctl.signal });
      clearTimeout(tm); if (!r.ok) return null;
      const d = await r.json(), fa = String(d.translation || '').trim();
      if (!fa || !/[؀-ۿ]/.test(fa)) return null;
      const info = String(d.word_info || ''), hw = String(d.headword_de || '');
      const art = (hw.match(/^(der|die|das)\s/i) || info.match(/^(der|die|das)\s/i) || [])[1];
      const pl = info.match(/Pl(?:ural)?\.?:?\s*(?:die\s+)?([^\s,·;–]+)/i);
      return { fa, art: art ? art.toLowerCase() : '', pl: pl ? pl[1] : '' };
    } catch (e) { return null; }
  }
  const deckAiOn = () => { try { return typeof hasPremiumAccess === 'function' && hasPremiumAccess(); } catch (e) { return false; } };
  function deckCommit(type, data, front) {
    const k = today(), n = deckNorm(front);
    const ref = 'my-' + (n.replace(/[^a-zäöüß0-9]+/g, '-').replace(/^-|-$/g, '') || uid()) + '-' + uid().slice(0, 4);
    srsAdd(type, ref, data, k);
    const c = M().srs[type + ':' + ref];
    if (c) c.due = k; // own entries can be reviewed right away
    try { registerSiteWords([siteVocabItem(c)]); } catch (e) { console.warn(e); }
    const noMean = !(type === 'wort' ? data.bedeutung_fa : data.fa);
    S.deckMsg = L(`«${front}» به دفتر عبارات اضافه شد و از امروز در چرخه مرور است.`, `„${front}“ wurde hinzugefügt und ist ab heute in der Wiederholung.`, `“${front}” was added and is in your review cycle from today.`) + (noMean ? L(' (بدون معنی)', ' (ohne Bedeutung)', ' (without meaning)') : '');
    S.deckFilter = 'all';
    saveData(); render();
  }
  TDM.deckSave = function () {
    if (TDM._deckBusy) return;
    const g = (id) => (document.getElementById(id)?.value || '').trim();
    const f = document.getElementById('tdmDeckForm'), type = f?.dataset.type === 'redemittel' ? 'redemittel' : 'wort';
    const msg = (t, cls) => { const el = document.getElementById('tdmDeckMsg'); if (el) { el.textContent = t; el.className = 'tdm-deck-msg' + (cls ? ' ' + cls : ''); } };
    const fail = (t) => msg(t, 'is-err');
    let data, front;
    if (type === 'wort') {
      let wort = g('tdmNewWord').replace(/\s+/g, ' '), artikel = g('tdmNewArt'); const mm = wort.match(/^(der|die|das)\s+(.+)$/i);
      if (mm) { wort = mm[2].trim(); if (!artikel) artikel = mm[1].toLowerCase(); }
      if (!wort) return fail(L('لغت آلمانی را بنویس.', 'Bitte das Wort eingeben.', 'Please enter the German word.'));
      data = { wort, artikel, plural: g('tdmNewPl'), wortart: g('tdmNewPos') || (artikel ? 'Nomen' : ''), bedeutung_fa: g('tdmNewMean'), beispiel: g('tdmNewEx'), koll: g('tdmNewKoll').split(/\s*[,،;|]\s*/).filter(Boolean).slice(0, 5), perfekt: '', custom: true };
      front = wort;
    } else {
      const de = g('tdmNewDe').replace(/\s+/g, ' ');
      if (!de) return fail(L('عبارت آلمانی را بنویس.', 'Bitte den Ausdruck eingeben.', 'Please enter the German phrase.'));
      data = { de, fa: g('tdmNewFa'), beispiel: g('tdmNewEx2'), custom: true };
      front = de;
    }
    const n = deckNorm(front);
    if (deckAll().some((x) => x.type === type && deckNorm(x.type === 'wort' ? x.data.wort : x.data.de) === n)) return fail(L('این مورد از قبل در دفتر عبارات هست.', 'Dieser Eintrag ist schon im Heft.', 'This entry is already in your notebook.'));
    const meanKey = type === 'wort' ? 'bedeutung_fa' : 'fa';
    if (data[meanKey] || !deckAiOn()) return deckCommit(type, data, front);
    TDM._deckBusy = true;
    msg(L('در حال پیدا کردن معنی با هوش مصنوعی…', 'Bedeutung wird mit KI gesucht …', 'Finding the meaning with AI …'));
    deckAiMeaning(type === 'wort' ? (data.artikel ? data.artikel + ' ' : '') + data.wort : data.de).then((r) => {
      if (r) {
        data[meanKey] = r.fa;
        if (type === 'wort') { if (!data.artikel && r.art) { data.artikel = r.art; if (!data.wortart) data.wortart = 'Nomen'; } if (!data.plural && r.pl) data.plural = r.pl; }
      }
    }).finally(() => { TDM._deckBusy = false; deckCommit(type, data, front); });
  };
  TDM.deckAddEntry = function (type, data) {
    type = type === 'redemittel' ? 'redemittel' : 'wort';
    const front = type === 'wort' ? data?.wort : data?.de, n = deckNorm(front);
    if (!n) return { ok: false };
    if (deckAll().some((x) => x.type === type && deckNorm(x.type === 'wort' ? x.data.wort : x.data.de) === n)) return { ok: false, dup: true };
    const ref = 'my-' + (n.replace(/[^a-zäöüß0-9]+/g, '-').replace(/^-|-$/g, '') || uid()) + '-' + uid().slice(0, 4), k = today();
    const clean = type === 'wort' ? { wort: String(data.wort).trim(), artikel: data.artikel || '', plural: data.plural || '', wortart: data.wortart || (data.artikel ? 'Nomen' : ''), bedeutung_fa: data.bedeutung_fa || '', beispiel: data.beispiel || '', koll: arr(data.koll).slice(0, 5), perfekt: '', custom: true } : { de: String(data.de).trim(), fa: data.fa || '', beispiel: data.beispiel || '', custom: true };
    srsAdd(type, ref, clean, k);
    const c = M().srs[type + ':' + ref]; if (c) c.due = k;
    try { registerSiteWords([siteVocabItem(c)]); } catch (e) { console.warn(e); }
    saveData(); if (S.screen === 'errorbook') render();
    return { ok: true };
  };
  TDM.deckDel = async function (key) {
    const x = M().srs[key]; if (!x) return;
    /*QUICKDEL: no confirm*/
    delete M().srs[key]; saveData(); render();
  };
  TDM.deckFilter = function (f) {
    if (f != null) S.deckFilter = f;
    const root = document.getElementById('tdmDeck'); if (!root) return;
    const fl = S.deckFilter || 'all', q = deckNorm(document.getElementById('tdmDeckQ')?.value || '');
    root.querySelectorAll('.tdm-vchips button').forEach((b) => b.classList.toggle('is-cur', b.dataset.f === fl));
    let shown = 0;
    root.querySelectorAll('.tdm-vc').forEach((el) => { const ok = (fl === 'all' || (fl === 'due' && el.dataset.due === '1') || (fl === 'mine' && el.dataset.mine === '1') || el.dataset.kind === fl) && (!q || el.dataset.q.includes(q)); el.hidden = !ok; if (ok) shown++; });
    const none = document.getElementById('tdmDeckNone'); if (none) none.hidden = shown > 0;
  };
  TDM.deckReview = function (on) { S.deckReview = !!on; S.deckFlip = false; S.deckRevAi = null; S.deckRevExText = ''; if (on) S.deckSession = { ok: 0, no: 0, total: deckAll().filter((x) => x.due <= today()).length }; render(); window.scrollTo({ top: 0 }); };
  TDM.deckShow = function () { if (S.deckRevEx && deckRevAiOn() && !deckRevDone()) return; S.deckFlip = true; render(); };
  /*REV-MODE*/ // 2026-11-20 (owner): review both ways; premium-only mandatory example corrected by AI before the next card
  const deckRevAiOn = () => { try { return typeof hasPremiumAccess === 'function' && hasPremiumAccess(); } catch (e) { return false; } };
  const deckRevDone = () => !!(S.deckRevAi && !S.deckRevAi.busy && !S.deckRevAi.error && (S.deckRevAi.ok || S.deckRevAi.corrected));
  TDM.deckRevMode = function (m) { S.deckRevMode = m === 'fa2de' ? 'fa2de' : 'de2fa'; S.deckFlip = false; S.deckRevAi = null; S.deckRevExText = ''; render(); };
  TDM.deckRevEx = function (on) { S.deckRevEx = !!on && deckRevAiOn(); S.deckFlip = false; S.deckRevAi = null; S.deckRevExText = ''; render(); };
  TDM.deckRevExIn = function (el) {
    const v = String(el?.value || '');
    S.deckRevExText = v;
    const typed = v.trim().length >= 3;
    if (S.deckRevAi) { S.deckRevAi = null; render(); return; } // edited after a check → must be checked again
    const b = document.getElementById('tdmVrAiBtn'); if (b) b.disabled = !typed;
    const need = document.getElementById('tdmVrExNeed'); if (need) need.hidden = typed;
  };
  TDM.deckRevCheck = async function (key) {
    if (!deckRevAiOn()) return;
    const text = String(document.getElementById('tdmVrEx')?.value || S.deckRevExText || '').trim();
    if (text.length < 3) { document.getElementById('tdmVrEx')?.focus(); return; }
    if (S.deckRevAi?.busy) return;
    S.deckRevExText = text; S.deckRevAi = { key, busy: true, text }; render();
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const tm = setTimeout(() => { try { ctl?.abort(); } catch (e) { /* ignore */ } }, 25000);
    try {
      const r = await apiRequest('/method/sentences-feedback', { method: 'POST', body: JSON.stringify({ sentences: [text], grammar: '' }), signal: ctl?.signal });
      const res = Array.isArray(r?.results) ? r.results[0] : null;
      if (!res) throw new Error('empty');
      S.deckRevAi = { key, ok: !!res.ok, corrected: String(res.corrected || '').trim(), reason_fa: String(res.reason_fa || '').trim(), text };
    } catch (e) {
      S.deckRevAi = { key, error: true, text };
    }
    clearTimeout(tm); render();
  };
  TDM.deckRate = function (key, ok) {
    if (S.deckRevEx && deckRevAiOn() && !deckRevDone()) return;
    const c = M().srs[key]; if (!c) return; srsRate(key, ok); syncSiteWord(c, ok); const s = S.deckSession || (S.deckSession = { ok: 0, no: 0, total: 0 }); if (ok) s.ok++; else s.no++; S.deckRevAi = null; S.deckRevExText = ''; S.deckFlip = false; saveData(); render();
  };
  function deckCard(x, fl) {
    const d = x.data || {}, w = x.type === 'wort', art = w ? String(d.artikel || '').toLowerCase() : '', due = x.due <= today();
    const q = deckNorm([w ? d.wort : d.de, w ? d.bedeutung_fa : d.fa, d.beispiel, w ? (d.koll || []).join(' ') : ''].join(' '));
    const stage = clamp(Number(x.stage) || 0, 0, 4);
    return `<article class="tdm-vc ${w ? 'is-wort' : 'is-red'} ${ART_CLS[art] ? 'art-' + ART_CLS[art] : ''}" data-kind="${w ? 'wort' : 'redemittel'}" data-due="${due ? 1 : 0}" data-mine="${d.custom ? 1 : 0}" data-q="${E(q)}"${deckMatch(x, fl) ? '' : ' hidden'}>
      <header><span class="tdm-vc-tag">${w ? E(d.wortart || L('لغت', 'Wort', 'Word')) : 'Redemittel'}</span>${d.custom ? `<span class="tdm-vc-mine">✍ ${L('افزوده من', 'Eigener Eintrag', 'My entry')}</span>` : ''}<span class="tdm-vc-tools">${favCard(x)}<button type="button" class="tdm-vc-del amk-qdel" title="${L('حذف', 'Löschen', 'Delete')}" aria-label="${L('حذف', 'Löschen', 'Delete')}" onclick="event.stopPropagation();TDM.deckDel('${E(x.key)}')">×</button></span></header>
      <h4 dir="ltr">${art ? `<i>${E(art)}</i> ` : ''}${E(w ? d.wort : d.de)}</h4>
      ${w && (d.plural && d.plural !== '—' || d.perfekt) ? `<small class="tdm-vc-forms" dir="ltr">${[d.plural && d.plural !== '—' ? 'Pl. ' + E(d.plural) : '', d.perfekt ? 'Perfekt: ' + E(d.perfekt) : ''].filter(Boolean).join(' · ')}</small>` : ''}
      <p class="tdm-vc-mean" dir="rtl">${E(w ? d.bedeutung_fa : d.fa)}</p>
      ${d.beispiel ? `<p class="tdm-vc-ex" dir="ltr">${E(d.beispiel)}</p>` : ''}
      ${w && (d.koll || []).length ? `<p class="tdm-vc-koll" dir="ltr">${(d.koll || []).slice(0, 3).map((c) => `<span>${E(c)}</span>`).join('')}</p>` : ''}
      <footer><span class="tdm-vc-stage" title="${L('مرحله مرور', 'Stufe', 'Stage')} ${faNum(stage + 1)}/۵">${[0, 1, 2, 3, 4].map((i) => `<i class="${i <= stage ? 'on' : ''}"></i>`).join('')}</span><span class="tdm-vc-due ${due ? 'is-due' : ''}">${due ? L('سررسید امروز', 'heute fällig', 'due today') : `${L('مرور بعدی', 'Fällig', 'Next')} ${E(x.due)}`}</span></footer>
    </article>`;
  }
  function deckForm() {
    if (!S.deckAdd) return '';
    const fld = (id, label, ph, extra = '', dir = 'ltr') => `<label class="tdm-fld ${extra}"><span>${label}</span><input id="${id}" dir="${dir}" placeholder="${E(ph)}" autocomplete="off" autocapitalize="off" spellcheck="false" onkeydown="if(event.key==='Enter'){event.preventDefault();TDM.deckSave()}"></label>`;
    /*DECK-MODAL*/ return `<div class="tdm-deckmodal" role="dialog" aria-modal="true" onclick="if(event.target===this)TDM.deckAddOpen(false)"><section class="tdm-deckform" id="tdmDeckForm" data-type="wort">
      <div class="tdm-deckform-head"><h3>${L('افزودن به دفتر عبارات', 'Neuer Eintrag', 'Add to notebook')}</h3><div class="tdm-seg" role="tablist"><button type="button" data-t="wort" class="is-cur" onclick="TDM.deckType('wort')">${L('لغت', 'Wort', 'Word')}</button><button type="button" data-t="redemittel" onclick="TDM.deckType('redemittel')">${L('عبارت / Redemittel', 'Redemittel', 'Phrase')}</button></div></div>
      <div class="tdm-deckform-grid only-wort">
        <label class="tdm-fld sm"><span>${L('حرف تعریف', 'Artikel', 'Article')}</span><select id="tdmNewArt" dir="ltr"><option value="">—</option><option>der</option><option>die</option><option>das</option></select></label>
        ${fld('tdmNewWord', L('لغت آلمانی *', 'Wort *', 'German word *'), 'z. B. die Nachhaltigkeit', 'grow')}
        ${fld('tdmNewMean', (deckAiOn() ? L('معنی (خالی = هوش مصنوعی)', 'Bedeutung (leer = KI)', 'Meaning (empty = AI)') : L('معنی (اختیاری)', 'Bedeutung (optional)', 'Meaning (optional)')), L('مثلاً: پایداری', 'z. B. پایداری', 'e.g. sustainability'), 'grow', 'auto')}
        ${fld('tdmNewPl', L('جمع', 'Plural', 'Plural'), 'die Nachhaltigkeiten', 'pl')}
        <label class="tdm-fld"><span>${L('نوع کلمه', 'Wortart', 'Part of speech')}</span><select id="tdmNewPos" dir="ltr"><option value="">—</option><option>Nomen</option><option>Verb</option><option>Adjektiv</option><option>Adverb</option><option>Präposition</option><option>Ausdruck</option></select></label>
        ${fld('tdmNewEx', L('جمله نمونه', 'Beispielsatz', 'Example sentence'), 'Nachhaltigkeit spielt eine große Rolle.', 'full')}
        ${fld('tdmNewKoll', L('ترکیب‌ها (با کاما جدا کن)', 'Kollokationen (mit Komma)', 'Collocations (comma-separated)'), 'auf Nachhaltigkeit achten, ökologische Nachhaltigkeit', 'full')}
      </div>
      <div class="tdm-deckform-grid only-red">
        ${fld('tdmNewDe', L('عبارت آلمانی *', 'Ausdruck *', 'German phrase *'), 'Daraus lässt sich schließen, dass …', 'full')}
        ${fld('tdmNewFa', (deckAiOn() ? L('معنی (خالی = هوش مصنوعی)', 'Bedeutung (leer = KI)', 'Meaning (empty = AI)') : L('معنی (اختیاری)', 'Bedeutung (optional)', 'Meaning (optional)')), L('از این می‌توان نتیجه گرفت که …', 'Bedeutung', 'Meaning'), 'full', 'auto')}
        ${fld('tdmNewEx2', L('جمله نمونه', 'Beispielsatz', 'Example sentence'), 'Daraus lässt sich schließen, dass …', 'full')}
      </div>
      <div class="tdm-deckform-foot"><p id="tdmDeckMsg" class="tdm-deck-msg ${S.deckMsg ? 'is-ok' : ''}" role="status">${S.deckMsg ? '✓ ' + E(S.deckMsg) : L('موارد ستاره‌دار (*) لازم هستند. با Enter هم ذخیره می‌شود.', 'Pflichtfelder sind mit * markiert. Enter speichert.', 'Fields marked * are required. Enter saves.')}</p><div><button type="button" class="tdm-btn" onclick="TDM.deckAddOpen(false)">${L('بستن', 'Schließen', 'Close')}</button><button type="button" class="tdm-btn primary" onclick="TDM.deckSave()">＋ ${L('ذخیره در دفتر', 'Speichern', 'Save')}</button></div></div>
    </section></div>`;
  }
  function deckReviewHtml() {
    const q = deckAll().filter((x) => x.due <= today()).sort((a, b) => a.due.localeCompare(b.due)), s = S.deckSession || { ok: 0, no: 0, total: q.length };
    const total = Math.max(s.total || 0, q.length + s.ok + s.no), doneN = s.ok + s.no;
    const mode = S.deckRevMode === 'fa2de' ? 'fa2de' : 'de2fa', aiOn = deckRevAiOn(), exOn = !!S.deckRevEx && aiOn;
    const modes = `<div class="tdm-vr-modes" role="tablist"><button type="button" role="tab" aria-selected="${mode === 'de2fa'}" class="${mode === 'de2fa' ? 'is-cur' : ''}" onclick="TDM.deckRevMode('de2fa')">${L('کلمه ← معنی', 'Wort → Bedeutung', 'Word → meaning')}</button><button type="button" role="tab" aria-selected="${mode === 'fa2de'}" class="${mode === 'fa2de' ? 'is-cur' : ''}" onclick="TDM.deckRevMode('fa2de')">${L('معنی ← کلمه', 'Bedeutung → Wort', 'Meaning → word')}</button></div>`;
    const exChk = aiOn
      ? `<label class="tdm-vr-exchk"><input type="checkbox" ${exOn ? 'checked' : ''} onchange="TDM.deckRevEx(this.checked)"><span>${L('مثال اجباری: با هر کارت یک جمله بنویس تا هوش مصنوعی تصحیحش کند', 'Beispielpflicht: zu jeder Karte einen Satz schreiben, den die KI prüft', 'Example required: write a sentence for every card so the AI can check it')}</span></label>`
      : `<div class="tdm-vr-exchk is-locked" dir="auto">🔒 ${L('«مثال اجباری» با تصحیح هوش مصنوعی ویژهٔ پرمیوم، مالک و مدیر است.', '„Beispielpflicht“ mit KI-Korrektur ist nur für Premium, Inhaber und Admin.', '“Example required” with AI checking is for Premium, owner and admin only.')}</div>`;
    const head = `<div class="tdm-vr-top"><button type="button" class="tdm-btn" onclick="TDM.deckReview(false)">← ${L('بازگشت به دفتر', 'Zurück zum Heft', 'Back to notebook')}</button><span>${faNum(doneN)} / ${faNum(total)}</span></div>${modes}${exChk}<div class="tdm-vr-bar"><i style="width:${total ? Math.round(doneN / total * 100) : 100}%"></i></div>`;
    if (!q.length) return `<section class="tdm-vr">${head}<div class="tdm-vr-card is-done"><div class="tdm-vr-emoji">🎉</div><h3>${L('مرور امروز تمام شد', 'Für heute alles wiederholt', 'All reviews done for today')}</h3><p><b class="ok">✓ ${faNum(s.ok)}</b> · <b class="no">✗ ${faNum(s.no)}</b></p>${rtl(`<p class="tdm-muted">${L('مواردی که بلد نبودی فردا دوباره می‌آیند؛ بقیه با فاصله ۳، ۷، ۱۴ و ۳۰ روز.', 'Nicht gewusste Einträge kommen morgen wieder, die anderen nach 3, 7, 14 und 30 Tagen.', 'Missed entries return tomorrow, the rest after 3, 7, 14 and 30 days.')}</p>`)}<button type="button" class="tdm-btn primary big" onclick="TDM.deckReview(false)">${L('بازگشت به دفتر عبارات', 'Zurück zum Heft', 'Back to notebook')}</button></div></section>`;
    const x = q[0], d = x.data || {}, w = x.type === 'wort', art = w ? String(d.artikel || '').toLowerCase() : '';
    const de = w ? d.wort : d.de, fa = w ? d.bedeutung_fa : d.fa, faFront = mode === 'fa2de' && !!fa;
    const wordHtml = `${art ? `<i>${E(art)}</i> ` : ''}${E(de)}`;
    const meta = `${w && d.plural && d.plural !== '—' ? `<p dir="ltr" class="tdm-muted">Pl. ${E(d.plural)}${d.perfekt ? ' · Perfekt: ' + E(d.perfekt) : ''}</p>` : ''}${d.beispiel ? `<p dir="ltr" class="tdm-vc-ex">${E(d.beispiel)}</p>` : ''}${w && (d.koll || []).length ? `<p class="tdm-vc-koll" dir="ltr">${d.koll.slice(0, 3).map((c) => `<span>${E(c)}</span>`).join('')}</p>` : ''}`;
    const ai = S.deckRevAi && S.deckRevAi.key === x.key ? S.deckRevAi : null, aiDone = deckRevDone();
    const exVal = String(S.deckRevExText || '');
    const aiPanel = !exOn ? '' : !ai ? ''
      : ai.busy ? `<div class="tdm-vr-aicard is-busy"><span class="tdm-spin-sm"></span> ${L('در حال تصحیح جمله با هوش مصنوعی…', 'Der Satz wird von der KI geprüft …', 'The AI is checking your sentence …')}</div>`
        : ai.error ? `<div class="tdm-vr-aicard is-err">⚠ ${L('تصحیح جمله انجام نشد. تا تصحیح نشود نمی‌توانی جلو بروی؛ دوباره تلاش کن.', 'Die Prüfung ist fehlgeschlagen; ohne sie geht es nicht weiter – bitte erneut versuchen.', 'The check failed; you cannot continue without it – try again.')}<button type="button" class="tdm-btn ghost" onclick="TDM.deckRevCheck('${E(x.key)}')">↻ ${L('تلاش دوباره', 'Erneut versuchen', 'Try again')}</button></div>`
          : `<div class="tdm-vr-aicard ${ai.ok && !ai.reason_fa ? 'is-ok' : 'is-fix'}"><b>${ai.ok && !ai.reason_fa ? '✓ ' + L('جمله‌ات درست است', 'Dein Satz ist korrekt', 'Your sentence is correct') : '✏ ' + L('جملهٔ تصحیح‌شده', 'Korrigierter Satz', 'Corrected sentence')}</b><p dir="ltr" class="tdm-vr-aifix">${E(ai.corrected || exVal)}</p>${ai.reason_fa ? `<p class="tdm-vr-aireason" dir="rtl">${E(ai.reason_fa)}</p>` : ''}<p class="tdm-muted">${L('حالا می‌توانی پاسخ را ببینی و به کارت بعد بروی.', 'Jetzt kannst du die Antwort sehen und zur nächsten Karte gehen.', 'Now you can reveal the answer and move on.')}</p></div>`;
    const exBox = exOn ? `<div class="tdm-vr-ex"><label for="tdmVrEx" dir="auto">✍ ${L('بالاتر از دکمه، یک جمله با این کلمه بنویس', 'Schreibe zuerst einen Satz mit diesem Wort', 'Write a sentence with this word first')}</label><textarea id="tdmVrEx" dir="ltr" rows="2" placeholder="Ich …" oninput="TDM.deckRevExIn(this)">${E(exVal)}</textarea><p id="tdmVrExNeed" class="tdm-vr-exneed" ${exVal.trim().length >= 3 ? 'hidden' : ''}>${L('برای فعال‌شدن دکمهٔ تصحیح، حداقل یک جمله بنویس.', 'Schreibe zuerst einen Satz, dann wird die Prüfung freigeschaltet.', 'Write a sentence first to unlock the AI check.')}</p><button type="button" id="tdmVrAiBtn" class="tdm-btn primary wide" ${exVal.trim().length >= 3 ? '' : 'disabled '}onclick="TDM.deckRevCheck('${E(x.key)}')">🤖 ${L('تصحیح جمله با هوش مصنوعی', 'Satz mit KI prüfen', 'Check sentence with AI')}</button>${aiPanel}</div>` : '';
    const act = `<div class="tdm-vr-act"><button type="button" class="no" ${exOn && !aiDone ? 'disabled ' : ''}onclick="TDM.deckRate('${E(x.key)}',false)">✗ ${L('یادم نبود', 'Nicht gewusst', 'Didn’t know')}</button><button type="button" class="ok" ${exOn && !aiDone ? 'disabled ' : ''}onclick="TDM.deckRate('${E(x.key)}',true)">✓ ${L('بلد بودم', 'Gewusst', 'Knew it')}</button></div>`;
    const back = S.deckFlip
      ? `<div class="tdm-vr-back">${faFront ? `<h3 class="tdm-vr-word" dir="ltr">${wordHtml}</h3>` : `<p class="tdm-vr-mean" dir="rtl">${E(fa)}</p>`}${meta}${exBox}${act}</div>`
      : `${exBox}<button type="button" class="tdm-btn ${exOn ? '' : 'primary '}big wide" ${exOn && !aiDone ? 'disabled ' : ''}onclick="TDM.deckShow()">${L('اول به خاطر بیاور، بعد نشان بده', 'Erst erinnern, dann aufdecken', 'Recall first, then reveal')}</button>`;
    const hint = faFront ? L('معنی را ببین و کلمهٔ آلمانی را حدس بزن.', 'Lies die Bedeutung und rate das deutsche Wort.', 'Read the meaning and guess the German word.') : L('کلمه را ببین و معنی را به خاطر بیاور.', 'Lies das Wort und erinnere dich an die Bedeutung.', 'Read the word and recall the meaning.');
    return `<section class="tdm-vr">${head}<div class="tdm-vr-card ${ART_CLS[art] ? 'art-' + ART_CLS[art] : ''}"><span class="tdm-vc-tag">${w ? E(d.wortart || L('لغت', 'Wort', 'Word')) : 'Redemittel'}</span><p class="tdm-vr-hint">${hint}</p>${faFront ? `<h2 dir="rtl" class="tdm-vr-frontfa">${E(fa)}</h2>` : `<h2 dir="ltr">${wordHtml}</h2>`}${back}</div></section>`;
  }

  /*DECK-ORDER*/ // 2026-11-20 (owner): cards are listed newest first, by creation date + time
  const deckStamp = (x) => {
    const t = Date.parse(String(x?.addedAt || ''));
    if (!isNaN(t)) return t;
    const d = Date.parse(String(x?.added || '') + 'T00:00:00Z');
    return isNaN(d) ? 0 : d;
  };
  const deckNewest = () => {
    const m = M().srs || {}, keys = Object.keys(m);
    return keys.map((k, i) => ({ x: m[k], i }))
      .sort((a, b) => (deckStamp(b.x) - deckStamp(a.x)) || (b.i - a.i))
      .map((o) => o.x);
  };
  /*DECK-SORT*/ // 2026-11-20 (owner): learner picks how notebook cards are ordered
  const DECK_SORTS = [['new', 'جدیدترین', 'Neueste', 'Newest'], ['old', 'قدیمی‌ترین', 'Älteste', 'Oldest'], ['az-word', 'الفبایی · لغت‌ها اول', 'A–Z · Wörter zuerst', 'A–Z · words first'], ['az-red', 'الفبایی · عبارت‌ها اول', 'A–Z · Redemittel zuerst', 'A–Z · phrases first'], ['due', 'نزدیک‌ترین سررسید', 'Nächste Fälligkeit', 'Next due']];
  const deckSortMode = () => (DECK_SORTS.some((s) => s[0] === S.deckSort) ? S.deckSort : 'new');
  const deckSortWord = (x) => String(x.type === 'wort' ? x.data?.wort || '' : x.data?.de || '').toLowerCase();
  const deckSorted = () => {
    const m = M().srs || {}, list = Object.keys(m).map((k, i) => ({ x: m[k], i })), mode = deckSortMode();
    const byNew = (a, b) => (deckStamp(b.x) - deckStamp(a.x)) || (b.i - a.i);
    if (mode === 'old') list.sort((a, b) => (deckStamp(a.x) - deckStamp(b.x)) || (a.i - b.i));
    else if (mode === 'az-word' || mode === 'az-red') {
      const first = mode === 'az-word' ? 'wort' : 'redemittel';
      list.sort((a, b) => ((a.x.type === first ? 0 : 1) - (b.x.type === first ? 0 : 1)) || deckSortWord(a.x).localeCompare(deckSortWord(b.x), 'de') || byNew(a, b));
    } else if (mode === 'due') list.sort((a, b) => String(a.x.due || '').localeCompare(String(b.x.due || '')) || ((Number(a.x.stage) || 0) - (Number(b.x.stage) || 0)) || byNew(a, b));
    else list.sort(byNew);
    return list.map((o) => o.x);
  };
  const deckSortSel = () => `<label class="tdm-deck-sort"><span>${L('ترتیب', 'Sortierung', 'Sort')}</span><select onchange="TDM.deckSort(this.value)" aria-label="${L('ترتیب نمایش کارت‌ها', 'Sortierung der Karten', 'Card order')}">${DECK_SORTS.map(([id, fa, de, en]) => `<option value="${id}" ${deckSortMode() === id ? 'selected' : ''}>${E(L(fa, de, en))}</option>`).join('')}</select></label>`;
  TDM.deckSort = function (v) { S.deckSort = DECK_SORTS.some((s) => s[0] === v) ? v : 'new'; render(); };
  function hubDeck() {
    if (S.deckReview) return deckReviewHtml();
    const all = deckSorted(), t = today();
    const due = all.filter((x) => x.due <= t).length, words = all.filter((x) => x.type === 'wort').length, mine = all.filter((x) => x.data?.custom).length, solid = all.filter((x) => (Number(x.stage) || 0) >= 3).length;
    const fl = ['all', 'due', 'wort', 'redemittel', 'mine'].includes(S.deckFilter) ? S.deckFilter : 'all';
    const chips = [['all', L('همه', 'Alle', 'All'), all.length], ['due', L('سررسید امروز', 'Heute fällig', 'Due today'), due], ['wort', L('لغت‌ها', 'Wörter', 'Words'), words], ['redemittel', 'Redemittel', all.length - words], ['mine', L('افزوده‌های من', 'Eigene', 'Mine'), mine]];
    const stat = (n, l, cls = '') => `<div class="tdm-dstat ${cls}"><b>${faNum(n)}</b><span>${l}</span></div>`;
    return `<div class="tdm-deck" id="tdmDeck" dir="${isFa() ? 'rtl' : 'ltr'}">
      <section class="tdm-deck-hero">
        <div class="tdm-deck-hero-text" dir="${isFa() ? 'rtl' : 'ltr'}"><span class="tdm-kicker">${L('مرور فاصله‌دار · ۱، ۳، ۷، ۱۴ و ۳۰ روز', 'Spaced Repetition · 1, 3, 7, 14, 30 Tage', 'Spaced repetition · 1, 3, 7, 14, 30 days')}</span><h2>${L('دفتر عبارات · لغات و Redemittel', 'Wortschatz & Redemittel', 'Vocabulary & Redemittel')}</h2>${rtl(`<p>${L('لغات برنامه هر روز خودکار اضافه می‌شوند. لغت‌ها و عبارت‌های خودت را هم اضافه کن تا در همین چرخه مرور شوند.', 'Plan-Wörter kommen automatisch dazu. Eigene Wörter und Ausdrücke laufen im selben Wiederholungszyklus.', 'Plan words are added automatically. Add your own words and phrases to review them in the same cycle.')}</p>`)}</div>
        <div class="tdm-dstats">${stat(all.length, L('کل موارد', 'Einträge', 'Entries'))}${stat(due, L('سررسید امروز', 'heute fällig', 'due today'), due ? 'is-due' : '')}${stat(solid, L('تثبیت‌شده', 'gefestigt', 'well known'), 'is-ok')}${stat(mine, L('افزوده من', 'eigene', 'mine'))}</div>
        <div class="tdm-deck-actions"><button type="button" class="tdm-btn primary big" onclick="TDM.deckAddOpen(true)">＋ ${L('افزودن لغت یا عبارت', 'Wort hinzufügen', 'Add word or phrase')}</button><button type="button" class="tdm-btn big ${due ? 'is-hot' : ''}" ${due ? '' : 'disabled'} onclick="TDM.deckReview(true)">▶ ${L('مرور سررسیدها', 'Fällige wiederholen', 'Review due')}${due ? ` <b>${faNum(due)}</b>` : ''}</button><button type="button" class="tdm-btn ghost" ${all.length ? '' : 'disabled'} onclick="TDM.exportAnki()">⬇ ${L('خروجی Anki', 'Anki-Export', 'Anki export')}</button></div>
      </section>
      ${deckForm()}
      ${all.length ? `<div class="tdm-deck-tools"><label class="tdm-deck-search"><span aria-hidden="true">🔍</span><input id="tdmDeckQ" type="search" dir="auto" placeholder="${L('جستجو در لغت، معنی یا مثال…', 'Suchen: Wort, Bedeutung, Beispiel …', 'Search word, meaning or example…')}" oninput="TDM.deckFilter()"></label>${deckSortSel()}<div class="tdm-vchips" role="tablist">${chips.map(([id, l, n]) => `<button type="button" data-f="${id}" class="${fl === id ? 'is-cur' : ''}" onclick="TDM.deckFilter('${id}')">${E(l)} <em>${faNum(n)}</em></button>`).join('')}</div></div>
      <div class="tdm-vgrid">${all.map((x) => deckCard(x, fl)).join('')}</div>
      <p id="tdmDeckNone" class="tdm-deck-none" ${all.some((x) => deckMatch(x, fl)) ? 'hidden' : ''}>${L('موردی با این فیلتر پیدا نشد.', 'Keine Einträge für diesen Filter.', 'No entries match this filter.')}</p>` : `<div class="tdm-deck-empty"><div>📒</div><h3>${L('دفتر عبارات هنوز خالی است', 'Das Heft ist noch leer', 'The notebook is still empty')}</h3>${rtl(`<p class="tdm-muted">${L('لغات و Redemittel جدید هر روز در ماژول «Grammatik & Wortschatz» برنامه یادگیری اضافه می‌شوند. همین حالا هم می‌توانی اولین لغت خودت را اضافه کنی.', 'Neue Wörter kommen täglich im Modul „Grammatik & Wortschatz“ dazu. Du kannst auch gleich ein eigenes Wort hinzufügen.', 'New words are added daily in the “Grammatik & Wortschatz” module. You can also add your first own word now.')}</p>`)}</div>`}
      ${rtl(`<p class="tdm-muted tdm-deck-foot">⭐ ${L('با ستاره‌دادن، مورد در «علاقه‌مندی‌ها» هم ذخیره می‌شود. مواردی که «یادم نبود» بزنی در سربرگ «اشتباهات» ثبت می‌شوند. فایل Anki را با File → Import وارد کن (جداکننده Semicolon، اجازه HTML روشن).', 'Mit ⭐ landet der Eintrag auch in den Favoriten. „Nicht gewusst“ wird unter „Fehler“ gespeichert. Anki: File → Import (Trennzeichen Semikolon, HTML erlauben).', 'Starring also saves the entry to Favourites. “Didn’t know” entries are added to the Mistakes tab. Anki: File → Import (semicolon separator, allow HTML).')}</p>`)}
    </div>`;
  }
  /*NB-WRITINGS*/ function wrSync(d) {
    const r = d?.results?.schreiben; if (!r || !r.text) return false;
    const w = d.work?.schreiben, a = w?.ai?.writing;
    let fb = null;
    if (a && !a.error && Array.isArray(a.errors)) fb = { src: 'ai', errors: a.errors.map((e) => ({ wrong: e.wrong || '', right: e.right || '', why: e.reason_fa || '' })), improved: (a.improved || []).map((x) => ({ original: x.original || '', better: x.better || '' })), summary: a.summary_fa || '', tdn: a.tdn || '', tip: a.tip_fa || '' };
    else if (w?.f) { const errs = [0, 1, 2].map((n) => ({ wrong: w.f['fp_wrong_' + n] || '', right: w.f['fp_right_' + n] || '', why: w.f['fp_why_' + n] || '' })).filter((e) => e.wrong || e.right); if (errs.length) fb = { src: 'self', errors: errs, improved: [], summary: '', tdn: '', tip: '' }; }
    if (!fb) return false;
    const old = JSON.stringify(r.fb || null), now = JSON.stringify(fb); if (old === now) return false;
    r.fb = fb; return true;
  }
  function wrDays() { return Object.values(M().days || {}).filter((d) => d.results?.schreiben?.text).sort((a, b) => b.date.localeCompare(a.date)); }
  function wrMark(text, errors) {
    let html = E(text);
    (errors || []).forEach((e) => { const wr = E(e.wrong || '').trim(); if (!wr || wr.length < 2) return; const i = html.indexOf(wr); if (i < 0) return; html = html.slice(0, i) + `<del>${wr}</del><ins>${E(e.right || '')}</ins>` + html.slice(i + wr.length); });
    return html.split(/\n+/).map((p) => `<p>${p}</p>`).join('');
  }
  TDM.nbTab = function (t) { S.nbLeanTab = t === 'texts' ? 'texts' : 'deck'; render(); window.scrollTo({ top: 0 }); };
  TDM.wrToggle = function (date) { S.wrOpen = S.wrOpen || {}; S.wrOpen[date] = !S.wrOpen[date]; render(); };
  function hubWritings() {
    let changed = false; wrDays().forEach((d) => { if (wrSync(d)) changed = true; }); if (changed) saveData();
    const list = wrDays(), open = S.wrOpen || {};
    const rows = list.map((d) => {
      const r = d.results.schreiben, it = item(r.kind, r.itemId), fb = r.fb, on = !!open[d.date];
      const fix = !fb ? rtl('<p class="tdm-muted">برای این نوشته اصلاحی ثبت نشده است (تحلیل هوش مصنوعی یا Fehlerprotokoll انجام نشده بود).</p>')
        : `<div class="tdm-modeltext tdm-wr-marked" dir="ltr">${wrMark(r.text, fb.errors)}</div>`
          + (fb.errors.length ? `<ol class="tdm-wr-errs">${fb.errors.map((e) => `<li><span dir="ltr"><del>${E(e.wrong)}</del> → <ins>${E(e.right)}</ins></span>${e.why ? `<small dir="rtl">${E(e.why)}</small>` : ''}</li>`).join('')}</ol>` : '')
          + (fb.improved.length ? `<div class="tdm-wr-better">${rtl(`<b>${L('جمله‌های بهتر', 'Bessere Sätze')}</b>`)}${fb.improved.map((x) => `<p dir="ltr"><span class="tdm-muted">${E(x.original)}</span><br>✓ ${E(x.better)}</p>`).join('')}</div>` : '')
          + (fb.summary || fb.tip ? rtl(`<p class="tdm-muted">${E(fb.summary)}${fb.tdn ? ` · TDN ${E(fb.tdn)}` : ''}${fb.tip ? `<br>💡 ${E(fb.tip)}` : ''}</p>`) : '')
          + (fb.src === 'self' ? rtl(`<p class="tdm-muted">${L('اصلاحات از Fehlerprotokoll خودت', 'Aus deinem Fehlerprotokoll')}</p>`) : '');
      return `<details class="tdm-details tdm-wr"><summary><b>${E(d.date)}</b> · ${E(r.kind === 'grafik' ? 'Grafik' : 'Argumentation')} · ${faNum(r.words || wordsIn(r.text))} ${L('کلمه', 'Wörter')}${r.score != null ? ' · ' + fmtPct(r.score) : ''}${fb ? ` · ✎ ${faNum(fb.errors.length)}` : ''}</summary>
        <p dir="ltr"><b>${E(it?.title || '')}</b></p>
        ${on ? fix : `<div class="tdm-modeltext" dir="ltr"><p>${E(r.text).replace(/\n+/g, '</p><p>')}</p></div>`}
        <button type="button" class="tdm-btn ${on ? '' : 'primary'}" ${fb ? '' : 'disabled'} onclick="TDM.wrToggle('${E(d.date)}')">${on ? L('نمایش متن اصلی', 'Originaltext') : L('نمایش اصلاحات', 'Korrekturen zeigen')}</button></details>`;
    }).join('');
    return card(`${rtl(`<h3>${L('نوشته‌های من', 'Meine Texte')}</h3><p class="tdm-muted">${L('متن Schreiben هر روز همان‌طور که ثبت کردی اینجا می‌ماند. با «نمایش اصلاحات» اشتباه‌ها در متن خط می‌خورند و شکل درست کنارشان می‌آید.', 'Deine Schreiben-Texte, wie du sie abgegeben hast; „Korrekturen zeigen“ markiert Fehler direkt im Text.')}</p>`)}${rows || rtl('<p class="tdm-muted">هنوز نوشته‌ای ثبت نشده است.</p>')}`);
  }
  function hubProben() {
    const m = M(), list = Object.values(m.days).filter((d) => d.results?.schreiben?.text).sort((a, b) => b.date.localeCompare(a.date));
    return card(`${rtl('<h3>نمونه نوشته‌ها برای مقایسه پیشرفت</h3><p class="tdm-muted">نوشته‌های Schreiben هر روز اینجا نگه داشته می‌شوند. صداهای ضبط‌شده Sprechen هم در همان روز داخل فعالیت قابل پخش هستند.</p>')}${list.map((d) => { const r = d.results.schreiben, it = item(r.kind, r.itemId); return `<details class="tdm-details"><summary><b>${E(d.date)}</b> · ${E(r.kind === 'grafik' ? 'Grafik' : 'Argumentation')} · ${faNum(r.words)} ${L('کلمه', 'Wörter')} · ${fmtPct(r.score)}</summary><p dir="ltr"><b>${E(it?.title || '')}</b></p><div class="tdm-modeltext" dir="ltr"><p>${E(r.text).replace(/\n+/g, '</p><p>')}</p></div></details>`; }).join('') || rtl('<p class="tdm-muted">هنوز نوشته‌ای ذخیره نشده است.</p>')}`);
  }

  /*BATCH2*/ function hubMuster() {
    const blk = (title, fa, lines) => card(`<h3 dir="auto">${title}</h3>${rtl(`<p class="tdm-muted">${fa}</p>`)}<div class="tdm-muster" dir="ltr">${lines.map(([k, v]) => `<p><b>${k}</b> ${E(v)}</p>`).join('')}</div>`);
    return rtl(`<p class="tdm-muted">${L('الگوهای آماده برای جواب دادن؛ جای خالی‌ها را با موضوع تمرین خودت پر کن.', 'Fertige Antwortmuster; fülle die Lücken mit deinem Thema.', 'Ready answer patterns; fill the gaps with your topic.')}</p>`)
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
      + card(`<h3 dir="auto">${L('انواع تمرین Sprechen در آزمون', 'Sprechaufgaben')}</h3><div class="tdm-types">${Object.values(ST.speakingTypes).map((t) => `<article><b dir="ltr">${E(t.label)}</b>${rtl(`<p><b>${E(t.fa)}:</b> ${E(t.how)}</p>`)}<p dir="ltr" class="tdm-muted">${E(t.phrases.join(' · '))}</p></article>`).join('')}</div>`);
  }
  function hubMethod() {
    const ms = ST.methods;
    return card(`<h3 dir="auto">${L('هدف و چارچوب کلی', 'Ziel und Rahmen')}</h3>${rtl('<ul class="tdm-ol"><li>هدف اصلی: کسب حداقل TDN 4 در هر چهار مهارت</li><li>مدت مطالعه روزانه: ۴ ساعت مفید · ۶ روز تمرین در هفته</li><li>روز هفتم (جمعه): ارزیابی و تحلیل عملکرد</li></ul>')}`)
      + Object.entries(ms).filter(([k]) => !['wortschatz', 'wiederholung'].includes(k)).map(([, x]) => card(`<h3 dir="ltr">${E(x.title.split('·')[0])}</h3>${rtl(`<p><b>${E(x.title)}</b></p><p>${E(x.goal)}</p><ol class="tdm-ol">${x.steps.map((s) => `<li>${E(s)}</li>`).join('')}</ol>${x.rule ? `<p class="tdm-muted">💡 ${E(x.rule)}</p>` : ''}`)}`)).join('')
      + card(`<h3 dir="auto">${L('قوانین اصلی سیستم مطالعاتی', 'Grundregeln')}</h3>${rtl(`<ol class="tdm-ol">${ST.rules.map((r) => `<li>${E(r)}</li>`).join('')}</ol><p><b>${E(ST.success)}</b></p>`)}`)
      + card(`<h3 dir="auto">${L('منابع مطالعاتی', 'Quellen')}</h3><table class="tdm-table"><tbody>${ST.resources.map(([a, b]) => `<tr><td>${E(a)}</td><td dir="rtl">${E(b)}</td></tr>`).join('')}</tbody></table><p><a href="${ST.officialUrl}" target="_blank" rel="noopener">${L('منبع رسمی: آمادگی آزمون', 'Offizielle Prüfungsvorbereitung', 'Official exam preparation')} ↗</a></p>`);
  }

  // ═════════════ main-app hooks ═════════════
  // What the study tutor may see of the current step. Hidden material (transcript before step 3, solutions) is withheld,
  // and exam steps are flagged so the tutor gives strategy instead of answers.
  TDM.contextInfo = function () {
    const a = act(); if (!a || S.screen !== 'methodActivity' || !CT()) return null;
    const d = curDay(), w = work(a.id), steps = stepsFor(a.id, d.mode, d), st = steps[clamp(w.step || 0, 0, steps.length - 1)], key = st.key.split(':')[0];
    const out = { module: a.title, step: st.de, title: '', material: '', user_text: '', exam: false };
    const cut = (s, n) => String(s || '').slice(0, n);
    const qText = (qs) => qs.map((q, n) => `${n + 1}. ${q.q}${Array.isArray(q.options) ? ' ' + q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' ') : q.type === 'jnt' ? ' (ja / nein / Text sagt dazu nichts)' : q.type === 'rf' ? ' (richtig / falsch)' : ''}`).join('\n');
    if (a.id === 'hoeren') {
      const it = currentHoerenItem(); if (!it) return out;
      out.title = `${it.formatLabel}: ${it.title}`;
      const transcriptOk = ['analyse', 'zusammenfassung'].includes(key) || !!w.checked.h;
      if (transcriptOk) out.material = cut(it.segments.map((s) => `${it.speakers[s.s]?.name || ''}: ${s.text}`).join('\n'), 3000);
      else out.material = L('(متن فایل صوتی در این مرحله عمداً نمایش داده نمی‌شود.)', '(Das Transkript ist in diesem Schritt absichtlich verborgen.)');
      if (['selektiv', 'pruefung'].includes(key)) out.material += '\nAufgaben:\n' + cut(qText(it.questions || []), 900);
      out.exam = key === 'pruefung' && !w.checked.h;
      if (key === 'selektiv' && !w.checked.h) out.step += ' (Aufgaben noch nicht ausgewertet)';
    } else if (a.id === 'lesen') {
      const it = item('lesen', d.picks?.lesen); if (!it) return out;
      out.title = it.title;
      out.material = key === 'ueberblick' ? 'Zwischenüberschriften: ' + it.paragraphs.map((p) => p.heading).join(' | ') : cut(it.paragraphs.map((p, n) => `[${n + 1}] ${p.heading ? p.heading + ': ' : ''}${p.text}`).join('\n'), 3000);
      if (['aufgaben', 'pruefung'].includes(key)) out.material += '\nAufgaben:\n' + cut(qText(it.questions || []), 900);
      out.exam = key === 'pruefung' && !w.checked.l;
      if (key === 'aufgaben' && !w.checked.l) out.step += ' (Aufgaben noch nicht ausgewertet)';
    } else if (a.id === 'schreiben') {
      const pk = d.picks?.schreiben, it = pk && item(pk.kind, pk.id); if (!it) return out;
      out.title = it.title;
      out.material = cut(pk.kind === 'grafik' ? `${it.task}\nGrafik: ${it.chart?.title} (${it.chart?.unit}) ${(it.chart?.labels || []).join(', ')}\nText: ${it.text}` : `${it.situation}\n${(it.positions || []).map((p) => `${p.person}: ${p.text}`).join('\n')}\n${it.task}`, 2500);
      out.user_text = cut(w.f.text, 2800);
      out.exam = d.mode !== 'normal' && key === 'schreiben';
    } else if (a.id === 'sprechen') {
      const t = Number(st.key.split(':')[1]) || 0, list = d.mode === 'normal' ? [speakTask(d, t)] : spList(d).map((id) => item('sprechen', id));
      out.title = list.filter(Boolean).map((x) => x.typeLabel).join(' · ');
      out.material = cut(list.filter(Boolean).map((x) => `${x.typeLabel}: ${x.situation}\n${x.task}${x.material ? '\n' + x.material : ''}`).join('\n\n'), 2500);
      out.user_text = cut(w.f['kw_' + t] || '', 600);
      out.exam = d.mode !== 'normal' && key === 'exam';
    } else if (a.id === 'wortschatz') {
      const gr = grammarOfWeek(d.week);
      out.title = 'Grammatik der Woche: ' + gr.title;
      out.material = cut('Neue Wörter: ' + dayWords(d).map((v) => `${v.artikel ? v.artikel + ' ' : ''}${v.wort} (${v.bedeutung_fa})`).join(', ') + '\nRedemittel: ' + (d.redemittel || []).map((r) => r.de).join(' | '), 1500);
      out.user_text = cut([0, 1, 2, 3, 4].map((n) => w.f['satz_' + n]).filter(Boolean).join('\n'), 1500);
    } else if (a.id === 'extra') {
      out.title = 'Extra-Lernzeit · Satzbildung'; /*EXTRA-SATZ*/
      out.user_text = cut(Object.keys(w.f).filter((k) => /^sx_/.test(k) && String(w.f[k] || '').trim()).map((k) => w.f[k]).join('\n'), 1500);
      out.user_text = cut(w.f.x_summary || '', 800);
    }
    return out;
  };

  // A TestDaF plan created before the method existed (old 8-activity format) is upgraded in place for today.
  TDM.migratePlan = function () {
    if (!TDM.active() || !S.plan || S.activeActivity || !Array.isArray(S.plan.activities) || S.plan.activities.every((a) => a.type === 'method')) return false;
    const hadProgress = (S.completedActivities || []).length > 0;
    if (hadProgress) archiveCurrentPlan('method-upgrade');
    const built = TDM.buildActivities();
    Object.assign(S.plan, { id: hadProgress ? 'plan-' + Date.now() : S.plan.id, examType: TDM.program(), activities: built.activities, totalMinutes: built.totalMinutes, availableMinutes: built.availableMinutes, schemaVersion: '1.0.0', method: 'tdm-1' });
    S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activityPoints = {};
    upsertDailyHistorySegment(currentPlanHistorySnapshot());
    saveData();
    return true;
  };
  // Plans built while the hour slider still scaled the method are put back to the fixed 240-minute split.
  /*LEAN4*/ function leanErrToDeck(e) {
    if (!e) return false;
    const de = String(e.correctAnswer || '').trim(); if (!de || de.length > 220) return false;
    const fa = String(e.explanation || '').trim(), wrong = String(e.userAnswer || '').trim();
    const ex = wrong ? '✗ ' + wrong : String(e.context || e.question || '').trim().slice(0, 200);
    const r = /\s/.test(de) ? TDM.deckAddEntry('redemittel', { de, fa, beispiel: ex }) : TDM.deckAddEntry('wort', { wort: de, bedeutung_fa: fa, beispiel: ex });
    return !!(r && r.ok);
  }
  function leanMergeErrors() {
    const m = M(); if (m.errorsMerged || !Array.isArray(S.errors)) return;
    let n = 0; S.errors.forEach((e) => { if (leanErrToDeck(e)) n++; });
    m.errorsMerged = new Date().toISOString(); m.errorsMergedCount = n; saveData();
  }
  function leanSeedDay() {
    if (!LEAN() || !TDM.active() || !CT()) return;
    const d = M().days[dayKey()]; if (!d || !d.picks || d.deckSeeded) return;
    const words = dayWords(d) || [], k = d.date;
    words.forEach((v) => srsAdd('wort', (v.artikel ? v.artikel + ' ' : '') + v.wort, wordData(v), k));
    try { registerSiteWords(words.map((v) => siteVocabItem({ type: 'wort', key: 'wort:' + v.wort, data: wordData(v) }))); } catch (e) { /* ignore */ }
    if (!d.redemittel) d.redemittel = pickRedemittel(d);
    (d.redemittel || []).forEach((r) => srsAdd('redemittel', r.de, { de: r.de, fa: r.fa, beispiel: r.beispiel || '' }, k));
    d.deckSeeded = true; saveData();
  }
  function leanWrapErrors() {
    const f = window.rememberLearningError; if (typeof f !== 'function' || f.__lean) return;
    const g = function (err) { const r = f.apply(this, arguments); try { if (r && LEAN()) leanErrToDeck(err); } catch (e) { /* ignore */ } return r; };
    g.__lean = true; window.rememberLearningError = g;
  }
  // replace today's exercises with a pack (one plan day) from the admin progress list; resets today's progress
  TDM.playPack = async function (pk) {
    if (!LEAN() || !pk) return false;
    const say = (t) => { if (typeof appAlert === 'function') appAlert(t); else alert(t); };
    if (!TDM.enrolled || !TDM.active()) { say('اول در «اجرای برنامه» تب «برنامه یادگیری» را فعال کن.'); return false; }
    if (!CT()) { try { await TDM.ensureContent(); } catch (e) { say('محتوای برنامه بارگذاری نشد.'); return false; } }
    const ids = [['hoeren', pk.hoeren], ['lesen', pk.lesen], [pk.schreiben?.kind, pk.schreiben?.id], ...(pk.sprechen || []).map((x) => ['sprechen', x])].filter((x) => x[0] && x[1]);
    if (ids.some(([kd, id]) => !item(kd, id))) { say('همه تمرین‌های این روز هنوز منتشر نشده‌اند.'); return false; }
    const msg = `تمرین‌های امروز با پک «روز ${faNum(pk.day)}${pk.theme ? ' · ' + pk.theme : ''}» جایگزین شود؟ پیشرفت امروز صفر می‌شود.`;
    const ok = typeof appConfirm === 'function' ? await appConfirm(msg) : confirm(msg); if (!ok) return false;
    const m = M(), k = (S.plan && S.plan.date) || today(), d = ensureDay(k), old = d.picks || {};
    d.picks = { hoeren: pk.hoeren || old.hoeren, lesen: pk.lesen || old.lesen, schreiben: pk.schreiben?.id ? { kind: pk.schreiben.kind, id: pk.schreiben.id } : old.schreiben, sprechen: (pk.sprechen || []).length ? pk.sprechen.slice() : (old.sprechen || []) };
    d.picks.spBase = d.picks.sprechen.length || 1;
    ids.forEach(([kd, id]) => { const u = m.used[kd] || (m.used[kd] = []); if (!u.includes(id)) u.push(id); });
    d.work = {}; d.results = {}; d.redemittel = pickRedemittel(d); d.theme = pk.theme || ''; d.packDay = pk.day; d.deckSeeded = false; d.packAt = new Date().toISOString(); m.packCur = pk.day;
    if (m.packIgnore && m.packIgnore[pk.day]) m.packIgnore[pk.day] = m.packIgnore[pk.day].filter((x) => x !== k); /*PACK-DONE*/
    S.completedActivities = []; S.activityProgress = {}; S.activityTimers = {}; S.activeActivity = null;
    try { syncPlan(true); } catch (e) { console.warn(e); }
    try { refreshPlanDescriptions(); } catch (e) { /* ignore */ }
    saveData();
    if (typeof navigateApp === 'function') navigateApp('dashboard'); else render();
    return true;
  };
  function syncPlan(force) {
    if (!TDM.active() || !S.plan || !Array.isArray(S.plan.activities) || !S.plan.activities.length || !S.plan.activities.every((a) => a.type === 'method')) return false;
    if (S.activeActivity && !force) return false;
    const k = S.plan.date || today(), want = minutesFor(k), ids = Object.keys(want), done = new Set(S.completedActivities || []), timers = S.activityTimers || {};
    const built = TDM.buildActivities(null, k).activities, order = built.map((a) => a.id);
    let changed = false;
    const keep = S.plan.activities.filter((a) => !(LEAN() && LEAN_DROP.includes(a.id)) /*LEAN4*/ && (a.id === 'extra' || ids.includes(a.id) || done.has(a.id) || (Number(timers[a.id]) || 0) > 0 || S.activeActivity?.id === a.id));
    if (keep.length !== S.plan.activities.length) changed = true;
    for (const id of ids) if (!keep.some((a) => a.id === id)) { const b = built.find((x) => x.id === id); if (b) { keep.push(b); changed = true; } }
    keep.forEach((a) => { const v = want[a.id]; if (v && Number(a.dur) !== v) { a.dur = v; changed = true; } });
    const pos = (id) => (id === 'extra' ? 999 : order.includes(id) ? order.indexOf(id) : 500);
    const sorted = keep.slice().sort((a, b) => pos(a.id) - pos(b.id));
    if (sorted.some((a, n) => a !== S.plan.activities[n])) changed = true;
    if (!changed) return false;
    const extra = Number(sorted.find((a) => a.id === 'extra')?.dur) || 0;
    S.plan.activities = sorted;
    S.plan.totalMinutes = sorted.reduce((s, a) => s + (Number(a.dur) || 0), 0);
    S.plan.availableMinutes = dailyMin() + extra;
    saveData();
    return true;
  }
  const fixDurations = () => syncPlan(false);
  TDM.afterRender = function () {
    try { TDM.trackPlanId(); } catch (e) { /* ignore */ }
    try { document.documentElement.classList.toggle('amk-lean', LEAN()); if (LEAN()) { leanWrapErrors(); leanSeedDay(); const dd = M().days[dayKey()]; if (dd && wrSync(dd)) saveData(); } } catch (e) { console.warn(e); } /*LEAN4*/ /*NB-WRITINGS*/
    if (!TDM.enrolled() && S.studyMode === 'free') { S.studyMode = 'plan'; S.planStash = {}; }
    if (S.screen === 'dashboard' && (TDM.migratePlan() || fixDurations())) { setTimeout(() => render(), 0); return; }
    if (S.screen !== 'methodActivity') { if (P.playing) stopAudio(); if (R.rec?.state === 'recording') stopRecorder(false); }
    else { updatePlayerUI(); ensureTick(); if (S.tdmReview) lockReview(); else try { if (keepNewestTakes()) setTimeout(() => render(), 0); } catch (e) { /* ignore */ } }
    if (S.screen !== 'methodActivity' && S.tdmReview) S.tdmReview = false;
  };
  TDM.historyLabels = { wiederholung: 'Wiederholung', fehleranalyse: 'Fehleranalyse', wochenbericht: 'Wochenbericht' };
  ['renderHub', 'renderActivity', 'renderDashboardCard', 'renderModeTabs', 'renderHistoryPanel', 'renderHistoryPage', 'historyDayDetail', 'listTitle', 'renderPlanTimeCard', 'renderDailyProgress', 'renderNotebook'].forEach((fn) => {
    const f = TDM[fn]; if (typeof f !== 'function' || f.__osd) return;
    const g = function (...a) { const r = f.apply(this, a); return PROG() && typeof r === 'string' ? PROG().rewrite(r, fn) : r; };
    g.__osd = true; TDM[fn] = g;
  });
})();
