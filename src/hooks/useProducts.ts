import { useState, useEffect } from 'react'
import { productsService } from '@/services'
import type { Product } from '@/types'

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts(categoryId?: string): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const all = await productsService.getActiveProducts()
        const filtered = categoryId
          ? all.filter((p) => p.categoryId === categoryId)
          : all
        if (mounted) {
          setProducts(filtered)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [categoryId])

  return { products, loading, error }
}

export function useFeaturedProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const all = await productsService.getActiveProducts()
        const featured = all.filter((p) => p.featured || p.section === 'featured').slice(0, 8)
        if (mounted) {
          setProducts(featured)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [])

  return { products, loading, error }
}

export function useSectionProducts(section: 'featured' | 'new' | 'promotion', limit = 8): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const all = await productsService.getActiveProducts()
        const filtered = all.filter((p) => p.section === section).slice(0, limit)
        if (mounted) {
          setProducts(filtered)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [section, limit])

  return { products, loading, error }
}
