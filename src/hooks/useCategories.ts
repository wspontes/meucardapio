import { useState, useEffect } from 'react'
import { categoriesService } from '@/services'
import type { Category } from '@/types'

interface UseCategoriesResult {
  categories: Category[]
  loading: boolean
  error: string | null
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetch() {
      try {
        setLoading(true)
        const data = await categoriesService.getAllOrdered()
        if (mounted) {
          setCategories(data.filter((c) => c.active))
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [])

  return { categories, loading, error }
}
