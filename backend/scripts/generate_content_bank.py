"""Generate and validate Amookht's built-in offline content bank.

Run from repository root: python backend/scripts/generate_content_bank.py
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any

OUTPUT=Path(__file__).resolve().parents[1]/"data"/"files"/"global_content_bank.json"

# id: (German label, focus, six topic terms as (article, word, English, Persian))
TOPICS={
"umwelt":("Umwelt und Klima","Nachhaltigkeit, Klimawandel und Umweltschutz",[("der","Klimaschutz","climate protection","حفاظت اقلیمی"),("die","Artenvielfalt","biodiversity","تنوع زیستی"),("der","Ressourcenverbrauch","resource consumption","مصرف منابع"),("die","Kreislaufwirtschaft","circular economy","اقتصاد چرخشی"),("die","Emission","emission","انتشار آلاینده"),("die","Klimaanpassung","climate adaptation","سازگاری اقلیمی")]),
"bildung":("Bildung und Universität","Hochschulsystem, Studium und Forschung",[("die","Hochschulbildung","higher education","آموزش عالی"),("die","Studienfinanzierung","student funding","تأمین مالی تحصیل"),("die","Lehrveranstaltung","university course","درس دانشگاهی"),("die","Chancengleichheit","equal opportunity","برابری فرصت"),("die","Studienberatung","academic advising","مشاوره تحصیلی"),("der","Studienerfolg","academic success","موفقیت تحصیلی")]),
"technik":("Technologie und Digitalisierung","künstliche Intelligenz, Internet und Digitalisierung",[("die","Digitalisierung","digitalisation","دیجیتالی‌شدن"),("die","Datensicherheit","data security","امنیت داده"),("der","Algorithmus","algorithm","الگوریتم"),("die","Automatisierung","automation","خودکارسازی"),("die","Medienkompetenz","media literacy","سواد رسانه‌ای"),("die","künstliche Intelligenz","artificial intelligence","هوش مصنوعی")]),
"gesellschaft":("Gesellschaft und Kultur","Migration, Integration und demografischer Wandel",[("der","Zusammenhalt","social cohesion","همبستگی اجتماعی"),("die","Teilhabe","participation","مشارکت"),("die","Vielfalt","diversity","تنوع"),("das","Vorurteil","prejudice","پیش‌داوری"),("die","Integration","integration","ادغام اجتماعی"),("der","Wertewandel","change of values","دگرگونی ارزش‌ها")]),
"gesundheit":("Gesundheit und Sport","Ernährung, Bewegung und Gesundheitssystem",[("die","Prävention","prevention","پیشگیری"),("die","Gesundheitsversorgung","healthcare","خدمات سلامت"),("der","Bewegungsmangel","lack of exercise","کم‌تحرکی"),("die","Vorsorgeuntersuchung","preventive examination","معاینه پیشگیرانه"),("die","Belastung","strain","فشار"),("das","Wohlbefinden","well-being","سلامت و آسایش")]),
"arbeit":("Arbeit und Wirtschaft","Arbeitsmarkt, Wirtschaft und Globalisierung",[("der","Arbeitsmarkt","labour market","بازار کار"),("die","Weiterbildung","continuing education","آموزش تکمیلی"),("die","Beschäftigung","employment","اشتغال"),("die","Mitbestimmung","co-determination","مشارکت کارکنان"),("die","Produktivität","productivity","بهره‌وری"),("die","Arbeitsbelastung","workload","فشار کاری")]),
"energie":("Energie und Verkehr","erneuerbare Energien und nachhaltige Mobilität",[("die","Energiewende","energy transition","گذار انرژی"),("die","Versorgungssicherheit","security of supply","امنیت تأمین"),("der","Stromspeicher","power storage","ذخیره‌ساز برق"),("der","Nahverkehr","local public transport","حمل‌ونقل عمومی"),("die","Ladeinfrastruktur","charging infrastructure","زیرساخت شارژ"),("die","Energieeffizienz","energy efficiency","بهره‌وری انرژی")]),
"medien":("Medien und Kommunikation","soziale Medien, Presse und öffentliche Kommunikation",[("die","Berichterstattung","reporting","گزارش‌رسانی"),("die","Meinungsbildung","opinion formation","شکل‌گیری نظر"),("die","Desinformation","disinformation","اطلاعات گمراه‌کننده"),("die","Quellenprüfung","source checking","بررسی منبع"),("die","Reichweite","reach","دامنه دسترسی"),("der","Medienkonsum","media consumption","مصرف رسانه")]),
"einkaufen":("Einkaufen","Preise, Angebote und bewusster Konsum",[("der","Preisvergleich","price comparison","مقایسه قیمت"),("die","Kaufentscheidung","purchase decision","تصمیم خرید"),("das","Sonderangebot","special offer","پیشنهاد ویژه"),("die","Herkunft","origin","مبدأ کالا"),("die","Kennzeichnung","labelling","برچسب‌گذاری"),("der","Verbraucherschutz","consumer protection","حمایت از مصرف‌کننده")]),
"freizeit":("Freizeit und Hobbys","Sport, Spiele, Kultur und Erholung",[("die","Erholung","recreation","استراحت و بازیابی"),("die","Freizeitgestaltung","leisure planning","برنامه‌ریزی اوقات فراغت"),("das","Ehrenamt","volunteering","فعالیت داوطلبانه"),("der","Verein","club","انجمن"),("die","Ausgeglichenheit","balance","تعادل روحی"),("die","Bildschirmzeit","screen time","زمان استفاده از صفحه")]),
"reisen":("Reisen und Urlaub","Unterkunft, Verkehr und verantwortlicher Tourismus",[("der","Tourismus","tourism","گردشگری"),("die","Unterkunft","accommodation","محل اقامت"),("das","Reiseziel","destination","مقصد سفر"),("die","Hauptsaison","high season","فصل شلوغ"),("die","Gastfreundschaft","hospitality","مهمان‌نوازی"),("der","Massentourismus","mass tourism","گردشگری انبوه")]),
"treffen":("Treffen und Freunde","Verabredungen, Freundschaft und Kommunikation",[("die","Verabredung","appointment","قرار ملاقات"),("die","Freundschaft","friendship","دوستی"),("die","Verlässlichkeit","reliability","قابل‌اعتماد بودن"),("das","Missverständnis","misunderstanding","سوءتفاهم"),("die","Unterstützung","support","حمایت"),("die","Gemeinsamkeit","common ground","وجه مشترک")]),
"wohnen":("Wohnen und Haushalt","Miete, Einrichtung und Nachbarschaft",[("der","Wohnraum","housing space","فضای مسکونی"),("die","Mietbelastung","rent burden","فشار اجاره"),("der","Haushalt","household","خانوار"),("die","Nebenkosten","service charges","هزینه‌های جانبی"),("das","Wohnviertel","residential district","محله مسکونی"),("der","Wohnungsbau","housing construction","ساخت مسکن")]),
"essen":("Essen und Trinken","Ernährung, Restaurant und Lebensmittel",[("die","Ernährung","nutrition","تغذیه"),("das","Lebensmittel","food product","ماده غذایی"),("die","Verschwendung","waste","هدررفت"),("die","Zutat","ingredient","ماده اولیه"),("die","Mahlzeit","meal","وعده غذایی"),("die","Landwirtschaft","agriculture","کشاورزی")]),
"verkehr":("Verkehr und öffentlicher Nahverkehr","Bus, Bahn, Fahrrad und Alltagsmobilität",[("die","Verbindung","connection","مسیر ارتباطی"),("die","Verspätung","delay","تأخیر"),("der","Fahrplan","timetable","جدول زمانی"),("die","Haltestelle","stop","ایستگاه"),("der","Anschluss","connecting service","اتصال مسیر"),("der","Fahrgast","passenger","مسافر")]),
"behörden":("Behörden und Post","Anträge, Formulare und öffentliche Dienstleistungen",[("der","Antrag","application","درخواست رسمی"),("die","Behörde","authority","اداره دولتی"),("die","Bearbeitungszeit","processing time","زمان رسیدگی"),("der","Bescheid","official decision","ابلاغ رسمی"),("die","Zustellung","delivery","تحویل پستی"),("der","Nachweis","proof","مدرک اثبات")]),
"informatik":("Informatik und IT","Programmierung, Netzwerke und Datenbanken",[("die","Softwareentwicklung","software development","توسعه نرم‌افزار"),("die","Datenbank","database","پایگاه داده"),("die","Schnittstelle","interface","رابط نرم‌افزاری"),("die","Sicherheitslücke","security vulnerability","آسیب‌پذیری امنیتی"),("die","Wartung","maintenance","نگهداری"),("der","Quellcode","source code","کد منبع")]),
"medizin":("Medizin und Pflege","Krankenhaus, Patienten und Behandlung",[("die","Pflegekraft","nurse","نیروی پرستاری"),("die","Behandlung","treatment","درمان"),("die","Diagnose","diagnosis","تشخیص"),("die","Genesung","recovery","بهبودی"),("die","Übergabe","handover","تحویل شیفت"),("die","Patientenversorgung","patient care","مراقبت از بیمار")]),
"ingenieur":("Ingenieurwesen und Technik","Bau, Maschinen und technische Systeme",[("die","Konstruktion","engineering design","طراحی فنی"),("die","Belastbarkeit","load capacity","ظرفیت تحمل"),("der","Werkstoff","material","ماده مهندسی"),("die","Qualitätskontrolle","quality control","کنترل کیفیت"),("die","Anlage","technical plant","تأسیسات"),("die","Instandhaltung","maintenance","نگهداری فنی")]),
"pädagogik":("Pädagogik und Lehre","Schule, Erziehung und Didaktik",[("die","Didaktik","didactics","روش تدریس"),("das","Lernziel","learning objective","هدف یادگیری"),("die","Rückmeldung","feedback","بازخورد"),("die","Förderung","educational support","حمایت آموزشی"),("der","Lernstand","learning level","سطح یادگیری"),("die","Unterrichtsgestaltung","lesson design","طراحی آموزش")]),
"bewerbung":("Bewerbung und Vorstellungsgespräch","Lebenslauf, Qualifikationen und Berufseinstieg",[("die","Stellenausschreibung","job advertisement","آگهی شغلی"),("der","Lebenslauf","curriculum vitae","رزومه"),("das","Anschreiben","cover letter","نامه درخواست"),("die","Berufserfahrung","work experience","سابقه کاری"),("das","Vorstellungsgespräch","job interview","مصاحبه کاری"),("die","Qualifikation","qualification","صلاحیت حرفه‌ای")]),
"kaufmann":("Kaufmännische Arbeit und Verwaltung","Buchhaltung, Verwaltung und Geschäftsprozesse",[("die","Buchhaltung","accounting","حسابداری"),("die","Rechnung","invoice","فاکتور"),("die","Zuständigkeit","responsibility","مسئولیت سازمانی"),("die","Sachbearbeitung","administrative processing","رسیدگی اداری"),("der","Geschäftsprozess","business process","فرایند کسب‌وکار"),("die","Frist","deadline","مهلت")]),
"handwerk":("Handwerk und praktische Berufe","Ausbildung, Werkzeuge und Arbeitssicherheit",[("das","Handwerk","skilled trade","حرفه فنی"),("die","Ausbildung","vocational training","دوره کارآموزی"),("das","Werkzeug","tool","ابزار"),("die","Arbeitssicherheit","occupational safety","ایمنی کار"),("der","Fachbetrieb","specialist company","شرکت تخصصی"),("die","Maßanfertigung","custom-made product","ساخت سفارشی")]),
"präsentation":("Präsentation und Meeting","Vortrag, Besprechung und Diskussion",[("die","Tagesordnung","agenda","دستور جلسه"),("der","Vortrag","presentation","ارائه"),("die","Rückfrage","follow-up question","پرسش تکمیلی"),("die","Entscheidung","decision","تصمیم"),("das","Protokoll","minutes","صورت‌جلسه"),("die","Moderation","facilitation","مدیریت جلسه")]),
}

ACADEMIC=[("die","Auswirkung","die Auswirkungen","impact","پیامد","die Folge","die Ursache"),("die","Maßnahme","die Maßnahmen","measure","اقدام","der Schritt","die Untätigkeit"),("die","Entwicklung","die Entwicklungen","development","روند","der Fortschritt","der Stillstand"),("die","Herausforderung","die Herausforderungen","challenge","چالش","die Schwierigkeit","die Leichtigkeit"),("die","Voraussetzung","die Voraussetzungen","prerequisite","پیش‌شرط","die Bedingung","das Hindernis"),("die","Förderung","-","support","حمایت","die Unterstützung","die Vernachlässigung"),("der","Anteil","die Anteile","share","سهم","die Quote","die Gesamtheit"),("die","Bewertung","die Bewertungen","assessment","ارزیابی","die Beurteilung","die Missachtung"),("der","Zusammenhang","die Zusammenhänge","connection","ارتباط","die Beziehung","die Trennung"),("die","Umsetzung","die Umsetzungen","implementation","اجرا","die Durchführung","die Aufgabe"),("die","Erkenntnis","die Erkenntnisse","finding","یافته","das Ergebnis","die Unkenntnis"),("der","Ansatz","die Ansätze","approach","رویکرد","die Methode","die Planlosigkeit")]
GRAMMAR=[
("Konjunktiv II für Empfehlungen","Mit könnte, sollte und würde formuliert man Empfehlungen und hypothetische Folgen.","Subjekt + könnte/sollte/würde + Ergänzung + Infinitiv","Die Beteiligten könnten eine gemeinsame Lösung entwickeln.","Modalverb und Infinitiv nicht trennen."),
("Passiv in wissenschaftlichen Aussagen","Das Vorgangspassiv betont Prozess oder Maßnahme statt der handelnden Person.","Subjekt + werden + Partizip II","Die Ergebnisse werden regelmäßig überprüft.","werden und worden nicht verwechseln."),
("Nominalisierung im akademischen Stil","Nominalisierungen verdichten Informationen in sachlichen Texten.","Verb oder Adjektiv → Nomen","Durch die Einführung klarer Regeln verbessert sich die Situation.","Nomen großschreiben und lange Nominalketten vermeiden."),
("Relativsätze zur Präzisierung","Relativsätze ergänzen genaue Informationen zu Personen, Dingen oder Maßnahmen.","Bezugswort, + Relativpronomen + ... + Verb","Das Projekt, das wissenschaftlich begleitet wird, zeigt erste Erfolge.","Kasus des Relativpronomens im Nebensatz bestimmen."),
("Zweiteilige Konnektoren","Mit einerseits … andererseits werden Argumente ausgewogen verbunden.","einerseits + Aussage, andererseits + Aussage","Einerseits entstehen Chancen, andererseits müssen Risiken begrenzt werden.","Beide Teile des Konnektors verwenden."),]

def assumptions(label:str,focus:str)->dict[str,str]:
 return {"thesis":f"Fortschritte bei {label} gelingen nur, wenn fachliche Qualität, soziale Fairness und praktische Umsetzbarkeit gemeinsam berücksichtigt werden","challenge":f"begrenzte Ressourcen, unterschiedliche Interessen und fehlende Informationen erschweren Entscheidungen über {focus}","measure":"klare Ziele, transparente Kriterien, frühe Beteiligung und regelmäßige Überprüfung","actors":"Betroffene, Fachleute, öffentliche Einrichtungen und private Organisationen","evidence":"Projekte mit messbaren Zielen und klaren Zuständigkeiten erreichen häufiger dauerhafte Ergebnisse","example":f"eine Hochschule erprobt zu {label} ein Pilotprojekt, veröffentlicht Ergebnisse und verbessert das Angebot schrittweise","outlook":"digitale Unterstützung und interdisziplinäre Zusammenarbeit werden zunehmen, persönliche Beratung und demokratische Kontrolle bleiben jedoch wichtig"}

def vocab(label,terms):
 rows=[]
 specific=[(a,w,"-",en,fa,f"der Fachbegriff {w}","das Gegenkonzept") for a,w,en,fa in terms]
 for i,(a,w,pl,en,fa,syn,ant) in enumerate(specific+ACADEMIC,1):
  rows.append({"w":w,"art":a,"pl":pl,"lvl":"B2-C1","en":en,"nat":fa,"col":[f"über {w} diskutieren",f"die Bedeutung von {w} untersuchen",f"{w} im Bereich {label}"],"syn":syn,"ant":ant,"ex":f"{a.capitalize()} {w} spielt in der aktuellen Debatte über {label} eine wichtige Rolle.","ex_t":f"مفهوم «{fa}» در بحث امروز دربارهٔ {label} نقش مهمی دارد.","note":f"Akademischer Fachwortschatz zum Themenfeld {label}; Eintrag {i}.","time":30})
 return rows

def grammar(label,focus):
 answers=[f"Die Beteiligten könnten im Bereich {label} gezielte Verbesserungen einführen.",f"Im Bereich {label} werden die Ergebnisse regelmäßig überprüft.",f"Durch die Umsetzung geeigneter Maßnahmen kann die Situation bei {focus} verbessert werden.",f"Die Maßnahme, die im Bereich {label} erprobt wird, soll langfristig wirken.",f"Einerseits bietet {label} neue Chancen, andererseits müssen erkennbare Risiken begrenzt werden."]
 out=[]
 for i,(title,expl,formula,example,mistake) in enumerate(GRAMMAR):
  qs=[{"q":f"Bilden Sie einen korrekten Satz zum Thema „{label}“ mit {title}.","diff":"B2","time":75,"a":answers[i]},{"q":f"Formulieren Sie eine Empfehlung zu {focus} und verwenden Sie {title}.","diff":"B2-C1","time":90,"a":answers[i]},{"q":f"Schreiben Sie ein eigenes akademisches Beispiel zu {label}, das {title} korrekt nutzt.","diff":"C1","time":100,"a":answers[i]}]
  out.append({"title":title,"expl":expl,"formula":formula,"ex":answers[i],"ex_t":"یک نمونه صحیح و مرتبط با موضوع با ساختار خواسته‌شده.","mistakes":[mistake,"Auf die Verbposition und notwendige Kommas achten."],"exercises":qs})
 return out

def reading(label,focus,a):
 text=f"""{label} wird in Wissenschaft, Politik und Alltag zunehmend intensiv diskutiert. Im Mittelpunkt steht die These, dass {a['thesis']}. Diese Forderung betrifft konkrete Entscheidungen über Geld, Zeit, Infrastruktur und Verantwortung. Beteiligt sind vor allem {a['actors']}. Ihre Interessen stimmen nicht immer überein.

