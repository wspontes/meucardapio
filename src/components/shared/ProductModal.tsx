import { useState } from 'react'
import { X, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings, useBusinessStatus } from '@/hooks'
import { formatCurrency } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { Button } from '@/components/ui'
import { OperatingHoursModal } from './OperatingHoursModal'
import type { Product } from '@/types'

interface ProductModalProps {
  product: Product
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { settings } = useSettings()
  const { status } = useBusinessStatus()
  const [selectedBorder, setSelectedBorder] = useState<string>('')
  const [showHoursModal, setShowHoursModal] = useState(false)
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price

  const crustOptions = settings?.crustOptions || []
  const hasCrust = product.hasCrust && crustOptions.length > 0
  const borderPrice = crustOptions.find((c) => c.name === selectedBorder)?.price || 0

  const handleAddToCart = () => {
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price,
      hasCrust: product.hasCrust,
      border: selectedBorder || undefined,
      borderPrice: selectedBorder ? borderPrice : undefined,
    })
    showToast('Adicionado no carrinho!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X size={18} />
        </button>

        {product.image ? (
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name}
            className="w-full max-h-[350px] object-contain bg-surface-hover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-surface-hover">
            <Star size={48} className="text-muted" />
          </div>
        )}

        <div className="p-5">
          <h2 className="text-lg font-bold text-white">{product.name}</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">{product.description}</p>

          <div className="mt-4 flex items-end gap-2">
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-sm text-muted line-through">{formatCurrency(product.price)}</span>
            )}
            <span className="text-2xl font-bold text-accent">{formatCurrency(price)}</span>
          </div>

          {hasCrust && (
            <div className="mt-4 rounded-xl border border-border bg-surface-hover p-3">
              <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Borda recheada</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-surface">
                  <input
                    type="radio"
                    name="crust"
                    checked={selectedBorder === ''}
                    onChange={() => setSelectedBorder('')}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-sm text-white">Sem borda recheada</span>
                </label>
                {crustOptions.map((opt) => (
                  <label key={opt.name} className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-surface">
                    <input
                      type="radio"
                      name="crust"
                      checked={selectedBorder === opt.name}
                      onChange={() => setSelectedBorder(opt.name)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="flex-1 text-sm text-white">{opt.name}</span>
                    <span className="text-sm text-accent font-medium">+{formatCurrency(opt.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleAddToCart} className="mt-5 w-full" size="lg">
            <ShoppingCart size={18} />
            Adicionar ao Carrinho
          </Button>
        </div>
      </div>
      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </div>
  )
}
