<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with('items.product');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($orders);
    }

    public function show($id)
    {
        $order = Order::with('items.product')->findOrFail($id);

        return response()->json($order);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'customer_comment' => 'nullable|string',
            'delivery_type' => 'required|in:pickup,nova_post,ukr_post,courier',
            'delivery_data' => 'nullable|array',
            'payment_type' => 'required|in:cash_on_delivery,card,liqpay',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = new Order();
        $order->order_number = Order::generateOrderNumber();
        $order->customer_name = $validated['customer_name'];
        $order->customer_phone = $validated['customer_phone'];
        $order->customer_email = $validated['customer_email'] ?? null;
        $order->customer_comment = $validated['customer_comment'] ?? null;
        $order->delivery_type = $validated['delivery_type'];
        $order->delivery_data = $validated['delivery_data'] ?? [];
        $order->payment_type = $validated['payment_type'];
        $order->status = 'new';

        $subtotal = 0;

        foreach ($validated['items'] as $itemData) {
            $product = Product::findOrFail($itemData['product_id']);
            $quantity = $itemData['quantity'];
            $price = $product->price;
            $total = $price * $quantity;
            $subtotal += $total;
        }

        $order->subtotal = $subtotal;
        
        // Расчет доставки
        $deliveryPrice = $this->calculateDeliveryPrice($subtotal, $validated['delivery_type']);
        $order->delivery_price = $deliveryPrice;
        $order->total = $subtotal + $deliveryPrice;

        $order->save();

        // Создание позиций заказа
        foreach ($validated['items'] as $itemData) {
            $product = Product::findOrFail($itemData['product_id']);
            $quantity = $itemData['quantity'];
            $price = $product->price;
            $total = $price * $quantity;

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'product_name' => $product->getNameAttribute(),
                'product_sku' => $product->sku,
                'price' => $price,
                'quantity' => $quantity,
                'total' => $total,
            ]);

            // Уменьшение количества товара
            $product->decrement('quantity', $quantity);
        }

        // Отправка email уведомлений
        // TODO: Реализовать отправку email

        return response()->json($order, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:new,processing,shipped,completed,cancelled',
            'admin_notes' => 'nullable|string',
        ]);

        $order->status = $validated['status'];
        if (isset($validated['admin_notes'])) {
            $order->admin_notes = $validated['admin_notes'];
        }
        $order->save();

        // TODO: Отправка email клиенту об изменении статуса

        return response()->json($order);
    }

    private function calculateDeliveryPrice($subtotal, $deliveryType)
    {
        $defaultPrice = config('app.delivery_default_price', 100);
        $freeFrom = config('app.delivery_free_from', 2000);

        if ($deliveryType === 'pickup') {
            return 0;
        }

        if ($subtotal >= $freeFrom) {
            return 0;
        }

        return $defaultPrice;
    }
}
