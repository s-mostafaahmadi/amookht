// Small building blocks shared by the personal pages.

import { esc } from '../core/ui.js';
import { st } from '../core/site-text.js';
import { L, normalizeFavorite, favoriteRating, setFavoriteRatingStore } from '../core/learning.js';

const STAR = 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.45 4.73L5.82 21 12 17.27Z';

/**
 * Favourite stars (site favoriteButton): 1–3 stars, the same star again removes it.
 * `cache` maps favourite id → normalised item so a click can save a new favourite.
 */
export function starsHtml(data, item, cache) {
  const fav = normalizeFavorite(item, data);
  cache.set(fav.id, fav);
  const rating = favoriteRating(data, fav.id);
  return `<span class="stars" role="radiogroup" aria-label="${esc(L('درجه علاقه‌مندی', 'Favorite rating', 'Favoritenstufe'))}">${[1, 2, 3]
    .map((value) => `<button type="button" class="star${value <= rating ? ' is-on' : ''}" data-fav-id="${esc(fav.id)}" data-fav-rate="${value}" role="radio" aria-checked="${rating === value}" title="${value} / 3"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg></button>`)
    .join('')}</span>`;
}

/** Handles a click on a star; returns true when it was one. */
export function handleStarClick(event, store, cache) {
  const star = event.target.closest('[data-fav-rate]');
  if (!star) return false;
  event.stopPropagation();
  const item = cache.get(star.dataset.favId);
  if (item) setFavoriteRatingStore(store, item, Number(star.dataset.favRate));
  return true;
}

/** In-app confirm dialog (site appConfirm). Resolves true/false. */
export function confirmDialog(message, { ok = st('common.delete'), danger = true } = {}) {
  return new Promise((resolve) => {
    const shade = document.createElement('div');
    shade.className = 'dialog-shade';
    shade.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true"><p>${esc(message)}</p><div class="dialog-actions"><button type="button" class="btn" data-v="0">${esc(st('common.cancel'))}</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-v="1">${esc(ok)}</button></div></div>`;
    const done = (value) => {
      shade.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); done(false); }
      if (event.key === 'Enter') { event.preventDefault(); done(true); }
    };
    shade.addEventListener('click', (event) => {
      const button = event.target.closest('[data-v]');
      if (button) done(button.dataset.v === '1');
      else if (event.target === shade) done(false);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(shade);
    shade.querySelector('[data-v="1"]').focus();
  });
}

/** In-app text input dialog (site libraryGlassInput). Resolves the trimmed text or null. */
export function promptDialog({ title, description = '', value = '', placeholder = '', multiline = false, confirmText, icon = '✎', maxLength = 500 } = {}) {
  return new Promise((resolve) => {
    const shade = document.createElement('div');
    shade.className = 'dialog-shade';
    shade.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dialog-head"><span class="dialog-icon">${esc(icon)}</span><div><h2>${esc(title)}</h2>${description ? `<p class="muted small">${esc(description)}</p>` : ''}</div></div>
      ${multiline ? `<textarea class="dialog-field" dir="auto" rows="4" maxlength="${maxLength}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>` : `<input class="dialog-field" dir="auto" maxlength="${maxLength}" value="${esc(value)}" placeholder="${esc(placeholder)}" />`}
      <div class="dialog-actions"><button type="button" class="btn" data-v="0">${esc(L('انصراف', 'Cancel', 'Abbrechen'))}</button><button type="button" class="btn btn-primary" data-v="1">${esc(confirmText || L('ثبت', 'Save', 'Speichern'))}</button></div></div>`;
    const field = shade.querySelector('.dialog-field');
    const done = (result) => {
      shade.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(result);
    };
    const submit = () => {
      const result = field.value.trim();
      if (result) done(result);
      else field.focus();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); done(null); }
      else if (event.key === 'Enter' && (!multiline || event.ctrlKey)) { event.preventDefault(); submit(); }
    };
    shade.addEventListener('click', (event) => {
      const button = event.target.closest('[data-v]');
      if (button) { if (button.dataset.v === '1') submit(); else done(null); }
      else if (event.target === shade) done(null);
    });
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(shade);
    setTimeout(() => { field.focus(); if (value) field.select(); }, 20);
  });
}

/** Full-window "please wait" layer for slow library operations. */
let busyDepth = 0;
export function busyStart(message) {
  busyDepth += 1;
  let layer = document.querySelector('.busy-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'dialog-shade busy-layer';
    layer.innerHTML = '<div class="dialog busy-card"><span class="spinner"></span><b></b></div>';
    document.body.appendChild(layer);
  }
  layer.querySelector('b').textContent = message;
}
export function busyEnd() {
  busyDepth = Math.max(0, busyDepth - 1);
  if (!busyDepth) document.querySelector('.busy-layer')?.remove();
}

/** Saves text as a file through the normal download prompt. */
export function saveTextFile(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Search box + chip row used by several pages. */
export const chip = (id, label, count, on, attr = 'data-filter') =>
  `<button type="button" class="chip${on ? ' is-on' : ''}" ${attr}="${esc(id)}">${esc(label)}${count === undefined ? '' : ` <em>${esc(count)}</em>`}</button>`;
