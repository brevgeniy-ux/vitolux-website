<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name_uk');
            $table->string('name_en');
            $table->string('sku')->unique();
            $table->string('slug')->unique();
            $table->text('short_description_uk')->nullable();
            $table->text('short_description_en')->nullable();
            $table->longText('description_uk')->nullable();
            $table->longText('description_en')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('old_price', 10, 2)->nullable();
            $table->integer('quantity')->default(0);
            $table->string('main_image')->nullable();
            $table->json('images')->nullable();
            $table->json('attributes')->nullable(); // Характеристики
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('manufacturer_id')->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_new')->default(false);
            $table->boolean('is_discount')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('meta_title_uk')->nullable();
            $table->string('meta_title_en')->nullable();
            $table->text('meta_description_uk')->nullable();
            $table->text('meta_description_en')->nullable();
            $table->integer('views')->default(0);
            $table->timestamps();
            
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('restrict');
            $table->foreign('manufacturer_id')->references('id')->on('manufacturers')->onDelete('set null');
            $table->index('category_id');
            $table->index('manufacturer_id');
            $table->index('sku');
            $table->index('slug');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
