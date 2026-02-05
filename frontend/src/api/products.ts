import apiClient from './client'

export interface Product {
  id: number
  name_uk: string
  name_en: string
  sku: string
  slug: string
  short_description_uk?: string
  short_description_en?: string
  description_uk?: string
  description_en?: string
  price: number
  old_price?: number
  quantity: number
  main_image?: string
  images?: string[]
  attributes?: Array<{ name: string; value: string }>
  category_id: number
  manufacturer_id?: number
  is_popular: boolean
  is_new: boolean
  is_discount: boolean
  category?: { id: number; name_uk: string; name_en: string }
  manufacturer?: { id: number; name: string }
}

export const productsApi = {
  getAll: (params?: {
    category_id?: number
    manufacturer_id?: number
    min_price?: number
    max_price?: number
    in_stock?: boolean
    is_popular?: boolean
    is_new?: boolean
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    per_page?: number
    page?: number
  }) => {
    return apiClient.get('/products', { params })
  },
  getById: (id: number) => {
    return apiClient.get(`/products/${id}`)
  },
  getBySlug: (slug: string) => {
    return apiClient.get(`/products?slug=${slug}`)
  },
  search: (query: string) => {
    return apiClient.post('/search', { q: query })
  },
}
