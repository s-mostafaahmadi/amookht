// «شبیه‌سازی آزمون» (EXAM-SIM, 4.3.0): the exam choice (TestDaF / ÖSD) above the simulators. The learning plan is the
// same for everyone; user.examPlan only says which exam is simulated. TestDaF = the ported site simulator
// (testdaf-sim.js); ÖSD Zertifikat B2 = the site's own amk-osd-sim.js + osd-sim-data.js (loaded as classic scripts in
// index.html, driven through window.AMK_OSD_HOST; audio and pictures ship in osd-sim/).

import { lang } from '../core/i18n.js';
import { toast } from '../core/ui.js';
import { mutate } from '../core/learning.js';
import { confirmDialog } from './widgets.js';
import { renderTestdafSim } from './testdaf-sim.js';
import * as ss from './sim-score.js'; // SIM-SCORE

const L = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);

export function renderExamSim(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page exam-sim';
  const Sim = window.AmkOsdSim;
  const exam = () => ((ctx.store.get('user') || {}).examPlan === 'oesd' ? 'oesd' : 'testdaf');
  const premium = () => { const a = ctx.account || {}; return !!(a.premium || a.admin || a.owner); };
  let shown = '';
  let tdf = null;

  function draw() {
    if (!Sim) { root.appendChild(renderTestdafSim(page, ctx)); return; }
    const cur = exam();
    if (cur === 'oesd') {
      tdf = null;
      if (!premium()) {
        root.innerHTML = Sim.shell(Sim.chooser(cur) + `<section class="card empty-card"><p>${L('شبیه‌سازی آزمون فقط برای حساب Premium فعال است.', 'The exam simulation is available with Premium.', 'Die Prüfungssimulation ist mit Premium verfügbar.')}</p></section>`);
      } else {
        const y = shown === 'oesd' ? window.scrollY : 0;
        let body = Sim.render();
        try { if (Sim.state().view === 'overview') { const p = ss.osdPanel(ctx, Sim); if (p) body = body.replace('<section class="osd-mods">', p + '<section class="osd-mods">'); } } catch (e) { console.warn('sim score panel', e); }
        root.innerHTML = Sim.shell(Sim.chooser(cur) + body);
        if (y) window.scrollTo(0, y);
      }
    } else if (shown !== 'testdaf' || !tdf || !tdf.isConnected) {
      Sim.stopAudio();
      root.innerHTML = `<div class="exam-sim-choose">${Sim.chooser(cur)}</div>`;
      tdf = renderTestdafSim(page, ctx);
      root.appendChild(tdf);
    }
    shown = cur;
    if (ctx.afterDraw) ctx.afterDraw();
  }

  window.AMK_OSD_HOST = {
    base: 'osd-sim/',
    lang: () => lang(),
    userKey: () => (ctx.account && (ctx.account.email || ctx.account.id)) || 'guest',
    getExam: exam,
    setExam: (v) => { mutate(ctx.store, 'user', {}, (u) => { u.examPlan = v === 'oesd' ? 'oesd' : 'testdaf'; return u; }); draw(); },
    rerender: () => { if (root.isConnected) draw(); },
    confirm: (m) => confirmDialog(m, { ok: L('تأیید', 'OK', 'OK'), danger: false }),
    alert: (m) => toast(m, 'warn'),
  };
  window.AmkSimScore = { upload: ss.osdUploader(ctx, Sim, () => { if (root.isConnected) draw(); }) };
  root.addEventListener('click', (event) => { const b = event.target.closest && event.target.closest('[data-ss="osd"]'); if (!b || b.disabled) return; ss.runOsd(ctx, Sim, () => { if (root.isConnected) draw(); }); });
  draw();
  return root;
}
