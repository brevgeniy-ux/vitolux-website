# -*- coding: utf-8 -*-
from __future__ import annotations

"""
Telegram-бот воздушных тревог Украины.

Следит за тревогами (ракеты, дроны, авиация, артобстрелы и др.) по всей
Украине и присылает уведомления. Каждый пользователь выбирает свои регионы
или подписывается на всю страну.

Запуск:  BOT_TOKEN=... python bot.py
"""

import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    BotCommand,
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

import config
from alerts_api import AlertsClient, describe_type
from regions import REGION_ID, REGION_LIST, display_name
from storage import Storage

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
log = logging.getLogger("alertbot")

storage = Storage(config.DB_PATH)
alerts_client = AlertsClient(config.ALERTS_IN_UA_TOKEN)
dp = Dispatcher()

# Текущее состояние тревог: множество пар (регион, тип). None — до первого опроса.
current_alerts: set[tuple[str, str]] | None = None


# ---------------------------------------------------------------- клавиатуры

def regions_keyboard(chat_id: int) -> InlineKeyboardMarkup:
    selected = set(storage.get_regions(chat_id))
    rows = []
    row = []
    for name in REGION_LIST:
        mark = "✅ " if name in selected else ""
        row.append(
            InlineKeyboardButton(
                text=f"{mark}{display_name(name)}",
                callback_data=f"r:{REGION_ID[name]}",
            )
        )
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    all_mark = "✅ " if not selected else ""
    rows.append(
        [
            InlineKeyboardButton(text=f"{all_mark}🇺🇦 Вся Украина", callback_data="r:all"),
            InlineKeyboardButton(text="Готово ✔️", callback_data="r:done"),
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def subscription_text(chat_id: int) -> str:
    regions = storage.get_regions(chat_id)
    if not regions:
        return "🇺🇦 <b>Вся Украина</b>"
    return "\n".join(f"• {display_name(r)}" for r in sorted(regions, key=REGION_LIST.index))


# ------------------------------------------------------------------- команды

@dp.message(CommandStart())
async def cmd_start(message: Message):
    storage.ensure_user(message.chat.id)
    storage.set_enabled(message.chat.id, True)
    await message.answer(
        "👋 Привет! Я слежу за воздушными тревогами по всей Украине: "
        "ракеты, дроны, авиация, артобстрелы и другие угрозы.\n\n"
        "Сейчас вы подписаны на <b>всю Украину</b>. "
        "Выбрать отдельные регионы — /regions\n\n"
        "Команды:\n"
        "/regions — выбрать регионы\n"
        "/status — что происходит сейчас\n"
        "/stop — приостановить уведомления\n"
        "/resume — возобновить уведомления\n"
        "/help — справка"
    )


@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "ℹ️ <b>Как пользоваться</b>\n\n"
        "Я присылаю уведомление, когда в ваших регионах объявляют тревогу "
        "(🔴) и когда дают отбой (🟢).\n\n"
        "/regions — выбрать регионы. Отмечайте нужные галочками; "
        "если не выбрано ничего — вы подписаны на всю Украину.\n"
        "/status — текущие тревоги по вашим регионам.\n"
        "/stop и /resume — пауза и возобновление уведомлений.\n\n"
        "Типы угроз: 🚨 воздушная тревога (ракеты/дроны/авиация), "
        "💥 артобстрел, ⚔️ уличные бои, ☣️ химическая, ☢️ радиационная."
    )


@dp.message(Command("regions"))
async def cmd_regions(message: Message):
    storage.ensure_user(message.chat.id)
    await message.answer(
        "🗺 Выберите регионы (можно несколько). "
        "Если ничего не выбрано — подписка на всю Украину:",
        reply_markup=regions_keyboard(message.chat.id),
    )


@dp.message(Command("status"))
async def cmd_status(message: Message):
    storage.ensure_user(message.chat.id)
    if current_alerts is None:
        await message.answer("⏳ Данные ещё загружаются, попробуйте через минуту.")
        return

    my_regions = storage.get_regions(message.chat.id)
    relevant = [
        (region, alert_type)
        for region, alert_type in sorted(current_alerts)
        if not my_regions or region in my_regions
    ]
    scope = "по вашим регионам" if my_regions else "по Украине"
    if not relevant:
        await message.answer(f"🟢 Сейчас тревог {scope} нет. Спокойно!")
        return

    lines = [f"🔴 <b>Активные тревоги {scope}:</b>\n"]
    for region, alert_type in relevant:
        emoji, title = describe_type(alert_type)
        lines.append(f"{emoji} <b>{display_name(region)}</b> — {title}")
    await message.answer("\n".join(lines))


@dp.message(Command("stop"))
async def cmd_stop(message: Message):
    storage.set_enabled(message.chat.id, False)
    await message.answer("🔕 Уведомления приостановлены. Включить снова — /resume")


@dp.message(Command("resume"))
async def cmd_resume(message: Message):
    storage.set_enabled(message.chat.id, True)
    await message.answer("🔔 Уведомления включены. Ваша подписка:\n" + subscription_text(message.chat.id))


# ------------------------------------------------------------------ кнопки

@dp.callback_query(F.data.startswith("r:"))
async def on_region_button(query: CallbackQuery):
    chat_id = query.message.chat.id
    action = query.data.split(":", 1)[1]

    if action == "done":
        await query.message.edit_text(
            "✅ Подписка сохранена:\n" + subscription_text(chat_id) +
            "\n\nИзменить — /regions, текущая обстановка — /status"
        )
        await query.answer("Сохранено")
        return

    if action == "all":
        storage.set_regions(chat_id, [])
        await query.answer("Подписка на всю Украину")
    else:
        try:
            region = REGION_LIST[int(action)]
        except (ValueError, IndexError):
            await query.answer()
            return
        regions = storage.toggle_region(chat_id, region)
        state = "добавлен" if region in regions else "убран"
        await query.answer(f"{display_name(region)} {state}")

    try:
        await query.message.edit_reply_markup(reply_markup=regions_keyboard(chat_id))
    except Exception:
        pass  # разметка не изменилась — Telegram кидает ошибку, это не страшно


# ------------------------------------------------------------------- поллер

async def send_safe(bot: Bot, chat_id: int, text: str):
    try:
        await bot.send_message(chat_id, text)
    except TelegramRetryAfter as e:
        await asyncio.sleep(e.retry_after)
        try:
            await bot.send_message(chat_id, text)
        except Exception:
            pass
    except TelegramForbiddenError:
        # Пользователь заблокировал бота — убираем из рассылки
        storage.remove_user(chat_id)
    except Exception as e:
        log.warning("Не удалось отправить сообщение %s: %s", chat_id, e)


async def poll_alerts(bot: Bot):
    global current_alerts
    while True:
        try:
            fetched = await alerts_client.fetch_active()
            if fetched is not None:
                if current_alerts is None:
                    # Первый успешный опрос: запоминаем состояние без рассылки,
                    # чтобы не заспамить всех уже идущими тревогами при рестарте.
                    log.info("Начальное состояние: %d активных тревог", len(fetched))
                else:
                    started = fetched - current_alerts
                    ended = current_alerts - fetched
                    if started or ended:
                        await notify_changes(bot, started, ended, fetched)
                current_alerts = fetched
        except Exception:
            log.exception("Ошибка в цикле опроса")
        await asyncio.sleep(config.POLL_INTERVAL)


async def notify_changes(
    bot: Bot,
    started: set[tuple[str, str]],
    ended: set[tuple[str, str]],
    active_now: set[tuple[str, str]],
):
    """Собирает изменения в одно сообщение на пользователя и рассылает."""
    per_user: dict[int, list[str]] = {}

    active_regions = {region for region, _ in active_now}

    for region, alert_type in sorted(started):
        emoji, title = describe_type(alert_type)
        line = f"🔴 {emoji} <b>{display_name(region)}</b>\n{title}!"
        for chat_id in storage.recipients_for(region):
            per_user.setdefault(chat_id, []).append(line)

    for region, alert_type in sorted(ended):
        # «Отбой» шлём только если в регионе не осталось других тревог
        if region in active_regions:
            continue
        line = f"🟢 <b>{display_name(region)}</b>\nОтбой тревоги."
        for chat_id in storage.recipients_for(region):
            per_user.setdefault(chat_id, []).append(line)

    log.info(
        "Изменения: +%d / -%d, получателей: %d",
        len(started), len(ended), len(per_user),
    )
    for chat_id, lines in per_user.items():
        # dict.fromkeys — дедупликация «отбоев» по региону с сохранением порядка
        await send_safe(bot, chat_id, "\n\n".join(dict.fromkeys(lines)))


# -------------------------------------------------------------------- запуск

async def main():
    if not config.BOT_TOKEN:
        raise SystemExit(
            "Не задан BOT_TOKEN. Получите токен у @BotFather и укажите его "
            "в переменной окружения или файле .env"
        )
    if not config.ALERTS_IN_UA_TOKEN:
        log.warning(
            "ALERTS_IN_UA_TOKEN не задан — использую резервный источник "
            "(только факт воздушной тревоги, без типов угроз)."
        )

    bot = Bot(config.BOT_TOKEN, default=DefaultBotProperties(parse_mode="HTML"))
    await bot.set_my_commands(
        [
            BotCommand(command="regions", description="🗺 Выбрать регионы"),
            BotCommand(command="status", description="📡 Текущая обстановка"),
            BotCommand(command="stop", description="🔕 Пауза уведомлений"),
            BotCommand(command="resume", description="🔔 Включить уведомления"),
            BotCommand(command="help", description="ℹ️ Справка"),
        ]
    )

    poller = asyncio.create_task(poll_alerts(bot))
    try:
        log.info("Бот запущен, период опроса %d с", config.POLL_INTERVAL)
        await dp.start_polling(bot)
    finally:
        poller.cancel()
        await alerts_client.close()
        storage.close()


if __name__ == "__main__":
    asyncio.run(main())
