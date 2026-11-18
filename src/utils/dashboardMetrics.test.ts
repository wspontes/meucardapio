import {
  getPeriodRange,
  getPreviousPeriodRange,
  inPeriod,
  calcRevenue,
  calcOpenRevenue,
  calcOrderCount,
  calcAvgOrder,
  calcVariation,
  calcConversion,
  calcCancellations,
  aggregateProducts,
  sortTopProducts,
  productUnitLabel,
  groupByHour,
  groupRevenueByDay,
  groupByPayment,
  groupByType,
  recentOrders,
} from './dashboardMetrics'

let passed = 0
let failed = 0
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log('  ✓', msg) }
  else { failed++; console.error('  ✗', msg) }
}

// Teste 1: getPeriodRange 'today' em SP
console.log('Teste 1: período Hoje (SP)')
{
  // 2026-11-18 10:00 UTC = 07:00 SP (quarta)
  const now = new Date('2026-11-18T10:00:00Z')
  const r = getPeriodRange('today', now)
  assert(r.start.toISOString() === '2026-11-18T03:00:00.000Z', `start ${r.start.toISOString()}`)
  assert(r.end.toISOString() === '2026-11-19T03:00:00.000Z', `end ${r.end.toISOString()}`)
}

// Teste 2: período anterior (ontem)
console.log('Teste 2: período anterior Hoje')
{
  const now = new Date('2026-11-18T10:00:00Z')
  const r = getPreviousPeriodRange('today', now)
  assert(r.start.toISOString() === '2026-11-17T03:00:00.000Z', `start ${r.start.toISOString()}`)
}

// Teste 3: inPeriod
console.log('Teste 3: inPeriod')
{
  const now = new Date('2026-11-18T10:00:00Z')
  const r = getPeriodRange('today', now)
  assert(inPeriod('2026-11-18T12:00:00Z', r) === true, 'dentro')
  assert(inPeriod('2026-11-17T12:00:00Z', r) === false, 'fora (ontem)')
}

// Teste 4: calcRevenue / calcOpenRevenue
console.log('Teste 4: receita')
{
  const orders = [
    { total: 100, status: 'delivered' },
    { total: 50, status: 'preparing' },
    { total: 30, status: 'cancelled' },
  ]
  assert(calcRevenue(orders) === 100, 'recebido 100')
  assert(calcOpenRevenue(orders) === 50, 'em aberto 50')
}

// Teste 5: calcOrderCount (exclui cancelados)
console.log('Teste 5: contagem')
{
  const orders = [{ status: 'delivered' }, { status: 'cancelled' }, { status: 'received' }]
  assert(calcOrderCount(orders) === 2, '2 pedidos')
}

// Teste 6: calcAvgOrder
console.log('Teste 6: ticket médio')
{
  assert(calcAvgOrder(100, 2) === 50, '50')
  assert(calcAvgOrder(100, 0) === 0, '0 quando sem pedidos')
}

// Teste 7: calcVariation
console.log('Teste 7: variação')
{
  const v1 = calcVariation(120, 100)
  assert(v1.percent === 20, '20%')
  assert(v1.direction === 'up', 'up')
  const v2 = calcVariation(80, 100)
  assert(v2.percent === -20, '-20%')
  assert(v2.direction === 'down', 'down')
  const v3 = calcVariation(50, 0)
  assert(v3.percent === null, 'null quando anterior zero')
}

// Teste 8: calcConversion
console.log('Teste 8: conversão')
{
  const orders = [{ status: 'delivered' }, { status: 'cancelled' }]
  // 1 não-cancelado / 10 acessos = 10%
  assert(Math.abs(calcConversion(orders, 10) - 10) < 0.001, '10%')
  assert(calcConversion(orders, 0) === 0, '0 quando sem acessos')
}

