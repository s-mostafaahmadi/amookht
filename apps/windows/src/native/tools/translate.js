// Site-wide translator (فارسی ↔ Deutsch), floating button above the tutor.
// Ported from the site's amk-translate.js by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
export function install(shim) {
  const { S, saveData, render, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  /* Amookht · site-wide translator (فارسی ↔ Deutsch) — floating button right above «مربی آلمانی».
     Uses the conversation coach's /coach/api/translate (premium; same answer format as the coach's Wortübersetzer).
     Lives outside #app so re-renders never touch it. Globals used: S, hasPremiumAccess, authTokens, openPremiumPlans, Tutor, TDM. */
  (function () {
    'use strict';
    const appS = () => (typeof S !== 'undefined' ? S : null);
    const lang = () => appS()?.uiLanguage || 'fa';
    const L = (fa, de, en) => (lang() === 'fa' ? fa : lang() === 'en' ? (en || de) : de);
    const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const premium = () => typeof hasPremiumAccess === 'function' && hasPremiumAccess();
    const token = () => { try { return (typeof authTokens === 'function' ? authTokens() : null)?.access_token || ''; } catch (e) { return ''; } };
    const FA = /[؀-ۿ]/;
    const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5h9M8 3.5v2m3 0c-.6 3.6-3 6.7-6.5 8.4M5.6 8.6c1.2 2.2 3 3.9 5.3 5"/><path d="m12.5 20.5 4-9.5 4 9.5m-6.6-3h5.2"/></svg>';
    let btn = null, panel = null, busy = false, last = null;

    function visible() {
      const S_ = appS(); if (!S_?.currentUser || ['landing', 'auth', 'premiumPlans'].includes(S_.screen)) return false;
      return !document.documentElement.classList.contains('dcoach-active'); // the conversation coach has its own translator
    }
    function mount() {
      if (btn) return;
      btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'amk-tr-fab'; btn.innerHTML = ICON;
      btn.addEventListener('click', () => (panel && !panel.hidden ? close() : open()));
      document.body.appendChild(btn);
      window.addEventListener('resize', place);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel && !panel.hidden) close(); });
      setInterval(sync, 700);
    }
    function sync() {
      mount();
      const ok = visible();
      btn.hidden = !ok; if (!ok && panel && !panel.hidden) close();
      btn.classList.toggle('is-locked', !premium());
      const t = L('مترجم فارسی ↔ آلمانی', 'Übersetzer Deutsch ↔ Persisch', 'Translator German ↔ Persian');
      if (btn.title !== t) { btn.title = t; btn.setAttribute('aria-label', t); }
      if (ok) place();
    }
    // directly above the «مربی آلمانی» button; the owner assistant (if shown) moves above the translator
    function place() {
      if (!btn || btn.hidden) return;
      const tutor = [...document.querySelectorAll('.language-coach-launcher')].find((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed' && getComputedStyle(el).display !== 'none');
      const tr = tutor && tutor.getBoundingClientRect();
      const size = tr && tr.width ? Math.round(tr.width) : (innerWidth <= 760 ? 50 : 58), gap = 12;
      let left, top;
      if (tr && tr.width) { left = tr.left + (tr.width - size) / 2; top = tr.top - gap - size; }
      else { left = innerWidth <= 760 ? 12 : 22; top = innerHeight - (innerWidth <= 760 ? 202 : 150) - size; }
      Object.assign(btn.style, { left: Math.round(left) + 'px', top: Math.round(top) + 'px', width: size + 'px', height: size + 'px' });
      // same shape/colours as the tutor button (it is a rounded square on desktop, a circle on mobile)
      if (tutor && tr.width) {
        const c = getComputedStyle(tutor);
        Object.assign(btn.style, { borderRadius: c.borderRadius, backgroundImage: c.backgroundImage, borderColor: c.borderTopColor });
      }
      const owner = document.querySelector('.owner-ai-launcher');
      if (owner && getComputedStyle(owner).display !== 'none') {
        const or = owner.getBoundingClientRect();
        const overlap = or.width && or.left < left + size && or.right > left && or.bottom > top - 4 && or.top < top + size;
        if (overlap) owner.style.setProperty('bottom', Math.round(innerHeight - (top - gap)) + 'px', 'important');
      }
      if (panel && !panel.hidden) placePanel();
    }

    // ───────── panel ─────────
    function build() {
      if (panel) return;
      panel = document.createElement('section');
      panel.className = 'amk-tr-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');
      panel.innerHTML = `<header class="amk-tr-head"><div><small>فارسی ↔ DEUTSCH</small><h2></h2></div><button type="button" class="amk-tr-x" aria-label="close">×</button></header>
        <textarea class="amk-tr-in" maxlength="500" rows="2" dir="auto"></textarea>
        <button type="button" class="amk-tr-go"></button>
        <div class="amk-tr-out" aria-live="polite"></div>`;
      panel.querySelector('.amk-tr-x').onclick = close;
      panel.querySelector('.amk-tr-go').onclick = run;
      panel.querySelector('.amk-tr-in').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); run(); } });
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('[data-say],[data-note]'); if (!b) return;
        if (b.dataset.say != null) { if (window.Tutor?.sayText) window.Tutor.sayText(b.dataset.say); return; }
        note(b);
      });
      document.body.appendChild(panel);
    }
    function texts() {
      panel.querySelector('h2').textContent = L('مترجم', 'Wortübersetzer', 'Translator');
      const ta = panel.querySelector('.amk-tr-in');
      ta.placeholder = L('یک لغت یا عبارت فارسی / آلمانی بنویسید…', 'Wort oder Ausdruck (Deutsch / Persisch) …', 'Word or phrase (German / Persian) …');
      panel.querySelector('.amk-tr-go').textContent = L('ترجمه و Kollokationen', 'Übersetzen + Kollokationen', 'Translate + collocations');
    }
    function placePanel() {
      if (innerWidth <= 720) { panel.style.cssText = ''; return; }
      const r = btn.getBoundingClientRect(), w = Math.min(400, innerWidth - 24);
      const h = Math.min(panel.offsetHeight || 420, innerHeight - 24);
      const left = Math.min(innerWidth - w - 12, r.right + 12);
      const top = Math.max(12, Math.min(innerHeight - h - 12, r.bottom - h));
      panel.style.cssText = `left:${Math.round(left)}px;top:${Math.round(top)}px;width:${w}px`;
    }
    function open(prefill) {
      if (!premium()) { if (typeof openPremiumPlans === 'function') openPremiumPlans('translator'); return; }
      build(); texts();
      panel.hidden = false; btn.classList.add('is-open');
      const ta = panel.querySelector('.amk-tr-in');
      if (prefill) ta.value = String(prefill).slice(0, 500);
      placePanel(); requestAnimationFrame(placePanel);
      setTimeout(() => { ta.focus(); ta.select(); }, 30);
      if (prefill) run();
    }
    function close() { if (panel) panel.hidden = true; btn?.classList.remove('is-open'); }

    async function run() {
      const ta = panel.querySelector('.amk-tr-in'), out = panel.querySelector('.amk-tr-out'), go = panel.querySelector('.amk-tr-go');
      const text = ta.value.trim(); if (!text || busy) return;
      busy = true; go.disabled = true;
      out.innerHTML = `<div class="amk-tr-loading">${L('در حال ترجمه…', 'Wird übersetzt …', 'Translating …')}</div>`;
      placePanel();
      try {
        const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 40000);
        const r = await fetch('/coach/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ text }), signal: ctl.signal }).finally(() => clearTimeout(tm));
        if (!r.ok) throw new Error(r.status === 429 ? 'rate' : r.status === 503 ? 'ai' : 'http');
        const d = await r.json(); last = { text, d };
        const de = /^de/i.test(d.source_language || '') || !FA.test(text);
        const german = de ? text : (d.translation || '');
        const head = d.headword_de || german;
        const cols = Array.isArray(d.collocations) ? d.collocations : [];
        out.innerHTML = `
          <div class="amk-tr-main" dir="auto"><span>${E(d.translation)}</span>${german ? `<button type="button" class="amk-tr-ic" data-say="${E(german)}" title="${E(L('تلفظ', 'Aussprache', 'Pronounce'))}">🔊</button>` : ''}</div>
          ${head ? `<p class="amk-tr-info" dir="ltr"><b>${E(head)}</b>${d.word_info ? ` · ${E(d.word_info)}` : ''}${window.TDM?.deckAddEntry ? ` <button type="button" class="amk-tr-ic" data-note="main" title="${E(L('افزودن به دفتر عبارات', 'Ins Heft', 'Add to notebook'))}">📒</button>` : ''}</p>` : ''}
          ${d.related_de ? `<p class="amk-tr-rel" dir="rtl" title="${E(d.related_kind === 'verb' ? L('فعل', 'Verb', 'Verb') : L('اسم', 'Nomen', 'Noun'))}">↔ <b dir="ltr">${E(d.related_de)}</b> <button type="button" class="amk-tr-ic" data-say="${E(d.related_de)}">🔊</button>${d.related_fa ? ` — ${E(d.related_fa)}` : ''}</p>` : ''}<!--TR-REL--><!--TR-REL2-->
          ${cols.length ? `<h3>${L('همایندهای پرکاربرد', 'Häufige Kollokationen', 'Common collocations')}</h3><ol class="amk-tr-cols">${cols.map((c, i) => `<li><b dir="ltr">${E(c.phrase)} <button type="button" class="amk-tr-ic" data-say="${E(c.example_de || c.phrase)}">🔊</button>${window.TDM?.deckAddEntry ? `<button type="button" class="amk-tr-ic" data-note="${i}">📒</button>` : ''}</b><span dir="rtl">${E(c.meaning_fa)}</span><small dir="ltr">${E(c.example_de)}</small></li>`).join('')}</ol>` : ''}`;
      } catch (e) {
        const msg = e.message === 'rate' ? L('درخواست‌ها زیاد شد؛ کمی بعد دوباره امتحان کن.', 'Zu viele Anfragen – bitte gleich noch einmal.', 'Too many requests, try again shortly.')
          : L('ترجمه الان ممکن نشد. دوباره امتحان کن.', 'Übersetzung gerade nicht möglich. Bitte erneut versuchen.', 'Translation is not available right now. Please try again.');
        out.innerHTML = `<p class="amk-tr-err">${E(msg)}</p>`;
      } finally { busy = false; go.disabled = false; placePanel(); }
    }
    function note(b) {
      if (!last || !window.TDM?.deckAddEntry) return;
      const { text, d } = last, k = b.dataset.note;
      let res;
      if (k === 'main') {
        const de = /^de/i.test(d.source_language || '') || !FA.test(text);
        const german = String(d.headword_de || (de ? text : d.translation) || '').trim();
        const fa = de ? d.translation : text;
        const m = german.match(/^(der|die|das)\s+(.+)$/i);
        const word = m ? m[2] : german;
        if (word.split(/\s+/).length === 1) {
          const pl = String(d.word_info || '').match(/Pl(?:ural)?\.?:?\s*(?:die\s+)?([^\s,·;]+)/i);
          res = window.TDM.deckAddEntry('wort', { wort: word, artikel: m ? m[1].toLowerCase() : '', plural: pl ? pl[1] : '', bedeutung_fa: fa || '' });
        } else res = window.TDM.deckAddEntry('redemittel', { de: german, fa: fa || '' });
      } else {
        const c = (d.collocations || [])[Number(k)]; if (!c) return;
        res = window.TDM.deckAddEntry('redemittel', { de: c.phrase, fa: c.meaning_fa || '', beispiel: c.example_de || '' });
      }
      b.textContent = res?.ok ? '✓' : res?.dup ? '✓' : '!';
      b.title = res?.ok ? L('به دفتر عبارات اضافه شد', 'Ins Heft übernommen', 'Added') : res?.dup ? L('از قبل در دفتر هست', 'Schon im Heft', 'Already in notebook') : L('افزودن ممکن نشد', 'Fehlgeschlagen', 'Failed');
      b.disabled = true;
    }

    window.AmkTranslate = { open, close, sync };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  })();

}
