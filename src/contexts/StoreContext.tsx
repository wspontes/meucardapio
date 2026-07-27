import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { storesService, setCurrentStoreId } from '@/services'
import type { Store } from '@/types'

interface StoreContextType {
  store: Store | null
  loading: boolean
  error: string | null
}

const StoreContext = createContext<StoreContextType>({ store: null, loading: true, error: null })

export function StoreProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    storesService.getBySlug(slug).then((result) => {
      if (cancelled) return
      if (!result) {
        setError('Estabelecimento não encontrado')
        setLoading(false)
        return
      }
      setStore(result)
      setCurrentStoreId(result.id)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setError('Erro ao carregar estabelecimento')
        setLoading(false)
      }
    })

    return () => { cancelled = true; setCurrentStoreId(null) }
  }, [slug])

  return (
    <StoreContext.Provider value={{ store, loading, error }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
