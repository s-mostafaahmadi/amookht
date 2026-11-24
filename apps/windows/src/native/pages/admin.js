// «مدیریت» — port of the site's admin page (renderAdminUsers and its actions): role filters with counts, search,
// verified-account creation (admins and owner), user list with verification, blocked state, last seen, and for the
// owner: role change, block / unblock and delete with confirmation. Live refresh every 15 s like the site.
// The owner's «مدیریت هوش مصنوعی» box (tools/ai-admin.js) is placed at the end of the page, as on the site.

import { esc as E, toast } from '../core/ui.js';
import { lang } from '../core/i18n.js';
import { st } from '../core/site-text.js';
import { createContentControl } from './content-control.js';
import { translateTree } from '../core/tr.js';

const ROLES = ['all', 'normal', 'premium', 'admin', 'owner', 'blocked'];
const L = (fa, en, de) => (lang() === 'fa' ? fa : lang() === 'en' ? en : de);
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const strongPassword = (v) => v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);

export function renderAdmin(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page admin';
  const a = ctx.account || {};
  const admin = !!(a.admin || a.owner); const owner = !!a.owner;
  const cc = admin ? createContentControl(ctx) : null; // «کنترل محتوا» (site 2026-11-19)
  const ui = { users: [], total: 0, loading: true, error: '', filter: 'all', query: '', draft: { email: '', password: '' }, busy: false, pendingDelete: null, pendingBlock: null, timer: null };

  const labels = () => ({ all: L('همه', 'All', 'Alle'), normal: L('رایگان', 'Free', 'Free'), premium: 'Premium', admin: 'Admin', owner: L('مالک', 'Owner', 'Inhaber'), blocked: L('مسدود', 'Blocked', 'Gesperrt') });
  const copy = () => ({
    eyebrow: L('مرکز مدیریت', 'ADMIN CENTER', 'ADMIN-BEREICH'), title: L('مدیریت', 'Management', 'Verwaltung'),
    desc: owner ? L('به‌عنوان مالک می‌توانید سطح دسترسی را تغییر دهید، حساب‌ها را مسدود کنید یا حذف کنید.', 'As owner, you can change access levels, block or delete accounts.', 'Als Inhaber kannst du Rollen ändern, Benutzer sperren oder löschen.') : L('مدیران می‌توانند کاربران و سطح دسترسی آن‌ها را مشاهده کنند؛ تغییرات فقط در اختیار مالک است.', 'Admins can view users and access levels. Only the owner can make changes.', 'Administratoren können Benutzer und Rollen ansehen. Änderungen sind nur dem Inhaber erlaubt.'),
    search: L('جست‌وجوی ایمیل یا نام...', 'Search email or name...', 'E-Mail oder Name suchen...'), verified: L('تأییدشده', 'Verified', 'Verifiziert'), unverified: L('تأییدنشده', 'Unverified', 'Nicht verifiziert'),
    empty: L('کاربری در این فیلتر پیدا نشد', 'No users found for this filter', 'Keine Benutzer für diesen Filter gefunden'), refresh: L('بازخوانی', 'Refresh', 'Aktualisieren'),
    del: L('حذف', 'Delete', 'Löschen'), delTitle: L('حذف این کاربر؟', 'Delete this user?', 'Diesen Benutzer löschen?'), delBody: L('حساب غیرفعال و ایمیل آن برای ثبت‌نام دوباره آزاد می‌شود.', 'The account is disabled and its email becomes available for a new registration.', 'Das Konto wird deaktiviert und die E-Mail kann erneut registriert werden.'),
    cancel: L('انصراف', 'Cancel', 'Abbrechen'), confirm: L('تأیید حذف', 'Delete user', 'Benutzer löschen'),
    block: L('مسدود', 'Block', 'Sperren'), unblock: L('رفع مسدودی', 'Unblock', 'Entsperren'), blockTitle: L('این کاربر مسدود شود؟', 'Block this user?', 'Diesen Benutzer sperren?'), unblockTitle: L('مسدودی این کاربر برداشته شود؟', 'Unblock this user?', 'Diesen Benutzer entsperren?'),
    blockBody: L('ورود و ثبت‌نام دوباره با این ایمیل بسته می‌شود.', 'Sign-in and new registration with this email will be blocked.', 'Anmeldung und Neuregistrierung mit dieser E-Mail werden gesperrt.'), unblockBody: L('کاربر دوباره می‌تواند با حساب قبلی وارد شود.', 'The user can sign in to the existing account again.', 'Der Benutzer kann sich wieder mit seinem bestehenden Konto anmelden.'),
    cTitle: L('ساخت حساب تأییدشده', 'Create verified account', 'Verifiziertes Konto erstellen'), cDesc: L('بدون ارسال کد ایمیل؛ کاربر بلافاصله می‌تواند وارد شود.', 'No email code is sent; the user can sign in immediately.', 'Es wird kein E-Mail-Code gesendet; der Benutzer kann sich sofort anmelden.'),
    cEmail: L('ایمیل کاربر', 'User email', 'E-Mail des Benutzers'), cPass: L('رمز عبور', 'Password', 'Passwort'), cButton: L('ساخت حساب', 'Create account', 'Konto erstellen'), cBusy: L('در حال ساخت...', 'Creating...', 'Wird erstellt...'),
    cHint: L('حداقل ۸ کاراکتر شامل حرف کوچک، حرف بزرگ و عدد', 'At least 8 characters with lowercase, uppercase and a number', 'Mindestens 8 Zeichen mit Kleinbuchstaben, Großbuchstaben und Zahl'),
    adminLimit: L('Admin می‌تواند حساب بسازد؛ تغییر سطح دسترسی و حذف کاربران فقط در اختیار Owner است.', 'Admins can create accounts; only the Owner can change roles or delete users.', 'Admins dürfen Konten erstellen; nur der Inhaber darf Rollen ändern oder Benutzer löschen.'),
  });

  async function load(silent = false) {
    if (!admin) return;
    if (!silent) { ui.loading = true; ui.error = ''; draw(); }
    if (!silent) {
      const r = await ctx.bridge.api('/v1/admin/users?limit=100&offset=0');
      if (r.ok) { ui.users = Array.isArray(r.data?.users) ? r.data.users : []; ui.total = Number(r.data?.total) || ui.users.length; } else ui.error = r.error?.message || 'Could not load management data.';
    }
    ui.loading = false;
    clearTimeout(ui.timer);
    if (root.isConnected || !silent) { if (!silent) draw(); ui.timer = setTimeout(() => { if (root.isConnected) load(true).then(() => liveRefresh()); }, 15000); }
  }
  // site loadAdminUsers(true) refreshes the content stats only; the list is refreshed by «بازخوانی». Keep last seen fresh:
  async function liveRefresh() {
    if (!root.isConnected || ui.pendingDelete || ui.pendingBlock || root.querySelector('input:focus, select:focus')) return;
    const r = await ctx.bridge.api('/v1/admin/users?limit=100&offset=0');
    if (r.ok && Array.isArray(r.data?.users)) { ui.users = r.data.users; draw(); }
  }

  /* ADMIN-CARDS (site 2026-11-19): users as cards; a click opens the detail window */
  const roleGrad = (role) => (role === 'owner' ? 'g-owner' : role === 'admin' ? 'g-admin' : role === 'premium' ? 'g-premium' : 'g-normal');
  function userRow(user, c, lb) {
    const role = user.access_role || 'normal'; const self = String(user.id) === String(a.id);
    const seen = typeof window.amkSeenHtml === 'function' ? window.amkSeenHtml(user) : '';
    return `<button type="button" class="adm-ucard ${user.is_blocked ? 'is-blocked' : ''}" data-ucard="${E(user.id)}"><span class="adm-ucard-av ${roleGrad(role)}">${E((user.display_name || user.email || '?').charAt(0).toUpperCase())}</span><b class="adm-ucard-name" dir="auto">${E(user.display_name || '—')}${self ? ' · ' + E(L('شما', 'You', 'Du')) : ''}</b><small class="adm-ucard-mail" dir="ltr">${E(user.email)}</small><span class="adm-ucard-tags"><i class="t-${E(role)}">${E(lb[role] || role)}</i>${user.is_blocked ? `<i class="t-blocked">${E(lb.blocked)}</i>` : ''}${user.is_verified ? '' : `<i class="t-unv">${E(c.unverified)}</i>`}</span><span class="adm-ucard-seen">${seen}</span></button>`;
  }
  function detailHtml(c, lb) {
    const du = ui.detail ? ui.users.find((u) => String(u.id) === String(ui.detail)) : null; if (!du) return '';
    const role = du.access_role || 'normal'; const canEdit = owner && role !== 'owner'; const trial = du.trial_until && Date.parse(du.trial_until) > Date.now();
    const loc = lang() === 'fa' ? 'fa-IR' : lang() === 'en' ? 'en-GB' : 'de-DE'; const fmt = (v) => (v ? new Date(v).toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
    const row = (k, v) => `<div class="adm-ud-row"><dt>${E(k)}</dt><dd>${v}</dd></div>`;
    return `<div class="dialog-backdrop adm-modal adm-ud-shade" role="dialog" aria-modal="true"><section class="dialog adm-ud-card"><header class="adm-ud-head"><span class="adm-ucard-av ${roleGrad(role)}">${E((du.display_name || du.email || '?').charAt(0).toUpperCase())}</span><div><h2 dir="auto">${E(du.display_name || '—')}</h2><p dir="ltr">${E(du.email)}</p></div><button type="button" class="adm-ud-x" data-adm="udclose" aria-label="${E(L('بستن', 'Close', 'Schließen'))}">×</button></header>
      <div class="adm-ud-role"><label>${E(L('نوع حساب (Premium)', 'Account type (Premium)', 'Kontotyp (Premium)'))}</label>${role === 'owner' ? `<span class="adm-ud-owner">${E(lb.owner)}</span>` : `<div class="adm-ud-seg">${['normal', 'premium', 'admin'].map((r) => `<button type="button" class="${role === r ? 'is-on t-' + r : ''}" data-setrole="${E(du.id)}:${r}" ${!canEdit || du.updating || du.is_blocked ? 'disabled' : ''}>${E(lb[r])}</button>`).join('')}</div>`}${!owner ? `<small>${E(L('فقط مالک می‌تواند تغییر دهد.', 'Only the owner can change this.', 'Nur der Inhaber kann das ändern.'))}</small>` : du.is_blocked && role !== 'owner' ? `<small>${E(L('برای تغییر نوع حساب، اول مسدودی را بردارید.', 'Unblock the account to change its type.', 'Zum Ändern zuerst entsperren.'))}</small>` : ''}</div>
      <dl class="adm-ud-list">${row(L('وضعیت', 'Status', 'Status'), `${du.is_blocked ? `<i class="t-blocked">${E(lb.blocked)}</i>` : `<i class="t-ok">${E(L('فعال', 'Active', 'Aktiv'))}</i>`} ${du.is_verified ? `<i class="t-ok">${E(c.verified)}</i>` : `<i class="t-unv">${E(c.unverified)}</i>`}`)}${row(L('دوره رایگان Premium', 'Premium trial', 'Premium-Testphase'), du.trial_until ? (trial ? `<i class="t-premium">${E(L('فعال تا', 'Active until', 'Aktiv bis'))} ${E(fmt(du.trial_until))}</i>` : `${E(L('پایان‌یافته', 'Ended', 'Beendet'))} · ${E(fmt(du.trial_until))}`) : '—')}${row(L('تاریخ ثبت‌نام', 'Signed up', 'Registriert'), E(fmt(du.created_at)))}${row(L('آخرین ورود', 'Last sign-in', 'Letzte Anmeldung'), E(fmt(du.last_login_at)))}${row(L('آخرین فعالیت', 'Last activity', 'Zuletzt aktiv'), E(fmt(du.last_seen_at)))}${row(L('شناسه', 'ID', 'ID'), `<code dir="ltr">${E(du.id)}</code>`)}</dl>
      ${canEdit ? `<footer class="adm-ud-foot"><button type="button" class="${du.is_blocked ? 'is-unblock' : 'is-block'}" data-block="${E(du.id)}">${du.is_blocked ? '✓ ' + E(c.unblock) : '⛔ ' + E(c.block)}</button><button type="button" class="is-del" data-del="${E(du.id)}">🗑 ${E(c.del)}</button></footer>` : ''}</section></div>`;
  }
  function draw() {
    if (!admin) {
      root.innerHTML = `<section class="card empty-card"><div class="empty-emoji">🔒</div><p>${E(L('این بخش فقط برای مدیران است.', 'This area is for administrators only.', 'Dieser Bereich ist nur für Administratoren.'))}</p></section>`;
      return;
    }
    const c = copy(); const lb = labels();
    const q = ui.query.trim().toLowerCase();
    const counts = { all: ui.users.length, normal: 0, premium: 0, admin: 0, owner: 0, blocked: 0 };
    ui.users.forEach((u) => { counts[u.access_role] = (counts[u.access_role] || 0) + 1; if (u.is_blocked) counts.blocked += 1; });
    const list = ui.users.filter((u) => (ui.filter === 'all' || (ui.filter === 'blocked' ? u.is_blocked : (u.access_role || 'normal') === ui.filter)) && (!q || String(u.email || '').toLowerCase().includes(q) || String(u.display_name || '').toLowerCase().includes(q)));
    const pb = ui.pendingBlock; const pd = ui.pendingDelete;
    const focused = document.activeElement && root.contains(document.activeElement) ? document.activeElement.getAttribute('data-field') : null;
    root.innerHTML = `<header class="page-hero adm-hero"><div class="page-hero-main"><span class="page-hero-icon">🛡️</span><div><p class="kicker">${E(c.eyebrow)}</p><h1>${E(c.title)}</h1><small>${E(c.desc)}</small></div></div><button type="button" class="btn" data-adm="reload">↻ ${E(c.refresh)}</button>${cc && cc.swButtons ? cc.swButtons() : ''}</header>
      <div class="amp-split"><div class="amp-split-a">${cc ? cc.html() : ''}</div><div class="amp-split-b">
      <section class="card adm-create"><div><h2>👤 ${E(c.cTitle)}</h2><p class="muted">${E(c.cDesc)}</p></div>
        <form class="adm-create-form" data-create="1"><label class="fld"><span>${E(c.cEmail)}</span><input type="email" dir="ltr" autocomplete="off" data-field="email" value="${E(ui.draft.email)}" placeholder="user@example.com" /></label>
          <label class="fld"><span>${E(c.cPass)}</span><input type="password" dir="ltr" autocomplete="new-password" data-field="password" value="${E(ui.draft.password)}" placeholder="••••••••" /><small class="muted">${E(c.cHint)}</small></label>
          <button type="submit" class="btn btn-primary" ${ui.busy ? 'disabled' : ''}>${E(ui.busy ? c.cBusy : c.cButton)}</button></form></section>
      <section class="card adm-list"><div class="adm-tools"><label class="search"><input type="search" data-field="query" value="${E(ui.query)}" placeholder="${E(c.search)}" /></label><nav class="adm-filters adm-filters-list">${ROLES.map((r) => `<button type="button" class="${ui.filter === r ? 'is-on' : ''}" data-filter="${r}">${E(lb[r])}</button>`).join('')}</nav>${!owner ? `<p class="muted small">${E(c.adminLimit)}</p>` : ''}${ui.error ? `<p class="warn-text">${E(ui.error)}</p>` : ''}</div>
        ${ui.loading ? '<div class="empty-card"><span class="spinner"></span></div>' : list.length ? `<div class="adm-ucards">${list.map((u) => userRow(u, c, lb)).join('')}</div>` : `<div class="empty-card">${E(c.empty)}</div>`}</section>
      </div></div>
      ${owner && window.AmkAiAdmin ? window.AmkAiAdmin.html() : ''}
      ${detailHtml(c, lb)}
      ${pd ? `<div class="dialog-backdrop adm-modal" role="dialog" aria-modal="true"><section class="dialog"><h2>🗑 ${E(c.delTitle)}</h2><p dir="ltr"><b>${E(pd.email)}</b></p><p>${E(c.delBody)}</p><div class="dialog-actions"><button type="button" class="btn" data-adm="cancel">${E(c.cancel)}</button><button type="button" class="btn btn-danger" data-adm="del">${E(c.confirm)}</button></div></section></div>` : ''}
      ${pb ? `<div class="dialog-backdrop adm-modal" role="dialog" aria-modal="true"><section class="dialog"><h2>${pb.isBlocked ? '✓' : '⛔'} ${E(pb.isBlocked ? c.unblockTitle : c.blockTitle)}</h2><p dir="ltr"><b>${E(pb.email)}</b></p><p>${E(pb.isBlocked ? c.unblockBody : c.blockBody)}</p><div class="dialog-actions"><button type="button" class="btn" data-adm="cancel">${E(c.cancel)}</button><button type="button" class="btn btn-primary" data-adm="block">${E(pb.isBlocked ? c.unblock : c.block)}</button></div></section></div>` : ''}`;
    if (cc) { cc.setUsers?.(() => ui.users); cc.mount(root, draw); cc.refreshUsers?.(); }
    // ADMIN-I18N: the owner AI box is Persian in the site; translate its rendered nodes.
    const aiBox = root.querySelector('#amkAiBox');
    if (aiBox) translateTree(aiBox);
    if (focused) { const f = root.querySelector(`[data-field="${focused}"]`); if (f) { f.focus(); const n = f.value.length; try { f.setSelectionRange(n, n); } catch { /* ignore */ } } }
    if (ctx.afterDraw) ctx.afterDraw();
  }

  async function changeRole(id, role) {
    if (!owner) return;
    const prev = ui.users.find((u) => u.id === id)?.access_role;
    if (prev === 'owner' || !['normal', 'premium', 'admin'].includes(role)) return;
    ui.error = ''; ui.users = ui.users.map((u) => (u.id === id ? { ...u, access_role: role, updating: true } : u)); draw();
    const r = await ctx.bridge.api(`/v1/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: { access_role: role } });
    ui.users = ui.users.map((u) => (u.id === id ? (r.ok ? { ...r.data, updating: false } : { ...u, access_role: prev, updating: false }) : u));
    if (!r.ok) ui.error = r.error?.message || 'Role update failed.';
    draw();
  }
  async function create() {
    if (ui.busy) return;
    const email = ui.draft.email.trim().toLowerCase(); const password = ui.draft.password; ui.error = '';
    if (!email || !password) { ui.error = L('ایمیل و رمز عبور را کامل وارد کنید.', 'Enter both the email and password.', 'Gib E-Mail-Adresse und Passwort vollständig ein.'); draw(); return; }
    if (!validEmail(email)) { ui.error = L('یک ایمیل معتبر وارد کنید.', 'Enter a valid email address.', 'Gib eine gültige E-Mail-Adresse ein.'); draw(); return; }
    if (!strongPassword(password)) { ui.error = st('auth.passwordInvalid'); draw(); return; }
    ui.busy = true; draw();
    const r = await ctx.bridge.api('/v1/admin/users', { method: 'POST', body: { email, password } });
    if (r.ok) { ui.users = [r.data, ...ui.users.filter((u) => u.id !== r.data.id)]; ui.draft = { email: '', password: '' }; toast(L('حساب تأییدشده ساخته شد و کاربر می‌تواند وارد شود.', 'The verified account was created and can sign in now.', 'Das verifizierte Konto wurde erstellt und kann sich jetzt anmelden.'), 'ok'); }
    else ui.error = r.error?.code === 'email_blocked' ? st('auth.emailBlocked') : (r.error?.message || 'Account creation failed.');
    ui.busy = false; draw();
  }
  root.addEventListener('click', async (event) => {
    if (event.target.classList && event.target.classList.contains('adm-ud-shade')) { ui.detail = null; draw(); return; }
    const el = event.target.closest('button'); if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.ucard) { ui.detail = d.ucard; draw(); return; }
    if (d.adm === 'udclose') { ui.detail = null; draw(); return; }
    if (d.setrole) { const [id, r] = d.setrole.split(':'); changeRole(id, r); return; }
    if (d.filter) { ui.filter = ROLES.includes(d.filter) ? d.filter : 'all'; draw(); }
    else if (d.adm === 'reload') load();
    else if (d.del) { const u = ui.users.find((x) => x.id === d.del); if (owner && u && u.access_role !== 'owner') { ui.pendingDelete = { id: u.id, email: u.email }; draw(); } }
    else if (d.block) { const u = ui.users.find((x) => x.id === d.block); if (owner && u && u.access_role !== 'owner') { ui.pendingBlock = { id: u.id, email: u.email, isBlocked: !!u.is_blocked }; draw(); } }
    else if (d.adm === 'cancel') { ui.pendingDelete = null; ui.pendingBlock = null; draw(); }
    else if (d.adm === 'del' && ui.pendingDelete && owner) {
      const t = ui.pendingDelete; ui.error = '';
      const r = await ctx.bridge.api(`/v1/admin/users/${encodeURIComponent(t.id)}`, { method: 'DELETE' });
      if (r.ok) ui.users = ui.users.filter((u) => u.id !== t.id); else ui.error = r.error?.message || 'User deletion failed.';
      ui.pendingDelete = null; draw();
    } else if (d.adm === 'block' && ui.pendingBlock && owner) {
      const t = ui.pendingBlock; ui.error = '';
      const r = await ctx.bridge.api(`/v1/admin/users/${encodeURIComponent(t.id)}/block`, { method: t.isBlocked ? 'DELETE' : 'PATCH' });
      if (r.ok) ui.users = ui.users.map((u) => (u.id === t.id ? r.data : u)); else ui.error = r.error?.message || 'Status update failed.';
      ui.pendingBlock = null; draw();
    }
  });
  root.addEventListener('change', (event) => { const t = event.target; if (t.dataset.role) changeRole(t.dataset.role, t.value); else if (t.dataset.field === 'query') draw(); });
  root.addEventListener('input', (event) => { const f = event.target.dataset.field; if (f === 'email' || f === 'password') ui.draft[f] = event.target.value; else if (f === 'query') ui.query = event.target.value; });
  root.addEventListener('submit', (event) => { if (event.target.dataset.create) { event.preventDefault(); create(); } });
  root.onLeave = () => { clearTimeout(ui.timer); if (cc) cc.close(); };

  draw();
  load();
  // ADMIN-I18N: «مدیریت هوش مصنوعی» and «کنترل محتوا» live in this page — repaint them when the language changes.
  root.onStoreChange = (paths) => {
    if (!paths.some((p) => p === '*' || p === 'uiLanguage')) return;
    draw();
  };
  return root;
}
