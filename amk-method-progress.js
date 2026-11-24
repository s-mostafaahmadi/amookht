/* AMK-METHODPROGRESS v4 (2026-11-19) «کنترل محتوا»: admin page tree — week tiles → day cards → 4 skills.
   ▶ replaces today's exercises with that day's pack (TDM.playPack, own plan only); drag a day card onto another
   day (or onto a week tile) to reorder this account's pack sequence (TDM.setPackOrder). Tree is closed by default. */
(function () {
  'use strict';
  var st = { data: null, loading: false, error: '', open: {}, dopen: {}, drag: 0, wdrag: 0, pos: {}, size: {}, z: {}, zTop: 10, ctx: null, fresh: {} };
  var SK = [['hoeren', '🎧', 'Hören'], ['lesen', '📖', 'Lesen'], ['schreiben', '✍️', 'Schreiben'], ['sprechen', '🎤', 'Sprechen']];
  var WD_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fa(n) { return String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
  function rerender() { try { if (typeof render === 'function') render(); } catch (e) { /* ignore */ } }
  function todayKey() { try { return (window.S && S.plan && S.plan.date) || (typeof today === 'function' ? today() : ''); } catch (e) { return ''; } }

  function load(force) {
    if (st.loading || (st.data && !force)) return;
    st.loading = true; st.error = '';
    Promise.resolve(apiRequest('/admin/method-progress')).then(function (d) { st.data = d; st.loading = false; rerender(); })
      .catch(function (e) { st.loading = false; st.error = (e && e.message) || 'خطا در دریافت فهرست'; rerender(); });
  }

  function seq() {
    var all = st.data.days.map(function (x) { return x.day; }).sort(function (a, b) { return a - b; });
    var own = (window.TDM && TDM.packOrder && TDM.packOrder()) || [], have = {}, seen = {};
    all.forEach(function (x) { have[x] = 1; });
    own = own.filter(function (x) { return have[x] && !seen[x] && (seen[x] = 1); });
    return own.concat(all.filter(function (x) { return !seen[x]; }));
  }
  function activeDay() {
    try {
      var m = window.TDM && TDM.state && TDM.state(), d = m && m.days && m.days[todayKey()];
      if (d && d.packDay) return Number(d.packDay);
      if (d && d.picks && st.data) {
        var hit = st.data.days.filter(function (x) { return x.items.some(function (i) { return i.id === d.picks.hoeren; }); })[0];
        if (hit) return hit.day;
      }
      if (m && m.packCur) return Number(m.packCur);
    } catch (e) { /* ignore */ }
    return (st.data && st.data.learner && st.data.learner.current_day) || 0;
  }
  function pack(d) {
    var p = { day: d.day, theme: d.theme || '', sprechen: [] };
    d.items.forEach(function (i) {
      if ((i.kind === 'hoeren' || i.kind === 'lesen') && !p[i.kind]) p[i.kind] = i.id;
      else if ((i.kind === 'argumentation' || i.kind === 'grafik') && !p.schreiben) p.schreiben = { kind: i.kind, id: i.id };
      else if (i.kind === 'sprechen') p.sprechen.push(i.id);
    });
    return p;
  }
  function bySkill(d) {
    var by = { hoeren: [], lesen: [], schreiben: [], sprechen: [] };
    d.items.forEach(function (i) { by[i.kind === 'argumentation' || i.kind === 'grafik' ? 'schreiben' : i.kind].push(i); });
    return by;
  }
  // finished skills per pack, from this account's plan days (PACK-DONE); days reset in the panel are ignored
  function doneMap() {
    var out = {}, byH = {};
    try {
      st.data.days.forEach(function (x) { x.items.forEach(function (i) { if (i.kind === 'hoeren') byH[i.id] = x.day; }); });
      var m = TDM.state(), ign = (TDM.packIgnore && TDM.packIgnore()) || {}, planDate = window.S && S.plan && S.plan.date;
      Object.keys(m.days || {}).forEach(function (k) {
        var d = m.days[k]; if (!d || !d.picks) return;
        var pk = Number(d.packDay) || byH[d.picks.hoeren]; if (!pk || (ign[pk] || []).indexOf(k) >= 0) return;
        var got = Object.keys(d.results || {});
        if (k === planDate && window.TDM && TDM.active && TDM.active()) got = got.concat(S.completedActivities || []);
        got.forEach(function (sk) { if (['hoeren', 'lesen', 'schreiben', 'sprechen'].indexOf(sk) >= 0) { (out[pk] = out[pk] || {})[sk] = (out[pk].__dates = out[pk].__dates || {}, out[pk].__dates[k] = 1, true); } });
      });
    } catch (e) { /* ignore */ }
    return out;
  }
  function stClass(s) { return s === 'published' ? 'ok' : s === 'queued' ? 'q' : 'p'; }
  // FRI-FILL: day ids 7, 14, 21 … were Fridays. They are not Fridays any more: ready ones take the first days that
  // are still empty (not ready), the others go to the end. Once this account reorders days, its own order is kept.
  function friId(id) { return ((Number(id) - 1) % 7) === 6; }
  function friFill(list) {
    var byId = {}; (st.data && st.data.days || []).forEach(function (x) { byId[x.day] = x; });
    var ready = function (id) { return !!byId[id] && byId[id].status === 'published'; };
    var fr = list.filter(friId), rest = list.filter(function (x) { return !friId(x); });
    var fReady = fr.filter(ready), fLater = fr.filter(function (x) { return !ready(x); }), out = [], wait = [];
    rest.forEach(function (x) {
      if (!ready(x) && fReady.length) { out.push(fReady.shift()); wait.push(x); return; }   // an empty day: a ready pack takes its place
      if (wait.length && !fReady.length) { out = out.concat(wait); wait = []; }
      out.push(x);
    });
    return out.concat(fReady, wait, fLater);
  }
  function vseq() { var s = seq(); return (window.TDM && TDM.packOrderFri && TDM.packOrderFri()) ? s : friFill(s); }

  function details(d, dn) {
    var by = bySkill(d); dn = dn || {};
    return '<div class="amp4-det">' + SK.map(function (s) {
      var list = by[s[0]];
      return '<div class="amp4-det-row k-' + s[0] + (dn[s[0]] ? ' is-done' : '') + '"><span class="amp4-det-ic">' + s[1] + '</span><div><b>' + s[2] + '</b>' +
        (list.length ? list.map(function (i) {
          var tag = i.kind === 'grafik' ? 'Grafik' : i.kind === 'argumentation' ? 'Argumentation' : (i.type || '');
          return '<p lang="de" dir="ltr" class="' + (i.status !== 'published' ? 'is-wait' : '') + '">' + (i.done ? '<em class="ok">✓</em>' : i.used ? '<em>•</em>' : '') +
            esc(i.title || i.topic) + (tag ? ' <small>' + esc(tag) + '</small>' : '') + (i.status !== 'published' ? ' <small class="w">در حال ساخت</small>' : '') + '</p>';
        }).join('') : '<p class="is-wait">—</p>') + '</div></div>';
    }).join('') + '</div>';
  }

  function dayCard(d, p, act, done) {
    var cur = d.day === act, ready = d.status === 'published', op = !!st.dopen[d.day], by = bySkill(d), dn = done[d.day] || {};
    var chips = SK.map(function (s) {
      var list = by[s[0]], ok = list.length && list.every(function (i) { return i.status === 'published'; });
      return '<span class="amp4-chip k-' + s[0] + (ok ? '' : ' is-off') + (dn[s[0]] ? ' is-done' : '') + '" title="' + s[2] + (dn[s[0]] ? ' · انجام شد' : '') + '">' + s[1] + (s[0] === 'sprechen' && list.length > 1 ? '<i>' + fa(list.length) + '</i>' : '') + '</span>';
    }).join('');
    return '<article class="amp4-day st-' + stClass(d.status) + (cur ? ' is-cur' : '') + (op ? ' is-open' : '') + '" draggable="true" data-day="' + d.day + '"' +
      ' ondragstart="AmkMethodProgress.dragStart(event,' + d.day + ')" ondragend="AmkMethodProgress.dragEnd(event)"' +
      ' ondragover="AmkMethodProgress.dragOver(event,&quot;d&quot;)" ondragleave="AmkMethodProgress.dragLeave(event)" ondrop="AmkMethodProgress.drop(event,' + d.day + ',0)">' +
      '<div class="amp4-day-top"><span class="amp4-grip" aria-hidden="true">⠿</span><div class="amp4-day-n"><b>روز ' + fa(d.day) + '</b><small>' + WD_FA[((Number(p) || 1) - 1) % 6] + '</small></div>' +
      (cur ? '<span class="amp4-now">امروز در برنامه</span>' : '') +
      (Object.keys(dn).some(function (x) { return x !== '__dates'; }) ? '<button type="button" class="amp4-reset" title="پاک کردن علامت‌های انجام‌شده این روز" aria-label="پاک کردن علامت‌ها" onclick="event.stopPropagation();AmkMethodProgress.reset(' + d.day + ')">↺</button>' : '') +
      '<button type="button" class="amp4-play" ' + (ready ? '' : 'disabled ') + 'title="' + (ready ? 'اجرای این روز به‌جای تمرین‌های امروز' : 'هنوز آماده نیست') + '" aria-label="اجرای روز ' + fa(d.day) + '" onclick="event.stopPropagation();AmkMethodProgress.play(' + d.day + ')">▶</button></div>' +
      '<button type="button" class="amp4-day-body" aria-expanded="' + op + '" onclick="AmkMethodProgress.dtoggle(' + d.day + ')">' +
      '<span class="amp4-theme" lang="de" dir="ltr">' + esc(d.theme || '—') + '</span><span class="amp4-chips">' + chips + '<em class="amp4-more">' + (op ? 'بستن' : 'جزئیات') + '</em></span></button>' +
      (op ? details(d, dn) : '') + '</article>';
  }

  function panel() {
    var d = st.data;
    var hdr = function (meta, bar) {
      return '<header class="amp4-hero"><div class="amp4-hero-tx"><h2>🗂️ کنترل محتوا</h2><p>روی هر هفته بزنید تا پنجره‌اش باز شود · روز را روی روز دیگر بکشید تا جایشان عوض شود · هفته را روی هفته دیگر بکشید تا جایشان عوض شود</p></div>' +
        '<div class="amp4-hero-side">' + meta + '<button type="button" class="amp4-rf" onclick="AmkMethodProgress.reload()" title="بازخوانی" aria-label="بازخوانی">↻</button></div>' + (bar || '') + '</header>';
    };
    if (!d) return '<section class="amp4" data-l10n-ui>' + hdr('<span class="amp4-pill">' + (st.error ? esc(st.error) : 'در حال بارگذاری…') + '</span>') + '</section>';
    var byId = {}; d.days.forEach(function (x) { byId[x.day] = x; });
    var order = vseq().filter(function (id) { return byId[id]; }), posOf = {}; order.forEach(function (id, i) { posOf[id] = i + 1; });
    var done = doneMap(), act = activeDay();
    var actPos = posOf[act] || 0, actWeek = actPos ? Math.ceil(actPos / 6) : 0, weeks = [];
    order.forEach(function (id, i) { var w = Math.floor(i / 6); (weeks[w] = weeks[w] || []).push(byId[id]); });
    st.ctx = { weeks: weeks, posOf: posOf, act: act, actWeek: actWeek, done: done };
    var visTotal = order.length, visPub = order.filter(function (id) { return byId[id].status === 'published'; }).length, pct = visTotal ? Math.round(visPub / visTotal * 100) : 0;
    var meta = '<span class="amp4-pill"><small>روز فعلی</small><b>' + (actPos ? fa(actPos) : '—') + '</b></span><span class="amp4-pill"><small>روز آماده</small><b>' + fa(visPub) + '<i>/' + fa(visTotal) + '</i></b></span>';
    var bar = '<div class="amp4-prog" title="' + fa(pct) + '٪ آماده"><i style="width:' + pct + '%"></i></div>';
    var tiles = weeks.map(function (ds, wi) {
      var w = wi + 1, op = !!st.open[w], cur = w === actWeek, ready = ds.filter(function (x) { return x.status === 'published'; }).length;
      var themed = ds.some(function (x) { return x.themed; });
      var dots = ds.map(function (x) { return '<i class="st-' + stClass(x.status) + (x.day === act ? ' is-cur' : '') + '"></i>'; }).join('');
      var head = '<button type="button" class="amp4-wk-head" aria-expanded="' + op + '" onclick="AmkMethodProgress.toggle(' + w + ')"' +
        ' draggable="true" ondragstart="AmkMethodProgress.wDragStart(event,' + w + ')" ondragend="AmkMethodProgress.dragEnd(event)"' +
        ' ondragover="AmkMethodProgress.dragOver(event,&quot;w&quot;)" ondragleave="AmkMethodProgress.dragLeave(event)" ondrop="AmkMethodProgress.drop(event,0,' + w + ')">' +
        '<span class="amp4-wk-t"><b>هفته ' + fa(w) + '</b>' + (cur ? '<span class="amp4-now">اکنون</span>' : '') + (themed ? '<span class="amp4-tag">موضوعی</span>' : '') + '</span>' +
        '<span class="amp4-dots">' + dots + '</span><span class="amp4-caret" aria-hidden="true">' + (op ? '●' : '⧉') + '</span></button>';
      return '<li class="amp4-wk' + (cur ? ' is-cur' : '') + (op ? ' is-open' : '') + '">' + head + '</li>';
    }).join('');
    return '<section class="amp4" data-l10n-ui>' + hdr(meta, bar) + '<ul class="amp4-weeks">' + tiles + '</ul>' +
      '<footer class="amp4-legend"><span><i class="st-ok"></i>آماده</span><span><i class="st-p"></i>در حال ساخت</span><span><i class="st-q"></i>در صف</span><span><i class="is-cur"></i>روز فعلی</span><span><b class="amp4-lg-done">🎧</b>انجام‌شده در برنامه</span></footer></section>';
  }

  // ── floating week windows (portal in <body>, movable by their header) ──
  /* ADMIN-STATUS: four windows from the admin header (users, system, content, APIs) */
  st.sd = { sys: null, cnt: null, api: null, apiBusy: false };
  var SW = { usr: '👥 وضعیت کاربران', sys: '🖥️ وضعیت سیستم', cnt: '📦 وضعیت محتوا', api: '🔌 وضعیت API‌ها' };
  function gb(n) { n = Number(n) || 0; return n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : Math.round(n / 1048576) + ' MB'; }
  function meter(label, used, total, txt) { var p = total ? Math.min(100, Math.round(used / total * 100)) : 0; return '<div class="amp-sw-meter ' + (p >= 90 ? 'is-hot' : p >= 70 ? 'is-warm' : '') + '"><div><b>' + label + '</b>' + (txt ? '<span dir="ltr">' + txt + '</span>' : '') + '<small>' + fa(p) + '٪</small></div><i><u style="width:' + p + '%"></u></i></div>'; }
  function tloc(iso) { try { return new Date(iso).toLocaleString(window.amkPanelLocale ? window.amkPanelLocale() : 'fa-IR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }); } catch (e) { return iso || ''; } }
  function swLoad(k) {
    if (k === 'api') { if (st.sd.apiBusy) return; st.sd.apiBusy = true; syncFloats(); }
    var req = k === 'sys' ? apiRequest('/admin/status/system') : k === 'cnt' ? apiRequest('/admin/status/content') : k === 'api' ? apiRequest('/admin/status/apis', { method: 'POST', body: '{}' }) : null;
    if (!req) return;
    Promise.resolve(req).then(function (d) { st.sd[k] = d; }).catch(function (e) { st.sd[k] = { error: (e && e.message) || 'خطا' }; }).then(function () { if (k === 'api') st.sd.apiBusy = false; syncFloats(); });
  }
  setInterval(function () { if (st.open.sys && document.querySelector('.amp4')) swLoad('sys'); }, 3000);
  function statusBody(k) {
    if (k === 'usr') {
      var us = (typeof S !== 'undefined' && S.adminUsers) || [], c = { normal: 0, premium: 0, admin: 0, owner: 0 }, blocked = 0, ver = 0, now = Date.now(), d7 = 0, d30 = 0, act = 0;
      us.forEach(function (u) { c[u.access_role || 'normal'] = (c[u.access_role || 'normal'] || 0) + 1; if (u.is_blocked) blocked++; if (u.is_verified) ver++; var cr = Date.parse(u.created_at || ''); if (cr && now - cr < 7 * 864e5) d7++; if (cr && now - cr < 30 * 864e5) d30++; var ls = Date.parse(u.last_seen_at || ''); if (ls && now - ls < 864e5) act++; });
      var row = function (l, n, cls) { return '<div class="amp-sw-row ' + (cls || '') + '"><span>' + l + '</span><b>' + fa(n) + '</b><i><u style="width:' + (us.length ? Math.round(n / us.length * 100) : 0) + '%"></u></i></div>'; };
      return '<div class="amp-sw-kpis"><div><b>' + fa(us.length) + '</b><small>همه کاربران</small></div><div><b>' + fa(act) + '</b><small>فعال ۲۴ ساعت</small></div><div><b>' + fa(d7) + '</b><small>جدید این هفته</small></div></div>' +
        row('رایگان', c.normal) + row('Premium', c.premium, 'k-p') + row('مدیر', c.admin, 'k-a') + row('مالک', c.owner, 'k-o') + row('مسدود', blocked, 'k-b') + row('تأییدشده', ver, 'k-v') +
        '<p class="amp-sw-note">جدید در ۳۰ روز: ' + fa(d30) + '</p>';
    }
    var d = st.sd[k];
    if (k === 'api' && st.sd.apiBusy && !d) return '<p class="amp-sw-note">در حال تست همه کلیدها… (تا ۲۰ ثانیه)</p>';
    if (!d) return '<p class="amp-sw-note">در حال دریافت…</p>';
    if (d.error) return '<p class="amp-sw-note is-err">' + esc(d.error) + '</p>';
    if (k === 'sys') {
      return '<div class="amp-sw-kpis"><div><b>' + fa(d.cpu_percent) + '٪</b><small>CPU (' + fa(d.cpu_count) + ' هسته)</small></div><div><b>' + fa(d.load[0]) + '</b><small>بار ۱ دقیقه</small></div><div><b>' + fa(Math.floor(d.uptime_s / 86400)) + ' روز</b><small>روشن بودن</small></div></div>' +
        meter('پردازنده', d.cpu_percent, 100, fa(d.cpu_percent) + '٪') + meter('حافظه (RAM)', d.ram.used, d.ram.total, gb(d.ram.used) + ' / ' + gb(d.ram.total)) +
        (d.swap.total ? meter('Swap', d.swap.used, d.swap.total, gb(d.swap.used) + ' / ' + gb(d.swap.total)) : '') + meter('دیسک', d.disk.used, d.disk.total, gb(d.disk.free) + ' آزاد از ' + gb(d.disk.total)) +
        '<p class="amp-sw-note"><span class="amp-sw-live"></span>زنده · هر ۳ ثانیه · ' + tloc(d.time) + '</p>';
    }
    if (k === 'cnt') {
      var pl = d.pipeline || {}, nd = d.next_day, kinds = { hoeren: 'Hören', lesen: 'Lesen', argumentation: 'Argumentation', grafik: 'Grafik', sprechen: 'Sprechen' };
      return '<div class="amp-sw-kpis"><div><b>' + fa(d.added_24h_count) + '</b><small>افزوده ۲۴ ساعت</small></div><div><b>' + fa(d.days.published) + '/' + fa(d.days.total) + '</b><small>روز آماده</small></div><div><b>' + (pl.active ? 'فعال' : 'کامل') + '</b><small>خط تولید</small></div></div>' +
        (nd ? '<div class="amp-sw-card"><b>روز بعدی در حال ساخت</b><span>پک ' + fa(nd.day) + ' · <i lang="de" dir="ltr">' + esc(nd.theme) + '</i> · ' + fa(nd.ready) + '/' + fa(nd.items) + ' تمرین</span>' + (pl.next_run ? '<small>اجرای بعدی خط تولید: ' + tloc(pl.next_run) + '</small>' : '') + '</div>' : '<div class="amp-sw-card"><b>همه روزها آماده‌اند</b></div>') +
        Object.keys(kinds).map(function (kk) { var r = (d.per_kind || {})[kk] || { total: 0, published: 0 }; return '<div class="amp-sw-row"><span dir="ltr">' + kinds[kk] + '</span><b>' + fa(r.published) + '/' + fa(r.total) + '</b><i><u style="width:' + (r.total ? Math.round(r.published / r.total * 100) : 0) + '%"></u></i></div>'; }).join('') +
        '<h4 class="amp-sw-h">آخرین موارد افزوده‌شده</h4><ul class="amp-sw-list">' + ((d.added_24h || []).slice(0, 14).map(function (x) { return '<li><span class="amp-sw-k" dir="ltr">' + esc(kinds[x.kind] || x.kind) + '</span><span lang="de" dir="ltr">' + esc(x.title) + '</span><small dir="ltr">' + esc(String(x.added).slice(5)) + '</small></li>'; }).join('') || '<li>—</li>') + '</ul>' +
        '<p class="amp-sw-note">به‌روزرسانی: ' + tloc(d.time) + '</p>';
    }
    if (k === 'api') {
      return (d.providers || []).map(function (p) {
        return '<div class="amp-sw-api ' + (p.ok ? 'is-ok' : 'is-bad') + '"><div class="amp-sw-api-h"><b>' + esc(p.name) + '</b><span>' + (p.note ? esc(p.note) : fa(p.working || 0) + ' از ' + fa(p.results.length) + ' کلید فعال') + '</span><em>' + (p.ok ? '● فعال' : '● غیرفعال') + '</em></div><small dir="ltr">' + esc(p.model || '') + '</small>' +
          '<ul>' + p.results.map(function (r) { return '<li class="' + (r.ok ? 'ok' : 'bad') + '"><span dir="ltr">' + esc(r.key) + '</span><span>' + (r.ok ? fa(r.latency_ms) + ' ms' : esc(r.error || 'خطا')) + '</span></li>'; }).join('') + '</ul></div>';
      }).join('') + '<p class="amp-sw-note">آخرین تست: ' + tloc(d.time) + ' <button type="button" class="amp-sw-btn" onclick="AmkMethodProgress.swRetest()"' + (st.sd.apiBusy ? ' disabled' : '') + '>' + (st.sd.apiBusy ? 'در حال تست…' : '↻ تست دوباره') + '</button></p>';
    }
    return '';
  }
  function winParts(w) {
    if (SW[w]) return { cls: 'amp4-win amp-sw-win', head: '<span class="amp4-grip" aria-hidden="true">⠿</span><b>' + SW[w] + '</b><button type="button" class="amp4-win-x" aria-label="بستن" onpointerdown="event.stopPropagation()" onclick="AmkMethodProgress.close(&quot;' + w + '&quot;)">×</button>', body: statusBody(w) };
    var c = st.ctx, ds = c && c.weeks[w - 1]; if (!ds) return null;
    var cur = w === c.actWeek, ready = ds.filter(function (x) { return x.status === 'published'; }).length;
    return {
      cls: 'amp4-win' + (cur ? ' is-cur' : ''),
      head: '<span class="amp4-grip" aria-hidden="true">⠿</span><b>هفته ' + fa(w) + '</b>' + (cur ? '<span class="amp4-now">اکنون</span>' : '') +
        '<small>' + fa(ready) + '/' + fa(ds.length) + ' آماده</small><button type="button" class="amp4-win-x" aria-label="بستن" onpointerdown="event.stopPropagation()" onclick="AmkMethodProgress.close(' + w + ')">×</button>',
      body: ds.map(function (x) { return dayCard(x, c.posOf[x.day], c.act, c.done); }).join('')
    };
  }
  // reconcile: windows are only touched when their content changed (no flicker, scroll position and size kept)
  function syncFloats() {
    var host = document.getElementById('amp4Floats');
    if (!document.querySelector('.amp4')) { if (host) host.innerHTML = ''; return; }
    if (!host) { host = document.createElement('div'); host.id = 'amp4Floats'; host.className = 'amp4-wrap amp4-floats'; host.setAttribute('dir', (window.S&&S.uiLanguage&&S.uiLanguage!=='fa')?'ltr':'rtl'); host.setAttribute('data-l10n-ui', ''); document.body.appendChild(host); }
    var want = Object.keys(st.open).filter(function (w) { return st.open[w]; }).map(function (w) { return SW[w] ? w : Number(w); });
    Array.prototype.slice.call(host.children).forEach(function (el) { if (want.map(String).indexOf(el.dataset.w) < 0) el.remove(); });
    want.forEach(function (w) {
      var p = winParts(w); if (!p) return;
      var el = host.querySelector('.amp4-win[data-w="' + w + '"]');
      if (!el) {
        el = document.createElement('section'); el.dataset.w = w; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'هفته ' + fa(w));
        el.innerHTML = '<header class="amp4-win-head" onpointerdown="AmkMethodProgress.wmDown(event,' + (SW[w] ? '&quot;' + w + '&quot;' : w) + ')"></header><div class="amp4-win-body"></div>';
        el.addEventListener('pointerdown', function () { AmkMethodProgress.front(w); });
        var pos = st.pos[w] || { x: 24, y: 90 }; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
        var sz = st.size[w]; if (sz) { el.style.width = sz.w + 'px'; el.style.height = sz.h + 'px'; }
        if (window.ResizeObserver) new ResizeObserver(function () { if (el.isConnected && el.offsetWidth) st.size[w] = { w: el.offsetWidth, h: el.offsetHeight }; }).observe(el);
        el.classList.add('is-new'); setTimeout(function () { el.classList.remove('is-new'); }, 260);
        host.appendChild(el);
      }
      var want2 = p.cls + (el.classList.contains('is-moving') ? ' is-moving' : '') + (el.classList.contains('is-new') ? ' is-new' : '');
      if (el.className !== want2) el.className = want2;
      el.style.zIndex = 100 + (st.z[w] || 0);
      var head = el.firstElementChild, body = el.lastElementChild;
      var lk = (typeof S !== 'undefined' && S.uiLanguage) || 'fa'; if (head.__h !== lk + p.head) { head.innerHTML = window.amkTranslateHTML ? window.amkTranslateHTML(p.head) : p.head; head.__h = lk + p.head; }
      if (body.__h !== lk + p.body) { var top = body.scrollTop; body.innerHTML = window.amkTranslateHTML ? window.amkTranslateHTML(p.body) : p.body; body.__h = lk + p.body; body.scrollTop = top; }
    });
  }
  setInterval(function () { if (document.querySelector('.amp4')) return; st.open = {}; st.dopen = {}; var h = document.getElementById('amp4Floats'); if (h && h.innerHTML) h.innerHTML = ''; }, 800);
  var mv = null;
  function onMove(ev) {
    if (!mv) return;
    var x = Math.max(4 - mv.w + 80, Math.min(window.innerWidth - 80, ev.clientX - mv.dx)), y = Math.max(4, Math.min(window.innerHeight - 50, ev.clientY - mv.dy));
    mv.el.style.left = x + 'px'; mv.el.style.top = y + 'px'; st.pos[mv.week] = { x: Math.round(x), y: Math.round(y) };
  }
  function onUp() { if (!mv) return; mv.el.classList.remove('is-moving'); mv = null; document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); }

  function clearOver() { try { document.querySelectorAll('.amp4-wrap .is-over').forEach(function (el) { el.classList.remove('is-over'); }); } catch (e) { /* ignore */ } }
  window.AmkMethodProgress = {
    reload: function () { load(true); rerender(); },
    toggle: function (w) {
      if (st.open[w]) { this.front(w); return; }
      var n = Object.keys(st.open).filter(function (k) { return st.open[k]; }).length;
      if (!st.pos[w]) { var narrow = window.innerWidth < 640; st.pos[w] = narrow ? { x: 8, y: 70 + n * 24 } : { x: Math.max(12, Math.min(window.innerWidth - 540, Math.round((window.innerWidth - 520) / 2) + n * 34)), y: Math.max(12, Math.min(window.innerHeight - 320, 70 + n * 34)) }; }
      st.open[w] = true; st.z[w] = ++st.zTop; rerender();
    },
    close: function (w) { st.open[w] = false; rerender(); },
    sw: function (k) { if (!SW[k]) return; var was = !!st.open[k]; this.toggle(k); if (!was && k !== 'usr') swLoad(k); },
    swRetest: function () { swLoad('api'); },
    front: function (w) {
      if ((st.z[w] || 0) === st.zTop) return;
      st.z[w] = ++st.zTop;
      var el = document.querySelector('.amp4-win[data-w="' + w + '"]'); if (el) el.style.zIndex = 100 + st.z[w];
    },
    wmDown: function (ev, w) {
      if (ev.button != null && ev.button !== 0) return;
      var el = ev.currentTarget && ev.currentTarget.closest('.amp4-win'); if (!el) return;
      var r = el.getBoundingClientRect();
      mv = { el: el, week: w, dx: ev.clientX - r.left, dy: ev.clientY - r.top, w: r.width };
      el.classList.add('is-moving'); ev.preventDefault();
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
    },
    reset: function (day) {
      if (!window.TDM) return;
      var dn = doneMap()[day]; if (!dn || !dn.__dates) return;
      var dates = Object.keys(dn.__dates);
      // PACK-RESET: today's pack also resets today's progress in «اجرای برنامه», so finishing again strikes again
      if (typeof TDM.resetPackDay === 'function') Promise.resolve(TDM.resetPackDay(day, dates)).then(function () { rerender(); });
      else if (typeof TDM.setPackIgnore === 'function') { TDM.setPackIgnore(day, dates); rerender(); }
    },
    dtoggle: function (day) { st.dopen[day] = !st.dopen[day]; rerender(); },
    play: function (day) {
      var d = st.data && st.data.days.filter(function (x) { return x.day === day; })[0];
      if (!d || !window.TDM || typeof TDM.playPack !== 'function') return;
      Promise.resolve(TDM.playPack(pack(d))).then(function (ok) { if (ok) setTimeout(function () { load(true); }, 2500); });
    },
    dragStart: function (ev, day) { st.drag = day; try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(day)); } catch (e) { /* ignore */ } if (ev.currentTarget) ev.currentTarget.classList.add('is-drag'); },
    wDragStart: function (ev, w) { st.wdrag = w; st.drag = 0; try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', 'w' + w); } catch (e) { /* ignore */ } var li = ev.currentTarget && ev.currentTarget.closest('.amp4-wk'); if (li) li.classList.add('is-drag'); },
    dragEnd: function (ev) { st.drag = 0; st.wdrag = 0; try { document.querySelectorAll('.amp4-wrap .is-drag').forEach(function (el) { el.classList.remove('is-drag'); }); } catch (e) { /* ignore */ } if (ev.currentTarget) ev.currentTarget.classList.remove('is-drag'); clearOver(); },
    dragOver: function (ev, kind) { if (!(st.drag || (st.wdrag && kind === 'w'))) return; ev.preventDefault(); try { ev.dataTransfer.dropEffect = 'move'; } catch (e) { /* ignore */ } if (ev.currentTarget && !ev.currentTarget.classList.contains('is-over')) { clearOver(); ev.currentTarget.classList.add('is-over'); } },
    dragLeave: function (ev) { if (ev.currentTarget && !ev.currentTarget.contains(ev.relatedTarget)) ev.currentTarget.classList.remove('is-over'); },
    drop: function (ev, targetDay, targetWeek) {
      ev.preventDefault(); ev.stopPropagation(); clearOver();
      var src = st.drag, ws = st.wdrag; st.drag = 0; st.wdrag = 0;
      if (!st.data || !window.TDM || typeof TDM.setPackOrder !== 'function') return;
      if (ws && targetWeek && ws !== targetWeek) { // swap two whole weeks exactly (all their days)
        var ow = vseq(), a = (ws - 1) * 6, b = (targetWeek - 1) * 6, A = ow.slice(a, a + 6), B = ow.slice(b, b + 6);
        if (A.length !== B.length) return;
        Array.prototype.splice.apply(ow, [a, A.length].concat(B)); Array.prototype.splice.apply(ow, [b, B.length].concat(A));
        TDM.setPackOrder(ow, true); rerender(); return;
      }
      if (!src) return;
      var o = vseq(), i = o.indexOf(src); if (i < 0) return;
      var j = targetDay ? o.indexOf(targetDay) : Math.min(o.length - 1, (targetWeek - 1) * 6);
      if (j < 0 || j === i) return;
      if (targetDay) { o[i] = o[j]; o[j] = src; }   // day on day: the two days swap places exactly
      else { o.splice(i, 1); o.splice(j, 0, src); }   // day on a week tile: moves to the start of that week
      TDM.setPackOrder(o, true); rerender();
    },
    html: function () { var h = panel(); return window.amkTranslateHTML ? window.amkTranslateHTML(h) : h; }
  };

  function wrap() {
    if (typeof window.renderAdminUsers !== 'function') return false;
    if (window.renderAdminUsers.__amp) return true;
    var orig = window.renderAdminUsers;
    var fn = function () {
      var html = orig.apply(this, arguments);
      try {
        if (typeof isGlobalContentAdmin !== 'function' || !isGlobalContentAdmin()) return html;
        load(false);
        var i = html.indexOf('</header>'), j = html.lastIndexOf('</main>');
        var ai = html.indexOf('<section id="amkAiBox"'); if (ai > i && ai < j) j = ai;   // «مدیریت هوش مصنوعی» stays full width below, as before
        if (i < 0 || j < i) return html;
        setTimeout(syncFloats, 0);
        var swBtns = '<div class="amp-sw-btns">' + Object.keys(SW).map(function (k) { return '<button type="button" onclick="AmkMethodProgress.sw(&quot;' + k + '&quot;)">' + SW[k] + '</button>'; }).join('') + '</div>';
        return html.slice(0, i) + swBtns + html.slice(i, i + 9) + '<div class="amp-split"><div class="amp-split-a"><div class="amp4-wrap" dir="' + ((typeof S !== 'undefined' && S.uiLanguage && S.uiLanguage !== 'fa') ? 'ltr' : 'rtl') + '">' + (window.amkTranslateHTML ? window.amkTranslateHTML(panel()) : panel()) + '</div></div><div class="amp-split-b">' + html.slice(i + 9, j) + '</div></div>' + html.slice(j);
      } catch (e) { return html; }
    };
    fn.__amp = true;
    window.renderAdminUsers = fn;
    return true;
  }
  if (!wrap()) { var tries = 0, iv = setInterval(function () { if (wrap() || ++tries > 40) clearInterval(iv); }, 250); }
})();
