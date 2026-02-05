<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::where('is_active', true);

        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        } else {
            $query->whereNull('parent_id');
        }

        $categories = $query->with('children')->orderBy('order')->get();

        return response()->json($categories);
    }

    public function show($id)
    {
        $category = Category::with(['parent', 'children', 'products'])
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($category);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_uk' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_uk' => 'nullable|string',
            'description_en' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name_uk']);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name_uk' => 'sometimes|required|string|max:255',
            'name_en' => 'sometimes|required|string|max:255',
            'description_uk' => 'nullable|string',
            'description_en' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['name_uk']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name_uk']);
        }

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        if ($category->products()->count() > 0) {
            return response()->json(['error' => 'Category has products'], 400);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:categories,id',
            'categories.*.order' => 'required|integer',
        ]);

        foreach ($request->categories as $item) {
            Category::where('id', $item['id'])->update(['order' => $item['order']]);
        }

        return response()->json(['message' => 'Categories reordered']);
    }
}
