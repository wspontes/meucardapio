import { UtensilsCrossed, Phone, MapPin } from 'lucide-react'
import { useSettings } from '@/hooks'
import { useStore } from '@/contexts/StoreContext'
import { resolveImageUrl } from '@/utils/resolveImageUrl'

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatHourRange(hours: { dayOfWeek: number; open: string; close: string; closed: boolean }[]) {
  if (!hours || hours.length === 0) return ['Horário não disponível']

  const sorted = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)

  // Agrupa dias consecutivos com o mesmo horário (aberto ou fechado).
  const groups: { dayOfWeek: number; open: string; close: string; closed: boolean }[][] = []
  let current = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1]
    const curr = sorted[i]
    const sameHours = prev.closed === curr.closed && prev.open === curr.open && prev.close === curr.close
    const consecutive = curr.dayOfWeek === prev.dayOfWeek + 1
    if (sameHours && consecutive) {
      current.push(curr)
    } else {
      groups.push(current)
      current = [curr]
    }
  }
  groups.push(current)

  // Caso especial: todos os 7 dias com o mesmo horário.
  if (groups.length === 1 && sorted.length === 7) {
    const g = groups[0]
    const range = 'Todos os dias'
    if (g[0].closed) return [`${range}: fechado`]
    return [`${range}: ${g[0].open.slice(0, 5)} às ${g[0].close.slice(0, 5)}`]
  }

  return groups.map((g) => {
    const first = g[0]
    const last = g[g.length - 1]
    const range = first.dayOfWeek === last.dayOfWeek
      ? dayLabels[first.dayOfWeek]
      : `${dayLabels[first.dayOfWeek]}–${dayLabels[last.dayOfWeek]}`
    if (first.closed) return `${range}: fechado`
    return `${range}: ${first.open.slice(0, 5)} às ${last.close.slice(0, 5)}`
  })
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function Footer() {
  const { settings, loading } = useSettings()
  const { store } = useStore()

  const hours = settings?.businessHours
  const phone = settings?.phone
  const instagram = settings?.instagram
  const whatsapp = settings?.whatsapp
  const address = settings?.address
  const logoUrl = settings?.theme?.logo || store?.logo

  const hourLines = hours ? formatHourRange(hours) : []

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-brand-white">
              {logoUrl ? (
                <img
                  src={resolveImageUrl(logoUrl)}
                  alt={store?.name || 'MeuCardápio'}
                  className="h-6 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <UtensilsCrossed className="text-accent" size={20} />
              )}
              {store?.name || 'MeuCardápio'}
            </div>
            <p className="mt-2 text-sm text-muted">
              Cardápio digital do {store?.name || 'nosso estabelecimento'}.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-white">Horários</h4>
            <div className="space-y-1 text-sm text-muted">
              {loading ? (
                <p>Carregando...</p>
              ) : hourLines.length > 0 ? (
                hourLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <p>Horários não disponíveis</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-brand-white">Contato</h4>
            <div className="space-y-1 text-sm text-muted">
              {address && <p className="flex items-center gap-2"><MapPin size={14} /> {address}</p>}
              {phone && <p className="flex items-center gap-2"><Phone size={14} /> {phone}</p>}
              {whatsapp && <p>WhatsApp: {whatsapp.replace(/^55/, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</p>}
              {instagram && (
                <a
                  href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-accent hover:text-red-400 transition-colors"
                >
                  <InstagramIcon size={14} /> Instagram
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} {store?.name || 'MeuCardápio'}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
