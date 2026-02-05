# 📦 Установка зависимостей и загрузка на сервер

## Шаг 1: Установка Composer зависимостей локально

Выполните в терминале:

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua/backend
composer install --optimize-autoloader --no-dev
```

**Примечание**: Если composer не установлен, установите его:

```bash
# macOS (через Homebrew)
brew install composer

# Или скачайте напрямую
curl -sS https://getcomposer.org/installer | php
php composer.phar install --optimize-autoloader --no-dev
```

## Шаг 2: Проверка установки

После установки проверьте, что папка `vendor/` создана:

```bash
ls -la vendor/ | head -10
```

Папка `vendor/` должна содержать все зависимости Laravel.

## Шаг 3: Загрузка на сервер через FileZilla

1. Откройте **FileZilla** (уже подключен к серверу)

2. **Загрузите папку vendor/**:
   - Локальный путь: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/vendor/`
   - Удаленный путь: `/domains/vitoluxua.com/public_html/vendor/`
   - Перетащите всю папку `vendor/` в `public_html/`

3. **Загрузите файл .env**:
   - Локальный путь: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/.env`
   - Удаленный путь: `/domains/vitoluxua.com/public_html/.env`
   - Перетащите файл `.env` в `public_html/`

## Шаг 4: Настройка на сервере (через SSH или панель управления)

После загрузки файлов выполните на сервере:

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

## ✅ Проверка

После выполнения проверьте:

1. **API**: https://vitoluxua.com/api/health
2. **Сайт**: https://vitoluxua.com
3. **Админка**: https://vitoluxua.com/admin

## 📋 Чеклист

- [ ] Composer зависимости установлены локально
- [ ] Папка `vendor/` загружена на сервер
- [ ] Файл `.env` загружен на сервер
- [ ] Выполнены команды настройки Laravel на сервере
- [ ] Сайт работает и доступен

## 🔧 Troubleshooting

### Если composer install не работает:

```bash
# Проверьте версию PHP
php -v
# Должна быть 8.2 или выше

# Проверьте composer
composer --version
```

### Если папка vendor слишком большая для загрузки:

Используйте архивацию:

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

---

**Выполните шаги согласно инструкциям выше.**
