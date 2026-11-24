/* Amookht — keep the reading position in split reading tasks (READ-SCROLL, 2026-11-19, owner request).
   In the Lesen step the text sits in a scrollable card; the app re-renders the whole exercise on many
   events (auto-save, timers, answering) which rebuilt that card and dropped the reader back to its
   first line. This keeps the page scroll and the card scroll, and puts them back after a re-render of
   the very same text (a new text/step starts at the top as usual). */
(function () {
  'use strict';
  var saved = { key: '', y: 0, card: 0 };

  function st() { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } }
  function card() { return document.querySelector('.tdm-split-text .tdm-card'); }
  function key() {
    var c = card();
    if (!c) return '';
    var s = st(), a = s && s.activeActivity;
    return [(s && s.screen) || '', (a && (a.id || a.title)) || '', (c.textContent || '').slice(0, 160)].join('|');
  }
  function pageY() { return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0; }
  function remember() {
    var k = key();
    if (!k) { saved.key = ''; return; }
    var c = card();
    saved.key = k;
    saved.y = pageY();
    saved.card = c ? c.scrollTop : 0;
  }
  function restore() {
    try { restoreBoxes(); } catch (e) { /* BOX-SCROLL */ }
    var c = card();
    if (!c || !saved.key) return;
    if (key() !== saved.key) return;                 // a different text / step: leave it at the top
    if (saved.card > 2 && c.scrollTop < 2) c.scrollTop = saved.card;
    if (saved.y > 40 && pageY() < 4) {
      try { window.scrollTo({ top: saved.y, left: 0, behavior: 'instant' }); }
      catch (e) { window.scrollTo(0, saved.y); }
    }
  }

  /* BOX-SCROLL (2026-11-20): every scrollable box inside the app (Hören transcript, lists, …) keeps its
     position across re-renders of the same text. A box is recognised by tag, classes, data-item and its first words. */
  var boxes = {};
  function boxSel(el) { var c = String(el.className || '').trim().split(/\s+/).filter(function (x) { return x && !/^is-/.test(x); }); return el.tagName.toLowerCase() + (c.length ? '.' + c.map(function (x) { return CSS.escape(x); }).join('.') : ''); }
  function boxKey(el) { return boxSel(el) + '|' + (el.getAttribute('data-item') || '') + '|' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function rememberBox(el) {
    if (!el || el.nodeType !== 1 || !el.closest || !el.closest('#app') || el.scrollHeight <= el.clientHeight + 4) return;
    boxes[boxKey(el)] = { sel: boxSel(el), top: el.scrollTop, at: Date.now() };
  }
  function restoreBoxes() {
    var ks = Object.keys(boxes); if (!ks.length) return;
    var now = Date.now();
    ks.forEach(function (k) {
      var b = boxes[k];
      if (now - b.at > 30 * 60 * 1000) { delete boxes[k]; return; }
      if (b.top < 3) return;
      var list; try { list = document.querySelectorAll('#app ' + b.sel); } catch (e) { return; }
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.scrollTop > 2 || boxKey(el) !== k) continue;
        var sb = el.style.scrollBehavior; el.style.scrollBehavior = 'auto'; el.scrollTop = b.top; el.style.scrollBehavior = sb;
      }
    });
  }

  var scrollRaf = 0, lastBox = null;
  document.addEventListener('scroll', function (ev) {
    var t = ev.target; if (t && t.nodeType === 1 && t !== document.documentElement && t !== document.body) lastBox = t;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () { scrollRaf = 0; remember(); if (lastBox) { rememberBox(lastBox); lastBox = null; } });
  }, true);

  function hook() {
    if (typeof window.render !== 'function' || window.render.__readScroll) return false;
    var base = window.render;
    var wrapped = function () {
      remember();
      try { document.querySelectorAll('#app .tdm-transcript,#app [data-keep-scroll]').forEach(rememberBox); } catch (e) { /* ignore */ }
      var out = base.apply(this, arguments);
      restore();
      requestAnimationFrame(restore);
      setTimeout(restore, 200);
      return out;
    };
    wrapped.__readScroll = true;
    window.render = wrapped;
    return true;
  }
  if (!hook()) { document.addEventListener('DOMContentLoaded', hook); window.addEventListener('load', hook); }

  var raf = 0;
  new MutationObserver(function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; restore(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.AmkReadScroll = { remember: remember, restore: restore };
})();
