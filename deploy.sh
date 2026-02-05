#!/bin/bash

# Скрипт деплоя VitoluxUA на хостинг
# Использование: ./deploy.sh

set -e

echo "🚀 Начало деплоя VitoluxUA..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Параметры подключения
HOST="rocket-da6.hostsila.org"
USER="shmfjhml"
PORT="22"
REMOTE_PATH="/home/shmfjhml/domains/vitoluxua.com"
REMOTE_PUBLIC="/home/shmfjhml/domains/vitoluxua.com/public_html"

# Проверка наличия SSH ключа
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${YELLOW}⚠️  SSH ключ не найден. Будет использован пароль.${NC}"
fi

echo -e "${GREEN}📦 Шаг 1: Сборка Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

echo -e "${GREEN}📦 Шаг 2: Сборка Admin Panel...${NC}"
cd admin
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

echo -e "${GREEN}📤 Шаг 3: Загрузка файлов на сервер...${NC}"

# Создание временной директории для backend
echo "Загрузка backend..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' \
    -e "ssh -p $PORT" \
    backend/ ${USER}@${HOST}:${REMOTE_PUBLIC}/

# Загрузка frontend
echo "Загрузка frontend..."
rsync -avz --delete \
    -e "ssh -p $PORT" \
    frontend/dist/ ${USER}@${HOST}:${REMOTE_PUBLIC}/

# Загрузка admin
echo "Загрузка admin panel..."
rsync -avz --delete \
    -e "ssh -p $PORT" \
    admin/dist/ ${USER}@${HOST}:${REMOTE_PUBLIC}/admin/

echo -e "${GREEN}✅ Файлы загружены!${NC}"
echo -e "${YELLOW}📝 Теперь выполните на сервере:${NC}"
echo ""
echo "ssh ${USER}@${HOST} -p ${PORT}"
echo "cd ${REMOTE_PUBLIC}"
echo "composer install --optimize-autoloader --no-dev"
echo "php artisan key:generate"
echo "php artisan migrate --force"
echo "php artisan storage:link"
echo "php artisan config:cache"
echo "php artisan route:cache"
echo "php artisan view:cache"
echo "chmod -R 755 storage bootstrap/cache"

echo -e "${GREEN}🎉 Деплой завершен!${NC}"
