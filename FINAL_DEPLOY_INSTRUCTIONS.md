# 🚀 Финальные инструкции по деплою VitoluxUA

## ✅ Все готово к деплою!

Файлы подготовлены и готовы к загрузке на сервер.

## 📋 Данные для подключения:

- **Хост**: rocket-da6.hostsila.org
- **Порт**: 22 (SFTP/SSH)
- **Логин**: shmfjhml
- **Пароль**: j2Z2ZHqyp.4T]6
- **БД**: shmfjhml_vitolux
- **Пароль БД**: j2Z2ZHqyp.4T]6

## 🎯 Вариант 1: Автоматический деплой (рекомендуется)

Выполните в терминале:

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua
./EXECUTE_DEPLOY.sh
```

Скрипт попросит ввести пароль 3 раза (для каждой загрузки). Введите: `j2Z2ZHqyp.4T]6`

После загрузки файлов подключитесь к серверу и выполните настройку:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
# Пароль: j2Z2ZHqyp.4T]6

# Загрузите скрипт настройки на сервер
# Или выполните команды вручную (см. ниже)
```

## 🎯 Вариант 2: Ручной деплой через FileZilla

### Шаг 1: Подключение

1. Откройте **FileZilla**
2. **Файл** → **Менеджер сайтов** → **Новый сайт**
3. Настройки:
   - Протокол: **SFTP - SSH File Transfer Protocol**
   - Хост: `rocket-da6.hostsila.org`
   - Порт: `22`
   - Тип входа: Обычный
   - Пользователь: `shmfjhml`
   - Пароль: `j2Z2ZHqyp.4T]6`
4. Нажмите **Соединиться**

### Шаг 2: Загрузка файлов

**Backend** → `/domains/vitoluxua.com/public_html/`
- Перетащите папки: `app`, `bootstrap`, `config`, `database`, `public`, `routes`, `storage`
- Перетащите файлы: `artisan`, `composer.json`, `.env.example`

**Frontend** → `/domains/vitoluxua.com/public_html/`
- Перетащите **содержимое** папки `frontend/dist/` (index.html, assets/, favicon.ico, logo.svg)

**Admin** → `/domains/vitoluxua.com/public_html/admin/`
- Перетащите **содержимое** папки `admin/dist/` (index.html, assets/)

## ⚙️ Шаг 3: Настройка на сервере

Подключитесь через SSH:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

**Пароль**: `j2Z2ZHqyp.4T]6`

Выполните команды:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env
cp .env.example .env
cat > .env << 'EOF'
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=https://vitoluxua.com
APP_LOCALE=uk
APP_FALLBACK_LOCALE=en

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=j2Z2ZHqyp.4T]6

SESSION_DRIVER=database
SESSION_LIFETIME=120

CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostsila.org
MAIL_PORT=587
MAIL_FROM_ADDRESS="info@vitoluxua.com"
MAIL_FROM_NAME="VitoluxUA"

CONTACT_PHONE=+380XXXXXXXXX
CONTACT_EMAIL=info@vitoluxua.com

SANCTUM_STATEFUL_DOMAINS=vitoluxua.com
SESSION_DOMAIN=vitoluxua.com
EOF

# Установка зависимостей
composer install --optimize-autoloader --no-dev

# Настройка Laravel
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Права доступа
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache
```

**Или** загрузите `server-setup-production.sh` на сервер и выполните:

```bash
bash server-setup-production.sh
```

## ✅ Шаг 4: Проверка

После выполнения всех команд проверьте:

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

### Ошибка 500

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

# Проверьте .env
cat .env | grep APP_KEY
# Если пустой, выполните:
php artisan key:generate
```

### Ошибка подключения к БД

1. Проверьте данные в `.env`
2. Убедитесь что БД создана через phpMyAdmin
3. Проверьте права пользователя БД

### API не работает

1. Проверьте `.htaccess` файл в `public_html/`
2. Убедитесь что mod_rewrite включен
3. Проверьте путь: `public/index.php` должен существовать

### Изображения не загружаются

```bash
php artisan storage:link
chmod -R 755 storage/app/public
```

## 📁 Структура после деплоя

```
/home/shmfjhml/domains/vitoluxua.com/public_html/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── routes/
├── storage/
├── vendor/
├── .env
├── .htaccess
├── index.html (frontend)
├── assets/ (frontend)
└── admin/
    ├── index.html
    └── assets/
```

---

**Готово! После выполнения всех шагов сайт будет доступен на https://vitoluxua.com** 🎉
