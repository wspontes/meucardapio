import { useEffect } from 'react'
import { useStore } from '@/contexts/StoreContext'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { setFavicon } from '@/utils/favicon'
import { useSettings } from './useSettings'

/**
 * Aplica o logo da loja atual como favicon.
 * Cada loja tem seu próprio logo; sem logo, mantém o favicon padrão.
 */
export function useStoreFavicon() {
  const { store } = useStore()
  const { settings } = useSettings()
  const logo = settings?.theme?.logo || store?.logo || null

  useEffect(() => {
    setFavicon(logo ? resolveImageUrl(logo) : null)
    // Ao sair da loja, volta ao ícone padrão.
    return () => setFavicon(null)
  }, [logo])
}
