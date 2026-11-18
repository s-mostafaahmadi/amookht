// HTML building blocks of the lesson modules (site engine "shared UI pieces", questions, AI panels).
// All interaction goes through data-* attributes handled in modules/index.js.

import { esc } from '../../core/ui.js';
import { ML, faNum, mmss, isFa } from '../../core/engine.js';
import { CATS, JNT, isCorrect, correctLabel, answerLabel, catLabel } from '../../core/work.js';

export const E = (v) => esc(v == null ? '' : v);
export const DE = (s) => E(s) + '​';
export const rtl = (html, cls = '') => `<div dir="rtl" class="fa ${cls}">${html}</div>`;
export const card = (inner, cls = '') => `<section class="card tdm-card ${cls}">${inner}</section>`;

export function makeKit(env) {
  const { eng, wk, media } = env;
  const work = () => eng.work();
  const ta = (key, ph, rows = 3) => `<textarea dir="auto" rows="${rows}" class="tdm-input" data-f="${key}" placeholder="${E(ph)}">${E(work().f[key] || '')}</textarea>`;
  const inp = (key, ph) => `<input dir="auto" class="tdm-input" data-f="${key}" placeholder="${E(ph)}" value="${E(work().f[key] || '')}" />`;
  const ruleBox = (text) => `<aside class="tdm-rule">${rtl('💡 ' + E(text))}</aside>`;

  function reveal(id, label, inner) {
    const w = work(); const open = !!w.checked['r_' + id]; const g = wk.gateFor(id);
    if (!open && g && !wk.gateOk(g)) return `<div class="tdm-reveal"><button type="button" class="btn btn-ghost" data-unlock="rv:${id}">▼ ${E(label)}</button></div>`;
    return `<div class="tdm-reveal ${open ? 'is-open' : ''}"><button type="button" class="btn btn-ghost" data-reveal="${id}">${open ? '▲' : '▼'} ${E(label)}</button>${open ? `<div class="tdm-reveal-body">${inner}</div>` : ''}</div>`;
  }
  function selfCheck(key, labelFa, fault) {
    const v = work().self[key];
    return `<div class="tdm-self${fault ? ' is-fault' : ''}">${rtl(E(labelFa))}<div><button type="button" class="${v === true ? 'is-yes' : ''}" data-self="${E(key)}|true">✓</button><button type="button" class="${v === false ? 'is-no' : ''}" data-self="${E(key)}|false">✗</button></div></div>`;
  }
  function rating(key, label, hint) {
    const v = Number(work().rate[key]) || 0;
    return `<div class="tdm-rating"><div><b>${E(label)}</b>${hint ? rtl(E(hint), 'muted') : ''}</div><div class="tdm-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= v ? 'on' : ''}" data-rate="${E(key)}|${n}">${n}</button>`).join('')}</div></div>`;
  }
  function catChips(skill, key) {
    const cur = work().cat[key];
    return `<div class="tdm-chips">${CATS[skill].map(([id, de, fa]) => `<button type="button" class="${cur === id ? 'is-sel' : ''}" title="${E(fa)}" data-cat="${E(key)}|${id}">${DE(de)}<small dir="rtl">${E(fa.split(':')[0])}</small></button>`).join('')}</div>`;
  }
  const vocabMini = (vocab) => `<div class="tdm-vmini" dir="ltr">${(vocab || []).map((v) => `<span><b>${E((v.artikel ? v.artikel + ' ' : '') + v.wort)}</b><small dir="rtl">${E(v.bedeutung_fa)}</small></span>`).join('')}</div>`;

  /* ── per-question hint: where to look + a strategy tip, never the answer ── */
  function hoerenSeg(it, ev) {
    if (!it?.segments?.length || !ev) return -1;
    const tok = (x) => new Set(String(x).toLowerCase().match(/[a-zäöüß0-9]{3,}/g) || []); const e = tok(ev);
    let best = -1; let bs = 0;
    it.segments.forEach((sg, n) => { const t = tok(sg.text); let c = 0; e.forEach((x) => { if (t.has(x)) c += 1; }); if (c > bs) { bs = c; best = n; } });
    return bs >= 2 ? best : -1;
  }
  function qHint(set, q) {
    const tips = {
      mc: ML('گزینه‌هایی را که در متن نیامده یا با آن تناقض دارند اول حذف کن؛ عدد یا کلمه تکراری در گزینه اغلب دام است.', 'Streiche zuerst Optionen, die nicht im Text stehen; gleiche Wörter sind oft eine Falle.', 'Rule out options that are not in the text first; repeated words are often a trap.'),
      match: ML('برای هر مورد دنبال هم‌معنی کلمات کلیدی بگرد، نه همان کلمه.', 'Suche Synonyme der Schlüsselwörter, nicht dasselbe Wort.', 'Look for synonyms of the key words, not the same word.'),
      rf: ML('فقط چیزی درست است که متن دقیقاً همان را بگوید؛ «تقریباً» درست یعنی Falsch.', 'Richtig nur, wenn der Text genau das sagt.', 'Only “Richtig” if the text says exactly that.'),
      jnt: ML('«Text sagt dazu nichts» یعنی متن درباره‌اش اصلاً چیزی نگفته؛ اگر خلافش را گفته، جواب Nein است.', '„Text sagt dazu nichts“ = keine Information; Gegenteil = Nein.', '“Not in the text” means no information at all; the opposite means “Nein”.'),
      short: ML('فقط کلیدواژه بنویس (۱ تا ۴ کلمه)، نه جمله کامل.', 'Nur Stichwörter (1–4 Wörter).', 'Keywords only (1–4 words).'),
    };
    let where = '';
    if (set === 'l' && q.paragraph) where = E(ML(`جواب در پاراگراف ${faNum(q.paragraph)} است. همان پاراگراف را دوباره و دقیق بخوان.`, `Die Antwort steht in Absatz ${q.paragraph}.`, `The answer is in paragraph ${q.paragraph}.`));
    if (set === 'h') { const it = wk.currentHoerenItem(); const n = hoerenSeg(it, q.evidence); const sg = n >= 0 ? it.segments[n] : null; if (sg) where = `${E(ML(`جواب حدود دقیقه ${mmss(sg.t0)} است.`, `Die Antwort kommt bei etwa ${mmss(sg.t0)}.`, `The answer comes at about ${mmss(sg.t0)}.`))} <button type="button" class="chip" data-seg="${n}">▶ ${E(ML('همین بخش را دوباره بشنو', 'Diese Stelle anhören', 'Play this part'))}</button>`; }
    return `${where ? `<p>${where}</p>` : ''}<p class="muted">${E(tips[q.type] || tips.mc)}</p>`;
  }

  /* ── questions ── */
  function renderQuestions(set, qs, opts = {}) {
    const w = work(); const checked = !!w.checked[set];
    const list = qs.map((q, n) => {
      const key = set + ':' + q.id; const a = w.ans[key]; const ok = checked && q.type !== 'short' && isCorrect(q, a);
      const opt = (v, inner, right) => `<button type="button" data-ans="${set}|${q.id}|${v}" class="${String(a) === String(v) ? 'is-sel' : ''} ${checked && right ? 'is-right' : ''} ${checked && String(a) === String(v) && !right ? 'is-wrong' : ''}">${inner}</button>`;
      let control = '';
      if (q.type === 'mc' || q.type === 'match') control = `<div class="tdm-opts">${q.options.map((o, oi) => opt(oi, `<b>${String.fromCharCode(65 + oi)}</b><span>${E(o)}</span>`, oi === q.answer)).join('')}</div>`;
      else if (q.type === 'rf') control = `<div class="tdm-opts row">${[['true', 'Richtig'], ['false', 'Falsch']].map(([v, l]) => opt(v, l, String(q.answer) === v)).join('')}</div>`;
      else if (q.type === 'jnt') control = `<div class="tdm-opts row">${JNT.map(([v, l]) => opt(v, l, q.answer === v)).join('')}</div>`;
      else if (q.type === 'gap') control = `<input dir="ltr" class="tdm-input tdm-gap" ${checked ? 'disabled' : ''} placeholder="ein Wort …" autocomplete="off" spellcheck="false" value="${E(a || '')}" data-ans-text="${set}|${q.id}" />`;
      else control = `<input dir="ltr" class="tdm-input" ${checked ? 'disabled' : ''} placeholder="Stichwörter …" value="${E(a || '')}" data-ans-text="${set}|${q.id}" />${checked ? `<div class="tdm-model">✓ ${E(q.answer)}</div>${selfCheck('short:' + key, 'آیا پاسخ من از نظر مفهوم درست بود؟')}` : ''}`;
      const fb = checked && q.type !== 'short' ? `<div class="tdm-qfb ${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + E(ML('درست', 'Richtig', 'Correct')) : '✗ ' + E(ML('پاسخ درست', 'Richtig wäre', 'Correct answer')) + ': <b dir="ltr">' + E(correctLabel(q)) + '</b>'}</div>` : '';
      const hk = 'q:' + set + ':' + q.id; const hinted = w.help?.[hk] === 'hint'; const hintOn = !checked && opts.hints !== false && eng.curDay().mode === 'normal';
      const hint = hintOn ? (hinted ? `<div class="tdm-qhint" dir="${isFa() ? 'rtl' : 'ltr'}">💡 ${qHint(set, q)}</div>` : `<button type="button" class="btn btn-ghost small" data-unlock="qh:${E(set + ':' + q.id)}">💡 ${E(ML('راهنمای کوچک', 'Tipp', 'Hint'))}</button>`) : checked && hinted ? `<small class="muted">💡 ${E(ML('با راهنما', 'mit Tipp', 'with hint'))}</small>` : '';
      const ex = checked && opts.explain !== false ? `<div class="tdm-evidence">${q.evidence ? `<p dir="ltr">„${E(q.evidence)}“${q.paragraph ? ` <small>(${E(ML('پاراگراف', 'Absatz', 'Paragraph'))} ${q.paragraph})</small>` : ''}</p>` : ''}${q.explain_fa ? rtl(E(q.explain_fa), 'muted') : ''}</div>` : '';
      return `<article class="tdm-q ${checked ? (q.type === 'short' ? '' : ok ? 'ok' : 'bad') : ''}" data-q="${q.id}"><p class="tdm-qn">${faNum(n + 1)}</p><div class="tdm-qb"><h4 dir="ltr" lang="de">${E(q.q)}</h4>${control}${hint}${fb}${ex}</div></article>`;
    }).join('');
    const sc = checked ? wk.qScore(set, qs) : null;
    return `<div class="tdm-questions">${list}</div>${checked ? `<div class="tdm-score"><b>${faNum(sc.pct)}%</b><span>${faNum(sc.correct)} / ${faNum(sc.total)} ${E(ML('درست', 'richtig', 'correct'))}</span></div>` : `<button type="button" class="btn btn-primary wide" data-check="${set}">${E(ML('ارزیابی پاسخ‌ها', 'Antworten auswerten', 'Check answers'))}</button>`}`;
  }

  /* ── AI panels ── */
  const aiLoading = (text) => `<div class="tdm-ai-loading"><span class="spinner"></span><span dir="auto">${E(text)}</span></div>`;
  const aiFailed = (slot, r, manualHint) => `<div class="tdm-ai-fail">${rtl(`<p class="warn-text">${E(r.error)}</p>${manualHint ? `<p class="muted">${E(manualHint)}</p>` : ''}${wk.retryNote(slot) ? `<p class="muted">⏳ ${E(wk.retryNote(slot))}</p>` : ''}`)}<button type="button" class="btn btn-ghost" data-ai-retry="${slot}">↻ ${E(ML('تلاش دوباره', 'Erneut versuchen', 'Try again'))}</button></div>`;
  const aiBtn = (slot, attr, label) => (wk.aiBusy(slot) ? `<button type="button" class="btn btn-ghost" disabled><span class="spinner"></span> ${E(ML('در حال تحلیل…', 'Analyse läuft …', 'Analysing…'))}</button>` : `<button type="button" class="btn btn-ghost" ${attr}>🤖 ${E(label)}</button>`);

  function qaHtml(set, skill, wrong) {
    const w = work(); const slot = set === 'h' ? 'hq' : 'lq'; const st = wk.aiState(slot); const r = w.ai?.[slot];
    if (w.checked[set]) wk.autoAI(slot, () => wk.runQA(set));
    const byId = new Map((r?.items || []).map((x) => [x.id, x]));
    const manual = !wk.aiOn() || st !== 'done';
    const cards = wrong.map((q) => {
      const x = byId.get(q.id);
      return `<div class="tdm-errrow"><p dir="ltr"><b>${E(q.q)}</b><br><span class="muted">✗ ${E(answerLabel(q, w.ans[set + ':' + q.id]))} · ✓ ${E(correctLabel(q))}</span></p>
        ${q.evidence ? `<p class="tdm-evq" dir="ltr">„${E(q.evidence)}“</p>` : ''}
        ${x ? `<div class="tdm-ai-why">${rtl(`<p>🤖 ${E(x.why_fa)}</p>${x.tip_fa ? `<p class="muted">💡 ${E(x.tip_fa)}</p>` : ''}`)}${(x.keywords || []).length ? `<div class="tdm-vmini" dir="ltr">${x.keywords.map((k) => `<span><b>${E(k.de)}</b><small dir="rtl">${E(k.fa)}</small></span>`).join('')}</div>` : ''}</div>` : q.explain_fa ? rtl(E(q.explain_fa), 'muted') : ''}
        ${x || manual ? catChips(skill, 'q:' + q.id) : ''}</div>`;
    }).join('');
    const extras = (r?.extra || []).map((e) => `<div class="tdm-errrow"><p class="tdm-evq" dir="ltr">„${E(e.sentence)}“</p><div class="tdm-ai-why">${rtl(`<p>🤖 ${E(e.explanation_fa)}</p>`)}</div><span class="tdm-issue">${DE(catLabel(skill, e.category))}</span></div>`).join('');
    const status = st === 'busy' || (st === 'none' && wk.aiOn() && w.checked[set]) ? aiLoading(ML('هوش مصنوعی در حال تحلیل اشتباه‌هاست…', 'Die KI analysiert deine Fehler …', 'The AI is analysing your mistakes…')) : st === 'error' ? aiFailed(slot, r, ML('تا آن موقع خودت برای هر اشتباه یک دسته انتخاب کن.', 'Ordne die Fehler bis dahin selbst zu.', 'Meanwhile, pick a category for each mistake yourself.')) : '';
    const head = rtl(`<h4>${wrong.length ? `تحلیل اشتباهات (${faNum(wrong.length)})` : '🎉 همه پاسخ‌ها درست بود'}</h4>${r?.overview_fa ? `<p>${E(r.overview_fa)}</p>` : wrong.length && st === 'done' ? '<p class="muted">دسته‌بندی‌ها خودکار انجام شد؛ اگر لازم بود عوضشان کن.</p>' : ''}`);
    return card(head + status + cards + (extras ? rtl('<h4>جمله‌های دشوار متن (برای تکمیل سه مورد تحلیل)</h4>') + extras : ''));
  }

  function extraErrorsHtml(skill, withText = true) {
    const w = work(); const list = w.extraErrors || [];
    return `<div class="tdm-extra">${list.map((x, i) => {
      const slot = 'sx_' + x.id; const st = wk.aiState(slot); const r = w.ai?.[slot];
      if (st === 'error' && x.text && wk.aiOn()) wk.autoAI(slot, () => wk.explainExtra(i));
      const ai = st === 'busy' ? aiLoading(ML('در حال توضیح جمله…', 'Satz wird erklärt …', 'Explaining the sentence…')) : st === 'error' ? aiFailed(slot, r, '') : st === 'done' ? `<div class="tdm-ai-why">${rtl(`<p>🤖 <b>${E(r.meaning_fa)}</b></p><p class="muted">${E(r.grammar_fa)}</p>${r.tip_fa ? `<p class="muted">💡 ${E(r.tip_fa)}</p>` : ''}`)}${(r.vocab || []).length ? `<div class="tdm-vmini" dir="ltr">${r.vocab.map((v) => `<span><b>${E(v.de)}</b><small dir="rtl">${E(v.fa)}</small></span>`).join('')}</div>` : ''}</div>` : wk.aiOn() && x.text ? aiBtn(slot, `data-xexplain="${i}"`, ML('توضیح این جمله', 'Satz erklären', 'Explain this sentence')) : '';
      return `<div class="tdm-extra-row">${withText ? `<textarea dir="ltr" rows="2" class="tdm-input" data-xtext="${i}" placeholder="${E(ML('جمله یا عبارت مشکل‌دار', 'Schwieriger Satz', 'Difficult sentence'))}">${E(x.text)}</textarea>` : ''}${ai}
        <div class="tdm-chips">${CATS[skill].map(([id, de, fa]) => `<button type="button" class="${x.cat === id ? 'is-sel' : ''}" title="${E(fa)}" data-xcat="${i}|${id}">${DE(de)}<small dir="rtl">${E(fa.split(':')[0])}</small></button>`).join('')}</div>
        ${st === 'done' ? '' : `<input dir="auto" class="tdm-input" data-xnote="${i}" placeholder="${E(ML('توضیح / ساختار درست / معنی', 'Notiz: Bedeutung, Struktur, Korrektur', 'Note: meaning, structure, correction'))}" value="${E(x.note)}" />`}
        <button type="button" class="qdel" data-xdel="${i}" title="${E(ML('حذف', 'Löschen', 'Delete'))}">×</button></div>`;
    }).join('')}<button type="button" class="btn btn-ghost" data-xadd="-1">＋ ${E(ML('افزودن جمله دیگر', 'Weiteren Satz hinzufügen', 'Add another sentence'))}</button></div>`;
  }

  const SP_NAMES = { pausen: 'Lange Pausen', wiederholung: 'Wortwiederholungen', verbposition: 'Verbposition', unvollstaendig: 'Unvollständige Sätze', fortsetzung: 'Diskussion nicht fortgesetzt' };
  const SC_NAMES = { fluss: 'Flüssigkeit', genau: 'Genauigkeit', struktur: 'Struktur', aufgabe: 'Aufgabe' };
  function aiSpeakingHtml(key, t, opts = {}) {
    const w = work(); const rec = w.rec[key];
    if (!rec || !wk.aiOn()) return '';
    if (rec.local || !rec.id) return rtl(`<p class="warn-text">${E(ML('این ضبط فقط روی همین دستگاه ذخیره شد (اتصال به سرور برقرار نبود)؛ تحلیل خودکار ممکن نیست.', 'Die Aufnahme ist nur lokal gespeichert – keine automatische Analyse möglich.', 'This take is only stored on this device – no automatic analysis.'))}</p>`);
    if (rec.gone && !w.ai?.['sp_' + key]) return '';
    if (!opts.noAuto && !rec.gone) wk.speakAuto(key, t, opts.taskItem);
    const st = wk.aiState('sp_' + key); const r = w.ai?.['sp_' + key];
    const head = `<div class="tdm-ai-head">${rtl(`<h4>🤖 ${E(opts.title || ML('تحلیل خودکار صدای تو', 'Automatische Analyse', 'Automatic analysis'))}</h4>`)}${st === 'done' && !rec.gone ? aiBtn('sp_' + key, `data-ai-speak="${key}|${t}"`, ML('تحلیل دوباره', 'Erneut', 'Analyse again')) : ''}</div>`;
    if (st === 'busy' || st === 'none') return head + aiLoading(ML('در حال تبدیل صدا به متن و تحلیل…', 'Transkription und Analyse …', 'Transcribing and analysing…'));
    if (st === 'error') return head + aiFailed('sp_' + key, r, opts.manualHint || '');
    const sc = r.summary_check;
    return head + `<div class="tdm-ai-scores"><div><small>${E(ML('مدت', 'Dauer', 'Duration'))}</small><b>${faNum(Math.round(r.duration || 0))}s</b></div><div><small>${E(ML('کلمه در دقیقه', 'Wörter/Min.', 'Words/min'))}</small><b>${r.wpm == null ? '—' : faNum(r.wpm)}</b></div><div><small>${E(ML('مکث طولانی', 'Lange Pausen', 'Long pauses'))}</small><b>${faNum(r.long_pauses || 0)}</b></div>${Object.entries(r.scores || {}).map(([k, v]) => `<div><small>${SC_NAMES[k] || k}</small><b>${faNum(v)}/۵</b></div>`).join('')}</div>
      ${sc ? `<div class="tdm-sumcheck">${[['thema', 'موضوع را درست فهمیدم'], ['reihenfolge', 'ترتیب اطلاعات حفظ شد'], ['eigene_worte', 'با جملات خودم بیان کردم']].map(([k, fa]) => `<div class="${sc[k] ? 'ok' : 'bad'}">${sc[k] ? '✓' : '✗'} <span dir="rtl">${fa}</span></div>`).join('')}${(sc.missing || []).length ? `<p dir="ltr" class="muted"><b>${E(ML('جاافتاده', 'Fehlt', 'Missing'))}:</b> ${E(sc.missing.join(' · '))}</p>` : ''}</div>` : ''}
      <div class="tdm-ai-transcript" dir="ltr"><small>Transkript</small><p>${E(r.transcript)}</p></div>
      ${t >= 0 ? `<div class="tdm-chips">${Object.entries(r.issues || {}).filter(([, v]) => v).map(([k]) => `<span class="tdm-issue">${E(SP_NAMES[k] || k)}</span>`).join('') || `<span class="tdm-issue ok">✓ ${E(ML('مشکل مهمی دیده نشد', 'Keine größeren Probleme', 'No major problems'))}</span>`}</div>` : ''}
      ${rtl(`<p>${E(r.summary_fa)}</p>`)}
      ${(r.errors || []).map((e) => `<p dir="ltr"><s>${E(e.wrong)}</s> → <b>${E(e.right)}</b></p>${rtl(`<p class="muted">${E(e.reason_fa)}</p>`)}`).join('')}
      ${r.better_version ? `<div class="tdm-reveal-body" dir="ltr"><small>${E(ML('نسخه بهتر', 'Bessere Version', 'Better version'))}</small><p>${E(r.better_version)}</p></div>` : ''}`;
  }

  /* ── player + recorder ── */
  function playerHtml(it, opts = {}) {
    const w = work(); const exam = opts.exam; const P = media.player.state;
    const rate = w.rate_ || (eng.lowLevel() && !exam ? 0.9 : 1);
    media.player.prime(it);
    return `<div class="tdm-player ${exam ? 'is-exam' : ''}">
      <button type="button" id="tdmAudioBtn" class="tdm-play" data-audio="toggle" aria-label="Play">${P.playing && P.src === it.audio ? '❚❚' : '▶'}</button>
      <div class="tdm-player-main"><div class="tdm-player-track" data-track="1"><i id="tdmAudioBar"></i></div>
        <div class="tdm-player-meta"><span id="tdmAudioTime" dir="ltr">00:00 / ${mmss(it.duration || 0)}</span><span>${E(ML('دفعات کامل شنیده‌شده', 'Vollständig gehört', 'Full plays'))}: <b id="tdmPlays">${faNum(w.plays || 0)}</b>${exam ? ' / ۲' : ''}</span></div></div>
      ${exam ? '' : `<div class="tdm-player-tools" dir="ltr"><button type="button" data-audio="-5" title="-5s">↺5</button><button type="button" data-audio="restart" title="Restart">⟲</button><button type="button" data-audio="5" title="+5s">5↻</button>
      <select data-audio-rate="1" aria-label="Speed">${[0.8, 0.9, 1, 1.1].map((r) => `<option value="${r}" ${r === rate ? 'selected' : ''}>${r}×</option>`).join('')}</select></div>`}
      ${it.audio ? '' : `<small class="muted">${E(ML('فایل صوتی موجود نیست؛ از صدای مرورگر استفاده می‌شود.', 'Keine Audiodatei – Sprachausgabe wird verwendet.', 'No audio file – speech synthesis is used.'))}</small>`}
    </div>`;
  }
  function recAudio(rec) {
    if (!rec) return '';
    if (rec.gone) return `<p class="muted small">🗑 ${E(ML('فایل صوتی حذف شد؛ تحلیل آن ذخیره است.', 'Audio gelöscht – die Analyse bleibt gespeichert.', 'Audio deleted – its analysis is kept.'))}</p>`;
    return `<audio controls preload="none" src="${E(media.recorder.playbackUrl(rec))}"></audio>`;
  }
  function recorderHtml(key, opts = {}) {
    const w = work(); const rec = w.rec[key]; const R = media.recorder.state; const active = media.recorder.isRecording(key); const limit = opts.limit || 0;
    const busy = (R.status === 'saving' || R.status === 'starting') && R.key === key;
    return `<div class="tdm-recorder ${active ? 'is-rec' : ''}"><div class="tdm-rec-dot">🎙️</div>
      <div class="tdm-rec-main"><b>${E(opts.label || ML('ضبط صدا', 'Aufnahme', 'Recording'))}</b><span ${active ? 'id="tdmRecClock"' : ''} class="mono" dir="ltr">${active ? '00:00' : rec ? E(ML('ذخیره شد', 'Gespeichert', 'Saved')) + ` · ${mmss(rec.secs || 0)}` : limit ? E(ML('زمان پیشنهادی', 'Sprechzeit', 'Speaking time')) + ' ' + mmss(limit) : ''}</span></div>
      ${active ? `<button type="button" class="btn btn-danger" data-rec-stop="1">■ ${E(ML('توقف', 'Stopp', 'Stop'))}</button>` : busy ? `<button type="button" class="btn" disabled>${E(R.status === 'starting' ? ML('آماده‌سازی میکروفون…', 'Mikrofon wird vorbereitet …', 'Preparing microphone…') : '…')}</button>` : `<button type="button" class="btn btn-primary" data-rec-start="${key}|${limit}">● ${E(rec ? ML('ضبط دوباره', 'Neu aufnehmen', 'Record again') : ML('شروع ضبط', 'Aufnahme starten', 'Start recording'))}</button>`}
      ${recAudio(rec)}</div>`;
  }

  return { ta, inp, ruleBox, reveal, selfCheck, rating, catChips, vocabMini, renderQuestions, qaHtml, extraErrorsHtml, aiSpeakingHtml, aiLoading, aiFailed, aiBtn, playerHtml, recorderHtml, recAudio };
}
