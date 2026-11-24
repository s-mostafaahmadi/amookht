/* Amookht — menu «اجرای برنامه» resumes the open exercise (NAV-RESUME, 2026-11-15, owner request).
   - Leaving an exercise for another page (favourites, notebook, …) remembers the exercise and the scroll position.
   - Clicking «اجرای برنامه» in the menu later reopens that exercise (same step — progress lives in the plan state)
     and scrolls back to the same place.
   - Clicking «اجرای برنامه» while already inside the exercise leaves it and shows the dashboard.
   Only menu clicks (flag window.__amkMenuNav set by the sidebar / mobile menu buttons) resume; other buttons behave as before. */
(function () {
  'use strict';
  var R = null;
  function st() { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } }
  function inExercise() { var s = st(); return !!(s && s.activeActivity && s.screen !== 'dashboard'); }
  function restoreScroll(y) {
    if (!(y > 0)) return;
    var go = function () { try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, y); } };
    [260, 450, 800].forEach(function (ms) { setTimeout(go, ms); });   // after navScrollTop / scroll-top.js (≤120 ms + 2 frames)
  }
  function valid(r) {
    var s = st(); if (!r || !s || !s.plan) return false;
    if (r.day && s.plan.date && r.day !== s.plan.date) return false;
    return (s.plan.activities || []).some(function (a) { return a.id === r.id; }) && typeof startActivity === 'function';
  }
  function hook() {
    var nav = window.navigateApp;
    if (typeof nav !== 'function') return false;
    if (nav.__amkNr) return true;
    var wrapped = function (target) {
      var s = st(), fromMenu = window.__amkMenuNav === 1; window.__amkMenuNav = 0;
      if (target === 'dashboard' && fromMenu) {
        if (inExercise()) { R = null; return nav.apply(this, arguments); }          // 2nd click inside the exercise → dashboard
        if (valid(R)) {
          var r = R; R = null;
          nav.call(this, 'dashboard');
          if (s.screen === 'dashboard') {
            startActivity(r.id);
            if (r.review && s.screen === 'methodActivity') { s.tdmReview = true; render(); }
            restoreScroll(r.y);
          }
          return;
        }
      }
      if (inExercise() && target !== 'dashboard') R = { id: s.activeActivity.id, y: window.scrollY || document.documentElement.scrollTop || 0, day: s.plan && s.plan.date, review: !!s.tdmReview };
      else if (target === 'dashboard') R = null;
      return nav.apply(this, arguments);
    };
    for (var k in nav) { try { wrapped[k] = nav[k]; } catch (e) { /* ignore */ } }
    wrapped.__amkNr = true;
    window.navigateApp = wrapped;
    return true;
  }
  if (!hook()) { var n = 0, t = setInterval(function () { if (hook() || ++n > 50) clearInterval(t); }, 200); }
  window.AmkNavResume = { state: function () { return R; } };
})();
