import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Star, MessageSquare, TrendingUp, Package } from 'lucide-react'
import { useStoreGuard } from '@/components/shared/StoreGuard'
import type { Order } from '@/types'
import { formatCurrency, formatTime } from '@/utils'

export default function RatingsAdmin() {
  const { slug } = useParams<{ slug: string }>()
  const { store } = useStoreGuard()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStars, setFilterStars] = useState<number | null>(null)

  useEffect(() => {
    const storeId = store?.id
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      const scoped = storeId ? data.filter((o) => o.storeId === storeId) : data
      setOrders(scoped)
      setLoading(false)
    })
    return () => unsub()
  }, [store?.id])

  const ratedOrders = orders.filter((o) => o.rating)
  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const filtered = filterStars
    ? ratedOrders.filter((o) => o.rating?.stars === filterStars)
    : ratedOrders

  const avgStars = ratedOrders.length > 0
    ? ratedOrders.reduce((sum, o) => sum + (o.rating?.stars || 0), 0) / ratedOrders.length
    : 0

  const satisfiedCount = ratedOrders.filter((o) => (o.rating?.stars || 0) >= 4).length
  const satisfactionRate = ratedOrders.length > 0
    ? Math.round((satisfiedCount / ratedOrders.length) * 100)
    : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratedOrders.filter((o) => o.rating?.stars === star).length,
  }))

  const maxDist = Math.max(...distribution.map((d) => d.count), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-brand-white">Avaliações</h1>
        <p className="text-xs md:text-sm text-muted mt-0.5">
          {ratedOrders.length} avaliados de {deliveredOrders.length} entregues
        </p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-yellow-400" />
            <span className="text-xs text-muted">Média geral</span>
          </div>
          <p className="text-2xl font-bold text-brand-white">{avgStars.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className={s <= Math.round(avgStars) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-accent" />
            <span className="text-xs text-muted">Total de avaliações</span>
          </div>
          <p className="text-2xl font-bold text-brand-white">{ratedOrders.length}</p>
          <p className="text-xs text-muted mt-1">de {deliveredOrders.length} entregues</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-xs text-muted">Satisfação</span>
          </div>
          <p className="text-2xl font-bold text-brand-white">{satisfactionRate}%</p>
          <p className="text-xs text-muted mt-1">4-5 estrelas</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-muted" />
            <span className="text-xs text-muted">Taxa de avaliação</span>
          </div>
          <p className="text-2xl font-bold text-brand-white">
            {deliveredOrders.length > 0
              ? Math.round((ratedOrders.length / deliveredOrders.length) * 100)
              : 0}%
          </p>
          <p className="text-xs text-muted mt-1">pedidos avaliados</p>
        </div>
      </div>

      {/* Distribuição */}
      {ratedOrders.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 md:p-6 mb-6">
          <h2 className="mb-4 text-sm font-semibold text-brand-white">Distribuição por estrelas</h2>
          <div className="space-y-2">
            {distribution.map(({ star, count }) => (
              <button
                key={star}
                onClick={() => setFilterStars(filterStars === star ? null : star)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  filterStars === star ? 'bg-accent/10' : 'hover:bg-surface-hover'
                }`}
              >
                <span className="flex items-center gap-1 text-sm text-brand-white w-12">
                  {star} <Star size={12} className="fill-yellow-400 text-yellow-400" />
                </span>
                <div className="flex-1 h-3 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${(count / maxDist) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted w-8 text-right">{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtro ativo */}
      {filterStars && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted">Filtrando por {filterStars} estrelas</span>
          <button
            onClick={() => setFilterStars(null)}
            className="text-xs text-accent hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Lista de avaliações */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <Star size={48} className="mx-auto mb-4 text-muted" />
          <p className="text-muted">
            {ratedOrders.length === 0
              ? 'Nenhuma avaliação recebida ainda.'
              : 'Nenhuma avaliação com este filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-brand-white">{order.customerName}</p>
                  <p className="text-xs text-muted">#{order.id.slice(0, 8)} · {formatTime(new Date(order.createdAt))}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= (order.rating?.stars || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
                    />
                  ))}
                </div>
              </div>
              {order.rating?.comment && (
                <p className="text-sm text-muted italic mt-2 pl-3 border-l-2 border-border">
                  "{order.rating.comment}"
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span>{formatCurrency(order.total)}</span>
                {order.motoboyName && <span> entregue por {order.motoboyName}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}