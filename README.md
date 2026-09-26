# VitoluxUA - Интернет-магазин электрооборудования

Полнофункциональный интернет-магазин электрооборудования с админ-панелью и мультиязычностью (UA/EN).

## 🚀 Технологический стек

- **Backend**: Laravel 11.x (PHP 8.2+)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Admin Panel**: React 18 + TypeScript + Tailwind CSS
- **Database**: MySQL 8.0+
- **Auth**: Laravel Sanctum

## 📁 Структура проекта

```
vitoluxua/
├── backend/           # Laravel API
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── .env.example
├── frontend/          # React публичная часть
│   ├── src/
│   └── public/
├── admin/            # React админка
├── design-studio/    # Сервис дизайн-проектов интерьера с 3D (см. design-studio/README.md)
│   ├── src/
│   └── public/
└── docs/             # Документация
```

## 🛠️ Установка

### Требования

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+
- npm или yarn

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Backend будет доступен на `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

### Admin Panel

```bash
cd admin
npm install
npm run dev
```

Admin Panel будет доступна на `http://localhost:5173`

## 🔐 Первый вход в админ-панель

После выполнения `php artisan db:seed` создается администратор:

- **Email**: admin@vitoluxua.com
- **Пароль**: admin123

⚠️ **Важно**: Измените пароль после первого входа!

## 📝 Настройка .env

Отредактируйте файл `backend/.env`:

```env
DB_DATABASE=vitoluxua
DB_USERNAME=root
DB_PASSWORD=your_password

APP_URL=http://localhost:8000

# Контакты (ЗАМЕНИТЬ НА РЕАЛЬНЫЕ)
CONTACT_PHONE=+380XXXXXXXXX
CONTACT_WHATSAPP=380XXXXXXXXX
CONTACT_TELEGRAM=username
CONTACT_EMAIL=info@vitoluxua.com
```

## 🎯 Основные функции

### Публичная часть

- ✅ Главная страница с категориями и популярными товарами
- ✅ Каталог товаров с фильтрацией и сортировкой
- ✅ Карточка товара с галереей и характеристиками
- ✅ Корзина (localStorage)
- ✅ Оформление заказа (4 шага)
- ✅ Мультиязычность (UA/EN)
- ✅ Поиск товаров
- ✅ Формы связи (телефон, WhatsApp, Telegram)
- ✅ Статические страницы

### Админ-панель

- ✅ Dashboard со статистикой
- ✅ Управление товарами (CRUD)
- ✅ Управление категориями (CRUD)
- ✅ Управление заказами
- ✅ Управление настройками
- ✅ Авторизация и безопасность

## 📚 Документация

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [HostPro Deployment](./docs/HOSTPRO_DEPLOYMENT.md)

## 🔒 Безопасность

- SQL Injection защита (ORM)
- XSS защита
- CSRF токены
- Rate limiting
- Bcrypt хеширование паролей
- Валидация всех входных данных

## 📞 Контакты

Для вопросов и поддержки обращайтесь по адресу: info@vitoluxua.com

## 📄 Лицензия

MIT License
