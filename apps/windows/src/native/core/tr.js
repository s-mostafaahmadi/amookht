// T(fa) — translation for the panels that were ported from the site without i18n
// (owner «مدیریت هوش مصنوعی» and admin «کنترل محتوا»).
// Lookup order: the panel dictionary below → the site/app translation memory → the Persian text.

import { lang } from './i18n.js';
import { SITE_TEXT } from './site-text.js';
import { DICTS } from './i18n.js';
import { PANEL, PATTERNS } from './tr-dict.js';

// fa → [en, de], reused from every trilingual text the app already has.
const MEMORY = new Map();
(function buildMemory() {
  Object.keys(SITE_TEXT || {}).forEach((key) => {
    const row = SITE_TEXT[key];
    if (row && row.fa && row.en) MEMORY.set(row.fa, [row.en, row.de || row.en]);
  });
  const keys = Object.keys(DICTS.fa || {});
  keys.forEach((key) => {
    const faText = DICTS.fa[key];
    const enText = DICTS.en[key];
    if (typeof faText === 'string' && typeof enText === 'string' && !MEMORY.has(faText)) {
      MEMORY.set(faText, [enText, DICTS.de[key] || enText]);
    }
  });
})();

export function T(faText, vars) {
  const text = String(faText == null ? '' : faText);
  const index = lang() === 'de' ? 1 : lang() === 'en' ? 0 : -1;
  let out = text;
  if (index >= 0) {
    const hit = translatePiece(text.trim(), index);
    if (hit != null) out = hit;
  }
  if (vars && typeof vars === 'object') {
    Object.keys(vars).forEach((key) => { out = out.split('{' + key + '}').join(String(vars[key])); });
  }
  return out;
}

/* ───────── runtime translation of rendered panels ───────── */

const FA = /[؀-ۿ]/;
const ATTRS = ['title', 'placeholder', 'aria-label'];
// Persian digits and ٪ become Latin ones outside Persian, so «۳۴ موفق» and numbers alone read right.
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const latinDigits = (value) => String(value)
  .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
  .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
  .replace(/٪/g, '%').replace(/٫/g, '.').replace(/٬/g, ',');
// ZWNJ and digits differ between the site source and this dictionary, so match on a normalized key too.
const NORM = new Map();
const normKey = (value) => latinDigits(String(value).replace(/‌/g, '').replace(/\s+/g, ' ').trim());
Object.keys(PANEL).forEach((key) => { const k = normKey(key); if (!NORM.has(k)) NORM.set(k, PANEL[key]); });
MEMORY.forEach((pair, key) => { const k = normKey(key); if (!NORM.has(k)) NORM.set(k, pair); });
const RULES = PATTERNS.map(([source, en, de]) => [new RegExp(source), en, de]);
const lookup = (text) => PANEL[text] || MEMORY.get(text) || NORM.get(normKey(text));

// Translate one trimmed piece of text (index 0 = en, 1 = de); null when nothing matches.
function translatePiece(text, index, depth = 0) {
  if (!text) return null;
  const direct = lookup(text);
  if (direct) return direct[index] || direct[0];
  const latin = latinDigits(text).replace(/‌/g, '');
  if (!FA.test(latin)) return latin;
  for (const [re, en, de] of RULES) {
    const m = latin.match(re);
    if (!m) continue;
    return (index ? de : en).replace(/\$(\d)/g, (_, n) => {
      const part = m[Number(n)] || '';
      return FA.test(part) && depth < 3 ? (translatePiece(part.trim(), index, depth + 1) ?? part) : part;
    });
  }
  if (depth > 3) return null;
  // «(…)» around a known text
  const paren = text.match(/^\((.+)\)$/);
  if (paren) { const inner = translatePiece(paren[1].trim(), index, depth + 1); if (inner != null) return '(' + inner + ')'; }
  // fragments that end with a colon or a middot keep their punctuation
  const cut = text.match(/^(.+?)([\s]*[:·…—–-]+[\s]*)$/);
  if (cut) { const hit = lookup(cut[1].trim()); if (hit) return (hit[index] || hit[0]) + cut[2]; }
  // «label: value» where only the label is Persian
  const label = text.match(/^([^:]+):\s+(.+)$/);
  if (label && !FA.test(latinDigits(label[2]))) {
    const hit = lookup(label[1].trim() + ':') || lookup(label[1].trim());
    if (hit) return String(hit[index] || hit[0]).replace(/:?\s*$/, ': ') + latinDigits(label[2]);
  }
  // texts joined with « · » or « | »: every part must be known
  if (/ [·|] /.test(text)) {
    const parts = text.split(/( [·|] )/);
    const out = parts.map((p, i) => (i % 2 || !FA.test(p) ? p : translatePiece(p.trim(), index, depth + 1)));
    if (out.every((p) => p != null)) return out.join('');
  }
  return null;
}

function translateText(raw) {
  const trimmed = raw.trim();
  if (!trimmed || !FA.test(trimmed)) return raw;
  const lead = raw.slice(0, raw.indexOf(trimmed));
  const tail = raw.slice(raw.indexOf(trimmed) + trimmed.length);
  const hit = translatePiece(trimmed, lang() === 'de' ? 1 : 0);
  return hit == null ? raw : lead + hit + tail;
}

/** Translate every Persian text node and title/placeholder/aria-label inside a rendered panel. */
export function translateTree(root) {
  if (!root || lang() === 'fa') return root;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const next = translateText(node.nodeValue || '');
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  if (root.querySelectorAll) {
    root.querySelectorAll('*').forEach((el) => {
      ATTRS.forEach((name) => {
        const value = el.getAttribute && el.getAttribute(name);
        if (!value || !FA.test(value)) return;
        const next = translateText(value);
        if (next !== value) el.setAttribute(name, next);
      });
    });
  }
  return root;
}

export { PANEL };
export default T;
