#!/usr/bin/expect -f

# Скрипт автоматического деплоя с использованием expect
# Использование: ./deploy-with-expect.sh

set timeout 300
set HOST "rocket-da6.hostsila.org"
set USER "shmfjhml"
set PORT "22"
set PASSWORD "j2Z2ZHqyp.4T]6"
set REMOTE_PATH "/home/shmfjhml/domains/vitoluxua.com/public_html"
set DB_PASSWORD "j2Z2ZHqyp.4T]6"

puts "🚀 Начало деплоя VitoluxUA..."

# Загрузка backend через rsync
puts "📤 Загрузка backend..."
spawn rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'vendor' --exclude '.DS_Store' -e "ssh -p $PORT" backend/ ${USER}@${HOST}:${REMOTE_PATH}/
expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    eof
}

# Загрузка frontend
puts "📤 Загрузка frontend..."
spawn rsync -avz --delete -e "ssh -p $PORT" frontend/dist/ ${USER}@${HOST}:${REMOTE_PATH}/
expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    eof
}

# Загрузка admin
puts "📤 Загрузка admin..."
spawn rsync -avz --delete -e "ssh -p $PORT" admin/dist/ ${USER}@${HOST}:${REMOTE_PATH}/admin/
expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    eof
}

puts "✅ Файлы загружены!"

# Настройка на сервере через SSH
puts "⚙️  Настройка на сервере..."
spawn ssh -p $PORT ${USER}@${HOST}
expect {
    "password:" {
        send "$PASSWORD\r"
    }
}

expect "$ "
send "cd $REMOTE_PATH\r"
expect "$ "

send "cp .env.example .env\r"
expect "$ "

send "cat > .env << 'EOL'\r"
send "APP_NAME=VitoluxUA\r"
send "APP_ENV=production\r"
send "APP_DEBUG=false\r"
send "APP_TIMEZONE=UTC\r"
send "APP_URL=https://vitoluxua.com\r"
send "APP_LOCALE=uk\r"
send "APP_FALLBACK_LOCALE=en\r"
send "\r"
send "DB_CONNECTION=mysql\r"
send "DB_HOST=localhost\r"
send "DB_PORT=3306\r"
send "DB_DATABASE=shmfjhml_vitolux\r"
send "DB_USERNAME=shmfjhml_vitolux\r"
send "DB_PASSWORD=$DB_PASSWORD\r"
send "\r"
send "SESSION_DRIVER=database\r"
send "SESSION_LIFETIME=120\r"
send "\r"
send "CACHE_STORE=database\r"
send "QUEUE_CONNECTION=database\r"
send "\r"
send "SANCTUM_STATEFUL_DOMAINS=vitoluxua.com\r"
send "SESSION_DOMAIN=vitoluxua.com\r"
send "EOL\r"
expect "$ "

send "composer install --optimize-autoloader --no-dev\r"
expect "$ "

send "php artisan key:generate\r"
expect "$ "

send "php artisan migrate --force\r"
expect "$ "

send "php artisan db:seed\r"
expect "$ "

send "php artisan storage:link\r"
expect "$ "

send "php artisan config:cache\r"
expect "$ "

send "php artisan route:cache\r"
expect "$ "

send "php artisan view:cache\r"
expect "$ "

send "chmod -R 755 storage bootstrap/cache\r"
expect "$ "

send "chown -R shmfjhml:shmfjhml storage bootstrap/cache\r"
expect "$ "

send "exit\r"
expect eof

puts "✅ Деплой завершен!"
puts "🌐 Проверьте сайт: https://vitoluxua.com"