Eine besondere Schwierigkeit besteht darin, dass {a['challenge']}. Kurzfristige Vorteile können deshalb langfristige Ziele verdrängen. Gleichzeitig wäre es zu einfach, nur einzelne Gruppen verantwortlich zu machen. Fachleute weisen darauf hin, dass Regeln, Anreize und praktische Unterstützung gemeinsam betrachtet werden müssen. Sonst bleiben gut gemeinte Programme ohne Wirkung.

Als sinnvoller Ansatz gelten {a['measure']}. Entscheidend ist, Ziele so zu formulieren, dass ihre Erreichung überprüft werden kann. Dazu braucht man verständliche Kriterien, einen bekannten Zeitraum und öffentlich zugängliche Ergebnisse. Beteiligte sollten außerdem früh erklären können, welche Nebenwirkungen sie erwarten und welche Alternativen geprüft wurden.

Für diesen Ansatz spricht folgende Beobachtung: {a['evidence']}. Ein konkretes Beispiel verdeutlicht das Prinzip: {a['example']}. Der Erfolg hängt weniger von einer einzelnen technischen Lösung ab als von ihrer Einbettung in verlässliche Abläufe. Auch Schulungen und regelmäßige Rückmeldungen tragen dazu bei, dass neue Angebote tatsächlich genutzt werden.

