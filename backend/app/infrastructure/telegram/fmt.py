"""Formatting helpers for Persian Telegram messages (digits, Jalali dates, device/language/plan labels)."""
from __future__ import annotations

import html
import re
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

OWNER_TZ = "Asia/Tehran"
SITE_URL = "https://learn.tah3in.com/"
_FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def fa(value) -> str:
    return str(value).translate(_FA_DIGITS)


def esc(value) -> str:
    return html.escape(str(value or ""), quote=False)


def zone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(str(name or "").strip() or OWNER_TZ)
    except Exception:
        return ZoneInfo(OWNER_TZ)


def now_in(tz_name: str | None) -> datetime:
    return datetime.now(timezone.utc).astimezone(zone(tz_name))


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> tuple[int, int, int]:
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + g_d_m[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    if days < 186:
        jm, jd = 1 + days // 31, 1 + days % 31
    else:
        jm, jd = 7 + (days - 186) // 30, 1 + (days - 186) % 30
    return jy, jm, jd


JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]
WEEKDAYS = ["دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه", "یکشنبه"]


def jalali_date(d: date | datetime, with_weekday: bool = True) -> str:
    jy, jm, jd = gregorian_to_jalali(d.year, d.month, d.day)
    text = f"{fa(jd)} {JALALI_MONTHS[jm - 1]} {fa(jy)}"
    return f"{WEEKDAYS[d.weekday()]} {text}" if with_weekday else text


def local_stamp(dt: datetime | None = None, tz_name: str = OWNER_TZ) -> str:
    """e.g. «جمعه ۲۲ آبان ۱۴۰۵ — ساعت ۱۷:۴۲ (تهران)»"""
    dt = (dt or datetime.now(timezone.utc))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone(zone(tz_name))
    city = "تهران" if tz_name == OWNER_TZ else tz_name.split("/")[-1].replace("_", " ")
    return f"{jalali_date(local)} — ساعت {fa(local.strftime('%H:%M'))} ({city})"


def duration_fa(seconds: float) -> str:
    minutes = int(round(max(0, seconds) / 60))
    if minutes < 60:
        return f"{fa(minutes)} دقیقه"
    h, m = divmod(minutes, 60)
    return f"{fa(h)} ساعت" + (f" و {fa(m)} دقیقه" if m else "")


# ---- device / browser ------------------------------------------------------------------------------------------

def device_label(user_agent: str | None) -> str:
    ua = str(user_agent or "")
    if not ua:
        return "نامشخص"
    app = "اپ اندروید آموخت" if "AmookhtAndroid/" in ua else ""
    os_name = "نامشخص"
    m = re.search(r"Android (\d+(?:\.\d+)?)", ua)
    if m:
        os_name = f"Android {m.group(1)}"
    elif re.search(r"iPhone|iPad|iPod", ua):
        m = re.search(r"OS (\d+)[_.](\d+)", ua)
        os_name = ("iPadOS" if "iPad" in ua else "iOS") + (f" {m.group(1)}.{m.group(2)}" if m else "")
    elif "Windows NT 10" in ua:
        os_name = "Windows 10/11"
    elif "Windows" in ua:
        os_name = "Windows"
    elif "Mac OS X" in ua or "Macintosh" in ua:
        os_name = "macOS"
    elif "CrOS" in ua:
        os_name = "ChromeOS"
    elif "Linux" in ua:
        os_name = "Linux"
    kind = "موبایل" if re.search(r"Mobile|Android|iPhone", ua) and "iPad" not in ua else ("تبلت" if "iPad" in ua or "Tablet" in ua else "کامپیوتر")
    browser = ""
    for pattern, name in ((r"EdgA?/(\d+)", "Edge"), (r"OPR/(\d+)", "Opera"), (r"SamsungBrowser/(\d+)", "Samsung Internet"),
                          (r"YaBrowser/(\d+)", "Yandex"), (r"Firefox/(\d+)", "Firefox"), (r"FxiOS/(\d+)", "Firefox"),
                          (r"CriOS/(\d+)", "Chrome"), (r"Chrome/(\d+)", "Chrome"), (r"Version/(\d+).*Safari", "Safari")):
        m = re.search(pattern, ua)
        if m:
            browser = f"{name} {m.group(1)}"
            break
    if "; wv)" in ua and not app:
        browser = "WebView" + (f" ({browser})" if browser else "")
    parts = [p for p in (kind, os_name, app or browser) if p and p != "نامشخص"]
    return " · ".join(parts) or "نامشخص"


LANG_NAMES = {"fa": "فارسی", "de": "آلمانی", "en": "انگلیسی", "ar": "عربی", "tr": "ترکی", "ru": "روسی", "fr": "فرانسوی",
              "ps": "پشتو", "ku": "کردی", "az": "آذری", "other": "سایر"}


def language_label(accept_language: str | None) -> str:
    raw = str(accept_language or "").split(",")[0].strip()
    code = raw.split(";")[0].split("-")[0].lower()
    if not code:
        return "نامشخص"
    return LANG_NAMES.get(code, raw)


def plan_label(state: dict | None) -> str:
    state = state if isinstance(state, dict) else {}
    user = state.get("user") if isinstance(state.get("user"), dict) else {}
    plan = str(user.get("examPlan") or "").strip()
    if not plan:
        return ""
    level = str(user.get("level") or "").strip()
    if plan == "oesd":
        osd_level = str((state.get("oesdMethod") or {}).get("level") or level or "").upper()
        return "ÖSD" + (f" {osd_level}" if osd_level else "")
    if plan == "testdaf":
        return "برنامه یادگیری" + (f" (سطح فعلی {level})" if level else "")
    for custom in user.get("customPlans") or []:
        if isinstance(custom, dict) and str(custom.get("id")) == plan:
            return f"برنامه شخصی: {custom.get('name') or plan}"
    return plan
