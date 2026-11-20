import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { storesService } from '@/services'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Button } from '@/components/ui'
import { ExternalLink, Shield, ToggleLeft, ToggleRight, StoreIcon, Package, ShoppingCart, Users, Settings, Trash2, Plus } from 'lucide-react'
import type { Store } from '@/types'

interface StoreRow extends Store {
  productCount?: number
  orderCount?: number
}

function StatusToggle({ store, onToggle }: { store: StoreRow; onToggle: (store: Store) => void }) {
  return (
    <button
      onClick={() => onToggle(store)}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
        store.active
          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
      }`}
      title={store.active ? 'Clique para desativar' : 'Clique para ativar'}
    >
      {store.active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
      {store.active ? 'Ativa' : 'Inativa'}
    </button>
  )
}

function StoreActions({ store, onRemove }: { store: StoreRow; onRemove: (store: Store) => void }) {
  const linkClass = 'flex items-center gap-1.5 rounded-lg border border-border bg-surface-hover px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-brand-white'
  return (
    <>
      <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <ExternalLink size={13} />
        Ver site
      </a>
      <a href={`/${store.slug}/admin`} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <Settings size={13} />
        Dashboard
      </a>
      <Link to={`/master/lojas/${store.id}/editar`} className={linkClass}>
        <Settings size={13} />
        Editar
      </Link>
      <Link to={`/master/lojas/${store.id}/usuarios`} className={linkClass}>
        <Users size={13} />
        Usuários
      </Link>
      <button
        onClick={() => onRemove(store)}
        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
      >
        <Trash2 size={13} />
        Desativar
      </button>
    </>
  )
}

export default function MasterDashboard() {
  const [stores, setStores] = useState<StoreRow[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, products: 0, orders: 0 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const allStores = await storesService.listAll()
      const [productsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
      ])
      const storesWithCounts = allStores.map((s) => ({
        ...s,
        productCount: productsSnap.docs.filter(d => d.data().storeId === s.id).length,
        orderCount: ordersSnap.docs.filter(d => d.data().storeId === s.id).length,
      }))
      setStores(storesWithCounts)

      const activeCount = allStores.filter(s => s.active).length
      const totalProducts = storesWithCounts.reduce((sum, s) => sum + (s.productCount || 0), 0)
      const totalOrders = storesWithCounts.reduce((sum, s) => sum + (s.orderCount || 0), 0)
      setStats({
        total: allStores.length,
        active: activeCount,
        inactive: allStores.length - activeCount,
        products: totalProducts,
        orders: totalOrders,
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const toggleActive = async (store: Store) => {
    await storesService.toggleActive(store.id)
    await loadData()
  }

  const removeStore = async (store: Store) => {
    if (!window.confirm(`Tem certeza que deseja desativar "${store.name}"?`)) return
    await storesService.remove(store.id)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total de lojas', value: stats.total, icon: StoreIcon, color: 'text-blue-400' },
    { label: 'Ativas', value: stats.active, icon: Shield, color: 'text-green-400' },
    { label: 'Inativas', value: stats.inactive, icon: Shield, color: 'text-red-400' },
    { label: 'Produtos', value: stats.products, icon: Package, color: 'text-purple-400' },
    { label: 'Pedidos', value: stats.orders, icon: ShoppingCart, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-brand-white md:text-2xl">Painel Master</h1>
          <p className="text-xs text-muted md:text-sm">Gerencie todas as lanchonetes</p>
        </div>
        <Link to="/cadastro" className="shrink-0">
          <Button size="sm">
            <Plus size={14} />
            Nova loja
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statCards.map((item, index) => (
          <div
            key={item.label}
            className={`rounded-xl border border-border bg-surface p-3 md:p-4 ${index === statCards.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted">{item.label}</p>
              <item.icon size={16} className={`shrink-0 ${item.color}`} />
            </div>
            <p className="mt-1 text-2xl font-bold text-brand-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-brand-white">Todas as lojas</h2>
        </div>

        {stores.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Nenhuma loja cadastrada</p>
        ) : (
          <>
            {/* Mobile: cards empilhados */}
            <div className="divide-y divide-border/50 md:hidden">
              {stores.map((store) => (
                <div key={store.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-white">{store.name}</p>
                      <p className="truncate text-xs text-muted">
                        /{store.slug}{store.whatsapp ? ` · ${store.whatsapp}` : ''}
                      </p>
                    </div>
                    <StatusToggle store={store} onToggle={toggleActive} />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                    <span><strong className="font-bold text-brand-white">{store.productCount || 0}</strong> produtos</span>
                    <span><strong className="font-bold text-brand-white">{store.orderCount || 0}</strong> pedidos</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StoreActions store={store} onRemove={removeStore} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="px-4 py-3 text-left font-medium">Loja</th>
                    <th className="px-4 py-3 text-left font-medium">Slug</th>
                    <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Produtos</th>
                    <th className="px-4 py-3 text-center font-medium">Pedidos</th>
                    <th className="px-4 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-b border-border/50 transition-colors hover:bg-surface-hover/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-white">{store.name}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{store.slug}</td>
                      <td className="px-4 py-3 text-muted">{store.whatsapp || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusToggle store={store} onToggle={toggleActive} />
                      </td>
                      <td className="px-4 py-3 text-center text-muted">{store.productCount || 0}</td>
                      <td className="px-4 py-3 text-center text-muted">{store.orderCount || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <StoreActions store={store} onRemove={removeStore} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
