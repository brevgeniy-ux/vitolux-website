#!/bin/bash

# Скрипт настройки Laravel на сервере
# Выполните на сервере: bash configure-server.sh

set -e

echo "🚀 Настройка Laravel на сервере..."

cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env файла
echo "📝 Создание .env файла..."
cp .env.example .env

# Запись конфигурации в .env
echo "📝 Настройка .env..."
cat > .env << 'EOF'
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vitoluxua.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=j2Z2ZHqyp.4T]6

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

SANCTUM_STATEFUL_DOMAINS=vitoluxua.com
SESSION_DOMAIN=vitoluxua.com
EOF

echo "✅ .env файл создан"

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

echo ""
echo "✅ Настройка Laravel завершена!"
echo ""
echo "🌐 Проверьте сайт:"
echo "   - https://vitoluxua.com"
echo "   - https://vitoluxua.com/admin"
echo ""
echo "🔑 Вход в админку:"
echo "   Email: admin@vitoluxua.com"
echo "   Пароль: admin123"
