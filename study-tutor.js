/* Amookht · Study tutor ("مربی آلمانی"): a non-modal helper that answers questions while studying.
   Lives outside #app so the app's full re-renders never touch it (draft, scroll and open state survive).
   Uses main-app globals: S, apiRequest, safeText, hasPremiumAccess, ownerAIClientMessageId. */
(function () {
  'use strict';
  const T = (window.Tutor = {});
  // the app declares its state as a top-level const, so it is reachable by name but not as window.S
  const appS = () => (typeof S !== 'undefined' ? S : null);
  const LS_KEY = 'amookht_tutor_ui_v1';
  const REQUEST_TIMEOUT = 95000;
  const st = { open: false, mode: 'dock', loaded: false, loading: false, sending: false, convs: [], activeId: null, messages: [], error: '', historyOpen: false, selection: '', useContext: true, draft: '', pos: null, confirmDelete: null, lastCtx: null };
  try { const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); Object.assign(st, { mode: saved.mode === 'float' ? 'float' : 'dock', pos: saved.pos || null, useContext: saved.useContext !== false, activeId: saved.activeId || null, open: !!saved.open }); } catch (e) { /* storage unavailable */ }
  const persist = () => { try { localStorage.setItem(LS_KEY, JSON.stringify({ mode: st.mode, pos: st.pos, useContext: st.useContext, activeId: st.activeId, open: st.open })); } catch (e) { /* ignore */ } };
  const E = (v) => (typeof safeText === 'function' ? safeText(v) : String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const fa = () => (appS()?.uiLanguage || 'fa') === 'fa';
  const EN_TUTOR_COPY={"Andocken":"Dock to side","Deine Frage … (Enter senden, Shift+Enter neue Zeile)":"Your question... (Enter send, Shift+Enter new line)","Der Tutor ist für Premium-Konten verfügbar.":"The tutor is available for premium accounts.","Deutsch-Tutor":"German tutor","Antworten auf deine Lernfragen":"Answers to your learning questions","Erklär mir bitte diese Stelle (Bedeutung, Grammatik, Gebrauch).":"Please explain this passage to me (meaning, grammar, usage).","Deutsch-Tutor – Fragen beim Lernen":"German tutor – questions while learning","Erneut senden":"Resend","Der Tutor ist gerade ausgelastet – bitte gleich noch einmal.":"The tutor is currently busy - please come back soon.","Bedeutung, Artikel, Plural und Kollokationen von:":"Meaning, articles, plural and collocations of:","Erklär mir diese Stelle (Bedeutung, Grammatik, Gebrauch).":"Explain this passage to me (meaning, grammar, usage).","Deutsch-Tutor öffnen":"Open German tutor","Gib mir einen kurzen, praktischen Tipp für diesen Schritt.":"Give me a quick, practical tip for this step.","Keine Internetverbindung.":"No internet connection.","Höchstens 4000 Zeichen.":"Maximum 4000 characters.","Kontext: ":"Context:","Kein besonderer Kontext":"No specific context","Frühere Gespräche":"Previous conversations","Kopieren":"Copy","Gespräche":"Conversations","Löschen?":"Delete?","Nachrichten":"News","Neu":"New","Noch keine Gespräche.":"No conversations yet.","Analysiere die Grammatik dieses Satzes.":"Analyze the grammar of this sentence.","Satz analysieren":"Analyze sentence","Prüfung: nur Hinweise":"Exam mode: hints only","Korrigiere meinen Text und erkläre die wichtigsten Fehler.":"Correct my text and explain the most important errors.","Meinen Text korrigieren":"Correct my text","Markierte Stelle erklären":"Explain marked point","Stell deine Frage":"Ask your question","Senden":"Send","Schwebend":"Floating","Neues Gespräch":"New conversation","Schon in den Favoriten ⭐":"Already in the favorites ⭐","Schließen (Esc)":"Close (Esc)","Senden fehlgeschlagen – bitte erneut versuchen.":"Sending failed - please try again.","Wort erklären":"explain word","Tipp für diesen Schritt":"Tip for this step","Zu Favoriten":"Add to favorites","Wortbedeutung, Grammatik, Textkorrektur oder ein Tipp für diesen Schritt. Markiere Text auf der Seite und tippe auf „Tutor fragen“.":"Word meaning, grammar, text correction or a tip for this step. Highlight text on the page and tap Ask Tutor.","Zu viele Fragen hintereinander – bitte kurz warten.":"Too many questions in a row – please wait a moment.","Tutor fragen":"Ask tutor","Zeitüberschreitung. Bitte erneut versuchen.":"Timeout. Please try again.","Verwerfen":"Discard","⭐ Zu den Favoriten hinzugefügt":"⭐ Added to favorites","Übersetzen":"Translate","Aussprache":"Pronunciation","Ins Heft":"To the notebook","Heft":"Notebook","Sprachausgabe wird nicht unterstützt.":"Your browser does not support audio playback.","Wird hinzugefügt …":"Adding to the notebook…","Schon im Heft 📒":"Already in the notebook 📒","📒 Hinzugefügt (ohne Bedeutung)":"📒 Added (no meaning yet — complete it in the notebook)","Hinzufügen fehlgeschlagen.":"Could not add it.","Leer = markierter Text · Tab = Text zum Bearbeiten einfügen":"Empty = the selected text · Tab = insert it for editing","Zum Verschieben ziehen":"Drag to move","Favorit":"Favorite","OK":"Add","Wird übersetzt …":"Translating…","Übersetzung gerade nicht möglich.":"Translation is not possible right now. Try again.","Freie Übersetzung gibt es mit Premium.":"Free translation is available with Premium.","Premium ansehen":"See Premium","Kollokationen":"Collocations & more","🌐 Übersetzen · 🔊 Anhören · 📒 Heft · ⭐ Favorit · ❓ Tutor fragen":"🌐 Translate · 🔊 Listen · 📒 Notebook · ⭐ Favorite · ❓ Ask the tutor"};
  const L = (f, d) => fa() ? f : appS()?.uiLanguage === 'en' ? (EN_TUTOR_COPY[d] || d) : d;
  const uid = () => (typeof ownerAIClientMessageId === 'function' ? ownerAIClientMessageId() : (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })));
  let root = null, selTimer = null, bubble = null;

  // ───────── eligibility & mounting ─────────
  function eligible() {
    const S_ = appS(); if (!S_?.currentUser || ['landing', 'auth'].includes(S_.screen)) return false;
    if (typeof hasPremiumAccess === 'function' && !hasPremiumAccess()) return false;
    return S_.appSettings?.showLanguageCoachButton !== false;
  }
  function mount() {
    if (root) return;
    root = document.createElement('div'); root.id = 'amookhtTutor'; root.className = 'tutor-root'; document.body.appendChild(root);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st.open && root.contains(document.activeElement)) T.close(); });
    window.addEventListener('resize', () => { if (st.open) { layout(); clampFloat(); } });
    window.addEventListener('scroll', onScrollSel, { passive: true, capture: true });
  }
  T.sync = function () {
    mount();
    // a re-render removes the selected text → drop the selection toolbar that belonged to it
    if (bubble && !bubble.hidden) { const sel = window.getSelection(); if ((!sel || sel.isCollapsed || !sel.anchorNode?.isConnected) && !frameSelInfo()) hideBubble(); } /*SEL-FRAME*/
    const ok = eligible();
    root.hidden = !ok;
    document.documentElement.classList.toggle('tutor-docked', ok && st.open && isDocked());
    if (!ok) return; // the ⭐ selection toolbar stays available for everyone
    if (!root.firstChild) paint();
    else { layout(); paintContext(); }
    if (st.open && !st.loaded && !st.loading) ensureLoaded();
  };

  // ───────── layout: docked side panel on wide screens, floating card otherwise, bottom sheet on phones ─────────
  const isPhone = () => window.innerWidth < 720;
  const isDocked = () => st.mode === 'dock' && window.innerWidth >= 1280;
  function layout() {
    const panel = root?.querySelector('.tutor-panel'); if (!panel) return;
    const html = document.documentElement;
    panel.classList.toggle('is-phone', isPhone());
    panel.classList.toggle('is-docked', !isPhone() && isDocked());
    panel.classList.toggle('is-float', !isPhone() && !isDocked());
    html.classList.toggle('tutor-docked', st.open && !isPhone() && isDocked());
    if (!isPhone() && isDocked()) {
      const side = document.querySelector('.mac-sidebar'), sr = side?.getBoundingClientRect();
      const sideW = sr && sr.width ? Math.round(sr.width) : 0;
      html.style.setProperty('--tutor-side', sideW + 'px');
      panel.style.cssText = '';
    } else if (!isPhone()) {
      const p = st.pos || { left: 96, top: Math.max(16, window.innerHeight - 660) };
      panel.style.cssText = `left:${p.left}px;top:${p.top}px`;
    } else panel.style.cssText = '';
  }
  function clampFloat() {
    if (!st.pos) return;
    const w = 400, h = Math.min(620, window.innerHeight - 32);
    st.pos.left = Math.max(8, Math.min(window.innerWidth - w - 8, st.pos.left));
    st.pos.top = Math.max(8, Math.min(window.innerHeight - h - 8, st.pos.top));
    layout();
  }
  function startDrag(ev) {
    if (isPhone() || isDocked() || ev.button > 0 || ev.target.closest('button')) return;
    const panel = root.querySelector('.tutor-panel'), r = panel.getBoundingClientRect(), dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    const move = (e) => { st.pos = { left: e.clientX - dx, top: e.clientY - dy }; clampFloat(); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); persist(); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    ev.preventDefault();
  }

  // ───────── context of the current study screen ─────────
  const SCREEN_NAMES = { dashboard: 'Tagesplan', errorbook: 'Fehlerbuch', favorites: 'Favoriten', history: 'Verlauf', testdafSim: 'TestDaF-Prüfungssimulation', library: 'Bibliothek', methodHub: 'Lernplan-Methode (Übersicht)', settings: 'Konto', appSettings: 'Einstellungen', freeStudy: 'Freies Lernen' };
  function gatherContext() {
    const S_ = appS() || {}, info = (window.TDM && S_.screen === 'methodActivity' && TDM.contextInfo && TDM.contextInfo()) || null;
    const ctx = { screen: SCREEN_NAMES[S_.screen] || S_.screen || '', module: '', step: '', title: '', material: '', user_text: '', selection: '', exam: false };
    if (info) Object.assign(ctx, info);
    else if (S_.activeActivity) { ctx.module = String(S_.activeActivity.title || ''); }
    if (st.selection) ctx.selection = st.selection.slice(0, 1400);
    return ctx;
  }
  function contextLabel(ctx) {
    const parts = [...new Set([ctx.module, ctx.step, ctx.title].filter(Boolean))];
    return parts.length ? parts.join(' · ') : ctx.screen;
  }

  // ───────── text selection → toolbar: ⭐ favourites (everyone) · ❓ ask the tutor (tutor users) ─────────
  const coarse = () => { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
  /*SEL-INPUT*/ // own text in a textarea / text input: window.getSelection() does not see it
  let lastPt = null;
  document.addEventListener('pointerup', (e) => { lastPt = { x: e.clientX, y: e.clientY, at: Date.now() }; }, true);
  function fieldSelInfo() {
    const f = document.activeElement;
    if (f?.closest?.('.tutor-addcard')) return null; /*SEL-ADDBOX*/
    if (!f || !(f.tagName === 'TEXTAREA' || (f.tagName === 'INPUT' && /^(text|search|)$/i.test(f.type || '')))) return null;
    let a = null, b = null; try { a = f.selectionStart; b = f.selectionEnd; } catch (e) { return null; }
    if (a == null || b == null || b <= a) return null;
    const text = String(f.value || '').slice(a, b).replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2 || text.length > 1500) return null;
    const S_ = appS(); if (!S_?.currentUser || ['landing', 'auth'].includes(S_.screen)) return null;
    const fr = f.getBoundingClientRect();
    const p = lastPt && Date.now() - lastPt.at < 4000 && lastPt.x >= fr.left - 4 && lastPt.x <= fr.right + 4 && lastPt.y >= fr.top - 4 && lastPt.y <= fr.bottom + 4 ? lastPt : null;
    const rect = p ? { left: p.x - 1, right: p.x + 1, top: p.y - 12, bottom: p.y + 12, width: 2, height: 24 } : { left: fr.left, right: fr.right, top: fr.top, bottom: Math.min(fr.bottom, fr.top + 40), width: fr.width, height: 40 };
    return { text, el: f, rect, inTutor: !!(root && root.contains(f)) };
  }
  let fieldSelTimer = null;
  const onFieldSel = () => { clearTimeout(fieldSelTimer); fieldSelTimer = setTimeout(() => { const fi = fieldSelInfo(); if (fi) { st.pendingSelection = fi.text; st.pendingEl = fi.el; showBubble(fi); } }, 250); };
  document.addEventListener('select', onFieldSel, true);
  document.addEventListener('keyup', (e) => { if (e.shiftKey || e.ctrlKey || e.metaKey) onFieldSel(); }, true);
  function selInfo() {
    const fi = fieldSelInfo(); if (fi) return fi;
    const sel = window.getSelection(), text = sel ? String(sel.toString()).replace(/\s+/g, ' ').trim() : '';
    if (!text || text.length < 2 || text.length > 1500 || !sel.anchorNode?.isConnected) return frameSelInfo(); /*SEL-FRAME*/
    const S_ = appS(); if (!S_?.currentUser || ['landing', 'auth'].includes(S_.screen)) return null;
    const node = sel.anchorNode, el = node && (node.nodeType === 1 ? node : node.parentElement);
    if (el?.closest?.('input,textarea,select,[contenteditable="true"]')) return null;
    let rect = null; try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch (err) { /* ignore */ }
    if (!rect || (!rect.width && !rect.height)) return null;
    return { text, el, rect, inTutor: !!(root && node && root.contains(node)) };
  }
  function onSelectionChange() {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const info = selInfo();
      if (!info) { hideBubble(); return; }
      st.pendingSelection = info.text; st.pendingEl = info.el;
      // phones: a long-press selection does not end with a normal pointerup, so show the toolbar here
      if (coarse()) showBubble(info);
    }, 380);
  }
  function onPointerUp(e) {
    if (bubble?.contains(e.target) || e.target?.closest?.('.tutor-trcard,.tutor-addcard')) return; /*SEL-TR*/ /*SEL-ADDBOX*/
    setTimeout(() => {
      const info = selInfo();
      if (!info) { hideBubble(); return; }
      st.pendingSelection = info.text; st.pendingEl = info.el;
      showBubble(info);
    }, 10);
  }
  function showBubble(info) {
    if (T._selMute && Date.now() < T._selMute) return; /*SEL-TRFULL*/
    const canAsk = eligible() && !info.inTutor, rect = info.rect;
    if (!bubble) {
      bubble = document.createElement('div'); bubble.className = 'tutor-askbubble tutor-selbar'; bubble.setAttribute('role', 'toolbar');
      bubble.addEventListener('pointerdown', (e) => e.preventDefault());
      bubble.addEventListener('mousedown', (e) => e.preventDefault());
      bubble.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.act; if (a === 'fav') T.favSelection(); else if (a === 'say') T.saySelection(); else if (a === 'nb') T.noteSelection(); else if (a === 'tr') T.translateSelection(); /*SEL-TR*/ else T.askSelection(); });
      document.body.appendChild(bubble);
    }
    const de = !/[\u0600-\u06FF]/.test(info.text), canNote = de && !!window.TDM?.deckAddEntry && info.text.length <= 160;
    const trOpen = document.querySelector('.tutor-trcard:not([hidden])'); if (trOpen && trOpen.dataset.for !== cleanSel(info.text).slice(0, 480)) trOpen.hidden = true; T._selRect = rect; /*SEL-TR*/
    bubble.innerHTML = `<button type="button" data-act="tr">🌐 ${L('ترجمه', 'Übersetzen')}</button>${de ? `<button type="button" data-act="say">🔊 ${L('تلفظ', 'Aussprache')}</button>` : ''}${canNote ? `<button type="button" data-act="nb">📒 ${L('به دفتر عبارات', 'Ins Heft')}</button>` : ''}<button type="button" data-act="fav">⭐ ${L('افزودن به علاقه‌مندی‌ها', 'Zu Favoriten')}</button>${canAsk ? `<button type="button" data-act="ask">❓ ${L('از مربی بپرس', 'Tutor fragen')}</button>` : ''}`;
    selbarOff().forEach((a) => bubble.querySelector(`[data-act="${a}"]`)?.remove()); if (!bubble.children.length) { hideBubble(); return; } /*SEL-PREFS*/ compactSelbar(); /*SEL-COMPACT*/
    bubble.hidden = false;
    const bw = bubble.offsetWidth || 220, bh = bubble.offsetHeight || 38;
    // on phones Android shows its own copy/share menu above the selection → put ours below it
    let top = coarse() ? rect.bottom + 14 : rect.top > 54 ? rect.top - bh - 8 : rect.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = Math.max(8, rect.top - bh - 12);
    const left = Math.max(8, Math.min(window.innerWidth - bw - 8, rect.left + rect.width / 2 - bw / 2));
    bubble.style.top = top + 'px'; bubble.style.left = left + 'px';
    watchOverlays(); /*SEL-AVOID*/
    clearTimeout(bubble._t); /*SELBAR-NOTIMER*/
  }
  function hideBubble(force) { const ac = document.querySelector('.tutor-addcard'); if (ac && !ac.hidden) { if (force !== true) return; ac.hidden = true; } /*SEL-ADDBOX3*/ if (bubble) bubble.hidden = true; const c = document.querySelector('.tutor-trcard'); if (c) c.hidden = true; /*SEL-TR*/ }

  /*SEL-FRAME*/ // 2026-11-15: the conversation coach runs in a same-origin iframe (#dcoachFrame); its selections use this toolbar too
  function frameSelInfo() {
    const fr = document.getElementById('dcoachFrame'); if (!fr || fr.style.display === 'none') return null;
    let w = null, d = null; try { w = fr.contentWindow; d = fr.contentDocument; } catch (e) { return null; }
    if (!w || !d) return null;
    const S_ = appS(); if (!S_?.currentUser) return null;
    const fo = fr.getBoundingClientRect(); let text = '', el = null, r = null;
    const f = d.activeElement;
    if (f && (f.tagName === 'TEXTAREA' || (f.tagName === 'INPUT' && /^(text|search|)$/i.test(f.type || '')))) {
      try { const a = f.selectionStart, b = f.selectionEnd; if (a != null && b > a) { text = String(f.value || '').slice(a, b); el = f; const q = f.getBoundingClientRect(); r = { left: q.left, right: q.right, top: q.top, bottom: Math.min(q.bottom, q.top + 40), width: q.width, height: 40 }; } } catch (e) { /* ignore */ }
    }
    if (!text) {
      const sel = w.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
      text = String(sel.toString()); const n = sel.anchorNode; el = n && (n.nodeType === 1 ? n : n.parentElement);
      try { r = sel.getRangeAt(0).getBoundingClientRect(); } catch (e) { r = null; }
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (!text || text.length < 2 || text.length > 1500 || !r || (!r.width && !r.height)) return null;
    return { text, el, rect: { left: r.left + fo.left, right: r.right + fo.left, top: r.top + fo.top, bottom: r.bottom + fo.top, width: r.width, height: r.height }, inTutor: false, inFrame: true };
  }
  function frameShow(onlyTouch) {
    const info = frameSelInfo();
    if (!info) { const ps = window.getSelection(); if (!ps || ps.isCollapsed) hideBubble(); return; }
    st.pendingSelection = info.text; st.pendingEl = info.el;
    if (!onlyTouch || coarse()) showBubble(info);
  }
  function frameClear() { try { document.getElementById('dcoachFrame')?.contentWindow?.getSelection()?.removeAllRanges(); } catch (e) { /* ignore */ } }
  function frameBind() {
    const fr = document.getElementById('dcoachFrame'); let d = null; try { d = fr && fr.contentDocument; } catch (e) { d = null; }
    if (d && d.documentElement && !d.__amkSelBox) { d.__amkSelBox = true; d.addEventListener('pointerdown', () => { const ac = document.querySelector('.tutor-addcard'); if (ac && !ac.hidden) { addBoxClose(); hideBubble(true); } }, true); } /*SEL-ADDCLOSE*/
    if (!d || !d.documentElement || d.__amkSel) return; d.__amkSel = true;
    let t = null;
    d.addEventListener('pointerdown', (e) => { try { window.getSelection()?.removeAllRanges(); } catch (x) { /* ignore */ } }, true);
    d.addEventListener('pointerup', () => setTimeout(() => frameShow(false), 10), true);
    d.addEventListener('selectionchange', () => { clearTimeout(t); t = setTimeout(() => frameShow(true), 380); });
    d.addEventListener('select', () => setTimeout(() => frameShow(false), 250), true);
    d.addEventListener('keyup', (e) => { if (e.shiftKey || e.ctrlKey || e.metaKey) setTimeout(() => frameShow(false), 250); }, true);
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideBubble(); });
    try { d.defaultView.addEventListener('scroll', () => { if (bubble && !bubble.hidden) { hideBubble(); clearTimeout(t); t = setTimeout(() => frameShow(false), 220); } }, { passive: true, capture: true }); } catch (e) { /* ignore */ }
  }
  setInterval(frameBind, 1000);
  // a click in the main page (outside the toolbar / translation card) ends the coach selection, like SEL-CLEAR does for the page
  document.addEventListener('pointerdown', (e) => { if (bubble?.contains(e.target) || e.target?.closest?.('.tutor-selbar,.tutor-trcard,#dcoachFrame')) return; frameClear(); }, true);
  // while the page scrolls the toolbar hides; when scrolling stops it comes back next to the (still selected) text
  let scrollSelTimer = null;
  function onScrollSel() {
    if (!bubble || (bubble.hidden && !scrollSelTimer)) return;
    hideBubble(); clearTimeout(scrollSelTimer);
    scrollSelTimer = setTimeout(() => { scrollSelTimer = null; const info = selInfo(); if (info) showBubble(info); }, 220);
  }
  function toast(msg) {
    let el = document.getElementById('tutorToast');
    if (!el) { el = document.createElement('div'); el.id = 'tutorToast'; el.className = 'tutor-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2600);
  }
  function sentenceAround(el, text) {
    const block = el?.closest?.('p,li,td,dd,blockquote,.tutor-msg,section,article,div');
    const raw = String((el && /^(TEXTAREA|INPUT)$/.test(el.tagName) ? el.value : block?.textContent) || '').replace(/\s+/g, ' ').trim();
    if (!raw || raw.length <= text.length) return '';
    const parts = raw.split(/(?<=[.!?…])\s+/), hit = parts.find((x) => x.includes(text)) || '';
    return hit && hit !== text ? hit.slice(0, 400) : '';
  }
  T.favSelection = function () {
    const S_ = appS(), text = String(st.pendingSelection || '').slice(0, 600);
    hideBubble();
    if (!S_ || !text || typeof normalizeFavorite !== 'function' || typeof setFavoriteRating !== 'function') return;
    const found = window.TDM?.lookupWord ? window.TDM.lookupWord(text) : null, words = text.split(/\s+/).filter(Boolean);
    const item = found || { kind: words.length === 1 ? 'vocabulary' : 'structure', title: text, answer: '' };
    const ctx = sentenceAround(st.pendingEl, text); if (ctx) item.context = ctx;
    const ci = window.TDM?.contextInfo ? window.TDM.contextInfo() : null; if (ci?.module) item.topic = 'Lernplan · ' + ci.module;
    item.source = 'selection'; item.sourceId = 'sel:' + (S_.screen || '') + ':' + text.slice(0, 80);
    const fav = normalizeFavorite(item);
    try { window.getSelection()?.removeAllRanges(); } catch (e) { /* ignore */ }
    /*FAV-DEDUPE*/ const fnorm = (t) => String(t || '').toLowerCase().replace(/[.,;:!?„“”"'‚‘’()«»\[\]\-–—…]+/g, ' ').replace(/\s+/g, ' ').trim();
    const nNew = fnorm(fav.title), favs = S_.favorites || [];
    const same = favs.find((x) => fnorm(x.title) === nNew);
    if (same) { toast(L('این متن قبلاً در علاقه‌مندی‌ها هست ⭐', 'Schon in den Favoriten ⭐')); return; }
    // earlier selection-favorites that are only a part of the new text are replaced by it
    const parts = favs.filter((x) => x.source === 'selection' && fnorm(x.title) && (' ' + nNew + ' ').includes(' ' + fnorm(x.title) + ' '));
    const keepRating = Math.max(1, ...parts.map((x) => Number(x.rating) || 1));
    if (parts.length) { const ids = new Set(parts.map((x) => x.id)); S_.favorites = favs.filter((x) => !ids.has(x.id)); }
    S_.favoriteRenderCache = S_.favoriteRenderCache || {}; S_.favoriteRenderCache[fav.id] = fav;
    setFavoriteRating(fav.id, keepRating);
    toast(parts.length ? SBL(`⭐ اضافه شد و جایگزین ${parts.length} مورد قبلی شد که بخشی از همین متن بود`, `⭐ Added and replaced ${parts.length} shorter entr${parts.length === 1 ? 'y' : 'ies'} from this text`, `⭐ Hinzugefügt – ersetzt ${parts.length} kürzere(n) Eintrag/Einträge`)
      : L('⭐ به علاقه‌مندی‌ها اضافه شد', '⭐ Zu den Favoriten hinzugefügt'));
  };

  /*SELBAR-NB*/ // 🔊 pronunciation (coach's natural voice for premium, browser voice otherwise) · 📒 add to «دفتر عبارات»
  const cleanSel = (t) => String(t || '').replace(/\s+/g, ' ').replace(/^[\s.,;:!?„“"'()«»\-–—]+|[\s.,;:!?„“"'()«»\-–—]+$/g, '').trim();
  const premium = () => typeof hasPremiumAccess === 'function' && hasPremiumAccess();
  const accessToken = () => { try { return (typeof authTokens === 'function' ? authTokens() : null)?.access_token || ''; } catch (e) { return ''; } };
  async function coachApi(path, body, asBlob) {
    const tok = accessToken(); if (!tok || !premium()) throw new Error('no_coach');
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch('/coach/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify(body), signal: ctl.signal });
      if (!r.ok) throw new Error('coach_' + r.status);
      return asBlob ? await r.blob() : await r.json();
    } finally { clearTimeout(tm); }
  }
  let sayAudio = null; const sayCache = new Map();
  function browserSay(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.92; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { toast(L('مرورگر از پخش صدا پشتیبانی نمی‌کند.', 'Sprachausgabe wird nicht unterstützt.')); } }
  T.sayText = async function (raw) {
    const text = cleanSel(raw).slice(0, 600); if (!text) return;
    try { sayAudio?.pause(); speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
    try {
      let url = sayCache.get(text);
      if (!url) { url = URL.createObjectURL(await coachApi('tts', { text, speed: 0.95 }, true)); if (sayCache.size > 40) { const k = sayCache.keys().next().value; URL.revokeObjectURL(sayCache.get(k)); sayCache.delete(k); } sayCache.set(text, url); }
      sayAudio = new Audio(url); await sayAudio.play();
    } catch (e) { browserSay(text); }
  };
  T.saySelection = function () { T.sayText(st.pendingSelection || ''); if (bubble) { clearTimeout(bubble._t); /*SELBAR-NOTIMER*/ } };
  T.noteSelection = async function () {
    const text = cleanSel(st.pendingSelection), el = st.pendingEl;
    hideBubble();
    if (!text || !window.TDM?.deckAddEntry) return;
    const words = text.split(' '), single = words.length === 1, ctx = sentenceAround(el, text) || '';
    const found = window.TDM.lookupWord ? window.TDM.lookupWord(text) : null;
    let meaning = found?.answer || '', head = found?.title || '', info = '';
    if (!meaning) {
      toast(L('در حال افزودن به دفتر عبارات…', 'Wird hinzugefügt …'));
      try { const r = await trFetch(text.slice(0, 480)); /*SEL-TR*/ meaning = String(r.translation || '').trim(); head = r.headword_de || ''; info = r.word_info || ''; } catch (e) { /* saved without meaning */ }
    }
    let res;
    if (single) {
      const m = (head || info).match(/^(der|die|das)\s/i);
      const artikel = m ? m[1].toLowerCase() : '';
      const pl = info.match(/Pl(?:ural)?\.?:?\s*(?:die\s+)?([^\s,·;]+)/i);
      res = window.TDM.deckAddEntry('wort', { wort: text.replace(/^(der|die|das)\s+/i, ''), artikel, plural: pl ? pl[1] : '', bedeutung_fa: meaning, beispiel: ctx });
    } else res = window.TDM.deckAddEntry('redemittel', { de: text, fa: meaning, beispiel: ctx });
    try { window.getSelection()?.removeAllRanges(); } catch (e) { /* ignore */ }
    if (res?.dup) toast(L('این مورد از قبل در دفتر عبارات هست 📒', 'Schon im Heft 📒'));
    else if (res?.ok) toast(meaning ? SBL(`📒 «${text}» به دفتر عبارات اضافه شد`, `📒 “${text}” added to the notebook`, `📒 „${text}“ ins Heft übernommen`) : L('📒 اضافه شد (بدون معنی؛ در دفتر عبارات کامل کن)', '📒 Hinzugefügt (ohne Bedeutung)'));
    else toast(L('افزودن ممکن نشد.', 'Hinzufügen fehlgeschlagen.'));
  };
  /*SEL-ADDBOX*/ /*SEL-ADDBOX2*/ // ⭐ / 📒 first open a small box; empty → the selected text, typed text → that text. Compact, draggable, keeps off the selection and overlays
  const addFav = T.favSelection, addNote = T.noteSelection;
  let addTimer = null;
  function addBoxEl() {
    let c = document.querySelector('.tutor-addcard');
    if (!c) {
      c = document.createElement('div'); c.className = 'tutor-addcard'; c.hidden = true; c.setAttribute('role', 'dialog');
      c.addEventListener('mousedown', (e) => { if (!e.target.closest('input,textarea')) e.preventDefault(); });
      c.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.k === 'x') addBoxClose(); else if (b.dataset.k === 'ok') addBoxSubmit(); });
      c.addEventListener('keydown', (e) => { /*SEL-ADDTAB*/ const fi = e.target.closest?.('.tutor-addin'); if (e.key === 'Tab' && !e.shiftKey && fi && !fi.value) { e.preventDefault(); fi.value = c.dataset.sel || ''; const n = fi.value.length; try { fi.setSelectionRange(n, n); } catch (x) { /* ignore */ } return; } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBoxSubmit(); } else if (e.key === 'Escape') { e.preventDefault(); addBoxClose(); } });
      // drag by the header (mouse + touch)
      c.addEventListener('pointerdown', (e) => {
        const hd = e.target.closest('.tutor-addhd'); if (!hd || e.target.closest('button')) return;
        e.preventDefault(); const r = c.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
        c._dragged = true; c.classList.add('is-drag'); try { hd.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
        const mv = (ev) => { const w = c.offsetWidth, h = c.offsetHeight; c.style.left = Math.round(Math.max(4, Math.min(innerWidth - w - 4, ev.clientX - dx))) + 'px'; c.style.top = Math.round(Math.max(4, Math.min(innerHeight - h - 4, ev.clientY - dy))) + 'px'; };
        const up = () => { c.classList.remove('is-drag'); hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up); };
        hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
      });
      document.addEventListener('pointerdown', (e) => { if (!c.hidden && !c.contains(e.target) && !e.target?.closest?.('.tutor-selbar,.tutor-trcard') && !window.AmkSelForeign?.(e.target)) { addBoxClose(); hideBubble(true); } }, true); /*SEL-ADDBOX3*/ /*SEL-ADDCLOSE*/
      document.body.appendChild(c);
    }
    return c;
  }
  function addBoxClose() { const c = document.querySelector('.tutor-addcard'); if (c) c.hidden = true; clearInterval(addTimer); addTimer = null; }
  // SEL-ADDBOX3: next to the toolbar — above the block «selection + toolbar (+ translation card)», else below it, else beside; never on any of them
  function addBoxZone() {
    const rs = [];
    if (T._selRect) rs.push(T._selRect);
    if (bubble && !bubble.hidden) rs.push(bubble.getBoundingClientRect());
    const tc = document.querySelector('.tutor-trcard:not([hidden])'); if (tc) rs.push(tc.getBoundingClientRect());
    return rs;
  }
  function addBoxPlace(c) {
    const rs = addBoxZone(), w = c.offsetWidth, h = c.offsetHeight, m = 8;
    if (!rs.length) { c.style.left = Math.round((innerWidth - w) / 2) + 'px'; c.style.top = Math.round(innerHeight / 3) + 'px'; return; }
    const u = { top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)), left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)) };
    const anc = bubble && !bubble.hidden ? bubble.getBoundingClientRect() : rs[0];
    let left = Math.max(m, Math.min(innerWidth - w - m, anc.left + anc.width / 2 - w / 2)), top = u.top - h - 6;
    if (top < m) top = u.bottom + 6;
    if (top + h > innerHeight - m) { top = Math.max(m, Math.min(innerHeight - h - m, anc.top)); left = u.right + 8 + w <= innerWidth - m ? u.right + 8 : Math.max(m, u.left - w - 8); }
    c.style.top = Math.round(top) + 'px'; c.style.left = Math.round(left) + 'px';
  }
  function addBoxAvoid(c) {
    if (c.hidden || c._dragged) return;
    const zone = addBoxZone(), cr = c.getBoundingClientRect(); /*SEL-ADDBOX3*/
    if (zone.some((r) => hit(cr, r, 2))) addBoxPlace(c);
    moveClear(c, zone); /*SEL-AVOID3*/
  }
  function addBoxOpen(kind) {
    const text = cleanSel(st.pendingSelection); if (!text) return;
    const c = addBoxEl(), fav = kind === 'fav', ph = text.length > 60 ? text.slice(0, 60) + '…' : text;
    c.dataset.kind = kind; c.dataset.sel = text; c._el = st.pendingEl; c._dragged = false;
    const hint = L('خالی بماند = همان متن انتخاب‌شده · Tab = نوشتن آن برای ویرایش', 'Leer = markierter Text · Tab = Text zum Bearbeiten einfügen'); /*SEL-ADDTAB*/
    c.innerHTML = `<div class="tutor-addhd" title="${E(L('برای جابه‌جایی بکش', 'Zum Verschieben ziehen'))}"><span class="tutor-addgrip" aria-hidden="true">⠿</span><b>${fav ? '⭐ ' + L('علاقه‌مندی', 'Favorit') : '📒 ' + L('دفتر عبارات', 'Heft')}</b><button type="button" class="tutor-addx" data-k="x" aria-label="close">×</button></div>
      <div class="tutor-addrow"><input type="text" class="tutor-addin amk-no-tabnext" dir="auto" maxlength="600" placeholder="${E(ph)}" title="${E(hint)}" aria-label="${E(hint)}" autocomplete="off" spellcheck="false"><button type="button" class="tutor-addok" data-k="ok">${L('افزودن', 'OK')}</button></div>`;
    /*SEL-ADDBOX3: toolbar stays*/
    c.hidden = false;
    c.style.width = Math.min(270, innerWidth - 16) + 'px';
    addBoxPlace(c);
    clearInterval(addTimer); addTimer = setInterval(() => { if (c.hidden) { clearInterval(addTimer); addTimer = null; return; } addBoxAvoid(c); }, 250);
    requestAnimationFrame(() => addBoxAvoid(c));
    if (!coarse()) setTimeout(() => c.querySelector('.tutor-addin')?.focus({ preventScroll: true }), 30);
  }
  function addBoxSubmit() {
    const c = addBoxEl(), typed = cleanSel(c.querySelector('.tutor-addin')?.value || ''), kind = c.dataset.kind;
    st.pendingSelection = typed || c.dataset.sel || ''; st.pendingEl = typed ? null : c._el;
    addBoxClose();
    if (kind === 'fav') addFav(); else addNote();
  }
  T.favSelection = function () { addBoxOpen('fav'); };
  T.noteSelection = function () { addBoxOpen('nb'); };
  /*SEL-TR*/ // 🌐 translate the selection in a small card next to the toolbar (premium: coach translate · others: built-in glossary)
  const trCache = new Map();
  async function trFetch(text) {
    const k = text.toLowerCase(); if (trCache.has(k)) return trCache.get(k);
    const r = await coachApi('translate', { text });
    if (trCache.size > 60) trCache.delete(trCache.keys().next().value);
    trCache.set(k, r); return r;
  }
  function trCardEl() {
    let c = document.querySelector('.tutor-trcard');
    if (!c) {
      c = document.createElement('div'); c.className = 'tutor-trcard'; c.hidden = true; c.setAttribute('role', 'dialog');
      c.addEventListener('mousedown', (e) => { if (!e.target.closest('textarea,input')) e.preventDefault(); });
      c.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.k === 'x') c.hidden = true;
        else if (b.dataset.k === 'say') T.sayText(b.dataset.t || '');
        else if (b.dataset.k === 'nb') T.noteSelection();
        else if (b.dataset.k === 'full') { /*SEL-TRFULL*/ c.hidden = true; T._selMute = Date.now() + 1500; hideBubble(true); try { window.getSelection()?.removeAllRanges(); } catch (x) { /* ignore */ } frameClear(); window.AmkTranslate?.open(b.dataset.t || ''); }
        else if (b.dataset.k === 'plans') { c.hidden = true; if (typeof openPremiumPlans === 'function') openPremiumPlans('translator'); }
      });
      document.body.appendChild(c);
    }
    return c;
  }
  function placeTrCard(c) {
    if (!bubble || bubble.hidden) return;
    const b = bubble.getBoundingClientRect(), r = T._selRect || b, w = Math.min(340, innerWidth - 16), h = c.offsetHeight || 120;
    c.style.width = w + 'px';
    let top = b.top < r.top ? b.top - h - 6 : b.bottom + 6;          // keep the selected text visible
    if (top < 8) top = Math.max(r.bottom, b.bottom) + 6;
    if (top + h > innerHeight - 8) top = Math.max(8, Math.min(b.top, r.top) - h - 6);
    const left = Math.max(8, Math.min(innerWidth - w - 8, b.left + b.width / 2 - w / 2));
    c.style.top = Math.round(top) + 'px'; c.style.left = Math.round(left) + 'px';
  }
  T.translateSelection = async function () {
    const text = cleanSel(st.pendingSelection).slice(0, 480); if (!text) return;
    const c = trCardEl(), FAR = /[؀-ۿ]/, srcDe = !FAR.test(text);
    const head = `<button type="button" class="tutor-trx" data-k="x" aria-label="close">×</button>`;
    const paint = (html) => { c.innerHTML = head + html; c.querySelectorAll('.tutor-tract button').forEach((b) => iconize(b)); /*SEL-COMPACT*/ c.hidden = false; placeTrCard(c); requestAnimationFrame(() => placeTrCard(c)); };
    c.dataset.for = text;
    paint(`<div class="tutor-trload">${L('در حال ترجمه…', 'Wird übersetzt …')}</div>`);
    const found = window.TDM?.lookupWord ? window.TDM.lookupWord(text) : null;
    let r = null;
    if (premium()) { try { r = await trFetch(text); } catch (e) { r = null; } }
    if (c.dataset.for !== text) return;                                  // another selection was translated meanwhile
    const tr = String(r?.translation || (premium() ? found?.answer : '') || '').trim(); /*AMK-PREMIUM: translation is premium-only*/
    if (!tr) {
      paint(premium() ? `<p class="tutor-trerr">${L('ترجمه الان ممکن نشد. دوباره امتحان کن.', 'Übersetzung gerade nicht möglich.')}</p>`
        : `<p class="tutor-trerr">${L('ترجمهٔ آزاد متن برای حساب ویژه فعال است.', 'Freie Übersetzung gibt es mit Premium.')}</p><div class="tutor-tract"><button type="button" data-k="plans">⭐ ${L('مشاهده اشتراک ویژه', 'Premium ansehen')}</button></div>`);
      return;
    }
    const german = srcDe ? text : String(r?.headword_de || tr);
    const wi = String(r?.word_info || ''), hw = String(r?.headword_de || ''); const info = [hw && hw !== text && !wi.includes(hw) ? hw : '', wi, r?.related_de ? '↔ ' + r.related_de + (r.related_fa ? ' (' + r.related_fa + ')' : '') : '' /*TR-REL2*/].filter(Boolean).join(' · '); /*SEL-TR2*/ /*TR-REL*/
    const canNote = srcDe && !!window.TDM?.deckAddEntry && text.length <= 160;
    paint(`<div class="tutor-trsrc" dir="auto">${E(text.length > 90 ? text.slice(0, 90) + '…' : text)}</div>
      <div class="tutor-trmain" dir="auto">${E(tr)}</div>
      ${info ? `<div class="tutor-trinfo" dir="ltr">${E(info)}</div>` : ''}
      <div class="tutor-tract"><button type="button" data-k="say" data-t="${E(german)}">🔊 ${L('تلفظ', 'Aussprache')}</button>${canNote ? `<button type="button" data-k="nb">📒 ${L('به دفتر', 'Ins Heft')}</button>` : ''}${window.AmkTranslate && premium() ? `<button type="button" data-k="full" data-t="${E(text)}">${L('همایندها و بیشتر', 'Kollokationen')} ›</button>` : ''}</div>`);
  };
  /*SEL-PREFS*/ // which selection-toolbar buttons the user wants (تنظیمات برنامه → «گزینه‌های انتخاب متن»)
  const SBL = (f, e, d) => fa() ? f : appS()?.uiLanguage === 'en' ? e : d;
  const SELBAR_ACTS = [
    ['tr', '🌐', ['ترجمه', 'Translation', 'Übersetzen'], ['ترجمهٔ متن انتخاب‌شده در یک کادر کوچک', 'Translate the selected text in a small box', 'Den markierten Text in einem kleinen Feld übersetzen']],
    ['say', '🔊', ['تلفظ', 'Pronunciation', 'Aussprache'], ['خواندن متن آلمانی با صدای طبیعی', 'Read the German text aloud with natural pronunciation', 'Den deutschen Text mit natürlicher Stimme vorlesen']],
    ['nb', '📒', ['به دفتر عبارات', 'To the phrase book', 'Ins Ausdrucksheft'], ['افزودن لغت یا عبارت به دفتر عبارات', 'Add the word or phrase to the phrase book', 'Wort oder Ausdruck ins Ausdrucksheft aufnehmen']],
    ['fav', '⭐', ['افزودن به علاقه‌مندی‌ها', 'Add to favorites', 'Zu den Favoriten'], ['ذخیرهٔ متن در علاقه‌مندی‌ها', 'Save the text in your favorites', 'Den Text in den Favoriten speichern']],
    ['ask', '❓', ['از مربی بپرس', 'Ask the tutor', 'Tutor fragen'], ['فرستادن متن به مربی آلمانی برای توضیح', 'Send the text to the German tutor for an explanation', 'Den Text dem Deutsch-Tutor zur Erklärung senden']],
  ];
  function selbarOff() { const a = appS()?.appSettings; return Array.isArray(a?.selbarOff) ? a.selbarOff : []; }
  T.setSelbarAct = function (act, on) {
    const off = new Set(selbarOff()); if (on) off.delete(act); else off.add(act);
    if (bubble && !bubble.hidden) hideBubble();
    if (typeof setAppSetting === 'function') setAppSetting('selbarOff', [...off]);
  };
  T.selbarSettingsHtml = function () {
    const off = selbarOff();
    const rows = SELBAR_ACTS.map(([id, ic, name, hint]) => `<label><span><b>${ic} ${SBL(name[0], name[1], name[2])}</b><small>${SBL(hint[0], hint[1], hint[2])}</small></span><input type="checkbox" ${off.includes(id) ? '' : 'checked'} onchange="Tutor.setSelbarAct('${id}',this.checked)"></label>`).join('');
    return `<section class="app-pref-card" data-sel-prefs><div class="app-pref-title"><span aria-hidden="true">✍️</span><div><h2>${SBL('گزینه‌های انتخاب متن', 'Text-selection options', 'Optionen für Textauswahl')}</h2><p>${SBL('دکمه‌هایی که با انتخاب یک متن در نوار شناور می‌آیند؛ هرکدام را نمی‌خواهید خاموش کنید', 'The buttons that appear in the floating bar when you select text; switch off the ones you do not want', 'Die Schaltflächen, die beim Markieren von Text in der schwebenden Leiste erscheinen; schalte ab, was du nicht brauchst')}</p></div></div><div class="pref-toggles">${rows}</div></section>`;
  };
  /*SEL-COMPACT*/ // short labels on desktop, icons only on phones (CSS hides .sb-tx); full name stays in title/aria-label
  const SB_SHORT = { tr: ['ترجمه', 'Übersetzen', 'Translate'], say: ['تلفظ', 'Anhören', 'Listen'], nb: ['دفتر', 'Heft', 'Notebook'], fav: ['علاقه‌مندی', 'Favorit', 'Favorite'], ask: ['بپرس', 'Fragen', 'Ask'] };
  function iconize(btn, short) {
    if (btn.querySelector('.sb-ic')) return;
    const full = btn.textContent.trim(), m = full.match(/^(\S+)\s+(.+)$/);
    if (!m || /[\p{L}\p{N}]/u.test(m[1])) return;                      // no leading icon → leave as it is
    btn.title = full; btn.setAttribute('aria-label', full);
    btn.innerHTML = `<span class="sb-ic" aria-hidden="true">${m[1]}</span><span class="sb-tx">${E(short || m[2])}</span>`;
  }
  function compactSelbar() {
    bubble.querySelectorAll('button[data-act]').forEach((b) => { const s = SB_SHORT[b.dataset.act]; iconize(b, s && SBL(s[0], s[2], s[1])); });
    if (!window.matchMedia?.('(max-width:720px),(hover:none) and (pointer:coarse)').matches) return;
    let seen = '1'; try { seen = localStorage.getItem('amk-selbar-hint') || ''; localStorage.setItem('amk-selbar-hint', '1'); } catch (e) { /* ignore */ }
    if (!seen) setTimeout(() => toast(L('🌐 ترجمه · 🔊 تلفظ · 📒 دفتر عبارات · ⭐ علاقه‌مندی · ❓ پرسیدن از مربی', '🌐 Übersetzen · 🔊 Anhören · 📒 Heft · ⭐ Favorit · ❓ Tutor fragen')), 250);
  }
  /*SEL-AVOID*/ /*SEL-AVOID2*/ /*SEL-AVOID3*/ // keep toolbar / translation card out from under other layers (Google Translate bubble …)
  const hit = (a, b, pad = 4) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  const ours = (t) => !!t?.closest?.('.tutor-selbar,.tutor-trcard,.tutor-addcard'); /*SEL-ADDBOX3*/
  function probe(r) {
    const o = [];
    for (const fx of [0.04, 0.27, 0.5, 0.73, 0.96]) for (const fy of [0.2, 0.5, 0.8]) {
      const x = r.left + (r.right - r.left) * fx, y = r.top + (r.bottom - r.top) * fy;
      if (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) o.push([x, y]);
    }
    return o;
  }
  // elements lying on top of `el` (not page content under it, not our own toolbar/card)
  function coverers(el) {
    const set = new Set();
    for (const [x, y] of probe(el.getBoundingClientRect())) { const t = document.elementFromPoint(x, y); if (t && t !== el && !el.contains(t) && !ours(t)) set.add(t); }
    return set;
  }
  function blockedAt(r, cov) {
    for (const [x, y] of probe(r)) {
      const t = document.elementFromPoint(x, y); if (!t || ours(t)) continue;
      for (const c of cov) if (c === t || c.contains(t)) return true;
      if (window.AmkSelForeign?.(t)) return true;
    }
    return false;
  }
  function moveClear(el, avoid) {
    const cov = coverers(el); if (!cov.size) return false;
    const cur = el.getBoundingClientRect(), w = cur.width, h = cur.height, sel = T._selRect || cur;
    const box = (t, l) => ({ top: t, left: l, right: l + w, bottom: t + h });
    const tops = [cur.top];
    for (let k = 0; k <= 12; k++) tops.push(sel.top - h - 8 - k * 26, sel.bottom + 8 + k * 26);
    const lefts = [cur.left]; for (const dx of [80, 160, 240, 320, 420]) lefts.push(cur.left + dx, cur.left - dx);
    let best = null;
    for (const t of tops) for (const l of lefts) {
      if (t < 8 || t + h > innerHeight - 8 || l < 8 || l + w > innerWidth - 8) continue;
      const b = box(t, l); if (avoid.some((a) => hit(b, a))) continue;
      const d = Math.abs(t - cur.top) + Math.abs(l - cur.left) * 0.7;
      if (best && d >= best.d) continue;
      if (blockedAt(b, cov)) continue;
      best = { t, l, d };
    }
    if (best) { el.style.top = Math.round(best.t) + 'px'; el.style.left = Math.round(best.l) + 'px'; }
    return !!best;
  }
  function avoidOverlays() {
    if (!bubble || bubble.hidden) return;
    const sel = T._selRect ? [T._selRect] : [];
    moveClear(bubble, sel);
    const card = document.querySelector('.tutor-trcard:not([hidden])'); if (!card) return;
    const nb = bubble.getBoundingClientRect();
    if (hit(card.getBoundingClientRect(), nb, 2)) placeTrCard(card);
    moveClear(card, [...sel, nb]);
  }
  let avoidTimer = null;
  function watchOverlays() {
    clearInterval(avoidTimer);
    avoidTimer = setInterval(() => { if (!bubble || bubble.hidden) { clearInterval(avoidTimer); avoidTimer = null; return; } avoidOverlays(); }, 250);
    requestAnimationFrame(avoidOverlays);
  }
  T.askSelection = function () {
    if (!premium()) { hideBubble(); try { window.getSelection()?.removeAllRanges(); } catch (e) { /* ignore */ } if (typeof openPremiumPlans === 'function') openPremiumPlans('language-coach'); return; } /*AMK-PREMIUM*/
    if (st.pendingSelection) st.selection = st.pendingSelection;
    hideBubble();
    try { window.getSelection()?.removeAllRanges(); } catch (e) { /* ignore */ }
    if (!st.draft.trim()) st.draft = L('این بخش را توضیح بده (معنی، گرامر و کاربرد).', 'Erklär mir bitte diese Stelle (Bedeutung, Grammatik, Gebrauch).');
    T.open(true);
  };
  T.clearSelection = function () { st.selection = ''; paintContext(); };

  // ───────── API with timeout ─────────
  function api(path, options = {}) {
    return Promise.race([apiRequest('/tutor' + path, options), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { status: 0, timeout: true })), REQUEST_TIMEOUT))]);
  }
  function friendlyError(e) {
    if (e?.timeout) return L('پاسخ دیر رسید. دوباره تلاش کن.', 'Zeitüberschreitung. Bitte erneut versuchen.');
    if (!navigator.onLine) return L('اتصال اینترنت قطع است.', 'Keine Internetverbindung.');
    if (e?.status === 403) return L('مربی آلمانی برای حساب‌های Premium فعال است.', 'Der Tutor ist für Premium-Konten verfügbar.');
    if (e?.status === 429) return L('سؤال‌ها خیلی پشت سر هم بود؛ چند ثانیه صبر کن و دوباره بفرست.', 'Zu viele Fragen hintereinander – bitte kurz warten.');
    if (e?.status === 503 || e?.status === 502) return L('مربی الان شلوغ است؛ چند لحظه بعد دوباره تلاش کن.', 'Der Tutor ist gerade ausgelastet – bitte gleich noch einmal.');
    return L('ارسال انجام نشد؛ دوباره تلاش کن.', 'Senden fehlgeschlagen – bitte erneut versuchen.');
  }

  // ───────── conversations ─────────
  async function ensureLoaded() {
    if (st.loaded || st.loading) return;
    st.loading = true; st.error = ''; paint();
    try {
      const data = await api('/conversations');
      st.convs = data.conversations || [];
      if (!st.activeId || !st.convs.some((c) => c.id === st.activeId)) st.activeId = st.convs[0]?.id || null;
      if (st.activeId) await loadConversation(st.activeId, false); else st.messages = [];
      st.loaded = true;
    } catch (e) { st.error = friendlyError(e); }
    finally { st.loading = false; persist(); paint(); scrollToEnd(); }
  }
  async function loadConversation(id, doPaint = true) {
    const data = await api('/conversations/' + encodeURIComponent(id) + '?limit=60');
    st.activeId = id; st.messages = data.messages || []; persist();
    if (doPaint) { paint(); scrollToEnd(); }
  }
  async function createConversation() {
    const item = await api('/conversations', { method: 'POST', body: JSON.stringify({ title: 'Lernfragen' }) });
    st.convs = [item, ...st.convs.filter((c) => c.id !== item.id)]; st.activeId = item.id; st.messages = []; persist();
    return item;
  }
  T.newChat = async function () {
    if (st.sending) return;
    st.historyOpen = false; st.error = '';
    if (st.activeId && !st.messages.length) { paint(); focusInput(); return; }
    st.loading = true; paint();
    try { await createConversation(); } catch (e) { st.error = friendlyError(e); }
    st.loading = false; paint(); focusInput();
  };
  T.openConversation = async function (id) {
    if (st.sending || id === st.activeId) { st.historyOpen = false; paint(); return; }
    st.loading = true; st.historyOpen = false; paint();
    try { await loadConversation(id, false); } catch (e) { st.error = friendlyError(e); }
    st.loading = false; paint(); scrollToEnd();
  };
  T.deleteConversation = async function (id) {
    if (st.confirmDelete !== id) { st.confirmDelete = id; paint(); return; }
    st.confirmDelete = null;
    try { await api('/conversations/' + encodeURIComponent(id), { method: 'DELETE' }); } catch (e) { if (e?.status !== 404) { st.error = friendlyError(e); paint(); return; } }
    st.convs = st.convs.filter((c) => c.id !== id);
    if (st.activeId === id) { st.activeId = st.convs[0]?.id || null; st.messages = []; if (st.activeId) { try { await loadConversation(st.activeId, false); } catch (e) { /* ignore */ } } }
    persist(); paint();
  };

  // ───────── sending ─────────
  T.send = async function (preset) {
    const text = String(preset ?? st.draft).trim();
    if (!text || st.sending) return;
    if (text.length > 4000) { st.error = L('پیام حداکثر ۴۰۰۰ کاراکتر است.', 'Höchstens 4000 Zeichen.'); paint(); return; }
    const ctx = st.useContext ? gatherContext() : (st.selection ? { selection: st.selection.slice(0, 1400) } : null);
    const msg = { id: uid(), role: 'user', content: text, pending: true, ctxLabel: ctx ? (contextLabel(ctx) || '') : '', selection: st.selection || '', ctx };
    st.messages.push(msg); st.draft = ''; st.selection = ''; st.error = '';
    await deliver(msg);
  };
  async function deliver(msg) {
    st.sending = true; msg.pending = true; msg.failed = false; paint(); scrollToEnd();
    try {
      if (!st.activeId) await createConversation();
      let data;
      try { data = await post(msg); }
      catch (e) { if (e?.status === 404) { await createConversation(); data = await post(msg); } else throw e; }
      const i = st.messages.indexOf(msg);
      const saved = { ...data.user_message, ctxLabel: msg.ctxLabel, selection: msg.selection };
      if (i >= 0) st.messages.splice(i, 1, saved, data.assistant_message); else st.messages.push(saved, data.assistant_message);
      const conv = st.convs.find((c) => c.id === st.activeId);
      if (conv) { if (!conv.message_count) conv.title = msg.content.slice(0, 70); conv.message_count = (conv.message_count || 0) + 2; st.convs = [conv, ...st.convs.filter((c) => c !== conv)]; }
    } catch (e) {
      msg.pending = false; msg.failed = true; msg.error = friendlyError(e);
    } finally { st.sending = false; paint(); scrollToEnd(); persist(); }
  }
  function post(msg) {
    return api('/conversations/' + encodeURIComponent(st.activeId) + '/messages', { method: 'POST', body: JSON.stringify({ content: msg.content, client_message_id: msg.id, ui_language: (appS()?.uiLanguage || 'fa'), context: msg.ctx || null }) });
  }
  T.retry = function (id) { const msg = st.messages.find((m) => m.id === id && m.failed); if (msg && !st.sending) deliver(msg); };
  T.discard = function (id) { st.messages = st.messages.filter((m) => !(m.id === id && m.failed)); paint(); };
  T.copy = function (id) { const m = st.messages.find((x) => x.id === id); if (!m) return; navigator.clipboard?.writeText(m.content).then(() => { const b = root.querySelector(`[data-copy="${id}"]`); if (b) { b.textContent = '✓'; setTimeout(() => { b.textContent = '⧉'; }, 1200); } }).catch(() => {}); };

  // ───────── open / close / modes ─────────
  T.open = function (focus = true) { st.open = true; persist(); paint(); ensureLoaded(); if (focus) focusInput(); };
  T.close = function () { st.open = false; st.historyOpen = false; persist(); paint(); };
  T.toggleMode = function () { st.mode = st.mode === 'dock' ? 'float' : 'dock'; if (st.mode === 'float' && !st.pos) st.pos = { left: Math.max(16, window.innerWidth - 700), top: Math.max(16, window.innerHeight - 660) }; persist(); paint(); };
  T.toggleHistory = function () { st.historyOpen = !st.historyOpen; st.confirmDelete = null; paint(); };
  T.toggleContext = function (on) { st.useContext = !!on; persist(); paintContext(); };
  T.input = function (el) { st.draft = el.value; autoGrow(el); };
  T.key = function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); T.send(); } };
  T.quick = function (i) { const q = quickPrompts()[i]; if (!q) return; if (q.needsSel && !st.selection) { st.draft = q.text + ' '; paint(); focusInput(); return; } T.send(q.text); };
  function quickPrompts() {
    return [
      { text: L('این بخش را توضیح بده (معنی، گرامر، کاربرد).', 'Erklär mir diese Stelle (Bedeutung, Grammatik, Gebrauch).'), label: L('توضیح بخش انتخاب‌شده', 'Markierte Stelle erklären'), needsSel: true },
      { text: L('معنی، حرف تعریف، جمع و ترکیب‌های رایج این کلمه را بگو:', 'Bedeutung, Artikel, Plural und Kollokationen von:'), label: L('معنی و ترکیب‌های یک کلمه', 'Wort erklären'), needsSel: true },
      { text: L('ساختار گرامری این جمله را تحلیل کن.', 'Analysiere die Grammatik dieses Satzes.'), label: L('تحلیل گرامری جمله', 'Satz analysieren'), needsSel: true },
      { text: L('متن من را تصحیح کن و مهم‌ترین اشتباه‌ها را توضیح بده.', 'Korrigiere meinen Text und erkläre die wichtigsten Fehler.'), label: L('تصحیح متن من', 'Meinen Text korrigieren') },
      { text: L('برای همین مرحله یک نکته عملی و کوتاه بده.', 'Gib mir einen kurzen, praktischen Tipp für diesen Schritt.'), label: L('نکته برای این مرحله', 'Tipp für diesen Schritt') }
    ];
  }

  // ───────── rendering ─────────
  function inline(s) {
    return s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<i>$2</i>');
  }
  function md(text) { /*TUTOR-MD2*/
    const LAT = /[A-Za-zÄÖÜäöüß]/g, FAR = /[؀-ۿ]/g;
    const isDe = (s) => { const t = s.replace(/<[^>]+>/g, ''); const a = (t.match(LAT) || []).length, f = (t.match(FAR) || []).length; return a >= 8 && a > f * 2; };
    const lines = E(text).split(/\r?\n/);
    let out = '', list = null, sec = false, lastLi = false;
    const close = () => { if (list) { out += `</${list}>`; list = null; } lastLi = false; };
    const head = (h) => { close(); if (sec) out += '</section>'; out += `<section class="tutor-sec"><h4 class="tutor-h" dir="auto">${inline(h)}</h4>`; sec = true; };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) continue;
      const h = line.match(/^\s*#{1,4}\s+(.*)$/) || line.match(/^\s*\*\*([^*]{2,80})\*\*\s*:?\s*$/);
      if (h) { head(h[1].replace(/:\s*$/, '')); continue; }
      const sub = line.match(/^\s*[–—]\s+(.*)$/) || (lastLi && line.match(/^\s{2,}(?:[-*•]\s+)?(.*)$/));
      if (sub && lastLi) {
        const body = inline(sub[1]), de = isDe(body);
        out = out.replace(/<\/li>$/, `<span class="tutor-tr ${de ? 'is-de' : ''}" dir="${de ? 'ltr' : 'auto'}">${body}</span></li>`);
        continue;
      }
      const ul = line.match(/^\s*[-*•]\s+(.*)$/), ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (ul || ol) {
        const type = ul ? 'ul' : 'ol'; if (list !== type) { close(); out += `<${type} dir="auto">`; list = type; }
        const body = inline(ul ? ul[1] : ol[2]), de = isDe(body);
        out += `<li class="${de ? 'is-de' : ''}" dir="${de ? 'ltr' : 'auto'}">${body}</li>`; lastLi = true; continue;
      }
      close();
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { if (!sec) out += '<hr>'; continue; }
      if (sub) { out += `<p class="tutor-tr" dir="auto">${inline(sub[1])}</p>`; continue; }
      const body = inline(line), de = isDe(body);
      out += `<p class="${de ? 'is-de' : ''}" dir="${de ? 'ltr' : 'auto'}">${body}</p>`;
    }
    close(); if (sec) out += '</section>';
    return out;
  }
  function messageHtml(m) {
    if (m.role === 'user') {
      return `<article class="tutor-msg user ${m.pending ? 'is-pending' : ''} ${m.failed ? 'is-failed' : ''}">${m.selection ? `<blockquote dir="auto">${E(m.selection.slice(0, 220))}${m.selection.length > 220 ? '…' : ''}</blockquote>` : ''}<p dir="auto">${E(m.content)}</p>${m.ctxLabel ? `<small class="tutor-ctxnote" dir="auto">📎 ${E(m.ctxLabel)}</small>` : ''}${m.failed ? `<div class="tutor-fail"><span dir="auto">${E(m.error || '')}</span><button onclick="Tutor.retry('${m.id}')">↻ ${L('تلاش دوباره', 'Erneut senden')}</button><button class="ghost" onclick="Tutor.discard('${m.id}')">${L('حذف', 'Verwerfen')}</button></div>` : ''}</article>`;
    }
    return `<article class="tutor-msg bot"><div class="tutor-md">${md(m.content)}</div><footer><button data-copy="${m.id}" title="${L('کپی', 'Kopieren')}" onclick="Tutor.copy('${m.id}')">⧉</button></footer></article>`;
  }
  function contextHtml() {
    const ctx = gatherContext(), label = contextLabel(ctx);
    return `<div class="tutor-ctx" id="tutorCtx">
      ${st.selection ? `<div class="tutor-sel"><span dir="auto">✂ «${E(st.selection.slice(0, 160))}${st.selection.length > 160 ? '…' : ''}»</span><button onclick="Tutor.clearSelection()" aria-label="remove">×</button></div>` : ''}
      <label class="tutor-ctxtoggle"><input type="checkbox" ${st.useContext ? 'checked' : ''} onchange="Tutor.toggleContext(this.checked)"><span dir="auto">📎 ${E(label ? L('زمینه: ', 'Kontext: ') + label : L('بدون زمینه خاص', 'Kein besonderer Kontext'))}</span>${ctx.exam ? `<em>${L('حالت آزمون: فقط راهنمایی', 'Prüfung: nur Hinweise')}</em>` : ''}</label>
    </div>`;
  }
  function paintContext() { const el = root?.querySelector('#tutorCtx'); if (el && st.open) el.outerHTML = contextHtml(); }
  function launcherHtml() {
    return `<button type="button" class="language-coach-launcher tutor-launcher" onclick="Tutor.open()" title="${L('مربی آلمانی – سؤال‌هایت حین مطالعه', 'Deutsch-Tutor – Fragen beim Lernen')}" aria-label="${L('باز کردن مربی آلمانی', 'Deutsch-Tutor öffnen')}"><svg viewBox="0 0 24 24" aria-hidden="true" data-i="TUTOR-ICON2"><path d="M10.5 3.5h9A1.5 1.5 0 0 1 21 5v7a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M13.5 7h4.5M13.5 10h2.8"/><path d="M8.6 7.6a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z"/><path d="M2.6 20.5V17A3.5 3.5 0 0 1 6.1 13.5h2.3l3.9-2.9M8.4 13.5v7"/></svg></button>`;
  }
  function panelHtml() {
    const active = st.convs.find((c) => c.id === st.activeId), q = quickPrompts();
    const history = st.historyOpen ? `<div class="tutor-history"><div class="tutor-history-head"><b>${L('گفتگوهای قبلی', 'Frühere Gespräche')}</b><button onclick="Tutor.newChat()">＋ ${L('گفتگوی تازه', 'Neu')}</button></div>${st.convs.length ? st.convs.map((c) => `<div class="tutor-hitem ${c.id === st.activeId ? 'is-active' : ''}"><button class="tutor-hopen" onclick="Tutor.openConversation('${c.id}')"><b dir="auto">${E(c.title || 'Lernfragen')}</b><small>${Number(c.message_count || 0)} ${L('پیام', 'Nachrichten')}</small></button><button class="tutor-hdel ${st.confirmDelete === c.id ? 'is-confirm' : ''}" onclick="Tutor.deleteConversation('${c.id}')">${st.confirmDelete === c.id ? L('حذف؟', 'Löschen?') : '🗑'}</button></div>`).join('') : `<p class="tutor-muted">${L('هنوز گفتگویی نیست.', 'Noch keine Gespräche.')}</p>`}</div>` : '';
    const body = st.loading ? `<div class="tutor-loading"><i></i><i></i><i></i></div>` : st.messages.length ? st.messages.map(messageHtml).join('') + (st.sending ? `<div class="tutor-typing"><i></i><i></i><i></i></div>` : '') :
      `<div class="tutor-empty"><div class="tutor-empty-badge">DE</div><h3>${L('سؤالت را بپرس', 'Stell deine Frage')}</h3><p dir="auto">${L('معنی کلمه، گرامر یک جمله، تصحیح متن یا نکته برای همین مرحله. می‌توانی بخشی از متن صفحه را انتخاب کنی و «از مربی بپرس» را بزنی.', 'Wortbedeutung, Grammatik, Textkorrektur oder ein Tipp für diesen Schritt. Markiere Text auf der Seite und tippe auf „Tutor fragen“.')}</p><div class="tutor-quick">${q.map((x, i) => `<button onclick="Tutor.quick(${i})" class="${x.needsSel && !st.selection ? 'needs-sel' : ''}">${E(x.label)}</button>`).join('')}</div></div>`;
    return `<section class="tutor-panel" role="complementary" aria-label="${L('مربی آلمانی', 'Deutsch-Tutor')}">
      <header class="tutor-head" onpointerdown="Tutor._drag(event)">
        <span class="tutor-badge">DE</span>
        <div class="tutor-title"><b>${L('مربی آلمانی', 'Deutsch-Tutor')}</b><small dir="auto">${E(active?.title && active.message_count ? active.title : L('پاسخ به سؤال‌هایت حین مطالعه', 'Antworten auf deine Lernfragen'))}</small></div>
        <div class="tutor-actions">
          <button onclick="Tutor.toggleHistory()" title="${L('گفتگوها', 'Gespräche')}" class="${st.historyOpen ? 'is-on' : ''}">☰</button>
          <button onclick="Tutor.newChat()" title="${L('گفتگوی تازه', 'Neues Gespräch')}">＋</button>
          ${isPhone() ? '' : `<button onclick="Tutor.toggleMode()" title="${st.mode === 'dock' ? L('حالت شناور', 'Schwebend') : L('چسباندن به کنار صفحه', 'Andocken')}">${st.mode === 'dock' ? '⧉' : '⇥'}</button>`}
          <button onclick="Tutor.close()" title="${L('بستن (Esc)', 'Schließen (Esc)')}">✕</button>
        </div>
      </header>
      ${history}
      <div class="tutor-messages" id="tutorMessages">${body}</div>
      ${st.error ? `<p class="tutor-error" dir="auto">${E(st.error)} <button onclick="Tutor._reload()">↻</button></p>` : ''}
      <footer class="tutor-compose">
        ${contextHtml()}
        <div class="tutor-inputrow"><textarea id="tutorInput" dir="auto" rows="1" maxlength="4000" placeholder="${L('سؤالت را بنویس… (Enter ارسال، Shift+Enter خط جدید)', 'Deine Frage … (Enter senden, Shift+Enter neue Zeile)')}" oninput="Tutor.input(this)" onkeydown="Tutor.key(event)">${E(st.draft)}</textarea>
        <button class="tutor-send" onclick="Tutor.send()" ${st.sending ? 'disabled' : ''} aria-label="${L('ارسال', 'Senden')}">${st.sending ? '…' : '↑'}</button></div>
      </footer>
    </section>`;
  }
  function paint() {
    if (!root) return;
    const focused = document.activeElement?.id === 'tutorInput', input = root.querySelector('#tutorInput');
    const caret = input ? [input.selectionStart, input.selectionEnd] : null;
    const box = root.querySelector('#tutorMessages'), atEnd = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 40, top = box?.scrollTop || 0;
    root.innerHTML = st.open ? panelHtml() : launcherHtml();
    if (st.open) {
      layout();
      const ni = root.querySelector('#tutorInput'); if (ni) { autoGrow(ni); if (focused) { ni.focus(); if (caret) try { ni.setSelectionRange(caret[0], caret[1]); } catch (e) { /* ignore */ } } }
      const nb = root.querySelector('#tutorMessages'); if (nb) nb.scrollTop = atEnd ? nb.scrollHeight : top;
    } else document.documentElement.classList.remove('tutor-docked');
  }
  function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(150, el.scrollHeight) + 'px'; }
  function scrollToEnd() { /*REPLY-TOP*/ // newest message is a tutor answer -> show it from its first line; otherwise go to the end
    setTimeout(() => {
      const b = root?.querySelector('#tutorMessages'); if (!b) return;
      const msgs = b.querySelectorAll('.tutor-msg'), last = msgs[msgs.length - 1];
      if (last && last.classList.contains('bot') && !st.sending) b.scrollTop += last.getBoundingClientRect().top - b.getBoundingClientRect().top - 8;
      else b.scrollTop = b.scrollHeight;
    }, 30);
  }
  function focusInput() { setTimeout(() => { const i = root?.querySelector('#tutorInput'); if (i && !isPhone()) { i.focus(); const n = i.value.length; try { i.setSelectionRange(n, n); } catch (e) { /* ignore */ } } }, 40); }
  T._drag = startDrag;
  T._reload = function () { st.loaded = false; st.error = ''; ensureLoaded(); };
  T._state = st;
  if (document.readyState !== 'loading') mount(); else document.addEventListener('DOMContentLoaded', mount);
})();

