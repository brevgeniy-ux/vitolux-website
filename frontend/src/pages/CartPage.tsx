import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
export default function CartPage() {
  const { t, i18n } = useTranslation()
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  const locale = i18n.language

  const getProductName = (product: any) => {
    return locale === 'uk' ? product.name_uk : product.name_en
  }

  const subtotal = getTotal()
  const deliveryPrice = subtotal >= 2000 ? 0 : 100
  const total = subtotal + deliveryPrice

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">{t('cart.title')}</h1>
        <p className="text-gray-600 mb-8">{t('cart.empty')}</p>
        <Link to="/catalog" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition">
          {t('common.continue_shopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('cart.title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.product.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row gap-4">
                {item.product.main_image && (
                  <img src={item.product.main_image} alt={getProductName(item.product)} className="w-24 h-24 object-cover rounded" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{getProductName(item.product)}</h3>
                  <div className="text-primary font-bold mb-2">{item.product.price} ₴</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-danger hover:underline"
                    >
                      {t('common.remove')}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{item.product.price * item.quantity} ₴</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">{t('checkout.title')}</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold">{subtotal} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.delivery')}</span>
                <span className="font-semibold">
                  {deliveryPrice === 0 ? t('cart.free_delivery') : `${deliveryPrice} ₴`}
                </span>
              </div>
              {subtotal < 2000 && (
                <div className="text-sm text-gray-600">
                  {t('cart.free_delivery')} 2000 ₴
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>{t('cart.total')}</span>
                <span>{total} ₴</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full bg-primary text-white text-center py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              {t('common.checkout')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
