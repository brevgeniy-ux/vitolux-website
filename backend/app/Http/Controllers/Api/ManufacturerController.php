<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Manufacturer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ManufacturerController extends Controller
{
    public function index()
    {
        $manufacturers = Manufacturer::where('is_active', true)
            ->orderBy('order')
            ->get();

        return response()->json($manufacturers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('manufacturers', 'public');
        }

        $manufacturer = Manufacturer::create($validated);

        return response()->json($manufacturer, 201);
    }

    public function update(Request $request, $id)
    {
        $manufacturer = Manufacturer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'description' => 'nullable|string',
            'website' => 'nullable|url',
            'order' => 'integer',
            'is_active' => 'boolean',
        ]);

        if (isset($validated['name']) && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if ($request->hasFile('logo')) {
            if ($manufacturer->logo) {
                \Storage::disk('public')->delete($manufacturer->logo);
            }
            $validated['logo'] = $request->file('logo')->store('manufacturers', 'public');
        }

        $manufacturer->update($validated);

        return response()->json($manufacturer);
    }

    public function destroy($id)
    {
        $manufacturer = Manufacturer::findOrFail($id);
        $manufacturer->delete();

        return response()->json(['message' => 'Manufacturer deleted']);
    }
}
