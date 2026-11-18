const DEFAULT_FAVICON = '/favicon.svg'

/**
 * Troca a favicon da aba em tempo real.
 * Sem URL (loja sem logo), restaura o ícone padrão do site.
 */
export function setFavicon(logoUrl?: string | null): void {
  const icon = logoUrl?.trim()

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  if (icon) {
    link.href = icon
    link.removeAttribute('type')
  } else {
    link.href = DEFAULT_FAVICON
    link.setAttribute('type', 'image/svg+xml')
  }
}
