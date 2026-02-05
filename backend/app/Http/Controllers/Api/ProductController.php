<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'manufacturer'])
            ->where('is_active', true);

        // Фильтры
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('manufacturer_id')) {
            $query->where('manufacturer_id', $request->manufacturer_id);
        }

        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->has('in_stock')) {
            $query->where('quantity', '>', 0);
        }

        if ($request->has('is_popular')) {
            $query->where('is_popular', true);
        }

        if ($request->has('is_new')) {
            $query->where('is_new', true);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name_uk', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description_uk', 'like', "%{$search}%")
                  ->orWhere('description_en', 'like', "%{$search}%");
            });
        }

        // Сортировка
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        if ($sortBy === 'price') {
            $query->orderBy('price', $sortOrder);
        } elseif ($sortBy === 'name') {
            $locale = app()->getLocale();
            $query->orderBy("name_{$locale}", $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $perPage = $request->get('per_page', 20);
        $viewMode = $request->get('view_mode', 'grid'); // grid or list

        $products = $query->paginate($perPage);

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'manufacturer'])
            ->where('is_active', true)
            ->findOrFail($id);

        $product->incrementViews();

        // Похожие товары
        $similar = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->limit(4)
            ->get();

        return response()->json([
            'product' => $product,
            'similar' => $similar,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_uk' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'short_description_uk' => 'nullable|string',
            'short_description_en' => 'nullable|string',
            'description_uk' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'attributes' => 'nullable|array',
            'is_popular' => 'boolean',
            'is_new' => 'boolean',
            'is_discount' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_uk']);

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name_uk' => 'sometimes|required|string|max:255',
            'name_en' => 'sometimes|required|string|max:255',
            'sku' => 'sometimes|required|string|unique:products,sku,' . $id,
            'short_description_uk' => 'nullable|string',
            'short_description_en' => 'nullable|string',
            'description_uk' => 'nullable|string',
            'description_en' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'attributes' => 'nullable|array',
            'is_popular' => 'boolean',
            'is_new' => 'boolean',
            'is_discount' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['name_uk']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name_uk']);
        }

        $product->update($validated);

        return response()->json($product);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted']);
    }

    public function uploadImages(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'main_image' => 'nullable|image|max:2048',
            'images' => 'nullable|array',
            'images.*' => 'image|max:2048',
        ]);

        if ($request->hasFile('main_image')) {
            $path = $request->file('main_image')->store('products', 'public');
            $product->main_image = $path;
        }

        if ($request->hasFile('images')) {
            $images = [];
            foreach ($request->file('images') as $image) {
                $images[] = $image->store('products', 'public');
            }
            $product->images = $images;
        }

        $product->save();

        return response()->json($product);
    }
}
