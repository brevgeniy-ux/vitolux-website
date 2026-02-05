import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Logo from './Logo'

export default function Layout() {
  const { logout, user } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Logo />
              <Link
                to="/"
                className={`px-3 py-2 rounded ${isActive('/') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Dashboard
              </Link>
              <Link
                to="/products"
                className={`px-3 py-2 rounded ${isActive('/products') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Товари
              </Link>
              <Link
                to="/categories"
                className={`px-3 py-2 rounded ${isActive('/categories') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Категорії
              </Link>
              <Link
                to="/orders"
                className={`px-3 py-2 rounded ${isActive('/orders') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Замовлення
              </Link>
              <Link
                to="/settings"
                className={`px-3 py-2 rounded ${isActive('/settings') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Налаштування
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="bg-danger text-white px-4 py-2 rounded hover:bg-danger/90"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
