#!/bin/bash

# Скрипт автоматического деплоя через SFTP
# Использование: ./deploy-sftp.sh

set -e

HOST="rocket-da6.hostsila.org"
USER="shmfjhml"
PORT="22"
PASSWORD="j2Z2ZHqyp.4T]6"
REMOTE_PATH="/home/shmfjhml/domains/vitoluxua.com/public_html"
DB_PASSWORD="j2Z2ZHqyp.4T]6"

echo "🚀 Начало деплоя VitoluxUA через SFTP..."

# Проверка наличия собранных проектов
if [ ! -d "frontend/dist" ]; then
    echo "❌ Ошибка: frontend/dist не найден"
    exit 1
fi

if [ ! -d "admin/dist" ]; then
    echo "❌ Ошибка: admin/dist не найден"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ Ошибка: backend не найден"
    exit 1
fi

echo "✅ Проекты готовы к загрузке"

# Используем sshpass для автоматической передачи пароля
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass не установлен. Установите: brew install hudochenkov/sshpass/sshpass"
    echo "Или выполните загрузку вручную через FileZilla"
    exit 1
fi

echo "📤 Загрузка backend..."
sshpass -p "$PASSWORD" rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' \
    -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
    backend/ ${USER}@${HOST}:${REMOTE_PATH}/

echo "📤 Загрузка frontend..."
sshpass -p "$PASSWORD" rsync -avz --delete \
    -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
    frontend/dist/ ${USER}@${HOST}:${REMOTE_PATH}/

echo "📤 Загрузка admin..."
sshpass -p "$PASSWORD" rsync -avz --delete \
    -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
    admin/dist/ ${USER}@${HOST}:${REMOTE_PATH}/admin/

echo "✅ Файлы загружены!"

echo "⚙️  Настройка на сервере..."

# Создание .env через SSH
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no ${USER}@${HOST} << EOF
cd ${REMOTE_PATH}
cp .env.example .env
cat > .env << EOL
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=https://vitoluxua.com
APP_LOCALE=uk
APP_FALLBACK_LOCALE=en

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=${DB_PASSWORD}

SESSION_DRIVER=database
SESSION_LIFETIME=120

CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostsila.org
MAIL_PORT=587
MAIL_FROM_ADDRESS="info@vitoluxua.com"
MAIL_FROM_NAME="VitoluxUA"

CONTACT_PHONE=+380XXXXXXXXX
CONTACT_EMAIL=info@vitoluxua.com

SANCTUM_STATEFUL_DOMAINS=vitoluxua.com
SESSION_DOMAIN=vitoluxua.com
EOL

composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
EOF

echo "✅ Деплой завершен!"
echo "🌐 Проверьте сайт: https://vitoluxua.com"
