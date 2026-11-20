import type { Order } from '@/types'

export const RECEIPT_COLS = 32

/**
 * Colunas da impressão via navegador.
 * Menos colunas de propósito: papel de 58mm tem só 47,9mm imprimíveis;
 * menos colunas deixam cada caractere ~25% maior (mais "forte" no papel).
 */
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
