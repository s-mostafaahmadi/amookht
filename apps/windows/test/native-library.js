'use strict';

/* Live test of the native library on the TEST account only:
     node test/make-test-profile.js <dir>
     npx electron test/native-library.js --user-data-dir=<dir>     (SHOTS=<dir> for screenshots)
   Creates a folder, a note (handwriting → combined sticker + typed text), uploads a 2-page PDF,
   draws on it, moves the note into the folder by drag-and-drop, checks everything on the
   server, then deletes what it created. */

const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
process.argv.push('--native');
require(path.join(__dirname, '..', 'electron', 'main.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) failed += 1;
};

/** A minimal valid 2-page PDF (Helvetica text), built by hand with a correct xref table. */
function tinyPdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = (text) => { const s = `BT /F1 28 Tf 72 760 Td (${text}) Tj ET`; return `<< /Length ${s.length} >>\nstream\n${s}\nendstream`; };
  objs[3] = stream('Amookht Testseite 1');
  objs[5] = stream('Amookht Testseite 2');
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

app.whenReady().then(async () => {
  await wait(9000);
  const win = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('amookht://app/'));
  if (!win) { console.log('FAIL no native window'); app.exit(1); return; }
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2 && !/Security Warning/.test(message)) console.log('console:', message); });
  const js = (code) => win.webContents.executeJavaScript(code);
  const click = (sel) => js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.click(); return true; })()`);
  const answerDialog = async (text) => {
    await wait(150);
    await js(`(() => { const f = document.querySelector('.dialog-field'); f.value = ${JSON.stringify(text)}; document.querySelector('.dialog [data-v="1"]').click(); return true; })()`);
  };
  const lib = async (folder) => (await js(`window.amookht.api('/v1/library${folder ? '?folder_id=' + folder : ''}')`)).data;
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(process.env.SHOTS, name + '.png'), img.resize({ width: 1200 }).toPNG());
  };
  // draws a short stroke with pointer events on a canvas
  const stroke = (sel, pts) => js(`(() => {
    const c = document.querySelector(${JSON.stringify(sel)}); if (!c) return false;
    const r = c.getBoundingClientRect(); const pts = ${JSON.stringify(pts)};
    const ev = (type, [x, y], buttons) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: r.left + x * r.width, clientY: r.top + y * r.height, buttons, button: 0, pointerId: 7, pointerType: 'mouse', pressure: 0.5 }));
    ev('pointerdown', pts[0], 1); pts.slice(1).forEach((p) => ev('pointermove', p, 1)); ev('pointerup', pts[pts.length - 1], 0); return true; })()`);

  const email = await js('__amk.app.account && __amk.app.account.email');
  if (!/^windows-app-test@/.test(email || '')) { console.log('FAIL refusing to write: not the test account', email); app.exit(1); return; }
  const stamp = Date.now().toString(36);

  await click('[data-nav="library"]');
  await wait(2500);
  report(await js(`!!document.querySelector('[data-act="folder"]')`), 'library opens for Premium (no promo)');

  /* folder */
  await click('[data-act="folder"]');
  await answerDialog('Testordner ' + stamp);
  await wait(2500);
  let list = await lib();
  const folder = list.folders.find((f) => f.name === 'Testordner ' + stamp);
  report(!!folder, 'folder created', folder && folder.name);

  /* note: handwriting → combined sticker → typed text */
  await click('[data-act="note"]');
  await answerDialog('Testnotiz ' + stamp);
  await wait(1800);
  report(await js(`!!document.querySelector('#noteCanvas') && document.querySelector('[data-note-mode="handwriting"]').classList.contains('is-on')`), 'new note opens in handwriting mode');
  await stroke('#noteCanvas', [[0.2, 0.05], [0.3, 0.07], [0.4, 0.05], [0.5, 0.08]]);
  await stroke('#noteCanvas', [[0.25, 0.1], [0.45, 0.11]]);
  await click('[data-act="ink-commit"]');
  await wait(1800);
  report(await js(`!!document.querySelector('#noteSticker.is-placed') && document.querySelector('[data-note-mode="both"]').classList.contains('is-on')`), 'handwriting becomes a sticker on the combined page');
  await click('[data-act="sticker-confirm"]');
  await wait(800);
  await js(`(() => { const t = document.querySelector('#noteContent'); t.value = 'Getippter Text ${stamp}'; t.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await shot('lib-note');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }))`);
  await wait(2500);
  list = await lib();
  const note = list.notes.find((n) => n.title === 'Testnotiz ' + stamp);
  const layout = note && (note.drawing || []).find((x) => x.kind === 'ink_layout');
  const sticker = note && (note.drawing || []).filter((x) => x.kind === 'ink_sticker_stroke');
  report(!!note && note.content === 'Getippter Text ' + stamp, 'Ctrl+S saves the typed text', note && note.content);
  report(!!layout && layout.placed && layout.locked && sticker.length === 2, 'handwriting saved in the site format (placed, locked, 2 strokes)', layout && { placed: layout.placed, locked: layout.locked, strokes: sticker.length, aspect: Math.round(layout.aspect * 100) / 100 });
  report(sticker.every((s) => s.points.every((p) => p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1)), 'sticker points normalised to 0..1');
  await click('[data-act="note-close"]');
  await wait(2000);

  /* PDF upload, open, draw, save */
  const bytes = [...tinyPdf()];
  const up = await js(`window.amookht.libraryUpload({ name: 'Testdatei-${stamp}.pdf', bytes: new Uint8Array(${JSON.stringify(bytes)}), folderId: '' })`);
  report(up.ok && up.data && up.data.id, 'PDF upload through the app', up.ok ? up.data.title : up.error);
  await js(`document.querySelector('[data-nav="favorites"]').click(); true`);
  await wait(300);
  await click('[data-nav="library"]');
  await wait(2500);
  await click(`[data-open-pdf="${up.data.id}"]`);
  await wait(5000);
  const pdfInfo = await js(`({ pages: document.querySelector('.pdf-pages')?.textContent, w: document.querySelector('#pdfCanvas')?.width, painted: (() => { const c = document.querySelector('#pdfCanvas'); if (!c) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, Math.min(c.height, 300)).data; let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 100) dark++; return dark; })() })`);
  report(pdfInfo.pages === '1 / 2' && pdfInfo.painted > 50, 'PDF opens and page 1 is rendered', pdfInfo);
  await stroke('#pdfAnnotations', [[0.1, 0.3], [0.3, 0.32], [0.5, 0.3]]);
  await click('[data-pdf-tool="highlight"]');
  await stroke('#pdfAnnotations', [[0.1, 0.4], [0.6, 0.4]]);
  await shot('lib-pdf');
  await click('[data-act="pdf-save"]');
  await wait(2000);
  const ann = (await js(`window.amookht.api('/v1/library/documents/${up.data.id}/annotations')`)).data || [];
  report(ann.length === 2 && ann.some((a) => a.annotation_type === 'pen') && ann.some((a) => a.annotation_type === 'highlight' && a.payload.width >= 10), 'pen + highlight saved for page 1', ann.map((a) => a.annotation_type));
  await click('[data-pdf-page="1"]');
  await wait(1500);
  report(await js(`document.querySelector('.pdf-pages')?.textContent === '2 / 2'`), 'next page works');
  await click('[data-act="pdf-close"]');
  await wait(2000);

  /* drag the note into the folder */
  await js(`(() => {
    const card = document.querySelector('[data-drag="note:${note.id}"]'); const target = document.querySelector('[data-drop="${folder.id}"].lib-card');
    const dt = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    return true; })()`);
  await wait(2500);
  const inFolder = await lib(folder.id);
  report(inFolder.notes.some((n) => n.id === note.id), 'drag-and-drop moves the note into the folder');
  await click(`[data-open-folder="${folder.id}"]`);
  await wait(1500);
  report(await js(`!!document.querySelector('[data-open-note="${note.id}"]') && document.querySelectorAll('.lib-node').length === 2`), 'folder opens with the note, tree shows the trail');
  await shot('lib-folder');

  /* cleanup through the API */
  await js(`window.amookht.api('/v1/library/notes/${note.id}', { method: 'DELETE' })`);
  await js(`window.amookht.api('/v1/library/documents/${up.data.id}', { method: 'DELETE' })`);
  await js(`window.amookht.api('/v1/library/folders/${folder.id}', { method: 'DELETE' })`);
  await wait(800);
  const after = await lib();
  report(!after.folders.some((f) => f.id === folder.id) && !after.documents.some((d) => d.id === up.data.id), 'test items cleaned up');
  app.exit(failed ? 1 : 0);
});
