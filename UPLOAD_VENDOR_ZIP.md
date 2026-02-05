# 📦 Загрузка vendor.zip на сервер

## ✅ Архив создан!

Архив `vendor.zip` готов к загрузке на сервер.

## 📤 Шаг 1: Загрузка через FileZilla

1. Откройте **FileZilla** (уже подключен к серверу)

2. **Загрузите файл vendor.zip**:
   - **Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/vendor.zip`
   - **Удаленный путь**: `/domains/vitoluxua.com/public_html/vendor.zip`
   - Перетащите файл `vendor.zip` в `public_html/`

3. **Загрузите файл .env**:
   - **Локальный путь**: `/Users/ievgenbrynza/Documents/Vitoluxua/backend/.env`
   - **Удаленный путь**: `/domains/vitoluxua.com/public_html/.env`
   - Перетащите файл `.env` в `public_html/`

## 📂 Шаг 2: Распаковка через DirectAdmin File Manager

1. Войдите в **DirectAdmin** панель управления хостингом

2. Откройте **File Manager**

3. Перейдите в папку `/domains/vitoluxua.com/public_html/`

4. Найдите файл `vendor.zip`

5. **Распакуйте архив**:
   - Выберите файл `vendor.zip`
   - Нажмите кнопку **Extract** или **Распаковать**
   - Убедитесь что папка `vendor/` создана в `public_html/`

6. **Удалите архив** (опционально):
   - После успешной распаковки можно удалить `vendor.zip` для экономии места

## ⚙️ Шаг 3: Настройка на сервере

После распаковки выполните на сервере (через SSH или DirectAdmin Terminal):

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/

# Проверка что vendor распакован
ls -la vendor/ | head -10

# Генерация ключа приложения
php artisan key:generate

# Выполнение миграций
php artisan migrate --force

# Заполнение тестовыми данными
php artisan db:seed

# Создание симлинка storage
php artisan storage:link

# Кеширование конфигурации
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Права доступа
chmod -R 755 storage bootstrap/cache
chmod -R 755 vendor/
```

## ✅ Проверка после выполнения

После выполнения всех шагов проверьте:

1. **API Health Check**: https://vitoluxua.com/api/health
2. **Главная страница**: https://vitoluxua.com
3. **Админ-панель**: https://vitoluxua.com/admin
   - Email: `admin@vitoluxua.com`
   - Пароль: `admin123`

## 🔧 Troubleshooting

### Если распаковка не работает через File Manager:

Используйте SSH:

```bash
cd /home/shmfjhml/domains/vitoluxua.com/public_html/
unzip vendor.zip
rm vendor.zip
```

### Если возникают ошибки прав доступа:

```bash
chmod -R 755 vendor/
chown -R shmfjhml:shmfjhml vendor/
```

### Если vendor не распаковывается:

Проверьте что архив загружен полностью:

```bash
ls -lh vendor.zip
# Проверьте размер файла
```

---

**Загрузите vendor.zip через FileZilla и распакуйте через DirectAdmin File Manager!**
