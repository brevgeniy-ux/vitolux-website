#!/bin/bash

# Скрипт для выполнения деплоя (требует ввода пароля вручную)
# Использование: ./EXECUTE_DEPLOY.sh

set -e

HOST="rocket-da6.hostsila.org"
USER="shmfjhml"
PORT="22"
REMOTE_PATH="/home/shmfjhml/domains/vitoluxua.com/public_html"
DB_PASSWORD="j2Z2ZHqyp.4T]6"

echo "🚀 Деплой VitoluxUA"
echo "Пароль для подключения: j2Z2ZHqyp.4T]6"
echo ""

# Загрузка backend
echo "📤 Загрузка backend..."
echo "Введите пароль когда будет запрошен: j2Z2ZHqyp.4T]6"
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' --exclude '.DS_Store' \
    -e "ssh -p $PORT" \
    backend/ ${USER}@${HOST}:${REMOTE_PATH}/

# Загрузка frontend
echo ""
echo "📤 Загрузка frontend..."
echo "Введите пароль когда будет запрошен: j2Z2ZHqyp.4T]6"
rsync -avz --delete \
    -e "ssh -p $PORT" \
    frontend/dist/ ${USER}@${HOST}:${REMOTE_PATH}/

# Загрузка admin
echo ""
echo "📤 Загрузка admin..."
echo "Введите пароль когда будет запрошен: j2Z2ZHqyp.4T]6"
rsync -avz --delete \
    -e "ssh -p $PORT" \
    admin/dist/ ${USER}@${HOST}:${REMOTE_PATH}/admin/

echo ""
echo "✅ Файлы загружены!"
echo ""
echo "⚙️  Теперь выполните настройку на сервере:"
echo ""
echo "ssh ${USER}@${HOST} -p ${PORT}"
echo ""
echo "Затем выполните команды из файла: server-setup-production.sh"
echo "Или скопируйте и выполните следующие команды:"
echo ""
cat << 'EOF'
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env
cp .env.example .env
cat > .env << 'EOL'
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
DB_PASSWORD=j2Z2ZHqyp.4T]6

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

# Установка зависимостей
composer install --optimize-autoloader --no-dev

# Настройка Laravel
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Права доступа
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
EOF

echo ""
echo "🌐 После выполнения проверьте:"
echo "   - https://vitoluxua.com/api/health"
echo "   - https://vitoluxua.com"
echo "   - https://vitoluxua.com/admin"
