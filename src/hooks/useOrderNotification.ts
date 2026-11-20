import { useEffect, useRef } from 'react'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCurrentStoreId } from '@/services'
import { useToast } from '@/contexts/ToastContext'
import { useSettings } from './useSettings'
import type { Order } from '@/types'

export function useOrderNotification() {
  const prevIds = useRef<Set<string>>(new Set())
  const initialized = useRef(false)
  const { showToast } = useToast()
  const { settings } = useSettings()
  const notifSettings = settings?.notificationSettings || { enabled: true, sound: 'bell' as const, volume: 0.5 }
  const audioCtxRef = useRef<AudioContext | null>(null)

  const createAudio = () => {
    if (audioCtxRef.current) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new Ctx()
    } catch {
      // Áudio indisponível
    }
  }

  // Aquece áudio na primeira interação do usuário
  useEffect(() => {
    const warm = () => createAudio()
    window.addEventListener('pointerdown', warm, { once: true })
    return () => window.removeEventListener('pointerdown', warm)
  }, [createAudio])

  useEffect(() => {
    const storeId = getCurrentStoreId()
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
      const scoped = storeId ? data.filter((o) => o.storeId === storeId) : data
      const currentIds = new Set(scoped.map((o) => o.id))
      const newIds = [...currentIds].filter((id) => !prevIds.current.has(id))

      // Primeira carga: apenas popula o prevIds, não toca som
      if (!initialized.current) {
        initialized.current = true
        prevIds.current = currentIds
        return
      }

      if (newIds.length > 0 && notifSettings.enabled) {
        // Tenta criar áudio se ainda não existe (fallback para quem não clicou)
        if (!audioCtxRef.current) createAudio()
        playNotificationSound(audioCtxRef.current, notifSettings.sound, notifSettings.volume)
        const newOrders = scoped.filter((o) => newIds.includes(o.id))
        newOrders.forEach((o) => {
          showToast(`Novo pedido de ${o.customerName}!`, 'success')
        })
      }
      prevIds.current = currentIds
    })
    return () => unsub()
  }, [notifSettings.enabled, notifSettings.sound, notifSettings.volume])
}

function playNotificationSound(ctx: AudioContext | null, sound: string, volume: number) {
  try {
    if (!ctx) return
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
