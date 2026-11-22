import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Bike, Plus, Trash2, Phone, ExternalLink } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { motoboysService } from '@/services'
import { db } from '@/firebase/config'
import { useToast } from '@/contexts/ToastContext'
import { useStoreGuard } from '@/components/shared/StoreGuard'
import type { Motoboy } from '@/types'

export default function MotoboysAdmin() {
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { store } = useStoreGuard()
  const [motoboys, setMotoboys] = useState<Motoboy[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Motoboy>>({ name: '', phone: '', active: true })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const loadMotoboys = async () => {
    setLoading(true)
    try {
      const { getDocs, collection } = await import('firebase/firestore')
      const snap = await getDocs(collection(db, 'motoboys'))
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Motoboy))
      // migração: motoboys sem storeId são atribuídos à loja atual
      const migrated = await Promise.all(all.map(async (m) => {
        if (!m.storeId && store?.id) {
          try {
            await motoboysService.update(m.id, { storeId: store.id })
            m.storeId = store.id
          } catch { /* ignore */ }
        }
        return m
      }))
      const scoped = store?.id ? migrated.filter((m) => m.storeId === store.id) : migrated
      setMotoboys(scoped.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    } catch { setMotoboys([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    loadMotoboys()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await motoboysService.update(editingId, {
          name: form.name,
          phone: form.phone,
          active: form.active ?? true,
          storeId: store?.id,
        })
      } else {
        await motoboysService.create({
          name: form.name || '',
          phone: form.phone || '',
          active: form.active ?? true,
          createdAt: new Date().toISOString(),
        })
      }
      setFormMode('list')
      setEditingId(null)
      setForm({ name: '', phone: '', active: true })
      await loadMotoboys()
      showToast('Motoboy salvo com sucesso!')
    } catch {
      showToast('Erro ao salvar motoboy')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este motoboy?')) return
    try {
      await motoboysService.delete(id)
      await loadMotoboys()
      showToast('Motoboy excluído')
    } catch {
      showToast('Erro ao excluir motoboy')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => setFormMode('list')} className="text-muted hover:text-brand-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">
            {formMode === 'list' ? 'Motoboys' : editingId ? 'Editar Motoboy' : 'Novo Motoboy'}
          </h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">
            {formMode === 'list' ? 'Gerencie os entregadores da sua loja' : 'Preencha os dados do motoboy'}
          </p>
        </div>
        {formMode === 'list' && (
          <div className="flex items-center gap-2">
            <a href={`${prefix}/motoboy`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink size={16} /> Tela do Motoboy
              </Button>
            </a>
            <Button onClick={() => { setFormMode('create'); setForm({ name: '', phone: '', active: true }) }}>
              <Plus size={16} /> Novo Motoboy
            </Button>
          </div>
        )}
      </div>

      {formMode === 'list' && (
        <div className="space-y-3">
          {motoboys.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
              <p className="text-muted">Nenhum motoboy cadastrado</p>
            </div>
          ) : (
            motoboys.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Bike size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-white truncate">{m.name}</p>
                      <p className="text-xs text-muted truncate flex items-center gap-1">
                        <Phone size={12} /> {m.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {m.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => { setForm({ name: m.name, phone: m.phone, active: m.active }); setEditingId(m.id); setFormMode('edit') }} className="text-accent hover:text-accent/80 transition-colors text-xs">Editar</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs">Excluir</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(formMode === 'create' || formMode === 'edit') && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-surface p-6 max-w-md">
          <div className="space-y-4">
            <Input label="Nome do motoboy" placeholder="Ex: João Silva" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Telefone (WhatsApp)" placeholder="11999999999" type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} required />
            <div className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
              <span className="text-sm text-brand-white">Motoboy ativo</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="submit" loading={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setFormMode('list'); setEditingId(null); setForm({ name: '', phone: '', active: true }) }}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}
