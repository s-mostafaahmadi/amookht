/* AI-ADMIN (2026-11-14): owner «مدیریت هوش مصنوعی» box on the admin page (renderAdminUsers).
   Talks to /v1/ai-admin/*; never sees raw keys. Repaints only its own #amkAiBox; dialogs live outside #app. */
(function () {
  'use strict';
  if (window.AmkAiAdmin) return;
  var A = { open: true, loading: false, loaded: false, err: '', note: '', data: null, tests: {}, drafts: {}, editRoute: {}, busy: {}, help: false, showUsage: true };
  try { A.open = localStorage.getItem('amk_ai_box_open') !== '0'; } catch (e) {}
  var FEAT_ORDER = ['tutor', 'method', 'grammar', 'owner_agent', 'translate'];
  var FEAT_SHORT = { tutor: 'مربی', method: 'برنامه یادگیری', grammar: 'ربات گرامر', owner_agent: 'دستیار مالک', translate: 'ترجمه' };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isOwner() { try { return typeof isOwnerAccount === 'function' && isOwnerAccount(); } catch (e) { return false; } }
  function dark() { try { return typeof S !== 'undefined' && !!S.dark; } catch (e) { return false; } }
  function fa(n) { try { return Number(n || 0).toLocaleString((window.amkPanelLocale ? window.amkPanelLocale() : 'fa-IR')); } catch (e) { return String(n || 0); } }
  function api(path, opt) { return apiRequest('/ai-admin' + path, opt || {}); }
  function body(o) { return { method: 'POST', body: JSON.stringify(o || {}) }; }
  function errText(e) {
    var m = (e && e.message) || 'خطا';
    try { var j = JSON.parse(m); if (j && j.detail) m = typeof j.detail === 'string' ? j.detail : (j.detail.message || JSON.stringify(j.detail)); } catch (x) {}
    return m;
  }
  function paint() { var el = document.getElementById('amkAiBox'); if (el) el.innerHTML = window.amkTranslateHTML ? window.amkTranslateHTML(inner()) : inner(); }
  function flash(msg, isErr) { A.note = msg; A.err = isErr ? msg : ''; paint(); clearTimeout(A._nt); A._nt = setTimeout(function () { A.note = ''; A.err = ''; paint(); }, 7000); }

  async function load(silent) {
    if (!isOwner()) return;
    A.loading = !silent; if (!silent) paint();
    try { A.data = await api('/state'); A.loaded = true; A.err = ''; }
    catch (e) { A.err = 'بارگذاری نشد: ' + errText(e); }
    A.loading = false; paint();
  }
  async function act(key, fn, okMsg) {
    if (A.busy[key]) return; A.busy[key] = true; paint();
    try { var r = await fn(); if (r && r.providers && r.features) A.data = r; else await load(true); if (okMsg) flash(okMsg); }
    catch (e) { flash(errText(e), true); }
    finally { A.busy[key] = false; paint(); }
  }

  /* ───────── views ───────── */
  function provider(id) { return ((A.data && A.data.providers) || []).filter(function (p) { return p.id === id; })[0]; }
  function usageLine(p) {
    var u = (A.data.usage || {})[p.id]; if (!u) return '<span class="amk-ai-muted">بدون مصرف ثبت‌شده</span>';
    var t = u.today || {}, w = u.week || {};
    return '<span title="امروز (UTC)">امروز: ' + fa(t.ok || 0) + ' موفق · ' + fa(t.fail || 0) + ' ناموفق' + (t.tokens ? ' · ' + fa(t.tokens) + ' توکن' : '') + '</span>' +
      '<span class="amk-ai-muted"> | ۷ روز: ' + fa(w.ok || 0) + ' / ' + fa(w.fail || 0) + '</span>';
  }
  function breakersFor(pid) { return ((A.data && A.data.breakers) || []).filter(function (b) { return b.provider === pid; }); }

  function keyRows(p) {
    var rows = (p.keys || []).map(function (k) {
      return '<li class="' + (k.enabled ? '' : 'off') + '"><code dir="ltr">' + esc(k.mask) + '</code><small>' + esc(k.label || '') + '</small>' +
        '<span class="amk-ai-row-btns"><button type="button" data-a="key-toggle" data-p="' + esc(p.id) + '" data-k="' + esc(k.id) + '" data-v="' + (k.enabled ? '0' : '1') + '" title="' + (k.enabled ? 'غیرفعال کردن کلید' : 'فعال کردن کلید') + '">' + (k.enabled ? '⏸' : '▶') + '</button>' +
        '<button type="button" class="danger" data-a="key-del" data-p="' + esc(p.id) + '" data-k="' + esc(k.id) + '" title="حذف کلید">×</button></span></li>';
    }).join('');
    var legacy = p.key_mode === 'legacy' ? '<p class="amk-ai-hint">کلیدها فعلاً از فایل‌های قبلی خوانده می‌شوند. با افزودن/حذف کلید، یک نسخه رمزنگاری‌شده به این جعبه منتقل می‌شود (فایل‌ها دست‌نخورده می‌مانند).</p>' : '';
    var did = 'k_' + p.id;
    return '<div class="amk-ai-keys"><b>کلیدها (' + fa((p.keys || []).length) + ')</b>' + legacy + (rows ? '<ul>' + rows + '</ul>' : '<p class="amk-ai-muted">' + (p.local ? 'سرور محلی معمولاً کلید لازم ندارد.' : 'کلیدی ثبت نشده.') + '</p>') +
      '<div class="amk-ai-addkey"><input type="password" autocomplete="new-password" dir="ltr" placeholder="کلید جدید API" data-draft="' + did + '" value="' + esc(A.drafts[did] || '') + '">' +
      '<input type="text" maxlength="60" placeholder="برچسب (اختیاری)" data-draft="' + did + '_l" value="' + esc(A.drafts[did + '_l'] || '') + '">' +
      '<button type="button" data-a="key-add" data-p="' + esc(p.id) + '"' + (A.busy['key-add' + p.id] ? ' disabled' : '') + '>+ افزودن کلید</button></div></div>';
  }

  function testBox(p) {
    var t = A.tests[p.id]; if (!t) return '';
    if (t.running) return '<div class="amk-ai-test running">در حال آزمایش…</div>';
    if (t.error) return '<div class="amk-ai-test bad">' + esc(t.error) + '</div>';
    return '<div class="amk-ai-test ' + (t.ok ? 'good' : 'bad') + '"><b>' + (t.ok ? '✓ اتصال برقرار است' : '✗ اتصال ناموفق') + '</b> <small dir="ltr">' + esc(t.model || '') + '</small><ul>' +
      (t.results || []).map(function (r) {
        return '<li class="' + (r.ok ? 'good' : 'bad') + '"><code dir="ltr">' + esc(r.key) + '</code> ' + (r.latency_ms != null ? '<span>' + fa(r.latency_ms) + ' ms</span> ' : '') +
          (r.ok ? '<q dir="auto">' + esc(r.reply) + '</q>' : '<em dir="auto">' + esc((r.status ? r.status + ' · ' : '') + (r.error || '')) + '</em>') + '</li>';
      }).join('') + '</ul></div>';
  }

  function providerCard(p, i, n) {
    var br = breakersFor(p.id);
    var badges = (p.builtin ? '<span class="b">داخلی</span>' : '<span class="b">افزوده</span>') + (p.local ? '<span class="b local">محلی/تونل</span>' : '') +
      (p.enabled ? '' : '<span class="b off">غیرفعال</span>') + (br.length ? '<span class="b warn" title="' + esc(br.map(function (b) { return b.name + ': ' + b.reason; }).join('\n')) + '">قطع موقت (' + fa(br[0].retry_after) + ' ث)</span>' : '');
    var feats = FEAT_ORDER.map(function (f) { return '<label class="chip"><input type="checkbox" data-a="feat" data-p="' + esc(p.id) + '" data-f="' + f + '"' + (p.features.indexOf(f) >= 0 ? ' checked' : '') + '> ' + FEAT_SHORT[f] + '</label>'; }).join('');
    return '<article class="amk-ai-prov' + (p.enabled ? '' : ' disabled') + '">' +
      '<header><div class="amk-ai-order"><button type="button" data-a="up" data-p="' + esc(p.id) + '"' + (i === 0 ? ' disabled' : '') + ' title="اولویت بالاتر">▲</button><span>' + fa(i + 1) + '</span><button type="button" data-a="down" data-p="' + esc(p.id) + '"' + (i === n - 1 ? ' disabled' : '') + ' title="اولویت پایین‌تر">▼</button></div>' +
      '<div class="amk-ai-title"><h4>' + esc(p.name) + ' <small>' + esc(p.type_label) + '</small></h4><code dir="ltr" title="' + esc(p.base_url) + '">' + esc(p.base_url) + '</code><div class="amk-ai-badges">' + badges + '</div></div>' +
      '<label class="amk-ai-switch" title="فعال/غیرفعال"><input type="checkbox" data-a="enable" data-p="' + esc(p.id) + '"' + (p.enabled ? ' checked' : '') + '><i></i></label></header>' +
      '<div class="amk-ai-models"><b>مدل‌ها:</b> ' + p.models.map(function (m, j) { return '<code dir="ltr" class="' + (j === 0 ? 'first' : '') + '">' + esc(m) + '</code>'; }).join(' ') +
      ' <small class="amk-ai-muted">· مهلت ' + fa(p.timeout) + ' ث' + (p.local ? ' · حداکثر ' + fa(p.max_tokens) + ' توکن' : '') + '</small></div>' +
      '<div class="amk-ai-feats"><b>در مسیر خودکار:</b> ' + feats + '</div>' +
      (A.showUsage ? '<div class="amk-ai-usage">' + usageLine(p) + '</div>' : '') +
      keyRows(p) +
      '<footer><button type="button" data-a="test" data-p="' + esc(p.id) + '">⚡ تست اتصال</button><button type="button" data-a="test-all" data-p="' + esc(p.id) + '" title="هر کلید جداگانه تست می‌شود">تست همه کلیدها</button>' +
      '<button type="button" data-a="edit" data-p="' + esc(p.id) + '">✎ ویرایش</button><button type="button" data-a="discover" data-p="' + esc(p.id) + '" title="خواندن /models از سرور">فهرست مدل‌ها</button>' +
      (br.length ? '<button type="button" data-a="reset-p" data-p="' + esc(p.id) + '">↺ رفع قطع موقت</button>' : '') +
      (p.builtin && p.key_mode === 'managed' ? '<button type="button" data-a="reset-keys" data-p="' + esc(p.id) + '" title="کلیدهای این جعبه کنار گذاشته شوند و دوباره از فایل‌ها خوانده شوند">بازگشت به کلیدهای فایل</button>' : '') +
      (p.builtin ? '' : '<button type="button" class="danger" data-a="del" data-p="' + esc(p.id) + '">حذف</button>') + '</footer>' + testBox(p) + (A.models && A.models[p.id] ? modelsBox(p) : '') + '</article>';
  }
  function modelsBox(p) {
    var list = A.models[p.id];
    return '<div class="amk-ai-test"><b>مدل‌های سرور (' + fa(list.length) + ')</b> <small>برای افزودن به فهرست کلیک کنید</small><div class="amk-ai-modlist">' +
      list.map(function (m) { return '<button type="button" data-a="add-model" data-p="' + esc(p.id) + '" data-m="' + esc(m) + '" dir="ltr"' + (p.models.indexOf(m) >= 0 ? ' disabled' : '') + '>' + esc(m) + '</button>'; }).join('') + '</div></div>';
  }

  function routingRow(f) {
    var info = A.data.features[f], ed = A.editRoute[f];
    var chips = info.effective.length ? info.effective.map(function (c, i) { return '<span class="chip"><b>' + fa(i + 1) + '</b> ' + esc(c.name) + ' <small dir="ltr">' + esc(c.model || '') + '</small></span>'; }).join('<i>←</i>') : '<span class="amk-ai-warn">هیچ ارائه‌دهنده‌ای فعال نیست!</span>';
    var head = '<div class="amk-ai-route-head"><b>' + esc(info.label) + '</b><span class="b ' + (info.path === 'legacy' ? '' : 'local') + '" title="' + (info.path === 'legacy' ? 'همان کد آزموده‌شده قبلی (Groq ← NVIDIA) اجرا می‌شود' : 'مسیر جدید این جعبه اجرا می‌شود') + '">' + (info.path === 'legacy' ? 'مسیر پیش‌فرض' : 'مسیر سفارشی جعبه') + '</span>' +
      '<select data-a="route-mode" data-f="' + f + '"><option value="auto"' + (info.mode === 'auto' ? ' selected' : '') + '>خودکار (ترتیب بالا)</option><option value="custom"' + (info.mode === 'custom' ? ' selected' : '') + '>سفارشی</option></select></div>';
    var body = '<div class="amk-ai-chain">' + chips + '</div>';
    if (ed) {
      var opts = function (sel) { return A.data.providers.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + (p.enabled ? '' : ' (غیرفعال)') + '</option>'; }).join(''); };
      body += '<div class="amk-ai-route-edit">' + ed.map(function (c, i) {
        return '<div class="row"><span>' + fa(i + 1) + '</span><select data-a="re-p" data-f="' + f + '" data-i="' + i + '">' + opts(c.id) + '</select>' +
          '<input dir="ltr" list="amkAiModels_' + esc(c.id) + '" placeholder="مدل پیش‌فرض ارائه‌دهنده" data-a="re-m" data-f="' + f + '" data-i="' + i + '" value="' + esc(c.model || '') + '">' +
          '<datalist id="amkAiModels_' + esc(c.id) + '">' + ((provider(c.id) || {}).models || []).map(function (m) { return '<option value="' + esc(m) + '">'; }).join('') + '</datalist>' +
          '<button type="button" data-a="re-up" data-f="' + f + '" data-i="' + i + '"' + (i ? '' : ' disabled') + '>▲</button><button type="button" class="danger" data-a="re-del" data-f="' + f + '" data-i="' + i + '">×</button></div>';
      }).join('') + '<div class="row"><button type="button" data-a="re-add" data-f="' + f + '">+ افزودن مرحله</button><button type="button" class="save" data-a="re-save" data-f="' + f + '">ذخیره مسیر</button><button type="button" data-a="re-cancel" data-f="' + f + '">انصراف</button></div></div>';
    } else if (info.mode === 'custom') {
      body += '<button type="button" class="amk-ai-link" data-a="re-open" data-f="' + f + '">ویرایش مسیر سفارشی</button>';
    }
    return '<li>' + head + body + '</li>';
  }

  function helpBox() {
    if (!A.help) return '<button type="button" class="amk-ai-link" data-a="help">راهنمای اجرای سایت با مدل محلی (LM Studio / Ollama) ▾</button>';
    var cmd = function (t) { return '<pre class="amk-ai-cmd" dir="ltr">' + esc(t) + '</pre>'; };
    var step = function (n, title, body) { return '<li class="amk-ai-step"><span class="amk-ai-num">' + fa(n) + '</span><div><b>' + title + '</b>' + body + '</div></li>'; };
    return '<div class="amk-ai-help" dir="' + ((typeof S !== 'undefined' && S.uiLanguage && S.uiLanguage !== 'fa') ? 'ltr' : 'rtl') + '"><div class="amk-ai-help-head"><h4>راهنمای اجرای سایت با مدل محلی</h4><button type="button" class="amk-ai-link" data-a="help">بستن ▴</button></div>' +
      '<p class="amk-ai-help-intro">سایت روی سرور اینترنتی اجرا می‌شود و به‌طور مستقیم به لپ‌تاپ شما دسترسی ندارد. برای همین، مدلِ روی لپ‌تاپ را با یک «تونل» به سرور وصل می‌کنیم.</p>' +
      '<ol class="amk-ai-steps">' +
      step(1, 'مدل را روی لپ‌تاپ روشن کنید',
        '<p>در LM Studio یک مدل (مثلاً gemma-3-4b-it) را بارگذاری کنید و از بخش Developer گزینه Start Server را بزنید. سرور روی پورت ۱۲۳۴ بالا می‌آید.</p>' +
        '<p>اگر از Ollama استفاده می‌کنید، این دستور را اجرا کنید (پورت ۱۱۴۳۴):</p>' + cmd('ollama serve')) +
      step(2, 'تونل را به سرور وصل کنید',
        '<p>روی لپ‌تاپ یک ترمینال باز کنید و این دستور را اجرا کنید. تا وقتی این پنجره باز است، اتصال برقرار می‌ماند:</p>' + cmd('ssh -N -R 127.0.0.1:11234:127.0.0.1:1234 Server') +
        '<p class="amk-ai-hint">برای Ollama به‌جای 1234 عدد 11434 را بنویسید. نیازی به باز کردن پورت روی مودم نیست.</p>') +
      step(3, 'ارائه‌دهنده را در همین جعبه اضافه کنید',
        '<p>روی «+ افزودن ارائه‌دهنده» بزنید، نوع را LM Studio (یا Ollama) بگذارید و این آدرس را وارد کنید:</p>' + cmd('http://127.0.0.1:11234/v1') +
        '<p class="amk-ai-hint">تیک «اجازه شبکه محلی» برای این نوع‌ها خودکار زده می‌شود. کلید API لازم نیست.</p>') +
      step(4, 'اتصال را آزمایش کنید',
        '<p>روی کارت جدید، اول «فهرست مدل‌ها» را بزنید و مدل را اضافه کنید، بعد «⚡ تست اتصال». اگر جمله‌ای آلمانی برگشت، اتصال درست است.</p>') +
      step(5, 'تعیین کنید کجا استفاده شود',
        '<ul><li>برای استفاده کنار APIها: در بخش «در مسیر خودکار» تیک مربی، برنامه یادگیری و… را بزنید و با ▲ کارت را بالا ببرید.</li>' +
        '<li>برای کار فقط با مدل محلی: کلید «فقط مدل محلی» بالای جعبه را روشن کنید.</li></ul>') +
      '</ol>' +
      '<details class="amk-ai-alt"><summary>راه دیگر: Cloudflare Tunnel (بدون SSH)</summary>' +
        '<p>روی لپ‌تاپ اجرا کنید:</p>' + cmd('cloudflared tunnel --url http://localhost:1234') +
        '<p>آدرس https که نشان می‌دهد را با <span dir="ltr">/v1</span> در انتها، با نوع «OpenAI-compatible» اضافه کنید. چون این آدرس عمومی است، در LM Studio گزینه Require API key را روشن کنید و همان کلید را اینجا هم وارد کنید.</p></details>' +
      '<div class="amk-ai-notes"><b>نکته‌ها</b><ul>' +
        '<li>مدل‌های کوچک محلی کند هستند؛ Gemma 4B روی کارت GTX 1050 Ti حدود ۷ توکن در ثانیه تولید می‌کند.</li>' +
        '<li>مرورگر برای بازخورد برنامه حدود ۷۰ ثانیه و برای مربی حدود ۹۵ ثانیه صبر می‌کند. پاسخ مدل محلی به ۲۰۴۸ توکن محدود است و در «ویرایش» قابل تغییر است.</li>' +
        '<li>تبدیل گفتار به متن (Whisper) همچنان از Groq استفاده می‌کند.</li>' +
        '<li>امنیت: آدرس‌های metadata ابری همیشه رد می‌شوند؛ localhost و شبکه داخلی فقط با تیک «اجازه شبکه محلی» مجازند. کلیدها رمزنگاری‌شده ذخیره می‌شوند و هرگز کامل نمایش داده نمی‌شوند.</li>' +
      '</ul></div></div>';
  }

  function inner() {
    var head = '<header class="amk-ai-head"><button type="button" class="amk-ai-toggle" data-a="toggle"><span class="amk-ai-ico">AI</span><span><b>مدیریت هوش مصنوعی</b><small>APIها، کلیدها، مدل‌ها، مسیر هر بخش و مدل محلی</small></span><i>' + (A.open ? '▴' : '▾') + '</i></button></header>';
    if (!A.open) return head;
    if (!A.loaded) return head + '<div class="amk-ai-body">' + (A.err ? '<p class="amk-ai-err">' + esc(A.err) + ' <button type="button" data-a="reload">تلاش دوباره</button></p>' : '<p class="amk-ai-muted">در حال بارگذاری…</p>') + '</div>';
    var d = A.data, ps = d.providers, brs = d.breakers || [];
    var top = '<div class="amk-ai-bar">' +
      '<label class="amk-ai-local ' + (d.local_only ? 'on' : '') + '"><span class="amk-ai-switch"><input type="checkbox" data-a="local-only"' + (d.local_only ? ' checked' : '') + '><i></i></span><span><b>فقط مدل محلی</b><small>همه بخش‌ها فقط از مدل‌های محلی/تونل استفاده کنند</small></span></label>' +
      '<div class="amk-ai-actions"><button type="button" class="save" data-a="new">+ افزودن ارائه‌دهنده</button><button type="button" data-a="reload"' + (A.loading ? ' disabled' : '') + '>↻ بازخوانی</button>' +
      '<button type="button" data-a="import-legacy" title="کپی کلیدهای API.txt / .env / .nvidia_keys به این جعبه (فایل‌ها حذف نمی‌شوند)">ورود کلیدهای فایل</button>' +
      '<button type="button" data-a="export">⇩ پشتیبان</button><button type="button" data-a="import">⇧ بازیابی</button></div></div>';
    var msg = (A.note ? '<p class="amk-ai-note ' + (A.err ? 'bad' : '') + '">' + esc(A.note) + '</p>' : '');
    var breakers = '<div class="amk-ai-breakers"><b>وضعیت قطع‌کن خودکار (circuit breaker):</b> ' + (brs.length ? brs.map(function (b) {
      return '<span class="chip warn" title="' + esc(b.reason) + '">' + esc(b.name) + ' · ' + fa(b.retry_after) + ' ث <button type="button" data-a="reset-b" data-n="' + esc(b.name) + '" title="باز کردن">↺</button></span>';
    }).join('') + ' <button type="button" data-a="reset-all">↺ رفع همه</button>' : '<span class="chip good">همه ارائه‌دهنده‌ها در دسترس ✓</span>') + '</div>';
    var provs = '<h3>ارائه‌دهنده‌ها <small>(ترتیب = اولویت جایگزینی خودکار)</small></h3><div class="amk-ai-provs">' + ps.map(function (p, i) { return providerCard(p, i, ps.length); }).join('') + '</div>';
    var routes = '<h3>مسیر هر بخش <small>(از چپ به راست امتحان می‌شود)</small></h3><ul class="amk-ai-routes">' + FEAT_ORDER.filter(function (f) { return d.features[f]; }).map(routingRow).join('') + '</ul>' +
      '<p class="amk-ai-hint">«مسیر پیش‌فرض» یعنی همان کد قبلی سایت (Groq با کلیدهای رزرو، بعد NVIDIA). هر تغییری در ترتیب، مدل‌ها یا افزودن ارائه‌دهنده جدید، آن بخش را به موتور جدید این جعبه می‌برد. ترجمه در صورت مسیر پیش‌فرض از کلیدهای خود Deutsch Coach استفاده می‌کند.</p>';
    return head + '<div class="amk-ai-body">' + top + msg + breakers + provs + routes + helpBox() + '<p class="amk-ai-muted">آخرین تغییر: ' + esc(d.updated_at ? new Date(d.updated_at).toLocaleString((window.amkPanelLocale ? window.amkPanelLocale() : 'fa-IR')) : '—') + '</p></div>';
  }

  function sectionHtml() {
    if (!isOwner()) return '';
    if (!A.loaded && !A.loading && !A._requested) { A._requested = true; setTimeout(function () { load(); }, 0); }
    return '<section id="amkAiBox" class="amk-ai' + (dark() ? ' is-dark' : '') + '" dir="' + ((typeof S !== 'undefined' && S.uiLanguage && S.uiLanguage !== 'fa') ? 'ltr' : 'rtl') + '">' + (window.amkTranslateHTML ? window.amkTranslateHTML(inner()) : inner()) + '</section>';
  }

  /* ───────── provider dialog (outside #app so page re-renders never touch it) ───────── */
  function dialog(p) {
    closeDialog();
    var types = A.data.types, isNew = !p, t = p ? p.type : 'lmstudio';
    var wrap = document.createElement('div');
    wrap.id = 'amkAiDlg'; wrap.className = 'amk-ai-dlg' + (dark() ? ' is-dark' : ''); wrap.setAttribute('dir', 'rtl');
    var typeOpts = Object.keys(types).map(function (k) { return '<option value="' + k + '"' + (k === t ? ' selected' : '') + '>' + esc(types[k].label) + '</option>'; }).join('');
    var feats = FEAT_ORDER.map(function (f) { return '<label class="chip"><input type="checkbox" name="feat" value="' + f + '"' + ((p ? p.features : ['tutor', 'method', 'grammar']).indexOf(f) >= 0 ? ' checked' : '') + '> ' + FEAT_SHORT[f] + '</label>'; }).join('');
    wrap.innerHTML = '<form class="amk-ai-dlg-box" novalidate><header><h3>' + (isNew ? 'افزودن ارائه‌دهنده هوش مصنوعی' : 'ویرایش ' + esc(p.name)) + '</h3><button type="button" data-x>×</button></header>' +
      '<div class="grid"><label>نوع<select name="type"' + (isNew ? '' : ' disabled') + '>' + typeOpts + '</select></label>' +
      '<label>نام نمایشی<input name="name" required maxlength="60" value="' + esc(p ? p.name : types[t].label.replace(/ \(.*\)$/, '')) + '"></label>' +
      (isNew ? '<label>شناسه (اختیاری، انگلیسی)<input name="id" dir="ltr" maxlength="40" pattern="[a-z0-9][a-z0-9_-]{1,39}" placeholder="مثلاً murix-lmstudio"></label>' : '') +
      '<label class="wide">آدرس پایه (Base URL، بدون /chat/completions)<input name="base_url" dir="ltr" required value="' + esc(p ? p.base_url : types[t].base_url) + '"' + (p && p.builtin ? ' readonly' : '') + '></label>' +
      '<label class="wide">مدل‌ها (هر خط یک مدل؛ اولی پیش‌فرض)<textarea name="models" dir="ltr" rows="3" required>' + esc(p ? p.models.join('\n') : '') + '</textarea></label>' +
      '<label>مهلت هر تلاش (ثانیه)<input name="timeout" type="number" min="5" max="300" value="' + esc(p ? p.timeout : (types[t].local ? 60 : 30)) + '"></label>' +
      '<label>حداکثر توکن پاسخ (محلی)<input name="max_tokens" type="number" min="256" max="32000" value="' + esc(p ? p.max_tokens : 2048) + '"></label>' +
      '<label class="chk"><input type="checkbox" name="allow_local"' + ((p ? p.allow_local : types[t].local) ? ' checked' : '') + '> اجازه شبکه محلی / localhost / http (برای تونل یا سرور خانگی)</label>' +
      '<label class="chk"><input type="checkbox" name="json_mode"' + ((p ? p.json_mode : true) ? ' checked' : '') + '> ارسال response_format=json (اگر سرور پشتیبانی نکند خودکار حذف می‌شود)</label>' +
      '<div class="wide"><b>در مسیر خودکار این بخش‌ها:</b><div class="chips">' + feats + '</div></div>' +
      (isNew ? '<label class="wide">کلید API (اختیاری برای محلی)<input name="api_key" type="password" dir="ltr" autocomplete="new-password"></label>' : '') +
      '<label class="wide">یادداشت<input name="notes" maxlength="300" value="' + esc(p ? p.notes : '') + '"></label></div>' +
      '<p class="amk-ai-err" data-err></p><footer><button type="button" data-x>انصراف</button><button type="submit" class="save">' + (isNew ? 'افزودن' : 'ذخیره') + '</button></footer></form>';
    if (window.amkPanelTree) window.amkPanelTree(wrap); else if (window.amkTranslateTree) window.amkTranslateTree(wrap);
    document.body.appendChild(wrap);
    var form = wrap.querySelector('form');
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.hasAttribute('data-x')) closeDialog(); });
    var typeSel = form.elements.type;
    typeSel.addEventListener('change', function () {
      var tt = types[typeSel.value];
      form.elements.base_url.value = tt.base_url; form.elements.allow_local.checked = !!tt.local;
      form.elements.timeout.value = tt.local ? 60 : 30; form.elements.name.value = tt.label.replace(/ \(.*\)$/, '');
    });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = form.elements, out = {
        name: f.name.value.trim(), base_url: f.base_url.value.trim(), models: f.models.value.split(/[\n,]+/).map(function (s) { return s.trim(); }).filter(Boolean),
        timeout: Number(f.timeout.value) || 30, max_tokens: Number(f.max_tokens.value) || 2048, allow_local: f.allow_local.checked, json_mode: f.json_mode.checked,
        features: [].slice.call(form.querySelectorAll('input[name=feat]:checked')).map(function (x) { return x.value; }), notes: f.notes.value.trim()
      };
      var errEl = form.querySelector('[data-err]');
      if (!out.models.length) { errEl.textContent = 'حداقل یک مدل وارد کنید.'; return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; errEl.textContent = '';
      try {
        if (isNew) {
          out.type = typeSel.value; if (f.id.value.trim()) out.id = f.id.value.trim().toLowerCase(); if (f.api_key.value.trim()) out.api_key = f.api_key.value.trim();
          await api('/providers', body(out));
        } else {
          if (p.builtin) delete out.base_url;
          await api('/providers/' + encodeURIComponent(p.id), { method: 'PATCH', body: JSON.stringify(out) });
        }
        closeDialog(); await load(true); flash(isNew ? 'ارائه‌دهنده اضافه شد. حالا «تست اتصال» را بزنید.' : 'ذخیره شد.');
      } catch (x) { errEl.textContent = errText(x); btn.disabled = false; }
    });
    setTimeout(function () { (form.elements.name || {}).focus && form.elements.name.focus(); }, 30);
  }
  function closeDialog() { var d = document.getElementById('amkAiDlg'); if (d) d.remove(); }

  /* ───────── actions ───────── */
  function patchProvider(pid, data, msg) { return act('p' + pid, function () { return api('/providers/' + encodeURIComponent(pid), { method: 'PATCH', body: JSON.stringify(data) }); }, msg); }
  function move(pid, dir) {
    var ids = A.data.providers.map(function (p) { return p.id; }), i = ids.indexOf(pid), j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    ids[i] = ids[j]; ids[j] = pid;
    act('order', function () { return api('/providers/order', body({ ids: ids })); }, 'ترتیب ذخیره شد.');
  }
  async function test(pid, all) {
    A.tests[pid] = { running: true }; paint();
    try { A.tests[pid] = await api('/providers/' + encodeURIComponent(pid) + '/test', body({ all_keys: !!all })); }
    catch (e) { A.tests[pid] = { error: errText(e) }; }
    paint(); load(true);
  }
  function routeDraft(f) {
    var info = A.data.features[f];
    var chain = info.mode === 'custom' && info.custom.length ? info.custom.map(function (c) { return { id: c.id, model: c.model || '' }; }) : info.effective.map(function (c) { return { id: c.id, model: '' }; });
    if (!chain.length && A.data.providers[0]) chain = [{ id: A.data.providers[0].id, model: '' }];
    A.editRoute[f] = chain;
  }
  function exportCfg() {
    api('/export').then(function (data) {
      var blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'amookht-ai-providers-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      flash('فایل پشتیبان دانلود شد (کلیدها رمزنگاری‌شده‌اند و فقط روی همین سرور قابل استفاده‌اند).');
    }).catch(function (e) { flash(errText(e), true); });
  }
  function importCfg() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = function () {
      var file = inp.files && inp.files[0]; if (!file) return;
      file.text().then(async function (txt) {
        var cfg; try { cfg = JSON.parse(txt); } catch (e) { flash('فایل JSON معتبر نیست.', true); return; }
        if (!(await confirmBox('تنظیمات فعلی هوش مصنوعی با این فایل پشتیبان جایگزین شود؟'))) return;
        act('import', function () { return api('/import', body({ config: cfg })); }, 'تنظیمات بازیابی شد.');
      });
    };
    inp.click();
  }
  function confirmBox(text) { if (window.amkPanelText) text = window.amkPanelText(text); try { if (typeof appConfirm === 'function') return appConfirm(text); } catch (e) {} return Promise.resolve(window.confirm(text)); }

  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.closest || !t.closest('#amkAiBox')) return;
    if (t.dataset.draft) A.drafts[t.dataset.draft] = t.value;
    if (t.dataset.a === 're-m') { var ed = A.editRoute[t.dataset.f]; if (ed && ed[+t.dataset.i]) ed[+t.dataset.i].model = t.value; }
  });
  document.addEventListener('change', async function (e) {
    var t = e.target; if (!t.closest || !t.closest('#amkAiBox')) return;
    var a = t.dataset.a, pid = t.dataset.p;
    if (a === 'enable') patchProvider(pid, { enabled: t.checked }, t.checked ? 'فعال شد.' : 'غیرفعال شد.');
    else if (a === 'feat') {
      var p = provider(pid), set = p.features.filter(function (x) { return x !== t.dataset.f; }); if (t.checked) set.push(t.dataset.f);
      patchProvider(pid, { features: set }, 'مسیر خودکار به‌روزرسانی شد.');
    } else if (a === 'local-only') {
      var on = t.checked;
      if (on && !(await confirmBox('همه بخش‌های هوش مصنوعی فقط از مدل‌های محلی/تونل استفاده کنند؟ (اگر مدل محلی خاموش باشد، هوش مصنوعی سایت کار نمی‌کند)'))) { t.checked = false; return; }
      act('local', function () { return api('/settings', { method: 'PUT', body: JSON.stringify({ local_only: on }) }); }, on ? 'حالت «فقط مدل محلی» روشن شد.' : 'حالت «فقط مدل محلی» خاموش شد.');
    } else if (a === 'route-mode') {
      var f = t.dataset.f;
      if (t.value === 'custom') { routeDraft(f); paint(); }
      else { delete A.editRoute[f]; act('route' + f, function () { return api('/routing/' + f, { method: 'PUT', body: JSON.stringify({ mode: 'auto', chain: [] }) }); }, 'مسیر خودکار شد.'); }
    } else if (a === 're-p') { var ed = A.editRoute[t.dataset.f]; ed[+t.dataset.i] = { id: t.value, model: '' }; paint(); }
  });
  document.addEventListener('click', async function (e) {
    var t = e.target.closest && e.target.closest('#amkAiBox [data-a]'); if (!t || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type !== 'button')) return;
    var a = t.dataset.a, pid = t.dataset.p, f = t.dataset.f, i = +t.dataset.i, ed = f ? A.editRoute[f] : null;
    switch (a) {
      case 'toggle': A.open = !A.open; try { localStorage.setItem('amk_ai_box_open', A.open ? '1' : '0'); } catch (x) {} if (A.open && !A.loaded) load(); paint(); break;
      case 'reload': load(); break;
      case 'help': A.help = !A.help; paint(); break;
      case 'new': dialog(null); break;
      case 'edit': dialog(provider(pid)); break;
      case 'up': move(pid, -1); break;
      case 'down': move(pid, 1); break;
      case 'test': test(pid, false); break;
      case 'test-all': test(pid, true); break;
      case 'del':
        if (await confirmBox('ارائه‌دهنده «' + (provider(pid) || {}).name + '» و کلیدهایش حذف شود؟')) act('del' + pid, function () { return api('/providers/' + encodeURIComponent(pid), { method: 'DELETE' }); }, 'حذف شد.');
        break;
      case 'key-add': {
        var did = 'k_' + pid, key = (A.drafts[did] || '').trim(); if (!key) { flash('کلید را وارد کنید.', true); return; }
        await act('key-add' + pid, function () { return api('/providers/' + encodeURIComponent(pid) + '/keys', body({ api_key: key, label: (A.drafts[did + '_l'] || '').trim() })); }, 'کلید اضافه شد.');
        if (!A.err) { delete A.drafts[did]; delete A.drafts[did + '_l']; paint(); }
        break;
      }
      case 'key-del':
        if (await confirmBox('این کلید از این جعبه حذف شود؟ (فایل‌های قدیمی سرور دست نمی‌خورند)')) act('kd' + pid, function () { return api('/providers/' + encodeURIComponent(pid) + '/keys/' + encodeURIComponent(t.dataset.k), { method: 'DELETE' }); }, 'کلید حذف شد.');
        break;
      case 'key-toggle': act('kt' + pid, function () { return api('/providers/' + encodeURIComponent(pid) + '/keys/' + encodeURIComponent(t.dataset.k), { method: 'PATCH', body: JSON.stringify({ enabled: t.dataset.v === '1' }) }); }, 'وضعیت کلید تغییر کرد.'); break;
      case 'reset-keys':
        if (await confirmBox('کلیدهای ذخیره‌شده در این جعبه برای این ارائه‌دهنده کنار گذاشته شوند و دوباره از فایل‌های قبلی خوانده شوند؟')) act('rk' + pid, function () { return api('/providers/' + encodeURIComponent(pid) + '/reset-keys', body({})); }, 'کلیدها دوباره از فایل خوانده می‌شوند.');
        break;
      case 'discover':
        try { var r = await api('/providers/' + encodeURIComponent(pid) + '/models', body({})); A.models = A.models || {}; A.models[pid] = r.models || []; paint(); if (!r.models.length) flash('سرور مدلی برنگرداند.'); }
        catch (x) { flash(errText(x), true); }
        break;
      case 'add-model': { var p = provider(pid); patchProvider(pid, { models: p.models.concat([t.dataset.m]) }, 'مدل اضافه شد.'); break; }
      case 'reset-b': act('rb', function () { return api('/breakers/reset', body({ name: t.dataset.n })); }, 'باز شد.'); break;
      case 'reset-all': act('rb', function () { return api('/breakers/reset', body({})); }, 'همه قطع‌کن‌ها باز شدند.'); break;
      case 'reset-p': {
        var names = breakersFor(pid).map(function (b) { return b.name; });
        act('rb', async function () { for (var n = 0; n < names.length; n++) await api('/breakers/reset', body({ name: names[n] })); }, 'باز شد.'); break;
      }
      case 'import-legacy':
        if (await confirmBox('کلیدهای فایل‌های قبلی (API.txt، .env، .nvidia_keys) به‌صورت رمزنگاری‌شده به این جعبه کپی شوند؟ فایل‌ها حذف یا تغییر داده نمی‌شوند.')) {
          act('imp', async function () { var r = await api('/import-legacy', body({})); var c = r.imported || {}; A.note = 'کپی شد: Groq ' + fa(c.groq || 0) + ' · NVIDIA ' + fa(c.nvidia || 0) + ' · DeepSeek ' + fa(c.deepseek || 0); return r; });
        }
        break;
      case 'export': exportCfg(); break;
      case 'import': importCfg(); break;
      case 're-open': routeDraft(f); paint(); break;
      case 're-cancel': delete A.editRoute[f]; paint(); break;
      case 're-add': ed.push({ id: A.data.providers[0].id, model: '' }); paint(); break;
      case 're-del': ed.splice(i, 1); paint(); break;
      case 're-up': if (i > 0) { var tmp = ed[i - 1]; ed[i - 1] = ed[i]; ed[i] = tmp; paint(); } break;
      case 're-save':
        await act('route' + f, function () { return api('/routing/' + f, { method: 'PUT', body: JSON.stringify({ mode: 'custom', chain: ed.map(function (c) { return { id: c.id, model: (c.model || '').trim() || null }; }) }) }); }, 'مسیر سفارشی ذخیره شد.');
        if (!A.err) delete A.editRoute[f]; paint(); break;
    }
  });

  /* ───────── hook into the admin page ───────── */
  function wrap() {
    if (typeof window.renderAdminUsers !== 'function' || window.renderAdminUsers.__amkAi) return false;
    var orig = window.renderAdminUsers;
    var wrapped = function () {
      var html = orig.apply(this, arguments);
      try {
        if (!isOwner() || typeof html !== 'string') return html;
        var at = html.lastIndexOf('</main>');
        return at < 0 ? html + sectionHtml() : html.slice(0, at) + sectionHtml() + html.slice(at);
      } catch (e) { return html; }
    };
    wrapped.__amkAi = true;
    window.renderAdminUsers = wrapped;
    return true;
  }
  if (!wrap()) document.addEventListener('DOMContentLoaded', wrap);
  setInterval(function () { if (document.getElementById('amkAiBox') && A.open && A.loaded && !document.querySelector('#amkAiBox :focus') && !Object.keys(A.editRoute).length && document.visibilityState === 'visible') load(true); }, 30000);
  window.AmkAiAdmin = { state: A, reload: load, html: sectionHtml };
})();
