#!/bin/bash

# Полный скрипт настройки на сервере
# Выполните на сервере после загрузки файлов

set -e

echo "🚀 Настройка VitoluxUA на сервере..."

cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env
echo "📝 Создание .env файла..."
cp .env.example .env

cat > .env << 'EOF'
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
EOF

echo "✅ .env создан"

# Установка зависимостей
echo "📦 Установка зависимостей Composer..."
composer install --optimize-autoloader --no-dev

# Настройка Laravel
echo "🔑 Генерация ключа приложения..."
php artisan key:generate

echo "🗄️  Выполнение миграций..."
php artisan migrate --force

echo "🌱 Заполнение тестовыми данными..."
php artisan db:seed

echo "🔗 Создание симлинка storage..."
php artisan storage:link

echo "⚡ Кеширование конфигурации..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔒 Настройка прав доступа..."
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "🌐 Проверьте сайт:"
echo "   - API: https://vitoluxua.com/api/health"
echo "   - Главная: https://vitoluxua.com"
echo "   - Админка: https://vitoluxua.com/admin"
echo ""
echo "🔑 Вход в админку:"
echo "   Email: admin@vitoluxua.com"
echo "   Пароль: admin123"
