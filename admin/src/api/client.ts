import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://vitoluxua.com/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Добавление токена к запросам
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// Types
export interface Product {
  id: number
  name_uk: string
  name_en: string
  sku: string
  description_uk?: string
  description_en?: string
  price: number
  old_price?: number
  quantity: number
  category_id?: number
  category_name?: string
  is_active: boolean
  is_featured: boolean
  image?: string
}

export interface Category {
  id: number
  name_uk: string
  name_en: string
  description_uk?: string
  description_en?: string
  slug: string
  image?: string
  is_active: boolean
  order_index: number
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_comment?: string
  delivery_type: string
  delivery_address?: string
  payment_type: string
  items: any[]
  subtotal: number
  delivery_cost: number
  total: number
  status: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface Settings {
  site_name: string
  site_phone: string
  site_email: string
  telegram_bot_token: string
  telegram_chat_id: string
  telegram_notifications_enabled: string
  free_delivery_threshold: string
  delivery_cost: string
}

export interface DashboardStats {
  stats: {
    orders_today: number
    orders_week: number
    sales_month: number
    products_count: number
  }
  recent_orders: Order[]
  top_products: any[]
}

// Products API
export const productsApi = {
  getAll: () => apiClient.get('/products'),
  getById: (id: number) => apiClient.get(`/products/${id}`),
  create: (data: Partial<Product>) => apiClient.post('/products', data),
  update: (id: number, data: Partial<Product>) => apiClient.put(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// Categories API
export const categoriesApi = {
  getAll: () => apiClient.get('/categories'),
  getById: (id: number) => apiClient.get(`/categories/${id}`),
  create: (data: Partial<Category>) => apiClient.post('/categories', data),
  update: (id: number, data: Partial<Category>) => apiClient.put(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`),
}

// Orders API
export const ordersApi = {
  getAll: (filters?: { status?: string }) => {
    const params = filters?.status ? { status: filters.status } : {}
    return apiClient.get('/orders', { params })
  },
  getById: (id: number) => apiClient.get(`/orders/${id}`),
  updateStatus: (id: number, status: string, adminNotes?: string) => 
    apiClient.put(`/orders/${id}`, { status, admin_notes: adminNotes }),
}

// Settings API
export const settingsApi = {
  getAll: () => apiClient.get('/settings'),
  update: (data: Partial<Settings>) => apiClient.put('/settings', data),
  testTelegram: () => apiClient.post('/settings/test-telegram'),
}

// Dashboard API
export const dashboardApi = {
  getStats: () => apiClient.get('/admin/dashboard/stats'),
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post('/login', { email, password }),
  logout: () => {
    localStorage.removeItem('admin_token')
  },
}
