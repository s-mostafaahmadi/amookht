# قابلیت «افزودن دستی محتوا» (نسخهٔ ۴.۱.۰)

مالک می‌تواند هر پک کاملِ اجرای برنامه را روی سرور نگه دارد و بعداً با یک کلیک همان محتوا را در اجرای
برنامهٔ امروز بارگذاری کند. این قابلیت هم در وب و هم در اپ ویندوز وجود دارد و **فقط برای حساب مالک** فعال است.

## ۱. چه چیزی ذخیره می‌شود

هر پک، یک اسنپ‌شات کامل از یک روز است:

```json
{
  "schema": 1,
  "kind": "method",
  "reason": "manual-renew",
  "source_date": "2026-11-19",
  "created_at": "2026-11-19T21:19:30Z",
  "user": { "level": "B2", "topic": "", "exam_plan": "testdaf", "ui_language": "fa" },
  "plan": { "activities": ["..."], "totalMinutes": 240, "availableMinutes": 240, "examType": "testdaf", "examName": "TestDaF" },
  "tdm": { "mode": "normal", "level": "B2", "picks": { "hoeren": "h12", "lesen": "l8", "schreiben": {"kind":"grafik","id":"g3"}, "sprechen": ["s1","s4"], "spBase": "..." }, "redemittel": ["..."] },
  "day_file": { "modules": [ { "id": "hoeren", "de": "Hören", "title": "...", "audio": "/assets/method-audio/H11.mp3", "questions": [ { "q": "...", "user": "...", "correct": "...", "ok": true } ], "transcript": "..." } ] },
  "audio": [ { "module": "hoeren", "title": "...", "src": "/assets/method-audio/H11.mp3" } ],
  "resources": null
}
```

این همان فرمت «معین» است که فایل روز مالک (`ownerDayFiles`) هم با آن ساخته می‌شود — `TDM.dayFileSnapshot(date)`.
یک قرارداد، دو مصرف: نمایش محتوا و بازسازی اجرا.

## ۲. کجا ذخیره می‌شود

- **سرور**: جدول `owner_session_packs` (PostgreSQL) با ستون‌های
  `id, owner_id, label, reason, source_date, payload JSONB, size_bytes, created_at`.
- **API**: `/v1/owner-packs` — `POST` (ثبت)، `GET` (فهرست خلاصه)، `GET /{id}` (payload کامل)، `DELETE /{id}`.
- **گارد**: `require_owner` روی همهٔ مسیرها؛ تست شده: بدون توکن `401`، حساب عادی `403`، مالک `200`.
- **سقف‌ها**: ۴ مگابایت برای هر پک، نگهداری ۳۰۰ پک، حذف خودکار قدیمی‌ترها.
- **جدول تنبل**: اگر جدول نبود، `ensure_table()` آن را در اولین درخواست می‌سازد (بدون migration دستی).

## ۳. چه زمانی خودکار ثبت می‌شود

| رویداد | `reason` |
| --- | --- |
| دکمهٔ «ثبت نتیجه و تمرین تازه» | `manual-renew` |
| پایان روز / شروع روز جدید (rollover) | `day-end` / `new-day` |

در وب: هوک داخل `renewDailyExercises` و `archiveCurrentPlan`.
در ویندوز: هوک `onDayFile` موتور بومی — همان جایی که فایل روز ثبت می‌شود، پک هم ثبت می‌شود.
اگر ثبت پک شکست بخورد (شبکه/سرور)، تمرین روز **متوقف نمی‌شود**؛ خطا فقط در کنسول لاگ می‌شود.

## ۴. بارگذاری یک پک

1. کاربر مالک روی «افزودن دستی محتوا» می‌زند.
2. فهرست پک‌ها از `GET /v1/owner-packs` می‌آید: برچسب، تاریخ، دلیل، دسته‌ها، تعداد سؤال، تعداد صوت، حجم، زمان ثبت.
3. با انتخاب یک پک و تأیید:
   - `GET /v1/owner-packs/{id}` → `payload`
   - `picks` و `mode`/`level`/`redemittel` در روز **امروز** تزریق می‌شوند
   - `S.plan` با تاریخ امروز و همان فعالیت‌ها بازنویسی می‌شود (`dataSource: 'owner-pack'`)
   - `work`, `results`, `completed`, `activityTimers` خالی می‌شوند تا اجرا از صفر باشد
   - صفحه به اجرای برنامه برمی‌گردد و محتوا نمایش داده می‌شود
4. حذف پک: دکمهٔ سطل زباله + تأیید → `DELETE`.

## ۵. پیاده‌سازی

### وب (`testdaf-daily-plan.html`)
`ownerPackSnapshot`, `ownerPackLabel`, `saveSessionPack`, `openOwnerPacks`, `loadOwnerPacks`,
`renderOwnerPacks`, `loadOwnerPack`, `applyOwnerPack`, `deleteOwnerPack` — با `S.screen = 'ownerPacks'`
و کارت‌های ساده. دکمه در کارت «اتمام تمرین و ثبت نتیجه»، فقط اگر `isOwnerAccount()`.

### ویندوز (`src/native/core/owner-packs.js`)
```js
const ownerPacks = createOwnerPacks({ store, engine: () => getEngine(), account: () => app.account,
                                      api: (path, opts) => bridge.api(path, opts) });
// ctx.ownerPacks → صفحهٔ dashboard
```
- `snapshot(reason)` / `label()` / `save(reason)` — همان اسنپ‌شات وب روی موتور بومی
- `list(force)` با کش درون‌جلسه‌ای، `remove(id)`, `load(id)` → `applyPayload`
- `applyPayload` مستقیم روی `eng.S` کار می‌کند (بدون بازسازی صفحه) و `eng.save()` را صدا می‌زند
- رابط کاربری داخل صفحهٔ «اجرای برنامه»: `ui.view = 'packs'` + دکمهٔ مالک در کارت پایان تمرین
- همهٔ متن‌ها سه‌زبانه (fa/en/de) و با `esc()` امن‌سازی می‌شوند

## ۶. تست انجام‌شده

| چک | نتیجه |
| --- | --- |
| `node --check` روی سه فایل تغییر‌یافته | OK |
| `py_compile` روی روتر و `main.py` | OK |
| `GET /v1/owner-packs` بدون توکن | `401` |
| ثبت واقعی از مرورگر مالک | پک ۸۶٩۵۶ بایتی، ۶ ماژول، ۲۰ سؤال، صوت H11 |
| `GET` فهرست و جزئیات | دسته‌های شش‌گانه، `picks` و `plan` کامل |
| حساب غیرمالک | `403` |
| ساخت اپ ویندوز + نصب + اجرای واقعی | موفق (app.asar شامل کد پک‌ها) |

## ۷. محدودیت‌ها

- بارگذاری پک، پیشرفت امروز را **جایگزین** می‌کند (با تأیید صریح کاربر).
- پک فقط «محتوا» را برمی‌گرداند، نه پاسخ‌های قدیمی؛ عمداً از صفر شروع می‌شود.
- فهرست پک‌ها در اپ کش می‌شود تا وقتی «به‌روزرسانی» زده نشود.
