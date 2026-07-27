import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from '@/services'
import { ArrowLeft, ShoppingBag, CheckCircle, Bike, ChefHat, QrCode, LogIn, LogOut, RotateCcw, Banknote, CreditCard, Bell } from 'lucide-react'
import { Button } from '@/components/ui'
import { useCustomer } from '@/contexts/CustomerContext'
import { useStore } from '@/contexts/StoreContext'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/utils'
import { CustomerLoginModal } from '@/components/shared/CustomerLoginModal'
import type { Order } from '@/types'

const statusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  waitingPayment: { label: 'Aguardando Pagamento', color: 'text-yellow-400', icon: QrCode },
  received: { label: 'Recebido', color: 'text-blue-400', icon: CheckCircle },
  accepted: { label: 'Aceito', color: 'text-green-400', icon: ChefHat },
  preparing: { label: 'Preparando', color: 'text-orange-400', icon: ChefHat },
  outForDelivery: { label: 'Saiu para entrega', color: 'text-purple-400', icon: Bike },
  delivered: { label: 'Entregue', color: 'text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-400', icon: CheckCircle },
}

const paymentLabels: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão crédito/débito na entrega/retirada',
  cash: 'Dinheiro',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  delivery: 'Pagar na Entrega',
}

function playStatusBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 600
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* Audio not available */ }
}

export default function MyOrders() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { store } = useStore()
  const { customer, isLoggedIn, logout } = useCustomer()
  const [showLogin, setShowLogin] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const prevStatuses = useRef<Map<string, string>>(new Map())

  const showNotification = useCallback((msg: string) => {
    setToast(msg)
    playStatusBeep()
    setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !customer) { setLoading(false); return }

    const storeId = getCurrentStoreId()

    const phoneQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('customerPhone', '==', customer.phone),
    )

    const nameQuery = query(
      collection(db, 'orders'),
      where('storeId', '==', storeId),
      where('customerName', '==', customer.name),
    )

    const allOrders = new Map<string, Order>()

    const merge = () => {
      const list = [...allOrders.values()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      list.forEach((order) => {
        const prev = prevStatuses.current.get(order.id)
        if (prev && prev !== order.status) {
          const baseLabel = statusMap[order.status]?.label || order.status
          const label = order.deliveryType === 'pickup' && order.status === 'outForDelivery' ? 'Pronto para retirada'
            : order.deliveryType === 'pickup' && order.status === 'delivered' ? 'Retirado'
            : baseLabel
          showNotification(`Pedido #${order.id.slice(0, 6)}: ${label}`)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(store?.name || 'MeuCardapio', { body: `Pedido #${order.id.slice(0, 6)}: ${label}` })
          }
        }
        prevStatuses.current.set(order.id, order.status)
      })
      setOrders(list)
      setLoading(false)
    }

    const unsub1 = onSnapshot(phoneQuery, (snap) => {
      snap.docs.forEach((d) => {
        allOrders.set(d.id, { id: d.id, ...d.data() } as Order)
      })
      merge()
    })

    const unsub2 = onSnapshot(nameQuery, (snap) => {
      snap.docs.forEach((d) => {
        allOrders.set(d.id, { id: d.id, ...d.data() } as Order)
      })
      merge()
    })

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { unsub1(); unsub2() }
  }, [customer, isLoggedIn, showNotification])

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <LogIn size={36} className="text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-white">Faça login para ver seus pedidos</h1>
          <p className="mt-2 text-muted">Entre com seu WhatsApp para acompanhar seus pedidos.</p>
          <Button className="mt-6" onClick={() => setShowLogin(true)}>
            <LogIn size={16} />
            Entrar
          </Button>
          {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    )
  }

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status))

  return (
    <div className="container mx-auto px-4 py-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 shadow-lg backdrop-blur-sm">
            <Bell size={16} className="text-accent shrink-0" />
            <span className="text-sm font-medium text-white">{toast}</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <Link to={prefix || '/'} className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">Meus Pedidos</h1>
          <p className="text-xs md:text-sm text-muted">Olá, {customer?.name}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <ShoppingBag size={40} className="mx-auto mb-4 text-muted" />
          <p className="text-muted">Você ainda não fez nenhum pedido.</p>
          <Link to={`${prefix}/cardapio`}><Button className="mt-4">Fazer pedido</Button></Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-accent">Pedido em Andamento</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <OrderItem key={order.id} order={order} prefix={prefix} />
                ))}
              </div>
            </div>
          )}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted">Pedidos Anteriores</h2>
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <OrderItem key={order.id} order={order} prefix={prefix} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OrderItem({ order, prefix }: { order: Order; prefix?: string }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const isPickup = order.deliveryType === 'pickup'
  const st = statusMap[order.status] || statusMap.received
  const label = isPickup && order.status === 'outForDelivery' ? 'Pronto para retirada'
    : isPickup && order.status === 'delivered' ? 'Retirado'
    : st.label
  const Icon = st.icon
  const created = new Date(order.createdAt)
  const dateStr = created.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timeStr = created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const isCompleted = order.status === 'delivered' || order.status === 'cancelled'
  const payLabel = paymentLabels[order.paymentMethod] || order.paymentMethod
  const PayIcon = order.paymentMethod === 'pix' ? QrCode
    : order.paymentMethod === 'credit' || order.paymentMethod === 'debit' || order.paymentMethod === 'card' ? CreditCard
    : Banknote

  const reorder = () => {
    order.items.forEach((item) => {
      addItem({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      })
    })
    navigate(`${prefix || ''}/carrinho`)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
          <Icon size={13} />
          {label}
        </span>
        <span className="text-xs text-muted">{dateStr} • {timeStr}</span>
      </div>
      <div className="space-y-0.5 mb-2">
        {order.items.map((item, i) => (
          <p key={i} className="text-sm text-muted">{item.quantity}x {item.productName}</p>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-muted">
        <span className="flex items-center gap-1"><PayIcon size={11} />{payLabel}</span>
        <span className="flex items-center gap-1">#{order.id.slice(0, 8)}</span>
        {isCompleted && (
          <button
            onClick={reorder}
            className="flex items-center gap-1 ml-auto rounded-md px-2 py-1 font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <RotateCcw size={11} />
            Pedir novamente
          </button>
        )}
        <span className="text-sm font-semibold text-white ml-auto">{formatCurrency(order.total)}</span>
      </div>
    </div>
  )
}
