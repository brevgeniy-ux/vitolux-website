import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '../../store/cartStore'
import { useLanguageStore } from '../../store/languageStore'
import Logo from '../Logo/Logo'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { getItemCount } = useCartStore()
  const { language, setLanguage } = useLanguageStore()
  const cartCount = getItemCount()

  const changeLanguage = (lang: 'uk' | 'en') => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary transition">
              {t('common.home')}
            </Link>
            <Link to="/catalog" className="text-gray-700 hover:text-primary transition">
              {t('common.catalog')}
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary transition">
              {t('common.about')}
            </Link>
            <Link to="/contacts" className="text-gray-700 hover:text-primary transition">
              {t('common.contacts')}
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeLanguage('uk')}
                className={`px-2 py-1 rounded ${language === 'uk' ? 'bg-primary text-white' : 'text-gray-700'}`}
              >
                UA
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded ${language === 'en' ? 'bg-primary text-white' : 'text-gray-700'}`}
              >
                EN
              </button>
            </div>

            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-primary transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
