// Placeholder for pages that are rebuilt in a later milestone.

import { esc, svg } from '../core/ui.js';
import { t } from '../core/i18n.js';

export function renderComing(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page';
  root.innerHTML = `
    <section class="card coming">
      <span class="page-hero-icon">${svg(page.icon)}</span>
      <span class="milestone-chip">${esc(t('nativePreview'))} · M${page.milestone}</span>
      <h2>${esc(t(page.label))}</h2>
      <p>${esc(t('comingText', page.milestone))}</p>
      <div class="coming-actions">
        <button class="btn btn-primary" type="button" data-act="v3">${esc(t('switchToV3'))}</button>
      </div>
    </section>`;
  root.querySelector('[data-act="v3"]').addEventListener('click', () => ctx.switchToSite(page.id));
  return root;
}
