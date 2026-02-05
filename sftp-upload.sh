#!/bin/bash

# Скрипт для загрузки файлов через SFTP
# Использование: ./sftp-upload.sh

set -e

echo "📤 Загрузка VitoluxUA через SFTP..."

# Параметры подключения
HOST="rocket-da6.hostsila.org"
USER="shmfjhml"
PORT="22"
REMOTE_PATH="/home/shmfjhml/domains/vitoluxua.com/public_html"

# Проверка наличия собранных проектов
if [ ! -d "frontend/dist" ]; then
    echo "❌ Ошибка: frontend/dist не найден. Выполните: cd frontend && npm run build"
    exit 1
fi

if [ ! -d "admin/dist" ]; then
    echo "❌ Ошибка: admin/dist не найден. Выполните: cd admin && npm run build"
    exit 1
fi

echo "✅ Проекты собраны"

# Создание временного скрипта для SFTP
SFTP_SCRIPT=$(mktemp)
cat > "$SFTP_SCRIPT" <<EOF
cd $REMOTE_PATH
lcd backend
put -r app
put -r bootstrap
put -r config
put -r database
put -r public
put -r routes
put -r storage
put artisan
put composer.json
put .env.example
lcd ../frontend/dist
put -r .
lcd ../../admin/dist
cd admin
put -r .
quit
EOF

echo "📋 Инструкции для загрузки через SFTP:"
echo ""
echo "1. Подключитесь к серверу:"
echo "   sftp -P $PORT $USER@$HOST"
echo ""
echo "2. Выполните команды:"
echo "   cd $REMOTE_PATH"
echo ""
echo "3. Загрузите backend:"
echo "   lcd $(pwd)/backend"
echo "   put -r app bootstrap config database public routes storage"
echo "   put artisan composer.json .env.example"
echo ""
echo "4. Загрузите frontend:"
echo "   lcd $(pwd)/frontend/dist"
echo "   put -r ."
echo ""
echo "5. Загрузите admin:"
echo "   lcd $(pwd)/admin/dist"
echo "   cd admin"
echo "   put -r ."
echo ""
echo "Или используйте FileZilla/WinSCP для графической загрузки."
echo ""
echo "📝 После загрузки выполните на сервере через SSH:"
echo "   ssh $USER@$HOST -p $PORT"
echo "   cd $REMOTE_PATH"
echo "   cp .env.example .env"
echo "   nano .env  # Замените DB_PASSWORD"
echo "   composer install --optimize-autoloader --no-dev"
echo "   php artisan key:generate"
echo "   php artisan migrate --force"
echo "   php artisan storage:link"
echo "   php artisan config:cache"
echo "   php artisan route:cache"
echo "   php artisan view:cache"
echo "   chmod -R 755 storage bootstrap/cache"

rm "$SFTP_SCRIPT"

echo ""
echo "✅ Инструкции готовы!"
