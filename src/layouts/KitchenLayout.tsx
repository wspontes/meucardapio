import { Outlet, Link, useParams } from 'react-router-dom'
import { UtensilsCrossed, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export function KitchenLayout() {
  const { user, logout } = useAuth()
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="flex min-h-screen flex-col bg-brand-black">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to={`/${slug}/cozinha`} className="flex items-center gap-2 font-bold text-brand-white">
            <UtensilsCrossed className="text-accent" size={20} />
            Cozinha
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{user?.name || 'Cozinha'}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
