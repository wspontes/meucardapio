import {
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Store } from '@/types'

const COLLECTION = 'stores'

export const storesService = {
  async getById(id: string): Promise<Store | null> {
    const snapshot = await getDoc(doc(db, COLLECTION, id))
    if (!snapshot.exists()) return null
    return { id: snapshot.id, ...snapshot.data() } as Store
  },

  async getBySlug(slug: string): Promise<Store | null> {
    const q = query(collection(db, COLLECTION), where('slug', '==', slug), where('active', '==', true))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Store
  },

  async create(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    const now = new Date().toISOString()
    const docRef = doc(collection(db, COLLECTION))
    const store: Store = { ...data, id: docRef.id, createdAt: now, updatedAt: now }
    await setDoc(docRef, store)
    return store
  },

  async update(id: string, data: Partial<Store>): Promise<void> {
    await setDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() }, { merge: true })
  },

  async slugExists(slug: string): Promise<boolean> {
    const q = query(collection(db, COLLECTION), where('slug', '==', slug))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  },
}
