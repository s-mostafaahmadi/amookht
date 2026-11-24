// «کتابخانه» (premium) — the site's library: folders with drag-and-drop, PDF upload and a
// PDF workspace (pen, highlight, underline, text, eraser; saved per page), personal notes
// (typed, handwriting, combined with movable handwriting stickers), live updates from other
// devices. Same backend (/v1/library) and the same stored formats as the site.

import { esc, toast } from '../core/ui.js';
import { L } from '../core/learning.js';
import { confirmDialog, promptDialog, busyStart, busyEnd } from './widgets.js';
import { freeStudyHtml, mountFreeStudy, persistFreeStudy } from './free-study.js';

const lib = {
  status: null, data: { folders: [], documents: [], notes: [] }, folderId: null, trail: [], loading: false, error: '',
  editor: null, noteMode: null, noteTool: 'pen', noteColor: '#1f2937', noteWidth: 3, noteDirty: false, noteQueue: Promise.resolve(), noteRevision: 0,
  pdf: null, moving: false,
};
let pdfjs = null;

const defaultInkWidth = () => (window.matchMedia && window.matchMedia('(pointer:fine)').matches ? 3 : 2);
const round = (v, d = 5) => Number(Number(v || 0).toFixed(d));

/* ── stored-format helpers (identical to the site) ── */
function compactInk(points) {
  if (!Array.isArray(points) || points.length < 3) return points;
  const out = [];
  const first = points[0];
  const last = points[points.length - 1];
  out.push([round(first[0]), round(first[1]), round(first[2], 3)]);
  let kept = first;
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i];
    const dist = Math.hypot((p[0] || 0) - (kept[0] || 0), (p[1] || 0) - (kept[1] || 0));
    const dp = Math.abs((p[2] || 0.5) - (kept[2] || 0.5));
    if (dist < 0.0018 && dp < 0.12) continue;
    out.push([round(p[0]), round(p[1]), round(p[2], 3)]);
    kept = p;
  }
  out.push([round(last[0]), round(last[1]), round(last[2], 3)]);
  return out;
}
function compactDrawing(note) {
  (note?.drawing || []).forEach((item) => {
    if (Array.isArray(item?.points)) item.points = compactInk(item.points);
    if (item?.kind === 'ink_archived_sticker' && Array.isArray(item.strokes)) item.strokes.forEach((s) => { if (Array.isArray(s?.points)) s.points = compactInk(s.points); });
  });
  return note?.drawing || [];
}
function noteLayout(note) {
  note.drawing = Array.isArray(note.drawing) ? note.drawing : [];
  let layout = note.drawing.find((x) => x && x.kind === 'ink_layout');
  if (!layout) {
    layout = { kind: 'ink_layout', x: 0.16, y: 0.32, w: 0.64, aspect: 2, placed: false, locked: false };
    note.drawing.unshift(layout);
  }
  const strokes = note.drawing.filter((x) => Array.isArray(x?.points) && x.points.length);
  if (layout.placed && strokes.length && !strokes.some((x) => x.kind === 'ink_sticker_stroke')) strokes.forEach((x) => { x.kind = 'ink_sticker_stroke'; });
  return layout;
}
function segDist(p, a, b) {
  const vx = b[0] - a[0]; const vy = b[1] - a[1]; const wx = p[0] - a[0]; const wy = p[1] - a[1]; const len = vx * vx + vy * vy;
  if (!len) return Math.hypot(wx, wy);
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
}
function distPx(annotation, point, canvas) {
  const d = annotation?.payload || annotation || {};
  const toPx = (q) => [q[0] * canvas.width, q[1] * canvas.height];
  const p = toPx(point);
  const pts = (d.points || []).map(toPx);
  if (pts.length > 1) { let best = Infinity; for (let i = 1; i < pts.length; i += 1) best = Math.min(best, segDist(p, pts[i - 1], pts[i])); return best; }
  if (Number.isFinite(d.x1) && Number.isFinite(d.x2)) return segDist(p, toPx([d.x1, d.y1]), toPx([d.x2, d.y2]));
  if (pts.length === 1) return Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]);
  if (Number.isFinite(d.x)) return Math.hypot(p[0] - d.x * canvas.width, p[1] - d.y * canvas.height);
  return Infinity;
}
function drawPressure(ctx, stroke, width, height) {
  const pts = stroke.points || [];
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = stroke.color || '#1f2937';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < pts.length; i += 1) {
    const pressure = Math.max(0.25, ((pts[i - 1][2] || 0.5) + (pts[i][2] || 0.5)) / 2);
    ctx.lineWidth = (stroke.width || 3) * (0.55 + pressure);
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0] * width, pts[i - 1][1] * height);
    ctx.lineTo(pts[i][0] * width, pts[i][1] * height);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderLibrary(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page lib';
  const api = (path, options) => ctx.bridge.api('/v1/library' + path, options);
  const fail = (r, fallback) => {
    if (r && r.ok) return false;
    toast((r && r.error && r.error.message) || fallback || L('انجام نشد', 'Failed', 'Fehlgeschlagen'), 'warn');
    return true;
  };

  /* ───────── loading ───────── */
  async function load(folderId = lib.folderId) {
    lib.loading = true;
    lib.error = '';
    lib.folderId = folderId;
    draw();
    const status = await api('/status');
    if (status.ok) {
      lib.status = status.data;
      if (lib.status.premium) {
        const list = await api(folderId ? '?folder_id=' + encodeURIComponent(folderId) : '');
        if (list.ok) lib.data = list.data;
        else lib.error = list.error.message;
      }
    } else lib.error = status.error.message || 'Library unavailable';
    lib.loading = false;
    if (root.isConnected) draw();
  }

  /* ───────── views ───────── */
  const draw = () => {
    if (lib.pdf) return drawPdf();
    if (lib.editor) return drawNote();
    if (lib.status && !lib.status.premium) {
      root.innerHTML = promo() + `<div class="free-study-library-divider"></div>${freeStudyHtml(ctx)}`;
      mountFreeStudy(root.querySelector('[data-fs-host]'), ctx, draw);
      return;
    }
    const d = lib.data || { folders: [], documents: [], notes: [] };
    const used = lib.status ? Math.round((lib.status.used_bytes / 1048576) * 10) / 10 : 0;
    const quota = lib.status ? Math.round(lib.status.quota_bytes / 1048576) : 0;
    const canUpload = !lib.status || lib.status.can_upload !== false;
    const parent = lib.trail.length > 1 ? lib.trail[lib.trail.length - 2].id : '';
    const count = d.folders.length + d.documents.length + d.notes.length;
    root.innerHTML = `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">📚</span><div><p class="kicker">PREMIUM WORKSPACE</p><h1>${esc(L('کتابخانه و دفتر یادداشت', 'Library & notebook', 'Bibliothek & Notizbuch'))}</h1>
        <small>${esc(L(`${used} از ${quota} مگابایت استفاده شده · فایل‌ها فقط برای حساب شما قابل دسترسی‌اند`, `${used} of ${quota} MB used · files are only available to your account`, `${used} von ${quota} MB belegt · Dateien sind nur für dein Konto sichtbar`))}</small></div></div>
        <div class="row-actions"><button type="button" class="btn" data-act="folder">＋ ${esc(L('پوشه', 'Folder', 'Ordner'))}</button><button type="button" class="btn" data-act="note">＋ ${esc(L('یادداشت', 'Note', 'Notiz'))}</button>
        <label class="btn btn-primary ${canUpload ? '' : 'is-disabled'}" title="${canUpload ? '' : esc(L('آپلود فایل فقط برای اشتراک پرداخت‌شده است', 'Uploading needs a paid Premium plan', 'Hochladen nur mit bezahltem Premium'))}">↑ ${esc(L('افزودن PDF', 'Add PDF', 'PDF hinzufügen'))}<input type="file" accept="application/pdf,.pdf" data-upload ${canUpload ? '' : 'disabled'} hidden /></label></div></header>
      ${lib.error ? `<p class="card error-line">${esc(lib.error)}</p>` : ''}
      <div class="lib-grid"><aside class="card lib-tree">
          <button type="button" class="lib-node ${!lib.folderId ? 'is-on' : ''}" data-open-folder="" data-drop="">🏠 ${esc(L('همه فایل‌ها', 'All files', 'Alle Dateien'))}</button>
          ${lib.trail.map((x, i) => `<button type="button" class="lib-node ${i === lib.trail.length - 1 ? 'is-on' : ''}" data-open-folder="${esc(x.id)}" data-name="${esc(x.name)}" data-trail="${i}" data-drop="${esc(x.id)}" style="padding-inline-start:${12 + (i + 1) * 12}px">📁 ${esc(x.name)}</button>`).join('')}
        </aside>
        <section class="card lib-main"><div class="lib-crumb"><b>${lib.folderId ? `<button type="button" class="btn btn-ghost" data-act="back" data-drop="${esc(parent)}">← ${esc(L('بازگشت', 'Back', 'Zurück'))}</button> · ${esc(lib.trail[lib.trail.length - 1]?.name || L('پوشه', 'Folder', 'Ordner'))}` : esc(L('همه موارد', 'All items', 'Alle Einträge'))}</b>
          <span class="muted small">⇄ ${esc(L('بکشید و رها کنید', 'drag and drop', 'ziehen und ablegen'))}</span><small class="muted">${esc(L(`${count} مورد`, `${count} items`, `${count} Einträge`))}</small></div>
          ${lib.loading ? `<div class="empty-line">${esc(L('در حال بارگذاری…', 'Loading…', 'Wird geladen …'))}</div>` : `<div class="lib-items">
            ${d.folders.map((x) => `<article class="lib-card" data-open-folder="${esc(x.id)}" data-name="${esc(x.name)}" data-drop="${esc(x.id)}"><button type="button" class="qdel" data-del="folder:${esc(x.id)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button><div class="lib-icon">📁</div><h3 dir="auto">${esc(x.name)}</h3><p>${esc(L('پوشه', 'Folder', 'Ordner'))}</p></article>`).join('')}
            ${d.documents.map((x) => `<article class="lib-card" draggable="true" data-drag="document:${esc(x.id)}" data-open-pdf="${esc(x.id)}" data-title="${esc(x.title)}"><button type="button" class="qdel" data-del="document:${esc(x.id)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button><div class="lib-icon">📕</div><h3 dir="auto">${esc(x.title)}</h3><p>PDF · ${Math.max(0.1, x.size_bytes / 1048576).toFixed(1)} MB</p></article>`).join('')}
            ${d.notes.map((x) => `<article class="lib-card" draggable="true" data-drag="note:${esc(x.id)}" data-open-note="${esc(x.id)}"><button type="button" class="qdel" data-del="note:${esc(x.id)}" title="${esc(L('حذف', 'Delete', 'Löschen'))}">×</button><div class="lib-icon">📝</div><h3 dir="auto">${esc(x.title)}</h3><p dir="auto">${esc((x.content || L('یادداشت خالی', 'Empty note', 'Leere Notiz')).slice(0, 55))}</p></article>`).join('')}
            ${count ? '' : `<div class="empty-line">${esc(L('هنوز چیزی اینجا نیست. یک PDF یا یادداشت اضافه کنید.', 'Nothing here yet. Add a PDF or a note.', 'Noch leer. Füge ein PDF oder eine Notiz hinzu.'))}</div>`}</div>`}
        </section></div>
        <div class="free-study-library-divider"></div>${freeStudyHtml(ctx)}`;
    // the site's library screen carries the whole free-study desk under the file grid
    mountFreeStudy(root.querySelector('[data-fs-host]'), ctx, draw);
  };

  const promo = () => {
    const features = [
      ['📄', L('نوشتن روی PDF', 'Write on PDFs', 'Auf PDFs schreiben'), L('قلم، متن، هایلایت و زیرخط مستقیم روی صفحات', 'Pen, text, highlighting and underlining directly on pages', 'Stift, Text, Markieren und Unterstreichen direkt auf Seiten')],
      ['✍️', L('یادداشت و دست‌نویس', 'Notes and handwriting', 'Notizen und Handschrift'), L('نوشتن با قلم و ترکیب دست‌نویس با متن تایپی', 'Write with a stylus and combine handwriting with typed text', 'Mit Eingabestift schreiben und Handschrift mit Text kombinieren')],
      ['🗂️', L('پوشه‌بندی حرفه‌ای', 'Smart organization', 'Intelligente Ordnung'), L('ساخت پوشه و جابه‌جایی فایل‌ها با کشیدن و رهاکردن', 'Create folders and move files with drag and drop', 'Ordner erstellen und Dateien per Drag-and-drop verschieben')],
      ['🖍️', L('ابزارهای مطالعه دقیق', 'Precise study tools', 'Präzise Lernwerkzeuge'), L('هایلایت رنگی، زیرخط، متن و پاک‌کن برای مطالعه بهتر', 'Color highlights, underlining, text and eraser', 'Farbige Markierungen, Unterstreichen, Text und Radierer')],
      ['🔒', L('فضای کاملاً شخصی', 'Completely private', 'Vollständig privat'), L('فایل‌ها و نوشته‌ها فقط در حساب خودتان نگهداری می‌شوند', 'Your files and notes remain inside your account', 'Dateien und Notizen bleiben in deinem Konto')],
      ['☁️', L('ذخیره و دسترسی همیشگی', 'Saved and available', 'Gespeichert und verfügbar'), L('حفظ تغییرات و دسترسی دوباره از مرورگر و موبایل', 'Keep changes and reopen them on mobile or desktop', 'Änderungen auf Mobilgerät oder Computer wieder öffnen')],
    ];
    return `<section class="card empty-card lib-promo"><span class="milestone-chip">♛ ${esc(L('فضای مطالعه PREMIUM', 'PREMIUM STUDY SPACE', 'PREMIUM-LERNBEREICH'))}</span><div class="empty-emoji">📚</div><h1>${esc(L('کتابخانه‌ای که همراه مطالعه شماست', 'A library that studies with you', 'Eine Bibliothek, die mit dir lernt'))}</h1><p class="muted">${esc(L('PDFها، یادداشت‌ها و دست‌نویس‌های خود را در یک فضای شخصی و منظم نگه دارید.', 'Keep your PDFs, notes and handwriting organized in one private personal workspace.', 'Verwalte PDFs, Notizen und Handschrift geordnet in deinem privaten Arbeitsbereich.'))}</p>
      <div class="lib-features">${features.map((f) => `<article><i>${f[0]}</i><b>${esc(f[1])}</b><small>${esc(f[2])}</small></article>`).join('')}</div>
      <button type="button" class="btn btn-primary" data-act="premium">${esc(L('تهیه اشتراک Premium', 'Get Premium', 'Premium abonnieren'))}</button><small class="muted">${esc(L('پس از فعال‌سازی، این بخش فوراً برای حساب شما باز می‌شود.', 'This workspace opens immediately after Premium activation.', 'Nach der Aktivierung wird dieser Bereich sofort freigeschaltet.'))}</small></section>`;
  };

  /* ───────── notes ───────── */
  function openNote(note) {
    lib.editor = JSON.parse(JSON.stringify(note));
    lib.noteMode = null;
    lib.noteDirty = false;
    draw();
  }

  function drawNote() {
    const n = lib.editor;
    n.drawing = Array.isArray(n.drawing) ? n.drawing : [];
    const layout = noteLayout(n);
    const archived = n.drawing.filter((x) => x?.kind === 'ink_archived_sticker' && Array.isArray(x.strokes) && x.strokes.length);
    const hasSticker = n.drawing.some((x) => x.kind === 'ink_sticker_stroke' && Array.isArray(x.points) && x.points.length);
    lib.noteMode = lib.noteMode || ((layout.placed && hasSticker) || archived.length ? 'both' : n.content ? 'text' : 'handwriting');
    const placed = !!(layout.placed && hasSticker && lib.noteMode === 'both');
    const mode = lib.noteMode;
    root.innerHTML = `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">📝</span><div><p class="kicker">PERSONAL NOTE</p><h1>${esc(L('یادداشت شخصی', 'Personal note', 'Persönliche Notiz'))}</h1></div></div>
        <div class="row-actions"><button type="button" class="btn btn-primary" data-act="note-save">✓ ${esc(L('ذخیره', 'Save', 'Speichern'))} <kbd>Ctrl+S</kbd></button><button type="button" class="btn" data-act="note-close">✕ ${esc(L('بستن', 'Close', 'Schließen'))}</button></div></header>
      <section class="note-paper" style="background:${esc(n.color || '#fef3c7')}">
        <input id="noteTitle" class="note-title" value="${esc(n.title)}" maxlength="240" dir="auto" />
        <div class="segmented note-modes"><button type="button" data-note-mode="handwriting" class="${mode === 'handwriting' ? 'is-on' : ''}">${esc(L('دست‌نویس', 'Handwriting', 'Handschrift'))}</button><button type="button" data-note-mode="text" class="${mode === 'text' ? 'is-on' : ''}">${esc(L('تایپی', 'Typed', 'Getippt'))}</button><button type="button" data-note-mode="both" class="${mode === 'both' ? 'is-on' : ''}">${esc(L('ترکیبی', 'Combined', 'Kombiniert'))}</button></div>
        ${mode === 'both' ? `<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="note-clear-combined">${esc(L('پاکسازی صفحه', 'Clear page', 'Seite leeren'))}</button></div>` : ''}
        <div id="noteTextWrap" class="note-text-wrap" ${mode === 'handwriting' ? 'hidden' : ''}><textarea id="noteContent" dir="auto" placeholder="${placed || archived.length ? '' : esc(L('یادداشت خود را بنویسید…', 'Write your note…', 'Schreib deine Notiz …'))}">${esc(n.content || '')}</textarea>
          ${mode === 'both' ? archived.map((s) => `<div class="ink-sticker is-placed is-locked" style="left:${Math.max(0, Math.min(0.97, Number(s.x) || 0)) * 100}%;top:${Math.max(0, Math.min(0.97, Number(s.y) || 0)) * 100}%;width:${Math.max(0.03, Math.min(0.96, Number(s.w) || 0.3)) * 100}%;--ink-aspect:${Number(s.aspect) || 2}"><canvas class="ink-canvas" data-archive="${esc(s.id)}"></canvas></div>`).join('') : ''}</div>
        <div id="noteInkArea" ${mode !== 'handwriting' && !placed ? 'hidden' : ''}>
          ${mode === 'handwriting' ? `<div class="ink-toolbar"><button type="button" class="btn ${lib.noteTool === 'pen' ? 'btn-soft' : ''}" data-note-tool="pen">✎ ${esc(L('قلم', 'Pen', 'Stift'))}</button><button type="button" class="btn ${lib.noteTool === 'eraser' ? 'btn-soft' : ''}" data-note-tool="eraser">⌫ ${esc(L('پاک‌کن', 'Eraser', 'Radierer'))}</button>
            <input id="noteInkColor" type="color" value="${esc(lib.noteColor)}" /><label class="ink-size">${esc(L('اندازه قلم', 'Pen size', 'Stiftgröße'))}: <b id="noteInkWidthValue">${lib.noteWidth}</b><input id="noteInkWidth" type="range" min="1" max="12" value="${lib.noteWidth}" /></label>
            <button type="button" class="btn" data-act="ink-commit">⇅ ${esc(L('انتقال به ترکیبی', 'Move to combined', 'In „Kombiniert“ übernehmen'))}</button><button type="button" class="btn btn-ghost" data-act="ink-clear">${esc(L('پاک‌کردن همه دست‌نویس‌ها', 'Clear all handwriting', 'Alle Handschrift löschen'))}</button></div>` : ''}
          <div id="noteSticker" class="ink-sticker ${placed ? 'is-placed' : ''} ${placed && layout.locked ? 'is-locked' : ''}" style="${placed ? `left:${layout.x * 100}%;top:${layout.y * 100}%;width:${layout.w * 100}%;--ink-aspect:${layout.aspect || 2}` : ''}">
            ${placed && !layout.locked ? `<div class="sticker-controls"><button type="button" class="st-close" data-act="sticker-remove" title="${esc(L('حذف دست‌نویس', 'Remove handwriting', 'Handschrift entfernen'))}">×</button><button type="button" class="st-ok" data-act="sticker-confirm" title="${esc(L('چسباندن دست‌نویس', 'Stick it here', 'Hier fixieren'))}">✓</button><button type="button" class="st-size" data-sticker-size="-1" title="${esc(L('کوچک‌تر', 'Smaller', 'Kleiner'))}">↙</button><button type="button" class="st-size" data-sticker-size="1" title="${esc(L('بزرگ‌تر', 'Bigger', 'Größer'))}">↗</button><button type="button" class="st-handle" data-sticker-drag title="${esc(L('جابه‌جایی', 'Move', 'Verschieben'))}">⇄</button></div>` : ''}
            <canvas id="noteCanvas" class="ink-canvas ${placed ? 'is-sticker' : ''}"></canvas></div>
          ${placed && layout.locked ? `<button type="button" class="btn btn-ghost" data-act="sticker-edit">${esc(L('ویرایش دست‌نویس', 'Edit handwriting', 'Handschrift bearbeiten'))}</button>` : ''}
        </div>
      </section>`;
    if (placed) root.querySelector('#noteTextWrap').appendChild(root.querySelector('#noteSticker'));
    requestAnimationFrame(initNoteCanvas);
  }

  function initNoteCanvas() {
    const c = root.querySelector('#noteCanvas');
    const note = lib.editor;
    if (!c || !note) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(rect.width * ratio));
    c.height = Math.max(1, Math.round(rect.height * ratio));
    drawNoteInk();
    root.querySelectorAll('[data-archive]').forEach((canvas) => {
      const sticker = note.drawing.find((x) => x?.kind === 'ink_archived_sticker' && String(x.id) === canvas.dataset.archive);
      if (!sticker) return;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * ratio));
      canvas.height = Math.max(1, Math.round(r.height * ratio));
      const g = canvas.getContext('2d');
      (sticker.strokes || []).forEach((s) => drawPressure(g, s, canvas.width, canvas.height));
    });
    if (noteLayout(note).placed && lib.noteMode === 'both') return; // a placed sticker is moved, not drawn on
    let stroke = null;
    let erasing = false;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, Math.max(0.15, e.pressure || 0.5)]; };
    const eraseAt = (pt) => {
      const rows = note.drawing || [];
      let index = -1;
      let best = Infinity;
      rows.forEach((row, i) => {
        if (!Array.isArray(row?.points) || row.kind === 'ink_sticker_stroke') return;
        const distance = distPx(row, pt, c);
        const hit = (Number(row.width) || 3) * 0.8 * ratio + 2 * ratio;
        if (distance <= hit && distance < best) { best = distance; index = i; }
      });
      if (index >= 0) { rows.splice(index, 1); lib.noteDirty = true; drawNoteInk(); }
    };
    c.onpointerdown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      const pt = pos(e);
      if (lib.noteTool === 'eraser') { erasing = true; eraseAt(pt); return; }
      lib.noteDirty = true;
      stroke = { points: [pt], color: root.querySelector('#noteInkColor')?.value || lib.noteColor, width: Number(root.querySelector('#noteInkWidth')?.value) || lib.noteWidth, pointer: e.pointerType || 'unknown' };
      note.drawing.push(stroke);
    };
    c.onpointermove = (e) => {
      const active = e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pressure > 0 : e.buttons & 1;
      if (lib.noteTool === 'eraser' && erasing && active) { e.preventDefault(); eraseAt(pos(e)); return; }
      if (!stroke || !active) return;
      e.preventDefault();
      stroke.points.push(pos(e));
      drawNoteInk();
    };
    const end = (e) => {
      erasing = false;
      if (stroke) { stroke.points.push(pos(e)); stroke = null; }
      try { if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    c.onpointerup = end;
    c.onpointercancel = end;
  }

  function drawNoteInk() {
    const c = root.querySelector('#noteCanvas');
    const note = lib.editor;
    if (!c || !note) return;
    const g = c.getContext('2d');
    const showSticker = noteLayout(note).placed && lib.noteMode === 'both';
    g.clearRect(0, 0, c.width, c.height);
    for (const s of note.drawing || []) {
      if (!Array.isArray(s?.points)) continue;
      if (showSticker ? s.kind === 'ink_sticker_stroke' : s.kind !== 'ink_sticker_stroke') drawPressure(g, s, c.width, c.height);
    }
  }

  function readNoteFields() {
    const note = lib.editor;
    const title = root.querySelector('#noteTitle');
    const content = root.querySelector('#noteContent');
    if (title) note.title = title.value.trim() || note.title || L('بدون عنوان', 'Untitled', 'Ohne Titel');
    if (content) note.content = content.value;
  }

  /** Queued PATCHes so quick changes never overtake each other (site libraryQueueNoteSave). */
  function queueNoteSave(payload) {
    const note = lib.editor;
    const id = note.id;
    const revision = (lib.noteRevision += 1);
    lib.noteDirty = true;
    lib.noteQueue = lib.noteQueue.catch(() => {}).then(() => api('/notes/' + id, { method: 'PATCH', body: payload }));
    lib.noteQueue.then((r) => {
      if (fail(r)) return;
      if (lib.editor?.id === id && lib.noteRevision === revision) lib.noteDirty = false;
    });
    return lib.noteQueue;
  }

  async function saveNote(silent = false) {
    const note = lib.editor;
    if (!note) return true;
    readNoteFields();
    noteLayout(note);
    compactDrawing(note);
    busyStart(L('در حال ذخیره یادداشت…', 'Saving the note…', 'Notiz wird gespeichert …'));
    await lib.noteQueue.catch(() => {});
    const r = await api('/notes/' + note.id, { method: 'PATCH', body: { title: note.title, content: note.content, drawing: note.drawing } });
    busyEnd();
    if (fail(r)) return false;
    lib.noteDirty = false;
    if (lib.editor?.id === note.id) {
      const mode = lib.noteMode;
      lib.editor = r.data;
      lib.noteMode = mode;
    }
    if (!silent) toast(L('یادداشت ذخیره شد', 'Note saved', 'Notiz gespeichert'), 'ok');
    return true;
  }

  async function closeNote() {
    if (lib.editor) {
      readNoteFields();
      if (lib.noteDirty && !(await saveNote(true))) return;
    }
    lib.editor = null;
    lib.noteMode = null;
    load(lib.folderId);
  }

  function setNoteMode(mode) {
    readNoteFields();
    lib.noteMode = mode;
    draw();
  }

  function commitInk() {
    const note = lib.editor;
    const strokes = (note.drawing || []).filter((x) => Array.isArray(x?.points) && x.points.length && x.kind !== 'ink_sticker_stroke');
    if (!strokes.length) { toast(L('ابتدا با قلم چیزی بنویسید', 'Write something with the pen first', 'Schreib zuerst etwas mit dem Stift'), 'warn'); return; }
    const canvas = root.querySelector('#noteCanvas');
    const cw = Math.max(1, canvas?.clientWidth || 700);
    const ch = Math.max(1, canvas?.clientHeight || 430);
    const maxWidth = Math.max(...strokes.map((x) => Number(x.width) || 3));
    const padX = (maxWidth + 4) / cw;
    const padY = (maxWidth + 4) / ch;
    const points = strokes.flatMap((x) => x.points);
    const minX = Math.max(0, Math.min(...points.map((x) => x[0])) - padX);
    const maxX = Math.min(1, Math.max(...points.map((x) => x[0])) + padX);
    const minY = Math.max(0, Math.min(...points.map((x) => x[1])) - padY);
    const maxY = Math.min(1, Math.max(...points.map((x) => x[1])) + padY);
    const cropW = Math.max(0.01, maxX - minX);
    const cropH = Math.max(0.01, maxY - minY);
    const previous = note.drawing.filter((x) => x.kind === 'ink_sticker_stroke' && Array.isArray(x.points) && x.points.length);
    const prevLayout = noteLayout(note);
    if (previous.length && prevLayout.placed) {
      note.drawing.push({ kind: 'ink_archived_sticker', id: 'ink-' + Date.now().toString(36), x: prevLayout.x, y: prevLayout.y, w: prevLayout.w, aspect: prevLayout.aspect, strokes: previous.map((s) => ({ ...s, points: s.points.map((p) => [...p]) })) });
    }
    note.drawing = note.drawing.filter((x) => x.kind !== 'ink_sticker_stroke');
    strokes.forEach((s) => {
      s.points = s.points.map((p) => [(p[0] - minX) / cropW, (p[1] - minY) / cropH, p[2]]);
      s.kind = 'ink_sticker_stroke';
    });
    const layout = noteLayout(note);
    layout.placed = true;
    layout.locked = false;
    layout.w = Math.max(0.03, Math.min(0.96, cropW));
    layout.aspect = Math.max(0.08, Math.min(20, (cropW * cw) / (cropH * ch)));
    compactDrawing(note);
    readNoteFields();
    lib.noteMode = 'both';
    draw();
    queueNoteSave({ title: note.title, content: note.content, drawing: note.drawing });
    toast(L('دست‌نویس به بخش ترکیبی منتقل شد', 'Handwriting moved to the combined page', 'Handschrift in „Kombiniert“ übernommen'), 'ok');
  }

  function resizeSticker(direction) {
    const note = lib.editor;
    const layout = noteLayout(note);
    const sticker = root.querySelector('#noteSticker');
    const host = root.querySelector('#noteTextWrap');
    if (!layout.placed || layout.locked || !sticker || !host) return;
    const oldW = Math.max(0.03, Math.min(0.96, Number(layout.w) || 0.3));
    const newW = Math.max(0.03, Math.min(0.96, oldW * (direction < 0 ? 0.82 : 1.22)));
    const hr = host.getBoundingClientRect();
    const aspect = Math.max(0.08, Number(layout.aspect) || 2);
    const newH = hr.height ? (newW * hr.width) / aspect / hr.height : 0;
    layout.x = Math.max(0, Math.min(1 - newW, (Number(layout.x) || 0) + (oldW - newW) / 2));
    layout.y = Math.max(0, Math.min(Math.max(0, 1 - newH), Number(layout.y) || 0));
    layout.w = newW;
    lib.noteDirty = true;
    Object.assign(sticker.style, { width: newW * 100 + '%', left: layout.x * 100 + '%', top: layout.y * 100 + '%' });
  }

  function dragSticker(event) {
    const note = lib.editor;
    const layout = noteLayout(note);
    if (layout.locked) return;
    const sticker = root.querySelector('#noteSticker');
    const host = root.querySelector('#noteTextWrap');
    if (!sticker || !host) return;
    event.preventDefault();
    const hr = host.getBoundingClientRect();
    const sr = sticker.getBoundingClientRect();
    const ox = event.clientX - sr.left;
    const oy = event.clientY - sr.top;
    sticker.classList.add('is-moving');
    const move = (e) => {
      e.preventDefault();
      const left = Math.max(0, Math.min(Math.max(0, hr.width - sr.width), e.clientX - hr.left - ox));
      const top = Math.max(0, Math.min(Math.max(0, hr.height - sr.height), e.clientY - hr.top - oy));
      layout.x = hr.width ? left / hr.width : 0;
      layout.y = hr.height ? top / hr.height : 0;
      sticker.style.left = layout.x * 100 + '%';
      sticker.style.top = layout.y * 100 + '%';
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      sticker.classList.remove('is-moving');
      queueNoteSave({ drawing: note.drawing });
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end, { once: true });
    window.addEventListener('pointercancel', end, { once: true });
  }

  /* ───────── PDF workspace ───────── */
  const viewKey = (id) => 'amookht_pdf_view_' + id;
  const readView = (id) => { try { return JSON.parse(localStorage.getItem(viewKey(id)) || '{}'); } catch { return {}; } };
  const saveView = (p) => {
    if (!p?.id) return;
    const stage = root.querySelector('.pdf-stage');
    try { localStorage.setItem(viewKey(p.id), JSON.stringify({ page: p.page, scrollTop: stage?.scrollTop || 0, scrollLeft: stage?.scrollLeft || 0 })); } catch { /* ignore */ }
  };
  const pageAnnotations = () => lib.pdf.annotations.filter((x) => x.page_number === lib.pdf.page);

  async function openPdf(id, title) {
    const view = readView(id);
    lib.pdf = { id, title, page: Math.max(1, Number(view.page) || 1), pages: 1, tool: 'pen', color: '#ef4444', width: defaultInkWidth(), annotations: [], dirty: false, loading: true, restore: { top: Number(view.scrollTop) || 0, left: Number(view.scrollLeft) || 0 } };
    draw();
    try {
      if (!pdfjs) {
        pdfjs = await import('../../vendor/pdfjs/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      }
      const file = await ctx.bridge.libraryFile(id);
      if (!file.ok) throw new Error(file.error?.message || 'PDF load failed');
      const p = lib.pdf;
      p.doc = await pdfjs.getDocument({ data: file.bytes, isEvalSupported: false }).promise;
      p.pages = p.doc.numPages;
      p.page = Math.min(p.pages, p.page);
      const ann = await api('/documents/' + id + '/annotations');
      p.annotations = ann.ok && Array.isArray(ann.data) ? ann.data : [];
      p.loading = false;
      draw();
    } catch (error) {
      lib.pdf = null;
      toast(L('باز کردن PDF انجام نشد: ', 'Could not open the PDF: ', 'PDF konnte nicht geöffnet werden: ') + error.message, 'warn');
      draw();
    }
  }

  function drawPdf() {
    const p = lib.pdf;
    const tools = [['pen', '✎ ' + L('قلم', 'Pen', 'Stift')], ['highlight', '▰ ' + L('هایلایت', 'Highlight', 'Markieren')], ['underline', 'U ' + L('زیرخط', 'Underline', 'Unterstreichen')], ['text', 'T ' + L('متن', 'Text', 'Text')], ['eraser', '⌫ ' + L('پاک‌کن', 'Eraser', 'Radierer')]];
    root.innerHTML = `<section class="pdf-workspace"><header class="pdf-toolbar card">
        <button type="button" class="btn" data-act="pdf-close">✕ ${esc(L('بستن', 'Close', 'Schließen'))}</button><b class="pdf-title" dir="auto">${esc(p.title)}</b>
        ${tools.map(([id, label]) => `<button type="button" class="btn ${p.tool === id ? 'btn-soft' : 'btn-ghost'}" data-pdf-tool="${id}">${esc(label)}</button>`).join('')}
        <input id="pdfColor" type="color" value="${esc(p.color)}" /><label class="ink-size">${esc(L('اندازه', 'Size', 'Größe'))}: <b id="pdfWidthValue">${p.width}</b><input id="pdfWidth" type="range" min="1" max="12" value="${p.width}" /></label>
        <span class="pdf-pages">${p.page} / ${p.pages}</span><button type="button" class="btn btn-primary" data-act="pdf-save">💾 ${esc(L('ذخیره', 'Save', 'Speichern'))}</button></header>
      <main class="pdf-stage">${p.loading ? `<div class="empty-line"><span class="spinner"></span> ${esc(L('در حال آماده‌سازی فایل PDF…', 'Preparing the PDF…', 'PDF wird vorbereitet …'))}</div>` : `<div class="pdf-paper" id="pdfPaper"><button type="button" class="pdf-nav prev" data-pdf-page="-1" ${p.page <= 1 ? 'disabled' : ''} title="${esc(L('صفحه قبل', 'Previous page', 'Vorherige Seite'))}">‹</button><button type="button" class="pdf-nav next" data-pdf-page="1" ${p.page >= p.pages ? 'disabled' : ''} title="${esc(L('صفحه بعد', 'Next page', 'Nächste Seite'))}">›</button><canvas id="pdfCanvas"></canvas><canvas id="pdfAnnotations" class="pdf-ann"></canvas></div>`}</main></section>`;
    if (!p.loading) renderPdfPage();
  }

  async function renderPdfPage() {
    const p = lib.pdf;
    const canvas = root.querySelector('#pdfCanvas');
    const overlay = root.querySelector('#pdfAnnotations');
    if (!p?.doc || !canvas || !overlay) return;
    const page = await p.doc.getPage(p.page);
    const base = page.getViewport({ scale: 1 });
    const stage = root.querySelector('.pdf-stage');
    const max = Math.min(1050, (stage?.clientWidth || window.innerWidth) - 35);
    const viewport = page.getViewport({ scale: Math.max(0.6, max / base.width) });
    const desired = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const scale = Math.min(desired, Math.sqrt(16000000 / (viewport.width * viewport.height)));
    const pw = Math.max(1, Math.floor(viewport.width * scale));
    const ph = Math.max(1, Math.floor(viewport.height * scale));
    p.outputScale = scale;
    [canvas, overlay].forEach((c) => { c.width = pw; c.height = ph; c.style.width = viewport.width + 'px'; c.style.height = viewport.height + 'px'; });
    Object.assign(root.querySelector('#pdfPaper').style, { width: viewport.width + 'px', height: viewport.height + 'px' });
    await page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: scale === 1 ? null : [scale, 0, 0, scale, 0, 0] }).promise;
    drawAnnotations();
    bindAnnotations();
    if (p.restore && stage) { stage.scrollTop = p.restore.top || 0; stage.scrollLeft = p.restore.left || 0; p.restore = null; }
  }

  function drawAnnotations() {
    const p = lib.pdf;
    const c = root.querySelector('#pdfAnnotations');
    if (!p || !c) return;
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    for (const a of pageAnnotations()) {
      const d = a.payload || {};
      g.save();
      g.strokeStyle = d.color || '#ef4444';
      g.fillStyle = d.color || '#ef4444';
      g.lineWidth = (d.width || 3) * (p.outputScale || 1);
      g.lineCap = 'round';
      g.globalAlpha = a.annotation_type === 'highlight' ? 0.28 : 1;
      if (a.annotation_type === 'pen' || a.annotation_type === 'highlight') {
        g.beginPath();
        (d.points || []).forEach((pt, i) => { const x = pt[0] * c.width; const y = pt[1] * c.height; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
        g.stroke();
      } else if (['underline', 'strikeout'].includes(a.annotation_type)) {
        g.beginPath();
        g.moveTo(d.x1 * c.width, d.y1 * c.height);
        g.lineTo(d.x2 * c.width, d.y2 * c.height);
        g.stroke();
      } else if (a.annotation_type === 'text') {
        g.font = `${(d.size || 18) * (p.outputScale || 1)}px sans-serif`;
        g.fillText(d.text || '', d.x * c.width, d.y * c.height);
      }
      g.restore();
    }
  }

  function bindAnnotations() {
    const c = root.querySelector('#pdfAnnotations');
    const p = lib.pdf;
    if (!c || !p) return;
    let drawing = false;
    let current = null;
    let erasing = false;
    let movingText = null;
    let offset = [0, 0];
    let holdTimer = null;
    let dragReady = false;
    let moved = false;
    let start = null;
    const os = () => p.outputScale || 1;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, Math.max(0.15, e.pressure || 0.5)]; };
    const textAt = (pt) => {
      const all = pageAnnotations();
      for (let i = all.length - 1; i >= 0; i -= 1) {
        const item = all[i];
        if (item.annotation_type !== 'text') continue;
        const d = item.payload || {};
        const size = (Number(d.size) || 18) * os();
        const x = (Number(d.x) || 0) * c.width;
        const y = (Number(d.y) || 0) * c.height;
        const w = Math.max(size * 0.8, String(d.text || '').length * size * 0.62);
        const px = pt[0] * c.width;
        const py = pt[1] * c.height;
        if (px >= x - 8 * os() && px <= x + w + 8 * os() && py >= y - size - 8 * os() && py <= y + 8 * os()) return item;
      }
      return null;
    };
    const eraseAt = (pt) => {
      const text = textAt(pt);
      if (text) { p.annotations = p.annotations.filter((x) => x !== text); p.dirty = true; drawAnnotations(); return; }
      const all = pageAnnotations();
      let target = null;
      let best = Infinity;
      for (let i = all.length - 1; i >= 0; i -= 1) {
        const item = all[i];
        const distance = distPx(item, pt, c);
        const width = Number((item.payload || {}).width) || 3;
        const hit = (item.annotation_type === 'text' ? 10 : Math.max(3, width / 2 + 2)) * os();
        if (distance <= hit && distance < best) { best = distance; target = item; }
      }
      if (target) { p.annotations = p.annotations.filter((x) => x !== target); p.dirty = true; drawAnnotations(); }
    };
    c.onpointerdown = async (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch { /* synthetic or lost pointer */ }
      const pt = pos(e);
      if (p.tool === 'eraser') { erasing = true; eraseAt(pt); return; }
      movingText = textAt(pt);
      if (movingText) {
        const d = movingText.payload || {};
        offset = [pt[0] - (Number(d.x) || 0), pt[1] - (Number(d.y) || 0)];
        dragReady = false;
        moved = false;
        start = { x: e.clientX, y: e.clientY };
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => { if (movingText) dragReady = true; }, 380);
        return;
      }
      if (p.tool === 'text') {
        const text = await promptDialog({ title: L('افزودن متن روی PDF', 'Add text to the PDF', 'Text auf dem PDF'), description: L('متن در نقطه انتخاب‌شده قرار می‌گیرد.', 'The text is placed where you clicked.', 'Der Text wird an der gewählten Stelle eingefügt.'), placeholder: L('متن خود را بنویسید', 'Your text', 'Dein Text'), multiline: true, confirmText: L('افزودن متن', 'Add text', 'Text hinzufügen'), icon: 'T', maxLength: 2000 });
        if (text) { p.annotations.push({ page_number: p.page, annotation_type: 'text', payload: { x: pt[0], y: pt[1], text, color: p.color, size: Math.max(12, p.width * 5) } }); p.dirty = true; drawAnnotations(); }
        return;
      }
      drawing = true;
      const width = Number(root.querySelector('#pdfWidth')?.value) || p.width;
      current = { page_number: p.page, annotation_type: p.tool, payload: { color: root.querySelector('#pdfColor')?.value || p.color, width: p.tool === 'highlight' ? Math.max(10, width * 4) : width, points: [pt], x1: pt[0], y1: pt[1], x2: pt[0], y2: pt[1], pointer: e.pointerType || 'unknown' } };
      p.annotations.push(current);
    };
    c.onpointermove = (e) => {
      if (movingText) {
        e.preventDefault();
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) moved = true;
        if (!dragReady) return;
        const pt = pos(e);
        const d = movingText.payload || {};
        d.x = Math.max(0, Math.min(1, pt[0] - offset[0]));
        d.y = Math.max(0, Math.min(1, pt[1] - offset[1]));
        p.dirty = true;
        drawAnnotations();
        return;
      }
      const active = e.pointerType === 'touch' || e.pointerType === 'pen' ? e.pressure > 0 : e.buttons & 1;
      if (p.tool === 'eraser' && erasing && active) { e.preventDefault(); eraseAt(pos(e)); return; }
      if (!drawing || !current) return;
      e.preventDefault();
      const pt = pos(e);
      if (['pen', 'highlight'].includes(p.tool)) current.payload.points.push(pt);
      else { current.payload.x2 = pt[0]; current.payload.y2 = pt[1]; }
      p.dirty = true;
      drawAnnotations();
    };
    const reset = (e) => {
      drawing = false; erasing = false; movingText = null; current = null; dragReady = false; moved = false; start = null;
      clearTimeout(holdTimer);
      try { if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    c.onpointerup = async (e) => {
      clearTimeout(holdTimer);
      const target = movingText;
      const tap = target && !dragReady && !moved;
      reset(e);
      if (tap) {
        const d = target.payload || {};
        const edited = await promptDialog({ title: L('ویرایش متن', 'Edit text', 'Text bearbeiten'), value: String(d.text || ''), multiline: true, confirmText: L('ذخیره تغییرات', 'Save changes', 'Änderungen speichern'), icon: 'T', maxLength: 2000 });
        if (edited) { d.text = edited; p.dirty = true; drawAnnotations(); }
      }
    };
    c.onpointercancel = reset;
  }

  async function saveAnnotations(silent = false) {
    const p = lib.pdf;
    if (!p || !p.dirty) return;
    busyStart(L('در حال ذخیره نوشته‌ها و علامت‌گذاری‌های PDF…', 'Saving your PDF marks…', 'Markierungen werden gespeichert …'));
    const rows = pageAnnotations().map((x) => ({ annotation_type: x.annotation_type, payload: x.payload }));
    const r = await api('/documents/' + p.id + '/annotations/' + p.page, { method: 'PUT', body: { annotations: rows } });
    busyEnd();
    if (r.ok) { p.dirty = false; if (!silent) toast(L('حاشیه‌نویسی ذخیره شد', 'Annotations saved', 'Markierungen gespeichert'), 'ok'); }
    else if (!silent) fail(r);
  }

  async function pdfPage(delta) {
    await saveAnnotations(true);
    const p = lib.pdf;
    p.page = Math.max(1, Math.min(p.pages, p.page + delta));
    p.restore = { top: 0, left: 0 };
    saveView(p);
    draw();
  }

  async function closePdf() {
    saveView(lib.pdf);
    await saveAnnotations(true);
    lib.pdf = null;
    draw();
  }

  /* ───────── folder actions ───────── */
  async function moveItem(item, folderId) {
    folderId = folderId || null;
    if (lib.moving || !item || !['document', 'note'].includes(item.kind) || !item.id) return;
    if (folderId === (lib.folderId || null)) return;
    lib.moving = true;
    const r = await api('/' + (item.kind === 'document' ? 'documents' : 'notes') + '/' + encodeURIComponent(item.id), { method: 'PATCH', body: { folder_id: folderId } });
    lib.moving = false;
    if (fail(r)) return;
    toast(L('مورد به محل جدید منتقل شد', 'Moved', 'Verschoben'), 'ok');
    load(lib.folderId);
  }

  async function uploadPdf(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    busyStart(L('در حال آپلود ', 'Uploading ', 'Wird hochgeladen: ') + file.name + '…');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const r = await ctx.bridge.libraryUpload({ name: file.name, bytes, folderId: lib.folderId || '' });
    busyEnd();
    input.value = '';
    if (!fail(r)) load(lib.folderId);
  }

  /* ───────── events ───────── */
  root.addEventListener('click', async (event) => {
    const el = event.target.closest('button, [data-open-folder], [data-open-pdf], [data-open-note]');
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.del) {
      event.stopPropagation();
      const [kind, id] = d.del.split(':');
      if (!(await confirmDialog(L('این مورد حذف شود؟', 'Delete this item?', 'Diesen Eintrag löschen?')))) return;
      const r = await api('/' + (kind === 'folder' ? 'folders' : kind === 'document' ? 'documents' : 'notes') + '/' + id, { method: 'DELETE' });
      if (!fail(r)) load(lib.folderId);
    } else if (d.openFolder !== undefined && !lib.editor && !lib.pdf) {
      if (!d.openFolder) lib.trail = [];
      else if (d.trail !== undefined) lib.trail = lib.trail.slice(0, Number(d.trail) + 1);
      else lib.trail.push({ id: d.openFolder, name: d.name });
      load(d.openFolder || null);
    } else if (d.openPdf) openPdf(d.openPdf, d.title);
    else if (d.openNote) { const note = (lib.data.notes || []).find((x) => String(x.id) === d.openNote); if (note) openNote(note); }
    else if (d.noteMode) setNoteMode(d.noteMode);
    else if (d.noteTool) { lib.noteTool = d.noteTool; root.querySelectorAll('[data-note-tool]').forEach((b) => b.classList.toggle('btn-soft', b === el)); }
    else if (d.stickerSize) resizeSticker(Number(d.stickerSize));
    else if (d.pdfTool) {
      lib.pdf.tool = d.pdfTool;
      root.querySelectorAll('[data-pdf-tool]').forEach((b) => { b.classList.toggle('btn-soft', b === el); b.classList.toggle('btn-ghost', b !== el); });
      if (d.pdfTool === 'text') toast(L('روی صفحه PDF کلیک کنید و متن را وارد کنید', 'Click on the page to place text', 'Klicke auf die Seite, um Text einzufügen'));
    } else if (d.pdfPage) pdfPage(Number(d.pdfPage));
    else {
      switch (d.act) {
        case 'folder': {
          const name = await promptDialog({ title: L('ساخت پوشه جدید', 'New folder', 'Neuer Ordner'), description: L('برای مرتب‌سازی فایل‌ها و یادداشت‌ها یک نام انتخاب کنید.', 'Pick a name to organise your files and notes.', 'Wähle einen Namen für deine Dateien und Notizen.'), placeholder: L('نام پوشه', 'Folder name', 'Ordnername'), confirmText: L('ساخت پوشه', 'Create folder', 'Ordner erstellen'), icon: '📁', maxLength: 120 });
          if (!name) return;
          const r = await api('/folders', { method: 'POST', body: { name, parent_id: lib.folderId, color: '#7c3aed' } });
          if (!fail(r)) load(lib.folderId);
          break;
        }
        case 'note': {
          const title = await promptDialog({ title: L('یادداشت جدید', 'New note', 'Neue Notiz'), description: L('یک عنوان کوتاه و مشخص برای یادداشت بنویسید.', 'Give the note a short title.', 'Gib der Notiz einen kurzen Titel.'), placeholder: L('عنوان یادداشت', 'Note title', 'Titel'), confirmText: L('ایجاد یادداشت', 'Create note', 'Notiz erstellen'), icon: '📝', maxLength: 240 });
          if (!title) return;
          const r = await api('/notes', { method: 'POST', body: { title, content: '', folder_id: lib.folderId, color: '#fef3c7' } });
          if (!fail(r)) openNote(r.data);
          break;
        }
        case 'back': lib.trail.pop(); load(lib.trail[lib.trail.length - 1]?.id || null); break;
        case 'premium': ctx.switchToSite('library'); break;
        case 'note-save': saveNote(); break;
        case 'note-close': closeNote(); break;
        case 'ink-commit': commitInk(); break;
        case 'ink-clear': {
          if (!(await confirmDialog(L('همه دست‌نویس‌ها پاک شوند؟', 'Clear all handwriting?', 'Alle Handschrift löschen?')))) return;
          const note = lib.editor;
          const layout = noteLayout(note);
          if (lib.noteMode === 'handwriting') note.drawing = note.drawing.filter((x) => ['ink_layout', 'ink_sticker_stroke', 'ink_archived_sticker'].includes(x.kind));
          else { note.drawing = note.drawing.filter((x) => x.kind !== 'ink_sticker_stroke'); layout.placed = false; layout.locked = false; }
          lib.noteDirty = true;
          readNoteFields();
          draw();
          break;
        }
        case 'note-clear-combined': {
          if (!(await confirmDialog(L('تمام متن و دست‌نوشته‌های چسبانده‌شده در صفحه ترکیبی پاک شوند؟', 'Clear all text and placed handwriting from the combined page?', 'Alle Texte und eingefügten Handschriften auf der kombinierten Seite löschen?')))) return;
          const note = lib.editor;
          note.content = '';
          note.drawing = note.drawing.filter((x) => x?.kind === 'ink_layout' || (Array.isArray(x?.points) && x.kind !== 'ink_sticker_stroke'));
          const layout = noteLayout(note);
          layout.placed = false;
          layout.locked = false;
          draw();
          queueNoteSave({ content: '', drawing: note.drawing });
          break;
        }
        case 'sticker-confirm': {
          const note = lib.editor;
          noteLayout(note).locked = true;
          compactDrawing(note);
          readNoteFields();
          draw();
          queueNoteSave({ drawing: note.drawing });
          toast(L('دست‌نویس در محل خود چسبانده شد', 'Handwriting fixed in place', 'Handschrift fixiert'), 'ok');
          break;
        }
        case 'sticker-edit': noteLayout(lib.editor).locked = false; readNoteFields(); lib.noteMode = 'both'; draw(); break;
        case 'sticker-remove': {
          const note = lib.editor;
          note.drawing = note.drawing.filter((x) => x.kind !== 'ink_sticker_stroke');
          noteLayout(note).placed = false;
          readNoteFields();
          draw();
          queueNoteSave({ drawing: note.drawing });
          break;
        }
        case 'pdf-save': saveAnnotations(); break;
        case 'pdf-close': closePdf(); break;
        default:
      }
    }
  });

  root.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-sticker-drag]')) dragSticker(event);
  });
  root.addEventListener('input', (event) => {
    const t = event.target;
    if (t.id === 'noteTitle' || t.id === 'noteContent') lib.noteDirty = true;
    else if (t.id === 'noteInkColor') lib.noteColor = t.value;
    else if (t.id === 'noteInkWidth') { lib.noteWidth = Number(t.value); root.querySelector('#noteInkWidthValue').textContent = t.value; }
    else if (t.id === 'pdfColor') lib.pdf.color = t.value;
    else if (t.id === 'pdfWidth') { lib.pdf.width = Number(t.value); root.querySelector('#pdfWidthValue').textContent = t.value; }
  });
  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-upload]')) uploadPdf(event.target);
  });

  // drag and drop: documents and notes onto folders, the tree or "back"
  root.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-drag]');
    if (!card) return;
    const [kind, id] = card.dataset.drag.split(':');
    event.dataTransfer.setData('application/x-amookht-library', JSON.stringify({ kind, id }));
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
  });
  root.addEventListener('dragend', () => root.querySelectorAll('.is-dragging, .is-drop').forEach((x) => x.classList.remove('is-dragging', 'is-drop')));
  root.addEventListener('dragover', (event) => {
    const target = event.target.closest('[data-drop]');
    if (!target) return;
    event.preventDefault();
    root.querySelectorAll('.is-drop').forEach((x) => x !== target && x.classList.remove('is-drop'));
    target.classList.add('is-drop');
  });
  root.addEventListener('drop', (event) => {
    const target = event.target.closest('[data-drop]');
    if (!target) return;
    event.preventDefault();
    let item = null;
    try { item = JSON.parse(event.dataTransfer.getData('application/x-amookht-library') || 'null'); } catch { item = null; }
    root.querySelectorAll('.is-drop').forEach((x) => x.classList.remove('is-drop'));
    moveItem(item, target.dataset.drop || null);
  });

  // keyboard: Ctrl+S saves the note / the PDF page, Esc closes, ←/→ change PDF pages
  root.onKey = (event) => {
    if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
      if (lib.editor) { saveNote(); return true; }
      if (lib.pdf) { saveAnnotations(); return true; }
    }
    const typing = event.target.matches && event.target.matches('input, textarea, select');
    if (lib.pdf && !typing && !event.ctrlKey && !event.altKey) {
      if (event.key === 'PageDown' || event.key === (document.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')) { if (lib.pdf.page < lib.pdf.pages) pdfPage(1); return true; }
      if (event.key === 'PageUp' || event.key === (document.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft')) { if (lib.pdf.page > 1) pdfPage(-1); return true; }
    }
    return false;
  };

  // live updates from other devices (site libraryRealtimeScheduleRefresh)
  let refreshTimer = null;
  const offEvents = ctx.bridge.onLibraryEvent((message) => {
    if (!root.isConnected) return;
    if (message.item_kind === 'document' && message.action === 'annotations' && lib.pdf?.id === message.item_id) {
      if (lib.pdf.dirty) return;
      api('/documents/' + encodeURIComponent(message.item_id) + '/annotations').then((r) => {
        if (r.ok && lib.pdf?.id === message.item_id) { lib.pdf.annotations = r.data; drawAnnotations(); }
      });
      return;
    }
    if (message.item_kind === 'note' && lib.editor?.id === message.item_id) {
      if (message.action === 'deleted') { lib.editor = null; toast(L('این یادداشت در دستگاه دیگری حذف شد.', 'This note was deleted on another device.', 'Diese Notiz wurde auf einem anderen Gerät gelöscht.'), 'warn'); load(lib.folderId); return; }
      if (lib.noteDirty) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        const r = await api(lib.folderId ? '?folder_id=' + encodeURIComponent(lib.folderId) : '');
        if (!r.ok) return;
        lib.data = r.data;
        const fresh = (r.data.notes || []).find((x) => String(x.id) === String(message.item_id));
        if (fresh && lib.editor?.id === fresh.id && !lib.noteDirty) { const mode = lib.noteMode; lib.editor = fresh; lib.noteMode = mode; draw(); }
      }, 90);
      return;
    }
    if ((lib.editor && lib.noteDirty) || lib.pdf) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { if (!lib.loading && !lib.editor) load(lib.folderId); }, 120);
  });
  ctx.bridge.libraryEvents(true);
  root.onLeave = async () => {
    persistFreeStudy(ctx);
    offEvents();
    ctx.bridge.libraryEvents(false);
    if (lib.editor) { readNoteFields(); if (lib.noteDirty) await saveNote(true); }
    if (lib.pdf) { saveView(lib.pdf); await saveAnnotations(true); }
  };

  if (lib.editor || lib.pdf) draw();
  else load(lib.folderId);
  // LIB-I18N: the library had no store watcher, so a language change left the whole page in the old language.
  root.onStoreChange = (paths) => {
    if (!paths.some((p) => p === '*' || p === 'uiLanguage')) return;
    draw();
  };
  return root;
}
