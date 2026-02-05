# ⚙️ Выполнение настройки Laravel на сервере

## 📋 Инструкция

Подключитесь к серверу и выполните команды ниже.

## 🔌 Шаг 1: Подключение к серверу

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
# Пароль: j2Z2ZHqyp.4T]6
```

## 📝 Шаг 2: Выполнение команд настройки

После подключения выполните:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env
cp .env.example .env

# Настройка .env (замените содержимое)
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

## 🎯 Альтернатива: Использование готового скрипта

1. Загрузите файл `setup-laravel.sh` на сервер через SFTP
2. Выполните на сервере:

```bash
bash setup-larvel.sh
```

## ✅ Проверка после выполнения

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

### Ошибка при composer install

```bash
# Проверьте версию PHP
php -v
# Должна быть 8.2 или выше

# Если composer не найден, установите его
curl -sS https://getcomposer.org/installer | php
php composer.phar install --optimize-autoloader --no-dev
```

### Ошибка при миграциях

```bash
# Проверьте подключение к БД
php artisan tinker
# Затем выполните:
DB::connection()->getPdo();
# Если ошибка, проверьте данные в .env
```

### Ошибка 500

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

# Проверьте APP_KEY в .env
cat .env | grep APP_KEY
# Если пустой, выполните:
php artisan key:generate
```

---

**Выполните команды на сервере согласно инструкциям выше.**
