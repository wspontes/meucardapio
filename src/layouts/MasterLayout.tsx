import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Store, Building2, LogOut, ChevronLeft, ChevronRight, Users, ExternalLink, Shield, BarChart3 } from 'lucide-react'

const navItems = [
  { path: '/master', icon: BarChart3, label: 'Painel' },
  { path: '/master/lojas', icon: Building2, label: 'Lojas' },
]

export function MasterLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const isActive = (path: string) => {
    if (path === '/master') return location.pathname === '/master'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex min-h-screen bg-brand-black">
      <aside className={`flex flex-col border-r border-border bg-surface transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          {!collapsed && (
            <Link to="/master" className="flex items-center gap-2 text-sm font-bold text-brand-white">
              <Shield size={18} className="text-accent" />
              Master
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-surface-hover hover:text-brand-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          {!collapsed && (
            <div className="mb-2 px-1">
              <p className="truncate text-xs text-muted">{user?.name}</p>
              <p className="truncate text-[10px] text-muted/60">Master</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-brand-white transition-colors"
            title="Sair"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}