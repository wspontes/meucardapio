import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, User as UserIcon } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { usersService } from '@/services'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { User } from '@/types'
import { userRoles } from '@/config'

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'attendant' as User['role'] })
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const data = await usersService.getAll()
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Preencha todos os campos')
      return
    }
    if (form.password.length < 6) {
      setFormError('Senha deve ter no mínimo 6 caracteres')
      return
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await setDoc(doc(db, 'users', result.user.uid), {
        name: form.name,
        email: form.email,
        role: form.role,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setForm({ name: '', email: '', password: '', role: 'attendant' })
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    }
  }

  const handleToggleActive = async (user: User) => {
    await usersService.update(user.id, { active: !user.active } as Partial<User>)
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)))
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      await usersService.delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const displayed = users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">Usuários</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{users.length} usuários cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-4 text-base font-semibold text-brand-white">Criar Novo Usuário</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nome" placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" placeholder="email@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-brand-white">Função</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-brand-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                  {Object.entries(userRoles).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Criar Usuário</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setFormError('') }}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-brand-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm md:text-base text-muted">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((u) => (
            <div key={u.id} className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-white truncate">{u.name}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${u.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent font-medium">
                        {userRoles[u.role] || u.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <button onClick={() => handleToggleActive(u)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors" title={u.active ? 'Desativar' : 'Ativar'}>
                  <Pencil size={15} />
                </button>
                {u.email !== 'admin@pizzasmania.com.br' && (
                  <button onClick={() => handleDelete(u.id, u.name)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                    <Trash2 size={15} />
                  </button>
                )}
                <span className="ml-auto text-[10px] text-muted">Criado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
