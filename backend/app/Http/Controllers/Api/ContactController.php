<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $contact = ContactForm::create($validated);

        // TODO: Отправка email админу и уведомление клиенту

        return response()->json($contact, 201);
    }

    public function index(Request $request)
    {
        $query = ContactForm::query();

        if ($request->has('is_read')) {
            $query->where('is_read', $request->is_read);
        }

        $contacts = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($contacts);
    }

    public function show($id)
    {
        $contact = ContactForm::findOrFail($id);
        $contact->update(['is_read' => true]);

        return response()->json($contact);
    }
}
