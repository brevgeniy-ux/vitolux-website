import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { productsApi, Product } from '../api/products'
import { useCartStore } from '../store/cartStore'

export default function SearchPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const query = searchParams.get('q') || ''
  const locale = i18n.language

  useEffect(() => {
    if (query) {
      searchProducts()
    }
  }, [query])

  const searchProducts = async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll({ search: query, per_page: 20 })
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
      <h1 className="text-3xl font-bold mb-8">
        {t('common.search')}: {query}
      </h1>

      {loading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">{t('catalog.no_products')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <Link to={`/product/${product.slug}`}>
                {product.main_image && (
                  <img src={product.main_image} alt={getProductName(product)} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{getProductName(product)}</h3>
                  <span className="text-primary font-bold">{product.price} ₴</span>
                </div>
              </Link>
              <div className="p-4 pt-0">
                <button
                  onClick={() => addItem(product)}
                  className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition"
                >
                  {t('common.add_to_cart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
