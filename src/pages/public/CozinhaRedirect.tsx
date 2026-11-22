import { useEffect, useState } from 'react'
// no router Navigate needed; using window.location.replace
import { useAuth } from '@/contexts/AuthContext'
import { storesService } from '@/services'

export default function CozinhaRedirect() {
  const { user, loading } = useAuth()
  const [slug, setSlug] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user?.storeId) {
      setError(true)
      return
    }
    storesService.getById(user.storeId).then((store) => {
      if (store?.slug) {
        setSlug(store.slug)
      } else {
        setError(true)
      }
    }).catch(() => setError(true))
  }, [user, loading])

  if (loading || (!slug && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error || !slug) {
    window.location.replace('/auth/login?redirect=/cozinha')
    return null
  }

  window.location.replace(`/${slug}/cozinha`)
  return null
}