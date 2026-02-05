<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_uk',
        'name_en',
        'sku',
        'slug',
        'short_description_uk',
        'short_description_en',
        'description_uk',
        'description_en',
        'price',
        'old_price',
        'quantity',
        'main_image',
        'images',
        'attributes',
        'category_id',
        'manufacturer_id',
        'is_popular',
        'is_new',
        'is_discount',
        'is_active',
        'meta_title_uk',
        'meta_title_en',
        'meta_description_uk',
        'meta_description_en',
        'views',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'images' => 'array',
            'attributes' => 'array',
            'is_popular' => 'boolean',
            'is_new' => 'boolean',
            'is_discount' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function manufacturer()
    {
        return $this->belongsTo(Manufacturer::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getNameAttribute($locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $this->{"name_{$locale}"} ?? $this->name_uk;
    }

    public function getHasDiscountAttribute()
    {
        return $this->old_price && $this->old_price > $this->price;
    }

    public function getDiscountPercentAttribute()
    {
        if (!$this->has_discount) {
            return 0;
        }
        return round((($this->old_price - $this->price) / $this->old_price) * 100);
    }

    public function incrementViews()
    {
        $this->increment('views');
    }
}
