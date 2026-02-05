import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function OrderSuccessPage() {
  const { orderNumber } = useParams()
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('checkout.order_success')}</h1>
          {orderNumber && (
            <p className="text-xl text-gray-600">
              {t('checkout.order_number')}: <strong>{orderNumber}</strong>
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-700 mb-4">
            Дякуємо за ваше замовлення! Ми зв'яжемося з вами найближчим часом для підтвердження.
          </p>
          <p className="text-sm text-gray-500">
            Ви отримаєте SMS або email з деталями замовлення.
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <Link
            to="/catalog"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Продовжити покупки
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  )
}
