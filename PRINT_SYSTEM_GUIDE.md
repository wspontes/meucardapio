# Sistema de Impressão de Comandas — Guia de Portabilidade

Este documento descreve como portar o sistema de impressão de comandas (cozinha, churrasqueira, entrega) do projeto meucardapio para outro projeto.

## Dependências

Nenhuma extra — usa apenas APIs nativas do browser (`window.print`, `clipboard`).

## Visão geral

O sistema possui:
- **Cupons de texto** gerados a partir do pedido (cozinha, churrasqueira, entrega, recibo)
- **Modal de impressão** com abas dinâmicas baseadas em targets habilitados nas configurações
- **Área de impressão isolada** (portal) que aparece apenas no papel
- **Impressão via RawBT** (Android) com ESC/POS
- **Configuração por loja** de quais setores recebem impressão

---

## 1. Tipo de dados (Order)

Seu tipo `Order` precisa ter (adapte nomes se necessário):

```ts
interface Order {
  id: string
  storeId: string
  customerName: string
  customerPhone: string
  deliveryAddress?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    reference?: string
  }
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
    size?: string
    flavors?: string[]
    extras?: string[]
    removedIngredients?: string[]
    notes?: string
  }[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  deliveryType?: 'delivery' | 'pickup'
  couponCode?: string
  notes?: string
  changeNeeded?: boolean
  changeFor?: number
  createdAt: string
}
```

## 2. Settings (configuração por loja)

### Tipo (`BusinessSettings` ou equivalente)
```ts
paymentMethods?: {
  pix?: { enabled: boolean; key?: string; qrCode?: string }
  credit?: { enabled: boolean }
  cash?: { enabled: boolean }
  delivery?: { enabled: boolean }
}
printTargets?: {
  kitchen?: boolean        // default: true
  churrasqueira?: boolean  // default: false
  delivery?: boolean       // default: true
}
```

### UI (Settings.tsx)
Seção "Impressão de Comandas" com 3 checkboxes:
- Cozinha (default ativado)
- Churrasqueira (default desativado)
- Entrega (default ativado)

Carregar/salvar em `settings.printTargets`.

## 3. Utilitário `src/utils/receipt.ts`

Copie o arquivo completo (ver abaixo). Principais exports:
- `RECEIPT_COLS`, `PRINT_COLS`
- `buildKitchenText(order, storeName, cols)`
- `buildChurrasqueiraText(order, storeName, cols)`
- `buildDeliveryText(order, storeName, motoboy, cols)`
- `buildBothText(order, storeName, motoboy, cols)`
- `buildReceiptText(order, storeName)`
- `printAllViaRawBt(order, storeName, motoboy, targets)`
- `PRINT_COLS`

**Adapte:** os campos do `Order` (items, deliveryAddress, paymentMethod, total, etc.) e os labels de pagamento.

### Código completo: `src/utils/receipt.ts`

