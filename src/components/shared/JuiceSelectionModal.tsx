import { useState } from 'react'
import { X, Droplets, Wine, CheckCircle, ArrowLeft } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { useBusinessStatus } from '@/hooks'
import { formatCurrency } from '@/utils'
import { resolveImageUrl } from '@/utils/resolveImageUrl'
import { Button } from '@/components/ui'
import { OperatingHoursModal } from './OperatingHoursModal'
import type { Product } from '@/types'

interface JuiceSelectionModalProps {
  product: Product
  onClose: () => void
}

type BaseType = 'agua' | 'leite'

const BASE_OPTIONS: { id: BaseType; label: string; icon: React.ReactNode }[] = [
  { id: 'agua', label: 'Água', icon: <Droplets size={20} className="text-accent" /> },
  { id: 'leite', label: 'Leite', icon: <Wine size={20} className="text-muted" /> },
]

export function JuiceSelectionModal({ product, onClose }: JuiceSelectionModalProps) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { status } = useBusinessStatus()
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [step, setStep] = useState<'sabores' | 'base' | 'confirmar'>('sabores')
  const [selectedBase, setSelectedBase] = useState<BaseType>('agua')
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])

  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price
  const ingredients = product.ingredients ?? []

  const totalPrice = price
  const hasFlavors = ingredients.length > 0
  // Produto sem sabores cadastrados ainda pode ser adicionado diretamente.
  const canAdd = hasFlavors ? selectedFlavors.length > 0 : true

  const toggleFlavor = (ingredientId: string) => {
    setSelectedFlavors((prev) => {
      if (prev.includes(ingredientId)) {
        return prev.filter((id) => id !== ingredientId)
      }
      return [...prev, ingredientId]
    })
  }

  const isFlavorSelected = (ingredientId: string) => selectedFlavors.includes(ingredientId)

  const handleAddToCart = () => {
    if (!status.isOpen) {
      setShowHoursModal(true)
      return
    }
    if (!canAdd) return

    const flavorNames = selectedFlavors.map(
      (id) => ingredients.find((i) => i.ingredientId === id)?.name ?? id
    )

    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: totalPrice,
      flavors: flavorNames,
      notes: `Base: ${selectedBase === 'agua' ? 'Água' : 'Leite'} | Sabores: ${flavorNames.length > 0 ? flavorNames.join(', ') : 'Natural'}`,
    })
    showToast('Adicionado ao carrinho!')
    onClose()
  }

  const goBack = () => setStep((prev) => (prev === 'base' ? 'sabores' : 'confirmar'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X size={18} />
        </button>

        {product.image ? (
          <img
            src={resolveImageUrl(product.image)}
            alt={product.name}
            className="w-full max-h-[320px] object-contain bg-surface-hover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-surface-hover">
            <Wine size={48} className="text-muted" />
          </div>
        )}

        <div className="p-5">
          <h2 className="text-lg font-bold text-brand-white">{product.name}</h2>
          <p className="mt-2 text-sm text-muted leading-relaxed">{product.description}</p>

          {step === 'sabores' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-brand-white">
                  Escolha os sabores
                </p>
                <span className="text-xs text-muted">
                  {selectedFlavors.length} selecionado{selectedFlavors.length > 1 ? 's' : ''}
                </span>
              </div>

              {!hasFlavors && (
                <p className="rounded-lg border border-border bg-surface-hover p-3 text-xs text-muted">
                  Nenhum sabor cadastrado para este produto. Você pode adicioná-lo diretamente.
                </p>
              )}

              <div className="grid gap-2">
                {ingredients.map((ingredient) => {
                  const isSelected = isFlavorSelected(ingredient.ingredientId)
                  return (
                    <button
                      key={ingredient.ingredientId}
                      type="button"
                      onClick={() => toggleFlavor(ingredient.ingredientId)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-surface-hover text-muted hover:text-brand-white hover:border-accent'
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full border shrink-0 ${
                          isSelected ? 'bg-accent text-white' : 'bg-transparent'
                        } flex items-center justify-center`}
                      >
                        {isSelected && <CheckCircle size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">{ingredient.name}</span>
                      {(ingredient.extraPrice ?? 0) > 0 && (
                        <span className="text-xs text-accent ml-auto">
                          +{formatCurrency(ingredient.extraPrice)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    if (!canAdd) return
                    setStep('base')
                  }}
                  disabled={!canAdd}
                  className="w-40"
                >
                  Próximo <ArrowLeft size={16} className="ml-1 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {step === 'base' && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium text-brand-white">
                Escolha a base
              </p>
              <div className="grid gap-2">
                {BASE_OPTIONS.map((base) => {
                  const isSelected = selectedBase === base.id
                  return (
                    <button
                      key={base.id}
                      type="button"
                      onClick={() => setSelectedBase(base.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-surface-hover text-muted hover:text-brand-white'
                      }`}
                    >
                      {base.icon}
                      <span className="text-sm font-medium">{base.label}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep('sabores')} className="w-40">
                  <ArrowLeft size={16} className="mr-1" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep('confirmar')}
                  className="w-40"
                >
                  Próximo <ArrowLeft size={16} className="ml-1 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {step === 'confirmar' && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium text-brand-white">Resumo</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Base</span>
                  <span className="text-brand-white font-medium">
                    {selectedBase === 'agua' ? 'Água' : 'Leite'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Sabores</span>
                  <span className="text-brand-white font-medium truncate">
                    {selectedFlavors.length > 0
                      ? selectedFlavors
                          .map((id) => ingredients.find((i) => i.ingredientId === id)?.name ?? id)
                          .join(', ')
                      : 'Natural'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-border/50">
                  <span className="text-muted">Total</span>
                  <span className="text-accent">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep('base')} className="w-40">
                  <ArrowLeft size={16} className="mr-1" /> Editar
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="w-40"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between px-5 pb-4">
          <span className="text-xl font-bold text-accent">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
      <OperatingHoursModal isOpen={showHoursModal} onClose={() => setShowHoursModal(false)} message={status.message} />
    </div>
  )
}
