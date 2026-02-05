<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title_uk',
        'title_en',
        'slug',
        'content_uk',
        'content_en',
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

    public function getTitleAttribute($locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $this->{"title_{$locale}"} ?? $this->title_uk;
    }

    public function getContentAttribute($locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $this->{"content_{$locale}"} ?? $this->content_uk;
    }
}