```typescript
import type { Order } from '@/types'

export const RECEIPT_COLS = 32

export const PRINT_COLS = 26

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function line(text = '', cols = RECEIPT_COLS): string {
  return `${text.slice(0, cols)}\n`
}

function sep(char = '-', cols = RECEIPT_COLS): string {
  return `${char.repeat(cols)}\n`
}

function center(text: string, cols = RECEIPT_COLS): string {
  const t = text.slice(0, cols)
  const pad = Math.max(0, Math.floor((cols - t.length) / 2))
  return `${' '.repeat(pad)}${t}\n`
}

function leftRight(left: string, right: string, cols = RECEIPT_COLS): string {
  const r = right.slice(0, cols)
  const space = Math.max(1, cols - left.length - r.length)
  return `${left.slice(0, cols - r.length - 1)}${' '.repeat(space)}${r}\n`
}

function wrap(text: string, prefix = '', cols = RECEIPT_COLS): string {
  const width = cols - prefix.length
  const words = text.split(' ')
  let out = ''
  let current = ''
  for (const w of words) {
    const next = current ? `${current} ${w}` : w
    if (next.length > width) {
      out += `${prefix}${current}\n`
      current = w
    } else {
      current = next
    }
  }
  if (current) out += `${prefix}${current}\n`
  return out
}

function money(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function paymentLabel(method: string): string {
  if (method === 'pix') return 'PIX'
  if (method === 'cash') return 'Dinheiro'
  if (method === 'credit') return 'Credito'
  if (method === 'debit') return 'Debito'
  if (method === 'card') return 'Cartao'
  if (method === 'delivery') return 'Na entrega'
  return method
}

/** Pix é pré-pago. Cartão/dinheiro pagam na entrega ou retirada. */
function deliveryPaymentLine(order: Order): string {
  if (order.paymentMethod === 'pix') return 'PIX - PAGO'
  const where = order.deliveryType === 'pickup' ? 'NA RETIRADA' : 'NA ENTREGA'
  return `${paymentLabel(order.paymentMethod)} - PAGAR ${where}`
}

function formatShortDate(d: Date): string {
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function itemsBlock(order: Order, withDetails: boolean, withItemNotes = false, cols = RECEIPT_COLS): string {
  let out = ''
  for (const item of order.items) {
    out += wrap(`${item.quantity}x ${item.productName}`, '', cols)
    if (item.notes && (withDetails || withItemNotes)) out += wrap(`Obs: ${item.notes}`, '  ', cols)
    if (!withDetails) continue
    if (item.size) out += wrap(`Tam: ${item.size}`, '  ', cols)
    if (item.flavors?.length) out += wrap(item.flavors.join(' + '), '  ', cols)
    if (item.extras?.length) out += wrap(`Extra: ${item.extras.join(', ')}`, '  ', cols)
    if (item.removedIngredients?.length) out += wrap(`S/ ${item.removedIngredients.join(', ')}`, '  ', cols)
  }
  return out
}

/** Cupom 1 — cozinha: sem endereço, sem valores. Foco no preparo. */
export function buildKitchenText(order: Order, storeName = 'MeuCardapio', cols = RECEIPT_COLS): string {
  const dt = new Date(order.createdAt)
  const kind = order.deliveryType === 'pickup' ? 'RETIRADA' : 'ENTREGA'
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  let out = ''
  out += center(storeName.toUpperCase(), cols)
  out += sep('-', cols)
  out += center(`CUPOM COZINHA - ${kind}`, cols)
  out += sep('-', cols)
  out += line(`Pedido #${order.id.slice(0, 8)}`, cols)
  out += line(formatShortDate(dt), cols)
  out += line(`Cliente: ${order.customerName}`.slice(0, cols), cols)
  out += sep('-', cols)
  out += itemsBlock(order, true, false, cols)
  if (order.notes?.trim()) out += wrap(`Obs: ${order.notes.trim()}`, '', cols)
  out += sep('-', cols)
  out += center(`*** ${count} ${count === 1 ? 'item' : 'itens'} ***`, cols)
  out += line('', cols)
  out += line('', cols)
  return out
}

/** Cupom da churrasqueira: igual à cozinha (sem endereço/valores, foco no preparo). */
export function buildChurrasqueiraText(order: Order, storeName = 'MeuCardapio', cols = RECEIPT_COLS): string {
  const dt = new Date(order.createdAt)
  const kind = order.deliveryType === 'pickup' ? 'RETIRADA' : 'ENTREGA'
  const count = order.items.reduce((n, i) => n + i.quantity, 0)
  let out = ''
  out += center(storeName.toUpperCase(), cols)
  out += sep('-', cols)
  out += center(`CUPOM CHURRASQUEIRA - ${kind}`, cols)
  out += sep('-', cols)
  out += line(`Pedido #${order.id.slice(0, 8)}`, cols)
  out += line(formatShortDate(dt), cols)
  out += line(`Cliente: ${order.customerName}`.slice(0, cols), cols)
  out += sep('-', cols)
  out += itemsBlock(order, true, false, cols)
  if (order.notes?.trim()) out += wrap(`Obs: ${order.notes.trim()}`, '', cols)
  out += sep('-', cols)
  out += center(`*** ${count} ${count === 1 ? 'item' : 'itens'} ***`, cols)
  out += line('', cols)
  out += line('', cols)
  return out
}

