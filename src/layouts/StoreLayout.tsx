import { useEffect, useRef } from 'react'
import { Outlet, useParams, Link } from 'react-router-dom'
import { StoreProvider, useStore } from '@/contexts/StoreContext'
import { Header } from '@/components/layout'
import { Footer } from '@/components/layout'
import { UpdateToast } from '@/components/shared/UpdateToast'
import { trackVisit } from '@/utils/analytics'
import { useSettings } from '@/hooks'

function StoreContent() {
  const { store, loading, error } = useStore()
  const { settings } = useSettings()
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => { if (store) trackVisit() }, [store])

  useEffect(() => {
    const t = settings?.theme
    if (!t) return

    const primary = t.colorPrimary
    const secondary = t.colorSecondary
    const button = t.buttonColor

    if (!primary && !secondary && !button) return

    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.id = 'store-theme'
      document.head.appendChild(styleRef.current)
    }

    let css = ''
    if (primary) {
      const r = parseInt(primary.slice(1, 3), 16)
      const g = parseInt(primary.slice(3, 5), 16)
      const b = parseInt(primary.slice(5, 7), 16)
      const surface = `rgb(${Math.min(255, r + 16)}, ${Math.min(255, g + 16)}, ${Math.min(255, b + 16)})`
      css += `
        body { background-color: ${primary} !important; }
        .bg-brand-black { background-color: ${primary} !important; }
        .bg-surface { background-color: ${surface} !important; }
      `
    }
    if (secondary) {
      css += `
        .text-accent { color: ${secondary} !important; }
        .bg-accent { background-color: ${secondary} !important; }
        .border-accent { border-color: ${secondary} !important; }
        .bg-accent\\/10 { background-color: ${secondary}1a !important; }
        .bg-accent\\/20 { background-color: ${secondary}33 !important; }
        .border-accent\\/30 { border-color: ${secondary}4d !important; }
        .hover\\:text-accent:hover { color: ${secondary} !important; }
        .hover\\:border-accent\\/50:hover { border-color: ${secondary}80 !important; }
        .hover\\:bg-accent\\/10:hover { background-color: ${secondary}1a !important; }
        .hover\\:shadow-accent\\/5:hover { --tw-shadow-color: ${secondary}0d !important; }
        .focus\\:border-accent:focus { border-color: ${secondary} !important; }
        .focus\\:ring-accent:focus { --tw-ring-color: ${secondary} !important; }
        .decoration-accent\\/50 { text-decoration-color: ${secondary}80 !important; }
        [class*="from-accent\\/10"] { --tw-gradient-from: ${secondary}1a !important; }
        [class*="from-accent\\/20"] { --tw-gradient-from: ${secondary}33 !important; }
        .group:hover .group-hover\\:text-accent { color: ${secondary} !important; }
      `
    }
    if (button) {
      css += `
        .bg-button { background-color: ${button} !important; }
        .focus\\:ring-button\\/50:focus { --tw-ring-color: ${button}80 !important; }
      `
    }

    styleRef.current.textContent = css
  }, [settings])

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
