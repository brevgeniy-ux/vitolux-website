#!/bin/bash

# Скрипт для выполнения на сервере после загрузки файлов через SFTP
# Загрузите этот файл на сервер и выполните: bash server-setup.sh

set -e

echo "🚀 Настройка VitoluxUA на сервере..."

REMOTE_PUBLIC="/home/shmfjhml/domains/vitoluxua.com/public_html"
DB_NAME="shmfjhml_vitolux"
DB_USER="shmfjhml_vitolux"

cd $REMOTE_PUBLIC

echo "📦 Проверка Composer..."
if [ ! -d "vendor" ]; then
    echo "Установка зависимостей Composer..."
    composer install --optimize-autoloader --no-dev
else
    echo "✅ Vendor уже установлен"
fi

echo "🔑 Настройка .env..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚠️  Файл .env создан из .env.example"
        echo "📝 Отредактируйте .env и замените DB_PASSWORD на реальный пароль!"
        echo "   nano .env"
        read -p "Нажмите Enter после редактирования .env..."
    else
        echo "❌ Ошибка: .env.example не найден!"
        exit 1
    fi
fi

echo "🔑 Генерация ключа приложения..."
php artisan key:generate

echo "🗄️  Выполнение миграций..."
php artisan migrate --force

echo "🌱 Заполнение тестовыми данными..."
read -p "Заполнить БД тестовыми данными? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan db:seed
fi

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
echo "   ⚠️  Измените пароль после первого входа!"
