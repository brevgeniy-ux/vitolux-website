#!/usr/bin/expect -f

set timeout 600
set HOST "rocket-da6.hostsila.org"
set USER "shmfjhml"
set PORT "22"
set PASSWORD "j2Z2ZHqyp.4T]6"
set REMOTE_PATH "/home/shmfjhml/domains/vitoluxua.com/public_html"
set DB_PASSWORD "j2Z2ZHqyp.4T]6"

puts "🚀 Подключение к серверу и настройка Laravel..."

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
}

expect {
    "$ " {
        puts "✅ Подключено к серверу"
    }
    "# " {
        puts "✅ Подключено к серверу"
    }
    timeout {
        puts "❌ Таймаут подключения"
        exit 1
    }
}

send "cd $REMOTE_PATH\r"
expect "$ "

puts "📝 Создание .env файла..."
send "cp .env.example .env\r"
expect "$ "

puts "📝 Настройка .env..."
send "cat > .env << 'EOF'\r"
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
send "MAIL_MAILER=smtp\r"
send "MAIL_HOST=smtp.hostsila.org\r"
send "MAIL_PORT=587\r"
send "MAIL_FROM_ADDRESS=\"info@vitoluxua.com\"\r"
send "MAIL_FROM_NAME=\"VitoluxUA\"\r"
send "\r"
send "CONTACT_PHONE=+380XXXXXXXXX\r"
send "CONTACT_EMAIL=info@vitoluxua.com\r"
send "\r"
send "SANCTUM_STATEFUL_DOMAINS=vitoluxua.com\r"
send "SESSION_DOMAIN=vitoluxua.com\r"
send "EOF\r"
expect "$ "

puts "📦 Установка зависимостей Composer..."
send "composer install --optimize-autoloader --no-dev\r"
expect {
    "$ " {
        puts "✅ Composer зависимости установлены"
    }
    timeout {
        puts "⚠️  Composer install может занять время..."
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

send "chown -R shmfjhml:shmfjhml storage bootstrap/cache\r"
expect "$ "

puts "✅ Настройка завершена!"
puts ""
puts "🌐 Проверьте сайт:"
puts "   - API: https://vitoluxua.com/api/health"
puts "   - Главная: https://vitoluxua.com"
puts "   - Админка: https://vitoluxua.com/admin"
puts ""
puts "🔑 Вход в админку:"
puts "   Email: admin@vitoluxua.com"
puts "   Пароль: admin123"

send "exit\r"
expect eof

puts ""
puts "✅ Готово!"
