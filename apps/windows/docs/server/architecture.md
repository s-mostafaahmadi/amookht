# معماری سرور و فرانت

## ۱. شکل کلی

```
┌──────────────┐   HTTPS    ┌───────────┐   proxy    ┌──────────────────────┐
│ مرورگر/ویندوز│ ─────────► │  nginx    │ ─────────► │ uvicorn (2 worker)   │
│ (SPA بدون build)          │  :443     │            │ FastAPI app.main     │
└──────────────┘            └───────────┘            └───────┬──────────────┘
                                    │ static                 │ asyncpg / redis
                                    ▼                        ▼
                            /opt/amookht/app          PostgreSQL 16 · Redis
```

- **nginx** فایل‌های استاتیک را از `/opt/amookht/app` سرو می‌کند و `/v1/`، `/coach/api/` و وب‌هوک تلگرام را
  به `127.0.0.1:8200` پروکسی می‌کند. قفل پروژه‌های Tah3in (`/_gate/`) هم همین‌جا اعمال می‌شود.
- **هیچ مرحلهٔ build** برای فرانت وجود ندارد؛ فایل HTML همان چیزی است که مرورگر می‌گیرد. به همین دلیل
  به‌روزرسانی فرانت = جایگزینی فایل + تغییر `?v=` در `<script src>` برای شکستن کش.

## ۲. لایه‌های بک‌اند

```
backend/app/
├── main.py                 # ساخت اپ، ثبت روترها، middleware ها، lifespan
├── config.py               # تنظیمات از .env (pydantic-settings)
├── dependencies.py         # وابستگی‌های مشترک (نشست DB، کاربر، نقش)
├── api/
│   ├── routes/             # ۲۸ روتر (auth, account, sync, writing, speaking, library, …)
│   ├── middleware/         # auth.py (استخراج کاربر)، operations.py (لاگ عملیات)
│   ├── access.py           # require_admin / require_premium / require_owner
│   ├── ai_registry.py      # رجیستری ارائه‌دهنده‌های AI
│   ├── ai_guard.py         # deadline + circuit breaker
│   ├── ai_nvidia.py        # مسیر تاریخی Groq→NVIDIA (بدون تغییر در رفتار)
│   ├── passwords.py        # bcrypt مستقیم (بدون passlib)
│   ├── sync_core.py        # هستهٔ patch-based state sync
│   └── schemas/            # Pydantic models
├── ai_engine/              # engine.py + pipelines/prompts/routers (قرارداد LLMProvider)
├── application/            # use_cases و dto
├── domain/                 # models (SQLAlchemy)، ports، services
├── infrastructure/         # database/, cache/, ai/ (adapters, stt, tts), queue/, telegram/, events/
└── plugins/                # testdaf/ — منطق مخصوص آزمون
```

مرزبندی عملی: **روترها فقط ورودی/خروجی HTTP**؛ منطق در `domain/services` و `application/use_cases`؛
دسترسی بیرونی (LLM، صدا، تلگرام، DB) پشت `domain/ports` تا تست‌ها بتوانند fake بگیرند.

## ۳. جریان یک درخواست (مثال: تصحیح نوشتار)

1. `POST /v1/writing/evaluate` با `Authorization: Bearer <access>`.
2. `middleware/auth.py` توکن را می‌خواند، `current_user` را ست می‌کند (JWT با `SECRET_KEY`، HS256).
3. `api_guard` بررسی می‌کند: کاربر بلاک نشده، سهمیهٔ روزانهٔ AI (`AI_WRITING_DAILY_QUOTA`) و محدودیت نرخ
   (`AI_WRITING_RATE_LIMIT`) در Redis.
4. `ai_guard.deadline()` بودجهٔ زمانی می‌دهد (`AI_WRITING_TIMEOUT_SECONDS`)؛ اگر ارائه‌دهنده down باشد
   پاسخ فوری `503 {"code":"ai_unavailable","retry_after":N}`.
5. `ai_registry.route("writing")` مشخص می‌کند کدام ارائه‌دهنده/کلید؛ در حالت پیش‌فرض همان مسیر تاریخی
   Groq → NVIDIA اجرا می‌شود (`custom_plan() is None`).
6. پاسخ ساخت‌یافته (نمره، خطاها، پیشنهاد) به `errors` کاربر اضافه و در SRS ثبت می‌شود.

