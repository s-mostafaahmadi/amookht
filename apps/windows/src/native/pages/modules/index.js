// Activity frame for the lesson modules (site TDM.renderActivity + frame) and every interaction inside
// a module. Modules ported so far: Hören, Lesen (3b). Others show a placeholder with a button to the
// current version until their round (3c/3d).

import { toast } from '../../core/ui.js';
import { lang } from '../../core/i18n.js';
import { MODS, ML, faNum, mmss, timeStr, clamp, planName } from '../../core/engine.js';
import { createWork } from '../../core/work.js';
import { EXAM_PLANS } from '../../data/topics.js';
import { confirmDialog } from '../widgets.js';
import { createMedia } from './media.js';
import { makeKit, E, rtl } from './kit.js';
import { makeHoerenLesen } from './hoeren-lesen.js';
import { makeSchreibenSprechen } from './schreiben-sprechen.js';
import { wordsIn } from '../../core/work.js';
import { createReview } from '../../core/review.js';
import { makeReviewModules } from './review-modules.js';
import { handleStarClick } from '../widgets.js';

const ICON = { headphones: '🎧', 'document-text': '📖', 'pencil-square': '✍️', microphone: '🎙️', language: '🔤', brain: '🧠', 'clipboard-check': '📋' };
const ROUND = {};

