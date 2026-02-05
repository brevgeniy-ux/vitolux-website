<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('customer_email')->nullable();
            $table->text('customer_comment')->nullable();
            $table->enum('delivery_type', ['pickup', 'nova_post', 'ukr_post', 'courier'])->default('pickup');
            $table->json('delivery_data')->nullable(); // Адрес доставки, отделение НП и т.д.
            $table->enum('payment_type', ['cash_on_delivery', 'card', 'liqpay'])->default('cash_on_delivery');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_price', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->enum('status', ['new', 'processing', 'shipped', 'completed', 'cancelled'])->default('new');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
            
            $table->index('order_number');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
