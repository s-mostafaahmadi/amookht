# ساخت، انتشار و به‌روزرسانی اپلیکیشن ویندوز

## ۱. پیش‌نیازها

| ابزار | نسخه | کاربرد |
| --- | --- | --- |
| Node.js | 20 LTS | اجرای Electron و اسکریپت‌ها |
| npm | 10 | نصب وابستگی‌ها |
| Electron | 32.3.3 | رانتایم (در `devDependencies`) |
| electron-builder | 25.1.8 | بسته‌بندی و ساخت NSIS |
| electron-updater | 6.3.9 | به‌روزرسانی خودکار (وابستگی رانتایم) |
| Windows | 10/11 x64 | سیستم هدف ساخت |
| (اختیاری) گواهی کد امضا | EV/OV | حذف هشدار SmartScreen |

نصب و ساخت:

```powershell
cd amookht-windows
npm install
npm start            # اجرای برنامه در حالت توسعه
npm run pack         # ساخت پوشهٔ اجرایی بدون نصب‌کننده (dist/win-unpacked)
npm run dist         # ساخت نصب‌کننده → dist/Amookht-Setup-4.1.0.exe
```

## ۲. پیکربندی بسته‌بندی (`package.json → build`)

```json
{
  "appId": "com.amookht.widget",
  "productName": "Amookht",
  "directories": { "output": "dist", "buildResources": "build" },
  "files": ["electron/**/*", "src/**/*", "build/icon.ico", "package.json"],
  "win": { "target": [{ "target": "nsis", "arch": ["x64"] }], "artifactName": "Amookht-Setup-${version}.exe" },
  "nsis": {
    "oneClick": false, "perMachine": false, "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true, "createStartMenuShortcut": true, "runAfterFinish": true,
    "deleteAppDataOnUninstall": false
  },
  "publish": [{ "provider": "generic", "url": "https://learn.tah3in.com/downloads/", "channel": "latest" }]
}
```

نکات مهم:

- `perMachine: false` ⇒ نصب برای کاربر جاری، **بدون نیاز به UAC**، در `%LOCALAPPDATA%\Programs\Amookht`.
- `deleteAppDataOnUninstall: false` ⇒ تنظیمات و نشست کاربر با حذف برنامه پاک نمی‌شود.
- خروجی‌های هر ساخت: `Amookht-Setup-<ver>.exe`، `Amookht-Setup-<ver>.exe.blockmap`، `latest.yml`.

## ۳. امضای کد

بدون گواهی، electron-builder مرحلهٔ امضا را رد می‌کند (`signing is skipped`) و ویندوز ممکن است
هشدار «Windows protected your PC» بدهد. برای امضا:

```powershell
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=••••
npm run dist
```

## ۴. انتشار یک نسخه

1. `version` در `package.json` را بالا ببرید (SemVer: تغییر رفتاری = minor).
2. `npm run dist`.
3. سه فایل خروجی را در سرور بگذارید:
   ```
   /opt/amookht/app/downloads/Amookht-Setup-4.1.0.exe
   /opt/amookht/app/downloads/Amookht-Setup-4.1.0.exe.blockmap
   /opt/amookht/app/downloads/latest.yml      ← نام فایل ثابت، محتوای نسخهٔ آخر
   ```
4. اپ‌های نصب‌شده در چند ساعت آینده (یا با «بررسی به‌روزرسانی» در تنظیمات) نسخهٔ تازه را دانلود می‌کنند.

نمونهٔ `latest.yml`:

```yaml
version: 4.1.0
files:
  - url: Amookht-Setup-4.1.0.exe
    sha512: <hash>
    size: <bytes>
path: Amookht-Setup-4.1.0.exe
sha512: <hash>
releaseDate: '2026-11-19T00:00:00.000Z'
```

## ۵. مکانیزم به‌روزرسانی خودکار

`electron/main.js`:

```js
const { autoUpdater } = require('electron-updater');
if (process.env.AMOOKHT_UPDATE_URL) autoUpdater.setFeedURL({ provider: 'generic', url: process.env.AMOOKHT_UPDATE_URL });
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;
```

- وضعیت‌ها (`checking`, `downloading` + درصد, `downloaded`, `latest`, `error`) از طریق IPC به UI می‌رود.
- نصب با `quitAndInstall(true, true)` (بی‌صدا، با ری‌استارت).
- اگر `latest.yml` نبود یا شبکه قطع بود، برنامه عادی کار می‌کند؛ خطا فقط در تنظیمات نمایش داده می‌شود.
- برای تست محلی: `AMOOKHT_UPDATE_URL=http://localhost:8000/` و یک پوشهٔ ساده با فایل‌های بالا.

## ۶. نصب دستی/به‌روزرسانی بدون نصب‌کننده

اگر دسترسی به نصب‌کننده نبود (یا نصب قبلی per-machine بود و UAC در دسترس نیست):

```powershell
# 1) بستن نمونهٔ در حال اجرا
Get-Process Amookht -ErrorAction SilentlyContinue | Stop-Process -Force
# 2) جایگزینی پوشهٔ اجرا
$dest = "$env:LOCALAPPDATA\Programs\Amookht"
Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item .\dist\win-unpacked $dest -Recurse
# 3) اجرای خودکار در شروع ویندوز
Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'electron.app.Amookht' `
  -Value "`"$dest\Amookht.exe`" --hidden"
```

این همان روشی است که برای به‌روزرسانی دستگاه‌های موجود استفاده شده است.

## ۷. اجرای خودکار در شروع ویندوز

- نصب‌کننده NSIS کلید `HKCU\...\Run\electron.app.Amookht` را با `--hidden` می‌سازد (فقط سینی و ویجت).
- برای دستگاه‌هایی که با کپی دستی نصب شده‌اند، همان کلید دستی ست می‌شود (دستور بالا).
- بررسی: `(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run').'electron.app.Amookht'`.

## ۸. چک‌لیست انتشار

- [ ] `npm test` (smoke قاب) و `npm run test:widget` و `npm run test:settings` سبز
- [ ] نسخه در `package.json` و در `docs/windows/changelog.md` ثبت شده
- [ ] ساخت تازه با `npm run dist` بدون خطا (خروجی `EXIT=0`)
- [ ] نصب روی یک دستگاه تمیز و ورود موفق
- [ ] `latest.yml` روی سرور به‌روز شده و SHA درست است
- [ ] کلیدهای `Run` و میان‌برها در دستگاه نصب‌شده بررسی شده
