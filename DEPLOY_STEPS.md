# 🚀 Пошаговая инструкция деплоя VitoluxUA

## ✅ Подготовка завершена

Frontend и Admin панель собраны локально:
- ✅ `frontend/dist/` - готов к загрузке
- ✅ `admin/dist/` - готов к загрузке

## 📋 Шаги деплоя

### Шаг 1: Подключение к серверу

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

### Шаг 2: Клонирование репозитория

```bash
cd /home/shmfjhml/domains/vitoluxua.com/
git clone https://github.com/brevgeniy-ux/vitolux-website.git temp_repo
```

### Шаг 3: Копирование Backend

```bash
cp -r temp_repo/backend/* public_html/
cd public_html
```

### Шаг 4: Настройка .env

```bash
cp .env.example .env
nano .env
```

**Важно!** Замените следующие значения в `.env`:

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

### Шаг 5: Установка зависимостей и настройка Laravel

```bash
# Установка Composer зависимостей
composer install --optimize-autoloader --no-dev

# Генерация ключа приложения
php artisan key:generate

# Выполнение миграций
php artisan migrate --force

# Заполнение тестовыми данными (опционально)
php artisan db:seed

# Создание симлинка для storage
php artisan storage:link

# Кеширование конфигурации
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Настройка прав доступа
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
```

### Шаг 6: Загрузка Frontend и Admin

**Вариант А: Через SFTP (FileZilla, WinSCP)**

1. Подключитесь к серверу:
   - Хост: `rocket-da6.hostsila.org`
   - Порт: `22` (SFTP)
   - Логин: `shmfjhml`
   - Пароль: ваш пароль

2. Загрузите файлы:
   - Содержимое `frontend/dist/` → `/home/shmfjhml/domains/vitoluxua.com/public_html/`
   - Содержимое `admin/dist/` → `/home/shmfjhml/domains/vitoluxua.com/public_html/admin/`

**Вариант Б: Через rsync (с локального компьютера)**

```bash
# Frontend
rsync -avz --delete \
    frontend/dist/ \
    shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/

# Admin
rsync -avz --delete \
    admin/dist/ \
    shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/admin/
```

### Шаг 7: Настройка .htaccess

Убедитесь что в `public_html/.htaccess` есть правильная конфигурация:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # API routes - перенаправляем на Laravel
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^api/(.*)$ public/index.php [L]

    # Admin routes
    RewriteCond %{REQUEST_URI} ^/admin
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^admin/(.*)$ admin/index.html [L]

    # Frontend routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api
    RewriteCond %{REQUEST_URI} !^/admin
    RewriteRule ^(.*)$ index.html [L]
</IfModule>
```

**Или** скопируйте файл `public_html.htaccess` из репозитория в `public_html/.htaccess`

### Шаг 8: Очистка временных файлов

```bash
cd /home/shmfjhml/domains/vitoluxua.com/
rm -rf temp_repo
```

### Шаг 9: Проверка

1. **API**: https://vitoluxua.com/api/health
2. **Главная страница**: https://vitoluxua.com
3. **Админ-панель**: https://vitoluxua.com/admin
4. **Вход в админку**:
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## 🔧 Troubleshooting

### Ошибка 500

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
```

### Ошибка подключения к БД

1. Проверьте данные в `.env`
2. Убедитесь что БД создана
3. Проверьте права пользователя БД

### API не работает

1. Проверьте `.htaccess`
2. Убедитесь что mod_rewrite включен
3. Проверьте путь: `public/index.php` должен существовать

### Изображения не загружаются

```bash
php artisan storage:link
chmod -R 755 storage/app/public
```

## 📝 Структура на сервере

```
/home/shmfjhml/domains/vitoluxua.com/public_html/
├── app/                    # Laravel app
├── bootstrap/              # Laravel bootstrap
├── config/                 # Laravel config
├── database/               # Migrations, seeders
├── public/                 # Laravel public (index.php, .htaccess)
├── routes/                 # Routes
├── storage/                # Storage (logs, cache, uploads)
├── vendor/                 # Composer dependencies
├── .env                    # Environment config
├── index.html              # Frontend entry point
├── assets/                  # Frontend assets
└── admin/                  # Admin panel
    ├── index.html
    └── assets/
```

## ✅ Готово!

После выполнения всех шагов сайт должен быть доступен по адресу: **https://vitoluxua.com**
