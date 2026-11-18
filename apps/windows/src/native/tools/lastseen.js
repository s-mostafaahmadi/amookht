// «آخرین بازدید» line in the admin user list.
// Ported from the site's amk-lastseen.js by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
export function install(shim) {
  const { S, saveData, render, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  /* LAST-SEEN (2026-11-14): «آخرین بازدید» line in the admin user list (data: last_seen_at from /v1/admin/users). */
  (function () {
    'use strict';
    function lang() { try { return S.uiLanguage || 'fa'; } catch (e) { return 'fa'; } }
    function rel(ms, l) {
      var m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
      var fa = l === 'fa', en = l === 'en';
      var num = function (n) { try { return n.toLocaleString(fa ? 'fa-IR' : en ? 'en-GB' : 'de-DE'); } catch (e) { return String(n); } };
      if (m < 5) return fa ? 'آنلاین' : en ? 'online' : 'online';
      if (m < 60) return fa ? num(m) + ' دقیقه پیش' : en ? num(m) + ' min ago' : 'vor ' + num(m) + ' Min.';
      if (h < 24) return fa ? num(h) + ' ساعت پیش' : en ? num(h) + ' h ago' : 'vor ' + num(h) + ' Std.';
      if (d === 1) return fa ? 'دیروز' : en ? 'yesterday' : 'gestern';
      if (d < 30) return fa ? num(d) + ' روز پیش' : en ? num(d) + ' days ago' : 'vor ' + num(d) + ' Tagen';
      return null;
    }
    window.amkSeenHtml = function (user) {
      var l = lang(), label = l === 'fa' ? 'آخرین بازدید' : l === 'en' ? 'Last visit' : 'Zuletzt aktiv';
      var iso = user && user.last_seen_at;
      if (!iso) return '<span class="amk-seen none"><i></i>' + label + ': ' + (l === 'fa' ? 'ثبت نشده' : l === 'en' ? 'not yet' : 'noch nie') + '</span>';
      var t = new Date(iso), diff = Date.now() - t.getTime();
      var abs = t.toLocaleString(l === 'fa' ? 'fa-IR' : l === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' });
      var r = rel(Math.max(0, diff), l);
      var cls = diff < 5 * 60000 ? 'on' : diff < 86400000 ? 'day' : diff < 7 * 86400000 ? 'week' : 'old';
      return '<span class="amk-seen ' + cls + '" title="' + abs + '"><i></i>' + label + ': ' + (r || abs) + '</span>';
    };
    var css = document.createElement('style');
    css.textContent = '.amk-seen{display:flex;align-items:center;gap:5px;margin-top:4px;font-size:11.5px;font-weight:700;color:#64748b;white-space:nowrap}' +
      '.amk-seen i{width:8px;height:8px;border-radius:50%;background:#94a3b8;flex:0 0 8px}.amk-seen.on{color:#059669}.amk-seen.on i{background:#10b981;box-shadow:0 0 0 3px #10b98133}' +
      '.amk-seen.day i{background:var(--aca-500,#7c5cff)}.amk-seen.week i{background:#f59e0b}.amk-seen.old{opacity:.75}.amk-seen.none{opacity:.6}';
    document.head.appendChild(css);
  })();

}
