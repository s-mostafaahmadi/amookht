// «مربی گفتگو» — the conversation coach. Like the site, the coach's own frontend (/coach/) runs inside the
// app in a same-origin frame (#dcoachFrame): the main process serves its files from a local cache and proxies
// its api/… calls with the signed-in token (electron/main.js serveCoach). So the selection toolbar, the
// coach → notebook bridge and «open in Amookht» links work exactly as on the site.

import { esc as E } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import { watchCoach } from '../core/coach-i18n.js';

const L = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);
const SCREENS = { errorbook: 'errorbook', favorites: 'favorites', dashboard: 'dashboard', library: 'library', history: 'history' };

export function renderCoach(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page coach-page';
  const a = ctx.account || {};
  if (!(a.premium || a.admin || a.owner)) {
    root.innerHTML = `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">💬</span><div><h1>${E(L('مربی گفتگو', 'Conversation coach', 'Gesprächscoach'))}</h1><small>${E(L('گفتگوی صوتی و متنی با مربی‌های آلمانی؛ این بخش برای حساب‌های ویژه فعال است.', 'Voice and text conversations with German coaches; this area is for premium accounts.', 'Sprach- und Textgespräche mit deutschen Coaches; dieser Bereich ist für Premium-Konten.'))}</small></div></div></header>`;
    return root;
  }
  // the coach reads the theme and a token placeholder from local storage (same origin); the real token is
  // added by the main process, so nothing secret is stored here
  try {
    localStorage.setItem('amookht_theme', document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    if (!localStorage.getItem('amookht_tokens')) localStorage.setItem('amookht_tokens', JSON.stringify({ access_token: 'app', token_type: 'bearer' }));
  } catch { /* ignore */ }
  // html.dcoach-active: the app's translator button opens the coach's own translator (tools/translate.js)
  document.documentElement.classList.add('dcoach-active');
  root.innerHTML = `<iframe id="dcoachFrame" class="coach-frame" title="${E(L('مربی گفتگو', 'Conversation coach', 'Gesprächscoach'))}" src="amookht://app/coach/?embed=1" allow="microphone; autoplay; clipboard-write"></iframe>`;
  const frame = root.querySelector('iframe');
  // COACH-I18N: the coach frontend is Persian in its title/top bar; localize the frame to the app language.
  let unwatch = () => {};
  const localize = () => {
    try { unwatch(); unwatch = watchCoach(frame.contentDocument); } catch (error) { console.warn(error); }
  };
  // inner scrolling (the site syncs page and frame scroll instead; inside the app the frame fills the view)
  frame.addEventListener('load', () => {
    try {
      const d = frame.contentDocument; if (!d) return;
      const st = d.createElement('style');
      // the app's own translator button (same place and look as on every other page) opens this translator
      st.textContent = 'html.embedded,html.embedded body{overflow:auto!important;height:100%!important}#translatorFab{display:none!important}';
      d.head.appendChild(st);
    } catch (error) { console.warn(error); }
    localize();
    setTimeout(localize, 700);
  });
  const onMessage = (event) => {
    if (event.source !== frame.contentWindow || !event.data || event.data.type !== 'dcoach:open') return;
    const target = SCREENS[event.data.screen];
    if (target) ctx.navigate(target);
  };
  window.addEventListener('message', onMessage);
  root.onLeave = () => { document.documentElement.classList.remove('dcoach-active'); window.removeEventListener('message', onMessage); unwatch(); try { window.AmkCoachBridge && window.AmkCoachBridge.drain(); } catch { /* ignore */ } };
  return root;
}
