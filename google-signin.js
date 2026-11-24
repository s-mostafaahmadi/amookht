/* Amookht: "Sign in with Google" (Google Identity Services, ID-token flow).
 * The button and One Tap appear only on the landing/auth screens, only when the backend reports a
 * Client ID (GET /v1/auth/google/config), and never inside the Android app / WebViews, where Google
 * blocks its sign-in (disallowed_useragent). The Google ID token is verified by POST /v1/auth/google,
 * which returns the app's normal tokens; the rest is the same path as password login (loginAs).
 * Hooks in testdaf-daily-plan.html: GoogleAuth.block(isLogin) in renderAuth(), GoogleAuth.sync() in render().
 */
(function () {
  'use strict';
  var GSI_SRC = 'https://accounts.google.com/gsi/client';
  var st = { cfg: null, cfgPromise: null, gsiPromise: null, inited: false, prompted: false, promptOpen: false, busy: false, failed: false };
  var TXT = {
    or: { fa: 'یا با ایمیل', en: 'or with email', de: 'oder mit E-Mail' },
    appHint: {
      fa: 'ورود با گوگل داخل اپ اندروید ممکن نیست (محدودیت خود گوگل). اگر با گوگل ثبت‌نام کرده‌اید، یک بار با «رمز عبور را فراموش کرده‌اید؟» برای همان جیمیل رمز بسازید و اینجا با ایمیل و رمز وارد شوید.',
      en: 'Google sign-in is not available inside the Android app (a Google restriction). If you signed up with Google, use "Forgot password?" once to create a password for that Gmail address, then sign in here with email and password.',
      de: 'Die Google-Anmeldung ist in der Android-App nicht möglich (eine Google-Beschränkung). Wenn du dich mit Google registriert hast, lege einmal über „Passwort vergessen?“ ein Passwort für diese Gmail-Adresse fest und melde dich hier mit E-Mail und Passwort an.'
    },
    google_token_invalid: { fa: 'تأیید ورود با گوگل انجام نشد. دوباره امتحان کنید.', en: 'Google sign-in could not be verified. Please try again.', de: 'Die Google-Anmeldung konnte nicht bestätigt werden. Bitte erneut versuchen.' },
    google_email_unverified: { fa: 'ایمیل این حساب گوگل تأیید نشده است.', en: 'The email address of this Google account is not verified.', de: 'Die E-Mail-Adresse dieses Google-Kontos ist nicht bestätigt.' },
    google_account_mismatch: { fa: 'این ایمیل به حساب گوگل دیگری متصل است. با ایمیل و رمز عبور وارد شوید.', en: 'This email is linked to a different Google account. Sign in with email and password.', de: 'Diese E-Mail ist mit einem anderen Google-Konto verknüpft. Melde dich mit E-Mail und Passwort an.' },
    google_link_requires_password: { fa: 'برای این ایمیل قبلاً حساب ساخته شده است. چون این آدرس جیمیل نیست، اتصال خودکار به گوگل ممکن نیست؛ با ایمیل و رمز عبور وارد شوید.', en: 'An account with this email already exists. It is not a Gmail address, so it cannot be linked to Google automatically; sign in with email and password.', de: 'Für diese E-Mail gibt es bereits ein Konto. Da es keine Gmail-Adresse ist, kann es nicht automatisch mit Google verknüpft werden; melde dich mit E-Mail und Passwort an.' },
    google_unavailable: { fa: 'ارتباط با گوگل برقرار نشد. کمی بعد دوباره امتحان کنید.', en: 'Could not reach Google. Please try again shortly.', de: 'Google ist gerade nicht erreichbar. Bitte gleich noch einmal versuchen.' },
    google_not_configured: { fa: 'ورود با گوگل هنوز فعال نشده است.', en: 'Google sign-in is not enabled yet.', de: 'Die Google-Anmeldung ist noch nicht aktiviert.' }
  };

  function lang() { try { return ['fa', 'en', 'de'].indexOf(S.uiLanguage) >= 0 ? S.uiLanguage : 'fa'; } catch (e) { return 'fa'; } }
  function tr(key) { var g = TXT[key] || {}; return g[lang()] || g.fa || key; }
  function apiBase() { try { return APP_API_BASE; } catch (e) { return '/v1'; } }
  function isDark() { try { return !!S.dark; } catch (e) { return false; } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Google refuses OAuth inside embedded WebViews; the Amookht APK appends "AmookhtAndroid/x.y" to its UA.
  function inApp() {
    var ua = navigator.userAgent || '';
    try { if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return true; } catch (e) { /* not native */ }
    return /AmookhtAndroid\//.test(ua) || /; wv\)/.test(ua);
  }

  function onAuthScreens() {
    try { return !S.currentUser && (S.screen === 'landing' || (S.screen === 'auth' && (S.authStep || 'form') === 'form')); } catch (e) { return false; }
  }

  function loadCfg() {
    if (!st.cfgPromise) {
      st.cfgPromise = fetch(apiBase() + '/auth/google/config', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : { enabled: false }; })
        .catch(function () { return { enabled: false }; })
        .then(function (c) { st.cfg = { enabled: !!(c && c.enabled && c.client_id), client_id: String((c && c.client_id) || '') }; return st.cfg; });
    }
    return st.cfgPromise;
  }

  function loadGsi() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    if (!st.gsiPromise) {
      st.gsiPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script'), done = false;
        var finish = function (ok) { if (done) return; done = true; clearTimeout(timer); (ok && window.google && window.google.accounts && window.google.accounts.id) ? resolve() : reject(new Error('gsi unavailable')); };
        var timer = setTimeout(function () { finish(false); }, 15000);
        s.src = GSI_SRC; s.async = true; s.defer = true;
        s.onload = function () { finish(true); };
        s.onerror = function () { finish(false); };
        document.head.appendChild(s);
      }).catch(function (e) { st.failed = true; hideBox(); throw e; });
    }
    return st.gsiPromise;
  }

  function hideBox() { var b = document.getElementById('amookht-gsi'); if (b) b.classList.add('is-off'); }

  function init() {
    if (st.inited) return;
    st.inited = true;
    google.accounts.id.initialize({
      client_id: st.cfg.client_id,
      callback: onCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      itp_support: true,
      use_fedcm_for_prompt: true
    });
  }

  function renderButton() {
    var el = document.getElementById('amookht-gsi-btn');
    if (!el || el.getAttribute('data-done')) return;
    var box = document.getElementById('amookht-gsi'), mode = (box && box.getAttribute('data-mode')) || 'signin';
    var width = Math.floor(el.getBoundingClientRect().width) || 320;
    el.setAttribute('data-done', '1');
    google.accounts.id.renderButton(el, {
      type: 'standard', size: 'large', shape: 'pill', logo_alignment: 'left',
      theme: isDark() ? 'filled_black' : 'outline',
      text: mode === 'signup' ? 'signup_with' : 'signin_with',
      width: Math.max(200, Math.min(400, width)),
      locale: lang()
    });
  }

  function maybePrompt() {
    if (st.prompted || st.busy) return;
    try { if (S.authBusy) return; } catch (e) { return; }
    st.prompted = true; st.promptOpen = true;
    try { google.accounts.id.prompt(); } catch (e) { st.promptOpen = false; }
  }

  function sync() {
    if (!onAuthScreens()) {
      if (st.promptOpen && window.google && google.accounts && google.accounts.id) { try { google.accounts.id.cancel(); } catch (e) { /* ignore */ } }
      st.promptOpen = false;
      return;
    }
    if (!st.cfg) { loadCfg().then(function () { if (st.cfg.enabled) sync(); }); return; }
    if (!st.cfg.enabled) return;
    var box = document.getElementById('amookht-gsi');
    if (box) box.classList.remove('is-pending');
    if (inApp() || st.failed) return;
    loadGsi().then(function () {
      if (!onAuthScreens()) return;
      init(); renderButton(); maybePrompt();
    }).catch(function () { /* button stays hidden; email login is unaffected */ });
  }

  function block(isLogin) {
    if (st.cfg && !st.cfg.enabled) return '';
    var app = inApp();
    if (app && !isLogin) return '';
    var state = !st.cfg ? ' is-pending' : (st.failed && !app ? ' is-off' : '');
    var inner = app
      ? '<p class="amk-gsi-hint" dir="auto">' + esc(tr('appHint')) + '</p>'
      : '<div id="amookht-gsi-btn" class="amk-gsi-btn"></div><div class="amk-gsi-or"><span dir="auto">' + esc(tr('or')) + '</span></div>';
    return '<div id="amookht-gsi" class="amk-gsi' + state + '" data-mode="' + (isLogin ? 'signin' : 'signup') + '">' + inner + '</div>';
  }

  function newUserData(name) {
    var tz = 'Asia/Tehran';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) { /* default */ }
    return { user: { name: name || '', level: '', examDate: '', dailyMinutes: 60, weakSkills: [], topic: '', subtopic: '', customTopic: '', examPlan: '', customPlans: [], profileCompleted: false, nativeLanguage: 'fa', timezone: tz, learningGoal: '', notifications: true, reducedMotion: false, avatarDataUrl: '' }, plan: null, completed: [], points: 0, history: [], streak: 0, errors: [], favorites: [] };
  }

  function errorText(error) {
    var code = (error && error.code) || '';
    if (TXT[code]) return tr(code);
    try { return authErrorMessage(error); } catch (e) { return tr('google_token_invalid'); }
  }

  async function onCredential(response) {
    var credential = response && response.credential;
    if (!credential || st.busy) return;
    st.busy = true; st.promptOpen = false;
    S.authBusy = true; S.authError = ''; S.authNotice = '';
    if (S.screen !== 'auth') { S.screen = 'auth'; S.authMode = 'login'; S.authStep = 'form'; }
    render();
    try {
      var data = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential: credential }) });
      var email = String(data.email || '').trim().toLowerCase();
      if (!email || !data.access_token) throw new Error('Incomplete Google sign-in response');
      localStorage.setItem(AMOOKHT_TOKEN_KEY, JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, token_type: data.token_type || 'bearer', expires_in: data.expires_in }));
      if (data.created && !DB.getData(email)) DB.saveData(email, newUserData(data.display_name || ''));
      S.authDraft = { email: '', name: '', password: '', passwordConfirm: '' };
      S.authStep = 'form';
      await loginAs(email, true);
    } catch (error) {
      console.warn('Google sign-in failed:', error);
      localStorage.removeItem(AMOOKHT_TOKEN_KEY); DB.clearSession();
      S.currentUser = null; S.serverConnected = false; S.syncStatus = 'local';
      S.screen = 'auth'; S.authStep = 'form'; S.authError = errorText(error);
    } finally {
      st.busy = false; S.authBusy = false;
      if (S.screen === 'auth') render();
    }
  }

  var css = document.createElement('style');
  css.id = 'amookht-gsi-style';
  css.textContent = '.amk-gsi{margin:0 0 18px}.amk-gsi.is-pending,.amk-gsi.is-off{display:none}'
    + '.amk-gsi-btn{display:flex;justify-content:center;min-height:44px;color-scheme:light}'
    + '.amk-gsi-or{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:12px;color:#94a3b8}'
    + '.amk-gsi-or:before,.amk-gsi-or:after{content:"";flex:1;height:1px;background:currentColor;opacity:.35}'
    + '.amk-gsi-hint{margin:0;padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.9;text-align:center;color:#64748b;background:rgba(99,102,241,.08)}';
  (document.head || document.documentElement).appendChild(css);

  window.GoogleAuth = { block: block, sync: sync, inApp: inApp, _state: st };
})();
