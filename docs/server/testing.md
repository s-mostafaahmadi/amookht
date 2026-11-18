# تست‌ها، مشکلات واقعی و راه‌حل‌ها

## ۱. ساختار تست‌ها

```
backend/tests/
├── unit/                          # ۱۶ مجموعهٔ pytest (بدون شبکه، fake DB/LLM)
│   ├── test_auth_registration.py
│   ├── test_auth_recovery.py
│   ├── test_auth_google.py
│   ├── test_admin_block.py
│   ├── test_ai_registry.py         # رجیستری، رمزنگاری کلید، SSRF
│   ├── test_ai_fallback.py         # deadline، circuit breaker، 503
│   ├── test_language_coach.py
│   ├── test_owner_ai_chat.py
│   ├── test_spaced_repetition.py   # SRS چهارسطحی
│   ├── test_error_memory.py
│   ├── test_skill_assessment.py
│   ├── test_sentence_parts.py
│   ├── test_state_sync.py          # patch-based sync + تعارض rev
│   ├── test_testdaf_exams.py
│   ├── test_active_time.py
│   └── run_testdaf_exam_checks.py  # چک سناریویی آزمون
├── integration/                    # تست‌های نیازمند DB/Redis واقعی
└── fixtures/
```

اجرا:

```bash
cd /opt/amookht/app/backend
PYTHONPATH=/opt/amookht/app/backend /opt/amookht/backend-venv/bin/python -m pytest tests/unit -q
```

> نکتهٔ عملی: بدون `PYTHONPATH` پایتون ماژول `app.config` اشتباهی را ایمپورت می‌کند و به خطای
> `InvalidPasswordError` می‌خورد؛ این خطا همیشه به معنی اشتباه بودن پسورد نیست.

## ۲. چک‌های دستی رایج (smoke)

```bash
systemctl is-active amookht-backend
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8200/v1/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8200/v1/owner-packs      # انتظار: 401
node --check /tmp/inline.js                                                        # سینتکس JS صفحه
python -m py_compile app/api/routes/owner_packs.py app/main.py                     # سینتکس پایتون
journalctl -u amookht-backend -n 50 --no-pager
```

## ۳. مشکلات واقعی و راه‌حل‌ها

| # | مشکل | ریشه | راه‌حل |
| --- | --- | --- | --- |
| ۱ | صف طولانی و «هیچ اتفاقی نمی‌افتد» در تصحیح نوشتار | یک ارائه‌دهندهٔ کند/محدود، کل درخواست را معطل می‌کرد | `ai_guard`: بودجهٔ زمانی، تلاش روی کلید بعدی، circuit breaker با پاسخ فوری ۵۰۳ |
| ۲ | هزینهٔ AI با زدن دوبارهٔ دکمه | هر کلیک یک درخواست کامل | سهمیهٔ روزانه + `lease` ضد تکرار + سقف طول ورودی |
| ۳ | دو worker، وضعیت ناهماهنگ circuit breaker | state در حافظه | انتقال state به Redis با fallback محلی |
| ۴ | از دست رفتن پیشرفت وسط تمرین | فرستادن کل سند ۲۰۰KB در هر تیک | sync در سطح مسیر (`PATCH paths[]`) + rev برای هر مسیر |
| ۵ | سؤال تکراری در چند روز | انتخاب تصادفی ساده | مجموعهٔ `used` + تا ۱۲ بار انتخاب مجدد + فیلتر سطح/فاز |
| ۶ | نمایش پاسخ‌های دیروز روی تمرین تازه | `work/results` پاک نمی‌شد | پاک‌سازی صریح `day.work` و `day.results` در چرخهٔ تازه‌سازی |
| ۷ | پس از ری‌استارت سرور، اپ‌ها از حساب خارج می‌شدند | توکن موقتاً نامعتبر و کلاینت آن را «خروج» می‌فهمید | در اپ ویندوز: تشخیص «توکن موقتاً رد شد» و تلاش دوباره، نه پاک‌کردن نشست |
| ۸ | فایل‌های HTML قدیمی در مرورگر | کش `?v=` | نسخه‌گذاری هر script/css در استقرار (الزام چک‌لیست) |
| ۹ | خطای `InvalidPasswordError` در اسکریپت‌های نگهداری | `PYTHONPATH` نادرست → `.env` اشتباه | اجرای اسکریپت با `PYTHONPATH=/opt/amookht/app/backend` و venv سرور |
| ۱۰ | `runtime schema check skipped: DBAPIError` در استارت | بررسی خودکار schema برای جدول‌های قدیمی | بی‌خطر؛ جدول‌های تازه با `ensure_table()` تنبل ساخته می‌شوند |
| ۱۱ | تلاش برای نصب/به‌روزرسانی بدون دسترسی روت | ابزارهای اجرا اجازهٔ `sudo` نمی‌دهند | استفاده از `curl`/`psql` مجاز و اسکریپت پایتون با venv سرور |
| ۱۲ | پک‌های بزرگ (صوت) در DB | بدون سقف | سقف ۴MB برای هر پک، ۳۰۰ پک، و حذف خودکار قدیمی‌ها |

## ۴. الگوی رگرسیون برای قابلیت‌های مالک

هر قابلیت فقط-مالک باید این چهار چک را داشته باشد:

1. بدون توکن → `401`
2. با حساب عادی → `403`
3. با حساب مالک → `200` و شکل پاسخ درست
4. عملیات نوشتن با Origin بیگانه → `403` (بررسی same-origin در mutation ها)

برای پک‌های محتوا در ۴.۱.۰ همین چهار مورد اجرا شد و هر چهار مورد درست بود.

## ۵. تست پذیرش نسخهٔ ۴.۱.۰ (پک‌ها)

- ثبت واقعی از مرورگر مالک: `86956` بایت، ۶ اکتیویتی، ۶ ماژول، ۲۰ سؤال، صوت `H11.mp3` ✔
- `GET /v1/owner-packs` → یک پک با شش دستهٔ کامل ✔
- `GET /v1/owner-packs/{id}` → کلیدهای `payload` کامل (`plan`, `tdm`, `day_file`, `audio`, `resources`) ✔
- کاربر غیرمالک → `403` ✔
- بارگذاری پک در اجرای برنامه → `S.plan` با تاریخ امروز و `picks` تزریق‌شده ✔