Kritiker warnen dennoch vor übertriebenen Erwartungen. Nicht jede Maßnahme lässt sich unverändert auf andere Regionen oder Zielgruppen übertragen. Unterschiede bei Einkommen, Vorwissen und Zugang müssen berücksichtigt werden. Eine faire Bewertung vergleicht daher nicht nur Durchschnittswerte, sondern untersucht auch, wer profitiert und wer zusätzliche Unterstützung benötigt.

Für die Zukunft gilt: {a['outlook']}. Dauerhafte Lösungen entstehen, wenn Entscheidungen regelmäßig überprüft und anhand neuer Erkenntnisse angepasst werden. Dafür sollten Verantwortliche auch unerwartete Ergebnisse dokumentieren, aus Fehlern lernen und erfolgreiche Verfahren für andere Einrichtungen verständlich beschreiben. Die Debatte sollte deshalb nicht zwischen vollständiger Zustimmung und grundsätzlicher Ablehnung stehen bleiben, sondern nach überprüfbaren, sozial ausgewogenen und praktisch umsetzbaren Schritten fragen."""
 qs=[("Welche zentrale These vertritt der Text?",a['thesis'].capitalize()+"."),("Welche Gruppen werden als wichtige Beteiligte genannt?",a['actors'].capitalize()+"."),("Warum können gut gemeinte Programme wirkungslos bleiben?","Weil Regeln, Anreize und praktische Unterstützung nicht gemeinsam berücksichtigt werden."),("Welche drei Bedingungen machen Ziele überprüfbar?","Verständliche Kriterien, ein bekannter Zeitraum und öffentlich zugängliche Ergebnisse."),("Welche Einschränkung nennen die Kritiker?","Maßnahmen lassen sich nicht unverändert auf alle Regionen und Zielgruppen übertragen."),("Welche Schlussfolgerung zieht der Text?","Entscheidungen sollen überprüft, angepasst und sozial ausgewogen praktisch umgesetzt werden.")]
 types=["main_idea","detail","causal","detail","inference","summary"]
 return {"title":f"Zwischen Anspruch und Umsetzung: {label}","words":len(text.replace("\n"," ").split()),"time":12,"text":text,"questions":[{"q":q,"type":types[i],"diff":"B2-C1" if i>1 else "B2","time":75+i*5,"a":ans} for i,(q,ans) in enumerate(qs)]}

def listening(label,focus,a,terms):
 text=f"""Moderatorin: Willkommen zu unserer Hochschulreihe. Heute sprechen wir über {label}. Unsere Ausgangsfrage lautet: Wie kann man bei {focus} dauerhaft gute Ergebnisse erreichen?

