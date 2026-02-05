import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const res = await apiClient.get('/admin/products')
      setProducts(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити товар?')) return
    try {
      await apiClient.delete(`/admin/products/${id}`)
      toast.success('Товар видалено')
      loadProducts()
    } catch (error) {
      toast.error('Помилка видалення')
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Товари</h1>
        <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
          Додати товар
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Фото</th>
              <th className="text-left p-4">Назва</th>
              <th className="text-left p-4">Артикул</th>
              <th className="text-left p-4">Ціна</th>
              <th className="text-left p-4">Кількість</th>
              <th className="text-left p-4">Статус</th>
              <th className="text-left p-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b">
                <td className="p-4">
                  {product.main_image && (
                    <img src={product.main_image} alt="" className="w-16 h-16 object-cover rounded" />
                  )}
                </td>
                <td className="p-4">{product.name_uk}</td>
                <td className="p-4">{product.sku}</td>
                <td className="p-4">{product.price} ₴</td>
                <td className="p-4">{product.quantity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-primary hover:underline mr-4">Редагувати</button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-danger hover:underline"
                  >
                    Видалити
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
