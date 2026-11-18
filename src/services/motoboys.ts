import { FirestoreService } from './firestore'
import type { Motoboy } from '@/types'

class MotoboysService extends FirestoreService<Motoboy> {
  constructor() {
    super('motoboys')
  }
}

export const motoboysService = new MotoboysService()
