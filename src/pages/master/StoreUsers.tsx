import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/firebase/config'
import { storesService } from '@/services'
import { Button, Input } from '@/components/ui'
import { ArrowLeft, Plus, Trash2, Save, X, UserPlus, KeyRound, Copy, Check, CircleX } from 'lucide-react'
import type { Store } from '@/types'
import type { UserRole } from '@/config'

interface StoreUser {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'attendant', label: 'Atendente' },
  { value: 'kitchen', label: 'Cozinha' },
  { value: 'delivery', label: 'Entregador' },
]

export default function StoreUsers() {
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [users, setUsers] = useState<StoreUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showPassword, setShowPassword] = useState<string | null>(null)
  const [errorCard, setErrorCard] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'attendant' as UserRole })

  useEffect(() => {
    if (!id) return
    Promise.all([
      storesService.getById(id),
      getDocs(query(collection(db, 'users'), where('storeId', '==', id))),
    ]).then(([storeData, usersSnap]) => {
      if (storeData) setStore(storeData)
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as StoreUser)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return
    setCreating(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
      await setDoc(doc(db, 'users', result.user.uid), {
        storeId: id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setUsers((prev) => [...prev, { id: result.user.uid, name: newUser.name, email: newUser.email, role: newUser.role, active: true }])
      setShowCreate(false)
      setNewUser({ name: '', email: '', password: '', role: 'attendant' })
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/email-already-in-use') {
        alert('Este email já está em uso')
      } else {
        alert('Erro: ' + (error.message || 'Desconhecido'))
      }
    }
    setCreating(false)
  }

  const removeUser = async (userId: string) => {
    if (!window.confirm('Remover este usuário?')) return
    await deleteDoc(doc(db, 'users', userId))
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const resetPassword = async (userId: string) => {
    if (!window.confirm('Redefinir senha deste usuário? Uma nova senha será gerada.')) return
    setResetting(true)
    setShowPassword(null)
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha')
      setShowPassword(data.password)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setErrorCard(error.message || 'Erro desconhecido')
      setTimeout(() => setErrorCard(null), 6000)
    }
    setResetting(false)
  }

  const copyPassword = async () => {
    if (showPassword) {
      await navigator.clipboard.writeText(showPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleUserActive = async (userId: string, current: boolean) => {
    await setDoc(doc(db, 'users', userId), { active: !current }, { merge: true })
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, active: !current } : u))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/master" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-brand-white md:text-xl">Usuários</h1>
          <p className="text-xs text-muted">{store?.name}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus size={14} />
          Novo usuário
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-accent/30 bg-surface p-4 md:p-6">
          <h3 className="mb-4 text-sm font-semibold text-brand-white">Novo usuário</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Nome" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nome completo" />
            <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@exemplo.com" />
            <Input label="Senha" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-white">Função</label>
              <select
                value={newUser.role as string}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-brand-white"
              >
                {roleOptions.map((r) => (
                  <option key={r.value as string} value={r.value as string}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
              <X size={14} />
              Cancelar
            </Button>
            <Button size="sm" onClick={createUser} loading={creating}>
              <UserPlus size={14} />
              Criar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Função</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    Nenhum usuário cadastrado nesta loja
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-white">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{roleOptions.find((r) => r.value === u.role)?.label || u.role as string}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleUserActive(u.id, u.active)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        u.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => resetPassword(u.id)}
                        disabled={resetting}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-accent/10 hover:text-accent transition-colors disabled:opacity-50"
                        title="Redefinir senha"
                      >
                        <KeyRound size={12} />
                        Redefinir senha
                      </button>
                      <button
                        onClick={() => removeUser(u.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setErrorCard(null)}>
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
              <CircleX size={16} />
              Erro ao redefinir senha
            </div>
            <p className="mb-4 text-sm text-muted">{errorCard}</p>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setErrorCard(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowPassword(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-white">
              <KeyRound size={16} className="text-accent" />
              Senha redefinida
            </div>
            <p className="mb-4 text-xs text-muted">Copie a senha abaixo e envie ao usuário.</p>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-4 py-3">
              <code className="flex-1 text-center text-lg font-bold tracking-wider text-accent">{showPassword}</code>
              <button
                onClick={copyPassword}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-brand-white transition-colors"
                title="Copiar"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowPassword(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}