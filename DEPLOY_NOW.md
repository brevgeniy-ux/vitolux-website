# 🚀 Выполнение деплоя VitoluxUA

## Данные для подключения:
- **Хост**: rocket-da6.hostsila.org
- **Порт**: 22 (SFTP/SSH)
- **Логин**: shmfjhml
- **Пароль**: j2Z2ZHqyp.4T]6
- **БД**: shmfjhml_vitolux
- **Пароль БД**: j2Z2ZHqyp.4T]6

## Шаг 1: Загрузка файлов через SFTP

Выполните следующие команды в терминале (потребуется ввод пароля):

```bash
cd /Users/ievgenbrynza/Documents/Vitoluxua

# Загрузка backend
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' --exclude '.DS_Store' \
    -e "ssh -p 22" \
    backend/ shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/

# Загрузка frontend
rsync -avz --delete \
    -e "ssh -p 22" \
    frontend/dist/ shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/

# Загрузка admin
rsync -avz --delete \
    -e "ssh -p 22" \
    admin/dist/ shmfjhml@rocket-da6.hostsila.org:/home/shmfjhml/domains/vitoluxua.com/public_html/admin/
```

**Пароль для каждой команды**: `j2Z2ZHqyp.4T]6`

## Шаг 2: Настройка на сервере

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

# Редактирование .env (замените содержимое на следующее)
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

## Шаг 3: Проверка

После выполнения всех команд проверьте:

1. **API**: https://vitoluxua.com/api/health
2. **Главная**: https://vitoluxua.com
3. **Админка**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## Альтернатива: Использование expect

Если установлен expect, можно использовать автоматический скрипт:

```bash
chmod +x deploy-with-expect.sh
./deploy-with-expect.sh
```

## Troubleshooting

Если возникли проблемы:

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache

# Проверьте .env
cat .env | grep DB_PASSWORD
```
