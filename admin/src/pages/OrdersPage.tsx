import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi, Order } from '../api/client'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await ordersApi.getAll(statusFilter ? { status: statusFilter } : undefined)
      setOrders(res.data.data || [])
    } catch (error) {
      toast.error('Помилка завантаження замовлень')
    } finally {
      setLoading(false)
    }
  }


  const statusLabels: Record<string, string> = {
    new: 'Новий',
    confirmed: 'Підтверджено',
    processing: 'В обробці',
    shipped: 'Відправлено',
    delivered: 'Доставлено',
    cancelled: 'Скасовано',
  }

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return <div className="text-center py-12">Завантаження...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Замовлення</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Всі статуси</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4">№</th>
              <th className="text-left p-4">Дата</th>
              <th className="text-left p-4">Клієнт</th>
              <th className="text-left p-4">Телефон</th>
              <th className="text-left p-4">Сума</th>
              <th className="text-left p-4">Статус</th>
              <th className="text-left p-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold">{order.order_number}</td>
                <td className="p-4">{new Date(order.created_at).toLocaleDateString('uk-UA')}</td>
                <td className="p-4">{order.customer_name}</td>
                <td className="p-4">{order.customer_phone}</td>
                <td className="p-4 font-bold">{order.total} ₴</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="text-primary hover:underline"
                  >
                    Деталі
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
