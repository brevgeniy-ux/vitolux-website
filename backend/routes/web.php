<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'VitoluxUA API']);
});

Route::get('/robots.txt', function () {
    return response()->file(public_path('robots.txt'));
});

Route::get('/sitemap.xml', function () {
    return response()->file(public_path('sitemap.xml'));
});
