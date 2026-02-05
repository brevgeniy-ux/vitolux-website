import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { productsApi, Product } from '../api/products'
import { categoriesApi, Category } from '../api/categories'
import { useCartStore } from '../store/cartStore'

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const { addItem } = useCartStore()
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const locale = i18n.language

  useEffect(() => {
    productsApi.getAll({ is_popular: true, per_page: 8 }).then(res => {
      setPopularProducts(res.data.data || [])
    })
    productsApi.getAll({ is_new: true, per_page: 8 }).then(res => {
      setNewProducts(res.data.data || [])
    })
    categoriesApi.getAll().then(res => {
      setCategories(res.data || [])
    })
  }, [])

  const getProductName = (product: Product) => {
    return locale === 'uk' ? product.name_uk : product.name_en
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('home.title')}</h1>
          <p className="text-xl mb-8">{t('home.slogan')}</p>
          <Link
            to="/catalog"
            className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            {t('common.catalog')}
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('common.catalog')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 8).map(category => (
              <Link
                key={category.id}
                to={`/catalog/${category.slug}`}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition"
              >
                {category.image && (
                  <img src={category.image} alt={locale === 'uk' ? category.name_uk : category.name_en} className="w-16 h-16 mx-auto mb-4" />
                )}
                <h3 className="font-semibold">{locale === 'uk' ? category.name_uk : category.name_en}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('home.advantages.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="font-semibold mb-2">{t('home.advantages.quality')}</h3>
              <p className="text-gray-600">{t('home.advantages.quality_desc')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="font-semibold mb-2">{t('home.advantages.delivery')}</h3>
              <p className="text-gray-600">{t('home.advantages.delivery_desc')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-semibold mb-2">{t('home.advantages.support')}</h3>
              <p className="text-gray-600">{t('home.advantages.support_desc')}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold mb-2">{t('home.advantages.price')}</h3>
              <p className="text-gray-600">{t('home.advantages.price_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-12 bg-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{t('home.popular_products')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {popularProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <Link to={`/product/${product.slug}`}>
                  {product.main_image && (
                    <img src={product.main_image} alt={getProductName(product)} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{getProductName(product)}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{product.price} ₴</span>
                      {product.old_price && (
                        <span className="text-gray-400 line-through text-sm">{product.old_price} ₴</span>
                      )}
                    </div>
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
        </div>
      </section>

      {/* New Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{t('home.new_products')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {newProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <Link to={`/product/${product.slug}`}>
                  {product.main_image && (
                    <img src={product.main_image} alt={getProductName(product)} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{getProductName(product)}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold">{product.price} ₴</span>
                      {product.old_price && (
                        <span className="text-gray-400 line-through text-sm">{product.old_price} ₴</span>
                      )}
                    </div>
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
        </div>
      </section>
    </div>
  )
}
