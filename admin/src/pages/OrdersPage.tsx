import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await apiClient.get('/admin/orders')
      setOrders(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { status })
      toast.success('Статус оновлено')
      loadOrders()
    } catch (error) {
      toast.error('Помилка оновлення')
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Замовлення</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
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
              <tr key={order.id} className="border-b">
                <td className="p-4">{order.order_number}</td>
                <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">{order.customer_name}</td>
                <td className="p-4">{order.customer_phone}</td>
                <td className="p-4">{order.total} ₴</td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="new">Новий</option>
                    <option value="processing">В обробці</option>
                    <option value="shipped">Відправлено</option>
                    <option value="completed">Завершено</option>
                    <option value="cancelled">Скасовано</option>
                  </select>
                </td>
                <td className="p-4">
                  <button className="text-primary hover:underline">Деталі</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
