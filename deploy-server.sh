#!/bin/bash

# Скрипт для выполнения на сервере после загрузки файлов
# Загрузите этот файл на сервер и выполните: bash deploy-server.sh

set -e

echo "🚀 Настройка VitoluxUA на сервере..."

REMOTE_PUBLIC="/home/shmfjhml/domains/vitoluxua.com/public_html"
DB_NAME="shmfjhml_vitolux"
DB_USER="shmfjhml_vitolux"

cd $REMOTE_PUBLIC

echo "📦 Установка зависимостей Composer..."
composer install --optimize-autoloader --no-dev

echo "🔑 Генерация ключа приложения..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Файл .env создан из .env.example. Отредактируйте его с данными БД!"
fi

php artisan key:generate

echo "🗄️  Выполнение миграций..."
php artisan migrate --force

echo "🔗 Создание симлинка storage..."
php artisan storage:link

echo "⚡ Кеширование конфигурации..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔒 Настройка прав доступа..."
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

echo "✅ Настройка завершена!"
echo "🌐 Проверьте сайт: https://vitoluxua.com"
