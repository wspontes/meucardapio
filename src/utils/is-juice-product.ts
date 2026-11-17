/**
 * Detecta se um produto é do tipo suco/jarra com base no nome.
 * Produtos cujos nomes contenham "suco" ou "jarra" abrem o modal de seleção.
 */
export function isJuiceProduct(productName: string): boolean {
  const name = productName.toLowerCase()
  return name.includes('suco') || name.includes('jarra')
}
