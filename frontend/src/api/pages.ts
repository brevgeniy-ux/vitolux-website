import apiClient from './client'

export interface Page {
  id: number
  title_uk: string
  title_en: string
  slug: string
  content_uk?: string
  content_en?: string
}

export const pagesApi = {
  getBySlug: (slug: string) => {
    return apiClient.get(`/pages/${slug}`)
  },
}
