import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '../store/cartStore'
import { ordersApi } from '../api/orders'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_comment: '',
    delivery_type: 'pickup' as 'pickup' | 'nova_post' | 'ukr_post' | 'courier',
    delivery_data: {},
    payment_type: 'cash_on_delivery' as 'cash_on_delivery' | 'card' | 'liqpay',
  })

  const subtotal = getTotal()
  const deliveryPrice = formData.delivery_type === 'pickup' ? 0 : (subtotal >= 2000 ? 0 : 100)
  const total = subtotal + deliveryPrice

  const handleSubmit = async () => {
    try {
      const order = {
        ...formData,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      }

      const res = await ordersApi.create(order)
      toast.success(t('checkout.order_success'))
      clearCart()
      navigate(`/order-success/${res.data.order_number}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('checkout.title')}</h1>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? 'bg-primary text-white' : 'bg-gray-300'}`}>
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-1 ${step > s ? 'bg-primary' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">{t('checkout.step1')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-semibold">{t('common.name')} *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">{t('common.phone')} *</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full border rounded p-2"
                    placeholder="+380XXXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">{t('common.email')} *</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">{t('common.comment')}</label>
                  <textarea
                    value={formData.customer_comment}
                    onChange={(e) => setFormData({ ...formData, customer_comment: e.target.value })}
                    className="w-full border rounded p-2"
                    rows={4}
                  />
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.customer_name || !formData.customer_phone || !formData.customer_email}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Далі
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">{t('checkout.step2')}</h2>
              <div className="space-y-4">
                {['pickup', 'nova_post', 'ukr_post', 'courier'].map(type => (
                  <label key={type} className="flex items-center p-4 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="delivery_type"
                      value={type}
                      checked={formData.delivery_type === type}
                      onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value as any })}
                      className="mr-4"
                    />
                    <span>{t(`checkout.delivery_${type}`)}</span>
                  </label>
                ))}
                <div className="flex space-x-4">
                  <button onClick={() => setStep(1)} className="flex-1 border py-2 rounded">
                    Назад
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-primary text-white py-2 rounded">
                    Далі
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">{t('checkout.step3')}</h2>
              <div className="space-y-4">
                {['cash_on_delivery', 'card', 'liqpay'].map(type => (
                  <label key={type} className="flex items-center p-4 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment_type"
                      value={type}
                      checked={formData.payment_type === type}
                      onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
                      className="mr-4"
                    />
                    <span>{t(`checkout.payment_${type.split('_')[0]}`)}</span>
                  </label>
                ))}
                <div className="flex space-x-4">
                  <button onClick={() => setStep(2)} className="flex-1 border py-2 rounded">
                    Назад
                  </button>
                  <button onClick={() => setStep(4)} className="flex-1 bg-primary text-white py-2 rounded">
                    Далі
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">{t('checkout.step4')}</h2>
              <div className="space-y-4 mb-6">
                <p><strong>{t('common.name')}:</strong> {formData.customer_name}</p>
                <p><strong>{t('common.phone')}:</strong> {formData.customer_phone}</p>
                <p><strong>{t('common.email')}:</strong> {formData.customer_email}</p>
                <p><strong>{t('checkout.step2')}:</strong> {t(`checkout.delivery_${formData.delivery_type}`)}</p>
                <p><strong>{t('checkout.step3')}:</strong> {t(`checkout.payment_${formData.payment_type.split('_')[0]}`)}</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setStep(3)} className="flex-1 border py-2 rounded">
                  Назад
                </button>
                <button onClick={handleSubmit} className="flex-1 bg-primary text-white py-2 rounded">
                  {t('common.submit')}
                </button>
              </div>
            </div>
          )}
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
                <span className="font-semibold">{deliveryPrice} ₴</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>{t('cart.total')}</span>
                <span>{total} ₴</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
