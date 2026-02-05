import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsApi, Product } from '../api/client'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll()
      setProducts(res.data.data || [])
    } catch (error) {
      toast.error('Помилка завантаження товарів')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    navigate('/products/new')
  }

  const handleEdit = (id: number) => {
    navigate(`/products/${id}/edit`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити товар?')) return
    try {
      await productsApi.delete(id)
      toast.success('Товар видалено')
      loadProducts()
    } catch (error) {
      toast.error('Помилка видалення')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Завантаження...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Товари</h1>
        <button
          onClick={handleAdd}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Додати товар
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4">Фото</th>
              <th className="text-left p-4">Назва</th>
              <th className="text-left p-4">Артикул</th>
              <th className="text-left p-4">Категорія</th>
              <th className="text-left p-4">Ціна</th>
              <th className="text-left p-4">Кількість</th>
              <th className="text-left p-4">Статус</th>
              <th className="text-left p-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                      Немає фото
                    </div>
                  )}
                </td>
                <td className="p-4 font-semibold">{product.name_uk}</td>
                <td className="p-4">{product.sku}</td>
                <td className="p-4">{product.category_name || '-'}</td>
                <td className="p-4">
                  <div>
                    <span className="font-bold text-primary">{product.price} ₴</span>
                    {product.old_price && (
                      <span className="text-gray-400 line-through text-sm ml-2">
                        {product.old_price} ₴
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">{product.quantity}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Активний' : 'Неактивний'}
                  </span>
                  {product.is_featured && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      ⭐
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className="text-primary hover:underline"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-danger hover:underline"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
