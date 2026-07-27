import { useEffect } from 'react'
import { useSettings } from './useSettings'
import { useTheme } from '@/contexts/ThemeContext'

export function useApplyStoreTheme() {
  const { settings, loading } = useSettings()
  const { applyStoreTheme } = useTheme()

  useEffect(() => {
    if (!loading && settings?.theme) {
      applyStoreTheme(settings.theme)
    }
  }, [settings, loading, applyStoreTheme])
}
