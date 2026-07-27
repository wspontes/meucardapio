import { useState, useEffect } from 'react'
import { Clock, ChefHat, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui'
import { ordersService } from '@/services'
import type { Order } from '@/types'

function getTimeSince(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return 'Agora'
  return `${minutes} min`
}

function isDelayed(dateStr: string, threshold = 20): boolean {
  return Date.now() - new Date(dateStr).getTime() > threshold * 60000
}

const statusFlow = ['received', 'accepted', 'preparing'] as const

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await ordersService.getAll()
      setOrders(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t) }, [])

  const advanceStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const idx = statusFlow.indexOf(order.status as typeof statusFlow[number])
    if (idx === -1 || idx >= statusFlow.length - 1) return
    const next = statusFlow[idx + 1]
    await ordersService.update(orderId, { status: next } as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)))
  }

  const cancelOrder = async (orderId: string) => {
    await ordersService.update(orderId, { status: 'cancelled' } as Partial<Order>)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)))
  }

  const activeOrders = orders.filter((o) => ['received', 'accepted', 'preparing'].includes(o.status))
  const readyOrders = orders.filter((o) => o.status === 'outForDelivery')
  const statusLabel: Record<string, string> = { received: 'Recebido', accepted: 'Aceito', preparing: 'Preparando' }
  const statusColor: Record<string, string> = { received: 'border-blue-500', accepted: 'border-green-500', preparing: 'border-orange-500' }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-sm text-muted">{activeOrders.length} pedidos ativos</p>
        </div>
      </div>

      {activeOrders.length === 0 && readyOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <ChefHat size={48} className="mx-auto mb-4 text-muted" />
          <p className="text-lg text-muted">Nenhum pedido no momento</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => {
              const delayed = isDelayed(order.createdAt)
              return (
                <div key={order.id} className={`rounded-xl border-l-4 bg-surface p-5 transition-all ${statusColor[order.status] || ''} ${delayed ? 'ring-2 ring-red-500/30' : ''}`}>
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{order.customerName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{order.id}</span><span>•</span>
                        <Clock size={14} />
                        <span className={delayed ? 'text-red-400 font-medium' : ''}>{getTimeSince(order.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' :
                      order.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{statusLabel[order.status] || order.status}</span>
                  </div>
                  <div className="mb-4 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-white">{item.quantity}x {item.productName}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="lg" className="flex-1 text-base" onClick={() => advanceStatus(order.id)}>
                      <ChefHat size={18} />
                      {order.status === 'received' ? 'Aceitar' : order.status === 'accepted' ? 'Iniciar Preparo' : 'Finalizar'}
                    </Button>
                    {(order.status === 'received' || order.status === 'accepted') && (
                      <Button size="lg" variant="ghost" onClick={() => cancelOrder(order.id)}>
                        <XCircle size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {readyOrders.length > 0 && (
            <>
              <h2 className="mb-4 text-lg font-bold text-green-400">Saiu para Entrega ({readyOrders.length})</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-green-500/30 bg-surface p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{order.customerName}</h3>
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                    <p className="text-sm text-muted">{order.id}</p>
                    <div className="mt-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-white">{item.quantity}x {item.productName}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
