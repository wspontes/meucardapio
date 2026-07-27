import type { BusinessHours } from '@/types'

export interface BusinessStatus {
  isOpen: boolean
  message: string
  nextOpenDay: string
  nextOpenTime: string
}

const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isBusinessOpen(businessHours: BusinessHours[]): BusinessStatus {
  const now = new Date()
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const today = businessHours.find((h) => h.dayOfWeek === currentDay)

  if (!today || today.closed) {
    const nextDay = findNextOpenDay(businessHours, currentDay)
    return {
      isOpen: false,
      message: `Estamos fechados hoje. ${nextDay.message}`,
      nextOpenDay: nextDay.dayName,
      nextOpenTime: nextDay.time,
    }
  }

  const openMin = timeToMinutes(today.open)
  const closeMin = timeToMinutes(today.close)

  if (closeMin === 0) {
    if (currentMinutes >= openMin) {
      return { isOpen: true, message: 'Estamos abertos!', nextOpenDay: '', nextOpenTime: '' }
    }
  } else if (closeMin > openMin) {
    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      return { isOpen: true, message: 'Estamos abertos!', nextOpenDay: '', nextOpenTime: '' }
    }
  } else {
    if (currentMinutes >= openMin || currentMinutes < closeMin) {
      return { isOpen: true, message: 'Estamos abertos!', nextOpenDay: '', nextOpenTime: '' }
    }
  }

  if (currentMinutes < openMin) {
    return {
      isOpen: false,
      message: `Ainda não abrimos. Abriremos às ${today.open}`,
      nextOpenDay: dayNamesShort[currentDay],
      nextOpenTime: today.open,
    }
  }

  const nextDay = findNextOpenDay(businessHours, currentDay)
  return {
    isOpen: false,
    message: `Já fechamos hoje. ${nextDay.message}`,
    nextOpenDay: nextDay.dayName,
    nextOpenTime: nextDay.time,
  }
}

function findNextOpenDay(businessHours: BusinessHours[], fromDay: number): { message: string; dayName: string; time: string } {
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (fromDay + i) % 7
    const day = businessHours.find((h) => h.dayOfWeek === dayIndex)
    if (day && !day.closed) {
      const dayLabel = i === 1 ? 'Amanhã' : dayNamesShort[dayIndex]
      return {
        message: `Abriremos ${dayLabel} às ${day.open}`,
        dayName: dayNamesShort[dayIndex],
        time: day.open,
      }
    }
  }
  return { message: 'Horário não configurado', dayName: '', time: '' }
}

export function getTodayHours(businessHours: BusinessHours[]): { open: string; close: string; closed: boolean } | null {
  const today = new Date().getDay()
  const hours = businessHours.find((h) => h.dayOfWeek === today)
  return hours || null
}
