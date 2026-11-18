# استقرار، پیش‌نیازها و به‌روزرسانی (سرور)

## ۱. پیش‌نیازهای سیستم

| مورد | مقدار |
| --- | --- |
| سیستم عامل | Ubuntu 22.04/24.04 LTS |
| پایتون | 3.11+ (venv اختصاصی: `/opt/amookht/backend-venv`) |
| PostgreSQL | 16 با کاربر دیتابیس `amookht` |
| Redis | 7 (کش، محدودیت نرخ، circuit breaker، صف ARQ) |
| nginx | + Certbot برای TLS |
| Node.js | فقط برای تست محلی فرانت/اپ (سرور نیازی ندارد) |
| منابع | ۲ هسته / ۲GB RAM کافی است؛ با `faster-whisper` روی CPU، ۴ هسته توصیه می‌شود |

## ۲. محیط ایزوله (بازتولید کامل)

```bash
# 1) کاربر سرویس
useradd -r -s /usr/sbin/nologin -d /opt/amookht amookht

# 2) سورس
mkdir -p /opt/amookht && cd /opt/amookht
git clone <repo> app          # یا انتقال آرشیو
python3 -m venv backend-venv
./backend-venv/bin/pip install -U pip
./backend-venv/bin/pip install -e app/backend

# 3) پایگاه داده
sudo -u postgres createuser amookht --pwprompt
sudo -u postgres createdb amookht -O amookht

# 4) تنظیمات
install -m 640 -o root -g amookht app/backend/.env.example app/backend/.env
$EDITOR app/backend/.env      # SECRET_KEY, DATABASE_URL, REDIS_URL, کلیدهای AI

# 5) سرویس
cp deploy/amookht-backend.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now amookht-backend

# 6) nginx
cp deploy/learn.tah3in.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d learn.tah3in.com
```

### متغیرهای محیطی (نام‌ها؛ مقادیر در `.env` می‌مانند)

```
APP_ENV DEBUG SECRET_KEY CORS_ORIGINS
DATABASE_URL DATABASE_ECHO DATABASE_POOL_SIZE DATABASE_MAX_OVERFLOW
REDIS_URL REDIS_SOCKET_CONNECT_TIMEOUT_SECONDS REDIS_SOCKET_TIMEOUT_SECONDS
ABUSE_PROTECTION_ENABLED TRUST_PROXY_CLIENT_IP
AUTH_LOGIN_RATE_LIMIT AUTH_LOGIN_SOURCE_RATE_LIMIT AUTH_LOGIN_RATE_WINDOW_SECONDS
AUTH_REGISTER_RATE_LIMIT AUTH_REGISTER_RATE_WINDOW_SECONDS
AUTH_REFRESH_RATE_LIMIT AUTH_REFRESH_SOURCE_RATE_LIMIT AUTH_REFRESH_RATE_WINDOW_SECONDS
AI_WRITING_RATE_LIMIT AI_WRITING_RATE_WINDOW_SECONDS AI_WRITING_DAILY_QUOTA
AI_WRITING_DAILY_WINDOW_SECONDS AI_WRITING_LEASE_SECONDS AI_WRITING_TIMEOUT_SECONDS AI_WRITING_MAX_INPUT_CHARS
MAX_UPLOAD_SIZE_MB WHISPER_MODEL WHISPER_DEVICE WHISPER_COMPUTE_TYPE
OPENAI_API_KEY ANTHROPIC_API_KEY DEEPSEEK_API_KEY DEEPSEEK_BASE_URL DEEPSEEK_MODEL DEEPSEEK_FAST_MODEL
LOCAL_LLM_ENABLED FILE_STORAGE_PATH PUBLIC_BASE_URL LOG_LEVEL
AI_TLOS_ENABLED AI_TLOS_TIMEOUT_SECONDS AI_TLOS_MAX_TOKENS
TELEGRAM_ENABLED TELEGRAM_WEBHOOK_SECRET TELEGRAM_BOT_TOKEN TELEGRAM_ADMIN_CHAT_ID
SMTP_HOST SMTP_PORT SMTP_USERNAME SMTP_PASSWORD SMTP_FROM_EMAIL SMTP_FROM_NAME SMTP_USE_TLS SMTP_USE_SSL
EMAIL_VERIFICATION_TTL_SECONDS TRUSTED_DEVICE_TOKEN TRUSTED_DEVICE_OWNER_EMAIL GOOGLE_CLIENT_ID
```

