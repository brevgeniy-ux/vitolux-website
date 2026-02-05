# 📦 Инструкция: Установка зависимостей и загрузка на сервер

## ✅ Что уже готово:

1. ✅ Файл `.env` создан в `/Users/ievgenbrynza/Documents/Vitoluxua/backend/.env`
2. ✅ Скрипт `install-vendor.sh` создан для автоматической установки

## 📋 Шаг 1: Установка Composer (если не установлен)

### macOS:

```bash
# Через Homebrew
brew install composer

# Или скачайте напрямую
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Проверка установки:

```bash
composer --version
```

## 📦 Шаг 2: Установка зависимостей

Выполните в терминале:

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua/backend
composer install --optimize-autoloader --no-dev
```

**Или** используйте готовый скрипт:

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua/backend
./install-vendor.sh
```

Это создаст папку `vendor/` со всеми зависимостями Laravel.

## 📤 Шаг 3: Загрузка на сервер через FileZilla

1. Откройте **FileZilla** (уже подключен к серверу)

2. **Загрузите папку vendor/**:
   - **Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/vendor/`
   - **Удаленный путь**: `/domains/vitoluxua.com/public_html/vendor/`
   - Перетащите всю папку `vendor/` в `public_html/`

3. **Загрузите файл .env**:
   - **Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/.env`
   - **Удаленный путь**: `/domains/vitoluxua.com/public_html/.env`
   - Перетащите файл `.env` в `public_html/`

## ⚙️ Шаг 4: Настройка на сервере

После загрузки файлов выполните на сервере (через SSH или панель управления):

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Генерация ключа приложения
php artisan key:generate

# Выполнение миграций
php artisan migrate --force

# Заполнение тестовыми данными
php artisan db:seed

# Создание симлинка storage
php artisan storage:link

# Кеширование конфигурации
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Права доступа
chmod -R 755 storage bootstrap/cache
```

## 📋 Альтернатива: Архивация для быстрой загрузки

Если папка `vendor/` слишком большая, создайте архив:

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua/backend
tar -czf vendor.tar.gz vendor/
```

Загрузите `vendor.tar.gz` на сервер и распакуйте:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
tar -xzf vendor.tar.gz
rm vendor.tar.gz
```

## ✅ Проверка после выполнения

После выполнения всех шагов проверьте:

1. **API Health Check**: https://vitoluxua.com/api/health
2. **Главная страница**: https://vitoluxua.com
3. **Админ-панель**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## 🔧 Troubleshooting

### Если composer install не работает:

```bash
# Проверьте версию PHP
php -v
# Должна быть 8.2 или выше

# Проверьте composer
composer --version

# Если composer не найден, установите его
brew install composer
```

### Если папка vendor не создается:

```bash
# Проверьте composer.json
cat composer.json

# Попробуйте обновить composer
composer self-update

# Попробуйте установить заново
rm -rf vendor/ composer.lock
composer install --optimize-autoloader --no-dev
```

### Если загрузка через FileZilla занимает много времени:

Используйте архивацию (см. выше) или загружайте через SSH:

```bash
# Создайте архив
cd /Users/ievgenbrynza/Documents/Vitoluxua/backend
tar -czf vendor.tar.gz vendor/

# Загрузите через scp (если SSH доступен)
scp -P 22 vendor.tar.gz shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/
```

## 📁 Структура файлов

После выполнения структура должна быть:

```
/Users/ievgenbrynza/Documents/Vitoluxua/backend/
├── .env                    ✅ Создан
├── vendor/                 ⏳ Создастся после composer install
├── composer.json
└── ...

На сервере:
/home/shmfjhml/domains/vitoluxua.com/public_html/
├── .env                    ⏳ Загрузить через FileZilla
├── vendor/                 ⏳ Загрузить через FileZilla
└── ...
```

---

**Выполните шаги согласно инструкциям выше.**
