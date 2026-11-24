/* Amookht — right-click word highlight (WORD-HL, 2026-11-19; HL-MENU, 2026-11-20; HL-RAIL, 2026-11-20).
   روی هر واژه در بخش تمرین‌ها کلیک راست کن تا هایلایت شود؛ کلیک راست دوباره روی همان واژه، هایلایت را برمی‌دارد.
   اگر کلیک راست دو ثانیه نگه داشته شود، منوی معمول کلیک راست باز می‌شود و هایلایتی انجام نمی‌شود (RCLICK-HOLD).
   با اولین هایلایت، یک ریل آیکونی باریک (به عرض یک آیکون) در سمت راست صفحه و کنارِ چپِ منوی اصلی برنامه باز می‌شود:
     ۱ دفتر عبارات · ۲ پاک کردن همه هایلایت‌ها · ۳ علاقه‌مندی‌ها · ۴ تغییر رنگ (پاپ‌آور رنگ‌ها)
   هر آیکون با بردن موس، توضیح کوتاه خودش را بالای آیکون نشان می‌دهد.
   Highlights are kept in a small store and re-painted after any re-render of the app (HL-SAFE),
   so scrolling / typing / auto-save no longer wipes them. */
(function () {
  'use strict';
  var MARK = 'amk-word-hl';
  /* HL-EXERCISE (2026-11-20): buttons are no longer skipped, so questions and multiple-choice options
     (which live in <button> tags) can be highlighted too. */
  var SKIP = 'input,textarea,select,option,a,svg,math,style,script,[oncontextmenu],[contenteditable=""],[contenteditable="true"],[data-no-word-hl],.amk-no-word-hl,.amk-struct';
  var BLOCK_SEL = 'p,li,h1,h2,h3,h4,h5,h6,td,th,figcaption,blockquote,button,[data-amk-hl-block]';
  /* HL-SCOPE (2026-11-21): the app's own windows (grammar bot, free space) render outside #app, so they count too */
  var SCOPE = '#app,.gd-overlay,.fg-root';
  var BLOCK_ALL = '#app ' + BLOCK_SEL + ',.gd-overlay ' + BLOCK_SEL + ',.fg-root ' + BLOCK_SEL;
  var IS_WORD = /[\p{L}\p{N}'’\u2011-]/u;
  var HAS_WORD = /[\p{L}\p{N}]/u;
  var seq = 0;
  var store = new Map();          // id -> { text, word, nth, missing, color }

  /* ---------- colors (HL-COLOR): زرد=ساختار، سبز=کلمه تازه، آبی=مهم، ... ---------- */
  var COLORS = [
    ['yellow', 'زرد · ساختار', 'Gelb · Struktur', 'Yellow · structure', '250,204,21'],
    ['green', 'سبز · کلمه تازه', 'Grün · neues Wort', 'Green · new word', '52,211,153'],
    ['blue', 'آبی · مهم', 'Blau · wichtig', 'Blue · important', '96,165,250'],
    ['orange', 'نارنجی · نکته', 'Orange · Hinweis', 'Orange · note', '251,146,60'],
    ['pink', 'صورتی · تلفظ', 'Rosa · Aussprache', 'Pink · pronunciation', '244,114,182'],
    ['purple', 'بنفش · گرامر', 'Violett · Grammatik', 'Purple · grammar', '167,139,250']
  ];
  var curColor = 'yellow';
  var lastId = 0;

  function L(fa, de, en) { try { var l = window.S && S.uiLanguage; return l === 'de' ? de : l === 'en' ? en : fa; } catch (e) { return fa; } }
  function faNum(n) { try { return typeof window.faNum === 'function' ? window.faNum(n) : String(n); } catch (e) { return String(n); } }
  function colorRgb(name) {
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i][0] === name) return COLORS[i][4];
    return COLORS[0][4];
  }

  /* MEMBER-ONLY (2026-11-20): right-click highlighting belongs to signed-in members.
     The public landing screen (#app[data-screen="landing"]) keeps the browser's normal
     right-click menu and never paints a highlight or shows the highlight rail. */
  function memberView() {
    var app = document.getElementById('app');
    if (!app) return false;
    var scr = app.getAttribute('data-screen') || '';
    return scr !== 'landing' && scr !== 'auth';
  }

  /* ---------- pointer → word ---------- */
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) {
      var p = document.caretPositionFromPoint(x, y);
      if (p && p.offsetNode) return { node: p.offsetNode, offset: p.offset };
    }
    if (document.caretRangeFromPoint) {
      var r = document.caretRangeFromPoint(x, y);
      if (r && r.startContainer) return { node: r.startContainer, offset: r.startOffset };
    }
    return null;
  }

  function wordRangeAt(x, y) {
    var c = caretAt(x, y);
    if (!c || c.node.nodeType !== 3) return null;
    var node = c.node, text = node.nodeValue || '', i = Math.min(c.offset, text.length);
    if (!HAS_WORD.test(text)) return null;
    var before = i > 0 && IS_WORD.test(text.charAt(i - 1));
    var after = i < text.length && IS_WORD.test(text.charAt(i));
    if (!before && !after) return null;
    var a = i, b = i;
    while (a > 0 && IS_WORD.test(text.charAt(a - 1))) a--;
    while (b < text.length && IS_WORD.test(text.charAt(b))) b++;
    if (b <= a) return null;
    var range = document.createRange();
    range.setStart(node, a);
    range.setEnd(node, b);
    return { range: range, word: text.slice(a, b) };
  }

  /* ---------- text helpers ---------- */
  function isBoundary(text, s, e) {
    var b = s > 0 ? text.charAt(s - 1) : '', a = e < text.length ? text.charAt(e) : '';
    return (!b || !IS_WORD.test(b)) && (!a || !IS_WORD.test(a));
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function blockOf(node) {
    var el = node.parentElement;
    if (!el) return null;
    var block = el.closest(BLOCK_SEL);
    if (block) {
      /* option buttons keep the A/B/C badge in <b> before the answer text; highlight only the text part
         (its own span) so the badge stays out of the word boundary checks. */
      if (block.tagName === 'BUTTON') {
        var host = el.closest('span') || el;
        if (host && host !== block && block.contains(host) && HAS_WORD.test(host.textContent || '')) {
          host.setAttribute('data-amk-hl-block', '1');
          return host;
        }
      }
      return block;
    }
    el.setAttribute('data-amk-hl-block', '1');
    return el;
  }

  function offsetOf(block, node, offset) {
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), n, total = 0;
    while ((n = walker.nextNode())) {
      if (n === node) return total + offset;
      total += n.nodeValue.length;
    }
    return -1;
  }

  function locate(block, index, isStart) {
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), n, total = 0;
    while ((n = walker.nextNode())) {
      var len = n.nodeValue.length;
      if (isStart ? index < total + len : index <= total + len) return { node: n, offset: index - total };
      total += len;
    }
    return null;
  }

  function rangeFromOffsets(block, s, e) {
    var a = locate(block, s, true), b = locate(block, e, false);
    if (!a || !b) return null;
    var range = document.createRange();
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
    return range;
  }

  function occurrenceIndex(text, word, offset) {
    var nth = 0, from = 0, idx;
    while ((idx = text.indexOf(word, from)) !== -1 && idx < offset) {
      if (isBoundary(text, idx, idx + word.length)) nth++;
      from = idx + 1;
    }
    return nth;
  }

  /* ---------- paint / unpaint ---------- */
  function tag(span, color) { span.dataset.c = color || 'yellow'; }

  function paint(id, entry, block) {
    var text = block.textContent, re = new RegExp(escapeRe(entry.word), 'g'), m, seen = 0, start = -1;
    while ((m = re.exec(text))) {
      if (!entry.exact && !isBoundary(text, m.index, m.index + entry.word.length)) continue;
      if (seen === entry.nth) { start = m.index; break; }
      seen++;
    }
    if (start < 0) return false;
    var range = rangeFromOffsets(block, start, start + entry.word.length);
    if (!range) return false;
    var span = document.createElement('span');
    span.className = MARK;
    span.setAttribute('dir', 'auto');
    span.dataset.hlId = String(id);
    if (entry.group) span.dataset.hlGroup = entry.group;
    tag(span, entry.color);
    try { range.surroundContents(span); } catch (e) { return false; }
    return true;
  }

  function unwrap(span) {
    var parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  }

  function removeHighlight(span) {
    var id = Number(span.dataset.hlId);
    var entry = id ? store.get(id) : null;
    var gid = entry && entry.group;
    if (gid) {
      /* HL-SENTENCE: a sentence is painted in slices; a right click on one slice clears the whole sentence */
      var all = document.querySelectorAll("." + MARK + "[data-hl-group='" + gid + "']");
      for (var i = 0; i < all.length; i++) unwrap(all[i]);
      Array.from(store.keys()).forEach(function (k) {
        var e = store.get(k);
        if (e && e.group === gid) store.delete(k);
      });
    } else {
      if (id) store.delete(id);
      unwrap(span);
    }
    refreshMenu();
  }

  function addHighlight(hit) {
    var node = hit.range.startContainer;
    var block = blockOf(node);
    if (!block || (block.closest && block.closest(SKIP))) return;
    var off = offsetOf(block, node, hit.range.startOffset);
    if (off < 0) return;
    var text = block.textContent;
    if (text.slice(off, off + hit.word.length) !== hit.word) return;
    if (!isBoundary(text, off, off + hit.word.length)) return;
    var id = ++seq;
    var entry = { text: text, word: hit.word, nth: occurrenceIndex(text, hit.word, off), missing: 0, color: curColor };
    var span = document.createElement('span');
    span.className = MARK;
    span.setAttribute('dir', 'auto');
    span.dataset.hlId = String(id);
    tag(span, curColor);
    try { hit.range.surroundContents(span); } catch (e) { return; }
    store.set(id, entry);
    lastId = id;
    refreshMenu();
    openMenu();
  }

  /* ---------- keep highlights alive across re-renders ---------- */
  var busy = false;
  function restore() {
    if (!memberView()) { hideMenu(); return; }
    if (busy) return;
    mountMenu();
    if (!store.size) return;
    busy = true;
    try {
      var blocks = document.querySelectorAll(BLOCK_ALL);
      var ids = Array.from(store.keys());
      for (var k = 0; k < ids.length; k++) {
        var id = ids[k], entry = store.get(id);
        if (!entry) continue;
        if (document.querySelector('.' + MARK + '[data-hl-id="' + id + '"]')) { entry.missing = 0; continue; }
        var done = false;
        for (var i = 0; i < blocks.length; i++) {
          var b = matchTarget(blocks[i], entry.text);
          if (!b) continue;
          if (paint(id, entry, b)) { b.setAttribute('data-amk-hl-block', '1'); entry.missing = 0; done = true; break; }
        }
        if (!done) entry.missing++;
      }
    } finally { busy = false; }
  }

  /* the answer text of an option button sits in its own span (the A/B/C badge is outside),
     so after a re-render look for that exact text inside the button as well. */
  function matchTarget(block, text) {
    if (block.textContent === text) return block;
    if (block.tagName === 'BUTTON') {
      var spans = block.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) if (spans[i].textContent === text) return spans[i];
    }
    return null;
  }

  var raf = 0, tmo = 0;
  function schedule() {
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; restore(); });
    if (!tmo) tmo = setTimeout(function () { tmo = 0; restore(); }, 60);
  }
  function capStore() { if (store.size <= 400) return; var ks = Array.from(store.keys()); for (var i = 0; i < ks.length - 400; i++) store.delete(ks[i]); }
  function hookRender() {
    if (typeof window.render !== 'function' || window.render.__wordHl) return false;
    var base = window.render;
    var wrapped = function () { var out = base.apply(this, arguments); try { capStore(); restore(); } catch (e) { /* ignore */ } return out; };
    for (var k in base) { try { wrapped[k] = base[k]; } catch (e) { /* ignore */ } }
    wrapped.__wordHl = true; window.render = wrapped; return true;
  }
  if (!hookRender()) { document.addEventListener('DOMContentLoaded', hookRender); window.addEventListener('load', hookRender); }

  /* ---------- the icon rail beside the app sidebar ---------- */
  var menuEl = null, menuClosed = false;

  function words() {
    var seen = {}, out = [];
    store.forEach(function (e) {
      var k = String(e.word || '').toLowerCase();
      if (!k || seen[k]) return;
      seen[k] = 1;
      out.push({ word: e.word, context: String(e.text || '').slice(0, 300) });
    });
    return out;
  }

  function buildMenu() {
    var el = document.createElement('div');
    el.id = 'amkHlMenu';
    el.className = 'amk-hl-menu';
    el.setAttribute('role', 'toolbar');
    el.setAttribute('dir', 'rtl');
    el.setAttribute('aria-label', L('هایلایت‌ها', 'Markierungen', 'Highlights'));
    el.innerHTML =
      '<button type="button" class="amk-hl-x" data-act="close" data-tip="' + L('بستن', 'Schließen', 'Close') + '" aria-label="' + L('بستن', 'Schließen', 'Close') + '">×</button>' +
      '<button type="button" class="amk-hl-act" data-act="deck" data-tip="' + L('افزودن به دفتر عبارات', 'Ins Heft übernehmen', 'Add to notebook') + '" aria-label="' + L('افزودن به دفتر عبارات', 'Ins Heft übernehmen', 'Add to notebook') + '"><i aria-hidden="true">📒</i></button>' +
      '<button type="button" class="amk-hl-act is-danger" data-act="clear" data-tip="' + L('پاک کردن همه هایلایت‌ها', 'Alle Markierungen löschen', 'Clear all highlights') + '" aria-label="' + L('پاک کردن همه هایلایت‌ها', 'Alle Markierungen löschen', 'Clear all highlights') + '"><i aria-hidden="true">🧹</i></button>' +
      '<button type="button" class="amk-hl-act" data-act="fav" data-tip="' + L('افزودن به علاقه‌مندی‌ها', 'Zu Favoriten hinzufügen', 'Add to favourites') + '" aria-label="' + L('افزودن به علاقه‌مندی‌ها', 'Zu Favoriten hinzufügen', 'Add to favourites') + '"><i aria-hidden="true">⭐</i></button>' +
      /* HL-COPY (2026-11-24): copy every highlighted word/sentence, phone + desktop */
      '<button type="button" class="amk-hl-act" data-act="copy" data-tip="' + L('کپی هایلایت‌شده‌ها', 'Markiertes kopieren', 'Copy highlighted') + '" aria-label="' + L('کپی هایلایت‌شده‌ها', 'Markiertes kopieren', 'Copy highlighted') + '"><i aria-hidden="true">📋</i></button>' +
      '<button type="button" class="amk-hl-act" data-act="color" aria-haspopup="true" aria-expanded="false" data-tip="' + L('تغییر رنگ هایلایت', 'Markierungsfarbe ändern', 'Change highlight colour') + '" aria-label="' + L('تغییر رنگ هایلایت', 'Markierungsfarbe ändern', 'Change highlight colour') + '"><i aria-hidden="true">🎨</i></button>' +
      '<div class="amk-hl-colors" id="amkHlColors" role="group" aria-label="' + L('رنگ هایلایت', 'Markierungsfarbe', 'Highlight colour') + '">' + COLORS.map(function (c) {
        return '<button type="button" class="amk-hl-sw" data-color="' + c[0] + '" style="--sw:rgb(' + c[4] + ')" data-tip="' + L(c[1], c[2], c[3]) + '" aria-label="' + L(c[1], c[2], c[3]) + '"></button>';
      }).join('') + '</div>';
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-act],[data-color]');
      if (!b) return;
      ev.preventDefault(); ev.stopPropagation();
      if (b.dataset.color) pickColor(b.dataset.color);
      else if (b.dataset.act === 'color') toggleColors();
      else if (b.dataset.act === 'deck') openAdd('deck');
      else if (b.dataset.act === 'fav') openAdd('fav');
      else if (b.dataset.act === 'copy') copyHighlighted();
      else if (b.dataset.act === 'clear') clearAll();
      else if (b.dataset.act === 'close') { closeColors(); menuClosed = true; hideMenu(); }
    });
    return el;
  }

  /* HL-RAIL: sit to the LEFT of the app's fixed sidebar (also in its compact width), fall back to the edge */
  function placeMenu() {
    if (!menuEl) return;
    if (addPanel) placeAdd();
    var right = 12, sb = document.querySelector('.mac-sidebar');
    if (sb) {
      var r = sb.getBoundingClientRect();
      if (getComputedStyle(sb).display !== 'none' && r.width > 0) right = Math.round(window.innerWidth - r.left) + 10;
    }
    menuEl.style.setProperty('--amk-hl-right', Math.max(8, right) + 'px');
  }
  window.addEventListener('resize', placeMenu);

  function mountMenu() {
    if (menuEl && menuEl.isConnected) return;
    var old = document.getElementById('amkHlMenu');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    menuEl = buildMenu();
    document.body.appendChild(menuEl);
    placeMenu();
    refreshMenu();
  }

  function hideMenu() { closeAdd(); if (menuEl) { menuEl.classList.remove('is-on'); menuEl.style.display = 'none'; } }
  function openMenu() {
    if (!memberView()) return;
    if (!store.size) return;
    menuClosed = false;
    if (!menuEl || !menuEl.isConnected) mountMenu();
    menuEl.style.display = '';
    menuEl.classList.add('is-on');
    placeMenu();
    refreshMenu();
  }

  function toggleColors() {
    if (!menuEl) return;
    var p = menuEl.querySelector('#amkHlColors');
    if (!p) return;
    var on = p.classList.toggle('is-open');
    var btn = menuEl.querySelector('[data-act="color"]');
    if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function closeColors() {
    if (!menuEl) return;
    var p = menuEl.querySelector('#amkHlColors');
    if (p) p.classList.remove('is-open');
    var btn = menuEl.querySelector('[data-act="color"]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  document.addEventListener('click', function (ev) {
    if (!menuEl || !menuEl.classList.contains('is-on')) return;
    if (ev.target && ev.target.closest && ev.target.closest('#amkHlMenu')) return;
    closeColors();
  }, true);

  function refreshMenu() {
    if (!memberView()) { closeColors(); hideMenu(); return; }
    if (!menuEl) return;
    placeMenu();
    var n = store.size;
    menuEl.querySelectorAll('.amk-hl-sw').forEach(function (b) { b.classList.toggle('is-cur', b.dataset.color === curColor); });
    var pal = menuEl.querySelector('[data-act="color"]');
    if (pal) pal.style.setProperty('--sw', colorRgb(curColor));
    menuEl.querySelectorAll('.amk-hl-act').forEach(function (b) {
      var off = b.dataset.act === 'clear' || b.dataset.act === 'deck' || b.dataset.act === 'fav' || b.dataset.act === 'copy' ? !n : false;
      b.disabled = !!off;
    });
    if (!n) { closeColors(); hideMenu(); return; }
    if (!menuClosed) { menuEl.style.display = ''; menuEl.classList.add('is-on'); }
  }

  /* ---------- menu actions ---------- */
  function toastMsg(txt) {
    var t = document.getElementById('amkHlToast');
    if (!t) { t = document.createElement('div'); t.id = 'amkHlToast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = txt; t.className = 'is-on';
    clearTimeout(t._t); t._t = setTimeout(function () { t.className = ''; }, 2600);
  }

  /* ---------- HL-COPY (2026-11-24): the highlighted text goes to the clipboard ----------
     On-page order wins over store order, and the slices of a highlighted sentence are joined again,
     so what lands in the clipboard reads exactly like the page: word, word, sentence …
     navigator.clipboard needs https; on http (offline copy, some phones) the textarea fallback runs
     inside the same click, which is the user gesture both iOS and Android require. */
  function highlightedText() {
    var spans = document.querySelectorAll('.' + MARK), parts = [], byGroup = {};
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i], gid = sp.dataset.hlGroup || '', txt = sp.textContent || '';
      if (gid && byGroup[gid]) { byGroup[gid].text += txt; continue; }
      var part = { text: txt };
      if (gid) byGroup[gid] = part;
      parts.push(part);
    }
    var lines = [];
    parts.forEach(function (p) {
      var t = String(p.text || '').replace(/\s+/g, ' ').trim();
      if (t) lines.push(t);
    });
    /* HL-COPY-SPACE (2026-11-24): each highlight gets a space after it, so single words
       never stick together in the clipboard (word word word / sentence word …). */
    return lines.join(' ');
  }

  function legacyCopy(txt) {
    try {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { ta.setSelectionRange(0, txt.length); } catch (e) { /* iOS quirk */ }
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) { return false; }
  }

  function copyHighlighted() {
    var txt = highlightedText();
    if (!txt) { toastMsg(L('چیزی هایلایت نشده است', 'Nichts markiert', 'Nothing highlighted')); return; }
    var badMsg = L('کپی نشد؛ متن را دستی انتخاب کن', 'Kopieren nicht möglich – bitte manuell auswählen', 'Copy failed – please select manually');
    var done = function () { afterCopyReset(); };
    var fail = function () { legacyCopy(txt) ? done() : toastMsg(badMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(done, fail);
    } else fail();
  }

  /* HL-COPY-RESET (2026-11-24): after a successful copy the page goes back to its normal look —
     the text selection is dropped, every highlight is removed, the rail closes and no toast shows,
     so the copy leaves no trace. Only the copy action behaves this way; the other icons keep the highlights. */
  function afterCopyReset() {
    var sel = window.getSelection ? window.getSelection() : null;
    if (sel) { try { sel.removeAllRanges(); } catch (e) { /* ignore */ } }
    var spans = document.querySelectorAll('.' + MARK);
    for (var i = 0; i < spans.length; i++) unwrap(spans[i]);
    store.clear();
    menuClosed = true;
    refreshMenu();
    hideMenu();
  }

  /* ---------- HL-MEANING: هیچ واژه‌ای بدون معنی در دفتر/علاقه‌مندی‌ها ذخیره نمی‌شود ----------
     با کلیک روی 📒 یا ⭐ یک پنل کوچک باز می‌شود؛ معنی هر واژه خودکار پر می‌شود (اگر حساب ویژه باشد)
     و قابل ویرایش است. تا وقتی همهٔ معنی‌ها پر نشوند دکمهٔ افزودن فعال نمی‌شود. */
  var addPanel = null, addRows = [], addKind = 'deck';
  var meaningCache = {};

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function token() { try { return (typeof authTokens === 'function' ? authTokens() : null)?.access_token || ''; } catch (e) { return ''; } }
  function premiumOn() { try { return typeof hasPremiumAccess === 'function' && hasPremiumAccess(); } catch (e) { return false; } }

  function fetchMeaning(word) {
    var key = String(word || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(meaningCache, key)) return Promise.resolve(meaningCache[key]);
    var tok = premiumOn() ? token() : '';
    if (!tok) { meaningCache[key] = null; return Promise.resolve(null); }
    var ctl = new AbortController(), tm = setTimeout(function () { ctl.abort(); }, 20000);
    return fetch('/coach/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: JSON.stringify({ text: word }),
      signal: ctl.signal
    }).then(function (r) {
      clearTimeout(tm);
      return r.ok ? r.json() : null;
    }).then(function (d) {
      if (!d) return null;
      var fa = String(d.translation || '').trim();
      if (!fa || !/[\u0600-\u06FF]/.test(fa)) return null;
      var hw = String(d.headword_de || ''), info = String(d.word_info || '');
      var art = (hw.match(/^(der|die|das)\s/i) || info.match(/^(der|die|das)\s/i) || [])[1];
      var pl = info.match(/Pl(?:ural)?\.?:?\s*(?:die\s+)?([^\s,·;–]+)/i);
      var out = { fa: fa, artikel: art ? art.toLowerCase() : '', plural: pl ? pl[1] : '' };
      meaningCache[key] = out;
      return out;
    }).catch(function () { meaningCache[key] = null; return null; });
  }

  function buildAdd(list) {
    var el = document.createElement('section');
    el.id = 'amkHlAdd';
    el.className = 'amk-hl-add';
    el.setAttribute('dir', 'rtl');
    el.setAttribute('role', 'dialog');
    el.innerHTML =
      '<header class="amk-hl-add-h"><b>' + (addKind === 'fav' ? L('افزودن به علاقه‌مندی‌ها', 'Zu Favoriten', 'Add to favourites') : L('افزودن به دفتر عبارات', 'Ins Heft übernehmen', 'Add to notebook')) + '</b>' +
      '<button type="button" class="amk-hl-add-x" data-add="close" aria-label="' + L('بستن', 'Schließen', 'Close') + '">×</button></header>' +
      '<p class="amk-hl-add-tip">' + (premiumOn() ? L('معنی هر واژه را ببین یا ویرایش کن؛ بدون معنی ذخیره نمی‌شود.', 'Bedeutung prüfen oder ergänzen – ohne Bedeutung wird nichts gespeichert.', 'Check or edit every meaning – nothing is saved without one.') : L('معنی را می‌توانی وارد کنی یا خالی بگذاری و بعداً در دفتر عبارات کامل کنی.', 'Du kannst die Bedeutung eintragen oder später im Heft ergänzen.', 'Add a meaning now or fill it in later in the notebook.')) + '</p>' +
      '<ul class="amk-hl-add-list">' + list.map(function (w, i) {
        return '<li><span class="amk-hl-add-w" dir="ltr">' + esc(w.word) + '</span>' +
          '<input type="text" dir="auto" data-add-i="' + i + '" aria-label="' + L('معنی', 'Bedeutung', 'Meaning') + '" placeholder="' + L('معنی فارسی…', 'Bedeutung …', 'Meaning …') + '" value="">' +
          '<em class="amk-hl-add-st" data-add-st="' + i + '"></em></li>';
      }).join('') + '</ul>' +
      '<footer class="amk-hl-add-f"><button type="button" class="amk-hl-add-cancel" data-add="cancel">' + L('انصراف', 'Abbrechen', 'Cancel') + '</button>' +
      '<button type="button" class="amk-hl-add-ok" data-add="ok" disabled>' + L('افزودن', 'Hinzufügen', 'Add') + '</button></footer>';
    return el;
  }

  function placeAdd() {
    if (!addPanel || !menuEl || !menuEl.isConnected) return;
    var r = menuEl.getBoundingClientRect();
    var w = Math.min(300, window.innerWidth - 24);
    addPanel.style.width = w + 'px';
    var h = addPanel.offsetHeight || 320;
    var left = r.left - w - 9;
    if (left < 12) left = Math.max(12, (window.innerWidth - w) / 2);
    var top = Math.max(12, Math.min(window.innerHeight - h - 12, r.top + r.height / 2 - h / 2));
    addPanel.style.left = Math.round(left) + 'px';
    addPanel.style.top = Math.round(top) + 'px';
  }

  function syncAddState() {
    if (!addPanel) return;
    var all = true, need = premiumOn();  /*AI-GATE: free accounts skip the AI meaning step*/
    addRows.forEach(function (row, i) {
      var inp = addPanel.querySelector('input[data-add-i="' + i + '"]');
      if (need && (!inp || !inp.value.trim())) all = false;
    });
    var btn = addPanel.querySelector('[data-add="ok"]');
    if (btn) btn.disabled = !all;
    addPanel.querySelectorAll('input[data-add-i]').forEach(function (inp) {
      inp.classList.toggle('is-empty', premiumOn() && !inp.value.trim());
    });
  }

  function closeAdd() {
    if (addPanel && addPanel.parentNode) addPanel.parentNode.removeChild(addPanel);
    addPanel = null;
    addRows = [];
  }

  function openAdd(kind) {
    var list = words();
    if (!list.length) return;
    if (kind === 'deck' && (!window.TDM || typeof TDM.deckAddEntry !== 'function')) {
      toastMsg(L('دفتر عبارات در دسترس نیست.', 'Das Heft ist nicht verfügbar.', 'Notebook unavailable.'));
      return;
    }
    if (kind === 'fav' && (typeof window.normalizeFavorite !== 'function' || !window.S)) {
      toastMsg(L('علاقه‌مندی‌ها در دسترس نیست.', 'Favoriten nicht verfügbar.', 'Favourites unavailable.'));
      return;
    }
    addKind = kind === 'fav' ? 'fav' : 'deck';
    closeAdd();
    addRows = list.map(function (w) { return { word: w.word, context: w.context, artikel: '', plural: '' }; });
    addPanel = buildAdd(list);
    document.body.appendChild(addPanel);
    addPanel.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-add]');
      if (!b) return;
      ev.preventDefault(); ev.stopPropagation();
      if (b.dataset.add === 'ok') commitAdd();
      else closeAdd();
    });
    addPanel.querySelectorAll('input[data-add-i]').forEach(function (inp) {
      inp.addEventListener('input', syncAddState);
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          var ok = addPanel && addPanel.querySelector('[data-add="ok"]');
          if (ok && !ok.disabled) commitAdd();
        } else if (ev.key === 'Escape') { ev.preventDefault(); closeAdd(); }
      });
    });
    placeAdd();
    syncAddState();
    if (!premiumOn()) return;   // بدون حساب ویژه معنایی خودکار پر نمی‌شود؛ کاربر خودش می‌نویسد
    addRows.forEach(function (row, i) {
      var st = addPanel.querySelector('[data-add-st="' + i + '"]');
      if (st) st.className = 'amk-hl-add-st is-loading';
      fetchMeaning(row.word).then(function (m) {
        var inp = addPanel && addPanel.querySelector('input[data-add-i="' + i + '"]');
        var s2 = addPanel && addPanel.querySelector('[data-add-st="' + i + '"]');
        if (s2) s2.className = 'amk-hl-add-st';
        if (!inp) return;
        if (m) {
          row.artikel = m.artikel || '';
          row.plural = m.plural || '';
          if (!inp.value.trim()) inp.value = m.fa;
        }
        syncAddState();
        placeAdd();
      });
    });
  }

  function commitAdd() {
    if (!addPanel) return;
    var rows = [], all = true, need = premiumOn();  /*AI-GATE: free accounts may save without a meaning*/
    addRows.forEach(function (row, i) {
      var inp = addPanel.querySelector('input[data-add-i="' + i + '"]');
      var meaning = inp ? inp.value.trim() : '';
      if (need && !meaning) all = false;
      rows.push({ word: row.word, context: row.context, meaning: meaning, artikel: row.artikel, plural: row.plural });
    });
    if (!all) { syncAddState(); return; }
    if (addKind === 'deck') {
      var ok = 0, dup = 0, fail = 0;
      rows.forEach(function (r) {
        try {
          var res = TDM.deckAddEntry('wort', {
            wort: r.word, artikel: r.artikel || '', plural: r.plural || '',
            wortart: r.artikel ? 'Nomen' : '', bedeutung_fa: r.meaning
          });
          if (res && res.ok) ok++; else if (res && res.dup) dup++; else fail++;
        } catch (e) { fail++; console.warn(e); }
      });
      toastMsg(ok
        ? L(faNum(ok) + ' واژه با معنی به دفتر عبارات اضافه شد' + (dup ? ' · ' + faNum(dup) + ' از قبل بود' : '') + (fail ? ' · ' + faNum(fail) + ' ناموفق' : ''), ok + ' Wörter mit Bedeutung übernommen' + (dup ? ' · ' + dup + ' schon vorhanden' : '') + (fail ? ' · ' + fail + ' fehlgeschlagen' : ''), ok + ' words with meanings added' + (dup ? ' · ' + dup + ' already there' : '') + (fail ? ' · ' + fail + ' failed' : ''))
        : L('همهٔ واژه‌ها از قبل در دفتر بودند', 'Alle Wörter waren schon im Heft', 'All words were already in the notebook'));
    } else {
      try { S.favorites = S.favorites || []; } catch (e) { closeAdd(); return; }
      var have = {}, added = 0, had = 0;
      (S.favorites || []).forEach(function (x) { have[norm(x && x.title)] = 1; });
      rows.forEach(function (r) {
        var k = norm(r.word);
        if (have[k]) { had++; return; }
        var fav = normalizeFavorite({ kind: 'vocabulary', title: r.word, answer: r.meaning, context: r.context, source: 'highlight', topic: '' });
        fav.rating = 1; fav.savedAt = new Date().toISOString();
        S.favorites.unshift(fav);
        have[k] = 1; added++;
      });
      if (added) { try { saveData(); render(); } catch (e) { console.warn(e); } }
      toastMsg(added
        ? L(faNum(added) + ' مورد با معنی در علاقه‌مندی‌ها ذخیره شد' + (had ? ' · ' + faNum(had) + ' از قبل بود' : ''), added + ' Einträge mit Bedeutung gespeichert' + (had ? ' · ' + had + ' schon vorhanden' : ''), added + ' saved with meanings' + (had ? ' · ' + had + ' already there' : ''))
        : L('همهٔ واژه‌ها از قبل در علاقه‌مندی‌ها بودند', 'Alle waren schon in den Favoriten', 'All were already in favourites'));
    }
    closeAdd();
  }

  function norm(t) { return String(t || '').toLowerCase().replace(/[.,;:!?„“”"'‚‘’()«»\[\]\-–—…]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  function clearAll() {
    var spans = document.querySelectorAll('.' + MARK);
    for (var i = 0; i < spans.length; i++) unwrap(spans[i]);
    store.clear();
    menuClosed = false;
    refreshMenu();
    hideMenu();
    toastMsg(L('همه هایلایت‌های صفحه پاک شد', 'Alle Markierungen gelöscht', 'All highlights cleared'));
  }

  function pickColor(name) {
    var found = null;
    for (var i = 0; i < COLORS.length; i++) if (COLORS[i][0] === name) found = COLORS[i];
    if (!found) return;
    // HL-COLOR: the new colour starts at the NEXT highlighted word and stays for the following ones.
    // Words already highlighted (including the last one) keep the colour they had.
    curColor = name;
    closeColors();
    refreshMenu();
    toastMsg(L('رنگ هایلایت به «' + found[1] + '» تغییر کرد؛ از واژهٔ بعدی', 'Farbe: ' + found[2], 'Highlight colour: ' + found[3]));
  }

  /* ---------- HL-SENTENCE (2026-11-21): highlight the selected sentence with a right click ----------
     If text is selected and the right click lands on that selection, the whole selected sentence gets
     highlighted exactly like a single word (same span, same class, same colour - no new visual element).
     A right click on such a highlight removes the whole sentence highlight again. */
  function selectedRange(ev) {
    var sel = window.getSelection ? window.getSelection() : null;
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    var range = sel.getRangeAt(0);
    if (!range || range.collapsed) return null;
    var c = caretAt(ev.clientX, ev.clientY);
    if (!c || !c.node) return null;
    try { if (range.comparePoint(c.node, c.offset) !== 0) return null; } catch (e) { return null; }
    return range;
  }

  /* the highlight span that fully contains the selection, if any */
  function holderOfRange(range) {
    var n = range.startContainer;
    var el = n.nodeType === 3 ? n.parentElement : n;
    if (!el || !el.closest) return null;
    if (el.closest(SKIP)) return null;
    var span = el.closest("." + MARK);
    if (!span) return null;
    return span.contains(range.endContainer) ? span : null;
  }

  function occurrenceExact(text, part, offset) {
    var nth = 0, from = 0, idx;
    while ((idx = text.indexOf(part, from)) !== -1 && idx < offset) { nth++; from = idx + 1; }
    return nth;
  }

  /* turn the selection into [start,end] offsets of every text block it touches */
  function selectedSegments(range) {
    var root = range.commonAncestorContainer;
    if (root.nodeType === 3) root = root.parentNode;
    if (!root || root.nodeType !== 1) return [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, out = [];
    while ((n = walker.nextNode())) {
      if (!range.intersectsNode(n)) continue;
      var a = n === range.startContainer ? range.startOffset : 0;
      var b = n === range.endContainer ? range.endOffset : n.nodeValue.length;
      if (b <= a) continue;
      var block = blockOf(n);
      if (!block || (block.closest && block.closest(SKIP))) continue;
      var s = offsetOf(block, n, a), e = offsetOf(block, n, b);
      if (s < 0 || e <= s) continue;
      var seg = null;
      for (var i = 0; i < out.length; i++) if (out[i].block === block) seg = out[i];
      if (seg) { seg.s = Math.min(seg.s, s); seg.e = Math.max(seg.e, e); }
      else out.push({ block: block, s: s, e: e });
    }
    out.forEach(function (seg) {
      var text = seg.block.textContent;
      while (seg.s < seg.e && /\s/.test(text.charAt(seg.s))) seg.s++;
      while (seg.e > seg.s && /\s/.test(text.charAt(seg.e - 1))) seg.e--;
    });
    return out.filter(function (seg) { return seg.e > seg.s; });
  }

  var groupSeq = 0;

  function paintSentence(seg, gid) {
    var block = seg.block, text = block.textContent, word = text.slice(seg.s, seg.e);
    if (!HAS_WORD.test(word)) return false;
    /* word highlights inside the sentence merge into it, so the sentence stays one clean highlight */
    var spans = block.querySelectorAll("." + MARK);
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i], f = sp.firstChild, l = sp.lastChild;
      if (!f || !l) continue;
      var sa = offsetOf(block, f, 0), sb = offsetOf(block, l, l.nodeValue.length);
      if (sa < 0 || sb <= sa || sb <= seg.s || sa >= seg.e) continue;
      var old = Number(sp.dataset.hlId);
      if (old) store.delete(old);
      unwrap(sp);
    }
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), n, total = 0, slices = [];
    while ((n = walker.nextNode())) {
      var len = n.nodeValue.length, a = Math.max(seg.s, total), b = Math.min(seg.e, total + len);
      if (b > a) slices.push({ node: n, a: a - total, b: b - total });
      total += len;
    }
    var made = 0;
    for (var k = 0; k < slices.length; k++) {
      var sl = slices[k], part = sl.node.nodeValue.slice(sl.a, sl.b);
      if (!part.trim()) continue;
      var range = document.createRange();
      range.setStart(sl.node, sl.a);
      range.setEnd(sl.node, sl.b);
      var id = ++seq, span = document.createElement("span");
      span.className = MARK;
      span.setAttribute("dir", "auto");
      span.dataset.hlId = String(id);
      span.dataset.hlGroup = gid;
      tag(span, curColor);
      try { range.surroundContents(span); } catch (e) { continue; }
      store.set(id, { text: text, word: part, nth: occurrenceExact(text, part, seg.s), missing: 0, color: curColor, exact: true, group: gid });
      made++;
    }
    if (made) lastId = seq;
    return made > 0;
  }

  function addSentence(range) {
    var segs = selectedSegments(range);
    if (!segs.length) return false;
    var gid = "s" + (++groupSeq), made = 0;
    for (var i = 0; i < segs.length; i++) if (paintSentence(segs[i], gid)) made++;
    if (!made) return false;
    refreshMenu();
    openMenu();
    return true;
  }

  /* ---------- right click toggles ---------- */
  var rDown = 0;
  document.addEventListener('mousedown', function (e) { if (e.button === 2) rDown = Date.now(); }, true);
  function onContextMenu(ev) {
    if (!memberView()) return;
    /* TOUCH-SELECT (2026-11-21): while a finger is down - and for a moment after it - the long-press
       gesture belongs to the browser. Cancelling the event here is what stopped mobile text
       selection (and its copy menu) from ever appearing. */
    if (tStart || Date.now() < suppressCtx) return;
    if (ev.sourceCapabilities && ev.sourceCapabilities.firesTouchEvents) return;
    var held = rDown && Date.now() - rDown >= 2000; rDown = 0;
    if (held) return;
    var t = ev.target;
    if (!t || t.nodeType !== 1 || !t.closest) return;
    if (!t.closest(SCOPE)) return;
    if (t.closest(SKIP)) return;
    /* HL-SENTENCE: a selected sentence wins over the single word under the cursor */
    var sel = selectedRange(ev);
    if (sel) {
      ev.preventDefault();
      var inHl = holderOfRange(sel);
      if (inHl) removeHighlight(inHl);
      else if (addSentence(sel)) {
        try { var sel2 = window.getSelection(); if (sel2 && sel2.removeAllRanges) sel2.removeAllRanges(); } catch (e) { /* ignore */ }
      }
      return;
    }
    var hit = wordRangeAt(ev.clientX, ev.clientY);
    if (!hit) return;
    ev.preventDefault();
    var node = hit.range.startContainer;
    var holder = node.parentElement && node.parentElement.closest ? node.parentElement.closest('.' + MARK) : null;
    if (holder) { removeHighlight(holder); return; }
    addHighlight(hit);
  }

  /* ---------- TOUCH (2026-11-21): tap = highlight, long press = native selection ----------
     Mobile has no right click: a quick finger tap on a word highlights it (a tap on a highlight
     removes it again), while holding the finger down leaves the press to the browser so the
     normal text selection / copy menu appears. */
  var TAP_SKIP = SKIP + ',button,[role="button"],label,summary,#amkHlMenu,#amkHlAdd,.amk-hl-menu,.amk-hl-add';
  var tStart = null, tTimer = 0, tLong = false, suppressCtx = 0;

  function touchBlocked(el) {
    if (el && el.nodeType !== 1) el = el.parentElement;
    return !!(el && el.closest && el.closest(TAP_SKIP));
  }
  document.addEventListener('touchstart', function (ev) {
    clearTimeout(tTimer); tStart = null; tLong = false;
    if (!memberView() || !ev.touches || ev.touches.length !== 1) return;
    if (touchBlocked(ev.target)) return;
    var t = ev.touches[0];
    tStart = { x: t.clientX, y: t.clientY, at: Date.now() };
    tTimer = setTimeout(function () { if (!tStart) return; tLong = true; suppressCtx = Date.now() + 8000; }, 480);
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (ev) {
    if (!tStart || !ev.touches || !ev.touches[0]) return;
    var t = ev.touches[0];
    if (Math.abs(t.clientX - tStart.x) > 10 || Math.abs(t.clientY - tStart.y) > 10) { clearTimeout(tTimer); tStart = null; }
  }, { capture: true, passive: true });
  document.addEventListener('touchcancel', function () { clearTimeout(tTimer); tStart = null; tLong = false; }, true);
  document.addEventListener('touchend', function () {
    clearTimeout(tTimer);
    var s0 = tStart; tStart = null;
    if (!s0 || !memberView()) { tLong = false; return; }
    if (tLong) { tLong = false; suppressCtx = Date.now() + 1500; return; }   /* browser keeps the long press */
    if (Date.now() - s0.at > 460) return;
    var sel = window.getSelection ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && String(sel).length) return;
    var hit = wordRangeAt(s0.x, s0.y);
    if (!hit) return;
    var node = hit.range.startContainer;
    var holder = node.parentElement && node.parentElement.closest ? node.parentElement.closest('.' + MARK) : null;
    if (holder) removeHighlight(holder); else addHighlight(hit);
  }, { capture: true, passive: true });

  document.addEventListener('keydown', function (ev) { if (ev.key !== 'Escape') return; if (addPanel) closeAdd(); else closeColors(); }, true);
  document.addEventListener('contextmenu', onContextMenu, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountMenu);
  else mountMenu();

  window.AmkWordHl = { words: words, clear: clearAll, color: pickColor, copy: copyHighlighted, text: highlightedText };
})();
