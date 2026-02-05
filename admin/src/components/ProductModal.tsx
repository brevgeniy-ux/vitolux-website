import { useState, useEffect } from 'react'
import { productsApi, categoriesApi, Category } from '../api/client'
import toast from 'react-hot-toast'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  productId?: number
  onSuccess: () => void
}

export default function ProductModal({ isOpen, onClose, productId, onSuccess }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name_uk: '',
    name_en: '',
    sku: '',
    description_uk: '',
    description_en: '',
    price: '',
    old_price: '',
    quantity: '',
    category_id: '',
    is_active: true,
    is_featured: false,
    image: '',
  })
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      if (productId) {
        loadProduct()
      } else {
        resetForm()
      }
    }
  }, [isOpen, productId])

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll()
      setCategories(res.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadProduct = async () => {
    if (!productId) return
    try {
      const res = await productsApi.getById(productId)
      const product = res.data
      setFormData({
        name_uk: product.name_uk || '',
        name_en: product.name_en || '',
        sku: product.sku || '',
        description_uk: product.description_uk || '',
        description_en: product.description_en || '',
        price: product.price?.toString() || '',
        old_price: product.old_price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        category_id: product.category_id?.toString() || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        image: product.image || '',
      })
      setImagePreview(product.image || '')
    } catch (error) {
      toast.error('Помилка завантаження товару')
    }
  }

  const resetForm = () => {
    setFormData({
      name_uk: '',
      name_en: '',
      sku: '',
      description_uk: '',
      description_en: '',
      price: '',
      old_price: '',
      quantity: '',
      category_id: '',
      is_active: true,
      is_featured: false,
      image: '',
    })
    setImagePreview('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await productsApi.uploadImage(file)
      setFormData({ ...formData, image: res.data.url })
      setImagePreview(res.data.url)
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
        price: parseFloat(formData.price) || 0,
        old_price: formData.old_price ? parseFloat(formData.old_price) : undefined,
        quantity: parseInt(formData.quantity) || 0,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      }

      if (productId) {
        await productsApi.update(productId, data)
        toast.success('Товар оновлено')
      } else {
        await productsApi.create(data)
        toast.success('Товар створено')
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {productId ? 'Редагувати товар' : 'Додати товар'}
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
                onChange={(e) => setFormData({ ...formData, name_uk: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Артикул *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Категорія</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="">Оберіть категорію</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name_uk}</option>
                ))}
              </select>
            </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Ціна *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Стара ціна</label>
              <input
                type="number"
                step="0.01"
                value={formData.old_price}
                onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Кількість *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full border rounded p-2"
                required
              />
            </div>
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

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              Активний
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="mr-2"
              />
              Рекомендований
            </label>
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
