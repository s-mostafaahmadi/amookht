// Look and feel from the account's own settings, with the site's exact values
// (APP_ACCENTS, fontScale 85–120, radius 8–32, density, glass, high contrast,
// dark mode, reduced motion). Changing them here changes them on the site too.

export const APP_ACCENTS = {
  violet: ['#7c5cff', '#a855f7'],
  blue: ['#2563eb', '#38bdf8'],
  emerald: ['#059669', '#34d399'],
  rose: ['#e11d48', '#fb7185'],
  amber: ['#d97706', '#fbbf24'],
};
export const ACCENT_NAMES = {
  violet: { fa: 'بنفش', en: 'Violet', de: 'Violett' },
  blue: { fa: 'آبی', en: 'Blue', de: 'Blau' },
  emerald: { fa: 'سبز', en: 'Emerald', de: 'Smaragd' },
  rose: { fa: 'رز', en: 'Rose', de: 'Rose' },
  amber: { fa: 'کهربایی', en: 'Amber', de: 'Bernstein' },
};
export const DEFAULT_PREFS = {
  accent: 'violet', fontScale: 100, density: 'comfortable', radius: 20, glass: true, highContrast: false, sidebarCompact: false,
};

const clamp = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
};

/** Normalised look from the state document. */
export function readLook(data) {
  const p = (data && data.appSettings) || {};
  const user = (data && data.user) || {};
  return {
    accent: APP_ACCENTS[p.accent] ? p.accent : 'violet',
    fontScale: clamp(p.fontScale, 85, 120, 100),
    radius: clamp(p.radius, 8, 32, 20),
    density: ['compact', 'comfortable', 'spacious'].includes(p.density) ? p.density : 'comfortable',
    glass: p.glass !== false,
    highContrast: !!p.highContrast,
    sidebarCompact: !!p.sidebarCompact,
    dark: typeof (data && data.darkMode) === 'boolean' ? data.darkMode : true,
    reducedMotion: !!user.reducedMotion,
    lang: ['fa', 'en', 'de'].includes(data && data.uiLanguage) ? data.uiLanguage : 'fa',
  };
}

export function applyLook(look) {
  const root = document.documentElement;
  const [a1, a2] = APP_ACCENTS[look.accent] || APP_ACCENTS.violet;
  root.style.setProperty('--accent', a1);
  root.style.setProperty('--accent-2', a2);
  root.style.setProperty('--app-accent', a1);
  root.style.setProperty('--app-accent-2', a2);
  root.style.setProperty('--font-scale', String(look.fontScale / 100));
  root.style.setProperty('--card-radius', look.radius + 'px');
  root.dataset.theme = look.dark ? 'dark' : 'light';
  root.dataset.density = look.density;
  root.dataset.glass = look.glass ? '1' : '0';
  root.dataset.contrast = look.highContrast ? '1' : '0';
  root.dataset.reduceMotion = look.reducedMotion ? '1' : '0';
}
