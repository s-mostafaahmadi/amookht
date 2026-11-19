// «دفتر عبارات» — the site's notebook: tab «دفتر عبارات برنامه» (plan deck, spaced
// repetition 1·3·7·14·30 days, own entries, Anki export) and tab «اشتباهات» (Anki-style
// mistakes lab with Again/Hard/Good/Easy). Same data and rules as the site.

import { esc, svg, ICONS, toast } from '../core/ui.js';
import { st } from '../core/site-text.js';
import { lang } from '../core/i18n.js';
import {
  L, num, today, ERROR_KIND_META, normalizeLearningError, errorKind, errorMeta, errorIsDue, errorsOf, dueErrors,
  errorMatchesFilter, errorRetention, errorStreak, errorRanking, errorTitle, errorSubline, errorDueLabel,
  mistakeVocabSides, ankiSchedule, reviewErrorStore, deleteErrorStore, addErrorStore, deckOf, deckNorm, deckAddStore,
  deckDeleteStore, deckRateStore, deckAnkiCsv, deckFavoriteItem,
} from '../core/learning.js';
import { starsHtml, handleStarClick, confirmDialog, saveTextFile, chip } from './widgets.js';

const ART_CLS = { der: 'm', die: 'f', das: 'n' };

// UI state survives page switches during the session (the site keeps it in S).
const ui = {
  tab: 'deck', errorFilter: 'vocabulary', errorSearch: '', expanded: null, manualOpen: false,
  review: null, // { queue, total, current, reveal, attempt, startedAt }
  deckFilter: 'all', deckSearch: '', deckAdd: false, deckType: 'wort', deckMsg: '', deckBusy: false,
  deckReview: false, deckFlip: false, deckSession: null,
  wrOpen: {}, // «نوشته‌های من»: which texts show their corrections
};

