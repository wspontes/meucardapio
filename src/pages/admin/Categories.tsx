import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { categoriesService } from '@/services'
import type { Category } from '@/types'
import sortablerjs from 'sortablejs'
import 'sortablejs/Sortable.min.css'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  let sortableInstance: any = null

  const load = async () => {
    try {
      const data = await categoriesService.getAllOrdered()
      setCategories(data)
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const name = newCategory.trim()
    if (!name) return
    const created = await categoriesService.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      order: categories.length + 1,
      active: true,
    })
    setCategories((prev) => [...prev, created])
    setNewCategory('')
  }

  useEffect(() => {
    // Initialize sortable after categories are loaded
    if (!sortableInstance && categories.length > 0 && containerRef.current) {
      sortableInstance = sortablerjs(containerRef.current, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        multiDrag: false,
        dragClass: 'sortable-drag',
        onSort: () => {
          setTimeout(reorderCategories, 150)
        },
        onEnd: () => {
          reorderCategories()
        },
      })
    }

    return () => {
      sortableInstance?.destroy()
    }
  }, [categories.length])

  const reorderCategories = async () => {
    if (!sortableInstance) return
    const orderedIds = sortableInstance.toArray()
    const reordered = orderedIds.map((id: string, index: number) => {
      const category = categories.find((c) => c.id === id)
      if (!category) return null
      return { id: category.id, order: index + 1 }
    }).filter(Boolean) as { id: string; order: number }[]

    await Promise.all(
      reordered.map((cat) => categoriesService.update(cat.id, { order: cat.order }))
    )

    setCategories((prev) =>
      prev.map((cat) => {
        const reorderedCat = reordered.find((r) => r.id === cat.id)
        return reorderedCat ? { ...cat, order: reorderedCat.order } : cat
      })
    )
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const confirmEdit = async () => {
    const name = editingName.trim()
    if (!name || !editingId) return
    await categoriesService.update(editingId, { name })
    setCategories((prev) => prev.map((c) => (c.id === editingId ? { ...c, name } : c)))
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      await categoriesService.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setTimeout(() => {
        sortableInstance?.destroy()
        sortableInstance = null
      }, 100)
    }
  }

  const toggleActive = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    await categoriesService.update(id, { active: !cat.active })
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-brand-white">Categorias</h1>
        <p className="text-xs md:text-sm text-muted mt-0.5">{categories.length} categorias</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-2">
        <Input
          placeholder="Nome da nova categoria"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus size={16} />
          Adicionar
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm md:text-base text-muted">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface">
          <div
            ref={containerRef}
            className="divide-y divide-border space-y-3 pb-3"
            style={{ minHeight: '120px' }}
          >
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface/50 transition-colors hover:bg-surface/80 cursor-grab"
                style={{ alignItems: 'center' }}
              >
                <div className="flex items-center gap-2 min-w-[30px]">
                  {/* Drag handle */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 opacity-70 cursor-grab"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="8" r="3"></circle>
                    <circle cx="16" cy="16" r="3"></circle>
                    <line x1="8" y1="16" x2="16" y2="8"></line>
                  </svg>
                  {/* Position label */}
                  <span className="text-xs text-muted/60">#{index + 1}</span>
                </div>
                <span
                  className="flex-1 min-w-0 text-sm font-medium text-brand-white truncate"
                >
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}