import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  /** Cada entrada é um cupom. Todos saem na mesma folha, separados pelo pontilhado. */
  tickets: string[]
}

/** Papel 58x210mm (o padrão da POS-58). Acima disso cada cupom vai em uma folha. */
const PAPEL_MM = 210
const MM_EM_PX = 96 / 25.4

/**
 * Área de impressão isolada.
 *
 * Fica escondida na tela (classe `print-portal`) e é a única coisa que
 * aparece no papel: o CSS de impressão esconde o resto do app.
 */
export function PrintArea({ tickets }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [quebrar, setQuebrar] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const cs = getComputedStyle(el)
    let lh = parseFloat(cs.lineHeight)
    if (!Number.isFinite(lh)) lh = 0
    else if (lh > 0 && lh < 4) lh *= parseFloat(cs.fontSize)
    const alturaLinha = lh || parseFloat(cs.fontSize) * 1.18

    const corte = el.querySelector<HTMLElement>('.print-cut')
    let separador = 0
    if (corte) {
      const cs2 = getComputedStyle(corte)
      separador =
        parseFloat(cs2.marginTop) + parseFloat(cs2.borderTopWidth) + parseFloat(cs2.marginBottom)
    }

    const linhas = tickets.reduce((n, t) => n + t.replace(/\n+$/, '').split('\n').length, 0)
    const altura = linhas * alturaLinha + separador * (tickets.length - 1)

    setQuebrar(altura > PAPEL_MM * MM_EM_PX)
  }, [tickets])

  return createPortal(
    <div className="print-portal" ref={ref} aria-hidden="true">
      {tickets.map((ticket, i) => {
        const texto = i < tickets.length - 1 ? ticket.replace(/\n+$/, '') : ticket
        return (
          <Fragment key={i}>
            {i > 0 && !quebrar && <div className="print-cut" />}
            <pre className="print-coupon" style={i > 0 && quebrar ? { breakBefore: 'page' } : undefined}>
              {texto}
            </pre>
          </Fragment>
        )
      })}
    </div>,
    document.body,
  )
}
