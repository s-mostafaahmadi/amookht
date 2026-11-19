// «علاقه‌مندی‌ها» — the site's favourites page: 1–3 star cards, star and kind filters,
// search, personal cards (add / edit / delete), quick × delete. Same data (state.favorites).

import { esc, svg, ICONS } from '../core/ui.js';
import { st } from '../core/site-text.js';
import { L, num, mutate, normalizeFavorite, favoritesOf, favoriteKindMeta, favoriteTopic, planName, deleteFavoriteStore } from '../core/learning.js';
import { starsHtml, handleStarClick, confirmDialog, chip } from './widgets.js';

const ui = { filter: 'all', search: '', formOpen: false, editId: '' };

export function renderFavorites(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page favs';
  const favCache = new Map();

  const card = (item) => {
    const meta = favoriteKindMeta(item.kind);
    const search = [item.title, item.subtitle, item.answer, item.topic, item.explanation, item.context, meta.label].join(' ').toLocaleLowerCase();
    const more = item.explanation || item.context || item.manual;
    return `<article class="fav-card vc" data-search-text="${esc(search)}" style="--fc:${meta.color}">
      <div class="fav-top"><span class="fav-kind"><i>${esc(meta.short)}</i>${esc(meta.label)}</span>${starsHtml(ctx.store.data, item, favCache)}<button type="button" class="qdel" data-del="${esc(item.id)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}" aria-label="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button></div>
      <div class="fav-main"><small>${esc(planName(item.topic))}</small><h2 dir="auto">${esc(item.title)}</h2>${item.subtitle ? `<p class="muted" dir="auto">${esc(item.subtitle)}</p>` : ''}${item.answer ? `<p class="fav-answer" dir="auto">${esc(item.answer)}</p>` : ''}
        ${more ? `<details class="fav-more"><summary>${esc(L('بیشتر', 'More', 'Mehr'))}</summary>${item.explanation ? `<p dir="auto">${esc(item.explanation)}</p>` : ''}${item.context ? `<p class="fav-context" dir="auto">${esc(item.context)}</p>` : ''}${item.manual ? `<div class="row-actions"><button type="button" class="btn" data-edit="${esc(item.id)}">${esc(st('common.edit'))}</button><button type="button" class="btn btn-danger" data-manual-del="${esc(item.id)}">${esc(st('common.delete'))}</button></div>` : ''}</details>` : ''}</div>
    </article>`;
  };

  const form = (data) => {
    const old = favoritesOf(data).find((x) => x.id === ui.editId) || {};
    const v = (k) => esc(old[k] || '');
    const opt = (value, label) => `<option value="${value}" ${old.kind === value ? 'selected' : ''}>${esc(label)}</option>`;
    return `<div class="nmodal" data-nmodal="fav" role="dialog" aria-modal="true"><section class="card fav-editor nmodal-card"><div class="panel-head"><div><p>${esc(L('کارت شخصی', 'PERSONAL CARD', 'EIGENE KARTE'))}</p><h2>${esc(ui.editId ? L('ویرایش کارت', 'Edit card', 'Karte bearbeiten') : L('افزودن کارت شخصی', 'Add a personal card', 'Eigene Karte hinzufügen'))}</h2></div><button type="button" class="icon-btn" data-act="close" aria-label="${esc(st('common.close'))}">×</button></div>
      <form id="favForm"><div class="form-grid">
        <label class="fld"><span>${esc(L('نوع', 'Type', 'Typ'))}</span><select id="fKind">${opt('vocabulary', st('skill.vocabulary'))}${opt('structure', L('ساختار و عبارت', 'Structure / phrase', 'Struktur / Ausdruck'))}${opt('grammar', st('skill.grammar'))}${opt('other', st('skill.other'))}</select></label>
        <label class="fld grow"><span>${esc(L('موضوع یا مجموعه', 'Topic / collection', 'Thema / Sammlung'))}</span><input id="fTopic" maxlength="240" value="${v('topic')}" placeholder="${esc(L('مثلاً سفر، دانشگاه...', 'e.g. Travel, University...', 'z. B. Reisen, Universität...'))}" /></label>
        <label class="fld full"><span>${esc(L('واژه، ساختار یا پرسش', 'Word, structure or prompt', 'Wort, Struktur oder Frage'))} *</span><input id="fTitle" required maxlength="900" dir="auto" value="${v('title')}" placeholder="z. B. in Betracht ziehen" /></label>
        <label class="fld full"><span>${esc(L('معنی یا پاسخ', 'Meaning or answer', 'Bedeutung oder Antwort'))} *</span><input id="fAnswer" required maxlength="1800" dir="auto" value="${v('answer')}" /></label>
        <label class="fld grow"><span>${esc(L('برچسب کوتاه', 'Short label', 'Kurzbezeichnung'))}</span><input id="fSubtitle" maxlength="500" value="${v('subtitle')}" placeholder="" /></label>
        <label class="fld sm"><span>${esc(L('اهمیت', 'Priority', 'Priorität'))}</span><select id="fRating">${[1, 2, 3].map((n) => `<option value="${n}" ${Number(old.rating || 1) === n ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}</select></label>
        <label class="fld full"><span>${esc(L('توضیح یا نکته', 'Explanation or note', 'Erklärung oder Notiz'))}</span><textarea id="fExplanation" maxlength="1800" rows="2" dir="auto">${v('explanation')}</textarea></label>
        <label class="fld full"><span>${esc(L('جمله نمونه یا متن مرتبط', 'Example or context', 'Beispiel oder Kontext'))}</span><textarea id="fContext" maxlength="3200" rows="2" dir="auto">${v('context')}</textarea></label>
      </div><div class="row-actions end"><button type="button" class="btn" data-act="close">${esc(st('common.cancel'))}</button><button type="submit" class="btn btn-primary">${esc(st('common.save'))}</button></div></form></section></div>`;
  };

  const draw = () => {
    favCache.clear();
    const data = ctx.store.data;
    const items = favoritesOf(data).map((x) => normalizeFavorite(x, data));
    const counts = {};
    const stars = { 1: 0, 2: 0, 3: 0 };
    items.forEach((item) => {
      counts[item.kind] = (counts[item.kind] || 0) + 1;
      stars[item.rating] = (stars[item.rating] || 0) + 1;
    });
    const f = ui.filter;
    const visible = items.filter((item) => f === 'all' || (f.startsWith('star-') ? item.rating === Number(f.slice(5)) : item.kind === f));
    const kinds = [...new Set(items.map((item) => item.kind))];
    const starLabel = (n) => L(`${n} ستاره`, `${n} star${n > 1 ? 's' : ''}`, `${n} Stern${n > 1 ? 'e' : ''}`);
    root.innerHTML = `<header class="page-hero fav-hero"><div class="page-hero-main"><span class="page-hero-icon">${svg(ICONS.heart)}</span><div><p class="kicker">${esc(st('favorite.kicker'))}</p><h1>${esc(st('favorite.title'))}</h1><small>${esc(st('favorite.description'))}</small></div></div>
        <div class="hero-side"><div class="big-count"><strong>${num(items.length)}</strong><small>${esc(st('favorite.saved'))}</small></div><button type="button" class="btn btn-primary" data-act="new">＋ ${esc(L('افزودن کارت شخصی', 'Add a personal card', 'Eigene Karte hinzufügen'))}</button></div></header>
      ${ui.formOpen ? form(data) : ''}
      <section class="toolbar card-flat"><label class="search">${svg(ICONS.search)}<input type="search" data-search="1" value="${esc(ui.search)}" placeholder="${esc(st('favorite.search'))}" /></label>
        <div class="chips">${chip('all', st('common.all'), num(items.length), f === 'all')}${[1, 2, 3].map((n) => chip('star-' + n, '★'.repeat(n) + ' ' + starLabel(n), num(stars[n] || 0), f === 'star-' + n)).join('')}</div>
        ${kinds.length ? `<div class="chips">${kinds.map((kind) => chip(kind, favoriteKindMeta(kind).label, num(counts[kind]), f === kind)).join('')}</div>` : ''}</section>
      ${visible.length ? `<section class="fav-grid" id="favGrid">${visible.map(card).join('')}</section><p class="empty-line" id="favNone" hidden>${esc(st('favorite.emptyTitle'))}</p>`
        : `<section class="card empty-card"><div class="empty-emoji">☆</div><h2>${esc(st('favorite.emptyTitle'))}</h2><p class="muted">${esc(st('favorite.emptyDescription'))}</p><button type="button" class="btn btn-primary" data-act="new">＋ ${esc(L('اولین کارت را بسازید', 'Create your first card', 'Erste Karte erstellen'))}</button></section>`}`;
    applySearch();
  };

  function applySearch() {
    const q = ui.search.trim().toLocaleLowerCase();
    let shown = 0;
    root.querySelectorAll('#favGrid [data-search-text]').forEach((el) => {
      el.hidden = !!q && !el.dataset.searchText.includes(q);
      if (!el.hidden) shown += 1;
    });
    const none = root.querySelector('#favNone');
    if (none) none.hidden = shown > 0;
  }

  function save() {
    const val = (id) => (root.querySelector('#' + id)?.value || '').trim();
    const title = val('fTitle');
    const answer = val('fAnswer');
    if (!title || !answer) {
      root.querySelector(!title ? '#fTitle' : '#fAnswer')?.focus();
      return;
    }
    const data = ctx.store.data;
    const old = favoritesOf(data).find((x) => x.id === ui.editId);
    const item = normalizeFavorite({
      kind: val('fKind'), title, answer, topic: val('fTopic') || favoriteTopic(data), subtitle: val('fSubtitle'),
      explanation: val('fExplanation'), context: val('fContext'), rating: Number(val('fRating')), source: 'manual', manual: true,
      savedAt: old?.savedAt || new Date().toISOString(), favoriteId: old?.id || 'fav_manual_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)),
    }, data);
    mutate(ctx.store, 'favorites', [], (list) => {
      const index = list.findIndex((x) => x.id === item.id);
      if (index >= 0) list[index] = item;
      else list.unshift(item);
      return list;
    });
    ui.formOpen = false;
    ui.editId = '';
    ui.filter = 'all';
    draw();
  }

  root.addEventListener('submit', (event) => {
    event.preventDefault();
    save();
  });

  // FAV-MODAL: a click on the dark backdrop or Esc closes the window
  root.addEventListener('click', (event) => { if (event.target.matches && event.target.matches('[data-nmodal="fav"]')) { ui.formOpen = false; ui.editId = null; draw(); } }, true);
  root.addEventListener('keydown', (event) => { if (event.key === 'Escape' && ui.formOpen) { event.preventDefault(); ui.formOpen = false; ui.editId = null; draw(); } });
  root.addEventListener('click', async (event) => {
    if (handleStarClick(event, ctx.store, favCache)) return;
    const el = event.target.closest('button');
    if (!el) return;
    const d = el.dataset;
    if (d.filter) {
      ui.filter = d.filter;
      draw();
    } else if (d.del) deleteFavoriteStore(ctx.store, d.del);
    else if (d.edit) {
      ui.editId = d.edit;
      ui.formOpen = true;
      draw();
      root.querySelector('#fTitle')?.focus();
    } else if (d.manualDel) {
      if (await confirmDialog(L('این کارت حذف شود؟', 'Delete this card?', 'Diese Karte löschen?'))) deleteFavoriteStore(ctx.store, d.manualDel);
    } else if (d.act === 'new') {
      ui.editId = '';
      ui.formOpen = true;
      draw();
      root.querySelector('#fTitle')?.focus();
    } else if (d.act === 'close') {
      ui.formOpen = false;
      ui.editId = '';
      draw();
    }
  });

  root.addEventListener('input', (event) => {
    if (!event.target.dataset.search) return;
    ui.search = event.target.value;
    applySearch();
  });

  draw();
  root.onStoreChange = (paths) => {
    if (!paths.some((p) => ['*', 'favorites', 'user', 'uiLanguage'].includes(p))) return;
    const active = document.activeElement;
    if (active && root.contains(active) && active.closest('#favForm')) return;
    draw();
  };
  return root;
}
