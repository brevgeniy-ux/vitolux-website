import { useEffect, useState } from 'react'
import { dashboardApi, DashboardStats, Order } from '../api/client'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await dashboardApi.getStats()
      setStats(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Завантаження...</div>
  }

  if (!stats) {
    return <div>Помилка завантаження статистики</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Замовлення сьогодні</h3>
          <p className="text-3xl font-bold text-primary">{stats.stats.orders_today}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Замовлення за тиждень</h3>
          <p className="text-3xl font-bold text-primary">{stats.stats.orders_week}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Продажі за місяць</h3>
          <p className="text-3xl font-bold text-green-600">{stats.stats.sales_month.toFixed(2)} ₴</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Товарів</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.stats.products_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Последние заказы */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Останні замовлення</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">№</th>
                    <th className="text-left p-2">Клієнт</th>
                    <th className="text-left p-2">Сума</th>
                    <th className="text-left p-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_orders.map((order: Order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-2">{order.order_number}</td>
                      <td className="p-2">{order.customer_name}</td>
                      <td className="p-2 font-semibold">{order.total} ₴</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Топ товары */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Топ товари</h2>
            <div className="space-y-2">
              {stats.top_products.length > 0 ? (
                stats.top_products.map((product: any, idx: number) => (
                  <div key={product.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-semibold">#{idx + 1}</span> {product.name_uk}
                    </div>
                    <span className="text-gray-600">{product.order_count} замовлень</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Немає даних</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
