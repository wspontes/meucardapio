import type { UserRole, OrderStatus } from '@/config'

export interface Store {
  id: string
  name: string
  slug: string
  whatsapp: string
  instagram?: string
  colorPrimary?: string
  colorSecondary?: string
  logo?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  storeId: string
  name: string
  email: string
  phone?: string
  role: UserRole
  photoURL?: string
  createdAt: string
  updatedAt: string
  active: boolean
}

export interface Address {
  id: string
  userId: string
  label: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  reference?: string
  isDefault: boolean
}

export interface Category {
  id: string
  storeId: string
  name: string
  slug: string
  description?: string
  image?: string
  order: number
  active: boolean
}

export interface Product {
  id: string
  storeId: string
  name: string
  slug: string
  description: string
  categoryId: string
  image: string
  price: number
  discountPrice?: number
  active: boolean
  featured: boolean
  section?: 'featured' | 'new' | 'promotion'
  customizable: boolean
  hasCrust?: boolean
  order?: number
  sizes?: Size[]
  ingredients?: ProductIngredient[]
  createdAt: Date
  updatedAt: Date
}

export interface Size {
  id: string
  name: string
  price: number
  maxFlavors: number
}

export interface ProductIngredient {
  ingredientId: string
  name: string
  removable: boolean
  extraPrice: number
}

export interface Ingredient {
  id: string
  name: string
  category: string
  active: boolean
}

export interface Border {
  id: string
  name: string
  price: number
  active: boolean
}

export interface Flavor {
  id: string
  name: string
  description?: string
  image?: string
  price: number
  categoryId: string
  active: boolean
}

export interface Order {
  id: string
  storeId: string
  customerId?: string
  customerName: string
  customerPhone: string
  deliveryAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    reference?: string
  }
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes?: string
  couponCode?: string
  changeNeeded?: boolean
  changeFor?: number
  deliveryType?: 'delivery' | 'pickup'
  preparationTime?: number
  deliveryTime?: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
  flavors?: string[]
  border?: string
  borderPrice?: number
  hasCrust?: boolean
  extras?: string[]
  removedIngredients?: string[]
  notes?: string
}

export type PaymentMethod = 'pix' | 'card' | 'cash' | 'credit' | 'debit' | 'delivery'
export type PaymentStatus = 'pending' | 'paid' | 'approved' | 'rejected' | 'refunded'

export interface Coupon {
  id: string
  storeId: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder?: number
  maxUses?: number
  usedCount: number
  expiresAt: Date
  active: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  image?: string
  type: 'product' | 'category' | 'order'
  discount: number
  startsAt: string
  endsAt: string
  active: boolean
}

export interface DeliveryConfig {
  neighborhoods: DeliveryNeighborhood[]
  baseFee: number
  freeDeliveryMinOrder?: number
}

export interface DeliveryNeighborhood {
  name: string
  fee: number
  estimatedTime: number
  active: boolean
}

export interface BusinessHours {
  dayOfWeek: number
  open: string
  close: string
  closed: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  type: 'order' | 'system' | 'promotion'
  createdAt: string
}
