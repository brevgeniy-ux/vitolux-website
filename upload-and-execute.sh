#!/usr/bin/expect -f

set timeout 600
set HOST "rocket-da6.hostsila.org"
set USER "shmfjhml"
set PORT "22"
set PASSWORD "j2Z2ZHqyp.4T]6"
set REMOTE_PATH "/home/shmfjhml/domains/vitoluxua.com/public_html"
set LOCAL_FILE "configure-server.sh"
set REMOTE_FILE "configure-server.sh"

puts "📤 Загрузка configure-server.sh на сервер..."

# Загрузка файла через SFTP
spawn sftp -P $PORT ${USER}@${HOST}
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

expect "sftp>"
send "cd $REMOTE_PATH\r"
expect "sftp>"
send "put $LOCAL_FILE\r"
expect "sftp>"
send "quit\r"
expect eof

puts "✅ Файл загружен!"

puts "⚙️  Выполнение скрипта на сервере..."

# Выполнение скрипта через SSH
spawn ssh -p $PORT ${USER}@${HOST} "cd $REMOTE_PATH && bash $REMOTE_FILE"
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
    eof {
        puts "✅ Скрипт выполнен!"
    }
    timeout {
        puts "⚠️  Скрипт выполняется..."
        expect eof
    }
}

puts ""
puts "🌐 Проверьте сайт:"
puts "   - https://vitoluxua.com"
puts "   - https://vitoluxua.com/admin"
