import { useMemo } from 'react'
import { Palette, Layout, Palette as PaletteIcon } from 'lucide-react'
import type { ThemeColors } from '@/config/themes'

interface ThemeColorPickerProps {
  colors: ThemeColors
  onChange: (colors: ThemeColors) => void
}

/**
 * As 4 cores principais que o admin pode configurar.
 * As demais cores (surfaceHover, border, muted, text, textMuted)
 * são derivadas automaticamente para manter consistência.
 */
const MAIN_COLOR_FIELDS: {
  key: keyof ThemeColors
  label: string
  icon: React.ReactNode
  derive?: (colors: ThemeColors) => Partial<ThemeColors>
}[] = [
  {
    key: 'brandBlack',
    label: 'Fundo principal',
    icon: <Layout size={16} />,
  },
  {
    key: 'surface',
    label: 'Superfície / Cards',
    icon: <PaletteIcon size={16} />,
  },
  {
    key: 'accent',
    label: 'Destaque / Links',
    icon: <Palette size={16} />,
  },
  {
    key: 'button',
    label: 'Botão principal',
    icon: <Palette size={16} />,
  },
]

function deriveColors(colors: ThemeColors): ThemeColors {
  const { brandBlack, surface, accent, button } = colors

  // surfaceHover: superfície mais clara/escura dependendo do brilho
  const surfaceHover = adjustColorBrightness(surface, 15)

  // border: transparente por padrão, mas derivado da superfície
  const border = 'transparent'

  // muted: texto secundário derivado da superfície
  const muted = isLightColor(brandBlack) ? '#6b7280' : '#9ca3af'

  // text: texto principal - contraste com o fundo
  const text = isLightColor(brandBlack) ? '#111827' : '#fafafa'

  // textMuted: texto secundário
  const textMuted = isLightColor(brandBlack) ? '#6b7280' : '#9ca3af'

  return {
    brandBlack,
    surface,
    surfaceHover,
    border,
    muted,
    accent,
    button,
    text,
    textMuted,
  }
}

function adjustColorBrightness(hex: string, amount: number): string {
  // Simple brightness adjustment: shift hex by amount
  let color = hex.replace('#', '')
  if (color.length === 3) {
    color = color.split('').map((c) => c + c).join('')
  }
  const num = parseInt(color, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function isLightColor(hex: string): boolean {
  let color = hex.replace('#', '')
  if (color.length === 3) {
    color = color.split('').map((c) => c + c).join('')
  }
  const num = parseInt(color, 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128
}

export function ThemeColorPicker({ colors, onChange }: ThemeColorPickerProps) {
  const handleChange = (key: keyof ThemeColors, value: string) => {
    const updated = { ...colors, [key]: value }
    onChange(deriveColors(updated))
  }

  const derivedColors = useMemo(() => deriveColors(colors), [colors])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Seletores de cor */}
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-medium text-brand-white">
            Cores principais
          </h3>
          <p className="text-xs text-muted">
            Configure as 4 cores principais. As demais são ajustadas automaticamente.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            {MAIN_COLOR_FIELDS.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-border bg-surface-hover p-3"
              >
                <label className="mb-2 block text-xs font-medium text-brand-white">
                  {field.label}
                </label>
                <div
                  className="relative flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface p-2 transition-colors hover:border-accent group"
                  onClick={() => {}}
                >
                  <div
                    className="h-9 w-9 rounded border border-white/20"
                    style={{ backgroundColor: colors[field.key] }}
                  />
                  <span className="text-[10px] text-muted truncate w-full">
                    {colors[field.key]}
                  </span>
                  <input
                    type="color"
                    value={colors[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview do site */}
        <div className="flex-1 max-w-md">
          <ThemePreview colors={derivedColors} />
        </div>
      </div>
    </div>
  )
}

/**
 * Preview visual de como o site ficará com as cores selecionadas.
 */
function ThemePreview({ colors }: { colors: ThemeColors }) {
  const {
    brandBlack,
    surface,
    surfaceHover,
    accent,
    button,
    text,
    textMuted,
  } = colors

  return (
    <div
      className="rounded-xl border border-border bg-surface p-4 shadow-lg"
      style={{
        backgroundColor: brandBlack,
        color: text,
      }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-white">
          Pré-visualização
        </h3>
        <p className="text-[10px] text-muted">
          Como ficará o cardápio público
        </p>
      </div>

      {/* Header simulado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-full bg-accent"
            style={{ backgroundColor: accent }}
          />
          <span
            className="text-xs font-bold text-brand-white"
            style={{ color: text }}
          >
            Meu Cardápio
          </span>
        </div>
        <button
          className="rounded-lg bg-button px-3 py-1.5 text-[10px] font-medium text-white hover:opacity-90 transition-colors"
          style={{
            backgroundColor: button,
            color: '#ffffff',
          }}
          disabled
        >
          Ver cardápio
        </button>
      </div>

      {/* Card de produto simulado */}
      <div className="rounded-lg border border-border bg-surface-hover p-3 mb-4" style={{ backgroundColor: surfaceHover }}>
        <div className="h-16 w-full rounded bg-surface mb-2" style={{ backgroundColor: surface }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-brand-white truncate" style={{ color: text }}>
              Margherita
            </p>
            <p className="text-[10px] text-muted" style={{ color: textMuted }}>
              Mozzarella, tomate e manjericão
            </p>
          </div>
          <span className="text-xs font-bold text-brand-white" style={{ color: text }}>
            R$ 35,00
          </span>
        </div>
      </div>

      {/* Botão de ação simulado */}
      <button
        className="w-full rounded-lg bg-button px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90 transition-colors"
        style={{ backgroundColor: button, color: '#ffffff' }}
        disabled
      >
        Adicionar ao carrinho
      </button>

      <div className="mt-3 flex items-center justify-between text-[10px]">
        <span className="text-muted">Fundo</span>
        <span className="text-accent font-medium" style={{ color: accent }}>
          {brandBlack}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted">Destaque</span>
        <span className="text-accent font-medium" style={{ color: accent }}>
          {accent}
        </span>
      </div>
    </div>
  )
}
