import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Ticket, Pencil } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { Button, Input } from '@/components/ui'
import { couponsService } from '@/services'
import type { Coupon } from '@/types'

function toDate(value: Date | Timestamp | undefined): Date {
  if (!value) return new Date()
  if (value instanceof Timestamp) return value.toDate()
  return new Date(value)
}

interface FormState {
  code: string
  type: 'percentage' | 'fixed'
  value: string
  minOrder: string
  maxUses: string
  expiresAt: string
}

const emptyForm: FormState = { code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', expiresAt: '' }

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const data = await couponsService.getAll()
      setCoupons(data)
    } catch {
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: coupon.minOrder ? String(coupon.minOrder) : '',
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      expiresAt: toDate(coupon.expiresAt).toISOString().split('T')[0],
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.code.trim() || !form.value || !form.expiresAt) {
      setFormError('Preencha código, valor e data de expiração')
      return
    }
    try {
      const couponData: Record<string, unknown> = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        expiresAt: new Date(form.expiresAt),
      }
      if (form.minOrder) couponData.minOrder = Number(form.minOrder)
      if (form.maxUses) couponData.maxUses = Number(form.maxUses)

      if (editingId) {
        await couponsService.update(editingId, couponData as Partial<Coupon>)
        setCoupons((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...couponData } as Coupon : c)))
      } else {
        const created = await couponsService.create({ ...couponData, usedCount: 0, active: true } as unknown as Coupon)
        setCoupons((prev) => [...prev, created])
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar cupom')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    await couponsService.update(coupon.id, { active: !coupon.active } as Partial<Coupon>)
    setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)))
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este cupom?')) {
      await couponsService.delete(id)
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const displayed = coupons.filter((c) => !search || c.code.toLowerCase().includes(search.toLowerCase()))

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
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">Cupons</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{coupons.length} cupons cadastrados</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} />
          Novo Cupom
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4 md:p-6">
          <h2 className="mb-4 text-base font-semibold text-brand-white">{editingId ? 'Editar Cupom' : 'Criar Cupom'}</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Código" placeholder="Ex: PROMO10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-brand-white">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-brand-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <Input label="Valor" type="number" placeholder={form.type === 'percentage' ? 'Ex: 10' : 'Ex: 15.00'} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} min={0} step="0.01" />
              <Input label="Pedido mínimo (opcional)" type="number" placeholder="Ex: 30" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} min={0} step="0.01" />
              <Input label="Usos máximos (opcional)" type="number" placeholder="Ex: 100" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} min={1} />
              <Input label="Data de expiração" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave}>{editingId ? 'Salvar' : 'Criar Cupom'}</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setFormError('') }}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar por código..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-brand-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm md:text-base text-muted">Nenhum cupom encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((coupon) => (
            <div key={coupon.id} className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Ticket size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-white">{coupon.code}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {coupon.type === 'percentage' ? `${coupon.value}% de desconto` : `R$ ${coupon.value.toFixed(2)} de desconto`}
                        {coupon.minOrder ? ` | Mín: R$ ${coupon.minOrder.toFixed(2)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${coupon.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-[10px] text-muted">{coupon.usedCount}/{coupon.maxUses || '∞'} usos</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-muted">Expira em {toDate(coupon.expiresAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <button onClick={() => openEdit(coupon)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors" title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleToggleActive(coupon)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium text-muted hover:bg-surface-hover hover:text-brand-white transition-colors" title={coupon.active ? 'Desativar' : 'Ativar'}>
                  {coupon.active ? 'Desat.' : 'Ativar'}
                </button>
                <button onClick={() => handleDelete(coupon.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
