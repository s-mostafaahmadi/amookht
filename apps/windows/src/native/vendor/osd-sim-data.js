/* Amookht · ÖSD Zertifikat B2 – two original mock exams in the official format (Modellsatz ZB2, ÖSD 2026):
   Lesen 90 min (4 Aufgaben, 20 P.), Hören ca. 30 min (2 Aufgaben, 20 P.), Schreiben 90 min (2 Texte, 30 P.),
   Sprechen (3 Aufgaben, 15 min Vorbereitung). All texts are written for Amookht; names, firms and figures are invented. */
window.AMK_OSD_EXAMS = [
{
  id: 'osd-b2-1',
  title: 'ÖSD Zertifikat B2 · Modellprüfung 1',
  theme: { fa: 'تعمیر به‌جای دورریختن، کار از خانه، کار داوطلبانه', de: 'Reparieren, Homeoffice, Ehrenamt', en: 'Repairing, home office, volunteering' },
  lesen: {
    a1: {
      title: 'Reparieren statt wegwerfen – Das Repair-Café erobert die Städte',
      source: '[aus einer österreichischen Wochenzeitung]',
      text: `Ein Toaster, der nicht mehr heiß wird, ein Fahrrad mit klemmender Gangschaltung, eine Jeans mit einem Loch am Knie: Früher landeten solche Dinge oft im Müll. Heute bringen immer mehr Menschen sie an einem Samstagnachmittag in ein Repair-Café. Allein in Wien gibt es inzwischen über dreißig solcher Treffpunkte. Sie finden meist in Pfarrsälen, Volkshochschulen oder Nachbarschaftszentren statt.

Die Idee stammt ursprünglich aus den Niederlanden, die Grundregel ist einfach: Ehrenamtliche Helferinnen und Helfer – pensionierte Elektriker, Schneiderinnen, Studierende der Technik – reparieren gemeinsam mit den Besucherinnen und Besuchern deren kaputte Gegenstände. Bezahlt wird nichts, eine freiwillige Spende für Kaffee und Ersatzteile ist jedoch willkommen. „Wir sind kein Gratis-Reparaturservice“, betont Gerhard Leitner, der seit sechs Jahren ein Repair-Café in Graz organisiert. „Wer kommt, muss selbst mit anpacken. Am Ende sollen die Leute verstehen, wie ihr Gerät funktioniert.“

Erfolgreich ist das Konzept vor allem deshalb, weil es mehrere Bedürfnisse gleichzeitig erfüllt. Viele Gäste wollen Geld sparen oder Müll vermeiden. Mindestens ebenso wichtig ist für viele aber der soziale Aspekt: Man wartet gemeinsam, trinkt Kaffee und kommt ins Gespräch. „Manche kommen jede Woche, auch wenn gar nichts kaputt ist“, erzählt Leitner lachend.

Nicht alles lässt sich allerdings retten. Etwa ein Drittel der Geräte kann nicht repariert werden – meist, weil Ersatzteile fehlen oder weil die Geräte so gebaut sind, dass man sie nicht öffnen kann, ohne sie zu zerstören. Genau hier setzt die Kritik vieler Initiativen an. Sie fordern von den Herstellern, Produkte langlebiger zu bauen und Ersatzteile über viele Jahre anzubieten.

Auch die Politik hat das Thema entdeckt. In Österreich gibt es seit einigen Jahren den sogenannten Reparaturbonus: Wer ein Elektrogerät in einem Fachbetrieb reparieren lässt, bekommt einen Teil der Kosten vom Staat zurück. Die Repair-Cafés sehen darin keine Konkurrenz. „Im Gegenteil“, sagt Leitner, „wenn wir bei einer Waschmaschine nicht weiterkommen, schicken wir die Leute zum Fachbetrieb. Hauptsache, das Gerät wird wieder benutzt.“`,
      example: { q: 'In Repair-Cafés', options: ['werden kaputte Geräte gegen neue getauscht.', 'kann man Gegenstände gemeinsam reparieren.', 'arbeiten nur ausgebildete Elektriker.'], answer: 1 },
      items: [
        { q: 'Die Repair-Cafés in Wien', options: ['befinden sich meist in eigenen Werkstätten.', 'finden oft in Räumen von Pfarren oder Volkshochschulen statt.', 'gibt es seit über dreißig Jahren.'], answer: 1 },
        { q: 'Für eine Reparatur', options: ['müssen die Besucher einen festen Betrag zahlen.', 'bezahlt die Stadt die Ersatzteile.', 'kann man freiwillig etwas spenden.'], answer: 2 },
        { q: 'Gerhard Leitner erwartet, dass die Besucher', options: ['bei der Reparatur selbst mitarbeiten.', 'ihre Geräte am Vormittag bringen.', 'vorher einen Kurs in Elektrotechnik besuchen.'], answer: 0 },
        { q: 'Für viele Besucher ist das Repair-Café auch', options: ['ein Ort, an dem man günstig Ersatzteile kauft.', 'eine Möglichkeit, etwas Geld zu verdienen.', 'ein Ort, an dem man mit anderen ins Gespräch kommt.'], answer: 2 },
        { q: 'Zum Reparaturbonus meint Leitner, dass', options: ['er den Repair-Cafés Besucher wegnimmt.', 'Fachbetriebe und Repair-Cafés einander ergänzen.', 'er nur für Waschmaschinen gilt.'], answer: 1 }
      ]
    },
    a2: {
      headings: [
        ['A', 'Neue App zeigt freie Parkplätze in Echtzeit'],
        ['B', 'Immer mehr Seniorinnen und Senioren im Hörsaal'],
        ['C', 'Zürcher Bibliothek öffnet künftig auch sonntags'],
        ['D', 'Mehr Grün gegen die Sommerhitze in der Stadt'],
        ['E', 'Bibliotheken klagen über sinkende Besucherzahlen'],
        ['F', 'Universitäten verlangen höhere Gebühren von älteren Studierenden'],
        ['G', 'Autofreie Innenstadt: Test in Graz verläuft positiv'],
        ['H', 'Hitzewelle: Ärzte warnen vor zu wenig Flüssigkeit'],
        ['I', 'Proteste gegen Fahrverbot in der Grazer Altstadt'],
        ['K', 'Junge Freiwillige erklären Älteren das Smartphone']
      ],
      texts: [
        { source: '[aus einer deutschen Tageszeitung]', answer: 'B', text: 'Wer an Studierende denkt, hat meist junge Menschen vor Augen. Doch in vielen Vorlesungen sitzen heute auch Männer und Frauen, die längst in Pension sind. An der Universität Münster hat sich die Zahl der Gasthörer über 60 in den letzten zehn Jahren fast verdoppelt. Besonders gefragt sind Geschichte, Philosophie und Kunstgeschichte. Einen Abschluss streben die wenigsten an: Sie wollen einfach Neues lernen und mit Jüngeren diskutieren. Die Gebühr für ein Semester als Gasthörer liegt bei rund 100 Euro.' },
        { source: '[aus einer österreichischen Tageszeitung]', answer: 'D', text: 'Wien setzt im Kampf gegen die steigenden Temperaturen auf die Natur. Bis 2030 sollen in den dicht bebauten Bezirken 25.000 neue Bäume gepflanzt werden. Dazu kommen begrünte Fassaden, kleine Parks auf ehemaligen Parkplätzen und Wasserspiele auf öffentlichen Plätzen. Messungen zeigen, dass es unter großen Bäumen an heißen Tagen um bis zu acht Grad kühler sein kann als auf einer asphaltierten Fläche. Die Bewohnerinnen und Bewohner sind eingeladen, Vorschläge für neue Standorte zu machen.' },
        { source: '[aus einer Schweizer Zeitung]', answer: 'C', text: 'Ab Januar können Leseratten in Zürich auch am Wochenende vollständig auf ihre Kosten kommen: Die Pestalozzi-Bibliothek im Stadtzentrum ist dann zusätzlich jeden Sonntag von 11 bis 17 Uhr geöffnet. Die Leitung reagiert damit auf eine Umfrage, in der sich zwei Drittel der Befragten längere Öffnungszeiten gewünscht hatten. Am Sonntag sind keine Bibliothekarinnen vor Ort; die Ausleihe und Rückgabe funktioniert über Automaten. Für Fragen steht ein Sicherheitsdienst zur Verfügung.' },
        { source: '[aus einer österreichischen Zeitschrift]', answer: 'G', text: 'Drei Monate lang durften in der Grazer Innenstadt an Samstagen keine privaten Autos fahren. Nun liegt die Bilanz vor, und sie fällt besser aus als erwartet. Die Händler, die anfangs große Bedenken hatten, melden stabile oder sogar leicht gestiegene Umsätze. Die Luftwerte haben sich deutlich verbessert, und viele Familien nutzten die Straßen zum Flanieren. Der Gemeinderat will nun entscheiden, ob das Projekt im kommenden Jahr auf alle Wochenenden ausgeweitet wird.' },
        { source: '[aus einer deutschen Zeitung]', answer: 'K', text: 'Wie verschickt man ein Foto? Wie funktioniert die Fahrplan-App? Solche Fragen beantworten seit dem Herbst Schülerinnen und Schüler eines Kölner Gymnasiums. Einmal pro Woche treffen sie sich als „Digital-Paten“ im Seniorenzentrum des Stadtteils und helfen älteren Menschen geduldig im Umgang mit Handy und Tablet. Die Jugendlichen bekommen dafür kein Geld, aber eine Bestätigung für ihre Bewerbungsmappe. Und oft, so erzählen sie, lernen sie selbst viel – etwa Geschichten aus einer Zeit ganz ohne Internet.' }
      ]
    },
    a3: {
      title: 'Homeoffice: Fluch oder Segen?',
      source: '[aus einer österreichischen Tageszeitung]',
      examples: [
        ['Wien. Immer mehr Beschäftigte in Österreich arbei', 'ten'],
        ['zumindest an einigen Tagen pro Woche von zu Hau', 'se'],
        ['aus. Das zeigt eine aktuelle Umfrage der Arbeiterkam', 'mer']
      ],
      lines: [
        [', an der rund 2.000 Personen teilgenommen hab', ['en']],
        ['Besonders beliebt ist das Homeoffice bei Eltern klei', ['ner']],
        ['Kinder und bei Menschen mit langem Arbeitsweg. Sie spa', ['ren']],
        ['nicht nur Zeit, sondern auch Geld für Benzin od', ['er']],
        ['Bahntickets. Viele Befragte geben außerdem a', ['n']],
        ['dass sie zu Hause konzentrierter arbeiten kön', ['nen']],
        ['weil sie seltener gestört werden. Doch es gi', ['bt']],
        ['auch Schattenseiten: Fast die Hälfte vermisst d', ['en']],
        ['persönlichen Kontakt zu den Kolleginnen und Kol', ['le-', 'le']],
        ['gen. Andere klagen, dass Arbeit und Freizeit im', ['mer']],
        ['stärker verschwimmen. Sie lesen abends noch E-Ma', ['ils']],
        ['oder sind am Wochenende telefonisch erreich', ['bar']],
        ['Die Arbeitspsychologin Sabine Huber rät deshalb, fes', ['te']],
        ['Arbeitszeiten einzuhalten und einen eigenen Arbeitspla', ['tz']],
        ['einzurichten. „Wer am Küchentisch arbeitet, kommt n', ['ie']],
        ['richtig zur Ruhe“, sagt sie. Auch die Unternehm', ['en']],
        ['sind gefordert: Sie sollten klare Regeln für d', ['ie']],
        ['Erreichbarkeit festlegen und ihren Mitarbeitenden ei', ['ne']],
        ['gute technische Ausstattung zur Verfügung stell', ['en']],
        ['Dann kann das Homeoffice für beide Seiten ein Gew', ['inn']]
      ],
      tail: 'sein.'
    },
    a4: {
      situation: 'Im folgenden Einladungsschreiben fehlen einige Wörter.',
      text: `Sehr {0} Damen und Herren,

wir freuen {1} sehr, Ihnen mitteilen zu können, dass unser Sprachinstitut „Wortwerk“ ab 1. März neue Räume in der Linzer Innenstadt bezieht. Aus diesem Anlass laden wir Sie herzlich {2} unserem Tag der offenen Tür am Samstag, dem 8. März, ein.

Zwischen 10 und 16 Uhr können Sie kostenlose Schnupperstunden in Deutsch, Englisch, Italienisch {3} Spanisch besuchen. Unsere Lehrkräfte beraten Sie gern, {4} Kurs am besten zu Ihrem Niveau passt. Wer möchte, kann gleich {5} Ort einen kurzen Einstufungstest machen.

Für Kinder bieten wir ein eigenes Programm an, {6} die Eltern in Ruhe unsere Räume besichtigen können. Alle Besucherinnen und Besucher, {7} sich an diesem Tag für einen Kurs anmelden, erhalten eine Ermäßigung von 15 Prozent.

Da die Zahl der Plätze bei den Schnupperstunden begrenzt ist, bitten wir Sie, sich {8} spätestens 5. März online anzumelden.

Wir würden uns sehr freuen, Sie bei {9} begrüßen zu dürfen.

Mit freundlichen {10}
Martina Gruber
Leitung Kursorganisation`,
      example: 'geehrte',
      answers: { 1: ['uns'], 2: ['zu'], 3: ['und', 'oder', 'sowie'], 4: ['welcher'], 5: ['vor'], 6: ['damit', 'sodass', 'während'], 7: ['die'], 8: ['bis'], 9: ['uns'], 10: ['Grüßen', 'Grüssen'] }
    }
  },
  hoeren: {
    a1: {
      title: 'Ehrenamt',
      situation: 'Sie hören jetzt eine Radiosendung. Lesen Sie die folgenden Aussagen und kreuzen Sie jeweils die richtige Lösung an. Sie hören den Text zwei Mal.',
      intro: 'Fast jede zweite Person in Österreich engagiert sich freiwillig.',
      plays: 2,
      audio: 'osd-b2-1-h1.mp3',
      voices: { M: 'de-AT-IngridNeural', E: 'de-AT-JonasNeural' },
      speakers: { M: 'Moderatorin', E: 'Dr. Martin Brandstätter, Soziologe' },
      script: [
        ['M', 'Guten Abend und herzlich willkommen bei „Gesellschaft im Gespräch“. Unser Thema heute: das Ehrenamt. Bei mir im Studio ist der Soziologe Dr. Martin Brandstätter, der seit vielen Jahren zum freiwilligen Engagement in Österreich forscht. Herr Brandstätter, wie viele Menschen engagieren sich bei uns eigentlich freiwillig?'],
        ['E', 'Mehr, als die meisten denken. Laut der letzten großen Erhebung sind es rund sechsundvierzig Prozent der Bevölkerung ab fünfzehn Jahren, also fast jede zweite Person. Viele denken beim Ehrenamt zuerst an Rettungsdienst und Feuerwehr. Diese Bereiche sind natürlich sehr wichtig, aber die meisten Freiwilligen findet man in Sportvereinen und im Bereich Kunst und Kultur – also etwa in Musikkapellen, Chören oder Theatergruppen.'],
        ['M', 'Man hört oft, dass gerade junge Leute keine Lust mehr auf Vereine haben. Stimmt das?'],
        ['E', 'Nein, das ist ein Vorurteil. Junge Menschen engagieren sich heute genauso häufig wie vor zwanzig Jahren. Was sich verändert hat, ist die Art des Engagements. Viele Jüngere wollen sich nicht mehr für Jahrzehnte an einen Verein binden. Sie suchen lieber ein Projekt, das ein paar Wochen oder Monate dauert – zum Beispiel die Organisation eines Festivals oder Nachhilfe für geflüchtete Kinder.'],
        ['M', 'Und warum machen die Leute das? Sie bekommen ja kein Geld dafür.'],
        ['E', 'Die Motive sind sehr unterschiedlich. Natürlich möchten die meisten anderen helfen. Aber in unseren Befragungen sagen auch viele, dass sie durch das Ehrenamt neue Fähigkeiten erwerben wollen: Sie lernen, ein Team zu leiten, vor Publikum zu sprechen oder Konflikte zu lösen. Das hilft später oft auch im Beruf.'],
        ['M', 'Wo sehen Sie die größten Probleme für die Vereine?'],
        ['E', 'Ganz klar bei den Leitungsfunktionen. Mitglieder, die beim Sommerfest mithelfen, gibt es genug. Aber für das Amt der Obfrau, des Kassiers oder der Schriftführerin findet sich immer schwerer jemand. Diese Aufgaben kosten viel Zeit und bringen viel Verantwortung mit sich.'],
        ['M', 'Was raten Sie den Vereinen?'],
        ['E', 'Sie sollten große Aufgaben in kleinere, überschaubare Projekte aufteilen und klar sagen, wie lange ein Engagement dauert. Wer weiß, dass er sich für sechs Monate verpflichtet und nicht für zehn Jahre, sagt viel leichter zu. Außerdem hilft es, wenn erfahrene Mitglieder die Neuen am Anfang begleiten.'],
        ['M', 'Zum Schluss noch eine Frage zur Anerkennung: Bekommen Ehrenamtliche in Österreich irgendetwas für ihre Arbeit?'],
        ['E', 'Bezahlt werden sie nicht, das liegt ja im Wesen des Ehrenamts, egal wie viele Stunden sie leisten. Aber es gibt seit einigen Jahren den Freiwilligenpass. Darin werden Tätigkeiten und erworbene Kompetenzen offiziell bestätigt, und viele Arbeitgeber schätzen das bei Bewerbungen. Eines möchte ich aber betonen: Der Staat kann das Ehrenamt nicht ersetzen. Ohne die vielen Freiwilligen würde unsere Gesellschaft schlicht nicht funktionieren.'],
        ['M', 'Herr Dr. Brandstätter, vielen Dank für das Gespräch.']
      ],
      sections: [[0, 1], [2, 5], [6, 9], [10, 12]],
      items: [
        { s: 'Fast die Hälfte der Menschen in Österreich arbeitet ehrenamtlich.', a: true, sec: 1 },
        { s: 'Die meisten Freiwilligen engagieren sich bei Rettungsdienst und Feuerwehr.', a: false, sec: 1 },
        { s: 'Junge Menschen engagieren sich heute seltener als früher.', a: false, sec: 2 },
        { s: 'Viele Jüngere möchten sich nur für einen begrenzten Zeitraum engagieren.', a: true, sec: 2 },
        { s: 'Für viele Freiwillige ist es wichtig, durch das Ehrenamt neue Fähigkeiten zu lernen.', a: true, sec: 2 },
        { s: 'Vereine finden immer leichter Personen für Leitungsfunktionen.', a: false, sec: 3 },
        { s: 'Herr Brandstätter empfiehlt, große Aufgaben in kleinere Projekte aufzuteilen.', a: true, sec: 3 },
        { s: 'Wer mehr als zehn Stunden pro Woche arbeitet, bekommt dafür Geld.', a: false, sec: 4 },
        { s: 'Ehrenamtliche können sich ihre Tätigkeit in einem Dokument bestätigen lassen.', a: true, sec: 4 },
        { s: 'Herr Brandstätter glaubt, dass der Staat die Arbeit der Freiwilligen übernehmen könnte.', a: false, sec: 4 }
      ]
    },
    a2: {
      title: 'Coworking-Spaces in Wien',
      situation: 'Sie hören ein Gespräch zwischen zwei Personen, die Informationen austauschen. Hören Sie gut zu und ergänzen Sie entweder die fehlenden Informationen oder kreuzen Sie die entsprechenden Kästchen an. Sie hören den Text ein Mal.',
      plays: 1,
      audio: 'osd-b2-1-h2.mp3',
      voices: { L: 'de-AT-JonasNeural', S: 'de-DE-SeraphinaMultilingualNeural' },
      speakers: { L: 'Lukas', S: 'Sarah' },
      columns: ['HubSpace Mariahilf', 'Werkbank Ottakring', 'Loft am Kanal'],
      rows: [
        { label: 'Arbeitsplatz', type: 'check', options: ['fester Schreibtisch', 'flexibler Platz'], answers: [[1], [0, 1], [0]] },
        { label: 'Preis pro Monat', type: 'text', unit: 'Euro', answers: [['190'], ['150'], ['240']] },
        { label: 'Ermäßigung für Studierende', type: 'text', unit: '%', answers: [['20'], ['30'], ['10']] },
        { label: 'Mindestvertragsdauer', type: 'text', unit: 'Monat(e)', answers: [['1', 'einen', 'ein'], ['3', 'drei'], ['6', 'sechs']] },
        { label: 'im Preis inbegriffen', type: 'check', options: ['Drucker', 'Besprechungsraum'], answers: [[0, 1], [0], [1]] },
        { label: 'Zugang', type: 'check', options: ['am Wochenende', 'rund um die Uhr'], answers: [[0], [0, 1], []] },
        { label: 'Ausstattung', type: 'check', options: ['Küche', 'Telefonkabine', 'Dusche'], answers: [[0, 1], [0, 2], [0, 1, 2]] },
        { label: 'Extras', type: 'check', options: ['Kinderbetreuung', 'Fahrradraum'], answers: [[1], [0, 1], [0]] },
        { label: 'kostenlose Probetage', type: 'text', unit: 'Tag(e)', answers: [['2', 'zwei'], ['1', 'einen', 'ein'], ['3', 'drei']] },
        { label: 'Empfang besetzt bis', type: 'text', unit: 'Uhr', answers: [['18', '18:00', '18.00', '6'], ['17', '17:00', '17.00', '5'], ['20', '20:00', '20.00', '8']] }
      ],
      script: [
        ['L', 'Hallo Sarah! Du, du hast doch gesagt, du hast dir ein paar Coworking-Spaces angeschaut. Ich halte es zu Hause einfach nicht mehr aus, ich brauche einen richtigen Arbeitsplatz.'],
        ['S', 'Ja, ich hab mir drei angesehen: den HubSpace in Mariahilf, die Werkbank in Ottakring und das Loft am Kanal. Was willst du wissen?'],
        ['L', 'Am besten alles. Fangen wir mit dem HubSpace an. Hat man dort einen eigenen Schreibtisch?'],
        ['S', 'Nein, dort gibt es nur flexible Plätze. Du setzt dich hin, wo gerade frei ist. Dafür ist er nicht so teuer: hundertneunzig Euro im Monat. Und Studierende bekommen zwanzig Prozent Ermäßigung.'],
        ['L', 'Das wäre für mich interessant, ich bin ja noch inskribiert. Muss man sich lange binden?'],
        ['S', 'Überhaupt nicht, du kannst monatlich kündigen, also die Mindestdauer ist ein Monat. Drucker und Besprechungsraum sind im Preis dabei. Am Wochenende ist auch offen, aber nicht rund um die Uhr, in der Nacht wird zugesperrt.'],
        ['L', 'Und wie ist die Ausstattung?'],
        ['S', 'Es gibt eine Küche und eine Telefonkabine für ungestörte Gespräche. Eine Dusche gibt es leider nicht. Aber einen Fahrradraum im Hof, das fand ich praktisch. Du kannst zwei Tage gratis zum Probieren kommen, und der Empfang ist bis achtzehn Uhr besetzt.'],
        ['L', 'Klingt nicht schlecht. Und die Werkbank in Ottakring?'],
        ['S', 'Die ist die günstigste: hundertfünfzig Euro. Studierende zahlen sogar dreißig Prozent weniger. Dort kannst du wählen: Es gibt fixe Schreibtische und auch flexible Plätze. Allerdings musst du dich mindestens drei Monate binden.'],
        ['L', 'Hm. Ist der Besprechungsraum dabei?'],
        ['S', 'Nein, der kostet extra, nur der Drucker ist inklusive. Dafür hast du rund um die Uhr Zugang, also natürlich auch am Wochenende. Und es gibt eine Küche und sogar eine Dusche, falls du mit dem Rad kommst. Eine Telefonkabine haben sie nicht.'],
        ['L', 'Das mit dem Rad wäre gut.'],
        ['S', 'Ja, einen Fahrradraum haben sie auch. Und das Besondere: Am Vormittag gibt es eine Kinderbetreuung im Haus. Für Eltern ist das super. Probieren kannst du dort aber nur einen Tag kostenlos, und der Empfang ist nur bis siebzehn Uhr da.'],
        ['L', 'Und das Loft am Kanal? Das schaut auf den Fotos sehr schick aus.'],
        ['S', 'Ist es auch, aber es ist am teuersten: zweihundertvierzig Euro im Monat, und für Studierende gibt es nur ungefähr zehn Prozent Rabatt. Dort hast du einen festen Schreibtisch, flexible Plätze gibt es keine. Und der Vertrag läuft mindestens sechs Monate.'],
        ['L', 'Sechs Monate, das ist lang. Was ist im Preis drin?'],
        ['S', 'Der Besprechungsraum, den Drucker zahlst du extra. Geöffnet ist nur von Montag bis Freitag, also nicht am Wochenende und auch nicht in der Nacht. Die Ausstattung ist aber top: Küche, Telefonkabinen und Duschen.'],
        ['L', 'Gibt es dort einen Platz für Fahrräder?'],
        ['S', 'Nein, leider nicht. Aber auch dort gibt es eine Kinderbetreuung. Und du kannst drei Tage gratis probieren. Der Empfang ist am längsten besetzt, bis zwanzig Uhr.'],
        ['L', 'Super, danke dir! Ich glaube, ich probiere zuerst den HubSpace aus.']
      ]
    }
  },
  schreiben: {
    a1: {
      situation: 'Um Ihre Deutschkenntnisse zu verbessern, haben Sie im Sommer einen zweiwöchigen Intensivkurs in Salzburg besucht (siehe Inserat). Der Kurs wurde von einer Sprachreise-Agentur organisiert, hat aber überhaupt nicht Ihren Erwartungen entsprochen. Sie haben sich bereits Notizen dazu gemacht.',
      task: 'Schreiben Sie nun ein Beschwerde-E-Mail an die Agentur, in dem Sie auf alle Ihre Notizen eingehen. Übernehmen Sie die Vorgaben nicht wortwörtlich, sondern verwenden Sie eigene, situationsangemessene Formulierungen. Schreiben Sie circa 120 Wörter und beachten Sie dabei auch die formalen Kriterien dieser Textsorte (Anrede, Grußformel).',
      ad: { title: 'SPRACHREISEN ALPENBLICK', lines: ['Deutsch-Intensivkurs in Salzburg', 'kleine Gruppen (max. 8 Personen)', '25 Unterrichtsstunden pro Woche', 'Gastfamilie in Zentrumsnähe', 'alle Ausflüge im Preis inbegriffen', '2 Wochen ab 890 Euro'], contact: 'info@sprachreisen-alpenblick.at · z. H. Herrn Moser' },
      notes: ['18 Personen in der Gruppe!', 'Gastfamilie: 45 Minuten mit dem Bus', 'Ausflüge extra bezahlt', 'mehrere Stunden ausgefallen'],
      to: 'info@sprachreisen-alpenblick.at',
      subject: 'Beschwerde über den Intensivkurs im August',
      model: `Sehr geehrter Herr Moser,

im August habe ich über Ihre Agentur einen zweiwöchigen Intensivkurs in Salzburg besucht. Leider war ich mit dem Kurs sehr unzufrieden.

In Ihrem Inserat versprechen Sie kleine Gruppen mit höchstens acht Personen. In meiner Gruppe saßen jedoch 18 Teilnehmende, sodass ich kaum sprechen konnte. Außerdem lag meine Gastfamilie nicht in der Nähe des Zentrums: Ich musste jeden Tag 45 Minuten mit dem Bus fahren. Obwohl alle Ausflüge im Preis inbegriffen sein sollten, mussten wir sie zusätzlich bezahlen. Darüber hinaus sind mehrere Unterrichtsstunden ersatzlos ausgefallen.

Ich bitte Sie daher, mir einen Teil der Kursgebühr sowie die Kosten für die Ausflüge zurückzuerstatten. Ich freue mich auf Ihre baldige Antwort.

Mit freundlichen Grüßen
Mina Rahimi`
    },
    a2: {
      intro: 'Wählen Sie eine der folgenden Aufgabenstellungen (A oder B). Schreiben Sie circa 120 Wörter.',
      variants: {
        A: {
          lead: 'Sie haben im Deutschkurs über das Thema „Smartphones an Schulen“ diskutiert. Dabei fielen folgende Äußerungen:',
          quotes: ['Handys haben im Unterricht nichts verloren – die Kinder können sich sonst nicht konzentrieren.', 'Schülerinnen und Schüler müssen lernen, digitale Medien sinnvoll zu nutzen. Ein Verbot bringt gar nichts.', 'In der Pause sollten die Kinder miteinander reden und spielen, nicht auf ihr Handy starren.'],
          points: ['Wie denken Sie über diese Äußerungen?', 'Begründen Sie Ihre persönliche Meinung.', 'Beschreiben Sie eigene Erfahrungen (oder Erfahrungen von Freunden) zum Thema.', 'Wie ist die Situation in Ihrem Land?'],
          model: `In unserem Deutschkurs haben wir lange darüber diskutiert, ob Smartphones in der Schule erlaubt sein sollten. Ich kann alle drei Äußerungen ein Stück weit nachvollziehen.

Meiner Meinung nach sollte das Handy im Unterricht grundsätzlich ausgeschaltet bleiben, weil schon eine einzige Nachricht die Konzentration stört. Ein komplettes Verbot halte ich aber für falsch, denn Jugendliche müssen lernen, verantwortungsvoll mit digitalen Medien umzugehen. Das gelingt am besten, wenn Lehrkräfte das Handy gezielt für Recherchen einsetzen.

Mein Neffe besucht eine Schule, an der Handys in der Pause verboten sind. Er hat mir erzählt, dass die Schüler seitdem wieder mehr miteinander reden und Fußball spielen.

In meinem Land gibt es keine einheitliche Regel. Jede Schule entscheidet selbst, und viele Eltern wünschen sich klarere Vorgaben.`
        },
        B: {
          lead: 'Sie haben in verschiedenen Zeitungen folgende Schlagzeilen zum Thema „Leben auf dem Land“ gelesen:',
          quotes: ['Zurück aufs Land: Immer mehr Familien verlassen die Großstadt', 'Kein Bus, kein Arzt, kein Geschäft – Dörfer verlieren ihre Jugend', 'Dank Homeoffice: Arbeiten in der Stadt, wohnen im Grünen'],
          points: ['Wie denken Sie über diese Schlagzeilen?', 'Begründen Sie Ihre persönliche Meinung.', 'Beschreiben Sie eigene Erfahrungen (oder Erfahrungen von Freunden) zum Thema.', 'Wie ist die Situation in Ihrem Land?'],
          model: ''
        }
      }
    }
  },
  sprechen: {
    a1: {
      title: 'Jemanden kennenlernen und beraten',
      minutes: 5,
      situation: 'Ihr Flug hat drei Stunden Verspätung. Beim Warten am Flughafen lernen Sie eine Person kennen.',
      points: ['Sprechen Sie über Zweck und Ziel Ihrer Reise. Unterhalten Sie sich dann über das Thema „Kochen und Ernährung“.', 'Tauschen Sie Ihre Erfahrungen und Ansichten aus (Kochen Sie gern? Was essen Sie im Alltag? Achten Sie auf gesunde Ernährung?) und geben Sie sich gegenseitig Tipps.'],
      partner: ['Ach, Sie fliegen auch nach Wien? Beruflich oder privat?', 'Kochen Sie eigentlich selbst, oder essen Sie meistens auswärts?', 'Was würden Sie mir empfehlen, wenn ich gesünder essen möchte?']
    },
    a2: {
      title: 'Ein Bild/Foto beschreiben und interpretieren',
      minutes: 5,
      situation: 'Wählen Sie eines der drei Bilder aus und • begründen Sie, warum Sie sich für dieses Bild entschieden haben, • beschreiben Sie das Bild und • gehen Sie dann auf das Thema des Bildes ein: Was ist das Thema? Was sagt das Bild aus? Äußern Sie Ihre Meinung und stellen Sie Vermutungen an.',
      images: [
        { src: 'img/osd-b2-1-bild1.jpg', alt: 'Ältere Frau und Jugendliche mit Smartphone auf einer Parkbank', theme: 'Generationen und Technik', prompt: 'documentary photo, elderly woman learning to use a smartphone with help of a teenage girl on a park bench in Vienna, natural light, candid' },
        { src: 'img/osd-b2-1-bild2.jpg', alt: 'Vater arbeitet am Laptop am Küchentisch, Kind spielt daneben', theme: 'Homeoffice und Familie', prompt: 'documentary photo, father working on a laptop at a small kitchen table at home while his young child plays with toy blocks next to him, slightly chaotic, morning light, candid' },
        { src: 'img/osd-b2-1-bild3.jpg', alt: 'Ehrenamtliche reparieren gemeinsam einen Toaster in einem Repair-Café', theme: 'Reparieren statt wegwerfen', prompt: 'documentary photo, repair cafe in a community hall, retired man with glasses and a young woman repairing an old toaster together with screwdrivers on a table, other people waiting with broken lamps and bicycles in the background, warm light' }
      ]
    },
    a3: {
      title: 'Meinungsaustausch',
      minutes: 5,
      topic: 'Wohnen in der Stadt oder auf dem Land',
      situation: 'Sie und Ihre Gesprächspartnerin/Ihr Gesprächspartner haben folgende Stellungnahmen zum Thema „Wohnen“ gelesen und sollen nun darüber diskutieren. Versetzen Sie sich in die Rolle einer Person und vertreten Sie deren Standpunkt. Bringen Sie weitere Aspekte und Argumente in das Gespräch ein.',
      roles: [
        { name: 'Theresa, 34', text: '„Für mich gibt es nichts Schöneres als das Leben in der Stadt. Ich gehe zu Fuß ins Büro, abends treffe ich Freundinnen im Kino oder im Theater, und am Wochenende besuche ich Ausstellungen. Ein Auto brauche ich nicht, die Öffis fahren alle paar Minuten. Natürlich ist die Miete hoch und die Wohnung klein, aber dafür habe ich alles vor der Haustür. Auf dem Land würde ich mich schnell langweilen – und ohne Auto wäre ich dort völlig aufgeschmissen.“' },
        { name: 'Florian, 41', text: '„Vor drei Jahren sind wir mit unseren zwei Kindern aus Wien in ein kleines Dorf im Waldviertel gezogen, und wir haben es nie bereut. Wir haben ein Haus mit Garten, die Kinder spielen draußen, und die Nachbarn kennen einander. Die Luft ist sauber und es ist ruhig. Dank Homeoffice muss ich nur zweimal pro Woche in die Stadt fahren. Klar, die Wege sind weiter und ohne Auto geht es nicht. Aber für das Geld, das wir früher für eine kleine Stadtwohnung bezahlt haben, leben wir hier viel besser.“' }
      ]
    }
  }
},
{
  id: 'osd-b2-2',
  title: 'ÖSD Zertifikat B2 · Modellprüfung 2',
  theme: { fa: 'قطار شبانه، خواب، کتاب‌خوانی نوجوانان', de: 'Nachtzüge, Schlaf, Lesen', en: 'Night trains, sleep, reading' },
  lesen: {
    a1: {
      title: 'Langsam ans Ziel: Die Rückkehr der Nachtzüge',
      source: '[aus einer Schweizer Zeitung]',
      text: `Es ist kurz vor 22 Uhr im Zürcher Hauptbahnhof. Auf Gleis 8 steht ein langer blauer Zug, an dessen Fenstern Schilder mit den Zielen Amsterdam, Berlin und Prag hängen. Reisende mit Rollkoffern suchen ihren Wagen, eine Familie verabschiedet sich lautstark von der Grossmutter. Vor zehn Jahren schien es, als würde diese Art zu reisen bald ganz verschwinden. Viele Bahngesellschaften hatten ihre Nachtverbindungen eingestellt, weil sie zu teuer waren und Billigflüge die Kundschaft anlockten.

Heute erleben Nachtzüge eine erstaunliche Renaissance. Die Zahl der Verbindungen ab der Schweiz hat sich in den vergangenen fünf Jahren mehr als verdoppelt, und an Wochenenden sind die Schlafwagen oft Wochen im Voraus ausgebucht. Der wichtigste Grund ist das gewachsene Umweltbewusstsein: Eine Reise mit dem Nachtzug verursacht nur einen Bruchteil der CO₂-Emissionen eines Fluges.

Doch nicht nur das Klima spielt eine Rolle. „Viele Gäste schätzen, dass sie keine Zeit verlieren“, erklärt die Bahnexpertin Corinne Keller. „Man steigt abends ein, schläft und kommt am Morgen ausgeruht im Stadtzentrum an – ohne lange Wege zum Flughafen und ohne Sicherheitskontrollen.“ Ausserdem sei die Reise selbst für viele ein Erlebnis. Gerade junge Menschen posten Fotos aus ihrem Abteil in den sozialen Medien.

Ganz ohne Probleme läuft der Boom allerdings nicht. Es fehlt an modernen Wagen, denn die Hersteller kommen mit der Produktion kaum nach. Deshalb sind auf manchen Strecken noch alte Fahrzeuge unterwegs, in denen die Klimaanlage im Sommer gelegentlich ausfällt. Auch die Preise sorgen für Kritik: Ein Bett im Schlafwagen kostet oft mehr als ein Flug zum selben Ziel. Keller fordert deshalb, dass Bahnreisen steuerlich gegenüber dem Flugverkehr nicht länger benachteiligt werden.

Trotz allem ist die Expertin optimistisch. Mehrere europäische Bahnen haben neue Züge bestellt, die in den nächsten Jahren ausgeliefert werden. Sie sollen auch Einzelkabinen mit eigener Dusche bieten – ein Komfort, den Reisende bisher meist nur aus Hotels kannten.`,
      example: { q: 'Vor zehn Jahren', options: ['waren Nachtzüge besonders beliebt.', 'wurden viele Nachtverbindungen gestrichen.', 'fuhren Nachtzüge nur innerhalb der Schweiz.'], answer: 1 },
      items: [
        { q: 'Heute', options: ['muss man Schlafwagen am Wochenende oft lange vorher buchen.', 'gibt es halb so viele Nachtverbindungen wie früher.', 'fahren Nachtzüge vor allem unter der Woche.'], answer: 0 },
        { q: 'Laut Corinne Keller gefällt vielen Reisenden, dass', options: ['sie im Zug arbeiten können.', 'sie direkt im Stadtzentrum ankommen.', 'die Fahrt kürzer ist als ein Flug.'], answer: 1 },
        { q: 'Ein Problem ist, dass', options: ['zu wenige Menschen mit dem Nachtzug fahren wollen.', 'die neuen Wagen keine Klimaanlage haben.', 'nicht genug moderne Wagen zur Verfügung stehen.'], answer: 2 },
        { q: 'Corinne Keller fordert,', options: ['die Bahn steuerlich nicht schlechter zu stellen als das Flugzeug.', 'die Preise für Flüge stark zu senken.', 'auf alten Strecken keine Nachtzüge mehr fahren zu lassen.'], answer: 0 },
        { q: 'Die neuen Züge sollen', options: ['schneller als die heutigen Züge fahren.', 'günstiger als Hotelzimmer sein.', 'Kabinen mit eigenem Bad anbieten.'], answer: 2 }
      ]
    },
    a2: {
      headings: [
        ['A', 'Kantine serviert nur noch vegetarisch – Mitarbeitende protestieren'],
        ['B', 'Studie: Wer mittags kurz schläft, arbeitet besser'],
        ['C', 'Neue Regeln für Lieferdienste in Wien'],
        ['D', 'Basler Firma testet Vier-Tage-Woche'],
        ['E', 'Immer mehr Betriebe bieten gesundes Essen für ihr Personal'],
        ['F', 'Zu wenig Schlaf: Jugendliche sind besonders betroffen'],
        ['G', 'Fahrradkuriere gründen eigene Genossenschaft'],
        ['H', 'Vier-Tage-Woche: Gewerkschaft lehnt Modell ab'],
        ['I', 'Schulbeginn um acht Uhr? Eltern fordern spätere Zeiten'],
        ['K', 'Mehr Urlaub statt mehr Lohn: Junge Beschäftigte setzen neue Prioritäten']
      ],
      texts: [
        { source: '[aus einer Schweizer Zeitung]', answer: 'D', text: 'Seit April arbeiten die rund 60 Angestellten eines Basler Softwareunternehmens nur noch von Montag bis Donnerstag – bei vollem Lohn. Der Versuch ist zunächst auf ein Jahr befristet. Die Geschäftsleitung hofft, dass die Mitarbeitenden ausgeruhter und motivierter sind und die Firma für Fachkräfte attraktiver wird. Ein Forschungsteam der Universität Basel begleitet das Projekt und misst regelmässig Produktivität und Zufriedenheit. Erste Ergebnisse sollen im Herbst vorgestellt werden.' },
        { source: '[aus einer deutschen Zeitschrift]', answer: 'E', text: 'Frisches Gemüse statt Currywurst: Viele Unternehmen in Deutschland haben ihre Kantinen in den letzten Jahren völlig neu ausgerichtet. Laut einer Umfrage unter 500 Betrieben bietet inzwischen fast jede zweite Kantine täglich ein vollwertiges Menü nach den Empfehlungen der Deutschen Gesellschaft für Ernährung an. Die Firmen versprechen sich davon weniger Krankheitstage. Fleisch verschwindet aber nicht vom Speiseplan – es wird nur seltener und in kleineren Portionen angeboten.' },
        { source: '[aus einer österreichischen Tageszeitung]', answer: 'F', text: 'Mehr als die Hälfte der 14- bis 18-Jährigen in Österreich schläft unter der Woche weniger als die empfohlenen acht Stunden. Das ergab eine Befragung der Medizinischen Universität Innsbruck. Als Hauptgrund nennen die Forscherinnen das Smartphone, das viele Jugendliche bis spät in die Nacht nutzen. Die Folgen zeigen sich am nächsten Tag: Konzentrationsprobleme, schlechte Laune und ein höheres Unfallrisiko im Straßenverkehr. Die Studienautorinnen raten, Handys nachts aus dem Schlafzimmer zu verbannen.' },
        { source: '[aus einer deutschen Tageszeitung]', answer: 'K', text: 'Für viele Berufseinsteigerinnen und -einsteiger ist ein hohes Gehalt nicht mehr das wichtigste Kriterium bei der Jobwahl. In einer Umfrage einer Hamburger Personalberatung gaben 58 Prozent der unter 30-Jährigen an, sie würden auf eine Gehaltserhöhung verzichten, wenn sie dafür zusätzliche freie Tage bekämen. Ebenfalls wichtig sind ihnen flexible Arbeitszeiten und die Möglichkeit, von zu Hause aus zu arbeiten. Arbeitgeber müssen sich darauf einstellen, wenn sie Nachwuchs gewinnen wollen.' },
        { source: '[aus einer österreichischen Zeitschrift]', answer: 'G', text: 'Unzufrieden mit niedrigen Löhnen und unsicheren Verträgen bei den großen Lieferplattformen haben 25 Fahrradbotinnen und -boten in Wien ein eigenes Unternehmen gegründet. Die Genossenschaft gehört allen Mitgliedern gemeinsam, Entscheidungen werden demokratisch getroffen. Ausgeliefert werden vor allem Lebensmittel aus Bioläden und Medikamente aus Apotheken. Alle Fahrerinnen und Fahrer sind fest angestellt und versichert. Nach einem schwierigen Start schreibt die Firma inzwischen schwarze Zahlen.' }
      ]
    },
    a3: {
      title: 'Lesen Jugendliche noch Bücher?',
      source: '[aus einer deutschen Wochenzeitung]',
      examples: [
        ['Berlin. Jugendliche lesen weniger Bücher als frühe', 'r'],
        ['Generationen – so lautet ein weitverbreitetes Vorur', 'teil'],
        ['Eine neue Studie der Stiftung Lesen zeichnet jedo', 'ch']
      ],
      lines: [
        ['ein differenzierteres Bild. Zwar greifen Jugendlic', ['he']],
        ['in ihrer Freizeit seltener zu einem Roman als no', ['ch']],
        ['vor zwanzig Jahren. Dafür lesen sie heute deutl', ['ich']],
        ['mehr Texte am Bildschirm, etwa Nachrichten, Blo', ['gs']],
        ['oder Beiträge in Foren. Besonders erfolgreich si', ['nd']],
        ['außerdem Fantasy-Romane, die zuerst im Inter', ['net']],
        ['veröffentlicht wurden. Manche Autorinnen und Au', ['to-']],
        ['ren haben auf diese Weise Millionen von Leser', ['n']],
        ['gewonnen, bevor überhaupt ein Verlag auf s', ['ie']],
        ['aufmerksam wurde. Die Forscherinnen beobachten', ['au-', 'au']],
        ['ßerdem einen neuen Trend: Unter dem Stichwort Bo', ['ok-']],
        ['Tok empfehlen junge Menschen einander Büch', ['er']],
        ['in kurzen Videos. Buchhandlungen richten dafür ei', ['ge-']],
        ['ne Regale ein, und die Verkaufszahlen der empfoh', ['le-']],
        ['nen Titel steigen oft stark an. Sorgen macht d', ['en']],
        ['Fachleuten allerdings, dass viele Kinder aus Fam', ['i-']],
        ['lien ohne Bücher kaum Zugang zum Lesen fin', ['den']],
        ['Hier seien vor allem Schulen und Bibliotheken g', ['e-']],
        ['fragt. Denn wer gut lesen kann, hat in Schule u', ['nd']],
        ['Beruf nachweislich bessere Chanc', ['en']]
      ],
      tail: '.'
    },
    a4: {
      situation: 'Im folgenden Informationsschreiben einer Hausverwaltung fehlen einige Wörter.',
      text: `Sehr {0} Mieterinnen und Mieter,

wie bereits in der Hausversammlung angekündigt, beginnen am Montag, dem 14. April, die Arbeiten an der Fassade {1} Hauses. Die Renovierung wird voraussichtlich bis Ende Juni dauern.

Während dieser Zeit wird ein Gerüst aufgestellt. Wir bitten Sie daher, Blumenkästen und andere Gegenstände {2} Ihren Balkonen zu entfernen. Bitte halten Sie außerdem die Fenster tagsüber geschlossen, {3} kein Staub in die Wohnungen gelangt.

Die Arbeiten finden von Montag {4} Freitag zwischen 7 und 17 Uhr statt. Wir sind uns bewusst, {5} es in dieser Zeit zu Lärm kommen kann, und bitten Sie um Ihr Verständnis.

Der Fahrradraum im Erdgeschoss kann {6} der Bauarbeiten leider nicht benutzt werden. Als Ersatz stellen wir Ihnen Stellplätze im Hof {7} Verfügung.

Sollten Sie Fragen haben, wenden Sie sich bitte direkt an {8} Bauleiter, Herrn Novak. Sie erreichen ihn unter der Telefonnummer 0662 418 220.

Wir danken Ihnen für Ihre Geduld und freuen uns, {9} Sie nach der Renovierung in einem schöneren Haus wohnen {10}.

Mit freundlichen Grüßen
Ihre Hausverwaltung Berger & Partner`,
      example: 'geehrte',
      answers: { 1: ['des', 'unseres', 'Ihres', 'dieses'], 2: ['von', 'auf'], 3: ['damit', 'sodass'], 4: ['bis'], 5: ['dass'], 6: ['während', 'wegen'], 7: ['zur'], 8: ['den', 'unseren'], 9: ['dass', 'wenn'], 10: ['werden', 'können'] }
    }
  },
  hoeren: {
    a1: {
      title: 'Schlaf',
      situation: 'Sie hören jetzt eine Radiosendung. Lesen Sie die folgenden Aussagen und kreuzen Sie jeweils die richtige Lösung an. Sie hören den Text zwei Mal.',
      intro: 'Viele Menschen in der Schweiz schlafen schlecht.',
      plays: 2,
      audio: 'osd-b2-2-h1.mp3',
      voices: { M: 'de-CH-JanNeural', E: 'de-CH-LeniNeural' },
      speakers: { M: 'Moderator', E: 'Dr. Andrea Gerber, Schlafforscherin' },
      script: [
        ['M', 'Grüezi und willkommen bei „Wissen am Abend“. Heute geht es um ein Thema, das uns alle betrifft: den Schlaf. Bei mir ist die Schlafforscherin Dr. Andrea Gerber vom Universitätsspital Bern. Frau Gerber, schlafen wir Schweizerinnen und Schweizer zu wenig?'],
        ['E', 'Viele schon. In unserer letzten Umfrage hat etwa ein Drittel der Befragten angegeben, regelmässig schlecht zu schlafen. Frauen sind übrigens häufiger betroffen als Männer. Wie viel Schlaf man braucht, ist sehr individuell. Für die meisten Erwachsenen sind es aber zwischen sieben und neun Stunden.'],
        ['M', 'Was sind denn die häufigsten Ursachen für schlechten Schlaf?'],
        ['E', 'An erster Stelle steht Stress, vor allem beruflicher Stress. Man liegt im Bett und denkt an die E-Mails, die man noch beantworten muss. Ein zweiter wichtiger Faktor sind Bildschirme. Das Licht von Handy und Laptop signalisiert dem Gehirn, dass es noch Tag ist. Interessanterweise spielt der Kaffee eine kleinere Rolle, als viele glauben – ausser man trinkt ihn am späten Nachmittag.'],
        ['M', 'Viele Menschen nehmen ja Schlaftabletten. Was halten Sie davon?'],
        ['E', 'Für kurze Zeit, etwa nach einem Todesfall in der Familie, können sie helfen. Auf Dauer lösen sie das Problem aber nicht, und man kann sich an sie gewöhnen. Wir empfehlen stattdessen zuerst eine Veränderung der Gewohnheiten. Das ist mühsamer, wirkt aber langfristig besser.'],
        ['M', 'Was für Gewohnheiten meinen Sie konkret?'],
        ['E', 'Das Wichtigste ist ein regelmässiger Rhythmus: Jeden Tag zur gleichen Zeit aufstehen, auch am Wochenende. Das Schlafzimmer sollte kühl und dunkel sein, und das Handy hat dort eigentlich nichts verloren. Und wer nach zwanzig Minuten noch wach liegt, sollte lieber aufstehen und etwas Ruhiges tun, zum Beispiel lesen, statt sich im Bett hin und her zu wälzen.'],
        ['M', 'Und was ist mit dem berühmten Mittagsschlaf?'],
        ['E', 'Ein kurzes Nickerchen von zehn bis zwanzig Minuten ist durchaus gesund und steigert die Konzentration am Nachmittag. Es sollte aber nicht länger dauern, sonst fällt man in den Tiefschlaf und ist danach eher müde. Und wer nachts schlecht schläft, sollte auf den Mittagsschlaf ganz verzichten.'],
        ['M', 'Eine letzte Frage: Hat sich unser Schlaf in den letzten Jahrzehnten verändert?'],
        ['E', 'Ja, im Durchschnitt schlafen wir heute etwa eine halbe Stunde weniger als unsere Grosseltern. Ob das gefährlich ist, wissen wir noch nicht genau. Sicher ist aber: Wer dauerhaft zu wenig schläft, hat ein höheres Risiko für Herz-Kreislauf-Erkrankungen. Schlaf ist also keine verlorene Zeit, sondern eine Investition in die Gesundheit.'],
        ['M', 'Frau Gerber, herzlichen Dank für diese Einblicke.']
      ],
      sections: [[0, 1], [2, 5], [6, 9], [10, 12]],
      items: [
        { s: 'Ungefähr ein Drittel der Befragten schläft regelmäßig schlecht.', a: true, sec: 1 },
        { s: 'Männer haben häufiger Schlafprobleme als Frauen.', a: false, sec: 1 },
        { s: 'Beruflicher Stress ist die häufigste Ursache für schlechten Schlaf.', a: true, sec: 2 },
        { s: 'Kaffee ist laut Frau Gerber ein besonders wichtiger Grund für Schlafprobleme.', a: false, sec: 2 },
        { s: 'Frau Gerber rät, Schlaftabletten über längere Zeit zu nehmen.', a: false, sec: 2 },
        { s: 'Man sollte auch am Wochenende zur gleichen Zeit aufstehen.', a: true, sec: 3 },
        { s: 'Wer nicht einschlafen kann, sollte im Bett liegen bleiben.', a: false, sec: 3 },
        { s: 'Ein kurzer Mittagsschlaf kann die Konzentration verbessern.', a: true, sec: 3 },
        { s: 'Heute schlafen die Menschen im Durchschnitt länger als früher.', a: false, sec: 4 },
        { s: 'Dauerhaft zu wenig Schlaf erhöht das Risiko für Herzkrankheiten.', a: true, sec: 4 }
      ]
    },
    a2: {
      title: 'Leihvelos in Zürich',
      situation: 'Sie hören ein Gespräch zwischen zwei Personen, die Informationen austauschen. Hören Sie gut zu und ergänzen Sie entweder die fehlenden Informationen oder kreuzen Sie die entsprechenden Kästchen an. Sie hören den Text ein Mal.',
      plays: 1,
      audio: 'osd-b2-2-h2.mp3',
      voices: { N: 'de-CH-LeniNeural', T: 'de-DE-ConradNeural' },
      speakers: { N: 'Nina', T: 'Tobias' },
      columns: ['StadtVelo', 'Pedal Plus', 'Rad & Tat'],
      rows: [
        { label: 'Art der Velos', type: 'check', options: ['normale Velos', 'E-Bikes'], answers: [[0], [0, 1], [1]] },
        { label: 'Jahresabo', type: 'text', unit: 'Franken', answers: [['80'], ['120'], ['200']] },
        { label: 'Ermäßigung für Studierende', type: 'text', unit: '%', answers: [['50'], ['25'], ['15']] },
        { label: 'erste Minuten gratis', type: 'text', unit: 'Minuten', answers: [['30', 'dreißig', 'dreissig'], ['15', 'fünfzehn'], ['0', 'keine', 'null']] },
        { label: 'Ausleihe über', type: 'check', options: ['App', 'Karte'], answers: [[0, 1], [0], [1]] },
        { label: 'Zubehör', type: 'check', options: ['Kindersitz', 'Helm'], answers: [[], [0, 1], [1]] },
        { label: 'Rückgabe', type: 'check', options: ['an jeder Station', 'überall in der Stadt', 'nur am Ausleihort'], answers: [[0], [1], [2]] },
        { label: 'Service', type: 'check', options: ['Pannenhilfe', 'Versicherung'], answers: [[1], [0, 1], [0]] },
        { label: 'maximale Mietdauer', type: 'text', unit: 'Stunden', answers: [['24', 'vierundzwanzig'], ['12', 'zwölf'], ['48', 'achtundvierzig']] },
        { label: 'Hotline erreichbar bis', type: 'text', unit: 'Uhr', answers: [['22', '22:00', '22.00', '10'], ['20', '20:00', '20.00', '8'], ['18', '18:00', '18.00', '6']] }
      ],
      script: [
        ['T', 'Hallo Nina! Du, ich will mein Auto verkaufen und in Zürich nur noch Velo fahren. Du kennst dich doch mit diesen Leihvelos aus, oder?'],
        ['N', 'Ja, ich hab alle drei Anbieter ausprobiert: StadtVelo, Pedal Plus und Rad und Tat. Was willst du wissen?'],
        ['T', 'Fangen wir mit StadtVelo an. Gibt es dort auch E-Bikes?'],
        ['N', 'Nein, nur normale Velos. Dafür ist es sehr günstig: Das Jahresabo kostet achtzig Franken, und Studierende zahlen nur die Hälfte, also fünfzig Prozent Rabatt. Die ersten dreissig Minuten jeder Fahrt sind gratis.'],
        ['T', 'Das ist ja super. Wie leiht man die Velos aus?'],
        ['N', 'Entweder mit der App oder mit einer Karte, wie du willst. Zubehör gibt es allerdings keins, weder Kindersitz noch Helm. Und zurückgeben musst du das Velo an einer Station, aber es ist egal, an welcher.'],
        ['T', 'Was ist, wenn ich eine Panne habe?'],
        ['N', 'Pannenhilfe gibt es bei StadtVelo nicht, aber eine Versicherung ist im Abo inbegriffen. Du darfst ein Velo höchstens vierundzwanzig Stunden behalten, und die Hotline ist bis zweiundzwanzig Uhr erreichbar.'],
        ['T', 'Okay. Und Pedal Plus?'],
        ['N', 'Pedal Plus hat beides, normale Velos und E-Bikes. Das Jahresabo kostet hundertzwanzig Franken, Studierende bekommen fünfundzwanzig Prozent Ermässigung. Gratis sind dort nur die ersten fünfzehn Minuten. Ausleihen kannst du nur über die App, Karten gibt es keine.'],
        ['T', 'Und Zubehör?'],
        ['N', 'Da sind sie top: Du kannst sowohl einen Kindersitz als auch einen Helm dazu buchen. Und das Beste: Du kannst das Velo überall in der Stadt abstellen, du brauchst keine Station. Pannenhilfe und Versicherung sind beide dabei.'],
        ['T', 'Wie lange darf man ein Velo behalten?'],
        ['N', 'Maximal zwölf Stunden. Und die Hotline ist bis zwanzig Uhr besetzt.'],
        ['T', 'Und der dritte, Rad und Tat?'],
        ['N', 'Rad und Tat ist eher etwas für längere Ausflüge. Die haben nur E-Bikes. Das Jahresabo ist mit zweihundert Franken am teuersten, Studierende zahlen fünfzehn Prozent weniger. Gratisminuten gibt es keine, du zahlst ab der ersten Minute.'],
        ['T', 'Hm, das ist ein Nachteil. App oder Karte?'],
        ['N', 'Nur mit Karte, eine App haben sie noch nicht. Einen Helm bekommst du dort, aber keinen Kindersitz. Und du musst das Velo wieder genau dort zurückgeben, wo du es geholt hast.'],
        ['T', 'Gibt es eine Versicherung?'],
        ['N', 'Nein, nur Pannenhilfe. Dafür kannst du das Velo bis zu achtundvierzig Stunden mieten, also für ein ganzes Wochenende. Die Hotline erreichst du aber nur bis achtzehn Uhr.'],
        ['T', 'Danke, Nina! Ich glaube, für den Alltag nehme ich StadtVelo.']
      ]
    }
  },
  schreiben: {
    a1: {
      situation: 'Sie haben vor zwei Monaten einen Vertrag mit einem Fitnessstudio in Innsbruck abgeschlossen (siehe Inserat). Leider entspricht das Angebot nicht dem, was in der Werbung versprochen wurde. Sie haben sich bereits Notizen dazu gemacht.',
      task: 'Schreiben Sie nun ein Beschwerde-E-Mail an das Fitnessstudio, in dem Sie auf alle Ihre Notizen eingehen. Übernehmen Sie die Vorgaben nicht wortwörtlich, sondern verwenden Sie eigene, situationsangemessene Formulierungen. Schreiben Sie circa 120 Wörter und beachten Sie dabei auch die formalen Kriterien dieser Textsorte (Anrede, Grußformel).',
      ad: { title: 'FITWERK INNSBRUCK', lines: ['Ihr Fitnessstudio im Zentrum', 'täglich geöffnet von 6 bis 23 Uhr', 'moderne Geräte & über 40 Kurse pro Woche', 'persönlicher Trainingsplan inklusive', 'Sauna für alle Mitglieder', 'nur 39 Euro im Monat – jederzeit kündbar'], contact: 'service@fitwerk-innsbruck.at · z. H. Frau Haller' },
      notes: ['seit 3 Wochen Sauna geschlossen', 'Trainingsplan: 25 Euro extra!', 'Kurse oft überfüllt / abgesagt', 'Kündigung erst nach 12 Monaten?'],
      to: 'service@fitwerk-innsbruck.at',
      subject: 'Beschwerde über Ihr Angebot',
      model: `Sehr geehrte Frau Haller,

vor zwei Monaten bin ich Mitglied in Ihrem Fitnessstudio geworden. Leider muss ich mich heute über mehrere Punkte beschweren.

Zunächst ist die Sauna, die laut Ihrer Werbung allen Mitgliedern zur Verfügung steht, bereits seit drei Wochen geschlossen. Außerdem haben Sie mir für den angeblich kostenlosen Trainingsplan 25 Euro verrechnet. Auch mit den Kursen bin ich unzufrieden: Sie sind häufig so voll, dass man keinen Platz bekommt, und manche werden kurzfristig abgesagt. Besonders geärgert hat mich, dass ich erst nach zwölf Monaten kündigen darf, obwohl im Inserat „jederzeit kündbar“ steht.

Ich fordere Sie daher auf, mir die 25 Euro zurückzuzahlen und mir eine sofortige Kündigung zu ermöglichen. Ich erwarte Ihre Antwort innerhalb einer Woche.

Mit freundlichen Grüßen
Mina Rahimi`
    },
    a2: {
      intro: 'Wählen Sie eine der folgenden Aufgabenstellungen (A oder B). Schreiben Sie circa 120 Wörter.',
      variants: {
        A: {
          lead: 'Sie haben im Deutschkurs über das Thema „Soziale Medien“ diskutiert. Dabei fielen folgende Äußerungen:',
          quotes: ['Ohne soziale Medien hätte ich den Kontakt zu vielen Freunden im Ausland längst verloren.', 'Auf Instagram zeigen alle nur ihr perfektes Leben. Das macht viele junge Leute unglücklich.', 'Wer seine Daten im Internet veröffentlicht, darf sich nicht wundern, wenn sie missbraucht werden.'],
          points: ['Wie denken Sie über diese Äußerungen?', 'Begründen Sie Ihre persönliche Meinung.', 'Beschreiben Sie eigene Erfahrungen (oder Erfahrungen von Freunden) zum Thema.', 'Wie ist die Situation in Ihrem Land?'],
          model: `Die drei Äußerungen zeigen sehr gut, dass soziale Medien zwei Seiten haben.

Ich stimme der ersten Aussage voll zu: Seit ich in Österreich lebe, halte ich über soziale Netzwerke Kontakt zu meiner Familie und zu Freunden in der Heimat. Gleichzeitig glaube ich, dass die perfekten Bilder auf Instagram vor allem Jugendlichen schaden können, weil sie sich ständig mit anderen vergleichen. Deshalb finde ich es wichtig, schon in der Schule über diese Gefahren zu sprechen.

Eine Freundin von mir hat ihr Instagram-Konto vor einem Jahr gelöscht. Sie erzählt, dass sie seitdem zufriedener ist und mehr Zeit für Hobbys hat.

In meinem Land nutzen fast alle jungen Menschen soziale Medien, oft mehrere Stunden am Tag. Über Datenschutz wird jedoch kaum diskutiert.`
        },
        B: {
          lead: 'Sie haben in verschiedenen Zeitungen folgende Schlagzeilen zum Thema „Reisen“ gelesen:',
          quotes: ['Fliegen mit schlechtem Gewissen: Immer mehr Menschen verzichten auf Flugreisen', 'Overtourism: Venedig und Hallstatt wehren sich gegen Touristenmassen', 'Urlaub zu Hause: Die Nachbarregion neu entdecken'],
          points: ['Wie denken Sie über diese Schlagzeilen?', 'Begründen Sie Ihre persönliche Meinung.', 'Beschreiben Sie eigene Erfahrungen (oder Erfahrungen von Freunden) zum Thema.', 'Wie ist die Situation in Ihrem Land?'],
          model: ''
        }
      }
    }
  },
  sprechen: {
    a1: {
      title: 'Jemanden kennenlernen und beraten',
      minutes: 5,
      situation: 'Sie sind auf der Geburtstagsfeier einer Freundin und lernen dort eine Person kennen.',
      points: ['Sprechen Sie darüber, woher Sie die Gastgeberin kennen und was Sie beruflich machen. Unterhalten Sie sich dann über das Thema „Reisen“.', 'Tauschen Sie Ihre Erfahrungen und Ansichten aus (Wohin reisen Sie gern? Wie reisen Sie? Was ist Ihnen im Urlaub wichtig?) und geben Sie sich gegenseitig Tipps.'],
      partner: ['Woher kennen Sie eigentlich Laura?', 'Waren Sie heuer schon auf Urlaub?', 'Ich möchte im Sommer verreisen, aber nicht zu viel ausgeben. Haben Sie einen Tipp für mich?']
    },
    a2: {
      title: 'Ein Bild/Foto beschreiben und interpretieren',
      minutes: 5,
      situation: 'Wählen Sie eines der drei Bilder aus und • begründen Sie, warum Sie sich für dieses Bild entschieden haben, • beschreiben Sie das Bild und • gehen Sie dann auf das Thema des Bildes ein: Was ist das Thema? Was sagt das Bild aus? Äußern Sie Ihre Meinung und stellen Sie Vermutungen an.',
      images: [
        { src: 'img/osd-b2-2-bild1.jpg', alt: 'Reisende in einem Nachtzug-Abteil mit Liegen', theme: 'Reisen mit dem Nachtzug', prompt: 'documentary photo, young couple sitting in a small night train couchette compartment with bunk beds, looking out of the window at dusk landscape, backpacks, cosy light, candid' },
        { src: 'img/osd-b2-2-bild2.jpg', alt: 'Nachbarinnen und Nachbarn arbeiten gemeinsam in einem Gemeinschaftsgarten', theme: 'Gemeinschaftsgärten in der Stadt', prompt: 'documentary photo, neighbours of different ages working together in an urban community garden between apartment buildings, raised vegetable beds, watering cans, sunny afternoon, candid' },
        { src: 'img/osd-b2-2-bild3.jpg', alt: 'Junge Frau schaut nachts im Bett auf ihr Handy', theme: 'Schlaf und Smartphone', prompt: 'documentary photo, young woman lying in bed at night looking at her bright smartphone screen, alarm clock showing late time on bedside table, dark bedroom, blue light on face' }
      ]
    },
    a3: {
      title: 'Meinungsaustausch',
      minutes: 5,
      topic: 'Arbeiten: Vollzeit oder Teilzeit',
      situation: 'Sie und Ihre Gesprächspartnerin/Ihr Gesprächspartner haben folgende Stellungnahmen zum Thema „Arbeitszeit“ gelesen und sollen nun darüber diskutieren. Versetzen Sie sich in die Rolle einer Person und vertreten Sie deren Standpunkt. Bringen Sie weitere Aspekte und Argumente in das Gespräch ein.',
      roles: [
        { name: 'Sabine, 38', text: '„Seit der Geburt meiner Tochter arbeite ich nur noch dreißig Stunden pro Woche, und ich möchte nie wieder zurück zur Vollzeit. Ich habe endlich Zeit für meine Familie, für Sport und für Freundschaften. Natürlich verdiene ich weniger, aber ich brauche auch weniger: Ich bin entspannter, gebe weniger Geld für Essen unterwegs aus und bin seltener krank. Ich finde, die Arbeit sollte nicht das ganze Leben bestimmen.“' },
        { name: 'Markus, 45', text: '„Teilzeit klingt schön, aber man sollte die Folgen bedenken. Wer jahrelang weniger arbeitet, bekommt später eine viel kleinere Pension. Gerade Frauen sind deshalb im Alter oft arm. Außerdem hat man in Teilzeit seltener die Chance, in eine Führungsposition aufzusteigen. Und wenn alle weniger arbeiten, fehlen den Firmen Fachkräfte. Ich arbeite gern Vollzeit, weil ich mir so eine sichere Zukunft für meine Familie aufbauen kann.“' }
      ]
    }
  }
}
];
