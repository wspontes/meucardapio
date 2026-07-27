import { FirestoreService } from './firestore'
import type { Coupon } from '@/types'

class CouponsService extends FirestoreService<Coupon> {
  constructor() {
    super('coupons')
  }
}

export const couponsService = new CouponsService()
