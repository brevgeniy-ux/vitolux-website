<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function show($slug)
    {
        $page = Page::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json($page);
    }

    public function index()
    {
        $pages = Page::where('is_active', true)->get();

        return response()->json($pages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title_uk' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:pages,slug',
            'content_uk' => 'nullable|string',
            'content_en' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if (!isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title_uk']);
        }

        $page = Page::create($validated);

        return response()->json($page, 201);
    }

    public function update(Request $request, $id)
    {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'title_uk' => 'sometimes|required|string|max:255',
            'title_en' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|unique:pages,slug,' . $id,
            'content_uk' => 'nullable|string',
            'content_en' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $page->update($validated);

        return response()->json($page);
    }

    public function destroy($id)
    {
        $page = Page::findOrFail($id);
        $page->delete();

        return response()->json(['message' => 'Page deleted']);
    }
}
