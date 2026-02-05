import { useEffect, useState } from 'react'
import { categoriesApi, Category } from '../api/client'
import CategoryModal from '../components/CategoryModal'
import toast from 'react-hot-toast'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | undefined>()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await categoriesApi.getAll()
      setCategories(res.data.data || [])
    } catch (error) {
      toast.error('Помилка завантаження категорій')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCategoryId(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (id: number) => {
    setEditingCategoryId(id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити категорію?')) return
    try {
      await categoriesApi.delete(id)
      toast.success('Категорію видалено')
      loadCategories()
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
        <h1 className="text-3xl font-bold">Категорії</h1>
        <button
          onClick={handleAdd}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Додати категорію
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  {category.image && (
                    <img src={category.image} alt="" className="w-12 h-12 object-cover rounded" />
                  )}
                  <div>
                    <h3 className="font-semibold">{category.name_uk}</h3>
                    {category.slug && (
                      <p className="text-sm text-gray-500">/{category.slug}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category.id)}
                      className="text-primary hover:underline"
                    >
                      Редагувати
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-danger hover:underline"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryId={editingCategoryId}
        onSuccess={loadCategories}
      />
    </div>
  )
}