Experte: Zuerst muss man die Ausgangslage genau betrachten. Die größte Schwierigkeit ist, dass {a['challenge']}. Viele Projekte beginnen mit einer attraktiven Idee, definieren aber weder messbare Ziele noch Zuständigkeiten. Dann weiß nach einigen Monaten niemand, ob Aufwand und Nutzen in einem angemessenen Verhältnis stehen.

Moderatorin: Welche Akteure müssen einbezogen werden?

Experte: Besonders wichtig sind {a['actors']}. Sie verfügen über unterschiedliche Erfahrungen. Wer Betroffene erst nach einer Entscheidung informiert, muss später oft Widerstände und kostspielige Korrekturen bewältigen. Beteiligung bedeutet allerdings nicht, dass jede Person jede Einzelheit entscheidet. Rollen und Entscheidungswege müssen klar bleiben.

Studentin: Gibt es einen Ansatz, der sich bereits bewährt hat?

Experte: Empfehlenswert sind {a['measure']}. Dafür gibt es Hinweise aus der Praxis: {a['evidence']}. Ein anschauliches Beispiel ist folgendes: {a['example']}. Wichtig war dort, dass Ergebnisse regelmäßig veröffentlicht und Probleme nicht verschwiegen wurden.

Moderatorin: Manche Menschen befürchten zusätzliche Kosten. Ist diese Sorge berechtigt?