export function createModules({ eng, ctx, redraw }) {
  const env = { eng };
  const work = (id) => eng.work(id);
  const alert = (code) => {
    const text = {
      limit: ML('در حالت آزمون فقط دو بار می‌توانید فایل را بشنوید.', 'Im Prüfungsmodus dürfen Sie den Text nur zweimal hören.', 'In exam mode you may only listen twice.'),
      norec: ML('این دستگاه از ضبط صدا پشتیبانی نمی‌کند.', 'Audioaufnahme wird nicht unterstützt.', 'Audio recording is not supported.'),
      nomic: ML('دسترسی به میکروفون داده نشد.', 'Mikrofonzugriff wurde abgelehnt.', 'Microphone access was denied.'),
      audio: ML('فایل صوتی بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.', 'Die Audiodatei konnte nicht geladen werden.', 'The audio file could not be loaded.'),
    }[code] || code;
    toast(text, 'warn');
  };
  env.wk = createWork(eng, { bridge: ctx.bridge, account: () => ctx.account, onChange: () => redraw('ai') });
  env.media = createMedia({ eng, work: () => eng.work(), bridge: ctx.bridge, account: () => ctx.account, siteOrigin: () => ctx.siteOrigin(), redraw: () => redraw('media'), alert });
  env.kit = makeKit(env);
  env.rv = createReview(eng, env.wk);
  env.ctx = ctx;
  env.favCache = new Map();
  const sw = makeSchreibenSprechen(env);
  const renderers = { ...makeHoerenLesen(env), schreiben: sw.schreiben, sprechen: sw.sprechen, ...makeReviewModules(env) };
  const { wk, media, kit, rv } = env;

  /* ───────────── frame ───────────── */
  function render() {
    const a = eng.act();
    if (!a) return '';
    if (!eng.CT()) return `<section class="card empty-card"><span class="spinner"></span><p>${E(ML('در حال بارگذاری محتوای برنامه…', 'Inhalte werden geladen …', 'Loading the lesson content…'))}</p></section>`;
    const d = eng.curDay(); const w = work(a.id); const steps = eng.stepsFor(a.id, d.mode, d); const i = clamp(w.step || 0, 0, steps.length - 1); const st = steps[i];
    if (media.recorder.keepNewest()) { /* a just-saved take wins over an older synced state */ }
    const review = eng.V.review; const last = i === steps.length - 1;
    const r = renderers[a.id];
    const out = r ? r(a, d, w, steps, i) : { body: placeholder(a) };
    const modeTag = (review ? `<span class="chip small">👁 ${E(ML('مرور پاسخ‌ها · فقط مشاهده', 'Rückblick · nur ansehen', 'Review · read only'))}</span>` : '') + (d.mode === 'eval' ? `<span class="chip small is-on">${E(ML('ارزیابی جمعه', 'Wochentest', 'Weekly test'))}</span>` : d.mode === 'exam' ? `<span class="chip small is-on">${E(ML('حالت آزمون', 'Prüfungsmodus', 'Exam mode'))}</span>` : '');
    const used = w.secs[i] || 0; const lim = st.min * 60;
    const clock = out.countdown && !review
      ? `<div class="tdm-countdown"><small>${E(ML('زمان باقی‌مانده', 'Restzeit', 'Time left'))}</small><b id="tdmCountdown" dir="ltr" data-auto="${out.countdown.auto || ''}">${mmss(lim - used)}</b></div>`
      : `<div class="step-clock"><b id="stepClock" dir="ltr">${mmss(used)} / ${mmss(lim)}</b><div class="rv-bar"><i id="stepBar" class="${used > lim ? 'is-over' : ''}" style="width:${Math.min(100, (used / lim) * 100)}%"></i></div></div>`;
    return `<div class="tdm-activity ${review ? 'tdm-review' : ''}" style="--c:${MODS[a.id]?.color || 'var(--accent)'}">
      <header class="act-frame-head"><button type="button" class="btn" data-act="pause">← ${E(planName(EXAM_PLANS[eng.S.user.examPlan]?.name || 'Lernplan'))}</button>
        <div class="act-frame-title"><span>${ICON[a.icon] || '•'}</span><div><h1>${E(a.title)} ${modeTag}</h1><small class="muted">${E(a.desc)}</small></div></div>
        <div class="act-clock" title="${E(ML('زمان مطالعه فعال', 'Aktive Lernzeit', 'Active study time'))}"><b id="actTotal" dir="ltr">${timeStr(Number(eng.S.activityTimers[a.id]) || 0)}</b><small>/ ${faNum(a.dur)}′</small></div></header>
      <div class="act-frame">
        <aside class="card steps">${steps.map((s, n) => `<button type="button" class="step ${n === i ? 'is-on' : ''} ${(w.secs[n] || 0) > 0 ? 'is-seen' : ''}" data-go="${n}"><span class="act-step">${faNum(n + 1)}</span><span><b dir="ltr">${E(s.de)}</b><small>${E(lang() === 'fa' ? s.fa : s.de)} · ${faNum(s.min)}′</small></span></button>`).join('')}</aside>
        <div class="step-main">
          <section class="card step-head"><div><p class="kicker">${E(ML('مرحله', 'Schritt', 'Step'))} ${faNum(i + 1)} · ${faNum(st.min)} ${E(ML('دقیقه', 'Min.', 'min'))}</p><h2 dir="ltr">${E(st.de)}</h2><p class="muted small">${E(st.fa)}</p></div>${clock}</section>
          ${wk.aiOn() && wk.aiDown() ? `<section class="card warn-card" role="status">${rtl(`<p>🛟 <b>${E(ML('تحلیل هوشمند موقتاً در دسترس نیست.', 'Die KI-Analyse ist vorübergehend nicht verfügbar.', 'AI analysis is temporarily unavailable.'))}</b> ${E(ML('خودارزیابی، پاسخ‌های نمونه و معیارهای نمره‌دهی فعال است و کارت ذخیره می‌شود؛ تحلیل بعداً خودکار انجام می‌شود.', 'Selbstkontrolle, Musterlösungen und Bewertungskriterien bleiben verfügbar; deine Arbeit wird gespeichert und die Analyse später automatisch nachgeholt.', 'Self-check, model answers and rubrics stay available; your work is saved and the analysis runs automatically later.'))}</p>`)}</section>` : ''}
          <div class="step-content">${out.body}</div>
          <footer class="row-actions step-nav">${i > 0 ? `<button type="button" class="btn" data-go="${i - 1}">← ${E(ML('مرحله قبل', 'Zurück', 'Previous step'))}</button>` : '<span></span>'}
            ${last ? (review ? `<button type="button" class="btn btn-primary" data-act="pause">✓ ${E(ML('بازگشت به داشبورد', 'Zurück zum Dashboard', 'Back to dashboard'))}</button>` : r ? `<button type="button" class="btn btn-primary big finish" data-act="finish">✓ ${E(ML('پایان و ثبت نتیجه', 'Abschließen & speichern', 'Finish & save'))}</button>` : '<span></span>') : `<button type="button" class="btn btn-primary" data-go="${i + 1}">${E(ML('مرحله بعد', 'Weiter', 'Next step'))} →</button>`}</footer>
        </div></div></div>`;
  }
  function placeholder(a) {
    return `<div class="step-placeholder"><div class="empty-emoji">🛠️</div><p>${E(ML(`محتوای این تمرین در مرحله ${ROUND[a.id] || '3'} به نسخه بومی اضافه می‌شود. تا آن زمان تمرین را در نسخه فعلی انجام دهید؛ زمان و پیشرفت در هر دو یکی است.`, `Der Inhalt dieser Übung kommt in Schritt ${ROUND[a.id] || '3'}. Bis dahin übst du in der aktuellen Version; Zeit und Fortschritt sind dieselben.`, `This exercise's content arrives in round ${ROUND[a.id] || '3'}. Until then practise in the current version; time and progress are shared.`))}</p>
      <button type="button" class="btn btn-primary" data-act="site">${E(ML('انجام این تمرین در نسخه فعلی', 'Diese Übung in der aktuellen Version machen', 'Do this exercise in the current version'))} ↗</button></div>`;
  }
  /** After the HTML is in place: player state, read-only review. */
  function after(root) {
    media.player.after();
    if (eng.V.review) {
      root.querySelectorAll('.tdm-review textarea').forEach((el) => { el.readOnly = true; });
      root.querySelectorAll('.tdm-review input, .tdm-review select').forEach((el) => { if (!el.matches('[data-audio-rate]')) el.disabled = true; });
    }
  }

  /* ───────────── interactions ───────────── */
  // In review mode only navigation, reveals and listening react (site REVIEW_OK).
  const REVIEW_OK = ['go', 'act', 'reveal', 'unlock', 'audio', 'seg', 'track', 'ext'];
  async function click(event) {
    if (handleStarClick(event, ctx.store, env.favCache)) return true;
    const el = event.target.closest('button, [data-track]');
    if (!el || el.disabled) return false;
    const d = el.dataset;
    if (eng.V.review && !Object.keys(d).some((k) => REVIEW_OK.includes(k))) return true;
    if (d.go !== undefined) { const it = wk.currentHoerenItem(); eng.go(Number(d.go)); if (eng.curDay().mode !== 'normal' && eng.act()?.id === 'hoeren') media.player.stop(); void it; redraw('step'); return true; }
    if (d.ans) { const [set, qid, v] = d.ans.split('|'); const val = /^\d+$/.test(v) ? Number(v) : v; wk.setAnswer(set, qid, val); el.closest('[data-q]')?.querySelectorAll('[data-ans]').forEach((b) => b.classList.toggle('is-sel', b === el)); return true; }
    if (d.check) {
      const n = wk.unansweredCount(d.check);
      if (n && !(await confirmDialog(ML(`${faNum(n)} سؤال بی‌پاسخ است. ارزیابی شود؟`, `${n} Fragen sind unbeantwortet. Trotzdem auswerten?`, `${n} questions are unanswered. Check anyway?`), { ok: ML('ارزیابی', 'Auswerten', 'Check'), danger: false }))) return true;
      wk.check(d.check); redraw('check'); return true;
    }
    if (d.reveal) { wk.toggleReveal(d.reveal); redraw('reveal'); return true; }
    if (d.unlock) { wk.unlock(d.unlock); redraw('reveal'); return true; }
    if (d.self) { const [key, v] = d.self.split('|'); wk.setSelf(key, v === 'true'); const box = el.parentElement; box.children[0].className = v === 'true' ? 'is-yes' : ''; box.children[1].className = v === 'false' ? 'is-no' : ''; return true; }
    if (d.rate) { const [key, n] = d.rate.split('|'); wk.setRate(key, Number(n)); [...el.parentElement.children].forEach((b, i) => b.classList.toggle('on', i < Number(n))); return true; }
    if (d.cat) { const [key, id] = d.cat.split('|'); const cur = wk.setCat(key, id); el.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-sel')); if (cur) el.classList.add('is-sel'); return true; }
    if (d.xadd !== undefined) { wk.addExtraError(Number(d.xadd)); redraw('extra'); return true; }
    if (d.xcat) { const [i, cat] = d.xcat.split('|'); const cur = wk.extraErrCat(Number(i), cat); el.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('is-sel')); if (cur) el.classList.add('is-sel'); return true; }
    if (d.xdel !== undefined) { wk.removeExtraErr(Number(d.xdel)); redraw('extra'); return true; }
    if (d.xexplain !== undefined) { wk.explainExtra(Number(d.xexplain)); redraw('ai'); return true; }
    if (d.aiRetry) { wk.aiRetry(d.aiRetry); redraw('ai'); return true; }
    if (d.aiSpeak) { const [key, t] = d.aiSpeak.split('|'); wk.aiSpeaking(key, Number(t)); redraw('ai'); return true; }
    if (d.audio) {
      const it = wk.currentHoerenItem();
      if (d.audio === 'toggle') media.player.toggle(it);
      else if (d.audio === 'restart') media.player.restart(it);
      else media.player.seek(Number(d.audio));
      return true;
    }
    if (d.seg !== undefined) { media.player.playSeg(wk.currentHoerenItem(), Number(d.seg)); return true; }
    if (d.track) { const r = el.getBoundingClientRect(); const x = (event.clientX - r.left) / r.width; media.player.seekTo(document.dir === 'rtl' && getComputedStyle(el).direction === 'rtl' ? 1 - x : x); return true; }
    if (d.recStart) { const [key, limit] = d.recStart.split('|'); media.recorder.start(key, Number(limit) || 0); return true; }
    if (d.recStop) { media.recorder.stop(); return true; }
    if (d.ext) { ctx.bridge.openExternal(d.ext); return true; }
    if (d.insert !== undefined) { const box = document.getElementById('tdmEssay'); if (box) { const s = box.selectionStart ?? box.value.length; const e = box.selectionEnd ?? s; box.value = box.value.slice(0, s) + d.insert + box.value.slice(e); box.focus(); box.selectionStart = box.selectionEnd = s + d.insert.length; essay(box.value); } return true; }
    if (d.aiWriting) { if (!wk.aiWriting()) toast(ML('برای تحلیل، ابتدا متن (حداقل ۲۰ کلمه) را بنویس.', 'Bitte zuerst mindestens 20 Wörter schreiben.', 'Write at least 20 words first.'), 'warn'); redraw('ai'); return true; }
    if (d.aiProto !== undefined) { if (!wk.aiToProtocol(Number(d.aiProto))) toast(ML('هر سه ردیف Fehlerprotokoll پر است.', 'Das Fehlerprotokoll ist voll.', 'The error log is full.'), 'warn'); redraw('ai'); return true; }
    if (d.exStart !== undefined) { await sw.examStart(Number(d.exStart)); redraw('step'); return true; }
    if (d.exSkip) { sw.examSkip(); redraw('step'); return true; }
    if (d.flip) { rv.flip(d.flip); redraw('reveal'); return true; }
    if (d.srs) { const p = d.srs.lastIndexOf('|'); rv.srsCard(d.srs.slice(0, p), d.srs.slice(p + 1) === '1'); redraw('step'); return true; }
    if (d.srsDel) { if (await confirmDialog(ML('این کارت از دفتر مرور حذف شود؟', 'Diese Karte aus dem Lernstapel löschen?', 'Delete this card from the review deck?'))) { rv.srsDel(d.srsDel); redraw('step'); } return true; }
    if (d.errDel) { if (await confirmDialog(ML('این اشتباه حذف شود؟', 'Diesen Fehler löschen?', 'Delete this mistake?'))) { rv.errDel(d.errDel); redraw('step'); } return true; }
    if (d.errReview) { const p = d.errReview.lastIndexOf('|'); rv.errReview(d.errReview.slice(0, p), d.errReview.slice(p + 1) === '1'); redraw('step'); return true; }
    if (d.quiz) { const [q, o] = d.quiz.split('|').map(Number); rv.quizAns(q, o); el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('is-sel', b === el)); return true; }
    if (d.quizDone) { rv.quizDone(); redraw('check'); return true; }
    if (d.top) { const on = rv.toggleTop(d.top); if (on === null) toast(ML('حداکثر سه مورد.', 'Höchstens drei.', 'Three at most.'), 'warn'); else el.classList.toggle('is-sel', on); return true; }
    if (d.aiSentences) { if (!rv.aiSentences()) toast(ML('اول حداقل یک جمله بنویس.', 'Schreibe zuerst mindestens einen Satz.', 'Write at least one sentence first.'), 'warn'); redraw('ai'); return true; }
    if (d.saveReport) { rv.saveReport(); toast(ML('گزارش هفتگی ذخیره شد.', 'Wochenbericht gespeichert.', 'Weekly report saved.'), 'ok'); redraw('step'); return true; }
    if (d.phaseTo) { eng.M().phase = Number(d.phaseTo); eng.save(); toast(`Phase ${faNum(d.phaseTo)}`, 'ok'); redraw('step'); return true; }
    if (d.act === 'finish') { media.player.stop(); media.recorder.abort(); wk.finish(media.recorder); redraw('finish'); return true; }
    return false;
  }
  function input(event) {
    const t = event.target; const d = t.dataset;
    if (eng.V.review) return false;
    if (d.f) { wk.setField(d.f, t.value); return true; }
    if (d.essay) { essay(t.value); return true; }
    if (d.ansText) { const [set, qid] = d.ansText.split('|'); wk.setAnswer(set, qid, t.value); return true; }
    if (d.xtext !== undefined) { wk.extraErr(Number(d.xtext), 'text', t.value); return true; }
    if (d.xnote !== undefined) { wk.extraErr(Number(d.xnote), 'note', t.value); return true; }
    if (d.understanding) { wk.setField('understanding', t.value); const l = document.getElementById('tdmUnd'); if (l) l.textContent = faNum(t.value) + '%'; return true; }
    return false;
  }
  function change(event) {
    const t = event.target;
    if (t.dataset.fchk && !eng.V.review) { wk.setField(t.dataset.fchk, t.checked); return true; }
    if (t.dataset.audioRate) { media.player.rate(wk.currentHoerenItem(), t.value); return true; }
    return false;
  }
  /** Exam countdown: when time is up the answers are checked automatically (site tick). */
  function tick(info) {
    const ex = sw.examTick();
    if (ex === true) redraw('step'); else if (ex === 'later') setTimeout(() => redraw('step'), 600);
    const cd = document.getElementById('tdmCountdown');
    if (!cd) return;
    const left = info.limit - info.used;
    cd.textContent = mmss(left);
    cd.classList.toggle('is-low', left <= 60);
    const auto = cd.dataset.auto; const w = work();
    if (left <= 0 && auto && !w.checked[auto]) { wk.check(auto); redraw('check'); }
  }
  /** Site TDM.essay: text + live word count. */
  function essay(v) { wk.setField('text', v); const c = document.getElementById('tdmWc'); if (c) { const n = wordsIn(v); c.textContent = faNum(n); c.parentElement.classList.toggle('is-ok', n >= Number(c.dataset.min || 0)); } }
  function leave() { media.player.stop(); media.recorder.abort(); }

  /* ───────────── for the floating tools (site TDM.contextInfo / lookupWord / audioSeek) ───────────── */
  /** What the study tutor sends as context for the open lesson step (site TDM.contextInfo, 1:1). */
  function contextInfo() {
    const a = eng.act(); if (!a || !eng.CT()) return null;
    const d = eng.curDay(); const w = work(a.id); const steps = eng.stepsFor(a.id, d.mode, d); const st = steps[clamp(w.step || 0, 0, steps.length - 1)]; const key = st.key.split(':')[0];
    const out = { module: a.title, step: st.de, title: '', material: '', user_text: '', exam: false };
    const cut = (s, n) => String(s || '').slice(0, n);
    const qText = (qs) => qs.map((q, n) => `${n + 1}. ${q.q}${Array.isArray(q.options) ? ' ' + q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' ') : q.type === 'jnt' ? ' (ja / nein / Text sagt dazu nichts)' : q.type === 'rf' ? ' (richtig / falsch)' : ''}`).join('\n');
    if (a.id === 'hoeren') {
      const it = wk.currentHoerenItem(); if (!it) return out;
      out.title = `${it.formatLabel}: ${it.title}`;
      const transcriptOk = ['analyse', 'zusammenfassung'].includes(key) || !!w.checked.h;
      if (transcriptOk) out.material = cut(it.segments.map((s) => `${it.speakers[s.s]?.name || ''}: ${s.text}`).join('\n'), 3000);
      else out.material = ML('(متن فایل صوتی در این مرحله عمداً نمایش داده نمی‌شود.)', '(Das Transkript ist in diesem Schritt absichtlich verborgen.)');
      if (['selektiv', 'pruefung'].includes(key)) out.material += '\nAufgaben:\n' + cut(qText(it.questions || []), 900);
      out.exam = key === 'pruefung' && !w.checked.h;
      if (key === 'selektiv' && !w.checked.h) out.step += ' (Aufgaben noch nicht ausgewertet)';
    } else if (a.id === 'lesen') {
      const it = eng.item('lesen', d.picks?.lesen); if (!it) return out;
      out.title = it.title;
      out.material = key === 'ueberblick' ? 'Zwischenüberschriften: ' + it.paragraphs.map((p) => p.heading).join(' | ') : cut(it.paragraphs.map((p, n) => `[${n + 1}] ${p.heading ? p.heading + ': ' : ''}${p.text}`).join('\n'), 3000);
      if (['aufgaben', 'pruefung'].includes(key)) out.material += '\nAufgaben:\n' + cut(qText(it.questions || []), 900);
      out.exam = key === 'pruefung' && !w.checked.l;
      if (key === 'aufgaben' && !w.checked.l) out.step += ' (Aufgaben noch nicht ausgewertet)';
    } else if (a.id === 'schreiben') {
      const pk = d.picks?.schreiben; const it = pk && eng.item(pk.kind, pk.id); if (!it) return out;
      out.title = it.title;
      out.material = cut(pk.kind === 'grafik' ? `${it.task}\nGrafik: ${it.chart?.title} (${it.chart?.unit}) ${(it.chart?.labels || []).join(', ')}\nText: ${it.text}` : `${it.situation}\n${(it.positions || []).map((p) => `${p.person}: ${p.text}`).join('\n')}\n${it.task}`, 2500);
      out.user_text = cut(w.f.text, 2800);
      out.exam = d.mode !== 'normal' && key === 'schreiben';
    } else if (a.id === 'sprechen') {
      const t = Number(st.key.split(':')[1]) || 0; const list = d.mode === 'normal' ? [wk.speakTask(d, t)] : eng.spList(d).map((id) => eng.item('sprechen', id));
      out.title = list.filter(Boolean).map((x) => x.typeLabel).join(' · ');
      out.material = cut(list.filter(Boolean).map((x) => `${x.typeLabel}: ${x.situation}\n${x.task}${x.material ? '\n' + x.material : ''}`).join('\n\n'), 2500);
      out.user_text = cut(w.f['kw_' + t] || '', 600);
      out.exam = d.mode !== 'normal' && key === 'exam';
    } else if (a.id === 'wortschatz') {
      const gr = rv.grammarOfWeek(d.week);
      out.title = 'Grammatik der Woche: ' + gr.title;
      out.material = cut('Neue Wörter: ' + rv.dayWords(d).map((v) => `${v.artikel ? v.artikel + ' ' : ''}${v.wort} (${v.bedeutung_fa})`).join(', ') + '\nRedemittel: ' + (d.redemittel || []).map((r) => r.de).join(' | '), 1500);
      out.user_text = cut([0, 1, 2, 3, 4].map((n) => w.f['satz_' + n]).filter(Boolean).join('\n'), 1500);
    } else if (a.id === 'extra') {
      out.title = 'Extra-Lernzeit · Satzbildung';
      out.user_text = cut(Object.keys(w.f).filter((k) => /^sx_/.test(k) && String(w.f[k] || '').trim()).map((k) => w.f[k]).join('\n'), 1500);
      out.user_text = cut(w.f.x_summary || '', 800);
    }
    return out;
  }
  /** A word/phrase from the plan deck or today's lesson content (site TDM.lookupWord, 1:1). */
  function lookupWord(text) {
    const norm = (v) => String(v || '').toLowerCase().replace(/^(der|die|das)\s+/, '').replace(/[.,;:!?„“"'()«»]/g, '').replace(/\s+/g, ' ').trim();
    const q = norm(text); if (!q) return null;
    const word = (v) => ({ kind: 'vocabulary', title: `${v.artikel ? v.artikel + ' ' : ''}${v.wort}`, answer: v.bedeutung_fa || '', explanation: v.beispiel || '' });
    const phrase = (v) => ({ kind: 'structure', title: v.de, answer: v.fa || '', explanation: v.beispiel || '' });
    for (const x of Object.values(eng.S.testdafMethod?.srs || {})) { if (x.type === 'wort' ? norm(x.data.wort) === q : norm(x.data.de) === q) return x.type === 'wort' ? word(x.data) : phrase(x.data); }
    const c = eng.CT(); if (!c) return null;
    for (const key of ['hoeren', 'lesen']) for (const it of c[key] || []) for (const v of it.vocab || []) if (norm(v.wort) === q) return word(v);
    for (const key of ['argumentation', 'grafik', 'sprechen']) for (const it of c[key] || []) for (const v of it.redemittel || []) if (v && typeof v === 'object' && norm(v.de) === q) return phrase(v);
    return null;
  }
  const lessonApi = {
    contextInfo, lookupWord,
    activity: () => eng.act(),
    audioSeek: (s) => media.player.seek(Number(s) || 0),
    audioToggle: () => media.player.toggle(wk.currentHoerenItem()),
  };

  return { render, after, click, input, change, tick, leave, env, lessonApi };
}
