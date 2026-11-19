/* Amookht — right-click word highlight (WORD-HL, 2026-11-19).
   روی هر واژه در بخش تمرین‌ها کلیک راست کن تا هایلایت شود؛ کلیک راست دوباره روی همان واژه، هایلایت را برمی‌دارد.
   اگر کلیک راست دو ثانیه نگه داشته شود، منوی معمول کلیک راست باز می‌شود و هایلایتی انجام نمی‌شود (RCLICK-HOLD).
   Highlights are kept in a small store and re-painted after any re-render of the app (right after render(), HL-SAFE),
   so scrolling / typing / auto-save no longer wipes them. */
(function () {
  'use strict';
  var MARK = 'amk-word-hl';
  var SKIP = 'input,textarea,select,option,button,a,svg,math,style,script,[contenteditable=""],[contenteditable="true"],[data-no-word-hl],.amk-no-word-hl,.amk-struct';
  var BLOCK_SEL = 'p,li,h1,h2,h3,h4,h5,h6,td,th,figcaption,blockquote,[data-amk-hl-block]';
  var IS_WORD = /[\p{L}\p{N}'\u2019\u2011-]/u;
  var HAS_WORD = /[\p{L}\p{N}]/u;
  var seq = 0;
  var store = new Map();          // id -> { text, word, nth, missing }

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
    if (block) return block;
    el.setAttribute('data-amk-hl-block', '1');
    return el;
  }

  // character offset of (node, offset) inside the block's text
  function offsetOf(block, node, offset) {
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null), n, total = 0;
    while ((n = walker.nextNode())) {
      if (n === node) return total + offset;
      total += n.nodeValue.length;
    }
    return -1;
  }

  // character offset → {node, offset}
  // HL-SAFE: a start offset on a node boundary belongs to the NEXT text node (a word in its own element,
  // e.g. the Hören transcript's span.tdm-w); an end offset stays in the node it ends.
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
  function paint(id, entry, block) {
    var text = block.textContent, re = new RegExp(escapeRe(entry.word), 'g'), m, seen = 0, start = -1;
    while ((m = re.exec(text))) {
      if (!isBoundary(text, m.index, m.index + entry.word.length)) continue;
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
    if (id) store.delete(id);
    unwrap(span);
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
    var entry = { text: text, word: hit.word, nth: occurrenceIndex(text, hit.word, off), missing: 0 };
    var span = document.createElement('span');
    span.className = MARK;
    span.setAttribute('dir', 'auto');
    span.dataset.hlId = String(id);
    try { hit.range.surroundContents(span); } catch (e) { return; }
    store.set(id, entry);
  }

  /* ---------- keep highlights alive across re-renders ---------- */
  var busy = false;
  function restore() {
    if (busy || !store.size) return;
    busy = true;
    try {
      var blocks = document.querySelectorAll('#app ' + BLOCK_SEL);
      var ids = Array.from(store.keys());
      for (var k = 0; k < ids.length; k++) {
        var id = ids[k], entry = store.get(id);
        if (!entry) continue;
        if (document.querySelector('.' + MARK + '[data-hl-id="' + id + '"]')) { entry.missing = 0; continue; }
        var done = false;
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          if (b.textContent !== entry.text) continue;
          if (paint(id, entry, b)) { entry.missing = 0; done = true; break; }
        }
        if (!done) {
          entry.missing++;   // HL-SAFE: kept; it is painted again when its text comes back
        }
      }
    } finally { busy = false; }
  }

  var raf = 0, tmo = 0;
  function schedule() {   // HL-SAFE: next frame, plus a timer fallback (frames pause in hidden tabs)
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; restore(); });
    if (!tmo) tmo = setTimeout(function () { tmo = 0; restore(); }, 60);
  }
  function capStore() { if (store.size <= 300) return; var ks = Array.from(store.keys()); for (var i = 0; i < ks.length - 300; i++) store.delete(ks[i]); }
  // HL-SAFE: repaint synchronously right after every app render, so a highlight never flickers away
  function hookRender() {
    if (typeof window.render !== 'function' || window.render.__wordHl) return false;
    var base = window.render;
    var wrapped = function () { var out = base.apply(this, arguments); try { capStore(); restore(); } catch (e) { /* ignore */ } return out; };
    for (var k in base) { try { wrapped[k] = base[k]; } catch (e) { /* ignore */ } }
    wrapped.__wordHl = true; window.render = wrapped; return true;
  }
  if (!hookRender()) { document.addEventListener('DOMContentLoaded', hookRender); window.addEventListener('load', hookRender); }

  /* ---------- right click toggles ---------- */
  // RCLICK-HOLD: holding the right button for 2 seconds gives the normal browser menu (no highlight).
  // On Windows the menu opens when the button is released, so the hold time is known here.
  var rDown = 0;
  document.addEventListener('mousedown', function (e) { if (e.button === 2) rDown = Date.now(); }, true);
  function onContextMenu(ev) {
    var held = rDown && Date.now() - rDown >= 2000; rDown = 0;
    if (held) return;
    var t = ev.target;
    if (!t || t.nodeType !== 1 || !t.closest) return;
    if (!t.closest('#app')) return;
    if (t.closest(SKIP)) return;
    var hit = wordRangeAt(ev.clientX, ev.clientY);
    if (!hit) return;
    ev.preventDefault();
    var node = hit.range.startContainer;
    var holder = node.parentElement && node.parentElement.closest ? node.parentElement.closest('.' + MARK) : null;
    if (holder) { removeHighlight(holder); return; }
    addHighlight(hit);
  }

  document.addEventListener('contextmenu', onContextMenu, true);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
