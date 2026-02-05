# HostPro.ua Deployment Guide

## Подготовка

### Требования HostPro.ua

- PHP 8.2+ (проверьте в cPanel)
- MySQL 8.0+
- 2GB RAM минимум
- 20GB SSD
- SSH доступ (рекомендуется)

## Шаг 1: Загрузка файлов

### Вариант 1: Через FTP

1. Подключитесь к FTP серверу HostPro.ua
2. Загрузите папку `backend` в `public_html/api` или `public_html/backend`
3. Загрузите собранные файлы `frontend/dist` в `public_html`
4. Загрузите собранные файлы `admin/dist` в `public_html/admin`

### Вариант 2: Через SSH (рекомендуется)

```bash
# Подключитесь по SSH
ssh username@yourdomain.com

# Создайте структуру
mkdir -p public_html/api
mkdir -p public_html/admin

# Загрузите файлы через git или scp
```

## Шаг 2: Настройка базы данных

### Через cPanel

1. Войдите в cPanel
2. Откройте "MySQL Databases"
3. Создайте новую базу данных: `vitoluxua`
4. Создайте пользователя базы данных
5. Добавьте пользователя к базе данных с правами ALL PRIVILEGES
6. Запишите данные для подключения

### Настройка .env

Отредактируйте `backend/.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=username_vitoluxua
DB_USERNAME=username_dbuser
DB_PASSWORD=your_password

# Настройте реальные контакты
CONTACT_PHONE=+380XXXXXXXXX
CONTACT_WHATSAPP=380XXXXXXXXX
CONTACT_TELEGRAM=username
CONTACT_EMAIL=info@vitoluxua.com
CONTACT_ADDRESS="Адрес для самовывоза"

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostpro.ua
MAIL_PORT=587
MAIL_USERNAME=your_email@yourdomain.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_ADDRESS=info@vitoluxua.com
MAIL_FROM_NAME="VitoluxUA"
```

## Шаг 3: Установка зависимостей

### Через SSH

```bash
cd public_html/api
composer install --optimize-autoloader --no-dev
```

Если Composer не установлен глобально:

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
php composer.phar install --optimize-autoloader --no-dev
```

## Шаг 4: Настройка прав доступа

```bash
chmod -R 755 storage bootstrap/cache
chown -R username:username storage bootstrap/cache
```

## Шаг 5: Выполнение миграций

```bash
cd public_html/api
php artisan migrate --force
php artisan db:seed
```

## Шаг 6: Оптимизация Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Шаг 7: Настройка .htaccess

Убедитесь, что в `public_html/api/public/.htaccess` настроен mod_rewrite.

Если API находится не в корне, создайте `.htaccess` в `public_html/api`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

## Шаг 8: Настройка путей

### Если API в подпапке

Создайте `public_html/api/index.php`:

```php
<?php
require __DIR__.'/public/index.php';
```

### Настройка frontend

В `frontend/.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api
```

Пересоберите frontend:

```bash
cd frontend
npm run build
```

Загрузите содержимое `dist/` в `public_html/`

### Настройка admin

В `admin/.env.production`:

```env
VITE_API_URL=https://yourdomain.com/api
```

Пересоберите admin:

```bash
cd admin
npm run build
```

Загрузите содержимое `dist/` в `public_html/admin`

## Шаг 9: Настройка SSL

1. В cPanel откройте "SSL/TLS Status"
2. Установите Let's Encrypt SSL для домена
3. Включите "Force HTTPS Redirect"

## Шаг 10: Настройка Cron

В cPanel откройте "Cron Jobs" и добавьте:

```bash
* * * * * cd /home/username/public_html/api && php artisan schedule:run >> /dev/null 2>&1
```

## Шаг 11: Проверка

1. Проверьте API: `https://yourdomain.com/api/health`
2. Проверьте главную страницу
3. Проверьте админ-панель: `https://yourdomain.com/admin`
4. Войдите в админ-панель (admin@vitoluxua.com / admin123)
5. Проверьте создание тестового заказа

## Troubleshooting

### Ошибка 500

1. Проверьте права доступа к `storage` и `bootstrap/cache`
2. Проверьте логи: `storage/logs/laravel.log`
3. Проверьте версию PHP (должна быть 8.2+)

### Ошибка подключения к БД

1. Проверьте данные в `.env`
2. Убедитесь, что пользователь БД имеет права доступа
3. Проверьте, что БД создана

### API не работает

1. Проверьте настройки `.htaccess`
2. Убедитесь, что mod_rewrite включен
3. Проверьте путь к API в настройках frontend/admin

### Изображения не загружаются

1. Проверьте права доступа к `storage/app/public`
2. Создайте симлинк: `php artisan storage:link`
3. Проверьте настройки в `config/filesystems.php`

## Поддержка HostPro.ua

Если возникли проблемы, обратитесь в поддержку HostPro.ua:
- Email: support@hostpro.ua
- Телефон: указан на сайте

## Резервное копирование

Настройте автоматический backup через cPanel:

1. Откройте "Backup"
2. Настройте автоматические бэкапы базы данных
3. Рекомендуется делать бэкап ежедневно

## Мониторинг

Используйте инструменты HostPro.ua:
- Статистика посещений
- Логи ошибок
- Мониторинг ресурсов
