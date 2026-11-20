import { getStoreStatus } from './storeStatus'
import type { BusinessHoursLike } from './storeStatus'

const hours: BusinessHoursLike[] = [
  { dayOfWeek: 0, open: '18:00', close: '22:00', closed: true }, // dom fechado
  { dayOfWeek: 1, open: '17:30', close: '00:00', closed: false }, // seg
  { dayOfWeek: 2, open: '17:30', close: '00:00', closed: false },
  { dayOfWeek: 3, open: '17:30', close: '00:00', closed: false },
  { dayOfWeek: 4, open: '17:30', close: '00:00', closed: false },
  { dayOfWeek: 5, open: '17:30', close: '01:00', closed: false }, // sex overnight
  { dayOfWeek: 6, open: '11:30', close: '01:00', closed: false }, // sab overnight
]

function makeDate(iso: string): Date {
  return new Date(iso)
}

let passed = 0
let failed = 0
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log('  ✓', msg) }
  else { failed++; console.error('  ✗', msg) }
}

console.log('Teste 1: aberto (segunda 19:00 SP)')
{
  // 2026-11-16 é segunda-feira. 19:00 SP = 22:00 UTC
  const s = getStoreStatus(hours, makeDate('2026-11-16T22:00:00Z'))
  assert(s.isOpen === true, 'isOpen true')
  assert(s.label === 'Aberto agora · fecha às 0h', `label = "${s.label}"`)
}

console.log('Teste 2: fechado antes de abrir (segunda 10:00 SP)')
{
  const s = getStoreStatus(hours, makeDate('2026-11-16T13:00:00Z'))
  assert(s.isOpen === false, 'isOpen false')
  assert(s.label === 'Fechado agora · abre hoje às 17h30', `label = "${s.label}"`)
}

console.log('Teste 3: fechado após fechar, abre amanhã')
{
  // segunda fecha às 22:00; às 23:00 está fechado, abre terça (amanhã) às 17h30
  const h = [
    { dayOfWeek: 1, open: '17:30', close: '22:00', closed: false },
    { dayOfWeek: 2, open: '17:30', close: '00:00', closed: false },
  ]
  const s = getStoreStatus(h, makeDate('2026-11-16T22:00:00Z')) // seg 19:00? no - 22:00 UTC = 19:00 SP, ainda aberto. Use 01:00 UTC dia 17 = seg 22:00 SP
  const s2 = getStoreStatus(h, makeDate('2026-11-17T01:00:00Z')) // seg 22:00 SP
  assert(s2.isOpen === false, 'isOpen false')
  assert(s2.label === 'Fechado agora · abre amanhã às 17h30', `label = "${s2.label}"`)
}

console.log('Teste 4: turno overnight (sexta 23:30 SP → sábado 00:30 SP ainda aberto)')
{
  // sexta 23:30 SP = sábado 02:30 UTC
  const s = getStoreStatus(hours, makeDate('2026-11-21T02:30:00Z'))
  assert(s.isOpen === true, 'isOpen true (overnight)')
  assert(s.label === 'Aberto agora · fecha às 1h', `label = "${s.label}"`)
}

console.log('Teste 5: domingo fechado, próximo abre segunda (amanhã)')
{
  // domingo 12:00 SP = 15:00 UTC
  const s = getStoreStatus(hours, makeDate('2026-11-15T15:00:00Z'))
  assert(s.isOpen === false, 'isOpen false')
  assert(s.label === 'Fechado agora · abre amanhã às 17h30', `label = "${s.label}"`)
}

console.log('Teste 5b: sábado fechado, próximo abre segunda (mais distante)')
{
  const h = [
    { dayOfWeek: 6, open: '11:30', close: '01:00', closed: true },
    { dayOfWeek: 1, open: '17:30', close: '00:00', closed: false },
  ]
  // sábado 12:00 SP = 15:00 UTC
  const s = getStoreStatus(h, makeDate('2026-11-14T15:00:00Z'))
  assert(s.isOpen === false, 'isOpen false')
  assert(s.label === 'Fechado agora · abre segunda às 17h30', `label = "${s.label}"`)
}

console.log('Teste 6: sexta à noite (sexta 20:00 SP)')
{
  const s = getStoreStatus(hours, makeDate('2026-11-20T23:00:00Z'))
  assert(s.isOpen === true, 'isOpen true')
  assert(s.label === 'Aberto agora · fecha às 1h', `label = "${s.label}"`)
}

console.log('Teste 7: sem horário configurado → não exibir')
{
  const s = getStoreStatus([], makeDate('2026-11-16T22:00:00Z'))
  assert(s.label === '', `label vazio = "${s.label}"`)
}

console.log('Teste 8: fechamento 00:00 (segunda 23:30 dentro do turno)')
{
  const h2 = [{ dayOfWeek: 1, open: '18:00', close: '00:00', closed: false }]
  const s = getStoreStatus(h2, makeDate('2026-11-16T22:30:00Z')) // seg 19:30 SP
  assert(s.isOpen === true, 'isOpen true')
  assert(s.label === 'Aberto agora · fecha às 0h', `label = "${s.label}"`)
}

console.log(`\nResultado: ${passed} passaram, ${failed} falharam`)
if (failed > 0) throw new Error(`${failed} teste(s) falharam`)
