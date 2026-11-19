"""Amookht Telegram bot service (amookht-telegram.service).

Runs on its own (not inside uvicorn): long-polls Telegram, serves the inline-keyboard menus for the owner and the
learners, links Telegram chats to site accounts (deep-link codes made by /v1/telegram/link), relays support
messages, broadcasts the owner's announcements, and every minute checks whether a learner is due an evening
reminder or a nightly summary (each in the learner's own time zone), plus the owner's nightly statistics.
"""
from __future__ import annotations

import asyncio
import html
import json
import logging
import signal
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text

from app.config import get_settings
from app.infrastructure.cache.redis import close_redis, get_redis, init_redis
from app.infrastructure.database.connection import close_db, get_session_factory, init_db
from app.infrastructure.telegram import fmt, health, store
from app.infrastructure.telegram.bot import ALERTS_OFF_KEY, BOT_USERNAME_KEY
from app.infrastructure.telegram.fmt import esc, fa
from app.infrastructure.telegram.tgapi import TelegramError, TgApi, kb

log = logging.getLogger("amookht.telegram")

SITE = fmt.SITE_URL
OWNER_STATS_AT = (23, 30)  # Tehran
OFFSET_KEY = "tg:offset"
AWAIT_KEY = "tg:await:{}"
SUPPORT_KEY = "tg:support:{}"
DRAFT_KEY = "tg:draft:{}"
SENT_KEY = "tg:sent:{}:{}:{}"
EXAM_MILESTONES = {60, 30, 14, 7, 3, 1}


def aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def as_dict(value) -> dict:
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return {}
    return value if isinstance(value, dict) else {}


def bar(fraction: float, width: int = 10) -> str:
    fraction = max(0.0, min(1.0, fraction))
    full = int(round(fraction * width))
    return "▰" * full + "▱" * (width - full)


def onoff(value: bool) -> str:
    return "روشن ✅" if value else "خاموش ⛔️"


def last_study_date(state: dict) -> date | None:
    """Most recent day with any recorded study (method work, free-study timer or a closed history day)."""
    found: list[str] = []
    for key in ("testdafMethod", "oesdMethod"):
        days = ((state.get(key) or {}).get("days") or {}) if isinstance(state.get(key), dict) else {}
        for day, info in days.items() if isinstance(days, dict) else []:
            work = (info or {}).get("work") or {}
            if any(isinstance(w, dict) and (sum(w.get("secs") or [0]) if isinstance(w.get("secs"), list) else 0) > 30
                   for w in work.values()):
                found.append(day)
    sessions = (((state.get("appSettings") or {}).get("freeStudy") or {}).get("sessions") or {})
    if isinstance(sessions, dict):
        found += [d for d, secs in sessions.items() if isinstance(secs, (int, float)) and secs > 30]
    for entry in state.get("history") or []:
        if isinstance(entry, dict) and (entry.get("time") or 0) > 30 and entry.get("date"):
            found.append(str(entry["date"]))
    dates = []
    for d in found:
        try:
            dates.append(date.fromisoformat(str(d)[:10]))
        except ValueError:
            pass
    return max(dates) if dates else None


