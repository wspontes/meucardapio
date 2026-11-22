import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Bike, Phone, MapPin, CheckCircle, LogOut, Navigation, Route, Loader2, AlertTriangle, Package, Clock, Banknote, Coins, XCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/contexts/StoreContext'
import { useSettings } from '@/hooks'
import { formatCurrency } from '@/utils'
import { calculateOptimizedRoute, buildWazeUrl, type RouteStop, type LatLng } from '@/utils/routeOptimizer'
import type { Order, Motoboy } from '@/types'

const MOTOBOW_KEY = 'meucardapio_motoboy_session'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* Audio not available */ }
}

function normalizePhone(p: string): string {
  return p.replace(/\D/g, '')
}

export default function MotoboyDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { store } = useStore()
  const { settings } = useSettings()
  const storeName = store?.name || 'MeuCardapio'

  const [motoboy, setMotoboy] = useState<Motoboy | null>(null)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [newCount, setNewCount] = useState(0)

  // Route optimization state
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [routeMapsUrl, setRouteMapsUrl] = useState('')
  const [routeError, setRouteError] = useState('')
  const [showRoute, setShowRoute] = useState(false)

  const prevOrderIds = useRef<Set<string>>(new Set())
  const audioWarmed = useRef(false)

  // Warm audio on first interaction
  useEffect(() => {
    const warm = () => {
      if (audioWarmed.current) return
      audioWarmed.current = true
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        void ctx.resume()
      } catch { /* ignore */ }
    }
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [])

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem(MOTOBOW_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Motoboy
        setMotoboy(parsed)
      } catch {
        localStorage.removeItem(MOTOBOW_KEY)
      }
    }
  }, [])

  // Load orders when motoboy is set
  useEffect(() => {
    if (!motoboy || !store?.id) return
    setLoading(true)
    const q = query(
      collection(db, 'orders'),
      where('storeId', '==', store.id),
      where('motoboyId', '==', motoboy.id)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // Detect new orders
      const currentIds = new Set(sorted.filter((o) => o.status === 'outForDelivery').map((o) => o.id))
      const newOnes = [...currentIds].filter((id) => !prevOrderIds.current.has(id))
      if (newOnes.length > 0 && prevOrderIds.current.size > 0) {
        playBeep()
        try { navigator.vibrate?.([200, 100, 200]) } catch { /* ignore */ }
        setNewCount((c) => c + newOnes.length)
      }
      prevOrderIds.current = currentIds

      setOrders(sorted)
      setLoading(false)
    })
    return () => unsub()
  }, [motoboy, store?.id])

  // Update document title
  useEffect(() => {
    if (newCount > 0) {
      document.title = `(${newCount}) Novo pedido! - Motoboy`
    } else {
      document.title = 'Motoboy - MeuCardapio'
    }
  }, [newCount])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const phone = normalizePhone(loginPhone)
    if (phone.length < 10) {
      setLoginError('Digite um telefone válido com DDD')
      return
    }
    setLoginLoading(true)
    try {
      // Search motoboys by phone (normalize)
      const { getDocs, collection: col } = await import('firebase/firestore')
      const snap = await getDocs(col(db, 'motoboys'))
      const found = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Motoboy))
        .find((m) => normalizePhone(m.phone || '') === phone)

      if (!found) {
        setLoginError('Motoboy não cadastrado. Contate o administrador.')
        return
      }
      if (!found.active) {
        setLoginError('Motoboy inativo. Contate o administrador.')
        return
      }
      setMotoboy(found)
      localStorage.setItem(MOTOBOW_KEY, JSON.stringify(found))
      setNewCount(0)
    } catch {
      setLoginError('Erro ao buscar motoboy. Tente novamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setMotoboy(null)
    setOrders([])
    localStorage.removeItem(MOTOBOW_KEY)
    setNewCount(0)
  }

  const markDelivered = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered',
        updatedAt: new Date().toISOString(),
      })
      try { navigator.vibrate?.([100]) } catch { /* ignore */ }
    } catch {
      alert('Erro ao marcar como entregue. Tente novamente.')
    }
  }

  const activeOrders = orders.filter((o) => o.status === 'outForDelivery')
  const historyOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled')

  const handleOptimizeRoute = async () => {
    if (activeOrders.length < 2) return
    setRouteLoading(true)
    setRouteError('')
    setShowRoute(true)
    try {
      // Get current position
      let origin: LatLng
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
        })
        origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      } catch {
        // Fallback: use store address (geocode it)
        if (settings?.address) {
          const { geocodeAddress } = await import('@/utils/routeOptimizer')
          const geo = await geocodeAddress(settings.address)
          if (geo) origin = geo
          else throw new Error('Não foi possível obter localização')
        } else {
          throw new Error('Permissão de localização negada')
        }
      }

      // Build stops from active orders
      const stops = activeOrders.map((o) => {
        const addr = o.deliveryAddress
        const addressStr = addr
          ? `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city}`
          : ''
        return { id: o.id, address: addressStr }
      }).filter((s) => s.address)

      const { calculateOptimizedRoute } = await import('@/utils/routeOptimizer')
      const result = await calculateOptimizedRoute(origin, stops)

      setRouteStops(result.stops)
      setRouteMapsUrl(result.googleMapsUrl)
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Erro ao calcular rota')
    } finally {
      setRouteLoading(false)
    }
  }

  // Login screen
  if (!motoboy) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <Bike size={32} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-brand-white">Área do Motoboy</h1>
            <p className="text-muted text-sm mt-1">{storeName}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-white">Seu telefone (WhatsApp)</label>
              <input
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="(11) 99999-8888"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {loginError}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
              {loginLoading && <Loader2 size={16} className="animate-spin" />}
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-black px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Bike size={20} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-brand-white">Olá, {motoboy.name}</h1>
            <p className="text-xs text-muted">{storeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeOrders.length >= 2 && (
            <Button
              size="sm"
              onClick={handleOptimizeRoute}
              disabled={routeLoading}
              className="text-xs"
            >
              {routeLoading ? <Loader2 size={14} className="animate-spin" /> : <Route size={14} />}
              {routeLoading ? 'Calculando...' : 'Rota otimizada'}
            </Button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </div>

      {newCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3">
          <Bell size={16} className="text-accent shrink-0" />
          <span className="text-sm font-medium text-brand-white">{newCount} novo(s) pedido(s)!</span>
          <button onClick={() => setNewCount(0)} className="ml-auto text-xs text-muted hover:text-brand-white">OK</button>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">Entregas realizadas</p>
          <p className="text-2xl font-bold text-green-400">{orders.filter((o) => o.status === 'delivered').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-accent">{activeOrders.length}</p>
        </div>
      </div>

      {/* Route optimization result */}
      {showRoute && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-brand-white">
              <Navigation size={18} className="text-accent" />
              Rota otimizada
            </h2>
            <button onClick={() => setShowRoute(false)} className="text-muted hover:text-brand-white transition-colors">
              <XCircle size={18} />
            </button>
          </div>

          {routeLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="ml-2 text-sm text-muted">Calculando rota...</span>
            </div>
          )}

          {routeError && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{routeError}</div>
          )}

          {!routeLoading && !routeError && routeStops.length > 0 && (
            <>
              <div className="space-y-2 mb-4">
                {routeStops.map((stop, idx) => {
                  const order = activeOrders.find((o) => o.id === stop.orderId)
                  return (
                    <div key={stop.orderId} className="flex items-start gap-3 rounded-lg bg-surface-hover p-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-white truncate">{order?.customerName}</p>
                        <p className="text-xs text-muted truncate">{stop.address}</p>
                        {stop.latLng && (
                          <p className="text-xs text-accent mt-0.5">{stop.distanceFromPrev.toFixed(1)} km da parada anterior</p>
                        )}
                        {!stop.latLng && (
                          <p className="text-xs text-red-400 mt-0.5">Endereço não localizado</p>
                        )}
                      </div>
                      {stop.latLng && (
                        <a
                          href={buildWazeUrl(stop.latLng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg bg-surface px-2 py-1 text-xs text-muted hover:text-brand-white transition-colors"
                        >
                          Waze
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>

              {routeMapsUrl && (
                <a href={routeMapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="primary" className="w-full text-sm">
                    <Navigation size={16} />
                    Abrir rota completa no Google Maps
                  </Button>
                </a>
              )}
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : activeOrders.length === 0 && !showHistory ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
          <Package size={48} className="mx-auto mb-4 text-muted" />
          <p className="text-muted">Nenhuma entrega atribuída no momento.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-accent">Entregas pendentes ({activeOrders.length})</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <DeliveryCard key={order.id} order={order} onDeliver={markDelivered} />
                ))}
              </div>
            </div>
          )}

          {historyOrders.length > 0 && (
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="mb-3 text-sm font-semibold text-muted hover:text-brand-white transition-colors"
              >
                {showHistory ? 'Ocultar' : 'Mostrar'} histórico ({historyOrders.length})
              </button>
              {showHistory && (
                <div className="space-y-3 opacity-60">
                  {historyOrders.map((order) => (
                    <DeliveryCard key={order.id} order={order} onDeliver={markDelivered} readonly />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DeliveryCard({ order, onDeliver, readonly }: { order: Order; onDeliver: (id: string) => void; readonly?: boolean }) {
  const isPickup = order.deliveryType === 'pickup'
  const addr = order.deliveryAddress
  const payLabel = order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod === 'card' ? 'Cartão' : order.paymentMethod

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-medium text-brand-white">{order.customerName}</p>
          <p className="text-xs text-muted">#{order.id.slice(0, 8)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
          order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
          'bg-purple-500/10 text-purple-400'
        }`}>
          {order.status === 'delivered' ? (isPickup ? 'Retirado' : 'Entregue') :
           order.status === 'cancelled' ? 'Cancelado' :
           isPickup ? 'Pronto p/ retirada' : 'Saiu p/ entrega'}
        </span>
      </div>

      <div className="space-y-1 text-sm mb-3">
        {(order.items as Array<{ quantity: number; productName: string }>)?.map((item, i) => (
          <p key={i} className="text-muted">{item.quantity}x {item.productName}</p>
        ))}
      </div>

      {addr && (
        <div className="rounded-lg bg-surface-hover p-3 mb-3 text-sm">
          <p className="font-medium text-brand-white">{addr.street}, {addr.number}</p>
          {addr.complement && <p className="text-xs text-muted">{addr.complement}</p>}
          {addr.reference && <p className="text-xs text-muted">Ref: {addr.reference}</p>}
          <p className="text-xs text-muted">{addr.neighborhood} - {addr.city}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <MapPin size={12} /> Abrir no Maps
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-3">
        <span className="flex items-center gap-1"><Phone size={11} />{order.customerPhone}</span>
        <span className="flex items-center gap-1"><Banknote size={11} />{payLabel}</span>
        {order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor && (
          <span className="text-green-400">Troco: {formatCurrency(order.changeFor - order.total)}</span>
        )}
        <span className="text-brand-white font-semibold ml-auto">{formatCurrency(order.total)}</span>
      </div>

      {!readonly && order.status === 'outForDelivery' && (
        <Button
          onClick={() => onDeliver(order.id)}
          className="w-full text-sm bg-green-600 hover:bg-green-700"
        >
          <CheckCircle size={16} />
          Marcar como Entregue
        </Button>
      )}
    </div>
  )
}