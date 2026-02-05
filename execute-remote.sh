#!/usr/bin/expect -f

set timeout 1800
set HOST "rocket-da6.hostsila.org"
set USER "shmfjhml"
set PORT "22"
set PASSWORD "j2Z2ZHqyp.4T]6"
set REMOTE_PATH "/home/shmfjhml/domains/vitoluxua.com/public_html"

puts "⚙️  Выполнение настройки Laravel на сервере..."

# Создаем команды для выполнения на сервере
set commands {
    "cd $REMOTE_PATH"
    "cp .env.example .env"
    "cat > .env << 'EOF'
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
EOF"
    "composer install --optimize-autoloader --no-dev"
    "php artisan key:generate"
    "php artisan migrate --force"
    "php artisan db:seed"
    "php artisan storage:link"
    "php artisan config:cache"
    "php artisan route:cache"
    "php artisan view:cache"
    "chmod -R 755 storage bootstrap/cache"
}

spawn ssh -p $PORT ${USER}@${HOST}
expect {
    "password:" {
        send "$PASSWORD\r"
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "$PASSWORD\r"
    }
    timeout {
        puts "❌ Таймаут подключения"
        exit 1
    }
}

expect {
    "$ " {}
    "# " {}
    timeout {
        puts "❌ Не удалось подключиться"
        exit 1
    }
}

puts "✅ Подключено к серверу"

send "cd $REMOTE_PATH\r"
expect "$ "

puts "📝 Создание .env файла..."
send "cp .env.example .env\r"
expect "$ "

puts "📝 Настройка .env..."
send "cat > .env << 'ENVEOF'\r"
send "APP_NAME=VitoluxUA\r"
send "APP_ENV=production\r"
send "APP_DEBUG=false\r"
send "APP_URL=https://vitoluxua.com\r"
send "\r"
send "DB_CONNECTION=mysql\r"
send "DB_HOST=localhost\r"
send "DB_PORT=3306\r"
send "DB_DATABASE=shmfjhml_vitolux\r"
send "DB_USERNAME=shmfjhml_vitolux\r"
send "DB_PASSWORD=j2Z2ZHqyp.4T]6\r"
send "\r"
send "SESSION_DRIVER=database\r"
send "CACHE_STORE=database\r"
send "QUEUE_CONNECTION=database\r"
send "\r"
send "SANCTUM_STATEFUL_DOMAINS=vitoluxua.com\r"
send "SESSION_DOMAIN=vitoluxua.com\r"
send "ENVEOF\r"
expect "$ "

puts "📦 Установка зависимостей Composer..."
send "composer install --optimize-autoloader --no-dev\r"
expect {
    "$ " {
        puts "✅ Composer зависимости установлены"
    }
    timeout {
        puts "⚠️  Composer install выполняется..."
        expect "$ "
    }
}

puts "🔑 Генерация ключа приложения..."
send "php artisan key:generate\r"
expect "$ "

puts "🗄️  Выполнение миграций..."
send "php artisan migrate --force\r"
expect "$ "

puts "🌱 Заполнение тестовыми данными..."
send "php artisan db:seed\r"
expect "$ "

puts "🔗 Создание симлинка storage..."
send "php artisan storage:link\r"
expect "$ "

puts "⚡ Кеширование конфигурации..."
send "php artisan config:cache\r"
expect "$ "

send "php artisan route:cache\r"
expect "$ "

send "php artisan view:cache\r"
expect "$ "

puts "🔒 Настройка прав доступа..."
send "chmod -R 755 storage bootstrap/cache\r"
expect "$ "

puts ""
puts "✅ Настройка Laravel завершена!"
puts ""
puts "🌐 Проверьте сайт:"
puts "   - https://vitoluxua.com"
puts "   - https://vitoluxua.com/admin"
puts ""
puts "🔑 Вход в админку:"
puts "   Email: admin@vitoluxua.com"
puts "   Пароль: admin123"

send "exit\r"
expect eof

puts ""
puts "✅ Готово!"
