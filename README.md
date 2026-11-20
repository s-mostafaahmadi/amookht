# آموخت · Amookht

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-web%20%7C%20windows%20%7C%20android-blue) ![Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20PostgreSQL%20%7C%20Redis-009688)

**پلتفرم یادگیری آلمانی با هوش مصنوعی برای آزمون‌های TestDaF و ÖSD** — وب، ویندوز و اندروید روی یک بک‌اند.

آموخت یک برنامهٔ روزانهٔ شش‌دسته‌ای می‌سازد (Hören، Lesen، Schreiben، Sprechen، Grammatik & Wortschatz،
Wiederholung)، پاسخ‌ها را با AI تصحیح می‌کند، اشتباهات را با تکرار فاصله‌دار برمی‌گرداند و پیشرفت را
روی همهٔ دستگاه‌ها هم‌زمان نگه می‌دارد.

---

## سه بخش، یک محصول

| بخش | مسیر | توضیح |
| --- | --- | --- |
| **وب‌اپ** | این ریپو (`index.html`, `backend/`) | FastAPI + PostgreSQL + Redis + فرانت بدون build |
| **اپ ویندوز** | [`apps/windows/`](apps/windows/README.md) · [`docs/windows/`](docs/windows/README.md) | Electron 32، موتور بومی، ویجت رومیزی، به‌روزرسانی خودکار |
| **اندروید** | [`docs/android.md`](docs/android.md) | WebView/PWA روی همان API |

## مستندات کامل

### سرور (وب‌اپ + API)

- [نمای کلی و فهرست API](docs/server/README.md)
- [معماری، لایه‌ها، همگام‌سازی وضعیت](docs/server/architecture.md)
- [هوش مصنوعی: رجیستری ارائه‌دهنده‌ها، fallback، هزینه](docs/server/ai.md)
- [تولید محتوا و جلوگیری از تکرار](docs/server/content.md)
- [امنیت](docs/server/security.md)
- [تست‌ها، مشکلات و راه‌حل‌ها](docs/server/testing.md)
- [استقرار، محیط ایزوله، به‌روزرسانی](docs/server/deploy.md)

### اپلیکیشن ویندوز

- [نمای کلی](docs/windows/README.md)
- [معماری Electron و موتور بومی](docs/windows/architecture.md)
- [قابلیت «افزودن دستی محتوا» (۴.۱.۰)](docs/windows/owner-packs.md)
- [ساخت، انتشار و به‌روزرسانی خودکار](docs/windows/build-and-update.md)
- [امنیت و تست‌ها](docs/windows/security-and-tests.md)
- [تاریخچهٔ نسخه‌ها](docs/windows/changelog.md)

---

## شروع سریع (سرور)

```bash
git clone https://github.com/s-mostafaahmadi/amookht.git amookht && cd amookht/backend
python3 -m venv .venv && .venv/bin/pip install -e .
cp .env.example .env            # SECRET_KEY, DATABASE_URL, REDIS_URL, کلیدهای AI
.venv/bin/uvicorn app.main:app --reload --port 8200
```

سپس `index.html` و `testdaf-daily-plan.html` را با nginx یا `python -m http.server` سرو کنید.
راهنمای کامل و محیط ایزوله: [docs/server/deploy.md](docs/server/deploy.md).

## شروع سریع (ویندوز)

```powershell
npm install
npm start          # اجرا
npm run dist       # ساخت نصب‌کننده → dist/Amookht-Setup-<ver>.exe
```

## ویژگی‌های کلیدی

- **برنامهٔ روزانهٔ هوشمند**: شش دسته تمرین، زمان‌بندی ۶۰–۳۰۰ دقیقه، تمرکز هفتگی، فاز یادگیری، حالت آزمون.
- **هوش مصنوعی مقاوم**: چند ارائه‌دهنده (Groq، NVIDIA، DeepSeek، محلی)، circuit breaker، سهمیهٔ روزانه،
  رمزنگاری کلیدها، محافظت SSRF.
- **تصحیح نوشتار و تحلیل گفتار**: نمرهٔ تفکیکی + ثبت خطاها در دفتر اشتباهات + SRS چهارسطحی.
- **همگام‌سازی لحظه‌ای**: وضعیت در سطح مسیر (patch) بین وب، ویندوز و موبایل.
- **ضد-تکرار محتوا**: مجموعهٔ مصرف‌شده، انتخاب مجدد تا ۱۲ بار، مخزن محتوا با کلید یکتا.
- **قابلیت‌های مالک**: مخزن فایل‌روز، پک‌های کامل اجرا (`/v1/owner-packs`)، پنل AI، چت مدیریتی.
- **امنیت**: JWT + bcrypt، محدودیت نرخ per-user/per-IP، نقش‌ها، سخت‌سازی systemd، قفل `_gate`.

## ساختار ریپو

```
├── index.html                    # صفحهٔ نخست
├── testdaf-daily-plan.html       # اجرای برنامه (قلب محصول)
├── mobile.html / android.html    # نسخهٔ موبایل/اندروید
├── backend/                      # FastAPI (app/, tests/, alembic/, pyproject.toml)
├── docker-compose.yml            # اجرای محلی Postgres/Redis/API
├── vendor/                       # کتابخانه‌های محلی (pdf.js)
└── docs/
    ├── server/                   # مستندات سرور
    ├── windows/                  # مستندات اپ ویندوز
    └── android.md                # نسخهٔ اندروید
```

## وضعیت پروژه

- نسخهٔ اپ ویندوز: **4.5.0**
- بک‌اند: FastAPI 0.110+، Python 3.11
- لایسنس: [MIT](LICENSE) — استفاده مجدد آزاد با ذکر منبع

## مجوز

کد این مخزن تحت [پروانه MIT](LICENSE) منتشر شده است — استفاده مجدد آزاد با ذکر منبع.
