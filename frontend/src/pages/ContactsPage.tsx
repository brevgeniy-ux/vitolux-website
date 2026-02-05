import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { contactApi } from '../api/contact'
import toast from 'react-hot-toast'

export default function ContactsPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await contactApi.send(formData)
      toast.success(t('common.success'))
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'))
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t('contacts.title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('contacts.form_title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">{t('common.name')} *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">{t('common.email')} *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">{t('common.phone')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded p-2"
                placeholder="+380XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Тема</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">{t('common.comment')} *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full border rounded p-2"
                rows={6}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              {t('common.submit')}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Контактна інформація</h2>
          <div className="space-y-4">
            <div>
              <strong>{t('contacts.phone')}:</strong> +380XXXXXXXXX
            </div>
            <div>
              <strong>{t('contacts.email')}:</strong> info@vitoluxua.com
            </div>
            <div>
              <strong>{t('contacts.address')}:</strong> Адрес для самовывоза
            </div>
            <div>
              <strong>{t('contacts.working_hours')}:</strong> Пн-Пт: 9:00-18:00
            </div>
          </div>
          
          <div className="mt-8">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.0!2d30.5234!3d50.4501!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTDCsDI3JzAwLjQiTiAzMMKwMzEnMjQuMiJF!5e0!3m2!1suk!2sua!4v1234567890"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
