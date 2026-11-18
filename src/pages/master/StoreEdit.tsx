import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { storesService } from '@/services'
import { Button, Input } from '@/components/ui'
import { ArrowLeft, Save } from 'lucide-react'
import type { Store } from '@/types'

export default function StoreEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', whatsapp: '', instagram: '' })

  useEffect(() => {
    if (!id) return
    storesService.getById(id).then((store) => {
      if (store) {
        setForm({
          name: store.name,
          slug: store.slug,
          whatsapp: store.whatsapp || '',
          instagram: store.instagram || '',
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await storesService.update(id, {
        name: form.name,
        slug: form.slug,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
      })
      navigate('/master')
    } catch (err) {
      alert('Erro ao salvar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
    setSaving(false)
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
        <div>
          <h1 className="text-lg font-bold text-brand-white md:text-xl">Editar loja</h1>
          <p className="text-xs text-muted">{form.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
        <div className="space-y-4">
          <Input label="Nome da loja" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="WhatsApp" placeholder="5511999999999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })} />
          <Input label="Instagram" placeholder="@seucliente" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link to="/master">
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button onClick={handleSave} loading={saving}>
            <Save size={14} />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}