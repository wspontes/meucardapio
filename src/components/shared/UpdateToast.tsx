import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export function UpdateToast() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let refreshing = false

    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          if (!newSW) return
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              setShow(true)
            }
          })
        })
      })
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      }
    }
  }, [])

  if (!show) return null

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
      })
    }
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_0.3s_ease-out] md:bottom-6">
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-surface px-4 py-3 shadow-xl">
        <RefreshCw size={16} className="text-accent shrink-0" />
        <span className="text-sm text-white whitespace-nowrap">Nova versão disponível</span>
        <Button size="sm" onClick={handleUpdate} className="ml-1 h-7 text-xs">
          Atualizar
        </Button>
      </div>
    </div>
  )
}
