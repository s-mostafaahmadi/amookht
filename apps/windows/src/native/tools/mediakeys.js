// ← / → seek the most recently played audio by 5 s.
// Ported from the site's amk-mediakeys.js by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
export function install(shim) {
  const { S, saveData, render, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  /* Amookht — ← / → seek the site's audio by 5 s (MEDIA-KEYS, 2026-11-15, owner request).
     Acts on the most recently played audio (plan Hören player, free-study Hören, pronunciation, conversation coach).
     - Plan player: uses TDM.audioSeek so its progress bar stays in sync; never in exam mode (.tdm-player.is-exam has no seek).
     - Ignored while typing (input / textarea / select / contenteditable) or with Ctrl/Alt/Meta/Shift.
     - Also works inside the conversation coach iframe (#dcoachFrame, same origin). */
  (function () {
    'use strict';
    var STEP = 5, last = null, lastAt = 0, badgeT = null;
    function track(m) { if (m && typeof m.currentTime === 'number') { last = m; lastAt = Date.now(); } }
    function wrapPlay(win) {
      try {
        var P = win.HTMLMediaElement && win.HTMLMediaElement.prototype; if (!P || P.play.__amkMk) return;
        var orig = P.play;
        var wrapped = function () { track(this); return orig.apply(this, arguments); };
        wrapped.__amkMk = true; P.play = wrapped;
        win.document.addEventListener('play', function (e) { track(e.target); }, true);   // native controls
      } catch (e) { /* ignore */ }
    }
    function typing(t) {
      var el = t && (t.nodeType === 1 ? t : t.parentElement);
      return !!(el && el.closest && el.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]'));
    }
    function isMethodAudio(m) { try { return /method-audio\//.test(m.currentSrc || m.src || ''); } catch (e) { return false; } }
    function fa() { try { return S.uiLanguage !== 'en' && S.uiLanguage !== 'de'; } catch (e) { return true; } }
    function badge(d) {
      var b = document.getElementById('amkMkBadge');
      if (!b) { b = document.createElement('div'); b.id = 'amkMkBadge'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
      var n = fa() ? '۵ ثانیه' : '5 s';
      b.textContent = d > 0 ? '⏩ ' + n : '⏪ ' + n;
      b.className = 'is-on'; clearTimeout(badgeT); badgeT = setTimeout(function () { b.className = ''; }, 700);
    }
    function seek(d) {
      var m = last;
      if (!m) return false;
      var playing = !m.paused && !m.ended;
      if (!playing && Date.now() - lastAt > 5 * 60 * 1000) return false;               // stale: paused for more than 5 min
      if (m.nodeType === 1 && !m.isConnected && !isMethodAudio(m) && !playing) return false;
      if (isMethodAudio(m) && document.querySelector('#app .tdm-player')) {
        if (document.querySelector('#app .tdm-player.is-exam')) return false;            // exam: no seeking
        if (window.TDM && typeof TDM.audioSeek === 'function') { TDM.audioSeek(d); return true; }
      }
      var dur = isFinite(m.duration) ? m.duration : Infinity;
      try { m.currentTime = Math.max(0, Math.min(dur - 0.05, (m.currentTime || 0) + d)); } catch (e) { return false; }
      return true;
    }
    /* MEDIA-SPACE (2026-11-15, owner): Space always plays / pauses the page's audio when the page has audio */
    function fresh(m) { return !!m && (!m.paused || Date.now() - lastAt < 5 * 60 * 1000) && (m.nodeType !== 1 || m.isConnected || isMethodAudio(m) || !m.paused); }
    function pageAudio() {
      var tdm = document.querySelector('#app .tdm-player');
      if (tdm && window.TDM && typeof TDM.audioToggle === 'function' && (!fresh(last) || isMethodAudio(last))) return { tdm: true };
      // detached clips (pronunciation / translator TTS) only count while they are playing; page players, plan and free-study audio always
      if (fresh(last) && (!last.paused || isMethodAudio(last) || last === window.__freeAudio || (last.nodeType === 1 && last.isConnected))) return { m: last };
      var a = document.querySelector('#app audio, .fg-root audio, .gd-root audio');
      if (a) return { m: a };
      if (window.__freeAudio && typeof window.__freeAudio.play === 'function' && (window.__freeAudio.src || window.__freeAudio.currentSrc)) return { m: window.__freeAudio };
      return null;
    }
    function toggle() {
      var t = pageAudio(); if (!t) return 0;
      if (t.tdm) {   /* decide from the state BEFORE toggling: the player's icon / audio update a moment later (badge was reversed) */
        var lm = last && isMethodAudio(last) ? last : null, b = document.getElementById('tdmAudioBtn');
        var wasPlaying = lm ? !lm.paused && !lm.ended : !!(b && /❚/.test(b.textContent));
        TDM.audioToggle(); return wasPlaying ? -1 : 1;
      }
      var m = t.m;
      if (m.paused || m.ended) { try { var p = m.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { return 0; } return 1; }
      m.pause(); return -1;
    }
    var spaceHandled = false;
    function onSpace(e) {
      if (e.key !== ' ' && e.code !== 'Space') return false;
      if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || typing(e.target)) return true;
      try { if (S.reviewMode && S.currentReview) return true; } catch (x) { /* mistakes review: Space reveals the answer */ }
      if (e.repeat) { if (spaceHandled) e.preventDefault(); return true; }
      var r = toggle();
      spaceHandled = !!r;
      if (r) { e.preventDefault(); e.stopPropagation(); badgeText(r > 0 ? '▶ ' + (fa() ? 'پخش' : 'Play') : '❚❚ ' + (fa() ? 'توقف' : 'Pause')); }
      return true;
    }
    function onSpaceUp(e) { if ((e.key === ' ' || e.code === 'Space') && spaceHandled) { e.preventDefault(); spaceHandled = false; } }   // no button «click» on keyup
    function badgeText(txt) {
      var b = document.getElementById('amkMkBadge');
      if (!b) { b = document.createElement('div'); b.id = 'amkMkBadge'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
      b.textContent = txt; b.className = 'is-on'; clearTimeout(badgeT); badgeT = setTimeout(function () { b.className = ''; }, 700);
    }
    function onKey(e) {
      if (onSpace(e)) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || typing(e.target)) return;
      var t = e.target && e.target.nodeType === 1 ? e.target : null;
      if (t && t.closest && t.closest('[role="slider"],[role="tablist"],[role="radiogroup"]')) return;
      if (seek(e.key === 'ArrowRight' ? STEP : -STEP)) { e.preventDefault(); badge(e.key === 'ArrowRight' ? 1 : -1); }
    }
    /* MEDIA-BAR (2026-11-15, owner): a left click on the progress bar jumps to that point (plan Hören + free-study Hören; never in exam mode) */
    function lastMethod() { return last && isMethodAudio(last) ? last : null; }
    function seekTo(frac, track) {
      if (track.closest('.tdm-player')) {
        if (track.closest('.tdm-player.is-exam') || !window.TDM || typeof TDM.audioSeek !== 'function') return;
        var m = lastMethod();
        var go = function (mm) { if (!isFinite(mm.duration) || !mm.duration) return; TDM.audioSeek(frac * mm.duration - (mm.currentTime || 0)); };
        if (m && isFinite(m.duration) && m.duration) { go(m); return; }
        if (typeof TDM.audioToggle === 'function') {                       // not started yet: start it, then jump
          TDM.audioToggle();
          var tries = 0, t = setInterval(function () { var mm = lastMethod(); if ((mm && isFinite(mm.duration) && mm.duration) || ++tries > 40) { clearInterval(t); if (mm) go(mm); } }, 100);
        }
        return;
      }
      var f = window.__freeAudio;
      if (!f) return;
      var set = function () { try { f.currentTime = Math.max(0, Math.min(f.duration - 0.05, frac * f.duration)); f.dispatchEvent(new Event('timeupdate')); } catch (e) { /* ignore */ } };
      if (isFinite(f.duration) && f.duration) set(); else f.addEventListener('loadedmetadata', set, { once: true });
    }
    document.addEventListener('click', function (e) {
      if (e.button !== 0) return;
      var track = e.target && e.target.closest && e.target.closest('.tdm-player-track, .free-audio-track'); if (!track) return;
      var r = track.getBoundingClientRect(); if (!r.width) return;
      var rtl = getComputedStyle(track).direction === 'rtl';
      var frac = Math.max(0, Math.min(1, rtl ? (r.right - e.clientX) / r.width : (e.clientX - r.left) / r.width));
      e.preventDefault(); seekTo(frac, track);
    }, true);
    wrapPlay(window);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onSpaceUp, true);
    // conversation coach iframe: its own document, window and audio
    setInterval(function () {
      var fr = document.getElementById('dcoachFrame'), w = null, d = null;
      try { w = fr && fr.contentWindow; d = fr && fr.contentDocument; } catch (e) { return; }
      if (!w || !d || !d.documentElement || d.__amkMk) return;
      d.__amkMk = true; wrapPlay(w); d.addEventListener('keydown', onKey, true); d.addEventListener('keyup', onSpaceUp, true);
    }, 1000);
    var css = document.createElement('style');
    css.textContent = '#amkMkBadge{position:fixed;left:50%;bottom:88px;transform:translate(-50%,8px);z-index:2147482000;padding:7px 16px;border-radius:999px;font:800 .9rem/1.3 Vazirmatn,Inter,system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,var(--aca-600,#6d4fe6),var(--acb-500,#a855f7));box-shadow:0 10px 26px rgba(2,6,23,.35);opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}#amkMkBadge.is-on{opacity:1;transform:translate(-50%,0)}' +
      '.tdm-player:not(.is-exam) .tdm-player-track,.free-audio-track{cursor:pointer}';
    document.head.appendChild(css);
    window.AmkMediaKeys = { seek: seek, last: function () { return last; } };
  })();

}
