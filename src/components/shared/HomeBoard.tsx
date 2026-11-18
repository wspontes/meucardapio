import { useMemo } from 'react'
import { useSettings } from '@/hooks'
import { useProducts } from '@/hooks'
import type { Product } from '@/types'

export function HomeBoard() {
  const { settings } = useSettings()
  const { products: allProducts, loading } = useProducts()
  const board = settings?.homeBoard

  const resolved = useMemo<Product[]>(() => {
    if (!board?.productIds?.length) return []
    const byId = new Map(allProducts.map((p) => [p.id, p]))
    const seen = new Set<string>()
    const out: Product[] = []
    for (const id of board.productIds) {
      if (seen.has(id)) continue
      seen.add(id)
      const p = byId.get(id)
      if (!p || !p.active) continue
      out.push(p)
      if (out.length >= 4) break
    }
    return out
  }, [board, allProducts])

  if (loading || resolved.length === 0) return null

  const title = board?.title?.trim() || 'Hoje no Pit Stop'

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 py-5">
      <div
        className="relative"
        style={{
          background: 'var(--board-bg)',
          border: '10px solid var(--board-frame)',
          borderRadius: 6,
          padding: '22px 22px 18px',
          boxShadow: '0 10px 24px rgba(18, 36, 28, 0.35), inset 0 0 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: -14,
            left: 20,
            background: 'var(--board-label)',
            color: 'var(--board-frame)',
            fontFamily: "'Rokkitt', serif",
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: 3,
            transform: 'rotate(-2deg)',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
        <ul className="list-none">
          {resolved.map((p, i) => {
            const price = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price
            return (
              <li
                key={p.id}
                className="flex items-baseline justify-between gap-3"
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: 'var(--board-text)',
                  fontSize: '1.5rem',
                  lineHeight: 1.35,
                  borderBottom: i === resolved.length - 1 ? 'none' : '1px dashed var(--board-separator)',
                  padding: '4px 0',
                }}
              >
                <span className="min-w-0 truncate">{p.name}</span>
                <span className="shrink-0 whitespace-nowrap" style={{ color: 'var(--board-price)' }}>
                  {formatBoardPrice(price)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function formatBoardPrice(value: number) {
  if (Number.isInteger(value)) return `R$ ${value}`
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}