// Teste 9: calcCancellations
console.log('Teste 9: cancelamentos')
{
  const orders = [{ status: 'cancelled' }, { status: 'delivered' }, { status: 'cancelled' }]
  const c = calcCancellations(orders)
  assert(c.count === 2, '2 cancelados')
  assert(Math.abs(c.percent - 66.666) < 0.01, '~66.7%')
}

// Teste 10: aggregateProducts + sortTopProducts (desempate)
console.log('Teste 10: top produtos')
{
  const orders = [
    { status: 'delivered', items: [{ productId: 'a', productName: 'A', quantity: 2, price: 10 }, { productId: 'b', productName: 'B', quantity: 2, price: 20 }] },
    { status: 'delivered', items: [{ productId: 'a', productName: 'A', quantity: 1, price: 10 }] },
  ]
  const agg = aggregateProducts(orders)
  const a = agg.find((x) => x.name === 'A')!
  const b = agg.find((x) => x.name === 'B')!
  assert(a.qty === 3 && a.revenue === 30, 'A: 3 un, R$30')
  assert(b.qty === 2 && b.revenue === 40, 'B: 2 un, R$40')
  const byQty = sortTopProducts(agg, 'qty')
  assert(byQty[0].name === 'A', 'por qty: A primeiro (3 > 2)')
  const byRev = sortTopProducts(agg, 'revenue')
  assert(byRev[0].name === 'B', 'por revenue: B primeiro (40 > 30)')
}

// Teste 11: productUnitLabel
console.log('Teste 11: plural')
{
  assert(productUnitLabel(1) === 'un. vendida', 'singular')
  assert(productUnitLabel(2) === 'un. vendidas', 'plural')
}

// Teste 12: groupByHour
console.log('Teste 12: por hora')
{
  // 2026-11-18 19:00 SP = 22:00 UTC
  const orders = [{ status: 'delivered', createdAt: '2026-11-18T22:00:00Z' }]
  const buckets = groupByHour(orders)
  assert(buckets[19] === 1, 'hora 19 = 1')
  assert(buckets.reduce((a, b) => a + b, 0) === 1, 'total 1')
}

// Teste 13: groupByPayment
console.log('Teste 13: formas de pagamento')
{
  const orders = [{ status: 'delivered', paymentMethod: 'pix' }, { status: 'delivered', paymentMethod: 'pix' }, { status: 'cancelled', paymentMethod: 'cash' }]
  const agg = groupByPayment(orders)
  assert(agg.length === 1, '1 método (cancelado excluído)')
  assert(agg[0].count === 2 && Math.abs(agg[0].percent - 100) < 0.001, 'pix 2 (100%)')
}

// Teste 14: groupByType
console.log('Teste 14: tipo de pedido')
{
  const orders = [{ status: 'delivered', deliveryType: 'pickup' }, { status: 'delivered', deliveryType: 'delivery' }, { status: 'delivered' }]
  const t = groupByType(orders)
  assert(t.pickup === 1 && t.delivery === 2, '1 retirada, 2 entrega')
}

// Teste 15: recentOrders
console.log('Teste 15: recentes')
{
  const orders = [{ createdAt: '2026-11-16T10:00:00Z', id: 'a' }, { createdAt: '2026-11-18T10:00:00Z', id: 'b' }]
  const r = recentOrders(orders, 1)
  assert(r[0].id === 'b', 'mais recente primeiro')
}

// Teste 16: groupRevenueByDay (contíguo)
console.log('Teste 16: faturamento por dia')
{
  const now = new Date('2026-11-18T10:00:00Z')
  const range = getPeriodRange('week', now)
  const orders = [{ status: 'delivered', total: 50, createdAt: '2026-11-16T12:00:00Z' }]
  const days = groupRevenueByDay(orders, range)
  assert(days.length === 7, '7 dias na semana')
  const sum = days.reduce((s, d) => s + d.revenue, 0)
  assert(sum === 50, 'total 50')
}

console.log(`\nResultado: ${passed} passaram, ${failed} falharam`)
if (failed > 0) throw new Error(`${failed} teste(s) falharam`)
