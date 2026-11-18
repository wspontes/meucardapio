import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from './store-context'
import type { ThemeColors } from '@/config/themes'

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
  productViewMode?: 'grid' | 'list'
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
    customColors?: ThemeColors
  }
  notificationSettings?: {
    enabled: boolean
    sound: 'bell' | 'chime' | 'buzzer' | 'beep'
    volume: number
  }
}

export interface SettingsBackup {
  id: string
  createdAt: number
  data: BusinessSettings
}

const MAX_BACKUPS = 30

function getStoreId(storeId?: string) {
  const sid = storeId || getCurrentStoreId()
  if (!sid) throw new Error('storeId is required for settings')
  return sid
}

function getDocRef(storeId?: string) {
  return doc(db, 'settings', getStoreId(storeId))
}

function getHistoryRef(storeId: string) {
  return collection(db, 'settings', storeId, 'history')
}

async function createBackup(storeId: string, data: BusinessSettings) {
  const createdAt = Date.now()
  await setDoc(doc(getHistoryRef(storeId), String(createdAt)), { createdAt, data })

  try {
    const snapshot = await getDocs(query(getHistoryRef(storeId), orderBy('createdAt', 'desc')))
    const expired = snapshot.docs.slice(MAX_BACKUPS)
    await Promise.all(expired.map((snap) => deleteDoc(snap.ref)))
  } catch {
    // A limpeza é best-effort: nunca deve impedir o salvamento.
  }
}

async function saveSettings(data: BusinessSettings, storeId?: string): Promise<void> {
  const sid = getStoreId(storeId)
  const ref = doc(db, 'settings', sid)

  try {
    const current = await getDoc(ref)
    if (current.exists()) {
      await createBackup(sid, current.data() as BusinessSettings)
    }
  } catch (err) {
    console.warn('Não foi possível criar o backup das configurações:', err)
  }

  await setDoc(ref, data)
}

export const settingsService = {
  async get(storeId?: string): Promise<BusinessSettings | null> {
    const snapshot = await getDoc(getDocRef(storeId))
    if (!snapshot.exists()) return null
    return snapshot.data() as BusinessSettings
  },

  save: saveSettings,

  async listBackups(storeId?: string, max = 20): Promise<SettingsBackup[]> {
    const sid = getStoreId(storeId)
    const snapshot = await getDocs(query(getHistoryRef(sid), orderBy('createdAt', 'desc'), limit(max)))
    return snapshot.docs
      .map((snap) => {
        const raw = snap.data() as { createdAt?: number; data?: BusinessSettings }
        return { id: snap.id, createdAt: raw.createdAt ?? 0, data: raw.data as BusinessSettings }
      })
      .filter((backup) => !!backup.data)
  },

  async restoreBackup(backupId: string, storeId?: string): Promise<void> {
    const sid = getStoreId(storeId)
    const snapshot = await getDoc(doc(getHistoryRef(sid), backupId))
    if (!snapshot.exists()) throw new Error('Backup não encontrado')
    const data = (snapshot.data() as { data?: BusinessSettings }).data
    if (!data) throw new Error('Backup inválido')
    await saveSettings(data, sid)
  },
}
