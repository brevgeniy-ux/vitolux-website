import { useEffect, useState } from 'react'
import apiClient from '../api/client'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/admin/categories')
      setCategories(res.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Категорії</h1>
        <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
          Додати категорію
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ul className="space-y-2">
          {categories.map(category => (
            <li key={category.id} className="flex items-center justify-between p-3 border rounded">
              <span>{category.name_uk}</span>
              <div className="space-x-2">
                <button className="text-primary hover:underline">Редагувати</button>
                <button className="text-danger hover:underline">Видалити</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
