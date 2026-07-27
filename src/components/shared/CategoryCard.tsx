import { cn } from '@/utils'
import type { Category } from '@/types'

interface CategoryCardProps {
  category: Category
  active?: boolean
  onClick: (categoryId: string) => void
}

export function CategoryCard({ category, active, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={() => onClick(category.id)}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-muted hover:border-accent/50 hover:text-brand-white'
      )}
    >
      {category.name}
    </button>
  )
}
