import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type QueryConstraint,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from './store-context'

type WithId = { id: string }

export class FirestoreService<T> {
  protected collectionRef

  constructor(collectionName: string) {
    this.collectionRef = collection(db, collectionName)
  }

  private withStore(constraints?: QueryConstraint[]): QueryConstraint[] {
    const sid = getCurrentStoreId()
    const storeFilter = sid ? [where('storeId', '==', sid)] : []
    return [...storeFilter, ...(constraints || [])]
  }

  async getAll(constraints?: QueryConstraint[]): Promise<(T & WithId)[]> {
    try {
      const allConstraints = this.withStore(constraints)
      const q = allConstraints.length > 0 ? query(this.collectionRef, ...allConstraints) : query(this.collectionRef)
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & WithId))
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getById(id: string): Promise<(T & WithId) | null> {
    try {
      const docRef = doc(this.collectionRef, id)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) return null
      return { id: snapshot.id, ...snapshot.data() } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async create(data: Partial<T>): Promise<T & WithId> {
    try {
      const sid = getCurrentStoreId()
      const enriched = sid ? { ...data, storeId: sid } : data
      const clean = JSON.parse(JSON.stringify(enriched))
      const docRef = await addDoc(this.collectionRef, clean as Record<string, unknown>)
      return { id: docRef.id, ...enriched } as T & WithId
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      const clean = JSON.parse(JSON.stringify(data))
      await updateDoc(docRef, clean as Record<string, unknown>)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, id)
      await deleteDoc(docRef)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async queryByField(field: string, value: unknown): Promise<(T & WithId)[]> {
    return this.getAll([where(field, '==', value)])
  }

  async getActive(): Promise<(T & WithId)[]> {
    return this.getAll([where('active', '==', true)])
  }

  protected handleError(error: unknown): Error {
    const firestoreError = error as FirestoreError
    return new Error(firestoreError.message || 'Erro ao acessar o banco de dados')
  }
}
