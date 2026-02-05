#!/bin/bash

# Ручной деплой через SFTP (требует ввода пароля)
# Использование: ./deploy-manual.sh

set -e

HOST="rocket-da6.hostsila.org"
USER="shmfjhml"
PORT="22"
REMOTE_PATH="/home/shmfjhml/domains/vitoluxua.com/public_html"
DB_PASSWORD="j2Z2ZHqyp.4T]6"

echo "🚀 Деплой VitoluxUA через SFTP"
echo "Пароль: j2Z2ZHqyp.4T]6"
echo ""

echo "📤 Шаг 1: Загрузка backend..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' --exclude '.DS_Store' \
    -e "ssh -p $PORT" \
    backend/ ${USER}@${HOST}:${REMOTE_PATH}/

echo "📤 Шаг 2: Загрузка frontend..."
rsync -avz --delete \
    -e "ssh -p $PORT" \
    frontend/dist/ ${USER}@${HOST}:${REMOTE_PATH}/

echo "📤 Шаг 3: Загрузка admin..."
rsync -avz --delete \
    -e "ssh -p $PORT" \
    admin/dist/ ${USER}@${HOST}:${REMOTE_PATH}/admin/

echo "✅ Файлы загружены!"
echo ""
echo "⚙️  Шаг 4: Настройка на сервере..."
echo "Выполните следующие команды на сервере:"
echo ""
echo "ssh ${USER}@${HOST} -p ${PORT}"
echo "cd ${REMOTE_PATH}"
echo "cp .env.example .env"
echo ""
echo "Затем отредактируйте .env и выполните:"
echo "composer install --optimize-autoloader --no-dev"
echo "php artisan key:generate"
echo "php artisan migrate --force"
echo "php artisan db:seed"
echo "php artisan storage:link"
echo "php artisan config:cache"
echo "php artisan route:cache"
echo "php artisan view:cache"
echo "chmod -R 755 storage bootstrap/cache"
