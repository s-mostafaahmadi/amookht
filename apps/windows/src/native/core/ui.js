// Small DOM helpers shared by the native pages.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const esc = (value) => String(value == null ? '' : value)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const svg = (d, cls = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${cls ? ` class="${cls}"` : ''}><path d="${d}"/></svg>`;

export const ICONS = {
  home: 'M3 11 12 3l9 8v10h-6v-6H9v6H3z',
  notebook: 'M5 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2zm2 5v2h8V8zm0 4v2h6v-2z',
  heart: 'M12 21 3.5 12.6A5 5 0 0 1 12 6a5 5 0 0 1 8.5 6.6z',
  library: 'M4 4h4v16H4zm6 0h4v16h-4zm5.5 1.2 3.9-1 4 15.5-3.9 1z',
  coach: 'M4 4h16v11H8l-4 4zm4 4v2h8V8zm0 3v1h5v-1z',
  exam: 'M6 2h9l5 5v15H6zm8 1v5h5M9 12h8v2H9zm0 4h8v2H9z',
  history: 'M13 3a9 9 0 1 1-8.5 6H7a7 7 0 1 0 6-4V8L9 4l4-4zm-1 5h2v5l4 2-1 1.7-5-2.7z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4c0-.4 0-.9-.1-1.3l2-1.6-2-3.4-2.4 1a8 8 0 0 0-2.3-1.3L15.8 2h-4l-.4 2.4a8 8 0 0 0-2.3 1.3l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 2.3 1.3l.4 2.4h4l.4-2.4a8 8 0 0 0 2.3-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1 20c0-3.3 3.6-6 8-6s8 2.7 8 6zm16.5-5.8c2.9.5 5.5 2.5 5.5 5.8h-4.5c0-2.3-.4-4.2-1-5.8z',
  account: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z',
  moon: 'M12 3a9 9 0 1 0 9 9c0-.5 0-.9-.1-1.4A5.5 5.5 0 0 1 13.4 3.1 9 9 0 0 0 12 3z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm15.4 0h-3.4a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4z',
  lines: 'M4 5h16v2H4zm0 6h16v2H4zm0 6h16v2H4z',
  square: 'M4 4h16v16H4z',
  contrast: 'M12 2a10 10 0 1 0 0 20zm0 2v16a8 8 0 0 0 0-16z',
  reload: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
  widget: 'M3 3h8v8H3zm10 0h8v5h-8zM3 13h8v8H3zm10-3h8v11h-8z',
  monitor: 'M3 4h18v12H3zm2 2v8h14V6zM8 18h8v2H8z',
  zoomIn: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm-1 3v3H6v2h3v3h2v-3h3V9h-3V6z',
  zoomOut: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zM6 9v2h8V9z',
  search: 'M10 3a7 7 0 0 1 5.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  external: 'M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z',
  logout: 'M10 3h10v18H10v-2h8V5h-8zm-.6 5.4L11 10H3v4h8l-1.6 1.6L10.8 17 16 12l-5.2-5z',
  palette: 'M12 3a9 9 0 0 0 0 18c1 0 1.5-.6 1.5-1.4 0-.4-.2-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8.1-9-8.1zM6.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  type: 'M5 4h14v3h-2V6h-4v12h2v2H9v-2h2V6H7v1H5z',
  radius: 'M5 19V11a6 6 0 0 1 6-6h8v2h-8a4 4 0 0 0-4 4v8z',
  display: 'M3 4h18v13H3zm2 2v9h14V6zM9 19h6v2H9z',
  cursor: 'M5 3l13 7-5.5 1.5L15 18l-2.5 1-2.6-6.6L5 16z',
  brush: 'M20.7 4.6 19.4 3.3a1 1 0 0 0-1.4 0L9 12.3 11.7 15l9-9a1 1 0 0 0 0-1.4zM7.5 14A3.5 3.5 0 0 0 4 17.5c0 1.2-1 2-2 2 1 1.5 2.7 2.5 4.5 2.5A4 4 0 0 0 10.5 18 4 4 0 0 0 7.5 14z',
  check: 'm9 16.2-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4z',
  sparkle: 'M12 2l2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7z',
};

let toastTimer = null;
export function toast(message, kind = '') {
  const stack = document.querySelector('#toasts');
  if (!stack) return;
  const node = document.createElement('div');
  node.className = 'toast' + (kind ? ' is-' + kind : '');
  node.textContent = message;
  stack.appendChild(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity .2s ease';
    setTimeout(() => node.remove(), 220);
  }, 2400);
}

/** Debounce helper (trailing). */
export function debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
