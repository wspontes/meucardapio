import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: { name: string; username: string; email: string; password: string; storeId?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (fbUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
      if (userDoc.exists()) {
        setUser({ id: fbUser.uid, ...userDoc.data() } as User)
      } else {
        setUser({
          id: fbUser.uid,
          storeId: '',
          name: fbUser.displayName || 'Usuário',
          email: fbUser.email || '',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    } catch {
      setUser({
        id: fbUser.uid,
        storeId: '',
        name: fbUser.displayName || 'Usuário',
        email: fbUser.email || '',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        await fetchUserData(fbUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (identifier: string, password: string) => {
    let email = identifier

    if (!identifier.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('username', '==', identifier))
        const snapshot = await getDocs(q)
        if (!snapshot.empty) {
          email = snapshot.docs[0].data().email
        }
      } catch {
        // Se falhar buscar username, tenta usar o identifier como email direto
      }
    }

    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (data: { name: string; username: string; email: string; password: string; storeId?: string }) => {
    const result = await createUserWithEmailAndPassword(auth, data.email, data.password)
    await updateProfile(result.user, { displayName: data.name })
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        storeId: data.storeId || '',
        name: data.name,
        username: data.username,
        email: data.email,
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch {
      // Firestore pode estar bloqueado, mas o Auth já criou o usuário
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
