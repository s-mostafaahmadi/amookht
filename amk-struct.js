/* Amookht · grammar structures everywhere: every formula like „werden + Partizip II“ or „sich lassen + Infinitiv“
   becomes its own small red box (.amk-struct). Runs on the whole page (app, tutor answers, panels) via a MutationObserver
   and only touches text nodes, so it works for content rendered by any module. */
(function () {
  'use strict';
  const W = "[A-Za-zÄÖÜäöüß0-9/\\-…()'’.]+";                 // one word of a formula (no spaces)
  const WN = "[A-Za-zÄÖÜäöüß0-9/\\-…()'’]+";                 // same, without a trailing period
  // left: up to 3 words · then one or more „+ right“ parts (right = a word, optionally followed by I/II/III)
  const RX = new RegExp(`(${WN}(?:[ \\u00a0]${WN}){0,2})((?:[ \\u00a0]*\\+[ \\u00a0]*${WN}(?:[ \\u00a0](?:I{1,3}|[A-Za-zÄÖÜäöüß]+(?=[ \\u00a0]*\\+)))?)+)`, 'g');
  void W;
  const TERMS = /(?<![\p{L}])(infinitiv|partizip|präsens|präteritum|perfekt|plusquamperfekt|futur|akkusativ|dativ|genitiv|nominativ|akk|dat|gen|nom|nebensatz|hauptsatz|verb|verben|vollverb|hilfsverb|modalverb|subjekt|objekt|konjunktiv|zu|werden|sein|haben|adjektiv|adjektive|adverb|nomen|substantiv|komparativ|superlativ|pronomen|relativpronomen|präposition|artikel|endung|dass|ob|um|damit|sich|lassen|wenn|als|je|desto|umso|satz|satzende|position|ende|inf|p\.?\s?ii|pii)(?![\p{L}])/iu;
  const STOP = new Set(['mit', 'durch', 'man', 'ist', 'sind', 'wird', 'bildet', 'bilden', 'wie', 'und', 'oder', 'auch', 'nur', 'form', 'formel', 'struktur', 'muster', 'regel', 'also', 'z.b.', 'zb', 'bzw.', 'the', 'is', 'with', 'heißt', 'ergibt', 'gilt', 'steht', 'immer', 'meist', 'oft', 'hier', 'dann', 'es', 'er', 'ich', 'du', 'wir', 'ihr']);
  const SKIP = 'script,style,textarea,input,select,option,svg,title,noscript,[contenteditable=""],[contenteditable="true"],.amk-struct,.amk-no-struct';

  function trimLeft(left) {
    let ws = left.split(/[  ]+/);
    // keep only the words after the last stop-word ("… bildet man mit werden + Partizip II" → "werden")
    for (let i = ws.length - 2; i >= 0; i--) if (STOP.has(ws[i].toLowerCase())) { ws = ws.slice(i + 1); break; }
    // drop leading capitalised words that are not grammar terms ("Die Ergebnisse werden + …" → "werden")
    while (ws.length > 1 && /^[A-ZÄÖÜ]/.test(ws[0]) && !TERMS.test(ws[0])) ws.shift();
    // keep the original spacing of what is left
    const toks = left.split(/([  ]+)/);
    return toks.slice(toks.length - (2 * ws.length - 1)).join('');
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function chip(f) {
    const parts = f.split(/[  ]*\+[  ]*/).map((p) => escapeHtml(p.trim()));
    const el = document.createElement('span');
    el.className = 'amk-struct'; el.dir = 'ltr';
    el.innerHTML = parts.join('<i aria-hidden="true">+</i>');
    el.setAttribute('aria-label', f);
    return el;
  }
  function fixText(node) {
    const text = node.nodeValue; if (!text || text.indexOf('+') < 0) return;
    RX.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = RX.exec(text))) {
      let full = m[0], left = m[1];
      const tl = trimLeft(left), cut = left.length - tl.length;   // leading stop-words stay plain text
      full = full.slice(cut).replace(/[.,;:]+$/, '');
      const start = m.index + cut;
      if (!TERMS.test(full) || full.split('+').some((p) => !p.trim())) continue;
      if (/^\d+(\s*\+\s*\d+)+$/.test(full)) continue;               // plain arithmetic
      frag = frag || document.createDocumentFragment();
      // the box replaces quotation marks around the formula („…“ / "…" / “…”)
      let s0 = start, e0 = start + full.length;
      if (s0 > last && /[„"“‚]/.test(text[s0 - 1]) && /[“"”‘]/.test(text[e0] || '')) { s0 -= 1; e0 += 1; }
      if (s0 > last) frag.appendChild(document.createTextNode(text.slice(last, s0)));
      frag.appendChild(chip(full));
      last = e0;
      RX.lastIndex = last;
    }
    if (!frag) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) { const p = root.parentElement; if (p && !p.closest(SKIP)) fixText(root); return; }
    if (root.nodeType !== 1 || root.closest?.(SKIP)) return;
    if ((root.textContent || '').indexOf('+') < 0) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.indexOf('+') >= 0 && !n.parentElement?.closest(SKIP) ? 1 : 3) });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(fixText);
  }
  let queue = new Set(), raf = 0;
  function flush() { raf = 0; const q = queue; queue = new Set(); q.forEach((n) => { if (n.isConnected) scan(n); }); }
  const mo = new MutationObserver((list) => {
    for (const r of list) {
      if (r.type === 'characterData') queue.add(r.target);
      else r.addedNodes.forEach((n) => queue.add(n));
    }
    if (queue.size && !raf) raf = requestAnimationFrame(flush);
  });
  function start() { scan(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  window.AmkStruct = { scan, chip };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
