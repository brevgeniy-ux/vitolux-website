# 📊 Статус деплоя VitoluxUA

## ⚠️ Проблема с подключением

При попытке автоматического деплоя возникли проблемы с подключением к серверу:
- Таймауты при подключении через SSH/SFTP
- Возможно, требуется VPN или другой способ подключения

## ✅ Что готово:

1. ✅ Все файлы подготовлены к загрузке
2. ✅ Frontend собран (`frontend/dist/`)
3. ✅ Admin собран (`admin/dist/`)
4. ✅ Backend готов (`backend/`)
5. ✅ Скрипты настройки созданы

## 🚀 Ручной деплой (рекомендуется):

### Шаг 1: Загрузка файлов через FileZilla

1. Откройте **FileZilla**
2. Подключитесь:
   - Протокол: **SFTP - SSH File Transfer Protocol**
   - Хост: `rocket-da6.hostsila.org`
   - Порт: `22`
   - Пользователь: `shmfjhml`
   - Пароль: `j2Z2ZHqyp.4T]6`

3. Загрузите файлы:
   - **Backend**: `backend/*` → `/domains/vitoluxua.com/public_html/`
   - **Frontend**: `frontend/dist/*` → `/domains/vitoluxua.com/public_html/`
   - **Admin**: `admin/dist/*` → `/domains/vitoluxua.com/public_html/admin/`

### Шаг 2: Настройка на сервере

Подключитесь через SSH:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
# Пароль: j2Z2ZHqyp.4T]6
```

Выполните на сервере:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Загрузите файл server-setup-complete.sh на сервер через SFTP
# Затем выполните:
bash server-setup-complete.sh
```

**Или** выполните команды вручную:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env
cp .env.example .env
cat > .env << 'EOF'
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vitoluxua.com
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=j2Z2ZHqyp.4T]6
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
SANCTUM_STATEFUL_DOMAINS=vitoluxua.com
SESSION_DOMAIN=vitoluxua.com
EOF

# Установка и настройка
composer install --optimize-autoloader --no-dev
php artisan key:generate
php artisan migrate --force
php artisan db:seed
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
chmod -R 755 storage bootstrap/cache
```

### Шаг 3: Проверка

После выполнения проверьте:

1. **API**: https://vitoluxua.com/api/health
2. **Сайт**: https://vitoluxua.com
3. **Админка**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## 📁 Файлы для загрузки:

- `server-setup-complete.sh` - полный скрипт настройки (загрузите на сервер)

## 🔧 Troubleshooting:

Если возникают проблемы:

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache

# Проверьте .env
cat .env | grep DB_PASSWORD
```

---

**Выполните деплой вручную через FileZilla и SSH согласно инструкциям выше.**
