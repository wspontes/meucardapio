import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  applyStoreTheme: (themeData?: { logo?: string; colorPrimary?: string; colorSecondary?: string; buttonColor?: string }) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

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
    const root = document.documentElement
    if (themeData?.colorPrimary) root.style.setProperty('--color-primary', themeData.colorPrimary)
    if (themeData?.colorSecondary) root.style.setProperty('--color-secondary', themeData.colorSecondary)
    if (themeData?.buttonColor) root.style.setProperty('--color-button', themeData.buttonColor)
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
