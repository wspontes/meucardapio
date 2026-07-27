import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { compressImage } from '@/utils/compressImage'
import { resolveImageUrl } from '@/utils/resolveImageUrl'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  label?: string
  maxSize?: number
}

export function ImageUpload({ value, onChange, label = 'Imagem', maxSize = 200 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const dataUrl = await compressImage(file, 800, 800, 0.7)
      const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024)
      if (sizeKB > maxSize * 1.5) {
        const compressed = await compressImage(file, 600, 600, 0.5)
        onChange(compressed)
      } else {
        onChange(dataUrl)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-white">{label}</label>
      <div className="flex gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-hover p-4 transition-colors hover:border-accent/50 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload size={20} className="text-muted" />
          <p className="text-xs text-muted text-center">
            {loading ? 'Comprimindo...' : 'Clique ou arraste uma imagem'}
          </p>
          <p className="text-[10px] text-muted/60">JPG, PNG — máx. {maxSize}KB</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }} />
        {value && (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border">
            <img src={resolveImageUrl(value)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
