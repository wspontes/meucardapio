import { Link, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { ProductCard, ProductCardSkeleton } from '@/components/shared'
import { ProductModal } from '@/components/shared/ProductModal'
import { OperatingHoursModal } from '@/components/shared/OperatingHoursModal'
import { useFeaturedProducts, useSectionProducts, useSettings, useBusinessStatus } from '@/hooks'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { formatCurrency } from '@/utils'
import { productsService } from '@/services'
import type { Product } from '@/types'

export default function Home() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { products: featured, loading: featuredLoading } = useFeaturedProducts()
  const { products: newProducts, loading: newLoading } = useSectionProducts('new')
  const { products: promoProducts, loading: promoLoading } = useSectionProducts('promotion')
  const { settings, loading: settingsLoading } = useSettings()
  const { status } = useBusinessStatus()
  const [bannerIndex, setBannerIndex] = useState(0)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [linkedProduct, setLinkedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)

  useEffect(() => {
    productsService.getActiveProducts().then(setAllProducts).catch(() => {})
  }, [])

  const banners = settings?.banners
  const showBanner = settingsLoading || (banners?.active ?? true)
  const items = banners?.items?.filter((b) => b.title || b.image) || []
  const scrollStyle = banners?.scrollStyle || 'dots'
  const multi = items.length > 1

  const goTo = useCallback((i: number) => {
    setBannerIndex(((i % items.length) + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (!multi || scrollStyle !== 'dots') return
    const timer = setInterval(() => goTo(bannerIndex + 1), 5000)
    return () => clearInterval(timer)
  }, [multi, scrollStyle, bannerIndex, goTo])

  const currentBanner = items[bannerIndex] || null
  const textColor = currentBanner?.textColor || '#ffffff'
  const hasImage = !!currentBanner?.image
  const alignClass = currentBanner?.align === 'center' ? 'items-center text-center' : currentBanner?.align === 'right' ? 'items-end text-right' : 'items-start text-left'

  useEffect(() => {
    if (currentBanner?.linkProductId && allProducts.length > 0) {
      setLinkedProduct(allProducts.find((p) => p.id === currentBanner.linkProductId) || null)
    } else {
      setLinkedProduct(null)
    }
  }, [currentBanner?.linkProductId, allProducts])

  const handleLinkedProductClick = () => {
    if (!linkedProduct) return
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    setShowProductModal(true)
  }

  const [touchX, setTouchX] = useState(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchX(e.touches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!multi) return
    const diff = touchX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      goTo(bannerIndex + (diff > 0 ? 1 : -1))
    }
  }, [multi, touchX, bannerIndex, goTo])

  return (
    <>
    <div className="container mx-auto px-4 py-6 pb-6">
      {showBanner && items.length > 0 && (
      <section className="relative mb-10 overflow-hidden rounded-2xl min-h-[220px] md:min-h-[300px] flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {settingsLoading ? (
          <div className="relative z-10 min-h-[200px] animate-pulse rounded-2xl bg-surface">
            <div className="h-6 w-32 rounded bg-surface-hover mb-4 mt-8 ml-6" />
            <div className="h-10 w-3/4 rounded bg-surface-hover mb-2 ml-6" />
            <div className="h-10 w-1/2 rounded bg-surface-hover mb-4 ml-6" />
            <div className="h-4 w-2/3 rounded bg-surface-hover ml-6" />
          </div>
        ) : (
          <div className="relative flex-1">
            {hasImage && (
              <>
                <img
                  src={resolveImageUrl(currentBanner.image!)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-black/70" />
                <div className="absolute inset-0 w-1/2 left-1/2 z-10">
                  <img
                    src={resolveImageUrl(currentBanner.image!)}
                    alt=""
                    className="h-full w-full object-cover object-right"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </>
            )}
            {!hasImage && (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface to-surface" />
            )}
            <div className={`relative z-10 flex flex-col justify-center px-6 md:px-12 py-8 ${alignClass}`}>
              {currentBanner.linkProductId && (
                <span className="inline-block mb-3 text-[10px] font-semibold uppercase tracking-widest text-accent">Destaque</span>
              )}
              <div className={currentBanner?.align === 'center' ? 'mx-auto' : 'max-w-xl'}>
                <h2
                  className="text-xl md:text-5xl font-bold leading-tight cursor-pointer hover:underline decoration-accent/50 underline-offset-4"
                  style={{ color: textColor }}
                  onClick={handleLinkedProductClick}
                >
                  {currentBanner.title || 'A melhor pizza\nda cidade'}
                </h2>
                <p className="mt-2 md:mt-4 text-sm md:text-lg" style={{ color: textColor, opacity: 0.8 }}>
                  {currentBanner.subtitle || 'Ingredientes selecionados e o melhor sabor da cidade.'}
                </p>
                {linkedProduct && (
                  <Button onClick={handleLinkedProductClick} className="mt-4" size="sm">
                    Conferir <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </div>

            {multi && scrollStyle === 'arrows' && (
              <>
                <button
                  onClick={() => goTo(bannerIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => goTo(bannerIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {multi && (scrollStyle === 'dots' || scrollStyle === 'arrows') && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === bannerIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      )}

      <section className="mb-12">
        <div className="sticky top-16 z-30 -mx-4 bg-brand-black px-4 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-brand-white">Mais Pedidos</h2>
            <Link to={`${prefix}/cardapio`}>
              <Button size="sm">
                Ver Cardápio
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">Em breve novidades no cardápio!</p>
          </div>
        )}
      </section>

      {newProducts.length > 0 && (
      <section className="mb-12">
        <div className="sticky top-16 z-30 -mx-4 bg-brand-black px-4 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-brand-white">Novidades</h2>
            <Link to={`${prefix}/cardapio`}>
              <Button size="sm">
                Ver Cardápio
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
        {newLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
      )}

      {promoProducts.length > 0 && (
      <section className="mb-12">
        <div className="sticky top-16 z-30 -mx-4 bg-brand-black px-4 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-brand-white">Promoções</h2>
            <Link to={`${prefix}/cardapio`}>
              <Button size="sm">
                Ver Cardápio
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
        {promoLoading ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
      )}
    </div>
    {showProductModal && linkedProduct && (
      <ProductModal product={linkedProduct} onClose={() => setShowProductModal(false)} />
    )}
    <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </>
  )
}
