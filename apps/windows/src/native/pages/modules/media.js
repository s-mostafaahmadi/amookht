// Audio player and voice recorder for the lesson modules — port of the site engine's player
// (persists across re-renders, word-exact transcript highlight, exam play limit) and recorder
// (mic warm-up, light voice chain, 64 kbit/s Opus, upload to /v1/speaking/recordings, replaced takes
// cleaned up when the exercise is finished). Lesson audio is played through amookht://media (cached).

import { clamp, mmss, faNum } from '../../core/engine.js';

export const mediaUrl = (path) => (path && path.startsWith('/assets/') ? 'amookht://media' + path : path || '');

export function createMedia({ eng, work, bridge, account, siteOrigin, redraw, alert }) {
  /* ───────────── player ───────────── */
  const P = { audio: null, src: '', item: null, playing: false, endAt: null, raf: 0 };
  const WT = {};
  let txUserScroll = 0;
  ['wheel', 'touchmove'].forEach((ev) => addEventListener(ev, () => { txUserScroll = Date.now(); }, { passive: true, capture: true }));

  const isExamHoeren = () => eng.act()?.id === 'hoeren' && eng.curDay().mode !== 'normal';
  function audioFor(it) {
    if (!it?.audio) return null;
    if (P.src !== it.audio) {
      stop();
      P.audio = new Audio(mediaUrl(it.audio)); P.src = it.audio; P.item = it; P.audio.preload = 'auto';
      try { const w0 = eng.act() ? work() : null; const r0 = isExamHoeren() ? 1 : Number(w0?.rate_) || (eng.lowLevel() ? 0.9 : 1); P.audio.defaultPlaybackRate = r0; P.audio.playbackRate = r0; } catch { /* ignore */ }
      P.audio.addEventListener('timeupdate', () => { if (P.endAt != null && P.audio.currentTime >= P.endAt) { P.audio.pause(); P.endAt = null; } updateUI(); });
      P.audio.addEventListener('ended', () => { P.playing = false; P.endAt = null; countPlay(); updateUI(); });
      P.audio.addEventListener('play', () => { P.playing = true; updateUI(); });
      P.audio.addEventListener('pause', () => { P.playing = false; updateUI(); });
      P.audio.addEventListener('loadedmetadata', updateUI);
      P.audio.addEventListener('error', () => { P.playing = false; alert('audio'); });
    }
    return P.audio;
  }
  function stop() { try { P.audio?.pause(); } catch { /* ignore */ } try { speechSynthesis.cancel(); } catch { /* ignore */ } P.playing = false; P.endAt = null; }
  function countPlay() {
    if (eng.act()?.id !== 'hoeren') return;
    const w = work(); w.plays = (w.plays || 0) + 1; eng.save();
    const el = document.getElementById('tdmPlays'); if (el) el.textContent = faNum(w.plays);
  }
  const wordUrl = (it) => (it?.audio ? mediaUrl(it.audio.replace(/\.mp3(\?.*)?$/, '.words.json')) : '');
  function wordTimes(it) {
    const url = wordUrl(it);
    if (!url) return null;
    if (!(url in WT)) { WT[url] = null; fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => { WT[url] = j && Array.isArray(j.segs) ? j.segs : false; hilite(); }).catch(() => { WT[url] = false; }); }
    return WT[url] || null;
  }
  function follow(el) {
    if (Date.now() - txUserScroll < 3000) return;
    const box = el.closest('.tx'); const r = el.getBoundingClientRect();
    if (box && box.scrollHeight > box.clientHeight + 2) {
      const b = box.getBoundingClientRect();
      if (r.top < b.top + 8 || r.bottom > b.bottom - 8) box.scrollTo({ top: Math.max(0, box.scrollTop + (r.top - b.top) - box.clientHeight / 3), behavior: 'smooth' });
    } else el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function hilite() {
    const a = P.audio; if (!a) return;
    const box = document.querySelector('.tx');
    const t = a.currentTime; const on = t > 0 && !a.ended && (!box || box.dataset.item === String(P.item?.id || ''));
    const wt = wordTimes(P.item);
    document.querySelectorAll('[data-seg]').forEach((el) => {
      const s0 = Number(el.dataset.t0); const s1 = Number(el.dataset.t1); const cur = on && t >= s0 && t < s1;
      const was = el.classList.contains('is-playing');
      el.classList.toggle('is-playing', cur);
      if (cur && !was && !a.paused) follow(el);
      if (!cur) { el.querySelectorAll('.w.is-word, .w.is-said').forEach((x) => x.classList.remove('is-word', 'is-said')); return; }
      let c0 = -1; let c1 = -1; const list = wt?.[Number(el.dataset.seg)];
      if (list?.length) { for (const [a0, a1, w0, w1] of list) { if (t >= w0 - 0.02) { c0 = a0; c1 = a1; if (t < w1) break; } else break; } }
      else { const len = Number(el.dataset.len) || 1; c0 = c1 = Math.floor(clamp((t - s0) / Math.max(0.1, s1 - s0), 0, 0.999) * len); }
      el.querySelectorAll('.w').forEach((x) => {
        const w0 = Number(x.dataset.c0); const w1 = Number(x.dataset.c1);
        const hit = c0 >= 0 && (c1 > c0 ? w0 < c1 && w1 > c0 : c0 >= w0 && c0 < w1);
        x.classList.toggle('is-word', hit); x.classList.toggle('is-said', c0 >= 0 && !hit && w1 <= c0);
      });
    });
  }
  function updateUI() {
    const a = P.audio; if (!a) return;
    const dur = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : P.item?.duration || 0;
    const bar = document.getElementById('tdmAudioBar'); const t = document.getElementById('tdmAudioTime'); const b = document.getElementById('tdmAudioBtn');
    if (bar && dur) bar.style.width = clamp((a.currentTime / dur) * 100, 0, 100) + '%';
    if (t) t.textContent = `${mmss(a.currentTime)} / ${mmss(dur)}`;
    if (b) b.textContent = P.playing ? '❚❚' : '▶';
    hilite();
    if (P.playing && !P.raf) { const loop = () => { P.raf = 0; hilite(); if (P.playing) P.raf = requestAnimationFrame(loop); }; P.raf = requestAnimationFrame(loop); }
  }
  const playLimitReached = () => { if (!isExamHoeren()) return false; const w = work(); return (w.step || 0) === 0 && (w.plays || 0) >= 2 && !P.playing; };
  function speak(text) { try { const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { console.warn(e); } }
  const player = {
    get state() { return P; },
    toggle(it) {
      if (!it) return;
      if (!it.audio) { speak(it.segments.map((s) => s.text).join(' ')); return; }
      const a = audioFor(it);
      if (P.playing) { a.pause(); return; }
      if (playLimitReached()) { alert('limit'); return; }
      P.endAt = null; a.play().catch((e) => console.warn(e));
    },
    seek(delta) { const a = P.audio; if (!a) return; if (isExamHoeren() && (work().step || 0) === 0) return; a.currentTime = clamp(a.currentTime + delta, 0, Number.isFinite(a.duration) ? a.duration : P.item?.duration || 0); updateUI(); },
    seekTo(fraction) { const a = P.audio; const dur = a && Number.isFinite(a.duration) && a.duration > 0 ? a.duration : P.item?.duration || 0; if (!a || !dur) return; if (isExamHoeren() && (work().step || 0) === 0) return; a.currentTime = clamp(fraction, 0, 1) * dur; updateUI(); },
    restart(it) { const a = audioFor(it); if (!a || playLimitReached()) return; a.currentTime = 0; P.endAt = null; a.play().catch(() => {}); },
    rate(it, r) { const a = audioFor(it); if (a) a.playbackRate = Number(r) || 1; work().rate_ = Number(r) || 1; eng.save(); },
    playSeg(it, i) { const seg = it?.segments?.[i]; if (!seg) return; if (!it.audio) { speak(seg.text); return; } const a = audioFor(it); a.currentTime = seg.t0; P.endAt = seg.t1; a.play().catch(() => {}); },
    stop,
    after() { updateUI(); },
    prime(it) { wordTimes(it); },
    playLimitReached,
  };

  /* ───────────── recorder ───────────── */
  const MIC = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 } };
  let ACX = null;
  function audioCtx() {
    try { if (!ACX || ACX.state === 'closed') ACX = new AudioContext(); if (ACX.state === 'suspended') ACX.resume().catch(() => {}); return ACX; } catch { return null; }
  }
  function voiceChain(stream) {
    const ac = audioCtx(); if (!ac || ac.state !== 'running') return null;
    try {
      const src = ac.createMediaStreamSource(stream);
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90; hp.Q.value = 0.7;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; lp.Q.value = 0.7;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -26; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
      const dest = ac.createMediaStreamDestination(); dest.channelCount = 1;
      src.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(dest);
      return { stream: dest.stream, stop() { try { src.disconnect(); comp.disconnect(); } catch { /* ignore */ } } };
    } catch { return null; }
  }
  async function micReady(stream) {
    let src = null;
    try {
      const ac = audioCtx(); if (!ac) { await new Promise((r) => setTimeout(r, 600)); return; }
      try { await ac.resume(); } catch { /* ignore */ }
      if (ac.state !== 'running') { await new Promise((r) => setTimeout(r, 600)); return; }
      const an = ac.createAnalyser(); src = ac.createMediaStreamSource(stream); src.connect(an);
      const data = new Float32Array(an.fftSize); const t0 = performance.now();
      while (performance.now() - t0 < 2500) { an.getFloatTimeDomainData(data); if (data.some((x) => Math.abs(x) > 1e-4)) break; await new Promise((r) => setTimeout(r, 40)); }
    } catch { await new Promise((r) => setTimeout(r, 600)); } finally { try { src?.disconnect(); } catch { /* ignore */ } }
  }
  const R = { rec: null, stream: null, key: null, started: 0, limit: 0, timer: null, status: 'idle', starting: false, saved: {}, autoStop: false };
  function releaseStream() { try { R.stream?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ } R.stream = null; }
  const playbackUrl = (rec) => {
    if (!rec?.playback_url) return '';
    if (rec.local) return rec.playback_url;
    const q = rec.playback_token ? `?user_id=${encodeURIComponent(account().id || '')}&token=${encodeURIComponent(rec.playback_token)}` : '';
    return siteOrigin() + rec.playback_url + q;
  };
  function dropRecording(rec) {
    if (!rec) return;
    if (rec.local) { try { URL.revokeObjectURL(rec.playback_url); } catch { /* ignore */ } return; }
    if (rec.id && /^[0-9a-f]{32}$/.test(rec.id)) bridge.api('/v1/speaking/recordings/' + rec.id, { method: 'DELETE' }).catch(() => {});
  }
  async function saveRecording(actId, dayKey, key, blob, mime, secs) {
    const w = actId ? eng.M().days[dayKey]?.work?.[actId] : null;
    let saved;
    const r = await bridge.speakingUpload({ bytes: new Uint8Array(await blob.arrayBuffer()), mime, filename: `tdm-${key}.${mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm'}`, planId: 'keep-tdm-' + dayKey, taskId: key });
    if (r.ok) saved = { ...r.data, secs, at: new Date().toISOString() };
    else { console.warn('recording upload failed', r.error); saved = { playback_url: URL.createObjectURL(blob), local: true, secs, at: new Date().toISOString() }; }
    const prev = w ? w.rec[key] : null;
    if (w) {
      w.rec = w.rec || {};
      w.rec[key] = saved;
      if (prev && !prev.local && prev.id && prev.id !== saved.id) { w.recTrash = Array.isArray(w.recTrash) ? w.recTrash : []; if (!w.recTrash.includes(prev.id)) w.recTrash.push(prev.id); }
      R.saved[actId + '|' + dayKey + '|' + key] = saved;
    }
    R.status = 'idle'; R.rec = null;
    eng.save();
    redraw();
    if (prev?.local) dropRecording(prev);
  }
  const recorder = {
    get state() { return R; },
    isRecording: (key) => R.rec?.state === 'recording' && (!key || R.key === key),
    async start(key, limit = 0) {
      if (R.rec?.state === 'recording' || R.starting || R.status === 'saving') return;
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { alert('norec'); return; }
      R.starting = true; audioCtx();
      const actId = eng.act()?.id; const dayKey = eng.dayKey();
      try {
        const fresh = !(R.stream && R.stream.active);
        const stream = fresh ? await navigator.mediaDevices.getUserMedia(MIC) : R.stream;
        if (fresh) { R.key = key; R.status = 'starting'; redraw(); await micReady(stream); }
        if (R.rec?.state === 'recording') return;
        const chunks = []; const started = Date.now();
        R.stream = stream; R.key = key; R.limit = limit; R.started = started;
        const pref = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
        const chain = voiceChain(stream); const recStream = chain ? chain.stream : stream;
        const opts = { audioBitsPerSecond: 64000 }; if (pref) opts.mimeType = pref;
        let rec;
        try { rec = new MediaRecorder(recStream, opts); } catch { chain?.stop(); rec = pref ? new MediaRecorder(stream, { mimeType: pref }) : new MediaRecorder(stream); }
        R.rec = rec; R.status = 'recording';
        rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
        rec.onstop = () => { chain?.stop(); const mime = (rec.mimeType || 'audio/webm').split(';')[0]; const blob = new Blob(chunks, { type: mime }); const secs = Math.round((Date.now() - started) / 1000); chunks.length = 0; releaseStream(); saveRecording(actId, dayKey, key, blob, mime, secs); };
        rec.start(1000);
        clearInterval(R.timer);
        R.autoStop = !!limit && eng.curDay().mode !== 'normal';
        R.timer = setInterval(() => { const el = document.getElementById('tdmRecClock'); const s = (Date.now() - R.started) / 1000; if (el) { el.textContent = mmss(s) + (R.limit ? ' / ' + mmss(R.limit) : ''); el.classList.toggle('is-over', !!R.limit && s > R.limit); } if (R.limit && s >= R.limit && R.autoStop) recorder.stop(); }, 300);
        redraw();
      } catch (e) { console.warn(e); R.status = 'denied'; alert('nomic'); redraw(); } finally { R.starting = false; if (R.status === 'starting') { R.status = 'idle'; redraw(); } }
    },
    stop() {
      if (R.rec?.state !== 'recording') return;
      R.status = 'saving'; clearInterval(R.timer); R.rec.stop();
      try { const w = eng.act()?.id === 'sprechen' ? work() : null; if (w?.ex && R.key === 'exam_' + w.ex.t) { w.ex = null; eng.save(); } } catch { /* ignore */ }
      redraw();
    },
    /** Exam mode: open the microphone before the preparation countdown (site examSpeakStart). */
    async warm() {
      audioCtx();
      try {
        if (!R.stream || !R.stream.active) { R.stream = await navigator.mediaDevices.getUserMedia(MIC); micReady(R.stream); }
        return true;
      } catch { alert('nomic'); return false; }
    },
    abort() { if (R.rec?.state === 'recording') { R.rec.onstop = null; try { R.rec.stop(); } catch { /* ignore */ } R.status = 'idle'; clearInterval(R.timer); releaseStream(); } },
    playbackUrl,
    /** A just-saved take must survive a server state that is older (site keepNewestTakes). */
    keepNewest() {
      const a = eng.act(); if (!a) return false;
      const w = work(a.id); const pre = a.id + '|' + eng.dayKey() + '|'; let changed = false;
      Object.entries(R.saved).forEach(([k, rec]) => {
        if (!k.startsWith(pre)) return;
        const key = k.slice(pre.length); const cur = w.rec?.[key];
        if (cur && cur.id === rec.id) return;
        if (cur && cur.at && rec.at && cur.at > rec.at) { delete R.saved[k]; return; }
        w.rec = w.rec || {}; w.rec[key] = rec; changed = true;
      });
      if (changed) eng.save();
      return changed;
    },
    analysed(w, key) { const r = w.ai?.['sp_' + key]; const rec = w.rec?.[key]; return !!(r && !r.error && rec?.id && (!r.recId || r.recId === rec.id)); },
    dropAnalysed(w) { Object.entries(w?.rec || {}).forEach(([key, rec]) => { if (!rec || rec.gone || rec.local || !rec.id || !recorder.analysed(w, key)) return; dropRecording(rec); w.rec[key] = { id: rec.id, secs: rec.secs, at: rec.at, gone: true }; }); },
    flushTrash(w) { const trash = Array.isArray(w?.recTrash) ? w.recTrash : []; if (!trash.length) return; const live = new Set(Object.values(w.rec || {}).map((r) => r?.id).filter(Boolean)); trash.filter((id) => !live.has(id)).forEach((id) => dropRecording({ id })); w.recTrash = []; },
  };

  return { player, recorder };
}
