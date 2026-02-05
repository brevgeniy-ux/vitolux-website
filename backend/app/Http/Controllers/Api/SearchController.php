<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2',
        ]);

        $query = $request->q;
        $locale = app()->getLocale();

        $products = Product::where('is_active', true)
            ->where(function($q) use ($query, $locale) {
                $q->where("name_{$locale}", 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere("description_{$locale}", 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', "name_{$locale} as name", 'sku', 'price', 'main_image', 'slug']);

        return response()->json($products);
    }
}
