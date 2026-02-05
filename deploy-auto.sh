#!/usr/bin/expect -f

set timeout 600
set HOST "rocket-da6.hostsila.org"
set USER "shmfjhml"
set PORT "22"
set PASSWORD "j2Z2ZHqyp.4T]6"
set REMOTE_PATH "/home/shmfjhml/domains/vitoluxua.com/public_html"

puts "🚀 Начало деплоя VitoluxUA..."

# Загрузка backend
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