## ۳. ابزارهای لازم روی ماشین مدیر

- `ssh` با کلید (`~/.ssh/Server`)
- `curl`, `psql`, `git`
- `python3` محلی برای تست سریع منطق (اختیاری)
- مرورگر برای تست UI مالک (صفحه پشت `/_gate/` است)

## ۴. استقرار یک تغییر (روال واقعی پروژه)

```bash
# 1) بکاپ فایل‌هایی که عوض می‌شوند
ssh Server "cd /opt/amookht/app && cp testdaf-daily-plan.html testdaf-daily-plan.html.bak-$(date +%Y%m%d-%H%M)"

# 2) انتقال فایل
scp ./testdaf-daily-plan.html Server:/opt/amookht/app/testdaf-daily-plan.html

# 3) اگر بک‌اند تغییر کرده:
ssh Server "cd /opt/amookht/app/backend && /opt/amookht/backend-venv/bin/python -m py_compile app/main.py app/api/routes/<file>.py"
ssh Server "systemctl restart amookht-backend && systemctl is-active amookht-backend"

# 4) چک
ssh Server "curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8200/v1/health"
```

الزام‌ها:

- هر فایل HTML/CSS/JS که تغییر می‌کند باید عدد `?v=` خودش را عوض کند (کش مرورگر و webview).
- بکاپ قبل از جایگزینی، با نام `.bak-YYYYMMDD-<tag>`.
- بعد از ری‌استارت، `journalctl -u amookht-backend -n 30` را بخوانید؛ خطای `runtime schema check skipped`
  طبیعی است و نشانهٔ خرابی نیست.

## ۵. به‌روزرسانی بدون قطعی

1. فرانت: فایل استاتیک است؛ با `scp` جایگزین می‌شود (کوتاه‌ترین قطعی ممکن).
2. بک‌اند: `systemctl restart amookht-backend` (~۲ ثانیه). کلاینت‌ها با refresh token ادامه می‌دهند.
3. تغییر schema: `alembic upgrade head` یا `ensure_table()` تنبل (برای جدول‌های تازه).
4. اپ ویندوز: نسخهٔ تازه را در `dist/` بسازید، `latest.yml` را کنار نصب‌کننده در
   `https://learn.tah3in.com/downloads/` بگذارید؛ کلاینت‌ها با `electron-updater` به‌روز می‌شوند.

## ۶. پشتیبان‌گیری

```bash
# دیتابیس
pg_dump -U amookht -Fc amookht > /opt/amookht/backups/amookht-$(date +%F).dump

# فایل‌های کاربر و محتوا (بدون node_modules و کش)
rsync -a --exclude 'node_modules' --exclude '*.pyc' /opt/amookht/app/ /opt/amookht/backups/app-$(date +%F)/
```

- نگهداری: ۷ نسخهٔ روزانه + ۴ نسخهٔ هفتگی.
- پوشه‌های `bak-archive/` و `git-archive-app-*` روی سرور، آرشیو تغییرات بزرگ‌اند؛ حذف نکنید مگر پس از تأیید بکاپ.
- بازیابی: `pg_restore -U amookht -d amookht --clean <file>.dump` سپس بازگرداندن `app/` و `systemctl restart`.

## ۷. عیب‌یابی سریع

| نشانه | بررسی |
| --- | --- |
| ۵۰۲ از nginx | `systemctl status amookht-backend`؛ پورت ۸۲۰۰ گوش می‌دهد؟ |
| ۵۰۳ `ai_unavailable` | `retry_after` را ببینید؛ در پنل AI وضعیت ارائه‌دهنده‌ها و کلیدها را چک کنید |
| صفحه سفید بعد از استقرار | کنسول مرورگر: خطای ۴۰۴ برای یک `?v=` قدیمی → نسخه‌گذاری فایل فراموش شده |
| خروج ناخواستهٔ حساب در اپ | توکن موقتاً رد شده؛ `journalctl` را برای ۴۰۱ ببینید |
| کندی ذخیرهٔ وضعیت | اندازهٔ `user_state` و تعداد مسیرهای PATCH؛ Redis سالم است؟ |
