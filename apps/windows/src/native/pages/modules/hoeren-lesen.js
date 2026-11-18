// Hören (5-step method / exam / weekly test) and Lesen (4-step method / exam / weekly test) —
// hand port of renderHoeren / renderLesen from the site engine.

import { ML, faNum, arr } from '../../core/engine.js';
import { E, rtl, card } from './kit.js';
import { isCorrect } from '../../core/work.js';

export function makeHoerenLesen(env) {
  const { eng, wk, kit } = env;
  const work = () => eng.work();

  function transcriptHtml(it, highlight = new Set(), opts = {}) {
    const names = it.speakers.map((s) => s.name);
    const words = (txt) => { let out = ''; const re = /\S+/g; let m; let last = 0; while ((m = re.exec(txt))) { out += E(txt.slice(last, m.index)) + `<span class="w" data-c0="${m.index}" data-c1="${m.index + m[0].length}">${E(m[0])}</span>`; last = m.index + m[0].length; } return out + E(txt.slice(last)); };
    return `<div class="tx" data-item="${E(it.id || '')}" dir="ltr" lang="de">${it.segments.map((s, n) => `<p data-seg-line="${n}" data-seg="${n}" data-t0="${s.t0 ?? 0}" data-t1="${s.t1 ?? 0}" data-len="${(s.text || '').length}" class="${highlight.has(n) ? 'is-evidence' : ''}"><button type="button" class="tx-play" data-seg="${n}" title="Play">▶</button><b>${E(names[s.s] || s.speaker || '')}:</b> <span>${words(s.text || '')}</span>${opts.mark ? `<button type="button" class="tx-mark" data-xadd="${n}" title="${E(ML('این جمله را نفهمیدم', 'Nicht verstanden', "I didn't understand this"))}">?</button>` : ''}</p>`).join('')}</div>`;
  }
  function evidenceSegments(it, qs, onlyWrong) {
    const w = work(); const set = new Set();
    qs.forEach((q) => {
      if (!q.evidence) return;
      if (onlyWrong && isCorrect(q, w.ans['h:' + q.id])) return;
      const ev = q.evidence.toLowerCase().slice(0, 60);
      it.segments.forEach((s, n) => { if (s.text.toLowerCase().includes(ev.slice(0, 40))) set.add(n); });
    });
    void w;
    return set;
  }

  function renderHoeren(a, d, w, steps, i) {
    const it = wk.currentHoerenItem();
    if (!it) return { body: card(E(ML('محتوا یافت نشد.', 'Kein Inhalt gefunden.', 'No content found.'))) };
    const key = steps[i].key; const qs = it.questions || []; const M_ = eng.ST().methods.hoeren;
    const head = card(`<div class="tdm-item-head"><span class="chip">${E(it.formatLabel)}</span><h3 dir="ltr" lang="de">${E(it.title)}</h3><p class="muted" dir="ltr">${E(it.speakers.map((s) => s.name).join(' · '))}</p></div>`, 'compact');
    let body = '';
    let opts = {};
    if (key === 'global') {
      body = head + card(kit.playerHtml(it)) + card(`${rtl(`<h4 dir="auto">${E(ML('بدون متن و زیرنویس یک بار گوش بده و به سه سؤال پاسخ بده:', 'Einmal ohne Text hören und drei Fragen beantworten:', 'Listen once without text and answer three questions:'))}</h4>`)}
        <label class="tdm-label" dir="auto">${E(ML('موضوع اصلی چیست؟', 'Was ist das Hauptthema?', 'What is the main topic?'))}</label>${kit.ta('g_thema', 'Das Hauptthema ist …', 2)}
        <label class="tdm-label" dir="auto">${E(ML('مسئله مطرح‌شده چیست؟', 'Welches Problem wird besprochen?', 'Which problem is discussed?'))}</label>${kit.ta('g_problem', 'Das Problem besteht darin, dass …', 2)}
        <label class="tdm-label" dir="auto">${E(ML('هدف گوینده چیست؟', 'Was ist das Ziel der Sprecher?', 'What do the speakers want?'))}</label>${kit.ta('g_ziel', 'Die Sprecher wollen …', 2)}
        ${kit.reveal('hglobal', ML('مقایسه با پاسخ نمونه', 'Mit Musterlösung vergleichen', 'Compare with the model answer'), `<ul class="tdm-list" dir="ltr"><li><b>Thema:</b> ${E(it.global.thema)}</li><li><b>Problem:</b> ${E(it.global.problem)}</li><li><b>Ziel:</b> ${E(it.global.ziel)}</li></ul>${kit.selfCheck('g_ok', 'آیا موضوع، مسئله و هدف را درست فهمیدم؟')}`)}`);
    } else if (key === 'selektiv') {
      const fields = [['zahlen', 'Zahlen', 'اعداد'], ['gruende', 'Gründe', 'دلایل'], ['vorteile', 'Vorteile', 'مزایا'], ['nachteile', 'Nachteile', 'معایب'], ['beispiele', 'Beispiele', 'مثال‌ها'], ['schlussfolgerungen', 'Schlussfolgerungen', 'نتیجه‌گیری‌ها']];
      body = head + card(kit.playerHtml(it)) + card(`${rtl(`<h4 dir="auto">${E(ML('بار دوم گوش بده و اطلاعات مهم را فقط به‌صورت کلیدواژه یادداشت کن (نه جمله کامل):', 'Zweites Hören: nur Stichwörter notieren.', 'Second listening: note keywords only.'))}</h4>`)}
        <div class="tdm-grid2">${fields.map(([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${kit.ta('s_' + k, '…', 2)}</label>`).join('')}</div>
        ${kit.reveal('hsel', ML('کلیدواژه‌های نمونه', 'Muster-Stichwörter', 'Model keywords'), `<div class="tdm-grid2" dir="ltr">${fields.map(([k, de]) => `<div class="tdm-mini"><b>${de}</b><p>${E(arr(it.selektiv?.[k]).join(' · ') || '—')}</p></div>`).join('')}</div>`)}`)
        + card(`<h4 dir="auto">${E(ML('سؤالات (به سبک آزمون)', 'Aufgaben im Prüfungsformat', 'Tasks in exam format'))}</h4>${kit.renderQuestions('h', qs)}`);
    } else if (key === 'pruefung') {
      const checked = !!w.checked.h;
      body = head + card(rtl(`<p>${d.mode === 'eval' ? 'آزمون هفتگی: ' : ''}${E(ML('مثل آزمون: فایل را حداکثر دو بار بشنو و در همان زمان به سؤال‌ها پاسخ بده. با پایان زمان، پاسخ‌ها خودکار ارزیابی می‌شوند.', 'Wie in der Prüfung: höchstens zweimal hören und gleichzeitig antworten. Nach Ablauf der Zeit wird automatisch ausgewertet.', 'Like the exam: listen at most twice and answer meanwhile. When time is up, answers are checked automatically.'))}</p>`)) + card(kit.playerHtml(it, { exam: !checked })) + card(kit.renderQuestions('h', qs, { explain: true }));
      opts = { countdown: checked ? null : { auto: 'h' } };
    } else if (key === 'analyse') {
      const checked = !!w.checked.h; const ev = evidenceSegments(it, qs, true); const wrong = checked ? wk.wrongQuestions('h', qs) : [];
      body = card(kit.playerHtml(it)) + card(`${rtl('<h4>متن صوتی را باز کن و قسمت‌های نامفهوم را بررسی کن.</h4><p class="muted">جمله‌های زرد شواهد سؤال‌های اشتباه هستند. روی ▶ هر جمله بزن تا همان بخش پخش شود؛ روی «?» بزن تا آن جمله خودکار توضیح داده شود و در فهرست اشتباهات ثبت شود.</p>')}${transcriptHtml(it, ev, { mark: true })}`)
        + (checked ? kit.qaHtml('h', 'hoeren', wrong) : card(`${rtl('<h4>هنوز سؤال‌ها را ارزیابی نکرده‌ای.</h4>')}${kit.renderQuestions('h', qs)}`))
        + card(`${rtl('<h4>جمله‌های نامفهوم</h4><p class="muted">با «?» کنار هر جمله اضافه کن؛ معنی، ساختار و دسته آن خودکار مشخص می‌شود.</p>')}${kit.extraErrorsHtml('hoeren')}`)
        + card(`<h4 dir="auto">${E(ML('کلمات کلیدی این فایل', 'Schlüsselwörter', 'Key words'))}</h4>${kit.vocabMini(it.vocab)}`)
        + kit.ruleBox(M_.rule);
    } else if (key === 'erneut') {
      body = card(kit.playerHtml(it)) + card(`${rtl('<h4>متن را ببند و دوباره گوش بده. هدف: درک جمله‌ها و ارتباط منطقی آن‌ها بدون کمک متن.</h4>')}
        <label class="tdm-label" dir="auto">${E(ML('چند درصد را اکنون بدون متن می‌فهمم؟', 'Wie viel verstehe ich jetzt ohne Text?', 'How much do I understand without text now?'))} <b id="tdmUnd">${faNum(w.f.understanding || 50)}%</b></label>
        <input type="range" min="0" max="100" step="5" value="${E(w.f.understanding || 50)}" class="tdm-range" data-understanding="1" />
        ${kit.selfCheck('e_logic', 'ارتباط منطقی بین جمله‌ها (دلیل، نتیجه، تضاد) را دنبال کردم.')}`);
    } else if (key === 'zusammenfassung') {
      const rec = w.rec.zusammenfassung; const ai = wk.aiOn() && rec && !rec.local; const st = wk.aiState('sp_zusammenfassung');
      body = card(`${rtl('<h4>بدون نگاه به متن، محتوای فایل را به آلمانی بازگو کن و صدایت را ضبط کن.</h4><p class="muted">ترتیب پیشنهادی: موضوع ← مسئله ← دلایل و مثال‌ها ← نتیجه.</p>')}
        ${kit.recorderHtml('zusammenfassung', { label: 'Zusammenfassung', limit: 180 })}
        <label class="tdm-label" dir="auto">${E(ML('نکات یا متن بازگویی (اختیاری)', 'Notizen (optional)', 'Notes (optional)'))}</label>${kit.ta('summary_notes', 'In dem Gespräch geht es um …', 3)}
        ${kit.reveal('hsum', ML('خلاصه نمونه برای مقایسه', 'Musterzusammenfassung', 'Model summary'), `<p dir="ltr" lang="de">${E(it.summary_model)}</p>`)}`)
        + (ai && st !== 'error' ? card(kit.aiSpeakingHtml('zusammenfassung', -1, { title: ML('بررسی خودکار بازگویی تو', 'Automatische Prüfung deiner Zusammenfassung', 'Automatic check of your summary') }), 'tdm-ai') : '')
        + (ai && st === 'done' ? '' : card(`${rec && st === 'error' ? (wk.speakAuto('zusammenfassung', -1), kit.aiFailed('sp_zusammenfassung', w.ai.sp_zusammenfassung, '')) : ''}<h4 dir="auto">${E(ML('بررسی صدای خودم', 'Selbstkontrolle', 'Self-check'))}</h4>${kit.selfCheck('z_thema', 'آیا موضوع را درست فهمیدم؟')}${kit.selfCheck('z_reihenfolge', 'آیا ترتیب اطلاعات را حفظ کردم؟')}${kit.selfCheck('z_eigen', 'آیا توانستم مفهوم را با جملات خودم بیان کنم؟')}`))
        + card(rtl(`<p>حداقل بخشی از تمرین روزانه باید از نمونه سؤالات رسمی Hören باشد: <button type="button" class="btn btn-ghost small" data-ext="${E(eng.ST().officialUrl)}">صفحه رسمی آمادگی آزمون ↗</button></p>`));
    }
    return { body, ...opts };
  }

  function lesenText(it, o = {}) {
    return `<article class="tdm-text" dir="ltr" lang="de"><h3>${E(it.title)}</h3>${it.teaser ? `<p class="tdm-teaser">${E(it.teaser)}</p>` : ''}${it.paragraphs.map((p, n) => `<section class="tdm-para"><span class="tdm-pnum">${n + 1}</span><div>${p.heading ? `<h5>${E(p.heading)}</h5>` : ''}<p>${E(p.text)}</p>${o.ideas ? `<div class="tdm-idea">${kit.ta('idea_' + n, 'Kernaussage in einem Satz …', 2)}${o.showModel ? `<p class="tdm-model">✓ ${E(it.main_ideas?.[n] || '')}</p>` : ''}</div>` : ''}</div></section>`).join('')}</article>`;
  }
  function renderLesen(a, d, w, steps, i) {
    const it = eng.item('lesen', d.picks?.lesen);
    if (!it) return { body: card('—') };
    const key = steps[i].key; const qs = it.questions || [];
    const strategy = rtl('<ol class="tdm-ol"><li>کلمات کلیدی سؤال را مشخص کن.</li><li>پاراگراف مرتبط را پیدا کن.</li><li>جمله حاوی پاسخ را مشخص کن.</li><li>گزینه‌ها را با مفهوم متن مقایسه کن.</li><li>پاسخ را انتخاب کن.</li></ol>');
    let body = '';
    let opts = {};
    if (key === 'ueberblick') {
      body = card(`<div class="tdm-item-head"><span class="chip">${E(it.formatLabel)}</span><h3 dir="ltr" lang="de">${E(it.title)}</h3>${it.teaser ? `<p dir="ltr" class="tdm-teaser">${E(it.teaser)}</p>` : ''}</div>
        <h4 dir="auto">${E(ML('تیترهای فرعی', 'Zwischenüberschriften', 'Subheadings'))}</h4><ol class="tdm-list" dir="ltr">${it.paragraphs.map((p) => `<li>${E(p.heading || '…')}</li>`).join('')}</ol>`)
        + card(`${rtl('<h4>موضوع و محتوای احتمالی متن را پیش‌بینی کن (بدون خواندن متن).</h4>')}${kit.ta('prediction', 'Ich vermute, dass der Text …', 3)}`);
    } else if (key === 'intensiv') {
      body = card(rtl('<p>متن را با دقت بخوان و برای هر پاراگراف یک جمله درباره مفهوم اصلی بنویس. <b>از ترجمه تک‌تک کلمات خودداری کن.</b></p>')) + card(lesenText(it, { ideas: true, showModel: !!w.checked.r_lideas }))
        + `<div class="center"><button type="button" class="btn btn-ghost" data-reveal="lideas">${E(w.checked.r_lideas ? ML('پنهان‌کردن نمونه‌ها', 'Muster ausblenden', 'Hide models') : ML('مقایسه با ایده‌های نمونه', 'Mit Muster vergleichen', 'Compare with model ideas'))}</button></div>`;
    } else if (key === 'aufgaben' || key === 'pruefung') {
      const exam = key === 'pruefung'; const checked = !!w.checked.l;
      body = (exam ? '' : card(`<h4 dir="auto">${E(ML('روش پاسخ‌گویی به هر سؤال', 'Lösungsstrategie', 'Strategy'))}</h4>${strategy}`, 'compact'))
        + `<div class="tdm-split"><div class="tdm-split-text">${card(lesenText(it))}</div><div class="tdm-split-q">${card(`<h4>${E(it.formatLabel)}</h4>${it.format === 'jnt' ? rtl('<p class="muted">Ja = متن همین را می‌گوید · Nein = متن خلاف آن را می‌گوید · Text sagt dazu nichts = متن درباره‌اش چیزی نمی‌گوید.</p>') : ''}${kit.renderQuestions('l', qs, { explain: true })}`)}</div></div>`;
      if (exam && !checked) opts = { countdown: { auto: 'l' } };
    } else if (key === 'fehler') {
      const checked = !!w.checked.l; const wrong = checked ? wk.wrongQuestions('l', qs) : []; const sc = checked ? wk.qScore('l', qs) : null;
      body = (checked ? kit.qaHtml('l', 'lesen', wrong) : card(`${rtl('<h4>ابتدا سؤال‌ها را ارزیابی کن.</h4>')}${kit.renderQuestions('l', qs, { explain: true })}`))
        + card(`${rtl('<h4>جمله دشوار دیگری هم بود؟</h4><p class="muted">اختیاری: جمله را اینجا بنویس تا معنی و ساختارش خودکار توضیح داده شود.</p>')}${kit.extraErrorsHtml('lesen')}`)
        + card(`${rtl('<h4>خلاصه یک‌خطی متن (با جمله خودت)</h4>')}${kit.ta('summary', 'Der Text zeigt, dass …', 2)}${kit.reveal('lsum', ML('مقایسه با خلاصه نمونه', 'Musterlösung', 'Model summary'), `<p dir="ltr" lang="de">${E(it.summary_line)}</p>`)}`)
        + card(`<h4 dir="auto">${E(ML('خروجی روزانه Lesen', 'Tagesergebnis Lesen', 'Reading result'))}</h4><div class="tdm-out"><div><small>${E(ML('متن', 'Text', 'Text'))}</small><b dir="ltr">${E(it.title)}</b></div><div><small>${E(ML('سؤالات حل‌شده', 'Gelöste Aufgaben', 'Tasks solved'))}</small><b>${sc ? faNum(sc.total) : '—'}</b></div><div><small>${E(ML('درصد پاسخ صحیح', 'Richtig', 'Correct'))}</small><b>${sc ? faNum(sc.pct) + '%' : '—'}</b></div><div><small>${E(ML('اشتباهات تحلیل‌شده', 'Analysierte Fehler', 'Analysed mistakes'))}</small><b>${faNum(wk.analysedCount(w))}</b></div></div>`)
        + card(`<h4 dir="auto">${E(ML('لغات کلیدی متن (در بخش واژگان امروز)', 'Wortschatz aus dem Text', 'Vocabulary from the text'))}</h4>${kit.vocabMini(it.vocab)}`);
    }
    return { body, ...opts };
  }

  return { hoeren: renderHoeren, lesen: renderLesen };
}
