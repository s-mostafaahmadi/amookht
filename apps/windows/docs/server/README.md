# آموخت — مستندات سرور (Amookht Server)

این پوشه کل سامانهٔ سمت سرور پروژهٔ **آموخت / Amookht** را شرح می‌دهد: وب‌اپلیکیشن `learn.tah3in.com`،
بک‌اند FastAPI، موتور هوش مصنوعی، تولید محتوا، امنیت، تست‌ها و روش استقرار.

> نسخهٔ مستند: نوامبر ۲۰۲۶ — هم‌راستا با شاخهٔ `main` و نسخهٔ ۴.۱.۰ اپلیکیشن ویندوز.

## فهرست

| فایل | موضوع |
| --- | --- |
| [`architecture.md`](architecture.md) | معماری کلی، لایه‌ها، جریان درخواست، پایگاه داده، همگام‌سازی وضعیت |
| [`ai.md`](ai.md) | هوش مصنوعی: رجیستری ارائه‌دهنده‌ها، fallback، استاد راهنما، تصحیح نوشتار، گفتار |
| [`content.md`](content.md) | تولید محتوا، مخزن محتوا، جلوگیری از تکرار، صدا، پک‌های مالک |
| [`security.md`](security.md) | احراز هویت، محدودیت نرخ، رمزنگاری کلیدها، SSRF، سخت‌سازی سرویس |
| [`testing.md`](testing.md) | تست‌ها، چک‌لیست‌ها، مشکلات واقعی و راه‌حل‌ها |
| [`deploy.md`](deploy.md) | پیش‌نیازها، محیط ایزوله، استقرار، به‌روزرسانی، پشتیبان‌گیری |

## آموخت در یک نگاه

آموخت یک **پلتفرم یادگیری زبان آلمانی** برای آزمون‌های TestDaF و ÖSD است که سه چهره دارد:

1. **وب‌اپ اصلی** (`/testdaf-daily-plan.html`) — برنامهٔ روزانهٔ شش‌دسته‌ای (Hören, Lesen, Schreiben, Sprechen,
   Grammatik & Wortschatz, Wiederholung)، شبیه‌ساز آزمون، دفتر اشتباهات، کتابخانه، مربی گفتگو.
2. **بک‌اند FastAPI** — حساب کاربری، همگام‌سازی وضعیت، موتور محتوا، هوش مصنوعی، صدا، تلگرام، مدیریت.
3. **کلاینت‌ها** — اپلیکیشن ویندوز (Electron)، نسخهٔ اندروید (WebView/PWA) و ویجت رومیزی؛ همه روی همان API.

### پشتهٔ فناوری

| لایه | فناوری |
| --- | --- |
| وب‌فرانت | HTML/CSS/JS خالص (بدون build)، ۵ فایل HTML اصلی + ۱۲۰+ فایل CSS/JS ماژولار |
| API | FastAPI + Uvicorn (۲ worker)، Pydantic v2، orjson |
| پایگاه داده | PostgreSQL + SQLAlchemy 2 (async) + asyncpg + Alembic |
| کش/صف | Redis (محدودیت نرخ، circuit breaker، قفل‌ها) + ARQ |
| هوش مصنوعی | OpenAI-compatible (Groq، NVIDIA، DeepSeek، Ollama/LM Studio)، Anthropic |
| گفتار | faster-whisper (STT محلی) + TTS |
| سرور | Ubuntu، nginx، systemd (سخت‌سازی‌شده)، Certbot |
| کلاینت ویندوز | Electron 32 + electron-builder 25 (NSIS) |

### ساختار پوشهٔ استقرار

```
/opt/amookht/
├── app/                      # ریشهٔ وب (nginx root) + backend/
│   ├── index.html            # صفحهٔ نخست
│   ├── testdaf-daily-plan.html   # اجرای برنامه (قلب محصول)
│   ├── mobile.html, android.html, en-sso.html
│   ├── *.css, *.js           # ماژول‌های فرانت (amk-*.js، free-space.js، grammar-drill.js …)
│   ├── assets/               # صدا، تصویر، پک‌های محتوا
│   └── backend/              # سورس FastAPI
├── backend-venv/             # محیط مجازی پایتون 3.11
├── backups/  bak-archive/    # پشتیبان‌ها
└── git-archive-app-*/        # آرشیو نسخه‌های قبلی
```

### اجرای سریع (روی سرور)

```bash
systemctl status amookht-backend
curl -s http://127.0.0.1:8200/v1/health
journalctl -u amookht-backend -n 50 --no-pager
```

### مسیرهای کلیدی API

| مسیر | کار |
| --- | --- |
| `POST /v1/auth/register|login|refresh|logout` | چرخهٔ نشست (JWT + refresh) |
| `GET /v1/account/me`, `PATCH /v1/account/profile` | حساب کاربر |
| `GET/POST/PATCH /v1/sync/...` | همگام‌سازی وضعیت برنامه (patch per path) |
| `POST /v1/writing/evaluate` | تصحیح هوشمند نوشتار |
| `POST /v1/speaking/...` | تحلیل گفتار و ضبط‌ها |
| `GET /v1/library/...`, `/v1/vocabulary/...` | کتابخانه و واژگان |
| `POST /v1/grammar-drill/...` | ربات گرامر |
| `GET/POST /v1/content-bank/...` | مخزن محتوای تولیدشده (اشتراکی/خصوصی) |
| `GET/POST/DELETE /v1/owner-packs/...` | پک‌های کامل اجرا (فقط مالک) |
| `GET/POST /v1/ai-admin/...` | مدیریت ارائه‌دهنده‌های AI (فقط مالک) |
| `GET /v1/widget/data` | ویجت رومیزی (کارها/یادداشت‌ها) |
| `POST /v1/telegram/...` | اتصال و وب‌هوک تلگرام |
