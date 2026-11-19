/* Amookht app — BOX-SCROLL (port of the site's amk-reading-scroll.js BOX-SCROLL, 2026-11-20).
   Every scrollable box inside #app (Hören transcript, reading text, lists …) keeps its scroll position when the
   page is rebuilt with the same text. A box is recognised by tag, classes, data-item and its first words, so a
   new text starts at the top as usual. No render hook in the app: a MutationObserver puts positions back. */
(function () {
  'use strict';
  var boxes = {};
  function boxSel(el) {
    var c = String(el.className || '').trim().split(/\s+/).filter(function (x) { return x && !/^is-/.test(x); });
    return el.tagName.toLowerCase() + (c.length ? '.' + c.map(function (x) { return CSS.escape(x); }).join('.') : '');
  }
  function boxKey(el) { return boxSel(el) + '|' + (el.getAttribute('data-item') || '') + '|' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function remember(el) {
    if (!el || el.nodeType !== 1 || !el.closest || !el.closest('#app') || el.scrollHeight <= el.clientHeight + 4) return;
    boxes[boxKey(el)] = { sel: boxSel(el), top: el.scrollTop, at: Date.now() };
  }
  function restore() {
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
  var pending = null;
  document.addEventListener('scroll', function (ev) {
    var t = ev.target; if (!t || t.nodeType !== 1 || t === document.documentElement || t === document.body) return;
    pending = t; setTimeout(function () { if (pending) { remember(pending); pending = null; } }, 80);
  }, true);
  var queued = false;
  function start() {
    var app = document.getElementById('app'); if (!app) return;
    new MutationObserver(function () {
      if (queued) return; queued = true;
      Promise.resolve().then(function () { queued = false; restore(); });
      setTimeout(restore, 120);
    }).observe(app, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.AmkBoxScroll = { remember: remember, restore: restore };
})();
