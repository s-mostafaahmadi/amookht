/* Original TestDaF-style practice content for the Amookht simulation. */
const AMOOKHT_TESTDAF_SIM_DATA=(()=>{
  let mcIndex=0;
  const mc=(q,a,b,c)=>{
    const slot=mcIndex++%3;
    return slot===0?{type:'mc',q,options:[a,b,c],answer:0}:slot===1?{type:'mc',q,options:[b,a,c],answer:1}:{type:'mc',q,options:[b,c,a],answer:2};
  };
  const gap=(q,a)=>({type:'gap',q,answer:a});
  const summary=(q,a)=>({type:'summary',q,answer:a});
  const reading=(title,time,text,rows)=>({title,time,text,questions:rows.map(r=>mc(...r))});

  const lesen={texts:[
    reading('Text 1 · Digitale Studienberatung',14,`An vielen deutschen Hochschulen wird die Studienberatung neu organisiert. Neben persönlichen Sprechstunden gibt es inzwischen Videotermine, Chats und Portale, über die Studierende Unterlagen hochladen können. Eine Untersuchung an vier Universitäten zeigt, dass einfache organisatorische Fragen dadurch schneller beantwortet werden. Besonders Studierende mit Nebenjob oder langem Anfahrtsweg nutzen digitale Angebote häufig.

Die Untersuchung macht jedoch auch Grenzen sichtbar. Bei komplexen Problemen, etwa einem drohenden Studienabbruch oder psychischer Belastung, reicht ein standardisiertes Online-Formular selten aus. Beratende erkennen Unsicherheit und widersprüchliche Angaben in einem persönlichen Gespräch häufig früher. Deshalb empfehlen die Forschenden ein gestuftes Modell: Allgemeine Informationen sollen jederzeit digital verfügbar sein, während individuelle Fälle an feste Ansprechpersonen weitergeleitet werden.

Entscheidend ist außerdem der Datenschutz. Die Hochschulen müssen erklären, welche Angaben gespeichert werden, wer darauf zugreifen darf und wann Daten gelöscht werden. Ein Portal gilt nicht schon deshalb als erfolgreich, weil es technisch funktioniert. Es muss barrierearm, mehrsprachig und auch auf kleinen Bildschirmen gut nutzbar sein. Ergänzend sollen Schulungen dafür sorgen, dass Mitarbeitende digitale und persönliche Beratung sinnvoll miteinander verbinden.

Die Autorinnen der Studie kommen zu dem Ergebnis, dass digitale Beratung persönliche Gespräche nicht ersetzt. Ihr größter Vorteil liegt vielmehr darin, den ersten Zugang zu erleichtern und Routinefragen zu bündeln. So bleibt mehr Zeit für Fälle, in denen ausführliche Unterstützung tatsächlich notwendig ist.`,[
      ['Was wurde an vier Universitäten untersucht?','Die Neuorganisation der Studienberatung','Die Finanzierung neuer Mensen','Die Dauer von Vorlesungen'],
      ['Wer nutzt digitale Beratung besonders häufig?','Studierende mit Nebenjob oder langem Anfahrtsweg','Nur Professorinnen und Professoren','Ausschließlich internationale Gäste'],
      ['Wofür eignen sich digitale Angebote laut Studie besonders?','Für einfache organisatorische Fragen','Für medizinische Diagnosen','Für die Benotung von Prüfungen'],
      ['Wann reicht ein Online-Formular häufig nicht aus?','Bei komplexen persönlichen Problemen','Bei der Suche nach Öffnungszeiten','Beim Herunterladen eines Stundenplans'],
      ['Was empfehlen die Forschenden?','Ein gestuftes Beratungsmodell','Die Abschaffung persönlicher Beratung','Nur telefonische Sprechstunden'],
      ['Welche Information gehört zum Datenschutz?','Wann gespeicherte Daten gelöscht werden','Welche Noten andere Studierende haben','Wie hoch die Miete der Beratenden ist'],
      ['Wann gilt ein Portal als gut nutzbar?','Wenn es barrierearm, mehrsprachig und mobil geeignet ist','Wenn es möglichst viele Unterseiten hat','Wenn es nur auf Hochschulcomputern läuft'],
      ['Welche Hauptaussage formuliert der Text?','Digitale und persönliche Beratung sollen sich ergänzen','Digitale Beratung löst jedes Studienproblem','Persönliche Gespräche sind grundsätzlich ineffizient']
    ]),
    reading('Text 2 · Nachhaltige Mobilität am Campus',15,`Der tägliche Weg zur Hochschule verursacht einen erheblichen Teil der verkehrsbedingten Emissionen von Universitäten. Eine Arbeitsgruppe aus Verkehrsplanung und Sozialwissenschaft hat deshalb das Mobilitätsverhalten von rund 8.000 Hochschulangehörigen ausgewertet. Demnach kommen 38 Prozent mit öffentlichen Verkehrsmitteln, 27 Prozent mit dem Fahrrad, 22 Prozent mit dem Auto und der Rest zu Fuß oder mit anderen Verkehrsmitteln.

Die Zahlen unterscheiden sich stark nach Wohnort. In innerstädtischen Gebieten sind Bahn und Fahrrad attraktiv, während Studierende aus ländlichen Regionen häufiger auf ein Auto angewiesen sind. Ein pauschales Verbot von Parkplätzen würde diese Gruppe besonders belasten. Die Forschenden schlagen daher vor, zunächst Alternativen auszubauen: häufigere Busverbindungen, sichere Fahrradwege, überdachte Abstellplätze und abgestimmte Fahrpläne.

Auch finanzielle Anreize spielen eine Rolle. Ein günstiges Semesterticket erhöht die Nutzung öffentlicher Verkehrsmittel, wirkt aber nur, wenn Verbindungen zuverlässig sind. Für Wege, die nicht vollständig mit Bus und Bahn möglich sind, werden Mobilitätsstationen empfohlen. Dort lassen sich Leihräder, Carsharing und öffentliche Verkehrsmittel kombinieren.

Mehrere Hochschulen testen außerdem ein Mobilitätsbudget. Beschäftigte erhalten dabei einen festen Betrag, den sie flexibel für klimafreundliche Verkehrsmittel verwenden können. Erste Ergebnisse zeigen weniger allein gefahrene Autokilometer. Allerdings ist noch offen, ob dieser Effekt langfristig anhält.

Die Arbeitsgruppe warnt davor, den Erfolg nur an der Zahl abgeschaffter Parkplätze zu messen. Wichtiger seien Erreichbarkeit, Reisezeit, Kosten und soziale Fairness. Eine nachhaltige Strategie müsse regelmäßig überprüft und an regionale Bedingungen angepasst werden.`,[
      ['Wie viele Hochschulangehörige wurden untersucht?','Rund 8.000','Rund 800','Rund 80.000'],
      ['Welches Verkehrsmittel wird am häufigsten genutzt?','Öffentliche Verkehrsmittel','Das Auto','Das Fahrrad'],
      ['Wie hoch ist der Anteil der Fahrradnutzung?','27 Prozent','22 Prozent','38 Prozent'],
      ['Warum nutzen Menschen aus ländlichen Regionen häufiger das Auto?','Weil Alternativen oft fehlen','Weil Semestertickets verboten sind','Weil Fahrräder am Campus nicht erlaubt sind'],
      ['Was soll vor einer Reduzierung von Parkplätzen geschehen?','Alternativen sollen ausgebaut werden','Alle Fahrpläne sollen abgeschafft werden','Studierende sollen näher an den Campus ziehen'],
      ['Wann wirkt ein günstiges Semesterticket besonders?','Bei zuverlässigen Verbindungen','Nur bei kostenlosen Parkplätzen','Wenn Busse seltener fahren'],
      ['Was kann an Mobilitätsstationen kombiniert werden?','Leihräder, Carsharing und öffentlicher Verkehr','Flugzeuge und Fernbusse','Nur private Autos'],
      ['Was ist ein Mobilitätsbudget?','Ein flexibler Betrag für klimafreundliche Wege','Eine Steuer auf Fahrräder','Ein Kredit für den Autokauf'],
      ['Welche Wirkung zeigen erste Tests?','Weniger allein gefahrene Autokilometer','Längere Reisezeiten für alle','Mehr Parkplätze am Campus'],
      ['Woran soll Erfolg hauptsächlich gemessen werden?','An Erreichbarkeit, Reisezeit, Kosten und Fairness','Nur an abgeschafften Parkplätzen','Nur an verkauften Fahrrädern']
    ]),
    reading('Text 3 · Künstliche Intelligenz in der Hochschullehre',15,`Generative künstliche Intelligenz kann Texte zusammenfassen, Programmcode erklären und Vorschläge für Lernpläne erstellen. Seit solche Systeme leicht zugänglich sind, diskutieren Hochschulen darüber, wie sie in Lehrveranstaltungen eingesetzt werden sollen. Ein vollständiges Verbot erscheint vielen Fachleuten unrealistisch, weil Studierende die Werkzeuge auch außerhalb der Hochschule nutzen.

In einem Modellprojekt durften Studierende KI-Systeme für eine Seminararbeit verwenden, mussten ihre Nutzung jedoch dokumentieren. Sie sollten angeben, welche Fragen sie gestellt, welche Antworten sie übernommen und wie sie Aussagen überprüft hatten. Die Lehrenden bewerteten nicht nur das Endprodukt, sondern auch die Begründung der Arbeitsschritte. Dadurch wurde sichtbar, dass überzeugend formulierte KI-Antworten sachlich falsch oder unvollständig sein können.

Das Projekt zeigte außerdem große Unterschiede bei den digitalen Kompetenzen. Einige Studierende konnten Ergebnisse kritisch vergleichen, andere vertrauten der ersten Antwort. Deshalb fordern die Forschenden, Quellenprüfung und den Umgang mit Unsicherheit ausdrücklich zu lehren. Ebenso wichtig sei der Datenschutz: Vertrauliche Forschungsdaten oder personenbezogene Informationen dürften nicht ungeprüft in externe Systeme eingegeben werden.

Kritiker befürchten, dass grundlegende Fähigkeiten verloren gehen, wenn Lernende zu früh auf automatische Hilfen zurückgreifen. Die Projektleitung schlägt deshalb Aufgaben vor, bei denen bestimmte Phasen ohne KI bearbeitet werden. Später können die eigenen Ergebnisse mit maschinellen Vorschlägen verglichen werden.

Die Studie kommt nicht zu dem Schluss, dass KI Lernen automatisch verbessert. Entscheidend sind klare Lernziele, transparente Regeln und Aufgaben, die eigenständiges Denken sichtbar machen. Prüfungen müssten daher weniger die bloße Produktion eines Textes und stärker den nachvollziehbaren Arbeitsprozess bewerten.`,[
      ['Warum gilt ein vollständiges KI-Verbot als unrealistisch?','Weil die Werkzeuge außerhalb der Hochschule verfügbar sind','Weil jede KI-Antwort korrekt ist','Weil Hochschulen keine Prüfungen mehr anbieten'],
      ['Was mussten Teilnehmende des Modellprojekts dokumentieren?','Ihre Nutzung der KI-Systeme','Ihre privaten Passwörter','Nur die Länge ihrer Seminararbeit'],
      ['Was wurde neben dem Endprodukt bewertet?','Die Begründung der Arbeitsschritte','Die Zahl installierter Programme','Die Geschwindigkeit beim Tippen'],
      ['Welche Schwäche von KI-Antworten wurde sichtbar?','Sie können überzeugend klingen und trotzdem falsch sein','Sie enthalten grundsätzlich keine vollständigen Sätze','Sie sind immer zu kurz'],
      ['Welche Unterschiede beobachtete das Projekt?','Unterschiede bei digitalen Kompetenzen','Unterschiede bei Semestergebühren','Unterschiede bei Bibliotheksöffnungszeiten'],
      ['Was soll ausdrücklich gelehrt werden?','Quellenprüfung und Umgang mit Unsicherheit','Nur schnelleres Schreiben','Das Auswendiglernen von KI-Antworten'],
      ['Welche Daten sollen nicht ungeprüft eingegeben werden?','Vertrauliche und personenbezogene Daten','Öffentliche Wetterdaten','Bereits veröffentlichte Buchtitel'],
      ['Warum sollen einzelne Arbeitsphasen ohne KI stattfinden?','Damit grundlegende Fähigkeiten erhalten bleiben','Damit weniger Lehrende benötigt werden','Damit Texte automatisch länger werden'],
      ['Was verbessert Lernen laut Studie nicht automatisch?','Der bloße Einsatz künstlicher Intelligenz','Klare Lernziele','Transparente Regeln'],
      ['Worauf sollen Prüfungen künftig stärker achten?','Auf den nachvollziehbaren Arbeitsprozess','Nur auf die Textlänge','Nur auf die verwendete Software']
    ]),
    reading('Text 4 · Offene Wissenschaft und Forschungskommunikation',16,`Wissenschaftliche Ergebnisse werden traditionell in Fachzeitschriften veröffentlicht, die sich vor allem an ein spezialisiertes Publikum richten. Inzwischen erwarten Forschungsförderer und Öffentlichkeit häufiger, dass Erkenntnisse frei zugänglich und verständlich erklärt werden. Unter dem Begriff Open Science werden verschiedene Ansätze zusammengefasst: offene Publikationen, zugängliche Forschungsdaten, transparente Methoden und die Beteiligung gesellschaftlicher Gruppen.

Befürworter argumentieren, dass offene Daten die Überprüfung von Ergebnissen erleichtern. Andere Forschende können Analysen nachvollziehen, Fehler entdecken oder vorhandene Datensätze für neue Fragen nutzen. Dadurch lässt sich doppelte Arbeit vermeiden. Offenheit ist jedoch nicht grenzenlos möglich. Medizinische, persönliche oder sicherheitsrelevante Daten müssen geschützt oder so anonymisiert werden, dass einzelne Personen nicht identifizierbar sind.

Auch die verständliche Kommunikation von Forschung ist anspruchsvoll. Kurze Videos und Podcasts erreichen zwar ein größeres Publikum, können aber komplexe Zusammenhänge zu stark vereinfachen. Wissenschaftlerinnen und Wissenschaftler müssen daher zentrale Aussagen erklären, ohne Unsicherheiten und methodische Grenzen zu verschweigen. Kommunikationsabteilungen können sie unterstützen, dürfen Ergebnisse aber nicht wie Werbung darstellen.

Ein weiteres Modell ist Citizen Science. Dabei wirken Bürgerinnen und Bürger an Forschungsprojekten mit, indem sie beispielsweise Tierarten beobachten, Luftqualität messen oder historische Dokumente erfassen. Solche Projekte sammeln große Datenmengen und stärken den Austausch zwischen Wissenschaft und Gesellschaft. Die Qualität hängt allerdings von klaren Anleitungen, geeigneten Messverfahren und einer sorgfältigen Prüfung ab.

Für Forschende entsteht zusätzlicher Aufwand. Daten müssen dokumentiert, Formate vereinheitlicht und Nutzungsrechte geklärt werden. Viele Hochschulen bauen deshalb Beratungsstellen und Repositorien auf. Dort werden Datensätze langfristig gespeichert und mit Informationen zu Entstehung, Methode und Lizenz versehen.

Open Science bedeutet somit nicht, jede Information sofort zu veröffentlichen. Vielmehr geht es um eine begründete Balance zwischen Zugänglichkeit, Qualität, Datenschutz und Verantwortung. Damit offene Wissenschaft dauerhaft funktioniert, müssen diese Aufgaben bei Finanzierung und Karrierebewertung als wissenschaftliche Leistungen anerkannt werden.`,[
      ['An wen richten sich traditionelle Fachzeitschriften hauptsächlich?','An ein spezialisiertes Publikum','Nur an Schülerinnen und Schüler','Ausschließlich an Unternehmen'],
      ['Was gehört zu Open Science?','Offene Publikationen und transparente Methoden','Geheime Datensammlungen','Werbung für einzelne Universitäten'],
      ['Welchen Vorteil haben offene Forschungsdaten?','Ergebnisse können leichter überprüft werden','Forschung benötigt keine Methoden mehr','Alle Daten werden automatisch korrekt'],
      ['Wie lässt sich doppelte Arbeit vermeiden?','Durch die erneute Nutzung vorhandener Datensätze','Durch das Löschen älterer Studien','Durch weniger internationale Zusammenarbeit'],
      ['Warum ist Offenheit begrenzt?','Bestimmte Daten müssen geschützt werden','Fachzeitschriften verbieten jede Veröffentlichung','Podcasts sind technisch nicht möglich'],
      ['Welche Gefahr besteht bei kurzen Medienformaten?','Komplexe Zusammenhänge werden zu stark vereinfacht','Sie erreichen grundsätzlich kein Publikum','Sie enthalten immer personenbezogene Daten'],
      ['Was dürfen Kommunikationsabteilungen nicht tun?','Forschungsergebnisse wie Werbung darstellen','Forschende sprachlich unterstützen','Methodische Grenzen erwähnen'],
      ['Was ist Citizen Science?','Die Beteiligung von Bürgern an Forschungsprojekten','Eine Prüfung nur für Wissenschaftler','Ein geschlossenes Forschungsarchiv'],
      ['Wovon hängt die Qualität bei Citizen Science ab?','Von Anleitung, Messverfahren und Prüfung','Nur von der Zahl der Teilnehmenden','Nur von teuren Geräten'],
      ['Warum entsteht Forschenden zusätzlicher Aufwand?','Daten müssen dokumentiert und Rechte geklärt werden','Weil keine Daten gespeichert werden dürfen','Weil Ergebnisse nur handschriftlich vorliegen'],
      ['Welche Funktion haben Repositorien?','Sie speichern Datensätze langfristig mit Zusatzinformationen','Sie ersetzen alle Bibliotheken','Sie bewerten Studiengebühren'],
      ['Welche Balance fordert der Text?','Zugänglichkeit, Qualität, Datenschutz und Verantwortung','Geschwindigkeit, Werbung und Gewinn','Prüfungen, Noten und Anwesenheit']
    ])
  ]};

  const hoeren={texts:[
    {title:'Audio 1 · Studentisches Gespräch',kind:'Gespräch',time:8,text:`Mira: Hallo Jonas, hast du schon eine Lerngruppe für Statistik gefunden? Jonas: Noch nicht. Die Gruppe am Dienstag ist voll, und mittwochs arbeite ich bis sechzehn Uhr. Mira: Im Lernzentrum startet am Donnerstag um siebzehn Uhr eine neue Gruppe. Man muss sich bis morgen Mittag online anmelden. Jonas: Das könnte passen. Findet sie jede Woche statt? Mira: Ja, zunächst sechs Wochen lang. In den ersten beiden Terminen ist auch eine Tutorin dabei. Danach arbeitet die Gruppe selbstständig. Jonas: Was kostet die Teilnahme? Mira: Nichts. Du musst nur das Statistikbuch und einen Laptop mitbringen. Jonas: Gut. Ich habe allerdings nächste Woche ein Laborpraktikum. Mira: Einmal fehlen ist möglich. Schreib der Tutorin vorher eine Nachricht. Ich schicke dir gleich den Link zur Anmeldung.`,questions:[
      mc('Warum kann Jonas dienstags nicht teilnehmen?','Die Gruppe ist bereits voll','Er hat eine Prüfung','Er arbeitet den ganzen Tag'),
      mc('Wann beginnt die neue Lerngruppe?','Donnerstag um 17 Uhr','Mittwoch um 16 Uhr','Freitag um 12 Uhr'),
      mc('Wie lange läuft die Gruppe zunächst?','Sechs Wochen','Zwei Wochen','Ein ganzes Semester'),
      mc('Wer begleitet die ersten beiden Termine?','Eine Tutorin','Ein Professor','Eine Bibliothekarin'),
      gap('Die Anmeldung muss bis morgen ___ erfolgen.','Mittag'),
      gap('Jonas soll das Statistikbuch und einen ___ mitbringen.','Laptop'),
      gap('Wenn Jonas fehlt, soll er vorher eine ___ schreiben.','Nachricht'),
      summary('Fassen Sie in einem Satz zusammen, was Mira Jonas empfiehlt.','Mira empfiehlt Jonas, sich für die neue Lerngruppe am Donnerstag anzumelden.')
    ]},
    {title:'Audio 2 · Universitätsinformation',kind:'اطلاعیه دانشگاه',time:9,text:`Achtung, eine Information der Universitätsbibliothek. Wegen einer technischen Wartung bleibt das Hauptgebäude am kommenden Samstag geschlossen. Die Zweigbibliothek Naturwissenschaften ist von neun bis achtzehn Uhr geöffnet. Bereits ausgeliehene Medien, deren Rückgabefrist am Samstag endet, können ohne zusätzliche Gebühren bis Montag zurückgegeben werden. Die digitalen Angebote, Datenbanken und E-Books stehen während der Wartung weiterhin zur Verfügung. Arbeitsplätze in der Zweigbibliothek müssen über das Campusportal reserviert werden. Reservierungen sind ab Donnerstag, zehn Uhr, möglich und gelten jeweils für maximal vier Stunden. Bücher aus dem Hauptgebäude können bis Freitag, zwölf Uhr, bestellt und am Informationsschalter der Zweigbibliothek abgeholt werden. Bei Fragen nutzen Sie bitte den Chat der Bibliothek. Die telefonische Auskunft ist am Wochenende nicht besetzt.`,questions:[
      mc('Warum bleibt das Hauptgebäude geschlossen?','Wegen technischer Wartung','Wegen einer Feiertagsregelung','Wegen Personalmangels'),
      mc('Welche Bibliothek ist am Samstag geöffnet?','Die Zweigbibliothek Naturwissenschaften','Nur das Hauptgebäude','Keine Bibliothek'),
      mc('Was bleibt weiterhin verfügbar?','Datenbanken und E-Books','Die telefonische Auskunft','Alle Lesesäle im Hauptgebäude'),
      gap('Die Zweigbibliothek ist bis ___ Uhr geöffnet.','18'),
      gap('Medien mit Samstagsfrist dürfen bis ___ zurückgegeben werden.','Montag'),
      gap('Ein Arbeitsplatz kann maximal ___ Stunden reserviert werden.','vier'),
      gap('Bücher müssen bis Freitag um ___ Uhr bestellt werden.','12'),
      summary('Fassen Sie die wichtigsten Alternativen während der Schließung zusammen.','Die Zweigbibliothek und digitale Angebote bleiben nutzbar; Bücher können vorbestellt und dort abgeholt werden.')
    ]},
    {title:'Audio 3 · Wissenschaftliches Interview',kind:'مصاحبه',time:10,text:`Moderator: Frau Professor Weber, Sie untersuchen den Einfluss von Nebenjobs auf den Studienerfolg. Was zeigt Ihre aktuelle Studie? Weber: Ein Nebenjob ist nicht grundsätzlich problematisch. Entscheidend sind Umfang, Arbeitszeiten und fachlicher Bezug. Bis etwa zwölf Arbeitsstunden pro Woche fanden wir keine deutlichen Nachteile. Bei mehr als zwanzig Stunden stieg dagegen das Risiko, Prüfungen zu verschieben. Moderator: Gibt es auch positive Wirkungen? Weber: Ja. Fachnahe Tätigkeiten können praktische Erfahrung, Kontakte und Motivation fördern. Problematisch sind unregelmäßige Nachtschichten, weil sie die Teilnahme an Lehrveranstaltungen und die Erholung beeinträchtigen. Moderator: Welche Studierenden arbeiten besonders viel? Weber: Häufig diejenigen, die keine ausreichende finanzielle Unterstützung erhalten. Deshalb darf man Zeitprobleme nicht nur als mangelnde Organisation betrachten. Moderator: Was können Hochschulen tun? Weber: Sie können Stundenpläne verlässlicher gestalten, flexible Beratung anbieten und über Stipendien informieren. Arbeitgeber sollten Prüfungsphasen berücksichtigen. Moderator: Planen Sie weitere Forschung? Weber: Wir möchten dieselben Studierenden drei Jahre begleiten. So können wir besser unterscheiden, ob der Nebenjob Ursache einer Verzögerung ist oder ob andere Belastungen gleichzeitig wirken.`,questions:[
      mc('Wovon hängt die Wirkung eines Nebenjobs hauptsächlich ab?','Von Umfang, Arbeitszeiten und fachlichem Bezug','Nur vom Studienfach','Nur vom Alter'),
      mc('Bis zu welchem Umfang gab es keine deutlichen Nachteile?','Etwa zwölf Stunden pro Woche','Etwa zwanzig Stunden pro Tag','Zwei Stunden pro Monat'),
      mc('Wann stieg das Risiko für verschobene Prüfungen?','Bei mehr als zwanzig Wochenstunden','Bei genau zwölf Wochenstunden','Ohne Nebenjob'),
      mc('Welchen Vorteil können fachnahe Tätigkeiten haben?','Sie fördern Erfahrung und Kontakte','Sie ersetzen alle Prüfungen','Sie verkürzen jedes Studium automatisch'),
      gap('Unregelmäßige ___ beeinträchtigen Teilnahme und Erholung.','Nachtschichten'),
      gap('Zeitprobleme sind nicht nur mangelnde ___.','Organisation'),
      gap('Hochschulen sollen auch über ___ informieren.','Stipendien'),
      gap('Die Forschenden wollen Studierende ___ Jahre begleiten.','drei'),
      summary('Was ist die zentrale Aussage des Interviews?','Moderate, planbare und fachnahe Nebenjobs können nützen; sehr lange oder ungünstige Arbeitszeiten gefährden den Studienerfolg.')
    ]},
    {title:'Audio 4 · Wissenschaftlicher Vortrag',kind:'سخنرانی علمی',time:13,text:`Guten Tag. In meinem Vortrag geht es um städtische Hitzeinseln. Städte sind im Sommer häufig deutlich wärmer als ihr Umland. Dunkle Oberflächen nehmen Sonnenenergie auf, dicht bebaute Gebiete speichern Wärme, und geringe Luftbewegung verhindert die Abkühlung. Besonders nachts kann der Temperaturunterschied mehrere Grad betragen. Das belastet ältere Menschen, kleine Kinder und Personen mit Herz-Kreislauf-Erkrankungen. Unsere Forschungsgruppe hat Temperaturdaten aus drei Stadtteilen mit unterschiedlicher Bebauung verglichen. Der dichteste Stadtteil war nachts durchschnittlich 3,2 Grad wärmer als ein Gebiet mit vielen Bäumen. Einzelne Grünflächen wirken jedoch nicht automatisch im gesamten Stadtgebiet. Entscheidend sind Größe, Lage und Verbindung zu Luftkorridoren. Bäume spenden Schatten und kühlen durch Verdunstung. Helle Dächer reflektieren einen größeren Teil der Strahlung. Entsiegelte Flächen können Wasser aufnehmen, das später verdunstet. Technische Maßnahmen müssen mit sozialer Planung verbunden werden. Wenn sanierte, kühlere Quartiere anschließend deutlich teurer werden, können einkommensschwache Bewohner verdrängt werden. Kommunen sollten deshalb Hitzeschutz, bezahlbaren Wohnraum und Gesundheitsvorsorge gemeinsam planen. Kurzfristig helfen öffentliche Trinkbrunnen, kühle Räume und Warnsysteme. Langfristig müssen Bauvorschriften, Grünplanung und Verkehrspolitik zusammenwirken. Künftige Studien sollen genauer untersuchen, welche Kombination von Maßnahmen unter verschiedenen klimatischen und sozialen Bedingungen am wirksamsten ist.`,questions:[
      mc('Warum sind Städte häufig wärmer als ihr Umland?','Bebauung speichert Wärme und Luftbewegung fehlt','Weil es dort immer weniger Menschen gibt','Weil Dächer nur nachts Energie aufnehmen'),
      mc('Wann ist der Temperaturunterschied besonders relevant?','In der Nacht','Nur im Wintermorgen','Ausschließlich bei Regen'),
      mc('Welche Gruppe wird ausdrücklich als gefährdet genannt?','Ältere Menschen','Nur Leistungssportler','Nur Autofahrer'),
      mc('Wie groß war der gemessene nächtliche Unterschied?','Durchschnittlich 3,2 Grad','Genau 12 Grad','Weniger als 0,2 Grad'),
      gap('Bäume kühlen unter anderem durch ___.','Verdunstung'),
      gap('Helle Dächer ___ einen größeren Teil der Strahlung.','reflektieren'),
      gap('Entsiegelte Flächen können ___ aufnehmen.','Wasser'),
      gap('Kurzfristig helfen Trinkbrunnen, kühle Räume und ___.','Warnsysteme'),
      gap('Langfristig sollen Bauvorschriften, Grünplanung und ___ zusammenwirken.','Verkehrspolitik'),
      summary('Fassen Sie die empfohlene Gesamtstrategie gegen städtische Hitze zusammen.','Bauliche und grüne Maßnahmen sollen mit Gesundheitsvorsorge und sozial gerechter Wohnpolitik kombiniert werden.')
    ]}
  ]};

  const schreiben={
    title:'Digitalisierung im Studium',
    task:'Beschreiben und vergleichen Sie die Entwicklung in der Grafik. Erklären Sie mögliche Ursachen. Erörtern Sie anschließend, ob digitale Lernangebote Präsenzveranstaltungen teilweise ersetzen sollten, und begründen Sie Ihre Position mit Beispielen.',
    chartTitle:'Regelmäßige Nutzung digitaler Lernangebote durch Studierende (in %)',
    chart:[['2018',32],['2020',57],['2022',68],['2024',76],['2026',81]],
    min:350,max:400,time:60
  };

  const sprechen={tasks:[
    {type:'Sich vorstellen',q:'Stellen Sie sich kurz vor. Nennen Sie Ihr Studienfach oder gewünschtes Studienfach und erklären Sie ein persönliches Studienziel.',prep:30,time:60},
    {type:'Informationen erfragen',q:'Sie interessieren sich für ein Austauschsemester. Rufen Sie beim International Office an und bitten Sie um Informationen zu Voraussetzungen, Fristen und Finanzierung.',prep:30,time:60},
    {type:'Grafik beschreiben',q:'Beschreiben Sie die Grafik zur Nutzung digitaler Lernangebote: 2018: 32 %, 2020: 57 %, 2022: 68 %, 2024: 76 %, 2026: 81 %. Nennen Sie den wichtigsten Trend.',prep:60,time:90},
    {type:'Stellung nehmen',q:'Sollten Vorlesungen grundsätzlich aufgezeichnet werden? Nehmen Sie begründet Stellung und nennen Sie ein Beispiel.',prep:60,time:90},
    {type:'Positionen vergleichen',q:'Vergleichen Sie zwei Positionen: A fordert ausschließlich Präsenzlehre; B fordert möglichst viele Onlineveranstaltungen. Bewerten Sie beide Positionen.',prep:60,time:120},
    {type:'Lösung vorschlagen',q:'In einer Lehrveranstaltung beteiligen sich nur wenige Studierende an Diskussionen. Analysieren Sie mögliche Ursachen und schlagen Sie konkrete Lösungen vor.',prep:75,time:120},
    {type:'Zusammenfassen',q:'Fassen Sie Ihre Überlegungen zur zukünftigen Hochschullehre zusammen und formulieren Sie eine begründete Empfehlung an eine Hochschulleitung.',prep:90,time:120}
  ]};

  return{lesen,hoeren,schreiben,sprechen};
})();
