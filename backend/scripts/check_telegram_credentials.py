"""Validate Telegram credentials without printing either secret."""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from dotenv import load_dotenv


def telegram_call(token: str, method: str, **params):
    query = urllib.parse.urlencode(params)
    url = f"https://api.telegram.org/bot{token}/{method}"
    if query:
        url += f"?{query}"
    with urllib.request.urlopen(url, timeout=20) as response:
        return json.load(response)


def main() -> int:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Telegram credentials are incomplete", file=sys.stderr)
        return 2
    me = telegram_call(token, "getMe")
    chat = telegram_call(token, "getChat", chat_id=chat_id)
    if not me.get("ok") or not chat.get("ok"):
        print("Telegram rejected the credentials", file=sys.stderr)
        return 3
    if "--send-test" in sys.argv:
        result = telegram_call(
            token,
            "sendMessage",
            chat_id=chat_id,
            text="✅ ربات مدیریتی آموخت با موفقیت فعال شد.",
        )
        if not result.get("ok"):
            print("Telegram test message failed", file=sys.stderr)
            return 4
        print("TELEGRAM_TEST_MESSAGE_OK")
    print("TELEGRAM_CREDENTIALS_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