export function renderErrorbook(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page nb';
  const favCache = new Map();
  // NB-DECK-FIRST: the menu opens the plan notebook first.
  if (!ctx.keepTab) ui.tab = 'deck';
  // LEAN4 (owner/admin): no «اشتباهات» tab — the mistakes were merged into the notebook; «نوشته‌های من» shows the own Schreiben texts
  const eng = (() => { try { return ctx.engine; } catch { return null; } })();
  const lean = () => { try { return !!(eng && eng.lean && eng.lean()); } catch { return false; } };
  if (lean()) {
    if (ui.tab === 'mistakes') ui.tab = 'deck';
    try { eng.save(); eng.reload(); if (eng.leanMergeErrors() > 0) toast(L('اشتباهات قبلی به دفتر عبارات منتقل شدند.', 'Your earlier mistakes were moved into the notebook.', 'Deine bisherigen Fehler sind jetzt im Vokabelheft.'), 'ok'); } catch (e) { console.warn(e); }
  }

  const draw = () => {
    favCache.clear();
    const data = ctx.store.data;
    if (lean() && ui.tab === 'mistakes') ui.tab = 'deck';
    root.innerHTML = tabsBar(data) + (ui.tab === 'texts' && lean() ? textsView() : ui.tab === 'deck' ? deckView(data) : mistakesView(data));
    applySearch();
  };

  /* ───────── «نوشته‌های من» (owner/admin) ───────── */
  const wrMark = (text, errors) => {
    let html = esc(text);
    (errors || []).forEach((e) => { const wr = esc(e.wrong || '').trim(); if (!wr || wr.length < 2) return; const i = html.indexOf(wr); if (i < 0) return; html = html.slice(0, i) + `<del>${wr}</del><ins>${esc(e.right || '')}</ins>` + html.slice(i + wr.length); });
    return html.split(/\n+/).map((p) => `<p>${p}</p>`).join('');
  };
  function textsView() {
    let days = [];
    try { days = eng.writings(); } catch (e) { console.warn(e); }
    const rows = days.map((d) => {
      const r = d.results.schreiben; const it = eng.item(r.kind, r.itemId); const fb = r.fb; const on = !!ui.wrOpen[d.date];
      const fix = !fb ? '' : `<div class="wr-text" dir="ltr" lang="de">${wrMark(r.text, fb.errors)}</div>`
        + (fb.errors.length ? `<ol class="wr-errs">${fb.errors.map((e) => `<li><span dir="ltr"><del>${esc(e.wrong)}</del> → <ins>${esc(e.right)}</ins></span>${e.why ? `<small dir="rtl">${esc(e.why)}</small>` : ''}</li>`).join('')}</ol>` : '')
        + (fb.improved.length ? `<div class="wr-better"><b>${esc(L('جمله‌های بهتر', 'Better sentences', 'Bessere Sätze'))}</b>${fb.improved.map((x) => `<p dir="ltr"><span class="muted">${esc(x.original)}</span><br>✓ ${esc(x.better)}</p>`).join('')}</div>` : '')
        + (fb.summary || fb.tip ? `<p class="muted small">${esc(fb.summary)}${fb.tdn ? ` · TDN ${esc(fb.tdn)}` : ''}${fb.tip ? ` · 💡 ${esc(fb.tip)}` : ''}</p>` : '')
        + (fb.src === 'self' ? `<p class="muted small">${esc(L('اصلاحات از Fehlerprotokoll خودت', 'Corrections from your own error log', 'Aus deinem Fehlerprotokoll'))}</p>` : '');
      const plain = `<div class="wr-text" dir="ltr" lang="de">${String(r.text).split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
      const words = r.words || String(r.text).split(/\s+/).filter(Boolean).length;
      return `<details class="hx-day wr-item"${on ? ' open' : ''}><summary class="hx-day-main"><span class="hx-day-date"><b>${esc(d.date)}</b><small>${esc(r.kind === 'grafik' ? 'Grafik' : 'Argumentation')} · ${num(words)} ${esc(L('کلمه', 'words', 'Wörter'))}${r.score != null ? ' · ' + num(r.score) + '%' : ''}${fb ? ` · ✎ ${num(fb.errors.length)}` : ''}</small></span></summary>
        <div class="hx-day-detail"><p dir="ltr"><b>${esc(it?.title || '')}</b></p>${on && fb ? fix : plain}
        <button type="button" class="btn ${on ? '' : 'btn-primary'}" ${fb ? '' : `disabled title="${esc(L('برای این نوشته اصلاحی ثبت نشده است', 'No corrections were saved for this text', 'Für diesen Text gibt es keine Korrekturen'))}"`} data-wr-toggle="${esc(d.date)}">${esc(on ? L('نمایش متن اصلی', 'Show original text', 'Originaltext') : L('نمایش اصلاحات', 'Show corrections', 'Korrekturen zeigen'))}</button></div></details>`;
    }).join('');
    return `<section class="card"><h3>✍️ ${esc(L('نوشته‌های من', 'My texts', 'Meine Texte'))}</h3><p class="muted small">${esc(L('متن Schreiben هر روز همان‌طور که ثبت کردی اینجا می‌ماند. با «نمایش اصلاحات» اشتباه‌ها در متن خط می‌خورند و شکل درست کنارشان می‌آید.', 'Your Schreiben texts as you submitted them. “Show corrections” marks the mistakes right in the text.', 'Deine Schreiben-Texte, wie du sie abgegeben hast; „Korrekturen zeigen“ markiert Fehler direkt im Text.'))}</p>${rows || `<p class="muted">${esc(L('هنوز نوشته‌ای ثبت نشده است.', 'No texts yet.', 'Noch keine Texte.'))}</p>`}</section>`;
  }

  /* ───────── tabs ───────── */
  const tabsBar = (data) => {
    const deck = Object.values(deckOf(data));
    const due = deck.filter((x) => x.due <= today()).length;
    return `<header class="nb-head">
      <h1>📒 ${esc(L('دفتر عبارات', 'Vocabulary notebook', 'Vokabelheft'))}</h1>
      <div class="segmented nb-tabs" role="tablist">
        ${lean() ? '' : `<button type="button" role="tab" data-tab="mistakes" aria-selected="${ui.tab === 'mistakes'}" class="${ui.tab === 'mistakes' ? 'is-on' : ''}">${esc(L('اشتباهات', 'Mistakes', 'Fehler'))} <em>${num(errorsOf(data).length)}</em></button>`}
        <button type="button" role="tab" data-tab="deck" aria-selected="${ui.tab === 'deck'}" class="${ui.tab === 'deck' ? 'is-on' : ''}">${esc(L('دفتر عبارات برنامه', 'Plan vocabulary', 'Plan-Wortschatz'))} <em>${num(deck.length)}</em>${due ? `<b class="nb-due" title="${esc(L('سررسید امروز', 'due today', 'heute fällig'))}">${num(due)}</b>` : ''}</button>
        ${lean() ? `<button type="button" role="tab" data-tab="texts" aria-selected="${ui.tab === 'texts'}" class="${ui.tab === 'texts' ? 'is-on' : ''}">${esc(L('نوشته‌های من', 'My texts', 'Meine Texte'))} <em>${num((() => { try { return eng.writings().length; } catch { return 0; } })())}</em></button>` : ''}
      </div>
    </header>`;
  };

  /* ───────── plan deck ───────── */
  const deckCard = (x) => {
    const d = x.data || {};
    const w = x.type === 'wort';
    const art = w ? String(d.artikel || '').toLowerCase() : '';
    const due = x.due <= today();
    const q = deckNorm([w ? d.wort : d.de, w ? d.bedeutung_fa : d.fa, d.beispiel, w ? (d.koll || []).join(' ') : ''].join(' '));
    const stage = Math.max(0, Math.min(4, Number(x.stage) || 0));
    return `<article class="vc ${w ? 'is-wort' : 'is-red'} ${ART_CLS[art] ? 'art-' + ART_CLS[art] : ''}" data-kind="${w ? 'wort' : 'redemittel'}" data-due="${due ? 1 : 0}" data-mine="${d.custom ? 1 : 0}" data-q="${esc(q)}">
      <header><span class="vc-tag">${esc(w ? d.wortart || L('لغت', 'Word', 'Wort') : 'Redemittel')}</span>${d.custom ? `<span class="vc-mine">✍ ${esc(L('افزوده من', 'My entry', 'Eigener Eintrag'))}</span>` : ''}
        <span class="vc-tools">${starsHtml(ctx.store.data, deckFavoriteItem(x), favCache)}<button type="button" class="qdel" data-deck-del="${esc(x.key)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}" aria-label="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button></span></header>
      <h4 dir="ltr" lang="de">${art ? `<i>${esc(art)}</i> ` : ''}${esc(w ? d.wort : d.de)}</h4>
      ${w && ((d.plural && d.plural !== '—') || d.perfekt) ? `<small class="vc-forms" dir="ltr">${[d.plural && d.plural !== '—' ? 'Pl. ' + esc(d.plural) : '', d.perfekt ? 'Perfekt: ' + esc(d.perfekt) : ''].filter(Boolean).join(' · ')}</small>` : ''}
      <p class="vc-mean" dir="rtl">${esc(w ? d.bedeutung_fa : d.fa)}</p>
      ${d.beispiel ? `<p class="vc-ex" dir="ltr" lang="de">${esc(d.beispiel)}</p>` : ''}
      ${w && (d.koll || []).length ? `<p class="vc-koll" dir="ltr" lang="de">${d.koll.slice(0, 3).map((c) => `<span>${esc(c)}</span>`).join('')}</p>` : ''}
      <footer><span class="vc-stage" title="${esc(L('مرحله مرور', 'Stage', 'Stufe'))} ${num(stage + 1)}/${num(5)}">${[0, 1, 2, 3, 4].map((i) => `<i class="${i <= stage ? 'on' : ''}"></i>`).join('')}</span><span class="vc-due ${due ? 'is-due' : ''}">${esc(due ? L('سررسید امروز', 'due today', 'heute fällig') : `${L('مرور بعدی', 'Next', 'Fällig')} ${x.due}`)}</span></footer>
    </article>`;
  };

  const deckForm = () => {
    if (!ui.deckAdd) return '';
    const ai = ctx.account.premium;
    const mean = ai ? L('معنی (خالی = هوش مصنوعی)', 'Meaning (empty = AI)', 'Bedeutung (leer = KI)') : L('معنی (اختیاری)', 'Meaning (optional)', 'Bedeutung (optional)');
    const fld = (id, label, ph, cls = '', dir = 'ltr') => `<label class="fld ${cls}"><span>${esc(label)}</span><input id="${id}" dir="${dir}" placeholder="${esc(ph)}" autocomplete="off" spellcheck="false" /></label>`;
    return `<div class="nmodal" data-nmodal="deck" role="dialog" aria-modal="true"><section class="card deckform nmodal-card" data-type="${ui.deckType}">
      <div class="deckform-head"><h3>${esc(L('افزودن به دفتر عبارات', 'Add to notebook', 'Neuer Eintrag'))}</h3>
        <div class="segmented"><button type="button" data-dtype="wort" class="${ui.deckType === 'wort' ? 'is-on' : ''}">${esc(L('لغت', 'Word', 'Wort'))}</button><button type="button" data-dtype="redemittel" class="${ui.deckType === 'redemittel' ? 'is-on' : ''}">${esc(L('عبارت / Redemittel', 'Phrase', 'Redemittel'))}</button></div></div>
      ${ui.deckType === 'wort' ? `<div class="form-grid">
        <label class="fld sm"><span>${esc(L('حرف تعریف', 'Article', 'Artikel'))}</span><select id="nArt" dir="ltr"><option value="">—</option><option>der</option><option>die</option><option>das</option></select></label>
        ${fld('nWord', L('لغت آلمانی *', 'German word *', 'Wort *'), 'z. B. die Nachhaltigkeit', 'grow')}
        ${fld('nMean', mean, L('مثلاً: پایداری', 'e.g. sustainability', 'z. B. پایداری'), 'grow', 'auto')}
        ${fld('nPl', L('جمع', 'Plural', 'Plural'), 'die Nachhaltigkeiten')}
        <label class="fld"><span>${esc(L('نوع کلمه', 'Part of speech', 'Wortart'))}</span><select id="nPos" dir="ltr"><option value="">—</option><option>Nomen</option><option>Verb</option><option>Adjektiv</option><option>Adverb</option><option>Präposition</option><option>Ausdruck</option></select></label>
        ${fld('nEx', L('جمله نمونه', 'Example sentence', 'Beispielsatz'), 'Nachhaltigkeit spielt eine große Rolle.', 'full')}
        ${fld('nKoll', L('ترکیب‌ها (با کاما جدا کن)', 'Collocations (comma-separated)', 'Kollokationen (mit Komma)'), 'auf Nachhaltigkeit achten, ökologische Nachhaltigkeit', 'full')}
      </div>` : `<div class="form-grid">
        ${fld('nDe', L('عبارت آلمانی *', 'German phrase *', 'Ausdruck *'), 'Daraus lässt sich schließen, dass …', 'full')}
        ${fld('nFa', mean, L('از این می‌توان نتیجه گرفت که …', 'Meaning', 'Bedeutung'), 'full', 'auto')}
        ${fld('nEx2', L('جمله نمونه', 'Example sentence', 'Beispielsatz'), 'Daraus lässt sich schließen, dass …', 'full')}
      </div>`}
      <div class="deckform-foot"><p class="form-msg ${ui.deckMsg ? 'is-ok' : ''}" id="deckMsg" role="status">${ui.deckMsg ? '✓ ' + esc(ui.deckMsg) : esc(L('موارد ستاره‌دار (*) لازم هستند. با Enter هم ذخیره می‌شود.', 'Fields marked * are required. Enter saves.', 'Pflichtfelder sind mit * markiert. Enter speichert.'))}</p>
        <div class="row-actions"><button type="button" class="btn" data-act="deck-close">${esc(L('بستن', 'Close', 'Schließen'))}</button><button type="button" class="btn btn-primary" data-act="deck-save">＋ ${esc(L('ذخیره در دفتر', 'Save', 'Speichern'))}</button></div></div>
    </section></div>`;
  };

  const deckReviewView = (data) => {
    const all = Object.values(deckOf(data));
    const q = all.filter((x) => x.due <= today()).sort((a, b) => a.due.localeCompare(b.due));
    const s = ui.deckSession || { ok: 0, no: 0, total: q.length };
    const total = Math.max(s.total || 0, q.length + s.ok + s.no);
    const doneN = s.ok + s.no;
    const head = `<div class="rv-top"><button type="button" class="btn" data-act="deck-review-off">${esc(L('بازگشت به دفتر', 'Back to notebook', 'Zurück zum Heft'))}</button><span>${num(doneN)} / ${num(total)}</span></div><div class="rv-bar"><i style="width:${total ? Math.round((doneN / total) * 100) : 100}%"></i></div>`;
    if (!q.length) {
      return `<section class="rv">${head}<div class="card rv-card is-done"><div class="rv-emoji">🎉</div><h3>${esc(L('مرور امروز تمام شد', 'All reviews done for today', 'Für heute alles wiederholt'))}</h3><p><b class="ok">✓ ${num(s.ok)}</b> · <b class="no">✗ ${num(s.no)}</b></p><p class="muted">${esc(L('مواردی که بلد نبودی فردا دوباره می‌آیند؛ بقیه با فاصله ۳، ۷، ۱۴ و ۳۰ روز.', 'Missed entries return tomorrow, the rest after 3, 7, 14 and 30 days.', 'Nicht gewusste Einträge kommen morgen wieder, die anderen nach 3, 7, 14 und 30 Tagen.'))}</p><button type="button" class="btn btn-primary" data-act="deck-review-off">${esc(L('بازگشت به دفتر عبارات', 'Back to notebook', 'Zurück zum Heft'))}</button></div></section>`;
    }
    const x = q[0];
    const d = x.data || {};
    const w = x.type === 'wort';
    const art = w ? String(d.artikel || '').toLowerCase() : '';
    const back = ui.deckFlip
      ? `<div class="rv-back"><p class="rv-mean" dir="rtl">${esc(w ? d.bedeutung_fa : d.fa)}</p>${w && d.plural && d.plural !== '—' ? `<p dir="ltr" class="muted">Pl. ${esc(d.plural)}${d.perfekt ? ' · Perfekt: ' + esc(d.perfekt) : ''}</p>` : ''}${d.beispiel ? `<p dir="ltr" lang="de" class="vc-ex">${esc(d.beispiel)}</p>` : ''}${w && (d.koll || []).length ? `<p class="vc-koll" dir="ltr">${d.koll.slice(0, 3).map((c) => `<span>${esc(c)}</span>`).join('')}</p>` : ''}
        <div class="rv-act"><button type="button" class="btn rate-no" data-deck-rate="0" data-key="${esc(x.key)}">✗ ${esc(L('یادم نبود', 'Didn’t know', 'Nicht gewusst'))} <kbd>1</kbd></button><button type="button" class="btn rate-ok" data-deck-rate="1" data-key="${esc(x.key)}">✓ ${esc(L('بلد بودم', 'Knew it', 'Gewusst'))} <kbd>2</kbd></button></div></div>`
      : `<button type="button" class="btn btn-primary wide" data-act="deck-flip">${esc(L('اول به خاطر بیاور، بعد نشان بده', 'Recall first, then reveal', 'Erst erinnern, dann aufdecken'))} <kbd>Space</kbd></button>`;
    return `<section class="rv">${head}<div class="card rv-card ${ART_CLS[art] ? 'art-' + ART_CLS[art] : ''}"><span class="vc-tag">${esc(w ? d.wortart || L('لغت', 'Word', 'Wort') : 'Redemittel')}</span><h2 dir="ltr" lang="de">${art ? `<i>${esc(art)}</i> ` : ''}${esc(w ? d.wort : d.de)}</h2>${back}</div></section>`;
  };

  const deckView = (data) => {
    if (ui.deckReview) return deckReviewView(data);
    const all = Object.values(deckOf(data)).sort((a, b) => String(b.added).localeCompare(String(a.added)));
    const t = today();
    const due = all.filter((x) => x.due <= t).length;
    const words = all.filter((x) => x.type === 'wort').length;
    const mine = all.filter((x) => x.data?.custom).length;
    const solid = all.filter((x) => (Number(x.stage) || 0) >= 3).length;
    if (!['all', 'due', 'wort', 'redemittel', 'mine'].includes(ui.deckFilter)) ui.deckFilter = 'all';
    const chips = [['all', L('همه', 'All', 'Alle'), all.length], ['due', L('سررسید امروز', 'Due today', 'Heute fällig'), due], ['wort', L('لغت‌ها', 'Words', 'Wörter'), words], ['redemittel', 'Redemittel', all.length - words], ['mine', L('افزوده‌های من', 'Mine', 'Eigene'), mine]];
    const stat = (n, label, cls = '') => `<div class="dstat ${cls}"><b>${num(n)}</b><span>${esc(label)}</span></div>`;
    return `<section class="page-hero deck-hero">
        <div class="deck-hero-text"><p class="kicker">${esc(L('مرور فاصله‌دار · ۱، ۳، ۷، ۱۴ و ۳۰ روز', 'Spaced repetition · 1, 3, 7, 14, 30 days', 'Spaced Repetition · 1, 3, 7, 14, 30 Tage'))}</p><h1>${esc(L('دفتر عبارات · لغات و Redemittel', 'Vocabulary & Redemittel', 'Wortschatz & Redemittel'))}</h1>
          <small>${esc(L('لغات برنامه هر روز خودکار اضافه می‌شوند. لغت‌ها و عبارت‌های خودت را هم اضافه کن تا در همین چرخه مرور شوند.', 'Plan words are added automatically. Add your own words and phrases to review them in the same cycle.', 'Plan-Wörter kommen automatisch dazu. Eigene Wörter und Ausdrücke laufen im selben Wiederholungszyklus.'))}</small></div>
        <div class="dstats">${stat(all.length, L('کل موارد', 'Entries', 'Einträge'))}${stat(due, L('سررسید امروز', 'due today', 'heute fällig'), due ? 'is-due' : '')}${stat(solid, L('تثبیت‌شده', 'well known', 'gefestigt'), 'is-ok')}${stat(mine, L('افزوده من', 'mine', 'eigene'))}</div>
        <div class="hero-actions"><button type="button" class="btn btn-primary" data-act="deck-add">＋ ${esc(L('افزودن لغت یا عبارت', 'Add word or phrase', 'Wort hinzufügen'))}</button>
          <button type="button" class="btn ${due ? 'btn-soft' : ''}" ${due ? '' : 'disabled'} data-act="deck-review">▶ ${esc(L('مرور سررسیدها', 'Review due', 'Fällige wiederholen'))}${due ? ` <b>${num(due)}</b>` : ''}</button>
          <button type="button" class="btn btn-ghost" ${all.length ? '' : 'disabled'} data-act="anki">⬇ ${esc(L('خروجی Anki', 'Anki export', 'Anki-Export'))}</button></div>
      </section>
      ${deckForm()}
      ${all.length ? `<div class="toolbar"><label class="search">${svg(ICONS.search)}<input type="search" data-search="deck" dir="auto" value="${esc(ui.deckSearch)}" placeholder="${esc(L('جستجو در لغت، معنی یا مثال…', 'Search word, meaning or example…', 'Suchen: Wort, Bedeutung, Beispiel …'))}" /></label>
          <div class="chips">${chips.map(([id, label, n]) => chip(id, label, num(n), ui.deckFilter === id, 'data-deck-filter')).join('')}</div></div>
        <div class="vgrid" id="deckGrid">${all.map(deckCard).join('')}</div>
        <p class="empty-line" id="deckNone" hidden>${esc(L('موردی با این فیلتر پیدا نشد.', 'No entries match this filter.', 'Keine Einträge für diesen Filter.'))}</p>`
        : `<div class="card empty-card"><div class="empty-emoji">📒</div><h3>${esc(L('دفتر عبارات هنوز خالی است', 'The notebook is still empty', 'Das Heft ist noch leer'))}</h3><p class="muted">${esc(L('لغات و Redemittel جدید هر روز در ماژول «Grammatik & Wortschatz» برنامه یادگیری اضافه می‌شوند. همین حالا هم می‌توانی اولین لغت خودت را اضافه کنی.', 'New words are added daily in the “Grammatik & Wortschatz” module. You can also add your first own word now.', 'Neue Wörter kommen täglich im Modul „Grammatik & Wortschatz“ dazu. Du kannst auch gleich ein eigenes Wort hinzufügen.'))}</p></div>`}
      <p class="muted foot-note">⭐ ${esc(L('با ستاره‌دادن، مورد در «علاقه‌مندی‌ها» هم ذخیره می‌شود. مواردی که «یادم نبود» بزنی در سربرگ «اشتباهات» ثبت می‌شوند. فایل Anki را با File → Import وارد کن (جداکننده Semicolon، اجازه HTML روشن).', 'Starring also saves the entry to Favourites. “Didn’t know” entries are added to the Mistakes tab. Anki: File → Import (semicolon separator, allow HTML).', 'Mit ⭐ landet der Eintrag auch in den Favoriten. „Nicht gewusst“ wird unter „Fehler“ gespeichert. Anki: File → Import (Trennzeichen Semikolon, HTML erlauben).'))}</p>`;
  };

  /* ───────── mistakes ───────── */
  const errorItem = (error, dueIds) => {
    const meta = errorMeta(error);
    const due = dueIds.has(error.id);
    const search = [errorTitle(error), errorSubline(error), meta.label, error.category].join(' ').toLocaleLowerCase();
    const fav = starsHtml(ctx.store.data, { kind: meta.kind, skill: meta.label, sourceId: error.id, title: errorTitle(error), subtitle: error.category || meta.label, answer: error.correctAnswer || '', explanation: error.explanation || '', context: error.context || '', source: 'mistakes' }, favCache);
    const tags = `<div class="ei-tags"><span>${esc(meta.label)}</span><span>${esc(st('mistakes.count', { count: Math.max(1, error.mistakeCount || 1) }))}</span><span class="${due ? 'is-due' : ''}">${esc(errorDueLabel(error))}</span></div>`;
    const actions = `<div class="ei-actions">${fav}<button type="button" class="icon-btn" data-review="${esc(error.id)}" title="${esc(st('common.review'))}">▶</button><button type="button" class="icon-btn" data-err-del="${esc(error.id)}" title="${esc(st('common.delete'))}">🗑</button></div>`;
    if (meta.kind === 'vocabulary') {
      const card = mistakeVocabSides(error, ctx.store.data.mistakeVocabDirection);
      const open = ui.expanded === error.id;
      return `<article class="ei ei-vocab ${open ? 'is-open' : ''}" data-search-text="${esc(search)}" style="--kc:${meta.color};--kb:${meta.bg}"><div class="ei-icon">${meta.short}</div>
        <button type="button" class="ei-main" data-expand="${esc(error.id)}" aria-expanded="${open}"><small>${esc(card.frontLabel)}</small><b ${card.meaningFirst ? '' : 'lang="de" dir="ltr"'}>${esc(card.front)}</b><p class="ei-tap">${esc(st(open ? 'mistakes.tapHide' : 'mistakes.tapReveal'))}</p>
        ${open ? `<div class="ei-back"><small>${esc(card.backLabel)}</small><h3 ${card.meaningFirst ? 'lang="de" dir="ltr"' : ''}>${esc(card.back)}</h3>${card.example ? `<p><b>${esc(st('vocab.example'))}</b> ${esc(card.example)}</p>` : ''}${card.context ? `<p><b>${esc(st('vocab.collocations'))}</b> ${esc(card.context)}</p>` : ''}</div>` : ''}${tags}</button>${actions}</article>`;
    }
    return `<article class="ei" data-search-text="${esc(search)}" style="--kc:${meta.color};--kb:${meta.bg}"><div class="ei-icon">${meta.short}</div>
      <button type="button" class="ei-main" data-review="${esc(error.id)}"><b dir="auto">${esc(errorTitle(error))}</b><p dir="auto">${esc(errorSubline(error))}</p>${tags}</button>${actions}</article>`;
  };

  const manualForm = () => (ui.manualOpen ? `<section class="card manual-form" id="manualForm"><div class="panel-head"><div><p>${esc(st('mistakes.ownCard'))}</p><h2>${esc(st('mistakes.addManual'))}</h2></div><button type="button" class="btn" data-act="manual-close">${esc(st('common.close'))}</button></div>
      <div class="form-grid"><label class="fld"><span>${esc(L('نوع', 'Type', 'Typ'))}</span><select id="mKind">${Object.keys(ERROR_KIND_META).map((id) => `<option value="${id}">${esc(errorMeta(id).label)}</option>`).join('')}</select></label>
      <label class="fld grow"><span>&nbsp;</span><input id="mQuestion" dir="auto" placeholder="${esc(st('mistakes.questionPlaceholder'))}" /></label>
      <label class="fld full"><input id="mCorrect" dir="auto" placeholder="${esc(st('mistakes.correctPlaceholder'))}" /></label>
      <label class="fld full"><textarea id="mNote" dir="auto" rows="2" placeholder="${esc(st('mistakes.notePlaceholder'))}"></textarea></label></div>
      <div class="row-actions end"><button type="button" class="btn btn-primary" data-act="manual-save">${esc(st('mistakes.saveCard'))}</button></div></section>` : '');

  const ranking = (data, kind, title) => {
    const meta = errorMeta(kind);
    const rows = errorRanking(data, kind);
    const max = rows[0]?.count || 1;
    return `<div class="ranking" style="--kc:${meta.color};--kb:${meta.bg}"><h3><span>${meta.short}</span>${esc(title)}</h3>${rows.length ? rows.map((row, index) => `<div class="rank-row"><i>#${index + 1}</i><div><b title="${esc(row.label)}" dir="auto">${esc(row.label)}</b><div class="bar"><i style="width:${Math.max(8, (row.count / max) * 100)}%"></i></div></div><strong>${row.count}x</strong></div>`).join('') : `<p class="muted small">${esc(st('mistakes.noData'))}</p>`}</div>`;
  };

  const reviewView = (data) => {
    const r = ui.review;
    const raw = errorsOf(data).find((e) => e.id === r.current);
    if (!raw) {
      ui.review = null;
      return mistakesView(data);
    }
    const error = normalizeLearningError(raw);
    const total = Math.max(1, r.total || r.queue.length || 1);
    const done = Math.max(0, total - r.queue.length);
    const meta = errorMeta(error);
    const previews = [0, 1, 2, 3].map((rating) => ankiSchedule(error, rating));
    const encouragement = error.reviewCount ? st('review.trained', { count: error.reviewCount }) : st('review.first');
    const top = `<div class="rv-top"><div><b>${esc(st('mistakes.lab'))}</b><small>${esc(st('review.cardOf', { current: Math.min(total, done + 1), total }))}</small></div><div class="row-actions"><button type="button" class="btn" data-err-del="${esc(error.id)}">${esc(st('common.delete'))}</button><button type="button" class="btn" data-act="review-end">${esc(st('review.end'))}</button></div></div><div class="rv-bar"><i style="width:${Math.max(4, (done / total) * 100)}%"></i></div>`;
    const ratings = (title) => `<p class="rate-title">${esc(title)}</p><div class="ratings">${[['again', 'rate-again'], ['hard', 'rate-hard'], ['good', 'rate-good'], ['easy', 'rate-easy']].map(([k, cls], i) => `<button type="button" class="${cls}" data-rate="${i}"><b>${esc(st('review.' + k))}</b><small>${esc(previews[i].label)}</small><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
    const banner = (extra) => `<header class="rv-banner" style="--kc:${meta.color}"><span>${esc(meta.label)}${extra}</span><b>${esc(st('review.occurred', { count: Math.max(1, error.mistakeCount) }))}</b></header>`;
    if (meta.kind === 'vocabulary') {
      const card = mistakeVocabSides(error, data.mistakeVocabDirection);
      return `<section class="rv">${top}<article class="card rv-card">${banner('')}<div class="rv-prompt"><small>${esc(card.meaningFirst ? st('vocab.prompt') : st('vocab.meaningPrompt'))}</small><h1 ${card.meaningFirst ? '' : 'lang="de" dir="ltr"'}>${esc(card.front)}</h1><p class="muted small">${esc(st('vocab.thinkFirst'))}</p></div>
        ${!r.reveal ? `<button type="button" class="btn btn-primary wide" data-act="reveal">${esc(card.meaningFirst ? st('vocab.reveal') : st('vocab.revealMeaning'))} <kbd>Space</kbd></button><p class="muted small center">${esc(encouragement)}</p>`
          : `<section class="rv-answer"><small>${esc(card.backLabel)}</small><h2 ${card.meaningFirst ? 'lang="de" dir="ltr"' : ''}>${esc(card.back)}</h2>${card.example ? `<p><b>${esc(st('vocab.example'))}</b> ${esc(card.example)}</p>` : ''}${card.context ? `<p><b>${esc(st('vocab.collocations'))}</b> ${esc(card.context)}</p>` : ''}</section>${ratings(card.meaningFirst ? st('vocab.rateRecall') : st('vocab.rateMeaning'))}`}</article></section>`;
    }
    return `<section class="rv">${top}<article class="card rv-card">${banner(' · ' + esc(error.category || 'Lernfehler'))}<div class="rv-prompt"><small>${esc(st('review.recall'))}</small><h1 dir="auto">${esc(error.question || error.context || st('review.recall'))}</h1></div>
      ${error.userAnswer ? `<div class="rv-wrong"><span>${esc(st('review.oldAnswer'))}</span><p dir="auto">${esc(error.userAnswer)}</p></div>` : ''}
      <textarea id="reviewAttempt" class="rv-attempt" dir="auto" placeholder="${esc(st('review.attemptPlaceholder'))}">${esc(r.attempt || '')}</textarea>
      ${!r.reveal ? `<button type="button" class="btn btn-primary wide" data-act="reveal">${esc(st('review.reveal'))}</button><p class="muted small center">${esc(encouragement)}</p>`
        : `<section class="rv-answer"><small>${esc(st('review.model'))}</small><h2 dir="auto">${esc(error.correctAnswer || st('review.noModel'))}</h2>${error.explanation ? `<p><b>${esc(st('review.why'))}</b> ${esc(error.explanation)}</p>` : ''}${error.context ? `<p><b>${esc(st('review.context'))}</b> ${esc(error.context)}</p>` : ''}${r.attempt ? `<p><b>${esc(st('review.newAttempt'))}</b> ${esc(r.attempt)}</p>` : ''}</section>${ratings(st('review.rate'))}`}</article></section>`;
  };

  const mistakesView = (data) => {
    if (ui.review) return reviewView(data);
    const errors = errorsOf(data).map(normalizeLearningError);
    const due = dueErrors(data);
    const dueIds = new Set(due.map((e) => e.id));
    const total = errors.length;
    const mastered = errors.filter((e) => e.isMastered || e.intervalDays >= 60).length;
    const learning = Math.max(0, total - mastered);
    const counts = {};
    errors.forEach((e) => {
      const kind = errorKind(e);
      counts[kind] = (counts[kind] || 0) + 1;
    });
    const populated = Object.keys(ERROR_KIND_META).filter((id) => counts[id]);
    const req = ui.errorFilter || 'vocabulary';
    const reqCount = req === 'due' ? due.length : req === 'mastered' ? mastered : counts[req] || 0;
    const active = req !== 'all' && reqCount ? req : counts.vocabulary ? 'vocabulary' : populated[0] || 'due';
    ui.errorFilter = active;
    const filtered = errors.filter((e) => errorMatchesFilter(e, active)).sort((a, b) => (Number(dueIds.has(b.id)) - Number(dueIds.has(a.id))) || (Number(b.mistakeCount) - Number(a.mistakeCount)) || String(b.createdAt).localeCompare(String(a.createdAt)));
    const maxCategory = Math.max(1, ...Object.values(counts));
    const categories = [['due', st('mistakes.due'), due.length], ['mastered', st('mistakes.mastered'), mastered], ...Object.keys(ERROR_KIND_META).map((id) => [id, errorMeta(id).label, counts[id] || 0])];
    const stat = (color, label, value, sub) => `<article class="stat" style="--sc:${color}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(sub)}</small></article>`;
    const direction = ctx.store.data.mistakeVocabDirection !== 'word-to-meaning';
    const hero = `<section class="page-hero err-hero"><div><p class="kicker">${esc(st('mistakes.lab'))} · Anki</p><h1>${esc(st('mistakes.headline'))}</h1><small>${esc(st('mistakes.description'))}</small>
        <div class="hero-actions">${due.length ? `<button type="button" class="btn btn-primary" data-act="review-all">${esc(st('mistakes.startDue', { count: due.length }))}</button>` : `<button type="button" class="btn btn-primary" data-act="to-plan">${esc(st('common.continue'))}</button>`}<button type="button" class="btn" data-act="manual-open">+ ${esc(st('mistakes.addOwn'))}</button></div>
        <p class="muted small">${esc(due.length ? st('mistakes.monsterDue', { count: due.length }) : st('mistakes.noDue'))}</p></div>
        <div class="err-mascot" aria-hidden="true"><b>${due.length ? num(due.length) : 'OK'}</b></div></section>
      <section class="stats">${stat('#7c3aed', st('mistakes.collected'), num(total), st('mistakes.totalCards'))}${stat('#f59e0b', st('mistakes.dueToday'), num(due.length), st('mistakes.ankiQueue'))}${stat('#10b981', st('mistakes.retained'), num(errorRetention(data)) + '%', st('mistakes.goodEasy'))}${stat('#ec4899', st('mistakes.streak'), num(errorStreak(data)), st('mistakes.successReviews'))}</section>`;
    if (!total) {
      return hero + `<section class="card empty-card"><div class="empty-emoji">🧩</div><h2>${esc(st('mistakes.emptyTitle'))}</h2><p class="muted">${esc(st('mistakes.emptyHelp'))}</p><div class="hero-actions center"><button type="button" class="btn btn-primary" data-act="to-plan">${esc(st('favorite.toPlan'))}</button><button type="button" class="btn" data-act="manual-open">${esc(st('mistakes.addManual'))}</button></div>${manualForm()}</section>`;
    }
    return hero + `<section class="err-grid"><article class="card err-list-panel">
        <div class="toolbar"><label class="search">${svg(ICONS.search)}<input type="search" data-search="errors" value="${esc(ui.errorSearch)}" placeholder="${esc(st('mistakes.search'))}" /></label>
          <div class="chips">${categories.filter(([, , count]) => count).map(([id, label, count]) => chip(id, label, num(count), active === id, 'data-err-filter')).join('')}</div>
          <button type="button" class="btn btn-soft" data-act="manual-open">+ ${esc(st('common.new'))}</button></div>
        ${active === 'vocabulary' && counts.vocabulary ? `<section class="direction"><div><b>${esc(st('mistakes.vocabDirection'))}</b><small>${esc(st('mistakes.vocabDirectionHelp'))}</small></div><div class="segmented"><button type="button" class="${direction ? 'is-on' : ''}" data-direction="meaning-to-word">${esc(st('mistakes.meaningToWord'))}</button><button type="button" class="${!direction ? 'is-on' : ''}" data-direction="word-to-meaning">${esc(st('mistakes.wordToMeaning'))}</button></div></section>` : ''}
        ${manualForm()}
        <div class="err-list" id="errList">${filtered.length ? filtered.map((e) => errorItem(e, dueIds)).join('') : `<div class="empty-line"><h2>${esc(st('mistakes.emptyCategory'))}</h2><p>${esc(st('mistakes.emptyCategoryHelp'))}</p></div>`}</div></article>
      <aside class="card err-side"><div class="panel-head"><div><p>${esc(st('mistakes.intelligence'))}</p><h2>${esc(st('mistakes.patterns'))}</h2></div><small class="muted">${esc(st('mistakes.stable', { mastered, total: learning + mastered }))}</small></div>
        ${ranking(data, 'vocabulary', st('mistakes.topWords'))}${ranking(data, 'grammar', st('mistakes.grammarTraps'))}<hr />
        <div class="panel-head"><div><p>${esc(st('mistakes.weakSpots'))}</p><h2>${esc(st('mistakes.byCategory'))}</h2></div></div>
        <div class="cat-bars">${Object.entries(ERROR_KIND_META).filter(([id]) => counts[id]).sort((a, b) => (counts[b[0]] || 0) - (counts[a[0]] || 0)).map(([id, meta]) => `<div class="cat-row"><span>${esc(errorMeta(id).label)}</span><i><b style="background:${meta.color};width:${Math.max(7, ((counts[id] || 0) / maxCategory) * 100)}%"></b></i><strong>${counts[id]}</strong></div>`).join('')}</div><hr />
        <div class="panel-head"><div><p>${esc(st('mistakes.ankiRhythm'))}</p><h2>${esc(st('mistakes.howItWorks'))}</h2></div></div>
        <div class="how"><p><b style="color:#e11d48">Again</b> — ${esc(st('mistakes.againHelp'))}</p><p><b style="color:#ea580c">Hard</b> — ${esc(st('mistakes.hardHelp'))}</p><p><b style="color:#16a34a">Good</b> — ${esc(st('mistakes.goodHelp'))}</p><p><b style="color:#2563eb">Easy</b> — ${esc(st('mistakes.easyHelp'))}</p></div></aside></section>`;
  };

  /* ───────── search / filters without re-rendering ───────── */
  function applySearch() {
    const grid = root.querySelector('#deckGrid');
    if (grid) {
      const q = deckNorm(ui.deckSearch);
      const f = ui.deckFilter;
      let shown = 0;
      grid.querySelectorAll('.vc').forEach((el) => {
        const ok = (f === 'all' || (f === 'due' && el.dataset.due === '1') || (f === 'mine' && el.dataset.mine === '1') || el.dataset.kind === f) && (!q || el.dataset.q.includes(q));
        el.hidden = !ok;
        if (ok) shown += 1;
      });
      const none = root.querySelector('#deckNone');
      if (none) none.hidden = shown > 0;
    }
    const list = root.querySelector('#errList');
    if (list) {
      const q = ui.errorSearch.trim().toLocaleLowerCase();
      list.querySelectorAll('[data-search-text]').forEach((el) => {
        el.hidden = !!q && !el.dataset.searchText.includes(q);
      });
    }
  }

  /* ───────── actions ───────── */
  const val = (id) => (root.querySelector('#' + id)?.value || '').trim();

  async function saveDeckEntry() {
    if (ui.deckBusy) return;
    const msg = (text, cls) => {
      const el = root.querySelector('#deckMsg');
      if (el) {
        el.textContent = text;
        el.className = 'form-msg' + (cls ? ' ' + cls : '');
      }
    };
    const type = ui.deckType;
    let data;
    let front;
    if (type === 'wort') {
      let wort = val('nWord').replace(/\s+/g, ' ');
      let artikel = val('nArt');
      const mm = wort.match(/^(der|die|das)\s+(.+)$/i);
      if (mm) {
        wort = mm[2].trim();
        if (!artikel) artikel = mm[1].toLowerCase();
      }
      if (!wort) return msg(L('لغت آلمانی را بنویس.', 'Please enter the German word.', 'Bitte das Wort eingeben.'), 'is-err');
      data = { wort, artikel, plural: val('nPl'), wortart: val('nPos') || (artikel ? 'Nomen' : ''), bedeutung_fa: val('nMean'), beispiel: val('nEx'), koll: val('nKoll').split(/\s*[,،;|]\s*/).filter(Boolean).slice(0, 5), perfekt: '', custom: true };
      front = wort;
    } else {
      const de = val('nDe').replace(/\s+/g, ' ');
      if (!de) return msg(L('عبارت آلمانی را بنویس.', 'Please enter the German phrase.', 'Bitte den Ausdruck eingeben.'), 'is-err');
      data = { de, fa: val('nFa'), beispiel: val('nEx2'), custom: true };
      front = de;
    }
    const n = deckNorm(front);
    if (Object.values(deckOf(ctx.store.data)).some((x) => x.type === type && deckNorm(x.type === 'wort' ? x.data.wort : x.data.de) === n)) {
      return msg(L('این مورد از قبل در دفتر عبارات هست.', 'This entry is already in your notebook.', 'Dieser Eintrag ist schon im Heft.'), 'is-err');
    }
    const meanKey = type === 'wort' ? 'bedeutung_fa' : 'fa';
    if (!data[meanKey] && ctx.account.premium) {
      ui.deckBusy = true;
      msg(L('در حال پیدا کردن معنی با هوش مصنوعی…', 'Finding the meaning with AI …', 'Bedeutung wird mit KI gesucht …'));
      const r = await aiMeaning(type === 'wort' ? (data.artikel ? data.artikel + ' ' : '') + data.wort : data.de);
      ui.deckBusy = false;
      if (r) {
        data[meanKey] = r.fa;
        if (type === 'wort') {
          if (!data.artikel && r.art) {
            data.artikel = r.art;
            if (!data.wortart) data.wortart = 'Nomen';
          }
          if (!data.plural && r.pl) data.plural = r.pl;
        }
      }
    }
    const result = deckAddStore(ctx.store, type, data);
    if (!result.ok) return msg(L('این مورد از قبل در دفتر عبارات هست.', 'This entry is already in your notebook.', 'Dieser Eintrag ist schon im Heft.'), 'is-err');
    ui.deckMsg = L(`«${front}» به دفتر عبارات اضافه شد و از امروز در چرخه مرور است.`, `“${front}” was added and is in your review cycle from today.`, `„${front}“ wurde hinzugefügt und ist ab heute in der Wiederholung.`) + (data[meanKey] ? '' : L(' (بدون معنی)', ' (without meaning)', ' (ohne Bedeutung)'));
    ui.deckFilter = 'all';
    draw();
  }

  /** Site deckAiMeaning: the coach translator (premium) fills meaning, article and plural. */
  async function aiMeaning(text) {
    try {
      const r = await ctx.bridge.api('/coach/api/translate', { method: 'POST', body: { text }, raw: true, timeout: 20000 });
      if (!r || !r.ok) return null;
      const d = r.data || {};
      const fa = String(d.translation || '').trim();
      if (!fa || !/[؀-ۿ]/.test(fa)) return null;
      const info = String(d.word_info || '');
      const hw = String(d.headword_de || '');
      const art = (hw.match(/^(der|die|das)\s/i) || info.match(/^(der|die|das)\s/i) || [])[1];
      const pl = info.match(/Pl(?:ural)?\.?:?\s*(?:die\s+)?([^\s,·;–]+)/i);
      return { fa, art: art ? art.toLowerCase() : '', pl: pl ? pl[1] : '' };
    } catch {
      return null;
    }
  }

  function startReview(ids) {
    if (!ids.length) {
      toast(st('review.noneDue'));
      return;
    }
    ui.review = { queue: ids, total: ids.length, current: ids[0], reveal: false, attempt: '', startedAt: Date.now() };
    draw();
    root.closest('.view')?.scrollTo({ top: 0 });
  }

  function finishReview(rating) {
    const r = ui.review;
    if (!r || !r.reveal) return;
    const id = r.current;
    reviewErrorStore(ctx.store, id, Number(rating), r.startedAt ? Math.round((Date.now() - r.startedAt) / 1000) : 0);
    r.queue = r.queue.filter((x) => x !== id);
    if (r.queue.length) {
      Object.assign(r, { current: r.queue[0], reveal: false, attempt: '', startedAt: Date.now() });
    } else {
      ui.review = null;
      toast(st('review.complete'), 'ok');
    }
    draw();
  }

  async function deleteError(id) {
    if (!(await confirmDialog(L('این اشتباه از حساب شما حذف شود؟', 'Delete this mistake from your account?', 'Diesen Fehler aus deinem Konto löschen?')))) return;
    deleteErrorStore(ctx.store, id);
    if (ui.review) {
      ui.review.queue = ui.review.queue.filter((x) => x !== id);
      if (ui.review.current === id) ui.review = null;
    }
    draw();
  }

  // DECK-MODAL: a click on the dark backdrop or Esc closes the window
  root.addEventListener('click', (event) => { if (event.target.matches && event.target.matches('[data-nmodal="deck"]')) { ui.deckAdd = false; ui.deckMsg = ''; draw(); } }, true);
  root.addEventListener('keydown', (event) => { if (event.key === 'Escape' && ui.deckAdd && root.querySelector('[data-nmodal="deck"]')) { event.preventDefault(); ui.deckAdd = false; ui.deckMsg = ''; draw(); } });
  root.addEventListener('click', (event) => {
    if (handleStarClick(event, ctx.store, favCache)) return;
    const el = event.target.closest('button');
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.wrToggle) { ui.wrOpen[d.wrToggle] = !ui.wrOpen[d.wrToggle]; draw(); return; }
    if (d.tab) {
      ui.tab = d.tab;
      ui.review = null;
      ui.deckReview = false;
      draw();
    } else if (d.deckFilter) {
      ui.deckFilter = d.deckFilter;
      root.querySelectorAll('[data-deck-filter]').forEach((b) => b.classList.toggle('is-on', b === el));
      applySearch();
    } else if (d.dtype) {
      ui.deckType = d.dtype;
      draw();
      root.querySelector(ui.deckType === 'wort' ? '#nWord' : '#nDe')?.focus();
    } else if (d.deckDel) deckDeleteStore(ctx.store, d.deckDel);
    else if (d.deckRate !== undefined) {
      deckRateStore(ctx.store, d.key, d.deckRate === '1');
      const s = ui.deckSession || (ui.deckSession = { ok: 0, no: 0, total: 0 });
      if (d.deckRate === '1') s.ok += 1;
      else s.no += 1;
      ui.deckFlip = false;
      draw();
    } else if (d.errFilter) {
      ui.errorFilter = d.errFilter;
      draw();
    } else if (d.direction) {
      ctx.store.set('mistakeVocabDirection', d.direction);
      ui.expanded = null;
    } else if (d.expand) {
      ui.expanded = ui.expanded === d.expand ? null : d.expand;
      draw();
    } else if (d.review) startReview([d.review]);
    else if (d.errDel) deleteError(d.errDel);
    else if (d.rate !== undefined) finishReview(Number(d.rate));
    else {
      switch (d.act) {
        case 'deck-add': ui.deckAdd = true; ui.deckMsg = ''; draw(); setTimeout(() => root.querySelector(ui.deckType === 'wort' ? '#nWord' : '#nDe')?.focus(), 30); break;
        case 'deck-close': ui.deckAdd = false; ui.deckMsg = ''; draw(); break;
        case 'deck-save': saveDeckEntry(); break;
        case 'deck-review': ui.deckReview = true; ui.deckFlip = false; ui.deckSession = { ok: 0, no: 0, total: Object.values(deckOf(ctx.store.data)).filter((x) => x.due <= today()).length }; draw(); break;
        case 'deck-review-off': ui.deckReview = false; draw(); break;
        case 'deck-flip': ui.deckFlip = true; draw(); break;
        case 'anki': saveTextFile(`amookht-anki-${today()}.csv`, deckAnkiCsv(ctx.store.data)); break;
        case 'review-all': {
          let due = dueErrors(ctx.store.data);
          if (ui.errorFilter && ui.errorFilter !== 'all') due = due.filter((e) => errorMatchesFilter(e, ui.errorFilter));
          startReview(due.map((e) => e.id));
          break;
        }
        case 'review-end': ui.review = null; draw(); break;
        case 'reveal':
          if (ui.review) {
            ui.review.attempt = (root.querySelector('#reviewAttempt')?.value || '').trim();
            ui.review.reveal = true;
            draw();
          }
          break;
        case 'manual-open': ui.manualOpen = true; draw(); root.querySelector('#manualForm')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); root.querySelector('#mCorrect')?.focus({ preventScroll: true }); break;
        case 'manual-close': ui.manualOpen = false; draw(); break;
        case 'manual-save': {
          const kind = val('mKind') || 'other';
          const correct = val('mCorrect');
          if (!correct) {
            toast(st('review.required'), 'warn');
            return;
          }
          const meta = errorMeta(kind);
          addErrorStore(ctx.store, { type: kind, category: meta.label, question: val('mQuestion'), userAnswer: '', correctAnswer: correct, explanation: val('mNote'), context: '', source: 'manual', severity: 1, mistakeCount: 1, createdAt: new Date().toISOString() });
          ui.manualOpen = false;
          toast(st('review.saved'), 'ok');
          draw();
          break;
        }
        case 'to-plan': ctx.navigate('dashboard'); break;
        default:
      }
    }
  });

  root.addEventListener('input', (event) => {
    const box = event.target.dataset.search;
    if (box === 'deck') ui.deckSearch = event.target.value;
    else if (box === 'errors') ui.errorSearch = event.target.value;
    else return;
    applySearch();
  });

  root.addEventListener('keydown', (event) => {
    const t = event.target;
    if (t.matches('.deckform input') && event.key === 'Enter') {
      event.preventDefault();
      saveDeckEntry();
    }
  });

  // Review shortcuts: Space reveals, 1–4 (mistakes) / 1–2 (notebook) rate.
  root.onKey = (event) => {
    const typing = event.target.matches && event.target.matches('input, textarea, select');
    if (typing || event.ctrlKey || event.altKey || event.metaKey) return false;
    if (ui.tab === 'mistakes' && ui.review) {
      if (event.key === ' ' && !ui.review.reveal) { root.querySelector('[data-act="reveal"]')?.click(); return true; }
      if (/^[1-4]$/.test(event.key) && ui.review.reveal) { finishReview(Number(event.key) - 1); return true; }
    }
    if (ui.tab === 'deck' && ui.deckReview) {
      if (event.key === ' ' && !ui.deckFlip) { ui.deckFlip = true; draw(); return true; }
      if (/^[12]$/.test(event.key) && ui.deckFlip) { root.querySelector(`[data-deck-rate="${event.key === '2' ? 1 : 0}"]`)?.click(); return true; }
    }
    return false;
  };

  draw();
  root.onStoreChange = (paths) => {
    const watched = ['*', 'errors', 'favorites', 'testdafMethod', 'oesdMethod', 'mistakeVocabDirection', 'user', 'uiLanguage'];
    if (!paths.some((p) => watched.includes(p))) return;
    const active = document.activeElement;
    if (active && root.contains(active) && active.matches('input:not([type=search]), textarea, select')) return; // keep a half-typed form
    draw();
  };
  return root;
}
