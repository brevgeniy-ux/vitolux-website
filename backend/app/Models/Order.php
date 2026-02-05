<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_comment',
        'delivery_type',
        'delivery_data',
        'payment_type',
        'subtotal',
        'delivery_price',
        'total',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'delivery_data' => 'array',
            'subtotal' => 'decimal:2',
            'delivery_price' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public static function generateOrderNumber()
    {
        do {
            $number = 'VTL-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        } while (self::where('order_number', $number)->exists());
        
        return $number;
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            'new' => 'Новий',
            'processing' => 'В обробці',
            'shipped' => 'Відправлено',
            'completed' => 'Завершено',
            'cancelled' => 'Скасовано',
            default => $this->status,
        };
    }
}
