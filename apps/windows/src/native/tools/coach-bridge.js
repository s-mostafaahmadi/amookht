// Coach → app bridge: what the learner saves in the conversation coach goes into «دفتر عبارات» and «علاقه‌مندی‌ها».
// Ported from the site's coach-bridge.js by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
export function install(shim) {
  const { S, saveData, render, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  /* Amookht — bridge between «مربی گفتگو» (/coach/) and the site (2026-11-13, owner request: one notebook for everything).
     The coach (same origin) appends what the learner saves to localStorage 'amookht_inbox_v1' as {u:userId, kind, data}.
     Here those items move into the learner's own «دفتر عبارات» (S.errors) and «علاقه‌مندی‌ها» (S.favorites); saveData() then
     syncs them to the server like everything else. Also opens a site screen requested by the coach ('amookht_open_screen'). */
  (function () {
    'use strict';
    var KEY = 'amookht_inbox_v1', OPEN = 'amookht_open_screen';
    var TYPE = { grammar: 'grammar', vocabulary: 'vocabulary', sentence_structure: 'grammar', naturalness: 'speaking' };
    var LABEL = { grammar: 'گرامر', vocabulary: 'واژه', sentence_structure: 'ساختار جمله', naturalness: 'طبیعی‌بودن' };
    var busy = false;

    function ready() { try { return typeof S !== 'undefined' && !!S.currentUser && !!S.accountId && typeof saveData === 'function'; } catch (e) { return false; } }
    function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }

    function addMistake(d, id) {
      if (typeof rememberLearningError !== 'function' || !d || !d.original) return false;
      var better = String(d.natural || d.corrected || '').trim();
      if (!better) return false;
      var key = 'coach:' + (d.key || id);
      if ((S.errors || []).some(function (e) { return e && e.sourceKey === key; })) return false;   // already in the notebook: never add twice
      rememberLearningError({
        type: TYPE[d.type] || 'speaking', category: 'Deutsch Coach · ' + (LABEL[d.type] || d.type || ''),
        question: 'مربی گفتگو', userAnswer: String(d.original).slice(0, 800), correctAnswer: better.slice(0, 800),
        explanation: String(d.note || '').slice(0, 800), context: '',
        source: 'coach', sourceKey: key, severity: d.priority === 'high' ? 3 : d.priority === 'low' ? 1 : 2
      });
      return true;
    }
    function addFavorite(d) {
      if (typeof normalizeFavorite !== 'function' || !d || !d.text) return false;
      var stars = Math.max(1, Math.min(3, Number(d.stars) || 1));
      var fav = normalizeFavorite({ kind: /[a-zäöüß]/i.test(d.text) && String(d.text).split(/\s+/).length <= 3 ? 'vocabulary' : 'speaking', title: String(d.text).slice(0, 900),
        answer: String(d.meta || '').slice(0, 1800), topic: 'مربی گفتگو' + (d.coach ? ' · ' + d.coach : ''), subtitle: d.title || '', sourceId: 'coach:' + (d.id || ''), rating: stars });
      S.favorites = S.favorites || [];
      var i = S.favorites.findIndex(function (x) { return x.id === fav.id || (x.sourceId && x.sourceId === fav.sourceId); });
      if (i >= 0) S.favorites[i] = Object.assign({}, S.favorites[i], { rating: stars });
      else S.favorites.unshift(Object.assign({}, fav, { rating: stars, savedAt: new Date().toISOString() }));
      return true;
    }

    function drain() {
      if (busy || !ready()) return;
      var list = read(); if (!list.length) return openRequested();
      busy = true;
      try {
        var me = String(S.accountId), mine = [], rest = [];
        list.forEach(function (x) { (x && String(x.u) === me ? mine : rest).push(x); });
        if (mine.length) {
          var changed = 0;
          mine.forEach(function (x) {
            try { if (x.kind === 'mistake' ? addMistake(x.data, x.id || x.ts) : x.kind === 'favorite' ? addFavorite(x.data) : false) changed++; } catch (e) { console.warn('coach-bridge', e); }
          });
          // write back only foreign items (other accounts on this browser), dropping very old ones
          var cutoff = Date.now() - 30 * 864e5;
          localStorage.setItem(KEY, JSON.stringify(rest.filter(function (x) { return x && x.ts > cutoff; })));
          if (changed) { saveData(); if (['errorbook', 'favorites'].indexOf(S.screen) >= 0 && typeof render === 'function') setTimeout(render, 0); }
        }
      } catch (e) { console.warn('coach-bridge', e); }
      busy = false;
      openRequested();
    }
    function openRequested() {
      try {
        var want = localStorage.getItem(OPEN); if (!want || !ready()) return;
        localStorage.removeItem(OPEN);
        if (['errorbook', 'favorites'].indexOf(want) >= 0 && typeof navigateApp === 'function' && S.screen !== want) setTimeout(function () { navigateApp(want); }, 0);
      } catch (e) { /* ignore */ }
    }
    // the coach page follows the site's light/dark setting
    var lastTheme = null;
    function syncTheme() {
      try {
        var cs = getComputedStyle(document.documentElement), a1 = cs.getPropertyValue('--app-accent').trim(), a2 = cs.getPropertyValue('--app-accent-2').trim();
        var t = (S.dark ? 'dark' : 'light') + '|' + a1 + '|' + a2;
        if (t !== lastTheme) { lastTheme = t; localStorage.setItem('amookht_theme', S.dark ? 'dark' : 'light'); if (a1) localStorage.setItem('amookht_accent', JSON.stringify([a1, a2 || a1])); }
      } catch (e) { /* ignore */ }
    }
    function hook() {
      if (typeof window.render !== 'function' || window.render.__cb) return false;
      var base = window.render;
      var wrapped = function () { var r = base.apply(this, arguments); setTimeout(drain, 0); syncTheme(); return r; };
      wrapped.__cb = true; window.render = wrapped; return true;
    }
    window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === OPEN) drain(); });
    window.addEventListener('focus', drain);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) drain(); });
    window.AmkCoachBridge = { drain: drain, version: '20261113cb3' };
    if (!hook()) { document.addEventListener('DOMContentLoaded', hook); window.addEventListener('load', hook); }
    setTimeout(drain, 1500);
  })();

}
