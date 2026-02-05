# ⚙️ Настройка Laravel на сервере через SSH

## 📋 Инструкция

Подключитесь к серверу и выполните команды ниже.

## 🔌 Шаг 1: Подключение к серверу

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

**Пароль**: `j2Z2ZHqyp.4T]6`

## 📝 Шаг 2: Выполнение команд настройки

После подключения выполните:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env файла
cp .env.example .env

# Запись конфигурации в .env
cat > .env << 'EOF'
APP_NAME=VitoluxUA
APP_ENV=production
APP_DEBUG=false
APP_URL=https://vitoluxua.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=shmfjhml_vitolux
DB_USERNAME=shmfjhml_vitolux
DB_PASSWORD=j2Z2ZHqyp.4T]6

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

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
```

## 🎯 Альтернатива: Использование готового скрипта

1. Загрузите файл `configure-server.sh` на сервер через SFTP в `/home/shmfjhml/domains/vitoluxua.com/public_html/`

2. Выполните на сервере:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
bash configure-server.sh
```

## ✅ Проверка после выполнения

После выполнения всех команд проверьте:

1. **Главная страница**: https://vitoluxua.com
   - Должна открыться главная страница сайта

2. **Админ-панель**: https://vitoluxua.com/admin
   - Должна открыться страница входа
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

3. **API Health Check**: https://vitoluxua.com/api/health
   - Должен вернуть: `{"status":"ok"}`

## 🔧 Troubleshooting

### Ошибка при composer install

```bash
# Проверьте версию PHP
php -v
# Должна быть 8.2 или выше

# Если composer не найден
which composer
# Если не установлен, используйте полный путь или установите composer
```

### Ошибка при миграциях

```bash
# Проверьте подключение к БД
php artisan tinker
# Затем выполните:
DB::connection()->getPdo();
# Если ошибка, проверьте данные в .env
cat .env | grep DB_
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
php artisan config:cache
```

### Проблемы с правами доступа

```bash
# Установите правильные права
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

# Проверьте права на файлы
ls -la storage/
ls -la bootstrap/cache/
```

---

**Выполните команды на сервере согласно инструкциям выше.**
