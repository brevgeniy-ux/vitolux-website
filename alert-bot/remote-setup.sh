#!/bin/bash
# Выполняется НА СЕРВЕРЕ (shared-хостинг): готовит окружение и запускает бота.
# Вызывается воркфлоу deploy-alert-bot.yml после загрузки файлов в ~/alert-bot.
set -e
cd "$HOME/alert-bot"

echo "== Поиск Python 3.8+ =="
BEST=""
for cand in python3.13 python3.12 python3.11 python3.10 python3.9 python3.8 \
    /opt/alt/python313/bin/python3.13 /opt/alt/python312/bin/python3.12 \
    /opt/alt/python311/bin/python3.11 /opt/alt/python310/bin/python3.10 \
    /opt/alt/python39/bin/python3.9 /opt/alt/python38/bin/python3.8 \
    python3; do
    p=$(command -v "$cand" 2>/dev/null || true)
    [ -z "$p" ] && { [ -x "$cand" ] && p="$cand" || continue; }
    if "$p" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' 2>/dev/null; then
        BEST="$p"
        break
    fi
done
if [ -z "$BEST" ]; then
    echo "ОШИБКА: на сервере не найден Python 3.8+" >&2
    exit 1
fi
echo "Использую: $BEST ($("$BEST" -V 2>&1))"

echo "== Установка зависимостей =="
PYRUN=""
if [ ! -x venv/bin/python ]; then
    "$BEST" -m venv venv 2>/dev/null || true
fi
if [ -x venv/bin/python ]; then
    venv/bin/pip install --quiet --upgrade pip >/dev/null 2>&1 || true
    venv/bin/pip install --quiet -r requirements.txt
    PYRUN="$HOME/alert-bot/venv/bin/python"
else
    echo "venv недоступен, ставлю пакеты в --user"
    "$BEST" -m pip install --user --quiet -r requirements.txt
    PYRUN="$BEST"
fi
echo "$PYRUN" > .pyrun
echo "Интерпретатор для запуска: $PYRUN"

echo "== Вотчдог-скрипт и cron =="
cat > run.sh <<RUNEOF
#!/bin/bash
cd "\$HOME/alert-bot"
if ! pgrep -f "alert-bot/bot.py" >/dev/null 2>&1; then
    nohup "\$(cat .pyrun)" "\$HOME/alert-bot/bot.py" >> bot.log 2>&1 &
fi
RUNEOF
chmod +x run.sh remote-setup.sh 2>/dev/null || true

CRON_LINE="*/5 * * * * /bin/bash $HOME/alert-bot/run.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'alert-bot/run.sh' ; echo "$CRON_LINE" ) | crontab -
echo "Cron установлен: $CRON_LINE"

echo "== (Пере)запуск бота =="
pkill -f "alert-bot/bot.py" 2>/dev/null || true
sleep 2
bash run.sh
sleep 8

if pgrep -f "alert-bot/bot.py" >/dev/null 2>&1; then
    echo "== БОТ ЗАПУЩЕН (pid: $(pgrep -f 'alert-bot/bot.py' | head -1)) =="
else
    echo "== ОШИБКА: процесс бота не поднялся, последние строки лога: ==" >&2
    tail -30 bot.log >&2 || true
    exit 1
fi

echo "== Последние строки лога =="
tail -15 bot.log || true
