import { useState, useEffect, useRef } from 'react'
import { ChefHat, XCircle, ArrowLeft, MessageSquare, CheckCircle, Search, User as UserIcon, Clock, Banknote, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'
import { ordersService } from '@/services'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Order } from '@/types'
import { formatCurrency, formatTime } from '@/utils'
import { useToast } from '@/contexts/ToastContext'

const statusConfig: Record<string, { label: string; color: string }> = {
  waitingPayment: { label: 'Aguard. Pagamento', color: 'bg-yellow-500/10 text-yellow-400' },
  received: { label: 'Recebido', color: 'bg-blue-500/10 text-blue-400' },
  accepted: { label: 'Aceito', color: 'bg-green-500/10 text-green-400' },
  preparing: { label: 'Preparando', color: 'bg-orange-500/10 text-orange-400' },
  outForDelivery: { label: 'Saiu para entrega', color: 'bg-purple-500/10 text-purple-400' },
  delivered: { label: 'Entregue', color: 'bg-green-500/10 text-green-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400' },
}

const statuses = ['waitingPayment', 'received', 'accepted', 'preparing', 'outForDelivery', 'delivered'] as const

const sectionOrder = ['waitingPayment', 'received', 'accepted', 'preparing', 'outForDelivery'] as const
const doneStatus = 'delivered'
const cancelledStatus = 'cancelled'

