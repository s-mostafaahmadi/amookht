// «تنظیمات برنامه» — every option of the site's app-settings page, saved into the
// same account state (appSettings.*, darkMode, uiLanguage, user.*), so the site
// and the app always look the same.

import { esc, svg, ICONS } from '../core/ui.js';
import { t, lang, LANG_NAMES, pick } from '../core/i18n.js';
import { APP_ACCENTS, ACCENT_NAMES, DEFAULT_PREFS, readLook } from '../core/theme.js';
import { confirmDialog } from './widgets.js';

const L = (fa, en, de) => pick({ fa, en, de: de || en });
// Telegram link status, kept between visits of the page.
const tg = { status: null, err: '', polling: 0 };

const SELBAR = [
  ['tr', '🌐', () => L('ترجمه', 'Translate', 'Übersetzen')],
  ['say', '🔊', () => L('تلفظ', 'Pronounce', 'Aussprache')],
  ['nb', '📒', () => L('به دفتر عبارات', 'To notebook', 'Ins Heft')],
  ['fav', '⭐', () => L('افزودن به علاقه‌مندی‌ها', 'Add to favourites', 'Zu Favoriten')],
  ['ask', '❓', () => L('از مربی بپرس', 'Ask the tutor', 'Tutor fragen')],
];

const toggle = (key, title, desc, checked) => `
  <label class="toggle-row">
    <span><b>${esc(title)}</b><small>${esc(desc)}</small></span>
    <span class="switch"><input type="checkbox" data-toggle="${key}" ${checked ? 'checked' : ''} /><span class="track" aria-hidden="true"></span></span>
  </label>`;

const card = (icon, title, desc, body, extra = '') => `
  <section class="card ${extra}">
    <div class="card-title"><span>${typeof icon === 'string' && icon.length < 4 ? icon : svg(icon)}</span><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div></div>
    ${body}
  </section>`;

