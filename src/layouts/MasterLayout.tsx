import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, LogOut, ChevronLeft, ChevronRight, Shield, BarChart3, Menu, X } from 'lucide-react'
import { cn } from '@/utils'

const navItems = [
  { path: '/master', icon: BarChart3, label: 'Painel' },
  { path: '/master/lojas', icon: Building2, label: 'Lojas' },
]

export function MasterLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)

  const handleChangePassword = async () => {
    setPwdMsg(null)
    if (newPwd.length < 6) { setPwdMsg('A senha deve ter pelo menos 6 caracteres.'); return }
    if (newPwd !== confirmPwd) { setPwdMsg('As senhas não conferem.'); return }
    if (!user?.id) { setPwdMsg('Usuário não identificado.'); return }
    setPwdLoading(true)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.id, password: newPwd }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erro ao alterar senha')
      setPwdMsg('Senha alterada com sucesso!')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      setPwdMsg(err instanceof Error ? err.message : 'Erro ao alterar senha')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const isActive = (path: string) => {
    if (path === '/master') return location.pathname === '/master'
    return location.pathname.startsWith(path)
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="flex min-h-screen bg-brand-black">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={closeMobile} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-all duration-200',
          'md:static md:z-auto md:h-auto md:w-56 md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-56',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <Link
            to="/master"
            onClick={closeMobile}
            className="flex min-w-0 items-center gap-2 text-sm font-bold text-brand-white"
          >
            <Shield size={18} className="shrink-0 text-accent" />
            <span className={cn(collapsed && 'md:hidden')}>Master</span>
          </Link>
          <button
            onClick={closeMobile}
            aria-label="Fechar menu"
            className="text-muted transition-colors hover:text-brand-white md:hidden"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-brand-white md:flex"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-surface-hover hover:text-brand-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              <span className={cn('truncate', collapsed && 'md:hidden')}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <div className={cn('mb-2 px-1', collapsed && 'md:hidden')}>
            <p className="truncate text-xs text-muted">{user?.name}</p>
            <p className="truncate text-[10px] text-muted/60">Master</p>
          </div>
          <button
            onClick={() => { setPwdOpen(true); setPwdMsg(null); closeMobile() }}
            title="Alterar senha"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-brand-white"
          >
            <Shield size={18} className="shrink-0" />
            <span className={cn(collapsed && 'md:hidden')}>Alterar senha</span>
          </button>
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-brand-white"
          >
            <LogOut size={18} className="shrink-0" />
            <span className={cn(collapsed && 'md:hidden')}>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-white hover:bg-surface-hover"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-brand-white">Master</span>
          <span className="ml-auto truncate text-xs text-muted">{user?.name}</span>
        </header>

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPwdOpen(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-brand-white">Alterar senha</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-brand-white"
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirmar nova senha"
                className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-brand-white"
              />
            </div>
            {pwdMsg && (
              <p className={`mt-3 text-xs ${pwdMsg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPwdOpen(false)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-brand-white">
                Cancelar
              </button>
              <button onClick={handleChangePassword} disabled={pwdLoading} className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                {pwdLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
