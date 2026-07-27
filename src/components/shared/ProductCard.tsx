import { useState } from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { cn, formatCurrency } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { Button } from '@/components/ui'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useBusinessStatus } from '@/hooks'
import { OperatingHoursModal } from './OperatingHoursModal'
import { ProductModal } from './ProductModal'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { status } = useBusinessStatus()
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
    })
    showToast('Adicionado no carrinho!')
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={cn(
          'group flex flex-col rounded-xl border border-border bg-surface transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 cursor-pointer',
          className
        )}
      >
        <div className="block overflow-hidden rounded-t-xl">
          <div className="aspect-square bg-surface-hover">
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
          <h3 className="text-base font-semibold text-white transition-colors group-hover:text-accent">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted flex-1">
            {product.description}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
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
              <ShoppingCart size={16} />
            </Button>
          </div>
        </div>
      </div>

      {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </>
  )
}
