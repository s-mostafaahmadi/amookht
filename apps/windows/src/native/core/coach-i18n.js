// «مربی گفتگو» runs the site's own /coach/ frontend inside a same-origin frame. That frontend is mostly German,
// but its page title, top-bar brand and a few help/dialog texts are Persian. The app localizes the frame's document
// in place to the app language (fa stays untouched), and keeps watching for late-rendered Persian nodes.

import { lang } from './i18n.js';

// fa → [en, de]
const DICT = {
  'مربی گفتگو · آموخت': ['Deutsch Coach · Amookht', 'Deutsch Coach · Amookht'],
  'مربی گفتگو': ['Deutsch Coach', 'Deutsch Coach'],
  'تمرین صحبت: آزاد حرف بزن و اصلاح فوری بگیر': ['Speaking practice: talk freely and get instant corrections', 'Sprechübung: frei sprechen und sofort Korrekturen bekommen'],
  'گرامر در اولویت است؛ اشتباهات تایپی جزئی ذخیره نمی‌شوند.': ['Grammar comes first; minor typos are not saved.', 'Grammatik hat Vorrang; kleine Tippfehler werden nicht gespeichert.'],
  'پاسخ‌ها، راهنماها، ترجمه‌ها و نکته‌های مهم را با ستاره ذخیره کنید.': ['Save replies, hints, translations and important notes with a star.', 'Antworten, Hinweise, Übersetzungen und wichtige Notizen mit einem Stern speichern.'],
  'فارسی ↔ DEUTSCH': ['Persian ↔ GERMAN', 'Persisch ↔ DEUTSCH'],
  'فارسی ↔ Deutsch': ['Persian ↔ German', 'Persisch ↔ Deutsch'],
  'یک لغت یا عبارت فارسی / آلمانی بنویسید…': ['Enter a Persian / German word or phrase…', 'Persisches / deutsches Wort oder Satz eingeben…'],
  'ترجمه و Collocations': ['Translate & collocations', 'Übersetzen & Kollokationen'],
  'شخصیت، هدف و شیوهٔ بازخورد را دقیق انتخاب کنید؛ این اطلاعات مستقیماً رفتار مربی را تعیین می‌کنند.': ['Choose personality, goal and feedback style carefully; they directly shape how the coach behaves.', 'Persönlichkeit, Ziel und Feedback-Stil genau wählen; sie bestimmen direkt das Verhalten des Coaches.'],
  'مدیریت مربی‌ها': ['Coach management', 'Coach-Verwaltung'],
  'حذف مربی': ['Delete coach', 'Coach löschen'],
  'لغو': ['Cancel', 'Abbrechen'],
  'حذف برای من': ['Delete for me', 'Für mich löschen'],
  'بازگشت به آموخت': ['Back to Amookht', 'Zurück zu Amookht'],
  'بستن': ['Close', 'Schließen'],
};

const FA = /[\u0600-\u06FF]/;
const ATTRS = ['title', 'placeholder', 'aria-label'];

function translateText(raw, language) {
  const text = String(raw || '');
  const trimmed = text.trim();
  if (!trimmed || !FA.test(trimmed)) return raw;
  const hit = DICT[trimmed];
  if (!hit) return raw;
  const out = hit[language === 'de' ? 1 : 0] || hit[0];
  return text.replace(trimmed, out);
}

/** Localize the coach frame's document for the current app language (no-op for Persian). */
export function localizeCoach(doc, language = lang()) {
  if (!doc || !doc.body || language === 'fa') return;
  const index = language === 'de' ? 1 : 0;

  if (FA.test(doc.title || '')) {
    const hit = DICT[(doc.title || '').trim()];
    const name = DICT['مربی گفتگو'];
    doc.title = hit ? (hit[index] || hit[0]) : (doc.title || '').replace(/مربی گفتگو/g, name[index] || name[0]);
  }
  // the Persian top-bar line is right-aligned; the localized one reads left-to-right like the rest of the coach
  doc.querySelectorAll('small[dir="rtl"], p[dir="rtl"]').forEach((el) => { el.setAttribute('dir', 'ltr'); });

  const walker = doc.createTreeWalker(doc.body, 4 /* SHOW_TEXT */);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const next = translateText(node.nodeValue, language);
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  doc.body.querySelectorAll('*').forEach((el) => {
    ATTRS.forEach((name) => {
      const value = el.getAttribute && el.getAttribute(name);
      if (!value || !FA.test(value)) return;
      const next = translateText(value, language);
      if (next !== value) el.setAttribute(name, next);
    });
  });
}

/** Watch a coach frame and repeat localization whenever its frontend renders new nodes. */
export function watchCoach(doc, language = lang()) {
  if (!doc || !doc.body || language === 'fa') return () => {};
  localizeCoach(doc, language);
  let queued = false;
  const run = () => {
    queued = false;
    try { localizeCoach(doc, language); } catch { /* frame navigated */ }
  };
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    (doc.defaultView?.requestAnimationFrame || setTimeout)(run);
  });
  try { observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true }); } catch { /* ignore */ }
  return () => observer.disconnect();
}
