import apiClient from './client'

export interface OrderItem {
  product_id: number
  name: string
  price: number
  quantity: number
}

export interface OrderData {
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_comment?: string
  delivery_type: 'pickup' | 'nova_post' | 'ukr_post' | 'courier'
  delivery_data?: any
  delivery_address?: string
  payment_type: 'cash_on_delivery' | 'card' | 'liqpay'
  items: OrderItem[]
  subtotal: number
  delivery_cost: number
  total: number
}

export interface OrderResponse {
  id: number
  order_number: string
  message: string
}

export const ordersApi = {
  create: (order: OrderData): Promise<{ data: OrderResponse }> => {
    return apiClient.post('/orders', order)
  },
}
