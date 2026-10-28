#!/usr/bin/env bash
# Первичная подготовка: создаёт ключи Synapse и конфиги из шаблонов.
# Запускать один раз из каталога matrix/ после заполнения .env
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Скопируйте .env.example в .env и заполните значения" >&2
  exit 1
fi
set -a; . ./.env; set +a

for v in MATRIX_DOMAIN POSTGRES_PASSWORD REGISTRATION_SHARED_SECRET ADMIN_USER ADMIN_PASSWORD ACME_EMAIL; do
  if [ -z "${!v:-}" ] || [[ "${!v}" == change-me* ]] || [[ "${!v}" == *example.com ]]; then
    echo "В .env не заполнено значение $v" >&2
    exit 1
  fi
done

mkdir -p data/synapse data/postgres data/gateway data/caddy data/element

# Synapse сам создаёт подписывающий ключ и конфиг логов
if [ ! -f "data/synapse/${MATRIX_DOMAIN}.signing.key" ]; then
  echo "Генерирую ключи Synapse..."
  docker run --rm \
    -v "$(pwd)/data/synapse:/data" \
    -e SYNAPSE_SERVER_NAME="${MATRIX_DOMAIN}" \
    -e SYNAPSE_REPORT_STATS=no \
    -e UID=1000 -e GID=1000 \
    matrixdotorg/synapse:latest generate >/dev/null
fi

echo "Собираю homeserver.yaml..."
sed -e "s|MATRIX_DOMAIN|${MATRIX_DOMAIN}|g" \
    -e "s|POSTGRES_PASSWORD|${POSTGRES_PASSWORD}|g" \
    -e "s|REGISTRATION_SHARED_SECRET|${REGISTRATION_SHARED_SECRET}|g" \
    synapse/homeserver.yaml.template > data/synapse/homeserver.yaml

echo "Собираю конфиг Element..."
sed "s|MATRIX_DOMAIN|${MATRIX_DOMAIN}|g" element/config.template.json > data/element/config.json

if [ ! -f bootstrap/projects.json ]; then
  cp bootstrap/projects.example.json bootstrap/projects.json
  echo "Создан bootstrap/projects.json из примера: впишите свои проекты"
fi

echo
echo "Готово. Дальше:"
echo "  docker compose up -d"
echo "  docker compose run --rm bootstrap"