Experte: Teilweise ja. Neue Angebote benötigen zunächst Personal, Zeit und Infrastruktur. Man sollte aber auch die Kosten des Nichtstuns berechnen. Wenn Probleme später gelöst werden, sind die Ausgaben häufig höher. Eine seriöse Rechnung enthält deshalb Anschaffung, Betrieb, Wartung, soziale Folgen und mögliche Einsparungen über mehrere Jahre.

Moderatorin: Wie sollte man den Erfolg konkret überprüfen?

Experte: Vor dem Start müssen wenige, aber aussagekräftige Kriterien festgelegt werden. Neben Zahlen sind Rückmeldungen der betroffenen Personen wichtig. Eine Zwischenbilanz nach einigen Monaten zeigt, ob Abläufe funktionieren und bestimmte Gruppen unbeabsichtigt benachteiligt werden. Werden nur positive Resultate veröffentlicht, geht Vertrauen verloren. Transparenz bedeutet daher auch, Schwierigkeiten zu benennen, Entscheidungen zu begründen und einen realistischen Termin für Verbesserungen festzulegen. Außerdem sollte eine unabhängige Stelle prüfen können, ob die verwendeten Daten vollständig und die Schlussfolgerungen nachvollziehbar sind. Die Ergebnisse müssen anschließend in verständlicher Form zugänglich sein. So können Interessierte erkennen, welche Ziele erreicht wurden, welche Gruppen noch Unterstützung brauchen und warum ein Projekt fortgesetzt, verändert oder beendet werden soll.

