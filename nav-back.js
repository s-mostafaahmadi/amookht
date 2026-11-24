/* Amookht — phone/browser back button closes open panels instead of leaving the site (2026-11-13, owner request).
   Page changes already get history entries from the site's own syncAppBrowserHistory(). What had none were the panels
   that open on top of a page: the mobile menu, the tutor, the grammar bot and the free-study exercises — pressing back
   there left the site. Each open panel now gets one history entry; back closes the panel (and nothing else).
   Closing a panel with its own ✕ removes that entry again so the history stays clean.
   Our popstate listener runs in the capture phase, i.e. before the site's own one, and stops it for panel entries. */
(function () {
  'use strict';
  var entry = false, ignoreUntil = 0, closingByPop = false;

  function openPanel() {
    try { if (typeof S !== 'undefined' && S.mobileNavOpen) return 'nav'; } catch (e) { /* ignore */ }
    if (document.querySelector('.fg-root')) return 'free';
    if (document.querySelector('.gd-overlay')) return 'drill';
    if (document.querySelector('.tutor-panel')) return 'tutor';
    return '';
  }
  function closePanel(kind) {
    try {
      if (kind === 'nav') { S.mobileNavOpen = false; render(); return true; }
      if (kind === 'free' && window.FreeSpace) { FreeSpace.close(); return true; }
      if (kind === 'drill' && window.GrammarDrill) { GrammarDrill.close(); return true; }
      if (kind === 'tutor' && window.Tutor) { Tutor.close(); return true; }
    } catch (e) { console.warn('nav-back', e); }
    return false;
  }
  function silentBack() { ignoreUntil = Date.now() + 700; try { history.back(); } catch (e) { ignoreUntil = 0; } }

  function check() {
    var kind = openPanel();
    if (kind && !entry) {
      entry = true;
      try { history.pushState(Object.assign({}, history.state || {}, { amkPanel: kind }), '', location.href); } catch (e) { entry = false; }
    } else if (!kind && entry) {
      entry = false;
      if (closingByPop) closingByPop = false;
      else if (history.state && history.state.amkPanel) silentBack();   // closed with ✕ / Esc → drop our extra entry
      // (if a menu link already pushed a new page entry on top, the old panel entry simply stays below it)
    }
  }

  window.addEventListener('popstate', function (e) {
    if (ignoreUntil && Date.now() < ignoreUntil) { ignoreUntil = 0; e.stopImmediatePropagation(); return; }
    ignoreUntil = 0;
    var kind = openPanel();
    if (entry && kind) {
      e.stopImmediatePropagation();          // only close the panel; the page underneath stays as it is
      entry = false; closingByPop = true;
      if (!closePanel(kind)) closingByPop = false;
      setTimeout(function () { closingByPop = false; }, 50);
    }
  }, true);

  var obs = new MutationObserver(function () { check(); });
  function start() {
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) { return false; }
    if (typeof window.render === 'function' && !window.render.__nb) {   // the mobile menu is state, not a node: check after renders too
      var base = window.render;
      var wrapped = function () { var r = base.apply(this, arguments); try { check(); } catch (e) { /* ignore */ } return r; };
      wrapped.__nb = true; window.render = wrapped;
    }
    return true;
  }
  window.AmkNavBack = { version: '20261113nb3', _panel: openPanel };
  if (!document.body || !start()) document.addEventListener('DOMContentLoaded', start);
})();
