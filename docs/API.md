# API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

Для защищенных endpoints используется Laravel Sanctum. После успешного логина токен передается в заголовке:

```
Authorization: Bearer {token}
```

## Public Endpoints

### Products

#### GET /products
Получить список товаров

**Query Parameters:**
- `category_id` - ID категории
- `manufacturer_id` - ID производителя
- `min_price` - Минимальная цена
- `max_price` - Максимальная цена
- `in_stock` - Только в наличии (true/false)
- `is_popular` - Популярные товары (true/false)
- `is_new` - Новинки (true/false)
- `search` - Поисковый запрос
- `sort_by` - Сортировка (price, name, created_at)
- `sort_order` - Порядок (asc, desc)
- `per_page` - Товаров на странице (default: 20)
- `page` - Номер страницы

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name_uk": "Товар 1",
      "name_en": "Product 1",
      "sku": "VTL-000001",
      "price": 1000,
      "old_price": 1200,
      "quantity": 10,
      "main_image": "/storage/products/image.jpg",
      "category": {...},
      "manufacturer": {...}
    }
  ],
  "current_page": 1,
  "total": 100
}
```

#### GET /products/{id}
Получить товар по ID

**Response:**
```json
{
  "product": {...},
  "similar": [...]
}
```

### Categories

#### GET /categories
Получить список категорий

**Query Parameters:**
- `parent_id` - ID родительской категории

**Response:**
```json
[
  {
    "id": 1,
    "name_uk": "Освітлення",
    "name_en": "Lighting",
    "slug": "osvitlennya",
    "children": [...]
  }
]
```

#### GET /categories/{id}
Получить категорию по ID

### Manufacturers

#### GET /manufacturers
Получить список производителей

### Orders

#### POST /orders
Создать заказ

**Request Body:**
```json
{
  "customer_name": "Іван Іванов",
  "customer_phone": "+380501234567",
  "customer_email": "ivan@example.com",
  "customer_comment": "Коментар",
  "delivery_type": "pickup",
  "delivery_data": {},
  "payment_type": "cash_on_delivery",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "order_number": "VTL-20240101-ABC123",
  "total": 2000,
  "status": "new"
}
```

### Contact

#### POST /contact
Отправить форму обратной связи

**Request Body:**
```json
{
  "name": "Іван",
  "email": "ivan@example.com",
  "phone": "+380501234567",
  "subject": "Питання",
  "message": "Текст повідомлення"
}
```

### Search

#### POST /search
Поиск товаров

**Request Body:**
```json
{
  "q": "лампа"
}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "LED лампа",
    "sku": "VTL-000001",
    "price": 1000
  }
]
```

## Admin Endpoints

Требуют аутентификации через Sanctum.

### Auth

#### POST /login
Вход в админ-панель

**Request Body:**
```json
{
  "email": "admin@vitoluxua.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {...},
  "token": "1|..."
}
```

#### POST /logout
Выход

### Products (Admin)

#### GET /admin/products
Список всех товаров (включая неактивные)

#### POST /admin/products
Создать товар

#### PUT /admin/products/{id}
Обновить товар

#### DELETE /admin/products/{id}
Удалить товар

#### POST /admin/products/{id}/images
Загрузить изображения

### Categories (Admin)

#### GET /admin/categories
Список категорий

#### POST /admin/categories
Создать категорию

#### PUT /admin/categories/{id}
Обновить категорию

#### DELETE /admin/categories/{id}
Удалить категорию

#### POST /admin/categories/reorder
Изменить порядок категорий

### Orders (Admin)

#### GET /admin/orders
Список заказов

**Query Parameters:**
- `status` - Фильтр по статусу
- `date_from` - Дата от
- `date_to` - Дата до

#### GET /admin/orders/{id}
Детали заказа

#### PUT /admin/orders/{id}/status
Изменить статус заказа

**Request Body:**
```json
{
  "status": "processing",
  "admin_notes": "Примітка"
}
```

### Dashboard

#### GET /admin/dashboard/stats
Статистика для dashboard

**Response:**
```json
{
  "orders": {
    "today": 5,
    "week": 25,
    "month": 100
  },
  "sales": {
    "today": 5000,
    "week": 25000,
    "month": 100000
  },
  "products": {
    "total": 150,
    "active": 120,
    "out_of_stock": 10
  },
  "recent_orders": [...],
  "top_products": [...]
}
```

### Settings

#### GET /admin/settings
Получить все настройки

#### PUT /admin/settings
Обновить настройки

**Request Body:**
```json
{
  "settings": {
    "site_name_uk": "VitoluxUA",
    "contact_phone": "+380XXXXXXXXX",
    ...
  }
}
```

## Error Responses

Все ошибки возвращаются в формате:

```json
{
  "message": "Error message",
  "errors": {
    "field": ["Error 1", "Error 2"]
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error
