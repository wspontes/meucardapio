import { useState, useEffect, useRef } from 'react'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Clock, ChefHat, ShoppingBag, Bike } from 'lucide-react'
import type { Order } from '@/types'

const ACTIVE_STATUSES = ['received', 'accepted', 'preparing', 'outForDelivery'] as const

interface ColumnDef {
  status: (typeof ACTIVE_STATUSES)[number]
  title: string
  bar: string
  chip: string
}

const COLUMNS: ColumnDef[] = [
  { status: 'received', title: 'Recebidos', bar: 'bg-blue-500', chip: 'bg-blue-500/20 text-blue-400' },
  { status: 'accepted', title: 'Aceitos', bar: 'bg-cyan-500', chip: 'bg-cyan-500/20 text-cyan-400' },
  { status: 'preparing', title: 'Em preparo', bar: 'bg-orange-500', chip: 'bg-orange-500/20 text-orange-400' },
  { status: 'outForDelivery', title: 'Saiu p/ entrega', bar: 'bg-green-500', chip: 'bg-green-500/20 text-green-400' },
]

function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
}

function timeLabel(dateStr: string): string {
  const minutes = elapsedMinutes(dateStr)
  if (minutes < 1) return 'Agora'
  return `${minutes} min`
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    void ctx.resume()
    const beepAt = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    beepAt(880, 0, 0.18)
    beepAt(880, 0.28, 0.18)
  } catch {
    // Áudio indisponível
  }
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const audioWarmedRef = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const warm = () => { audioWarmedRef.current = true }
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const active = orders
    .filter((o) => (ACTIVE_STATUSES as readonly string[]).includes(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const newCount = active.filter((o) => o.status === 'received').length

  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) Novo pedido! - Cozinha` : 'Cozinha - MeuCardapio'
    if (newCount === 0) return
    if (audioWarmedRef.current) playBeep()
    const t = setInterval(() => {
      if (audioWarmedRef.current) playBeep()
    }, 8000)
    return () => clearInterval(t)
  }, [newCount])

  const clock = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

  return (
    <div className="min-h-screen bg-brand-black px-4 py-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-brand-white">
            <ChefHat size={28} className="shrink-0 text-accent" />
            <span className="truncate">Painel da Cozinha</span>
          </h1>
          <p className="mt-1 text-sm capitalize text-muted">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {newCount > 0 && (
            <span className="animate-pulse rounded-full bg-red-600 px-3 md:px-4 py-1.5 text-xs md:text-sm font-bold text-brand-white">
              {newCount} novo{newCount > 1 ? 's' : ''} pedido{newCount > 1 ? 's' : ''}!
            </span>
          )}
          <span className="text-2xl md:text-4xl font-bold tabular-nums text-brand-white">{clock}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : active.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-16 text-center">
          <ChefHat size={56} className="mx-auto mb-4 text-muted" />
          <p className="text-xl text-muted">Nenhum pedido ativo no momento</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2 grid-cols-1">
          {COLUMNS.map((col) => {
            const colOrders = active.filter((o) => o.status === col.status)
            return (
              <section key={col.status} className="flex flex-col rounded-xl border border-border bg-surface/60">
                <header className={`flex items-center justify-between rounded-t-xl ${col.bar} px-4 py-2.5`}>
                  <h2 className="text-base font-bold uppercase tracking-wide text-brand-white">{col.title}</h2>
                  <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-sm font-bold text-brand-white tabular-nums">
                    {colOrders.length}
                  </span>
                </header>
                <div className="flex flex-col gap-3 p-3">
                  {colOrders.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted">Vazio</p>
                  ) : (
                    colOrders.map((order) => {
                      const delayed = elapsedMinutes(order.createdAt) > 20
                      const isPickup = order.deliveryType === 'pickup'
                      return (
                        <article
                          key={order.id}
                          className={`rounded-lg border border-border bg-surface p-4 ${delayed ? 'ring-2 ring-red-500/50' : ''}`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-bold text-muted">#{order.id.slice(0, 8)}</span>
                            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${col.chip}`}>
                              <Clock size={14} className={delayed ? 'animate-pulse' : ''} />
                              {timeLabel(order.createdAt)}
                            </span>
                          </div>
                          <h3 className="break-words text-xl font-bold leading-tight text-brand-white">{order.customerName}</h3>
                          <div className="mt-1.5 mb-3 flex flex-wrap items-center gap-2">
                            {isPickup ? (
                              <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400">
                                <ShoppingBag size={12} /> Retirada
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-md bg-border/60 px-2 py-0.5 text-xs font-medium text-muted">
                                <Bike size={12} /> Entrega
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1.5">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="min-w-0">
                                <p className="break-words text-base font-semibold text-brand-white">
                                  {item.quantity}x {item.productName}
                                </p>
                                {item.notes && <p className="break-words pl-4 text-xs text-yellow-400">↳ {item.notes}</p>}
                              </li>
                            ))}
                          </ul>
                          {order.notes && (
                            <p className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400">
                              Obs.: {order.notes}
                            </p>
                          )}
                        </article>
                      )
                    })
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