/*SELECTABLE*/ // option texts (buttons) are selectable; finishing a text selection inside a button is not a click
(function () {
  'use strict';
  let downX = 0, downY = 0;
  document.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; }, true);
  document.addEventListener('click', (e) => {
    const b = e.target?.closest?.('button,[role="button"],label,summary,[onclick],a[href]');
    if (!b || e.detail === 0 || b.closest('.tutor-selbar')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !String(sel).trim()) return;
    const moved = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4;
    const inside = (n) => !!n && b.contains(n);
    if ((moved || e.detail > 1) && (inside(sel.anchorNode) || inside(sel.focusNode))) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true);
})();

/*SEL-NO-FA*/ // only German text is selectable: a selection that starts on a Persian word (or a button without German text) is blocked
// 2026-11-21: the grammar-drill bot (.gd-overlay) is exempt — learners must be able to copy its Persian sentences.
(function () {
  'use strict';
  const FA = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/, LAT = /[A-Za-zÄÖÜäöüß]/;
  let px = -1, py = -1;
  document.addEventListener('pointerdown', (e) => { px = e.clientX; py = e.clientY; }, true);
  function wordAt(node, off) {
    const t = node.nodeValue || ''; let a = off, b = off;
    while (a > 0 && !/\s/.test(t[a - 1])) a--;
    while (b < t.length && !/\s/.test(t[b])) b++;
    return t.slice(a, b);
  }
  document.addEventListener('selectstart', (e) => {
    const n = e.target, el = n && (n.nodeType === 1 ? n : n.parentElement);
    if (!el || el.closest('input,textarea,select,[contenteditable="true"],.tutor-root,.gd-overlay')) return;
    let txt = n.nodeType === 3 ? n.nodeValue || '' : el.textContent || '';
    try {
      const r = px >= 0 && document.caretRangeFromPoint ? document.caretRangeFromPoint(px, py) : null;
      if (r && r.startContainer.nodeType === 3 && el.contains(r.startContainer)) { const w = wordAt(r.startContainer, r.startOffset); if (LAT.test(w) || FA.test(w)) txt = w; }
    } catch (err) { /* ignore */ }
    const btn = el.closest('button,[role="button"],label,summary');
    if (FA.test(txt) || (btn && !LAT.test(btn.textContent || ''))) e.preventDefault();
  }, true);
})();

