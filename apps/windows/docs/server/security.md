# امنیت

اصل حاکم: **هیچ تصمیم امنیتی به کلاینت واگذار نمی‌شود.** هر چیز حساس (نقش، مالکیت، سهمیه، مسیر فایل) روی
سرور تعیین می‌شود؛ فرانت فقط همان را نمایش می‌دهد.

## ۱. احراز هویت و نشست

| موضوع | پیاده‌سازی |
| --- | --- |
| رمز عبور | `bcrypt` مستقیم در `app/api/passwords.py` (بدون passlib)، هزینهٔ پیش‌فرض کتابخانه |
| توکن دسترسی | JWT HS256 با `SECRET_KEY`، عمر کوتاه، در هدر `Authorization: Bearer` |
| توکن تازه‌سازی | در DB با هش ذخیره می‌شود، قابل ابطال، چرخش در هر refresh |
| خروج | `POST /v1/auth/logout` رکورد refresh را باطل می‌کند؛ توکن دزدیده‌شده بی‌اثر می‌شود |
| دستگاه قابل اعتماد | `TRUSTED_DEVICE_TOKEN` + `TRUSTED_DEVICE_OWNER_EMAIL` برای دستگاه مالک |
| Google SSO | `GOOGLE_CLIENT_ID` و مسیر `en-sso.html`؛ تطبیق `sub` گوگل با حساب موجود |
| بازیابی رمز | ایمیل با توکن یک‌بارمصرف (`EMAIL_VERIFICATION_TTL_SECONDS`)، SMTP پیکربندی‌شده |

نقش‌ها سه‌لایه‌اند: `normal` (یادگیرنده) → `admin` (مدیریت کاربران/محتوا) → `owner` (همه‌چیز + AI + پک‌ها).
`api/access.py` سه گارد دارد: `require_admin`, `require_premium`, `require_owner`.
مالک در فرانت هم با `isOwnerAccount()` (نقش `owner` **و** ایمیل `tah3in@gmail.com`) شناخته می‌شود — ولی
گارد واقعی همان سرور است؛ اگر کسی فرانت را دست‌کاری کند، پاسخ ۴۰۳ می‌گیرد.

## ۲. محدودیت نرخ و ضد سوءاستفاده

همه در `middleware` + Redis، قابل تنظیم با `.env`:

```
ABUSE_PROTECTION_ENABLED=true
TRUST_PROXY_CLIENT_IP=true            # IP واقعی از X-Forwarded-For پشت nginx
AUTH_LOGIN_RATE_LIMIT / AUTH_LOGIN_SOURCE_RATE_LIMIT
AUTH_REGISTER_RATE_LIMIT / AUTH_REFRESH_RATE_LIMIT
AI_WRITING_RATE_LIMIT / AI_WRITING_DAILY_QUOTA
```

- **دو محور شمارش**: per-user و per-source-IP؛ حملهٔ توزیع‌شده روی یک حساب و حملهٔ تک‌IP روی چند حساب هر دو مهار می‌شوند.
- **هزینهٔ AI**: سهمیهٔ روزانه + lease ضد تکرار + سقف طول ورودی + deadline.
- **بلوک حساب**: `require_admin` و middleware وضعیت `blocked` را قبل از هر کار بررسی می‌کنند.

## ۳. رمزنگاری داده

- **کلیدهای AI**: `Fernet` با کلید مشتق‌شده از `SECRET_KEY`؛ فایل `backend/data/ai_providers.json` با ۰۶۴۰.
  کلید خام هرگز از API بیرون نمی‌رود (`ai_registry` فقط `has_key: true/false` می‌دهد).
- **کلیدهای محیطی**: `.env` با مالکیت `root:amookht` و مود `640`؛ سرویس با کاربر `amookht` می‌خواند.
- **فایل‌های کاربر**: `FILE_STORAGE_PATH` بیرون از ریشهٔ وب؛ نام فایل تولیدشده توسط سرور و مسیر ورودی
  کلاینت هرگز مستقیم استفاده نمی‌شود (جلوگیری از path traversal).
- **توکن‌های دستگاه**: در اپ ویندوز با `safeStorage` ویندوز رمز می‌شوند (نگاه کنید به مستندات ویندوز).

## ۴. محافظت SSRF در رجیستری AI

آدرس ارائه‌دهنده با `ipaddress` و resolve واقعی بررسی می‌شود:

- همیشه رد: `169.254.0.0/16` (metadata ابری)، link-local، multicast، reserved، `0.0.0.0/8`.
- فقط با پرچم `allow_local`: `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16` (برای Ollama/LM Studio محلی).
- redirect دنبال نمی‌شود و پاسخ با محدودیت حجم خوانده می‌شود.

## ۵. سخت‌سازی سرویس (systemd)

```
User=amookht  Group=amookht  UMask=0027
NoNewPrivileges=true   PrivateTmp=true   PrivateDevices=true
ProtectSystem=strict   Restart=always    RestartSec=5
Environment=PYTHONPATH=/opt/amookht/app/backend
Environment=AMOOKHT_APP_ENV=production
ExecStart=/opt/amookht/backend-venv/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8200 --workers 2
```

- بک‌اند فقط روی loopback گوش می‌دهد؛ تنها راه ورود nginx است.
- `ProtectSystem=strict` یعنی حتی اگر فرآیند در معرض نوشتن قرار بگیرد، سیستم‌فایل فقط‌خواندنی است.

## ۶. لبهٔ شبکه: nginx + قفل پروژه‌ها

- TLS با Certbot؛ HSTS و ریدایرکت HTTPS.
- سقف حجم بدنه (`client_max_body_size`) هم‌راستا با `MAX_UPLOAD_SIZE_MB`.
- **قفل Tah3in (`/_gate/`)**: یک لایهٔ دسترسی پیش از رسیدن به اپ. مسیر `/_gate/check-learn` برای
  `learn.tah3in.com` توکن اپ (`X-Amookht-App-Token`) را با `/v1/account/me` می‌سنجد. اپ ویندوز همین هدر را
  می‌فرستد؛ وقتی قفل خاموش است، هدر نادیده گرفته می‌شود.
- دسترسی به مسیرهای مدیریتی (`.env`, `backend/`, `data/`) در nginx بسته است.

## ۷. حریم خصوصی صدا و متن

- رونویسی گفتار روی همان سرور (`faster-whisper`) انجام می‌شود؛ صدا به سرویس ابری نمی‌رود.
- متن کاربر فقط در صورت نیاز و با سهمیه به مدل فرستاده می‌شود؛ در حالت محلی (`LOCAL_LLM_ENABLED`) هیچ
  داده‌ای از سرور خارج نمی‌شود.
- لاگ‌ها متن کاربر را کامل ذخیره نمی‌کنند (فقط طول و نتیجه).

## ۸. چک‌لیست امنیتی استقرار

- [ ] `SECRET_KEY` یکتا و طولانی؛ چرخش دوره‌ای آن همهٔ کلیدهای AI را بی‌اعتبار می‌کند (باید دوباره وارد شوند).
- [ ] `.env` مود ۶۴۰ و مالک `root:amookht`.
- [ ] `ABUSE_PROTECTION_ENABLED=true` در تولید.
- [ ] بکاپ رمزنگاری‌شدهٔ PostgreSQL روزانه.
- [ ] به‌روزرسانی وابستگی‌ها (`pip list --outdated`) و پچ امنیتی اوبونتو.
- [ ] بررسی `journalctl` برای الگوی ۴۰۱/۴۰۳ تکراری (نشانهٔ حملهٔ رمز).
