# -*- coding: utf-8 -*-
"""Конфигурация бота из переменных окружения (.env поддерживается)."""

import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# Токен Telegram-бота от @BotFather — обязателен.
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()

# Токен API alerts.in.ua (https://alerts.in.ua — раздел API).
# Необязателен: без него бот использует бесплатный источник ubilling.net.ua,
# но alerts.in.ua даёт типы угроз (ракеты, дроны, артобстрел и т.д.).
ALERTS_IN_UA_TOKEN = os.getenv("ALERTS_IN_UA_TOKEN", "").strip()

# Период опроса API, секунд (не ставьте меньше 15 — лимиты API).
POLL_INTERVAL = max(15, int(os.getenv("POLL_INTERVAL", "30")))

# Путь к файлу базы данных подписок.
DB_PATH = os.getenv("DB_PATH", "alertbot.sqlite3")
