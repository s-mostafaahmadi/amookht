// Schreiben (Argumentation / Grafik; method and exam mode, AI correction, Fehlerprotokoll) and Sprechen
// (prep → speak → analyse → repeat per task; exam mode with prep countdown and automatic recording) —
// hand port of renderSchreiben / renderSprechen / renderSprechenExam from the site engine.

import { ML, faNum, mmss, arr } from '../../core/engine.js';
import { CATS, wordsIn } from '../../core/work.js';
import { E, rtl, card } from './kit.js';

const SC_NAMES = { fluss: 'Flüssigkeit', genau: 'Genauigkeit', struktur: 'Struktur', aufgabe: 'Aufgabe' };

export function makeSchreibenSprechen(env) {
  const { eng, wk, kit, media } = env;
  const work = () => eng.work();

  /* ═════════ Schreiben ═════════ */
  function chartSvg(c) {
    if (!c?.labels?.length) return '';
    const W = 640; const H = 300; const padL = 52; const padB = 58; const padT = 18; const padR = 14; const series = c.series || []; const all = series.flatMap((s) => s.values);
    const rawMax = Math.max(...all, 0) || 1; const mag = 10 ** Math.floor(Math.log10(rawMax / 4)); const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s * 4 >= rawMax * 1.08) || mag * 10; const max = step * 4;
    const x0 = padL; const y0 = H - padB; const cw = W - padL - padR; const ch = H - padB - padT; const colors = ['#6366f1', '#f59e0b'];
    const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('de-DE');
    let g = '';
    for (let t = 0; t <= 4; t += 1) { const v = (max / 4) * t; const y = y0 - (ch * t) / 4; g += `<line x1="${x0}" x2="${W - padR}" y1="${y}" y2="${y}" class="grid"/><text x="${x0 - 6}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`; }
    const n = c.labels.length; const slot = cw / n;
    if (c.type === 'line') {
      series.forEach((s, si) => { const pts = s.values.map((v, k) => [x0 + slot * (k + 0.5), y0 - (ch * v) / max]); g += `<polyline fill="none" stroke="${colors[si]}" stroke-width="3" points="${pts.map((p) => p.join(',')).join(' ')}"/>` + pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${colors[si]}"/><text x="${p[0]}" y="${p[1] - 9}" text-anchor="middle" class="val">${fmt(s.values[k])}</text>`).join(''); });
    } else {
      const bw = Math.min(46, (slot * 0.7) / Math.max(1, series.length));
      series.forEach((s, si) => s.values.forEach((v, k) => { const x = x0 + slot * k + slot / 2 - (bw * series.length) / 2 + bw * si; const h = (ch * v) / max; g += `<rect x="${x}" y="${y0 - h}" width="${bw - 3}" height="${h}" rx="4" fill="${colors[si]}"/><text x="${x + (bw - 3) / 2}" y="${y0 - h - 5}" text-anchor="middle" class="val">${fmt(v)}</text>`; }));
    }
    c.labels.forEach((l, k) => { g += `<text x="${x0 + slot * (k + 0.5)}" y="${y0 + 16}" text-anchor="middle" class="lab">${E(String(l).length > 16 ? String(l).slice(0, 15) + '…' : l)}</text>`; });
    const legend = series.length > 1 || series[0]?.name ? `<div class="tdm-legend">${series.map((s, si) => `<span><i style="background:${colors[si]}"></i>${E(s.name)}</span>`).join('')}</div>` : '';
    return `<figure class="tdm-chart" dir="ltr"><figcaption><b>${E(c.title)}</b><small>${E(c.unit)} · ${E(c.source || 'fiktive Daten')}</small></figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${E(c.title)}"><line x1="${x0}" x2="${W - padR}" y1="${y0}" y2="${y0}" class="axis"/>${g}</svg>${legend}</figure>`;
  }
  function essayBox(min, max) {
    const w = work(); const n = wordsIn(w.f.text || '');
    return `<div class="tdm-essay"><textarea id="tdmEssay" dir="ltr" lang="de" rows="16" class="tdm-input" spellcheck="false" data-essay="1" placeholder="Schreiben Sie hier …">${E(w.f.text || '')}</textarea><div dir="auto" class="tdm-wc ${n >= min ? 'is-ok' : ''}">${E(ML('تعداد کلمات', 'Wörter', 'Words'))}: <b id="tdmWc" data-min="${min}">${faNum(n)}</b> · ${E(ML('هدف', 'Ziel', 'Target'))}: ${faNum(min)}${max ? '–' + faNum(max) : '+'}</div></div>`;
  }
  const phraseChips = (list) => `<div class="tdm-phrases" dir="ltr">${list.map((p) => `<button type="button" data-insert="${E(' ' + String(p.de || p).replace(/\s*\.\.\.\s*$|\s*…\s*$/, ' ').trim() + ' ')}" title="${E(p.fa || '')}">${E(p.de || p)}</button>`).join('')}</div>`;
  function aiWritingHtml() {
    if (!wk.aiOn()) return '';
    const w = work(); const st = wk.aiState('writing'); const r = w.ai?.writing;
    const head = `<div class="tdm-ai-head">${rtl('<h4>🤖 تصحیح هوشمند متن تو</h4>')}${st === 'done' ? kit.aiBtn('writing', 'data-ai-writing="1"', ML('تحلیل دوباره', 'Erneut analysieren', 'Analyse again')) : ''}</div>`;
    if (st === 'busy') return card(head + kit.aiLoading(ML('متن در حال تصحیح است…', 'Dein Text wird korrigiert …', 'Correcting your text…')), 'tdm-ai');
    if (st === 'none') return card(head + (wordsIn(w.f.text) < 20 ? rtl('<p class="muted">برای تصحیح خودکار، اول در مرحله «Schreiben» متن را بنویس (حداقل ۲۰ کلمه).</p>') : kit.aiLoading(ML('در حال آماده‌سازی…', 'Wird vorbereitet …', 'Preparing…'))), 'tdm-ai');
    if (st === 'error') return card(head + kit.aiFailed('writing', r, ML('تا آن موقع نمره‌ها و Fehlerprotokoll را خودت پر کن.', 'Bewerte dann selbst und fülle das Fehlerprotokoll aus.', 'Meanwhile rate it yourself and fill in the error log.')), 'tdm-ai');
    const labels = { grammatik: 'Grammatik', wortschatz: 'Wortschatz', konnektoren: 'Konnektoren', struktur: 'Struktur', aufgabe: 'Aufgabenbezug' };
    const changed = r.words && Math.abs(wordsIn(w.f.text) - r.words) > 5;
    return card(head + `${changed ? rtl(`<p class="warn-text">${E(ML('متن بعد از تحلیل تغییر کرده است؛ برای نتیجه جدید «تحلیل دوباره» را بزن.', 'Der Text wurde nach der Analyse geändert; für ein neues Ergebnis erneut analysieren.', 'The text changed after the analysis; analyse again for a new result.'))}</p>`) : ''}<div class="tdm-ai-scores">${Object.entries(r.scores || {}).map(([k, v]) => `<div><small>${labels[k] || k}</small><b>${faNum(v)}/۵</b></div>`).join('')}<div class="tdm-ai-tdn"><small>${E(ML('تخمین سطح', 'Einschätzung', 'Estimate'))}</small><b dir="ltr">${E(r.tdn)}</b></div></div>
      ${rtl(`<p>${E(r.summary_fa)}</p>`)}
      ${(r.errors || []).length ? `<h4 dir="auto">${E(ML('اشتباهات مهم (سه مورد اول خودکار در Fehlerprotokoll ثبت شد)', 'Wichtige Fehler', 'Important mistakes'))}</h4><div class="tdm-ai-errors">${r.errors.map((e, i) => `<div><p dir="ltr"><s>${E(e.wrong)}</s> → <b>${E(e.right)}</b> <small>${E(labels[e.category] || '')}</small></p>${rtl(`<p class="muted">${E(e.reason_fa)}</p>`)}${i >= 3 ? `<button type="button" class="btn btn-ghost small" data-ai-proto="${i}">＋ Fehlerprotokoll</button>` : ''}</div>`).join('')}</div>` : ''}
      ${(r.improved || []).length ? `<h4 dir="auto">${E(ML('جمله‌های بهتر', 'Bessere Formulierungen', 'Better phrasing'))}</h4>${r.improved.map((x) => `<p dir="ltr"><span class="muted">${E(x.original)}</span><br>→ <b>${E(x.better)}</b></p>`).join('')}` : ''}
      ${r.tip_fa ? `<aside class="tdm-rule">${rtl('💡 ' + E(r.tip_fa))}</aside>` : ''}`, 'tdm-ai');
  }
  function protokollHtml(byAI) {
    const w = work();
    return card(`${rtl(byAI ? '<h4>Fehlerprotokoll (خودکار از تصحیح هوشمند پر شد)</h4><p class="muted">سه اشتباه مهم با اصلاح و علت؛ در بخش «اشتباهات» ذخیره و بعداً مرور می‌شوند. در صورت نیاز ویرایش کن.</p>' : '<h4>Fehlerprotokoll: حداکثر سه اشتباه مهم را با اصلاح و علت ثبت کن.</h4><p class="muted">این موارد در بخش «اشتباهات» ذخیره می‌شوند و در روزهای بعد مرور خواهند شد.</p>')}
      ${[0, 1, 2].map((r) => `<div class="tdm-fp"><b>${faNum(r + 1)}</b><input dir="ltr" class="tdm-input" data-f="fp_wrong_${r}" placeholder="✗ falsch" value="${E(w.f['fp_wrong_' + r] || '')}" /><input dir="ltr" class="tdm-input" data-f="fp_right_${r}" placeholder="✓ richtig" value="${E(w.f['fp_right_' + r] || '')}" /><input dir="auto" class="tdm-input" data-f="fp_why_${r}" placeholder="${E(ML('علت / قاعده', 'Grund / Regel', 'Reason / rule'))}" value="${E(w.f['fp_why_' + r] || '')}" />${kit.catChips('schreiben', 'fp_' + r)}</div>`).join('')}`);
  }
  function korrekturHtml(it, d, isGrafik) {
    const w = work();
    const crit = [['grammatik', 'Grammatik', 'فعل در جای درست؟ صرف فعل، حالت‌ها و پایانه صفت‌ها درست است؟'], ['wortschatz', 'Wortschatz', 'واژگان دقیق و متنوع؟ تکرار کمتر؟ Redemittel امروز استفاده شد؟'], ['konnektoren', 'Konnektoren', 'از حروف ربط (deshalb, außerdem, allerdings, folglich…) برای اتصال جمله‌ها استفاده شد؟'], ['struktur', 'Struktur', isGrafik ? 'مقدمه (عنوان/واحد) ← روند و مقادیر ← اطلاعات متن ← نتیجه؟' : 'Einleitung، Hauptteil، Gegenargument، Meinung و Schluss وجود دارد؟'], ['aufgabe', 'Aufgabenbezug', 'همه بخش‌های خواسته‌شده در دستور کار پاسخ داده شد؟']];
    if (wordsIn(w.f.text) >= 20) wk.autoAI('writing', wk.aiWriting);
    const byAI = wk.aiState('writing') === 'done';
    return aiWritingHtml()
      + card(`${rtl(byAI ? '<h4>نمره‌ها (پیشنهاد هوش مصنوعی؛ اگر لازم بود تغییر بده)</h4>' : '<h4>متن را از نظر این معیارها بررسی کن و به هر کدام از ۱ تا ۵ نمره بده:</h4>')}${crit.map(([k, de, fa]) => kit.rating('k_' + k, de, fa)).join('')}`)
      + protokollHtml(byAI)
      + card(`<h4 dir="auto">${E(ML('متن من', 'Mein Text', 'My text'))}</h4>${essayBox(isGrafik ? 100 : eng.mwOf(d), isGrafik ? 150 : 0)}`)
      + card(kit.reveal('smodel', ML('متن نمونه برای مقایسه', 'Mustertext zum Vergleich', 'Model text to compare'), `<div class="tdm-modeltext" dir="ltr" lang="de"><p>${E(it.model_text).replace(/\n\n/g, '</p><p>')}</p></div>`));
  }
  function renderSchreiben(a, d, w, steps, i) {
    const pk = d.picks?.schreiben; const it = pk ? eng.item(pk.kind, pk.id) : null;
    if (!it) return { body: card('—') };
    const key = steps[i].key; const isG = pk.kind === 'grafik'; const exam = d.mode !== 'normal'; const st = eng.ST();
    const P = eng.OSD(); const AL = P?.anaLabels?.(it) || ['Problem', 'Vorteile', 'Nachteile', 'Betroffene'];
    const taskCard = isG
      ? card(`<div class="tdm-item-head"><span class="chip">Grafik und Zusammenfassung</span><h3 dir="ltr" lang="de">${E(it.title)}</h3></div>${chartSvg(it.chart)}<div class="tdm-source" dir="ltr" lang="de"><b>Text:</b> ${E(it.text)}</div><p class="tdm-task" dir="ltr" lang="de">${E(it.task)}</p>`)
      : card(`<div class="tdm-item-head"><span class="chip">${E(it.formatLabel || 'Argumentation')}</span><h3 dir="ltr" lang="de">${E(it.title)}</h3></div><p dir="ltr" lang="de">${E(it.situation)}</p>${it.material ? `<pre class="tdm-material" dir="ltr">${E(it.material)}</pre>` : ''}<div class="tdm-positions" dir="ltr" lang="de">${arr(it.positions).map((p) => `<blockquote><b>${E(p.person)}:</b> „${E(p.text)}“</blockquote>`).join('')}</div><p class="tdm-task" dir="ltr" lang="de">${E(it.task)}</p>`);
    const field = ([k, de, fa]) => `<label class="tdm-field"><span>${de} <small dir="rtl">${fa}</small></span>${kit.ta(k, '…', 2)}</label>`;
    let body = '';
    let opts = {};
    if (key === 'analyse' && !isG) {
      body = taskCard + card(`${rtl('<h4>تحلیل (۵ دقیقه)</h4>')}<div class="tdm-grid2">${(P?.anaFields?.(it) || [['a_problem', 'Was ist das Problem?', 'مسئله چیست؟'], ['a_vorteile', 'Vorteile', 'مزایا'], ['a_nachteile', 'Nachteile', 'معایب'], ['a_betroffene', 'Wer ist betroffen?', 'چه کسانی تحت تأثیر قرار می‌گیرند؟'], ['a_meinung', 'Meine Meinung', 'نظر شخصی من']]).map(field).join('')}</div>
        ${kit.reveal('sana', ML('راهنمای تحلیل', 'Analysehilfe', 'Analysis help'), `<div dir="ltr" class="tdm-grid2"><div class="tdm-mini"><b>${E(AL[0])}</b><p>${E(it.analysis?.problem)}</p></div><div class="tdm-mini"><b>${E(AL[1])}</b><p>${E(arr(it.analysis?.vorteile).join(' · '))}</p></div><div class="tdm-mini"><b>${E(AL[2])}</b><p>${E(arr(it.analysis?.nachteile).join(' · '))}</p></div><div class="tdm-mini"><b>${E(AL[3])}</b><p>${E(arr(it.analysis?.betroffene).join(' · '))}</p></div></div>`)}`);
    } else if (key === 'analyse' && isG) {
      body = taskCard + card(`${rtl('<h4>مراحل تحلیل نمودار</h4>')}${[['g_titel', '1. Titel und Maßeinheit', 'عنوان نمودار و واحد اندازه‌گیری'], ['g_maxmin', '2. Höchster und niedrigster Wert', 'بیشترین و کمترین مقدار'], ['g_trend', '3. Allgemeiner Trend', 'روند کلی'], ['g_text', '4. Informationen aus dem Text', 'اطلاعات متن همراه نمودار'], ['g_vergleich', '5. Gemeinsamkeiten und Unterschiede', 'شباهت‌ها و تفاوت‌ها']].map(field).join('')}
        ${kit.reveal('gana', ML('تحلیل نمونه', 'Musteranalyse', 'Model analysis'), `<ul class="tdm-list" dir="ltr">${Object.entries(it.analysis || {}).map(([k, v]) => `<li><b>${E(k.replace('_', ' / '))}:</b> ${E(v)}</li>`).join('')}</ul>`)}
        ${kit.ruleBox('نکته: اطلاعات متن و نمودار باید با یکدیگر ترکیب شوند.')}`);
    } else if (key === 'gliederung') {
      body = taskCard + card(`${rtl('<h4>ساختار متن (فقط کلیدواژه)</h4>')}${(P?.outFields?.(it) || [['o_einleitung', 'Einleitung', 'مقدمه'], ['o_hauptteil', 'Hauptteil: Argumente', 'استدلال‌ها'], ['o_gegen', 'Gegenargument', 'دیدگاه مخالف'], ['o_meinung', 'Eigene Meinung', 'نظر شخصی'], ['o_schluss', 'Schluss', 'نتیجه‌گیری']]).map(field).join('')}
        ${kit.reveal('sout', ML('طرح نمونه', 'Mustergliederung', 'Model outline'), `<ul class="tdm-list" dir="ltr">${Object.entries(it.outline || {}).map(([k, v]) => `<li><b>${E(k)}:</b> ${E(Array.isArray(v) ? v.join(' · ') : v)}</li>`).join('')}</ul>`)}`);
    } else if (key === 'schreiben') {
      const min = isG ? 100 : eng.mwOf(d); const max = isG ? 150 : 0;
      const outline = !isG && !exam ? `<div class="tdm-outline-mini" dir="ltr">${['o_einleitung', 'o_hauptteil', 'o_gegen', 'o_meinung', 'o_schluss'].map((k) => (w.f[k] ? `<span>${E(w.f[k])}</span>` : '')).join('')}</div>` : '';
      const scaffold = isG
        ? card(`<h4 dir="auto">${E(ML('عبارت‌های کاربردی', 'Redemittel', 'Useful phrases'))}</h4><table class="tbl" dir="ltr">${(st.grafikPhrases || []).map(([de, fa]) => `<tr><td>${E(de)}</td><td dir="rtl">${E(fa)}</td></tr>`).join('')}</table>${phraseChips(arr(it.redemittel))}`, 'compact')
        : card(`${rtl('<h4>برای هر پاراگراف: Behauptung (ادعا) ← Begründung (دلیل) ← Beispiel (مثال) ← Konsequenz (نتیجه)</h4>')}${outline}<p class="muted">${E(ML('روی عبارت بزن تا در محل مکان‌نما درج شود:', 'Zum Einfügen antippen:', 'Click a phrase to insert it at the cursor:'))}</p>${phraseChips([...arr(it.connectors).map((c) => ({ de: c })), ...(d.redemittel || [])])}`, 'compact');
      body = taskCard + scaffold + card(essayBox(min, max));
      if (exam) opts = { countdown: {} };
    } else if (key === 'korrektur' || key === 'protokoll') body = korrekturHtml(it, d, isG);
    return { body, ...opts };
  }

  /* ═════════ Sprechen ═════════ */
  function taskCardHtml(it, o = {}) {
    const g = eng.ST().speakingTypes[it.type] || {};
    return card(`<div class="tdm-item-head"><span class="chip">${E(it.typeLabel)}</span><h3 dir="ltr" lang="de">${E(it.title)}</h3><p class="muted small">${E(ML('آماده‌سازی', 'Vorbereitung', 'Preparation'))} ${faNum(it.prep)}s · ${E(ML('صحبت', 'Sprechzeit', 'Speaking'))} ${faNum(it.speak)}s</p></div>
      <p dir="ltr" lang="de">${E(it.situation)}</p><p class="tdm-task" dir="ltr" lang="de">${E(it.task)}</p>${it.material ? `<pre class="tdm-material" dir="ltr">${E(it.material)}</pre>` : ''}
      ${o.guide !== false ? rtl(`<p class="muted"><b>${E(g.fa || '')}:</b> ${E(g.how || '')}</p>`) : ''}`);
  }
  function speakCompare(t) {
    const w = work(); const a = w.ai?.['sp_try1_' + t]; const b = w.ai?.['sp_try2_' + t];
    if (!a?.scores || !b?.scores) return '';
    const row = (label, x, y, higherBetter = true) => { const dlt = (y ?? 0) - (x ?? 0); const good = higherBetter ? dlt > 0 : dlt < 0; return `<tr><td>${label}</td><td>${x == null ? '—' : faNum(x)}</td><td><b>${y == null ? '—' : faNum(y)}</b> ${dlt ? `<em class="${good ? 'up' : 'down'}">${dlt > 0 ? '▲' : '▼'}${faNum(Math.abs(dlt))}</em>` : ''}</td></tr>`; };
    return `<h4 dir="auto">${E(ML('مقایسه اجرای اول و دوم', 'Versuch 1 und 2 im Vergleich', 'Attempt 1 vs 2'))}</h4><table class="tbl tdm-compare"><thead><tr><th></th><th>${E(ML('اول', '1', '1'))}</th><th>${E(ML('دوم', '2', '2'))}</th></tr></thead><tbody>${Object.keys(SC_NAMES).map((k) => row(SC_NAMES[k], a.scores[k], b.scores[k])).join('')}${row(E(ML('کلمه در دقیقه', 'Wörter/Min.', 'Words/min')), a.wpm, b.wpm)}${row(E(ML('مکث طولانی', 'Lange Pausen', 'Long pauses')), a.long_pauses, b.long_pauses, false)}</tbody></table>`;
  }
  const ratings4 = (t) => `${kit.rating(`s${t}_fluss`, 'Flüssigkeit', 'روانی')}${kit.rating(`s${t}_genau`, 'Genauigkeit', 'دقت گرامری و واژگانی')}${kit.rating(`s${t}_struktur`, 'Struktur', 'ساختار')}${kit.rating(`s${t}_aufgabe`, 'Aufgabenerfüllung', 'انجام وظیفه')}`;
  function renderSprechen(a, d, w, steps, i) {
    const st = steps[i]; const [kind, tStr] = st.key.split(':'); const t = Number(tStr) || 0;
    if (d.mode !== 'normal') return renderSprechenExam(a, d, w, steps, i);
    const it = wk.speakTask(d, t);
    if (!it) return { body: card('—') };
    const g = eng.ST().speakingTypes[it.type] || {};
    let body = '';
    if (kind === 'prep') {
      body = taskCardHtml(it) + card(`${rtl('<h4>فقط کلمات کلیدی را یادداشت کن — جمله کامل ننویس.</h4><p class="muted">مثلاً: Berufserfahrung · finanzielle Unabhängigkeit · Zeitmanagement · Stress</p>')}${kit.ta('kw_' + t, 'Stichwort · Stichwort · …', 3)}
        ${kit.reveal('sphelp' + t, ML('کمک: کلیدواژه‌ها، ساختار و Redemittel', 'Hilfe: Stichwörter, Aufbau, Redemittel', 'Help: keywords, structure, phrases'), `<p dir="ltr"><b>Stichwörter:</b> ${E(arr(it.keywords).join(' · '))}</p><ol class="tdm-list" dir="ltr">${arr(it.structure).map((s) => `<li>${E(s)}</li>`).join('')}</ol><div class="tdm-vmini" dir="ltr">${[...(g.phrases || []).map((p) => ({ de: p })), ...arr(it.redemittel)].slice(0, 8).map((r) => `<span><b>${E(r.de)}</b>${r.fa ? `<small dir="rtl">${E(r.fa)}</small>` : ''}</span>`).join('')}</div>`)}`);
    } else if (kind === 'speak') {
      body = taskCardHtml(it, { guide: false }) + card(`${w.f['kw_' + t] ? `<p class="tdm-kwline" dir="ltr">🗝 ${E(w.f['kw_' + t])}</p>` : ''}${rtl('<h4>سه نوع تمرین را در صحبتت پوشش بده:</h4><ol class="tdm-ol"><li>بیان نظر شخصی</li><li>بیان مزایا و معایب</li><li>نتیجه‌گیری</li></ol>')}${kit.recorderHtml('try1_' + t, { label: ML('اجرای اول', 'Versuch 1', 'Attempt 1'), limit: it.speak })}`);
    } else if (kind === 'analyse') {
      const rec1 = w.rec['try1_' + t]; const byAI = wk.aiState('sp_try1_' + t) === 'done';
      body = card(`${rtl('<h4>اجرای اول را گوش بده؛ تحلیل آن خودکار انجام می‌شود.</h4>')}${rec1 ? kit.recAudio(rec1) : rtl('<p class="warn-text">هنوز ضبطی برای اجرای اول وجود ندارد؛ به مرحله قبل برگرد و صحبت کن.</p>')}`)
        + (rec1 && wk.aiOn() ? card(kit.aiSpeakingHtml('try1_' + t, t, { taskItem: it, title: ML('تحلیل خودکار اجرای اول', 'Analyse von Versuch 1', 'Analysis of attempt 1'), manualHint: ML('تا آن موقع چک‌لیست زیر را خودت پر کن.', 'Fülle bis dahin die Checkliste selbst aus.', 'Meanwhile fill in the checklist yourself.') }), 'tdm-ai') : '')
        + card(`${rtl(byAI ? '<h4>مشکلات شناسایی‌شده (خودکار؛ در صورت نیاز اصلاح کن)</h4>' : '<h4>صدای خودت را بررسی کن (اگر رخ داد ✓ بزن):</h4>')}${CATS.sprechen.map(([id, de, fa]) => kit.selfCheck(`sp:${t}:${id}`, `${fa} (${de})`, true)).join('')}
          ${byAI ? '' : `<label class="tdm-label" dir="auto">${E(ML('یادداشت اصلاحی (جمله درست، ساختار بهتر)', 'Korrekturnotiz', 'Correction note'))}</label>${kit.ta('an_note_' + t, 'Statt „…“ besser: „…“', 2)}`}`)
        + card(kit.reveal('spmodel' + t, ML('پاسخ نمونه و Redemittel برای مقایسه', 'Musterantwort & Redemittel', 'Model answer & phrases'), `<p dir="ltr" lang="de">${E(it.model_answer)}</p><div class="tdm-vmini" dir="ltr">${arr(it.redemittel).map((r) => `<span><b>${E(r.de)}</b><small dir="rtl">${E(r.fa)}</small></span>`).join('')}</div>`));
    } else if (kind === 'repeat') {
      const rec2 = w.rec['try2_' + t]; const byAI = wk.aiState('sp_try2_' + t) === 'done';
      body = card(`${rtl('<h4>همان موضوع را بدون نگاه به یادداشت‌ها دوباره توضیح بده.</h4><p class="muted">اگر جمله‌ای را فراموش کردی، از ساختار دیگری برای انتقال مفهوم استفاده کن.</p>')}<p class="tdm-task" dir="ltr" lang="de">${E(it.task)}</p>${kit.recorderHtml('try2_' + t, { label: ML('اجرای دوم', 'Versuch 2', 'Attempt 2'), limit: it.speak })}`)
        + (rec2 && wk.aiOn() ? card(kit.aiSpeakingHtml('try2_' + t, t, { taskItem: it, title: ML('تحلیل خودکار اجرای دوم', 'Analyse von Versuch 2', 'Analysis of attempt 2') }) + speakCompare(t), 'tdm-ai') : '')
        + card(`${rtl(byAI ? '<h4>نمره اجرای دوم (از تحلیل خودکار؛ قابل تغییر)</h4>' : '<h4>ارزیابی اجرای دوم (۱ تا ۵)</h4>')}${ratings4(t)}`);
    }
    return { body };
  }
  function renderSprechenExam(a, d, w, steps, i) {
    const tasks = eng.spList(d).map((id) => eng.item('sprechen', id)).filter(Boolean);
    if (steps[i].key === 'exam') {
      const body = card(rtl(`<p>${d.mode === 'eval' ? 'آزمون هفتگی Sprechen: ' : ''}هر وظیفه: زمان آماده‌سازی ← ضبط خودکار ← توقف خودکار در پایان زمان صحبت. مثل آزمون واقعی، بدون مکث بین وظایف.</p>`))
        + tasks.map((it, t) => {
          const ex = w.ex && w.ex.t === t; const rec = w.rec['exam_' + t];
          return taskCardHtml(it, { guide: false }) + card(ex
            ? `<div class="tdm-exstate ${w.ex.phase}"><b>${E(w.ex.phase === 'prep' ? ML('آماده‌سازی', 'Vorbereitung', 'Preparation') : '● ' + ML('در حال ضبط', 'Aufnahme läuft', 'Recording'))}</b><span id="tdmExClock" class="mono" dir="ltr">${mmss(Math.max(0, (w.ex.until - Date.now()) / 1000))}</span>${w.ex.phase === 'speak' ? `<button type="button" class="btn btn-danger" data-rec-stop="1">■ ${E(ML('پایان زودتر', 'Früher beenden', 'Finish early'))}</button>` : `<button type="button" class="btn btn-primary" data-ex-skip="1">${E(ML('عبور از آماده‌سازی', 'Vorbereitung überspringen', 'Skip preparation'))} ⏭</button>`}</div>`
            : rec ? `<div class="tdm-exdone">✓ ${E(ML('ضبط شد', 'Aufgenommen', 'Recorded'))} · ${mmss(rec.secs || 0)}${kit.recAudio(rec)}<button type="button" class="btn btn-ghost" data-ex-start="${t}">${E(ML('دوباره', 'Wiederholen', 'Again'))}</button></div>`
              : `<button type="button" class="btn btn-primary wide" ${w.ex ? 'disabled' : ''} data-ex-start="${t}">▶ ${E(ML('شروع وظیفه', 'Aufgabe starten', 'Start task'))} ${faNum(t + 1)}</button>`);
        }).join('');
      return { body };
    }
    // analyses run one after another (the next starts when the previous has finished)
    const pending = tasks.findIndex((_, t) => w.rec['exam_' + t] && !w.rec['exam_' + t].local && (['none', 'busy'].includes(wk.aiState('sp_exam_' + t)) || (wk.aiState('sp_exam_' + t) === 'error' && wk.retryDue(w, 'sp_exam_' + t))));
    tasks.forEach((_, t) => { if (wk.aiState('sp_exam_' + t) === 'error') wk.armRetry(w, 'sp_exam_' + t); });
    const body = tasks.map((it, t) => {
      const rec = w.rec['exam_' + t]; const byAI = wk.aiState('sp_exam_' + t) === 'done';
      return card(`<div class="tdm-item-head"><span class="chip">${E(it.typeLabel)}</span><h3 dir="ltr" lang="de">${E(it.title)}</h3></div>${rec ? kit.recAudio(rec) : rtl('<p class="warn-text">ضبط نشده</p>')}
        ${rec && wk.aiOn() ? `<div class="tdm-ai">${kit.aiSpeakingHtml('exam_' + t, t, { taskItem: it, noAuto: t !== pending, title: ML('تحلیل خودکار', 'Automatische Analyse', 'Automatic analysis'), manualHint: ML('چک‌لیست و نمره‌ها را خودت پر کن.', 'Bewerte selbst.', 'Rate it yourself.') })}</div>` : ''}
        ${rtl(byAI ? '<h4>مشکلات و نمره‌ها (خودکار؛ قابل اصلاح)</h4>' : '<h4>بررسی و نمره</h4>')}
        ${CATS.sprechen.map(([id, de, fa]) => kit.selfCheck(`sp:${t}:${id}`, `${fa} (${de})`, true)).join('')}
        ${kit.rating(`s${t}_fluss`, 'Flüssigkeit', 'روانی')}${kit.rating(`s${t}_genau`, 'Genauigkeit', 'دقت')}${kit.rating(`s${t}_struktur`, 'Struktur', 'ساختار')}${kit.rating(`s${t}_aufgabe`, 'Aufgabenerfüllung', 'انجام وظیفه')}
        ${kit.reveal('exmodel' + t, ML('پاسخ نمونه برای مقایسه', 'Musterantwort', 'Model answer'), `<p dir="ltr" lang="de">${E(it.model_answer)}</p>`)}`);
    }).join('');
    return { body };
  }

  /* ── exam speaking flow: prep countdown → automatic recording → stop at the end of the speaking time ── */
  async function examStart(t) {
    const d = eng.curDay(); const it = wk.speakTask(d, t);
    if (!it) return;
    if (!(await media.recorder.warm())) return;
    const w = work(); w.ex = { t, phase: 'prep', until: Date.now() + it.prep * 1000 }; eng.save();
  }
  function examSkip() { const w = work(); if (w.ex?.phase !== 'prep') return; w.ex.until = Date.now(); examTick(); }
  /** Called every second while Sprechen is open; returns true when the screen must redraw. */
  function examTick() {
    if (eng.act()?.id !== 'sprechen') return false;
    const w = work();
    if (!w.ex) return false;
    const it = wk.speakTask(eng.curDay(), w.ex.t); const left = Math.ceil((w.ex.until - Date.now()) / 1000);
    const el = document.getElementById('tdmExClock'); if (el) el.textContent = mmss(Math.max(0, left));
    if (w.ex.phase === 'prep' && left <= 0) {
      w.ex = { t: w.ex.t, phase: 'speak', until: Date.now() + it.speak * 1000 }; eng.save();
      media.recorder.start('exam_' + w.ex.t, it.speak);
      return true;
    }
    if (w.ex.phase === 'speak' && left <= -1) {
      if (media.recorder.isRecording()) media.recorder.stop();
      w.ex = null; eng.save();
      return 'later';
    }
    return false;
  }

  return { schreiben: renderSchreiben, sprechen: renderSprechen, examStart, examSkip, examTick };
}