## ۴. همگام‌سازی وضعیت (ستون فقرات محصول)

وضعیت یادگیرنده یک سند بزرگ JSON است (`plan`, `history`, `errors`, `testdafMethod`, `ownerDayFiles`, …).
به‌جای فرستادن کل سند، کلاینت **patch در سطح مسیر** می‌فرستد:

```
PATCH /v1/sync/state   { "paths": ["plan", "testdafMethod.days.2026-11-19.picks"], "client_rev": 42 }
```

- سرور هر مسیر را جدا ذخیره می‌کند (`user_state` با rev و timestamp هر مسیر).
- تعارض با `rev`: آخرین نوشتن برنده است، اما کلاینت‌های دیگر با `GET /v1/sync/state?since=` تغییر یافته‌ها را
  می‌گیرند و `onRemote(paths)` را اجرا می‌کنند.
- `sync_core.py` عملیات را اتمیک می‌کند تا دو worker هم‌زمان یک مسیر را خراب نکنند (قفل Redis).
- نتیجه: اپ ویندوز، مرورگر و موبایل هم‌زمان یک وضعیت می‌بینند؛ حتی وسط یک تمرین.

## ۵. پایگاه داده

جداول اصلی (PostgreSQL):

| جدول | نقش |
| --- | --- |
| `users` | حساب، نقش (`normal`/`admin`/`owner`)، پریمیوم، بلاک، سطح، تاریخ آزمون |
| `refresh_tokens` / `sessions` | نشست‌های قابل ابطال |
| `user_state` | وضعیت یادگیرنده به‌صورت مسیر‌به‌مسیر (JSONB) |
| `content_bank` | محتوای تولیدشده (خصوصی/سراسری) با `topic_key`+`skill_key` |
| `owner_session_packs` | پک‌های کامل اجرای برنامه (جدید در ۴.۱.۰) |
| `owner_day_files` | فایل روز مالک (اسنپ‌شات محتوا + پاسخ‌ها) |
| `writing_evaluations`, `speaking_attempts` | نتایج تصحیح و تحلیل گفتار |
| `library_items`, `vocabulary_items` | کتابخانه و واژگان |
| `testdaf_exams` | آزمون‌های ذخیره‌شده |
| `telegram_links` | اتصال حساب به تلگرام |
| `audit_log` / `operations` | ردپای عملیات حساس |

مهاجرت‌ها با Alembic؛ اما برای جدول‌های تازه‌ای مثل `owner_session_packs` یک `ensure_table()` تنبل در
`connection.py` هم وجود دارد تا استقرار بدون migration دستی کار کند.

## ۶. فرانت وب

- یک صفحه = یک فایل HTML بزرگ که CSS/JS ماژولار را با `<script src="...?v=...">` صدا می‌زند.
- `S` (state) در حافظه + `saveData()` که فقط کلیدهای تغییر‌یافته را PATCH می‌کند — همان قرارداد سرور.
- موتور برنامه در `testdaf-method.js` (`window.TDM`) است: تقویم، انتخاب محتوا (`picks`)، ماژول‌ها،
  مراحل هر تمرین، تایمر زمان فعال.
- صفحات کمکی: `free-space.js` (مطالعهٔ آزاد/بازی‌ها)، `grammar-drill.js` (ربات گرامر)، `amk-translate.js`
  (مترجم انتخاب متن)، `amk-struct.js` و `amk-sentparts.js` (تحلیل ساختار جمله)، `coach-bridge.js` (مربی گفتگو).
- تم/زبان/تراکم از `localStorage` + همگام‌سازی بین تب‌ها؛ اپ ویندوز همین کلیدها را می‌خواند تا هم‌شکل بماند.

## ۷. چرا این معماری؟

- **بدون build**: سرور فقط فایل سرو می‌کند؛ استقرار در چند ثانیه و بدون زنجیرهٔ ابزار.
- **patch-based sync**: با ۲۰۰KB وضعیت، فرستادن کل سند در هر تیک تایمر غیرممکن بود.
- **لایه‌بندی نازک**: هر روتر کوچک و مستقل؛ یک باگ در مربی گفتگو بقیهٔ محصول را نمی‌خواباند.
- **همان موتور برای همهٔ کلاینت‌ها**: وب، ویندوز و اندروید یک قرارداد JSON دارند، پس یک باگ یک‌جا اصلاح می‌شود.
