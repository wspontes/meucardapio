import { createContext, useContext, useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { storesService, setCurrentStoreId } from '@/services'
import type { Store } from '@/types'

interface StoreGuardValue {
  store: Store | null
}

const StoreGuardContext = createContext<StoreGuardValue>({ store: null })

export function useStoreGuard() {
  return useContext(StoreGuardContext)
}

interface StoreGuardProps {
  children: React.ReactNode
}

export function StoreGuard({ children }: StoreGuardProps) {
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // PRIMEIRO: Tentar carregar pela slug da URL (white label isolation)
      if (slug) {
        try {
          const s = await storesService.getBySlug(slug)
          if (cancelled) return
          if (s) {
            setStore(s)
            setCurrentStoreId(s.id)
            setLoading(false)
            return
          }
        } catch {
          // ignore
        }
      }

      // SEGUIR CARREGAR pelo storeId da auth (apenas se não conseguiu pela slug)
      if (!store && user?.storeId && !cancelled) {
        try {
          const s = await storesService.getById(user.storeId)
          if (cancelled) return
          if (s) {
            setStore(s)
            setCurrentStoreId(s.id)
            setLoading(false)
            return
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    if (slug) {
      load()
    }

    return () => { cancelled = true; setCurrentStoreId(null) }
  }, [slug, user?.storeId, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/auth/login?redirect=/${slug}/admin`} replace />
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4 text-center">
        <h1 className="text-xl font-bold text-brand-white mb-2">Loja não encontrada</h1>
        <p className="text-muted">Entre em contato com o suporte.</p>
      </div>
    )
  }

  // Se houver slug na URL e o store tiver slug diferente, redirect
  // Isso evita que o slug da URL seja ignorado permanentemente
  if (slug && store.slug !== slug) {
    // Apenas redirect se a slug da URL for diferente do store slug
    // Isso permite que a primeira visita funcione, mas proteja contra uso indevido
    return <Navigate to={`/${store.slug}/admin`} replace />
  }

  return (
    <StoreGuardContext.Provider value={{ store }}>
      {children}
    </StoreGuardContext.Provider>
  )
}