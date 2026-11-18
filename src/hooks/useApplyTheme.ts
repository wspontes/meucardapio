import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { getThemeById, DEFAULT_THEME_ID, CUSTOM_THEME_ID, type ThemeColors } from '@/config/themes'
import { hideAppSplash } from '@/utils/splash'

export function useApplyTheme() {
  const { settings, loading } = useSettings()

  useEffect(() => {
    if (loading) return

    const themeId = settings?.theme?.themeId || DEFAULT_THEME_ID
    const colors: ThemeColors | null =
      themeId === CUSTOM_THEME_ID && settings?.theme?.customColors
        ? settings.theme.customColors
        : (getThemeById(themeId)?.colors ?? null)

    if (!colors) return
    applyThemeVars(colors)

    try {
      localStorage.setItem('meucardapio-theme', themeId)
      cacheThemeColors(colors)
    } catch { /* silent */ }

    hideAppSplash()
  }, [settings, loading])
}

/** Guarda as cores resolvidas para o index.html aplicar antes do primeiro paint. */
function cacheThemeColors(colors: ThemeColors) {
  const snapshot = {
    bb: colors.brandBlack,
    bw: colors.text,
    sf: colors.surface,
    sh: colors.surfaceHover,
    bd: colors.border,
    mt: colors.textMuted,
    ac: colors.accent,
    bt: colors.button,
  }
  const json = JSON.stringify(snapshot)
  const slug = window.location.pathname.split('/').filter(Boolean)[0] || ''

  localStorage.setItem('meucardapio-theme-colors', json)
  if (slug) localStorage.setItem(`meucardapio-theme-colors:${slug}`, json)
}

export function applyThemeVars(colors: ThemeColors) {
  const root = document.documentElement
  const s = root.style

  s.setProperty('--color-brand-black', colors.brandBlack)
  s.setProperty('--color-brand-white', colors.text)
  s.setProperty('--color-surface', colors.surface)
  s.setProperty('--color-surface-hover', colors.surfaceHover)
  s.setProperty('--color-border', colors.border)
  s.setProperty('--color-muted', colors.textMuted)
  s.setProperty('--color-accent', colors.accent)
  s.setProperty('--color-button', colors.button)
}
