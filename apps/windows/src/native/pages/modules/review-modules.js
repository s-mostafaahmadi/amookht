// Grammatik & Wortschatz, Wiederholung, Fehleranalyse, Wochenbericht and Extra-Lernzeit — hand port of
// renderWortschatz / renderWiederholung / renderFehleranalyse / renderWochenbericht / renderExtra.

import { ML, faNum, arr } from '../../core/engine.js';
import { CATS } from '../../core/work.js';
import { deckFavoriteItem } from '../../core/learning.js';
import { sxSt, SX_STRUCT, uniqSrs } from '../../core/review.js';
import { starsHtml } from '../widgets.js';
import { E, rtl, card } from './kit.js';

export function makeReviewModules(env) {
  const { eng, wk, kit, rv, ctx, favCache } = env;
  const work = () => eng.work();
  const M = () => eng.M();
  const stars = (item) => `<span class="tdm-fav">${starsHtml(ctx.store.data, item, favCache)}</span>`;
  const favCard = (c) => stars(deckFavoriteItem(c));
  const qdel = (attr) => `<button type="button" class="qdel" ${attr} title="${E(ML('حذف', 'Löschen', 'Delete'))}">×</button>`;

  function srsCards(list, kind) {
    const w = work();
    if (!list.length) return rtl(`<p class="muted">${kind === 'wort' ? 'فعلاً لغتی برای مرور سررسید نشده است. لغات امروز از فردا وارد چرخه مرور (۱، ۳، ۷، ۱۴ روز) می‌شوند.' : 'فعلاً Redemittel سررسیدی وجود ندارد.'}</p>`);
    return `<div class="tdm-cards">${list.map((c) => {
      const done = w.ans['srs:' + c.key]; const open = w.checked['flip:' + c.key]; const x = c.data;
      const front = c.type === 'wort' ? `${x.artikel ? x.artikel + ' ' : ''}${x.wort}` : x.de;
      const back = c.type === 'wort'
        ? `<p dir="rtl"><b>${E(x.bedeutung_fa)}</b></p><p dir="ltr">${x.plural && x.plural !== '—' ? `Pl. ${E(x.plural)} · ` : ''}${x.perfekt ? `Perfekt: ${E(x.perfekt)} · ` : ''}${E((x.koll || []).slice(0, 3).join(' · '))}</p><p dir="ltr" class="muted">${E(x.beispiel)}</p>`
        : `<p dir="rtl"><b>${E(x.fa)}</b></p><p dir="ltr" class="muted">${E(x.beispiel || '')}</p>`;
      return `<div class="tdm-flash tdm-flash-${E(c.type)} ${done ? 'is-' + done : ''}">${qdel(`data-srs-del="${E(c.key)}"`)}<div class="tdm-flash-front" dir="ltr"><b lang="de">${E(front)}</b>${c.type === 'wort' ? `<small>${E(x.wortart)}</small>` : ''}${favCard(c)}</div>
        ${open || done ? `<div class="tdm-flash-back">${back}${done ? '' : `<div class="tdm-flash-act"><button type="button" class="no" data-srs="${E(c.key)}|0">✗ ${E(ML('یادم نبود', 'Nicht gewusst', "Didn't know"))}</button><button type="button" class="ok" data-srs="${E(c.key)}|1">✓ ${E(ML('بلد بودم', 'Gewusst', 'Knew it'))}</button></div>`}</div>` : `<button type="button" class="btn btn-ghost" data-flip="${E(c.key)}">${E(ML('اول به خاطر بیاور، بعد نشان بده', 'Erst erinnern, dann aufdecken', 'Recall first, then reveal'))}</button>`}</div>`;
    }).join('')}</div>`;
  }
  function errorCardsHtml(list) {
    const w = work();
    return `<div class="tdm-cards">${list.map((e) => {
      const done = w.ans['err:' + e.id]; const open = w.checked['flip:err' + e.id];
      return `<div class="tdm-flash ${done ? 'is-' + done : ''}">${qdel(`data-err-del="${E(e.id)}"`)}<div class="tdm-flash-front"><small>${E(e.category || '')}</small><b dir="ltr">${E(e.userAnswer || e.question || '')}</b>${e.userAnswer && e.question ? `<small dir="auto">${E(e.question)}</small>` : ''}</div>
        ${open || done ? `<div class="tdm-flash-back"><p dir="ltr"><b>✓ ${E(e.correctAnswer || '')}</b></p>${e.explanation ? `<p dir="auto" class="muted">${E(e.explanation)}</p>` : ''}${done ? '' : `<div class="tdm-flash-act"><button type="button" class="no" data-err-review="${E(e.id)}|0">✗</button><button type="button" class="ok" data-err-review="${E(e.id)}|1">✓</button></div>`}</div>` : `<button type="button" class="btn btn-ghost" data-flip="err${E(e.id)}">${E(ML('نشان بده', 'Aufdecken', 'Reveal'))}</button>`}</div>`;
    }).join('')}</div>`;
  }
  function ruleLines(rule) {
    const parts = String(rule || '').split(/(?<=\.)\s+(?=[A-ZÄÖÜ„])/).filter(Boolean);
    return `<div class="rule" dir="ltr">${parts.map((p) => { const m = p.match(/^([^:]{2,40}):\s*(.+)$/); return m ? `<p><b>${E(m[1])}:</b> <span class="struct">${E(m[2])}</span></p>` : `<p>${E(p)}</p>`; }).join('')}</div>`;
  }
  const grammarCard = (gr) => `<div class="tdm-grammar"><p class="kicker">${E(ML('گرامر هفته', 'Grammatik der Woche', 'Grammar of the week'))} ${faNum(gr.week)}</p><h3 dir="ltr">${E(gr.title)}</h3>${rtl(`<p><b>${E(gr.fa)}</b></p>`)}${ruleLines(gr.rule)}<ul class="tdm-list" dir="ltr">${gr.forms.map((f) => `<li>${E(f)}</li>`).join('')}</ul>${rtl(`<p class="muted">⚠️ ${E(gr.mistakes)}</p>`)}</div>`;
  function aiSentencesHtml() {
    const w = work(); const r = w.ai?.saetze;
    const head = `<div class="tdm-ai-head">${rtl('<p class="muted">بعد از نوشتن جمله‌ها می‌توانی آن‌ها را به‌صورت خودکار بررسی کنی.</p>')}${kit.aiBtn('saetze', 'data-ai-sentences="1"', ML('بررسی جمله‌ها', 'Sätze prüfen', 'Check sentences'))}</div>`;
    if (!r) return head;
    if (r.error) return head + rtl(`<p class="warn-text">${E(r.error)}</p><p class="muted">${E(ML('تا آن موقع جمله‌ها را با قاعده و مثال گرامر هفته خودت مقایسه کن؛ بعداً دوباره دکمه «بررسی جمله‌ها» را بزن.', 'Vergleiche deine Sätze bis dahin selbst mit der Regel der Woche und versuche es später erneut.', 'Compare your sentences with this week’s grammar rule yourself and try again later.'))}</p>`);
    return head + `<div class="tdm-ai-errors">${(r.results || []).map((x, n) => `<div class="${x.ok ? 'ok' : 'bad'}"><p dir="ltr">${faNum(n + 1)}. ${x.ok ? '✓' : '✗'} <b>${E(x.corrected)}</b>${x.uses_grammar ? ' <small>· Grammatik der Woche ✓</small>' : ''}</p>${x.reason_fa ? rtl(`<p class="muted">${E(x.reason_fa)}</p>`) : ''}</div>`).join('')}</div>`;
  }
  const chk = (key, label) => `<label class="tdm-chk"><input type="checkbox" data-fchk="${key}" ${work().f[key] ? 'checked' : ''} /> ${E(label)}</label>`;

  /* ═════ Grammatik & Wortschatz ═════ */
  function renderWortschatz(a, d, w, steps, i) {
    const key = steps[i].key; const words = rv.dayWords(d);
    if (!eng.V.review) rv.wortschatzEnter(key, d);
    let body = '';
    if (key === 'alt') {
      const list = (w.altKeys || []).map((k2) => M().srs[k2]).filter(Boolean);
      body = card(`${rtl('<h4>یادآوری معنی و کاربرد لغات قبلی بدون نگاه به جزوه</h4><p class="muted">برای هر لغت اول معنی و یک ترکیب کاربردی را در ذهن (یا روی کاغذ) بگو، بعد کارت را باز کن.</p>')}${list.length ? srsCards(list, 'wort') : rtl('<p class="muted">امروز اولین روز است؛ هنوز لغت قبلی وجود ندارد. مستقیم به مرحله بعد برو.</p>')}`);
    } else if (key === 'neu') {
      body = card(`${rtl('<h4>پنج لغت جدید امروز (از متن Lesen امروز)</h4><p class="muted">برای هر لغت: Artikel، Plural، معنی، Wortart، پنج ترکیب و یک جمله نمونه. برای افعال شکل Perfekt هم ثبت شده است. این لغات خودکار وارد دفتر مرور (و خروجی Anki) می‌شوند.</p>')}
        <div class="tdm-words">${words.map((v) => `<article class="tdm-word" dir="ltr"><header><b lang="de">${E((v.artikel ? v.artikel + ' ' : '') + v.wort)}</b><span>${E(v.wortart)}</span>${stars(deckFavoriteItem({ type: 'wort', data: { ...v, koll: arr(v.kollokationen) } }))}</header>
          <dl><dt>Plural</dt><dd>${E(v.plural || '—')}</dd>${v.perfekt ? `<dt>Perfekt</dt><dd>${E(v.perfekt)}</dd>` : ''}<dt>معنی</dt><dd dir="rtl">${E(v.bedeutung_fa)}</dd></dl>
          <p class="tdm-koll">${arr(v.kollokationen).map((c) => `<span>${E(c)}</span>`).join('')}</p><p class="tdm-ex">„${E(v.beispiel)}“</p></article>`).join('')}</div>`);
    } else if (key === 'redemittel') {
      body = card(`${rtl('<h4>پنج Redemittel امروز</h4><p class="muted">ترکیب‌های کاربردی مثل eine Entscheidung treffen · zur Verfügung stehen · in Betracht ziehen</p>')}<div class="tdm-redemittel">${(d.redemittel || []).map((r) => `<article>${stars(deckFavoriteItem({ type: 'redemittel', data: r }))}<b dir="ltr" lang="de">${E(r.de)}</b>${rtl(E(r.fa))}<p dir="ltr" class="muted">${E(r.beispiel || '')}</p></article>`).join('')}</div>`);
    } else if (key === 'saetze') {
      const gr = rv.grammarOfWeek(d.week);
      body = card(grammarCard(gr)) + card(`${rtl(`<h4>با لغات جدید پنج جمله بساز؛ حداقل دو جمله با ساختار «${E(gr.fa.split('(')[0].trim())}».</h4><p class="muted">${E(gr.task)}</p>`)}<p class="tdm-vline" dir="ltr">${words.map((v) => `<span>${E(v.wort)}</span>`).join('')}${(d.redemittel || []).map((r) => `<span class="r">${E(r.de)}</span>`).join('')}</p>
        ${[0, 1, 2, 3, 4].map((n) => `<div class="tdm-satz"><b>${faNum(n + 1)}</b>${kit.inp('satz_' + n, n < 2 ? `Satz mit „${gr.title}“ …` : 'Satz mit einem neuen Wort …')}${chk('satzg_' + n, ML('گرامر هفته', 'Grammatik', 'Grammar'))}</div>`).join('')}${aiSentencesHtml()}`);
    }
    return { body };
  }

  /* ═════ Wiederholung ═════ */
  function renderWiederholung(a, d, w, steps, i) {
    const key = steps[i].key; const k = d.date;
    if (!eng.V.review) rv.wiederholungEnter(key, d);
    let body = '';
    if (key === 'woerter') body = card(`${rtl('<h4>مرور لغات (روز قبل و موارد سررسید ۱-۳-۷-۱۴)</h4>')}${srsCards(uniqSrs((w.dueW || []).map((x) => M().srs[x])), 'wort')}`);
    else if (key === 'grammatik') {
      const list = rv.dueErrorsForReview();
      body = card(`${rtl('<h4>مرور اشتباهات (اول گرامری)</h4><p class="muted">اشتباه را بخوان، شکل درست را به خاطر بیاور، سپس کارت را باز کن.</p>')}${list.length ? errorCardsHtml(list) : rtl('<p class="muted">اشتباه سررسیدی برای مرور وجود ندارد. 👍</p>')}`);
    } else if (key === 'wiedergeben') {
      const pk = rv.prevPracticeDay(k); const pd = pk ? M().days[pk] : null; const h = pd ? eng.item('hoeren', pd.picks.hoeren) : null; const l = pd ? eng.item('lesen', pd.picks.lesen) : null;
      body = pd ? card(`${rtl('<h4>محتوای روز قبل را بدون نگاه به متن بازگو کن (شفاهی یا کتبی).</h4>')}<div class="tdm-grid2"><div class="tdm-mini" dir="ltr"><b>Hören</b><p>${E(h?.title || '—')}</p></div><div class="tdm-mini" dir="ltr"><b>Lesen</b><p>${E(l?.title || '—')}</p></div></div>
          ${kit.recorderHtml('wiedergabe', { label: ML('بازگویی', 'Wiedergabe', 'Retelling'), limit: 120 })}${kit.ta('wiedergabe', 'Gestern habe ich gehört/gelesen, dass …', 3)}
          ${kit.reveal('wmodel', ML('مقایسه با خلاصه‌ها', 'Mit Zusammenfassungen vergleichen', 'Compare with the summaries'), `<p dir="ltr"><b>Hören:</b> ${E(h?.summary_model || '')}</p><p dir="ltr"><b>Lesen:</b> ${E(l?.summary_line || '')}</p>`)}`)
        : card(rtl('<p class="muted">هنوز روز قبلی ثبت نشده است. به‌جای آن، محتوای امروز را تا اینجا در دو یا سه جمله بازگو کن.</p>') + kit.ta('wiedergabe', 'Heute habe ich gelernt, dass …', 3));
    } else if (key === 'redemittel') body = card(`${rtl('<h4>مرور Redemittel</h4>')}${srsCards(uniqSrs((w.dueR || []).map((x) => M().srs[x])), 'redemittel')}`);
    else if (key === 'test') {
      const t = w.quiz || { qs: [], ans: {} };
      body = card(`${rtl('<h4>آزمون از خود بدون جزوه</h4>')}${t.qs.length ? `<div class="tdm-questions">${t.qs.map((q, n) => `<article class="tdm-q ${t.done ? (t.ans[n] === q.answer ? 'ok' : 'bad') : ''}"><p class="tdm-qn">${faNum(n + 1)}</p><div class="tdm-qb"><h4 dir="auto">${E(q.q)}</h4><div class="tdm-opts">${q.options.map((o, oi) => `<button type="button" class="${t.ans[n] === oi ? 'is-sel' : ''} ${t.done && oi === q.answer ? 'is-right' : ''} ${t.done && t.ans[n] === oi && oi !== q.answer ? 'is-wrong' : ''}" data-quiz="${n}|${oi}"><b>${String.fromCharCode(65 + oi)}</b><span dir="ltr">${E(o)}</span></button>`).join('')}</div></div></article>`).join('')}</div>${t.done ? `<div class="tdm-score"><b>${faNum(t.pct)}%</b></div>` : `<button type="button" class="btn btn-primary wide" data-quiz-done="1">${E(ML('ارزیابی', 'Auswerten', 'Check'))}</button>`}`
        : rtl('<p class="muted">برای ساخت آزمون هنوز لغت و Redemittel کافی ذخیره نشده است (از روز دوم فعال می‌شود). به‌جای آن، پنج لغت امروز را بدون نگاه بنویس.</p>') + kit.ta('selftest', '…', 3)}`);
    }
    return { body };
  }

  /* ═════ Fehleranalyse & Wochenbericht ═════ */
  const fmtPct = (v) => (v == null ? '—' : faNum(v) + '%');
  const delta = (a, b) => (a == null || b == null ? '' : `<em class="${a - b >= 0 ? 'up' : 'down'}">${a - b >= 0 ? '▲' : '▼'}${faNum(Math.abs(a - b))}</em>`);
  function compareTable(cur, prev) {
    const rows = [['Hören', 'hoeren'], ['Lesen', 'lesen'], ['Schreiben', 'schreiben'], ['Sprechen', 'sprechen'], [ML('دقیقه مطالعه', 'Lernminuten', 'Study minutes'), 'minutes'], [ML('انجام فعالیت‌ها', 'Erledigt', 'Done'), 'completion'], [ML('اشتباهات ثبت‌شده', 'Fehler', 'Mistakes'), 'errors']];
    const val = (o, k) => (['minutes', 'errors'].includes(k) ? faNum(o[k] ?? '—') : fmtPct(o[k]));
    return `<table class="tbl tdm-compare"><thead><tr><th></th><th>${E(ML('هفته', 'Woche', 'Week'))} ${faNum(cur.week)}</th><th>${prev ? E(ML('هفته', 'Woche', 'Week')) + ' ' + faNum(prev.week) : '—'}</th></tr></thead><tbody>${rows.map(([l, k]) => `<tr><td>${E(l)}</td><td><b>${val(cur, k)}</b> ${prev && k !== 'errors' ? delta(cur[k], prev[k]) : ''}</td><td>${prev ? val(prev, k) : '—'}</td></tr>`).join('')}</tbody></table>`;
  }
  function weeklyHtml(r, part) {
    if (part === 'errors') return `<div class="tdm-ai-errors">${(r.top_errors || []).map((t, n) => `<div><p dir="auto"><b>${faNum(n + 1)}. ${E(t.label)}</b></p>${rtl(`<p>${E(t.explanation_fa)}</p>`)}${t.example_de ? `<p dir="ltr" class="tdm-evq">${E(t.example_de)}</p>` : ''}${t.fix_fa ? rtl(`<p class="muted">🛠 ${E(t.fix_fa)}</p>`) : ''}</div>`).join('')}</div>`;
    return `${r.progress_fa ? rtl(`<p>${E(r.progress_fa)}</p>`) : ''}<div class="tdm-ai-errors">${(r.weaknesses || []).map((x) => `<div>${rtl(`<p><b>${E(x.label_fa)}</b></p><p class="muted">${E(x.evidence_fa)}</p>`)}</div>`).join('')}</div>${(r.plan_fa || []).length ? rtl(`<h4>برنامه پیشنهادی هفته بعد</h4><ol class="tdm-ol">${r.plan_fa.map((p) => `<li>${E(p)}</li>`).join('')}</ol>`) : ''}`;
  }
  function weeklyStatus(d) {
    const st = wk.aiState('week'); const r = work().ai?.week;
    if (rv.weeklyAI(d) || !wk.aiOn()) return '';
    if (st === 'error') return kit.aiFailed('week', r, ML('در این حالت موارد را خودت انتخاب کن.', 'Wähle die Punkte dann selbst aus.', 'Pick the points yourself then.'));
    return kit.aiLoading(ML('هوش مصنوعی در حال تحلیل اشتباه‌ها و نتایج این هفته است…', 'Die KI analysiert deine Woche …', 'The AI is analysing your week…'));
  }
  function renderFehleranalyse(a, d, w, steps, i) {
    const key = steps[i].key; const cur = rv.weekMetrics(d.week); const prev = rv.prevWeek(d.week);
    if (!rv.weeklyAI(d)) wk.autoAI('week', rv.runWeekly);
    if (!eng.V.review) rv.fehleranalyseEnter(key);
    const r = rv.weeklyAI(d);
    let body = '';
    if (key === 'woche') {
      const errs = eng.weekErrors(d.week);
      body = card(`${rtl('<h4>🤖 سه اشتباه پرتکرار این هفته</h4>')}${r ? weeklyHtml(r, 'errors') : weeklyStatus(d)}`, 'tdm-ai')
        + card(`${rtl(`<h4>اشتباهات این هفته (${faNum(errs.length)}) بر اساس دسته</h4><p class="muted">${r ? 'برای مرجع؛ انتخاب سه مورد پرتکرار خودکار انجام شد.' : 'سه مورد پرتکرار را انتخاب کن.'}</p>`)}<div class="tdm-chips big">${cur.cats.map(([l, n]) => `<button type="button" class="${(w.f.top || []).includes(l) ? 'is-sel' : ''}" data-top="${E(l)}">${E(l)} <b>${faNum(n)}</b></button>`).join('') || rtl('<p class="muted">هنوز اشتباهی ثبت نشده است.</p>')}</div>`)
        + card(`<h4 dir="auto">${E(ML('نمونه‌ها', 'Beispiele', 'Examples'))}</h4><div class="tdm-errlist">${errs.slice(-14).reverse().map((e) => `<div><small>${E(e.category)}</small><p dir="ltr">${E(e.userAnswer || e.question)} → <b>${E(e.correctAnswer)}</b></p></div>`).join('') || '—'}</div>`);
    } else if (key === 'wiederholung') {
      body = card(`${rtl('<h4>مرور همه موارد سررسید (لغات و Redemittel)</h4><p class="muted">جمعه روز یادگیری مطالب جدید نیست؛ روز ارزیابی و تثبیت است.</p>')}${srsCards((w.dueAll || []).map((x) => M().srs[x]).filter(Boolean), 'wort')}`);
    } else {
      body = card(`${rtl('<h4>مقایسه نتایج با هفته قبل</h4>')}${compareTable(cur, prev)}`)
        + card(`${rtl('<h4>🤖 سه ضعف اصلی و برنامه هفته بعد</h4>')}${r ? weeklyHtml(r, 'weak') : weeklyStatus(d)}`, 'tdm-ai')
        + card(`${rtl(r ? '<h4>سه ضعف اصلی (خودکار پر شد؛ قابل ویرایش)</h4>' : '<h4>سه ضعف اصلی برای هفته آینده</h4>')}${[0, 1, 2].map((n) => kit.inp('weak_' + n, `${n + 1}. …`)).join('')}`);
    }
    return { body };
  }
  function renderWochenbericht(a, d, w, steps, i) {
    const cur = rv.weekMetrics(d.week); const prev = rv.prevWeek(d.week); const saved = M().weekly['W' + d.week]; const adv = rv.phaseAdvice(cur);
    if (!rv.weeklyAI(d)) wk.autoAI('week', rv.runWeekly);
    if (!eng.V.review) rv.prefillReport(d);
    const ai = rv.weeklyAI(d);
    const body = card(`<div class="tdm-report-head"><div><p class="kicker">${E(d.week === 0 ? ML('گزارش وضعیت اولیه (Diagnose)', 'Ausgangslage', 'Starting point') : ML('گزارش هفتگی', 'Wochenbericht', 'Weekly report'))}</p><h3 dir="auto">${E(ML('هفته ارزیابی', 'Woche', 'Week'))}: ${faNum(d.week)} <small>${E(cur.from)} → ${E(cur.to)}</small></h3></div>${saved ? `<span class="chip is-on">✓ ${E(ML('ذخیره شد', 'Gespeichert', 'Saved'))}</span>` : ''}</div>
        <div class="tdm-out four"><div><small>${E(ML('درصد موفقیت Hören', 'Hören', 'Hören'))}</small><b>${fmtPct(cur.hoeren)}</b>${delta(cur.hoeren, prev?.hoeren)}</div><div><small>${E(ML('درصد موفقیت Lesen', 'Lesen', 'Lesen'))}</small><b>${fmtPct(cur.lesen)}</b>${delta(cur.lesen, prev?.lesen)}</div><div><small>${E(ML('ارزیابی Schreiben', 'Schreiben', 'Schreiben'))}</small><b>${fmtPct(cur.schreiben)}</b>${delta(cur.schreiben, prev?.schreiben)}</div><div><small>${E(ML('ارزیابی Sprechen', 'Sprechen', 'Sprechen'))}</small><b>${fmtPct(cur.sprechen)}</b>${delta(cur.sprechen, prev?.sprechen)}</div></div>
        ${rtl('<p class="muted">Schreiben: گرامر، واژگان، انسجام و انجام وظیفه · Sprechen: روانی، دقت، ساختار و انجام وظیفه (میانگین خودارزیابی ۱ تا ۵ × ۲۰)</p>')}`)
      + (ai ? card(`${rtl('<h4>🤖 خلاصه هوشمند هفته</h4>')}${weeklyHtml(ai, 'weak')}`, 'tdm-ai') : wk.aiOn() ? card(weeklyStatus(d), 'tdm-ai') : '')
      + card(`${rtl(ai ? '<h4>سه اشتباه پرتکرار (خودکار پر شد؛ قابل ویرایش)</h4>' : '<h4>سه اشتباه پرتکرار</h4>')}${[0, 1, 2].map((n) => kit.inp('freq_' + n, `${n + 1}.`)).join('')}
        ${rtl('<h4>سه ضعف اصلی</h4>')}${[0, 1, 2].map((n) => kit.inp('weak_' + n, `${n + 1}.`)).join('')}
        ${rtl('<h4>هدف هفته آینده</h4>')}${kit.ta('goal', 'Nächste Woche will ich …', 2)}
        ${rtl(`<h4>معیار موفقیت</h4><p class="muted">${E(eng.ST().success)}</p>`)}${kit.ta('success', ML('این هفته توانستم … که هفته قبل برایم سخت بود.', 'Diese Woche konnte ich …', 'This week I could …'), 2)}
        <button type="button" class="btn btn-primary wide" data-save-report="1">💾 ${E(ML('ذخیره گزارش هفتگی', 'Bericht speichern', 'Save the weekly report'))}</button>`)
      + card(`${rtl('<h4>مقایسه با هفته قبل</h4>')}${compareTable(cur, prev)}`)
      + (adv ? card(`<h4>Phase ${faNum(M().phase)} · ${E(ML('توصیه برای هفته بعد', 'Empfehlung', 'Recommendation'))}</h4>${rtl(`<p>${E(adv.text)}</p>`)}${adv.to ? `<button type="button" class="btn btn-primary" data-phase-to="${adv.to}">${E(ML('ورود به', 'Wechsel zu', 'Switch to'))} Phase ${faNum(adv.to)}</button>` : ''}`) : '');
    return { body };
  }

  /* ═════ Extra-Lernzeit ═════ */
  function sxRow(key, n, head, st, model) {
    const w = work(); const f = 'sx_' + key + '_' + n; const ok = w.f['sxok_' + key + '_' + n];
    return `<article class="tdm-sx ${ok ? 'is-ok' : ''}"><header><b class="tdm-sx-n">${faNum(n + 1)}</b><div class="tdm-sx-item">${head}</div></header>
      <p class="tdm-sx-st"><span class="struct" dir="ltr">${E(st.t)}</span> <small dir="rtl">${E(st.fa)}</small></p><p class="tdm-sx-pat" dir="ltr">${E(st.p)}</p>
      ${kit.ta(f, ML('جمله خودت را بنویس…', 'Dein Satz …', 'Your sentence …'), 2)}
      ${kit.reveal('sx' + key + n, ML('جمله‌های نمونه', 'Mustersätze', 'Model sentences'), `<p dir="ltr"><b>${E(st.t)}:</b> ${E(st.ex)}</p>${model ? `<p dir="ltr" class="muted">${model}</p>` : ''}`)}
      ${chk('sxok_' + key + '_' + n, ML('جمله‌ام با ساختار درست بود', 'Mein Satz passt zur Struktur', 'My sentence fits the structure'))}</article>`;
  }
  function renderExtra(a, d, w, steps, i) {
    const key = steps[i].key; const m = M();
    if (!eng.V.review) rv.extraEnter(d);
    const sx = w.sx || { woerter: [], redemittel: [], fehler: [] };
    const intro = (fa) => rtl(`<h4>${fa}</h4><p class="muted">برای هر مورد یک جمله کامل با ساختار داده‌شده بنویس. بعد جمله‌های نمونه را باز کن و جمله خودت را با آن‌ها مقایسه کن.</p>`);
    let rows = ''; let title = '';
    if (key === 'woerter') {
      title = 'جمله‌سازی با لغات مرور امروز';
      rows = (sx.woerter || []).map((p) => ({ p, x: m.srs[p.key] })).filter((o) => o.x).map((o, n) => { const x = o.x.data || {}; return sxRow('w', n, `<b dir="ltr" lang="de">${E((x.artikel ? x.artikel + ' ' : '') + (x.wort || ''))}</b> <small dir="rtl">${E(x.bedeutung_fa || '')}</small>`, sxSt(o.p.st), x.beispiel ? E(x.beispiel) : ''); }).join('');
    } else if (key === 'redemittel') {
      title = 'جمله‌سازی با Redemittel مرور امروز';
      rows = (sx.redemittel || []).map((p) => ({ p, x: m.srs[p.key] })).filter((o) => o.x).map((o, n) => { const x = o.x.data || {}; return sxRow('r', n, `<b dir="ltr" lang="de">${E(x.de || '')}</b> <small dir="rtl">${E(x.fa || '')}</small>`, sxSt(o.p.st), x.beispiel ? E(x.beispiel) : ''); }).join('');
    } else {
      title = 'شکل درستِ اشتباهات را در جمله تازه به کار ببر';
      const list = (sx.fehler || []).map((p) => ({ p, e: (eng.S.errors || []).find((e) => e.id === p.id) })).filter((o) => o.e);
      rows = list.length ? list.map((o, n) => sxRow('f', n, `<small dir="ltr" class="tdm-sx-wrong">✗ ${E(o.e.userAnswer || o.e.question || '')}</small> <b dir="ltr">✓ ${E(o.e.correctAnswer || '')}</b>${o.e.explanation ? `<small dir="auto" class="muted">${E(o.e.explanation)}</small>` : ''}`, sxSt(o.p.st), '')).join('')
        : [0, 1, 2].map((n) => sxRow('f', n, `<b>${E(ML('ساختار آزاد', 'Freie Struktur', 'Free structure'))}</b>`, SX_STRUCT[(n * 4 + 2) % SX_STRUCT.length], '')).join('');
    }
    return { body: card(intro(title) + (rows || rtl('<p class="muted">هنوز موردی برای این مرحله نیست؛ لغات و Redemittel از فعالیت «Grammatik & Wortschatz» وارد دفتر می‌شوند. این مرحله را رد کن.</p>'))) };
  }

  void CATS;
  return { wortschatz: renderWortschatz, wiederholung: renderWiederholung, fehleranalyse: renderFehleranalyse, wochenbericht: renderWochenbericht, extra: renderExtra };
}
