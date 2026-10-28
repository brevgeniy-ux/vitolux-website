#!/usr/bin/env bash
# Мастер установки «под ключ». Запуск: ./setup.sh
# Повторный запуск безопасен: доустановит, что не хватает, и добавит новые проекты.
# Команды: ./setup.sh status | logs | update | backup | add-project
set -euo pipefail
cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  ✅ %s\n' "$*"; }
warn() { printf '  ⚠️  %s\n' "$*"; }
fail() { printf '  ❌ %s\n' "$*"; exit 1; }
ask()  { local v; read -r -p "$1: " v; echo "$v"; }
gen()  { openssl rand -base64 "${1:-32}" | tr -d '/+=' | cut -c1-"${2:-32}"; }

need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo
    fail "Docker не найден. Установите OrbStack с сайта https://orbstack.dev (скачать, перетащить в Программы, запустить один раз), затем снова запустите ./setup.sh"
  fi
  if ! docker info >/dev/null 2>&1; then
    fail "Docker установлен, но не запущен. Откройте приложение OrbStack (или Docker Desktop) и повторите ./setup.sh"
  fi
  ok "Docker работает"
}

make_env() {
  [ -f .env ] && { ok "Файл .env уже есть, пропускаю вопросы"; return; }
  echo
  bold "Шаг 1. Несколько вопросов"
  echo "  Домен должен уже указывать на этот Mac (A-запись у регистратора)."
  local domain email admin pass
  domain=$(ask "Домен мессенджера (например chat.vitolux.ua)")
  email=$(ask "Ваш e-mail (для сертификата, писем не будет)")
  admin=$(ask "Логин администратора латиницей (например evgeniy)")
  pass=$(ask "Пароль администратора (Enter = сгенерировать)")
  [ -z "$pass" ] && pass=$(gen 24 20)
  domain=$(echo "$domain" | tr 'A-Z' 'a-z' | sed 's#^https\?://##; s#/$##')
  admin=$(echo "$admin" | tr 'A-Z' 'a-z')
  cat > .env <<ENV
MATRIX_DOMAIN=$domain
ACME_EMAIL=$email
POSTGRES_PASSWORD=$(gen 32 32)
REGISTRATION_SHARED_SECRET=$(gen 48 48)
ADMIN_USER=$admin
ADMIN_PASSWORD=$pass
ENV
  chmod 600 .env
  ok "Настройки сохранены в matrix/.env"
  echo
  bold "  Запишите: вход администратора"
  echo "  Адрес:  https://$domain"
  echo "  Логин:  $admin"
  echo "  Пароль: $pass"
}

slugify() {
  echo "$1" | tr 'A-Z' 'a-z' | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//'
}

add_projects() {
  local file=bootstrap/projects.json
  if [ ! -f "$file" ]; then echo '{ "projects": [] }' > "$file"; fi
  echo
  bold "Проекты"
  echo "  Каждый проект получает свою вкладку в приложении, своего бота и свой адрес для заявок."
  echo "  Чтобы закончить, оставьте название пустым и нажмите Enter."
  while true; do
    local name slug
    name=$(ask "Название проекта (например Норма Костинг)")
    [ -z "$name" ] && break
    slug=$(ask "Короткое имя латиницей для адреса (например norma-costing)")
    slug=$(slugify "$slug")
    [ -z "$slug" ] && { warn "Пустое имя, проект пропущен"; continue; }
    if python3 - "$file" "$slug" "$name" <<'PY'
import json, sys
f, slug, name = sys.argv[1:4]
d = json.load(open(f))
if any(p["slug"] == slug for p in d["projects"]):
    print(f"  ⚠️  Проект {slug} уже есть, пропускаю"); sys.exit(1)
d["projects"].append({"slug": slug, "name": name, "bot_name": f"{name} · Заявки",
                      "rooms": {"default": "Все заявки"}, "members": []})
json.dump(d, open(f, "w"), ensure_ascii=False, indent=2)
PY
    then ok "Добавлен проект «$name» (адрес заявок /hook/$slug)"; fi
  done
  local n; n=$(python3 -c "import json;print(len(json.load(open('$file'))['projects']))")
  [ "$n" = "0" ] && fail "Нужен хотя бы один проект. Запустите ./setup.sh ещё раз."
}

