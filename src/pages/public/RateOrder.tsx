import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Star, CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { useStore } from '@/contexts/StoreContext'
import { formatCurrency } from '@/utils'
import type { Order } from '@/types'

export default function RateOrder() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>()
  const prefix = slug ? `/${slug}` : ''
  const { store } = useStore()
  const storeName = store?.name || 'MeuCardapio'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stars, setStars] = useState(0)
  const [hoverStars, setHoverStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!orderId) return
    getDoc(doc(db, 'orders', orderId)).then((snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Order
        setOrder(data)
        if (data.rating) {
          setStars(data.rating.stars)
          setComment(data.rating.comment || '')
          setSubmitted(true)
        }
      } else {
        setError('Pedido não encontrado.')
      }
      setLoading(false)
    }).catch(() => {
      setError('Erro ao carregar pedido.')
      setLoading(false)
    })
  }, [orderId])

  const handleSubmit = async () => {
    if (!order || stars === 0 || submitting) return
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        rating: {
          stars,
          comment: comment.trim() || undefined,
          ratedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      })
      setSubmitted(true)
    } catch {
      setError('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag size={48} className="mx-auto mb-4 text-muted" />
        <p className="text-muted">{error}</p>
        <Link to={`${prefix}/cardapio`}><Button className="mt-4">Voltar ao cardápio</Button></Link>
      </div>
    )
  }

  if (!order) return null

  const isDelivered = order.status === 'delivered'
  const alreadyRated = !!order.rating

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Link to={`${prefix}/pedido/confirmacao`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-brand-white transition-colors">
          <ArrowLeft size={16} />
          Voltar ao pedido
        </Link>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h1 className="mb-2 text-xl font-bold text-brand-white text-center">Avaliar Pedido</h1>
          <p className="mb-6 text-sm text-muted text-center">
            Pedido #{order.id.slice(0, 8)} — {storeName}
          </p>

          {!isDelivered ? (
            <div className="rounded-lg bg-yellow-500/10 p-4 text-center">
              <p className="text-sm text-yellow-400">
                A avaliação estará disponível após a entrega do seu pedido.
              </p>
            </div>
          ) : alreadyRated && !submitted ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={32}
                    className={s <= (order.rating?.stars || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
                  />
                ))}
              </div>
              {order.rating?.comment && (
                <p className="text-sm text-muted text-center italic">"{order.rating.comment}"</p>
              )}
              <div className="rounded-lg bg-green-500/10 p-4 text-center">
                <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-400">Você já avaliou este pedido. Obrigado!</p>
              </div>
            </div>
          ) : submitted ? (
            <div className="space-y-4">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={32}
                    className={s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}
                  />
                ))}
              </div>
              {comment && (
                <p className="text-sm text-muted text-center italic">"{comment}"</p>
              )}
              <div className="rounded-lg bg-green-500/10 p-4 text-center">
                <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                <p className="text-sm text-green-400">Avaliação enviada com sucesso! Obrigado pelo feedback.</p>
              </div>
              <Link to={`${prefix}/cardapio`}>
                <Button variant="primary" className="w-full">Fazer novo pedido</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo do pedido */}
              <div className="rounded-lg bg-surface-hover p-4 text-left text-sm">
                <p className="font-medium text-brand-white mb-2">Resumo do pedido</p>
                {(order.items as Array<{ quantity: number; productName: string; price: number }>)?.map((item, i) => (
                  <p key={i} className="text-muted">{item.quantity}x {item.productName}</p>
                ))}
                <p className="mt-2 font-semibold text-brand-white">Total: {formatCurrency(order.total as number)}</p>
              </div>

              {/* Estrelas */}
              <div>
                <p className="mb-3 text-sm font-medium text-brand-white text-center">Como foi sua experiência?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={40}
                        className={
                          s <= (hoverStars || stars)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        }
                      />
                    </button>
                  ))}
                </div>
                {stars > 0 && (
                  <p className="mt-2 text-xs text-center text-muted">
                    {stars === 1 ? 'Muito ruim' : stars === 2 ? 'Ruim' : stars === 3 ? 'Regular' : stars === 4 ? 'Bom' : 'Excelente!'}
                  </p>
                )}
              </div>

              {/* Comentário */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-white">
                  Comentário (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Conte-nos mais sobre sua experiência..."
                  className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-brand-white placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
                <p className="mt-1 text-xs text-muted text-right">{comment.length}/500</p>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={stars === 0 || submitting}
                loading={submitting}
                className="w-full"
              >
                {submitting ? 'Enviando...' : 'Enviar avaliação'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}