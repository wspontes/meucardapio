import { useState, useEffect, type ReactNode } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, TrendingDown, Trophy } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RPieChart,
  Pie,
  Cell,
} from 'recharts'
import { ordersService } from '@/services'
import type { Order } from '@/types'
import { formatCurrency, formatTime, formatDate } from '@/utils'
import { getAnalytics, type AnalyticsData } from '@/utils/analytics'
import { getPeriodRange, inPeriod, calcVariation, calcConversion, calcCancellations, groupRevenueByHour, groupRevenueByDay, groupByHour, groupByPayment, groupByType, aggregateProducts, sortTopProducts, productUnitLabel } from '@/utils/dashboardMetrics'

const PAYMENT_COLORS: Record<string, string> = {
  pix: '#3fbf6b',
  cash: '#e8b23d',
  card: '#3b82f6',
  credit: '#8b5cf6',
  debit: '#06b6d4',
  delivery: '#f97316',
}
const PAYMENT_LABELS: Record<string, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  card: 'Cartão',
  credit: 'Crédito',
  debit: 'Débito',
  delivery: 'Na entrega',
}

/** Cores do tema aplicadas aos gráficos (definidas em index.css). */
const CHART = {
  grid: 'var(--color-chart-grid)',
  label: 'var(--color-chart-label)',
  accent: 'var(--color-accent)',
  bar: 'var(--color-chart-bar)',
  cursor: 'var(--color-chart-cursor)',
}

