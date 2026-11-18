# معماری اپلیکیشن ویندوز

## ۱. چیدمان پروژه

```
amookht-windows/
├── electron/
│   ├── main.js              # ~۱۷۰۰ خط: پنجره‌ها، پروتکل amookht://، IPC (۴۴ handler)، سینی،
│   │                        #   webview سایت امن، تزریق نشست، هدر قفل، به‌روزرسانی خودکار، منوی راست‌کلیک
│   ├── preload-app.js       # پل قاب (contextBridge)
│   ├── preload-site.js      # تزریق نشست به سایت + پل پیام‌ها
│   ├── preload-widget.js    # پل ویجت رومیزی
│   └── preload-settings.js  # پل پنجرهٔ تنظیمات
├── src/
│   ├── app.html|css|js      # قاب ویندوزی (وقتی موتور «سایت» فعال است)
│   ├── widget.*             # ویجت کارها/یادداشت‌ها
│   ├── settings.*           # تنظیمات ویندوز
│   ├── vendor/              # کتابخانه‌های محلی (pdf.js…)
│   └── native/              # ★ موتور بومی
│       ├── index.html, main.js, native.css
│       ├── core/            # engine, learning, work, review, oesd, store, site-shim, owner-files, owner-packs
│       ├── pages/           # dashboard, errorbook, library, testdaf-sim, history, admin, …
│       ├── tools/           # tutor, translate, struct, sentparts, mediakeys, tabnext, owner-chat, ai-admin
│       └── data/            # method-static.js (متن‌های ثابت روش)، topics.js
├── test/                    # اسکریپت‌های Electron/node برای تست
├── build/                   # icon.ico / icon.png
├── docs/                    # نقشهٔ بازنویسی بومی
└── package.json             # electron-builder config + scripts
```

## ۲. فرآیند اصلی (`electron/main.js`)

- **پنجرهٔ اصلی**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
  در حالت بومی `amookht://app/native/index.html` و در حالت سایت `src/app.html` بار می‌شود.
- **پروتکل سفارشی `amookht://`**: با `protocol.registerSchemesAsPrivileged` + `protocol.handle` فایل‌های
  داخلی را از دیسک سرو می‌کند؛ بنابراین موتور بومی یک origin امن و پایدار دارد (بدون `file://`).
- **webview سایت**: همهٔ درخواست‌های آن به سایت واقعی می‌رود؛ preload قبل از بارگذاری نشست را تزریق می‌کند
  و هدر `X-Amookht-App-Token` را برای قفل `/_gate/` می‌فرستد.
- **سینی سیستم**: نمایش/پنهان، ویجت، خروج؛ `--hidden` یعنی فقط سینی.
- **ویجت رومیزی**: پنجرهٔ بدون قاب، همیشه‌رو (اختیاری)، اندازه‌اش ذخیره می‌شود؛ داده از `/v1/widget/data`.
- **به‌روزرسانی**: `electron-updater` با feed عمومی `https://learn.tah3in.com/downloads/` و کانال `latest`.
  `autoDownload=true`, `autoInstallOnAppQuit=true`, `allowDowngrade=false`؛ وضعیت به UI با IPC می‌رود.
- **امنیت دادهٔ محلی**: `%APPDATA%\Amookht\state.json`؛ هر مقدار حساس با `safeStorage.encryptString`
  به `enc:<base64>` تبدیل می‌شود و فقط با همان کاربر ویندوز قابل رمزگشایی است.

## ۳. موتور بومی (`src/native`)

هدف: همان رفتار سایت، بدون webview. اصول:

1. **پورت ۱:۱**: هر تابع سایت (مثل `TDM.dayFileSnapshot`) با همان نام و همان خروجی در `core/` بازنویسی شده
   تا اپ و سایت **یک داده** بنویسند. کامنت بالای هر فایل می‌گوید از کدام فایل سایت آمده است.
2. **وضعیت واحد**: `core/engine.js` نسخهٔ زندهٔ `S` را نگه می‌دارد و هر کلید تغییر‌یافته را با
   `store.set(key, value)` به سرور PATCH می‌کند (همان قرارداد `saveData`).
3. **ری‌اکتیو دستی**: صفحه‌ها `draw()` دارند؛ `engine.subscribe()` برای تیک تایمر و تغییرات از دستگاه دیگر
   (`onRemote`) صفحه را تازه می‌کند.
4. **ابزارهای شناور**: `tools/*.js` همان اسکریپت‌های سایت‌اند که با `core/site-shim.js` (یک شبیه‌ساز `S`,
   `apiRequest`, `render`, `TDM`) تغذیه می‌شوند — بدون تغییر منطق.

| فایل | نقش |
| --- | --- |
| `core/engine.js` | تقویم، زمان روزانه، سطح، `picks`، فعالیت‌ها، مراحل، تایمر، چرخهٔ روز، `renewDay`، ÖSD |
| `core/learning.js` | SRS، اشتباهات، تاریخ‌ها، توابع خالص مشترک |
| `core/work.js` | پاسخ‌دهی، درست‌سنجی، برچسب پاسخ، آماده‌سازی سؤال |
| `core/review.js` | مرور و آزمون خود |
| `core/oesd.js` | پروفایل ÖSD (سطح B2/C1، بازنویسی متن‌ها) |
| `core/store.js` | کش محلی + صف PATCH + همگام‌سازی + وضعیت اتصال |
| `core/owner-files.js` | فایل روز مالک: اسنپ‌شات محتوا/پاسخ + نمایش |
| `core/owner-packs.js` | **جدید در ۴.۱.۰**: پک‌های کامل ذخیره‌شده روی سرور |
| `core/site-shim.js` | سازگاری ابزارهای سایت با موتور بومی |
| `core/content.js` | بارگذاری پک‌های محتوا (JSON) |
| `core/i18n.js` | سه‌زبانه: فارسی/انگلیسی/آلمانی |

## ۴. جریان داده

```
UI (pages/*)  ──click──►  engine (S)  ──save()──►  store  ──PATCH /v1/sync/state──►  PostgreSQL
     ▲                        │                      │
     └──── draw() ────────────┘                      └── GET /v1/sync/state?since=rev ──► onRemote
```

- هر تغییر محلی فوراً در حافظه اعمال و پس‌فرست می‌شود؛ اگر شبکه نبود، صف می‌ماند و بعداً ارسال می‌شود.
- تغییر از دستگاه دیگر (`onRemote(paths)`) فقط کلیدهایی را جایگزین می‌کند که ویرایش محلی در انتظار ندارند
  (همان قانون «آخرین نوشتن برنده با احترام به ویرایش در جریان»).

## ۵. هم‌شکلی با سایت

تم تیره/روشن، رنگ اصلی (۵ رنگ)، زبان و «سایدبار فشرده» هم از سایت و هم از قاب تغییر می‌کنند و همه‌جا یکی
می‌مانند، چون هر دو روی همان کلیدهای `appSettings` در وضعیت حساب کار می‌کنند.

## ۶. محدودیت‌های شناخته‌شده

- صفحه‌هایی که هنوز بومی نشده‌اند (`milestone` در `pages/registry.js`) با دکمهٔ «باز کردن در نسخهٔ سایت» به webview می‌روند.
- PDF و annotation در حالت بومی از `src/vendor/pdfjs` استفاده می‌کند؛ فایل‌های خیلی بزرگ کندتر از سایت باز می‌شوند.
- به‌روزرسانی خودکار به دسترسی به `learn.tah3in.com/downloads/latest.yml` وابسته است.
