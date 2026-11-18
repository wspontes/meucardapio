import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { getThemeById, DEFAULT_THEME_ID, CUSTOM_THEME_ID, type ThemeColors } from '@/config/themes'

export function useApplyTheme() {
  const { settings, loading } = useSettings()

  useEffect(() => {
    if (loading) return

    const themeId = settings?.theme?.themeId || DEFAULT_THEME_ID

    if (themeId === CUSTOM_THEME_ID && settings?.theme?.customColors) {
      applyThemeVars(settings.theme.customColors)
    } else {
      const theme = getThemeById(themeId)
      if (!theme) return
      applyThemeVars(theme.colors)
    }

    try {
      localStorage.setItem('meucardapio-theme', themeId)
    } catch { /* silent */ }
  }, [settings, loading])
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
