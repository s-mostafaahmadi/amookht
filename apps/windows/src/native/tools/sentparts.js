// Sentence-structure colours in favourites and the notebook (offline rules + premium AI).
// Ported from the site's amk-sentparts.js by the scratchpad script port_tools.py; site globals come from core/site-shim.js.
/* eslint-disable */
export function install(shim) {
  const { S, saveData, render, rememberLearningError, navigateApp, isOwnerAccount, isGlobalContentAdmin, appConfirm, hasPremiumAccess, openPremiumPlans, safeText, ownerAIClientMessageId, authTokens, setAppSetting, normalizeFavorite, setFavoriteRating, apiRequest, fetch } = shim;
  /* Amookht — sentence-structure colours (SENT-PARTS, 2026-11-15, owner request).
     German sentences in «علاقه‌مندی‌ها», «دفتر عبارات» and «اشتباهات» are coloured by Satzglied:
     S Subjekt · V Verb (every verb part) · O Objekt/Prädikativ · P Präpositionalgruppe/Angabe · K Konnektor · X rest.
     Instant offline rules first; premium accounts then get the AI analysis (/v1/sentence-parts, cached in Redis + localStorage).
     Switch: S.appSettings.sentColors (default on) in «تنظیمات برنامه». Wraps render() like telegram-link.js. */
  (function () {
    'use strict';
    var LS_KEY = 'amk_sp_v1', LS_MAX = 1500, BATCH = 12;
    var cache = {}, failed = {}, queue = [], queued = {}, timer = null, busy = false, pauseUntil = 0, noPremium = false;
    try { cache = JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch (e) { cache = {}; }
    function saveCache() {
      try { var k = Object.keys(cache); if (k.length > LS_MAX) k.slice(0, k.length - LS_MAX).forEach(function (x) { delete cache[x]; }); localStorage.setItem(LS_KEY, JSON.stringify(cache)); } catch (e) { /* storage full / blocked */ }
    }
    function appS() { try { return typeof S !== 'undefined' ? S : null; } catch (e) { return null; } }
    function enabled() { var s = appS(); return !!(s && s.currentUser && (!s.appSettings || s.appSettings.sentColors !== false)); }
    function premium() { try { return typeof hasPremiumAccess === 'function' && hasPremiumAccess(); } catch (e) { return false; } }
    function fa() { var s = appS(); return !s || s.uiLanguage !== 'en' && s.uiLanguage !== 'de'; }
    var NAMES = { S: ['فاعل', 'Subjekt'], V: ['فعل', 'Verb'], O: ['مفعول / متمم', 'Objekt'], P: ['قید و گروه حرف اضافه', 'Angabe'], K: ['ربط‌دهنده', 'Konnektor'] };
    function nm(r) { return NAMES[r] ? (fa() ? NAMES[r][0] : NAMES[r][1]) : ''; }

    /* ───────── offline rules ───────── */
    function set(s) { var o = {}; s.split(' ').forEach(function (w) { if (w) o[w] = 1; }); return o; }
    var SUB = set('weil da dass ob obwohl obgleich wenn als damit nachdem bevor seit seitdem sodass falls sofern sobald solange während bis indem ehe');
    var CONJ = set('und oder aber denn sondern doch deshalb deswegen daher darum trotzdem dennoch außerdem jedoch allerdings folglich einerseits andererseits je desto umso zwar sowohl weder entweder sonst also');
    var REL = set('der die das dem den deren dessen denen welcher welche welches welchem welchen was wo wie warum wer wen wem weshalb wofür worüber womit wozu');
    var DET = set('der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines mein meine meinen meinem meiner meines dein deine deinen deinem deiner deines sein seine seinen seinem seiner seines ihr ihre ihren ihrem ihrer ihres unser unsere unseren unserem unserer unseres euer eure euren eurem eurer eures dieser diese dieses diesen diesem jeder jede jedes jeden jedem viele vielen vieler wenige wenigen einige einigen alle allen aller beide beiden manche manchen solche solchen welche jener jene jenes');
    var SUBJ = set('ich du er sie es wir ihr man');
    var OBJP = set('mich dich ihn uns euch mir dir ihm ihnen einander');
    var PREP = set('in an auf aus bei mit nach seit von zu zum zur im am ans ins vom beim durch für fürs gegen ohne um über unter vor hinter neben zwischen trotz wegen statt anstatt während innerhalb außerhalb aufgrund infolge bezüglich gegenüber entlang ab per pro laut gemäß dank mithilfe');
    var ADV = set('heute gestern morgen jetzt nun oft immer nie niemals manchmal bereits schon bald dann danach damals hier dort überall zuerst später früher sofort meistens selten gern gerne leider vielleicht wahrscheinlich tatsächlich besonders zusammen allein trotzdem dabei dafür darauf deshalb dagegen insgesamt etwa ungefähr fast kaum zurzeit derzeit inzwischen täglich wöchentlich jährlich');
    var PART = set('nicht auch nur noch sehr ganz eher ja doch mal wohl etwa gar zu so');
    var VERB = set('bin bist ist sind seid war warst waren wart sei seien wäre wären habe hast hat haben habt hatte hattest hatten hätte hätten werde wirst wird werden werdet wurde wurden würde würdest würden kann kannst können könnt konnte konnten könnte könnten muss musst müssen müsst musste mussten müsste müssten soll sollst sollen sollt sollte sollten will willst wollen wollt wollte wollten möchte möchtest möchten darf darfst dürfen durfte dürfte mag magst mögen mochte gibt gab gäbe geht ging kommt kam macht machte sagt sagte steht stand liegt lag bleibt blieb lässt ließ heißt hieß gehört findet fand nimmt nahm sieht sah weiß wusste denkt dachte bringt brachte braucht brauchte zeigt zeigte führt führte stellt stellte beträgt betrug steigt stieg sinkt sank fällt fiel hilft half spricht sprach trifft traf tritt trat hält hielt fährt fuhr läuft lief gilt galt bietet bot lernt lernte arbeitet arbeitete wohnt wohnte spielt spielte kostet kostete gefällt gefiel fehlt fehlte entsteht entstand besteht bestand erhält erhielt verliert verlor gewinnt gewann beginnt begann entscheidet entschied');
    var VPRE = set('an auf aus ein mit vor zu zurück weg fest statt teil los hin her bei nach dar fort vorbei zusammen heraus herein hinaus voran weiter wieder kennen');
    var TOK = /[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*|\d+(?:[.,]\d+)*%?|[^\sA-Za-zÄÖÜäöüß\d]/g;

    function offline(text) {
      var toks = [], m; TOK.lastIndex = 0;
      while ((m = TOK.exec(text))) toks.push({ t: m[0], lo: m[0].toLowerCase(), s: m.index, e: m.index + m[0].length, word: /[A-Za-zÄÖÜäöüß]/.test(m[0]), punct: !/[A-Za-zÄÖÜäöüß\d]/.test(m[0]), r: null, g: null });
      var cap = function (k) { var x = toks[k]; return x && x.word && /^[A-ZÄÖÜ]/.test(x.t); };
      // clauses: split at punctuation and subordinators / relative pronouns after a comma
      var clauses = [], cur = [];
      toks.forEach(function (x, k) {
        var prev = toks[k - 1];
        var startSub = x.word && (SUB[x.lo] || (prev && prev.t === ',' && (REL[x.lo] || CONJ[x.lo])));
        if (x.punct) { x.r = 'X'; if (cur.length) clauses.push(cur); cur = []; return; }
        if (startSub && cur.length) { clauses.push(cur); cur = []; }
        cur.push(k);
      });
      if (cur.length) clauses.push(cur);
      var gid = 0;
      clauses.forEach(function (ks) {
        var first = toks[ks[0]], sub = !!(SUB[first.lo] || (toks[ks[0] - 1] && toks[ks[0] - 1].t === ',' && REL[first.lo]));
        if (SUB[first.lo] || CONJ[first.lo] || (toks[ks[0] - 1] && toks[ks[0] - 1].t === ',' && REL[first.lo])) first.r = 'K';
        var last = ks[ks.length - 1];
        // um … zu: "um" is a connector, "zu" + infinitive are verb parts
        ks.forEach(function (k) { var x = toks[k]; if (x.lo === 'um' && ks.some(function (j) { return j > k && toks[j].lo === 'zu' && toks[j + 1] && /en$/.test(toks[j + 1].lo); })) x.r = 'K'; });
        var hasFinite = false;
        ks.forEach(function (k) {
          var x = toks[k]; if (x.r || !x.word) return;
          var lo = x.lo, prevD = toks[k - 1] && (DET[toks[k - 1].lo] || PREP[toks[k - 1].lo]);
          if (lo === 'sich') { x.r = 'V'; return; }
          if (VERB[lo] && !(k === ks[0] && cap(k) && !VERB[lo])) { x.r = 'V'; hasFinite = true; return; }
          if (lo === 'zu' && toks[k + 1] && /(en|ern|eln)$/.test(toks[k + 1].lo) && !cap(k + 1)) { x.r = 'V'; toks[k + 1].r = 'V'; return; }
          if (!cap(k) && !prevD && /^ge[a-zäöüß]{3,}(t|en)$/.test(lo)) { x.r = 'V'; return; }
          if (k === last && !cap(k) && !prevD && /(en|ern|eln)$/.test(lo) && !DET[lo] && !PREP[lo] && !ADV[lo]) { x.r = 'V'; return; }
          if (k === last && VPRE[lo] && hasFinite) { x.r = 'V'; return; }
          if (k === last && sub && !cap(k) && !prevD && !DET[lo] && !PREP[lo] && !ADV[lo] && !PART[lo] && !SUBJ[lo] && !OBJP[lo] && /(t|e|en|ern|eln)$/.test(lo)) { x.r = 'V'; return; }
        });
        // main clause with no known verb: the first lowercase -t/-e/-st/-en word after the first group is the finite verb
        if (!sub && !ks.some(function (k) { return toks[k].r === 'V'; })) {
          for (var i = cap(ks[0]) ? 1 : 0; i < ks.length; i++) { var y = toks[ks[i]], lo2 = y.lo, pv = toks[ks[i] - 1]; if (!y.r && y.word && !cap(ks[i]) && !DET[lo2] && !PREP[lo2] && !ADV[lo2] && !PART[lo2] && !SUBJ[lo2] && !OBJP[lo2] && /(t|e|st|en)$/.test(lo2) && !(pv && (DET[pv.lo] || PREP[pv.lo]))) { y.r = 'V'; break; } }
        }
        var verbless = !ks.some(function (k) { return toks[k].r === 'V'; }), subjectDone = /^(um|ohne|statt|anstatt)$/.test(first.lo) && first.r === 'K';
        for (var j = 0; j < ks.length; j++) {
          var k = ks[j], x = toks[k]; if (x.r || !x.word) continue;
          var lo = x.lo;
          if (PREP[lo]) {                                    // preposition + its group up to the noun / pronoun
            var g = ++gid; x.r = 'P'; x.g = g;
            while (j + 1 < ks.length) { var n = toks[ks[j + 1]]; if (n.r || !n.word && !/^\d/.test(n.t)) break; n.r = 'P'; n.g = g; j++; if (cap(ks[j]) || SUBJ[n.lo] || OBJP[n.lo] || /^\d/.test(n.t)) { if (toks[ks[j + 1]] && (toks[ks[j + 1]].lo === 'des' || toks[ks[j + 1]].lo === 'der') && cap(ks[j + 2])) continue; break; } }
            continue;
          }
          if (ADV[lo] && !cap(k) || ADV[lo] && k === ks[0]) { x.r = 'P'; continue; }
          if (PART[lo]) { x.r = 'X'; continue; }
          if (SUBJ[lo] && !(lo === 'sie' || lo === 'es' || lo === 'ihr') || (SUBJ[lo] && !subjectDone)) { x.r = verbless ? 'O' : (subjectDone ? 'O' : 'S'); if (x.r === 'S') subjectDone = true; continue; }
          if (OBJP[lo]) { x.r = 'O'; continue; }
          if (DET[lo] || cap(k) || /^\d/.test(x.t) || (!cap(k) && toks[ks[j + 1]] && cap(ks[j + 1]))) {   // noun group
            var g2 = ++gid, role = verbless ? 'O' : (subjectDone ? 'O' : 'S'); if (role === 'S') subjectDone = true;
            x.r = role; x.g = g2;
            if (!cap(k) || DET[lo]) { while (j + 1 < ks.length) { var n2 = toks[ks[j + 1]]; if (n2.r || !n2.word) break; n2.r = role; n2.g = g2; j++; if (cap(ks[j])) break; } }
            while (j + 2 < ks.length && (toks[ks[j + 1]].lo === 'des' || toks[ks[j + 1]].lo === 'der') && !toks[ks[j + 1]].r && sub === false) { var n3 = toks[ks[j + 1]]; if (!toks[ks[j + 2]] || toks[ks[j + 2]].r) break; n3.r = role; n3.g = g2; j++; while (j + 1 < ks.length) { var n4 = toks[ks[j + 1]]; if (n4.r || !n4.word) break; n4.r = role; n4.g = g2; j++; if (cap(ks[j])) break; } }
            continue;
          }
          x.r = 'X';
        }
      });
      // merge consecutive tokens of the same role/group into spans
      var spans = [];
      toks.forEach(function (x) {
        var r = x.r || 'X', last = spans[spans.length - 1];
        if (last && last.r === r && r !== 'V' && r !== 'X' && last.g === x.g && x.g != null) { last.e = x.e; return; }
        spans.push({ s: x.s, e: x.e, r: r, g: x.g });
      });
      return spans;
    }

    function fromAI(text, seg) {
      var pos = 0, out = [];
      for (var i = 0; i < seg.length; i++) { var t = String(seg[i][0] || ''), idx = text.indexOf(t, pos); if (idx < 0) return null; out.push({ s: idx, e: idx + t.length, r: seg[i][1] }); pos = idx + t.length; }
      return out;
    }

    /* ───────── painting ───────── */
    var FA_RE = /[؀-ۿ]/;
    function eligibleText(t) {
      if (!t || t.length < 3 || t.length > 300 || FA_RE.test(t) || t.indexOf('+') >= 0) return false;
      var words = t.match(/[A-Za-zÄÖÜäöüß]{2,}/g); return !!words && words.length >= 3; /* single words / article+noun are vocabulary, not sentences */
    }
    function paint(el, text, spans, src) {
      var frag = document.createDocumentFragment(), pos = 0;
      spans.forEach(function (sp) {
        if (sp.s > pos) frag.appendChild(document.createTextNode(text.slice(pos, sp.s)));
        var piece = text.slice(sp.s, sp.e);
        if (sp.r === 'X' || !NAMES[sp.r]) frag.appendChild(document.createTextNode(piece));
        else { var s = document.createElement('span'); s.className = 'sp sp-' + sp.r; s.title = nm(sp.r); s.textContent = piece; frag.appendChild(s); }
        pos = sp.e;
      });
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      el.textContent = ''; el.appendChild(frag);
      el.classList.add('amk-sp'); el.setAttribute('data-sp', src); el.setAttribute('data-sp-text', text);
    }
    var TARGETS = {
      favorites: '.fav-card h2, .fav-answer, .fav-context',
      errorbook: '.vc.is-red h4, .vc-ex, .ei-main > b, .ei-back h3'
    };
    function targets() {
      var s = appS(), sel = s && TARGETS[s.screen]; if (!sel) return [];
      return [].slice.call(document.querySelectorAll('#view ' + sel.split(', ').join(', #view ')));
    }
    function simple(el) { for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 1 && !/^(I|EM|SPAN)$/.test(n.tagName)) return false; } return !el.closest('input,textarea,[contenteditable="true"],.amk-no-sp'); }
    function run() {
      if (!enabled()) { var s0 = appS(); if (s0 && s0.currentUser && targets().some(function (el) { return eligibleText(el.textContent.replace(/\s+/g, ' ').trim()) && simple(el); })) legend(false); return; } /*SP-TOGGLE*/
      var els = targets(), any = false;
      els.forEach(function (el) {
        var text = (el.getAttribute('data-sp') === 'ai' ? el.getAttribute('data-sp-text') : null) || el.textContent.replace(/\s+/g, ' ').trim();
        if (el.getAttribute('data-sp') === 'ai' || !eligibleText(text) || !simple(el)) return;
        any = true;
        var c = cache[text], sp = c && fromAI(text, c);
        if (sp) { paint(el, text, sp, 'ai'); return; }
        if (el.getAttribute('data-sp') !== 'off') paint(el, text, offline(text), 'off');
        want(text);
      });
      if (any || document.querySelector('#view .amk-sp')) legend(true);
    }
    function want(text) {
      if (noPremium || failed[text] || queued[text] || !premium()) return;
      queued[text] = 1; queue.push(text); schedule(350);
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, Math.max(ms, pauseUntil - Date.now())); }
    function flush() {
      if (busy || !queue.length || typeof apiRequest !== 'function') return;
      if (Date.now() < pauseUntil) { schedule(pauseUntil - Date.now()); return; }
      var batch = queue.splice(0, BATCH); busy = true;
      apiRequest('/sentence-parts', { method: 'POST', body: JSON.stringify({ sentences: batch }) }).then(function (r) {
        var res = (r && r.results) || {};
        batch.forEach(function (t) { delete queued[t]; if (res[t]) cache[t] = res[t]; else failed[t] = 1; });
        saveCache(); repaint(batch);
      }).catch(function (e) {
        var st = e && (e.status || e.statusCode);
        if (st === 403) noPremium = true; else pauseUntil = Date.now() + 60000;
        batch.forEach(function (t) { delete queued[t]; if (st === 403 || st === 422) failed[t] = 1; else { queued[t] = 1; queue.push(t); } });
      }).then(function () { busy = false; if (queue.length) schedule(400); });
    }
    function repaint(texts) {
      var want_ = {}; texts.forEach(function (t) { want_[t] = 1; });
      [].slice.call(document.querySelectorAll('#view .amk-sp[data-sp="off"]')).forEach(function (el) {
        var t = el.getAttribute('data-sp-text'); if (!want_[t] || !cache[t]) return; var sp = fromAI(t, cache[t]); if (sp) paint(el, t, sp, 'ai');
      });
    }

    /* ───────── legend + settings ───────── */
    function legendHtml(on) { /*SP-TOGGLE*/
      if (!on) return '<span class="sp-lg-t">' + (fa() ? 'رنگ ساختار جمله: خاموش' : 'Satzbau-Farben: aus') + '</span>' +
        '<button type="button" class="sp-lg-btn sp-lg-on">' + (fa() ? 'روشن' : 'Ein') + '</button>';
      var chips = ['S', 'V', 'O', 'P', 'K'].map(function (r) { return '<span class="sp-chip sp-' + r + '">' + nm(r) + '</span>'; }).join('');
      return '<span class="sp-lg-t">' + (fa() ? 'رنگ ساختار جمله:' : 'Satzbau:') + '</span>' + chips +
        '<button type="button" class="sp-lg-btn sp-lg-off">' + (fa() ? 'خاموش' : 'Aus') + '</button>';
    }
    function legend(on) {
      var old = document.querySelector('#view .sp-legend');
      if (old) { if (old.getAttribute('data-on') === String(!!on)) return; old.remove(); }
      var s = appS(), anchor = null, before = true;
      if (s.screen === 'favorites') { anchor = document.querySelector('#view .toolbar'); before = false; }
      else anchor = document.querySelector('#view .vgrid') || document.querySelector('#view .err-list');
      if (!anchor) return;
      var d = document.createElement('div'); d.className = 'sp-legend' + (on ? '' : ' is-off'); d.setAttribute('data-on', String(!!on)); d.dir = fa() ? 'rtl' : 'ltr'; d.innerHTML = legendHtml(on);
      d.querySelector('.sp-lg-btn').addEventListener('click', function () { if (typeof setAppSetting === 'function') setAppSetting('sentColors', !on); });
      anchor.parentNode.insertBefore(d, before ? anchor : anchor.nextSibling);
    }
    function settingsCard() {
      var s = appS(); if (!s || s.screen !== 'appSettings') return;
      var grid = document.querySelector('#view .settings-grid'); if (!grid || grid.querySelector('#amk-sp-set')) return;
      var on = !s.appSettings || s.appSettings.sentColors !== false;
      var c = document.createElement('section'); c.id = 'amk-sp-set'; c.className = 'app-pref-card amk-sp-set';
      var l10n = (appS() || {}).uiLanguage, tr = function (f, e, d) { return l10n === 'en' ? e : l10n === 'de' ? d : f; };
      c.innerHTML = '<div class="app-pref-title"><span aria-hidden="true">🎨</span><div><h2>' + tr('رنگ‌بندی ساختار جمله‌ها', 'Sentence-structure colours', 'Satzbau-Farben') + '</h2><p>' + tr('جمله‌های علاقه‌مندی‌ها، دفتر عبارات و اشتباهات با رنگ اجزای جمله نمایش داده شوند', 'Colour sentence parts in favourites, notebook and mistakes', 'Satzglieder in Favoriten, Heft und Fehlern färben') + '</p></div></div>' +
        '<label class="sp-set-row"><span class="sp-set-demo" dir="ltr"><span class="sp sp-S">Ich</span> <span class="sp sp-V">stelle</span> <span class="sp sp-O">das Buch</span> <span class="sp sp-P">morgen</span> <span class="sp sp-V">vor</span>.</span><input type="checkbox" ' + (on ? 'checked' : '') + '></label>';
      c.querySelector('input').addEventListener('change', function (e) { if (typeof setAppSetting === 'function') setAppSetting('sentColors', e.target.checked); });
      var acc = grid.querySelector('#tgl-card') || grid.querySelector('.app-account-link');
      if (acc && acc.parentNode === grid) grid.insertBefore(c, acc); else grid.appendChild(c);
    }

    function after() { try { var s = appS(); if (!s || !s.currentUser) return; settingsCard(); if (s.screen === 'favorites' || s.screen === 'errorbook') run(); } catch (e) { /* never break the app */ } }
    function hook() {
      if (typeof window.render !== 'function' || window.render.__amkSp) return false;
      var base = window.render;
      var wrapped = function () { var r = base.apply(this, arguments); after(); return r; };
      for (var k in base) { try { wrapped[k] = base[k]; } catch (e) { /* ignore */ } }
      wrapped.__amkSp = true; window.render = wrapped; after(); return true;
    }
    if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 50) clearInterval(t); }, 200); }
    window.AmkSentParts = { offline: offline, run: after, _cache: function () { return cache; } };
  })();

}
