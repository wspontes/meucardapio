import { useState, useEffect } from 'react'
import { ShoppingBag, DollarSign, TrendingUp, TrendingDown, Trophy } from 'lucide-react'
import { ordersService } from '@/services'
import type { Order } from '@/types'
import { formatCurrency, formatTime, formatDate } from '@/utils'
import { getAnalytics, type AnalyticsData } from '@/utils/analytics'

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [topRange, setTopRange] = useState<'today' | 'week' | 'month'>('today')
  const [analytics, setAnalytics] = useState<AnalyticsData>({ totalVisits: 0, monthlyVisits: 0, todayVisits: 0, currentMonth: '', currentDay: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const [data, analyticsData] = await Promise.all([
          ordersService.getAll(),
          getAnalytics(),
        ])
        setOrders(data)
        setAnalytics(analyticsData)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const filterStart = dateRange === 'today' ? startOfDay : dateRange === 'week' ? startOfWeek : startOfMonth
  const topFilterStart = topRange === 'today' ? startOfDay : topRange === 'week' ? startOfWeek : startOfMonth

  const filteredOrders = orders.filter((o) => o.createdAt >= filterStart && o.status !== 'cancelled')
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')

  const totalOrders = filteredOrders.length
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0)
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const stats = [
    {
      label: 'Faturamento',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      sub: `${deliveredOrders.length} pedidos concluídos`,
    },
    {
      label: 'Pedidos',
      value: String(totalOrders),
      icon: ShoppingBag,
      sub: `${filteredOrders.filter((o) => o.status === 'preparing').length} em preparo`,
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(avgOrder),
      icon: TrendingUp,
      sub: 'por pedido',
    },
  ]

  const topOrders = orders.filter((o) => o.createdAt >= topFilterStart && o.status !== 'cancelled')
  const productCount: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const order of topOrders) {
    for (const item of order.items) {
      const key = item.productId
      if (!productCount[key]) productCount[key] = { name: item.productName, qty: 0, revenue: 0 }
      productCount[key].qty += item.quantity
      productCount[key].revenue += item.price * item.quantity
    }
  }
  const topProducts = Object.values(productCount)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)

  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">Dashboard</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{analytics.todayVisits} acessos hoje, {analytics.monthlyVisits} acessos este mês</p>
        </div>
        <div className="flex gap-1 self-start rounded-lg border border-border bg-surface p-1">
          {([
            { key: 'today', label: 'Hoje' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mês' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateRange(opt.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === opt.key ? 'bg-accent text-white' : 'text-muted hover:text-brand-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-3 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-2 text-xl md:text-2xl font-bold text-brand-white">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted">{stat.label}</p>
              <p className="text-[10px] md:text-xs text-muted/60">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-3 md:p-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <h2 className="text-sm md:text-base font-semibold text-brand-white">Mais Pedidos</h2>
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-hover p-0.5">
            {([
              { key: 'today', label: 'Hoje' },
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mês' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTopRange(opt.key)}
                className={`rounded-md px-2.5 py-1 text-[10px] md:text-xs font-medium transition-colors ${
                  topRange === opt.key ? 'bg-accent text-white' : 'text-muted hover:text-brand-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
                  <p className="text-xs text-muted">{item.qty} un. vendidas</p>
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
                  <p className="text-xs text-muted capitalize">{order.status === 'delivered' ? 'Entregue' : order.status === 'preparing' ? 'Preparando' : order.status === 'received' ? 'Recebido' : order.status === 'outForDelivery' ? (order.deliveryType === 'pickup' ? 'Pronto' : 'Saiu') : order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
