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

  // Determine classes based on view mode
  const gridClasses = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
  const listClasses = 'space-y-4'

  const itemClasses = cn(
    'group flex flex-col rounded-xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 cursor-pointer',
    viewMode === 'list' ? 'flex-col' : 'grid-col'
  )

  const imageClasses = cn(
    'group relative aspect-square bg-surface-hover',
    viewMode === 'list' ? 'aspect-auto' : 'aspect-square'
  )

  const titleClasses = cn(
    'text-base font-semibold text-brand-white transition-colors group-hover:text-accent',
    viewMode === 'list' ? 'text-sm' : 'text-base'
  )

  const priceClasses = cn(
    'mt-4 flex items-center justify-between',
    viewMode === 'list' ? 'mt-3' : 'mt-4'
  )

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={cn(
          'group flex flex-col rounded-xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 cursor-pointer',
          className
        )}>
        <div className="block overflow-hidden rounded-t-xl">
          <div className={imageClasses}>
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
          <h3 className={titleClasses}>
            {product.name}
          </h3>
          <p className={cn('mt-1 line-clamp-2 text-sm text-muted flex-1', viewMode === 'list' ? 'line-clamp-3' : 'line-clamp-2')}>
            {product.description}
          </p>

          <div className={priceClasses}>
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
            {isJuice ? 'Escolher' : <ShoppingCart size={16} />}
          </Button>
        </div>
      </div>

      {!isJuice && showModal && (
        <ProductModal product={product} onClose={() => setShowModal(false)} />
      )}
      {isJuice && showJuiceModal && (
        <JuiceSelectionModal product={product} onClose={() => setShowJuiceModal(false)} />
      )}
      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </>
  )
}