import { useEffect } from 'react'
import { Outlet, useParams, Link } from 'react-router-dom'
import { StoreProvider, useStore } from '@/contexts/StoreContext'
import { Header } from '@/components/layout'
import { Footer } from '@/components/layout'
import { UpdateToast } from '@/components/shared/UpdateToast'
import { trackVisit } from '@/utils/analytics'

function StoreContent() {
  const { store, loading, error } = useStore()

  useEffect(() => { if (store) trackVisit() }, [store])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Estabelecimento não encontrado</h1>
        <p className="text-muted mb-6">O link que você acessou não existe ou está inativo.</p>
        <Link to="/" className="text-accent hover:underline">Criar meu cardápio digital</Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-black">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <UpdateToast />
    </div>
  )
}

export function StoreLayout() {
  const { slug } = useParams<{ slug: string }>()

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <p className="text-muted">Slug não informado</p>
      </div>
    )
  }

  return (
    <StoreProvider slug={slug}>
      <StoreContent />
    </StoreProvider>
  )
}
