import apiClient from './client'

export interface OrderItem {
  product_id: number
  quantity: number
}

export interface Order {
  customer_name: string
  customer_phone: string
  customer_email?: string
  customer_comment?: string
  delivery_type: 'pickup' | 'nova_post' | 'ukr_post' | 'courier'
  delivery_data?: any
  payment_type: 'cash_on_delivery' | 'card' | 'liqpay'
  items: OrderItem[]
}

export const ordersApi = {
  create: (order: Order) => {
    return apiClient.post('/orders', order)
  },
}
