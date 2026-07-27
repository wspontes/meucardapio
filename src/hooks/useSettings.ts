import { useState, useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from '@/services'
import type { BusinessSettings } from '@/services/settings'

export function useSettings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelled = false

    function subscribe() {
      if (cancelled) return
      const storeId = getCurrentStoreId()
      if (!storeId) {
        retryRef.current = setTimeout(subscribe, 100)
        return
      }

      unsub = onSnapshot(doc(db, 'settings', storeId), (snap) => {
        if (cancelled) return
        setSettings(snap.exists() ? (snap.data() as BusinessSettings) : null)
        setLoading(false)
      }, () => {
        if (!cancelled) setLoading(false)
      })
    }

    subscribe()

    return () => {
      cancelled = true
      if (retryRef.current) clearTimeout(retryRef.current)
      if (unsub) unsub()
    }
  }, [])

  return { settings, loading }
}
