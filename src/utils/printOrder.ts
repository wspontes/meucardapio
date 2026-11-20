import type { Order } from '@/types'
import { formatCurrency } from '@/utils'

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão',
  cash: 'Dinheiro',
  credit: 'Crédito',
  debit: 'Débito',
  delivery: 'Na entrega',
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const CSS = `
  @page { size: 80mm auto; margin: 3mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; width: 74mm; }
  .ticket { page-break-after: always; padding-bottom: 6mm; }
  .ticket:last-child { page-break-after: auto; }
  .center { text-align: center; }
  .store { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
  .subtitle { font-size: 15px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 3mm 0; padding: 2mm 0; }
  .meta { font-size: 12px; line-height: 1.5; }
  .sep { border-top: 1px dashed #000; margin: 2.5mm 0; }
  .item-name { font-size: 17px; font-weight: bold; line-height: 1.35; }
  .item-detail { font-size: 13px; line-height: 1.4; }
  .item-note { font-size: 14px; font-weight: bold; }
  .removed { font-size: 14px; font-weight: bold; }
  .obs-box { border: 1.5px solid #000; padding: 2mm; font-size: 14px; font-weight: bold; margin-top: 2.5mm; }
  .big { font-size: 16px; font-weight: bold; }
  .row { display: flex; justify-content: space-between; font-size: 14px; line-height: 1.6; }
  .total { font-size: 18px; font-weight: bold; }
  .footer { text-align: center; font-size: 11px; margin-top: 4mm; }
`

function kitchenTicket(order: Order, storeName: string): string {
  const isPickup = order.deliveryType === 'pickup'
  return `<div class="ticket">
    <div class="center store">${esc(storeName)}</div>
    <div class="center subtitle">CUPOM COZINHA ${isPickup ? '• RETIRADA' : '• ENTREGA'}</div>
    <div class="meta">
      Pedido <b>#${esc(order.id.slice(0, 8))}</b><br>
      ${fmtDate(order.createdAt)}<br>
      Cliente: <b>${esc(order.customerName)}</b>
    </div>
    <div class="sep"></div>
    ${order.items
      .map((item) => {
        const parts: string[] = []
        if (item.removedIngredients && item.removedIngredients.length > 0) {
          parts.push(`<div class="removed">SEM: ${esc(item.removedIngredients.join(', '))}</div>`)
        }
        if (item.size) parts.push(`<div class="item-detail">Tam: ${esc(item.size)}</div>`)
        if (item.flavors && item.flavors.length > 0) parts.push(`<div class="item-detail">Sabores: ${esc(item.flavors.join(', '))}</div>`)
        if (item.extras && item.extras.length > 0) parts.push(`<div class="item-detail">Extra: ${esc(item.extras.join(', '))}</div>`)
        if (item.notes) parts.push(`<div class="item-note">&#8627; ${esc(item.notes)}</div>`)
        return `<div style="margin-bottom: 3mm">
          <div class="item-name">${item.quantity}x ${esc(item.productName)}</div>
          ${parts.join('')}
        </div>`
      })
      .join('')}
    ${
      order.notes
        ? `<div class="obs-box">OBS.: ${esc(order.notes)}</div>`
        : ''
    }
    <div class="footer">*** ${order.items.reduce((acc, i) => acc + i.quantity, 0)} itens ***</div>
  </div>`
}

function deliveryTicket(order: Order, storeName: string): string {
  const isPickup = order.deliveryType === 'pickup'
  const addr = order.deliveryAddress
  const paid = order.paymentStatus === 'paid' || order.paymentStatus === 'approved'
  const paymentLine = `${PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} - ${paid ? 'PAGO' : 'RECEBER NA ENTREGA'}`
  return `<div class="ticket">
    <div class="center store">${esc(storeName)}</div>
    <div class="center subtitle">${isPickup ? 'RETIRADA NO BALCÃO' : 'DADOS DE ENTREGA'}</div>
    <div class="meta">
      Pedido <b>#${esc(order.id.slice(0, 8))}</b> • ${fmtDate(order.createdAt)}<br>
      Cliente: <b>${esc(order.customerName)}</b><br>
      Fone: <b>${esc(order.customerPhone)}</b>
      ${order.motoboyName ? `<br>Motoboy: <b>${esc(order.motoboyName)}</b>` : ''}
    </div>
    ${
      !isPickup && addr
        ? `<div class="sep"></div>
    <div class="big">${esc(addr.street)}, ${esc(addr.number)}</div>
    <div class="meta">
      ${addr.complement ? `${esc(addr.complement)}<br>` : ''}
      ${addr.reference ? `<b>Ref.: ${esc(addr.reference)}</b><br>` : ''}
      ${esc(addr.neighborhood)}${addr.city ? ` - ${esc(addr.city)}` : ''}
    </div>`
        : ''
    }
    <div class="sep"></div>
    ${order.items.map((i) => `<div class="item-detail">${i.quantity}x ${esc(i.productName)}</div>`).join('')}
    <div class="sep"></div>
    <div class="row"><span>${paymentLine}</span></div>
    ${
      order.paymentMethod === 'cash' && order.changeNeeded && order.changeFor
        ? `<div class="item-note">Levar troco para: ${formatCurrency(order.changeFor)}</div>`
        : ''
    }
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
    <div class="footer">Bom apetite!</div>
  </div>`
}

export function printOrder(order: Order, storeName = 'MeuCardapio'): void {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Pedido #${esc(order.id.slice(0, 8))} - ${esc(storeName)}</title>
<style>${CSS}</style>
</head>
<body>
${kitchenTicket(order, storeName)}
${deliveryTicket(order, storeName)}
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body>
</html>`
  const win = window.open('', '_blank')
  if (!win) {
    alert('Permita pop-ups para imprimir o pedido.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}
