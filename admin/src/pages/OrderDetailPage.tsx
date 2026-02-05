import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersApi, Order } from '../api/client'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (id) {
      loadOrder()
    }
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const res = await ordersApi.getById(parseInt(id!))
      setOrder(res.data)
      setAdminNotes(res.data.admin_notes || '')
    } catch (error) {
      toast.error('Помилка завантаження замовлення')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return
    try {
      await ordersApi.updateStatus(parseInt(id), newStatus, adminNotes)
      toast.success('Статус оновлено')
      loadOrder()
    } catch (error) {
      toast.error('Помилка оновлення статусу')
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

  if (loading) {
    return <div className="text-center py-12">Завантаження...</div>
  }

  if (!order) {
    return <div>Замовлення не знайдено</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Замовлення #{order.order_number}</h1>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Назад до списку
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Інформація про клієнта</h2>
          <div className="space-y-2">
            <p><strong>Ім'я:</strong> {order.customer_name}</p>
            <p><strong>Телефон:</strong> {order.customer_phone}</p>
            {order.customer_email && (
              <p><strong>Email:</strong> {order.customer_email}</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Товари</h2>
          <div className="border rounded p-4">
            {Array.isArray(order.items) ? (
              order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                  <span>{item.name} x{item.quantity}</span>
                  <span className="font-semibold">{item.price * item.quantity} ₴</span>
                </div>
              ))
            ) : (
              <p>Товари не завантажені</p>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Підсумок:</span>
              <span className="font-semibold">{order.subtotal} ₴</span>
            </div>
            <div className="flex justify-between">
              <span>Доставка:</span>
              <span>{order.delivery_cost} ₴</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Всього:</span>
              <span>{order.total} ₴</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Доставка та оплата</h2>
          <div className="space-y-2">
            <p><strong>Тип доставки:</strong> {order.delivery_type}</p>
            {order.delivery_address && (
              <p><strong>Адреса:</strong> {order.delivery_address}</p>
            )}
            <p><strong>Тип оплати:</strong> {order.payment_type}</p>
          </div>
        </div>

        {order.customer_comment && (
          <div>
            <h2 className="text-xl font-bold mb-4">Коментар клієнта</h2>
            <p className="bg-gray-50 p-3 rounded">{order.customer_comment}</p>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-4">Управління замовленням</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Статус</label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full border rounded p-2"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Примітки адміністратора</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onBlur={() => handleStatusChange(order.status)}
                className="w-full border rounded p-2"
                rows={4}
                placeholder="Додайте примітки про замовлення"
              />
            </div>
          </div>
        </div>

        {order.admin_notes && (
          <div>
            <h2 className="text-xl font-bold mb-4">Примітки адміністратора</h2>
            <p className="bg-yellow-50 p-3 rounded">{order.admin_notes}</p>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>Створено: {new Date(order.created_at).toLocaleString('uk-UA')}</p>
          <p>Оновлено: {new Date(order.updated_at).toLocaleString('uk-UA')}</p>
        </div>
      </div>
    </div>
  )
}