class BotService:
    def __init__(self) -> None:
        s = get_settings()
        self.settings = s
        self.token = s.TELEGRAM_BOT_TOKEN.strip()
        self.owner = s.TELEGRAM_ADMIN_CHAT_ID.strip()
        self.api = TgApi(self.token, timeout=40)
        self.username = ""
        self.stop_event = asyncio.Event()

    # ---- helpers ---------------------------------------------------------------------------------------------

    def is_owner(self, chat_id) -> bool:
        return str(chat_id) == self.owner

    @property
    def redis(self):
        return get_redis()

    async def send(self, chat_id, body: str, markup: dict | None = None, **extra) -> dict | None:
        try:
            return await self.api.send(chat_id, body, markup, **extra)
        except TelegramError as exc:
            if exc.blocked:
                await store.set_inactive(int(chat_id))
                log.info("chat %s blocked the bot; link deactivated", chat_id)
            else:
                log.warning("send to %s failed: %s", chat_id, exc)
            return None

    async def show(self, chat_id, body: str, markup: dict | None, message_id: int | None = None) -> None:
        """Edit the menu message in place when navigating from a button (feels like an app); otherwise send."""
        if message_id:
            try:
                await self.api.edit(chat_id, message_id, body, markup)
                return
            except TelegramError as exc:
                log.debug("edit failed (%s); sending a new message", exc)
        await self.send(chat_id, body, markup)

    async def set_await(self, chat_id, value: str | None) -> None:
        key = AWAIT_KEY.format(chat_id)
        if value:
            await self.redis.set(key, value, ex=1800)
        else:
            await self.redis.delete(key)

    async def get_await(self, chat_id) -> str:
        raw = await self.redis.get(AWAIT_KEY.format(chat_id))
        return (raw.decode() if isinstance(raw, bytes) else raw) or ""

    async def once(self, kind: str, who: str, day: str) -> bool:
        """True the first time (kind, who, day) is claimed — survives restarts, so nothing is sent twice."""
        return bool(await self.redis.set(SENT_KEY.format(kind, who, day), "1", ex=3 * 86400, nx=True))

    # ---- startup ---------------------------------------------------------------------------------------------

    async def setup(self) -> None:
        me = await self.api.call("getMe")
        self.username = me.get("username") or ""
        await self.redis.set(BOT_USERNAME_KEY, self.username, ex=86400)
        await self.api.call("deleteWebhook", {"drop_pending_updates": False})
        user_cmds = [
            {"command": "menu", "description": "منوی اصلی"},
            {"command": "today", "description": "پیشرفت امروز"},
            {"command": "plan", "description": "برنامه من"},
            {"command": "settings", "description": "تنظیمات اعلان‌ها"},
            {"command": "help", "description": "راهنما و پشتیبانی"},
        ]
        await self.api.call("setMyCommands", {"commands": user_cmds, "language_code": ""})
        if self.owner.lstrip("-").isdigit():
            owner_cmds = [
                {"command": "menu", "description": "پنل مدیریت"},
                {"command": "stats", "description": "آمار امروز"},
                {"command": "health", "description": "بررسی سلامت همه بخش‌ها"},
                {"command": "announce", "description": "اطلاعیه جدید برای همه"},
                {"command": "signups", "description": "ثبت‌نام‌های اخیر"},
                {"command": "today", "description": "پیشرفت امروز من"},
                {"command": "cancel", "description": "لغو عملیات در جریان"},
            ]
            try:
                await self.api.call("setMyCommands", {"commands": owner_cmds,
                                                      "scope": {"type": "chat", "chat_id": int(self.owner)}})
            except TelegramError as exc:
                log.warning("owner commands not set: %s", exc)
        await self.api.call("setMyDescription", {"description":
            "🎓 دستیار تلگرامی آموخت — گزارش روزانه پیشرفت، یادآوری برنامه مطالعه و اطلاعیه‌های سایت learn.tah3in.com"})
        await self.api.call("setMyShortDescription", {"short_description": "گزارش روزانه، یادآوری و اطلاعیه‌های آموخت"})
        log.info("bot @%s ready", self.username)

    # ---- polling ---------------------------------------------------------------------------------------------

    async def poll(self) -> None:
        raw = await self.redis.get(OFFSET_KEY)
        offset = int(raw or 0)
        while not self.stop_event.is_set():
            try:
                updates = await self.api.call("getUpdates", {
                    "offset": offset, "timeout": 25, "allowed_updates": ["message", "callback_query"]}, retries=0, timeout=40)
            except TelegramError as exc:
                log.warning("getUpdates failed: %s", exc)
                await asyncio.sleep(10 if exc.code == 409 else 5)
                continue
            for update in updates or []:
                offset = max(offset, int(update["update_id"]) + 1)
                await self.redis.set(OFFSET_KEY, offset)
                try:
                    if "callback_query" in update:
                        await self.on_callback(update["callback_query"])
                    elif "message" in update:
                        await self.on_message(update["message"])
                except Exception:
                    log.exception("update handling failed")

    # ---- messages --------------------------------------------------------------------------------------------

    async def on_message(self, msg: dict) -> None:
        chat = msg.get("chat") or {}
        if chat.get("type") != "private":
            return
        chat_id = chat.get("id")
        body = str(msg.get("text") or "").strip()
        owner = self.is_owner(chat_id)
        if not body:
            if msg.get("photo") or msg.get("document") or msg.get("voice"):
                await self.send(chat_id, "فعلاً فقط پیام متنی پشتیبانی می‌شود. 🙏")
            return

        if body.startswith("/"):
            cmd, _, arg = body.partition(" ")
            cmd = cmd.split("@")[0].lower()
            await self.set_await(chat_id, None) if cmd in ("/cancel", "/start", "/menu") else None
            if cmd == "/start":
                if arg.strip().startswith("L"):
                    await self.link(msg, arg.strip())
                else:
                    await self.main_menu(chat_id)
                return
            handlers = {
                "/menu": lambda: self.main_menu(chat_id),
                "/today": lambda: self.user_today(chat_id),
                "/plan": lambda: self.user_plan(chat_id),
                "/settings": lambda: self.user_settings(chat_id),
                "/help": lambda: self.help(chat_id),
                "/cancel": lambda: self.send(chat_id, "لغو شد.", kb([[("« منوی اصلی", "m")]])),
            }
            if owner:
                handlers.update({
                    "/stats": lambda: self.owner_stats(chat_id),
                    "/health": lambda: self.owner_health(chat_id),
                    "/announce": lambda: self.owner_announce_start(chat_id),
                    "/signups": lambda: self.owner_signups(chat_id),
                    "/reply": lambda: self.owner_reply_command(chat_id, arg),
                })
            handler = handlers.get(cmd)
            if handler:
                await handler()
            else:
                await self.send(chat_id, "این فرمان را نمی‌شناسم. 🤔", kb([[("« منوی اصلی", "m")]]))
            return

        waiting = await self.get_await(chat_id)
        if owner:
            if waiting == "announce":
                await self.owner_announce_preview(chat_id, body)
                return
            if waiting.startswith("reply:"):
                await self.set_await(chat_id, None)
                await self.deliver_reply(chat_id, int(waiting.split(":", 1)[1]), body)
                return
            reply_to = (msg.get("reply_to_message") or {}).get("message_id")
            if reply_to:
                target = await self.redis.get(SUPPORT_KEY.format(reply_to))
                if target:
                    await self.deliver_reply(chat_id, int(target), body)
                    return
            await self.main_menu(chat_id, prefix="برای کار با ربات از دکمه‌ها استفاده کنید 👇")
            return
        await self.support_in(msg, body)

    async def on_callback(self, cq: dict) -> None:
        data = str(cq.get("data") or "")
        msg = cq.get("message") or {}
        chat_id = (msg.get("chat") or {}).get("id")
        mid = msg.get("message_id")
        await self.api.answer_callback(cq["id"])
        if chat_id is None:
            return
        owner = self.is_owner(chat_id)
        if data == "m":
            await self.set_await(chat_id, None)
            await self.main_menu(chat_id, mid)
        elif data == "u:today":
            await self.user_today(chat_id, mid)
        elif data == "u:plan":
            await self.user_plan(chat_id, mid)
        elif data == "u:set":
            await self.user_settings(chat_id, mid)
        elif data == "u:help":
            await self.help(chat_id, mid)
        elif data == "u:sup":
            await self.set_await(chat_id, "support")
            await self.show(chat_id, "💬 <b>پشتیبانی آموخت</b>\n\nسؤال یا مشکلتان را همین‌جا بنویسید و بفرستید؛ "
                                     "پاسخ در همین گفتگو می‌آید.", kb([[("« منوی اصلی", "m")]]), mid)
        elif data == "u:unlink":
            await self.show(chat_id, "🔓 مطمئنید می‌خواهید اتصال تلگرام از حساب آموخت قطع شود؟\n"
                                     "دیگر گزارش روزانه و یادآوری نمی‌گیرید.",
                            kb([[("بله، قطع کن", "u:unlink!"), ("انصراف", "u:set")]]), mid)
        elif data == "u:unlink!":
            await store.unlink_chat(chat_id)
            await self.show(chat_id, "✅ اتصال قطع شد. هر وقت خواستید از «تنظیمات حساب» در سایت دوباره وصل کنید.",
                            kb([[("« منوی اصلی", "m")]]), mid)
        elif data.startswith("p:"):
            await self.pref_toggle(chat_id, mid, data)
        elif owner and data.startswith("o:"):
            await self.owner_callback(chat_id, mid, data)

    # ---- linking ---------------------------------------------------------------------------------------------

    async def link(self, msg: dict, code: str) -> None:
        chat_id = msg["chat"]["id"]
        frm = msg.get("from") or {}
        key = f"tg:linkcode:{code[:40]}"
        user_id = await self.redis.get(key)
        if not user_id:
            await self.send(chat_id, "⌛️ این لینک اتصال منقضی شده یا قبلاً استفاده شده.\n"
                                     "در سایت به «تنظیمات حساب ← اتصال تلگرام» بروید و دوباره دکمه را بزنید.",
                            kb([[("🌐 باز کردن آموخت", SITE)]]))
            return
        user_id = user_id.decode() if isinstance(user_id, bytes) else user_id
        await self.redis.delete(key)
        name = " ".join(filter(None, [frm.get("first_name"), frm.get("last_name")]))
        await store.upsert_link(user_id, chat_id, frm.get("username"), name)
        await self.redis.set(f"tg:linked:{user_id}", "1", ex=600)  # lets the site notice the link quickly
        link = await store.link_by_chat(chat_id)
        display = (link or {}).get("display_name") or "شما"
        await self.send(chat_id,
                        f"✅ <b>حساب آموخت «{esc(display)}» به این تلگرام وصل شد.</b>\n\n"
                        "از این به بعد:\n"
                        "🔔 عصرها اگر هنوز مطالعه نکرده باشید یادآوری می‌گیرید\n"
                        "🌙 آخر شب گزارش پیشرفت همان روز را می‌گیرید\n"
                        "📢 اطلاعیه‌های آموخت به دستتان می‌رسد\n\n"
                        "ساعت‌ها و روشن/خاموش‌ها را از «⚙️ تنظیمات اعلان‌ها» تغییر دهید.")
        await self.main_menu(chat_id)

    # ---- menus -----------------------------------------------------------------------------------------------

    async def main_menu(self, chat_id, mid: int | None = None, prefix: str = "") -> None:
        link = await store.link_by_chat(chat_id)
        if self.is_owner(chat_id):
            totals = await self.quick_totals()
            alerts_on = not await self.redis.exists(ALERTS_OFF_KEY)
            body = (f"{prefix + chr(10) + chr(10) if prefix else ''}👑 <b>پنل مدیریت آموخت</b>\n\n"
                    f"👥 کاربران: <b>{fa(totals['users'])}</b> · امروز فعال: <b>{fa(totals['active_today'])}</b>\n"
                    f"🔗 متصل به تلگرام: <b>{fa(totals['linked'])}</b>")
            rows = [
                [("📊 آمار امروز", "o:stats"), ("🩺 بررسی سلامت", "o:health")],
                [("📢 اطلاعیه جدید", "o:ann"), ("📜 اطلاعیه‌ها", "o:anns")],
                [("🆕 ثبت‌نام‌های اخیر", "o:new"), (f"🔔 هشدارها: {'روشن' if alerts_on else 'خاموش'}", "o:alerts")],
            ]
            if link:
                rows.append([("📅 پیشرفت من", "u:today"), ("⚙️ اعلان‌های من", "u:set")])
            rows.append([("🌐 باز کردن آموخت", SITE)])
            await self.show(chat_id, body, kb(rows), mid)
            return
        if not link:
            body = (f"{prefix + chr(10) + chr(10) if prefix else ''}🎓 <b>به ربات آموخت خوش آمدید!</b>\n\n"
                    "این ربات همراه مطالعه شماست: گزارش روزانه پیشرفت، یادآوری برنامه و اطلاعیه‌های سایت.\n\n"
                    "🔗 <b>برای شروع، حسابتان را وصل کنید:</b>\n"
                    "۱. سایت آموخت را باز کنید و وارد حساب شوید\n"
                    "۲. «تنظیمات حساب» ← بخش «اتصال تلگرام»\n"
                    "۳. دکمه «اتصال به تلگرام» را بزنید؛ همین‌جا برمی‌گردید و کار تمام است ✅")
            await self.show(chat_id, body, kb([[("🌐 باز کردن آموخت", SITE)],
                                               [("💬 پشتیبانی", "u:sup"), ("❓ راهنما", "u:help")]]), mid)
            return
        state = await store.load_state(link["user_id"])
        p = store.today_progress(state)
        name = p["name"] or link.get("display_name") or ""
        status = (f"امروز {fmt.duration_fa(p['studied_secs'])} مطالعه کرده‌اید 👏" if p["studied"]
                  else "امروز هنوز مطالعه‌ای ثبت نشده ⏳")
        body = (f"{prefix + chr(10) + chr(10) if prefix else ''}👋 سلام <b>{esc(name)}</b>!\n"
                f"🎓 دستیار آموخت در خدمت شماست.\n\n{status}"
                + (f"\n🔥 زنجیره مطالعه: {fa(p['streak'])} روز" if p["streak"] else ""))
        await self.show(chat_id, body, kb([
            [("📅 پیشرفت امروز", "u:today"), ("🗓 برنامه من", "u:plan")],
            [("⚙️ تنظیمات اعلان‌ها", "u:set"), ("💬 پشتیبانی", "u:sup")],
            [("🌐 باز کردن آموخت", SITE)],
        ]), mid)

    async def help(self, chat_id, mid: int | None = None) -> None:
        body = ("❓ <b>راهنمای ربات آموخت</b>\n\n"
                "📅 <b>پیشرفت امروز</b> — زمان مطالعه، فعالیت‌های تمام‌شده و زنجیره روزانه\n"
                "🗓 <b>برنامه من</b> — آزمون انتخابی، تاریخ آزمون و هدف روزانه\n"
                "⚙️ <b>تنظیمات اعلان‌ها</b> — یادآوری عصر، گزارش شبانه، اطلاعیه‌ها و ساعت هرکدام\n"
                "💬 <b>پشتیبانی</b> — پیامتان مستقیم به تیم آموخت می‌رسد\n\n"
                "فرمان‌ها: /menu  /today  /plan  /settings")
        await self.show(chat_id, body, kb([[("« منوی اصلی", "m")]]), mid)

    async def require_link(self, chat_id, mid) -> dict | None:
        link = await store.link_by_chat(chat_id)
        if not link:
            await self.main_menu(chat_id, mid, prefix="ابتدا حساب آموخت را وصل کنید 👇")
        return link

    def today_text(self, p: dict, title: str = "📅 <b>پیشرفت امروز</b>") -> str:
        target = max(15, p["target_min"])
        studied_min = p["studied_secs"] / 60
        lines = [f"{title} — {fmt.jalali_date(p['local_now'])}", ""]
        lines.append(f"⏱ زمان مطالعه: <b>{fmt.duration_fa(p['studied_secs'])}</b> از هدف {fa(target)} دقیقه")
        lines.append(f"{bar(studied_min / target)} {fa(min(100, int(studied_min * 100 / target)))}٪")
        if p["plan_total"]:
            lines.append(f"✅ فعالیت‌های تمام‌شده: <b>{fa(p['modules_done'])}</b> از {fa(p['plan_total'])}")
        elif p["modules_done"] or p["modules_started"]:
            lines.append(f"✅ بخش‌های تمام‌شده: <b>{fa(p['modules_done'])}</b> · شروع‌شده: {fa(p['modules_started'])}")
        lines.append(f"🔥 زنجیره مطالعه: <b>{fa(p['streak'])}</b> روز")
        if p["exam_days"] is not None and p["exam_days"] >= 0:
            lines.append(f"⏳ تا آزمون: <b>{fa(p['exam_days'])}</b> روز")
        return "\n".join(lines)

    async def user_today(self, chat_id, mid: int | None = None) -> None:
        link = await self.require_link(chat_id, mid)
        if not link:
            return
        p = store.today_progress(await store.load_state(link["user_id"]))
        tail = ("\n\nعالی پیش می‌روید! 💪" if p["studied_secs"] >= p["target_min"] * 60 else
                "\n\nهنوز وقت هست؛ حتی ۱۵ دقیقه هم زنجیره را حفظ می‌کند 🌱" if not p["studied"] else "")
        await self.show(chat_id, self.today_text(p) + tail,
                        kb([[("🔄 به‌روزرسانی", "u:today"), ("🌐 ادامه مطالعه", SITE)], [("« منوی اصلی", "m")]]), mid)

    async def user_plan(self, chat_id, mid: int | None = None) -> None:
        link = await self.require_link(chat_id, mid)
        if not link:
            return
        state = await store.load_state(link["user_id"])
        user = state.get("user") or {}
        p = store.today_progress(state)
        lines = ["🗓 <b>برنامه من</b>", ""]
        lines.append(f"🎯 آزمون: <b>{esc(fmt.plan_label(state) or 'هنوز انتخاب نشده')}</b>")
        try:
            exam = date.fromisoformat(str(user.get("examDate") or "")[:10])
            lines.append(f"📆 تاریخ آزمون: {fmt.jalali_date(exam)}"
                         + (f" ({fa(p['exam_days'])} روز دیگر)" if p["exam_days"] is not None and p["exam_days"] >= 0 else ""))
        except ValueError:
            lines.append("📆 تاریخ آزمون: ثبت نشده")
        mode = "مطالعه آزاد" if state.get("studyMode") == "free" else "برنامه آزمون"
        lines.append(f"🧭 حالت فعلی: {mode}")
        lines.append(f"⏱ هدف روزانه: {fa(p['target_min'])} دقیقه")
        lines.append(f"🔥 زنجیره: {fa(p['streak'])} روز")
        last = last_study_date(state)
        if last:
            lines.append(f"📖 آخرین روز مطالعه: {fmt.jalali_date(last)}")
        await self.show(chat_id, "\n".join(lines), kb([[("📅 پیشرفت امروز", "u:today"), ("🌐 باز کردن آموخت", SITE)],
                                                       [("« منوی اصلی", "m")]]), mid)

    async def user_settings(self, chat_id, mid: int | None = None) -> None:
        link = await self.require_link(chat_id, mid)
        if not link:
            return
        pr = store.prefs_of(link.get("prefs"))
        body = ("⚙️ <b>تنظیمات اعلان‌ها</b>\n\n"
                f"🔔 یادآوری عصر (اگر تا آن ساعت مطالعه نکرده باشید): {onoff(pr['reminders'])} — ساعت {fa(pr['reminder_hour'])}:۰۰\n"
                f"🌙 گزارش شبانه پیشرفت: {onoff(pr['summary'])} — ساعت {fa(pr['summary_hour'])}:۰۰\n"
                f"📢 اطلاعیه‌های آموخت: {onoff(pr['announcements'])}\n\n"
                "ساعت‌ها به وقت منطقه زمانی حساب شما در سایت است.")
        rh = [(("• " if h == pr["reminder_hour"] else "") + fa(h), f"p:rh:{h}") for h in store.REMINDER_HOURS]
        sh = [(("• " if h == pr["summary_hour"] else "") + fa(h), f"p:sh:{h}") for h in store.SUMMARY_HOURS]
        rows = [
            [(f"🔔 یادآوری: {'روشن' if pr['reminders'] else 'خاموش'}", "p:reminders"),
             (f"🌙 گزارش: {'روشن' if pr['summary'] else 'خاموش'}", "p:summary")],
            [(f"📢 اطلاعیه‌ها: {'روشن' if pr['announcements'] else 'خاموش'}", "p:announcements")],
            [("⏰ ساعت یادآوری:", "u:set")], rh,
            [("🌙 ساعت گزارش:", "u:set")], sh,
            [("🔓 قطع اتصال حساب", "u:unlink"), ("« منوی اصلی", "m")],
        ]
        await self.show(chat_id, body, kb(rows), mid)

    async def pref_toggle(self, chat_id, mid, data: str) -> None:
        link = await self.require_link(chat_id, mid)
        if not link:
            return
        pr = store.prefs_of(link.get("prefs"))
        parts = data.split(":")
        if parts[1] in ("reminders", "summary", "announcements"):
            await store.set_pref(link["user_id"], parts[1], not pr[parts[1]])
        elif parts[1] == "rh" and int(parts[2]) in store.REMINDER_HOURS:
            await store.set_pref(link["user_id"], "reminder_hour", int(parts[2]))
        elif parts[1] == "sh" and int(parts[2]) in store.SUMMARY_HOURS:
            await store.set_pref(link["user_id"], "summary_hour", int(parts[2]))
        await self.user_settings(chat_id, mid)

    # ---- support ---------------------------------------------------------------------------------------------

    async def support_in(self, msg: dict, body: str) -> None:
        chat_id = msg["chat"]["id"]
        frm = msg.get("from") or {}
        rate = f"tg:suprate:{chat_id}"
        n = await self.redis.incr(rate)
        if n == 1:
            await self.redis.expire(rate, 3600)
        if n > 20:
            return
        link = await store.link_by_chat(chat_id)
        tg_name = " ".join(filter(None, [frm.get("first_name"), frm.get("last_name")])) or "کاربر"
        who = esc(tg_name) + (f" (@{esc(frm['username'])})" if frm.get("username") else "")
        account = f"\n🎓 حساب سایت: {esc(link.get('display_name') or 'بدون نام')}" if link else "\n🎓 حساب سایت: وصل نیست"
        sent = await self.send(self.owner, f"💬 <b>پیام پشتیبانی</b>\n👤 {who}{account}\n\n{esc(body)}",
                               kb([[("✍️ پاسخ", f"o:reply:{chat_id}")]]))
        if sent:
            await self.redis.set(SUPPORT_KEY.format(sent["message_id"]), chat_id, ex=14 * 86400)
        await self.set_await(chat_id, None)
        await self.send(chat_id, "✅ پیامتان به پشتیبانی آموخت رسید؛ پاسخ در همین گفتگو ارسال می‌شود.",
                        kb([[("« منوی اصلی", "m")]]))

    async def deliver_reply(self, owner_chat, target: int, body: str) -> None:
        ok = await self.send(target, f"👨‍💻 <b>پاسخ پشتیبانی آموخت</b>\n\n{esc(body)}", kb([[("« منو", "m")]]))
        await self.send(owner_chat, "✅ پاسخ ارسال شد." if ok else "❌ ارسال نشد (کاربر ربات را بسته است؟)")

    async def owner_reply_command(self, chat_id, arg: str) -> None:
        target, _, body = arg.strip().partition(" ")
        if not target.lstrip("-").isdigit() or not body.strip():
            await self.send(chat_id, "برای پاسخ، زیر پیام پشتیبانی دکمه «✍️ پاسخ» را بزنید.")
            return
        await self.deliver_reply(chat_id, int(target), body.strip())

    # ---- owner -----------------------------------------------------------------------------------------------

    async def owner_callback(self, chat_id, mid, data: str) -> None:
        if data == "o:stats":
            await self.owner_stats(chat_id, mid)
        elif data == "o:health":
            await self.owner_health(chat_id, mid)
        elif data == "o:new":
            await self.owner_signups(chat_id, mid)
        elif data == "o:alerts":
            if await self.redis.exists(ALERTS_OFF_KEY):
                await self.redis.delete(ALERTS_OFF_KEY)
            else:
                await self.redis.set(ALERTS_OFF_KEY, "1")
            await self.main_menu(chat_id, mid)
        elif data == "o:ann":
            await self.owner_announce_start(chat_id, mid)
        elif data in ("o:ann:all", "o:ann:tg"):
            await self.owner_announce_send(chat_id, mid, show_on_site=(data == "o:ann:all"))
        elif data == "o:ann:cancel":
            await self.redis.delete(DRAFT_KEY.format(chat_id))
            await self.set_await(chat_id, None)
            await self.show(chat_id, "❌ اطلاعیه لغو شد.", kb([[("« پنل مدیریت", "m")]]), mid)
        elif data == "o:anns":
            await self.owner_announcements(chat_id, mid)
        elif data.startswith("o:hide:"):
            await store.hide_announcement(int(data.split(":")[2]))
            await self.owner_announcements(chat_id, mid, notice="✅ بنر از سایت برداشته شد و به تاریخچه رفت.")
        elif data.startswith("o:reply:"):
            target = data.split(":")[2]
            await self.set_await(chat_id, f"reply:{target}")
            await self.send(chat_id, "✍️ متن پاسخ را بنویسید و بفرستید (/cancel برای لغو).")

    async def quick_totals(self) -> dict:
        async with get_session_factory()() as s:
            users = (await s.execute(text("SELECT count(*) FROM users WHERE deleted_at IS NULL"))).scalar_one()
            linked = (await s.execute(text("SELECT count(*) FROM telegram_links WHERE active"))).scalar_one()
            start = self.tehran_midnight_utc()
            active = (await s.execute(text(
                "SELECT count(*) FROM user_app_states s JOIN users u ON u.id = s.user_id "
                "WHERE u.deleted_at IS NULL AND s.updated_at >= :t"), {"t": start})).scalar_one()
        return {"users": users, "linked": linked, "active_today": active}

    @staticmethod
    def tehran_midnight_utc(days_ago: int = 0) -> datetime:
        local = fmt.now_in(fmt.OWNER_TZ).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=days_ago)
        return local.astimezone(timezone.utc)

    async def stats_text(self, title: str = "📊 <b>آمار امروز آموخت</b>") -> str:
        today0 = self.tehran_midnight_utc()
        week0 = self.tehran_midnight_utc(6)
        async with get_session_factory()() as s:
            rows = (await s.execute(text(
                "SELECT u.id, u.display_name, u.created_at, u.preferences, s.state_data, s.updated_at "
                "FROM users u LEFT JOIN user_app_states s ON s.user_id = u.id WHERE u.deleted_at IS NULL"))).all()
            linked = (await s.execute(text("SELECT count(*) FROM telegram_links WHERE active"))).scalar_one()
        total = len(rows)
        new_today = [r for r in rows if r.created_at and aware(r.created_at) >= today0]
        new_week = [r for r in rows if r.created_at and aware(r.created_at) >= week0]
        active_today = [r for r in rows if r.updated_at and aware(r.updated_at) >= today0]
        active_week = [r for r in rows if r.updated_at and aware(r.updated_at) >= week0]
        studied, minutes, finished = 0, 0.0, 0
        for r in rows:
            state = as_dict(r.state_data)
            p = store.today_progress(state)
            if p["studied"]:
                studied += 1
                minutes += p["studied_secs"] / 60
                if p["studied_secs"] >= p["target_min"] * 60:
                    finished += 1
        lines = [f"{title} — {fmt.jalali_date(fmt.now_in(fmt.OWNER_TZ))}", "",
                 f"👥 کل کاربران: <b>{fa(total)}</b>",
                 f"🆕 ثبت‌نام امروز: <b>{fa(len(new_today))}</b>"
                 + (f" ({'، '.join(esc(r.display_name or 'بی‌نام') for r in new_today[:8])})" if new_today else ""),
                 f"🟢 فعال امروز (سایت را باز کرده‌اند): <b>{fa(len(active_today))}</b>",
                 f"📚 مطالعه کرده امروز: <b>{fa(studied)}</b> نفر · مجموع {fmt.duration_fa(minutes * 60)}",
                 f"🏁 به هدف روزانه رسیده: <b>{fa(finished)}</b> نفر",
                 f"🔗 متصل به تلگرام: <b>{fa(linked)}</b>",
                 "",
                 f"📅 هفت روز اخیر: {fa(len(new_week))} ثبت‌نام · {fa(len(active_week))} کاربر فعال"]
        return "\n".join(lines)

    async def owner_stats(self, chat_id, mid: int | None = None) -> None:
        await self.show(chat_id, await self.stats_text(), kb([[("🔄 به‌روزرسانی", "o:stats"), ("« پنل مدیریت", "m")]]), mid)

    async def owner_health(self, chat_id, mid: int | None = None) -> None:
        if mid:
            await self.show(chat_id, "⏳ در حال بررسی همه بخش‌ها… (تا یک دقیقه)", None, mid)
        else:
            sent = await self.send(chat_id, "⏳ در حال بررسی همه بخش‌ها… (تا یک دقیقه)")
            mid = (sent or {}).get("message_id")
        checks = await health.run_all(self.token)
        await self.show(chat_id, health.report(checks), kb([[("🔄 دوباره", "o:health"), ("« پنل مدیریت", "m")]]), mid)

    async def owner_signups(self, chat_id, mid: int | None = None) -> None:
        async with get_session_factory()() as s:
            rows = (await s.execute(text(
                "SELECT u.id, u.display_name, u.created_at, u.preferences, s.state_data, "
                "EXISTS(SELECT 1 FROM telegram_links l WHERE l.user_id = u.id) AS linked "
                "FROM users u LEFT JOIN user_app_states s ON s.user_id = u.id "
                "WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC LIMIT 10"))).all()
        lines = ["🆕 <b>ثبت‌نام‌های اخیر</b>", ""]
        for i, r in enumerate(rows, 1):
            prefs = as_dict(r.preferences)
            state = as_dict(r.state_data)
            method = "گوگل" if prefs.get("signup_method") == "google" else ("ایمیل (+ گوگل)" if prefs.get("google_sub") else "ایمیل")
            plan = fmt.plan_label(state) or "بدون برنامه"
            when = fmt.local_stamp(r.created_at) if r.created_at else "؟"
            lines.append(f"{fa(i)}. <b>{esc(r.display_name or 'بی‌نام')}</b> — {esc(plan)}\n"
                         f"    🕒 {when} · 🔑 {method}{' · 🔗 تلگرام' if r.linked else ''}")
        await self.show(chat_id, "\n".join(lines), kb([[("« پنل مدیریت", "m")]]), mid)

    async def owner_announce_start(self, chat_id, mid: int | None = None) -> None:
        await self.set_await(chat_id, "announce")
        await self.show(chat_id, "📢 <b>اطلاعیه جدید</b>\n\nمتن اطلاعیه را بنویسید و بفرستید.\n"
                                 "قبل از ارسال پیش‌نمایش نشان داده می‌شود.", kb([[("❌ لغو", "o:ann:cancel")]]), mid)

    def announcement_text(self, body: str) -> str:
        return f"📢 <b>اطلاعیه آموخت</b>\n\n{esc(body)}"

    async def owner_announce_preview(self, chat_id, body: str) -> None:
        if len(body) > 3500:
            await self.send(chat_id, "متن خیلی بلند است (حداکثر ۳۵۰۰ نویسه). کوتاه‌تر بفرستید.")
            return
        await self.set_await(chat_id, None)
        await self.redis.set(DRAFT_KEY.format(chat_id), body, ex=3600)
        recipients = [l for l in await store.active_links() if store.prefs_of(l["prefs"])["announcements"]]
        await self.send(chat_id, "👀 <b>پیش‌نمایش:</b>\n\n" + self.announcement_text(body) +
                        f"\n\n— گیرندگان تلگرام: <b>{fa(len(recipients))}</b> نفر",
                        kb([[(f"✅ ارسال در تلگرام + بنر سایت", "o:ann:all")],
                            [("📨 فقط تلگرام", "o:ann:tg"), ("❌ لغو", "o:ann:cancel")]]))

    async def owner_announce_send(self, chat_id, mid, show_on_site: bool) -> None:
        raw = await self.redis.get(DRAFT_KEY.format(chat_id))
        if not raw:
            await self.show(chat_id, "پیش‌نویسی پیدا نشد (منقضی شده). دوباره «اطلاعیه جدید» را بزنید.", kb([[("« پنل مدیریت", "m")]]), mid)
            return
        await self.redis.delete(DRAFT_KEY.format(chat_id))
        body = raw.decode() if isinstance(raw, bytes) else raw
        ann_id = await store.create_announcement(body, show_on_site)
        recipients = [l for l in await store.active_links() if store.prefs_of(l["prefs"])["announcements"]]
        await self.show(chat_id, f"⏳ در حال ارسال برای {fa(len(recipients))} نفر…", None, mid)
        sent = failed = 0
        message = self.announcement_text(body)
        markup = kb([[("🌐 باز کردن آموخت", SITE)]])
        for link in recipients:
            if str(link["chat_id"]) == str(chat_id):
                continue
            result = await self.send(link["chat_id"], message, markup)
            sent += 1 if result else 0
            failed += 0 if result else 1
            await asyncio.sleep(0.06)  # stay far below Telegram's 30 msg/s
        await store.finish_announcement(ann_id, sent, failed)
        await self.show(chat_id, f"✅ <b>اطلاعیه ارسال شد</b>\n\n📨 رسید: {fa(sent)}"
                                 + (f" · ❌ ناموفق: {fa(failed)}" if failed else "")
                                 + ("\n🖥 روی داشبورد سایت هم به‌صورت بنر نمایش داده می‌شود (۱۴ روز)." if show_on_site else ""),
                        kb([[("📜 اطلاعیه‌ها", "o:anns"), ("« پنل مدیریت", "m")]]), mid)

    async def owner_announcements(self, chat_id, mid, notice: str = "") -> None:
        active = await store.active_announcements()
        past = await store.past_announcements(8)
        if not active and not past:
            await self.show(chat_id, "هنوز اطلاعیه‌ای ارسال نشده.", kb([[("📢 اطلاعیه جدید", "o:ann"), ("« پنل مدیریت", "m")]]), mid)
            return

        def snippet(a: dict, n: int = 80) -> str:
            t = " ".join(str(a["text"]).split())
            return esc(t[:n] + ("…" if len(t) > n else ""))

        def delivery(a: dict) -> str:
            return f"📨 {fa(a['sent'])}" + (f" · ❌ {fa(a['failed'])}" if a["failed"] else "")

        lines = [f"{notice}\n" if notice else "", "📜 <b>اطلاعیه‌ها و بنرها</b>", "",
                 f"🟢 <b>بنرهای فعال روی سایت ({fa(len(active))})</b>"]
        if active:
            for i, a in enumerate(active, 1):
                expires = f" · تا {fmt.jalali_date(a['expires_at'].astimezone(fmt.zone(fmt.OWNER_TZ)), with_weekday=False)}" if a.get("expires_at") else ""
                lines.append(f"<b>{fa(i)}.</b> {snippet(a)}\n     🕒 {fmt.local_stamp(a['created_at'])}\n     {delivery(a)}{expires}")
        else:
            lines.append("بنر فعالی روی سایت نیست.")
        lines += ["", f"🗂 <b>تاریخچه</b> (آخرین {fa(len(past))})" if past else "🗂 <b>تاریخچه</b>"]
        if past:
            now = datetime.now(timezone.utc)
            for a in past:
                if a.get("hidden_at"):
                    status = "🙈 بنر برداشته شد"
                elif a.get("show_on_site") and a.get("expires_at") and aware(a["expires_at"]) <= now:
                    status = "⌛️ بنر منقضی شد"
                else:
                    status = "💬 فقط تلگرام"
                lines.append(f"• {snippet(a, 60)}\n     🕒 {fmt.local_stamp(a['created_at'])} · {status} · {delivery(a)}")
        else:
            lines.append("هنوز موردی در تاریخچه نیست.")

        rows: list[list[tuple[str, str]]] = []
        buttons = [(f"🙈 برداشتن بنر {fa(i)}", f"o:hide:{a['id']}") for i, a in enumerate(active, 1)]
        for k in range(0, len(buttons), 2):
            rows.append(buttons[k:k + 2])
        rows.append([("📢 اطلاعیه جدید", "o:ann"), ("« پنل مدیریت", "m")])
        await self.show(chat_id, "\n".join(lines).lstrip("\n"), kb(rows), mid)

    # ---- scheduler -------------------------------------------------------------------------------------------

    async def scheduler(self) -> None:
        await asyncio.sleep(20)
        while not self.stop_event.is_set():
            try:
                await self.tick()
            except Exception:
                log.exception("scheduler tick failed")
            try:
                await asyncio.wait_for(self.stop_event.wait(), timeout=60)
            except asyncio.TimeoutError:
                pass

    async def tick(self) -> None:
        now_owner = fmt.now_in(fmt.OWNER_TZ)
        if (now_owner.hour, now_owner.minute) >= OWNER_STATS_AT and now_owner.hour < 24:
            if await self.once("ownerstats", "owner", now_owner.date().isoformat()):
                await self.send(self.owner, await self.stats_text("🌙 <b>گزارش شبانه آموخت</b>"),
                                kb([[("👑 پنل مدیریت", "m")]]))
        for link in await store.active_links():
            try:
                await self.tick_user(link)
            except Exception:
                log.exception("tick for one user failed")

    async def tick_user(self, link: dict) -> None:
        pr = store.prefs_of(link["prefs"])
        state = as_dict(link["state_data"])
        p = store.today_progress(state)
        now = p["local_now"]
        day = p["today"]
        uid = link["user_id"]
        chat = link["chat_id"]
        # Evening reminder: only if nothing was studied yet today, within 3 h of the chosen time.
        if pr["reminders"] and p["notifications"] and pr["reminder_hour"] <= now.hour < pr["reminder_hour"] + 3 and not p["studied"]:
            if await self.once("rem", uid, day):
                await self.send(chat, self.reminder_text(p, state), kb([[("🚀 شروع مطالعه", SITE)], [("⚙️ تنظیمات", "u:set")]]))
        # Nightly summary of the day.
        if pr["summary"] and pr["summary_hour"] <= now.hour < pr["summary_hour"] + 2:
            if await self.once("sum", uid, day):
                await self.send(chat, self.summary_text(p, state), kb([[("🗓 برنامه من", "u:plan"), ("🌐 آموخت", SITE)]]))

    def reminder_text(self, p: dict, state: dict) -> str:
        name = esc(p["name"]) or "دوست عزیز"
        last = last_study_date(state)
        gap = (p["local_now"].date() - last).days if last else None
        if p["streak"] >= 2:
            head = f"🔥 <b>{name}، زنجیره {fa(p['streak'])} روزه‌ات در خطره!</b>"
            body = "امروز هنوز مطالعه‌ای ثبت نشده. همین الان حتی ۱۵ دقیقه هم زنجیره را نگه می‌دارد."
        elif gap is not None and gap >= 3:
            head = f"👋 <b>{name}، دلمان برایت تنگ شده!</b>"
            body = f"{fa(gap)} روز است مطالعه‌ای ثبت نشده. با یک قدم کوچک امروز دوباره به برنامه برگرد."
        else:
            head = f"⏰ <b>{name}، وقت مطالعه است!</b>"
            body = "امروز هنوز مطالعه‌ای ثبت نشده. برنامه امروزت منتظرت است."
        extra = ""
        if p["exam_days"] is not None and 0 <= p["exam_days"] <= 60:
            extra = f"\n\n⏳ فقط {fa(p['exam_days'])} روز تا آزمون مانده."
        return f"{head}\n\n{body}{extra}"

    def summary_text(self, p: dict, state: dict) -> str:
        text_ = self.today_text(p, "🌙 <b>گزارش امروز تو</b>")
        target = p["target_min"] * 60
        if p["studied_secs"] >= target:
            note = "🏆 هدف امروز کامل شد؛ آفرین! فردا هم با همین انرژی."
        elif p["studied"]:
            note = f"👏 خوب بود! {fmt.duration_fa(target - p['studied_secs'])} تا هدف کامل مانده بود؛ فردا جبران می‌کنی."
        else:
            note = "😴 امروز مطالعه‌ای ثبت نشد. فردا یک شروع تازه است — حتی کوتاه."
        if p["exam_days"] in EXAM_MILESTONES:
            note += f"\n\n📌 <b>{fa(p['exam_days'])} روز تا آزمون!</b>"
        return f"{text_}\n\n{note}"

    # ---- run -------------------------------------------------------------------------------------------------

    async def run(self) -> None:
        s = self.settings
        await init_db(s.DATABASE_URL)
        await init_redis(s.REDIS_URL)
        await store.ensure_tables()
        while True:
            try:
                await self.setup()
                break
            except Exception:
                log.exception("bot setup failed; retrying in 30 s")
                await asyncio.sleep(30)
        tasks = [asyncio.create_task(self.poll(), name="poll"), asyncio.create_task(self.scheduler(), name="scheduler")]
        await self.stop_event.wait()
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await self.api.close()
        await close_redis()
        await close_db()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    svc = BotService()
    if not svc.token or not svc.owner:
        raise SystemExit("TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID missing")
    loop = asyncio.new_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, svc.stop_event.set)
    loop.run_until_complete(svc.run())


if __name__ == "__main__":
    main()
