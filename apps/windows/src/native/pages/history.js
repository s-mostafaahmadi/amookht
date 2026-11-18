// «تاریخچه» — the site's history page (TDM.renderHistoryPage): tab «برنامه یادگیری»
// (plan KPIs, skill trend, week-by-week bars, daily report, weekly reports) and tab
// «مطالعه آزاد» (free plan + study-desk timer per day, time chart, skills with weekly goals).
// Same data: history, testdafMethod/oesdMethod, appSettings.freeStudy.sessions, skillTargets.

import { esc } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import { L, num, today, addDays, parseKey, keyOf, methodKey, mutate } from '../core/learning.js';
import { confirmDialog } from './widgets.js';
import { rebuildDay, mergeByDate } from '../core/history-data.js';
import { ownerDayFileButton, ownerDayFileInlineBlock } from '../core/owner-files.js';

const ui = { tab: null, openDay: null, planShow: 7, freeShow: 7, fileOpen: null };

const MODS = {
  hoeren: { de: 'Hören', color: '#a855f7' }, lesen: { de: 'Lesen', color: '#0ea5e9' }, schreiben: { de: 'Schreiben', color: '#f59e0b' },
  sprechen: { de: 'Sprechen', color: '#f43f5e' }, wortschatz: { de: 'Grammatik & Wortschatz', color: '#10b981' }, wiederholung: { de: 'Wiederholung', color: '#6366f1' },
  fehleranalyse: { de: 'Fehleranalyse', color: '#ef4444' }, wochenbericht: { de: 'Wochenbericht', color: '#14b8a6' }, extra: { de: 'Extra-Lernzeit', color: '#0d9488' },
};
const S4 = ['hoeren', 'lesen', 'schreiben', 'sprechen'];
const PLAN_ONLY_IDS = ['wiederholung', 'extra', 'fehleranalyse', 'wochenbericht'];
const DAY_NAMES = { 6: ['شنبه', 'Samstag', 'Saturday'], 0: ['یکشنبه', 'Sonntag', 'Sunday'], 1: ['دوشنبه', 'Montag', 'Monday'], 2: ['سه‌شنبه', 'Dienstag', 'Tuesday'], 3: ['چهارشنبه', 'Mittwoch', 'Wednesday'], 4: ['پنجشنبه', 'Donnerstag', 'Thursday'], 5: ['جمعه', 'Freitag', 'Friday'] };
const GOAL_KEYS = ['lesen', 'hoeren', 'schreiben', 'sprechen', 'grammatik', 'wortschatz'];
const PALETTE = ['#38bdf8', '#a855f7', '#fb7185', '#f59e0b', '#34d399', '#6366f1', '#f472b6', '#22d3ee'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
const wdOf = (k) => parseKey(k).getDay();
const satOf = (k) => addDays(k, -((wdOf(k) + 1) % 7));
const avgOf = (v) => {
  v = v.filter((x) => Number.isFinite(x));
  return v.length ? Math.round(v.reduce((a, x) => a + x, 0) / v.length) : null;
};
const fmtMin = (sec) => {
  const mm = Math.round((Number(sec) || 0) / 60);
  const h = Math.floor(mm / 60);
  const r = mm % 60;
  return lang() === 'fa' ? (h ? `${num(h)} ساعت${r ? ' و ' + num(r) + ' دقیقه' : ''}` : `${num(r)} دقیقه`) : h ? `${h} h${r ? ' ' + r + ' min' : ''}` : `${r} min`;
};
const fmtShort = (min) => {
  min = Math.max(0, Math.round(min));
  const h = Math.floor(min / 60);
  const r = min % 60;
  return h ? `${num(h)}h${r ? ' ' + num(r) + 'm' : ''}` : `${num(r)}m`;
};
const fmtPct = (v) => (v == null ? '—' : num(v) + '%');
const dateLocale = () => (lang() === 'fa' ? 'fa-IR-u-ca-persian' : lang() === 'en' ? 'en-GB' : 'de-DE');
function fmtDay(k, kind) {
  try {
    return new Intl.DateTimeFormat(dateLocale(), kind === 'short' ? { day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(k + 'T12:00:00'));
  } catch {
    return k;
  }
}
const skillField = (s) => (s === 'hoeren' || s === 'lesen' ? 'pct' : 'score');
function skillVal(d, s) {
  const r = d.results?.[s];
  if (!r || r[skillField(s)] == null) return null;
  const v = Number(r[skillField(s)]);
  return Number.isFinite(v) ? v : null;
}
const historySkillId = (id) => ({ vocab: 'wortschatz', vocab_review: 'wortschatz', extra_vocab: 'lesen', grammar: 'grammatik', writing: 'schreiben', listening: 'hoeren', gesamttest: 'mini_test' }[id] || id);
const activityLabel = (id) => ({
  extra: 'Extra-Lernzeit', wiederholung: 'Wiederholung', fehleranalyse: 'Fehleranalyse', wochenbericht: 'Wochenbericht', wortschatz: 'Wortschatz', lesen: 'Lesen', hoeren: 'Hören', sprechen: 'Sprechen', schreiben: 'Schreiben', grammatik: 'Grammatik', active_recall: 'Aktives Abrufen', mini_test: 'Mini-Test', vocab: 'Wortschatz', vocab_review: 'Vokabel-Wiederholung', grammar: 'Grammatik', writing: 'Schreiben', listening: 'Hören', gesamttest: 'Gesamttest',
  __mistakes: L('اشتباهات', 'Mistakes', 'Fehler'), __favorites: L('علاقه‌مندی‌ها', 'Favorites', 'Favoriten'),
}[id] || String(id).replaceAll('_', ' '));

export function renderHistory(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page hx';

  const draw = () => {
    const data = ctx.store.data;
    const m = data[methodKey(data)] || {};
    const days = m.days && typeof m.days === 'object' ? m.days : {};
    const enrolled = (data.user?.examPlan || '') === 'testdaf' || (data.user?.examPlan || '') === 'oesd';
    const hasPlan = enrolled || Object.keys(days).length > 0;
    const tab = !hasPlan ? 'free' : ui.tab === 'free' ? 'free' : 'plan';

    // period (site histPeriod)
    const f = ['week', 'month', 'quarter'].includes(data.historyFilter) ? data.historyFilter : 'week';
    const to = today();
    const c = parseKey(to);
    if (f === 'week') c.setDate(c.getDate() - 6);
    else c.setMonth(c.getMonth() - (f === 'month' ? 1 : 3));
    const from = keyOf(c);
    const len = diffDays(from, to) + 1;
    const pf = addDays(from, -len);
    const pt = addDays(from, -1);
    const P = { f, from, to, len, inP: (k) => k >= from && k <= to, inPrev: (k) => k >= pf && k <= pt };

    // split history into plan time and free days (site splitHistory)
    const ids = new Set(Object.keys((data.testdafMethod || {}).planIds || {}));
    const free = [];
    const planTime = {};
    for (const day of mergeByDate(data.history || [])) {
      const freeSegs = {};
      for (const seg of Object.values(day.segments || {})) {
        if (!seg) continue;
        const isPlan = ids.has(seg.planId) || Object.keys(seg.activityTimes || {}).some((id) => PLAN_ONLY_IDS.includes(id));
        if (isPlan) planTime[day.date] = (planTime[day.date] || 0) + (Number(seg.time) || 0);
        else freeSegs[seg.planId] = seg;
      }
      if (Object.keys(freeSegs).length) free.push(rebuildDay({ date: day.date, segments: freeSegs }));
    }
    const desk = (data.appSettings?.freeStudy?.sessions && typeof data.appSettings.freeStudy.sessions === 'object') ? data.appSettings.freeStudy.sessions : {};
    const split = { free, planTime };

    let planSecs = 0;
    let freeSecs = 0;
    if (hasPlan) {
      Object.values(days).forEach((d) => { if (P.inP(d.date)) planSecs += Math.max(planTime[d.date] || 0, Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0)); });
      free.forEach((d) => { if (P.inP(d.date)) freeSecs += Number(d.time) || 0; });
      Object.entries(desk).forEach(([k, v]) => { if (P.inP(k)) freeSecs += Number(v) || 0; });
    }
    const name = data.user?.name || ctx.account.name || 'Learner';
    const avatar = data.user?.avatarDataUrl ? `<img src="${esc(data.user.avatarDataUrl)}" alt="">` : esc(String(name).trim().charAt(0).toUpperCase() || 'L');
    const periods = [['week', L('۷ روز اخیر', 'Last 7 days', 'Letzte 7 Tage')], ['month', L('یک ماه اخیر', 'Last month', 'Letzter Monat')], ['quarter', L('سه ماه اخیر', 'Last 3 months', 'Letzte 3 Monate')]];

    root.innerHTML = `<header class="hx-top"><div class="hx-id"><div class="hx-avatar">${avatar}</div><div><small>${esc(L('تاریخچه و پیشرفت', 'History & progress', 'Verlauf & Fortschritt'))}</small><h1>${esc(L('سلام', 'Hello', 'Hallo'))}${lang() === 'fa' ? '، ' : ', '}${esc(name)}</h1></div></div>
        <div class="hx-tools"><label class="fld sm hx-period"><span>${esc(L('بازه', 'Period', 'Zeitraum'))}</span><select data-period>${periods.map(([v, l]) => `<option value="${v}" ${f === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label><button type="button" class="btn btn-danger" data-act="clear">${esc(L('پاک‌کردن تاریخچه', 'Clear history', 'Verlauf löschen'))}</button></div></header>
      ${hasPlan ? `<nav class="segmented hx-tabs" role="tablist"><button type="button" role="tab" data-tab="plan" class="${tab === 'plan' ? 'is-on' : ''}">📋 ${esc(L('برنامه یادگیری', 'Learning plan', 'Lernplan'))}<em>${esc(fmtMin(planSecs))}</em></button><button type="button" role="tab" data-tab="free" class="${tab === 'free' ? 'is-on' : ''}">📚 ${esc(L('مطالعه آزاد', 'Free study', 'Freies Lernen'))}<em>${esc(fmtMin(freeSecs))}</em></button></nav>` : ''}
      ${tab === 'plan' ? planTab(data, m, P, split) : freeTab(data, P, split, desk)}`;
  };

  /* ── shared bits ── */
  const perLbl = (P) => (P.f === 'week' ? L('۷ روز گذشته', 'last 7 days', 'letzte 7 Tage') : P.f === 'month' ? L('یک ماه گذشته', 'last month', 'letzter Monat') : L('سه ماه گذشته', 'last 3 months', 'letzte 3 Monate'));
  const todayLn = (sec) => `<em class="hx-d">${esc(L('امروز', 'Today', 'Heute'))}: ${fmtShort((Number(sec) || 0) / 60)}</em>`;
  const tile = (label, value, sub, color, ring) => `<div class="hx-kpi" style="--c:${color}"><span>${esc(label)}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}${ring != null ? `<i class="hx-ring" style="--v:${clamp(ring, 0, 100) * 3.6}deg"><b>${num(ring)}%</b></i>` : ''}</div>`;
  const dlt = (cur, prev, unit, ref) => {
    if (cur == null || prev == null) return '';
    const d = Math.round(cur - prev);
    const r = ref === 'week' ? L('هفته قبل', 'last week', 'Vorwoche') : L('بازه قبل', 'previous period', 'Vorzeitraum');
    if (!d) return `<em class="hx-d">= ${esc(L('مثل', 'same as', 'wie'))} ${esc(r)}</em>`;
    return `<em class="hx-d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${num(Math.abs(d))}${unit || ''} ${esc(L('نسبت به', 'vs.', 'zur'))} ${esc(r)}</em>`;
  };
  const pill = (v) => `<span class="hx-pill ${v == null ? '' : v >= 70 ? 'good' : v >= 50 ? 'mid' : 'low'}">${v == null ? '—' : num(v)}</span>`;
  const emptyBox = (icon, text) => `<div class="hx-empty"><b>${icon}</b><p>${esc(text)}</p></div>`;
  const moreBtn = (shown, total, key) => (total > shown ? `<button type="button" class="btn btn-ghost wide" data-more="${key}">${esc(L('نمایش', 'Show', 'Weitere'))} ${num(Math.min(14, total - shown))} ${esc(L('روز دیگر', 'more days', 'Tage anzeigen'))} ↓</button>` : '');
  const panel = (eyebrow, title, body, extra = '') => `<article class="card hx-panel"><div class="panel-head"><div><p>${esc(eyebrow)}</p><h2>${esc(title)}</h2></div>${extra}</div>${body}</article>`;

  /* ── charts ── */
  function trendSvg(days) {
    const W = 640, H = 230, pl = 44, pr = 14, pt = 16, pb = 20, pw = W - pl - pr, ph = H - pt - pb;
    const xs = (i) => pl + (days.length < 2 ? pw / 2 : (i * pw) / (days.length - 1));
    const ys = (v) => pt + ph - (clamp(v, 0, 100) / 100) * ph;
    const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${pl}" y1="${ys(v)}" x2="${W - pr}" y2="${ys(v)}" class="hx-gridline"/><text x="${pl - 8}" y="${ys(v) + 4}" text-anchor="end" class="hx-axis">${v}%</text>`).join('');
    const lines = S4.map((sk) => {
      const pts = days.map((d, i) => { const v = skillVal(d, sk); return v == null ? null : [xs(i), ys(v), v, d.date]; }).filter(Boolean);
      if (!pts.length) return '';
      const c = MODS[sk].color;
      return `<g>${pts.length > 1 ? `<polyline points="${pts.map((q) => q[0] + ',' + q[1]).join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}${pts.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="4.5" fill="${c}" stroke="#fff" stroke-width="1.6"><title>${MODS[sk].de} · ${q[3]} · ${q[2]}%</title></circle>`).join('')}</g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img">${grid}${lines}</svg>`;
  }
  function weekBarsSvg(weeks, curWeek) {
    const W = 500, H = 290, pl = 38, pr = 6, pt = 26, pb = 40, pw = W - pl - pr, ph = H - pt - pb, n = Math.max(1, weeks.length), gw = pw / n, gap = 4;
    const bw = Math.max(6, Math.min(24, (gw - 22 - gap * 3) / 4));
    const ys = (v) => pt + ph - (clamp(v, 0, 100) / 100) * ph;
    const defs = S4.map((sk) => `<linearGradient id="hxg-${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MODS[sk].color}"/><stop offset="1" stop-color="${MODS[sk].color}" stop-opacity=".35"/></linearGradient>`).join('');
    const grid = [0, 25, 50, 75, 100].map((v) => `<line x1="${pl}" y1="${ys(v)}" x2="${W - pr}" y2="${ys(v)}" class="hx-gridline"/><text x="${pl - 8}" y="${ys(v) + 4}" text-anchor="end" class="hx-axis">${v}%</text>`).join('');
    const groups = weeks.map((wk, i) => {
      const gx = pl + i * gw;
      const x0 = gx + (gw - (bw * 4 + gap * 3)) / 2;
      const bg = wk.week === curWeek ? `<rect x="${gx + 4}" y="${pt - 14}" width="${gw - 8}" height="${ph + 14}" rx="12" class="hx-cur"/>` : '';
      const bars = S4.map((sk, j) => {
        const v = wk[sk];
        const x = x0 + j * (bw + gap);
        if (v == null) return `<rect x="${x}" y="${ys(0) - 3}" width="${bw}" height="3" rx="1.5" class="hx-nobar"/>`;
        const y = ys(v);
        return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(3, pt + ph - y)}" rx="${Math.min(6, bw / 2)}" fill="url(#hxg-${sk})"><title>${MODS[sk].de} · ${esc(wk.label)}: ${v}%</title></rect>${n <= 6 ? `<text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" class="hx-val">${num(v)}</text>` : ''}`;
      }).join('');
      return `<g>${bg}${bars}<text x="${gx + gw / 2}" y="${H - 14}" text-anchor="middle" class="hx-axis">${esc(wk.label)}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img"><defs>${defs}</defs>${grid}${groups}</svg>`;
  }
  function stackSvg(buckets, hasDesk) {
    const W = 680, H = 236, pl = 46, pr = 8, pt = 16, pb = 30, pw = W - pl - pr, ph = H - pt - pb, n = Math.max(1, buckets.length), gw = pw / n, bw = Math.max(4, Math.min(30, gw * 0.62));
    const top = Math.ceil(Math.max(30, ...buckets.map((b) => (b.a + b.b) / 60)) / 30) * 30;
    const ys = (min) => pt + ph - (min / top) * ph;
    const every = Math.ceil(n / 10);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((r) => `<line x1="${pl}" y1="${ys(top * r)}" x2="${W - pr}" y2="${ys(top * r)}" class="hx-gridline"/><text x="${pl - 8}" y="${ys(top * r) + 4}" text-anchor="end" class="hx-axis">${fmtShort(top * r)}</text>`).join('');
    const bars = buckets.map((b, i) => {
      const x = pl + i * gw + (gw - bw) / 2; const am = b.a / 60; const bm = b.b / 60; const ya = ys(am); const yb = ys(am + bm);
      return `<g><title>${esc(b.title)} · ${fmtShort(am + bm)}${hasDesk ? ` (${esc(L('برنامه', 'Plan', 'Plan'))} ${fmtShort(am)} · ${esc(L('میز مطالعه', 'Study desk', 'Lerntisch'))} ${fmtShort(bm)})` : ''}</title>${am > 0 ? `<rect x="${x}" y="${ya}" width="${bw}" height="${Math.max(2, pt + ph - ya)}" rx="${Math.min(5, bw / 2)}" fill="url(#hxs-a)"/>` : ''}${bm > 0 ? `<rect x="${x}" y="${yb}" width="${bw}" height="${Math.max(2, ya - yb)}" rx="${Math.min(5, bw / 2)}" fill="url(#hxs-b)"/>` : ''}${i % every === 0 ? `<text x="${x + bw / 2}" y="${H - 9}" text-anchor="middle" class="hx-axis">${esc(b.label)}</text>` : ''}</g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img"><defs><linearGradient id="hxs-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9" stop-opacity=".75"/></linearGradient><linearGradient id="hxs-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#0891b2" stop-opacity=".8"/></linearGradient></defs>${grid}${bars}</svg>`;
  }

  /* ── tab «برنامه یادگیری» ── */
  function planTab(data, m, P, split) {
    const daysObj = m.days || {};
    const all = Object.values(daysObj);
    const has = (d) => Object.keys(d.results || {}).length || Object.keys(d.work || {}).length;
    const days = all.filter((d) => P.inP(d.date) && has(d)).sort((a, b) => b.date.localeCompare(a.date));
    const prev = all.filter((d) => P.inPrev(d.date) && has(d));
    const resSecs = (d) => Object.values(d.results || {}).reduce((a, r) => a + (Number(r.seconds) || 0), 0);
    const dayTime = (d) => Math.max(split.planTime[d.date] || 0, resSecs(d));
    const modsDone = (d) => Object.keys(d.results || {}).filter((x) => x !== 'extra').length;
    const total = days.reduce((a, d) => a + dayTime(d), 0);
    const prevTotal = prev.reduce((a, d) => a + dayTime(d), 0);
    const done = days.reduce((a, d) => a + modsDone(d), 0);
    const planned = days.length * 6;
    const rate = planned ? Math.round((done / planned) * 100) : 0;
    const skAvg = (list) => S4.map((sk) => avgOf(list.map((d) => skillVal(d, sk)).filter((x) => x != null)));
    const cur = skAvg(days);
    const before = skAvg(prev);
    const overall = avgOf(cur.filter((x) => x != null));
    const overallPrev = avgOf(before.filter((x) => x != null));
    const srs = Object.values(m.srs || {});
    const words = srs.filter((x) => x.type === 'wort').length;
    const due = srs.filter((x) => x.due <= today()).length;
    let streak = 0;
    let k0 = today();
    if (!(daysObj[k0] && modsDone(daysObj[k0]))) k0 = addDays(k0, -1);
    while (daysObj[k0] && modsDone(daysObj[k0]) && streak < 999) { streak += 1; k0 = addDays(k0, -1); }

    const kpis = `<div class="hx-kpis">${tile(L('زمان مطالعه برنامه', 'Plan study time', 'Lernzeit im Plan') + ' · ' + perLbl(P), fmtMin(total), todayLn(daysObj[today()] ? dayTime(daysObj[today()]) : split.planTime[today()] || 0) + dlt(total / 60, prev.length ? prevTotal / 60 : null, L(' دقیقه', ' min', ' Min.')), '#38bdf8')}
      ${tile(L('ماژول‌های انجام‌شده', 'Modules done', 'Erledigte Module'), `${num(done)}<small> / ${num(planned)}</small>`, esc(L(`${num(days.length)} روز برنامه`, `${days.length} program days`, `${days.length} Plan-Tage`)), '#6366f1', rate)}
      ${tile(L('میانگین چهار مهارت', 'Average of the four skills', 'Schnitt der vier Teile'), overall == null ? '—' : num(overall) + '%', dlt(overall, overallPrev, '٪'), '#22c55e')}
      ${tile(L('روزهای پیاپی', 'Streak', 'Serie'), `${num(streak)} 🔥`, esc(L('روز پشت‌سرهم با ماژول انجام‌شده', 'days in a row', 'Tage in Folge')), '#f97316')}
      <button type="button" class="hx-kpi is-link" style="--c:${MODS.wortschatz.color}" data-act="deck"><span>${esc(L('دفتر عبارات برنامه', 'Plan vocabulary', 'Plan-Wortschatz'))}</span><b>${num(words)} <small>+ ${num(srs.length - words)}</small></b><small>${esc(due ? L(`${num(due)} مورد برای مرور امروز ←`, `${due} due today →`, `${due} heute fällig →`) : L('مرور امروز انجام شده ✓', 'Nothing due today ✓', 'Heute nichts fällig ✓'))}</small></button></div>`;

    const chartDays = days.slice().reverse().filter((d) => S4.some((sk) => skillVal(d, sk) != null));
    const legend = (vals, prevVals, ref) => `<div class="hx-legend">${S4.map((sk, n) => `<div><i style="background:${MODS[sk].color}"></i><span dir="ltr">${MODS[sk].de}</span><b>${vals[n] == null ? '—' : num(vals[n]) + '%'}</b>${prevVals ? dlt(vals[n], prevVals[n], '٪', ref) : ''}</div>`).join('')}</div>`;
    const panelScores = panel(L('نمره مهارت‌ها', 'Results', 'Ergebnisse'), L('روند نمره چهار مهارت', 'Trend of the four skills', 'Verlauf der vier Fertigkeiten'),
      `<div class="hx-chart" dir="ltr">${chartDays.length ? trendSvg(chartDays) : emptyBox('📈', L('در این بازه هنوز نتیجه‌ای از ماژول‌های Hören، Lesen، Schreiben و Sprechen ثبت نشده است.', 'No results in this period yet.', 'Noch keine Ergebnisse in diesem Zeitraum.'))}</div>
      ${chartDays.length ? `<div class="hx-xlabels" dir="ltr">${chartDays.map((d) => `<span>${esc(fmtDay(d.date, 'short'))}</span>`).join('')}</div>` : ''}${legend(cur, before)}`);

    // weekly bars (site weekMetrics over the plan calendar)
    const start = m.startDate || today();
    let first = satOf(start);
    if (wdOf(start) === 5) first = addDays(first, 7);
    const weekOf = (k) => { const d = diffDays(first, k); return d < 0 ? 0 : Math.floor(d / 7) + 1; };
    const weekRange = (week) => (week <= 0 ? [satOf(start), addDays(satOf(start), 6)] : [addDays(first, (week - 1) * 7), addDays(first, (week - 1) * 7 + 6)]);
    const weekMetrics = (week) => {
      const [a, b] = weekRange(week);
      const wd = all.filter((d) => d.date >= a && d.date <= b);
      const pick = (mod, field) => wd.map((d) => d.results?.[mod]?.[field]).filter((x) => x != null).map(Number);
      const evalDay = wd.find((d) => d.mode === 'eval');
      const ev = (mod, fld) => { const v = evalDay?.results?.[mod]?.[fld]; return v == null ? null : Number(v); };
      return { week, days: wd.length, hoeren: ev('hoeren', 'pct') ?? avgOf(pick('hoeren', 'pct')), lesen: ev('lesen', 'pct') ?? avgOf(pick('lesen', 'pct')), schreiben: ev('schreiben', 'score') ?? avgOf(pick('schreiben', 'score')), sprechen: ev('sprechen', 'score') ?? avgOf(pick('sprechen', 'score')) };
    };
    const wkNow = weekOf(today());
    const weeks = [];
    for (let n = Math.max(0, wkNow); n >= 0 && weeks.length < 8; n -= 1) {
      const x = weekMetrics(n);
      if (x.days) weeks.push(Object.assign(x, { label: n === 0 ? L('تشخیص', 'Diagnosis', 'Diagnose') : L('هفته ', 'W', 'W') + num(n) }));
    }
    weeks.reverse();
    const thisW = weeks.find((x) => x.week === wkNow);
    const lastW = weeks.find((x) => x.week === wkNow - 1);
    const panelWeeks = panel(L('روند هفتگی', 'Weekly trend', 'Wochentrend'), L('پیشرفت هفته به هفته', 'Week by week', 'Woche für Woche'),
      `<p class="muted small">${esc(L('میانگین هر مهارت در هر هفته؛ هفته جاری با کادر مشخص شده است.', 'Average per skill and week; the current week is highlighted.', 'Schnitt pro Fertigkeit und Woche; die aktuelle Woche ist markiert.'))}</p>
      <div class="hx-chart" dir="ltr">${weeks.length ? weekBarsSvg(weeks, wkNow) : emptyBox('🗓', L('بعد از اولین روز برنامه، روند هفتگی اینجا نمایش داده می‌شود.', 'The weekly trend appears after the first plan day.', 'Nach dem ersten Plan-Tag erscheint hier der Wochentrend.'))}</div>
      ${weeks.length ? `<div class="hx-legend">${S4.map((sk) => `<div><i style="background:${MODS[sk].color}"></i><span dir="ltr">${MODS[sk].de}</span><b>${thisW?.[sk] == null ? '—' : num(thisW[sk]) + '%'}</b>${lastW ? dlt(thisW?.[sk], lastW[sk], '٪', 'week') : ''}</div>`).join('')}</div>` : ''}`);

    // plan days
    const shown = Math.max(7, ui.planShow);
    const chips = (d) => {
      const r = d.results || {};
      const out = [];
      const pc = (v) => (v == null ? '✓' : num(v) + '%');
      const sc = (v) => (v == null ? '✓' : num(v));
      if (r.hoeren) out.push(['hoeren', `Hören ${pc(r.hoeren.pct)}`]);
      if (r.lesen) out.push(['lesen', `Lesen ${pc(r.lesen.pct)}`]);
      if (r.schreiben) out.push(['schreiben', `Schreiben ${sc(r.schreiben.score)}${r.schreiben.words ? ' · ' + num(r.schreiben.words) + ' W.' : ''}`]);
      if (r.sprechen) out.push(['sprechen', `Sprechen ${sc(r.sprechen.score)}${r.sprechen.recordings ? ' · ' + num(r.sprechen.recordings) + ' 🎙' : ''}`]);
      if (r.wortschatz) out.push(['wortschatz', `Wortschatz ${num(r.wortschatz.words || 0)} W.`]);
      if (r.wiederholung) out.push(['wiederholung', `Wiederholung ${r.wiederholung.quiz != null ? num(r.wiederholung.quiz) + '%' : '✓'}`]);
      if (r.fehleranalyse) out.push(['fehleranalyse', 'Fehleranalyse ✓']);
      if (r.wochenbericht) out.push(['wochenbericht', `Wochenbericht ${r.wochenbericht.saved ? '✓' : '—'}`]);
      if (r.extra) out.push(['extra', r.extra.sentences != null ? `Extra ${num(r.extra.minutes || 0)}′ · ${num(r.extra.sentences)} ✍` : `Extra ${num(r.extra.minutes || 0)}′ · ${num(r.extra.cards || 0)} 🗂`]);
      return out.map(([id, txt]) => `<span class="hx-chip" style="--c:${MODS[id]?.color || '#64748b'}" dir="ltr">${esc(txt)}</span>`).join('');
    };
    const dayRows = days.slice(0, shown).map((d) => {
      const names = DAY_NAMES[wdOf(d.date)] || ['', '', ''];
      const key = 'p:' + d.date;
      const open = ui.openDay === key;
      const r = d.results || {};
      const dayAvg = avgOf(S4.map((sk) => skillVal(d, sk)).filter((x) => x != null));
      const wip = Object.keys(d.work || {}).filter((id) => !r[id] && MODS[id]);
      const detail = open ? `<div class="hx-day-detail">${ctx.ownerFiles ? ownerDayFileInlineBlock(ctx.ownerFiles, d.date, ui.fileOpen, data.history) : ''}<div class="hx-det">${Object.entries(r).map(([id, x]) => `<div style="--c:${MODS[id]?.color || '#64748b'}"><b dir="ltr">${esc(MODS[id]?.de || id)}</b><span>${x.pct != null ? num(x.pct) + '% · ' : x.score != null ? num(x.score) + '% · ' : ''}${fmtShort((Number(x.seconds) || 0) / 60)}${x.words ? ' · ' + num(x.words) + esc(L(' کلمه', ' words', ' W.')) : ''}${x.recordings ? ' · ' + num(x.recordings) + ' 🎙' : ''}</span></div>`).join('')}${wip.map((id) => `<div style="--c:${MODS[id].color}" class="is-wip"><b dir="ltr">${esc(MODS[id].de)}</b><span>${esc(L('شروع شده، تمام نشده', 'started', 'begonnen'))}</span></div>`).join('')}</div>${chips(d) ? `<div class="hx-chips">${chips(d)}</div>` : ''}</div>` : '';
      const mode = d.mode === 'exam' ? ' · ' + L('آزمون', 'Exam', 'Prüfung') : d.mode === 'eval' ? ' · ' + L('ارزیابی', 'Evaluation', 'Bewertung') : '';
      return `<div class="hx-day ${open ? 'is-open' : ''}"><button type="button" class="hx-day-main" data-day="${key}" aria-expanded="${open}"><span class="hx-day-date"><b>${esc(fmtDay(d.date, 'long'))}</b><small>${esc(L(names[0], names[2], names[1]))}${esc(mode)} · ${num(modsDone(d))}/${num(6)} ${esc(L('ماژول', 'modules', 'Module'))}</small></span><span class="hx-day-time">${fmtShort(dayTime(d) / 60)}</span>${pill(dayAvg)}<span class="hx-chev">⌄</span></button>${ctx.ownerFiles ? ownerDayFileButton(ctx.ownerFiles, d.date, ui.fileOpen) : ''}${detail}</div>`;
    }).join('');
    const panelDays = panel(L('روزهای برنامه', 'Plan days', 'Plan-Tage'), L('کارنامه روزانه', 'Daily report', 'Tagesübersicht'),
      days.length ? `<div class="hx-days">${dayRows}</div>${moreBtn(shown, days.length, 'planShow')}` : emptyBox('📋', L('در این بازه روز برنامه‌ای ثبت نشده است.', 'No program days in this period.', 'Keine Plan-Tage in diesem Zeitraum.')),
      `<small class="muted">${esc(L('برای جزئیات روی هر روز بزنید', 'Click a day for details', 'Tippen für Details'))}</small>`);

    const reports = Object.values(m.weekly || {}).sort((a, b) => b.week - a.week);
    const panelReports = panel(L('گزارش‌ها', 'Reports', 'Berichte'), L('گزارش‌های هفتگی', 'Weekly reports', 'Wochenberichte'),
      reports.length ? `<div class="hx-days">${reports.map((r) => `<details class="hx-day hx-rep"><summary class="hx-day-main"><span class="hx-day-date"><b>${esc(r.week === 0 ? L('روز تشخیص', 'Diagnosis day', 'Diagnose') : L('هفته ', 'Week ', 'Woche ') + num(r.week))}</b><small dir="ltr">H ${fmtPct(r.metrics?.hoeren)} · L ${fmtPct(r.metrics?.lesen)} · S ${fmtPct(r.metrics?.schreiben)} · Sp ${fmtPct(r.metrics?.sprechen)}</small></span><span class="hx-chev">⌄</span></summary>
        <div class="hx-day-detail hx-rep-body" dir="rtl"><p><b>سه اشتباه پرتکرار:</b> ${esc((r.frequent || []).join(' · ') || '—')}</p><p><b>سه ضعف اصلی:</b> ${esc((r.weak || []).join(' · ') || '—')}</p><p><b>هدف هفته آینده:</b> ${esc(r.goal || '—')}</p><p><b>معیار موفقیت:</b> ${esc(r.success || '—')}</p>${(r.plan || []).length ? `<p><b>برنامه پیشنهادی:</b></p><ol>${r.plan.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}${r.progress ? `<p class="muted">${esc(r.progress)}</p>` : ''}</div></details>`).join('')}</div>`
        : emptyBox('🗒', L('اولین گزارش هفتگی روز جمعه ثبت می‌شود.', 'The first weekly report is made on Friday.', 'Der erste Wochenbericht entsteht am Freitag.')));

    return `${kpis}<div class="hx-grid2"><div class="hx-stack">${panelScores}${panelDays}</div><div class="hx-stack">${panelWeeks}${panelReports}</div></div>`;
  }

  /* ── tab «مطالعه آزاد» ── */
  function freeTab(data, P, split, desk) {
    const byDate = {};
    split.free.forEach((d) => { byDate[d.date] = d; });
    const dates = new Set(split.free.map((d) => d.date).filter(P.inP));
    Object.keys(desk).forEach((k) => { if (P.inP(k) && Number(desk[k]) >= 60) dates.add(k); });
    const rows = [...dates].sort().reverse().map((k) => {
      const d = byDate[k] || {};
      return { date: k, plan: Number(d.time) || 0, desk: Number(desk[k]) || 0, acts: Number(d.acts) || 0, comp: Number(d.comp) || 0, score: d.score ?? null, topic: d.topic || '', times: d.activityTimes || {}, scores: d.skillScores || {} };
    }).filter((r) => r.acts > 0 || r.plan >= 60 || r.desk >= 60);
    const sum = (arr, fn) => arr.reduce((a, x) => a + fn(x), 0);
    const total = sum(rows, (r) => r.plan + r.desk);
    const deskTotal = sum(rows, (r) => r.desk);
    const comp = sum(rows, (r) => r.comp);
    const acts = sum(rows, (r) => r.acts);
    const avgScore = avgOf(rows.map((r) => r.score).filter((x) => x != null));
    const prevRows = split.free.filter((d) => P.inPrev(d.date));
    const prevAvg = avgOf(prevRows.map((d) => d.score).filter((x) => x != null));
    const prevTotal = sum(prevRows, (d) => Number(d.time) || 0) + Object.entries(desk).filter(([k]) => P.inPrev(k)).reduce((a, [, v]) => a + (Number(v) || 0), 0);
    const rate = acts ? Math.round((comp / acts) * 100) : null;
    const kpis = `<div class="hx-kpis k4">${tile(L('زمان مطالعه', 'Study time', 'Lernzeit') + ' · ' + perLbl(P), fmtMin(total), todayLn((Number(byDate[today()]?.time) || 0) + (Number(desk[today()]) || 0)) + dlt(total / 60, prevTotal ? prevTotal / 60 : null, L(' دقیقه', ' min', ' Min.')), '#a78bfa')}
      ${tile(L('روزهای مطالعه', 'Study days', 'Lerntage'), `${num(rows.length)}<small> / ${num(P.len)}</small>`, deskTotal ? esc(L(`میز مطالعه: ${fmtShort(deskTotal / 60)}`, `Study desk: ${fmtShort(deskTotal / 60)}`, `Lerntisch: ${fmtShort(deskTotal / 60)}`)) : '', '#22d3ee')}
      ${tile(L('فعالیت‌های انجام‌شده', 'Activities done', 'Erledigte Aktivitäten'), `${num(comp)}<small> / ${num(acts)}</small>`, '', '#f472b6', rate)}
      ${tile(L('میانگین نمره', 'Average score', 'Durchschnitt'), avgScore == null ? '—' : num(avgScore) + '%', dlt(avgScore, prevAvg, '٪'), '#34d399')}</div>`;

    const buckets = [];
    const byDay = (k) => rows.find((x) => x.date === k) || { plan: 0, desk: 0 };
    if (P.len <= 35) {
      for (let k = P.from; k <= P.to; k = addDays(k, 1)) { const r = byDay(k); buckets.push({ label: fmtDay(k, 'short'), title: fmtDay(k, 'long'), a: r.plan, b: r.desk }); }
    } else {
      for (let k = P.from; k <= P.to; k = addDays(k, 7)) {
        let a = 0; let b = 0;
        for (let i = 0; i < 7; i += 1) { const kk = addDays(k, i); if (kk > P.to) break; const r = byDay(kk); a += r.plan; b += r.desk; }
        buckets.push({ label: fmtDay(k, 'short'), title: L('هفته از ', 'Week from ', 'Woche ab ') + fmtDay(k, 'long'), a, b });
      }
    }
    const hasDesk = deskTotal > 0 || Object.keys(desk).length > 0;
    const panelTime = panel(L('زمان مطالعه', 'Study time', 'Lernzeit'), P.len <= 35 ? L('زمان مطالعه روزانه', 'Study time per day', 'Lernzeit pro Tag') : L('زمان مطالعه هفتگی', 'Study time per week', 'Lernzeit pro Woche'),
      `<div class="hx-chart" dir="ltr">${total ? stackSvg(buckets, hasDesk) : emptyBox('⏱', L('در این بازه زمان مطالعه‌ای ثبت نشده است.', 'No study time in this period.', 'Keine Lernzeit in diesem Zeitraum.'))}</div>
      ${total ? `<div class="hx-legend"><div><i style="background:#8b5cf6"></i><span>${esc(L('برنامه مطالعه آزاد', 'Free study plan', 'Freies Lernprogramm'))}</span><b>${fmtShort((total - deskTotal) / 60)}</b></div>${hasDesk ? `<div><i style="background:#22d3ee"></i><span>${esc(L('میز مطالعه (تایمر)', 'Study desk (timer)', 'Lerntisch (Timer)'))}</span><b>${fmtShort(deskTotal / 60)}</b></div>` : ''}</div>` : ''}`,
      `<div class="hx-avgpill"><small>${esc(L('میانگین روزانه', 'Daily average', 'Ø pro Tag'))}</small><b>${fmtShort(total / 60 / P.len)}</b></div>`);

    // skills: time share + score + weekly goal
    const sTime = {}; const sScore = {}; const sN = {}; const w7 = {}; const w7from = addDays(today(), -6);
    rows.forEach((r) => {
      Object.entries(r.times).forEach(([id, v]) => { const k = historySkillId(id); sTime[k] = (sTime[k] || 0) + (Number(v) || 0); });
      Object.entries(r.scores).forEach(([id, v]) => { if (id === 'gesamt' || v == null || !Number.isFinite(Number(v))) return; const k = historySkillId(id); sScore[k] = (sScore[k] || 0) + Number(v); sN[k] = (sN[k] || 0) + 1; });
    });
    split.free.filter((d) => d.date >= w7from).forEach((d) => Object.entries(d.activityTimes || {}).forEach(([id, v]) => { const k = historySkillId(id); w7[k] = (w7[k] || 0) + (Number(v) || 0); }));
    const keys = [...new Set([...GOAL_KEYS, ...Object.keys(sTime).filter((k) => sTime[k] > 0)])].sort((a, b) => (sTime[b] || 0) - (sTime[a] || 0));
    const sTotal = Object.values(sTime).reduce((a, v) => a + v, 0) || 0;
    const color = (i) => PALETTE[i % PALETTE.length];
    let ang = 0;
    const stops = keys.filter((k) => sTime[k] > 0).map((k) => { const i = keys.indexOf(k); const s0 = ang; ang += (sTime[k] / sTotal) * 360; return `${color(i)} ${s0}deg ${ang}deg`; }).join(',') || 'var(--surface-3) 0deg 360deg';
    const targets = data.skillTargets || {};
    const skillRows = keys.map((k, i) => {
      const t = sTime[k] || 0;
      const share = sTotal ? Math.round((t / sTotal) * 100) : 0;
      const sc = sN[k] ? Math.round(sScore[k] / sN[k]) : null;
      const isGoal = GOAL_KEYS.includes(k);
      const target = Number(targets[k] || 15);
      const wk = Math.round((w7[k] || 0) / 60);
      const gp = Math.min(100, Math.round((wk / target) * 100) || 0);
      const opts = [...new Set([5, 10, 15, 20, 30, 45, 60, 90, 120, target])].sort((a, b) => a - b).map((v) => `<option value="${v}" ${v === target ? 'selected' : ''}>${num(v)}</option>`).join('');
      return `<div class="hx-skill"><b><i style="background:${color(i)}"></i>${esc(activityLabel(k))}</b><span class="hx-st">${fmtShort(t / 60)}<small>${num(share)}% ${esc(L('از کل', 'share', 'Anteil'))}</small></span><span class="hx-ss">${sc == null ? '—' : num(sc) + '%'}</span>${isGoal ? `<div class="hx-goal"><span class="hx-bar"><em style="width:${gp}%;background:${gp >= 100 ? '#34d399' : color(i)}"></em></span><label>${num(wk)} / <select data-target="${k}" aria-label="${esc(L('هدف هفتگی ', 'Weekly goal ', 'Wochenziel ') + activityLabel(k))}">${opts}</select> ${esc(L('دقیقه در هفته', 'min/week', 'Min./Woche'))}${gp >= 100 ? ' ✓' : ''}</label></div>` : `<span class="muted small">${esc(L('بدون هدف هفتگی', 'no weekly goal', 'ohne Wochenziel'))}</span>`}</div>`;
    }).join('');
    const panelSkills = panel(L('مهارت‌ها', 'Skills', 'Fertigkeiten'), L('زمان، نمره و هدف هر مهارت', 'Time, score and goal per skill', 'Zeit, Ergebnis und Ziel je Fertigkeit'),
      `<div class="hx-donutwrap"><div class="hx-donut" style="background:conic-gradient(${stops})"><div><b>${num(Math.round(sTotal / 60))}</b><span>${esc(L('دقیقه', 'min', 'Min.'))}</span></div></div><p class="muted small">${esc(L('سهم هر مهارت از زمان مطالعه این بازه و میانگین نمره آن. هدف هفتگی هر مهارت را از فهرست کنار آن انتخاب کنید.', 'Each skill’s share of the study time and its average score. Pick a weekly goal for each skill.', 'Anteil an der Lernzeit, Durchschnitt und Wochenziel (letzte 7 Tage).'))}</p></div>
      <div class="hx-skillhead"><span>${esc(L('مهارت', 'Skill', 'Fertigkeit'))}</span><span>${esc(L('زمان و سهم', 'Time · share', 'Zeit · Anteil'))}</span><span>${esc(L('نمره', 'Score', 'Ergebnis'))}</span><span>${esc(L('هدف هفتگی (۷ روز اخیر)', 'Weekly goal (7 days)', 'Wochenziel (7 Tage)'))}</span></div><div class="hx-skills">${skillRows}</div>`);

    const shown = Math.max(7, ui.freeShow);
    const dayRows = rows.slice(0, shown).map((r) => {
      const key = 'f:' + r.date;
      const open = ui.openDay === key;
      const det = open ? `<div class="hx-day-detail"><div class="hx-det">${Object.entries(r.times).filter(([, v]) => Number(v) > 0).map(([id, v], i) => { const k = historySkillId(id); const sc = r.scores[id] ?? r.scores[k]; return `<div style="--c:${color(keys.indexOf(k) >= 0 ? keys.indexOf(k) : i)}"><b>${esc(activityLabel(id))}</b><span>${fmtShort((Number(v) || 0) / 60)}${sc != null && Number.isFinite(Number(sc)) ? ' · ' + num(sc) + '%' : ''}</span></div>`; }).join('')}${r.desk ? `<div style="--c:#22d3ee"><b>${esc(L('میز مطالعه (تایمر)', 'Study desk (timer)', 'Lerntisch (Timer)'))}</b><span>${fmtShort(r.desk / 60)}</span></div>` : ''}</div></div>` : '';
      const sub = r.acts ? `${num(r.comp)}/${num(r.acts)} ${L('فعالیت', 'activities', 'Aktivitäten')}` : r.desk ? L('فقط میز مطالعه', 'study desk only', 'nur Lerntisch') : L('بدون فعالیت ثبت‌شده', 'no activity', 'keine Aktivität');
      return `<div class="hx-day ${open ? 'is-open' : ''}"><button type="button" class="hx-day-main" data-day="${key}" aria-expanded="${open}"><span class="hx-day-date"><b>${esc(fmtDay(r.date, 'long'))}</b><small>${esc(sub)}${r.topic ? ' · ' + esc(r.topic) : ''}</small></span><span class="hx-day-time">${fmtShort((r.plan + r.desk) / 60)}${r.desk && r.plan ? `<small>⏱ ${fmtShort(r.desk / 60)}</small>` : ''}</span>${pill(r.score)}<span class="hx-chev">⌄</span></button>${det}</div>`;
    }).join('');
    const panelDays = panel(L('روزها', 'Days', 'Tage'), L('کارنامه روزانه', 'Daily report', 'Tagesübersicht'),
      rows.length ? `<div class="hx-days">${dayRows}</div>${moreBtn(shown, rows.length, 'freeShow')}` : emptyBox('📚', L('در این بازه مطالعه آزادی ثبت نشده است.', 'No free study in this period.', 'Kein freies Lernen in diesem Zeitraum.')),
      `<small class="muted">${esc(L('برنامه آزاد و میز مطالعه در یک جدول', 'Free plan and study desk together', 'Lernprogramm und Lerntisch zusammen'))}</small>`);
    return `${kpis}<div class="hx-grid2"><div class="hx-stack">${panelTime}${panelDays}</div><div class="hx-stack">${panelSkills}</div></div>`;
  }

  /* ── actions ── */
  root.addEventListener('click', async (event) => {
    const el = event.target.closest('button');
    if (!el) return;
    const d = el.dataset;
    if (d.tab) { ui.tab = d.tab; ui.openDay = null; draw(); }
    else if (d.day) { ui.openDay = ui.openDay === d.day ? null : d.day; draw(); }
    else if (d.dayfile && ctx.ownerFiles?.isOwner()) {
      // site ownerToggleDayFile: (re)capture the day, then open / close its file
      ctx.ownerFiles.capture(d.dayfile);
      const wasOpen = ui.fileOpen === d.dayfile; ui.fileOpen = wasOpen ? null : d.dayfile; if (!wasOpen) ui.openDay = 'p:' + d.dayfile; draw();
    } else if (d.dayfileDel && ctx.ownerFiles?.isOwner()) {
      const msg = L(`فایل روز «${d.dayfileDel}» حذف شود؟ این کار فقط فایل بازنگری را پاک می‌کند و روی تاریخچه، آمار و تمرین‌های آن روز اثری ندارد.`, `Delete the day file for ${d.dayfileDel}? Only the review file is removed; history and exercises stay untouched.`, `Tagesdatei für ${d.dayfileDel} löschen? Nur die Prüfdatei wird entfernt; Verlauf und Übungen bleiben.`);
      if (await confirmDialog(msg)) { ctx.ownerFiles.remove(d.dayfileDel); draw(); }
    }
    else if (d.more) { ui[d.more] = Math.max(7, ui[d.more]) + 14; draw(); }
    else if (d.act === 'deck') ctx.navigate('errorbook');
    else if (d.act === 'clear') {
      const ok = await confirmDialog(L('تمام تاریخچه یادگیری، زمان‌های ثبت‌شده، عملکرد پاسخ‌ها و آمار محتوای تمرین‌شده پاک شود؟ این عملیات قابل بازگشت نیست.', 'Delete all learning history, tracked time, answer performance and practised-content statistics? This cannot be undone.', 'Gesamten Lernverlauf, Lernzeiten, Antwortleistungen und Inhaltsfortschritt löschen? Dies kann nicht rückgängig gemacht werden.'));
      if (!ok) return;
      ctx.store.set('history', []);
      ctx.store.set('activityTimers', {});
      ctx.store.set('answerPerformance', []);
      ctx.store.set('wordProgress', {});
      ctx.store.flush();
    }
  });
  root.addEventListener('change', (event) => {
    const el = event.target;
    if (el.dataset.period !== undefined) {
      ui.planShow = 7;
      ui.freeShow = 7;
      ctx.store.set('historyFilter', el.value);
    } else if (el.dataset.target) {
      mutate(ctx.store, 'skillTargets', {}, (t) => { t[el.dataset.target] = parseInt(el.value, 10) || 0; return t; });
    } else return;
    el.blur();
    draw();
  });

  draw();
  root.onStoreChange = (paths) => {
    if (!paths.some((p) => ['*', 'history', 'testdafMethod', 'oesdMethod', 'historyFilter', 'skillTargets', 'appSettings', 'appSettings.freeStudy', 'user', 'uiLanguage'].includes(p) || p.startsWith('appSettings.freeStudy'))) return;
    if (document.activeElement && root.contains(document.activeElement) && document.activeElement.tagName === 'SELECT') return;
    draw();
  };
  return root;
}