export function renderAppSettings(page, ctx) {
  const root = document.createElement('div');
  root.className = 'page';

  const draw = () => {
    const data = ctx.store.data;
    const p = data.appSettings || {};
    const user = data.user || {};
    const look = readLook(data);
    const off = Array.isArray(p.selbarOff) ? p.selbarOff : [];
    const owner = ctx.account.owner;

    root.innerHTML = `
      <header class="page-hero">
        <div class="page-hero-main">
          <span class="page-hero-icon">${svg(ICONS.settings)}</span>
          <div><p class="kicker">Amookht</p><h1>${esc(t('navAppSettings'))}</h1>
          <small>${esc(L('ظاهر و تجربهٔ کاربری را دقیقاً مطابق سلیقهٔ خودتان بسازید.', 'Shape the look and feel exactly the way you like.', 'Gestalte Aussehen und Bedienung ganz nach deinem Geschmack.'))}</small></div>
        </div>
        <button class="btn" type="button" data-act="reset">${esc(L('بازنشانی تنظیمات', 'Reset settings', 'Einstellungen zurücksetzen'))}</button>
      </header>

      <div class="settings-grid">
        ${card(ICONS.display, L('پیش‌نمایش زنده', 'Live preview', 'Live-Vorschau'), L('همه تغییرات همان لحظه در کل برنامه اعمال می‌شوند.', 'Every change applies to the whole app at once.', 'Jede Änderung gilt sofort in der ganzen App.'), `
          <div class="mock"><div class="mock-top"><i></i><i></i><i></i></div>
            <div class="mock-body"><aside><span></span><span></span><span></span></aside>
              <div class="mock-main"><strong>Learning dashboard</strong><p></p><p></p><button type="button" tabindex="-1">${esc(L('ادامه', 'Continue', 'Weiter'))}</button></div></div></div>`)}

        ${card(ICONS.palette, L('رنگ اصلی', 'Accent colour', 'Akzentfarbe'), L('رنگ دکمه‌ها، نمودارها و حالت‌های فعال', 'Buttons, charts and active states', 'Schaltflächen, Diagramme und aktive Zustände'), `
          <div class="swatches">${Object.entries(APP_ACCENTS).map(([id, [color]]) => `
            <button type="button" class="swatch ${look.accent === id ? 'is-on' : ''}" data-accent="${id}" style="--sw:${color}" title="${esc(pick(ACCENT_NAMES[id]))}"><i></i><span>${esc(pick(ACCENT_NAMES[id]))}</span></button>`).join('')}</div>`)}

        ${card(ICONS.type, L('اندازه نوشته‌ها', 'Text size', 'Schriftgröße'), L('از حالت فشرده تا خوانایی بیشتر', 'From compact to easier reading', 'Von kompakt bis gut lesbar'), `
          <div class="range-row"><span>A</span><input type="range" min="85" max="120" step="5" value="${look.fontScale}" data-range="fontScale" /><b>${look.fontScale}%</b><span style="font-size:1.3em">A</span></div>`)}

        ${card(ICONS.lines, L('تراکم صفحه', 'Density', 'Dichte'), L('فاصله بین کارت‌ها و کنترل‌ها', 'Space between cards and controls', 'Abstand zwischen Karten und Bedienelementen'), `
          <div class="segmented">${[['compact', L('فشرده', 'Compact', 'Kompakt')], ['comfortable', L('استاندارد', 'Standard', 'Standard')], ['spacious', L('باز', 'Spacious', 'Großzügig')]]
            .map(([id, label]) => `<button type="button" data-density="${id}" class="${look.density === id ? 'is-on' : ''}">${esc(label)}</button>`).join('')}</div>`)}

        ${card(ICONS.radius, L('گردی کارت‌ها', 'Card roundness', 'Kartenrundung'), L('فرم ظاهری پنل‌ها و دکمه‌ها', 'Shape of panels and buttons', 'Form von Flächen und Schaltflächen'), `
          <div class="range-row"><span>▢</span><input type="range" min="8" max="32" step="2" value="${look.radius}" data-range="radius" /><b>${look.radius}px</b><span>▢</span></div>`)}

        ${card(ICONS.globe, t('language'), L('زبان رابط برنامه و سایت', 'Language of the app and the site', 'Sprache von App und Website'), `
          <div class="segmented">${Object.entries(LANG_NAMES).map(([id, name]) => `<button type="button" data-lang="${id}" class="${lang() === id ? 'is-on' : ''}">${esc(name)}</button>`).join('')}</div>`)}

        ${card(ICONS.display, L('نمایش و دسترس‌پذیری', 'Display and accessibility', 'Anzeige und Barrierefreiheit'), L('تنظیمات محیط برنامه', 'App environment', 'App-Umgebung'), `
          <div class="toggles">
            ${toggle('darkMode', L('حالت تاریک', 'Dark mode', 'Dunkelmodus'), L('نمای تیره برای محیط کم‌نور', 'Dark view for low light', 'Dunkle Ansicht für wenig Licht'), look.dark)}
            ${toggle('glass', L('افکت شیشه‌ای', 'Glass effect', 'Glaseffekt'), L('شفافیت و محوشدگی پنل‌ها', 'Translucent panels', 'Durchscheinende Flächen'), look.glass)}
            ${toggle('highContrast', L('کنتراست بیشتر', 'Higher contrast', 'Mehr Kontrast'), L('مرزبندی واضح‌تر عناصر', 'Clearer edges', 'Klarere Kanten'), look.highContrast)}
            ${toggle('reducedMotion', L('کاهش حرکت', 'Reduce motion', 'Bewegung reduzieren'), L('خاموش‌کردن انیمیشن‌های رابط', 'Turn off interface animations', 'Animationen ausschalten'), look.reducedMotion)}
            ${toggle('notifications', L('یادآوری روزانه', 'Daily reminder', 'Tägliche Erinnerung'), L('ذخیره ترجیح اعلان‌های برنامه', 'Keep the app reminder preference', 'Erinnerungseinstellung speichern'), user.notifications !== false)}
            ${toggle('sidebarCompact', L('سایدبار فشرده', 'Compact sidebar', 'Kompakte Seitenleiste'), L('فضای بیشتر برای محتوای اصلی', 'More room for the content', 'Mehr Platz für den Inhalt'), look.sidebarCompact)}
          </div>`, 'span-2')}

        ${card('🖱', L('گزینه‌های انتخاب متن', 'Text selection options', 'Optionen für markierten Text'), L('دکمه‌هایی که با انتخاب متن آلمانی نمایش داده می‌شوند', 'Buttons shown when you select German text', 'Schaltflächen bei markiertem deutschem Text'), `
          <div class="chips">${SELBAR.map(([id, icon, label]) => `<button type="button" class="chip ${off.includes(id) ? '' : 'is-on'}" data-selbar="${id}">${icon} ${esc(label())}</button>`).join('')}</div>
          <p class="card-note">${esc(L('در سایت فعال است؛ نوار انتخاب متن در نسخهٔ بومی از مرحلهٔ ۴ می‌آید.', 'Active on the site; the native selection toolbar arrives in milestone 4.', 'Auf der Website aktiv; in der nativen App ab Meilenstein 4.'))}</p>`)}

        ${card(ICONS.display, L('دکمه‌های شناور', 'Floating buttons', 'Schwebende Schaltflächen'), L('مشخص کنید کدام میان‌برها روی صفحه نمایش داده شوند.', 'Choose which quick-access buttons appear.', 'Wähle, welche Schnellzugriffe erscheinen.'), `
          <div class="toggles">
            ${toggle('showSupportButton', L('پشتیبانی', 'Support', 'Support'), L('تلگرام، اینستاگرام، واتس‌اپ و یوتیوب', 'Telegram, Instagram, WhatsApp and YouTube', 'Telegram, Instagram, WhatsApp und YouTube'), p.showSupportButton !== false)}
            ${toggle('showLanguageCoachButton', L('مربی آلمانی', 'German tutor', 'Deutsch-Tutor'), L('کمک حین تمرین: معنی، گرامر و تصحیح', 'Help while practising: meaning, grammar, corrections', 'Hilfe beim Üben: Bedeutung, Grammatik, Korrektur'), p.showLanguageCoachButton !== false)}
            ${owner ? toggle('showOwnerAIButton', L('دستیار هوش مصنوعی مالک', 'Owner AI assistant', 'KI-Assistent des Inhabers'), L('دسترسی سریع به ابزارهای مدیریتی هوش مصنوعی', 'Quick access to admin AI tools', 'Schnellzugriff auf KI-Verwaltung'), p.showOwnerAIButton !== false) : ''}
          </div>`)}

        ${card('🎨', L('رنگ‌بندی ساختار جمله‌ها', 'Sentence-structure colours', 'Satzbau-Farben'), L('جمله‌های علاقه‌مندی‌ها، دفتر عبارات و اشتباهات با رنگ اجزای جمله نمایش داده شوند', 'Colour sentence parts in favourites, notebook and mistakes', 'Satzglieder in Favoriten, Heft und Fehlern färben'), `
          <div class="toggles">${toggle('sentColors', L('رنگ‌بندی روشن باشد', 'Colours on', 'Farben an'), '', p.sentColors !== false)}</div>
          <span class="sp-sample"><span class="sp-s">Ich</span> <span class="sp-v">lese</span> <span class="sp-o">das Buch</span> <span class="sp-p">morgen</span> <span class="sp-v">vor</span>.</span>`)}

        <section class="card tg-card span-2" id="tgCard">${telegramCard()}</section>
        <section class="card link-card span-2">
          <div class="card-title" style="margin:0"><span>${svg(ICONS.account)}</span><div><h2>${esc(t('navAccount'))}</h2><p>${esc(L('پروفایل، یادگیری، امنیت، رمز و داده‌های حساب', 'Profile, learning, security, password and account data', 'Profil, Lernen, Sicherheit, Passwort und Kontodaten'))}</p></div></div>
          <button class="btn" type="button" data-act="account">${esc(L('بازکردن تنظیمات حساب', 'Open account settings', 'Kontoeinstellungen öffnen'))}</button>
        </section>
      </div>`;
  };

  const setApp = (key, value) => ctx.store.set('appSettings.' + key, value);

  root.addEventListener('click', (event) => {
    const el = event.target.closest('button');
    if (!el) return;
    if (el.dataset.accent) setApp('accent', el.dataset.accent);
    else if (el.dataset.density) setApp('density', el.dataset.density);
    else if (el.dataset.lang) ctx.store.set('uiLanguage', el.dataset.lang);
    else if (el.dataset.selbar) {
      const current = ctx.store.get('appSettings.selbarOff');
      const off = new Set(Array.isArray(current) ? current : []);
      if (off.has(el.dataset.selbar)) off.delete(el.dataset.selbar);
      else off.add(el.dataset.selbar);
      setApp('selbarOff', [...off]);
    } else if (el.dataset.act === 'reset') {
      // Only the look keys (the site's resetAppSettings would also drop the
      // focus timer, selection and colour preferences stored next to them).
      Object.entries(DEFAULT_PREFS).forEach(([key, value]) => setApp(key, value));
    } else if (el.dataset.act === 'account') ctx.navigate('settings');
  });

  root.addEventListener('change', (event) => {
    const input = event.target;
    const key = input.dataset.toggle;
    if (!key) return;
    const on = input.checked;
    if (key === 'darkMode') ctx.store.set('darkMode', on);
    else if (key === 'reducedMotion' || key === 'notifications') ctx.store.update('user', (u) => ({ ...u, [key]: on }));
    else setApp(key, on);
  });

  // Ranges: live preview while dragging, saved when released.
  root.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.dataset.range) return;
    const value = Number(input.value);
    const label = input.parentElement.querySelector('b');
    if (input.dataset.range === 'fontScale') {
      document.documentElement.style.setProperty('--font-scale', String(value / 100));
      if (label) label.textContent = value + '%';
    } else {
      document.documentElement.style.setProperty('--card-radius', value + 'px');
      if (label) label.textContent = value + 'px';
    }
  });
  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.dataset.range) setApp(input.dataset.range, Number(input.value));
  });

  /* ── Telegram link card (site telegram-link.js, TGSET) ── */
  const TG_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13l-4.8-1.5c-1-.3-1.1-1 .2-1.5L20.5 2.7c.9-.3 1.6.2 1.4 1.6z"/></svg>';
  function telegramCard() {
    const s = tg.status;
    let h = `<div class="tg-head"><span class="tg-logo">${TG_LOGO}</span><div><h2>${esc(L('اتصال تلگرام', 'Telegram link', 'Telegram-Verbindung'))}</h2><p>${esc(L('گزارش روزانه، یادآوری برنامه و اطلاعیه‌های آموخت در تلگرام', 'Daily report, study reminders and Amookht news in Telegram', 'Tagesbericht, Lernerinnerungen und Neuigkeiten in Telegram'))}</p></div></div>`;
    if (!s) return h + `<p class="card-note">${esc(tg.err || L('در حال بررسی…', 'Checking…', 'Wird geprüft …'))}</p>`;
    if (s.linked) {
      const who = [s.telegram_name, s.telegram_username ? '@' + s.telegram_username : ''].filter(Boolean).join(' · ');
      h += `<div class="tg-ok">✅ ${esc(L('به تلگرام وصل است', 'Connected to Telegram', 'Mit Telegram verbunden'))}${who ? ' — ' + esc(who) : ''}${s.active === false ? esc(L(' (ربات بسته شده؛ دوباره Start بزنید)', ' (bot stopped; press Start again)', ' (Bot gestoppt; erneut Start drücken)')) : ''}</div>
        <div class="row-actions">${s.bot ? `<button type="button" class="btn tg-btn" data-tg="open">${TG_LOGO} ${esc(L('باز کردن ربات', 'Open the bot', 'Bot öffnen'))}</button>` : ''}<button type="button" class="btn btn-danger" data-tg="unlink">${esc(L('قطع اتصال', 'Disconnect', 'Trennen'))}</button></div>
        <p class="card-note">${esc(L('ساعت یادآوری و گزارش شبانه را در ربات از «⚙️ تنظیمات اعلان‌ها» تغییر دهید.', 'Change reminder and report times in the bot under “⚙️ notification settings”.', 'Erinnerungs- und Berichtszeiten im Bot unter „⚙️ Benachrichtigungen“ ändern.'))}</p>`;
    } else {
      h += `<ul class="tg-list"><li>🔔 ${esc(L('یادآوری عصر اگر هنوز مطالعه نکرده باشید', 'An evening reminder if you have not studied yet', 'Abenderinnerung, falls du noch nicht gelernt hast'))}</li><li>🌙 ${esc(L('گزارش شبانه پیشرفت همان روز', 'A nightly progress report', 'Abendlicher Fortschrittsbericht'))}</li><li>📢 ${esc(L('اطلاعیه‌های جدید آموخت', 'New Amookht announcements', 'Neue Ankündigungen'))}</li></ul>
        <div class="row-actions"><button type="button" class="btn tg-btn" data-tg="link" ${tg.polling ? 'disabled' : ''}>${TG_LOGO} ${esc(tg.polling ? L('در انتظار تأیید در تلگرام…', 'Waiting for Telegram…', 'Warte auf Telegram …') : L('اتصال به تلگرام', 'Connect Telegram', 'Mit Telegram verbinden'))}</button></div>
        <p class="card-note">${esc(L('با زدن دکمه، ربات آموخت در تلگرام باز می‌شود؛ «Start» را بزنید تا حساب وصل شود.', 'The button opens the Amookht bot in Telegram; press “Start” to connect your account.', 'Der Knopf öffnet den Bot in Telegram; drücke „Start“, um dein Konto zu verbinden.'))}</p>`;
    }
    if (tg.err) h += `<p class="card-note error-line">${esc(tg.err)}</p>`;
    return h;
  }
  const paintTelegram = () => { const card = root.querySelector('#tgCard'); if (card) card.innerHTML = telegramCard(); };
  async function loadTelegram() {
    const r = await ctx.bridge.api('/v1/telegram/status');
    if (r.ok) { tg.status = r.data; tg.err = ''; } else tg.err = L('وضعیت اتصال تلگرام دریافت نشد.', 'Could not read the Telegram status.', 'Telegram-Status nicht verfügbar.');
    paintTelegram();
  }
  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-tg]');
    if (!button) return;
    const act = button.dataset.tg;
    if (act === 'open' && tg.status?.bot) ctx.bridge.openExternal('https://t.me/' + tg.status.bot);
    if (act === 'unlink') {
      if (!(await confirmDialog(L('اتصال تلگرام قطع شود؟ دیگر گزارش و یادآوری نمی‌گیرید.', 'Disconnect Telegram? You will no longer get reports and reminders.', 'Telegram trennen? Du bekommst dann keine Berichte und Erinnerungen mehr.')))) return;
      const r = await ctx.bridge.api('/v1/telegram/link', { method: 'DELETE' });
      if (!r.ok) tg.err = L('قطع اتصال انجام نشد؛ دوباره تلاش کنید.', 'Could not disconnect; try again.', 'Trennen fehlgeschlagen.');
      loadTelegram();
    }
    if (act === 'link') {
      button.disabled = true;
      const r = await ctx.bridge.api('/v1/telegram/link', { method: 'POST' });
      if (!r.ok) {
        tg.err = r.error?.status === 429 ? L('تعداد درخواست‌ها زیاد بود؛ کمی بعد دوباره امتحان کنید.', 'Too many requests; try again shortly.', 'Zu viele Anfragen; bitte gleich erneut.') : L('ساخت لینک اتصال انجام نشد؛ دوباره تلاش کنید.', 'Could not create the link; try again.', 'Link konnte nicht erstellt werden.');
        paintTelegram();
        return;
      }
      tg.err = '';
      ctx.bridge.openExternal(r.data.url);
      const started = Date.now();
      clearInterval(tg.polling);
      tg.polling = setInterval(async () => {
        if (Date.now() - started > 180000 || !root.isConnected) { clearInterval(tg.polling); tg.polling = 0; paintTelegram(); return; }
        const s = await ctx.bridge.api('/v1/telegram/status');
        if (s.ok && s.data.linked) { clearInterval(tg.polling); tg.polling = 0; tg.status = s.data; paintTelegram(); }
      }, 3000);
      paintTelegram();
    }
  });
  loadTelegram();

  draw();
  // Redraw when these settings change here, on the site or on another device.
  const watched = (path) => path === '*' || path.startsWith('appSettings') || path === 'darkMode' || path === 'uiLanguage' || path === 'user';
  root.onStoreChange = (paths) => {
    if (!paths.some(watched)) return;
    const focused = document.activeElement && root.contains(document.activeElement) && document.activeElement.type === 'range';
    if (!focused) draw();
  };
  return root;
}
