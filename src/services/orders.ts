import { where, orderBy } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Order } from '@/types'

class OrdersService extends FirestoreService<Order> {
  constructor() {
    super('orders')
  }

  async getByCustomer(customerId: string) {
    return this.getAll([
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
    ])
  }

  async getByStatus(status: string) {
    return this.getAll([
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    ])
  }

  async getPending() {
    return this.getAll([
      where('status', 'in', ['received', 'accepted']),
      orderBy('createdAt', 'asc'),
    ])
  }

  async getToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.getAll([
      where('createdAt', '>=', today.toISOString()),
      where('createdAt', '<', tomorrow.toISOString()),
      orderBy('createdAt', 'asc'),
    ])
  }
}

export const ordersService = new OrdersService()
