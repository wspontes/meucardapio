/** Remove a tela de entrada assim que o tema/app estiver pronto. */
export function hideAppSplash(): void {
  const splash = document.getElementById('app-splash')
  if (!splash || splash.classList.contains('is-hidden')) return

  splash.classList.add('is-hidden')
  window.setTimeout(() => splash.remove(), 400)
}
