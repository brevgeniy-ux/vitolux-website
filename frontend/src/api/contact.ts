import apiClient from './client'

export interface ContactForm {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export const contactApi = {
  send: (data: ContactForm) => {
    return apiClient.post('/contact', data)
  },
}
