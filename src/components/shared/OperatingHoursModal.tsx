import { X, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'
import { useSettings } from '@/hooks'

interface OperatingHoursModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function OperatingHoursModal({ isOpen, onClose, message }: OperatingHoursModalProps) {
  const { settings } = useSettings()

  if (!isOpen) return null

  const hours = settings?.businessHours || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Pizzaria Fechada</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:text-white hover:bg-surface-hover transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-muted mb-5">{message}</p>

        <div className="rounded-xl bg-surface-hover p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-accent" />
            <span className="text-xs font-medium text-white uppercase tracking-wider">Horários da Semana</span>
          </div>
          <div className="space-y-1.5">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted">{dayLabels[h.dayOfWeek]}</span>
                {h.closed ? (
                  <span className="text-red-400 font-medium">Fechado</span>
                ) : (
                  <span className="text-white">{h.open} às {h.close}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Entendi
        </Button>
      </div>
    </div>
  )
}
