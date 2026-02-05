<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title_uk');
            $table->string('title_en');
            $table->string('slug')->unique();
            $table->longText('content_uk')->nullable();
            $table->longText('content_en')->nullable();
            $table->string('meta_title_uk')->nullable();
            $table->string('meta_title_en')->nullable();
            $table->text('meta_description_uk')->nullable();
            $table->text('meta_description_en')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
