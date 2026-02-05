# Deployment Guide

## Общие требования

- PHP 8.2+
- MySQL 8.0+
- Composer
- Node.js 18+
- npm или yarn
- Веб-сервер (Apache/Nginx)

## Подготовка к деплою

### 1. Backend

```bash
cd backend
composer install --optimize-autoloader --no-dev
cp .env.example .env
php artisan key:generate
```

Настройте `.env`:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_DATABASE=vitoluxua
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Настройте реальные контакты
CONTACT_PHONE=+380XXXXXXXXX
CONTACT_EMAIL=info@vitoluxua.com
```

Выполните миграции:
```bash
php artisan migrate --force
php artisan db:seed
```

Оптимизация:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 2. Frontend

```bash
cd frontend
npm install
npm run build
```

Создайте `.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
```

Соберите проект:
```bash
npm run build
```

Файлы будут в папке `dist/`

### 3. Admin Panel

```bash
cd admin
npm install
npm run build
```

Создайте `.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
```

Соберите проект:
```bash
npm run build
```

## Настройка веб-сервера

### Apache (.htaccess)

Убедитесь, что в `backend/public/.htaccess` настроен mod_rewrite.

### Nginx

Пример конфигурации:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/vitoluxua/backend/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /admin {
        alias /path/to/vitoluxua/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    location / {
        alias /path/to/vitoluxua/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## SSL сертификат

Рекомендуется использовать Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com
```

## Права доступа

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## Cron задачи

Добавьте в crontab:

```bash
* * * * * cd /path/to/vitoluxua/backend && php artisan schedule:run >> /dev/null 2>&1
```

## Проверка после деплоя

1. Проверьте доступность API: `https://yourdomain.com/api/health`
2. Проверьте главную страницу
3. Проверьте админ-панель
4. Проверьте создание заказа
5. Проверьте отправку email (если настроено)

## Backup

Рекомендуется настроить автоматический backup базы данных:

```bash
mysqldump -u user -p vitoluxua > backup_$(date +%Y%m%d).sql
```

## Мониторинг

Настройте мониторинг:
- Логи Laravel: `storage/logs/laravel.log`
- Логи веб-сервера
- Мониторинг дискового пространства
- Мониторинг производительности
