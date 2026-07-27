import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { getThemeById, DEFAULT_THEME_ID } from '@/config/themes'

export function useApplyTheme() {
  const { settings, loading } = useSettings()

  useEffect(() => {
    if (loading) return

    const themeId = settings?.theme?.themeId || DEFAULT_THEME_ID
    const theme = getThemeById(themeId)
    if (!theme) return

    applyThemeVars(theme)

    try {
      localStorage.setItem('meucardapio-theme', themeId)
    } catch { /* silent */ }
  }, [settings, loading])
}

export function applyThemeVars(theme: ReturnType<typeof getThemeById> & object) {
  const root = document.documentElement
  const s = root.style

  s.setProperty('--color-brand-black', theme.colors.brandBlack)
  s.setProperty('--color-brand-white', theme.colors.text)
  s.setProperty('--color-surface', theme.colors.surface)
  s.setProperty('--color-surface-hover', theme.colors.surfaceHover)
  s.setProperty('--color-border', theme.colors.border)
  s.setProperty('--color-muted', theme.colors.textMuted)
  s.setProperty('--color-accent', theme.colors.accent)
  s.setProperty('--color-button', theme.colors.button)
}
