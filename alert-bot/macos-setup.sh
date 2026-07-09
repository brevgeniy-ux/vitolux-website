#!/bin/bash
# Выполняется НА Mac mini: ставит окружение и регистрирует бота в launchd,
# чтобы он стартовал автоматически при загрузке и перезапускался при падении.
set -e
cd "$HOME/alert-bot"

echo "== Поиск Python 3.8+ =="
BEST=""
for cand in /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3 python3; do
    p=$(command -v "$cand" 2>/dev/null || true)
    [ -z "$p" ] && { [ -x "$cand" ] && p="$cand" || continue; }
    if "$p" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' 2>/dev/null; then
        BEST="$p"; break
    fi
done
if [ -z "$BEST" ]; then
    echo "Python 3.8+ не найден. Пробую установить через Homebrew..."
    if command -v brew >/dev/null 2>&1; then
        brew install python@3.12
        BEST="$(brew --prefix)/bin/python3"
    else
        echo "ОШИБКА: нет Python 3.8+ и нет Homebrew. Установите Xcode CLT: xcode-select --install" >&2
        exit 1
    fi
fi
echo "Использую: $BEST ($("$BEST" -V 2>&1))"

echo "== Виртуальное окружение и зависимости =="
"$BEST" -m venv venv
venv/bin/pip install --quiet --upgrade pip >/dev/null 2>&1 || true
venv/bin/pip install --quiet -r requirements.txt
PYRUN="$HOME/alert-bot/venv/bin/python3"

echo "== Регистрация в launchd =="
PLIST="$HOME/Library/LaunchAgents/com.vitolux.alertbot.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.vitolux.alertbot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYRUN</string>
        <string>$HOME/alert-bot/bot.py</string>
    </array>
    <key>WorkingDirectory</key><string>$HOME/alert-bot</string>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>$HOME/alert-bot/bot.log</string>
    <key>StandardErrorPath</key><string>$HOME/alert-bot/bot.log</string>
</dict>
</plist>
PLISTEOF

# Перезагружаем сервис
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
sleep 8

echo "== Проверка =="
if launchctl list | grep -q com.vitolux.alertbot && pgrep -f "alert-bot/bot.py" >/dev/null 2>&1; then
    echo "== БОТ ЗАПУЩЕН (pid: $(pgrep -f 'alert-bot/bot.py' | head -1)) =="
else
    echo "== ВНИМАНИЕ: процесс не подтверждён, лог: ==" >&2
    tail -30 bot.log 2>/dev/null >&2 || true
fi
echo "== Последние строки лога =="
tail -15 bot.log 2>/dev/null || echo "(лог пуст — бот только стартовал)"
