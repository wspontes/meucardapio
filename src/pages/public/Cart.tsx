import { Link, useParams } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Button, Input } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useSettings } from '@/hooks'
import { couponsService } from '@/services'
import { formatCurrency } from '@/utils'

export default function Cart() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { state, removeItem, updateQuantity, updateBorder, applyCoupon, subtotal, discount, total } = useCart()
  const { settings } = useSettings()
  const [couponInput, setCouponInput] = useState('')
  const couponApplied = !!state.couponCode
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const handleApplyCoupon = async () => {
    setCouponError('')
    setCouponLoading(true)
    try {
      const all = await couponsService.getAll()
      const coupon = all.find((c) => c.code === couponInput.trim().toUpperCase() && c.active)
      if (!coupon) { setCouponError('Cupom inválido ou expirado'); setCouponLoading(false); return }

      const expiry = coupon.expiresAt instanceof Timestamp ? coupon.expiresAt.toDate() : coupon.expiresAt instanceof Date ? coupon.expiresAt : new Date(String(coupon.expiresAt))
      if (expiry < new Date()) { setCouponError('Cupom expirado'); setCouponLoading(false); return }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) { setCouponError('Cupom já atingiu o limite de usos'); setCouponLoading(false); return }
      if (coupon.minOrder && subtotal < coupon.minOrder) { setCouponError(`Valor mínimo de R$ ${coupon.minOrder.toFixed(2)} para este cupom`); setCouponLoading(false); return }

      applyCoupon(coupon.code, coupon.type, coupon.value)
    } catch {
      setCouponError('Erro ao validar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const crustOptions = settings?.crustOptions || []

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <ShoppingBag size={36} className="text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-white">Carrinho vazio</h1>
          <p className="mt-2 text-muted">Adicione produtos do cardápio para começar seu pedido.</p>
          <Link to={`${prefix}/cardapio`}>
            <Button className="mt-6">Ver Cardápio</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to={`${prefix}/cardapio`} className="text-muted transition-colors hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Carrinho</h1>
          <p className="text-xs md:text-sm text-muted">{state.items.length} itens</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {state.items.map((item) => (
            <div key={item.productId} className="rounded-xl border border-border bg-surface p-3 md:p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm md:text-base truncate">{item.productName}</h3>
                  {item.size && <p className="text-xs text-muted mt-0.5">Tamanho: {item.size}</p>}
                  {!item.hasCrust && item.border && <p className="text-xs text-accent mt-0.5">Borda: {item.border}{item.borderPrice ? ` (+${formatCurrency(item.borderPrice)})` : ''}</p>}
                  <p className="mt-1.5 font-semibold text-accent text-sm">{formatCurrency(item.price)}</p>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-white transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 md:w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-hover hover:text-white transition-colors">
                    <Plus size={12} />
                  </button>
                </div>

                <p className="w-16 md:w-20 text-right font-medium text-white text-sm shrink-0">{formatCurrency((item.price + (item.borderPrice || 0)) * item.quantity)}</p>

                <button onClick={() => removeItem(item.productId)} className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              {item.hasCrust && crustOptions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <label className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1.5 block">Borda recheada</label>
                  <select
                    value={item.border || ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined
                      const opt = crustOptions.find((c) => c.name === val)
                      updateBorder(item.productId, val, opt?.price)
                    }}
                    className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                  >
                    <option value="">Sem borda recheada</option>
                    {crustOptions.map((c) => (
                      <option key={c.name} value={c.name}>{c.name} — {formatCurrency(c.price)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 font-semibold text-white text-sm">Cupom de desconto</h3>
            {couponApplied ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2.5">
                <Ticket size={16} className="text-green-400 shrink-0" />
                <span className="text-sm text-green-400 font-medium">{state.couponCode}</span>
                <span className="text-xs text-green-400/70 ml-auto">Aplicado</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Digite o cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} icon={<Ticket size={16} />} disabled={couponLoading} />
                <Button variant="outline" size="md" onClick={handleApplyCoupon} loading={couponLoading}>Aplicar</Button>
              </div>
            )}
            {couponError && <p className="mt-2 text-xs text-red-400">{couponError}</p>}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 font-semibold text-white text-sm">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-400"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="border-t border-border pt-2"><div className="flex justify-between font-semibold text-white"><span>Total</span><span>{formatCurrency(total)}</span></div></div>
            </div>

            <Link to={`${prefix}/checkout`} className="mt-4 block"><Button className="w-full" size="lg">Continuar</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
