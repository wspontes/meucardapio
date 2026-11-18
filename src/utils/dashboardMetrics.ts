export type Period = 'today' | 'week' | 'month'

export interface PeriodRange {
  start: Date
  end: Date
}

export interface Variation {
  percent: number | null // null when previous is 0
  direction: 'up' | 'down' | 'flat'
}

/** Converte `now` para o horário de parede de America/Sao_Paulo. */
function toSaoPaulo(now: Date): Date {
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

/** Início do dia (00:00) em SP, em UTC. */
function spMidnightUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 3, 0, 0))
}

/**
 * Retorna o intervalo [start, end) em UTC correspondente ao período
 * solicitado, no fuso America/Sao_Paulo. `shift` desloca o período
 * (-1 = período anterior equivalente).
 */
export function getPeriodRange(period: Period, now: Date, shift = 0): PeriodRange {
  const sp = toSaoPaulo(now)
  const y = sp.getFullYear()
  const m = sp.getMonth()
  const d = sp.getDate()
  const dow = sp.getDay() // 0 = domingo

  if (period === 'today') {
    const start = spMidnightUTC(y, m, d + shift)
    const end = spMidnightUTC(y, m, d + shift + 1)
    return { start, end }
  }

  if (period === 'week') {
    // semana começa no domingo
    const baseDay = d - dow
    const start = spMidnightUTC(y, m, baseDay + shift * 7)
    const end = spMidnightUTC(y, m, baseDay + shift * 7 + 7)
    return { start, end }
  }

  // month
  const start = new Date(Date.UTC(y, m + shift, 1, 3, 0, 0))
  const end = new Date(Date.UTC(y, m + shift + 1, 1, 3, 0, 0))
  return { start, end }
}

export function getPreviousPeriodRange(period: Period, now: Date): PeriodRange {
  return getPeriodRange(period, now, -1)
}

export function inPeriod(iso: string, range: PeriodRange): boolean {
  const t = new Date(iso).getTime()
  return t >= range.start.getTime() && t < range.end.getTime()
}

export function calcRevenue(orders: { total: number; status: string }[]): number {
  return orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0)
}

export function calcOpenRevenue(orders: { total: number; status: string }[]): number {
  return orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'delivered')
    .reduce((s, o) => s + (o.total || 0), 0)
}

export function calcOrderCount(orders: { status: string }[]): number {
  return orders.filter((o) => o.status !== 'cancelled').length
}

export function calcAvgOrder(revenue: number, count: number): number {
  return count > 0 ? revenue / count : 0
}

export function calcVariation(current: number, previous: number): Variation {
  if (previous === 0) {
    return { percent: null, direction: current > 0 ? 'up' : 'flat' }
  }
  const pct = ((current - previous) / previous) * 100
  return {
    percent: pct,
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
  }
}

export function calcConversion(orders: { status: string }[], visits: number): number {
  if (!visits || visits <= 0) return 0
  const completed = orders.filter((o) => o.status !== 'cancelled').length
  return (completed / visits) * 100
}

export function calcCancellations(orders: { status: string }[]): { count: number; percent: number } {
  const total = orders.length
  const count = orders.filter((o) => o.status === 'cancelled').length
  const percent = total > 0 ? (count / total) * 100 : 0
  return { count, percent }
}

export interface ProductAgg {
  name: string
  qty: number
  revenue: number
}

export function aggregateProducts(orders: { status: string; items: { productId: string; productName: string; quantity: number; price: number }[] }[]): ProductAgg[] {
  const map: Record<string, ProductAgg> = {}
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    for (const item of order.items || []) {
      const key = item.productId || item.productName
      if (!map[key]) map[key] = { name: item.productName, qty: 0, revenue: 0 }
      map[key].qty += item.quantity || 0
      map[key].revenue += (item.price || 0) * (item.quantity || 0)
    }
  }
  return Object.values(map)
}

export type TopSort = 'qty' | 'revenue'

export function sortTopProducts(list: ProductAgg[], sort: TopSort, limit = 8): ProductAgg[] {
  const sorted = [...list].sort((a, b) => {
    if (sort === 'qty') {
      if (b.qty !== a.qty) return b.qty - a.qty
      return b.revenue - a.revenue
    }
    if (b.revenue !== a.revenue) return b.revenue - a.revenue
    return b.qty - a.qty
  })
  return sorted.slice(0, limit)
}

export function productUnitLabel(qty: number): string {
  return qty === 1 ? 'un. vendida' : 'un. vendidas'
}

export function groupByHour(orders: { status: string; createdAt: string }[]): number[] {
  const buckets = new Array(24).fill(0)
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    const d = new Date(o.createdAt)
    const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const h = sp.getHours()
    buckets[h] += 1
  }
  return buckets
}

export function groupRevenueByHour(orders: { status: string; total: number; createdAt: string }[]): number[] {
  const buckets = new Array(24).fill(0)
  for (const o of orders) {
    if (o.status !== 'delivered') continue
    const d = new Date(o.createdAt)
    const sp = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const h = sp.getHours()
    buckets[h] += o.total || 0
  }
  return buckets
}

export interface DayRevenue {
  label: string
  revenue: number
}

export function groupRevenueByDay(orders: { status: string; total: number; createdAt: string }[], range: PeriodRange): DayRevenue[] {
  const spRangeStart = new Date(range.start.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  spRangeStart.setHours(0, 0, 0, 0)
  const spRangeEnd = new Date(range.end.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  spRangeEnd.setHours(0, 0, 0, 0)
  const msDay = 24 * 60 * 60 * 1000
  const result: DayRevenue[] = []
  let cur = spRangeStart.getTime()
  while (cur < spRangeEnd.getTime()) {
    const d0 = new Date(cur)
    const label = `${String(d0.getDate()).padStart(2, '0')}/${String(d0.getMonth() + 1).padStart(2, '0')}`
    let rev = 0
    for (const o of orders) {
      if (o.status !== 'delivered') continue
      const spD = new Date(new Date(o.createdAt).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      spD.setHours(0, 0, 0, 0)
      if (spD.getTime() === cur) rev += o.total || 0
    }
    result.push({ label, revenue: rev })
    cur += msDay
  }
  return result
}

export interface PaymentAgg {
  method: string
  count: number
  percent: number
}

export function groupByPayment(orders: { status: string; paymentMethod: string }[]): PaymentAgg[] {
  const counts: Record<string, number> = {}
  let total = 0
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    counts[o.paymentMethod] = (counts[o.paymentMethod] || 0) + 1
    total++
  }
  return Object.entries(counts).map(([method, count]) => ({
    method,
    count,
    percent: total > 0 ? (count / total) * 100 : 0,
  }))
}

export interface TypeAgg {
  delivery: number
  pickup: number
}

export function groupByType(orders: { status: string; deliveryType?: string }[]): TypeAgg {
  const agg = { delivery: 0, pickup: 0 }
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    if (o.deliveryType === 'pickup') agg.pickup++
    else agg.delivery++
  }
  return agg
}

export function recentOrders<T extends { createdAt: string }>(orders: T[], n = 8): T[] {
  return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, n)
}
