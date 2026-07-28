import { where } from 'firebase/firestore'
import { FirestoreService } from './firestore'
import type { Product } from '@/types'

class ProductsService extends FirestoreService<Product> {
  constructor() {
    super('products')
  }

  async getActiveProducts() {
    const data = await this.getAll([
      where('active', '==', true),
    ])
    return data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))
  }

  async getByCategory(categoryId: string) {
    const data = await this.getAll([
      where('categoryId', '==', categoryId),
      where('active', '==', true),
    ])
    return data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))
  }

  async searchByName(term: string) {
    const products = await this.getActiveProducts()
    const lowerTerm = term.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerTerm) ||
        p.description.toLowerCase().includes(lowerTerm)
    )
  }
}

export const productsService = new ProductsService()
