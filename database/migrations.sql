-- SQL Миграции для VitoluxUA
-- Выполнить в phpMyAdmin для базы данных shmfjhml_vitolux

-- 1. Создание таблицы orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    customer_comment TEXT,
    delivery_type ENUM('pickup', 'nova_post', 'ukr_post', 'courier') NOT NULL,
    delivery_data JSON,
    delivery_address TEXT,
    payment_type ENUM('cash_on_delivery', 'card', 'liqpay') NOT NULL,
    items JSON NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Создание таблицы settings
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Начальные настройки
INSERT INTO settings (setting_key, setting_value, setting_type) VALUES
('site_name', 'VitoluxUA', 'string'),
('site_phone', '+380XXXXXXXXX', 'string'),
('site_email', 'info@vitoluxua.com', 'string'),
('telegram_bot_token', '', 'string'),
('telegram_chat_id', '', 'string'),
('telegram_notifications_enabled', 'false', 'boolean'),
('free_delivery_threshold', '2000', 'number'),
('delivery_cost', '100', 'number')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- 4. Обновление таблицы products (если нужно добавить поля)
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2) AFTER price;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false AFTER is_active;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) AFTER description_en;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT AFTER meta_title;

-- 5. Проверка структуры categories (если нужно)
-- ALTER TABLE categories ADD COLUMN IF NOT EXISTS image VARCHAR(255) AFTER description_en;
-- ALTER TABLE categories ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0 AFTER parent_id;
