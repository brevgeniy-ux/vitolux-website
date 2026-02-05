<?php
/**
 * VitoluxUA API
 * Единая точка входа для всех API запросов
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Подключение к БД
$host = 'localhost';
$dbname = 'shmfjhml_vitolux';
$username = 'shmfjhml_vitolux';
$password = 'vitolux2026!';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Функция отправки Telegram уведомлений
function sendTelegramNotification($message) {
    global $pdo;
    
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('telegram_bot_token', 'telegram_chat_id', 'telegram_notifications_enabled')");
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        if (empty($settings['telegram_notifications_enabled']) || $settings['telegram_notifications_enabled'] !== 'true') {
            return false;
        }
        if (empty($settings['telegram_bot_token']) || empty($settings['telegram_chat_id'])) {
            return false;
        }
        
        $url = "https://api.telegram.org/bot{$settings['telegram_bot_token']}/sendMessage";
        $data = [
            'chat_id' => $settings['telegram_chat_id'],
            'text' => $message,
            'parse_mode' => 'HTML'
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $httpCode === 200;
    } catch (Exception $e) {
        error_log("Telegram notification error: " . $e->getMessage());
        return false;
    }
}

// Функция проверки авторизации
function checkAuth() {
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    // Проверка токена в БД (упрощенная версия - можно улучшить)
    // Для простоты проверяем токен из localStorage через заголовок
    // В продакшене лучше использовать JWT или хранить токены в БД
    try {
        global $pdo;
        // Проверяем токен в таблице personal_access_tokens или users
        // Пока используем простую проверку через сессию
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['admin_token']) || $_SESSION['admin_token'] !== $token) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid token']);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication failed']);
        exit;
    }
    
    return true;
}

// Получение пути запроса
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Удаляем /api из пути, если есть
$path = parse_url($requestUri, PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path);
$pathParts = array_filter(explode('/', trim($path, '/')));
$pathParts = array_values($pathParts);

// Получение данных запроса
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$queryParams = $_GET;

try {
    // PRODUCTS API
    if ($pathParts[0] === 'products') {
        if ($requestMethod === 'GET') {
            if (isset($pathParts[1])) {
                // GET /products/{id}
                $id = (int)$pathParts[1];
                $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND is_active = 1");
                $stmt->execute([$id]);
                $product = $stmt->fetch();
                
                if (!$product) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Product not found']);
                    exit;
                }
                
                echo json_encode($product);
            } else {
                // GET /products
                $categoryId = $queryParams['category_id'] ?? null;
                $search = $queryParams['search'] ?? null;
                $limit = (int)($queryParams['limit'] ?? 20);
                $offset = (int)($queryParams['offset'] ?? 0);
                
                $sql = "SELECT * FROM products WHERE is_active = 1";
                $params = [];
                
                if ($categoryId) {
                    $sql .= " AND category_id = ?";
                    $params[] = $categoryId;
                }
                
                if ($search) {
                    $sql .= " AND (name_uk LIKE ? OR name_en LIKE ? OR sku LIKE ?)";
                    $searchTerm = "%$search%";
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
                $params[] = $limit;
                $params[] = $offset;
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $products = $stmt->fetchAll();
                
                // Получить общее количество
                $countSql = "SELECT COUNT(*) as total FROM products WHERE is_active = 1";
                if ($categoryId) $countSql .= " AND category_id = $categoryId";
                $countStmt = $pdo->query($countSql);
                $total = $countStmt->fetch()['total'];
                
                echo json_encode([
                    'data' => $products,
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ]);
            }
        }
    }
    
    // ADMIN PRODUCTS API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'products') {
        checkAuth();
        
        if ($requestMethod === 'GET') {
            $stmt = $pdo->query("SELECT p.*, c.name_uk as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC");
            echo json_encode(['data' => $stmt->fetchAll()]);
        }
        elseif ($requestMethod === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO products (name_uk, name_en, sku, description_uk, description_en, price, old_price, quantity, category_id, is_active, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['name_uk'] ?? '',
                $input['name_en'] ?? '',
                $input['sku'] ?? '',
                $input['description_uk'] ?? '',
                $input['description_en'] ?? '',
                $input['price'] ?? 0,
                $input['old_price'] ?? null,
                $input['quantity'] ?? 0,
                $input['category_id'] ?? null,
                $input['is_active'] ?? true,
                $input['is_featured'] ?? false
            ]);
            echo json_encode(['id' => $pdo->lastInsertId(), 'message' => 'Product created']);
        }
        elseif ($requestMethod === 'PUT' && isset($pathParts[2])) {
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("UPDATE products SET name_uk = ?, name_en = ?, sku = ?, description_uk = ?, description_en = ?, price = ?, old_price = ?, quantity = ?, category_id = ?, is_active = ?, is_featured = ? WHERE id = ?");
            $stmt->execute([
                $input['name_uk'] ?? '',
                $input['name_en'] ?? '',
                $input['sku'] ?? '',
                $input['description_uk'] ?? '',
                $input['description_en'] ?? '',
                $input['price'] ?? 0,
                $input['old_price'] ?? null,
                $input['quantity'] ?? 0,
                $input['category_id'] ?? null,
                $input['is_active'] ?? true,
                $input['is_featured'] ?? false,
                $id
            ]);
            echo json_encode(['message' => 'Product updated']);
        }
        elseif ($requestMethod === 'DELETE' && isset($pathParts[2])) {
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Product deleted']);
        }
    }
    
    // CATEGORIES API
    elseif ($pathParts[0] === 'categories') {
        if ($requestMethod === 'GET') {
            $stmt = $pdo->query("SELECT * FROM categories WHERE is_active = 1 ORDER BY order_index ASC, name_uk ASC");
            echo json_encode($stmt->fetchAll());
        }
    }
    
    // ADMIN CATEGORIES API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'categories') {
        checkAuth();
        
        if ($requestMethod === 'GET') {
            $stmt = $pdo->query("SELECT * FROM categories ORDER BY order_index ASC, name_uk ASC");
            echo json_encode(['data' => $stmt->fetchAll()]);
        }
        elseif ($requestMethod === 'POST') {
            $stmt = $pdo->prepare("INSERT INTO categories (name_uk, name_en, description_uk, description_en, slug, is_active, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $input['name_uk'] ?? '',
                $input['name_en'] ?? '',
                $input['description_uk'] ?? '',
                $input['description_en'] ?? '',
                $input['slug'] ?? '',
                $input['is_active'] ?? true,
                $input['order_index'] ?? 0
            ]);
            echo json_encode(['id' => $pdo->lastInsertId(), 'message' => 'Category created']);
        }
        elseif ($requestMethod === 'PUT' && isset($pathParts[2])) {
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("UPDATE categories SET name_uk = ?, name_en = ?, description_uk = ?, description_en = ?, slug = ?, is_active = ?, order_index = ? WHERE id = ?");
            $stmt->execute([
                $input['name_uk'] ?? '',
                $input['name_en'] ?? '',
                $input['description_uk'] ?? '',
                $input['description_en'] ?? '',
                $input['slug'] ?? '',
                $input['is_active'] ?? true,
                $input['order_index'] ?? 0,
                $id
            ]);
            echo json_encode(['message' => 'Category updated']);
        }
        elseif ($requestMethod === 'DELETE' && isset($pathParts[2])) {
            $id = (int)$pathParts[2];
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['message' => 'Category deleted']);
        }
    }
    
    // ORDERS API
    elseif ($pathParts[0] === 'orders' && $requestMethod === 'POST') {
        // Создание заказа
        $orderNumber = 'VTL-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));
        
        $items = json_encode($input['items'] ?? []);
        $subtotal = $input['subtotal'] ?? 0;
        $deliveryCost = $input['delivery_cost'] ?? 0;
        $total = $subtotal + $deliveryCost;
        
        $stmt = $pdo->prepare("INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, customer_comment, delivery_type, delivery_data, delivery_address, payment_type, items, subtotal, delivery_cost, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')");
        $stmt->execute([
            $orderNumber,
            $input['customer_name'] ?? '',
            $input['customer_phone'] ?? '',
            $input['customer_email'] ?? null,
            $input['customer_comment'] ?? null,
            $input['delivery_type'] ?? 'pickup',
            json_encode($input['delivery_data'] ?? []),
            $input['delivery_address'] ?? null,
            $input['payment_type'] ?? 'cash_on_delivery',
            $items,
            $subtotal,
            $deliveryCost,
            $total
        ]);
        
        $orderId = $pdo->lastInsertId();
        
        // Формирование сообщения для Telegram
        $itemsList = '';
        foreach ($input['items'] ?? [] as $item) {
            $itemsList .= "• {$item['name']} x{$item['quantity']} - {$item['price']} ₴\n";
        }
        
        $message = "🛒 <b>Нове замовлення #{$orderNumber}</b>\n\n";
        $message .= "👤 {$input['customer_name']}\n";
        $message .= "📞 {$input['customer_phone']}\n";
        if (!empty($input['customer_email'])) {
            $message .= "📧 {$input['customer_email']}\n";
        }
        $message .= "\n📦 Товари:\n{$itemsList}\n";
        $message .= "💰 Сума: {$total} ₴\n";
        $message .= "🚚 Доставка: {$input['delivery_type']}\n";
        $message .= "💳 Оплата: {$input['payment_type']}\n";
        $message .= "\n🕐 " . date('d.m.Y H:i');
        
        sendTelegramNotification($message);
        
        echo json_encode(['id' => $orderId, 'order_number' => $orderNumber, 'message' => 'Order created']);
    }
    
    // ADMIN ORDERS API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'orders') {
        checkAuth();
        
        if ($requestMethod === 'GET') {
            if (isset($pathParts[2])) {
                // GET /admin/orders/{id}
                $id = (int)$pathParts[2];
                $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                
                if (!$order) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Order not found']);
                    exit;
                }
                
                echo json_encode($order);
            } else {
                // GET /admin/orders
                $status = $queryParams['status'] ?? null;
                $sql = "SELECT * FROM orders";
                if ($status) {
                    $sql .= " WHERE status = ?";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$status]);
                } else {
                    $stmt = $pdo->query($sql);
                }
                echo json_encode(['data' => $stmt->fetchAll()]);
            }
        }
        elseif ($requestMethod === 'PUT' && isset($pathParts[2])) {
            $id = (int)$pathParts[2];
            $newStatus = $input['status'] ?? null;
            $adminNotes = $input['admin_notes'] ?? null;
            
            $stmt = $pdo->prepare("UPDATE orders SET status = ?, admin_notes = ? WHERE id = ?");
            $stmt->execute([$newStatus, $adminNotes, $id]);
            
            // Отправка уведомления об изменении статуса
            $orderStmt = $pdo->prepare("SELECT order_number, customer_name, customer_phone, status FROM orders WHERE id = ?");
            $orderStmt->execute([$id]);
            $order = $orderStmt->fetch();
            
            if ($order) {
                $statusLabels = [
                    'new' => 'Новий',
                    'confirmed' => 'Підтверджено',
                    'processing' => 'В обробці',
                    'shipped' => 'Відправлено',
                    'delivered' => 'Доставлено',
                    'cancelled' => 'Скасовано'
                ];
                
                $message = "📋 <b>Зміна статусу замовлення #{$order['order_number']}</b>\n\n";
                $message .= "Статус: {$statusLabels[$order['status']]}\n";
                $message .= "👤 {$order['customer_name']}\n";
                $message .= "📞 {$order['customer_phone']}\n";
                $message .= "\n🕐 " . date('d.m.Y H:i');
                
                sendTelegramNotification($message);
            }
            
            echo json_encode(['message' => 'Order updated']);
        }
    }
    
    // SETTINGS API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'settings') {
        checkAuth();
        
        if ($requestMethod === 'GET') {
            $stmt = $pdo->query("SELECT setting_key, setting_value, setting_type FROM settings");
            $settings = [];
            while ($row = $stmt->fetch()) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            echo json_encode($settings);
        }
        elseif ($requestMethod === 'PUT') {
            foreach ($input as $key => $value) {
                $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
                $stmt->execute([$value, $key]);
            }
            echo json_encode(['message' => 'Settings updated']);
        }
        elseif ($requestMethod === 'POST' && isset($pathParts[2]) && $pathParts[2] === 'test-telegram') {
            $message = "🧪 <b>Тестове повідомлення</b>\n\nЦе тестове повідомлення від VitoluxUA API.\nЯкщо ви бачите це повідомлення, Telegram інтеграція працює правильно! ✅";
            $result = sendTelegramNotification($message);
            echo json_encode(['success' => $result, 'message' => $result ? 'Message sent' : 'Failed to send']);
        }
    }
    
    // UPLOAD API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'upload' && $requestMethod === 'POST') {
        checkAuth();
        
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['error' => 'No file uploaded']);
            exit;
        }
        
        $uploadDir = __DIR__ . '/../public_html/uploads/products/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $file = $_FILES['file'];
        $fileName = uniqid() . '_' . basename($file['name']);
        $targetPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $url = 'https://vitoluxua.com/uploads/products/' . $fileName;
            echo json_encode(['url' => $url]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Upload failed']);
        }
    }
    
    // DASHBOARD API
    elseif ($pathParts[0] === 'admin' && $pathParts[1] === 'dashboard' && $requestMethod === 'GET') {
        checkAuth();
        
        // Статистика
        $todayOrders = $pdo->query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()")->fetch()['count'];
        $weekOrders = $pdo->query("SELECT COUNT(*) as count FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetch()['count'];
        $monthSales = $pdo->query("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'cancelled'")->fetch()['total'];
        $productsCount = $pdo->query("SELECT COUNT(*) as count FROM products")->fetch()['count'];
        
        // Последние заказы
        $recentOrders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")->fetchAll();
        
        // Топ товаров (по количеству в заказах)
        $topProducts = $pdo->query("
            SELECT p.id, p.name_uk, p.sku, COUNT(*) as order_count
            FROM products p
            INNER JOIN orders o ON JSON_CONTAINS(o.items, JSON_OBJECT('product_id', p.id))
            GROUP BY p.id
            ORDER BY order_count DESC
            LIMIT 5
        ")->fetchAll();
        
        echo json_encode([
            'stats' => [
                'orders_today' => (int)$todayOrders,
                'orders_week' => (int)$weekOrders,
                'sales_month' => (float)$monthSales,
                'products_count' => (int)$productsCount
            ],
            'recent_orders' => $recentOrders,
            'top_products' => $topProducts
        ]);
    }
    
    // LOGIN API
    elseif ((count($pathParts) === 0 || $pathParts[0] === 'login') && $requestMethod === 'POST') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $token = bin2hex(random_bytes(32));
            $_SESSION['admin_token'] = $token;
            $_SESSION['admin_user_id'] = $user['id'];
            
            echo json_encode([
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    }
    
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
