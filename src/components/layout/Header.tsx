import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Menu, X, UtensilsCrossed, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useCustomer } from '@/contexts/CustomerContext'
import { useStore } from '@/contexts/StoreContext'
import { useSettings } from '@/hooks'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { cn } from '@/utils'
import { CustomerLoginModal } from '@/components/shared/CustomerLoginModal'

function useStoreSlug(): string | null {
  try {
    return useParams<{ slug: string }>().slug || null
  } catch {
    return null
  }
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { state } = useCart()
  const { customer, isLoggedIn, logout } = useCustomer()
  const { store } = useStore()
  const { settings } = useSettings()
  const slug = useStoreSlug()

  const prefix = slug ? `/${slug}` : ''
  const storeName = store?.name || 'MeuCardapio'
  const logoUrl = settings?.theme?.logo || store?.logo
  const navLinks = slug
    ? [
        { to: `${prefix}/`, label: 'Início' },
        { to: `${prefix}/cardapio`, label: 'Cardápio' },
      ]
    : []

  const itemCount = state.items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <>
      <header className="sticky top-0 z-50 bg-brand-black">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to={prefix || '/'} className="flex items-center gap-2 text-xl font-bold text-brand-white">
            {logoUrl ? (
              <img
                src={resolveImageUrl(logoUrl)}
                alt={storeName}
                className="h-8 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <UtensilsCrossed className="text-accent" size={24} />
            )}
            <span>{storeName}</span>
          </Link>

          {navLinks.length > 0 && (
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted transition-colors hover:text-brand-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            {isLoggedIn ? (
              <Link
                to={`${prefix}/meus-pedidos`}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-brand-white md:flex"
              >
                <User size={14} />
                {customer?.name}
              </Link>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-brand-white md:flex"
              >
                <User size={14} />
                Entrar
              </button>
            )}

            {slug && (
              <Link
                to={`${prefix}/carrinho`}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-brand-white"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-button text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-brand-white md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {navLinks.length > 0 && (
          <div
            className={cn(
              'overflow-hidden border-t border-border transition-all duration-300 md:hidden',
              mobileOpen ? 'max-h-80' : 'max-h-0'
            )}
          >
            <nav className="flex flex-col gap-1 px-4 pb-4 pt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    to={`${prefix}/meus-pedidos`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-brand-white"
                  >
                    <User size={14} />
                    Meus Pedidos
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowLogin(true); setMobileOpen(false) }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-brand-white"
                >
                  <User size={14} />
                  Entrar
                </button>
              )}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-brand-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
