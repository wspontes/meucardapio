export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export interface PixData {
  chave: string
  nome: string
  cidade: string
  valor: number
  txid?: string
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizePixName(name: string): string {
  const cleaned = stripAccents(name).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()
  return (cleaned || 'RECEBEDOR').slice(0, 25)
}

export function normalizePixCity(city: string): string {
  const cleaned = stripAccents(city).toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim()
  return (cleaned || 'BRASIL').slice(0, 15)
}

export function normalizeTxid(txid: string): string {
  const cleaned = txid.replace(/[^A-Za-z0-9]/g, '')
  return cleaned ? cleaned.slice(0, 25) : '***'
}

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, '0') + value
}

export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xffff
      else crc = (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function gerarPixCopiaECola(data: PixData): string {
  const { chave, nome, cidade, valor, txid } = data
  if (!chave || !chave.trim()) throw new Error('Chave Pix inválida')
  if (!Number.isFinite(valor) || valor <= 0) throw new Error('Valor inválido')
  const rounded = Math.round(valor * 100) / 100

  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', chave.trim())
  const txidField = tlv('05', normalizeTxid(txid || ''))

  let payload = ''
  payload += tlv('00', '01')
  payload += tlv('01', '12')
  payload += tlv('26', merchantAccount)
  payload += tlv('52', '0000')
  payload += tlv('53', '986')
  payload += tlv('54', rounded.toFixed(2))
  payload += tlv('58', 'BR')
  payload += tlv('59', normalizePixName(nome))
  payload += tlv('60', normalizePixCity(cidade))
  payload += tlv('62', txidField)
  payload += '6304'
  payload += crc16(payload)
  return payload
}

// ---------- Validações de chave ----------

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function validCpf(cpf: string): boolean {
  const d = onlyDigits(cpf)
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(d[10])
}

function validCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj)
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  if (calc(12) !== parseInt(d[12])) return false
  if (calc(13) !== parseInt(d[13])) return false
  return true
}

export function validatePixKey(key: string, type: PixKeyType): boolean {
  const k = key.trim()
  if (!k) return false
  switch (type) {
    case 'cpf':
      return validCpf(k)
    case 'cnpj':
      return validCnpj(k)
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)
    case 'telefone': {
      const d = onlyDigits(k)
      if (k.startsWith('+')) {
        if (!k.startsWith('+55')) return false
        const rest = onlyDigits(k.slice(3))
        return rest.length === 10 || rest.length === 11
      }
      // aceita DDD+número (10 ou 11 dígitos) sem +55
      return d.length === 10 || d.length === 11
    }
    case 'aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)
    default:
      return false
  }
}

export function normalizePixKey(key: string, type: PixKeyType): string {
  const k = key.trim()
  if (type === 'telefone' && !k.startsWith('+')) {
    const d = onlyDigits(k)
    if (d.startsWith('55')) return '+' + d
    return '+55' + d
  }
  return k
}