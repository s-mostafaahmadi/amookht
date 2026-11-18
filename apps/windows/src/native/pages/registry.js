// Pages of the native app, in the site's own sidebar order. `milestone` says when
// a page is rebuilt natively; until then it shows a placeholder that can hand the
// page to the current (v3) version.

import { renderAdmin } from './admin.js';
import { renderCoach } from './coach.js';
import { renderTestdafSim } from './testdaf-sim.js';
import { ICONS } from '../core/ui.js';
import { renderAppSettings } from './app-settings.js';
import { renderComing } from './coming.js';
import { renderErrorbook } from './errorbook.js';
import { renderFavorites } from './favorites.js';
import { renderHistory } from './history.js';
import { renderLibrary } from './library.js';
import { renderAccount } from './account.js';
import { renderDashboard } from './dashboard.js';

export const PAGES = [
  { id: 'dashboard', label: 'navDashboard', icon: ICONS.home, milestone: 3, render: renderDashboard },
  { id: 'errorbook', label: 'navErrorbook', icon: ICONS.notebook, milestone: 2, render: renderErrorbook },
  { id: 'favorites', label: 'navFavorites', icon: ICONS.heart, milestone: 2, render: renderFavorites, count: (data) => (Array.isArray(data.favorites) ? data.favorites.length : 0) },
  { id: 'library', label: 'navLibrary', icon: ICONS.library, milestone: 2, premium: true, render: renderLibrary },
  { id: 'deutschCoach', label: 'navCoach', icon: ICONS.coach, milestone: 5, premium: true, render: renderCoach },
  { id: 'testdafSim', label: 'navExam', icon: ICONS.exam, milestone: 5, premium: true, render: renderTestdafSim },
  { id: 'history', label: 'navHistory', icon: ICONS.history, milestone: 2, render: renderHistory, count: (data) => (Array.isArray(data.history) ? data.history.length : 0) },
  { id: 'appSettings', label: 'navAppSettings', icon: ICONS.settings, milestone: 1, render: renderAppSettings },
  { id: 'adminUsers', label: 'navAdmin', icon: ICONS.users, milestone: 6, admin: true, render: renderAdmin },
];

export const ACCOUNT_PAGE = { id: 'settings', label: 'navAccount', icon: ICONS.account, milestone: 2, render: renderAccount };

export const ALL_PAGES = [...PAGES, ACCOUNT_PAGE];

export function findPage(id) {
  return ALL_PAGES.find((page) => page.id === id) || PAGES[0];
}

export function renderPage(page, ctx) {
  return (page.render || renderComing)(page, ctx);
}
