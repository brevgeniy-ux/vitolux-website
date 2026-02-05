# 🚀 Быстрая инструкция: Деплой через SFTP

## 📋 Что нужно перед началом:

1. ✅ Frontend собран (`frontend/dist/` существует)
2. ✅ Admin собран (`admin/dist/` существует)
3. ✅ Пароль от хостинга
4. ✅ Пароль от базы данных MySQL

## 🔌 Шаг 1: Подключение через FileZilla

1. Откройте **FileZilla**
2. **Файл** → **Менеджер сайтов** → **Новый сайт**
3. Настройки:
   - **Протокол**: SFTP - SSH File Transfer Protocol
   - **Хост**: `rocket-da6.hostsila.org`
   - **Порт**: `22`
   - **Тип входа**: Обычный
   - **Пользователь**: `shmfjhml`
   - **Пароль**: (ваш пароль)
4. Нажмите **Соединиться**

## 📦 Шаг 2: Загрузка файлов

### Backend → `/domains/vitoluxua.com/public_html/`

Перетащите из локальной папки `backend/`:
- ✅ `app/`
- ✅ `bootstrap/`
- ✅ `config/`
- ✅ `database/`
- ✅ `public/`
- ✅ `routes/`
- ✅ `storage/`
- ✅ `artisan`
- ✅ `composer.json`
- ✅ `.env.example`

**НЕ загружайте**:
- ❌ `node_modules/`
- ❌ `.git/`
- ❌ `.env` (создадим на сервере)

### Frontend → `/domains/vitoluxua.com/public_html/`

Перетащите **содержимое** папки `frontend/dist/`:
- ✅ `index.html`
- ✅ `assets/`
- ✅ `favicon.ico`
- ✅ `logo.svg`

### Admin → `/domains/vitoluxua.com/public_html/admin/`

Перетащите **содержимое** папки `admin/dist/`:
- ✅ `index.html`
- ✅ `assets/`

## ⚙️ Шаг 3: Настройка на сервере через SSH

Подключитесь через SSH:

```bash
ssh shmfjhml@rocket-da6.hostsila.org -p 22
```

Выполните команды:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Создайте .env
cp .env.example .env
nano .env
```

**В .env замените**:
```env
DB_PASSWORD=ВАШ_ПАРОЛЬ_ОТ_БД
```

Сохраните (Ctrl+O, Enter, Ctrl+X)

```bash
# Установите зависимости
composer install --optimize-autoloader --no-dev

# Настройте Laravel
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

## ✅ Шаг 4: Проверка

1. **API**: https://vitoluxua.com/api/health
2. **Сайт**: https://vitoluxua.com
3. **Админка**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## 🆘 Если что-то не работает:

```bash
# Проверьте логи
tail -f storage/logs/laravel.log

# Проверьте права
chmod -R 755 storage bootstrap/cache

# Проверьте .env
cat .env | grep DB_PASSWORD
```

---

**Готово! 🎉**