/** Cupom 2 — entrega/motoboy: endereço, pagamento e total. */
export function buildDeliveryText(order: Order, storeName = 'MeuCardapio', motoboy = '', cols = RECEIPT_COLS): string {
  const dt = new Date(order.createdAt)
  const isPickup = order.deliveryType === 'pickup'
  let out = ''
  out += center(storeName.toUpperCase(), cols)
  out += sep('-', cols)
  out += center(isPickup ? 'DADOS DE RETIRADA' : 'DADOS DE ENTREGA', cols)
  out += sep('-', cols)
  out += line(`Pedido #${order.id.slice(0, 8)}`, cols)
  out += line(formatShortDate(dt), cols)
  out += line(`Cliente: ${order.customerName}`.slice(0, cols), cols)
  out += line(`Fone: ${order.customerPhone}`.slice(0, cols), cols)
  if (!isPickup && motoboy.trim()) out += line(`Motoboy: ${motoboy.trim()}`.slice(0, cols), cols)
  if (!isPickup && order.deliveryAddress) {
    const a = order.deliveryAddress
    out += sep('-', cols)
    out += wrap(`${a.street}, ${a.number}`, '', cols)
    if (a.complement) out += wrap(`Compl.: ${a.complement}`, '', cols)
    if (a.reference) out += wrap(`Ref: ${a.reference}`, '', cols)
    out += wrap(`${a.neighborhood} - ${a.city}`, '', cols)
  }
  out += sep('-', cols)
  out += itemsBlock(order, false, true, cols)
  out += sep('-', cols)
  out += wrap(deliveryPaymentLine(order), '', cols)
  out += leftRight('TOTAL', money(order.total), cols)
  if (order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor) {
    out += line(`Troco p/ ${money(order.changeFor)}`, cols)
    out += leftRight('Troco', money(order.changeFor - order.total), cols)
  }
  if (order.couponCode) out += line(`Cupom: ${order.couponCode}`)
  if (order.notes) out += wrap(`Obs: ${order.notes}`, '', cols)
  out += line('', cols)
  out += center('Obrigado pela preferencia!', cols)
  out += line('', cols)
  out += line('', cols)
  return out
}

/** Os dois cupons em sequência para uma única impressão (rasgar no meio). */
export function buildBothText(order: Order, storeName = 'MeuCardapio', motoboy = '', cols = RECEIPT_COLS): string {
  return buildKitchenText(order, storeName, cols) + buildDeliveryText(order, storeName, motoboy, cols)
}

export function buildBothAscii(order: Order, storeName = 'MeuCardapio', motoboy = ''): string {
  return stripAccents(buildBothText(order, storeName, motoboy)).replace(/[^ -~\n]/g, '')
}

function asciiBytes(s: string): number[] {
  const bytes: number[] = []
  for (const ch of s) bytes.push(ch.charCodeAt(0) & 0xff)
  return bytes
}

function bytesToBase64(bytes: number[]): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/** Pacote ESC/POS mínimo: INIT + texto + avanço + corte. */
export function buildEscPosBase64(order: Order, storeName = 'MeuCardapio'): string {
  const text = buildBothAscii(order, storeName)
  const bytes = [0x1b, 0x40, ...asciiBytes(text), 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]
  return bytesToBase64(bytes)
}

export function buildRawBtUrl(order: Order, storeName = 'MeuCardapio'): string {
  return `rawbt:base64,${buildEscPosBase64(order, storeName)}`
}

/** Abre o RawBT. Precisa ser chamado de um clique do usuário. */
export function printViaRawBt(order: Order, storeName = 'MeuCardapio'): string {
  const url = buildRawBtUrl(order, storeName)
  window.location.href = url
  return url
}

/** Imprime os dois cupons via RawBT. */
export function printBothViaRawBt(order: Order, storeName = 'MeuCardapio', motoboy = ''): string {
  const url = `rawbt:base64,${buildBothEscPosBase64(order, storeName, motoboy)}`
  window.location.href = url
  return url
}

/** Imprime todos os targets habilitados via RawBT. */
export function printAllViaRawBt(order: Order, storeName = 'MeuCardapio', motoboy = '', targets: ('kitchen' | 'churrasqueira' | 'delivery')[] = ['kitchen', 'delivery']): string {
  const texts = targets.map((t) => {
    if (t === 'kitchen') return buildKitchenText(order, storeName)
    if (t === 'churrasqueira') return buildChurrasqueiraText(order, storeName)
    return buildDeliveryText(order, storeName, motoboy)
  })
  const text = texts.join('')
  const ascii = stripAccents(text).replace(/[^ -~\n]/g, '')
  const bytes = [0x1b, 0x40, ...asciiBytes(ascii), 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]
  const url = `rawbt:base64,${bytesToBase64(bytes)}`
  window.location.href = url
  return url
}

/** Texto sem acentos para impressora SPP barata via base64. */
export function buildBothEscPosBase64(order: Order, storeName = 'MeuCardapio', motoboy = ''): string {
  const text = buildBothAscii(order, storeName, motoboy)
  const bytes = [0x1b, 0x40, ...asciiBytes(text), 0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00]
  return bytesToBase64(bytes)
}

