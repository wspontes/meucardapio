export interface ThemeColors {
  brandBlack: string
  surface: string
  surfaceHover: string
  border: string
  muted: string
  accent: string
  button: string
  text: string
  textMuted: string
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: ThemeColors
  preview: { bg: string; surface: string; accent: string; button: string }
}

export const THEMES: ThemePreset[] = [
  {
    id: 'escuro',
    name: 'Escuro',
    description: 'Tema escuro clássico',
    colors: {
      brandBlack: '#0a0a0a',
      surface: '#1a1a1a',
      surfaceHover: '#262626',
      border: 'transparent',
      muted: '#a3a3a3',
      accent: '#dc2626',
      button: '#dc2626',
      text: '#fafafa',
      textMuted: '#a3a3a3',
    },
    preview: { bg: '#0a0a0a', surface: '#1a1a1a', accent: '#dc2626', button: '#dc2626' },
  },
  {
    id: 'claro',
    name: 'Claro',
    description: 'Fundo claro, ideal para delivery',
    colors: {
      brandBlack: '#f8f9fa',
      surface: '#ffffff',
      surfaceHover: '#f1f3f5',
      border: 'transparent',
      muted: '#868e96',
      accent: '#e03131',
      button: '#e03131',
      text: '#1a1a1a',
      textMuted: '#868e96',
    },
    preview: { bg: '#f8f9fa', surface: '#ffffff', accent: '#e03131', button: '#e03131' },
  },
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Azul escuro com toques vibrantes',
    colors: {
      brandBlack: '#0f172a',
      surface: '#1e293b',
      surfaceHover: '#334155',
      border: 'transparent',
      muted: '#94a3b8',
      accent: '#38bdf8',
      button: '#38bdf8',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
    },
    preview: { bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8', button: '#38bdf8' },
  },
  {
    id: 'elegante',
    name: 'Elegante',
    description: 'Dourado sobre fundo escuro',
    colors: {
      brandBlack: '#1a1410',
      surface: '#2a2218',
      surfaceHover: '#3a3028',
      border: 'transparent',
      muted: '#a89880',
      accent: '#d4a843',
      button: '#d4a843',
      text: '#f5f0e8',
      textMuted: '#a89880',
    },
    preview: { bg: '#1a1410', surface: '#2a2218', accent: '#d4a843', button: '#d4a843' },
  },
  {
    id: 'vivo',
    name: 'Vivo',
    description: 'Verde vibrante, energia total',
    colors: {
      brandBlack: '#0a1a0f',
      surface: '#132a18',
      surfaceHover: '#1e3a24',
      border: 'transparent',
      muted: '#7fbf8f',
      accent: '#22c55e',
      button: '#22c55e',
      text: '#e8f5e9',
      textMuted: '#7fbf8f',
    },
    preview: { bg: '#0a1a0f', surface: '#132a18', accent: '#22c55e', button: '#22c55e' },
  },
]

export function getThemeById(id: string | undefined): ThemePreset | undefined {
  return THEMES.find((t) => t.id === id)
}

export const DEFAULT_THEME_ID = 'escuro'
