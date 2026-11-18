import { useState } from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { cn, formatCurrency, isJuiceProduct } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { Button } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useBusinessStatus } from '@/hooks'
import { OperatingHoursModal } from './OperatingHoursModal'
import { ProductModal } from './ProductModal'
import { JuiceSelectionModal } from './JuiceSelectionModal'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
  viewMode?: 'grid' | 'list'
}

export function ProductCard({ product, className, viewMode = 'grid' }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showJuiceModal, setShowJuiceModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { status } = useBusinessStatus()
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price
  const isJuice = isJuiceProduct(product.name)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }

    if (isJuice) {
      setShowJuiceModal(true)
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price,
    })
    showToast('Adicionado no carrinho!')
  }

  // Grid mode: keep existing card layout unchanged
  if (viewMode === 'grid') {
    return (
      <>
        <div
          onClick={() => setShowModal(true)}
          className={cn(
            'group flex flex-col rounded-xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 cursor-pointer',
            className
          )}>
          <div className="block overflow-hidden rounded-t-xl">
            <div className="group relative aspect-square bg-surface-hover">
              {product.image ? (
                <img
                  src={resolveImageUrl(product.image)}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Star size={40} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <h3 className="text-base font-semibold text-brand-white transition-colors group-hover:text-accent">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted flex-1">
              {product.description}
            </p>
          </div>

          <div className="mt-4 flex items-between justify-between">
            {(product.discountPrice ?? 0) > 0 && (
              <span className="text-xs text-muted line-through">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className="text-lg font-bold text-accent">
              {formatCurrency(price)}
            </span>
          </div>

          <Button size="sm" onClick={handleAddToCart} className="shrink-0">
            {isJuice ? 'Escolher' : 'ADICIONAR'}
          </Button>
        </div>
      </>
    )
  }

  // List mode: horizontal line item layout
  return (
    <div className="border-b border-separator py-3 last:border-0">
      <div
        className="flex cursor-pointer items-start gap-3 md:gap-4"
        onClick={() => setShowModal(true)}
      >
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-surface-hover md:h-[90px] md:w-[90px]">
          {product.image ? (
            <img
              src={resolveImageUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Star size={24} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-tight text-brand-white md:text-lg">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted md:text-sm">
            {product.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {(product.discountPrice ?? 0) > 0 && (
            <span className="text-[10px] text-muted line-through md:text-xs">
              {formatCurrency(product.price)}
            </span>
          )}
          <span className="text-right text-sm font-bold text-price-color md:text-lg">
            {formatCurrency(price)}
          </span>
          <Button size="sm" onClick={handleAddToCart} className="h-7 px-3 text-[11px]">
            {isJuice ? 'ESCOLHER' : 'ADICIONAR'}
          </Button>
        </div>
      </div>
    </div>
  )
}