/** Cupom único (recibo) para impressão via navegador. */
export function buildReceiptText(order: Order, storeName = 'MeuCardapio'): string {
  let out = ''
  out += center(storeName.toUpperCase())
  out += center(`Pedido #${order.id.slice(0, 8)}`)
  out += sep()
  const dt = new Date(order.createdAt)
  const dateStr = `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  out += leftRight(order.deliveryType === 'pickup' ? 'RETIRADA' : 'DELIVERY', dateStr.slice(0, 16))
  out += line(order.customerName.slice(0, RECEIPT_COLS))
  out += line(order.customerPhone)
  if (order.deliveryType !== 'pickup' && order.deliveryAddress) {
    const a = order.deliveryAddress
    out += wrap(`${a.street}, ${a.number}${a.complement ? ` ${a.complement}` : ''}`, '')
    out += wrap(`${a.neighborhood} - ${a.city}`, '')
    if (a.reference) out += wrap(`Ref: ${a.reference}`, '')
  }
  out += sep()
  for (const item of order.items) {
    out += leftRight(`${item.quantity}x ${item.productName}`.slice(0, 22), money(item.price * item.quantity).slice(0, 9))
    if (item.size) out += line(`  Tam: ${item.size}`.slice(0, RECEIPT_COLS))
    if (item.flavors?.length) out += wrap(item.flavors.join(' + '), '  ')
    if (item.extras?.length) out += line(`  Extra: ${item.extras.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.removedIngredients?.length) out += line(`  S/ ${item.removedIngredients.join(', ')}`.slice(0, RECEIPT_COLS))
    if (item.notes) out += wrap(`Obs: ${item.notes}`, '  ')
  }
  out += sep()
  out += leftRight('Subtotal', money(order.subtotal))
  if (order.deliveryType !== 'pickup') out += leftRight('Entrega', money(order.deliveryFee))
  if (order.discount > 0) out += leftRight('Desconto', `-${money(order.discount)}`)
  out += leftRight('TOTAL', money(order.total))
  out += sep()
  out += line(`Pagto: ${paymentLabel(order.paymentMethod)}`)
  if (order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor) {
    out += line(`Troco p/ ${money(order.changeFor)}`)
    out += leftRight('Troco', money(order.changeFor - order.total))
  }
  if (order.couponCode) out += line(`Cupom: ${order.couponCode}`)
  if (order.notes) out += wrap(`Obs: ${order.notes}`, '')
  out += sep()
  out += center('Obrigado pela preferencia!')
  out += line('')
  out += line('')
  return out
}
```

### Código completo: `src/components/shared/PrintArea.tsx`

```tsx
import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  /** Cada entrada é um cupom. Todos saem na mesma folha, separados pelo pontilhado. */
  tickets: string[]
}

