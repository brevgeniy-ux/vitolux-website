# 📤 Деплой VitoluxUA через SFTP

## 📋 Подготовка перед загрузкой

### 1. Убедитесь что проекты собраны

```bash
# Frontend
cd frontend
npm run build

# Admin
cd ../admin
npm run build
```

✅ Проверьте что папки `frontend/dist/` и `admin/dist/` существуют.

## 🔌 Подключение через SFTP

### Данные для подключения:

- **Хост**: `rocket-da6.hostsila.org`
- **Порт**: `22` (SFTP) или `21` (FTP)
- **Логин**: `shmfjhml`
- **Пароль**: (ваш пароль от хостинга)
- **Корневая папка**: `/home/shmfjhml/domains/vitoluxua.com/public_html/`

### Использование FileZilla:

1. Откройте FileZilla
2. Нажмите "Файл" → "Менеджер сайтов"
3. Создайте новый сайт:
   - Протокол: **SFTP - SSH File Transfer Protocol**
   - Хост: `rocket-da6.hostsila.org`
   - Порт: `22`
   - Тип входа: **Обычный**
   - Пользователь: `shmfjhml`
   - Пароль: (ваш пароль)
4. Нажмите "Соединиться"

## 📦 Загрузка файлов

### Шаг 1: Загрузка Backend

**Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/`

**Удаленный путь**: `/home/shmfjhml/domains/vitoluxua.com/public_html/`

**Что загружать**:
- ✅ Все файлы и папки из `backend/` кроме:
  - ❌ `node_modules/` (если есть)
  - ❌ `.git/`
  - ❌ `.env` (создадим на сервере)

**Важно**: Папка `vendor/` должна быть загружена, но если её нет, выполните на сервере через SSH:
```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
composer install --optimize-autoloader --no-dev
```

### Шаг 2: Загрузка Frontend

**Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/frontend/dist/`

**Удаленный путь**: `/home/shmfjhml/domains/vitoluxua.com/public_html/`

**Что загружать**:
- ✅ Все содержимое папки `frontend/dist/`:
  - `index.html`
  - `assets/` (папка со всеми файлами)
  - `favicon.ico`
  - `logo.svg`

### Шаг 3: Загрузка Admin Panel

**Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/admin/dist/`

**Удаленный путь**: `/home/shmfjhml/domains/vitoluxua.com/public_html/admin/`

**Что загружать**:
- ✅ Все содержимое папки `admin/dist/`:
  - `index.html`
  - `assets/` (папка со всеми файлами)

## ⚙️ Настройка на сервере

### Шаг 1: Создание .env файла

После загрузки файлов подключитесь к серверу через SSH:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

Создайте файл `.env`:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
cp .env.example .env
nano .env
```

**Важно!** Замените следующие значения:

```env
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vitoluxua.com
APP_KEY=

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=ВАШ_ПАРОЛЬ_ОТ_БД
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X).

### Шаг 2: Установка зависимостей Composer

Если папка `vendor/` не была загружена:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
composer install --optimize-autoloader --no-dev
```

### Шаг 3: Настройка Laravel

```bash
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

### Шаг 4: Проверка .htaccess

Убедитесь что файл `.htaccess` существует в `public_html/` и содержит:

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

Если файла нет, создайте его или скопируйте из `public_html.htaccess` в репозитории.

## ✅ Проверка после деплоя

1. **API Health Check**: https://vitoluxua.com/api/health
   - Должен вернуть: `{"status":"ok"}`

2. **Главная страница**: https://vitoluxua.com
   - Должна открыться главная страница сайта

3. **Админ-панель**: https://vitoluxua.com/admin
   - Должна открыться страница входа

4. **Вход в админку**:
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`
   - ⚠️ **Измените пароль после первого входа!**

## 🔧 Troubleshooting

### Ошибка 500 Internal Server Error

```bash
# Проверьте логи
tail -f /home/shmfjhml/domains/vitoluxua.com/public_html/storage/logs/laravel.log

# Проверьте права доступа
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

# Проверьте .env файл
cat .env | grep APP_KEY
# Если APP_KEY пустой, выполните:
php artisan key:generate
```

### Ошибка подключения к БД

1. Проверьте данные в `.env`:
   ```bash
   cat .env | grep DB_
   ```

2. Проверьте что БД создана через phpMyAdmin

3. Проверьте права пользователя БД

### API не работает

1. Проверьте `.htaccess` файл
2. Убедитесь что mod_rewrite включен
3. Проверьте путь: `public/index.php` должен существовать

### Изображения не загружаются

```bash
php artisan storage:link
chmod -R 755 storage/app/public
```

## 📁 Структура файлов на сервере

После загрузки структура должна быть такой:

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
├── .env                    # Environment config (создать!)
├── .htaccess               # Apache config (создать!)
├── index.html              # Frontend entry point
├── assets/                 # Frontend assets
├── favicon.ico             # Frontend favicon
├── logo.svg                # Frontend logo
└── admin/                  # Admin panel
    ├── index.html
    └── assets/
```

## 🎯 Чеклист деплоя

- [ ] Frontend собран (`frontend/dist/` существует)
- [ ] Admin собран (`admin/dist/` существует)
- [ ] Backend файлы готовы к загрузке
- [ ] Подключение к SFTP настроено
- [ ] Backend загружен в `public_html/`
- [ ] Frontend загружен в `public_html/`
- [ ] Admin загружен в `public_html/admin/`
- [ ] `.env` файл создан и настроен
- [ ] `vendor/` установлен через Composer
- [ ] Миграции выполнены
- [ ] Права доступа настроены
- [ ] `.htaccess` настроен
- [ ] Сайт проверен и работает

---

**Готово! После выполнения всех шагов сайт будет доступен на https://vitoluxua.com** 🚀
