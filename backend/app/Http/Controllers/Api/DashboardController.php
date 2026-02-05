<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = now()->startOfDay();
        $week = now()->subWeek();
        $month = now()->subMonth();

        $stats = [
            'orders' => [
                'today' => Order::whereDate('created_at', $today)->count(),
                'week' => Order::where('created_at', '>=', $week)->count(),
                'month' => Order::where('created_at', '>=', $month)->count(),
            ],
            'sales' => [
                'today' => Order::whereDate('created_at', $today)->sum('total'),
                'week' => Order::where('created_at', '>=', $week)->sum('total'),
                'month' => Order::where('created_at', '>=', $month)->sum('total'),
            ],
            'products' => [
                'total' => Product::count(),
                'active' => Product::where('is_active', true)->count(),
                'out_of_stock' => Product::where('quantity', '<=', 0)->count(),
            ],
            'recent_orders' => Order::with('items')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'top_products' => DB::table('order_items')
                ->select('product_id', DB::raw('SUM(quantity) as total_sold'))
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.status', '!=', 'cancelled')
                ->groupBy('product_id')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json($stats);
    }
}