/** Papel 58x210mm (o padrão da POS-58). Acima disso cada cupom vai em uma folha. */
const PAPEL_MM = 210
const MM_EM_PX = 96 / 25.4

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
```

### Código completo: `src/components/shared/PrintOrderModal.tsx`

```tsx
import { useState } from 'react'
import { Printer, Copy, Check, XCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { PrintArea } from '@/components/shared/PrintArea'
import { useSettings } from '@/hooks'
import type { Order } from '@/types'
import {
  buildKitchenText,
  buildDeliveryText,
  buildChurrasqueiraText,
  printAllViaRawBt,
  PRINT_COLS,
} from '@/utils/receipt'

interface Props {
  order: Order | null
  storeName?: string
  initialMotoboy?: string
  onClose: () => void
}

type Target = 'kitchen' | 'churrasqueira' | 'delivery'

const TARGET_LABELS: Record<Target, string> = {
  kitchen: 'Cozinha',
  churrasqueira: 'Churrasqueira',
  delivery: 'Entrega',
}

const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

export function PrintOrderModal({ order, storeName = 'MeuCardapio', initialMotoboy = '', onClose }: Props) {
  const { settings } = useSettings()
  const [copied, setCopied] = useState(false)
  const [motoboy, setMotoboy] = useState(initialMotoboy)

  if (!order) return null

  const printTargets = settings?.printTargets ?? {}
  const enabledTargets: Target[] = (['kitchen', 'churrasqueira', 'delivery'] as Target[]).filter((t) => {
    if (t === 'kitchen') return printTargets.kitchen !== false
    if (t === 'churrasqueira') return printTargets.churrasqueira === true
    if (t === 'delivery') return printTargets.delivery !== false
    return false
  })

  if (enabledTargets.length === 0) enabledTargets.push('kitchen')

  const [tab, setTab] = useState<string>(enabledTargets[0])

  const buildText = (target: Target): string => {
    if (target === 'kitchen') return buildKitchenText(order, storeName, PRINT_COLS)
    if (target === 'churrasqueira') return buildChurrasqueiraText(order, storeName, PRINT_COLS)
    return buildDeliveryText(order, storeName, motoboy, PRINT_COLS)
  }

  const allTickets = enabledTargets.map((t) => buildText(t))
  const allText = allTickets.join('')

  let tickets: string[] = []
  let text = ''
  if (tab === 'all') {
    tickets = allTickets
    text = allText
  } else {
    tickets = [buildText(tab as Target)]
    text = tickets[0]
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const showAllTab = enabledTargets.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Printer size={18} className="text-accent" />
            Imprimir #{order.id.slice(0, 8)}
          </h3>
          <button onClick={onClose} className="text-muted transition-colors hover:text-white">
            <XCircle size={18} />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {enabledTargets.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                tab === t ? 'bg-accent text-white' : 'bg-surface-hover text-muted hover:text-white'
              }`}
            >
              {TARGET_LABELS[t]}
            </button>
          ))}
          {showAllTab && (
            <button
              onClick={() => setTab('all')}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                tab === 'all' ? 'bg-accent text-white' : 'bg-surface-hover text-muted hover:text-white'
              }`}
            >
              Todos
            </button>
          )}
        </div>

        {order.deliveryType !== 'pickup' && (
          <div className="mb-3">
            <Input placeholder="Motoboy (opcional)" value={motoboy} onChange={(e) => setMotoboy(e.target.value)} />
          </div>
        )}

        <pre className="mb-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-black p-3 font-mono text-xs leading-5 text-white">
          {text}
        </pre>

        <PrintArea tickets={tickets} />

        <div className="flex flex-col gap-2">
          {isAndroid ? (
            <>
              <Button onClick={() => printAllViaRawBt(order, storeName, motoboy, enabledTargets)} className="w-full text-sm">
                <Printer size={16} />
                Imprimir via RawBT
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="w-full text-sm">
                Imprimir pelo navegador
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => window.print()} className="w-full text-sm" title="Imprime somente o cupom">
                <Printer size={16} />
                Imprimir cupom
              </Button>
            </>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyText} className="flex-1 text-sm">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copiado!' : 'Copiar texto'}
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            {isAndroid ? (
              <>
                Precisa do app <b>RawBT</b> instalado e a impressora pareada no Bluetooth.
              </>
            ) : (
              <>
                &quot;Imprimir cupom&quot; abre o diálogo do navegador: escolha a impressora térmica e o papel
                &quot;Printer Paper(58 x 210mm)&quot;. As margens já são automáticas.
              </>
            )}{' '}
            Sem impressora? Confira o preview acima.
          </p>
        </div>
      </div>
    </div>
  )
}
```

## 4. CSS de impressão (adicione ao seu `index.css` ou `globals.css`)

```css
/* Área de impressão isolada */
.print-portal {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }
  .print-portal,
  .print-portal * {
    visibility: visible;
  }
  .print-portal {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .print-coupon {
    font-family: monospace;
    font-size: 12px;
    line-height: 1.2;
    white-space: pre-wrap;
    margin: 0;
    padding: 0;
  }
  .print-cut {
    border-top: 1px dashed #000;
    margin: 8px 0;
  }
}
```

## 5. Integração no OrdersAdmin

No seu `OrdersAdmin.tsx` (ou equivalente):

```tsx
import { PrintOrderModal } from '@/components/shared/PrintOrderModal'

// No estado:
const [printOrder, setPrintOrder] = useState<Order | null>(null)

// No card do pedido, adicionar botão:
<Button size="sm" variant="ghost" onClick={() => setPrintOrder(order)} title="Imprimir comanda">
  <Printer size={15} />
</Button>