/*SEL-EXT*/ // clicking inside an extension overlay (Google Translate bubble / its ×) must not end the page selection
(function () {
  'use strict';
  const foreign = (t) => {
    let el = t && t.nodeType === 1 ? t : t?.parentElement;
    while (el && el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement) el = el.parentElement;
    if (!el || el === document.body || el.id === 'app') return false;
    return /^gtx/i.test(el.id || '') || el.tagName.includes('-') || el.parentElement === document.documentElement;
  };
  const isField = (e) => (e.composedPath?.() || []).some((n) => n.nodeType === 1 && (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName) || n.isContentEditable));
  window.AmkSelForeign = foreign;
  // SEL-CLEAR skips these targets; here we only keep the browser from collapsing the selection (events still reach the extension)
  window.addEventListener('mousedown', (e) => { if (foreign(e.target) && !isField(e)) e.preventDefault(); }, true);
})();

/*SEL-CLEAR*/ // a click anywhere outside the selected text (Persian text, buttons, empty space ...) ends the selection
(function () {
  'use strict';
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const sel = window.getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    if (e.target?.closest?.('.tutor-selbar,.tutor-trcard,input,textarea,select,[contenteditable="true"]')) return; /*SEL-INPUT2*/
    if (window.AmkSelForeign?.(e.target)) return; /*SEL-EXT*/
    { const f = document.activeElement; if (f && /^(INPUT|TEXTAREA)$/.test(f.tagName)) return; }
    try {
      const rects = sel.getRangeAt(0).getClientRects();
      for (const r of rects) if (e.clientX >= r.left - 2 && e.clientX <= r.right + 2 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2) return;
    } catch (err) { /* ignore */ }
    try { sel.removeAllRanges(); } catch (err) { /* ignore */ }
  }, true);
})();

/*NO-ALT-MENU*/ // pressing Alt alone does nothing (no browser menu / menu-button focus); Alt combos and AltGr keep working
(function () {
  'use strict';
  const lone = (e) => e.key === 'Alt' && !e.ctrlKey && !e.metaKey && e.code !== 'AltRight';
  window.addEventListener('keydown', (e) => { if (lone(e)) e.preventDefault(); }, true);
  window.addEventListener('keyup', (e) => { if (lone(e)) e.preventDefault(); }, true);
})();

