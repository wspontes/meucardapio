import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from './store-context'

export interface BusinessSettings {
  businessHours: {
    dayOfWeek: number
    open: string
    close: string
    closed: boolean
  }[]
  businessHoursEnabled?: boolean
  minOrder?: number
  freeDeliveryFrom?: number
  neighborhoods: {
    name: string
    fee: number
    estimatedTime: number
    active: boolean
  }[]
  defaultDeliveryFee?: number
  paymentMethods?: {
    pix?: { enabled: boolean; key?: string; qrCode?: string }
    credit?: { enabled: boolean; installments?: number }
    debit?: { enabled: boolean }
    cash?: { enabled: boolean }
    delivery?: { enabled: boolean }
  }
  whatsapp?: string
  instagram?: string
  phone?: string
  address?: string
  crustOptions?: { name: string; price: number }[]
  banners?: {
    items: {
      title: string
      subtitle: string
      image?: string
      linkProductId?: string
      align?: 'left' | 'center' | 'right'
      textColor?: string
      opacity?: number
    }[]
    active: boolean
    scrollStyle: 'dots' | 'arrows' | 'none'
  }
  theme?: {
    logo?: string
    themeId?: string
  }
}

function getDocRef(storeId?: string) {
  const sid = storeId || getCurrentStoreId()
  if (!sid) throw new Error('storeId is required for settings')
  return doc(db, 'settings', sid)
}

export const settingsService = {
  async get(storeId?: string): Promise<BusinessSettings | null> {
    const snapshot = await getDoc(getDocRef(storeId))
    if (!snapshot.exists()) return null
    return snapshot.data() as BusinessSettings
  },

  async save(data: BusinessSettings, storeId?: string): Promise<void> {
    await setDoc(getDocRef(storeId), data)
  },
}
