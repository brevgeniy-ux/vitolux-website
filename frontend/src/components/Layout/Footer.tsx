import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from '../Logo/Logo'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo />
            <p className="mt-4 text-gray-400">
              {t('home.slogan')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('common.catalog')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/catalog" className="hover:text-white transition">Всі товари</Link></li>
              <li><Link to="/catalog?is_new=true" className="hover:text-white transition">Новинки</Link></li>
              <li><Link to="/catalog?is_popular=true" className="hover:text-white transition">Популярні</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('common.contacts')}</h3>
            <ul className="space-y-2 text-gray-400">
              <li>📞 +380XXXXXXXXX</li>
              <li>✉️ info@vitoluxua.com</li>
              <li>📍 Адрес для самовывоза</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Інформація</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/about" className="hover:text-white transition">{t('common.about')}</Link></li>
              <li><Link to="/delivery" className="hover:text-white transition">{t('common.delivery')}</Link></li>
              <li><Link to="/contacts" className="hover:text-white transition">{t('common.contacts')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} VitoluxUA. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  )
}
