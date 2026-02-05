<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Page;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Создание админа
        User::create([
            'name' => 'Admin',
            'email' => 'admin@vitoluxua.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Создание категорий
        $category1 = Category::create([
            'name_uk' => 'Освітлення',
            'name_en' => 'Lighting',
            'slug' => 'osvitlennya',
            'description_uk' => 'Широкий вибір освітлювального обладнання',
            'description_en' => 'Wide selection of lighting equipment',
            'order' => 1,
            'is_active' => true,
        ]);

        $category2 = Category::create([
            'name_uk' => 'Електричні кабелі',
            'name_en' => 'Electrical Cables',
            'slug' => 'elektrychni-kabli',
            'description_uk' => 'Кабелі та провідники різних типів',
            'description_en' => 'Cables and conductors of various types',
            'order' => 2,
            'is_active' => true,
        ]);

        $category3 = Category::create([
            'name_uk' => 'Розетки та вимикачі',
            'name_en' => 'Sockets and Switches',
            'slug' => 'rozetky-ta-vymykachi',
            'description_uk' => 'Розетки, вимикачі та інша електрична арматура',
            'description_en' => 'Sockets, switches and other electrical fittings',
            'order' => 3,
            'is_active' => true,
        ]);

        // Подкатегории
        Category::create([
            'name_uk' => 'LED лампи',
            'name_en' => 'LED Lamps',
            'slug' => 'led-lampy',
            'parent_id' => $category1->id,
            'order' => 1,
            'is_active' => true,
        ]);

        // Производители
        $manufacturer1 = Manufacturer::create([
            'name' => 'Philips',
            'slug' => 'philips',
            'is_active' => true,
        ]);

        $manufacturer2 = Manufacturer::create([
            'name' => 'Schneider Electric',
            'slug' => 'schneider-electric',
            'is_active' => true,
        ]);

        // Товары
        for ($i = 1; $i <= 15; $i++) {
            Product::create([
                'name_uk' => "Товар {$i}",
                'name_en' => "Product {$i}",
                'sku' => 'VTL-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                'slug' => 'tovar-' . $i,
                'short_description_uk' => "Короткий опис товару {$i}",
                'short_description_en' => "Short description of product {$i}",
                'description_uk' => "Повний опис товару {$i} з усіма характеристиками",
                'description_en' => "Full description of product {$i} with all specifications",
                'price' => rand(100, 5000),
                'old_price' => rand(500, 6000),
                'quantity' => rand(0, 100),
                'category_id' => rand(1, 3),
                'manufacturer_id' => rand(1, 2),
                'attributes' => [
                    ['name' => 'Потужність', 'value' => rand(10, 100) . 'W'],
                    ['name' => 'Напруга', 'value' => '220V'],
                ],
                'is_popular' => $i <= 5,
                'is_new' => $i <= 3,
                'is_discount' => $i % 3 === 0,
                'is_active' => true,
            ]);
        }

        // Настройки
        $settings = [
            ['key' => 'site_name_uk', 'value' => 'VitoluxUA', 'group' => 'general'],
            ['key' => 'site_name_en', 'value' => 'VitoluxUA', 'group' => 'general'],
            ['key' => 'site_slogan_uk', 'value' => 'Інтернет-магазин електрообладнання', 'group' => 'general'],
            ['key' => 'site_slogan_en', 'value' => 'Electrical Equipment Online Store', 'group' => 'general'],
            ['key' => 'contact_phone', 'value' => '+380XXXXXXXXX', 'group' => 'general'],
            ['key' => 'contact_email', 'value' => 'info@vitoluxua.com', 'group' => 'general'],
            ['key' => 'contact_address', 'value' => 'Адрес для самовывоза', 'group' => 'general'],
            ['key' => 'delivery_default_price', 'value' => '100', 'group' => 'delivery'],
            ['key' => 'delivery_free_from', 'value' => '2000', 'group' => 'delivery'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }

        // Страницы
        Page::create([
            'title_uk' => 'Про компанію',
            'title_en' => 'About Us',
            'slug' => 'pro-kompaniyu',
            'content_uk' => '<h1>Про компанію VitoluxUA</h1><p>Ми пропонуємо широкий вибір електрообладнання від провідних виробників.</p>',
            'content_en' => '<h1>About VitoluxUA</h1><p>We offer a wide selection of electrical equipment from leading manufacturers.</p>',
            'is_active' => true,
        ]);

        Page::create([
            'title_uk' => 'Доставка та оплата',
            'title_en' => 'Delivery and Payment',
            'slug' => 'dostavka-ta-oplata',
            'content_uk' => '<h1>Доставка та оплата</h1><p>Доставка по всій Україні.</p>',
            'content_en' => '<h1>Delivery and Payment</h1><p>Delivery throughout Ukraine.</p>',
            'is_active' => true,
        ]);
    }
}
