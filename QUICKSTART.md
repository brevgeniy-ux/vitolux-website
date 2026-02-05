# 🚀 Быстрый старт VitoluxUA

## Шаг 1: Установка зависимостей

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

### Frontend
```bash
cd frontend
npm install
```

### Admin
```bash
cd admin
npm install
```

## Шаг 2: Настройка базы данных

1. Создайте базу данных MySQL: `vitoluxua`
2. Отредактируйте `backend/.env`:
```env
DB_DATABASE=vitoluxua
DB_USERNAME=root
DB_PASSWORD=your_password
```

3. Выполните миграции:
```bash
cd backend
php artisan migrate
php artisan db:seed
```

## Шаг 3: Запуск

### Терминал 1 - Backend
```bash
cd backend
php artisan serve
```
Backend: http://localhost:8000

### Терминал 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend: http://localhost:3000

### Терминал 3 - Admin
```bash
cd admin
npm run dev
```
Admin: http://localhost:5173

## Шаг 4: Первый вход

### Админ-панель
- URL: http://localhost:5173
- Email: `admin@vitoluxua.com`
- Пароль: `admin123`

⚠️ **Измените пароль после первого входа!**

## Что дальше?

1. ✅ Проверьте работу API: http://localhost:8000/api/health
2. ✅ Откройте главную страницу: http://localhost:3000
3. ✅ Войдите в админ-панель и добавьте товары
4. ✅ Протестируйте оформление заказа

## Полезные команды

### Backend
```bash
php artisan migrate          # Миграции
php artisan db:seed          # Заполнение данных
php artisan cache:clear      # Очистка кеша
php artisan config:cache     # Кеш конфигурации
```

### Frontend/Admin
```bash
npm run dev      # Разработка
npm run build    # Production сборка
npm run preview  # Просмотр production сборки
```

## Структура проекта

```
vitoluxua/
├── backend/          # Laravel API (порт 8000)
├── frontend/         # React публичная часть (порт 3000)
├── admin/           # React админка (порт 5173)
└── docs/            # Документация
```

## Проблемы?

1. **Ошибка подключения к БД**: Проверьте настройки в `.env`
2. **Порт занят**: Измените порт в настройках
3. **Зависимости не установлены**: Выполните `composer install` / `npm install`
4. **Миграции не работают**: Проверьте права доступа к БД

## Документация

- [README.md](./README.md) - Общая информация
- [docs/API.md](./docs/API.md) - API документация
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Деплой
- [docs/ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md) - Руководство администратора
- [docs/HOSTPRO_DEPLOYMENT.md](./docs/HOSTPRO_DEPLOYMENT.md) - Деплой на HostPro.ua

---

**Готово! Проект готов к разработке и тестированию.** 🎉