function ChartCard({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-white">{title}</h3>
        {note && <span className="shrink-0 text-[11px] text-muted">{note}</span>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ title, text = 'Sem dados no período' }: { title: string; text?: string }) {
  return (
    <ChartCard title={title}>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border px-3 text-center text-xs text-muted">
        {text}
      </div>
    </ChartCard>
  )
}

const chartTooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-brand-white)',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const axisTick = { fill: CHART.label, fontSize: 10 }

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [topSort, setTopSort] = useState<'qty' | 'revenue'>('qty')
  const [analytics, setAnalytics] = useState<AnalyticsData>({ totalVisits: 0, monthlyVisits: 0, todayVisits: 0, currentMonth: '', currentDay: '' })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [analyticsData] = await Promise.all([getAnalytics()])
        setAnalytics(analyticsData)
      } catch {
        // analytics best-effort
      }
      try {
        const now = new Date()
        const cur = getPeriodRange(dateRange, now, 0)
        const prev = getPeriodRange(dateRange, now, -1)
        let scoped: Order[]
        try {
          // Lê somente os dois períodos (atual + anterior) do Firestore.
          scoped = await ordersService.getByDateRange(prev.start.toISOString(), cur.end.toISOString())
        } catch {
          // Fallback enquanto o índice composto (storeId + createdAt) não é criado.
          const all = await ordersService.getAll()
          scoped = all.filter((o) => {
            const t = new Date(o.createdAt).getTime()
            return t >= prev.start.getTime() && t < cur.end.getTime()
          })
        }
        setOrders(scoped)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange])

  const now = new Date()
  const curRange = getPeriodRange(dateRange, now, 0)
  const prevRange = getPeriodRange(dateRange, now, -1)

  const filteredOrders = orders.filter((o) => inPeriod(o.createdAt, curRange))
  const previousOrders = orders.filter((o) => inPeriod(o.createdAt, prevRange))

  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')
  const prevDelivered = previousOrders.filter((o) => o.status === 'delivered')

  const totalOrders = filteredOrders.filter((o) => o.status !== 'cancelled').length
  const prevTotalOrders = previousOrders.filter((o) => o.status !== 'cancelled').length

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0)
  const prevRevenue = prevDelivered.reduce((sum, o) => sum + o.total, 0)

  const openRevenue = filteredOrders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'delivered')
    .reduce((sum, o) => sum + o.total, 0)

  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const prevAvg = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0

  const revenueVar = calcVariation(totalRevenue, prevRevenue)
  const ordersVar = calcVariation(totalOrders, prevTotalOrders)
  const avgVar = calcVariation(avgOrder, prevAvg)

  const visits =
    dateRange === 'today'
      ? analytics.todayVisits
      : analytics.monthlyVisits
  const conversion = calcConversion(filteredOrders, visits)
  const cancellations = calcCancellations(filteredOrders)

  const stats = [
    {
      label: 'Faturamento',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      sub: `${deliveredOrders.length} pedidos concluídos`,
      sub2: `Em aberto: ${formatCurrency(openRevenue)}`,
      variation: revenueVar,
    },
    {
      label: 'Pedidos',
      value: String(totalOrders),
      icon: ShoppingBag,
      sub: `${filteredOrders.filter((o) => o.status === 'preparing').length} em preparo`,
      variation: ordersVar,
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(avgOrder),
      icon: TrendingUp,
      sub: 'por pedido',
      variation: avgVar,
    },
    {
      label: 'Conversão',
      value: `${conversion.toFixed(1)}%`,
      icon: TrendingUp,
      sub: `${totalOrders} pedidos / ${visits} acessos`,
      variation: null,
    },
    {
      label: 'Cancelamentos',
      value: String(cancellations.count),
      icon: TrendingDown,
      sub: `${cancellations.percent.toFixed(1)}% do total`,
      variation: null,
    },
  ]

  const topProducts = sortTopProducts(aggregateProducts(filteredOrders), topSort, 8)

  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  // Dados dos gráficos
  const revenueByTime =
    dateRange === 'today'
      ? groupRevenueByHour(filteredOrders).map((v, i) => ({ label: `${i}h`, value: v }))
      : groupRevenueByDay(filteredOrders, curRange).map((d) => ({ label: d.label, value: d.revenue }))

  const ordersByHour = groupByHour(filteredOrders)
  const peakHour = ordersByHour.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0)

  const paymentAgg = groupByPayment(filteredOrders)
  const typeAgg = groupByType(filteredOrders)

  const hasRevenueChart = revenueByTime.some((d) => d.value > 0)
  const hasOrdersChart = ordersByHour.some((v) => v > 0)
  const paymentTotal = paymentAgg.reduce((s, p) => s + p.count, 0)
  const typeTotal = typeAgg.delivery + typeAgg.pickup

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-xs text-muted">Carregando dados...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">Dashboard</h1>
          <p className="mt-0.5 text-xs md:text-sm text-muted">
            {dateRange === 'today'
              ? `${analytics.todayVisits} acessos hoje`
              : `${analytics.monthlyVisits} acessos este mês`}
          </p>
        </div>
        <div className="flex w-full gap-1 self-start rounded-lg border border-border bg-surface p-1 sm:w-auto" role="group" aria-label="Período do dashboard">
          {([
            { key: 'today', label: 'Hoje' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mês' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateRange(opt.key)}
              aria-pressed={dateRange === opt.key}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none ${
                dateRange === opt.key ? 'bg-accent text-white' : 'text-muted hover:bg-surface-hover hover:text-brand-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="min-w-0 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent/40 md:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent md:h-10 md:w-10">
                  <Icon size={18} />
                </div>
                {stat.variation && stat.variation.percent !== null && (
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    stat.variation.direction === 'up'
                      ? 'bg-green-400/10 text-green-400'
                      : stat.variation.direction === 'down'
                        ? 'bg-red-400/10 text-red-400'
                        : 'bg-surface-hover text-muted'
                  }`}>
                    {stat.variation.direction === 'up' ? '▲' : stat.variation.direction === 'down' ? '▼' : '—'}
                    {' '}{Math.abs(stat.variation.percent).toFixed(1)}%
                  </span>
                )}
                {stat.variation && stat.variation.percent === null && (
                  <span className="shrink-0 rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] text-muted">—</span>
                )}
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-brand-white md:text-xl xl:text-2xl">{stat.value}</p>
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="text-[11px] text-muted">{stat.sub}</p>
              {stat.sub2 && <p className="text-[11px] text-muted">{stat.sub2}</p>}
            </div>
          )
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {!hasRevenueChart ? (
          <EmptyChart title={dateRange === 'today' ? 'Faturamento por hora' : 'Faturamento por dia'} />
        ) : (
          <ChartCard
            title={dateRange === 'today' ? 'Faturamento por hora' : 'Faturamento por dia'}
            note="pedidos entregues"
          >
            <ResponsiveContainer width="100%" height={220}>
              <RLineChart data={revenueByTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval={dateRange === 'today' ? 2 : 'preserveStartEnd'}
                  minTickGap={18}
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} width={52} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`R$ ${Number(v).toFixed(2).replace('.', ',')}`, 'Faturamento']} />
                <Line type="monotone" dataKey="value" stroke={CHART.accent} strokeWidth={2.5} dot={{ r: 3, fill: CHART.accent }} activeDot={{ r: 5 }} />
              </RLineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {!hasOrdersChart ? (
          <EmptyChart title="Pedidos por horário" />
        ) : (
          <ChartCard title="Pedidos por horário" note={`pico: ${peakHour}h`}>
            <ResponsiveContainer width="100%" height={220}>
              <RBarChart data={ordersByHour.map((v, i) => ({ hora: `${i}h`, pedidos: v }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="hora" tick={axisTick} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: CHART.cursor }} />
                <Bar dataKey="pedidos" radius={[4, 4, 0, 0]} maxBarSize={22}>
                  {ordersByHour.map((_, i) => (
                    <Cell key={i} fill={i === peakHour ? CHART.accent : CHART.bar} />
                  ))}
                </Bar>
              </RBarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {paymentTotal === 0 ? (
          <EmptyChart title="Formas de pagamento" />
        ) : (
          <ChartCard title="Formas de pagamento" note={`${paymentTotal} pedidos`}>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <div className="h-[160px] w-full shrink-0 sm:w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={paymentAgg.map((p) => ({ name: PAYMENT_LABELS[p.method] || p.method, value: p.count }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                      {paymentAgg.map((p, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[p.method] || '#888'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 sm:flex-1">
                {paymentAgg.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[p.method] || '#888' }} />
                      <span className="truncate text-muted">{PAYMENT_LABELS[p.method] || p.method}</span>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-brand-white">{p.count} ({((p.count / paymentTotal) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}

        {typeTotal === 0 ? (
          <EmptyChart title="Tipo de pedido" />
        ) : (
          <ChartCard title="Tipo de pedido" note={`${typeTotal} pedidos`}>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <div className="h-[160px] w-full shrink-0 sm:w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie data={[{ name: 'Entrega', value: typeAgg.delivery }, { name: 'Retirada', value: typeAgg.pickup }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#e8b23d" />
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 sm:flex-1">
                {[
                  { label: 'Entrega', value: typeAgg.delivery, color: '#3b82f6' },
                  { label: 'Retirada', value: typeAgg.pickup, color: '#e8b23d' },
                ].map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="truncate text-muted">{d.label}</span>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-brand-white">{d.value} ({((d.value / typeTotal) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between md:p-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-brand-white md:text-base">Mais Pedidos</h2>
          </div>
          <div className="flex w-full gap-1 rounded-lg border border-border bg-surface-hover p-0.5 sm:w-auto" role="group" aria-label="Ordenar mais pedidos">
            <button
              onClick={() => setTopSort('qty')}
              aria-pressed={topSort === 'qty'}
              className={`flex-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:flex-none md:text-xs ${topSort === 'qty' ? 'bg-accent text-white' : 'text-muted hover:bg-surface hover:text-brand-white'}`}
            >
              Por quantidade
            </button>
            <button
              onClick={() => setTopSort('revenue')}
              aria-pressed={topSort === 'revenue'}
              className={`flex-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors sm:flex-none md:text-xs ${topSort === 'revenue' ? 'bg-accent text-white' : 'text-muted hover:bg-surface hover:text-brand-white'}`}
            >
              Por faturamento
            </button>
          </div>
        </div>
        {topProducts.length === 0 ? (
          <div className="p-8 text-center text-xs md:text-sm text-muted">Nenhum pedido neste período</div>
        ) : (
          <div className="divide-y divide-border">
            {topProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 md:p-4 hover:bg-surface-hover transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  i === 0 ? 'bg-yellow-500/15 text-yellow-400' : i === 1 ? 'bg-gray-300/10 text-gray-300' : i === 2 ? 'bg-orange-500/10 text-orange-400' : 'bg-surface-hover text-muted'
                }`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-white truncate">{item.name}</p>
                  <p className="text-xs text-muted">{item.qty} {productUnitLabel(item.qty)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-brand-white">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-3 md:p-4">
          <h2 className="text-sm md:text-base font-semibold text-brand-white">Pedidos Recentes</h2>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs md:text-sm text-muted">Nenhum pedido neste período</div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-surface-hover transition-colors">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-brand-white truncate">{order.customerName}</p>
                  <p className="text-xs text-muted">
                    {formatDate(new Date(order.createdAt))} • {formatTime(new Date(order.createdAt))}
                    {' • '}{order.items.reduce((s, i) => s + i.quantity, 0)} itens
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-brand-white">{formatCurrency(order.total)}</p>
                  <p className={`text-xs font-medium ${order.status === 'delivered' ? 'text-green-400' : order.status === 'cancelled' ? 'text-red-400' : order.status === 'preparing' ? 'text-orange-400' : order.status === 'outForDelivery' ? 'text-purple-400' : 'text-blue-400'}`}>
                    {order.status === 'delivered' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : order.status === 'preparing' ? 'Preparando' : order.status === 'received' ? 'Recebido' : order.status === 'outForDelivery' ? (order.deliveryType === 'pickup' ? 'Pronto' : 'Saiu') : order.status === 'accepted' ? 'Aceito' : order.status === 'waitingPayment' ? 'Aguard. Pagto' : order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
