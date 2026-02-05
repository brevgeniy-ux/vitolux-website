import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { productsApi, Product } from '../api/products'
import { categoriesApi, Category } from '../api/categories'
import { useCartStore } from '../store/cartStore'

export default function CatalogPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc',
    per_page: parseInt(searchParams.get('per_page') || '20'),
  })
  const locale = i18n.language

  useEffect(() => {
    loadProducts()
    categoriesApi.getAll().then(res => {
      setCategories(res.data || [])
    })
  }, [filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params: any = { ...filters }
      if (!params.category_id) delete params.category_id
      if (!params.min_price) delete params.min_price
      if (!params.max_price) delete params.max_price
      
      const res = await productsApi.getAll(params)
      setProducts(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getProductName = (product: Product) => {
    return locale === 'uk' ? product.name_uk : product.name_en
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64">
          <h2 className="text-xl font-bold mb-4">{t('catalog.filters')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Категорія</label>
              <select
                value={filters.category_id}
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="">Всі</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {locale === 'uk' ? cat.name_uk : cat.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold">Ціна від</label>
              <input
                type="number"
                value={filters.min_price}
                onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                className="w-full border rounded p-2"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Ціна до</label>
              <input
                type="number"
                value={filters.max_price}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                className="w-full border rounded p-2"
                placeholder="10000"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.in_stock}
                onChange={(e) => setFilters({ ...filters, in_stock: e.target.checked })}
                className="mr-2"
              />
              {t('catalog.in_stock')}
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{t('catalog.title')}</h1>
            <div className="flex items-center space-x-4">
              <select
                value={filters.sort_by}
                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                className="border rounded p-2"
              >
                <option value="created_at">{t('catalog.sort_new')}</option>
                <option value="price">{t('catalog.sort_price_asc')}</option>
                <option value="name">{t('catalog.sort_name')}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">{t('common.loading')}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">{t('catalog.no_products')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <Link to={`/product/${product.slug}`}>
                    {product.main_image && (
                      <img src={product.main_image} alt={getProductName(product)} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{getProductName(product)}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary font-bold">{product.price} ₴</span>
                        {product.old_price && (
                          <span className="text-gray-400 line-through text-sm">{product.old_price} ₴</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.quantity > 0 ? t('catalog.in_stock') : t('catalog.out_of_stock')}
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => addItem(product)}
                      disabled={product.quantity === 0}
                      className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {t('common.add_to_cart')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
