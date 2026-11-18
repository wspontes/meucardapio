import { Link, useParams } from 'react-router-dom'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardList, Menu as MenuIcon, ShoppingCart, UtensilsCrossed, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { CategoryCard, ProductCard, ProductCardSkeleton, CategorySkeleton } from '@/components/shared'
import { HomeBoard } from '@/components/shared/HomeBoard'
import { StoreStatusLine } from '@/components/shared/StoreStatusLine'
import { ProductModal } from '@/components/shared/ProductModal'
import { OperatingHoursModal } from '@/components/shared/OperatingHoursModal'
import { useCategories, useProducts, useSettings, useBusinessStatus } from '@/hooks'
import { useCart } from '@/contexts/CartContext'
import { useStore } from '@/contexts/StoreContext'
import { resolveImageUrl } from '@/utils/resolveImageUrl'

export default function Menu() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { state } = useCart()
  const { store } = useStore()

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [bannerIndex, setBannerIndex] = useState(0)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarLogoFailed, setSidebarLogoFailed] = useState(false)

  const { categories, loading: catLoading } = useCategories()
  const { settings, loading: settingsLoading } = useSettings()
  const { status } = useBusinessStatus()
  const { products: allProducts, loading: prodLoading } = useProducts()

  const sidebarLogo = settings?.theme?.logo || store?.logo || null
  useEffect(() => setSidebarLogoFailed(false), [sidebarLogo])

  // O modo de visualização é definido pelo administrador nas configurações.
  const viewMode: 'grid' | 'list' = settings?.productViewMode === 'list' ? 'list' : 'grid'

  useEffect(() => {
    if (!catLoading && categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, catLoading, activeCategory])

  const products = useMemo(
    () => (activeCategory ? allProducts.filter((p) => p.categoryId === activeCategory) : allProducts),
    [allProducts, activeCategory]
  )

  const banners = settings?.banners
  const showBanner = settingsLoading || (banners?.active ?? true)
  const items = useMemo(() => banners?.items?.filter((b) => b.title || b.image) ?? [], [banners])
  const scrollStyle = banners?.scrollStyle || 'dots'
  const multi = items.length > 1
  const safeIndex = items.length > 0 ? bannerIndex % items.length : 0
  const currentBanner = items[safeIndex] ?? null

  const goTo = useCallback((i: number) => {
    if (items.length === 0) return
    setBannerIndex(((i % items.length) + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (!multi || scrollStyle !== 'dots') return
    const timer = setInterval(() => goTo(safeIndex + 1), 5000)
    return () => clearInterval(timer)
  }, [multi, scrollStyle, safeIndex, goTo])

  const touchX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!multi || touchX.current === null) return
    const diff = touchX.current - e.changedTouches[0].clientX
    touchX.current = null
    if (Math.abs(diff) > 50) goTo(safeIndex + (diff > 0 ? 1 : -1))
  }

  const linkedProduct = useMemo(() => {
    if (!currentBanner?.linkProductId) return null
    return allProducts.find((p) => p.id === currentBanner.linkProductId) ?? null
  }, [currentBanner?.linkProductId, allProducts])

  const handleLinkedProductClick = () => {
    if (!linkedProduct) return
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    setShowProductModal(true)
  }

  const handleCategoryClick = (categoryId: string) => {
    // Mantém a posição de rolagem atual ao trocar de categoria.
    setActiveCategory(categoryId)
  }

  const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0)

  const textColor = currentBanner?.textColor || '#ffffff'
  const hasImage = !!currentBanner?.image
  const alignClass =
    currentBanner?.align === 'center'
      ? 'items-center text-center'
      : currentBanner?.align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left'
  const overlayOpacity = Math.min(100, Math.max(0, currentBanner?.opacity ?? 50))
  const gridClass =
    viewMode === 'grid'
      ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
      : 'space-y-1'

  const pageHeader = (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-brand-black/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-white transition-colors hover:bg-surface-hover"
          aria-label="Abrir menu"
        >
          <MenuIcon size={20} />
        </button>
        <Link
          to={`${prefix}/carrinho`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-white transition-colors hover:bg-surface-hover"
          aria-label="Abrir carrinho"
        >
          <ShoppingCart size={20} />
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-button text-[10px] font-bold text-white">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )

  return (
    <div className="min-h-screen">
      {pageHeader}
      {showBanner && items.length > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <section
              className="relative mb-4 flex min-h-[220px] flex-col overflow-hidden rounded-2xl md:min-h-[300px]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {settingsLoading ? (
                <div className="relative z-10 min-h-[200px] animate-pulse rounded-2xl bg-surface">
                  <div className="mb-4 ml-6 mt-8 h-6 w-32 rounded bg-surface-hover" />
                  <div className="mb-2 ml-6 h-10 w-3/4 rounded bg-surface-hover" />
                  <div className="mb-4 ml-6 h-10 w-1/2 rounded bg-surface-hover" />
                  <div className="ml-6 h-4 w-2/3 rounded bg-surface-hover" />
                </div>
              ) : (
                <div className="relative flex-1">
                  {hasImage && (
                    <>
                      <img
                        src={resolveImageUrl(currentBanner.image!)}
                        alt=""
                        className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
                      />
                    </>
                  )}
                  {!hasImage && (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface to-surface" />
                  )}

                  <div className={`relative z-10 flex flex-col justify-center px-6 py-8 md:px-12 ${alignClass}`}>
                    {currentBanner.linkProductId && (
                      <span className="mb-3 inline-block text-[10px] font-semibold uppercase tracking-widest text-accent">
                        Destaque
                      </span>
                    )}
                    <div className={currentBanner.align === 'center' ? 'mx-auto' : 'max-w-xl'}>
                      <h2
                        className="cursor-pointer whitespace-pre-line text-xl font-bold leading-tight underline-offset-4 hover:underline md:text-5xl"
                        style={{ color: textColor }}
                        onClick={handleLinkedProductClick}
                      >
                        {currentBanner.title || 'A melhor opção\nda cidade'}
                      </h2>
                      <p className="mt-2 text-sm md:mt-4 md:text-lg" style={{ color: textColor, opacity: 0.8 }}>
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
                        onClick={() => goTo(safeIndex - 1)}
                        className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
                        aria-label="Banner anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => goTo(safeIndex + 1)}
                        className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
                        aria-label="Próximo banner"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {multi && (scrollStyle === 'dots' || scrollStyle === 'arrows') && (
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                      {items.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goTo(i)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === safeIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                          }`}
                          aria-label={`Ir para o banner ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute inset-x-0 bottom-4 z-20 px-4">
                <StoreStatusLine />
              </div>
            </section>
        </div>
      )}

      <HomeBoard />

      <div className="container mx-auto px-4 pb-10 pt-4">
        <div className="mb-6">
          {catLoading ? (
            <CategorySkeleton />
          ) : categories.length > 0 ? (
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  active={activeCategory === category.id}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          ) : null}
        </div>

        {prodLoading ? (
          <div className={gridClass}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className={gridClass}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-lg text-muted">Nenhum produto disponível nesta categoria</p>
          </div>
        )}
      </div>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                {sidebarLogo && !sidebarLogoFailed ? (
                  <img
                    src={resolveImageUrl(sidebarLogo)}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded object-contain"
                    onError={() => setSidebarLogoFailed(true)}
                  />
                ) : (
                  <UtensilsCrossed className="shrink-0 text-accent" size={20} />
                )}
                <span className="truncate text-base font-bold text-brand-white">
                  {store?.name || 'Cardápio'}
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-brand-white"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              <Link
                to={`${prefix}/cardapio`}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-white transition-colors hover:bg-surface-hover"
              >
                <UtensilsCrossed size={16} className="text-accent" />
                Cardápio
              </Link>
              <Link
                to={`${prefix}/meus-pedidos`}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-brand-white"
              >
                <ClipboardList size={16} />
                Meus Pedidos
              </Link>
              <Link
                to={`${prefix}/carrinho`}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-brand-white"
              >
                <ShoppingCart size={16} />
                Carrinho
              </Link>
            </nav>
          </aside>
        </>
      )}

      {showProductModal && linkedProduct && (
        <ProductModal product={linkedProduct} onClose={() => setShowProductModal(false)} />
      )}
      <OperatingHoursModal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        message={status.message}
      />
    </div>
  )
}
