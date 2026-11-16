import { useState } from 'react'
import { Palette, Eye, EyeOff } from 'lucide-react'
import type { ThemeColors } from '@/config/themes'

interface ThemeColorPickerProps {
  colors: ThemeColors
  onChange: (colors: ThemeColors) => void
}

const colorFields: { key: keyof ThemeColors; label: string; icon: React.ReactNode }[] = [
  { key: 'brandBlack', label: 'Preço da marca', icon: <Palette size={16} /> },
  { key: 'surface', label: 'Superfície', icon: <Eye size={16} /> },
  { key: 'surfaceHover', label: 'Superfície (hover)', icon: <Eye size={16} /> },
  { key: 'border', label: 'Borda', icon: <Eye size={16} /> },
  { key: 'muted', label: 'Texto secundário', icon: <EyeOff size={16} /> },
  { key: 'accent', label: 'Destaque', icon: <Palette size={16} /> },
  { key: 'button', label: 'Botão', icon: <Palette size={16} /> },
  { key: 'text', label: 'Texto principal', icon: <Eye size={16} /> },
  { key: 'textMuted', label: 'Texto secundário', icon: <EyeOff size={16} /> },
]

export function ThemeColorPicker({ colors, onChange }: ThemeColorPickerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const handleChange = (key: keyof ThemeColors, value: string) => {
    onChange({ ...colors, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-brand-white">Cores personalizadas</h3>
        <ButtonColorPreview colors={colors} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {colorFields.map((field) => {
          const isExpanded = expanded[field.key] ?? false
          return (
            <div
              key={field.key}
              className="rounded-xl border border-border bg-surface-hover p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-brand-white">{field.label}</label>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [field.key]: !isExpanded }))
                  }
                  className="rounded p-1 text-muted hover:text-brand-white transition-colors"
                >
                  {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div
                className={`relative flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-surface p-2 transition-colors hover:border-accent`}
                onClick={() => setExpanded((prev) => ({ ...prev, [field.key]: true }))}
              >
                <div
                  className="h-8 w-8 rounded border border-white/20"
                  style={{ backgroundColor: colors[field.key] }}
                />
                <span className="text-[10px] text-muted truncate">{colors[field.key]}</span>
                <input
                  type="color"
                  value={colors[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {isExpanded && (
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[10px] text-muted">Hex</label>
                  <input
                    type="text"
                    value={colors[field.key]}
                    onChange={(e) =>
                      handleChange(field.key, e.target.value.toUpperCase())
                    }
                    className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-[10px] text-brand-white focus:border-accent focus:outline-none"
                    maxLength={7}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ButtonColorPreview({ colors }: { colors: ThemeColors }) {
  return (
    <button
      type="button"
      disabled
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left"
    >
      <div className="flex flex-col">
        <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: colors.accent }} />
        <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: colors.button }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-brand-white truncate">Pré-visualização</p>
        <p className="text-[10px] text-muted truncate">{colors.accent} • {colors.button}</p>
      </div>
    </button>
  )
}
