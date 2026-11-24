/* ACCOUNT-DELETE (2026-11-19): delete the account in a window — type the email/username and "delete my account",
   get a 5-digit code by email, enter it. Backend: /v1/account/delete/request + /v1/account/delete/confirm. */
(function () {
  'use strict';
  var st = { step: 1, vid: '', email: '', err: '', busy: false };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function host() { var h = document.getElementById('amkDelHost'); if (!h) { h = document.createElement('div'); h.id = 'amkDelHost'; document.body.appendChild(h); } return h; }
  function errText(e) { var d = e && (e.detail || (e.data && e.data.detail)); return (d && (d.message || d)) || (e && e.message) || 'خطا'; }
  function draw() {
    var h = host();
    if (!st.open) { h.innerHTML = ''; return; }
    var body = st.step === 1
      ? '<p>این کار قابل برگشت نیست: حساب غیرفعال می‌شود، برنامه، تاریخچه، دفتر عبارات و علاقه‌مندی‌ها دیگر در دسترس نخواهند بود.</p>' +
        '<label>ایمیل یا نام کاربری حساب<input id="amkDelUser" dir="ltr" autocomplete="off" placeholder="name@example.com"></label>' +
        '<label>برای تأیید بنویسید: <b dir="ltr">delete my account</b><input id="amkDelPhrase" dir="ltr" autocomplete="off" placeholder="delete my account"></label>'
      : '<p>کد پنج‌رقمی به <b dir="ltr">' + esc(st.email) + '</b> فرستاده شد. آن را وارد کنید تا حساب حذف شود.</p>' +
        '<label>کد تأیید<input id="amkDelCode" dir="ltr" inputmode="numeric" maxlength="5" autocomplete="one-time-code" placeholder="•••••" class="amk-del-code"></label>';
    h.innerHTML = '<div class="amk-del-shade" role="dialog" aria-modal="true"><section class="amk-del-card"><header><span>⚠️</span><h2>حذف حساب کاربری</h2><button type="button" class="amk-del-x" data-a="close" aria-label="بستن">×</button></header>' +
      '<div class="amk-del-steps"><i class="' + (st.step >= 1 ? 'on' : '') + '">۱ تأیید</i><i class="' + (st.step >= 2 ? 'on' : '') + '">۲ کد ایمیل</i></div>' +
      body + (st.err ? '<p class="amk-del-err">' + esc(st.err) + '</p>' : '') +
      '<footer><button type="button" data-a="close">انصراف</button>' + (st.step === 2 ? '<button type="button" data-a="resend" ' + (st.busy ? 'disabled' : '') + '>ارسال دوباره</button>' : '') +
      '<button type="button" class="danger" data-a="' + (st.step === 1 ? 'send' : 'confirm') + '" ' + (st.busy ? 'disabled' : '') + '>' + (st.busy ? '…' : st.step === 1 ? 'ارسال کد به ایمیل' : 'حذف نهایی حساب') + '</button></footer></section></div>';
    var f = h.querySelector(st.step === 1 ? '#amkDelUser' : '#amkDelCode'); if (f) setTimeout(function () { f.focus(); }, 30);
  }
  async function send() {
    var u = (document.getElementById('amkDelUser') || {}).value || st.user || '', p = (document.getElementById('amkDelPhrase') || {}).value || st.phrase || '';
    if (!u.trim() || p.trim().toLowerCase() !== 'delete my account') { st.err = 'ایمیل/نام کاربری و عبارت delete my account را دقیق بنویسید.'; draw(); return; }
    st.user = u; st.phrase = p; st.busy = true; st.err = ''; draw();
    try { var r = await apiRequest('/account/delete/request', { method: 'POST', body: JSON.stringify({ username: u.trim(), phrase: p.trim() }) }); st.vid = r.verification_id; st.email = r.email; st.step = 2; }
    catch (e) { st.err = errText(e); }
    st.busy = false; draw();
  }
  async function confirmDel() {
    var c = ((document.getElementById('amkDelCode') || {}).value || '').replace(/\D/g, '');
    if (c.length !== 5) { st.err = 'کد پنج‌رقمی را وارد کنید.'; draw(); return; }
    st.busy = true; st.err = ''; draw();
    try {
      await apiRequest('/account/delete/confirm', { method: 'POST', body: JSON.stringify({ verification_id: st.vid, code: c }) });
      st.open = false; draw();
      try { if (typeof DB !== 'undefined' && DB.deleteAccount) DB.deleteAccount(S.currentUser); } catch (e) { /* ignore */ }
      if (typeof logout === 'function') logout();
    } catch (e) { st.err = errText(e); st.busy = false; draw(); }
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('#amkDelHost [data-a]'); var shade = ev.target.classList && ev.target.classList.contains('amk-del-shade');
    if (shade) { st.open = false; draw(); return; }
    if (!b || b.disabled) return;
    var a = b.dataset.a;
    if (a === 'close') { st.open = false; draw(); } else if (a === 'send' || a === 'resend') send(); else if (a === 'confirm') confirmDel();
  });
  document.addEventListener('keydown', function (ev) { if (!st.open) return; if (ev.key === 'Escape') { st.open = false; draw(); } else if (ev.key === 'Enter' && ev.target.closest && ev.target.closest('#amkDelHost')) { ev.preventDefault(); if (st.step === 1) send(); else confirmDel(); } });
  window.AmkAccountDelete = { open: function () { st = { step: 1, vid: '', email: '', err: '', busy: false, open: true }; draw(); } };
})();
