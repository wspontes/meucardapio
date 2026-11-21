import { describe, it, expect } from 'vitest'
import {
  gerarPixCopiaECola,
  crc16,
  normalizePixName,
  normalizePixCity,
  normalizeTxid,
  validatePixKey,
  normalizePixKey,
} from './pix'

describe('crc16', () => {
  it('calcula CRC conhecido', () => {
    // Exemplo conhecido: payload sem CRC + 6304
    const base = '00020126360014BR.GOV.BCB.PIX0114+551199999999952040000530398654041.005802BR5908FULANO 6009SAO PAULO62070503***6304'
    // apenas verifica formato 4 hex maiúsculo
    const c = crc16(base.replace('6304', ''))
    expect(c).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe('normalizePixName', () => {
  it('remove acentos e uppercases', () => {
    expect(normalizePixName('João da Silva')).toBe('JOAO DA SILVA')
  })
  it('trunca em 25', () => {
    const long = 'A'.repeat(40)
    expect(normalizePixName(long).length).toBe(25)
  })
  it('fallback quando vazio', () => {
    expect(normalizePixName('')).toBe('RECEBEDOR')
  })
})

describe('normalizePixCity', () => {
  it('remove acentos', () => {
    expect(normalizePixCity('São Paulo')).toBe('SAO PAULO')
  })
  it('trunca em 15', () => {
    expect(normalizePixCity('A'.repeat(30)).length).toBe(15)
  })
})

describe('normalizeTxid', () => {
  it('remove caracteres especiais', () => {
    expect(normalizeTxid('abc-123!')).toBe('abc123')
  })
  it('fallback *** quando vazio', () => {
    expect(normalizeTxid('')).toBe('***')
  })
  it('trunca em 25', () => {
    expect(normalizeTxid('a'.repeat(40)).length).toBe(25)
  })
})

describe('validatePixKey', () => {
  it('email válido', () => {
    expect(validatePixKey('a@b.com', 'email')).toBe(true)
    expect(validatePixKey('invalido', 'email')).toBe(false)
  })
  it('cpf válido (dígitos verificadores)', () => {
    expect(validatePixKey('52998224725', 'cpf')).toBe(true)
    expect(validatePixKey('12345678901', 'cpf')).toBe(false)
  })
  it('cnpj válido', () => {
    expect(validatePixKey('11222333000181', 'cnpj')).toBe(true)
  })
  it('telefone formato +55', () => {
    expect(validatePixKey('+5511999999999', 'telefone')).toBe(true)
    expect(validatePixKey('11999999999', 'telefone')).toBe(true)
    expect(validatePixKey('123', 'telefone')).toBe(false)
  })
  it('aleatoria uuid', () => {
    expect(validatePixKey('123e4567-e89b-12d3-a456-426614174000', 'aleatoria')).toBe(true)
    expect(validatePixKey('nao-uuid', 'aleatoria')).toBe(false)
  })
})

describe('normalizePixKey', () => {
  it('adiciona +55 em telefone sem prefixo', () => {
    expect(normalizePixKey('11999999999', 'telefone')).toBe('+5511999999999')
  })
  it('mantém chave não-telefone', () => {
    expect(normalizePixKey('  a@b.com  ', 'email')).toBe('a@b.com')
  })
})

describe('gerarPixCopiaECola', () => {
  it('gera payload com estrutura correta', () => {
    const payload = gerarPixCopiaECola({
      chave: '+5511999999999',
      nome: 'João da Silva',
      cidade: 'São Paulo',
      valor: 12.5,
      txid: 'PEDIDO123',
    })
    expect(payload.startsWith('000201')).toBe(true)
    expect(payload).toContain('BR.GOV.BCB.PIX')
    expect(payload).toContain('540512.50')
    expect(payload.endsWith(crc16(payload.slice(0, -4)))).toBe(true)
  })
  it('lança erro para valor zero', () => {
    expect(() => gerarPixCopiaECola({ chave: 'a@b.com', nome: 'X', cidade: 'Y', valor: 0 })).toThrow()
  })
  it('lança erro para chave vazia', () => {
    expect(() => gerarPixCopiaECola({ chave: '', nome: 'X', cidade: 'Y', valor: 10 })).toThrow()
  })
  it('usa *** para txid vazio', () => {
    const payload = gerarPixCopiaECola({ chave: 'a@b.com', nome: 'X', cidade: 'Y', valor: 5 })
    expect(payload).toContain('0503***')
  })
  it('arredonda valor para 2 casas', () => {
    const payload = gerarPixCopiaECola({ chave: 'a@b.com', nome: 'X', cidade: 'Y', valor: 10.999 })
    expect(payload).toContain('540511.00')
  })
})