# 📦 Инструкции по деплою VitoluxUA на хостинг

## Подготовка к деплою

### 1. Сборка Frontend и Admin локально

Выполните на локальной машине:

```bash
# Frontend
cd frontend
npm install
npm run build

# Admin
cd ../admin
npm install
npm run build
```

### 2. Варианты деплоя

## Вариант А: Через Git на сервере (рекомендуется)

### Шаг 1: Подключение к серверу

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

### Шаг 2: Клонирование репозитория

```bash
cd /home/shmfjhml/domains/vitoluxua.com/
git clone https://github.com/brevgeniy-ux/vitolux-website.git temp_repo
```

### Шаг 3: Копирование файлов

```bash
# Backend
cp -r temp_repo/backend/* public_html/
cd public_html

# Frontend (собранный локально, загрузите через SFTP)
# Загрузите содержимое frontend/dist/ в public_html/

# Admin (собранный локально, загрузите через SFTP)
# Загрузите содержимое admin/dist/ в public_html/admin/
```

### Шаг 4: Настройка Backend

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Копирование .env
cp .env.example .env

# Редактирование .env (используйте nano или vi)
nano .env
```

Настройте в `.env`:
```env
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vitoluxua.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=ВАШ_ПАРОЛЬ_ОТ_БД
```

### Шаг 5: Установка зависимостей и настройка

```bash
# Установка Composer зависимостей
composer install --optimize-autoloader --no-dev

# Генерация ключа
php artisan key:generate

# Миграции
php artisan migrate --force

# Seeders (опционально, для тестовых данных)
php artisan db:seed

# Создание симлинка storage
php artisan storage:link

# Кеширование
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Права доступа
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
```

### Шаг 6: Очистка

```bash
cd /home/shmfjhml/domains/vitoluxua.com/
rm -rf temp_repo
```

## Вариант Б: Через SFTP/rsync

### Шаг 1: Сборка проектов локально

```bash
# Frontend
cd frontend
npm install
npm run build

# Admin
cd ../admin
npm install
npm run build
```

### Шаг 2: Загрузка через SFTP

Используйте FileZilla, WinSCP или другой SFTP клиент:

**Подключение:**
- Хост: `rocket-da6.hostsila.org`
- Порт: `22` (SFTP) или `21` (FTP)
- Логин: `shmfjhml`
- Пароль: ваш пароль от хостинга

**Загрузка файлов:**
1. Загрузите содержимое `backend/` в `/home/shmfjhml/domains/vitoluxua.com/public_html/`
2. Загрузите содержимое `frontend/dist/` в `/home/shmfjhml/domains/vitoluxua.com/public_html/`
3. Загрузите содержимое `admin/dist/` в `/home/shmfjhml/domains/vitoluxua.com/public_html/admin/`

### Шаг 3: Настройка на сервере

Выполните те же команды из Шага 4-5 Варианта А.

## Вариант В: Использование скрипта деплоя

### Локально (на вашем компьютере):

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua

# Убедитесь что frontend и admin собраны
cd frontend && npm run build && cd ..
cd admin && npm run build && cd ..

# Запустите скрипт деплоя
./deploy.sh
```

Скрипт автоматически:
- Соберет frontend и admin
- Загрузит файлы на сервер через rsync

### На сервере:

После загрузки файлов выполните:

```bash
# Загрузите deploy-server.sh на сервер
# Затем выполните:
bash deploy-server.sh
```

## Проверка после деплоя

1. **Проверьте API**: https://vitoluxua.com/api/health
2. **Проверьте главную страницу**: https://vitoluxua.com
3. **Проверьте админ-панель**: https://vitoluxua.com/admin
4. **Войдите в админку**: 
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## Настройка .htaccess

Убедитесь что в `public_html/.htaccess` есть правильная конфигурация для Laravel:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

## Структура на сервере

```
/home/shmfjhml/domains/vitoluxua.com/
└── public_html/
    ├── app/              # Laravel app
    ├── bootstrap/        # Laravel bootstrap
    ├── config/           # Laravel config
    ├── database/         # Migrations, seeders
    ├── public/           # Public files (index.php, .htaccess)
    ├── routes/           # Routes
    ├── storage/          # Storage (logs, cache, uploads)
    ├── vendor/           # Composer dependencies
    ├── .env              # Environment config
    ├── index.html        # Frontend entry point
    ├── assets/           # Frontend assets (JS, CSS)
    └── admin/            # Admin panel
        ├── index.html
        └── assets/
```

## Troubleshooting

### Ошибка 500

1. Проверьте логи: `storage/logs/laravel.log`
2. Проверьте права доступа: `chmod -R 755 storage bootstrap/cache`
3. Проверьте версию PHP: `php -v` (должна быть 8.3)

### Ошибка подключения к БД

1. Проверьте данные в `.env`
2. Убедитесь что пользователь БД имеет права доступа
3. Проверьте что БД создана

### API не работает

1. Проверьте `.htaccess`
2. Убедитесь что mod_rewrite включен
3. Проверьте путь к API в настройках frontend/admin

### Изображения не загружаются

1. Выполните: `php artisan storage:link`
2. Проверьте права: `chmod -R 755 storage/app/public`

## Обновление проекта

Для обновления проекта:

```bash
# На сервере
cd /home/shmfjhml/domains/vitoluxua.com/
git pull origin main

# Или загрузите обновленные файлы через SFTP
# Затем выполните:
cd public_html
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Поддержка

При возникновении проблем проверьте:
- Логи Laravel: `storage/logs/laravel.log`
- Логи веб-сервера (через панель хостинга)
- Версию PHP: `php -v`
- Версию Composer: `composer --version`
