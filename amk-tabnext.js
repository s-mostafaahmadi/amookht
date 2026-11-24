/* Amookht · Tab / Shift+Tab inside a text box jumps straight to the next / previous visible text box
   (skipping the buttons in between). Inside an overlay (tutor panel, dialog …) it stays inside that overlay.
   If there is no further text box, the browser's normal Tab behaviour applies. */
(function () {
  'use strict';
  const FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="hidden"]):not([type="image"]),textarea,[contenteditable="true"],[contenteditable=""]';
  const usable = (el) => !el.disabled && !el.readOnly && !el.closest('[inert],[aria-hidden="true"],.amk-no-tabnext') &&
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  function scopeOf(el) {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (p.matches('dialog,[role="dialog"],[aria-modal="true"]')) return p;
      const pos = getComputedStyle(p).position;
      if (pos === 'fixed') return p;
    }
    return document;
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey || e.isComposing || e.defaultPrevented) return;
    const t = e.target;
    if (!t || !t.matches || !t.matches(FIELD)) return;
    const list = [...scopeOf(t).querySelectorAll(FIELD)].filter((el) => el === t || usable(el));
    const i = list.indexOf(t); if (i < 0) return;
    const next = list[e.shiftKey ? i - 1 : i + 1];
    if (!next) return;                                  // last/first field → normal browser Tab
    e.preventDefault();
    next.focus();
    try { next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) {}
    if (typeof next.setSelectionRange === 'function' && /^(text|search|url|tel|password|email)?$/i.test(next.type || '')) {
      try { const n = next.value.length; next.setSelectionRange(n, n); } catch (_) {}
    }
  }, true);
})();
