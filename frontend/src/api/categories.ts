import apiClient from './client'

export interface Category {
  id: number
  name_uk: string
  name_en: string
  slug: string
  description_uk?: string
  description_en?: string
  image?: string
  parent_id?: number
  order: number
  children?: Category[]
}

export const categoriesApi = {
  getAll: (parentId?: number) => {
    return apiClient.get('/categories', { params: { parent_id: parentId } })
  },
  getById: (id: number) => {
    return apiClient.get(`/categories/${id}`)
  },
  getBySlug: (slug: string) => {
    return apiClient.get(`/categories?slug=${slug}`)
  },
}
