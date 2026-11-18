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
            onClick={() => { setPwdOpen(true); setPwdMsg(null) }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-brand-white transition-colors"
            title="Alterar senha"
          >
            <Shield size={18} className="shrink-0" />
            {!collapsed && <span>Alterar senha</span>}
          </button>
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