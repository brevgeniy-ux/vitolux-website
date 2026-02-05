<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_uk',
        'name_en',
        'slug',
        'description_uk',
        'description_en',
        'image',
        'parent_id',
        'order',
        'meta_title_uk',
        'meta_title_en',
        'meta_description_uk',
        'meta_description_en',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('order');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function getNameAttribute($locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $this->{"name_{$locale}"} ?? $this->name_uk;
    }

    public function setNameAttribute($value)
    {
        if (!isset($this->attributes['slug'])) {
            $this->attributes['slug'] = Str::slug($value);
        }
    }
}