function playNotification() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio not available
  }
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [whatsappModal, setWhatsappModal] = useState<{ phone: string; name: string; message: string } | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)
  const prevIds = useRef<Set<string>>(new Set())
  const { showToast } = useToast()

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      setOrders(data)

      const currentIds = new Set(data.map((o) => o.id))
      const newIds = [...currentIds].filter((id) => !prevIds.current.has(id))
      if (prevIds.current.size > 0 && newIds.length > 0) {
        playNotification()
        const newOrders = data.filter((o) => newIds.includes(o.id))
        newOrders.forEach((o) => {
          showToast(`Novo pedido de ${o.customerName}!`, 'success')
        })
      }
      prevIds.current = currentIds
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const advanceStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const currentIndex = statuses.indexOf(order.status as typeof statuses[number])
    if (currentIndex >= statuses.length - 1) return
    const nextStatus = statuses[currentIndex + 1]
    const updateData: Record<string, unknown> = { status: nextStatus }
    if (nextStatus === 'received') updateData.paymentStatus = 'paid'
    await ordersService.update(orderId, updateData as Partial<Order>)
    if (nextStatus === 'accepted') {
      setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}! Seu pedido foi ACEITO e já está em preparação. Obrigado por escolher a Pizzas Mania! 🍕` })
    } else if (nextStatus === 'outForDelivery') {
      const isPickup = order.deliveryType === 'pickup'
      setWhatsappModal({
        phone: order.customerPhone,
        name: order.customerName,
        message: isPickup
          ? `Olá ${order.customerName}! Seu pedido está PRONTO para retirada! Pode buscar na pizzaria. 🍕`
          : `Olá ${order.customerName}! Seu pedido SAIU PARA ENTREGA. Fique atento ao seu celular! 🛵🍕`
      })
    }
  }

  const confirmPayment = async (orderId: string) => {
    await ordersService.update(orderId, { status: 'received', paymentStatus: 'paid' } as Partial<Order>)
  }

  const backStatus = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const currentIndex = statuses.indexOf(order.status as typeof statuses[number])
    if (currentIndex <= 0) return
    const prevStatus = statuses[currentIndex - 1]
    await ordersService.update(orderId, { status: prevStatus } as Partial<Order>)
  }

  const cancelOrder = async (orderId: string) => {
    setCancelConfirm(null)
    await ordersService.update(orderId, { status: 'cancelled' } as Partial<Order>)
  }

  const getPaymentLabel = (method: string) => {
    if (method === 'pix') return 'PIX'
    if (method === 'card') return 'Cartão crédito/débito na entrega/retirada'
    if (method === 'cash') return 'Dinheiro'
    if (method === 'credit') return 'Cartão Crédito'
    if (method === 'debit') return 'Cartão Débito'
    if (method === 'delivery') return 'Pagar na Entrega'
    return method
  }

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const filtered = orders.filter((o) => !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))

  const activeOrders = filtered.filter((o) => (sectionOrder as readonly string[]).includes(o.status))
  const doneOnes = filtered.filter((o) => o.status === doneStatus)
  const cancelledOnes = filtered.filter((o) => o.status === cancelledStatus)

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
        <h1 className="text-xl md:text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-xs md:text-sm text-muted mt-0.5">{orders.length} pedidos no total</p>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar por nome ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
          <p className="text-sm md:text-base text-muted">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <button onClick={() => toggleSection('ativos')} className="mb-3 flex items-center gap-2 text-sm font-semibold text-white hover:text-accent transition-colors">
                <Bell size={14} />
                Em Andamento ({activeOrders.length})
                {collapsed.has('ativos') ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
              </button>
              {!collapsed.has('ativos') && (
                <div className="space-y-3">
                  {activeOrders.map((order) => <OrderCard key={order.id} order={order} {...{ advanceStatus, confirmPayment, backStatus, cancelOrder: (id: string) => setCancelConfirm(id), setWhatsappModal, statusConfig, getPaymentLabel, formatCurrency, formatTime }} />)}
                </div>
              )}
            </div>
          )}

          {doneOnes.length > 0 && (
            <div>
              <button onClick={() => toggleSection('entregues')} className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors">
                <CheckCircle size={14} />
                Entregues ({doneOnes.length})
                {collapsed.has('entregues') ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
              </button>
              {!collapsed.has('entregues') && (
                <div className="space-y-3">
                  {doneOnes.map((order) => <OrderCard key={order.id} order={order} {...{ advanceStatus, confirmPayment, backStatus, cancelOrder: () => {}, setWhatsappModal, statusConfig, getPaymentLabel, formatCurrency, formatTime }} />)}
                </div>
              )}
            </div>
          )}

          {cancelledOnes.length > 0 && (
            <div>
              <button onClick={() => toggleSection('cancelados')} className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">
                <XCircle size={14} />
                Cancelados ({cancelledOnes.length})
                {collapsed.has('cancelados') ? <ChevronDown size={14} className="text-muted" /> : <ChevronUp size={14} className="text-muted" />}
              </button>
              {!collapsed.has('cancelados') && (
                <div className="space-y-3">
                  {cancelledOnes.map((order) => <OrderCard key={order.id} order={order} {...{ advanceStatus, confirmPayment, backStatus, cancelOrder: () => {}, setWhatsappModal, statusConfig, getPaymentLabel, formatCurrency, formatTime }} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {whatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setWhatsappModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base md:text-lg font-semibold text-white">
                <MessageSquare size={18} className="text-green-500" />
                WhatsApp
              </h3>
              <button onClick={() => setWhatsappModal(null)} className="text-muted hover:text-white transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">Enviar mensagem para <span className="text-white font-medium">{whatsappModal.name}</span></p>
            <textarea className="mb-4 w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-white" rows={4} value={whatsappModal.message} onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })} />
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button className="flex-1 text-sm h-10" onClick={() => { window.open(`https://wa.me/${whatsappModal.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappModal.message)}`, '_blank'); setWhatsappModal(null) }}>
                <MessageSquare size={16} />
                Enviar via WhatsApp
              </Button>
              <Button variant="ghost" className="text-sm h-10" onClick={() => setWhatsappModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCancelConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <XCircle size={28} className="text-red-400" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-base font-semibold text-white">Cancelar pedido?</h3>
            <p className="mb-5 text-center text-sm text-muted">Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-sm h-10" onClick={() => setCancelConfirm(null)}>
                Voltar
              </Button>
              <Button className="flex-1 text-sm h-10 bg-red-600 hover:bg-red-700" onClick={() => cancelOrder(cancelConfirm)}>
                <XCircle size={15} />
                Sim, cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, advanceStatus, confirmPayment, backStatus, cancelOrder, setWhatsappModal, statusConfig, getPaymentLabel, formatCurrency, formatTime }: {
  order: Order
  advanceStatus: (id: string) => void
  confirmPayment: (id: string) => void
  backStatus: (id: string) => void
  cancelOrder: (id: string) => void
  setWhatsappModal: (data: { phone: string; name: string; message: string }) => void
  statusConfig: Record<string, { label: string; color: string }>
  getPaymentLabel: (method: string) => string
  formatCurrency: (n: number) => string
  formatTime: (d: Date) => string
}) {
  const isPickup = order.deliveryType === 'pickup'
  const status = isPickup && order.status === 'outForDelivery'
    ? { label: 'Pronto, aguardando retirada', color: 'bg-purple-500/10 text-purple-400' }
    : statusConfig[order.status] || statusConfig.waitingPayment
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <UserIcon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{order.customerName}</p>
              <p className="text-xs text-muted mt-0.5">#{order.id.slice(0, 8)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-2 space-y-0.5">
            {order.items.map((item, idx) => (
              <p key={idx} className="text-xs text-muted">{item.quantity}x {item.productName}</p>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><Clock size={11} />{formatTime(new Date(order.createdAt))}</span>
            <span className="flex items-center gap-1"><Banknote size={11} />{getPaymentLabel(order.paymentMethod)}</span>
            {order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor && (
              <span className="text-green-400">Troco: {formatCurrency(order.changeFor - order.total)}</span>
            )}
            <span className="text-white font-semibold ml-auto">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        {order.status === 'waitingPayment' && (
          <Button size="sm" onClick={() => confirmPayment(order.id)} className="bg-green-600 hover:bg-green-700 text-xs">
            <CheckCircle size={13} />
            Confirmar Pagamento
          </Button>
        )}
        {order.status !== 'waitingPayment' && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <>
            {order.status !== 'received' && (
              <Button size="sm" variant="ghost" onClick={() => backStatus(order.id)} className="h-8 w-8 md:h-9 md:w-9 p-0">
                <ArrowLeft size={15} />
              </Button>
            )}
            <Button size="sm" onClick={() => advanceStatus(order.id)} className="text-xs">
              <ChefHat size={13} />
              Avançar
            </Button>
          </>
        )}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <Button size="sm" variant="ghost" onClick={() => cancelOrder(order.id)} className="h-8 w-8 md:h-9 md:w-9 p-0">
            <XCircle size={15} />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setWhatsappModal({ phone: order.customerPhone, name: order.customerName, message: `Olá ${order.customerName}!` })} className="h-8 w-8 md:h-9 md:w-9 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10 ml-auto">
          <MessageSquare size={15} />
        </Button>
      </div>
    </div>
  )
}