Studentin: Was erwarten Sie für die nächsten Jahre?

Experte: Ich gehe davon aus, dass {a['outlook']}. Erfolgreich werden jedoch nur Modelle sein, die transparent bewertet und an unterschiedliche Bedürfnisse angepasst werden. Eine einzige Lösung für alle halte ich für unrealistisch.

Moderatorin: Damit halten wir fest: Gute Entscheidungen brauchen überprüfbare Ziele, klare Verantwortung, Beteiligung und eine langfristige Kostenbetrachtung. Vielen Dank für das Gespräch."""
 qas=[("Welche Ausgangsfrage stellt die Moderatorin?",f"Wie bei {focus} dauerhaft gute Ergebnisse erreicht werden können."),("Welchen typischen Fehler nennt der Experte?","Es werden weder messbare Ziele noch klare Zuständigkeiten definiert."),("Was bedeutet Beteiligung ausdrücklich nicht?","Sie bedeutet nicht, dass jede Person jede Einzelheit entscheidet."),("Welche Kosten gehören in eine seriöse Rechnung?","Anschaffung, Betrieb, Wartung, soziale Folgen und mögliche langfristige Einsparungen."),("Welche vier Elemente werden am Ende zusammengefasst?","Überprüfbare Ziele, klare Verantwortung, Beteiligung und langfristige Kostenbetrachtung.")]
 pre=[x[1] for x in terms]+["Zuständigkeit","Beteiligung","Ausgangslage","Kostenbetrachtung"]
 return {"title":f"Hochschulgespräch über {label}","duration":5,"speed":"normal B2-C1","pre_vocab":pre,"text":text,"questions":[{"q":q,"diff":"B2-C1" if i>1 else "B2","time":65+i*7,"a":ans} for i,(q,ans) in enumerate(qas)]}

def writing(label,focus,terms,a):
 return {"writing_task":f"An deutschen Hochschulen wird über „{label}“ diskutiert. Beschreiben Sie die Bedeutung von {focus}. Erörtern Sie anschließend die Aussage: „{a['thesis'].capitalize()}.“ Nennen Sie Vorteile, Einwände und ein konkretes Beispiel. Nehmen Sie abschließend begründet Stellung und formulieren Sie eine realistische Empfehlung.","min_w":220,"max_w":300,"time":35,"help":{"vocab":[x[1] for x in terms]+["Auswirkung","Maßnahme","Voraussetzung","Umsetzung"],"col":[f"die Bedeutung von {label} hervorheben","eine Maßnahme umsetzen","Folgen kritisch abwägen","Verantwortung übernehmen"],"redemittel":["In der aktuellen Debatte wird häufig darauf hingewiesen, dass …","Für diese Position spricht vor allem …","Dagegen lässt sich einwenden, dass …","Unter der Voraussetzung, dass …","Zusammenfassend vertrete ich die Auffassung, dass …"],"grammar":["Konjunktiv II","Vorgangspassiv","Relativsätze","Nominalisierung","Konzessivsätze"],"connectors":["zunächst","darüber hinaus","einerseits … andererseits","dennoch","folglich","abschließend"],"outline":["Einleitung","Ausgangslage","Argumente","Gegenargument","Beispiel","Position und Empfehlung"]}}

def speaking(label,focus,terms):
 help={"vocab":[x[1] for x in terms]+["Auswirkung","Maßnahme","Herausforderung"],"col":["eine Position begründen","Vor- und Nachteile abwägen","ein Beispiel anführen"],"redemittel":["Zunächst möchte ich darauf hinweisen, dass …","Ein konkretes Beispiel dafür ist …","Daraus lässt sich schließen, dass …"],"grammar":["Konjunktiv II","Nebensätze","zweiteilige Konnektoren"],"argumentation":["Einerseits …, andererseits …","Für diese Position spricht …","Dagegen könnte man einwenden …"]}
 specs=[(f"Stellen Sie {label} kurz vor und erklären Sie die aktuelle Bedeutung.","aktuelle Bedeutung und Ausgangslage",45,90,["Einordnung","Bedeutung","Beispiel","Überleitung"],False),(f"Erläutern Sie, welche Gruppen bei {focus} beteiligt sind.","Interessen und Verantwortung der Beteiligten",60,100,["Akteure","Interessen","Konflikt","Lösung"],False),(f"Diskutieren Sie eine zentrale Chance im Bereich {label}.","Chancen und erwarteter Nutzen",60,120,["These","Begründung","Beispiel","Folge"],False),(f"Bewerten Sie eine Schwierigkeit bei {focus} und schlagen Sie eine Maßnahme vor.","Risiken, Grenzen und konkrete Maßnahmen",75,120,["Problem","Ursache","Maßnahme","Bewertung"],False),(f"Wählen Sie einen eigenen Aspekt zu {label} und vertreten Sie eine Position.","",75,120,["Eigener Aspekt","Erklärung","Argument","Beispiel","Fazit"],True),(f"Wählen Sie einen zweiten eigenen Aspekt zu {label} und vergleichen Sie zwei Lösungen.","",75,135,["Eigener Aspekt","Lösung A","Lösung B","Vergleich","Empfehlung"],True)]
 return [{"q":q,"aspect":aspect,"prep":prep,"time":time,"structure":structure,"custom_aspect_required":custom,"help":help} for q,aspect,prep,time,structure,custom in specs]

def build():
 out={"topics":{}}
 for key,(label,focus,terms) in TOPICS.items():
  a=assumptions(label,focus)
  out["topics"][key]={"wortschatz":{"items":vocab(label,terms)},"grammatik":{"items":grammar(label,focus)},"lesen":{"items":[reading(label,focus,a)]},"hoeren":{"items":[listening(label,focus,a,terms)]},"schreiben":{"items":[writing(label,focus,terms,a)]},"sprechen":{"items":speaking(label,focus,terms)}}
 return out

def validate(bank):
 counts={"topics":0,"vocabulary":0,"grammar_structures":0,"grammar_exercises":0,"reading_questions":0,"listening_questions":0,"writing_tasks":0,"speaking_tasks":0}
 assert set(bank["topics"])==set(TOPICS)
 for key,t in bank["topics"].items():
  assert set(t)=={"wortschatz","grammatik","lesen","hoeren","schreiben","sprechen"},key
  v=t["wortschatz"]["items"]; g=t["grammatik"]["items"]; r=t["lesen"]["items"]; h=t["hoeren"]["items"]; w=t["schreiben"]["items"]; s=t["sprechen"]["items"]
  assert len(v)==18 and all(len(x["col"])==3 and all(str(x[k]).strip() for k in ("w","art","pl","lvl","en","nat","syn","ant","ex","ex_t","note")) for x in v)
  assert len(g)==5 and all(len(x["exercises"])==3 and len(x["mistakes"])>=2 and all(q["q"] and q["a"] and q["time"]>0 for q in x["exercises"]) for x in g)
  assert len(r)==1 and len(r[0]["questions"])==6 and r[0]["words"]>=350
  assert len(h)==1 and len(h[0]["questions"])==5 and len(h[0]["pre_vocab"])==10
  assert len(w)==1 and all(w[0]["help"][x] for x in ("vocab","col","redemittel","grammar","connectors","outline"))
  assert len(s)==6 and all(x["q"] and x["structure"] and x["help"] for x in s) and all(x["aspect"] for x in s[:4]) and all(x["custom_aspect_required"] for x in s[4:])
  counts["topics"]+=1; counts["vocabulary"]+=len(v); counts["grammar_structures"]+=len(g); counts["grammar_exercises"]+=sum(len(x["exercises"]) for x in g); counts["reading_questions"]+=len(r[0]["questions"]); counts["listening_questions"]+=len(h[0]["questions"]); counts["writing_tasks"]+=len(w); counts["speaking_tasks"]+=len(s)
 return counts

def main():
 bank=build(); counts=validate(bank); OUTPUT.parent.mkdir(parents=True,exist_ok=True); OUTPUT.write_text(json.dumps(bank,ensure_ascii=False,separators=(",",":")),encoding="utf-8"); print(json.dumps({"output":str(OUTPUT),"bytes":OUTPUT.stat().st_size,**counts},ensure_ascii=False,indent=2))
if __name__=="__main__": main()