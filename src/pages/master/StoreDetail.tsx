import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, orderBy as firestoreOrderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { storesService } from '@/services'
import { ArrowLeft, Package, ShoppingCart, DollarSign, ExternalLink, Users, Settings, TrendingUp, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react'
import type { Store, Order } from '@/types'

interface StoreStats {
  productsCount: number
  ordersCount: number
  revenue: number
  todayOrders: number
  todayRevenue: number
  averageTicket: number
  statusDistribution: Record<string, number>
  paymentMethods: Record<string, number>
  recentOrders: Order[]
}

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const s = await storesService.getById(id!)
      if (cancelled) return
      setStore(s)

      if (s) {
        const [productsSnap, ordersSnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), where('storeId', '==', s.id))),
          getDocs(query(collection(db, 'orders'), where('storeId', '==', s.id), firestoreOrderBy('createdAt', 'desc'))),
        ])

        const productsCount = productsSnap.size
        const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
        const ordersCount = orders.length
        const delivered = orders.filter((o) => o.status === 'delivered')
        const revenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0)
        const averageTicket = delivered.length > 0 ? Math.round(revenue / delivered.length) : 0

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString()
        const todayOrdersList = orders.filter((o) => o.createdAt >= todayStr)
        const todayOrders = todayOrdersList.length
        const todayRevenue = todayOrdersList
          .filter((o) => o.status === 'delivered')
          .reduce((sum, o) => sum + (o.total || 0), 0)

        const statusDistribution: Record<string, number> = {}
        const paymentMethods: Record<string, number> = {}
        orders.forEach((o) => {
          statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1
          if (o.paymentMethod) {
            paymentMethods[o.paymentMethod] = (paymentMethods[o.paymentMethod] || 0) + 1
          }
        })

        if (!cancelled) {
          setStats({
            productsCount,
            ordersCount,
            revenue,
            todayOrders,
            todayRevenue,
            averageTicket,
            statusDistribution,
            paymentMethods,
            recentOrders: orders.slice(0, 10),
          })
        }
      }

      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-brand-white mb-2">Loja não encontrada</h1>
        <Link to="/master" className="text-sm text-accent hover:underline">Voltar ao painel master</Link>
      </div>
    )
  }

  const paymentIcons: Record<string, typeof DollarSign> = {
    pix: Smartphone,
    card: CreditCard,
    credit: CreditCard,
    debit: CreditCard,
    cash: Banknote,
    delivery: Receipt,
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/master" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-brand-white">{store.name}</h1>
          <p className="text-sm text-muted">/{store.slug}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${store.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {store.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <Package size={16} />
            Produtos
          </div>
          <p className="text-2xl font-bold text-brand-white">{stats?.productsCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <ShoppingCart size={16} />
            Total de pedidos
          </div>
          <p className="text-2xl font-bold text-brand-white">{stats?.ordersCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <DollarSign size={16} />
            Faturamento total
          </div>
          <p className="text-2xl font-bold text-green-400">R$ {stats ? stats.revenue.toFixed(2) : '0,00'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <TrendingUp size={16} />
            Ticket médio
          </div>
          <p className="text-2xl font-bold text-brand-white">R$ {stats ? stats.averageTicket.toFixed(2) : '0,00'}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <ShoppingCart size={16} />
            Pedidos hoje
          </div>
          <p className="text-2xl font-bold text-brand-white">{stats?.todayOrders ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <DollarSign size={16} />
            Faturamento hoje
          </div>
          <p className="text-2xl font-bold text-green-400">R$ {stats ? stats.todayRevenue.toFixed(2) : '0,00'}</p>
        </div>
      </div>

      {stats && Object.keys(stats.statusDistribution).length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-brand-white">Status dos pedidos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-border bg-surface p-3 text-center">
                <p className="text-lg font-bold text-brand-white">{count}</p>
                <p className="text-xs text-muted capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && Object.keys(stats.paymentMethods).length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-brand-white">Formas de pagamento</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(stats.paymentMethods).map(([method, count]) => {
              const Icon = paymentIcons[method] || DollarSign
              return (
                <div key={method} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <Icon size={18} className="text-muted" />
                  <div>
                    <p className="text-lg font-bold text-brand-white">{count}</p>
                    <p className="text-xs text-muted capitalize">{method}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Link to={`/master/lojas/${store.id}/editar`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover transition-colors">
          <Settings size={18} className="text-muted" />
          <span className="text-sm font-medium text-brand-white">Editar loja</span>
        </Link>
        <Link to={`/master/lojas/${store.id}/usuarios`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover transition-colors">
          <Users size={18} className="text-muted" />
          <span className="text-sm font-medium text-brand-white">Gerenciar usuários</span>
        </Link>
        <a href={`/${store.slug}/admin`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover transition-colors">
          <ExternalLink size={18} className="text-muted" />
          <span className="text-sm font-medium text-brand-white">Acessar admin</span>
        </a>
      </div>

      {stats && stats.recentOrders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-white">Últimos pedidos</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="px-4 py-3 text-left font-medium text-muted">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Pagamento</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="px-4 py-3 text-brand-white">{o.customerName}</td>
                    <td className="px-4 py-3 text-brand-white">R$ {(o.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted capitalize">{o.paymentMethod || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats && stats.recentOrders.length === 0 && (
        <div className="rounded-xl border border-border p-8 text-center">
          <ShoppingCart size={32} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">Nenhum pedido encontrado</p>
        </div>
      )}
    </div>
  )
}