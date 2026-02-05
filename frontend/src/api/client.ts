import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://vitoluxua.com/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export default apiClient
