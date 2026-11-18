// «تنظیمات حساب» — the site's account settings: profile (photo, name, native language,
// time zone, sign-out), learning settings (level with the premium "now / from tomorrow"
// rule, daily minutes, goal, exam date), password change and account deletion.
// Saves into state.user / appSettings like the site and mirrors the profile to /v1/account/profile.

import { esc, svg, ICONS, toast } from '../core/ui.js';
import { st } from '../core/site-text.js';
import { L, today, addDays, mutate } from '../core/learning.js';
import { confirmDialog } from './widgets.js';

const LEVELS = [['A1', 'Anfänger'], ['A2', 'Elementar'], ['B1', 'Mittelstufe'], ['B2', 'Obere Mittelstufe'], ['C1', 'Fortgeschritten']];
const ui = { message: '', deleteArmed: false };

export function renderAccount(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page account';

  const draw = () => {
    const data = ctx.store.data;
    const user = data.user || {};
    const app = data.appSettings || {};
    const premium = ctx.account.premium;
    const pending = !!(app.levelNext && app.levelFrom && today() < app.levelFrom);
    const levelNote = pending
      ? L(`سطح فعلی ${user.level || '—'} است؛ سطح ${app.levelNext} از فردا در سؤال‌ها و برنامه اعمال می‌شود.`, `Your level is ${user.level || '—'}; ${app.levelNext} applies to questions and the plan from tomorrow.`, `Dein Niveau ist ${user.level || '—'}; ${app.levelNext} gilt ab morgen.`)
      : premium
        ? L('سؤال‌ها و برنامه با این سطح ساخته می‌شوند؛ با تغییر سطح، برنامه امروز همان لحظه از نو ساخته می‌شود.', 'Questions and the plan follow this level; with Premium a change applies at once.', 'Fragen und Plan richten sich nach diesem Niveau; mit Premium gilt eine Änderung sofort.')
        : L('سؤال‌ها و برنامه با این سطح ساخته می‌شوند؛ تغییر سطح از فردا اعمال می‌شود (در پرمیوم: همان لحظه).', 'Questions and the plan follow this level; a change applies from tomorrow (Premium: at once).', 'Fragen und Plan richten sich nach diesem Niveau; eine Änderung gilt ab morgen (Premium: sofort).');
    const minutes = Math.max(60, Math.min(720, Number(user.dailyMinutes) || 60));
    const examDate = /^\d{4}-\d{2}-\d{2}$/.test(String(user.examDate || '')) && String(user.examDate) > today() ? user.examDate : '';
    const initial = esc((user.name || ctx.account.email || 'A').trim().charAt(0).toUpperCase() || 'A');
    const fld = (label, control, cls = '') => `<label class="fld ${cls}"><span>${esc(label)}</span>${control}</label>`;
    root.innerHTML = `<header class="page-hero"><div class="page-hero-main"><span class="page-hero-icon">${svg(ICONS.account)}</span><div><p class="kicker">Amookht</p><h1>${esc(L('تنظیمات حساب', 'Account settings', 'Kontoeinstellungen'))}</h1><small>${esc(L('پروفایل، یادگیری، امنیت و داده‌ها', 'Profile, learning, security and data', 'Profil, Lernen, Sicherheit und Daten'))}</small></div></div></header>
      ${ui.message ? `<p class="card ok-line" role="status">${esc(ui.message)}</p>` : ''}
      <section class="card"><div class="profile-row"><div class="big-avatar">${user.avatarDataUrl ? `<img src="${esc(user.avatarDataUrl)}" alt="">` : initial}</div>
          <div class="profile-main"><div class="panel-head"><div><h2>${esc(L('پروفایل', 'Profile', 'Profil'))}</h2><p class="muted small">${esc(L('نام و عکس شما در منوی کناری دیده می‌شود.', 'Your name and photo appear in the sidebar.', 'Name und Foto erscheinen in der Seitenleiste.'))}</p></div><button type="button" class="btn btn-ghost" data-act="logout">${svg(ICONS.logout)} ${esc(L('خروج از حساب', 'Log out', 'Abmelden'))}</button></div>
          <div class="row-actions"><label class="btn btn-primary">${esc(L('انتخاب عکس', 'Choose photo', 'Foto wählen'))}<input type="file" accept="image/*" data-avatar hidden /></label>${user.avatarDataUrl ? `<button type="button" class="btn btn-danger" data-act="avatar-remove">${esc(L('حذف عکس', 'Remove photo', 'Foto entfernen'))}</button>` : ''}</div></div></div>
        <div class="form-grid" style="margin-top:14px">
          ${fld(L('نام', 'Name', 'Name'), `<input id="aName" dir="auto" value="${esc(user.name || '')}" />`)}
          ${fld(L('ایمیل', 'Email', 'E-Mail'), `<input value="${esc(ctx.account.email)}" disabled dir="ltr" />`)}
          ${fld(L('زبان مادری', 'Native language', 'Muttersprache'), `<select id="aLanguage">${[['fa', 'فارسی'], ['de', 'Deutsch'], ['en', 'English'], ['other', L('سایر', 'Other', 'Andere')]].map(([v, l]) => `<option value="${v}" ${(user.nativeLanguage || 'fa') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`)}
          ${fld(L('منطقه زمانی', 'Time zone', 'Zeitzone'), `<input id="aTimezone" dir="ltr" value="${esc(user.timezone || '')}" placeholder="${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}" />`)}
        </div></section>
      <section class="card"><div class="panel-head"><div><h2>${esc(L('تنظیمات یادگیری', 'Learning settings', 'Lerneinstellungen'))}</h2></div></div>
        <div class="form-grid">
          ${fld(L('سطح', 'Level', 'Niveau'), `<select id="aLevel">${LEVELS.map(([id, d]) => `<option value="${id}" ${(app.levelNext || user.level) === id ? 'selected' : ''}>${id} — ${d}</option>`).join('')}</select><small class="${pending ? 'warn-text' : 'muted'} small">${esc(levelNote)}</small>`)}
          ${fld(L('زمان روزانه (دقیقه)', 'Daily time (minutes)', 'Tägliche Zeit (Minuten)'), `<input id="aMinutes" type="number" min="60" max="720" value="${minutes}" />`)}
          ${fld(L('هدف اصلی', 'Main goal', 'Hauptziel'), `<input id="aGoal" dir="auto" value="${esc(user.learningGoal || '')}" />`, 'full')}
          ${fld(L('تاریخ آزمون یا هدف', 'Exam or target date', 'Prüfungs- oder Zieldatum'), `<input id="aExamDate" type="date" min="${addDays(today(), 1)}" value="${esc(examDate)}" />`)}
        </div>
        <div class="row-actions end"><button type="button" class="btn btn-primary" data-act="save">${esc(L('ذخیره تغییرات', 'Save changes', 'Änderungen speichern'))}</button></div></section>
      <section class="card"><div class="panel-head"><div><h2>${esc(L('امنیت', 'Security', 'Sicherheit'))}</h2><p class="muted small">${esc(L('رمز جدید: حداقل ۸ کاراکتر، با حرف کوچک، حرف بزرگ و عدد.', 'New password: at least 8 characters with a lowercase letter, an uppercase letter and a number.', 'Neues Passwort: mindestens 8 Zeichen mit Klein-, Großbuchstaben und Zahl.'))}</p></div></div>
        <form class="form-grid" id="pwForm" autocomplete="off">${fld(L('رمز فعلی', 'Current password', 'Aktuelles Passwort'), '<input id="aCurrent" type="password" autocomplete="current-password" />')}${fld(L('رمز جدید', 'New password', 'Neues Passwort'), '<input id="aNew" type="password" autocomplete="new-password" />')}</form>
        <div class="row-actions end"><button type="button" class="btn" data-act="password">${esc(L('تغییر رمز', 'Change password', 'Passwort ändern'))}</button></div></section>
      <section class="card danger-card"><h2>${esc(L('منطقه خطر', 'Danger zone', 'Gefahrenbereich'))}</h2><p class="small">${esc(L('حذف حساب قابل بازگشت نیست؛ تاریخچه و داده‌های SQL نیز غیرفعال می‌شوند.', 'Deleting the account cannot be undone; history and stored data are deactivated too.', 'Das Löschen kann nicht rückgängig gemacht werden; Verlauf und Daten werden ebenfalls deaktiviert.'))}</p>
        <div class="row-actions">${ui.deleteArmed ? `<button type="button" class="btn" data-act="delete-cancel">${esc(st('common.cancel'))}</button><button type="button" class="btn btn-danger" data-act="delete-confirm">${esc(L('تأیید حذف حساب', 'Confirm account deletion', 'Löschen bestätigen'))}</button>` : `<button type="button" class="btn btn-danger" data-act="delete-arm">${esc(L('حذف حساب', 'Delete account', 'Konto löschen'))}</button>`}</div></section>`;
  };

  const val = (id) => (root.querySelector('#' + id)?.value || '').trim();
  let saving = false;

  /** Site syncProfileToServer: mirror the profile to the account record. */
  async function syncProfile() {
    const data = ctx.store.data;
    const user = data.user || {};
    const plan = user.examPlan === 'oesd' ? 'ÖSD' : L('برنامه یادگیری', 'Learning program', 'Lernprogramm');
    await ctx.bridge.api('/v1/account/profile', {
      method: 'PATCH',
      body: {
        display_name: user.name || null, current_level: user.level || null, target_exam: plan, target_level: user.level || null, exam_date: user.examDate || null,
        native_language: user.nativeLanguage || 'fa', profile_completed: !!user.profileCompleted, daily_minutes: Math.max(60, Math.min(720, Number(user.dailyMinutes) || 60)),
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, learning_goals: user.learningGoal ? [user.learningGoal] : [],
        accessibility: { reduced_motion: !!user.reducedMotion }, avatar_data_url: user.avatarDataUrl || null,
      },
    });
  }

  /** Site amkSetLevelFromSettings: premium (or no level yet) changes now, others from tomorrow. */
  function applyLevel(v) {
    const data = ctx.store.data;
    const cur = (data.user || {}).level;
    const app = data.appSettings || {};
    if (!v) return '';
    if (v === cur) {
      const had = !!app.levelNext;
      if (had) {
        ctx.store.set('appSettings.levelNext', undefined);
        ctx.store.set('appSettings.levelFrom', undefined);
        if (data.user?.examPlan === 'oesd' && data.oesdMethod) mutate(ctx.store, 'oesdMethod', {}, (m) => { delete m.levelNext; delete m.levelFrom; return m; });
      }
      return had ? 'cancel' : '';
    }
    if (ctx.account.premium || !cur) {
      mutate(ctx.store, 'user', {}, (u) => { u.level = v; return u; });
      if (app.levelNext) { ctx.store.set('appSettings.levelNext', undefined); ctx.store.set('appSettings.levelFrom', undefined); }
      if (data.user?.examPlan === 'oesd') mutate(ctx.store, 'oesdMethod', {}, (m) => { m.level = /C1|C2/.test(v) ? 'C1' : 'B2'; delete m.levelNext; delete m.levelFrom; return m; });
      return 'now';
    }
    const from = addDays(today(), 1);
    ctx.store.set('appSettings.levelNext', v);
    ctx.store.set('appSettings.levelFrom', from);
    if (data.user?.examPlan === 'oesd') {
      const ol = /C1|C2/.test(v) ? 'C1' : 'B2';
      if (ol !== ((data.oesdMethod || {}).level || '')) mutate(ctx.store, 'oesdMethod', {}, (m) => { m.levelNext = ol; m.levelFrom = from; return m; });
    }
    return 'next';
  }

  async function save() {
    const examDate = val('aExamDate');
    if (examDate && !(examDate > today())) {
      ui.message = st('onboarding.examDateFuture') === 'onboarding.examDateFuture' ? L('تاریخ آزمون باید در آینده باشد.', 'The exam date must be in the future.', 'Das Prüfungsdatum muss in der Zukunft liegen.') : st('onboarding.examDateFuture');
      draw();
      return;
    }
    // Read every field before saving anything: a save redraws the page.
    const fields = {
      name: val('aName'), nativeLanguage: val('aLanguage'), timezone: val('aTimezone'),
      dailyMinutes: Math.max(60, Math.min(720, Number(val('aMinutes')) || 60)), learningGoal: val('aGoal'), examDate, profileCompleted: true,
    };
    const level = val('aLevel');
    saving = true;
    const result = applyLevel(level);
    mutate(ctx.store, 'user', {}, (u) => Object.assign(u, fields));
    saving = false;
    await ctx.store.flush();
    await syncProfile();
    const user = ctx.store.data.user || {};
    const app = ctx.store.data.appSettings || {};
    ui.message = result === 'now'
      ? L(`تغییرات حساب ذخیره شد. سطح شما ${user.level} شد.`, `Saved. Your level is now ${user.level}.`, `Gespeichert. Dein Niveau ist jetzt ${user.level}.`)
      : result === 'next'
        ? L(`تغییرات حساب ذخیره شد. سطح جدید ${app.levelNext} از فردا در سؤال‌ها و برنامه اعمال می‌شود؛ برنامه امروز با سطح ${user.level || '—'} می‌ماند.`, `Saved. The new level ${app.levelNext} applies from tomorrow; today stays at ${user.level || '—'}.`, `Gespeichert. Das neue Niveau ${app.levelNext} gilt ab morgen; heute bleibt ${user.level || '—'}.`)
        : result === 'cancel'
          ? L('تغییرات حساب ذخیره شد. تغییر سطحی که برای فردا ثبت شده بود لغو شد.', 'Saved. The level change planned for tomorrow was cancelled.', 'Gespeichert. Die für morgen geplante Niveauänderung wurde verworfen.')
          : L('تغییرات حساب ذخیره شد.', 'Account changes saved.', 'Kontoänderungen gespeichert.');
    draw();
  }

  async function setAvatar(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast(L('یک فایل تصویری انتخاب کنید.', 'Please choose an image file.', 'Bitte eine Bilddatei wählen.'), 'warn'); return; }
    if (file.size > 6 * 1024 * 1024) { toast(L('عکس باید کمتر از ۶ مگابایت باشد.', 'The image must be smaller than 6 MB.', 'Das Bild muss kleiner als 6 MB sein.'), 'warn'); return; }
    try {
      const url = URL.createObjectURL(file);
      const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const g = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      g.fillStyle = '#111827';
      g.fillRect(0, 0, size, size);
      g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
      mutate(ctx.store, 'user', {}, (u) => Object.assign(u, { avatarDataUrl: dataUrl, profileCompleted: true }));
      await ctx.store.flush();
      await syncProfile();
      ui.message = L('عکس پروفایل ذخیره شد.', 'Profile image saved.', 'Profilbild gespeichert.');
      draw();
    } catch {
      toast(L('ذخیره عکس انجام نشد؛ فایل دیگری را امتحان کنید.', 'Could not save the image. Try another file.', 'Bild konnte nicht gespeichert werden.'), 'warn');
    }
  }

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-avatar]')) setAvatar(event.target);
  });
  root.addEventListener('click', async (event) => {
    const el = event.target.closest('button');
    if (!el) return;
    switch (el.dataset.act) {
      case 'save': save(); break;
      case 'logout': ctx.signOut(); break;
      case 'avatar-remove':
        mutate(ctx.store, 'user', {}, (u) => Object.assign(u, { avatarDataUrl: '' }));
        await ctx.store.flush();
        await syncProfile();
        ui.message = L('عکس پروفایل حذف شد.', 'Profile image removed.', 'Profilbild entfernt.');
        draw();
        break;
      case 'password': {
        const current = root.querySelector('#aCurrent').value;
        const next = root.querySelector('#aNew').value;
        if (!(next.length >= 8 && /[a-z]/.test(next) && /[A-Z]/.test(next) && /\d/.test(next))) {
          ui.message = L('رمز جدید باید حداقل ۸ کاراکتر و شامل حرف کوچک، حرف بزرگ و عدد باشد.', 'The new password needs 8+ characters with a lowercase letter, an uppercase letter and a number.', 'Das neue Passwort braucht 8+ Zeichen mit Klein-, Großbuchstaben und Zahl.');
          draw();
          return;
        }
        const r = await ctx.bridge.api('/v1/account/password', { method: 'POST', body: { current_password: current, new_password: next } });
        ui.message = r.ok ? L('رمز عبور با موفقیت تغییر کرد.', 'Password changed.', 'Passwort geändert.') : L('تغییر رمز انجام نشد؛ اتصال یا رمز فعلی را بررسی کنید.', 'Could not change the password; check the connection and the current password.', 'Passwort nicht geändert; Verbindung und aktuelles Passwort prüfen.');
        draw();
        break;
      }
      case 'delete-arm': ui.deleteArmed = true; draw(); break;
      case 'delete-cancel': ui.deleteArmed = false; draw(); break;
      case 'delete-confirm': {
        if (!(await confirmDialog(L('حساب شما برای همیشه حذف شود؟', 'Delete your account for good?', 'Konto endgültig löschen?')))) return;
        const r = await ctx.bridge.api('/v1/account', { method: 'DELETE' });
        ui.deleteArmed = false;
        if (r.ok) ctx.signOut();
        else toast(r.error?.message || L('حذف حساب انجام نشد.', 'Could not delete the account.', 'Konto konnte nicht gelöscht werden.'), 'warn');
        break;
      }
      default:
    }
  });

  draw();
  root.onStoreChange = (paths) => {
    if (saving || !paths.some((p) => ['*', 'user', 'uiLanguage', 'appSettings', 'appSettings.levelNext', 'appSettings.levelFrom'].includes(p))) return;
    if (document.activeElement && root.contains(document.activeElement) && document.activeElement.matches('input, select, textarea')) return;
    draw();
  };
  root.onLeave = () => { ui.message = ''; ui.deleteArmed = false; };
  return root;
}