check_dns() {
  set -a; . ./.env; set +a
  local mine theirs
  mine=$(curl -s --max-time 5 https://api.ipify.org || true)
  theirs=$(dig +short "$MATRIX_DOMAIN" 2>/dev/null | tail -1 || true)
  if [ -n "$mine" ] && [ -n "$theirs" ] && [ "$mine" != "$theirs" ]; then
    warn "Домен $MATRIX_DOMAIN указывает на $theirs, а ваш внешний IP $mine."
    warn "Сертификат не выпустится. Исправьте A-запись у регистратора и подождите 10 минут."
  elif [ -z "$theirs" ]; then
    warn "Домен $MATRIX_DOMAIN пока не найден в DNS. Проверьте A-запись у регистратора."
  else
    ok "Домен $MATRIX_DOMAIN указывает на этот адрес ($mine)"
  fi
}

start() {
  echo; bold "Шаг 2. Подготовка файлов"
  ./init.sh >/dev/null
  ok "Конфигурация собрана"
  echo; bold "Шаг 3. Запуск сервера (первый раз скачивание займёт несколько минут)"
  docker compose up -d --build
  printf '  Жду, пока сервер поднимется'
  for _ in $(seq 1 60); do
    if docker compose ps synapse 2>/dev/null | grep -q healthy; then echo; ok "Сервер запущен"; return; fi
    printf '.'; sleep 3
  done
  echo; fail "Сервер не поднялся за 3 минуты. Посмотрите: ./setup.sh logs"
}

bootstrap() {
  echo; bold "Шаг 4. Создаю ботов, проекты и комнаты"
  docker compose run --rm bootstrap
}

finish() {
  set -a; . ./.env; set +a
  echo; bold "Готово!"
  cat <<TXT
  1. Откройте https://$MATRIX_DOMAIN в браузере и войдите (логин $ADMIN_USER).
  2. На телефоне установите Element, нажмите «Войти», «Изменить сервер»,
     введите $MATRIX_DOMAIN, затем логин и пароль.
  3. Адреса и секреты для заявок напечатаны выше (и лежат в data/gateway/projects.json).

  Добавить проект:     ./setup.sh add-project
  Состояние:           ./setup.sh status
  Логи заявок:         ./setup.sh logs
  Обновить:            ./setup.sh update
  Резервная копия:     ./setup.sh backup
TXT
}

case "${1:-install}" in
  install)
    bold "Установка мессенджера для заявок"
    need_docker; make_env; check_dns
    if [ ! -f bootstrap/projects.json ]; then add_projects; fi
    start; bootstrap; finish ;;
  add-project)
    need_docker; add_projects; bootstrap ;;
  status)
    docker compose ps; echo; curl -s "https://$(grep MATRIX_DOMAIN .env | cut -d= -f2)/hook-health"; echo ;;
  logs)
    docker compose logs -f --tail=100 gateway ;;
  update)
    docker compose pull && docker compose build --pull gateway && docker compose up -d && ok "Обновлено" ;;
  backup)
    mkdir -p backups
    f="backups/matrix-$(date +%F-%H%M).tgz"
    docker compose exec -T postgres pg_dump -U synapse synapse | gzip > data/postgres-dump.sql.gz
    tar czf "$f" .env data/synapse data/gateway data/postgres-dump.sql.gz bootstrap/projects.json
    ok "Копия сохранена: $f" ;;
  *) echo "Использование: ./setup.sh [install|add-project|status|logs|update|backup]"; exit 1 ;;
esac
