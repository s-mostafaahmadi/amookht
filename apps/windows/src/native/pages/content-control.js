// «کنترل محتوا» — port of the site's admin panel amk-method-progress.js (v4 + windows, 2026-11-19).
// Week tiles → a week opens as a floating, movable, resizable window with its day cards → the 4 sections.
// ▶ plays a day pack in «اجرای برنامه» (own plan only), drag a day onto a day = swap, onto a week tile = move to its
// start, drag a week onto a week = swap the two weeks. Finished skills get a red strike; ↺ clears them (and today's
// progress when the pack is today's). The app CSP forbids inline handlers, so everything runs through delegation.

import { esc } from '../core/ui.js';
import { confirmDialog } from './widgets.js';

const SK = [['hoeren', '🎧', 'Hören'], ['lesen', '📖', 'Lesen'], ['schreiben', '✍️', 'Schreiben'], ['sprechen', '🎤', 'Sprechen']];
const WD_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
// state survives page switches and redraws of the admin page
const st = { data: null, loading: false, error: '', open: {}, dopen: {}, drag: 0, wdrag: 0, pos: {}, size: {}, z: {}, zTop: 10, ctx: null };

export function createContentControl(ctx) {
  const eng = () => { try { return ctx.engine; } catch { return null; } };
  let redraw = () => {};

  async function load(force) {
    if (st.loading || (st.data && !force)) return;
    st.loading = true; st.error = '';
    try {
      const r = await ctx.bridge.api('/v1/admin/method-progress');
      if (r.ok) st.data = r.data; else st.error = r.error?.message || 'خطا در دریافت فهرست';
    } catch (e) { st.error = String(e?.message || e); }
    st.loading = false;
    redraw();
  }
  function seq() {
    const all = st.data.days.map((x) => x.day).sort((a, b) => a - b);
    const have = new Set(all); const seen = new Set();
    const own = ((eng()?.packOrder && eng().packOrder()) || []).filter((x) => have.has(x) && !seen.has(x) && seen.add(x));
    return own.concat(all.filter((x) => !seen.has(x)));
  }
  function activeDay() {
    try {
      const e = eng(); const m = e.M(); const k = e.S.plan?.date || e.dayKey(); const d = m.days?.[k];
      if (d && d.packDay) return Number(d.packDay);
      if (d && d.picks && st.data) { const hit = st.data.days.find((x) => x.items.some((i) => i.id === d.picks.hoeren)); if (hit) return hit.day; }
      if (m.packCur) return Number(m.packCur);
    } catch { /* ignore */ }
    return st.data?.learner?.current_day || 0;
  }
  function pack(d) {
    const p = { day: d.day, theme: d.theme || '', sprechen: [] };
    d.items.forEach((i) => {
      if ((i.kind === 'hoeren' || i.kind === 'lesen') && !p[i.kind]) p[i.kind] = i.id;
      else if ((i.kind === 'argumentation' || i.kind === 'grafik') && !p.schreiben) p.schreiben = { kind: i.kind, id: i.id };
      else if (i.kind === 'sprechen') p.sprechen.push(i.id);
    });
    return p;
  }
  function bySkill(d) {
    const by = { hoeren: [], lesen: [], schreiben: [], sprechen: [] };
    d.items.forEach((i) => by[i.kind === 'argumentation' || i.kind === 'grafik' ? 'schreiben' : i.kind].push(i));
    return by;
  }
  /** finished skills per pack from this account's plan days (days reset with ↺ are ignored) */
  function doneMap() {
    const out = {}; const byH = {};
    try {
      st.data.days.forEach((x) => x.items.forEach((i) => { if (i.kind === 'hoeren') byH[i.id] = x.day; }));
      const e = eng(); const m = e.M(); const ign = e.packIgnore() || {}; const planDate = e.S.plan?.date;
      Object.keys(m.days || {}).forEach((k) => {
        const d = m.days[k]; if (!d || !d.picks) return;
        const pk = Number(d.packDay) || byH[d.picks.hoeren];
        if (!pk || (ign[pk] || []).includes(k)) return;
        let got = Object.keys(d.results || {});
        if (k === planDate && e.active()) got = got.concat(e.S.completedActivities || []);
        got.forEach((sk) => { if (SK.some((s) => s[0] === sk)) { const o = out[pk] || (out[pk] = { __dates: {} }); o[sk] = true; o.__dates[k] = 1; } });
      });
    } catch { /* ignore */ }
    return out;
  }
  const stClass = (s) => (s === 'published' ? 'ok' : s === 'queued' ? 'q' : 'p');
  // FRI-FILL: ids 7, 14, 21 … (the old Fridays) take the first days that are still empty; the rest go last.
  const friId = (id) => ((Number(id) - 1) % 7) === 6;
  function friFill(list) {
    const byId = {}; (st.data?.days || []).forEach((x) => { byId[x.day] = x; });
    const ready = (id) => byId[id]?.status === 'published';
    const fr = list.filter(friId); const fReady = fr.filter(ready); const fLater = fr.filter((x) => !ready(x));
    let out = []; let wait = [];
    list.filter((x) => !friId(x)).forEach((x) => {
      if (!ready(x) && fReady.length) { out.push(fReady.shift()); wait.push(x); return; }
      if (wait.length && !fReady.length) { out = out.concat(wait); wait = []; }
      out.push(x);
    });
    return out.concat(fReady, wait, fLater);
  }
  const vseq = () => ((eng()?.packOrderFri && eng().packOrderFri()) ? seq() : friFill(seq()));

  function details(d, dn) {
    const by = bySkill(d);
    return `<div class="amp4-det">${SK.map(([k, ic, name]) => `<div class="amp4-det-row ${dn[k] ? 'is-done' : ''}"><span class="amp4-det-ic">${ic}</span><div><b>${name}</b>${by[k].length ? by[k].map((i) => {
      const tag = i.kind === 'grafik' ? 'Grafik' : i.kind === 'argumentation' ? 'Argumentation' : (i.type || '');
      return `<p lang="de" dir="ltr" class="${i.status !== 'published' ? 'is-wait' : ''}">${i.done ? '<em class="ok">✓</em>' : i.used ? '<em>•</em>' : ''}${esc(i.title || i.topic)}${tag ? ` <small>${esc(tag)}</small>` : ''}${i.status !== 'published' ? ' <small class="w">در حال ساخت</small>' : ''}</p>`;
    }).join('') : '<p class="is-wait">—</p>'}</div></div>`).join('')}</div>`;
  }
  function dayCard(d, p, act, done) {
    const cur = d.day === act; const ready = d.status === 'published'; const op = !!st.dopen[d.day]; const by = bySkill(d); const dn = done[d.day] || {};
    const chips = SK.map(([k, ic, name]) => { const list = by[k]; const ok = list.length && list.every((i) => i.status === 'published'); return `<span class="amp4-chip ${ok ? '' : 'is-off'} ${dn[k] ? 'is-done' : ''}" title="${name}${dn[k] ? ' · انجام شد' : ''}">${ic}${k === 'sprechen' && list.length > 1 ? `<i>${fa(list.length)}</i>` : ''}</span>`; }).join('');
    const anyDone = SK.some(([k]) => dn[k]);
    return `<article class="amp4-day st-${stClass(d.status)} ${cur ? 'is-cur' : ''} ${op ? 'is-open' : ''}" draggable="true" data-amp-day="${d.day}">
      <div class="amp4-day-top"><span class="amp4-grip" aria-hidden="true">⠿</span><div class="amp4-day-n"><b>روز ${fa(d.day)}</b><small>${WD_FA[((Number(p) || 1) - 1) % 6]}</small></div>${cur ? '<span class="amp4-now">امروز در برنامه</span>' : ''}
      ${anyDone ? `<button type="button" class="amp4-reset" title="پاک کردن علامت‌های انجام‌شده این روز" data-amp-reset="${d.day}">↺</button>` : ''}
      <button type="button" class="amp4-play" ${ready ? '' : 'disabled '}title="${ready ? 'اجرای این روز به‌جای تمرین‌های امروز' : 'هنوز آماده نیست'}" data-amp-play="${d.day}">▶</button></div>
      <button type="button" class="amp4-day-body" aria-expanded="${op}" data-amp-dt="${d.day}"><span class="amp4-theme" lang="de" dir="ltr">${esc(d.theme || '—')}</span><span class="amp4-chips">${chips}<em class="amp4-more">${op ? 'بستن' : 'جزئیات'}</em></span></button>
      ${op ? details(d, dn) : ''}</article>`;
  }
  function panel() {
    const d = st.data;
    const hdr = (meta, bar = '') => `<header class="amp4-hero"><div class="amp4-hero-tx"><h2>🗂️ کنترل محتوا</h2><p>روی هر هفته بزنید تا پنجره‌اش باز شود · روز را روی روز دیگر بکشید تا جایشان عوض شود · هفته را روی هفته دیگر بکشید</p></div><div class="amp4-hero-side">${meta}<button type="button" class="amp4-rf" data-amp-reload="1" title="بازخوانی">↻</button></div>${bar}</header>`;
    if (!d) return `<section class="amp4">${hdr(`<span class="amp4-pill">${esc(st.error || 'در حال بارگذاری…')}</span>`)}</section>`;
    const byId = {}; d.days.forEach((x) => { byId[x.day] = x; });
    const order = vseq().filter((id) => byId[id]); const posOf = {}; order.forEach((id, i) => { posOf[id] = i + 1; });
    const done = doneMap(); const act = activeDay();
    const actPos = posOf[act] || 0; const actWeek = actPos ? Math.ceil(actPos / 6) : 0; const weeks = [];
    order.forEach((id, i) => { const w = Math.floor(i / 6); (weeks[w] = weeks[w] || []).push(byId[id]); });
    st.ctx = { weeks, posOf, act, actWeek, done };
    const visTotal = order.length; const visPub = order.filter((id) => byId[id].status === 'published').length; const pct = visTotal ? Math.round((visPub / visTotal) * 100) : 0;
    const meta = `<span class="amp4-pill"><small>روز فعلی</small><b>${actPos ? fa(actPos) : '—'}</b></span><span class="amp4-pill"><small>روز آماده</small><b>${fa(visPub)}<i>/${fa(visTotal)}</i></b></span>`;
    const tiles = weeks.map((ds, wi) => {
      const w = wi + 1; const op = !!st.open[w]; const cur = w === actWeek; const ready = ds.filter((x) => x.status === 'published').length; const themed = ds.some((x) => x.themed);
      const dots = ds.map((x) => `<i class="st-${stClass(x.status)} ${x.day === act ? 'is-cur' : ''}"></i>`).join('');
      return `<li class="amp4-wk ${cur ? 'is-cur' : ''} ${op ? 'is-open' : ''}"><button type="button" class="amp4-wk-head" draggable="true" data-amp-week="${w}"><span class="amp4-wk-t"><b>هفته ${fa(w)}</b>${cur ? '<span class="amp4-now">اکنون</span>' : ''}${themed ? '<span class="amp4-tag">موضوعی</span>' : ''}</span><span class="amp4-dots">${dots}</span><small>${fa(ready)} از ${fa(ds.length)} روز آماده</small><span class="amp4-caret" aria-hidden="true">${op ? '●' : '⧉'}</span></button></li>`;
    }).join('');
    return `<section class="amp4">${hdr(meta, `<div class="amp4-prog"><i style="width:${pct}%"></i></div>`)}<ul class="amp4-weeks">${tiles}</ul>
      <footer class="amp4-legend"><span><i class="st-ok"></i>آماده</span><span><i class="st-p"></i>در حال ساخت</span><span><i class="st-q"></i>در صف</span><span><i class="is-cur"></i>روز فعلی</span><span><b class="amp4-lg-done">🎧</b>انجام‌شده در برنامه</span></footer></section>`;
  }

  /* ── ADMIN-STATUS (site 2026-11-19): four windows from the admin header (users, system, content, APIs) ── */
  const SW = { usr: '👥 وضعیت کاربران', sys: '🖥️ وضعیت سیستم', cnt: '📦 وضعیت محتوا', api: '🔌 وضعیت API‌ها' };
  const wkey = (v) => (SW[v] ? v : Number(v));
  st.sd = { sys: null, cnt: null, api: null, apiBusy: false };
  let usersOf = () => [];
  const gb = (n) => { n = Number(n) || 0; return n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : Math.round(n / 1048576) + ' MB'; };
  const meter = (label, used, total, txt) => { const p = total ? Math.min(100, Math.round((used / total) * 100)) : 0; return `<div class="amp-sw-meter ${p >= 90 ? 'is-hot' : p >= 70 ? 'is-warm' : ''}"><div><b>${label}</b>${txt ? `<span dir="ltr">${txt}</span>` : ''}<small>${fa(p)}٪</small></div><i><u style="width:${p}%"></u></i></div>`; };
  const tloc = (iso) => { try { return new Date(iso).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }); } catch { return iso || ''; } };
  async function swLoad(k) {
    if (k === 'api') { if (st.sd.apiBusy) return; st.sd.apiBusy = true; syncFloats(); }
    const path = k === 'sys' ? '/v1/admin/status/system' : k === 'cnt' ? '/v1/admin/status/content' : k === 'api' ? '/v1/admin/status/apis' : null;
    if (!path) return;
    const r = await ctx.bridge.api(path, k === 'api' ? { method: 'POST', body: {} } : undefined).catch((e) => ({ ok: false, error: { message: String(e?.message || e) } }));
    st.sd[k] = r.ok ? r.data : { error: r.error?.message || 'خطا' };
    if (k === 'api') st.sd.apiBusy = false;
    syncFloats();
  }
  setInterval(() => { if (st.open.sys && document.querySelector('.page.admin .amp4')) swLoad('sys'); }, 3000);
  function statusBody(k) {
    if (k === 'usr') {
      const us = usersOf() || []; const c = { normal: 0, premium: 0, admin: 0, owner: 0 }; let blocked = 0; let ver = 0; let d7 = 0; let d30 = 0; let act = 0; const now = Date.now();
      us.forEach((u) => { c[u.access_role || 'normal'] = (c[u.access_role || 'normal'] || 0) + 1; if (u.is_blocked) blocked += 1; if (u.is_verified) ver += 1; const cr = Date.parse(u.created_at || ''); if (cr && now - cr < 7 * 864e5) d7 += 1; if (cr && now - cr < 30 * 864e5) d30 += 1; const ls = Date.parse(u.last_seen_at || ''); if (ls && now - ls < 864e5) act += 1; });
      const row = (l, n, cls = '') => `<div class="amp-sw-row ${cls}"><span>${l}</span><b>${fa(n)}</b><i><u style="width:${us.length ? Math.round((n / us.length) * 100) : 0}%"></u></i></div>`;
      return `<div class="amp-sw-kpis"><div><b>${fa(us.length)}</b><small>همه کاربران</small></div><div><b>${fa(act)}</b><small>فعال ۲۴ ساعت</small></div><div><b>${fa(d7)}</b><small>جدید این هفته</small></div></div>`
        + row('رایگان', c.normal) + row('Premium', c.premium, 'k-p') + row('مدیر', c.admin, 'k-a') + row('مالک', c.owner, 'k-o') + row('مسدود', blocked, 'k-b') + row('تأییدشده', ver, 'k-v')
        + `<p class="amp-sw-note">جدید در ۳۰ روز: ${fa(d30)}</p>`;
    }
    const d = st.sd[k];
    if (k === 'api' && st.sd.apiBusy && !d) return '<p class="amp-sw-note">در حال تست همه کلیدها… (تا ۲۰ ثانیه)</p>';
    if (!d) return '<p class="amp-sw-note">در حال دریافت…</p>';
    if (d.error) return `<p class="amp-sw-note is-err">${esc(d.error)}</p>`;
    if (k === 'sys') {
      return `<div class="amp-sw-kpis"><div><b>${fa(d.cpu_percent)}٪</b><small>CPU (${fa(d.cpu_count)} هسته)</small></div><div><b>${fa(d.load?.[0] ?? 0)}</b><small>بار ۱ دقیقه</small></div><div><b>${fa(Math.floor((d.uptime_s || 0) / 86400))} روز</b><small>روشن بودن</small></div></div>`
        + meter('پردازنده', d.cpu_percent, 100, fa(d.cpu_percent) + '٪') + meter('حافظه (RAM)', d.ram.used, d.ram.total, gb(d.ram.used) + ' / ' + gb(d.ram.total))
        + (d.swap?.total ? meter('Swap', d.swap.used, d.swap.total, gb(d.swap.used) + ' / ' + gb(d.swap.total)) : '') + meter('دیسک', d.disk.used, d.disk.total, gb(d.disk.free) + ' آزاد از ' + gb(d.disk.total))
        + `<p class="amp-sw-note"><span class="amp-sw-live"></span>زنده · هر ۳ ثانیه · ${tloc(d.time)}</p>`;
    }
    if (k === 'cnt') {
      const pl = d.pipeline || {}; const nd = d.next_day; const kinds = { hoeren: 'Hören', lesen: 'Lesen', argumentation: 'Argumentation', grafik: 'Grafik', sprechen: 'Sprechen' };
      return `<div class="amp-sw-kpis"><div><b>${fa(d.added_24h_count)}</b><small>افزوده ۲۴ ساعت</small></div><div><b>${fa(d.days.published)}/${fa(d.days.total)}</b><small>روز آماده</small></div><div><b>${pl.active ? 'فعال' : 'کامل'}</b><small>خط تولید</small></div></div>`
        + (nd ? `<div class="amp-sw-card"><b>روز بعدی در حال ساخت</b><span>پک ${fa(nd.day)} · <i lang="de" dir="ltr">${esc(nd.theme)}</i> · ${fa(nd.ready)}/${fa(nd.items)} تمرین</span>${pl.next_run ? `<small>اجرای بعدی خط تولید: ${tloc(pl.next_run)}</small>` : ''}</div>` : '<div class="amp-sw-card"><b>همه روزها آماده‌اند</b></div>')
        + Object.keys(kinds).map((kk) => { const r = (d.per_kind || {})[kk] || { total: 0, published: 0 }; return `<div class="amp-sw-row"><span dir="ltr">${kinds[kk]}</span><b>${fa(r.published)}/${fa(r.total)}</b><i><u style="width:${r.total ? Math.round((r.published / r.total) * 100) : 0}%"></u></i></div>`; }).join('')
        + `<h4 class="amp-sw-h">آخرین موارد افزوده‌شده</h4><ul class="amp-sw-list">${(d.added_24h || []).slice(0, 14).map((x) => `<li><span class="amp-sw-k" dir="ltr">${esc(kinds[x.kind] || x.kind)}</span><span lang="de" dir="ltr">${esc(x.title)}</span><small dir="ltr">${esc(String(x.added).slice(5))}</small></li>`).join('') || '<li>—</li>'}</ul>`
        + `<p class="amp-sw-note">به‌روزرسانی: ${tloc(d.time)}</p>`;
    }
    if (k === 'api') {
      return (d.providers || []).map((p) => `<div class="amp-sw-api ${p.ok ? 'is-ok' : 'is-bad'}"><div class="amp-sw-api-h"><b>${esc(p.name)}</b><span>${p.note ? esc(p.note) : fa(p.working || 0) + ' از ' + fa(p.results.length) + ' کلید فعال'}</span><em>${p.ok ? '● فعال' : '● غیرفعال'}</em></div><small dir="ltr">${esc(p.model || '')}</small>`
        + `<ul>${p.results.map((r) => `<li class="${r.ok ? 'ok' : 'bad'}"><span dir="ltr">${esc(r.key)}</span><span>${r.ok ? fa(r.latency_ms) + ' ms' : esc(r.error || 'خطا')}</span></li>`).join('')}</ul></div>`).join('')
        + `<p class="amp-sw-note">آخرین تست: ${tloc(d.time)} <button type="button" class="amp-sw-btn" data-amp-swre="1" ${st.sd.apiBusy ? 'disabled' : ''}>${st.sd.apiBusy ? 'در حال تست…' : '↻ تست دوباره'}</button></p>`;
    }
    return '';
  }
  function sw(k) { if (!SW[k]) return; const was = !!st.open[k]; toggle(k); if (!was && k !== 'usr') swLoad(k); }

  /* ── floating week windows (portal in <body>, reconciled so they never flicker) ── */
  function winParts(w) {
    if (SW[w]) return { cls: 'amp4-win amp-sw-win', head: `<span class="amp4-grip" aria-hidden="true">⠿</span><b>${SW[w]}</b><button type="button" class="amp4-win-x" aria-label="بستن" data-amp-close="${w}">×</button>`, body: statusBody(w) };
    const c = st.ctx; const ds = c && c.weeks[w - 1]; if (!ds) return null;
    const cur = w === c.actWeek; const ready = ds.filter((x) => x.status === 'published').length;
    return {
      cls: 'amp4-win' + (cur ? ' is-cur' : ''),
      head: `<span class="amp4-grip" aria-hidden="true">⠿</span><b>هفته ${fa(w)}</b>${cur ? '<span class="amp4-now">اکنون</span>' : ''}<small>${fa(ready)}/${fa(ds.length)} آماده</small><button type="button" class="amp4-win-x" aria-label="بستن" data-amp-close="${w}">×</button>`,
      body: ds.map((x) => dayCard(x, c.posOf[x.day], c.act, c.done)).join(''),
    };
  }
  function syncFloats() {
    let host = document.getElementById('amp4Floats');
    if (!document.querySelector('.page.admin .amp4')) { if (host) host.innerHTML = ''; return; }
    if (!host) { host = document.createElement('div'); host.id = 'amp4Floats'; host.className = 'amp4-wrap amp4-floats'; host.dir = 'rtl'; document.body.appendChild(host); bindEvents(host); }
    const want = Object.keys(st.open).filter((w) => st.open[w]).map(wkey);
    [...host.children].forEach((el) => { if (!want.includes(wkey(el.dataset.w))) el.remove(); });
    want.forEach((w) => {
      const p = winParts(w); if (!p) return;
      let el = host.querySelector(`.amp4-win[data-w="${w}"]`);
      if (!el) {
        el = document.createElement('section'); el.dataset.w = w; el.setAttribute('role', 'dialog');
        el.innerHTML = '<header class="amp4-win-head"></header><div class="amp4-win-body"></div>';
        const pos = st.pos[w] || { x: 24, y: 90 }; el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
        const sz = st.size[w]; if (sz) { el.style.width = sz.w + 'px'; el.style.height = sz.h + 'px'; }
        if (window.ResizeObserver) new ResizeObserver(() => { if (el.isConnected && el.offsetWidth) st.size[w] = { w: el.offsetWidth, h: el.offsetHeight }; }).observe(el);
        el.classList.add('is-new'); setTimeout(() => el.classList.remove('is-new'), 260);
        host.appendChild(el);
      }
      const keep = (el.classList.contains('is-moving') ? ' is-moving' : '') + (el.classList.contains('is-new') ? ' is-new' : '');
      if (el.className !== p.cls + keep) el.className = p.cls + keep;
      el.style.zIndex = String(100 + (st.z[w] || 0));
      const head = el.firstElementChild; const body = el.lastElementChild;
      if (head.__h !== p.head) { head.innerHTML = p.head; head.__h = p.head; }
      if (body.__h !== p.body) { const top = body.scrollTop; body.innerHTML = p.body; body.__h = p.body; body.scrollTop = top; }
    });
  }
  setInterval(() => { const h = document.getElementById('amp4Floats'); if (h && h.innerHTML && !document.querySelector('.page.admin .amp4')) h.innerHTML = ''; }, 800);

  /* ── actions ── */
  function front(w) { if ((st.z[w] || 0) === st.zTop) return; st.z[w] = ++st.zTop; const el = document.querySelector(`.amp4-win[data-w="${w}"]`); if (el) el.style.zIndex = String(100 + st.z[w]); }
  function toggle(w) {
    if (st.open[w]) { front(w); return; }
    const n = Object.keys(st.open).filter((k) => st.open[k]).length;
    if (!st.pos[w]) st.pos[w] = window.innerWidth < 640 ? { x: 8, y: 70 + n * 24 } : { x: Math.max(12, Math.min(window.innerWidth - 540, Math.round((window.innerWidth - 520) / 2) + n * 34)), y: Math.max(12, Math.min(window.innerHeight - 320, 70 + n * 34)) };
    st.open[w] = true; st.z[w] = ++st.zTop; redraw();
  }
  async function play(day) {
    const d = st.data?.days.find((x) => x.day === day); const e = eng(); if (!d || !e) return;
    if (!(await confirmDialog(`تمرین‌های امروز با پک «روز ${fa(day)}${d.theme ? ' · ' + d.theme : ''}» جایگزین شود؟ پیشرفت امروز صفر می‌شود.`, { ok: 'اجرا', danger: false }))) return;
    const r = await e.playPack(pack(d));
    if (r === 'ok') { ctx.toast?.('پک روز در «اجرای برنامه» قرار گرفت.', 'ok'); redraw(); setTimeout(() => load(true), 2500); }
    else if (r === 'inactive') ctx.toast?.('اول در «اجرای برنامه» تب «برنامه یادگیری» را فعال کن.', 'warn');
    else if (r === 'missing') ctx.toast?.('همه تمرین‌های این روز هنوز منتشر نشده‌اند.', 'warn');
  }
  async function reset(day) {
    const e = eng(); const dn = doneMap()[day]; if (!e || !dn) return;
    const dates = Object.keys(dn.__dates || {});
    if (e.resetPackTouchesToday(dates) && !(await confirmDialog('این روز همان تمرین امروز در «اجرای برنامه» است. علامت‌ها پاک شوند و پیشرفت امروز Hören، Lesen، Schreiben و Sprechen هم از نو شروع شود؟', { ok: 'پاک کن', danger: true }))) return;
    e.resetPackDay(day, dates); redraw();
  }
  function drop(targetDay, targetWeek) {
    const e = eng(); const src = st.drag; const ws = st.wdrag; st.drag = 0; st.wdrag = 0;
    if (!st.data || !e) return;
    if (ws && targetWeek && ws !== targetWeek) {
      const ow = vseq(); const a = (ws - 1) * 6; const b = (targetWeek - 1) * 6; const A = ow.slice(a, a + 6); const B = ow.slice(b, b + 6);
      if (A.length !== B.length) return;
      ow.splice(a, A.length, ...B); ow.splice(b, B.length, ...A);
      e.setPackOrder(ow, true); redraw(); return;
    }
    if (!src) return;
    const o = vseq(); const i = o.indexOf(src); if (i < 0) return;
    const j = targetDay ? o.indexOf(targetDay) : Math.min(o.length - 1, (targetWeek - 1) * 6);
    if (j < 0 || j === i) return;
    if (targetDay) { o[i] = o[j]; o[j] = src; } else { o.splice(i, 1); o.splice(j, 0, src); }
    e.setPackOrder(o, true); redraw();
  }
  const clearOver = () => document.querySelectorAll('.amp4-wrap .is-over').forEach((x) => x.classList.remove('is-over'));

  let mv = null;
  const onMove = (ev) => { if (!mv) return; const x = Math.max(80 - mv.w, Math.min(window.innerWidth - 80, ev.clientX - mv.dx)); const y = Math.max(4, Math.min(window.innerHeight - 50, ev.clientY - mv.dy)); mv.el.style.left = x + 'px'; mv.el.style.top = y + 'px'; st.pos[mv.week] = { x: Math.round(x), y: Math.round(y) }; };
  const onUp = () => { if (!mv) return; mv.el.classList.remove('is-moving'); mv = null; document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };

  function bindEvents(root) {
    if (root.__ampBound) return; root.__ampBound = true;
    root.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-amp-reload],[data-amp-week],[data-amp-close],[data-amp-play],[data-amp-reset],[data-amp-dt],[data-amp-sw],[data-amp-swre]');
      if (!b || b.disabled) return;
      const d = b.dataset;
      if (d.ampReload) { load(true); redraw(); }
      else if (d.ampWeek) toggle(Number(d.ampWeek));
      else if (d.ampClose) { st.open[wkey(d.ampClose)] = false; redraw(); }
      else if (d.ampSw) sw(d.ampSw);
      else if (d.ampSwre) swLoad('api');
      else if (d.ampPlay) play(Number(d.ampPlay));
      else if (d.ampReset) reset(Number(d.ampReset));
      else if (d.ampDt) { st.dopen[d.ampDt] = !st.dopen[d.ampDt]; redraw(); }
    });
    root.addEventListener('pointerdown', (ev) => {
      const win = ev.target.closest('.amp4-win'); if (win) front(wkey(win.dataset.w));
      const head = ev.target.closest('.amp4-win-head');
      if (!head || ev.target.closest('button') || (ev.button != null && ev.button !== 0)) return;
      const r = win.getBoundingClientRect();
      mv = { el: win, week: wkey(win.dataset.w), dx: ev.clientX - r.left, dy: ev.clientY - r.top, w: r.width };
      win.classList.add('is-moving'); ev.preventDefault();
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
    });
    root.addEventListener('dragstart', (ev) => {
      const day = ev.target.closest?.('[data-amp-day]'); const wk = ev.target.closest?.('[data-amp-week]');
      if (day) { st.drag = Number(day.dataset.ampDay); st.wdrag = 0; day.classList.add('is-drag'); }
      else if (wk) { st.wdrag = Number(wk.dataset.ampWeek); st.drag = 0; wk.closest('.amp4-wk')?.classList.add('is-drag'); }
      else return;
      try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', 'amp'); } catch { /* ignore */ }
    });
    root.addEventListener('dragend', () => { st.drag = 0; st.wdrag = 0; document.querySelectorAll('.amp4-wrap .is-drag').forEach((x) => x.classList.remove('is-drag')); clearOver(); });
    root.addEventListener('dragover', (ev) => {
      const day = ev.target.closest?.('[data-amp-day]'); const wk = ev.target.closest?.('[data-amp-week]');
      const tgt = day || wk; if (!tgt) return;
      if (!(st.drag || (st.wdrag && wk))) return;
      ev.preventDefault(); try { ev.dataTransfer.dropEffect = 'move'; } catch { /* ignore */ }
      if (!tgt.classList.contains('is-over')) { clearOver(); tgt.classList.add('is-over'); }
    });
    root.addEventListener('drop', (ev) => {
      const day = ev.target.closest?.('[data-amp-day]'); const wk = ev.target.closest?.('[data-amp-week]');
      if (!day && !wk) return;
      ev.preventDefault(); clearOver();
      drop(day ? Number(day.dataset.ampDay) : 0, wk ? Number(wk.dataset.ampWeek) : 0);
    });
  }

  return {
    html() { load(false); return `<div class="amp4-wrap" dir="rtl">${panel()}</div>`; },
    mount(pageRoot, redrawFn) { redraw = redrawFn; bindEvents(pageRoot); setTimeout(syncFloats, 0); },
    close() { const h = document.getElementById('amp4Floats'); if (h) h.innerHTML = ''; },
    setUsers(fn) { usersOf = fn; },
    swButtons() { return `<div class="amp-sw-btns">${Object.keys(SW).map((k) => `<button type="button" data-amp-sw="${k}">${SW[k]}</button>`).join('')}</div>`; },
    refreshUsers() { if (st.open.usr) syncFloats(); },
  };
}
