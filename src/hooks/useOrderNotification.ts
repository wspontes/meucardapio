import { useEffect, useRef } from 'react'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useToast } from '@/contexts/ToastContext'
import { useSettings } from './useSettings'
import type { Order } from '@/types'

export function useOrderNotification() {
  const prevIds = useRef<Set<string>>(new Set())
  const { showToast } = useToast()
  const { settings } = useSettings()
  const notifSettings = settings?.notificationSettings || { enabled: true, sound: 'bell' as const, volume: 0.5 }

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      const currentIds = new Set(data.map((o) => o.id))
      const newIds = [...currentIds].filter((id) => !prevIds.current.has(id))
      if (prevIds.current.size > 0 && newIds.length > 0 && notifSettings.enabled) {
        playNotificationSound(notifSettings.sound, notifSettings.volume)
        const newOrders = data.filter((o) => newIds.includes(o.id))
        newOrders.forEach((o) => {
          showToast(`Novo pedido de ${o.customerName}!`, 'success')
        })
      }
      prevIds.current = currentIds
    })
    return () => unsub()
  }, [notifSettings.enabled, notifSettings.sound, notifSettings.volume])
}

function playNotificationSound(sound: string, volume: number) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(volume, ctx.currentTime)

    if (sound === 'bell') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else if (sound === 'chime') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } else if (sound === 'buzzer') {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 220
      osc.connect(gain)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.6)
    } else {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 800
      osc.connect(gain)
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    }
  } catch {
    //
  }
}
