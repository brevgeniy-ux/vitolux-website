# 🚨 Telegram-бот воздушных тревог Украины

Бот следит за обстановкой по всей Украине — воздушные тревоги (ракеты,
дроны, авиация), угроза артобстрела, уличные бои, химическая и радиационная
угроза — и присылает уведомления о начале тревоги (🔴) и отбое (🟢).

**Каждый пользователь сам выбирает регионы**: любые области, Киев,
Севастополь, Крым — или всю Украину сразу.

## Возможности

- 🗺 `/regions` — выбор регионов инлайн-кнопками (мультивыбор с галочками,
  кнопка «Вся Украина»)
- 📡 `/status` — текущие активные тревоги по вашим регионам
- 🔴/🟢 автоматические уведомления о начале и отбое тревоги
- 🔕 `/stop` и 🔔 `/resume` — пауза и возобновление уведомлений
- Типы угроз: 🚨 воздушная тревога, 💥 артобстрел, ⚔️ уличные бои,
  ☣️ химическая, ☢️ радиационная
- Два источника данных: [alerts.in.ua](https://alerts.in.ua) (основной,
  с типами угроз) и ubilling.net.ua (резервный, без токена)
- Подписки хранятся в SQLite и переживают перезапуск

## Быстрый старт

### 1. Создайте бота в Telegram

Напишите [@BotFather](https://t.me/BotFather) → `/newbot` → получите токен.

### 2. (Желательно) получите токен alerts.in.ua

Бесплатный токен API запрашивается на [alerts.in.ua](https://alerts.in.ua)
(раздел для разработчиков — [devs.alerts.in.ua](https://devs.alerts.in.ua)).
С ним бот различает типы угроз. Без него — работает через резервный
источник и сообщает только факт воздушной тревоги.

### 3. Запустите

```bash
cd alert-bot
cp .env.example .env        # впишите токены в .env

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python bot.py
```

### Либо через Docker

```bash
cd alert-bot
docker build -t alert-bot .
docker run -d --name alert-bot --restart unless-stopped \
  --env-file .env -v alert-bot-data:/data alert-bot
```

## Автозапуск через systemd (на сервере)

`/etc/systemd/system/alert-bot.service`:

```ini
[Unit]
Description=Ukraine Air Alert Telegram Bot
After=network-online.target

[Service]
WorkingDirectory=/opt/alert-bot
EnvironmentFile=/opt/alert-bot/.env
ExecStart=/opt/alert-bot/venv/bin/python bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now alert-bot
```

## Настройки (.env)

| Переменная           | Обязательно | Описание                                          |
|----------------------|-------------|---------------------------------------------------|
| `BOT_TOKEN`          | да          | Токен Telegram-бота от @BotFather                 |
| `ALERTS_IN_UA_TOKEN` | нет         | Токен API alerts.in.ua (даёт типы угроз)          |
| `POLL_INTERVAL`      | нет         | Период опроса API в секундах (по умолчанию 30)    |
| `DB_PATH`            | нет         | Путь к SQLite-базе (по умолчанию alertbot.sqlite3)|

## Как это работает

1. Бот опрашивает API каждые `POLL_INTERVAL` секунд и получает множество
   активных тревог вида «регион + тип угрозы».
2. Сравнивает с предыдущим состоянием: новые пары → уведомление о тревоге,
   исчезнувшие → отбой (отбой шлётся, только когда в регионе не осталось
   ни одной активной угрозы).
3. Рассылает изменения подписчикам выбранных регионов одним сообщением
   на пользователя. Заблокировавшие бота удаляются из базы автоматически.
4. При рестарте первое состояние запоминается без рассылки, чтобы не
   спамить уже идущими тревогами.

## Структура

```
alert-bot/
├── bot.py          # команды, кнопки, цикл опроса и рассылка
├── alerts_api.py   # клиенты API alerts.in.ua и резервного источника
├── regions.py      # справочник 27 регионов Украины
├── storage.py      # SQLite-хранилище подписок
├── config.py       # конфигурация из окружения/.env
├── requirements.txt
├── Dockerfile
└── .env.example
```
