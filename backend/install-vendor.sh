#!/bin/bash

# Скрипт установки зависимостей Composer
# Использование: ./install-vendor.sh

set -e

echo "📦 Установка Composer зависимостей..."

cd "$(dirname "$0")"

# Проверка наличия composer
if ! command -v composer &> /dev/null; then
    echo "❌ Composer не найден!"
    echo ""
    echo "Установите Composer:"
    echo "  macOS: brew install composer"
    echo "  Или: curl -sS https://getcomposer.org/installer | php"
    exit 1
fi

echo "✅ Composer найден: $(composer --version)"

# Установка зависимостей
echo "📦 Установка зависимостей..."
composer install --optimize-autoloader --no-dev

echo ""
echo "✅ Зависимости установлены!"
echo ""
echo "📁 Папка vendor/ готова к загрузке на сервер"
echo ""
echo "📤 Загрузите через FileZilla:"
echo "   - Папку: backend/vendor/ → /domains/vitoluxua.com/public_html/vendor/"
echo "   - Файл: backend/.env → /domains/vitoluxua.com/public_html/.env"
