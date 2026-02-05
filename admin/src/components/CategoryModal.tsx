import { useState, useEffect } from 'react'
import { categoriesApi } from '../api/client'
import toast from 'react-hot-toast'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId?: number
  onSuccess: () => void
}

export default function CategoryModal({ isOpen, onClose, categoryId, onSuccess }: CategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name_uk: '',
    name_en: '',
    description_uk: '',
    description_en: '',
    slug: '',
    image: '',
    is_active: true,
    order_index: '0',
  })
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      if (categoryId) {
        loadCategory()
      } else {
        resetForm()
      }
    }
  }, [isOpen, categoryId])

  const loadCategory = async () => {
    if (!categoryId) return
    try {
      const res = await categoriesApi.getById(categoryId)
      const category = res.data
      setFormData({
        name_uk: category.name_uk || '',
        name_en: category.name_en || '',
        description_uk: category.description_uk || '',
        description_en: category.description_en || '',
        slug: category.slug || '',
        image: category.image || '',
        is_active: category.is_active ?? true,
        order_index: category.order_index?.toString() || '0',
      })
      setImagePreview(category.image || '')
    } catch (error) {
      toast.error('Помилка завантаження категорії')
    }
  }

  const resetForm = () => {
    setFormData({
      name_uk: '',
      name_en: '',
      description_uk: '',
      description_en: '',
      slug: '',
      image: '',
      is_active: true,
      order_index: '0',
    })
    setImagePreview('')
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name_uk: name })
    if (!categoryId && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(name) }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('https://vitoluxua.com/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      })
      const data = await res.json()
      setFormData(prev => ({ ...prev, image: data.url }))
      setImagePreview(data.url)
      toast.success('Зображення завантажено')
    } catch (error) {
      toast.error('Помилка завантаження зображення')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        order_index: parseInt(formData.order_index) || 0,
      }

      if (categoryId) {
        await categoriesApi.update(categoryId, data)
        toast.success('Категорію оновлено')
      } else {
        await categoriesApi.create(data)
        toast.success('Категорію створено')
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {categoryId ? 'Редагувати категорію' : 'Додати категорію'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Назва (UA) *</label>
              <input
                type="text"
                value={formData.name_uk}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Назва (EN)</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Опис (UA)</label>
            <textarea
              value={formData.description_uk}
              onChange={(e) => setFormData({ ...formData, description_uk: e.target.value })}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Опис (EN)</label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Зображення</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full border rounded p-2"
            />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Порядок сортування</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                Активна
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
