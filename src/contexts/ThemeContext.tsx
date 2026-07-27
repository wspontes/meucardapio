import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  applyStoreTheme: (themeData?: { logo?: string; colorPrimary?: string; colorSecondary?: string; buttonColor?: string }) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyThemeVars(colorPrimary?: string, colorSecondary?: string, buttonColor?: string) {
  const root = document.documentElement
  if (colorPrimary) {
    root.style.setProperty('--theme-primary', colorPrimary)
    const r = parseInt(colorPrimary.slice(1, 3), 16)
    const g = parseInt(colorPrimary.slice(3, 5), 16)
    const b = parseInt(colorPrimary.slice(5, 7), 16)
    root.style.setProperty('--theme-surface', `rgb(${Math.min(255, r + 16)}, ${Math.min(255, g + 16)}, ${Math.min(255, b + 16)})`)
  }
  if (colorSecondary) {
    root.style.setProperty('--theme-secondary', colorSecondary)
  }
  if (buttonColor) {
    root.style.setProperty('--theme-button', buttonColor)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    return (stored as Theme) || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const applyStoreTheme = (themeData?: { logo?: string; colorPrimary?: string; colorSecondary?: string; buttonColor?: string }) => {
    applyThemeVars(themeData?.colorPrimary, themeData?.colorSecondary, themeData?.buttonColor)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, applyStoreTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
