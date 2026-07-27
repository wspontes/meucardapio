import { where } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Category } from '@/types'

class CategoriesService extends FirestoreService<Category> {
  constructor() {
    super('categories')
  }

  async getActiveCategories() {
    const data = await this.getAll([
      where('active', '==', true),
    ])
    return data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  }

  async getAllOrdered() {
    const data = await this.getAll()
    return data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  }
}

export const categoriesService = new CategoriesService()
