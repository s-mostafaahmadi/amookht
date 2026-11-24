/* Amookht — every new page / exercise starts at the top (2026-11-13, owner request).
   Many entry points (startActivity, TDM.start, mode tabs, tiles, history buttons…) only call render() and kept the old
   scroll position, so new screens opened in the middle. This wraps render(): when the *view* changes
   (screen, open activity, plan/free tab, review mode) the page is scrolled to the top. Re-renders inside the same view
   (typing, answering, timers) never scroll. */
(function () {
  'use strict';
  var last = null;
  function key() {
    try {
      var a = S.activeActivity;
      return [S.screen || '', a && (a.id || a.title) || '', S.studyMode === 'free' ? 'free' : 'plan', S.tdmReview ? 'r' : '', S.screen === 'testdafSim' && S.testdafExamLibraryView ? 'lib' : ''].join('|');
    } catch (e) { return null; }
  }
  function toTop() {
    var go = function () {
      try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      var se = document.scrollingElement || document.documentElement;
      if (se) se.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      var app = document.getElementById('app');
      if (app) app.querySelectorAll('*').forEach(function (el) {
        if (el.scrollTop > 0 && el.clientHeight > window.innerHeight * 0.45 && !el.closest('nav,aside,.mobile-nav-sheet,.tutor-panel,.gd-root,.tdm-split-text,[class*="owner-ai"]')) el.scrollTop = 0;
      });
    };
    go(); requestAnimationFrame(function () { requestAnimationFrame(go); }); setTimeout(go, 120);
  }
  function hook() {
    if (typeof window.render !== 'function' || window.render.__st) return false;
    var base = window.render;
    var wrapped = function () {
      var r = base.apply(this, arguments), k = key();
      if (k !== null && last !== null && k !== last) toTop();
      if (k !== null) last = k;
      return r;
    };
    wrapped.__st = true;
    window.render = wrapped;
    last = key();
    return true;
  }
  window.AmkScrollTop = { version: '20261119s2', _key: key };
  if (!hook()) { document.addEventListener('DOMContentLoaded', hook); window.addEventListener('load', hook); }
})();
