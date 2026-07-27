import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Copy, Search, Percent, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui'
import { productsService, categoriesService } from '@/services'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { useToast } from '@/contexts/ToastContext'
import type { Product, Category } from '@/types'
import { formatCurrency } from '@/utils'

export default function Products() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const prefix = slug ? `/${slug}/admin` : '/admin'
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [cloneConfirm, setCloneConfirm] = useState<Product | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkType, setBulkType] = useState<'percent' | 'fixed' | 'clear'>('percent')
  const [bulkDirection, setBulkDirection] = useState<'increase' | 'decrease'>('increase')
  const [bulkValue, setBulkValue] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productsService.getActiveProducts(),
        categoriesService.getAllOrdered(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      await productsService.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const confirmClone = async () => {
    if (!cloneConfirm) return
    const product = cloneConfirm
    try {
      const cloned = await productsService.create({
        name: `${product.name} (cópia)`,
        slug: `${product.slug}-copia-${Date.now()}`,
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        discountPrice: product.discountPrice,
        image: product.image,
        order: products.length + 1,
        active: false,
        featured: false,
        hasCrust: product.hasCrust ?? false,
        customizable: product.customizable,
      })
      setCloneConfirm(null)
      showToast('Produto clonado! Editando a cópia...')
      navigate(`${prefix}/produtos/${cloned.id}/editar`)
    } catch {
      showToast('Erro ao clonar produto')
      setCloneConfirm(null)
    }
  }

  const base = filterCat === 'all'
    ? [...products].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    : [...products].filter((p) => p.categoryId === filterCat).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  const displayed = base.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const bulkTargets = filterCat === 'all' ? products : products.filter((p) => p.categoryId === filterCat)

  const computeNewPrice = (product: Product): number | null => {
    if (bulkType === 'clear') return 0
    const val = parseFloat(bulkValue)
    if (isNaN(val) || val <= 0) return null
    const basePrice = product.price
    let newPrice: number
    if (bulkType === 'percent') {
      newPrice = bulkDirection === 'increase'
        ? basePrice * (1 + val / 100)
        : basePrice * (1 - val / 100)
    } else {
      newPrice = bulkDirection === 'increase'
        ? basePrice + val
        : basePrice - val
    }
    return Math.max(0.01, Math.round(newPrice * 100) / 100)
  }

  const bulkPreview = bulkTargets.map((p) => ({
    product: p,
    oldDiscount: p.discountPrice ?? 0,
    newDiscount: computeNewPrice(p),
  })).filter((item) => item.newDiscount !== null)

  const handleBulkConfirm = () => {
    if (bulkType === 'clear') {
      setShowBulkModal(false)
      setShowBulkConfirm(true)
    } else {
      const val = parseFloat(bulkValue)
      if (isNaN(val) || val <= 0) return
      setShowBulkModal(false)
      setShowBulkConfirm(true)
    }
  }

  const applyBulk = async () => {
    setBulkApplying(true)
    try {
      for (const item of bulkPreview) {
        if (item.newDiscount === null) continue
        await productsService.update(item.product.id, { discountPrice: item.newDiscount } as Partial<Product>)
      }
      showToast(`${bulkTargets.length} produtos atualizados!`)
      setShowBulkConfirm(false)
      setBulkValue('')
      load()
    } catch {
      showToast('Erro ao ajustar preços')
    } finally {
      setBulkApplying(false)
    }
  }

  const getCategoryName = (catId: string) => categories.find((c) => c.id === catId)?.name || catId

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
          <h1 className="text-xl md:text-2xl font-bold text-brand-white">Produtos</h1>
          <p className="text-xs md:text-sm text-muted mt-0.5">{products.length} produtos cadastrados</p>
        </div>
        <Link to={`${prefix}/produtos/novo`}>
          <Button>
            <Plus size={16} />
            Novo Produto
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-brand-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setFilterCat('all')} className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-brand-white border border-border'}`}>
            Todas
          </button>
          {categories.filter((c) => c.active).map((cat) => (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${filterCat === cat.id ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-brand-white border border-border'}`}>
              {cat.name}
            </button>
          ))}
          <button onClick={() => setShowBulkModal(true)} className="ml-auto rounded-full bg-yellow-500/10 px-3.5 py-2 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5">
            <DollarSign size={13} />
            Ajustar Preços
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-4">
          <p className="text-sm md:text-base text-muted">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((product) => (
            <div key={product.id} className="rounded-xl border border-border bg-surface p-3.5 md:p-4">
              <div className="flex items-start gap-3">
                {product.image && (
                  <img src={resolveImageUrl(product.image)} alt="" className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-white truncate">{product.name}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{getCategoryName(product.categoryId)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${product.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm">
                    <span className="text-brand-white font-medium">{formatCurrency((product.discountPrice ?? 0) > 0 ? (product.discountPrice as number) : product.price)}</span>
                    {(product.discountPrice ?? 0) > 0 && <span className="ml-1.5 text-xs text-muted line-through">{formatCurrency(product.price)}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <button onClick={() => navigate(`${prefix}/produtos/${product.id}/editar`)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors" title="Editar">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setCloneConfirm(product)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-brand-white transition-colors" title="Clonar">
                  <Copy size={15} />
                </button>
                <button onClick={() => handleDelete(product.id, product.name)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Excluir">
                  <Trash2 size={15} />
                </button>
                <span className="ml-auto text-[10px] text-muted">Ordem: {product.order || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {cloneConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCloneConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Copy size={28} className="text-accent" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-base font-semibold text-brand-white">Clonar produto?</h3>
            <div className="mb-4 rounded-lg bg-surface-hover p-3 text-center">
              <p className="text-sm font-medium text-brand-white">{cloneConfirm.name}</p>
              <p className="text-lg font-bold text-accent mt-1">{formatCurrency((cloneConfirm.discountPrice ?? 0) > 0 ? (cloneConfirm.discountPrice as number) : cloneConfirm.price)}</p>
            </div>
            <p className="mb-4 text-center text-sm text-muted">Uma cópia será criada e você será redirecionado para editá-la.</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-sm h-10" onClick={() => setCloneConfirm(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 text-sm h-10" onClick={confirmClone}>
                <Copy size={15} />
                Clonar
              </Button>
            </div>
          </div>
        </div>
      )}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBulkModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-brand-white">Ajustar Preços</h3>
            <p className="text-xs text-muted mb-4">
              {filterCat === 'all'
                ? `Todos os ${bulkTargets.length} produtos — preço promocional`
                : `${bulkTargets.length} produtos em "${categories.find((c) => c.id === filterCat)?.name || ''}" — preço promocional`}
            </p>

            <div className="flex gap-2 mb-3">
              <button onClick={() => setBulkType('percent')} className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors ${bulkType === 'percent' ? 'bg-accent text-white' : 'bg-surface-hover text-muted border border-border hover:text-brand-white'}`}>
                <Percent size={14} /> Percentual
              </button>
              <button onClick={() => setBulkType('fixed')} className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors ${bulkType === 'fixed' ? 'bg-accent text-white' : 'bg-surface-hover text-muted border border-border hover:text-brand-white'}`}>
                <DollarSign size={14} /> Valor Fixo
              </button>
              <button onClick={() => setBulkType('clear')} className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors ${bulkType === 'clear' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-surface-hover text-muted border border-border hover:text-brand-white'}`}>
                Limpar
              </button>
            </div>

            {bulkType !== 'clear' && (
              <>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setBulkDirection('increase')} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${bulkDirection === 'increase' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-surface-hover text-muted border border-border hover:text-brand-white'}`}>
                    Aumentar
                  </button>
                  <button onClick={() => setBulkDirection('decrease')} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${bulkDirection === 'decrease' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-surface-hover text-muted border border-border hover:text-brand-white'}`}>
                    Reduzir
                  </button>
                </div>

                <div className="relative mb-4">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{bulkType === 'percent' ? '%' : 'R$'}</span>
                  <input
                    type="number"
                    min="0"
                    step={bulkType === 'percent' ? '1' : '0.50'}
                    placeholder={bulkType === 'percent' ? 'Ex: 10' : 'Ex: 5.00'}
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-hover pl-8 pr-3 py-2.5 text-sm text-brand-white placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </>
            )}

            {bulkType === 'clear' && (
              <p className="mb-4 text-xs text-muted text-center rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                Remove o preço promocional de {bulkTargets.length} produtos, retornando ao preço original.
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-sm h-10" onClick={() => setShowBulkModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 text-sm h-10"
                disabled={bulkType !== 'clear' && (!bulkValue || parseFloat(bulkValue) <= 0)}
                onClick={handleBulkConfirm}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBulkConfirm(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 md:p-6 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold text-brand-white">Confirmar Alteração</h3>
            <p className="text-xs text-muted mb-3">
              {bulkType === 'clear'
                ? `Removendo promoção de ${bulkPreview.length} produtos`
                : `${bulkDirection === 'increase' ? 'Aumento' : 'Redução'} de ${bulkType === 'percent' ? `${bulkValue}%` : formatCurrency(parseFloat(bulkValue))} no preço promocional`}
            </p>

            <div className="flex-1 overflow-y-auto rounded-lg border border-border mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-hover">
                    <th className="px-3 py-2 text-left text-muted font-medium">Produto</th>
                    <th className="px-3 py-2 text-right text-muted font-medium">Atual</th>
                    <th className="px-3 py-2 text-center text-muted font-medium w-8"></th>
                    <th className="px-3 py-2 text-right text-muted font-medium">Novo</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.map((item) => (
                    <tr key={item.product.id} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-brand-white truncate max-w-[180px]">{item.product.name}</td>
                      <td className="px-3 py-2 text-right text-muted">
                        {item.oldDiscount > 0 ? formatCurrency(item.oldDiscount) : formatCurrency(item.product.price)}
                      </td>
                      <td className="px-3 py-2 text-center text-muted">→</td>
                      <td className="px-3 py-2 text-right text-accent font-medium">
                        {bulkType === 'clear' ? formatCurrency(item.product.price) : formatCurrency(item.newDiscount!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-sm h-10" onClick={() => setShowBulkConfirm(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 text-sm h-10"
                disabled={bulkApplying}
                onClick={applyBulk}
                loading={bulkApplying}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
