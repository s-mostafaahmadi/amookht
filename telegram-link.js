/* Amookht — Telegram bot link card (account settings) + announcement banner (dashboard). 2026-11-13.
   Wraps render() like scroll-top.js; only adds DOM after the app rendered, never changes the sidebar or order.
   Backend: /v1/telegram/{status,link,announcement}. */
(function () {
  'use strict';
  var st = { status: null, at: 0, busy: false, polling: 0, err: '', ann: null, annAt: 0, annBusy: false };
  var DISMISS_KEY = 'amookht_ann_dismissed';

  function loggedIn() { try { return typeof S !== 'undefined' && !!S.currentUser && typeof apiRequest === 'function'; } catch (e) { return false; } }
  function dark() { try { return !!S.dark; } catch (e) { return false; } }
  function langOf() { try { var l = S.uiLanguage; return l === 'en' ? 'en' : l === 'de' ? 'de' : 'fa'; } catch (e) { return 'fa'; } }
  function L(f, e, d) { var l = langOf(); return l === 'fa' ? f : l === 'en' ? e : d; }
  function dirClass() { return langOf() === 'fa' ? '' : ' is-ltr'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

  function css() {
    if (document.getElementById('tgl-style')) return;
    var s = document.createElement('style');
    s.id = 'tgl-style';
    s.textContent = [
      '.tgl-card{padding:20px;border-radius:16px;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.06);direction:rtl}',
      '.tgl-card.is-ltr{direction:ltr}.tgl-card.is-ltr .tgl-list{padding:0 0 0 18px}.amk-ann.is-ltr{direction:ltr}',
      '.tgl-card.is-dark{background:#1f2937;color:#f9fafb}',
      '.tgl-card.is-dark.tgl-in{background:transparent;padding:0;box-shadow:none;border-radius:0}.tgl-hx.tgl-solo{margin-top:14px}.tgl-in .tgl-head h2{font-size:15px;font-weight:800}',
      '.tgl-card.tgl-in{background:transparent;padding:0;box-shadow:none;border-radius:0}.tgl-set .tgl-head h2{font-size:15px;font-weight:800}',
      '.tgl-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}',
      '.tgl-logo{width:40px;height:40px;border-radius:12px;background:#229ED9;display:grid;place-items:center;flex:none}',
      '.tgl-logo svg{width:22px;height:22px;fill:#fff}',
      '.tgl-head h2{font-weight:700;font-size:1rem;margin:0}',
      '.tgl-head p{font-size:.75rem;color:#6b7280;margin:2px 0 0}',
      '.tgl-card.is-dark .tgl-head p,.tgl-card.is-dark .tgl-note{color:#9ca3af}',
      '.tgl-list{font-size:.8rem;line-height:1.9;margin:0 0 12px;padding:0 18px 0 0}',
      '.tgl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.tgl-btn{border:0;border-radius:12px;padding:10px 16px;font-size:.85rem;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}',
      '.tgl-btn.primary{background:#229ED9;color:#fff}.tgl-btn.primary:hover{background:#1b8ac0}',
      '.tgl-btn.ghost{background:#f3f4f6;color:#374151}.tgl-card.is-dark .tgl-btn.ghost{background:#374151;color:#e5e7eb}',
      '.tgl-btn.danger{background:#fee2e2;color:#b91c1c}',
      '.tgl-btn[disabled]{opacity:.6;cursor:wait}',
      '.tgl-ok{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#ecfdf5;color:#047857;font-size:.85rem;font-weight:600;margin-bottom:12px}',
      '.tgl-card.is-dark .tgl-ok{background:rgba(16,185,129,.12);color:#6ee7b7}',
      '.tgl-note{font-size:.72rem;color:#6b7280;margin-top:10px}',
      '.tgl-err{font-size:.75rem;color:#dc2626;margin-top:8px}',
      '.amk-ann{position:relative;direction:rtl;margin:12px auto 0;max-width:72rem;width:calc(100% - 24px);display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:16px;',
      'background:linear-gradient(135deg,rgba(34,158,217,.12),rgba(99,102,241,.12));border:1px solid rgba(34,158,217,.35);color:#0f172a;font-size:.88rem;line-height:1.8;z-index:1}',
      '.amk-ann.is-dark{color:#e5e7eb;background:linear-gradient(135deg,rgba(34,158,217,.18),rgba(99,102,241,.18))}',
      '.amk-ann b{display:block;font-size:.8rem;opacity:.8}',
      '.amk-ann p{margin:0;white-space:pre-line;word-break:break-word}',
      '.amk-ann button{margin-inline-start:auto;flex:none;border:0;background:transparent;font-size:1.25rem;line-height:1;cursor:pointer;color:inherit;opacity:.6;padding:2px 6px}',
      '.amk-ann button:hover{opacity:1}'
    ].join('');
    document.head.appendChild(s);
  }

  var LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13l-4.8-1.5c-1-.3-1.1-1 .2-1.5L20.5 2.7c.9-.3 1.6.2 1.4 1.6z"/></svg>';

  /* ---------- settings card ---------- */
  function loadStatus(force) {
    if (st.busy || !loggedIn()) return;
    if (!force && st.status && Date.now() - st.at < 30000) return;
    st.busy = true;
    apiRequest('/telegram/status').then(function (r) { st.status = r; st.at = Date.now(); st.err = ''; })
      .catch(function () { st.err = L('وضعیت اتصال تلگرام دریافت نشد.', 'Could not load the Telegram connection status.', 'Der Telegram-Status konnte nicht geladen werden.'); })
      .then(function () { st.busy = false; paintCard(); });
  }

  function cardHtml() {
    var s = st.status, bot = s && s.bot ? s.bot : '';
    var h = '<div class="tgl-head"><span class="tgl-logo">' + LOGO + '</span><div><h2>' + L('اتصال تلگرام', 'Telegram connection', 'Telegram-Verbindung') + '</h2><p>' + L('گزارش روزانه، یادآوری برنامه و اطلاعیه‌های آموخت در تلگرام', 'Daily report, plan reminders and Amookht announcements on Telegram', 'Tagesbericht, Plan-Erinnerungen und Amookht-Mitteilungen auf Telegram') + '</p></div></div>';
    if (!s) return h + '<p class="tgl-note">' + L('در حال بررسی…', 'Checking…', 'Wird geprüft…') + '</p>' + (st.err ? '<p class="tgl-err">' + esc(st.err) + '</p>' : '');
    if (s.linked) {
      var who = [s.telegram_name, s.telegram_username ? '@' + s.telegram_username : ''].filter(Boolean).join(' · ');
      h += '<div class="tgl-ok">' + L('✅ به تلگرام وصل است', '✅ Connected to Telegram', '✅ Mit Telegram verbunden') + (who ? ' — ' + esc(who) : '') + (s.active === false ? L(' (ربات بسته شده؛ دوباره Start بزنید)', ' (bot stopped; press Start again)', ' (Bot gestoppt; erneut Start drücken)') : '') + '</div>';
      h += '<div class="tgl-row">' + (bot ? '<a class="tgl-btn primary" href="https://t.me/' + esc(bot) + '" target="_blank" rel="noopener">' + LOGO.replace('<svg', '<svg style="width:16px;height:16px;fill:#fff"') + L(' باز کردن ربات', ' Open bot', ' Bot öffnen') + '</a>' : '') +
        '<button type="button" class="tgl-btn danger" data-tgl="unlink">' + L('قطع اتصال', 'Disconnect', 'Trennen') + '</button></div>';
      h += '<p class="tgl-note">' + L('ساعت یادآوری و گزارش شبانه را در ربات از «⚙️ تنظیمات اعلان‌ها» تغییر دهید.', 'Change the reminder time and nightly report in the bot under “⚙️ Notification settings”.', 'Ändere Erinnerungszeit und Nachtbericht im Bot unter „⚙️ Benachrichtigungseinstellungen“.') + '</p>';
    } else {
      h += '<ul class="tgl-list"><li>' + L('🔔 یادآوری عصر اگر هنوز مطالعه نکرده باشید', '🔔 Evening reminder if you have not studied yet', '🔔 Abenderinnerung, wenn du noch nicht gelernt hast') + '</li><li>' + L('🌙 گزارش شبانه پیشرفت همان روز', '🌙 Nightly report of that day’s progress', '🌙 Nachtbericht über den Fortschritt des Tages') + '</li><li>' + L('📢 اطلاعیه‌های جدید آموخت', '📢 New Amookht announcements', '📢 Neue Amookht-Mitteilungen') + '</li></ul>';
      h += '<div class="tgl-row"><button type="button" class="tgl-btn primary" data-tgl="link"' + (st.polling ? ' disabled' : '') + '>' + LOGO.replace('<svg', '<svg style="width:16px;height:16px;fill:#fff"') + (st.polling ? L(' در انتظار تأیید در تلگرام…', ' Waiting for confirmation in Telegram…', ' Warte auf Bestätigung in Telegram…') : L(' اتصال به تلگرام', ' Connect Telegram', ' Telegram verbinden')) + '</button></div>';
      h += '<p class="tgl-note">' + L('با زدن دکمه، ربات آموخت در تلگرام باز می‌شود؛ «Start» را بزنید تا حساب وصل شود.', 'Pressing the button opens the Amookht bot in Telegram; press “Start” to link your account.', 'Die Schaltfläche öffnet den Amookht-Bot in Telegram; drücke „Start“, um dein Konto zu verbinden.') + '</p>';
    }
    if (st.err) h += '<p class="tgl-err">' + esc(st.err) + '</p>';
    return h;
  }

  function paintCard() {
    /*TGSET*/ // «تنظیمات برنامه» card, placed before the account-settings link card
    if (!loggedIn() || S.screen !== 'appSettings') return;
    var grid = document.querySelector('#app .app-settings-grid');
    if (!grid) return;
    var card = document.getElementById('tgl-card');
    if (!card || !grid.contains(card)) {
      if (card) card.remove();
      card = document.createElement('section');
      card.id = 'tgl-card';
      var acc = grid.querySelector('.app-account-link');
      if (acc && acc.parentNode === grid) grid.insertBefore(card, acc); else grid.appendChild(card);
      card.addEventListener('click', onCardClick);
    }
    card.className = 'app-pref-card tgl-set';
    card.innerHTML = '<div class="tgl-card tgl-in' + (dark() ? ' is-dark' : '') + dirClass() + '">' + cardHtml() + '</div>';
  }

  async function onCardClick(ev) {
    var btn = ev.target.closest('[data-tgl]');
    if (!btn) return;
    var act = btn.getAttribute('data-tgl');
    if (act === 'link') startLink(btn);
    if (act === 'unlink') {
      if (!await appConfirm(L('اتصال تلگرام قطع شود؟ دیگر گزارش و یادآوری نمی‌گیرید.', 'Disconnect Telegram? You will no longer get reports or reminders.', 'Telegram-Verbindung trennen? Du erhältst dann keine Berichte und Erinnerungen mehr.'))) return;
      apiRequest('/telegram/link', { method: 'DELETE' }).then(function () { loadStatus(true); })
        .catch(function () { st.err = L('قطع اتصال انجام نشد؛ دوباره تلاش کنید.', 'Disconnecting failed. Try again.', 'Trennen fehlgeschlagen. Versuche es erneut.'); paintCard(); });
    }
  }

  function startLink(btn) {
    // Open the window synchronously (popup blockers), then point it at the deep link.
    var win = null;
    try { win = window.open('', '_blank'); } catch (e) { win = null; }
    btn.disabled = true;
    apiRequest('/telegram/link', { method: 'POST' }).then(function (r) {
      st.err = '';
      if (win && !win.closed) { try { win.location.href = r.url; } catch (e) { location.href = r.url; } }
      else location.href = r.url;
      pollLinked();
    }).catch(function (e) {
      if (win) try { win.close(); } catch (x) { }
      st.err = (e && e.status === 429) ? L('تعداد درخواست‌ها زیاد بود؛ کمی بعد دوباره امتحان کنید.', 'Too many requests. Try again in a moment.', 'Zu viele Anfragen. Versuche es gleich noch einmal.') : L('ساخت لینک اتصال انجام نشد؛ دوباره تلاش کنید.', 'Could not create the connection link. Try again.', 'Verbindungslink konnte nicht erstellt werden. Versuche es erneut.');
      btn.disabled = false; paintCard();
    });
  }

  function pollLinked() {
    var started = Date.now();
    clearInterval(st.polling);
    st.polling = setInterval(function () {
      if (Date.now() - started > 180000) { clearInterval(st.polling); st.polling = 0; paintCard(); return; }
      apiRequest('/telegram/status').then(function (r) {
        st.status = r; st.at = Date.now();
        if (r.linked) { clearInterval(st.polling); st.polling = 0; }
        paintCard();
      }).catch(function () { });
    }, 3000);
    paintCard();
  }

  /* ---------- announcement banner ---------- */
  function loadAnn() {
    if (st.annBusy || !loggedIn() || Date.now() - st.annAt < 600000) return;
    st.annBusy = true;
    apiRequest('/telegram/announcement').then(function (r) { st.ann = r && r.announcement; st.annAt = Date.now(); })
      .catch(function () { st.annAt = Date.now() - 480000; })
      .then(function () { st.annBusy = false; paintAnn(); });
  }

  function paintAnn() {
    var old = document.getElementById('amk-ann');
    var a = st.ann;
    var show = loggedIn() && S.screen === 'dashboard' && a && String(lsGet(DISMISS_KEY)) !== String(a.id) && !S.activeActivity;
    if (!show) { if (old) old.remove(); return; }
    var app = document.getElementById('app');
    if (!app || !app.firstElementChild) return;
    if (old && old.getAttribute('data-id') === String(a.id) && app.contains(old)) { old.className = 'amk-ann' + (dark() ? ' is-dark' : '') + dirClass(); return; }
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'amk-ann';
    el.setAttribute('data-id', String(a.id));
    el.setAttribute('role', 'status');
    el.className = 'amk-ann' + (dark() ? ' is-dark' : '') + dirClass();
    el.innerHTML = '<span aria-hidden="true" style="font-size:1.3rem">📢</span><div><b>' + L('اطلاعیه آموخت', 'Amookht announcement', 'Amookht-Mitteilung') + '</b><p>' + esc(a.text) + '</p></div><button type="button" aria-label="' + L('بستن', 'Close', 'Schließen') + '">×</button>';
    el.querySelector('button').addEventListener('click', function () { lsSet(DISMISS_KEY, String(a.id)); el.remove(); });
    var host = app.firstElementChild;
    host.insertBefore(el, host.firstChild);
  }

  function after() {
    try {
      if (!loggedIn()) return;
      css();
      if (S.screen === 'appSettings') { loadStatus(false); paintCard(); }
      if (S.screen === 'dashboard') { loadAnn(); paintAnn(); }
    } catch (e) { /* never break the app */ }
  }

  function hook() {
    if (typeof window.render !== 'function' || window.render.__tgl) return false;
    var base = window.render;
    var wrapped = function () { var r = base.apply(this, arguments); after(); return r; };
    for (var k in base) { try { wrapped[k] = base[k]; } catch (e) { } }
    wrapped.__tgl = true;
    window.render = wrapped;
    after();
    return true;
  }
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 50) clearInterval(t); }, 200); }
  window.AmookhtTelegram = { refresh: function () { st.at = 0; st.annAt = 0; after(); } };
})();
