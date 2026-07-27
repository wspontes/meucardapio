import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ImageUpload } from '@/components/shared'
import { productsService, categoriesService } from '@/services'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import type { Product, Category } from '@/types'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id, slug } = useParams()
  const prefix = slug ? `/${slug}/admin` : '/admin'
  const isEditing = !!id
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    categoryId: '',
    image: '',
    order: '',
    active: true,
    featured: false,
    section: '' as '' | 'featured' | 'new' | 'promotion',
    hasCrust: false,
  })

  useEffect(() => {
    categoriesService.getActiveCategories().then(setCategories).catch(() => {})
    if (id) {
      productsService.getById(id).then((product) => {
        if (product) {
          setForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            discountPrice: product.discountPrice ? String(product.discountPrice) : '',
            categoryId: product.categoryId,
            image: product.image || '',
            order: product.order ? String(product.order) : '',
            active: product.active,
            featured: product.featured ?? false,
            section: product.section ?? '',
            hasCrust: product.hasCrust ?? false,
          })
        }
      }).catch(() => {})
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const newOrder = form.order ? Number(form.order) : undefined

    if (newOrder && newOrder > 0) {
      const all = await productsService.getActiveProducts()
      const siblings = all.filter((p) => p.categoryId === form.categoryId && p.id !== id)
      const conflict = siblings.find((p) => p.order === newOrder)
      if (conflict) {
        const toUpdate = siblings
          .filter((p) => p.order && p.order >= newOrder)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        for (const p of toUpdate) {
          await productsService.update(p.id, { order: (p.order ?? 0) + 1 } as Partial<Product>)
        }
      }
    }

    const data = {
      name: form.name,
      description: form.description,
      slug: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      categoryId: form.categoryId,
      image: form.image || '',
      order: newOrder || 0,
      active: form.active,
      featured: form.featured,
      section: form.section || undefined,
      hasCrust: form.hasCrust,
    }

    try {
      if (isEditing && id) {
        await productsService.update(id, data)
      } else {
        await productsService.create(data)
      }
      navigate(`${prefix}/produtos`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate(`${prefix}/produtos`)} className="text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEditing ? 'Editar' : 'Novo'} Produto</h1>
          <p className="text-sm text-muted">{isEditing ? 'Altere os dados do produto' : 'Adicione um novo item ao cardápio'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <Input label="Nome do produto" placeholder="Ex: Pizza Margherita" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <ImageUpload value={form.image} onChange={(v) => setForm({ ...form, image: v })} label="Imagem do produto" />
        <Input label="URL da Imagem (alternativa)" placeholder="Ou cole um link" value={form.image.startsWith('data:') ? '' : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Preço" type="number" step="0.01" placeholder="39.90" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Preço promocional" type="number" step="0.01" placeholder="29.90" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white">Descrição</label>
          <textarea className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" rows={3} placeholder="Descrição do produto" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Categoria</label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Selecione</option>
              {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
          <div>
            <Input label="Ordem na categoria" type="number" min="1" placeholder="Auto" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            <p className="mt-1 text-xs text-muted">Posição de exibição no cardápio</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white">Seção na Home</label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as typeof form.section })}>
              <option value="">Nenhuma</option>
              <option value="featured">Mais Pedidos</option>
              <option value="new">Novidades</option>
              <option value="promotion">Promoções</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-white">Ativo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-white">Destaque (Home)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasCrust} onChange={(e) => setForm({ ...form, hasCrust: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-white">Opção de borda</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(`${prefix}/produtos`)}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
