# امنیت و تست‌های اپلیکیشن ویندوز

## ۱. تدابیر امنیتی

| لایه | تدبیر |
| --- | --- |
| فرآیند رندر | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true` — در پنجرهٔ اصلی و همهٔ webview ها |
| پل‌ها | فقط `contextBridge.exposeInMainWorld` با توابع صریح؛ هیچ `ipcRenderer` خام به صفحه داده نمی‌شود |
| پروتکل داخلی | `amookht://` ثبت‌شده به‌صورت privileged و مسیرها نرمال‌سازی می‌شوند تا از ریشهٔ برنامه خارج نشوند |
| ذخیرهٔ توکن | `safeStorage.encryptString` (DPAPI ویندوز)؛ فایل `state.json` بدون کلید کاربر قابل خواندن نیست |
| نشست سایت | preload نشست را تزریق می‌کند؛ توکن در URL یا لاگ چاپ نمی‌شود |
| قفل سرور (`/_gate`) | هدر `X-Amookht-App-Token` فقط برای origin مجاز ارسال می‌شود؛ بررسی نهایی روی سرور است |
| لینک‌های بیرونی | همه با `shell.openExternal` و اعتبارسنجی پروتکل (فقط http/https) باز می‌شوند |
| محتوای نمایشی | همهٔ رشته‌های دادهٔ کاربر/سرور با `esc()` امن می‌شوند (بدون `innerHTML` خام) |
| به‌روزرسانی | فقط از feed ثابت HTTPS با `allowDowngrade = false` |
| حداقل دسترسی | نصب per-user؛ هیچ سرویس ویندوزی یا درایوری نصب نمی‌شود |

## ۲. تست‌های موجود

```powershell
npx electron test/app-smoke.js        # قاب: ورود، نوار کناری، هماهنگی با سایت، Ctrl+K، جمع شدن خودکار
npx electron test/smoke.js            # ویجت: لیست، افزودن/تیک/حذف، یادداشت، تغییر اندازه
npx electron test/settings-smoke.js   # پنجرهٔ تنظیمات
npx electron test/app-boot.js --user-data-dir="%TEMP%/amk-boot-test"   # main process، منو، ویجت
node test/store-test.mjs              # store: کش، صف PATCH، همگام‌سازی
node test/engine-parity.mjs           # موتور بومی ↔ سایت: برابری خروجی‌ها
node test/work-parity.mjs             # پاسخ‌دهی/درست‌سنجی
npx electron test/live-check.js --user-data-dir="<کپی %APPDATA%\Amookht>"   # روی سایت واقعی با حساب
```

تست‌های ماژول‌محور (`test/native-*.js`): account، coach، dashboard، free، hoeren-lesen، library، oesd،
owner-check، owner-write، pages، review، schreiben-sprechen، sim، tools، write.

### تست برابری موتور (مهم‌ترین تست)

`engine-parity.mjs` و `work-parity.mjs` همان ورودی‌ها را به موتور سایت (`testdaf-method.js`) و موتور بومی
می‌دهند و خروجی‌ها را مقایسه می‌کنند. هر تغییر در `core/engine.js` باید این دو را سبز نگه دارد؛ در غیر این
صورت اپ و وب داده‌های متفاوت تولید می‌کنند.

## ۳. چک‌های دستی انتشار ۴.۱.۰

| چک | نتیجه |
| --- | --- |
| `node --check` روی `core/owner-packs.js`، `main.js`، `pages/dashboard.js` | OK |
| `npm run dist` | OK (`EXIT=0`، خروجی `dist/Amookht-Setup-4.1.0.exe`) |
| بررسی حضور کد پک‌ها در `resources/app.asar` | ۱۲ اشاره به `owner-packs` |
| نصب/جایگزینی روی دستگاه و اجرای `--hidden` | فرآیند بالا آمد و پایدار ماند |
| کلید `Run` و میان‌بر Start Menu | به مسیر نسخهٔ تازه اشاره می‌کنند |
| تست بصری صفحهٔ «افزودن دستی محتوا» با ورود مالک | اجرا نشده (نیازمند رمز حساب مالک) |

## ۴. باگ‌های واقعی و رفع‌ها

| # | مشکل | ریشه | راه‌حل |
| --- | --- | --- | --- |
| ۱ | پس از ری‌استارت سرور، اپ خروج حساب می‌داد | ۴۰۱ موقت به‌عنوان «نشست نامعتبر» تفسیر می‌شد | تلاش دوباره با refresh؛ پاک‌کردن نشست فقط با ۴۰۱ تأییدشدهٔ refresh |
| ۲ | نسخهٔ نصب‌شدهٔ per-machine قابل به‌روزرسانی بدون UAC نبود | نصب در `Program Files` | نصب per-user در `%LOCALAPPDATA%\Programs\Amookht` و بازنویسی کلید `Run` |
| ۳ | نصب‌کنندهٔ خاموش (`/S`) بی‌صدا رد می‌شد | درخواست ارتقا برای حذف نسخهٔ per-machine | جایگزینی پوشهٔ اجرا با کپی `win-unpacked` (روش مستندشده) |
| ۴ | ویجت روی صفحهٔ دوم ظاهر می‌شد | موقعیت پیش‌فرض ذخیره‌شده | بازگشت به صفحهٔ اصلی با `screen.getPrimaryDisplay()` |
| ۵ | پنجره پس از به‌روزرسانی بزرگی/موقعیتش عوض می‌شد | state قدیمی | نگه‌داشتن اندازه و بررسی محدودهٔ صفحه پیش از بازگردانی |
| ۶ | ابزارهای سایت در موتور بومی خطا می‌دادند | نبود `S`/`apiRequest` سایت | `core/site-shim.js` به‌عنوان سازگارکننده |
| ۷ | فایل روز مالک با اپ و سایت متفاوت بود | تفاوت کوچک در برچسب پاسخ | پورت ۱:۱ و تست `owner-write` |

## ۵. محدودیت‌ها

- امضای کد گواهی ندارد؛ SmartScreen ممکن است هشدار بدهد.
- اپ فقط x64 است (بدون نسخهٔ arm64).
- وابستگی به شبکهٔ `learn.tah3in.com` دارد؛ در حالت آفلاین فقط دادهٔ کش‌شده دیده می‌شود.
