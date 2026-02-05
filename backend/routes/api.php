<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ManufacturerController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\PageController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\SearchController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Public routes
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/manufacturers', [ManufacturerController::class, 'index']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/pages/{slug}', [PageController::class, 'show']);
Route::post('/contact', [ContactController::class, 'store']);
Route::post('/search', [SearchController::class, 'search']);
Route::post('/orders', [OrderController::class, 'store']);

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected admin routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Products
    Route::apiResource('products', ProductController::class);
    Route::post('products/{id}/images', [ProductController::class, 'uploadImages']);
    
    // Categories
    Route::apiResource('categories', CategoryController::class);
    Route::post('categories/reorder', [CategoryController::class, 'reorder']);
    
    // Orders
    Route::get('orders', [OrderController::class, 'index']);
    Route::get('orders/{id}', [OrderController::class, 'show']);
    Route::put('orders/{id}/status', [OrderController::class, 'updateStatus']);
    
    // Manufacturers
    Route::apiResource('manufacturers', ManufacturerController::class);
    
    // Settings
    Route::get('settings', [SettingController::class, 'adminIndex']);
    Route::put('settings', [SettingController::class, 'update']);
    
    // Pages
    Route::apiResource('pages', PageController::class);
    
    // Contacts
    Route::get('contacts', [ContactController::class, 'index']);
    Route::get('contacts/{id}', [ContactController::class, 'show']);
    
    // Dashboard
    Route::get('dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);
});
