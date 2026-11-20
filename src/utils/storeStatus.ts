export interface StoreStatus {
  isOpen: boolean
  label: string
  nextChange: Date | null
}

export interface BusinessHoursLike {
  dayOfWeek: number
  open: string
  close: string
  closed: boolean
}

const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  if (!m) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Converte `now` para o horário de parede de America/Sao_Paulo.
 * Retorna um Date cujos getDay/getHours/getMinutes correspondem ao fuso de SP.
 */
function toSaoPaulo(now: Date): Date {
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

/**
 * Calcula o status do estabelecimento com base nos horários configurados.
 * Usa o fuso America/Sao_Paulo (não o fuso do navegador do cliente).
 */
export function getStoreStatus(hours: BusinessHoursLike[], now: Date): StoreStatus {
  if (!hours || hours.length === 0) {
    return { isOpen: false, label: '', nextChange: null }
  }

  const sp = toSaoPaulo(now)
  const dayOfWeek = sp.getDay()
  const minutes = sp.getHours() * 60 + sp.getMinutes()

  const today = hours.find((h) => h.dayOfWeek === dayOfWeek)

  // Verifica se estamos dentro de um turno overnight do dia anterior.
  let overnightPrev: BusinessHoursLike | null = null
  const prevDay = (dayOfWeek + 6) % 7
  const prev = hours.find((h) => h.dayOfWeek === prevDay)
  if (prev && !prev.closed) {
    const po = timeToMinutes(prev.open)
    const pc = timeToMinutes(prev.close)
    // overnight: fechamento menor que abertura (e diferente de 0, que é meia-noite)
    if (pc > 0 && pc < po) {
      if (minutes < pc) {
        overnightPrev = prev
      }
    }
  }

  let isOpen = false
  let closeTimeStr = ''

  if (overnightPrev) {
    isOpen = true
    closeTimeStr = overnightPrev.close
  } else if (today && !today.closed) {
    const openMin = timeToMinutes(today.open)
    const closeMin = timeToMinutes(today.close)
    // 00:00 = meia-noite do fim do dia
    const effClose = closeMin === 0 ? 1440 : closeMin

    if (closeMin === 0) {
      if (minutes >= openMin) isOpen = true
    } else if (closeMin > openMin) {
      if (minutes >= openMin && minutes < closeMin) isOpen = true
    } else {
      // overnight no mesmo registro (close < open)
      if (minutes >= openMin || minutes < closeMin) isOpen = true
    }
    if (isOpen) closeTimeStr = today.close
  }

  if (isOpen) {
    const label = `Aberto agora · fecha às ${formatTime(closeTimeStr)}`
    return { isOpen: true, label, nextChange: null }
  }

  // Fechado: determinar próxima abertura.
  // 1) Hoje ainda vai abrir (mesmo dia, turno não overnight já passou? ou ainda não abriu)
  if (today && !today.closed) {
    const openMin = timeToMinutes(today.open)
    const closeMin = timeToMinutes(today.close)
    // se estamos na janela "gap" do overnight (entre close e open do mesmo dia), abre hoje
    if (closeMin > 0 && closeMin < openMin && minutes >= closeMin && minutes < openMin) {
      return {
        isOpen: false,
        label: `Fechado agora · abre hoje às ${formatTime(today.open)}`,
        nextChange: null,
      }
    }
    if (minutes < openMin) {
      return {
        isOpen: false,
        label: `Fechado agora · abre hoje às ${formatTime(today.open)}`,
        nextChange: null,
      }
    }
  }

  // 2) Próximo dia de abertura
  for (let i = 1; i <= 7; i++) {
    const idx = (dayOfWeek + i) % 7
    const day = hours.find((h) => h.dayOfWeek === idx)
    if (day && !day.closed) {
      const timeStr = formatTime(day.open)
      if (i === 1) {
        return { isOpen: false, label: `Fechado agora · abre amanhã às ${timeStr}`, nextChange: null }
      }
      return { isOpen: false, label: `Fechado agora · abre ${DAY_NAMES[idx]} às ${timeStr}`, nextChange: null }
    }
  }

  return { isOpen: false, label: 'Fechado agora', nextChange: null }
}
