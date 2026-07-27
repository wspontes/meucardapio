import { Menu, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'
import { userRoles } from '@/config'

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth()
  const roleLabel = user?.role ? userRoles[user.role] || user.role : 'Admin'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-white lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
          <p className="text-xs text-muted">{roleLabel}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent">
          <User size={18} />
        </div>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  )
}
