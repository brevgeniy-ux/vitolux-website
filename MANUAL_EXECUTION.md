# 📋 Ручное выполнение настройки Laravel

## ⚠️ Автоматическое подключение недоступно

Из-за ограничений сети автоматическое подключение не работает. Выполните настройку вручную.

## 📤 Шаг 1: Загрузка файла через FileZilla

1. Откройте **FileZilla** (уже подключен)
2. Найдите файл `configure-server.sh` в папке проекта
3. Загрузите его в `/domains/vitoluxua.com/public_html/` на сервере

## ⚙️ Шаг 2: Выполнение скрипта на сервере

### Вариант А: Выполнение через одну команду SSH

Откройте терминал и выполните:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22 "cd /home/shmfjhml/domains/vitoluxua.com/public_html && bash configure-server.sh"
```

**Пароль**: `j2Z2ZHqyp.4T]6`

### Вариант Б: Интерактивное подключение

1. Подключитесь к серверу:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

**Пароль**: `j2Z2ZHqyp.4T]6`

2. После подключения выполните:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html
bash configure-server.sh
```

## 📝 Альтернатива: Выполнение команд вручную

Если скрипт не работает, выполните команды вручную:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создание .env файла
cp .env.example .env

# Настройка .env
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

## ✅ Проверка после выполнения

После выполнения всех команд проверьте:

1. **Главная страница**: https://vitoluxua.com
2. **Админ-панель**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`
3. **API Health Check**: https://vitoluxua.com/api/health

## 🔧 Troubleshooting

### Если composer install не работает:

```bash
# Проверьте версию PHP
php -v

# Проверьте наличие composer
which composer
composer --version
```

### Если миграции не выполняются:

```bash
# Проверьте подключение к БД
php artisan tinker
# Затем выполните:
DB::connection()->getPdo();
```

### Если возникает ошибка 500:

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache
chown -R shmfjhml:shmfjhml storage bootstrap/cache

# Проверьте APP_KEY
cat .env | grep APP_KEY
# Если пустой:
php artisan key:generate
php artisan config:cache
```

---

**Выполните команды вручную согласно инструкциям выше.**
