import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { ImageUpload } from '@/components/shared'
import { productsService, categoriesService } from '@/services'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import type { Product, Category, ProductIngredient } from '@/types'

interface IngredientForm {
  id: string
  name: string
  removable: boolean
  extraPrice: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  discountPrice: string
  categoryId: string
  image: string
  order: string
  active: boolean
  ingredients: IngredientForm[]
  customizable: boolean
}

const EMPTY_INGREDIENT: IngredientForm = { id: '', name: '', removable: true, extraPrice: '0' }

export default function ProductForm() {
  const navigate = useNavigate()
  const { id, slug } = useParams()
  const prefix = slug ? `/${slug}/admin` : '/admin'
  const isEditing = !!id
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    categoryId: '',
    image: '',
    order: '',
    active: true,
    ingredients: [EMPTY_INGREDIENT],
    customizable: false,
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
            ingredients: (product.ingredients ?? []).map((ing) => ({
              id: ing.ingredientId,
              name: ing.name,
              removable: ing.removable,
              extraPrice: String(ing.extraPrice),
            })) || [EMPTY_INGREDIENT],
            customizable: product.customizable ?? false,
          })
        }
      }).catch(() => {})
    }
  }, [id])

  const addIngredient = () => {
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, { ...EMPTY_INGREDIENT, id: Date.now().toString() }] }))
  }

  const removeIngredient = (index: number) => {
    if (form.ingredients.length <= 1) return
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }))
  }

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

    const cleanIngredients: ProductIngredient[] = form.ingredients
      .filter((ing) => ing.name.trim())
      .map((ing) => ({
        ingredientId: ing.id || Date.now().toString(),
        name: ing.name,
        removable: ing.removable,
        extraPrice: Number(ing.extraPrice) || 0,
      }))

    const data: Partial<Product> = {
      name: form.name,
      description: form.description,
      slug: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      categoryId: form.categoryId,
      image: form.image || '',
      order: newOrder || 0,
      active: form.active,
      sizes: [],
      ingredients: cleanIngredients,
      customizable: form.customizable,
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
        <button onClick={() => navigate(`${prefix}/produtos`)} className="text-muted hover:text-brand-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-white">{isEditing ? 'Editar' : 'Novo'} Produto</h1>
          <p className="text-sm text-muted">{isEditing ? 'Altere os dados do produto' : 'Adicione um novo item ao cardápio'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <Input label="Nome do produto" placeholder="Ex: Hambúrguer Clássico" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <ImageUpload value={form.image} onChange={(v) => setForm({ ...form, image: v })} label="Imagem do produto" />
        <Input label="URL da Imagem (alternativa)" placeholder="Ou cole um link" value={form.image.startsWith('data:') ? '' : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Preço" type="number" step="0.01" placeholder="39.90" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Preço promocional" type="number" step="0.01" placeholder="29.90" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-white">Descrição</label>
          <textarea className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-brand-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" rows={3} placeholder="Descrição do produto" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-white">Categoria</label>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-brand-white transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
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
            <label className="mb-1.5 block text-sm font-medium text-brand-white">Sabores / Ingredientes</label>
          </div>
        </div>

        {/* Sabores / Ingredientes (para sucos) */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-brand-white">
              Sabores / Ingredientes (ex: Morango, Abacaxi, Uva)
            </h3>
            <button type="button" onClick={addIngredient} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
              <Plus size={14} /> Adicionar sabor
            </button>
          </div>
          <p className="text-xs text-muted mb-3">Lista de sabores disponíveis para sucos.</p>
          <div className="space-y-2">
            {form.ingredients.map((ing, index) => (
              <div key={ing.id} className="flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-surface-hover p-3">
                <div className="flex-1 min-w-0">
                  <label className="mb-1 block text-[10px] uppercase text-muted">Nome do sabor</label>
                  <input
                    value={ing.name}
                    onChange={(e) => setForm({ ...form, ingredients: form.ingredients.map((i, i2) => i2 === index ? { ...i, name: e.target.value } : i) })}
                    className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs text-brand-white focus:border-accent focus:outline-none"
                    placeholder="Ex: Morango"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="mb-1 block text-[10px] uppercase text-muted">Preço extra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ing.extraPrice}
                    onChange={(e) => setForm({ ...form, ingredients: form.ingredients.map((i, i2) => i2 === index ? { ...i, extraPrice: e.target.value } : i) })}
                    className="w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs text-brand-white focus:border-accent focus:outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-brand-white">
                    <input
                      type="checkbox"
                      checked={ing.removable}
                      onChange={(e) => setForm({ ...form, ingredients: form.ingredients.map((i, i2) => i2 === index ? { ...i, removable: e.target.checked } : i) })}
                      className="h-3 w-3 rounded border-border bg-surface text-accent focus:ring-accent"
                    />
                    Removível
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-brand-white">Produto personalizável</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-brand-white">Ativo</span>
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
