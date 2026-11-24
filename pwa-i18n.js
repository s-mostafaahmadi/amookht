(()=>{'use strict';
const KEY='amookht_ui_language';
const rows=[
['نسخه سبک موبایل','Lightweight mobile version','Leichte Mobilversion'],
['ورود به حساب','Sign in','Anmelden'],
['با حساب فعلی‌تان وارد شوید؛ برنامه و داده‌های شما پس از ورود باز می‌شوند.','Sign in with your account to open your program and data.','Melde dich mit deinem Konto an, um dein Programm und deine Daten zu öffnen.'],
['ورود','Sign in','Anmelden'],
['ساخت حساب','Create account','Konto erstellen'],
['ایمیل','Email','E-Mail'],
['رمز عبور','Password','Passwort'],
['تکرار رمز عبور','Confirm password','Passwort bestätigen'],
['رمز باید دست‌کم ۸ کاراکتر، شامل حرف کوچک و بزرگ انگلیسی و عدد باشد.','Your password needs at least 8 characters, including lowercase and uppercase letters and a number.','Das Passwort muss mindestens 8 Zeichen, Groß- und Kleinbuchstaben und eine Zahl enthalten.'],
['رمز عبور را فراموش کرده‌اید؟','Forgot password?','Passwort vergessen?'],
['تأیید ایمیل','Verify email','E-Mail bestätigen'],
['کد پنج‌رقمی ارسال‌شده را وارد کنید.','Enter the five-digit code sent to you.','Gib den gesendeten fünfstelligen Code ein.'],
['کد تأیید','Verification code','Bestätigungscode'],
['تأیید و ساخت حساب','Verify and create account','Bestätigen und Konto erstellen'],
['بازگشت','Back','Zurück'],
['بازیابی رمز عبور','Reset password','Passwort zurücksetzen'],
['ایمیل ثبت‌نامی خود را وارد کنید تا کد بازیابی ارسال شود.','Enter your registered email to receive a reset code.','Gib deine registrierte E-Mail-Adresse ein, um einen Wiederherstellungscode zu erhalten.'],
['ارسال کد بازیابی','Send reset code','Code senden'],
['کد پنج‌رقمی ایمیل','Five-digit email code','Fünfstelliger E-Mail-Code'],
['رمز عبور جدید','New password','Neues Passwort'],
['تکرار رمز جدید','Confirm new password','Neues Passwort bestätigen'],
['تغییر رمز عبور','Change password','Passwort ändern'],
['بازگشت به ورود','Back to sign in','Zurück zur Anmeldung'],
['بازگشت به سایت اصلی','Back to main site','Zurück zur Hauptseite'],
['لطفاً کمی صبر کنید…','Please wait…','Bitte warten…'],
['ارسال کد تأیید','Send verification code','Bestätigungscode senden'],
['اتصال برقرار نشد؛ اینترنت را بررسی کنید.','Connection failed. Check your internet connection.','Verbindung fehlgeschlagen. Prüfe deine Internetverbindung.'],
['ایمیل یا رمز اشتباه است.','Incorrect email or password.','E-Mail oder Passwort ist falsch.'],
['ورود موقتاً قفل شده است؛ کمی بعد دوباره تلاش کنید.','Sign in is temporarily locked. Try again shortly.','Die Anmeldung ist vorübergehend gesperrt. Versuche es später erneut.'],
['ایمیل هنوز تأیید نشده است.','Your email has not been verified.','Deine E-Mail-Adresse wurde noch nicht bestätigt.'],
['حسابی با این ایمیل ثبت نشده است. ایمیل را بررسی کنید یا حساب بسازید.','No account is registered with this email. Check it or create an account.','Für diese E-Mail-Adresse gibt es kein Konto. Prüfe sie oder erstelle ein Konto.'],
['این حساب غیرفعال شده است.','This account has been disabled.','Dieses Konto wurde deaktiviert.'],
['این ایمیل مسدود شده است و امکان ثبت‌نام با آن وجود ندارد.','This email is blocked and cannot be used to register.','Diese E-Mail-Adresse ist gesperrt und kann nicht zur Registrierung verwendet werden.'],
['قبلاً با این ایمیل ثبت‌نام کرده‌اید؛ از بخش ورود استفاده کنید.','An account with this email already exists. Sign in instead.','Mit dieser E-Mail-Adresse besteht bereits ein Konto. Bitte melde dich an.'],
['درخواست‌های زیادی فرستاده شده؛ کمی بعد تلاش کنید.','Too many requests. Try again later.','Zu viele Anfragen. Versuche es später erneut.'],
['کد تأیید اشتباه است.','The verification code is incorrect.','Der Bestätigungscode ist falsch.'],
['زمان کد تمام شده؛ ثبت‌نام را دوباره شروع کنید.','The code has expired. Start registration again.','Der Code ist abgelaufen. Beginne die Registrierung erneut.'],
['رمز انتخابی شرایط لازم را ندارد.','The password does not meet the requirements.','Das Passwort erfüllt die Anforderungen nicht.'],
['درخواست انجام نشد؛ دوباره تلاش کنید.','Request failed. Try again.','Anfrage fehlgeschlagen. Versuche es erneut.'],
['کد و رمز جدید','Code and new password','Code und neues Passwort'],
['کد پنج‌رقمی ایمیل و رمز جدید را وارد کنید.','Enter the five-digit email code and a new password.','Gib den fünfstelligen E-Mail-Code und ein neues Passwort ein.'],
['کد بازیابی به ایمیل ثبت‌شده ارسال شد. پوشه Spam را هم بررسی کنید.','A reset code was sent to your registered email. Check your spam folder too.','Ein Code wurde an deine registrierte E-Mail-Adresse gesendet. Prüfe auch den Spam-Ordner.'],
['کد باید پنج رقم باشد.','The code must have five digits.','Der Code muss fünfstellig sein.'],
['رمز و تکرار آن یکسان نیستند.','The passwords do not match.','Die Passwörter stimmen nicht überein.'],
['رمز باید حداقل ۸ کاراکتر، حرف کوچک و بزرگ انگلیسی و عدد داشته باشد.','Use at least 8 characters with lowercase and uppercase letters and a number.','Verwende mindestens 8 Zeichen mit Groß- und Kleinbuchstaben und einer Zahl.'],
['رمز عبور تغییر کرد. اکنون با رمز جدید وارد شوید.','Password changed. Sign in with your new password.','Passwort geändert. Melde dich mit dem neuen Passwort an.'],
['کد تأیید ارسال شد. پوشه Spam را هم بررسی کنید.','Verification code sent. Check your spam folder too.','Bestätigungscode gesendet. Prüfe auch den Spam-Ordner.']
];
const lookup=new Map();for(const row of rows)for(const value of row)lookup.set(value,row);
let lang=localStorage.getItem(KEY);if(!['fa','en','de'].includes(lang))lang='fa';
const index=()=>({fa:0,en:1,de:2})[lang];
function translateString(value){const row=lookup.get(value);if(row)return row[index()];const match=value.match(/^کد پنج‌رقمی به (.+) ارسال شد\.$/);if(match)return lang==='fa'?value:lang==='en'?`A five-digit code was sent to ${match[1]}.`:`Ein fünfstelliger Code wurde an ${match[1]} gesendet.`;const other=value.match(/^(?:A five-digit code was sent to |Ein fünfstelliger Code wurde an )(.+?)(?:\.| gesendet\.)$/);if(other)return lang==='fa'?`کد پنج‌رقمی به ${other[1]} ارسال شد.`:lang==='en'?`A five-digit code was sent to ${other[1]}.`:`Ein fünfstelliger Code wurde an ${other[1]} gesendet.`;return value}
function apply(){document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';document.querySelectorAll('[data-pwa-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pwaLang===lang)));const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.parentElement?.closest('script,style'))continue;const raw=node.nodeValue,trim=raw.trim();if(!trim)continue;const next=translateString(trim);if(next!==trim)node.nodeValue=raw.replace(trim,next)}document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>{for(const attr of ['placeholder','title','aria-label']){const raw=el.getAttribute(attr);if(raw){const next=translateString(raw);if(next!==raw)el.setAttribute(attr,next)}}})}
const switcher=document.createElement('nav');switcher.className='pwa-language-switcher';switcher.setAttribute('aria-label','Interface language');switcher.innerHTML='<button type="button" data-pwa-lang="fa" lang="fa">فارسی</button><button type="button" data-pwa-lang="en" lang="en">English</button><button type="button" data-pwa-lang="de" lang="de">Deutsch</button>';document.querySelector('.card').prepend(switcher);switcher.addEventListener('click',event=>{const button=event.target.closest('[data-pwa-lang]');if(!button)return;lang=button.dataset.pwaLang;localStorage.setItem(KEY,lang);apply()});
new MutationObserver(()=>apply()).observe(document.body,{subtree:true,childList:true,characterData:true});apply();
})();