// No final do componente, renderizar o modal:
{printOrder && (
  <PrintOrderModal
    order={printOrder}
    storeName={store?.name}
    onClose={() => setPrintOrder(null)}
  />
)}
```

## 6. Settings — tipo e UI

### Tipo (`BusinessSettings`):
```ts
printTargets?: {
  kitchen?: boolean
  churrasqueira?: boolean
  delivery?: boolean
}
```

### UI (Settings.tsx) — seção "Impressão de Comandas":
```tsx
<div className="rounded-xl border border-border bg-surface p-4 md:p-6">
  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-white">
    <Printer size={18} className="text-accent" />
    Impressão de Comandas
  </h2>
  <p className="mb-4 text-xs text-muted">
    Escolha quem recebe impressão ao imprimir um pedido.
  </p>
  <div className="space-y-2">
    <label className="flex items-center gap-3 rounded-lg bg-surface-hover px-4 py-3 cursor-pointer">
      <input type="checkbox" checked={printKitchen} onChange={(e) => setPrintKitchen(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
      <div>
        <p className="text-sm font-medium text-brand-white">Cozinha</p>
        <p className="text-xs text-muted">Cupom com itens e observações para preparo</p>
      </div>
    </label>
    <label className="flex items-center gap-3 rounded-lg bg-surface-hover px-4 py-3 cursor-pointer">
      <input type="checkbox" checked={printChurrasqueira} onChange={(e) => setPrintChurrasqueira(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
      <div>
        <p className="text-sm font-medium text-brand-white">Churrasqueira</p>
        <p className="text-xs text-muted">Cupom para o setor de churrasqueira</p>
      </div>
    </label>
    <label className="flex items-center gap-3 rounded-lg bg-surface-hover px-4 py-3 cursor-pointer">
      <input type="checkbox" checked={printDelivery} onChange={(e) => setPrintDelivery(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent" />
      <div>
        <p className="text-sm font-medium text-brand-white">Entrega</p>
        <p className="text-xs text-muted">Cupom com endereço, pagamento e total</p>
      </div>
    </label>
  </div>
</div>
```

### Estado e save (Settings.tsx)
```tsx
const [printKitchen, setPrintKitchen] = useState(true)
const [printChurrasqueira, setPrintChurrasqueira] = useState(false)
const [printDelivery, setPrintDelivery] = useState(true)

// No load:
if (data.printTargets) {
  const pt = data.printTargets
  if (pt.kitchen !== undefined) setPrintKitchen(pt.kitchen)
  if (pt.churrasqueira !== undefined) setPrintChurrasqueira(pt.churrasqueira)
  if (pt.delivery !== undefined) setPrintDelivery(pt.delivery)
}

// No save:
printTargets: {
  kitchen: printKitchen,
  churrasqueira: printChurrasqueira,
  delivery: printDelivery,
},
```

## Arquivos mínimos para copiar

| Arquivo | O que faz |
|---|---|
| `src/utils/receipt.ts` | Gera texto dos cupons (cozinha, churrasqueira, entrega, recibo) + RawBT |
| `src/components/shared/PrintArea.tsx` | Área de impressão isolada via portal |
| `src/components/shared/PrintOrderModal.tsx` | Modal com abas dinâmicas + preview + botões |
| `src/pages/admin/Settings.tsx` (trecho) | Seção de toggles de impressão |
| `src/pages/admin/OrdersAdmin.tsx` (trecho) | Botão de imprimir + modal |
| `src/services/settings.ts` (trecho) | Tipo `printTargets` |

## Adaptações necessárias

- **Tipo `Order`**: deve ter `items` (com productName, quantity, size, flavors, extras, removedIngredients, notes), `deliveryAddress`, `paymentMethod`, `total`, `subtotal`, `deliveryFee`, `discount`, `customerName`, `customerPhone`, `deliveryType`, `couponCode`, `notes`, `changeNeeded`, `changeFor`, `createdAt`
- **`useSettings` hook**: para ler `settings.printTargets`
- **`StoreGuard` / `useStoreGuard`**: para obter `store.name`
- **`paymentLabel` / `getPaymentLabel`**: adaptar para os métodos de pagamento do outro projeto
- **RawBT**: requer app RawBT instalado no Android

## Roteiro de teste
1. Configurar targets em Settings (ativar/desativar setores)
2. Ir em Pedidos → clicar no ícone de impressora em um pedido
3. Verificar que as abas refletem os targets habilitados
4. Testar "Todos" (imprime todos em sequência)
5. Testar impressão via navegador (Ctrl+P) e via RawBT (Android)
6. Verificar que o corte (pontilhado) aparece entre cupons

---

Salvo em: `PRINT_SYSTEM_GUIDE.md` na raiz do projeto meucardapio. Para portar, copie os arquivos e adapte os campos do `Order` e labels de pagamento. Para dúvidas, consulte o código original do projeto meucardapio.