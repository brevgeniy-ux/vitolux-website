import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { productsApi, Product } from '../api/products'
import { useCartStore } from '../store/cartStore'
import toast from 'react-hot-toast'

export default function ProductPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const locale = i18n.language

  useEffect(() => {
    if (slug) {
      loadProduct()
    }
  }, [slug])

  const loadProduct = async () => {
    try {
      const res = await productsApi.getAll({ search: slug, per_page: 1 })
      if (res.data.data && res.data.data.length > 0) {
        const prod = res.data.data[0]
        setProduct(prod)
        setSelectedImage(prod.main_image || null)
        
        // Load similar products
        const similarRes = await productsApi.getAll({ category_id: prod.category_id, per_page: 4 })
        setSimilarProducts(similarRes.data.data?.filter((p: Product) => p.id !== prod.id) || [])
      }
    } catch (error) {
      console.error(error)
      toast.error(t('common.error'))
    }
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-12 text-center">{t('common.loading')}</div>
  }

  const getProductName = (p: Product) => locale === 'uk' ? p.name_uk : p.name_en
  const getDescription = (p: Product) => locale === 'uk' ? p.description_uk : p.description_en

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast.success(t('common.success'))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="mb-4">
            {selectedImage && (
              <img src={selectedImage} alt={getProductName(product)} className="w-full h-96 object-cover rounded-lg" />
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="flex space-x-2">
              {product.main_image && (
                <button onClick={() => setSelectedImage(product.main_image!)}>
                  <img src={product.main_image} alt="" className="w-20 h-20 object-cover rounded border-2 border-primary" />
                </button>
              )}
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(img)}>
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded border-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{getProductName(product)}</h1>
          <div className="mb-4">
            <span className="text-gray-600">{t('product.sku')}: </span>
            <span className="font-semibold">{product.sku}</span>
          </div>
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded ${product.quantity > 0 ? 'bg-success text-white' : 'bg-danger text-white'}`}>
              {product.quantity > 0 ? t('product.in_stock') : t('product.out_of_stock')}
            </span>
          </div>
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-primary">{product.price} ₴</span>
              {product.old_price && (
                <span className="text-xl text-gray-400 line-through">{product.old_price} ₴</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold">{t('common.quantity')}</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border rounded flex items-center justify-center"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 border rounded p-2 text-center"
                min="1"
                max={product.quantity}
              />
              <button
                onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                className="w-10 h-10 border rounded flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 mb-4"
          >
            {t('common.add_to_cart')}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">{t('product.description')}</h2>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: getDescription(product) || '' }} />
      </div>

      {/* Specifications */}
      {product.attributes && product.attributes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{t('product.specifications')}</h2>
          <table className="w-full border-collapse">
            <tbody>
              {product.attributes.map((attr, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3 font-semibold">{attr.name}</td>
                  <td className="p-3">{attr.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('product.similar_products')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {similarProducts.map(similar => (
              <Link key={similar.id} to={`/product/${similar.slug}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {similar.main_image && (
                  <img src={similar.main_image} alt={getProductName(similar)} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{getProductName(similar)}</h3>
                  <span className="text-primary font-bold">{similar.price} ₴</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
